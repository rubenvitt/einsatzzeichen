import type { BlockCombinationBinding, BlockEntry } from '@einsatzzeichen/schema';
import { UNDOCUMENTED_AT_SOURCE } from '../layout/zones.js';
import { babz, block, measured, notMeasured } from './helpers.js';

/**
 * Die Bausteine der Kopfzone: Stärke, Verband, Verwaltungsstufe und technische Kopfmarke.
 *
 * Jeder Fundort zeigt in `core/src/geometry/`, wo die Zeichnung steht. Das Register importiert sie
 * nicht; ob sich die Fundorte zur Laufzeit wirklich zu Geometrie auflösen, prüft
 * `catalog/src/block-register/head.test.ts`. `sourceRefs` stehen nur dort, wo der Fundort selbst
 * einen Abschnitt der Referenz nennt.
 */

// ---------------------------------------------------------------------------------------------
// Stärke (Kapitel 5.4)
// ---------------------------------------------------------------------------------------------

const STRENGTH_RADIUS_NOTE = 'Radius jeder Marke 1,5 mm, vermessen an allen elf Referenzdateien der Stärkeangaben.';

export const STRENGTH_BLOCKS: readonly BlockEntry[] = Object.freeze([
  block(
    'strength',
    'trupp',
    'head',
    measured(
      'core/src/geometry/strengths.ts:3–31',
      `${STRENGTH_RADIUS_NOTE} Waagerechte Reihe, nur der mittlere Platz: vermessen an C.1.7/C.1.13/C.1.14 (trupp: nur die Mitte).`,
      babz('C.1.7', 'C.1.13', 'C.1.14'),
    ),
  ),
  block(
    'strength',
    'staffel',
    'head',
    measured(
      'core/src/geometry/strengths.ts:3–16',
      `${STRENGTH_RADIUS_NOTE} Zwei gestapelte Marken: Abstand vermessen an C.1.1/C.1.8: 1,5 und 5,5.`,
      babz('C.1.1', 'C.1.8'),
    ),
  ),
  block(
    'strength',
    'gruppe',
    'head',
    measured(
      'core/src/geometry/strengths.ts:3–31',
      `${STRENGTH_RADIUS_NOTE} Waagerechte Reihe, die äußeren zwei Plätze: vermessen an C.1.2/C.1.9 (gruppe: äußere zwei).`,
      babz('C.1.2', 'C.1.9'),
    ),
  ),
  block(
    'strength',
    'zug',
    'head',
    measured(
      'core/src/geometry/strengths.ts:3–31',
      `${STRENGTH_RADIUS_NOTE} Waagerechte Reihe, alle drei Plätze: vermessen an C.1.3/C.1.11/D.3.7/E.1.18 (zug: alle drei).`,
      babz('C.1.3', 'C.1.11', 'D.3.7', 'E.1.18'),
    ),
  ),
]);

// ---------------------------------------------------------------------------------------------
// Verband (Kapitel 5.5)
// ---------------------------------------------------------------------------------------------

/**
 * Die Lücke steht schon im Regelkatalog (`RULE_DIMENSION_GAPS`, Dimension `unit-grouping`). Die
 * zwei senkrechten Balken aus `core/src/geometry/technical-head-marks.ts` sind **kein** Verband: der
 * Befund zu E.1.31 in `coverage-manifest.ts` hält fest, dass „5.5.2_Bereitschaft (Verband II)"
 * die Zahl der Balken trifft, nicht das Maß.
 */
const UNIT_GROUPING_GAP_AT = 'core/src/rules/rule-catalog.ts:916–921';

function unitGroupingReason(file: string): string {
  return (
    `Keine Geometrie. Die Kennung ist belegt durch die Referenzdatei \`${file}\`, vermessen ist ` +
    'sie nicht, und ein Feld in `SymbolSpec` fehlt ebenfalls (LFH-577). Der Regelkatalog: ' +
    '„Keine Regel und kein Feld in `SymbolSpec`: Verbände oberhalb des Zuges sind im Motor nicht ' +
    'darstellbar." Die Balkenmarke `double-vertical-bar` ist ausdrücklich kein Verband: sie trifft ' +
    'die Zahl der Balken von 5.5.2, nicht das Maß (`coverage-manifest.ts`, Befund zu E.1.31).'
  );
}

