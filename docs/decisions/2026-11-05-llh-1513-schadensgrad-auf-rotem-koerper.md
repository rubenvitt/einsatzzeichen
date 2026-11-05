# Schadensgrad auf rot gefülltem Körper: weiße Unterlegung

Stand: 05.11.2026

## Anlass

Der Lifeline Hub zeichnet einen Schaden als Gefahr-Dreieck, gefüllt nach Ausmaß, und legt den
Schadensgrad nach 5.8.4 auf die Körpermitte (LLH-1115, LLH-1342). Bei Ausmaß „katastrophal“ ist die
technische Füllung `rot`. Die Diagonalen aus 5.8.4 sind ebenfalls rot: Auf dem Dreieck verschwinden
sie, angeschlagen, teilzerstört und total zerstört sehen gleich aus (Nachzug LLH-1513). Dasselbe
trifft jeden anderen rot gefüllten Träger, etwa eine Formation der Feuerwehr.

## Befund

- **Kein Original zeigt einen Schadensgrad an einem gefüllten Träger.** Belegt ist die Überlagerung
  nur am Deichprofil in L.8 und L.9 (siehe `2026-09-28-lfh-565-kapitel-5-8-bausteine.md`, 7.3). Die
  Lage am Körper ist seit dem 02.10.2026 abgeleitet (`derive/states.ts`).
- **DV 102 sieht für Schadensgrade keine andere Farbe vor.** 5.8.4.1 bis 5.8.4.3 sind rot, eine
  Regel für rote Untergründe gibt es nicht.
- **Kontrast rot auf rot ist 1 : 1** in jedem Theme, im Druckgrau `#666666` auf `#666666`. Der
  Kontrastvertrag der Diagonalen (`DAMAGE_CONTRAST`) deckt nur rot auf der Ausgabeoberfläche.

## Entscheidung

- **Die Lösung liegt in der Bibliothek**, nicht in der App: Die App kann am roten Träger nichts
  anderes zeichnen, ohne die Farbe der Füllung (Ausmaß) oder die des Schadensgrads aufzugeben, und
  jeder andere Nutzer hätte denselben Fehler.
- **Weiße Unterlegung, Farbe bleibt.** Ist die Strichfarbe der Diagonalen die Füllung des Körpers,
  liegt unter jeder Diagonale ein weißer Strich, je Seite 0,5 mm breiter (so breit wie die
  Hinterlegung des dunklen Themes, ESZ-119). Rot grenzt damit an Weiß wie auf der
  Ausgabeoberfläche, für die der Vertrag gilt: 4,02 : 1 in Referenz, accessible-light und dark,
  5,74 : 1 im Druckgrau.
- **Maßgeblich ist die Fläche unter den Diagonalen:** bei weißer Innenkontur das rote Innenfeld,
  nicht der weiße Körper (Hinweis aus dem Review).
- **Malreihenfolge:** erst alle Unterlegungen, dann alle Diagonalen (kreuzende Diagonalen schneiden
  einander nicht an), zuletzt die Kontur des Körpers noch einmal, ohne Füllung und als
  `bodyExtra`. Ohne sie schnitte die Unterlegung die Kontur dort, wo die Diagonalen sie kreuzen. Die
  Kontur wird am fertigen Körper gezogen, also auch am ersetzten Dreieck neben Hinweis oder Tendenz.
- **Abgeleitet gekennzeichnet:** zusätzliche Notiz `basis: 'constructed'`, Quelle
  `DAMAGE_CASING_SIDE_MM`.
- **Verworfen:** Gegenfarbe (Diagonalen schwarz oder weiß statt rot). Sie gäbe die Farbe nach
  DV 102 auf. Eine Unterlegung nur innerhalb des Körpers bräuchte einen Zuschnitt, den das
  Zeichnungsmodell nicht kennt; außerhalb verschwindet das Weiß auf weißer Oberfläche ohnehin, auf
  dunklem Grund wirkt es wie die Hinterlegung des Themes.

## Folgen

- Patch-Release. Nur Zeichnungen mit Schadensgrad auf einem Körper, dessen Füllung die Strichfarbe
  der Diagonalen ist, ändern sich. Alle übrigen bleiben bytegleich, auch Grün, Gelb und Orange.
- **Offen (nicht Teil dieser Entscheidung):** Rot auf Grün (1,16 : 1) und auf Orange (1,69 : 1)
  unterscheidet sich nur im Farbton, nicht in der Helligkeit. Für Menschen mit Rot-Grün-Schwäche und
  im Druckgrau ist das schwach. Ob die Regel auf einen Helligkeitskontrast erweitert wird, ist eine
  eigene Frage (LLH-1550).
