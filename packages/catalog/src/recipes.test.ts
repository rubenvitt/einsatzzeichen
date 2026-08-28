import { describe, expect, it } from 'vitest';
import {
  ARIMO_CAP_HEIGHT_FRACTION,
  boundsOfMm,
  CompositionError,
  formatUnits,
  matchFingerprint,
  renderSvg,
  validateSpec,
} from '@einsatzzeichen/core';
import { mmToUnits, type Drawing, type Primitive } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { fingerprintFor, referenceLacksComparableShape } from './fingerprint-index.js';
import { pictogram } from './pictograms/index.js';
import {
  RECIPES,
  composeFromCatalog,
  labelContrastRequirements,
  type Recipe,
} from './recipes.js';
import { ANHANG_I_RECIPES } from './recipes-anhang-i.js';
import {
  ANHANG_E_A_FILL_DEFECTS,
  ANHANG_E_A_RECIPES,
  ANHANG_E_B_FILL_FINDINGS,
  ANHANG_E_B_RECIPES,
  ANHANG_E_C_FILL_FINDINGS,
  ANHANG_E_C_RECIPES,
  ANHANG_E_D_FINDINGS,
  ANHANG_E_D_RECIPES,
  ANHANG_E_E_FINDINGS,
  ANHANG_E_E_RECIPES,
  ANHANG_E_F_FINDINGS,
  ANHANG_E_F_RECIPES,
} from './recipes-anhang-e.js';
import { ANHANG_F_B_RECIPES } from './recipes-anhang-f.js';
import { ACCESSIBLE_LIGHT_THEME, PRINT_MONOCHROME_THEME } from './render-themes.js';

/**
 * Effektive y-Lage der waagerechten Brandbekämpfungs-Linie: ihre Autorenkoordinate plus die
 * Verschiebung ihrer Gruppe. Seit die Piktogramme von einer Gruppe mit `transform.translate`
 * umschlossen werden, steht der an der Referenz vermessene Sollwert nicht mehr am Primitiv —
 * die fachliche Aussage ist unverändert, sie wird eine Ebene tiefer gelesen.
 */
function horizontalPictogramLineYMm(drawing: Drawing): number | undefined {
  const directLine = drawing.children.find(
    (c): c is Primitive & { type: 'line' } =>
      c.type === 'line' && c.role === 'pictogram' && c.y1 === c.y2,
  );
  if (directLine !== undefined) return directLine.y1;

  const group = drawing.children.find(
    (c): c is Primitive & { type: 'group' } => c.type === 'group' && c.role === 'pictogram',
  );
  if (group === undefined) return undefined;
  const line = group.children.find(
    (c): c is Primitive & { type: 'line' } => c.type === 'line' && c.y1 === c.y2,
  );
  if (line === undefined) return undefined;
  return line.y1 + (group.transform?.translate?.dyMm ?? 0);
}

const D_4_3_REFERENCE_ASSET = 'D.4.3_Leiter Gefahrenabwehr Mönchengladbach.svg';
const I_5_3_REFERENCE_ASSET = 'I.5.3_Taucher.svg';
const D_4_3_STAR_BOUNDS = [
  {
    kind: 'bounds',
    boundsMm: { minXMm: 9.143, minYMm: 0, maxXMm: 12.857, maxYMm: 4 },
  },
  {
    kind: 'bounds',
    boundsMm: { minXMm: 19.143, minYMm: 0, maxXMm: 22.857, maxYMm: 4 },
  },
] as const;

function comparableBodyFingerprint(
  fingerprint: ReturnType<typeof fingerprintFor>,
): ReturnType<typeof fingerprintFor> {
  if (fingerprint.asset === I_5_3_REFERENCE_ASSET) {
    const labelTOutline = fingerprint.shapes.filter((shape) => shape.kind === 'outline');
    expect(labelTOutline).toEqual([{
      kind: 'outline',
      boundsMm: { minXMm: 1.089, minYMm: 1.081, maxXMm: 3.339, maxYMm: 4 },
    }]);
    return {
      ...fingerprint,
      // Der zusätzliche Pfad ist das T des literalen Labels „Taucher", nicht Teil der Raute.
      shapes: fingerprint.shapes.filter((shape) => shape.kind !== 'outline'),
    };
  }
  if (fingerprint.asset !== D_4_3_REFERENCE_ASSET) return fingerprint;
  const starBounds = fingerprint.shapes.filter((shape) => shape.kind === 'bounds');
  expect(starBounds).toEqual(D_4_3_STAR_BOUNDS);
  const [leftStarBounds, rightStarBounds] = starBounds;
  return {
    ...fingerprint,
    shapes: fingerprint.shapes.filter(
      (shape) => shape !== leftStarBounds && shape !== rightStarBounds,
    ),
  };
}

describe('composeFromCatalog() — vorbereitete inset-hull-Spec', () => {
  function labelContents(drawing: Drawing): string[] {
    return drawing.children
      .filter(
        (child): child is Primitive & { type: 'text' } =>
          child.type === 'text' && child.role === 'label',
      )
      .map((label) => label.content);
  }

  it('ignoriert einen non-enumerable center-Getter auf Object.prototype in Bild und Beschreibung', () => {
    const previousCenter = Object.getOwnPropertyDescriptor(Object.prototype, 'center');

    try {
      Object.defineProperty(Object.prototype, 'center', {
        configurable: true,
        enumerable: false,
        get: () => 'GEERBT',
      });

      const drawing = composeFromCatalog({
        kind: 'vehicle-water',
        bodyVariant: 'inset-hull',
        organization: 'hilfsorganisation',
        labels: {},
      });
      expect(labelContents(drawing)).not.toContain('GEERBT');
      expect(drawing.description).not.toContain('GEERBT');
    } finally {
      if (previousCenter === undefined) {
        Reflect.deleteProperty(Object.prototype, 'center');
      } else {
        Object.defineProperty(Object.prototype, 'center', previousCenter);
      }
    }
  });

  it('verwendet bei Proxy-Labels für Bild und Beschreibung denselben center-Data-Deskriptor', () => {
    const labels = new Proxy({ center: 'MzB' }, {
      get: (target, key, receiver) => key === 'center'
        ? 'PROXY'
        : Reflect.get(target, key, receiver),
      getOwnPropertyDescriptor: (target, key) => Reflect.getOwnPropertyDescriptor(target, key),
      getPrototypeOf: () => Object.prototype,
      ownKeys: (target) => Reflect.ownKeys(target),
    });

    const drawing = composeFromCatalog({
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
      labels,
    });
    expect(labelContents(drawing)).toEqual(['MzB']);
    expect(drawing.description).toContain('Kürzel: MzB');
    expect(drawing.description).not.toContain('PROXY');
  });
});

describe('Anhang I, Teilslice I-e — Wasserrettungsformationen', () => {
  const iERecipeKeys = [
    'I.1.9',
    'I.1.9#alternative',
    'I.1.10',
    'I.1.11',
    'I.1.12',
  ] as const;

  function iERecipes(): Record<string, Recipe> {
    return Object.fromEntries(iERecipeKeys.map((section) => [section, ANHANG_I_RECIPES[section]]));
  }

  it('bindet genau die fünf vermessenen Wasserrettungsdarstellungen an ihre Quellen und Specs', () => {
    // Nicht aus `RECIPES` hergeleitet: Die Matrix bleibt ein unabhängiger, literaler Vertrag und
    // erkennt dadurch vertauschte Stärke, Labels oder die zwei CapabilityIds sofort.
    expect(iERecipes()).toEqual({
      'I.1.9': {
        title: 'Bootstrupp Wasserrettungszug',
        referenceAsset: 'I.1.9_Bootstrupp Wasserrettungszug.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          strength: 'trupp',
          bodyMarks: ['water-rescue'],
          labels: { topLeft: 'Boot' },
        },
      },
      'I.1.9#alternative': {
        title: 'Bootstrupp Wasserrettungszug',
        referenceAsset: 'I.1.9_Bootstrupp Wasserrettungszug_Alternative.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          strength: 'trupp',
          bodyMarks: ['watercraft-operations'],
          labels: { topLeft: 'WRZ' },
        },
      },
      'I.1.10': {
        title: 'Bootsgruppe Wasserrettung',
        referenceAsset: 'I.1.10_Bootsgruppe Wasserrettung.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          strength: 'gruppe',
          bodyMarks: ['water-rescue'],
          labels: { topLeft: 'Boot' },
        },
      },
      'I.1.11': {
        title: 'Tauchtrupp',
        referenceAsset: 'I.1.11_Tauchtrupp.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          strength: 'trupp',
          bodyMarks: ['water-rescue'],
          labels: { topLeft: 'Tauchen' },
        },
      },
      'I.1.12': {
        title: 'Tauchgruppe',
        referenceAsset: 'I.1.12_Tauchgruppe.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          strength: 'gruppe',
          bodyMarks: ['water-rescue'],
          labels: { topLeft: 'Tauchen' },
        },
      },
    });
  });

  it('macht alle fünf Darstellungen über den öffentlichen Rezeptkatalog adressierbar', () => {
    expect(Object.fromEntries(
      Object.entries(RECIPES).filter(([section]) =>
        ['I.1.9', 'I.1.9#alternative', 'I.1.10', 'I.1.11', 'I.1.12'].includes(section),
      ),
    )).toEqual(iERecipes());
  });

  it('komponiert alle fünf Specs ohne die zu große Standard-Capability-Box', () => {
    const recipes = iERecipes();
    for (const [section, recipe] of Object.entries(recipes)) {
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      if (recipe.spec.labels === undefined) {
        throw new Error(`${section}: erwartete I-e-Beschriftung fehlt.`);
      }
      const labels = drawing.children.filter(
        (child): child is Primitive & { type: 'text' } => child.type === 'text' && child.role === 'label',
      );
      expect(labels.map((label) => label.content), section).toEqual([recipe.spec.labels.topLeft]);
      const pictograms = drawing.children.filter((child) => child.role === 'pictogram');
      expect(pictograms, section).not.toHaveLength(1);
      expect(pictograms.some((child) => child.type === 'group'), section).toBe(false);
    }
  });
});

