# Einsatzzeichen — Gate-Härtung vor D.1

> Design-Spec · 6. August 2026 · Status: freigegeben

## 1. Zweck und Reihenfolge

Diese Spec schließt die Qualitätslücken, die laut
`docs/decisions/2026-08-05-vision-luecken-und-slice-reihenfolge.md` vor dem Massenausbau
zu schließen sind. Sie liegt zwischen dem abgeschlossenen Piktogramm-Mechanismus D.0 und dem
Katalogausbau D.1.

Die ursprüngliche Fassung der Slice-3-Spec sprach in Abschnitt 10 von „drei verbleibenden
Lücken“ und zählte dort nur Mehrgrößen, Druck und A11y auf. Dieselbe Spec hielt in den
Abschnitten 1, 7 und 12 ausdrücklich fest, dass die globale viewBox-Prüfung nicht in D.0
umgesetzt wurde. Das war eine redaktionelle Auslassung, kein De-Scoping; die Spec ist entsprechend
korrigiert. Der verbindliche Umfang besteht daher aus vier Bereichen:

1. Rasterregression bei 16, 24, 32, 64, 128 und 256 Pixeln
2. Theme- und Druckprofile
3. A11y-Metadaten, Kontrast und eine nicht von Farbhue abhängige Druckdarstellung
4. globale viewBox-Konsistenz und Clipping der eigenen Ausgabe

Erst wenn diese vier Gates über den gesamten renderbaren Katalogbestand grün sind, folgt D.1.

## 2. Ausgangslage

- `ColorToken` trennt semantische Farbe bereits vom Hexwert, beide Renderer lesen aber direkt
  die eine Referenzpalette.
- `SvgOptions` und `CanvasOptions` besitzen kein Theme.
- Die 13 vorhandenen Dateisnapshots werden nur mit `size: 64` erzeugt. Weitere SVG-Snapshots
  würden fast ausschließlich `width` und `height` ändern und keine Rastereffekte prüfen.
- `<title>`, `<desc>`, `role="img"` und `aria-labelledby` werden korrekt gerendert. Titel sind
  vorhanden, `Drawing.description` hat im Katalog jedoch keinen Produzenten.
- Die BABZ-Referenzfarbe `blau` (`#003296`) erreicht mit schwarzem Piktogramm-Ink nur ungefähr
  1,90:1. Die Referenzpalette kann deshalb nicht zugleich unverändert und pauschal
  kontrastkonform sein.
- `boundsOfMm()` liefert für Pfade absichtlich keine Hülle. Ein globales Gate, das die Funktion
  unverändert benutzt, würde das Pfad-Piktogramm `capability.service-water` nicht vermessen.
- D.0 prüft Piktogramm-Boxen gegen den rechteckigen Körper `formation`; das ist nicht dasselbe
  wie eine Prüfung der fertigen Zeichnung gegen ihre viewBox.

## 3. Theme-Vertrag

### Entscheidung: Theme-Objekt an der Renderergrenze

`Drawing` und `Style` bleiben semantisch und enthalten weiterhin ausschließlich `ColorToken`.
Ein Render-Theme wird erst an SVG- und Canvas-Renderer übergeben:

```ts
export type RgbHex = `#${string}`;
export type ColorPalette = Readonly<Record<ColorToken, RgbHex>>;

