# Einsatzzeichen — Slice 3: Piktogramme und Katalogausbau

> Design-Spec · 5. August 2026 · Status: freigegeben

## 1. Zweck und Abgrenzung

Diese Spec deckt **Teilprojekt D** der Projektzerlegung ab (Slice-1-Spec, Abschnitt 1:
„Katalogausbau über alle Kapitel und Anhänge"). Sie beantwortet die Frage, die Slice 1 in
Abschnitt 13 als „das eigentliche Gate für Release 1.0" offengelassen hat: **wie die Piktogramme
der Fachanhänge entstehen.**

Die Antwort ist nicht „jemand zeichnet sie". Sie ist: **Piktogramme sind Code.** Ein Piktogramm ist
eine handgeschriebene Folge von Pfadkommandos in Millimetern mit deklarierter Hüllbox — autoriert
im Editor, versioniert wie jede andere Quelldatei, geprüft von Gates. Kein Grafikprogramm, kein
Vektorimport, keine Datei pro Zeichen.

**Ziel des Slice:** Der Kompositionsmotor kann Pfad-Piktogramme platzieren, ein Piktogramm hat eine
stabile Identität und ein Gate, und die Zerlegung des Restbestands in liefer­bare Unter-Slices
steht fest — belegt an einer Gruppe echter Piktogramme, nicht behauptet.

**Nicht Teil dieses Slice:** der vollständige Bestand. Diese Spec baut den Mechanismus und
spezifiziert die Reihenfolge; Abschnitt 10 zerlegt den Inhalt, Abschnitt 12 grenzt vollständig ab.

### Verhältnis zur Projektzerlegung

Die Entscheidungsnotiz vom 5. August 2026 ordnet vor „Inhalt" die **Gate-Härtung** ein
(Mehrgrößen-Regression, Druckprofil, Clipping- und viewBox-Prüfung, A11y-Kontrast). Diese
Reihenfolge wird hier nicht umgekehrt, sondern **teilweise eingelöst**: Abschnitt 7 zieht genau
das Clipping-Gate vor, weil es an Pfad-Piktogrammen hängt und ohne es die erste Kurve unbemerkt
über den Körperrand laufen kann. Die übrigen vier Gate-Lücken bleiben offen und behalten ihren
Platz vor dem Massenausbau (Abschnitt 10, Reihenfolgeregel).

Die zweite Vorbedingung der Notiz — „wer zeichnet die über 400 Piktogramme" — beantwortet
Abschnitt 4. Die Zahl selbst korrigiert Abschnitt 3.

## 2. Ausgangslage im Code

Alle Aussagen sind am 5. August 2026 am Code verifiziert. Vokabular wie in den beiden
vorangehenden Notizen: **Typ existiert / Konsument existiert / Gate existiert** sind drei
verschiedene Befunde.

| Befund | Stelle |
|---|---|
| `shiftY` **wirft** für `type: 'path'` — bedingungslos, auch bei Delta 0 | `packages/core/src/bounds.ts:166-171` |
| `compose` bildet `shiftY` über **jedes** Piktogramm-Primitiv ab | `packages/core/src/compose.ts:94-96` |
| `boundsOfMm` liefert für `path` `undefined` → `EMPTY_BOUNDS` | `packages/core/src/bounds.ts:99-101, 127-129` |
| `Transform` kennt ausschließlich `rotate`, keine Verschiebung | `packages/schema/src/geometry.ts:46-48` |
| `CapabilityId` ist eine **Ein-Wert-Union** | `packages/schema/src/taxonomy.ts:51` |
| Das einzige Piktogramm sind drei `line`-Primitive, keine Pfade | `packages/catalog/src/capabilities.ts:19` |
| `capabilityPictogram` ist der einzige Piktogramm-Port; er kennt keine Hüllbox | `packages/core/src/compose.ts:28` |
| Der SVG-Renderer unterstützt `path` vollständig, inklusive Millimeter-Skalierung | `packages/core/src/render/svg.ts:95-118` |
| `role: 'pictogram'` ist deklariert und wird gesetzt, aber von keinem Gate gelesen | `geometry.ts:51`, `capabilities.ts:11` |
| `parseRectilinearPath` liegt in `cli` und behandelt nur achsparallele Pfade — für Kurven ungeeignet | `packages/cli/src/scan/path-geometry.ts:96` |

### Der blockierende Befund

**Das erste Pfad-Piktogramm lässt `compose()` fehlschlagen.** Nicht falsch rendern — abbrechen.
Dass heute nichts bricht, hängt allein daran, dass `capability.fire-fighting` aus drei Linien
besteht, die `shiftY` verschieben kann.

Das ist kein Fehler, sondern eine bewusste Entscheidung aus Commit `80da41f`: ein still nicht
verschobenes Pfad-Primitiv wäre schwerer zu bemerken als ein Fehler. Die Entscheidung bleibt
richtig; sie verlangt nur, dass die Platzierung von Pfaden **anders gelöst wird als durch
Koordinatenumschreibung**. Abschnitt 5 löst das.

Zweiter Befund derselben Wurzel: Weil `boundsOfMm` für Pfade keine Hülle liefert, kann die
Platzierung eines Pfad-Piktogramms auch nicht aus seiner Geometrie berechnet werden. Die Hülle
muss **deklariert** werden.

## 3. Der Bestand: gemessen, nicht geschätzt

Slice 1, Abschnitt 13 nennt „über 400 Piktogramme". Diese Zahl ist eine Schätzung und zu hoch,
weil sie Kompositionen mitzählt. Gemessen am lokalen Referenzbestand:

**661 Dateien → 616 distinkte Abschnittsnummern** (Differenz: `_Alternative`- und `_2`-Varianten,
Slice-1-Spec Abschnitt 6).

| Bereich | Distinkte Abschnitte | Charakter |
|---|---|---|
| Kapitel 1 | 14 | Grundzeichen — Slice 1: 8 umgesetzt |
| Kapitel 2 | 20 | Organisationen, Farben — Slice 1: 7 Farben |
| Kapitel 3 | 7 | Ergänzungseigenschaften — **kein Owner**, Non-Scope (Abschnitt 12) |
| Kapitel 4 | 88 | **Fähigkeiten = Piktogramme** |
| Kapitel 5.1–5.7 | 42 | Fahrzeug, Stärke, Verwaltung, Zeit — Kopfmarken und Angaben, keine Piktogramme |
| Kapitel 5.8 | 63 | **Zustände, Tendenzen, Gefahren, Wetter, Personen = Piktogramme** |
| Anhänge C, D, E, F, G, H, I | 281 | überwiegend **Kompositionen** aus Kapitel 1–5 |
| Anhang J | 50 | **IuK = Piktogramme** |
| Anhänge K, L, M, N | 51 | **Bauwerksschäden, Deichverteidigung, Vegetationsbrand, Spontanhelfer = Piktogramme** |

Die Spalte summiert sich auf 616 — die Zerlegung ist vollständig und doppelt keine Datei.

Die Piktogrammträger sind damit Kapitel 4, Kapitel 5.8 und die Anhänge J–N: **250 Abschnitte**
(bei 5.8 abzüglich der zwei Sammeleinträge `5.8.1_Beispiel` und `5.8.7_Beispiel`: 61 statt 63).

**Für die Anhänge C–I wird hier nicht behauptet, dass sie ausschließlich Kompositionen sind.**
Belegt ist, dass ihre Zeichen die Piktogramme aus Kapitel 4/5.8 verwenden — `C.1.1_Löschstaffel`
ist in Slice 1 genau so erzeugt worden. Ob ein einzelner Anhangseintrag ein *zusätzliches*
Piktogramm braucht, entscheidet sich beim Bau. Genau deshalb kommen die Piktogramme **vor** den
Anhängen (Abschnitt 10).

### Was der Upstream `phjardas/taktische-zeichen` davon deckt

Gezählt wurde namentlich: 42 `FachaufgabeId` + 89 `SymbolId` gegen die 250 Abschnittsnummern.
„Eindeutig" heißt: für diesen Abschnitt existiert dort eine benannte Bildidee. „Teilweise" heißt:
es existiert eine Bildidee für den Oberbegriff, aber nicht für die Unterscheidung, die die
2025er Fassung trifft.

| Bereich | Abschnitte | eindeutig | teilweise | ohne Pendant |
|---|---|---|---|---|
| Kapitel 4 | 88 | 41 | 10 | 37 |
| Kapitel 5.8 | 61 | 26 | 2 | 33 |
| Anhang J | 50 | 8 | 0 | 42 |
| Anhänge K, L, M, N | 51 | 0 | 0 | 51 |
| **Summe** | **250** | **75** | **12** | **163** |

Die 41 eindeutigen Zuordnungen in Kapitel 4:

| Abschnitt | Upstream-ID | Abschnitt | Upstream-ID |
|---|---|---|---|
| 4.1.1 | `abc` | 4.7.3 | `beleuchtung` |
| 4.1.2 | `messen` | 4.7.6 | `entschaerfen`, `sprengmittel` |
| 4.1.3 | `dekontamination` | 4.7.10 | `heben`, `hebegeraet` |
| 4.1.4 | `umweltschaeden-gewaesser` | 4.7.14 | `pumpen`, `pumpe` |
| 4.2.1 | `betreuung` | 4.7.15 | `raeumen`, `raeumgeraet` |
| 4.2.3 | `seelsorge` | 4.7.17 | `sprengen`, `sprengung` |
| 4.3.1 | `brandbekaempfung` *(umgesetzt)* | 4.7.18 | `technische-hilfeleistung` |
| 4.3.2 | `brauchwasser` | 4.7.19 | `transport` |
| 4.4.1 | `erkundung` | 4.7.23 | `warnung` |
| 4.4.2 | `rettungshunde`, `hund` | 4.7.24 | `lautsprecher` |
| 4.5.1 | `bergung` | 4.7.25 | `sirene` |
| 4.5.3 | `drehleiter` | 4.7.26 | `wasserversorgung` |
| 4.5.5 | `wasserfahrzeuge` | 4.8.2 | `verbrauchsgueter` |
| 4.5.8 | `wasserrettung`, `wasser` | 4.8.3 | `bruecke` |
| 4.6.1 | `rettungswesen` | 4.8.6 | `instandhaltung` |
| 4.6.4 | `aerztliche-versorgung` | 4.8.11 | `elektrizitaet` |
| 4.6.6 | `krankenhaus` | 4.8.12 | `trinkwasser` |
| 4.7.1 | `abwehr-wassergefahren` | 4.8.13 | `verpflegung` |
| 4.7.2 | `bagger` | 4.8.15 | `zelt` |
| | | 4.9.1 | `iuk` |
| | | 4.10.1 | `veterinaerwesen` |
| | | 4.10.2 | `schlachten` |

In Kapitel 5.8 deckt der Upstream vollständig: `5.8.2.x` Ausfallgrade (4/4), `5.8.3.x` Tendenzen
(3/3), `5.8.4.x` Schadensgrade (3/3), `5.8.5.x` Brandphasen (3/3), `5.8.1.13`/`5.8.1.14`
Vermutung und akute Situation (2/2). Gar nicht gedeckt: die zehn Wetterzeichen `5.8.7.x`, die
vier Einsatztaktik-Pfeile `5.8.1.1`–`5.8.1.4` und die acht Gefahrenzeichen `5.8.1.5`–`5.8.1.12`.

**Die belastbare Aussage lautet damit: für 30 % der Piktogramme existiert eine benannte Bildidee
im Upstream, für 65 % nicht.** Die 163 ohne Pendant sind kein Upstream-Defizit — Anhänge K bis N
(Trümmerkegel, Deichbruch, Wipfelfeuer, Spontanhelfer) und die TETRA-orientierten J.3/J.4-Zeichen
(DMO, TMO, SDS, Gateway, Router, Firewall) existieren in der 2010er-Systematik nicht, auf der
der Upstream beruht.

## 4. Was von `phjardas/taktische-zeichen` übernommen wird

**Übernommen wird die Methode, nicht die Geometrie.**

Der Upstream kodiert jedes Piktogramm als handgeschriebenen Pfad mit deklarierter Größe und
platziert es über eine generische Einpasslogik — `drehleiter` ist
`{ size: [35, 35], render: svg => svg.path("M1,34 L24,11 H34 V1 H24 V11") }`
(`packages/core/src/symbole.ts`). Kein Vektorimport, keine Datei pro Zeichen, kein
Grafikprogramm. **Das ist die Antwort auf „wer zeichnet die Piktogramme": niemand zeichnet sie,
sie werden geschrieben.** Ein Piktogramm dieser Art ist in Minuten autoriert und in einem Diff
lesbar.

Die Pfaddaten selbst werden **nicht** übernommen. Drei Gründe, jeder allein hinreichend:

1. **Anderes Koordinatensystem.** Der Upstream rechnet in Pixeln auf zeichenspezifischen Boxen
   (`[35, 35]`, `[74, 45]`, `[16, 17]`). `einsatzzeichen` autoriert in Millimetern auf 32 × 32 mm
   mit 0,5 mm Strich (Slice-1-Spec, Abschnitt 5). Eine Übernahme wäre eine Umskalierung jeder
   Koordinate — genau die Arbeit, die das Neuschreiben ohnehin ausmacht. Der Wert liegt in der
   Bildidee, nicht in den Zahlen.
2. **Andere Baseline.** Der Upstream rekonstruiert die SKK-/DV-102-Systematik von 2010/2011. Die
   für das Projekt festgelegte Coverage-Baseline ist der lokal archivierte BBK/BABZ-Arbeitsstand
   (`Vision.md`, Referenzhierarchie 1); das behauptet keine amtliche Geltung. Wo die Bildidee sich
   geändert hat, wäre eine übernommene Geometrie eine belegte Falschaussage.
3. **Stilbruch.** Slice-1-Spec Abschnitt 9 verlangt für Kapitel 4/5 und die Anhänge einen
   „konsistenten hauseigenen Stil". Ein Bestand, der teils übernommen und teils eigen ist, hat
   zwei Stile. Der Upstream verwendet zudem durchgängig relative Pfadkommandos und
   Ellipsenbögen — beides schließt Abschnitt 5 aus, weil das Box-Gate sie nicht prüfen kann.

**Die Lizenzlage ist geklärt und wird trotzdem nicht ausgenutzt.** `LICENSE` und
`packages/core/LICENSE` des Upstream tragen beide den MIT-Text; das README weist das Projekt
ausdrücklich als MIT aus. Eine Übernahme wäre also zulässig — im Unterschied zur BABZ-Lage, die
`unclear` bleibt (Slice-2-Spec, Abschnitt 3). Sie unterbleibt aus den drei fachlichen Gründen
oben, nicht aus rechtlicher Vorsicht. **Bemerkt und dokumentiert:** die Copyright-Zeile des
Upstream lautet „Copyright 2022" ohne Rechteinhaber. Wäre je etwas zu attribuieren, müsste die
Attribution auf das Repository lauten, nicht auf einen im Lizenztext genannten Namen.

Der Upstream wird damit **eine registrierte Vergleichsquelle** (Abschnitt 9) — die erste, und
damit der Konsument, auf den Slice 2 den Wert `'compared-only'` bewusst hat warten lassen.

## 5. Piktogramm-IR: deklarierte Box, Platzierung per Transform

### Entscheidung: eine Gruppe mit Verschiebung, kein Umschreiben von Koordinaten

`compose` verschiebt Piktogramme heute primitivweise (`shiftY` je Primitiv), was für Pfade
unmöglich ist (Abschnitt 2). Stattdessen umschließt `compose` **alle** Piktogramm-Primitive mit
genau einer Gruppe, die die Verschiebung als Transformation trägt:

```ts
export interface Translation {
  dxMm: Length;
  dyMm: Length;
}

export interface Transform {
  rotate?: Rotation;
  translate?: Translation;
}
```

```ts
// in compose(), an der Stelle der heutigen shiftY-Abbildung
const primitives = (spec.capabilities ?? []).flatMap((id) => catalog.pictogram(id).primitives);
const pictograms: Primitive[] =
  primitives.length > 0
    ? [{ type: 'group', role: 'pictogram',
         transform: { translate: { dxMm: 0, dyMm: pictogramShiftMm } },
         children: primitives }]
    : [];
```

**`shiftY` bleibt unverändert** und wirft weiterhin für Pfade. Das ist Absicht: die Funktion wird
für Piktogramme nicht mehr aufgerufen, behält aber ihren Schutz für die Körperplatzierung
(`layout/profiles.ts`), wo sie auf vermessene Nicht-Pfad-Geometrie wirkt. Der Commit `80da41f`
wird nicht zurückgenommen.

**Warum nicht `translate` an jedem Primitiv, sondern nur an der Gruppe:** Eine Verschiebung an
einem Primitiv, das zugleich `rotate` trägt, hat dasselbe Problem wie `shiftY` — sie träfe die
Koordinate, nicht das Rotationszentrum. Auf der Gruppe wirkt sie nach außen auf das fertige
Ergebnis und ist damit von der Drehung der Kinder unabhängig.

### Die drei Stellen, die `translate` kennen müssen

Ein Transform, den nur ein Renderer versteht, erzeugt aus derselben IR zwei verschiedene Bilder —
der Fehlermodus, den `render/svg.ts:41-48` für den `fill`-Default ausdrücklich benennt. `translate`
landet deshalb in beiden Renderern und in der Hüllberechnung:

| Stelle | Änderung |
|---|---|
| `render/svg.ts`, `transformAttr` | `translate(u(dx) u(dy))` — in SVG-Einheiten, **links** von einem etwaigen `rotate` |
| `render/canvas.ts`, `drawPrimitive` | `ctx.translate(...)` innerhalb des bestehenden `save`/`restore`-Paars (`canvas.ts:54, 67`) |
| `bounds.ts`, `rawBoundsOfMm` | Gruppe mit `translate`: Kinderhülle um `dxMm`/`dyMm` verschieben |

`pathTransformAttr` (`svg.ts:95-100`) wird **nicht** angefasst. Die Translation sitzt auf der
`<g>` in Einheiten, die `scale(...)` bleibt am `<path>` und wirkt weiterhin zuerst auf die
Millimeterkoordinaten — die Verschachtelung `<g transform="translate(…)"><path transform="scale(…)"/></g>`
hält die beiden Umrechnungen auseinander, statt sie in einem Attribut zu mischen. Genau deshalb
trägt die Gruppe die Verschiebung und nicht der Pfad.

Für `rotate` auf Gruppen bleibt es beim heutigen expliziten Fehler (`bounds.ts:104-110`): kein
belegter Fall. `translate` auf Gruppen ist ab diesem Slice einer.

### Die Piktogramm-Definition

```ts
export interface PictogramBox {
  /** Linke obere Ecke und Maße der zugesicherten Hülle, in Millimetern. */
  xMm: Length;
  yMm: Length;
  widthMm: Length;
  heightMm: Length;
}

export interface PictogramDefinition {
  id: string;                              // "capability.fire-fighting"
  title: string;
  /** Zugesicherte Hülle. Nötig, weil boundsOfMm für Pfade nichts liefert. */
  box: PictogramBox;
  primitives: readonly Primitive[];
}
```

Die Box ist eine **Zusicherung des Autors**, keine berechnete Größe — und genau darum
prüfbedürftig. Abschnitt 7 gibt ihr ein Gate.

Der Katalog-Port wächst entsprechend:

```ts
// statt capabilityPictogram(id: CapabilityId): Primitive[]
pictogram(id: PictogramId): PictogramDefinition;
```

Der bestehende Aufruf in `compose` liest `.primitives`; die Box trägt das Gate. Damit hat die
Struktur von Beginn an zwei Konsumenten und ist kein vorbereitetes Feld.

### Autorenkonvention

Verbindlich für jeden Piktogramm-`d`-String, alle drei Regeln vom Gate erzwungen:

1. **Nur absolute Kommandos.** Relative Kommandos machen die Koordinaten im `d`-String zu Deltas
   und das Box-Gate aus Abschnitt 7 unmöglich.
2. **Nur die sieben Kommandos `M L H V C Q Z`.** Diese Beschränkung ist nicht stilistisch, sondern
   die Voraussetzung dafür, dass das Box-Gate beweisbar korrekt ist:
   - **`A` (Ellipsenbogen) ist ausgeschlossen.** Seine Parameter sind keine Koordinaten
     (`A rx ry rotation large-arc sweep x y`) — ein Schalter `0`/`1` besteht jede Box, eine Drehung
     `45` liest sich als 45 mm, und der Bogen kann weit außerhalb der geschriebenen Zahlen
     ausschlagen. Für Bogenformen gilt: wo die Form es zulässt, das `circle`-Primitiv verwenden —
     es hat eine echte, berechenbare Hülle; sonst `C` oder `Q`.
   - **`S` und `T` sind ausgeschlossen.** Ihr erster Kontrollpunkt ist implizit (Spiegelung des
     vorigen) und steht nicht im `d`-String. Die Kurve wölbt sich zu einem Punkt hin, den das Gate
     nicht sehen kann.
3. **Koordinaten in Millimetern**, wie im übrigen IR. Der Renderer skaliert (`svg.ts:81-100`).

## 6. Identität: ein Namensschema für fünf Piktogrammarten

Slice 2 führt Element-IDs mit den Präfixen `organization.`, `strength.` und `capability.` ein.
`capability.` trägt Kapitel 4. Die übrigen Piktogrammträger sind fachlich keine Fähigkeiten — ein
Wetterzeichen oder ein Trümmerkegel ist keine Fähigkeit einer Einheit, und sie unter
`capability.` zu führen wäre eine Falschaussage in der ID.

| Präfix | Bereich | Abschnitte | Beispiel |
|---|---|---|---|
| `capability.` | Kapitel 4 | 88 | `capability.lifting` (4.7.10) |
| `state.` | Kapitel 5.8 | 61 | `state.tendency-rising` (5.8.3.1) |
| `comms.` | Anhang J | 50 | `comms.voice-radio-dmo` (J.1.3) |
| `damage.` | Anhänge K, L | 28 | `damage.dyke-breach` (L.9) |
| `wildfire.` | Anhang M | 14 | `wildfire.crown-fire` (M.8) |

Anhang N (9 Abschnitte: Spontanhelfer, sonstige Einsatzmittel) erhält **kein eigenes Präfix**: er
enthält überwiegend Fahrzeug- und Einrichtungskompositionen. Seine Einträge werden in D.4 den
bestehenden Präfixen zugeordnet oder als Rezept geführt — kein Präfix vorab, das möglicherweise
keinen Eintrag bekommt. Dasselbe gilt für die Anhänge C–I in D.5.

`PictogramId` ist die Union dieser fünf ID-Räume. `resolveElement` (Slice 2, Abschnitt 7) löst sie
weiterhin auf und wirft bei unbekannter ID; `ElementKind` wächst um die vier neuen Arten.

**`CapabilityId` wächst von einem auf 88 Literale, aber nicht in einem Schritt** — die Literale
entstehen je Unter-Slice (Abschnitt 10), weil `SymbolSpec.capabilities` typsicher bleiben soll,
ohne dass ein Typ Fähigkeiten behauptet, die kein Piktogramm haben.

Das verlangt eine Entscheidung, die der Katalog bisher zweimal gegenläufig getroffen hat:
`SOURCE_REGISTRY` ist über `satisfies Record<SourceId, SourceRecord>` **total** (Slice 2,
Abschnitt 3), `ORGANIZATION_COLORS` ist bewusst `Partial<Record<…>>` mit werfendem Zugriff
(Entscheidungsnotiz vom 4. August, Abschnitt 4). Für Piktogramme gilt das zweite Muster:

```ts
// statt des heutigen Record<CapabilityId, Primitive[]> in capabilities.ts:18
const PICTOGRAMS: Partial<Record<PictogramId, PictogramDefinition>> = { … };
```

`pictogram(id)` **wirft** bei einer ID ohne Definition — dasselbe Muster wie `organizationColor`,
`baseDrawing` und `resolveElement`. Ohne diese Umstellung wäre jede Erweiterung von
`CapabilityId` in D.1 ein Typfehler, solange nicht alle 88 Piktogramme vorliegen: das heutige
totale `Record` erzwingt Vollständigkeit, die erst am Ende von D.1 besteht. Die Regel „kein
Eintrag ohne Beleg" ist dieselbe wie bei den Organisationsfarben — sie gilt hier für die
Geometrie statt für die Farbe.

### Warum die IDs englisch sind

Weil `SymbolKind`, `PrimitiveRole` und `CoverageKind` es sind. Die deutschen Bezeichnungen der
Referenz stehen in `title` und in `synonyms` — dort, wo die Dokumentationswebsite sie sucht, und
wo eine Änderung der Referenzterminologie keine ID bricht.

## 7. Gates: was ein Piktogramm prüfbar macht

> **Nachtrag vom 7. August 2026:** Kapitel-4-Fähigkeiten sind in-body-Piktogramme im
> Grundzeichen formation. Kapitel-5.8-Zustände sind eigenständige taktische Zeichen; ihr
> Clippingziel ist die kanonische 32×32-mm-ViewBox. D.2 fügt deshalb kein SymbolSpec.states und
> keine State-Komposition in compose() hinzu. Für Standalone-Zeichen werden die tatsächlich
> benachbarten Farbpaare je Definition deklariert; das bisherige Organisationsfarbenprodukt gilt
> nur für in-body primary.

### Die Reduktion, die niemand nachträglich erfinden soll

Slice 2, Abschnitt 4 definiert `technical: approved` als „Fingerprint- und Snapshot-Gate für
diesen Eintrag sind grün". Für Piktogramme ist der erste Teil **strukturell unerreichbar**:
Slice 1, Abschnitt 8 beschränkt das Fingerprint-Gate auf Kapitel 1–3, `matchFingerprint`
vergleicht ausschließlich `role: 'body'` (Entscheidungsnotiz vom 4. August, Abschnitt 5), und
Slice 2, Abschnitt 9 gibt Piktogrammen folgerichtig `fingerprintTest: false`.

**Für Piktogramme lautet das Kriterium für `technical: approved` deshalb: Snapshot-Gate grün,
Box-Gate grün, Clipping-Gate grün, Kommando-Gate grün.** Vier prüfbare Bedingungen statt einer
unerreichbaren. Ausdrücklich nicht Teil davon: fachliche Richtigkeit der Bildidee und visuelle
Verwechslungsfreiheit — das ist `domain`, und das bleibt offen.

### Die drei neuen Gates

| Gate | Prüft | Eingabe |
|---|---|---|
| **Kommando-Gate** | Jeder `d`-String eines Primitivs mit `role: 'pictogram'` verwendet ausschließlich die sieben zugelassenen absoluten Kommandos (Abschnitt 5) | `PictogramDefinition` |
| **Box-Gate** | Jede Koordinate liegt innerhalb der deklarierten `box`; für Nicht-Pfad-Primitive stimmt `boundsOfMm` mit der Box überein | `PictogramDefinition` |
| **Clipping-Gate** | Die deklarierte `box` liegt vollständig innerhalb der Körperfläche des unverschobenen Grundzeichens | `PictogramDefinition` + `SymbolKind` |

**Warum das Box-Gate korrekt ist, ohne Bezierkurven auszurechnen:** Eine Bezierkurve verlässt die
konvexe Hülle ihrer Kontrollpunkte nie. Liegen alle Kontrollpunkte innerhalb der Box, liegt der
gezeichnete Pfad garantiert innerhalb der Box. Die Prüfung ist konservativ — sie kann eine Box als
zu klein melden, die geometrisch gerade noch passt, aber sie kann eine Überschreitung **nicht**
durchlassen. Das ist für ein Autorengate die richtige Richtung.

**Das Gate liest Koordinaten je Kommando, nicht als Zahlenstrom.** Diese Unterscheidung ist
tragend, nicht Implementierungsdetail: `H` trägt nur ein x, `V` nur ein y. Ein Gate, das jede Zahl
gegen beide Achsen prüft, würde `V 25` in einer schmalen hohen Box fälschlich gegen die Breite
prüfen und valide Pfade ablehnen. Nötig ist damit ein **Kommando-Tokenizer** — kein
Bezier-Auswerter. `core` bleibt ohne Laufzeitabhängigkeit, aber „Regex je Pfad" wäre zu wenig.

Die Beschränkung auf `M L H V C Q Z` (Abschnitt 5) ist genau die Bedingung, unter der beide
Aussagen oben gelten. Mit `A`, `S` oder `T` wäre das Gate nicht konservativ, sondern falsch.

**Das Clipping-Gate prüft gegen den unverschobenen Körper.** Begründung: Die Entscheidungsnotiz
vom 4. August, Abschnitt 8 belegt an der Referenz, dass das Piktogramm der Körpermitte folgt —
`C.1.1` verschiebt beide um dieselben 3 mm. Die Lage der Box **relativ zum Körper** ist damit
invariant gegenüber der Komposition, und die Prüfung braucht keine `SymbolSpec` und keinen
`pictogramShiftMm`. Sie läuft einmal je Piktogramm-Grundzeichen-Paar auf Katalogebene, nicht je
Komposition. Wäre die Invarianz nicht belegt, müsste sie pro Komposition laufen — sie ist belegt.

Das Clipping-Gate ist der vorgezogene Teil der Gate-Härtung (Abschnitt 1). Es prüft in diesem
Slice die Piktogramm-Box gegen den Körper, **nicht** die viewBox-Konsistenz des Gesamtbestands —
das bleibt bei der Gate-Härtung. Für die in D.2 hinzukommenden Standalone-Zeichen gilt dagegen
der Nachtrag vom 7. August 2026: Das Clippingziel ist die kanonische 32×32-mm-ViewBox; die
Farbkontraste folgen ausschließlich den je Zeichen deklarierten Nachbarschaftspaaren.

**Alle drei Gates lesen die Blätter, nicht die Gruppe.** `role: 'pictogram'` steht an jedem
Primitiv einer `PictogramDefinition` (wie heute in `capabilities.ts:11`); die von `compose`
erzeugte Gruppe (Abschnitt 5) trägt die Rolle ebenfalls, ist aber ein Kompositionsartefakt und
keine Gate-Eingabe — die Gates arbeiten auf der Definition, vor jeder Komposition.

### Folge für `releaseBlockers()`

Nach dem vollen Ausbau tragen mehrere hundert Einträge `domain: pending`, und diese Zahl dominiert
die Ausgabe von `releaseBlockers()` (Slice 2, Abschnitt 8) vollständig. Das ist die zutreffende
Darstellung der Lage und kein Grund, die Ausgabe zu gruppieren oder zu kürzen: das fachliche
Review **ist** der Engpass zu 1.0. Die Ausgabe zählt ab diesem Slice zusätzlich nach Bereich, damit
sichtbar bleibt, welcher Anhang geprüft ist und welcher nicht.

## 8. Coverage-Manifest

Keine Schemaänderung — Slice 2 hat die Formen bereits gesetzt. Jedes Piktogramm wird ein Eintrag
mit `coverage: 'element'`, `profile: 'bund'`, `fingerprintTest: false`, `snapshotTest: true`.

Zwei Konsequenzen, die festgelegt statt offengelassen werden:

- **`scope` wächst je Unter-Slice**, nie vorauseilend. Ein Kapitel im Scope ohne Eintrag ist nach
  Slice 2, Abschnitt 8 ein Release-Blocker — den Scope vor dem Inhalt zu erweitern erzeugt genau
  die Falschaussage, die das Manifest verhindern soll.
- **`referenceAsset`** ist die namensgebende Datei des Abschnitts. Für Abschnitte mit
  `_Alternative` entstehen zwei Einträge über `variant`, wie in Slice 1, Abschnitt 6 vorgesehen —
  in Kapitel 4 betrifft das `4.1.6`, `4.1.7`, `4.1.8` und `4.7.10`.

## 9. Quellenregister: zwei Erweiterungen

Der Upstream als Vergleichsquelle (Abschnitt 4) passt in keine der Slice-2-Kategorien. Zwei
Werttypen wachsen um je ein Literal:

```ts
type SourceKind = … | 'open-source-corpus';
type GeometryUse = … | 'compared-only';
```

`'compared-only'` ist der Wert, den Slice 2, Abschnitt 3 ausdrücklich zurückgehalten hat, bis ein
Konsument existiert. Dieser Slice ist der Konsument.

Neuer Registereintrag:

| `SourceId` | `kind` | Titel | `acquisition` | `geometryUse` | `licence` |
|---|---|---|---|---|---|
| `phjardas-tz` | `open-source-corpus` | phjardas/taktische-zeichen — JavaScript-Generator nach DV 102 | `public-url` | `compared-only` | MIT, `clarified` |

`licence.note` hält fest, was Abschnitt 4 belegt: MIT in `LICENSE` und `packages/core/LICENSE`,
Copyright-Zeile ohne Rechteinhaber, keine Geometrie übernommen — daher entsteht keine
Attributionspflicht.

`jonas-koeritz/Taktische-Zeichen` wird **nicht** registriert. `Vision.md` hält für dieses
Repository fest, dass CC BY 4.0 und eine README-Aussage zur Gemeinfreiheit nebeneinander stehen
und die Lage datei- und releasebezogen zu klären ist. Eine Quelle einzutragen, deren
Nutzungsgrundlage ungeprüft ist, wäre genau die ungelesene Behauptung, die das Register
verhindern soll. Der Eintrag entsteht, wenn die Prüfung stattgefunden hat.

## 10. Zerlegung und Reihenfolge

Diese Spec ist der Rahmen für D; der Inhalt entsteht in Unter-Slices. **D.0 ist Teil dieser
Spec**, alles Weitere bekommt einen eigenen Umsetzungsplan.

| Unter-Slice | Inhalt | Umfang |
|---|---|---|
| **D.0** | Mechanismus: `translate`, `PictogramDefinition`, drei Gates, `pictogram`-Port, Umstellung von `capability.fire-fighting`, ein Pfad-Piktogramm als Nachweis | dieser Slice |
| **D.1** | Kapitel 4 vollständig | 88 Abschnitte, 92 Einträge |
| **D.2** | Kapitel 5.8 | 61 Abschnitte |
| **D.3** | Anhang J (IuK) | 50 |
| **D.4** | Anhänge K, L, M, N | 51 |
| **D.5** | Anhänge C–I: Kompositionsrezepte, plus die dort auftauchenden zusätzlichen Piktogramme | 281 |

### Reihenfolgeregel

> **Nachtrag vom 6. August 2026:** Die Gate-Härtung ist über
> `docs/decisions/2026-08-06-gate-haertung-vor-d1.md` abgeschlossen. Die dort dokumentierten
> Mehrgrößen-, Theme-/Druck-, A11y- und globalen viewBox-Gates geben D.1 frei.

Der Nachtrag vom 7. August 2026 grenzt D.2 vor dem Ausbau ab: Kapitel 5.8 wird standalone
katalogisiert, ohne `SymbolSpec.states` oder eine State-Komposition in `compose()` vorwegzunehmen.

1. **D.0 zuerst**, weil ohne es kein Pfad-Piktogramm existieren kann (Abschnitt 2).
2. **Gate-Härtung vor D.1.** Die vier verbleibenden Arbeitsbereiche der Entscheidungsnotiz —
   Mehrgrößen-Regression 16…256, Druckprofil, A11y-Kontrast und die globale viewBox-Prüfung —
   bleiben *vor* dem Massenausbau. Ein
   Piktogramm, das bei 16 px zuläuft oder in Schwarz-Weiß verschwindet, ist bei 88 Einträgen ein
   Fund und bei 500 eine Nacharbeitswelle. Diese Reihenfolge ist der Grund, warum D.0 den
   Mechanismus baut und nicht schon Kapitel 4.
3. **Piktogramme vor Anhängen** (D.1–D.4 vor D.5), weil die Anhänge sie verwenden (Abschnitt 3).
4. **Innerhalb von D.1 die 41 Upstream-gedeckten zuerst**, weil dort die Bildidee nicht
   erfunden werden muss und der Autorenrhythmus sich an einfachen Fällen einstellt, bevor
   Anhang K und die Wetterzeichen kommen.

### Was D.0 als Nachweis liefert

Nach dem Muster von Slice 1 wird der Mechanismus an der Naht belegt, nicht an der Menge:

- `capability.fire-fighting` wird auf `PictogramDefinition` mit deklarierter Box umgestellt und
  bleibt strichbasiert — der bestehende Snapshot und der Rezepttest (`y = 16` für `C.1.2`,
  `y = 19` für `C.1.1`) müssen unverändert grün bleiben. Damit ist belegt, dass die
  Gruppen-Translation dasselbe Ergebnis liefert wie die heutige primitivweise Verschiebung.
- **Genau ein neues Piktogramm mit Kurven als `path`**, in beiden Rezepten platziert:
  **`4.3.2 Löschwasser/Brauchwasser`**. Die Wahl ist an der Referenz belegt, nicht bequem: der
  Fingerprint dieser Datei trägt `curvedPaths: 1` — die Bildidee **enthält** dort eine Kurve, ein
  `path` ist also nicht künstlich, sondern sachlich nötig. Sie hat eine Bildidee im Upstream
  (`brauchwasser`, Abschnitt 3) und liegt in derselben Kapitelgruppe wie das bereits umgesetzte
  `4.3.1`.

  Ausdrücklich verworfen: `4.7.10 Heben von Lasten oder Personen`. Es sieht als Kandidat gut aus —
  Upstream-Bildidee, `_Alternative` für den `variant`-Fall, das Beispiel der
  Coverage-Matrix-Skizze in `Vision.md` — aber sein Fingerprint trägt `curvedPaths: 0`. Die
  BABZ-Darstellung ist geradlinig; ein Kurvenpiktogramm daraus zu machen wäre eine Erfindung. Der
  Upstream löst dieselbe Bildidee mit einem Ellipsenbogen (`a`-Kommando), das Abschnitt 5
  ausschließt — ein zweiter Grund, es nicht als Vorlage zu nehmen.

- **Der `variant`-Fall gehört nicht in D.0.** Er ist strukturell seit Slice 1, Abschnitt 6 gelöst
  und in Slice 2 an `2.14_Escape Route` belegt; in D.1 tragen ihn `4.1.6`, `4.1.7`, `4.1.8` und
  `4.7.10`. Ihn in den Mechanismus-Nachweis zu ziehen würde ein zweites Piktogramm erzwingen,
  ohne eine offene Frage zu schließen.

Ein Piktogramm reicht für den Nachweis; das zweite wäre Inhalt und gehört in D.1.

## 11. Ablage

Keine neue Paketebene. Richtung `cli → catalog → core → schema` unverändert.

| Modul | Inhalt | Status |
|---|---|---|
| `packages/schema/src/geometry.ts` | `Translation`, `Transform.translate` | erweitert |
| `packages/schema/src/pictogram.ts` | `PictogramBox`, `PictogramDefinition`, `PictogramId` | neu |
| `packages/schema/src/taxonomy.ts` | `CapabilityId` wächst; vier neue ID-Räume | erweitert |
| `packages/schema/src/sources.ts` | `'open-source-corpus'`, `'compared-only'` | erweitert |
| `packages/core/src/bounds.ts` | `translate` in `rawBoundsOfMm` für Gruppen | erweitert |
| `packages/core/src/compose.ts` | Piktogramm-Gruppe statt `shiftY`-Abbildung; `pictogram`-Port; für D.2 keine State-Komposition (Nachtrag vom 7. August 2026) | erweitert |
| `packages/core/src/render/svg.ts` | `translate` in `transformAttr` | erweitert |
| `packages/core/src/render/canvas.ts` | `translate` in `drawPrimitive` | erweitert |
| `packages/core/src/pictogram-gate.ts` | Kommando-, Box- und Clipping-Prüfung | neu |
| `packages/catalog/src/pictograms/` | ein Modul je Bereich; `capabilities.ts` zieht hierher und wird von `Record` auf `Partial<Record<…>>` mit werfendem Zugriff umgestellt (Abschnitt 6) | erweitert |
| `packages/catalog/src/sources.ts` | Eintrag `phjardas-tz` | erweitert |
| `packages/catalog/src/elements.ts` | neue Element-Arten in `resolveElement` | erweitert |

`schema` und `core` behalten null Laufzeitabhängigkeiten. Das Box-Gate liest Zahlen aus einem
String — kein Parser, keine Abhängigkeit.

Für D.2 ergänzt der Katalog an dieser Naht einen diskriminierten Platzierungs- und
Kontrastvertrag: in-body bleibt auf `formation` beschränkt, während Standalone-Definitionen
gegen die ViewBox clippen und ihre tatsächlichen Farbpaare deklarieren (Nachtrag vom 7. August
2026).

## 12. Umfang

**Enthalten (D.0):** `Transform.translate` in Schema, beiden Renderern und der Hüllberechnung;
`PictogramDefinition` mit deklarierter Box; der `pictogram`-Port; Umstellung von
`capability.fire-fighting` unter Erhalt aller bestehenden Tests, samt Umstellung auf ein
`Partial`-Register mit werfendem Zugriff; ein neues Pfad-Piktogramm mit Kurven als Nachweis
(`4.3.2`); Kommando-, Box- und Clipping-Gate; die fünf
ID-Präfixe; `'open-source-corpus'` und `'compared-only'` mit dem Registereintrag `phjardas-tz`;
bereichsweise Zählung in `releaseBlockers()`; Manifest-Einträge für die in D.0 entstandenen
Piktogramme.

**Nicht enthalten:**

- Eine Erweiterung von `SymbolSpec` um `states` oder eine State-Komposition in `compose()`;
  Kapitel 5.8 bleibt nach dem Nachtrag vom 7. August 2026 ein standalone Katalogbereich

- Der Inhalt von D.1 bis D.5 — 249 der 250 Piktogrammabschnitte
- Die vier verbleibenden Gate-Lücken: Mehrgrößen-Regression 16…256, Theme- und Druckprofile,
  A11y-Kontrastprüfung sowie die viewBox-Konsistenzprüfung über den Gesamtbestand
- Kapitel 3 (Ergänzungseigenschaften): `PropertyId` existiert weiterhin nicht, `'3'` bleibt außer
  Scope. Kapitel 3 hat nach der Entscheidungsnotiz vom 5. August **keinen Owner** und bekommt
  hier keinen — es ist keine Piktogrammfrage
- Die Fußzone: `designation` bleibt validiert und ungerendert, `role: 'foot'` ungenutzt. Kapitel
  5.8.8 (Personen) berührt sie fachlich, aber Zustandspiktogramme sind nicht die Fußzone
- Die sechs fehlenden Grundzeichen und das `1.13`-Gate (Entscheidungsnotiz vom 4. August,
  Abschnitt 1) sowie Verwaltungsstufen- und Fahrzeugkategorie-Kopfmarken
- Legacy-Migration nach SKK 2010; `legacyIds` bleibt ohne Inhalt
- Registrierung und Vergleichstests gegen `jonas-koeritz/Taktische-Zeichen` (Abschnitt 9)
- Übernahme von Pfaddaten aus dem Upstream (Abschnitt 4)
- Die Coverage-Achsen Regelabdeckung und generative Reichweite
- Ausgabekanäle (Teilprojekt E) und Dokumentationswebsite (F)

## 13. Erfolgskriterien

1. Ein Piktogramm, das Kurven als `path` enthält, wird in beiden Rezepten (`C.1.1`, `C.1.2`)
   korrekt platziert — `compose()` wirft nicht, und die Verschiebung folgt der Körpermitte.
2. Der bestehende Snapshot von `capability.fire-fighting` und die an `y = 16` / `y = 19`
   festgenagelten Rezepttests bleiben nach der Umstellung unverändert grün.
3. SVG- und Canvas-Renderer erzeugen aus einer IR mit `translate` dasselbe Bild; ein Test belegt
   das, statt es der Zielplattform zu überlassen.
4. Das Kommando-Gate lehnt ein relatives Kommando ab und ebenso jedes `A`, `S` und `T` — je ein
   Test pro Fall, weil die drei aus verschiedenen Gründen ausgeschlossen sind (Abschnitt 5).
5. Das Box-Gate lehnt eine Koordinate außerhalb der deklarierten Box ab, akzeptiert aber `V`
   und `H` in einer Box, deren jeweils andere Achse kürzer ist als der Wert — der Nachweis, dass
   es Koordinaten je Kommando liest und nicht als Zahlenstrom. Das Clipping-Gate lehnt eine Box
   ab, die über den Körper hinausragt.
6. Jedes in D.0 entstandene Piktogramm ist über `resolveElement` auflösbar und hat einen
   Manifest-Eintrag mit `fingerprintTest: false` und begründetem `technical`-Status nach dem
   Kriterium aus Abschnitt 7.
7. `phjardas-tz` ist registriert mit `geometryUse: ['compared-only']`; kein Katalogeintrag
   referenziert übernommene Geometrie.
8. CI läuft vollständig grün auf einem Rechner ohne Referenzbestand; `schema` und `core` haben
   weiterhin null Laufzeitabhängigkeiten.
9. Der Nachtrag vom 7. August 2026 ist erfüllt: D.1-Piktogramme bleiben in-body in `formation`,
   und D.2-Standalone-Zeichen wählen ViewBox-Clipping sowie deklarierte tatsächliche
   Kontrastnachbarschaften ohne `SymbolSpec.states` oder `compose()`-Integration.

## 14. Risiken und offene Punkte

**Die 163 Piktogramme ohne Upstream-Pendant sind der Aufwandsposten, den keine Methode
wegnimmt.** Abschnitt 4 senkt die Kosten je Piktogramm erheblich — geschriebene Pfade statt
Vektorhandarbeit —, aber die Bildidee für einen Trümmerkegel mit Schichtung (`K.7`) oder ein
Wipfelfeuer (`M.8`) muss aus dem Hauptdokument gelesen und in Pfadkommandos übersetzt werden. Die
ehrliche Erwartung ist: 250 Piktogramme in Autorenarbeit, davon 75 mit Vorlage. Das ist
lieferbar, aber es ist nicht billig, und die Zahl ist gegen den Bestand gemessen (Abschnitt 3),
nicht geschätzt.

**Das fachliche Review skaliert nicht mit.** Nach D.1 bis D.4 tragen über 250 Einträge
`domain: pending`. Wer diese Prüfung durchführt, ist dieselbe offene Frage wie in Slice 1,
Abschnitt 13 und Slice 2, Abschnitt 13 — dieser Slice beantwortet sie **nicht**. Er beantwortet
nur, wer die Geometrie herstellt. Der Unterschied ist wesentlich: die Autorenfrage ist gelöst,
die Prüffrage nicht.

**Das Box-Gate prüft die Zusicherung, nicht die Bildidee.** Eine korrekt deklarierte Box mit
einem fachlich falschen Piktogramm darin passiert alle vier Gates aus Abschnitt 7. Der
hauseigene Stil, die Verwechslungsfreiheit und die fachliche Richtigkeit sind `domain`-Sache und
bleiben menschlich — die Gates verhindern nur, dass etwas *technisch* falsch ausgeliefert wird.

**Ob fünf ID-Präfixe die richtige Aufteilung sind, zeigt erst D.3.** `capability.` und `state.`
folgen der Kapitelstruktur eindeutig. Bei Anhang J ist weniger klar, ob Übertragungsarten (J.1),
Fernmeldegeräte (J.3) und IT-Netzwerkelemente (J.4) unter ein Präfix gehören — fachlich sind es
drei verschiedene Dinge. Die Kosten eines Irrtums sind eine Umbenennung vor dem ersten Release
dieses Bereichs, nicht ein Datenumbau: die Entscheidung fällt in D.3 und wird dort belegt.

**`Vision.md` bleibt an den in Slice 2, Abschnitt 13 genannten Stellen veraltet.** Diese Spec
korrigiert zusätzlich die Zahl „über 400 Piktogramme" (Slice 1, Abschnitt 13) auf 250 gemessene
Piktogrammabschnitte, ohne die Vision selbst anzufassen. Deren Überarbeitung ist eine eigene
Aufgabe; bis dahin gilt bei Widerspruch die jeweilige Slice-Spec.

## 15. Nächster Schritt

Umsetzungsplan für D.0 über das `writing-plans`-Skill erstellen. D.1 bis D.5 bekommen je einen
eigenen Plan gegen diese Spec, nach der Reihenfolgeregel aus Abschnitt 10.
