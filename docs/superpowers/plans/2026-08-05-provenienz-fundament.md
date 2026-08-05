# Provenienz-Fundament (Slice 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kein ausgelieferter Katalogeintrag und keine referenzierte Quelle ohne vollständige, maschinenlesbare Provenienz — Nutzungsgrundlage, Profilzugehörigkeit, Datenversion und zwei getrennte Reviewrollen.

**Architecture:** Typen wandern nach `packages/schema` (`review.ts`, `sources.ts`, `profile.ts`), Daten nach `packages/catalog` (`sources.ts`, `profiles.ts`, `elements.ts`). Die Vollständigkeit der Register wird über `satisfies Record<Id, Record>` typerzwungen, ohne dass `schema` von `catalog` abhängt. Das bestehende Coverage-Gate (`checkCoverage`) behält seine drei Rückgabefelder und bekommt ein viertes für die neun neuen Prüfungen; `releaseBlockers()` beantwortet das 1.0-Gate der Vision als Testausgabe, nicht als CI-Abbruch.

**Tech Stack:** TypeScript 5.9 (strict, `verbatimModuleSyntax`, NodeNext), pnpm-Workspace mit vier Paketen, Vitest 3.2, keine Laufzeitabhängigkeiten in `schema` und `core`.

**Spec:** `docs/superpowers/specs/2026-08-05-provenienz-fundament-design.md`

## Global Constraints

- **Paketrichtung `cli → catalog → core → schema`** bleibt zyklenfrei. `schema` darf **nie** von `catalog` importieren. `core` wird von diesem Slice **nicht** angefasst.
- **`schema` und `core` haben null Laufzeitabhängigkeiten.** Keine Semver-Bibliothek, keine Validierungsbibliothek.
- **`verbatimModuleSyntax: true`** — jeder reine Typimport muss `import type` verwenden, sonst schlägt `pnpm typecheck` fehl. Das ist auch die Bedingung dafür, dass der Typzyklus zwischen `schema/src/provenance.ts` und `schema/src/profile.ts` zur Laufzeit nicht existiert.
- **`noUnusedLocals` und `noUnusedParameters` sind aktiv.** Ein eingeführter, aber nirgends verwendeter Import ist ein Compilefehler.
- **Alle Längen sind Millimeter** (README, „Millimeter-Regel"). Dieser Slice führt keine Geometrie ein.
- **Der Referenzbestand `taktische-zeichen/` ist nicht eingecheckt.** CI läuft ohne ihn. Kein Test dieses Slice darf eine SVG-Datei lesen; Dateinamen sind reine Zeichenketten, Kennzahlen kommen aus `packages/catalog/src/fingerprints.json`.
- **Reviewer-Kürzel:** `'rv'`. **Reviewdatum aller in diesem Slice gesetzten Reviews:** `'2026-08-05'`.
- **Datenversion des Kerns:** `'0.1.0'` — als `CoverageManifest.coreVersion`, als `PROFILES.bund.version` und als `PROFILES.bund.verifiedAgainstCore`, alle drei identisch.
- **Verifikation nach jeder Task:** `pnpm typecheck`, `pnpm test`, `pnpm cli coverage` müssen grün sein. Jede Task endet mit einem Commit auf einem grünen Stand.
- **Sprache:** Code-Kommentare, Testnamen und Fehlermeldungen auf Deutsch, mit korrekten Umlauten. Bezeichner bleiben englisch.

## Entscheidungen dieses Plans, die die Spec offen lässt

Drei Punkte legt die Spec nicht fest. Der Plan entscheidet sie hier einmal, damit die Tasks nicht auseinanderlaufen:

1. **Reviewstatus der elf Quellen und des Profils `bund`.** Das Kriterium für `technical: approved` aus Spec-Abschnitt 4 (Fingerprint- und Snapshot-Gate grün) ist auf eine Quelle nicht anwendbar. Für Quellen tritt an seine Stelle: *bibliografische Angaben und Bezugsadresse sind gegen die Quelle geprüft*. Das steht als `note` an jedem `technical`-Review, damit die Rollenanpassung dokumentiert und nicht stillschweigend ist. `domain` bleibt bei allen Quellen und beim Profil `pending`.
2. **`fingerprintTest` und `snapshotTest` der zwölf Elementeinträge sind beide `false`.** Für Kopfmarken begründet die Spec das (Abschnitt 9: das Fingerprint-Gate vergleicht ausschließlich `role: 'body'`). Snapshots existieren nur für Grundzeichen und Rezepte (`packages/catalog/src/snapshots.test.ts`) — für Elemente gibt es keinen. Folge: die zwölf Elementeinträge erscheinen in `releaseBlockers().withoutTestEvidence`. Das ist die ehrliche Angabe, nicht ein Versäumnis.
3. **Rückgabeform von `checkCoverage()`.** Die drei bestehenden Felder `missing`, `duplicates`, `invalidPrimary` bleiben unverändert; die neun neuen Prüfungen liefern eine gemeinsame Liste `violations: readonly CoverageViolation[]`, dazu die Zahl `openDomainReviews`. Neun einzelne Arrays hätten das CLI zu neun fast gleichen Ausgabeschleifen gezwungen.

---

## File Structure

| Datei | Verantwortung | Status |
|---|---|---|
| `packages/schema/src/review.ts` | `ReviewRole`, `ReviewStatus`, `Review`, `ReviewSet` — die eine Reviewform für Eintrag, Manifest, Quelle und Profil | neu |
| `packages/schema/src/sources.ts` | `SourceKind`, `Acquisition`, `GeometryUse`, `LicenceStatus`, `Licence`, `SourceRecord` | neu |
| `packages/schema/src/profile.ts` | `ProfileId`, `ProfileRecord`, `isDataVersion` | neu |
| `packages/schema/src/provenance.ts` | `SourceId` (elf Literale), `SourceStatus` (drei Werte), `CatalogEntry.profile` als Pflichtfeld | erweitert |
| `packages/schema/src/coverage.ts` | `CoverageKind` (drei Werte), `CoverageEntry.profile`, `CoverageManifest.coreVersion`, `review: ReviewSet` | erweitert |
| `packages/schema/src/index.ts` | Re-Exporte der drei neuen Module | erweitert |
| `packages/catalog/src/sources.ts` | `SOURCE_REGISTRY` — die elf Quellen, `isRegisteredSource` | neu |
| `packages/catalog/src/profiles.ts` | `PROFILES`, `profileFor` | neu |
| `packages/catalog/src/elements.ts` | `ELEMENTS`, `resolveElement`, `ElementDescriptor` | neu |
| `packages/catalog/src/base-symbols.ts` | `profile: 'bund'` an jedem Katalogeintrag | erweitert |
| `packages/catalog/src/coverage-manifest.ts` | Migration, zwölf Elementeinträge, neun neue Prüfungen, `releaseBlockers` | erweitert |
| `packages/catalog/src/index.ts` | Re-Exporte der drei neuen Module | erweitert |
| `packages/cli/src/commands/coverage.ts` | Ausgabe der neuen Prüfungen, der offenen Reviews und der Versionen | erweitert |

Testdateien liegen jeweils neben ihrem Modul (`*.test.ts`), wie im Repository üblich.

---

## Task 1: Reviewmodell mit zwei Pflichtrollen

**Files:**
- Create: `packages/schema/src/review.ts`
- Create: `packages/schema/src/review.test.ts`
- Modify: `packages/schema/src/coverage.ts:5-13` (Review-Typen entfernen), `:25` (`review: ReviewSet`)
- Modify: `packages/schema/src/index.ts`
- Modify: `packages/catalog/src/coverage-manifest.ts:10` (`REVIEW`-Konstante)
- Modify: `packages/catalog/src/coverage-manifest.test.ts:30-35`

**Interfaces:**
- Consumes: nichts aus früheren Tasks.
- Produces: `type ReviewRole = 'technical' | 'domain'`; `type ReviewStatus = 'pending' | 'approved' | 'deviation'`; `interface Review { status: ReviewStatus; reviewer?: string; date?: string; note?: string }`; `interface ReviewSet { technical: Review; domain: Review }`; `function unattributedRoles(review: ReviewSet): ReviewRole[]`. `CoverageEntry.review` hat ab hier den Typ `ReviewSet`.

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

Datei `packages/schema/src/review.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { unattributedRoles, type ReviewSet } from './review.js';

const approved = { status: 'approved', reviewer: 'rv', date: '2026-08-05' } as const;

describe('Reviewmodell', () => {
  it('meldet keine Rolle, wenn beide Rollen zurechenbar sind', () => {
    const set: ReviewSet = { technical: approved, domain: { status: 'pending' } };
    expect(unattributedRoles(set)).toEqual([]);
  });

  it('meldet die Rolle, deren approved keinen Reviewer trägt', () => {
    const set: ReviewSet = {
      technical: { status: 'approved', date: '2026-08-05' },
      domain: { status: 'pending' },
    };
    expect(unattributedRoles(set)).toEqual(['technical']);
  });

  it('meldet die Rolle, deren approved kein Datum trägt', () => {
    const set: ReviewSet = { technical: approved, domain: { status: 'approved', reviewer: 'rv' } };
    expect(unattributedRoles(set)).toEqual(['domain']);
  });

  it('meldet beide Rollen, wenn beide approved ohne Zurechnung sind', () => {
    const set: ReviewSet = { technical: { status: 'approved' }, domain: { status: 'approved' } };
    expect(unattributedRoles(set)).toEqual(['technical', 'domain']);
  });

  it('verlangt Zurechnung nur bei approved, nicht bei deviation oder pending', () => {
    const set: ReviewSet = { technical: { status: 'deviation' }, domain: { status: 'pending' } };
    expect(unattributedRoles(set)).toEqual([]);
  });
});
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag prüfen**

Run: `pnpm vitest run packages/schema/src/review.test.ts`
Expected: FAIL — `Failed to resolve import "./review.js"`

- [ ] **Step 3: `packages/schema/src/review.ts` anlegen**

```ts
/**
 * Die beiden Reviewrollen der Vision („mindestens ein technisches und ein fachliches Review").
 * Wird in der Gate-Ausgabe verwendet: die Fehlermeldung nennt die Rolle.
 */
export type ReviewRole = 'technical' | 'domain';

export type ReviewStatus = 'pending' | 'approved' | 'deviation';

export interface Review {
  status: ReviewStatus;
  reviewer?: string;
  /** ISO-Datum, z. B. "2026-08-05". */
  date?: string;
  note?: string;
}

/**
 * Beide Rollen sind Pflicht — eine fehlende Rolle ist kein zulässiger Zustand. Dieselbe Struktur
 * trägt jeder Katalogeintrag, jeder Manifest-Eintrag, jede Quelle und jedes Profil.
 */
export interface ReviewSet {
  technical: Review;
  domain: Review;
}

const ROLES: readonly ReviewRole[] = ['technical', 'domain'];

/**
 * Rollen, deren Status `approved` ist, ohne Reviewer **und** Datum zu nennen. Ein Status ohne
 * Zurechenbarkeit ist wertlos; der Typ kann das nicht erzwingen, das Coverage-Gate schon.
 */
export function unattributedRoles(review: ReviewSet): ReviewRole[] {
  return ROLES.filter((role) => {
    const entry = review[role];
    return entry.status === 'approved' && (entry.reviewer === undefined || entry.date === undefined);
  });
}
```

- [ ] **Step 4: Test laufen lassen und Erfolg prüfen**

Run: `pnpm vitest run packages/schema/src/review.test.ts`
Expected: PASS, 5 Tests

- [ ] **Step 5: `coverage.ts` auf `ReviewSet` umstellen**

In `packages/schema/src/coverage.ts` die Zeilen 5–13 (`ReviewStatus` und `Review`) **ersetzen** durch einen Import, und `CoverageEntry.review` umtypisieren. Die Datei beginnt danach so:

```ts
import type { DepictionVariant } from './provenance.js';
import type { ReviewSet } from './review.js';

export type CoverageKind = 'catalog-entry' | 'composition-recipe';

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
  review: ReviewSet;
}
```

`CoverageManifest` darunter bleibt in dieser Task unverändert.

- [ ] **Step 6: Das neue Modul exportieren**

In `packages/schema/src/index.ts` nach der Zeile `export * from './provenance.js';` einfügen:

```ts
export * from './review.js';
```

- [ ] **Step 7: Die elf Manifest-Einträge migrieren**

In `packages/catalog/src/coverage-manifest.ts` die Zeile 10 ersetzen:

```ts
/**
 * Migration nach Slice 2: `technical` ist für alle elf Einträge `approved`, weil das Kriterium
 * aus der Spec (Fingerprint- und Snapshot-Gate für diesen Eintrag grün) erfüllt ist —
 * Slice-1-Erfolgskriterien 1 und 2. `domain` bleibt offen: eine fachliche Prüfung durch eine
 * Person mit einsatztaktischer Fachkunde hat nicht stattgefunden, und das Modell verdeckt das nicht.
 */
const REVIEW: ReviewSet = {
  technical: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
  domain: { status: 'pending' },
};
```

Den Import in derselben Datei um `type ReviewSet` erweitern:

```ts
import {
  entryKey,
  type CatalogEntry,
  type CoverageEntry,
  type CoverageManifest,
  type ReviewSet,
} from '@einsatzzeichen/schema';
```

- [ ] **Step 8: Den bestehenden Manifest-Test auf beide Rollen umstellen**

In `packages/catalog/src/coverage-manifest.test.ts` den Test in Zeile 30–35 ersetzen:

```ts
  it('trägt für jeden Eintrag eine Referenzdatei und beide Reviewrollen', () => {
    for (const entry of COVERAGE_MANIFEST.entries) {
      expect(entry.referenceAsset).toMatch(/\.svg$/);
      expect(entry.review.technical.status).toBe('approved');
      expect(entry.review.technical.reviewer).toBe('rv');
      expect(entry.review.domain.status).toBe('pending');
    }
  });
