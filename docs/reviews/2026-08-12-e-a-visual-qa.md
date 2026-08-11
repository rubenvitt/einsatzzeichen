# E-a — Visuelle QA aller 16 Darstellungen

> Prüfprotokoll · 12. August 2026 · Branch `claude/lfh-440-3253b1`

## 1. Methode

Anders als bei D.2 bis D.4 war hier eine **paarweise** Gegenüberstellung möglich und nötig: jedes
der 16 Zeichen ist eine Komposition, die eine konkrete Referenzdatei reproduzieren soll. Referenz
und Katalogausgabe wurden deshalb nebeneinander gerastert (je 512 px, weißer Grund, Schriftbindung
über `resvgFontOptions()`) und in vier Blättern zu je vier Paaren angesehen — links die
BABZ-Datei, rechts `pnpm cli export`.

Die Kürzel selbst wurden **vor** der ersten Zeile Kode aus einer eigenen Rasterung der 16
Referenzdateien abgelesen und gegen die Dateinamen gehalten; aus dem SVG sind sie nicht auslesbar
(Ebene `Takt. Zeichen (Typo)`, in Kurven umgewandelt). Dieses Protokoll hält das Ergebnis der
Konstruktion fest, nicht diese Referenzlektüre.

**Geprüfte Themes:** `reference` paarweise (alle 16). `accessible-light` und `print-monochrome`
über die Kontaktbögen der Mehrgrößenregression bei 256 px — anders als bei D.3 ist das hier
**keine** Auslassung per Argument: Anhang E malt mit `blau`, und `blau` ist in beiden
Alternativthemes ein anderer Wert. Beide Bögen wurden angesehen.

## 2. Die abgelesenen Kürzel

| Abschnitt | Datei | Mitte | unten links | unten rechts | Kopfzone |
|---|---|---|---|---|---|
| E.1.1 | Bergungsgruppe | `B` | — | `THW` | Gruppe |
| E.1.2 | Bergungsgruppe Abstützsystem Holz | `B` | `ASH` | `THW` | Gruppe |
| E.1.3 | Einsatznachsorgeteam | `ENT` | — | `THW` | **keine** |
| E.1.4 | Fachgruppe Bergungstauchen | `BT` | — | `THW` | Gruppe |
| E.1.5 | Fachgruppe Brückenbau | `BrB` | — | `THW` | Gruppe |
| E.1.6 | Fachgruppe Elektroversorgung | `E` | — | `THW` | Gruppe |
| E.1.7 | Fachgruppe Infrastruktur | `I` | — | `THW` | Gruppe |
| E.1.8 | Fachgruppe Notversorgung und Notinstandsetzung | `N` | — | `THW` | Gruppe |
| E.1.9 | Fachgruppe Ölschaden Typ A | `Öl` | `A` | `THW` | Gruppe |
| E.1.10 | Fachgruppe Ortung Typ A | `O` | `A` | `THW` | Gruppe |
| E.1.11 | Fachgruppe Räumen Typ A | `R` | `A` | `THW` | Gruppe |
| E.1.12 | Fachgruppe Schwere Bergung Typ A | `SB` | `A` | `THW` | Gruppe |
| E.1.13 | Fachgruppe Sprengen | `Sp` | — | `THW` | Gruppe |
| E.1.14 | Fachgruppe Trinkwasserversorgung | `TW` | — | `THW` | Gruppe |
| E.1.15 | Fachgruppe Wassergefahren Typ A | `W` | `A` | `THW` | Gruppe |
| E.1.16 | Fachgruppe Wasserschaden Pumpen Typ A | `WP` | `A` | `THW` | Gruppe |

Alle sechs Zeichen mit „Typ A" im Dateinamen tragen ein `A` unten links, und kein anderes Zeichen
außer E.1.2 trägt dort etwas. Das ist die visuelle Bestätigung der Zuschnitt-Entscheidung, „Typ A"
als eigene ID statt als Variantenachse zu führen: die Kennzeichnung ist eine sichtbare Marke am
Zeichen, keine zweite Zeichnung desselben Zeichens.

**Zweifelsfälle, die einzeln bei 900 px nachgeprüft wurden:** `ASH` (nicht `AsH`), `BrB` (nicht
`BRB`), `Sp` (nicht `SP`), `Öl` (nicht `ÖL`). In allen vier Fällen ist die Groß-/Kleinschreibung
bei dieser Vergrößerung eindeutig.

## 3. Zwei Befunde an der Referenz, nicht am Katalog

`E.1.6` und `E.1.14` zeigen im Paarbild einen weißen Streifen zwischen dem blauen Innenfeld und
dem unteren Rahmen; ihre gesamte Beschriftung sitzt entsprechend höher.

| Datei | blaue Füllfläche | Soll | Verschiebung der Beschriftung |
|---|---|---|---|
| `E.1.6_Fachgruppe Elektroversorgung.svg` | 42,52 Einheiten hoch | 51,024 | 3 mm nach oben |
| `E.1.14_Fachgruppe Trinkwasserversorgung.svg` | 43,937 Einheiten hoch | 51,024 | 2,5 mm nach oben |

