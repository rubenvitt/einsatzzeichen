# Ableiten statt sperren: der Motor zeichnet jede zulässige Kombination

> Stand: 9. Oktober 2026
> Status: Entscheidung des Eigentümers, umgesetzt am 2. Oktober 2026 (Major-Release); Fachreview
> der offenen Fachfragen vom 5. Oktober 2026, umgesetzt am 9. Oktober 2026 (Major-Release, LFH-1064)

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
   Das Fachreview vom 5. Oktober 2026 hat sie entschieden (Abschnitt „Ergebnis des Fachreviews“).
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

## Ergebnis des Fachreviews vom 5. Oktober 2026

Bis dahin standen fünf Fachfragen vorläufig auf „zulassen, abgeleitet“, weil ein Fachreviewer
fehlte (LFH-406). Der Eigentümer hat am 5. Oktober 2026 die Empfehlungen der
Entscheidungsvorlage übernommen (LFH-988). Kein Original im Repo entscheidet einen dieser Punkte;
die Begründungen sind fachlich geschlossen. Umgesetzt mit LFH-1064 als Major-Release, weil vorher
zeichnende Specs jetzt abgelehnt werden.

| Frage | Ergebnis | Regel |
|---|---|---|
| Fahrzeugkategorie am Luftfahrzeug | gesperrt; am Wasserfahrzeug nur das Amphibienfahrzeug (5.1.1.4) | `vehicle-category-requires-chassis-body` |
| Ereignis mit Organisation | bestätigt, unverändert | — |
| Welche Träger eine Verwaltungsstufe tragen | eingeschränkt auf Formation, Person, Stelle (Kreis) und Gebäude | `administrative-level-requires-carrier` |
| „?“ und „!“ zugleich | gesperrt, höchstens ein Hinweis | `state-hint-limit-exceeded` |
| Giebel („ortsfest“) über anderen Trägern als dem Kreis | eingeschränkt auf Stelle, Formation, Gebäude, Container, Landfahrzeug, Anhänger, Wechsellader | `raised-gable-requires-stationary-kind` |

Je Punkt:

- **Fahrzeugkategorie.** Die Kategorien aus 5.1 (Rad, Kette, Schiene, geländegängig) beschreiben
  das Fahrwerk eines Landfahrzeugs. An Hubschrauber oder Flächenflugzeug sagen sie nichts. Am
  Wasserfahrzeug ist das Amphibienfahrzeug der eine sinnvolle Fall; dort bleibt die Zone
  übertragen. Mit dem Luftfahrzeug entfällt die Ausweichlage, die das ganze Zeichen anhob, wenn das
  Fahrwerk unter der Zusatzgeometrie des Luftrumpfs aus der Grundfläche ragte: An keinem
  zugelassenen Körper ragt es heraus.
- **Ereignis mit Organisation.** Bestätigt: Die Organisation färbt den Strich des offenen Hakens
  (1.13), Farben unter 3 : 1 gegen Weiß zeichnen schwarz. Eine Fläche zu schließen hieße, eine
  Form zu erfinden.
- **Verwaltungsstufe.** Sie sagt, auf welcher Ebene eine Führung, Behörde oder Stelle angesiedelt
  ist. Träger sind Formation, Person, die Stelle als Kreis (`post`, `circle-12`) und das Gebäude;
  die reduzierte Hauskontur aus F.3 (Unterkunft, Krankenhaus) zählt zum Gebäude. Fahrzeug, Gefahr,
  Maßnahme und Ereignis haben keine Verwaltungsebene; dort wäre die Stufe eher mit einer
  Stärkeangabe zu verwechseln.
- **Hinweise.** Dieselbe Sache ist nicht zugleich vermutet und akut. Wer beides meint, hat zwei
  Lagen und setzt zwei Zeichen. Die Regel gilt analog zur Tendenz (höchstens eine). Ein Hinweis
  zusammen mit Gefahrenhinweisen aus 5.8.1.5 bis 5.8.1.12 bleibt zulässig.
- **Giebel.** Kapitel 3.9 meint temporär ortsfeste Strukturen; eine abgestellte mobile
  Führungsstelle ist ein plausibler Fahrzeugfall. An Person, Gefahr, Ereignis, Maßnahme, Gebiet,
  Punkt, Spontanhelfer und Hochkantrechteck ist „ortsfest“ selbstverständlich oder sinnlos, am
  Luft- und Wasserfahrzeug widerspricht es der Art. Die reduzierte Hauskontur zählt wie bei der
  Verwaltungsstufe zum Gebäude.

Ebenfalls bestätigt und unverändert: TEL, LtrGA und die übrigen Leitungsrollen behalten bei
einem Stufenwechsel ihr festes Kürzel (`derive/function-roles.ts`). Eine Funktion an Stelle oder
Gebäude bleibt gesperrt (`function-role-requires-measured-kind`); das Fachreview empfiehlt dafür
eigene Katalogkennungen nach dem Muster der Leitstelle D.2.5. Das ist ein eigener Folgepunkt.

Vermessenes bleibt bytegleich: Alle Snapshots, Fingerabdrücke und Rezepte zeichnen unverändert,
keine Rezeptsignatur liegt außerhalb der Reichweite.