export const UNIT_GROUPING_BLOCKS: readonly BlockEntry[] = Object.freeze([
  block(
    'unit-grouping',
    'verband-i',
    'head',
    notMeasured(UNIT_GROUPING_GAP_AT, unitGroupingReason('5.5.1_Bereitschaft (Verband I).svg')),
  ),
  block(
    'unit-grouping',
    'verband-ii',
    'head',
    notMeasured(UNIT_GROUPING_GAP_AT, unitGroupingReason('5.5.2_Bereitschaft (Verband II).svg')),
  ),
  block(
    'unit-grouping',
    'verband-iii',
    'head',
    notMeasured(UNIT_GROUPING_GAP_AT, unitGroupingReason('5.5.3_Bereitschaft (Verband III).svg')),
  ),
]);

// ---------------------------------------------------------------------------------------------
// Verwaltungsstufe (Kapitel 5.7)
// ---------------------------------------------------------------------------------------------

/**
 * Die Regel, die die Verwaltungsstufe an die Funktionsfassung bindet. Sie steht in `validate.ts`
 * und im Regelkatalog; der Bereich schließt Kommentar und Kennung ein.
 */
const ADMIN_BINDING_RULE = 'administrative-level-not-measured';
const ADMIN_BINDING_AT = 'core/src/validate.ts:556–569';

/**
 * Benannte Ausnahme für die drei vermessenen Stufen. Hier ist die Bindung an die Funktionsfassung
 * nachweisbar: der Kopf liegt vor, und trotzdem lehnt die Regel die Stufe ohne aufgelöste
 * Funktionsfassung ab.
 */
const ADMIN_BINDING_MEASURED: BlockCombinationBinding = Object.freeze({
  ruleId: ADMIN_BINDING_RULE,
  definedAt: ADMIN_BINDING_AT,
  reason:
    'Der Verwaltungskopf wird nur zusammen mit einer exakt aufgelösten Funktionsfassung gesetzt. ' +
    '`compose.ts:1015–1024` platziert ihn nur, wenn `roleDefinition` vorliegt, und zwar an deren ' +
    '`layout.headTopMm`, also nicht über die allgemeine Kopfzone. `validate.ts` lehnt die Stufe ' +
    'ohne aufgelöste Funktionsfassung mit dieser Regel ab, obwohl der Kopf vermessen ist. Ohne ' +
    'Funktionsfassung ist der Baustein heute nicht darstellbar.',
});

/**
 * Für die drei unvermessenen Stufen ist die Bindung **leer**: dieselbe Regel lehnt sie schon am
 * fehlenden Kopf ab, mit oder ohne Funktionsfassung. Sie wird trotzdem geführt, weil die Bedingung
 * im Motor für alle sechs Stufen dieselbe ist und eine Vermessung die Bindung sofort wirksam machte.
 */
const ADMIN_BINDING_NOT_MEASURED: BlockCombinationBinding = Object.freeze({
  ruleId: ADMIN_BINDING_RULE,
  definedAt: ADMIN_BINDING_AT,
  reason:
    'Die Bedingung der Regel gilt für alle sechs Stufen gleich: Kopf **und** aufgelöste ' +
    'Funktionsfassung. Für diese Stufe fehlt der Kopf, die Regel lehnt sie deshalb mit oder ohne ' +
    'Funktionsfassung ab; die Bindung ist hier nicht nachweisbar, sondern nur vorgezeichnet. Wird ' +
    'die Stufe vermessen, greift sie wie bei Kreis, Nationalstaat und Europäischer Union.',
});

const ADMIN_UNDOCUMENTED =
  UNDOCUMENTED_AT_SOURCE +
  'Die Konstante in `administrative-heads.ts` trägt keinen Kommentar. Den Abschnitt D.3/D.4 nennen ' +
  'erst `validate.ts:556–558` und die Regel `administrative-level-not-measured`.';

