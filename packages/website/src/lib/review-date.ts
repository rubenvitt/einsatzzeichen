/**
 * Ein ISO-Datum als deutsches Datum — die einzige Stelle im Paket, die dieses Format bestimmt.
 *
 * Eigene Datei und nicht `components/StatusPair.tsx`, weil dieselbe Umwandlung an drei Rändern
 * gebraucht wird, die sich sonst nicht sehen dürften: die Statusmarke (React, auch im Browser),
 * der Snapshot-Generator (nur Node) und die Zähl- und Satzbausteine der Seiten. Drei Kopien einer
 * Regex sind drei Gelegenheiten, dass eine Seite ein anderes Datumsformat zeigt als die Marke
 * daneben.
 *
 * Was nicht ISO-förmig ist, bleibt unverändert stehen, statt zu `NaN.NaN.NaN` zu werden: ein
 * Katalogdatum in einer anderen Schreibweise soll sichtbar sein, nicht kaputt.
 */
export function formatReviewDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match === null ? date : `${match[3]}.${match[2]}.${match[1]}`;
}
