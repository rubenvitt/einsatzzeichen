import type { DerivationNote, Drawing, FunctionRoleId, PlaceId, SymbolSpec } from '@einsatzzeichen/schema';
import type { ComposeOptions } from './compose.js';
import { drawSymbol } from './default-ports.js';

/**
 * Orte mit eigener Katalogkennung (LFH-1065). Eine Leitung **als Ort** ist keine Funktion an der
 * Stelle — die bleibt gesperrt (`function-role-requires-measured-kind`, Systematik) —, sondern eine
 * Körperform nach dem Muster der Leitstelle D.2.5: 12-mm-Kreis mit Giebel („ortsfest“, Kapitel 3.9)
 * und Kappe, gelb für Führung und Leitung, das Kürzel schwarz. Entscheidungsnotiz:
 * `docs/decisions/2026-10-09-lfh-1065-orte-als-eigene-kennungen.md`.
 *
 * Nur die Leitstelle hat ein Original. Die übrigen Orte zeichnen aus lauter vermessenen Teilen —
 * der Motor fände an „EL“ in Leitstellengröße nichts abzuleiten —, als Ganzes aber hat sie niemand
 * vorgelegt. Deshalb hängt `drawPlace` an sie eine eigene Notiz (`dimension: 'place'`).
 */
export type PlaceSource =
  | { readonly basis: 'measured'; readonly section: string; readonly referenceAsset: string }
  | { readonly basis: 'derived'; readonly from: string };

export interface PlaceEntry {
  readonly id: PlaceId;
  readonly title: string;
  readonly spec: SymbolSpec;
  readonly source: PlaceSource;
  /**
   * Die vermessenen Fassungen derselben Leitung als Rolle an der Person und als Führungsstelle an
   * der Formation. Ihr Kürzel ist das Kürzel des Orts.
   */
  readonly counterparts: readonly FunctionRoleId[];
}

const D25_FILE = 'D.2.5_Leitstelle.svg';

/** Körper, Giebel, Kappe und Farbe der Leitstelle D.2.5; das Kürzel setzt jeder Ort selbst. */
const PLACE_BODY = {
  kind: 'circle-12',
  bodyVariant: 'raised-gable',
  organization: 'fuehrung-leitung',
  bodyMarks: ['circle-solid-cap-4mm'],
} as const satisfies SymbolSpec;

/**
 * Versalhöhe 7,30 und Grundlinie 8 mm über der Kreisunterkante, gemessen an „LtS“ in D.2.5. Zwei
 * Buchstaben tragen sie ebenso; längere Kürzel bekommen die Größe, die der Motor an der Kreisbreite
 * ableitet (und vermerkt).
 */
const D25_RUN = { centerCapHeightMm: 7.3, centerBaselineFromBodyBottomMm: 8 } as const;

function derivedPlace(
  id: PlaceId,
  title: string,
  label: string,
  counterparts: readonly FunctionRoleId[],
  run: Partial<typeof D25_RUN> = {},
): PlaceEntry {
  const entry: PlaceEntry = {
    id,
    title,
    spec: { ...PLACE_BODY, labels: { center: label, ...run } },
    source: { basis: 'derived', from: D25_FILE },
    counterparts: Object.freeze([...counterparts]),
  };
  return Object.freeze(entry);
}

const CONTROL_CENTER: PlaceEntry = {
  id: 'control-center',
  title: 'Leitstelle',
  spec: { ...PLACE_BODY, labels: { center: 'LtS', ...D25_RUN } },
  source: { basis: 'measured', section: 'D.2.5', referenceAsset: D25_FILE },
  counterparts: Object.freeze([]),
};

export const PLACES: Readonly<Record<PlaceId, PlaceEntry>> = Object.freeze({
  'control-center': Object.freeze(CONTROL_CENTER),
  'incident-command': derivedPlace(
    'incident-command',
    'Einsatzleitung (Ort)',
    'EL',
    ['incident-commander', 'incident-command'],
    D25_RUN,
  ),
  'technical-incident-command': derivedPlace(
    'technical-incident-command',
    'Technische Einsatzleitung (Ort)',
    'TEL',
    ['technical-incident-commander', 'technical-incident-command-group', 'technical-incident-command-evacuation'],
  ),
  'incident-section-command': derivedPlace(
    'incident-section-command',
    'Einsatzabschnittsleitung (Ort)',
    'EAL',
    ['incident-section-commander', 'incident-section-command-north'],
  ),
  'incident-subsection-command': derivedPlace(
    'incident-subsection-command',
    'Untereinsatzabschnittsleitung (Ort)',
    'UEAL',
    ['incident-subsection-commander', 'incident-subsection-command'],
  ),
});

/**
 * Zeichnet einen Ort über `drawSymbol`. Ohne eigenen Titel trägt die Zeichnung den des Orts. An
 * einen abgeleiteten Ort hängt sie nach den Notizen des Motors eine Ortsnotiz.
 */
export function drawPlace(id: PlaceId, options: ComposeOptions = {}): Drawing {
  const entry = PLACES[id];
  const drawing = drawSymbol(entry.spec, { title: entry.title, ...options });
  if (entry.source.basis === 'measured') return drawing;
  const note: DerivationNote = {
    dimension: 'place',
    part: `${entry.title}: Körper, Giebel, Kappe und Lauf der Leitstelle D.2.5 mit dem Kürzel „${entry.spec.labels?.center}“`,
    basis: 'transferred',
    from: entry.source.from,
  };
  return { ...drawing, derivations: [...(drawing.derivations ?? []), note] };
}
