# Mehrfachfähigkeiten und Sonderformen 3.6–3.9: was belegt ist, was zu entscheiden bleibt

> Stand: 28. September 2026
> Status: **Vorlage, Entscheidung des Eigentümers offen.** Vorbereitet zu LFH-567 (Initiative A,
> Zeichen-Grammatik, LFH-559). Die belegten Befunde sind umgesetzt, die offenen Fragen stehen in
> Abschnitt 5 mit Empfehlung.
> Bezug: `docs/decisions/2026-09-13-grammatik-motor-und-paketschnitt.md` (Scope),
> `docs/decisions/2026-09-20-zonenmodell-als-daten.md`,
> `docs/decisions/2026-08-05-vermessung-kapitel-1-und-verwaltungsstufen.md` (Kapitel 3),
> `docs/decisions/2026-09-28-lfh-565-kapitel-5-8-bausteine.md` (dasselbe Muster für 5.8)

## 1. Auftrag

LFH-567 schließt zwei Lücken der Kombinatorik:

1. **Mehrere Fähigkeiten in einem Zeichen.** Wie ordnet die Systematik zwei oder mehr
   Fähigkeiten an: Teilung, Verkleinerung, Reihenfolge? Gefragt ist eine Zonenregel, kein
   Sonderfall je Rezept, mit Fixtures aus den Originalen.
2. **Sonderformen aus Kapitel 3.** Drohne (3.6), Zweirad (3.7), Zweirad motorgetrieben (3.8) und
   temporär ortsfeste Strukturen (3.9) als Körperformen im Zonenmodell.

## 2. Was gebaut ist

- `packages/schema/src/grammar-findings.ts`: der Belegstand `evidenced` / `proposed` / `open`
  aus LFH-565 als allgemeiner Typ `GrammarFinding`. `StateGroupFinding` ist jetzt ein Alias
  davon, ohne Änderung an den Zustandsgruppen.
- `packages/schema/src/capability-combinations.ts` und
  `packages/core/src/blocks/capability-combinations.ts`: `CAPABILITY_COMBINATION_RULES`, je
  Darstellung (randbündig, Box) eine Regel mit Anordnung, Reihenfolge, Grenze, den belegten
  Körperfassungen und den benannten Ausnahmen.
- `packages/core/src/rules/planned-capability-rules.ts`: zwei **vorgemerkte** Regeln,
  `capabilities-box-limit-exceeded` und `capabilities-presentation-mixed`. Sie stehen nicht im
  Regelkatalog und werden nicht geprüft (Abschnitt 5, Fragen 1 und 2).
- `packages/core/src/geometry/body-marks.ts`: nur ein Export, `BODY_MARK_COMBINATION_OVERRIDES`.
  Er gibt die vorhandenen Kombinationsfassungen als Datum aus. Die Zeichnung ändert sich nicht.
- `packages/schema/src/special-forms.ts` und `packages/core/src/layout/special-forms.ts`:
  `SPECIAL_FORMS`, die vier Sonderformen mit allen 16 Zonen, Rolle und verwandter Körperform.
- `packages/core/src/rules/rule-catalog.ts`: die Lückenvermerke für `capabilities`,
  `body-marks` und `base-symbol` zeigen auf die neuen Daten. Die Kapitelangabe „3.6–3.9" stand
  vorher an den Fähigkeiten und war falsch: Fähigkeiten sind Kapitel 4, die Sonderformen gehören
  zur Grundzeichenart.
- Gates: `capability-combinations.test.ts`, `planned-capability-rules.test.ts` und
  `special-forms.test.ts` in `core`; `capability-combination-fixtures.test.ts` und
  `special-form-fixtures.test.ts` in `conformance`.

`compose.ts`, `validate.ts` und `layout/profiles.ts` sind unverändert. Kein Bild ändert sich.

## 3. Mehrfachfähigkeiten: was der Bestand belegt

### 3.1 Die Zählung

15 der 242 Fixtures tragen zwei oder mehr Fähigkeiten (`CapabilityId`), alle randbündig in
`bodyMarks`, an sieben Körperfassungen. Rein technische Körpermarken daneben zählen nicht als
Fähigkeit.

| Körperfassung | regelgemäß | benannte Ausnahme |
|---|---|---|
| `formation` | F.1.4, F.1.15#alternative, F.1.19 | F.1.12#alternative, F.1.13, F.1.22 |
| `formation/foot-band` | F.1.3, F.1.17 | — |
| `person` | D.3.10 | — |
| `vehicle-land/plain-wheel-pair` | F.2.3#alternative | F.2.5#alternative |
| `vehicle-land/foot-band` | F.2.13, F.2.17 | — |
| `circle-12` | F.3.4 | — |
| `circle-12/raised-gable` | F.3.5 | — |

