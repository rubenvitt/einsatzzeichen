## Website

### Performance-Verbesserungen

- **Drastisch reduzierte Seitengröße**: Die interaktiven Seiten (Explorer, Baukasten, Prüfliste, Karte) sind nun bis zu 95% kleiner. Der Katalog-Snapshot wird einmalig als JSON-Datei geladen statt in jede Seite eingebettet zu werden.
  - Explorer: von 797 KB auf 34 KB
  - Baukasten: von 1.755 KB auf 120 KB
  - Kartenansicht: von 742 KB auf 46 KB

### Fehlerbehebungen

- **Korrekte URLs in Metadaten**: Canonical-Links, Open-Graph-Tags und die Sitemap verwenden jetzt die echte Domain statt eines Platzhalters. Alle 284 generierten Seiten zeigen korrekte URLs.

## Version 1.0.1

Diese Patch-Release behebt einen technischen Fehler im Release-Prozess. Es gibt keine funktionalen Änderungen an den Einsatzzeichen-Paketen.

## Sonstiges

- **NPM Provenance**: Die Pakete werden nun korrekt mit NPM Provenance Attestation veröffentlicht, was die Herkunft und Integrität der Pakete nachweisbar macht.

## Erste öffentliche Version

Diese Version markiert den ersten Release von Einsatzzeichen – einem semantischen Symbolsystem für taktische Zeichen der Gefahrenabwehr. Das System umfasst 256 Zeichen mit vollständiger technischer Prüfung und 544 Manifestzeilen mit fachlicher Freigabe durch den Projektinhaber.

## Veröffentlichung

- **NPM-Pakete**: Alle Pakete sind unter `@einsatzzeichen` veröffentlicht
- **Automatische Releases**: Semantic Release mit Conventional Commits und automatischer Versionierung
- **CLI-Tool**: Über `npx einsatzzeichen` verfügbar

## Pakete

### Core (`@einsatzzeichen/core`)

- SVG-Rendering mit präziser Textmetrik und automatischem Kerning
- Validierung von Zeichenkombinationen mit 72 verständlich erklärten Regeln
- Fehlerbehandlung mit klaren Hinweisen für ungültige Kombinationen
- Schrift Arimo als optimiertes Subset (496 KB → 83 KB)
- Kontrastverhältnisse nach WCAG AA geprüft (dokumentierte Ausnahmen in E.2.6)

### Catalog (`@einsatzzeichen/catalog`)

- 256 Zeichen aus BBK-BaBz-2025-Vorlagen
- 544 Manifestzeilen mit fachlicher Sammelfreigabe (28.08.2026)
- 59 dokumentierte Fachfragen mit Entscheidungsgrundlagen
- 13 geprüfte Quellen mit vollständiger Provenienz
- Körpermarken für THW, DRK, DLRG und weitere Organisationen

### React (`@einsatzzeichen/react`)

- `<Einsatzzeichen>`-Komponente für React-Anwendungen
- `useEinsatzzeichenSvg`-Hook für direkten SVG-Zugriff
- Byte-identisches Rendering mit dem Core-Paket

### Web Component (`@einsatzzeichen/web-component`)

- `<einsatzzeichen-symbol>` Custom Element
- Framework-unabhängig einsetzbar
- Attribute für Größe und ID-Präfix

### MapLibre (`@einsatzzeichen/maplibre`)

- Rasterisierung für MapLibre-Symbolebenen
- Pixel-Ratio-Unterstützung für hochauflösende Displays
- Keine direkten MapLibre-Abhängigkeiten

### QGIS (`@einsatzzeichen/qgis`)

- QGIS-Stilbibliothek mit eingebetteten SVGs
- Export für Symbol-Verzeichnisse
- Kompatibel ab QGIS 3.16

### CLI (`@einsatzzeichen/cli`)

- Katalogverwaltung und Rendering-Tests
- Coverage-Berichte über drei Achsen (Referenz, Regeln, generative Reichweite)
- Review-Dossier-Generator für Fachreviews
- QGIS-Export-Befehle

## Dokumentation

### Website

- Landingpage mit Einstieg für Anwenderinnen und Entwickler
- Interaktiver Baukasten zum Zusammenstellen von Zeichen mit Live-Validierung
- Katalog-Explorer mit Suche über 256 Zeichen
- MapLibre-Labor zur Kartenvorschau
- Download als SVG und PNG
- Sieben Schritt-für-Schritt-Anleitungen
- Statusseiten für technische und fachliche Prüfung
- Alle Texte in verständlicher Alltagssprache

### Governance

- Entscheidungsvorlagen für Piktogramm-Integration (LFH-431) und Quellenlizenzierung (LFH-432)
- Scoping für Legacy-Migration (LFH-433)
- Review-Dossier mit 59 Fachfragen und Evidenzkürzeln

## Qualitätssicherung

- 661 Referenzdateien inventarisiert (550 beansprucht, 83 außerhalb, 28 ausgeschlossen)
- Textmetrik-Gate prüft Laufweiten und Glyphboxen gegen Millimeter-Regel
- Regelabdeckung über 16 Achsen und 72 Validierungsregeln
- Generative Reichweite (Stufe 1) dokumentiert
- 525 Renderfälle bestehen alle Gates

## Hinweise

Alle Texte und Codeteile sind mit KI-Unterstützung entstanden. Der fachliche Review-Status ist an jedem Zeichen dokumentiert.
