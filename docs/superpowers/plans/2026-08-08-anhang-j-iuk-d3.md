# Anhang J — Informations- und Kommunikationstechnik (D.3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den Bestand des Anhangs J der projektinternen BBK/BABZ-Baseline als 48 stabile
`comms.*`-IDs mit 53 technisch gegateten, eigenständigen Darstellungen liefern.

**Architecture:** Anhang J wird als Sammlung eigenständiger taktischer Zeichen im vorhandenen
Piktogrammkatalog modelliert. Der ID-Raum `comms.` ist in `packages/schema/src/pictogram.ts`
bereits als `never` mit dem Vermerk „Literale entstehen in D.3" vorgezeichnet; D.3 füllt diesen
Vertrag. Alle 53 Darstellungen nutzen den vorhandenen `placement: { mode: 'standalone' }` aus
`catalog-definition.ts` — es entsteht kein dritter Platzierungsmodus. Fünf Abschnitte aus J.1
tragen neben ihrer `primary`- eine `alternative`-Darstellung, weil der Manifestschlüssel
`entryKey(sourceId, variant)` den Quellenabschnitt trägt und beide Fassungen zwingend dieselbe
`section` haben.

**Tech Stack:** TypeScript 5.9, Vitest 3, pnpm 11.20.0, `@resvg/resvg-js`, bestehende
Paketrichtung `cli → catalog → core → schema`

## Global Constraints

- Ausgangspunkt ist `main` auf Commit `70f7cc3` — der Slice „Textprimitiv und Fußzone" ist gemergt.
  Der D.3-Worktree ist darauf rebased (Branch `worktree-anhang-j-d3`); Task 1 und Task 2 sind
  erledigt, das Revert-Paar der erfundenen Marken ist beim Rebase entfallen und liegt als Tag
  `archiv/d3-erfundene-marken-zurueckgerollt`.
- Jeder Shellbefehl wird gemäß Repository-Anweisung mit `rtk` ausgeführt.
- Die lokalen Referenz-SVGs unter `taktische-zeichen/` dienen ausschließlich der visuellen und
  semantischen Prüfung. Keine Pfaddaten, Koordinaten oder transformierte Referenzgeometrie werden
  übernommen oder eingecheckt. `taktische-zeichen/` und das ZIP bleiben ignoriert und uncommitted.
- Jede neue Geometrie ist eine eigenständige Millimeterkonstruktion auf der kanonischen
  32 × 32-mm-ViewBox und verwendet für Pfade ausschließlich absolute `M L H V C Q Z`-Kommandos.
  Textläufe sind keine Pfade und laufen nicht durch das Kommando-Gate; sie tragen stattdessen
  `boxMm` und `minRenderPx`.
- Alle 53 Darstellungen sind `placement.mode: 'standalone'`. Sie werden katalogisiert, aufgelöst
  und eigenständig gerendert, aber in D.3 nicht als Zusätze in `SymbolSpec` oder `compose()`
  eingeführt.
- Jede tatsächlich benachbarte Farbkombination wird je Definition deklariert und in
  `accessible-light` sowie `print-monochrome` mit mindestens 3:1 geprüft. Semantische Unterschiede
  dürfen nicht ausschließlich von Farbe abhängen.
- Jede der 53 Darstellungen erhält einen eigenen `domain: pending`-Ledgerplatz in
  `MANIFEST_DOMAIN_REVIEWS`. Technische Evidenz ist keine fachliche Freigabe.
- `DepictionVariant` heißt `'primary' | 'alternative'` (`provenance.ts:43`) — nicht `alternate`.
- Der Manifest-Scope wächst erst in Task 9 um `'J.1'`, `'J.2'`, `'J.3'`, `'J.4'`, nachdem das
  Inventar vollständig ist. Ein beanspruchter Präfix ohne Eintrag ist ein Release-Blocker
  (`coverage-gate.ts:541-544`).
- Das `text`-Primitiv liegt vor (`geometry.ts`, seit dem Slice vom 9. August) und trägt die 16
  typografischen Darstellungen aus Spec-Abschnitt 2.4. Jeder Lauf deklariert `boxMm` und
  `minRenderPx`; die Schriftfamilie steht nicht am Primitiv, sondern in der Renderpolitik.
- Kein Zeichen erreicht die 16-px-Snapshotgröße lesbar: bei `MINIMUM_TEXT_RENDER_PX = 8` verlangt
  sie 16 mm Schriftgrad, das breiteste Kürzel misst 10,3 mm. `minRenderPx` ist deshalb an jedem
  typografischen Lauf Pflicht, nicht Kür — ohne es meldet `gate.test.ts` das Zeichen bei jeder
  Rendergröße unterhalb der Schwelle.

---

## Dateistruktur

**Neu:**

| Datei | Verantwortung |
|---|---|
| `packages/catalog/src/pictograms/comms/authoring.ts` | Stilkonstanten und Primitiv-Helfer für den J-Bestand |
| `packages/catalog/src/pictograms/comms/01-connections.ts` | J.1 — 14 IDs, 19 Darstellungen |
| `packages/catalog/src/pictograms/comms/02-operating-modes.ts` | J.2 — 2 IDs, 2 Darstellungen |
| `packages/catalog/src/pictograms/comms/03-devices.ts` | J.3 — 15 IDs, 15 Darstellungen |
| `packages/catalog/src/pictograms/comms/04-network.ts` | J.4 — 17 IDs, 17 Darstellungen |
| `packages/catalog/src/pictograms/comms/index.ts` | Zusammenführung zu `COMMS_PICTOGRAMS` |
| `packages/catalog/src/pictograms/comms-inventory.test.ts` | Inventarvertrag: 48 IDs, 53 Darstellungen |
| `packages/catalog/src/pictograms/comms-families.test.ts` | Formfamilien und Kontrastvertrag je Gruppe |
| `docs/reviews/2026-08-08-d3-visual-qa.md` | Kontaktbogenprotokoll, 53 Zeilen |
| `docs/decisions/2026-08-08-anhang-j-iuk-d3.md` | Entscheidungsnotiz nach Abschluss |

**Geändert:**

| Datei | Änderung |
|---|---|
| `packages/schema/src/taxonomy.ts` | `COMMS_IDS` und `CommsId` |
| `packages/schema/src/pictogram.ts` | `CommsId` importieren statt `never` |
| `packages/catalog/src/pictograms/catalog-definition.ts` | `PictogramSection`, `CommsDefinitionInput`, `defineComms` |
| `packages/catalog/src/pictograms/index.ts` | `COMMS_PICTOGRAMS` in `ALL_PICTOGRAMS` |
| `packages/catalog/src/coverage-manifest.ts` | `scope` um vier J-Präfixe |
| `packages/catalog/src/domain-reviews.ts` | 53 neue `pending`-Einträge |
| `README.md` | Umfangsangabe |

---

## Verbindliches Zielinventar

48 IDs in Kapitelreihenfolge. Diese Reihenfolge ist die verbindliche Reihenfolge von `COMMS_IDS`.
Die Spalte „Alt." markiert die fünf Abschnitte mit zusätzlicher `alternative`-Darstellung.

### J.1 — Verbindungsarten (14 IDs, 19 Darstellungen)

| Abschnitt | ID | Titel | Belegdatei (primary) | Alt. |
|---|---|---|---|---|
| J.1.1 | `voice` | Sprache | `J.1.1_Sprache.svg` | `J.1.1_Sprache_leitergebunden.svg` |
| J.1.2 | `voice-radio` | Sprechfunk | `J.1.2_Sprechfunk.svg` | — |
| J.1.3 | `voice-radio-dmo` | Sprechfunk im DMO | `J.1.3_Sprechfunk im DMO.svg` | — |
| J.1.4 | `voice-radio-tmo` | Sprechfunk im TMO | `J.1.4_Sprechfunk im TMO.svg` | — |
| J.1.5 | `sds-dmo` | SDS im DMO | `J.1.5_SDS im DMO.svg` | — |
| J.1.6 | `sds-tmo` | SDS im TMO | `J.1.6_SDS im TMO.svg` | — |
| J.1.7 | `voice-radio-dmo-repeater` | Sprechfunk im DMO über Repeater | `J.1.7_Sprechfunk im DMO_Repeater.svg` | — |
| J.1.8 | `data-transmission` | Datenübertragung | `J.1.8_Datenübertragung.svg` | `J.1.8_Datenübertragung_leitergebunden.svg` |
| J.1.9 | `fax-transmission` | Faxübertragung | `J.1.9_Faxübertragung.svg` | `J.1.9_Faxübertragung_leitergebunden.svg` |
| J.1.10 | `image-transmission` | Bildübertragung | `J.1.10_Bildübertragung.svg` | `J.1.10_ Bildübertragung_leitergebunden.svg` |
| J.1.11 | `livestream-transmission` | Livestreamübertragung | `J.1.11_Livestreamübertragung.svg` | `J.1.11_Livestreamübertragung_leitergebunden.svg` |
| J.1.12 | `satellite-voice` | Satellitenverbindung Sprache | `J.1.12_Satellitenverbindung_Sprache.svg` | — |
| J.1.13 | `satellite-data` | Satellitenverbindung Daten | `J.1.13_Satellitenverbindung_Daten.svg` | — |
| J.1.14 | `directional-radio-link` | Richtfunkverbindung | `J.1.14_Richtfunkverbindung.svg` | — |

Die Belegdatei zu J.1.10 `alternative` trägt nach dem Unterstrich ein Leerzeichen
(`J.1.10_ Bildübertragung_leitergebunden.svg`). Der Name ist so zu übernehmen; er erfüllt die
Präfixprüfung `J.1.10_`.

### J.2 — Betriebsarten (2 IDs, 2 Darstellungen)

| Abschnitt | ID | Titel | Belegdatei |
|---|---|---|---|
| J.2.1 | `half-duplex-operation` | Wechselverkehr | `J.2.1_Wechselverkehr.svg` |
| J.2.2 | `duplex-operation` | Gegenverkehr | `J.2.2_Gegenverkehr.svg` |

### J.3 — Fernmeldebetriebsmittel (15 IDs, 15 Darstellungen)

| Abschnitt | ID | Titel | Belegdatei |
|---|---|---|---|
| J.3.1 | `telecom-device` | Fernmeldegerät (Grundzeichen) | `J.3.1_Fernmeldegerät Grundzeichen.svg` |
| J.3.2 | `base-station` | Basisstation | `J.3.2_Basisstation.svg` |
| J.3.3 | `mobile-base-station` | Mobile Basisstation | `J.3.3_Mobile Basisstation.svg` |
| J.3.4 | `gateway` | Gateway | `J.3.4_Gateway.svg` |
| J.3.5 | `repeater` | Repeater | `J.3.5_Repeater.svg` |
| J.3.6 | `handheld-radio-terminal` | Handheld Radio Terminal | `J.3.6_Handheld Radio Terminal.svg` |
| J.3.7 | `mobile-radio-terminal` | Mobile Radio Terminal | `J.3.7_Mobile Radio Terminal.svg` |
| J.3.8 | `fixed-radio-terminal` | Fixed Radio Terminal | `J.3.8_Fixed Radio Terminal.svg` |
| J.3.9 | `active-paging-radio-terminal` | Active Paging Radio Terminal | `J.3.9_Active Paging Radio Terminal.svg` |
| J.3.10 | `antenna` | Antenne | `J.3.10_Antenne.svg` |
| J.3.11 | `cable-construction` | Kabelbau | `J.3.11_Kabelbau.svg` |
| J.3.12 | `radio` | Funk | `J.3.12_Funk.svg` |
| J.3.13 | `transitions` | Übergänge | `J.3.13_Übergänge.svg` |
| J.3.14 | `telephone-exchange` | Fernsprechvermittlung | `J.3.14_Fernsprechvermittlung.svg` |
| J.3.15 | `telephone-exchange-voip` | Fernsprechvermittlung VoIP | `J.3.15_Fernsprechvermittlung VoIP.svg` |

### J.4 — Netz- und Kabelzeichen (17 IDs, 17 Darstellungen)

