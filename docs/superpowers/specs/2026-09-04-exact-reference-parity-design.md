# Exact Reference Parity — Design

> Stand: 4. September 2026  
> Status: genehmigte Spezifikation für die vollständige technische Abnahme des
> versionierten BABZ-Referenzstands

## 1. Entscheidung und Ziel

Die veröffentlichten Einsatzzeichen-Pakete enthalten eine vollständige,
self-contained und versionierte Geometry- und Paint-IR im Implementierungsformat
des Projekts. Sie benötigen weder BABZ-Dateien noch Netzwerkzugriff zur
Laufzeit. Die 661 lokalen
BABZ-Original-SVGs sind ausschließlich ein unveröffentlichter Testorakelbestand:
Sie werden niemals eingecheckt, ausgeliefert, als Laufzeit-Fallback gelesen oder
in Review-Artefakte eingebettet.

Die Vollabnahme bedeutet **Exact Reference Parity**: Jede festgelegte
Referenzdarstellung und jedes prüfbare Teilzeichen wird aus der committed IR
deterministisch erzeugt und gegen das lokale Original mit Null-Diff geprüft.
"Ähnlich", manuelle Sichtprüfung ohne Messung, Snapshot-Gleichheit der eigenen
Ausgabe und toleranzbasierte Pixelwerte sind keine Exact-Parity-Freigabe.

Die fachliche Aussage bleibt davon getrennt. Ein Exact-Parity-Pass belegt die
technische Übereinstimmung mit dem eingefrorenen Projektorakel; er behauptet
weder normative Geltung noch eine geklärte Nutzungsgrundlage der Quelle.

## 2. Ausgangslage und Ablösung des bisherigen Coverage-Gates

Das aktuelle Coverage-Manifest führt 544 Darstellungen: 14 Katalogeinträge,
242 Kompositionsrezepte und 288 Elemente. Das Referenzinventar enthält 661
Dateien, von denen der heutige Mechanismus 550 beansprucht und den Rest als
außerhalb des Scopes, Beispiel, Übersicht oder zurückgestellt disponiert.
Diese Dispositionen sind für schrittweise Katalogarbeit sinnvoll, aber nicht
mit einer Vollabnahme vereinbar.

Exact Reference Parity ergänzt das bestehende Coverage- und Domain-Review; es
ersetzt deren Semantik nicht. Für einen Exact-Parity-Release gilt jedoch:

1. alle 661 Orakelassets erhalten einen prüfbaren Asset-Case;
2. alle 661 Orakelassets erhalten außerdem eine eigenständig renderbare,
   veröffentlichte Library-Ausgabe;
3. alle 544 bisherigen Manifestdarstellungen erhalten einen Display-Case;
4. jedes registrierte Baukastenteil erhält einen Component-Case;
5. kein Asset und kein Teilzeichen wird durch `out-of-scope`, `deferred`,
   `example`, `overview-sheet`, `not-comparable` oder ein fehlendes Orakel
   freigestellt.

Beispiele, Übersichtsblätter, Farbfelder und bisher zurückgestellte Dateien
werden über dieselbe Exact-Asset-API adressierbar wie alle anderen Assets. Sie
müssen nicht zu frei kombinierbaren Baukastenteilen werden, ihre vollständige
Paint-IR ist aber committed, öffentlich renderbar und denselben Gates
unterworfen.

## 3. Datenmodell

### 3.1 Vier vollständige Inventare

Der Conformance-Kern führt vier getrennte, versionierte Mengen:

| Menge | Schlüssel | Zweck |
|---|---|---|
| `OracleAsset` | `oracle:<filename>` | Metadaten und Identität des lokalen Originals |
| `ExactAssetFixture` | `asset:<filename>` | Veröffentlichte, vollständige Library-Ausgabe genau dieses Assets |
| `DisplayFixture` | `display:<sourceId>#<variant>` | Bisherige semantische Katalog-/Rezept-/Elementdarstellung mit explizitem `comparisonMode` |
| `ComponentFixture` | `component:<componentKey>@<contextKey>#<variant>` | Eine konkrete Baukastenvariante in isolierter oder definierter Trägerdarstellung |

`OracleAsset` enthält nur Metadaten, keinen SVG-Inhalt. `ExactAssetFixture`,
`DisplayFixture` und `ComponentFixture` enthalten ausschließlich unabhängig
implementierte IR und deren semantische Bezüge. Der Test kann die lokale
Originaldatei nur über ihren Dateinamen aus dem Orakelmanifest öffnen. Zwischen
`OracleAsset` und `ExactAssetFixture` besteht eine Bijektion.
Das committed OracleManifest bindet jeden der 661 erwarteten Dateinamen an
seinen SHA-256 und berechnet daraus einen kanonisch sortierten Orakelset-Digest.
Es enthält weder Pfade noch Raster- oder XML-Inhalte.

Die 544 Display-Fixtures bilden zwei disjunkte und vollständige Mengen. Die 14
Katalogeinträge, 242 Rezepte und 269 eigenständig dargestellten Piktogramme,
insgesamt 525 Displays, verwenden `comparisonMode: 'whole'`. Die 19
nicht eigenständig darstellbaren Träger-/Elementzeilen verwenden
`comparisonMode: 'part'` und nennen genau einen `OraclePart`. Diese Zuordnung
wird als Schlüsselmenge statt nur als Anzahl gegated.

### 3.2 Geometry- und Paint-IR

Die neue `ReferenceExactIR` ist kanonisch, serialisierbar, immutable und
vollständig committed. Sie bildet bewusst nur den gemessenen Quellkorpus ab:
geordnete Gruppen, Rechtecke, Kreise und Compound Paths, berechnetes `fill`,
Fill-Rule und eine kanonische Transformationsfolge. Der Orakelparser darf die
im Quellbestand vorkommenden Polygone, Polylinien sowie absoluten und relativen
`M/H/V/L/C/S/Z`-Kommandos lesen. In committed oder gedigesteten Pfaden sind
jedoch ausschließlich absolute, explizite `M`, `L`, `C` und `Z` erlaubt:
relative Koordinaten werden absolut, `H/V` werden `L`, `S` wird unter
Berücksichtigung des vorigen Kontrollpunkts `C`, und implizite
Kommandowiederholungen werden ausgeschrieben. Polygon und Polyline werden in
dieselbe Pfadgrammatik überführt. Rechteck und Kreis bleiben verlustfreie
Primitive und werden nicht durch approximierende Pfade ersetzt.

Jede Quelltransformationsliste bleibt in SVG-Reihenfolge als geordnete,
typisierte `ExactTransformSequence` mit kanonischen Original-Dezimaloperanden
erhalten. Der gemessene Vertrag modelliert `translate`, `scale`,
`rotate(angle,cx,cy)` und `matrix(a,b,c,d,e,f)` explizit; ausgelassene
Defaultoperanden werden ausgeschrieben. Insbesondere werden Rotationen nicht
über vorab berechnete Sinus-/Kosinuswerte in eine endliche Dezimalmatrix
gefaltet. Eine abgeleitete IEEE-754-Matrix darf Diagnosewert sein, ist aber
weder Source of Truth noch Teil des Exactness-Digests. Es gibt kein implizites
Backen in Koordinaten. Unbekannte Elemente, Attribute, Pfadkommandos oder
Transformationsmuster sind ein harter Corpus-Feature-Fehler; der Import darf
sie nicht still verwerfen.

Der aktuelle Corpus-Feature-Vertrag umfasst 2.336 Gruppen, 965 Rechtecke,
2.155 Pfade in 601 Dateien, 124 Polygone, 102 Kreise und 4 Polylinien. Es gibt
55 Transformationen in 53 Dateien, derzeit ausschließlich an Rechtecken, sowie
fünf ViewBox-Familien entsprechend 32×32, 48×32, 36×32, 32×46 und 80×32 mm.
Die lokalen Strict-Gates zählen diese Merkmale bei jedem Lauf neu. Jede
Abweichung vom versionierten Feature-Vertrag erzwingt eine bewusste
Schemaentscheidung und kann nicht automatisch akzeptiert werden.

