# Fehlende Fahrzeugkörper: Behälter, Zweirad, Amphibienfahrzeug

> Stand: 13. Oktober 2026
> Status: Entscheidung des Eigentümers vom 13. Oktober 2026 (ESZ-117: „Alle acht als Arten“).
> Anlass: Lifeline Hub, Abbildung der Fahrzeugtypen auf Körper. Für zweirad, fahrrad, kraftrad,
> abrollbehaelter, wechselbehaelter, wechselbruecke, rollcontainer, wechsellader-wechselbehaelter,
> anhaenger-abrollbehaelter, anhaenger-wechselbehaelter und amphibienfahrzeug gab es keinen Körper.

## Befund je Körper

Die Referenz (BABZ, SVG-Bestand 2025) führt jeden der genannten Körper. Keiner war begründet
auszuschließen.

| Typ im Hub | Abschnitt | Ergebnis |
|---|---|---|
| zweirad, fahrrad | 3.7 Zweirad | schon vermessen und gezeichnet, als Sonderform |
| kraftrad (Krad, Motorrad) | 3.8 Zweirad motorgetrieben | schon vermessen und gezeichnet, als Sonderform |
| wechsellader-wechselbehaelter (Abrollbehälter) | 5.1.1.8 | neue Art `roll-off-loader` |
| wechsellader-wechselbehaelter (Wechselbehälter) | 5.1.1.9 | neue Art `swap-container-carrier` |
| anhaenger-abrollbehaelter | 5.1.2.2 | neue Art `roll-off-trailer` |
| anhaenger-wechselbehaelter | 5.1.2.3 | neue Art `swap-container-trailer` |
| abrollbehaelter | 5.1.3.1 | neue Art `roll-off-container` |
| wechselbehaelter | 5.1.3.2 | neue Art `swap-container` |
| wechselbruecke | 5.1.3.3 | neue Art `swap-body` |
| rollcontainer | 5.1.3.4 Zieh- und schiebbar | neue Art `wheeled-container` |
| amphibienfahrzeug | 5.1.1.4 | schon gezeichnet (Fahrwerk `amphibienfahrzeug`) |

## Entscheidung

1. **Alle acht Behälterzeichen aus Kapitel 5.1 werden eigene Körperarten** (`SymbolKind`), mit
   Organisationsfarbe, Beschriftung und Innenfeld wie jede andere Art. Die Alternative, nur die
   vier Behälter aus 5.1.3 als Arten zu führen und die Träger zusammenzusetzen, scheitert an der
   Referenz: keine der acht Dateien ist eine Verschiebung einer anderen (drei verschiedene
   Deckkurven des Abrollbehälters, drei verschiedene Rechteckhüllen des Wechselbehälters, zwei
   Größen der Eckbeschläge).
2. **Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert**
   (`packages/core/src/geometry/container-bodies.ts`). Die Füllebene trägt in allen acht Dateien
   die Mittellinie; die Strichebene bestätigt sie. Bögen sind als Viertelkubiken genähert, weil
   das Kommando-Gate kein `A` kennt.
3. **Was zum Zeichen gehört, aber nicht Körper ist, fährt als `bodyExtra` mit**: L-Rahmen der
   Kraftfahrzeugträger, Rahmen und Deichsel der Anhängerträger (zahlengleich mit 5.1.2.1), Öse des
   Abrollbehälters, Eckbeschläge des Wechselbehälters, Stützbeine der Wechselbrücke und die beiden
   Rollen des Rollcontainers. Die Rollen sind Teil der Form und kein Fahrwerk.
4. **Fahrwerk.** Die beiden Kraftfahrzeugträger tragen die Fahrwerkszone unter dem Rahmen
   (y 26,0); die Referenz zeigt dort zwei Räder, zahlengleich mit `kfz-kategorie-1`. Die beiden
   Anhängerträger zeigen wie 5.1.2.1 kein Rad; ihre Fahrwerkszone ist vom Anhängerrumpf
   übertragen und an keiner eigenen Datei vermessen. Die vier Behälter tragen kein Fahrwerk.
5. **Zonen** (Beschriftung, Innenfeld, Kopfzone) sind vom Rechteckkörper übertragen
   (`rectBodyProfile`) und im Zonenmodell als nicht vermessen geführt; keine der acht Dateien
   zeigt eine Beschriftung.
6. **Zweirad bleibt Sonderform.** 3.7 und 3.8 sind seit LFH-577 vermessen und über
   `specialFormDrawing('two-wheeler' | 'motorized-two-wheeler')` zeichenbar. Sie tragen keine
   Organisationsfarbe und kein Fahrwerk; als zusammensetzbare Art bräuchten sie einen eigenen
   Zonenvertrag. Das ist eine eigene Aufgabe und nicht Teil dieser.
   *Nachtrag 14.10.2026 (ESZ-142):* Beide sind jetzt Körperarten, `two-wheeler` und
   `motorized-two-wheeler`, mit Farbe im Strich und Läufen außen
   (`2026-10-14-esz-142-zweirad-als-koerperart.md`).
7. **Amphibienfahrzeug bleibt, wie es ist.** Das Fahrwerk wird seit dem 2. Oktober 2026 gezeichnet
   (Wellenlinie aus beiden Strichkanten konstruiert, als Ableitung gemeldet). Die Angabe im Ticket,
   es werfe `NotMeasuredError`, ist überholt. Der Pixelvergleich gegen `5.1.1.4` vom
   13. Oktober 2026 liegt bei 0,08 % Fläche und 1,07 % Strichanteil, also deckungsgleich. Den
   Status „nicht vermessen“ im Blockregister ändert das nicht: die Kurvenform der Welle bleibt
   konstruiert.

## Nachweis

- Fingerprint-Gate: jeder Körper gegen die eigene Belegdatei (`recipes-kapitel-5-1.ts`,
  `base-symbols.test.ts`).
- Zusatzgeometrie an den vermessenen Mittellinien festgehalten (`base-symbols.test.ts`).
- Pixelvergleich (`pnpm cli reference-diff --filter 5.1`): alle acht deckungsgleich, größter
  Strichanteil 1,23 % (5.1.3.1).
- Umfang: `5.1.2.2`, `5.1.2.3` und `5.1.3` stehen im beanspruchten Umfang; die zurückgestellten
  Einträge für 5.1.1.8 und 5.1.1.9 entfallen. Das Fachreview der acht Zeilen ist offen.

## Hinweis für den Lifeline Hub

| Typ im Hub | Spec |
|---|---|
| abrollbehaelter | `{ kind: 'roll-off-container' }` |
| wechselbehaelter | `{ kind: 'swap-container' }` |
| wechselbruecke | `{ kind: 'swap-body' }` |
| rollcontainer | `{ kind: 'wheeled-container' }` |
| wechsellader-wechselbehaelter | `{ kind: 'roll-off-loader' }` oder `{ kind: 'swap-container-carrier' }`, je nach Aufbau |
| anhaenger-abrollbehaelter | `{ kind: 'roll-off-trailer' }` |
| anhaenger-wechselbehaelter | `{ kind: 'swap-container-trailer' }` |
| zweirad, fahrrad | `{ kind: 'two-wheeler' }` (seit ESZ-142) |
| kraftrad | `{ kind: 'motorized-two-wheeler' }` (seit ESZ-142) |
| amphibienfahrzeug | `{ kind: 'vehicle-land', vehicleCategory: 'amphibienfahrzeug' }` |
