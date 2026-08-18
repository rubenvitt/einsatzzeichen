import { describe, expect, it } from 'vitest';
import { checkViewBox, renderSvg } from '@einsatzzeichen/core';
import type { ChassisShape, VehicleCategoryId } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { composeFromCatalog, type Recipe } from './recipes.js';
import { MEASURED_VEHICLE_CATEGORIES, vehicleChassis } from './vehicle-categories.js';

/**
 * Vermessen am 18. August 2026 an `5.1.1.1`, `5.1.1.2`, `5.1.1.3`, `5.1.1.5` und `5.1.1.6` sowie
 * unabhängig an den 21 E.2-Zeichen, die eine dieser fünf Kategorien tragen (20 auf den drei
 * Kfz-Kategorien, E.2.9 auf der Kette). Das ist der Nachweis, den das
 * Fingerprint-Gate nicht leisten kann: es vergleicht nur `role: 'body'`, nie `role: 'chassis'` —
 * dieselbe Lage wie bei den Kopfzonen der Stärkegrade.
 *
 * Die Zahlen stammen aus den Innenringen und Außenkanten der Umrissebene, nicht aus einer
 * Ableitung: Innenring `1,7501/26,2502/5,7503/30,2500` (Mitte 3,7502|28,2501, r 2,0001),
 * Außenkante 30,7502 (r 2,5001) — Mittellinienradius damit 2,2501 bei Strich 0,5, und die
 * Zonenoberkante liegt auf der Körperunterkante 26,0004.
 */
const EXPECTED_CHASSIS = {
  // 5.1.1.1: zwei Räder, Mitte frei. Gemessene Mitten 3,7502 und 28,2499.
  'kfz-kategorie-1': {
    heightMm: 4.75,
    marks: [
      { type: 'wheel', cxMm: 3.75, cyFromTopMm: 2.25, rMm: 2.25 },
      { type: 'wheel', cxMm: 28.25, cyFromTopMm: 2.25, rMm: 2.25 },
    ],
  },
  // 5.1.1.2: drei Räder. Gemessene Mitten 3,7502 · 16,0001 · 28,2499.
  'kfz-kategorie-2': {
    heightMm: 4.75,
    marks: [
      { type: 'wheel', cxMm: 3.75, cyFromTopMm: 2.25, rMm: 2.25 },
      { type: 'wheel', cxMm: 16, cyFromTopMm: 2.25, rMm: 2.25 },
      { type: 'wheel', cxMm: 28.25, cyFromTopMm: 2.25, rMm: 2.25 },
    ],
  },
  // 5.1.1.3: dieselben drei Räder **plus** zwei Verbindungsstriche. Sie sind der einzige
  // Unterschied zu Kategorie 2 — gemessen an den beiden Zwischenräumen 5,2433…14,5062 und
  // 17,4932…26,7561 (jeweils von der Körperunterkante 26,2502 bis zur Strichoberkante 28,0000).
  'kfz-kategorie-3': {
    heightMm: 4.75,
    marks: [
      { type: 'bar', fromXMm: 6, toXMm: 13.75, cyFromTopMm: 2.25 },
      { type: 'bar', fromXMm: 18.25, toXMm: 26, cyFromTopMm: 2.25 },
      { type: 'wheel', cxMm: 3.75, cyFromTopMm: 2.25, rMm: 2.25 },
      { type: 'wheel', cxMm: 16, cyFromTopMm: 2.25, rMm: 2.25 },
      { type: 'wheel', cxMm: 28.25, cyFromTopMm: 2.25, rMm: 2.25 },
    ],
  },
  // 5.1.1.5: ein Stadion. Gemessenes Innenstadion 2,2500/26,2502/29,7501/30,2500 — Endmitten
  // 4,2500 und 27,7500 bei Innenradius 2,0001.
  kettenfahrzeug: {
    heightMm: 4.75,
    marks: [
      { type: 'track', leftCxMm: 4.25, rightCxMm: 27.75, cyFromTopMm: 2.25, rMm: 2.25 },
    ],
  },
  // 5.1.1.6: vier Räder. Gemessene Mitten 3,7504 · 9,2505 · 22,7499 · 28,2501.
  schienenfahrzeug: {
    heightMm: 4.75,
    marks: [
      { type: 'wheel', cxMm: 3.75, cyFromTopMm: 2.25, rMm: 2.25 },
      { type: 'wheel', cxMm: 9.25, cyFromTopMm: 2.25, rMm: 2.25 },
      { type: 'wheel', cxMm: 22.75, cyFromTopMm: 2.25, rMm: 2.25 },
      { type: 'wheel', cxMm: 28.25, cyFromTopMm: 2.25, rMm: 2.25 },
    ],
  },
} as const satisfies Record<Exclude<VehicleCategoryId, 'amphibienfahrzeug'>, ChassisShape>;

