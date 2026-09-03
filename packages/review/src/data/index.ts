/**
 * Die Datenschicht des Fachreview-Werkzeugs: aus Katalog, Manifest, Ledger und Fragenregister
 * werden 558 Reviewzeilen samt Zeichnung. Rein und seiteneffektfrei — kein `node:fs`, kein Netz.
 * Der Server (`../server/`) legt das Dateisystem darum, die Oberfläche (`../ui/`) sieht nur die
 * Vertragstypen aus `../contract.js`.
 *
 * Diese Datei ist die einzige Schnittstelle nach außen; die Aufteilung dahinter (`drawings`,
 * `evidence`, `prose`, `rows`, `views`) ist Innensache und läuft in eine Richtung: von den
 * Bausteinen über `rows` zu den Sichten.
 */
export type { ReviewRow } from './rows.js';
export { buildRows } from './rows.js';
export { areaSummaries, neighboursOf, rowById, rowDetail, rowSummaries } from './views.js';