describe('Kompositionsrezepte', () => {
  const geometryRegressionCases = Object.entries(RECIPES).filter(([, recipe]) =>
    referenceLacksComparableShape(recipe.referenceAsset),
  );
  const fingerprintCases = Object.entries(RECIPES).filter(([, recipe]) =>
    !referenceLacksComparableShape(recipe.referenceAsset),
  );

  it('bindet Anhang H mit drei orangefarbenen Formationen an die Originaldateien', () => {
    expect(RECIPES['H.1']).toEqual({
      title: 'Veterinärzug',
      referenceAsset: 'H.1_Veterinärzug.svg',
      spec: {
        kind: 'formation',
        organization: 'sonstige-gefahrenabwehr',
        strength: 'zug',
        bodyMarks: ['veterinary'],
      },
    });
    expect(RECIPES['H.2']).toEqual({
      title: 'Tier-Dekontaminationsgruppe',
      referenceAsset: 'H.2_Tier-Dekontaminationsgruppe.svg',
      spec: {
        kind: 'formation',
        organization: 'sonstige-gefahrenabwehr',
        strength: 'gruppe',
        bodyMarks: ['h-veterinary-decontamination'],
      },
    });
    expect(RECIPES['H.3']).toEqual({
      title: 'Schlacht- und Untersuchungsgruppe',
      referenceAsset: 'H.3_Schlacht- und Untersuchungsgruppe.svg',
      spec: {
        kind: 'formation',
        organization: 'sonstige-gefahrenabwehr',
        strength: 'gruppe',
        bodyMarks: ['h-veterinary-slaughter'],
      },
    });
  });

  it('zeichnet die H-spezifische kompakte Tierdekontaminationsmarke', () => {
    const h2 = composeFromCatalog(RECIPES['H.2']!.spec).children.filter(
      (child) => child.role === 'pictogram',
    );

    expect(h2).toHaveLength(7);
    expect(h2.map((child) => child.type)).toEqual([
      'polyline',
      'circle',
      'circle',
      'polyline',
      'polyline',
      'polyline',
      'polyline',
    ]);
  });

  it('bindet den Körper-Fingerprint-Claim exakt an die ausgeführten Rezeptfälle', () => {
    const tested = fingerprintCases.map(([section]) => `recipe.${section}`).sort();
    const claimed = COVERAGE_MANIFEST.entries
      .filter(
        (entry) =>
          entry.coverage === 'composition-recipe' &&
          entry.testEvidence.includes('body-fingerprint'),
      )
      .map((entry) => entry.implementation)
      .sort();
    expect(tested).toEqual(claimed);
  });

  it.each(fingerprintCases)('reproduziert die Referenz %s', (_section, recipe) => {
    const drawing = composeFromCatalog(recipe.spec);
    const fingerprint = fingerprintFor(recipe.referenceAsset);
    // D.1.2–D.1.8 verdecken die obere Rahmenlinie mit ihrer 3-mm-Kappe. Der Extraktor führt
    // deshalb neben der exakten 1/6–31/26-mm-Füllhülle einen nur noch ab y=7,375 sichtbaren
    // `ring`. Der semantische `body` bleibt die vollständige Füllhülle; die Kappe ist eine
    // getrennte Dekoration. Für genau diese sieben Quellen vergleichen wir daher die ebenfalls
    // extrahierte `rect`-Hülle und nicht die durch Übermalung verkürzte sichtbare Kontur.
    const comparableFingerprint = /^D\.1\.[2-8][._]/.test(recipe.referenceAsset)
      ? { ...fingerprint, shapes: fingerprint.shapes.filter((shape) => shape.kind !== 'ring') }
      // D.4.3s `rect`-Körper steht im JSON zuerst; `matchFingerprint` bevorzugt durch seine
      // Kind-Präzedenz trotzdem die beiden als `bounds` extrahierten Sternpfade. Nur wenn ihre
      // vollständige Teilmenge exakt den zwei vermessenen Hüllen entspricht, werden genau diese
      // beiden Objekte aus dem Körpervergleich entfernt.
      : comparableBodyFingerprint(fingerprint);
    const result = matchFingerprint(drawing, comparableFingerprint);
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('lehnt zusätzliche D.4.3-bounds ab, statt sie still aus dem Körpervergleich zu entfernen', () => {
    const fingerprint = fingerprintFor(D_4_3_REFERENCE_ASSET);
    const withUnexpectedBounds = {
      ...fingerprint,
      shapes: [
        ...fingerprint.shapes,
        {
          kind: 'bounds',
          boundsMm: { minXMm: 14, minYMm: 0, maxXMm: 18, maxYMm: 4 },
        },
      ],
    };

    expect(() => comparableBodyFingerprint(withUnexpectedBounds)).toThrow();
  });

  it('bindet den Geometrie-Regressionsclaim exakt an Rezeptartefakte mit shapes: []', () => {
    expect(geometryRegressionCases.map(([section]) => section)).toEqual(['G.1.5']);
    for (const [section, recipe] of geometryRegressionCases) {
      expect(fingerprintFor(recipe.referenceAsset).shapes, section).toEqual([]);
    }
    const claimed = COVERAGE_MANIFEST.entries
      .filter(
        (entry) =>
          entry.coverage === 'composition-recipe' &&
          entry.testEvidence.includes('body-geometry-regression'),
      )
      .map((entry) => entry.implementation)
      .sort();
    expect(claimed).toEqual(
      geometryRegressionCases.map(([section]) => `recipe.${section}`).sort(),
    );
  });

  it('erzeugt die Löschstaffel mit Körper bei 9 mm', () => {
    const drawing = composeFromCatalog(RECIPES['C.1.1'].spec);
    const body = drawing.children.find((c) => c.role === 'body');
    expect(body).toBeDefined();
    if (body === undefined) return;
    expect(boundsOfMm(body).minY).toBeCloseTo(9, 6);
    expect(body.style?.fill).toBe('rot');
  });

  it('erzeugt die Löschgruppe mit Körper bei 6 mm', () => {
    const drawing = composeFromCatalog(RECIPES['C.1.2'].spec);
    const body = drawing.children.find((c) => c.role === 'body');
    expect(body).toBeDefined();
    if (body === undefined) return;
    expect(boundsOfMm(body).minY).toBeCloseTo(6, 6);
  });

  it('erzeugt C.1.3 als Löschzug auf dem unveränderten Formationskörper', () => {
    const recipe = RECIPES['C.1.3'];
    expect(recipe).toEqual({
      title: 'Löschzug einer Feuerwehr',
      referenceAsset: 'C.1.3_Löschzug einer Feuerwehr.svg',
      spec: {
        kind: 'formation',
        organization: 'feuerwehr',
        strength: 'zug',
        bodyMarks: ['fire-fighting'],
      },
    });

    const drawing = composeFromCatalog(recipe.spec);
    const heads = drawing.children.filter(
      (child): child is Primitive & { type: 'circle' } =>
        child.type === 'circle' && child.role === 'head',
    );
    expect(heads.map(({ cx, cy, r }) => ({ cx, cy, r }))).toEqual([
      { cx: 11, cy: 3.5, r: 1.5 },
      { cx: 16, cy: 3.5, r: 1.5 },
      { cx: 21, cy: 3.5, r: 1.5 },
    ]);

    const pictogramLines = drawing.children.filter(
      (child): child is Primitive & { type: 'line' } =>
        child.type === 'line' && child.role === 'pictogram',
    );
    expect(pictogramLines.map(({ x1, y1, x2, y2 }) => ({ x1, y1, x2, y2 }))).toEqual([
      { x1: 1, y1: 16, x2: 21, y2: 16 },
      { x1: 21, y1: 16, x2: 31, y2: 6 },
      { x1: 21, y1: 16, x2: 31, y2: 26 },
    ]);
    expect(pictogramLines).not.toContainEqual(
      expect.objectContaining({ x1: 21, y1: 16, x2: 31, y2: 16 }),
    );

    const body = drawing.children.find((child) => child.role === 'body');
    expect(body).toBeDefined();
    if (body === undefined) return;
    const bounds = boundsOfMm(body);
    expect(bounds.minX).toBeCloseTo(1, 6);
    expect(bounds.minY).toBeCloseTo(6, 6);
    expect(bounds.maxX).toBeCloseTo(31, 6);
    expect(bounds.maxY).toBeCloseTo(26, 6);
    expect(body.style?.fill).toBe('rot');
    expect(horizontalPictogramLineYMm(drawing)).toBeCloseTo(16, 6);
  });

  it('unterscheidet Löschstaffel, Löschgruppe und Löschzug nur in der Stärke', () => {
    const { strength: _a, ...staffel } = RECIPES['C.1.1'].spec;
    const { strength: _b, ...gruppe } = RECIPES['C.1.2'].spec;
    const { strength: _c, ...zug } = RECIPES['C.1.3'].spec;
    expect(staffel).toEqual({
      kind: 'formation',
      organization: 'feuerwehr',
      bodyMarks: ['fire-fighting'],
    });
    expect(staffel).toEqual(gruppe);
    expect(gruppe).toEqual(zug);
  });

  it('erzeugt den Zugführer mit Spitze bei 5 mm und Unterkante bei 31 mm', () => {
    const drawing = composeFromCatalog(RECIPES['D.3.7'].spec);
    const body = drawing.children.find((c) => c.role === 'body');
    expect(body).toBeDefined();
    if (body === undefined) return;
    const bounds = boundsOfMm(body);
    expect(bounds.minY).toBeCloseTo(5, 3);
    expect(bounds.maxY).toBeCloseTo(31, 3);
  });

  it('migriert D.3.7 auf Funktionsträgerkappe, Stärke und innere Brandbekämpfungsmarke', () => {
    const recipe = RECIPES['D.3.7'];
    expect(recipe.spec).toMatchObject({
      kind: 'person',
      organization: 'feuerwehr',
      strength: 'zug',
      functionRole: 'fire-service-platoon-commander',
      bodyMarks: ['fire-fighting'],
    });

    const drawing = composeFromCatalog(recipe.spec, recipe.title);
    expect(drawing.viewBox).toEqual({ width: 32, height: 32 });
    expect(drawing.children.filter((child) => child.role === 'head')).toHaveLength(3);
    expect(drawing.children.some(
      (child) => child.role === 'pictogram' && child.style?.fill === 'schwarz',
    )).toBe(true);
    expect(drawing.children).toContainEqual(expect.objectContaining({
      type: 'line', role: 'pictogram', y1: 18, y2: 18,
    }));
    expect(drawing.children).toContainEqual(expect.objectContaining({
      type: 'polyline', role: 'pictogram', closed: true,
      points: [[25, 14], [29, 18], [25, 22], [21, 18]],
    }));
    const body = drawing.children.find((child) => child.role === 'body');
    expect(body?.style?.fill).toBe('rot');

    const formerSimplified = composeFromCatalog({
      kind: 'person', organization: 'feuerwehr', strength: 'zug',
    }, recipe.title);
    expect(renderSvg(drawing)).not.toBe(renderSvg(formerSimplified));
  });

  it('setzt die Stärkepunkte als eigene Primitive mit der Rolle head', () => {
    const drawing = composeFromCatalog(RECIPES['C.1.1'].spec);
    expect(drawing.children.filter((c) => c.role === 'head')).toHaveLength(2);
  });

  it('verschiebt das Piktogramm mit der Körpermitte, statt es absolut zu platzieren', () => {
    // Das Fingerprint-Gate vergleicht ausschließlich role: 'body' — das Piktogramm (role:
    // 'pictogram') ist davon nicht erfasst. Diese Invariante ist an der Referenz vermessen:
    // C.1.1 verschiebt den Körper (und mit ihm das Piktogramm) um 3 mm auf Mitte 19, C.1.2
    // lässt den Körper (und das Piktogramm) bei Mitte 16 unverändert.
    const cases = [
      ['C.1.1', 19] as const,
      ['C.1.2', 16] as const,
      ['C.1.3', 16] as const,
    ];
    for (const [section, expectedCenterYMm] of cases) {
      const drawing = composeFromCatalog(RECIPES[section].spec);
      const body = drawing.children.find((c) => c.role === 'body');
      const pictogram = drawing.children.filter((c) => c.role === 'pictogram');
      expect(body).toBeDefined();
      expect(pictogram.length).toBeGreaterThan(0);
      if (body === undefined) continue;

      const bodyBounds = boundsOfMm(body);
      const bodyCenterYMm = (bodyBounds.minY + bodyBounds.maxY) / 2;
      expect(bodyCenterYMm).toBeCloseTo(expectedCenterYMm, 6);

      const pictogramBounds = pictogram.map(boundsOfMm);
      const pictogramMinY = Math.min(...pictogramBounds.map((b) => b.minY));
      const pictogramMaxY = Math.max(...pictogramBounds.map((b) => b.maxY));
      const pictogramCenterYMm = (pictogramMinY + pictogramMaxY) / 2;

      // Allgemeine Invariante: Das Piktogramm folgt der Körpermitte — unabhängig davon, ob der
      // Körper verschoben (C.1.1) oder unverändert (C.1.2) platziert wurde.
      expect(pictogramCenterYMm).toBeCloseTo(bodyCenterYMm, 6);

      // Der an der Referenz konkret vermessene Sollwert, direkt an der waagerechten Linie
      // geprüft statt nur über die Hüllenmitte des gesamten Piktogramms.
      const lineYMm = horizontalPictogramLineYMm(drawing);
      expect(lineYMm).toBeDefined();
      if (lineYMm !== undefined) {
        expect(lineYMm).toBeCloseTo(expectedCenterYMm, 6);
      }
    }
  });

  it('lehnt eine unzulässige Kombination mit erklärendem Fehler ab', () => {
    expect(() => composeFromCatalog({ kind: 'hazard', strength: 'gruppe' })).toThrow(
      CompositionError,
    );
  });

  it('trägt den Titel des Rezepts, nicht den des Grundzeichens', () => {
    // Ohne diese Zusicherung liefe die Regression aus dem Abschlussreview unbemerkt zurück:
    // die zusammengesetzte Zeichnung übernahm den Titel des Grundzeichens ("Taktische
    // Formation" bzw. "Person") statt des fachlich richtigen Rezepttitels.
    for (const [, recipe] of Object.entries(RECIPES)) {
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(drawing.title).toBe(recipe.title);
    }
  });

  it('erzeugt keinen Titel, wenn composeFromCatalog ohne Titel aufgerufen wird', () => {
    const drawing = composeFromCatalog(RECIPES['C.1.1'].spec);
    expect(drawing.title).toBeUndefined();
  });
});

describe('Anhang D.1, Führungsstellen im Einsatz', () => {
  const expectedKeys = [
    'D.1.2',
    'D.1.3',
    'D.1.4',
    'D.1.5',
    'D.1.6',
    'D.1.7',
    'D.1.8',
    'D.1.9',
    'D.1.9#alternative',
  ] as const;

  it('führt exakt die neun komponierten D.1-Darstellungen', () => {
    expect(Object.keys(RECIPES).filter((key) => key.startsWith('D.1.'))).toEqual(expectedKeys);
    expect(Object.keys(RECIPES)).toHaveLength(242);
  });

  it('bindet D.1.2 bis D.1.8 an die sieben gemessenen Formationsrollen', () => {
    expect(expectedKeys.slice(0, 7).map((key) => RECIPES[key]?.spec)).toEqual([
      {
        kind: 'formation', organization: 'fuehrung-leitung',
        functionRole: 'disaster-control-command',
      },
      {
        kind: 'formation', organization: 'fuehrung-leitung',
        functionRole: 'technical-incident-command-evacuation',
      },
      {
        kind: 'formation', organization: 'fuehrung-leitung',
        functionRole: 'incident-command',
      },
      {
        kind: 'formation', organization: 'fuehrung-leitung',
        functionRole: 'incident-section-command-north',
      },
      {
        kind: 'formation', organization: 'fuehrung-leitung',
        functionRole: 'incident-subsection-command',
      },
      {
        kind: 'formation', organization: 'fuehrung-leitung', strength: 'gruppe',
        functionRole: 'technical-incident-command-group',
      },
      {
        kind: 'formation', organization: 'feuerwehr', strength: 'gruppe',
        functionRole: 'fire-service-readiness-command-group',
      },
    ]);
  });

  it('hält beide D.1.9-Darstellungen rollenlos und die alternative Dreierreihe als Innenmarke', () => {
    const cases = [
      ['D.1.9', 'formation-solid-cap-3mm'],
      ['D.1.9#alternative', 'formation-solid-cap-4mm-three-hole-row'],
    ] as const;

    for (const [key, cap] of cases) {
      const recipe = RECIPES[key];
      expect(recipe, `${key} fehlt`).toBeDefined();
      if (recipe === undefined) continue;
      expect(recipe.spec).toEqual({
        kind: 'formation',
        organization: 'hilfsorganisation',
        strength: 'trupp',
        bodyMarks: ['medical-service', cap],
      });
      expect(recipe.spec).not.toHaveProperty('functionRole');

      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(drawing.children.filter((child) => child.role === 'head')).toHaveLength(1);
    }
  });
});

describe('Anhang D.3, Funktionen', () => {
  const expected = {
    'D.3.1': {
      title: 'Technischer Einsatzleiter',
      referenceAsset: 'D.3.1_Technischer Einsatzleiter LK Ahrweiler.svg',
      spec: {
        kind: 'person', organization: 'fuehrung-leitung', administrativeLevel: 'kreis',
        functionRole: 'technical-incident-commander',
      },
    },
    'D.3.2': {
      title: 'Einsatzleiter', referenceAsset: 'D.3.2_Einsatzleiter.svg',
      spec: {
        kind: 'person', organization: 'fuehrung-leitung',
        functionRole: 'incident-commander',
      },
    },
    'D.3.3': {
      title: 'Leitender Notarzt', referenceAsset: 'D.3.3_Leitender Notarzt.svg',
      spec: {
        kind: 'person', organization: 'fuehrung-leitung', administrativeLevel: 'kreis',
        functionRole: 'lead-emergency-physician',
      },
    },
    'D.3.4': {
      title: 'Organisatorischer Leiter', referenceAsset: 'D.3.4_Organisatorischer Leiter.svg',
      spec: {
        kind: 'person', organization: 'fuehrung-leitung', administrativeLevel: 'kreis',
        functionRole: 'organizational-incident-commander',
      },
    },
    'D.3.5': {
      title: 'Einsatzabschnittsleiter', referenceAsset: 'D.3.5_Einsatzabschnittsleiter.svg',
      spec: {
        kind: 'person', organization: 'fuehrung-leitung',
        functionRole: 'incident-section-commander',
      },
    },
    'D.3.6': {
      title: 'Untereinsatzabschnittsleiter',
      referenceAsset: 'D.3.6_Untereinsatzabschnittsleiter.svg',
      spec: {
        kind: 'person', organization: 'fuehrung-leitung',
        functionRole: 'incident-subsection-commander',
      },
    },
    'D.3.7': {
      title: 'Zugführer der Feuerwehr',
      referenceAsset: 'D.3.7_Zugführer der Feuerwehr.svg',
      spec: {
        kind: 'person', organization: 'feuerwehr', strength: 'zug',
        functionRole: 'fire-service-platoon-commander', bodyMarks: ['fire-fighting'],
      },
    },
    'D.3.8': {
      title: 'Zugführer Technischer Zug',
      referenceAsset: 'D.3.8_Zugführer Technischer Zug THW.svg',
      spec: {
        kind: 'person', organization: 'thw', strength: 'zug',
        functionRole: 'technical-platoon-commander',
      },
    },
    'D.3.9': {
      title: 'Zugführer Sanitätszug',
      referenceAsset: 'D.3.9_Zugführer Sanitätszug ASB.svg',
      spec: {
        kind: 'person', organization: 'hilfsorganisation', strength: 'zug',
        functionRole: 'medical-platoon-commander', bodyMarks: ['medical-service'],
      },
    },
    'D.3.10': {
      title: 'Zugführer Einsatzeinheit',
      referenceAsset: 'D.3.10_Zugführer Einsatzeinheit DRK.svg',
      spec: {
        kind: 'person', organization: 'hilfsorganisation', strength: 'zug',
        functionRole: 'operational-unit-platoon-commander',
        bodyMarks: ['medical-service', 'care'],
      },
    },
    'D.3.11': {
      title: 'Zugführer Betreuungszug',
      referenceAsset: 'D.3.11_Zugführer Betreuungszug ASB.svg',
      spec: {
        kind: 'person', organization: 'hilfsorganisation', strength: 'zug',
        functionRole: 'care-platoon-commander', bodyMarks: ['care'],
      },
    },
    'D.3.12': {
      title: 'Gruppenführer Betreuungsgruppe',
      referenceAsset: 'D.3.12_Gruppenführer Betreuungsgruppe Malteser.svg',
      spec: {
        kind: 'person', organization: 'hilfsorganisation', strength: 'gruppe',
        functionRole: 'care-group-commander', bodyMarks: ['care'],
      },
    },
    'D.3.13': {
      title: 'Gruppenführer Schnell-Einsatzgruppe',
      referenceAsset: 'D.3.13_Gruppenführer Schnell-Einsatzgruppe Johanniter.svg',
      spec: {
        kind: 'person', organization: 'hilfsorganisation', strength: 'gruppe',
        functionRole: 'rapid-response-group-commander',
      },
    },
  } as const satisfies Record<string, Recipe>;

  it('führt D.3.1 bis D.3.13 vollständig und D.3.7 genau einmal', () => {
    const actual = Object.fromEntries(
      Object.entries<Recipe>(RECIPES).filter(([key]) => key.startsWith('D.3.')),
    );
    expect(actual).toEqual(expected);
    expect(Object.keys(actual).filter((key) => key === 'D.3.7')).toHaveLength(1);
  });

  it('lehnt eine Rollenorganisation vor dem Rendern über composeFromCatalog ab', () => {
    expect(() => composeFromCatalog({
      kind: 'person',
      organization: 'hilfsorganisation',
      strength: 'zug',
      functionRole: 'technical-platoon-commander',
    })).toThrowError(/function-role-organization-mismatch/);
  });

  it('bewahrt no-head, Zwei-Stern, abgesenkte Dreipunkt- und Standard-Zweipunktgeometrie', () => {
    const cases = [
      ['D.3.2', [3, 3, 29, 29], 0],
      ['D.3.5', [3, 3, 29, 29], 0],
      ['D.3.6', [3, 3, 29, 29], 0],
      ['D.3.1', [3, 3, 29, 29], 6],
      ['D.3.3', [3, 3, 29, 29], 6],
      ['D.3.4', [3, 3, 29, 29], 6],
      ['D.3.8', [3, 5, 29, 31], 3],
      ['D.3.9', [3, 5, 29, 31], 3],
      ['D.3.10', [3, 5, 29, 31], 3],
      ['D.3.11', [3, 5, 29, 31], 3],
      ['D.3.12', [3, 3, 29, 29], 2],
      ['D.3.13', [3, 3, 29, 29], 2],
    ] as const;

    for (const [section, expectedBounds, expectedHeadLeaves] of cases) {
      const recipe = RECIPES[section];
      expect(recipe, `${section} fehlt`).toBeDefined();
      if (recipe === undefined) continue;
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      const body = drawing.children.find((child) => child.role === 'body');
      expect(body, section).toBeDefined();
      if (body === undefined) continue;
      const bounds = boundsOfMm(body);
      expect([bounds.minX, bounds.minY, bounds.maxX, bounds.maxY], section).toEqual(
        expectedBounds.map((value) => expect.closeTo(value, 9)),
      );
      const headLeaves = drawing.children
        .filter((child) => child.role === 'head')
        .flatMap((child) => child.type === 'group' ? child.children : [child]);
      expect(headLeaves, section).toHaveLength(expectedHeadLeaves);
    }
  });

  it('zeichnet D.3.13s SEG- und JUH-Laeufe an den gemessenen Positionen', () => {
    const recipe = RECIPES['D.3.13'];
    expect(recipe).toBeDefined();
    if (recipe === undefined) return;
    const drawing = composeFromCatalog(recipe.spec, recipe.title);
    const labels = drawing.children.filter(
      (child): child is Primitive & { type: 'text' } => child.type === 'text',
    );
    expect(labels).toMatchObject([
      {
        content: 'SEG', x: 16, y: 18.5, sizeMm: 7.08, anchor: 'middle',
        boxMm: { xMm: 8.5, yMm: 13.3, widthMm: 14.75, heightMm: 5.5 }, minRenderPx: 37,
      },
      {
        content: 'JUH', x: 30.5, y: 29, sizeMm: 4.243, anchor: 'end',
        boxMm: { xMm: 22.1, yMm: 25.8, widthMm: 8.3, heightMm: 3.5 }, minRenderPx: 61,
      },
    ]);
  });
});

describe('Anhang D.4, übergeordnete Funktionen', () => {
  const cases = [
    [
      'D.4.1',
      {
        title: 'Leiter Kreisleitstelle Steinfurt',
        referenceAsset: 'D.4.1_Leiter Kreisleitstelle Steinfurt.svg',
        spec: {
          kind: 'person', organization: 'fuehrung-leitung', administrativeLevel: 'kreis',
          functionRole: 'district-control-center-director',
        },
      },
      ['LtS', 'ST'],
      6,
      [3, 3, 29, 29],
      'gelb',
    ],
    [
      'D.4.2',
      {
        title: 'Kreisbrandmeister Mettmann',
        referenceAsset: 'D.4.2_Kreisbrandmeister Mettmann.svg',
        spec: {
          kind: 'person', organization: 'feuerwehr', administrativeLevel: 'kreis',
          functionRole: 'district-fire-chief',
        },
      },
      ['KBM', 'ME'],
      6,
      [3, 3, 29, 29],
      'rot',
    ],
    [
      'D.4.3',
      {
        title: 'Leiter Gefahrenabwehr Mönchengladbach',
        referenceAsset: 'D.4.3_Leiter Gefahrenabwehr Mönchengladbach.svg',
        spec: {
          kind: 'person', organization: 'fuehrung-leitung', administrativeLevel: 'kreis',
          functionRole: 'hazard-response-director',
        },
      },
      ['LtrGA', 'MG'],
      6,
      [3, 3, 29, 29],
      'gelb',
    ],
    [
      'D.4.4',
      {
        title: 'Leiter Gefahrenabwehrkräfte Bundespolizei',
        referenceAsset: 'D.4.4_Leiter Gefahrenabwehrkräfte Bundespolizei.svg',
        spec: {
          kind: 'person', organization: 'polizei', administrativeLevel: 'nationalstaat',
          functionRole: 'hazard-response-forces-director',
        },
      },
      ['BuPol'],
      15,
      [3, 5, 29, 31],
      'gruen',
    ],
    [
      'D.4.5',
      {
        title: 'Leiter internationalen Hilfsaktion',
        referenceAsset: 'D.4.5_Leiter internationalen Hilfsaktion.svg',
        spec: {
          kind: 'person', organization: 'fuehrung-leitung',
          administrativeLevel: 'europaeische-union',
          functionRole: 'international-relief-operation-director',
        },
      },
      [],
      18,
      [5.5, 10, 26.5, 31],
      'gelb',
    ],
  ] as const satisfies readonly (readonly [
    string,
    Recipe,
    readonly string[],
    number,
    readonly number[],
    string,
  ])[];

  it.each(cases)(
    '%s bewahrt Rezept, sichtbare Literale, Kopf und separat gemessenen Körper',
    (section, expected, texts, headLeafCount, expectedBounds, bodyFill) => {
      const recipe = RECIPES[section];
      expect(recipe, `${section} fehlt`).toEqual(expected);
      if (recipe === undefined) return;

      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      const visibleTexts = drawing.children
        .filter((child): child is Primitive & { type: 'text' } => child.type === 'text')
        .map((text) => text.content);
      expect(visibleTexts, section).toEqual(texts);

      const headLeaves = drawing.children
        .filter((child) => child.role === 'head')
        .flatMap((child) => child.type === 'group' ? child.children : [child]);
      expect(headLeaves, section).toHaveLength(headLeafCount);

      const body = drawing.children.find((child) => child.role === 'body');
      expect(body, section).toBeDefined();
      if (body === undefined) return;
      const bounds = boundsOfMm(body);
      expect([bounds.minX, bounds.minY, bounds.maxX, bounds.maxY], section).toEqual(
        expectedBounds.map((value) => expect.closeTo(value, 9)),
      );
      expect(body.style?.fill, section).toBe(bodyFill);
    },
  );

  it('führt exakt die 27 freigegebenen Anhang-D-Rezeptschlüssel', () => {
    expect(Object.keys(RECIPES).filter((key) => /^D\.[134]\./.test(key))).toEqual([
      'D.1.2', 'D.1.3', 'D.1.4', 'D.1.5', 'D.1.6', 'D.1.7', 'D.1.8',
      'D.1.9', 'D.1.9#alternative',
      'D.3.1', 'D.3.2', 'D.3.3', 'D.3.4', 'D.3.5', 'D.3.6', 'D.3.7',
      'D.3.8', 'D.3.9', 'D.3.10', 'D.3.11', 'D.3.12', 'D.3.13',
      'D.4.1', 'D.4.2', 'D.4.3', 'D.4.4', 'D.4.5',
    ]);
  });
});

describe('Anhang G — vollständiges Logistikinventar', () => {
  const expected = {
    'G.1': {
      title: 'Versorgung mit Verbrauchsgütern',
      referenceAsset: 'G.1_Versorgung mit Verbrauchsgütern.svg',
      spec: {
        kind: 'formation', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        bodyMarks: ['fuels-consumables'],
      },
    },
    'G.1.1': {
      title: 'Versorgungstrupp Feuerwehr Materialerhaltung',
      referenceAsset: 'G.1.1_Versorgungstrupp Feuerwehr_Materialerhaltung.svg',
      spec: {
        kind: 'formation', bodyVariant: 'foot-band', organization: 'feuerwehr',
        strength: 'trupp', bodyMarks: ['maintenance'],
      },
    },
    'G.1.2': {
      title: 'Versorgungstrupp DLRG',
      referenceAsset: 'G.1.2_Versorgungstrupp DLRG.svg',
      spec: {
        kind: 'formation', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        strength: 'trupp', bodyMarks: ['catering'], labels: { bottomRight: 'DLRG' },
      },
    },
    'G.1.3': {
      title: 'Versorgungstrupp Feuerwehr Verbrauchsgüter',
      referenceAsset: 'G.1.3_Versorgungstrupp Feuerwehr_Verbrauchsgüter.svg',
      spec: {
        kind: 'formation', bodyVariant: 'foot-band', organization: 'feuerwehr',
        strength: 'trupp', bodyMarks: ['fuels-consumables'],
      },
    },
    'G.1.4': {
      title: 'Verpflegungszug',
      referenceAsset: 'G.1.4_Verpflegungszug.svg',
      spec: {
        kind: 'formation', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        strength: 'zug', bodyMarks: ['catering'],
      },
    },
    'G.1.5': {
      title: 'Instandhaltungsgruppe',
      referenceAsset: 'G.1.5_Instandhaltungsgruppe.svg',
      spec: {
        kind: 'formation', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        strength: 'gruppe', bodyMarks: ['maintenance'],
      },
    },
    'G.2': {
      title: 'Versorgung mit Trinkwasser',
      referenceAsset: 'G.2_Versorgung mit Trinkwasser.svg',
      spec: {
        kind: 'formation', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        bodyMarks: ['drinking-water'],
      },
    },
    'G.2.1': {
      title: 'Fahrzeug Instandhaltung',
      referenceAsset: 'G.2.1_Fahrzeug Instandhaltung.svg',
      spec: {
        kind: 'vehicle-land', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        vehicleCategory: 'kfz-kategorie-1', bodyMarks: ['maintenance'],
      },
    },
    'G.2.2': {
      title: 'Anhänger Technik Sicherheit',
      referenceAsset: 'G.2.2_Anhänger Technik Sicherheit.svg',
      spec: {
        kind: 'trailer', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        vehicleCategory: 'anhaenger-ein-rad', bodyMarks: ['maintenance'],
      },
    },
    'G.2.3': {
      title: 'Geräteanhänger Feldkochherd',
      referenceAsset: 'G.2.3_Geräteanhänger Feldkochherd.svg',
      spec: {
        kind: 'trailer', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        vehicleCategory: 'anhaenger-zwei-raeder', bodyMarks: ['meal-preparation'],
      },
    },
    'G.3': {
      title: 'Versorgung mit Brauchwasser',
      referenceAsset: 'G.3_Versorgung mit Brauchwasser.svg',
      spec: {
        kind: 'formation', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        bodyMarks: ['water-conveyance'],
      },
    },
    'G.3.1': {
      title: 'Verpflegungsstelle betrieben durch Feuerwehr',
      referenceAsset: 'G.3.1_Verpflegungsstelle_betrieben durch Feuerwehr.svg',
      spec: {
        kind: 'circle-12', bodyVariant: 'foot-band', organization: 'feuerwehr',
        bodyMarks: ['catering'],
      },
    },
    'G.3.2': {
      title: 'Verpflegungszubereitungsstelle Polizei',
      referenceAsset: 'G.3.2_Verpflegungszubereitungsstelle_betrieben durch Polizei.svg',
      spec: {
        kind: 'circle-12', bodyVariant: 'foot-band', organization: 'polizei',
        bodyMarks: ['meal-preparation'],
      },
    },
    'G.3.3': {
      title: 'Versorgungsstelle Hilfsorganisation',
      referenceAsset: 'G.3.3_Versorgungsstelle Hilfsorganisation.svg',
      spec: {
        kind: 'circle-12', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        bodyMarks: ['fuels-consumables'],
      },
    },
    'G.3.4': {
      title: 'Zentrale Stelle Notversorgung',
      referenceAsset: 'G.3.4_Zentrale Stelle Notversorgung.svg',
      spec: {
        kind: 'circle-12', bodyVariant: 'foot-band', organization: 'fuehrung-leitung',
        bodyMarks: ['maintenance'],
      },
    },
    'G.3.5': {
      title: 'Mobiler Tankpunkt Diesel Bundeswehr',
      referenceAsset: 'G.3.5_Mobiler Tankpunkt Diesel_betrieben durch Bundeswehr.svg',
      spec: {
        kind: 'circle-12', bodyVariant: 'foot-band', organization: 'bundeswehr',
        bodyMarks: ['fuels-consumables'], labels: { bottomCenter: 'Diesel', belowRight: 'Bw' },
      },
    },
    'G.4': {
      title: 'Versorgung mit Elektrizität',
      referenceAsset: 'G.4_Versorgung mit Elektrizität.svg',
      spec: {
        kind: 'formation', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        bodyMarks: ['power-supply'],
      },
    },
    'G.5': {
      title: 'Versorgung mit Verpflegung',
      referenceAsset: 'G.5_Versorgung mit Verpflegung.svg',
      spec: {
        kind: 'formation', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        bodyMarks: ['catering'],
      },
    },
    'G.6': {
      title: 'Zubereiten von Verpflegung',
      referenceAsset: 'G.6_Zubereiten von Verpflegung.svg',
      spec: {
        kind: 'formation', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        bodyMarks: ['meal-preparation'],
      },
    },
    'G.7': {
      title: 'Instandhaltung',
      referenceAsset: 'G.7_Instandhaltung.svg',
      spec: {
        kind: 'formation', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        bodyMarks: ['maintenance'],
      },
    },
    'G.8': {
      title: 'Entsorgung',
      referenceAsset: 'G.8_Entsorgung.svg',
      spec: {
        kind: 'formation', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        bodyMarks: ['waste-disposal'],
      },
    },
  } as const satisfies Record<string, Recipe>;

  it('bindet alle 21 primary-Rezepte literal an Namen, Körper, Organisation, Kopf, Fahrwerk, Marken und Labels', () => {
    const actual = Object.fromEntries(
      Object.entries<Recipe>(RECIPES).filter(([key]) => key === 'G.1' || /^G\.[1-3]\.[1-5]$/.test(key) || /^G\.[2-8]$/.test(key)),
    );
    expect(actual).toEqual(expected);
    expect(Object.keys(actual)).toEqual(Object.keys(expected));
    expect(Object.keys(actual).every((key) => !key.includes('#'))).toBe(true);
    expect(Object.keys(RECIPES)).toHaveLength(242);
  });

  it('bindet die 21 primary- und Referenz-IDs exakt und ohne Alternative', () => {
    const rows = COVERAGE_MANIFEST.entries.filter(
      (entry) => entry.coverage === 'composition-recipe' && entry.sourceId.startsWith('bbk-babz-2025:G.'),
    );
    expect(rows.map((entry) => ({
      sourceId: entry.sourceId,
      variant: entry.variant,
      implementation: entry.implementation,
      referenceAsset: entry.referenceAsset,
    }))).toEqual(Object.entries(expected).map(([id, recipe]) => ({
      sourceId: `bbk-babz-2025:${id}`,
      variant: 'primary',
      implementation: `recipe.${id}`,
      referenceAsset: recipe.referenceAsset,
    })));
  });

  it('gated G.1.5 über die vollständige Geometrie statt über einen falschen Fingerprint', () => {
    const recipe = RECIPES['G.1.5'];
    const drawing = composeFromCatalog(recipe.spec, recipe.title);
    expect(drawing.children.find((primitive) => primitive.role === 'body')).toMatchObject({
      type: 'rect', x: 1, y: 6, width: 30, height: 20,
    });
    expect(drawing.children.find(
      (primitive) => primitive.type === 'rect' && primitive.role === 'pictogram' && primitive.y === 23,
    )).toMatchObject({ type: 'rect', x: 1, y: 23, width: 30, height: 3 });
    expect(drawing.children.filter((primitive) => primitive.role === 'head')).toEqual([
      expect.objectContaining({ type: 'circle', cx: 11, cy: 3.5, r: 1.5 }),
      expect.objectContaining({ type: 'circle', cx: 21, cy: 3.5, r: 1.5 }),
    ]);
    const entry = COVERAGE_MANIFEST.entries.find(
      (candidate) => candidate.sourceId === 'bbk-babz-2025:G.1.5',
    );
    expect(entry?.testEvidence).toEqual(['body-geometry-regression', 'svg-snapshot']);
    expect(entry?.testEvidence).not.toContain('body-fingerprint');
  });
});

describe('Anhang I, Teilslice I-b (I.3.1 bis I.3.11)', () => {
  const expected = {
    'I.3.1': { title: 'Boot allgemein', referenceAsset: 'I.3.1_Boot allgemein.svg', spec: { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation' } },
    'I.3.2': { title: 'Schlauchboot', referenceAsset: 'I.3.2_Schlauchboot.svg', spec: { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation', labels: { center: 'Schlauch', centerCapHeightMm: 4.1395 } } },
    'I.3.3': { title: 'Festrumpfschlauchboot', referenceAsset: 'I.3.3_Festrumpfschlauchboot.svg', spec: { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation', labels: { center: 'RIB' } } },
    'I.3.4': { title: 'Hochwasserboot', referenceAsset: 'I.3.4_Hochwasserboot.svg', spec: { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation', labels: { center: 'HW' }, bodyMarks: ['inset-hull-wheel-pair'] } },
    'I.3.5': { title: 'Mehrzweckboot', referenceAsset: 'I.3.5_Mehrzweckboot.svg', spec: { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation', labels: { center: 'MzB' } } },
    'I.3.6': { title: 'Mehrzweckarbeitsboot', referenceAsset: 'I.3.6_Mehrzweckarbeitsboot.svg', spec: { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation', labels: { center: 'MzAB' } } },
    'I.3.7': { title: 'Mehrzweckponton', referenceAsset: 'I.3.7_Mehrzweckponton.svg', spec: { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation', labels: { center: 'MzPt' } } },
    'I.3.8': { title: 'Rettungsboot Typ 1', referenceAsset: 'I.3.8_Rettungsboot_Typ 1.svg', spec: { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation', labels: { center: 'RTB 1' } } },
    'I.3.9': { title: 'Rettungsboot Typ 2', referenceAsset: 'I.3.9_Rettungsboot_Typ 2.svg', spec: { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation', labels: { center: 'RTB 2' } } },
    'I.3.10': { title: 'Raft', referenceAsset: 'I.3.10_Raft.svg', spec: { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation', labels: { center: 'Raft' } } },
    'I.3.11': { title: 'Feuerlöschboot', referenceAsset: 'I.3.11_Feuerlöschboot.svg', spec: { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'feuerwehr', bodyMarks: ['fire-fighting'] } },
  } as const satisfies Record<string, Recipe>;
  const recipes: Record<string, Recipe> = RECIPES;

  it('bindet exakt I.3.1 bis I.3.11 und keine weitere I-Sektion an die Literalreferenzmatrix', () => {
    const actual = Object.fromEntries(
      Object.entries(recipes).filter(([section]) => section.startsWith('I.3.')),
    );
    expect(actual).toEqual(expected);
    expect(Object.keys(actual)).toEqual(Array.from({ length: 11 }, (_, index) => `I.3.${index + 1}`));
  });

  it.each(Object.entries(expected))(
    '%s kompositioniert den gemessenen inset-hull mit der quellengetreuen Beschriftung',
    (section, recipe) => {
      const actualRecipe = recipes[section];
      expect(actualRecipe).toBeDefined();
      if (actualRecipe === undefined) return;
      expect(actualRecipe.spec.kind).toBe('vehicle-water');
      expect(actualRecipe.spec.bodyVariant).toBe('inset-hull');
      expect(actualRecipe.spec.designation).toBeUndefined();
      expect(validateSpec(actualRecipe.spec)).toEqual([]);

      const drawing = composeFromCatalog(actualRecipe.spec, actualRecipe.title);
      const body = drawing.children.find((child) => child.role === 'body');
      expect(body).toBeDefined();
      expect(body?.type).toBe('path');
      if (body?.type === 'path') {
        expect(body.d).toBe('M 1.01 9.0001 L 30.9894 9.0001 C 30.9894 17.2787, 24.2783 23.9898, 15.9997 23.9898 C 7.7211 23.9898, 1.01 17.2787, 1.01 9.0001 Z');
      }
      expect(matchFingerprint(drawing, fingerprintFor(recipe.referenceAsset))).toEqual({ ok: true, problems: [] });

      const labels = drawing.children.filter(
        (child): child is Primitive & { type: 'text' } => child.type === 'text' && child.role === 'label',
      );
      const center = 'labels' in recipe.spec ? recipe.spec.labels?.center : undefined;
      expect(labels).toHaveLength(center === undefined ? 0 : 1);
      if (center !== undefined) {
        expect(labels[0]?.content).toBe(center);
        expect(labels[0]?.style?.fill).toBe('schwarz');
        expect(labels[0]?.y).toBeCloseTo(15.9999, 3);
      }
    },
  );

  it('hält die einzigartige Schlauchboot-Kappenhöhe und die sonst fehlenden Kappenüberschreibungen fest', () => {
    expect(recipes['I.3.2']?.spec.labels).toEqual({ center: 'Schlauch', centerCapHeightMm: 4.1395 });
    for (const section of Object.keys(expected).filter((section) => section !== 'I.3.2')) {
      expect(recipes[section]?.spec.labels?.centerCapHeightMm, section).toBeUndefined();
    }
  });

  it('zeichnet die I.3.4-Radmarke und die I.3.11-Löschmarke mit den Task-1-Primitiven', () => {
    const wheelPrimitives = composeFromCatalog(recipes['I.3.4']!.spec, recipes['I.3.4']!.title).children.filter((child) => child.role === 'pictogram');
    expect(wheelPrimitives).toEqual([
      { type: 'circle', role: 'pictogram', cx: 6.75, cy: 23.75, r: 2.25, style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 } },
      { type: 'circle', role: 'pictogram', cx: 25.25, cy: 23.75, r: 2.25, style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 } },
    ]);
    const firePrimitives = composeFromCatalog(recipes['I.3.11']!.spec, recipes['I.3.11']!.title).children.filter((child) => child.role === 'pictogram');
    expect(firePrimitives).toEqual([
      { type: 'line', role: 'pictogram', x1: 2.263209, y1: 15.000055, x2: 21.249843, y2: 15.000055, style: { stroke: 'schwarz', strokeWidth: 0.5 } },
      { type: 'line', role: 'pictogram', x1: 21.249843, y1: 15.000055, x2: 29.736438, y2: 15.000055, style: { stroke: 'schwarz', strokeWidth: 0.5 } },
      { type: 'line', role: 'pictogram', x1: 21.249843, y1: 15.000055, x2: 26.749628, y2: 9.250152, style: { stroke: 'schwarz', strokeWidth: 0.5 } },
      { type: 'line', role: 'pictogram', x1: 21.249843, y1: 15.000055, x2: 25.901906, y2: 19.901884, style: { stroke: 'schwarz', strokeWidth: 0.5 } },
    ]);
  });
});

describe('Anhang I, Teilslice I.5 (I.5.1 bis I.5.3)', () => {
  const expected = {
    'I.5.1': {
      title: 'Einsatzkraft Wasserrettung',
      referenceAsset: 'I.5.1_Einsatzkraft Wasserrettung.svg',
      spec: {
        kind: 'person',
        bodyVariant: 'compact-person-diamond-26mm',
        technicalFill: 'weiss',
        bodyMarks: ['double-wave-inner-diamond-8mm'],
      },
    },
    'I.5.2': {
      title: 'Strömungsretter',
      referenceAsset: 'I.5.2_Strömungsretter.svg',
      spec: {
        kind: 'person',
        bodyVariant: 'compact-person-diamond-26mm-lowered-2mm',
        technicalFill: 'weiss',
        bodyMarks: ['double-wave-inner-diamond-8mm'],
        labels: {
          aboveLeft: 'Strömungsretter',
          aboveLeftMetrics: {
            capHeightMm: 2.432746,
            anchorFromBodyLeftMm: -2,
            baselineFromBodyTopMm: -1.5,
          },
        },
      },
    },
    'I.5.3': {
      title: 'Taucher',
      referenceAsset: 'I.5.3_Taucher.svg',
      spec: {
        kind: 'person',
        bodyVariant: 'compact-person-diamond-26mm-lowered-2mm',
        technicalFill: 'weiss',
        bodyMarks: ['double-wave-inner-diamond-8mm'],
        labels: {
          aboveLeft: 'Taucher',
          aboveLeftMetrics: {
            capHeightMm: 2.919225,
            anchorFromBodyLeftMm: -2,
            baselineFromBodyTopMm: -1,
          },
        },
      },
    },
  } as const satisfies Record<string, Recipe>;
  const recipes: Readonly<Record<string, Recipe>> = Object.fromEntries(
    Object.entries(ANHANG_I_RECIPES).filter(([section]) => /^I\.5\.[1-3]$/.test(section)),
  );

  it('bindet ausschließlich die drei vermessenen Wasserrettungsrezepte literal an Quelle und Geometrie', () => {
    expect(recipes).toEqual(expected);
    expect(Object.keys(recipes)).toEqual(['I.5.1', 'I.5.2', 'I.5.3']);
    expect(Object.fromEntries(
      Object.entries(RECIPES).filter(([section]) => /^I\.5\.[1-3]$/.test(section)),
    )).toEqual(expected);
  });

  it.each(Object.entries(expected))(
    '%s verwendet ausschließlich die technische Doppelwelle mit Innenraute ohne Fachsemantik',
    (section, recipe) => {
      const actual = recipes[section];
      expect(actual).toBeDefined();
      if (actual === undefined) return;

      expect(actual.spec.organization).toBeUndefined();
      expect(actual.spec.technicalFill).toBe('weiss');
      expect(actual.spec.bodyMarks).toEqual(['double-wave-inner-diamond-8mm']);
      const spec = actual.spec as unknown as Record<string, unknown>;
      expect(spec.capability).toBeUndefined();
      expect(spec.functionRole).toBeUndefined();
      expect(spec.qualification).toBeUndefined();
      expect(validateSpec(actual.spec)).toEqual([]);

      const drawing = composeFromCatalog(actual.spec, actual.title);
      expect(matchFingerprint(drawing, comparableBodyFingerprint(fingerprintFor(recipe.referenceAsset)))).toMatchObject({
        ok: true,
        problems: [],
      });
    },
  );

  it.each([
    ['accessible-light', ACCESSIBLE_LIGHT_THEME],
    ['print-monochrome', PRINT_MONOCHROME_THEME],
  ] as const)('rendert I.5 im Theme %s ohne erfundene Organisationskontur', (_id, theme) => {
    for (const section of ['I.5.1', 'I.5.2', 'I.5.3'] as const) {
      const recipe = recipes[section]!;
      expect(renderSvg(composeFromCatalog(recipe.spec, recipe.title), { theme }), section)
        .not.toContain('stroke-dasharray=');
    }
  });

  it.each([
    ['accessible-light', ACCESSIBLE_LIGHT_THEME],
    ['print-monochrome', PRINT_MONOCHROME_THEME],
  ] as const)('bewahrt die gepunktete Hilfsorganisationskontur im Theme %s', (_id, theme) => {
    const recipe = RECIPES['I.3.5']!;
    expect(renderSvg(composeFromCatalog(recipe.spec, recipe.title), { theme }))
      .toContain('stroke-dasharray="1 2"');
  });

  it.each([
    ['I.5.1', undefined, undefined, undefined],
    ['I.5.2', 'Strömungsretter', 1, 3.5],
    ['I.5.3', 'Taucher', 1, 4],
  ] as const)('%s hält die gemessene Above-left-Textlage fest', (section, content, x, y) => {
    const recipe = recipes[section]!;
    const labels = composeFromCatalog(recipe.spec, recipe.title).children.filter(
      (child): child is Primitive & { type: 'text' } => child.type === 'text' && child.role === 'label',
    );
    if (content === undefined) {
      expect(labels).toEqual([]);
      return;
    }

    expect(labels).toHaveLength(1);
    expect(labels[0]?.content).toBe(content);
    expect(labels[0]?.x).toBeCloseTo(x, 12);
    expect(labels[0]?.y).toBeCloseTo(y, 12);
  });

  it.each([
    ['I.5.2', 2.432746],
    ['I.5.3', 2.919225],
  ] as const)('%s leitet den Schriftgrad aus der gemessenen Versalhöhe ab', (section, capHeightMm) => {
    const recipe = recipes[section]!;
    const label = composeFromCatalog(recipe.spec, recipe.title).children.find(
      (child): child is Primitive & { type: 'text' } => child.type === 'text' && child.role === 'label',
    );
    expect(label).toBeDefined();
    expect((label?.sizeMm ?? Number.NaN) * ARIMO_CAP_HEIGHT_FRACTION).toBeCloseTo(capHeightMm, 6);
  });

  it.each([
    ['I.5.1', undefined],
    ['I.5.2', 'Strömungsretter'],
    ['I.5.3', 'Taucher'],
  ] as const)('%s beschreibt Basis, technische Marke und sichtbares Label ohne Organisationssemantik', (section, label) => {
    const recipe = recipes[section]!;
    const description = composeFromCatalog(recipe.spec, recipe.title).description;

    expect(description).toContain('Grundzeichen: Person');
    expect(description).toContain('Technische Körpermarke: Doppelwelle mit Innenraute (8 mm)');
    expect(description).not.toContain('undefined');
    expect(description).not.toContain('Organisation:');
    if (label === undefined) {
      expect(description).not.toContain('Kürzel oberhalb:');
    } else {
      expect(description).toContain(`Kürzel oberhalb: ${label}`);
    }
  });
});
describe('Anhang I, Teilslice I-b (I.2.4 bis I.2.7)', () => {
  const expected = {
    'I.2.4': {
      title: 'Anhänger Wasserrettung',
      referenceAsset: 'I.2.4_Anhänger Wasserrettung.svg',
      bodyMarks: ['trailer-water-rescue'] as const,
      labels: undefined,
    },
    'I.2.5': {
      title: 'Anhänger Tauchen',
      referenceAsset: 'I.2.5_Anhänger Tauchen.svg',
      bodyMarks: ['trailer-diving'] as const,
      labels: {
        center: 'Tauchen',
        centerBaselineFromBodyBottomMm: 14.5,
        centerCapHeightMm: 2.919,
        centerAnchorFromBodyLeftMm: 8.24,
      },
    },
    'I.2.6': {
      title: 'Anhänger Strömungsrettung',
      referenceAsset: 'I.2.6_Anhänger Strömungsrettung.svg',
      bodyMarks: ['trailer-diving'] as const,
      labels: {
        center: 'Strömungsrettung',
        centerBaselineFromBodyBottomMm: 14.327,
        centerCapHeightMm: 2.191447,
      },
    },
    'I.2.7': {
      title: 'Bootsanhänger',
      referenceAsset: 'I.2.7_Bootsanhänger.svg',
      bodyMarks: ['trailer-boat-hull'] as const,
      labels: undefined,
    },
  } as const;

  it('bindet genau die vier literalen Wasserrettungs-Anhänger ohne Ersatzquelle oder Duplikat', () => {
    const cases = Object.fromEntries(
      (Object.keys(expected) as Array<keyof typeof expected>)
        .map((section) => {
          const recipe: Recipe = RECIPES[section];
          return [section, {
          title: recipe.title,
          referenceAsset: recipe.referenceAsset,
          bodyMarks: recipe.spec.bodyMarks,
          labels: recipe.spec.labels,
          }];
        }),
    );
    expect(cases).toEqual(expected);
  });

  it.each(Object.entries(expected))(
    '%s bleibt ein radloser Anhänger mit ausschließlich der vermessenen technischen Innenmarke',
    (section, expectedCase) => {
      const recipe: Recipe | undefined = RECIPES[section as keyof typeof RECIPES];
      expect(recipe).toBeDefined();
      if (recipe === undefined) return;

      expect(recipe.spec).toMatchObject({
        kind: 'trailer',
        organization: 'hilfsorganisation',
        bodyMarks: expectedCase.bodyMarks,
      });
      expect(recipe.spec.bodyVariant).toBeUndefined();
      expect(recipe.spec.vehicleCategory).toBeUndefined();
      expect(recipe.spec.labels).toEqual(expectedCase.labels);
      expect(validateSpec(recipe.spec)).toEqual([]);

      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(drawing.children.filter((child) => child.role === 'bodyExtra')).toHaveLength(1);
      expect(drawing.children.filter((child) => child.role === 'chassis')).toHaveLength(0);
      expect(drawing.children.filter((child) => child.role === 'pictogram')).not.toHaveLength(0);
    },
  );

  it('setzt I.2.5s Tauchen-Lauf auf den aus der Quelle gemessenen Anker x = 12,24 mm', () => {
    const recipe: Recipe = RECIPES['I.2.5'];
    const labels = composeFromCatalog(recipe.spec, recipe.title).children.filter(
      (child): child is Primitive & { type: 'text' } => child.type === 'text' && child.role === 'label',
    );
    expect(labels).toEqual([expect.objectContaining({
      content: 'Tauchen', anchor: 'middle', x: 12.24, y: 11.5,
      sizeMm: 2.919 / ARIMO_CAP_HEIGHT_FRACTION,
    })]);
  });
});

describe('Anhang I, Teilslice I-g (I.1.17 bis I.1.20)', () => {
  const expected = {
    'I.1.17': {
      title: 'Strömungsrettungstrupp',
      referenceAsset: 'I.1.17_Strömungsrettungstrupp.svg',
      spec: {
        kind: 'formation',
        organization: 'hilfsorganisation',
        strength: 'trupp',
        bodyMarks: ['formation-water-rescue-lower-zone'],
        labels: {
          center: 'Strömungsrettung',
          centerBaselineFromBodyBottomMm: 16,
          centerCapHeightMm: 2.5,
          centerBoxMarginMm: 0.5,
        },
      },
    },
    'I.1.18': {
      title: 'Strömungsrettungsgruppe',
      referenceAsset: 'I.1.18_Strömungsrettungsgruppe.svg',
      spec: {
        kind: 'formation',
        organization: 'hilfsorganisation',
        strength: 'gruppe',
        bodyMarks: ['formation-water-rescue-lower-zone'],
        labels: {
          center: 'Strömungsrettung',
          centerBaselineFromBodyBottomMm: 16,
          centerCapHeightMm: 2.5,
          centerBoxMarginMm: 0.5,
        },
      },
    },
    'I.1.19': {
      title: 'Trupp Luftunterstützte Wasserrettung',
      referenceAsset: 'I.1.19_Trupp Luftunterstützte Wasserrettung.svg',
      spec: {
        kind: 'formation',
        organization: 'hilfsorganisation',
        strength: 'trupp',
        bodyMarks: ['formation-water-rescue-lower-zone', 'formation-opposed-triangles-top'],
      },
    },
    'I.1.20': {
      title: 'Trupp Drohne',
      referenceAsset: 'I.1.20_Trupp Drohne.svg',
      spec: {
        kind: 'formation',
        organization: 'hilfsorganisation',
        strength: 'trupp',
        bodyMarks: ['formation-water-rescue-lower-zone', 'formation-chevron-top'],
      },
    },
  } as const;
  const recipes: Record<string, Recipe> = RECIPES;

  it('bindet exakt die vier freigegebenen I-g-Referenzen an ihre gemessenen Specs', () => {
    expect(Object.fromEntries(
      Object.entries(recipes).filter(([section]) => Object.hasOwn(expected, section)),
    )).toEqual(expected);
  });

  it.each(Object.entries(expected))(
    '%s bleibt eine weiße Formation mit belegter Stärke und gültigem Vertrag',
    (section, recipe) => {
      expect(validateSpec(recipe.spec)).toEqual([]);
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(drawing.children.find((child) => child.role === 'body')?.style?.fill).toBe('weiss');
      expect(drawing.children.filter((child) => child.role === 'head').length).toBeGreaterThan(0);

      const labels = drawing.children.filter(
        (child): child is Primitive & { type: 'text' } =>
          child.type === 'text' && child.role === 'label',
      );
      if (section === 'I.1.17' || section === 'I.1.18') {
        expect(labels).toEqual([
          expect.objectContaining({
            content: 'Strömungsrettung',
            x: 16,
            y: 10,
            sizeMm: 2.5 / ARIMO_CAP_HEIGHT_FRACTION,
            anchor: 'middle',
            boxMm: expect.objectContaining({ xMm: 1.5, widthMm: 29 }),
          }),
        ]);
      } else {
        expect(labels).toHaveLength(0);
      }
    },
  );
});

describe('Anhang I, Teilslice I-f (I.1.13 bis I.1.16)', () => {
  const expected = {
    'I.1.13': {
      title: 'Trupp Umweltgefahren',
      referenceAsset: 'I.1.13_Trupp Umweltgefahren.svg',
      spec: {
        kind: 'formation',
        technicalFill: 'weiss',
        strength: 'trupp',
        bodyMarks: ['formation-hooked-crossed-disks-over-lowered-wave-diamond'],
      },
    },
    'I.1.14': {
      title: 'Gruppe Umweltgefahren',
      referenceAsset: 'I.1.14_Gruppe Umweltgefahren.svg',
      spec: {
        kind: 'formation',
        technicalFill: 'weiss',
        strength: 'gruppe',
        bodyMarks: ['formation-hooked-crossed-disks-over-lowered-wave-diamond'],
      },
    },
    'I.1.15': {
      title: 'Trupp Ölabwehr',
      referenceAsset: 'I.1.15_Trupp Ölabwehr.svg',
      spec: {
        kind: 'formation',
        technicalFill: 'weiss',
        strength: 'trupp',
        bodyMarks: ['formation-water-rescue-lower-zone'],
        labels: {
          center: 'Öl',
          centerBaselineFromBodyBottomMm: 15.45,
          centerCapHeightMm: 3,
        },
      },
    },
    'I.1.16': {
      title: 'Gruppe Ölabwehr',
      referenceAsset: 'I.1.16_Gruppe Ölabwehr.svg',
      spec: {
        kind: 'formation',
        technicalFill: 'weiss',
        strength: 'gruppe',
        bodyMarks: ['formation-water-rescue-lower-zone'],
        labels: {
          center: 'Öl',
          centerBaselineFromBodyBottomMm: 15.45,
          centerCapHeightMm: 3,
        },
      },
    },
  } as const;
  const recipes: Record<string, Recipe> = RECIPES;

  it('bindet exakt vier primary-Referenzen an ihre literalen Specs', () => {
    expect(Object.fromEntries(
      Object.entries(recipes).filter(([section]) => Object.hasOwn(expected, section)),
    )).toEqual(expected);
  });

  it.each(Object.entries(expected))(
    '%s bleibt eine Formation ohne abgeleitete Organisationssemantik',
    (section, recipe) => {
      expect(validateSpec(recipe.spec)).toEqual([]);
      expect(recipe.spec).not.toHaveProperty('organization');
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(drawing.children.find((child) => child.role === 'body')?.style?.fill).toBe('weiss');

      const labels = drawing.children.filter(
        (child): child is Primitive & { type: 'text' } =>
          child.type === 'text' && child.role === 'label',
      );
      if (section === 'I.1.15' || section === 'I.1.16') {
        expect(labels).toEqual([
          expect.objectContaining({
            content: 'Öl',
            anchor: 'middle',
            x: 16,
            y: 10.55,
            sizeMm: 3 / ARIMO_CAP_HEIGHT_FRACTION,
            boxMm: expect.objectContaining({ xMm: 2, widthMm: 28 }),
          }),
        ]);
      } else {
        expect(labels).toHaveLength(0);
      }
    },
  );
});

describe('Anhang I, Teilslice I-j (I.4.1 bis I.4.3)', () => {
  const expected = {
    'I.4.1': [
      'Wasserrettungsstation, ortsgebunden',
      'I.4.1_Wasserrettungsstation_ortsgebunden.svg',
      'circle-two-waves-diamond',
      'raised-gable',
    ],
    'I.4.2': [
      'Slip-Stelle',
      'I.4.2_Slip-Stelle.svg',
      'circle-diagonal-double-arrow-offset-bowl',
      undefined,
    ],
    'I.4.3': [
      'Anlegestelle für Boote',
      'I.4.3_Anlegestelle für Boote.svg',
      'circle-wide-bowl',
      undefined,
    ],
  } as const;
  const recipes: Record<string, Recipe> = RECIPES;

  it('bindet genau drei literale Wasserrettungsorte an Referenz, Kreisfassung und Innenmarke', () => {
    const actual = Object.fromEntries(
      Object.entries(recipes)
        .filter(([section]) => section.startsWith('I.4.'))
        .map(([section, recipe]) => [
          section,
          [
            recipe.title,
            recipe.referenceAsset,
            recipe.spec.bodyMarks?.[0],
            recipe.spec.bodyVariant,
          ],
        ]),
    );
    expect(actual).toEqual(expected);
  });

  it.each(Object.entries(expected))(
    '%s bleibt eine geometrische Kreisvariation ohne erfundene Ortsgebunden-Semantik',
    (section, [_title, referenceAsset, bodyMark, bodyVariant]) => {
      const recipe = recipes[section];
      expect(recipe).toBeDefined();
      if (recipe === undefined) return;

      expect(recipe.spec).toEqual({
        kind: 'circle-12',
        ...(bodyVariant === undefined ? {} : { bodyVariant }),
        organization: 'hilfsorganisation',
        bodyMarks: [bodyMark],
      });
      expect(validateSpec(recipe.spec)).toEqual([]);

      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(matchFingerprint(drawing, fingerprintFor(referenceAsset))).toEqual({
        ok: true,
        problems: [],
      });
      expect(drawing.children.find((child) => child.role === 'body')).toEqual({
        type: 'circle', role: 'body', cx: 16, cy: bodyVariant === 'raised-gable' ? 18 : 16,
        r: 12,
        style: {
          fill: 'weiss',
          stroke: 'schwarz',
          strokeWidth: 0.5,
          bodyStrokeDashToken: 'weiss',
        },
      });
      expect(drawing.children.filter((child) => child.role === 'bodyExtra')).toEqual(
        bodyVariant === 'raised-gable'
          ? [{
              type: 'polyline', role: 'bodyExtra', closed: false,
              points: [[3, 11], [16, 1], [29, 11]],
              style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
            }]
          : [],
      );
    },
  );
});

describe('Anhang I, Teilslice I-c (I.1.1 bis I.1.4)', () => {
  const recipes: Record<string, Recipe> = RECIPES;
  const expected = {
    'I.1.1': {
      title: 'Wasserrettungstrupp',
      referenceAsset: 'I.1.1_Wasserrettungstrupp.svg',
      spec: { kind: 'formation', strength: 'trupp', bodyMarks: ['formation-two-waves-diamond'] },
    },
    'I.1.2': {
      title: 'Wasserrettungsgruppe',
      referenceAsset: 'I.1.2_Wasserrettungsgruppe.svg',
      spec: { kind: 'formation', strength: 'gruppe', bodyMarks: ['formation-two-waves-diamond'] },
    },
    'I.1.3': {
      title: 'Wasserrettungszug',
      referenceAsset: 'I.1.3_Wasserrettungszug.svg',
      spec: { kind: 'formation', strength: 'zug', bodyMarks: ['formation-two-waves-diamond'] },
    },
    'I.1.4': {
      title: 'Wasserrettungsverband',
      referenceAsset: 'I.1.4_Wasserrettungsverband.svg',
      spec: {
        kind: 'formation',
        technicalHeadMark: 'single-vertical-bar',
        bodyMarks: ['formation-two-waves-diamond'],
      },
    },
  } as const;

  it('bindet exakt vier Wasserrettungsformationen an die Literalrezepte', () => {
    const actual = Object.fromEntries(
      Object.entries(ANHANG_I_RECIPES).filter(([section]) => Object.hasOwn(expected, section)),
    );
    expect(actual).toEqual(expected);
    expect(Object.fromEntries(
      Object.entries(RECIPES).filter(([section]) => Object.hasOwn(expected, section)),
    )).toEqual(expected);
  });

  it.each(Object.entries(expected))(
    '%s verwendet ausschließlich die vermessene Formationsfassung der Wasserrettung',
    (section, expectedRecipe) => {
      const recipe = recipes[section];
      expect(recipe).toEqual(expectedRecipe);
      if (recipe === undefined) return;

      expect(recipe.spec.organization).toBeUndefined();
      expect(recipe.spec.bodyVariant).toBeUndefined();
      expect(recipe.spec.capabilities).toBeUndefined();
      expect(recipe.spec.labels).toBeUndefined();
      expect(recipe.spec.designation).toBeUndefined();
      expect(validateSpec(recipe.spec)).toEqual([]);

      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(drawing.children.find((child) => child.role === 'body')).toMatchObject({
        type: 'rect', x: 1, y: 6, width: 30, height: 20,
      });
      expect(drawing.children.filter((child) => child.role === 'pictogram')).toHaveLength(3);
    },
  );

  it('setzt Trupp, Gruppe und Zug auf die bestehenden Kreisplätze', () => {
    const positions = {
      'I.1.1': [16],
      'I.1.2': [11, 21],
      'I.1.3': [11, 16, 21],
    } as const;

    for (const [section, xs] of Object.entries(positions)) {
      const recipe = recipes[section];
      expect(recipe).toBeDefined();
      if (recipe === undefined) continue;
      const drawing = composeFromCatalog(recipe.spec);
      expect(drawing.children
        .filter((child): child is Extract<Primitive, { type: 'circle' }> =>
          child.type === 'circle' && child.role === 'head')
        .map(({ cx, cy, r }) => ({ cx, cy, r })))
        .toEqual(xs.map((cx) => ({ cx, cy: 3.5, r: 1.5 })));
    }
  });

  it('setzt I.1.4s technische Einzelmarke effektiv auf 15,25/1/1,5/4', () => {
    const recipe = recipes['I.1.4'];
    expect(recipe).toBeDefined();
    if (recipe === undefined) return;

    const drawing = composeFromCatalog(recipe.spec);
    const head = drawing.children.find(
      (child) => child.type === 'group' && child.role === 'head',
    );
    expect(head).toMatchObject({
      type: 'group',
      transform: { translate: { dxMm: 0, dyMm: 1 } },
      children: [{
        type: 'rect', role: 'head', x: 15.25, y: 0, width: 1.5, height: 4,
        style: { fill: 'schwarz', stroke: 'none' },
      }],
    });
    expect(head === undefined ? undefined : boundsOfMm(head))
      .toEqual({ minX: 15.25, minY: 1, maxX: 16.75, maxY: 5 });
  });
});
describe('Anhang I, LFH-486 (I.2.1 bis I.2.3)', () => {
  const topLeftMetrics = {
    capHeightMm: 3.18236,
    baselineFromBodyTopMm: 6.55959,
    anchorFromBodyLeftMm: 1.56869,
  } as const;
  const expected = {
    'I.2.1': {
      title: 'Gerätewagen Wasserrettung, geländegängig',
      referenceAsset: 'I.2.1_Gerätewagen Wasserrettung_geländegängig.svg',
      spec: {
        kind: 'vehicle-land', organization: 'hilfsorganisation',
        vehicleCategory: 'kfz-kategorie-2', bodyMarks: ['water-rescue'],
        labels: { topLeft: 'GW', topLeftMetrics },
      },
    },
    'I.2.2': {
      title: 'Gerätewagen Tauchen',
      referenceAsset: 'I.2.2_Gerätewagen Tauchen.svg',
      spec: {
        kind: 'vehicle-land', organization: 'hilfsorganisation',
        vehicleCategory: 'kfz-kategorie-1', bodyMarks: ['water-rescue'],
        labels: { topLeft: 'GW Tauchen', topLeftMetrics },
      },
    },
    'I.2.3': {
      title: 'Gerätewagen Strömungsrettung',
      referenceAsset: 'I.2.3_Gerätewagen Strömungsrettung.svg',
      spec: {
        kind: 'vehicle-land', organization: 'hilfsorganisation',
        vehicleCategory: 'kfz-kategorie-1', bodyMarks: ['water-rescue'],
        labels: { topLeft: 'GW SR', topLeftMetrics },
      },
    },
  } as const;

  it('bindet genau die drei literalen Landfahrzeugrezepte an Quelle, Kategorie, Marke und Label', () => {
    expect(Object.fromEntries(
      Object.entries<Recipe>(RECIPES).filter(([key]) => /^I\.2\.[1-3]$/.test(key)),
    )).toEqual(expected);
  });

  it.each(Object.entries(expected))(
    '%s komponiert Normalhülle, gemessenes Fahrwerk, schwarze obere Beschriftung und Wasserrettung',
    (key, expectedRecipe) => {
      const recipe = (RECIPES as Record<string, Recipe>)[key];
      expect(recipe).toEqual(expectedRecipe);
      if (recipe === undefined) return;
      expect(validateSpec(recipe.spec)).toEqual([]);
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(drawing.children.filter((child) => child.role === 'chassis'))
        .toHaveLength(recipe.spec.vehicleCategory === 'kfz-kategorie-2' ? 3 : 2);
      expect(drawing.children.filter((child) => child.role === 'pictogram'))
        .toEqual(expect.arrayContaining([
          expect.objectContaining({ type: 'path' }),
          expect.objectContaining({ type: 'polyline', closed: true }),
        ]));
      const label = drawing.children.find(
        (child): child is Extract<Primitive, { type: 'text' }> =>
          child.type === 'text' && child.role === 'label',
      );
      expect(label).toMatchObject({
        content: expectedRecipe.spec.labels.topLeft,
        anchor: 'start',
        style: { fill: 'schwarz' },
      });
      expect((label?.sizeMm ?? 0) * ARIMO_CAP_HEIGHT_FRACTION)
        .toBeCloseTo(topLeftMetrics.capHeightMm, 6);
      expect(label?.y).toBeCloseTo(5.75 + topLeftMetrics.baselineFromBodyTopMm, 6);
      expect(key).toMatch(/^I\.2\.[1-3]$/);
    },
  );
});
describe('Anhang I, Teilslice I-d (I.1.5 bis I.1.8)', () => {
  const expected = {
    'I.1.5': {
      title: 'Zugtrupp Wasserrettungszug',
      referenceAsset: 'I.1.5_Zugtrupp Wasserrettungszug.svg',
      spec: {
        kind: 'formation',
        organization: 'hilfsorganisation',
        strength: 'trupp',
        bodyMarks: ['formation-water-rescue-compact', 'formation-solid-cap-3.7mm-three-hole-row'],
      },
    },
    'I.1.6': {
      title: 'Führungstrupp Wasserrettung',
      referenceAsset: 'I.1.6_Führungstrupp Wasserrettung.svg',
      spec: {
        kind: 'formation',
        organization: 'hilfsorganisation',
        strength: 'trupp',
        bodyMarks: ['formation-water-rescue-compact', 'formation-solid-cap-3mm'],
      },
    },
    'I.1.7': {
      title: 'Führungsgruppe Wasserrettung',
      referenceAsset: 'I.1.7_Führungsgruppe Wasserrettung.svg',
      spec: {
        kind: 'formation',
        organization: 'hilfsorganisation',
        strength: 'gruppe',
        bodyMarks: ['formation-water-rescue-compact', 'formation-solid-cap-3mm'],
      },
    },
    'I.1.8': {
      title: 'Führungsstaffel Wasserrettung',
      referenceAsset: 'I.1.8_Führungsstaffel Wasserrettung.svg',
      spec: {
        kind: 'formation',
        organization: 'hilfsorganisation',
        strength: 'staffel',
        bodyMarks: ['formation-water-rescue-compact', 'formation-solid-cap-3mm'],
      },
    },
  } as const satisfies Record<string, Recipe>;
  const recipes: Readonly<Record<string, Recipe>> = Object.fromEntries(
    Object.entries(ANHANG_I_RECIPES).filter(([section]) => /^I\.1\.[5-8]$/.test(section)),
  );

  it('grenzt innerhalb der gemeinsamen Anhang-I-Aggregation exakt die vier I-d-Rezepte ab', () => {
    expect(recipes).toEqual(expected);
  });

  it('integriert I.1.5 bis I.1.8 exakt neben den übrigen I.1-Slices', () => {
    expect(Object.keys(RECIPES).filter((section) => /^I\.1\.[5-8]$/.test(section))).toEqual([
      'I.1.5',
      'I.1.6',
      'I.1.7',
      'I.1.8',
    ]);
  });

  it.each(Object.keys(expected) as (keyof typeof expected)[])(
    '%s ist als exakt diese Formation valide',
    (section) => {
      const recipe = recipes[section];
      expect(recipe).toBeDefined();
      if (recipe === undefined) return;
      expect(recipe.spec).toEqual(expected[section].spec);
      expect(validateSpec(recipe.spec)).toEqual([]);
    },
  );

  it('hält Kopf, Körper und Kappe in der belegten vertikalen Lage', () => {
    const placements = {
      'I.1.5': {
        body: { minX: 1, minY: 6, maxX: 31, maxY: 26 },
        heads: [{ cx: 16, cy: 3.5, r: 1.5 }],
        capHeight: 3.7,
      },
      'I.1.6': {
        body: { minX: 1, minY: 6, maxX: 31, maxY: 26 },
        heads: [{ cx: 16, cy: 3.5, r: 1.5 }],
        capHeight: 3,
      },
      'I.1.7': {
        body: { minX: 1, minY: 6, maxX: 31, maxY: 26 },
        heads: [
          { cx: 11, cy: 3.5, r: 1.5 },
          { cx: 21, cy: 3.5, r: 1.5 },
        ],
        capHeight: 3,
      },
      'I.1.8': {
        body: { minX: 1, minY: 9, maxX: 31, maxY: 29 },
        heads: [
          { cx: 16, cy: 2.5, r: 1.5 },
          { cx: 16, cy: 6.5, r: 1.5 },
        ],
        capHeight: 3,
      },
    } as const;

    for (const [section, placement] of Object.entries(placements)) {
      const recipe = recipes[section];
      expect(recipe, `${section} fehlt`).toBeDefined();
      if (recipe === undefined) continue;

      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      const body = drawing.children.find((child) => child.role === 'body');
      expect(body, `${section}: Körper`).toBeDefined();
      if (body === undefined) continue;
      const bodyBounds = boundsOfMm(body);
      expect(bodyBounds, `${section}: Körperhülle`).toEqual(placement.body);
      expect(body.style?.fill, `${section}: Körperfarbe`).toBe('weiss');

      const heads = drawing.children
        .filter((child): child is Primitive & { type: 'circle' } =>
          child.type === 'circle' && child.role === 'head')
        .map(({ cx, cy, r }) => ({ cx, cy, r }));
      expect(heads, `${section}: Kopfzone`).toEqual(placement.heads);
      expect(
        bodyBounds.minY - Math.max(...heads.map((head) => head.cy + head.r)),
        `${section}: Abstand zwischen Kopf und Körper`,
      ).toBe(1);

      const cap = drawing.children.find((child): child is Primitive & { type: 'rect' } =>
        child.type === 'rect' &&
        child.role === 'pictogram' &&
        child.x === bodyBounds.minX &&
        child.y === bodyBounds.minY &&
        child.width === bodyBounds.maxX - bodyBounds.minX &&
        child.height === placement.capHeight &&
        child.style?.fill === 'schwarz');
      expect(cap, `${section}: Kappe`).toBeDefined();
    }
  });
});
describe('Anhang E, Teilslice E-a (E.1.1 bis E.1.16)', () => {
  const cases = Object.entries<Recipe>(ANHANG_E_A_RECIPES);

  function labelsOf(section: keyof typeof ANHANG_E_A_RECIPES) {
    const drawing = composeFromCatalog(
      ANHANG_E_A_RECIPES[section].spec,
      ANHANG_E_A_RECIPES[section].title,
    );
    return drawing.children.filter(
      (child): child is Primitive & { type: 'text' } =>
        child.type === 'text' && child.role === 'label',
    );
  }

  it('deckt genau die 16 Abschnitte E.1.1 bis E.1.16 ab', () => {
    expect(cases.map(([section]) => section)).toEqual(
      Array.from({ length: 16 }, (_, index) => `E.1.${index + 1}`),
    );
  });

  it.each(cases)('%s steht auf blauem formation-Körper mit Trägerkürzel THW', (_section, recipe) => {
    const drawing = composeFromCatalog(recipe.spec, recipe.title);
    const body = drawing.children.find((c) => c.role === 'body');
    expect(body?.style?.fill).toBe('blau');
    expect(recipe.spec.kind).toBe('formation');
    expect(recipe.spec.labels?.bottomRight).toBe('THW');
    expect(recipe.referenceAsset.startsWith(`${_section}_`)).toBe(true);
  });

  it('trägt bei 15 von 16 die Kopfzone der Gruppe — und bei E.1.3 keine', () => {
    // Der Sonderfall ist an der Referenzdatei belegt: E.1.3 führt in der Ebene
    // `Takt_Zeichen (umgewandelt)` nur den Rahmenpfad, die 15 anderen zusätzlich zwei Kopfmarken.
    for (const [section, recipe] of cases) {
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      const head = drawing.children.filter((c) => c.role === 'head');
      expect(head, section).toHaveLength(section === 'E.1.3' ? 0 : 2);
    }
  });

  it('setzt keinen Text unterhalb des Körpers', () => {
    // Die Fußzone bleibt für Anhang E unbelegt. Stünde hier ein `foot`-Lauf, hätte jemand
    // `designation` mit den Beschriftungszonen verwechselt — die Zeichnung sähe dann anders aus
    // als die Referenz, ohne dass ein Geometriegate anschlüge.
    for (const [section, recipe] of cases) {
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(drawing.children.filter((c) => c.role === 'foot'), section).toHaveLength(0);
    }
  });

  it('platziert die drei Zonen auf den vermessenen Grundlinien und Rändern', () => {
    // Werte aus der Vermessung aller 16 Referenzdateien: Kürzel mittig auf Grundlinie 18 mm,
    // beide unteren Läufe auf 24 mm, linke Kante 3 mm, rechte Kante 29 mm.
    const [center, bottomLeft, bottomRight] = labelsOf('E.1.9');
    expect(center?.content).toBe('Öl');
    expect(center?.anchor).toBe('middle');
    expect(center?.x).toBeCloseTo(16, 6);
    expect(center?.y).toBeCloseTo(18, 6);

    expect(bottomLeft?.content).toBe('A');
    expect(bottomLeft?.anchor).toBe('start');
    expect(bottomLeft?.x).toBeCloseTo(3, 6);
    expect(bottomLeft?.y).toBeCloseTo(24, 6);

    expect(bottomRight?.content).toBe('THW');
    expect(bottomRight?.anchor).toBe('end');
    expect(bottomRight?.x).toBeCloseTo(29, 6);
    expect(bottomRight?.y).toBeCloseTo(24, 6);
  });

  it('trifft mit den abgeleiteten Schriftgraden die vermessenen Versalhöhen', () => {
    const [center, , bottomRight] = labelsOf('E.1.9');
    // 4,87 mm und 2,92 mm sind die an der Referenz gemessenen Versalhöhen; der Schriftgrad
    // entsteht daraus über Arimos Versalhöhenanteil, statt geraten zu werden.
    expect((center?.sizeMm ?? 0) * ARIMO_CAP_HEIGHT_FRACTION).toBeCloseTo(4.87, 6);
    expect((bottomRight?.sizeMm ?? 0) * ARIMO_CAP_HEIGHT_FRACTION).toBeCloseTo(2.92, 6);
  });

  it('malt alle Beschriftungen weiss und nennt ihre untere Einsatzgrenze', () => {
    for (const [section, recipe] of cases) {
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      const labels = drawing.children.filter((c) => c.role === 'label');
      expect(labels.length, section).toBeGreaterThan(0);
      for (const label of labels) {
        expect(label.style?.fill, section).toBe('weiss');
        if (label.type !== 'text') continue;
        // Unterhalb dieser Grenze unterschreitet der Lauf MINIMUM_TEXT_RENDER_PX. Beide
        // Schriftgrade landen damit auf der Snapshot-Leiter erst bei 64 px.
        expect(label.minRenderPx, `${section} ${label.content}`).toBeGreaterThan(32);
        expect(label.minRenderPx, `${section} ${label.content}`).toBeLessThanOrEqual(64);
      }
    }
  });

  it('hält die Zusatzkennzeichnung genau an den sechs Typ-A-Zeichen und an E.1.2', () => {
    const withBottomLeft = cases
      .filter(([, recipe]) => recipe.spec.labels?.bottomLeft !== undefined)
      .map(([section]) => section);
    expect(withBottomLeft).toEqual([
      'E.1.2',
      'E.1.9',
      'E.1.10',
      'E.1.11',
      'E.1.12',
      'E.1.15',
      'E.1.16',
    ]);
    // Sechs „Typ A", dazu E.1.2 mit „ASH" — die einzige Zusatzkennzeichnung des Blocks, die
    // keinen Typ bezeichnet, sondern eine Ausstattung (Abstützsystem Holz).
    for (const [section, recipe] of cases) {
      if (section === 'E.1.2') continue;
      if (recipe.spec.labels?.bottomLeft === undefined) continue;
      expect(recipe.spec.labels?.bottomLeft, section).toBe('A');
      expect(recipe.title, section).toMatch(/Typ A$/);
    }
  });

  it('nennt die beiden Referenzdateien mit fehlerhafter Füllfläche und keine weitere', () => {
    // Ihre Abweichung steht in der Manifestzeile; dieser Test hält fest, dass genau diese zwei
    // Dateien betroffen sind, damit die Notiz dort nicht zur Behauptung ohne Beleg wird.
    expect(Object.keys(ANHANG_E_A_FILL_DEFECTS)).toEqual(['E.1.6', 'E.1.14']);
    for (const section of Object.keys(ANHANG_E_A_FILL_DEFECTS)) {
      expect(Object.hasOwn(ANHANG_E_A_RECIPES, section)).toBe(true);
    }
  });

  it('verlangt für die Beschriftung auf der Körperfarbe die Textschwelle, nicht die Nichttextschwelle', () => {
    const requirements = labelContrastRequirements();
    // **42 im integrierten Stand**, und nur eine davon besteht nicht: dreißig Anforderungen
    // stammen aus den einzeln vermessenen Rollenläufen, zwölf aus Körper-/Oberflächenlabels.
    // D.4.2 verwendet denselben eng begrenzten Theme-Token wie D.1.8: quellentreu schwarz auf
    // Rot in Referenz/Accessible und weiß nur im Drucktheme.
    // Organisationsfarbe auf der Ausgabeoberfläche sowie die schwarzen Kreislabels, die
    // teilweise außerhalb der weißen Körperfläche auf `surface` stehen.
    //
    // **Die erste Zeile ist neu und war vorher falsch.** Bis F-a behauptete die Ableitung fest
    // `foreground: 'weiss'`; für `hilfsorganisation` (= `weiss`) hätte das „weiss auf weiss"
    // ergeben — ein Paar mit 1:1, das kein Theme lösen kann und das zugleich das Gegenteil des
    // Gezeichneten wäre, denn `compose.ts` setzt den Lauf auf dem weissen Körper schwarz
    // (`bodyLabelInk`). Die Ableitung ruft jetzt dieselbe Funktion; schwarz auf weiss erreicht
    // 21:1 in allen drei Themes. Sie steht **vor** den THW-Zeilen, weil `RECIPES` Anhang F vor
    // Anhang E einreiht.
    //
    // Die dritte Zeile ist E.2.6 mit dem unveränderten Default „weiss auf orange" — 2,382:1
    // bzw. 2,323:1 und deshalb die einzige entschiedene Ausnahme. Anhang N setzt auf derselben
    // orangefarbenen Fläche sowie auf hellgruen und braun die jeweils an der Quelle vermessene
    // schwarze Tinte. Diese drei Paare stehen separat, obwohl eines denselben Organisationskontext
    // wie E.2.6 trägt; sonst würde der Resolveroverride im Kontrastvertrag unsichtbar. G.3.5
    // ergänzt denselben schwarz/braun-Farbwert als separat benannten bottomCenter-Vertrag.
    expect(requirements).toEqual([
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf disaster-control-command: KatSL',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf technical-incident-command-evacuation: TEL',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf technical-incident-command-evacuation: Evakuierung',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf incident-command: EL',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf incident-section-command-north: EAL',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf incident-section-command-north: Nord',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf incident-subsection-command: UEAL',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf technical-incident-command-group: TEL',
        minimum: 4.5,
      },
      {
        foreground: 'funktionslauf-kontrast',
        background: 'rot',
        context: 'Funktionslauf fire-service-readiness-command-group: Ber',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf technical-incident-commander: TEL',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Funktionslauf technical-incident-commander: AW',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf incident-commander: EL',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf lead-emergency-physician: LNA',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf organizational-incident-commander: OrgL',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf incident-section-commander: EAL',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf incident-subsection-commander: UEAL',
        minimum: 4.5,
      },
      {
        foreground: 'weiss',
        background: 'blau',
        context: 'Funktionslauf technical-platoon-commander: TZ',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Funktionslauf medical-platoon-commander: ASB',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Funktionslauf operational-unit-platoon-commander: DRK',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Funktionslauf care-platoon-commander: ASB',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Funktionslauf care-group-commander: MHD',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'weiss',
        context: 'Funktionslauf rapid-response-group-commander: SEG',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Funktionslauf rapid-response-group-commander: JUH',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf district-control-center-director: LtS',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Funktionslauf district-control-center-director: ST',
        minimum: 4.5,
      },
      {
        foreground: 'funktionslauf-kontrast',
        background: 'rot',
        context: 'Funktionslauf district-fire-chief: KBM',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Funktionslauf district-fire-chief: ME',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'gelb',
        context: 'Funktionslauf hazard-response-director: LtrGA',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Funktionslauf hazard-response-director: MG',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Funktionslauf hazard-response-forces-director: BuPol',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'weiss',
        context: 'Beschriftung im Körper auf Organisation hilfsorganisation',
        minimum: 4.5,
      },
      {
        foreground: 'weiss',
        background: 'blau',
        context: 'Beschriftung im Körper auf Organisation thw',
        minimum: 4.5,
      },
      {
        foreground: 'weiss',
        background: 'orange',
        context: 'Beschriftung im Körper auf Organisation sonstige-gefahrenabwehr',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'orange',
        context: 'Beschriftung im Körper auf Organisation sonstige-gefahrenabwehr',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'hellgruen',
        context: 'Beschriftung im Körper auf Organisation bundespolizei',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'braun',
        context: 'Beschriftung im Körper auf Organisation bundeswehr',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'braun',
        context: 'Schwarze Beschriftung im Körper auf Organisation bundeswehr',
        minimum: 4.5,
      },
      {
        foreground: 'blau',
        background: 'surface',
        context: 'Trägerkürzel unterhalb des Körpers, Organisation thw',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Schwarze Beschriftung unterhalb des Körpers',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Beschriftung oberhalb des Körpers auf der Ausgabeoberfläche',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Beschriftung unterhalb des Körpers auf der Ausgabeoberfläche',
        minimum: 4.5,
      },
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Kreislabel teilweise außerhalb der Körperfläche',
        minimum: 4.5,
      },
    ]);
  });

  it('leitet die Tinte eines überstehenden Kreislabels über denselben Body-Resolver ab', () => {
    const requirements = labelContrastRequirements([{
      title: 'synthetischer Resolververtrag',
      referenceAsset: 'synthetic.svg',
      spec: {
        kind: 'circle-12',
        organization: 'hilfsorganisation',
        labels: {
          topLeft: 'UHS',
          topLeftMetrics: {
            capHeightMm: 2.919225,
            baselineFromBodyTopMm: 1.000254,
            anchorFromBodyLeftMm: -2.984684,
          },
          inBodyInk: 'weiss',
        },
      },
    }]);

    expect(requirements).toContainEqual({
      foreground: 'weiss',
      background: 'surface',
      context: 'Kreislabel teilweise außerhalb der Körperfläche',
      minimum: 4.5,
    });
  });
});

describe('Anhang E, Teilslice E-b (E.1.17 bis E.1.28)', () => {
  const cases = Object.entries<Recipe>(ANHANG_E_B_RECIPES);

  it('deckt genau die zwölf Abschnitte E.1.17 bis E.1.28 ab', () => {
    expect(cases.map(([section]) => section)).toEqual(
      Array.from({ length: 12 }, (_, index) => `E.1.${index + 17}`),
    );
  });

  it.each(cases)('%s steht auf blauem formation-Körper mit Trägerkürzel THW', (_section, recipe) => {
    const drawing = composeFromCatalog(recipe.spec, recipe.title);
    const body = drawing.children.find((c) => c.role === 'body');
    expect(body?.style?.fill).toBe('blau');
    expect(recipe.spec.kind).toBe('formation');
    expect(recipe.spec.labels?.bottomRight).toBe('THW');
    expect(recipe.referenceAsset.startsWith(`${_section}_`)).toBe(true);
  });

  it('führt drei Kopfzonenbreiten und bei E.1.21 keine', () => {
    // E-a konnte diese Zusage mit einer Konstante führen (zwei Marken, eine Ausnahme); hier ist
    // sie es nicht mehr: der Block belegt erstmals alle drei Reihenbreiten des Kompositionsmotors
    // in einem Kapitel. Die Erwartung leitet sich deshalb aus `spec.strength` ab statt aus einer
    // Abschnittsliste — sonst wäre sie eine zweite Abschrift derselben Rezepte.
    //
    // `Stab` trägt keine Kopfzone: ein Führungsgremium hat keine Mannschaftsstärke, das fehlende
    // `strength` ist Absicht (wie E.1.3 in E-a) und dieser Test hält das fest, damit ein später
    // ergänzter Grad als Änderung auffällt und nicht als Vervollständigung durchgeht.
    const marksByStrength: Record<string, number> = { zug: 3, gruppe: 2, trupp: 1 };
    for (const [section, recipe] of cases) {
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      const head = drawing.children.filter((c) => c.role === 'head');
      const strength = recipe.spec.strength;
      expect(head, section).toHaveLength(strength === undefined ? 0 : marksByStrength[strength]);
    }
    // Eine Zusicherung „E.1.21 trägt kein `strength`" ist hier bewusst **nicht** geschrieben: sie
    // lässt sich nicht einmal formulieren. `ANHANG_E_B_RECIPES` ist `as const satisfies`, der
    // Literaltyp dieses Rezepts kennt das Feld gar nicht, und `.spec.strength` scheitert am
    // Typcheck (TS2339) statt zur Laufzeit `undefined` zu liefern. Der Compiler hält den
    // Sonderfall damit strenger fest als ein Test es könnte; die Zeile darüber prüft die sichtbare
    // Folge — keine Kopfmarke.
  });

  it('setzt die Bindestriche der Kürzel als U+002D und keinen anderen Strich', () => {
    // Gemessen, nicht gewählt: die Hyphenklasse (U+002D / U+2010 / U+2011, in Arimo bildgleich,
    // 1,750 × 0,563 mm) trifft den Referenzbalken (1,933 × 0,579 mm) auf 0,18 mm, der
    // Halbgeviertstrich U+2013 verfehlt ihn mit Faktor 2,0. Zwischen den drei bildgleichen Formen
    // entscheidet nichts am Bild — dieser Test hält deshalb nur fest, dass kein Strich aus einer
    // anderen Klasse hineingerät, etwa durch eine Autokorrektur beim Bearbeiten der Kürzel.
    const withHyphen = cases.filter(([, recipe]) => /-/u.test(recipe.spec.labels?.center ?? ''));
    expect(withHyphen.map(([section]) => section)).toEqual([
      'E.1.17',
      'E.1.18',
      'E.1.19',
      'E.1.23',
      'E.1.24',
      'E.1.25',
      'E.1.26',
      'E.1.27',
      'E.1.28',
    ]);
    for (const [section, recipe] of cases) {
      expect(recipe.spec.labels?.center, section).not.toMatch(/[‐‑–—−]/u);
    }
  });

  it('nennt die zehn Referenzdateien mit Befund an der Füllfläche und keine weitere', () => {
    // Gegenstück zum E-a-Test über `ANHANG_E_A_FILL_DEFECTS`: die Befunde stehen in den
    // Manifestzeilen, und dieser Test hält fest, welche Dateien betroffen sind, damit die Notiz
    // dort nicht zur Behauptung ohne Beleg wird. Die beiden normgerechten Dateien werden
    // ausdrücklich als **nicht** betroffen geprüft — sonst bliebe ein versehentlich ergänzter
    // Befund an E.1.17 oder E.1.22 unbemerkt.
    expect(Object.keys(ANHANG_E_B_FILL_FINDINGS)).toEqual([
      'E.1.18',
      'E.1.19',
      'E.1.20',
      'E.1.21',
      'E.1.23',
      'E.1.24',
      'E.1.25',
      'E.1.26',
      'E.1.27',
      'E.1.28',
    ]);
    expect(Object.hasOwn(ANHANG_E_B_FILL_FINDINGS, 'E.1.17')).toBe(false);
    expect(Object.hasOwn(ANHANG_E_B_FILL_FINDINGS, 'E.1.22')).toBe(false);
    for (const section of Object.keys(ANHANG_E_B_FILL_FINDINGS)) {
      expect(Object.hasOwn(ANHANG_E_B_RECIPES, section)).toBe(true);
    }
  });

  it('hält die drei Präzisierungen der Befundtexte fest', () => {
    // Die drei Sätze sind das Ergebnis der Messphase und die Stellen, an denen ein Befundtext am
    // leichtesten zu einer Aussage wird, die die Messung nicht deckt. Der Test prüft sie am Text,
    // weil der Text die Reviewnote ist: E.1.18/E.1.20/E.1.21 folgen ausdrücklich **nicht** dem
    // E-a-Muster (2,5 mm Fläche gegen 0,5 mm Grundlinie) und bleiben in der Einordnung offen;
    // E.1.27/E.1.28 tragen zusätzlich den Grundlinienabstand 7,0 statt 6,0 mm; bei E.1.19/E.1.24
    // ist die Gleichzeitigkeit gemessen, nicht eine Absicht.
    // Geprüft wird der **Inhalt** der Präzisierung, nicht ihr Satzbau: die Verneinung, der
    // Bezug auf das E-a-Muster und die offene Einordnung. Eine Bindung an einen ganzen Satz wäre
    // hier die falsche Strenge — sie bräche beim Umformulieren, ohne dass die Aussage sich ändert.
    for (const section of ['E.1.18', 'E.1.20', 'E.1.21']) {
      const text = ANHANG_E_B_FILL_FINDINGS[section];
      expect(text, section).toMatch(/\*\*nicht\*\*/u);
      expect(text, section).toMatch(/E\.1\.6\/E\.1\.14/u);
      expect(text, section).toMatch(/offen/u);
      // Der Kern des Befunds: 2,5 mm Fläche gegen 0,5 mm Grundlinie, nicht der gleiche Betrag.
      expect(text, section).toMatch(/9,5/u);
      expect(text, section).toMatch(/17,5/u);
    }
    for (const section of ['E.1.27', 'E.1.28']) {
      expect(ANHANG_E_B_FILL_FINDINGS[section], section).toMatch(/7,0 mm/u);
      expect(ANHANG_E_B_FILL_FINDINGS[section], section).toMatch(/6,0 mm/u);
    }
    for (const section of ['E.1.19', 'E.1.24']) {
      expect(ANHANG_E_B_FILL_FINDINGS[section], section).toMatch(/Gleichzeitigkeit/u);
      expect(ANHANG_E_B_FILL_FINDINGS[section], section).toMatch(/nicht eine Absicht/u);
    }
    // Kein Befundtext behauptet eine Funktion der Verkürzung — das wäre ein Motivsatz in einem
    // Messbericht und von keiner Messung getragen.
    for (const [section, text] of Object.entries(ANHANG_E_B_FILL_FINDINGS)) {
      expect(text, section).not.toMatch(/funktional/iu);
    }
  });

  it('setzt keinen Text unterhalb des Körpers', () => {
    // Wie in E-a: die Fußzone bleibt für Anhang E unbelegt. Stünde hier ein `foot`-Lauf, hätte
    // jemand `designation` mit den Beschriftungszonen verwechselt.
    for (const [section, recipe] of cases) {
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(drawing.children.filter((c) => c.role === 'foot'), section).toHaveLength(0);
    }
  });

  it('führt die Zusatzkennzeichnung unten links nur bei E.1.22', () => {
    // „Typ A" ist im ganzen Block einmal belegt; ein Typ B existiert im Referenzbestand nicht.
    const withBottomLeft = cases.filter(([, recipe]) => recipe.spec.labels?.bottomLeft !== undefined);
    expect(withBottomLeft.map(([section]) => section)).toEqual(['E.1.22']);
    expect(ANHANG_E_B_RECIPES['E.1.22'].spec.labels.bottomLeft).toBe('A');
    expect(ANHANG_E_B_RECIPES['E.1.22'].title).toMatch(/Typ A$/);
  });
});

describe('Anhang F, Teilslice F-b einschließlich F.1.3', () => {
  it('deckt F.1.1 bis F.1.22 einschließlich aller drei Alternativen lückenlos ab', () => {
    const f1 = Object.keys(RECIPES).filter((key) => key.startsWith('F.1.'));
    const primary = f1.filter((key) => !key.includes('#'));
    expect(primary.sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)))).toEqual(
      Array.from({ length: 22 }, (_, index) => `F.1.${index + 1}`),
    );
    expect(f1.filter((key) => key.includes('#')).sort()).toEqual([
      'F.1.11#alternative',
      'F.1.12#alternative',
      'F.1.15#alternative',
    ]);
  });

  it('bindet alle 14 Darstellungen an die am Raster belegten Specs', () => {
    // Literale statt aus den Recipes abgeleiteter Erwartungen: der Test soll falsche Zuordnungen
    // wie den bisher oben links gesetzten Lauf "SEG" oder das fehlende Zelt von F.1.22 erkennen.
    expect(ANHANG_F_B_RECIPES).toEqual({
      'F.1.3': {
        title: 'Mobiles Betreuungsmodul 5000',
        referenceAsset: 'F.1.3_Mobiles Betreuungsmodul 5000.svg',
        spec: {
          kind: 'formation',
          bodyVariant: 'foot-band',
          organization: 'hilfsorganisation',
          bodyMarks: ['care', 'temporary-accommodation-resting'],
          labels: { topLeft: '5.000' },
        },
      },
      'F.1.12': {
        title: 'Nachbarschaftliche Soforthilfe',
        referenceAsset: 'F.1.12_Nachbarschaftliche Soforthilfe.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          strength: 'gruppe',
          bodyMarks: ['medical-service'],
          labels: { topLeft: 'ÜMANV-S' },
        },
      },
      'F.1.12#alternative': {
        title: 'Nachbarschaftliche Soforthilfe',
        referenceAsset: 'F.1.12_Nachbarschaftliche Soforthilfe_Alternative.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          strength: 'gruppe',
          bodyMarks: ['patient-transport', 'physician', 'intensive-care'],
        },
      },
      'F.1.13': {
        title: 'Behandlungsplatz-Bereitschaft',
        referenceAsset: 'F.1.13_Behandlungsplatz-Bereitschaft.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          bodyMarks: ['care', 'physician', 'ring-7mm-offset-down-1mm'],
          labels: { topLeft: '50' },
        },
      },
      'F.1.14': {
        title: 'Erstversorgungstrupp',
        referenceAsset: 'F.1.14_Erstversorgungstrupp.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          strength: 'trupp',
          bodyMarks: ['medical-service'],
          labels: { topLeft: 'EVT' },
        },
      },
      'F.1.15': {
        title: 'Arzttrupp',
        referenceAsset: 'F.1.15_Arzttrupp.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          strength: 'trupp',
          bodyMarks: ['physician'],
        },
      },
      'F.1.15#alternative': {
        title: 'Arzttrupp',
        referenceAsset: 'F.1.15_Arzttrupp_Alternative.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          strength: 'trupp',
          bodyMarks: ['physician', 'intensive-care'],
        },
      },
      'F.1.16': {
        title: 'Drohnentrupp',
        referenceAsset: 'F.1.16_Drohnentrupp.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          strength: 'trupp',
          bodyMarks: ['chevron-over-opposed-triangles'],
        },
      },
      'F.1.17': {
        title: 'Gruppe Verpflegung',
        referenceAsset: 'F.1.17_Gruppe Verpflegung.svg',
        spec: {
          kind: 'formation',
          bodyVariant: 'foot-band',
          organization: 'hilfsorganisation',
          strength: 'gruppe',
          bodyMarks: ['care', 'catering'],
          labels: { topLeft: '250' },
        },
      },
      'F.1.18': {
        title: 'Gruppe für soziale Betreuung',
        referenceAsset: 'F.1.18_Gruppe für soziale Betreuung.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          strength: 'gruppe',
          bodyMarks: ['care'],
          labels: { topLeft: '100', bottomCenter: 'SOZ' },
        },
      },
      'F.1.19': {
        title: 'Gruppe zur Herrichtung von Notunterkünften',
        referenceAsset: 'F.1.19_Gruppe zur Herrichtung von Notunterkünften.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          strength: 'gruppe',
          bodyMarks: ['care', 'temporary-accommodation-resting'],
          labels: { topLeft: '120' },
        },
      },
      'F.1.20': {
        title: 'Schnelleinsatzgruppe soziale Betreuung',
        referenceAsset: 'F.1.20_Schnelleinsatzgruppe soziale Betreuung.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          strength: 'gruppe',
          bodyMarks: ['care'],
          labels: { topLeft: '100', bottomCenter: 'SEG' },
        },
      },
      'F.1.21': {
        title: 'Betreuungsplatzbereitschaft 500',
        referenceAsset: 'F.1.21_Betreuungsplatzbereitschaft 500.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          bodyMarks: ['ring-6-5mm-offset-down-2mm-with-roof'],
          labels: { topLeft: '500' },
        },
      },
      'F.1.22': {
        title: 'Transportzug bis 50 Betroffene',
        referenceAsset: 'F.1.22_Transportzug bis 50 Betroffene.svg',
        spec: {
          kind: 'formation',
          organization: 'hilfsorganisation',
          strength: 'zug',
          bodyMarks: ['care', 'patient-transport'],
          labels: { topLeft: '50' },
        },
      },
    });
  });
});

describe('Anhang F, Teilslice F-c', () => {
  it('deckt F.2.1 bis F.2.9 mit fünf Alternativdarstellungen ab', () => {
    const keys = Object.keys(RECIPES).filter((key) => /^F\.2\.[1-9](?:#|$)/.test(key));
    expect(keys).toEqual([
      'F.2.1',
      'F.2.1#alternative',
      'F.2.2',
      'F.2.2#alternative',
      'F.2.3',
      'F.2.3#alternative',
      'F.2.4',
      'F.2.4#alternative',
      'F.2.5',
      'F.2.5#alternative',
      'F.2.6',
      'F.2.7',
      'F.2.8',
      'F.2.9',
    ]);
    expect(keys).toHaveLength(14);
  });

  it('bindet die 14 Darstellungen literal an die Referenzmatrix', () => {
    expect(Object.fromEntries(
      Object.entries<Recipe>(RECIPES).filter(([key]) => /^F\.2\.[1-9](?:#|$)/.test(key)),
    )).toEqual({
      'F.2.1': {
        title: 'KTW',
        referenceAsset: 'F.2.1_KTW.svg',
        spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['medical-service'], labels: { topLeft: 'KTW' } },
      },
      'F.2.1#alternative': {
        title: 'KTW',
        referenceAsset: 'F.2.1_KTW_Alternative.svg',
        spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['patient-transport'] },
      },
      'F.2.2': {
        title: 'NKTW',
        referenceAsset: 'F.2.2_NKTW.svg',
        spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['medical-service', 'top-center-rect-0-5x0-6mm'], labels: { topLeft: 'N-KTW_B' } },
      },
      'F.2.2#alternative': {
        title: 'NKTW',
        referenceAsset: 'F.2.2_NKTW_Alternative.svg',
        spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['patient-transport'], labels: { topLeft: '2' } },
      },
      'F.2.3': {
        title: 'RTW',
        referenceAsset: 'F.2.3_RTW.svg',
        spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['medical-service'], labels: { topLeft: 'RTW' } },
      },
      'F.2.3#alternative': {
        title: 'RTW',
        referenceAsset: 'F.2.3_RTW_Alternative.svg',
        spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['patient-transport', 'intensive-care'] },
      },
      'F.2.4': {
        title: 'NEF',
        referenceAsset: 'F.2.4_NEF.svg',
        spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['medical-service'], labels: { topLeft: 'NEF' } },
      },
      'F.2.4#alternative': {
        title: 'NEF',
        referenceAsset: 'F.2.4_NEF_Alternative.svg',
        spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['physician'] },
      },
      'F.2.5': {
        title: 'NAW',
        referenceAsset: 'F.2.5_NAW.svg',
        spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['medical-service'], labels: { topLeft: 'NAW' } },
      },
      'F.2.5#alternative': {
        title: 'NAW',
        referenceAsset: 'F.2.5_NAW_Alternative.svg',
        spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['patient-transport', 'intensive-care', 'physician'] },
      },
      'F.2.6': {
        title: 'Rettungstransporthubschrauber mit Winschmöglichkeit',
        referenceAsset: 'F.2.6_Rettungstransporthubschrauber mit Winschmöglichkeit.svg',
        spec: { kind: 'vehicle-air', bodyVariant: 'raised-hull', organization: 'hilfsorganisation', bodyMarks: ['medical-service', 'air-winch-chevron-diamond'] },
      },
      'F.2.7': {
        title: 'Intensivtransporthubschrauber',
        referenceAsset: 'F.2.7_Intensivtransporthubschrauber.svg',
        spec: { kind: 'vehicle-air', bodyVariant: 'raised-hull', organization: 'hilfsorganisation', bodyMarks: ['physician'], labels: { aboveLeft: 'ITH' } },
      },
      'F.2.8': {
        title: 'Gerätewagen Sanitätsdienst',
        referenceAsset: 'F.2.8_Gerätewagen Sanitätsdienst.svg',
        spec: { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', organization: 'hilfsorganisation', bodyMarks: ['medical-service'], labels: { topLeftLines: ['GW-San', '50'] } },
      },
      'F.2.9': {
        title: 'Unfallhilfsstelle',
        referenceAsset: 'F.2.9_Unfallhilfsstelle.svg',
        spec: { kind: 'trailer', organization: 'hilfsorganisation', bodyMarks: ['medical-service'] },
      },
    });
  });

  it('setzt in keinem F-c-Rezept eine unbelegte Fahrzeugkategorie', () => {
    const f2 = Object.entries<Recipe>(RECIPES)
      .filter(([key]) => /^F\.2\.[1-9](?:#|$)/.test(key))
      .map(([, recipe]) => recipe);
    expect(f2).toHaveLength(14);
    expect(f2.every((recipe) => recipe.spec.vehicleCategory === undefined)).toBe(true);
  });

  it.each([
    ['F.2.3#alternative', 5],
    ['F.2.5#alternative', 6],
  ] as const)(
    '%s zeichnet die gemeinsame Landteilung genau einmal bei insgesamt %i Linien',
    (key, expectedLineCount) => {
      const recipe = RECIPES[key];
      const lines = composeFromCatalog(recipe.spec, recipe.title).children.filter(
        (primitive): primitive is Extract<Primitive, { type: 'line' }> =>
          primitive.type === 'line' && primitive.role === 'pictogram',
      );
      expect(lines).toHaveLength(expectedLineCount);
      expect(lines.filter((line) =>
        line.x1 === 16 && line.y1 === 8 && line.x2 === 16 && line.y2 === 26,
      )).toHaveLength(1);
      expect(lines.filter((line) =>
        line.x1 === 1 && line.y1 === 16 && line.x2 === 31 && line.y2 === 16,
      )).toHaveLength(1);
    },
  );
});

describe('Anhang F, Teilslice F-d', () => {
  const recipes: Record<string, Recipe> = RECIPES;
  const expected = {
    'F.2.10': {
      title: 'Betreuungskombi',
      referenceAsset: 'F.2.10_Betreuungskombi.svg',
      spec: {
        kind: 'vehicle-land', organization: 'hilfsorganisation',
        vehicleCategory: 'kfz-kategorie-1', bodyMarks: ['care'], labels: {
          topLeft: 'BTKombi',
          topLeftMetrics: {
            capHeightMm: 2.191447, baselineFromBodyTopMm: 5.249923,
            anchorFromBodyLeftMm: 0.51423,
          },
        },
      },
    },
    'F.2.11': {
      title: 'Betreuungskombi mit Material zum Einrichten einer Anlaufstelle',
      referenceAsset: 'F.2.11_Betreuungskombi mit Material zum Einrichten einer Anlaufstelle.svg',
      spec: {
        kind: 'vehicle-land', organization: 'hilfsorganisation',
        vehicleCategory: 'kfz-kategorie-1',
        bodyMarks: ['care', 'ring-6mm-offset-down-3mm-four-way-stem'],
        labels: {
          topLeft: 'BTKombi',
          topLeftMetrics: {
            capHeightMm: 2.191447, baselineFromBodyTopMm: 5.249923,
            anchorFromBodyLeftMm: 0.51423,
          },
        },
      },
    },
    'F.2.12': {
      title: 'Gerätewagen Betreuung',
      referenceAsset: 'F.2.12_Gerätewagen Betreuung.svg',
      spec: {
        kind: 'vehicle-land', organization: 'hilfsorganisation',
        vehicleCategory: 'kfz-kategorie-2', bodyMarks: ['care'], labels: {
          topLeft: 'GwBT',
          topLeftMetrics: {
            capHeightMm: 2.919225, baselineFromBodyTopMm: 6.249691,
            anchorFromBodyLeftMm: 1.010503,
          },
        },
      },
    },
    'F.2.13': {
      title: 'Betreuungs-LKW mit mobiler Einsatzküche',
      referenceAsset: 'F.2.13_Betreuungs-LKW mit mobiler Einsatzküche.svg',
      spec: {
        kind: 'vehicle-land', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        vehicleCategory: 'kfz-kategorie-1', bodyMarks: ['care', 'meal-preparation'],
        labels: {
          topLeft: 'GwBT',
          topLeftMetrics: {
            capHeightMm: 2.919225, baselineFromBodyTopMm: 6.249691,
            anchorFromBodyLeftMm: 1.010503,
          },
        },
      },
    },
    'F.2.14': {
      title: 'Gerätewagen Logistik der Betreuung',
      referenceAsset: 'F.2.14_Gerätewagen Logistik der Betreuung.svg',
      spec: {
        kind: 'vehicle-land', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        vehicleCategory: 'kfz-kategorie-1', bodyMarks: ['care'], labels: {
          topLeft: 'GwLog',
          topLeftMetrics: {
            capHeightMm: 2.432746, baselineFromBodyTopMm: 5.249923,
            anchorFromBodyLeftMm: 1.009024,
          },
        },
      },
    },
    'F.2.15': {
      title: 'Geräteanhänger Betreuung',
      referenceAsset: 'F.2.15_Geräteanhänger Betreuung.svg',
      spec: {
        kind: 'trailer', organization: 'hilfsorganisation',
        vehicleCategory: 'anhaenger-ein-rad', bodyMarks: ['care'],
      },
    },
    'F.2.16': {
      title: 'Fahrzeug der Betreuung, Transport 40 Betroffene',
      referenceAsset: 'F.2.16_Fahrzeug der Betreuung_Transport 40 Betroffene.svg',
      spec: {
        kind: 'vehicle-land', organization: 'hilfsorganisation',
        vehicleCategory: 'kfz-kategorie-1',
        bodyMarks: ['care', 'ring-5mm-offset-down-3mm-eight-spokes'],
        labels: {
          topLeft: '40',
          topLeftMetrics: {
            capHeightMm: 2.749893, baselineFromBodyTopMm: 6.749576,
            anchorFromBodyLeftMm: 1.497298,
          },
        },
      },
    },
    'F.2.17': {
      title: 'Betreuungs-LKW Trinkwasserversorgung',
      referenceAsset: 'F.2.17_Betreuungs-LKW_Trinkwasserversorgung.svg',
      spec: {
        kind: 'vehicle-land', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
        vehicleCategory: 'kfz-kategorie-1', bodyMarks: ['care', 'drinking-water'],
        labels: {
          topLeft: 'BtlLKW',
          topLeftMetrics: {
            capHeightMm: 2.432746, baselineFromBodyTopMm: 5.749807,
            anchorFromBodyLeftMm: 0.766269,
          },
        },
      },
    },
  } as const;

  it('deckt F.2.10 bis F.2.17 lückenlos ab', () => {
    const keys = Object.keys(RECIPES).filter((key) => /^F\.2\.(1[0-7])$/.test(key));
    expect(keys).toEqual(Object.keys(expected));
  });

  it('bindet alle acht Darstellungen literal an Referenz, Kategorie, Marken und Label', () => {
    expect(Object.fromEntries(
      Object.entries<Recipe>(RECIPES).filter(([key]) => /^F\.2\.(1[0-7])$/.test(key)),
    )).toEqual(expected);
    for (const key of Object.keys(expected)) {
      const recipe = recipes[key];
      expect(recipe?.spec.strength, key).toBeUndefined();
      expect(recipe?.spec.organization, key).toBe('hilfsorganisation');
    }
  });

  it('hält das Fahrzeug-Fußband oberhalb der nur tangierenden Fahrwerkszone', () => {
    for (const key of ['F.2.13', 'F.2.14', 'F.2.17'] as const) {
      const recipe = recipes[key];
      expect(recipe, key).toBeDefined();
      if (recipe === undefined) continue;
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      const band = drawing.children.find((primitive) =>
        primitive.type === 'rect' && primitive.role === 'pictogram' && primitive.y === 23,
      );
      expect(band, key).toMatchObject({ x: 1, y: 23, width: 30, height: 3 });
      const wheels = drawing.children.filter(
        (primitive): primitive is Extract<Primitive, { type: 'circle' }> =>
          primitive.type === 'circle' && primitive.role === 'chassis',
      );
      expect(wheels, key).toHaveLength(2);
      expect(wheels.every((wheel) => wheel.cy - wheel.r === 26), key).toBe(true);
    }
  });

  it('zeichnet kombinierte Care- und Zusatzmarken ohne doppelte gemeinsam gedachte Primitive', () => {
    for (const key of ['F.2.11', 'F.2.13', 'F.2.16', 'F.2.17'] as const) {
      const recipe = recipes[key];
      expect(recipe, key).toBeDefined();
      if (recipe === undefined) continue;
      const pictograms = composeFromCatalog(recipe.spec, recipe.title).children.filter(
        (primitive) => primitive.role === 'pictogram',
      );
      const serialized = pictograms.map((primitive) => JSON.stringify(primitive));
      expect(new Set(serialized).size, key).toBe(serialized.length);
      expect(pictograms.filter((primitive) =>
        primitive.type === 'polyline' && JSON.stringify(primitive.points) ===
          JSON.stringify(key === 'F.2.13' || key === 'F.2.17'
            ? [[1, 23], [16, 8], [31, 23]]
            : [[1, 26], [16, 8], [31, 26]]),
      ), key).toHaveLength(1);
    }
  });
});

describe('Anhang F, Teilslice F-e', () => {
  const uhsMetrics = {
    capHeightMm: 2.919225,
    baselineFromBodyTopMm: 1.000254,
    anchorFromBodyLeftMm: -2.984684,
  };
  const fiftyMetrics = {
    capHeightMm: 2.749893,
    baselineFromBodyTopMm: -0.999746,
    anchorFromBodyLeftMm: -2.974002,
  };
  const expected = {
    'F.3.1': {
      title: 'Patientenablage', referenceAsset: 'F.3.1_Patientenablage.svg',
      spec: { kind: 'circle-12', organization: 'hilfsorganisation', bodyMarks: ['circle-patient-staging-arrows'] },
    },
    'F.3.2': {
      title: 'Patientenablage, arztbesetzt',
      referenceAsset: 'F.3.2_Patientenablage_arztbesetzt.svg',
      spec: { kind: 'circle-12', organization: 'hilfsorganisation', bodyMarks: ['circle-patient-staging-arrows', 'physician'] },
    },
    'F.3.3': {
      title: 'Unfallhilfsstelle / Sanitätsstation',
      referenceAsset: 'F.3.3_Unfallhilfsstelle_Sanitätsstation.svg',
      spec: { kind: 'circle-12', organization: 'hilfsorganisation', bodyMarks: ['medical-service'], labels: { topLeft: 'UHS', topLeftMetrics: uhsMetrics } },
    },
    'F.3.4': {
      title: 'Unfallhilfsstelle / Sanitätsstation, arztbesetzt',
      referenceAsset: 'F.3.4_Unfallhilfsstelle_Sanitätsstation_arztbesetzt.svg',
      spec: { kind: 'circle-12', organization: 'hilfsorganisation', bodyMarks: ['medical-service', 'physician'], labels: { topLeft: 'UHS', topLeftMetrics: uhsMetrics } },
    },
    'F.3.5': {
      title: 'Behandlungsplatz 50, ortsgebunden',
      referenceAsset: 'F.3.5_Behandlungsplatz 50_ortsgebunden.svg',
      spec: { kind: 'circle-12', bodyVariant: 'raised-gable', organization: 'hilfsorganisation', bodyMarks: ['medical-service', 'physician'], labels: { topLeft: '50', topLeftMetrics: fiftyMetrics } },
    },
    'F.3.6': {
      title: 'Sammelstelle allgemein', referenceAsset: 'F.3.6_Sammelstelle allgemein.svg',
      spec: { kind: 'circle-12', organization: 'hilfsorganisation', bodyMarks: ['circle-collection-arrow'] },
    },
    'F.3.7': {
      title: 'Sammelraum Einsatzfahrzeuge',
      referenceAsset: 'F.3.7_Sammelraum Einsatzfahrzeuge.svg',
      spec: { kind: 'circle-12', organization: 'hilfsorganisation', bodyMarks: ['circle-staging-frame-arrow'] },
    },
    'F.3.8': {
      title: 'Bereitstellungsraum', referenceAsset: 'F.3.8_Bereitstellungsraum.svg',
      spec: { kind: 'circle-12', organization: 'hilfsorganisation', bodyMarks: ['circle-staging-frame'] },
    },
    'F.3.9': {
      title: 'Pufferzone / Verfügungsraum Rettungsdienst',
      referenceAsset: 'F.3.9_Pufferzone_Verfügungsraum Rettungsdienst.svg',
      spec: { kind: 'circle-12', organization: 'hilfsorganisation', bodyMarks: ['circle-staging-frame-quadrants-arrows'] },
    },
    'F.3.10': {
      title: 'Ladezone', referenceAsset: 'F.3.10_Ladezone.svg',
      spec: { kind: 'circle-12', organization: 'hilfsorganisation', bodyMarks: ['circle-diamond-arrow'] },
    },
    'F.3.11': {
      title: 'Rettungsmittelhalteplatz',
      referenceAsset: 'F.3.11_Rettungsmittelhalteplatz.svg',
      spec: { kind: 'circle-12', organization: 'hilfsorganisation', bodyMarks: ['circle-cross-ring'] },
    },
  } as const;

  it('deckt den historischen F-e-Block F.3.1 bis F.3.11 lückenlos ab', () => {
    const keys = Object.keys(RECIPES).filter((key) => /^F\.3\.(?:[1-9]|10|11)$/.test(key));
    expect(keys).toEqual(Object.keys(expected));
  });

  it('bindet alle elf Darstellungen literal an Quelle, Körper, Marken und Label', () => {
    expect(Object.fromEntries(
      Object.entries<Recipe>(RECIPES).filter(([key]) => /^F\.3\.(?:[1-9]|10|11)$/.test(key)),
    )).toEqual(expected);
    for (const key of Object.keys(expected) as Array<keyof typeof expected>) {
      const recipe = RECIPES[key];
      expect('strength' in recipe.spec, key).toBe(false);
      expect(recipe.spec.organization, key).toBe('hilfsorganisation');
    }
  });

  it('meldet für die teilweise außerhalb liegenden Kreislabels Körper- und Surface-Kontrast an', () => {
    const circleRequirements = labelContrastRequirements(
      Object.values(expected) as unknown as Iterable<Recipe>,
    );
    expect(circleRequirements).toEqual(expect.arrayContaining([
      {
        foreground: 'schwarz', background: 'weiss',
        context: 'Beschriftung im Körper auf Organisation hilfsorganisation', minimum: 4.5,
      },
      {
        foreground: 'schwarz', background: 'surface',
        context: 'Kreislabel teilweise außerhalb der Körperfläche', minimum: 4.5,
      },
    ]));
  });

  it.each(['F.3.2', 'F.3.4', 'F.3.5'] as const)(
    '%s zeichnet gemeinsam genutzte Kreislinien trotz kombinierter Marken genau einmal',
    (key) => {
      const recipe = RECIPES[key];
      expect(recipe).toBeDefined();
      if (recipe === undefined) return;
      const lines = composeFromCatalog(recipe.spec, recipe.title).children.filter(
        (primitive) => primitive.type === 'line' && primitive.role === 'pictogram',
      );
      const body = composeFromCatalog(recipe.spec, recipe.title).children.find(
        (primitive) => primitive.role === 'body',
      );
      if (body?.type !== 'circle') throw new Error(`${key}: Kreiskörper fehlt.`);
      expect(lines.filter((line) => line.type === 'line' &&
        line.x1 === body.cx && line.x2 === body.cx &&
        line.y1 === body.cy - body.r && line.y2 === body.cy + body.r)).toHaveLength(1);
      expect(lines.filter((line) => line.type === 'line' &&
        line.y1 === body.cy && line.y2 === body.cy &&
        line.x1 === body.cx - body.r && line.x2 === body.cx + body.r)).toHaveLength(1);
    },
  );
});

describe('Anhang F, Teilslice F-f', () => {
  const fiveHundredMetrics = {
    capHeightMm: 2.749893,
    baselineFromBodyTopMm: -0.999746,
    anchorFromBodyLeftMm: -2.974002,
  };
  const expected = {
    'F.3.12': {
      title: 'Anlaufstelle für Betroffene',
      referenceAsset: 'F.3.12_Anlaufstelle für Betroffene.svg',
      spec: {
        kind: 'circle-12', organization: 'hilfsorganisation',
        bodyMarks: ['circle-double-arrow-lower-v'],
      },
    },
    'F.3.13': {
      title: 'Betreuungsstelle', referenceAsset: 'F.3.13_Betreuungsstelle.svg',
      spec: { kind: 'circle-12', organization: 'hilfsorganisation', bodyMarks: ['care'] },
    },
    'F.3.14': {
      title: 'Betreuungsplatz, ortsgebunden',
      referenceAsset: 'F.3.14_Betreuungsplatz_ortsgebunden.svg',
      spec: {
        kind: 'circle-12', bodyVariant: 'raised-gable', organization: 'hilfsorganisation',
        bodyMarks: ['care'], labels: { topLeft: '500', topLeftMetrics: fiveHundredMetrics },
      },
    },
    'F.3.15': {
      title: 'Unterkunft', referenceAsset: 'F.3.15_Unterkunft.svg',
      spec: {
        kind: 'reduced-house', organization: 'hilfsorganisation',
        bodyMarks: ['temporary-accommodation-resting'],
      },
    },
    'F.3.16': {
      title: 'Krankenhaus', referenceAsset: 'F.3.16_Krankenhaus.svg',
      spec: {
        kind: 'reduced-house', organization: 'hilfsorganisation', bodyMarks: ['hospital'],
      },
    },
    'F.3.17': {
      title: 'Notfallinformationspunkt / KatS-Leuchtturm',
      referenceAsset: 'F.3.17_Notfallinformationspunkt_KatS-Leuchtturm.svg',
      spec: {
        kind: 'circle-12', organization: 'hilfsorganisation',
        bodyMarks: ['circle-information-stem'],
      },
    },
    'F.3.18': {
      title: 'Ladezone Personentransport',
      referenceAsset: 'F.3.18_Ladezone Personentransport.svg',
      spec: {
        kind: 'circle-12', organization: 'hilfsorganisation',
        bodyMarks: ['circle-transport-diamond-arrows'],
      },
    },
    'F.3.19': {
      title: 'Ladezone Personentransport, besondere Bedarfe',
      referenceAsset: 'F.3.19_Ladezone Personentransport_besondere Bedarfe.svg',
      spec: {
        kind: 'circle-12', organization: 'hilfsorganisation',
        bodyMarks: ['circle-transport-diamond-wheels-arrows'],
      },
    },
  } as const;

  it('deckt F.3.12 bis F.3.19 lückenlos ab und erreicht integriert 242 Rezepte', () => {
    const entries = Object.entries<Recipe>(RECIPES)
      .filter(([key]) => /^F\.3\.(1[2-9])$/.test(key));
    expect(Object.fromEntries(entries)).toEqual(expected);
    expect(entries.map(([key]) => key).filter((key) => key.includes('#'))).toEqual([]);
    expect(Object.keys(RECIPES)).toHaveLength(242);
  });

  it('bindet alle acht Darstellungen an HiOrg, ohne Stärke oder alternative Rezeptsemantik', () => {
    for (const [key, recipe] of Object.entries(expected)) {
      expect(recipe.spec.organization, key).toBe('hilfsorganisation');
      expect('strength' in recipe.spec, key).toBe(false);
      expect(key.includes('#'), key).toBe(false);
    }
  });

  it('belegt das vollständige F-Inventar als exakt 58 IDs, acht Altkeys und 66 Recipekeys', () => {
    const keys = Object.keys(RECIPES).filter((key) => key.startsWith('F.'));
    const ids = keys.map((key) => key.split('#')[0]!);
    const expectedIds = [
      ...Array.from({ length: 22 }, (_, index) => `F.1.${index + 1}`),
      ...Array.from({ length: 17 }, (_, index) => `F.2.${index + 1}`),
      ...Array.from({ length: 19 }, (_, index) => `F.3.${index + 1}`),
    ];
    const expectedAlternatives = [
      'F.1.11#alternative', 'F.1.12#alternative', 'F.1.15#alternative',
      'F.2.1#alternative', 'F.2.2#alternative', 'F.2.3#alternative',
      'F.2.4#alternative', 'F.2.5#alternative',
    ];
    expect([...new Set(ids)].sort()).toEqual([...expectedIds].sort());
    expect(new Set(ids).size).toBe(58);
    expect(keys.filter((key) => key.includes('#')).sort()).toEqual(expectedAlternatives.sort());
    expect(new Set(keys).size).toBe(66);
    expect(keys).toHaveLength(66);
    expect(keys.some((key) => /^F\.3\.(?:2[0-9]|[3-9][0-9])/.test(key))).toBe(false);
  });

  it('zeichnet die gemeinsame Haus-Traufe je Rezept exakt einmal', () => {
    for (const key of ['F.3.15', 'F.3.16'] as const) {
      const recipe = expected[key];
      const drawing = composeFromCatalog(recipe.spec as Recipe['spec'], recipe.title);
      expect(drawing.children.filter((primitive) =>
        primitive.type === 'line' && primitive.x1 === 2 && primitive.y1 === 10 &&
        primitive.x2 === 30 && primitive.y2 === 10,
      ), key).toHaveLength(1);
    }
  });

  it('meldet für das teilweise außerhalb liegende 500-Label Körper- und Surface-Kontrast an', () => {
    expect(labelContrastRequirements([
      expected['F.3.14'] as unknown as Recipe,
    ])).toEqual(expect.arrayContaining([
      {
        foreground: 'schwarz', background: 'weiss',
        context: 'Beschriftung im Körper auf Organisation hilfsorganisation', minimum: 4.5,
      },
      {
        foreground: 'schwarz', background: 'surface',
        context: 'Kreislabel teilweise außerhalb der Körperfläche', minimum: 4.5,
      },
    ]));
  });
});

describe('Anhang E, Teilslice E-c (E.1.29 bis E.1.37)', () => {
  const cases = Object.entries<Recipe>(ANHANG_E_C_RECIPES);

  it('deckt genau die neun Abschnitte E.1.29 bis E.1.37 ab', () => {
    expect(cases.map(([section]) => section)).toEqual(
      Array.from({ length: 9 }, (_, index) => `E.1.${index + 29}`),
    );
  });

  it('führt E.1 mit E-a und E-b zusammen zu genau 37 lückenlosen Abschnitten', () => {
    // Diese Zusicherung trägt den Manifest-`scope`: seit E-c steht dort `E.1` statt der 37
    // Einzelabschnitte, und `uncoveredScope` prüft an einem Präfix nur, ob **eine** Zeile
    // existiert — nicht die Vollständigkeit. Ohne diesen Test wäre der Zusammenzug genau die
    // unwiderlegbare Behauptung, die die abschnittsweise Führung bis hierher verhindert hat.
    const sections = [
      ...Object.keys(ANHANG_E_A_RECIPES),
      ...Object.keys(ANHANG_E_B_RECIPES),
      ...Object.keys(ANHANG_E_C_RECIPES),
    ];
    expect(sections).toEqual(Array.from({ length: 37 }, (_, index) => `E.1.${index + 1}`));
    // Und die Gegenrichtung: kein Rezept des Katalogs beansprucht einen E.1-Abschnitt außerhalb
    // dieser drei Blöcke. Sie ist seit dem Teilslice E.2 auf `E.1.` eingeschränkt und nicht mehr
    // auf `E.` — die Blöcke E-d bis E-f beanspruchen E.2-Abschnitte, und der Test dafür steht
    // unten in ihrem eigenen `describe`.
    const alleE1 = Object.keys(RECIPES).filter((section) => section.startsWith('E.1.'));
    expect(alleE1).toEqual(sections);
  });

  it.each(cases)('%s trägt THW-Blau, das Trägerkürzel THW und seine eigene Referenzdatei', (_section, recipe) => {
    const drawing = composeFromCatalog(recipe.spec, recipe.title);
    const body = drawing.children.find((c) => c.role === 'body');
    expect(body?.style?.fill).toBe('blau');
    expect(recipe.spec.labels?.bottomRight).toBe('THW');
    expect(recipe.referenceAsset.startsWith(`${_section}_`)).toBe(true);
  });

  it('stellt acht Zeichen auf formation und E.1.37 als einziges auf den Gebäudekörper', () => {
    // Die Körperform ist an der Referenz belegt: 36 der 37 E.1-Dateien tragen dasselbe
    // Formationsrechteck, und die Gebäudehülle kommt im gesamten Referenzbestand nur in
    // `1.7_Gebäude.svg` und E.1.37 vor.
    const gebaeude = cases.filter(([, recipe]) => recipe.spec.kind === 'building');
    expect(gebaeude.map(([section]) => section)).toEqual(['E.1.37']);
    for (const [section, recipe] of cases) {
      if (section === 'E.1.37') continue;
      expect(recipe.spec.kind, section).toBe('formation');
    }
  });

  it('setzt die Beschriftung des Gebäudekörpers auf dieselben Grundlinien wie die Formation', () => {
    // Der Kernschritt dieses Teilslice, an der Katalogausgabe statt am Kompositionsmotor geprüft:
    // die mittige Grundlinie rechnet gegen die Körperunterkante. Der Gebäudekörper reicht von 3
    // bis 26 mm — gegen die Oberkante gerechnet stünde der Lauf bei 15,0 mm, gegen die Unterkante
    // bei 18,0 mm. Die Referenz setzt ihn auf 18,9999 mm und ihr `THW` auf 23,9995 mm; der
    // Katalog folgt mit 18,0 mm der Mehrheit der 37 Dateien, der verbleibende Millimeter steht
    // als Befund in ANHANG_E_C_FILL_FINDINGS.
    const drawing = composeFromCatalog(
      ANHANG_E_C_RECIPES['E.1.37'].spec,
      ANHANG_E_C_RECIPES['E.1.37'].title,
    );
    const body = drawing.children.find((c) => c.role === 'body');
    expect(body).toBeDefined();
    if (body === undefined) return;
    expect(boundsOfMm(body)).toMatchObject({ minY: 3, maxY: 26 });

    const [center, bottomRight] = drawing.children.filter(
      (child): child is Primitive & { type: 'text' } =>
        child.type === 'text' && child.role === 'label',
    );
    expect(center?.content).toBe('OV');
    expect(center?.y).toBeCloseTo(18, 6);
    expect(center?.x).toBeCloseTo(16, 6);
    expect(bottomRight?.content).toBe('THW');
    expect(bottomRight?.y).toBeCloseTo(24, 6);
    // Die Box liegt im Körper: ab y 10 mm führt das Gebäudepolygon die volle Breite 1…31 mm, die
    // Box läuft von 2 bis 30 mm. Mit dem alten Anker lag ihre Oberkante bei 8,9124 mm und ihre
    // beiden oberen Ecken außerhalb der Hülle — geprüft wird das nach wie vor von keinem Gate.
    expect(center?.boxMm.yMm).toBeGreaterThan(10);
  });

  it('trägt drei Kopfzonenbreiten und bei E.1.31 und E.1.37 keine', () => {
    // Wie in E-b aus `spec.strength` abgeleitet und nicht aus einer Abschnittsliste. Der
    // Sonderfall ist hier ein doppelter: E.1.37 trägt keine Kopfzone, weil seine Strichebene
    // außer dem Rahmen nichts führt, und E.1.31 keine, weil die Referenz dort zwei senkrechte
    // Balken statt eines Stärkegrads setzt — eine deklarierte Abweichung mit eigener Note im
    // Manifest. Beide fehlenden `strength`-Felder sind Absicht.
    const marksByStrength: Record<string, number> = { zug: 3, gruppe: 2, trupp: 1 };
    for (const [section, recipe] of cases) {
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      const head = drawing.children.filter((c) => c.role === 'head');
      const strength = recipe.spec.strength;
      expect(head, section).toHaveLength(strength === undefined ? 0 : marksByStrength[strength]);
    }
    const ohneKopfzone = cases
      .filter(([, recipe]) => recipe.spec.strength === undefined)
      .map(([section]) => section);
    expect(ohneKopfzone).toEqual(['E.1.31', 'E.1.37']);
  });

  it('setzt keinen Text unterhalb des Körpers und keine Zusatzkennzeichnung unten links', () => {
    // Wie in E-a und E-b bleibt die Fußzone unbelegt. Neu ist die zweite Hälfte: „Typ A" kommt
    // in diesem Block nicht vor, die linke untere Zone bleibt in allen neun Zeichen leer.
    for (const [section, recipe] of cases) {
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(drawing.children.filter((c) => c.role === 'foot'), section).toHaveLength(0);
      expect(recipe.spec.labels?.bottomLeft, section).toBeUndefined();
    }
  });

  it('nennt die drei Referenzdateien mit Befund und die sechs normgerechten nicht', () => {
    // Gegenstück zu den Tests über `ANHANG_E_A_FILL_DEFECTS` und `ANHANG_E_B_FILL_FINDINGS`: die
    // Befunde stehen in den Manifestzeilen, und dieser Test hält fest, welche Dateien betroffen
    // sind. Die sechs normgerechten werden ausdrücklich als **nicht** betroffen geprüft — sonst
    // bliebe ein versehentlich ergänzter Befund an ihnen unbemerkt.
    expect(Object.keys(ANHANG_E_C_FILL_FINDINGS)).toEqual(['E.1.29', 'E.1.31', 'E.1.37']);
    for (const section of ['E.1.30', 'E.1.32', 'E.1.33', 'E.1.34', 'E.1.35', 'E.1.36']) {
      expect(Object.hasOwn(ANHANG_E_C_FILL_FINDINGS, section), section).toBe(false);
    }
    for (const section of Object.keys(ANHANG_E_C_FILL_FINDINGS)) {
      expect(Object.hasOwn(ANHANG_E_C_RECIPES, section)).toBe(true);
    }
  });

  it('hält die drei Präzisierungen der Befundtexte fest', () => {
    // Dieselbe Rolle wie der gleichnamige Test in E-b: geprüft wird der **Inhalt** der
    // Präzisierung, nicht ihr Satzbau. E.1.29 trägt den Grundlinienabstand 7,0 mm, den die
    // verschobene Fläche nicht erklärt; E.1.31 hat einen normgerechten Abstand und trennt den
    // Flächenbefund ausdrücklich von der Kopfzone; E.1.37 ist bei n = 1 nicht als Defekt
    // entscheidbar und sagt das.
    expect(ANHANG_E_C_FILL_FINDINGS['E.1.29']).toMatch(/7,0 mm/u);
    expect(ANHANG_E_C_FILL_FINDINGS['E.1.29']).toMatch(/30 der 37/u);
    expect(ANHANG_E_C_FILL_FINDINGS['E.1.29']).toMatch(/erklärt ihn nicht/u);
    expect(ANHANG_E_C_FILL_FINDINGS['E.1.31']).toMatch(/normgerecht 6,0 mm/u);
    expect(ANHANG_E_C_FILL_FINDINGS['E.1.31']).toMatch(/Kopfzone/u);
    expect(ANHANG_E_C_FILL_FINDINGS['E.1.37']).toMatch(/19,0/u);
    expect(ANHANG_E_C_FILL_FINDINGS['E.1.37']).toMatch(/5,0/u);
    expect(ANHANG_E_C_FILL_FINDINGS['E.1.37']).toMatch(/n = 1/u);
    // Kein Befundtext behauptet eine Absicht der Quelle — wie in E-b wäre das ein Motivsatz in
    // einem Messbericht und von keiner Messung getragen.
    for (const [section, text] of Object.entries(ANHANG_E_C_FILL_FINDINGS)) {
      expect(text, section).not.toMatch(/funktional/iu);
    }
  });
});

describe('Anhang E, Teilslice E-d (E.2.1 bis E.2.21)', () => {
  const cases = Object.entries<Recipe>(ANHANG_E_D_RECIPES);

  it('deckt die 21 Abschnitte E.2.1 bis E.2.21 lückenlos ab', () => {
    // **Diese Zeile hielt bis zum 18. August 2026 die Lücke fest** („…und lässt E.2.6 aus", dazu
    // `ANHANG_E_D_UNGEBAUT` mit genau einem Schlüssel). Seit E.2.6 gebaut ist, hält sie die
    // Vollständigkeit — die Zusage hat die Richtung gewechselt, nicht die Stelle.
    expect(cases.map(([section]) => section)).toEqual(
      Array.from({ length: 21 }, (_, index) => `E.2.${index + 1}`),
    );
    expect(Object.hasOwn(RECIPES, 'E.2.6')).toBe(true);
  });

  it('baut E.2.6 mit orangem Körper, dem Fahrwerk von E.2.4 und der Beschriftung von E.2.5', () => {
    // Das einzige Zeichen des Anhangs, das nicht `thw` trägt — deshalb steht es hier einzeln und
    // nicht als gelockerte Bedingung in der Schleife unten. Eine Schleife, die „blau oder orange"
    // zuließe, schwächte die Zusage für die übrigen 20.
    const recipe: Recipe = ANHANG_E_D_RECIPES['E.2.6'];
    const drawing = composeFromCatalog(recipe.spec, recipe.title);
    expect(drawing.children.find((c) => c.role === 'body')?.style?.fill).toBe('orange');
    expect(recipe.spec.organization).toBe('sonstige-gefahrenabwehr');
    // Fahrwerk **nicht** wie E.2.5: der Baubeschluss des E.2-Slice hat „Fahrwerk und
    // Beschriftung sind zeichengleich mit E.2.5" übergeben, und die erste Hälfte ist an der Datei
    // widerlegt — E.2.5 führt vier Teilpfade in der Strichebene (zwei Räder), E.2.6 sieben (drei
    // Räder mit zwei Verbindungsbalken). Ohne diese Zeile stünde die Berichtigung nur im
    // Fließtext.
    expect(recipe.spec.vehicleCategory).toBe('kfz-kategorie-3');
    expect(ANHANG_E_D_RECIPES['E.2.5'].spec.vehicleCategory).toBe('kfz-kategorie-1');
    // Beschriftung dagegen zeichengleich mit E.2.5, einschließlich des fehlenden
    // `centerCapHeightMm`: beide Läufe stehen im Normgrad (`t` je 4,4316 mm gemessen).
    expect(recipe.spec.labels).toEqual(ANHANG_E_D_RECIPES['E.2.5'].spec.labels);
    expect(recipe.spec.labels?.centerCapHeightMm).toBeUndefined();
  });

  it.each(cases)('%s steht auf einem Fahrzeugkörper und trägt seine eigene Referenzdatei', (section, recipe) => {
    const drawing = composeFromCatalog(recipe.spec, recipe.title);
    const body = drawing.children.find((c) => c.role === 'body');
    // **Ausnahme E.2.6, und nur diese eine:** es trägt als einziges Zeichen des Anhangs den
    // orangen Körper der `sonstige-gefahrenabwehr`. Sein Trägerkürzel bleibt trotzdem `THW` —
    // die Quelle trennt hier Zuordnung und Betreiber.
    expect(body?.style?.fill).toBe(section === 'E.2.6' ? 'orange' : 'blau');
    expect(recipe.spec.labels?.bottomRight).toBe('THW');
    expect(recipe.referenceAsset.startsWith(`${section}_`)).toBe(true);
  });

  it('stellt 20 Zeichen auf vehicle-land und E.2.15 als einziges auf den Wechselladerrumpf', () => {
    const wechsellader = cases.filter(([, recipe]) => recipe.spec.kind === 'swap-loader-vehicle');
    expect(wechsellader.map(([section]) => section)).toEqual(['E.2.15']);
    for (const [section, recipe] of cases) {
      if (section === 'E.2.15') continue;
      expect(recipe.spec.kind, section).toBe('vehicle-land');
    }
  });

  it('trägt an jedem Zeichen eine Fahrwerkszone und an keinem eine Kopfzone', () => {
    // Der Bruch mit E.1 in einer Zeile: dort trug jedes Zeichen bis auf drei eine Kopfzone und
    // keines ein Fahrwerk, hier ist es genau umgekehrt. Beides aus der Zeichnung gemessen und
    // nicht aus dem Dateinamen — keine der 31 E.2-Referenzdateien führt eine Kopfmarke.
    const markenJeKategorie: Record<string, number> = {
      'kfz-kategorie-1': 2,
      'kfz-kategorie-2': 3,
      'kfz-kategorie-3': 5,
      kettenfahrzeug: 1,
    };
    for (const [section, recipe] of cases) {
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(drawing.children.filter((c) => c.role === 'head'), section).toHaveLength(0);
      expect(recipe.spec.strength, section).toBeUndefined();
      const kategorie = recipe.spec.vehicleCategory;
      expect(kategorie, section).toBeDefined();
      expect(drawing.children.filter((c) => c.role === 'chassis'), section).toHaveLength(
        markenJeKategorie[kategorie ?? ''] ?? -1,
      );
    }
  });

  it('hängt die Fahrwerkszone von E.2.15 an das Grundzeichen und nicht an den Körper', () => {
    // Der Fall, an dem die beiden Lesarten auseinandergehen: der Wechselladerrumpf endet bei
    // 24,5 mm, sein L-Rahmen bei 26,0 mm. Gemessen ist die Radmitte 28,2504 mm — dieselbe wie in
    // allen 25 Fahrwerkszeichen. An der Körperunterkante gerechnet läge sie auf 26,75 mm.
    const drawing = composeFromCatalog(
      ANHANG_E_D_RECIPES['E.2.15'].spec,
      ANHANG_E_D_RECIPES['E.2.15'].title,
    );
    const body = drawing.children.find((c) => c.role === 'body');
    expect(body).toBeDefined();
    if (body === undefined) return;
    expect(boundsOfMm(body).maxY).toBeCloseTo(24.5, 6);
    const extras = drawing.children.filter((c) => c.role === 'bodyExtra');
    expect(extras).toHaveLength(1);
    expect(boundsOfMm(extras[0]!).maxY).toBeCloseTo(26, 6);
    for (const mark of drawing.children.filter((c) => c.role === 'chassis')) {
      const bounds = boundsOfMm(mark);
      expect((bounds.minY + bounds.maxY) / 2).toBeCloseTo(28.25, 6);
    }
  });

  it('setzt neun der 21 mittigen Läufe kleiner und die übrigen zwölf im Normgrad', () => {
    // Die gemessenen Kappenhöhen stehen je Zeichen und nicht als Stufenleiter: eine Auslöseregel
    // ist widerlegt (von den neun bräuchten nur drei die Verkleinerung, um in die 28-mm-Box zu
    // passen). Dieser Test hält deshalb die Zahlen fest und keine Regel.
    const gemessen = Object.fromEntries(
      cases
        .filter(([, recipe]) => recipe.spec.labels?.centerCapHeightMm !== undefined)
        .map(([section, recipe]) => [section, recipe.spec.labels?.centerCapHeightMm]),
    );
    expect(gemessen).toEqual({
      'E.2.7': 4.3829,
      'E.2.8': 4.3826,
      'E.2.12': 3.40995,
      'E.2.13': 3.40995,
      'E.2.16': 4.38273,
      'E.2.17': 4.38273,
      'E.2.19': 4.3829,
      'E.2.20': 3.65125,
      'E.2.21': 4.3826,
    });
    // Und die Gegenrichtung: die zwölf übrigen tragen das Feld gar nicht und laufen damit auf
    // dem Normwert aus compose.ts. Ein `centerCapHeightMm: 4.87` an ihnen wäre eine Messung, die
    // niemand gemacht hat — der Normwert steht dort und nicht hier. Zwölf und nicht mehr elf seit
    // E.2.6: sein mittiger Lauf `Stapler` steht im Normgrad, zeichengleich mit E.2.5 (`t` je
    // 4,4316 mm gemessen).
    expect(cases.length - Object.keys(gemessen).length).toBe(12);
  });

  it('setzt keinen Text unterhalb des Körpers und keine Zusatzkennzeichnung unten links', () => {
    for (const [section, recipe] of cases) {
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(drawing.children.filter((c) => c.role === 'foot'), section).toHaveLength(0);
      expect(recipe.spec.labels?.bottomLeft, section).toBeUndefined();
      expect(recipe.spec.labels?.belowRight, section).toBeUndefined();
    }
  });

  it('nennt die neun Referenzdateien mit Befund und die zwölf normgerechten nicht', () => {
    expect(Object.keys(ANHANG_E_D_FINDINGS)).toEqual([
      'E.2.7',
      'E.2.8',
      'E.2.9',
      'E.2.10',
      'E.2.13',
      'E.2.14',
      'E.2.15',
      'E.2.19',
      'E.2.20',
    ]);
    // E.2.6 steht hier und nicht oben: seine Datei ist normgerecht — Hülle, Grundlinie und
    // Beschriftung sind mit E.2.5 zeichengleich, die Strichebene mit E.2.4. Was an ihm besonders
    // ist, ist die Farbe und ihre Kontrastlage, und das ist kein Befund an der Quelle.
    for (const section of ['E.2.1', 'E.2.2', 'E.2.3', 'E.2.4', 'E.2.5', 'E.2.6', 'E.2.11', 'E.2.12', 'E.2.16', 'E.2.17', 'E.2.18', 'E.2.21']) {
      expect(Object.hasOwn(ANHANG_E_D_FINDINGS, section), section).toBe(false);
    }
    for (const section of Object.keys(ANHANG_E_D_FINDINGS)) {
      expect(Object.hasOwn(ANHANG_E_D_RECIPES, section)).toBe(true);
    }
  });

  it('hält fest, dass sechs der neun Befunde das Kürzel gegen den Dateinamen betreffen', () => {
    // Die neue Befundklasse dieses Blocks, die es in E.1 nicht gab. Geprüft wird der Inhalt und
    // nicht der Satzbau: jede der sechs Zeilen muss das Bildkürzel nennen, das der Katalog baut.
    expect(ANHANG_E_D_FINDINGS['E.2.7']).toMatch(/Telelader/u);
    expect(ANHANG_E_D_FINDINGS['E.2.8']).toMatch(/BRmG/u);
    expect(ANHANG_E_D_FINDINGS['E.2.9']).toMatch(/BRmG R/u);
    expect(ANHANG_E_D_FINDINGS['E.2.13']).toMatch(/geländegänig/u);
    expect(ANHANG_E_D_FINDINGS['E.2.14']).toMatch(/römisch/u);
    expect(ANHANG_E_D_FINDINGS['E.2.15']).toMatch(/LKW/u);
    // E.2.10 ist der einzige Befund zur Lage eines Laufs, E.2.19 und E.2.20 die zur Füllfläche.
    expect(ANHANG_E_D_FINDINGS['E.2.10']).toMatch(/0,7691 mm/u);
    expect(ANHANG_E_D_FINDINGS['E.2.19']).toMatch(/2,0002\/9,9998\/30,0002\/25,0003/u);
    expect(ANHANG_E_D_FINDINGS['E.2.20']).toMatch(/8,5002/u);
    // Kein Befundtext behauptet eine Absicht der Quelle — wie in E-b und E-c.
    for (const [section, text] of Object.entries(ANHANG_E_D_FINDINGS)) {
      expect(text, section).not.toMatch(/funktional/iu);
    }
  });
});

describe('Anhang E, Teilslice E-e (E.2.22 bis E.2.26)', () => {
  const cases = Object.entries<Recipe>(ANHANG_E_E_RECIPES);

  it('deckt genau die fünf Abschnitte E.2.22 bis E.2.26 ab', () => {
    expect(cases.map(([section]) => section)).toEqual(
      Array.from({ length: 5 }, (_, index) => `E.2.${index + 22}`),
    );
  });

  it('führt drei Körperformen über fünf Zeichen', () => {
    // Der formenreichste Block des Anhangs, und beide neuen Formen tragen keinen
    // Kapitel-1-Abschnitt: `trailer` ist an 5.1.2.1 belegt, `upright-rectangle` nur an E.2.26.
    const nachForm = cases.map(([section, recipe]) => [section, recipe.spec.kind]);
    expect(nachForm).toEqual([
      ['E.2.22', 'trailer'],
      ['E.2.23', 'trailer'],
      ['E.2.24', 'trailer'],
      ['E.2.25', 'trailer'],
      ['E.2.26', 'upright-rectangle'],
    ]);
  });

  it('trägt an den vier Anhängern die Deichsel und an E.2.26 keine Zusatzgeometrie', () => {
    for (const [section, recipe] of cases) {
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      const extras = drawing.children.filter((c) => c.role === 'bodyExtra');
      expect(extras, section).toHaveLength(section === 'E.2.26' ? 0 : 1);
    }
  });

  it('ordnet drei Anhänger dem Ein-Rad-Fahrwerk zu und einen dem Zwei-Räder-Fahrwerk', () => {
    // Nach der Zeichnung und nicht nach dem Dateinamen: E.2.23 heißt „von LKW gezogen" und trägt
    // ein Rad, E.2.25 heißt „von PKW gezogen" und trägt ebenfalls eines. Nur E.2.24 passt.
    const einRad = cases
      .filter(([, recipe]) => recipe.spec.vehicleCategory === 'anhaenger-ein-rad')
      .map(([section]) => section);
    const zweiRaeder = cases
      .filter(([, recipe]) => recipe.spec.vehicleCategory === 'anhaenger-zwei-raeder')
      .map(([section]) => section);
    expect(einRad).toEqual(['E.2.22', 'E.2.23', 'E.2.25']);
    expect(zweiRaeder).toEqual(['E.2.24']);
    // E.2.26 trägt kein Fahrwerk: seine Strichebene führt nur das Ringpaar des Körperumrisses.
    expect(ANHANG_E_E_RECIPES['E.2.26'].spec).not.toHaveProperty('vehicleCategory');
    const raeder = composeFromCatalog(ANHANG_E_E_RECIPES['E.2.26'].spec).children.filter(
      (c) => c.role === 'chassis',
    );
    expect(raeder).toHaveLength(0);
  });

  it('lässt bei E.2.22 als einzigem Zeichen des Anhangs die mittige Zone leer', () => {
    const ohneMitte = cases
      .filter(([, recipe]) => recipe.spec.labels?.center === undefined)
      .map(([section]) => section);
    expect(ohneMitte).toEqual(['E.2.22']);
    const alleRezepte = Object.entries<Recipe>(RECIPES).filter(
      ([section, recipe]) => section.startsWith('E.') && recipe.spec.labels?.center === undefined,
    );
    // E.2.27 ist das zweite und letzte — es trägt seinen einzigen Lauf unterhalb des Körpers.
    expect(alleRezepte.map(([section]) => section)).toEqual(['E.2.22', 'E.2.27']);
  });

  it('setzt die mittige Grundlinie von E.2.26 auf die gemessenen 13 mm über der Unterkante', () => {
    // Der größte Abstand aller fünf Körperformen aus E.2 und der Beleg, dass die Grundlinie eine
    // Eigenschaft des Körperprofils ist: mit der festen 8 stünde der Lauf auf 22,0 statt 17,0 mm.
    const drawing = composeFromCatalog(
      ANHANG_E_E_RECIPES['E.2.26'].spec,
      ANHANG_E_E_RECIPES['E.2.26'].title,
    );
    const body = drawing.children.find((c) => c.role === 'body');
    expect(body).toBeDefined();
    if (body === undefined) return;
    expect(boundsOfMm(body)).toMatchObject({ minY: 2, maxY: 30 });
    const [center, bottomRight] = drawing.children.filter(
      (child): child is Primitive & { type: 'text' } =>
        child.type === 'text' && child.role === 'label',
    );
    expect(center?.content).toBe('TW AA');
    expect(center?.y).toBeCloseTo(17, 6);
    expect(bottomRight?.content).toBe('THW');
    expect(bottomRight?.y).toBeCloseTo(28, 6);
    // Die deklarierte Abweichung, an der Ausgabe festgehalten: die Referenz ankert bei 26,0 mm.
    expect(bottomRight?.x).toBeCloseTo(27, 6);
  });

  it('nennt die vier Referenzdateien mit Befund und E.2.26 nicht', () => {
    // E.2.26 fehlt hier, weil seine Besonderheit eine Abweichung der Umsetzung ist und kein
    // Befund an der Quelle — sie steht als deviation im Manifest.
    expect(Object.keys(ANHANG_E_E_FINDINGS)).toEqual(['E.2.22', 'E.2.23', 'E.2.24', 'E.2.25']);
    expect(Object.hasOwn(ANHANG_E_E_FINDINGS, 'E.2.26')).toBe(false);
    expect(ANHANG_E_E_FINDINGS['E.2.22']).toMatch(/5\.1\.2\.1/u);
    expect(ANHANG_E_E_FINDINGS['E.2.23']).toMatch(/von LKW gezogen/u);
    expect(ANHANG_E_E_FINDINGS['E.2.24']).toMatch(/zweimal byteidentisch/u);
    expect(ANHANG_E_E_FINDINGS['E.2.25']).toMatch(/keine flachfüßige Glyphe/u);
    for (const [section, text] of Object.entries(ANHANG_E_E_FINDINGS)) {
      expect(text, section).not.toMatch(/funktional/iu);
    }
  });
});

describe('Anhang E, Teilslice E-f (E.2.27 bis E.2.31)', () => {
  const cases = Object.entries<Recipe>(ANHANG_E_F_RECIPES);

  it('deckt genau die fünf Abschnitte E.2.27 bis E.2.31 ab', () => {
    expect(cases.map(([section]) => section)).toEqual(
      Array.from({ length: 5 }, (_, index) => `E.2.${index + 27}`),
    );
  });

  it('führt Anhang E damit auf alle 68 Abschnitte, lückenlos', () => {
    // Das Gegenstück zur 37er-Zusicherung aus E-c, an den **Rezepten** gemessen. Seit E.2.6 am
    // 18. August 2026 nachgezogen wurde, ist sie die Zusage, die der Manifest-`scope` mit `E`
    // beansprucht: `uncoveredScope` prüft an einem Präfix nur die Existenz einer Zeile, `E`
    // bestünde also schon mit E.1 allein. Die zweite Hälfte dieser Absicherung steht in
    // `coverage-manifest.test.ts` und leitet dieselbe Aussage aus den Manifesteinträgen ab —
    // zwei Wege zu einer Zahl, weil ein Rezept ohne Manifestzeile hier nicht auffiele.
    const alleE = Object.keys(RECIPES).filter((section) => section.startsWith('E.'));
    const erwartet = [
      ...Array.from({ length: 37 }, (_, index) => `E.1.${index + 1}`),
      ...Array.from({ length: 31 }, (_, index) => `E.2.${index + 1}`),
    ];
    expect(alleE).toEqual(erwartet);
    expect(alleE).toHaveLength(68);
  });

  it.each(cases)('%s steht auf dem angehobenen Rumpf und trägt sein Kürzel unterhalb des Körpers', (section, recipe) => {
    expect(recipe.spec.kind).toBe('vehicle-water');
    expect(recipe.spec.bodyVariant).toBe('raised-hull');
    expect(recipe.spec.labels?.belowRight).toBe('THW');
    // Kein `bottomRight`: derselbe Lauf **im** Körper wäre ein anderes Bild, und kein Gate
    // meldete es.
    expect(recipe.spec.labels?.bottomRight).toBeUndefined();
    expect(recipe.referenceAsset.startsWith(`${section}_`)).toBe(true);
  });

  it('malt den Lauf unterhalb des Körpers blau und den mittigen weiss', () => {
    for (const [section, recipe] of cases) {
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      const body = drawing.children.find((c) => c.role === 'body');
      expect(boundsOfMm(body!).maxY, section).toBeCloseTo(22.9896, 4);
      const labels = drawing.children.filter(
        (child): child is Primitive & { type: 'text' } =>
          child.type === 'text' && child.role === 'label',
      );
      const unten = labels.find((label) => label.content === 'THW');
      expect(unten?.style?.fill, section).toBe('blau');
      // Er liegt vollständig **unter** dem Rumpf: gemessen 24,0806 mm Oberkante gegen
      // 22,9898 mm Rumpfunterkante.
      expect(unten?.boxMm.yMm, section).toBeGreaterThan(22.9896);
      for (const label of labels) {
        if (label === unten) continue;
        expect(label.style?.fill, section).toBe('weiss');
        expect(label.y, section).toBeCloseTo(16, 6);
      }
    }
  });

  it('lässt bei E.2.27 als einzigem der fünf die mittige Zone leer', () => {
    const ohneMitte = cases
      .filter(([, recipe]) => recipe.spec.labels?.center === undefined)
      .map(([section]) => section);
    expect(ohneMitte).toEqual(['E.2.27']);
    // Und es bleibt trotzdem beschrieben: `describeSymbolSpec` nimmt die vierte Zone auf, sonst
    // verlöre dieses Zeichen seine einzige fachliche Angabe in der Vorlesebeschreibung.
    const drawing = composeFromCatalog(
      ANHANG_E_F_RECIPES['E.2.27'].spec,
      ANHANG_E_F_RECIPES['E.2.27'].title,
    );
    expect(drawing.description).toMatch(/THW/u);
  });

  it('nennt die beiden Referenzdateien mit Befund und die drei übrigen nicht', () => {
    expect(Object.keys(ANHANG_E_F_FINDINGS)).toEqual(['E.2.27', 'E.2.31']);
    for (const section of ['E.2.28', 'E.2.29', 'E.2.30']) {
      expect(Object.hasOwn(ANHANG_E_F_FINDINGS, section), section).toBe(false);
    }
    expect(ANHANG_E_F_FINDINGS['E.2.27']).toMatch(/1,0002 mm/u);
    expect(ANHANG_E_F_FINDINGS['E.2.27']).toMatch(/0,999318/u);
    expect(ANHANG_E_F_FINDINGS['E.2.31']).toMatch(/I\.3\.7/u);
    for (const [section, text] of Object.entries(ANHANG_E_F_FINDINGS)) {
      expect(text, section).not.toMatch(/funktional/iu);
    }
  });
});

describe('Piktogramm-Platzierung als Gruppe', () => {
  it('erzeugt genau eine Piktogramm-Gruppe mit der Verschiebung als Transformation', () => {
    const drawing = composeFromCatalog({
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'staffel',
      capabilities: ['fire-fighting'],
    });
    const pictograms = drawing.children.filter((c) => c.role === 'pictogram');
    expect(pictograms).toHaveLength(1);
    const group = pictograms[0];
    expect(group?.type).toBe('group');
    if (group?.type !== 'group') return;
    // Der Stapel verschiebt den Körper um 3 mm (Anker 6 → 9); das Boxpiktogramm folgt ihm.
    expect(group.transform?.translate?.dxMm).toBe(0);
    expect(group.transform?.translate?.dyMm).toBeCloseTo(3, 6);
    // Die Kinder tragen ihre Autorenkoordinaten unverändert — die Verschiebung sitzt außen.
    expect(group.children).toHaveLength(3);
    for (const child of group.children) {
      expect(child.role).toBe('pictogram');
    }
  });

  it('verschiebt die Gruppe bei unverändertem Körper um null, statt sie weglassen', () => {
    // Die Reihe lässt den Körper bei Anker 6. Die Gruppe entsteht trotzdem: eine
    // Sonderbehandlung für Delta 0 wäre ein zweiter Codepfad ohne fachlichen Anlass.
    const drawing = composeFromCatalog({
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'gruppe',
      capabilities: ['fire-fighting'],
    });
    const group = drawing.children.find((c) => c.role === 'pictogram');
    expect(group?.type).toBe('group');
    expect(group?.transform?.translate?.dyMm).toBeCloseTo(0, 6);
  });

  it('erzeugt keine Gruppe, wenn die Spec keine Fähigkeit nennt', () => {
    const drawing = composeFromCatalog(RECIPES['D.3.7'].spec);
    expect(drawing.children.filter(
      (child) => child.role === 'pictogram' && child.type === 'group',
    )).toHaveLength(0);
  });
});

describe('Pfad-Piktogramm in beiden Layoutfällen (Spec-Erfolgskriterium 1)', () => {
  /**
   * Die beiden Layoutfälle der Referenz, mit dem Kurven-Piktogramm statt der Brandbekämpfung:
   * Staffel (Stapel) verschiebt den Körper von Anker 6 auf 9, Gruppe (Reihe) lässt ihn bei 6.
   *
   * Bewusst als Testkompositionen und nicht als Erweiterung von RECIPES: eine Löschstaffel hat
   * kein Brauchwasser-Piktogramm, und RECIPES['C.1.1'] beansprucht, C.1.1_Löschstaffel.svg zu
   * reproduzieren. Was hier belegt wird, ist der Mechanismus, nicht ein Zeichen der Baseline.
   */
  const cases = [
    ['staffel', 'staffel', 19, 3] as const,
    ['gruppe', 'gruppe', 16, 0] as const,
  ];

  it.each(cases)(
    'platziert das Kurven-Piktogramm bei Stärke %s auf Körpermitte %d mm',
    (_name, strength, expectedCenterYMm, expectedShiftMm) => {
      const drawing = composeFromCatalog({
        kind: 'formation',
        organization: 'feuerwehr',
        strength,
        capabilities: ['service-water'],
      });

      const body = drawing.children.find((c) => c.role === 'body');
      expect(body).toBeDefined();
      if (body === undefined) return;
      const bodyBounds = boundsOfMm(body);
      expect((bodyBounds.minY + bodyBounds.maxY) / 2).toBeCloseTo(expectedCenterYMm, 6);

      const group = drawing.children.find(
        (c): c is Primitive & { type: 'group' } => c.type === 'group' && c.role === 'pictogram',
      );
      expect(group).toBeDefined();
      if (group === undefined) return;

      // Die Verschiebung folgt der Körpermitte …
      expect(group.transform?.translate?.dyMm).toBeCloseTo(expectedShiftMm, 6);
      // … und der Pfad selbst bleibt unangetastet. Genau das konnte die frühere primitivweise
      // Verschiebung nicht: shiftY wirft für Pfade bedingungslos.
      const [wave] = group.children;
      expect(wave?.type).toBe('path');
      if (wave?.type !== 'path') return;
      const source = pictogram('capability.service-water').primitives[0];
      expect(source?.type).toBe('path');
      if (source?.type !== 'path') return;
      expect(wave.d).toBe(source.d);
    },
  );

  it('hält die effektive Piktogramm-Box in beiden Fällen im verschobenen Körper', () => {
    // Die Invariante, die das Clipping-Gate gegen den unverschobenen Körper prüfbar macht:
    // Körper und Piktogramm bewegen sich um dasselbe Delta, die relative Lage bleibt gleich.
    for (const [, strength] of cases) {
      const drawing = composeFromCatalog({
        kind: 'formation',
        organization: 'feuerwehr',
        strength,
        capabilities: ['service-water'],
      });
      const body = drawing.children.find((c) => c.role === 'body');
      const group = drawing.children.find(
        (c): c is Primitive & { type: 'group' } => c.type === 'group' && c.role === 'pictogram',
      );
      expect(body).toBeDefined();
      expect(group).toBeDefined();
      if (body === undefined || group === undefined) continue;

      const shiftMm = group.transform?.translate?.dyMm ?? 0;
      const box = pictogram('capability.service-water').box;
      const bodyBounds = boundsOfMm(body);
      expect(box.yMm + shiftMm).toBeGreaterThanOrEqual(bodyBounds.minY);
      expect(box.yMm + box.heightMm + shiftMm).toBeLessThanOrEqual(bodyBounds.maxY);
    }
  });

  it('rendert den Pfad in der verschobenen Gruppe, ohne die Skalierung zu doppeln', () => {
    const svg = renderSvg(
      composeFromCatalog({
        kind: 'formation',
        organization: 'feuerwehr',
        strength: 'staffel',
        capabilities: ['service-water'],
      }),
      { size: 64 },
    );
    // Die Gruppe trägt die Verschiebung in Einheiten …
    expect(svg).toContain(`<g transform="translate(0 ${formatUnits(mmToUnits(3))})">`);
    // … der Pfad ausschließlich seine Millimeter-Skalierung, mit unverändertem d-String.
    const pathTag = svg.match(/<path[^>]*\/>/)?.[0];
    expect(pathTag).toBeDefined();
    expect(pathTag).toContain('transform="scale(');
    expect(pathTag).not.toContain('translate(');
    expect(pathTag).toContain('fill="#000000"');
  });

  it('wirft nicht, wenn zwei Fähigkeiten zusammen platziert werden', () => {
    // Beide Piktogramme landen in derselben Gruppe — ein Strich- und ein Kurvenpiktogramm
    // nebeneinander, die frühere shiftY-Abbildung wäre hier gescheitert.
    const drawing = composeFromCatalog({
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'staffel',
      capabilities: ['fire-fighting', 'service-water'],
    });
    // Ergänzung gegenüber dem Brief: `find` liefert nur die erste Gruppe und würde eine zweite
    // Gruppe daneben nicht ausschließen. Erst diese Zusicherung schließt die aus Task 8 offene
    // Frage wirklich — beide Fähigkeiten landen in genau einer Gruppe, nicht in je einer eigenen.
    expect(drawing.children.filter((c) => c.role === 'pictogram')).toHaveLength(1);
    const group = drawing.children.find(
      (c): c is Primitive & { type: 'group' } => c.type === 'group' && c.role === 'pictogram',
    );
    expect(group?.children).toHaveLength(4);
    // Vier Kinder sind drei Linien (Brandbekämpfung) plus ein Pfad (Löschwasser/Brauchwasser),
    // nicht irgendeine Vierergruppe.
    expect(group?.children.filter((c) => c.type === 'path')).toHaveLength(1);
    expect(group?.children.filter((c) => c.type === 'line')).toHaveLength(3);
  });
});
