import {
  DEFAULT_STROKE_WIDTH_MM,
  DEFAULT_VIEWBOX_MM,
  type CatalogEntry,
  type Drawing,
  type Primitive,
  type Style,
  type SymbolKind,
} from '@einsatzzeichen/schema';

/** Umriss ohne Füllung. Organisationsfarben setzt der Kompositionsmotor. */
const OUTLINE: Style = {
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: DEFAULT_STROKE_WIDTH_MM,
};

/** Halbe Seitenlänge des gedrehten Quadrats bei 15 mm halber Diagonale. */
const PERSON_HALF_SIDE = (15 * Math.SQRT2) / 2;

const BODIES: Partial<Record<SymbolKind, Primitive>> = {
  formation: { type: 'rect', role: 'body', x: 1, y: 6, width: 30, height: 20, style: OUTLINE },
  person: {
    type: 'rect',
    role: 'body',
    x: 16 - PERSON_HALF_SIDE,
    y: 16 - PERSON_HALF_SIDE,
    width: PERSON_HALF_SIDE * 2,
    height: PERSON_HALF_SIDE * 2,
    transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
    style: OUTLINE,
  },
  post: { type: 'circle', role: 'body', cx: 16, cy: 16, r: 14, style: OUTLINE },
  building: {
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
    style: OUTLINE,
  },
  container: { type: 'rect', role: 'body', x: 4, y: 4, width: 24, height: 24, style: OUTLINE },
};

const TITLES: Partial<Record<SymbolKind, string>> = {
  formation: 'Taktische Formation',
  person: 'Person',
  post: 'Funktionsstelle',
  building: 'Gebäude',
  container: 'Behälter, Ressource, Raum, Funkgerät',
};

const SECTIONS: Partial<Record<SymbolKind, { section: string; asset: string }>> = {
  formation: { section: '1.1', asset: '1.1_Taktische Formation.svg' },
  person: { section: '1.2', asset: '1.2_Person.svg' },
  post: { section: '1.6', asset: '1.6_Funktionsstelle.svg' },
  building: { section: '1.7', asset: '1.7_Gebäude.svg' },
  container: { section: '1.8', asset: '1.8_Behälter Ressource Raum Funkgerät.svg' },
};

export function baseDrawing(kind: SymbolKind): Drawing {
  const body = BODIES[kind];
  if (!body) throw new Error(`Kein Grundzeichen für "${kind}" im Katalog.`);
  const title = TITLES[kind];
  return {
    viewBox: DEFAULT_VIEWBOX_MM,
    children: [body],
    ...(title !== undefined ? { title } : {}),
  };
}

function entry(kind: SymbolKind): CatalogEntry {
  const title = TITLES[kind];
  if (title === undefined) throw new Error(`Kein Titel für "${kind}".`);
  const meta = SECTIONS[kind];
  if (!meta) throw new Error(`Keine Quellenangabe für "${kind}".`);
  return {
    id: `base.${kind}`,
    title,
    kind,
    depictions: [
      {
        variant: 'primary',
        drawing: baseDrawing(kind),
        sourceRefs: [
          {
            source: 'babz-svg-2025',
            section: meta.section,
            asset: meta.asset,
            status: 'verbatim',
          },
        ],
      },
    ],
  };
}

export const BASE_SYMBOLS = {
  formation: entry('formation'),
  person: entry('person'),
  post: entry('post'),
  building: entry('building'),
  container: entry('container'),
} as const satisfies Partial<Record<SymbolKind, CatalogEntry>>;
