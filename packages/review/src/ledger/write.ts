/**
 * Die Dateischicht des Schreibwegs. Sie tut genau drei Dinge, die der reine Kern nicht kann:
 * die richtige Katalogdatei wählen, atomar schreiben und das Ergebnis nachlesen.
 *
 * Atomar heißt hier wie in `packages/cli/src/commands/visual-proof.ts`: temporäre Datei im selben
 * Verzeichnis, `fsync`, `rename`. Ein abgebrochener Schreibvorgang lässt den Ledger dadurch
 * unverändert statt halb beschrieben — ein halb geschriebener Ledger wäre eine Katalogdatei, die
 * nicht mehr typprüft, und die Arbeit einer ganzen Reviewsitzung stünde in Frage.
 */
import { randomBytes } from 'node:crypto';
import {
  closeSync,
  constants,
  fsyncSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import * as ts from 'typescript';
import type { ReviewStatus } from '@einsatzzeichen/schema';
import type { CarrierKind, CarrierRef, ReviewValue, ReviewerRecord } from '../contract.js';
import { findConstantObjectLiteral, findDirectProperty, parseLedgerSource } from './ast.js';
import {
  REVIEWER_REGISTER_CONSTANT,
  insertReviewerSource,
  rewriteLedgerSource,
} from './rewrite.js';

/** Alle drei Fachreview-Ledger stehen in derselben Datei; die Trägerart wählt die Konstante. */
const DOMAIN_REVIEWS_PATH = ['packages', 'catalog', 'src', 'domain-reviews.ts'];
const DOMAIN_REVIEWERS_PATH = ['packages', 'catalog', 'src', 'domain-reviewers.ts'];

/**
 * Welche Ledgerkonstante zu welcher Trägerart gehört. Fail-closed adressiert: ein Manifestschlüssel
 * darf nie in den Quellen-Ledger geschrieben werden, auch wenn er dort zufällig passte.
 */
export const LEDGER_CONSTANTS: Record<CarrierKind, string> = {
  manifest: 'MANIFEST_DOMAIN_REVIEWS',
  source: 'SOURCE_DOMAIN_REVIEWS',
  profile: 'PROFILE_DOMAIN_REVIEWS',
};

const REVIEW_FIELDS: readonly string[] = ['status', 'reviewer', 'date', 'note'];

/**
 * Schreibt genau **einen** Fachreview-Eintrag in `packages/catalog/src/domain-reviews.ts` und
 * liest ihn anschließend aus der geschriebenen Datei zurück. Steht dort nicht genau der
 * beabsichtigte Wert, wirft die Funktion — die Oberfläche darf einen Schreibvorgang nur dann als
 * erfolgt melden, wenn er nachweislich erfolgt ist.
 */
export function writeDomainReview(repoRoot: string, ref: CarrierRef, review: ReviewValue): void {
  const constantName = LEDGER_CONSTANTS[ref.kind];
  if (constantName === undefined) {
    throw new Error(`Unbekannte Trägerart "${ref.kind}"; es wird nichts geschrieben.`);
  }

  const file = join(repoRoot, ...DOMAIN_REVIEWS_PATH);
  const source = readFileSync(file, 'utf8');
  // Vorprüfung gegen genau den Ledger, den die Trägerart benennt. `rewriteLedgerSource` sucht den
  // Schlüssel dateiweit; erst diese Prüfung stellt sicher, dass er auch im richtigen Ledger steht.
  readLedgerReview(source, file, constantName, ref.key);

  writeFileAtomically(file, rewriteLedgerSource(source, ref.key, review));

  const written = readLedgerReview(readFileSync(file, 'utf8'), file, constantName, ref.key);
  const intended = normalizeReview(review);
  if (JSON.stringify(written) !== JSON.stringify(intended)) {
    throw new Error(
      `Nachprüfung fehlgeschlagen: im Ledger "${constantName}" steht für "${ref.key}" ` +
        `${JSON.stringify(written)} statt ${JSON.stringify(intended)}.`,
    );
  }
}

/**
 * Trägt einen Fachprüfer in `packages/catalog/src/domain-reviewers.ts` ein. Ohne Registereintrag
 * verweigert das Werkzeug jede Freigabe; deshalb ist das Anlegen ein eigener, ebenso sorgfältig
 * nachgeprüfter Schreibvorgang.
 */
export function addReviewer(repoRoot: string, record: ReviewerRecord): void {
  const file = join(repoRoot, ...DOMAIN_REVIEWERS_PATH);
  const source = readFileSync(file, 'utf8');

  writeFileAtomically(file, insertReviewerSource(source, record));

  const written = readReviewerRecord(readFileSync(file, 'utf8'), file, record.id);
  const intended = { id: record.id, name: record.name, qualification: record.qualification };
  if (JSON.stringify(written) !== JSON.stringify(intended)) {
    throw new Error(
      `Nachprüfung fehlgeschlagen: im Reviewer-Register steht für "${record.id}" ` +
        `${JSON.stringify(written)} statt ${JSON.stringify(intended)}.`,
    );
  }
}

/** Liest einen Ledgereintrag zurück — bewusst über denselben Parser, nicht über einen Import. */
function readLedgerReview(
  source: string,
  fileName: string,
  constantName: string,
  key: string,
): ReviewValue {
  const literal = objectLiteralEntry(source, fileName, constantName, key);
  const review: Record<string, string | undefined> = {};
  for (const property of literal.properties) {
    const [name, value] = readStringProperty(property, fileName, key);
    if (!REVIEW_FIELDS.includes(name)) {
      throw new Error(`Der Ledgereintrag "${key}" in "${fileName}" trägt das Feld "${name}".`);
    }
    review[name] = value;
  }
  const status = review['status'];
  if (status === undefined) {
    throw new Error(`Dem Ledgereintrag "${key}" in "${fileName}" fehlt der Status.`);
  }
  return normalizeReview({
    status: status as ReviewStatus,
    reviewer: review['reviewer'],
    date: review['date'],
    note: review['note'],
  });
}

/** Liest einen Registereintrag zurück. */
function readReviewerRecord(source: string, fileName: string, id: string): ReviewerRecord {
  const literal = objectLiteralEntry(source, fileName, REVIEWER_REGISTER_CONSTANT, id);
  const fields: Record<string, string | undefined> = {};
  for (const property of literal.properties) {
    const [name, value] = readStringProperty(property, fileName, id);
    fields[name] = value;
  }
  const { id: writtenId, name, qualification } = fields;
  if (writtenId === undefined || name === undefined || qualification === undefined) {
    throw new Error(
      `Dem Registereintrag "${id}" in "${fileName}" fehlt eines der Felder id, name, ` +
        'qualification.',
    );
  }
  return { id: writtenId, name, qualification };
}

function objectLiteralEntry(
  source: string,
  fileName: string,
  constantName: string,
  key: string,
): ts.ObjectLiteralExpression {
  const sourceFile = parseLedgerSource(source, fileName);
  const ledger = findConstantObjectLiteral(sourceFile, constantName);
  const property = findDirectProperty(ledger, key);
  if (property === undefined) {
    throw new Error(`Der Ledger "${constantName}" in "${fileName}" führt keinen Eintrag "${key}".`);
  }
  if (!ts.isObjectLiteralExpression(property.initializer)) {
    throw new Error(`Der Eintrag "${key}" in "${fileName}" ist kein Objektliteral.`);
  }
  return property.initializer;
}

function readStringProperty(
  property: ts.ObjectLiteralElementLike,
  fileName: string,
  key: string,
): [string, string] {
  if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) {
    throw new Error(`Der Eintrag "${key}" in "${fileName}" hat eine unlesbare Eigenschaft.`);
  }
  if (!ts.isStringLiteralLike(property.initializer)) {
    throw new Error(
      `Das Feld "${property.name.text}" des Eintrags "${key}" in "${fileName}" ist keine ` +
        'Zeichenkette.',
    );
  }
  return [property.name.text, property.initializer.text];
}

