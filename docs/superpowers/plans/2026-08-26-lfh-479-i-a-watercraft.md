# LFH-479 I-a Watercraft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Every production change uses
> `superpowers:test-driven-development`; every task receives a fresh specification and quality
> review before the next task begins. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the first LFH-419 slice, ClickUp LFH-479, as three measured Anhang-I
watercraft representations (`I.3.5` through `I.3.7`) with exact provenance, regression snapshots,
an output-only screenshot, and a draft pull request.

**Architecture:** Add one geometry-only `inset-hull` variant to the existing `vehicle-water`
body contract. Keep organization, labels, and recipe identity in their existing layers: the body
variant selects the measured hull, the layout profile supplies its measured vertical center, the
validator restricts the variant to a white Hilfsorganisation body and measured center-label
placement, and a dedicated Anhang-I recipe module registers the three catalog entries. Coverage
and domain review remain explicit and narrow; the screenshot is generated only from catalog
outputs and never embeds source references.

**Tech Stack:** TypeScript 5.9, Vitest 3.2, Resvg 2.6, pnpm 11.20.0, Node.js 22,
`@einsatzzeichen/schema`, `@einsatzzeichen/core`, `@einsatzzeichen/catalog`

**Spec:** `docs/superpowers/specs/2026-08-26-lfh-479-i-a-watercraft-design.md`

## Global constraints

- Run every shell command with `rtk` as required by the repository instructions.
- Work only in
  `/Users/rubeen/.codex/worktrees/0f93/taktik` on branch
  `feat/lfh-419-anhang-i-watercraft`.
- The immutable baseline is `origin/main` at
  `86c1e505014b43fd99d6135f67a497b643d60af0`; the approved design commit is
  `4444279b8e28dad2b9843a730290ad39da3bd8be`.
- Follow strict RED-GREEN-REFACTOR. A RED step is valid only when the named assertion fails for
  the intended missing contract, not because of an import, syntax, fixture, or environment error.
- Do not update snapshots until semantic geometry, validation, and recipe assertions are green.
- `inset-hull` is a geometry name, not an operational classification. It is valid only for
  `vehicle-water` and does not change the existing normal or `raised-hull` bodies.
- The three LFH-479 recipes require `organization: 'hilfsorganisation'`. They may use only
  `labels.center`; the variant itself must remain valid without any label so later LFH-480 boats
  are not forced into an unmeasured label contract.
- Do not claim visual identity with E.2. Do not broaden the coverage scope to `I` or `I.3`.
- Every new manifest entry is `technical: approved`, `domain: pending`. The white body is a
  deliberate technical rendering decision while the source's organization semantics remain open.
- Original BBK/BABZ SVGs are local evidence only. Do not commit, upload, base64-embed, or expose
  them. The PR screenshot must contain generated catalog output only.
- Keep the generator and generated evidence under ignored `out/` paths. Commit only production
  code, tests, snapshots, decision records, and text review records.
- ClickUp moves forward only: LFH-479 to `ready for development` before execution,
  `in development` at the first valid RED, `in review` after implementation and independent
  review, and `testing` only after the complete gate is green. LFH-419 remains `scoping`.
- Use `rtk git -c core.fsmonitor=false ...` for Git commands in this worktree.
- Commit after each completed task. Do not push until the final verification and independent
  review are both green.

## Expected deltas

| Metric | Baseline | LFH-479 |
|---|---:|---:|
| recipes | 137 | 140 |
| render cases | 405 | 408 |
| coverage manifest rows | 424 | 427 |
| direct SVG snapshots | 151 | 154 |
| multi-size snapshot sheets | 406 | 409 |

The package test count starts at 4,052 and will increase with the assertions below; do not pin a
new global test count merely to make the suite pass.

---

## Task 1: Add the measured inset hull and its kind allowlist

**Files:**

- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/catalog/src/base-symbols.ts`
- Test: `packages/catalog/src/base-symbols.test.ts`
- Modify: `packages/core/src/validate.ts`
- Test: `packages/core/src/validate.test.ts`

### 1.1 RED — geometry and kind boundary

- [ ] Add a base-symbol test named
  `trifft die drei LFH-479-Referenzen mit dem vermessenen inset-hull`. Use
  `const insetHull = 'inset-hull' as BodyVariantId`, load the three local assets named below via
  the existing test helper, and assert the body fingerprint of
  `baseDrawing('vehicle-water', insetHull)` against every source fingerprint:

```ts
const assets = [
  'I.3.5_Mehrzweckboot.svg',
  'I.3.6_Mehrzweckarbeitsboot.svg',
  'I.3.7_Mehrzweckponton.svg',
] as const;

for (const asset of assets) {
  expect(matchFingerprint(baseDrawing('vehicle-water', insetHull), fingerprintFor(asset))).toEqual({
    ok: true,
    problems: [],
  });
}
```

- [ ] In the same file add
  `hält normal, raised-hull und inset-hull geometrisch getrennt`. Assert the new body has
  `minY: 9.0001`, `maxY: 23.9898`, and differs beyond the existing geometry tolerance from both
  other water bodies. Add `lässt inset-hull bei Land und Luft nicht als Fallback zu` and assert
  `baseDrawing('vehicle-land', insetHull)` and `baseDrawing('vehicle-air', insetHull)` throw with
  `/Körpervariante/`.
- [ ] In `validate.test.ts`, add a narrow allowlist test. A `vehicle-water` spec with the cast
  variant must not receive `body-variant-requires-measured-kind`; the same variant on
  `vehicle-land` must receive that rule.
- [ ] Run RED and record that the failure is the missing variant/geometry contract:

```bash
rtk proxy ./node_modules/.bin/vitest run \
  packages/catalog/src/base-symbols.test.ts \
  packages/core/src/validate.test.ts
```

### 1.2 GREEN — schema, geometry, and allowlist

- [ ] Add `'inset-hull'` to `BodyVariantId` in `packages/schema/src/taxonomy.ts`. Document it as
  a measured inset lower semicircle for Anhang-I watercraft; do not mention Mehrzweck semantics
  in the type name or comment.
- [ ] Add the following exact geometry to `VARIANT_BODIES['vehicle-water']` in
  `base-symbols.ts`:

```ts
'inset-hull': {
  type: 'path',
  role: 'body',
  d: halfCircleBelowChord(15.9997, 9.0001, 14.9897),
  style: OUTLINE,
},
```

  Its serialized outline must remain:

```text
M 1.01 9.0001 L 30.9894 9.0001 C 30.9894 17.2787, 24.2783 23.9898, 15.9997 23.9898 C 7.7211 23.9898, 1.01 17.2787, 1.01 9.0001 Z
```

- [ ] Add `'inset-hull': new Set<SymbolKind>(['vehicle-water'])` to the exhaustive
  `BODY_VARIANT_KINDS: Readonly<Record<BodyVariantId, ReadonlySet<SymbolKind>>>` map in
  `validate.ts`. Do not add fallback behavior to `baseDrawing`.
- [ ] Run the focused tests and typecheck:

```bash
rtk proxy ./node_modules/.bin/vitest run \
  packages/catalog/src/base-symbols.test.ts \
  packages/core/src/validate.test.ts
rtk proxy ./node_modules/.bin/tsc --noEmit
```

- [ ] Review the diff for preservation of the normal and `raised-hull` cases, then commit:

```bash
rtk git -c core.fsmonitor=false diff --check
rtk git -c core.fsmonitor=false add \
  packages/schema/src/taxonomy.ts \
  packages/catalog/src/base-symbols.ts \
  packages/catalog/src/base-symbols.test.ts \
  packages/core/src/validate.ts \
  packages/core/src/validate.test.ts
