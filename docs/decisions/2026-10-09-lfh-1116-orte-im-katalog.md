# Abgeleitete Orte im Katalog der Website

> Stand: 9. Oktober 2026
> Status: umgesetzt (LFH-1116), Folgepunkt aus `2026-10-09-lfh-1065-orte-als-eigene-kennungen.md`
> (Abschnitt „Folgen“)

## Anlass

Seit dem 9. Oktober führt `core` die Orte mit eigener Kennung (`PLACES`, `drawPlace`): die
Leitstelle D.2.5 und vier abgeleitete Orte, Einsatzleitung, Technische Einsatzleitung,
Einsatzabschnittsleitung und Untereinsatzabschnittsleitung. Die Website zeigte sie nicht. Ihr
Katalog entsteht aus dem Coverage-Manifest, und jede Zeile dort hat einen BABZ-Abschnitt, eine
Quelle und einen Prüfstatus. Ein Ort ohne Original passt in dieses Schema nur, wenn man Daten
erfindet.

## Entscheidung

1. **Eine dritte Art.** `SymbolSummary.kind` bekommt neben `catalog-entry` („aus der Vorlage
   vermessen“) und `composition-recipe` („aus Grundzeichen zusammengesetzt“) den Wert
   `derived-place`, lesbar „abgeleitet aus der Leitstelle“. Die drei Beschriftungen stehen einmal,
   in `packages/website/src/lib/symbol-kinds.ts`.
2. **Keine Manifestzeile.** Die abgeleiteten Orte kommen in `buildSnapshot()` aus `PLACES`, nach
   den Manifestzeilen. Sie bekommen keine Zeile im Coverage-Manifest und keine in der Matrix;
   Referenzabdeckung und Prüfliste bleiben, was sie sind.
3. **Was an die Stelle tritt.**
   - **Abschnitt:** `derivedFrom`, die vermessene Manifestzeile, aus der der Ort seine Teile hat
     (heute `bbk-babz-2025:D.2.5`, Leitstelle). Gefunden wird sie über die Referenzdatei, die
     `PLACES` als Herkunft nennt, nicht über eine zweite Zuordnung. `sourceId` fehlt. Als Kapitel
     stehen die Orte in einer eigenen Gruppe „Abgeleitete Orte“, auf der Zeichenübersicht zuletzt.
     Im Kapitel des Originals („Anhang D.2“) stünden sie als Zeichen da, die die Vorlage führt.
   - **Quelle:** die Quelle dieser Zeile, ohne Seitenangabe. Die Zeichenseite schreibt dazu
     „abgeleitet aus ‚Leitstelle‘ (Anhang D.2, D.2.5)“.
   - **Prüfstatus:** technisch und fachlich `pending`, ohne Notiz. Das Review der Leitstelle gilt
     der Leitstelle, nicht dem Ort. Weil „nicht gegen die Vorlage nachgemessen“ hier keine Lücke
     beschreibt, sondern ohne Vorlage gar nicht geht, bekommt die Zeichenseite für diesen Fall
     einen eigenen Erklärsatz.
   - **Nachweise:** keine Nachweisarten, denn die hängen an der Prüfliste. Die Seite nennt
     stattdessen `core/src/places.test.ts`.
4. **Die Ableitung bleibt sichtbar.** Die Zeichnung trägt die Notizen aus `drawPlace`, auch die
   Ortsnotiz. Die Herkunft `from` läuft durch dieselbe Schwärzung wie die Reviewnotizen, weil die
   Website keine Referenzdateinamen ausliefert (Spec §5.3). Die Zeichenseite listet die Notizen
   unter „Bedeutung und Herkunft“.
5. **Explorer und Baukasten.** Der Explorer bekommt eine siebte Facette „Art“ (`?art=`). Der
   Baukasten findet die Orte über dieselbe Katalogsuche und sagt beim Laden, dass der Ort kein
   Original hat.
6. **Die Leitstelle bekommt kein Duplikat.** Sie bleibt die Manifestzeile D.2.5. `symbolForPlace`
   lehnt einen vermessenen Ort ab, und ein Test hält fest, dass `place.control-center` nicht im
   Snapshot steht.

## Verworfen

- **Den Ort in die Zeile D.2.5 hängen**, etwa als zweite Variante. Die Variante behauptet eine
  Darstellung derselben Vorlage, und der Prüfstatus der Leitstelle ginge auf den Ort über.
- **Einen vierten Prüfstatus** wie „nicht anwendbar“. Er liefe durch Statusmarken, Zähler,
  Facetten und die Coverage-Seite, und er stimmte nicht: fachlich lässt sich ein Ort sehr wohl
  prüfen, technisch an der Leitstelle nachmessen. Offen ist er trotzdem.
- **Die Orte unter „Anhang D.2“ einsortieren.** Dort steht heute kein einziges Zeichen mit eigener
  Seite (D.2 sind Elemente), die vier Orte wären also die ganze Gruppe eines Anhangs, der sie
  nicht kennt.

## Folgen

- Die Zeichenübersicht zählt 298 statt 294 Zeichen. „Fachlich geprüft sind X von Y“ zählt die
  Orte mit.
- Kommt ein weiterer Ort dazu, erscheint er ohne Änderung an der Website. Leitet er aus einer
  anderen Vorlage als der Leitstelle ab, stimmt die Beschriftung der Art nicht mehr und muss
  verallgemeinert werden.
