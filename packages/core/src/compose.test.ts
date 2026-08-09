import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, type Primitive } from '@einsatzzeichen/schema';
import { compose, type CatalogPorts } from './compose.js';
import { checkViewBox } from './viewbox-gate.js';

/** Der Körper der Taktischen Formation, wie `base-symbols.ts` ihn führt. */
const formationBody: Primitive = {
  type: 'rect',
  role: 'body',
  x: 1,
  y: 6,
  width: 30,
  height: 20,
};

/** Katalog-Doppel: liefert ausschließlich das Grundzeichen, alles andere ist für diese Tests
 * unerheblich und lehnt einen Aufruf explizit ab, statt still einen falschen Wert zu liefern. */
const catalog: CatalogPorts = {
  baseDrawing: () => ({ viewBox: DEFAULT_VIEWBOX_MM, children: [formationBody] }),
  organizationColor: () => {
    throw new Error('Für diesen Test nicht aufgerufen.');
  },
  strengthHead: () => {
    throw new Error('Für diesen Test nicht aufgerufen.');
  },
  pictogram: () => {
    throw new Error('Für diesen Test nicht aufgerufen.');
  },
};

describe('compose() — Fußzone', () => {
  it('gibt die Bezeichnung als Fußzone aus', () => {
    const drawing = compose({ kind: 'formation', designation: '2. Zug' }, catalog);
    const foot = drawing.children.filter((p) => p.role === 'foot');
    expect(foot).toHaveLength(1);
    expect(foot[0]).toMatchObject({ type: 'text', content: '2. Zug' });
  });

  it('erzeugt ohne Bezeichnung keine Fußzone', () => {
    const drawing = compose({ kind: 'formation' }, catalog);
    expect(drawing.children.filter((p) => p.role === 'foot')).toHaveLength(0);
  });

  it('platziert die Fußzone unterhalb der Körperunterkante innerhalb der viewBox', () => {
    const drawing = compose({ kind: 'formation', designation: '2. Zug' }, catalog);
    const foot = drawing.children.find((p) => p.role === 'foot');
    if (foot?.type !== 'text') throw new Error('compose() hat keine Text-Fußzone erzeugt.');
    // Körperunterkante liegt bei 26 mm (y:6 + height:20); die Fußzone muss darunter beginnen.
    expect(foot.y).toBeGreaterThan(26);
    expect(foot.boxMm.yMm + foot.boxMm.heightMm).toBeLessThanOrEqual(DEFAULT_VIEWBOX_MM.height);
  });

  it('passiert das viewBox-Gate aus Task 5 mit gesetzter Fußzone', () => {
    const drawing = compose({ kind: 'formation', designation: '2. Zug' }, catalog);
    expect(checkViewBox(drawing)).toEqual([]);
  });

  it('meldet einen viewBox-Gate-Befund, wenn der Körperkreis keinen Platz für eine Fußzone lässt', () => {
    // `post` nutzt `circleBodyProfile` (defaultAnchorMm 2) — der Kreiskörper reicht fast bis zum
    // Rand (cy 16, r 14 → Unterkante 30 mm), es bleiben nur 2 mm bis zur viewBox-Kante. Der feste
    // Schriftgrad FOOT_TEXT_SIZE_MM (4 mm) plus HEAD_GAP_MM (1 mm) passt dort nicht — genau der
    // Fall, den das viewBox-Gate statt eines still verkleinerten oder unsichtbaren Texts melden
    // soll (siehe Kommentar zu FOOT_TEXT_SIZE_MM in compose.ts).
    const postBody: Primitive = { type: 'circle', role: 'body', cx: 16, cy: 16, r: 14 };
    const postCatalog: CatalogPorts = {
      ...catalog,
      baseDrawing: () => ({ viewBox: DEFAULT_VIEWBOX_MM, children: [postBody] }),
    };
    const drawing = compose({ kind: 'post', designation: 'Verbandplatz' }, postCatalog);
    const issues = checkViewBox(drawing);
    expect(issues.some((issue) => issue.rule === 'outside-viewbox')).toBe(true);
  });

  it('meldet denselben viewBox-Gate-Befund für "person" (defaultAnchorMm 1)', () => {
    // Analog zum post-Fall oben, aber für `person` (rotatedSquareProfile, defaultAnchorMm 1 statt
    // 2). Der Kommentar zu FOOT_TEXT_SIZE_MM in compose.ts behauptet den outside-viewbox-Befund
    // für beide Symbolarten — bis hierher war nur `post` belegt. Ohne Stärke (kein `strength` im
    // Spec) ruft `profile.place()` für `person` den Rotations-Zweig gar nicht auf (siehe
    // rotatedSquareProfile in layout/profiles.ts: `if (headBottomMm === null) return body;`), ein
    // einfacher rect-Körper genügt deshalb als Katalog-Doppel.
    const personBody: Primitive = { type: 'rect', role: 'body', x: 1, y: 1, width: 30, height: 29 };
    const personCatalog: CatalogPorts = {
      ...catalog,
      baseDrawing: () => ({ viewBox: DEFAULT_VIEWBOX_MM, children: [personBody] }),
    };
    const drawing = compose({ kind: 'person', designation: 'Verletzter' }, personCatalog);
    const issues = checkViewBox(drawing);
    expect(issues.some((issue) => issue.rule === 'outside-viewbox')).toBe(true);
  });
});
