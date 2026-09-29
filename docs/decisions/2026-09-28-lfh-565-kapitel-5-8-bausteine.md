# Kapitel 5.8 als kombinierbare Bausteine: was belegt ist, was zu entscheiden bleibt

> Stand: 28. September 2026
> Status: **Vorlage, Entscheidung des Eigentümers offen.** Vorbereitet zu LFH-565 (Initiative A,
> Zeichen-Grammatik, LFH-559). Die belegten Befunde sind umgesetzt, die offenen Fragen stehen in
> Abschnitt 4 mit Empfehlung.
> Nachtrag 29. September 2026 (LFH-577): Vermessung an den Referenzdateien in Abschnitt 7,
> Entscheidungen des Eigentümers in Abschnitt 8, verbliebene Fragen in Abschnitt 9.
> Bezug: `docs/decisions/2026-09-13-grammatik-motor-und-paketschnitt.md` (Scope),
> `docs/decisions/2026-08-07-kapitel-5-8-zustaende-d2.md` (D.2),
> `docs/decisions/2026-09-20-zonenmodell-als-daten.md` §3 Punkt 10 und 11

## 1. Auftrag

LFH-565 macht aus den 67 Darstellungen des Kapitels 5.8 Bausteine mit Zonenregel statt
Einzelzeichen im Katalog. Das Ergebnis soll **je Gruppe** nennen: den Baustein, die Zone (wo am
Zeichen) und die Regel (mit welchen Grundzeichen kombinierbar, wie viele zugleich). Das Spec-Feld
dazu gehört in die API-Initiative (LFH-577).

## 2. Was gebaut ist

- `packages/schema/src/state-groups.ts` — die Typen. Jede Aussage über eine Gruppe hat einen von
  drei Ständen: `evidenced` mit Beleg, `proposed` mit Begründung oder `open` mit Frage. Einen
  Nullwert für „nicht belegt" gibt es nicht.
- `packages/core/src/blocks/state-groups.ts` — `STATE_GROUPS`, die neun Gruppen 5.8.1 bis 5.8.9
  mit Form, Zone, Trägern, Grenze je Zeichen, Regelkennungen und Fixtures.
- `packages/core/src/rules/planned-state-rules.ts` — vier **vorgemerkte** Regeln:
  `state-carrier-not-allowed`, `state-group-limit-exceeded`, `tendency-carrier-not-allowed`,
  `tendency-limit-exceeded`. Sie stehen bewusst nicht im Regelkatalog. Der Katalog ist mengengleich
  mit dem, was `validate.ts` prüft, und ohne Spec-Feld prüft `validate.ts` keinen Zustand. Mit
  LFH-577 wandern sie in den Katalog.
- `packages/conformance/src/state-group-fixtures.ts` — die sieben Beispielzeichen als Fixtures.
- Gates: `state-groups.test.ts` und `planned-state-rules.test.ts` in `core`,
  `state-group-fixtures.test.ts` in `conformance`.

`compose.ts`, `validate.ts`, `layout/profiles.ts` und das Bausteinregister sind unverändert.

## 3. Was der Bestand belegt

Die Referenzdateien sind nicht eingecheckt. Belegt ist deshalb, was an zwei Stellen steht: an den
Kopfkommentaren der Zeichnungen in `core/src/geometry/pictograms/states/` und am Kennzahlenartefakt
`fingerprints.json`. Das Artefakt führt die Zeichenfläche und die Hüllen gefüllter Flächen. Einen
gefüllten Träger erfasst es also, eine Marke aus umgewandeltem Pfad nicht.

### 3.1 Form — für alle neun Gruppen belegt

Sieben Gruppen zeichnen eine **Marke ohne Träger**. Zwei zeichnen ihren **Träger mit**:

- 5.8.6 Tierzustand: jede Darstellung enthält die Tiersilhouette.
- 5.8.8 Personenzustand: jede Darstellung enthält die Personenraute.

Für diese beiden Gruppen ist der Zustand kein freier Baustein, sondern an seinen Träger gebunden.

