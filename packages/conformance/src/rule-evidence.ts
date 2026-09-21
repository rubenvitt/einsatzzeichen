import { CompositionError, validateSpec } from '@einsatzzeichen/core';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import { administrativeHead } from '@einsatzzeichen/core';
import { functionRole } from '@einsatzzeichen/core';
import { composeFromCatalog } from './recipes.js';

/**
 * Regelbelege als **Daten** (LFH-568, Teil „Regelabdeckung").
 *
 * Entscheidung des Eigentümers vom 21. September 2026: **Eine Regel gilt als belegt, wenn ein
 * Testfall sie auslöst.** Bis dahin prüfte `core/src/validation-rules.test.ts` nur, ob die
 * Kennung als String in einer Testdatei vorkommt. Hier steht je Regel ein Fall, den
 * `rule-evidence.test.ts` zur Laufzeit auslöst; `ruleEvidenceCoverage()` in `rule-coverage.ts`
 * zählt das Ergebnis.
 *
 * Warum im Katalog und nicht in `core`: drei Funktionsrollenregeln feuern erst, wenn die
 * Beschreibung gegen die **vermessene Funktionsfassung** geprüft wird, und die liegt im Katalog.
 * Die Kompositionsregeln entstehen erst in `composeFromCatalog`, also ebenfalls hier.
 *
 * Rezepte können keinen Beleg liefern: sie sind gültige Specs und lösen gerade keine
 * Ablehnungsregel aus. Die Fälle stammen deshalb aus `core/src/validate.test.ts` und
 * `core/src/validation-rules.cases.test.ts` — dort einzeln nachgeprüft, nicht aus dem
 * String-Vorkommen geschlossen. Wo der Bestand keinen auslösenden Fall hatte, ist der Fall hier
 * neu und in `note` so vermerkt.
 */

/**
 * Über welchen öffentlichen Weg der Fall seine Regel auslöst.
 *
 * - `'validateSpec'` — `validateSpec(spec)` ohne Kontext.
 * - `'validateSpec+catalog'` — `validateSpec(spec, kontext)`, wobei der Kontext genau das ist,
 *   was `composeFromCatalog` übergibt: die vermessene Funktionsfassung und der vermessene
 *   Verwaltungskopf aus diesem Katalog. Kein erfundener Kontext.
 * - `'composeFromCatalog'` — der Fall besteht `validateSpec`, und erst die Komposition wirft
 *   einen `CompositionError` mit der Regel (die Regeln aus `COMPOSITION_RULE_CATALOG`).
 */
export type RuleEvidenceVia = 'validateSpec' | 'validateSpec+catalog' | 'composeFromCatalog';

export interface RuleEvidence {
  readonly rule: string;
  readonly spec: SymbolSpec;
  readonly via: RuleEvidenceVia;
  /** Was der Fall zeigt und woher er stammt. */
  readonly note: string;
}

export interface RuleEvidenceGap {
  readonly rule: string;
  /** Warum aus einer `SymbolSpec` heraus kein Fall die Regel auslöst. */
  readonly reason: string;
  /** Wo die Lücke im Bestand steht oder begründet ist. */
  readonly location: string;
}

/**
 * Einige Fälle sind **Laufzeitfälle am Typ vorbei**: ein Wert, den `SymbolSpec` statisch nicht
 * zulässt (`null` statt Zahl, unbekannter Token), der aber aus JSON oder aus dem Builder
 * ankommen kann. Genau dagegen prüfen diese Regeln. Der Umweg über `unknown` steht deshalb
 * sichtbar an jedem solchen Fall und nicht als stille Typlockerung.
 */
function runtime(spec: Record<string, unknown>): SymbolSpec {
  return spec as unknown as SymbolSpec;
}

function evidence(rule: string, spec: SymbolSpec, note: string, via: RuleEvidenceVia = 'validateSpec'): RuleEvidence {
  return Object.freeze({ rule, spec, via, note });
}

const VT = 'validate.test.ts';
const CT = 'validation-rules.cases.test.ts';

