import type {
  BodyGeometryMode,
  FingerprintLike,
  FingerprintShapeLike,
  MatchFingerprintOptions,
} from '@einsatzzeichen/core';
import { deepFreeze, type DeepReadonly } from '@einsatzzeichen/core';

/**
 * **Benannte Vergleichsausnahmen** des Körpervergleichs (`matchFingerprint`, LFH-568).
 *
 * Eine Ausnahme ändert, **was** gegen den Kennwert gestellt wird — nie die Toleranz und nie das
 * Ergebnis. Bis LFH-568 standen diese Sonderpfade nur als Inline-Code in `recipes.test.ts` (D.1,
 * D.4.3, I.5.3) und als Tabellenspalte in `base-symbols.test.ts` (1.13). Eine Ausnahme, die nur im
 * Test steht, ist für jeden unsichtbar, der aus dem Paket eine Herkunftsaussage liest
 * (`combinationProvenance`); deshalb steht sie jetzt als Datum hier, im Stil von
 * `CONTRAST_EXCEPTIONS`.
 *
 * Arten:
 * - `drop-shape-kind` — alle Formen einer Formart werden aus dem Kennwert genommen.
 * - `drop-exact-shapes` — genau die aufgeführten Formen werden genommen, und nur, wenn die
 *   Teilmenge dieser Formart im Kennwert **exakt** ihnen entspricht. Jede Abweichung wirft, statt
 *   still weitere Formen zu entfernen.
 * - `body-geometry` — der Körper wird mit einer anderen `BodyGeometryMode` vermessen.
 *
 * `decidesOutcome` hält fest, ob der Vergleich **ohne** die Ausnahme scheitert. Das ist kein
 * Kommentar, sondern gegatet (`comparison-exceptions.test.ts`): Einträge mit `true` scheitern ohne
 * Ausnahme und bestehen mit ihr; Einträge mit `false` bestehen auch ohne sie, und ihr Gate prüft
 * stattdessen, dass die entfernte Fremdform im Kennwert noch steht.
 *
 * `G.1.5` steht bewusst **nicht** hier: dort findet gar kein Vergleich statt (`shapes: []`,
 * `referenceLacksComparableShape`), es ist eine Geometrie-Regression und keine Abwandlung des
 * Vergleichs. Gegatet ist es im Test „Geometrie-Regressionsclaim" in `recipes.test.ts`.
 */
interface ComparisonExceptionBase {
  /** Stabile Kennung der Ausnahme. */
  readonly id: string;
  /** Wofür die Ausnahme gilt: ein Rezept (Fixture) oder ein Grundzeichen des Kapitels 1. */
  readonly subject: 'recipe' | 'base-symbol';
  /**
   * Betroffene Fixtures mit ihrer Referenzdatei. `key` ist der Rezeptschlüssel in `RECIPES`
   * bzw. die Grundzeichenart in `BASE_SYMBOLS`. Beides ist gegen den Bestand gegatet.
   */
  readonly fixtures: readonly { readonly key: string; readonly referenceAsset: string }[];
  /** Scheitert der Vergleich ohne diese Ausnahme? Gegatet, siehe Modulkommentar. */
  readonly decidesOutcome: boolean;
  /** Warum der Kennwert hier nicht unverändert gegen den Körper stehen kann. */
  readonly rationale: string;
  /** Wo der Befund steht, der die Ausnahme trägt. */
  readonly foundAt: string;
}

export type ComparisonException = ComparisonExceptionBase & (
  | { readonly kind: 'drop-shape-kind'; readonly shapeKind: string }
  | {
    readonly kind: 'drop-exact-shapes';
    readonly shapeKind: string;
    readonly shapes: readonly FingerprintShapeLike[];
  }
  | { readonly kind: 'body-geometry'; readonly bodyGeometry: BodyGeometryMode }
);