### 3.2 Die Beispiele zu 5.8.1

Alle drei Beispiele haben eine Zeichenfläche von **36 × 32 mm** statt 32 × 32 mm. Der Träger ist
eine weiß gefüllte, um 45° gedrehte **Raute mit 20 mm Hülle**, senkrecht mittig (y 6…26).
Waagerecht steht sie in Beispiel 1 und 2 bei x 15…35, in Beispiel 3 bei x 11…31.

Das belegt:

- Ein Zustand aus 5.8.1 steht **neben** dem Träger, nicht auf ihm → Zone `state-margin`.
- Der Träger ist die Körperform des Grundzeichens 1.2 Person, der einzigen Grundzeichenart mit
  Rautenkörper → Träger `base-symbol/person`.
- Der Träger schrumpft von 30 mm (1.2 Person) auf 20 mm, und die Fläche wächst um 4 mm.

Nicht belegt ist die Lage der Marke. Dass der Träger zwischen den Beispielen die Seite wechselt,
spricht dafür, dass die Marke je nach Wert links oder rechts steht. Das passt zu den Balken der
Einsatztaktik, die D.2 links (Retten, Rückzug) oder rechts (Angreifen, Verteidigen) gebaut hat. Es
ist aber nicht abgelesen.

> **Überholt durch Abschnitt 7.1.** Die Beispiele zeigen keine Taktik, sondern das Fragezeichen
> aus 5.8.1.13 links neben der Person; der Träger rückt wegen einer zusätzlichen Anzahl „3", nicht
> wegen des Werts.

### 3.3 Die Beispiele zu 5.8.7

Alle vier Beispiele haben 32 × 32 mm. Die einzige gefüllte Fläche ist die Wolke aus 5.8.7.2,
gleich breit und gleich hoch, aber um **3 mm angehoben** (y 3…21 statt 6…24). Darunter steht der
Schnee, den das Artefakt nicht erfasst.

Das belegt:

- Wetterwerte kombinieren **miteinander**, ohne Grundzeichen → Zone `freestanding`.
- Träger des Niederschlags ist die Wolke → Träger `state/weather-cloudy`.
- Ein Zeichen trägt mindestens zwei Wetterwerte zugleich.

Nicht belegt ist die Intensität. Die Dateinamen nennen vier Stufen (schwach, mittel, stark,
extrem), das Schema kennt keine Intensität, und wie die Stufen gezeichnet sind, erfasst das
Artefakt nicht.

### 3.4 Die Personenraute in 5.8.8

Die Raute erscheint in drei Lagen: 26 mm zentriert (Hülle 3…29), 26 mm um 2 mm angehoben bei
5.8.8.12 bis 5.8.8.14 und 21 mm abgesenkt bei 5.8.8.9. Nur die erste entspricht einer
vermessenen Körperfassung, `person/compact-person-diamond-26mm` aus I.5.1. Drei Werte setzen
Marken außerhalb der Raute in die Ecken: die Sichtungskategorie unten links (5.8.8.4),
Transportpriorität und Kontamination oben rechts (5.8.8.5, 5.8.8.6). Diese Ecklagen hat das
Zonenmodell nicht.

## 4. Stand je Gruppe und offene Fragen

| Gruppe | Darst. | Form | Zone | Träger | Grenze je Zeichen |
|---|---|---|---|---|---|
| 5.8.1 Einsatztaktik und Gefahrenhinweise | 18 | Marke | `state-margin` (belegt) | Person (belegt) | offen |
| 5.8.2 Aktivität / Ausfallgrad | 4 | Marke | offen | offen | 1 (empfohlen) |
| 5.8.3 Tendenz | 3 | Marke | offen | offen | 1 (empfohlen) |
| 5.8.4 Schadensgrad | 3 | Marke | `body` (empfohlen) | offen | 1 (empfohlen) |
| 5.8.5 Brandphase | 3 | Marke | offen | offen | 1 (empfohlen) |
| 5.8.6 Tierzustand | 4 | Träger mitgezeichnet | `freestanding` (belegt) | offen | offen |
| 5.8.7 Wetter | 10 | Marke | `freestanding` (belegt) | Wolke (belegt) | offen |
| 5.8.8 Personenzustand | 18 | Träger mitgezeichnet | `body` (belegt) | Person (belegt) | offen |
| 5.8.9 Zugang | 4 | Marke | offen | offen | offen |

