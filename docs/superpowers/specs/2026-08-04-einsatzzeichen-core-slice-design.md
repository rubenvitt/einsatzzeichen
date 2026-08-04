# Einsatzzeichen — Slice 1: Fundament und Kompositionsnachweis

> Design-Spec · 4. August 2026 · Status: freigegeben

## 1. Zweck und Abgrenzung

Diese Spec beschreibt den ersten vertikalen Slice des Projekts `einsatzzeichen` (npm-Scope
`@einsatzzeichen`). Sie setzt die Produktvision aus `Vision.md` um, entscheidet aber mehrere
Punkte, die dort offengelassen wurden.

**Ziel des Slice:** Ein lauffähiges Regel- und Kompositionssystem, das die Grundelemente der
BBK/BABZ-Systematik geometrietreu erzeugt und an mindestens einem zusammengesetzten Zeichen
beweist, dass Komposition aus Regeln funktioniert — nicht aus abgelegten Zeichnungen.

**Nicht Teil dieses Slice:** React-Bindings, Web Components, MapLibre, QGIS, Dokumentationswebsite,
die Fachanhänge C–N in voller Breite, Legacy-Migration nach SKK 2010.

### Projektzerlegung (Kontext)

| Teilprojekt | Inhalt | Hängt ab von |
|---|---|---|
| **A** | Quellen- und Lizenzinventar | — |
| **B** | Schema und Provenienz-Modell | A (lose) |
| **C** | Core: Komposition, Regelvalidierung, SVG-Renderer | B |
| **D** | Katalogausbau über alle Kapitel und Anhänge | C |
| **E** | Ausgabekanäle (React, Web Component, MapLibre, QGIS) | C |
| **F** | Dokumentationswebsite | C, D |

**Diese Spec deckt A + B + C ab.** D, E und F bekommen je eigene Specs.

## 2. Quellenlage

Der offizielle BABZ-Referenzbestand liegt vollständig lokal unter `taktische-zeichen/` vor:
**661 SVG-Dateien** mit kapitelgenauer Benennung.

| Kapitel | Anzahl | Inhalt |
|---|---|---|
| 1 | 14 | Grundzeichen (Formation, Person, Fahrzeuge, Gebäude, Gefahr, Maßnahme …) |
| 2 | 21 | Organisationen, Farben, Grenzen |
| 3 | 7 | Fähigkeiten, Sonderfunktionen, Drohne, Zweirad |
| 4 | 92 | 10 Fähigkeitsbereiche (4.1 ABC … 4.10 Veterinär) |
| 5 | 116 | Fahrzeuge, Beweglichkeit, Stärke, Verwaltungsstufen |
| C–N | 411 | Fachanhänge (C Feuerwehr, D Führung, E THW, F Sanität/Rettung, G Versorgung, H Veterinär, I Wasserrettung, J IuK, K Bauwerksschäden, L Deichverteidigung, M Vegetationsbrand, N Sonstige) |

### Harte Randbedingung: Die Referenz wird niemals eingecheckt

Die Lizenz- und Nutzungsgrundlage der BABZ-Assets ist ungeklärt. `taktische-zeichen/` und
`taktische-zeichen.zip` stehen in `.gitignore` und bleiben dort. Es werden **keine Pfaddaten,
keine Geometrie und keine Dateien** aus der Referenz übernommen. Zulässig ist ausschließlich die
Ableitung verlustbehafteter Kennzahlen (siehe Abschnitt 8).

### Die 661 Dateien sind kein Katalog

`C.1.1_Löschstaffel.svg` ist keine eigenständige Zeichnung, sondern eine flachgerechnete
Komposition: Grundrechteck aus `1.1_Taktische Formation` + Organisationsfarbe Feuerwehr
(`#fa1919`, Kap. 2.1) + Stärkeangabe Staffel + Fähigkeit Brandbekämpfung (`4.3.1`). Drei Dateien
heißen wörtlich `5.8.1_Beispiel 1/2/3.svg`.

Der Referenzbestand ist damit eine **Stichprobe des Systems**, nicht dessen Umfang. Der
Kombinationsraum des Regelsystems ist größer als 661.

