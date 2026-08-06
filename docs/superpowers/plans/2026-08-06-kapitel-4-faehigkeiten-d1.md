# Kapitel 4 vollständig (D.1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den vollständigen Kapitel-4-Bestand der projektinternen BBK/BABZ-Baseline als 88 Fähigkeiten mit 92 technisch gegateten Darstellungen liefern.

**Architecture:** Das bestehende codebasierte Piktogrammregister wird zuerst variantenfähig, weil vier Abschnitte je eine echte Alternativdarstellung besitzen. Danach ist jede Kapitel-4-Darstellung genau ein `CatalogPictogramDefinition` mit semantischer ID, Variante, Abschnitt, Referenzdateiname, eigenständig konstruierter Geometrie und expliziter Box; Elementregister, Coverage-Manifest und Renderfälle werden aus diesem Register abgeleitet. Die zehn Fähigkeitsbereiche werden in getrennten Modulen geliefert und nach jedem Bereich vollständig gegatet und gerastert.

**Tech Stack:** TypeScript 5.9, Vitest 3, pnpm 11, `@resvg/resvg-js`, bestehende Paketrichtung `cli → catalog → core → schema`

---

## Einordnung: D.1, nicht D.2

Der nächste Unter-Slice ist **D.1**. D.0 hat nur den Piktogramm-Mechanismus sowie `4.3.1` und
`4.3.2` geliefert; die Gate-Härtung danach war eine technische Vorbedingung und kein inhaltlicher
D.1-Ausbau. D.2 beginnt laut freigegebener Spec erst nach dem vollständigen Kapitel 4 und enthält
Kapitel 5.8.

Verifizierter Ausgangsstand am 6. August 2026:

- 41 Testdateien und 487 grüne Tests;
- TypeScript ohne Fehler;
- 24 Manifestzeilen und 37 offene Fachreviews;
- genau zwei Kapitel-4-Definitionen (`4.3.1`, `4.3.2`);
- null technische Nachweislücken;
- der aktuelle Worktree enthält noch nicht eingecheckte Gate-/Review-Arbeit. Die Ausführung dieses
  Plans beginnt erst auf einem Commit, der diesen verifizierten Stand vollständig enthält.

## Tragende Korrektur vor dem Massenausbau

Die Spec zählt korrekt **88 Abschnitte und 92 Einträge**, aber der heutige Typ
`PictogramDefinition` und `pictogram(id)` können nur eine Darstellung je ID adressieren. Das ist
für `4.1.6`, `4.1.7`, `4.1.8` und `4.7.10` unzureichend: deren `_Alternative.svg`-Dateien zeigen
jeweils eine eigenständige Geometrie. Vier zusätzliche Manifestzeilen ohne vier zusätzliche
Render-, Snapshot- und Gatefälle wären eine falsche Coverage-Aussage.

D.1 ergänzt deshalb `variant: DepictionVariant` an jeder Piktogrammdefinition. `pictogram(id)`
liefert aus Kompatibilitätsgründen weiterhin `primary`; `pictogram(id, 'alternative')` adressiert
die Alternative explizit. Die Komposition verwendet ohne neue öffentliche Auswahl weiterhin nur
`primary`. Eine UI zur Variantenauswahl ist nicht Teil dieses Slices.

## Dateistruktur

### Neu

- `packages/catalog/src/pictograms/catalog-definition.ts` — quellengebundener Katalogtyp,
  Definitionshelfer und eindeutige Darstellungs-/Renderkeys.
- `packages/catalog/src/pictograms/authoring.ts` — kleine Konstruktoren für absolute Pfade im
  bestehenden 32-mm-Koordinatensystem; keine neue Renderingabstraktion.
- `packages/catalog/src/pictograms/capabilities/01-cbrn.ts`
- `packages/catalog/src/pictograms/capabilities/02-care.ts`
- `packages/catalog/src/pictograms/capabilities/03-fire-fighting.ts`
- `packages/catalog/src/pictograms/capabilities/04-reconnaissance.ts`
- `packages/catalog/src/pictograms/capabilities/05-rescue.ts`
- `packages/catalog/src/pictograms/capabilities/06-medical.ts`
- `packages/catalog/src/pictograms/capabilities/07-technical-assistance.ts`
- `packages/catalog/src/pictograms/capabilities/08-logistics.ts`
- `packages/catalog/src/pictograms/capabilities/09-information-communications.ts`
- `packages/catalog/src/pictograms/capabilities/10-veterinary.ts`
- `packages/catalog/src/pictograms/capabilities/index.ts` — einzige Zusammenführung der zehn
  Bereichsmodule.
- `packages/catalog/src/pictograms/capability-inventory.test.ts` — exakte 88/92-Inventur,
  Varianten- und Referenzdateiprüfung.
- `docs/decisions/2026-08-06-kapitel-4-faehigkeiten-d1.md` — Abschlussentscheidung und Übergabe
  an D.2.

### Geändert

- `packages/schema/src/pictogram.ts` — `PictogramDefinition.variant`.
- `packages/schema/src/taxonomy.ts` — `CapabilityId` wächst bereichsweise auf 88 Literale.
- `packages/catalog/src/pictograms/capabilities.ts` — nur noch kompatibler Re-Export des
  Bereichsregisters.
- `packages/catalog/src/pictograms/index.ts` — `(id, variant)`-Auflösung und Duplikatprüfung.
- `packages/catalog/src/pictograms/capabilities.test.ts` — Primary-Default, Alternative und
  unbekannte Variante.
- `packages/catalog/src/pictograms/gate.test.ts` — Vertragsclaim nach ID **und** Variante.
- `packages/catalog/src/pictograms/snapshots.test.ts` — eindeutige Snapshotnamen für Alternativen.
- `packages/catalog/src/elements.ts` — 88 Fähigkeitsdeskriptoren aus dem Piktogrammregister.
- `packages/catalog/src/elements.test.ts` — 99 Deskriptoren, davon 88 Fähigkeiten.
- `packages/catalog/src/coverage-manifest.ts` — 92 Kapitel-4-Zeilen aus dem Register; Scope `4`.
- `packages/catalog/src/coverage-manifest.test.ts` — 114 Gesamtzeilen und 92 Kapitel-4-Zeilen.
- `packages/catalog/src/domain-reviews.ts` — eigene `pending`-Objekte für alle 92 Darstellungen.
- `packages/catalog/src/domain-reviews.test.ts` — 127 Reviewträger, keine erfundene Freigabe.
- `packages/catalog/src/test-support/render-cases.ts` — 92 eindeutige Piktogrammrenderfälle.
- `packages/catalog/src/render-cases.test.ts` — Evidenzgleichheit über ID und Variante.
- `packages/catalog/src/multi-size-snapshots.test.ts` — bestehender generischer Lauf, keine
  Sonderliste.
- `docs/reviews/2026-08-06-domain-review-handoff.md` — Kapitel-4-Inventar und 127 offene Träger.
- `README.md` — D.1-Umfang und ehrlicher Reviewstatus.

## Verbindliches Zielinventar

Die Tabelle ist die einzige Inventur im Plan. Jeder Bereichstest übernimmt seine Zeilen exakt;
Dateinamen werden einschließlich Tippfehlern, Unterstrichen, Umlauten und Leerzeichen nicht
normalisiert.

| Abschnitt | `CapabilityId` | Variante(n) | Referenzdatei primary |
|---|---|---|---|
| 4.1.1 | `cbrn-protection` | primary | `4.1.1_ABC_CBRN-Schutz.svg` |
| 4.1.2 | `cbrn-detection` | primary | `4.1.2_Messen Spüren Detektieren.svg` |
| 4.1.3 | `decontamination` | primary | `4.1.3_Dekontaminieren.svg` |
| 4.1.4 | `water-environmental-damage-control` | primary | `4.1.4_Umweltschädenbeseitigung auf Gewässern.svg` |
| 4.1.5 | `drinking-water-treatment` | primary | `4.1.5_Trinkwasseraufbereitung.svg` |
| 4.1.6 | `radioactive-materials` | primary, alternative | `4.1.6_Atomare Stoffe.svg` |
| 4.1.7 | `biological-materials` | primary, alternative | `4.1.7_Biologische Stoffe.svg` |
| 4.1.8 | `chemical-materials` | primary, alternative | `4.1.8_Chemische Stoffe.svg` |
| 4.2.1 | `care` | primary | `4.2.1_Betreuung Grundzeichne.svg` |
| 4.2.2 | `psychosocial-emergency-care` | primary | `4.2.2_PSNV.svg` |
| 4.2.3 | `pastoral-care` | primary | `4.2.3_Seelsorge.svg` |
| 4.2.4 | `temporary-accommodation-resting` | primary | `4.2.4_Temporäre Unterbringung mit Ruhemöglichkeit.svg` |
| 4.2.5 | `temporary-accommodation-seating` | primary | `4.2.5_Temporäre Unterbringung mit Sitzmöglichkeit.svg` |
| 4.3.1 | `fire-fighting` | primary | `4.3.1_Brandbekämpfung.svg` |
| 4.3.2 | `service-water` | primary | `4.3.2_Löschwasser Brauchwasser.svg` |
| 4.3.3 | `foam-agent` | primary | `4.3.3_Schaummittel.svg` |
| 4.3.4 | `solid-extinguishing-agent` | primary | `4.3.4_Sonderlöschmittel fest.svg` |
| 4.3.5 | `gaseous-extinguishing-agent` | primary | `4.3.5_Sonderlöschmittel gasförmig.svg` |
| 4.3.6 | `respiratory-protection` | primary | `4.3.6_Atemschutz.svg` |
| 4.4.1 | `reconnaissance` | primary | `4.4.1_Erkunden.svg` |
| 4.4.2 | `biological-location` | primary | `4.4.2_Orten biologisch.svg` |
| 4.4.3 | `technical-location` | primary | `4.4.3_Orten technisch.svg` |
| 4.5.1 | `recovery` | primary | `4.5.1_Bergung.svg` |
| 4.5.2 | `rescue-portable-ladders` | primary | `4.5.2_Retten aus Höhen und Tiefen mit tragbaren Leitern.svg` |
| 4.5.3 | `rescue-aerial-ladder` | primary | `4.5.3_Retten aus Höhen und Tiefen mit Drehleiter.svg` |
| 4.5.4 | `rescue-articulated-boom` | primary | `4.5.4_Retten aus Höhen und Tiefen mit Teleskopgelenkmast.svg` |
| 4.5.5 | `watercraft-operations` | primary | `4.5.5_Einsatz von Wasserfahrzeugen.svg` |
| 4.5.6 | `mountain-rescue` | primary | `4.5.6_Bergrettung.svg` |
| 4.5.7 | `special-height-depth-rescue` | primary | `4.5.7_Spezielle Rettung aus Höhen und Tiefen.svg` |
| 4.5.8 | `water-rescue` | primary | `4.5.8_Wasserrettung.svg` |
| 4.6.1 | `medical-service` | primary | `4.6.1_Sanität Grundzeichen.svg` |
| 4.6.2 | `nursing` | primary | `4.6.2_Pflege.svg` |
| 4.6.3 | `intensive-care` | primary | `4.6.3_Rettungswesen_Intensivmedizin.svg` |
| 4.6.4 | `physician` | primary | `4.6.4_Arztwesen.svg` |
| 4.6.5 | `patient-transport` | primary | `4.6.5_Patiententransport.svg` |
| 4.6.6 | `hospital` | primary | `4.6.6_Krankenhaus.svg` |
| 4.7.1 | `water-hazard-control` | primary | `4.7.1_Abwehr von Wassergefahren.svg` |
| 4.7.2 | `excavation` | primary | `4.7.2_Baggerarbeiten.svg` |
| 4.7.3 | `lighting` | primary | `4.7.3_Beleuchten.svg` |
| 4.7.4 | `ventilation` | primary | `4.7.4_Belüften.svg` |
| 4.7.5 | `air-extraction` | primary | `4.7.5_Entlüften.svg` |
| 4.7.6 | `explosive-ordnance-clearance` | primary | `4.7.6_Kampfmittelräumung.svg` |
| 4.7.7 | `hand-tools` | primary | `4.7.7_Einsatz von Handwerkzeugen.svg` |
| 4.7.8 | `forklift-lifting` | primary | `4.7.8_Hebearbeit mit Gabelstapler.svg` |
| 4.7.9 | `crane-lifting` | primary | `4.7.9_Hebearbeit mit Kran.svg` |
| 4.7.10 | `lifting-loads-persons` | primary, alternative | `4.7.10_Heben von Lasten oder Personen.svg` |
| 4.7.11 | `lifting-clearing` | primary | `4.7.11_Heben-Räumen.svg` |
| 4.7.12 | `remote-manipulation` | primary | `4.7.12_Fernmanipulieren.svg` |
| 4.7.13 | `chainsaw` | primary | `4.7.13_Motorsägearbeiten.svg` |
| 4.7.14 | `pumping` | primary | `4.7.14_Pumpen.svg` |
| 4.7.15 | `mechanized-clearing` | primary | `4.7.15_Räumarbeiten mit Maschine.svg` |
| 4.7.16 | `safety` | primary | `4.7.16_Sicherheit.svg` |
| 4.7.17 | `blasting` | primary | `4.7.17_Sprengen.svg` |
| 4.7.18 | `technical-assistance` | primary | `4.7.18_Technische Hilfeleistung.svg` |
| 4.7.19 | `transport` | primary | `4.7.19_Transportieren.svg` |
| 4.7.20 | `door-opening` | primary | `4.7.20_Türöffnung.svg` |
| 4.7.21 | `overcoming-height-differences` | primary | `4.7.21_Höhenunterschiede überwinden.svg` |
| 4.7.22 | `securing` | primary | `4.7.22_Absicherung.svg` |
| 4.7.23 | `optical-warning` | primary | `4.7.23_Warnen mit optischen Anzeigen.svg` |
| 4.7.24 | `loudspeaker-warning` | primary | `4.7.24_Warnen mit Lautsprecherdurchsagen.svg` |
| 4.7.25 | `siren-warning` | primary | `4.7.25_Warnen mit Sirenen.svg` |
| 4.7.26 | `water-conveyance` | primary | `4.7.26_Wasserförderung.svg` |
| 4.7.27 | `water-retention` | primary | `4.7.27_Wasserrückhaltung.svg` |
| 4.7.28 | `load-pulling` | primary | `4.7.28_Ziehen von Lasten.svg` |
| 4.8.1 | `container-resource` | primary | `4.8.1_Behälter.svg` |
| 4.8.2 | `fuels-consumables` | primary | `4.8.2_Betriebsstoffe Verbrauchsgüter.svg` |
| 4.8.3 | `bridge` | primary | `4.8.3_Brücke.svg` |
| 4.8.4 | `temporary-bridge-construction` | primary | `4.8.4_Behelfsbrückenbau.svg` |
| 4.8.5 | `waste-disposal` | primary | `4.8.5_Entsorgung.svg` |
| 4.8.6 | `maintenance` | primary | `4.8.6_Instandhaltung.svg` |
| 4.8.7 | `sandbag` | primary | `4.8.7_Sandsack.svg` |
| 4.8.8 | `sandbag-filling` | primary | `4.8.8_Sandsackbefüllung.svg` |
| 4.8.9 | `washing-facility` | primary | `4.8.9_Sanitäre Einrichtung_Waschmöglichkeit.svg` |
| 4.8.10 | `toilet-facility` | primary | `4.8.10_Sanitäre Einrichtung_WC.svg` |
| 4.8.11 | `power-supply` | primary | `4.8.11_Stromversorgung.svg` |
| 4.8.12 | `drinking-water` | primary | `4.8.12_Trinkwasser.svg` |
| 4.8.13 | `catering` | primary | `4.8.13_Verpflegung.svg` |
| 4.8.14 | `meal-preparation` | primary | `4.8.14_Verpflegung_Zubereitung.svg` |
| 4.8.15 | `rapid-deployment-tent` | primary | `4.8.15_Schnelleinsatzzelt.svg` |
| 4.8.16 | `frame-tent` | primary | `4.8.16_Stangengerüstzelt.svg` |
| 4.9.1 | `information-communications` | primary | `4.9.1_Information und Kommunikation Fernmeldewesen.svg` |
| 4.10.1 | `veterinary` | primary | `4.10.1_Veterinärwesen.svg` |
| 4.10.2 | `slaughter-culling` | primary | `4.10.2_Schlachten_Keulen.svg` |
| 4.10.3 | `chicken` | primary | `4.10.3_Huhn.svg` |
| 4.10.4 | `horse` | primary | `4.10.4_Pferd.svg` |
| 4.10.5 | `cattle` | primary | `4.10.5_Rind.svg` |
| 4.10.6 | `sheep` | primary | `4.10.6_Schaf.svg` |
| 4.10.7 | `pig` | primary | `4.10.7_Schwein.svg` |

