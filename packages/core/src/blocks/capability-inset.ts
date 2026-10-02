import type {
  BodyMarkRenditionId,
  BodyVariantId,
  CapabilityId,
  CapabilityInsetForm,
  CapabilityInsetRule,
  CapabilityInsetTreatment,
  GrammarEvidence,
  SymbolKind,
} from '@einsatzzeichen/schema';

/**
 * Kapitel-4-Piktogramme im Körper (LFH-587): wie die Referenz ein Piktogramm in einen Körper
 * setzt, gemessen an allen Körperfassungen des Bestands und als Daten geführt.
 *
 * **Die Frage.** Die 92 Einzeldarstellungen aus Kapitel 4 stehen deckungsgleich mit der Referenz
 * auf der vollen 32 × 32-mm-Fläche. Der Formationskörper ist 30 × 20 mm groß, und `compose()` setzt
 * ein Piktogramm aus `capabilities` unskaliert ein. 65 der 92 ragen dabei über den Körper hinaus.
 * Gefragt war eine Regel für das Innenfeld: Skalierung, Umformung oder eigene Innenfeld-Fassung,
 * gemessen und nicht angenommen.
 *
 * **Die Messung.** Der Bestand kennt 77 Fassungen im Körper, von 28 Fähigkeiten an 15 Körperfassungen,
 * alle über `bodyMarks` gezeichnet und in Anhang C, D, F, G, H und I an der Referenz abgelesen.
 * Acht davon sind zweite Fassungen desselben Paars (`rendition`, LFH-786): Anhang C zeichnet
 * dieselbe Fähigkeit am selben Landfahrzeug in Haupt- und Alternativdarstellung verschieden.
 * Jede wird mit `measureCapabilityInset()` gegen ihre Einzeldarstellung vermessen;
 * `conformance/src/capability-inset-fixtures.test.ts` rechnet die Tabelle unten aus dem Motor nach.
 *
 * **Das Ergebnis.** Die Referenz setzt kein Piktogramm unverändert ein und skaliert keines mit
 * einem gemeinsamen Faktor. Jede Körperfassung ist eine eigene Zeichnung, in drei Arten:
 * randbündig umgeformt (`flush`, 28), annähernd gleichmäßig verkleinert (`reduced`, 44) oder
 * frei umgeformt (`reshaped`, 5). Gemeinsam ist allen nur die
 * Strichstärke 0,5 mm. Die Regel lautet deshalb: **eigene Innenfeld-Fassung je Paar aus Fähigkeit
 * und Körperform**, so wie `bodyMarks` sie heute schon führt. Was für Paare ohne Fassung gilt, steht in
 * `CAPABILITY_INSET_RULE.unmeasuredPairs`; die Entscheidung steht in
 * `docs/decisions/2026-09-29-lfh-587-kapitel-4-piktogramme-im-innenfeld.md`.
 *
 * Von der Entscheidung vom 29. September 2026 (LFH-787, „A, wo die Referenz spricht; B, wo sie
 * schweigt“) bis zum 2. Oktober 2026 lehnte `validateSpec` die Boxfassung in zwei Fällen ab
 * (`capabilities-pictogram-has-measured-rendition`, `capabilities-pictogram-overflows-body`). Seit
 * „ableiten statt ablehnen“ zeichnet `compose()` beide Fälle (`derive/capabilities.ts`): in der
 * vermessenen Fassung (`capabilityInsetForm`) bzw. unskaliert, wo `CAPABILITY_UNSCALED_FIT` es
 * belegt, sonst ins Innenfeld eingepasst.
 */

function source(definedAt: string, note: string): GrammarEvidence {
  return { definedAt, note };
}

function asset(file: `${string}.svg`, note: string): GrammarEvidence {
  return { asset: file, note };
}

function form(
  capability: CapabilityId,
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
  treatment: CapabilityInsetTreatment,
  scaleX: readonly [number, number],
  scaleY: readonly [number, number],
  fixtures: readonly string[],
  exceptions: readonly string[] = [],
  rendition?: BodyMarkRenditionId,
): CapabilityInsetForm {
  return Object.freeze({
    capability,
    kind,
    ...(variant === undefined ? {} : { variant }),
    ...(rendition === undefined ? {} : { rendition }),
    treatment,
    scaleX: Object.freeze({ min: scaleX[0], max: scaleX[1] }),
    scaleY: Object.freeze({ min: scaleY[0], max: scaleY[1] }),
    fixtures: Object.freeze([...fixtures]),
    exceptions: Object.freeze([...exceptions]),
  });
}

