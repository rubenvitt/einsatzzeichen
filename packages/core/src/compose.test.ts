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

/**
 * Der Gebäudekörper, wie `base-symbols.ts` ihn führt (Hülle 1/3 bis 31/26 mm). Er steht hier,
 * weil er die einzige Körperform des Bestands ist, an der die beiden Lesarten der mittigen
 * Grundlinie auseinandergehen — siehe die Zusicherung „rechnet die mittige Grundlinie gegen die
 * Körperunterkante" weiter unten.
 */
const buildingBody: Primitive = {
  type: 'polyline',
  role: 'body',
  closed: true,
  points: [
    [16, 3],
    [1, 10],
    [1, 26],
    [31, 26],
    [31, 10],
  ],
};

/** Katalog-Doppel: liefert ausschließlich das Grundzeichen, alles andere ist für diese Tests
 * unerheblich und lehnt einen Aufruf explizit ab, statt still einen falschen Wert zu liefern. */
const catalog: CatalogPorts = {
  baseDrawing: (kind) => ({
    viewBox: DEFAULT_VIEWBOX_MM,
    children: [kind === 'building' ? buildingBody : formationBody],
  }),
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

  it('meldet einen viewBox-Gate-Befund für formation + staffel + designation — Kopfzone verdrängt die Fußzone', () => {
    // Anders als die beiden Fälle oben (Grundzeichen ohne Kopfzone, das schon in seiner
    // Standardlage keinen Platz für eine Fußzone hat) belegt dieser Fall die Wechselwirkung
    // zwischen Kopf- und Fußzone: `formation` allein trägt eine Fußzone anstandslos (siehe die
    // Tests oben), aber eine Stärkeangabe kann den Körper so weit nach unten verschieben, dass die
    // Fußzone danach nicht mehr passt. `strengthHead('staffel')` liefert nach
    // `packages/catalog/src/strengths.ts` einen senkrechten Stapel zweier Marken (cyFromTopMm 1.5
    // und 5.5, rMm 1.5) mit `heightMm: 7` (STACK_CY_FROM_TOP_MM[1] + DOT_RADIUS_MM) — dieselben
    // Zahlen hier fest verdrahtet, weil `core` nicht von `catalog` abhängen darf.
    //
    // Nachgerechnet (Entscheidungsnotiz docs/decisions/2026-08-09-textprimitiv-und-fusszone.md,
    // §6): `placeHead(rectBodyProfile, 7)` ergibt `topMm = max(1, 6 − 1 − 7) = 1`,
    // `bottomMm = 8`. `rectBodyProfile.place()` verschiebt den Körper auf
    // `target = max(6, 8 + 1) = 9`, also 3 mm tiefer (`minY` 6 → 9, `maxY` 26 → 29). Die Fußzone
    // hängt sich an die tatsächliche Körperunterkante: `footTopMm` 27 → 30 mm,
    // `verticalTextBoxMm(30, 4, 'hanging')` ergibt eine Boxunterkante von 34 mm — über der
    // 32-mm-viewBox-Höhe.
    const staffelCatalog: CatalogPorts = {
      ...catalog,
      strengthHead: () => ({
        marks: [
          { cxMm: 16, cyFromTopMm: 1.5, rMm: 1.5 },
          { cxMm: 16, cyFromTopMm: 5.5, rMm: 1.5 },
        ],
        heightMm: 7,
      }),
    };
    const drawing = compose(
      { kind: 'formation', strength: 'staffel', designation: 'Löschstaffel' },
      staffelCatalog,
    );
    const foot = drawing.children.find((p) => p.role === 'foot');
    if (foot?.type !== 'text') throw new Error('compose() hat keine Text-Fußzone erzeugt.');
    // Belegt die nachgerechneten Zahlen aus der Entscheidungsnotiz, nicht nur den Endbefund.
    expect(foot.boxMm).toEqual({ xMm: 1, yMm: 29.5, widthMm: 30, heightMm: 4.5 });

    const issues = checkViewBox(drawing);
    const outside = issues.filter((issue) => issue.rule === 'outside-viewbox');
    expect(outside).toHaveLength(1);
    expect(outside[0]?.detail).toContain('maxY 34');
  });
});

