# Ableiten statt sperren: der Motor zeichnet jede zulässige Kombination

> Stand: 2. Oktober 2026
> Status: Entscheidung des Eigentümers, umgesetzt am 2. Oktober 2026 (Major-Release)

## Anlass

Eine ortsfeste Leitstelle ließ sich im Baukasten nicht bauen. An der Funktionsstelle saß der
mittige Lauf 3,6 mm unter der Kreismitte, das Kreiskürzel unten rechts lag außerhalb des Kreises,
auf Gelb stand weiße statt schwarzer Schrift. Und fast jedes weitere Feld war gesperrt, mit der
Begründung „nicht vermessen“. Die Leitstelle selbst steht als D.2.5 im Referenzbestand. Der Motor
lehnte sie trotzdem ab, weil `circle-12-requires-hilfsorganisation` den 12-mm-Kreis an die weiße
HiOrg-Fassung band.

Die Entscheidung vom 13. September 2026 (`2026-09-13-grammatik-motor-und-paketschnitt.md`) endet
mit dem Satz: Der Motor lehnt eine Kombination nur noch ab, wenn eine **Regel** sie verbietet,
und nicht mehr, weil kein Original sie belegt. Umgesetzt war das nicht. Eine Bestandsaufnahme vom
2. Oktober hat 91 Regelkennungen gezählt. 30 davon sind reine Messsperren, 10 enthalten einen
Messsperrenteil. Dazu kommen rund 30 Würfe von `NotMeasuredError` ohne Regelkennung. Von 74 613
Einfeldkombinationen (jede Art × Variante mit genau einem weiteren Feld) zeichnete der Motor 684.

## Entscheidung

1. **Der Baukasten trägt alle Kombinationen, die die Systematik zulässt.** Abgelehnt wird nur,
   was eine fachliche Regel verbietet (etwa „Stärke nur an taktischen Einheiten“) oder was als
   Eingabe kaputt ist (leerer Lauf, Zahl ≤ 0, Text außerhalb der Hülle).
2. **Lücken werden abgeleitet.** Grundlage ist die nächstliegende vermessene Fassung: verschoben,
   skaliert oder gespiegelt (`transferred`). Wo es keine Vorlage gibt, folgt die Lage einer Regel
   (`constructed`).
3. **Abgeleitetes ist gekennzeichnet.** `Drawing.derivations` nennt je Teil Dimension, Teil,
   Grundlage und Quelle. `vocabulary()` markiert solche Werte mit `derived: true`.
   `symbolProvenance()` meldet weiterhin `derived` für jede Spec ohne Original. Die Notizen sind
   die feinere Körnung darunter und keine neue Bedeutung des Worts.
4. **Offene Fachfragen werden zugelassen und abgeleitet**, bis ein Fachreview anders entscheidet.
5. **Alles in einem Zug**, nicht dimensionsweise über Wochen.

## Was diese Entscheidung umkehrt

- **LFH-787 „AB“ (29.09.2026):** Kapitel-4-Piktogramme an Körpern ohne vermessene Inset-Fassung
  werden eingepasst, nicht abgelehnt.
- **Verband III:** Der Vorschlag `UNIT_GROUPING_III_PROPOSAL_CX_MM` wird übernommen.
- **Amphibienfahrzeug:** Die Wellenlinie wird aus der Strichhülle konstruiert. Die Vorgabe
  „nicht nähern“ entfällt.
- **Kreis mit Kopfzone:** Das gemessene Negativ (109 × 36 Dateien, Schnittmenge leer) bleibt als
  Befund stehen. Gezeichnet wird trotzdem, abgeleitet.
- **Weiße Schrift auf Gelb:** Das ist eine Korrektur nach Quelle, keine Ableitung. Alle 20 gelben
  Referenzen mit Typo setzen Schwarz.

## Was bleibt

- `function-role-requires-measured-kind` ist Systematik, trotz des Namens. Eine Funktion ist eine
  Festfassung mit fester Trägerart (Person oder Formation). Die Funktionsstelle trägt deshalb
  weiterhin keine „Funktion“. Eine Leitstelle ist eine **Körperform** (12-mm-Kreis mit Giebel und
  Kappe), keine Funktion.
- `state-tactics-not-allowed`, `strength-requires-unit`, `technical-fill-organization-conflict`,
  `plain-wheel-pair-chassis-conflict` und die übrigen Systematikregeln.
- Alle Eingabeprüfungen.

## Offene Fachfragen, vorläufig „zulassen, abgeleitet“

Für diese Fragen fehlt ein Fachreviewer (LFH-406):

- Fahrzeugkategorie am Luftfahrzeug.
- Ereignis mit Organisation.
- Welche Träger eine Verwaltungsstufe tragen.
- Zwei Gefahrenhinweise zugleich.
- Giebel („ortsfest“) über anderen Trägern als dem Kreis.

## Umsetzung

Das Fundament legt `Drawing.derivations`, `noteDerivation()` und `withoutDerivationNotes()`
(`core/src/derive/record.ts`), die Körperhülle jeder Form (`derive/body-bounds.ts`) und den
Zensus `scripts/census/derived-census.mts`. Gemessen werden darin alle 33 Grundformen mit je
einem weiteren Feld, mit Geometrieprüfung: keine NaN, alles in der ViewBox, abgeleitete
Piktogramme in der Körperhülle, der Kopf frei von allem anderen.

