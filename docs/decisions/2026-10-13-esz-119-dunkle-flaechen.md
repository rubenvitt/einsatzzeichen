# Render-Theme für dunkle Flächen (Nachtbetrieb)

> Stand: 13. Oktober 2026
> Status: umgesetzt (ESZ-119)

## Anlass

Der Lifeline Hub läuft im Nachtbetrieb als Vorgabe auf dunklem Grund (`#141414`). Alle drei
Themes waren für weißen Grund gebaut, und `renderSvg` zeichnet keinen Untergrund. Schwarze
Konturen, Kopfmarken und Läufe außerhalb des Körpers verschwanden; eine Formation ohne
Organisation (`fill="none"`) war unsichtbar. Entscheidung des Hub (29. September 2026): Die
Dunkeldarstellung gehört in die Bibliothek, nicht als Sonderfall in den Hub.

## Entscheidung

1. **Theme `dark`** (`DARK_THEME`, `RENDER_THEMES.dark`), mit Palette und Kontursignaturen von
   accessible-light und `surface: '#141414'`.
2. **Weiße Hinterlegung** (`RenderTheme.halo`, 0,5 mm je Seite). Beide Renderer zeichnen jedes
   malende Blatt zuerst als Silhouette in Weiß, um die Hinterlegung über seine sichtbare Kante
   hinaus geweitet, und darüber die Zeichnung unverändert. Körperfüllungen decken die
   Hinterlegung ihrer Innenzeichnung zu. Sichtbar bleibt sie nur dort, wo Tinte an den Grund
   grenzt. Schwarze Schrift auf hellen Körpern bleibt schwarz.
3. **Kopfmarken und Fahrwerk in Weiß** (`RenderTheme.surfaceMarkInk`, Rollen `head` und
   `chassis`), ohne Hinterlegung. Diese Rollen stehen nie auf einem Körper. Mit Hinterlegung
   wirkte ein schwarzer Stärkepunkt im weißen Rand wie ein Ring; weiß bleibt er ein gefüllter
   Punkt und ein Rad ein Ring.
4. **Kontrast.** Mit Hinterlegung grenzt Tinte an Weiß, nicht an den Grund. `contrastSurface()`
   löst `'surface'` in Kontrastzusicherungen deshalb auf die Hinterlegung auf. Damit gilt jede
   Zusicherung von accessible-light unverändert auch im dunklen Theme. Neu ist nur das Paar
   Hinterlegung gegen Grund: Weiß auf `#141414` erreicht 18,1 : 1, auf `#333333` 12,6 : 1,
   gefordert sind 7 : 1.
5. **Mindeststrichbreite.** Mit `minStrokeWidthPx` wird auch die Hinterlegung je Seite mindestens
   so breit (bei `createStyleImage` standardmäßig 1 px). Unter einem Pixel wäre sie auf dunklem
   Grund eine graue Spur.

## Beleg

`packages/conformance/src/dark-surface-contrast.test.ts` rastert alle 563 Renderfälle bei 256 px
auf `#141414`. Kein deckendes Pixel unter 7 : 1 liegt näher als 2 px an blankem Grund. Mit
Referenz- und accessible-light-Theme schlagen alle 563 Fälle an, mit `dark` keiner. Die Leinwand
(`createStyleImage`) wurde einmalig in Chromium nachgerastert: Die ungefüllte Formation hat dort
im Referenztheme kein Pixel über 7 : 1, im dunklen Theme 1 600 von 2 400 deckenden Pixeln.

## Verworfen

- **Farbtausch Schwarz → Hell.** Dieselbe Farbmarke `schwarz` steht in einer Zeichnung für
  Kontur, Kopfmarke, Lauf außerhalb und Innenzeichnung auf Körperfarbe. Ein Tausch machte schwarze
  Schrift auf weißen und gelben Körpern unlesbar.
- **Tausch nach Rolle für alles außerhalb des Körpers.** `label`, `pictogram` und `innerField`
  stehen je nach Zeichen auf Körperfarbe oder, im ungefüllten Körper und freistehend, auf dem
  Grund. Die Rolle allein sagt nicht, worauf die Tinte liegt; nur `head` und `chassis` tun das.
- **Hellgraue Hinterlegung** (blendet nachts weniger). Sie hätte jede Zusicherung gegen die
  Oberfläche neu verhandelt, etwa roten Text auf der Oberfläche (heute schon Ausnahme bei Weiß).

## Offen

- Die Hinterlegung reicht nicht über die ViewBox hinaus. Wo hinterlegte Tinte bis an den Rand
  geht, ist sie dort abgeschnitten. Die Verwaltungssterne am oberen Rand betrifft das nicht, sie
  sind Kopfmarken und haben keine Hinterlegung.
- Die Zeichenvorschau der Website zeigt das Profil noch nicht, das MapLibre-Lab schon.