describe('compose() — Beschriftungszonen', () => {
  /** Alle drei Zonen belegt; ohne `organization`, das Katalog-Doppel liefert keine Farbe. */
  const labelSpec = { kind: 'formation', labels: { center: 'K', bottomLeft: 'A', bottomRight: 'THW' } } as const;

  function labelsOf(): { center: Primitive; bottomLeft: Primitive; bottomRight: Primitive } {
    const drawing = compose(labelSpec, catalog);
    const labels = drawing.children.filter((p) => p.role === 'label');
    if (labels.length !== 3) throw new Error(`compose() hat ${labels.length} statt 3 Beschriftungen erzeugt.`);
    const [center, bottomLeft, bottomRight] = labels as [Primitive, Primitive, Primitive];
    return { center, bottomLeft, bottomRight };
  }

  it('hält die zwei waagerechten Margen getrennt — mittige Box 1 mm, untere Anker 2 mm', () => {
    // Der Punkt dieses Tests ist die **Trennung**, nicht der Einzelwert: seit dem Teilslice E-b
    // (17. August 2026) rechnet die Box des mittigen Laufs mit CENTER_LABEL_BOX_MARGIN_MM (1 mm,
    // vermessenes Innenfeld 2…30 mm), die Anker und Boxen der unteren Läufe mit
    // LABEL_SIDE_MARGIN_MM (2 mm, an den unteren Läufen gemessene Kanten 3,03/29,03). Wer die
    // beiden Margen künftig wieder zu einer Konstante vereinheitlicht, verschiebt zwangsläufig
    // eine der beiden Seiten — und fällt genau hier auf.
    //
    // Geprüft werden ausschließlich die **waagerechten** Felder. `yMm`/`heightMm` stammen aus
    // `verticalTextBoxMm` (Diakritika-Rechnung, irrationale Werte bei Versalhöhe 4,87); sie hier
    // gegen dieselbe Funktion zu prüfen wäre ein Kreisschluss und keine Zusicherung.
    const { center, bottomLeft, bottomRight } = labelsOf();
    if (center.type !== 'text' || bottomLeft.type !== 'text' || bottomRight.type !== 'text') {
      throw new Error('compose() hat für eine Zone kein Textprimitiv erzeugt.');
    }

    // Körper 1…31 mm: mittige Box 1+1 = 2 bis 31−1 = 30, also 28 mm breit.
    expect(center.boxMm).toMatchObject({ xMm: 2, widthMm: 28 });
    expect(center.anchor).toBe('middle');
    expect(center.x).toBe(16);

    // Untere Läufe unverändert: Anker 3 und 29, Boxen je bis zur Körpermitte 16.
    expect(bottomLeft.x).toBe(3);
    expect(bottomLeft.boxMm).toMatchObject({ xMm: 3, widthMm: 13 });
    expect(bottomRight.x).toBe(29);
    expect(bottomRight.boxMm).toMatchObject({ xMm: 16, widthMm: 13 });
  });

  it('rechnet die mittige Grundlinie gegen die Körperunterkante, nicht gegen die Oberkante', () => {
    // Die eigentliche Zusicherung steht in der **zweiten** Hälfte. An `formation` (Hülle
    // 6…26 mm) liefern „12 mm unter der Oberkante" und „8 mm über der Unterkante" beide 18 mm —
    // eine Prüfung allein an dieser Körperform hielte die Kante gar nicht fest, obwohl 36 der 37
    // E.1-Dateien auf ihr stehen. Erst der Gebäudekörper (Hülle 3…26 mm) trennt die beiden
    // Lesarten: gegen die Oberkante wären es 15,0 mm, gegen die Unterkante 18,0 mm. Die Referenz
    // E.1.37 setzt ihre mittige Grundlinie auf 18,9999 mm und ihre `THW`-Grundlinie auf
    // 23,9995 mm = maxY − 2; von den beiden möglichen Ankern trifft nur der untere in dieselbe
    // Größenordnung. Wer die Konstante zurückdreht, fällt hier auf und nicht erst im Bild.
    const formation = compose(labelSpec, catalog);
    const formationCenter = formation.children.find((p) => p.role === 'label');
    expect(formationCenter?.type).toBe('text');
    if (formationCenter?.type !== 'text') return;
    expect(formationCenter.y).toBeCloseTo(18, 6);

    const building = compose(
      { kind: 'building', labels: { center: 'OV', bottomRight: 'THW' } },
      catalog,
    );
    const [buildingCenter, buildingBottomRight] = building.children.filter(
      (p) => p.role === 'label',
    );
    expect(buildingCenter?.type).toBe('text');
    expect(buildingBottomRight?.type).toBe('text');
    if (buildingCenter?.type !== 'text' || buildingBottomRight?.type !== 'text') return;
    expect(buildingCenter.y).toBeCloseTo(18, 6);
    expect(buildingBottomRight.y).toBeCloseTo(24, 6);

    // Und die Folge, die kein Gate prüft (offene Kante „nichts prüft, ob eine Beschriftungsbox im
    // Körper liegt"): mit dem oberen Anker lag die Boxoberkante bei 8,9124 mm und damit über der
    // Traufe des Gebäudekörpers, ihre beiden oberen Ecken außerhalb des Polygons. Ab y 10 mm
    // führt das Polygon die volle Breite 1…31 mm — die Box 2…30 mm liegt darin.
    expect(buildingCenter.boxMm.yMm).toBeGreaterThan(10);
  });

  it('passiert das viewBox-Gate mit allen drei Beschriftungszonen', () => {
    // Das viewBox-Gate ist das einzige Gate, das `boxMm` eines Beschriftungslaufs überhaupt
    // ansieht (`viewbox-gate.ts` nimmt die vier Boxecken in die Hüllenrechnung). Es belegt
    // deshalb, dass die auf 2…30 mm geweitete Box zulässig bleibt.
    const drawing = compose(labelSpec, catalog);
    expect(checkViewBox(drawing)).toEqual([]);
  });
});