const CHASSIS_CASES = Object.entries(EXPECTED_CHASSIS) as Array<
  [Exclude<VehicleCategoryId, 'amphibienfahrzeug'>, ChassisShape]
>;

describe('Fahrzeugkategorien', () => {
  it('bindet den Fahrwerksgeometrie-Claim exakt an die ausgeführten Kategoriefälle', () => {
    const tested = CHASSIS_CASES.map(([id]) => `vehicle-category.${id}`).sort();
    const claimed = COVERAGE_MANIFEST.entries
      .filter((entry) => entry.testEvidence.includes('chassis-shape-regression'))
      .map((entry) => entry.implementation)
      .sort();
    expect(tested).toEqual(claimed);
  });

  it.each(CHASSIS_CASES)('reproduziert die vollständige Fahrwerksgeometrie für "%s"', (id, expected) => {
    expect(vehicleChassis(id)).toEqual(expected);
  });

  it('erzeugt für jede vermessene Kategorie eine eigene Zone', () => {
    // Der Grund, warum Kategorie 2 und Kategorie 3 dieselben drei Radplätze führen dürfen: der
    // Verbindungsstrich unterscheidet sie. Eine Wertetabelle nach Radplätzen allein ließe die
    // beiden byteidentisch zusammenfallen.
    const shapes = CHASSIS_CASES.map(([id]) => JSON.stringify(vehicleChassis(id)));
    expect(new Set(shapes).size).toBe(CHASSIS_CASES.length);
  });

  it('führt genau die fünf vermessenen Kategorien und wirft für das Amphibienfahrzeug', () => {
    expect([...MEASURED_VEHICLE_CATEGORIES].sort()).toEqual(CHASSIS_CASES.map(([id]) => id).sort());
    expect(() => vehicleChassis('amphibienfahrzeug')).toThrow(/nicht vollständig vermessen/);
  });

  it('hält jede Marke in der erklärten Zone und lässt sie oben genau das Strichband berühren', () => {
    // Die Zone ist 4,75 mm hoch und beginnt an der Körperunterkante. Bei einer Körperunterkante
    // von 26 mm endet sie damit bei 30,75 mm und bleibt innerhalb der 32-mm-Grundfläche — genau
    // die gemessene Unterkante des Bestands (30,7502).
    //
    // Nach **oben** ragt eine Radmarke um 0,25 mm über die Zonenoberkante hinaus, und das ist
    // gemessen und nicht geduldet: die Radaußenkante liegt bei 25,75 mm, die Innenkante des
    // Körperstrichs ebenfalls (Körperunterkante 26,0 bei Strich 0,5). Beide berühren sich exakt,
    // und deshalb erscheint im Bild kein Bogen innerhalb der Körperfläche — die Referenz
    // verschmilzt beides zu einer Kontur. Ein anderer Wert als eine halbe Strichbreite wäre
    // entweder eine Lücke oder ein sichtbarer Bogen.
    for (const [id, shape] of CHASSIS_CASES) {
      for (const mark of shape.marks) {
        const halfHeight = mark.type === 'bar' ? 0.25 : mark.rMm + 0.25;
        expect(mark.cyFromTopMm - halfHeight, id).toBeGreaterThanOrEqual(-0.25);
        expect(mark.cyFromTopMm + halfHeight, id).toBeLessThanOrEqual(shape.heightMm);
      }
    }
    // Und die Berührung ist exakt, nicht nur „innerhalb": jede runde Marke setzt ihre Außenkante
    // eine halbe Strichbreite über die Zonenoberkante.
    for (const [id, shape] of CHASSIS_CASES) {
      for (const mark of shape.marks) {
        if (mark.type === 'bar') continue;
        expect(mark.cyFromTopMm - mark.rMm - 0.25, id).toBe(-0.25);
      }
    }
  });

  it('lässt jeden Verbindungsstrich unter dem Ringstrich seiner beiden Räder enden', () => {
    // Die Endpunkte des Strichs sind an der Referenz nicht direkt ablesbar; vermessen ist das
    // Band, in dem sie liegen müssen (siehe `vehicle-categories.ts`). Diese Prüfung hält beide
    // Bandgrenzen fest, nicht nur die gewählte Lage: mindestens 2,0 mm von der Radmitte (sonst
    // durchstößt der Strich die Radinnenfläche, die in 5.1.1.3 ein unverletzter Kreis ist) und
    // höchstens 2,4875 mm (so weit reicht der Außenkreis r 2,5 auf der Höhe der Strichkante,
    // Δy 0,25 — darüber hinaus risse die Kontur auf).
    const shape = vehicleChassis('kfz-kategorie-3');
    const wheels = shape.marks.filter((mark) => mark.type === 'wheel');
    const bars = shape.marks.filter((mark) => mark.type === 'bar');
    expect(bars).toHaveLength(2);
    for (const bar of bars) {
      for (const end of [bar.fromXMm, bar.toXMm]) {
        const nearest = wheels.reduce((best, wheel) =>
          Math.abs(wheel.cxMm - end) < Math.abs(best.cxMm - end) ? wheel : best,
        );
        const distance = Math.abs(nearest.cxMm - end);
        expect(distance).toBeGreaterThanOrEqual(2);
        expect(distance).toBeLessThanOrEqual(2.4875);
      }
    }
  });
});