## 3. Das Einheitensystem

Sämtliche Koordinaten der Referenz sind Millimeter bei 72 dpi. Der Umrechnungsfaktor ist
**1 mm = 2,83465 Einheiten** (72 / 25,4).

| Einheiten | mm | Bedeutung |
|---|---|---|
| 90,709 | 32 | Grundfläche (648 von 661 Dateien) |
| 85,04 × 56,693 | 30 × 20 | Körper des Grundzeichens |
| 68,031 | 24 | Quadratische Grundzeichen (z. B. 1.8 Behälter) |
| 1,417 | 0,5 | Linienstärke |
| 4,252 | 1,5 | Radius Stärkepunkt |
| 2,835 | 1 | Abstandseinheit zwischen Zonen |

**Entscheidung: Autorenschaft in Millimetern.** Katalogeinträge und Regeln werden in mm notiert;
die Umrechnung in SVG-Einheiten geschieht im Renderer. Begründung: mm-Werte sind lesbar,
review-fähig und entsprechen der fachlichen Denkweise („0,5 mm Rahmen", „32 mm Grundfläche").
Illustrator-Dezimalzahlen zu pflegen wäre fehleranfällig und nicht prüfbar.

Nicht alle Werte sind ganzzahlige Millimeter: geometrisch abgeleitete Maße (etwa gedrehte
Quadrate mit Faktor √2) ergeben krumme Werte. Das IR unterstützt deshalb beliebige
Fließkomma-Millimeter, nicht nur ein ganzzahliges Raster.

### Koordinatenrauschen der Referenz

Die Referenz enthält Exportrundungen: `2.834` neben `2.835`, `17.008` neben `17.009`. Der
Fingerprint-Vergleich (Abschnitt 8) arbeitet deshalb mit einer **Toleranz von 0,01 Einheiten**.

## 4. Layoutmodell: Zonenstapel

Ein Zeichen besteht aus drei vertikalen Zonen:

```
┌─────────────────┐
│   Kopfzone      │  Stärke, Verband, Verwaltungsstufe
├─── 1 mm Abstand ┤
│   Körper        │  Grundzeichen + Organisationsfarbe + Fähigkeitspiktogramm
├─── 1 mm Abstand ┤
│   Fußzone       │  Bezeichnung, Zusatzangaben
└─────────────────┘
```

### Layout ist ein Profil pro Grundzeichenart

Es gibt **keine einzelne, für alle Grundzeichen gültige Abstandsregel.** Jede Grundzeichenart
(rechteckiger Körper, gedrehtes Quadrat, Kreis …) trägt ein eigenes **Layoutprofil**, das
festlegt, wo die Kopfzone sitzt und wie daraus die Körperposition folgt. Der Kompositionsmotor
implementiert den Profilmechanismus; die Profilwerte stehen im Katalog.

**Profil A — rechteckiger Körper (85,04 × 56,693), „Taktische Formation" und Ableitungen.**
Zwischen Unterkante Kopfzone und Oberkante Körper liegt konstant 1 mm (2,835 Einheiten). Die
Körperposition folgt aus der Kopfzonenhöhe.

| Zeichen | Stärkeanordnung | Unterkante Kopfzone | Körper y |
|---|---|---|---|
| `C.1.2_Löschgruppe`, `E.1.18_Fachzug FüK` | Punktreihe horizontal, `cy = 9,921`, `r = 4,252` | 14,173 | **17,008** |
| `C.1.1_Löschstaffel`, `C.1.8_Staffel Dekon` | Punkte vertikal gestapelt, `cy = 7,087` und `18,425` | 22,677 | **25,512** |

Zwei verschiedene Kopfzonenhöhen, beide Male exakt 2,835 Einheiten Abstand — die Regel ist damit
belegt, nicht interpoliert. Die horizontale Reihe ist an `E.1.18` als drei einzeln vermessene
Kreise (`cx = 31,180 / 45,353 / 59,526`) nachgewiesen.

