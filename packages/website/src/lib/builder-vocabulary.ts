import { checkSpec } from '@einsatzzeichen/core';
import type { Drawing, SymbolSpec } from '@einsatzzeichen/schema';
import { allowedValues, type AllowedValue } from './builder-state.js';
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
 * `{ kind }`, gezeichnet über `checkSpec()` aus `core`. Seit dem 2. Oktober 2026 komponiert jede
 * Art des Katalogs auch ohne weitere Zutat (bis dahin fehlten `circle-12` und `reduced-house`,
 * die eine Organisation verlangten). Komponiert eine Art doch einmal nicht, steht dafür `null`,
 * und die Insel zeichnet einen Platzhalterrahmen statt einer erfundenen Zeichnung. Dieselbe
 * Auskunft gibt `vocabulary({}, 'kind')` in `core` als gesperrten Wert. Der try/catch ist hier richtig: eine
 * fehlende Miniatur ist eine Darstellungslücke der Kachel, kein Fehler der aktuellen
 * Zusammenstellung.
 */
export function kindPreviews(vocabulary: BuilderVocabulary): Map<string, Drawing | null> {
  return new Map(
    optionsFor(vocabulary, 'kind').map((option) => {
      try {
        const result = checkSpec({ kind: option.id } as SymbolSpec);
        return [option.id, result.ok ? result.drawing : null];
      } catch {
        return [option.id, null];
      }
    }),
  );
}

/**
 * Was gerade zusammenpasst, für jedes genannte Feld auf einmal — Feldname → (Kennung → Befund).
 * Gerechnet wird über `allowedValues()` und damit in `core` (`vocabulary()`, LFH-578).
 *
 * Alle Felder auf einmal statt erst beim Öffnen eines Auswahlfeldes: alle elf Felder mit zusammen
 * 247 Kandidaten brauchen 9,7 ms kalt und 3,4 ms warm (29.08.2026); über `core` gerechnet und mit
 * dem vollen Vorrat von 316 Kandidaten 7,8 ms kalt und rund 4 ms warm (29.09.2026). Seit
 * LFH-577 (Verband, Zustand, Tendenz) probiert der Baukasten 14 Felder mit 315 Kandidaten: 7,9 ms
 * kalt und rund 2,5 ms warm (29.09.2026, Node 26, tsx). Das Sparen baute dafür einen Fehler ein —
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

/**
 * Ob sich in einem Feld **kein einziger** Wert zeichnen lässt: jeder probierte Kandidat ist als
 * nicht vermessen gesperrt, und zwar mit `scope: 'value'` — an keiner Grundzeichenart.
 *
 * Dann ist der übliche Rat „wähle einen anderen Wert" falsch, denn jeder andere ist genauso
 * gesperrt. Die Insel sagt stattdessen einmal am Feld, dass es noch nicht vermessen ist. Gelesen
 * wird das aus der Probe und nicht aus einer Feldliste: die Tendenz war bis zum 2. Oktober 2026
 * so ein Feld (kein Original zeigt sie an einem Träger, LFH-577) und wird seitdem abgeleitet
 * gezeichnet. Ob und wann wieder ein Feld so dasteht, entscheidet der Katalog und nicht die
 * Website.
 *
 * Eine Regelsperre oder ein gesetzter (und deshalb nie gesperrter) Wert heben den Befund auf; ein
 * Feld ohne Probe oder ohne Werte ist kein Befund.
 */
export function unmeasuredField(probe: ReadonlyMap<string, AllowedValue> | undefined): boolean {
  if (probe === undefined || probe.size === 0) return false;
  for (const entry of probe.values()) {
    if (entry.blocked?.because !== 'not-measured' || entry.blocked.scope !== 'value') return false;
  }
  return true;
}

/* --- Abgeleitete Werte (Entscheidung vom 2. Oktober 2026) --------------------------------- */

/**
 * Ob die Zusammenstellung, so wie sie ist, abgeleitete Teile trägt (`Drawing.derivations`).
 * Eine Spec, die nicht zeichnet, trägt keine; ein Programmfehler fliegt wie bei `checkSpec`
 * weiter — dieselbe Spec ginge ohnehin durch `probeFields()`, und dort fliegt er genauso.
 */
export function drawsDerived(spec: SymbolSpec): boolean {
  const result = checkSpec(spec);
  return result.ok && (result.drawing.derivations?.length ?? 0) > 0;
}

/**
 * Ob ein Eintrag im Formular als „abgeleitet" erscheint.
 *
 * - Nur ein **zeichenbarer** Eintrag: ein gesperrter trägt seinen Sperrgrund, nichts sonst.
 * - **Nie der gesetzte Wert** — dieselbe Zusage wie bei `displayedBlock()` in der Insel. Ob die
 *   aktuelle Zeichnung abgeleitet ist, sagt der Hinweis unter der Vorschau, und zwar mit den
 *   Teilen, die es betrifft.
 * - **Nicht, wenn die Spec der Probe selbst schon abgeleitet ist** (`probeDerived`, aus
 *   `drawsDerived()` über dieselbe Spec wie die Probe). Dann trägt fast jeder Kandidat
 *   `derived: true`, weil die Ableitung schon in der übrigen Auswahl steckt — gemessen am
 *   02.10.2026 an `{ kind: 'area', administrativeLevel: 'kreis' }`: alle 19 Grundzeichenarten,
 *   alle acht Organisationen, alle 74 Körpermarken. Die Kennzeichnung sagte dann nichts mehr
 *   über den einzelnen Wert. Sie gilt deshalb nur dort, wo dieser Wert der erste Schritt weg
 *   von einer vermessenen Zusammenstellung wäre.
 *
 * `probeDerived` muss zur Spec der Probe gehören, nicht zur aktuellen: im aufgeschobenen Render
 * sind das zwei verschiedene, und gemischt ergäbe sich eine Aussage, die keine der beiden trägt.
 */
export function derivedMarker(
  entry: AllowedValue | undefined,
  selected: boolean,
  probeDerived: boolean,
): boolean {
  return !selected && !probeDerived && entry?.ok === true && entry.derived === true;
}

/**
 * Die abgeleiteten Teile einer Zeichnung als Liste für den Hinweis unter der Vorschau — der
 * Wortlaut von `DerivationNote.part`, gleiche Einträge nur einmal und in der Reihenfolge der
 * Zeichnung. Leer, wenn alles an einem Original vermessen ist.
 */
export function derivationParts(drawing: Drawing): string[] {
  return [...new Set((drawing.derivations ?? []).map((note) => note.part))];
}