Koordinaten und ViewBoxes werden in nativen Referenzeinheiten als kanonische
Dezimalstrings ohne Exponent oder als äquivalente verlustfreie Festkommazahlen
gespeichert. Es gibt keinen Roundtrip über Fließkomma-Millimeter, kein
`formatUnits(3)` und keine globale Näherung wie `scale(2.8346)`. Paint-Reihenfolge,
Teilpfadreihenfolge und Transformationsreihenfolge sind Teil des Digests.
Fehlendes Quell-`fill` wird nach SVG-Regel explizit als Schwarz modelliert;
sichtbare Konturen bleiben gefüllte Flächen und werden nicht durch idealisierte
Strokes ersetzt. Nichtmalende Quellknoten werden als `non-painting`
inventarisiert, nicht unbemerkt entfernt.

Die Version `NormalizedPaintList/v1` ist ein eigener, vollständig festgelegter
Vergleichsvertrag. Der Algorithmus arbeitet in dieser Reihenfolge:

1. XML wird ohne Netzwerk, Entitäten, Skripte oder externe Ressourcen gelesen
   und gegen den versionierten Corpus-Feature-Vertrag validiert.
2. Quellreihenfolge, ViewBox-Ursprung und `preserveAspectRatio` werden erhalten;
   Gruppen werden depth-first in Dokumentreihenfolge abgeflacht.
3. Die im Corpus erlaubten Präsentationsattribute werden nach SVG-Regeln
   berechnet. Fehlendes `fill` ergibt Schwarz, fehlende Fill-Rule `nonzero`;
   `display`, `visibility` und nichtmalende Geometrie werden explizit erfasst.
   Der fehlende `preserveAspectRatio`-Wert wird explizit als SVG-Default
   `xMidYMid meet` modelliert. Solide Farben werden als lowercase
   `#rrggbbaa` kanonisiert, `fill="none"` als nichtmalend. CSS, Stylesheets oder
   nicht erlaubte Vererbung führen zum Fehler.
4. Zahlen werden als minimale kanonische Dezimalstrings ohne Exponent und ohne
   negatives Null serialisiert. Pfade und Transformationsoperanden werden wie
   oben normalisiert; implizite Werte und Kommandos bleiben nicht bestehen.
5. Jeder sichtbare Leaf emittiert genau einen geordneten Paint-Record aus
   Primitive/Geometrie, berechneter Farbe, Fill-Rule und
   `ExactTransformSequence`.
   Quell-ID, Kandidaten-ID, Eigentümer und fachliche Rolle gehören bewusst
   nicht in diese gemeinsame visuelle Projektion. Nichtmalende Knoten stehen in
   einem getrennten, ebenfalls gedigesteten Inventar und emittieren keinen
   Paint-Record.
6. Felder und Record-Reihenfolge werden als UTF-8 in einer versionierten
   Canonical-JSON-Kodierung mit sortierten Objektschlüsseln und unveränderter
   Arrayreihenfolge serialisiert. Dieser Bytewert bildet den
   Paint-List-Digest.
7. Parallel dazu bindet `OraclePaintIndex/v1` jeden Orakelrecord an seine vom
   Assetdigest abhängige Source-ID. `OwnedPaintIndex/v1` bindet jeden
   Kandidatenrecord über `(ordinal, paintRecordDigest)` an stabile Node-ID,
   `PaintOwner` und Rolle. Beide Indexe sind vollständig und separat
   gedigestet; nur die owner-freie Paint-Liste wird zwischen Orakel und
   Kandidat verglichen.

Adversariale Tests belegen sowohl Äquivalenzen als auch Nichtäquivalenzen:
relative gegen absolute Kommandos, `H/V` gegen `L`, `S` gegen expandiertes `C`,
implizites gegen explizites Schwarz, kanonisch gleich geschriebene
Transformoperanden, vertauschte oder anders faktorisierte Transformfolgen,
vertauschte Paint-Reihenfolge, geänderte Fill-Rule, Sichtbarkeit, ViewBox und
Subpathfolge. Anders faktorisierte Transformfolgen bleiben selbst bei
zufälliger Rastergleichheit unterschiedliche Vektorrepräsentationen.
Der lokale Orakelparser normalisiert Original und Kandidat in genau diese
semantische Paint-IR. Reine XML-, Gruppen- oder Exportformatunterschiede ohne
Paint-Bedeutung verschwinden; jede abweichende sichtbare Primitive,
Reihenfolge, Fill-Rule, Transformation oder Farbe bleibt ein Fehler.

Jeder sichtbare Paint-Knoten trägt eine stabile Node-ID, eine semantische Rolle
und genau einen Eigentümer:

```ts
type PaintOwner =
  | {
      readonly kind: 'component';
      readonly component: ComponentKey;
      readonly variant: ExactComponentVariantKey;
    }
  | {
      readonly kind: 'asset-specific';
      readonly asset: ExactAssetKey;
      readonly purpose: string;
    };
```

Nur `component`-Eigentümer erzeugen `UseEdge`s. Assetspezifische Leaves werden
vollständig gezählt und gedigestet, aber keinem erfundenen Baukastenteil
zugeschlagen. A11y-, Titel-, Quellen- und Beschreibungstexte liegen außerhalb
der Paint-Liste und dürfen deren Ausgabe nicht verändern. Opaque SVG-Strings,
zufällige IDs, Systemfonts und externe Ressourcen sind verboten.

Die Eigentümerwahl ist keine freie Kandidatenannotation. Ein versioniertes
`OracleOwnershipManifest` ordnet jeden sichtbaren
`(OracleAssetDigest, OraclePaintNodeId)`-Record genau einem erwarteten
Component-Vorkommen samt `ComponentKey`, `ExactComponentVariantKey` und
Occurrence-Key oder einem begründeten, explizit allowlisteten
`asset-specific`-Eintrag samt Asset, registriertem Purpose-Key, Review-Key und
`reuseFingerprint` zu. `asset-specific` ist nur zulässig, wenn die
versionierte Klassifikationsregel den Leaf keinem der 413 Component-Keys
zuordnet und derselbe in den gemeinsamen Part-Frame normalisierte
`reuseFingerprint` im vollständigen Orakelgraphen genau einmal vorkommt.
Mehrfach vorkommende oder einer Component-Semantik entsprechende Leaves müssen
`component`-Eigentümer sein. Das Gate prüft diese Regel gegen sämtliche
Ownership-Einträge. Nach erfolgreichem Paint-List-Matching muss die Projektion
des `OwnedPaintIndex` exakt dieser erwarteten Besitzmultimenge entsprechen.
Anzahl, Schlüsselset und Digest aller assetspezifischen Ausnahmen sind Teil des
Releasevertrags; ein Worker kann nicht durch Umklassifizierung eine `UseEdge`
umgehen.

Feste Originalbeschriftungen sind ausschließlich explizit implementierte
Glyphen- oder Laufkonturen. Das Arimo-Textprimitive und andere Fonts sind im
Exact-Paint-Pfad verboten. Freie Nutzerbeschriftung bleibt ein gesonderter,
semantischer Ausgabepfad ohne BABZ-Identitätsclaim; sie darf kein bestehendes
Exact-Asset ersetzen oder dessen Attestation erben.
Der Exact-Paint-`FontSet` ist deshalb die kanonisch leere Menge; sein Digest
bindet genau diese Leere. Eine spätere Fontabhängigkeit wäre eine explizite
Schema- und Vertragsänderung. Fonts für freie Nutzerbeschriftung werden
außerhalb des Exact-Parity-Claims separat getestet und lizenziert.

