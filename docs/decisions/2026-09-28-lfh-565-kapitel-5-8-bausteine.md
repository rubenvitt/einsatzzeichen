# Kapitel 5.8 als kombinierbare Bausteine: was belegt ist, was zu entscheiden bleibt

> Stand: 28. September 2026
> Status: **Vorlage, Entscheidung des Eigentümers offen.** Vorbereitet zu LFH-565 (Initiative A,
> Zeichen-Grammatik, LFH-559). Die belegten Befunde sind umgesetzt, die offenen Fragen stehen in
> Abschnitt 4 mit Empfehlung.
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
