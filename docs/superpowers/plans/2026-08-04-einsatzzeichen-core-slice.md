# Einsatzzeichen Slice 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein regelbasierter Generator, der die Grundzeichen der BBK/BABZ-Systematik millimetergenau erzeugt und an drei zusammengesetzten Zeichen beweist, dass Komposition aus Regeln funktioniert.

**Architecture:** Ein dependency-freies Geometrie-IR in Millimetern wird von zwei Renderern (SVG, Canvas) konsumiert. Ein Kompositionsmotor setzt aus einer `SymbolSpec` Kopfzone, Körper und Piktogramm nach Layoutprofilen zusammen. Ein CLI leitet aus dem lokalen Referenzbestand verlustbehaftete Kennzahlen ab, gegen die die erzeugte Geometrie in CI geprüft wird — ohne dass die Referenzdateien je eingecheckt werden.

**Tech Stack:** TypeScript 5.7 (strict, ESM), pnpm Workspaces, Vitest 3, tsx, Node 22. Keine Laufzeitabhängigkeiten in `schema` und `core`.

**Spec:** `docs/superpowers/specs/2026-08-04-einsatzzeichen-core-slice-design.md`

## Global Constraints

- **Alle Längen im IR und im Katalog sind Millimeter.** Umrechnung nur im Renderer.
- **1 mm = 72 / 25.4 = 2.8346456692913385 SVG-Einheiten.** Nie gerundete Konstanten hart eintragen.
- **Vergleichstoleranz: 0.01 SVG-Einheiten.** Die Referenz enthält Exportrundungen (`2.834` neben `2.835`).
- **Standard-Strichstärke 0,5 mm. Standard-viewBox 32 × 32 mm.**
- **`@einsatzzeichen/schema` und `@einsatzzeichen/core` haben null Laufzeitabhängigkeiten.**
- **`taktische-zeichen/` wird niemals eingecheckt.** Keine Pfaddaten, keine Geometrie, keine Datei aus der Referenz übernehmen. Erlaubt ist ausschließlich die Ableitung von Kennzahlen.
- **Code-Bezeichner englisch, Katalogdaten und Titel deutsch.**
- **TypeScript `strict: true`, `"type": "module"`, Imports mit `.js`-Endung** (NodeNext).
- **Commit-Sprache Deutsch**, Präfixe `feat:`, `test:`, `chore:`, `fix:`.

## Vermessene Referenzwerte

Diese Werte sind bereits aus dem Referenzbestand abgeleitet und im Plan verwendet. Alle Angaben sind **Mittellinien** in Millimetern.

| Zeichen | Geometrie |
|---|---|
| `1.1 Taktische Formation` | `rect x=1 y=6 w=30 h=20` |
| `1.2 Person` | Quadrat Seite 21,2132 (= 15·√2), Mittelpunkt (16 \| 16), 45° gedreht |
| `1.6 Funktionsstelle` | `circle cx=16 cy=16 r=14` |
| `1.7 Gebäude` | geschlossener Polyzug `(16\|3) (1\|10) (1\|26) (31\|26) (31\|10)` |
| `1.8 Behälter` | `rect x=4 y=4 w=24 h=24` |
| Stärkepunkt | `r = 1,5` |
| Punktreihe horizontal | `cy = 3,5`, `cx = 11 / 16 / 21`, Unterkante 5 |
| Punkte vertikal gestapelt | `cx = 16`, `cy = 2,5` und `6,5`, Unterkante 8 |
| `D.3.7` Kopfzone | Punktreihe `cy = 2,5`, Unterkante 4 |
| `D.3.7` Körper | gedrehtes Quadrat, halbe Diagonale 13, Mittelpunkt (16 \| 18), Spitze bei 5 |

### Die Platzierungsregel

Die Kopfzone sitzt **nicht** an einer festen Höhe. Dieselbe Punktreihe steht bei `E.1.18` (rechteckiger Körper) auf `cy = 3,5` und bei `D.3.7` (gedrehtes Quadrat) auf `cy = 2,5`. Beide Werte folgen aus einem Algorithmus mit zwei Konstanten:

```
headTop    = max(1 mm, defaultAnchor − 1 mm − headHeight)
headBottom = headTop + headHeight
bodyAnchor = max(defaultAnchor, headBottom + 1 mm)
```

`defaultAnchor` ist der oberste Punkt der Körper-Mittellinie **ohne** Kopfzone: 6 mm beim rechteckigen Körper (`1.1`), 1 mm beim gedrehten Quadrat (`1.2`), 2 mm beim Kreis (`1.6`).

An allen drei vermessenen Konstellationen belegt:

| Konstellation | defaultAnchor | headHeight | headTop | headBottom | bodyAnchor | Referenz |
|---|---|---|---|---|---|---|
| Rechteck + Punktreihe | 6 | 3 | 2 | 5 | **6** | `C.1.2` = 17,008 ✓ |
| Rechteck + Punktstapel | 6 | 7 | 1 | 8 | **9** | `C.1.1` = 25,512 ✓ |
| Gedrehtes Quadrat + Reihe | 1 | 3 | 1 | 4 | **5** | `D.3.7` = 14,174 ✓ |

Die Zeile „Rechteck + Punktreihe" erklärt, warum `C.1.2_Löschgruppe` denselben Körperversatz hat wie `1.1` ohne jede Stärkeangabe: die Reihe passt in den vorhandenen Kopfraum, der Körper muss nicht ausweichen. Der Stapel passt nicht und schiebt ihn um 3 mm.

**Konsequenz für die Architektur:** Der Katalog liefert die Kopfzone **relativ** (Marken plus Höhe), das Layoutprofil setzt sie absolut. Eine Funktion `strengthHead(id)` mit festen `cy`-Werten wäre falsch.

---

### Task 1: Monorepo-Grundgerüst und Einheitensystem

**Files:**
- Modify: `package.json`
- Modify: `mise.toml`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `packages/schema/package.json`
- Create: `packages/schema/src/units.ts`
- Create: `packages/schema/src/index.ts`
- Test: `packages/schema/src/units.test.ts`

**Interfaces:**
- Consumes: nichts
- Produces: `UNITS_PER_MM: number`, `TOLERANCE_UNITS: number`, `mmToUnits(mm: number): number`, `unitsToMm(units: number): number`, `unitsEqual(a: number, b: number, tolerance?: number): boolean` aus `@einsatzzeichen/schema`

- [ ] **Step 1: Workspace-Dateien anlegen**

`pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
```

`mise.toml` vollständig ersetzen:

```toml
[tools]
node = "22"
pnpm = "latest"
```

`package.json` vollständig ersetzen:

```json
{
  "name": "einsatzzeichen",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "Semantisches Symbolsystem für taktische Zeichen der Gefahrenabwehr",
  "license": "MIT",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "cli": "tsx packages/cli/src/index.ts"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  },
  "devEngines": {
    "packageManager": {
      "name": "pnpm",
      "version": "^11.10.0",
      "onFail": "download"
    }
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "types": ["node"],
    "baseUrl": ".",
    "paths": {
      "@einsatzzeichen/schema": ["packages/schema/src/index.ts"],
      "@einsatzzeichen/core": ["packages/core/src/index.ts"],
      "@einsatzzeichen/catalog": ["packages/catalog/src/index.ts"]
    }
  },
  "include": ["packages/*/src/**/*.ts", "vitest.config.ts"]
}
```

`vitest.config.ts`:

```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const pkg = (name: string): string =>
  fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@einsatzzeichen/schema': pkg('schema'),
      '@einsatzzeichen/core': pkg('core'),
      '@einsatzzeichen/catalog': pkg('catalog'),
    },
  },
  test: {
    include: ['packages/*/src/**/*.test.ts'],
  },
});
```

`packages/schema/package.json`:

```json
{
  "name": "@einsatzzeichen/schema",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts"
}
```

- [ ] **Step 2: Abhängigkeiten installieren**

Run: `pnpm install -w -D typescript@^5.7.0 vitest@^3.0.0 tsx@^4.19.0 @types/node@^22.0.0`
Expected: Installation ohne Fehler, `node_modules/` vorhanden.

- [ ] **Step 3: Den fehlschlagenden Test schreiben**

`packages/schema/src/units.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mmToUnits, unitsEqual, unitsToMm, UNITS_PER_MM } from './units.js';

describe('units', () => {
  it('rechnet 1 mm in 2,8346 SVG-Einheiten um', () => {
    expect(UNITS_PER_MM).toBeCloseTo(2.8346456693, 9);
  });

  it('trifft die Grundfläche der Referenz (32 mm = 90.709)', () => {
    expect(unitsEqual(mmToUnits(32), 90.709)).toBe(true);
  });

  it('trifft die Strichstärke der Referenz (0,5 mm = 1.417)', () => {
    expect(unitsEqual(mmToUnits(0.5), 1.417)).toBe(true);
  });

  it('trifft den Körper der Referenz (30 x 20 mm = 85.04 x 56.693)', () => {
    expect(unitsEqual(mmToUnits(30), 85.04)).toBe(true);
    expect(unitsEqual(mmToUnits(20), 56.693)).toBe(true);
  });

  it('trifft die Körperposition mit Kopfzone (9 mm = 25.512)', () => {
    expect(unitsEqual(mmToUnits(9), 25.512)).toBe(true);
  });

  it('toleriert das Exportrauschen der Referenz (2.834 und 2.835)', () => {
    expect(unitsEqual(mmToUnits(1), 2.834)).toBe(true);
    expect(unitsEqual(mmToUnits(1), 2.835)).toBe(true);
  });

  it('lehnt Abweichungen oberhalb der Toleranz ab', () => {
    expect(unitsEqual(90.709, 90.72)).toBe(false);
  });

  it('ist umkehrbar', () => {
    expect(unitsToMm(mmToUnits(17.5))).toBeCloseTo(17.5, 10);
  });
});
```

- [ ] **Step 4: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm vitest run packages/schema/src/units.test.ts`
Expected: FAIL — `Failed to resolve import "./units.js"`

- [ ] **Step 5: Implementierung schreiben**

`packages/schema/src/units.ts`:

```ts
/** SVG-Einheiten pro Millimeter bei 72 dpi. Grundlage des gesamten Koordinatensystems. */
export const UNITS_PER_MM = 72 / 25.4;

/**
 * Vergleichstoleranz in SVG-Einheiten. Die BABZ-Referenz enthält Exportrundungen
 * des Illustrator-Plugins (2.834 neben 2.835, 17.008 neben 17.009).
 */
export const TOLERANCE_UNITS = 0.01;

export function mmToUnits(mm: number): number {
  return mm * UNITS_PER_MM;
}

export function unitsToMm(units: number): number {
  return units / UNITS_PER_MM;
}

export function unitsEqual(a: number, b: number, tolerance: number = TOLERANCE_UNITS): boolean {
  return Math.abs(a - b) <= tolerance;
}
```

`packages/schema/src/index.ts`:

```ts
export * from './units.js';
```

- [ ] **Step 6: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm vitest run packages/schema/src/units.test.ts`
Expected: PASS, 8 Tests

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: keine Ausgabe, Exit 0

- [ ] **Step 8: Commit**

```bash
git add package.json mise.toml pnpm-workspace.yaml tsconfig.json vitest.config.ts pnpm-lock.yaml packages/
git commit -m "feat: Monorepo-Grundgerüst und Millimeter-Einheitensystem"
```

---

### Task 2: Geometrie-IR

**Files:**
- Create: `packages/schema/src/geometry.ts`
- Modify: `packages/schema/src/index.ts`
- Test: `packages/schema/src/geometry.test.ts`

**Interfaces:**
- Consumes: nichts aus Task 1 (reine Typdefinitionen)
- Produces: Typen `Length`, `Point`, `ColorToken`, `Rotation`, `Transform`, `PrimitiveRole`, `Style`, `Primitive`, `Drawing`; Konstanten `PALETTE: Record<ColorToken, string>`, `DEFAULT_STROKE_WIDTH_MM = 0.5`, `DEFAULT_VIEWBOX_MM = { width: 32, height: 32 }`

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

`packages/schema/src/geometry.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STROKE_WIDTH_MM,
  DEFAULT_VIEWBOX_MM,
  PALETTE,
  type Drawing,
} from './geometry.js';

describe('geometry', () => {
  it('enthält alle in der Referenz vorkommenden Farben', () => {
    expect(PALETTE).toEqual({
      schwarz: '#000000',
      weiss: '#ffffff',
      rot: '#fa1919',
      blau: '#003296',
      gelb: '#fafa00',
      gruen: '#14a01e',
      hellgruen: '#64dc32',
      orange: '#fa8c00',
      braun: '#b4783c',
      grau: '#787878',
      hellgrau: '#bebebe',
      hellblau: '#3264fa',
    });
  });

  it('nutzt 0,5 mm Strichstärke und 32 mm Grundfläche als Vorgabe', () => {
    expect(DEFAULT_STROKE_WIDTH_MM).toBe(0.5);
    expect(DEFAULT_VIEWBOX_MM).toEqual({ width: 32, height: 32 });
  });

  it('beschreibt die Taktische Formation als Drawing', () => {
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'rect',
          role: 'body',
          x: 1,
          y: 6,
          width: 30,
          height: 20,
          style: { fill: 'weiss', stroke: 'schwarz', strokeWidth: 0.5 },
        },
      ],
    };
    expect(drawing.children).toHaveLength(1);
  });

  it('erlaubt ein gedrehtes Quadrat für die Person', () => {
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'rect',
          role: 'body',
          x: 16 - 10.6066,
          y: 16 - 10.6066,
          width: 21.2132,
          height: 21.2132,
          transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
          style: { fill: 'weiss', stroke: 'schwarz' },
        },
      ],
    };
    const first = drawing.children[0];
    expect(first?.transform?.rotate?.angle).toBe(45);
  });
});
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm vitest run packages/schema/src/geometry.test.ts`
Expected: FAIL — `Failed to resolve import "./geometry.js"`

- [ ] **Step 3: Implementierung schreiben**

`packages/schema/src/geometry.ts`:

```ts
/** Alle Längen im IR sind Millimeter. Die Umrechnung geschieht ausschließlich im Renderer. */
export type Length = number;

export type Point = readonly [Length, Length];

export type ColorToken =
  | 'schwarz'
  | 'weiss'
  | 'rot'
  | 'blau'
  | 'gelb'
  | 'gruen'
  | 'hellgruen'
  | 'orange'
  | 'braun'
  | 'grau'
  | 'hellgrau'
  | 'hellblau';

/** Aus dem BABZ-Referenzbestand abgeleitete Organisations- und Signalfarben. */
export const PALETTE: Record<ColorToken, string> = {
  schwarz: '#000000',
  weiss: '#ffffff',
  rot: '#fa1919',
  blau: '#003296',
  gelb: '#fafa00',
  gruen: '#14a01e',
  hellgruen: '#64dc32',
  orange: '#fa8c00',
  braun: '#b4783c',
  grau: '#787878',
  hellgrau: '#bebebe',
  hellblau: '#3264fa',
};

export const DEFAULT_STROKE_WIDTH_MM = 0.5;
export const DEFAULT_VIEWBOX_MM = { width: 32, height: 32 } as const;

/** Drehung um einen expliziten Mittelpunkt. Die Referenz zeichnet gedrehte Quadrate so. */
export interface Rotation {
  angle: number;
  cx: Length;
  cy: Length;
}

export interface Transform {
  rotate?: Rotation;
}

/** Fachliche Rolle eines Primitivs. Steuert Fingerprint-Vergleich und Kompositionslogik. */
export type PrimitiveRole = 'body' | 'innerField' | 'head' | 'foot' | 'pictogram';

export interface Style {
  fill?: ColorToken | 'none';
  stroke?: ColorToken | 'none';
  strokeWidth?: Length;
  fillRule?: 'nonzero' | 'evenodd';
}

interface PrimitiveBase {
  style?: Style;
  transform?: Transform;
  role?: PrimitiveRole;
}

export type Primitive =
  | (PrimitiveBase & {
      type: 'rect';
      x: Length;
      y: Length;
      width: Length;
      height: Length;
      rx?: Length;
    })
  | (PrimitiveBase & { type: 'circle'; cx: Length; cy: Length; r: Length })
  | (PrimitiveBase & { type: 'line'; x1: Length; y1: Length; x2: Length; y2: Length })
  | (PrimitiveBase & { type: 'polyline'; points: readonly Point[]; closed?: boolean })
  | (PrimitiveBase & { type: 'path'; d: string })
  | (PrimitiveBase & { type: 'group'; children: readonly Primitive[] });

export interface Drawing {
  viewBox: { readonly width: Length; readonly height: Length };
  children: readonly Primitive[];
  /** Wird als <title> ausgegeben und für A11y verwendet. */
  title?: string;
  /** Wird als <desc> ausgegeben. */
  description?: string;
}
```

`packages/schema/src/index.ts` erweitern:

```ts
export * from './units.js';
export * from './geometry.js';
```

- [ ] **Step 4: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm vitest run packages/schema/src/geometry.test.ts && pnpm typecheck`
Expected: PASS, 4 Tests; Typecheck ohne Fehler

- [ ] **Step 5: Commit**

```bash
git add packages/schema
git commit -m "feat: Geometrie-IR mit Millimeter-Primitiven und Referenzpalette"
```

---

### Task 3: Taxonomie, Provenienz und Coverage-Typen

**Files:**
- Create: `packages/schema/src/taxonomy.ts`
- Create: `packages/schema/src/provenance.ts`
- Create: `packages/schema/src/coverage.ts`
- Modify: `packages/schema/src/index.ts`
- Test: `packages/schema/src/provenance.test.ts`

**Interfaces:**
- Consumes: `Drawing` aus Task 2
- Produces: Typen `SymbolKind`, `OrganizationId`, `StrengthId`, `AdminLevelId`, `CapabilityId`, `VehicleCategoryId`, `SymbolSpec`, `SourceReference`, `Depiction`, `CatalogEntry`, `CoverageEntry`, `CoverageManifest`; Funktion `entryKey(sourceId: string, variant: DepictionVariant): string`

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

`packages/schema/src/provenance.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { entryKey, type CatalogEntry } from './provenance.js';

