# LFH-481 I-c Water-Rescue Formations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Every production change uses
> `superpowers:test-driven-development`; each test must fail for the intended missing behavior
> before implementation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver ClickUp LFH-481 as four measured Anhang-I water-rescue formation recipes with
neutral organization semantics, technical gate evidence, an output-only contact sheet, and a
draft pull request.

**Architecture:** Preserve the four existing chapter-5.4 strength IDs and introduce one
geometry-only technical head mark for I.1.4. Register `formation-two-waves-diamond` as an
independently measured technical normal-formation body mark, then add four literal recipes and
narrow manifest/review rows. Core owns placement and fail-closed validation; catalog owns measured
geometry and recipe identity. The compact I-g `water-rescue` formation mark remains separate.

**Tech Stack:** TypeScript 5.9, Vitest 3.2, Resvg 2.6, pnpm 11.20.0, Node.js 22,
`@einsatzzeichen/schema`, `@einsatzzeichen/core`, `@einsatzzeichen/catalog`

**Spec:** `docs/superpowers/specs/2026-08-27-lfh-481-i-c-water-rescue-formations-design.md`

## Global Constraints

- Run every shell command with `rtk`.
- Work only on `codex/lfh-481-wasserrettungsformationen` in the current isolated worktree.
- Initial baseline was `c3b00d023ba98db68843d0512101bc3c752270ea`; delivery is rebased onto
  `origin/main` at `5cec36ccc4450a729830704caf1156a401bd6153`.
- Follow strict RED-GREEN-REFACTOR; a RED must be an assertion failure for missing behavior.
- Never add `verband` to `StrengthId` and never assign an organization to the four recipes.
- Do not change `capability.water-rescue`; add a separately measured neutral technical body mark.
- Do not update snapshots before semantic head/body/recipe assertions are green.
- Do not broaden coverage to `I` or `I.1`; add exactly four individual sections.
- Keep all four domain reviews `pending`; technical approval follows only after green gates.
- Never commit or publish original reference SVGs, path bytes, pair images, or local paths.
- Keep generators and generated proof assets under ignored `out/` paths.
- Stage only named files with `git add -- <paths>`; never use `git add .` or `git add -A`.

---

### Task 1: Add the fail-closed technical head-mark contract

**Files:**

- Modify: `packages/schema/src/taxonomy.ts`
- Modify: `packages/schema/src/head.ts`
- Modify: `packages/core/src/validate.ts`
- Test: `packages/core/src/validate.test.ts`
- Modify: `packages/core/src/compose.ts`
- Test: `packages/core/src/compose.test.ts`
- Create: `packages/catalog/src/technical-head-marks.ts`
- Create: `packages/catalog/src/technical-head-marks.test.ts`
- Modify: `packages/catalog/src/index.ts`

**Interfaces:**

- Produces: `TechnicalHeadMarkId`, `SymbolSpec.technicalHeadMark`,
  `PrimitiveHeadShape`, `CatalogPorts.technicalHeadMark(id)`.
- The catalog resolver returns one relative rectangle at `15.25/0/1.5/4`; core places it at
  absolute `15.25/1/1.5/4` on a normal formation.

- [ ] **Step 1: Write RED catalog and validation tests**

  Add literal expectations for `single-vertical-bar` and assert that normal formation is the only
  accepted kind/variant. Assert conflicts with `strength`, `administrativeLevel`, and
  `functionRole` use stable validation rules.

- [ ] **Step 2: Run RED**

  ```bash
  rtk mise exec -- ./node_modules/.bin/vitest run \
    packages/catalog/src/technical-head-marks.test.ts \
    packages/core/src/validate.test.ts \
    packages/core/src/compose.test.ts --maxWorkers=1 --minWorkers=1
  ```

  Expected: missing type/resolver/behavior assertions fail; no syntax, import, or environment
  failure counts as RED.

- [ ] **Step 3: Implement the minimal contract**

  Add the one-ID taxonomy, primitive head shape, total catalog resolver and core placement. Use
  the existing `placeHead(profile, heightMm)` result; do not add an I.1-specific coordinate path
  to core.

- [ ] **Step 4: Run GREEN and typecheck**

  ```bash
  rtk mise exec -- ./node_modules/.bin/vitest run \
    packages/catalog/src/technical-head-marks.test.ts \
    packages/core/src/validate.test.ts \
    packages/core/src/compose.test.ts --maxWorkers=1 --minWorkers=1
  rtk mise exec -- pnpm typecheck
  ```

- [ ] **Step 5: Review and commit Task 1**

  ```bash
  rtk git -c core.fsmonitor=false diff --check
  rtk git -c core.fsmonitor=false add -- \
    packages/schema/src/taxonomy.ts packages/schema/src/head.ts \
    packages/core/src/validate.ts packages/core/src/validate.test.ts \
    packages/core/src/compose.ts packages/core/src/compose.test.ts \
    packages/catalog/src/technical-head-marks.ts \
    packages/catalog/src/technical-head-marks.test.ts packages/catalog/src/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat(lfh-481): add measured technical formation head"
  ```

### Task 2: Add the water-rescue formation mark and four literal recipes

**Files:**

- Modify: `packages/catalog/src/body-marks.ts`
- Test: `packages/catalog/src/body-marks.test.ts`
- Modify: `packages/catalog/src/recipes-anhang-i.ts`
- Test: `packages/catalog/src/recipes.test.ts`
- Modify: `packages/catalog/src/recipes.ts`

**Interfaces:**