Alternative Referenzdateien:

```text
4.1.6_Atomare Stoffe_Alternative.svg
4.1.7_Biologische Stoffe_Alternative.svg
4.1.8_Chemische Stoffe_Alternative.svg
4.7.10_Heben von Lasten oder Personen_Alternative.svg
```

## Nicht verhandelbarer Autorenvertrag

1. Die lokalen Referenz-SVGs dienen nur der visuellen und semantischen Prüfung. Keine Pfaddaten,
   Koordinaten oder transformierte Referenzgeometrie werden übernommen oder eingecheckt.
2. Jede neue Geometrie wird eigenständig in Millimetern konstruiert und trägt
   `source status: derived` über ihre Manifest-/Registeranbindung.
3. Piktogrammpfade verwenden ausschließlich absolute `M L H V C Q Z`-Kommandos.
4. Jede Darstellung besteht Kommando-, Box- und Clipping-Gate gegen `formation`, SVG-Snapshot,
   sechs Rastergrößen, beide Alternativthemes, Metadaten- und viewBox-Gate.
5. Technische Gates erlauben `technical: approved`; alle neuen `domain`-Objekte bleiben
   `pending`. Die Planumsetzung erfindet weder Fachkunde noch Revieweridentität.
6. `pictogram(id)` und `composeFromCatalog()` verwenden `primary`. Eine Alternative wird nur über
   `pictogram(id, 'alternative')` adressiert.

### Task 1: Verifizierte D.1-Ausgangsbasis festnageln

**Files:**
- Read: `docs/decisions/2026-08-06-gate-haertung-vor-d1.md`
- Read: `docs/superpowers/specs/2026-08-06-technische-restpunkte-und-review-uebergabe-design.md`
- Read: `packages/catalog/src/pictograms/capabilities.ts`
- Read: `packages/catalog/src/coverage-manifest.ts`

- [ ] **Step 1: Prüfen, dass die Gate-/Review-Arbeit im Ausführungscommit enthalten ist**

Run:

```bash
rtk git status --short --branch
rtk git log -1 --oneline
```

Expected: ein sauberer Arbeitsbaum auf einem Commit, der die typisierte Testevidenz,
Flächenmodelle, 37 einzelne Reviewobjekte und die Reviewübergabe enthält. Bei einem Dirty-Stand
nicht raten oder fremde Änderungen committen; Ausführung anhalten und den Ausgangscommit klären.

- [ ] **Step 2: Die verifizierte Baseline ausführen**

Run:

```bash
rtk pnpm typecheck
rtk pnpm test
rtk pnpm cli coverage
rtk git diff --check
```

Expected: TypeScript ohne Fehler; 41 Testdateien und 487 Tests PASS; Coverage mit 24 Einträgen,
37 offenen Fachreviews, null fehlender Testevidenz und bestandenem Gate; `git diff --check` ohne
Ausgabe.

### Task 2: Piktogrammvarianten modellieren, bevor Alternativen behauptet werden

**Files:**
- Modify: `packages/schema/src/pictogram.ts`
- Modify: `packages/catalog/src/pictograms/capabilities.ts`
- Modify: `packages/catalog/src/pictograms/index.ts`
- Modify: `packages/catalog/src/pictograms/capabilities.test.ts`
- Modify: `packages/catalog/src/pictograms/gate.test.ts`
- Modify: `packages/catalog/src/pictograms/snapshots.test.ts`
- Modify: `packages/catalog/src/test-support/render-cases.ts`
- Modify: `packages/catalog/src/render-cases.test.ts`

- [ ] **Step 1: Zuerst die fehlschlagenden Variantenfälle schreiben**

In `capabilities.test.ts` ergänzen:

```ts
it('liefert ohne Variantenargument weiterhin primary', () => {
  expect(pictogram('capability.fire-fighting').variant).toBe('primary');
});

it('wirft für eine nicht vorhandene Alternative', () => {
  expect(() => pictogram('capability.fire-fighting', 'alternative')).toThrow(/alternative/);
});
```

In `render-cases.test.ts` einen Unit-Test für die geplante Schlüsselbildung ergänzen:

```ts
expect(pictogramRenderId({ id: 'capability.fire-fighting', variant: 'primary' })).toBe(
  'capability.fire-fighting',
);
expect(pictogramRenderId({ id: 'capability.fire-fighting', variant: 'alternative' })).toBe(
  'capability.fire-fighting.alternative',
);
```

- [ ] **Step 2: Den erwarteten Fehlschlag beobachten**

Run:

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capabilities.test.ts packages/catalog/src/render-cases.test.ts
```

Expected: FAIL, weil `variant`, der zweite Parameter und `pictogramRenderId` noch nicht existieren.

- [ ] **Step 3: Den Schemavertrag erweitern**

In `packages/schema/src/pictogram.ts`:

```ts
import type { DepictionVariant } from './provenance.js';

export interface PictogramDefinition {
  id: PictogramId;
  variant: DepictionVariant;
  title: string;
  box: PictogramBox;
  primitives: readonly Primitive[];
}
```

Beide vorhandenen Definitionen erhalten `variant: 'primary'`.

- [ ] **Step 4: Eine eindeutige `(id, variant)`-Auflösung implementieren**

`packages/catalog/src/pictograms/index.ts` auf ein Array und einen Schlüsselindex umstellen:

```ts
import { entryKey, type DepictionVariant, type PictogramDefinition, type PictogramId } from '@einsatzzeichen/schema';
import { CAPABILITY_PICTOGRAMS } from './capabilities.js';

export function pictogramVariantKey(
  value: Pick<PictogramDefinition, 'id' | 'variant'>,
): string {
  return entryKey(value.id, value.variant);
}

export function pictogramRenderId(
  value: { readonly id: string; readonly variant: DepictionVariant },
): string {
  return value.variant === 'primary' ? value.id : `${value.id}.${value.variant}`;
}

export const ALL_PICTOGRAMS: readonly PictogramDefinition[] = [...CAPABILITY_PICTOGRAMS];

const PICTOGRAMS = new Map<string, PictogramDefinition>();
for (const definition of ALL_PICTOGRAMS) {
  const key = pictogramVariantKey(definition);
  if (PICTOGRAMS.has(key)) throw new Error(`Doppeltes Piktogramm "${key}".`);
  PICTOGRAMS.set(key, definition);
}

export function pictogram(
  id: PictogramId,
  variant: DepictionVariant = 'primary',
): PictogramDefinition {
  const definition = PICTOGRAMS.get(entryKey(id, variant));
  if (definition === undefined) {
    throw new Error(`Kein Piktogramm "${id}" in Variante "${variant}" im Katalog.`);
  }
  return definition;
}
```

`CAPABILITY_PICTOGRAMS` wird dafür von einem partiellen Record auf ein readonly Array umgestellt;
der Zugriff läuft ausschließlich über `pictogram()`. Den bisherigen Record-Test dabei durch eine
echte Array-Invariante ersetzen:

```ts
const keys = CAPABILITY_PICTOGRAMS.map(pictogramVariantKey);
expect(new Set(keys).size).toBe(keys.length);
for (const definition of CAPABILITY_PICTOGRAMS) {
  expect(pictogram(definition.id, definition.variant)).toBe(definition);
}
```

- [ ] **Step 5: Gate-, Snapshot- und Renderfallidentität variantensicher machen**

Alle Set-Gleichheiten verwenden `pictogramVariantKey(definition)` gegen
`entryKey(entry.implementation, entry.variant)`. Snapshot- und Renderdateinamen verwenden
`pictogramRenderId(definition)`. Damit bleiben die zwei vorhandenen Primary-Snapshotnamen
unverändert; Alternativen kollidieren später nicht mit ihnen.

Im globalen Renderfalltest wird die heutige Manifestseite entsprechend so normalisiert:

```ts
const claimed = COVERAGE_MANIFEST.entries
  .filter((entry) => entry.testEvidence.includes('svg-snapshot'))
  .map((entry) => pictogramRenderId({ id: entry.implementation, variant: entry.variant }))
  .sort();
```

Für Grundzeichen und Rezepte ist die Variante immer `primary`, ihre IDs bleiben dadurch
unverändert. Der Piktogramm-Vertragstest verwendet dagegen den stärkeren `entryKey`, weil dort nur
Piktogramme verglichen werden und ID plus Variante die fachliche Evidenzidentität bilden.

- [ ] **Step 6: Zieltests und volle Regression ausführen**

Run:

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capabilities.test.ts packages/catalog/src/pictograms/gate.test.ts packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/render-cases.test.ts
rtk pnpm typecheck
rtk pnpm test
```

Expected: alles PASS; weiterhin zwei Piktogramm- und zwei Piktogramm-Snapshotfälle; vorhandene
Snapshots unverändert.

- [ ] **Step 7: Commit**

