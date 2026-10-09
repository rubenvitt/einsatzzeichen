# Orte mit eigener Katalogkennung (Muster Leitstelle D.2.5)

> Stand: 9. Oktober 2026
> Status: umgesetzt (LFH-1065), Folgepunkt der Entscheidung vom 2. Oktober 2026
> („Ableiten statt Messsperre“, `2026-10-02-ableiten-statt-messsperre.md`)

## Anlass

Das Fachreview vom 5. Oktober 2026 (Punkt 7) hat entschieden: Eine Funktion an Stelle oder
Gebäude wird **nicht** über „Funktion an der Stelle“ gebaut. `function-role-requires-measured-kind`
bleibt Systematik, denn eine Funktion ist Person oder Formation. Ein Ort, an dem eine Leitung sitzt,
bekommt stattdessen eine eigene Kennung, so wie die Leitstelle D.2.5 eine Körperform ist
(12-mm-Kreis mit Giebel und Kappe) und keine Funktion.

Nachgelesen am 9. Oktober 2026 (4.3.0): Eine „Einsatzleitung als Ort“ war als Spec schon baubar,
mit dem Körper der Leitstelle und „EL“ in deren Laufgröße. Der Motor zeichnete sie **ohne**
Ableitungsnotiz, weil jede einzelne Dimension vermessen ist. Ein Original für das Ganze gibt es
aber nicht.

## Entscheidung

1. **Welche Orte.** Einen Ort bekommt jede Leitung, die als Rolle an der Person **und** als
   Führungsstelle an der Formation vermessen ist: Einsatzleitung (EL), Technische Einsatzleitung
   (TEL), Einsatzabschnittsleitung (EAL), Untereinsatzabschnittsleitung (UEAL). Die
   Katastrophenschutzleitung hat keine Person und bleibt außen vor; die Befehlsstelle D.1.1 ist
   selbst schon der Ort der Führung. (Ruben, 9. Oktober 2026)
2. **Welche Form.** Wie D.2.5: 12-mm-Kreis mit Giebel („ortsfest“, Kapitel 3.9) und Kappe, gelb für
   Führung und Leitung, das Kürzel der vermessenen Führungsstelle schwarz. Ohne Giebel wäre auch die
   Kappe abgeleitet, denn sie ist nur an der Giebelfassung vermessen.
3. **Laufgröße.** „EL“ trägt Versalhöhe 7,30 und Grundlinie 8 der Leitstelle. TEL, EAL und UEAL
   bekommen die Größe, die der Motor am Kreis ableitet (Notiz `labels.center`).
4. **Mechanik.** `PLACES` und `drawPlace(id)` in `core`, `PlaceId`/`PLACE_IDS` in `schema`. Die
   Leitstelle steht als einziger vermessener Ort im Register. An jeden anderen Ort hängt
   `drawPlace` nach den Notizen des Motors eine eigene Notiz (`dimension: 'place'`,
   `from: 'D.2.5_Leitstelle.svg'`). Kein neues `SymbolSpec`-Feld, keine neue Regel; die Änderung
   ist additiv.

## Verworfen

- **Funktion an der Stelle zulassen.** Vom Fachreview ausgeschlossen. Die Funktionsfassungen sind
  Rechteck- und Personenlayouts, an einem Kreis hätten sie keine Geometrie.
- **Orte als Piktogramm oder Rezept.** Beides behauptet eine Vorlage: Piktogramme sind gegen ihre
  Referenzdatei gegatet, Rezepte tragen keine Ableitungsnotiz
  (`conformance/src/recipes-derivations.test.ts`).
- **Ein neues Feld `place` in der Spec.** Es wäre eine zweite Achse für etwas, das die vorhandenen
  Achsen schon ausdrücken.

## Folgen

- Die Website zeigt die Orte noch nicht. Ihr Katalog entsteht aus dem Coverage-Manifest, also aus
  Zeilen mit BABZ-Abschnitt und Prüfstatus. Ein Ort ohne Original braucht dort eine eigene Art,
  das ist ein eigener Schritt.
  Umgesetzt am selben Tag: `2026-10-09-lfh-1116-orte-im-katalog.md`.
- Tests: `core/src/places.test.ts`. `conformance/src/leitstelle-d25.test.ts` prüft jetzt die Spec
  des Registers gegen das Original statt einer Kopie.