**Die Punktanzahl je Stärkegrad ist noch nicht belegt und wird nicht angenommen.** Illustrator
führt benachbarte Kreise zu einem Pfad zusammen, sodass eine Zählung der `<circle>`-Elemente
irreführt: `C.1.2_Löschgruppe` hat ein `<circle>`, `C.1.3_Löschzug` deren zwei — bei sonst
gleicher Reihengeometrie. Die Zuordnung Stärkegrad → Punktanzahl wird bei der Katalogarbeit aus
der Referenz vermessen, nicht aus der Bezeichnung geschlossen. Für das Layoutmodell ist sie
irrelevant: die Regel arbeitet auf der Unterkante der Kopfzone, nicht auf ihrem Inhalt.

Ohne Stärkeangabe entfällt die Kopfzone. Der Körper sitzt dann auf der Standardposition
`y = 17,008` (6 mm vom oberen Rand), belegt durch `1.1_Taktische Formation`. Diese Position ist
ein eigener Profilwert und **nicht** aus der 1-mm-Regel abgeleitet.

**Profil B — gedrehtes Quadrat (Person, Funktionsstelle), `D.3.7_Zugführer der Feuerwehr`.**
Die 1-mm-Regel gilt auch hier — aber nur, wenn gegen die **Mittellinie** gemessen wird, nicht
gegen die Außenkante des konvertierten Pfads.

Die Füllfläche ist `rect 52,114 × 52,114` mit `translate(49.363 −17.126) rotate(45)`. Ausgerechnet
ergibt das ein Quadrat mit Mittelpunkt `(45,354 | 51,024)` = (16 mm | 18 mm) und halber Diagonale
36,85 Einheiten = 13 mm. Die Spitze der Mittellinie liegt damit bei `y = 14,174` = **5 mm**. Die
Stärkepunkte enden bei `11,338` = **4 mm**. Abstand: exakt 1 mm.

Der Außenpfad beginnt bei `13,171`; die Differenz von 1,003 Einheiten zur Mittellinie ist genau
`halbe Strichstärke × √2` — der Betrag, um den eine 45°-Ecke über die Mittellinie hinaussteht.
Wer gegen den Außenpfad misst, erhält scheinbar 1,833 und schließt fälschlich auf eine
Sonderregel.

### Universelle Regel, profilabhängige Anpassung

Die Kopfzone sitzt nicht auf einer festen Höhe. Dieselbe Punktreihe steht bei `E.1.18`
(rechteckiger Körper) auf `cy = 3,5 mm` und bei `D.3.7` (gedrehtes Quadrat) auf `cy = 2,5 mm`.
Beide Werte folgen aus einem Algorithmus mit zwei Konstanten — 1 mm oberer Rand, 1 mm Abstand:

```
headTop    = max(1 mm, defaultAnchor − 1 mm − headHeight)
headBottom = headTop + headHeight
bodyAnchor = max(defaultAnchor, headBottom + 1 mm)
```

Der *Körperanker* ist der oberste Punkt der Körper-Mittellinie: bei Profil A die Oberkante des
Rechtecks, bei Profil B die Spitze des gedrehten Quadrats, bei einem Kreiskörper der Scheitel.
Der *Standardanker* ist seine Position ohne Kopfzone: 6 mm bei Profil A (`1.1`), 1 mm bei
Profil B (`1.2`), 2 mm beim Kreis (`1.6`).

| Konstellation | defaultAnchor | headHeight | headTop / headBottom | bodyAnchor | Referenz |
|---|---|---|---|---|---|
| Rechteck + Punktreihe | 6 | 3 | 2 / 5 | **6** | `C.1.2` = 17,008 ✓ |
| Rechteck + Punktstapel | 6 | 7 | 1 / 8 | **9** | `C.1.1` = 25,512 ✓ |
| Gedrehtes Quadrat + Reihe | 1 | 3 | 1 / 4 | **5** | `D.3.7` = 14,174 ✓ |

Die erste Zeile erklärt, warum `C.1.2_Löschgruppe` denselben Körperversatz hat wie `1.1` ganz ohne
Stärkeangabe: die Reihe passt in den vorhandenen Kopfraum, der Körper muss nicht ausweichen. Der
Stapel passt nicht und schiebt ihn um 3 mm.