Die Fragen, gebündelt. Jede Empfehlung ist eine Empfehlung und keine Ablesung.

1. **Grenze bei Skalen (5.8.2 bis 5.8.5).** Die Werte sind Stufen einer Skala, zwei Stufen
   widersprechen sich. *Empfehlung:* höchstens ein Wert je Gruppe und Zeichen. Das ist aus der
   Wertestruktur hergeleitet, nicht aus der Systematik.
2. **Träger außer der Person (5.8.1).** Belegt ist nur die Raute. *Empfehlung:* bis zu einem
   weiteren Beleg nur `person`. Die Regel lehnt dann jeden anderen Träger mit
   `state-carrier-not-allowed` ab, statt eine unbelegte Lage zu zeichnen.
3. **Grenze in 5.8.1.** Die vier Taktiken schließen einander aus, die zehn Gefahrenhinweise nicht.
   Soll die Grenze je Untergruppe gelten: eine Taktik, beliebig viele Hinweise?
4. **Zone der Tendenz (5.8.3).** Das ist die offene Frage aus der Zonenentscheidung, §3 Punkt 10:
   eigene Randlage oder Lage innerhalb der Zustandsrandlage? Und steht die Tendenz an einem
   Grundzeichen, an einem Zustand oder an beidem?
5. **Schadensgrad als Überlagerung (5.8.4).** Die Diagonalen haben keinen Rahmen und stehen
   mittig. *Empfehlung:* Zone `body`, also über dem Körper des Trägers. Welche Träger den
   26-mm-Diagonalen Platz bieten, ist offen.
6. **Tier und Person als Träger (5.8.6, 5.8.8).** Beide Gruppen bringen ihren Träger mit. Die
   Tiersilhouette ist kein Grundzeichen. *Empfehlung:* 5.8.8 als Zustand am Grundzeichen `person`
   führen und die drei Rautenlagen als Körperfassungen vermessen. 5.8.6 als eigenständiges Zeichen
   lassen, bis entschieden ist, ob die Tiersilhouette ein Grundzeichen wird.
7. **Mehrere Zustände an einer Person oder einem Tier.** Verletzt und kontaminiert zugleich? Tot
   und erkrankt schließen sich aus.
8. **Wetter.** Wie viele Werte zugleich, welche Paare schließen sich aus (Sonne und Bedeckung),
   gehen Regen, Hagel und Gewitter ebenso an die Wolke wie Schnee? Und braucht das Schema eine
   Intensität mit vier Stufen?
9. **Zugang (5.8.9).** Randlage am Grundzeichen oder Zustand einer Linie aus Kapitel 2 (LFH-566)?
   Gilt „höchstens einer" nur für die drei Stufen der Befahrbarkeit und nicht für die
   Einbahnstraßenregelung?

## 5. Abweichung vom Bausteinregister

Das Register aus LFH-564 führt für jeden Zustand die Zielzone `state-margin` und für jede Tendenz
`tendency-margin`. Drei Gruppen belegen eine andere Zone: 5.8.6 und 5.8.7 `freestanding`, 5.8.8
`body`. Das Register wird hier **nicht** umgeschrieben. Welche Zone gilt, hängt an Frage 6 und 8.
Bis dahin hält `state-groups.test.ts` die Abweichung als Liste fest.

## 6. Nicht Teil

- Das Spec-Feld für Zustände und das Inkrafttreten der vier Regeln (LFH-577).
- Die Vermessung der Randlage. Sie braucht die Referenzdateien, weil das Kennzahlenartefakt die
  Marke nicht erfasst. Solange sie fehlt, bleiben `state-margin` und `tendency-margin` im
  Zonenmodell deklarierte Lücken.
