import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addReviewer, writeDomainReview } from './write.js';

const CATALOG_SOURCE_DIR = fileURLToPath(new URL('../../../catalog/src/', import.meta.url));

let repoRoot: string;

/** Das Zielverzeichnis ist eine Kopie der echten Katalogdateien — kein vereinfachtes Fixture. */
function catalogFile(name: string): string {
  return join(repoRoot, 'packages', 'catalog', 'src', name);
}

/**
 * Das Reviewer-Register als Fixture. **Nur für den Registerteil**, und aus demselben Grund wie in
 * `rewrite.test.ts`: die Aussage „der erste Prüfer wird eingetragen" ist am Realbestand eine
 * Aussage über den heutigen Registerstand, und der erste echte Eintrag hätte sie rot gefärbt.
 * Der Ledgerteil unten arbeitet weiter auf der Kopie der echten Datei.
 */
const REGISTER_FIXTURE = `import { deepFreeze, type DeepReadonly } from './readonly-data.js';

export interface DomainReviewer {
  id: string;
  name: string;
  qualification: string;
}

/** Register der Fachprüfer. */
export const DOMAIN_REVIEWERS: DeepReadonly<Record<string, DomainReviewer>> = deepFreeze(
  {} satisfies Record<string, DomainReviewer>,
);
`;

/** Derselbe Aufbau, aber mit einem bereits eingetragenen Prüfer. */
const REGISTER_FIXTURE_GEFUELLT = REGISTER_FIXTURE.replace(
  '  {} satisfies Record<string, DomainReviewer>,',
  [
    '  {',
    "    'aerst': { id: 'aerst', name: 'Anna Erst', qualification: 'Zugführerin' },",
    '  } satisfies Record<string, DomainReviewer>,',
  ].join('\n'),
);

/** Ersetzt die kopierte Registerdatei durch ein Fixture mit bekanntem Ausgangszustand. */
function setzeRegister(source: string): void {
  writeFileSync(catalogFile('domain-reviewers.ts'), source, 'utf8');
}

beforeEach(() => {
  repoRoot = mkdtempSync(join(tmpdir(), 'einsatzzeichen-review-'));
  const target = join(repoRoot, 'packages', 'catalog', 'src');
  mkdirSync(target, { recursive: true });
  for (const name of ['domain-reviews.ts', 'domain-reviewers.ts']) {
    copyFileSync(join(CATALOG_SOURCE_DIR, name), join(target, name));
  }
});

afterEach(() => {
  rmSync(repoRoot, { recursive: true, force: true });
});