/**
 * Jede vermessene Körperfassung eines Kapitel-4-Piktogramms, sortiert nach Fähigkeit und
 * Körperfassung. `fixtures` sind die Fixtures, an denen die Fassung so gemessen ist, einfach wie
 * in Kombination; `exceptions` die benannten Kombinationsausnahmen aus LFH-567, in denen dieselbe
 * Marke eigens gezeichnet ist (F.1.13 Zelt als Dach, F.1.22 Ring unter dem Zelt).
 *
 * Die Faktoren sind Spannen, weil zwei Fassungen ihre Höhe anpassen: `G.3.5`
 * rückt die Betriebsstoffmarke für den unteren Lauf zusammen, `I.2.1` bis `I.2.3` die
 * Wasserrettungsmarke je nach Fahrzeugkategorie. Die Breite bleibt in beiden Fällen gleich.
 *
 * `rendition` steht an einer zweiten Fassung desselben Paars (LFH-786, `bodyMarkRenditions`): sie
 * ist eine eigene Zeichnung und zählt deshalb als eigene Zeile, nicht als Spanne der Grundfassung.
 */
export const CAPABILITY_INSET_FORMS: readonly CapabilityInsetForm[] = Object.freeze([
  form('care', 'circle-12', undefined, 'reshaped', [0.53, 0.53], [0.84, 0.84], ['F.3.13']),
  form('care', 'circle-12', 'raised-gable', 'reshaped', [0.53, 0.53], [0.84, 0.84], ['F.3.14']),
  form('care', 'formation', undefined, 'flush', [1, 1], [0.8, 0.8], ['F.1.4', 'F.1.18', 'F.1.19', 'F.1.20', 'F.1.22'], ['F.1.13']),
  form('care', 'formation', 'foot-band', 'flush', [1, 1], [0.68, 0.68], ['F.1.3', 'F.1.17']),
  form('care', 'person', undefined, 'reshaped', [0.43, 0.43], [0.26, 0.26], ['D.3.10', 'D.3.11', 'D.3.12']),
  form('care', 'trailer', undefined, 'flush', [0.9, 0.9], [0.72, 0.72], ['F.2.15']),
  form('care', 'vehicle-land', undefined, 'flush', [1, 1], [0.72, 0.72], ['F.2.10', 'F.2.11', 'F.2.12', 'F.2.16']),
  form('care', 'vehicle-land', 'foot-band', 'flush', [1, 1], [0.62, 0.62], ['F.2.13', 'F.2.14', 'F.2.17']),
  form('catering', 'circle-12', 'foot-band', 'reduced', [0.42, 0.42], [0.42, 0.42], ['G.3.1']),
  form('catering', 'formation', 'foot-band', 'reduced', [0.42, 0.42], [0.42, 0.42], ['G.1.2', 'G.1.4', 'G.5', 'F.1.17']),
  form('cbrn-detection', 'formation', undefined, 'flush', [1, 1], [0.9, 0.9], ['C.1.7']),
  form('cbrn-detection', 'vehicle-land', undefined, 'reduced', [0.46, 0.46], [0.46, 0.46], ['C.2.24']),
  form('cbrn-protection', 'formation', undefined, 'flush', [1.22, 1.22], [0.9, 0.9], ['F.1.2']),
  form('cbrn-protection', 'vehicle-land', undefined, 'reduced', [0.56, 0.56], [0.46, 0.46], ['C.2.20']),
  form('cbrn-protection', 'vehicle-land', undefined, 'reduced', [0.7, 0.7], [0.55, 0.55], ['C.2.20#alternative'], [], 'centered-large-tongs'),
  form('crane-lifting', 'vehicle-land', undefined, 'reduced', [0.41, 0.41], [0.47, 0.47], ['C.2.27']),
  form('crane-lifting', 'vehicle-land', undefined, 'reduced', [0.46, 0.46], [0.47, 0.47], ['C.2.27#alternative'], [], 'shifted-left-7mm-jib-5mm'),
  form('decontamination', 'formation', undefined, 'reduced', [0.7, 0.7], [0.6, 0.6], ['C.1.8']),
  form('decontamination', 'vehicle-land', undefined, 'reduced', [0.56, 0.56], [0.47, 0.47], ['C.2.25']),
  form('decontamination', 'vehicle-land', undefined, 'reduced', [0.7, 0.7], [0.56, 0.56], ['C.2.25#alternative'], [], 'centered-large-tongs'),
  form('drinking-water', 'formation', 'foot-band', 'reduced', [0.68, 0.68], [0.64, 0.64], ['G.2']),
  form('drinking-water', 'vehicle-land', 'foot-band', 'reduced', [0.39, 0.39], [0.45, 0.45], ['F.2.17']),
  form('fire-fighting', 'formation', undefined, 'flush', [1.03, 1.03], [1, 1], ['C.1.1', 'C.1.2', 'C.1.3']),
  form('fire-fighting', 'person', undefined, 'flush', [0.9, 0.9], [0.4, 0.4], ['D.3.7']),
  form('fire-fighting', 'trailer', undefined, 'flush', [0.93, 0.93], [1, 1], ['C.2.29']),
  form('fire-fighting', 'vehicle-land', undefined, 'flush', [1.03, 1.03], [1, 1], ['C.2.4', 'C.2.5', 'C.2.6', 'C.2.7', 'C.2.8', 'C.2.9', 'C.2.10', 'C.2.11', 'C.2.12', 'C.2.13']),
  form('fire-fighting', 'vehicle-land', 'inverted-hull-track', 'flush', [1.03, 1.03], [0.98, 0.98], ['C.2.31']),
  form('fire-fighting', 'vehicle-water', 'inset-hull', 'reshaped', [0.95, 0.95], [0.54, 0.54], ['I.3.11']),
  form('fuels-consumables', 'circle-12', 'foot-band', 'reduced', [0.49, 0.49], [0.42, 0.46], ['G.3.3', 'G.3.5']),
  form('fuels-consumables', 'formation', 'foot-band', 'reduced', [0.49, 0.49], [0.46, 0.46], ['G.1', 'G.1.3']),
  form('hospital', 'reduced-house', undefined, 'flush', [1, 1], [0.73, 0.73], ['F.3.16']),
  form('intensive-care', 'formation', undefined, 'flush', [1.07, 1.07], [0.71, 0.71], ['F.1.10', 'F.1.11#alternative', 'F.1.12#alternative', 'F.1.15#alternative']),
  form('intensive-care', 'vehicle-land', 'plain-wheel-pair', 'flush', [1.07, 1.07], [0.64, 0.64], ['F.2.3#alternative', 'F.2.5#alternative']),
  form('lifting-clearing', 'vehicle-land', undefined, 'reduced', [0.57, 0.57], [0.48, 0.48], ['C.2.28']),
  form('lifting-clearing', 'vehicle-land', undefined, 'reduced', [0.57, 0.57], [0.48, 0.48], ['C.2.28#alternative'], [], 'shifted-left-4mm'),
  form('maintenance', 'circle-12', 'foot-band', 'reduced', [0.6, 0.6], [0.5, 0.5], ['G.3.4']),
  form('maintenance', 'formation', 'foot-band', 'reduced', [0.6, 0.6], [0.5, 0.5], ['G.1.1', 'G.1.5', 'G.7']),
  form('maintenance', 'trailer', 'foot-band', 'reduced', [0.6, 0.6], [0.5, 0.5], ['G.2.2']),
  form('maintenance', 'vehicle-land', 'foot-band', 'reduced', [0.6, 0.6], [0.5, 0.5], ['G.2.1']),
  form('meal-preparation', 'circle-12', 'foot-band', 'reduced', [0.47, 0.47], [0.44, 0.44], ['G.3.2']),
  form('meal-preparation', 'formation', 'foot-band', 'reduced', [0.47, 0.47], [0.44, 0.44], ['G.6']),
  form('meal-preparation', 'trailer', 'foot-band', 'reduced', [0.47, 0.47], [0.44, 0.44], ['G.2.3']),
  form('meal-preparation', 'vehicle-land', 'foot-band', 'reduced', [0.3, 0.3], [0.31, 0.31], ['F.2.13']),
  form('medical-service', 'circle-12', undefined, 'flush', [0.86, 0.86], [0.86, 0.86], ['F.3.3', 'F.3.4']),
  form('medical-service', 'circle-12', 'raised-gable', 'flush', [0.86, 0.86], [0.86, 0.86], ['F.3.5']),
  form('medical-service', 'formation', undefined, 'flush', [1.07, 1.07], [0.71, 0.71], ['D.1.9', 'D.1.9#alternative', 'F.1.4', 'F.1.5', 'F.1.6', 'F.1.9', 'F.1.11', 'F.1.12', 'F.1.14']),
  form('medical-service', 'person', undefined, 'flush', [0.93, 0.93], [0.75, 0.75], ['D.3.9', 'D.3.10']),
  form('medical-service', 'trailer', undefined, 'flush', [0.96, 0.96], [0.64, 0.64], ['F.2.9']),
  form('medical-service', 'vehicle-land', 'plain-wheel-pair', 'flush', [1.07, 1.07], [0.64, 0.64], ['F.2.1', 'F.2.2', 'F.2.3', 'F.2.4', 'F.2.5', 'F.2.8']),
  form('patient-transport', 'formation', undefined, 'flush', [1.07, 1.07], [0.71, 0.71], ['F.1.8', 'F.1.12#alternative'], ['F.1.22']),
  form('patient-transport', 'vehicle-land', 'plain-wheel-pair', 'flush', [1.07, 1.07], [0.64, 0.64], ['F.2.1#alternative', 'F.2.2#alternative', 'F.2.3#alternative', 'F.2.5#alternative']),
  form('physician', 'circle-12', undefined, 'flush', [0.86, 0.86], [0.86, 0.86], ['F.3.2', 'F.3.4']),
  form('physician', 'circle-12', 'raised-gable', 'flush', [0.86, 0.86], [0.86, 0.86], ['F.3.5']),
  form('physician', 'formation', undefined, 'flush', [1.07, 1.07], [0.71, 0.71], ['F.1.1', 'F.1.7', 'F.1.12#alternative', 'F.1.13', 'F.1.15', 'F.1.15#alternative']),
  form('physician', 'vehicle-air', 'raised-hull', 'flush', [0.95, 0.95], [0.54, 0.54], ['F.2.6', 'F.2.7']),
  form('physician', 'vehicle-land', 'plain-wheel-pair', 'flush', [1.07, 1.07], [0.64, 0.64], ['F.2.4#alternative', 'F.2.5#alternative']),
  form('power-supply', 'formation', 'foot-band', 'reduced', [0.41, 0.41], [0.41, 0.41], ['G.4']),
  form('power-supply', 'trailer', 'foot-band', 'reduced', [0.42, 0.42], [0.37, 0.37], ['C.2.30']),
  form('rescue-aerial-ladder', 'vehicle-land', undefined, 'reduced', [0.51, 0.51], [0.5, 0.5], ['C.2.14', 'C.2.15', 'C.2.16']),
  form('rescue-aerial-ladder', 'vehicle-land', undefined, 'reduced', [0.51, 0.51], [0.5, 0.5], ['C.2.14#alternative', 'C.2.15#alternative'], [], 'shifted-right-6.5mm'),
  form('rescue-aerial-ladder', 'vehicle-land', undefined, 'reduced', [0.51, 0.51], [0.46, 0.46], ['C.2.16#alternative'], [], 'shifted-right-6.5mm-ladder-raised-1mm'),
  form('rescue-articulated-boom', 'vehicle-land', undefined, 'reduced', [0.55, 0.55], [0.5, 0.5], ['C.2.17']),
  form('rescue-articulated-boom', 'vehicle-land', undefined, 'reduced', [0.55, 0.55], [0.5, 0.5], ['C.2.17#alternative'], [], 'shifted-left-1mm'),
  form('technical-assistance', 'formation', undefined, 'reduced', [0.9, 0.9], [1.25, 1.25], ['C.1.4']),
  form('technical-assistance', 'vehicle-land', undefined, 'reduced', [0.9, 0.9], [1.25, 1.25], ['C.2.18']),
  form('temporary-accommodation-resting', 'formation', undefined, 'reduced', [0.36, 0.36], [0.38, 0.38], ['F.1.19']),
  form('temporary-accommodation-resting', 'formation', 'foot-band', 'reduced', [0.36, 0.36], [0.34, 0.34], ['F.1.3']),
  form('temporary-accommodation-resting', 'reduced-house', undefined, 'reduced', [0.71, 0.71], [0.75, 0.75], ['F.3.15']),
  form('transport', 'vehicle-land', undefined, 'reduced', [0.39, 0.39], [0.39, 0.39], ['C.2.23', 'C.2.23#alternative']),
  form('veterinary', 'formation', undefined, 'reduced', [0.64, 0.64], [0.58, 0.58], ['H.1']),
  form('waste-disposal', 'formation', 'foot-band', 'reduced', [0.67, 0.67], [0.68, 0.68], ['G.8']),
  form('water-conveyance', 'formation', 'foot-band', 'reshaped', [0.92, 0.92], [0.29, 0.29], ['G.3']),
  form('water-conveyance', 'vehicle-land', undefined, 'reduced', [0.92, 0.92], [0.64, 0.64], ['C.2.26']),
  form('water-conveyance', 'vehicle-land', undefined, 'reduced', [0.92, 0.92], [0.75, 0.75], ['C.2.26#alternative'], [], 'raised-wave-3mm-arrow-3mm'),
  form('water-rescue', 'formation', undefined, 'reduced', [0.36, 0.36], [0.44, 0.44], ['I.1.9', 'I.1.10', 'I.1.11', 'I.1.12']),
  form('water-rescue', 'vehicle-land', undefined, 'reduced', [0.36, 0.36], [0.37, 0.46], ['I.2.1', 'I.2.2', 'I.2.3']),
  form('watercraft-operations', 'formation', undefined, 'reduced', [0.93, 0.93], [0.83, 0.83], ['I.1.9#alternative']),
]);