describe('provenance', () => {
  it('bildet aus Quellen-ID und Variante einen eindeutigen Schlüssel', () => {
    expect(entryKey('bbk-babz-2025:4.1.6', 'primary')).toBe('bbk-babz-2025:4.1.6#primary');
    expect(entryKey('bbk-babz-2025:4.1.6', 'alternative')).toBe(
      'bbk-babz-2025:4.1.6#alternative',
    );
  });

  it('unterscheidet Basisdarstellung und Alternative derselben Quellen-ID', () => {
    const a = entryKey('bbk-babz-2025:4.1.6', 'primary');
    const b = entryKey('bbk-babz-2025:4.1.6', 'alternative');
    expect(a).not.toBe(b);
  });

  it('trägt mehrere Darstellungen an einem Katalogeintrag', () => {
    const entry: CatalogEntry = {
      id: 'hazard.atomic',
      title: 'Atomare Stoffe',
      kind: 'hazard',
      depictions: [
        {
          variant: 'primary',
          drawing: { viewBox: { width: 32, height: 32 }, children: [] },
          sourceRefs: [
            { source: 'babz-svg-2025', section: '4.1.6', status: 'derived' },
          ],
        },
        {
          variant: 'alternative',
          drawing: { viewBox: { width: 32, height: 32 }, children: [] },
          sourceRefs: [
            {
              source: 'babz-svg-2025',
              section: '4.1.6',
              asset: '4.1.6_Atomare Stoffe_Alternative.svg',
              status: 'derived',
            },
          ],
        },
      ],
    };
    expect(entry.depictions.map((d) => d.variant)).toEqual(['primary', 'alternative']);
  });
});
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm vitest run packages/schema/src/provenance.test.ts`
Expected: FAIL — `Failed to resolve import "./provenance.js"`

- [ ] **Step 3: Implementierung schreiben**

`packages/schema/src/taxonomy.ts`:

```ts
/** Grundzeichenart nach Kapitel 1 der BBK/BABZ-Empfehlung. */
export type SymbolKind =
  | 'formation'
  | 'person'
  | 'vehicle-land'
  | 'vehicle-air'
  | 'vehicle-water'
  | 'post'
  | 'building'
  | 'container'
  | 'area'
  | 'measure'
  | 'hazard'
  | 'point'
  | 'event'
  | 'spontaneous-helper';

/** Organisationen nach Kapitel 2. Bestimmen die Körperfarbe. */
export type OrganizationId =
  | 'feuerwehr'
  | 'thw'
  | 'fuehrung-leitung'
  | 'polizei'
  | 'bundeswehr'
  | 'sonstige-gefahrenabwehr'
  | 'zivile-einheiten'
  | 'hilfsorganisation';

/** Taktische Stärke nach Kapitel 5.4. Bestimmt die Kopfzone. */
export type StrengthId = 'trupp' | 'staffel' | 'gruppe' | 'zug';

/** Verwaltungsstufen nach Kapitel 5.7. */
export type AdminLevelId =
  | 'gemeinde'
  | 'kreis'
  | 'bezirk'
  | 'bundesland'
  | 'nationalstaat'
  | 'europaeische-union';

/** Fahrzeugkategorien nach Kapitel 5.1. */
export type VehicleCategoryId =
  | 'kfz-kategorie-1'
  | 'kfz-kategorie-2'
  | 'kfz-kategorie-3'
  | 'amphibienfahrzeug'
  | 'kettenfahrzeug'
  | 'schienenfahrzeug';

/** Fähigkeiten nach Kapitel 4. Im Slice ist nur Brandbekämpfung (4.3.1) umgesetzt. */
export type CapabilityId = 'fire-fighting';

/** Semantische Beschreibung eines Zeichens. Eingabe des Kompositionsmotors. */
export interface SymbolSpec {
  kind: SymbolKind;
  organization?: OrganizationId;
  strength?: StrengthId;
  administrativeLevel?: AdminLevelId;
  vehicleCategory?: VehicleCategoryId;
  capabilities?: readonly CapabilityId[];
  designation?: string;
}
```

`packages/schema/src/provenance.ts`:

```ts
import type { Drawing } from './geometry.js';
import type { SymbolKind } from './taxonomy.js';

export type SourceId = 'bbk-babz-2025' | 'babz-svg-2025' | 'skk-2010' | 'org-profile';

/**
 * `verbatim`   — Geometrie entspricht der Referenz und ist per Fingerprint belegt
 * `derived`    — eigenständig konstruiert, fachlich an der Referenz orientiert
 * `legacy`     — aus der SKK-/DV-102-Systematik von 2010/2011
 * `organization-specific` — nur in einem Organisationsprofil gültig
 */
export type SourceStatus = 'verbatim' | 'derived' | 'legacy' | 'organization-specific';

export interface SourceReference {
  source: SourceId;
  section?: string;
  page?: number;
  /** Dateiname der Referenz. Die Datei selbst wird nie eingecheckt. */
  asset?: string;
  status: SourceStatus;
}

export type DepictionVariant = 'primary' | 'alternative';

export interface Depiction {
  variant: DepictionVariant;
  drawing: Drawing;
  sourceRefs: readonly SourceReference[];
}

export interface CatalogEntry {
  /** Stabile semantische ID, z. B. `base.formation` oder `capability.fire-fighting`. */
  id: string;
  title: string;
  kind: SymbolKind;
  /** Mindestens eine Darstellung; `primary` genau einmal. */
  depictions: readonly Depiction[];
  synonyms?: readonly string[];
  legacyIds?: readonly string[];
}

/**
 * Schlüssel des Coverage-Manifests. `sourceId` allein ist nicht eindeutig:
 * 4.1.6 existiert als Basisdarstellung und als Alternative.
 */
export function entryKey(sourceId: string, variant: DepictionVariant): string {
  return `${sourceId}#${variant}`;
}
```

`packages/schema/src/coverage.ts`:

```ts
import type { DepictionVariant } from './provenance.js';

export type CoverageKind = 'catalog-entry' | 'composition-recipe';

export type ReviewStatus = 'pending' | 'approved' | 'deviation';

export interface Review {
  status: ReviewStatus;
  reviewer?: string;
  /** ISO-Datum, z. B. "2026-08-04". */
  date?: string;
  note?: string;
}

export interface CoverageEntry {
  sourceId: string;
  variant: DepictionVariant;
  title: string;
  /** Semantische ID des umsetzenden Katalogeintrags oder Rezepts. */
  implementation: string;
  referenceAsset: string;
  coverage: CoverageKind;
  fingerprintTest: boolean;
  snapshotTest: boolean;
  review: Review;
}

export interface CoverageManifest {
  baseline: 'bbk-babz-2025';
  /** Kapitel und Anhänge, die dieser Slice beansprucht. */
  scope: readonly string[];
  entries: readonly CoverageEntry[];
}
```

`packages/schema/src/index.ts` erweitern:

```ts
export * from './units.js';
export * from './geometry.js';
export * from './taxonomy.js';
export * from './provenance.js';
export * from './coverage.js';
```

- [ ] **Step 4: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm vitest run packages/schema/src/provenance.test.ts && pnpm typecheck`
Expected: PASS, 3 Tests; Typecheck ohne Fehler

- [ ] **Step 5: Commit**

```bash
git add packages/schema
git commit -m "feat: Taxonomie, Provenienz und Coverage-Typen"
```

---

### Task 4: SVG-Renderer

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/src/render/format.ts`
- Create: `packages/core/src/render/svg.ts`
- Create: `packages/core/src/index.ts`
- Test: `packages/core/src/render/svg.test.ts`

**Interfaces:**
- Consumes: `Drawing`, `Primitive`, `Style`, `PALETTE`, `DEFAULT_STROKE_WIDTH_MM`, `mmToUnits` aus `@einsatzzeichen/schema`
- Produces: `renderSvg(drawing: Drawing, options?: SvgOptions): string`, `SvgOptions { size?: number; idPrefix?: string }`, `formatUnits(value: number): string`

- [ ] **Step 1: Paketdatei anlegen**

`packages/core/package.json`:

```json
{
  "name": "@einsatzzeichen/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "dependencies": {
    "@einsatzzeichen/schema": "workspace:*"
  }
}
```

Run: `pnpm install`

- [ ] **Step 2: Den fehlschlagenden Test schreiben**

`packages/core/src/render/svg.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, type Drawing } from '@einsatzzeichen/schema';
import { formatUnits, renderSvg } from './svg.js';

const formation: Drawing = {
  viewBox: DEFAULT_VIEWBOX_MM,
  title: 'Taktische Formation',
  children: [
    {
      type: 'rect',
      role: 'body',
      x: 1,
      y: 6,
      width: 30,
      height: 20,
      style: { fill: 'weiss', stroke: 'schwarz', strokeWidth: 0.5 },
    },
  ],
};

describe('renderSvg', () => {
  it('kürzt Zahlen auf drei Nachkommastellen ohne nachlaufende Nullen', () => {
    expect(formatUnits(90.70866141732283)).toBe('90.709');
    expect(formatUnits(0)).toBe('0');
    expect(formatUnits(2.8346456692913385)).toBe('2.835');
  });

  it('setzt die viewBox in SVG-Einheiten', () => {
    expect(renderSvg(formation)).toContain('viewBox="0 0 90.709 90.709"');
  });

  it('rechnet Millimeter-Koordinaten in Einheiten um', () => {
    const svg = renderSvg(formation);
    expect(svg).toContain('x="2.835"');
    expect(svg).toContain('y="17.008"');
    expect(svg).toContain('width="85.039"');
    expect(svg).toContain('height="56.693"');
  });

  it('löst Farbtoken auf und setzt die Strichstärke in Einheiten', () => {
    const svg = renderSvg(formation);
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('stroke="#000000"');
    expect(svg).toContain('stroke-width="1.417"');
  });

  it('gibt A11y-Metadaten aus, wenn ein Titel gesetzt ist', () => {
    const svg = renderSvg(formation, { idPrefix: 'ez' });
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-labelledby="ez-title"');
    expect(svg).toContain('<title id="ez-title">Taktische Formation</title>');
  });

  it('lässt A11y-Metadaten weg, wenn kein Titel gesetzt ist', () => {
    const svg = renderSvg({ viewBox: DEFAULT_VIEWBOX_MM, children: [] });
    expect(svg).not.toContain('<title');
    expect(svg).toContain('aria-hidden="true"');
  });

  it('maskiert Sonderzeichen in Titel und Beschreibung', () => {
    const svg = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [],
      title: 'Führung & Leitung <Stab>',
    });
    expect(svg).toContain('Führung &amp; Leitung &lt;Stab&gt;');
  });

  it('gibt eine Drehung um einen Mittelpunkt aus', () => {
    const svg = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'rect',
          x: 5.3934,
          y: 5.3934,
          width: 21.2132,
          height: 21.2132,
          transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
        },
      ],
    });
    expect(svg).toContain('transform="rotate(45 45.354 45.354)"');
  });

  it('rendert Kreis, Linie und geschlossenen Polyzug', () => {
    const svg = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        { type: 'circle', cx: 16, cy: 16, r: 14 },
        { type: 'line', x1: 1, y1: 16, x2: 31, y2: 16 },
        { type: 'polyline', closed: true, points: [[16, 3], [1, 10], [31, 10]] },
      ],
    });
    expect(svg).toContain('<circle cx="45.354" cy="45.354" r="39.685"');
    expect(svg).toContain('<line x1="2.835" y1="45.354" x2="87.874" y2="45.354"');
    expect(svg).toContain('<polygon points="45.354,8.504 2.835,28.346 87.874,28.346"');
  });

  it('setzt die Pixelgröße, wenn size übergeben wird', () => {
    expect(renderSvg(formation, { size: 64 })).toContain('width="64" height="64"');
  });
});
```

- [ ] **Step 3: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm vitest run packages/core/src/render/svg.test.ts`
Expected: FAIL — `Failed to resolve import "./svg.js"`

- [ ] **Step 4: Zahlenformatierung implementieren**

`packages/core/src/render/format.ts`:

```ts
/** Rundet auf drei Nachkommastellen und entfernt nachlaufende Nullen. */
export function formatUnits(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  // -0 soll als 0 ausgegeben werden.
  return String(rounded === 0 ? 0 : rounded);
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

- [ ] **Step 5: Renderer implementieren**

`packages/core/src/render/svg.ts`:

```ts
import {
  DEFAULT_STROKE_WIDTH_MM,
  mmToUnits,
  PALETTE,
  type ColorToken,
  type Drawing,
  type Primitive,
  type Style,
  type Transform,
} from '@einsatzzeichen/schema';
import { escapeXml, formatUnits } from './format.js';

export { formatUnits };

export interface SvgOptions {
  /** Kantenlänge in Pixeln. Ohne Angabe skaliert das SVG frei. */
  size?: number;
  /** Präfix für erzeugte Element-IDs. Erforderlich, wenn mehrere SVGs im selben DOM liegen. */
  idPrefix?: string;
}

function u(mm: number): string {
  return formatUnits(mmToUnits(mm));
}

function color(token: ColorToken | 'none'): string {
  return token === 'none' ? 'none' : PALETTE[token];
}

function styleAttrs(style: Style | undefined): string {
  if (!style) return '';
  const parts: string[] = [];
  if (style.fill !== undefined) parts.push(`fill="${color(style.fill)}"`);
  if (style.stroke !== undefined && style.stroke !== 'none') {
    parts.push(`stroke="${color(style.stroke)}"`);
    parts.push(`stroke-width="${u(style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM)}"`);
  }
  if (style.fillRule !== undefined) parts.push(`fill-rule="${style.fillRule}"`);
  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
}

function transformAttr(transform: Transform | undefined): string {
  const rotate = transform?.rotate;
  if (!rotate) return '';
  return ` transform="rotate(${formatUnits(rotate.angle)} ${u(rotate.cx)} ${u(rotate.cy)})"`;
}

function renderPrimitive(primitive: Primitive): string {
  const tail = `${styleAttrs(primitive.style)}${transformAttr(primitive.transform)}`;

  switch (primitive.type) {
    case 'rect': {
      const rx = primitive.rx !== undefined ? ` rx="${u(primitive.rx)}"` : '';
      return `<rect x="${u(primitive.x)}" y="${u(primitive.y)}" width="${u(primitive.width)}" height="${u(primitive.height)}"${rx}${tail}/>`;
    }
    case 'circle':
      return `<circle cx="${u(primitive.cx)}" cy="${u(primitive.cy)}" r="${u(primitive.r)}"${tail}/>`;
    case 'line':
      return `<line x1="${u(primitive.x1)}" y1="${u(primitive.y1)}" x2="${u(primitive.x2)}" y2="${u(primitive.y2)}"${tail}/>`;
    case 'polyline': {
      const points = primitive.points.map(([x, y]) => `${u(x)},${u(y)}`).join(' ');
      const tag = primitive.closed === true ? 'polygon' : 'polyline';
      return `<${tag} points="${points}"${tail}/>`;
    }
    case 'path':
      return `<path d="${escapeXml(primitive.d)}"${tail}/>`;
    case 'group':
      return `<g${tail}>${primitive.children.map(renderPrimitive).join('')}</g>`;
  }
}

export function renderSvg(drawing: Drawing, options: SvgOptions = {}): string {
  const prefix = options.idPrefix ?? 'ez';
  const width = u(drawing.viewBox.width);
  const height = u(drawing.viewBox.height);

  const attrs = ['xmlns="http://www.w3.org/2000/svg"', `viewBox="0 0 ${width} ${height}"`];
  if (options.size !== undefined) {
    attrs.push(`width="${options.size}"`, `height="${options.size}"`);
  }

  const labelled: string[] = [];
  const metadata: string[] = [];
  if (drawing.title !== undefined) {
    labelled.push(`${prefix}-title`);
    metadata.push(`<title id="${prefix}-title">${escapeXml(drawing.title)}</title>`);
  }
  if (drawing.description !== undefined) {
    labelled.push(`${prefix}-desc`);
    metadata.push(`<desc id="${prefix}-desc">${escapeXml(drawing.description)}</desc>`);
  }

  if (labelled.length > 0) {
    attrs.push('role="img"', `aria-labelledby="${labelled.join(' ')}"`);
  } else {
    attrs.push('aria-hidden="true"');
  }

  const body = drawing.children.map(renderPrimitive).join('');
  return `<svg ${attrs.join(' ')}>${metadata.join('')}${body}</svg>`;
}
```

`packages/core/src/index.ts`:

```ts
export * from './render/svg.js';
```

- [ ] **Step 6: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm vitest run packages/core/src/render/svg.test.ts && pnpm typecheck`
Expected: PASS, 10 Tests

- [ ] **Step 7: Commit**

```bash
git add packages/core pnpm-lock.yaml
git commit -m "feat: SVG-Renderer mit Millimeter-Umrechnung und A11y-Metadaten"
```

---

### Task 5: Canvas-Renderer

**Files:**
- Create: `packages/core/src/render/canvas.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/render/canvas.test.ts`

**Interfaces:**
- Consumes: `Drawing`, `Primitive`, `PALETTE`, `mmToUnits` aus `@einsatzzeichen/schema`
- Produces: `renderCanvas(drawing: Drawing, ctx: CanvasRenderingContext2D, options?: CanvasOptions): void`, `CanvasOptions { size?: number }`

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

