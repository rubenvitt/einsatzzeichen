import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VIEWBOX_MM,
  type ColorToken,
  type Primitive,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import type { BoundsMm } from './bounds.js';
import { bodyLabelInk, compose, type CatalogPorts, type ComposeOptions } from './compose.js';
import { CompositionError } from './validate.js';
import { ARIMO_CAP_HEIGHT_FRACTION } from './render/text-policy.js';
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

/** Gemessene Hüllen der beiden F.2-Fahrzeugkörper; die Form selbst ist für diese Porttests egal. */
const vehicleLandBody: Primitive = {
  type: 'rect', role: 'body', x: 1, y: 5.75, width: 30, height: 20.25,
};
const vehicleAirBody: Primitive = {
  type: 'rect', role: 'body', x: 1.01, y: 6, width: 29.98, height: 14.99,
};
/** Exakter `raised-hull`-Körperpfad aus `base-symbols.ts` für die quellennahe Komposition. */
const measuredRaisedVehicleAirBody: Primitive = {
  type: 'path',
  role: 'body',
  d: 'M 30.9894 20.9898 L 1.01 20.9898 C 1.01 12.7112, 7.7211 6.0001, 15.9997 6.0001 C 24.2783 6.0001, 30.9894 12.7112, 30.9894 20.9898 Z',
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
  functionRole: () => {
    throw new Error('Für diesen Test nicht aufgerufen.');
  },
  administrativeHead: () => undefined,
  vehicleChassis: () => {
    throw new Error('Für diesen Test nicht aufgerufen.');
  },
  pictogram: () => {
    throw new Error('Für diesen Test nicht aufgerufen.');
  },
  bodyMark: () => {
    throw new Error('Für diesen Test nicht aufgerufen.');
  },
};

describe('compose() — inset-hull-Labelvertrag', () => {
  const insetHullCatalog: CatalogPorts = {
    ...catalog,
    organizationColor: () => 'weiss',
  };

  function insetHullDrawing(
    labels: NonNullable<SymbolSpec['labels']>,
    options: ComposeOptions = {},
  ) {
    return compose({
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
      labels,
    }, insetHullCatalog, options);
  }

  function restoreObjectPrototypeProperty(
    key: PropertyKey,
    descriptor: PropertyDescriptor | undefined,
  ): void {
    if (descriptor === undefined) {
      Reflect.deleteProperty(Object.prototype, key);
    } else {
      Object.defineProperty(Object.prototype, key, descriptor);
    }
  }

  it('lehnt geerbte Renderingfelder durch validateSpec vor der Komposition ab', () => {
    class InheritedRenderingLabels implements NonNullable<SymbolSpec['labels']> {
      readonly center = 'MzB';

      get inBodyInk(): 'schwarz' {
        return 'schwarz';
      }

      get centerCapHeightMm(): number {
        return 3.4099;
      }
    }

    expect(() => insetHullDrawing(new InheritedRenderingLabels()))
      .toThrow(/inset-hull-requires-center-label-only/);
  });

  it('ignoriert non-enumerable Renderingfelder auf Object.prototype', () => {
    const previousInk = Object.getOwnPropertyDescriptor(Object.prototype, 'inBodyInk');
    const previousCapHeight = Object.getOwnPropertyDescriptor(
      Object.prototype,
      'centerCapHeightMm',
    );

    try {
      Object.defineProperties(Object.prototype, {
        inBodyInk: {
          configurable: true,
          enumerable: false,
          value: 'weiss',
          writable: true,
        },
        centerCapHeightMm: {
          configurable: true,
          enumerable: false,
          value: 1,
          writable: true,
        },
      });

      const label = insetHullDrawing({ center: 'MzB' }).children.find(
        (child): child is Extract<Primitive, { type: 'text' }> =>
          child.type === 'text' && child.role === 'label',
      );
      expect(label?.style?.fill).toBe('schwarz');
      expect(label?.sizeMm).toBeCloseTo(4.87 / ARIMO_CAP_HEIGHT_FRACTION, 6);
    } finally {
      restoreObjectPrototypeProperty('inBodyInk', previousInk);
      restoreObjectPrototypeProperty('centerCapHeightMm', previousCapHeight);
    }
  });

  it('ignoriert einen geerbten center-Getter auf Object.prototype', () => {
    const previousCenter = Object.getOwnPropertyDescriptor(Object.prototype, 'center');

    try {
      Object.defineProperty(Object.prototype, 'center', {
        configurable: true,
        enumerable: false,
        get: () => 'GEERBT',
      });

      expect(insetHullDrawing({}).children.filter((child) => child.role === 'label')).toEqual([]);
    } finally {
      restoreObjectPrototypeProperty('center', previousCenter);
    }
  });

  it('komponiert Proxy-Labels ausschließlich aus validierten Data-Deskriptoren', () => {
    const labels = new Proxy({ center: 'MzB' } as NonNullable<SymbolSpec['labels']>, {
      get: (target, key, receiver) => {
        if (key === 'inBodyInk') return 'weiss';
        if (key === 'centerCapHeightMm') return 1;
        return Reflect.get(target, key, receiver);
      },
      getOwnPropertyDescriptor: (target, key) => Reflect.getOwnPropertyDescriptor(target, key),
      getPrototypeOf: () => Object.prototype,
      ownKeys: (target) => Reflect.ownKeys(target),
    });

    const label = insetHullDrawing(labels).children.find(
      (child): child is Extract<Primitive, { type: 'text' }> =>
        child.type === 'text' && child.role === 'label',
    );
    expect(label?.style?.fill).toBe('schwarz');
    expect(label?.sizeMm).toBeCloseTo(4.87 / ARIMO_CAP_HEIGHT_FRACTION, 6);
  });

  it('leitet die Beschreibung aus derselben vorbereiteten Spec wie die Geometrie ab', () => {
    const labels = new Proxy({ center: 'MzB' } as NonNullable<SymbolSpec['labels']>, {
      get: (target, key, receiver) => key === 'center'
        ? 'PROXY'
        : Reflect.get(target, key, receiver),
      getOwnPropertyDescriptor: (target, key) => Reflect.getOwnPropertyDescriptor(target, key),
      getPrototypeOf: () => Object.prototype,
      ownKeys: (target) => Reflect.ownKeys(target),
    });
    let describedCenter: string | undefined;
    const options: ComposeOptions = {
      descriptionFromSpec: (preparedSpec: SymbolSpec) => {
        describedCenter = preparedSpec.labels?.center;
        return `Kürzel: ${preparedSpec.labels?.center}`;
      },
    };

    const drawing = compose({
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
      labels,
    }, insetHullCatalog, options);
    const renderedLabels = drawing.children
      .filter(
        (child): child is Extract<Primitive, { type: 'text' }> =>
          child.type === 'text' && child.role === 'label',
      )
      .map((label) => label.content);
    expect(describedCenter).toBe('MzB');
    expect(drawing.description).toBe('Kürzel: MzB');
    expect(renderedLabels).toEqual(['MzB']);
  });

  it('friert inset-hull-Spec und Labelsnapshot vor dem Beschreibungs-Callback ein', () => {
    let callbackCalled = false;
    const options: ComposeOptions = {
      descriptionFromSpec: (preparedSpec: SymbolSpec) => {
        callbackCalled = true;
        expect(Object.isFrozen(preparedSpec)).toBe(true);
        expect(Object.isExtensible(preparedSpec)).toBe(false);
        expect(Object.isFrozen(preparedSpec.labels)).toBe(true);
        expect(Object.isExtensible(preparedSpec.labels)).toBe(false);
        expect(() => Object.defineProperty(preparedSpec, 'labels', {
          value: { center: 'MUTIERT' },
        })).toThrow(TypeError);
        expect(() => Object.defineProperty(preparedSpec.labels!, 'center', {
          value: 'MUTIERT',
        })).toThrow(TypeError);
        return `Kürzel: ${preparedSpec.labels?.center}`;
      },
    };

    const drawing = insetHullDrawing({ center: 'MzB' }, options);
    expect(callbackCalled).toBe(true);
    expect(drawing.description).toBe('Kürzel: MzB');
    expect(drawing.children.some(
      (child) => child.type === 'text' && child.role === 'label' && child.content === 'MzB',
    )).toBe(true);
  });
});

