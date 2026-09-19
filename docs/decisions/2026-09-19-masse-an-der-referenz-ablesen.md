# Maße an der Referenz ablesen, Geometrie eigenständig konstruieren

> Entscheidung vom 19. September 2026
> Status: entschieden durch den Projektinhaber; ersetzt D.1 §3 und die gleichlautenden
> Autorschaftsaussagen der Anhangsnotizen

## 1. Anlass

Das erste Fachreview (19. September 2026, Fachreview-Werkzeug) hat 93 von 98 geprüften
Darstellungen als `deviation` markiert, darunter nahezu alle 92 Darstellungen aus Kapitel 4.
Die Befunde fallen in wenige Klassen: „falsche Maße", „falscher Winkel", „nicht ausgefüllt",
„falsche Schrift" und — am häufigsten — „falsche Darstellung".

Ein Pixelvergleich aller 544 Manifestzeilen gegen die lokalen Referenzdateien zeigt dieselben
Klassen weit über die geprüften Zeilen hinaus, besonders in 5.8 (Zustände), Anhang J, K, L, M
und E. Die Ursachen sind systematisch:

- Die Geometrie war nach Augenmaß geschätzt. Proportionen, Lage und Winkel weichen ab, einzelne
  Bildideen sind vollständig anders als die Referenz.
- Viele Piktogramme verwenden 1 mm Strichstärke, die Referenz 0,5 mm.
- Der Helfer `strokeCapability` erzeugt für jedes Piktogramm genau einen ungefüllten Pfad.
  Gefüllte Flächen, Kreise und Text der Referenz ließen sich so nicht abbilden.