**Konsequenz für die Architektur:** Der Katalog liefert die Kopfzone relativ — Marken plus Höhe —
und das Layoutprofil setzt sie absolut. Absolute `cy`-Werte im Katalog wären falsch.

Die **Anpassung** unterscheidet sich:

- **Profil A verschiebt.** `1.1` hat den Körper bei `y = 6…26 mm`, `C.1.1` bei `9…29 mm` —
  gleiche Größe (30 × 20 mm), 3 mm nach unten geschoben.
- **Profil B schrumpft.** `1.2_Person` hat die halbe Diagonale 15 mm um `(16 | 16)`, `D.3.7`
  13 mm um `(16 | 18)`. Die Unterkante bleibt in beiden Fällen bei 31 mm; der Körper wird von
  oben verkleinert.

Für einen Kreiskörper mit Kopfzone liegt kein vermessener Beleg vor. Die Anpassung wird bei der
Katalogarbeit aus der Referenz ermittelt und bis dahin nicht angenommen.

### Körper und Innenfläche sind zwei verschiedene Dinge

`E.1.18_Fachzug Führung-Kommunikation` enthält **zwei** Füllflächen: den weißen Körper bei
`y = 17,008` (85,04 × 56,693) und eine blaue **Innenfläche** bei `y = 26,929` (79,37 × 43,937),
die vom Rahmen eingerückt ist und die Typografie trägt.

Eine reine Zählung der `Flächige_Fülung`-Rechtecke vermischt beide. Das Modell unterscheidet sie
deshalb explizit: `body` (durch das Grundzeichen bestimmt) und `innerField` (durch Organisation,
Fachdienst oder Beschriftung bestimmt). Die Fingerprint-Ableitung muss beide getrennt erfassen,
sonst vergleicht sie ungleiche Dinge.

## 5. Geometrie-IR

### Entscheidung: strichbasierte Autorenschaft

Die Referenz enthält **null `stroke`-Attribute und null `<text>`-Elemente**. Jeder Rahmen ist ein
zweifach umrandeter Füllpfad — `1.1_Taktische Formation` hat einen Außenring bei `2.126…88.583`
und einen Innenring bei `3.544…87.166`, also eine 1,417 breite Kontur als Even-Odd-Füllung.

Das ist ein Artefakt des Illustrator-Exports, keine fachliche Vorgabe. Wir autorieren deshalb
**strichbasiert** mit `stroke-width: 0.5mm`.

Begründung:

- SVG und Canvas beherrschen Striche nativ; eine Offset-Konvertierung wäre reiner Selbstzweck.
- Strichbasierte Piktogramme sind von Hand autorierbar; outline-konvertierte sind es nicht.
- Skalierung, Druck in Schwarz-Weiß und Kontrastanpassung bleiben steuerbar.

**Offengelegte Konsequenz:** Ein strichbasiertes IR lässt sich nicht direkt gegen
outline-konvertierte Referenzpfade diffen. Der Fingerprint vergleicht deshalb keine Pfaddaten,
sondern abgeleitete Kennzahlen (Abschnitt 8). Das ist keine Schwäche der Entscheidung, sondern
der Grund, warum dieser Vergleichsansatz ohnehin der einzig gangbare ist — die Referenz-Assets
stehen in CI nicht zur Verfügung.

### Primitive

```ts
type Length = number; // Millimeter

type Shape =
  | { type: "rect";     x: Length; y: Length; width: Length; height: Length; rx?: Length }
  | { type: "circle";   cx: Length; cy: Length; r: Length }
  | { type: "line";     x1: Length; y1: Length; x2: Length; y2: Length }
  | { type: "polyline"; points: Array<[Length, Length]>; closed?: boolean }
  | { type: "path";     d: string }   // nur für Piktogramme, Koordinaten in mm
  | { type: "group";    children: Primitive[] };

// Transform steht auf jedem Primitiv, nicht nur auf Gruppen: die Referenz
// zeichnet gedrehte Quadrate als rotierte rects (D.3.x: rotate(45)).
type Primitive = Shape & { transform?: Transform; role?: "body" | "innerField" | "head" | "foot" };

interface Style {
  fill?: ColorToken | "none";
  stroke?: ColorToken | "none";
  strokeWidth?: Length;   // Default 0.5
  fillRule?: "nonzero" | "evenodd";
}

interface Drawing {
  viewBox: { width: Length; height: Length };  // Default 32 × 32
  children: Array<Primitive & { style?: Style }>;
}
```