/** Streicht nicht gesetzte Felder, damit Vergleich und Ausgabe dieselbe Gestalt haben. */
function normalizeReview(review: ReviewValue): ReviewValue {
  const normalized: ReviewValue = { status: review.status };
  if (review.reviewer !== undefined) normalized.reviewer = review.reviewer;
  if (review.date !== undefined) normalized.date = review.date;
  if (review.note !== undefined) normalized.note = review.note;
  return normalized;
}

function isErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === code
  );
}

/**
 * Temporäre Datei im Zielverzeichnis, `fsync`, `rename`. `O_EXCL | O_NOFOLLOW` verhindert, dass
 * ein untergeschobener Name oder Symlink das Ziel des Schreibvorgangs verändert; scheitert
 * irgendetwas davor, wird die temporäre Datei entfernt und der Ledger bleibt, wie er war.
 */
function writeFileAtomically(destination: string, contents: string): void {
  const temporary = join(
    dirname(destination),
    `.${basename(destination)}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`,
  );
  let descriptor: number | undefined;
  let renamed = false;
  try {
    descriptor = openSync(
      temporary,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      0o644,
    );
    writeFileSync(descriptor, contents, 'utf8');
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, destination);
    renamed = true;
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    if (!renamed) {
      try {
        unlinkSync(temporary);
      } catch (error) {
        if (!isErrorWithCode(error, 'ENOENT')) throw error;
      }
    }
  }
}
