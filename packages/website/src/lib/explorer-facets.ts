import {
  facetOptions,
  reviewStatusOptions,
  type ExplorerFacetField,
  type FacetGroup,
} from './explorer-search.js';
import type { BuilderVocabulary, ReviewSummary, SymbolSummary } from './snapshot.js';

/**
 * Was der Explorer aus dem Snapshot ableitet, bevor irgendetwas gerendert wird (LFH-500).
 *
 * Bis LFH-500 stand das als Modulebenen-Konstante in `islands/Explorer.tsx`: der Snapshot lag
 * beim Laden des Moduls vor, also ließ sich die Beschriftungstabelle der Organisationen und die
 * sechs Facettengruppen einmalig danebenlegen. Mit dem Abruf zur Laufzeit gibt es diesen Zeitpunkt
 * nicht mehr — die Ableitung muss in den Komponentenzustand wandern, und damit sie dabei nicht in
 * die `.tsx` rutscht (Vitest sammelt nur `*.test.ts`, `.tsx` wird nicht getestet), steht sie hier
 * als reine Funktion über einem übergebenen Snapshot-Ausschnitt.
 *
 * Die Zähl- und Sortierlogik selbst bleibt in `explorer-search.ts`; hier steht nur, welche sechs
 * Facetten der Explorer zeigt, woher jede ihre Werte nimmt und woher ihre Beschriftung kommt.
 */

/** Die sechs Facettengruppen des Explorers, in der Reihenfolge der Auswahlfelder. */
export interface ExplorerFacetGroups {
  organization: FacetGroup;
  chapter: FacetGroup;
  source: FacetGroup;
  profile: FacetGroup;
  technical: FacetGroup;
  domain: FacetGroup;
}

/** Beschriftung einer Reviewachse zu einem Status — in der Insel `statusMark(...).shortLabel`. */
export type StatusLabel = (
  axis: 'technical' | 'domain',
  status: ReviewSummary['status'],
) => string;

/**
 * Kennung → deutsche Bezeichnung der Organisationen, aus `snapshot.builder.organization`.
 *
 * `?? []` statt eines direkten Zugriffs: `assertSnapshot` prüft `symbols` und `generatedAt`, nicht
 * `builder`. Solange der Snapshot ein Modul war, hätte ein fehlendes Feld beim Bauen aufschlagen
 * müssen; über die Leitung geholt (LFH-500) ist es ein Dokument fremder Herkunft, und ein
 * `TypeError` beim Lesen einer fehlenden Liste wäre die unbrauchbarste Auskunft davon. Ohne
 * Bezeichnung zeigt der Explorer die Kennung — das ist bereits der Rückfall in `facetOptions`.
 */
export function organizationLabels(vocabulary: BuilderVocabulary): Map<string, string> {
  return new Map((vocabulary.organization ?? []).map((entry) => [entry.id, entry.label]));
}

/**
 * Die Facettenwerte kommen aus den Symbolen selbst, nicht aus `builder.vocabulary`: der Explorer
 * soll nur zeigen, was tatsächlich vorkommt, mit der echten Anzahl daneben. Das Vokabular liefert
 * ausschließlich die Beschriftung der Organisationen — für Kapitel, Quelle und Profil steht die
 * lesbare Form schon am Symbol.
 */
export function explorerFacetGroups(
  symbols: SymbolSummary[],
  vocabulary: BuilderVocabulary,
  statusLabel: StatusLabel,
): ExplorerFacetGroups {
  const organizations = organizationLabels(vocabulary);
  // Zitierform je Quellen-ID, aus den Symbolen selbst — dieselbe ID trägt überall dieselbe
  // Zitierform, ein `Map` über alle Symbole hält also genau eine Zeile je Quelle.
  const citations = new Map(symbols.map((symbol) => [symbol.source.id, symbol.source.citation]));

  return {
    organization: facetOptions(
      symbols,
      (symbol) => symbol.spec.organization,
      (id) => organizations.get(id) ?? id,
    ),
    chapter: facetOptions(symbols, (symbol) => symbol.chapter, (id) => id),
    source: facetOptions(symbols, (symbol) => symbol.source.id, (id) => citations.get(id) ?? id),
    profile: facetOptions(symbols, (symbol) => symbol.profile, (id) => id),
    technical: reviewStatusOptions(symbols, 'technical', (status) =>
      statusLabel('technical', status),
    ),
    domain: reviewStatusOptions(symbols, 'domain', (status) => statusLabel('domain', status)),
  };
}

/**
 * Die Werte, die `sanitizeFacets` als gültig durchlässt — genau die, für die es eine Option in
 * einer Auswahlbox gibt. Die Zuordnung Feldname → Gruppe steht hier und nicht in der Insel, damit
 * eine siebte Facette nicht an zwei Stellen nachgezogen werden muss.
 */
export function validFacetValues(
  groups: ExplorerFacetGroups,
): Record<ExplorerFacetField, readonly string[]> {
  const values = (group: FacetGroup): readonly string[] =>
    group.options.map((option) => option.value);
  return {
    org: values(groups.organization),
    kapitel: values(groups.chapter),
    quelle: values(groups.source),
    profil: values(groups.profile),
    technisch: values(groups.technical),
    fachlich: values(groups.domain),
  };
}