```

- [ ] **Step 9: Vollständig verifizieren**

Run: `pnpm typecheck && pnpm test && pnpm cli coverage`
Expected: typecheck ohne Ausgabe, alle Tests grün, `Coverage-Gate bestanden.`

- [ ] **Step 10: Commit**

```bash
git add packages/schema/src/review.ts packages/schema/src/review.test.ts \
  packages/schema/src/coverage.ts packages/schema/src/index.ts \
  packages/catalog/src/coverage-manifest.ts packages/catalog/src/coverage-manifest.test.ts
git commit -m "feat(schema): Reviewset mit zwei Pflichtrollen, elf Einträge migriert"
```

---

## Task 2: Quellenregister mit elf Quellen

**Files:**
- Create: `packages/schema/src/sources.ts`
- Create: `packages/catalog/src/sources.ts`
- Create: `packages/catalog/src/sources.test.ts`
- Modify: `packages/schema/src/provenance.ts:4` (`SourceId`), `:6-12` (`SourceStatus`)
- Modify: `packages/schema/src/index.ts`
- Modify: `packages/catalog/src/index.ts`

**Interfaces:**
- Consumes: `ReviewSet` aus Task 1.
- Produces: `type SourceId` mit elf Literalen; `interface SourceRecord`; `const SOURCE_REGISTRY: Record<SourceId, SourceRecord>`; `function isRegisteredSource(id: string): id is SourceId`.

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

Datei `packages/catalog/src/sources.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SOURCE_REGISTRY, isRegisteredSource } from './sources.js';