| Abschnitt | ID | Titel | Belegdatei |
|---|---|---|---|
| J.4.1 | `router` | Router | `J.4.1_Router.svg` |
| J.4.2 | `network-switch` | Switch | `J.4.2_Switch.svg` |
| J.4.3 | `server` | Server | `J.4.3_Server.svg` |
| J.4.4 | `access-point` | Access Point | `J.4.4_Access Point.svg` |
| J.4.5 | `wan` | WAN | `J.4.5_WAN.svg` |
| J.4.6 | `firewall` | Firewall | `J.4.6_Firewall.svg` |
| J.4.7 | `printer` | Drucker | `J.4.7_Drucker.svg` |
| J.4.8 | `connection-length` | Längenverbindung | `J.4.8_Längenverbindung.svg` |
| J.4.9 | `pickup-point` | Abholpunkt | `J.4.9_Abholpunkt.svg` |
| J.4.10 | `connection-point` | Anschlusspunkt | `J.4.10_Anschlusspunkt.svg` |
| J.4.11 | `connection-crossing` | Kreuzung von Verbindungen | `J.4.11_Kreuzung von Verbindungen.svg` |
| J.4.12 | `distributor` | Verteiler | `J.4.12_Verteiler.svg` |
| J.4.13 | `distributor-with-surge-protection` | Verteiler mit Überspannungsschutz | `J.4.13_Verteiler mit Überspannschutz.svg` |
| J.4.14 | `cable-temporary` | Kabel, temporär verlegt | `J.4.14_Kabel_temporär verlegt.svg` |
| J.4.15 | `fiber-optic-temporary` | Glasfaser, temporär verlegt | `J.4.15_Glasfaser_temporär verlegt.svg` |
| J.4.16 | `network-cable-temporary` | Netzwerkkabel, temporär verlegt | `J.4.16_Netzwerkkabel_temporär verlegt.svg` |
| J.4.17 | `twisted-pair-count` | Anzahl Doppeladern | `J.4.17_Anzahl Doppeladern.svg` |

### Nicht im Inventar

`J_Bedienungszeichen.svg` (viewBox 226,772 × 90,709 — ein Übersichtsblatt),
`J.2.3._Beispiel Telefon.svg` und `J.2.3._Beispiel Wählbetrieb.svg`. Der Abschnitt J.2.3 ist lokal
nur durch diese beiden Beispiele belegt und wird deshalb nicht in den beanspruchten Umfang
aufgenommen. Alle drei Dateien gehen an die spätere Rezept- und Conformance-Coverageaufgabe, die
schon die sieben Kapitel-5.8-Beispielassets trägt.

---

## Verbindlicher Autorenvertrag

Gilt für jede der 53 Darstellungen in den Tasks 2 bis 8.

1. **Referenz visuell prüfen, nicht lesen.** Vor dem Konstruieren die Belegdatei rasterisieren und
   ansehen. Der SVG-Quelltext der Referenz wird nicht als Konstruktionsvorlage benutzt; Pfaddaten
   und Koordinaten werden nicht übernommen.
2. **Millimeter, absolut.** Die kanonische Fläche ist 32 × 32 mm. Pfade nutzen ausschließlich
   `M L H V C Q Z` in Großschreibung.
3. **Box deklarieren — ohne Strichbreite.** `box` ist die zugesicherte Hülle der eigenen
   Konstruktion, nicht die der Referenz. `checkBox` in `pictogram-gate.ts:230-270` misst mit
   `boundsOfMm` die **reine Geometrie**; die Strichbreite geht nicht ein. Enthält eine Definition
   **weder** einen Pfad **noch** einen Textlauf, fordert das Gate sogar **Gleichheit** von Hülle
   und Box — eine zu große Box ist dort ebenso ein Befund wie eine zu kleine. Mit Pfad genügt
   Enthaltung, weil die Koordinaten im `d`-String liegen und nur kommandoweise geprüft werden. Mit
   Text genügt sie ebenfalls, aus einem anderen Grund: die Glyphenhülle ist ohne Fontmetrik nicht
   berechenbar, `boundsOfMm` gibt für Text die deklarierte `boxMm` unverändert zurück. **Für die
   16 typografischen Darstellungen ist die Box damit eine ungeprüfte Zusicherung** — falsch
   deklariert fällt sie erst in der visuellen Prüfung auf.

   Für Linien von `x = 1` bis `x = 31` auf `y = 12 … 20` lautet die Box also
   `{ xMm: 1, yMm: 12, widthMm: 30, heightMm: 8 }` — nicht `{ 0.5, 11.5, 31, 9 }`. Besteht eine
   Definition nur aus waagerechten Linien, ist `heightMm: 0` die richtige und zulässige Zusicherung
   (`boxGeometryProblems` verbietet nur negative Werte).
4. **Der Rand rechnet mit Strichbreite — ein anderes Gate.** `viewbox-gate.ts:58-62` rechnet die
   halbe Strichbreite in die Bounds ein. Bei `COMMS_STROKE_WIDTH_MM = 1` reicht eine Mittellinie
   auf `x = 0` bis `x = -0,5` und liegt damit **außerhalb** der 32 × 32-mm-Fläche. Jede Mittellinie
   hält deshalb mindestens 0,5 mm Abstand zum Rand; der Bestand arbeitet durchgängig im Feld
   1 … 31.

   Box-Gate und viewBox-Gate messen verschieden: die Box beschreibt die Geometrie, die ViewBox muss
   das **gezeichnete** Zeichen fassen. Beide Regeln gelten gleichzeitig und widersprechen sich
   nicht.

   Die Randregel gilt auch dort, wo die Referenz den Rand berührt — `J.2.1_Wechselverkehr.svg`
   läuft von `x = 0` bis `x = 90,709`, zeichnet aber gefüllte Polygone ohne Strichbreite. Diese
   Fassung ist nicht übertragbar.

   **Für Textboxen gilt sie nicht.** `viewbox-gate.ts` setzt für Text `strokeWidth = 0`, weil Text
   gefüllt und nicht gestrichen wird; eine Textbox darf den Rand berühren.
5. **Kontrastpaare deklarieren.** Nur tatsächlich benachbarte Farbflächen und Striche. Für ein
   rein schwarzes Zeichen auf der Ausgabeoberfläche ist das genau ein Paar.

   **Nie ein Paar aus zwei Token, die dieselbe Farbe auflösen.** `weiss`/`surface` sind beide
   `#ffffff`, das Verhältnis ist exakt 1:1 und die Zusicherung damit unerfüllbar. Für einen Körper
   mit weißer Fläche sind es zwei andere Paare: `schwarz`/`surface` für die Kontur auf der
   Ausgabeoberfläche und `schwarz`/`weiss` für die Marke auf dem Körper — so führt es
   `states/07-weather.ts` bereits. `contrastPairProblems` meldet solche Nulltoken-Paare seit dem
   Textslice als Befund.

   **Textmalende Token tragen die höhere Schwelle**: `MINIMUM_TEXT_CONTRAST = 4.5` statt 3:1, weil
   WCAG Text und Nichttext unterscheidet.
