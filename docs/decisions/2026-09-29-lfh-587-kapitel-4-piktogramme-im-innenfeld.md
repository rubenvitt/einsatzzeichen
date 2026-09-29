# Kapitel-4-Piktogramme im Körper: was die Referenz tut und welche Regel daraus folgt

> Stand: 29. September 2026
> Status: **Vorlage, Entscheidung des Eigentümers offen.** Vorbereitet zu LFH-587 (Subtask von
> LFH-562, Zonenmodell; verlinkt aus LFH-582). Die Messung und die belegten Befunde sind als
> Daten und Gates umgesetzt, die offene Frage steht in Abschnitt 5 mit Empfehlung.
> Bezug: `docs/decisions/2026-09-19-masse-an-der-referenz-ablesen.md` §6,
> `docs/decisions/2026-09-20-zonenmodell-als-daten.md` (Punkt 3 und §3 Befund 6),
> `docs/decisions/2026-09-28-lfh-567-mehrfachfaehigkeiten-und-sonderformen.md` (Kombinationen)

## 1. Auftrag

Die 92 Kapitel-4-Piktogramme sind seit PR #56 deckungsgleich mit der BABZ-Referenz, und zwar als
**Einzeldarstellung** auf der vollen 32 × 32-mm-Fläche. `compose()` setzt ein Piktogramm aus
`capabilities` unskaliert in den Körper. Die meisten ragen dabei hinaus, etwa das Sanitätskreuz
4.6.1 mit y 1,75 bis 30,25 gegen den Formationskörper y 6 bis 26.

Gesucht ist eine Regel für das Innenfeld (die Fähigkeitsbox), nach der jedes Kapitel-4-Piktogramm
in jeden zulässigen Körper passt: Skalierung, Umformung oder eigene Innenfeld-Fassung. Die Regel
soll an den Referenzen gemessen sein, nicht angenommen.

## 2. Was gemessen wurde und woran

**Die Referenzdateien liegen nicht im Repository** (Entscheidung vom 19. September, §2). Gemessen
wurde deshalb an dem, was aus ihnen abgelesen und eingecheckt ist: an jeder **Körperfassung** eines
Kapitel-4-Piktogramms, die eine Fixture über `bodyMarks` zeichnet. Diese Fassungen sind in
Anhang C, D, F, G, H und I an den Referenzdateien vermessen und mit ihnen deckungsgleich.

Das Verfahren (`measureCapabilityInset()` in `core/src/blocks/capability-inset-measure.ts`):

- `compose()` läuft für jede Fixture mit den Katalogports. Mitgeschrieben wird jeder Aufruf von
  `bodyMark()` für eine `CapabilityId`, mit Kontext und Körperhülle, genau wie `compose()` ihn
  macht (`conformance/src/capability-inset-evidence.ts`).
- Die Mittellinienhülle der Körperfassung wird gegen die der Einzeldarstellung gelegt. Daraus
  ergeben sich der Breitenfaktor `sx`, der Höhenfaktor `sy` und die Achse, auf der die Fassung von
  Körperkante zu Körperkante reicht.
- Die Strichstärken der Fassung werden gesammelt.

Ergebnis: **52 Fassungen im Körper, von 20 Fähigkeiten an 14 Körperfassungen**, aus 111 Messpunkten in
94 Fixtures. Das Gate `conformance/src/capability-inset-fixtures.test.ts` rechnet die Tabelle
`CAPABILITY_INSET_FORMS` aus dem Motor nach.

Zusätzlich gemessen: die **unskalierte Einsetzbarkeit** aller 92 Einzeldarstellungen mit dem
vorhandenen Clipping-Gate (`checkClipping`) an den acht Körperformen mit Flächenmodell.

## 3. Befunde

### 3.1 Drei Behandlungen, kein gemeinsamer Faktor

Jede Körperfassung fällt in genau eine von drei Arten:

| Behandlung | Merkmal | Anzahl | Beispiele (sx × sy) |
|---|---|---:|---|
| `flush` — randbündig umgeformt | reicht auf mindestens einer Achse von Körperkante zu Körperkante | 24 | Sanitätskreuz Formation 1,07 × 0,71, im Kreis 0,86 × 0,86; Zelt Formation 1,00 × 0,80; Brandbekämpfung C.1.1 1,03 × 1,00 |
| `reduced` — gleichmäßig verkleinert | freistehend, `\|sx − sy\| / max ≤ 0,3` | 23 | Verpflegung 0,42 × 0,42; Instandsetzung 0,60 × 0,50; Abfallentsorgung 0,67 × 0,68 |
| `reshaped` — frei umgeformt | freistehend, ungleichmäßig | 5 | Zelt im Kreis 0,53 × 0,84, im Personenkörper 0,43 × 0,26; Wasserförderung 0,92 × 0,29 |

Die Grenze 0,3 zwischen `reduced` und `reshaped` ist aus einer **leeren Lücke der Messwerte**
gewählt: die größte Abweichung einer verkleinerten Fassung ist 0,22 (Wasserrettung am
Landfahrzeug, I.2.1), die kleinste einer umgeformten 0,37 (Zelt im Kreis, F.3.13). Das Gate hält
beide Zahlen fest und wird rot, sobald eine neue Fassung in die Lücke fällt.

Dasselbe Piktogramm wird je Körperform verschieden behandelt. Das Zelt 4.2.1 ist in der Formation
randbündig, im Kreis und im Personenkörper frei umgeformt. Die Brandbekämpfung ist in Formation
und Personenkörper randbündig, im eingesenkten Wasserfahrzeugrumpf (I.3.11) umgeformt.

### 3.2 Die Strichstärke bleibt

Jeder Strich jeder der 52 Fassungen ist 0,5 mm breit, wie in den Einzeldarstellungen. Die Fassung
wird kleiner, der Strich nicht. Einzige Fassung ohne Strich ist die Stromversorgung in G.4: sie
zeichnet im Körper nur Flächen.

