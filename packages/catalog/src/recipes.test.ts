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
import {
  ANHANG_E_A_FILL_DEFECTS,
  ANHANG_E_A_RECIPES,
  ANHANG_E_B_FILL_FINDINGS,
  ANHANG_E_B_RECIPES,
  ANHANG_E_C_FILL_FINDINGS,
  ANHANG_E_C_RECIPES,
} from './recipes-anhang-e.js';

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
    // Und die Gegenrichtung: kein Rezept des Katalogs beansprucht einen E-Abschnitt außerhalb
    // von E.1. Anhang E.2 ist auf `vehicle-land`/`vehicle-water` blockiert, und ein `E`-Scope
    // wäre deshalb falsch — dieser Test hält den Unterschied zwischen `E.1` und `E` fest.
    const alleE = Object.keys(RECIPES).filter((section) => section.startsWith('E.'));
    expect(alleE).toEqual(sections);
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
