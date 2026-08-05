import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { auditReference } from './audit-reference.js';

/**
 * Der Referenzordner `taktische-zeichen/` wird nie eingecheckt und `audit:reference` darf in
 * diesem Fix nicht ausgeführt werden (das überschriebe `fingerprints.json`). Diese Suite testet
 * die Filterlogik trotzdem gegen die echte, exportierte Funktion — nur die Dateisystemgrenze
 * (`node:fs`) ist gefaked, mit einer kleinen, an Task 7 Step 6 des Ledgers angelehnten
 * Dateiliste (`--filter "1.1"` trifft dort nachweislich sechs Dateien: 1.1, 1.10–1.14).
 *
 * Die Mocks entstehen über `vi.hoisted`, nicht über einen Import der echten `node:fs`-Typen —
 * so bleibt die Testkonfiguration von den `readdirSync`/`readFileSync`-Overloads unabhängig und
 * braucht keinen `as`-Cast, um `mockReturnValue` zufriedenzustellen.
 */
const mocks = vi.hoisted(() => ({
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('node:fs', () => mocks);

const FILES = [
  '1.1_Taktische Formation.svg',
  '1.10_Maßnahme.svg',
  '1.11_Gefahr.svg',
  '1.12_Konkreter Punkt.svg',
  '1.13_Ereignis.svg',
  '1.14_Spontanhelfer.svg',
  '2.1_Feuerwehr.svg',
];

describe('auditReference — Filterlogik gegen options.filter !== undefined', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readdirSync.mockReturnValue(FILES);
    mocks.readFileSync.mockReturnValue('<svg viewBox="0 0 90 90"></svg>');
    // `print: true` gibt das Ergebnis über console.log aus — für die Testausgabe irrelevant.
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('läuft ohne --filter über alle Dateien', () => {
    const result = auditReference({ print: true });
    expect(result).toHaveLength(FILES.length);
    expect(mocks.writeFileSync).not.toHaveBeenCalled();
  });

  it('"--filter \'\'" durchläuft jetzt denselben expliziten Filterzweig wie jeder andere Präfix, statt über den Falsy-Zufall in den Vollzweig zu fallen', () => {
    // Beobachtbar identisches Ergebnis zum ungefilterten Lauf, weil jeder Dateiname mit ""
    // beginnt — der Unterschied zur vorherigen Fassung liegt nicht in der Trefferzahl, sondern
    // darin, welcher Zweig sie liefert: `options.filter ? … : …` nahm für "" (falsy) den
    // Vollzweig zufällig; `options.filter !== undefined ? … : …` nimmt bewusst den Filterzweig.
    const result = auditReference({ filter: '', print: true });
    expect(result).toHaveLength(FILES.length);
  });

  it('"--filter \'1.1\'" trifft per Präfix sechs Dateien (1.1, 1.10–1.14), nicht nur die exakte 1.1', () => {
    const result = auditReference({ filter: '1.1', print: true });
    expect(result.map((fp) => fp.asset).sort()).toEqual(
      [
        '1.1_Taktische Formation.svg',
        '1.10_Maßnahme.svg',
        '1.11_Gefahr.svg',
        '1.12_Konkreter Punkt.svg',
        '1.13_Ereignis.svg',
        '1.14_Spontanhelfer.svg',
      ].sort(),
    );
  });

  it('ein nicht vorkommendes Präfix trifft keine Datei, statt auf den Vollzweig zurückzufallen', () => {
    const result = auditReference({ filter: '9.9', print: true });
    expect(result).toHaveLength(0);
  });
});