describe('Quellenregister', () => {
  it('führt elf Quellen', () => {
    expect(Object.keys(SOURCE_REGISTRY)).toHaveLength(11);
  });

  it('trägt an jeder Quelle den eigenen Schlüssel als id', () => {
    for (const [key, record] of Object.entries(SOURCE_REGISTRY)) {
      expect(record.id).toBe(key);
    }
  });

  it('nennt an jeder Quelle Titel, Herausgeber, Geltungsbereich und eine Nutzungsgrundlage', () => {
    for (const record of Object.values(SOURCE_REGISTRY)) {
      expect(record.title.length).toBeGreaterThan(0);
      expect(record.publisher.length).toBeGreaterThan(0);
      expect(record.scope.length).toBeGreaterThan(0);
      expect(record.licence.basis.length).toBeGreaterThan(0);
    }
  });

  it('nennt für jede beschaffbare Quelle eine URL und für keine nicht beschaffte eine lokale Ablage', () => {
    for (const record of Object.values(SOURCE_REGISTRY)) {
      if (record.acquisition === 'public-url') expect(record.url).toMatch(/^https:\/\//);
      if (record.acquisition === 'not-acquired') expect(record.geometryUse).toEqual(['none']);
    }
  });

  it('führt babz-svg-2025 als einzige Quelle mit abgeleiteten Kennzahlen und rekonstruierter Bildidee', () => {
    const measured = Object.values(SOURCE_REGISTRY).filter((r) =>
      r.geometryUse.includes('measured-metrics'),
    );
    expect(measured.map((r) => r.id)).toEqual(['babz-svg-2025']);
    expect(SOURCE_REGISTRY['babz-svg-2025'].geometryUse).toEqual([
      'measured-metrics',
      'reconstructed',
    ]);
  });

  it('führt die unklare Lizenzlage von babz-svg-2025 maschinenlesbar', () => {
    expect(SOURCE_REGISTRY['babz-svg-2025'].licence.status).toBe('unclear');
  });

  it('führt jede nicht beschaffte DIN-Norm als geklärt', () => {
    const standards = Object.values(SOURCE_REGISTRY).filter((r) => r.kind === 'standard');
    expect(standards).toHaveLength(4);
    for (const record of standards) {
      expect(record.acquisition).toBe('not-acquired');
      expect(record.licence.status).toBe('clarified');
    }
  });

  it('trägt an jeder Quelle beide Reviewrollen mit zurechenbarem technischem Review', () => {
    for (const record of Object.values(SOURCE_REGISTRY)) {
      expect(record.review.technical.status).toBe('approved');
      expect(record.review.technical.reviewer).toBe('rv');
      expect(record.review.technical.date).toBe('2026-08-05');
      expect(record.review.domain.status).toBe('pending');
    }
  });

  it('erkennt registrierte und nicht registrierte Quellen-IDs', () => {
    expect(isRegisteredSource('bbk-babz-2025')).toBe(true);
    expect(isRegisteredSource('org-profile')).toBe(false);
    expect(isRegisteredSource('')).toBe(false);
  });
});
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag prüfen**

Run: `pnpm vitest run packages/catalog/src/sources.test.ts`
Expected: FAIL — `Failed to resolve import "./sources.js"`

- [ ] **Step 3: Die Typen in `packages/schema/src/sources.ts` anlegen**

```ts
import type { SourceId } from './provenance.js';
import type { ReviewSet } from './review.js';

/**
 * `baseline`         — die verbindliche fachliche Grundlage
 * `reference-assets` — Grafikdateien zur Baseline
 * `guidance`         — begleitende Hinweise zur Baseline
 * `legacy`           — ältere Systematik, für Aliasnamen und Migrationshinweise
 * `operational-rule` — operatives Regelwerk mit Terminologie und Führungslogik
 * `standard`         — angrenzende Norm, nicht mit der DV-102-Systematik zu vermischen
 */
export type SourceKind =
  | 'baseline'
  | 'reference-assets'
  | 'guidance'
  | 'legacy'
  | 'operational-rule'
  | 'standard';

/** Beschaffungsstand. Trennt „nicht beschafft" von „beschafft und ungenutzt". */
export type Acquisition = 'local' | 'public-url' | 'not-acquired';

/**
 * Umgang mit der Geometrie der Quelle. `'compared-only'` fehlt bewusst: ein reiner visueller
 * Vergleich findet in diesem Slice mit keiner Quelle statt, und ein Wert ohne Konsument ist
 * genau der Befund, den dieses Projekt vermeidet.
 */
export type GeometryUse = 'measured-metrics' | 'reconstructed' | 'none';

export type LicenceStatus = 'clarified' | 'unclear';

export interface Licence {
  /** Nutzungsgrundlage in einem Satz, prüfbar formuliert. */
  basis: string;
  status: LicenceStatus;
  note?: string;
}

export interface SourceRecord {
  id: SourceId;
  kind: SourceKind;
  title: string;
  publisher: string;
  /** Auflage oder Ausgabedatum, z. B. "1. Auflage 2011" oder "2017-04". */
  edition?: string;
  url?: string;
  /** Fachlicher Geltungsbereich in einem Satz. */
  scope: string;
  acquisition: Acquisition;
  /**
   * Mehrwertig: aus derselben Quelle können Kennzahlen abgeleitet und Bildideen rekonstruiert
   * werden. `babz-svg-2025` trägt beides — ein Einzelwert würde eine der Nutzungen verschweigen.
   */
  geometryUse: readonly GeometryUse[];
  licence: Licence;
  review: ReviewSet;
}
```

- [ ] **Step 4: `SourceId` und `SourceStatus` in `provenance.ts` anpassen**

In `packages/schema/src/provenance.ts` die Zeilen 4–12 ersetzen:

```ts
/**
 * Die registrierten Quellen. Die Werte werden hier deklariert, nicht aus `SOURCE_REGISTRY`
 * abgeleitet: `schema` darf nicht von `catalog` abhängen. Die Gegenrichtung — kein Literal ohne
 * Registereintrag — erzwingt `satisfies Record<SourceId, SourceRecord>` in `catalog/src/sources.ts`.
 */
export type SourceId =
  | 'bbk-babz-2025'
  | 'babz-svg-2025'
  | 'babz-hinweise-2024'
  | 'skk-2010'
  | 'fwdv-100'
  | 'fwdv-800'
  | 'thw-einheiten'
  | 'din-14033'
  | 'din-13050'
  | 'din-14034-6'
  | 'din-14095';

/**
 * `verbatim`   — Geometrie entspricht der Referenz und ist per Fingerprint belegt
 * `derived`    — eigenständig konstruiert, fachlich an der Referenz orientiert
 * `legacy`     — aus der SKK-/DV-102-Systematik von 2010/2011
 *
 * `'organization-specific'` ist entfallen: die Profilzugehörigkeit hängt am Katalogeintrag
 * (`CatalogEntry.profile`), nicht am Quellenbezug.
 */
export type SourceStatus = 'verbatim' | 'derived' | 'legacy';
```

- [ ] **Step 5: Das neue Schema-Modul exportieren**

In `packages/schema/src/index.ts` nach `export * from './review.js';` einfügen:

```ts
export * from './sources.js';
```

- [ ] **Step 6: `SOURCE_REGISTRY` in `packages/catalog/src/sources.ts` anlegen**

```ts
import type { ReviewSet, SourceId, SourceRecord } from '@einsatzzeichen/schema';

/**
 * Für eine Quelle ist das Gate-Kriterium aus der Spec (Fingerprint- und Snapshot-Gate grün)
 * nicht anwendbar. An seine Stelle tritt eine ebenso prüfbare Aussage: die bibliografischen
 * Angaben und die Bezugsadresse sind gegen die Quelle geprüft. Die `note` hält diese
 * Rollenanpassung fest, damit sie dokumentiert und nicht stillschweigend ist.
 */
const SOURCE_REVIEW: ReviewSet = {
  technical: {
    status: 'approved',
    reviewer: 'rv',
    date: '2026-08-05',
    note: 'Bibliografische Angaben und Bezugsadresse gegen die Quelle geprüft.',
  },
  domain: { status: 'pending' },
};

/**
 * Die elf registrierten Quellen der Referenzhierarchie aus `Vision.md`.
 *
 * `satisfies Record<SourceId, SourceRecord>` erzwingt beide Richtungen: keine deklarierte Quelle
 * ohne Registereintrag, und keine Referenz auf eine nicht deklarierte Quelle.
 *
 * Zur Lizenzlage: die kostenpflichtigen DIN-Normen tragen `clarified`, weil die Nutzungslage
 * dort eindeutig ist — Nutzung setzt Erwerb voraus, und ohne Erwerb wird nichts übernommen. Bei
 * den Dienstvorschriften und den BABZ-Veröffentlichungen sind Weiterverwendung und Ableitung
 * nicht dokumentiert; `unclear` ist dort die ehrliche Angabe und trägt die Begründung für den
 * Fingerprint-Ansatz.
 */
export const SOURCE_REGISTRY = {
  'bbk-babz-2025': {
    id: 'bbk-babz-2025',
    kind: 'baseline',
    title:
      'Taktische Zeichen im Bevölkerungsschutz — Empfehlungen zur Einführung einer FwDV 102/DV 102',
    publisher: 'BBK / BABZ',
    url: 'https://lernplattform-babz-bund.de/ilias.php?baseClass=ilrepositorygui&cmd=sendfile&ref_id=150034',
    scope:
      'Verbindliche Baseline: Grundelemente, Organisationsfarben, Fähigkeiten, Stärkeangaben, taktische Einheiten und fachliche Anhänge.',
    acquisition: 'public-url',
    geometryUse: ['none'],
    licence: {
      basis:
        'Frei abrufbare Veröffentlichung der BABZ-Lernplattform; Weiterverwendung und Ableitung sind nicht dokumentiert.',
      status: 'unclear',
      note: 'Liefert die Abschnittsnummerierung des Coverage-Manifests, keine Geometrie.',
    },
    review: SOURCE_REVIEW,
  },
  'babz-svg-2025': {
    id: 'babz-svg-2025',
    kind: 'reference-assets',
    title: 'Freigestellte SVG-Grafikdateien der enthaltenen Zeichen',
    publisher: 'BBK / BABZ',
    url: 'https://lernplattform-babz-bund.de/ilias.php?baseClass=ilrepositorygui&ref_id=147616',
    scope: '661 Referenzdateien zu den Zeichen der Baseline, lokal unter taktische-zeichen/.',
    acquisition: 'local',
    geometryUse: ['measured-metrics', 'reconstructed'],
    licence: {
      basis:
        'Nutzungsgrundlage ungeklärt; deshalb werden ausschließlich Kennzahlen abgeleitet und keine Dateien eingecheckt.',
      status: 'unclear',
      note: 'Zweite Bezugsadresse derselben Quelle, auf weißer Hintergrundfläche: https://lernplattform-babz-bund.de/ilias.php?baseClass=ilrepositorygui&cmdClass=ilobjcategorygui&cmdNode=wv%3Ald&item_ref_id=0&ref_id=147615',
    },
    review: SOURCE_REVIEW,
  },
  'babz-hinweise-2024': {
    id: 'babz-hinweise-2024',
    kind: 'guidance',
    title: 'Begleitende Hinweise zur Überarbeitung vom 12.02.2024',
    publisher: 'BBK / BABZ',
    edition: '2024-02-12',
    url: 'https://www.lv-saarland.drk.de/fileadmin/user_upload/Begleitende_Hinweise_zur_%C3%9Cberarbeitung.pdf',
    scope: 'Erläutert die Änderungen der aktuellen Fassung gegenüber der Vorgängerfassung.',
    acquisition: 'public-url',
    geometryUse: ['none'],
    licence: {
      basis:
        'Frei abrufbares Begleitdokument; Weiterverwendung und Ableitung sind nicht dokumentiert.',
      status: 'unclear',
    },
    review: SOURCE_REVIEW,
  },
  'skk-2010': {
    id: 'skk-2010',
    kind: 'legacy',
    title:
      'DLRG DV 102 — Taktische Zeichen im Bevölkerungsschutz, 1. Auflage 2011 (SKK-Empfehlungen 2010)',
    publisher: 'DLRG / SKK',
    edition: '1. Auflage 2011',
    url: 'https://www.dlrg.de/fileadmin/user_upload/DLRG.de/Fuer-Mitglieder/Einsatz_und_Medizin/kats/Download_Dateien/Formulare_E008/DV102_TaktischeZeichen_DLRG110826.pdf',
    scope:
      'Ältere Systematik als Grundlage für Aliasnamen, Migrationshinweise und Differenzdarstellungen. Von keinem Katalogeintrag dieses Slice referenziert.',
    acquisition: 'public-url',
    geometryUse: ['none'],
    licence: {
      basis:
        'Frei abrufbare Dienstvorschrift; Weiterverwendung und Ableitung sind nicht dokumentiert.',
      status: 'unclear',
      note: 'Zweite Fundstelle derselben Systematik, älteres freies Lernangebot der BABZ: https://lernplattform-babz-bund.de/ilias.php?baseClass=ilstartupgui&client_id=BBKILIAS&cmdClass=ilaccessibilitycontrolconceptgui&cmdNode=zy%3A1t&lang=de&target=cat_109540',
    },
    review: SOURCE_REVIEW,
  },
  'fwdv-100': {
    id: 'fwdv-100',
    kind: 'operational-rule',
    title: 'FwDV 100 — Führung und Leitung im Einsatz',
    publisher: 'Landesfeuerwehrschule Baden-Württemberg (Bereitstellung)',
    url: 'https://www.lfs-bw.de/fileadmin/LFS-BW/themen/gesetze_vorschriften/fwdv/dokumente/FwDV_100.pdf',
    scope: 'Führungsorganisation, Führungsvorgang, Führungsmittel und Lagedarstellung.',
    acquisition: 'public-url',
    geometryUse: ['none'],
    licence: {
      basis:
        'Frei abrufbare Dienstvorschrift; Weiterverwendung und Ableitung sind nicht dokumentiert.',
      status: 'unclear',
    },
    review: SOURCE_REVIEW,
  },
  'fwdv-800': {
    id: 'fwdv-800',
    kind: 'operational-rule',
    title: 'FwDV/DV 800 — Informations- und Kommunikationstechnik im Einsatz',
    publisher: 'Landesfeuerwehrschule Baden-Württemberg (Bereitstellung)',
    url: 'https://www.lfs-bw.de/fileadmin/LFS-BW/themen/gesetze_vorschriften/fwdv/dokumente/FwDV_DV_800.pdf',
    scope: 'Ergänzende IuK-Terminologie und Darstellungszusammenhänge.',
    acquisition: 'public-url',
    geometryUse: ['none'],
    licence: {
      basis:
        'Frei abrufbare Dienstvorschrift; Weiterverwendung und Ableitung sind nicht dokumentiert.',
      status: 'unclear',
    },
    review: SOURCE_REVIEW,
  },
  'thw-einheiten': {
    id: 'thw-einheiten',
    kind: 'operational-rule',
    title: 'THW: Einheiten — Einzelblätter',
    publisher: 'Bundesanstalt Technisches Hilfswerk',
    url: 'https://www.thw.de/SharedDocs/Downloads/DE/Allgemein/einheiten_einzelblaetter.pdf?__blob=publicationFile&v=2',
    scope: 'Aktuelle Bezeichnungen und Strukturinformationen für ein künftiges THW-Profil.',
    acquisition: 'public-url',
    geometryUse: ['none'],
    licence: {
      basis:
        'Frei abrufbare Veröffentlichung; Weiterverwendung und Ableitung sind nicht dokumentiert.',
      status: 'unclear',
    },
    review: SOURCE_REVIEW,
  },
  'din-14033': {
    id: 'din-14033',
    kind: 'standard',
    title: 'DIN 14033:2017-04 — Kurzzeichen für die Feuerwehr',
    publisher: 'DIN / Beuth',
    edition: '2017-04',
    url: 'https://www.dinmedia.de/de/norm/din-14033/267642931',
    scope: 'Kurzzeichen-Terminologie der Feuerwehr. Angrenzende Norm, keine Ersatzbaseline.',
    acquisition: 'not-acquired',
    geometryUse: ['none'],
    licence: {
      basis: 'Kostenpflichtige Norm: Nutzung setzt Erwerb voraus, ohne Erwerb wird nichts übernommen.',
      status: 'clarified',
    },
    review: SOURCE_REVIEW,
  },
  'din-13050': {
    id: 'din-13050',
    kind: 'standard',
    title: 'DIN 13050:2021-10 — Begriffe im Rettungswesen',
    publisher: 'DIN / Beuth',
    edition: '2021-10',
    url: 'https://www.dinmedia.de/de/norm/din-13050/343530475',
    scope: 'Begriffsdefinitionen des Rettungswesens. Angrenzende Norm, keine Ersatzbaseline.',
    acquisition: 'not-acquired',
    geometryUse: ['none'],
    licence: {
      basis: 'Kostenpflichtige Norm: Nutzung setzt Erwerb voraus, ohne Erwerb wird nichts übernommen.',
      status: 'clarified',
    },
    review: SOURCE_REVIEW,
  },
  'din-14034-6': {
    id: 'din-14034-6',
    kind: 'standard',
    title:
      'DIN 14034-6:2024-06 — Graphische Symbole für bauliche Einrichtungen im Feuerwehrwesen',
    publisher: 'DIN / Beuth',
    edition: '2024-06',
    url: 'https://www.dinmedia.de/de/norm/din-14034-6/377898786',
    scope:
      'Symbole für Feuerwehr- und Objektpläne. Gehört in ein eigenes Profil, das dieser Slice nicht baut.',
    acquisition: 'not-acquired',
    geometryUse: ['none'],
    licence: {
      basis: 'Kostenpflichtige Norm: Nutzung setzt Erwerb voraus, ohne Erwerb wird nichts übernommen.',
      status: 'clarified',
    },
    review: SOURCE_REVIEW,
  },
  'din-14095': {
    id: 'din-14095',
    kind: 'standard',
    title: 'DIN 14095:2025-07 — Feuerwehrpläne für bauliche Anlagen',
    publisher: 'DIN / Beuth',
    edition: '2025-07',
    url: 'https://www.dinmedia.de/de/norm/din-14095/391844018',
    scope:
      'Aufbau von Feuerwehrplänen. Gehört in dasselbe künftige Profil wie DIN 14034-6.',
    acquisition: 'not-acquired',
    geometryUse: ['none'],
    licence: {
      basis: 'Kostenpflichtige Norm: Nutzung setzt Erwerb voraus, ohne Erwerb wird nichts übernommen.',
      status: 'clarified',
    },
    review: SOURCE_REVIEW,
  },
} as const satisfies Record<SourceId, SourceRecord>;

/** Prüft, ob eine Zeichenkette eine registrierte Quelle bezeichnet. Vom Coverage-Gate verwendet. */
export function isRegisteredSource(id: string): id is SourceId {
  return Object.hasOwn(SOURCE_REGISTRY, id);
}
```

- [ ] **Step 7: Das neue Katalog-Modul exportieren**

In `packages/catalog/src/index.ts` als erste Zeile einfügen:

```ts
export * from './sources.js';
```

- [ ] **Step 8: Test laufen lassen und Erfolg prüfen**

Run: `pnpm vitest run packages/catalog/src/sources.test.ts`
Expected: PASS, 9 Tests

- [ ] **Step 9: Vollständig verifizieren**

Run: `pnpm typecheck && pnpm test && pnpm cli coverage`
Expected: alles grün. Sollte `pnpm typecheck` in `coverage.ts` melden, dass `baseline: 'bbk-babz-2025'` nicht mehr passt: Das darf nicht passieren, das Literal ist weiterhin ein gültiger `SourceId`-Wert und `CoverageManifest.baseline` behält in dieser Task noch seinen Literaltyp. Task 3 stellt ihn auf `SourceId` um.

- [ ] **Step 10: Commit**

```bash
git add packages/schema/src/sources.ts packages/schema/src/provenance.ts \
  packages/schema/src/index.ts packages/catalog/src/sources.ts \
  packages/catalog/src/sources.test.ts packages/catalog/src/index.ts
git commit -m "feat(catalog): Quellenregister mit elf Quellen, org-profile entfernt"
```

---

## Task 3: Profile und getrennte Datenversionierung

**Files:**
- Create: `packages/schema/src/profile.ts`
- Create: `packages/schema/src/profile.test.ts`
- Create: `packages/catalog/src/profiles.ts`
- Create: `packages/catalog/src/profiles.test.ts`
- Modify: `packages/schema/src/provenance.ts` (`CatalogEntry.profile`)
- Modify: `packages/schema/src/coverage.ts` (`CoverageEntry.profile`, `CoverageManifest.baseline` und `.coreVersion`)
- Modify: `packages/schema/src/index.ts`
- Modify: `packages/schema/src/provenance.test.ts:19-24` (Fixture)
- Modify: `packages/catalog/src/base-symbols.ts:123` (Katalogeintrag)
- Modify: `packages/catalog/src/coverage-manifest.ts` (Manifest-Einträge, `coreVersion`)
- Modify: `packages/catalog/src/coverage-manifest.test.ts:5-16` (Fixture)
- Modify: `packages/catalog/src/index.ts`

**Interfaces:**
- Consumes: `ReviewSet` (Task 1), `SourceId` (Task 2).
- Produces: `type ProfileId = 'bund'`; `interface ProfileRecord { id: ProfileId; title: string; version: string; sources: readonly SourceId[]; verifiedAgainstCore: string; review: ReviewSet }`; `function isDataVersion(value: string): boolean`; `const PROFILES: Record<ProfileId, ProfileRecord>`; `function profileFor(id: ProfileId): ProfileRecord`. `CatalogEntry.profile: ProfileId` und `CoverageEntry.profile: ProfileId` sind ab hier Pflichtfelder, `CoverageManifest.coreVersion: string` existiert.

- [ ] **Step 1: Den fehlschlagenden Test für die Versionsform schreiben**

Datei `packages/schema/src/profile.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isDataVersion } from './profile.js';

describe('Datenversion', () => {
  it.each(['0.1.0', '1.0.0', '10.20.30'])('erkennt "%s" als gültige Version', (value) => {
    expect(isDataVersion(value)).toBe(true);
  });

  it.each(['0.1', '1.0.0.0', 'v1.0.0', '1.0.0-beta', '01.0.0', '', 'x.y.z'])(
    'weist "%s" zurück',
    (value) => {
      expect(isDataVersion(value)).toBe(false);
    },
  );
});
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag prüfen**

Run: `pnpm vitest run packages/schema/src/profile.test.ts`
Expected: FAIL — `Failed to resolve import "./profile.js"`

- [ ] **Step 3: `packages/schema/src/profile.ts` anlegen**

```ts
import type { SourceId } from './provenance.js';
import type { ReviewSet } from './review.js';

/**
 * Die registrierten Profile. Der bundesweite Kern ist selbst eines — damit hat die Struktur von
 * Beginn an reale Konsumenten, und die getrennte Versionierung ist umgesetzt statt vorbereitet.
 *
 * `provenance.ts` importiert `ProfileId` von hier und diese Datei `SourceId` von dort. Beide
 * Importe sind reine Typimporte und werden bei `verbatimModuleSyntax` vollständig gelöscht — zur
 * Laufzeit existiert kein Zyklus.
 */
export type ProfileId = 'bund';

export interface ProfileRecord {
  id: ProfileId;
  title: string;
  /** Eigene Datenversion, semver. Unabhängig von den npm-Paketversionen. */
  version: string;
  /** Quellen, auf die dieses Profil sich stützt. */
  sources: readonly SourceId[];
  /** Kernversion, gegen die dieses Profil geprüft ist. Beim Kern identisch mit `version`. */
  verifiedAgainstCore: string;
  review: ReviewSet;
}

/**
 * Datenversionen werden als Zeichenkette geführt und beim Einlesen auf `major.minor.patch`
 * geprüft — `schema` bleibt ohne Laufzeitabhängigkeiten, also ohne Semver-Bibliothek.
 * Führende Nullen sind ausgeschlossen, Vorabversionen und Buildmetadaten sind nicht vorgesehen.
 */
const DATA_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function isDataVersion(value: string): boolean {
  return DATA_VERSION.test(value);
}
```

- [ ] **Step 4: Test laufen lassen und Erfolg prüfen**

Run: `pnpm vitest run packages/schema/src/profile.test.ts`
Expected: PASS, 10 Tests

- [ ] **Step 5: `profile` als Pflichtfeld an `CatalogEntry` setzen**

In `packages/schema/src/provenance.ts` den Import-Kopf ergänzen und `CatalogEntry` erweitern:

```ts
import type { Drawing } from './geometry.js';
import type { ProfileId } from './profile.js';
import type { SymbolKind } from './taxonomy.js';
```

```ts
export interface CatalogEntry {
  /** Stabile semantische ID, z. B. `base.formation` oder `capability.fire-fighting`. */
  id: string;
  title: string;
  kind: SymbolKind;
  /**
   * Profilzugehörigkeit. Pflichtfeld, nicht optional: bei einem optionalen Feld wäre
   * „kein Profil angegeben" von „gehört zum Kern" nicht unterscheidbar, und die Regel
   * „kein Profileintrag landet unbemerkt im Kern" damit nicht prüfbar.
   */
  profile: ProfileId;
  /** Mindestens eine Darstellung; `primary` genau einmal. */
  depictions: readonly Depiction[];
  synonyms?: readonly string[];
  legacyIds?: readonly string[];
}
```

- [ ] **Step 6: `coverage.ts` um Profil und Kernversion erweitern**

In `packages/schema/src/coverage.ts` den Import-Kopf ergänzen, `CoverageEntry.profile` einfügen und `CoverageManifest` umbauen:

```ts
import type { ProfileId } from './profile.js';
import type { DepictionVariant, SourceId } from './provenance.js';
import type { ReviewSet } from './review.js';
```

`CoverageEntry` bekommt nach `coverage: CoverageKind;` das Feld:

```ts
  /**
   * Steht auch hier und nicht nur am Katalogeintrag: Rezepte und Elemente sind keine
   * `CatalogEntry`s, ihre Zugehörigkeit stünde sonst nirgends. Für Zeilen mit
   * `coverage: 'catalog-entry'` ist der Wert aus dem Katalogeintrag abgeleitet, und das
   * Coverage-Gate prüft die Gleichheit.
   */
  profile: ProfileId;
```

`CoverageManifest` vollständig:

```ts
export interface CoverageManifest {
  /** Bezeichnet die Abschnittsnummerierung, aus der jeder `CoverageEntry.sourceId` sein Präfix zieht. */
  baseline: SourceId;
  /** Datenversion des bundesweiten Kernkatalogs, unabhängig von den npm-Paketversionen. */
  coreVersion: string;
  /** Kapitel und Anhänge, die dieser Slice beansprucht. */
  scope: readonly string[];
  entries: readonly CoverageEntry[];
}
```

- [ ] **Step 7: Das neue Schema-Modul exportieren**

In `packages/schema/src/index.ts` nach `export * from './sources.js';` einfügen:

```ts
export * from './profile.js';
```

- [ ] **Step 8: Den fehlschlagenden Test für das Profilregister schreiben**

Datei `packages/catalog/src/profiles.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isDataVersion } from '@einsatzzeichen/schema';
import { PROFILES, profileFor } from './profiles.js';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';

