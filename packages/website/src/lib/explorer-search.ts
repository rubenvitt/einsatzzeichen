import type { ReviewSummary, SymbolSummary } from './snapshot.js';

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/**
 * Vergleichsform für Suchtexte: klein geschrieben, deutsche Umlaute auf ihre ASCII-Ersatzform
 * (ä→ae, ö→oe, ü→ue, ß→ss), übrige Akzente entfernt (NFD-Zerlegung, kombinierende Zeichen
 * gestrichen). Die Umlaut-Ersetzung läuft **vor** der NFD-Zerlegung: `ö` zerlegt sich sonst in
 * `o` + Trema, und das Trema fiele der Akzent-Bereinigung zum Opfer — übrig bliebe `o` statt
 * `oe`. Weil Suchtext und Kandidat durch dieselbe Funktion laufen, matchen „löschzug“ und
 * „loeschzug“ gegeneinander, ohne dass eine Schreibweise bevorzugt wird (Spec §5.4).
 */
export function normalize(value: string): string {
  const withAsciiUmlauts = value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
  return withAsciiUmlauts.normalize('NFD').replace(COMBINING_DIACRITICS, '');
}

export interface SymbolFacets {
  organization?: string;
  chapter?: string;
  /**
   * Ruling (Implementer, kein Controller verfügbar): filtert auf `symbol.source.id`, die
   * registrierte Quelle (z. B. `bbk-babz-2025`), nicht auf `symbol.sourceId`, den
   * Manifestschlüssel je Eintrag. Belegt am echten Snapshot: `sourceId` streut über 246 von 256
   * Zeichen (praktisch 1:1, keine sinnvolle Facette); `source.id` hat genau 2 Werte — das ist,
   * was Spec §5.4 mit „Quelle" meint. Kosten bei Fehler: Facettenname weicht vom wörtlichen
   * Feldnamen der Brief-Signatur ab, Verhalten bleibt aber die einzig nutzbare „Quelle"-Facette.
   */
  sourceId?: string;
  profile?: string;
  technical?: ReviewSummary['status'];
  domain?: ReviewSummary['status'];
}

/** Prüft eine Facette: `undefined` heißt „nicht gesetzt“ und lässt jeden Wert durch. */
function facetMatches<T>(want: T | undefined, have: T): boolean {
  return want === undefined || want === have;
}

/** Volltextfelder eines Symbols: Titel, semantische ID, Synonyme, Legacy-Bezeichnungen. */
function searchableText(symbol: SymbolSummary): string[] {
  return [symbol.title, symbol.id, ...symbol.synonyms, ...symbol.legacyIds];
}

/**
 * Normalisierte Substringsuche über Titel, Synonyme, Legacy-IDs und semantische ID, geschnitten
 * mit den Facetten. Keine externe Suchbibliothek (Spec §5.4) — bei rund 300 Einträgen reicht ein
 * linearer Scan; jede Facette ist ein einfacher Gleichheitstest, UND-verknüpft.
 */
export function searchSymbols(
  symbols: SymbolSummary[],
  q: string,
  facets: SymbolFacets,
): SymbolSummary[] {
  const query = normalize(q.trim());
  return symbols.filter((symbol) => {
    if (!facetMatches(facets.organization, symbol.spec.organization)) return false;
    if (!facetMatches(facets.chapter, symbol.chapter)) return false;
    if (!facetMatches(facets.sourceId, symbol.source.id)) return false;
    if (!facetMatches(facets.profile, symbol.profile)) return false;
    if (!facetMatches(facets.technical, symbol.review.technical.status)) return false;
    if (!facetMatches(facets.domain, symbol.review.domain.status)) return false;
    if (query === '') return true;
    return searchableText(symbol).some((text) => normalize(text).includes(query));
  });
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface FacetGroup {
  /**
   * Gesamtzahl der Symbole, auf die sich die Facette bezieht — **nicht** die Summe der
   * Options-Zähler. Ein optionales Feld wie `spec.organization` fehlt bei einem Teil der
   * Symbole (25 von 256 im echten Snapshot); die Summe der Options-Zähler wäre dann kleiner
   * als die Gesamtzahl, und eine „Alle"-Option, die daraus ihren Zähler bildet, würde zu
   * wenige Treffer versprechen, obwohl eine ungefilterte Suche alle 256 zeigt.
   */
  total: number;
  options: FacetOption[];
}

/**
 * Facettenwerte mit Zähler, aus den Symbolen abgeleitet (nicht aus einer erlaubten
 * Werteliste) und alphabetisch sortiert. Symbole ohne Wert (z. B. `spec.organization` bei
 * Grundzeichen ohne Organisationsbezug) tragen zu keiner Option bei, zählen aber in
 * `total` — siehe `FacetGroup`.
 */
export function facetOptions(
  symbols: SymbolSummary[],
  selector: (symbol: SymbolSummary) => string | undefined,
  labelFor: (value: string) => string,
): FacetGroup {
  const counts = new Map<string, number>();
  for (const symbol of symbols) {
    const value = selector(symbol);
    if (value === undefined || value === '') continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const options = [...counts.entries()]
    .map(([value, count]) => ({ value, label: labelFor(value), count }))
    .sort((a, b) => a.label.localeCompare(b.label, 'de'));
  return { total: symbols.length, options };
}

const REVIEW_STATUS_ORDER: ReviewSummary['status'][] = ['approved', 'deviation', 'pending'];

/** Wie `facetOptions`, aber für die Reviewachsen: `status` ist bei jedem Symbol gesetzt (kein Optionalfall). */
export function reviewStatusOptions(
  symbols: SymbolSummary[],
  axis: 'technical' | 'domain',
  labelFor: (status: ReviewSummary['status']) => string,
): FacetGroup {
  const counts = new Map<ReviewSummary['status'], number>();
  for (const symbol of symbols) {
    const status = symbol.review[axis].status;
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  const options = REVIEW_STATUS_ORDER.filter((status) => (counts.get(status) ?? 0) > 0).map((status) => ({
    value: status,
    label: labelFor(status),
    count: counts.get(status) ?? 0,
  }));
  return { total: symbols.length, options };
}

/** Die sechs URL-/Formularfelder des Explorers; `q` ist Freitext und nimmt keine Prüfung. */
export type ExplorerFacetField = 'org' | 'kapitel' | 'quelle' | 'profil' | 'technisch' | 'fachlich';

export interface ExplorerFilters extends Record<ExplorerFacetField, string> {
  q: string;
}

/**
 * Verwirft Facettenwerte, die keine gültige Auswahlbox anbietet — etwa aus einem veralteten
 * oder von Hand veränderten Link (`?org=bogus`). Ohne diese Prüfung setzt `searchSymbols`
 * einen Filter, den kein `<select>` je dargestellt hat: das `<select>` zeigt „Alle", das
 * Ergebnis ist trotzdem leer, ohne dass die Seite einen Grund nennt. Freitext (`q`) bleibt
 * unangetastet — jede Zeichenkette ist eine gültige Suche.
 */
export function sanitizeFacets(
  raw: ExplorerFilters,
  validValues: Record<ExplorerFacetField, readonly string[]>,
): ExplorerFilters {
  const sanitized = { ...raw };
  for (const field of Object.keys(validValues) as ExplorerFacetField[]) {
    if (sanitized[field] !== '' && !validValues[field].includes(sanitized[field])) {
      sanitized[field] = '';
    }
  }
  return sanitized;
}