- Änderungen an `compose.ts`, `validate.ts`, `layout/profiles.ts` und am Bausteinregister.
- Eine fachliche Freigabe. Die 67 Domain-Reviews aus D.2 bleiben `pending`.

## 7. Vermessung an den Referenzdateien (29.09.2026)

Abschnitt 3 hat nur am Kennzahlenartefakt abgelesen. Für diesen Nachtrag sind alle 661
Referenzdateien unter `taktische-zeichen/` durchgesehen worden, als Übersichtsbilder und mit einer
Suche nach den Umrissen der Hinweismarken, der Tendenzpfeile, der Schadenskreuze und der Flammen.
Die Marken sind an den Dateien selbst vermessen: Pfadhüllen je Teilpfad, 1 mm = 90,709 / 32 pt =
2,8347 pt. Nichts aus den Dateien ist übernommen außer abgelesenen Zahlen. Gebaut ist das Ergebnis
in `core/src/layout/state-placement.ts` (`placeStates`), im Zonenmodell (`layout/zones.ts`) und in
`STATE_GROUPS`. Die erfassbaren Zahlen hält `conformance/src/state-group-fixtures.test.ts` gegen
`fingerprints.json` fest.

### 7.1 5.8.1: Hinweis links neben dem verkleinerten Träger

Die drei Beispiele zeigen **keine Taktik**. Sie zeigen das Fragezeichen aus 5.8.1.13 an einer
Person mit dem Zustand „verletzt":

| Datei | Befund |
|---|---|
| `5.8.1_Beispiel 1–3` | Fläche 102,047 × 90,709 pt = 36 × 32 mm, Grundfläche x 4…36 mm |
| | Träger: Raute 20 mm (Füllfläche 14,142 mm Kante), Umriss 0,4 mm, mit senkrechtem 0,4-mm-Strich: 5.8.8.3 auf 20/26 verkleinert |
| `5.8.1_Beispiel 3` | Raute um (21 \| 16), Mittellinie x 11…31; schwarzes „?" Tinte 3,642…9,4 × 9,6…18,4, Punkt 6,05…6,95 × 19,6…20,5 → Achse x = 6,5, 4,5 mm links der Rautenspitze |
| `5.8.1_Beispiel 1` | „3?" (Tinte 0,962…13,9 mm), Raute um (25 \| 16) |
| `5.8.1_Beispiel 2` | „?3" (Tinte 0,642…14,076 mm), Raute um (25 \| 16) |
| `5.8.1.13_…_2` | Dreieck (7,5 \| 25), (19 \| 6), (30,5 \| 25), Strich 0,5 mm; rotes „?" Tinte 2,142…7,9 × 9,6…18,4, Punkt 1,2 mm um (5 \| 20,05) |
| `5.8.1.14_…_2` | dasselbe Dreieck; rotes „!" Balken 0,8 × 8 mm bei x = 6 (y 10…18), Punkt 1,2 mm um (6 \| 20,05) |
| `M.6` | unverkleinertes Dreieck (1 \| 28), (16 \| 3), (31 \| 28), Strich 0,5 mm; rotes „!" wie oben, aber bei x = 1,5 |

Das „?" der Beispiele ist dieselbe halbgroße Figur wie in 5.8.1.13_2 (5,758 × 8,8 mm), nur
schwarz. Die Marke übernimmt also die Strichfarbe ihres Trägers: schwarz an der Person, rot an
der Gefahr. Die Seite wechselt der Träger nur, weil in Beispiel 1 und 2 eine Anzahl „3" mitsteht.

Belegt ist damit die Zustandsrandlage **links** an zwei Grundzeichen, Person und Gefahr, und nur
für die Hinweise 5.8.1.13 und 5.8.1.14. Taktik 5.8.1.1 bis 5.8.1.4 und die Gefahrenhinweise
5.8.1.5 bis 5.8.1.12 zeigt keine der 661 Dateien an einem Träger.