/**
 * Die unskalierte Einsetzbarkeit der 92 Einzeldarstellungen: welche Kapitel-4-Piktogramme das
 * Clipping-Gate (`checkClipping`) ohne Befund in den Körper einer Körperform setzt, wie `compose()`
 * sie heute über `capabilities` einsetzt.
 *
 * Geführt sind die acht Körperformen mit Flächenmodell (`CLIPPING_BODY_KINDS` in
 * `conformance/src/pictograms/gate.test.ts`). Für die übrigen elf ist das Gate nicht auswertbar,
 * weil ihr Körper ein Pfad oder ein offener Polyzug ist; das ist keine Aussage, dass nichts passt.
 * Alle aufgeführten Piktogramme sind Hauptdarstellungen: keine der sieben Alternativen passt in
 * irgendeinen der acht Körper.
 */
export interface CapabilityUnscaledFit {
  readonly kind: SymbolKind;
  readonly capabilities: readonly CapabilityId[];
}

function fit(kind: SymbolKind, capabilities: readonly CapabilityId[]): CapabilityUnscaledFit {
  return Object.freeze({ kind, capabilities: Object.freeze([...capabilities]) });
}

export const CAPABILITY_UNSCALED_FIT: readonly CapabilityUnscaledFit[] = Object.freeze([
  fit('formation', [
    'temporary-accommodation-resting', 'fire-fighting', 'service-water', 'foam-agent',
    'solid-extinguishing-agent', 'gaseous-extinguishing-agent', 'reconnaissance',
    'biological-location', 'technical-location', 'recovery', 'water-hazard-control',
    'remote-manipulation', 'chainsaw', 'mechanized-clearing', 'technical-assistance',
    'overcoming-height-differences', 'loudspeaker-warning', 'water-conveyance', 'water-retention',
    'load-pulling', 'bridge', 'waste-disposal', 'maintenance', 'toilet-facility', 'drinking-water',
    'information-communications', 'slaughter-culling',
  ]),
  fit('person', ['foam-agent', 'solid-extinguishing-agent', 'gaseous-extinguishing-agent']),
  fit('post', [
    'foam-agent', 'solid-extinguishing-agent', 'gaseous-extinguishing-agent', 'blasting',
    'water-conveyance', 'waste-disposal', 'toilet-facility',
  ]),
  fit('building', [
    'service-water', 'foam-agent', 'solid-extinguishing-agent', 'gaseous-extinguishing-agent',
    'recovery', 'chainsaw', 'mechanized-clearing', 'technical-assistance', 'water-conveyance',
    'load-pulling', 'toilet-facility', 'drinking-water', 'information-communications',
    'slaughter-culling',
  ]),
  fit('container', [
    'cbrn-protection', 'decontamination', 'foam-agent', 'solid-extinguishing-agent',
    'gaseous-extinguishing-agent', 'reconnaissance', 'explosive-ordnance-clearance', 'blasting',
    'securing', 'water-conveyance', 'container-resource', 'temporary-bridge-construction',
    'waste-disposal', 'toilet-facility', 'catering', 'rapid-deployment-tent',
  ]),
  fit('measure', []),
  fit('hazard', []),
  fit('point', ['solid-extinguishing-agent', 'gaseous-extinguishing-agent']),
]);