`packages/core/src/render/canvas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, type Drawing } from '@einsatzzeichen/schema';
import { renderCanvas } from './canvas.js';

type Call = [string, ...unknown[]];

/** Minimaler Aufzeichner. Wir prüfen die Aufrufreihenfolge, nicht gerasterte Pixel. */
function recordingContext(): { ctx: CanvasRenderingContext2D; calls: Call[] } {
  const calls: Call[] = [];
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop: string) {
      if (prop === 'canvas') return { width: 0, height: 0 };
      return (...args: unknown[]) => {
        calls.push([prop, ...args]);
      };
    },
    set(_target, prop: string, value: unknown) {
      calls.push([`set:${prop}`, value]);
      return true;
    },
  };
  const ctx = new Proxy({}, handler) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

const formation: Drawing = {
  viewBox: DEFAULT_VIEWBOX_MM,
  children: [
    {
      type: 'rect',
      x: 1,
      y: 6,
      width: 30,
      height: 20,
      style: { fill: 'weiss', stroke: 'schwarz', strokeWidth: 0.5 },
    },
  ],
};

describe('renderCanvas', () => {
  it('skaliert von Einheiten auf die Zielgröße', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(formation, ctx, { size: 64 });
    const scale = calls.find(([name]) => name === 'scale');
    expect(scale?.[1]).toBeCloseTo(64 / 90.70866141732283, 9);
  });

  it('füllt und umrandet ein Rechteck mit den aufgelösten Farben', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(formation, ctx);
    const names = calls.map(([name]) => name);
    expect(names).toContain('rect');
    expect(names).toContain('fill');
    expect(names).toContain('stroke');
    expect(calls).toContainEqual(['set:fillStyle', '#ffffff']);
    expect(calls).toContainEqual(['set:strokeStyle', '#000000']);
  });

  it('setzt die Strichstärke in SVG-Einheiten', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(formation, ctx);
    const lineWidth = calls.find(([name]) => name === 'set:lineWidth');
    expect(lineWidth?.[1]).toBeCloseTo(1.4173228346, 6);
  });

  it('kapselt eine Drehung in save/restore', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(
      {
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [
          {
            type: 'circle',
            cx: 16,
            cy: 16,
            r: 14,
            transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
            style: { fill: 'rot' },
          },
        ],
      },
      ctx,
    );
    const names = calls.map(([name]) => name);
    expect(names.filter((n) => n === 'save').length).toBeGreaterThanOrEqual(2);
    expect(names).toContain('rotate');
    expect(names).toContain('arc');
  });
});
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm vitest run packages/core/src/render/canvas.test.ts`
Expected: FAIL — `Failed to resolve import "./canvas.js"`

- [ ] **Step 3: Implementierung schreiben**

`packages/core/src/render/canvas.ts`:

```ts
import {
  DEFAULT_STROKE_WIDTH_MM,
  mmToUnits,
  PALETTE,
  type ColorToken,
  type Drawing,
  type Primitive,
} from '@einsatzzeichen/schema';

export interface CanvasOptions {
  /** Kantenlänge in Pixeln. Ohne Angabe wird in SVG-Einheiten gezeichnet. */
  size?: number;
}

function color(token: ColorToken | 'none'): string {
  return token === 'none' ? 'transparent' : PALETTE[token];
}

function tracePrimitive(primitive: Primitive, ctx: CanvasRenderingContext2D): void {
  const u = mmToUnits;
  switch (primitive.type) {
    case 'rect':
      ctx.rect(u(primitive.x), u(primitive.y), u(primitive.width), u(primitive.height));
      break;
    case 'circle':
      ctx.arc(u(primitive.cx), u(primitive.cy), u(primitive.r), 0, Math.PI * 2);
      break;
    case 'line':
      ctx.moveTo(u(primitive.x1), u(primitive.y1));
      ctx.lineTo(u(primitive.x2), u(primitive.y2));
      break;
    case 'polyline': {
      primitive.points.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(u(x), u(y));
        else ctx.lineTo(u(x), u(y));
      });
      if (primitive.closed === true) ctx.closePath();
      break;
    }
    case 'path':
      // Pfad-Primitive werden über Path2D gezeichnet; Koordinaten liegen in Millimetern vor.
      ctx.save();
      ctx.scale(mmToUnits(1), mmToUnits(1));
      ctx.restore();
      break;
    case 'group':
      break;
  }
}

function drawPrimitive(primitive: Primitive, ctx: CanvasRenderingContext2D): void {
  ctx.save();

  const rotate = primitive.transform?.rotate;
  if (rotate) {
    ctx.translate(mmToUnits(rotate.cx), mmToUnits(rotate.cy));
    ctx.rotate((rotate.angle * Math.PI) / 180);
    ctx.translate(-mmToUnits(rotate.cx), -mmToUnits(rotate.cy));
  }

  if (primitive.type === 'group') {
    for (const child of primitive.children) drawPrimitive(child, ctx);
    ctx.restore();
    return;
  }

  if (primitive.type === 'path') {
    const path = new Path2D(primitive.d);
    ctx.save();
    ctx.scale(mmToUnits(1), mmToUnits(1));
    if (primitive.style?.fill !== undefined && primitive.style.fill !== 'none') {
      ctx.fillStyle = color(primitive.style.fill);
      ctx.fill(path, primitive.style.fillRule ?? 'nonzero');
    }
    if (primitive.style?.stroke !== undefined && primitive.style.stroke !== 'none') {
      ctx.strokeStyle = color(primitive.style.stroke);
      ctx.lineWidth = primitive.style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM;
      ctx.stroke(path);
    }
    ctx.restore();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  tracePrimitive(primitive, ctx);

  const style = primitive.style;
  if (style?.fill !== undefined && style.fill !== 'none') {
    ctx.fillStyle = color(style.fill);
    ctx.fill();
  }
  if (style?.stroke !== undefined && style.stroke !== 'none') {
    ctx.strokeStyle = color(style.stroke);
    ctx.lineWidth = mmToUnits(style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM);
    ctx.stroke();
  }

  ctx.restore();
}

export function renderCanvas(
  drawing: Drawing,
  ctx: CanvasRenderingContext2D,
  options: CanvasOptions = {},
): void {
  ctx.save();
  if (options.size !== undefined) {
    ctx.scale(options.size / mmToUnits(drawing.viewBox.width), options.size / mmToUnits(drawing.viewBox.height));
  }
  for (const child of drawing.children) drawPrimitive(child, ctx);
  ctx.restore();
}
```

`packages/core/src/index.ts` erweitern:

```ts
export * from './render/svg.js';
export * from './render/canvas.js';
```

- [ ] **Step 4: Toten Code aus tracePrimitive entfernen**

Der `case 'path'` in `tracePrimitive` ist unerreichbar, weil `drawPrimitive` Pfade vorher abfängt. Ersetze beide Zweige durch:

```ts
    case 'path':
    case 'group':
      // Werden in drawPrimitive gesondert behandelt und erreichen tracePrimitive nie.
      break;
```

- [ ] **Step 5: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm vitest run packages/core/src/render/canvas.test.ts && pnpm typecheck`
Expected: PASS, 4 Tests

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat: Canvas-Renderer aus derselben Geometrie-IR"
```

---

### Task 6: Pfad-Tokenizer und Ringableitung

Die Referenz zeichnet jeden Rahmen als zwei ineinanderliegende Teilpfade (Außen- und Innenring einer 0,5-mm-Kontur). Aus diesem Paar lassen sich Mittellinie und Strichstärke exakt zurückrechnen — das ist die Grundlage des Fingerprint-Vergleichs.

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/src/scan/path-geometry.ts`
- Test: `packages/cli/src/scan/path-geometry.test.ts`

**Interfaces:**
- Consumes: nichts
- Produces: `parseRectilinearPath(d: string): SubpathBounds[] | null`, `deriveRing(subpaths: SubpathBounds[]): Ring | null`; Typen `SubpathBounds { minX; minY; maxX; maxY }` und `Ring { x; y; width; height; strokeWidth }` (alle Werte in SVG-Einheiten)

- [ ] **Step 1: Paketdatei anlegen**

`packages/cli/package.json`:

```json
{
  "name": "@einsatzzeichen/cli",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "dependencies": {
    "@einsatzzeichen/catalog": "workspace:*",
    "@einsatzzeichen/core": "workspace:*",
    "@einsatzzeichen/schema": "workspace:*"
  }
}
```

Lege `packages/catalog/package.json` gleich mit an, damit `pnpm install` durchläuft:

```json
{
  "name": "@einsatzzeichen/catalog",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "dependencies": {
    "@einsatzzeichen/core": "workspace:*",
    "@einsatzzeichen/schema": "workspace:*"
  }
}
```

`catalog` hängt von `core` ab (Fingerprint-Vergleich, Kompositionsmotor), `core` nie von `catalog` — der Kompositionsmotor bekommt die Katalogzugriffe in Task 13 als Ports übergeben. Damit bleibt der Graph zyklenfrei: `cli → catalog → core → schema`.

Und `packages/catalog/src/index.ts` mit `export {};` als Platzhalter, damit der Typecheck nicht bricht.

Run: `pnpm install`

- [ ] **Step 2: Den fehlschlagenden Test schreiben**

`packages/cli/src/scan/path-geometry.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { deriveRing, parseRectilinearPath } from './path-geometry.js';

// Originalpfad aus 1.1_Taktische Formation.svg — dient ausschließlich als Testeingabe
// für die Kennzahlenableitung und wird nirgends als Geometrie übernommen.
const FORMATION =
  'M88.583,74.41H2.126V16.299h86.457v58.11ZM3.544,72.992h83.622V17.717H3.544v55.275Z';

describe('parseRectilinearPath', () => {
  it('zerlegt einen Doppelrahmen in zwei Teilpfade', () => {
    const subpaths = parseRectilinearPath(FORMATION);
    expect(subpaths).toHaveLength(2);
    expect(subpaths?.[0]).toEqual({ minX: 2.126, minY: 16.299, maxX: 88.583, maxY: 74.41 });
    expect(subpaths?.[1]).toEqual({ minX: 3.544, minY: 17.717, maxX: 87.166, maxY: 72.992 });
  });

  it('verarbeitet relative Kommandos', () => {
    const subpaths = parseRectilinearPath('M10,10h20v10h-20Z');
    expect(subpaths?.[0]).toEqual({ minX: 10, minY: 10, maxX: 30, maxY: 20 });
  });

  it('gibt null zurück, sobald Kurven vorkommen', () => {
    expect(parseRectilinearPath('M10,10c1,1 2,2 3,3Z')).toBeNull();
    expect(parseRectilinearPath('M10,10A5,5 0 0 1 20,20Z')).toBeNull();
  });
});

describe('deriveRing', () => {
  it('rechnet Mittellinie und Strichstärke aus einem Ringpaar zurück', () => {
    const ring = deriveRing(parseRectilinearPath(FORMATION) ?? []);
    expect(ring?.x).toBeCloseTo(2.835, 3);
    expect(ring?.y).toBeCloseTo(17.008, 3);
    expect(ring?.width).toBeCloseTo(85.04, 2);
    expect(ring?.height).toBeCloseTo(56.693, 2);
    expect(ring?.strokeWidth).toBeCloseTo(1.4175, 3);
  });

  it('gibt null zurück, wenn kein Ringpaar vorliegt', () => {
    expect(deriveRing([{ minX: 0, minY: 0, maxX: 10, maxY: 10 }])).toBeNull();
  });

  it('gibt null zurück, wenn der zweite Teilpfad nicht im ersten liegt', () => {
    expect(
      deriveRing([
        { minX: 0, minY: 0, maxX: 10, maxY: 10 },
        { minX: 20, minY: 20, maxX: 30, maxY: 30 },
      ]),
    ).toBeNull();
  });
});
```

- [ ] **Step 3: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm vitest run packages/cli/src/scan/path-geometry.test.ts`
Expected: FAIL — `Failed to resolve import "./path-geometry.js"`

- [ ] **Step 4: Implementierung schreiben**

`packages/cli/src/scan/path-geometry.ts`:

```ts
/** Alle Werte in SVG-Einheiten, so wie sie in der Referenzdatei stehen. */
export interface SubpathBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Ring {
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth: number;
}

const RECTILINEAR = new Set(['M', 'm', 'L', 'l', 'H', 'h', 'V', 'v', 'Z', 'z']);

interface Cursor {
  x: number;
  y: number;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Zerlegt einen ausschließlich geradlinigen Pfad in die Bounding-Boxen seiner Teilpfade.
 * Gibt null zurück, sobald ein Kurven- oder Bogenkommando auftritt — solche Pfade sind
 * Piktogramme und werden nicht geometrisch verglichen.
 */
export function parseRectilinearPath(d: string): SubpathBounds[] | null {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
  if (!tokens) return null;

  const subpaths: SubpathBounds[] = [];
  const cursor: Cursor = { x: 0, y: 0 };
  const start: Cursor = { x: 0, y: 0 };
  let current: SubpathBounds | null = null;
  let command = '';
  let index = 0;

  const push = (): void => {
    if (current) {
      subpaths.push({
        minX: round(current.minX),
        minY: round(current.minY),
        maxX: round(current.maxX),
        maxY: round(current.maxY),
      });
      current = null;
    }
  };

  const extend = (): void => {
    if (!current) {
      current = { minX: cursor.x, minY: cursor.y, maxX: cursor.x, maxY: cursor.y };
      return;
    }
    current.minX = Math.min(current.minX, cursor.x);
    current.minY = Math.min(current.minY, cursor.y);
    current.maxX = Math.max(current.maxX, cursor.x);
    current.maxY = Math.max(current.maxY, cursor.y);
  };

  const next = (): number => Number(tokens[index++]);

  while (index < tokens.length) {
    const token = tokens[index];
    if (token === undefined) break;

    if (/^[A-Za-z]$/.test(token)) {
      if (!RECTILINEAR.has(token)) return null;
      command = token;
      index += 1;
      if (command === 'Z' || command === 'z') {
        cursor.x = start.x;
        cursor.y = start.y;
        push();
      }
      continue;
    }

    switch (command) {
      case 'M':
        push();
        cursor.x = next();
        cursor.y = next();
        start.x = cursor.x;
        start.y = cursor.y;
        extend();
        command = 'L';
        break;
      case 'm':
        push();
        cursor.x += next();
        cursor.y += next();
        start.x = cursor.x;
        start.y = cursor.y;
        extend();
        command = 'l';
        break;
      case 'L':
        cursor.x = next();
        cursor.y = next();
        extend();
        break;
      case 'l':
        cursor.x += next();
        cursor.y += next();
        extend();
        break;
      case 'H':
        cursor.x = next();
        extend();
        break;
      case 'h':
        cursor.x += next();
        extend();
        break;
      case 'V':
        cursor.y = next();
        extend();
        break;
      case 'v':
        cursor.y += next();
        extend();
        break;
      default:
        return null;
    }
  }

  push();
  return subpaths;
}

/**
 * Leitet aus einem Außen-/Innenring-Paar die Mittellinie und die Strichstärke zurück.
 * Beispiel 1.1: außen 86.457 breit, innen 83.622 — Differenz 2.835, also 1.4175 Strichstärke.
 */
export function deriveRing(subpaths: SubpathBounds[]): Ring | null {
  if (subpaths.length !== 2) return null;
  const [outer, inner] = subpaths;
  if (!outer || !inner) return null;

  const contains =
    inner.minX >= outer.minX &&
    inner.minY >= outer.minY &&
    inner.maxX <= outer.maxX &&
    inner.maxY <= outer.maxY;
  if (!contains) return null;

  const outerWidth = outer.maxX - outer.minX;
  const innerWidth = inner.maxX - inner.minX;
  const outerHeight = outer.maxY - outer.minY;
  const innerHeight = inner.maxY - inner.minY;

  return {
    x: (outer.minX + inner.minX) / 2,
    y: (outer.minY + inner.minY) / 2,
    width: (outerWidth + innerWidth) / 2,
    height: (outerHeight + innerHeight) / 2,
    strokeWidth: (outerWidth - innerWidth + (outerHeight - innerHeight)) / 4,
  };
}
```

- [ ] **Step 5: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm vitest run packages/cli/src/scan/path-geometry.test.ts && pnpm typecheck`
Expected: PASS, 6 Tests

- [ ] **Step 6: Commit**

```bash
git add packages/cli packages/catalog pnpm-lock.yaml
git commit -m "feat: Pfad-Tokenizer und Ringableitung für Referenzkennzahlen"
```

---

### Task 7: CLI-Kommando `audit:reference`

**Files:**
- Create: `packages/cli/src/scan/extract.ts`
- Create: `packages/cli/src/commands/audit-reference.ts`
- Create: `packages/cli/src/index.ts`
- Test: `packages/cli/src/scan/extract.test.ts`

**Interfaces:**
- Consumes: `parseRectilinearPath`, `deriveRing` aus Task 6; `unitsToMm` aus `@einsatzzeichen/schema`
- Produces: `extractFingerprint(svg: string, asset: string): Fingerprint`; Typen `BoundsMm { minXMm; minYMm; maxXMm; maxYMm }`, `ShapeKind = 'ring' | 'bounds' | 'rect' | 'circle'`, `FingerprintShape { kind; boundsMm; strokeWidthMm?; rotate?; fill? }`, `Fingerprint { asset; viewBox; layers; fills; shapes; curvedPaths }`

**Jede Form trägt ihre fertig gedrehte Hülle in `boundsMm`.** Die Drehung wird hier einmal ausgerechnet, nicht beim Vergleichen — sonst müsste jeder Konsument sie kennen. Ohne das schlägt `1.2_Person` fehl: die Füllfläche steht unrotiert bei 5,393…26,607 mm, gedreht bei 1…31 mm.

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

`packages/cli/src/scan/extract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { extractFingerprint } from './extract.js';

const FORMATION_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 90.709 90.709">
  <g id="Grundfläche"><rect x="0" y="0" width="90.709" height="90.709" fill="none"/></g>
  <g id="Flächige_Fülung"><rect x="2.835" y="17.008" width="85.04" height="56.693" fill="#fff"/></g>
  <g id="Takt_Zeichen__x28_umgewandelt_x29_">
    <path d="M88.583,74.41H2.126V16.299h86.457v58.11ZM3.544,72.992h83.622V17.717H3.544v55.275Z"/>
  </g>
</svg>`;

const DIAMOND_SVG = `<svg viewBox="0 0 90.709 90.709">
  <g id="Grundfläche"><rect x="0" y="0" width="90.709" height="90.709" fill="none"/></g>
  <g id="Flächige_Fülung">
    <rect x="19.297" y="24.966" width="52.114" height="52.114" transform="translate(49.363 -17.126) rotate(45)" fill="#fa1919"/>
  </g>
  <g id="Takt_Zeichen__x28_umgewandelt_x29_">
    <circle cx="45.354" cy="7.086" r="4.252"/>
    <path d="M45.354,13.171c1,1 2,2 3,3Z"/>
  </g>