rtk git -c core.fsmonitor=false commit -m "feat(schema): add measured inset watercraft hull variant"
```

---

## Task 2: Add the measured layout profile and strict composition guard

**Files:**

- Modify: `packages/core/src/layout/profiles.ts`
- Test: `packages/core/src/layout/profiles.test.ts`
- Modify: `packages/core/src/validate.ts`
- Test: `packages/core/src/validate.test.ts`

### 2.1 RED — profile, organization, and label-zone contracts

- [ ] Add a profile test asserting
  `profileFor('vehicle-water', 'inset-hull')` uses `rectBody(7.99)`, yielding an absolute center
  baseline of approximately `15.9999`. Assert the existing normal and `raised-hull` water profile
  still uses `rectBody(6.9896)`.
- [ ] Add this valid fixture in `validate.test.ts`:

```ts
const validInsetWatercraft = {
  kind: 'vehicle-water',
  bodyVariant: 'inset-hull',
  organization: 'hilfsorganisation',
  labels: { center: 'MzB' },
} as const satisfies SymbolSpec;
```

- [ ] Assert the fixture has no validation errors. Assert variants with organization omitted or
  replaced by `thw` or `feuerwehr` receive `inset-hull-requires-hilfsorganisation`.
- [ ] With `it.each`, set each existing non-center label field individually—`bottomLeft`,
  `bottomCenter`, `bottomRight`, `topLeft`, `topLeftMetrics`, `aboveLeft`, `topLeftLines`, and
  `belowRight`—and assert `inset-hull-requires-center-label-only`. Assert a `designation` receives
  the same rule.
- [ ] Lock the future LFH-480 boundary: an otherwise valid `inset-hull` spec with no `labels` at
  all is accepted. Do not introduce `inset-hull-requires-center-label`.
- [ ] Reassert that an existing `vehicle-water`/`raised-hull` spec is unchanged by these rules.
- [ ] Run RED:

```bash
rtk proxy ./node_modules/.bin/vitest run \
  packages/core/src/layout/profiles.test.ts \
  packages/core/src/validate.test.ts
```

### 2.2 GREEN — profile and validator

- [ ] Add one immutable profile beside the existing water profile and dispatch it before the
  generic water return:

```ts
const insetVehicleWaterProfile: LayoutProfile = rectBody(7.99);

// Inside profileFor:
if (kind === 'vehicle-water' && variant === 'inset-hull') {
  return insetVehicleWaterProfile;
}
```

- [ ] Add the following branch to `validateSpec`, reusing the current `labels` value and current
  problem-collection idiom:

```ts
const isInsetWatercraft =
  spec.kind === 'vehicle-water' && spec.bodyVariant === 'inset-hull';

if (isInsetWatercraft && spec.organization !== 'hilfsorganisation') {
  issues.push({
    rule: 'inset-hull-requires-hilfsorganisation',
    message: 'inset-hull requires the measured white Hilfsorganisation body.',
  });
}

if (isInsetWatercraft) {
  const hasUnmeasuredLabelZone =
    labels?.bottomLeft !== undefined ||
    labels?.bottomCenter !== undefined ||
    labels?.bottomRight !== undefined ||
    labels?.topLeft !== undefined ||
    labels?.topLeftMetrics !== undefined ||
    labels?.aboveLeft !== undefined ||
    labels?.topLeftLines !== undefined ||
    labels?.belowRight !== undefined;

  if (hasUnmeasuredLabelZone || spec.designation !== undefined) {
    issues.push({
      rule: 'inset-hull-requires-center-label-only',
      message: 'inset-hull supports only the measured center label zone.',
    });
  }
}
```

  Adapt only object shape and wording to the existing `ValidationProblem` convention; preserve
  the exact rule IDs. Do not duplicate the generic `centerCapHeightMm` dependency checks.
- [ ] Run focused tests, all core tests, and typecheck:

```bash
rtk proxy ./node_modules/.bin/vitest run \
  packages/core/src/layout/profiles.test.ts \
  packages/core/src/validate.test.ts