### 3.3 Parts und UseEdges

Ein `OraclePart` beschreibt den im Original zu prüfenden Teil eines Assets:

```ts
interface OraclePart {
  readonly key: OraclePartKey;
  readonly asset: OracleAssetKey;
  readonly oracleAssetDigest: string;
  readonly role:
    | 'whole'
    | 'body'
    | 'body-extra'
    | 'head'
    | 'chassis'
    | 'pictogram'
    | 'body-mark'
    | 'label'
    | 'text'
    | 'colour-field';
  readonly sourcePaintNodes: readonly OraclePaintNodeSelector[];
  readonly oracleToPart: ExactTransformSequence;
  readonly isolation:
    | { readonly mode: 'source-node-set' }
    | { readonly mode: 'leave-one-out' };
  readonly comparisonProfile: ComparisonProfileId;
}

interface UseEdge {
  readonly component: ComponentKey;
  readonly fixture: ExactAssetKey | DisplayKey | ComponentFixtureKey;
  readonly oracleAsset: OracleAssetKey;
  readonly oraclePart: OraclePartKey;
  readonly traceNode: GeometryNodeId;
  readonly fixtureToPart: ExactTransformSequence;
}
```

Ein Part ist keine heuristische nachträgliche Bildsuche. Seine Rolle,
Quellknoten, Isolation, beide Abbildungen, Referenzkoordinaten und sein
Vergleichsprofil sind vor dem Lauf festgelegt. Der aus dem Profil aufgelöste
`partFrame` ist die einzige autoritative Frame-Definition. `oracleToPart` bildet
die ausgewählten Quellnodes aus dem nativen Assetraum in diesen gemeinsamen
Part-Frame ab; `fixtureToPart` liegt auf der jeweiligen
`UseEdge` und bildet das lokale Component-/Host-Fragment in genau denselben
Frame ab. Paint-List- und Rastervergleich verwenden dieselben Folgen, deren
Digests Teil des Cases sind. Ein `OraclePaintNodeSelector` adressiert eine
stabile Paint-Node-ID aus der normalisierten Orakel-Paint-Liste und ist an den
SHA-256 des vollständigen Orakelassets gebunden. Ändert sich der Assetdigest,
wird der Selector ungültig; es gibt keine positions- oder farbbasierte
Wiedererkennung.

`source-node-set` rastert ausschließlich die explizit ausgewählten Quellknoten.
Dieser Modus ist nur zulässig, wenn ein maschineller Paint-Order- und
Bounds-Nachweis bestätigt, dass keine fremde, maskierende oder okkludierende
Node das Teil beeinflusst. Andernfalls ist `leave-one-out` verpflichtend: Es
vergleicht als Paar sowohl das vollständige Rendering als auch ein Rendering
ohne die ausgewählten Orakelnodes mit den entsprechenden vollständigen und um
die Trace-Nodes reduzierten Kandidatenrenderings. Die vier Bildvarianten müssen
in beiden Vergleichspaaren Null-Diff haben. Ein reiner Rastermasken-Crop ohne einen
dieser beiden Belege ist verboten.

`MaskContract` versioniert Koordinatenraum, ViewBox-Ursprung,
Maskenrastergröße, Kanteninklusion, Antialiasing, Alpha-Schwelle und die
Transformation vom gemeinsamen Part-Frame in den Zielviewport. Ein Fahrwerk, eine
Kopfmarke, ein Farbträger oder ein Body-Mark wird nicht gegen das vollständige
Zeichen verglichen. Wo ein Original nur einen Kompositionsbeleg liefert,
verbindet eine oder mehrere `UseEdge`s die Komponenten mit genau den geprüften
Originalparts.

Ein `ComparisonProfile` darf ausschließlich den Part-Frame, die Part-Maske und
zusätzliche Diagnosegrößen bestimmen. Die zehn Pflichtgrößen, transparente,
schwarze und weiße Hintergründe, RGBA-Kanonisierung und
`NormalizedPaintList/v1` gelten global und können durch kein Profil ersetzt,
reduziert oder umdefiniert werden. Ein Profil darf keine von null abweichende
Pixel-, Farb-, Geometrie- oder Bounding-Box-Toleranz definieren.
Der einmal aufgelöste Profilwert ist die gemeinsame Source of Truth für
Vektorprojektion, Maskenraster und RGBA-Rastervergleich; getrennte Kopien von
Frame oder Maske in `OraclePart` oder Case sind verboten.

Der Use-Index wird aus dem `PaintComponentRegistry`, den Exact-Asset-Fixtures,
den Rezepten, den `SymbolSpec`-Fixtures und den Display-Fixtures abgeleitet. Er
wird nicht als zweite handgeschriebene Zuordnung gepflegt. Jede geometrisch
sichtbare IR-Leaf besitzt genau einen `PaintOwner`; jede in einem Trace sichtbare
Leaf mit `component`-Eigentümer erzeugt mindestens eine `UseEdge`.
Assetspezifische Leaves erzeugen keine. So können auch Komponenten aus den 111
bisher nicht beanspruchten Assets belegt werden, ohne sie künstlich einer der
544 bisherigen Manifestzeilen zuzuordnen.

Das `PaintComponentRegistry` enthält ausschließlich semantische, sichtbare
Baukastenteile. Seine eingefrorene Baseline ist die disjunkte Vereinigung aus
398 Werten in 15 Snapshot-Registern und 15 direkten Piktogrammträgern; sie hat
damit exakt 413 Schlüssel. Von den 398 Snapshot-Werten sind 247 über elf
`SymbolSpec`-Achsen auswählbar: `kind` 19, `organization` 9,
`technicalFill` 13, `strength` 4, `administrativeLevel` 6,
`functionRole` 25, `capabilities` 88, `bodyMarks` 64,
`vehicleCategory` 8, `bodyVariant` 10 und `technicalHeadMark` 1. Weitere 151
liegen in den nicht komponierbaren Registern `states` 61, `comms` 48,
`damage` 28 und `wildfire` 14. Die 15 zusätzlichen, disjunkten Schlüssel sind
`leadership` 10 und `water-rescue-personnel` 5. Anzahl, Disjunktheit und
tatsächliche Schlüsselsets sind Baseline-Invarianten; passende Summen können
keine Überschneidung oder einen stillen Registerwechsel verdecken.

Das getrennte `CompositionContractRegistry` enthält Layoutprofile, Textzonen,
Anker, Transform-/Placement-Regeln, zulässige Kombinationen und die endliche Menge
kanonischer `ComponentContextKey`s. Diese Regeln sind keine Paint-Komponenten
und erhöhen die Zahl 413 nicht. Jede zulässige
`(ComponentKey, ComponentContextKey, ExactComponentVariantKey)`-Fassung ist ein
eigener `ComponentFixtureKey`; jeder unbekannte oder nicht registrierte Kontext
ist ungültig. Jeder der 247 frei auswählbaren Werte besitzt mindestens eine
Fixture, und jeder zur Laufzeit gültige Kontext löst fail-closed genau eine
Fixture auf.

`ReachableBuilderContextSet/v1` wird deterministisch aus der öffentlichen
`SymbolSpec`-Validierung, sämtlichen endlichen Builder-Achsen und den
Kombinationsregeln abgeleitet. Beim unendlichen Freitext wird nur der für die
Exact-Komponenten relevante Zustand `designation absent|present` berücksichtigt;
der Textinhalt gehört zum Generated-Overlay. Die Menge aller daraus
erreichbaren `(ComponentKey, ComponentContextKey)`-Paare muss exakt der
registrierten Kontextmenge entsprechen. Für jeden erreichbaren kanonischen
Spec-Kontext muss `composeExact` erfolgreich sein; `NotMeasuredError` ist nur
für neue oder unbekannte Zustände außerhalb dieses versionierten Sets zulässig,
nicht für eine heute valide Builder-Kombination.

