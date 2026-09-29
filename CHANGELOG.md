## ⚠️ Breaking Changes

### Körperfassungen haben Vorrang vor Boxfassungen

**Betrifft:** `@einsatzzeichen/core`, `@einsatzzeichen/react`, `@einsatzzeichen/web-component`, `@einsatzzeichen/maplibre`

Die Boxfassung `capabilities` wird jetzt dort abgelehnt, wo für das Paar aus Fähigkeit und Körperform eine vermessene Körperfassung existiert. Dies betrifft insbesondere:

- **Brandbekämpfung** (`fire-fighting`) an Formationen
- **Vorläufige Unterkunft/Ruhe** (`temporary-accommodation-resting`) an Formationen  
- **Technische Hilfeleistung** (`technical-assistance`) an Formationen

**Grund:** Die Referenz zeigt 65 von 67 Paarungen nirgends, daher bleibt dort die Boxfassung zulässig. Wo jedoch eine Fassung vermessen ist, gilt ausschließlich diese.

**Migration:** Nutzen Sie `bodyMarks` statt `capabilities` für die betroffenen Fähigkeiten. Die Validierung gibt jetzt die neue Kennung `capabilities-pictogram-has-measured-rendition` zurück, wenn eine vermessene Fassung verfügbar ist.

**Beispiel:** Ein Rüstzug mit technischer Hilfeleistung muss jetzt als `bodyMarks` mit der Körperfassung `technical-assistance × formation` (0,90 × 1,25, reduced) spezifiziert werden – 77 Fassungen stehen zur Verfügung.

## Katalog & Validierung

- Neue Validierungsregel `capabilities-pictogram-has-measured-rendition` prüft dynamisch, ob eine vermessene Körperfassung vorliegt und erzwingt deren Verwendung
- Die bestehende Überstandsregel `capabilities-pictogram-overflows-body` wurde für vermessene Paare präzisiert – drei Meldungen neu formuliert
- Insgesamt 79 Validierungsregeln aktiv (vorher 77), 280 Rezepte verfügbar
- Schema erweitert um neue Politik `measured-rendition-else-unscaled-if-fits` und optionales Feld `measuredRule` in `CapabilityInsetDecision`

## Website & Baukasten

- Der interaktive Baukasten sperrt betroffene Fähigkeiten (Brandbekämpfung, vorläufige Unterkunft, technische Hilfeleistung) unter "Fähigkeiten" an Formationen
- Nutzer werden zur Verwendung von `bodyMarks` geleitet

## Dokumentation

- Entscheidungsdokumentation LFH-787 ergänzt mit Inventur aller 69 Fähigkeits-Körperform-Paare
- Kombinationsbeleg H.3 und Referenzzählungen präzisiert
- Regeltexte vollständig in `core` konsolidiert

## Breaking Changes

Die Datenstruktur für Zeichen wurde erweitert: Die Union-Typen `RuleDimension` und `RuleField` sind nun breiter und umfassen auch die neuen freistehenden Zeichen. `LINE_GEOMETRY` hat eine neue Querschnittsform erhalten. Bestehender Code, der diese Typen direkt verwendet, muss möglicherweise angepasst werden.

## Neue Zeichenarten

**Freistehende Zeichen** sind nun als eigene Kategorie neben den regulären Symbolen verfügbar:
- **Bewegungspfeile** (5.2) – alle sechs Pfeilformen inklusive doppelschäftiger Varianten
- **Linien und Grenzen** (2.14–2.20) – als Striche mit wiederholten Marken
- **Wetter** (5.8.7) – Wolken mit Niederschlägen (Schnee, Regen, Hagel, Gewitter) in verschiedenen Intensitätsstufen
- **Tierzustand** (5.8.6) – eigenständige Zustandsmarkierungen

Die neuen Spec-Arten (`MovementSpec`, `LineSpec`, `WeatherSpec`, `AnimalStateSpec`) werden über eigene Funktionen gezeichnet und über `AnySpec` typsicher verarbeitet.

## Katalog

**Verband** – Verbandskennzeichnungen (I, II) können nun über das neue `unitGrouping`-Feld an Symbolen angebracht werden. Die Darstellung erfolgt als Vertikalbalken in der Kopfzone (1,5 × 4 mm).