```bash
rtk git add packages/schema/src/pictogram.ts packages/catalog/src/pictograms
rtk git add packages/catalog/src/test-support/render-cases.ts packages/catalog/src/render-cases.test.ts
rtk git commit -m "feat(schema,catalog): Piktogrammvarianten eindeutig adressieren"
```

### Task 3: Quellengebundene Definition als einzige Metadatenquelle einführen

**Files:**
- Create: `packages/catalog/src/pictograms/catalog-definition.ts`
- Create: `packages/catalog/src/pictograms/capabilities/03-fire-fighting.ts`
- Create: `packages/catalog/src/pictograms/capabilities/index.ts`
- Modify: `packages/catalog/src/pictograms/capabilities.ts`
- Modify: `packages/catalog/src/pictograms/index.ts`
- Modify: `packages/catalog/src/elements.ts`
- Modify: `packages/catalog/src/elements.test.ts`
- Modify: `packages/catalog/src/coverage-manifest.ts`
- Modify: `packages/catalog/src/coverage-manifest.test.ts`

- [ ] **Step 1: Fehlschlagende Ableitungstests schreiben**

```ts
it('leitet Titel und alle Referenzdateien eines Piktogrammelements aus den Definitionen ab', () => {
  const descriptor = resolveElement('capability.service-water');
  expect(descriptor.title).toBe('Löschwasser, Brauchwasser');
  expect(descriptor.referenceAssets).toEqual(['4.3.2_Löschwasser Brauchwasser.svg']);
});

it('bindet jede Piktogrammdefinition an genau eine Manifestzeile', () => {
  const definitions = ALL_PICTOGRAMS.map(pictogramVariantKey).sort();
  const rows = COVERAGE_MANIFEST.entries
    .filter((entry) => entry.coverage === 'element' && entry.implementation.startsWith('capability.'))
    .map((entry) => entryKey(entry.implementation, entry.variant))
    .sort();
  expect(rows).toEqual(definitions);
});
```

- [ ] **Step 2: Den Katalogtyp und seine Invarianten implementieren**

`catalog-definition.ts`:

```ts
import type {
  CapabilityId,
  DepictionVariant,
  PictogramBox,
  PictogramDefinition,
  Primitive,
} from '@einsatzzeichen/schema';

export interface CatalogPictogramDefinition extends PictogramDefinition {
  section: `4.${string}`;
  referenceAsset: `${string}.svg`;
}

export interface CapabilityDefinitionInput {
  section: `4.${string}`;
  id: CapabilityId;
  variant?: DepictionVariant;
  title: string;
  referenceAsset: `${string}.svg`;
  box: PictogramBox;
  primitives: readonly Primitive[];
}

export function defineCapability(input: CapabilityDefinitionInput): CatalogPictogramDefinition {
  return {
    section: input.section,
    id: `capability.${input.id}`,
    variant: input.variant ?? 'primary',
    title: input.title,
    referenceAsset: input.referenceAsset,
    box: input.box,
    primitives: input.primitives,
  };
}
```

- [ ] **Step 3: Die zwei D.0-Definitionen ohne Geometrieänderung verschieben**

`03-fire-fighting.ts` enthält `fire-fighting` und `service-water` bytegleich in Box und
Primitiven, aber über `defineCapability()` mit Abschnitt und Referenzdatei. Der neue
`capabilities/index.ts` exportiert zunächst genau diese zwei Einträge. `capabilities.ts` bleibt als
kompatibler Re-Export bestehen:

```ts
export { CAPABILITY_PICTOGRAMS } from './capabilities/index.js';
```

Ab diesem Schritt sind `CAPABILITY_PICTOGRAMS`, `ALL_PICTOGRAMS` und der interne Map-Wert als
`readonly CatalogPictogramDefinition[]` beziehungsweise `CatalogPictogramDefinition` getypt;
sonst gingen `section` und `referenceAsset` beim Zusammenführen verloren. Der öffentliche
Rückgabetyp von `pictogram()` darf der engere Katalogtyp sein, weil er strukturell weiterhin den
Schema-Vertrag `PictogramDefinition` erfüllt.

- [ ] **Step 4: Fähigkeitsdeskriptoren aus dem Register ableiten**

`elements.ts` gruppiert die Katalogdefinitionen nach ID, verlangt genau eine Primary-Darstellung,
identische Titel und legt Primary zuerst in `referenceAssets`. Organisations- und Stärkeelemente
bleiben statisch. Der resultierende Export bleibt `Readonly<Record<string, ElementDescriptor>>`.

- [ ] **Step 5: Kapitel-4-Manifestzeilen aus denselben Definitionen ableiten**

`coverage-manifest.ts` entfernt die zwei hart codierten Capability-Zeilen aus
`ELEMENT_SECTIONS`. Für jede `CatalogPictogramDefinition` entsteht:

```ts
{
  sourceId: `bbk-babz-2025:${definition.section}`,
  variant: definition.variant,
  title: definition.title,
  implementation: definition.id,
  referenceAsset: definition.referenceAsset,
  coverage: 'element',
  profile: 'bund',
  testEvidence: ['svg-snapshot', 'pictogram-contract'],
  review: reviewFor(sourceId, definition.variant, PICTOGRAM_TECHNICAL_REVIEW),
}
```

`reviewFor` erhält dafür `variant` und bildet den Ledgerschlüssel mit genau dieser Variante.

- [ ] **Step 6: Gezielte Tests und unveränderte Snapshots prüfen**

Run:

```bash
rtk pnpm vitest run packages/catalog/src/elements.test.ts packages/catalog/src/coverage-manifest.test.ts packages/catalog/src/domain-reviews.test.ts packages/catalog/src/pictograms/snapshots.test.ts
rtk pnpm typecheck
```

Expected: alles PASS; weiterhin 13 Elementdeskriptoren, 24 Manifestzeilen und dieselben zwei
Piktogrammsnapshots.

- [ ] **Step 7: Commit**

```bash
rtk git add packages/catalog/src/pictograms packages/catalog/src/elements.ts
rtk git add packages/catalog/src/elements.test.ts packages/catalog/src/coverage-manifest.ts
rtk git add packages/catalog/src/coverage-manifest.test.ts
rtk git commit -m "refactor(catalog): Piktogrammmetadaten aus Definitionen ableiten"
```

### Task 4: Einen kleinen, gate-konformen Autorenhelfer ergänzen

**Files:**
- Create: `packages/catalog/src/pictograms/authoring.ts`
- Modify: `packages/catalog/src/pictograms/capabilities.test.ts`

- [ ] **Step 1: Fehlschlagende Tests für den Autorenvertrag schreiben**

```ts
import { checkBox, checkCommands } from '@einsatzzeichen/core';
import { strokeCapability } from './authoring.js';

it('erzeugt absolute Pfade mit expliziter Standardbox und Piktogrammrolle', () => {
  const definition = strokeCapability({
    section: '4.9.1',
    id: 'information-communications',
    title: 'Test',
    referenceAsset: '4.9.1_Information und Kommunikation Fernmeldewesen.svg',
    d: 'M 4 8 L 28 24',
  });
  expect(definition.box).toEqual({ xMm: 4, yMm: 8, widthMm: 24, heightMm: 16 });
  expect(definition.primitives).toHaveLength(1);
  expect(definition.primitives[0]?.role).toBe('pictogram');
  expect(checkCommands(definition)).toEqual([]);
  expect(checkBox(definition)).toEqual([]);
});
```

- [ ] **Step 2: Den Fehlschlag beobachten**

Run:

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capabilities.test.ts
```

Expected: FAIL, weil `strokeCapability` noch nicht existiert.

- [ ] **Step 3: Den bewusst kleinen Helfer implementieren**

`authoring.ts`:

```ts
import {
  DEFAULT_STROKE_WIDTH_MM,
  type CapabilityId,
  type ColorToken,
  type DepictionVariant,
} from '@einsatzzeichen/schema';
import { defineCapability, type CatalogPictogramDefinition } from './catalog-definition.js';

export const STANDARD_CAPABILITY_BOX = {
  xMm: 4,
  yMm: 8,
  widthMm: 24,
  heightMm: 16,
} as const;

export interface StrokeCapabilityInput {
  section: `4.${string}`;
  id: CapabilityId;
  variant?: DepictionVariant;
  title: string;
  referenceAsset: `${string}.svg`;
  d: string;
  color?: ColorToken;
}

export function strokeCapability(input: StrokeCapabilityInput): CatalogPictogramDefinition {
  return defineCapability({
    section: input.section,
    id: input.id,
    variant: input.variant,
    title: input.title,
    referenceAsset: input.referenceAsset,
    box: STANDARD_CAPABILITY_BOX,
    primitives: [
      {
        type: 'path',
        role: 'pictogram',
        d: input.d,
        style: {
          fill: 'none',
          stroke: input.color ?? 'schwarz',
          strokeWidth: DEFAULT_STROKE_WIDTH_MM,
        },
      },
    ],
  });
}
```

Dieser Helfer ist absichtlich kein SVG-Parser, kein Mini-Zeichenprogramm und kein automatischer
Import. Er standardisiert nur die bereits beschlossene Box und Strichart. `checkCommands()` und
`checkBox()` bleiben die Autorität für den Pfadstring.

- [ ] **Step 4: Test und Typecheck ausführen**

Run:

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capabilities.test.ts
rtk pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add packages/catalog/src/pictograms/authoring.ts packages/catalog/src/pictograms/capabilities.test.ts
rtk git commit -m "feat(catalog): gate-konformen Autorenhelfer für Fähigkeiten ergänzen"
```

## Autorenpakete

Für jedes folgende Paket gilt derselbe TDD-Ablauf, die Geometrie selbst ist aber vollständig im
jeweiligen Codeblock angegeben und wird nicht aus einer Referenzdatei extrahiert:

1. Inventartest mit exakt den genannten `(section, id, variant, asset)`-Tupeln ergänzen und rot
   laufen lassen.
2. Die genannten Literale in `CapabilityId` ergänzen.
3. Das Modul mit den angegebenen eigenständigen Pfaden anlegen und in
   `capabilities/index.ts` einhängen.
4. Für jede neue Manifestzeile ein eigenes `{ status: 'pending' }` in
   `MANIFEST_DOMAIN_REVIEWS` ergänzen.
5. Gate- und Snapshottests zuerst ohne `-u` ausführen: nur fehlende Dateisnapshots dürfen
   fehlschlagen. Danach mit `-u` erzeugen, alle neuen Kontaktbögen visuell bei 16 px und in beiden
   Themes prüfen und erst dann committen.

### Task 5: 4.1 — ABC-/CBRN-Schutz (8 IDs, 11 Darstellungen)

**Files:**
- Create: `packages/catalog/src/pictograms/capabilities/01-cbrn.ts`
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/pictograms/capabilities/index.ts`
- Modify: `packages/catalog/src/pictograms/capability-inventory.test.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`
- Test snapshots: `packages/catalog/src/pictograms/__snapshots__/capability.*.svg`
- Test contact sheets: `packages/catalog/src/__snapshots__/multi-size/capability.*.svg`

- [ ] **Step 1: Die elf Inventurzeilen als fehlschlagende Erwartung ergänzen**

Expected rows: acht `primary` aus 4.1.1–4.1.8 sowie `alternative` für 4.1.6, 4.1.7 und 4.1.8;
Dateinamen exakt aus der Zielinventartabelle.

- [ ] **Step 2: Acht ID-Literale ergänzen und das Modul implementieren**

```ts
import { strokeCapability as icon } from '../authoring.js';