Jeder Registry-Key besitzt genau einen `CompositionContractCase`. Dessen
`CompositionWitnessEdge`s binden ihn an sämtliche im Orakel beobachteten
Placements, Part-Frames, Anker oder Textzonen. Jede Edge enthält Contract-Key,
Asset-/Part-Key, ComponentFixture-Key, die erwartete
`ExactTransformSequence` beziehungsweise Frame-/Zonenmessung und den
zugehörigen Trace-Knoten. Ein Case besteht nur, wenn jedes beobachtete Placement
genau einem Contract zugeordnet ist, der Contract mindestens einen
Orakelzeugen besitzt und materialisierte Transformfolge, Part-Frame, Anker und
Zone exakt mit allen Witness-Edges übereinstimmen. Ein bloß vorhandener
Registry-Key ist kein Exactness-Nachweis.

Das committed `ConformanceManifest` führt die vollständigen, kanonisch
sortierten Sets der `OraclePartKey`s, `ComponentFixtureKey`s und `UseEdgeKey`s.
Es führt ebenso `CompositionContractCaseKey`s und
`CompositionWitnessEdgeKey`s. Für jedes Set werden sowohl erwartete
Kardinalität als auch Set-Digest geprüft.
Jeder der 413 Component-Keys besitzt mindestens eine Fixture und mindestens
einen `OraclePart`-Referenzzeugen; ein fehlender Zeuge ist ein harter
Releasefehler, kein freistellbarer Status.

Das freie Feld `designation` ist kein endliches Component. Seine feste
Typografie-, Layout- und Fehlerbehandlung wird separat getestet, ohne einen
nicht existierenden Originalidentitätsclaim zu erzeugen.

## 4. Harte Mengen- und Graphinvarianten

Der eingefrorene Referenzstand hat die folgenden Release-Invarianten:

```text
|OracleAsset|                                  = 661
|ExactAssetFixture|                            = 661
|AssetCase|                                    = 661
|DisplayFixture|                               = 544
|DisplayFixture[comparisonMode = whole]|       = 525
|DisplayFixture[comparisonMode = part]|        = 19
|DisplayCase|                                  = 544
|PaintComponentRegistry|                       = 413
|ComponentCase|                                = |ComponentFixture|
|CompositionContractCase|                      = |CompositionContractRegistry|
|OracleAsset ohne ExactAssetFixture|            = 0
|ExactAssetFixture ohne OracleAsset|            = 0
|ExactAssetFixture ohne CompositionTrace|       = 0
|DisplayFixture ohne CompositionTrace|         = 0
|ComponentFixture ohne CompositionTrace|       = 0
|IR-Leaf ohne genau einen PaintOwner|          = 0
|Component-Leaf ohne UseEdge|                  = 0
|AssetSpecific-Leaf mit UseEdge|               = 0
|UseEdge mit unbekanntem Ende|                 = 0
|Component ohne Fixture oder Referenzzeuge|    = 0
|ComponentFixture ohne OraclePart-Zeugen|      = 0
|CompositionContractCase ohne WitnessEdge|     = 0
|beobachtetes Placement ohne Contract|         = 0
|erreichbarer Builder-Kontext mit NotMeasured| = 0
|Spec-Pflichtcomponent ohne Trace-Instanz|     = 0
|AssetSpecific-Leaf mit Component-Semantik|    = 0
|Orakel-Paint-Record ohne Ownership-Eintrag|   = 0
|Ownership-Eintrag ohne Orakel-Paint-Record|   = 0
|offener, invalidierter oder abweichender Case|= 0
```

Zusätzlich gelten Mengen- statt Zählinvarianten:

```text
set(DisplayFixture.key) = set(CoverageManifest.entryKey)
set(OracleAsset.filename) = set(localOracleInventory.filename)
set(ExactAssetFixture.filename) = set(OracleAsset.filename)
set(AssetCase.key) = set(OracleAsset.key)
set(DisplayCase.key) = set(DisplayFixture.key)
set(DisplayFixture[whole].key) = set(ConformanceManifest.wholeDisplayKey)
set(DisplayFixture[part].key) = set(ConformanceManifest.partDisplayKey)
set(ComponentCase.key) = set(ComponentFixture.key)
set(ComponentFixture.key) = set(ConformanceManifest.componentFixtureKey)
set(ComponentFixture.(component, context))
  = set(ReachableBuilderContextSet.(component, context))
set(OraclePart.key) = set(ConformanceManifest.oraclePartKey)
set(UseEdge.key) = set(ConformanceManifest.useEdgeKey)
set(CompositionContractCase.key)
  = set(CompositionContractRegistry.key)
set(CompositionWitnessEdge.key)
  = set(ConformanceManifest.compositionWitnessEdgeKey)
set(UseEdge.component) = set(PaintComponentRegistry.key)
set(UseEdge[fixture = ComponentFixture].fixture) = set(ComponentFixture.key)
multiset(OwnedPaintIndex.owner projected to oracle records)
  = multiset(OracleOwnershipManifest.expectedOwner)
set(OracleOwnershipManifest.assetSpecificKey)
  = set(ConformanceManifest.allowedAssetSpecificKey)
```

Ein Asset kann mehrere Verwendungen besitzen, hat aber genau einen Asset-Case
und genau eine Exact-Asset-Fixture. Jeder Component ist über die
Exact-Component-API renderbar, besitzt für jeden gültigen Kontext einen
Component-Case und hat wenigstens einen Referenzzeugen. Ein während der
Entwicklung entdeckter `unreferenced-catalog-value` ist ein harter Fehler.

Das `PaintComponentRegistry` umfasst die sichtbaren Grundkörper und
Körpervarianten, Organisationsfarben, Stärkegrade, Fahrzeugkategorien,
technischen und administrativen Kopfmarken, Piktogramme, Body-Marks und
Funktionsrollen. Layoutprofile, Textzonen, Anker, Farbtokens ohne eigene
Geometrie und Kombinationsregeln gehören ausschließlich in das
`CompositionContractRegistry`. Beide Schlüsselmengen werden als versionierte
Testwerte gegated; eine neue oder entfernte Zeile kann keinen stillen
Mengenwechsel erzeugen.

Jeder `ExactAssetFixture` wird ausschließlich aus geordneten Instanzen
konkreter `ExactComponentVariant`s und expliziten assetspezifischen Fragments
materialisiert. Jeder sichtbare Paint-Knoten besitzt daher entweder einen
`component`- oder einen `asset-specific`-Eigentümer; ungezählte Restknoten sind
unmöglich. Die vollständige normalisierte Paint-Liste und der
`CompositionTrace` werden aus demselben Plan erzeugt. Ein Gate verlangt
Null-Diff zwischen der Materialisierung, dem veröffentlichten Drawing-Cache und
der für die Fixture festgeschriebenen Paint-Liste; eine zweite handgeschriebene
Ganzzeichengeometrie ist verboten.

Für jedes bekannte `SymbolSpec` und jedes Rezept muss die Multimenge der vom
`CompositionContractRegistry` geforderten Paint-Komponenten exakt der
Multimenge der `component`-Instanzen im Trace entsprechen. `asset-specific` ist
nur für sichtbar nicht wiederverwendbare Ganzzeichenanteile zulässig und darf
keinen registrierten Component-Key semantisch ersetzen. Jede solche
Klassifizierung steht explizit im ConformanceManifest und wird einzeln
reviewt.

## 5. Deterministischer Reference-Rendering-Vertrag

Exactness ist als dekodierte Pixelgleichheit definiert, nicht als Gleichheit von
SVG-Quelltext oder PNG-Dateibytes. Der Vergleichsvertrag pinnt:

- `@resvg/resvg-js` exakt auf Version `2.6.2`, den Package-Lock-Digest sowie
  SHA-256 von geladenem JS-, WASM- oder Native-Binary;
