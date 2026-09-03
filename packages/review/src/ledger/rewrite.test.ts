import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Review } from '@einsatzzeichen/schema';
import {
  MANIFEST_DOMAIN_REVIEWS,
  PROFILE_DOMAIN_REVIEWS,
  SOURCE_DOMAIN_REVIEWS,
} from '@einsatzzeichen/catalog/src/domain-reviews.js';
import { insertReviewerSource, rewriteLedgerSource } from './rewrite.js';

/**
 * Ein realistischer Ausschnitt: Kommentare zwischen den Einträgen (dort stehen im echten Ledger
 * die Fachfragen-IDs), ein mehrzeiliger Eintrag und ein zweiter Ledger in derselben Datei.
 * Genau diese drei Eigenschaften machen einen textuellen Bereichsersatz nötig.
 */
const LEDGER_FIXTURE = `import type { Review } from '@einsatzzeichen/schema';
import { deepFreeze } from './readonly-data.js';

/** Fachreview-Ledger des aktuellen Manifests. */
export const MANIFEST_DOMAIN_REVIEWS = deepFreeze({
  'bbk-babz-2025:1.1#primary': { status: 'pending' },
  // Die sechs Grundzeichen aus LFH-424. Fachfrage: Q-1-ereignis-ohne-organisation.
  'bbk-babz-2025:1.2#primary': { status: 'pending' },
  'bbk-babz-2025:1.3#primary': { status: 'pending' },
  // D.1.9: die Notiz ist Befundlage, keine Freigabe. Fachfrage: Q-D.1.9-hilfsorganisation.
  'bbk-babz-2025:D.1.9#primary': {
    status: 'pending',
    note: 'Organisationszuordnung hilfsorganisation ist aus der weißen Fläche abgeleitet.',
  },
} satisfies Record<string, Review>);

export const SOURCE_DOMAIN_REVIEWS = deepFreeze({
  'bbk-babz-2025': { status: 'pending' },
  'phjardas-tz': { status: 'pending' },
} satisfies Record<string, Review>);
`;

const PENDING_1_2 = "  'bbk-babz-2025:1.2#primary': { status: 'pending' },";

const REGISTER_FILE = fileURLToPath(
  new URL('../../../catalog/src/domain-reviewers.ts', import.meta.url),
);

/**
 * Das Reviewer-Register als **Fixture** statt als echte Datei.
 *
 * Warum die echte Datei hier nicht mehr taugt: die Tests unten sagen etwas über das Einfügen in
 * ein leeres und in ein bereits gefülltes Register aus. Am Realbestand wäre „leer" eine Aussage
 * über den heutigen Registerstand — der erste eingetragene Fachprüfer hätte sie rot gefärbt, und
 * zwar genau dann, wenn das Werkzeug zum ersten Mal benutzt wird. Der Fixture hält beide Fälle
 * dauerhaft prüfbar; die Form der echten Datei deckt der letzte Test dieses Blocks ab.
 *
 * Der Aufbau ist der der echten Datei: Kommentarblock über der Konstante, `deepFreeze` um ein
 * Objektliteral, `satisfies` dahinter — genau die drei Eigenschaften, an denen der Einfügepunkt
 * gesucht wird.
 */