- Consumes: `SymbolSpec.technicalHeadMark` and catalog technical-head resolver from Task 1.
- Produces: `ANHANG_I_C_RECIPES` and four entries reachable through `RECIPES`.

- [ ] **Step 1: Write RED body-mark and recipe tests**

  Assert the hand-derived wave/diamond geometry, the normal-formation-only context, and exactly
  these specs:

  ```ts
  { kind: 'formation', strength: 'trupp', bodyMarks: ['formation-two-waves-diamond'] }
  { kind: 'formation', strength: 'gruppe', bodyMarks: ['formation-two-waves-diamond'] }
  { kind: 'formation', strength: 'zug', bodyMarks: ['formation-two-waves-diamond'] }
  {
    kind: 'formation',
    technicalHeadMark: 'single-vertical-bar',
    bodyMarks: ['formation-two-waves-diamond'],
  }
  ```

  Each literal expectation also asserts that `organization` is absent.

- [ ] **Step 2: Run RED**

  ```bash
  rtk mise exec -- ./node_modules/.bin/vitest run \
    packages/catalog/src/body-marks.test.ts packages/catalog/src/recipes.test.ts \
    --maxWorkers=1 --minWorkers=1
  ```

  Expected: `formation-two-waves-diamond` and I.1.1–I.1.4 are missing.

- [ ] **Step 3: Implement the minimal catalog data**

  Add the reconstructed 0.5-mm wave/diamond primitives to
  `MARKS['formation-two-waves-diamond']`. Add the literal recipe matrix and merge it with the
  existing I.3.5–I.3.7 matrix without changing those entries.

- [ ] **Step 4: Run GREEN and typecheck**

  ```bash
  rtk mise exec -- ./node_modules/.bin/vitest run \
    packages/catalog/src/body-marks.test.ts packages/catalog/src/recipes.test.ts \
    packages/core/src/validate.test.ts packages/core/src/compose.test.ts \
    --maxWorkers=1 --minWorkers=1
  rtk mise exec -- pnpm typecheck
  ```

- [ ] **Step 5: Review and commit Task 2**

  Stage only the five named files and commit with
  `feat(lfh-481): add water-rescue formation recipes`.

### Task 3: Bind provenance, snapshots, visual evidence and final delivery

**Files:**

- Modify: `packages/catalog/src/coverage-manifest.ts`
- Test: `packages/catalog/src/coverage-manifest.test.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`
- Test: `packages/catalog/src/domain-reviews.test.ts`
- Test: `packages/catalog/src/render-cases.test.ts`
- Test: `packages/catalog/src/snapshots.test.ts`
- Test: `packages/catalog/src/multi-size-snapshots.test.ts`
- Create: `packages/catalog/src/__snapshots__/I.1.1.svg`
- Create: `packages/catalog/src/__snapshots__/I.1.2.svg`
- Create: `packages/catalog/src/__snapshots__/I.1.3.svg`
- Create: `packages/catalog/src/__snapshots__/I.1.4.svg`
- Create: `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.1.svg`
- Create: `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.2.svg`
- Create: `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.3.svg`
- Create: `packages/catalog/src/__snapshots__/multi-size/recipe.I.1.4.svg`
- Create: `docs/decisions/2026-08-27-anhang-i-c.md`
- Create: `docs/reviews/2026-08-27-i-c-visual-qa.md`

**Interfaces:**

- Consumes: four live recipes from Task 2.
- Produces: 508 manifest rows, 522 review rows, 489 render cases, 225 direct snapshots and 490
  multi-size snapshots on the integrated `origin/main` basis.

- [ ] **Step 1: Write RED count, scope and review assertions**

  Pin the exact deltas, four individual scope entries, `composition-recipe` evidence, technical
  review identity and four `pending` domain reviews.

- [ ] **Step 2: Run RED**

  ```bash
  rtk mise exec -- ./node_modules/.bin/vitest run \
    packages/catalog/src/coverage-manifest.test.ts \
    packages/catalog/src/domain-reviews.test.ts \
    packages/catalog/src/render-cases.test.ts \
    packages/catalog/src/snapshots.test.ts \
    packages/catalog/src/multi-size-snapshots.test.ts \
    --maxWorkers=1 --minWorkers=1
  ```

  Expected: the four provenance rows and eight snapshots are missing; no unrelated failure.

- [ ] **Step 3: Implement provenance and update snapshots**

  Add only the four rows/reviews, then update the two snapshot suites. Inspect every new SVG
  before accepting it; do not update unrelated snapshots.

- [ ] **Step 4: Generate and inspect visual proof**

  Under ignored `out/`, generate four private reference/catalog pairs and one output-only contact
  sheet. Record hashes and findings in the review document; commit neither generator nor images.

- [ ] **Step 5: Run the complete gate to real exit**

  ```bash
  rtk mise exec -- pnpm typecheck
  rtk mise exec -- pnpm test
  rtk mise exec -- pnpm cli coverage
  rtk git -c core.fsmonitor=false diff --check
  rtk git -c core.fsmonitor=false status --short
  ```

  If resource contention causes a timeout, rerun the exact affected test in isolation and then
  rerun the complete suite; do not raise committed timeout values to hide environment load.

- [ ] **Step 6: Independent reviews, commit, push and PR**

  A fresh specification reviewer checks all LFH-481 requirements; a second fresh quality
  reviewer checks the complete branch diff. Resolve findings and rerun the full gate. Stage only
  named source, test, snapshot and documentation paths. Push the branch, create one draft PR to
  `main`, attach the output-only contact sheet, and move LFH-481 to `in review` with the PR URL and
  gate evidence. Leave LFH-419 unchanged.
