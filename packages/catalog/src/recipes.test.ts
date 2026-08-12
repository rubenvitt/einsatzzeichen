import { describe, expect, it } from 'vitest';
import {
  ARIMO_CAP_HEIGHT_FRACTION,
  boundsOfMm,
  CompositionError,
  formatUnits,
  matchFingerprint,
  renderSvg,
} from '@einsatzzeichen/core';
import { mmToUnits, type Drawing, type Primitive } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { fingerprintFor } from './fingerprint-index.js';
import { pictogram } from './pictograms/index.js';
import {
  RECIPES,
  composeFromCatalog,
  labelContrastRequirements,
  type Recipe,
} from './recipes.js';
import { ANHANG_E_A_FILL_DEFECTS, ANHANG_E_A_RECIPES } from './recipes-anhang-e.js';

/**
 * Effektive y-Lage der waagerechten Brandbekämpfungs-Linie: ihre Autorenkoordinate plus die
 * Verschiebung ihrer Gruppe. Seit die Piktogramme von einer Gruppe mit `transform.translate`
 * umschlossen werden, steht der an der Referenz vermessene Sollwert nicht mehr am Primitiv —
 * die fachliche Aussage ist unverändert, sie wird eine Ebene tiefer gelesen.
 */
function horizontalPictogramLineYMm(drawing: Drawing): number | undefined {
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

describe('Kompositionsrezepte', () => {
  const fingerprintCases = Object.entries(RECIPES);

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
    const result = matchFingerprint(drawing, fingerprintFor(recipe.referenceAsset));
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
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

  it('unterscheidet Löschstaffel und Löschgruppe nur in der Stärke', () => {
    const { strength: _a, ...staffel } = RECIPES['C.1.1'].spec;
    const { strength: _b, ...gruppe } = RECIPES['C.1.2'].spec;
    expect(staffel).toEqual(gruppe);
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

  it('verlangt für weissen Text auf der Körperfarbe die Textschwelle, nicht die Nichttextschwelle', () => {
    const requirements = labelContrastRequirements();
    expect(requirements).toHaveLength(1);
    expect(requirements[0]).toEqual({
      foreground: 'weiss',
      background: 'blau',
      context: 'Beschriftung im Körper auf Organisation thw',
      minimum: 4.5,
    });
  });
});

describe('Piktogramm-Platzierung als Gruppe', () => {
  it('erzeugt genau eine Piktogramm-Gruppe mit der Verschiebung als Transformation', () => {
    const drawing = composeFromCatalog(RECIPES['C.1.1'].spec);
    const pictograms = drawing.children.filter((c) => c.role === 'pictogram');
    expect(pictograms).toHaveLength(1);
    const group = pictograms[0];
    expect(group?.type).toBe('group');
    if (group?.type !== 'group') return;
    // C.1.1 verschiebt den Körper um 3 mm (Anker 6 → 9); das Piktogramm folgt der Körpermitte.
    expect(group.transform?.translate?.dxMm).toBe(0);
    expect(group.transform?.translate?.dyMm).toBeCloseTo(3, 6);
    // Die Kinder tragen ihre Autorenkoordinaten unverändert — die Verschiebung sitzt außen.
    expect(group.children).toHaveLength(3);
    for (const child of group.children) {
      expect(child.role).toBe('pictogram');
    }
  });

  it('verschiebt die Gruppe bei unverändertem Körper um null, statt sie weglassen', () => {
    // C.1.2 (Reihe) lässt den Körper bei Anker 6. Die Gruppe entsteht trotzdem: eine
    // Sonderbehandlung für Delta 0 wäre ein zweiter Codepfad ohne fachlichen Anlass.
    const drawing = composeFromCatalog(RECIPES['C.1.2'].spec);
    const group = drawing.children.find((c) => c.role === 'pictogram');
    expect(group?.type).toBe('group');
    expect(group?.transform?.translate?.dyMm).toBeCloseTo(0, 6);
  });

  it('erzeugt keine Gruppe, wenn die Spec keine Fähigkeit nennt', () => {
    const drawing = composeFromCatalog(RECIPES['D.3.7'].spec);
    expect(drawing.children.filter((c) => c.role === 'pictogram')).toHaveLength(0);
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