Frage 3 (Grenze in 5.8.1), aus den Originalen beantwortet, soweit sie es können: Kein Original
zeigt mehr als einen Hinweis und keines eine Taktik an einem Träger. Daneben steht höchstens ein
Personenzustand. Das ist eine Beobachtung und kein Verbot; `perSign` steht deshalb als
Empfehlung 1, nicht als Beleg.

### 7.2 5.8.8: drei Rautenlagen und zwei Ecklagen

| Lage | Datei | Mittellinie |
|---|---|---|
| 26 mm um (16 \| 16) | 5.8.8.1–8, 10, 11, 15–17 | Hülle 3…29, Umriss 2,647…29,353, Strich 0,5 mm; gleich `compact-person-diamond-26mm` |
| 26 mm um (16 \| 14) | 5.8.8.12–14 | Füllpolygon (16 \| 1), (29 \| 14), (16 \| 27), (3 \| 14); Pfeil auf y = 27 |
| 21 mm um (16 \| 20,5) | 5.8.8.9 | Füllfläche 14,849 mm Kante, Hülle 5,5…26,5 × 10…31 |

Ecklagen (Tinte): oben rechts „B" 25,572…28,669 × 2,131…7,0 (5.8.8.2), „TP" 22,126…29,768
(5.8.8.5), „K" 25,494…29,149 (5.8.8.6 Alternative), Kontaminationsscheiben 20,75…31,75 × 0,25…3,75
mit Kreuzstrichen bis y = 8 (5.8.8.6); unten links „II" 2,533…7,112 × 25,13…30,0 (5.8.8.4). Das
Zonenmodell führt sie als `corner-top-right` und `corner-bottom-left` der Zustandsrandlage an der
Person.

Frage 7 (mehrere Zustände an einer Person), aus den Originalen: Kein Original zeigt zwei Werte
aus 5.8.8 an einer Raute. Die Verbindungen sind eigene Werte: 5.8.8.4, 5.8.8.5 und 5.8.8.6 zeichnen
den Verletzungsstrich mit, „kontaminiert" ist also als „verletzt und kontaminiert" gezeichnet.
Belegt ist ein Personenzustand zusammen mit einem Hinweis aus 5.8.1 (Beispiel 1–3). F.3.18 und
F.3.19 zeigen 5.8.8.15 und 5.8.8.17 an einer auf 13 mm verkleinerten Raute im Kreis; die Marken
wandern also mit der Raute.

### 7.3 5.8.4: Überlagerung, belegt am Deichprofil

`L.9 Deichbruch` legt die Diagonalen von 5.8.4.2 unverändert (Umriss 4,156…27,844 mm) mittig über
das Deichprofil. `L.8 Schäden am Außendeich` setzt das Kreuz von 5.8.4.1 auf 47 % verkleinert
(Hülle 9,08…17,919 × 11,581…20,419, Strich weiter 0,5 mm) mittig auf die Böschungslinie bei
(13,5 | 16). Damit ist die Zone `body` belegt, nicht mehr nur empfohlen. Einen Träger aus den
Grundzeichen belegt das nicht: das Deichprofil aus Anhang L ist keines.

### 7.4 Was kein Original zeigt

- **Tendenz 5.8.3:** kein Rahmen mit Pfeil an irgendeinem Träger. Die Pfeile in M.9 und M.10 sind
  offene Winkelpfeile ohne Rahmen im Gefahrendreieck, also keine Tendenz.
- **Aktivität 5.8.2:** kein geviertes Quadrat an einem Träger.
- **Brandphase 5.8.5:** Die Flammen in Anhang M (M.4 bis M.10) sind eine eigene Figur, kein
  verkleinerter Wert aus 5.8.5. Das Seitenverhältnis beträgt 0,92 statt 0,85, und die Flammen
  sind 3,4 mm breit.