rtk proxy ./node_modules/.bin/vitest run packages/core/src
rtk proxy ./node_modules/.bin/tsc --noEmit
```

- [ ] Review and commit:

```bash
rtk git -c core.fsmonitor=false diff --check
rtk git -c core.fsmonitor=false add \
  packages/core/src/layout/profiles.ts \
  packages/core/src/layout/profiles.test.ts \
  packages/core/src/validate.ts \
  packages/core/src/validate.test.ts
rtk git -c core.fsmonitor=false commit -m "feat(core): constrain inset watercraft composition"
```

---

## Task 3: Register the three LFH-479 recipes

**Files:**

- Create: `packages/catalog/src/recipes-anhang-i.ts`
- Modify: `packages/catalog/src/recipes.ts`
- Test: `packages/catalog/src/recipes.test.ts`
- Test: `packages/catalog/src/render-cases.test.ts`

### 3.1 RED — exact recipe matrix and composition semantics

- [ ] In `recipes.test.ts`, add an exact matrix test for only these entries:

```ts
const expected = {
  'I.3.5': ['Mehrzweckboot', 'I.3.5_Mehrzweckboot.svg', 'MzB'],
  'I.3.6': ['Mehrzweckarbeitsboot', 'I.3.6_Mehrzweckarbeitsboot.svg', 'MzAB'],
  'I.3.7': ['Mehrzweckponton', 'I.3.7_Mehrzweckponton.svg', 'MzPt'],
} as const;
```

  For every row assert `vehicle-water`, `inset-hull`, `hilfsorganisation`, the exact
  `labels.center`, no `designation`, and no other label zone. Compose every recipe and assert:
  validation is green, the body outline is the measured inset hull, label primitives are black,
  and the center-label baseline is approximately `15.9999`.
- [ ] Add a cross-layer geometry assertion that the composed body fingerprint for each recipe
  matches its named local asset. This complements rather than replaces the base-symbol contract.
- [ ] Update the explicit recipe count from 137 to 140 and the render-case expectations from 405
  to 408, including the recipe-case count from 137 to 140.
- [ ] Run RED and confirm exactly the three absent keys/count delta fail:

```bash
rtk proxy ./node_modules/.bin/vitest run \
  packages/catalog/src/recipes.test.ts \
  packages/catalog/src/render-cases.test.ts
```

### 3.2 GREEN — dedicated Anhang-I module

- [ ] Create `recipes-anhang-i.ts` with no duplicated geometry:

```ts
import type { Recipe } from './recipes.js';

export const ANHANG_I_A_RECIPES = {
  'I.3.5': {
    title: 'Mehrzweckboot',
    referenceAsset: 'I.3.5_Mehrzweckboot.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
      labels: { center: 'MzB' },
    },
  },
  'I.3.6': {
    title: 'Mehrzweckarbeitsboot',
    referenceAsset: 'I.3.6_Mehrzweckarbeitsboot.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
      labels: { center: 'MzAB' },
    },
  },
  'I.3.7': {
    title: 'Mehrzweckponton',
    referenceAsset: 'I.3.7_Mehrzweckponton.svg',
    spec: {
      kind: 'vehicle-water',
      bodyVariant: 'inset-hull',
      organization: 'hilfsorganisation',
      labels: { center: 'MzPt' },
    },
  },
} as const satisfies Record<string, Recipe>;
```

- [ ] Import and spread `ANHANG_I_A_RECIPES` into `RECIPES` at the alphabetically appropriate
  Anhang boundary. Do not add I.3.1–I.3.4 or any placeholder entries.
- [ ] Run focused catalog tests and typecheck:

```bash
rtk proxy ./node_modules/.bin/vitest run \
  packages/catalog/src/recipes.test.ts \
  packages/catalog/src/render-cases.test.ts
