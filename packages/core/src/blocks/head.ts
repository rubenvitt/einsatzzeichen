import type { BlockEntry } from '@einsatzzeichen/schema';
import { UNDOCUMENTED_AT_SOURCE } from '../layout/zones.js';
import { babz, block, measured, notMeasured } from './helpers.js';

/**
 * Die Bausteine der Kopfzone: Stärke, Verband, Verwaltungsstufe und technische Kopfmarke.
 *
 * Jeder Fundort zeigt in `core/src/geometry/`, wo die Zeichnung steht. Das Register importiert sie
 * nicht; ob sich die Fundorte zur Laufzeit wirklich zu Geometrie auflösen, prüft
 * `conformance/src/block-register/head.test.ts`. `sourceRefs` stehen nur dort, wo der Fundort selbst
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
 * Vermessen am Körper seit LFH-577 (29.09.2026), siehe `core/src/geometry/unit-groupings.ts` und
 * `docs/decisions/2026-09-29-lfh-577-verband-5-5.md`. Der frühere Befund zu E.1.31
 * (`coverage-manifest.ts`: „5.5.2 trifft die Zahl der Balken, nicht das Maß") verglich die
 * vergrößerte Kapiteldatei mit der Marke am Körper. Dieselbe Abweichung zeigt die Stärke (5.4: r 4
 * gegen 1,5 mm); maßgeblich ist die Marke am Körper. Seit dem Integrationsschritt trägt
 * `SymbolSpec.unitGrouping` den Verband (Port `unitGroupingHead`).
 */
const UNIT_GROUPING_NOTE =
  'Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert. Balken 1,5 × 4 mm, ' +
  'Kopfzone y 1…5 mm über dem Formationskörper. Die Kapiteldatei zeigt die Marke vergrößert ' +
  '(4 × 10 mm); das Verhältnis 1,5/4 ist dasselbe wie bei der Stärke (Durchmesser 3/8).';

const UNIT_GROUPING_III_GAP_AT = 'core/src/geometry/unit-groupings.ts:75–82';

export const UNIT_GROUPING_BLOCKS: readonly BlockEntry[] = Object.freeze([
  block(
    'unit-grouping',
    'verband-i',
    'head',
    measured(
      'core/src/geometry/unit-groupings.ts:52–56',
      `${UNIT_GROUPING_NOTE} Verband I: ein Balken x 15,25…16,75 mm, vermessen an I.1.4, F.1.13, ` +
        'F.1.21 und C.1.6 (Formation, y 1…5) sowie I.5.7 (Person, y 0…4); Kapiteldatei ' +
        '`5.5.1_Bereitschaft (Verband I).svg`.',
      babz('5.5.1', 'I.1.4', 'F.1.13', 'F.1.21', 'C.1.6', 'I.5.7'),
    ),
  ),
  block(
    'unit-grouping',
    'verband-ii',
    'head',
    measured(
      'core/src/geometry/unit-groupings.ts:58–62',
      `${UNIT_GROUPING_NOTE} Verband II: zwei Balken x 11,25…12,75 und 19,25…20,75 mm, vermessen ` +
        'an E.1.31, F.1.1 und F.1.3; Kapiteldatei `5.5.2_Bereitschaft (Verband II).svg`.',
      babz('5.5.2', 'E.1.31', 'F.1.1', 'F.1.3'),
    ),
  ),
  block(
    'unit-grouping',
    'verband-iii',
    'head',
    notMeasured(
      UNIT_GROUPING_III_GAP_AT,
      'Keine vermessene Geometrie. Die Kennung ist belegt durch `5.5.3_Bereitschaft (Verband ' +
        'III).svg`, aber keine der 661 Referenzdateien zeigt drei Balken am Körper. Seit dem ' +
        '2. Oktober 2026 zeichnet der Standardport den Vorschlag abgeleitet ' +
        '(`derive/head-zone.ts`, Ableitungsnotiz an der Zeichnung): die Vereinigung von Verband I ' +
        'und II, also Balken auf x 12, 16 und 20 mm — so wie 5.5.3 in der Kapiteldatei die ' +
        'Vereinigung von 5.5.1 und 5.5.2 ist und der Zug am Körper die von Trupp und Gruppe ' +
        '(x 11/16/21).',
    ),
  ),
]);