const ADMIN_GAP_AT = 'core/src/rules/rule-catalog.ts:898–903';
const ADMIN_GAP_REASON =
  'Keine Geometrie in `ADMINISTRATIVE_HEADS`. Der Regelkatalog: „Eine Regel, aber nur drei der ' +
  'sechs Stufen belegt (D.3/D.4). Gemeinde, Bezirk und Bundesland lehnt der Motor pauschal ab, ' +
  'statt eine Regel für sie zu führen."';

export const ADMINISTRATIVE_LEVEL_BLOCKS: readonly BlockEntry[] = Object.freeze([
  block(
    'administrative-level',
    'gemeinde',
    'head',
    notMeasured(ADMIN_GAP_AT, ADMIN_GAP_REASON),
    ADMIN_BINDING_NOT_MEASURED,
  ),
  block(
    'administrative-level',
    'kreis',
    'head',
    measured('core/src/geometry/administrative-heads.ts:35–39', ADMIN_UNDOCUMENTED),
    ADMIN_BINDING_MEASURED,
  ),
  block(
    'administrative-level',
    'bezirk',
    'head',
    notMeasured(ADMIN_GAP_AT, ADMIN_GAP_REASON),
    ADMIN_BINDING_NOT_MEASURED,
  ),
  block(
    'administrative-level',
    'bundesland',
    'head',
    notMeasured(ADMIN_GAP_AT, ADMIN_GAP_REASON),
    ADMIN_BINDING_NOT_MEASURED,
  ),
  block(
    'administrative-level',
    'nationalstaat',
    'head',
    measured('core/src/geometry/administrative-heads.ts:41–45', ADMIN_UNDOCUMENTED),
    ADMIN_BINDING_MEASURED,
  ),
  block(
    'administrative-level',
    'europaeische-union',
    'head',
    measured('core/src/geometry/administrative-heads.ts:47–55', ADMIN_UNDOCUMENTED),
    ADMIN_BINDING_MEASURED,
  ),
]);

// ---------------------------------------------------------------------------------------------
// Technische Kopfmarke
// ---------------------------------------------------------------------------------------------

/**
 * Keine Kombinationsbindung: `compose.ts` löst die Marke unabhängig von anderen Bausteinen auf
 * und setzt sie in die allgemeine Kopfzone. `technical-head-mark-requires-normal-formation` und
 * `head-zone-conflict` sind Zulässigkeitsregeln (welche Bausteine zusammen dürfen), keine Bindung
 * der Geometrie an einen anderen Baustein.
 */
export const TECHNICAL_HEAD_MARK_BLOCKS: readonly BlockEntry[] = Object.freeze([
  block(
    'technical-head-mark',
    'single-vertical-bar',
    'head',
    measured(
      'core/src/geometry/technical-head-marks.ts:7–18',
      UNDOCUMENTED_AT_SOURCE +
        'Die Konstante trägt keinen Kommentar. Belege nennt nur `validate.ts:580–582`, und zwar ' +
        'für die technische Kopfmarke als Ganzes (F.1.1, F.1.13, F.1.21, E.1.31, I.1.4), nicht je Wert.',
    ),
  ),
  block(
    'technical-head-mark',
    'double-vertical-bar',
    'head',
    measured(
      'core/src/geometry/technical-head-marks.ts:20–38',
      'Zwei senkrechte Balken 1,5 × 4 mm mit den Mittelachsen x 12 und 20 mm. Maße an der ' +
        'Referenz abgelesen, Geometrie eigenständig konstruiert: E.1.31 führt die Balken bei ' +
        'x 11,25…12,75 und 19,25…20,75 mm, y 1…5 mm; dieselben Balken stehen in F.1.1 und F.1.3. ' +
        'Die Marke trägt bewusst keinen Stärkebegriff.',
      babz('E.1.31', 'F.1.1', 'F.1.3'),
    ),
  ),
]);
