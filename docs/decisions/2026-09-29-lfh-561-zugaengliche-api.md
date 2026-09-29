# Zugängliche API: ein Zeichen beschreiben und bekommen, ohne Katalog

> Stand: 29. September 2026
> Status: **Umgesetzt**, mit Entscheidungen des Eigentümers vom 29. September 2026. Offene Punkte
> in Abschnitt 5.
> Initiative LFH-561 mit LFH-577 bis LFH-581 (Liste „Einsatzzeichen", `901525048064`).
> Bezug: `docs/decisions/2026-09-13-grammatik-motor-und-paketschnitt.md` (Scope), die Vorlagen
> `2026-09-28-lfh-565-…`, `2026-09-28-lfh-566-…`, `2026-09-28-lfh-567-…` und
> `2026-09-29-lfh-577-verband-5-5.md`

## 1. Was die Initiative liefert

| Ticket | Ergebnis in `@einsatzzeichen/core` |
|---|---|
| LFH-580 | `drawSymbol(spec)` und `DEFAULT_PORTS`: von der Spec zur Zeichnung ohne Prüfpaket. Quickstart, Beispiele, CLI und Baukasten brauchen `conformance` nicht mehr. |
| LFH-579 | `explainIssue`, `explainRejection`: Regel-ID, Titel, Erklärung, Feld, Begründung und Quelle. Die Regeltexte liegen in core; die Website ist Konsument. |
| LFH-581 | `symbolProvenance(spec)`: `verbatim` mit `claim: 'body-hull'` oder `derived`, aus einer generierten Tabelle (`pnpm cli provenance:table`, Drift-Gate in conformance). Der Reviewstand bleibt optional in conformance (`provenanceReview`). |
| LFH-578 | `vocabulary(spec, field)`, `checkSpec(spec)`, `SPEC_FIELD_VALUES`: welche Werte zur übrigen Spec passen, gerechnet über den echten Weg (`drawSymbol`). |
| LFH-577 | Kanonische Serialisierung (`serializeSpec`/`parseSpec`, URL-Form, Hülle `{"v":1,…}`); neue Felder `unitGrouping`, `states`, `tendency`; freistehende Spec-Art (`FreestandingSpec`, `drawAnySpec`); Vermessung an den Referenzdateien. |

## 2. Entscheidungen des Eigentümers (29. September 2026)

1. **Freistehende Zeichen** (Pfeile 5.2, Linien und Grenzen 2.14–2.20, Wetter 5.8.7, Tierzustand
   5.8.6) bekommen eine eigene Spec-Art neben `SymbolSpec`, mit Art-Diskriminator und gemeinsamem
   Codec.
2. **Zustände** stehen in `states`, die **Tendenz** in einem eigenen Feld `tendency`. 5.8.8 ist ein
   Zustand am Grundzeichen `person`.
3. Die Empfehlungen der LFH-565-Vorlage gelten: höchstens ein Wert je Skala 5.8.2–5.8.5; 5.8.1 nur
   an `person`, bis ein Original einen anderen Träger belegt (die Originale belegen die Hinweise
   „?" und „!" auch an `hazard`); höchstens eine Tendenz.
4. **Verband 5.5 und Sonderformen 3.6–3.9** werden vermessen und gebaut statt zurückgestellt. Die
   Referenzdateien liegen im Hauptcheckout; die Vorlagen vom 28. September hatten nur am
   Kennzahlenartefakt abgelesen.
5. **Größen-Gate:** Kommentare im Build wegzulassen nur, wenn die Doku im npm-Paket bleibt.
   `removeComments` entfernt auch die JSDoc aus den `.d.ts`, deshalb ist die Grenze angehoben
   (gepackt 650 000 B, entpackt 6 950 000 B; Begründung in `scripts/gates/core-package.mjs`).
6. Die neue Querschnittsform von `LINE_GEOMETRY` (seit 1.8.0) gilt als **Ausnahme im Minor**.
7. **Grenzen als Regeln:** höchstens ein Hinweis, höchstens ein 5.8.8-Wert, 5.8.8 zusammen mit
   einem Hinweis zulässig, keine Taktik 5.8.1.1–4 an einem Träger. Wetter: Wolke und ein
   Niederschlag; Regen, Hagel und Gewitter werden **wie Schnee** gebaut (übertragen, als `decided`
   gekennzeichnet).
8. Die sechs Rezepte mit Verband I/II (I.1.4, F.1.1, F.1.3, F.1.13, F.1.21, E.1.31) ziehen von der
   technischen Kopfmarke auf `unitGrouping` um.

## 3. Entscheidung des Orchestrators, zur Bestätigung

Beim Umzug nach Punkt 8 ändern sich die sechs Snapshots **ausschließlich im `<desc>`**: statt
„Technische Kopfmarke: Zwei Vertikalbalken" steht dort „Verband: Verband II". Die Zeichnung ist
identisch (per Skript mit neutralisiertem `<desc>` geprüft; ein Test hält fest, dass alte und neue
Spec dieselben Zeichnungskinder liefern). Die Alternative wäre eine wissentlich falsche Beschreibung
für Screenreader gewesen. **Vom Eigentümer am 29. September 2026 bestätigt.**

## 4. Befunde, die Annahmen korrigieren

- Die Beispiele zu 5.8.1 zeigen keine Taktik, sondern den Hinweis „?" neben der verkleinerten,
  verletzten Person. Einen Seitenwechsel je Wert gibt es nicht.
- Drohne (3.6) und Giebel (3.9) sind nach den Anhängen Marken, keine Körperform. Die graue Fläche an
  3.9 ist der Platzhalterkreis; gemessen war der Giebel.
- 5.2.1 hat zwei Schäfte; 2.14–2.16 sind Striche mit wiederholten Marken, keine Flächen; die
  Intensität beim Wetter ist die Anzahl der Flocken.
- `compose` zeichnet reihenfolgeabhängig: vertauschte `bodyMarks` ändern Übermalung und `<desc>`.
  Die Serialisierung erhält deshalb die Reihenfolge, `specKey` sortiert weiter.

## 5. Offen beim Eigentümer

> Am 29. September 2026 hat der Eigentümer die Empfehlungen dieses Abschnitts bestätigt („passt
> was du geschrieben hast"). Umsetzung von Punkt 2, 3, 6 und 7 als Folgeaufgaben (LFH-798,
> LFH-799, LFH-800, LFH-801); Punkt 4 und 5
> bleiben, wie empfohlen, ungezeichnet.

Die Einzelfragen stehen in den Vorlagen (LFH-565 §9 und §10.3, LFH-566 §7, LFH-567 §5,
Verband §6). Die wichtigsten, je mit Empfehlung:

1. **Snapshot-`<desc>`** (Abschnitt 3): bestätigen.
2. **Nicht zeichenbare Werte aus 5.8:** Taktiken 5.8.1.1–4, 5.8.1.5–12, 5.8.2, 5.8.5, 5.8.9 und die
   Tendenz lassen sich über keine Spec zeichnen, ebenso die Einzelpiktogramme Kommunikation,
   Schaden, Vegetationsbrand, Führung und Wasserrettung. *Empfehlung:* eine freistehende Art
   `{ kind: 'state', state }` für die Einzeldarstellung — sie ist durch die Kapiteldatei selbst
   belegt. Erweitert Entscheidung 1, deshalb hier.
3. **Reihenfolge der Körpermarken:** bedeutsam oder ein Fehler in `compose`? *Empfehlung:* `compose`
   ordnet nach dem Bausteinregister; dann ist die Reihenfolge bedeutungslos und `specKey` stimmt
   auch für das Bild. Ändert `<desc>` in Snapshots.
4. **Verband III:** kein Original am Körper. *Empfehlung:* offen lassen, bis eines auftaucht.
5. **Tendenz am Träger:** kein Original. *Empfehlung:* nicht zeichnen.
6. **Wetter:** Blitz auf ein Drittel verkleinert wirkt verschwommen (Alternative drei Viertel);
   andere Wetterpaare als Regelverstoß statt Lücke. *Empfehlung:* nur Wolke und ein Niederschlag
   zulassen, alles andere als Regel ablehnen.
7. **Baukasten:** Die Zustandsliste zeigt alle 61 Werte, auch die immer gesperrten (Wetter, Tier,
   Tendenz). *Empfehlung:* nur anhängbare Werte zeigen.

## 6. Folgeaufgaben

- `baseAreaMm` geht nicht in `Drawing` über: beim Hinweis an der Person liegt die Mitte der
  Zeichenfläche 2 mm neben der Mitte der Grundfläche (Anker in MapLibre und QGIS).
- `08-persons.ts` auf `movementDrawing` und `anchoredMovementPath` umstellen (5.8.8.12–14).
- Vokabular je Wert für freistehende Zeichen (heute Wertevorrat und `checkAnySpec`).
- Verlaufsfehler (zu kurz, außerhalb der Fläche) werfen ein gewöhnliches `Error` und sind nicht
  erklärbar; als Kompositionsregeln mit Kennung führen.
- `pnpm cli coverage` zählt nur die 77 Prüfregeln der `SymbolSpec`, nicht die freistehenden.
- `provenance:table` schreibt relativ zum aktuellen Verzeichnis; nur im Repository erlauben.
- Technische Kopfmarken nutzt kein Rezept mehr (Abdeckung 0/2): behalten oder als veraltet markieren.
