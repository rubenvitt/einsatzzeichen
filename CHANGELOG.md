## Fachreview-Werkzeug

Version 1.2.0 führt ein neues internes Werkzeug zur fachlichen Überprüfung von Zeichen durch Personen mit einsatztaktischer Fachkunde ein. Das Werkzeug ersetzt das bisherige 544-zeilige Markdown-Dossier durch eine interaktive Oberfläche mit drei Spalten: Navigator mit Fortschrittsanzeige je Bereich, große Zeichendarstellung und Befundtafel.

**Wichtigste Verbesserungen:**

- **Visuelle Darstellung aller Elemente**: 269 der bisher 288 nicht-dargestellten `element`-Zeilen werden nun als Piktogramm gerendert. 19 nicht eigenständig darstellbare Elemente (Organisationsfarben, Stärkegrade, Fahrzeugkategorien) werden mit einem Kontextträger angezeigt
- **Tastaturgesteuerte Bedienung** mit automatischer Speicherung von Entwürfen über Neustart hinweg
- **Atomare Schreibvorgänge** über die TypeScript-Compiler-API, die Kommentare und Nachbarzeilen unberührt lassen
- **Serverseitige Validierung** mit Prüfung gegen das Reviewer-Register und dieselben Regeln wie das Coverage-Gate
- **Optionaler Netzwerkzugriff** über `REVIEW_HOST=<adresse>` für externe Fachprüfende, standardmäßig auf `127.0.0.1` gebunden

Das Werkzeug steht als privates Paket `@einsatzzeichen/review` zur Verfügung und kann mit `pnpm review` gestartet werden.

## Katalog

Die Qualitätssicherung wurde grundlegend überarbeitet:

- **Reviewer-Register** (`DOMAIN_REVIEWERS`) zur Validierung von Fachfreigaben, zunächst bewusst leer gehalten
- **Robuste Tests** die unabhängig vom aktuellen Reviewstand bleiben: Tests prüfen nun die Struktur der Freigaben (benannter Prüfer, ISO-Datum, Befund) statt feste Statuswerte vorauszusetzen
- **Exportierte Hilfsfunktionen** `sectionOf()` und `areaOf()` zur Wiederverwendung der Bereichseinteilung

Die Coverage-Gates zählen Freigaben nun aus den tatsächlichen Daten ab, sodass CLI, Gate und Ledger garantiert dieselben Zahlen liefern.

## Version 1.1.0

### Website

#### Interaktiver Baukasten

- **Feldhinweise direkt am Formular**: Der Baukasten zeigt jetzt bei jedem Feld an, warum ein Wert nicht kombiniert werden kann – nicht mehr nur in der Regelliste unter der Vorschau. Hinweise erscheinen ohne das Feld zu sperren und sind barrierefrei mit Screenreadern nutzbar.
- **Performantere Kandidatenprüfung**: Die Überprüfung aller 247 möglichen Werte läuft nicht mehr bei jedem Tastendruck im Beschriftungsfeld, sondern verzögert – für flüssigeres Tippen ohne Ruckeln.

#### Zeichenkatalog-Seite

- **15% kleinere Seitengröße**: Die 256 Miniaturansichten auf `/zeichen/` werden ohne redundante Metadaten gerendert (Titel und Beschreibungen, die ohnehin nicht vorgelesen wurden). Die Seite ist jetzt 75 KB kleiner (gzip) und hat 512 DOM-Knoten weniger – bei identischer Darstellung.

#### Technische Infrastruktur

- **Stabilere Entwicklungsumgebung**: Snapshot-Generierung nutzt atomare Dateischreiboperationen, sodass parallele Build-Prozesse laufende Tests nicht mehr stören können.
- **Aufgeräumte Code-Organisation**: Der Snapshot-Build wurde von einer 554-Zeilen-Datei in zehn fokussierte Module aufgeteilt – wartbarer und dokumentierter.

### Core & Katalog

- **Präzisere Fehlermeldungen bei Vermessungslücken**: Nicht vermessene Symbol-Kombinationen werfen jetzt einen spezifischen `NotMeasuredError` statt allgemeiner Fehlermeldungen. Die Website kann dadurch besser unterscheiden, ob ein Wert generell nicht existiert oder nur für die aktuelle Kombination nicht verfügbar ist, und zeigt passendere Tooltips im Baukasten.

### Qualitätssicherung

- **Dokumentiertes adversariales Review**: Alle Änderungen wurden durch ein strukturiertes Review-Verfahren geprüft (6 Richtungen, 3 Skeptiker pro Befund). 8 potenzielle Probleme wurden identifiziert, 6 bestätigt und behoben, 2 widerlegt. Die 3 bewusst offenen Punkte sind dokumentiert.

### Abhängigkeiten

- TypeScript-Typen für Node.js aktualisiert (v22 → v26)
- tsx aktualisiert (v4.23.5 → v4.23.12)
- Vitest aktualisiert (v3.2.7 → v4.1.11)

### Interne Verbesserungen

- **Effizientere Release-Pipeline**: NPM-Pakete werden nur noch publiziert, wenn sich tatsächlich Package-Code geändert hat – nicht bei reinen Website-Updates.

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
