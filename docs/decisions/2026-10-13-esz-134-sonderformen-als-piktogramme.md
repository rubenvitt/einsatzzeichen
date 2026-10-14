# Sonderformen 3.6 bis 3.8 als Piktogramme, die Drohne im Körper als Körpermarke

> Stand: 13. Oktober 2026
> Status: Entscheidung zu ESZ-134 (Zunder), im Rahmen der Eigentümerentscheide vom 28./29.09.2026
> (LFH-567) und 10.10.2026 (LFH-798). Anlass: Lifeline Hub LLH-1159, „Bibliothek zuerst“.

## Anlass

Die Sonderformen 3.6 Drohne, 3.7 Zweirad und 3.8 Zweirad motorgetrieben sind seit LFH-577 an den
Referenzdateien vermessen und gezeichnet (`core/src/geometry/special-form-bodies.ts`), aber über
keine Spec erreichbar: sie haben weder eine `SymbolKind` noch eine `PictogramId`. Der Lifeline Hub
braucht sie für freie Lagekarten-Zeichen (Alt-Grundzeichen `zweirad`, `fahrrad`, `kraftrad`,
Alt-Symbol `drohne`) und bildet sie bis dahin näherungsweise ab.

Das Ticket ließ zwei Wege offen: ein eigener Piktogrammraum `special-form.*`, freistehend über die
Art `pictogram`, oder eine `SymbolKind` je Sonderform (LFH-567, Frage 7).

## Entscheidung

1. **Ein Piktogrammraum `special-form.*` mit drei Kennungen:** `special-form.drone`,
   `special-form.two-wheeler`, `special-form.motorized-two-wheeler`. Freistehend über
   `{ kind: 'pictogram', pictogram: 'special-form.drone' }`. Gezeichnet wird genau die Kapiteldatei,
   mit denselben Primitiven wie `specialFormDrawing()` (Rolle `pictogram` statt `body`). Die Box ist
   die Hülle der Körperzone aus `SPECIAL_FORMS`: 4/10/24/12 mm für die Drohne, die Tintenhülle
   9,75/3,75/12,5/24,25 mm für die Zweiräder.
2. **Keine `SymbolKind`.** Es bleibt bei der Empfehlung aus LFH-567 (Nachtrag 29.09.2026): keine
   Referenzdatei setzt eine der drei Formen als Körper mit Kopf, Fuß oder Beschriftung ein. Eine
   Körperart hätte außer dem Körper keine einzige belegte Zone und würfe an jeder anderen Stelle
   `NotMeasuredError`. Die freistehende Art kommt ohne Zonen aus.
   *Nachtrag 14.10.2026 (ESZ-142):* Für die beiden Zweiräder revidiert. Sie sind zusätzlich
   Körperarten mit abgeleiteten Zonen (`2026-10-14-esz-142-zweirad-als-koerperart.md`); das
   Piktogramm bleibt. Für die Drohne gilt dieser Punkt weiter.
3. **3.9 steht nicht im Raum.** Die Kapiteldatei zeigt den Giebel über einem Platzhalter für
   „irgendein Grundzeichen“; allein gezeichnet wäre er ein Dach ohne Träger. Am Körper ist er die
   Variante `circle-12`/`raised-gable`.
4. **Die Drohne im Körper bleibt Körpermarke.** Eine Achse „Innen-Piktogramm“ in `SymbolSpec` gibt
   es nicht (Entscheidung vom 10.10.2026, Punkt 4). Die Drohne ist an drei gebauten Originalen als
   eigene, dort vermessene Körpermarke beschreibbar; `DRONE_BODY_MARKS` nennt sie:

   | Original | Körper | Körpermarke | zeigt |
   |---|---|---|---|
   | I.1.20 Trupp Drohne | `formation` | `formation-chevron-top` | den Winkel allein |
   | F.1.16 Drohnentrupp | `formation` | `chevron-over-opposed-triangles` | den Winkel über zwei Dreiecken |
   | C.2.31 geschützte Löschdrohne | `vehicle-land`/`inverted-hull-track` | `track-chevron-top` | den Winkel über der Löschmarke |

   Für „Drohne in einer Formation“ ohne weiteren Inhalt ist `formation-chevron-top` die Marke. An
   anderen Körpern zeichnet der Motor sie abgeleitet (`Drawing.derivations`). Ein einheitliches Maß
   bekommt die Marke nicht: die fünf Originale widersprechen einem (LFH-567, Eigentümerfrage 1).
5. **Herkunft.** Das Bild ist wörtlich die Kapiteldatei. Dass die Formen freistehend verwendet
   werden, belegt die Referenz nicht; die Fachfrage `Q-3-sonderformen` hält das offen, die drei
   Manifestzeilen 3.6 bis 3.8 stehen fachlich auf `pending`.
6. **Versionierung:** neue Kennungen in `PictogramId` und `PICTOGRAM_IDS`, ein Minor-Release. Das
   Format bleibt `{"v":1}`; ein alter Leser lehnt die neue Kennung mit Pfad ab.

## Was offen bleibt

- C.1.13 Flugdrohnentrupp und C.1.14 Drohnentrupp Feuerwehr zeigen die Drohne ebenfalls (Winkel
  18 mm breit), sind aber nicht gebaut. Mit ihnen kämen zwei weitere Körpermarken dazu.
  **Erledigt mit ESZ-143** (14.10.2026): beide gebaut, `DRONE_BODY_MARKS` führt fünf Fassungen,
  siehe `2026-10-14-esz-143-drohnentrupps-der-feuerwehr.md`.
- Ob die Zweiräder über das freistehende Zeichen hinaus eine Körperform oder eine Marke am
  Landfahrzeug sind, bleibt die Frage aus `SPECIAL_FORMS` (Bezug ESZ-117).

## Verworfen

- **`SymbolKind` je Sonderform:** ein Angebot im Vokabular, das der Motor an keiner Zone außer dem
  Körper einlösen kann (Begründung in LFH-567, Frage 7).
- **Eine eigene freistehende Art `special-form`:** verworfen wie „eine Art je Raum“ in LFH-798;
  `FREESTANDING_KINDS` und die Leser wüchsen mit jedem Raum.
- **Ein generisches Innenzeichen „Drohne“ mit einheitlichem Maß:** kein Original zeigt es so.