/**
 * Die Abschlussbedingung des Postens: ein Zeichen aus Anhang E.2 muss **als Rezept** ausdrückbar
 * und aus dem Katalog heraus zeichenbar sein — nicht bloß das Musterblatt aus 5.1 reproduzierbar.
 *
 * Anhang E.2 selbst steht nicht im beanspruchten Umfang und bekommt hier keine Rezepte: von den
 * 31 Zeichen fehlen vier Körperformen und zwei Taxonomie-IDs (siehe
 * `docs/decisions/2026-08-18-grundlagen-restpunkte.md`). Was hier steht, ist der Nachweis der
 * Erreichbarkeit an dem Zeichen, das vollständig aus vorhandenen Bausteinen besteht.
 */
describe('Anhang E.2 — Erreichbarkeit aus einem Rezept', () => {
  /**
   * `E.2.1 Personenkraftwagen (straßenfähig)`, gelesen an der Referenz: Landfahrzeugkörper
   * (Füllhülle 1,0001/5,7503/31,0003/26,0004 — zeichengleich mit `1.3_Landfahrzeug.svg`),
   * Organisationsfarbe `thw`, Fahrwerk der Kategorie 1 (Radmitten 3,7502 und 28,2499) und zwei
   * Beschriftungen, deren Zonen **dieselben** sind wie in E.1: Kürzel mittig mit Grundlinie
   * 18,0000 und Versalhöhe 4,8693, Trägerkürzel unten rechts mit Grundlinie 24,0000, rechter
   * Kante 29,0269 und Versalhöhe 2,9194. Die Kürzel sind am gerasterten Referenzbild abgelesen
   * (`PKW`, `THW`), wie bei allen Zeichen aus Anhang E — die Glyphen liegen in Kurven
   * umgewandelt vor.
   *
   * Als `Recipe` getippt und nicht nur als `SymbolSpec`: die Behauptung lautet, dass ein späterer
   * Slice E.2 mit demselben Datentyp beschreiben kann wie E.1.
   */
  const e21: Recipe = {
    title: 'Personenkraftwagen (straßenfähig)',
    referenceAsset: 'E.2.1_Personenkraftwagen_straßenfähig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'thw',
      vehicleCategory: 'kfz-kategorie-1',
      labels: { center: 'PKW', bottomRight: 'THW' },
    },
  };

  it('setzt Körper, Fahrwerk und Beschriftung an die gemessenen Stellen', () => {
    const drawing = composeFromCatalog(e21.spec, e21.title);
    const chassis = drawing.children.filter((child) => child.role === 'chassis');
    expect(chassis).toEqual([
      {
        type: 'circle',
        role: 'chassis',
        cx: 3.75,
        cy: 28.25,
        r: 2.25,
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
      },
      {
        type: 'circle',
        role: 'chassis',
        cx: 28.25,
        cy: 28.25,
        r: 2.25,
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
      },
    ]);

    const body = drawing.children.find((child) => child.role === 'body');
    expect(body?.style?.fill).toBe('blau');

    const labels = drawing.children.filter((child) => child.role === 'label');
    // Die Zonenregel aus E.1 trifft die Referenz von E.2.1 auf den Millimeter: Körperunterkante
    // 26 − 8 = 18 für den mittigen Lauf, 26 − 2 = 24 und 31 − 2 = 29 für das Trägerkürzel.
    expect(labels).toMatchObject([
      { type: 'text', content: 'PKW', anchor: 'middle', x: 16, y: 18 },
      { type: 'text', content: 'THW', anchor: 'end', x: 29, y: 24 },
    ]);
  });

  it('bleibt mit Fahrwerk innerhalb der Grundfläche', () => {
    expect(checkViewBox(composeFromCatalog(e21.spec))).toEqual([]);
  });

  it('nennt die Fahrzeugkategorie in der Beschreibung', () => {
    // Ohne sie wäre E.2.1 für eine Vorlesestimme von E.2.3 nicht zu unterscheiden — der
    // Unterschied liegt allein im Fahrwerk.
    expect(composeFromCatalog(e21.spec).description).toContain(
      'Fahrzeugkategorie: Kraftfahrzeugkategorie 1',
    );
  });

  it('gibt die Radkontur unfüllbar aus, auch bei gesetzter Organisationsfarbe', () => {
    // Die Radinnenflächen der Referenz sind Löcher. Eine Organisationsfüllung darf sie nicht
    // erreichen: sie sitzt am Körper, nicht an der Zone.
    const svg = renderSvg(composeFromCatalog(e21.spec), { size: 512 });
    expect(svg).toContain('<circle cx="10.63" cy="80.079" r="6.378" fill="none"');
    expect(svg).toContain('<circle cx="80.079" cy="80.079" r="6.378" fill="none"');
  });
});