export const CBRN_CAPABILITIES = [
  icon({
    section: '4.1.1', id: 'cbrn-protection', title: 'ABC-/CBRN-Schutz',
    referenceAsset: '4.1.1_ABC_CBRN-Schutz.svg',
    d: 'M 7 23 L 18 8 M 25 23 L 14 8 M 5 10 C 5 8.9 5.9 8 7 8 C 8.1 8 9 8.9 9 10 C 9 11.1 8.1 12 7 12 C 5.9 12 5 11.1 5 10 M 23 10 C 23 8.9 23.9 8 25 8 C 26.1 8 27 8.9 27 10 C 27 11.1 26.1 12 25 12 C 23.9 12 23 11.1 23 10',
  }),
  icon({
    section: '4.1.2', id: 'cbrn-detection', title: 'Messen, Spüren, Detektieren',
    referenceAsset: '4.1.2_Messen Spüren Detektieren.svg',
    d: 'M 7 23 L 18 8 M 25 23 L 14 8 M 4 17 L 28 13 M 5 10 C 5 8.9 5.9 8 7 8 C 8.1 8 9 8.9 9 10 C 9 11.1 8.1 12 7 12 C 5.9 12 5 11.1 5 10 M 23 10 C 23 8.9 23.9 8 25 8 C 26.1 8 27 8.9 27 10 C 27 11.1 26.1 12 25 12 C 23.9 12 23 11.1 23 10',
  }),
  icon({
    section: '4.1.3', id: 'decontamination', title: 'Dekontaminieren',
    referenceAsset: '4.1.3_Dekontaminieren.svg',
    d: 'M 7 23 L 18 8 M 25 23 L 14 8 M 5 18 V 24 H 11 M 27 18 V 24 H 21 M 5 10 C 5 8.9 5.9 8 7 8 C 8.1 8 9 8.9 9 10 C 9 11.1 8.1 12 7 12 C 5.9 12 5 11.1 5 10 M 23 10 C 23 8.9 23.9 8 25 8 C 26.1 8 27 8.9 27 10 C 27 11.1 26.1 12 25 12 C 23.9 12 23 11.1 23 10',
  }),
  icon({
    section: '4.1.4', id: 'water-environmental-damage-control',
    title: 'Umweltschädenbeseitigung auf Gewässern',
    referenceAsset: '4.1.4_Umweltschädenbeseitigung auf Gewässern.svg',
    d: 'M 7 19 L 17 8 M 25 19 L 15 8 M 5 20 C 8 16 11 24 14 20 C 17 16 20 24 23 20 C 25 18 27 19 28 20 M 5 23 C 8 19 11 24 14 23 C 17 19 20 24 23 23 C 25 21 27 22 28 23',
  }),
  icon({
    section: '4.1.5', id: 'drinking-water-treatment', title: 'Trinkwasseraufbereitung',
    referenceAsset: '4.1.5_Trinkwasseraufbereitung.svg',
    d: 'M 8 20 C 5 17 5 12 9 9 M 8 20 L 5 18 M 8 20 L 8 16 M 24 12 C 27 15 27 20 23 23 M 24 12 L 27 14 M 24 12 L 24 16 M 10 15 C 12 11 14 19 16 15 C 18 11 20 19 22 15 M 15 16 H 19 V 20 M 17 18 H 21',
  }),
  icon({
    section: '4.1.6', id: 'radioactive-materials', title: 'Atomare Stoffe',
    referenceAsset: '4.1.6_Atomare Stoffe.svg',
    d: 'M 16 14 C 14.9 14 14 14.9 14 16 C 14 17.1 14.9 18 16 18 C 17.1 18 18 17.1 18 16 C 18 14.9 17.1 14 16 14 M 15 13 L 10 8 L 7 13 L 13 15 M 19 13 L 22 8 L 27 13 L 19 15 M 14 19 L 11 24 H 21 L 18 19',
  }),
  icon({
    section: '4.1.6', id: 'radioactive-materials', variant: 'alternative',
    title: 'Atomare Stoffe', referenceAsset: '4.1.6_Atomare Stoffe_Alternative.svg', color: 'rot',
    d: 'M 16 8 L 5 24 H 27 Z M 12 21 L 16 12 L 20 21 M 13.5 18 H 18.5',
  }),
  icon({
    section: '4.1.7', id: 'biological-materials', title: 'Biologische Stoffe',
    referenceAsset: '4.1.7_Biologische Stoffe.svg',
    d: 'M 16 13 C 12 8 7 10 8 15 C 9 19 13 19 16 16 C 19 19 23 19 24 15 C 25 10 20 8 16 13 M 16 16 C 11 16 10 21 13 24 M 16 16 C 21 16 22 21 19 24 M 16 13 V 8',
  }),
  icon({
    section: '4.1.7', id: 'biological-materials', variant: 'alternative',
    title: 'Biologische Stoffe', referenceAsset: '4.1.7_Biologische Stoffe_Alternative.svg', color: 'rot',
    d: 'M 16 8 L 5 24 H 27 Z M 13 12 V 21 H 17 C 20 21 20 17 17 17 H 13 M 17 17 C 20 17 20 12 17 12 H 13',
  }),
  icon({
    section: '4.1.8', id: 'chemical-materials', title: 'Chemische Stoffe',
    referenceAsset: '4.1.8_Chemische Stoffe.svg',
    d: 'M 13 8 H 19 V 14 L 24 24 H 8 L 13 14 Z M 11 20 H 21',
  }),
  icon({
    section: '4.1.8', id: 'chemical-materials', variant: 'alternative',
    title: 'Chemische Stoffe', referenceAsset: '4.1.8_Chemische Stoffe_Alternative.svg', color: 'rot',
    d: 'M 16 8 L 5 24 H 27 Z M 20 13 C 18 11 13 11 12 16 C 11 21 17 22 20 19',
  }),
] as const;
```

- [ ] **Step 3: Elf einzelne Reviewobjekte ergänzen**

Keys: `bbk-babz-2025:4.1.1#primary` bis `4.1.8#primary` sowie
`4.1.6#alternative`, `4.1.7#alternative`, `4.1.8#alternative`; jeder Wert ist ein eigenes
`{ status: 'pending' }`.

- [ ] **Step 4: Gates, Snapshots und Sichtprüfung**

Run:

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capability-inventory.test.ts packages/catalog/src/pictograms/gate.test.ts packages/catalog/src/pictograms/snapshots.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts -u
rtk pnpm typecheck
```

Expected: 11 Definitionen aus Bereich 4.1; alle Gates PASS; elf eindeutige SVG-Snapshots und elf
Mehrgrößenbögen. Die drei Alternativen sind unter `.alternative.svg` getrennt sichtbar.

- [ ] **Step 5: Commit**

```bash
rtk git add packages/schema/src/taxonomy.ts packages/catalog/src/pictograms packages/catalog/src/domain-reviews.ts packages/catalog/src/__snapshots__
rtk git commit -m "feat(catalog): ABC- und CBRN-Fähigkeiten aus Kapitel 4.1"
```

### Task 6: 4.2 — Betreuung (5 IDs, 5 Darstellungen)

**Files:**
- Create: `packages/catalog/src/pictograms/capabilities/02-care.ts`
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/pictograms/capabilities/index.ts`
- Modify: `packages/catalog/src/pictograms/capability-inventory.test.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`

- [ ] **Step 1: Fünf Inventurzeilen rot festnageln und die fünf ID-Literale ergänzen**

Use sections 4.2.1–4.2.5 and the exact files from the target inventory.

- [ ] **Step 2: Das Bereichsmodul implementieren**

```ts
import { strokeCapability as icon } from '../authoring.js';

export const CARE_CAPABILITIES = [
  icon({ section: '4.2.1', id: 'care', title: 'Betreuung',
    referenceAsset: '4.2.1_Betreuung Grundzeichne.svg', d: 'M 6 24 L 16 8 L 26 24' }),
  icon({ section: '4.2.2', id: 'psychosocial-emergency-care', title: 'PSNV',
    referenceAsset: '4.2.2_PSNV.svg',
    d: 'M 6 24 L 16 8 L 26 24 M 9 20 V 14 H 12 C 15 14 15 18 12 18 H 9 M 17 14 L 19 20 L 21 14 L 23 20 L 25 14' }),
  icon({ section: '4.2.3', id: 'pastoral-care', title: 'Seelsorge',
    referenceAsset: '4.2.3_Seelsorge.svg', d: 'M 16 8 V 24 M 10 13 H 22 M 9 16 H 23' }),
  icon({ section: '4.2.4', id: 'temporary-accommodation-resting',
    title: 'Temporäre Unterbringung mit Ruhemöglichkeit',
    referenceAsset: '4.2.4_Temporäre Unterbringung mit Ruhemöglichkeit.svg',
    d: 'M 6 8 V 24 M 26 8 V 24 M 6 18 C 9 12 23 12 26 18 M 6 19 H 26' }),
  icon({ section: '4.2.5', id: 'temporary-accommodation-seating',
    title: 'Temporäre Unterbringung mit Sitzmöglichkeit',
    referenceAsset: '4.2.5_Temporäre Unterbringung mit Sitzmöglichkeit.svg',
    d: 'M 10 8 V 24 M 10 16 H 20 V 24' }),
] as const;
```

- [ ] **Step 3: Reviewobjekte, Gates und Snapshots ergänzen**

Five own pending keys, `4.2.1#primary` through `4.2.5#primary`.

Run:

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capability-inventory.test.ts packages/catalog/src/pictograms/gate.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts -u
rtk pnpm typecheck
```

Expected: five new definitions and five green, visually legible contact sheets.

- [ ] **Step 4: Commit**

```bash
rtk git add packages/schema/src/taxonomy.ts packages/catalog/src/pictograms packages/catalog/src/domain-reviews.ts packages/catalog/src/__snapshots__
rtk git commit -m "feat(catalog): Betreuungsfähigkeiten aus Kapitel 4.2"
```

### Task 7: 4.3 — Brandbekämpfung vervollständigen (4 neue IDs)

**Files:**
- Modify: `packages/catalog/src/pictograms/capabilities/03-fire-fighting.ts`
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/pictograms/capability-inventory.test.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`

- [ ] **Step 1: Die sechs Bereichszeilen erwarten; D.0 muss zwei bereits erfüllen**

Expected: `4.3.1` bis `4.3.6`, alle primary. Der Test muss vor der Änderung exakt die vier
fehlenden Zeilen melden und die vorhandenen D.0-Zeilen unverändert akzeptieren.

- [ ] **Step 2: Vier neue Definitionen unter den unveränderten D.0-Definitionen ergänzen**

```ts
icon({ section: '4.3.3', id: 'foam-agent', title: 'Schaummittel',
  referenceAsset: '4.3.3_Schaummittel.svg', d: 'M 8 9 H 24 L 16 23 Z' }),
icon({ section: '4.3.4', id: 'solid-extinguishing-agent', title: 'Sonderlöschmittel, fest',
  referenceAsset: '4.3.4_Sonderlöschmittel fest.svg', d: 'M 10 10 H 22 V 22 H 10 Z' }),
icon({ section: '4.3.5', id: 'gaseous-extinguishing-agent', title: 'Sonderlöschmittel, gasförmig',
  referenceAsset: '4.3.5_Sonderlöschmittel gasförmig.svg',
  d: 'M 16 10 C 12 10 10 12 10 16 C 10 20 12 22 16 22 C 20 22 22 20 22 16 C 22 12 20 10 16 10 Z' }),
icon({ section: '4.3.6', id: 'respiratory-protection', title: 'Atemschutz',
  referenceAsset: '4.3.6_Atemschutz.svg',
  d: 'M 13 8 H 19 Q 21 8 21 10 V 19 Q 21 22 18 22 H 14 Q 11 22 11 19 V 10 Q 11 8 13 8 Z M 16 22 V 24 M 14 24 H 18' }),
```

- [ ] **Step 3: Vier Reviewobjekte, Gates und Snapshots ergänzen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capability-inventory.test.ts packages/catalog/src/pictograms/gate.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts -u
rtk pnpm typecheck
```

Expected: Der erste Snapshotlauf meldet nur die vier fehlenden neuen Snapshots; nach `-u` hat
Kapitel 4.3 sechs grüne Definitionen und die beiden ursprünglichen D.0-Snapshots keinen Diff.

- [ ] **Step 4: Commit**

```bash
rtk git add packages/schema/src/taxonomy.ts packages/catalog/src/pictograms packages/catalog/src/domain-reviews.ts packages/catalog/src/__snapshots__
rtk git commit -m "feat(catalog): Brandbekämpfungsfähigkeiten aus Kapitel 4.3 vervollständigen"
```

### Task 8: 4.4 — Erkundung und Ortung (3 IDs)

**Files:**
- Create: `packages/catalog/src/pictograms/capabilities/04-reconnaissance.ts`
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/pictograms/capabilities/index.ts`
- Modify: `packages/catalog/src/pictograms/capability-inventory.test.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`

- [ ] **Step 1: Drei Inventurzeilen und ID-Literale ergänzen**

- [ ] **Step 2: Das Bereichsmodul implementieren**

```ts
import { strokeCapability as icon } from '../authoring.js';

export const RECONNAISSANCE_CAPABILITIES = [
  icon({ section: '4.4.1', id: 'reconnaissance', title: 'Erkunden',
    referenceAsset: '4.4.1_Erkunden.svg', d: 'M 5 24 L 27 8' }),
  icon({ section: '4.4.2', id: 'biological-location', title: 'Orten, biologisch',
    referenceAsset: '4.4.2_Orten biologisch.svg',
    d: 'M 7 24 L 12 13 L 17 24 M 17 24 L 22 13 L 27 24 M 12 13 H 22 M 22 13 L 25 8 L 28 14 Z' }),
  icon({ section: '4.4.3', id: 'technical-location', title: 'Orten, technisch',
    referenceAsset: '4.4.3_Orten technisch.svg',
    d: 'M 6 22 C 6 13 12 8 19 9 M 19 9 L 15 13 L 24 22 M 24 22 H 28 M 24 22 V 18' }),
] as const;
```

