# Boxfassung `capabilities` ablösen: was die Referenz hergibt und was zu entscheiden ist

> Stand: 29. September 2026
> Status: **Vorlage, offen.** Zu entscheiden hat der Projektinhaber (§6). Nichts am Motor ist
> geändert.
> Ticket: LFH-787 (Subtask von LFH-562, Zonenmodell; Folgeticket von LFH-587 und LFH-786).
> Bezug: `docs/decisions/2026-09-29-lfh-587-kapitel-4-piktogramme-im-innenfeld.md` §5 und §6,
> `docs/decisions/2026-09-29-lfh-786-kapitel-4-piktogramme-in-anhang-c.md` §7

## 1. Auftrag

Entschieden ist seit dem 29. September: **Ziel A** (`measured-rendition-only`), ein
Kapitel-4-Piktogramm kommt nur über eine eigene, an der Referenz vermessene Fassung in den Körper;
**in Kraft B** (`unscaled-if-fits`), die Boxfassung `capabilities` bleibt, wo die
Einzeldarstellung nachweislich unskaliert im Körper bleibt (`CAPABILITY_UNSCALED_FIT`).

LFH-787 soll für die Paare, die heute über `capabilities` zeichnen, vermessene Körperfassungen
ergänzen oder sie bewusst aufgeben, danach `inForce` auf `measured-rendition-only` stellen und
klären, ob `capabilities` entfällt oder als Alias auf `bodyMarks` bleibt.

Diese Vorlage klärt zuerst, **wie viele dieser Paare die Referenz überhaupt zeigt**.

## 2. Die Paare

`CAPABILITY_UNSCALED_FIT` führt **69 Paare**: Formation 27, Container 16, Gebäude 14, Posten 7,
Person 3, Punkt 2. Eine vermessene Grundfassung (`CAPABILITY_INSET_FORMS`, ohne Körpervariante)
haben davon **2**:

| Paar | Fassung | Fixture |
|---|---|---|
| `fire-fighting` × Formation | `flush` 1,03 × 1,00 | C.1.1 bis C.1.3 |
| `temporary-accommodation-resting` × Formation | `reduced` 0,36 × 0,38 | F.1.19 |

Vier weitere Fähigkeiten sind in der Formation nur **mit Fußband** vermessen (Anhang G):
`water-conveyance`, `waste-disposal`, `maintenance`, `drinking-water`. Das ist eine andere
Körperfassung. Die Boxfassung ist an einer Körpervariante heute schon gesperrt, also zählen sie
nicht als Grundfassung.

**Offen sind 67 Paare.**

## 3. Was die Referenz zeigt

Durchsucht sind alle 411 Anhangdateien (C bis N, 381 Nummern) unter den lokalen BABZ-Referenzen, gebaute wie
ungebaute. Das Kapitel-4-Piktogramm ist jeweils über die Geometrie gegen die 92 Einzeldarstellungen
bestimmt, nicht über den Dateinamen. `referenceInventory()` meldet für E und J bis N nichts
Unbeanspruchtes. Ungebaut sind nur noch Teile von C.1 und C.2.

### 3.1 Ein Paar hat einen Beleg, ein zweites nur in Kombination

| Paar | Referenz | Stand | Fassung |
|---|---|---|---|
| `technical-assistance` × Formation | C.1.4 Rüstzug | nicht gebaut | Bis auf 0,001 mm gleich der Fassung im Rüstwagen C.2.18, nur 0,5 mm höher gesetzt. Übertragen: 0,90 × 1,25, `reduced` (Uniformität 0,28, knapp unter der Grenze 0,30), Strich 0,5 mm |
| `slaughter-culling` × Formation, **nur in Kombination** | H.3 | gebaut, aber als technische Marke `h-veterinary-slaughter` zusammen mit dem V aus 4.10.1, das 2 mm nach rechts rückt | Wippe verkleinert links unten, Mittellinie gegen Mittellinie etwa 0,40 × 0,42. Die Marke ist als gefüllte Kontur gebaut; `measureCapabilityInset` misst deshalb 0,40 × 0,50 |