- den gedigesteten Build-/Container- beziehungsweise nativen
  Ausführungsstack als `RasterEnvironment/v1`;
- feste sRGB-Farbverarbeitung, premultiplied/straight-Alpha-Konvertierung und
  zunächst vollständig transparenten Hintergrund;
- die identische resvg-Fit-Semantik
  `fitTo: { mode: 'width', value: targetWidth }` für Orakel und Kandidat;
- die von resvg proportional aus ViewBox, Viewport-Ursprung und
  `preserveAspectRatio` abgeleitete Höhe, Pixelratio und Rundung;
- die vollständige gedigestete Fontmenge;
- sichere Behandlung oder Ablehnung externer Ressourcen, Skripte und
  nichtdeterministischer SVG-Eigenschaften;
- die Größen 16, 24, 32, 48, 64, 128, 256, 512, 2048 und 4096 px.

Es gibt keine zusätzliche geometrische Registrierung, Bounds-Ausrichtung oder
„hilfreiche“ Translation; erlaubt ist ausschließlich die definierte
ViewBox-zu-Viewport-Abbildung des gepinnten Renderers. Nichtquadratische
ViewBoxes erhalten deshalb exakt die vom Renderer abgeleitete Höhe. Vor dem
Vergleich werden bei vollständig transparenten Pixeln die RGB-Kanäle auf null
normalisiert. Danach werden die RGBA-Puffer direkt verglichen. Zusätzlich wird
jede Darstellung deterministisch auf schwarzem und weißem Hintergrund
komponiert und erneut auf Null-Diff geprüft.

Für jedes verpflichtende `(Case, Rendergröße, Hintergrund)` muss gelten:

```text
differentPixelCount == 0
maxChannelDelta     == 0
alphaDeltaCount     == 0
referenceBounds     == implementationBounds
```

Ein PNG-Hash ist als Diagnosewert erlaubt, aber kein primäres Gate, weil
Metadaten und Kompression den Bytewert ändern können. Das Gate vergleicht die
dekodierten RGBA-Puffer. Kontaktbogen, Überlagerung und Heatmap entstehen nur
lokal als reproduzierbare Fehlerdiagnose. Ihr Inhalt wird nicht in Git
gespeichert.

Jede Maske wird gegen dieselbe kanonische Fläche gerastert wie der ganze Case.
Eine Maskenänderung ist eine Änderung des Vergleichsvertrags und invalidiert
alle betroffenen Freigaben. Für jede der 661 `ExactAssetFixture`s ist ein
unmaskierter Ganzzeichenvergleich verpflichtend. Bei Displays ist
`comparisonMode` bindend: die 525 Whole-Displays prüfen das vollständige
Zeichen, die 19 Part-Displays ausschließlich den festgelegten `OraclePart`.
Die beiden Mengen müssen disjunkt und vollständig sein. Ein Teilvergleich darf
nicht durch einen Ganzzeichenvergleich ersetzt werden und umgekehrt.

Vor dem Rastervergleich werden Orakel und Kandidat außerdem nach
`NormalizedPaintList/v1` normalisiert und verglichen: ViewBox,
Paint-Reihenfolge, berechnete Farben, Compound-Path-Reihenfolge, Fill-Rule und
Transformationen müssen exakt gleich sein. Whole-Cases vergleichen die ganze
Liste, Part-Cases die durch ihren `OraclePart` belegten Records. Diese
Vektorinvariante verhindert, dass unterschiedliche Geometrie nur zufällig an
den gewählten Rastergrößen dieselben Pixel trifft.

## 6. Integration in Library, Baukasten und Ausgabekanäle

`ReferenceExactIR` bleibt eine eigene verlustfreie Paint-Schicht neben der
bisherigen semantischen Millimeter-IR. Das Schema exportiert einen
diskriminierten Typ
`RenderableDrawing = Drawing | ReferenceExactDrawing | LayeredDrawing`.
`LayeredDrawing` besitzt eine gemeinsame Exact-ViewBox und eine geordnete
Layerliste. Ein `exact-paint`-Layer enthält ausschließlich
`ReferenceExactDrawing`; ein `generated-overlay`-Layer enthält ausschließlich
generierte Semantik und muss als `claim: 'not-reference-identical'` markiert
sein. Die ViewBox jedes Exact-Layers muss der gemeinsamen ViewBox exakt
entsprechen. `renderSvg`, die deterministische Rasterausgabe und alle Katalogkanäle
nehmen `RenderableDrawing` entgegen. Der Exact-Zweig serialisiert native
Referenzeinheiten direkt; er darf keinen bisherigen Millimeterformatter oder
Textrenderer durchlaufen.

Der Katalog stellt mindestens diese stabilen Zugänge bereit:

```ts
interface ReferenceExactFragment {
  readonly key: ReferenceExactFragmentKey;
  readonly localFrame: ExactViewBox;
  readonly nodes: readonly ReferenceExactNode[];
}

interface ExactComponentVariant {
  readonly key: ExactComponentVariantKey;
  readonly component: ComponentKey;
  readonly context: ComponentContextKey;
  readonly fragment: ReferenceExactFragmentKey;
}

interface LayeredDrawing {
  readonly kind: 'layered';
  readonly viewBox: ExactViewBox;
  readonly layers: readonly (
    | {
        readonly kind: 'exact-paint';
        readonly drawing: ReferenceExactDrawing;
        readonly claim: 'exact-reference-parity';
      }
    | {
        readonly kind: 'generated-overlay';
        readonly purpose: 'designation';
        readonly drawing: Drawing;
        readonly overlayToExact: ExactTransformSequence;
        readonly claim: 'not-reference-identical';
      }
  )[];
}

interface ExactCompositionResult<
  D extends ReferenceExactDrawing | LayeredDrawing =
    | ReferenceExactDrawing
    | LayeredDrawing,
> {
  readonly drawing: D;
  readonly trace: CompositionTrace;
}

exactAsset(key: ExactAssetKey): ReferenceExactDrawing;
exactAssetResult(
  key: ExactAssetKey,
): ExactCompositionResult<ReferenceExactDrawing>;
exactAssetKeys(): readonly ExactAssetKey[];
exactComponent(
  key: ComponentKey,
  context: ComponentContext,
): ReferenceExactDrawing;
exactComponentResult(
  key: ComponentKey,
  context: ComponentContext,
): ExactCompositionResult<ReferenceExactDrawing>;
exactComponentKeys(): readonly ComponentKey[];
exactComponentContextKeys(key: ComponentKey): readonly ComponentContextKey[];
exactComponentFixtureKeys(): readonly ComponentFixtureKey[];
exactComponentFixture(key: ComponentFixtureKey): ReferenceExactDrawing;
exactComponentFixtureResult(
  key: ComponentFixtureKey,
): ExactCompositionResult<ReferenceExactDrawing>;
composeExact(spec: SymbolSpec): ExactCompositionResult;
composeFromCatalog(spec: SymbolSpec): RenderableDrawing;
compositionTraceOf(spec: SymbolSpec): CompositionTrace;
```

`exactAssetResult`, `exactComponentResult`, `exactComponentFixtureResult` und
`composeExact` sind die autoritativen atomaren Zugänge. Die reinen
Drawing-/Trace-Helfer projizieren nur deren Ergebnis und dürfen keine
unabhängige Materialisierung ausführen.

Alle 661 `ExactAssetKey`s sind veröffentlicht und renderbar. Jede
`ExactAssetFixture` besitzt einen einzigen autoritativen `CompositionPlan` aus
geordneten `ExactComponentVariant`-Instanzen, exakten Transformfolgen und
expliziten assetspezifischen Fragmentinstanzen. `exactAsset` liefert einen aus
diesem Plan erzeugten, digestgeprüften Cache; es gibt keine daneben gepflegte
Ganzzeichengeometrie.