rtk proxy ./node_modules/.bin/tsc --noEmit
```

- [ ] Review and commit:

```bash
rtk git -c core.fsmonitor=false diff --check
rtk git -c core.fsmonitor=false add \
  packages/catalog/src/recipes-anhang-i.ts \
  packages/catalog/src/recipes.ts \
  packages/catalog/src/recipes.test.ts \
  packages/catalog/src/render-cases.test.ts
rtk git -c core.fsmonitor=false commit -m "feat(catalog): add LFH-479 watercraft recipes"
```

---

## Task 4: Gate render regressions, then approve narrow provenance

The order inside this task is deliberate: the three technical reviews are not marked approved
until semantic recipe tests and both snapshot families have passed. This implements the design
rule that technical approval follows green gates rather than predicting them.

**Files:**

- Test: `packages/catalog/src/snapshots.test.ts`
- Test: `packages/catalog/src/multi-size-snapshots.test.ts`
- Create: `packages/catalog/src/__snapshots__/I.3.5.svg`
- Create: `packages/catalog/src/__snapshots__/I.3.6.svg`
- Create: `packages/catalog/src/__snapshots__/I.3.7.svg`
- Create: `packages/catalog/src/__snapshots__/multi-size/recipe.I.3.5.svg`
- Create: `packages/catalog/src/__snapshots__/multi-size/recipe.I.3.6.svg`
- Create: `packages/catalog/src/__snapshots__/multi-size/recipe.I.3.7.svg`
- Modify: `packages/catalog/src/coverage-manifest.ts`
- Test: `packages/catalog/src/coverage-manifest.test.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`
- Test: `packages/catalog/src/domain-reviews.test.ts`
- Test: `packages/catalog/src/render-cases.test.ts`

### 4.1 RED — snapshot inventories

- [ ] Change the direct snapshot inventory expectation from 151 to 154 and the multi-size
  inventory from 406 to 409. Add explicit expectations for the six paths above.
- [ ] Run both tests without update mode. Confirm the only failures are the six missing files and
  their inventory deltas:

```bash
rtk proxy ./node_modules/.bin/vitest run \
  packages/catalog/src/snapshots.test.ts \
  packages/catalog/src/multi-size-snapshots.test.ts
```

### 4.2 GREEN — controlled snapshot generation

- [ ] Generate snapshots only after Tasks 1–3 semantic assertions are green:

```bash
rtk proxy ./node_modules/.bin/vitest run -u \
  packages/catalog/src/snapshots.test.ts \
  packages/catalog/src/multi-size-snapshots.test.ts
```

- [ ] Verify Git lists exactly six new SVGs plus the two intended inventory-test edits; no
  pre-existing snapshot may be modified. Read the six files and verify the measured inset path,
  the labels `MzB`, `MzAB`, `MzPt`, and the absence of source-image/path embedding.
- [ ] Rerun snapshot tests without `-u`, the recipe/render semantic tests, and typecheck. These
  are the green gates that authorize the technical review in 4.4:

```bash
rtk proxy ./node_modules/.bin/vitest run \
  packages/catalog/src/recipes.test.ts \
  packages/catalog/src/render-cases.test.ts \
  packages/catalog/src/snapshots.test.ts \
  packages/catalog/src/multi-size-snapshots.test.ts
rtk proxy ./node_modules/.bin/tsc --noEmit
```

### 4.3 RED — exact manifest and domain ledger

- [ ] Add a manifest test expecting exactly `I.3.5`, `I.3.6`, and `I.3.7`, with the exact
  `referenceAsset` values from Task 3. Assert neither `I` nor `I.3` is claimed as scope.
- [ ] Assert all three technical reviews are attributed and approved, name the measured
  `inset-hull` and center baseline evidence, distinguish the white-body technical decision from
  domain meaning, and make no E.2 identity claim.
- [ ] Add domain-ledger expectations for exactly these pending IDs:

```text
bbk-babz-2025:I.3.5#primary
bbk-babz-2025:I.3.6#primary
bbk-babz-2025:I.3.7#primary
```

- [ ] Update manifest/domain-ledger counts from 424 to 427. Run the focused tests and observe the
  missing manifest/review/ledger rows rather than an unrelated error:

```bash
rtk proxy ./node_modules/.bin/vitest run \
  packages/catalog/src/coverage-manifest.test.ts \
  packages/catalog/src/domain-reviews.test.ts
