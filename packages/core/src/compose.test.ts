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
  vehicleChassis: () => {
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

describe('compose() — Fahrwerkszone', () => {
  /**
   * Der Landfahrzeugkörper aus `base-symbols.ts` (Hülle 1/5,75 bis 31/26 mm). Hier als Rechteck
   * mit derselben Unterkante gedoppelt: geprüft wird die **Verankerung** an der Körperunterkante,
   * nicht die Kurvenform der Oberkante, und `core` darf nicht von `catalog` abhängen.
   */
  const vehicleBody: Primitive = {
    type: 'rect',
    role: 'body',
    x: 1,
    y: 5.75,
    width: 30,
    height: 20.25,
  };

  /**
   * Die Fahrwerkszone der Kategorie 3 mit den Zahlen aus `packages/catalog/src/vehicle-categories.ts`
   * — hier fest verdrahtet, aus demselben Grund wie die Stapelkopfzone oben.
   */
  const vehicleCatalog: CatalogPorts = {
    ...catalog,
    baseDrawing: () => ({ viewBox: DEFAULT_VIEWBOX_MM, children: [vehicleBody] }),
    vehicleChassis: () => ({
      heightMm: 4.75,
      marks: [
        { type: 'bar', fromXMm: 6, toXMm: 13.75, cyFromTopMm: 2.25 },
        { type: 'wheel', cxMm: 3.75, cyFromTopMm: 2.25, rMm: 2.25 },
        { type: 'track', leftCxMm: 20, rightCxMm: 28, cyFromTopMm: 2.25, rMm: 2.25 },
      ],
    }),
  };

  it('hängt jede Marke an die Unterkante der Körperhülle', () => {
    const drawing = compose(
      { kind: 'vehicle-land', vehicleCategory: 'kfz-kategorie-3' },
      vehicleCatalog,
    );
    const chassis = drawing.children.filter((child) => child.role === 'chassis');
    expect(chassis).toHaveLength(3);
    // Körperunterkante 26 mm + cyFromTopMm 2,25 = 28,25 mm — der an 5.1.1.x gemessene Wert.
    expect(chassis[0]).toEqual({
      type: 'line',
      role: 'chassis',
      x1: 6,
      y1: 28.25,
      x2: 13.75,
      y2: 28.25,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
    });
    expect(chassis[1]).toEqual({
      type: 'circle',
      role: 'chassis',
      cx: 3.75,
      cy: 28.25,
      r: 2.25,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
    });
    // Das Stadion als Rechteck mit `rx` = halbe Höhe: x = linke Endmitte − r, Breite =
    // Endmittenabstand + 2r.
    expect(chassis[2]).toEqual({
      type: 'rect',
      role: 'chassis',
      x: 17.75,
      y: 26,
      width: 12.5,
      height: 4.5,
      rx: 2.25,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
    });
  });

  it('zeichnet das Fahrwerk nach dem gefüllten Körper', () => {
    // Sonst zeichnete eine Organisationsfüllung über die Radkontur. Die Reihenfolge ist die
    // einzige Stelle, an der die Zerlegung in Primitive die verschmolzene Kontur der Referenz
    // nachbilden kann.
    const filledCatalog: CatalogPorts = { ...vehicleCatalog, organizationColor: () => 'blau' };
    const drawing = compose(
      { kind: 'vehicle-land', organization: 'thw', vehicleCategory: 'kfz-kategorie-3' },
      filledCatalog,
    );
    const roles = drawing.children.map((child) => child.role);
    expect(roles.indexOf('body')).toBeLessThan(roles.indexOf('chassis'));
  });

  it('lässt das Fahrwerk innerhalb der Grundfläche', () => {
    const drawing = compose(
      { kind: 'vehicle-land', vehicleCategory: 'kfz-kategorie-3' },
      vehicleCatalog,
    );
    expect(checkViewBox(drawing)).toEqual([]);
  });

  it('erzeugt ohne Fahrzeugkategorie kein Fahrwerk und ruft den Port nicht', () => {
    // `catalog.vehicleChassis` wirft im Doppel — der Test belegt damit zugleich, dass der Port
    // nur bei gesetzter Kategorie überhaupt gefragt wird.
    const drawing = compose({ kind: 'vehicle-land' }, {
      ...catalog,
      baseDrawing: () => ({ viewBox: DEFAULT_VIEWBOX_MM, children: [vehicleBody] }),
    });
    expect(drawing.children.filter((child) => child.role === 'chassis')).toHaveLength(0);
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

/**
 * Der Wechselladerrumpf und sein L-Rahmen — die einzige Konstellation des Bestands, in der die
 * Unterkante des **Körpers** und die des **Grundzeichens** auseinandergehen. Die Zahlen sind die
 * vermessenen aus `base-symbols.ts` (Körper 2,5001/6,0000/31,0000/24,5004; Rahmen-Mittellinie
 * (1|6) → (1|26) → (31|26)).
 */
const swapLoaderBody: Primitive = {
  type: 'path',
  role: 'body',
  d: 'M 16.75 8.25 C 11.05 8.25, 6.3 7.339, 2.5 6 L 2.5 24.5 L 31 24.5 L 31 6 C 27.2 7.339, 22.45 8.25, 16.75 8.25 Z',
};
const swapLoaderFrame: Primitive = {
  type: 'polyline',
  role: 'bodyExtra',
  closed: false,
  points: [
    [1, 6],
    [1, 26],
    [31, 26],
  ],
};

/** Der angehobene Wasserrumpf der fünf Zeichen E.2.27 bis E.2.31 (Hülle 1,01/7,9999/30,9894/22,9896). */
const raisedHull: Primitive = {
  type: 'path',
  role: 'body',
  d: 'M 1.01 7.9999 L 30.9894 7.9999 C 30.9894 16.2785, 24.2783 22.9896, 15.9997 22.9896 C 7.7211 22.9896, 1.01 16.2785, 1.01 7.9999 Z',
};

const e2Catalog: CatalogPorts = {
  ...catalog,
  baseDrawing: (kind, variant) => {
    if (kind === 'swap-loader-vehicle') {
      return { viewBox: DEFAULT_VIEWBOX_MM, children: [swapLoaderBody, swapLoaderFrame] };
    }
    if (kind === 'vehicle-water' && variant === 'raised-hull') {
      return { viewBox: DEFAULT_VIEWBOX_MM, children: [raisedHull] };
    }
    if (variant !== undefined) throw new Error(`Keine Körpervariante "${variant}" für "${kind}".`);
    return { viewBox: DEFAULT_VIEWBOX_MM, children: [formationBody] };
  },
  organizationColor: () => 'blau',
  vehicleChassis: () => ({
    marks: [{ type: 'wheel', cxMm: 3.75, cyFromTopMm: 2.25, rMm: 2.25 }],
    heightMm: 4.75,
  }),
};

describe('compose() — Zusatzgeometrie des Grundzeichens', () => {
  it('trägt die Nicht-Körper-Primitive des Grundzeichens mit', () => {
    // Bis zum Teilslice E.2 nahm `compose()` allein den Körper: eine Deichsel oder ein L-Rahmen
    // verschwand still. Genau diese Bauart verbietet dieses Projekt.
    const drawing = compose({ kind: 'swap-loader-vehicle' }, e2Catalog);
    const extras = drawing.children.filter((child) => child.role === 'bodyExtra');
    expect(extras).toHaveLength(1);
    expect(extras[0]).toMatchObject({ type: 'polyline', closed: false });
  });

  it('zeichnet die Zusatzgeometrie nach dem gefüllten Körper', () => {
    // Die Deichsel endet auf der Körpermittellinie; eine Organisationsfüllung zeichnete darüber,
    // wenn sie danach käme. Dieselbe Begründung wie beim Fahrwerk.
    const drawing = compose({ kind: 'swap-loader-vehicle', organization: 'thw' }, e2Catalog);
    const bodyIndex = drawing.children.findIndex((child) => child.role === 'body');
    const extraIndex = drawing.children.findIndex((child) => child.role === 'bodyExtra');
    expect(bodyIndex).toBeGreaterThanOrEqual(0);
    expect(extraIndex).toBeGreaterThan(bodyIndex);
  });

  it('färbt die Zusatzgeometrie nicht mit der Organisationsfarbe ein', () => {
    const drawing = compose({ kind: 'swap-loader-vehicle', organization: 'thw' }, e2Catalog);
    const body = drawing.children.find((child) => child.role === 'body');
    const extra = drawing.children.find((child) => child.role === 'bodyExtra');
    expect(body?.style?.fill).toBe('blau');
    expect(extra?.style?.fill).toBeUndefined();
  });
});

describe('compose() — Fahrwerk hängt am Grundzeichen, nicht am Körper', () => {
  it('setzt die Zonenoberkante auf die Unterkante des Grundzeichens', () => {
    // Gemessen an drei Dateien mit abweichender Körperunterkante: E.2.15 (Körper bis 24,5004),
    // 5.1.1.8 (24,9999) und 5.1.1.9 (24,9999) hängen ihre Räder alle drei auf 26,0 — die
    // Unterkante ihres L-Rahmens. Der Versatz ist damit keine Konstante (1,5 / 1,0005 / 1,0005),
    // die Zonenoberkante schon.
    const drawing = compose(
      { kind: 'swap-loader-vehicle', vehicleCategory: 'kfz-kategorie-1' },
      e2Catalog,
    );
    const wheel = drawing.children.find((child) => child.role === 'chassis');
    expect(wheel?.type).toBe('circle');
    if (wheel?.type !== 'circle') throw new Error('unreachable');
    // Zonenoberkante 26,0 + cyFromTopMm 2,25 = Radmitte 28,25 — die gemessene 28,2501.
    expect(wheel.cy).toBe(28.25);
    // Am Körper allein gerechnet säße sie auf 26,75 und damit 1,5 mm daneben.
    expect(wheel.cy).not.toBe(26.75);
  });

  it('lässt die Zone für alle Körper ohne Zusatzgeometrie unverändert', () => {
    // Für dreizehn der vierzehn Grundzeichen sind Körper- und Grundzeichenunterkante dieselbe
    // Zahl; die Umformulierung darf dort nichts verschieben.
    const drawing = compose({ kind: 'vehicle-land', vehicleCategory: 'kfz-kategorie-1' }, {
      ...e2Catalog,
      // Ein Körper ohne Zusatzgeometrie mit derselben Unterkante 26,0 wie der Landfahrzeugkörper.
      baseDrawing: () => ({ viewBox: DEFAULT_VIEWBOX_MM, children: [formationBody] }),
    });
    const wheel = drawing.children.find((child) => child.role === 'chassis');
    if (wheel?.type !== 'circle') throw new Error('unreachable');
    expect(wheel.cy).toBe(28.25);
  });
});

describe('compose() — vierte Beschriftungszone', () => {
  const waterSpec = {
    kind: 'vehicle-water',
    bodyVariant: 'raised-hull',
    organization: 'thw',
    labels: { belowRight: 'THW' },
  } as const;

  it('setzt den Lauf unterhalb des Körpers in der Organisationsfarbe', () => {
    const drawing = compose(waterSpec, e2Catalog);
    const label = drawing.children.filter((child) => child.role === 'label');
    expect(label).toHaveLength(1);
    const run = label[0];
    if (run?.type !== 'text') throw new Error('unreachable');
    expect(run.content).toBe('THW');
    expect(run.anchor).toBe('end');
    expect(run.style?.fill).toBe('blau');
    // Grundlinie 22,9896 + 4,01 = 26,9996 gegen die gemessenen 26,9998 der fünf Referenzdateien.
    expect(run.y).toBeCloseTo(26.9996, 4);
    // Anker 30,9894 + 0,5618 = 31,5512; die gemessene Tintenkante 31,5778 liegt 0,0266 mm
    // rechts davon, so viel wie die Schrift der Referenz ihren Anker auch in E.2.1 überragt.
    expect(run.x).toBeCloseTo(31.5512, 4);
    // Der Lauf steht **vollständig** unter dem Rumpf: seine Oberkante 24,0806 mm liegt 1,0908 mm
    // unter dessen Unterkante 22,9898.
    expect(run.boxMm.yMm).toBeGreaterThan(22.9896);
  });

  it('benutzt den Schriftgrad der unteren Zonen unverändert', () => {
    // Gemessene Versalhöhe 2,9192 mm — derselbe Wert wie in den beiden Zonen im Körper. Der Lauf
    // `THW` ist in E.2.1 und E.2.27 gleich breit (9,0399 mm): es ist derselbe Lauf, versetzt.
    const below = compose(waterSpec, e2Catalog).children.find((child) => child.role === 'label');
    const inBody = compose(
      { kind: 'formation', organization: 'thw', labels: { bottomRight: 'THW' } },
      e2Catalog,
    ).children.find((child) => child.role === 'label');
    if (below?.type !== 'text' || inBody?.type !== 'text') throw new Error('unreachable');
    expect(below.sizeMm).toBe(inBody.sizeMm);
  });

  it('lehnt die Zone an jeder anderen Körperform ab', () => {
    // n = 5, alle auf einer Körperform. Ohne die Ablehnung setzte der Katalog einen blauen Lauf
    // unter eine Taktische Formation — und kein Gate meldete ihn.
    expect(() =>
      compose({ kind: 'formation', organization: 'thw', labels: { belowRight: 'THW' } }, e2Catalog),
    ).toThrow(/below-right-label-requires-measured-body/);
    expect(() =>
      compose({ kind: 'vehicle-water', organization: 'thw', labels: { belowRight: 'THW' } }, e2Catalog),
    ).toThrow(/below-right-label-requires-measured-body/);
  });

  it('lehnt die Zone ohne Organisation ab', () => {
    expect(() =>
      compose({ kind: 'vehicle-water', bodyVariant: 'raised-hull', labels: { belowRight: 'THW' } }, e2Catalog),
    ).toThrow(/below-right-label-requires-organization/);
  });

  it('reicht die Körpervariante an den Katalog durch', () => {
    // Ohne die Durchreichung bekäme ein E.2-Wasserfahrzeug den Rumpf von 1.5 — 1,0 mm zu tief,
    // und vor dem Extraktorausbau meldete das kein Gate.
    expect(() => compose({ kind: 'formation', bodyVariant: 'raised-hull' }, e2Catalog)).toThrow(
      /Körpervariante/,
    );
  });
});

describe('compose() — Schriftgrad des mittigen Laufs', () => {
  /** Der Normfall: ohne Angabe bleibt alles wie vor dem Teilslice E.2. */
  it('setzt ohne Angabe den Normgrad aus der Versalhöhe 4,87 mm', () => {
    const drawing = compose(
      { kind: 'formation', organization: 'thw', labels: { center: 'B' } },
      e2Catalog,
    );
    const label = drawing.children.find((child) => child.role === 'label');
    if (label?.type !== 'text') throw new Error('unreachable');
    // 4,87 / ARIMO_CAP_HEIGHT_FRACTION — dieselbe Rechnung wie vor dem Teilslice.
    expect(label.sizeMm).toBeCloseTo(7.0786, 3);
  });

  it('leitet den Grad aus der übergebenen Versalhöhe ab', () => {
    // Selbst vermessen an E.2.12 („MzGW Lbw", erste Versalie M): 3,4099 mm bei Grundlinie 18,0.
    // Das sind 0,7003 der Norm — ohne diese Zahl träte der Lauf aus der 28-mm-Box.
    const drawing = compose(
      {
        kind: 'formation',
        organization: 'thw',
        labels: { center: 'MzGW Lbw', centerCapHeightMm: 3.4099 },
      },
      e2Catalog,
    );
    const label = drawing.children.find((child) => child.role === 'label');
    if (label?.type !== 'text') throw new Error('unreachable');
    const normal = compose(
      { kind: 'formation', organization: 'thw', labels: { center: 'MzGW Lbw' } },
      e2Catalog,
    ).children.find((child) => child.role === 'label');
    if (normal?.type !== 'text') throw new Error('unreachable');
    expect(label.sizeMm / normal.sizeMm).toBeCloseTo(3.4099 / 4.87, 6);
  });

  it('lässt die unteren Zonen davon unberührt', () => {
    // Gemessen: alle 31 E.2-Dateien setzen ihren THW-Lauf in derselben Versalhöhe 2,9192 mm,
    // unabhängig vom Grad des mittigen Laufs.
    const drawing = compose(
      {
        kind: 'formation',
        organization: 'thw',
        labels: { center: 'MzGW Lbw', centerCapHeightMm: 3.4099, bottomRight: 'THW' },
      },
      e2Catalog,
    );
    const [, bottom] = drawing.children.filter((child) => child.role === 'label');
    const reference = compose(
      { kind: 'formation', organization: 'thw', labels: { center: 'B', bottomRight: 'THW' } },
      e2Catalog,
    ).children.filter((child) => child.role === 'label')[1];
    if (bottom?.type !== 'text' || reference?.type !== 'text') throw new Error('unreachable');
    expect(bottom.sizeMm).toBe(reference.sizeMm);
  });

  it('lehnt eine Versalhöhe ohne mittigen Lauf ab', () => {
    expect(() =>
      compose(
        { kind: 'formation', organization: 'thw', labels: { bottomRight: 'THW', centerCapHeightMm: 3.4 } },
        e2Catalog,
      ),
    ).toThrow(/center-cap-height-requires-center-label/);
  });

  it('lehnt eine unmögliche Versalhöhe ab', () => {
    expect(() =>
      compose({ kind: 'formation', labels: { center: 'B', centerCapHeightMm: 0 } }, e2Catalog),
    ).toThrow(/center-cap-height-positive/);
    expect(() =>
      compose(
        { kind: 'formation', labels: { center: 'B', centerCapHeightMm: Number.NaN } },
        e2Catalog,
      ),
    ).toThrow(/center-cap-height-positive/);
  });
});

describe('compose() — mittige Grundlinie je Körperform', () => {
  it('hält den Normwert 8 mm für die Körperformen aus Kapitel 1', () => {
    const drawing = compose({ kind: 'formation', labels: { center: 'B' } }, e2Catalog);
    const label = drawing.children.find((child) => child.role === 'label');
    if (label?.type !== 'text') throw new Error('unreachable');
    // Körperunterkante 26 − 8 = 18, die an 18 E.2-Dateien und an E.1 gemessene Grundlinie.
    expect(label.y).toBe(18);
  });

  it('nimmt für den Wechselladerrumpf die gemessenen 7,5 mm', () => {
    // E.2.15: Grundlinie 17,0000 bei Körperunterkante 24,5004. Mit dem Normwert läge sie auf
    // 16,5 — 0,5 mm daneben, und kein Gate meldete es.
    const drawing = compose({ kind: 'swap-loader-vehicle', labels: { center: 'LKW' } }, e2Catalog);
    const label = drawing.children.find((child) => child.role === 'label');
    if (label?.type !== 'text') throw new Error('unreachable');
    expect(label.y).toBe(17);
  });

  it('nimmt für den angehobenen Wasserrumpf die gemessenen 6,9896 mm', () => {
    // E.2.28 bis E.2.31: Grundlinie 16,0002 bei Körperunterkante 22,9898. Mit dem Normwert läge
    // sie auf 14,99 — 1,01 mm daneben.
    const drawing = compose(
      { kind: 'vehicle-water', bodyVariant: 'raised-hull', labels: { center: 'MzB' } },
      e2Catalog,
    );
    const label = drawing.children.find((child) => child.role === 'label');
    if (label?.type !== 'text') throw new Error('unreachable');
    expect(label.y).toBeCloseTo(16, 3);
  });
});