`ColorToken` referenziert die Farbpalette, nicht direkt einen Hexwert — damit sind Themes,
Druckprofile und Kontrastvarianten möglich.

### Farbpalette

Aus der Referenz extrahiert:

| Token | Hex | Vorkommen |
|---|---|---|
| `rot` | `#fa1919` | 135 |
| `blau` | `#003296` | 87 |
| `gelb` | `#fafa00` | 26 |
| `grau` | `#787878` | 11 |
| `hellblau` | `#3264fa` | 11 |
| `hellgrau` | `#bebebe` | 8 |
| `gruen` | `#14a01e` | 8 |
| `orange` | `#fa8c00` | 7 |
| `braun` | `#b4783c` | 4 |
| `hellgruen` | `#64dc32` | 3 |
| `weiss` | `#ffffff` | 796 |
| `schwarz` | `#000000` | implizit (Default-Fill) |

### Renderer

Zwei Renderer konsumieren dieselbe `Drawing`-Struktur:

- **SVG-Renderer:** erzeugt einen String. Keine DOM-Abhängigkeit, damit server- und
  worker-tauglich.
- **Canvas-Renderer:** erzeugt `Path2D`-Operationen gegen einen `CanvasRenderingContext2D`.

A11y-Metadaten (`<title>`, `<desc>`, `role`, `aria-label`) stammen aus dem **semantischen
Modell**, nicht aus der Geometrie. Ein Renderer erhält sie als Parameter, er leitet sie nicht ab.

## 6. Fachliches Datenmodell

### Korrektur gegenüber Vision.md: `sourceId` ist nicht eindeutig

`4.1.6_Atomare Stoffe.svg` und `4.1.6_Atomare Stoffe_Alternative.svg` teilen dieselbe Quellen-ID
und unterscheiden sich strukturell — die Basisdatei hat keine `Flächige_Fülung`, die Alternative
hat eine. Es sind zwei zulässige Darstellungen desselben Sachverhalts.

Das in `Vision.md` skizzierte `SourceReference` hat dafür kein Feld. Lösung: ein Katalogeintrag
trägt mehrere Darstellungen.

Betroffen sind **31 Dateien**: 28 mit Suffix `_Alternative`, 3 mit Suffix `_2`
(`2.14_Escape Route_2`, `5.8.1.13_Hinweis auf Vermutung_2`, `5.8.1.14_Hinweis auf akute
Situation_2`). Beide Suffixe bedeuten dasselbe: eine zweite zulässige Darstellung. Bei
`2.14_Escape Route` sind es zwei vollständig verschiedene grüne Pfade für dasselbe Konzept.

```ts
type SourceStatus = "verbatim" | "derived" | "legacy" | "organization-specific";

interface SourceReference {
  source: "bbk-babz-2025" | "babz-svg-2025" | "skk-2010" | "org-profile";
  section?: string;      // z. B. "4.1.6"
  page?: number;
  asset?: string;        // Dateiname der Referenz, NICHT die Datei selbst
  status: SourceStatus;
}

interface Depiction {
  variant: "primary" | "alternative";   // Manifest-Schlüssel ist (sourceId, variant)
  drawing: Drawing;
  sourceRefs: SourceReference[];
}

interface CatalogEntry {
  id: string;            // stabile semantische ID, z. B. "capability.fire-fighting"
  title: string;
  kind: SymbolKind;
  depictions: Depiction[];   // mindestens eine, "primary" genau einmal
  synonyms?: string[];
  legacyIds?: string[];
}
```

### Komposition

