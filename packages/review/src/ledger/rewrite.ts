/**
 * Der reine Kern des Schreibwegs: Quelltext rein, Quelltext raus, kein Dateisystem. Beide
 * Funktionen ersetzen ausschließlich **einen** zusammenhängenden Textbereich und lassen alles
 * übrige Zeichen für Zeichen stehen.
 *
 * Warum nicht die Datei neu drucken: in den Ledgern stehen die Fachfragen-IDs als Kommentare
 * zwischen den Einträgen (`Q-…`, siehe `domain-review-questions.ts`). Ein vollständiger Neudruck
 * über `ts.createPrinter` würde sie verlieren, und mit ihnen die Herleitung, warum eine Zeile
 * offen ist. Ein textueller Bereichsersatz erhält Kommentare, Reihenfolge und Einrückung; jede
 * Freigabe wird dadurch zu einem einzeiligen, lesbaren Git-Diff.
 */
import * as ts from 'typescript';
import type { ReviewValue, ReviewerRecord } from '../contract.js';
import {
  findConstantObjectLiteral,
  findDirectProperty,
  parseLedgerSource,
  propertyNameText,
} from './ast.js';
import {
  INDENT_STEP,
  columnAt,
  lineIndentAt,
  printObjectLiteral,
  quoteString,
  type PrintedField,
} from './format.js';

/** Der Name der Konstante, die das Reviewer-Register trägt. */
export const REVIEWER_REGISTER_CONSTANT = 'DOMAIN_REVIEWERS';

/**
 * Die zulässigen Statuswerte, zur Laufzeit geprüft. Der Typ allein genügt nicht: der Wert kommt
 * über HTTP aus dem Browser, und ein unbekannter Status würde eine Katalogdatei erzeugen, die
 * nicht mehr typprüft.
 */
const REVIEW_STATUSES: readonly string[] = ['pending', 'approved', 'deviation'];

/**
 * Ersetzt im Quelltext eines Ledgers den Initialisierer der Property `key` durch `review`.
 * Alles ausserhalb dieses einen Textbereichs bleibt Zeichen für Zeichen unverändert.
 */
export function rewriteLedgerSource(source: string, key: string, review: ReviewValue): string {
  if (!REVIEW_STATUSES.includes(review.status)) {
    throw new Error(
      `Unbekannter Reviewstatus "${review.status}"; zulässig sind ` +
        `${REVIEW_STATUSES.join(', ')}.`,
    );
  }

  const sourceFile = parseLedgerSource(source, 'ledger.ts');
  const property = findUniquePropertyAssignment(sourceFile, key);
  const initializer = property.initializer;
  if (!ts.isObjectLiteralExpression(initializer)) {
    throw new Error(
      `Der Ledger-Eintrag "${key}" ist kein Objektliteral, sondern ` +
        `${ts.SyntaxKind[initializer.kind]}; der Ledger wird nicht verändert.`,
    );
  }

  const start = initializer.getStart(sourceFile);
  const indent = lineIndentAt(source, property.getStart(sourceFile));
  const literal = printObjectLiteral(reviewFields(review), indent, columnAt(source, start));
  return source.slice(0, start) + literal + source.slice(initializer.getEnd());
}

/**
 * Fügt `record` in das Reviewer-Register ein. Der neue Eintrag kommt ans Ende des Literals; die
 * vorhandenen Einträge und die erklärenden Kommentare darüber bleiben unangetastet.
 */
export function insertReviewerSource(source: string, record: ReviewerRecord): string {
  for (const [field, value] of Object.entries(record)) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(
        `Das Feld "${field}" des Reviewer-Eintrags ist leer; ein Register ohne Kennung, Namen ` +
          'und Qualifikation macht eine Freigabe nicht zurechenbar.',
      );
    }
  }

  const sourceFile = parseLedgerSource(source, 'domain-reviewers.ts');
  const literal = findConstantObjectLiteral(sourceFile, REVIEWER_REGISTER_CONSTANT);
  if (findDirectProperty(literal, record.id) !== undefined) {
    throw new Error(
      `Die Kennung "${record.id}" ist im Reviewer-Register bereits vergeben; ` +
        'ein zweiter Eintrag würde die Zurechnung mehrdeutig machen.',
    );
  }

  const literalStart = literal.getStart(sourceFile);
  const outerIndent = lineIndentAt(source, literalStart);
  const entryIndent = outerIndent + INDENT_STEP;
  const quotedId = quoteString(record.id);
  const value = printObjectLiteral(
    [
      { name: 'id', value: quotedId },
      { name: 'name', value: quoteString(record.name) },
      { name: 'qualification', value: quoteString(record.qualification) },
    ],
    entryIndent,
    entryIndent.length + quotedId.length + 2,
  );
  const entry = `${entryIndent}${quotedId}: ${value},`;

  const properties = literal.properties;
  const lastProperty = properties[properties.length - 1];
  if (lastProperty === undefined) {
    // Leeres Register: der Bereich zwischen den Klammern wird durch die erste Zeile ersetzt.
    const openBraceEnd = literalStart + 1;
    const closeBraceStart = literal.getEnd() - 1;
    return `${source.slice(0, openBraceEnd)}\n${entry}\n${outerIndent}${source.slice(closeBraceStart)}`;
  }

  // Hinter den letzten Eintrag, hinter dessen hängendes Komma; fehlt es, wird eines gesetzt.
  let insertAt = lastProperty.getEnd();
  const trailingComma = /^[\t ]*,/.exec(source.slice(insertAt));
  const missingComma = trailingComma === null ? ',' : '';
  if (trailingComma !== null) insertAt += trailingComma[0].length;
  return `${source.slice(0, insertAt)}${missingComma}\n${entry}${source.slice(insertAt)}`;
}

/**
 * Sucht `key` im gesamten Quelltext und besteht auf Eindeutigkeit. Fail-closed in beide
 * Richtungen: kein Treffer heißt, dass der Träger keinen Ledgerplatz hat (dann darf auch keiner
 * entstehen), mehrere Treffer heißen, dass nicht entscheidbar ist, welcher gemeint war.
 */
function findUniquePropertyAssignment(
  sourceFile: ts.SourceFile,
  key: string,
): ts.PropertyAssignment {
  const matches: ts.PropertyAssignment[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAssignment(node) && propertyNameText(node.name) === key) matches.push(node);
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);

  const first = matches[0];
  if (first === undefined) {
    throw new Error(
      `Der Schlüssel "${key}" hat keinen Ledgerplatz; der Ledger wird nicht verändert.`,
    );
  }
  if (matches.length > 1) {
    throw new Error(
      `Der Schlüssel "${key}" kommt ${matches.length}-mal im Ledger vor; die Zuordnung ist ` +
        'nicht eindeutig, es wird nichts geschrieben.',
    );
  }
  return first;
}

/**
 * Die Felder in der Reihenfolge der Katalogdateien. Nicht gesetzte Felder fehlen ganz statt als
 * `undefined` dazustehen: `reviewIssues()` unterscheidet beides nicht, ein Leser schon.
 */
function reviewFields(review: ReviewValue): PrintedField[] {
  const fields: PrintedField[] = [{ name: 'status', value: quoteString(review.status) }];
  if (review.reviewer !== undefined) {
    fields.push({ name: 'reviewer', value: quoteString(review.reviewer) });
  }
  if (review.date !== undefined) fields.push({ name: 'date', value: quoteString(review.date) });
  if (review.note !== undefined) fields.push({ name: 'note', value: quoteString(review.note) });
  return fields;
}