Rahmen und Kopfzone stehen in beiden Dateien normal, und die Verschiebung der Beschriftung
entspricht exakt der Verkürzung der Füllfläche — das Bild ist in sich stimmig, aber gegenüber den
14 fehlerfreien Dateien um denselben Betrag verrutscht. **Der Katalog baut beide wie die anderen
14.** Der Befund steht in der `note` des technischen Reviews ihrer Manifestzeilen
(`coverage-manifest.ts`, `technicalReviewFor`) und als Datum in `ANHANG_E_A_FILL_DEFECTS`; ein
Test hält fest, dass genau diese zwei Dateien betroffen sind. Kein `deviation`-Status: der
bezeichnet eine bewusste Abweichung der Umsetzung von ihrer Quelle, hier weicht die Quelle von
sich selbst ab.

Das Fingerprint-Gate greift hier nicht: `matchFingerprint` wählt die `ring`-Form (den Rahmen), und
der ist in allen 16 Dateien gleich. Die zu kurze Füllfläche wäre ohne Sichtprüfung unentdeckt
geblieben.

## 4. Was die Paarbilder bestätigt haben

- **Alle 16 Kürzelsätze erscheinen** — mittiges Kürzel, `THW` unten rechts, bei sieben Zeichen die
  Zusatzkennzeichnung unten links. Kein Zeichen ist leer, keines trägt einen Lauf zu viel.
- **E.1.3 hat keine Kopfmarken**, alle 15 anderen genau zwei. Das ist der Sonderfall des Blocks
  und im Paarbild seitengleich.
- **Die Grundlinien liegen aufeinander.** Kürzel und Marken sitzen in Referenz und Ausgabe auf
  derselben Höhe; die Marken enden an denselben seitlichen Kanten.
- **`Öl` steht vollständig im Körper.** Der Umlautpunkt ist der höchste Ink des Bestands und war
  bei der Fußzone (Slice vom 9. August) genau der Fall, den kein Gate gefunden hatte.
- **Beide Alternativthemes bleiben lesbar.** Weißer Text auf dem aufgehellten Blau und auf dem
  Druckgrau ist bei 256 px scharf; die Kontursignatur des THW (Strichmuster `[2, 1.5]`)
  unterscheidet es weiterhin von der Feuerwehr, deren Grauwert nach der Palettenänderung näher
  liegt als vorher.

## 5. Zwei bewusste Abweichungen von der Referenz

Beide sind Eigenschaften des Katalogs, nicht dieses Teilslice, und in den Paarbildern sichtbar:

1. **Kein weißes Innenfeld.** Die Referenz zeichnet den Körper als weißes Rechteck mit einem 1 mm
   eingerückten farbigen Feld darin. `base-symbols.ts` führt die Taktische Formation als **ein**
   Rechteck, das der Kompositionsmotor füllt — dieselbe Vereinfachung, mit der schon C.1.1 und
   C.1.2 gegen ihre Referenz stehen. Die Beschriftungsränder sind darauf gerechnet (2 mm zur
   Körperkante statt 1 mm zur Innenfeldkante), der sichtbare Abstand ist derselbe.
2. **Andere Schrift.** Die Referenz setzt ihre Kürzel in einer schmaleren Schrift als Arimo;
   „THW" ist dort 9,04 mm breit, bei uns 9,63 mm. Die **Versalhöhen** stimmen (4,87 mm und
   2,92 mm), weil der Schriftgrad daraus abgeleitet ist. Eine Nachbildung des Referenzschnitts ist
   ohne Lizenzgrundlage nicht möglich und war schon bei Anhang J die ausdrücklich verworfene
   Alternative.

## 6. Grenzen dieses Protokolls

- Es prüft die **Konstruktion gegen die Referenz**, nicht die fachliche Richtigkeit. Alle 16
  Darstellungen sind `domain: pending`. Ob `B` die Bergungsgruppe bezeichnet und nicht den
  Bergungstrupp, ob `ENT` in einer Lagekarte verwechslungsfrei ist, ob die Zuordnung
  Kürzel → Einheit dem aktuellen THW-Aufbau entspricht: alles offen.
- Es prüft **nicht** die Lesbarkeit bei kleinen Rendergrößen. Beide Schriftgrade unterschreiten
  `MINIMUM_TEXT_RENDER_PX` unterhalb von 64 px; jeder Lauf trägt sein `minRenderPx` (37 bzw. 61)
  als deklarierte Einsatzgrenze. Ein Gate, das diese Grenze über Kompositionen prüft, gibt es
  noch nicht — es existiert bislang nur für Piktogramme.
- Es prüft **nicht**, ob eine deklarierte Textbox die Tinte fasst — das leistet die Rasterprüfung
  in `fonts.test.ts` für alle 16 Kürzelsätze, jeden Lauf einzeln isoliert.
