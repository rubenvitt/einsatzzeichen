# TAKTIK — Vision für ein vollständiges digitales System taktischer Zeichen

> Stand der Quellenrecherche: 4. August 2026

## Produktvision

TAKTIK wird die verlässliche, offene und entwicklerfreundliche Grundlage für taktische Zeichen in digitalen Anwendungen der Gefahrenabwehr. Statt einer Sammlung isolierter SVG-Dateien entsteht ein **semantisches und quellengebundenes Symbolsystem**: Anwendungen beschreiben, was dargestellt werden soll; TAKTIK erzeugt daraus konsistent SVG, Canvas-Ausgaben, MapLibre-Symbole oder Framework-Komponenten.

Der Anspruch ist nicht, nur die häufigsten Zeichen attraktiv darzustellen. **Version 1.0 darf erst veröffentlicht werden, wenn die öffentlich dokumentierte Systematik der nicht-polizeilichen Gefahrenabwehr vollständig abgedeckt ist.** Teilmengen sind als Alpha- oder Beta-Versionen erlaubt, aber nicht als vollständiger Katalog zu bezeichnen.

## Was „vollständige Abdeckung“ konkret bedeutet

Vollständigkeit bezieht sich nicht auf jede theoretisch mögliche Kombination. Das System ist ausdrücklich offen und kombinatorisch. Vollständig ist TAKTIK dann, wenn:

1. alle Grundelemente, Farben, Ergänzungseigenschaften und Kombinationsregeln der aktuellen BBK/BABZ-Empfehlung modelliert sind;
2. alle dort aufgeführten einsatztaktischen Fähigkeiten, Zusatzzeichen, Zustände, Tendenzen, Gefahren- und Schadendarstellungen renderbar sind;
3. alle fachlichen Anhänge und Anwendungsbereiche abgedeckt sind: Feuerwehr, Führung, THW, Sanitäts-, Rettungs- und Betreuungswesen, Versorgung/Logistik/Infrastruktur, Veterinärwesen, Wasserrettung, IuK, Bauwerksschäden, Deichverteidigung, Vegetationsbrandbekämpfung und sonstige Einsatzmittel;
4. jedes offizielle Referenz-SVG der BABZ einem stabilen Katalogeintrag oder einem dokumentierten Kompositionsrezept zugeordnet ist;
5. alle Beispiele aus der Referenz als automatisierte Conformance Fixtures reproduzierbar sind;
6. jede nicht unterstützte oder fachlich unzulässige Kombination explizit validiert wird, statt stillschweigend ein plausibel aussehendes Zeichen zu erzeugen;
7. Legacy-Zeichen aus der SKK-/DV-102-Systematik von 2010/2011 über Migrationsregeln auffindbar bleiben;
8. jede Abweichung, lokale Variante und organisationsspezifische Erweiterung als eigenes Profil gekennzeichnet wird.

### Ehrliche Abgrenzung bei „BOS"

Die öffentlich verfügbare aktuelle Referenz ist auf die **nicht-polizeiliche Gefahrenabwehr** ausgerichtet. Polizei und Bundeswehr werden deshalb nicht pauschal als „vollständig abgedeckt“ behauptet. Öffentlich belegbare interoperable Elemente können im Kern enthalten sein; vollständige organisationsspezifische Profile benötigen jedoch autorisierte, zugängliche Quellen und eine geklärte Nutzungsgrundlage.

## Verbindliche Referenzhierarchie

### 1. Primäre fachliche Grundlage

**BBK/BABZ: „Taktische Zeichen im Bevölkerungsschutz – Empfehlungen zur Einführung einer FwDV 102/DV 102“**  
Aktualisierte, organisationsübergreifende Referenz mit Hauptteil, Regeln und umfangreichen Anhängen. Sie ist die verbindliche Baseline für TAKTIK 1.0.