describe('writeDomainReview', () => {
  it('schreibt eine Manifestfreigabe und ändert genau eine Zeile', () => {
    // Ausgangszustand im Wegwerf-Klon selbst herstellen: der Test vergleicht gegen die einzeilige
    // `pending`-Form und würde sonst voraussetzen, dass diese Zeile im echten Ledger noch offen
    // ist — eine Aussage über den Reviewstand, die die erste Freigabe von 1.1 rot färbte.
    writeDomainReview(repoRoot, { kind: 'manifest', key: 'bbk-babz-2025:1.1#primary' }, {
      status: 'pending',
    });
    const vorher = readFileSync(catalogFile('domain-reviews.ts'), 'utf8');

    writeDomainReview(
      repoRoot,
      { kind: 'manifest', key: 'bbk-babz-2025:1.1#primary' },
      {
        status: 'approved',
        reviewer: 'Max Mustermann',
        date: '2026-09-03',
        note: 'Deckt sich mit BABZ 1.1.',
      },
    );

    // Der Vergleich gegen ein gezieltes `replace` zeigt, dass wirklich nur diese eine Zeile
    // ersetzt wurde — Kommentare, Reihenfolge und alle 543 übrigen Einträge stehen unverändert.
    expect(readFileSync(catalogFile('domain-reviews.ts'), 'utf8')).toBe(
      vorher.replace(
        "  'bbk-babz-2025:1.1#primary': { status: 'pending' },",
        [
          "  'bbk-babz-2025:1.1#primary': {",
          "    status: 'approved',",
          "    reviewer: 'Max Mustermann',",
          "    date: '2026-09-03',",
          "    note: 'Deckt sich mit BABZ 1.1.',",
          '  },',
        ].join('\n'),
      ),
    );
  });

  it('trifft für Quellen und Profile den jeweils zuständigen Ledger', () => {
    writeDomainReview(
      repoRoot,
      { kind: 'source', key: 'phjardas-tz' },
      { status: 'deviation', reviewer: 'Max Mustermann', date: '2026-09-03', note: 'Geometrie weicht ab.' },
    );
    writeDomainReview(
      repoRoot,
      { kind: 'profile', key: 'bund' },
      { status: 'approved', reviewer: 'Max Mustermann', date: '2026-09-03', note: 'Bundeskern.' },
    );

    const nachher = readFileSync(catalogFile('domain-reviews.ts'), 'utf8');
    expect(nachher).toContain("  'phjardas-tz': {\n    status: 'deviation',");
    expect(nachher).toContain(
      "  bund: { status: 'approved', reviewer: 'Max Mustermann', date: '2026-09-03', " +
        "note: 'Bundeskern.' },",
    );
  });

  it('weist einen Schlüssel ab, der nicht zum Ledger der Trägerart gehört', () => {
    const vorher = readFileSync(catalogFile('domain-reviews.ts'), 'utf8');

    expect(() =>
      writeDomainReview(
        repoRoot,
        // Der Schlüssel existiert — aber im Manifestledger, nicht im Quellenledger.
        { kind: 'source', key: 'bbk-babz-2025:1.1#primary' },
        { status: 'approved', reviewer: 'A', date: '2026-09-03', note: 'B' },
      ),
    ).toThrow(/SOURCE_DOMAIN_REVIEWS/);

    expect(readFileSync(catalogFile('domain-reviews.ts'), 'utf8')).toBe(vorher);
  });

  it('lässt den Ledger bei einem unbekannten Schlüssel unverändert', () => {
    const vorher = readFileSync(catalogFile('domain-reviews.ts'), 'utf8');

    expect(() =>
      writeDomainReview(repoRoot, { kind: 'manifest', key: 'bbk-babz-2025:9.9#primary' }, {
        status: 'approved',
      }),
    ).toThrow(/9\.9/);

    expect(readFileSync(catalogFile('domain-reviews.ts'), 'utf8')).toBe(vorher);
  });

  it('hinterlässt keine temporäre Datei', () => {
    writeDomainReview(repoRoot, { kind: 'manifest', key: 'bbk-babz-2025:1.1#primary' }, {
      status: 'pending',
    });

    expect(readdirSync(join(repoRoot, 'packages', 'catalog', 'src')).sort()).toEqual([
      'domain-reviewers.ts',
      'domain-reviews.ts',
    ]);
  });
});

describe('addReviewer', () => {
  it('trägt in ein leeres Register den ersten Prüfer ein und liest ihn zurück', () => {
    // Ausgangszustand aus dem Fixture statt aus der echten Datei: „leeres Register" ist eine
    // Eigenschaft dieses Testfalls, nicht des Katalogs. Früher hing der Test an der echten
    // Datei und wäre mit dem ersten dort eingetragenen Prüfer rot geworden.
    setzeRegister(REGISTER_FIXTURE);

    addReviewer(repoRoot, {
      id: 'mmustermann',
      name: 'Max Mustermann',
      qualification: 'Zugführer, Fachberater Einsatztaktik',
    });

    const nachher = readFileSync(catalogFile('domain-reviewers.ts'), 'utf8');
    expect(nachher).toContain("      name: 'Max Mustermann',");
    // Der erklärende Kommentar über der Konstante überlebt den Schreibvorgang.
    expect(nachher).toContain('Register der Fachprüfer');
  });

  it('hängt an ein bereits gefülltes Register an, ohne den vorhandenen Eintrag zu verlieren', () => {
    // Der zweite Fall: ab dem zweiten Prüfer läuft jedes Eintragen über den Anfüge-Zweig, und
    // die Nachprüfung in `addReviewer` muss auch dann den richtigen Eintrag zurücklesen.
    setzeRegister(REGISTER_FIXTURE_GEFUELLT);

    addReviewer(repoRoot, { id: 'bzweit', name: 'Bernd Zweit', qualification: 'Fixture' });

    const nachher = readFileSync(catalogFile('domain-reviewers.ts'), 'utf8');
    expect(nachher).toContain("'aerst': { id: 'aerst', name: 'Anna Erst'");
    expect(nachher).toContain("'bzweit': { id: 'bzweit', name: 'Bernd Zweit'");
  });

  it('weist eine bereits vergebene Kennung ab und lässt die Datei unverändert', () => {
    setzeRegister(REGISTER_FIXTURE_GEFUELLT);
    const vorher = readFileSync(catalogFile('domain-reviewers.ts'), 'utf8');

    expect(() => addReviewer(repoRoot, { id: 'aerst', name: 'B', qualification: 'Q' })).toThrow(
      /bereits vergeben/,
    );

    expect(readFileSync(catalogFile('domain-reviewers.ts'), 'utf8')).toBe(vorher);
  });
});