```ts
type SymbolKind =
  | "formation" | "person" | "vehicle-land" | "vehicle-air" | "vehicle-water"
  | "post" | "building" | "container" | "area" | "measure" | "hazard"
  | "point" | "event" | "spontaneous-helper";

interface SymbolSpec {
  kind: SymbolKind;
  organization?: OrganizationId;   // bestimmt die Körperfarbe
  strength?: StrengthId;           // bestimmt die Kopfzone
  administrativeLevel?: AdminLevelId;
  capabilities?: CapabilityId[];   // Piktogramme im Körper
  designation?: string;            // Fußzone
  properties?: PropertyId[];
}
```

`compose(spec): Drawing` ist die zentrale Funktion. Sie validiert zuerst, rendert dann.

### Validierung

Ungültige Kombinationen werden **explizit abgelehnt**, nie stillschweigend plausibel gezeichnet.
Die Validierung liefert strukturierte Fehler mit Regel-ID und Begründung, damit die spätere
Dokumentationswebsite sie anzeigen kann.

## 7. Coverage-Manifest: drei Achsen

`Vision.md` misst Vollständigkeit eindimensional. Das greift zu kurz, weil der Kombinationsraum
größer ist als der Referenzbestand.

| Achse | Frage | Release-Gate |
|---|---|---|
| **Regelabdeckung** | Sind alle Grundelemente, Farben, Eigenschaften und Kombinationsregeln modelliert? | **1.0** |
| **Referenzabdeckung** | Ist jede der 661 Dateien reproduzierbar — als Katalogeintrag oder als Kompositionsrezept? | 1.0 |
| **Generative Reichweite** | Welche gültigen Zeichen erzeugt der Generator, die in der Referenz nicht abgebildet sind? | dokumentiert, kein Gate |

Die dritte Achse ist ein Feature, keine Lücke — sie muss aber deklariert und validiert sein,
sonst ist nicht unterscheidbar, ob ein erzeugtes Zeichen fachlich gedeckt oder erfunden ist.

```json
{
  "baseline": "bbk-babz-2025",
  "entries": [
    {
      "sourceId": "bbk-babz-2025:4.7.10",
      "title": "Heben von Lasten oder Personen",
      "implementation": "capability.lifting",
      "variant": "primary",
      "referenceAsset": "4.7.10_Heben von Lasten oder Personen.svg",
      "coverage": "catalog-entry",
      "fingerprintTest": true,
      "snapshotTest": true,
      "review": { "status": "approved", "reviewer": "rv", "date": "2026-08-04" }
    }
  ]
}
```

`coverage` ist entweder `catalog-entry` oder `composition-recipe`.

## 8. Test- und CI-Strategie

Da die Referenz-Assets nie eingecheckt werden, kann CI keinen Bildvergleich gegen sie fahren.
Die Lösung ist eine zweistufige Trennung.

| Gate | Läuft in CI | Prüft |
|---|---|---|
| Regeltests | ja | gültige und unzulässige Kombinationen, strukturierte Fehler |
| Fingerprint (Kap. 1–3) | ja | committete Kennzahlen gegen erzeugte Geometrie, Toleranz 0,01 |
| Snapshot | ja | eigene SVG-Ausgaben gegen committete Snapshots |
| Coverage | ja | jede Referenzdatei im Scope hat Eintrag oder Rezept |
| Referenz-Vollvergleich | **nein, lokal** | visueller Abgleich, Ergebnis als Reviewstatus ins Manifest |

### Fingerprint-Ableitung

`einsatzzeichen audit:reference` liest den lokalen Referenzordner und schreibt eine committbare,
**verlustbehaftete** Kennzahlendatei. Enthalten sind ausschließlich:

- `viewBox`-Maße
- Menge der verwendeten Farben
- Layerstruktur (Vorhandensein von `Grundfläche`, `Flächige_Fülung`, Typo-Layer)
- Anzahl Subpfade
- Bounding-Box je Zone, **getrennt nach `body` und `innerField`** (siehe Abschnitt 4)
- aus dem Ringabstand rekonstruierte Linienstärke
- Zonenversätze
- angewandte Transformationen (z. B. `rotate(45)` bei gedrehten Quadraten)

