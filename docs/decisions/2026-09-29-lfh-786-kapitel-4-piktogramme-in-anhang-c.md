# Kapitel-4-Piktogramme in C.1.7, C.1.8 und C.2: vermessen, gebaut und was sie an der Regel ändern

> Stand: 29. September 2026
> Status: **Umgesetzt.** Drei Fragen hat der Projektinhaber am 29. September 2026 entschieden:
> voller Umfang einschließlich der dafür nötigen Mechanismen, ein eigenes Drucktoken für Läufe auf
> Feuerwehrrot, und Fixtures bauen und Regelaussagen an die Belege anpassen. Drei
> Folgeentscheidungen hat der Koordinator getroffen; sie stehen in §8 und sind überstimmbar.
> Domain-Reviews aller neuen Fixtures bleiben `pending`.
> Ticket: LFH-786 (Subtask von LFH-562, Zonenmodell). Folgeticket: LFH-787 (Schritt B → A).
> Bezug: `docs/decisions/2026-09-29-lfh-587-kapitel-4-piktogramme-im-innenfeld.md` §3.6 und §6,
> `docs/decisions/2026-08-26-anhang-c-zuschnitt.md`

## 1. Auftrag

LFH-587 hat die Regel des Innenfelds an 52 Körperfassungen des Bestands gemessen. Die Zeichen, an
denen das Ticket seine Beobachtung ursprünglich machte, waren nicht gebaut: C.1.7, C.1.8 und die
Fahrzeuge aus C.2. LFH-786 sollte für jedes Kapitel-4-Piktogramm in diesen Zeichen die Fassung an
der Referenz ablesen, sie als `bodyMarks`-Fassung eigenständig konstruieren, das Zeichen als
Fixture aufnehmen und prüfen, ob die neuen Fassungen in die drei Behandlungen passen und die Lücke
zwischen 0,22 und 0,37 leer bleibt.

## 2. Umfang

Gebaut sind **37 Fixtures**: C.1.7, C.1.8 und 35 Darstellungen aus C.2.

| Gruppe | Fixtures | Fähigkeit (Kapitel 4) | Körper |
|---|---|---|---|
| C.1 | C.1.7 · C.1.8 | 4.1.2 Messen, Spüren, Detektieren · 4.1.3 Dekontaminieren | Formation |
| Löschfahrzeuge | C.2.4 bis C.2.13 | 4.3.1 Brandbekämpfung | Landfahrzeug |
| Anhänger | C.2.29 · C.2.30 | 4.3.1 · 4.8.11 Stromversorgung | Anhänger, Anhänger mit Fußband |
| Löschdrohne | C.2.31 | 4.3.1 und der Drohnenwinkel (technische Marke `track-chevron-top`) | Kettenfahrzeug |
| Höhenrettung | C.2.14 bis C.2.16 · C.2.17, je mit Alternative | 4.5.3 Drehleiter · 4.5.4 Teleskopgelenkmast | Landfahrzeug |
| Heben | C.2.27 · C.2.28, je mit Alternative | 4.7.9 Kran · 4.7.11 Heben/Räumen | Landfahrzeug |
| Technische Hilfe | C.2.18 | 4.7.18 Technische Hilfeleistung | Landfahrzeug |
| CBRN | C.2.20 und Alternative · C.2.24 · C.2.25 und Alternative | 4.1.1 · 4.1.2 · 4.1.3 | Landfahrzeug |
| Transport, Wasser | C.2.23 · C.2.26, je mit Alternative | 4.7.19 Transportieren · 4.7.26 Wasserförderung | Landfahrzeug |

Die Fähigkeit ist jeweils über die Form gegen die Einzeldarstellung bestimmt, nicht aus dem
Dateinamen. Das Fahrwerk ist aus der Geometrie abgelesen: zwei Räder bei x 3,75 und 28,25 ergeben
`kfz-kategorie-1`, drei Räder mit einem bei x 16 `kfz-kategorie-2`. Keine Marke hängt vom Fahrwerk
ab.

**Nicht gebaut**, weil sie kein Kapitel-4-Piktogramm tragen: C.2.1 bis C.2.3 (Kopfband), C.2.19
(Wechsellader, Körper aus 5.1.1.8), C.2.21 und C.2.22 (Logistik, Fußband).