```

### 4.4 GREEN — approve only after the observed snapshot gates

- [ ] Import `ANHANG_I_A_RECIPES` into `coverage-manifest.ts` and add this complete attributed
  review only now, after 4.2 is green:

```ts
const ANHANG_I_A_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-26',
  note:
    'I.3.5-I.3.7 passed measured inset-hull, 7.99 mm center-profile, literal recipe, direct-snapshot and multi-size gates. The white Hilfsorganisation body is a technical rendering decision; domain classification remains pending and no identity with E.2 is claimed.',
};
```

- [ ] Route the exact recipe block before generic review fallbacks:

```ts
if (Object.hasOwn(ANHANG_I_A_RECIPES, section)) {
  return ANHANG_I_A_TECHNICAL_REVIEW;
}
```

- [ ] Add only `I.3.5`, `I.3.6`, and `I.3.7` to the scope array. Build recipe manifest rows from
  `RECIPES`; do not duplicate specs.
- [ ] Append the exact three `{ status: 'pending' }` objects to `domain-reviews.ts`. Put one
  adjacent comment over the block explaining that appearance is technically proven while the
  organizational/domain meaning of the white body remains unresolved.
- [ ] Run the focused tests, all catalog tests, executable coverage, and typecheck:

```bash
rtk proxy ./node_modules/.bin/vitest run \
  packages/catalog/src/coverage-manifest.test.ts \
  packages/catalog/src/domain-reviews.test.ts \
  packages/catalog/src/render-cases.test.ts
rtk proxy ./node_modules/.bin/vitest run packages/catalog/src
rtk proxy ./node_modules/.bin/tsx packages/cli/src/index.ts coverage
rtk proxy ./node_modules/.bin/tsc --noEmit
```

- [ ] Review and commit the complete regression/provenance task:

```bash
rtk git -c core.fsmonitor=false diff --check
rtk git -c core.fsmonitor=false add \
  packages/catalog/src/snapshots.test.ts \
  packages/catalog/src/multi-size-snapshots.test.ts \
  packages/catalog/src/__snapshots__/I.3.5.svg \
  packages/catalog/src/__snapshots__/I.3.6.svg \
  packages/catalog/src/__snapshots__/I.3.7.svg \
  packages/catalog/src/__snapshots__/multi-size/recipe.I.3.5.svg \
  packages/catalog/src/__snapshots__/multi-size/recipe.I.3.6.svg \
  packages/catalog/src/__snapshots__/multi-size/recipe.I.3.7.svg \
  packages/catalog/src/coverage-manifest.ts \
  packages/catalog/src/coverage-manifest.test.ts \
  packages/catalog/src/domain-reviews.ts \
  packages/catalog/src/domain-reviews.test.ts \
  packages/catalog/src/render-cases.test.ts
