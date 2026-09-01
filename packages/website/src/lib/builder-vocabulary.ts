import type { Drawing, SymbolSpec } from '@einsatzzeichen/schema';
import { allowedValues, evaluateSpec, type AllowedValue } from './builder-state.js';
import type { BuilderVocabulary } from './snapshot.js';

/**
 * Was der Baukasten aus `snapshot.builder` ableitet (LFH-500).
 *
 * Bis LFH-500 stand das als Modulebenen-Konstante in `islands/Builder.tsx` — `VOCABULARY` und die
 * daraus einmalig komponierten `KIND_PREVIEWS`. Beides hing daran, dass der Snapshot beim Laden
 * des Moduls schon vorlag; mit dem Abruf zur Laufzeit gibt es diesen Zeitpunkt nicht mehr. Die
 * Ableitungen wandern deshalb in `useMemo` der Insel und stehen hier als reine Funktionen über
 * einem übergebenen Vokabular: Vitest sammelt nur `*.test.ts`, in der `.tsx` wären sie ungeprüft.
 *
 * Das Vokabular ist hier durchgehend ein Argument und nie ein Modulzustand. Ein gemerktes
 * „aktuelles Vokabular" wäre der alte Fehler in neuer Form — es machte die Funktionen wieder von
 * einem Ladezeitpunkt abhängig, den keine von ihnen kennt.
 */

/** Ein Eintrag des Vokabulars: Kennung plus deutsche Bezeichnung. */
export interface VocabularyEntry {
  id: string;
  label: string;
}

/**
 * Die Werte einer Achse. `?? []` statt eines direkten Zugriffs: `assertSnapshot` prüft `symbols`
 * und `generatedAt`, nicht `builder` — und der Baukasten fragt Achsen ab, die das Vokabular gar
 * nicht führen muss (`designation` etwa hat kein Register). Eine fehlende Achse ist deshalb der
 * Normalfall, kein Fehler: das Feld steht dann ohne Optionen da.
 */
export function optionsFor(
  vocabulary: BuilderVocabulary,
  field: keyof SymbolSpec,
): readonly VocabularyEntry[] {
  return vocabulary[field] ?? [];
}

/**
 * Die Bezeichnung zu einer Kennung — für Chips, Tooltips und den Satz, der einen gesperrten Wert
 * begründet. Fällt auf die Kennung zurück, statt zu werfen: eine Spec aus einem alten Link kann
 * einen Wert tragen, den das Vokabular nicht mehr führt, und die Kennung zu zeigen ist dann die
 * ehrlichere Auskunft als eine leere Stelle.
 */
export function labelFor(
  vocabulary: BuilderVocabulary,
  field: keyof SymbolSpec,
  id: string,
): string {
  return optionsFor(vocabulary, field).find((entry) => entry.id === id)?.label ?? id;
}

/**
 * Miniaturen der Grundzeichenarten für die Kachel-Auswahl: jede Kachel zeigt die nackte Grundform
 * `{ kind }`. Manche Arten (`circle-12`, `reduced-house`) komponieren ohne weitere Zutat nicht —
 * dafür steht `null`, und die Insel zeichnet einen Platzhalterrahmen statt einer erfundenen
 * Zeichnung. Der try/catch ist hier richtig: eine fehlende Miniatur ist eine Darstellungslücke der
 * Kachel, kein Fehler der aktuellen Zusammenstellung.
 */
export function kindPreviews(vocabulary: BuilderVocabulary): Map<string, Drawing | null> {
  return new Map(
    optionsFor(vocabulary, 'kind').map((option) => {
      try {
        const result = evaluateSpec({ kind: option.id } as SymbolSpec);
        return [option.id, result.ok ? result.drawing : null];
      } catch {
        return [option.id, null];
      }
    }),
  );
}

/**
 * Was gerade zusammenpasst, für jedes genannte Feld auf einmal — Feldname → (Kennung → Befund).
 *
 * Alle Felder auf einmal statt erst beim Öffnen eines Auswahlfeldes: alle elf Felder mit zusammen
 * 247 Kandidaten brauchen 9,7 ms kalt und 3,4 ms warm. Das Sparen baute dafür einen Fehler ein —
 * ein Auswahlfeld öffnet sich beim Klick, bevor React die Sperren nachgezogen hat, und zeigte beim
 * ersten Öffnen die alte Liste.
 */
export function probeFields(
  vocabulary: BuilderVocabulary,
  spec: SymbolSpec,
  fields: readonly (keyof SymbolSpec)[],
): Map<string, Map<string, AllowedValue>> {
  const byField = new Map<string, Map<string, AllowedValue>>();
  for (const field of fields) {
    const ids = optionsFor(vocabulary, field).map((entry) => entry.id);
    byField.set(field, new Map(allowedValues(spec, field, ids).map((v) => [v.value, v])));
  }
  return byField;
}