Das deckt sich mit der Beobachtung des Tickets an C.1.7 und C.1.8 („bei gleicher Strichstärke").

### 3.3 Drei Rechenregeln sind widerlegt

| Kandidat | Befund | Beleg |
|---|---|---|
| **Unverändert einsetzen, wo es passt** | widerlegt | Sechs Fähigkeiten passen unskaliert in die Formation und haben dort eine vermessene Fassung (Brandbekämpfung, Ruhen, Wasserförderung, Abfallentsorgung, Instandsetzung, Trinkwasser). Keine davon ist unverändert eingesetzt. G.8 verkleinert die Abfallentsorgung auf 0,67, obwohl sie ganz hineinpasste. |
| **Ein gemeinsamer Faktor** | widerlegt | Die Breitenfaktoren der verkleinerten Fassungen reichen von 0,30 (F.2.13) bis 0,93 (I.1.9#alternative). |
| **Einpassen in die Fähigkeitsbox 24 × 16 mm** | widerlegt | Der gemessene Faktor liegt zwischen dem 0,62- und dem 1,17-Fachen des eingepassten, je Fähigkeit verschieden. Die Referenz zeichnet also teils kleiner als die Box und teils größer. Die Verpflegung (G.1.2) steht mit 0,42 im Körper, eingepasst wären es 0,67. |

### 3.4 Was an den verkleinerten Fassungen trägt

- **Die Breite ist körperunabhängig.** Steht eine verkleinerte Marke allein im Körper, hat sie in
  jeder Körperform dieselbe Breite: die Instandsetzung 18 mm an Formation, Anhänger,
  Landfahrzeug und Kreiskörper; die Mahlzeitenzubereitung 14 mm an drei, Verpflegung und
  Betriebsstoffe an zwei Körperformen.
- **Die Höhe gibt nach.** In G.3.5 rückt die Betriebsstoffmarke für den unteren Lauf zusammen, in
  I.2.1 bis I.2.3 ändert die Wasserrettungsmarke ihre Höhe je Fahrzeugkategorie.
- **Unter dem Zelt wird es enger.** Drei verkleinerte Marken stehen unter dem Zelt 4.2.1 kleiner
  als in ihren Einzelfixtures (Ruhen in F.1.3 und F.1.19, Mahlzeitenzubereitung in F.2.13,
  Trinkwasser in F.2.17). Die Verpflegung in F.1.17 nicht. Daraus folgt keine Regel.

### 3.5 Unskalierte Einsetzbarkeit der 92 Einzeldarstellungen

| Körperform | passen unskaliert |
|---|---:|
| `formation` | 27 |
| `container` | 16 |
| `building` | 14 |
| `post` | 7 |
| `person` | 3 |
| `point` | 2 |
| `measure`, `hazard` | 0 |

Keine der sieben Alternativdarstellungen passt in einen der acht Körper. Für die übrigen elf
Körperformen ist das Clipping-Gate nicht auswertbar, weil ihr Körper ein Pfad oder ein offener
Polyzug ist. Die Liste je Körperform steht in `CAPABILITY_UNSCALED_FIT`.

### 3.6 Die Hinweise des Tickets

- **F.1.8 (4.6.5 im Körper).** Im Bestand ist das Kreuz randbündig über den ganzen Körper
  gespannt (`flush`, 1,07 × 0,71) und der Ring auf r 5,5 verkleinert. Das bestätigt die
  Beobachtung „keine gleichmäßige Skalierung". Die Körpermarken führen dieselbe Gegenüberstellung
  seit dem 18. August im Kopfkommentar von `geometry/body-marks.ts`.
- **C.1.7 und C.1.8.** Beide Zeichen sind nicht gebaut. Das Kennzahlenartefakt erfasst ihre
  Piktogramme nicht, weil sie Kurvenpfade sind (`curvedPaths: 1` und `3`). Die Beobachtung des
  Tickets (etwa 0,75 in der Breite, in der Höhe stärker, gleiche Strichstärke, in C.1.7 ein
  umgeformter Messstrich) passt zu `reshaped` und zu 3.2, ist hier aber **nicht nachgemessen**.
- **C.2.** Kein Zeichen aus C.2 ist gebaut. Das Kennzahlenartefakt erfasst die Innenzeichnungen
  nur als Umrisshüllen ohne Bedeutung (etwa 15,82/10,75 bis 29,25/24,18 mm in
  C.2.14 Alternative). Welche davon ein Kapitel-4-Piktogramm ist, lässt sich ohne die
  Referenzdatei nicht sagen.

## 4. Was gebaut ist

- `schema/src/capability-inset.ts`: die Typen `CapabilityInsetTreatment`, `CapabilityInsetForm`,
  `CapabilityInsetRule` und `CapabilityInsetPolicy`, mit dem Belegstand `GrammarFinding` aus
  LFH-565/567.
- `core/src/blocks/capability-inset-measure.ts`: das Messverfahren `measureCapabilityInset()` und
  die zwei Schwellen (Randbündigkeit 0,01 mm, Gleichmäßigkeit 0,3).
- `core/src/blocks/capability-inset.ts`: `CAPABILITY_INSET_FORMS` (52 Fassungen),
  `CAPABILITY_UNSCALED_FIT` (acht Körperformen) und `CAPABILITY_INSET_RULE` mit fünf belegten
  Aussagen und einer Empfehlung.
- Zonenmodell: die Zone `inner-field` trägt an den sieben Körperfassungen mit Innenfeld die Regel
  `capability-inset`. Die Lückenbegründung der übrigen nennt jetzt, dass die Lücke die weiße Kontur
  betrifft und nicht die Fähigkeit.
- Regelkatalog: der Lückenvermerk der Dimension `capabilities` nennt die Messung.
- Gates: `capability-inset.test.ts` in `core` (Form der Daten, Messverfahren an künstlichen
  Fassungen) und `capability-inset-fixtures.test.ts` in `conformance` (Daten gegen den Motor, jede
  Aussage der Regel an den Zahlen, die unskalierte Einsetzbarkeit gegen `checkClipping`).

`compose.ts`, `validate.ts` und `layout/profiles.ts` sind unverändert. Kein Bild ändert sich.

## 5. Die Regel und die offene Entscheidung

**Was die Referenz tut, ist belegt:** Sie setzt ein Kapitel-4-Piktogramm nie unverändert und nie
nach einer gemeinsamen Rechnung in einen Körper. Sie zeichnet eine **eigene Innenfeld-Fassung je
Paar aus Fähigkeit und Körperform**, randbündig, verkleinert oder umgeformt, immer mit 0,5 mm
Strich. Der Katalog führt genau diese Fassungen schon als `bodyMarks`.

**Offen ist, was für die Paare ohne Fassung gilt**, und damit, was aus der Boxfassung
`capabilities` wird. Drei Möglichkeiten:

| Option | Was sie tut | Folge |
|---|---|---|
| **A — nur vermessene Fassungen** (`measured-rendition-only`) | Ein Piktogramm kommt nur über eine eigene, an der Referenz vermessene Fassung in den Körper. `capabilities` wird für Paare ohne Fassung fail-closed. | Referenztreu. Die Boxfassung verliert ihre Funktion für die 65 Piktogramme, die heute überstehen, und in der Folge auch für die 27, die passen, denn auch dort weicht die Referenz ab (3.3). Jedes neue Paar ist Messarbeit an der Referenzdatei. |
| **B — unskaliert, wo es passt** (`unscaled-if-fits`) | Die Boxfassung bleibt. `validateSpec` lehnt ein Piktogramm ab, das an dieser Körperform das Clipping-Gate nicht besteht. | Kein überstehendes Bild mehr. Die 27 passenden in der Formation zeichnen weiter, aber nicht so, wie die Referenz sie zeigt (3.3). |
| **C — in die Box skalieren** (`uniform-scale-to-box`) | Jedes Piktogramm wird gleichmäßig in die Fähigkeitsbox eingepasst, bei fester Strichstärke. | Jedes Paar zeichnet etwas. Die Größe ist an keinem vermessenen Fall richtig (Faktor 0,62 bis 1,17 daneben), und randbündige Zeichen wie das Sanitätskreuz verlören ihre Randbündigkeit. |

**Empfehlung des Koordinators: A als Regel, B als Übergang.** A ist die einzige Option, die die
Referenz trägt. B verhindert bis dahin, dass der Motor überstehende Bilder zeichnet, ohne die 27
heute passenden Fälle zu brechen. C wird nicht empfohlen: es erzeugte für 92 × 19 Paare ein Bild,
das an keinem vermessenen Fall stimmt, und behauptete damit eine Messung, die es nicht gibt.

In den Daten steht die Empfehlung als `CAPABILITY_INSET_RULE.unmeasuredPairs`, Status `proposed`,
Wert `measured-rendition-only`.

Beschlossen werden müsste mit B außerdem eine Prüfregel (Vorschlag:
`capabilities-inset-not-measured`). Sie ist hier bewusst **nicht** vorgemerkt: die vorgemerkten
Regeln der Dimension `capabilities` sind an LFH-567 gebunden, und eine dritte würde
`planned-capability-rules.test.ts` und `capability-combinations.test.ts` für eine noch nicht
getroffene Entscheidung umbauen.

## 6. Nicht Teil

- Die Umsetzung von A oder B in `compose()` oder `validateSpec`. Das entscheidet der Eigentümer.
- Die Vermessung weiterer Paare, insbesondere C.1.7, C.1.8 und C.2. Sie braucht die
  Referenzdateien und gehört in ein eigenes Ticket.
- Mehrere Piktogramme in der Boxfassung. Das ist LFH-567 §5 Frage 1.
- Eine fachliche Freigabe. Die Domain-Reviews der Fixtures bleiben, wie sie sind.