rtk git -c core.fsmonitor=false commit -m "feat(catalog): gate LFH-479 provenance and render regressions"
```

---

## Task 5: Record the decision and create output-only screenshot evidence

**Files:**

- Create: `docs/decisions/2026-08-26-anhang-i-a.md`
- Create: `docs/reviews/2026-08-26-i-a-visual-qa.md`
- Create, ignored: `out/tools/generate-lfh479-contact-sheets.ts`
- Create, ignored: `out/lfh-479/contact-sheet/LFH-479-i-a-generated.png`
- Create, ignored: `out/lfh-479/contact-sheet/manifest.json`

### 5.1 Decision and QA records

- [ ] Write the decision record with: exact three source filenames; measured chord endpoints,
  center, radius, path, and bounds; `rectBody(7.99)` derivation; organization and label-zone
  rulings; explicit non-equivalence claim for E.2; technical-approved/domain-pending split; and
  future LFH-480 boundary.
- [ ] Write the QA record with one row per recipe. Record expected label, body variant, generated
  direct snapshot, generated multi-size snapshot, semantic-test result, visual-review result, and
  remaining domain question. Do not mark visual review passed before viewing the generated PNG.

### 5.2 Output-only generator

- [ ] Implement `out/tools/generate-lfh479-contact-sheets.ts` using the repository's existing
  Resvg/font setup. The registry is the only recipe source:

```ts
const expectedKeys = ['I.3.5', 'I.3.6', 'I.3.7'] as const;
const entries = expectedKeys.map((key) => [key, RECIPES[key]] as const);

for (const [key, recipe] of entries) {
  if (recipe === undefined) throw new Error(`Missing recipe ${key}`);
  if (!key.startsWith('I.3.')) throw new Error(`Unexpected LFH-479 key ${key}`);
}
```

  For each entry, compose from the catalog and call `renderSvg` with the existing catalog render
  theme. Raster the generated single-recipe SVG at width 900. Separately read and raster only the
  generated multi-size snapshot `packages/catalog/src/__snapshots__/multi-size/recipe.${key}.svg`.
  Build a white contact-sheet SVG containing, per row: recipe key/title/label, the 900-pixel
  generated rendering, and its generated multi-size sheet. Embed these generated PNG bytes as
  data URLs, then raster the wrapper to
  `out/lfh-479/contact-sheet/LFH-479-i-a-generated.png`.
- [ ] The script must fail if any recipe is missing, validation is not green, output dimensions
  are zero, one of the three multi-size snapshots is missing, or any entry outside the exact key
  set appears in its LFH-479 matrix. It must never read `taktische-zeichen/` or any
  `referenceAsset` path.
- [ ] Write `manifest.json` with SHA-256 hashes for each generated single-recipe SVG, each
  generated 900-pixel PNG, each committed multi-size SVG, each rastered multi-size PNG, and the
  final contact-sheet PNG. Include the producing commit and the exact generator command.
- [ ] Support `--verify`: regenerate in memory and compare every manifest hash and final PNG
  bytes, exiting non-zero on drift. Use the same deterministic Resvg/font options as generation.
- [ ] Run generation and verification:

```bash
rtk proxy ./node_modules/.bin/tsx out/tools/generate-lfh479-contact-sheets.ts
rtk proxy ./node_modules/.bin/tsx out/tools/generate-lfh479-contact-sheets.ts --verify
```

- [ ] Confirm all three paths are ignored and absent from Git status:

```bash
rtk git -c core.fsmonitor=false check-ignore --quiet \
  out/tools/generate-lfh479-contact-sheets.ts \
  out/lfh-479/contact-sheet/LFH-479-i-a-generated.png \
  out/lfh-479/contact-sheet/manifest.json
rtk git -c core.fsmonitor=false status --short
```

### 5.3 Visual inspection and documentation commit

- [ ] Open the PNG at original resolution. Check: all three rows are readable; hull geometry is
  consistent; labels are centered, black, and uncut; the direct and multi-size renderings agree;
  no original reference image or local source path appears.
- [ ] Update the QA record with the observed image dimensions, manifest hash, inspection result,
  and any genuine visual deviation. `domain: pending` is not a visual failure.
- [ ] Run documentation checks available in the repo, `diff --check`, and commit only the two
  documentation files:

```bash
rtk git -c core.fsmonitor=false diff --check
rtk git -c core.fsmonitor=false add \
  docs/decisions/2026-08-26-anhang-i-a.md \
  docs/reviews/2026-08-26-i-a-visual-qa.md