**Nicht gebaut, Befund an der Quelle:** C.2.24#alternative. Die Datei heißt
„CBRN-Erkundungswagen“, und ihre Hauptdarstellung zeigt 4.1.2 mit Messstrich. Die Alternative
zeigt 4.1.1 ohne Messstrich und ist bildgleich mit C.2.20#alternative. Als Fixture ergäbe sie
dieselbe Spec wie C.2.20#alternative. Zudem wäre sie keine Messung von 4.1.2.

Beansprucht sind nur die einzelnen Abschnitte, weder `C.1` noch `C.2` als Ganzes.

## 3. Vorgehen

Gemessen wurde an den lokalen BABZ-Referenzdateien. Die Striche liegen dort als Umrisse vor; jede
Mittellinie ist aus den beiden Umrisskanten zurückgerechnet (Umrisskante ± 0,25 mm). Die
Geometrie ist eigenständig konstruiert und aus der Körperhülle gerechnet, Pfaddaten der Referenz
sind nicht übernommen. Jede Fixture ist als Rasterbild gegen die Referenz gelegt: Marke und Körper
weichen höchstens um Kantenglättung ab (unter 0,4 mm² je Zeichen). Der Text weicht wie im übrigen
Bestand um die Laufweite der Katalogschrift ab. Die Vergleichsbilder liegen nur lokal.

Die neuen Fassungen stehen in `core/src/geometry/body-marks-anhang-c/`, je Familie eine Datei.
`body-marks.ts` fragt diese Tabellen zuerst. Der Grund ist technisch: Register führen Fundorte in
`body-marks.ts` mit Zeilennummern, und jede Einfügung mitten in eine Tabelle hätte sie verschoben.

## 4. Was dafür neu gebaut ist

### 4.1 Zweite Fassungen desselben Paars (`bodyMarkRenditions`)

Anhang C zeichnet dieselbe Fähigkeit am selben Landfahrzeug in Haupt- und Alternativdarstellung
oft verschieden: die Drehleiter 6,5 mm weiter rechts, wenn der Lauf länger ist, die CBRN-Zange
ohne Lauf mittig und größer. Aus dem Beschriftungskontext lässt sich das nicht ableiten:
C.2.15#alternative und C.2.16#alternative enden mit ihrem Lauf auf derselben Tinte und zeichnen
die Leiter trotzdem verschieden.

Die Spec wählt die Fassung deshalb ausdrücklich, aus einer geschlossenen Liste geometrisch
benannter Kennungen (`BODY_MARK_RENDITION_IDS`):

| Kennung | Paar | Fixtures |
|---|---|---|
| `shifted-right-6.5mm` | Drehleiter am Landfahrzeug | C.2.14#alternative, C.2.15#alternative |
| `shifted-right-6.5mm-ladder-raised-1mm` | Drehleiter am Landfahrzeug | C.2.16#alternative |
| `shifted-left-1mm` | Teleskopgelenkmast am Landfahrzeug | C.2.17#alternative |
| `shifted-left-7mm-jib-5mm` | Kran am Landfahrzeug | C.2.27#alternative |
| `shifted-left-4mm` | Heben/Räumen am Landfahrzeug | C.2.28#alternative |
| `centered-large-tongs` | CBRN-Schutz und Dekontaminieren am Landfahrzeug | C.2.20#alternative, C.2.25#alternative |
| `raised-wave-3mm-arrow-3mm` | Wasserförderung am Landfahrzeug | C.2.26#alternative |

Eine Kennung ohne Fassung an ihrem Paar lehnt `validateSpec` mit
`body-mark-rendition-not-measured` ab, und `bodyMark()` wirft. Keine Kennung fällt auf die
Grundfassung zurück. In `CAPABILITY_INSET_FORMS` zählt jede zweite Fassung als eigene Zeile.

### 4.2 Drucktoken `koerperlauf-kontrast`