export interface RenderTheme {
  readonly id: string;
  readonly palette: ColorPalette;
  readonly surface: RgbHex;
  readonly bodyStrokeDashes?: Readonly<
    Partial<Record<ColorToken, readonly number[]>>
  >;
}
```

`SvgOptions` und `CanvasOptions` erhalten `theme?: RenderTheme`. Ohne Option verwenden beide das
`REFERENCE_THEME`, dessen Palette exakt `PALETTE` ist. Bestehende Ausgaben bleiben damit
bytegleich.

Themes sind Objekte statt einer String-Union in `core`: Anwendungen und spätere Profile können
eigene Paletten übergeben, ohne dass `core` den Katalog importiert. Die Paketrichtung
`cli → catalog → core → schema` bleibt erhalten. Der bestehende fachliche `ProfileId = 'bund'`
wird nicht mit Darstellungsprofilen vermischt.

Der Katalog liefert drei benannte Themes:

| Theme | Zweck | Zusicherung |
|---|---|---|
| `reference` | Referenztreue und bestehende Snapshots | exakt die extrahierte BABZ-Palette |
| `accessible-light` | kontraststarke Bildschirmdarstellung auf hellem Untergrund | bedeutungstragendes Ink mindestens 3:1 gegen angrenzende Katalogflächen; eindeutige Organisationskonturen |
| `print-monochrome` | Schwarz-Weiß-Ausgabe | alle Werte achromatisch; Organisationsflächen besitzen unterschiedliche Helligkeiten und Konturen |

`surface` ist Teil des Vertrags, weil ein transparenter SVG-String seinen späteren Untergrund
nicht kennen kann. Die Gates gelten nur für den deklarierten Untergrund. Eine beliebige dunkle
Karte ist damit nicht automatisch freigegeben.

Das CLI macht die drei Katalogthemes über `export --theme` auswählbar. Die Exportgröße wird vor
jedem Dateisystemzugriff als endliche Zahl größer null validiert, sodass falsche Eingaben weder
`width="NaN"` noch Nullgrößen erzeugen können.

## 4. Kontrast und nicht-farbliche Ausgabe

### Automatisierbarer Umfang

Das Kontrast-Gate arbeitet nicht mit einem pauschalen Palette-Scan. Es erhält explizite
Nachbarschaften:

```ts
interface ContrastRequirement {
  foreground: ColorToken;
  background: ColorToken | 'surface';
  context: string;
  minimum: number;
}
```

Der Katalog erzeugt Anforderungen aus allen tatsächlich verwendeten Piktogramm-Ink-Tokens:

- gegen jede belegte Organisationsfüllung;
- gegen die Theme-Oberfläche für Zeichen ohne Organisationsfüllung;
- zusätzlich schwarzes Kopf- und Kontur-Ink gegen die Oberfläche.

`accessible-light` und `print-monochrome` müssen alle Anforderungen mit mindestens 3:1
bestehen. Das ist der Schwellenwert für bedeutungstragende Nichttextgrafiken aus WCAG 2.2,
SC 1.4.11. Das Gate heißt bewusst nicht „WCAG-Zertifizierung“: allgemeine geometrische
Nachbarschaften, beliebige Einbettungsflächen und fachliche Verwechslungsfreiheit bleiben
außerhalb eines rein mechanischen Nachweises.

Das Referenztheme bleibt unverändert. Ein Test hält den bekannten Befund Schwarz auf BABZ-Blau
ausdrücklich fest; er wird weder als konform ausgegeben noch durch eine heimliche Änderung der
Referenzfarbe beseitigt.

### Nicht von Farbhue abhängige Darstellung

`print-monochrome` bildet jedes Token auf einen Grauwert ab. Die sieben belegten
Organisationsfarben erhalten sieben verschiedene, geordnete Helligkeiten, die ihrerseits
mindestens 3:1 zu schwarzem Ink erreichen. In `accessible-light` und `print-monochrome` trägt
die Körperkontur außerdem je Organisation eine eindeutige Strich-/Lückensignatur in Millimetern;
eine Organisation bleibt bewusst durchgezogen. Ein eigener 64-px-Kontaktbogen rastert alle
sieben Organisationen in beiden Themes. Damit existiert neben Farbe beziehungsweise Helligkeit
ein tatsächlich gerenderter nicht-farblicher visueller Kanal.

Zusätzlich erhält jede renderbare Katalogzeichnung eine nichtleere semantische Beschreibung.
Grundzeichen, Rezepte und eigenständige Piktogramme müssen deshalb sowohl `title` als auch
`description` tragen. Der Renderer erfindet diese Texte nicht aus Geometrie; der Katalog erzeugt
sie aus `SymbolSpec`, Bezeichnern und Quellenabschnitt.

## 5. Mehrgrößen-Rastergate

### Entscheidung: echte Rasterung, ein sichtbarer Kontaktbogen je Implementierung

Die sechs Größen werden mit dem als Dev-Dependency gesperrten `@resvg/resvg-js` tatsächlich zu
PNG gerastert. Ein bloßer SVG-Stringvergleich wäre kein Mehrgrößen-Nachweis.

Ein gemeinsames Renderfall-Register enthält:

- jede primäre Darstellung aus `BASE_SYMBOLS`;
- jedes Ergebnis aus `RECIPES`;
- jedes `ALL_PICTOGRAMS`-Element als eigenständige `Drawing`.

Seine IDs müssen exakt der Menge aller Manifest-Implementierungen mit der typisierten Evidenz
`svg-snapshot` entsprechen. Dadurch kann ein späterer Eintrag diesen Nachweis nicht behaupten,
ohne im Mehrgrößen-Gate aufzutauchen.

Je Implementierung entsteht ein lesbarer SVG-Kontaktbogen. Er bettet die sechs tatsächlich
gerasterten PNGs des Referenzthemes in Originalgröße ein und ergänzt je eine große Rasterung für
`accessible-light` und `print-monochrome`. Vitest verwaltet den Kontaktbogen als
`toMatchFileSnapshot()`; die PNG-Daten sind eingebettet und der Snapshot bleibt direkt im Browser
oder Editor prüfbar.

Ein vierzehnter Kontaktbogen rastert zusätzlich jede der sieben belegten Organisationen bei
64 px in beiden Alternativthemes. Er macht die Kombination aus Füllung und Kontursignatur als
zusammenhängende visuelle Prüffläche sichtbar.

Zusätzliche Zusicherungen je Rasterung:

- Ausgabemaß ist exakt `size × size`;
- mindestens ein Pixel ist sichtbar;
- bei der 256-Pixel-Ausgabe berührt keine sichtbare Tinte den äußeren Pixelrand.

Der letzte Punkt ergänzt das strukturelle viewBox-Gate mit dem tatsächlichen Renderergebnis und
erfasst auch Strichkappen, Miter und Antialiasing, die eine reine Koordinatenhülle nicht vollständig
modelliert.

## 6. viewBox- und Clipping-Gate

`core` erhält:

```ts
checkViewBox(drawing: Drawing): ViewBoxIssue[]
```

Das Gate prüft:

- Breite und Höhe sind endlich und größer null;
- alle Rechtecke, Kreise, Linien und Polylinien liegen einschließlich halber Strichstärke in
  `0…width × 0…height`;
- Gruppenstil-Vererbung sowie Translation und Rotation werden berücksichtigt;
- Pfade werden über die zugelassenen absoluten Kommandos `M/L/H/V/C/Q/Z` gelesen;
- End- und Kontrollpunkte bilden eine konservative Hülle für Bézierkurven;
- relative, unbekannte oder nicht analysierbare Pfade erzeugen einen Befund statt einer leeren
  Hülle;
- `translate` an einem Blatt-Primitiv wird als IR-Verstoß gemeldet. D.0 hat die Verschiebung nur
  an Gruppen belegt, und SVG- und Canvas-Renderer wären bei einem Pfadblatt derzeit nicht paritätisch.

Die Katalogpolitik wird getrennt geprüft: jede eigene Katalogzeichnung muss exakt die kanonische
32×32-mm-viewBox verwenden. Die 13 abweichenden Formate im externen Referenzbestand werden damit
nicht still normalisiert; sie bleiben Referenzmetadaten und sind keine zulässigen viewBoxes der
eigenen Ausgabe.

Die Strichhülle verwendet die halbe Strichstärke. Spitze Miter können darüber hinausragen; dafür
ist die zusätzliche reale Randpixelprüfung bei 256 px verbindlicher Bestandteil desselben Gates.

## 7. Abgrenzung

Nicht enthalten sind:

- Inhalte aus D.1 bis D.5;
- neue Piktogramm-Bildideen oder fachliche `domain`-Freigaben;
- die sechs fehlenden Grundzeichen, `1.13`, Kapitel 3 und Variantenslots;
- der Extraktor-/Fingerprint-Umbau aus dem nicht freigegebenen Kennzahlen-Kandidatenplan;
- MapLibre-, Website- und andere Ausgabekanaltests;
- eine physikalische Drucker-/Papier-/Farbprofil-Zertifizierung;
- eine fachliche Zulässigkeitsmatrix für jedes Piktogramm-Grundzeichen-Paar.

Die aktuellen Rechteck-, Kreis- und konvexen Polygonkörper sind inzwischen technisch exakt
vermessen (Nachtrag vom 6. August 2026). Das autorisiert jedoch kein reales Piktogramm automatisch
für jeden Grundkörper. D.1 autorisiert die Kapitel-4-Piktogramme weiterhin nur gegen `formation`;
das globale viewBox-Gate gilt trotzdem für jede fertige Zeichnung.

## 8. Erfolgskriterien

1. Beide Renderer verwenden ohne Option byte- beziehungsweise aufrufsgleich die Referenzpalette
   und akzeptieren dasselbe `RenderTheme`-Objekt.
2. `accessible-light` und `print-monochrome` bestehen alle expliziten 3:1-Anforderungen des
   aktuellen Katalogbestands; das bekannte Scheitern der Referenzkombination Schwarz/Blau ist
   dokumentiert und getestet. Alle sieben Organisationen besitzen in beiden Alternativthemes
   eine eindeutige Kontursignatur als zusätzlichen nicht-farblichen Kanal.
3. Alle renderbaren Katalogfälle besitzen nichtleere Titel und Beschreibungen.
4. Die Renderfall-IDs sind exakt deckungsgleich mit den Manifest-Einträgen, die den typisierten
   Nachweis `svg-snapshot` tragen.
5. Für jeden Renderfall liegen echte Rasterregressionen bei 16, 24, 32, 64, 128 und 256 px sowie
   Profilansichten vor; Maße, Sichtbarkeit und 256-px-Randfreiheit sind geprüft. Ein zusätzlicher
   Profilbogen zeigt alle sieben Organisationen bei 64 px in beiden Alternativthemes.
6. Jede eigene Katalogzeichnung verwendet 32×32 mm und besteht `checkViewBox()`.
7. Bestehende SVG-Dateisnapshots ändern ausschließlich ihren Metadatenanteil (`<desc>` und die
   erweiterte ARIA-Verknüpfung); ihre Geometrie und Farben bleiben unverändert. Die neuen
   Raster-Kontaktbögen sind eingecheckt und visuell geprüft.
8. Gesamttests und Typecheck sind grün, ohne lokalen BABZ-Referenzbestand. `schema` und `core`
   behalten null Laufzeitabhängigkeiten; der Rasterizer ist ausschließlich Dev-Dependency.