</svg>`;

describe('extractFingerprint', () => {
  it('liest viewBox, Layer und Farben', () => {
    const fp = extractFingerprint(FORMATION_SVG, '1.1_Taktische Formation.svg');
    expect(fp.asset).toBe('1.1_Taktische Formation.svg');
    expect(fp.viewBox).toEqual({ width: 90.709, height: 90.709 });
    expect(fp.layers).toEqual(['Grundfläche', 'Flächige_Fülung', 'Takt_Zeichen (umgewandelt)']);
    expect(fp.fills).toEqual(['#ffffff']);
  });

  it('gibt die Füllfläche in Millimetern aus und ignoriert die Grundfläche', () => {
    const fp = extractFingerprint(FORMATION_SVG, 'x.svg');
    const rect = fp.shapes.find((s) => s.kind === 'rect');
    expect(rect?.boundsMm).toEqual({ minXMm: 1, minYMm: 6, maxXMm: 31, maxYMm: 26 });
  });

  it('leitet aus dem Doppelrahmen die Mittellinie in Millimetern ab', () => {
    const fp = extractFingerprint(FORMATION_SVG, 'x.svg');
    const ring = fp.shapes.find((s) => s.kind === 'ring');
    expect(ring?.boundsMm).toEqual({ minXMm: 1, minYMm: 6, maxXMm: 31, maxYMm: 26 });
    expect(ring?.strokeWidthMm).toBeCloseTo(0.5, 3);
  });

  it('dreht die Hülle eines rotierten Quadrats mit', () => {
    const fp = extractFingerprint(DIAMOND_SVG, 'D.3.7.svg');
    const rect = fp.shapes.find((s) => s.kind === 'rect');
    expect(rect?.rotate).toBe(45);
    // 18,385 mm Seite um (16 | 18) gedreht ergibt 13 mm halbe Diagonale.
    expect(rect?.boundsMm.minYMm).toBeCloseTo(5, 2);
    expect(rect?.boundsMm.maxYMm).toBeCloseTo(31, 2);
    expect(rect?.boundsMm.minXMm).toBeCloseTo(3, 2);
  });

  it('gibt Kreise als Hülle in Millimetern aus', () => {
    const fp = extractFingerprint(DIAMOND_SVG, 'D.3.7.svg');
    const circle = fp.shapes.find((s) => s.kind === 'circle');
    expect(circle?.boundsMm.minXMm).toBeCloseTo(14.5, 2);
    expect(circle?.boundsMm.maxXMm).toBeCloseTo(17.5, 2);
    expect(circle?.boundsMm.maxYMm).toBeCloseTo(4, 2);
  });

  it('zählt Pfade mit Kurven, ohne ihre Geometrie zu erfassen', () => {
    const fp = extractFingerprint(DIAMOND_SVG, 'D.3.7.svg');
    expect(fp.curvedPaths).toBe(1);
  });

  it('erfasst Polygone, damit 1.7 Gebäude nicht leer bleibt', () => {
    const svg = `<svg viewBox="0 0 90.709 90.709">
      <g id="Flächige_Fülung">
        <polygon points="45.354 8.504 2.835 28.346 2.835 73.701 87.874 73.701 87.874 28.346" fill="#fff"/>
      </g>
    </svg>`;
    const shape = extractFingerprint(svg, '1.7_Gebäude.svg').shapes[0];
    expect(shape?.kind).toBe('bounds');
    expect(shape?.boundsMm).toEqual({ minXMm: 1, minYMm: 3, maxXMm: 31, maxYMm: 26 });
  });

  it('nimmt bei mehr als zwei Teilpfaden die äußerste Hülle', () => {
    // 1.7 Gebäude hat drei Teilpfade: Außenring, Innenring und die Dachlinie.
    const svg = `<svg viewBox="0 0 90.709 90.709">
      <g id="Takt_Zeichen__x28_umgewandelt_x29_">
        <path d="M88.583,74.41H2.126V27.895L45.354,7.722l43.229,20.173v46.514ZM3.544,72.992h83.622V29.764H3.544v43.228ZM4.511,28.346h81.687L45.354,9.286,4.511,28.346Z"/>
      </g>
    </svg>`;
    const shape = extractFingerprint(svg, '1.7_Gebäude.svg').shapes[0];
    // Außenkante, nicht Mittellinie — deshalb eine eigene, schwächere Art.
    expect(shape?.kind).toBe('outline');
    expect(shape?.boundsMm.minXMm).toBeCloseTo(0.75, 2);
    expect(shape?.boundsMm.maxYMm).toBeCloseTo(26.25, 2);
  });
});
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm vitest run packages/cli/src/scan/extract.test.ts`
Expected: FAIL — `Failed to resolve import "./extract.js"`

- [ ] **Step 3: Extraktion implementieren**

`packages/cli/src/scan/extract.ts`:

```ts
import { unitsToMm } from '@einsatzzeichen/schema';
import { deriveRing, parseRectilinearPath, type SubpathBounds } from './path-geometry.js';

/** Achsparallele Hülle in Millimetern, Drehung bereits eingerechnet. */
export interface BoundsMm {
  minXMm: number;
  minYMm: number;
  maxXMm: number;
  maxYMm: number;
}

/**
 * Nach Aussagekraft geordnet:
 * `ring`    — Mittellinie aus einem Außen-/Innenring-Paar, exakt
 * `bounds`  — Füllfläche (rect, circle, polygon), exakt
 * `rect`    — Füllrechteck, gegebenenfalls gedreht
 * `circle`  — Füllkreis
 * `outline` — Außenkante eines Pfads mit mehr als zwei Teilpfaden, um halbe Strichstärke zu groß
 */
export type ShapeKind = 'ring' | 'bounds' | 'rect' | 'circle' | 'outline';

export interface FingerprintShape {
  kind: ShapeKind;
  boundsMm: BoundsMm;
  /** Nur bei `ring`: aus dem Ringabstand zurückgerechnete Strichstärke. */
  strokeWidthMm?: number;
  rotate?: number;
  fill?: string;
}

export interface Fingerprint {
  asset: string;
  viewBox: { width: number; height: number };
  layers: string[];
  fills: string[];
  shapes: FingerprintShape[];
  curvedPaths: number;
}

const LAYER_LABELS: Record<string, string> = {
  'Grundfläche': 'Grundfläche',
  'Flächige_Fülung': 'Flächige_Fülung',
  'Takt_Zeichen__x28_umgewandelt_x29_': 'Takt_Zeichen (umgewandelt)',
  'Takt._Zeichen__x28_Typo_x29_': 'Takt. Zeichen (Typo)',
};

function mm(units: number): number {
  return Math.round(unitsToMm(units) * 1000) / 1000;
}

function normalizeFill(value: string): string {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase();
  return value.toLowerCase();
}

function attrs(fragment: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of fragment.matchAll(/([\w:-]+)="([^"]*)"/g)) {
    const [, key, value] = match;
    if (key !== undefined && value !== undefined) result[key] = value;
  }
  return result;
}

function num(value: string | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Wertet `translate(tx ty) rotate(a)` aus, wie es der Illustrator-Export für
 * gedrehte Quadrate erzeugt, und liefert den Mittelpunkt im Zielkoordinatensystem.
 */
function resolveRotation(
  transform: string | undefined,
  cx: number,
  cy: number,
): { angle: number; cx: number; cy: number } | null {
  if (!transform) return null;
  const rotate = /rotate\(\s*(-?[\d.]+)\s*\)/.exec(transform);
  if (!rotate?.[1]) return null;
  const angle = Number(rotate[1]);

  const translate = /translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)/.exec(transform);
  const tx = num(translate?.[1]);
  const ty = num(translate?.[2]);

  const rad = (angle * Math.PI) / 180;
  const rx = cx * Math.cos(rad) - cy * Math.sin(rad);
  const ry = cx * Math.sin(rad) + cy * Math.cos(rad);

  return { angle, cx: rx + tx, cy: ry + ty };
}

function boundsFromPoints(points: ReadonlyArray<readonly [number, number]>): BoundsMm {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    minXMm: mm(Math.min(...xs)),
    minYMm: mm(Math.min(...ys)),
    maxXMm: mm(Math.max(...xs)),
    maxYMm: mm(Math.max(...ys)),
  };
}

/** Hülle eines gegebenenfalls gedrehten Rechtecks, in SVG-Einheiten hinein, in mm hinaus. */
function rectBounds(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: { angle: number; cx: number; cy: number } | null,
): BoundsMm {
  const corners: Array<readonly [number, number]> = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ];
  if (!rotation) return boundsFromPoints(corners);

  const rad = (rotation.angle * Math.PI) / 180;
  return boundsFromPoints(
    corners.map(([px, py]) => {
      const dx = px - (x + width / 2);
      const dy = py - (y + height / 2);
      return [
        rotation.cx + dx * Math.cos(rad) - dy * Math.sin(rad),
        rotation.cy + dx * Math.sin(rad) + dy * Math.cos(rad),
      ] as const;
    }),
  );
}

function subpathBounds(subpaths: SubpathBounds[]): BoundsMm {
  return {
    minXMm: mm(Math.min(...subpaths.map((s) => s.minX))),
    minYMm: mm(Math.min(...subpaths.map((s) => s.minY))),
    maxXMm: mm(Math.max(...subpaths.map((s) => s.maxX))),
    maxYMm: mm(Math.max(...subpaths.map((s) => s.maxY))),
  };
}

export function extractFingerprint(svg: string, asset: string): Fingerprint {
  const viewBoxMatch = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const viewBox = {
    width: num(viewBoxMatch?.[1], 0),
    height: num(viewBoxMatch?.[2], 0),
  };

  const layers: string[] = [];
  for (const match of svg.matchAll(/<g id="([^"]+)"/g)) {
    const raw = match[1];
    if (raw === undefined) continue;
    layers.push(LAYER_LABELS[raw] ?? raw);
  }

  const fills = new Set<string>();
  const shapes: FingerprintShape[] = [];
  let curvedPaths = 0;

  for (const match of svg.matchAll(/<rect([^>]*)\/>/g)) {
    const a = attrs(match[1] ?? '');
    const width = num(a['width']);
    const height = num(a['height']);
    // Die Grundfläche ist ein transparentes Bounding-Rect und trägt keine Information.
    if (a['fill'] === 'none') continue;
    if (a['fill'] !== undefined) fills.add(normalizeFill(a['fill']));

    const x = num(a['x']);
    const y = num(a['y']);
    const rotation = resolveRotation(a['transform'], x + width / 2, y + height / 2);

    const shape: FingerprintShape = {
      kind: 'rect',
      boundsMm: rectBounds(x, y, width, height, rotation),
    };
    if (a['fill'] !== undefined) shape.fill = normalizeFill(a['fill']);
    if (rotation) shape.rotate = rotation.angle;
    shapes.push(shape);
  }

  for (const match of svg.matchAll(/<circle([^>]*)\/>/g)) {
    const a = attrs(match[1] ?? '');
    if (a['fill'] !== undefined && a['fill'] !== 'none') fills.add(normalizeFill(a['fill']));
    const cx = num(a['cx']);
    const cy = num(a['cy']);
    const r = num(a['r']);
    const shape: FingerprintShape = {
      kind: 'circle',
      boundsMm: { minXMm: mm(cx - r), minYMm: mm(cy - r), maxXMm: mm(cx + r), maxYMm: mm(cy + r) },
    };
    if (a['fill'] !== undefined && a['fill'] !== 'none') shape.fill = normalizeFill(a['fill']);
    shapes.push(shape);
  }

  // Polygone tragen bei mehreren Grundzeichen die Füllfläche — 1.7 Gebäude etwa
  // hat gar kein Füllrechteck. Ohne diese Schleife bliebe der Fingerprint leer.
  for (const match of svg.matchAll(/<polygon([^>]*)\/>/g)) {
    const a = attrs(match[1] ?? '');
    if (a['fill'] === 'none') continue;
    if (a['fill'] !== undefined) fills.add(normalizeFill(a['fill']));
    const raw = (a['points'] ?? '').trim().split(/[\s,]+/).map(Number);
    const points: Array<readonly [number, number]> = [];
    for (let i = 0; i + 1 < raw.length; i += 2) {
      points.push([raw[i] as number, raw[i + 1] as number] as const);
    }
    if (points.length === 0) continue;
    const shape: FingerprintShape = { kind: 'bounds', boundsMm: boundsFromPoints(points) };
    if (a['fill'] !== undefined) shape.fill = normalizeFill(a['fill']);
    shapes.push(shape);
  }

  for (const match of svg.matchAll(/<path([^>]*)\/>/g)) {
    const a = attrs(match[1] ?? '');
    if (a['fill'] !== undefined && a['fill'] !== 'none') fills.add(normalizeFill(a['fill']));
    const d = a['d'];
    if (d === undefined) continue;

    const subpaths = parseRectilinearPath(d);
    if (subpaths === null) {
      curvedPaths += 1;
      continue;
    }
    if (subpaths.length === 0) continue;

    const ring = deriveRing(subpaths);
    if (ring) {
      shapes.push({
        kind: 'ring',
        boundsMm: {
          minXMm: mm(ring.x),
          minYMm: mm(ring.y),
          maxXMm: mm(ring.x + ring.width),
          maxYMm: mm(ring.y + ring.height),
        },
        strokeWidthMm: mm(ring.strokeWidth),
      });
      continue;
    }

    // Mehr als zwei Teilpfade (1.7 Gebäude: Außenring, Innenring, Dachlinie) oder
    // kein Ringpaar. Die Außenkante ist um eine halbe Strichstärke zu groß und
    // wird deshalb als schwächere Art `outline` geführt.
    shapes.push({ kind: 'outline', boundsMm: subpathBounds(subpaths) });
  }

  return {
    asset,
    viewBox,
    layers,
    fills: [...fills].sort(),
    shapes,
    curvedPaths,
  };
}
```

- [ ] **Step 4: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm vitest run packages/cli/src/scan/extract.test.ts && pnpm typecheck`
Expected: PASS, 6 Tests

- [ ] **Step 5: CLI-Einstiegspunkt schreiben**

`packages/cli/src/commands/audit-reference.ts`:

```ts
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractFingerprint, type Fingerprint } from '../scan/extract.js';

const REFERENCE_DIR = 'taktische-zeichen';
const OUTPUT = 'packages/catalog/src/fingerprints.json';

export interface AuditOptions {
  /** Nur Dateien, deren Name mit diesem Präfix beginnt (z. B. "1." oder "C.1.1"). */
  filter?: string;
  /** Nur ausgeben, nichts schreiben. */
  print?: boolean;
}

export function auditReference(options: AuditOptions = {}): Fingerprint[] {
  let files: string[];
  try {
    files = readdirSync(REFERENCE_DIR).filter((name) => name.endsWith('.svg'));
  } catch {
    throw new Error(
      `Referenzordner "${REFERENCE_DIR}" nicht gefunden. Der Bestand wird nie eingecheckt ` +
        `und muss lokal vorliegen.`,
    );
  }

  const selected = options.filter
    ? files.filter((name) => name.startsWith(options.filter as string))
    : files;
  selected.sort();

  const fingerprints = selected.map((name) =>
    extractFingerprint(readFileSync(join(REFERENCE_DIR, name), 'utf8'), name),
  );

  if (options.print === true) {
    console.log(JSON.stringify(fingerprints, null, 2));
    return fingerprints;
  }

  writeFileSync(OUTPUT, `${JSON.stringify(fingerprints, null, 2)}\n`, 'utf8');
  console.log(`${fingerprints.length} Kennzahlensätze nach ${OUTPUT} geschrieben.`);
  return fingerprints;
}
```

`packages/cli/src/index.ts`:

```ts
import { auditReference } from './commands/audit-reference.js';

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const command = process.argv[2];

switch (command) {
  case 'audit:reference': {
    const filter = flag('filter');
    auditReference({
      ...(filter !== undefined ? { filter } : {}),
      print: process.argv.includes('--print'),
    });
    break;
  }
  default:
    console.error(`Unbekanntes Kommando: ${command ?? '(keines)'}`);
    console.error('Verfügbar: audit:reference [--filter <präfix>] [--print]');
    process.exit(1);
}
```

- [ ] **Step 6: Kennzahlen erzeugen und Ergebnis prüfen**

Run: `pnpm cli audit:reference --filter "1.1" --print`
Expected: JSON mit einem Eintrag; `shapes` enthält ein `ring` mit `boundsMm: { minXMm: 1, minYMm: 6, maxXMm: 31, maxYMm: 26 }` und `strokeWidthMm: 0.5`

Run: `pnpm cli audit:reference`
Expected: `661 Kennzahlensätze nach packages/catalog/src/fingerprints.json geschrieben.`

- [ ] **Step 7: Prüfen, dass keine Referenzdatei eingecheckt wird**

Run: `git status --porcelain && git check-ignore -v taktische-zeichen/`
Expected: `taktische-zeichen/` erscheint nicht in `git status`; `check-ignore` bestätigt die Regel

- [ ] **Step 8: Commit**

```bash
git add packages/cli packages/catalog/src/fingerprints.json
git commit -m "feat: audit:reference leitet Kennzahlen aus dem Referenzbestand ab"
```

---

### Task 8: Fingerprint-Vergleich als Testhelfer

**Files:**
- Create: `packages/core/src/bounds.ts`
- Create: `packages/core/src/fingerprint.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/fingerprint.test.ts`

**Interfaces:**
- Consumes: `Drawing`, `Primitive`, `TOLERANCE_UNITS`, `mmToUnits` aus `@einsatzzeichen/schema`
- Produces: `boundsOfMm(primitive: Primitive): BoundsMm`, `BoundsMm { minX; minY; maxX; maxY }`, `matchFingerprint(drawing: Drawing, fingerprint: FingerprintLike): FingerprintResult`, `FingerprintResult { ok: boolean; problems: string[] }`; Typ `FingerprintLike { asset: string; shapes: ReadonlyArray<{ kind: string; xMm?: number; yMm?: number; widthMm?: number; heightMm?: number; cxMm?: number; cyMm?: number; rMm?: number }> }`

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

`packages/core/src/fingerprint.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, type Drawing } from '@einsatzzeichen/schema';
import { boundsOfMm, matchFingerprint } from './fingerprint.js';

const formation: Drawing = {
  viewBox: DEFAULT_VIEWBOX_MM,
  children: [
    { type: 'rect', role: 'body', x: 1, y: 6, width: 30, height: 20, style: { stroke: 'schwarz' } },
  ],
};