- **Zugang 5.8.9:** keine Fahrbahnstriche an einem Träger oder an einer Linie aus Kapitel 2.
- **Taktik und Gefahrenhinweise 5.8.1.1 bis 5.8.1.12:** an keinem Träger.

### 7.5 Was gebaut ist

`placeStates({ carrier, states, tendency })` liefert die Zeichenfläche, die Lage der Grundfläche,
den Träger in seiner Fassung (ersetzt den Körper) und die platzierten Teile je Wert mit Zone,
Grundlage (`measured` oder `transferred`) und Referenzdatei. Abgelesen und gebaut sind:

- ein Personenzustand allein, in seiner Rautenlage, die Ecklagen als eigene Teile;
- „?" an der Person mit „verletzt" (Beispiel 3);
- „?" und „!" an der Gefahr (5.8.1.13_2, 5.8.1.14_2).

**Übertragen und als `transferred` gekennzeichnet:** jeder andere Personenzustand der Standardlage
neben einem Hinweis, die Person ohne Zustand neben einem Hinweis und „!" an der Person. Für „!"
wird der Versatz von 1 mm übernommen, den 5.8.1.14_2 gegen 5.8.1.13_2 zeigt.

**`NotMeasuredError`, `scope: 'value'`:** Taktik und 5.8.1.1 bis 5.8.1.12, 5.8.2, 5.8.4 an einem
Grundzeichen, 5.8.5, 5.8.9 und jede Tendenz.

**`NotMeasuredError`, `scope: 'combination'`:**

- zwei Hinweise zugleich;
- zwei Personenzustände zugleich;
- ein Hinweis an einer angehobenen oder abgesenkten Raute;
- ein Hinweis an einer anderen Körperform als Person oder Gefahr;
- ein Personenzustand an einem anderen Träger als der Person.

## 8. Entscheidung des Eigentümers (29.09.2026)

Ruben Vitt hat am 29. September 2026 entschieden:

1. Zustände und Tendenz sind getrennte Spec-Felder: `states: StateId[]` für 5.8.1, 5.8.2, 5.8.4,
   5.8.5, 5.8.8 und 5.8.9, `tendency` allein für 5.8.3, mit eigener Randlage. Eine Tendenz ist
   höchstens eine.
2. Höchstens ein Wert je Skala 5.8.2 bis 5.8.5 (Frage 1 angenommen).
3. 5.8.1 nur an `person`, bis ein Original einen anderen Träger belegt (Frage 2). Die Originale
   5.8.1.13_2, 5.8.1.14_2 und M.6 belegen `hazard` für die Hinweise 5.8.1.13 und 5.8.1.14. Für
   diese beiden Werte ist die Gefahr damit als Träger zugelassen, für die übrigen Werte von 5.8.1
   nicht (`stateCarriersOf`).
4. 5.8.8 ist ein Zustand am Grundzeichen `person` (Frage 6). 5.8.6 und 5.8.7 sind freistehend
   und bekommen eine eigene Spec-Art.

In `STATE_GROUPS` stehen diese Entscheidungen mit dem Stand `decided` und nicht als
`evidenced`, denn eine Entscheidung ist keine Ablesung. Der Stand ist additiv in
`GrammarFinding` eingeführt.

## 9. Verbliebene Fragen an den Eigentümer

Jede Empfehlung ist eine Empfehlung und keine Ablesung.

1. **Lage der Tendenzrandlage.** Kein Original zeigt eine Tendenz an einem Träger.
   - *Empfehlung:* Bis zu einem Beleg zeichnet `placeStates` keine Tendenz und wirft
     `NotMeasuredError`. Die Tendenz bleibt als Datum in der Spec und steht als eigenes Zeichen
     neben dem Träger.
   - *Falls eine zusammengesetzte Lage gewünscht ist:* das Spiegelbild der Hinweislage. Rechts
     neben dem auf 20 mm verkleinerten Träger stünde der Rahmen, auf die Höhe der Hinweismarke
     verkleinert (11 mm), die Fläche wüchse rechts um 4 mm. Das wäre eine Konstruktion und keine
     Ablesung.