Ein bekanntes `SymbolSpec`, das einer Referenz-Ganzzeichnung entspricht, wird
nach der normalen Validierung eindeutig auf die entsprechende
`ExactAssetFixture` geroutet. Auch dieser schnelle Pfad liefert nur die
gecachte Materialisierung desselben Komponentenplans. Die 242 heutigen
Rezept-Specs behalten ihre semantischen Metadaten, tragen aber eine eindeutige
Exact-Asset-Zuordnung.

Freie Baukastenkombinationen werden aus exakten, kontextabhängigen
Component-Fixtures zusammengesetzt. Ein Component darf mehrere belegte
Fassungen für Körperart, Körpervariante, Fahrzeugkategorie, Stärke, Kopf- oder
Labelkontext besitzen. Die Auswahl geschieht über einen kanonischen
Kontextschlüssel; ein unbelegter Kontext erzeugt `NotMeasuredError` und niemals
einen generischen Fallback.

Das freie Feld `designation` wird bei einer freien Builder-Kombination als
einziger zulässiger `generated-overlay` über der exakten Paint-Schicht
ausgegeben. Der Trace weist Layer, Transform und den fehlenden
Originalidentitätsclaim separat aus; dieser Layer erhält keine
Exact-Attestation. Ein bekanntes Exact-Asset und jede
`ExactAssetFixture`/`ComponentFixture` dürfen niemals einen Generated-Overlay
enthalten. Feste Originalbeschriftungen bleiben stattdessen exakte
Pfadkonturen im `exact-paint`-Layer.
`overlayToExact` liegt direkt am Layer und ist die ausführbare Abbildung aus dem
semantischen Drawing-Raum in die gemeinsame Exact-ViewBox. `composeExact`
erzeugt Layer und Transform atomar; der Trace referenziert exakt denselben
immutablen Wert und Digest statt einer zweiten Kopie. Jeder Renderer wendet
dieses Feld an und darf den Transform nicht aus dem Trace oder aus Bounds
rekonstruieren.

`composeExact(spec)` ist der atomare Kern: Er validiert zuerst den `SymbolSpec`,
leitet daraus ausschließlich registrierte `ComponentContextKey`s ab, löst für
jede benötigte Komponente fail-closed genau eine `ExactComponentVariant` auf,
platziert deren `ReferenceExactFragment`s über die registrierten exakten
Transformfolgen in einer gemeinsamen ViewBox und vereinigt die Nodes in der
festgelegten Paint-Reihenfolge. Drawing und vollständiger `CompositionTrace`
werden gemeinsam zurückgegeben oder gemeinsam verworfen. `composeFromCatalog`
und `compositionTraceOf` delegieren an dieses Ergebnis; sie dürfen Drawing und
Trace nicht unabhängig berechnen.

Für freie Kombinationen lautet der Claim
„zusammengesetzt aus referenzidentischen Komponenten“, nicht
„identisch mit einer BABZ-Ganzzeichnung“, sofern kein solches Original
existiert.

Jede `DisplayFixture` referenziert genau einen `ExactAssetFixtureKey`. Bei
`comparisonMode: 'whole'` teilen Display und Exact-Asset denselben normalisierten
Geometry-/Paint-Digest. Bei `comparisonMode: 'part'` ist die abgeleitete
Paint-Liste exakt die im referenzierten `OraclePart` deklarierte, gegatete
Projektion. Eine Display-Fixture darf keine dritte Geometriequelle besitzen.

Website-Snapshot, React/Web Component, SVG-/PNG-Export, Canvas, MapLibre und
QGIS erhalten keine zweite Geometriequelle. Sie konsumieren den gemeinsamen
Katalog und Renderer. Der Snapshot serialisiert den diskriminierten
Drawing-Typ deterministisch. Die Review-Anwendung erhält getrennte Ansichten
für 661 Assets, 544 bestehende Displays und sämtliche Components; die 19
`part`-Elementzeilen vergleichen nur den definierten Originalpart, nicht einen
erfundenen Trägerkörper.

Ein lokales Entwicklerwerkzeug darf den Orakelbestand analysieren und
TypeScript-Kandidaten ausschließlich unter `out/` erzeugen. Es darf weder bei
Build noch Laufzeit erforderlich sein und niemals selbst eine Freigabe setzen.
Aus lokalen Orakeln erzeugte Kandidaten bleiben unveröffentlichte
Arbeitsartefakte. Kein Tool darf Source-Dateien, Approval-Status oder
Attestations automatisch aus dem Orakelbestand überschreiben. Ein explizit
ausgewählter Kandidat darf erst nach fallbezogener Prüfung als strukturierte,
kanonische IR übernommen werden; rohe SVG-XML-Blobs und opaque Pfadstrings sind
auch dann verboten. Jede übernommene IR-Definition erhält einen
nachvollziehbaren Rekonstruktions-, Agentenreview- und Null-Diff-Nachweis.
Original-SVG, XML-Kommentare, lokale Rasterbilder und Diffartefakte bleiben
ausgeschlossen.

## 7. Lokale Orakelgrenze und Rechte

Der Orakelroot liegt lokal unter `taktische-zeichen/` und bleibt gitignored.
Das Conformance-System akzeptiert nur echte SVG-Dateien mit Namen aus dem
committed OracleManifest. Es löst Root und Datei über reale Pfade auf, weist
Symlinks nach außen, Pfadsegmente, externe Ressourcen und nicht erwartete
Dateien ab.

Ein Strict-Lauf benötigt den vollständigen Bestand:

```text
conformance verify --strict --reference-root taktische-zeichen
```

Im Strict-Modus gibt es keinen Filter, keine Teilquote, kein `--update`, kein
`--accept` und kein Snapshot-Neuschreiben. Ein Fehler benennt mindestens Case,
Asset, Rendergröße, Orakel- und Kandidatendigest, Zahl abweichender Pixel sowie
maximale Kanalabweichung.

Fehlt der Root, ein erwartetes Asset oder die erwartete Orakelidentität, endet
der Lauf mit `ORACLE_UNAVAILABLE` oder
`ORACLE_MISMATCH` und einem Fehlerexit. Es gibt keinen Pass mit fehlendem
Original, keine Teilquote und keinen Ersatz durch die eigene Snapshot-Suite.

Öffentliche CI prüft Build, Typen, IR-Determinismus, Registry-Invarianten,
Fixtures, Graphen und Invalidation. Sie darf ohne lokalen Orakelbestand nicht
„Exact Reference Parity passed“ ausgeben. Ein Release benötigt zusätzlich einen
frischen vertrauenswürdigen Strict-Lauf, dessen Orakelset- und Renderer-Digests
mit der Freigabe übereinstimmen.

Ein eigenes Artifact-Leak-Gate untersucht die entpackten `pnpm pack`-Tarballs
aller veröffentlichten Packages sowie Website-, QGIS- und Release-Bundles. Es
schlägt mindestens fehl, wenn eine ausgelieferte Datei denselben SHA-256 wie
eines der 661 Originale besitzt, wenn Referenz-PNGs, Overlays, Heatmaps oder
andere lokale Diffartefakte enthalten sind, wenn Illustrator-/Generator-XML
oder Quellkommentare fortbestehen oder wenn absolute beziehungsweise lokale
Orakelpfade wie `taktische-zeichen/` in Bundles, Sourcemaps oder Metadaten
auftauchen. Zusätzlich weist ein Strukturtest rohe Original-SVG-Dateien und
deren Einbettung als XML-Blob ab. Die veröffentlichte kanonische IR und die
beabsichtigten Asset-Keys sind davon ausdrücklich nicht ausgeschlossen.

