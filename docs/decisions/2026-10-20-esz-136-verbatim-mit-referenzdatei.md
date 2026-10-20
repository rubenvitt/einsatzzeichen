# Herkunft: Specs, die genau eine Kapiteldatei zeichnen, sind verbatim

> Stand: 20. Oktober 2026
> Status: umgesetzt mit ESZ-136 (vormals LFH-1303), Minor-Release.
> Bezug: `2026-10-10-lfh-798-freistehende-zustaende-und-piktogramme.md` (Punkt 3, Kanonik),
> `2026-10-02-ableiten-statt-messsperre.md` (Punkt 3).

## Anlass

Seit LFH-798 lehnen `state` und `pictogram` ein Bild ab, das schon eine andere Spec zeichnet, und
nennen diese Spec. Drei Gruppen der Ziele sind `SymbolSpec`s:

- 17 Personenzustände 5.8.8 als `{ kind: 'person', states: [zustand] }`,
- die zweiten Darstellungen der Hinweise 5.8.1.13 und 5.8.1.14 als
  `{ kind: 'hazard', states: [hinweis] }`,
- die Leitstelle D.2.5 als Spec ihres Orts (`PLACES['control-center']`).

`symbolProvenance` meldete für alle 20 `derived`, weil die Herkunftstabelle nur aus den Rezepten
entstand. Ein Verbraucher sah damit `derived` für ein Bild, das wörtlich die Kapiteldatei ist,
während das umgeleitete freistehende Zeichen `verbatim` gemeldet hätte. Den normalen
Körpervergleich bestehen zudem nur 13 der 17 Personenzustände: 5.8.8.12 bis 5.8.8.14 und 5.8.8.16
führen im Kennzahlenartefakt nur eine Umrisshülle.

## Entscheidung

1. **Zweite Belegquelle mit eigenem `claim`.** `SymbolProvenance` bekommt neben
   `claim: 'body-hull'` (mit `fixture`) die Form
   `{ status: 'verbatim', claim: 'reference-file', section, referenceAsset }`. Das ist genau die
   Form, die `freestandingProvenance` für Registerbilder meldet. Ziel und umgeleitetes Zeichen
   melden damit denselben Wert; `AnySpecProvenance` bekommt keine neue Form.
2. **Beleg ist der Geometrievergleich mit dem gegateten Registerbild.** Kandidaten sind die
   kanonischen `SymbolSpec`-Ziele von `freestandingRedirect`. Aufgenommen wird eine Spec nur, wenn
   ihre Zeichnung keine Ableitungsnotiz trägt und der Einzeldarstellung aus dem Register in
   Zeichenfläche, Primitiven und Stil gleicht, bis auf die Rolle (`body` statt `pictogram`) und
   auf 0,001 mm. Die Registerbilder sind in ihren Suiten gegen das Kennzahlenartefakt gegatet. Das
   prüft conformance beim Erzeugen der Tabelle (`referenceFileIndex`), nicht core zur Laufzeit.
3. **Eine Spec hat genau einen Beleg.** Die Personenzustände, die auch den Körpervergleich
   bestehen würden, stehen nur mit `reference-file`: Der Beleg ist stärker als die Körperhülle.
   Trüge ein Schlüssel beide Belege, bricht der Generator ab.
4. **Die Leitstelle D.2.5 belegt die Körperhülle.** Ihr Ort setzt das Kürzel „LtS“ aus der
   Grammatik (10,61 mm bei x 16), das Register mit 10 mm bei x 16,238 (Entscheidung vom
   10.10.2026, `freestanding-canon.test.ts`). Die Geometrie ist also nicht gleich, der
   Körpervergleich besteht aber (`leitstelle-d25.test.ts`). Jeder Ort aus `PLACES` mit
   `basis: 'measured'` ist deshalb eine Fixture mit Körpervergleich; ihre Kennung ist der Abschnitt.
   Eine Manifestzeile `recipe.D.2.5` gibt es nicht, `provenanceReview` liefert dort `undefined`.
5. **Reviewstand für `reference-file`** ist der der Manifestzeile des Registerbilds (gleicher
   Abschnitt, gleiche Referenzdatei).
6. **Eine generierte Datei, zwei Tabellen.** `verbatim-table.generated.ts` führt
   `VERBATIM_TABLE` (Körperhülle, jetzt 290 Zeilen) und `REFERENCE_FILE_TABLE` (19 Zeilen).
   `pnpm cli provenance:table` schreibt beide, `verbatim-table-drift.test.ts` prüft beide.

## Folgen

- 20 Specs wechseln von `derived` auf `verbatim`. Das ist die beabsichtigte Korrektur.
- Die neue Form in der Union ist für TypeScript-Verbraucher ein Minor wie `legacy` in
  `FreestandingProvenance` (ESZ-137): Wer nach `status === 'verbatim'` auf `fixture` zugreift,
  prüft vorher `claim === 'body-hull'`.

## Verworfen

- **`fixture` mit dem Abschnitt füllen statt eines Felds `section`:** bräche keinen Zugriff, hieße
  aber für Registerbilder „Fixture“, obwohl sie keine Fixture des Prüfpakets sind, und gäbe dem
  Ziel eine andere Form als dem umgeleiteten Zeichen.
- **Die Personenzustände über den Körpervergleich führen:** 4 der 17 bestehen ihn nicht, und er
  belegt weniger, als die Zeichnung tatsächlich ist.
- **Die Leitstelle als `reference-file`:** Die Geometrie gleicht dem Registerbild nicht.