Sauber belegt ist nur C.1.4. H.3 zeigt die Wippe nur neben dem V, also als Kombinationsbild wie
C.2.31; eine Einzelfassung daraus wäre ein Schluss, keine Messung (so LFH-786 §5 zum
Kettenfahrzeug). Die Verkleinerung in H.3 kann auch vom geteilten Körper kommen.

C.1.4 ist **eine weitere Absage an „unverändert einsetzen, wo es passt“**: 4.7.18 steht in
`CAPABILITY_UNSCALED_FIT` für die Formation, die Referenz verkleinert und formt es trotzdem um.

### 3.2 65 Paare zeigt die Referenz nirgends, eines nur in Kombination

| Körperform | offen | Einzelbeleg | nur Kombination | ohne Beleg |
|---|---:|---:|---:|---:|
| Formation | 25 | 1 | 1 | 23 |
| Container | 16 | 0 | 0 | 16 |
| Gebäude | 14 | 0 | 0 | 14 |
| Posten | 7 | 0 | 0 | 7 |
| Person | 3 | 0 | 0 | 3 |
| Punkt | 2 | 0 | 0 | 2 |
| **zusammen** | **67** | **1** | **1** | **65** |

- **Container, Gebäude, Posten, Person, Punkt:** Keine Referenz zeigt ein Kapitel-4-Piktogramm in
  einem dieser Körper. Das einzige Gebäude (E.1.37) trägt Text. Die Posten in D.2 tragen kein
  Kapitel-4-Piktogramm. Personen zeigen nur schon vermessene Fähigkeiten (D.3) oder die
  Wasserrettung an kompakten Rautenvarianten (I.5), keine der drei Löschmittel.
- **Formation, ohne Beleg (23):** `service-water`, `foam-agent`, `solid-extinguishing-agent`,
  `gaseous-extinguishing-agent`, `reconnaissance`, `biological-location`, `technical-location`,
  `recovery`, `water-hazard-control`, `remote-manipulation`, `chainsaw`, `mechanized-clearing`,
  `overcoming-height-differences`, `loudspeaker-warning`, `water-conveyance`, `water-retention`,
  `load-pulling`, `bridge`, `waste-disposal`, `maintenance`, `toilet-facility`, `drinking-water`,
  `information-communications`. Die THW-Fachgruppen in E, deren Bedeutung einer dieser Fähigkeiten
  entspräche (Räumen, Ortung, Brückenbau, Pumpen, Trinkwasser), tragen nur Kürzel.

Für diese 65 Paare gibt es **keine Messarbeit, die sie je belegen könnte**, solange die Quelle
bleibt, wie sie ist. Unter A heißt „bewusst aufgeben“ für sie: dauerhaft gesperrt.

### 3.3 Nebenbefunde