Aus diesen Zahlen ist die Grafik nicht rekonstruierbar. Es sind Spezifikationsfakten
(0,5 mm Linie, 32 mm Grundfläche), keine schöpferische Ausdrucksform.

**Der Fingerprint-Gate gilt nur für Kapitel 1–3.** Für Kapitel 4/5 und die Anhänge C–N wird laut
Treue-Entscheidung (Abschnitt 9) ohnehin keine Geometrie verglichen; dort greifen Snapshot- und
Coverage-Gate plus dokumentierter menschlicher Review.

## 9. Treue-Entscheidung: hybrid

| Bereich | Anspruch |
|---|---|
| **Kapitel 1–3** (Grundzeichen, Organisationen, Farben, Grundeigenschaften) | **geometrietreu**, maschinell per Fingerprint geprüft |
| **Kapitel 4/5, Anhänge C–N** | **eigenständig gezeichnete Piktogramme** in konsistentem hauseigenen Stil, geprüft auf semantische Korrektheit und visuelle Verwechslungsfreiheit |

Begründung: Kapitel 1–3 sind Rechtecke, Kreise und Geraden auf einem Millimeterraster — exakt zu
treffen ist dort billig, und die Treue vererbt sich auf jedes zusammengesetzte Zeichen, weil dort
die Regeln liegen. Die über 400 organischen Piktogramme der Anhänge (Huhn, Pferd, Deichbruch,
Wipfelfeuer) geometrisch zu rekonstruieren wäre monatelange Vektorhandarbeit mit
Diff-Tretmühle bei geringem fachlichen Zusatznutzen.

Ergebnis: Grundfläche, Rahmenstärke, Farbflächen und Positionierung sehen identisch aus; die
Innenpiktogramme sind erkennbar unsere. Rechtlich sauber, fachlich vertretbar, lieferbar.

## 10. Umfang dieses Slice

**Enthalten:**

- Kapitel 1 (14 Grundzeichen), Kapitel 2 (21 Organisationen, Farben, Grenzen), Kapitel 3 (7)
- `5.1` Fahrzeugkategorien, `5.4` Stärke, `5.7` Verwaltungsstufen
- Genau ein Piktogramm aus Kapitel 4: `4.3.1 Brandbekämpfung`
- Drei Zeichen aus den Anhängen: `C.1.1_Löschstaffel`, `C.1.2_Löschgruppe`,
  `D.3.7_Zugführer der Feuerwehr`

**Kompositionsnachweis auf drei Ebenen:**

1. `C.1.1_Löschstaffel` wird end-to-end aus einer `SymbolSpec` erzeugt — Grundzeichen
   `formation` + Organisation `feuerwehr` + Stärke `staffel` + Fähigkeit `fire-fighting` —
   inklusive des Körperversatzes auf `y = 25,512`, der aus der Kopfzonenhöhe folgt.
2. `C.1.2_Löschgruppe` unterscheidet sich davon **nur** in der Stärkeangabe und trifft
   `y = 17,008`. Damit ist Profil A in beiden Ausprägungen belegt statt in einer.
3. `D.3.7_Zugführer der Feuerwehr` nutzt Profil B (gedrehtes Quadrat). Damit ist der
   **Profilmechanismus** bewiesen und nicht nur eine einzelne fest verdrahtete Regel — der
   Unterschied, an dem der Kompositionsmotor beim Katalogausbau steht oder fällt.

Das Coverage-Manifest enthält damit von Beginn an beide Eintragsarten (`catalog-entry` und
`composition-recipe`) und beide Layoutprofile.

**Nicht enthalten:** `@einsatzzeichen/react`, `@einsatzzeichen/web-component`,
`@einsatzzeichen/maplibre`, `@einsatzzeichen/qgis`, `@einsatzzeichen/docs`, Legacy-Migration.

## 11. Pakete