const GATE = 'conformance/src/capability-inset-fixtures.test.ts';

export const CAPABILITY_INSET_RULE: CapabilityInsetRule = Object.freeze({
  strokeWidthKept: {
    status: 'evidenced',
    value: 'holds',
    evidence: [
      source(
        GATE,
        'Jeder Strich jeder der 77 Körperfassungen ist 0,5 mm breit, auch in C.1.7 und C.1.8, an denen LFH-587 dieselbe Beobachtung nannte. Die Fassung wird kleiner, der Strich nicht.',
      ),
      asset(
        'C.2.18_Rüstwagen.svg',
        'Die Einzeldarstellung 4.7.18 zeichnet als einzige der betroffenen Fähigkeiten mit 0,4 mm; ihre Körperfassung im Rüstwagen zeichnet mit 0,5 mm. Die Körperfassung behält also nicht die Strichstärke der Einzeldarstellung, sondern die 0,5 mm aller übrigen.',
      ),
    ],
    remaining:
      'Die Stromversorgung in G.4 zeichnet im Körper nur Flächen und keinen Strich; in C.2.30 zeichnet dieselbe Fähigkeit mit 0,5-mm-Strichen.',
  },
  commonScale: {
    status: 'evidenced',
    value: 'refuted',
    evidence: [
      source(
        GATE,
        'Die Breitenfaktoren der verkleinerten Fassungen reichen von 0,30 (Mahlzeitenzubereitung, F.2.13) bis 0,93 (Wasserfahrzeugeinsatz, I.1.9#alternative). Dasselbe Zelt steht in der Formation mit 1,00 × 0,80, im Kreiskörper mit 0,53 × 0,84 und im Personenkörper mit 0,43 × 0,26.',
      ),
    ],
  },
  fitToBox: {
    status: 'evidenced',
    value: 'refuted',
    evidence: [
      source(
        GATE,
        'Eingepasst in die Fähigkeitsbox 24 × 16 mm ergäbe sich für jede verkleinerte Fassung ein Faktor. Der gemessene Faktor liegt zwischen dem 0,62- und dem 1,51-Fachen davon, je Fähigkeit verschieden: teils kleiner als die Box, teils größer. Die Verpflegung (G.1.2) etwa ist mit 0,42 gezeichnet, eingepasst wären es 0,67; der Wasserfahrzeugeinsatz (I.1.9#alternative) ist breiter, als die Box erlaubte, und die Technische Hilfeleistung im Rüstwagen (C.2.18) mit 0,90 × 1,25 höher als die Einzeldarstellung selbst.',
      ),
    ],
  },
  unscaledWhereFits: {
    status: 'evidenced',
    value: 'refuted',
    evidence: [
      asset(
        'G.8_Abfallentsorgung.svg',
        'Die Einzeldarstellung 4.8.5 passt unskaliert in die Formation; die Referenz verkleinert sie auf 0,67.',
      ),
      source(
        GATE,
        'Sieben Fähigkeiten passen unskaliert in die Formation und haben dort eine vermessene Fassung (Brandbekämpfung, Ruhen, Technische Hilfeleistung, Wasserförderung, Abfallentsorgung, Instandsetzung, Trinkwasser). Keine ist unverändert eingesetzt.',
      ),
    ],
  },
  // Bis LFH-786 „holds“: die Breite einer verkleinerten Marke hing an keinem Befund von der
  // Körperform ab. Anhang C widerlegt das mit drei Fähigkeiten, die am selben Landfahrzeug zwei
  // verschieden breite Fassungen führen.
  reducedSizeBodyInvariant: {
    status: 'evidenced',
    value: 'refuted',
    evidence: [
      asset(
        'C.2.20_Gerätewagen Gefahrgut.svg',
        'Der ABC-/CBRN-Schutz steht im Gerätewagen Gefahrgut mit 0,56 in der Breite neben dem Lauf, in der Alternative ohne Lauf mit 0,70 in der Körpermitte, beide am Landfahrzeug. Ebenso das Dekontaminieren: 0,56 in C.2.25, 0,70 in C.2.25#alternative und in der Formation C.1.8.',
      ),
      asset(
        'C.2.27_Feuerwehrkran 30.svg',
        'Der Kran steht im Feuerwehrkran mit 0,41 in der Breite, in der Alternative mit 5 statt 4 mm langem Ausleger mit 0,46, am selben Landfahrzeug.',
      ),
      source(
        GATE,
        'Für die übrigen verkleinerten Fassungen trägt die Aussage weiter: Instandsetzung 18 mm an Formation, Anhänger, Landfahrzeug und Kreiskörper; Mahlzeitenzubereitung 14 mm an drei, Verpflegung und Betriebsstoffe an zwei Körperformen; die Stromversorgung 0,41 in G.4 und 0,42 in C.2.30.',
      ),
    ],
    remaining:
      'Wo die Breite trägt, weicht die Höhe ab: in G.3.5 für den unteren Lauf, in I.2.1 bis I.2.3 je nach Fahrzeugkategorie (`VEHICLE_LAND_WATER_RESCUE_MARKS`), bei der Drehleiter in C.2.16#alternative, bei der Wasserförderung zwischen C.2.26 und C.2.26#alternative und bei der Stromversorgung zwischen G.4 und C.2.30. Unter dem Zelt (4.2.1) stehen drei verkleinerte Marken kleiner als in ihren Einzelfixtures (Ruhen in F.1.3 und F.1.19, Mahlzeitenzubereitung in F.2.13, Trinkwasser in F.2.17), die Verpflegung in F.1.17 nicht.',
  },
  // Ziel ist A, weil keine der drei Rechenregeln die Referenz reproduziert (oben). Bis zum
  // 2. Oktober 2026 galt LFH-787 „AB“: Boxfassung an Paaren mit vermessener Fassung abgelehnt,
  // ohne Fassung nur zugelassen, wo die Einzeldarstellung nachweislich im Körper bleibt. Seit der
  // Entscheidung „ableiten statt ablehnen“ lehnt `validateSpec` nichts mehr ab: Paare mit Fassung
  // zeichnet `compose()` in ihr (wie `bodyMarks`), Paare ohne Fassung mit der unveränderten
  // Einzeldarstellung, wo sie passt, und sonst ins Innenfeld eingepasst (`fitToBox` an der
  // Körperform, `derive/fit-pictogram.ts`) — als Ableitung vermerkt, denn keine vermessene Fassung
  // entsteht so.
  unmeasuredPairs: {
    target: 'measured-rendition-else-unscaled-if-fits-else-fitted',
    inForce: 'measured-rendition-else-unscaled-if-fits-else-fitted',
    decidedOn: '2026-10-02',
    decidedBy: 'Projektinhaber',
    decidedIn: 'docs/decisions/2026-10-02-ableiten-statt-messsperre.md',
  },
} satisfies CapabilityInsetRule);

/**
 * Die vermessene Körperfassung eines Paars aus Fähigkeit und Körperform, oder `undefined`, wenn
 * keine vermessen ist. Dann gilt `CAPABILITY_INSET_RULE.unmeasuredPairs`.
 */
export function capabilityInsetForm(
  capability: CapabilityId,
  kind: SymbolKind,
  variant?: BodyVariantId,
): CapabilityInsetForm | undefined {
  return CAPABILITY_INSET_FORMS.find(
    (candidate) =>
      candidate.capability === capability && candidate.kind === kind && candidate.variant === variant,
  );
}