export const COMPARISON_EXCEPTIONS: DeepReadonly<ComparisonException[]> = deepFreeze([
  {
    id: 'd1-cap-covers-ring',
    subject: 'recipe',
    kind: 'drop-shape-kind',
    shapeKind: 'ring',
    fixtures: [
      { key: 'D.1.2', referenceAsset: 'D.1.2_Katastrophenschutzleitung im Einsatz.svg' },
      { key: 'D.1.3', referenceAsset: 'D.1.3_Technische Einsatzleitung Evakuierung im Einsatz.svg' },
      { key: 'D.1.4', referenceAsset: 'D.1.4_Einsatzleitung im Einsatz.svg' },
      { key: 'D.1.5', referenceAsset: 'D.1.5_Einsatzabschnittsleitung Nord im Einsatz.svg' },
      { key: 'D.1.6', referenceAsset: 'D.1.6._Unterabschnittsleitung im Einsatz.svg' },
      { key: 'D.1.7', referenceAsset: 'D.1.7_Führungsgruppe TEL.svg' },
      { key: 'D.1.8', referenceAsset: 'D.1.8_Führungsgruppe einer Feuerwehrbereitschaft.svg' },
    ],
    decidesOutcome: true,
    rationale:
      'D.1.2 bis D.1.8 verdecken die obere Rahmenlinie mit ihrer 3-mm-Kappe. Der Extraktor führt ' +
      'deshalb neben der vollständigen Füllhülle (`rect`) einen nur noch ab y = 7,375 mm ' +
      'sichtbaren `ring`, den die Präzedenz von `matchFingerprint` vorzöge. Der semantische ' +
      '`body` bleibt die vollständige Füllhülle, die Kappe ist eine getrennte Dekoration; ' +
      'verglichen wird deshalb die ebenfalls extrahierte `rect`-Hülle, nicht die durch Übermalung ' +
      'verkürzte sichtbare Kontur.',
    foundAt:
      'packages/catalog/src/fingerprints.json (Einträge D.1.2 bis D.1.8: `ring` ab y 7,375 neben ' +
      '`rect`); bis LFH-568 inline in packages/catalog/src/recipes.test.ts „reproduziert die ' +
      'Referenz".',
  },
  {
    id: 'd4-3-star-bounds',
    subject: 'recipe',
    kind: 'drop-exact-shapes',
    shapeKind: 'bounds',
    shapes: [
      { kind: 'bounds', boundsMm: { minXMm: 9.143, minYMm: 0, maxXMm: 12.857, maxYMm: 4 } },
      { kind: 'bounds', boundsMm: { minXMm: 19.143, minYMm: 0, maxXMm: 22.857, maxYMm: 4 } },
    ],
    fixtures: [
      { key: 'D.4.3', referenceAsset: 'D.4.3_Leiter Gefahrenabwehr Mönchengladbach.svg' },
    ],
    decidesOutcome: true,
    rationale:
      'Der `rect`-Körper von D.4.3 steht im Kennwert zuerst; `matchFingerprint` bevorzugt durch ' +
      'seine Formart-Präzedenz trotzdem die beiden als `bounds` extrahierten Sternpfade über dem ' +
      'Körper. Genau diese zwei vermessenen Hüllen werden aus dem Körpervergleich genommen, und ' +
      'nur, wenn die `bounds`-Teilmenge exakt ihnen entspricht.',
    foundAt:
      'packages/catalog/src/fingerprints.json (Eintrag D.4.3: zwei `bounds` 9,143…12,857 und ' +
      '19,143…22,857 × 0…4 mm); bis LFH-568 `comparableBodyFingerprint` in ' +
      'packages/catalog/src/recipes.test.ts.',
  },
  {
    id: 'i5-3-label-t-outline',
    subject: 'recipe',
    kind: 'drop-exact-shapes',
    shapeKind: 'outline',
    shapes: [
      { kind: 'outline', boundsMm: { minXMm: 1.089, minYMm: 1.081, maxXMm: 3.339, maxYMm: 4 } },
    ],
    fixtures: [{ key: 'I.5.3', referenceAsset: 'I.5.3_Taucher.svg' }],
    // Die Präzedenz stellt `outline` ans Ende; solange die Raute eine bessere Form führt, wählt
    // `matchFingerprint` das T ohnehin nicht. Die Ausnahme nagelt die Fremdform fest, damit eine
    // Änderung des Extraktors sichtbar wird, statt dass das T eines Tages still verglichen wird.
    decidesOutcome: false,
    rationale:
      'Der zusätzliche `outline`-Pfad im Kennwert ist das T des literalen Labels „Taucher" und ' +
      'nicht Teil der Raute. Er wird nur entfernt, wenn die `outline`-Teilmenge exakt dieser ' +
      'vermessenen Hülle entspricht.',
    foundAt:
      'packages/catalog/src/fingerprints.json (Eintrag I.5.3: `outline` 1,089/1,081/3,339/4); bis ' +
      'LFH-568 `comparableBodyFingerprint` in packages/catalog/src/recipes.test.ts.',
  },
  {
    id: '1-13-stroke-outline',
    subject: 'base-symbol',
    kind: 'body-geometry',
    bodyGeometry: 'stroke-outline',
    fixtures: [{ key: 'event', referenceAsset: '1.13_Ereignis.svg' }],
    decidesOutcome: true,
    rationale:
      'Der Kennwert von 1.13 Ereignis ist die Hülle des zu einer Fläche umgewandelten Strichs ' +
      '(`bounds` 3,792/6,862/28,207/25,451) und nicht die Mittellinie 4/7/28/25. Die Einstellung ' +
      'wird bewusst nicht aus der Formklasse des Kennwerts abgeleitet: für 1.10 Maßnahme wäre ' +
      'das um 0,71 Einheiten falsch (siehe `strokeBoundsOfMm`).',
    foundAt:
      'packages/core/src/fingerprint.ts (`BodyGeometryMode`, „genau ein Fall"); Tabelle ' +
      '`REFERENCE` in packages/catalog/src/base-symbols.test.ts.',
  },
]);