/**
 * **Die einzige Pixelevidenz dieses Slice, die im Repo laufen kann.** Kein Katalogeintrag und kein
 * Rezept setzt `vehicleCategory`; damit sieht kein Snapshot, kein Mehrgrößenfall und kein
 * Themebogen jemals eine Marke mit `role: 'chassis'`. Der Rasterabgleich gegen `5.1.1.x` steht in
 * `docs/decisions/2026-08-18-grundlagen-restpunkte.md`, Abschnitt 1.6, und braucht den
 * Referenzordner, der nie eingecheckt wird.
 *
 * Diese drei Zusicherungen schließen die Lücke so weit, wie sie ohne einen Katalogeintrag zu
 * schließen ist: sie prüfen die **Renderer-Ausgabe** für alle drei Markenarten, nicht nur die
 * `ChassisShape`. Ohne sie fiele eine Regression im Renderer — etwa ein verlorenes `rx` am
 * Stadion — durch jedes Gate dieses Repos.
 */
describe('Fahrwerkszone — Rendererausgabe je Markenart', () => {
  const svgFor = (id: VehicleCategoryId): string =>
    renderSvg(composeFromCatalog({ kind: 'vehicle-land', vehicleCategory: id }), { size: 512 });

  it('gibt das Rad als ungefüllten Kreis aus', () => {
    // 3,75 mm · 2,8346 = 10,63 Einheiten; Radius 2,25 mm = 6,378; Strich 0,5 mm = 1,417.
    expect(svgFor('kfz-kategorie-1')).toContain(
      '<circle cx="10.63" cy="80.079" r="6.378" fill="none" stroke="#000000" stroke-width="1.417"/>',
    );
  });

  it('gibt die Kette als Rechteck mit rx aus', () => {
    // Der Fall, der `rx` überhaupt in den Bestand bringt: ohne das Attribut wäre das Stadion ein
    // scharfkantiges Rechteck, und kein Snapshot des Repos zeigte den Unterschied.
    expect(svgFor('kettenfahrzeug')).toContain(
      '<rect x="5.669" y="73.701" width="79.37" height="12.756" rx="6.378" fill="none" ' +
        'stroke="#000000" stroke-width="1.417"/>',
    );
  });

  it('gibt beide Verbindungsstriche als Linien zwischen benachbarten Rädern aus', () => {
    const svg = svgFor('kfz-kategorie-3');
    expect(svg).toContain('<line x1="17.008" y1="80.079" x2="38.976" y2="80.079" fill="none"');
    expect(svg).toContain('<line x1="51.732" y1="80.079" x2="73.701" y2="80.079" fill="none"');
    // Und sie liegen auf derselben Höhe wie die Radmitten — dieselbe Zahl 80,079.
    expect(svg).toContain('<circle cx="45.354" cy="80.079" r="6.378" fill="none"');
  });
});