describe('Profilregister', () => {
  it('führt den bundesweiten Kern als einziges Profil', () => {
    expect(Object.keys(PROFILES)).toEqual(['bund']);
  });

  it('gibt zu jeder ID den Datensatz mit derselben ID zurück', () => {
    expect(profileFor('bund').id).toBe('bund');
  });

  it('führt für jedes Profil eine gültige Datenversion und Kernprüfversion', () => {
    for (const record of Object.values(PROFILES)) {
      expect(isDataVersion(record.version)).toBe(true);
      expect(isDataVersion(record.verifiedAgainstCore)).toBe(true);
    }
  });

  it('setzt beim Kern Datenversion, Kernprüfversion und Manifestversion gleich', () => {
    const bund = profileFor('bund');
    expect(bund.version).toBe(bund.verifiedAgainstCore);
    expect(bund.version).toBe(COVERAGE_MANIFEST.coreVersion);
  });

  it('stützt den Kern auf die Baseline und die Referenzdateien', () => {
    expect(profileFor('bund').sources).toEqual(['bbk-babz-2025', 'babz-svg-2025']);
  });

  it('trägt am Profil beide Reviewrollen mit offenem fachlichem Review', () => {
    const review = profileFor('bund').review;
    expect(review.technical.status).toBe('approved');
    expect(review.technical.reviewer).toBe('rv');
    expect(review.domain.status).toBe('pending');
  });
});
```

- [ ] **Step 9: Test laufen lassen und Fehlschlag prüfen**

Run: `pnpm vitest run packages/catalog/src/profiles.test.ts`
Expected: FAIL — `Failed to resolve import "./profiles.js"`

- [ ] **Step 10: `packages/catalog/src/profiles.ts` anlegen**

```ts
import type { ProfileId, ProfileRecord } from '@einsatzzeichen/schema';

/**
 * Die registrierten Profile. Der bundesweite Kern ist der erste Eintrag — ein Profilfeld ohne
 * einen einzigen Nutzer wäre genau der YAGNI-Befund, den die Entscheidungsnotiz vom 4. August
 * 2026 festhält. Ein zweites Profil ist reines Hinzufügen: ein Literal in `ProfileId`, ein
 * Eintrag hier, Einträge mit dem neuen Wert. Kein Umbau bestehender Daten.
 *
 * Dieser Slice baut bewusst **keinen** Overlay-Mechanismus: ein Profil kann keine Kerneinträge
 * überschreiben oder ergänzen. Es gibt kein belegtes zweites Profil, gegen das sich eine
 * Auflösungsreihenfolge prüfen ließe.
 */
export const PROFILES = {
  bund: {
    id: 'bund',
    title: 'Bundesweiter Kern',
    version: '0.1.0',
    sources: ['bbk-babz-2025', 'babz-svg-2025'],
    verifiedAgainstCore: '0.1.0',
    review: {
      technical: {
        status: 'approved',
        reviewer: 'rv',
        date: '2026-08-05',
        note: 'Versionsfelder und Quellenbezüge sind vom Coverage-Gate geprüft.',
      },
      domain: { status: 'pending' },
    },
  },
} as const satisfies Record<ProfileId, ProfileRecord>;

/** Wirft, wenn die ID kein registriertes Profil bezeichnet — wie `organizationColor`. */
export function profileFor(id: ProfileId): ProfileRecord {
  const record: ProfileRecord | undefined = PROFILES[id];
  if (record === undefined) {
    throw new Error(`Kein registriertes Profil "${id}".`);
  }
  return record;
}
```

- [ ] **Step 11: Das neue Katalog-Modul exportieren**

In `packages/catalog/src/index.ts` nach `export * from './sources.js';` einfügen:

```ts
export * from './profiles.js';
```

- [ ] **Step 12: Die Katalogeinträge und das Manifest auf `bund` setzen**

In `packages/catalog/src/base-symbols.ts` in `entry()` das Feld ergänzen (direkt nach `kind,`):

```ts
    kind,
    profile: 'bund',
```

In `packages/catalog/src/coverage-manifest.ts` in beiden `map`-Rückgaben nach `coverage: …` ergänzen:

```ts
    profile: 'bund',