/** Die Ausnahme, die für eine Referenzdatei gilt, oder `undefined`. */
export function comparisonExceptionFor(
  referenceAsset: string,
): DeepReadonly<ComparisonException> | undefined {
  return COMPARISON_EXCEPTIONS.find((exception) =>
    exception.fixtures.some((fixture) => fixture.referenceAsset === referenceAsset));
}

function sameShape(a: FingerprintShapeLike, b: FingerprintShapeLike): boolean {
  return a.kind === b.kind &&
    a.boundsMm.minXMm === b.boundsMm.minXMm &&
    a.boundsMm.minYMm === b.boundsMm.minYMm &&
    a.boundsMm.maxXMm === b.boundsMm.maxXMm &&
    a.boundsMm.maxYMm === b.boundsMm.maxYMm;
}

/**
 * Wendet die benannte Ausnahme der Referenzdatei an und liefert, was `matchFingerprint`
 * bekommt: den vergleichbaren Kennwert und die Optionen. Ohne Ausnahme bleibt beides
 * unverändert.
 *
 * Wirft, wenn die Ausnahme nicht mehr zum Kennwert passt — eine `drop-exact-shapes`-Teilmenge,
 * die nicht exakt den vermessenen Formen entspricht, oder eine `drop-shape-kind`-Ausnahme ohne
 * Form dieser Art. Eine veraltete Ausnahme darf den Vergleich nicht still verändern.
 */
export function comparableFingerprint(fingerprint: FingerprintLike): {
  readonly fingerprint: FingerprintLike;
  readonly options: MatchFingerprintOptions;
} {
  const exception = comparisonExceptionFor(fingerprint.asset);
  if (exception === undefined) return { fingerprint, options: {} };

  switch (exception.kind) {
    case 'body-geometry':
      return { fingerprint, options: { bodyGeometry: exception.bodyGeometry } };
    case 'drop-shape-kind': {
      const kept = fingerprint.shapes.filter((shape) => shape.kind !== exception.shapeKind);
      if (kept.length === fingerprint.shapes.length) {
        throw new Error(
          `Vergleichsausnahme ${exception.id}: ${fingerprint.asset} führt keine Form der Art ` +
            `"${exception.shapeKind}" mehr — die Ausnahme ist veraltet.`,
        );
      }
      return { fingerprint: { ...fingerprint, shapes: kept }, options: {} };
    }
    case 'drop-exact-shapes': {
      const ofKind = fingerprint.shapes.filter((shape) => shape.kind === exception.shapeKind);
      const matches = ofKind.length === exception.shapes.length &&
        ofKind.every((shape, index) => sameShape(shape, exception.shapes[index]!));
      if (!matches) {
        throw new Error(
          `Vergleichsausnahme ${exception.id}: die "${exception.shapeKind}"-Formen von ` +
            `${fingerprint.asset} entsprechen nicht exakt den vermessenen ` +
            `(${JSON.stringify(ofKind)}); entfernt wird nichts.`,
        );
      }
      const dropped = new Set(ofKind);
      return {
        fingerprint: { ...fingerprint, shapes: fingerprint.shapes.filter((s) => !dropped.has(s)) },
        options: {},
      };
    }
  }
}