const REGISTER_FIXTURE = `import { deepFreeze, type DeepReadonly } from './readonly-data.js';

export interface DomainReviewer {
  id: string;
  name: string;
  qualification: string;
}

/**
 * Register der Fachprüfer.
 *
 * Warum leer: es gibt heute keine benannte Person mit einsatztaktischer Fachkunde.
 */
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

const LEDGER_FILE = fileURLToPath(
  new URL('../../../catalog/src/domain-reviews.ts', import.meta.url),
);

describe('rewriteLedgerSource', () => {
  it('ersetzt genau einen Eintrag und lässt Kommentare und Nachbarzeilen unverändert', () => {
    const result = rewriteLedgerSource(LEDGER_FIXTURE, 'bbk-babz-2025:1.2#primary', {
      status: 'approved',
      reviewer: 'Max Mustermann',
      date: '2026-09-03',
      note: 'Deckt sich mit BABZ 1.2.',
    });

    // Der Vergleich gegen ein gezieltes `replace` beweist die eigentliche Zusage: außerhalb des
    // einen Textbereichs ist die Datei Zeichen für Zeichen dieselbe.
    expect(result).toBe(
      LEDGER_FIXTURE.replace(
        PENDING_1_2,
        [
          "  'bbk-babz-2025:1.2#primary': {",
          "    status: 'approved',",
          "    reviewer: 'Max Mustermann',",
          "    date: '2026-09-03',",
          "    note: 'Deckt sich mit BABZ 1.2.',",
          '  },',
        ].join('\n'),
      ),
    );
  });

  it('druckt einzeilig, solange das Literal in die Zeilenbreite passt', () => {
    const result = rewriteLedgerSource(LEDGER_FIXTURE, 'bbk-babz-2025:1.2#primary', {
      status: 'approved',
    });

    expect(result).toBe(
      LEDGER_FIXTURE.replace(
        PENDING_1_2,
        "  'bbk-babz-2025:1.2#primary': { status: 'approved' },",
      ),
    );
  });

  it('lässt nicht gesetzte Felder ganz weg statt sie als undefined zu drucken', () => {
    const result = rewriteLedgerSource(LEDGER_FIXTURE, 'bbk-babz-2025:1.1#primary', {
      status: 'pending',
      note: 'Vorbereitende Notiz.',
    });

    expect(result).toContain(
      "  'bbk-babz-2025:1.1#primary': { status: 'pending', note: 'Vorbereitende Notiz.' },",
    );
    expect(result).not.toContain('undefined');
  });

  it('maskiert Anführungszeichen und Backslashes, lässt Umlaute aber buchstäblich stehen', () => {
    const result = rewriteLedgerSource(LEDGER_FIXTURE, 'bbk-babz-2025:1.1#primary', {
      status: 'deviation',
      note: "Quelle 'BABZ' zeigt größere Fläche; Pfad C:\\tz\nZeile zwei.",
    });

    expect(result).toContain(
      "    note: 'Quelle \\'BABZ\\' zeigt größere Fläche; Pfad C:\\\\tz\\nZeile zwei.',",
    );
    // Die Umlaute bleiben UTF-8 und werden nicht in \u-Folgen übersetzt.
    expect(result).toContain('größere Fläche');
  });

  it('wirft für einen Schlüssel ohne Ledgerplatz', () => {
    expect(() => rewriteLedgerSource(LEDGER_FIXTURE, 'bbk-babz-2025:9.9#primary', {
      status: 'approved',
    })).toThrow(/keinen Ledgerplatz/);
  });

  it('wirft für einen Schlüssel, der mehrfach vorkommt', () => {
    const doppelt = `${LEDGER_FIXTURE}\nexport const ZWEITER = deepFreeze({\n  'phjardas-tz': { status: 'pending' },\n});\n`;

    expect(() => rewriteLedgerSource(doppelt, 'phjardas-tz', { status: 'approved' })).toThrow(
      /2-mal/,
    );
  });

  it('wirft, wenn der Initialisierer kein Objektliteral ist', () => {
    const geteilt = `export const LEDGER = deepFreeze({\n  'bbk-babz-2025:1.1#primary': SAMMELREVIEW,\n});\n`;

    expect(() =>
      rewriteLedgerSource(geteilt, 'bbk-babz-2025:1.1#primary', { status: 'approved' }),
    ).toThrow(/kein Objektliteral/);
  });

  it('wirft für einen unbekannten Status statt eine untypbare Datei zu erzeugen', () => {
    expect(() =>
      rewriteLedgerSource(LEDGER_FIXTURE, 'bbk-babz-2025:1.1#primary', {
        status: 'freigegeben' as never,
      }),
    ).toThrow(/Unbekannter Reviewstatus/);
  });

  it('wirft für syntaktisch fehlerhaften Quelltext, statt blind zu schreiben', () => {
    expect(() =>
      rewriteLedgerSource('export const LEDGER = deepFreeze({', 'x', { status: 'approved' }),
    ).toThrow(/syntaktisch fehlerhaft/);
  });

  // Eigene Zeitgrenze statt der voreingestellten fünf Sekunden: der Test parst die Ledgerdatei
  // 558-mal, und ihre Größe wächst mit jeder Entscheidung — eine vollständig entschiedene Fassung
  // trägt statt `{ status: 'pending' }` je fünf Zeilen. Nachgemessen 5,5 s bei vollbesetztem
  // Ledger; die Grenze fiele also ausgerechnet am Ende der Reviewkampagne, und zwar mit einer
  // Zeitüberschreitung statt einem inhaltlichen Befund.
  //
  // Damit der Test hält, muss `note` im Ledger **ein** Stringliteral bleiben: der Drucker in
  // `format.ts` gibt sie so aus, und eine von Hand mit `+` verkettete Notiz ließe den Rundlauf
  // die Datei verändern.
  it('ändert am echten Ledger bei gleichem Wert kein einziges Zeichen', () => {
    // Der schärfste Test für den Drucker: 558 echte Einträge, darunter die beiden mehrzeiligen
    // D.1.9-Zeilen mit Umlauten. Bleibt die Datei byteweise gleich, erzeugt eine Freigabe später
    // garantiert nur die eine Zeile als Diff — und keine Formatierungswelle.
    const source = readFileSync(LEDGER_FILE, 'utf8');
    const eintraege: Array<[string, Review]> = [
      ...Object.entries(MANIFEST_DOMAIN_REVIEWS),
      ...Object.entries(SOURCE_DOMAIN_REVIEWS),
      ...Object.entries(PROFILE_DOMAIN_REVIEWS),
    ];
    expect(eintraege).toHaveLength(558);

    const abweichend = eintraege
      .filter(
        ([key, review]) =>
          rewriteLedgerSource(source, key, {
            status: review.status,
            reviewer: review.reviewer,
            date: review.date,
            note: review.note,
          }) !== source,
      )
      .map(([key]) => key);

    expect(abweichend).toEqual([]);
  }, 120_000);
});

describe('insertReviewerSource', () => {
  it('trägt in das leere Register den ersten Prüfer ein', () => {
    const result = insertReviewerSource(REGISTER_FIXTURE, {
      id: 'mmustermann',
      name: 'Max Mustermann',
      qualification: 'Zugführer, Fachberater Einsatztaktik',
    });

    expect(result).toContain(
      [
        '  {',
        "    'mmustermann': {",
        "      id: 'mmustermann',",
        "      name: 'Max Mustermann',",
        "      qualification: 'Zugführer, Fachberater Einsatztaktik',",
        '    },',
        '  } satisfies Record<string, DomainReviewer>,',
      ].join('\n'),
    );
    // Der erklärende Kommentarblock über der Konstante bleibt vollständig erhalten.
    expect(result).toContain('Warum leer: es gibt heute keine benannte Person');
  });

  it('hängt an ein bereits gefülltes Register an, ohne den vorhandenen Eintrag anzufassen', () => {
    // Der zweite Fall zum leeren Register: sobald ein Mensch den ersten Prüfer eingetragen hat,
    // läuft jedes weitere Eintragen über diesen Zweig. Ohne ihn wäre er erst im Betrieb geprüft.
    const result = insertReviewerSource(REGISTER_FIXTURE_GEFUELLT, {
      id: 'bzweit',
      name: 'Bernd Zweit',
      qualification: 'Fachberater Einsatztaktik',
    });

    expect(result).toBe(
      REGISTER_FIXTURE_GEFUELLT.replace(
        "    'aerst': { id: 'aerst', name: 'Anna Erst', qualification: 'Zugführerin' },\n",
        "    'aerst': { id: 'aerst', name: 'Anna Erst', qualification: 'Zugführerin' },\n" +
          "    'bzweit': { id: 'bzweit', name: 'Bernd Zweit', " +
          "qualification: 'Fachberater Einsatztaktik' },\n",
      ),
    );
  });

  it('hängt einen zweiten Prüfer hinter den ersten, ohne ihn anzufassen', () => {
    const erster = insertReviewerSource(REGISTER_FIXTURE, {
      id: 'a',
      name: 'A',
      qualification: 'Q',
    });
    const zweiter = insertReviewerSource(erster, { id: 'b', name: 'B', qualification: 'Q' });

    expect(zweiter).toContain("    'a': { id: 'a', name: 'A', qualification: 'Q' },\n");
    expect(zweiter).toContain("    'b': { id: 'b', name: 'B', qualification: 'Q' },\n");
    expect(zweiter.indexOf("'a':")).toBeLessThan(zweiter.indexOf("'b':"));
  });

  it('weist eine bereits vergebene Kennung ab', () => {
    expect(() =>
      insertReviewerSource(REGISTER_FIXTURE_GEFUELLT, {
        id: 'aerst',
        name: 'Andere',
        qualification: 'Q',
      }),
    ).toThrow(/bereits vergeben/);
  });

  it('weist einen Eintrag mit leerem Feld ab', () => {
    expect(() =>
      insertReviewerSource(REGISTER_FIXTURE, { id: 'a', name: '  ', qualification: 'Q' }),
    ).toThrow(/ist leer/);
  });

  it('findet den Einfügepunkt auch in der echten Registerdatei und verliert keine Kommentarzeile', () => {
    // Die einzige Stelle, die noch die echte Datei anfasst — sie deckt deren **Form** ab, ohne
    // ihren Inhalt vorauszusetzen: die Kennung ist so gewählt, dass sie dort nie vorkommt, und
    // geprüft wird nicht ein bestimmter Kommentartext, sondern dass keine Kommentarzeile
    // verlorengeht. Damit hält der Test auch, wenn im Register echte Personen stehen.
    const source = readFileSync(REGISTER_FILE, 'utf8');
    const id = 'testpruefer-nur-fuer-diesen-test';
    const result = insertReviewerSource(source, {
      id,
      name: 'Test Prüferin',
      qualification: 'Fixture',
    });

    expect(result).toContain(`'${id}'`);
    expect(result).toContain("name: 'Test Prüferin'");
    const kommentarzeilen = (text: string): string[] =>
      text.split('\n').filter((line) => line.trimStart().startsWith('*'));
    expect(kommentarzeilen(result)).toEqual(kommentarzeilen(source));
  });
});
