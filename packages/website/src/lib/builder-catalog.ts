import { searchSymbols } from './explorer-search.js';
import type { SymbolSummary } from './snapshot.js';

/**
 * Die Katalogsuche des Baukastens: gleiche Normalisierung und gleiche Volltextfelder wie der
 * Explorer (`explorer-search.ts`), damit „löschzug" und „loeschzug" hier genauso zueinander
 * finden wie dort — zwei Suchen mit verschiedenen Regeln auf derselben Website wären eine
 * Falle. Facetten braucht der Baukasten nicht; er sucht immer über den ganzen Katalog.
 */

export interface CatalogMatches {
  /** Höchstens `limit` Treffer, in Katalogreihenfolge. */
  matches: SymbolSummary[];
  /** Wie viele es insgesamt wären — für den Zählsatz unter dem Suchfeld. */
  total: number;
}

/**
 * Gedeckelt, weil die Trefferliste direkt unter dem Suchfeld steht: 256 Einträge auf einmal
 * wären das 256er-Auswahlfeld in neuer Form. Der Zählsatz (`matchesLine`) sagt, dass es mehr
 * gibt, statt sie zu verschweigen.
 */
export function searchCatalog(
  symbols: SymbolSummary[],
  query: string,
  limit: number,
): CatalogMatches {
  const all = searchSymbols(symbols, query, {});
  return { matches: all.slice(0, limit), total: all.length };
}

/** Der Satz unter der Trefferliste — auch die leere Suche bekommt eine Auskunft, kein Schweigen. */
export function matchesLine(total: number, shown: number): string {
  if (total === 0) return 'Kein Zeichen im Katalog passt zu dieser Suche.';
  if (shown < total) {
    return `Die ersten ${shown} von ${total} Treffern — enger suchen zeigt die übrigen.`;
  }
  return total === 1 ? 'Ein Treffer.' : `${total} Treffer.`;
}
