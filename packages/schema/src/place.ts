/**
 * Orte mit eigener Katalogkennung (LFH-1065, Fachreview vom 5. Oktober 2026, Punkt 7).
 *
 * Eine Funktion an Stelle oder Gebäude ist Systematik-gesperrt
 * (`function-role-requires-measured-kind`): eine Funktion ist Person oder Formation. Ein Ort, an
 * dem eine Leitung sitzt, ist dagegen eine **Körperform** wie die Leitstelle D.2.5 und bekommt
 * deshalb eine eigene Kennung statt „Funktion an der Stelle“. Die Leitstelle ist die einzige
 * vermessene; die vier Leitungen sind die, die als Person **und** als Führungsstelle an der
 * Formation vermessen sind (Entscheidung vom 9. Oktober 2026).
 */
export const PLACE_IDS = Object.freeze([
  'control-center',
  'incident-command',
  'technical-incident-command',
  'incident-section-command',
  'incident-subsection-command',
] as const);

export type PlaceId = (typeof PLACE_IDS)[number];
