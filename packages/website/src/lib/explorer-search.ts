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
