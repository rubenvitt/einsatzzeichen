import type { GrammarFinding } from '@einsatzzeichen/schema';
import { deepFreeze } from '../geometry/readonly-data.js';
import type { SketchPictogramId } from './pictograms.js';

/**
 * Befund je Baustein der Kommunikationsskizze (LFH-1033). Kein Baustein hat eine Referenzdatei:
 * J.5 ist eine Musterskizze ohne Einzeldateien im BABZ-Bestand, und Melder, sonstige und eine
 * Satellitenverbindung ohne Inhalt stehen nicht in J.1. Jede Geometrie ist deshalb `proposed`.
 *
 * `basis` sagt wie bei `DerivationNote`, woher die Form stammt: `transferred` übernimmt eine
 * vermessene Fassung aus J.1 bis J.3, `constructed` folgt einer Regel ohne unmittelbare Vorlage.
 * Die Zuordnung „außerhalb des Katalogs, eigener Namensraum“ hat der Eigentümer am 08.10.2026
 * entschieden (`docs/decisions/2026-10-08-lfh-1033-kommunikationsskizze.md` §2).
 */

export type SketchBlockId =
  | 'condition-sign'
  | 'bus-bar'
  | 'link-radio'
  | 'link-planned'
  | 'area'
  | SketchPictogramId;

export interface SketchBlock {
  readonly title: string;
  readonly basis: 'transferred' | 'constructed';
  /** Vorlage der Form: Abschnitt der Referenz oder die Musterskizze. */
  readonly from: string;
  readonly geometry: GrammarFinding<string>;
}

const DECISION = 'docs/decisions/2026-10-08-lfh-1033-kommunikationsskizze.md';

function proposed(value: string, reason: string): GrammarFinding<string> {
  return { status: 'proposed', value, reason: `${reason} (${DECISION})` };
}

export const SKETCH_BLOCKS: Readonly<Record<SketchBlockId, SketchBlock>> = deepFreeze({
  'condition-sign': {
    title: 'Bedingungszeichen',
    basis: 'constructed',
    from: 'J.5 Musterskizze',
    geometry: proposed(
      'Langsechseck 8 mm hoch, Spitzen je 4 mm, Text 4 mm Arimo 500, Innenabstand 1,33 mm je Seite; Breite folgt dem Text',
      'Die Musterskizze zeigt die Form, aber keine Einzeldatei mit Maßen',
    ),
  },
  'bus-bar': {
    title: 'Sammelschiene',
    basis: 'constructed',
    from: 'J.5 Musterskizze',
    geometry: proposed(
      'Waagerechte Linie 0,5 mm mit eingesetztem Bedingungszeichen, Überstand mindestens 5,33 mm je Seite',
      'Die Musterskizze zeigt die Schiene, aber keine Einzeldatei mit Maßen',
    ),
  },
  'link-radio': {
    title: 'Funkverbindung auf freier Linie',
    basis: 'transferred',
    from: 'J.3.12 Funk',
    geometry: proposed(
      'Zickzack mit sechs gleichen Schenkeln, 8 × 2,67 mm, in der Mitte des längsten Abschnitts, in Linienrichtung gedreht und nie kopfstehend, mit Grund 0,67 mm',
      'J.3.12 zeigt den Zickzack in einem festen 32-mm-Feld; Länge und Lage auf einer Linie sind übertragen',
    ),
  },
  'link-planned': {
    title: 'Geplante Verbindung',
    basis: 'constructed',
    from: 'J.5 Musterskizze',
    geometry: proposed(
      'Strichmuster 2,67/1,67 mm und das Wort „geplant“ (3,33 mm) unter bzw. rechts der Linie',
      'Kein Original zeigt eine geplante Verbindung; Strichmuster und Wort, damit „geplant“ ohne Farbe lesbar bleibt',
    ),
  },
  area: {
    title: 'Bereich',
    basis: 'constructed',
    from: 'J.5 Musterskizze',
    geometry: proposed(
      'Rechteck mit Strich-Punkt-Grenze 4,67/1,33/0,67/1,33 mm, je Seite neu angesetzt, Bezeichnung 3,33 mm innen oben links',
      'Die Musterskizze zeigt den rückwärtigen Bereich, aber keine Einzeldatei mit Maßen',
    ),
  },
  'sketch.messenger': {
    title: 'Verbindung über Melder',
    basis: 'constructed',
    from: 'J.1.1 Balken, J.1.3 Kürzel, J.1.8–J.1.11 Zickzack',
    geometry: proposed(
      'Balken x 3 … 29 mit Kürzel „Melder“ (7,1 mm) darüber, drahtlos mit Zickzack darunter',
      'J.1 kennt keine Verbindungsart Melder; gebaut aus der Formsprache von J.1',
    ),
  },
  'sketch.other': {
    title: 'Sonstige Verbindung',
    basis: 'constructed',
    from: 'J.1.1 Balken, J.1.3 Kürzel, J.1.8–J.1.11 Zickzack',
    geometry: proposed(
      'Balken x 3 … 29 mit Kürzel „sonst.“ (7,1 mm) darüber, drahtlos mit Zickzack darunter',
      'J.1 kennt keine Verbindungsart „sonstige“; gebaut aus der Formsprache von J.1',
    ),
  },
  'sketch.satellite': {
    title: 'Satellitenverbindung',
    basis: 'transferred',
    from: 'J.1.12 Satellitenverbindung Sprache, J.1.13 Satellitenverbindung Daten',
    geometry: proposed(
      'Die Schale aus J.1.12/J.1.13 ohne den Inhalt rechts daneben',
      'J.1 unterscheidet nur Sprache und Daten; ohne Angabe bleibt die gemeinsame Schale',
    ),
  },
});