Die Veröffentlichung einer exakten Geometrienachbildung ist eine eigene
Rechtsfrage. Vor Release muss die
Nutzungsgrundlage ausdrücklich die Veröffentlichung der Geometry-/Paint-IR,
der eingebetteten Fonts und der möglichen Nähe zur Referenzgestaltung
abdecken. Der technische Nachweis ersetzt diese Freigabe nicht.

## 8. Review, Attestation und Freshness

Ein Conformance-Approval ist keine bloße Statuszeile. Es trägt mindestens:

```ts
interface ConformanceAttestation {
  readonly attestationVersion: string;
  readonly caseKey: string;
  readonly commitDigest: string;
  readonly headCommit: string;
  readonly sourceTreeDigest: string;
  readonly buildInputDigest: string;
  readonly oracleSetDigest: string;
  readonly oracleAssetDigests: readonly string[];
  readonly oracleEvidenceDigest: string;
  readonly oraclePartSetDigest: string;
  readonly oracleOwnershipManifestDigest: string;
  readonly fixtureDigest: string;
  readonly geometryDigest: string;
  readonly compositionTraceDigest: string;
  readonly compositionContractRegistryDigest: string;
  readonly compositionWitnessSetDigest: string;
  readonly normalizedPaintListDigest: string;
  readonly ownedPaintIndexDigest: string;
  readonly rendererContractDigest: string;
  readonly toolchainDigest: string;
  readonly rasterEnvironmentDigest: string;
  readonly fontSetDigest: string;
  readonly comparisonContractVersion: string;
  readonly comparisonContractDigest: string;
  readonly comparisonProfileSetDigest: string;
  readonly maskContractSetDigest: string;
  readonly strictRunId: string;
  readonly strictRunDigest: string;
  readonly resultDigest: string;
  readonly issuer: string;
  readonly trustStoreDigest: string;
  readonly signature: ConformanceSignatureEnvelope;
  readonly provenance: readonly ConformanceProvenanceRecord[];
  readonly reviewer: string;
  readonly reviewedAt: string;
  readonly result: 'approved';
}

interface ConformanceSignatureEnvelope {
  readonly version: 'ConformanceSignature/v1';
  readonly algorithm: 'Ed25519';
  readonly keyId: string;
  readonly payloadEncoding: 'RFC8785-JCS-UTF8';
  readonly signatureBase64Url: string;
}
```

Attestations sind immutable und append-only. Sie liegen als signiertes
Review-/Release-Artefakt außerhalb des von ihnen attestierten Git-Commits; so
entsteht keine selbstreferenzielle Commit-ID. Der technische Schreibweg bleibt
atomar und fail-closed. Eine Approval-Anfrage wird abgewiesen, wenn der Case
keinen aktuellen Strict-Run, einen Nicht-Null-Diff, eine fehlende Part-Maske,
einen unbekannten Component-Key oder eine unregistrierte Reviewidentität hat.
Issuer und Reviewer müssen registriert, `resultDigest` serverseitig neu
berechnet und die Signatur gegen alle Felder verifiziert sein. Signiert werden
die RFC-8785-kanonisierten UTF-8-Bytes des vollständigen
`ConformanceAttestation`-Objekts ohne das Feld `signature`. Der versionierte
`AttestationTrustStore/v1` bindet `keyId`, Issuer, Ed25519-Public-Key,
Gültigkeitszeitraum und Widerrufsstatus; sein Digest steht im Attest.
Schlüsselrotation ergänzt einen neuen Key. Unbekannte, außerhalb ihres
Gültigkeitszeitraums verwendete oder widerrufene Keys sowie ein abweichender
Trust-Store-Digest führen vor Review-Anzeige und Publish fail-closed zum Fehler.

Der Strict-Runner startet ausschließlich aus einem sauberen Checkout des
attestierten `headCommit`. Vor Build und nach dem Lauf muss `git status` frei
von tracked Änderungen und nicht ignorierten untracked Dateien sein;
gitignorierte lokale Orakeldateien bleiben zulässige externe Eingabe. Der
Runner verifiziert `HEAD`, berechnet `sourceTreeDigest` aus dem Git-Tree und
`buildInputDigest` aus sämtlichen tatsächlich gelesenen Source-, Lock-,
Konfigurations- und Toolchain-Eingaben. Jede Abweichung oder nachträgliche
Mutation bricht den Lauf ab. Publish berechnet alle drei Identitäten im
ausgecheckten Zielcommit erneut.

```ts
effectiveConformanceStatus(
  attestation: ConformanceAttestation,
  current: CurrentConformanceDigests,
): 'approved' | 'invalidated';
```

UI, CLI, Build- und Release-Gates verwenden ausschließlich diesen effektiven
Status. `approved` gilt nur, wenn Commit-, HEAD-, Source-Tree-, Build-Input-,
Fixture-, Orakel-, Oracle-Part-,
Oracle-Ownership-, Geometry-, Trace-, Composition-Contract-, Witness-,
Paint-List-, Owned-Paint-Index-, Renderer-, Toolchain-, Rasterumgebungs-, Font-,
Comparison-Profile-, Masken-, Trust-Store-, Vergleichs- und Strict-Run-Digests
exakt dem aktuellen Zustand entsprechen. Diese Felder werden direkt
verglichen; die Graphinvalidierung ist nur eine zusätzliche Abdeckung.

Ändert sich ein Orakelasset, Geometry-Node, Component, Rezept, Trace,
Renderer, Font, Maskenvertrag, Schwelle oder die festgelegte Rasterumgebung,
liefert `effectiveConformanceStatus` für alle im Abhängigkeitsgraphen rückwärts
erreichbaren Attestations unmittelbar `invalidated`, ohne die historischen
Records umzuschreiben. Die Invalidation ist transitiv: Eine Body-Mark- oder
Fontänderung invalidiert nicht nur ihre isolierte Fixture, sondern jedes
Display, jeden Part und jedes Asset, das sie verwendet. Eine invalide Approval
wird niemals automatisch übertragen.

Domain-Review und Conformance-Review bleiben getrennt. Fachliche Zustimmung
kann ohne lokalen Orakelbestand stattfinden; ein Exact-Parity-Approval kann es
nicht. Beide müssen für einen Full-Release vollständig und frisch sein.

## 9. TDD- und Batch-Gates

Die Umsetzung beginnt mit testbaren reinen Kernen, bevor Renderer oder
Reviewoberfläche angeschlossen werden:

1. Schema: Case-IDs, Statusautomat, Attestation und Digestvergleich.
2. IR: adversariale Pfad-, Farb-, Transformations- und
   `NormalizedPaintList/v1`-Fixtures, insbesondere nicht gefaltete Rotationen.
3. Inventory: Mengen-, Mengenunions- und Eindeutigkeitsprüfungen über kleine
   adversariale Fixtures.
4. Graph: vollständige Use-/Witness-Edges, OracleOwnership, Contract-Cases,
   Leaf-Eigentümerschaft und transitive Invalidation.
5. Raster: feste RGBA-Fixtures, Part-Frames, Isolation, Masken und
   Null-Diff-/Fehlerdiagnosen.
6. Composition: eindeutige Kontextauflösung, atomare Drawing-/Trace-Erzeugung
   sowie Layered-Designation ohne Exact-Claim.
7. CLI: Strict-Fehler bei fehlendem Orakel, fehlenden Assets und nichtfrischen
   Attestations.
8. Packaging: adversariale Tarballs und Bundles für jedes Artifact-Leak-Muster.
9. Review: Save-Sperre bei jedem unvollständigen oder veralteten Nachweis.

Visual-Batches werden aus zusammenhängenden Komponenten des Graphen
`Component -> Fixture -> Asset -> Part` gebildet, nicht nur nach Kapitelnummer.
Ein Asset gehört genau einem Batch; ein Display darf einen zuvor akzeptierten
Component-Batch nur lesen. Große Komponenten werden über gemeinsame
Component-/Part-Vorbedingungen geteilt, nie durch doppelte Assetbesitzerschaft.