**Zustände und Tendenz** – Drei neue Felder für Symbole:
- `states` – Liste von Zuständen wie „Vermisst", „Verletzt", „Kontaminiert" mit visuellen Hinweisen an Personen und Gefahren
- `tendency` – Einzelfeld für Richtungstendenzen
- Hinweis „?" neben verkleinerter Person bei unklaren Zuständen (gemäß Beispiele 5.8.1)

**Sonderformen** – Körperformen 3.6–3.9 sind nun vollständig vermessen und können verwendet werden (Drohne und Giebel bleiben Marken, keine Körperformen).

## Regelwerk

**24 neue Prüfregeln** stellen die korrekte Verwendung sicher:
- Verbandskennzeichnungen und deren Kompatibilität mit Körperformen
- Zustandsmarkierungen und deren erlaubte Träger
- Freistehende Zeichen (Linienstärken, Wetterkombinationen, Tierzustände)
- Grenzwerte für Listen (Zustände, Wetterwerte)

Insgesamt sind nun **88 Prüfregeln** aktiv (vorher 76). Alle Regeln liefern verständliche Fehlermeldungen mit Erklärungen.

## API

**Zugängliche Einstiegsfunktion** – `drawSymbol(spec, options?)` zeichnet ein Zeichen direkt aus einer Beschreibung, ohne dass das Prüfpaket `@einsatzzeichen/conformance` geladen werden muss. Die Funktion nutzt `DEFAULT_PORTS` mit allen Standard-Bausteinen aus `@einsatzzeichen/core`.

**Kanonische Serialisierung** – Neue Codec-Funktionen für standardisiertes Speichern und Laden:
- `serializeSpec()` / `parseSpec()` – JSON-Format mit Versionshülle
- `encodeSpecParam()` / `decodeSpecParam()` – kompakte URL-Form für Links
- `serializeAnySpec()` / `parseAnySpec()` – einheitliche Verarbeitung aller Zeichenarten
- Strikte Validierung mit aussagekräftigen Fehlermeldungen bei ungültigen Feldern

**Vokabular-API** – `vocabulary(spec, field)` prüft für jedes Feld, welche Werte zum aktuellen Zeichen passen, welche durch Regeln gesperrt sind (mit Begründung) und welche noch nicht vermessen wurden. `checkSpec(spec)` liefert die vollständige Prüfung einer Beschreibung mit verständlichen Ablehnungsgründen.

**Herkunftsinformationen** – `symbolProvenance(spec)` gibt Auskunft, ob ein Zeichen originalgetreu (`verbatim`) oder abgeleitet (`derived`) ist, inklusive Verweis auf die Referenzdatei. Die Funktion kommt ohne das Prüfpaket aus, die Herkunftstabelle ist im Produkt enthalten.

**Erklärbare Regeln** – `explainIssue()` und `explainRejection()` liefern zu jedem Validierungsfehler einen kuratierten Titel, eine Erklärung und das betroffene Feld. Alle 88 Regeltexte sind in `@einsatzzeichen/core` enthalten.

## Website

Der **Baukasten** unterstützt die neuen Felder:
- Verband-Auswahl nach der Stärke
- Neue Gruppe „Zustand und Tendenz" mit Listenfeld und Einzelauswahl
- Felder zeigen Hinweis „Noch nicht vermessen", wenn keine Geometrie vorliegt
- Ungültige Links werden mit verständlichen Meldungen abgefangen statt stillschweigend ignoriert

## CLI

Neuer Befehl `pnpm cli provenance:table` erzeugt die Herkunftstabelle aus dem Körpervergleich.

## Paketgröße

Die Paketgröße von `@einsatzzeichen/core` ist gestiegen, da nun Produktinhalte enthalten sind:
- Regeltexte (88 Erklärungen)
- Herkunftstabelle
- Vokabular und Codec
- Vermessene Geometrie für alle neuen Zeichen

**Neue Obergrenzen:** 650 KB gepackt, 6,95 MB entpackt (vorher: 550 KB / 6,2 MB)