- [ ] **Step 3: Drei Reviewobjekte, Gates, Snapshots und Typecheck abschließen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capability-inventory.test.ts packages/catalog/src/pictograms/gate.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts -u
rtk pnpm typecheck
```

Expected: Der erste Snapshotlauf meldet nur drei neue fehlende Dateien; danach drei grüne,
visuell unterscheidbare Definitionen und Bögen.

- [ ] **Step 4: Commit**

```bash
rtk git add packages/schema/src/taxonomy.ts packages/catalog/src/pictograms packages/catalog/src/domain-reviews.ts packages/catalog/src/__snapshots__
rtk git commit -m "feat(catalog): Erkundungs- und Ortungsfähigkeiten aus Kapitel 4.4"
```

### Task 9: 4.5 — Retten und Bergen (8 IDs)

**Files:**
- Create: `packages/catalog/src/pictograms/capabilities/05-rescue.ts`
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/pictograms/capabilities/index.ts`
- Modify: `packages/catalog/src/pictograms/capability-inventory.test.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`

- [ ] **Step 1: Acht Inventurzeilen und ID-Literale ergänzen**

- [ ] **Step 2: Das Bereichsmodul implementieren**

```ts
import { strokeCapability as icon } from '../authoring.js';

export const RESCUE_CAPABILITIES = [
  icon({ section: '4.5.1', id: 'recovery', title: 'Bergung',
    referenceAsset: '4.5.1_Bergung.svg',
    d: 'M 6 10 V 24 M 6 13 H 12 M 12 13 C 12 20 16 23 21 23 C 25 23 27 20 27 16 M 27 13 V 16 M 21 13 H 27' }),
  icon({ section: '4.5.2', id: 'rescue-portable-ladders',
    title: 'Retten aus Höhen und Tiefen mit tragbaren Leitern',
    referenceAsset: '4.5.2_Retten aus Höhen und Tiefen mit tragbaren Leitern.svg',
    d: 'M 10 8 V 24 M 22 8 V 24 M 10 11 H 22 M 10 15 H 22 M 10 19 H 22 M 10 23 H 22' }),
  icon({ section: '4.5.3', id: 'rescue-aerial-ladder',
    title: 'Retten aus Höhen und Tiefen mit Drehleiter',
    referenceAsset: '4.5.3_Retten aus Höhen und Tiefen mit Drehleiter.svg',
    d: 'M 5 24 L 18 11 M 18 11 V 8 H 24 V 14 H 18 M 8 21 L 11 24 M 11 18 L 14 21 M 14 15 L 17 18' }),
  icon({ section: '4.5.4', id: 'rescue-articulated-boom',
    title: 'Retten aus Höhen und Tiefen mit Teleskopgelenkmast',
    referenceAsset: '4.5.4_Retten aus Höhen und Tiefen mit Teleskopgelenkmast.svg',
    d: 'M 7 24 L 12 14 L 20 12 M 20 12 V 8 H 26 V 14 H 20 M 10 19 L 15 20' }),
  icon({ section: '4.5.5', id: 'watercraft-operations', title: 'Einsatz von Wasserfahrzeugen',
    referenceAsset: '4.5.5_Einsatz von Wasserfahrzeugen.svg',
    d: 'M 11 12 H 21 C 21 17 19 20 16 20 C 13 20 11 17 11 12 Z M 4 10 C 6 8 8 13 10 10 M 22 10 C 24 8 26 13 28 10 M 4 22 C 6 19 8 24 10 22 M 22 22 C 24 19 26 24 28 22' }),
  icon({ section: '4.5.6', id: 'mountain-rescue', title: 'Bergrettung',
    referenceAsset: '4.5.6_Bergrettung.svg',
    d: 'M 16 8 L 20 12 L 16 16 L 12 12 Z M 16 16 L 22 24 H 10 Z' }),
  icon({ section: '4.5.7', id: 'special-height-depth-rescue',
    title: 'Spezielle Rettung aus Höhen und Tiefen',
    referenceAsset: '4.5.7_Spezielle Rettung aus Höhen und Tiefen.svg',
    d: 'M 16 11 L 20 15 L 16 19 L 12 15 Z M 16 8 V 11 M 13 10 L 16 8 L 19 10 M 16 19 V 24 M 13 22 L 16 24 L 19 22' }),
  icon({ section: '4.5.8', id: 'water-rescue', title: 'Wasserrettung',
    referenceAsset: '4.5.8_Wasserrettung.svg',
    d: 'M 5 10 C 8 8 11 14 14 10 C 17 8 20 14 23 10 C 25 8 27 9 28 10 M 5 14 C 8 10 11 18 14 14 C 17 10 20 18 23 14 C 25 12 27 13 28 14 M 16 16 L 22 22 L 16 24 L 10 22 Z' }),
] as const;
```

- [ ] **Step 3: Acht Reviewobjekte, Gates und Snapshots ergänzen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capability-inventory.test.ts packages/catalog/src/pictograms/gate.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts -u
rtk pnpm typecheck
```

Expected: Vor `-u` fehlen genau acht neue Snapshotpaare; danach acht grüne Definitionen. Leiter,
Mast, Boot und Wasserrettung bleiben bei 16 px unterscheidbar.

- [ ] **Step 4: Commit**

```bash
rtk git add packages/schema/src/taxonomy.ts packages/catalog/src/pictograms packages/catalog/src/domain-reviews.ts packages/catalog/src/__snapshots__
rtk git commit -m "feat(catalog): Rettungs- und Bergungsfähigkeiten aus Kapitel 4.5"
```

### Task 10: 4.6 — Sanitäts- und Rettungswesen (6 IDs)

**Files:**
- Create: `packages/catalog/src/pictograms/capabilities/06-medical.ts`
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/pictograms/capabilities/index.ts`
- Modify: `packages/catalog/src/pictograms/capability-inventory.test.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`

- [ ] **Step 1: Sechs Inventurzeilen und ID-Literale ergänzen**

- [ ] **Step 2: Das Bereichsmodul implementieren**

```ts
import { strokeCapability as icon } from '../authoring.js';

export const MEDICAL_CAPABILITIES = [
  icon({ section: '4.6.1', id: 'medical-service', title: 'Sanität, Grundzeichen',
    referenceAsset: '4.6.1_Sanität Grundzeichen.svg', d: 'M 16 8 V 24 M 7 16 H 25' }),
  icon({ section: '4.6.2', id: 'nursing', title: 'Pflege',
    referenceAsset: '4.6.2_Pflege.svg', d: 'M 16 8 V 24 M 7 16 H 25 M 10 12 V 20' }),
  icon({ section: '4.6.3', id: 'intensive-care', title: 'Rettungswesen / Intensivmedizin',
    referenceAsset: '4.6.3_Rettungswesen_Intensivmedizin.svg',
    d: 'M 16 8 V 24 M 7 16 H 25 M 10 13 V 19 M 22 13 V 19' }),
  icon({ section: '4.6.4', id: 'physician', title: 'Arztwesen',
    referenceAsset: '4.6.4_Arztwesen.svg', d: 'M 16 8 V 24 M 7 16 H 25 M 12 20 H 20' }),
  icon({ section: '4.6.5', id: 'patient-transport', title: 'Patiententransport',
    referenceAsset: '4.6.5_Patiententransport.svg',
    d: 'M 16 8 V 24 M 7 16 H 25 M 16 10 C 12 10 9 13 9 16 C 9 20 12 22 16 22 C 20 22 23 20 23 16 C 23 13 20 10 16 10 Z M 11 11 L 21 21 M 21 11 L 11 21' }),
  icon({ section: '4.6.6', id: 'hospital', title: 'Krankenhaus',
    referenceAsset: '4.6.6_Krankenhaus.svg',
    d: 'M 6 24 V 12 L 16 8 L 26 12 V 24 Z M 16 12 V 22 M 10 17 H 22 M 10 14 V 22 M 22 14 V 22' }),
] as const;
```

- [ ] **Step 3: Sechs Reviewobjekte, Gates und Snapshots ergänzen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capability-inventory.test.ts packages/catalog/src/pictograms/gate.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts -u
rtk pnpm typecheck
```

Expected: Vor `-u` fehlen genau sechs neue Snapshotpaare; danach sechs grüne Definitionen. Die
vier kreuzbasierten Bedeutungen bleiben durch ihre Zusatzmarken bei 16 px unterscheidbar.

- [ ] **Step 4: Commit**

```bash
rtk git add packages/schema/src/taxonomy.ts packages/catalog/src/pictograms packages/catalog/src/domain-reviews.ts packages/catalog/src/__snapshots__
rtk git commit -m "feat(catalog): medizinische Fähigkeiten aus Kapitel 4.6"
```

### Task 11: 4.7 — Technische Hilfeleistung (28 IDs, 29 Darstellungen)

Der größte Bereich wird in drei grüne Commits geteilt. Jeder Teil erweitert dasselbe Modul,
`CapabilityId`, Inventartest, Reviewledger und Snapshots. Kein Zwischencommit behauptet bereits
den vollständigen 4.7-Scope.

**Files:**
- Create/Modify: `packages/catalog/src/pictograms/capabilities/07-technical-assistance.ts`
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/pictograms/capabilities/index.ts`
- Modify: `packages/catalog/src/pictograms/capability-inventory.test.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`

- [ ] **Step 1: 4.7.1 bis 4.7.10 samt Alternative inventarisieren und implementieren**

```ts
import { strokeCapability as icon } from '../authoring.js';

export const TECHNICAL_ASSISTANCE_CAPABILITIES = [
  icon({ section: '4.7.1', id: 'water-hazard-control', title: 'Abwehr von Wassergefahren',
    referenceAsset: '4.7.1_Abwehr von Wassergefahren.svg',
    d: 'M 5 11 C 8 8 11 15 14 11 C 17 8 20 15 23 11 C 25 9 27 10 28 11 M 5 23 H 16 L 21 9 H 26 L 28 15' }),
  icon({ section: '4.7.2', id: 'excavation', title: 'Baggerarbeiten',
    referenceAsset: '4.7.2_Baggerarbeiten.svg',
    d: 'M 5 24 L 12 9 L 20 13 M 20 13 C 22 9 27 10 27 14 C 27 17 24 19 21 17' }),
  icon({ section: '4.7.3', id: 'lighting', title: 'Beleuchten',
    referenceAsset: '4.7.3_Beleuchten.svg',
    d: 'M 10 24 V 12 C 10 9 12 8 14 8 C 17 8 19 10 19 13 C 19 15 17 17 15 17 C 13 17 12 16 12 14 M 6 20 H 10 M 19 13 H 27 M 23 10 L 27 13 L 23 16' }),
  icon({ section: '4.7.4', id: 'ventilation', title: 'Belüften',
    referenceAsset: '4.7.4_Belüften.svg',
    d: 'M 4 11 H 23 M 19 8 L 23 11 L 19 14 M 4 21 H 23 M 19 18 L 23 21 L 19 24 M 10 8 V 14 M 16 18 V 24' }),
  icon({ section: '4.7.5', id: 'air-extraction', title: 'Entlüften',
    referenceAsset: '4.7.5_Entlüften.svg',
    d: 'M 4 13 H 23 M 19 10 L 23 13 L 19 16 M 4 21 H 23 M 19 18 L 23 21 L 19 24 M 10 8 V 16 M 16 18 V 24' }),
  icon({ section: '4.7.6', id: 'explosive-ordnance-clearance', title: 'Kampfmittelräumung',
    referenceAsset: '4.7.6_Kampfmittelräumung.svg',
    d: 'M 16 8 C 10 8 6 12 6 16 C 6 21 10 24 16 24 C 22 24 26 21 26 16 C 26 12 22 8 16 8 Z M 16 11 C 12 11 10 13 10 16 C 10 19 12 21 16 21 C 20 21 22 19 22 16 C 22 13 20 11 16 11 Z' }),
  icon({ section: '4.7.7', id: 'hand-tools', title: 'Einsatz von Handwerkzeugen',
    referenceAsset: '4.7.7_Einsatz von Handwerkzeugen.svg',
    d: 'M 6 23 L 23 8 M 10 8 L 26 23 M 21 8 L 25 8 L 25 12 M 8 8 L 12 8 L 12 12' }),
  icon({ section: '4.7.8', id: 'forklift-lifting', title: 'Hebearbeit mit Gabelstapler',
    referenceAsset: '4.7.8_Hebearbeit mit Gabelstapler.svg',
    d: 'M 10 8 V 24 M 12 8 V 18 H 22 M 22 18 V 20 H 26' }),
  icon({ section: '4.7.9', id: 'crane-lifting', title: 'Hebearbeit mit Kran',
    referenceAsset: '4.7.9_Hebearbeit mit Kran.svg',
    d: 'M 9 24 V 8 H 25 V 13 C 25 16 22 17 20 15' }),
  icon({ section: '4.7.10', id: 'lifting-loads-persons', title: 'Heben von Lasten oder Personen',
    referenceAsset: '4.7.10_Heben von Lasten oder Personen.svg',
    d: 'M 16 8 V 13 M 13 11 L 16 8 L 19 11 M 16 13 L 22 19 L 16 24 L 10 19 Z' }),
  icon({ section: '4.7.10', id: 'lifting-loads-persons', variant: 'alternative',
    title: 'Heben von Lasten oder Personen',
    referenceAsset: '4.7.10_Heben von Lasten oder Personen_Alternative.svg',
    d: 'M 16 8 V 14 M 13 11 L 16 8 L 19 11 M 11 14 H 21 V 24 H 11 Z' }),
] as const;
```