describe('compose() — technische Körperfüllung', () => {
  const whiteCatalog: CatalogPorts = {
    ...catalog,
    organizationColor: () => 'weiss',
  };

  it('füllt technisch weiß ohne Organisations-Kontursignatur', () => {
    const drawing = compose({
      kind: 'person',
      technicalFill: 'weiss',
    }, whiteCatalog);
    const body = drawing.children.find((child) => child.role === 'body');

    expect(body?.style).toMatchObject({ fill: 'weiss' });
    expect(body?.style?.bodyStrokeDashToken).toBeUndefined();
  });

  it('markiert eine echte weiße Organisation weiterhin für ihre Kontursignatur', () => {
    const drawing = compose({
      kind: 'person',
      organization: 'hilfsorganisation',
    }, whiteCatalog);
    const body = drawing.children.find((child) => child.role === 'body');

    expect(body?.style).toMatchObject({
      fill: 'weiss',
      bodyStrokeDashToken: 'weiss',
    });
  });
});

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

  it('kombiniert das vermessene Fußband an Landfahrzeug und Anhänger mit ihrer Radzone', () => {
    const footBandCatalog: CatalogPorts = {
      ...vehicleCatalog,
      baseDrawing: (kind) => ({
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [
          vehicleBody,
          {
            type: 'rect', role: 'pictogram',
            x: kind === 'trailer' ? 4 : 1,
            y: 23,
            width: kind === 'trailer' ? 27 : 30,
            height: 3,
          },
        ],
      }),
    };

    for (const kind of ['vehicle-land', 'trailer'] as const) {
      const drawing = compose({
        kind, bodyVariant: 'foot-band', vehicleCategory: 'kfz-kategorie-3',
      }, footBandCatalog);
      const roles = drawing.children.map((child) => child.role);
      expect(drawing.children).toContainEqual(
        expect.objectContaining({ type: 'rect', role: 'pictogram', y: 23, height: 3 }),
      );
      expect(drawing.children.filter((child) => child.role === 'chassis')).toHaveLength(3);
      expect(roles.indexOf('pictogram')).toBeLessThan(roles.indexOf('chassis'));
      expect(checkViewBox(drawing)).toEqual([]);
    }
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

  it('begrenzt einen je Rezept deklarierten Center-Boxrand auf genau diesen Lauf', () => {
    const drawing = compose({
      kind: 'formation',
      labels: {
        center: 'Strömungsrettung',
        centerBoxMarginMm: 0.5,
        bottomCenter: 'BC',
      },
    }, catalog);
    const labels = drawing.children.filter(
      (child): child is Extract<Primitive, { type: 'text' }> =>
        child.type === 'text' && child.role === 'label',
    );
    const center = labels.find((label) => label.content === 'Strömungsrettung');
    const bottomCenter = labels.find((label) => label.content === 'BC');
    if (center === undefined || bottomCenter === undefined) {
      throw new Error('compose() hat nicht beide mittigen Textläufe erzeugt.');
    }

    // Körper x=1…31 mm: der individuelle Rand erweitert ausschließlich die zugesicherte Box
    // auf x=1,5…30,5 mm. Anker und Standardposition bleiben unverändert.
    expect(center.boxMm).toMatchObject({ xMm: 1.5, widthMm: 29 });
    expect(center.x).toBe(16);
    expect(center.anchor).toBe('middle');
    expect(bottomCenter.boxMm).toMatchObject({ xMm: 2, widthMm: 28 });
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

  it('setzt gemessene relative Metriken für Mitte, obere Läufe und Oberfläche', () => {
    const metricCatalog: CatalogPorts = {
      ...catalog,
      baseDrawing: (kind) => ({
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [kind === 'circle-12'
          ? { type: 'circle', role: 'body', cx: 16, cy: 15, r: 12 }
          : kind === 'vehicle-air'
            ? vehicleAirBody
            : vehicleLandBody],
      }),
      organizationColor: (organization) => {
        if (organization !== 'zivile-einheiten') throw new Error('Für diesen Test nicht aufgerufen.');
        return 'hellgrau';
      },
      bodyMark: (id) => {
        if (id !== 'circle-information-stem') throw new Error('Für diesen Test nicht aufgerufen.');
        return [];
      },
    };

    const land = compose({
      kind: 'vehicle-land',
      labels: {
        center: 'BuPol',
        centerBaselineFromBodyBottomMm: 6.5,
        topLeftLines: ['Kipper,', '26 t'],
      },
    } as SymbolSpec, metricCatalog);
    const [center, first, second] = land.children.filter((child) => child.role === 'label');
    expect(center).toMatchObject({ type: 'text', content: 'BuPol', y: 19.5 });
    expect(first).toMatchObject({ type: 'text', content: 'Kipper,', x: 2.5, y: 12.5 });
    expect(second).toMatchObject({ type: 'text', content: '26 t', x: 2.5, y: 16.5 });

    const fixedWing = compose({
      kind: 'vehicle-air',
      bodyVariant: 'fixed-wing-hull',
      labels: {
        topLeft: '5.000',
        topLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: 7,
          anchorFromBodyLeftMm: 5.99,
        },
        aboveLeft: 'Cessna 172',
        aboveLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: -1,
          anchorFromBodyLeftMm: -0.01,
        },
      },
    } as SymbolSpec, metricCatalog);
    const fixedLabels = fixedWing.children.filter((child) => child.role === 'label');
    expect(fixedLabels).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'text', content: '5.000', x: 7, y: 13 }),
      expect.objectContaining({ type: 'text', content: 'Cessna 172', x: 1, y: 5 }),
    ]));

    const rotor = compose({
      kind: 'vehicle-air', bodyVariant: 'raised-hull',
      labels: {
        aboveLeft: 'CH-53',
        aboveLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: -1,
          anchorFromBodyLeftMm: -0.01,
        },
        surfaceBelowRight: 'BW',
      },
    } as SymbolSpec, metricCatalog);
    const [ch53, bw] = rotor.children.filter((child) => child.role === 'label');
    expect(ch53).toMatchObject({ type: 'text', content: 'CH-53', x: 1, y: 5 });
    expect(bw).toMatchObject({ type: 'text', content: 'BW', y: 29, style: { fill: 'schwarz' } });
    if (bw?.type !== 'text') throw new Error('BW-Oberflächenlauf fehlt.');
    expect(bw.x).toBeCloseTo(31, 10);

    expect(() => compose({
      kind: 'vehicle-air', bodyVariant: 'raised-hull',
      labels: { surfaceBelowLeft: 'X' },
    } as SymbolSpec, metricCatalog)).toThrow(/surface-left-label-requires-measured-anchor/);

    const circle = compose({
      kind: 'circle-12', bodyVariant: 'raised-circle-1mm',
      organization: 'zivile-einheiten', bodyMarks: ['circle-information-stem'],
      labels: { surfaceBelowLeft: '291300', surfaceBelowRight: 'ZIV' },
    } as SymbolSpec, metricCatalog);
    expect(circle.children.filter((child) => child.role === 'label')).toEqual([
      expect.objectContaining({ type: 'text', content: '291300', x: 1, y: 31, anchor: 'start' }),
      expect.objectContaining({ type: 'text', content: 'ZIV', x: 31, y: 31, anchor: 'end' }),
    ]);
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