6. **Beschriftungsglyphen sind Text, keine erfundenen Marken.** Die 16 typografischen
   Darstellungen aus Spec-Abschnitt 2.4 tragen ihr Kürzel als `text`-Primitiv mit deklarierter
   `boxMm` und deklariertem `minRenderPx`. Weder Glyphen als Pfade nachzeichnen (eine
   Schriftschnitt-Nachbildung ohne Lizenzgrundlage) noch eigene Marken erfinden — ein früherer
   Commit dieses Branches hat Letzteres für `J.3.4` bis `J.3.8` getan und wurde deshalb
   zurückgerollt (Tag `archiv/d3-erfundene-marken-zurueckgerollt`).

   Zwei Ausnahmen: Bei `J.4.17` („8") bleibt die Trägergeometrie ohne Glyphe — ein Beispielwert
   wird nicht zur Zeichenbedeutung erklärt. Bei `J.1.14` bleibt der graue Erklärtext der Referenz
   weg; er ist Blattbeschriftung, kein Zeicheninhalt.
7. **Ledgerplatz mitliefern.** Jede neue Darstellung braucht in derselben Task ihren Eintrag in
   `MANIFEST_DOMAIN_REVIEWS` unter `bbk-babz-2025:${section}#${variant}` mit
   `{ status: 'pending' }`. Ohne ihn ist `domain-reviews.test.ts` rot.
8. **ID mitliefern.** Jede neue ID wird in derselben Task an ihrer kapitelrichtigen Stelle in
   `COMMS_IDS` eingefügt.

### Formfamilien des Bestands

Der Strukturbefund der Referenzen ergibt vier Familien. Sie bestimmen den Kontrastvertrag.

| Familie | Mitglieder | Aufbau | Kontrastpaare |
|---|---|---|---|
| **Gerätekörper** | J.3.1–J.3.9, J.3.13–J.3.15 | weiße Fläche mit schwarzer Kontur, darin schwarze Marken oder Kürzel | `schwarz`/`surface`, `schwarz`/`weiss` |
| **Netzkörper** | J.4.1–J.4.7, J.4.12, J.4.13 | weiße Fläche (Kreis oder Quadrat) mit schwarzer Kontur, darin schwarze Marken | `schwarz`/`surface`, `schwarz`/`weiss` |
| **Freie Marke** | J.3.10–J.3.12 | schwarze Striche ohne Körper | `schwarz`/`surface` |
| **Verbindungsmarke** | J.1 (außer J.1.5, J.1.6), J.2, J.4.8–J.4.11, J.4.14–J.4.17 | schwarze Linien-, Wellen- und Pfeilmarken ohne Körper | `schwarz`/`surface` |

`J.1.5` und `J.1.6` tragen zusätzlich eine weiße Fläche und gehören damit zum Kontrastvertrag der
Gerätekörper.

---

### Task 1: Verifizierte D.3-Ausgangsbasis festnageln

**Files:**
- Modify: keine
- Test: bestehende Suite

**Interfaces:**
- Consumes: nichts
- Produces: einen isolierten Worktree mit grüner D.2-Evidenz als Ausgangspunkt für Task 2

- [ ] **Step 1: Ausgangscommit und sauberen Baum prüfen**

```bash
rtk git status --short
rtk git log --oneline -1
```

Erwartet: leere Statusausgabe; der Commit ist `0451219` oder ein geradliniger Nachfolger.

- [ ] **Step 2: Isolierten Worktree anlegen**

Nutze `superpowers:using-git-worktrees`. Zielbranch: `d3-anhang-j`.

- [ ] **Step 3: Abhängigkeiten installieren**

```bash
rtk pnpm install --frozen-lockfile
```

Erwartet: Erfolg ohne Lockfile-Änderung. pnpm bleibt auf 11.20.0.

- [ ] **Step 4: Grüne Ausgangsbasis belegen**

```bash
rtk pnpm test
rtk pnpm typecheck
rtk pnpm cli coverage
```

Erwartet: Testsuite grün, keine TypeScript-Fehler, `Coverage-Gate bestanden.` mit
`Einträge: 181`, `Offene fachliche Reviews: 195` und Umfang ohne J-Präfixe.

Wenn eine dieser drei Ausgaben abweicht: **abbrechen und melden**. D.3 baut auf grüner D.2-Evidenz
auf; ein rotes Fundament wird nicht überbaut.

- [ ] **Step 5: Ausgangsstand notieren**

Halte die drei Zahlen (181 Einträge, 195 offene Reviews, 56 Testdateien) fest. Task 9 vergleicht
gegen sie.

---

### Task 2: Vertrag und erste vertikale Naht mit J.2

Diese Task legt den gesamten `comms.`-Vertrag an und beweist ihn sofort an den beiden kleinsten
Zeichen des Bestands. Erst wenn zwei Zeichen durch alle Gates laufen, werden die großen
Autorenpakete gebaut.

**Files:**
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/schema/src/pictogram.ts`
- Modify: `packages/catalog/src/pictograms/catalog-definition.ts`
- Modify: `packages/catalog/src/pictograms/index.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`
- Create: `packages/catalog/src/pictograms/comms/authoring.ts`
- Create: `packages/catalog/src/pictograms/comms/02-operating-modes.ts`
- Create: `packages/catalog/src/pictograms/comms/index.ts`
- Test: `packages/catalog/src/pictograms/comms-families.test.ts`

**Interfaces:**
- Consumes: `defineState`, `PictogramContrastPair`, `PictogramPlacement` aus `catalog-definition.ts`
- Produces:
  - `COMMS_IDS: readonly string[]` und `type CommsId` aus `@einsatzzeichen/schema`
  - `defineComms(input: CommsDefinitionInput): CatalogPictogramDefinition`
  - `CommsDefinitionInput` mit den Feldern `section: \`J.${string}\``, `id: CommsId`,
    `variant?: DepictionVariant`, `title: string`, `referenceAsset: \`${string}.svg\``,
    `box: PictogramBox`, `primitives: readonly Primitive[]`,
    `contrastPairs: readonly [PictogramContrastPair, ...PictogramContrastPair[]]`
  - `commsPath`, `commsLine`, `commsPolyline`, `commsCircle`, `commsRect` aus
    `comms/authoring.ts`
  - `COMMS_PICTOGRAMS: readonly CatalogPictogramDefinition[]` aus `comms/index.ts`
  - `COMMS_BLACK_STROKE`, `COMMS_BLACK_FILL`, `COMMS_WHITE_BODY`, `COMMS_STROKE_WIDTH_MM`

- [ ] **Step 1: Den fehlgeschlagenen Test schreiben**

Create `packages/catalog/src/pictograms/comms-families.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { COMMS_PICTOGRAMS } from './comms/index.js';

describe('J-Bestand', () => {
  it('führt jede Darstellung standalone mit deklariertem Kontrast', () => {
    for (const definition of COMMS_PICTOGRAMS) {
      expect(definition.placement.mode).toBe('standalone');
      expect(definition.id.startsWith('comms.')).toBe(true);
      expect(definition.contrastPairs?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('bindet jeden Abschnitt an seine namensgebende Belegdatei', () => {
    for (const definition of COMMS_PICTOGRAMS) {
      expect(definition.referenceAsset.startsWith(`${definition.section}_`)).toBe(true);
    }
  });

  it('liefert die beiden Betriebsarten aus J.2', () => {
    const sections = COMMS_PICTOGRAMS.filter((d) => d.section.startsWith('J.2')).map(
      (d) => d.section,
    );
    expect(sections).toEqual(['J.2.1', 'J.2.2']);
  });
});
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/comms-families.test.ts
```

Erwartet: FAIL — `Cannot find module './comms/index.js'`.

- [ ] **Step 3: `COMMS_IDS` in der Taxonomie anlegen**

In `packages/schema/src/taxonomy.ts`, direkt nach `STATE_IDS` und `StateId`:

```typescript
/** IuK-Zeichen nach Anhang J in verbindlicher Kapitelreihenfolge. */
export const COMMS_IDS = Object.freeze([
  'half-duplex-operation',
  'duplex-operation',
] as const);

export type CommsId = (typeof COMMS_IDS)[number];
```

Die J.1-, J.3- und J.4-Literale kommen in den Tasks 3 bis 8 an ihrer kapitelrichtigen Stelle
hinzu. Kein Literal ohne Definition.

- [ ] **Step 4: `CommsId` in `pictogram.ts` verdrahten**

In `packages/schema/src/pictogram.ts` den Import ergänzen und den `never`-Alias ersetzen:

```typescript
import type { CapabilityId, CommsId, StateId } from './taxonomy.js';
```

Der Block

```typescript
/** Anhang J: IuK. Literale entstehen in D.3. */
export type CommsId = never;
```

entfällt ersatzlos. `DamageId` und `WildfireId` bleiben unverändert `never`; ihr Kommentar wird auf
„Literale entstehen in D.4" gekürzt, wo er noch auf D.3 verweist.

- [ ] **Step 5: `defineComms` und die Abschnittsform ergänzen**

In `packages/catalog/src/pictograms/catalog-definition.ts`:

```typescript
export type PictogramSection = `4.${string}` | `5.8.${string}` | `J.${string}`;
```

Import um `CommsId` erweitern, dann nach `StateDefinitionInput`:

```typescript
export interface CommsDefinitionInput {
  readonly section: `J.${string}`;
  readonly id: CommsId;
  readonly variant?: DepictionVariant;
  readonly title: string;
  readonly referenceAsset: `${string}.svg`;
  readonly box: PictogramBox;
  readonly primitives: readonly Primitive[];
  readonly contrastPairs: readonly [PictogramContrastPair, ...PictogramContrastPair[]];
}

export function defineComms(input: CommsDefinitionInput): CatalogPictogramDefinition {
  return deepFreeze({
    section: input.section,
    id: `comms.${input.id}`,
    variant: input.variant ?? 'primary',
    title: input.title,
    referenceAsset: input.referenceAsset,
    placement: { mode: 'standalone' } as const,
    contrastPairs: structuredClone(input.contrastPairs),
    box: structuredClone(input.box),
    primitives: structuredClone(input.primitives),
  });
}
```

- [ ] **Step 6: `comms/authoring.ts` anlegen**

Create `packages/catalog/src/pictograms/comms/authoring.ts`:

```typescript
import type { Point, Primitive, Style } from '@einsatzzeichen/schema';

export const COMMS_STROKE_WIDTH_MM = 1;

export const COMMS_BLACK_STROKE = Object.freeze({
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: COMMS_STROKE_WIDTH_MM,
} satisfies Style);

export const COMMS_BLACK_FILL = Object.freeze({
  fill: 'schwarz',
  stroke: 'none',
} satisfies Style);

/** Weiße Fläche mit schwarzer Kontur — der Körper der Geräte- und Netzzeichen. */
export const COMMS_WHITE_BODY = Object.freeze({
  fill: 'weiss',
  stroke: 'schwarz',
  strokeWidth: COMMS_STROKE_WIDTH_MM,
} satisfies Style);

function copyStyle(style: Readonly<Style>): Style {
  return { ...style };
}

export function commsPath(d: string, style: Readonly<Style> = COMMS_BLACK_STROKE): Primitive {
  return { type: 'path', role: 'pictogram', d, style: copyStyle(style) };
}

export function commsLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: Readonly<Style> = COMMS_BLACK_STROKE,
): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: copyStyle(style) };
}

export function commsPolyline(
  points: readonly Point[],
  closed = false,
  style: Readonly<Style> = COMMS_BLACK_STROKE,
): Primitive {
  return { type: 'polyline', role: 'pictogram', points, closed, style: copyStyle(style) };
}

export function commsCircle(
  cx: number,
  cy: number,
  r: number,
  style: Readonly<Style> = COMMS_BLACK_STROKE,
): Primitive {
  return { type: 'circle', role: 'pictogram', cx, cy, r, style: copyStyle(style) };
}

export function commsRect(
  x: number,
  y: number,
  width: number,
  height: number,
  style: Readonly<Style> = COMMS_BLACK_STROKE,
  rx?: number,
): Primitive {
  return {
    type: 'rect',
    role: 'pictogram',
    x,
    y,
    width,
    height,
    ...(rx === undefined ? {} : { rx }),
    style: copyStyle(style),
  };
}
```

- [ ] **Step 7: Die beiden J.2-Zeichen konstruieren**

Referenzbefund: Beide Zeichen sind waagerechte Verbindungslinien auf halber Höhe mit Pfeilspitzen
als offene Winkel. `J.2.1_Wechselverkehr.svg` trägt zwei Spitzen, die **zur Mitte hin**
zusammenlaufen (Wechselverkehr: abwechselnd eine Richtung); `J.2.2_Gegenverkehr.svg` trägt zwei
Spitzen, die **nach außen** zeigen (Gegenverkehr: gleichzeitig beide Richtungen). Die Linie läuft
in der Referenz von Rand zu Rand.

Prüfe beide Dateien vor dem Konstruieren visuell und richte Richtung und Anzahl der Spitzen danach
aus. Der Unterschied zwischen den beiden Zeichen liegt allein in der Pfeilrichtung — das ist ein
nichtfarblicher Bedeutungskanal und muss in beiden Themes erkennbar bleiben.

Create `packages/catalog/src/pictograms/comms/02-operating-modes.ts`:

```typescript
import { deepFreeze } from '../../readonly-data.js';
import {
  defineComms,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import { commsLine } from './authoring.js';

const CONNECTION_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Verbindungsmarke auf Ausgabeoberfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

export const OPERATING_MODE_COMMS = deepFreeze([
  defineComms({
    section: 'J.2.1',
    id: 'half-duplex-operation',
    title: 'Wechselverkehr',
    referenceAsset: 'J.2.1_Wechselverkehr.svg',
    box: { xMm: 1, yMm: 12, widthMm: 30, heightMm: 8 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      commsLine(1, 16, 31, 16),
      commsLine(7, 12, 11, 16),
      commsLine(7, 20, 11, 16),
      commsLine(25, 12, 21, 16),
      commsLine(25, 20, 21, 16),
    ],
  }),
  defineComms({
    section: 'J.2.2',
    id: 'duplex-operation',
    title: 'Gegenverkehr',
    referenceAsset: 'J.2.2_Gegenverkehr.svg',
    box: { xMm: 1, yMm: 12, widthMm: 30, heightMm: 8 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      commsLine(1, 16, 31, 16),
      commsLine(11, 12, 7, 16),
      commsLine(11, 20, 7, 16),
      commsLine(21, 12, 25, 16),
      commsLine(21, 20, 25, 16),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
```

Die Koordinaten sind der Startpunkt der eigenen Konstruktion, nicht das Ergebnis. Passe sie nach
dem visuellen Abgleich an und ziehe die `box` auf die tatsächliche Hülle nach.

- [ ] **Step 8: `comms/index.ts` anlegen**

Create `packages/catalog/src/pictograms/comms/index.ts`:

```typescript
import { deepFreeze } from '../../readonly-data.js';
import type { CatalogPictogramDefinition } from '../catalog-definition.js';
import { OPERATING_MODE_COMMS } from './02-operating-modes.js';

export { OPERATING_MODE_COMMS } from './02-operating-modes.js';

export const COMMS_PICTOGRAMS = deepFreeze([
  ...OPERATING_MODE_COMMS,
] satisfies readonly CatalogPictogramDefinition[]);
```

- [ ] **Step 9: In `ALL_PICTOGRAMS` einhängen**

In `packages/catalog/src/pictograms/index.ts`:

```typescript
import { COMMS_PICTOGRAMS } from './comms/index.js';

export const ALL_PICTOGRAMS: readonly CatalogPictogramDefinition[] = deepFreeze([
  ...CAPABILITY_PICTOGRAMS,
  ...STATE_PICTOGRAMS,
  ...COMMS_PICTOGRAMS,
]);

export { COMMS_PICTOGRAMS } from './comms/index.js';
```

Den Kommentar über `ALL_PICTOGRAMS` anpassen: `comms.` ist nicht mehr angekündigt, sondern
vorhanden.

- [ ] **Step 10: Ledgerplätze anlegen**

In `packages/catalog/src/domain-reviews.ts`, in `MANIFEST_DOMAIN_REVIEWS`:

```typescript
  'bbk-babz-2025:J.2.1#primary': { status: 'pending' },
  'bbk-babz-2025:J.2.2#primary': { status: 'pending' },
```

- [ ] **Step 11: Tests laufen lassen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/comms-families.test.ts
rtk pnpm test
rtk pnpm typecheck
```

Erwartet: alles grün. Die Snapshot-Tests erzeugen zwei neue Dateien unter
`packages/catalog/src/__snapshots__/` und `packages/catalog/src/pictograms/__snapshots__/`; prüfe
sie visuell, bevor du sie committest.

- [ ] **Step 12: Coverage-CLI prüfen**

```bash
rtk pnpm cli coverage
```

Erwartet: `Einträge: 183`, `Offene fachliche Reviews: 197`, `Coverage-Gate bestanden.` Der Umfang
enthält **noch keine** J-Präfixe — das ist beabsichtigt und wird in Task 9 nachgezogen.

- [ ] **Step 13: Commit**

```bash
rtk git add packages/schema/src packages/catalog/src
rtk git commit -m "feat(catalog): comms-Vertrag und die beiden Betriebsarten aus J.2"
```

---

### Task 3: J.3.1–J.3.8 — Gerätekörper (8 IDs, 8 Darstellungen)

**Files:**
- Create: `packages/catalog/src/pictograms/comms/03-devices.ts`
- Modify: `packages/schema/src/taxonomy.ts` (acht Literale **nach** `duplex-operation`)
- Modify: `packages/catalog/src/pictograms/comms/index.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`
- Test: `packages/catalog/src/pictograms/comms-families.test.ts`

**Interfaces:**
- Consumes: `defineComms`, `commsPath`, `commsLine`, `commsRect`, `commsCircle`,
  `COMMS_WHITE_BODY`, `COMMS_BLACK_FILL`, `COMMS_BLACK_STROKE`
- Produces: `DEVICE_COMMS: readonly CatalogPictogramDefinition[]` aus `03-devices.ts`

**Referenzbefund und Konstruktionsauftrag:**

Alle acht Zeichen teilen einen Körper: eine weiße Fläche mit schwarzer Kontur, mittig auf der
32 × 32-mm-Fläche. `J.3.1` ist das Grundzeichen und trägt **nur** diesen Körper. Die übrigen sieben
unterscheiden sich von ihm **durch ihr Kürzel**, nicht durch Marken.

> **Korrektur vom 10. August.** Die ursprüngliche Tabelle las „Körper + 2/3/6 Marken" aus den
> Referenzen und leitete daraus Aufträge wie „Antennenmarke", „Wiederholermarke" oder
> „Handsprechfunkgerät" ab. Diese Zahlen waren die **Glyphenzahlen**: J.3.2 = „BS" = 2, J.3.4 =
> „TMO" + „DMO" = 6, J.3.6 = „HRT" = 3. Keine dieser Marken existiert in der Referenz. Ein früherer
> Commit dieses Branches hat sie erfunden und wurde zurückgerollt
> (Tag `archiv/d3-erfundene-marken-zurueckgerollt`).
>
> Der Beleg ist zwingend: Entfernt man die Glyphen, sind `J.3.6`, `J.3.7` und `J.3.8` geometrisch
> **identisch** — dreimal dasselbe leere Quadrat. Erfundene Marken erzeugten hier drei Zeichen, die
> die Baseline nicht kennt, in einem Katalog, dessen Zweck belegte Quellentreue ist.

| Abschnitt | Referenzstruktur | Konstruktionsauftrag |
|---|---|---|
| J.3.1 | Körper allein | weißes Quadrat mit schwarzer Kontur, mittig |
| J.3.2 | **Kreiskörper + Giebelmarke** + „BS" | Am Bild bestätigt: weißer Kreis (`<circle r="34.016">`), darüber zwei nach oben zusammenlaufende Schrägen wie ein Dach, im Kreis das Kürzel. **Kein Quadrat** — die alte Tabelle war hier falsch. Ein Lauf, ~10,2 mm |
| J.3.3 | Körper + drei Glyphen | Kürzel am Referenzbild ablesen, ein Lauf, ~10,2 mm |
| J.3.4 | Körper + „TMO" oben + „DMO" unten | **zwei** Läufe, je ~6,8 mm, jeder mit eigener `boxMm` |
| J.3.5 | Körper + „DMO" | ein Lauf, ~6,8 mm |
| J.3.6 | Körper + „HRT" | ein Lauf, ~10,2 mm |
| J.3.7 | Körper + „MRT" | ein Lauf, ~10,2 mm |
| J.3.8 | Körper + „FRT" | ein Lauf, ~10,2 mm |

Die Kürzel werden **am rasterisierten Referenzbild** abgelesen und als `text`-Primitiv gesetzt, nie
als Pfad nachgezeichnet. Jeder Lauf deklariert seine `boxMm` und sein `minRenderPx`. Die
Schriftgrade oben sind aus den Kaphöhen der Typo-Gruppe umgerechnet und beim Konstruieren am Bild
zu bestätigen — sie sind Ausgangswerte, keine Messvorgabe.

Für die Kürzel gilt zusätzlich `MINIMUM_TEXT_CONTRAST = 4.5`. Bei `schwarz` auf `weiss` (21:1) ist
das folgenlos, auch in `print-monochrome`.

- [ ] **Step 1: Den fehlgeschlagenen Test schreiben**

In `packages/catalog/src/pictograms/comms-families.test.ts` ergänzen:

```typescript
  it('liefert die acht Gerätekörper J.3.1 bis J.3.8', () => {
    const sections = COMMS_PICTOGRAMS.filter((d) => d.section.startsWith('J.3.')).map(
      (d) => d.section,
    );
    expect(sections).toEqual([
      'J.3.1',
      'J.3.2',
      'J.3.3',
      'J.3.4',
      'J.3.5',
      'J.3.6',
      'J.3.7',
      'J.3.8',
    ]);
  });

  it('deklariert für jeden Gerätekörper beide Farbnachbarschaften', () => {
    const devices = COMMS_PICTOGRAMS.filter((d) => d.section.startsWith('J.3.'));
    expect(devices.length).toBeGreaterThan(0);
    for (const device of devices) {
      const pairs = device.contrastPairs ?? [];
      expect(pairs.some((p) => p.foreground === 'schwarz' && p.background === 'surface')).toBe(true);
      expect(pairs.some((p) => p.foreground === 'schwarz' && p.background === 'weiss')).toBe(true);
    }
  });

  it('unterscheidet die sieben Gerätezeichen durch ihr Kürzel vom Grundzeichen J.3.1', () => {
    const base = COMMS_PICTOGRAMS.find((d) => d.section === 'J.3.1');
    const others = COMMS_PICTOGRAMS.filter(
      (d) => d.section.startsWith('J.3.') && d.section !== 'J.3.1',
    );
    expect(base).toBeDefined();
    expect(base!.primitives.some((p) => p.type === 'text')).toBe(false);
    // Der Unterschied liegt im Kürzel, nicht in der Primitivzahl: J.3.6, J.3.7 und J.3.8 sind
    // ohne ihre Glyphen dieselbe Geometrie. Ein Test auf primitives.length wäre auch dann grün,
    // wenn jemand statt der Kürzel wieder Marken erfindet — genau der zurückgerollte Fehler.
    const kuerzel = others.map(
      (d) => d.primitives.filter((p) => p.type === 'text').map((p) => p.content).join(' '),
    );
    expect(kuerzel.every((k) => k.length > 0)).toBe(true);
    expect(new Set(kuerzel).size).toBe(others.length);
  });
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/comms-families.test.ts
```

Erwartet: FAIL — die J.3-Abschnittsliste ist leer.

- [ ] **Step 3: Referenzen visuell prüfen**

Rasterisiere die acht Belegdateien und sieh sie an. Halte je Zeichen fest: welche Marke, wo, wie
groß, wie unterscheidet sie sich von den Nachbarn.

- [ ] **Step 4: Acht Literale in `COMMS_IDS` einfügen**

In `packages/schema/src/taxonomy.ts`, **nach** `'duplex-operation'`. J.1 wird in Task 7 vorn
eingefügt; die Kapitelreihenfolge wird in Task 9 abschließend geprüft:

```typescript
  'telecom-device',
  'base-station',
  'mobile-base-station',
  'gateway',
  'repeater',
  'handheld-radio-terminal',
  'mobile-radio-terminal',
  'fixed-radio-terminal',
```

- [ ] **Step 5: `03-devices.ts` anlegen**

Create `packages/catalog/src/pictograms/comms/03-devices.ts` nach diesem Muster. Das Grundzeichen
ist vollständig ausgeführt; die übrigen sieben folgen derselben Form mit eigenen Marken:

```typescript
import { deepFreeze } from '../../readonly-data.js';
import {
  defineComms,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import { commsRect, COMMS_WHITE_BODY } from './authoring.js';

const DEVICE_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Kontur des Gerätekörpers auf der Ausgabeoberfläche',
  },
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Kontur und Marke auf dem Gerätekörper',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

/** Weißes Quadrat mit schwarzer Kontur — gemeinsamer Körper aller J.3-Gerätezeichen. */
function deviceBody() {
  return commsRect(4, 4, 24, 24, COMMS_WHITE_BODY);
}

export const DEVICE_COMMS = deepFreeze([
  defineComms({
    section: 'J.3.1',
    id: 'telecom-device',
    title: 'Fernmeldegerät (Grundzeichen)',
    referenceAsset: 'J.3.1_Fernmeldegerät Grundzeichen.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: DEVICE_CONTRAST,
    primitives: [deviceBody()],
  }),
  // J.3.2 bis J.3.8 folgen: deviceBody() plus die je eigene Marke aus Step 3.
] satisfies readonly CatalogPictogramDefinition[]);
```

Die Box jedes Zeichens umfasst Körper **und** Marken. Ragt eine Marke über den Körper hinaus, wird
die Box entsprechend größer deklariert.

- [ ] **Step 6: In `comms/index.ts` einhängen**

```typescript
import { DEVICE_COMMS } from './03-devices.js';
export { DEVICE_COMMS } from './03-devices.js';

export const COMMS_PICTOGRAMS = deepFreeze([
  ...OPERATING_MODE_COMMS,
  ...DEVICE_COMMS,
] satisfies readonly CatalogPictogramDefinition[]);
```

- [ ] **Step 7: Acht Ledgerplätze anlegen**

In `packages/catalog/src/domain-reviews.ts`:

```typescript
  'bbk-babz-2025:J.3.1#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.2#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.3#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.4#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.5#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.6#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.7#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.8#primary': { status: 'pending' },
```

- [ ] **Step 8: Tests laufen lassen**

```bash
rtk pnpm test
rtk pnpm typecheck
rtk pnpm cli coverage
```

Erwartet: grün, `Einträge: 191`, `Offene fachliche Reviews: 205`.

- [ ] **Step 9: Snapshots visuell prüfen**

Sieh die acht neuen Snapshots an. Prüfe: Körper mittig, Marken innerhalb der ViewBox, die sieben
Zeichen untereinander eindeutig unterscheidbar.

Lege alle acht nebeneinander — sie teilen denselben Körper und dürfen sich allein über die Marke
unterscheiden. Prüfe das auch in der Print-Monochrome-Ansicht, bevor du committest.

- [ ] **Step 10: Commit**

```bash
rtk git add packages/schema/src packages/catalog/src
rtk git commit -m "feat(catalog): Fernmeldebetriebsmittel J.3.1 bis J.3.8"
```

---

### Task 4: J.3.9–J.3.15 — Freie Marken und Vermittlung (7 IDs, 7 Darstellungen)

**Files:**
- Modify: `packages/catalog/src/pictograms/comms/03-devices.ts`
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`
- Test: `packages/catalog/src/pictograms/comms-families.test.ts`

**Interfaces:**
- Consumes: `deviceBody()` und `DEVICE_CONTRAST` aus Task 3, `commsPolyline`, `commsLine`,
  `COMMS_BLACK_STROKE`
- Produces: `DEVICE_COMMS` wächst auf 15 Einträge

**Referenzbefund und Konstruktionsauftrag:**

Diese Gruppe zerfällt in zwei Familien.

| Abschnitt | Familie | Konstruktionsauftrag |
|---|---|---|
| J.3.9 | Gerätekörper | Körper + Kürzel „APRT", ein Lauf, ~10,2 mm |
| J.3.10 Antenne | freie Marke | senkrechter Mast mit zwei nach oben gespreizten Schrägen, **kein** Körper |
| J.3.11 Kabelbau | freie Marke | Kabelmarke ohne Körper |
| J.3.12 Funk | freie Marke | Funkmarke ohne Körper |
| J.3.13 Übergänge | Gerätekörper | Körper + Übergangsmarke |
| J.3.14 Fernsprechvermittlung | Gerätekörper | Körper + waagerechter Überstrich (`line`) + Textlauf „C" darunter (~14,4 mm). Der Überstrich ist Geometrie, nur das „C" ist Text |
| J.3.15 Fernsprechvermittlung VoIP | Gerätekörper | **identisch zu J.3.14**, zusätzlich der Textlauf „VoIP" unten links (~4,1 mm). Zwei Läufe |

**Am Bild geklärt (10. August): J.3.14 trägt ein Kürzel, es sind 17 typografische Darstellungen.**
Beide Zeichen sind ein Quadrat mit einem großen „C" unter einem waagerechten Überstrich. J.3.15
fügt dem nichts hinzu außer dem Wort „VoIP" unten links. Der in der Entscheidungsnotiz behauptete
kleine geometrische Unterschied sind Rundungsstellen (`28.346` gegen `28.347`); der tatsächliche
Unterschied liegt **vollständig** in der Beschriftung.

Damit entfällt der ursprüngliche Auftrag „Körper + Vermittlungsmarke" für J.3.14 — eine solche Marke
gibt es nicht. Der Überstrich ist keine Marke, sondern das Makron über dem „C"; er wird als eigene
`line` konstruiert, weil er außerhalb der Typo-Gruppe der Referenz liegt.

- [ ] **Step 1: Den fehlgeschlagenen Test schreiben**

In `comms-families.test.ts` die J.3-Abschnittsliste aus Task 3 auf alle 15 erweitern und ergänzen:

```typescript
  it('führt die drei freien Marken ohne weiße Fläche', () => {
    for (const section of ['J.3.10', 'J.3.11', 'J.3.12']) {
      const mark = COMMS_PICTOGRAMS.find((d) => d.section === section);
      expect(mark, section).toBeDefined();
      const pairs = mark!.contrastPairs ?? [];
      expect(pairs).toHaveLength(1);
      expect(pairs[0]!.foreground).toBe('schwarz');
      expect(pairs[0]!.background).toBe('surface');
    }
  });
```

Die bestehende Prüfung „deklariert für jeden Gerätekörper beide Farbnachbarschaften" muss dabei auf
die Gerätekörper eingeschränkt werden — sie darf J.3.10 bis J.3.12 nicht mehr erfassen.

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/comms-families.test.ts
```

Erwartet: FAIL — die sieben Abschnitte fehlen.

- [ ] **Step 3: `CONNECTION_CONTRAST` nach `authoring.ts` ziehen**

Verschiebe die Konstante aus `02-operating-modes.ts` nach `comms/authoring.ts` und exportiere sie.
`02-operating-modes.ts` importiert sie von dort. Führe `rtk pnpm test` aus, um zu belegen, dass die
Verschiebung nichts verändert.

- [ ] **Step 4: Referenzen visuell prüfen**

Rasterisiere die sieben Belegdateien. Achte besonders auf J.3.14 gegen J.3.15 — sie müssen sich
ohne Beschriftung unterscheiden.

- [ ] **Step 5: Sieben Literale in `COMMS_IDS` einfügen**

Direkt nach `'fixed-radio-terminal'`:

```typescript
  'active-paging-radio-terminal',
  'antenna',
  'cable-construction',
  'radio',
  'transitions',
  'telephone-exchange',
  'telephone-exchange-voip',
```

- [ ] **Step 6: Sieben Definitionen in `03-devices.ts` ergänzen**

Muster für eine freie Marke:

```typescript
  defineComms({
    section: 'J.3.10',
    id: 'antenna',
    title: 'Antenne',
    referenceAsset: 'J.3.10_Antenne.svg',
    box: { xMm: 6, yMm: 2, widthMm: 20, heightMm: 28 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      commsLine(16, 2, 16, 30),
      commsLine(16, 12, 6, 2),
      commsLine(16, 12, 26, 2),
    ],
  }),
```

Die Koordinaten sind der Startpunkt, nicht das Ergebnis: passe sie nach dem visuellen Abgleich an
und ziehe die `box` auf die tatsächliche Hülle nach.

- [ ] **Step 7: Sieben Ledgerplätze anlegen**

```typescript
  'bbk-babz-2025:J.3.9#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.10#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.11#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.12#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.13#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.14#primary': { status: 'pending' },
  'bbk-babz-2025:J.3.15#primary': { status: 'pending' },
```

- [ ] **Step 8: Tests laufen lassen**

```bash
rtk pnpm test
rtk pnpm typecheck
rtk pnpm cli coverage
```

Erwartet: grün, `Einträge: 198`, `Offene fachliche Reviews: 212`.

- [ ] **Step 9: Snapshots visuell prüfen**

Kritisches Paar dieser Task: **J.3.14 gegen J.3.15**. Beide sind Fernsprechvermittlung; der
Unterschied ist allein die VoIP-Kennzeichnung. Lege sie nebeneinander, auch in
Print-Monochrome.

- [ ] **Step 10: Commit**

```bash
rtk git add packages/schema/src packages/catalog/src
rtk git commit -m "feat(catalog): freie Marken und Vermittlung J.3.9 bis J.3.15"
```

---

### Task 5: J.4.1–J.4.7 — Netzkörper (7 IDs, 7 Darstellungen)

**Files:**
- Create: `packages/catalog/src/pictograms/comms/04-network.ts`
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/pictograms/comms/index.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`
- Test: `packages/catalog/src/pictograms/comms-families.test.ts`

**Interfaces:**
- Consumes: `defineComms`, `commsCircle`, `commsRect`, `commsPath`, `COMMS_WHITE_BODY`,
  `DEVICE_CONTRAST`-Form (hier als eigenes `NETWORK_CONTRAST`)
- Produces: `NETWORK_COMMS: readonly CatalogPictogramDefinition[]` aus `04-network.ts`

**Referenzbefund und Konstruktionsauftrag:**

Alle sieben Zeichen tragen eine weiße Fläche mit schwarzer Kontur und darin eine schwarze Marke.
Die **Form der Fläche unterscheidet die Familien**:

| Abschnitt | Fläche | Konstruktionsauftrag |
|---|---|---|
| J.4.1 Router | Kreis | Kreis mit Wegemarke |
| J.4.2 Switch | Kreis oder Quadrat — am Bild prüfen | Fläche mit Vermittlungsmarke |
| J.4.3 Server | Quadrat | Quadrat mit vier waagerechten Balken links und einer Spitze rechts |
| J.4.4 Access Point | am Bild prüfen | Fläche mit Funkmarke |
| J.4.5 WAN | Wolkenform | wolkenförmige weiße Fläche mit schwarzer Kontur |
| J.4.6 Firewall | am Bild prüfen | Fläche mit Sperrmarke |
| J.4.7 Drucker | am Bild prüfen | Fläche mit Druckermarke |

Die Wolkenform von J.4.5 ist mit `C`-Segmenten zu konstruieren; sie ist das einzige Zeichen des
Bestands mit gekrümmter Außenkontur ohne Kreis.

- [ ] **Step 1: Den fehlgeschlagenen Test schreiben**

```typescript
  it('liefert die sieben Netzkörper J.4.1 bis J.4.7', () => {
    const sections = COMMS_PICTOGRAMS.filter((d) => d.section.startsWith('J.4.')).map(
      (d) => d.section,
    );
    expect(sections).toEqual(['J.4.1', 'J.4.2', 'J.4.3', 'J.4.4', 'J.4.5', 'J.4.6', 'J.4.7']);
  });

  it('deklariert für jeden Netzkörper beide Farbnachbarschaften', () => {
    for (const section of ['J.4.1', 'J.4.2', 'J.4.3', 'J.4.4', 'J.4.5', 'J.4.6', 'J.4.7']) {
      const body = COMMS_PICTOGRAMS.find((d) => d.section === section);
      expect(body, section).toBeDefined();
      const pairs = body!.contrastPairs ?? [];
      expect(pairs.some((p) => p.foreground === 'schwarz' && p.background === 'surface')).toBe(true);
      expect(pairs.some((p) => p.foreground === 'schwarz' && p.background === 'weiss')).toBe(true);
    }
  });
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/comms-families.test.ts
```

Erwartet: FAIL — die J.4-Abschnittsliste ist leer.

- [ ] **Step 3: Referenzen visuell prüfen**

Rasterisiere die sieben Belegdateien und halte je Zeichen Flächenform und Markenform fest.

- [ ] **Step 4: Sieben Literale in `COMMS_IDS` einfügen**

Nach `'telephone-exchange-voip'`, dem letzten J.3-Literal:

```typescript
  'router',
  'network-switch',
  'server',
  'access-point',
  'wan',
  'firewall',
  'printer',
```

- [ ] **Step 5: `04-network.ts` anlegen**

```typescript
import { deepFreeze } from '../../readonly-data.js';
import {
  defineComms,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import { commsCircle, commsPath, commsRect, COMMS_BLACK_FILL, COMMS_WHITE_BODY } from './authoring.js';

const NETWORK_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Kontur des Netzkörpers auf der Ausgabeoberfläche',
  },
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Kontur und Marke auf dem Netzkörper',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

export const NETWORK_COMMS = deepFreeze([
  defineComms({
    section: 'J.4.1',
    id: 'router',
    title: 'Router',
    referenceAsset: 'J.4.1_Router.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      commsCircle(16, 16, 12, COMMS_WHITE_BODY),
      // Wegemarke aus Step 3
    ],
  }),
  // J.4.2 bis J.4.7
] satisfies readonly CatalogPictogramDefinition[]);
```

- [ ] **Step 6: In `comms/index.ts` einhängen**

```typescript
import { NETWORK_COMMS } from './04-network.js';
export { NETWORK_COMMS } from './04-network.js';

export const COMMS_PICTOGRAMS = deepFreeze([
  ...OPERATING_MODE_COMMS,
  ...DEVICE_COMMS,
  ...NETWORK_COMMS,
] satisfies readonly CatalogPictogramDefinition[]);
```

- [ ] **Step 7: Sieben Ledgerplätze anlegen**

```typescript
  'bbk-babz-2025:J.4.1#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.2#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.3#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.4#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.5#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.6#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.7#primary': { status: 'pending' },
```

- [ ] **Step 8: Tests laufen lassen**

```bash
rtk pnpm test
rtk pnpm typecheck
rtk pnpm cli coverage
```

Erwartet: grün, `Einträge: 205`, `Offene fachliche Reviews: 219`.

- [ ] **Step 9: Snapshots visuell prüfen**

Prüfe die sieben Netzkörper nebeneinander: die Flächenform (Kreis, Quadrat, Wolke) muss die erste
Unterscheidung tragen, die Marke die zweite. Auch in Print-Monochrome.

- [ ] **Step 10: Commit**

```bash
rtk git add packages/schema/src packages/catalog/src
rtk git commit -m "feat(catalog): Netzkörper J.4.1 bis J.4.7"
```

---

### Task 6: J.4.8–J.4.17 — Verbindungs- und Kabelmarken (10 IDs, 10 Darstellungen)

**Files:**
- Modify: `packages/catalog/src/pictograms/comms/04-network.ts`
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`
- Test: `packages/catalog/src/pictograms/comms-families.test.ts`

**Interfaces:**
- Consumes: `CONNECTION_CONTRAST` aus `authoring.ts`, `commsLine`, `commsPolyline`, `commsPath`,
  `commsCircle`
- Produces: `NETWORK_COMMS` wächst auf 17 Einträge

**Referenzbefund und Konstruktionsauftrag:**

Zehn Marken ohne Fläche. Zwei tragen in der Referenz Ausnahmen, die **nicht** übernommen werden:

| Abschnitt | Konstruktionsauftrag |
|---|---|
| J.4.8 Längenverbindung | **am Bild korrigiert:** waagerechte Linie, darauf ein kurzer senkrechter Strich, darunter ein nach oben zeigender Pfeil auf diesen Strich — **kein Doppelpfeil**. Rechts daneben das „L" als Textlauf (~6,8 mm). **Kein Wertplatzhalter**: das Bild enthält keine Zahl, „L" bezeichnet die Größe Länge |
| J.4.9 Abholpunkt | Linienmarke für den Abholpunkt |
| J.4.10 Anschlusspunkt | Linienmarke für den Anschlusspunkt, von J.4.9 unterscheidbar |
| J.4.11 Kreuzung von Verbindungen | waagerechte und senkrechte Linie, die sich mit einem Bogen ausweichen — die Kreuzung ohne Verbindung |
| J.4.12 Verteiler | Verteilermarke |
| J.4.13 Verteiler mit Überspannungsschutz | wie J.4.12 mit Zusatzmarke |
| J.4.14 Kabel, temporär verlegt | waagerechte Linie mit zwei senkrechten Querstrichen |
| J.4.15 Glasfaser, temporär verlegt | wie J.4.14, andere Anzahl oder Form der Querstriche |
| J.4.16 Netzwerkkabel, temporär verlegt | wie J.4.14, wieder andere Querstrichform |
| J.4.17 Anzahl Doppeladern | **am Bild korrigiert:** waagerechte Linie mit **einem** Schrägstrich, nicht zwei. Die „8" darüber ist ein Wertplatzhalter (die Anzahl selbst) und wird **nicht** gezeichnet — auch nicht als Text: `content` ist ein festes `string`-Feld, eine gesetzte „8" erklärte denselben Beispielwert zur Zeichenbedeutung |

J.4.14, J.4.15 und J.4.16 sind die kritische Gruppe: drei Kabelarten, die sich allein über die
Querstrichmarke unterscheiden. Prüfe alle drei nebeneinander, bevor du konstruierst. Dasselbe gilt
für J.4.9 gegen J.4.10.

`J.4.12` und `J.4.13` tragen laut Strukturbefund eine weiße Fläche und gehören damit zu
`NETWORK_CONTRAST`, nicht zu `CONNECTION_CONTRAST`. Prüfe das am Bild und wähle den Kontraktvertrag
entsprechend.

- [ ] **Step 1: Den fehlgeschlagenen Test schreiben**

Erweitere die J.4-Abschnittsliste auf alle 17 und ergänze:

```typescript
  it('zeichnet in J.4.17 keinen Wertplatzhalter', () => {
    // Nur J.4.17. J.4.8 traegt seit dem Textprimitiv das feste L als Textlauf; die beiden Faelle
    // sind auseinandergefallen, siehe Spec 2.4.
    for (const section of ['J.4.17']) {
      const mark = COMMS_PICTOGRAMS.find((d) => d.section === section);
      expect(mark, section).toBeDefined();
      expect(mark!.primitives.some((p) => p.type === 'text'), section).toBe(false);
      // Beschriftungsglyphen der Referenz bleiben weg; die Trägergeometrie kommt mit wenigen
      // Primitiven aus. Eine nachgezeichnete Glyphe wäre daran erkennbar, dass sie diese
      // Grenze sprengt.
      expect(mark!.primitives.length).toBeLessThanOrEqual(8);
    }
  });

  it('unterscheidet die drei temporären Kabelarten voneinander', () => {
    const cables = ['J.4.14', 'J.4.15', 'J.4.16'].map((section) =>
      COMMS_PICTOGRAMS.find((d) => d.section === section),
    );
    for (const cable of cables) expect(cable).toBeDefined();
    const shapes = cables.map((c) => JSON.stringify(c!.primitives));
    expect(new Set(shapes).size).toBe(3);
  });
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/comms-families.test.ts
```

Erwartet: FAIL — die zehn Abschnitte fehlen.

- [ ] **Step 3: Referenzen visuell prüfen**

Rasterisiere alle zehn Belegdateien. Lege J.4.14, J.4.15 und J.4.16 nebeneinander, ebenso J.4.9 und
J.4.10.

- [ ] **Step 4: Zehn Literale in `COMMS_IDS` einfügen**

Nach `'printer'`:

```typescript
  'connection-length',
  'pickup-point',
  'connection-point',
  'connection-crossing',
  'distributor',
  'distributor-with-surge-protection',
  'cable-temporary',
  'fiber-optic-temporary',
  'network-cable-temporary',
  'twisted-pair-count',
```

- [ ] **Step 5: Zehn Definitionen in `04-network.ts` ergänzen**

Muster für eine Kabelmarke:

```typescript
  defineComms({
    section: 'J.4.14',
    id: 'cable-temporary',
    title: 'Kabel, temporär verlegt',
    referenceAsset: 'J.4.14_Kabel_temporär verlegt.svg',
    box: { xMm: 1, yMm: 11, widthMm: 30, heightMm: 10 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      commsLine(1, 16, 31, 16),
      commsLine(6, 11, 6, 21),
      commsLine(26, 11, 26, 21),
    ],
  }),
```

Die Koordinaten sind der Startpunkt, nicht das Ergebnis.

- [ ] **Step 6: Zehn Ledgerplätze anlegen**

```typescript
  'bbk-babz-2025:J.4.8#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.9#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.10#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.11#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.12#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.13#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.14#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.15#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.16#primary': { status: 'pending' },
  'bbk-babz-2025:J.4.17#primary': { status: 'pending' },
```

- [ ] **Step 7: Tests laufen lassen**

```bash
rtk pnpm test
rtk pnpm typecheck
rtk pnpm cli coverage
```

Erwartet: grün, `Einträge: 215`, `Offene fachliche Reviews: 229`.

- [ ] **Step 8: Snapshots visuell prüfen**

Prüfe insbesondere die drei Kabelarten nebeneinander in der Print-Monochrome-Ansicht.

- [ ] **Step 9: Commit**

```bash
rtk git add packages/schema/src packages/catalog/src
rtk git commit -m "feat(catalog): Verbindungs- und Kabelmarken J.4.8 bis J.4.17"
```

---

### Task 7: J.1.1–J.1.7 — Sprache und Sprechfunk (7 IDs, 8 Darstellungen)

**Files:**
- Create: `packages/catalog/src/pictograms/comms/01-connections.ts`
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/pictograms/comms/index.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`
- Test: `packages/catalog/src/pictograms/comms-families.test.ts`

**Interfaces:**
- Consumes: `CONNECTION_CONTRAST`, `commsLine`, `commsPath`, `commsPolyline`, `COMMS_WHITE_BODY`
- Produces: `CONNECTION_COMMS: readonly CatalogPictogramDefinition[]` aus `01-connections.ts`

**Referenzbefund und Konstruktionsauftrag:**

Diese Gruppe trägt die erste `alternative` des Slice und den zentralen Bedeutungsträger des
Unterkapitels.

**Die Wellenlinie ist der Marker für „nicht leitergebunden".** `J.1.1_Sprache.svg` besteht aus
einem waagerechten Balken **und** einer Wellenlinie darunter; `J.1.1_Sprache_leitergebunden.svg`
besteht nur aus dem Balken. Diese Regel gilt für alle fünf Paare des Unterkapitels.

| Abschnitt | Darstellungen | Konstruktionsauftrag |
|---|---|---|
| J.1.1 | primary + alternative | primary: waagerechter Balken + Wellenlinie. alternative: nur der Balken |
| J.1.2 | primary | Sprechfunk: Balken, Wellenlinie und Zusatzmarke |
| J.1.3 | primary | wie J.1.2, dazu der Textlauf „DMO" (~6,8 mm) |
| J.1.4 | primary | wie J.1.2, dazu der Textlauf „TMO" (~6,8 mm) — der Unterschied zu J.1.3 ist genau dieses Kürzel |
| J.1.5 | primary | SDS im DMO — weiße Fläche, deshalb `DEVICE_CONTRAST`-Form. **Zwei** Textläufe: „SDS" im Körper (~6,8 mm), „DMO" darunter (~10,2 mm), je eigene `boxMm` |
| J.1.6 | primary | SDS im TMO — weiße Fläche. **Zwei** Läufe: „SDS" und „TMO"; der Unterschied zu J.1.5 liegt allein im zweiten Kürzel |
| J.1.7 | primary | Sprechfunk im DMO über Repeater: Repeatergeometrie plus Textlauf „DMO" (~10,2 mm, größer als in J.1.3) |

J.1.3 gegen J.1.4 und J.1.5 gegen J.1.6 sind die kritischen Paare: DMO und TMO unterscheiden sich
in der Referenz allein durch **das Kürzel**, nicht durch eine Marke. Prüfe sie nebeneinander —
insbesondere, ob beide Kürzel bei ihrem Schriftgrad in jeder beanspruchten Rendergröße
auseinanderzuhalten sind. Genau diese Frage beantwortet `minRenderPx`.

- [ ] **Step 1: Den fehlgeschlagenen Test schreiben**

```typescript
  it('liefert J.1.1 bis J.1.7 mit genau einer alternative', () => {
    const group = COMMS_PICTOGRAMS.filter(
      (d) => d.section.startsWith('J.1.') && Number(d.section.split('.')[2]) <= 7,
    );
    expect(group).toHaveLength(8);
    const alternatives = group.filter((d) => d.variant === 'alternative');
    expect(alternatives.map((d) => d.section)).toEqual(['J.1.1']);
  });

  it('zeichnet die leitergebundene Fassung ohne die Wellenlinie', () => {
    const primary = COMMS_PICTOGRAMS.find(
      (d) => d.section === 'J.1.1' && d.variant === 'primary',
    );
    const wired = COMMS_PICTOGRAMS.find(
      (d) => d.section === 'J.1.1' && d.variant === 'alternative',
    );
    expect(primary).toBeDefined();
    expect(wired).toBeDefined();
    // Die Wellenlinie ist der Marker für "nicht leitergebunden": die drahtlose Fassung trägt
    // mindestens ein Primitiv mehr.
    expect(wired!.primitives.length).toBeLessThan(primary!.primitives.length);
  });
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/comms-families.test.ts
```

Erwartet: FAIL — die J.1-Gruppe ist leer.

- [ ] **Step 3: Referenzen visuell prüfen**

Rasterisiere die acht Belegdateien. Lege J.1.1 primary und alternative nebeneinander, ebenso
J.1.3/J.1.4 und J.1.5/J.1.6.

- [ ] **Step 4: Sieben Literale an den Anfang von `COMMS_IDS` setzen**

Vor `'half-duplex-operation'`, also an den Listenanfang — die Kapitelreihenfolge beginnt mit J.1:

```typescript
  'voice',
  'voice-radio',
  'voice-radio-dmo',
  'voice-radio-tmo',
  'sds-dmo',
  'sds-tmo',
  'voice-radio-dmo-repeater',
```

- [ ] **Step 5: `01-connections.ts` anlegen**

Das Muster zeigt beide Fassungen von J.1.1:

```typescript
import { deepFreeze } from '../../readonly-data.js';
import {
  defineComms,
  type CatalogPictogramDefinition,
} from '../catalog-definition.js';
import { commsLine, commsPath, CONNECTION_CONTRAST } from './authoring.js';

/** Wellenlinie unter dem Balken — Marker für "nicht leitergebunden". */
function radioWave(): ReturnType<typeof commsPath> {
  return commsPath('M 4 21 L 8 17 L 12 21 L 16 17 L 20 21 L 24 17 L 28 21');
}

export const CONNECTION_COMMS = deepFreeze([
  defineComms({
    section: 'J.1.1',
    id: 'voice',
    title: 'Sprache',
    referenceAsset: 'J.1.1_Sprache.svg',
    box: { xMm: 3, yMm: 13, widthMm: 26, heightMm: 8 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [commsLine(3, 13, 29, 13), radioWave()],
  }),
  defineComms({
    section: 'J.1.1',
    id: 'voice',
    variant: 'alternative',
    title: 'Sprache, leitergebunden',
    referenceAsset: 'J.1.1_Sprache_leitergebunden.svg',
    box: { xMm: 3, yMm: 16, widthMm: 26, heightMm: 0 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [commsLine(3, 16, 29, 16)],
  }),
  // J.1.2 bis J.1.7
] satisfies readonly CatalogPictogramDefinition[]);
```

Beachte: Beide Definitionen tragen **dieselbe** `id` und **dieselbe** `section`; sie unterscheiden
sich allein in `variant` und `referenceAsset`. Das ist der Kern der Modellierungsentscheidung aus
Abschnitt 2.1 der Spec.

- [ ] **Step 6: In `comms/index.ts` an erster Stelle einhängen**

```typescript
import { CONNECTION_COMMS } from './01-connections.js';
export { CONNECTION_COMMS } from './01-connections.js';

export const COMMS_PICTOGRAMS = deepFreeze([
  ...CONNECTION_COMMS,
  ...OPERATING_MODE_COMMS,
  ...DEVICE_COMMS,
  ...NETWORK_COMMS,
] satisfies readonly CatalogPictogramDefinition[]);
```

- [ ] **Step 7: Acht Ledgerplätze anlegen**

Beachte den `#alternative`-Schlüssel:

```typescript
  'bbk-babz-2025:J.1.1#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.1#alternative': { status: 'pending' },
  'bbk-babz-2025:J.1.2#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.3#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.4#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.5#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.6#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.7#primary': { status: 'pending' },
```

- [ ] **Step 8: Tests laufen lassen**

```bash
rtk pnpm test
rtk pnpm typecheck
rtk pnpm cli coverage
```

Erwartet: grün, `Einträge: 223`, `Offene fachliche Reviews: 237`.

- [ ] **Step 9: Snapshots visuell prüfen**

Kritische Paare dieser Task: **J.1.3 gegen J.1.4** (DMO gegen TMO) und **J.1.5 gegen J.1.6**
(SDS im DMO gegen SDS im TMO). Beide Paare unterscheiden sich in der Referenz allein durch eine
Marke. Dazu **J.1.1 primary gegen alternative** — der Unterschied muss genau die Wellenlinie sein.
Prüfe alle drei Paare nebeneinander, auch in Print-Monochrome.

- [ ] **Step 10: Commit**

```bash
rtk git add packages/schema/src packages/catalog/src
rtk git commit -m "feat(catalog): Sprache und Sprechfunk J.1.1 bis J.1.7"
```

---

### Task 8: J.1.8–J.1.14 — Daten, Satellit und Richtfunk (7 IDs, 11 Darstellungen)

**Files:**
- Modify: `packages/catalog/src/pictograms/comms/01-connections.ts`
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`
- Test: `packages/catalog/src/pictograms/comms-families.test.ts`

**Interfaces:**
- Consumes: `radioWave()` und `CONNECTION_CONTRAST` aus Task 7
- Produces: `CONNECTION_COMMS` wächst auf 19 Einträge

**Referenzbefund und Konstruktionsauftrag:**

Vier der fünf `alternative`-Darstellungen des Slice liegen hier.

| Abschnitt | Darstellungen | Konstruktionsauftrag |
|---|---|---|
| J.1.8 Datenübertragung | primary + alternative | primary: Datenmarke + Wellenlinie. alternative: nur Datenmarke |
| J.1.9 Faxübertragung | primary + alternative | **Ausnahme von der Regel.** Beide Fassungen tragen den Textlauf „Fax" (~10,2 mm); die `alternative` besteht **ausschließlich** daraus und hat keine Datenmarke (`J.1.9_Faxübertragung_leitergebunden.svg:7-13`) |
| J.1.10 Bildübertragung | primary + alternative | dieselbe Regel. Belegdatei der alternative: `J.1.10_ Bildübertragung_leitergebunden.svg` mit Leerzeichen nach dem Unterstrich |
| J.1.11 Livestreamübertragung | primary + alternative | dieselbe Regel, von J.1.10 unterscheidbar |
| J.1.12 Satellitenverbindung Sprache | primary | Satellitenmarke, sprachbezogen |
| J.1.13 Satellitenverbindung Daten | primary | Satellitenmarke, datenbezogen, von J.1.12 unterscheidbar |
| J.1.14 Richtfunkverbindung | primary | zwei gegenüberliegende Richtfunkschalen. Der graue Erklärtext der Referenz bleibt weg |

- [ ] **Step 1: Den fehlgeschlagenen Test schreiben**

```typescript
  it('führt genau fünf alternative-Darstellungen im gesamten J-Bestand', () => {
    const alternatives = COMMS_PICTOGRAMS.filter((d) => d.variant === 'alternative');
    expect(alternatives.map((d) => d.section).sort()).toEqual([
      'J.1.1',
      'J.1.10',
      'J.1.11',
      'J.1.8',
      'J.1.9',
    ]);
  });

  it('zeichnet jede leitergebundene Fassung ohne die Wellenlinie', () => {
    for (const section of ['J.1.1', 'J.1.8', 'J.1.9', 'J.1.10', 'J.1.11']) {
      const primary = COMMS_PICTOGRAMS.find(
        (d) => d.section === section && d.variant === 'primary',
      );
      const wired = COMMS_PICTOGRAMS.find(
        (d) => d.section === section && d.variant === 'alternative',
      );
      expect(primary, section).toBeDefined();
      expect(wired, section).toBeDefined();
      expect(wired!.primitives.length, section).toBeLessThan(primary!.primitives.length);
    }
  });

  it('fuehrt die J.1.9-alternative als reines Textzeichen', () => {
    // Sonderfall unter den fuenf Paaren: J.1.9_Faxuebertragung_leitergebunden.svg besteht
    // ausschliesslich aus dem Wort Fax und hat keine Datenmarke. Der Laengenvergleich oben
    // waere hier mit 1 < 2 zufaellig gruen und belegte nichts.
    const wired = COMMS_PICTOGRAMS.find(
      (d) => d.section === 'J.1.9' && d.variant === 'alternative',
    );
    expect(wired!.primitives).toHaveLength(1);
    expect(wired!.primitives[0]!.type).toBe('text');
  });

  it('nimmt den Dateinamen der J.1.10-alternative unverändert auf', () => {
    const wired = COMMS_PICTOGRAMS.find(
      (d) => d.section === 'J.1.10' && d.variant === 'alternative',
    );
    expect(wired?.referenceAsset).toBe('J.1.10_ Bildübertragung_leitergebunden.svg');
  });
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/comms-families.test.ts
```

Erwartet: FAIL — nur eine `alternative` vorhanden.

- [ ] **Step 3: Referenzen visuell prüfen**

Rasterisiere die elf Belegdateien. Lege je Paar primary und alternative nebeneinander und
bestätige, dass der Unterschied genau die Wellenlinie ist. Weicht ein Paar davon ab, halte das fest
— es ist ein Befund für das Fachreview, kein Grund, die Konstruktion anzupassen.

- [ ] **Step 4: Sieben Literale in `COMMS_IDS` einfügen**

Nach `'voice-radio-dmo-repeater'`:

```typescript
  'data-transmission',
  'fax-transmission',
  'image-transmission',
  'livestream-transmission',
  'satellite-voice',
  'satellite-data',
  'directional-radio-link',
```

- [ ] **Step 5: Elf Definitionen in `01-connections.ts` ergänzen**

Muster für ein Paar:

```typescript
  defineComms({
    section: 'J.1.8',
    id: 'data-transmission',
    title: 'Datenübertragung',
    referenceAsset: 'J.1.8_Datenübertragung.svg',
    box: { xMm: 3, yMm: 7, widthMm: 26, heightMm: 15 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      // Datenmarke aus Step 3
      radioWave(),
    ],
  }),
  defineComms({
    section: 'J.1.8',
    id: 'data-transmission',
    variant: 'alternative',
    title: 'Datenübertragung, leitergebunden',
    referenceAsset: 'J.1.8_Datenübertragung_leitergebunden.svg',
    box: { xMm: 1, yMm: 7, widthMm: 30, heightMm: 9 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      // dieselbe Datenmarke, ohne radioWave()
    ],
  }),
```

- [ ] **Step 6: Elf Ledgerplätze anlegen**

```typescript
  'bbk-babz-2025:J.1.8#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.8#alternative': { status: 'pending' },
  'bbk-babz-2025:J.1.9#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.9#alternative': { status: 'pending' },
  'bbk-babz-2025:J.1.10#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.10#alternative': { status: 'pending' },
  'bbk-babz-2025:J.1.11#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.11#alternative': { status: 'pending' },
  'bbk-babz-2025:J.1.12#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.13#primary': { status: 'pending' },
  'bbk-babz-2025:J.1.14#primary': { status: 'pending' },
```

- [ ] **Step 7: Tests laufen lassen**

```bash
rtk pnpm test
rtk pnpm typecheck
rtk pnpm cli coverage
```

Erwartet: grün, `Einträge: 234`, `Offene fachliche Reviews: 248`.

- [ ] **Step 8: Snapshots visuell prüfen**

Kritische Paare dieser Task: die vier **primary gegen alternative**-Paare (J.1.8, J.1.9, J.1.10,
J.1.11) sowie **J.1.10 gegen J.1.11** (Bild gegen Livestream) und **J.1.12 gegen J.1.13**
(Satellit Sprache gegen Daten). Prüfe sie nebeneinander, auch in Print-Monochrome.

- [ ] **Step 9: Commit**

```bash
rtk git add packages/schema/src packages/catalog/src
rtk git commit -m "feat(catalog): Daten, Satellit und Richtfunk J.1.8 bis J.1.14"
```

---

### Task 9: Vollständiges 48/53-Inventar schließen und den Umfang beanspruchen

**Files:**
- Create: `packages/catalog/src/pictograms/comms-inventory.test.ts`
- Modify: `packages/catalog/src/coverage-manifest.ts`
- Test: die neue Datei

**Interfaces:**
- Consumes: `COMMS_PICTOGRAMS`, `COMMS_IDS`, `COVERAGE_MANIFEST`, `MANIFEST_DOMAIN_REVIEWS`
- Produces: den geschlossenen Inventarvertrag; ab hier ist jede Abweichung ein Testfehler

- [ ] **Step 1: Den Inventartest schreiben**

Create `packages/catalog/src/pictograms/comms-inventory.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { COMMS_IDS, entryKey } from '@einsatzzeichen/schema';
import { COMMS_PICTOGRAMS } from './comms/index.js';
import { COVERAGE_MANIFEST } from '../coverage-manifest.js';
import { MANIFEST_DOMAIN_REVIEWS } from '../domain-reviews.js';

const SECTIONS_WITH_ALTERNATIVE = ['J.1.1', 'J.1.8', 'J.1.9', 'J.1.10', 'J.1.11'] as const;

const EXPECTED_SECTIONS = [
  ...Array.from({ length: 14 }, (_, i) => `J.1.${i + 1}`),
  'J.2.1',
  'J.2.2',
  ...Array.from({ length: 15 }, (_, i) => `J.3.${i + 1}`),
  ...Array.from({ length: 17 }, (_, i) => `J.4.${i + 1}`),
];

describe('J-Inventar', () => {
  it('führt 48 IDs mit 53 Darstellungen', () => {
    expect(COMMS_IDS).toHaveLength(48);
    expect(COMMS_PICTOGRAMS).toHaveLength(53);
  });

  it('deckt genau die 48 beanspruchten Abschnitte ab', () => {
    const sections = [...new Set(COMMS_PICTOGRAMS.map((d) => d.section))];
    expect(sections.sort()).toEqual([...EXPECTED_SECTIONS].sort());
  });

  it('hält jede ID genau einmal und in Kapitelreihenfolge belegt', () => {
    const primaryIds = COMMS_PICTOGRAMS.filter((d) => d.variant === 'primary').map((d) =>
      d.id.replace(/^comms\./, ''),
    );
    expect(primaryIds).toEqual([...COMMS_IDS]);
  });

  it('vergibt jeden Variantenschlüssel genau einmal', () => {
    const keys = COMMS_PICTOGRAMS.map((d) => entryKey(d.id, d.variant));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('führt alternative genau in den fünf benannten Abschnitten', () => {
    const alternatives = COMMS_PICTOGRAMS.filter((d) => d.variant === 'alternative').map(
      (d) => d.section,
    );
    expect(alternatives.sort()).toEqual([...SECTIONS_WITH_ALTERNATIVE].sort());
  });

  it('beansprucht die vier J-Präfixe im Umfang', () => {
    for (const prefix of ['J.1', 'J.2', 'J.3', 'J.4']) {
      expect(COVERAGE_MANIFEST.scope).toContain(prefix);
    }
  });

  it('hält für jede Darstellung einen eigenen pending-Ledgerplatz', () => {
    for (const definition of COMMS_PICTOGRAMS) {
      const key = entryKey(`bbk-babz-2025:${definition.section}`, definition.variant);
      const review = MANIFEST_DOMAIN_REVIEWS[key as keyof typeof MANIFEST_DOMAIN_REVIEWS];
      expect(review, key).toBeDefined();
      expect(review!.status, key).toBe('pending');
    }
  });

  it('nimmt weder das Übersichtsblatt noch die J.2.3-Beispiele auf', () => {
    const assets = COMMS_PICTOGRAMS.map((d) => d.referenceAsset);
    expect(assets).not.toContain('J_Bedienungszeichen.svg');
    expect(assets.some((a) => a.startsWith('J.2.3'))).toBe(false);
  });
});
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/comms-inventory.test.ts
```

Erwartet: FAIL bei „beansprucht die vier J-Präfixe im Umfang" — der Scope fehlt noch. Alle übrigen
Prüfungen müssen bereits grün sein. Ist eine andere rot, liegt ein Inventarfehler aus den Tasks 2
bis 8 vor: **beheben, bevor der Scope wächst.**

- [ ] **Step 3: Den Umfang beanspruchen**

In `packages/catalog/src/coverage-manifest.ts`:

```typescript
  scope: ['1', '2', '4', '5.4', '5.8', 'C.1.1', 'C.1.2', 'D.3.7', 'J.1', 'J.2', 'J.3', 'J.4'],
```

Den Kommentar über `scope` ergänzen: J.2.3 ist lokal nur durch zwei Beispieldateien belegt und
deshalb nicht beansprucht.

- [ ] **Step 4: Tests laufen lassen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/comms-inventory.test.ts
rtk pnpm test
rtk pnpm typecheck
```

Erwartet: alles grün.

- [ ] **Step 5: Alle 53 Belegdateinamen gegen das Archiv prüfen**

```bash
rtk pnpm cli audit:reference --filter J
```

Das `section-mismatch`-Gate prüft nur den Präfix `${section}_`; ein Tippfehler dahinter — in
`Überspannschutz`, `temporär`, `Fernmeldegerät` oder dem eingebetteten Leerzeichen von
`J.1.10_ Bildübertragung_leitergebunden.svg` — bleibt ihm verborgen. Dieser Schritt fängt ihn.

Erwartet: keine unaufgelösten Belegdateien.

- [ ] **Step 6: Coverage-CLI gegen die Zielzahlen prüfen**

```bash
rtk pnpm cli coverage
```

Erwartet exakt:
- `Einträge: 234`
- `Offene fachliche Reviews: 248 (234 Manifestreviews, 13 Quellenreviews, 1 Profilreview)`
- `Umfang:` enthält `J.1, J.2, J.3, J.4`
- `0` ohne Testnachweis, `0` Kapitel im beanspruchten Umfang ohne Eintrag, `0` Abweichungen
- `Coverage-Gate bestanden.`

- [ ] **Step 7: Commit**

```bash
rtk git add packages/catalog/src
rtk git commit -m "feat(catalog): J-Inventar mit 48 IDs und 53 Darstellungen schließen"
```

---

### Task 10: Vollständige technische Evidenz und visuelle QA

**Files:**
- Create: `docs/reviews/2026-08-08-d3-visual-qa.md`
- Modify: gegebenenfalls Definitionen aus den Tasks 2 bis 8, wenn die QA einen Befund ergibt

**Interfaces:**
- Consumes: den geschlossenen Inventarvertrag aus Task 9
- Produces: ein Protokoll mit 53 Zeilen, das die visuelle Prüfung belegt

- [ ] **Step 1: Alle Gates einzeln belegen**

```bash
rtk pnpm test
rtk pnpm typecheck
rtk git diff --check
```

Erwartet: Testsuite grün ohne übersprungene Tests, keine TypeScript-Fehler, keine
Whitespace-Befunde.

- [ ] **Step 2: Kontaktbogen erzeugen**

```bash
rtk pnpm cli export --theme reference --size 128
rtk pnpm cli export --theme accessible-light --size 128
rtk pnpm cli export --theme print-monochrome --size 128
```

- [ ] **Step 3: Alle 53 Darstellungen in allen drei Ansichten prüfen**

Je Darstellung ist festzuhalten:
- Sind alle Bestandteile sichtbar und vollständig?
- Bleibt die Form über die Größen 16 bis 256 erhalten?
- Ist das Zeichen von seinen Nachbarn derselben Familie ohne Beschriftung unterscheidbar?
- Ist der Unterschied in `print-monochrome` erhalten?

Kritische Paare, die nebeneinander zu prüfen sind: J.1.3/J.1.4, J.1.5/J.1.6, J.1.10/J.1.11,
J.1.12/J.1.13, J.3.14/J.3.15, J.4.9/J.4.10, J.4.12/J.4.13, J.4.14/J.4.15/J.4.16 sowie alle fünf
primary/alternative-Paare.

- [ ] **Step 4: Protokoll schreiben**

Create `docs/reviews/2026-08-08-d3-visual-qa.md` nach dem Muster von
`docs/reviews/2026-08-07-d2-visual-qa.md`: eine Zeile je Darstellung mit Abschnitt, ID, Variante,
Snapshotpfad, den vier Prüfaussagen und dem Befund. Der Kopf hält fest, dass diese Prüfung
technisch ist und alle Domainreviews unverändert `pending` bleiben.

- [ ] **Step 5: Befunde beheben**

Jeder Befund aus Step 3 wird in der zugehörigen Definition behoben, die Tests laufen erneut, der
Snapshot wird erneut geprüft. Ein Befund ohne Behebung bleibt im Protokoll mit Begründung stehen.

- [ ] **Step 6: Commit**

```bash
rtk git add docs/reviews packages/catalog/src
rtk git commit -m "test(catalog): technische Evidenz und visuelle QA für Anhang J"
```

---

### Task 11: Reviewübergabe, README und D.3-Entscheidungsnotiz

**Files:**
- Create: `docs/decisions/2026-08-08-anhang-j-iuk-d3.md`
- Modify: `README.md`
- Modify: `docs/reviews/2026-08-06-domain-review-handoff.md`

**Interfaces:**
- Consumes: die Ergebnisse aller vorigen Tasks
- Produces: die dokumentierte Entscheidungslage für den nächsten Slice

- [ ] **Step 1: Entscheidungsnotiz schreiben**

Create `docs/decisions/2026-08-08-anhang-j-iuk-d3.md` nach dem Muster von
`docs/decisions/2026-08-07-kapitel-5-8-zustaende-d2.md` mit den Abschnitten:

1. **Inventar** — 48 IDs, 53 Darstellungen, die fünf `alternative`-Abschnitte namentlich
2. **Der Ledger-Schlüssel** — warum „leitergebunden" eine `alternative` ist und nicht eine eigene
   ID: `entryKey` trägt den Quellenabschnitt, `section-mismatch` bindet ihn an den Dateinamen.
   Der Preis — die Variante trägt keine Semantik im ID-Raum — und der benannte Nachfolger
   „Ledger-Schlüssel auf Implementierungsebene"
3. **Platzierung** — alle 53 `standalone`; die Verbindungszeichen sind Kacheln, keine Kanten; der
   benannte Nachfolger „Verbindungs- und Kantengeometrie"
4. **Kontrast** — vier Formfamilien, reale Farbnachbarschaften, nichtfarblicher Kanal
5. **Autorenschaft** — eigenständige Millimeterkonstruktionen, keine Geometrieübernahme,
   `taktische-zeichen/` weiterhin ungeklärt und uncommitted
6. **Beschriftungsglyphen** — die 16 (moeglicherweise 17) typografischen Darstellungen als Textlaeufe, J.4.17 ohne Wertplatzhalter, J.1.14 ohne Erklärtext
7. **Evidenz** — die tatsächlich gemessenen Zahlen aus Task 10, keine übernommenen Planwerte
8. **Reviewgrenze** — 248 offene fachliche Reviewträger, keine Einsatzfreigabe
9. **Nicht im Inventar** — `J_Bedienungszeichen.svg`, die beiden J.2.3-Beispiele, Abschnitt J.2.3
10. **Nächster Slice** — D.4 (Anhänge K, L, M) als *vorgeschlagener* nächster Slice, ausdrücklich
    nicht begonnen und nicht genehmigt

- [ ] **Step 2: README aktualisieren**

Umfangsangabe und Zahlen an den neuen Stand anpassen. Prüfe den Text auf Stellen, die `comms.` noch
als „kommt später" führen.

- [ ] **Step 3: Fachreview-Übergabe erweitern**

In `docs/reviews/2026-08-06-domain-review-handoff.md` die 53 neuen Reviewträger aufnehmen, damit
die menschliche Prüfliste vollständig bleibt.

- [ ] **Step 4: Abschließende Verifikation**

```bash
rtk pnpm test
rtk pnpm typecheck
rtk pnpm cli coverage
rtk git diff --check
rtk git status --short
```

Erwartet: alles grün, `Einträge: 234`, `Offene fachliche Reviews: 248`, sauberer Baum nach dem
Commit.

- [ ] **Step 5: Commit**

```bash
rtk git add docs README.md
rtk git commit -m "docs: D.3-Entscheidungsnotiz und Reviewübergabe für Anhang J"
```

- [ ] **Step 6: Abschluss**

Nutze `superpowers:finishing-a-development-branch`, um über die Integration des Worktrees zu
entscheiden.

---

## Self-Review des Plans

**Spec-Abdeckung:**

| Spec-Abschnitt | Task |
|---|---|
| 1 Zweck und Abgrenzung | Global Constraints, Task 2 |
| 2 Inventar (48/53) | Zielinventar, Tasks 2–8, geschlossen in Task 9 |
| 2.1 `alternative` statt eigener ID | Tasks 7, 8; dokumentiert in Task 11 |
| 2.2 Nicht im Inventar | Zielinventar, geprüft in Task 9 Step 1 |
| 2.3 Beschriftungsglyphen ~~(überholt)~~ | — |
| 2.4 Anhang J ist typografisch | Autorenvertrag Punkt 6, Tasks 3, 4, 6, 7, 8 |
| 3 Platzierung standalone | `defineComms` in Task 2, geprüft in `comms-families.test.ts` |
| 3.1 Verbindungszeichen und Grenze | Tasks 6, 8; dokumentiert in Task 11 |
| 4 Kontrast | vier Formfamilien, Tasks 2–8, geprüft je Gruppe |
| 5.1 schema | Task 2 Steps 3–4 |
| 5.2 catalog | Task 2 Steps 5–10, Task 9 Step 3 |
| 5.3 Modulgrenzen | Dateistruktur, vier Module |
| 6 Autorenschaft | Verbindlicher Autorenvertrag, Punkt 1–2 |
| 7 Testevidenz | Task 9 (Inventartest), Task 10 (Gates) |
| 8 Verifikation | Task 10 Step 1, Task 11 Step 4 |
| 9 Reviewgrenze | Autorenvertrag Punkt 6, Task 11 Step 1 |
| 10 Nicht in D.3 | Global Constraints, Task 11 Step 1 |

**Typkonsistenz:** `defineComms`, `CommsDefinitionInput`, `commsPath`/`commsLine`/`commsPolyline`/
`commsCircle`/`commsRect`, `COMMS_BLACK_STROKE`/`COMMS_BLACK_FILL`/`COMMS_WHITE_BODY`,
`CONNECTION_CONTRAST`/`DEVICE_CONTRAST`/`NETWORK_CONTRAST`, `COMMS_PICTOGRAMS`,
`CONNECTION_COMMS`/`OPERATING_MODE_COMMS`/`DEVICE_COMMS`/`NETWORK_COMMS` sind in Task 2 bis 7
definiert und werden danach unverändert benutzt. `DepictionVariant` ist durchgehend
`'primary' | 'alternative'`.

**Zahlenkette:** 181 → 183 (T2) → 191 (T3) → 198 (T4) → 205 (T5) → 215 (T6) → 223 (T7) → 234 (T8).
Offene Reviews laufen parallel: 195 → 197 → 205 → 212 → 219 → 229 → 237 → 248.

**Bekannte Grenze des Plans:** Die Konstruktionsaufträge der Tasks 3 bis 8 benennen Formfamilie,
Aufbau und Unterscheidungsmerkmal, nicht die fertige Millimetergeometrie jedes Zeichens. Das ist
beabsichtigt: Die Geometrie entsteht am rasterisierten Referenzbild, und die Gates — Box, Clipping,
Kommando, Kontrast, viewBox, Mehrgrößen — prüfen jede Konstruktion. Wo der Plan Koordinaten zeigt,
sind sie ausdrücklich Startpunkt und nicht Ergebnis.