describe('boundsOfMm', () => {
  it('liefert die Hülle eines Rechtecks', () => {
    expect(boundsOfMm({ type: 'rect', x: 1, y: 6, width: 30, height: 20 })).toEqual({
      minX: 1,
      minY: 6,
      maxX: 31,
      maxY: 26,
    });
  });

  it('liefert die Hülle eines Kreises', () => {
    expect(boundsOfMm({ type: 'circle', cx: 16, cy: 16, r: 14 })).toEqual({
      minX: 2,
      minY: 2,
      maxX: 30,
      maxY: 30,
    });
  });

  it('berücksichtigt eine Drehung um den Mittelpunkt', () => {
    const bounds = boundsOfMm({
      type: 'rect',
      x: 16 - 10.6066,
      y: 16 - 10.6066,
      width: 21.2132,
      height: 21.2132,
      transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
    });
    expect(bounds.minX).toBeCloseTo(1, 3);
    expect(bounds.maxX).toBeCloseTo(31, 3);
  });
});

const ring = (minXMm: number, minYMm: number, maxXMm: number, maxYMm: number) => ({
  kind: 'ring',
  boundsMm: { minXMm, minYMm, maxXMm, maxYMm },
});

describe('matchFingerprint', () => {
  it('bestätigt eine übereinstimmende Körpergeometrie', () => {
    const result = matchFingerprint(formation, {
      asset: '1.1_Taktische Formation.svg',
      shapes: [ring(1, 6, 31, 26)],
    });
    expect(result).toEqual({ ok: true, problems: [] });
  });

  it('toleriert das Exportrauschen der Referenz', () => {
    const result = matchFingerprint(formation, {
      asset: 'x.svg',
      shapes: [ring(0.9997, 6.0003, 31, 26)],
    });
    expect(result.ok).toBe(true);
  });

  it('meldet eine Abweichung oberhalb der Toleranz mit Zahlen', () => {
    const result = matchFingerprint(formation, { asset: 'x.svg', shapes: [ring(2, 6, 31, 26)] });
    expect(result.ok).toBe(false);
    expect(result.problems[0]).toContain('minX');
    expect(result.problems[0]).toContain('2');
  });

  it('bevorzugt die Mittellinie vor der Außenkante', () => {
    const result = matchFingerprint(formation, {
      asset: 'x.svg',
      shapes: [
        { kind: 'outline', boundsMm: { minXMm: 0.75, minYMm: 5.75, maxXMm: 31.25, maxYMm: 26.25 } },
        ring(1, 6, 31, 26),
      ],
    });
    expect(result.ok).toBe(true);
  });

  it('meldet, wenn kein Primitiv mit der Rolle body vorhanden ist', () => {
    const result = matchFingerprint(
      { viewBox: DEFAULT_VIEWBOX_MM, children: [] },
      { asset: 'x.svg', shapes: [ring(1, 6, 31, 26)] },
    );
    expect(result.ok).toBe(false);
    expect(result.problems[0]).toContain('body');
  });
});
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm vitest run packages/core/src/fingerprint.test.ts`
Expected: FAIL — `Failed to resolve import "./fingerprint.js"`

- [ ] **Step 3: Hüllberechnung implementieren**

`packages/core/src/bounds.ts`:

```ts
import type { Point, Primitive } from '@einsatzzeichen/schema';