/**
 * Je Regel aus `RULE_CATALOG` und `COMPOSITION_RULE_CATALOG`, die aus einer Spec auslösbar ist,
 * genau ein Fall — alphabetisch nach Kennung. Mehr als ein Fall je Regel wäre erlaubt, ist aber
 * derzeit nicht nötig.
 */
export const RULE_EVIDENCE: readonly RuleEvidence[] = Object.freeze([
  evidence('above-left-label-requires-measured-body', { kind: 'formation', labels: { aboveLeft: 'ITH' } }, `aboveLeft an der Formation (${VT}).`),
  evidence(
    'above-left-metrics-complete',
    runtime({ kind: 'vehicle-air', bodyVariant: 'fixed-wing-hull', labels: { aboveLeft: 'X', aboveLeftMetrics: { capHeightMm: null } } }),
    `Unvollständiger aboveLeft-Metriksatz; Laufzeitfall (${VT}).`,
  ),
  evidence(
    'above-left-metrics-within-viewbox',
    { kind: 'vehicle-air', bodyVariant: 'raised-hull', labels: { aboveLeft: 'ITH', aboveLeftMetrics: { capHeightMm: 2.5, baselineFromBodyTopMm: 0, anchorFromBodyLeftMm: 100 } } },
    `aboveLeft-Anker rechts außerhalb der Profilbox (${CT}).`,
  ),
  evidence('administrative-level-not-measured', { kind: 'formation', administrativeLevel: 'kreis' }, 'Verwaltungsstufe ohne aufgelöste Funktionsrolle; neu, analog zu validate.test.ts.'),
  evidence('below-right-label-requires-measured-body', { kind: 'formation', labels: { belowRight: 'X' } }, `belowRight an der Formation ohne Profil (${CT}).`),
  evidence(
    'below-right-label-requires-organization',
    { kind: 'vehicle-water', bodyVariant: 'raised-hull', labels: { belowRight: 'X' } },
    'belowRight am angehobenen Wasserfahrzeug (Profil mit Organisationstinte) ohne Organisation. Neu: der Bestand nannte die Kennung nur in einer Negativprüfung (`not.toContain`) in validate.test.ts.',
  ),
  evidence('body-variant-foot-conflict', { kind: 'vehicle-air', bodyVariant: 'raised-hull', designation: 'RTH' }, `Bezeichnung am angehobenen Rumpf (${VT}).`),
  evidence('body-variant-requires-measured-kind', { kind: 'post', bodyVariant: 'foot-band' }, `Fußband an der Stelle (${VT}).`),
  evidence('bottom-center-label-requires-measured-body', { kind: 'vehicle-land', labels: { bottomCenter: 'X' } }, `bottomCenter am Landfahrzeug (${CT}).`),
  evidence(
    'bottom-right-metrics-complete',
    runtime({ kind: 'vehicle-air', bodyVariant: 'raised-hull', labels: { bottomRight: '7', bottomRightMetrics: { capHeightMm: 2.750245 } } }),
    `Unvollständiger bottomRight-Metriksatz; Laufzeitfall (${VT}).`,
  ),
  evidence(
    'bottom-right-metrics-require-bottom-right-label',
    { kind: 'vehicle-air', bodyVariant: 'raised-hull', labels: { bottomRightMetrics: { capHeightMm: 2.750245, baselineFromBodyTopMm: 13.000087, anchorFromBodyLeftMm: 21.99, boxLeftFromBodyLeftMm: 19.24, boxWidthMm: 5.5 } } },
    `bottomRight-Metriken ohne Lauf (${VT}).`,
  ),
  evidence(
    'bottom-right-metrics-require-measured-body',
    { kind: 'vehicle-air', bodyVariant: 'fixed-wing-hull', labels: { bottomRight: '7', bottomRightMetrics: { capHeightMm: 2.750245, baselineFromBodyTopMm: 13.000087, anchorFromBodyLeftMm: 21.99, boxLeftFromBodyLeftMm: 19.24, boxWidthMm: 5.5 } } },
    `bottomRight-Metriken am Flächenflügler (${VT}).`,
  ),
  evidence(
    'bottom-right-metrics-within-body',
    { kind: 'vehicle-air', bodyVariant: 'raised-hull', labels: { bottomRight: '7', bottomRightMetrics: { capHeightMm: 2.750245, baselineFromBodyTopMm: 3, anchorFromBodyLeftMm: 21.99, boxLeftFromBodyLeftMm: 19.24, boxWidthMm: 5.5 } } },
    `bottomRight-Grundlinie außerhalb der Hülle (${VT}).`,
  ),
  evidence('center-anchor-override-requires-measured-trailer', { kind: 'trailer', labels: { center: 'Tauchen', centerAnchorFromBodyLeftMm: 8.23 } }, `Linksanker am nicht vermessenen Anhänger (${VT}).`),
  evidence('center-baseline-not-measured', { kind: 'trailer', labels: { center: 'X', centerBaselineFromBodyBottomMm: 10, centerCapHeightMm: 2.191447 } }, `Nicht vermessene Anhänger-Grundlinie (${VT}).`),
  evidence('center-baseline-override-requires-measured-body', { kind: 'vehicle-air', labels: { center: 'X', centerBaselineFromBodyBottomMm: 6.5 } }, `Grundlinienüberschreibung am Luftfahrzeug (${VT}).`),
  evidence('center-baseline-positive', { kind: 'formation', labels: { center: 'X', centerBaselineFromBodyBottomMm: 0 } }, `Mittige Grundlinie 0 mm (${CT}).`),
  evidence('center-baseline-requires-center-label', { kind: 'vehicle-land', labels: { centerBaselineFromBodyBottomMm: 6.5 } }, `Grundlinie ohne mittigen Lauf (${VT}).`),
  evidence('center-box-margin-non-negative', { kind: 'formation', labels: { center: 'X', centerBoxMarginMm: -0.1 } }, `Negativer Boxrand (${VT}).`),
  evidence('center-box-margin-override-requires-measured-body', { kind: 'vehicle-land', labels: { center: 'X', centerBoxMarginMm: 0.5 } }, `Boxrand am Landfahrzeug (${VT}).`),
  evidence('center-box-margin-requires-center-label', { kind: 'formation', labels: { centerBoxMarginMm: 0.5 } }, `Boxrand ohne mittigen Lauf (${VT}).`),
  evidence('center-box-margin-within-body', { kind: 'formation', labels: { center: 'X', centerBoxMarginMm: 15 } }, `Boxrand breiter als der Körper (${VT}).`),
  evidence(
    'center-cap-height-positive',
    { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation', labels: { center: 'MzB', centerCapHeightMm: 0 } },
    `Versalhöhe 0 am eingesenkten Rumpf (${VT}).`,
  ),
  evidence(
    'center-cap-height-requires-center-label',
    { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation', labels: { centerCapHeightMm: 3.4099 } },
    `Versalhöhe ohne mittigen Lauf (${VT}).`,
  ),
  evidence('center-label-within-body', { kind: 'formation', labels: { center: 'X', centerBaselineFromBodyBottomMm: 100 } }, `Grundlinie weit über der Körperoberkante (${CT}).`),
  evidence('chassis-foot-conflict', { kind: 'vehicle-land', vehicleCategory: 'kfz-kategorie-1', designation: 'MTW 1' }, `Fahrwerk und Bezeichnung zugleich (${VT}).`),
  evidence('circle-12-requires-hilfsorganisation', { kind: 'circle-12' }, `12-mm-Kreis ohne Organisation (${VT}).`),
  evidence('circle-12-requires-organization', { kind: 'circle-12', bodyVariant: 'foot-band' }, `Gebänderter Kreis ohne Organisation (${VT}).`),
  evidence(
    'circle-top-left-anchor-within-viewbox',
    runtime({ kind: 'circle-12', organization: 'hilfsorganisation', labels: { topLeft: 'UHS', topLeftMetrics: { capHeightMm: 2.919225, baselineFromBodyTopMm: 1.000254, anchorFromBodyLeftMm: null } } }),
    `Kreisanker null; Laufzeitfall (${VT}).`,
  ),
  evidence(
    'circle-top-left-baseline-within-viewbox',
    { kind: 'circle-12', bodyVariant: 'raised-gable', organization: 'hilfsorganisation', labels: { topLeft: '50', topLeftMetrics: { capHeightMm: 2.749893, baselineFromBodyTopMm: -6.01, anchorFromBodyLeftMm: -2.974002 } } },
    `Kreisgrundlinie oberhalb der ViewBox (${VT}).`,
  ),
  evidence('circle-top-left-requires-metrics', { kind: 'circle-12', organization: 'hilfsorganisation', labels: { topLeft: 'UHS' } }, `topLeft am Kreis ohne Metriksatz (${VT}).`),
  evidence(
    'colored-circle-top-left-not-measured',
    { kind: 'circle-12', organization: 'zivile-einheiten', bodyMarks: ['spontaneous-helper-collection-arrow'], labels: { topLeft: 'X' } },
    `topLeft am farbigen Kreisvertrag (${CT}).`,
  ),
  evidence('designation-not-blank', { kind: 'formation', designation: '   ' }, `Leere Bezeichnung (${VT}).`),
  evidence('designation-too-wide', { kind: 'formation', designation: 'W'.repeat(30) }, 'Dreißig W sprengen die Fußzone. Neu: Kompositionsregel.', 'composeFromCatalog'),
  evidence('designation-unknown-glyph', { kind: 'formation', designation: 'A☃' }, 'Schneemann (U+2603) fehlt in den Arimo-Metriken. Neu: Kompositionsregel.', 'composeFromCatalog'),
  evidence('foot-band-head-requires-measured-strength', { kind: 'formation', bodyVariant: 'foot-band', strength: 'staffel' }, `Staffel am gebänderten Formationskörper (${VT}).`),
  evidence(
    'function-role-body-mark-mismatch',
    { kind: 'person', organization: 'feuerwehr', strength: 'zug', functionRole: 'fire-service-platoon-commander', bodyMarks: ['care'] },
    'Körpermarke, die die vermessene Fassung nicht erlaubt. Neu gegen die Katalogfassung; validate.test.ts löst die Regel nur mit einer synthetischen Fassung aus.',
    'validateSpec+catalog',
  ),
  evidence(
    'function-role-body-variant-not-measured',
    { kind: 'person', organization: 'feuerwehr', strength: 'zug', functionRole: 'fire-service-platoon-commander', bodyVariant: 'raised-hull' },
    'Körpervariante an einer Funktionsrolle. Feuert auch ohne Kontext; hier gegen die Katalogfassung.',
    'validateSpec+catalog',
  ),
  evidence(
    'function-role-capabilities-not-measured',
    { kind: 'person', organization: 'feuerwehr', strength: 'zug', functionRole: 'fire-service-platoon-commander', capabilities: ['fire-fighting'] },
    'Fähigkeit an einer Funktionsrolle. Feuert auch ohne Kontext; hier gegen die Katalogfassung.',
    'validateSpec+catalog',
  ),
  evidence(
    'function-role-head-mismatch',
    { kind: 'person', organization: 'feuerwehr', functionRole: 'fire-service-platoon-commander' },
    'Zugführer ohne Stärke „zug". Neu gegen die Katalogfassung; validate.test.ts löst die Regel nur mit einer synthetischen Fassung aus.',
    'validateSpec+catalog',
  ),
  evidence(
    'function-role-organization-mismatch',
    { kind: 'person', strength: 'zug', functionRole: 'technical-platoon-commander' },
    'Rolle ohne ihre vermessene Organisation. Neu gegen die Katalogfassung; validate.test.ts löst die Regel nur mit einer synthetischen Fassung aus.',
    'validateSpec+catalog',
  ),
  evidence(
    'function-role-requires-measured-kind',
    { kind: 'building', functionRole: 'fire-service-platoon-commander' },
    `Funktionsrolle am Gebäude (${VT}, dort mit synthetischer Fassung; die Regel feuert auch ohne Kontext).`,
  ),
  evidence(
    'function-role-requires-measured-layout',
    { kind: 'person', functionRole: 'fire-service-platoon-commander', strength: 'zug' },
    `Funktionsrolle ohne aufgelöste Fassung, also ohne Kontext (${VT}). Mit Katalogkontext ist die Fassung immer aufgelöst und vollständig; dann feuert die Regel nicht.`,
  ),
  evidence('head-zone-conflict', { kind: 'formation', strength: 'gruppe', technicalHeadMark: 'single-vertical-bar' }, `Stärke und technische Kopfmarke zugleich (${VT}).`),
  evidence(
    'in-body-ink-requires-in-body-label',
    { kind: 'vehicle-air', bodyVariant: 'raised-hull', labels: { aboveLeft: 'CH-53', surfaceBelowRight: 'BW', inBodyInk: 'schwarz' } },
    `Körpertinte ohne Lauf im Körper (${VT}).`,
  ),
  evidence(
    'inset-hull-fire-fighting-requires-no-labels',
    { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'feuerwehr', bodyMarks: ['fire-fighting'], labels: { center: 'LF' } },
    `Beschriftete Feuerwehrfassung des eingesenkten Rumpfs (${VT}).`,
  ),
  evidence(
    'inset-hull-requires-center-label-only',
    { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation', labels: { center: 'MzB' }, designation: 'MzB' },
    `Fußbezeichnung am eingesenkten Rumpf als ungemessene Zone (${VT}).`,
  ),
  evidence('inset-hull-requires-measured-body-mark', { kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'feuerwehr' }, `Feuerwehrfassung ohne Marke (${VT}).`),
  evidence('inset-hull-requires-measured-organization', { kind: 'vehicle-water', bodyVariant: 'inset-hull' }, `Eingesenkter Rumpf ohne Organisation (${VT}).`),
  evidence('label-not-blank', { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', labels: { topLeftLines: ['GW-San', '  '] } }, `Leere zweite Zeile (${VT}).`),
  evidence('label-too-wide', { kind: 'formation', labels: { center: 'W'.repeat(24) } }, 'Mittiger Lauf breiter als seine Box. Neu: Kompositionsregel.', 'composeFromCatalog'),
  evidence('label-unknown-glyph', { kind: 'formation', labels: { center: '☃' } }, 'Schneemann (U+2603) im mittigen Lauf. Neu: Kompositionsregel.', 'composeFromCatalog'),
  evidence('plain-wheel-pair-chassis-conflict', { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', vehicleCategory: 'kfz-kategorie-1' }, `Fahrwerk am Radpaarkörper (${VT}).`),
  evidence('reduced-house-requires-hilfsorganisation', { kind: 'reduced-house' }, `Reduziertes Haus ohne Organisation (${VT}).`),
  evidence('strength-requires-unit', { kind: 'hazard', strength: 'gruppe' }, `Stärke an einer Gefahr (${VT}).`),
  evidence('surface-label-foot-conflict', { kind: 'vehicle-air', bodyVariant: 'raised-hull', designation: 'A', labels: { surfaceBelowRight: 'B' } }, `Bezeichnung und Oberflächenlauf zugleich (${CT}).`),
  evidence('surface-label-requires-measured-body', { kind: 'formation', labels: { surfaceBelowLeft: 'X' } }, `Oberflächenlauf an der Formation (${VT}).`),
  evidence('surface-left-label-requires-measured-anchor', { kind: 'vehicle-air', bodyVariant: 'raised-hull', labels: { surfaceBelowLeft: 'X' } }, `Linker Oberflächenlauf am Luftfahrzeug (${VT}).`),
  evidence('technical-fill-organization-conflict', runtime({ kind: 'person', organization: 'hilfsorganisation', technicalFill: 'weiss' }), `Technische Füllung und Organisation (${VT}).`),
  evidence('technical-fill-token-invalid', runtime({ kind: 'person', technicalFill: 'white' }), `Unbekannter Farbtoken; Laufzeitfall (${VT}).`),
  evidence('technical-head-mark-not-measured', runtime({ kind: 'formation', technicalHeadMark: 'triple-vertical-bar' }), `Unbekannte Kopfmarke; Laufzeitfall (${VT}).`),
  evidence('technical-head-mark-requires-normal-formation', { kind: 'person', technicalHeadMark: 'single-vertical-bar' }, `Kopfmarke an der Person (${VT}).`),
  evidence(
    'top-left-anchor-within-body',
    runtime({ kind: 'vehicle-land', labels: { topLeft: 'BTKombi', topLeftMetrics: { capHeightMm: 2.191447, baselineFromBodyTopMm: 5.249923, anchorFromBodyLeftMm: null } } }),
    `topLeft-Anker null; Laufzeitfall (${VT}).`,
  ),
  evidence(
    'top-left-baseline-within-body',
    { kind: 'vehicle-land', labels: { topLeft: 'BTKombi', topLeftMetrics: { capHeightMm: 2.191447, baselineFromBodyTopMm: 2, anchorFromBodyLeftMm: 0.51423 } } },
    `topLeft-Grundlinie 2 mm (${VT}).`,
  ),
  evidence(
    'top-left-cap-height-positive',
    { kind: 'vehicle-land', labels: { topLeft: 'BTKombi', topLeftMetrics: { capHeightMm: 0, baselineFromBodyTopMm: 5.249923, anchorFromBodyLeftMm: 0.51423 } } },
    `topLeft-Versalhöhe 0 (${VT}).`,
  ),
  evidence('top-left-label-requires-measured-body', { kind: 'trailer', labels: { topLeft: 'BT' } }, `topLeft am Anhänger (${VT}).`),
  evidence('top-left-lines-exactly-two', runtime({ kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', labels: { topLeftLines: ['GW-San', '50', 'Reserve'] } }), `Drei Zeilen; Laufzeitfall (${VT}).`),
  evidence('top-left-lines-require-measured-body', { kind: 'trailer', labels: { topLeftLines: ['GW-San', '50'] } }, `Zweizeiliger Lauf am Anhänger (${VT}).`),
  evidence(
    'top-left-metrics-complete',
    runtime({ kind: 'vehicle-land', labels: { topLeft: 'BTKombi', topLeftMetrics: { capHeightMm: 2.191447 } } }),
    `Unvollständiger topLeft-Metriksatz; Laufzeitfall (${VT}).`,
  ),
  evidence(
    'top-left-metrics-require-measured-vehicle-land',
    { kind: 'formation', labels: { topLeft: 'BTKombi', topLeftMetrics: { capHeightMm: 2.191447, baselineFromBodyTopMm: 5.249923, anchorFromBodyLeftMm: 0.51423 } } },
    `topLeft-Metriken an der Formation (${VT}).`,
  ),
  evidence(
    'top-left-metrics-require-top-left-label',
    { kind: 'vehicle-land', labels: { topLeftMetrics: { capHeightMm: 2.191447, baselineFromBodyTopMm: 5.249923, anchorFromBodyLeftMm: 0.51423 } } },
    `topLeft-Metriken ohne Lauf (${VT}).`,
  ),
  evidence('top-left-metrics-required-by-profile', { kind: 'vehicle-air', bodyVariant: 'fixed-wing-hull', labels: { topLeft: 'X' } }, `topLeft am Flächenflügler ohne Metriksatz (${CT}).`),
  evidence(
    'top-left-metrics-within-body',
    { kind: 'vehicle-air', bodyVariant: 'fixed-wing-hull', labels: { topLeft: 'X', topLeftMetrics: { capHeightMm: 2.5, baselineFromBodyTopMm: 7, anchorFromBodyLeftMm: 100 } } },
    `topLeft-Anker außerhalb der Hülle (${CT}).`,
  ),
  evidence('vehicle-category-requires-vehicle', { kind: 'formation', vehicleCategory: 'kettenfahrzeug' }, `Fahrwerk an der Formation (${VT}).`),
]);

/**
 * Regeln ohne auslösenden Fall — benannt, nicht still. Jede Lücke sagt, warum keine Spec sie
 * erreicht. Die Liste ist in `rule-evidence.test.ts` festgenagelt; ein Eintrag, der doch einen
 * Fall bekommt, muss hier verschwinden, sonst bricht die Mengengleichheit.
 */
export const RULE_EVIDENCE_GAPS: readonly RuleEvidenceGap[] = Object.freeze([
  Object.freeze({
    rule: 'function-role-label-metrics-required',
    reason:
      'Die Regel prüft die Läufe der Funktionsfassung, nicht die Beschreibung. Alle Fassungen im Katalog sind vollständig und überlappungsfrei; ohne Kontext ist die Fassung nicht aufgelöst, und die Regel wird gar nicht erst erreicht. Auslösbar ist sie nur mit einer synthetischen, fehlerhaften Fassung, wie validate.test.ts sie baut.',
    location: 'packages/core/src/validate.ts (Prüfung der roleRuns); Fall mit synthetischer Fassung in packages/core/src/validate.test.ts',
  }),
  Object.freeze({
    rule: 'function-role-run-too-wide',
    reason:
      'Kompositionsregel über die Läufe der Funktionsfassung. Deren Text stammt aus dem Katalog, nicht aus der Spec, und jede Katalogfassung passt in ihre Box. Keine Spec erreicht die Regel über composeFromCatalog.',
    location: 'packages/core/src/compose.ts (assertTextRunsFit mit Präfix function-role-run)',
  }),
  Object.freeze({
    rule: 'function-role-run-unknown-glyph',
    reason:
      'Wie function-role-run-too-wide: die Läufe kommen aus der Katalogfassung, deren Glyphen alle in den Arimo-Metriken stehen.',
    location: 'packages/core/src/compose.ts (assertTextRunsFit mit Präfix function-role-run)',
  }),
  Object.freeze({
    rule: 'surface-right-label-requires-measured-anchor',
    reason:
      'Verlangt ein Profil mit surfaceLabels ohne rechten Anker. Beide Profile mit surfaceLabels (F.2.7, angehobener 12-mm-Kreis) haben einen rechten Anker; die Regel ist die Symmetrie zur linken für ein künftiges Profil.',
    location: 'packages/core/src/validation-rules.cases.test.ts (it.todo)',
  }),
]);

/** Der Kontext, den `composeFromCatalog` an `validateSpec` übergibt — aus Katalogdaten, nicht erfunden. */
function catalogValidationContext(spec: SymbolSpec): Parameters<typeof validateSpec>[1] {
  const role = spec.functionRole !== undefined ? functionRole(spec.functionRole) : undefined;
  const head = spec.administrativeLevel !== undefined ? administrativeHead(spec.administrativeLevel) : undefined;
  return {
    ...(role !== undefined ? { functionRole: role } : {}),
    ...(head !== undefined ? { administrativeHead: head } : {}),
  };
}

/**
 * Führt einen Fall über seinen Weg aus und liefert **alle** gemeldeten Regelkennungen. Ob die
 * eigene Regel darunter ist, entscheidet der Aufrufer. Bei `'composeFromCatalog'` ist die Liste
 * leer, wenn die Komposition gelingt; ein anderer Fehler als `CompositionError` wird
 * weitergeworfen, denn er wäre ein Befund über den Fall und keine Auslösung.
 */
export function ruleEvidenceTriggers(item: RuleEvidence): readonly string[] {
  switch (item.via) {
    case 'validateSpec':
      return validateSpec(item.spec).map((issue) => issue.rule);
    case 'validateSpec+catalog':
      return validateSpec(item.spec, catalogValidationContext(item.spec)).map((issue) => issue.rule);
    case 'composeFromCatalog':
      try {
        composeFromCatalog(item.spec);
        return [];
      } catch (error) {
        if (error instanceof CompositionError) return error.issues.map((issue) => issue.rule);
        throw error;
      }
  }
}