| Stand | gezeichnet | davon abgeleitet | Geometrieverstöße |
|---|---:|---:|---:|
| vorher (3.0.0) | 684 von 74 613 | 0 | 0 |
| nachher | 20 345 von 74 822 | 19 515 | 0 |

Die Zahl der Kennungen in `validate.ts` sinkt von 79 auf 50. Vermessene Zeichen bleiben
bytegleich: Alle Snapshots, Fingerabdrücke und 280 Rezepte zeichnen ohne Ableitungsnotiz,
das sichert ein eigenes Gate (`conformance/src/recipes-derivations.test.ts`).

Was je Dimension abgeleitet wird:

- **Kreise und Leitstelle** (`derive/circle.ts`):
  - Der mittige Lauf steht mit der Versalmitte auf der Kreismitte. D.2.3, D.2.4 und D.2.5
    bestätigen das auf ±0,65 mm, die vermessenen Grundlinien bleiben als Override.
  - Eckkürzel stehen auf der Kreissehne.
  - Schwarz auf Gelb folgt der Quelle.
  - Jede Organisation am 12-mm-Kreis und an der reduzierten Hauskontur.
  - Giebel, angehobener Kreis und Fußband auch an der Funktionsstelle.
  - Kopfzone über dem Kreis.
  - Neue Körpermarke `circle-solid-cap-4mm`, die Kappe der Leitstelle. D.2.5 ist als
    SymbolSpec baubar und gegen das Original geprüft (`conformance/src/leitstelle-d25.test.ts`).
- **Körpervarianten** (`derive/body-variant-pairs.ts`, `body-variants.ts`):
  - Fußband und Giebel an jeder Art, an der sie geometrisch Platz finden.
  - Radpaar und Kettenrumpf an Anhänger und Wechsellader.
  - Weiße Innenkontur an jedem flächigen Körper: halbe Strichbreite plus 0,75 mm, gemessen an
    E.1.1 und E.2.27.
  - Artgebundene Formen bleiben Systematik: Rümpfe, Flügel, Personrauten.
- **Kopfzone** (`derive/head-zone.ts`):
  - Alle sechs Verwaltungsstufen. Die Sternzahl ist an 5.7.1 bis 5.7.5 nachgezählt, die Lage
    abgeleitet.
  - Verband III (Vorschlag x 12/16/20) und Verband an jedem Grundzeichen.
  - Kopfmarke auch an der Person.
  - Zusatzgeometrie folgt dem Körper unter den Kopf. Der Kopfabstand gilt ab der Oberkante der
    ganzen Grundzeichnung.
- **Funktionsrollen** (`derive/function-roles.ts`):
  - Leitungsrollen in jeder Organisationsfarbe.
  - Zusätzlicher Kopf an kopffreien Rollen.
  - Varianten, Piktogramme und Körpermarken im Rollenkörper.
  - Rollen, deren Titel Organisation oder Kopf nennt, bleiben gebunden.
- **Fähigkeiten und Körpermarken** (`derive/capabilities.ts`, `body-marks.ts`):
  - Die vermessene Körperfassung hat Vorrang, auch wenn die Spec sie als `capabilities` nennt.
  - Sonst wird eine vermessene Fassung hüllenrelativ übertragen, sonst die Einzeldarstellung
    eingepasst (Faktor ≤ 0,93, Strich 0,5 mm). Mehrere Fähigkeiten stehen nebeneinander.
- **Zustände und Tendenz** (`derive/states.ts`):
  - Das Zeichen wird vollständig komponiert und als Ganzes in die Zustandsfassung abgebildet.
  - Hinweise, Aktivität, Brand und Zugang stehen in der Randlage nach `5.8.1_Beispiel 3`, die
    Tendenz rechts gespiegelt, der Schadensgrad im Körper.
  - Personenzustände bleiben an die Person gebunden.
- **Beschriftungszonen** (`derive/label-zones.ts`):
  - Profilwerte je Körperfamilie übertragen, mit Ausweichlagen vor Bändern, Flügeln und Rädern.
  - Neue Systematikregeln `above-left-label-head-conflict` (Kopfzone oder Giebel) und
    `below-body-zone-conflict`.
  - Eine Schrumpfregel für zu lange Läufe ist gemessen und verworfen: Sie rettete nur 28 % der
    Fälle.
- **Fahrwerk, Sonderkörper, Freistehendes** (`derive/vehicle-category.ts`, `open-body-tint.ts`,
  `weather-pair.ts`, `freestanding.ts`):
  - Jede Fahrzeugkategorie an Wasser- und Luftfahrzeug.
  - Amphibienfahrzeug aus dem Mittel beider Strichkanten von 5.1.1.4.
  - Ereignis mit Organisationsfarbe im Strich, bei weniger als 3 : 1 Kontrast schwarz.
  - Wetterpaare nebeneinander.
  - Stärken an der Grenze 2.20 und Pfeilanbindung an jeder Kante.

Weiterhin gesperrt bleiben „Funktion“ an der Funktionsstelle (siehe oben) und Läufe, die für
ihre Zone zu breit sind (`label-too-wide`). Ebenso Kombinationen, für die sich keine Lage ohne
Überschneidung findet: Sie enden als `NotMeasuredError` mit Begründung, nicht als
Fehlzeichnung.