| Paket | Inhalt | Abhängigkeiten |
|---|---|---|
| `@einsatzzeichen/schema` | JSON Schema, stabile IDs, Taxonomie, TypeScript-Typen | keine |
| `@einsatzzeichen/core` | Geometrie-IR, Komposition, Regelvalidierung, SVG- und Canvas-Renderer, A11y-Metadaten | keine Laufzeitabhängigkeiten |
| `@einsatzzeichen/catalog` | Katalogeinträge im Slice-Umfang, Provenienz, Coverage-Manifest | `schema` |
| `@einsatzzeichen/cli` | `audit:reference`, `coverage`, `export` | `core`, `catalog` |

`@einsatzzeichen/core` bleibt dependency-frei und lauffähig ohne React und ohne Netzwerkzugriff.

**Monorepo:** pnpm Workspaces, TypeScript, Vitest. `package.json` im Root wird auf
`"name": "einsatzzeichen"` mit `"private": true` umgestellt.

Nicht umbenannt werden: das Arbeitsverzeichnis (`taktik`) und `Vision.md` (dort steht weiterhin
TAKTIK). Eine spätere Umbenennung ist möglich, gehört aber nicht in diesen Slice.

## 12. Erfolgskriterien dieses Slice

Bewusst als **Mechanismus** formuliert, nicht als Prozentsatz von 661 — die Zahl der distinkten
Katalogeinträge ist erst nach Abschluss des Quelleninventars belastbar.

1. Alle Grundelemente aus Kapitel 1–3 sind als Katalogeinträge modelliert und bestehen den
   Fingerprint-Gate mit Toleranz 0,01.
2. `C.1.1_Löschstaffel`, `C.1.2_Löschgruppe` und `D.3.7_Zugführer der Feuerwehr` werden
   ausschließlich aus einer `SymbolSpec` erzeugt, ohne hinterlegte Gesamtzeichnung — beide
   Layoutprofile aus Abschnitt 4 sind damit abgedeckt.
3. Mindestens fünf fachlich unzulässige Kombinationen werden mit strukturiertem Fehler abgelehnt.
4. Das Coverage-Manifest ist über `(sourceId, variant)` eindeutig keyfähig; alle 31
   Varianten-Dateien haben einen Slot.
5. CI läuft vollständig grün auf einem Rechner ohne Referenzkorpus.
6. `@einsatzzeichen/core` hat null Laufzeitabhängigkeiten und rendert SVG sowie Canvas aus
   derselben IR.
7. Kein ausgelieferter Katalogeintrag ohne Quellen- und Reviewstatus.

## 13. Risiken

**Über 400 Piktogramme sind Handarbeit.** Die Fachanhänge verlangen organische Zeichnungen, die
niemand generieren kann. Das ist der mit Abstand größte Aufwandsposten und das eigentliche Gate
für Release 1.0 — nicht der Code. Für diesen Slice ist es irrelevant, für die Roadmap
entscheidend. Eine Antwort auf „wer zeichnet das" steht aus.

**Die Lizenzlage der BABZ-Assets ist ungeklärt.** Deshalb Fingerprints statt Dateien und
eigenständige Geometrie statt übernommener Pfade. Sollte sich die Nutzungsgrundlage klären,
könnte der Referenz-Vollvergleich später auch in CI laufen; die Architektur bleibt davon
unberührt.

**Die Referenz ist in Details uneinheitlich.** Koordinatenrauschen, `_Alternative`- und
`_2`-Suffixe ohne dokumentierte Semantik, 13 abweichende viewBox-Formate. Jede Abweichung, die
uns beim Katalogaufbau begegnet, wird als solche im Manifest vermerkt statt stillschweigend
geglättet.

**Abgrenzung Polizei und Bundeswehr.** Die öffentliche Referenz ist auf die nicht-polizeiliche
Gefahrenabwehr ausgerichtet. Vollständigkeit für polizeiliche oder militärische Vorschriften wird
nicht behauptet. Einzelne Einträge (etwa `N.1.1_Bergeräumpanzer_Bundeswehr`) existieren in der
Referenz und werden übernommen, begründen aber kein Organisationsprofil.

## 14. Nächster Schritt

Umsetzungsplan über das `writing-plans`-Skill erstellen.