- [Hauptdokument auf der BABZ-Lernplattform](https://lernplattform-babz-bund.de/ilias.php?baseClass=ilrepositorygui&cmd=sendfile&ref_id=150034)
- [Freigestellte SVG-Grafikdateien der enthaltenen Zeichen](https://lernplattform-babz-bund.de/ilias.php?baseClass=ilrepositorygui&ref_id=147616)
- [SVG-Grafikdateien auf weißer Hintergrundfläche](https://lernplattform-babz-bund.de/ilias.php?baseClass=ilrepositorygui&cmdClass=ilobjcategorygui&cmdNode=wv%3Ald&item_ref_id=0&ref_id=147615)
- [Begleitende Hinweise zur Überarbeitung vom 12.02.2024](https://www.lv-saarland.drk.de/fileadmin/user_upload/Begleitende_Hinweise_zur_%C3%9Cberarbeitung.pdf)

Das Hauptdokument enthält unter anderem Grundelemente, Organisationsfarben, besondere Grundeigenschaften, zehn Fähigkeitsbereiche, Fahrzeug- und Beweglichkeitsangaben, Stärkeangaben, taktische Einheiten und Verbände, Zeit- und Verwaltungsangaben, Gefahren- und Schadendarstellung sowie fachliche Anhänge von Feuerwehr bis IuK und Vegetationsbrandbekämpfung.

### 2. Legacy- und Migrationsreferenz

**DLRG DV 102, 1. Auflage 2011, basierend auf den SKK-Empfehlungen 2010**  
Diese Fassung ist wichtig, weil bestehende Anwendungen, Ausbildungsmaterialien und ältere Symbolsammlungen häufig darauf beruhen. Sie dient nicht als neue Hauptbaseline, sondern für Aliasnamen, Migrationshinweise und visuelle Differenzdarstellungen.

- [DLRG DV 102: Taktische Zeichen im Bevölkerungsschutz](https://www.dlrg.de/fileadmin/user_upload/DLRG.de/Fuer-Mitglieder/Einsatz_und_Medizin/kats/Download_Dateien/Formulare_E008/DV102_TaktischeZeichen_DLRG110826.pdf)
- [Älteres freies Lernangebot der BABZ zur SKK-Systematik](https://lernplattform-babz-bund.de/ilias.php?baseClass=ilstartupgui&client_id=BBKILIAS&cmdClass=ilaccessibilitycontrolconceptgui&cmdNode=zy%3A1t&lang=de&target=cat_109540)

### 3. Ergänzende operative Regelwerke

Diese Dokumente definieren nicht allein den vollständigen Zeichenkatalog, liefern aber Terminologie, Führungslogik oder fachspezifische Kontexte:

- [FwDV 100 – Führung und Leitung im Einsatz](https://www.lfs-bw.de/fileadmin/LFS-BW/themen/gesetze_vorschriften/fwdv/dokumente/FwDV_100.pdf): Führungsorganisation, Führungsvorgang, Führungsmittel und Lagedarstellung.
- [FwDV/DV 800 – Informations- und Kommunikationstechnik im Einsatz](https://www.lfs-bw.de/fileadmin/LFS-BW/themen/gesetze_vorschriften/fwdv/dokumente/FwDV_DV_800.pdf): ergänzende IuK-Terminologie und Darstellungszusammenhänge.
- [THW: Einheiten – Einzelblätter](https://www.thw.de/SharedDocs/Downloads/DE/Allgemein/einheiten_einzelblaetter.pdf?__blob=publicationFile&v=2): aktuelle Bezeichnungen und Strukturinformationen für ein THW-Profil.

### 4. Terminologie und angrenzende grafische Normen

Diese Normen sind ergänzende Referenzen und dürfen nicht mit der eigentlichen DV-102-Systematik vermischt werden:

- [DIN 14033:2017-04 – Kurzzeichen für die Feuerwehr](https://www.dinmedia.de/de/norm/din-14033/267642931)
- [DIN 13050:2021-10 – Begriffe im Rettungswesen](https://www.dinmedia.de/de/norm/din-13050/343530475)
- [DIN 14034-6:2024-06 – Graphische Symbole für bauliche Einrichtungen im Feuerwehrwesen](https://www.dinmedia.de/de/norm/din-14034-6/377898786)
- [DIN 14095:2025-07 – Feuerwehrpläne für bauliche Anlagen](https://www.dinmedia.de/de/norm/din-14095/391844018)

DIN 14034-6 und DIN 14095 gehören in ein eigenes Profil für Feuerwehr- und Objektpläne. Sie sind keine Ersatzquelle für taktische Zeichen auf Lagekarten.

## Vorhandene Open-Source-Projekte

### `phjardas/taktische-zeichen`

- Repository: [github.com/phjardas/taktische-zeichen](https://github.com/phjardas/taktische-zeichen)
- Dokumentation: [taktische-zeichen.dev](https://taktische-zeichen.dev/)
- Charakter: JavaScript-Generator nach DV 102 mit dependency-freiem Core, React-Komponente, Web Component und CLI.
- Dokumentierter Umfang: 36 Grundzeichen, 42 Fachaufgaben, 8 Organisationen, 8 Einheiten, 6 Verwaltungsstufen und 84 Symbole.
- Lizenz: MIT.

**Was TAKTIK davon übernehmen sollte:** die Idee eines kombinatorischen Generators, getrennte Pakete, ein dependency-freier Core und die Unterstützung mehrerer Ausgabekanäle.

**Was TAKTIK darüber hinaus leisten muss:** nachvollziehbare Abdeckung der aktuellen BBK/BABZ-Fassung, Quellenangaben pro Element, Coverage-Matrix, MapLibre-Integration, semantische Validierung, Legacy-Migration und eine deutlich interaktivere Dokumentation.

### `jonas-koeritz/Taktische-Zeichen`

- Repository: [github.com/jonas-koeritz/Taktische-Zeichen](https://github.com/jonas-koeritz/Taktische-Zeichen)
- Charakter: umfangreicher Vektorgrafikbestand mit Jinja2-Templates, SVG- und PNG-Ausgaben sowie QGIS-Nutzung.
- Die Ordnerstruktur deckt zahlreiche Bereiche ab, darunter Feuerwehr, THW, Rettungswesen, Wasserrettung, Polizei, Bundeswehr, Führungsstellen, Gefahren, Schäden und IuK.
- Das Repository weist CC BY 4.0 aus; im README werden fertige Release-Zeichen zusätzlich als gemeinfrei bezeichnet. Vor einer Übernahme muss diese Lizenzsituation datei- und releasebezogen geklärt werden.

**Was TAKTIK davon übernehmen sollte:** den breiten Korpus als Inventar- und Vergleichsquelle, die QGIS-Perspektive, reproduzierbare Asset-Builds und die Idee deckungsgleicher SVG-Grundflächen.

**Was TAKTIK darüber hinaus leisten muss:** ein kanonisches fachliches Schema, Kompositionsregeln, maschinenlesbare Provenienz, Validierung, versionierte Profile und eine programmatische API.

### Strategische Positionierung

TAKTIK sollte die beiden Projekte nicht ignorieren oder unnötig duplizieren. Sinnvoll sind:

- Import- und Migrationsadapter für deren Bezeichner;
- visuelle Vergleichstests gegen vorhandene Assets;
- dokumentierte Lizenz- und Herkunftsprüfung;
- Kooperation oder Upstream-Beiträge, wo die Projektziele kompatibel sind;
- ein eigener neutraler Katalog nur dort, wo die neue 2025er Baseline, Provenienz und API-Architektur dies erfordern.

## Fachliches Datenmodell

Jedes atomare Element und jedes zusammengesetzte Zeichen erhält eine stabile ID und explizite Quellenbezüge.

```ts
interface SourceReference {
  source: "bbk-babz-2025" | "babz-svg-2025" | "skk-2010" | "org-profile";
  section?: string;
  page?: number;
  asset?: string;
  status: "verbatim" | "derived" | "legacy" | "organization-specific";
}

interface TacticalSymbolDefinition {
  id: string;
  kind: "formation" | "person" | "facility" | "vehicle" | "measure" | "hazard";
  organization?: string;
  capabilities?: string[];
  properties?: string[];
  modifiers?: string[];
  designation?: string;
  sourceRefs: SourceReference[];
}
```

Beispiel:

```ts
const symbol = createSymbol({
  kind: "vehicle",
  organization: "fire-department",
  capabilities: ["command"],
  designation: "ELW 1",
  status: "ready",
});

symbol.toSvg({ size: 64, theme: "operational" });
```

## Maschinenlesbare Coverage-Matrix

Die Vollständigkeit wird nicht in einer README behauptet, sondern aus einem versionierten Manifest erzeugt.

```json
{
  "baseline": "bbk-babz-2025",
  "entries": [
    {
      "sourceId": "bbk-babz-2025:4.7.10",
      "title": "Heben von Lasten oder Personen",
      "implementation": "capability.lifting",
      "referenceAsset": "4.7.10_Heben von Lasten oder Personen.svg",
      "semanticTest": true,
      "visualTest": true,
      "review": "approved"
    }
  ]
}
```

Die Dokumentationswebsite generiert daraus:

- Gesamtfortschritt und Fortschritt je Kapitel;
- fehlende oder ungeprüfte Einträge;
- Abweichungen zwischen 2010/2011 und 2025;
- Links zu Quelle, Seite und Referenzdatei;
- Status `verbatim`, `derived`, `legacy`, `profile` oder `experimental`;
- Release-Gates für Alpha, Beta und 1.0.

## Vorgeschlagene Pakete

- `@taktik/schema`: JSON Schema, stabile IDs, Taxonomie und TypeScript-Typen
- `@taktik/catalog`: vollständiger Katalog, Synonyme, Provenienz, Legacy-Aliase und Coverage-Manifest
- `@taktik/core`: Komposition, Regelvalidierung, SVG-Renderer, Canvas-Renderer und A11y-Metadaten
- `@taktik/react`: React-Komponenten und Hooks
- `@taktik/web-component`: frameworkunabhängige Custom Element API
- `@taktik/maplibre`: MapLibre GL JS Images, Style Expressions, Clustering und Custom Layers
- `@taktik/qgis`: Exportprofile und Metadaten für QGIS-Symbolbibliotheken
- `@taktik/cli`: Export, Audit, Migration, Batch-Rendering und Coverage-Prüfung
- `@taktik/docs`: Dokumentation, Playground, Katalog, Quellenbrowser und Coverage-Dashboard

## MapLibre-Integration

MapLibre ist der primäre Kartenadapter. Der Adapter sollte nicht nur DOM-Marker erzeugen, sondern unterschiedliche Skalierungswege anbieten:

- `addImage`/`updateImage` für dynamisch gerenderte Zeichen;
- symbol layers für große Datenmengen;
- GeoJSON-Properties als semantische Eingabe;
- Style Expressions für Status, Skalierung und Sichtbarkeit;
- Collision Handling, Clustering und Zoom-abhängige Detailstufen;
- Offline-Styles und reproduzierbare Sprite-Generierung;
- optional Custom Layers für sehr dynamische Lagen.

## Dokumentationsvision

Die Website bietet sechs gleichwertige Einstiege:

1. **Quickstart:** ein Zeichen in TypeScript, React oder Web Components anzeigen.
2. **Symbol Explorer:** nach Bedeutung, Abkürzung, Organisation, Quelle und Kapitel suchen.
3. **Builder:** Zeichen live zusammensetzen, ungültige Kombinationen erklären und Code erzeugen.
4. **Coverage:** vollständige Matrix der Referenz mit nachvollziehbaren Lücken und Reviews.
5. **MapLibre Lab:** Marker, Symbol Layer, Clustering, Zoomstufen und Offline-Sprites ausprobieren.
6. **Sources & Diffs:** Originalquelle, SVG-Referenz, Legacy-Variante und geometrischen Diff nebeneinander sehen.

Jede Symbolseite zeigt:

- Live-Vorschau in mehreren Größen und auf heller/dunkler Karte;
- stabile semantische ID und JSON-Konfiguration;
- TypeScript-, React-, Web-Component- und MapLibre-Beispiele;
- Synonyme und Legacy-Bezeichnungen;
- Quelle, Ausgabe, Kapitel, Seite und Referenzdatei;
- zulässige Kombinationen und Validierungsregeln;
- bekannte Abweichungen, Profile und Änderungshistorie;
- visuelle Tests und fachlichen Reviewstatus.

## Test- und Qualitätsstrategie

- Schema- und Regeltests für jede gültige und relevante ungültige Kombination
- Referenztests gegen die BABZ-SVG-Dateien
- visuelle Regressionen bei 16, 24, 32, 64, 128 und 256 Pixeln
- Drucktests in Schwarz-Weiß und mit empfohlenen Farbspektren
- MapLibre-Snapshot-Tests bei mehreren Zoomstufen und Pixel Ratios
- automatische Prüfung auf abgeschnittene Geometrien und uneinheitliche ViewBoxes
- Barrierefreiheitstests für Titel, Beschreibung, Kontrast und nicht-farbliche Unterscheidung
- Coverage-Check als verpflichtender CI-Status

## Governance und Lizenzierung

Fachliche Änderungen benötigen mindestens ein technisches und ein fachliches Review. Der bundesweite Kern und organisationsspezifische Profile werden getrennt versioniert.

Für jede Quelle werden dokumentiert:

- bibliografische Angaben und URL;
- fachlicher Status und Geltungsbereich;
- Lizenz beziehungsweise Nutzungsgrundlage;
- ob Geometrie übernommen, neu konstruiert oder nur verglichen wurde;
- Reviewer und Reviewdatum.

Normtexte und nicht eindeutig lizenzierte Grafiken werden nicht ungeprüft in das Repository kopiert. Eine eigenständig rekonstruierte Geometrie bleibt ebenfalls quellengebunden dokumentiert.

## Roadmap

### Phase 0 — Quellen- und Lizenzinventar

Alle Einträge des BBK/BABZ-Dokuments, offiziellen SVG-Dateien, Legacy-Referenzen und vorhandenen Open-Source-Korpora werden in einer Coverage-Matrix inventarisiert. Ergebnis ist eine belastbare Zahl statt einer Schätzung.

### Phase 1 — Vertikale Alpha-Slices

Je ein vollständiger fachlicher Slice für Grundelemente, Feuerwehr, THW, Rettungswesen und Gefahrenlagen. Core, Katalog, Renderer und Doku werden von Beginn an gemeinsam entwickelt. Alpha bedeutet ausdrücklich: technisch nutzbar, aber noch nicht vollständig.

### Phase 2 — Vollständiger Katalog und Profile

Alle Kapitel und Anhänge der aktuellen Empfehlung werden implementiert, geprüft und mit Referenzassets abgeglichen. Legacy-Migration, QGIS-Export und Organisationsprofile kommen hinzu.

### Phase 3 — MapLibre und Einsatzfähigkeit

MapLibre-Symbol-Layer, Clustering, Offline-Sprites, Druckexport, PWA und Performanceoptimierung für große Lagebilder.

### Phase 4 — Release 1.0

1.0 wird nur freigegeben, wenn die Coverage-Matrix für die definierte öffentliche Baseline 100 % erreicht, alle Einträge Quellenbezug besitzen und die fachlichen Reviews abgeschlossen sind.

## Erfolgskriterien

- 100 % Abdeckung aller in Scope befindlichen Einträge der aktuellen BBK/BABZ-Baseline
- 100 % Zuordnung der offiziellen BABZ-SVG-Dateien zu Katalogeinträgen oder Kompositionsrezepten
- keine ausgelieferte Definition ohne Quellen- und Reviewstatus
- ein Entwickler findet ein Zeichen oder eine Fachregel in weniger als 30 Sekunden
- 10.000 Zeichen sind über MapLibre-Symbol-Layer performant darstellbar
- Kernfunktionen laufen ohne React und ohne Netzwerkzugriff
- Legacy-Bezeichner liefern entweder eine eindeutige Migration oder eine begründete Mehrdeutigkeit

## Nicht-Ziele

- Vollständigkeit für nicht öffentlich zugängliche polizeiliche oder militärische Vorschriften zu behaupten
- tausende unverbundene SVG-Dateien als fachliches Datenmodell zu behandeln
- DIN-Symbole für Feuerwehrpläne mit taktischen Zeichen zu vermischen
- lokale Varianten ohne explizites Profil in den bundesweiten Kern aufzunehmen
- lizenzrechtlich unklare Assets ungeprüft zu übernehmen