rtk git -c core.fsmonitor=false commit -m "docs(lfh-479): record measurements and visual QA"
```

---

## Task 6: Independent review, complete verification, and draft PR

**Files:** All LFH-479 changes relative to `origin/main`

### 6.1 Fresh reviews

- [ ] Ask a fresh specification reviewer to compare the complete diff against LFH-479, the
  approved design, and this plan. The reviewer must check all three exact recipes, geometry,
  organization/label boundaries, narrow coverage, pending domain status, snapshot inventory, and
  screenshot safety.
- [ ] Ask a separate code-quality reviewer to inspect correctness, maintainability, accidental
  changes, misleading claims, and missing tests. Reviewers must not modify files.
- [ ] Fix every substantiated finding with a RED regression where applicable. Commit fixes with a
  scoped message, rerun affected gates, and have the corresponding reviewer recheck until there
  are no findings.

### 6.2 Full verification from a clean process

- [ ] Run each command to its real exit and record command, exit code, and summary:

```bash
rtk proxy ./node_modules/.bin/vitest run
rtk proxy ./node_modules/.bin/tsc --noEmit
rtk proxy ./node_modules/.bin/tsx packages/cli/src/index.ts coverage
rtk proxy ./node_modules/.bin/tsx out/tools/generate-lfh479-contact-sheets.ts --verify
rtk git -c core.fsmonitor=false diff --check origin/main...HEAD
rtk git -c core.fsmonitor=false status --short
```

- [ ] Verify the final counts are 140 recipes, 408 render cases, 427 manifest rows, 154 direct
  snapshots, and 409 multi-size sheets. Verify all 427 manifest entries are accounted for and the
  three new domain rows remain explicitly pending.
- [ ] Verify the branch contains no original reference assets, generated PNG, manifest, generator,
  credentials, or unrelated worktree files:

```bash
rtk git -c core.fsmonitor=false diff --name-only origin/main...HEAD
rtk git -c core.fsmonitor=false status --ignored --short out/lfh-479 out/tools
```

### 6.3 ClickUp and PR handoff

- [ ] Move LFH-479 to `in review` after implementation/reviews and to `testing` only after all
  commands in 6.2 are green. Comment with the commit range, exact gate results, generated evidence
  hash, and remaining `domain: pending` boundary. Do not change LFH-419 from `scoping`.
- [ ] Push `feat/lfh-419-anhang-i-watercraft` and create a **draft** PR targeting `main` with title:

```text
LFH-479: add Anhang I-a watercraft signs
```

- [ ] Use this PR body structure and fill it only with observed results:

```markdown
## Summary
- add the measured `inset-hull` body and guarded layout contract
- add I.3.5-I.3.7 recipes with narrow provenance and pending domain review
- add semantic and visual regression evidence

## Verification
- exact Vitest file/test totals and exit result from Task 6.2
- exact TypeScript exit result from Task 6.2
- exact coverage manifest/domain totals and exit result from Task 6.2
- exact output-manifest SHA-256 read after the successful `--verify` run

## Visual evidence
Output-only generated contact sheet attached below. It contains no BBK/BABZ source artwork.

## Domain boundary
The body/label rendering is technically approved; organization semantics remain explicitly pending.
```

- [ ] Upload only
  `out/lfh-479/contact-sheet/LFH-479-i-a-generated.png` to the PR description and confirm the
  rendered image is visible. Do not attach `manifest.json`, the generator, original references,
  or a reference-vs-output comparison.
- [ ] Add the draft PR URL and screenshot-evidence note to LFH-479. Leave the task in `testing`
  while the draft PR awaits external review/merge; do not mark it `done` or `shipped`.

## Completion contract

LFH-479 is ready for human review only when all six tasks are complete, both fresh reviewers
have no findings, the full gate is green at the pushed commit, the draft PR visibly contains the
output-only screenshot, and ClickUp links the PR while retaining the explicit pending-domain note.