// ---------------------------------------------------------------------------------------------
// Verwaltungsstufe (Kapitel 5.7)
// ---------------------------------------------------------------------------------------------

const ADMIN_UNDOCUMENTED =
  UNDOCUMENTED_AT_SOURCE +
  'Die Konstante in `administrative-heads.ts` trägt keinen Kommentar. Den Abschnitt D.3/D.4 nennen ' +
  'die Funktionsfassungen in `function-roles.ts` und die Herkunftsangaben in `derive/head-zone.ts`.';

const ADMIN_GAP_AT = 'core/src/rules/rule-catalog.ts:824–829';
const ADMIN_GAP_REASON =
  'Keine vermessene Geometrie in `ADMINISTRATIVE_HEADS`. Seit dem 2. Oktober 2026 zeichnet der ' +
  'Standardport den Kopf abgeleitet (`derive/head-zone.ts`, Ableitungsnotiz an der Zeichnung): ' +
  'Sternzahl und Teilung aus der Kapiteldatei 5.7.1, 5.7.3 bzw. 5.7.4, am Körper auf 5/6 der ' +
  'Teilung gerückt wie Kreis (D.4.1) und Nationalstaat (D.4.4), Stern verbatim aus dem Kreiskopf.';

export const ADMINISTRATIVE_LEVEL_BLOCKS: readonly BlockEntry[] = Object.freeze([
  block(
    'administrative-level',
    'gemeinde',
    'head',
    notMeasured(ADMIN_GAP_AT, ADMIN_GAP_REASON),
  ),
  block(
    'administrative-level',
    'kreis',
    'head',
    measured('core/src/geometry/administrative-heads.ts:35–39', ADMIN_UNDOCUMENTED),
  ),
  block(
    'administrative-level',
    'bezirk',
    'head',
    notMeasured(ADMIN_GAP_AT, ADMIN_GAP_REASON),
  ),
  block(
    'administrative-level',
    'bundesland',
    'head',
    notMeasured(ADMIN_GAP_AT, ADMIN_GAP_REASON),
  ),
  block(
    'administrative-level',
    'nationalstaat',
    'head',
    measured('core/src/geometry/administrative-heads.ts:41–45', ADMIN_UNDOCUMENTED),
  ),
  block(
    'administrative-level',
    'europaeische-union',
    'head',
    measured('core/src/geometry/administrative-heads.ts:47–55', ADMIN_UNDOCUMENTED),
  ),
]);

// ---------------------------------------------------------------------------------------------
// Technische Kopfmarke
// ---------------------------------------------------------------------------------------------

/**
 * Keine Kombinationsbindung: `compose.ts` löst die Marke unabhängig von anderen Bausteinen auf
 * und setzt sie in die allgemeine Kopfzone, seit dem 2. Oktober 2026 an jedem Grundzeichen mit
 * Kopfzone. `head-zone-conflict` ist eine Zulässigkeitsregel (welche Bausteine zusammen dürfen),
 * keine Bindung der Geometrie an einen anderen Baustein.
 */
export const TECHNICAL_HEAD_MARK_BLOCKS: readonly BlockEntry[] = Object.freeze([
  block(
    'technical-head-mark',
    'single-vertical-bar',
    'head',
    measured(
      'core/src/geometry/technical-head-marks.ts:7–18',
      UNDOCUMENTED_AT_SOURCE +
        'Die Konstante trägt keinen Kommentar. Belege nennt nur `derive/head-zone.ts:230`, und zwar ' +
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