Die Regel aus D.1 §3 („aus den lokalen BABZ-Referenzen wurden keine Pfaddaten, Koordinaten oder
transformierten Geometrien kopiert; die Referenzen dienen ausschließlich der visuellen und
semantischen Prüfung") hat diese Schätzungen erzwungen. Ein Sichtvergleich allein kann Maße nicht
auf einen halben Millimeter genau treffen.

## 2. Entscheidung

**Maße, Winkel, Positionen, Radien, Strichstärken und Farben dürfen an den lokalen
Referenzdateien abgelesen werden.** Aus diesen Maßen wird die Geometrie eigenständig mit
semantischen Primitiven konstruiert: `line`, `rect`, `circle`, `polyline`, `path` (nur die vom
Kommando-Gate zugelassenen absoluten Kommandos), `text` und `group`.

Nicht zulässig bleibt, `d`-Strings, Polygon-Punktlisten oder Transformationen der Referenz
umgerechnet zu übernehmen. Die Referenzdateien sind in Umrissflächen umgewandelt; ein Strich der
Referenz wird bei uns ein Strich mit Strichstärke, ein Kreis ein `circle` und ein Rechteck ein
`rect`. Werte werden auf sinnvolle Millimeter gerundet.

Die Referenzdateien bleiben weiterhin außerhalb des Repositorys und werden weder ausgeliefert noch
zur Laufzeit gelesen.

## 3. Folgen

- Die Autorschaftsaussage lautet künftig: „Maße an der Referenz abgelesen, Geometrie eigenständig
  konstruiert". Kommentare, die das Gegenteil behaupten, werden bei der Überarbeitung einer Datei
  angepasst.
- Die Sichtprüfung wird durch einen Pixelvergleich je Manifestzeile ergänzt (Referenz, eigene
  Darstellung, Überlagerung). Er ersetzt das Fachreview nicht: Ein technisch deckungsgleiches
  Zeichen ist noch keine fachliche Freigabe.
- Reviewstatus ändern sich nur im Fachreview-Werkzeug. Überarbeitete Zeilen bleiben `deviation`,
  bis sie erneut geprüft sind.
- Das Verhältnis zur Exact-Reference-Parity-Spezifikation (4. September 2026) bleibt eine eigene
  Entscheidung. Diese Notiz senkt die Hürde dorthin, trifft sie aber nicht.

## 4. Begleitende Änderungen derselben Runde

Diese Änderungen hat der Koordinator abgeleitet. Die offenen Folgefragen hat der Projektinhaber am
selben Tag an den Koordinator delegiert; die Antworten stehen in Abschnitt 5.

- **Clipping-Gate je Blatt.** `checkClipping` prüft die sichtbare Ausdehnung jedes Primitivs
  einzeln (Linien nur quer zur Richtung um die halbe Strichstärke, Füllflächen ohne Zuschlag) und
  zählt die Körperkontur zur Körperfläche. Kapitel-4-Piktogramme werden als Einzeldarstellung in
  ihrer eigenen ViewBox geprüft, wie die Referenz sie zeichnet. Ob ein Piktogramm in einen Körper
  passt, prüft `gate.test.ts` an den Kompositionen, die es tatsächlich einsetzen. Heute setzt kein
  Katalogrezept ein Kapitel-4-Piktogramm per `capabilities` ein. Die in-body-Tauglichkeit der
  92 Einzeldarstellungen ist damit nur für `fire-fighting` und `service-water` belegt.
- **Kontrastvertrag.** Eine Füllfläche mit eigener, ausreichend kontrastierender Kontur zählt nicht
  mehr als Vordergrund. Die Textschwelle 4,5:1 gilt nur gegen den tatsächlichen Hintergrund des
  Textes. Roter Text wie in der Referenz (4.1.6–4.1.8 Alternative, 5.8.1.7/8/10/11, L.10) und
  schwarzer Text auf Feuerwehr-Rot im Druck (4.2.2) stehen als Ausnahmen in
  `contrast-exceptions.ts`, `decidedBy: 'Koordinator (delegiert)'`.
- **Schriftgewicht.** Das Textprimitiv kennt `fontWeight: 400 | 700`. Eine statische Fettinstanz
  `Arimo-Bold.ttf` liegt im Repository, weil resvg die wght-Achse nicht auswertet. Kursiv gibt es
  weiterhin nicht.
- **Weiße Innenkontur in Anhang E** (`whiteInnerContour`, Port `innerField`) und
  **kombinationsabhängige Lage von Körpermarken** (`BodyMarkContext.bodyMarks`). Die Rezepte
  tragen weiterhin die Fachbegriffe, die Lage wählt der Resolver nach der Markenmenge.

## 5. Folgeentscheidungen (delegiert, 19. September 2026)

1. **Kontrastausnahmen:** angenommen. Roter Text in 4.1.6–4.1.8 (Alternative), 5.8.1.7/8/10/11 und
   L.10 sowie schwarzer Text auf Feuerwehr-Rot im Drucktheme (4.2.2) werden wie E.2.6 behandelt:
   gebaut wie die Quelle, der Befund als Datum in `contrast-exceptions.ts` geführt. Eine eigene
   Druckfarbe für Text auf Rot wäre eine Palettenentscheidung für alle Zeichen und gehört nicht in
   diese Runde.
2. **Strichstärke bei kleinen Rastergrößen:** Die Geometrie bleibt bei 0,5 mm wie in der Referenz.
   Bei 16 und 24 px sind Striche damit nur noch blassgrau. Das ist ein Problem der Rasterung, kein
   Geometriefehler. Es wird als eigene Aufgabe gelöst (Mindeststrichbreite je Ausgabegröße in den
   Renderern), damit die Katalogdaten referenztreu bleiben.
3. **G.3.2 „Verpflegungszubereitungsstelle Polizei“:** bleibt `polizei`. Die Referenz füllt die
   Fläche in der Farbe der Bundespolizei, der Titel nennt die Polizei, und die Fachfrage „wer
   betreibt die farbigen Kreiszeichen?“ ist offen. Die Farbe allein belegt nicht genug, um die
   fachliche Aussage des Zeichens zu ändern; die Zeile bleibt `deviation` mit diesem Befund.
4. **Schrift:** Arimo bleibt. Die Referenzschrift ist in Umrisse umgewandelt und nicht bestimmbar;
   eine schmal laufende Ersatzschrift bräuchte eine Lizenzprüfung und neue Metriken für alle
   Textläufe. Kursiv (D.1.1) entfällt aus demselben Grund. Beides ist eine eigene Aufgabe.
5. **J.1.14, grauer Platzhalter „Information“:** gehört nicht ins Zeichen. Er ist in der Referenz
   grau gesetzt und markiert die Stelle für eine Angabe des Nutzers, wie die Bezeichnungsfelder in
   Kapitel 2.
6. **F.2.6:** trägt `physician` statt `medical-service`. Die Referenz zeigt die Arztleiste (4.6.4),
   nicht nur das Sanitätskreuz.

## 6. Was offen bleibt

- Die Referenzschrift ist eine halbfette, schmal laufende Grotesk, nicht Arimo. Sie ist der größte
  verbleibende Unterschied in allen Familien mit Text (siehe 5.4).
- Mindeststrichbreite je Ausgabegröße (siehe 5.2).
- Die übrigen Kapitel-4-Piktogramme passen nicht in den Formationskörper. Wie ein Piktogramm in
  einen Körper eingesetzt wird, gehört in das Zonenmodell des Grammatik-Motors (LFH-562).