Add eleven own pending review objects. Run inventory/gates, update eleven snapshot pairs, inspect
them, typecheck, then commit:

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capability-inventory.test.ts packages/catalog/src/pictograms/gate.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts -u
rtk pnpm typecheck
```

Expected: Vor `-u` fehlen genau elf neue Snapshotpaare; danach sind 4.7.1–4.7.10 einschließlich
der Alternative von 4.7.10 grün und visuell geprüft.

```bash
rtk git add packages/schema/src/taxonomy.ts packages/catalog/src/pictograms packages/catalog/src/domain-reviews.ts packages/catalog/src/__snapshots__
rtk git commit -m "feat(catalog): technische Fähigkeiten 4.7.1 bis 4.7.10"
```

- [ ] **Step 2: 4.7.11 bis 4.7.20 ergänzen**

Append to the same array before `] as const`:

```ts
  icon({ section: '4.7.11', id: 'lifting-clearing', title: 'Heben / Räumen',
    referenceAsset: '4.7.11_Heben-Räumen.svg',
    d: 'M 5 24 L 14 13 L 18 17 M 14 13 V 8 M 14 17 H 22 V 13 H 27' }),
  icon({ section: '4.7.12', id: 'remote-manipulation', title: 'Fernmanipulieren',
    referenceAsset: '4.7.12_Fernmanipulieren.svg',
    d: 'M 5 17 H 12 L 18 11 M 18 11 L 24 17 L 20 21 L 14 15 M 24 17 H 28' }),
  icon({ section: '4.7.13', id: 'chainsaw', title: 'Motorsägearbeiten',
    referenceAsset: '4.7.13_Motorsägearbeiten.svg',
    d: 'M 5 14 H 9 V 12 Q 9 10 11 10 H 17 Q 19 10 19 12 V 14 H 25 Q 28 14 28 17 Q 28 20 25 20 H 11 Q 9 20 9 18 H 5 Z' }),
  icon({ section: '4.7.14', id: 'pumping', title: 'Pumpen',
    referenceAsset: '4.7.14_Pumpen.svg',
    d: 'M 16 9 C 11 9 8 12 8 16 C 8 20 11 23 16 23 C 21 23 24 20 24 16 C 24 12 21 9 16 9 Z M 16 9 V 8 M 16 23 V 24 M 8 16 H 5 M 24 16 H 27 M 10 10 L 8 8 M 22 10 L 24 8 M 10 22 L 8 24 M 22 22 L 24 24' }),
  icon({ section: '4.7.15', id: 'mechanized-clearing', title: 'Räumarbeiten mit Maschine',
    referenceAsset: '4.7.15_Räumarbeiten mit Maschine.svg',
    d: 'M 5 18 H 18 V 10 M 18 18 L 27 20 M 18 10 V 8' }),
  icon({ section: '4.7.16', id: 'safety', title: 'Sicherheit',
    referenceAsset: '4.7.16_Sicherheit.svg',
    d: 'M 16 8 L 25 11 V 18 C 25 21 21 23 16 24 C 11 23 7 21 7 18 V 11 Z' }),
  icon({ section: '4.7.17', id: 'blasting', title: 'Sprengen',
    referenceAsset: '4.7.17_Sprengen.svg',
    d: 'M 11 8 H 21 L 20 19 C 20 23 18 24 16 24 C 14 24 12 23 12 19 Z' }),
  icon({ section: '4.7.18', id: 'technical-assistance', title: 'Technische Hilfeleistung',
    referenceAsset: '4.7.18_Technische Hilfeleistung.svg',
    d: 'M 5 15 C 7 12 9 18 11 15 M 11 13 H 21 V 21 H 11 Z M 21 15 L 27 12 M 21 19 L 27 22' }),
  icon({ section: '4.7.19', id: 'transport', title: 'Transportieren',
    referenceAsset: '4.7.19_Transportieren.svg',
    d: 'M 16 8 C 10 8 6 12 6 16 C 6 20 10 24 16 24 C 22 24 26 20 26 16 C 26 12 22 8 16 8 Z M 16 8 V 24 M 6 16 H 26 M 9 10 L 23 22 M 23 10 L 9 22' }),
  icon({ section: '4.7.20', id: 'door-opening', title: 'Türöffnung',
    referenceAsset: '4.7.20_Türöffnung.svg',
    d: 'M 9 24 V 8 H 23 V 24 M 9 8 L 20 11 V 22 L 9 24 M 18 16 H 19' }),
```

Add ten IDs and ten own pending reviews, then run:

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capability-inventory.test.ts packages/catalog/src/pictograms/gate.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts -u
rtk pnpm typecheck
```

Expected: Vor `-u` fehlen genau zehn neue Snapshotpaare; danach sind 4.7.11–4.7.20 grün und
visuell geprüft.

Then commit:

```bash
rtk git add packages/schema/src/taxonomy.ts packages/catalog/src/pictograms packages/catalog/src/domain-reviews.ts packages/catalog/src/__snapshots__
rtk git commit -m "feat(catalog): technische Fähigkeiten 4.7.11 bis 4.7.20"
```

- [ ] **Step 3: 4.7.21 bis 4.7.28 ergänzen und Bereich 4.7 abschließen**

```ts
  icon({ section: '4.7.21', id: 'overcoming-height-differences',
    title: 'Höhenunterschiede überwinden',
    referenceAsset: '4.7.21_Höhenunterschiede überwinden.svg',
    d: 'M 6 22 H 13 V 10 H 26 M 13 8 L 10 11 M 13 8 L 16 11 M 13 24 L 10 21 M 13 24 L 16 21' }),
  icon({ section: '4.7.22', id: 'securing', title: 'Absicherung',
    referenceAsset: '4.7.22_Absicherung.svg',
    d: 'M 9 24 H 23 M 11 22 L 14 9 H 18 L 21 22 Z M 13 16 L 20 14 M 12 20 L 21 18' }),
  icon({ section: '4.7.23', id: 'optical-warning', title: 'Warnen mit optischen Anzeigen',
    referenceAsset: '4.7.23_Warnen mit optischen Anzeigen.svg',
    d: 'M 7 9 H 25 V 21 H 7 Z M 16 12 V 13 M 16 15 V 19 M 13 24 H 19 M 16 21 V 24' }),
  icon({ section: '4.7.24', id: 'loudspeaker-warning', title: 'Warnen mit Lautsprecherdurchsagen',
    referenceAsset: '4.7.24_Warnen mit Lautsprecherdurchsagen.svg',
    d: 'M 5 13 H 9 L 20 8 V 24 L 9 19 H 5 Z M 22 12 C 26 14 26 18 22 20 M 24 9 C 28 12 28 21 24 23' }),
  icon({ section: '4.7.25', id: 'siren-warning', title: 'Warnen mit Sirenen',
    referenceAsset: '4.7.25_Warnen mit Sirenen.svg',
    d: 'M 7 16 C 8 10 12 8 16 8 C 20 8 24 10 25 16 Z M 16 16 V 24 M 12 24 H 20' }),
  icon({ section: '4.7.26', id: 'water-conveyance', title: 'Wasserförderung',
    referenceAsset: '4.7.26_Wasserförderung.svg',
    d: 'M 8 11 C 11 8 14 15 17 11 C 20 8 23 15 26 11 M 7 19 C 7 17 5 16 4 18 C 4 20 5 22 7 22 C 9 22 10 20 9 19 C 9 18 8 18 7 19 Z M 9 20 H 27 M 23 16 L 27 20 L 23 24' }),
  icon({ section: '4.7.27', id: 'water-retention', title: 'Wasserrückhaltung',
    referenceAsset: '4.7.27_Wasserrückhaltung.svg',
    d: 'M 6 11 C 9 8 12 15 15 11 C 18 8 21 15 24 11 M 27 8 V 24 H 6' }),
  icon({ section: '4.7.28', id: 'load-pulling', title: 'Ziehen von Lasten',
    referenceAsset: '4.7.28_Ziehen von Lasten.svg',
    d: 'M 5 13 H 13 V 21 H 5 Z M 13 17 H 27 M 23 13 L 27 17 L 23 21' }),
```

Add eight IDs and eight own pending reviews. Run the targeted tests and snapshot update. Then run
the entire suite once because 4.7 is the largest accumulation point:

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capability-inventory.test.ts packages/catalog/src/pictograms/gate.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts -u
rtk pnpm typecheck
rtk pnpm test
rtk pnpm cli coverage
```

Expected: Der erste Snapshotlauf meldet genau acht neue Paare; nach `-u` alles PASS. 4.7 trägt 29
Definitions-, Render- und Manifestfälle; Coverage hat weiterhin null technische Nachweislücken.

- [ ] **Step 4: Commit**

```bash
rtk git add packages/schema/src/taxonomy.ts packages/catalog/src/pictograms packages/catalog/src/domain-reviews.ts packages/catalog/src/__snapshots__
rtk git commit -m "feat(catalog): technische Fähigkeiten 4.7.21 bis 4.7.28"
```

### Task 12: 4.8 — Versorgung, Logistik und Infrastruktur (16 IDs)

**Files:**
- Create: `packages/catalog/src/pictograms/capabilities/08-logistics.ts`
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/pictograms/capabilities/index.ts`
- Modify: `packages/catalog/src/pictograms/capability-inventory.test.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`

- [ ] **Step 1: Sechzehn Inventurzeilen und ID-Literale ergänzen**

- [ ] **Step 2: Das Bereichsmodul implementieren**