## Umsetzung

Das Fundament legt `Drawing.derivations`, `noteDerivation()` und `withoutDerivationNotes()`
(`core/src/derive/record.ts`), die Körperhülle jeder Form (`derive/body-bounds.ts`) und den
Zensus `scripts/census/derived-census.mts`. Gemessen werden darin alle 33 Grundformen mit je
einem weiteren Feld, mit Geometrieprüfung: keine NaN, alles in der ViewBox, abgeleitete
Piktogramme in der Körperhülle, der Kopf frei von allem anderen.

| Stand | gezeichnet | davon abgeleitet | Geometrieverstöße |
|---|---:|---:|---:|
| vorher (3.0.0) | 684 von 74 613 | 0 | 0 |
| nachher | 20 331 von 74 822 | 19 507 | 0 |
| vor dem Fachreview (4.3.0) | 20 338 von 74 822 | 19 514 | 0 |
| nach dem Fachreview (LFH-1064) | 17 191 von 74 822 | 16 367 | 0 |

Ein zweiter Zensus über Feldpaare (`scripts/census/pair-census.mts`) kombiniert Grundform,
Kopfangabe und Beschriftung mit Organisation, Fähigkeit, Körpermarke, Zustand oder Tendenz.
Von 118 144 Specs zeichnet er 65 118, ohne Verstoß. Vor dem Fachreview (4.3.0) waren es 79 848
von 136 320 auf 71 Basen, danach 47 225 von 117 120 auf 61 Basen, weiter ohne Verstoß; die zehn
entfallenen Basen sind die Giebelformen an nicht ortsfesten Trägern. Er fand die Fehler, die erst im
Zusammenspiel entstehen:

- ein Körper, den Kopf und Giebel verkleinern, unter Läufen in Normgröße (seit LFH-987 folgen
  die Läufe dem Körper, `2026-10-05-lfh-987-laeufe-folgen-dem-koerper.md`);
- Eckkürzel unter einem langen mittigen Lauf;
- der EU-Kopf über der Zustandsfassung;
- Sterne im Giebel.

Deshalb prüft der Motor jede abgeleitete Zeichnung zum Schluss
(`derive/layout-guard.ts`): Läufe überlappen sich nicht, liegen nicht im Kopf und kreuzen keine
Zusatzgeometrie, ein Lauf im Körper bleibt im Körper, nichts verlässt die Fläche. Was das nicht
erfüllt, endet als benannte Lücke (`NotMeasuredError`) statt als Fehlzeichnung. Vermessene
Zeichnungen prüft er nicht.

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
  - Fußband an jeder Art, an der es geometrisch Platz findet. Den Giebel seit dem Fachreview nur
    an ortsfesten Trägern (siehe oben).
  - Radpaar und Kettenrumpf an Anhänger und Wechsellader.
  - Weiße Innenkontur an jedem flächigen Körper: halbe Strichbreite plus 0,75 mm, gemessen an
    E.1.1 und E.2.27.
  - Artgebundene Formen bleiben Systematik: Rümpfe, Flügel, Personrauten.
- **Kopfzone** (`derive/head-zone.ts`):
  - Alle sechs Verwaltungsstufen. Die Sternzahl ist an 5.7.1 bis 5.7.5 nachgezählt, die Lage
    abgeleitet. Seit dem Fachreview nur an Formation, Person, Stelle und Gebäude.
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
  - Höchstens einer der Hinweise „?“ und „!“ seit dem Fachreview; ein Hinweis steht weiter
    zusammen mit Gefahrenhinweisen untereinander.
  - Personenzustände bleiben an die Person gebunden.
- **Beschriftungszonen** (`derive/label-zones.ts`):
  - Profilwerte je Körperfamilie übertragen, mit Ausweichlagen vor Bändern, Flügeln und Rädern.
  - Neue Systematikregeln `above-left-label-head-conflict` (Kopfzone oder Giebel) und
    `below-body-zone-conflict`.
  - Eine Schrumpfregel für zu lange Läufe ist gemessen und verworfen: Sie rettete nur 28 % der
    Fälle.
- **Fahrwerk, Sonderkörper, Freistehendes** (`derive/vehicle-category.ts`, `open-body-tint.ts`,
  `weather-pair.ts`, `freestanding.ts`):
  - Jede Fahrzeugkategorie an Wasser- und Luftfahrzeug; seit dem Fachreview nur noch das
    Amphibienfahrzeug am Wasserfahrzeug.
  - Amphibienfahrzeug aus dem Mittel beider Strichkanten von 5.1.1.4.
  - Ereignis mit Organisationsfarbe im Strich, bei weniger als 3 : 1 Kontrast schwarz.
  - Wetterpaare nebeneinander.
  - Stärken an der Grenze 2.20 und Pfeilanbindung an jeder Kante.

Weiterhin gesperrt bleiben „Funktion“ an der Funktionsstelle (siehe oben) und Läufe, die für
ihre Zone zu breit sind (`label-too-wide`). Ebenso Kombinationen, für die sich keine Lage ohne
Überschneidung findet: Sie enden als `NotMeasuredError` mit Begründung, nicht als
Fehlzeichnung.