2. **Zweite Hinweislage an der Gefahr (M.6).** M.6 verkleinert das Dreieck nicht und setzt „!"
   bei x = 1,5. *Empfehlung:* Die Lage aus 5.8.1.13_2 und 5.8.1.14_2 gilt. M.6 bleibt ein
   Katalogzeichen aus Anhang M mit eigener Geometrie.
3. **Strich des Gefahrendreiecks.** Neben dem Hinweis hat das Dreieck 0,5 mm Strich, der Körper
   von 1.11 hat 1 mm mit Bevel-Ecken. *Empfehlung:* wie die Referenz der Hinweise, also 0,5 mm.
4. **Anzahl neben dem Hinweis.** Beispiel 1 und 2 setzen eine „3" vor bzw. hinter das
   Fragezeichen. Das Schema kennt keine Anzahl. *Empfehlung:* eigene Aufgabe. Bis dahin bleibt
   die Anzahl ungebaut. Nur Beispiel 3 ist nachgebaut.
5. **Übertragungen bestätigen.** Drei Fälle sind übertragen und als `transferred` gekennzeichnet:
   - andere Personenzustände neben einem Hinweis,
   - die Person ohne Zustand neben einem Hinweis,
   - „!" an der Person.

   *Empfehlung:* bestätigen, weil die Bildidee dieselbe ist und F.3.18/F.3.19 das Mitwandern der
   Marken zeigen.
6. **Grenzen, beobachtet (Frage 3 und 7).** *Empfehlung:*
   - höchstens ein Hinweis aus 5.8.1;
   - keine Taktik und kein Gefahrenhinweis 5.8.1.1 bis 5.8.1.12 an einem Träger, solange kein
     Original ihn zeigt;
   - höchstens ein Personenzustand je Person;
   - Personenzustand und Hinweis zusammen zulässig.
7. **Schadensgrad an Grundzeichen (5.8.4).** Belegt ist die Überlagerung nur am Deichprofil.
   *Empfehlung:* Die Diagonalen unverändert mittig über Körper legen, deren Hülle die 23,7 mm der
   Diagonalen aufnimmt, wie L.9. Bis zur Entscheidung wirft `placeStates`.
8. **Aktivität, Brandphase, Zugang (5.8.2, 5.8.5, 5.8.9).** Kein Original an einem Träger.
   *Empfehlung:* weiter unbelegt lassen. Für 5.8.9 die Anbindung an Linien aus Kapitel 2
   (LFH-566) prüfen, sobald dort Linien gebaut sind.
9. **Transportpfeile in 5.8.8.12 bis 5.8.8.14.** Die Pfeile sind die Bewegungspfeile 5.2.2, 5.2.3
   und 5.2.5 (Hinweis des Pfeil-Agenten). *Empfehlung:* In einer Folgeaufgabe `08-persons.ts`
   auf `movementDrawing` umstellen, sobald die Pfeile gebaut sind.


## 10. Vermessung an den Referenzdateien (29.09.2026): 5.8.6 und 5.8.7

> Nachtrag zu LFH-577, eigener Abschnitt für die beiden freistehenden Gruppen. Einheit der Dateien
> pt, 1 mm = 72/25,4 pt. Nach der Entscheidung vom 29.09.2026 sind beide Gruppen **freistehende
> Zeichen** mit eigener Spec-Art (siehe `2026-09-28-lfh-566-bewegung-linien-grenzen.md` §7).

### 10.1 5.8.7 Wetter: Kombination und Intensität (Frage 8)

Die vier Beispiele `5.8.7_Beispiel_Schneiend_{schwach,mittel,stark,extrem}` sind die einzigen
Originale mit zwei Wetterwerten. Abgelesen:

- **Wolke:** dieselbe Kontur wie 5.8.7.2, um **3 mm angehoben** (Fläche oben 25,512 statt
  34,016 pt; Hülle 1/3/31/21).