Kein Original trägt mehr als drei Fähigkeiten (F.1.12#alternative, F.2.5#alternative). Keine
Fixture setzt `capabilities`: die Boxfassung ist an keinem Original mehrfach und auch einfach nur
in Testkompositionen belegt.

### 3.2 Die Regel: Überlagerung

Die randbündigen Fähigkeiten **überlagern** sich. Jede steht in ihrer Einzelfassung auf derselben
Körperfläche. Die Fläche wird nicht geteilt, und nichts wird verkleinert.

- **Das Kreuz ist keine Teilung für mehrere Fähigkeiten.** Die Fachdienstteilung auf den beiden
  Mittellinien ist das Zeichen 4.6.1 Sanität selbst. `F.1.3` zeigt das Zelt ohne Kreuz, `F.1.4`
  Zelt und Kreuz als zwei Marken nebeneinander; das Zelt zerschneidet die Felder des Kreuzes
  (`body-marks.ts:670–698`). Die Frage des Tickets nach der „Teilung" beantwortet der Bestand
  damit anders als erwartet: es gibt keine.
- **Die Reihenfolge ist bedeutungslos.** `specKey` liest `bodyMarks` als Menge, die
  Kombinationsfassungen wählen reihenfolgefrei, und F.1.4 mit vertauschten Marken besteht
  denselben Vergleich gegen die Referenz. Belegt ist das nur für schwarze Marken auf dem Körper,
  und andere gibt es im Bestand nicht.
- **Das Gate prüft die Regel am Motor, nicht am Text.** Für jede der 28 Fixtures mit mehreren
  Körpermarken rechnet `capability-combination-fixtures.test.ts` jede Marke zweimal gegen dieselbe
  Körperhülle: einmal mit der vollständigen Markenmenge, einmal allein. In den 24 regelgemäßen
  Fixtures sind beide Zeichnungen gleich, in den vier Ausnahmen weichen genau die benannten Marken
  ab.

Die Regel braucht keine Zahl je Körperform. Deshalb gilt sie als Empfehlung auch für
Körperfassungen ohne mehrfach belegtes Original: jede Marke rechnet sich gegen die Hülle der
Körperform. Wo eine Einzelfassung fehlt, wirft `bodyMark()` weiter `NotMeasuredError`.

### 3.3 Die vier Ausnahmen

| Fixture | Abweichung gegenüber der Einzelfassung |
|---|---|
| F.1.12#alternative | Ring r 5 statt 5,5; Arztleiste auf y 24 statt 22; Intensivbalken auf x 25,5 statt 23,5 |
| F.1.13 | Zelt als Dach unter 45°; Arztleiste auf y 21 statt 22 |
| F.1.22 | Ring r 5 um (16\|18,5), ohne Fachdienstteilung |
| F.2.5#alternative | Arztleiste auf y 23 statt 22 |

**Daraus folgt keine Regel.** Die Arztleiste rückt in F.1.12#alternative 2 mm nach außen, in
F.2.5#alternative 1 mm nach außen und in F.1.13 1 mm nach innen. F.2.3#alternative trägt zwei der
drei Marken aus F.2.5#alternative und weicht gar nicht ab. Die vier Kombinationen bleiben deshalb
**benannte Ausnahmen** im Sinne der Scope-Entscheidung, gezeichnet von `COMBINATION_MARKS` und
geführt in `CAPABILITY_COMBINATION_EXCEPTIONS`. Ein Gate hält beide Listen gleich.

### 3.4 Die Boxfassung

Kein Original zeigt zwei Kapitel-4-Piktogramme in der Box 4/8/24/16 mm. Der Motor legt sie heute
deckungsgleich in dieselbe Box. `recipes.test.ts:4017` sichert das als „wirft nicht" ab. Damit
ist belegt, dass der Motor nicht abstürzt, aber nicht, dass das Bild richtig ist.

## 4. Sonderformen: was der Bestand belegt

Die Referenzdateien sind nicht eingecheckt. Belegt ist, was das Kennzahlenartefakt führt:

| Abschnitt | Datei | Befund |
|---|---|---|
| 3.6 | `3.6_Grundzeichen Drohne.svg` | eine Hülle 4/10/28/22 mm, keine Füllung, keine Form |
| 3.7 | `3.7_Zweirad.svg` | ein Kurvenpfad, keine Form, keine Hülle |
| 3.8 | `3.8_Zweirad motorgetrieben.svg` | ein Kurvenpfad, keine Form, keine Hülle |
| 3.9 | `3.9_temporär ortsfeste Strukturen.svg` | eine graue Fläche (`#bebebe`) mit der Hülle 1,837/1,671/30,162/14,19 mm |

Dazu zwei Befunde, die beim Bauen aufgefallen sind:

- **Keine der vier Dateien führt die Füllebene `Flächige_Fülung`.** Von den vierzehn
  Grundzeichen aus Kapitel 1 fehlt sie nur den beiden ungefüllten Strichzeichen 1.13 Ereignis und
  1.14 Spontanhelfer. Eine Sonderform hätte also keine Fläche für die Organisationsfarbe.
- **Die Drohne erscheint auch als Marke.** F.1.16 setzt eine gefüllte Drohnenmarke in den
  Formationskörper (`ANHANG_F_B_FINDINGS`). C.1.13, C.1.14 und I.1.20 zeigen Drohnentrupps
  ebenfalls als Formation mit Marke, nicht als eigene Körperform.

Die Sonderformen stehen deshalb im Zonenmodell **neben** den Körperformen: jede mit allen 16
Zonen, aber keine als `SymbolKind`. Gemessen ist nur die Körperzone der Drohne, als Hülle aus dem
Artefakt. Alle übrigen 63 Zonen sind Lücken mit `scope: 'value'`, denn eine verwandte Körperform
liefert keine Zahlen für eine Sonderform.

| Sonderform | Rolle | verwandte Körperform |
|---|---|---|
| Drohne | Körperform (belegt am Dateinamen „Grundzeichen"), Marke offen | `vehicle-air` (empfohlen) |
| Zweirad | offen | `vehicle-land` (empfohlen) |
| Zweirad motorgetrieben | offen | `vehicle-land` (empfohlen) |
| temporär ortsfeste Strukturen | offen | `building` (empfohlen, aus dem Legacy-Scoping) |

## 5. Offene Fragen mit Empfehlung

Jede Empfehlung ist eine Empfehlung und keine Ablesung.

1. **Grenze in der Boxfassung.** *Empfehlung:* höchstens eine Fähigkeit in der Box, bis ein
   Original zwei zeigt. Die vorgemerkte Regel `capabilities-box-limit-exceeded` lehnte dann
   ab, was der Motor heute deckungsgleich zeichnet. Der Test `recipes.test.ts:4017` müsste dafür
   umgeschrieben werden. Mehrere Fähigkeiten bleiben über die randbündige Darstellung möglich.
2. **Box und randbündig zugleich.** *Empfehlung:* ablehnen, mit
   `capabilities-presentation-mixed`. Heute legt der Motor das Boxpiktogramm über die
   randbündigen Marken, und kein Original zeigt das.
3. **Grenze in der randbündigen Darstellung.** *Empfehlung:* keine eigene Grenze. Die Überlagerung
   begrenzt sich selbst, weil jede Marke an der Körperform vermessen sein muss. Drei ist die
   größte beobachtete Zahl, aber keine belegte Obergrenze.
4. **Die vier Ausnahmen.** *Empfehlung:* als benannte Ausnahmen belassen. Ein weiteres Original
   mit drei Marken könnte zeigen, ob die Systematik bei drei Marken Leisten nach außen rückt. Die
   heutigen vier widersprechen einer solchen Regel.
5. **Überlagerung, die eine Marke zerstört.** `cbrn-protection` (`body-marks.ts:790`) führt die
   Fachdienstteilung mit zwei Fenstern, damit das Innenzeichen frei steht. Jede weitere Marke mit
   durchgezogener Teilung (`medical-service`, `physician`, `intensive-care`,
   `patient-transport`) schlösse die Fenster wieder. Keine Fixture kombiniert so, der Motor
   ließe es aber zu. Soll eine Regel diese Paare ablehnen?
6. **Rolle der Sonderformen.** Ist die Drohne Grundzeichen und Marke zugleich? Sind die Zweiräder
   eigene Körperformen oder eine Marke, etwa anstelle des Fahrwerks am Landfahrzeug? Ist 3.9 eine
   Körperform oder eine Marke über einem Grundzeichen? Die graue Fläche reicht über die Oberkante
   jedes Rechteckkörpers hinaus, ähnlich der Giebelmarke des ortsfesten Standorts in Anhang J.
7. **Aufnahme in `SymbolKind`.** *Empfehlung:* erst nach der Vermessung an den Referenzdateien.
   Eine Körperart ohne Zeichnung würfe an jeder Stelle `NotMeasuredError` und stünde trotzdem in
   den Vokabularen der Website und der API. Das wäre ein Angebot, das der Motor nicht einlösen
   kann.

## 6. Nicht Teil

- Das Inkrafttreten der zwei vorgemerkten Regeln. Es hängt an Frage 1 und 2.
- Die Vermessung der Sonderformen. Sie braucht die Referenzdateien; das Kennzahlenartefakt
  erfasst Kurvenpfade nicht.
- Ein Spec-Feld oder eine `SymbolKind` für die Sonderformen (Frage 7).
- Änderungen an `compose.ts`, `validate.ts` und `layout/profiles.ts`.
- Eine fachliche Freigabe. Die Domain-Reviews der Fixtures bleiben, wie sie sind.