Die Referenz setzt die Läufe in C.1.8 und C.2 schwarz auf Feuerwehrrot. Im Drucktheme ist Rot
#666666; Schwarz darauf erreicht nur 3,657:1 gegen die Textschwelle 4,5:1. Entschieden ist ein
eigenes Token für Läufe im Körper: Schwarz im Referenz- und im accessible-light-Theme (5,218:1),
Weiß im Drucktheme (5,742:1). Die Rezepte setzen es ausdrücklich über `labels.inBodyInk`.
`bodyLabelInk()` bleibt unverändert, bestehende Fixtures färben sich nicht um. Die Ausnahme für den
PSNV-Piktogrammtext (4.2.2) bleibt stehen, sie betrifft Piktogrammtext und keinen Körperlauf.

### 4.3 Läufe

- Landfahrzeug: zwei vermessene Anker des mittigen Laufs für das „P“ in C.2.25 (21,3 mm ab der
  linken Körperkante) und C.2.25#alternative (15,5 mm). Beide sind das „P“ aus C.1.8, einmal auf
  0,5995 verkleinert, einmal um 0,5 mm verschoben.
- Anhänger mit Fußband: die Zone oben links (Grundlinie 6,75 mm unter der Körperoberkante) für
  „120“ in C.2.30.
- C.1.8 setzt sein „P“ über die vorhandene Grundlinienangabe der Formation (3 mm über der
  Körperunterkante).

## 5. Befunde zur Regel aus LFH-587

Die neuen Fassungen fallen alle in die drei Behandlungen: 4 randbündig, 20 verkleinert, keine frei
umgeformt. Der Bestand hat damit 76 Fassungen (28 randbündig, 43 verkleinert, 5 frei umgeformt) von
28 Fähigkeiten an 15 Körperfassungen, aus 148 Messpunkten in 131 Fixtures. Drei Aussagen der Regel
ändern sich:

| Aussage | bisher | jetzt | Beleg |
|---|---|---|---|
| Grenze zwischen `reduced` und `reshaped` | in einer leeren Lücke 0,22…0,37 | Lücke nur noch 0,30…0,37; die Grenze 0,3 bleibt | C.2.18 liegt bei 0,28, C.2.26 genau auf 0,30 (ungerundet 0,2987) und gilt mit `≤` als `reduced` |
| Strichstärke | Die Körperfassung behält die Strichstärke der Einzeldarstellung. | Jede Körperfassung zeichnet mit 0,5 mm, auch wo die Einzeldarstellung dünner ist. | 4.7.18 zeichnet mit 0,4 mm, seine Fassung im Rüstwagen C.2.18 mit 0,5 mm |
| Einpassen in die Fähigkeitsbox | gemessener Faktor das 0,62- bis 1,17-Fache | das 0,62- bis 1,51-Fache (weiter widerlegt) | C.2.18 mit 0,90 × 1,25 ist höher als die Einzeldarstellung selbst |
| Breite verkleinerter Fassungen körperunabhängig | trägt | **widerlegt** | CBRN-Schutz 0,56 (C.2.20) gegen 0,70 (C.2.20#alternative); Dekontaminieren 0,56 (C.2.25) gegen 0,70 (C.2.25#alternative, C.1.8); Kran 0,41 gegen 0,46 |

Wo die Breite noch trägt (Instandsetzung, Mahlzeitenzubereitung, Verpflegung, Betriebsstoffe,
Drehleiter, Wasserförderung, Stromversorgung 0,41 in G.4 und 0,42 in C.2.30), gibt die Höhe
nach.

Unverändert gilt: Kein Piktogramm ist unverändert eingesetzt, und es gibt keinen gemeinsamen
Faktor (verkleinerte Fassungen 0,30 bis 0,93 in der Breite). Die Schlussfolgerung aus LFH-587
bleibt: **eine eigene, vermessene Fassung je Paar aus Fähigkeit und Körperform**. Anhang C macht
daraus je Paar gegebenenfalls mehrere.

Weitere Befunde an einzelnen Fassungen:

- **C.1.7 und C.1.8** zeichnen die CBRN-Zange unter 45° mit Köpfen r 2,25 mm, keine
  Verkleinerung von 4.1.1 bis 4.1.3 (dort r 3,75, Neigung dx/dy 0,71). Der Messstrich in C.1.7 läuft
  von Körperecke zu Körperecke; die Fassung ist deshalb randbündig (1,00 × 0,90). C.1.8 ist
  verkleinert (0,70 × 0,60). Die Beobachtung aus LFH-587 („etwa 0,75 in der Breite, in der Höhe
  stärker“) trifft für die Zange zu, für die ganze Fassung von C.1.7 nicht.
- **Brandbekämpfung**: Am Landfahrzeug läuft die Waagerechte wie in C.1 von Kante zu Kante, der
  Scheitel liegt 10 mm vor der rechten Kante. Am Anhänger liegt er 9 mm davor, mit Steigung 10 : 9.
  Am Kettenfahrzeug endet der untere Schenkel 0,25 mm über der Rumpfecke.
- **C.2.16#alternative** hebt nur die Leiter um 1 mm an, der Korb bleibt. Einen Platzgrund gibt es
  nicht; möglicherweise ist das ein Zeichenfehler der Quelle. Gebaut wie gezeichnet.
- **Stromversorgung**: In C.2.30 ein 0,5-mm-Strich; die Fixture G.4 zeichnet dieselbe Fähigkeit im
  Katalog als Fläche.
- **Fassung am Kettenfahrzeug**: Die Brandbekämpfung ist dort nur zusammen mit dem Drohnenwinkel
  belegt (C.2.31). Sie steht als Einzelfassung des Körpers, weil sich die beiden Marken nicht
  überschneiden. Das ist ein Schluss, keine Messung.

## 6. Grenzen und Abweichungen

- Die Katalogschrift läuft etwa 7 % breiter als die der Referenz. In C.2.15#alternative und
  C.2.16#alternative berührt der Lauf „DLAK 18/12“ bzw. „DLAK 23/12“ deshalb die linke Korbseite
  (etwa 0,4 mm). In der Referenz halten beide Läufe Abstand.
- Reine Ziffernläufe („12/9“, „30“, „9“, „120“) stehen im Profilschriftgrad. Ihre Ziffern sind in
  der Referenz 2,75 mm hoch; das ist die Ziffernhöhe dieses Schriftgrads, keine eigene Versalhöhe.
  F.2.16 hatte „40“ noch über einen Metriksatz auf Ziffernhöhe gesetzt; Anhang C folgt dem nicht.
- C.2.28 schreibt „Telelader“, der Dateiname „Teleskoplader“. Gesetzt ist der gezeichnete Lauf.

## 7. Nicht Teil

- Der Schritt von B zu A, also das Abschalten der Boxfassung `capabilities` (LFH-787). Anhang C
  liefert dafür 24 weitere vermessene Paare, aber keins in der Formation für die 27 Piktogramme, die
  heute über `capabilities` zeichnen.
- C.2.1 bis C.2.3, C.2.19, C.2.21 und C.2.22 (kein Kapitel-4-Piktogramm) und die übrigen C.1-Zeichen.
  Sie gehören zu LFH-418.
- Eine fachliche Freigabe. Alle neuen Domain-Reviews bleiben `pending`.

## 8. Folgeentscheidungen des Koordinators

| Entscheidung | Begründung | Alternative |
|---|---|---|
| C.2.24#alternative nicht als Fixture aufgenommen, als `deferred` im Referenzinventar | bildgleich mit C.2.20#alternative, gleiche Spec (Spec-Schlüssel müssen eindeutig sein), keine Messung von 4.1.2 | aufnehmen, dann bräuchte die Herkunftsprüfung eine erklärte Dublette |
| Reine Ziffernläufe im Profilschriftgrad, ohne Metriksatz | die Ziffern sind beim Profilschriftgrad 2,75 mm hoch; „1“ steht in „DLAK 12/9“ und „12/9“ auf denselben Koordinaten | Metriksatz auf Ziffernhöhe wie F.2.16 („40“), der dann vermutlich rund 6 % zu klein setzt |
| Brandbekämpfung am Kettenfahrzeug als Einzelfassung des Körpers | in C.2.31 überschneiden sich Marke und Drohnenwinkel nicht | als Kombinationsfassung (`COMBINATION_MARKS`) nur zusammen mit dem Winkel gültig |