- **Schnee darunter:** Flocken aus drei Durchmessern wie in 5.8.7.8, aber mit **Radius 3 mm**
  statt 4 mm, Mitte y 26 (senkrechter Durchmesser 65,227…82,235 pt).
- **Intensität = Anzahl der Flocken**, Teilung 8 mm, mittig auf x 16: schwach eine Flocke (16),
  mittel zwei (12, 20), stark drei (8, 16, 24), extrem vier (4, 12, 20, 28).

Die Intensität ist damit keine Größe und keine Farbe, sondern eine Wiederholung. „Stark“ an der
Wolke ist nicht dasselbe wie 5.8.7.8 allein: dort stehen drei größere Flocken im Abstand 9 mm.

Gebaut ist `weatherDrawing({ values, intensity? })` in `core/src/geometry/weather.ts`: ein Wert
allein ist das Katalogpiktogramm, Wolke und Schnee mit Intensität die Kombination der Beispiele.
Das Schema hat dafür `WeatherIntensity` (`weak`, `moderate`, `strong`, `extreme`) und
`WeatherParameters`. Die vier Beispiele sind Fixtures (`conformance/src/freestanding-state-fixtures.ts`),
die Wolke trifft die Hülle im Kennzahlenartefakt.

Weiterhin nicht belegt, jeweils mit Empfehlung:

- **Regen, Hagel, Gewitter an der Wolke.** *Empfehlung:* genauso bauen wie den Schnee (Wolke 3 mm
  hoch, darunter ein bis vier Marken in 8-mm-Teilung), sobald der Eigentümer das bestätigt. Die
  Marken sind in 5.8.7.5 bis 5.8.7.7 selbst schon dreifach wiederholt; die Übertragung ist
  naheliegend, aber eine Konstruktion. Bis dahin meldet `weatherDrawing` eine Lücke.
- **Wie viele Werte zugleich und welche sich ausschließen** (Sonne und Bedeckung, Nebel und
  Sonne). *Empfehlung:* höchstens die Wolke und ein Niederschlag; Sonne, Bedeckung, Nebel,
  Temperatur und Wind nur allein, bis ein Original anderes zeigt.
- **Intensität ohne Wolke oder Schnee an der Wolke ohne Intensität.** *Empfehlung:* nicht
  zulassen; die Beispiele zeigen die Intensität nur in dieser Kombination.

### 10.2 5.8.6 Tierzustand: Silhouette als Träger (Frage 6)

Jede der vier Darstellungen zeichnet die Tiersilhouette selbst: waagerechte Ohren von x 2 bis 6
und 26 bis 30, dazwischen ein V mit der Spitze auf x 16. Der Zustand verändert den Träger: beim
kontaminierten Tier liegt die Silhouette 5 mm tiefer (Ohren y 9 statt 4), damit das
Kontaminationszeichen darüber Platz hat. Keine Referenz zeigt die Silhouette ohne Zustand oder als
Grundzeichen.

Varianten: `5.8.6.2_kontaminiertes Tier_K` ersetzt das Zeichen aus zwei Scheiben und gekreuzten
Strichen durch den Buchstaben K (eigene Ebene „Takt. Zeichen (Typo)“). Das ist eine zweite
Darstellung desselben Werts, keine Kombination.

Gebaut ist `animalStateDrawing({ state, variant? })` in `core/src/geometry/animal-state.ts`. Es
liefert das Katalogpiktogramm des Zustands; `variant: 'alternative'` gibt es nur beim
kontaminierten Tier.

Weiterhin nicht belegt, mit Empfehlung:

- **Mehrere Zustände an einem Tier.** Das kontaminierte Tier trägt den Strich des erkrankten mit;
  das ist ein Hinweis, aber kein Beleg für eine Kombinationsregel. *Empfehlung:* höchstens ein
  Zustand je Tier, wie bei der Person.
- **Tier als Grundzeichen.** *Empfehlung:* nein, solange kein Original die Silhouette ohne Zustand
  zeigt. Die Tierzustände bleiben freistehende Zeichen.
