# Gate-Härtung vor D.1 — Implementierungsplan

> Spec: `docs/superpowers/specs/2026-08-06-gate-haertung-vor-d1-design.md` · freigegeben

**Ziel:** Der gesamte heute renderbare Katalog ist vor D.1 bei sechs real gerasterten Größen,
zwei alternativen Darstellungsprofilen, semantischen A11y-Metadaten und gegen seine viewBox
automatisch gegatet.

**Architektur:** Farbtoken bleiben im Schema. `core` definiert den rendererseitigen Theme-Vertrag,
Kontrastrechnung und das viewBox-Gate. `catalog` liefert konkrete alternative Themes, semantische
Beschreibungen, Nachbarschaftsanforderungen und die vollständige Renderfallmenge. Rasterung ist
reine Testinfrastruktur.

## Task 1: Verifizierbare Ausgangsbasis und Theme-Typen

- [x] Einen fehlschlagenden Schematest für totale `ColorPalette`-Objekte und gültige `RgbHex`-Werte
  ergänzen.
- [x] `RgbHex` und `ColorPalette` in `packages/schema/src/geometry.ts` einführen; `PALETTE` bleibt
  inhaltlich und als Export erhalten.
- [x] Den nicht mehr nötigen `baseUrl`-Eintrag aus `tsconfig.json` entfernen. TypeScript 5.9
  behandelt ihn in dieser Konfiguration bereits als Fehler; `paths` funktioniert ohne ihn.
- [x] `pnpm typecheck` und den Schematest ausführen.

## Task 2: Gemeinsamer Render-Theme-Vertrag

- [x] Tests für Defaulttreue, Theme-Auflösung und SVG-/Canvas-Parität zuerst ergänzen.
- [x] `packages/core/src/render/theme.ts` mit `RenderTheme`, `REFERENCE_THEME` und zentraler
  Tokenauflösung anlegen.
- [x] `SvgOptions.theme` und `CanvasOptions.theme` ergänzen; alle Farbpfade beider Renderer auf
  dieselbe Auflösung umstellen.
- [x] Defaultausgabe gegen die bestehenden SVG-Snapshots prüfen.

## Task 3: Katalogthemes und explizites Kontrast-Gate

- [x] `packages/core/src/a11y/contrast.ts` samt Tests für relative Luminanz, Kontrastverhältnis,
  Grenzwert und verständliche Befunde anlegen.
- [x] `paintTokensOf()` mit korrekter Gruppenstil-Vererbung ergänzen.
- [x] `packages/catalog/src/render-themes.ts` mit `reference`, `accessible-light` und
  `print-monochrome` anlegen.
- [x] Die drei Themes über `cli export --theme` auswählbar machen und ungültige Exportgrößen vor
  jedem Schreibzugriff ablehnen.
- [x] Katalogtests erzeugen Anforderungen aus allen Piktogramm-Inks, Organisationsfüllungen und
  der Oberfläche.
- [x] Accessible- und Monochrom-Theme gegen 3:1 gaten; Referenz-Schwarz/Blau als bekannten
  Negativbefund festhalten.
- [x] Prüfen, dass alle Druckfarben achromatisch und alle sieben Organisationsgrauwerte eindeutig
  sowie ausreichend voneinander getrennt sind.
- [x] Für alle sieben Organisationen eindeutige Körperkonturen als nicht-farblichen visuellen
  Kanal definieren und die SVG-/Canvas-Parität testen.

## Task 4: Semantische Beschreibungen und Metadaten-Gate

- [x] Einen Core-Test ergänzen, der fehlenden oder leeren Titel und Beschreibung meldet.
- [x] `checkA11yMetadata(drawing)` implementieren.
- [x] Katalogbezeichner und `describeSymbolSpec()` einführen; die Beschreibung enthält mindestens
  Grundzeichenart sowie gesetzte Organisation, Stärke, Fähigkeit und Bezeichnung.
- [x] `ComposeOptions.description` ergänzen und in `composeFromCatalog()` aus dem semantischen
  Modell setzen.
- [x] Grundzeichen und eigenständige Piktogramm-Renderfälle mit einer Beschreibung versehen.
- [x] Das Metadaten-Gate über alle Renderfälle laufen lassen und Renderer-Verknüpfung von Titel und
  Beschreibung testen.

## Task 5: Globales viewBox-Gate

- [x] Negative Core-Tests für ungültige Maße, Primitive außerhalb, Strichhälfte außerhalb,
  Gruppen-Translation, Rotation, Kurvenkontrollpunkt außerhalb, relatives Kommando und
  Blatt-Translation schreiben.
- [x] `packages/core/src/viewbox-gate.ts` implementieren: Transformationskette, Stil-Vererbung,
  konservative Pfadpunkte und Toleranz in SVG-Einheiten.
- [x] Einen Katalogtest ergänzen, der über alle Renderfälle exakt 32×32 mm und keine Befunde
  verlangt.
- [x] `viewbox-gate.ts` über `packages/core/src/index.ts` exportieren.

## Task 6: Vollständige Renderfälle und echte Mehrgrößenregression

- [x] `packages/catalog/src/test-support/render-cases.ts` anlegen und eindeutige IDs testen.
- [x] Die Set-Gleichheit zu allen Manifest-Einträgen mit Snapshot-Nachweis testen (heute:
  typisierte Evidenz `svg-snapshot`).
- [x] `@resvg/resvg-js` als gesperrte Root-Dev-Dependency installieren.
- [x] `packages/catalog/src/multi-size-snapshots.test.ts` anlegen: sechs Referenzgrößen sowie je
  eine 256-px-Ausgabe der beiden alternativen Themes wirklich rastern.
- [x] Rastermaß, sichtbare Pixel und einen freien Außenrand bei 256 px prüfen.
- [x] Je Renderfall einen SVG-Kontaktbogen mit eingebetteten PNGs als Dateisnapshot erzeugen.
- [x] Alle Kontaktbögen visuell prüfen, besonders 16 px, Blau im Accessible-Theme und die sieben
  Graustufen im Drucktheme.
- [x] Alle sieben Organisationen in beiden Alternativthemes bei 64 px in einem zusätzlichen
  Kontaktbogen rastern und ihre Kontursignaturen visuell prüfen.

## Task 7: Rechenschaft und bestehende Texte

- [x] Die Reihenfolgeregel der Slice-3-Spec um die dort versehentlich ausgelassene globale
  viewBox-Prüfung korrigieren.
- [x] Die Piktogramm-Reviewnotiz so erweitern, dass die vier lokalen D.0-Gates und die neuen
  globalen Gates nicht miteinander verwechselt werden.
- [x] Eine Entscheidungsnotiz `docs/decisions/2026-08-06-gate-haertung-vor-d1.md` mit tatsächlich
  gemessener Testzahl, Rasterfallzahl, offenen Grenzen und Freigabe von D.1 schreiben.

## Task 8: Gesamtverifikation

- [x] `pnpm test` vollständig grün.
- [x] `pnpm typecheck` vollständig grün.
- [x] Bestehende 64-px-SVG-Snapshots nur mit dem erwarteten Metadaten-Diff; Geometrie und Farben
  unverändert.
- [x] `pnpm cli coverage` grün; unveränderte Release-Blocker fachlich erklären.
- [x] Erfolgreichen Theme-Export und den Fehlerpfad für eine nichtnumerische Größe über das reale
  CLI prüfen.
- [x] `git diff --check` und Prüfung auf unbeabsichtigte Dateien.