```ts
import { strokeCapability as icon } from '../authoring.js';

export const LOGISTICS_CAPABILITIES = [
  icon({ section: '4.8.1', id: 'container-resource', title: 'Behälter',
    referenceAsset: '4.8.1_Behälter.svg', d: 'M 8 8 V 24 H 24 V 8' }),
  icon({ section: '4.8.2', id: 'fuels-consumables', title: 'Betriebsstoffe / Verbrauchsgüter',
    referenceAsset: '4.8.2_Betriebsstoffe Verbrauchsgüter.svg',
    d: 'M 7 8 H 25 L 19 16 V 24 H 13 V 16 Z' }),
  icon({ section: '4.8.3', id: 'bridge', title: 'Brücke',
    referenceAsset: '4.8.3_Brücke.svg',
    d: 'M 5 10 L 9 15 H 23 L 27 10 M 5 22 L 9 17 H 23 L 27 22' }),
  icon({ section: '4.8.4', id: 'temporary-bridge-construction', title: 'Behelfsbrückenbau',
    referenceAsset: '4.8.4_Behelfsbrückenbau.svg',
    d: 'M 5 8 L 9 13 H 23 L 27 8 M 5 18 L 9 14 H 23 L 27 18 M 12 18 V 24 M 20 18 V 24 M 12 20 H 20' }),
  icon({ section: '4.8.5', id: 'waste-disposal', title: 'Entsorgung',
    referenceAsset: '4.8.5_Entsorgung.svg',
    d: 'M 9 11 H 23 L 22 24 H 10 Z M 8 11 H 24 M 13 8 H 19 M 12 14 V 21 M 16 14 V 21 M 20 14 V 21' }),
  icon({ section: '4.8.6', id: 'maintenance', title: 'Instandhaltung',
    referenceAsset: '4.8.6_Instandhaltung.svg',
    d: 'M 7 11 C 10 8 13 9 14 12 H 18 C 19 9 22 8 25 11 M 7 21 C 10 24 13 23 14 20 H 18 C 19 23 22 24 25 21 M 14 12 V 20 M 18 12 V 20' }),
  icon({ section: '4.8.7', id: 'sandbag', title: 'Sandsack',
    referenceAsset: '4.8.7_Sandsack.svg',
    d: 'M 13 9 H 19 M 14 9 L 13 11 Q 10 11 10 15 L 9 23 H 23 L 22 15 Q 22 11 19 11 L 18 9 M 13 11 H 19' }),
  icon({ section: '4.8.8', id: 'sandbag-filling', title: 'Sandsackbefüllung',
    referenceAsset: '4.8.8_Sandsackbefüllung.svg',
    d: 'M 6 8 H 26 L 19 16 H 13 Z M 6 8 V 24 M 26 8 V 24 M 13 16 V 22 H 19 V 16' }),
  icon({ section: '4.8.9', id: 'washing-facility', title: 'Sanitäre Einrichtung / Waschmöglichkeit',
    referenceAsset: '4.8.9_Sanitäre Einrichtung_Waschmöglichkeit.svg',
    d: 'M 21 24 V 12 C 21 9 19 8 17 8 C 14 8 12 10 12 13 M 8 15 C 8 12 10 11 12 11 C 14 11 16 12 16 15 Z M 10 18 V 21 M 13 18 V 21 M 16 18 V 21' }),
  icon({ section: '4.8.10', id: 'toilet-facility', title: 'Sanitäre Einrichtung / WC',
    referenceAsset: '4.8.10_Sanitäre Einrichtung_WC.svg',
    d: 'M 5 10 L 8 22 L 11 10 L 14 22 L 17 10 M 27 12 C 25 9 20 9 19 15 C 18 21 23 23 27 20' }),
  icon({ section: '4.8.11', id: 'power-supply', title: 'Stromversorgung',
    referenceAsset: '4.8.11_Stromversorgung.svg',
    d: 'M 19 8 L 11 18 H 17 L 13 24 L 23 14 H 17 Z' }),
  icon({ section: '4.8.12', id: 'drinking-water', title: 'Trinkwasser',
    referenceAsset: '4.8.12_Trinkwasser.svg',
    d: 'M 5 15 H 18 V 12 H 22 V 15 H 26 V 19 M 18 15 V 18' }),
  icon({ section: '4.8.13', id: 'catering', title: 'Verpflegung',
    referenceAsset: '4.8.13_Verpflegung.svg',
    d: 'M 16 8 C 9 8 5 11 5 16 C 5 21 9 24 16 24 C 20 24 23 22 25 19 L 16 16 L 25 11 C 23 9 20 8 16 8 Z' }),
  icon({ section: '4.8.14', id: 'meal-preparation', title: 'Verpflegung / Zubereitung',
    referenceAsset: '4.8.14_Verpflegung_Zubereitung.svg',
    d: 'M 17 8 C 11 8 7 11 7 16 C 7 21 11 24 17 24 C 21 24 24 22 26 19 L 17 16 L 26 11 C 24 9 21 8 17 8 Z M 5 8 V 24 M 4 8 C 4 10 6 10 6 8 M 4 12 H 6' }),
  icon({ section: '4.8.15', id: 'rapid-deployment-tent', title: 'Schnelleinsatzzelt',
    referenceAsset: '4.8.15_Schnelleinsatzzelt.svg',
    d: 'M 7 24 V 12 L 11 8 H 21 L 25 12 V 24' }),
  icon({ section: '4.8.16', id: 'frame-tent', title: 'Stangengerüstzelt',
    referenceAsset: '4.8.16_Stangengerüstzelt.svg',
    d: 'M 7 24 L 16 8 L 25 24 Z M 10 8 L 22 24 M 22 8 L 10 24' }),
] as const;
```

- [ ] **Step 3: Sechzehn Reviewobjekte, Gates, Snapshots und Typecheck abschließen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capability-inventory.test.ts packages/catalog/src/pictograms/gate.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts -u
rtk pnpm typecheck
```

Expected: Vor `-u` fehlen genau 16 neue Snapshotpaare; danach 16 grüne und visuell
unterscheidbare Mehrgrößenbögen. `WC`, Blitz und Zeltmotive bleiben bei 16 px lesbar.

- [ ] **Step 4: Commit**

```bash
rtk git add packages/schema/src/taxonomy.ts packages/catalog/src/pictograms packages/catalog/src/domain-reviews.ts packages/catalog/src/__snapshots__
rtk git commit -m "feat(catalog): Logistik- und Infrastrukturfähigkeiten aus Kapitel 4.8"
```

### Task 13: 4.9 — Information und Kommunikation (1 ID)

**Files:**
- Create: `packages/catalog/src/pictograms/capabilities/09-information-communications.ts`
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/pictograms/capabilities/index.ts`
- Modify: `packages/catalog/src/pictograms/capability-inventory.test.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`

- [ ] **Step 1: Inventurzeile, ID und Definition ergänzen**

```ts
import { strokeCapability as icon } from '../authoring.js';

export const INFORMATION_COMMUNICATIONS_CAPABILITIES = [
  icon({
    section: '4.9.1',
    id: 'information-communications',
    title: 'Information und Kommunikation / Fernmeldewesen',
    referenceAsset: '4.9.1_Information und Kommunikation Fernmeldewesen.svg',
    d: 'M 5 12 L 13 19 V 10 L 27 21',
  }),
] as const;
```

- [ ] **Step 2: Eigenes Pending-Review, Gates und Snapshots ergänzen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capability-inventory.test.ts packages/catalog/src/pictograms/gate.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts -u
rtk pnpm typecheck
```

Expected: Vor `-u` fehlt genau ein neues Snapshotpaar; danach eine grüne Definition und ein
visuell geprüftes Paar.

- [ ] **Step 3: Commit**

```bash
rtk git add packages/schema/src/taxonomy.ts packages/catalog/src/pictograms packages/catalog/src/domain-reviews.ts packages/catalog/src/__snapshots__
rtk git commit -m "feat(catalog): IuK-Fähigkeit aus Kapitel 4.9"
```

### Task 14: 4.10 — Veterinärwesen (7 IDs)

**Files:**
- Create: `packages/catalog/src/pictograms/capabilities/10-veterinary.ts`
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/pictograms/capabilities/index.ts`
- Modify: `packages/catalog/src/pictograms/capability-inventory.test.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`

- [ ] **Step 1: Sieben Inventurzeilen und ID-Literale ergänzen**

- [ ] **Step 2: Das Bereichsmodul implementieren**

```ts
import { strokeCapability as icon } from '../authoring.js';

export const VETERINARY_CAPABILITIES = [
  icon({ section: '4.10.1', id: 'veterinary', title: 'Veterinärwesen',
    referenceAsset: '4.10.1_Veterinärwesen.svg', d: 'M 7 8 H 11 L 16 24 L 21 8 H 25' }),
  icon({ section: '4.10.2', id: 'slaughter-culling', title: 'Schlachten / Keulen',
    referenceAsset: '4.10.2_Schlachten_Keulen.svg',
    d: 'M 5 13 H 27 M 9 13 L 13 8 L 17 13 Z M 11 16 H 21' }),
  icon({ section: '4.10.3', id: 'chicken', title: 'Huhn',
    referenceAsset: '4.10.3_Huhn.svg',
    d: 'M 7 8 H 11 L 16 24 L 21 8 H 25 M 5 21 C 7 18 8 22 10 19 C 12 21 12 24 9 24 M 7 18 L 6 16 M 9 18 L 10 16' }),
  icon({ section: '4.10.4', id: 'horse', title: 'Pferd',
    referenceAsset: '4.10.4_Pferd.svg',
    d: 'M 7 8 H 11 L 16 24 L 21 8 H 25 M 5 23 C 4 20 5 16 8 17 C 10 18 9 21 8 23 M 4 24 H 10' }),
  icon({ section: '4.10.5', id: 'cattle', title: 'Rind',
    referenceAsset: '4.10.5_Rind.svg',
    d: 'M 7 8 H 11 L 16 24 L 21 8 H 25 M 5 19 C 6 16 8 16 9 19 C 10 16 12 16 13 19 M 5 19 L 6 23 M 13 19 L 12 23 M 7 21 H 11' }),
  icon({ section: '4.10.6', id: 'sheep', title: 'Schaf',
    referenceAsset: '4.10.6_Schaf.svg',
    d: 'M 7 8 H 11 L 16 24 L 21 8 H 25 M 5 21 C 4 18 6 16 8 18 C 9 15 12 16 12 19 C 15 20 13 24 10 23 C 8 24 5 24 5 21 Z' }),
  icon({ section: '4.10.7', id: 'pig', title: 'Schwein',
    referenceAsset: '4.10.7_Schwein.svg',
    d: 'M 7 8 H 11 L 16 24 L 21 8 H 25 M 5 20 C 5 16 13 16 13 20 C 13 24 5 24 5 20 Z M 7 20 C 7 19 8 19 8 20 C 8 21 7 21 7 20 M 10 20 C 10 19 11 19 11 20 C 11 21 10 21 10 20' }),
] as const;
```

- [ ] **Step 3: Sieben Reviewobjekte, Gates, Snapshots und Typecheck abschließen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capability-inventory.test.ts packages/catalog/src/pictograms/gate.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts
rtk pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts packages/catalog/src/multi-size-snapshots.test.ts -u
rtk pnpm typecheck
```

Expected: Vor `-u` fehlen genau sieben neue Snapshotpaare; danach sieben grüne Definitionen. Die
sechs tierartspezifischen Marken sind in den 256-px-Bögen unterscheidbar und nirgends als
domain-approved behauptet.

- [ ] **Step 4: Commit**

```bash
rtk git add packages/schema/src/taxonomy.ts packages/catalog/src/pictograms packages/catalog/src/domain-reviews.ts packages/catalog/src/__snapshots__
rtk git commit -m "feat(catalog): Veterinärfähigkeiten aus Kapitel 4.10"
```

### Task 15: Das 88/92-Inventar und alle abgeleiteten Register exakt schließen

**Files:**
- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/pictograms/capabilities/index.ts`
- Modify: `packages/catalog/src/pictograms/capability-inventory.test.ts`
- Modify: `packages/catalog/src/elements.test.ts`
- Modify: `packages/catalog/src/coverage-manifest.ts`
- Modify: `packages/catalog/src/coverage-manifest.test.ts`
- Modify: `packages/catalog/src/domain-reviews.test.ts`
- Modify: `packages/catalog/src/render-cases.test.ts`

- [ ] **Step 1: `CapabilityId` aus einer zur Laufzeit prüfbaren finalen Liste ableiten**

Die bisher bereichsweise gewachsene Union in `taxonomy.ts` in diese vollständige Form überführen:

```ts
export const CAPABILITY_IDS = [
  'cbrn-protection',
  'cbrn-detection',
  'decontamination',
  'water-environmental-damage-control',
  'drinking-water-treatment',
  'radioactive-materials',
  'biological-materials',
  'chemical-materials',
  'care',
  'psychosocial-emergency-care',
  'pastoral-care',
  'temporary-accommodation-resting',
  'temporary-accommodation-seating',
  'fire-fighting',
  'service-water',
  'foam-agent',
  'solid-extinguishing-agent',
  'gaseous-extinguishing-agent',
  'respiratory-protection',
  'reconnaissance',
  'biological-location',
  'technical-location',
  'recovery',
  'rescue-portable-ladders',
  'rescue-aerial-ladder',
  'rescue-articulated-boom',
  'watercraft-operations',
  'mountain-rescue',
  'special-height-depth-rescue',
  'water-rescue',
  'medical-service',
  'nursing',
  'intensive-care',
  'physician',
  'patient-transport',
  'hospital',
  'water-hazard-control',
  'excavation',
  'lighting',
  'ventilation',
  'air-extraction',
  'explosive-ordnance-clearance',
  'hand-tools',
  'forklift-lifting',
  'crane-lifting',
  'lifting-loads-persons',
  'lifting-clearing',
  'remote-manipulation',
  'chainsaw',
  'pumping',
  'mechanized-clearing',
  'safety',
  'blasting',
  'technical-assistance',
  'transport',
  'door-opening',
  'overcoming-height-differences',
  'securing',
  'optical-warning',
  'loudspeaker-warning',
  'siren-warning',
  'water-conveyance',
  'water-retention',
  'load-pulling',
  'container-resource',
  'fuels-consumables',
  'bridge',
  'temporary-bridge-construction',
  'waste-disposal',
  'maintenance',
  'sandbag',
  'sandbag-filling',
  'washing-facility',
  'toilet-facility',
  'power-supply',
  'drinking-water',
  'catering',
  'meal-preparation',
  'rapid-deployment-tent',
  'frame-tent',
  'information-communications',
  'veterinary',
  'slaughter-culling',
  'chicken',
  'horse',
  'cattle',
  'sheep',
  'pig',
] as const;

export type CapabilityId = (typeof CAPABILITY_IDS)[number];
```

- [ ] **Step 2: Den finalen Bereichsindex explizit und vollständig machen**