```

und `COVERAGE_MANIFEST` um die Kernversion erweitern:

```ts
export const COVERAGE_MANIFEST: CoverageManifest = {
  baseline: 'bbk-babz-2025',
  /**
   * Datenversion des Kerns, unabhängig von den npm-Paketversionen. Ein Profil kann sich ändern,
   * ohne den Kern zu berühren, und umgekehrt — über Paketversionen wäre das nur darstellbar,
   * wenn jedes Profil ein eigenes npm-Paket wäre.
   */
  coreVersion: '0.1.0',
  // Kapitel 3 (sieben Referenzdateien) setzt dieser Slice nicht um; 5.1.1/5.7 sind entfallen
  // (Verwaltungsstufen/Fahrzeugkategorien: von 16 Referenzdateien nur 2 vermessbar, kein Konsument).
  scope: ['1', '2', '4.3.1', '5.4', 'C.1.1', 'C.1.2', 'D.3.7'],
  entries: [...catalogEntries, ...recipeEntries],
};
```

- [ ] **Step 13: Die beiden Test-Fixtures um `profile` ergänzen**

In `packages/catalog/src/coverage-manifest.test.ts` die Funktion `fixtureEntry` (Zeilen 5–16):

```ts
function fixtureEntry(id: string, primaryCount: number): CatalogEntry {
  return {
    id,
    title: 'Test',
    kind: 'formation',
    profile: 'bund',
    depictions: Array.from({ length: primaryCount }, () => ({
      variant: 'primary' as const,
      drawing: { viewBox: DEFAULT_VIEWBOX_MM, children: [] },
      sourceRefs: [],
    })),
  };
}
```

In `packages/schema/src/provenance.test.ts` das Objektliteral ab Zeile 19:

```ts
    const entry: CatalogEntry = {
      id: 'hazard.atomic',
      title: 'Atomare Stoffe',
      kind: 'hazard',
      profile: 'bund',
      depictions: [
```

- [ ] **Step 14: Test laufen lassen und Erfolg prüfen**

Run: `pnpm vitest run packages/catalog/src/profiles.test.ts`
Expected: PASS, 6 Tests

- [ ] **Step 15: Vollständig verifizieren**

Run: `pnpm typecheck && pnpm test && pnpm cli coverage`
Expected: alles grün. `pnpm typecheck` ist hier die eigentliche Prüfung: es beweist, dass jeder Katalog- und Manifest-Eintrag ein Profil trägt.

- [ ] **Step 16: Commit**

```bash
git add packages/schema/src/profile.ts packages/schema/src/profile.test.ts \
  packages/schema/src/provenance.ts packages/schema/src/provenance.test.ts \
  packages/schema/src/coverage.ts packages/schema/src/index.ts \
  packages/catalog/src/profiles.ts packages/catalog/src/profiles.test.ts \
  packages/catalog/src/base-symbols.ts packages/catalog/src/coverage-manifest.ts \
  packages/catalog/src/coverage-manifest.test.ts packages/catalog/src/index.ts
git commit -m "feat(schema): Profilregister mit bund, profile als Pflichtfeld, eigene Datenversionen"
```

---

## Task 4: Dritte Abdeckungsart und Element-IDs

**Files:**
- Create: `packages/catalog/src/elements.ts`
- Create: `packages/catalog/src/elements.test.ts`
- Modify: `packages/schema/src/coverage.ts:3` (`CoverageKind`)
- Modify: `packages/catalog/src/coverage-manifest.ts` (zwölf Elementeinträge)
- Modify: `packages/catalog/src/coverage-manifest.test.ts:24-28` (drei Eintragsarten)
- Modify: `packages/catalog/src/index.ts`

**Interfaces:**
- Consumes: `ReviewSet` (Task 1), `ProfileId` (Task 3), `ORGANIZATION_COLORS` aus `packages/catalog/src/organizations.ts`, `StrengthId` und `CapabilityId` aus `packages/schema/src/taxonomy.ts`.
- Produces: `type CoverageKind = 'catalog-entry' | 'composition-recipe' | 'element'`; `type ElementKind = 'organization' | 'strength' | 'capability'`; `interface ElementDescriptor { id: string; kind: ElementKind; title: string; referenceAssets: readonly string[] }`; `const ELEMENTS: Record<string, ElementDescriptor>`; `function resolveElement(id: string): ElementDescriptor`. Das Manifest hat ab hier 23 Einträge.

**Kontext für die Umsetzung:** `resolveElement` gibt **keine Geometrie** zurück, sondern einen Deskriptor — Existenz, Art, Belegstelle. Wer die Geometrie will, ruft weiterhin `organizationColor`, `strengthHead` oder `capabilityPictogram`. Sonst entstünde ein zweiter Zugriffsweg auf den Katalog und damit eine zweite Wahrheit über Farben und Kopfzonen.

Die Dateinamen unten sind exakt so aus `packages/catalog/src/fingerprints.json` übernommen. **Achtung bei `C.1.8_Staffel Dekontamination  von Personal.svg`: der Dateiname enthält zwei aufeinanderfolgende Leerzeichen zwischen „Dekontamination" und „von".** Nicht normalisieren.

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

Datei `packages/catalog/src/elements.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { StrengthId } from '@einsatzzeichen/schema';
import { ELEMENTS, resolveElement } from './elements.js';
import { ORGANIZATION_COLORS } from './organizations.js';
import { fingerprintFor } from './fingerprint-index.js';

describe('Element-Register', () => {
  it('führt zwölf Elemente: sieben Farben, vier Stärkegrade, ein Piktogramm', () => {
    const byKind = Object.values(ELEMENTS).reduce<Record<string, number>>((acc, el) => {
      acc[el.kind] = (acc[el.kind] ?? 0) + 1;
      return acc;
    }, {});
    expect(byKind).toEqual({ organization: 7, strength: 4, capability: 1 });
  });

  it('führt genau die Organisationen, für die der Katalog eine Farbe belegt', () => {
    const fromElements = Object.values(ELEMENTS)
      .filter((el) => el.kind === 'organization')
      .map((el) => el.id.slice('organization.'.length))
      .sort();
    expect(fromElements).toEqual(Object.keys(ORGANIZATION_COLORS).sort());
  });

  it('führt jeden Stärkegrad der Taxonomie als Element', () => {
    const all: readonly StrengthId[] = ['trupp', 'staffel', 'gruppe', 'zug'];
    for (const id of all) expect(resolveElement(`strength.${id}`).kind).toBe('strength');
  });

  it('trägt an jedem Element denselben Schlüssel als id und mindestens eine Belegstelle', () => {
    for (const [key, descriptor] of Object.entries(ELEMENTS)) {
      expect(descriptor.id).toBe(key);
      expect(descriptor.referenceAssets.length).toBeGreaterThan(0);
      expect(descriptor.title.length).toBeGreaterThan(0);
    }
  });

  it('nennt nur Belegstellen, die im Kennzahlenartefakt vorkommen', () => {
    for (const descriptor of Object.values(ELEMENTS)) {
      for (const asset of descriptor.referenceAssets) {
        expect(() => fingerprintFor(asset)).not.toThrow();
      }
    }
  });

  it('belegt die Staffel an drei und den Zug an fünf Dateien', () => {
    expect(resolveElement('strength.staffel').referenceAssets).toHaveLength(3);
    expect(resolveElement('strength.zug').referenceAssets).toHaveLength(5);
  });

  it('nennt bei jedem Stärkegrad die namensgebende 5.4-Datei zuerst', () => {
    expect(resolveElement('strength.trupp').referenceAssets[0]).toBe('5.4.1_Trupp.svg');
    expect(resolveElement('strength.staffel').referenceAssets[0]).toBe('5.4.2_Staffel.svg');
    expect(resolveElement('strength.gruppe').referenceAssets[0]).toBe('5.4.3_Gruppe.svg');
    expect(resolveElement('strength.zug').referenceAssets[0]).toBe('5.4.4_Zug.svg');
  });

  it('führt hilfsorganisation nicht als Element', () => {
    expect(() => resolveElement('organization.hilfsorganisation')).toThrow(/hilfsorganisation/);
  });

  it('wirft bei einer unbekannten Element-ID', () => {
    expect(() => resolveElement('strength.kompanie')).toThrow(/strength\.kompanie/);
    expect(() => resolveElement('')).toThrow();
  });
});
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag prüfen**

Run: `pnpm vitest run packages/catalog/src/elements.test.ts`
Expected: FAIL — `Failed to resolve import "./elements.js"`

- [ ] **Step 3: `packages/catalog/src/elements.ts` anlegen**

```ts
export type ElementKind = 'organization' | 'strength' | 'capability';

/**
 * Ein Einzelelement, das keine eigene Zeichnung ist, aber eine an der Referenz belegte Regel
 * trägt: eine Organisationsfarbe, ein Stärkegrad, ein Piktogramm. Die drei Elementarten sind
 * strukturell unvergleichbar — eine Organisationsfarbe ist ein `ColorToken`, ein Stärkegrad eine
 * `HeadShape`, ein Piktogramm ein `Primitive[]`. Der Deskriptor gibt deshalb keine Geometrie
 * zurück, sondern genau das, was das Coverage-Gate braucht: Existenz, Art und Belegstelle.
 */
export interface ElementDescriptor {
  id: string;
  kind: ElementKind;
  title: string;
  /**
   * Alle Referenzdateien, an denen dieses Element belegt ist. Mindestens eine. Mehrwertig, weil
   * ein Stärkegrad an mehreren Dateien vermessen ist — ein Einzelwert wäre eine willkürliche
   * Auswahl aus gleichwertigen Belegen.
   */
  referenceAssets: readonly string[];
}

/**
 * Die zwölf belegten Elemente. `hilfsorganisation` fehlt bewusst: Kapitel 2 enthält dafür keine
 * Datei, `organizationColor` wirft, und das Manifest behauptet nichts, was der Katalog nicht kann.
 * (`2.2_Organisationen.svg` existiert, trägt aber einen generischen Namen, aus dem keine Zuordnung
 * folgt. Diese Zuordnung zu vermessen ist eine eigene Aufgabe.)
 *
 * Bei den Stärkegraden enthält `referenceAssets` mehr als die namensgebende Datei: die
 * `5.4.x`-Dateien sind eigenständige Anzeigedarstellungen mit r = 4 und selbst keine Kopfzonen;
 * die Kopfzonengeometrie ist an den `C.1.x`- und `D.3.7`/`E.1.18`-Dateien vermessen
 * (Entscheidungsnotiz vom 4. August 2026, Abschnitt 5, und die Konstanten in `strengths.ts`).
 * Die namensgebende Datei steht jeweils zuerst.
 */
export const ELEMENTS = {
  'organization.feuerwehr': {
    id: 'organization.feuerwehr',
    kind: 'organization',
    title: 'Feuerwehr',
    referenceAssets: ['2.1_Feuerwehr.svg'],
  },
  'organization.thw': {
    id: 'organization.thw',
    kind: 'organization',
    title: 'Technisches Hilfswerk',
    referenceAssets: ['2.3_Technisches Hilfswerk.svg'],
  },
  'organization.fuehrung-leitung': {
    id: 'organization.fuehrung-leitung',
    kind: 'organization',
    title: 'Führung Leitung',
    referenceAssets: ['2.4_Führung Leitung.svg'],
  },
  'organization.polizei': {
    id: 'organization.polizei',
    kind: 'organization',
    title: 'Polizei',
    referenceAssets: ['2.5_Polizei.svg'],
  },
  'organization.bundeswehr': {
    id: 'organization.bundeswehr',
    kind: 'organization',
    title: 'Bundeswehr',
    referenceAssets: ['2.6_Bundeswehr.svg'],
  },
  'organization.sonstige-gefahrenabwehr': {
    id: 'organization.sonstige-gefahrenabwehr',
    kind: 'organization',
    title: 'Sonstige Gefahrenabwehr',
    referenceAssets: ['2.7_Sonstige Gefahrenabwehr.svg'],
  },
  'organization.zivile-einheiten': {
    id: 'organization.zivile-einheiten',
    kind: 'organization',
    title: 'Zivile Einheiten',
    referenceAssets: ['2.8_Zivile Einheiten.svg'],
  },
  'strength.trupp': {
    id: 'strength.trupp',
    kind: 'strength',
    title: 'Trupp',
    referenceAssets: [
      '5.4.1_Trupp.svg',
      'C.1.7_CBRN-Erkundungstrupp.svg',
      'C.1.13_Flugdrohnentrupp Feuerwehr.svg',
      'C.1.14_Drohnentrupp Feuerwehr.svg',
    ],
  },
  'strength.staffel': {
    id: 'strength.staffel',
    kind: 'strength',
    title: 'Staffel',
    referenceAssets: [
      '5.4.2_Staffel.svg',
      'C.1.1_Löschstaffel.svg',
      // Zwei Leerzeichen im Dateinamen — so steht er im Referenzbestand, nicht normalisieren.
      'C.1.8_Staffel Dekontamination  von Personal.svg',
    ],
  },
  'strength.gruppe': {
    id: 'strength.gruppe',
    kind: 'strength',
    title: 'Gruppe',
    referenceAssets: [
      '5.4.3_Gruppe.svg',
      'C.1.2_Löschgruppe.svg',
      'C.1.9_ABC-Erkundungsgruppe einer Feuerwehr.svg',
    ],
  },
  'strength.zug': {
    id: 'strength.zug',
    kind: 'strength',
    title: 'Zug',
    referenceAssets: [
      '5.4.4_Zug.svg',
      'C.1.3_Löschzug einer Feuerwehr.svg',
      'C.1.11_Gefahrstoffzug.svg',
      'D.3.7_Zugführer der Feuerwehr.svg',
      'E.1.18_Fachzug Führung-Kommunikation.svg',
    ],
  },
  'capability.fire-fighting': {
    id: 'capability.fire-fighting',
    kind: 'capability',
    title: 'Brandbekämpfung',
    // Belegstelle der Bildidee. Die Geometrie ist eigenständig konstruiert (`capabilities.ts`),
    // die Quelle führt das als `reconstructed`.
    referenceAssets: ['4.3.1_Brandbekämpfung.svg'],
  },
} as const satisfies Record<string, ElementDescriptor>;

/**
 * Weit getypter Blick auf `ELEMENTS` für die Suche über beliebige Zeichenketten — dasselbe
 * Muster wie `colorsByOrganization` in `organizations.ts`. `ELEMENTS` selbst bleibt eng getypt,
 * damit die Tests an den Literalschlüsseln greifen.
 */
const elementsById: Record<string, ElementDescriptor> = ELEMENTS;

/**
 * Löst eine Element-ID auf und wirft bei unbekannter ID — dasselbe Muster wie `fingerprintFor`
 * und `organizationColor`. Erst damit ist ein Manifest-Eintrag mehr als eine Behauptung.
 */
export function resolveElement(id: string): ElementDescriptor {
  const descriptor = elementsById[id];
  if (descriptor === undefined) {
    throw new Error(`Kein bekanntes Element "${id}" im Katalog.`);
  }
  return descriptor;
}
```

- [ ] **Step 4: Test laufen lassen und Erfolg prüfen**

Run: `pnpm vitest run packages/catalog/src/elements.test.ts`
Expected: PASS, 9 Tests

- [ ] **Step 5: `CoverageKind` um `'element'` erweitern**

In `packages/schema/src/coverage.ts` die Zeile mit `CoverageKind` ersetzen:

```ts
/**
 * `element` bezeichnet ein Einzelelement, das keine eigene Zeichnung ist, aber eine an der
 * Referenz belegte Regel trägt: eine Organisationsfarbe, ein Stärkegrad, ein Piktogramm.
 */
export type CoverageKind = 'catalog-entry' | 'composition-recipe' | 'element';
```

- [ ] **Step 6: Die zwölf Elementeinträge ins Manifest aufnehmen**

In `packages/catalog/src/coverage-manifest.ts` nach dem Block `recipeEntries` einfügen:

```ts
/**
 * Abschnittsnummer je Element. Jedes Element braucht eine eigene Nummer, sonst kollidierten die
 * vier Stärkegrade auf `5.4` — der Manifestschlüssel bleibt `entryKey(sourceId, variant)`.
 * Alle zwölf Nummern sind aus den Dateinamen des Referenzbestands belegt, keine ist geschlossen.
 */
const ELEMENT_SECTIONS: Record<string, string> = {
  'organization.feuerwehr': '2.1',
  'organization.thw': '2.3',
  'organization.fuehrung-leitung': '2.4',
  'organization.polizei': '2.5',
  'organization.bundeswehr': '2.6',
  'organization.sonstige-gefahrenabwehr': '2.7',
  'organization.zivile-einheiten': '2.8',
  'strength.trupp': '5.4.1',
  'strength.staffel': '5.4.2',
  'strength.gruppe': '5.4.3',
  'strength.zug': '5.4.4',
  'capability.fire-fighting': '4.3.1',
};

/**
 * `fingerprintTest` und `snapshotTest` sind bei allen zwölf `false` und das ist kein Versäumnis:
 * das Fingerprint-Gate vergleicht ausschließlich `role: 'body'` und erfasst Kopfmarken nie
 * (Entscheidungsnotiz vom 4. August 2026, Abschnitt 5); Snapshots existieren nur für Grundzeichen
 * und Rezepte. Die Elemente sind stattdessen durch `organizations.test.ts`, `strengths.test.ts`
 * und `capabilities.test.ts` festgenagelt — das trägt `review.technical: approved`, aber das
 * Manifest bildet die Testarten ab, statt sie zu überzeichnen.
 */
const elementEntries: CoverageEntry[] = Object.entries(ELEMENT_SECTIONS).map(([id, section]) => {
  const descriptor = resolveElement(id);
  return {
    sourceId: `bbk-babz-2025:${section}`,
    variant: 'primary',
    title: descriptor.title,
    implementation: id,
    // Die namensgebende Datei. Das Gate prüft, dass sie in `referenceAssets` vorkommt.
    referenceAsset: descriptor.referenceAssets[0] ?? '',
    coverage: 'element',
    profile: 'bund',
    fingerprintTest: false,
    snapshotTest: false,
    review: REVIEW,
  };
});
```

Den Import-Kopf der Datei um `resolveElement` erweitern:

```ts
import { resolveElement } from './elements.js';
```

Und `entries` im Manifest erweitern:

```ts
  entries: [...catalogEntries, ...recipeEntries, ...elementEntries],
```

- [ ] **Step 7: Das neue Katalog-Modul exportieren**

In `packages/catalog/src/index.ts` nach `export * from './profiles.js';` einfügen:

```ts
export * from './elements.js';
```

- [ ] **Step 8: Den Manifest-Test auf drei Eintragsarten und 23 Einträge erweitern**

In `packages/catalog/src/coverage-manifest.test.ts` den Test in Zeile 24–28 ersetzen und einen neuen darunter ergänzen:

```ts
  it('enthält alle drei Eintragsarten', () => {
    const kinds = new Set(COVERAGE_MANIFEST.entries.map((e) => e.coverage));
    expect(kinds).toContain('catalog-entry');
    expect(kinds).toContain('composition-recipe');
    expect(kinds).toContain('element');
  });

  it('führt 23 Einträge: acht Grundzeichen, drei Rezepte, zwölf Elemente', () => {
    const counts = COVERAGE_MANIFEST.entries.reduce<Record<string, number>>((acc, e) => {
      acc[e.coverage] = (acc[e.coverage] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ 'catalog-entry': 8, 'composition-recipe': 3, element: 12 });
    expect(COVERAGE_MANIFEST.entries).toHaveLength(23);
  });
```

- [ ] **Step 9: Vollständig verifizieren**

Run: `pnpm typecheck && pnpm test && pnpm cli coverage`
Expected: alles grün, `Einträge: 23` in der CLI-Ausgabe.

- [ ] **Step 10: Commit**

```bash
git add packages/schema/src/coverage.ts packages/catalog/src/elements.ts \
  packages/catalog/src/elements.test.ts packages/catalog/src/coverage-manifest.ts \
  packages/catalog/src/coverage-manifest.test.ts packages/catalog/src/index.ts
git commit -m "feat(catalog): dritte Abdeckungsart mit zwölf Elementeinträgen und resolveElement"
```

---

## Task 5: Gate-Prüfungen zu Quelle, Profil und Review

**Files:**
- Modify: `packages/catalog/src/coverage-manifest.ts` (`CoverageViolation`, vier Prüfungen, `openDomainReviews`)
- Modify: `packages/catalog/src/coverage-manifest.test.ts`

**Interfaces:**
- Consumes: `isRegisteredSource` (Task 2), `PROFILES` (Task 3), `unattributedRoles` (Task 1), `BASE_SYMBOLS`, `COVERAGE_MANIFEST`.
- Produces: `interface CoverageViolation { check: string; key: string; detail: string }`; `checkCoverage()` gibt ab hier `{ missing, duplicates, invalidPrimary, violations, openDomainReviews }` zurück. Prüfnamen dieser Task: `'baseline-prefix'`, `'unregistered-source'`, `'profile-mismatch'`, `'review-attribution'`.

**Kontext:** Die vier bestehenden Prüfungen bleiben unverändert. Die Prüffunktionen nehmen ihre Eingaben als Parameter statt direkt auf `COVERAGE_MANIFEST` zuzugreifen — nur so lassen sie sich mit Fixtures gegen den Fehlerfall testen, ohne das echte Manifest zu verbiegen.

Zur Präfixregel: Das Manifest-Präfix ist **immer die Baseline** (`bbk-babz-2025`). Es bezeichnet die Abschnittsnummerierung, und die stammt aus dem Hauptdokument. Die Geometrieprovenienz steht dagegen am Katalogeintrag (`Depiction.sourceRefs`, heute `babz-svg-2025`). Beide Angaben werden geprüft, ohne fälschlich ihre Gleichheit zu fordern — sie bezeichnen verschiedene Dinge.

- [ ] **Step 1: Die fehlschlagenden Tests schreiben**

In `packages/catalog/src/coverage-manifest.test.ts` den Import-Kopf erweitern und einen neuen `describe`-Block ans Dateiende anfügen:

```ts
import {
  COVERAGE_MANIFEST,
  checkCoverage,
  findPrimaryViolations,
  checkBaselinePrefix,
  checkCatalogSourceRefs,
  checkProfileAgreement,
  checkReviewAttribution,
  countOpenDomainReviews,
} from './coverage-manifest.js';
```

```ts
function fixtureCoverageEntry(overrides: Partial<CoverageEntry> = {}): CoverageEntry {
  return {
    sourceId: 'bbk-babz-2025:1.1',
    variant: 'primary',
    title: 'Test',
    implementation: 'base.formation',
    referenceAsset: '1.1_Taktische Formation.svg',
    coverage: 'catalog-entry',
    profile: 'bund',
    fingerprintTest: true,
    snapshotTest: true,
    review: {
      technical: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
      domain: { status: 'pending' },
    },
    ...overrides,
  };
}

describe('Gate-Prüfungen zu Quelle, Profil und Review', () => {
  it('nimmt ein Präfix an, das der Baseline entspricht', () => {
    expect(checkBaselinePrefix([fixtureCoverageEntry()], 'bbk-babz-2025')).toEqual([]);
  });

  it('meldet ein Präfix, das eine andere registrierte Quelle nennt', () => {
    const wrong = fixtureCoverageEntry({ sourceId: 'babz-svg-2025:1.1' });
    const [violation] = checkBaselinePrefix([wrong], 'bbk-babz-2025');
    expect(violation?.check).toBe('baseline-prefix');
    expect(violation?.detail).toContain('babz-svg-2025');
  });

  it('meldet einen sourceId ohne Präfixtrenner', () => {
    const wrong = fixtureCoverageEntry({ sourceId: '1.1' });
    expect(checkBaselinePrefix([wrong], 'bbk-babz-2025')).toHaveLength(1);
  });

  it('nimmt einen Katalogeintrag an, dessen primary eine registrierte Quelle nennt', () => {
    expect(checkCatalogSourceRefs(Object.values(BASE_SYMBOLS))).toEqual([]);
  });

  it('meldet einen Katalogeintrag, dessen primary keine Quelle nennt', () => {
    const entry = fixtureEntry('test.ohne-quelle', 1);
    const [violation] = checkCatalogSourceRefs([entry]);
    expect(violation?.check).toBe('unregistered-source');
    expect(violation?.key).toBe('test.ohne-quelle');
  });

  it('nimmt einen Manifest-Eintrag an, dessen Profil dem Katalogeintrag entspricht', () => {
    const entry = fixtureEntry('base.formation', 1);
    const manifest = fixtureCoverageEntry({ implementation: 'base.formation' });
    expect(checkProfileAgreement([manifest], [entry])).toEqual([]);
  });

  it('meldet einen Manifest-Eintrag, dessen Profil vom Katalogeintrag abweicht', () => {
    // `ProfileId` kennt heute nur `'bund'`; ein echter Abgleichsfehler lässt sich nur über eine
    // Zusicherung herstellen. Die Prüfung ist trotzdem nötig — sie greift, sobald ein zweites
    // Profil existiert.
    const entry = fixtureEntry('base.formation', 1);
    const manifest = fixtureCoverageEntry({
      implementation: 'base.formation',
      profile: 'laender' as unknown as ProfileId,
    });
    const [violation] = checkProfileAgreement([manifest], [entry]);
    expect(violation?.check).toBe('profile-mismatch');
    expect(violation?.detail).toContain('laender');
  });

  it('meldet einen Katalogeintrags-Manifestwert ohne zugehörigen Katalogeintrag', () => {
    const orphan = fixtureCoverageEntry({ implementation: 'base.unbekannt' });
    const [violation] = checkProfileAgreement([orphan], []);
    expect(violation?.check).toBe('profile-mismatch');
    expect(violation?.detail).toContain('base.unbekannt');
  });

  it('prüft das Profil nur bei Katalogeinträgen, nicht bei Rezepten und Elementen', () => {
    const recipe = fixtureCoverageEntry({
      coverage: 'composition-recipe',
      implementation: 'recipe.C.1.1',
    });
    expect(checkProfileAgreement([recipe], [])).toEqual([]);
  });

  it('meldet ein approved ohne Reviewer unter Nennung der Rolle', () => {
    const bad = fixtureCoverageEntry({
      review: { technical: { status: 'approved' }, domain: { status: 'pending' } },
    });
    const [violation] = checkReviewAttribution([bad]);
    expect(violation?.check).toBe('review-attribution');
    expect(violation?.detail).toContain('technical');
  });

  it('zählt die offenen fachlichen Reviews', () => {
    const open = fixtureCoverageEntry();
    const done = fixtureCoverageEntry({
      review: {
        technical: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
        domain: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
      },
    });
    expect(countOpenDomainReviews([open, done, open])).toBe(2);
  });

  it('meldet für das echte Manifest keine Verletzung und alle 23 fachlichen Reviews als offen', () => {
    const result = checkCoverage();
    expect(result.violations).toEqual([]);
    expect(result.openDomainReviews).toBe(COVERAGE_MANIFEST.entries.length);
  });
});
```

Den bestehenden Test `meldet keine fehlenden, doppelten oder primary-verletzenden Einträge` anpassen, weil `checkCoverage()` zwei Felder mehr zurückgibt:

```ts
  it('meldet keine fehlenden, doppelten oder primary-verletzenden Einträge', () => {
    const { missing, duplicates, invalidPrimary } = checkCoverage();
    expect({ missing, duplicates, invalidPrimary }).toEqual({
      missing: [],
      duplicates: [],
      invalidPrimary: [],
    });
  });
```

Der Import in dieser Testdatei braucht zusätzlich `BASE_SYMBOLS` und den Typ `CoverageEntry`:

```ts
import {
  DEFAULT_VIEWBOX_MM,
  entryKey,
  type CatalogEntry,
  type CoverageEntry,
  type ProfileId,
} from '@einsatzzeichen/schema';
import { BASE_SYMBOLS } from './base-symbols.js';
```

- [ ] **Step 2: Tests laufen lassen und Fehlschlag prüfen**

Run: `pnpm vitest run packages/catalog/src/coverage-manifest.test.ts`
Expected: FAIL — `checkBaselinePrefix is not a function` (bzw. Importfehler)

- [ ] **Step 3: Die vier Prüfungen implementieren**

In `packages/catalog/src/coverage-manifest.ts` unterhalb von `findPrimaryViolations` einfügen:

```ts
/**
 * Eine Verletzung einer der neun in Slice 2 hinzugekommenen Prüfungen. Eine gemeinsame Liste
 * statt neun einzelner Arrays: das CLI gibt sie einheitlich aus, und eine zehnte Prüfung kostet
 * keine Änderung an der Rückgabeform.
 */
export interface CoverageViolation {
  /** Kurzname der Prüfung, z. B. 'baseline-prefix'. */
  check: string;
  /** Manifestschlüssel, Katalog-ID oder Registerschlüssel — je nachdem, was geprüft wurde. */
  key: string;
  detail: string;
}

/**
 * Das Präfix jedes `sourceId` muss die Baseline sein — nicht irgendeine registrierte Quelle.
 * Das Präfix bezeichnet die Abschnittsnummerierung, und nur im Hauptdokument ist definiert,
 * dass `5.4.3` „Gruppe" bedeutet.
 */
export function checkBaselinePrefix(
  entries: readonly CoverageEntry[],
  baseline: SourceId,
): CoverageViolation[] {
  const violations: CoverageViolation[] = [];
  for (const entry of entries) {
    const separator = entry.sourceId.indexOf(':');
    const prefix = separator === -1 ? '' : entry.sourceId.slice(0, separator);
    if (prefix !== baseline) {
      violations.push({
        check: 'baseline-prefix',
        key: entryKey(entry.sourceId, entry.variant),
        detail: `Präfix "${prefix}" statt der Baseline "${baseline}".`,
      });
    }
  }
  return violations;
}

/**
 * Jede `primary`-Darstellung eines Katalogeintrags muss mindestens einen Quellenbezug auf eine
 * registrierte Quelle tragen. Das ist die zweite Hälfte der Provenienz: das Manifest-Präfix
 * nennt die Abschnittsnummerierung, dieser Bezug nennt, woraus die Kennzahlen abgeleitet sind.
 */
export function checkCatalogSourceRefs(entries: readonly CatalogEntry[]): CoverageViolation[] {
  const violations: CoverageViolation[] = [];
  for (const entry of entries) {
    const primary = entry.depictions.find((d) => d.variant === 'primary');
    const registered = primary?.sourceRefs.some((ref) => isRegisteredSource(ref.source)) ?? false;
    if (!registered) {
      violations.push({
        check: 'unregistered-source',
        key: entry.id,
        detail: 'Die primary-Darstellung nennt keine registrierte Quelle.',
      });
    }
  }
  return violations;
}

/**
 * Für Zeilen mit `coverage: 'catalog-entry'` ist der Manifestwert `profile` aus dem
 * Katalogeintrag abgeleitet — hier wird die Gleichheit geprüft. Für Rezepte und Elemente ist der
 * Manifestwert die einzige Angabe; dort gibt es nichts zu vergleichen.
 */
export function checkProfileAgreement(
  entries: readonly CoverageEntry[],
  catalog: readonly CatalogEntry[],
): CoverageViolation[] {
  const byId = new Map(catalog.map((entry) => [entry.id, entry]));
  const violations: CoverageViolation[] = [];
  for (const entry of entries) {
    if (entry.coverage !== 'catalog-entry') continue;
    const target = byId.get(entry.implementation);
    if (target === undefined) {
      violations.push({
        check: 'profile-mismatch',
        key: entryKey(entry.sourceId, entry.variant),
        detail: `Kein Katalogeintrag "${entry.implementation}" — das Profil ist nicht ableitbar.`,
      });
      continue;
    }
    if (target.profile !== entry.profile) {
      violations.push({
        check: 'profile-mismatch',
        key: entryKey(entry.sourceId, entry.variant),
        detail: `Manifest nennt "${entry.profile}", der Katalogeintrag "${target.profile}".`,
      });
    }
  }
  return violations;
}

/** Kein `approved` ohne Reviewer und Datum, je Rolle. Ein Status ohne Zurechenbarkeit ist wertlos. */
export function checkReviewAttribution(entries: readonly CoverageEntry[]): CoverageViolation[] {
  const violations: CoverageViolation[] = [];
  for (const entry of entries) {
    for (const role of unattributedRoles(entry.review)) {
      violations.push({
        check: 'review-attribution',
        key: entryKey(entry.sourceId, entry.variant),
        detail: `Rolle "${role}": approved ohne Reviewer und Datum.`,
      });
    }
  }
  return violations;
}

/** Nur Ausgabe, kein Fehler: wäre sie einer, wäre CI ab dem ersten Tag dauerhaft rot. */
export function countOpenDomainReviews(entries: readonly CoverageEntry[]): number {
  return entries.filter((entry) => entry.review.domain.status !== 'approved').length;
}
```

Den Import-Kopf der Datei erweitern:

```ts
import {
  entryKey,
  unattributedRoles,
  type CatalogEntry,
  type CoverageEntry,
  type CoverageManifest,
  type ReviewSet,
  type SourceId,
} from '@einsatzzeichen/schema';
import { isRegisteredSource } from './sources.js';
```

- [ ] **Step 4: `checkCoverage` erweitern**

`checkCoverage` in derselben Datei ersetzen:

```ts
/**
 * Das CI-Gate. Die vier Prüfungen aus Slice 1 (Referenzdatei vorhanden, eindeutige Schlüssel,
 * genau eine `primary`-Darstellung) bleiben in ihren eigenen Feldern; die in Slice 2
 * hinzugekommenen Prüfungen sammeln sich in `violations`.
 */
export function checkCoverage(): {
  missing: string[];
  duplicates: string[];
  invalidPrimary: string[];
  violations: CoverageViolation[];
  openDomainReviews: number;
} {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const missing: string[] = [];

  for (const entry of COVERAGE_MANIFEST.entries) {
    const key = entryKey(entry.sourceId, entry.variant);
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
    if (entry.referenceAsset === '' || entry.implementation === '') missing.push(key);
  }

  const catalog = Object.values(BASE_SYMBOLS);
  const invalidPrimary = findPrimaryViolations(catalog);

  const violations = [
    ...checkBaselinePrefix(COVERAGE_MANIFEST.entries, COVERAGE_MANIFEST.baseline),
    ...checkCatalogSourceRefs(catalog),
    ...checkProfileAgreement(COVERAGE_MANIFEST.entries, catalog),
    ...checkReviewAttribution(COVERAGE_MANIFEST.entries),
  ];

  return {
    missing,
    duplicates,
    invalidPrimary,
    violations,
    openDomainReviews: countOpenDomainReviews(COVERAGE_MANIFEST.entries),
  };
}
```

- [ ] **Step 5: Tests laufen lassen und Erfolg prüfen**

Run: `pnpm vitest run packages/catalog/src/coverage-manifest.test.ts`
Expected: PASS

- [ ] **Step 6: Vollständig verifizieren**

Run: `pnpm typecheck && pnpm test && pnpm cli coverage`
Expected: alles grün.

- [ ] **Step 7: Commit**

```bash
git add packages/catalog/src/coverage-manifest.ts packages/catalog/src/coverage-manifest.test.ts
git commit -m "feat(catalog): Gate-Prüfungen zu Baseline-Präfix, Quellenbezug, Profil und Review"
```

---

## Task 6: Gate-Prüfungen zu Elementen und Versionen

**Files:**
- Modify: `packages/catalog/src/coverage-manifest.ts` (fünf weitere Prüfungen)
- Modify: `packages/catalog/src/coverage-manifest.test.ts`

**Interfaces:**
- Consumes: `CoverageViolation`, `checkCoverage` (Task 5), `resolveElement` (Task 4), `PROFILES` und `isDataVersion` (Task 3).
- Produces: `checkElementEntries(entries: readonly CoverageEntry[]): CoverageViolation[]`; `checkProfileRegistry(entries: readonly CoverageEntry[], profiles: readonly ProfileRecord[]): CoverageViolation[]`; `checkVersions(coreVersion: string, profiles: readonly ProfileRecord[]): CoverageViolation[]`. Prüfnamen: `'unknown-element'`, `'asset-not-in-element'`, `'unknown-profile'`, `'unknown-core-version'`, `'version-format'`. Damit sind alle neun neuen Prüfungen umgesetzt.

- [ ] **Step 1: Die fehlschlagenden Tests schreiben**

In `packages/catalog/src/coverage-manifest.test.ts` den Import um die drei neuen Funktionen erweitern und einen neuen `describe`-Block anfügen:

```ts
import { PROFILES } from './profiles.js';
```

```ts
describe('Gate-Prüfungen zu Elementen und Versionen', () => {
  it('nimmt einen Elementeintrag an, dessen ID auflösbar ist und dessen Datei ihn belegt', () => {
    const entry = fixtureCoverageEntry({
      sourceId: 'bbk-babz-2025:5.4.2',
      coverage: 'element',
      implementation: 'strength.staffel',
      referenceAsset: '5.4.2_Staffel.svg',
    });
    expect(checkElementEntries([entry])).toEqual([]);
  });

  it('meldet einen Elementeintrag mit unbekannter ID', () => {
    const entry = fixtureCoverageEntry({
      coverage: 'element',
      implementation: 'strength.kompanie',
      referenceAsset: '5.4.5_Kompanie.svg',
    });
    const [violation] = checkElementEntries([entry]);
    expect(violation?.check).toBe('unknown-element');
    expect(violation?.detail).toContain('strength.kompanie');
  });

  it('meldet einen Elementeintrag, dessen Datei das Element nicht belegt', () => {
    const entry = fixtureCoverageEntry({
      coverage: 'element',
      implementation: 'strength.staffel',
      referenceAsset: '5.4.4_Zug.svg',
    });
    const [violation] = checkElementEntries([entry]);
    expect(violation?.check).toBe('asset-not-in-element');
  });

  it('prüft Elemente nur bei coverage element, nicht bei Katalogeinträgen', () => {
    expect(checkElementEntries([fixtureCoverageEntry()])).toEqual([]);
  });

  it('nimmt einen Eintrag mit registriertem Profil an', () => {
    expect(checkProfileRegistry([fixtureCoverageEntry()], Object.values(PROFILES))).toEqual([]);
  });

  it('meldet einen Eintrag mit einem nicht registrierten Profil', () => {
    const entry = fixtureCoverageEntry({ profile: 'laender' as unknown as ProfileId });
    const [violation] = checkProfileRegistry([entry], Object.values(PROFILES));
    expect(violation?.check).toBe('unknown-profile');
    expect(violation?.detail).toContain('laender');
  });

  it('nimmt Versionen an, die der Form major.minor.patch folgen und den Kern nennen', () => {
    expect(checkVersions('0.1.0', Object.values(PROFILES))).toEqual([]);
  });

  it('meldet eine Kernversion mit falscher Form', () => {
    const [violation] = checkVersions('0.1', Object.values(PROFILES));
    expect(violation?.check).toBe('version-format');
    expect(violation?.key).toBe('coreVersion');
  });

  it('meldet ein Profil, dessen verifiedAgainstCore keine bekannte Kernversion nennt', () => {
    const stale = [{ ...PROFILES.bund, verifiedAgainstCore: '0.0.9' }];
    const [violation] = checkVersions('0.1.0', stale);
    expect(violation?.check).toBe('unknown-core-version');
    expect(violation?.detail).toContain('0.0.9');
  });

  it('meldet ein Profil mit unzulässiger Datenversion', () => {
    const broken = [{ ...PROFILES.bund, version: 'v1' }];
    const checks = checkVersions('0.1.0', broken).map((v) => v.check);
    expect(checks).toContain('version-format');
  });
});
```

- [ ] **Step 2: Tests laufen lassen und Fehlschlag prüfen**

Run: `pnpm vitest run packages/catalog/src/coverage-manifest.test.ts`
Expected: FAIL — `checkElementEntries is not a function` (bzw. Importfehler)

- [ ] **Step 3: Die drei Prüffunktionen implementieren**

In `packages/catalog/src/coverage-manifest.ts` unterhalb von `countOpenDomainReviews` einfügen:

```ts
/**
 * `resolveElement` wirft bei unbekannter ID — für das Gate ist eine unbekannte ID aber ein
 * Befund und kein Abbruch. Dieser Wrapper übersetzt das eine ins andere, ohne dass
 * `resolveElement` seine Wurf-Semantik aufgeben muss.
 */
function tryResolveElement(id: string): ElementDescriptor | undefined {
  try {
    return resolveElement(id);
  } catch {
    return undefined;
  }
}

/**
 * Jeder Eintrag mit `coverage: 'element'` muss über `resolveElement` auflösbar sein, und seine
 * genannte Referenzdatei muss in den Belegstellen des Deskriptors vorkommen — damit kann ein
 * Eintrag keine Datei nennen, die das Element nicht belegt.
 */
export function checkElementEntries(entries: readonly CoverageEntry[]): CoverageViolation[] {
  const violations: CoverageViolation[] = [];
  for (const entry of entries) {
    if (entry.coverage !== 'element') continue;
    const key = entryKey(entry.sourceId, entry.variant);
    const descriptor = tryResolveElement(entry.implementation);
    if (descriptor === undefined) {
      violations.push({
        check: 'unknown-element',
        key,
        detail: `Element "${entry.implementation}" ist im Katalog nicht auflösbar.`,
      });
      continue;
    }
    if (!descriptor.referenceAssets.includes(entry.referenceAsset)) {
      violations.push({
        check: 'asset-not-in-element',
        key,
        detail: `"${entry.referenceAsset}" belegt "${entry.implementation}" nicht.`,
      });
    }
  }
  return violations;
}

/**
 * Jeder Eintrag trägt ein im Profilregister existierendes Profil. Der Typ `ProfileId` deckt das
 * für sauber getippte Daten ab; diese Prüfung fängt Einträge, die über eine Typzusicherung oder
 * aus einer künftigen externen Quelle ins Manifest gelangen.
 */
export function checkProfileRegistry(
  entries: readonly CoverageEntry[],
  profiles: readonly ProfileRecord[],
): CoverageViolation[] {
  const known = new Set<string>(profiles.map((record) => record.id));
  const violations: CoverageViolation[] = [];
  for (const entry of entries) {
    if (!known.has(entry.profile)) {
      violations.push({
        check: 'unknown-profile',
        key: entryKey(entry.sourceId, entry.variant),
        detail: `Profil "${entry.profile}" ist nicht registriert.`,
      });
    }
  }
  return violations;
}

/**
 * Jede Datenversion hat die Form `major.minor.patch`, und `verifiedAgainstCore` jedes Profils
 * nennt eine bekannte Kernversion. Für den Kern selbst gilt
 * `verifiedAgainstCore === version === coreVersion`; die Menge der bekannten Kernversionen ist
 * heute einelementig und wächst, sobald eine Versionshistorie geführt wird.
 */
export function checkVersions(
  coreVersion: string,
  profiles: readonly ProfileRecord[],
): CoverageViolation[] {
  const violations: CoverageViolation[] = [];
  if (!isDataVersion(coreVersion)) {
    violations.push({
      check: 'version-format',
      key: 'coreVersion',
      detail: `"${coreVersion}" hat nicht die Form major.minor.patch.`,
    });
  }

  const knownCoreVersions = new Set([coreVersion]);

  for (const record of profiles) {
    if (!isDataVersion(record.version)) {
      violations.push({
        check: 'version-format',
        key: `profile:${record.id}`,
        detail: `version "${record.version}" hat nicht die Form major.minor.patch.`,
      });
    }
    if (!isDataVersion(record.verifiedAgainstCore)) {
      violations.push({
        check: 'version-format',
        key: `profile:${record.id}`,
        detail: `verifiedAgainstCore "${record.verifiedAgainstCore}" hat nicht die Form major.minor.patch.`,
      });
    } else if (!knownCoreVersions.has(record.verifiedAgainstCore)) {
      violations.push({
        check: 'unknown-core-version',
        key: `profile:${record.id}`,
        detail: `verifiedAgainstCore "${record.verifiedAgainstCore}" ist keine bekannte Kernversion.`,
      });
    }
  }
  return violations;
}
```

Den Import-Kopf um `isDataVersion`, `type ProfileRecord`, `PROFILES` und `type ElementDescriptor` erweitern (`resolveElement` ist seit Task 4 bereits importiert):

```ts
import {
  entryKey,
  isDataVersion,
  unattributedRoles,
  type CatalogEntry,
  type CoverageEntry,
  type CoverageManifest,
  type ProfileRecord,
  type ReviewSet,
  type SourceId,
} from '@einsatzzeichen/schema';
import { resolveElement, type ElementDescriptor } from './elements.js';
import { PROFILES } from './profiles.js';
```

- [ ] **Step 4: Die drei Prüfungen ins Gate hängen**

In `checkCoverage` das `violations`-Array erweitern:

```ts
  const violations = [
    ...checkBaselinePrefix(COVERAGE_MANIFEST.entries, COVERAGE_MANIFEST.baseline),
    ...checkCatalogSourceRefs(catalog),
    ...checkProfileAgreement(COVERAGE_MANIFEST.entries, catalog),
    ...checkReviewAttribution(COVERAGE_MANIFEST.entries),
    ...checkElementEntries(COVERAGE_MANIFEST.entries),
    ...checkProfileRegistry(COVERAGE_MANIFEST.entries, Object.values(PROFILES)),
    ...checkVersions(COVERAGE_MANIFEST.coreVersion, Object.values(PROFILES)),
  ];
```

- [ ] **Step 5: Tests laufen lassen und Erfolg prüfen**

Run: `pnpm vitest run packages/catalog/src/coverage-manifest.test.ts`
Expected: PASS

- [ ] **Step 6: Vollständig verifizieren**

Run: `pnpm typecheck && pnpm test && pnpm cli coverage`
Expected: alles grün.

- [ ] **Step 7: Commit**

```bash
git add packages/catalog/src/coverage-manifest.ts packages/catalog/src/coverage-manifest.test.ts
git commit -m "feat(catalog): Gate-Prüfungen zu Elementauflösung, Profilregister und Datenversionen"
```

---

## Task 7: `releaseBlockers()`

**Files:**
- Modify: `packages/catalog/src/coverage-manifest.ts`
- Modify: `packages/catalog/src/coverage-manifest.test.ts`

**Interfaces:**
- Consumes: `COVERAGE_MANIFEST` (Task 3/4).
- Produces: `interface ReleaseBlockers { domainReviewPending: string[]; withoutTestEvidence: string[]; uncoveredScope: string[] }`; `function releaseBlockers(): ReleaseBlockers`.

**Kontext:** `releaseBlockers()` macht das 1.0-Gate der Vision erstmals ausführbar, ohne es scharf zu stellen. Es läuft als Test, nicht als CI-Abbruch. **Ein ungeklärter Lizenzstatus ist ausdrücklich kein Release-Blocker** — wäre er einer, wäre `babz-svg-2025` ein dauerhafter Blocker, obwohl die Architektur die unklare Lage bereits beantwortet (abgeleitete Kennzahlen statt Dateien).

Der Scope enthält sowohl Kapitelpräfixe (`'1'`, `'2'`, `'5.4'`) als auch vollständige Abschnittsnummern (`'C.1.1'`, `'D.3.7'`). Ein Scope-Eintrag gilt als abgedeckt, wenn die Abschnittsnummer eines Manifest-Eintrags ihm gleicht **oder** mit ihm plus Punkt beginnt.

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

In `packages/catalog/src/coverage-manifest.test.ts` anfügen:

```ts
describe('Release-Blocker für 1.0', () => {
  it('führt jeden Eintrag ohne fachliches Review als Blocker', () => {
    const blockers = releaseBlockers();
    expect(blockers.domainReviewPending).toHaveLength(COVERAGE_MANIFEST.entries.length);
  });

  it('führt genau die zwölf Elementeinträge als ohne Testnachweis', () => {
    const blockers = releaseBlockers();
    expect(blockers.withoutTestEvidence).toHaveLength(12);
    for (const key of blockers.withoutTestEvidence) {
      const entry = COVERAGE_MANIFEST.entries.find(
        (e) => entryKey(e.sourceId, e.variant) === key,
      );
      expect(entry?.coverage).toBe('element');
    }
  });

  it('meldet keinen Scope-Eintrag ohne Manifest-Eintrag', () => {
    expect(releaseBlockers().uncoveredScope).toEqual([]);
  });

  it('erkennt Kapitelpräfixe und vollständige Abschnittsnummern gleichermaßen als abgedeckt', () => {
    const sections = COVERAGE_MANIFEST.entries.map((e) => e.sourceId.split(':')[1] ?? '');
    expect(sections).toContain('1.1');
    expect(sections).toContain('5.4.2');
    expect(sections).toContain('C.1.1');
  });

  it('ist ein Testbefund, kein CI-Abbruch: das Gate bleibt trotz offener Blocker grün', () => {
    expect(releaseBlockers().domainReviewPending.length).toBeGreaterThan(0);
    expect(checkCoverage().violations).toEqual([]);
  });
});
```

Den Import in der Testdatei um `releaseBlockers` erweitern.

- [ ] **Step 2: Test laufen lassen und Fehlschlag prüfen**

Run: `pnpm vitest run packages/catalog/src/coverage-manifest.test.ts -t "Release-Blocker"`
Expected: FAIL — `releaseBlockers is not a function` (bzw. Importfehler)

- [ ] **Step 3: `releaseBlockers` implementieren**

In `packages/catalog/src/coverage-manifest.ts` am Dateiende anfügen:

```ts
export interface ReleaseBlockers {
  /** Manifestschlüssel der Einträge ohne abgeschlossenes fachliches Review. */
  domainReviewPending: string[];
  /** Manifestschlüssel der Einträge ohne Fingerprint- oder Snapshot-Nachweis. */
  withoutTestEvidence: string[];
  /** Kapitel im Scope, die kein einziger Eintrag trägt. */
  uncoveredScope: string[];
}

/** Abschnittsnummer eines Manifest-Eintrags, also der Teil hinter dem Baseline-Präfix. */
function sectionOf(sourceId: string): string {
  const separator = sourceId.indexOf(':');
  return separator === -1 ? sourceId : sourceId.slice(separator + 1);
}

/**
 * Was Release 1.0 nach den Vision-Kriterien noch blockiert. Läuft als Test, nicht als CI-Abbruch:
 * die Ausgabe ist stabil und prüfbar, aber ein offener Punkt lässt die Pipeline nicht scheitern.
 *
 * Ein ungeklärter Lizenzstatus ist ausdrücklich **kein** Blocker. Wäre er einer, wäre
 * `babz-svg-2025` ein dauerhafter Blocker — und die Architektur beantwortet die unklare Lage
 * bereits: abgeleitete Kennzahlen statt Dateien, eigenständige Geometrie statt übernommener Pfade.
 */
export function releaseBlockers(): ReleaseBlockers {
  const domainReviewPending: string[] = [];
  const withoutTestEvidence: string[] = [];

  for (const entry of COVERAGE_MANIFEST.entries) {
    const key = entryKey(entry.sourceId, entry.variant);
    if (entry.review.domain.status !== 'approved') domainReviewPending.push(key);
    if (!entry.fingerprintTest || !entry.snapshotTest) withoutTestEvidence.push(key);
  }

  const sections = COVERAGE_MANIFEST.entries.map((entry) => sectionOf(entry.sourceId));
  const uncoveredScope = COVERAGE_MANIFEST.scope.filter(
    (chapter) =>
      !sections.some((section) => section === chapter || section.startsWith(`${chapter}.`)),
  );

  return { domainReviewPending, withoutTestEvidence, uncoveredScope };
}
```

- [ ] **Step 4: Test laufen lassen und Erfolg prüfen**

Run: `pnpm vitest run packages/catalog/src/coverage-manifest.test.ts`
Expected: PASS

- [ ] **Step 5: Vollständig verifizieren**

Run: `pnpm typecheck && pnpm test && pnpm cli coverage`
Expected: alles grün.

- [ ] **Step 6: Commit**

```bash
git add packages/catalog/src/coverage-manifest.ts packages/catalog/src/coverage-manifest.test.ts
git commit -m "feat(catalog): releaseBlockers listet die offenen 1.0-Punkte"
```

---

## Task 8: CLI-Ausgabe und Dokumentation

**Files:**
- Modify: `packages/cli/src/commands/coverage.ts`
- Modify: `README.md` (Abschnitt „Aufruf", Beschreibung von `coverage`)

**Interfaces:**
- Consumes: `checkCoverage`, `releaseBlockers`, `COVERAGE_MANIFEST`, `profileFor`, `SOURCE_REGISTRY` aus `@einsatzzeichen/catalog`.
- Produces: nichts, was spätere Tasks konsumieren.

**Kontext:** `profileFor` bekommt hier seinen Konsumenten — das CLI gibt die Datenversion des Kernprofils aus. Die Zahl offener fachlicher Reviews und die Release-Blocker werden ausgegeben, führen aber **nicht** zu `process.exit(1)`. Nur die drei Slice-1-Listen und `violations` sind Fehler.

- [ ] **Step 1: `packages/cli/src/commands/coverage.ts` ersetzen**

```ts
import {
  COVERAGE_MANIFEST,
  SOURCE_REGISTRY,
  checkCoverage,
  profileFor,
  releaseBlockers,
} from '@einsatzzeichen/catalog';

export function coverage(): void {
  const { missing, duplicates, invalidPrimary, violations, openDomainReviews } = checkCoverage();
  const core = profileFor('bund');

  console.log(`Baseline:    ${COVERAGE_MANIFEST.baseline}`);
  console.log(`Kernversion: ${COVERAGE_MANIFEST.coreVersion} (Profil "${core.id}": ${core.version})`);
  console.log(`Umfang:      ${COVERAGE_MANIFEST.scope.join(', ')}`);
  console.log(`Einträge:    ${COVERAGE_MANIFEST.entries.length}`);
  console.log(`Quellen:     ${Object.keys(SOURCE_REGISTRY).length}`);

  for (const key of duplicates) console.error(`Doppelter Schlüssel: ${key}`);
  for (const key of missing) console.error(`Unvollständiger Eintrag: ${key}`);
  for (const id of invalidPrimary) console.error(`Keine genau eine primary-Darstellung: ${id}`);
  for (const v of violations) console.error(`[${v.check}] ${v.key}: ${v.detail}`);

  // Ab hier nur noch Ausgabe. Wäre ein offenes fachliches Review ein Fehler, wäre CI ab dem
  // ersten Tag dauerhaft rot — genau die Situation, in der Gates ignoriert werden.
  const blockers = releaseBlockers();
  console.log(`Offene fachliche Reviews: ${openDomainReviews}`);
  console.log(`1.0-Blocker: ${blockers.domainReviewPending.length} ohne fachliches Review, ` +
    `${blockers.withoutTestEvidence.length} ohne Testnachweis, ` +
    `${blockers.uncoveredScope.length} Kapitel ohne Eintrag`);
  for (const chapter of blockers.uncoveredScope) {
    console.log(`  Kapitel ohne Eintrag: ${chapter}`);
  }

  if (
    duplicates.length > 0 ||
    missing.length > 0 ||
    invalidPrimary.length > 0 ||
    violations.length > 0
  ) {
    process.exit(1);
  }
  console.log('Coverage-Gate bestanden.');
}
```

- [ ] **Step 2: Die Ausgabe prüfen**

Run: `pnpm cli coverage`
Expected: Ausgabe mit `Kernversion: 0.1.0 (Profil "bund": 0.1.0)`, `Einträge:    23`, `Quellen:     11`, `Offene fachliche Reviews: 23`, `1.0-Blocker: 23 ohne fachliches Review, 12 ohne Testnachweis, 0 Kapitel ohne Eintrag`, abschließend `Coverage-Gate bestanden.` und Exitcode 0.

Prüfen: `pnpm cli coverage; echo $status` (fish) muss `0` ausgeben.

- [ ] **Step 3: Das README nachziehen**

In `README.md` in der Pakettabelle die `catalog`-Zeile ersetzen:

```
| `catalog` | Grundzeichen, Organisationsfarben, Stärkeangaben, Fähigkeiten, Kompositionsrezepte, Quellenregister, Profilregister, Elementregister, Coverage-Manifest. |
```

Und im Abschnitt „Aufruf" den Aufzählungspunkt zu `coverage` ersetzen:

```
- `coverage` — prüft das Coverage-Manifest gegen den Katalog (Coverage-Gate): Schlüssel,
  Vollständigkeit, Baseline-Präfix, Quellenbezug, Profil, Reviewzurechnung, Elementauflösung und
  Datenversionen. Gibt zusätzlich die Zahl offener fachlicher Reviews und die 1.0-Blocker aus —
  beides ohne Fehlerabbruch, weil CI sonst ab dem ersten Tag dauerhaft rot wäre.
```

Vor der Zeile `## Die Millimeter-Regel` einen neuen Abschnitt einfügen:

```markdown
## Provenienz

Jeder Katalogeintrag, Manifest-Eintrag, jede Quelle und jedes Profil trägt dieselbe Reviewform:
ein **technisches** und ein **fachliches** Review, beide Pflicht. Ein `approved` ohne Reviewer und
Datum lässt das Coverage-Gate fehlschlagen — ein Status ohne Zurechenbarkeit ist wertlos. Das
fachliche Review steht derzeit bei allen Einträgen offen; die Struktur macht das sichtbar, statt
es zu verdecken.

`packages/catalog/src/sources.ts` führt die elf Quellen der Referenzhierarchie mit
Nutzungsgrundlage, Beschaffungsstand und Umgang mit der Geometrie. Für die BABZ-Assets ist die
Lizenzlage `unclear`; die Konsequenz — abgeleitete Kennzahlen statt Dateien — steht damit
maschinenlesbar im Register und nicht nur in Prosa.

Kern und Profile tragen **eigene Datenversionen** (`CoverageManifest.coreVersion`,
`ProfileRecord.version`), unabhängig von den npm-Paketversionen. Der bundesweite Kern ist selbst
das erste registrierte Profil (`bund`); `CatalogEntry.profile` ist Pflichtfeld, damit „kein Profil
angegeben" nicht mit „gehört zum Kern" verwechselbar ist.
```

- [ ] **Step 4: Vollständig verifizieren**

Run: `pnpm typecheck && pnpm test && pnpm cli coverage`
Expected: alles grün.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/commands/coverage.ts README.md
git commit -m "feat(cli): Coverage-Ausgabe um Versionen, Quellen, offene Reviews und 1.0-Blocker"
```

---

## Abschluss: Erfolgskriterien der Spec prüfen

Nach Task 8 ist der Slice fertig. Diese Liste ist der Abgleich mit Spec-Abschnitt 12 — jeder Punkt ist mit einem bereits geschriebenen Test oder Kommando belegt, es ist nichts mehr zu implementieren.

| Kriterium der Spec | Beleg |
|---|---|
| 1. Elf Quellen mit Nutzungsgrundlage, Geometrieumgang und Beschaffungsstatus, typerzwungen | `packages/catalog/src/sources.test.ts`, `satisfies Record<SourceId, SourceRecord>` |
| 2. Kein Manifest-Eintrag ohne beide Rollen, kein `approved` ohne Zurechnung | `packages/schema/src/review.test.ts`, `checkReviewAttribution` |
| 3. Elf Einträge migriert, fachliches Review offen, Zahl in der `coverage`-Ausgabe | Manifest-Test „beide Reviewrollen", CLI-Zeile `Offene fachliche Reviews` |
| 4. `profile` Pflichtfeld, eigene Kernversion, Form und Konsistenz gegated | `pnpm typecheck`, `checkVersions`, `profiles.test.ts` |
| 5. 23 Einträge, jede Element-ID auflösbar, unbekannte ID lässt das Gate fehlschlagen | Manifest-Test „führt 23 Einträge", `checkElementEntries` |
| 6. `'org-profile'` und `'organization-specific'` entfernt, kein Wert ohne Konsument | `grep -rn "org-profile\|organization-specific" packages/` findet keinen Treffer |
| 7. `releaseBlockers()` gibt die offenen 1.0-Punkte aus und ist durch einen Test belegt | `describe('Release-Blocker für 1.0')` |
| 8. CI grün ohne Referenzbestand, `schema` und `core` ohne Laufzeitabhängigkeiten | `.github/workflows/ci.yml` läuft ohne `taktische-zeichen/`; keine Task fügt eine Dependency hinzu |

- [ ] **Abschlussprüfung**

```bash
pnpm typecheck && pnpm test && pnpm cli coverage
grep -rn "org-profile\|organization-specific" packages/ --include="*.ts"
```

Expected: alles grün; der `grep` findet keinen Treffer.