const f2Catalog: CatalogPorts = {
  ...e2Catalog,
  baseDrawing: (kind) => ({
    viewBox: DEFAULT_VIEWBOX_MM,
    children: [kind === 'vehicle-air' ? vehicleAirBody : vehicleLandBody],
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

describe('compose() — gebänderte Logistikprofile', () => {
  const logisticsCatalog: CatalogPorts = {
    ...catalog,
    baseDrawing: (kind, variant) => {
      if (kind === 'circle-12') {
        return {
          viewBox: DEFAULT_VIEWBOX_MM,
          children: [
            { type: 'circle', role: 'body', cx: 16, cy: 16, r: 12 },
            ...(variant === 'foot-band'
              ? [{
                  type: 'path' as const, role: 'pictogram' as const,
                  d: 'M 7.4048 24.0005 H 24.5954 C 22.479 26.5508 19.0883 27.7505 16 27.7505 C 12.9117 27.7505 9.5204 26.5508 7.4048 24.0005 Z',
                }]
              : []),
          ],
        };
      }
      return {
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [
          formationBody,
          ...(variant === 'foot-band'
            ? [{ type: 'rect' as const, role: 'pictogram' as const, x: 1, y: 23, width: 30, height: 3 }]
            : []),
        ],
      };
    },
    organizationColor: (id) => id === 'bundeswehr' ? 'braun' : 'weiss',
    strengthHead: () => ({
      heightMm: 3,
      marks: [{ cxMm: 16, cyFromTopMm: 1.5, rMm: 1.5 }],
    }),
    bodyMark: () => [],
  };

  it('komponiert die drei vermessenen Formationsköpfe ohne das Fußband zu verschieben', () => {
    for (const strength of ['trupp', 'gruppe', 'zug'] as const) {
      const drawing = compose(
        { kind: 'formation', bodyVariant: 'foot-band', strength }, logisticsCatalog,
      );
      expect(drawing.children).toContainEqual(
        expect.objectContaining({ type: 'rect', role: 'pictogram', y: 23, height: 3 }),
      );
      expect(drawing.children).toContainEqual(
        expect.objectContaining({ type: 'circle', role: 'head', cy: 3.5 }),
      );
    }
  });

  it('setzt DLRG am gebänderten Formationskörper auf die vermessene Grundlinie y=21', () => {
    const label = compose({
      kind: 'formation', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
      labels: { bottomRight: 'DLRG' },
    }, logisticsCatalog).children.find((child) => child.role === 'label');
    expect(label).toMatchObject({
      type: 'text', content: 'DLRG', anchor: 'end', x: 29, y: 21,
      style: { fill: 'schwarz' },
    });
  });

  it('setzt Diesel im Kreis und Bw außerhalb auf die beiden vermessenen Grundlinien', () => {
    const drawing = compose({
      kind: 'circle-12', bodyVariant: 'foot-band', organization: 'bundeswehr',
      labels: { bottomCenter: 'Diesel', belowRight: 'Bw' },
    }, logisticsCatalog);
    const labels = drawing.children.filter((child) => child.role === 'label');
    expect(labels).toMatchObject([
      {
        type: 'text', content: 'Diesel', anchor: 'middle', x: 16, y: 22,
        style: { fill: 'schwarz' },
      },
      { type: 'text', content: 'Bw', anchor: 'end', x: 31, y: 29, style: { fill: 'schwarz' } },
    ]);
    expect(checkViewBox(drawing)).toEqual([]);
  });

  it('lässt den generischen inBodyInk-Override nicht in die schwarze G-bottomCenter-Zone lecken', () => {
    const drawing = compose({
      kind: 'circle-12', bodyVariant: 'foot-band', organization: 'bundeswehr',
      labels: { bottomCenter: 'Diesel', inBodyInk: 'weiss' },
    }, logisticsCatalog);
    expect(drawing.children.find(
      (child) => child.type === 'text' && child.content === 'Diesel',
    )).toMatchObject({ style: { fill: 'schwarz' } });
  });

  it('meldet belegte Labelzonen als neutralen Layoutkontext an den Körpermarken-Port', () => {
    const contexts: Parameters<NonNullable<CatalogPorts['bodyMark']>>[1][] = [];
    compose({
      kind: 'circle-12', bodyVariant: 'foot-band', organization: 'bundeswehr',
      bodyMarks: ['fuels-consumables'], labels: { bottomCenter: 'Diesel', belowRight: 'Bw' },
    }, {
      ...logisticsCatalog,
      bodyMark: (_id, context) => {
        contexts.push(context);
        return [];
      },
    });
    expect(contexts).toEqual([{
      kind: 'circle-12', bodyVariant: 'foot-band',
      occupiedLabelZones: ['bottomCenter', 'belowRight'],
    }]);
  });

  it('reicht die Fahrzeugkategorie als Geometriekontext an den Körpermarken-Port', () => {
    const contexts: Parameters<NonNullable<CatalogPorts['bodyMark']>>[1][] = [];
    compose({
      kind: 'vehicle-land', organization: 'hilfsorganisation',
      vehicleCategory: 'kfz-kategorie-2', bodyMarks: ['water-rescue'],
    }, {
      ...f2Catalog,
      organizationColor: () => 'weiss',
      bodyMark: (_id, context) => {
        contexts.push(context);
        return [];
      },
    });
    expect(contexts).toEqual([{
      kind: 'vehicle-land', vehicleCategory: 'kfz-kategorie-2',
    }]);
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

describe('compose() — Beschriftungszone oben links', () => {
  /** Die F.1-Konstellation: weisser Körper, links verankertes Fachdienstkürzel im oberen Feld. */
  const topLeftSpec = { kind: 'formation', labels: { topLeft: 'MTF' } } as const;

  it('setzt Anker und Grundlinie auf die an F.1.1 bis F.1.11 vermessenen Zahlen', () => {
    // Eigene Vermessung vom 18. August 2026 an den neun beschrifteten Zeichen aus F.1.1 bis
    // F.1.11: Anker 1,5 mm rechts der linken Körperkante, Grundlinie 5,0 mm unter der
    // Körperoberkante. Am Formationskörper (Hülle 1/6 bis 31/26) sind das die absoluten Werte
    // 2,5 und 11,0. Gerechnet wird gegen die **Hülle**, nicht gegen die Grundfläche — sonst
    // wanderte der Lauf nicht mit, wenn eine Kopfzone den Körper nach unten schiebt.
    const label = compose(topLeftSpec, catalog).children.find((child) => child.role === 'label');
    if (label?.type !== 'text') throw new Error('compose() hat keinen Lauf oben links erzeugt.');
    expect(label.content).toBe('MTF');
    expect(label.anchor).toBe('start');
    expect(label.x).toBe(2.5);
    expect(label.y).toBe(11);
  });

  it('führt die Zonenbox bis zur rechten Innenmarge des Körpers', () => {
    // F.1.12 erweitert die Evidenz aus F-a: „ÜMANV-S" überschreitet die senkrechte Mittellinie
    // sichtbar. Der Anker bleibt auf x = 2,5 mm; die Box 2,5…29,0 mm hält den längsten Lauf,
    // ohne eine falsche Clipping-Grenze am Kreuz zu behaupten. Geprüft werden wie bei den unteren Zonen nur die **waagerechten**
    // Felder, weil `yMm`/`heightMm` aus `verticalTextBoxMm` stammen und eine Prüfung gegen
    // dieselbe Funktion ein Kreisschluss wäre.
    const label = compose(topLeftSpec, catalog).children.find((child) => child.role === 'label');
    if (label?.type !== 'text') throw new Error('unreachable');
    expect(label.boxMm).toMatchObject({ xMm: 2.5, widthMm: 26.5 });
  });

  it('benutzt den Schriftgrad der unteren Zonen unverändert', () => {
    // Gemessene Versalhöhe 2,92 mm — derselbe Grad wie unten links und unten rechts. Geprüft
    // gegen den bestehenden unteren Lauf und nicht gegen die Konstante: die Zusicherung ist
    // „derselbe Grad", nicht „diese Zahl".
    const [topLeft, bottomLeft] = compose(
      { kind: 'formation', labels: { topLeft: 'MTF', bottomLeft: 'A' } },
      catalog,
    ).children.filter((child) => child.role === 'label');
    if (topLeft?.type !== 'text' || bottomLeft?.type !== 'text') throw new Error('unreachable');
    expect(topLeft.sizeMm).toBe(bottomLeft.sizeMm);
  });

  it('lehnt die Zone an jeder Körperform ohne vermessene Grundlinie ab', () => {
    // `building` läuft über `rectBodyProfile`, das die Zahl nicht führt — sie steht allein am
    // eigenen Profil der taktischen Formation. Ohne den Wurf wäre die geratene Grundlinie
    // minY + 5 = 8 mm, und auf y = 8 führt das Gebäudepolygon nur die Breite 5,286…26,714
    // (Traufkante von (16|3) nach (1|10)): der Anker 2,5 läge **außerhalb** des Umrisses, und
    // kein Gate meldete es. Der Landfahrzeugrumpf trägt denselben Lauf auf 6,75 mm unter seiner
    // Oberkante (F.2.1 bis F.2.5) — die Zahl ist je Körperform eine eigene Messung.
    //
    // Geprüft wird der Regelkode und nicht die Prosa: die Ablehnung steht seit dem Teilslice F-a
    // in `validateSpec` und trägt damit dieselbe maschinenlesbare Kennung wie ihr Geschwisterfall
    // `below-right-label-requires-measured-body`. Der Wurf in `compose.ts` bleibt als
    // unerreichbare Zusicherung stehen.
    expect(() => compose({ kind: 'building', labels: { topLeft: 'MTF' } }, catalog)).toThrow(
      /top-left-label-requires-measured-body/,
    );
  });

  it('passiert das viewBox-Gate mit allen vier Zonen im Körper', () => {
    const drawing = compose(
      { kind: 'formation', labels: { topLeft: 'MTF', center: 'K', bottomLeft: 'A', bottomRight: 'THW' } },
      catalog,
    );
    expect(checkViewBox(drawing)).toEqual([]);
  });

  it('setzt das Landfahrzeugkürzel auf die um 6,75 mm versetzte Grundlinie', () => {
    const drawing = compose(
      { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', labels: { topLeft: 'KTW' }, bodyMarks: ['medical-service'] },
      {
        ...f2Catalog,
        bodyMark: (_id, context, bounds) => {
          expect(context).toEqual({ kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair' });
          expect(bounds).toEqual({ minX: 1, minY: 5.75, maxX: 31, maxY: 26 });
          return [];
        },
      },
    );
    const label = drawing.children.find((child) => child.role === 'label');
    expect(label).toMatchObject({ type: 'text', content: 'KTW', x: 2.5, y: 12.5 });
  });

  it('setzt die drei explizit gemessenen F-d-Metriken am bestehenden topLeft-Lauf', () => {
    const spec = {
      kind: 'vehicle-land',
      labels: {
        topLeft: 'BTKombi',
        topLeftMetrics: {
          capHeightMm: 2.191447,
          baselineFromBodyTopMm: 5.249923,
          anchorFromBodyLeftMm: 0.51423,
        },
      },
    } as unknown as SymbolSpec;
    const drawing = compose(spec, f2Catalog);
    const label = drawing.children.find((child) => child.role === 'label');
    if (label?.type !== 'text') throw new Error('compose() hat den F-d-Lauf nicht erzeugt.');

    expect(label).toMatchObject({
      content: 'BTKombi',
      anchor: 'start',
      x: 1.51423,
      boxMm: { xMm: 1.51423, widthMm: 27.48577 },
    });
    expect(label.y).toBeCloseTo(10.999923, 9);
    // 2.191447 mm Versalhöhe / (1409/2048) — der Faktor ist aus der eingebetteten Arimo-Datei
    // vermessen. Ein direkter Schriftgrad wäre nicht die Quellenmessung.
    expect(label.sizeMm).toBeCloseTo(3.1852969879, 9);
  });
});

describe('compose() — die beiden expliziten F.2-Sonderzonen', () => {
  it('setzt ITH oberhalb des Luftfahrzeugkörpers statt in eine Seitenzone', () => {
    const drawing = compose(
      { kind: 'vehicle-air', bodyVariant: 'raised-hull', labels: { aboveLeft: 'ITH' } },
      f2Catalog,
    );
    const label = drawing.children.find((child) => child.role === 'label');
    expect(label).toMatchObject({
      type: 'text', content: 'ITH', anchor: 'start', x: 1, y: 6,
      style: { fill: 'schwarz' },
    });
    expect(checkViewBox(drawing)).toEqual([]);
  });

  it('setzt GW-San und 50 als zwei linksbündige Läufe auf getrennte Grundlinien', () => {
    const drawing = compose(
      { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', labels: { topLeftLines: ['GW-San', '50'] } },
      f2Catalog,
    );
    const labels = drawing.children.filter((child) => child.role === 'label');
    expect(labels).toMatchObject([
      { type: 'text', content: 'GW-San', anchor: 'start', x: 2.5, y: 11.54 },
      { type: 'text', content: '50', anchor: 'start', x: 2.5, y: 15.07 },
    ]);
    expect(labels).toHaveLength(2);
    expect(checkViewBox(drawing)).toEqual([]);
  });

  it('verschluckt bei einem Runtime-Vertragsbruch keine dritte Zeile', () => {
    const invalid = ['GW-San', '50', 'Reserve'] as unknown as readonly [string, string];
    expect(() => compose(
      {
        kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair',
        labels: { topLeftLines: invalid },
      },
      f2Catalog,
    )).toThrow(/exakt zwei/);
  });
});

describe('compose() — die aus der weißen Körperfläche abgeleiteten F.3-Kreislabels', () => {
  const circleCatalog: CatalogPorts = {
    ...catalog,
    baseDrawing: (_kind, variant) => ({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [{
        type: 'circle', role: 'body', cx: 16, cy: variant === 'raised-gable' ? 18 : 16, r: 12,
        style: { fill: 'weiss', stroke: 'schwarz', strokeWidth: 0.5 },
      }],
    }),
    organizationColor: () => 'weiss',
  };

  it('setzt UHS mit den quellengenauen Normal-Kreis-Metriken schwarz', () => {
    const spec = {
      kind: 'circle-12', organization: 'hilfsorganisation',
      labels: {
        topLeft: 'UHS',
        topLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: 1.000254,
          anchorFromBodyLeftMm: -2.984684,
        },
      },
    } as unknown as SymbolSpec;
    const label = compose(spec, circleCatalog).children.find((child) => child.role === 'label');
    expect(label).toMatchObject({
      type: 'text', content: 'UHS', x: 1.015316, y: 5.000254,
      sizeMm: 2.919225 / ARIMO_CAP_HEIGHT_FRACTION,
      style: { fill: 'schwarz' },
    });
  });

  it('setzt 50 oberhalb der raised-gable-Kreisfläche und innerhalb der ViewBox', () => {
    const spec = {
      kind: 'circle-12', bodyVariant: 'raised-gable', organization: 'hilfsorganisation',
      labels: {
        topLeft: '50',
        topLeftMetrics: {
          capHeightMm: 2.749893,
          baselineFromBodyTopMm: -0.999746,
          anchorFromBodyLeftMm: -2.974002,
        },
      },
    } as unknown as SymbolSpec;
    const drawing = compose(spec, circleCatalog);
    const label = drawing.children.find((child) => child.role === 'label');
    expect(label).toMatchObject({
      type: 'text', content: '50', x: 1.025998, y: 5.000254,
      sizeMm: 2.749893 / ARIMO_CAP_HEIGHT_FRACTION,
      style: { fill: 'schwarz' },
    });
    expect(checkViewBox(drawing)).toEqual([]);
  });
});

describe('compose() — Beschriftungszone unten mittig', () => {
  it('setzt SOZ auf die an F.1.18 und F.1.20 vermessene untere Mitte', () => {
    // Beide Referenzen führen den Lauf auf derselben Grundlinie wie die unteren E-Zonen, aber
    // waagerecht um x = 16 mm zentriert. `bottomLeft` wäre ein anderes Bild: Anker x = 3 mm.
    const label = compose(
      { kind: 'formation', labels: { bottomCenter: 'SOZ' } },
      catalog,
    ).children.find((child) => child.role === 'label');
    if (label?.type !== 'text') throw new Error('compose() hat keinen Lauf unten mittig erzeugt.');
    expect(label.content).toBe('SOZ');
    expect(label.anchor).toBe('middle');
    expect(label.x).toBe(16);
    expect(label.y).toBe(24);
    expect(label.boxMm).toMatchObject({ xMm: 2, widthMm: 28 });
  });

  it('lehnt die Zone an jeder Körperform ohne vermessene Grundlinie ab', () => {
    expect(() => compose(
      { kind: 'building', labels: { bottomCenter: 'SOZ' } },
      catalog,
    )).toThrow(/bottom-center-label-requires-measured-body/);
  });
});

describe('compose() — Schriftfarbe der Läufe im Körper', () => {
  function inkOf(
    spec: Parameters<typeof compose>[0],
    bodyFill?: ColorToken,
  ): ColorToken | 'none' | undefined {
    const drawing = compose(spec, {
      ...catalog,
      ...(bodyFill !== undefined ? { organizationColor: () => bodyFill } : {}),
    });
    return drawing.children.find((child) => child.role === 'label')?.style?.fill;
  }

  it('setzt schwarz auf die weisse Körperfläche', () => {
    // Der Regelfall des Anhangs F: alle 66 F-Dateien führen die Füllung `#fff` und ihre
    // Typo-Ebene ohne `fill`, also in Schwarz (nachgesehen an allen zwölf Dateien aus F.1.1 bis
    // F.1.11). Bis Anhang F stand die Tinte fest auf `weiss` — ein weisser Lauf auf weissem
    // Körper wäre unsichtbar, und zwar unbemerkt: das A11y-Gate prüft die Paare, die der Katalog
    // anmeldet, und ein Zeichen, das seinen eigenen Lauf verschluckt, meldet kein Paar an.
    expect(inkOf({ kind: 'formation', labels: { topLeft: 'MTF' } })).toBe('schwarz');
  });

  it('setzt weiss auf die Organisationsfarbe blau', () => {
    // Der Regelfall des Anhangs E: alle 37 Zeichen aus E.1 setzen ihre Kürzel weiss auf die
    // gefüllte Fläche. `thw` (`#003296`) ist der Fall, der beide Anhänge auseinanderhält.
    expect(inkOf({ kind: 'formation', organization: 'thw', labels: { center: 'B' } }, 'blau')).toBe(
      'weiss',
    );
  });

  it('setzt weiss auch auf orange — die entschiedene Ausnahme E.2.6 bleibt unberührt', () => {
    // Der eigentliche Punkt dieses Blocks. Eine Ableitung nach Kontrastverhältnis („von weiss
    // und schwarz gewinnt das höhere Verhältnis") kippte genau dieses Zeichen: orange `#fa8c00`
    // trägt gegen schwarz 9,6:1 und gegen weiss 2,2:1. Die Referenz setzt dort trotzdem weiss,
    // und der Katalog führt das seit dem 18. August 2026 als entschiedene Ausnahme in
    // `CONTRAST_EXCEPTIONS` (`contrast-exceptions.ts`) — mit der ausdrücklich verworfenen
    // Gegenoption „dunkles statt weisses Trägerkürzel". Eine Kontrastableitung hätte diese
    // Entscheidung still überschrieben, ohne dass ein Gate anschlüge: das A11y-Gate wäre danach
    // grün gewesen und das Bild falsch. Die Regel lautet deshalb „die Farbe, die die Quelle
    // setzt", nicht „die mit dem besseren Kontrast".
    expect(
      inkOf(
        { kind: 'formation', organization: 'sonstige-gefahrenabwehr', labels: { center: 'B' } },
        'orange',
      ),
    ).toBe('weiss');
  });

  it('behält ohne Override die bestehende Ableitung am exportierten Resolver bei', () => {
    expect(bodyLabelInk('weiss')).toBe('schwarz');
    expect(bodyLabelInk('braun')).toBe('weiss');
    expect(bodyLabelInk('braun', 'schwarz')).toBe('schwarz');
  });

  it('setzt den gemessenen schwarzen Override in Mitte und oberen Körperzonen', () => {
    const specs = [
      {
        kind: 'formation', organization: 'bundeswehr',
        labels: { center: 'BuPol', inBodyInk: 'schwarz' },
      },
      {
        kind: 'formation', organization: 'bundeswehr',
        labels: { topLeft: '5.000', inBodyInk: 'schwarz' },
      },
      {
        kind: 'vehicle-land', organization: 'bundeswehr',
        labels: { topLeftLines: ['Kipper,', '26 t'], inBodyInk: 'schwarz' },
      },
    ] as unknown as SymbolSpec[];

    for (const spec of specs) {
      const labels = compose(spec, {
        ...catalog,
        organizationColor: () => 'braun',
      }).children.filter((child) => child.role === 'label');
      expect(labels.length).toBeGreaterThan(0);
      expect(labels.every((label) => label.style?.fill === 'schwarz')).toBe(true);
    }
  });

  it('lässt oberhalb und auf der Oberfläche liegende Tinten vom Override unberührt', () => {
    const drawing = compose({
      kind: 'vehicle-air', bodyVariant: 'raised-hull', organization: 'hilfsorganisation',
      labels: {
        center: 'Innen', aboveLeft: 'Oben', surfaceBelowRight: 'Außen', inBodyInk: 'weiss',
      },
    } as unknown as SymbolSpec, {
      ...catalog,
      baseDrawing: () => ({
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [measuredRaisedVehicleAirBody],
      }),
      organizationColor: () => 'weiss',
    });
    const fills = Object.fromEntries(drawing.children
      .filter((child): child is Extract<Primitive, { type: 'text' }> => child.type === 'text')
      .map((label) => [label.content, label.style?.fill]));
    expect(fills).toEqual({ Innen: 'weiss', Oben: 'schwarz', Außen: 'schwarz' });
  });
});

describe('compose() — vollständig vermessener Lauf unten rechts', () => {
  const bottomRightMetrics = {
    capHeightMm: 2.750245,
    baselineFromBodyTopMm: 13.000087,
    anchorFromBodyLeftMm: 21.99,
    boxLeftFromBodyLeftMm: 19.24,
    boxWidthMm: 5.5,
  };

  it('setzt die schwarze 7 quellengenau und mittig in das 5,5-mm-Feld', () => {
    const measuredBox: Primitive = {
      type: 'rect', role: 'pictogram', x: 20.25, y: 15, width: 5.5, height: 5.5,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
    };
    const drawing = compose({
      kind: 'vehicle-air', bodyVariant: 'raised-hull', organization: 'bundeswehr',
      bodyMarks: ['air-quartering-up-arrow-box'],
      labels: {
        bottomRight: '7', bottomRightMetrics, inBodyInk: 'schwarz',
      },
    } as unknown as SymbolSpec, {
      ...catalog,
      baseDrawing: () => ({
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [measuredRaisedVehicleAirBody],
      }),
      organizationColor: () => 'braun',
      bodyMark: (id) => {
        if (id !== 'air-quartering-up-arrow-box') {
          throw new Error(`Unerwartete Körpermarke: ${id}`);
        }
        return [measuredBox];
      },
    });

    const label = drawing.children.find(
      (child): child is Extract<Primitive, { type: 'text' }> =>
        child.type === 'text' && child.content === '7',
    );
    if (label === undefined) throw new Error('compose() hat den gemessenen Lauf nicht erzeugt.');
    expect(label).toMatchObject({
      anchor: 'middle', x: 23, y: 19.000187,
      boxMm: { xMm: 20.25, widthMm: 5.5 },
      style: { fill: 'schwarz' },
    });
    expect(label.sizeMm * ARIMO_CAP_HEIGHT_FRACTION).toBeCloseTo(2.750245, 9);
    expect(label.boxMm.yMm).toBeGreaterThanOrEqual(measuredBox.y);
    expect(label.boxMm.yMm + label.boxMm.heightMm)
      .toBeLessThanOrEqual(measuredBox.y + measuredBox.height);
  });
});

describe('compose() — randbündige Fachdienstzeichen', () => {
  it('reicht Art und Körpervariante als expliziten Portkontext weiter', () => {
    const seen: unknown[] = [];
    const markCatalog: CatalogPorts = {
      ...catalog,
      baseDrawing: (_kind, variant) => ({
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [formationBody, ...(variant === 'foot-band' ? [{
          type: 'rect' as const,
          role: 'pictogram' as const,
          x: 1,
          y: 23,
          width: 30,
          height: 3,
        }] : [])],
      }),
      bodyMark: (_id, context) => {
        seen.push(context);
        return [];
      },
    };

    compose(
      { kind: 'formation', bodyVariant: 'foot-band', bodyMarks: ['care'] },
      markCatalog,
    );
    expect(seen).toEqual([{ kind: 'formation', bodyVariant: 'foot-band' }]);
  });

  it('reicht die Hülle des platzierten Körpers an den Port, nicht die Standardgeometrie', () => {
    // Der Unterschied ist nur mit Kopfzone sichtbar: ohne sie liefern beide Lesarten dieselbe
    // Hülle. Mit `strengthHead('staffel')` (Stapel zweier Marken, `heightMm` 7 — dieselben
    // Zahlen wie im Fußzonenblock oben, fest verdrahtet, weil `core` nicht von `catalog`
    // abhängen darf) verschiebt `rectBodyProfile.place()` den Körper um 3 mm nach unten:
    // minY 6 → 9, maxY 26 → 29. Bekäme `bodyMark()` die Standardhülle, läge die
    // Fachdienstteilung 3 mm über dem Körper — und weil `body-marks.ts` jede Hülle außer
    // 30 × 20 mm ablehnt, fiele das dort gerade **nicht** auf: die verschobene Hülle misst
    // dieselben 30 × 20 mm.
    const seen: BoundsMm[] = [];
    const markCatalog: CatalogPorts = {
      ...catalog,
      strengthHead: () => ({
        marks: [
          { cxMm: 16, cyFromTopMm: 1.5, rMm: 1.5 },
          { cxMm: 16, cyFromTopMm: 5.5, rMm: 1.5 },
        ],
        heightMm: 7,
      }),
      bodyMark: (_id, _context, bodyBoundsMm) => {
        seen.push(bodyBoundsMm);
        return [];
      },
    };
    compose(
      { kind: 'formation', strength: 'staffel', bodyMarks: ['medical-service'] },
      markCatalog,
    );
    expect(seen).toEqual([{ minX: 1, minY: 9, maxX: 31, maxY: 29 }]);
  });

  it('zeichnet die Marken nach Körper und Boxpiktogramm und vor den Beschriftungen', () => {
    // Die Zusicherung aus `compose.ts` ist **dreiteilig**: die randbündigen Marken stehen nach
    // dem gefüllten Körper, nach den Boxpiktogrammen und vor den Beschriftungen. Anhang F setzt
    // „MTF" über das obere linke Viertel der Teilung — die Marken liegen auf der Körperfläche
    // wie die Kürzel, und die Kürzel liegen auf ihnen; ein Boxpiktogramm im selben Zeichen liegt
    // unter beiden.
    //
    // Geprüft **per Bauform und nicht per Rolle**: Boxpiktogramm und randbündige Marke tragen
    // beide `role: 'pictogram'`, `indexOf('pictogram')` träfe deshalb immer nur das erste der
    // beiden, und die mittlere der drei Kanten bliebe unbelegt — ein Test, der die Umstellung
    // „Marke vor Piktogramm" gar nicht bemerkte. Unterscheidbar sind sie an ihrer Bauform:
    // `compose()` fasst die Boxpiktogramme in eine `group` mit Verschiebung, die randbündigen
    // Marken übernimmt es einzeln so, wie der Port sie liefert.
    const markCatalog: CatalogPorts = {
      ...catalog,
      organizationColor: () => 'blau',
      pictogram: (id) => ({
        id,
        variant: 'primary',
        title: 'Doppel',
        viewBox: DEFAULT_VIEWBOX_MM,
        box: { xMm: 4, yMm: 8, widthMm: 24, heightMm: 16 },
        primitives: [{ type: 'circle', role: 'pictogram', cx: 16, cy: 16, r: 3 }],
      }),
      bodyMark: () => [
        { type: 'line', role: 'pictogram', x1: 16, y1: 6, x2: 16, y2: 26, style: { stroke: 'schwarz', strokeWidth: 0.5 } },
      ],
    };
    const children = compose(
      {
        kind: 'formation',
        organization: 'thw',
        capabilities: ['fire-fighting'],
        bodyMarks: ['medical-service'],
        labels: { topLeft: 'MTF' },
      },
      markCatalog,
    ).children;
    const bodyIndex = children.findIndex((child) => child.role === 'body');
    const boxIndex = children.findIndex(
      (child) => child.role === 'pictogram' && child.type === 'group',
    );
    const markIndex = children.findIndex(
      (child) => child.role === 'pictogram' && child.type === 'line',
    );
    const labelIndex = children.findIndex((child) => child.role === 'label');
    // Erst die Anwesenheit: ein fehlendes Stück ergäbe −1 und machte jeden Größenvergleich
    // darunter zu einer wahren Aussage über nichts.
    expect([bodyIndex, boxIndex, markIndex, labelIndex]).not.toContain(-1);
    expect(bodyIndex).toBeLessThan(boxIndex);
    expect(boxIndex).toBeLessThan(markIndex);
    expect(markIndex).toBeLessThan(labelIndex);
  });

  it('setzt bewusst geteilte Primitive einmal, ohne bloß gleiche Geometrie zu verschlucken', () => {
    const sharedQuartering: Primitive = {
      type: 'line',
      role: 'pictogram',
      x1: 16,
      y1: 6,
      x2: 16,
      y2: 26,
      style: { stroke: 'schwarz', strokeWidth: 0.5 },
    };
    const sameGeometry = (): Primitive => ({
      type: 'line',
      role: 'pictogram',
      x1: 16,
      y1: 6,
      x2: 16,
      y2: 26,
      style: { stroke: 'schwarz', strokeWidth: 0.5 },
    });
    const markCatalog: CatalogPorts = {
      ...catalog,
      bodyMark: () => [sharedQuartering, sameGeometry()],
    };

    const lines = compose(
      { kind: 'formation', bodyMarks: ['medical-service', 'physician'] },
      markCatalog,
    ).children.filter((child) => child.type === 'line' && child.role === 'pictogram');

    // Nur dieselbe, bewusst zwischen den beiden Markengruppen geteilte Referenz ist
    // idempotent. Die beiden separat erzeugten, geometrisch identischen Linien bleiben beide
    // erhalten: eine strukturelle Deduplizierung könnte echte Deckzeichnungen verschlucken.
    expect(lines).toHaveLength(3);
    expect(lines.filter((line) => line === sharedQuartering)).toHaveLength(1);
  });

  it('fragt den Port ohne `bodyMarks` gar nicht', () => {
    // Das Katalog-Doppel `catalog` wirft in `bodyMark` — der Test belegt damit zugleich, dass
    // ein Zeichen ohne randbündige Marken den Port nicht anfasst.
    // Dass `compose()` überhaupt zurückkehrt, **ist** die Zusicherung — eine Zählung der
    // Kinderliste bewiese sie nicht: ein Doppel, das statt zu werfen `[]` lieferte, ergäbe
    // dieselbe leere Liste.
    expect(() => compose({ kind: 'formation', labels: { topLeft: 'MTF' } }, catalog)).not.toThrow();
  });
});

describe('compose() — gemessene Funktionsträger', () => {
  it('konsumiert die aufgelöste Rolle und hält die gemessene Kindreihenfolge', () => {
    const roleDefinition = {
      id: 'incident-command',
      title: 'Einsatzleitung',
      kind: 'formation',
      expectedHead: 'none',
      expectedOrganization: 'fuehrung-leitung',
      allowedBodyMarks: ['care'],
      layout: {
        body: {
          type: 'rect', role: 'body', x: 2, y: 8, width: 28, height: 16,
          style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
        },
        bodyAdditions: [
          { type: 'line', role: 'bodyExtra', x1: 2, y1: 24, x2: 30, y2: 24 },
        ],
        decorations: [
          { type: 'rect', role: 'pictogram', x: 2, y: 8, width: 28, height: 3 },
        ],
        roleRuns: [{
          content: 'EL', anchorXMm: 16, baselineYMm: 19, sizeMm: 7,
          anchor: 'middle', boxMm: { xMm: 10, yMm: 13, widthMm: 12, heightMm: 6 },
          minRenderPx: 37, ink: 'schwarz', contrastBackground: 'body',
        }],
        carrierRun: {
          content: 'AW', anchorXMm: 29, baselineYMm: 23, sizeMm: 4,
          anchor: 'end', boxMm: { xMm: 22, yMm: 19.5, widthMm: 8, heightMm: 4 },
          minRenderPx: 64, ink: 'schwarz', contrastBackground: 'surface',
        },
      },
    };
    const roleCatalog = Object.assign({}, catalog, {
      organizationColor: () => 'weiss' as const,
      functionRole: () => roleDefinition,
      administrativeHead: () => undefined,
      bodyMark: () => [
        { type: 'line' as const, role: 'pictogram' as const, x1: 2, y1: 16, x2: 30, y2: 16 },
      ],
    });
    const spec = {
      kind: 'formation',
      organization: 'fuehrung-leitung',
      functionRole: 'incident-command',
      bodyMarks: ['care'],
    } as unknown as SymbolSpec;

    const drawing = Reflect.apply(compose, undefined, [spec, roleCatalog]);
    const body = drawing.children.find((child) => child.role === 'body');
    expect(body).toMatchObject({ type: 'rect', x: 2, y: 8, width: 28, height: 16 });

    const bodyIndex = drawing.children.findIndex((child) => child.role === 'body');
    const additionIndex = drawing.children.findIndex((child) => child.role === 'bodyExtra');
    const markIndex = drawing.children.findIndex(
      (child) => child.type === 'line' && child.role === 'pictogram' && child.y1 === 16,
    );
    const decorationIndex = drawing.children.findIndex(
      (child) => child.type === 'rect' && child.role === 'pictogram',
    );
    const roleIndex = drawing.children.findIndex(
      (child) => child.type === 'text' && child.content === 'EL',
    );
    const carrierIndex = drawing.children.findIndex(
      (child) => child.type === 'text' && child.content === 'AW',
    );
    expect([bodyIndex, additionIndex, markIndex, decorationIndex, roleIndex, carrierIndex])
      .not.toContain(-1);
    expect(bodyIndex).toBeLessThan(additionIndex);
    expect(additionIndex).toBeLessThan(markIndex);
    expect(markIndex).toBeLessThan(decorationIndex);
    expect(decorationIndex).toBeLessThan(roleIndex);
    expect(roleIndex).toBeLessThan(carrierIndex);
  });

  it('zeichnet einen aufgelösten Verwaltungskopf vor dem gemessenen Rollenkörper', () => {
    const administrativeRoleCatalog: CatalogPorts = {
      ...catalog,
      organizationColor: () => 'weiss',
      functionRole: () => ({
        id: 'technical-incident-commander',
        title: 'Technischer Einsatzleiter',
        kind: 'person',
        expectedHead: 'administrative',
        expectedOrganization: 'fuehrung-leitung',
        expectedAdministrativeLevel: 'kreis',
        allowedBodyMarks: [],
        layout: {
          headTopMm: 0,
          body: { type: 'rect', role: 'body', x: 3, y: 3, width: 26, height: 26 },
          bodyAdditions: [],
          decorations: [],
          roleRuns: [],
        },
      }),
      administrativeHead: () => ({
        box: { xMm: 9, yMm: 0, widthMm: 14, heightMm: 4 },
        heightMm: 4,
        primitives: [{
          type: 'rect', role: 'head', x: 10.75, y: 0, width: 0.5, height: 4,
          style: { fill: 'schwarz' },
        }],
      }),
    };
    const drawing = compose({
      kind: 'person',
      organization: 'fuehrung-leitung',
      functionRole: 'technical-incident-commander',
      administrativeLevel: 'kreis',
    }, administrativeRoleCatalog);

    expect(drawing.children[0]).toMatchObject({
      type: 'group',
      role: 'head',
      transform: { translate: { dxMm: 0, dyMm: 0 } },
      children: [{ type: 'rect', role: 'head' }],
    });
    expect(drawing.children[1]).toMatchObject({ type: 'rect', role: 'body' });
  });

  it('wandelt eine runtime-malformed Rollenfassung in einen CompositionError um', () => {
    const malformedCatalog = {
      ...catalog,
      functionRole: () => ({
        id: 'incident-commander',
        title: 'Einsatzleiter',
        kind: 'person',
        expectedHead: 'none',
        allowedBodyMarks: [],
      }),
    };
    let thrown: unknown;

    try {
      Reflect.apply(compose, undefined, [{
        kind: 'person', functionRole: 'incident-commander',
      }, malformedCatalog]);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(CompositionError);
    expect((thrown as CompositionError).issues.map((issue) => issue.rule))
      .toContain('function-role-requires-measured-layout');
  });
});