## ⚠️ Breaking Changes

### Organisation `bundespolizei` entfällt

Die Bundespolizei wird gemäß BBK-Heft 2025 (Tafel 2.5) nicht mehr als eigene Organisation geführt, sondern der Polizei zugeordnet. Die Zeichen D.4.4 und N.1.3 werden nun in Polizei-Grün (#14a01e) statt Hellgrün (#64dc32) gerendert. „BuPol" bleibt als Beschriftung verwendbar.

**Migration:** Verwenden Sie `polizei` statt `bundespolizei` als Organisationswert.

**Betroffene Pakete:**
- `@einsatzzeichen/schema`: `OrganizationId` und `ORGANIZATION_IDS` enthalten nur noch 8 statt 9 Werte
- `@einsatzzeichen/core`: Baustein `color.bundespolizei` entfernt; `ORGANIZATION_COLORS`, `ORGANIZATION_LABELS` und `ORGANIZATION_BODY_DASHES` entsprechend angepasst
- `@einsatzzeichen/conformance`: Element `organization.bundespolizei` entfernt

## Katalog

### Arimo Medium als neue Standard-Schriftstärke

Der gesamte Katalogtext wird nun in Arimo Medium (Schriftstärke 500) gesetzt, um die Referenzdarstellung präziser zu treffen. Die Strichstärke der Referenz liegt zwischen Arimo Regular und Bold; Arimo Medium weicht nur 3% ab.

- Schema unterstützt nun `fontWeight: 400 | 500 | 700` (Standard bleibt 400)
- Katalogtext verwendet automatisch Medium (500)
- Sieben Textläufe in Anhang J wachsen auf Referenzhöhe zurück
- Geringfügige Anpassungen bei Strömungsrettung (I.1.17/18, I.2.6)

### Kursivschrift für Zusatzinformationen

Zeichen D.1.1 („Bezeichnung") wird nun korrekt kursiv gesetzt, wie in der Referenz dargestellt.

- Schema unterstützt `fontStyle: 'italic'` (nur mit Schriftstärke 500)
- Neue statische Schriftdatei Arimo Medium Italic integriert

### Größenanpassung DMO-Symbol

Die Box des großen „DMO" in J.1.5/J.1.7 wurde auf 23,8 mm Breite vergrößert (vorher 23,5 mm), um wie „TMO" in J.1.6 die Referenzversalhöhe 10,6 mm zu erreichen.

## Rendering

### Verbesserte Sicherheit gegen Injection

Die SVG-Erzeugung wurde gehärtet:

- `idPrefix` wird vor der Verwendung validiert und maskiert – ungültige Zeichen (Leerzeichen, Anführungszeichen, `<`, `>`, `&`) werden abgewiesen
- Aufzählungswerte wie `text-anchor`, `stroke-linejoin`, `fill-rule` und `font-weight` werden nur noch als vordefinierte Literale ausgegeben
- Ungültige Laufzeitwerte führen nicht mehr zu beliebigen Attributen im Markup

## CLI

### Neuer Befehl `reference-diff`

Mit `pnpm cli reference-diff --reference-root <dir>` können Zeichen pixelgenau mit der offiziellen Referenz verglichen werden:

- Rastert Referenz und eigene Darstellung identisch
- Meldet Abweichungen pro Zeile (Bild- und Strichfläche)
- Optional: Kontaktbögen zur visuellen Prüfung (Referenz | eigene | Überlagerung)
- Deterministische Ausgabe unter `out/`

## Conformance

### Gemeinsame Zeichnungsfunktion

Die Funktion `drawingForManifestEntry` ist nun zentral in `@einsatzzeichen/conformance` verfügbar und wird sowohl vom Review-Server als auch vom CLI-Befehl `reference-diff` genutzt.

## Website

### Dokumentation aktualisiert

Das `@einsatzzeichen/conformance`-Paket wird nun korrekt als veröffentlichtes npm-Paket dokumentiert (nicht mehr als privat).

## Release Notes – Version 1.12.0

## Conformance & Symbolkatalog

**Kapitel-4-Piktogramme in Anhang C**: Der Conformance-Katalog wurde um 37 neue Fixtures erweitert, die Piktogramme aus Kapitel 4 der Leitfaden-Feuerwehrfahrzeuge in den Anhang-C-Darstellungen C.1.7, C.1.8 und 35 C.2-Varianten vermessen. Alle Piktogramme sind als eigenständige geometrische Körperfassungen konstruiert und präzise an den Referenzdarstellungen ausgerichtet.

**Alternative Körperfassungen**: Die `SymbolSpec` unterstützt jetzt `bodyMarkRenditions` – alternative geometrische Fassungen desselben Paars aus Marke und Körper. Insgesamt stehen nun 76 verschiedene Capability-Inset-Formen zur Verfügung (Wachstum um 24 neue Fassungen).

**Verbesserte Laufdarstellung**: Neue vermessene Anker für Läufe am Landfahrzeug sowie eine technische Körpermarke `track-chevron-top` für spezielle C.2-Darstellungen. Der neue Drucktoken `koerperlauf-kontrast` sorgt für optimale Kontraste bei Läufen auf Feuerwehrrot – themenabhängig schwarz oder weiß gerendert.

**Geometrische Präzision**: Die Lücke zwischen `reduced`- und `reshaped`-Fassungen wurde auf 0,30–0,37 mm reduziert. Körperfassungen zeichnen konsistent mit 0,5 mm Strichstärke.

## Rendering

**Mindeststrichbreite für kleine Symbolgrößen** – Zeichen mit dünnen Strichen (0,5 mm laut Referenz) werden bei 16 oder 24 Pixel Ausgabegröße nun besser lesbar dargestellt. Eine neue Option `minStrokeWidthPx` hebt zu feine Linien beim Rastern auf eine konfigurierbare Pixelstärke an.

- In `@einsatzzeichen/core` (`renderSvg`, `renderCanvas`), `@einsatzzeichen/react` und `@einsatzzeichen/web-component` (neues Attribut `min-stroke-width`) standardmäßig deaktiviert – ohne Angabe bytegleiche Ausgabe wie bisher
- In `@einsatzzeichen/maplibre` standardmäßig aktiv mit 1 Gerätepixel; mit `null` abschaltbar
- Empfohlener Wert: 1 px (validiert an allen 525 Renderfällen)

## Dokumentation

**Schriftauswahl und Vermessung** – Entscheidungsvorlage zur Ersatzschrift: Vermessung von 132 Textläufen der Referenz zeigt, dass Arimo 400 eine gute Näherung ist. Eine statische Stufe 500 könnte Normal- und Fettschnitt ersetzen; Kursivschnitt als separater Schritt vorgeschlagen.

**Nachprüfung Symbolkatalog** – Dokumentation der 93 am 19. September beanstandeten Darstellungen mit Befunden, Korrekturen und Pixelabweichungen nach aktueller Messung.

**Fachfrage Bundespolizei** – Belege zur Füllung #64dc32 (Hellgrün der Bundespolizei) dokumentiert; Lesarten und offene Frage zur korrekten Darstellung festgehalten.

## Katalog & Grammatik

**Kapitel-4-Piktogramme im Innenfeld präzise vermessen**  
Alle Kapitel-4-Piktogramme (Fähigkeiten) wurden für jede Körperform individuell vermessen und werden nun korrekt im Körper platziert. Die Vermessung umfasst 52 Fassungen an 14 Körperformen mit drei verschiedenen Behandlungsarten: randbündiges Umformen (24), gleichmäßiges Verkleinern (23) und freies Umformen (5). Die Strichstärke bleibt dabei konstant bei 0,5 mm.

**Boxfähigkeit nur noch für passende Piktogramme**  
Die Validierung prüft nun, ob Piktogramme mit Boxfähigkeit tatsächlich innerhalb der Körperform bleiben. Piktogramme, die über den Körper hinausragen würden, werden nicht mehr als boxfähig zugelassen. Diese Regelung gilt bis zur vollständigen Vermessung aller Kombinationen aus Fähigkeit und Körperform.

## Technische Verbesserungen

**Neue Datenstrukturen für Piktogramm-Vermessung**  
Die Grammatik wurde um `CapabilityInsetForm` und `CapabilityInsetRule` erweitert, die das präzise Einsetzen von Piktogrammen in Körperformen beschreiben. Die neue Funktion `measureCapabilityInset()` ermöglicht die Nachvollziehbarkeit der Vermessungen.

**Zonenmodell um Innenfeld-Regeln erweitert**  
Das Zonenmodell kennt nun die Regel `capability-inset` für die Zone `inner-field`, die das Verhalten von Piktogrammen im Innenfeld steuert.

## Abhängigkeiten

- `happy-dom` aktualisiert auf 20.14.5
- `tsx` aktualisiert auf 4.23.15
- `@astrojs/react` aktualisiert auf 7.0.0

## Release-Prozess

- **Verbesserte Paket-Veröffentlichung**: Das Release-System erkennt jetzt neue npm-Pakete vor der Veröffentlichung und verhindert dadurch unvollständige Releases. Bisher konnten Situationen auftreten, in denen nur ein Teil der Pakete (core, schema) publiziert wurde, während andere Pakete (react, cli, qgis, maplibre, web-component) auf älteren Versionen hängen blieben. Mit dieser Änderung werden alle Pakete konsistent auf die gleiche Version aktualisiert.

## ⚠️ Breaking Changes

Keine Breaking Changes in dieser Version.

## Katalog

**Mehrfachfähigkeiten als Überlagerungsregel**  
Das Symbolsystem unterstützt nun die korrekte Darstellung von Einheiten mit mehreren Fähigkeiten. Die Fähigkeitsmarken werden nach einer neuen Überlagerungsregel positioniert: Jede Marke behält ihre Position und Größe aus der Einzelfassung bei und wird randbündig auf der Körperfläche platziert. Dies gilt für 15 Fixtures mit zwei oder drei Fähigkeiten über sieben verschiedene Körperfassungen hinweg. Vier Sonderfälle (F.1.12#alt, F.1.13, F.1.22, F.2.5#alt) bleiben als benannte Ausnahmen bestehen.

**Sonderformen 3.6–3.9 im Zonenmodell**  
Die speziellen Symbolformen (Drohne, Hubschrauber, Flugzeug, Wasserfahrzeug) sind nun vollständig im Zonenmodell abgebildet. Für jede Sonderform sind alle 16 Zonen definiert, wodurch die geometrische Struktur dieser Zeichen systematisch erfasst ist.

## Kern-API

**Neue Typaliase für Grammatik-Befunde**  
`GrammarFinding` ist nun der gemeinsame Typ für alle Regelprüfungen im System. `StateGroupFinding` wurde als Alias eingeführt, um die Konsistenz mit bestehenden Zustandsgruppen-Prüfungen zu gewährleisten.

## Core-Bibliothek

**Neue Bausteinart: Parametrisierte Linien und Pfeile**

Mit diesem Release erweitert Einsatzzeichen das Symbolsystem um die erste Bausteinart ohne feste Ausdehnung. Pfeile (5.2) und Grenzen (2.14–2.20) werden nun als parametrisierte Bausteine unterstützt:

- **Bewegungspfeile (5.2.1, 5.2.3, 5.2.4)**: Zeichnung von Richtungspfeilen mit konfigurierbarem Verlauf. Der Pfeilkopf, Strichstärken und Beschriftungen (TEL/EA/UEA) entsprechen den vermessenen Werten aus dem Kennzahlenartefakt
- **Grenzlinien (2.17–2.20)**: Darstellung von Grenzmarkierungen mit charakteristischen Zug-Marken, ebenfalls parametrisch über Stützpunkte oder Richtung und Länge definierbar
- Neue Zone `movement-anchor` für die Anbindung von Bewegungselementen an Körpersymbole
- Rendering erfolgt präzise: Die Zeichnung trifft die Referenzhülle auf drei Nachkommastellen

Die neuen Bausteinarten `movementDrawing` und `lineDrawing` ermöglichen erstmals die Konstruktion von Symbolelementen aus Verläufen statt aus festen Konturen. Das Symbolregister wurde um 13 Einträge in den Kategorien `arrow` und `line` erweitert.

**Hinweis**: Einige Symbole (5.2.2, 5.2.5, 5.2.6 sowie Flächengrenzen 2.14–2.16) sind noch nicht vermessen und werden künftig ergänzt.

## Katalog

- **Kapitel 5.8 „Zustände der Lage" vollständig implementiert**: Alle neun Zustandsgruppen (5.8.1 bis 5.8.9) sind nun als semantische Bausteine verfügbar. Jede Gruppe definiert Form, Zone, Träger und Grenze für die jeweiligen Zeichen – beispielsweise wird bei Schneefall (5.8.7) die Wolke als Träger verwendet, während Nebel (5.8.6) und Starkregen (5.8.8) ihre eigenen Trägerformen mitbringen.

- Die sieben Beispielzeichen aus dem Katalog sind vollständig spezifiziert und als Referenzdaten hinterlegt. Die Zuordnung basiert auf den Kopfkommentaren der technischen Zeichnungen und den Kennzahlenartefakten.

- Vier neue Validierungsregeln für Zustandszeichen wurden vorbereitet und stehen zur Aktivierung bereit, sobald die Spezifikationsfelder vollständig implementiert sind.

## Konformität

- Neue Testfixtures für alle Zustandszeichen (Kapitel 5.8) wurden hinzugefügt und gegen das Referenzinventar sowie gespeicherte Fingerprints abgesichert.

## Katalog

- **Landfahrzeuge**: Die obere Grundlinie für einzeilige Beschriftungen an der Radpaar-Fassung (`plain-wheel-pair`) wurde als eigenständige Ausnahme definiert und liegt jetzt explizit bei 6,75 mm. Dies betrifft Zeichen F.2.1 bis F.2.5, bei denen die Fassung nicht die Standard-Grundlinie des allgemeinen Landfahrzeug-Profils übernimmt. Die zweizeilige Beschriftung (z.B. F.2.8) verwendet weiterhin 5,79 mm als erste Zeilenposition.

## Abhängigkeiten

- Vite auf Version 8.3.0 aktualisiert
- @vitejs/plugin-react auf Version 6.1.1 aktualisiert
- @types/node auf Version 26.6.1 aktualisiert
- Playwright auf Version 1.62.1 aktualisiert

## 🚨 Breaking Changes

**@einsatzzeichen/catalog wurde in @einsatzzeichen/conformance umbenannt**

Das bisherige Paket `@einsatzzeichen/catalog` heißt ab sofort `@einsatzzeichen/conformance` und ist nun ausschließlich als Prüfpaket gedacht. Die gesamte Geometrie (Grundzeichen, Marken, Piktogramme, Beschriftung, Themes, Textmetriken) wird jetzt aus `@einsatzzeichen/core` importiert.

**Migration:**
- Ersetzen Sie `@einsatzzeichen/catalog` durch `@einsatzzeichen/conformance` in Ihren Abhängigkeiten
- Importieren Sie Geometrie und Rendering-Komponenten aus `@einsatzzeichen/core` statt aus dem Catalog
- Das Conformance-Paket wird nur noch für Validierung, Rezeptauflösung und Domain-Reviews benötigt

## Paketarchitektur

**Klare Trennung zwischen Produktpaket und Prüfpaket**

Die Paketarchitektur wurde grundlegend neu strukturiert:

- **@einsatzzeichen/core** ist das Hauptprodukt und enthält alle Bausteine für die Verwendung des Symbolsystems: Grundzeichen, Körpermarken, Fahrwerk, Kopfmarken, Piktogramme, Beschriftung, Render-Themes und Textmetriken
- **@einsatzzeichen/conformance** (ehemals catalog) ist das Prüfpaket mit Rezepten, Coverage-Manifesten, Domain-Reviews, Fingerprints, Referenzinventar und Schriftdateien
- Core bleibt vollständig frei von Node.js-Abhängigkeiten und läuft im Browser ohne das Conformance-Paket

**Repository-weite Abhängigkeitsrichtung**

Die erlaubten Paketabhängigkeiten sind nun strikt definiert: CLI → Conformance → Core → Schema. Ein automatischer Gate prüft bei jedem Build die Einhaltung dieser Architektur.

## Core-Paket

**Größen-Monitoring für Publish-Artefakte**

Ein automatischer Gate überwacht die Größe des veröffentlichten Core-Pakets (gepackt max. 500 KB, entpackt max. 6,5 MB) und prüft den Paketinhalt gegen eine Positivliste.

**Browser-Kompatibilität ohne Prüfpaket**

Neue Smoke-Tests stellen sicher, dass der öffentliche Core-Export keine Node.js-Builtins oder Conformance-Abhängigkeiten enthält und vollständig im Browser lauffähig ist.

## CLI

**Befehle nach Funktion gruppiert**

Die CLI-Befehle sind jetzt klar in zwei Kategorien gegliedert: Prüfbefehle nutzen das Conformance-Paket, Export-Befehle arbeiten ausschließlich mit Core. Die Hilfeausgabe spiegelt diese Aufteilung wider.

## Website

**Website-Inseln ohne Conformance-Abhängigkeit**

Alle interaktiven Website-Komponenten beziehen Geometrie und Rendering-Logik jetzt direkt aus dem öffentlichen Core-Index, nicht mehr über Subpfade oder das Conformance-Paket.

## Dokumentation

Die gesamte Dokumentation (README, Paketseiten, Vision, Quickstart) wurde aktualisiert und beschreibt Core als Hauptprodukt und Conformance als optionales Prüfpaket. Die Paketseite für Conformance ist unter einer neuen URL erreichbar; die alte Adresse leitet automatisch weiter.

## Release Notes 1.5.0

### Bausteinregister

Das neue **Bausteinregister** dokumentiert systematisch alle 283 grafischen Bausteine des taktischen Zeichensystems über zwölf Kategorien (Körper, Funktionen, Einheiten, Fahrzeuge, Ausstattung, Zusätze, Führungsebenen, Verwaltungsstufen, Verbände, Trupps, Spezialformen und Organisationen). Jeder Eintrag verweist auf seinen Fundort im Katalog, wodurch die Herkunft und Verwendung jedes Symbols nachvollziehbar wird.

Das Register macht transparent, welche Kombinationen von Bausteinen aneinander gebunden sind (z.B. Verwaltungsstufe an Funktionsfassung, Radpaarmarke an eingesenkten Rumpf) und dokumentiert sieben Bausteine ohne eigene Zeichnung (drei Verwaltungsstufen, das Amphibienfahrzeug und die Verbände I–III).

### Herkunft und Regelabdeckung

**Herkunftsverfolgung**: Jede Symbol-Kombination erhält nun eine klare Herkunftsangabe – entweder `verbatim` (direkt aus einer der 242 Mustervorlagen) oder `derived` (neu kombiniert). Die 242 Rezepte des Katalogs bilden jeweils eindeutige Schlüssel, 241 davon gelten als verbatim-belegt.

**Regelabdeckung**: Die Implementierung deckt nun 74 von 78 semantischen Regeln durch Tests ab. Die vier verbleibenden Lücken sind dokumentiert und werden in zukünftigen Versionen geschlossen.

### Qualitätssicherung

Neue automatische Prüfungen (Gates) stellen sicher, dass:
- Alle Sonderwerte in den Fixtures dokumentiert sind (50 Sonderwerte über 37 Fixtures in acht Feldern)
- Keine veralteten Einträge existieren
- Das Bausteinregister mit den Katalog-Resolvern synchron bleibt
- Die 49 Einträge mit Zeichnung aber ohne Herkunftsaussage gezählt bleiben, damit diese Lücke nicht unbemerkt wächst

## Version 1.4.0

### Zonenmodell und Komposition

Die mathematischen Grundlagen der Symbolkomposition wurden als strukturierte Daten dokumentiert und erweitert:

- **Zonenmodell als Datenstruktur**: Alle 16 Zonen je Körperform (insgesamt 19 Körperformen und 13 Variantenzweige) sind nun als explizite Datenstruktur verfügbar. Jedes Maß ist mit seiner Herkunft dokumentiert und an die Quelldaten gebunden.

- **Fußzonenabstand präzisiert**: Der Abstand zwischen Körper und Fußzone wird nun separat von der Kopfzone behandelt. Bisher nutzte die Implementierung den Kopfzonenabstand (1 mm) auch für die Fußzone – dies ist nun explizit dokumentiert und getrennt benannt, ohne die Darstellung zu ändern.

- **303 dokumentierte Lücken**: Fehlende Messungen sind systematisch erfasst, darunter die Randlagen für Zustand und Tendenz (Kapitel 5.8) sowie unvermessene mittlere Grundlinien bei Raute und Kreiskörper.

### Validierung und Regelkatalog

Das Validierungssystem wurde um einen maschinenlesbaren Regelkatalog erweitert:

- **Regelkatalog mit 72 Prüfregeln**: Alle Validierungsregeln sind nun als Datenstruktur verfügbar, einschließlich stabiler Kennungen, fachlicher/technischer Einordnung, betroffener Dimensionen, Begründungen und Quellenverweisen.

- **Kompositionsregeln und Lücken**: Die sechs Kompositionsregeln sind als eigene Klasse dokumentiert, ergänzt um neun Lücken je Dimension als zählbare Daten.

- **Befundanalyse**: 64 von 72 Ablehnungen beruhen auf fehlenden Messungen, nur 8 auf Regeln der Systematik – diese Unterscheidung ist nun nachvollziehbar.

### Dokumentation

- Herkunftsangaben für alle Zonenmaße über `SourceReference`
- Präzisierte Kommentare zu Kompositionskonstanten
- Begründungen für Validierungsregeln aus der Website in Tests abgesichert

## Katalog

Die Darstellungen wurden nach einem Fachreview grundlegend überarbeitet und an die offizielle Referenz angeglichen. Dabei wurden **93 Abweichungen** korrigiert, die durch geschätzte Maße, ungenaue Winkel und inkorrekte Strichstärken entstanden waren.

**Neu konstruiert:**
- Alle 92 Piktogramme aus Kapitel 4 (Einsatzmittel)
- Zustandszeichen 5.8
- Alle Zeichen der Anhänge J, K, L, M
- Körpermarken in den Anhängen C, D, F, G, H, I und N

**Verbesserungen:**
- Pixelvergleich mit der Referenz: **350 von 544 Darstellungen** sind nun deckungsgleich (vorher: 99)
- Geometrie wird jetzt systematisch aus abgelesenen Referenzmaßen konstruiert statt nach Augenmaß gezeichnet
- Schriften werden in exportierte SVGs eingebettet, damit taktische Zeichen auch ohne installierte Arimo-Schrift korrekt dargestellt werden
- Körpermarken positionieren sich automatisch nach der Anzahl der vorhandenen Marken
- Verbesserte Kontrastberechnung: Flächen mit eigener Kontur werden nicht mehr als Vordergrund gewertet

## Rendering-Engine

- **Schriftgewichte:** Textprimitive unterstützen jetzt `fontWeight` (400/700) mit statischer Arimo-Bold-Instanz
- **Weiße Innenkonturen:** Neue `whiteInnerContour`-Unterstützung für Anhang E
- **Clipping:** Optimierte Clipping-Gates pro Blatt, Körperkontur zählt nun zur Körperfläche
- **Kontrastausnahmen:** Spezialbehandlung für roten Text (u.a. 4.1.6–4.1.8, 5.8.1, L.10) und 4.2.2 im Druck

## Review-Werkzeug

- Fachreview-Befunde vom 19.09.2026 übernommen: **81 Darstellungen freigegeben**
- Anhängerfahrwerke werden jetzt korrekt am Anhänger dargestellt
- SVGs betten die Arimo-Schrift als Data-URI ein, damit Zeichen in `<img>`-Tags korrekt gerendert werden

## Dokumentation

- **Produktvision präzisiert:** Einsatzzeichen ist eine **Grammatik taktischer Zeichen**, kein statischer Katalog – der Motor erzeugt alle systemkonformen Kombinationen
- Neue Architekturentscheidung: Paketschnitt und Grammatik-Motor als Scope-Definition
- Spezifikation für exakte Referenzparität dokumentiert

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