- **Zweite Fassungen schon vermessener Paare.** C.1.11 zeichnet `cbrn-protection` in der Formation
  verkleinert (etwa 0,70 × 0,55, deckungsgleich mit C.2.20#alternative), F.1.2 randbündig
  (1,22 × 0,90). C.1.12 zeichnet `cbrn-detection` anders als C.1.7 (Ecke-zu-Ecke-Linie plus
  kleinere Zange; die Lesart 4.1.1 + 4.4.1 ist geometrisch nicht ausgeschlossen). C.1.15 zeigt
  die Wasserrettung höher als I.1.9 (etwa 0,36 × 0,50 gegen 0,44, geschätzt; die Uniformität kann
  in die Lücke 0,30 bis 0,37 fallen). Sie bräuchten eigene `rendition`-Kennungen.
- **Ungebaute C.1-Zeichen mit schon vermessenen Paaren:** C.1.6 (wie C.1.1), C.1.9 (wie C.1.7),
  C.1.10 (wie C.1.8). Sie gehören zu LFH-418.
- **Messfalle I.1.5 bis I.1.8:** Die Marke `formation-water-rescue-compact` ist als gefüllte Kontur
  gebaut; der Motor misst 0,40 × 0,48 statt 0,36 × 0,46. Wer sie als Kapitel-4-Fassung übernimmt,
  übernimmt falsche Faktoren. Dasselbe gilt für H.3.
- **M.11** zeigt 4.7.26 im Kreis mit r 12 (`circle-12`, nicht Posten mit r 14), etwa 0,75 × 0,67
  umgeformt. Das ist kein offenes Paar.
- **4.4.1 Erkunden weicht von der Referenz ab.** Die Referenz zeichnet die Mittellinie von
  (2|26) nach (30|6), 28 × 20 mm; der Katalog `M 5 24 L 27 8`, 22 × 16 mm, also etwa 0,79-fach.
  Das Piktogramm ist fachlich freigegeben (04.09.) und trägt den Vermerk „bleibt unverändert“.
  Das widerspricht „deckungsgleich“ aus PR #56 und **berührt diese Inventur**: Mit der
  Referenzlinie (Strich 0,5 mm, stumpfe Enden) läge die untere Ecke bei y ≈ 26,2, also über der
  Körperunterkante der Formation (y 26). `reconnaissance` × Formation, möglicherweise auch ×
  Container, stünde dann nur wegen der zu kleinen Katalogzeichnung in `CAPABILITY_UNSCALED_FIT`.
  Mit `checkClipping` nicht nachgerechnet. **Die 69 Paare sind also nicht gesichert.**

## 4. Was das Abschalten kostet

**Beide Wege aus dem Ticket sind ein Breaking Change und führen zu 3.0.0.** Allein der Wechsel von
`inForce` lehnt Specs ab, die heute gültig sind.

- **`inForce` ist reine Daten.** Niemand wertet es aus; `validate.ts` importiert nur
  `CAPABILITY_UNSCALED_FIT`. Der Wechsel muss in `capabilities-pictogram-overflows-body`
  (`validate.ts`) von Hand nachgezogen werden.
- **Entfernen.** Betroffen sind das Feld in `taxonomy.ts`, der Boxzweig in `compose.ts`, zwei
  Regel-IDs, `CAPABILITY_UNSCALED_FIT`, `PLANNED_CAPABILITY_RULES`, der `box`-Eintrag der
  Kombinationsregeln, die Regeldimension `capabilities`, `ruleCoverage`, Baukasten, Doku und
  Tests. Ohne Gegenmaßnahme ginge ein `capabilities`-Schlüssel aus altem JS-Code oder einem alten
  `?spec=`-Link **still verloren**: `decodeSpec` prüft nur `kind`, `validateSpec` prüft keine
  unbekannten Felder.
- **Alias auf `bodyMarks`.** Keine reine Umbenennung:
  - `bodyMarks` kann die Boxfassung nicht ausdrücken, und die Fassungswahl liegt in einer eigenen
    Map (`bodyMarkRenditions`), eine je Marke;
  - 67 der 69 Paare würfen heute in `compose()` einen `NotMeasuredError` statt einer
    Regelmeldung, denn für unvermessene Körpermarken gibt es keine Validierungsregel. Die würde
    neu gebraucht;
  - die zwei vermessenen Paare zeichneten ein anderes Bild als heute;
  - der Feldname verspräche eine Box, die es nicht mehr gibt.
- **Snapshot-Achsen und Tests.** Die einzige Datei-Snapshot-Achse mit `capabilities` ist
  `organization-profiles.svg` (sieben Organisationen, Formation mit `fire-fighting`). Dazu kommen
  `CAPABILITY_TEST_COMPOSITIONS` im Clipping-Gate, die Gruppen-Tests in `recipes.test.ts`,
  `compose.test.ts` (Ebenenfolge), `pictogram-gate.test.ts`, `validate.test.ts` und die
  Regelabdeckung. Kein Rezept und keine Fixture setzt `capabilities`.
- **Adapter** (react, web-component, maplibre, qgis) nehmen `Drawing` entgegen und sind nicht
  betroffen.

## 5. Optionen

| Option | Was sie tut | Folge |
|---|---|---|
| **A1 — A vollziehen, `capabilities` entfernen** | `inForce: measured-rendition-only`; das Feld entfällt, ein Altschlüssel wird fail-closed abgelehnt. | Referenztreu ohne Ausnahme. 65 Paare dauerhaft gesperrt (§3.2), die übrigen nur noch über `bodyMarks`. 3.0.0. |
| **A2 — A vollziehen, Alias** | wie A1, `capabilities` wird auf `bodyMarks` abgebildet, neue Regel für unvermessene Körpermarken. | Wie A1, dazu ein Feld mit irreführendem Namen und doppelter Semantik. 3.0.0. |
| **AB — A, wo die Referenz spricht; B, wo sie schweigt** | Hat ein Paar eine vermessene Fassung, lehnt `validateSpec` die Boxfassung ab und verweist auf `bodyMarks`. Ohne Fassung bleibt B. `target` wird zu einer neuen Politik. | Nichts Referenzuntreues, wo es eine Referenz gibt. Die 65 stummen Paare zeichnen weiter unskaliert, wie heute. Bricht nur die Paare mit Fassung: heute 2, mit C.1.4 3. Ebenfalls 3.0.0, aber schmal. Ändert die Entscheidung vom 29.09. (Ziel A). **Kosten:** Für die 65 stummen Paare bleibt eine Darstellung, der jeder vermessene Fall widerspricht (jetzt auch C.1.4). |
| **B bleibt, Ticket ruht** | Nur die belegte Fassung aus C.1.4 als `bodyMarks` bauen, kein Wechsel. | Kein Breaking Change (`feat`). Die Boxfassung bleibt überall, wo sie heute gilt, auch dort, wo die Referenz jetzt anders zeichnet. |

**Empfehlung des Vorbereiters: AB.** A setzt voraus, dass die Paare nach und nach vermessen werden.
§3 zeigt, dass das für 65 der 67 nicht geht: die Quelle zeigt sie nicht. A1 und A2 würden damit
zwei Drittel der Formationsfähigkeiten und alle Fähigkeiten an Container, Gebäude, Posten, Person
und Punkt dauerhaft sperren, ohne dass je ein Beleg sie wieder öffnen könnte. AB hält die Linie
„gemessen, nicht angenommen“ dort, wo es etwas zu messen gibt, und lässt B als erklärte Lücke
stehen, wo die Quelle schweigt. Der Preis: Dort zeichnet der Motor weiter etwas, das die Referenz
an keinem vermessenen Fall so zeichnet. Wer das nicht hinnehmen will, wählt A1. Wenn A1 gewählt
wird, dann Entfernen statt Alias (§4).

## 6. Zu entscheiden

1. **Politik für Paare ohne Fassung:** A1, A2, AB oder B bleibt?
2. **Bau von C.1.4** als Fixture mit der Fassung `technical-assistance` × Formation: in diesem
   Ticket oder in LFH-418? Und darf aus dem Kombinationsbild H.3 eine Einzelfassung
   `slaughter-culling` × Formation abgeleitet werden (Schluss, keine Messung)?
3. **Zweite Fassungen** aus C.1.11, C.1.12 und C.1.15 (§3.3): mitbauen oder LFH-418?

## 7. Nicht Teil

- Die Korrektur von 4.4.1 Erkunden (§3.3). Eigenes Folgeticket.
- Die übrigen ungebauten C.1-Zeichen (LFH-418).
- Mehrere Piktogramme in der Boxfassung (LFH-567 §5 Frage 1).
- Eine fachliche Freigabe.