/** Achsparallele Hülle in Millimetern. */
export interface BoundsMm {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function fromPoints(points: readonly Point[]): BoundsMm {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

function corners(bounds: BoundsMm): Point[] {
  return [
    [bounds.minX, bounds.minY],
    [bounds.maxX, bounds.minY],
    [bounds.maxX, bounds.maxY],
    [bounds.minX, bounds.maxY],
  ];
}

function merge(list: BoundsMm[]): BoundsMm {
  return {
    minX: Math.min(...list.map((b) => b.minX)),
    minY: Math.min(...list.map((b) => b.minY)),
    maxX: Math.max(...list.map((b) => b.maxX)),
    maxY: Math.max(...list.map((b) => b.maxY)),
  };
}

/**
 * Hülle eines Primitivs in Millimetern, inklusive Drehung.
 * Pfad-Primitive liefern eine leere Hülle — Piktogramme werden nicht geometrisch verglichen.
 */
export function boundsOfMm(primitive: Primitive): BoundsMm {
  let base: BoundsMm;

  switch (primitive.type) {
    case 'rect':
      base = {
        minX: primitive.x,
        minY: primitive.y,
        maxX: primitive.x + primitive.width,
        maxY: primitive.y + primitive.height,
      };
      break;
    case 'circle':
      base = {
        minX: primitive.cx - primitive.r,
        minY: primitive.cy - primitive.r,
        maxX: primitive.cx + primitive.r,
        maxY: primitive.cy + primitive.r,
      };
      break;
    case 'line':
      base = fromPoints([
        [primitive.x1, primitive.y1],
        [primitive.x2, primitive.y2],
      ]);
      break;
    case 'polyline':
      base = fromPoints(primitive.points);
      break;
    case 'group':
      base =
        primitive.children.length > 0
          ? merge(primitive.children.map(boundsOfMm))
          : { minX: 0, minY: 0, maxX: 0, maxY: 0 };
      break;
    case 'path':
      base = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
      break;
  }

  const rotate = primitive.transform?.rotate;
  if (!rotate) return base;

  const rad = (rotate.angle * Math.PI) / 180;
  const rotated = corners(base).map(([x, y]): Point => {
    const dx = x - rotate.cx;
    const dy = y - rotate.cy;
    return [
      rotate.cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      rotate.cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    ];
  });
  return fromPoints(rotated);
}
```

- [ ] **Step 4: Vergleich implementieren**

`packages/core/src/fingerprint.ts`:

```ts
import { TOLERANCE_UNITS, mmToUnits, type Drawing, type Primitive } from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from './bounds.js';

// Kein Re-Export von boundsOfMm/BoundsMm: der Paket-Index exportiert bereits ./bounds.js,
// ein zweiter Pfad erzeugte einen mehrdeutigen Export.

export interface FingerprintShapeLike {
  kind: string;
  boundsMm: { minXMm: number; minYMm: number; maxXMm: number; maxYMm: number };
}

export interface FingerprintLike {
  asset: string;
  shapes: readonly FingerprintShapeLike[];
  /** Normalisierte Hexwerte der Füllfarben. Wird in Task 10 für die Organisationen genutzt. */
  fills?: readonly string[];
}

export interface FingerprintResult {
  ok: boolean;
  problems: string[];
}

/**
 * Aussagekraft der Formarten, absteigend. `ring` ist eine echte Mittellinie,
 * `outline` liegt um eine halbe Strichstärke daneben und wird nur genommen,
 * wenn nichts Besseres da ist.
 */
const PRECEDENCE = ['ring', 'bounds', 'rect', 'circle', 'outline'];

function pickShape(shapes: readonly FingerprintShapeLike[]): FingerprintShapeLike | null {
  for (const kind of PRECEDENCE) {
    const found = shapes.find((shape) => shape.kind === kind);
    if (found) return found;
  }
  return shapes[0] ?? null;
}

function boundsOfShape(shape: FingerprintShapeLike): BoundsMm {
  return {
    minX: shape.boundsMm.minXMm,
    minY: shape.boundsMm.minYMm,
    maxX: shape.boundsMm.maxXMm,
    maxY: shape.boundsMm.maxYMm,
  };
}

function findBody(children: readonly Primitive[]): Primitive | null {
  for (const child of children) {
    if (child.role === 'body') return child;
    if (child.type === 'group') {
      const nested = findBody(child.children);
      if (nested) return nested;
    }
  }
  return null;
}

/**
 * Vergleicht die Körpergeometrie einer Zeichnung mit den aus der Referenz abgeleiteten
 * Kennzahlen. Verglichen wird in SVG-Einheiten mit der Exporttoleranz von 0,01.
 */
export function matchFingerprint(
  drawing: Drawing,
  fingerprint: FingerprintLike,
): FingerprintResult {
  const problems: string[] = [];

  const body = findBody(drawing.children);
  if (!body) {
    return {
      ok: false,
      problems: [`Kein Primitiv mit role "body" in der Zeichnung zu ${fingerprint.asset}.`],
    };
  }

  const picked = pickShape(fingerprint.shapes);
  if (!picked) {
    return {
      ok: false,
      problems: [`Keine vergleichbare Form in den Kennzahlen zu ${fingerprint.asset}.`],
    };
  }

  const reference = boundsOfShape(picked);
  const actual = boundsOfMm(body);
  const keys: Array<keyof BoundsMm> = ['minX', 'minY', 'maxX', 'maxY'];

  for (const key of keys) {
    const expectedUnits = mmToUnits(reference[key]);
    const actualUnits = mmToUnits(actual[key]);
    if (Math.abs(expectedUnits - actualUnits) > TOLERANCE_UNITS) {
      problems.push(
        `${fingerprint.asset}: ${key} erwartet ${reference[key]} mm, erhalten ${actual[key]} mm ` +
          `(Differenz ${(actualUnits - expectedUnits).toFixed(4)} Einheiten).`,
      );
    }
  }

  return { ok: problems.length === 0, problems };
}
```

`packages/core/src/index.ts` erweitern:

```ts
export * from './render/svg.js';
export * from './render/canvas.js';
export * from './bounds.js';
export * from './fingerprint.js';
```

- [ ] **Step 5: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm vitest run packages/core/src/fingerprint.test.ts && pnpm typecheck`
Expected: PASS, 8 Tests

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "feat: Fingerprint-Vergleich gegen abgeleitete Referenzkennzahlen"
```

---

### Task 9: Katalog Kapitel 1 — Grundzeichen

**Files:**
- Create: `packages/catalog/src/fingerprint-index.ts`
- Create: `packages/catalog/src/base-symbols.ts`
- Modify: `packages/catalog/src/index.ts`
- Test: `packages/catalog/src/base-symbols.test.ts`

**Interfaces:**
- Consumes: `Drawing`, `CatalogEntry`, `SymbolKind` aus `@einsatzzeichen/schema`; `matchFingerprint` aus `@einsatzzeichen/core`
- Produces: `BASE_SYMBOLS: Record<SymbolKind, CatalogEntry>`, `baseDrawing(kind: SymbolKind): Drawing`, `fingerprintFor(asset: string): FingerprintLike`

- [ ] **Step 1: Kennzahlenzugriff schreiben**

`packages/catalog/src/fingerprint-index.ts`:

```ts
import type { FingerprintLike } from '@einsatzzeichen/core';
import fingerprints from './fingerprints.json' with { type: 'json' };

const index = new Map<string, FingerprintLike>(
  (fingerprints as FingerprintLike[]).map((fp) => [fp.asset, fp]),
);

/** Wirft, wenn die Kennzahlen fehlen — dann wurde `pnpm cli audit:reference` nicht ausgeführt. */
export function fingerprintFor(asset: string): FingerprintLike {
  const found = index.get(asset);
  if (!found) {
    throw new Error(
      `Keine Kennzahlen zu "${asset}". Fehlt der Eintrag, mit "pnpm cli audit:reference" neu erzeugen.`,
    );
  }
  return found;
}
```

Ergänze in `tsconfig.json` unter `compilerOptions`: `"resolveJsonModule": true`.

- [ ] **Step 2: Den fehlschlagenden Test schreiben**

`packages/catalog/src/base-symbols.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { matchFingerprint } from '@einsatzzeichen/core';
import { BASE_SYMBOLS, baseDrawing } from './base-symbols.js';
import { fingerprintFor } from './fingerprint-index.js';

const REFERENCE: ReadonlyArray<[keyof typeof BASE_SYMBOLS, string]> = [
  ['formation', '1.1_Taktische Formation.svg'],
  ['person', '1.2_Person.svg'],
  ['post', '1.6_Funktionsstelle.svg'],
  ['building', '1.7_Gebäude.svg'],
  ['container', '1.8_Behälter Ressource Raum Funkgerät.svg'],
];

describe('Grundzeichen Kapitel 1', () => {
  it.each(REFERENCE)('trifft die Referenzgeometrie von %s', (kind, asset) => {
    const result = matchFingerprint(baseDrawing(kind), fingerprintFor(asset));
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it.each(REFERENCE)('trägt Quellenbezug und Reviewstatus für %s', (kind) => {
    const entry = BASE_SYMBOLS[kind];
    expect(entry.depictions).toHaveLength(1);
    expect(entry.depictions[0]?.variant).toBe('primary');
    expect(entry.depictions[0]?.sourceRefs[0]?.source).toBe('babz-svg-2025');
    expect(entry.depictions[0]?.sourceRefs[0]?.status).toBe('verbatim');
  });

  it('markiert den Körper jedes Grundzeichens mit der Rolle body', () => {
    for (const [kind] of REFERENCE) {
      const body = baseDrawing(kind).children.find((c) => c.role === 'body');
      expect(body, `${kind} hat kein body-Primitiv`).toBeDefined();
    }
  });
});
```

- [ ] **Step 3: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm vitest run packages/catalog/src/base-symbols.test.ts`
Expected: FAIL — `Failed to resolve import "./base-symbols.js"`

- [ ] **Step 4: Die fünf vermessenen Grundzeichen implementieren**

`packages/catalog/src/base-symbols.ts`:

```ts
import {
  DEFAULT_STROKE_WIDTH_MM,
  DEFAULT_VIEWBOX_MM,
  type CatalogEntry,
  type Drawing,
  type Primitive,
  type Style,
  type SymbolKind,
} from '@einsatzzeichen/schema';

/** Umriss ohne Füllung. Organisationsfarben setzt der Kompositionsmotor. */
const OUTLINE: Style = {
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: DEFAULT_STROKE_WIDTH_MM,
};

/** Halbe Seitenlänge des gedrehten Quadrats bei 15 mm halber Diagonale. */
const PERSON_HALF_SIDE = (15 * Math.SQRT2) / 2;

const BODIES: Partial<Record<SymbolKind, Primitive>> = {
  formation: { type: 'rect', role: 'body', x: 1, y: 6, width: 30, height: 20, style: OUTLINE },
  person: {
    type: 'rect',
    role: 'body',
    x: 16 - PERSON_HALF_SIDE,
    y: 16 - PERSON_HALF_SIDE,
    width: PERSON_HALF_SIDE * 2,
    height: PERSON_HALF_SIDE * 2,
    transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
    style: OUTLINE,
  },
  post: { type: 'circle', role: 'body', cx: 16, cy: 16, r: 14, style: OUTLINE },
  building: {
    type: 'polyline',
    role: 'body',
    closed: true,
    points: [
      [16, 3],
      [1, 10],
      [1, 26],
      [31, 26],
      [31, 10],
    ],
    style: OUTLINE,
  },
  container: { type: 'rect', role: 'body', x: 4, y: 4, width: 24, height: 24, style: OUTLINE },
};

const TITLES: Partial<Record<SymbolKind, string>> = {
  formation: 'Taktische Formation',
  person: 'Person',
  post: 'Funktionsstelle',
  building: 'Gebäude',
  container: 'Behälter, Ressource, Raum, Funkgerät',
};

const SECTIONS: Partial<Record<SymbolKind, { section: string; asset: string }>> = {
  formation: { section: '1.1', asset: '1.1_Taktische Formation.svg' },
  person: { section: '1.2', asset: '1.2_Person.svg' },
  post: { section: '1.6', asset: '1.6_Funktionsstelle.svg' },
  building: { section: '1.7', asset: '1.7_Gebäude.svg' },
  container: { section: '1.8', asset: '1.8_Behälter Ressource Raum Funkgerät.svg' },
};

export function baseDrawing(kind: SymbolKind): Drawing {
  const body = BODIES[kind];
  if (!body) throw new Error(`Kein Grundzeichen für "${kind}" im Katalog.`);
  const title = TITLES[kind];
  return {
    viewBox: DEFAULT_VIEWBOX_MM,
    children: [body],
    ...(title !== undefined ? { title } : {}),
  };
}

function entry(kind: SymbolKind): CatalogEntry {
  const meta = SECTIONS[kind];
  if (!meta) throw new Error(`Keine Quellenangabe für "${kind}".`);
  return {
    id: `base.${kind}`,
    title: TITLES[kind] ?? kind,
    kind,
    depictions: [
      {
        variant: 'primary',
        drawing: baseDrawing(kind),
        sourceRefs: [
          {
            source: 'babz-svg-2025',
            section: meta.section,
            asset: meta.asset,
            status: 'verbatim',
          },
        ],
      },
    ],
  };
}

export const BASE_SYMBOLS = {
  formation: entry('formation'),
  person: entry('person'),
  post: entry('post'),
  building: entry('building'),
  container: entry('container'),
} as const satisfies Partial<Record<SymbolKind, CatalogEntry>>;
```

`packages/catalog/src/index.ts`:

```ts
export * from './fingerprint-index.js';
export * from './base-symbols.js';
```

- [ ] **Step 5: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm vitest run packages/catalog/src/base-symbols.test.ts && pnpm typecheck`
Expected: PASS, 11 Tests

- [ ] **Step 6: Commit**

```bash
git add packages/catalog tsconfig.json
git commit -m "feat: Grundzeichen 1.1, 1.2, 1.6, 1.7 und 1.8 mit Fingerprint-Gate"
```

- [ ] **Step 7: Die verbleibenden neun Grundzeichen ergänzen**

Fehlen noch: `1.3 Landfahrzeug`, `1.4 Luftfahrzeug`, `1.5 Wasserfahrzeug`, `1.9 Gebiet`, `1.10 Maßnahme`, `1.11 Gefahr`, `1.12 Konkreter Punkt`, `1.13 Ereignis`, `1.14 Spontanhelfer`.

Für jedes einzeln, in dieser Reihenfolge:

1. Maße auslesen:
   `pnpm cli audit:reference --filter "1.3" --print`
   Die Ausgabe nennt unter `shapes` entweder ein `ring` (Umrisszeichen) oder ein `rect`/`circle` (Füllfläche). Die Felder `xMm`, `yMm`, `widthMm`, `heightMm` beziehungsweise `cxMm`, `cyMm`, `rMm` sind bereits Mittellinienwerte in Millimetern.
2. Den Testfall in `REFERENCE` in `base-symbols.test.ts` ergänzen, z. B. `['vehicle-land', '1.3_Landfahrzeug.svg']`.
3. Test laufen lassen — er muss fehlschlagen (`Kein Grundzeichen für "vehicle-land"`).
4. Einträge in `BODIES`, `TITLES`, `SECTIONS` und `BASE_SYMBOLS` ergänzen. Wenn `curvedPaths > 0` und kein `ring` ausgegeben wird, ist das Zeichen kein Umriss aus Geraden — dann als `polyline` aus den in der Ausgabe genannten Eckpunkten nachbilden und die Abweichung im Commit begründen.
5. Test laufen lassen — er muss bestehen.
6. Commit: `git commit -m "feat: Grundzeichen 1.3 Landfahrzeug"`

- [ ] **Step 8: Gesamtlauf**

Run: `pnpm test && pnpm typecheck`
Expected: alle Tests grün, 14 Grundzeichen abgedeckt

---

### Task 10: Katalog Kapitel 2 — Organisationen und Farben

**Files:**
- Create: `packages/catalog/src/organizations.ts`
- Modify: `packages/catalog/src/index.ts`
- Test: `packages/catalog/src/organizations.test.ts`

**Interfaces:**
- Consumes: `ColorToken`, `OrganizationId`, `PALETTE` aus `@einsatzzeichen/schema`
- Produces: `ORGANIZATION_COLORS: Record<OrganizationId, ColorToken>`, `organizationColor(id: OrganizationId): ColorToken`

- [ ] **Step 1: Farben aus der Referenz auslesen**

Run: `pnpm cli audit:reference --filter "2." --print`
Expected: `2.1_Feuerwehr.svg` liefert unter `fills` den Wert `#fa1919`, `2.3_Technisches Hilfswerk.svg` den Wert `#003296`.

**Nicht jede Organisationsdatei trägt eine Füllfarbe.** Wo die Zeichnung nur aus schwarzen Strichen besteht, fehlt das `fill`-Attribut und `fills` bleibt leer — das bedeutet „weiße Grundfläche", nicht „keine Angabe". Notiere zwei Listen: Dateien **mit** Hexwert und Dateien **ohne**. Die zweite Liste bekommt das Token `weiss`.

- [ ] **Step 2: Den fehlschlagenden Test schreiben**

`packages/catalog/src/organizations.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PALETTE, type OrganizationId } from '@einsatzzeichen/schema';
import { ORGANIZATION_COLORS, organizationColor } from './organizations.js';
import { fingerprintFor } from './fingerprint-index.js';

/** Organisationen, deren Referenzdatei eine Füllfarbe trägt. Aus Step 1 ergänzen. */
const COLORED: ReadonlyArray<[OrganizationId, string]> = [
  ['feuerwehr', '2.1_Feuerwehr.svg'],
  ['thw', '2.3_Technisches Hilfswerk.svg'],
];

/** Organisationen ohne Füllfarbe in der Referenz — weiße Grundfläche. Aus Step 1 ergänzen. */
const UNCOLORED: ReadonlyArray<[OrganizationId, string]> = [
  ['fuehrung-leitung', '2.4_Führung Leitung.svg'],
];

describe('Organisationen Kapitel 2', () => {
  it.each(COLORED)('trifft die Referenzfarbe von %s', (id, asset) => {
    const fills = fingerprintFor(asset).fills ?? [];
    expect(fills, `${asset} trägt keine Füllfarbe — gehört die Organisation in UNCOLORED?`)
      .toContain(PALETTE[organizationColor(id)]);
  });

  it.each(UNCOLORED)('führt %s ohne Referenzfarbe als weiß', (id, asset) => {
    expect(fingerprintFor(asset).fills ?? []).toEqual([]);
    expect(organizationColor(id)).toBe('weiss');
  });

  it('definiert für jede Organisation genau ein Farbtoken aus der Palette', () => {
    for (const token of Object.values(ORGANIZATION_COLORS)) {
      expect(PALETTE[token]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
```

- [ ] **Step 3: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm vitest run packages/catalog/src/organizations.test.ts`
Expected: FAIL — `Failed to resolve import "./organizations.js"`

- [ ] **Step 4: Implementierung schreiben**

`packages/catalog/src/organizations.ts` — trage die in Step 1 abgelesenen Farbtoken ein. `feuerwehr` ist `rot` (`#fa1919`), `thw` ist `blau` (`#003296`); die übrigen fünf aus der Ausgabe übernehmen:

```ts
import type { ColorToken, OrganizationId } from '@einsatzzeichen/schema';

/** Aus Kapitel 2 der BBK/BABZ-Empfehlung abgeleitet, Werte per audit:reference belegt. */
export const ORGANIZATION_COLORS: Record<OrganizationId, ColorToken> = {
  feuerwehr: 'rot',
  thw: 'blau',
  'fuehrung-leitung': 'weiss',
  polizei: 'gruen',
  bundeswehr: 'gruen',
  'sonstige-gefahrenabwehr': 'weiss',
  'zivile-einheiten': 'weiss',
  hilfsorganisation: 'weiss',
};

export function organizationColor(id: OrganizationId): ColorToken {
  return ORGANIZATION_COLORS[id];
}
```

Ersetze jeden Wert, der nicht mit der Ausgabe aus Step 1 übereinstimmt. Der Test schlägt fehl, solange eine Zuordnung falsch ist.

- [ ] **Step 5: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm vitest run packages/catalog/src/organizations.test.ts && pnpm typecheck`
Expected: PASS — je ein Testfall pro Eintrag in `COLORED` und `UNCOLORED`, plus der Palettentest

- [ ] **Step 6: Commit**

```bash
git add packages/catalog packages/core
git commit -m "feat: Organisationsfarben aus Kapitel 2, gegen Referenz belegt"
```

---

### Task 11: Layoutprofile

**Files:**
- Create: `packages/core/src/layout/profiles.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/layout/profiles.test.ts`

**Interfaces:**
- Consumes: `SymbolKind` aus `@einsatzzeichen/schema`; `boundsOfMm` aus Task 8
- Produces: `HEAD_GAP_MM = 1`, `HEAD_TOP_MARGIN_MM = 1`, `LayoutProfileId = 'rect-body' | 'rotated-square-body' | 'circle-body'`, `profileFor(kind: SymbolKind): LayoutProfile`, `LayoutProfile { id; defaultAnchorMm; place(body: Primitive, headBottomMm: number | null): Primitive }`, `placeHead(profile: LayoutProfile, headHeightMm: number): { topMm: number; bottomMm: number }`

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

`packages/core/src/layout/profiles.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Primitive } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { HEAD_GAP_MM, HEAD_TOP_MARGIN_MM, placeHead, profileFor } from './profiles.js';

const rectBody: Primitive = { type: 'rect', role: 'body', x: 1, y: 6, width: 30, height: 20 };

const halfSide = (15 * Math.SQRT2) / 2;
const diamondBody: Primitive = {
  type: 'rect',
  role: 'body',
  x: 16 - halfSide,
  y: 16 - halfSide,
  width: halfSide * 2,
  height: halfSide * 2,
  transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
};

describe('Layoutprofile', () => {
  it('verwendet 1 mm Abstand und 1 mm oberen Rand', () => {
    expect(HEAD_GAP_MM).toBe(1);
    expect(HEAD_TOP_MARGIN_MM).toBe(1);
  });

  it('kennt den Standardanker jeder Körperform', () => {
    expect(profileFor('formation').defaultAnchorMm).toBe(6);
    expect(profileFor('person').defaultAnchorMm).toBe(1);
    expect(profileFor('post').defaultAnchorMm).toBe(2);
  });

  it('lässt den Körper ohne Kopfzone unverändert', () => {
    const placed = profileFor('formation').place(rectBody, null);
    expect(boundsOfMm(placed)).toEqual(boundsOfMm(rectBody));
  });

  it('setzt die Punktreihe über den Rechteckkörper, ohne ihn zu verschieben', () => {
    // E.1.18 / C.1.2: Reihe 3 mm hoch, oben bei 2 mm, unten bei 5 mm, Körper bleibt bei 6 mm.
    const head = placeHead(profileFor('formation'), 3);
    expect(head).toEqual({ topMm: 2, bottomMm: 5 });
    expect(boundsOfMm(profileFor('formation').place(rectBody, head.bottomMm)).minY).toBeCloseTo(6, 6);
  });

  it('schiebt den Rechteckkörper, wenn der Punktstapel nicht darüber passt', () => {
    // C.1.1 Löschstaffel: Stapel 7 mm hoch, oben bei 1 mm, unten bei 8 mm, Körper bei 9 mm.
    const head = placeHead(profileFor('formation'), 7);
    expect(head).toEqual({ topMm: 1, bottomMm: 8 });
    const bounds = boundsOfMm(profileFor('formation').place(rectBody, head.bottomMm));
    expect(bounds.minY).toBeCloseTo(9, 6);
    expect(bounds.maxY).toBeCloseTo(29, 6);
    expect(bounds.minX).toBeCloseTo(1, 6);
  });

  it('setzt dieselbe Punktreihe am gedrehten Quadrat 1 mm höher', () => {
    // D.3.7: Standardanker 1 mm, Reihe deshalb oben bei 1 mm statt bei 2 mm.
    const head = placeHead(profileFor('person'), 3);
    expect(head).toEqual({ topMm: 1, bottomMm: 4 });
  });

  it('verkleinert das gedrehte Quadrat von oben und hält die Unterkante', () => {
    const bounds = boundsOfMm(profileFor('person').place(diamondBody, 4));
    expect(bounds.minY).toBeCloseTo(5, 3);
    expect(bounds.maxY).toBeCloseTo(31, 3);
    expect(bounds.minX).toBeCloseTo(3, 3);
    expect(bounds.maxX).toBeCloseTo(29, 3);
  });

  it('ordnet jeder Grundzeichenart ein Profil zu', () => {
    expect(profileFor('formation').id).toBe('rect-body');
    expect(profileFor('person').id).toBe('rotated-square-body');
    expect(profileFor('post').id).toBe('circle-body');
  });
});
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm vitest run packages/core/src/layout/profiles.test.ts`
Expected: FAIL — `Failed to resolve import "./profiles.js"`

- [ ] **Step 3: Implementierung schreiben**

`packages/core/src/layout/profiles.ts`:

```ts
import type { Primitive, SymbolKind } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';

/**
 * Abstand zwischen der Unterkante der Kopfzone und dem Körperanker.
 * An drei Konstellationen der Referenz belegt: C.1.1 (8 → 9), C.1.2 (5 → 6), D.3.7 (4 → 5).
 */
export const HEAD_GAP_MM = 1;

/** Kleinster Abstand der Kopfzone zum oberen Rand der Grundfläche. */
export const HEAD_TOP_MARGIN_MM = 1;

export type LayoutProfileId = 'rect-body' | 'rotated-square-body' | 'circle-body';

export interface LayoutProfile {
  id: LayoutProfileId;
  /** Oberster Punkt der Körper-Mittellinie ohne Kopfzone. */
  defaultAnchorMm: number;
  /**
   * Setzt den Körper relativ zur Kopfzone. `headBottomMm === null` bedeutet: keine Kopfzone,
   * der Körper behält seine Standardgeometrie.
   */
  place(body: Primitive, headBottomMm: number | null): Primitive;
}

/**
 * Setzt eine Kopfzone bekannter Höhe absolut. Sie wird so tief wie möglich gehängt,
 * damit der Körper auf seinem Standardanker bleiben kann — passt sie dort nicht,
 * rutscht sie an den oberen Rand und der Körper weicht aus.
 *
 * Belegt an: Rechteck + Reihe (6, 3) → 2/5; Rechteck + Stapel (6, 7) → 1/8;
 * gedrehtes Quadrat + Reihe (1, 3) → 1/4.
 */
export function placeHead(
  profile: LayoutProfile,
  headHeightMm: number,
): { topMm: number; bottomMm: number } {
  const topMm = Math.max(
    HEAD_TOP_MARGIN_MM,
    profile.defaultAnchorMm - HEAD_GAP_MM - headHeightMm,
  );
  return { topMm, bottomMm: topMm + headHeightMm };
}

function shiftY(body: Primitive, deltaMm: number): Primitive {
  switch (body.type) {
    case 'rect':
      return { ...body, y: body.y + deltaMm };
    case 'circle':
      return { ...body, cy: body.cy + deltaMm };
    case 'line':
      return { ...body, y1: body.y1 + deltaMm, y2: body.y2 + deltaMm };
    case 'polyline':
      return { ...body, points: body.points.map(([x, y]) => [x, y + deltaMm] as const) };
    case 'group':
      return { ...body, children: body.children.map((c) => shiftY(c, deltaMm)) };
    case 'path':
      throw new Error('Pfad-Primitive können nicht als Körper platziert werden.');
  }
}

/**
 * Verschiebt den Körper, ohne seine Größe zu ändern — und nur so weit wie nötig.
 * C.1.2 (Reihe) bleibt deshalb bei 6 mm wie 1.1, C.1.1 (Stapel) rückt auf 9 mm.
 */
const rectBodyProfile: LayoutProfile = {
  id: 'rect-body',
  defaultAnchorMm: 6,
  place(body, headBottomMm) {
    if (headBottomMm === null) return body;
    const target = Math.max(this.defaultAnchorMm, headBottomMm + HEAD_GAP_MM);
    return shiftY(body, target - boundsOfMm(body).minY);
  },
};

/**
 * Verkleinert das gedrehte Quadrat von oben und hält die Unterkante.
 * Belegt an D.3.7: halbe Diagonale 15 → 13 mm, Mittelpunkt 16 → 18 mm, Unterkante bleibt 31 mm.
 */
const rotatedSquareProfile: LayoutProfile = {
  id: 'rotated-square-body',
  defaultAnchorMm: 1,
  place(body, headBottomMm) {
    if (headBottomMm === null) return body;
    if (body.type !== 'rect' || body.transform?.rotate === undefined) {
      throw new Error('Profil "rotated-square-body" erwartet ein gedrehtes rect als Körper.');
    }
    const bounds = boundsOfMm(body);
    const bottom = bounds.maxY;
    const apex = Math.max(this.defaultAnchorMm, headBottomMm + HEAD_GAP_MM);
    const halfDiagonal = (bottom - apex) / 2;
    const centerY = apex + halfDiagonal;
    const side = halfDiagonal * Math.SQRT2;
    const centerX = (bounds.minX + bounds.maxX) / 2;

    return {
      ...body,
      x: centerX - side / 2,
      y: centerY - side / 2,
      width: side,
      height: side,
      transform: { rotate: { ...body.transform.rotate, cx: centerX, cy: centerY } },
    };
  },
};

/**
 * Kreiskörper mit Kopfzone ist in der Referenz nicht belegt. Bis eine Vermessung vorliegt,
 * wird die Anpassung nicht geraten, sondern abgelehnt.
 */
const circleBodyProfile: LayoutProfile = {
  id: 'circle-body',
  defaultAnchorMm: 2,
  place(body, headBottomMm) {
    if (headBottomMm === null) return body;
    throw new Error(
      'Kreiskörper mit Kopfzone ist nicht belegt. Vor der Umsetzung an der Referenz vermessen.',
    );
  },
};

const PROFILES: Record<SymbolKind, LayoutProfile> = {
  formation: rectBodyProfile,
  'vehicle-land': rectBodyProfile,
  'vehicle-air': rectBodyProfile,
  'vehicle-water': rectBodyProfile,
  building: rectBodyProfile,
  container: rectBodyProfile,
  area: rectBodyProfile,
  measure: rectBodyProfile,
  hazard: rectBodyProfile,
  point: rectBodyProfile,
  event: rectBodyProfile,
  'spontaneous-helper': rectBodyProfile,
  person: rotatedSquareProfile,
  post: circleBodyProfile,
};

export function profileFor(kind: SymbolKind): LayoutProfile {
  return PROFILES[kind];
}
```

`packages/core/src/index.ts` erweitern:

```ts
export * from './layout/profiles.js';
```

- [ ] **Step 4: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm vitest run packages/core/src/layout/profiles.test.ts && pnpm typecheck`
Expected: PASS, 8 Tests

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "feat: Layoutprofile mit 1-mm-Regel und profilabhängiger Anpassung"
```

---

### Task 12: Stärke, Verwaltungsstufen, Fahrzeugkategorien und Piktogramm

**Files:**
- Create: `packages/catalog/src/strengths.ts`
- Create: `packages/catalog/src/admin-levels.ts`
- Create: `packages/catalog/src/vehicle-categories.ts`
- Create: `packages/catalog/src/capabilities.ts`
- Modify: `packages/catalog/src/index.ts`
- Test: `packages/catalog/src/strengths.test.ts`
- Test: `packages/catalog/src/capabilities.test.ts`

**Interfaces:**
- Consumes: `StrengthId`, `AdminLevelId`, `VehicleCategoryId`, `CapabilityId`, `Primitive` aus `@einsatzzeichen/schema`
- Produces: `strengthHead(id: StrengthId): HeadShape`, `HeadShape { marks: readonly HeadMark[]; heightMm: number }`, `HeadMark { cxMm: number; cyFromTopMm: number; rMm: number }`, `adminLevelHead(id: AdminLevelId): HeadShape`, `vehicleCategoryMarks(id: VehicleCategoryId): Primitive[]`, `capabilityPictogram(id: CapabilityId): Primitive[]`

**Die Kopfzone ist relativ.** `strengthHead` beschreibt die Marken bezogen auf die Oberkante der Kopfzone und ihre Gesamthöhe. Wo diese Oberkante liegt, entscheidet `placeHead` aus Task 11 — dieselbe Punktreihe steht am Rechteckkörper 1 mm tiefer als am gedrehten Quadrat. Absolute `cy`-Werte im Katalog wären falsch.

- [ ] **Step 1: Stärkeangaben aus der Referenz vermessen**

Run: `pnpm cli audit:reference --filter "C.1." --print`
Run: `pnpm cli audit:reference --filter "E.1.18" --print`

Lies aus den `circle`-Einträgen ab, wie viele Punkte jeder Stärkegrad trägt und wo sie sitzen. **Nicht aus der Bezeichnung schließen** — Illustrator führt benachbarte Kreise zu einem Pfad zusammen, sodass die Anzahl der `<circle>`-Elemente in der Rohdatei irreführt: `C.1.2_Löschgruppe` hat ein `<circle>`, `C.1.3_Löschzug` deren zwei, bei sonst gleicher Reihengeometrie.

Belegt sind bereits die beiden **Anordnungen**, jeweils relativ zur Oberkante der Kopfzone:

- Punktreihe waagerecht: `cx = 11 / 16 / 21`, `cyFromTop = 1,5`, Radius 1,5, Gesamthöhe 3
- Punkte senkrecht gestapelt: `cx = 16`, `cyFromTop = 1,5` und `5,5`, Radius 1,5, Gesamthöhe 7

Notiere für jeden der vier Stärkegrade Anordnung **und** Punktanzahl, bevor du weitermachst. Erst wenn alle vier belegt sind, weiter mit Step 2 — die Zuordnung ist die einzige Stelle im Slice, an der eine unbelegte Annahme still ein falsches Zeichen erzeugen würde.

- [ ] **Step 2: Den fehlschlagenden Test für die Stärke schreiben**

`packages/catalog/src/strengths.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { StrengthId } from '@einsatzzeichen/schema';
import { strengthHead } from './strengths.js';

const ALL: readonly StrengthId[] = ['trupp', 'staffel', 'gruppe', 'zug'];

describe('Stärkeangaben', () => {
  it('setzt die Staffel als zwei senkrecht gestapelte Punkte', () => {
    const head = strengthHead('staffel');
    expect(head.marks).toHaveLength(2);
    expect(head.heightMm).toBeCloseTo(7, 6);
    for (const mark of head.marks) {
      expect(mark.cxMm).toBeCloseTo(16, 6);
      expect(mark.rMm).toBeCloseTo(1.5, 6);
    }
    expect(head.marks.map((m) => m.cyFromTopMm)).toEqual([1.5, 5.5]);
  });

  it('setzt die waagerechte Reihe 3 mm hoch mit Marken auf halber Höhe', () => {
    const head = strengthHead('gruppe');
    expect(head.heightMm).toBeCloseTo(3, 6);
    for (const mark of head.marks) expect(mark.cyFromTopMm).toBeCloseTo(1.5, 6);
  });

  it('erzeugt für jeden Stärkegrad mindestens eine Marke', () => {
    for (const id of ALL) expect(strengthHead(id).marks.length).toBeGreaterThan(0);
  });

  it('erzeugt für jeden Stärkegrad eine eigene Kopfzone', () => {
    const shapes = ALL.map((id) => JSON.stringify(strengthHead(id)));
    expect(new Set(shapes).size).toBe(ALL.length);
  });
});
```

- [ ] **Step 3: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm vitest run packages/catalog/src/strengths.test.ts`
Expected: FAIL — `Failed to resolve import "./strengths.js"`

- [ ] **Step 4: Stärkeangaben implementieren**

`packages/catalog/src/strengths.ts` — die Punktzahl je Grad aus Step 1 eintragen:

```ts
import type { StrengthId } from '@einsatzzeichen/schema';

const DOT_RADIUS_MM = 1.5;
/** Mittelachse der Grundfläche. */
const CENTER_X_MM = 16;
/** Abstand benachbarter Punkte einer Reihe. Aus C.1.2 / E.1.18: 11, 16, 21. */
const ROW_SPACING_MM = 5;
/** Abstand benachbarter Punkte eines Stapels. Aus C.1.1: cyFromTop 1,5 und 5,5. */
const STACK_SPACING_MM = 4;
const MAX_ROW_MARKS = 5;

/** Eine Marke, bezogen auf die Oberkante der Kopfzone. */
export interface HeadMark {
  cxMm: number;
  cyFromTopMm: number;
  rMm: number;
}

export interface HeadShape {
  marks: readonly HeadMark[];
  heightMm: number;
}

/**
 * Waagerechte Reihe, immer um die Mittelachse zentriert. Bei drei Punkten ergibt
 * das 11 / 16 / 21 — genau die Werte aus C.1.2 und E.1.18.
 */
function row(count: number): HeadShape {
  if (count < 1 || count > MAX_ROW_MARKS) {
    throw new Error(
      `Punktreihe mit ${count} Marken nicht definiert (1 bis ${MAX_ROW_MARKS} möglich). ` +
        `Anzahl an der Referenz vermessen, nicht raten.`,
    );
  }
  const firstX = CENTER_X_MM - ((count - 1) * ROW_SPACING_MM) / 2;
  return {
    marks: Array.from({ length: count }, (_, index) => ({
      cxMm: firstX + index * ROW_SPACING_MM,
      cyFromTopMm: DOT_RADIUS_MM,
      rMm: DOT_RADIUS_MM,
    })),
    heightMm: DOT_RADIUS_MM * 2,
  };
}

/** Senkrechter Stapel. Belegt an C.1.1 und 5.4.2: zwei Punkte, Gesamthöhe 7 mm. */
function stack(count: number): HeadShape {
  if (count < 2) throw new Error(`Punktstapel braucht mindestens zwei Marken, nicht ${count}.`);
  return {
    marks: Array.from({ length: count }, (_, index) => ({
      cxMm: CENTER_X_MM,
      cyFromTopMm: DOT_RADIUS_MM + index * STACK_SPACING_MM,
      rMm: DOT_RADIUS_MM,
    })),
    heightMm: DOT_RADIUS_MM * 2 + (count - 1) * STACK_SPACING_MM,
  };
}

/**
 * Zuordnung Stärkegrad → Anordnung. Die Punktanzahl stammt aus der Vermessung
 * in Step 1 und darf nicht aus der Bezeichnung geschlossen werden.
 */
export function strengthHead(id: StrengthId): HeadShape {
  switch (id) {
    case 'trupp':
      return row(1);
    case 'staffel':
      return stack(2);
    case 'gruppe':
      return row(3);
    case 'zug':
      return row(4);
  }
}
```

Trage bei `gruppe` und `zug` die in Step 1 vermessene Punktanzahl ein. Der Test „erzeugt für jeden Stärkegrad eine eigene Kopfzone" schlägt fehl, solange zwei Grade dieselbe Geometrie liefern — und `row()` wirft, statt stillschweigend zu kürzen, wenn eine Anzahl außerhalb des definierten Bereichs liegt.

- [ ] **Step 5: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm vitest run packages/catalog/src/strengths.test.ts`
Expected: PASS, 4 Tests

- [ ] **Step 6: Commit**

```bash
git add packages/catalog/src/strengths.ts packages/catalog/src/strengths.test.ts
git commit -m "feat: Stärkeangaben als Kopfzone nach Kapitel 5.4"
```

- [ ] **Step 7: Den fehlschlagenden Test für das Piktogramm schreiben**

`packages/catalog/src/capabilities.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { boundsOfMm } from '@einsatzzeichen/core';
import { capabilityPictogram } from './capabilities.js';

describe('Fähigkeitspiktogramme', () => {
  it('zeichnet Brandbekämpfung als Strahlrohr mit Sprühkegel', () => {
    const parts = capabilityPictogram('fire-fighting');
    expect(parts).toHaveLength(3);
    for (const part of parts) {
      expect(part.type).toBe('line');
      expect(part.role).toBe('pictogram');
      expect(part.style?.stroke).toBe('schwarz');
    }
  });

  it('bleibt innerhalb des Körpers der Taktischen Formation', () => {
    for (const part of capabilityPictogram('fire-fighting')) {
      const bounds = boundsOfMm(part);
      expect(bounds.minX).toBeGreaterThanOrEqual(1);
      expect(bounds.maxX).toBeLessThanOrEqual(31);
      expect(bounds.minY).toBeGreaterThanOrEqual(6);
      expect(bounds.maxY).toBeLessThanOrEqual(26);
    }
  });
});
```

- [ ] **Step 8: Piktogramm implementieren**

Dies ist eine **eigenständige Konstruktion**, keine Übernahme aus der Referenz. Sie greift die Bildidee von `4.3.1_Brandbekämpfung` auf — waagerechter Strahl mit Sprühkegel nach rechts — verwendet aber eigene, glatte Millimeterwerte.

`packages/catalog/src/capabilities.ts`:

```ts
import {
  DEFAULT_STROKE_WIDTH_MM,
  type CapabilityId,
  type Primitive,
  type Style,
} from '@einsatzzeichen/schema';

const STROKE: Style = { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM, fill: 'none' };

function line(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: STROKE };
}

/**
 * Eigenständige Konstruktion nach der Bildidee von 4.3.1 Brandbekämpfung.
 * Geometrie und Maße stammen nicht aus der Referenzdatei.
 */
const PICTOGRAMS: Record<CapabilityId, Primitive[]> = {
  'fire-fighting': [line(3, 16, 26, 16), line(16, 16, 26, 9), line(16, 16, 26, 23)],
};

export function capabilityPictogram(id: CapabilityId): Primitive[] {
  return PICTOGRAMS[id];
}
```

- [ ] **Step 9: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm vitest run packages/catalog/src/capabilities.test.ts && pnpm typecheck`
Expected: PASS, 2 Tests

- [ ] **Step 10: Verwaltungsstufen und Fahrzeugkategorien ergänzen**

Nach demselben Muster wie Stärke:

1. `pnpm cli audit:reference --filter "5.7" --print` — Verwaltungsstufen `5.7.1` bis `5.7.6`
2. `pnpm cli audit:reference --filter "5.1.1" --print` — Fahrzeugkategorien `5.1.1.1` bis `5.1.1.6`
3. Je Datei einen Testfall schreiben, der die Geometrie gegen `fingerprintFor(asset)` prüft
4. `admin-levels.ts` und `vehicle-categories.ts` implementieren
5. Nach jeder Gruppe committen

`packages/catalog/src/index.ts` erweitern:

```ts
export * from './fingerprint-index.js';
export * from './base-symbols.js';
export * from './organizations.js';
export * from './strengths.js';
export * from './admin-levels.js';
export * from './vehicle-categories.js';
export * from './capabilities.js';
```

- [ ] **Step 11: Commit**

```bash
git add packages/catalog
git commit -m "feat: Piktogramm Brandbekämpfung, Verwaltungsstufen und Fahrzeugkategorien"
```

---

### Task 13: Kompositionsmotor und Validierung

**Files:**
- Create: `packages/core/src/validate.ts`
- Create: `packages/core/src/compose.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/validate.test.ts`
- Test: `packages/catalog/src/recipes.test.ts`
- Create: `packages/catalog/src/recipes.ts`

**Interfaces:**
- Consumes: `SymbolSpec`, `Drawing` aus `@einsatzzeichen/schema`; `profileFor` aus Task 11; `BASE_SYMBOLS`, `organizationColor`, `strengthHead`, `capabilityPictogram` aus `@einsatzzeichen/catalog`
- Produces: `validateSpec(spec: SymbolSpec): ValidationIssue[]`, `ValidationIssue { rule: string; message: string }`, `compose(spec: SymbolSpec, catalog: CatalogPorts): Drawing`, `CatalogPorts { baseDrawing; organizationColor; strengthHead; capabilityPictogram }`

Der Kompositionsmotor liegt in `core`, die Daten in `catalog`. Damit `core` nicht von `catalog` abhängt (Zyklus), bekommt `compose` die Katalogzugriffe als `CatalogPorts` übergeben.

- [ ] **Step 1: Den fehlschlagenden Validierungstest schreiben**

`packages/core/src/validate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import { validateSpec } from './validate.js';

describe('validateSpec', () => {
  it('akzeptiert eine Löschstaffel', () => {
    const spec: SymbolSpec = {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'staffel',
      capabilities: ['fire-fighting'],
    };
    expect(validateSpec(spec)).toEqual([]);
  });

  it('lehnt eine Stärkeangabe an einer Gefahr ab', () => {
    const issues = validateSpec({ kind: 'hazard', strength: 'gruppe' });
    expect(issues.map((i) => i.rule)).toContain('strength-requires-unit');
  });

  it('lehnt eine Stärkeangabe an einem Gebäude ab', () => {
    const issues = validateSpec({ kind: 'building', strength: 'trupp' });
    expect(issues.map((i) => i.rule)).toContain('strength-requires-unit');
  });

  it('lehnt eine Fahrzeugkategorie an einer Formation ab', () => {
    const issues = validateSpec({ kind: 'formation', vehicleCategory: 'kettenfahrzeug' });
    expect(issues.map((i) => i.rule)).toContain('vehicle-category-requires-vehicle');
  });

  it('lehnt Stärke und Verwaltungsstufe gleichzeitig ab', () => {
    const issues = validateSpec({
      kind: 'formation',
      strength: 'gruppe',
      administrativeLevel: 'kreis',
    });
    expect(issues.map((i) => i.rule)).toContain('head-zone-conflict');
  });

  it('lehnt eine leere Bezeichnung ab', () => {
    const issues = validateSpec({ kind: 'formation', designation: '   ' });
    expect(issues.map((i) => i.rule)).toContain('designation-not-blank');
  });

  it('nennt in jeder Meldung Regel und Begründung', () => {
    for (const issue of validateSpec({ kind: 'hazard', strength: 'gruppe' })) {
      expect(issue.rule).not.toBe('');
      expect(issue.message.length).toBeGreaterThan(10);
    }
  });
});
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm vitest run packages/core/src/validate.test.ts`
Expected: FAIL — `Failed to resolve import "./validate.js"`

- [ ] **Step 3: Validierung implementieren**

`packages/core/src/validate.ts`:

```ts
import type { SymbolKind, SymbolSpec } from '@einsatzzeichen/schema';

export interface ValidationIssue {
  /** Stabile Regel-ID. Wird später in der Dokumentation verlinkt. */
  rule: string;
  message: string;
}

/** Grundzeichenarten, die eine taktische Einheit darstellen und eine Stärke tragen dürfen. */
const UNIT_KINDS = new Set<SymbolKind>(['formation', 'person']);

const VEHICLE_KINDS = new Set<SymbolKind>(['vehicle-land', 'vehicle-air', 'vehicle-water']);

export function validateSpec(spec: SymbolSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (spec.strength !== undefined && !UNIT_KINDS.has(spec.kind)) {
    issues.push({
      rule: 'strength-requires-unit',
      message:
        `Eine Stärkeangabe ist nur an taktischen Einheiten zulässig. ` +
        `"${spec.kind}" ist keine Einheit.`,
    });
  }

  if (spec.vehicleCategory !== undefined && !VEHICLE_KINDS.has(spec.kind)) {
    issues.push({
      rule: 'vehicle-category-requires-vehicle',
      message:
        `Eine Fahrzeugkategorie ist nur an Fahrzeugen zulässig. "${spec.kind}" ist kein Fahrzeug.`,
    });
  }

  if (spec.strength !== undefined && spec.administrativeLevel !== undefined) {
    issues.push({
      rule: 'head-zone-conflict',
      message:
        'Stärkeangabe und Verwaltungsstufe belegen beide die Kopfzone und schließen sich aus.',
    });
  }

  if (spec.designation !== undefined && spec.designation.trim() === '') {
    issues.push({
      rule: 'designation-not-blank',
      message: 'Eine Bezeichnung darf nicht leer oder nur aus Leerzeichen bestehen.',
    });
  }

  return issues;
}
```

- [ ] **Step 4: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm vitest run packages/core/src/validate.test.ts`
Expected: PASS, 7 Tests

- [ ] **Step 5: Kompositionsmotor implementieren**

`packages/core/src/compose.ts`:

```ts
import {
  DEFAULT_VIEWBOX_MM,
  type CapabilityId,
  type ColorToken,
  type Drawing,
  type OrganizationId,
  type Primitive,
  type StrengthId,
  type SymbolKind,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { placeHead, profileFor } from './layout/profiles.js';
import { validateSpec } from './validate.js';

/** Eine Kopfmarke, bezogen auf die Oberkante der Kopfzone. */
export interface HeadMark {
  cxMm: number;
  cyFromTopMm: number;
  rMm: number;
}

/** Kopfzone in relativer Form. Wohin sie absolut kommt, entscheidet das Layoutprofil. */
export interface HeadShape {
  marks: readonly HeadMark[];
  heightMm: number;
}

/** Zugriffe auf den Katalog. Als Ports übergeben, damit core nicht von catalog abhängt. */
export interface CatalogPorts {
  baseDrawing(kind: SymbolKind): Drawing;
  organizationColor(id: OrganizationId): ColorToken;
  strengthHead(id: StrengthId): HeadShape;
  capabilityPictogram(id: CapabilityId): Primitive[];
}

export class CompositionError extends Error {
  constructor(readonly issues: ReturnType<typeof validateSpec>) {
    super(
      `Unzulässige Kombination:\n${issues.map((i) => `  [${i.rule}] ${i.message}`).join('\n')}`,
    );
    this.name = 'CompositionError';
  }
}

export function compose(spec: SymbolSpec, catalog: CatalogPorts): Drawing {
  const issues = validateSpec(spec);
  if (issues.length > 0) throw new CompositionError(issues);

  const base = catalog.baseDrawing(spec.kind);
  const body = base.children.find((child) => child.role === 'body');
  if (!body) throw new Error(`Grundzeichen "${spec.kind}" hat kein body-Primitiv.`);

  const profile = profileFor(spec.kind);
  const headShape = spec.strength !== undefined ? catalog.strengthHead(spec.strength) : null;

  // Dieselbe Kopfzone sitzt je nach Körperform unterschiedlich hoch — deshalb
  // rechnet erst placeHead die relativen Marken in absolute Koordinaten um.
  const headBox = headShape ? placeHead(profile, headShape.heightMm) : null;
  const headPrimitives: Primitive[] =
    headShape && headBox
      ? headShape.marks.map((mark) => ({
          type: 'circle',
          role: 'head',
          cx: mark.cxMm,
          cy: headBox.topMm + mark.cyFromTopMm,
          r: mark.rMm,
          style: { fill: 'schwarz' },
        }))
      : [];

  const placedBody = profile.place(body, headBox?.bottomMm ?? null);

  const filled: Primitive =
    spec.organization !== undefined
      ? {
          ...placedBody,
          style: { ...placedBody.style, fill: catalog.organizationColor(spec.organization) },
        }
      : placedBody;

  const pictograms = (spec.capabilities ?? []).flatMap((id) => catalog.capabilityPictogram(id));

  return {
    viewBox: DEFAULT_VIEWBOX_MM,
    children: [...headPrimitives, filled, ...pictograms],
    ...(base.title !== undefined ? { title: base.title } : {}),
  };
}
```

`packages/core/src/index.ts` erweitern:

```ts
export * from './validate.js';
export * from './compose.js';
```

- [ ] **Step 6: Den fehlschlagenden Rezepttest schreiben**

`packages/catalog/src/recipes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { boundsOfMm, CompositionError } from '@einsatzzeichen/core';
import { RECIPES, composeFromCatalog } from './recipes.js';

describe('Kompositionsrezepte', () => {
  it('erzeugt die Löschstaffel mit Körper bei 9 mm', () => {
    const drawing = composeFromCatalog(RECIPES['C.1.1'].spec);
    const body = drawing.children.find((c) => c.role === 'body');
    expect(body).toBeDefined();
    expect(boundsOfMm(body!).minY).toBeCloseTo(9, 6);
    expect(body?.style?.fill).toBe('rot');
  });

  it('erzeugt die Löschgruppe mit Körper bei 6 mm', () => {
    const drawing = composeFromCatalog(RECIPES['C.1.2'].spec);
    const body = drawing.children.find((c) => c.role === 'body');
    expect(boundsOfMm(body!).minY).toBeCloseTo(6, 6);
  });

  it('unterscheidet Löschstaffel und Löschgruppe nur in der Stärke', () => {
    const { strength: _a, ...staffel } = RECIPES['C.1.1'].spec;
    const { strength: _b, ...gruppe } = RECIPES['C.1.2'].spec;
    expect(staffel).toEqual(gruppe);
  });

  it('erzeugt den Zugführer mit Spitze bei 5 mm und Unterkante bei 31 mm', () => {
    const drawing = composeFromCatalog(RECIPES['D.3.7'].spec);
    const body = drawing.children.find((c) => c.role === 'body');
    const bounds = boundsOfMm(body!);
    expect(bounds.minY).toBeCloseTo(5, 3);
    expect(bounds.maxY).toBeCloseTo(31, 3);
  });

  it('setzt die Stärkepunkte als eigene Primitive mit der Rolle head', () => {
    const drawing = composeFromCatalog(RECIPES['C.1.1'].spec);
    expect(drawing.children.filter((c) => c.role === 'head')).toHaveLength(2);
  });

  it('lehnt eine unzulässige Kombination mit erklärendem Fehler ab', () => {
    expect(() => composeFromCatalog({ kind: 'hazard', strength: 'gruppe' })).toThrow(
      CompositionError,
    );
  });
});
```

- [ ] **Step 7: Rezepte implementieren**

`packages/catalog/src/recipes.ts`:

```ts
import { compose, type CatalogPorts } from '@einsatzzeichen/core';
import type { Drawing, SymbolSpec } from '@einsatzzeichen/schema';
import { baseDrawing } from './base-symbols.js';
import { capabilityPictogram } from './capabilities.js';
import { organizationColor } from './organizations.js';
import { strengthHead } from './strengths.js';

const PORTS: CatalogPorts = {
  baseDrawing,
  organizationColor,
  strengthHead,
  capabilityPictogram,
};

export function composeFromCatalog(spec: SymbolSpec): Drawing {
  return compose(spec, PORTS);
}

export interface Recipe {
  title: string;
  referenceAsset: string;
  spec: SymbolSpec;
}

/** Zusammengesetzte Zeichen, die den Kompositionsmotor gegen die Referenz belegen. */
export const RECIPES = {
  'C.1.1': {
    title: 'Löschstaffel',
    referenceAsset: 'C.1.1_Löschstaffel.svg',
    spec: {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'staffel',
      capabilities: ['fire-fighting'],
    },
  },
  'C.1.2': {
    title: 'Löschgruppe',
    referenceAsset: 'C.1.2_Löschgruppe.svg',
    spec: {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'gruppe',
      capabilities: ['fire-fighting'],
    },
  },
  'D.3.7': {
    title: 'Zugführer der Feuerwehr',
    referenceAsset: 'D.3.7_Zugführer der Feuerwehr.svg',
    spec: {
      kind: 'person',
      organization: 'feuerwehr',
      strength: 'zug',
    },
  },
} as const satisfies Record<string, Recipe>;
```

`packages/catalog/src/index.ts` um `export * from './recipes.js';` erweitern.

- [ ] **Step 8: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm test && pnpm typecheck`
Expected: alle Tests grün

Rechenweg zur Kontrolle, falls ein Rezept danebenliegt:

| Rezept | Stärke | headHeight | headTop / headBottom | bodyAnchor |
|---|---|---|---|---|
| `C.1.2` | `gruppe` → Reihe | 3 | 2 / 5 | max(6, 6) = **6** |
| `C.1.1` | `staffel` → Stapel(2) | 7 | 1 / 8 | max(6, 9) = **9** |
| `D.3.7` | `zug` → Reihe | 3 | 1 / 4 | max(1, 5) = **5** |

Weicht ein Wert ab, liegt der Fehler in der **Punktanzahl** aus Task 12 Step 1, nicht im Rezept: die Anordnung bestimmt `headHeight`, und die ist ein Faktum der Referenz. Eine Reihe ist immer 3 mm hoch, ein Stapel aus `n` Punkten `3 + (n − 1) · 4` mm.

- [ ] **Step 9: Commit**

```bash
git add packages/core packages/catalog
git commit -m "feat: Kompositionsmotor, Regelvalidierung und drei belegte Rezepte"
```

---

### Task 14: Coverage-Manifest, Export und CI

**Files:**
- Create: `packages/catalog/src/coverage-manifest.ts`
- Create: `packages/cli/src/commands/coverage.ts`
- Create: `packages/cli/src/commands/export.ts`
- Modify: `packages/cli/src/index.ts`
- Create: `.github/workflows/ci.yml`
- Test: `packages/catalog/src/coverage-manifest.test.ts`

**Interfaces:**
- Consumes: `CoverageManifest`, `CoverageEntry`, `entryKey` aus `@einsatzzeichen/schema`; `BASE_SYMBOLS`, `RECIPES` aus `@einsatzzeichen/catalog`
- Produces: `COVERAGE_MANIFEST: CoverageManifest`, `checkCoverage(): { missing: string[]; duplicates: string[] }`

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

`packages/catalog/src/coverage-manifest.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { entryKey } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST, checkCoverage } from './coverage-manifest.js';

describe('Coverage-Manifest', () => {
  it('ist über Quellen-ID und Variante eindeutig keyfähig', () => {
    const keys = COVERAGE_MANIFEST.entries.map((e) => entryKey(e.sourceId, e.variant));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('enthält beide Eintragsarten', () => {
    const kinds = new Set(COVERAGE_MANIFEST.entries.map((e) => e.coverage));
    expect(kinds).toContain('catalog-entry');
    expect(kinds).toContain('composition-recipe');
  });

  it('trägt für jeden Eintrag eine Referenzdatei und einen Reviewstatus', () => {
    for (const entry of COVERAGE_MANIFEST.entries) {
      expect(entry.referenceAsset).toMatch(/\.svg$/);
      expect(['pending', 'approved', 'deviation']).toContain(entry.review.status);
    }
  });

  it('meldet keine fehlenden und keine doppelten Einträge', () => {
    expect(checkCoverage()).toEqual({ missing: [], duplicates: [] });
  });

  it('beansprucht nur den Umfang dieses Slice', () => {
    expect(COVERAGE_MANIFEST.scope).toEqual([
      '1', '2', '3', '4.3.1', '5.1.1', '5.4', '5.7', 'C.1.1', 'C.1.2', 'D.3.7',
    ]);
  });
});
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm vitest run packages/catalog/src/coverage-manifest.test.ts`
Expected: FAIL — `Failed to resolve import "./coverage-manifest.js"`

- [ ] **Step 3: Manifest implementieren**

`packages/catalog/src/coverage-manifest.ts`:

```ts
import { entryKey, type CoverageEntry, type CoverageManifest } from '@einsatzzeichen/schema';
import { BASE_SYMBOLS } from './base-symbols.js';
import { RECIPES } from './recipes.js';

const REVIEW = { status: 'pending' } as const;

const catalogEntries: CoverageEntry[] = Object.values(BASE_SYMBOLS).map((entry) => {
  const ref = entry.depictions[0]?.sourceRefs[0];
  return {
    sourceId: `bbk-babz-2025:${ref?.section ?? ''}`,
    variant: 'primary',
    title: entry.title,
    implementation: entry.id,
    referenceAsset: ref?.asset ?? '',
    coverage: 'catalog-entry',
    fingerprintTest: true,
    snapshotTest: true,
    review: REVIEW,
  };
});

const recipeEntries: CoverageEntry[] = Object.entries(RECIPES).map(([section, recipe]) => ({
  sourceId: `bbk-babz-2025:${section}`,
  variant: 'primary',
  title: recipe.title,
  implementation: `recipe.${section}`,
  referenceAsset: recipe.referenceAsset,
  coverage: 'composition-recipe',
  fingerprintTest: false,
  snapshotTest: true,
  review: REVIEW,
}));

export const COVERAGE_MANIFEST: CoverageManifest = {
  baseline: 'bbk-babz-2025',
  scope: ['1', '2', '3', '4.3.1', '5.1.1', '5.4', '5.7', 'C.1.1', 'C.1.2', 'D.3.7'],
  entries: [...catalogEntries, ...recipeEntries],
};

/**
 * Prüft, ob jeder Manifest-Eintrag eine Referenzdatei nennt und ob die Schlüssel
 * eindeutig sind. Wird als CI-Gate ausgeführt.
 */
export function checkCoverage(): { missing: string[]; duplicates: string[] } {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const missing: string[] = [];

  for (const entry of COVERAGE_MANIFEST.entries) {
    const key = entryKey(entry.sourceId, entry.variant);
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
    if (entry.referenceAsset === '' || entry.implementation === '') missing.push(key);
  }

  return { missing, duplicates };
}
```

`packages/catalog/src/index.ts` um `export * from './coverage-manifest.js';` erweitern.

- [ ] **Step 4: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm vitest run packages/catalog/src/coverage-manifest.test.ts`
Expected: PASS, 5 Tests

- [ ] **Step 5: CLI-Kommandos ergänzen**

`packages/cli/src/commands/coverage.ts`:

```ts
import { COVERAGE_MANIFEST, checkCoverage } from '@einsatzzeichen/catalog';

export function coverage(): void {
  const { missing, duplicates } = checkCoverage();

  console.log(`Baseline: ${COVERAGE_MANIFEST.baseline}`);
  console.log(`Umfang:   ${COVERAGE_MANIFEST.scope.join(', ')}`);
  console.log(`Einträge: ${COVERAGE_MANIFEST.entries.length}`);

  for (const key of duplicates) console.error(`Doppelter Schlüssel: ${key}`);
  for (const key of missing) console.error(`Unvollständiger Eintrag: ${key}`);

  if (duplicates.length > 0 || missing.length > 0) process.exit(1);
  console.log('Coverage-Gate bestanden.');
}
```

`packages/cli/src/commands/export.ts`:

```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RECIPES, baseDrawing, composeFromCatalog } from '@einsatzzeichen/catalog';
import { renderSvg } from '@einsatzzeichen/core';

export function exportSvg(outDir: string, size: number): void {
  mkdirSync(outDir, { recursive: true });
  let count = 0;

  for (const kind of ['formation', 'person', 'post', 'building', 'container'] as const) {
    writeFileSync(join(outDir, `base.${kind}.svg`), renderSvg(baseDrawing(kind), { size }), 'utf8');
    count += 1;
  }

  for (const [section, recipe] of Object.entries(RECIPES)) {
    const svg = renderSvg(composeFromCatalog(recipe.spec), { size });
    writeFileSync(join(outDir, `${section}.svg`), svg, 'utf8');
    count += 1;
  }

  console.log(`${count} Zeichen nach ${outDir} exportiert.`);
}
```

`packages/cli/src/index.ts` erweitern — den `switch` um zwei Zweige ergänzen:

```ts
  case 'coverage':
    coverage();
    break;
  case 'export':
    exportSvg(flag('out') ?? 'out', Number(flag('size') ?? 64));
    break;
```

und die Importe oben ergänzen:

```ts
import { coverage } from './commands/coverage.js';
import { exportSvg } from './commands/export.js';
```

Die Hilfezeile anpassen:

```ts
    console.error('Verfügbar: audit:reference [--filter <präfix>] [--print] | coverage | export [--out <pfad>] [--size <px>]');
```

- [ ] **Step 6: CLI manuell prüfen**

Run: `pnpm cli coverage`
Expected: `Coverage-Gate bestanden.`, Exit 0

Run: `pnpm cli -- export --out /tmp/einsatzzeichen --size 128 && ls /tmp/einsatzzeichen`
Expected: acht SVG-Dateien

Das `--` trennt die Flags des Skripts von denen von pnpm. Ohne es schluckt pnpm `--out` und `--size`, und der Export landet im Standardverzeichnis `out`.

- [ ] **Step 7: Snapshot-Gate für die eigene SVG-Ausgabe**

Die Spec verlangt neben dem Fingerprint- auch ein Snapshot-Gate: unsere eigene Ausgabe gegen eingecheckte Snapshots. Das fängt unbeabsichtigte Renderer-Änderungen, die der Fingerprint nicht sieht (Attributreihenfolge, A11y-Metadaten, Piktogramme).

`packages/catalog/src/snapshots.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderSvg } from '@einsatzzeichen/core';
import { baseDrawing } from './base-symbols.js';
import { RECIPES, composeFromCatalog } from './recipes.js';

describe('SVG-Snapshots', () => {
  it.each(['formation', 'person', 'post', 'building', 'container'] as const)(
    'rendert das Grundzeichen %s unverändert',
    async (kind) => {
      await expect(renderSvg(baseDrawing(kind), { size: 64 })).toMatchFileSnapshot(
        `./__snapshots__/base.${kind}.svg`,
      );
    },
  );

  it.each(Object.keys(RECIPES) as Array<keyof typeof RECIPES>)(
    'rendert das Rezept %s unverändert',
    async (section) => {
      const svg = renderSvg(composeFromCatalog(RECIPES[section].spec), { size: 64 });
      await expect(svg).toMatchFileSnapshot(`./__snapshots__/${section}.svg`);
    },
  );
});
```

Run: `pnpm vitest run packages/catalog/src/snapshots.test.ts`
Expected: beim ersten Lauf werden acht Snapshots unter `packages/catalog/src/__snapshots__/` angelegt, alle Tests bestehen.

Sieh dir die erzeugten Dateien an, bevor du sie eincheckst — ein Snapshot ist nur so viel wert wie die Prüfung beim Anlegen. Insbesondere `C.1.1.svg` und `C.1.2.svg` müssen sich ausschließlich in der Kopfzone und der Körperposition unterscheiden.

Run: `pnpm vitest run packages/catalog/src/snapshots.test.ts`
Expected: zweiter Lauf besteht ohne Neuanlage

- [ ] **Step 8: CI-Workflow schreiben**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 11

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      # Der BABZ-Referenzbestand liegt in CI nicht vor. Die Fingerprint-Kennzahlen
      # sind eingecheckt; ein Referenzvergleich läuft ausschließlich lokal.
      - name: Referenzbestand darf nicht im Repository liegen
        run: |
          if [ -d taktische-zeichen ]; then
            echo "taktische-zeichen/ ist eingecheckt — das darf nicht passieren." >&2
            exit 1
          fi

      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm cli coverage
```

- [ ] **Step 9: Gesamtlauf und Nachweis**

Run: `pnpm typecheck && pnpm test && pnpm cli coverage`
Expected: alles grün

Run: `git status --porcelain | grep taktische-zeichen; echo "exit=$?"`
Expected: `exit=1` (kein Treffer — der Referenzbestand taucht nicht auf)

- [ ] **Step 10: Commit**

```bash
git add packages .github
git commit -m "feat: Coverage-Gate, Snapshot-Gate, SVG-Export und CI ohne Referenzbestand"
```

---

## Abschluss

Nach Task 14 sind die sieben Erfolgskriterien aus Abschnitt 12 der Spec erfüllt:

| # | Kriterium | Nachweis |
|---|---|---|
| 1 | Grundelemente Kapitel 1–3 mit Fingerprint-Gate | Task 9, Task 10 |
| 2 | Drei Rezepte rein aus `SymbolSpec`, beide Layoutprofile | Task 13 |
| 3 | Mindestens fünf unzulässige Kombinationen abgelehnt | Task 13, `validate.test.ts` |
| 4 | Manifest über `(sourceId, variant)` eindeutig | Task 14 |
| 5 | CI grün ohne Referenzkorpus | Task 14, `.github/workflows/ci.yml` |
| 6 | `core` ohne Laufzeitabhängigkeiten, SVG und Canvas aus einer IR | Task 4, Task 5 |
| 7 | Kein Katalogeintrag ohne Quellen- und Reviewstatus | Task 9, Task 14 |

Alle vier CI-Gates der Spec sind abgedeckt: Regeltests (Task 13), Fingerprint (Task 8/9), Snapshot (Task 14 Step 7), Coverage (Task 14).

**Offen und bewusst nicht Teil dieses Slice:**

- Die 31 `_Alternative`- und `_2`-Varianten haben im Schema einen Slot (Task 3), aber im Katalog dieses Slice keinen Inhalt — im Umfang Kapitel 1–3 kommt keine Variante vor. Der erste echte Varianteneintrag entsteht beim Katalogausbau in Kapitel 4.
- Das Coverage-Manifest bildet in diesem Slice nur die **Referenzabdeckung** ab. Die beiden anderen Achsen aus Abschnitt 7 der Spec — Regelabdeckung und generative Reichweite — brauchen einen Regelkatalog beziehungsweise eine Aufzählung des Kombinationsraums. Beides entsteht erst mit dem Katalogausbau (Teilprojekt D) und bekommt dann eigene Manifestfelder.
- Der Kreiskörper mit Kopfzone (`circle-body`-Profil) wirft bewusst, statt zu raten. In der Referenz ist diese Kombination nicht belegt; sie wird vor der Umsetzung vermessen.
