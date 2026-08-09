import type { Primitive } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import {
  defineComms,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import {
  commsCircle,
  commsLine,
  commsPolyline,
  commsRect,
  COMMS_BLACK_FILL,
  COMMS_WHITE_BODY,
} from './authoring.js';

// Abweichung vom Brief: Die Prosa nennt „weiss/surface" als erstes Paar, aber `weiss` und
// `surface` sind in beiden Themes identisch #ffffff (ratio 1) — eine weiße Füllung allein trägt
// keinen Kontrast, das global geprüfte Kontrastgate (`contrast-contract.test.ts`) lehnt das
// unabhängig von der Geometrie ab. Sichtbar wird der Körper auf der Ausgabeoberfläche durch seine
// schwarze Kontur, nicht durch die weiße Füllung — exakt das Muster, das `states/07-weather.ts`
// für weiß gefüllte, schwarz konturierte Motive bereits etabliert (`BLACK_ON_WHITE_AND_SURFACE`).
const DEVICE_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Kontur und Marke auf dem Gerätekörper',
  },
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Körperkontur auf Ausgabeoberfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

/** Weißes Quadrat mit schwarzer Kontur — gemeinsamer Körper aller J.3-Gerätezeichen. */
function deviceBody(): Primitive {
  return commsRect(4, 4, 24, 24, COMMS_WHITE_BODY);
}

/**
 * Antennenmast mit Querbalken, mittig über dem Körper montiert — Marke für die ortsfeste
 * Basisstation (J.3.2) und wiederverwendet in der mobilen Basisstation (J.3.3), die dieselbe
 * Antenne trägt und zusätzlich eine Mobilitätsmarke bekommt. Ragt bewusst über den Körper
 * hinaus: eine Basisstation strahlt über ein Mastsystem ab, das baulich über das Gerät
 * hinausragt — anders als die reinen Körpermarken der übrigen Zeichen.
 */
function antennaMark(): readonly Primitive[] {
  return [commsLine(16, 4, 16, 1), commsLine(13, 2, 19, 2)];
}

/**
 * Referenzbefund (visuell geprüft, nicht aus dem SVG übernommen): Die BABZ-Belegdateien J.3.2
 * bis J.3.8 unterscheiden die sieben Gerätezeichen fast ausschließlich über eingesetzte
 * Kürzel („BS", „mBS", „TMO/DMO", „HRT", „MRT", „FRT") und zwei Körperformen (Kreis für J.3.2
 * und J.3.3, Quadrat für die übrigen). Beides trägt die Bindung dieser Task nicht: ein
 * gemeinsamer quadratischer Körper ist vorgegeben, und Beschriftung ist als alleiniger
 * Unterscheidungskanal ausdrücklich ausgeschlossen — auch im Monochromprofil müssen die Zeichen
 * über Form, Anzahl oder Lage geometrischer Marken auseinanderzuhalten sein. Die folgenden Marken
 * sind deshalb eigenständige Konstruktionen nach dem semantischen Auftrag der Planungstabelle
 * (Antenne, Mobilität, Netzübergang, Wiederholer, Hand-/Fahrzeug-/Festgerät), nicht Kopien der
 * Referenzgeometrie.
 */
export const DEVICE_COMMS = deepFreeze([
  defineComms({
    section: 'J.3.1',
    id: 'telecom-device',
    title: 'Fernmeldegerät (Grundzeichen)',
    referenceAsset: 'J.3.1_Fernmeldegerät Grundzeichen.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: DEVICE_CONTRAST,
    primitives: [deviceBody()],
  }),
  defineComms({
    section: 'J.3.2',
    id: 'base-station',
    title: 'Basisstation',
    referenceAsset: 'J.3.2_Basisstation.svg',
    // Der Antennenmast ragt 3 mm über die Körperoberkante hinaus — die Box wächst entsprechend.
    box: { xMm: 4, yMm: 1, widthMm: 24, heightMm: 27 },
    contrastPairs: DEVICE_CONTRAST,
    primitives: [deviceBody(), ...antennaMark()],
  }),
  defineComms({
    section: 'J.3.3',
    id: 'mobile-base-station',
    title: 'Mobile Basisstation',
    referenceAsset: 'J.3.3_Mobile Basisstation.svg',
    // Dieselbe Antenne wie J.3.2 plus eine Achse mit zwei Rädern unter dem Körper — die
    // Mobilitätsmarke, die J.3.3 von der ortsfesten Basisstation unterscheidet.
    box: { xMm: 4, yMm: 1, widthMm: 24, heightMm: 29 },
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      ...antennaMark(),
      commsLine(11, 29, 21, 29),
      commsCircle(12, 29, 1, COMMS_BLACK_FILL),
      commsCircle(20, 29, 1, COMMS_BLACK_FILL),
    ],
  }),
  defineComms({
    section: 'J.3.4',
    id: 'gateway',
    title: 'Gateway',
    referenceAsset: 'J.3.4_Gateway.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      // Diagonale mit einem Knoten an jedem Ende — der Übergang zwischen zwei Netzen, die
      // das Gateway verbindet.
      commsLine(9, 23, 23, 9),
      commsCircle(9, 23, 1.5, COMMS_BLACK_FILL),
      commsCircle(23, 9, 1.5, COMMS_BLACK_FILL),
    ],
  }),
  defineComms({
    section: 'J.3.5',
    id: 'repeater',
    title: 'Repeater',
    referenceAsset: 'J.3.5_Repeater.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      // Zickzacklinie als Wiederholermarke — ein Signalweg, der aufgenommen und weitergegeben
      // wird, statt (wie bei J.3.4) zwei Netze zu verbinden.
      commsPolyline([
        [9, 16],
        [12, 12],
        [15, 20],
        [18, 12],
        [21, 20],
        [24, 16],
      ]),
    ],
  }),
  defineComms({
    section: 'J.3.6',
    id: 'handheld-radio-terminal',
    title: 'Handheld Radio Terminal',
    referenceAsset: 'J.3.6_Handheld Radio Terminal.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      // Schmales, hochkant stehendes Gerät mit kurzer Antenne — ein Handsprechfunkgerät.
      commsRect(13, 15, 6, 9, COMMS_BLACK_FILL),
      commsLine(16, 15, 16, 11),
    ],
  }),
  defineComms({
    section: 'J.3.7',
    id: 'mobile-radio-terminal',
    title: 'Mobile Radio Terminal',
    referenceAsset: 'J.3.7_Mobile Radio Terminal.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      // Breites, niedriges Gerät auf zwei Rädern mit kurzer Antenne — ein fahrzeuggebundenes
      // Funkgerät, unten im Körper platziert statt (wie J.3.6) hochkant und mittig.
      commsRect(9, 18, 14, 6, COMMS_BLACK_FILL),
      commsCircle(12, 24, 1.5, COMMS_BLACK_FILL),
      commsCircle(20, 24, 1.5, COMMS_BLACK_FILL),
      commsLine(16, 18, 16, 13),
    ],
  }),
  defineComms({
    section: 'J.3.8',
    id: 'fixed-radio-terminal',
    title: 'Fixed Radio Terminal',
    referenceAsset: 'J.3.8_Fixed Radio Terminal.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      // Gerät auf einer Grundlinie mit Montagefuß darunter — ein ortsfest verankertes Gerät,
      // weder auf Rädern (J.3.7) noch freistehend hochkant (J.3.6).
      commsLine(10, 24, 22, 24),
      commsRect(13, 16, 6, 8, COMMS_BLACK_FILL),
      commsLine(16, 24, 16, 27),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