```ts
import type { CatalogPictogramDefinition } from '../catalog-definition.js';
import { CBRN_CAPABILITIES } from './01-cbrn.js';
import { CARE_CAPABILITIES } from './02-care.js';
import { FIRE_FIGHTING_CAPABILITIES } from './03-fire-fighting.js';
import { RECONNAISSANCE_CAPABILITIES } from './04-reconnaissance.js';
import { RESCUE_CAPABILITIES } from './05-rescue.js';
import { MEDICAL_CAPABILITIES } from './06-medical.js';
import { TECHNICAL_ASSISTANCE_CAPABILITIES } from './07-technical-assistance.js';
import { LOGISTICS_CAPABILITIES } from './08-logistics.js';
import { INFORMATION_COMMUNICATIONS_CAPABILITIES } from './09-information-communications.js';
import { VETERINARY_CAPABILITIES } from './10-veterinary.js';

export const CAPABILITY_PICTOGRAMS = [
  ...CBRN_CAPABILITIES,
  ...CARE_CAPABILITIES,
  ...FIRE_FIGHTING_CAPABILITIES,
  ...RECONNAISSANCE_CAPABILITIES,
  ...RESCUE_CAPABILITIES,
  ...MEDICAL_CAPABILITIES,
  ...TECHNICAL_ASSISTANCE_CAPABILITIES,
  ...LOGISTICS_CAPABILITIES,
  ...INFORMATION_COMMUNICATIONS_CAPABILITIES,
  ...VETERINARY_CAPABILITIES,
] as const satisfies readonly CatalogPictogramDefinition[];
```

- [ ] **Step 3: Die Abschlussinvarianten als Tests festnageln**

`capability-inventory.test.ts` muss mindestens diese vollständigen, nicht selbstbezüglichen
Zusicherungen enthalten:

```ts
expect(CAPABILITY_IDS).toHaveLength(88);
expect(new Set(CAPABILITY_IDS).size).toBe(88);
expect(CAPABILITY_PICTOGRAMS).toHaveLength(92);
expect(CAPABILITY_PICTOGRAMS.filter((item) => item.variant === 'primary')).toHaveLength(88);
expect(CAPABILITY_PICTOGRAMS.filter((item) => item.variant === 'alternative')).toHaveLength(4);

const primaryIds = CAPABILITY_PICTOGRAMS
  .filter((item) => item.variant === 'primary')
  .map((item) => item.id.slice('capability.'.length))
  .sort();
expect(primaryIds).toEqual([...CAPABILITY_IDS].sort());

const alternatives = CAPABILITY_PICTOGRAMS
  .filter((item) => item.variant === 'alternative')
  .map((item) => `${item.section}:${item.referenceAsset}`)
  .sort();
expect(alternatives).toEqual([
  '4.1.6:4.1.6_Atomare Stoffe_Alternative.svg',
  '4.1.7:4.1.7_Biologische Stoffe_Alternative.svg',
  '4.1.8:4.1.8_Chemische Stoffe_Alternative.svg',
  '4.7.10:4.7.10_Heben von Lasten oder Personen_Alternative.svg',
]);
```

Zusätzlich über alle 92 Definitionen prüfen:

- `pictogramVariantKey` ist eindeutig;
- ID und Variant stimmen mit dem Registerzugriff überein;
- Referenzasset existiert in `fingerprints.json`;
- Dateiname beginnt mit `${section}_`;
- alle Varianten derselben ID tragen denselben Titel;
- genau eine Primary-Darstellung je `CapabilityId`.

- [ ] **Step 4: Den Scope erst jetzt auf das vollständige Kapitel umstellen**

```ts
scope: ['1', '2', '4', '5.4', 'C.1.1', 'C.1.2', 'D.3.7'],
```

Vor diesem Schritt wäre `'4'` eine falsche Vollständigkeitsbehauptung gewesen. Jetzt müssen die
abgeleiteten Register exakt ergeben:

| Menge | Erwartung |
|---|---:|
| Capability IDs | 88 |
| Capability definitions / chapter-4 manifest rows | 92 |
| Element descriptors | 99 = 7 organizations + 4 strengths + 88 capabilities |
| Manifest rows with `coverage: element` | 103 = 7 + 4 + 92 |
| Manifest rows total | 114 = 8 bases + 3 recipes + 103 elements |
| Render cases | 103 = 8 bases + 3 recipes + 92 pictograms |
| Manifest domain reviews | 114 |
| All domain review carriers | 127 = 114 + 12 sources + 1 profile |

- [ ] **Step 5: Alle strukturellen Tests ausführen**

Run:

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/capability-inventory.test.ts packages/catalog/src/elements.test.ts packages/catalog/src/coverage-manifest.test.ts packages/catalog/src/domain-reviews.test.ts packages/catalog/src/render-cases.test.ts packages/catalog/src/pictograms/gate.test.ts
rtk pnpm typecheck
```

Expected: all PASS with exactly the counts in the table.

- [ ] **Step 6: Commit**

```bash
rtk git add packages/schema/src/taxonomy.ts packages/catalog/src/pictograms
rtk git add packages/catalog/src/elements.test.ts packages/catalog/src/coverage-manifest.ts
rtk git add packages/catalog/src/coverage-manifest.test.ts packages/catalog/src/domain-reviews.test.ts
rtk git add packages/catalog/src/render-cases.test.ts
rtk git commit -m "feat(catalog): Kapitel-4-Inventar mit 88 Fähigkeiten schließen"
```

### Task 16: Vollständige technische Evidenz und visuelle QA abschließen

**Files:**
- Verify: `packages/catalog/src/pictograms/__snapshots__/`
- Verify: `packages/catalog/src/__snapshots__/multi-size/`
- Modify only if a real defect is found: the responsible area module and its snapshots

- [ ] **Step 1: Alle lokalen Piktogrammverträge ausführen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/gate.test.ts packages/catalog/src/pictograms/snapshots.test.ts
```

Expected: 92 Kommando-, 92 Box-, 92 Clipping- and 92 snapshot cases PASS; the manifest claim set
is exactly equal by semantic ID and variant.

- [ ] **Step 2: Globale Rendergates ohne Snapshotupdate ausführen**

```bash
rtk pnpm vitest run packages/catalog/src/render-cases.test.ts packages/catalog/src/a11y-contrast-gate.test.ts packages/catalog/src/multi-size-snapshots.test.ts
```

Expected: 103 unique render cases; all metadata and viewBox checks PASS; all existing file
snapshots match without `-u`.

- [ ] **Step 3: Alle 92 Piktogrammbögen visuell prüfen**

For each `packages/catalog/src/__snapshots__/multi-size/capability.*.svg`, verify and record in the
commit review that:

- 16 px contains visible, non-collapsed geometry;
- 24–256 px preserve the intended motif;
- `accessible-light` remains visible on white;
- `print-monochrome` remains visible and achromatic;
- the four `.alternative` sheets are visually distinct from their primary sheet;
- neighboring meanings within the same area do not collapse to an identical image.

If any item fails, change the responsible independent path, run its local gates, update exactly
its two snapshots, and rerun this task from Step 1.

- [ ] **Step 4: Full regression and Coverage CLI**

```bash
rtk pnpm typecheck
rtk pnpm test
rtk pnpm cli coverage
rtk git diff --check
```

Expected Coverage summary:

```text
Umfang:      1, 2, 4, 5.4, C.1.1, C.1.2, D.3.7
Einträge:    114
Quellen:     12
Offene fachliche Reviews: 127 (114 Manifestreviews, 12 Quellenreviews, 1 Profilreview)
1.0-Blocker: 114 Manifestreviews, 12 Quellenreviews und 1 Profilreview ohne domain: approved, 0 ohne Testnachweis, 0 Kapitel im beanspruchten Umfang ohne Eintrag
Coverage-Gate bestanden.
```

- [ ] **Step 5: Commit only if visual QA required corrections**

```bash
rtk git add packages/catalog/src/pictograms packages/catalog/src/pictograms/__snapshots__ packages/catalog/src/__snapshots__/multi-size
rtk git commit -m "fix(catalog): Kapitel-4-Piktogramme nach Mehrgrößenreview schärfen"
```

If Step 3 found no defect, do not create an empty commit.

### Task 17: Reviewübergabe, README und D.1-Entscheidungsnotiz aktualisieren

**Files:**
- Modify: `docs/reviews/2026-08-06-domain-review-handoff.md`
- Modify: `README.md`
- Create: `docs/decisions/2026-08-06-kapitel-4-faehigkeiten-d1.md`

- [ ] **Step 1: Das Reviewdossier auf 127 Träger aktualisieren**

Replace the old 24-row claim with 114 manifest reviews. Keep the existing 24 rows and append the
92 chapter-4 rows from the target inventory, including four separate alternative rows. State
explicitly:

```text
Reviewpaket vorbereitet, keine fachliche Freigabe erteilt.
Offen: 114 Manifestreviews, 12 Quellenreviews, 1 Profilreview = 127 Reviewträger.
Kapitel 4: 88 Abschnitte, 92 Darstellungen, alle domain: pending.
```

Add the chapter-4 review criteria: semantic meaning, differentiation from neighboring
capabilities, primary/alternative relationship, profile assignment, legibility at operational
sizes, and whether the independent reconstruction should remain `derived` or be documented as a
deviation. Do not assign a human reviewer or `approved` status.

- [ ] **Step 2: README status accurately update**

Document that D.1 technically covers all of chapter 4, that 92 render cases pass the global gates,
and that this is not a domain approval or normative claim. Keep the current BABZ/AFKzV status and
the local-reference licensing boundary unchanged.

- [ ] **Step 3: Write the D.1 decision note with fixed conclusions**

The note contains these sections and conclusions:

1. **Inventory:** 88 sections, 92 depictions, exactly four alternatives.
2. **Variant model:** `(PictogramId, DepictionVariant)` is the unique identity; composition defaults
   to primary.
3. **Authorship:** all coordinates are independent millimeter constructions; no BABZ or upstream
   path data was copied.
4. **Evidence:** 92 local contract/snapshot cases and 103 global render cases; zero missing
   technical evidence.
5. **Boundary:** all 92 chapter-4 domain reviews remain pending; technical gates do not establish
   tactical correctness.
6. **Next slice:** D.2 is now next and covers the 61 chapter-5.8 pictogram sections.

- [ ] **Step 4: Documentation and repository checks**

```bash
rtk git diff --check
rtk pnpm typecheck
rtk pnpm test
rtk pnpm cli coverage
```

Expected: all green and the exact 114/127 Coverage counts from Task 16.

- [ ] **Step 5: Commit**

```bash
rtk git add README.md docs/reviews/2026-08-06-domain-review-handoff.md docs/decisions/2026-08-06-kapitel-4-faehigkeiten-d1.md
rtk git commit -m "docs: Kapitel-4-Ausbau D.1 und offene Fachreviews dokumentieren"
```

---

## Self-Review des Plans

### Spec-Abdeckung

| Anforderung | Planbeleg |
|---|---|
| D.1 nach D.0 und Gate-Härtung | Einordnung, Task 1 |
| 88 Kapitel-4-Abschnitte | Zielinventar, Tasks 5–15 |
| 92 Einträge mit vier Alternativen | Variantenkorrektur, Tasks 2, 5, 11, 15 |
| 41 Upstream-Bildideen zuerst | Die einfachen, vergleichbaren Bereiche 4.1–4.7 beginnen vor Logistik/Veterinär; Geometrie bleibt unabhängig |
| eigenständige Codegeometrie | Autorenvertrag und vollständige Pfade in Tasks 5–14 |
| `CapabilityId` nicht vorauseilend | bereichsweises Wachstum, finaler Runtime-Vertrag in Task 15 |
| Scope erst nach Vollständigkeit | Task 15, Step 4 |
| jedes Piktogramm resolve-/render-/gatebar | Tasks 2–4, 15–16 |
| technische Evidenz ohne Referenzbestand in CI | generische Gates/Snapshots, keine neue Dateisystemabhängigkeit |
| keine erfundene fachliche Freigabe | eigener `pending`-Eintrag je Darstellung, Tasks 5–17 |
| nächster Slice D.2 | Task 17, Entscheidungsnotiz |

### Abhängigkeiten und Typkonsistenz

- `PictogramDefinition.variant` uses the existing `DepictionVariant` type; no second variant union.
- `CatalogPictogramDefinition` adds only `section` and `referenceAsset` to the schema type.
- `pictogramVariantKey` is used for evidence equality; `pictogramRenderId` only for unique file and
  render IDs.
- `pictogram(id)` remains source-compatible for the composer; the optional second parameter exposes
  alternatives without changing `SymbolSpec`.
- `CAPABILITY_IDS` is the source of the `CapabilityId` union; primary definitions must be set-equal
  to that array.
- Element descriptors group variants by semantic ID; manifest and render cases remain per variant.
- The final arithmetic is consistent: 88 IDs → 92 depictions → 99 descriptors → 103 element
  manifest rows → 114 total manifest rows → 127 total review carriers.

### Explicit non-scope

- D.2–D.5 content;
- chapter 3 properties, designation foot zone and missing base symbols;
- legacy migration and additional output packages;
- a public variant-selection field in `SymbolSpec`;
- domain approval of any chapter-4 meaning;
- copied geometry from the local BABZ assets or `phjardas/taktische-zeichen`;
- a claim that the project baseline is a currently binding service regulation.