Die physische Parallelisierungsgrenze ist `ExactBatchModule`. Jeder kleine
Worker-Scope besitzt exklusiv genau ein Verzeichnis
`packages/catalog/src/exact/batches/<batch-id>/` mit den festen Shards
`manifest.ts`, `components.ts`, `assets.ts`, `parts.ts`, `plans.ts` und
`cases.test.ts`; leere Shards exportieren explizit leere Mengen. Das
Batchmanifest nennt die vollständig besessenen Asset-, ComponentFixture-,
OraclePart-, CompositionContractCase-, Witness-, Plan-, Display- und Case-Keys.
Ein normaler Symbolbatch umfasst
höchstens eine eng zusammengehörige Komponentenfamilie und höchstens zwölf
Ganzzeichen; komplexe Übersichten erhalten einen eigenen Batch.

Nur der Root-Integrator besitzt den zentralen Aggregator
`packages/catalog/src/exact/batches/index.ts`. Er importiert Batch-Exports,
sortiert sie kanonisch und lässt doppelte oder fehlende Schlüssel hart
scheitern. Worker verändern weder den Aggregator noch fremde Shards. Eine
Batchkante darf nur an einer bereits frisch geprüften Component-Fixture
geschnitten werden; gemeinsame Grundkörper sind danach read-only. Dadurch
können Asset-/Part-/Plan-Shards parallel entstehen, ohne zentrale
Konfliktdateien oder doppelte Geometriequellen.

Die Batchreihenfolge ist:

1. Conformance-Schema, Registry, Graph und RGBA-Kern;
2. Grundkörper, Profile, Farben, Stärken, Köpfe und Fahrwerke;
3. Piktogrammfamilien und isolierte Component-Fixtures;
4. Rezepte und Display-Fixtures nach Graphkomponenten;
5. Beispiele, Übersichten, Farbfelder und sonstige bisher nicht beanspruchte
   Assets;
6. vollständiger 661-Asset-Strict-Run und unabhängiger Review.

Jeder Batch besteht nur, wenn seine Selektionsmenge exakt ist, sämtliche
Komponenten und Edges auflösbar sind, alle betroffenen Whole- und Part-Diffs
null sind und keine eigene oder geerbte Attestation invalidiert ist.

Jeder Implementierungsbatch besitzt genau einen schreibenden Worker-Agenten
mit exklusiver Dateiverantwortung. Danach prüfen zwei andere Agents getrennt
die Spezifikationstreue und die technische beziehungsweise visuelle Qualität.
Der Root-Agent integriert erst, wenn beide Reviews abgearbeitet und die
Batch-Gates frisch grün sind. Kein Implementierungs-Agent darf die eigene
Conformance-Attestation erteilen. Die abschließende Gesamtabnahme prüft erneut
alle Assets, Displays und Components statt nur die geänderte Teilmenge.

Die visuelle Agentenprüfung verwendet keine Stichproben. Jeder einzelne
Asset-, Display- und Component-Case wird mit eindeutigem Case-Key in Original,
Kandidat, Overlay und bei Bedarf Heatmap betrachtet und mit einem individuellen
Befund protokolliert. Kontaktbögen dürfen die Sichtung beschleunigen, ersetzen
aber weder die Einzelfalladressierung noch das maschinelle Null-Diff-Gate.

## 10. Claim-Grenzen

„Pixelidentisch“ gilt ausschließlich für den festgeschriebenen
Reference-Renderer und die definierte Größenmatrix. Inline-SVG im Browser darf
bei gleicher normalisierter Paint-Liste als vektoriell äquivalent bezeichnet
werden, nicht als browserübergreifend bitidentisch. Canvas `Path2D`,
Browser-Antialiasing, Betriebssystem, Grafikbackend und Device Pixel Ratio
verhindern einen allgemeinen Pixelclaim für Canvas und MapLibre.

Browser-Screenshot-Tests für festgelegte Chromium-, Firefox- und
WebKit-Versionen sind zusätzliche Kompatibilitätsgates. Ihre notwendigen
Toleranzen dürfen den Null-Diff-Referenzvertrag nicht ersetzen oder
verwässern. Jede Exportart dokumentiert, ob sie Exact-Paint-Parity,
kanonische RGBA-Parity oder nur plattformspezifische Kompatibilität belegt.

## 11. Technische Abnahme und öffentliche Freigabe

### 11.1 Technische Definition of Done

Die Implementierung ist technisch vollständig, wenn gleichzeitig alle
folgenden Kriterien erfüllt sind:

- 661 von 661 OracleAssets sind lokal vorhanden und gegen den eingefrorenen
  Bestand identifiziert;
- 661 von 661 ExactAssetFixtures, 544 von 544 Display-Fixtures und alle
  Component-Fixtures sind gebaut und über die Library renderbar;
- alle 413 PaintComponent-Keys und jeder gültige registrierte Kontext besitzen
  eine eindeutige, geprüfte Component-Fixture;
- registrierte und aus allen heute validen `SymbolSpec`s erreichbare
  Component-Kontexte sind mengengleich; kein erreichbarer Spec-Kontext endet
  mit `NotMeasuredError`;
- die 544 Displays sind vollständig und disjunkt in 525 Whole- und 19
  Part-Cases eingeordnet und mit genau einem Exact-Asset verknüpft;
- jeder Whole- und Part-Vergleich an jeder verpflichtenden Rastergröße hat
  RGBA-Null-Diff;
- jede normalisierte Paint-Liste ist exakt gleich;
- alle Mengen-, Registry-, Graph-, CompositionTrace- und No-Skip-Gates sind
  bestanden;
- es gibt keine offenen, fehlenden, `unresolved`, `deviation`, `failed` oder
  `invalidated` Conformance-Cases;
- jede Attestation ist frisch zum aktuellen Orakel-, Geometry-, Trace-,
  Oracle-Part-, Oracle-Ownership-, Composition-Contract-, Witness-, Paint-List-,
  Owned-Paint-Index-, Renderer-, Toolchain-, Rasterumgebungs-, Font-, Masken-,
  Comparison-Profile-, Trust-Store-, Commit-, HEAD-, Source-Tree-, Build-Input-
  und Vergleichsvertragsdigest;
- alle Package-, Website-, QGIS- und Release-Artefakte bestehen das
  Artifact-Leak-Gate;
- technische Agentenreviews sowie die protokollierte visuelle
  Einzelfallsichtung jedes Asset-, Display- und Component-Cases sind
  abgeschlossen.

Der technische Abschluss erzeugt ein signiertes Attest mit Commit-, Fixture-,
HEAD-, Source-Tree-, Build-Input-, Orakelset-, Oracle-Part-, Oracle-Ownership-,
Geometry-, Trace-,
Composition-Contract-, Witness-, Paint-List-, Owned-Paint-Index-, Toolchain-,
Rasterumgebungs-, Renderer-, Font-, Masken-, Comparison-Profile-, Trust-Store-,
Strict-Run- und Gesamtergebnisdigest. Das Attest enthält keine Originalgrafik
und ist nur für exakt diesen Commit und Orakelstand gültig.

### 11.2 Zusätzliche öffentliche Freigabe

Eine Veröffentlichung oder ein Release mit Exact-Reference-Claim verlangt
zusätzlich frische fachliche/Domain-Reviews und eine dokumentierte
Nutzungsgrundlage für die veröffentlichte IR und etwaige Fonts. Diese
zusätzlichen Freigaben sind kein Vorwand, technische Abweichungen offen zu
lassen: Die Library kann technisch vollständig umgesetzt und lokal abgenommen
werden, bevor über ihre öffentliche Verteilung entschieden wird.

Ein grüner Build ohne Orakel, ein visueller Kontaktbogen, eine toleranzbasierte
Metrik oder eine alte Approval genügt für keine dieser Aussagen.
