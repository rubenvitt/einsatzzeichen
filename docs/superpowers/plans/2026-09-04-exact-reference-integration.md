# Exact Reference Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Every task gets one fresh implementation agent with exclusive ownership of the listed files, followed by fresh specification and quality reviewers. Never run two implementation agents at once.

**Goal:** Expose the complete exact corpus through the catalog, route every output channel through the single exact renderer, provide fail-closed strict conformance and signed-attestation workflows, and prevent any local reference material from entering a package or release artifact.

**Architecture:** Integration Task 0 runs immediately after the complete Foundation and before Corpus Task 1; it establishes a source-safe staged/review boundary without requiring a corpus allowlist or final aggregator. Corpus Tasks 1–94 then create and aggregate the physical batches, after which Integration Tasks 1–24 expose them through Catalog, React, Web Component, MapLibre, QGIS, Website, CLI, Review, strict conformance, attestation, and release workflows. Catalog materializes every plan atomically into one drawing-plus-trace result, all output channels consume `RenderableDrawing` through shared renderers, and local Oracle access remains confined to CLI/review adapters.

**Tech Stack:** TypeScript 5.9.3, Node.js 22 (the version pinned by `mise.toml` and every CI/release workflow), pnpm 11.20.0, Vitest 4.1.11, React 19.2.8, Astro 7.2.9, Vite 7.2.4, Playwright 1.62.0, `@resvg/resvg-js` 2.6.2, Ed25519, RFC 8785 JCS, SHA-256.

**Spec:** `docs/superpowers/specs/2026-09-04-exact-reference-parity-design.md`

## Prerequisite contracts

Task 0 is a bootstrap task: execute it immediately after Foundation Task 26 and before Corpus Task 1. At this point Foundation's Canary descriptor/closure is available, but the 90-entry Corpus allowlist, Corpus descriptors, Component allocation, and final aggregator do not exist. Task 0 therefore tests its general behavior with synthetic descriptor/closure fixtures and the real Foundation Canary through the only productive closure loader; Corpus Task 1 later replaces the Canary allowlist with exactly 90 descriptors. Execute Integration Tasks 1–24 only after Corpus Tasks 1–94 are committed and green. The following imports are hard prerequisites, not optional fallbacks:

- `packages/schema/src/exact-ir.ts` exports `ExactDecimal`, `ExactViewBox`, `ExactTransformSequence`, `ReferenceExactNode`, `ReferenceExactDrawing`, `GeneratedOverlayLayer`, `LayeredDrawing`, and `RenderableDrawing`.
- `packages/schema/src/exact-catalog.ts` exports `ReferenceExactFragment`, `ExactComponentVariant`, `ExactComponentFixture`, `ExactAssetFixture`, `DisplayFixture`, `BuilderCompositionKey`, `CompositionPlanTargetKey`, `CompositionTraceTargetKey`, `CompositionPlan`, `CompositionTrace`, `UnfinalizedExactCompositionResult`, `FinalizedExactCompositionRecord`, `ReferenceComponentContextAccess`, `ReferenceComponentContextPair`, `ReferenceComponentContextSetV1`, and the Composition-Contract/Witness types.
- `packages/schema/src/conformance.ts` exports all Oracle-/part-/case keys, `OracleManifest`, `OraclePart`, `UseEdge`, `ComparisonProfile`, `MaskContract`, the raster option/result types, and the conformance case unions.
- `packages/schema/src/conformance-attestation.ts` exports `ConformanceProvenanceRecord`, `ConformanceAttestation`, `AttestationTrustStore`, `CurrentConformanceDigests`, and signature/verification types.
- `packages/core/src/render/exact-svg.ts` exports `renderReferenceExactSvg`; `renderSvg(drawing: RenderableDrawing, options?: SvgOptions): string` dispatches losslessly.
- `packages/core/src/conformance/rgba.ts` exports `canonicalizeTransparentRgb`, `compositeRgba`, and `compareRgba`.
- `packages/core/src/conformance/status.ts` exports `effectiveConformanceStatus(attestation, current): 'approved' | 'invalidated'`.
- `packages/cli/src/conformance/oracle-loader.ts` exports `loadOracleSet(root: string, manifest: OracleManifest): LoadedOracleSet` for the full committed 661-file manifest and `selectLoadedOracleSet(fullSet, subsetManifest): LoadedOracleSet` for a batch selection without a second root read.
- `packages/cli/src/conformance/batch-conformance.ts` exports Foundation's `deriveCurrentRequiredOracleManifest(current: ExactBatchModule, registry: ExactCatalogRegistry, oracleManifest: OracleManifest): OracleManifest`; Integration calls this function directly and owns no parallel Current-root traversal.
- `packages/cli/src/conformance/raster.ts` is the sole owner of `EvidencePairKind = 'full' | 'selected' | 'without-selected'` and exports `ComparisonPairResult`, `renderComparisonCell(input: ComparisonCellInput): Promise<ComparisonCellEvidence>`, and `renderComparisonMatrix(input: ComparisonMatrixInput): Promise<ComparisonMatrixResult>`; the matrix function uses the cell function rather than a second raster path. Integration imports/re-exports that pair type and never redeclares it.
- `packages/cli/src/conformance/evidence-writer.ts` owns PNG encoding and safe local writes below `out/exact-reference/`; integration does not create another encoder.
- `packages/cli/src/conformance/attestation.ts` exports `signConformanceAttestation` and the Foundation-authoritative `verifyConformanceAttestation(attestation, trustStore, current, requiredPairs, now): AttestationVerification`. Integration derives `requiredPairs` from the finalized canonical case registry; it never infers them from the attestation's own provenance.
- `packages/catalog/src/exact/batch-contract.ts` exports `ExactBatchDescriptor`, `ExactBatchManifest`, `ExactBatchModule`, `LoadedExactBatchClosure`, `ExactBatchKeyOwnerIndex`, `buildExactBatchKeyOwnerIndex`, `ReferenceComponentContextOwnershipRecord`, `ReferenceComponentContextOwnershipV1`, `deriveReferenceComponentContextOwnership(referenceSet, componentFixtures, ownerIndex)`, `resolveCorpusShard`, `registerExactBatchModules`, and structural batch validation. Pair ownership is derived only from the total pair↔fixture bijection and `ownerIndex.componentFixtures`, never stored as another batch collection.
- `packages/catalog/src/exact/batch-staging-registry.ts` exports the literal descriptor allowlist, `buildStagedExactBatchOwnershipIndex`, `stagedExactBatchDescriptor`, `resolveStagedBatchDependencyOrder`, `loadStagedExactBatchClosure(id: ExactBatchId): Promise<LoadedExactBatchClosure>`, and `assertStagedBatchBoundary`; Task 0 delegates staged dependency/current loading exclusively to this Foundation path and introduces no additional loading API.
- `packages/catalog/src/exact/batches/index.ts` exports `EXACT_BATCH_MODULES` and `EXACT_CATALOG_REGISTRY`. During bootstrap they contain only the modules already integrated by Foundation; after corpus aggregation the same two exports contain the complete registries. All integration code reads registry fields rather than inventing a second corpus-wide aggregation surface.
- `packages/catalog/src/exact/known-symbol-spec-assets.ts` exports Foundation's sole `KnownSymbolSpecDigest`, `KnownSymbolSpecAssetIndex`, `canonicalKnownSymbolSpecDigest(spec)`, and `KNOWN_SYMBOL_SPEC_ASSET_INDEX`; `ExactCatalogRegistry.knownSymbolSpecAssets` is the collision-checked index for the loaded closure. After Corpus aggregation its exact keyset is the 14 validated Base-Specs plus 242 validated recipe Specs, and every value resolves in that same registry's `exactAssets` map.
- `packages/catalog/src/exact/reachable-builder-contexts.ts` exports the public-only `REACHABLE_BUILDER_CONTEXT_SET`; `reference-component-contexts.ts` exports the total `REFERENCE_COMPONENT_CONTEXT_SET`, its 151 literal `reference-only` and 15 literal `direct-carrier` rows, scoped key factories, derivation, and validator. `ExactCatalogRegistry.reachableBuilderContextSet` and `.referenceComponentContextSet` retain those canonical objects by identity.
- `ExactCatalogRegistry` fields used by this plan are named exactly `compositionWitnessEdges`, `displayFixtures`, `componentCases`, `reachableBuilderContextSet`, and `referenceComponentContextSet` (plus the other fields defined by Foundation); all consumers read those canonical fields directly and never assemble an independent Component-case or context collection.

If any prerequisite name differs, reconcile the producing plan first. Do not add an adapter with a second name in this plan.

## Global constraints

- The 661 BABZ SVG files remain local under `taktische-zeichen/`; no build or runtime path may read them.
- Commands may resolve their explicit `--reference-root` argument (internally the Oracle root) to an absolute path only in process memory for filesystem access. The supplied and resolved paths must be replaced with `<EXACT_REFERENCE_ROOT>` before any stdout, stderr, error, JSON, JCS, snapshot, evidence, attestation, or artifact write; neither form may be persisted or logged.
- Every executable verification command in this plan runs through `rtk mise exec --` so Node 22, rather than an ambient different major, is measured and used. `mise.toml`, package-manager policy, every CI/release workflow, the loaded Node binary/version, and pnpm 11.20.0 are explicit toolchain-digest inputs.
- Every strict, artifact, Website, browser, release-candidate, and release build derives one canonical integer `SOURCE_DATE_EPOCH` from `git show -s --format=%ct <bound-head-or-candidate-commit>`. The decimal value is recorded in `StaticCheckoutState`, strict/artifact/release manifests, and build invocations; a caller-supplied different value is rejected. Repeating a build for the same bound commit and epoch must reproduce byte-identical generated manifests, snapshots, archives, Website/QGIS bundles, browser fixture data, and package tarballs.
- Public inventories are exact: 661 `ExactAssetFixture`s, 544 displays split into 525 whole and 19 part cases, and every valid fixture for exactly 413 component keys.
- Public Builder resolution uses only `reachableBuilderContextSet`. Exact component lookup, strict verification, and Review use the total `referenceComponentContextSet`: its public Component-Key projection is exactly 247, its total Component-Key projection covers all 413 keys, and its disjoint access partition is exactly all public Reachable pairs plus 151 reference-only and 15 direct-carrier rows. Its public pair count is `reachableBuilderContextSet.pairs.length` and its total pair count is that value plus 166; neither pair count is fixed to 247 or 413. No nonpublic pair may acquire a `SymbolSpec` route.
- Exact assets materialize only from the authoritative `CompositionPlan`; a second whole-asset geometry source is forbidden.
- `ExactCompositionResult<D>` is the single canonical public result name. `exactAssetResult`, `exactComponentResult`, `exactComponentFixtureResult`, and `composeExact` are the atomic sources returning it; drawing-only and trace-only helpers project their results.
- Known exact assets and exact component fixtures contain no generated overlays. For free Builder compositions, arbitrary nonblank strings from every supported `SymbolSpec.labels` text zone and `designation` remain outside finite Exact identity and are emitted only through Foundation's complete ordered `ResolvedBuilderContext.generatedOverlays` (`body-labels` before `designation`), each with `claim: 'not-reference-identical'`. Numeric/enum placement and registered measurement contexts remain finite projected inputs to the Exact plan; custom/free label measurements are non-exact overlay inputs.
- Strict raster comparison uses `@resvg/resvg-js` 2.6.2, exact-fit width, widths 16, 24, 32, 48, 64, 128, 256, 512, 2048, and 4096, and transparent, black, and white backgrounds. Pass means zero RGBA difference.
- Strict mode accepts no filter, subset, tolerance, update, accept, or snapshot-rewrite option.
- A missing or changed oracle is an error (`ORACLE_UNAVAILABLE` or `ORACLE_MISMATCH`), never a skipped/pass result.
- Attestations are immutable, append-only, outside the attested commit, Ed25519-signed over RFC-8785 JCS UTF-8 bytes, and fail closed for an unknown, expired, or revoked key or any stale digest.
- Browser tests are compatibility evidence only; they never weaken or replace the reference renderer's zero-diff contract.
- Pair derivation is exact and exhaustive: Whole cases carry only `['full']`, `source-node-set` cases carry only `['selected']`, and `leave-one-out` cases carry exactly `['full', 'without-selected']`. Foundation `ComparisonPairResult` contains only `pair`, exactly 30 sorted `ComparisonCellResult`s, and `passed`; a Leave-one-out strict result therefore has two PairResults and 60 unique cell keys. Task 0's separate review-evidence transaction and Tasks 14–17 own Original/Candidate/Overlay/Heatmap coordinate paths, byte/hash verification, visual inspection, and signed provenance. At each Leave-one-out `(width,background)` there are eight distinct evidence coordinates and paths keyed by `(case,pair,width,background,kind)`. Content digests may legitimately be equal when bytes are equal; every digest must match its file bytes, while cell/pair evidence digests bind the coordinate tuple and ordered image slots so equal content cannot be substituted across coordinates.
- `@resvg/resvg-js` is instantiated in exactly one Node-only deterministic raster service. Strict comparison, CLI export, visual proof, Website PNG/contact-sheet generation, and artifact production delegate to it; Canvas and MapLibre remain compatibility-only paths.
- Public release requires both a fresh trusted technical attestation and a separate documented domain/legal authorization for published IR, fonts, and similarity to the reference design.
- Development keys and trust stores created below `out/exact-reference/` can prove local technical completion only. Public release accepts only independently controlled, protected release trust roots and key allowlists; the signed authorization is scoped to one final versioned release-candidate commit and the exact scanned artifact digests.
- Shell commands in this repository are prefixed with `rtk`; Git commands include `-c core.fsmonitor=false`.
- An implementation agent modifies only the files assigned to its task and never rewrites corpus batch shards or another task's files.
- Every task that creates a production module creates all of that module's final typed exports as a compile-safe, side-effect-free shell and passes the owning package compiler/import smoke gate before a test imports it. Behavioral RED must then fail at a named assertion or typed not-implemented result, never because a file/export/dependency is missing. Tasks 5–7 use their dedicated consumer type fixtures as compiler-level RED: those files must compile far enough to emit exactly the expected `TS2322`/`TS2345` narrowing diagnostic and no syntax or module-resolution diagnostic. Their existing runtime suites are GREEN regression gates, not a second claimed RED. Task 8 additionally has a genuine behavioral RED for missing claim forwarding/metadata. Task 18 is explicitly a verification-only gate and makes no TDD/RED claim.

## File ownership map

| Area | Files owned in this plan | Responsibility |
|---|---|---|
| Catalog materialization adapter | `packages/catalog/src/exact/registry-adapter.ts`, `registry-adapter.test.ts` | Canonical catalog lookups delegated to the sole Core materializer |
| Catalog context | `packages/catalog/src/exact/context.ts`, `context.test.ts` | Known-spec route, public Builder subset, and fail-closed total reference-component context |
| Catalog public API/claims | Task 3 schema/catalog files | One-plan `composeExact`, exact results, recipes, and explicit output claims |
| Shared SVG/Canvas/dimensions | Task 4 Core files | Shared SVG serializer plus compatibility-only Canvas and the repository's sole dimension service `packages/core/src/render/raster-dimensions.ts` |
| React/Web Component/MapLibre/QGIS | Tasks 5-8 package files and type fixtures | Real compiler-backed widening to `RenderableDrawing`; shared renderer delegation |
| Deterministic raster/export | Task 9 CLI raster/export files plus migrated Core/Catalog raster tests | The sole Resvg constructor/PNG path and all 661 exact exports |
| Staged review bootstrap | Task 0 CLI staged-safety/review files | HEAD+staged source leak gate and paired Original/Candidate/Overlay/Heatmap evidence |
| Website snapshot/static output | Task 10 Website consumers, routes, contact sheets, catalog render cases, legacy snapshot deletion | Deterministic exact inventories, claims, and canonical PNG delegation |
| Website interactive consumers | Task 11 Builder/vocabulary/MapLibre Lab files | Exact/layered drawing identity across interactive channels |
| Strict state/toolchain | Task 12 CLI state/record/toolchain files plus `mise.toml`, root package, CI | Node 22 and non-self-referential strict payload/finalization |
| Strict runner | `packages/cli/src/conformance/strict-runner.ts`, `strict-runner.test.ts`, `packages/cli/src/commands/conformance.ts`, `conformance.test.ts` | Full no-skip run and result record |
| Attestation store | Task 14 CLI record/store/subpath files | Pair-bound, all-or-nothing immutable technical attestation sets |
| Real Review data/model | Task 15 `data/drawings.ts`, `rows.ts`, `views.ts`, `server/render.ts`, conformance model/contract/tests | Exact real consumers plus Assets/Displays/Components and pair state |
| Secure Review writes | Task 16 Review server/config/tests and CLI inspection client | Loopback bearer auth and server-derived append-only findings |
| Review UI | Task 17 UI components/state/API/styles/tests | Addressable case/pair/cell/four-image inspection |
| Browser/no-narrowing gate | Task 18 Playwright files, Review script, repository consumer test | Chromium/Firefox/WebKit compatibility and repo-wide consumer/Resvg policy |
| Leak scanner | `packages/cli/src/conformance/artifact-leak.ts`, `artifact-leak.test.ts` | Byte/content/path leak detection |
| Artifact orchestration | Task 20 archive/artifact-set/command and release-builder files | Exact `.tgz`, Website, QGIS, claim manifest, complete leak scan |
| CLI wiring | Task 21 `cli.ts`, executable/tests/README | One implemented exact grammar without hidden flags |
| Release | Task 22 release contracts/candidate/verifier/publisher/config and two workflows | Versioned candidate, protected independent trust, exact `.tgz` publication |
| Full/local acceptance | Tasks 23-24 full-gate script/tests and ignored `out/exact-reference/**` only | Explicit prepare/final inputs and exhaustive independent paired review |

---

### Task 0: Bootstrap staged-batch safety and paired local review evidence

> Run this task immediately after Foundation Task 26 and before Corpus Task 1. Its real integration fixture is Foundation's `base-formation-canary`; synthetic closures cover later dependency/staged shapes without presupposing Corpus descriptors. Corpus Task 1 replaces the Canary allowlist only after this task is green. It reports evidence only: it cannot inspect on a reviewer's behalf, approve, attest, update snapshots, or alter source files.

**Files:**
- Create: `packages/cli/src/conformance/staged-batch-safety.ts`
- Create: `packages/cli/src/conformance/staged-batch-safety.test.ts`
- Create: `packages/cli/src/conformance/review-artifacts.ts`
- Create: `packages/cli/src/conformance/review-artifacts.test.ts`
- Create: `packages/cli/src/commands/conformance-review.ts`
- Create: `packages/cli/src/commands/conformance-review.test.ts`
- Modify: `packages/cli/src/index.ts`

**Interfaces:**
- Consumes: Foundation `ExactBatchModule`, `LoadedExactBatchClosure`, `CorpusFeatureContract`, `stagedExactBatchDescriptor`, `resolveCorpusShard`, `registerExactBatchModules`, `deriveCurrentRequiredOracleManifest`, `corpusFeatureContractKey`, `parseOracleSvg`, the **only** productive staged API `loadStagedExactBatchClosure(id): Promise<LoadedExactBatchClosure>`, `assertStagedBatchBoundary`, `EXACT_BATCH_MODULES`, `EXACT_CATALOG_REGISTRY`, Core `materializeExactComposition`, full-manifest `loadOracleSet` followed by pure `selectLoadedOracleSet`, paired `renderComparisonCell`, the single Foundation evidence writer, and the canonical case/profile/mask/isolation resolvers. It consumes no future strict-run, Corpus descriptor/allocation, or full-corpus convenience type and does not implement/export/call a single-batch loader, second allowlist, dependency resolver, required-Oracle traversal, registry merger, or aggregator fallback.
- Produces:

```ts
import type { EvidencePairKind } from './raster.js';
export type { EvidencePairKind } from './raster.js';
export type EvidenceImageKind = 'original' | 'candidate' | 'overlay' | 'heatmap';
export type EvidenceBackground = ReferenceRasterOptions['background'];

export interface ReviewEvidenceRunBinding {
  readonly version: 'ReviewEvidenceRunBinding/v1';
  readonly strictRunId: string;
  readonly strictRunDigest: Sha256Digest;
  readonly headCommit: string;
  readonly caseResultDigests: Readonly<Record<ConformanceCaseKey, Sha256Digest>>;
}

export interface ReviewEvidenceCellRecord {
  readonly coordinateKey: string;
  readonly caseKey: ConformanceCaseKey;
  readonly pair: EvidencePairKind;
  readonly width: ReferenceRasterWidth;
  readonly background: EvidenceBackground;
  readonly vectorEqual: boolean;
  readonly images: Readonly<Record<EvidenceImageKind, {
    readonly path: string;
    readonly digest: Sha256Digest;
  }>>;
  readonly differentPixelCount: number;
  readonly maxChannelDelta: number;
  readonly alphaDeltaCount: number;
  readonly evidenceDigest: Sha256Digest;
}

export interface ReviewEvidencePairResult {
  readonly pair: EvidencePairKind;
  readonly vectorEqual: boolean;
  readonly cells: readonly ReviewEvidenceCellRecord[];
  readonly evidenceDigest: Sha256Digest;
}

export interface ReviewEvidenceBatchRecord {
  readonly version: 'ReviewEvidenceBatch/v1';
  readonly batchId: ExactBatchId;
  readonly headCommit: string;
  readonly strictRunId: string | null;
  readonly strictRunDigest: Sha256Digest | null;
  readonly oracleSetDigest: Sha256Digest;
  readonly cases: readonly {
    readonly caseKey: ConformanceCaseKey;
    readonly comparisonMode: 'whole' | 'part';
    readonly requiredPairs: readonly EvidencePairKind[];
    readonly caseResultDigest: Sha256Digest | null;
    readonly pairResults: readonly ReviewEvidencePairResult[];
  }[];
}

export interface StagedBatchSafetyReport {
  readonly version: 'StagedBatchSafety/v1';
  readonly batchId: ExactBatchId;
  readonly headCommit: string;
  readonly headTreeDigest: Sha256Digest;
  readonly stagedBlobDigest: Sha256Digest;
  readonly ownedFiles: readonly string[];
  readonly passed: true;
}

export interface RepositorySourceSafetyReport {
  readonly version: 'RepositorySourceSafety/v1';
  readonly headCommit: string;
  readonly headTreeDigest: Sha256Digest;
  readonly stagedBlobSetDigest: Sha256Digest;
  readonly stagedFiles: readonly string[];
  readonly passed: true;
}

export function verifyRepositorySourceBoundary(options: {
  readonly repositoryRoot: string;
  readonly oracleDigests: ReadonlySet<Sha256Digest>;
}): RepositorySourceSafetyReport;

export function verifyStagedBatchBoundary(options: {
  readonly repositoryRoot: string;
  readonly batchId: ExactBatchId;
  readonly oracleDigests: ReadonlySet<Sha256Digest>;
}): StagedBatchSafetyReport;

export async function writeVisualReviewBatch(options: {
  readonly batch: ExactBatchModule;
  readonly registry: ExactCatalogRegistry;
  readonly referenceRoot: string;
  readonly outDir: string;
  readonly strictBinding?: ReviewEvidenceRunBinding;
}): Promise<ReviewEvidenceBatchRecord>;
```

- [ ] **Step 0: Create every Task-0 production module as a compile-safe shell.** Add the final exported types/functions above to `staged-batch-safety.ts` and `review-artifacts.ts`, plus the final typed parser/runner surface in `conformance-review.ts`; `review-artifacts.ts` imports and re-exports Foundation's `EvidencePairKind` without a local union declaration. The safety/evidence functions throw typed `RED_STAGED_REVIEW_NOT_IMPLEMENTED` errors without filesystem or import work, and the command rejects through its typed usage error. Wire only compile-safe exports from `packages/cli/src/index.ts`, then run `rtk mise exec -- pnpm exec tsc -p packages/cli/tsconfig.build.json --noEmit` to PASS before creating any test. No missing module, missing export, unresolved import, or syntax error is accepted as RED.

- [ ] **Step 1: Write RED for a path/digest/content-context-aware repository scanner and the stricter staged six-file boundary.** In disposable Git repositories, `verifyRepositorySourceBoundary` scans every blob in HEAD plus every currently staged blob, including arbitrary root-aggregator files, without checkout, and requires every staged regular file's worktree bytes to equal its index blob before any staged runtime module can be imported. Its policy is explicit and ordered:

  1. Hash every blob before decoding it. A blob whose byte SHA-256 equals any `OracleManifest.assets[].sha256` is always rejected as `oracle-byte-match`; metadata-only SHA-256 literals in the committed `oracle-manifest.ts` and its independently audited tests remain legal content and are not confused with a blob-byte match.
  2. Classify by repository-relative path and media signature. Existing generated/product SVG and PNG assets are allowed only in their audited tracked asset locations, only when their bytes are not an Oracle digest, and only when their content is clean. Evidence-like paths/names (`reference`, `oracle`, `original`, `overlay`, `heatmap`, `diff`, `visual-review`, `matrix`) and anything below local evidence/output roots are rejected. PNG magic in TypeScript/JavaScript/text or outside an audited product-image location is rejected.
  3. For textual files, reject embedded original XML/SVG blobs, XML declarations/DOCTYPE/entities, generator metadata, XML comments, foreign namespace declarations/prefixed elements or attributes, SVG/XML data URLs, and Base64 whose decoded prefix is PNG/XML/SVG. Permit ordinary source strings such as generated product markup, the canonical renderer's own `<svg>` shell, deliberately adversarial parser/scanner test literals, and exact policy notation only through a closed path-plus-content-role table tested entry by entry. Its documentation rows name exactly the specification, Foundation plan, Corpus plan, Integration plan, and the master execution program `docs/superpowers/plans/2026-09-04-exact-reference-parity.md`; that master row alone has role `master-execution-policy`. These entries permit contract/CLI notation, never copied Oracle XML, image bytes, or evidence payloads; there is no directory-wide documentation or test-fixture exemption.
  4. Reject absolute machine paths for macOS/Linux/Windows home/workspace forms, supplied or resolved Oracle-root strings, persisted absolute Oracle source paths, and persisted evidence-root paths/records in every context. Repository-relative public asset keys, the intentional logical command root `out/exact-reference/`, and the documented relative local CLI argument `../../taktische-zeichen` may occur only in the closed CLI/test/policy-document contexts that implement or describe the boundary and never grant permission to store Oracle/evidence bytes. Any other Oracle source-directory occurrence fails.

  Run the scanner against the **actual current HEAD** as a positive regression: it must return `passed: true` while retaining legitimate generated/product SVG/PNG assets and the enumerated audited source/test literals. The fixture reads the actual HEAD blob for `docs/superpowers/plans/2026-09-04-exact-reference-parity.md`, proves its literal `../../taktische-zeichen` is accepted only under the exact `master-execution-policy` row, then writes that same literal under a nonlisted path and requires `local-oracle-path`. Mutate each allowed example into Oracle-identical bytes, embedded original XML, generator/comment/foreign-namespace XML, Base64 PNG/SVG, an absolute Oracle/machine path, and an evidence artifact; each mutation must fail with its specific code. This repository-source policy is intentionally narrower than Task 19's generic unpacked bundle policy and does not replace it.

  Then stage exactly `packages/catalog/src/exact/batches/test-batch/{manifest,components,assets,parts,plans,cases.test}.ts` and require `verifyStagedBatchBoundary` to call the common scanner before applying its additional exact six-file allowlist. The staged Batch `.ts` policy is stricter than general HEAD: irrespective of audited product/test contexts, reject raw `<svg`/XML declarations/DOCTYPE/entities/comments/namespaces, PNG magic, SVG/PNG data URLs, and Base64 decoding to XML/SVG/PNG. Each owned worktree file must byte-match its index blob before the five data shards are imported. Reject a seventh owned file, missing shard, foreign batch edit, unstaged/worktree drift, symlink/gitlink, traversal, and any dependency file in the staged set. Returned paths are repository-relative and reports remain below `out/`.

```ts
expect(verifyStagedBatchBoundary({ repositoryRoot, batchId: 'test-batch', oracleDigests }))
  .toMatchObject({
    ownedFiles: [
      'packages/catalog/src/exact/batches/test-batch/assets.ts',
      'packages/catalog/src/exact/batches/test-batch/cases.test.ts',
      'packages/catalog/src/exact/batches/test-batch/components.ts',
      'packages/catalog/src/exact/batches/test-batch/manifest.ts',
      'packages/catalog/src/exact/batches/test-batch/parts.ts',
      'packages/catalog/src/exact/batches/test-batch/plans.ts',
    ],
    passed: true,
  });
```

- [ ] **Step 2: Write RED for the real Canary and synthetic dependency-closed paired evidence.** First call the real Foundation `loadStagedExactBatchClosure('base-formation-canary')` and assert `dependencies: []`, Current ID `base-formation-canary`, exactly the Canary cases, and no Corpus descriptor/import. Then inject the same sole loader seam with a synthetic staged Current batch containing both a `source-node-set` case and a `leave-one-out` case whose plans read a ComponentFixture from a two-level accepted predecessor chain. Make a Current case reference an OraclePart owned by an accepted dependency, make Current-owned witness/ownership edges reach that foreign part/OracleAsset, and add a Current-owned OraclePart root whose foreign OracleAsset endpoint is otherwise unused; the dependency also has its own deliberately excluded cases and an unrelated asset. Spy on Foundation `deriveCurrentRequiredOracleManifest` and require exactly one call with `(current, closureRegistry, ORACLE_MANIFEST)`. Its selected keyset must include every Current case endpoint, the dependency-owned Part endpoint, the otherwise unreferenced Current-owned OraclePart's foreign endpoint, and Current-owned ExactAssets, while excluding the dependency's unrelated case asset. Deleting either required foreign endpoint fails before rendering; adding the unrelated dependency asset fails exact-subset equality. For every returned manifest row, assert lookup by `corpusFeatureContractKey(oracleAsset)` yields a typed `CorpusFeatureContract` with the identical key, asset, and manifest digest; missing, duplicate/colliding, wrong-key, wrong-asset, and wrong-digest mutations must leave the `parseOracleSvg` spy at zero calls. Require staged mode to call `loadStagedExactBatchClosure` exactly once, preserve its dependency-topological `dependencies + current` order, pass that complete ordered module sequence once to `registerExactBatchModules`, and derive the one render-only `ExactMaterializationRegistry` as `{ fragments: closureRegistry.fragments, variants: closureRegistry.variants }`. The current plans must materialize through those maps without reading `EXACT_BATCH_MODULES`/`EXACT_CATALOG_REGISTRY`. A missing, dirty, staged, duplicated, cyclic, forward, or contract-invalid dependency fails before Oracle access or rendering; no registry/aggregator fallback is attempted. Only the current batch's manifest-owned/derived case keys, never dependency cases, may occur in the run, evidence paths, `ReviewEvidenceBatchRecord`, or strict-binding projection. Whole has one `full` PairResult, `source-node-set` has one `selected` PairResult, and `leave-one-out` has two separate PairResults in `['full', 'without-selected']` order. Every PairResult has all ten widths × three backgrounds, and every cell has four ordered image slots with pair-bearing paths and byte-verified SHA-256. At each Leave-one-out `(width,background)`, assert eight distinct coordinate records/paths, not eight distinct content hashes. Force two slots to contain identical bytes and require equal hashes to remain valid while coordinate/evidence digests stay pair/slot-specific and substitution of either record fails. Assert the JSON has no inspection field and no function in this task can write approval or attestation data.

```ts
const selected = record.cases.find((entry) => entry.caseKey === 'case:selected-part')!;
expect(selected.requiredPairs).toEqual(['selected']);
expect(selected.pairResults.map(({ pair }) => pair)).toEqual(['selected']);
expect(selected.pairResults[0]!.cells).toHaveLength(30);

const leaveOneOut = record.cases.find((entry) => entry.caseKey === 'case:leave-one-out-part')!;
expect(leaveOneOut.requiredPairs).toEqual(['full', 'without-selected']);
expect(leaveOneOut.pairResults.map(({ pair }) => pair))
  .toEqual(['full', 'without-selected']);
expect(leaveOneOut.pairResults.map(({ cells }) => cells.length)).toEqual([30, 30]);
for (const pairResult of leaveOneOut.pairResults) {
  for (const cell of pairResult.cells) {
    expect(cell.pair).toBe(pairResult.pair);
    expect(Object.keys(cell.images)).toEqual(['original', 'candidate', 'overlay', 'heatmap']);
    expect(cell.images.original.path).toContain(`/${pairResult.pair}/`);
  }
}
expect(record.strictRunId).toBeNull();
expect(JSON.stringify(record)).not.toContain('inspections');
```

- [ ] **Step 3: Write RED command grammar tests.** Accept exactly:

```text
conformance:review --batch <id> [--batch-source registry|staged] --reference-root <path> --out <path> [--strict-run <file>]
conformance:review --all --reference-root <path> --out <path> [--strict-run <file>]
```

Every invocation first calls `verifyRepositorySourceBoundary`, so the registry-only `--all` path used by root aggregation scans HEAD plus arbitrary staged root files such as `batches/index.ts`/`index.test.ts`. `--batch-source staged` then resolves the literal committed current descriptor and calls this task's Git/blob `verifyStagedBatchBoundary`. The staged set must be exactly the current batch's six Owned files; every transitive dependency is an already accepted read-only batch, none of its six files may be staged, and its tracked worktree bytes must equal HEAD before any dependency/current data module is imported. Only then does the command call Foundation `loadStagedExactBatchClosure` once; the Foundation closure loader validates the DAG and imports the five data shards of each dependency and the current batch, while every `cases.test.ts` is scanned but never imported. Registry mode finds exactly one current module in `EXACT_BATCH_MODULES` and uses `EXACT_CATALOG_REGISTRY`; staged mode never consults either aggregator export, even after an unknown/invalid closure error. `--all` accepts no `--batch-source` flag, is registry-only, and iterates the current module list in manifest order, so it works with Foundation's partial list now and the complete list later. Reject `--all --batch`, `--all --batch-source`, unknown batch, traversal, unsafe output, `--accept`, `--approve`, `--update`, `--attestation`, `--tolerance`, and every unknown option before Oracle access.

- [ ] **Step 4: Verify RED at assertion level.** The valid RED is the failing six-file/dependency-closure/current-case/pair-count/grammar assertion from the already compile-green shells, not a missing-module error.

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/staged-batch-safety.test.ts packages/cli/src/conformance/review-artifacts.test.ts packages/cli/src/commands/conformance-review.test.ts`

Expected: FAIL because the typed stubs throw before producing a staged report/evidence and accept no command; TypeScript import/module resolution remains green.

- [ ] **Step 5: Implement source checks, dependency-closed rendering, and the deterministic evidence transaction.** Implement the ordered path/digest/content classifier from Step 1 as one shared scanner; keep the closed audited-context table in this module and prove the actual HEAD regression before extending it. For staged mode, compare `git ls-files --stage`, `git show :<path>`, HEAD blobs, and worktree bytes: scan HEAD plus exactly the current six staged blobs, apply the stricter Batch-`.ts` payload rules, require each current Owned worktree file to equal its index blob, and require every dependency's six tracked files to be unstaged and byte-equal to HEAD. Only after those checks call Foundation's descriptor-driven `loadStagedExactBatchClosure(id)` once; no other loader exists or may be called. Require the closure's last/current module ID to equal the requested ID and every preceding module to equal the dependency-topological descriptor order, pass that ordered sequence once to `registerExactBatchModules`, and project exactly `{ fragments: closureRegistry.fragments, variants: closureRegistry.variants }` for canonical Core materialization. There is no manual map merge, partial registry, global aggregator lookup, or fallback. Enumerate only cases owned or derived by the Current module; dependencies provide read-only materialization inputs and contribute no cases/results/evidence keys.

  Load the complete committed 661-file Oracle set exactly once. Then call Foundation `deriveCurrentRequiredOracleManifest(current, closureRegistry, ORACLE_MANIFEST)` exactly once and use its returned manifest unchanged; Integration must not reimplement or post-filter its traversal. That Foundation derivation includes all Current Asset-/Display-/ComponentCase roots, **all Current-owned OracleParts as roots even when no Current case names them**, Current ownership/witness edges, Current ExactAssets, and every dependency-owned/foreign endpoint reached from those roots, while excluding dependency-only cases/results and otherwise unrelated dependency assets. Assert every returned key exists in the already loaded full set and only then call `selectLoadedOracleSet(fullSet, requiredManifest)` exactly once. `resolveCorpusShard` may validate descriptor-owned assets but is neither the Oracle selection rule nor permission to omit foreign witness/Part endpoints; never pass a subset to `loadOracleSet`, reopen the root, manually traverse the registry, or construct another subset manifest.

  Before parsing any selected Oracle bytes, derive each expected branded key with `corpusFeatureContractKey(oracleAsset)`, resolve exactly that `CorpusFeatureContract` from `closureRegistry.oracleFeatureContracts`, and require `contract.key === expectedKey`, `contract.oracleAsset === oracleAsset`, and `contract.oracleAssetDigest === requiredManifest.assets[index].sha256`. Missing, duplicate/colliding, wrong-key, wrong-asset, and wrong-digest contracts are distinct hard failures before `parseOracleSvg`; array order, first-match selection, and untyped object acceptance are forbidden.

  Derive the exact ordered required-pair tuple from resolved isolation (`full`, `selected`, or `full` plus `without-selected` as specified above); call the shared raster cell function once per `(current-case,pair,width,background)` and retain separate 30-cell PairResults. Write `out/.../<case-slug>/<pair>/<width>/<background>/{original,candidate,overlay,heatmap}.png`, verify each recorded digest against its bytes, and compute each cell evidence digest over its full coordinate tuple plus ordered `[original,candidate,overlay,heatmap]` slot records; compute each pair evidence digest over pair identity plus its ordered cell evidence digests. Equal content hashes are legal, but coordinate/path reuse or slot substitution fails. Atomically write canonical `visual-review.json` last. A strict-binding file is parsed only as the locally defined `ReviewEvidenceRunBinding`; require exact HEAD/strict IDs, require every current batch case and current result digest to equal its projection from the full binding, ignore no missing current case, and emit no dependency-only binding entry. `--all` additionally requires exact full case-set equality. Without a binding, all strict/result fields remain null and later attestation is impossible.

- [ ] **Step 6: Verify GREEN and the real staged command contract.**

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/staged-batch-safety.test.ts packages/cli/src/conformance/review-artifacts.test.ts packages/cli/src/commands/conformance-review.test.ts`

Expected: PASS; the staged synthetic `source-node-set` plus leave-one-out cases materialize through their accepted dependency closure, write only their own three separate 30-cell PairResults (90 metric rows and 360 PNGs total), leave dependency files unstaged/read-only, and write no source/approval/attestation file.

Run: `rtk mise exec -- pnpm cli conformance:review --batch base-formation-canary --batch-source registry --reference-root ../../taktische-zeichen --out out/exact-reference/review/base-formation-canary`

Expected: PASS through the real Foundation Canary closure/registry, with no Corpus allowlist or full-corpus convenience export. This is a Canary/bootstrap proof only; Corpus Task 1 subsequently replaces the staging allowlist.

Every corpus worker then stages only its six owned files and runs this literal pre-commit gate (with the table's literal ID in place of `<batch-id>`):

```bash
rtk mise exec -- pnpm cli conformance:review \
  --batch <batch-id> \
  --batch-source staged \
  --reference-root ../../taktische-zeichen \
  --out out/exact-reference/review/<batch-id>
```

Expected: the early common HEAD/staged source-leak gate and six-file batch boundary pass, every owned case produces all required pairs/images, stdout contains no approval claim or resolved Oracle path, and `git diff --cached --name-only` still contains exactly the six owned files. Corpus Task 94 alone stages its owned aggregator files and runs `rtk mise exec -- pnpm cli conformance:review --all --reference-root ../../taktische-zeichen --out out/exact-reference/review/all`; that path runs the same common HEAD/staged scanner without applying the six-file batch allowlist. Corpus Task 95 stages nothing and invokes Task 23's prepare/final commands, whose registry `--all` run operates from the clean checkout. Task 20 later performs the separate full scan of unpacked package, Website, QGIS, and release artifacts.

- [ ] **Step 7: Commit source and tests; keep `out/` untracked.**

```bash
rtk git -c core.fsmonitor=false add packages/cli/src/conformance/staged-batch-safety.ts packages/cli/src/conformance/staged-batch-safety.test.ts packages/cli/src/conformance/review-artifacts.ts packages/cli/src/conformance/review-artifacts.test.ts packages/cli/src/commands/conformance-review.ts packages/cli/src/commands/conformance-review.test.ts packages/cli/src/index.ts
rtk git -c core.fsmonitor=false commit -m "feat(cli): gate staged exact review evidence"
```

### Task 1: Catalog registry adapter for the sole Core materializer

**Files:**
- Create: `packages/catalog/src/exact/registry-adapter.ts`
- Create: `packages/catalog/src/exact/registry-adapter.test.ts`

**Interfaces:**
- Consumes: Core `materializeExactComposition(plan: CompositionPlan, registry: ExactMaterializationRegistry)`, `CompositionPlan`, `ExactMaterializationRegistry`, and the *same* `EXACT_CATALOG_REGISTRY.fragments`/`.variants` maps. It does not construct, copy, sort, or cache a second registry.
- Produces:

```ts
export type CatalogExactRegistries = ExactMaterializationRegistry;
export function createCatalogPlanMaterializer(
  registries: CatalogExactRegistries,
  materialize?: typeof materializeExactComposition,
): (plan: CompositionPlan) => UnfinalizedExactCompositionResult<ReferenceExactDrawing>;
export const materializeCatalogPlan: ReturnType<typeof createCatalogPlanMaterializer>;
```

- [ ] **Step 1: Add compile-safe adapter exports, then write the failing delegation test.** Start with an exported `createCatalogPlanMaterializer` stub that throws `NotImplementedError` and a typed `materializeCatalogPlan` stub created from the canonical registry maps, so import/type success is not the RED. Inject a spy for `materializeExactComposition`, pass one plan, and assert the adapter calls Core exactly once with that same plan and the exact registry object `{ fragments: EXACT_CATALOG_REGISTRY.fragments, variants: EXACT_CATALOG_REGISTRY.variants }`, then returns the same result object. Registry uniqueness/order belongs to the corpus aggregator's tests and is not reimplemented here. Scan the module source in the test and forbid map construction, sorting, node/path traversal loops, or calls to geometry constructors.

```ts
const coreResult = deepFrozenExactResult();
const coreMaterialize = vi.fn().mockReturnValue(coreResult);
const materialize = createCatalogPlanMaterializer(registries, coreMaterialize);
expect(materialize(plan)).toBe(coreResult);
expect(coreMaterialize).toHaveBeenCalledTimes(1);
expect(coreMaterialize).toHaveBeenCalledWith(plan, registries);
```

- [ ] **Step 2: Verify behavioral RED.**

Run: `rtk mise exec -- pnpm exec vitest run packages/catalog/src/exact/registry-adapter.test.ts`

Expected: FAIL because the compile-safe stub throws before making the required one Core delegation; no missing import or compiler error is accepted as RED.

- [ ] **Step 3: Implement exactly one direct delegation over canonical maps.** Initialize one frozen `CatalogExactRegistries` object whose two fields are the aggregator's existing map objects by reference. The adapter contains no map construction, duplicate check, ordering pass, plan-instance loop, geometry construction, transform application, trace generation, digest computation, or result freezing; the aggregator and Core own those responsibilities.

```ts
export function createCatalogPlanMaterializer(registries, materialize = materializeExactComposition) {
  return (plan: CompositionPlan) => materialize(plan, registries);
}
```

- [ ] **Step 4: Verify GREEN and the catalog package.**

Run: `rtk mise exec -- pnpm exec vitest run packages/catalog/src/exact/registry-adapter.test.ts packages/core/src/exact/materialize.test.ts`

Expected: PASS; the catalog test observes exactly one Core call and Core's own suite owns geometry/trace atomicity.

Run: `rtk mise exec -- pnpm exec tsc -p packages/catalog/tsconfig.build.json --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit only these files.**

```bash
rtk git -c core.fsmonitor=false add packages/catalog/src/exact/registry-adapter.ts packages/catalog/src/exact/registry-adapter.test.ts
rtk git -c core.fsmonitor=false commit -m "feat(catalog): adapt exact registries to core"
```

### Task 2: Fail-closed resolved Builder context and known-asset routing

**Files:**
- Create: `packages/catalog/src/exact/context.ts`
- Create: `packages/catalog/src/exact/context.test.ts`

**Interfaces:**
- Consumes: Foundation `resolveReachableBuilderContext(spec): ResolvedBuilderContext`, `ResolvedBuilderContext { key, projection, componentContexts, plan, generatedOverlays }`, the object-identical `REACHABLE_BUILDER_CONTEXT_SET` and `REFERENCE_COMPONENT_CONTEXT_SET`, public `SymbolSpec` validation, `canonicalKnownSymbolSpecDigest`, and only the canonical maps/sets on `EXACT_CATALOG_REGISTRY`: both context sets, `knownSymbolSpecAssets`, component variants/fixtures/cases, Composition Contracts/Cases/Witnesses, asset/component plans, display fixtures, and recipe-to-asset links. It neither constructs a second context set nor reads the standalone known-spec candidate constant.
- Produces:

```ts
export function exactVariantFor(
  component: ComponentKey,
  context: ComponentContextKey,
): ExactComponentVariant;
export function exactAssetKeyForSpec(spec: SymbolSpec): ExactAssetKey | undefined;
export function exactCompositionRequest(spec: SymbolSpec): ExactCompositionRequest;

export type ExactCompositionSource =
  | {
      readonly kind: 'known-asset';
      readonly exactAsset: ExactAssetKey;
      readonly fixture: ExactAssetFixture;
    }
  | { readonly kind: 'free-builder' };

export interface ExactCompositionRequest {
  readonly validatedSpec: SymbolSpec;
  readonly resolved: ResolvedBuilderContext;
  readonly source: ExactCompositionSource;
  readonly selectedPlan: CompositionPlan;
  readonly generatedOverlays: readonly GeneratedOverlayLayer[];
}

export interface ExactComponentContextRegistryIssue {
  readonly code:
    | 'reference-context-missing'
    | 'reference-context-extra'
    | 'reference-context-duplicate'
    | 'reference-context-crossover'
    | 'reference-component-uncovered'
    | 'reference-variant-mismatch'
    | 'reference-fixture-mismatch'
    | 'reference-contract-mismatch'
    | 'reference-case-mismatch'
    | 'reference-witness-missing'
    | 'public-context-mismatch';
  readonly key: string;
  readonly detail: string;
}
export function exactComponentContextRegistryIssues(
  registry: ExactCatalogRegistry,
): readonly ExactComponentContextRegistryIssue[];
export function assertExactComponentContextRegistry(registry: ExactCatalogRegistry): void;
```

- [ ] **Step 0: Create the new context module as a compile-safe shell.** Export every final type/function above from `context.ts`; each function throws typed `RED_EXACT_CONTEXT_NOT_IMPLEMENTED` before lookup or plan construction. Run `rtk mise exec -- pnpm exec tsc -p packages/catalog/tsconfig.build.json --noEmit` to PASS before adding `context.test.ts`. A missing module/export or unresolved import is not RED evidence.

- [ ] **Step 1: Write failing finite-context, exact-plan-selection, and overlay-projection tests.** Require the registry's two set fields to be object-identical to Foundation's canonical constants. Project the `access: 'public-builder'` entries of `ReferenceComponentContextSet/v1` and require exact ordered-pair equality with `ReachableBuilderContextSet/v1`; require the other disjoint partitions to be exactly the 151 `reference-only` noncomposable snapshot components and 15 `direct-carrier` components. Assert exactly 247 distinct public Component-Keys, not 247 public pairs; require `publicPairs.length === REACHABLE_BUILDER_CONTEXT_SET.pairs.length` and `totalPairs.length === publicPairs.length + 166`. The total set has no missing/extra/duplicate pair, its component projection is exactly all 413 `PaintComponentRegistry` keys, and no nonpublic pair has a representative Spec/proof path or can be returned by `resolveReachableBuilderContext`. For every total reference pair assert exactly one matching variant, component fixture, Composition Contract with the same `access`, ComponentCase and ContractCase, and at least one consistent Witness Edge. For every `CompositionWitnessEdge`, resolve `witness.componentFixture` through `EXACT_CATALOG_REGISTRY.componentFixtures`, then use that fixture's `component`, `context`, and `variant`; the Edge itself has no such direct fields. Assert an absent fixture or inconsistent Edge contract fails, and an unregistered tuple throws `NotMeasuredError` with `scope: 'combination'`. Mutate otherwise complete registries to remove, add, duplicate, and cross an entry between public and nonpublic partitions, and remove the sole context of one component; require stable issue codes and fail-closed assertion before lookup.

  Construct the independent ordered known input sequence from all 14 `BASE_SYMBOLS` entries as
  `{ kind: entry.kind }` plus all 242 `RECIPES[*].spec`, validate every Spec through the public
  validator, and derive its key only with `canonicalKnownSymbolSpecDigest`. Require 256 unique
  digests, exact keyset equality with `EXACT_CATALOG_REGISTRY.knownSymbolSpecAssets`, and a
  registry size of 256. Every indexed value must resolve in `EXACT_CATALOG_REGISTRY.exactAssets`;
  each of the 242 `recipeExactAssetLinks` must agree with the same digest-index value. For every
  one of the 256 validated inputs, `exactAssetKeyForSpec` must return exactly that map value and
  `exactCompositionRequest` must select the object-identical fixture/plan with no overlay. Mutate
  complete canonical Specs to cover array-order retention and free-text retention. A free valid
  Spec, including an otherwise identical Spec with nonblank free text, maps to `undefined`.
  Duplicate canonical bytes, digest collisions and disagreeing assets remain fail-closed in the
  consumed Foundation registry producer; Integration neither repairs nor resolves such an index.

  For every validated known Base- or recipe-Spec, resolve the index-selected
  `ExactAssetFixture` exactly once and require
  `source.kind === 'known-asset'`, `source.exactAsset === fixture.key`, object-identical
  `source.fixture`, object-identical `selectedPlan === fixture.plan`, and
  `generatedOverlays: []`. The Foundation-produced `resolved` object is retained only as the
  validated finite-context proof; its on-demand `builder:` plan is not selected or materialized
  for this known-asset route. For every free valid representative, require
  `source.kind === 'free-builder'`, object-identical `selectedPlan === resolved.plan`, and
  object-identical `generatedOverlays === resolved.generatedOverlays`. No request may contain a
  second selected plan/result source or combine the known and free routes.

  Pin all finite numeric/enum placement axes through `resolved.projection`, `resolved.componentContexts`, contracts, and `resolved.key`. For two specs with the same finite projection but different arbitrary strings in every supported `SymbolSpec.labels` text zone and `designation`, require identical `key`/`projection`/`componentContexts`/`plan` identities but different overlay content. Require `generatedOverlays` to be the complete Foundation-produced ordered list: at most one `body-labels` layer containing every supplied free label zone, followed by at most one `designation` layer. Each layer already carries `claim:'not-reference-identical'`, executable `overlayToExact`, and Foundation-computed `overlayToExactDigest`; no free text/custom-generated measurement enters ComponentContextKey, plan, Exact geometry, or Paint digests. Known exact assets and exact component fixtures yield no generated overlay.

```ts
for (const witness of EXACT_CATALOG_REGISTRY.compositionWitnessEdges.values()) {
  const fixture = EXACT_CATALOG_REGISTRY.componentFixtures.get(witness.componentFixture)!;
  expect(fixture).toBeDefined();
  expect(exactVariantFor(fixture.component, fixture.context).key).toBe(fixture.variant);
  expect(witness.contract).toBe(compositionContractKey(fixture.component, fixture.context));
}
expect(() => exactVariantFor('component:body/formation', alienContext)).toThrow(NotMeasuredError);
for (const spec of validatedKnownSpecs) {
  const digest = canonicalKnownSymbolSpecDigest(spec);
  expect(exactAssetKeyForSpec(spec))
    .toBe(EXACT_CATALOG_REGISTRY.knownSymbolSpecAssets.get(digest));
}
const requestA = exactCompositionRequest(specWithAllLabelZonesAndDesignationA);
const requestB = exactCompositionRequest(specWithAllLabelZonesAndDesignationB);
expect(requestA.resolved).toBe(resolvedA);
expect(requestA.source).toEqual({ kind: 'free-builder' });
expect(requestA.selectedPlan).toBe(resolvedA.plan);
expect(requestA.generatedOverlays).toBe(resolvedA.generatedOverlays);
expect(requestB.resolved).toBe(resolvedB);
expect(requestB.selectedPlan).toBe(resolvedB.plan);
expect(digestCanonical(requestA.selectedPlan)).toBe(digestCanonical(requestB.selectedPlan));
expect(requestA.generatedOverlays.map(({ purpose }) => purpose))
  .toEqual(['body-labels', 'designation']);
```

- [ ] **Step 2: Verify behavioral RED.** RED must be the expected plan-instance/contract assertion from the already compile-green shell, not a missing-module failure.

Run: `rtk mise exec -- pnpm exec vitest run packages/catalog/src/exact/context.test.ts`

Expected: FAIL because the stub does not return Foundation's exact `ResolvedBuilderContext`/plan/ordered overlays unchanged.

- [ ] **Step 3: Implement canonical lookup without a plan or overlay factory.** `assertExactComponentContextRegistry` first validates the canonical total/public partition and all total-pair registry relations. `exactVariantFor` accepts every and only pair in `registry.referenceComponentContextSet`, so direct component conformance/review can address nonpublic reference pairs. In contrast, validate each Spec and call Foundation `resolveReachableBuilderContext` exactly once; every entry returned for Builder composition must exist in `registry.reachableBuilderContextSet` and in the total set with `access: 'public-builder'`. Never derive a nonpublic context from a Spec or construct another Builder-key serializer, projection, context object, plan factory, overlay factory, known-spec serializer, hash function, or index. Require exactly one registry variant/contract for every ordered entry in `resolved.componentContexts`, then perform the sole known lookup literally as `EXACT_CATALOG_REGISTRY.knownSymbolSpecAssets.get(canonicalKnownSymbolSpecDigest(validatedSpec))`. The complete validated Spec, not `resolved.projection`, `resolved.key`, a raw recipe/base key, filename, or heuristic subset, is the digest input. The finalized registry must contain exactly the independently derived 256-key known set and no dangling value before any request is served.

  If and only if that map resolves a known asset, require `resolved.generatedOverlays` to be empty,
  resolve exactly one existing `ExactAssetFixture`, and select that fixture's existing plan:
  `{ validatedSpec, resolved, source: { kind:'known-asset', exactAsset, fixture },
  selectedPlan: fixture.plan, generatedOverlays: [] }`. Otherwise return
  `{ validatedSpec, resolved, source: { kind:'free-builder' },
  selectedPlan: resolved.plan, generatedOverlays: resolved.generatedOverlays }`, preserving the
  plan/overlay object identities. This is selection between two already authoritative sources,
  not plan construction or trace retargeting. Reject a missing/mismatched fixture, a known link
  with overlays, a fixture whose plan target is not its own ExactAsset key, or any attempt to
  select both sources. Do not materialize nodes, merge drawings, construct a trace, project a
  display, add/re-render label/designation geometry, or synthesize an asset-target trace. No
  nearest-context, kind-only, first-entry, semantic `compose`, or fallback drawing is allowed.

```ts
const matches = [...EXACT_CATALOG_REGISTRY.variants.values()].filter(
  (variant) => variant.component === component && variant.context === context,
);
if (matches.length !== 1) {
  throw new NotMeasuredError(
    `Komponente "${component}" hat im Kontext "${context}" nicht genau eine belegte Fassung.`,
    'combination',
  );
}
return matches[0];
```

- [ ] **Step 4: Verify GREEN plus the public/total context invariants.** The test compares the component-owner multiset implied by each Foundation-resolved public plan with the exact required-component multiset of its Composition Contract, including duplicates and instance order, proves Task 2 returned each plan/overlay object unchanged, and separately proves total reference lookup/fixture/case/contract/witness coverage without making any nonpublic pair Builder-reachable.

Run: `rtk mise exec -- pnpm exec vitest run packages/catalog/src/exact/context.test.ts packages/catalog/src/exact/batches/index.test.ts`

Expected: PASS; the public pair projection equals the complete reachable pair set, its Component-Key projection is 247, the total pair count is Reachable plus 166, the disjoint total set covers all 413 components, and every total pair has complete exact evidence.

- [ ] **Step 5: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/catalog/src/exact/context.ts packages/catalog/src/exact/context.test.ts
rtk git -c core.fsmonitor=false commit -m "feat(catalog): resolve exact component contexts"
```

### Task 3: Stable catalog exact API and legacy composition delegation

**Files:**
- Create: `packages/schema/src/output-claim.ts`
- Create: `packages/schema/src/output-claim.test.ts`
- Modify: `packages/schema/src/index.ts`
- Create: `packages/catalog/src/exact/api.ts`
- Create: `packages/catalog/src/exact/api.test.ts`
- Create: `packages/catalog/src/recipes-exact.test.ts`
- Modify: `packages/catalog/src/recipes.ts`
- Modify: `packages/catalog/src/index.ts`

**Interfaces:**
- Consumes: Tasks 1-2 and `EXACT_CATALOG_REGISTRY` only.
- Produces the exact public signatures from spec section 6: `exactAsset`, `exactAssetResult`, `exactAssetKeys`, `exactComponent`, `exactComponentResult`, `exactComponentKeys`, `exactComponentContextKeys`, `exactComponentFixtureKeys`, `exactComponentFixture`, `exactComponentFixtureResult`, `composeExact`, `composeFromCatalog`, and `compositionTraceOf`.
- Produces the output-claim and generated-overlay trace contract used by every channel:

```ts
export type RenderOutputClaim =
  | 'exact-reference-parity'
  | 'reference-identical-components'
  | 'not-reference-identical'
  | 'semantic-no-exact-claim';

export interface GeneratedOverlayTraceRecord {
  readonly layer: GeneratedOverlayLayer;
  readonly purpose: GeneratedOverlayLayer['purpose'];
  readonly overlayToExact: ExactTransformSequence;
  readonly overlayToExactDigest: Sha256Digest;
}

export type CompositionTraceWithGeneratedOverlays = CompositionTrace & {
  readonly generatedOverlays: readonly GeneratedOverlayTraceRecord[];
};

export interface ExactCompositionResult<
  D extends ReferenceExactDrawing | LayeredDrawing = ReferenceExactDrawing | LayeredDrawing,
> extends Omit<UnfinalizedExactCompositionResult<D>, 'trace'> {
  readonly trace: CompositionTraceWithGeneratedOverlays;
}

export function outputClaimOf(result: ExactCompositionResult): RenderOutputClaim;
export function defaultOutputClaimForDrawing(drawing: RenderableDrawing): RenderOutputClaim;
export function createComposeExact(ports: {
  readonly resolveRequest: typeof exactCompositionRequest;
  readonly materialize: typeof materializeCatalogPlan;
  readonly knownAssetResult: (key: ExactAssetKey) => ExactCompositionResult<ReferenceExactDrawing>;
}): (spec: SymbolSpec) => ExactCompositionResult;
```

- [ ] **Step 0: Create all new schema/catalog production modules as compile-safe shells.** Export the final `RenderOutputClaim`, `GeneratedOverlayTraceRecord`, `CompositionTraceWithGeneratedOverlays`, the single canonical public result `ExactCompositionResult`, claim helpers, exact API functions, and `createComposeExact` signatures from `output-claim.ts`/`api.ts`; use typed throwing or deliberately nondelegating bodies and wire the package indexes without materializing geometry or modifying recipes. No alias or second public exact-result name is permitted; Foundation's `UnfinalizedExactCompositionResult` and `FinalizedExactCompositionRecord` remain internal producer/finalizer contracts. Run `rtk mise exec -- pnpm exec tsc -p packages/schema/tsconfig.build.json --noEmit` and `rtk mise exec -- pnpm exec tsc -p packages/catalog/tsconfig.build.json --noEmit` to PASS before creating the three new tests. Missing files, exports, or imports never count as RED.

- [ ] **Step 1: Write failing public-contract, exclusive-source, and complete-overlay tests.** Assert 661 sorted asset keys, exactly 413 component keys, complete component fixture keys, unknown-key failure, frozen cached asset result identity, and drawing/trace projections from the same authoritative result. Add declaration/type assertions that every public exact-result API returns `ExactCompositionResult` and that no second public exact-result alias is exported. `exactAssetResult` and `exactComponentFixtureResult` return `ExactCompositionResult<ReferenceExactDrawing>` with a frozen empty `trace.generatedOverlays`; their drawing helpers preserve object identity.

  `exactComponentKeys()` is the sorted 413-key projection of the total
  `registry.referenceComponentContextSet`; `exactComponentContextKeys(component)` is the sorted
  total-context projection for that component; and direct `exactComponent`/fixture/result lookup
  accepts every total reference pair, including `reference-only` and `direct-carrier`. These APIs
  do not imply Builder reachability. Only `composeExact`/`composeFromCatalog` consume a
  `SymbolSpec`, and their resolved component/context pairs must be exactly within
  `registry.reachableBuilderContextSet` and the total set's `public-builder` partition.

  Inject `materialize` and `knownAssetResult` spies through `createComposeExact`. One known Base
  Spec and one known recipe Spec each resolve once, select their existing fixture plan, call
  `knownAssetResult(source.exactAsset)` exactly once, call `materialize` zero times, and return
  their cached result object unchanged; each trace target is its ExactAsset key and overlays are
  empty. A free reachable context resolves
  once, calls `materialize(request.selectedPlan)` exactly once with the object-identical
  Foundation plan, calls `knownAssetResult` zero times, and consumes exactly
  `request.generatedOverlays`. Mutate the discriminator, selected plan/fixture identity, asset
  trace target, or overlay emptiness and require failure before either execution port. There is no
  branch that materializes both plans, retargets a builder trace, or silently falls back from one
  source to the other.

  Exercise one free spec containing arbitrary strings in **every** supported `SymbolSpec.labels` text zone, custom-generated label metrics, and designation. Require the resulting `LayeredDrawing` to contain the exact materialized paint layer first and then every object from `request.generatedOverlays` in Foundation order (`body-labels`, then `designation`) without copy, sorting, filtering, merging, or re-rendering. Each appended trace record must reference the same `GeneratedOverlayLayer`, the same `purpose`, the same `overlayToExact` array, and the same Foundation-supplied `overlayToExactDigest`; changing any one of those four values must fail the trace/drawing consistency assertion. Known exact assets, exact component fixtures, and free specs without arbitrary label text, custom-generated metrics, or designation have `generatedOverlays: []`, remain unlayered, and create no generated-overlay trace record.

  Enumerate component conformance from `EXACT_CATALOG_REGISTRY.componentCases`, not from fixtures by assumption: its sorted fixture-reference projection must equal `EXACT_CATALOG_REGISTRY.componentFixtures.keys()` exactly, every case resolves its total-set pair/fixture/context/plan, and `exactComponentFixtureKeys()` must equal that same set. Mutations for one missing, duplicate, extra/non-reference, or public/nonpublic-crossover ComponentCase fail even when the total ComponentKey count remains 413.

```ts
expect(exactAssetKeys()).toHaveLength(661);
expect(exactAssetKeys()).toEqual([...exactAssetKeys()].sort());
expect(exactComponentKeys()).toHaveLength(413);
const result = exactAssetResult(exactAssetKeys()[0]!);
expect(exactAsset(exactAssetKeys()[0]!)).toBe(result.drawing);
expect(result.trace.target).toBe(exactAssetKeys()[0]);

const request = exactCompositionRequest(specWithAllLabelZonesAndDesignation);
const free = composeExact(specWithAllLabelZonesAndDesignation);
expect(free.drawing.kind).toBe('layered');
const overlays = free.drawing.kind === 'layered' ? free.drawing.layers.slice(1) : [];
expect(overlays).toEqual(request.generatedOverlays);
expect(overlays.every((layer, index) =>
  layer === request.generatedOverlays[index]
)).toBe(true);
expect(free.trace.generatedOverlays.map(({ purpose }) => purpose))
  .toEqual(['body-labels', 'designation']);
for (const [index, traceRecord] of free.trace.generatedOverlays.entries()) {
  const layer = request.generatedOverlays[index]!;
  expect(traceRecord.layer).toBe(layer);
  expect(traceRecord.overlayToExact).toBe(layer.overlayToExact);
  expect(traceRecord.overlayToExactDigest).toBe(layer.overlayToExactDigest);
}

const materialize = vi.fn(() => exactResult);
const knownAssetResult = vi.fn(() => knownExactAssetResult);
const compose = createComposeExact({ resolveRequest, materialize, knownAssetResult });
expect(compose(reachableSpec)).toEqual(expectedResult);
expect(materialize).toHaveBeenCalledTimes(1);
expect(materialize).toHaveBeenCalledWith(canonicalRequest.selectedPlan);
expect(knownAssetResult).not.toHaveBeenCalled();
```

For each reachable spec, project the resulting trace's component-owner multiset and compare it to the Composition Contract's required multiset; assert all placement transforms and trace-node instance keys match the one plan. Also assert that passing the existing optional title to `composeFromCatalog(spec, title)` changes accessibility metadata only and leaves the normalized paint-list digest equal to `composeExact(spec).drawing`.

- [ ] **Step 2: Verify behavioral RED.** RED is the spy call-count/owner-multiset assertion from the already compile-green shells.

Run: `rtk mise exec -- pnpm exec vitest run packages/schema/src/output-claim.test.ts packages/catalog/src/exact/api.test.ts packages/catalog/src/recipes-exact.test.ts`

Expected: FAIL because the stub does not call the sole materializer once and recipes do not yet carry registry links.

- [ ] **Step 3: Implement cached direct lookups and exactly one selected execution path.** Use existing maps on `EXACT_CATALOG_REGISTRY`; do not rebuild corpus arrays/maps. Materialize `Recipe.exactAsset: ExactAssetKey` for all 242 recipes from the registry links. Direct `exactAssetResult`/component fixture access caches its own deep-frozen `ExactCompositionResult<ReferenceExactDrawing>` after adding the required empty generated-overlay trace tuple once.

  `composeExact` resolves one request and then switches exactly once on `request.source.kind`.
  For `known-asset`, assert `request.selectedPlan === source.fixture.plan`, the plan target equals
  `source.exactAsset`, and `request.generatedOverlays` is empty; return
  `exactAssetResult(source.exactAsset)` by object identity, with its existing asset-target trace,
  and never call the free materializer. For `free-builder`, assert
  `request.selectedPlan === request.resolved.plan` and
  `request.generatedOverlays === request.resolved.generatedOverlays`, then invoke
  `materializeCatalogPlan(request.selectedPlan)` exactly once and never read the asset cache.
  Neither route constructs/replaces a plan, re-targets a trace, materializes component-by-component,
  calls legacy `compose`, or falls back to the other route.

  On the free route, consume the entire ordered `request.generatedOverlays` array unchanged. If empty, return the exact result without a wrapper and with `trace.generatedOverlays: []`. Otherwise construct one `LayeredDrawing` whose first layer wraps the materialized exact drawing and whose remaining layers are the same overlay objects in the same order. Append exactly one trace record per overlay; each record preserves the layer object, `purpose`, `overlayToExact` object, and Foundation-supplied `overlayToExactDigest` by reference/value without recomputing a digest. Do not call an `addDesignationLayer`/label renderer, rebuild, copy, sort, filter, collapse, or partially consume overlays. Drawing/trace helpers only project the returned object. Keep the optional title on `composeFromCatalog`, applying it as accessibility metadata after atomic composition.

```ts
export function composeFromCatalog(spec: SymbolSpec, title?: string): RenderableDrawing {
  const result = composeExact(spec);
  return title === undefined ? result.drawing : withAccessibilityTitle(result.drawing, title);
}

export function compositionTraceOf(spec: SymbolSpec): CompositionTraceWithGeneratedOverlays {
  return composeExact(spec).trace;
}
```

`outputClaimOf` returns `exact-reference-parity` only for the unmodified cached known-asset result whose existing trace target is that ExactAsset and whose `generatedOverlays` is empty; it never infers that claim by re-targeting a free trace. It returns `reference-identical-components` for a free/component exact result with no generated overlays and `not-reference-identical` whenever any `body-labels` or `designation` overlay exists. `defaultOutputClaimForDrawing` is deliberately conservative for context-free values: semantic `Drawing` returns `semantic-no-exact-claim`, bare `ReferenceExactDrawing` returns `reference-identical-components`, and `LayeredDrawing` returns `not-reference-identical`. It never upgrades a bare exact/layered/free drawing to a whole-asset claim.

- [ ] **Step 4: Verify GREEN, existing recipes, and package exports.**

Run: `rtk mise exec -- pnpm exec vitest run packages/schema/src/output-claim.test.ts packages/catalog/src/exact/api.test.ts packages/catalog/src/recipes-exact.test.ts packages/catalog/src/recipes.test.ts packages/catalog/src/recipes-anhang-n.test.ts packages/catalog/src/rule-coverage.test.ts`

Expected: PASS.

Run: `rtk mise exec -- pnpm exec tsc -p packages/catalog/tsconfig.build.json --noEmit`

Expected: PASS and the generated declaration exposes all exact signatures from the package root.

- [ ] **Step 5: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/schema/src/output-claim.ts packages/schema/src/output-claim.test.ts packages/schema/src/index.ts packages/catalog/src/exact/api.ts packages/catalog/src/exact/api.test.ts packages/catalog/src/recipes-exact.test.ts packages/catalog/src/recipes.ts packages/catalog/src/index.ts
rtk git -c core.fsmonitor=false commit -m "feat(catalog): expose exact composition API"
```

### Task 4: Exact Canvas compatibility and explicit shared-SVG claim metadata

**Files:**
- Modify: `packages/core/src/render/canvas.ts`
- Create: `packages/core/src/render/canvas-exact.test.ts`
- Modify: `packages/core/src/render/raster-dimensions.ts`
- Modify: `packages/core/src/render/raster-dimensions.test.ts`
- Modify: `packages/core/src/render/svg.ts`
- Create: `packages/core/src/render/svg-claim.test.ts`

**Interfaces:**
- Consumes: `RenderableDrawing`, `RenderOutputClaim`, exact decimal/path/transform helpers, and existing semantic Canvas/SVG rendering.
- Produces: `renderCanvas(drawing: RenderableDrawing, ctx: CanvasRenderingContext2D, options?: CanvasOptions): void`, the sole browser-neutral `rasterDimensionsForWidth(viewBox: Drawing['viewBox'] | ExactViewBox, widthPx: number): RasterDimensions`, and `SvgOptions.outputClaim?: RenderOutputClaim`. `renderSvg` remains the only SVG serializer and places an explicit `data-einsatzzeichen-claim` on the root.

  `packages/core/src/render/raster-dimensions.ts` is the one and only dimension service. Extend its existing `rasterDimensionsForWidth`; do not add a CLI-local ratio helper, a differently named wrapper, or another dimensions module. Foundation Exact-SVG, Canvas, MapLibre, deterministic raster, strict comparison, Website PNG, and QGIS/export code must all import this exact function.

- [ ] **Step 1: Add recording-context, sole-dimension-owner, and claim RED tests.** Use an exact fixture containing rect, circle, `M/L/C/Z`, even-odd fill, an ordered translate/rotate/scale transform, and both ordered generated overlays (`body-labels`, then `designation`). Assert native exact coordinates become Canvas numbers only at the output boundary, transforms occur in declared order, and each generated overlay is wrapped exactly once by its own `overlayToExact`. Assert the one dimension function accepts an exact `48 × 32` viewBox and produces 96 × 64 for width 96. Source-scan Core, CLI, MapLibre, Website, QGIS, and export production modules: every proportional output dimension must import `rasterDimensionsForWidth` from `packages/core/src/render/raster-dimensions.ts`, and no wrapper or second ratio/rounding implementation may exist. In `svg-claim.test.ts`, require explicit exact/component/non-identical/semantic root metadata and reject `outputClaim: 'exact-reference-parity'` for any `LayeredDrawing`.

```ts
renderCanvas(EXACT_LAYERED_FIXTURE, recorder.context, { size: 96 });
expect(recorder.calls).toContainEqual(['bezierCurveTo', 1, 2, 3, 4, 5, 6]);
expect(recorder.calls).toContainEqual(['fill', 'evenodd']);
expect(recorder.transformCalls.map((call) => call.kind)).toEqual([
  'translate', 'rotate', 'scale', 'overlay-to-exact',
]);
expect(rasterDimensionsForWidth({ x: '0', y: '0', width: '48', height: '32' }, 96))
  .toEqual({ widthPx: 96, heightPx: 64 });
```

- [ ] **Step 2: Verify RED.** Add compile-safe option plumbing first; RED is the missing exact Canvas operations/root claim assertion.

Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/render/canvas-exact.test.ts packages/core/src/render/raster-dimensions.test.ts packages/core/src/render/svg-claim.test.ts`

Expected: FAIL because canvas and raster dimensions accept only the semantic numeric drawing/viewBox.

- [ ] **Step 3: Implement a discriminated Canvas dispatch and claim-only SVG wrapper.** Keep semantic geometry behavior unchanged. For exact nodes, replay canonical transforms/path commands without geometry simplification; for layered drawings, render the exact layer first and then every generated overlay in its existing order, each inside exactly its own `overlayToExact`, without assuming designation is the only overlay purpose. Canvas stays browser compatibility output and is never imported by the deterministic raster service. In `renderSvg`, forward the drawing to the existing semantic/exact dispatcher exactly once and add only validated root claim metadata; default claims are conservative (`semantic-no-exact-claim` for legacy `Drawing`, `reference-identical-components` for bare exact drawings, `not-reference-identical` for layered drawings). Only an asset-aware caller may request `exact-reference-parity`.

- [ ] **Step 4: Verify GREEN and regression suites.**

Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/render/canvas-exact.test.ts packages/core/src/render/canvas.test.ts packages/core/src/render/raster-dimensions.test.ts packages/core/src/render/svg-claim.test.ts packages/core/src/render/svg.test.ts`

Expected: PASS.

Run: `rtk mise exec -- pnpm exec tsc -p packages/core/tsconfig.build.json --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/core/src/render/canvas.ts packages/core/src/render/canvas-exact.test.ts packages/core/src/render/raster-dimensions.ts packages/core/src/render/raster-dimensions.test.ts packages/core/src/render/svg.ts packages/core/src/render/svg-claim.test.ts
rtk git -c core.fsmonitor=false commit -m "feat(core): render exact drawings on canvas"
```

### Task 5: React consumes every renderable drawing without a renderer fork

**Files:**
- Modify: `packages/react/src/einsatzzeichen.ts`
- Modify: `packages/react/src/react.test.ts`
- Create: `packages/react/type-tests/exact-input.tsx`
- Create: `packages/react/tsconfig.type-tests.json`

**Interfaces:**
- Consumes: `RenderableDrawing`, `RenderOutputClaim`, `renderSvg`, and unchanged `SvgOptions`.
- Produces: `useEinsatzzeichenSvg(drawing: RenderableDrawing, options?: SvgOptions): string`, `EinsatzzeichenProps.drawing: RenderableDrawing`, and explicit `EinsatzzeichenProps.outputClaim: RenderOutputClaim`.

- [ ] **Step 1: Add a real compiler RED and runtime regression assertions.** `type-tests/exact-input.tsx` constructs typed exact-asset, exact-component, and `LayeredDrawing` values and passes them with their explicit claims to `useEinsatzzeichenSvg(..., { outputClaim })` and `<Einsatzzeichen drawing={...} outputClaim={...}>`; its dedicated tsconfig enables the repository's React JSX mode and includes only that fixture plus package declarations. Before the production signature changes, run TypeScript and require diagnostic `TS2345` or `TS2322` at those calls (and assert there is no syntax/module-resolution diagnostic). Separately define all three fixtures in the Vitest package and compare React markup with the one shared `renderSvg` result; do not run or claim those runtime assertions as RED, because the existing transpiled runtime can accept the value despite the public type narrowing. Spy on `renderSvg` and require exactly one call carrying the same `SvgOptions.outputClaim`; changing only the claim invalidates memoization, while rerendering with identical drawing/options/claim does not.

```ts
it.each([
  [SEMANTIC_DRAWING, 'semantic-no-exact-claim'],
  [EXACT_ASSET_DRAWING, 'exact-reference-parity'],
  [EXACT_COMPONENT_DRAWING, 'reference-identical-components'],
  [LAYERED_DRAWING, 'not-reference-identical'],
] as const)('reproduces shared renderer output', (drawing, outputClaim) => {
  const html = renderToStaticMarkup(createElement(Einsatzzeichen, {
    drawing, size: 64, outputClaim,
  }));
  expectSameSvg(html, renderSvg(drawing, { size: 64, outputClaim }));
});
```

- [ ] **Step 2: Verify the compiler RED.** This compiler failure is the sole RED evidence; Vitest transpilation is not accepted as type evidence.

Run: `rtk mise exec -- pnpm exec tsc -p packages/react/tsconfig.type-tests.json --noEmit`

Expected: FAIL with `TS2345`/`TS2322` at the exact/layered fixture calls because the hook and prop still accept `Drawing` only.

- [ ] **Step 3: Replace only the type/claim boundary.** Import `RenderableDrawing`/`RenderOutputClaim`, use them for the hook and props, and construct one memoized `SvgOptions` object that explicitly includes `outputClaim`. Pass that object once to the sole `renderSvg` call and include claim plus every other option in memo dependencies; do not inspect the drawing discriminator or infer/upgrade a claim in React.

- [ ] **Step 4: Verify GREEN.**

Run: `rtk mise exec -- pnpm exec vitest run packages/react/src/react.test.ts`

Expected: PASS for semantic, exact-asset, exact-component, and layered inputs with explicit claim forwarding and memoization.

Run: `rtk mise exec -- pnpm exec tsc -p packages/react/tsconfig.type-tests.json --noEmit`

Expected: PASS with the exact/layered compile fixture included.

Run: `rtk mise exec -- pnpm exec tsc -p packages/react/tsconfig.build.json --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/react/src/einsatzzeichen.ts packages/react/src/react.test.ts packages/react/type-tests/exact-input.tsx packages/react/tsconfig.type-tests.json
rtk git -c core.fsmonitor=false commit -m "feat(react): accept exact renderable drawings"
```

### Task 6: Web Component consumes every renderable drawing

**Files:**
- Modify: `packages/web-component/src/element.ts`
- Modify: `packages/web-component/src/fixture.test-helper.ts`
- Modify: `packages/web-component/src/element.test.ts`
- Modify: `packages/web-component/src/element.dom.test.ts`
- Create: `packages/web-component/type-tests/exact-input.ts`
- Create: `packages/web-component/tsconfig.type-tests.json`

**Interfaces:**
- Consumes: `RenderableDrawing`, `RenderOutputClaim`, and the common `renderSvg` dispatcher.
- Produces: `renderElementMarkup(drawing: RenderableDrawing | undefined, options: ElementMarkupOptions): string`, `ElementMarkupOptions.outputClaim: RenderOutputClaim`, `EinsatzzeichenElement.drawing: RenderableDrawing | undefined`, and a validated `EinsatzzeichenElement.outputClaim: RenderOutputClaim` property/attribute.

- [ ] **Step 1: Add a real compiler RED and Node/DOM regression assertions.** The dedicated type fixture assigns exact-asset/exact-component/layered values plus their `RenderOutputClaim` to `EinsatzzeichenElement.drawing`/`.outputClaim` and calls `renderElementMarkup(drawing, { outputClaim })`; before implementation it must produce `TS2322`/`TS2345`. Put runtime fixtures in `fixture.test-helper.ts` and assert shared-renderer equality, Shadow DOM replacement, size, `id-prefix`, validated claim-property reflection, and exactly one Core call carrying the same claim; these runtime assertions run only after the type boundary changes and are not described as RED. Reject missing/unknown claims for exact/layered values and specifically reject `exact-reference-parity` for a `LayeredDrawing` before calling Core.

```ts
el.outputClaim = 'reference-identical-components';
el.drawing = exactComponentDrawing;
expect(el.shadowRoot?.innerHTML).toBe(serialized(renderSvg(exactComponentDrawing, {
  outputClaim: 'reference-identical-components',
})));
el.outputClaim = 'not-reference-identical';
el.drawing = layeredDrawing;
expect(el.shadowRoot?.innerHTML).toBe(serialized(renderSvg(layeredDrawing, {
  outputClaim: 'not-reference-identical',
})));
```

- [ ] **Step 2: Verify compiler RED only.**

Run: `rtk mise exec -- pnpm exec tsc -p packages/web-component/tsconfig.type-tests.json --noEmit`

Expected: FAIL with `TS2322`/`TS2345` at the exact/layered calls.

- [ ] **Step 3: Change the drawing and claim boundary together.** Use `RenderableDrawing`, add validated `ElementMarkupOptions.outputClaim` and element property/attribute reflection, and pass the validated claim exactly once through one `SvgOptions` object to Core. Preserve SSR no-op behavior, open Shadow DOM behavior, existing validation, and the one call to Core. Do not infer whole-asset parity, permit a layered whole-asset claim, or add a custom exact renderer to the element.

- [ ] **Step 4: Verify GREEN.**

Run: `rtk mise exec -- pnpm exec vitest run packages/web-component/src/element.test.ts packages/web-component/src/element.dom.test.ts`

Expected: PASS.

Run: `rtk mise exec -- pnpm exec tsc -p packages/web-component/tsconfig.type-tests.json --noEmit`

Expected: PASS.

Run: `rtk mise exec -- pnpm exec tsc -p packages/web-component/tsconfig.build.json --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/web-component/src/element.ts packages/web-component/src/fixture.test-helper.ts packages/web-component/src/element.test.ts packages/web-component/src/element.dom.test.ts packages/web-component/type-tests/exact-input.ts packages/web-component/tsconfig.type-tests.json
rtk git -c core.fsmonitor=false commit -m "feat(web-component): render exact drawings"
```

### Task 7: MapLibre uses the shared exact Canvas path

**Files:**
- Modify: `packages/maplibre/src/style-image.ts`
- Modify: `packages/maplibre/src/style-image.test.ts`
- Create: `packages/maplibre/type-tests/exact-input.ts`
- Create: `packages/maplibre/tsconfig.type-tests.json`

**Interfaces:**
- Consumes: Task 4's `renderCanvas` and `rasterDimensionsForWidth`, both accepting exact viewBoxes.
- Produces: `createStyleImage(drawing: RenderableDrawing, options: SymbolImageOptions): StyleImageData` and `addSymbolImage(..., drawing: RenderableDrawing, ...): StyleImageData`.

- [ ] **Step 1: Add compiler RED and runtime regression assertions.** The type fixture passes exact/layered drawings into `createStyleImage` and `addSymbolImage`; before implementation it must fail with `TS2345`. The runtime test uses a rectangular `48 × 32` exact drawing and recording Canvas, asserting device-pixel dimensions, buffer length, core path calls, pixel ratio, and one shared `renderCanvas` call for layered input; run it only as GREEN/regression evidence after widening the public boundary.

```ts
const image = createStyleImage(EXACT_48_BY_32, {
  size: 48,
  pixelRatio: 2,
  createCanvas: recorder.create,
});
expect(image).toMatchObject({ width: 96, height: 64 });
expect(image.data).toHaveLength(96 * 64 * 4);
expect(recorder.calls.filter(([name]) => name === 'bezierCurveTo')).not.toHaveLength(0);
```

- [ ] **Step 2: Verify compiler RED only.**

Run: `rtk mise exec -- pnpm exec tsc -p packages/maplibre/tsconfig.type-tests.json --noEmit`

Expected: FAIL with `TS2345` at both exact/layered calls.

- [ ] **Step 3: Change only the channel boundary.** Replace `Drawing` with `RenderableDrawing`; continue delegating dimensions and drawing to Core. Add `channelEvidence: 'canvas-compatibility'` to the returned metadata and never label the RGBA buffer canonical or pixel-identical.

- [ ] **Step 4: Verify GREEN.**

Run: `rtk mise exec -- pnpm exec vitest run packages/maplibre/src/style-image.test.ts packages/core/src/render/canvas-exact.test.ts`

Expected: PASS.

Run: `rtk mise exec -- pnpm exec tsc -p packages/maplibre/tsconfig.type-tests.json --noEmit`

Expected: PASS.

Run: `rtk mise exec -- pnpm exec tsc -p packages/maplibre/tsconfig.build.json --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/maplibre/src/style-image.ts packages/maplibre/src/style-image.test.ts packages/maplibre/type-tests/exact-input.ts packages/maplibre/tsconfig.type-tests.json
rtk git -c core.fsmonitor=false commit -m "feat(maplibre): rasterize exact drawings"
```

### Task 8: QGIS embeds shared exact SVG output

**Files:**
- Modify: `packages/qgis/src/library.ts`
- Modify: `packages/qgis/src/library.test.ts`
- Create: `packages/qgis/type-tests/exact-input.ts`
- Create: `packages/qgis/tsconfig.type-tests.json`

**Interfaces:**
- Consumes: `RenderableDrawing`, `RenderOutputClaim`, and `renderSvg`.
- Produces: `QgisSymbolEntry.drawing: RenderableDrawing` plus optional `claim: RenderOutputClaim`; existing `qgisSymbolLibrary` and `qgisSvgFiles` signatures otherwise remain stable. Exact integrations must set the claim explicitly; omitted claim stays `semantic-no-exact-claim` for source compatibility.

- [ ] **Step 1: Add compiler and runtime REDs.** The type fixture passes exact/layered entries to both QGIS functions and initially fails with `TS2322`. Runtime assertions compare decoded Base64 and returned files with `renderSvg(drawing, { outputClaim })`, require a QGIS metadata option carrying the same claim, verify native decimals bypass the millimeter formatter, and reject local paths/comments.

```ts
const exactEntry = { name: 'Exact', drawing: EXACT_DRAWING, claim: 'exact-reference-parity' };
const xml = qgisSymbolLibrary([exactEntry]);
expect(decodeBase64Utf8(base64Payload(xml, 'Exact')))
  .toBe(renderSvg(EXACT_DRAWING, { outputClaim: 'exact-reference-parity' }));
expect(xml).toContain('einsatzzeichen_claim');
expect(xml).not.toContain('taktische-zeichen');
```

- [ ] **Step 2: Verify RED.**

Run: `rtk mise exec -- pnpm exec tsc -p packages/qgis/tsconfig.type-tests.json --noEmit`

Expected: FAIL with `TS2322` at exact/layered entry construction.

Run: `rtk mise exec -- pnpm exec vitest run packages/qgis/src/library.test.ts`

Expected: FAIL at the new claim-forwarding/style-metadata assertions; the compiler command above, not Vitest transpilation, supplies the narrowing-type RED.

- [ ] **Step 3: Widen only the data contract and bind the claim.** Keep QGIS escaping, collision checks, fixed colors, and Base64 handling unchanged. Pass the validated claim into the single Core `renderSvg` call and record it in QGIS style metadata; never infer whole-asset parity from a bare exact drawing.

- [ ] **Step 4: Verify GREEN.**

Run: `rtk mise exec -- pnpm exec vitest run packages/qgis/src/library.test.ts packages/qgis/src/base64.test.ts`

Expected: PASS.

Run: `rtk mise exec -- pnpm exec tsc -p packages/qgis/tsconfig.type-tests.json --noEmit`

Expected: PASS.

Run: `rtk mise exec -- pnpm exec tsc -p packages/qgis/tsconfig.build.json --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/qgis/src/library.ts packages/qgis/src/library.test.ts packages/qgis/type-tests/exact-input.ts packages/qgis/tsconfig.type-tests.json
rtk git -c core.fsmonitor=false commit -m "feat(qgis): embed exact renderer output"
```

### Task 9: One pinned RGBA/PNG service and exact export for all 661 assets

**Files:**
- Create: `packages/cli/src/render/deterministic-raster.ts`
- Create: `packages/cli/src/render/deterministic-raster.test.ts`
- Create: `packages/cli/src/render/index.ts`
- Modify: `packages/cli/src/conformance/raster.ts`
- Modify: `packages/cli/src/conformance/raster.test.ts`
- Modify: `packages/cli/src/conformance/raster-environment.ts`
- Modify: `packages/cli/src/conformance/raster-environment.test.ts`
- Modify: `packages/cli/src/conformance/evidence-writer.ts`
- Modify: `packages/cli/src/conformance/evidence-writer.test.ts`
- Modify: `packages/cli/src/commands/visual-proof.ts`
- Modify: `packages/cli/src/commands/visual-proof.test.ts`
- Modify: `packages/cli/src/commands/export.ts`
- Modify: `packages/cli/src/commands/export.test.ts`
- Modify: `packages/cli/package.json`
- Create: `packages/cli/src/render/legacy-raster-regressions.test.ts`
- Modify: `packages/core/src/render/svg.test.ts`
- Modify: `packages/catalog/src/body-marks.test.ts`
- Modify: `packages/catalog/src/text-metrics.test.ts`
- Modify: `packages/catalog/src/fonts.test.ts`
- Modify: `packages/catalog/src/pictograms/text-ink.test.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: Core `renderSvg` and `rasterDimensionsForWidth`, `RenderableDrawing`, `RenderOutputClaim`, Foundation RGBA/PNG helpers, Resvg 2.6.2, and the measured empty exact FontSet.
- Produces the only production module allowed to import/instantiate Resvg:

```ts
export type DeterministicRasterBackground = 'transparent' | 'black' | 'white';
export type DeterministicFontPolicy =
  | { readonly kind: 'exact-empty' }
  | {
      readonly kind: 'verified-files';
      readonly files: readonly { readonly path: string; readonly sha256: Sha256Digest }[];
      readonly defaultFamily: string;
    };

export interface DeterministicRasterRequest {
  readonly drawing: RenderableDrawing;
  readonly width: number;
  readonly background: DeterministicRasterBackground;
  readonly outputClaim: RenderOutputClaim;
  readonly idPrefix: string;
  readonly fontPolicy: DeterministicFontPolicy;
}

export interface DeterministicRgbaResult {
  readonly dimensions: RasterDimensions;
  readonly rgba: CanonicalRgbaImage;
  readonly outputClaim: RenderOutputClaim;
  readonly rasterEnvironmentDigest: Sha256Digest;
}

export interface DeterministicPngResult extends DeterministicRgbaResult {
  readonly png: Uint8Array;
}

export function renderDrawingRgba(request: DeterministicRasterRequest): DeterministicRgbaResult;
export function renderDrawingPng(request: DeterministicRasterRequest): DeterministicPngResult;

// Conformance-internal Oracle adapter; it shares the same Resvg constructor/options code path.
export function renderCanonicalSvgRgba(request: {
  readonly svg: string;
  readonly viewBox: ExactViewBox;
  readonly width: number;
  readonly background: DeterministicRasterBackground;
  readonly fontPolicy: { readonly kind: 'exact-empty' };
}): CanonicalRgbaImage;
```

`@einsatzzeichen/cli/reference-raster` exports only the drawing service, dimensions/result types, and no Oracle adapter. The Conformance-internal adapter remains an internal relative import.

- [ ] **Step 0: Create the deterministic-raster modules/subpath as compile-safe shells.** Add `deterministic-raster.ts` and `render/index.ts` with every final exported type/function above; drawing and raw-SVG entrypoints throw typed `RED_DETERMINISTIC_RASTER_NOT_IMPLEMENTED` before any Resvg/PNG work. Wire the typed CLI package subpath and the injection seams required by existing callers, then run `rtk mise exec -- pnpm exec tsc -p packages/cli/tsconfig.build.json --noEmit` to PASS before adding service/delegation/export tests. No missing module/export, dependency-resolution failure, or syntax error is an admissible RED.

- [ ] **Step 1: Write a real Resvg service RED.** Use rectangular semantic, exact, and layered fixtures. Assert the Core dimension function determines height, `renderSvg` is called once with the requested claim, transparent RGB is canonicalized, black/white composition is exact, PNG decodes back to identical RGBA, and `loadSystemFonts` is always false. `exact-empty` rejects any text/font request; verified semantic fonts are rehashed before rendering. Reject nonpositive/nonfinite width, path-bearing ID prefixes, output-claim/drawing mismatch, external resources, and dimension drift from Resvg.

```ts
const result = renderDrawingPng({
  drawing: EXACT_48_BY_32,
  width: 96,
  background: 'transparent',
  outputClaim: 'exact-reference-parity',
  idPrefix: 'asset-fixture',
  fontPolicy: { kind: 'exact-empty' },
});
expect(result.dimensions).toEqual({ widthPx: 96, heightPx: 64 });
expect(decodePng(result.png)).toEqual(result.rgba);
```

- [ ] **Step 2: Write delegation REDs for every existing Node raster caller.** Inject a recording service into Foundation `renderComparisonCell`, `measureRasterEnvironment`, CLI `visual-proof`, and exact export. Require candidate strict rendering to call `renderDrawingRgba`, Oracle strict rendering to call the internal SVG adapter, and every PNG encoding to use the same canonical encoder exported by `evidence-writer.ts`. Move the actual raster assertions from Core `svg.test.ts` and Catalog `body-marks.test.ts`, `text-metrics.test.ts`, `fonts.test.ts`, and `pictograms/text-ink.test.ts` into `packages/cli/src/render/legacy-raster-regressions.test.ts`, where they call only the new service; retain their pure structural assertions in their owning packages. Remove the root direct Resvg dev dependency. Source-scan all migrated production/tests and permit the actual `@resvg/resvg-js` import or `new Resvg` only in `render/deterministic-raster.ts`. Website's direct PNG route and the soon-deleted multi-size snapshot test are explicitly closed by the immediately dependent Task 10; Task 18 has zero temporary exceptions.

- [ ] **Step 3: Write exact-export RED.** Assert sorted 661 keys produce 661 collision-free files plus `export-manifest.json`; SVG bytes equal `renderSvg(drawing, { outputClaim: 'exact-reference-parity' })`; PNG bytes come from `renderDrawingPng`; and every manifest entry binds key, relative file, SHA-256, dimensions/background, and `outputClaim: 'exact-reference-parity'`. Preserve legacy export behavior under its existing scope with `semantic-no-exact-claim`.

```ts
expect(result.entries).toHaveLength(661);
expect(result.entries.every((entry) => entry.outputClaim === 'exact-reference-parity')).toBe(true);
expect(rasterPort).toHaveBeenCalledTimes(661);
expect(() => exactAssetFileName('asset:../escape.svg', 'png')).toThrow(/Pfadsegment/u);
```

- [ ] **Step 4: Verify behavioral RED from the compile-green shells.**

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/render/deterministic-raster.test.ts packages/cli/src/render/legacy-raster-regressions.test.ts packages/cli/src/conformance/raster.test.ts packages/cli/src/conformance/raster-environment.test.ts packages/cli/src/conformance/evidence-writer.test.ts packages/cli/src/commands/visual-proof.test.ts packages/cli/src/commands/export.test.ts`

Expected: FAIL at dimension/delegation/export assertions, not because a module cannot be imported.

- [ ] **Step 5: Implement the sole Resvg constructor path.** In `deterministic-raster.ts`, serialize a `RenderableDrawing` once, validate claims/font policy/resources, instantiate Resvg 2.6.2 with width-fit and no system fonts, assert dimensions against Core's sole dimension function, copy pixels once, and canonicalize/composite through Core. `renderDrawingPng` calls `renderDrawingRgba` exactly once and only adds bytes from the one evidence PNG encoder; it never instantiates/renders again. The internal raw-SVG Oracle adapter calls the same private constructor/options function. Move environment probe and migrated raster regressions through this path. Refactor strict raster, visual proof, and export into thin consumers; no caller reconstructs fit, background, font, dimension, or encoder options.

- [ ] **Step 6: Implement exact export with explicit claims.** Iterate `exactAssetKeys()`, require an empty exact FontSet, use exclusive writes, and atomically finalize the manifest only after all 661 files exist and rehash correctly. A collision/unexpected preexisting file fails the entire prepared temporary directory before atomic publication. Neither output nor manifest contains Oracle bytes or paths.

- [ ] **Step 7: Verify GREEN and the CLI-local single-path gate.**

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/render/deterministic-raster.test.ts packages/cli/src/render/legacy-raster-regressions.test.ts packages/cli/src/conformance/raster.test.ts packages/cli/src/conformance/raster-environment.test.ts packages/cli/src/conformance/evidence-writer.test.ts packages/cli/src/commands/visual-proof.test.ts packages/cli/src/commands/export.test.ts`

Expected: PASS.

Run: `rtk mise exec -- pnpm exec tsc -p packages/cli/tsconfig.build.json --noEmit`

Expected: PASS, and the built `@einsatzzeichen/cli/reference-raster` subpath imports no executable `src/index.ts`.

- [ ] **Step 8: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/cli/src/render/deterministic-raster.ts packages/cli/src/render/deterministic-raster.test.ts packages/cli/src/render/legacy-raster-regressions.test.ts packages/cli/src/render/index.ts packages/cli/src/conformance/raster.ts packages/cli/src/conformance/raster.test.ts packages/cli/src/conformance/raster-environment.ts packages/cli/src/conformance/raster-environment.test.ts packages/cli/src/conformance/evidence-writer.ts packages/cli/src/conformance/evidence-writer.test.ts packages/cli/src/commands/visual-proof.ts packages/cli/src/commands/visual-proof.test.ts packages/cli/src/commands/export.ts packages/cli/src/commands/export.test.ts packages/cli/package.json packages/core/src/render/svg.test.ts packages/catalog/src/body-marks.test.ts packages/catalog/src/text-metrics.test.ts packages/catalog/src/fonts.test.ts packages/catalog/src/pictograms/text-ink.test.ts package.json pnpm-lock.yaml
rtk git -c core.fsmonitor=false commit -m "feat(cli): centralize exact deterministic raster output"
```

### Task 10: Deterministic website snapshot carries discriminated drawings

**Files:**
- Modify: `packages/website/scripts/generate-snapshot.ts`
- Create: `packages/website/scripts/check-snapshot.ts`
- Create: `packages/website/src/lib/contact-sheets.test.ts`
- Modify: `packages/website/src/lib/snapshot-schema.ts`
- Modify: `packages/website/src/lib/snapshot-symbols.ts`
- Modify: `packages/website/src/lib/snapshot-build.ts`
- Modify: `packages/website/src/lib/snapshot-build.test.ts`
- Modify: `packages/website/src/lib/snapshot-policy.test.ts`
- Modify: `packages/website/src/lib/contact-sheets.ts`
- Modify: `packages/website/src/components/ContactSheet.astro`
- Modify: `packages/website/src/components/SymbolPreview.astro`
- Modify: `packages/website/src/components/QuickstartExample.astro`
- Modify: `packages/website/src/components/islands/Explorer.tsx`
- Modify: `packages/website/src/pages/index.astro`
- Modify: `packages/website/src/pages/zeichen/index.astro`
- Modify: `packages/website/src/pages/zeichen/[slug].astro`
- Modify: `packages/website/src/pages/zeichen/[slug].svg.ts`
- Modify: `packages/website/src/pages/zeichen/[slug].png.ts`
- Modify: `packages/website/src/pages/kontaktbogen/[datei].svg.ts`
- Modify: `packages/website/src/content/docs/docs/belege.mdx`
- Modify: `packages/website/package.json`
- Create: `packages/website/scripts/task-10-owned-files.txt`
- Modify: `pnpm-lock.yaml`
- Modify: `packages/catalog/src/test-support/render-cases.ts`
- Create: `packages/catalog/src/test-support/render-cases.test.ts`
- Delete: `packages/catalog/src/multi-size-snapshots.test.ts`
- Delete: all 526 tracked files below `packages/catalog/src/__snapshots__/multi-size/`

**Interfaces:**
- Consumes: `RenderableDrawing`, Task 3's public exact APIs/claims, the display/asset maps on `EXACT_CATALOG_REGISTRY`, and Task 9's `@einsatzzeichen/cli/reference-raster` service. Website code never imports a batch shard or Resvg directly.
- Produces:

```ts
export interface ExactAssetSummary {
  readonly key: ExactAssetKey;
  readonly title: string;
  readonly drawing: ReferenceExactDrawing;
  readonly geometryDigest: Sha256Digest;
}
export interface SymbolSummary {
  // existing fields remain
  readonly drawing: RenderableDrawing;
  readonly exactAsset: ExactAssetKey;
  readonly display: DisplayKey;
  readonly outputClaim: RenderOutputClaim;
}
export interface CatalogSnapshot {
  // existing fields remain
  readonly exactAssets: readonly ExactAssetSummary[];
  readonly displays: readonly {
    readonly key: DisplayKey;
    readonly comparisonMode: 'whole' | 'part';
    readonly exactAsset: ExactAssetKey;
    readonly oraclePart: OraclePartKey | null;
    readonly outputClaim: RenderOutputClaim;
  }[];
}
```

- [ ] **Step 0: Create every new Task-10 production module/field as a compile-safe shell.** Add `check-snapshot.ts` with its final side-effect-free validator entrypoint and add the final typed snapshot/contact-sheet fields; until GREEN, affected builders return typed empty exact inventories/claims and perform no generation or write, while the checker throws typed `RED_SNAPSHOT_CHECK_NOT_IMPLEMENTED`. Add `contact-sheets.test.ts` only after `rtk mise exec -- pnpm --filter @einsatzzeichen/website check` and `rtk mise exec -- pnpm exec tsc -p packages/catalog/tsconfig.build.json --noEmit` both pass. Missing modules/fields/imports are not RED evidence.

- [ ] **Step 1: Add failing snapshot and exhaustive static-consumer tests.** Assert 661 sorted exact assets and 544 displays split exactly 525 whole/19 part. Every current catalog/recipe symbol names its exact asset, display, and claim; JSON roundtrip preserves discriminators, decimal strings, layer/node order. `SymbolPreview.astro` accepts `RenderableDrawing` and calls shared `renderSvg` with the summary claim. `[slug].svg` returns the same bytes and `x-einsatzzeichen-claim`; `[slug].png` calls only `renderDrawingPng` and returns its bytes with the same header. Test every direct static Website caller explicitly: `SymbolPreview.astro`, `QuickstartExample.astro`, `pages/index.astro`, `pages/zeichen/index.astro`, `pages/zeichen/[slug].astro`, `[slug].svg.ts`, `[slug].png.ts`, and `pages/kontaktbogen/[datei].svg.ts`. Each `renderSvg` call must receive `{ outputClaim: <the exact claim belonging to the same drawing> }`; each HTTP/static artifact must expose the same claim in its header or surrounding metadata. `QuickstartExample.astro` receives both the exact `RenderableDrawing` and its `RenderOutputClaim`, forwards that claim to `renderSvg`, and has a focused assertion that `exact-reference-parity`, component-only, and layered inputs are neither dropped nor upgraded. Also exercise `Explorer` so hydration preserves claim/drawing identity and no caller reconstructs `{ viewBox, children }`.

  Add a source enumeration test that recursively scans all Website production `.astro/.ts/.tsx/.mts/.mjs` files and fails with file/line for every direct `renderSvg(...)`, `renderDrawingPng(...)`, static SVG response, or static PNG response not registered in the test's exhaustive caller table. A newly added caller must therefore add and pass an explicit claim-forwarding assertion; there is no glob exclusion for components/pages.

```ts
const snapshot = buildSnapshot(new Date('2026-09-04T00:00:00.000Z'));
expect(snapshot.exactAssets.map((asset) => asset.key)).toEqual(exactAssetKeys());
expect(snapshot.exactAssets).toHaveLength(661);
expect(snapshot.displays).toHaveLength(544);
expect(snapshot.displays.filter((entry) => entry.comparisonMode === 'whole')).toHaveLength(525);
expect(snapshot.displays.filter((entry) => entry.comparisonMode === 'part')).toHaveLength(19);
expect(snapshot.symbols.every((symbol) => symbol.exactAsset.startsWith('asset:'))).toBe(true);
const json = JSON.stringify(snapshot);
expect(json).not.toMatch(/taktische-zeichen|<svg|data:image|<!--/u);
expect(JSON.parse(json).exactAssets[0].drawing.kind).toBe('reference-exact');
```

- [ ] **Step 2: Add failing contact-sheet migration tests.** Require exactly 525 Whole display sheets derived from snapshot exact drawings plus one organization-profile compatibility sheet. Every whole sheet's embedded PNGs come from the deterministic raster service and carries `exact-reference-parity`; no part display is expanded onto an invented carrier. The route reads/generates these in-memory during Website build, not from tracked catalog snapshots. Require deletion of the old directory and source-scan `packages/catalog/src` plus `packages/website/src` for zero production/test imports or `new Resvg` calls after implementation.

```ts
expect(listContactSheets(snapshot).filter((sheet) => sheet.kind === 'whole-display'))
  .toHaveLength(525);
expect(listContactSheets(snapshot).some((sheet) => sheet.display === partDisplay.key)).toBe(false);
expect(raster.calls.every((call) => call.outputClaim === 'exact-reference-parity')).toBe(true);
```

- [ ] **Step 3: Verify behavioral RED.** Fail on the exact 661/544/525 assertions and remaining direct Resvg import after the compile-safe checker/fields already load.

Run: `rtk mise exec -- pnpm exec vitest run packages/website/src/lib/snapshot-build.test.ts packages/website/src/lib/snapshot-policy.test.ts packages/website/src/lib/contact-sheets.test.ts`

Expected: FAIL because the snapshot lacks exact inventories and contact sheets still read legacy tracked raster snapshots.

- [ ] **Step 4: Build snapshot and static routes from public exact APIs only.** Clone public values, preserve canonical registry order, and attach display mappings from `EXACT_CATALOG_REGISTRY.displayFixtures`; never guess from filenames. `generatedAt` is derived from the canonical `SOURCE_DATE_EPOCH` supplied by the bound checkout state, not an ambient clock. `generate-snapshot.ts` accepts only that integer epoch; `check-snapshot.ts` builds and validates entirely in memory without writing. Add exact `snapshot:check` script and make `generate`, `check`, and `build` invoke the same builder. Add the CLI reference-raster workspace dependency and remove Website's direct Resvg dependency/import.

- [ ] **Step 5: Replace legacy contact sheets without a second renderer.** Change `RenderCase.drawing` to `RenderableDrawing` and make all 525 Whole render cases resolve their exact display/asset instead of composing/reconstructing primitives. Generate contact-sheet SVG in Website memory through Task 9's PNG service; preserve the existing six sizes/two diagnostic themes only as channel diagnostics and label their claim. Delete the generator test and all 526 tracked blobs under catalog snapshots. Update Website route/component/copy so it no longer reads that directory. The organization sheet uses exact component composition but is labelled `reference-identical-components`, never whole-asset parity.

  Before deleting anything, create `packages/website/scripts/task-10-owned-files.txt` as a UTF-8, LF, lexicographically sorted manifest containing **every** Task-10 source/test/lockfile path listed in this task, the manifest path itself, `packages/catalog/src/multi-size-snapshots.test.ts`, and each of the 526 exact tracked snapshot paths returned by `rtk git -c core.fsmonitor=false ls-files packages/catalog/src/__snapshots__/multi-size`. Pin in `snapshot-policy.test.ts` that the deletion subset has exactly 527 entries (the test plus 526 snapshots), every deletion path existed in the Task-9 base commit, no listed path lies outside Task 10 ownership, and no actual Task-10 diff path is absent. The manifest contains only literal repository-relative paths, never a directory glob or symbolic stand-in.

- [ ] **Step 6: Verify GREEN, deterministic generation, and all static consumers.**

Run: `rtk mise exec -- pnpm exec vitest run packages/website/src/lib/snapshot-build.test.ts packages/website/src/lib/snapshot-policy.test.ts packages/website/src/lib/snapshot-load.test.ts packages/website/src/lib/contact-sheets.test.ts packages/catalog/src/test-support/render-cases.test.ts`

Expected: PASS.

Run: `rtk mise exec -- pnpm --filter @einsatzzeichen/website snapshot:check`

Expected: PASS, no file write, exact 661/544/525/19 counts, and no Oracle/reference-image content.

Run twice: `rtk mise exec -- env SOURCE_DATE_EPOCH=$(rtk git -c core.fsmonitor=false show -s --format=%ct HEAD) pnpm --filter @einsatzzeichen/website generate`

Expected: both runs report 661 exact assets and the SHA-256 of `packages/website/public/catalog-snapshot.json` remains equal for the canonical HEAD-derived epoch; the checked generated file must not be staged by this task unless repository policy already tracks it. `SOURCE_DATE_EPOCH=0` is confined to an in-process fixed-vector unit test and is never used for a production, full-gate, artifact, browser, or release build.

Repeat the Website build twice in two clean output directories with the canonical HEAD-derived `SOURCE_DATE_EPOCH`, hash every regular output file and the canonical file-list manifest, and require byte-for-byte equal key/digest sets. `SOURCE_DATE_EPOCH=0` remains only the fixed-vector unit fixture; production/full-gate builds use the HEAD-derived value bound by Task 12.

Run: `rtk mise exec -- pnpm --filter @einsatzzeichen/website check`

Expected: PASS, including Astro typing of every listed component/page.

Run: `rtk mise exec -- pnpm --filter @einsatzzeichen/website build`

Expected: PASS; 525 exact whole sheets and the organization diagnostic route are built from current snapshot data, and SVG/PNG responses expose their claim.

- [ ] **Step 7: Stage and commit the explicit owned-file set only.** Populate and review `packages/website/scripts/task-10-owned-files.txt` before staging. Use it as the only pathspec source; never use `git add -A`, a directory-wide add, or an unreviewed glob. Compare the cached names mechanically with the manifest before commit.

```bash
rtk git -c core.fsmonitor=false add --pathspec-from-file=packages/website/scripts/task-10-owned-files.txt
rtk git -c core.fsmonitor=false diff --cached --name-only | rtk proxy diff - packages/website/scripts/task-10-owned-files.txt
rtk git -c core.fsmonitor=false diff --cached --check
rtk git -c core.fsmonitor=false commit -m "feat(website): publish exact snapshot outputs"
```

Expected: the name comparison is empty; every cached path is literal in the manifest, all 527 expected deletions are present, and no unrelated Website, Catalog, generated snapshot, or user-owned file is staged.

### Task 11: Website builder, vocabulary, and MapLibre Lab preserve exact drawings

**Files:**
- Modify: `packages/website/src/lib/builder-state.ts`
- Modify: `packages/website/src/lib/builder-state.test.ts`
- Modify: `packages/website/src/components/islands/Builder.tsx`
- Modify: `packages/website/src/components/islands/Builder.test.ts`
- Modify: `packages/website/src/lib/builder-vocabulary.ts`
- Modify: `packages/website/src/lib/builder-vocabulary.test.ts`
- Modify: `packages/website/src/lib/maplibre-lab.ts`
- Modify: `packages/website/src/lib/maplibre-lab.test.ts`
- Modify: `packages/website/src/components/islands/MapLibreLab.tsx`
- Modify: `packages/website/src/lib/code-samples.ts`
- Modify: `packages/website/src/lib/code-samples.test.ts`

**Interfaces:**
- Consumes: Task 3 catalog API/claims, `RenderableDrawing`, React, shared Core SVG, and Task 7 MapLibre Canvas compatibility output.
- Produces: `SpecEvaluation`, `BuilderOutcome`, `kindPreviews(): Map<string, RenderableDrawing | null>`, and `LabSymbol.drawing: RenderableDrawing`. No browser component constructs an independent drawing.

- [ ] **Step 1: Add failing builder/vocabulary tests.** Assert a known recipe selects Task 2's `source.kind === 'known-asset'`, returns the object-identical cached `exactAssetResult(source.exactAsset)` with its existing asset-target trace, `ReferenceExactDrawing`, empty overlays, and `exact-reference-parity`; it never materializes the otherwise validated `resolved.plan` or retargets its trace. A free valid spec selects `source.kind === 'free-builder'` and the object-identical `resolved.plan`; without generated overlays it returns exact components plus `reference-identical-components`, while arbitrary body-label text, custom-generated label metrics, designation, and their combined ordered overlay case each return `LayeredDrawing` plus `not-reference-identical`. An unmeasured finite placement context remains an explained `NotMeasuredError`. `kindPreviews` preserves the union and never rebuilds `{ viewBox, children }`.

```ts
expect(evaluateSpec(RECIPES['C.1.1']!.spec)).toMatchObject({
  ok: true,
  drawing: { kind: 'reference-exact' },
});
const free = evaluateSpec({ kind: 'formation', designation: 'ABC' });
expect(free.ok && free.drawing.kind).toBe('layered');
```

- [ ] **Step 2: Add failing MapLibre Lab cross-channel tests.** For exact and layered `LabSymbol`s, require direct SVG markers to call `renderSvg`, map images to call `addSymbolImage`, and React previews to pass the identical `drawing` object to `<Einsatzzeichen>`. The model/view exposes `channelEvidence: 'canvas-compatibility'`; it never describes MapLibre pixels as canonical. Exercise `code-samples.ts` so published examples use `RenderableDrawing` and explicit claims.

- [ ] **Step 3: Verify RED.**

Run: `rtk mise exec -- pnpm exec vitest run packages/website/src/lib/builder-state.test.ts packages/website/src/lib/builder-vocabulary.test.ts packages/website/src/lib/maplibre-lab.test.ts packages/website/src/components/islands/Builder.test.ts packages/website/src/lib/code-samples.test.ts`

Expected: FAIL on the narrowed `Drawing` signatures and missing claim/channel metadata.

- [ ] **Step 4: Switch every interactive state and call site to `RenderableDrawing`.** `evaluateSpec` calls `composeExact`; builder vocabulary consumes its result rather than semantic `compose`. It preserves Task 3's exclusive source decision: known recipes surface the cached existing ExactAsset result/trace unchanged, while free specs surface the sole materialization of `resolved.plan` plus its generated overlays. No Website caller selects a second plan, falls back between routes, or retargets a trace. `MapLibreLab.tsx` uses the same snapshot drawing for Core SVG, MapLibre, and React. Keep validation/failure states. Show “Freie Beschriftung/Bezeichnung: nicht referenzidentisch” whenever body-label or designation overlays exist and “Canvas-/MapLibre-Kompatibilitätsdarstellung” for browser raster. If the Builder retains its browser `canvas.toBlob` download for free compositions, label it compatibility-only; known static PNG links use Task 10's canonical server-built route.

- [ ] **Step 5: Verify GREEN and build the Website.**

Run: `rtk mise exec -- pnpm exec vitest run packages/website/src/lib/builder-state.test.ts packages/website/src/lib/builder-vocabulary.test.ts packages/website/src/lib/maplibre-lab.test.ts packages/website/src/components/islands/Builder.test.ts packages/website/src/lib/snapshot-island.test.ts packages/website/src/lib/code-samples.test.ts`

Expected: PASS.

Run: `rtk mise exec -- pnpm --filter @einsatzzeichen/website check`

Expected: PASS.

Run: `rtk mise exec -- pnpm --filter @einsatzzeichen/website build`

Expected: PASS; generated exact SVG and PNG routes contain no oracle path or source bytes.

- [ ] **Step 6: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/website/src/lib/builder-state.ts packages/website/src/lib/builder-state.test.ts packages/website/src/components/islands/Builder.tsx packages/website/src/components/islands/Builder.test.ts packages/website/src/lib/builder-vocabulary.ts packages/website/src/lib/builder-vocabulary.test.ts packages/website/src/lib/maplibre-lab.ts packages/website/src/lib/maplibre-lab.test.ts packages/website/src/components/islands/MapLibreLab.tsx packages/website/src/lib/code-samples.ts packages/website/src/lib/code-samples.test.ts
rtk git -c core.fsmonitor=false commit -m "feat(website): preserve exact interactive drawings"
```

### Task 12: Pin Node 22 and define non-self-referential strict state

**Files:**
- Create: `packages/cli/src/conformance/toolchain-contract.ts`
- Create: `packages/cli/src/conformance/toolchain-contract.test.ts`
- Create: `packages/cli/src/conformance/current-state.ts`
- Create: `packages/cli/src/conformance/current-state.test.ts`
- Create: `packages/cli/src/conformance/strict-record.ts`
- Create: `packages/cli/src/conformance/strict-record.test.ts`
- Modify: `mise.toml`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: canonical registry/digest producers, Git, Foundation `CurrentConformanceDigests`, the schema-neutral Reachable/Reference context sets, `EXACT_BATCH_MODULES`, `STAGED_EXACT_BATCH_DESCRIPTORS`, `buildStagedExactBatchOwnershipIndex`, `buildExactBatchKeyOwnerIndex`, `deriveReferenceComponentContextOwnership`, and actual package/lock/config/workflow inputs.
- Produces:

```ts
export interface StaticCheckoutState {
  readonly version: 'StaticCheckoutState/v1';
  readonly headCommit: string;
  readonly sourceDateEpoch: string;
  readonly commitDigest: Sha256Digest;
  readonly sourceTreeDigest: Sha256Digest;
  readonly buildInputDigest: Sha256Digest;
  readonly buildInputs: readonly { readonly path: string; readonly digest: Sha256Digest }[];
  readonly oraclePartSetDigest: Sha256Digest;
  readonly oracleOwnershipManifestDigest: Sha256Digest;
  readonly fixtureSetDigest: Sha256Digest;
  readonly geometrySetDigest: Sha256Digest;
  readonly compositionTraceSetDigest: Sha256Digest;
  readonly reachableBuilderContextSetDigest: Sha256Digest;
  readonly referenceComponentContextSetDigest: Sha256Digest;
  readonly referenceComponentContextOwnershipDigest: Sha256Digest;
  readonly compositionContractRegistryDigest: Sha256Digest;
  readonly compositionWitnessSetDigest: Sha256Digest;
  readonly rendererContractDigest: Sha256Digest;
  readonly toolchainDigest: Sha256Digest;
  readonly fontSetDigest: Sha256Digest;
  readonly comparisonContractVersion: string;
  readonly comparisonContractDigest: Sha256Digest;
  readonly comparisonProfileSetDigest: Sha256Digest;
  readonly maskContractSetDigest: Sha256Digest;
}

export interface OracleEvidenceState {
  readonly version: 'OracleEvidenceState/v1';
  readonly oracleSetDigest: Sha256Digest;
  readonly oracleAssetDigests: readonly Sha256Digest[];
  readonly oracleEvidenceDigest: Sha256Digest;
  readonly rasterEnvironmentDigest: Sha256Digest;
  readonly featureCountsDigest: Sha256Digest;
}

export interface CaseResultState {
  readonly version: 'CaseResultState/v1';
  readonly caseKey: ConformanceCaseKey;
  readonly fixtureDigest: Sha256Digest;
  readonly geometryDigest: Sha256Digest;
  readonly compositionTraceDigest: Sha256Digest;
  readonly normalizedPaintListDigest: Sha256Digest;
  readonly ownedPaintIndexDigest: Sha256Digest;
  readonly requiredPairs: readonly EvidencePairKind[];
  readonly pairResults: readonly ComparisonPairResult[];
  readonly result: 'passed';
  readonly resultDigest: Sha256Digest;
}

export interface StrictRunPayload {
  readonly version: 'StrictConformanceRun/v1';
  readonly strictRunId: string;
  readonly staticCheckout: StaticCheckoutState;
  readonly oracleEvidence: OracleEvidenceState;
  readonly caseResults: readonly CaseResultState[];
  readonly startedAt: string;
  readonly completedAt: string;
  readonly result: 'passed';
}

export interface StrictRunRecord extends StrictRunPayload {
  readonly strictRunDigest: Sha256Digest;
}

export interface CurrentAttestationInput {
  readonly caseKey: ConformanceCaseKey;
  readonly strictRunId: string;
  readonly strictRunDigest: Sha256Digest;
  readonly current: CurrentConformanceDigests;
}

export function collectStaticCheckoutState(repositoryRoot: string): StaticCheckoutState;
export function finalizeCaseResult(input: Omit<CaseResultState, 'resultDigest'>): CaseResultState;
export function finalizeStrictRun(payload: StrictRunPayload): StrictRunRecord;
export function verifyStrictRunRecord(record: StrictRunRecord): void;
export function reviewEvidenceBindingOf(record: StrictRunRecord): ReviewEvidenceRunBinding;
export function currentAttestationInputOf(
  record: StrictRunRecord,
  caseKey: ConformanceCaseKey,
  trustStoreDigest: Sha256Digest,
): CurrentAttestationInput;
```

- [ ] **Step 0: Create compile-safe state/finalizer exports first.** Add every final interface/function export above with throwing `RED: strict state not implemented` bodies and no filesystem work. Run `rtk mise exec -- pnpm exec tsc -p packages/cli/tsconfig.build.json --noEmit` to PASS before adding tests; subsequent RED must be a digest/toolchain/mapping assertion.

- [ ] **Step 1: Write RED for clean/static identity, canonical build time, context ownership, and toolchain.** In disposable repos, require a clean tracked/untracked state while allowing ignored Oracle/evidence. Derive `sourceDateEpoch` exactly from `git show -s --format=%ct HEAD`, require canonical unsigned base-10 integer syntax, and reject an ambient/supplied `SOURCE_DATE_EPOCH` that differs. Independently mutate sources, lockfile, tsconfig, renderer contracts, registries, `mise.toml`, `package.json`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, a synthetic future `.github/workflows/release-candidate.yml`, and release/conformance scripts; each changes the correct static/build/toolchain digest. Mutate one Reachable pair, one total Reference pair, and one fixture's descriptor/manifest owner separately; require only the corresponding `reachableBuilderContextSetDigest`, `referenceComponentContextSetDigest`, or `referenceComponentContextOwnershipDigest` input to change before the enclosing static digest changes. Missing/duplicate/foreign Pair↔Fixture/Owner data must fail collection rather than yield a digest. Paths in records remain repository-relative. Pin `mise.toml` to Node `22` and pnpm `11.20.0`, add root `engines.node: ">=22 <23"`, retain `devEngines.packageManager.version: "11.20.0"`, and assert every checked-in workflow setup pins Node 22 and forwards the bound `SOURCE_DATE_EPOCH` to every build.

- [ ] **Step 2: Write fixed-vector RED for one-time finalization.** Build hand-written static/oracle/case states. `finalizeCaseResult` hashes JCS of exactly all fields except appended `resultDigest`. A caller-generated opaque `strictRunId` is already inside `StrictRunPayload`; `finalizeStrictRun` hashes the RFC-8785 JCS bytes of that entire payload, appends exactly one excluded field, `strictRunDigest`, and freezes recursively. No other payload field is omitted from the digest. Reject empty/duplicate run IDs, payloads/objects containing a pre-existing `strictRunDigest` or alias, unsorted/duplicate cases, a required-pair tuple inconsistent with the Case isolation mode, any PairResult not containing exactly 30 sorted passed cells, flattened/cross-referenced PairResults, or later mutation. Verify with a fixed 64-hex vector and prove recomputing over the finalized record is not the identity definition.

```ts
const record = finalizeStrictRun(payload);
expect(record.strictRunDigest).toBe(digestCanonical(payload));
expect(record.strictRunId).toBe(payload.strictRunId);
expect(Object.keys(payload)).not.toContain('strictRunDigest');
expect(Object.keys(record).filter((key) => !(key in payload))).toEqual(['strictRunDigest']);
expect(() => verifyStrictRunRecord({
  ...record,
  strictRunDigest: sha256Digest('0'.repeat(64)),
}))
  .toThrow(/strictRunDigest/u);
```

- [ ] **Step 3: Write RED for post-finalization attestation projection.** `reviewEvidenceBindingOf` and `currentAttestationInputOf` accept only an already finalized/verified record. Assert every one of Foundation's 31 freshness fields is mapped once from static, Oracle, the selected case, strict record, and caller-supplied trust-store digest. The three static context fields map byte-for-byte to `current.reachableBuilderContextSetDigest`, `current.referenceComponentContextSetDigest`, and `current.referenceComponentContextOwnershipDigest`; mutate each independently and require the corresponding Current field to change. There is no `current` object inside `StrictRunPayload`, and changing the later trust store never changes the strict payload/digest.

- [ ] **Step 4: Verify RED at assertion level.**

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/toolchain-contract.test.ts packages/cli/src/conformance/current-state.test.ts packages/cli/src/conformance/strict-record.test.ts`

Expected: FAIL on Node/pnpm policy, fixed digest, and mapping assertions after compile-safe stubs load.

- [ ] **Step 5: Implement explicit state collection and finalizers.** Collect Git identities with argument-array subprocess calls. Derive and store the current HEAD's commit epoch once, set child `SOURCE_DATE_EPOCH` only to that value, and include it directly in the canonical static/build-input payload. Compute `reachableBuilderContextSetDigest` and `referenceComponentContextSetDigest` separately from the respective canonical `componentContextSetDigestInput` values. Build the full descriptor-backed `ExactBatchKeyOwnerIndex` once with `buildStagedExactBatchOwnershipIndex(STAGED_EXACT_BATCH_DESCRIPTORS)`, independently build the module-manifest index with `buildExactBatchKeyOwnerIndex(EXACT_BATCH_MODULES)`, and require their complete `componentFixtures` maps to be byte-identical before deriving ownership. Call `deriveReferenceComponentContextOwnership(EXACT_CATALOG_REGISTRY.referenceComponentContextSet, EXACT_CATALOG_REGISTRY.componentFixtures, descriptorOwnerIndex)` exactly once, and compute `referenceComponentContextOwnershipDigest` only from the returned `digestInput`; do not hash a hand-authored record list, infer owner from fixture payload, or add an OwnedKeys collection. Build inputs include all package/runtime source and imported assets plus package manifests, lockfile, every tsconfig, Vite/Astro/Vitest/Playwright config, `mise.toml`, every `.github/workflows/*.yml`, and release/conformance scripts. Exclude docs, generated output, Oracle bytes, local evidence, trust stores, and absolute paths. Measure the actual Node executable/version (major 22), pnpm 11.20.0, loaded Resvg/binding bytes, and canonically sorted workflow path/digests; any other Node major is an error. Never infer one semantic digest from another.

  Add a repeat-build test: two isolated builds of the same clean HEAD with the derived epoch must produce byte-identical snapshot/manifests and build-output set digests; changing only the epoch must fail input validation rather than silently change bytes.

- [ ] **Step 6: Verify GREEN under the pinned runtime.**

Run: `rtk mise exec -- node --version`

Expected: output begins `v22.`.

Run: `rtk mise exec -- pnpm --version`

Expected: exactly `11.20.0`.

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/toolchain-contract.test.ts packages/cli/src/conformance/current-state.test.ts packages/cli/src/conformance/strict-record.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/cli/src/conformance/toolchain-contract.ts packages/cli/src/conformance/toolchain-contract.test.ts packages/cli/src/conformance/current-state.ts packages/cli/src/conformance/current-state.test.ts packages/cli/src/conformance/strict-record.ts packages/cli/src/conformance/strict-record.test.ts mise.toml package.json .github/workflows/ci.yml
rtk git -c core.fsmonitor=false commit -m "feat(conformance): bind strict state to Node 22"
```

### Task 13: Injectable full strict runner and no-skip command

**Files:**
- Create: `packages/cli/src/conformance/strict-runner.ts`
- Create: `packages/cli/src/conformance/strict-runner.test.ts`
- Create: `packages/cli/src/commands/conformance.ts`
- Create: `packages/cli/src/commands/conformance.test.ts`

**Interfaces:**
- Consumes: Task 12 state/finalizers, Task 9 deterministic raster service through Foundation `renderComparisonMatrix`, `loadOracleSet`, `EXACT_CATALOG_REGISTRY`, `PAINT_COMPONENT_KEYS`, both canonical context-set constants, and canonical invariant/feature gates.
- Produces:

```ts
export interface StrictRunnerPorts {
  readonly collectStatic: typeof collectStaticCheckoutState;
  readonly runBuild: (repositoryRoot: string, sourceDateEpoch: string) => Promise<void>;
  readonly loadOracle: typeof loadOracleSet;
  readonly collectOracleEvidence: (loaded: LoadedOracleSet) => Promise<OracleEvidenceState>;
  readonly verifyGlobalInvariants: (input: {
    readonly registry: ExactCatalogRegistry;
    readonly loadedOracle: LoadedOracleSet;
    readonly oracleEvidence: OracleEvidenceState;
  }) => Promise<void>;
  readonly registry: ExactCatalogRegistry;
  readonly materialize: typeof materializeExactComposition;
  readonly renderMatrix: typeof renderComparisonMatrix;
  readonly compareCase: (input: {
    readonly caseKey: ConformanceCaseKey;
    readonly loadedOracle: LoadedOracleSet;
    readonly registry: ExactCatalogRegistry;
    readonly materialize: typeof materializeExactComposition;
    readonly renderMatrix: typeof renderComparisonMatrix;
  }) => Promise<Omit<CaseResultState, 'resultDigest'>>;
  readonly createRunId: () => string;
  readonly now: () => string;
  readonly publishRunOutputs: (transaction: {
    readonly strictRunFile: string;
    readonly strictRunBytes: Uint8Array;
    readonly reviewBindingFile: string;
    readonly reviewBindingBytes: Uint8Array;
  }) => Promise<void>;
}

export interface StrictConformanceOptions {
  readonly repositoryRoot: string;
  readonly referenceRoot: string;
  readonly resultOut: string;
  readonly reviewBindingOut: string;
}

export function createStrictConformanceRunner(
  ports: StrictRunnerPorts,
): (options: StrictConformanceOptions) => Promise<StrictRunRecord>;

export const runStrictConformance: ReturnType<typeof createStrictConformanceRunner>;
```

- [ ] **Step 0: Create compile-safe runner/command exports first.** The factory returns an async function that throws typed `RED_STRICT_RUNNER_NOT_IMPLEMENTED`; the production wrapper delegates to that factory; the command parser has the final typed signature and rejects with a typed usage error. Run CLI typecheck green before tests so operation-order/error-taxonomy assertions provide RED.

- [ ] **Step 1: Write injected-runner RED.** Inject every port and assert this exact order: create one opaque run ID; clean static state; derive canonical `sourceDateEpoch`; pinned Node-22 build with exactly that epoch; identical static state after build; full 661-file Oracle load; Oracle/feature evidence; call `verifyGlobalInvariants({ registry: ports.registry, loadedOracle, oracleEvidence })` exactly once; enumerate the exact sorted disjoint union of `registry.assetCases`, `registry.displayCases`, and `registry.componentCases`; compare every case by passing the already loaded Oracle set, that same canonical registry object, and the injected Core materialization/shared raster ports explicitly; identical final static state; finalize every case once; construct the one payload including that run ID; finalize once; verify; publish the strict record and separate `ReviewEvidenceRunBinding` in one transaction. Inject sentinels and assert the invariant port receives those exact object identities, cannot reopen the Oracle root, and cannot read a module-global registry. Missing/extra/duplicate ComponentCases fail before comparison. Failed runs leave neither pass file.

  The global case bijections compare the cases' canonical reference fields, never unrelated raw
  case keys:

  ```text
  set(registry.assetCases.values().exactAsset) = set(registry.exactAssets.keys())
  set(registry.displayCases.values().displayFixture) = set(registry.displayFixtures.keys())
  set(registry.componentCases.values().componentFixture) = set(registry.componentFixtures.keys())
  set(registry.compositionContractCases.values().contract) = set(registry.compositionContracts.keys())
  orderedPairs(registry.reachableBuilderContextSet.pairs)
    = orderedPairs(registry.referenceComponentContextSet.pairs where access = 'public-builder')
  set(registry.referenceComponentContextSet.pairs.component) = set(PAINT_COMPONENT_KEYS)
  set(registry.variants.values().(component,context))
    = set(registry.referenceComponentContextSet.pairs.(component,context))
  set(registry.componentFixtures.values().(component,context))
    = set(registry.referenceComponentContextSet.pairs.(component,context))
  set(registry.compositionContracts.values().(component,context,access))
    = set(registry.referenceComponentContextSet.pairs.(component,context,access))
  ```

  The reference set's access partitions are disjoint and exact: public is the Reachable set,
  `reference-only` is the 151 noncomposable snapshot keys, and `direct-carrier` is the 15 direct
  carrier keys. Project ComponentCases through their referenced fixtures and ContractCases through
  their referenced contracts and require the same total pair/triple equalities; require at least
  one valid Witness Edge for every total contract. Require each projection to be duplicate-free
  and each referenced target to exist. Inject missing, extra, duplicate, access-crossover, and
  uncovered-component mutations and fail before comparison. Raw
  `ConformanceCaseKey`s are compared only for the separate identity invariant that
  `registry.conformanceCases` is the sorted, duplicate-free union of the three case maps; they are
  never compared with fixture, asset, or contract keys.

  Add failure injection at strict-file create, binding-file create, each file fsync, directory fsync, and final rename. Derive one caller-selected ignored per-run root `out/exact-reference/<run-id>/`; that root may already exist because its technical reviewer registry is created before strict execution. The two final paths must be exactly `<run-root>/strict-runs/current/strict-run.json` and `<run-root>/strict-runs/current/review-binding.json`. The dedicated publication subdirectory `current/` must be absent, while its realpath-validated nonsymlink parent `strict-runs/` may be created beneath the same run root. The port writes both files with `O_EXCL|O_NOFOLLOW` into one fresh sibling temporary directory below `strict-runs/`, rereads/verifies both byte payloads, fsyncs files and the temporary directory, and atomically renames that directory once to `current/`; it never renames or requires absence of the whole run root. On any failure `current/` and every discoverable sibling temp directory remain absent. Two independent `writeAtomic` calls are forbidden.

- [ ] **Step 2: Pin the error taxonomy.** `ORACLE_UNAVAILABLE` is used **only** when the supplied root cannot be opened as a readable directory because it is missing, not a directory, or permission-denied/unreadable. Once a filesystem object at the root is accessible, an unsafe root symlink and any missing expected file, extra file, asset symlink, filename/key-set difference, asset digest, or Oracle-set digest are `ORACLE_MISMATCH`. Feature counts use `CORPUS_FEATURE_MISMATCH`; case-set/vector/RGBA/checkout failures retain their separate codes. Test every branch and require case/pair/asset/width/background plus the available vector/RGBA comparison metrics for cell failures; strict records do not invent evidence paths, ordered image slots, retained image bytes, or content-hash fields on Foundation `ComparisonPairResult`.

```ts
await expect(run(fixture({ root: 'missing' })))
  .rejects.toMatchObject({ code: 'ORACLE_UNAVAILABLE' });
await expect(run(fixture({ missingAsset: '1.1.svg' })))
  .rejects.toMatchObject({ code: 'ORACLE_MISMATCH' });
await expect(run(fixture({ extraAsset: 'extra.svg' })))
  .rejects.toMatchObject({ code: 'ORACLE_MISMATCH' });
```

- [ ] **Step 3: Require exact isolated PairResults.** Treat Foundation `ComparisonPairResult` as the closed shape `{ pair, cells, passed }`; a strict result adds no evidence-path, image-slot, byte, hash, inspection, or provenance field. Whole case results contain exactly one passed 30-cell `full` PairResult; `source-node-set` contains exactly one passed 30-cell `selected` PairResult; and every `leave-one-out` case contains two separate passed 30-cell PairResults, `full` then `without-selected`, both with vector equality and zero RGBA metrics in every `ComparisonCellResult`. Require each PairResult's 30 canonical cell keys to be sorted and unique and the two Leave-one-out sets to be disjoint, yielding exactly 60 unique `(pair,width,background)` cell keys. Missing, duplicate, flattened, cross-referenced, or differently ordered pair/cell results fail before finalization. Task 0's evidence transaction and Tasks 14–17 separately prove the eight coordinate paths plus ordered slots and byte/hash bindings per shared Leave-one-out width/background.

- [ ] **Step 4: Write strict grammar RED.** Accept only:

```text
conformance verify --strict --reference-root <path> --result-out <path> --review-binding-out <path>
```

Both outputs must be the exact basename pair `strict-run.json`/`review-binding.json` inside the same absent `<run-root>/strict-runs/current/` directory, where `<run-root>` is one explicit ignored, repository-relative direct child of `out/exact-reference/` and may already contain `reviewers/technical-reviewers.json`. Reject a run root outside that boundary, traversal, symlink components, different parents, reversed/renamed basenames, an existing `current/`, omitted/duplicate flags, and every filter/batch/size/background/tolerance/accept/update flag before Oracle access. Corpus Task 95's canonical pair is `out/exact-reference/task-95-run-001/strict-runs/current/{strict-run.json,review-binding.json}`.

- [ ] **Step 5: Verify RED with compile-safe runner ports.**

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/strict-runner.test.ts packages/cli/src/commands/conformance.test.ts packages/cli/src/conformance/strict-record.test.ts`

Expected: FAIL on operation order/error taxonomy/pair completeness; no missing import is accepted.

- [ ] **Step 6: Implement production ports as the sole wrapper.** `runStrictConformance` is exactly `createStrictConformanceRunner(productionStrictPorts)`. It invokes `pnpm build` through the measured mise runtime with the canonical HEAD-derived `SOURCE_DATE_EPOCH`, loads the complete Oracle manifest exactly once, derives `oracleEvidence` from that loaded object, and passes the same `loadedOracle`, `oracleEvidence`, and `EXACT_CATALOG_REGISTRY` object explicitly to `verifyGlobalInvariants`. It then enumerates the sorted set union of that registry's `.assetCases`, `.displayCases`, and `.componentCases`, and invokes `compareCase` with the same loaded set, registry object, `materializeExactComposition`, and `renderComparisonMatrix`. Neither invariant nor comparison closures may reopen the Oracle root, read a module-global registry, or instantiate a raster/materializer. It constructs `StrictRunPayload` only after final checkout equality, finalizes once, verifies, and calls the one transactional two-output directory publisher once. It redacts supplied/resolved Oracle roots before any output.

- [ ] **Step 7: Verify GREEN.**

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/strict-runner.test.ts packages/cli/src/commands/conformance.test.ts packages/cli/src/conformance/strict-record.test.ts`

Expected: PASS.

Run: `rtk mise exec -- pnpm exec tsc -p packages/cli/tsconfig.build.json --noEmit`

Expected: PASS.

- [ ] **Step 8: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/cli/src/conformance/strict-runner.ts packages/cli/src/conformance/strict-runner.test.ts packages/cli/src/commands/conformance.ts packages/cli/src/commands/conformance.test.ts
rtk git -c core.fsmonitor=false commit -m "feat(cli): verify the full exact corpus strictly"
```

### Task 14: Pair-bound, all-or-nothing technical attestation sets

**Files:**
- Create: `packages/cli/src/conformance/review-record.ts`
- Create: `packages/cli/src/conformance/review-record.test.ts`
- Create: `packages/cli/src/conformance/attestation-store.ts`
- Create: `packages/cli/src/conformance/attestation-store.test.ts`
- Create: `packages/cli/src/conformance/index.ts`
- Modify: `packages/cli/package.json`

**Interfaces:**
- Consumes: Foundation signing/verification/schema contracts, Task 12 finalized state, Task 13 strict record, Task 0 paired evidence, expected registry cases, the amended specification and all three plan files, and a technical `AttestationTrustStore`.
- Produces:

```ts
export interface TechnicalReviewerRegistry {
  readonly version: 'TechnicalReviewerRegistry/v1';
  readonly reviewers: readonly {
    readonly id: string;
    readonly name: string;
    readonly qualification: string;
    readonly enabled: true;
  }[];
  readonly registryDigest: Sha256Digest;
}

export interface VisualInspectionRecord {
  readonly version: 'VisualInspection/v1';
  readonly caseKey: ConformanceCaseKey;
  readonly pair: EvidencePairKind;
  readonly headCommit: string;
  readonly strictRunId: string;
  readonly caseResultDigest: Sha256Digest;
  readonly evidenceDigest: Sha256Digest;
  readonly cells: readonly {
    readonly width: ReferenceRasterWidth;
    readonly background: EvidenceBackground;
    readonly imageDigests: Readonly<Record<EvidenceImageKind, Sha256Digest>>;
    readonly comparisonDigest: Sha256Digest;
  }[];
  readonly status: 'matches' | 'mismatch';
  readonly note: string;
  readonly reviewer: string;
  readonly technicalReviewerRegistryDigest: Sha256Digest;
  readonly specQualityReviewDigest: Sha256Digest;
  readonly agentRunId: string;
  readonly reviewedAt: string;
  readonly recordDigest: Sha256Digest;
}

export interface PairReviewProvenance {
  readonly version: 'PairReviewProvenance/v1';
  readonly caseKey: ConformanceCaseKey;
  readonly pair: EvidencePairKind;
  readonly evidenceDigest: Sha256Digest;
  readonly inspectionDigest: Sha256Digest;
}

export interface RequiredConformanceCasePairs {
  readonly caseKey: ConformanceCaseKey;
  readonly requiredPairs: readonly EvidencePairKind[];
}

export interface VerifiedAttestationSet {
  readonly version: 'VerifiedAttestationSet/v1';
  readonly directory: string;
  readonly strictRunId: string;
  readonly strictRunDigest: Sha256Digest;
  readonly technicalReviewerRegistryDigest: Sha256Digest;
  readonly trustStoreDigest: Sha256Digest;
  readonly requiredCases: readonly RequiredConformanceCasePairs[];
  readonly attestations: readonly ConformanceAttestation[];
  readonly setDigest: Sha256Digest;
}

export interface BoundFileDigest {
  readonly path: string;
  readonly sha256: Sha256Digest;
}

export interface SpecQualityReviewRecord {
  readonly schema: 'SpecQualityReviewRecord/v1';
  readonly runRoot: string;
  readonly head: string;
  readonly branchDiff: Readonly<{
    base: string;
    head: string;
    sha256: Sha256Digest;
  }>;
  readonly reviewedFiles: Readonly<{
    specification: BoundFileDigest;
    plans: readonly [BoundFileDigest, BoundFileDigest, BoundFileDigest];
  }>;
  readonly prepare: Readonly<{
    result: BoundFileDigest;
    strictRunSha256: Sha256Digest;
    reviewBindingSha256: Sha256Digest;
    reviewEvidenceTreeSha256: Sha256Digest;
    technicalReviewerRegistrySha256: Sha256Digest;
    artifactManifestSha256: Sha256Digest;
  }>;
  readonly reviewer: Readonly<{
    id: string;
    name: string;
    qualification: string;
    agentRunId: string;
    independentFromImplementationAndVisualReview: true;
  }>;
  readonly verdict: 'PASS';
  readonly blockers: readonly [];
  readonly reviewedAt: string;
  readonly recordDigest: Sha256Digest;
}

export interface ReviewFreezeRecord {
  readonly version: 'ReviewFreeze/v1';
  readonly runRoot: string;
  readonly headCommit: string;
  readonly strictRunId: string;
  readonly strictRunDigest: Sha256Digest;
  readonly reviewBindingDigest: Sha256Digest;
  readonly reviewEvidenceDigest: Sha256Digest;
  readonly specQualityReviewSha256: Sha256Digest;
  readonly technicalReviewerRegistrySha256: Sha256Digest;
  readonly reviewer: string;
  readonly reviewRoot: string;
  readonly reviewTreeDigest: Sha256Digest;
  readonly shutdown: Readonly<{
    serverPid: number;
    host: '127.0.0.1';
    port: number;
    exitedAt: string;
    exitCode: number;
    sessionTokenPath: string;
    tokenAbsent: true;
    portClosed: true;
  }>;
  readonly recordDigest: Sha256Digest;
}

export function deriveRequiredConformanceCasePairs(
  registry: ExactCatalogRegistry,
): readonly RequiredConformanceCasePairs[];

export interface SpecQualityReviewInputs {
  readonly amendedSpec: string;
  readonly foundationPlan: string;
  readonly corpusPlan: string;
  readonly integrationPlan: string;
  readonly strictRun: string;
  readonly reviewBinding: string;
  readonly reviewRoot: string;
  readonly technicalReviewerRegistry: string;
  readonly artifactManifest: string;
  readonly prepareResult: string;
}

export interface ReviewFreezeInputs {
  readonly strictRun: string;
  readonly reviewBinding: string;
  readonly reviewRoot: string;
  readonly specQualityReview: string;
  readonly technicalReviewerRegistry: string;
  readonly reviewer: string;
  readonly capturedServerPid: number;
  readonly host: '127.0.0.1';
  readonly port: number;
  readonly sessionTokenPath: string;
}

export function verifySpecQualityReviewRecord(
  record: SpecQualityReviewRecord,
  current: CurrentConformanceDigests,
  inputs: SpecQualityReviewInputs,
): void;

export function verifyReviewFreezeRecord(
  record: ReviewFreezeRecord,
  current: CurrentConformanceDigests,
  inputs: ReviewFreezeInputs,
): void;

export async function createAndPublishAttestationSet(input: {
  readonly strictRun: StrictRunRecord;
  readonly evidence: readonly ReviewEvidenceBatchRecord[];
  readonly inspections: readonly VisualInspectionRecord[];
  readonly technicalReviewerRegistry: TechnicalReviewerRegistry;
  readonly requiredCases: readonly RequiredConformanceCasePairs[];
  readonly issuer: string;
  readonly keyId: string;
  readonly privateKeyPem: string;
  readonly trustStore: AttestationTrustStore;
  readonly destination: string;
  readonly now: string;
}): Promise<VerifiedAttestationSet>;

export function verifyAttestationSet(input: {
  readonly directory: string;
  readonly requiredCases: readonly RequiredConformanceCasePairs[];
  readonly technicalReviewerRegistry: TechnicalReviewerRegistry;
  readonly trustStore: AttestationTrustStore;
  readonly strictRun: StrictRunRecord;
  readonly now: string;
}): VerifiedAttestationSet;
```

- [ ] **Step 0: Create compile-safe review/set exports first.** `packages/cli/src/conformance/attestation-store.ts` owns the final readonly `VerifiedAttestationSet` shape above; no other task redeclares it. Add the final interfaces and functions with typed throwing implementations; the package subpath declaration must compile before tests. No function may write a destination in the stub. RED then comes from pair/provenance, specification-quality/freeze-record, and failure-injection assertions.

- [ ] **Step 1: Write authoritative case/pair, provenance, and technical-reviewer-registry RED.** Define `TechnicalReviewerRegistry/v1` as a canonical, duplicate-free, digest-bound local technical registry separate from Catalog/domain reviewer records. Reject empty IDs/names/qualifications, disabled/unregistered reviewers, duplicate/substituted IDs, stale registry digests, and any attempt to treat it as domain or public-release authorization.

  `deriveRequiredConformanceCasePairs(EXACT_CATALOG_REGISTRY)` enumerates the finalized, sorted,
  duplicate-free `registry.conformanceCases` union and derives each exact pair tuple from the
  canonical case plus resolved `OraclePart.isolation`: Whole `['full']`, source-node-set
  `['selected']`, leave-one-out `['full','without-selected']`. It does not read Strict output,
  Review evidence, inspection records, attestation provenance, or caller-supplied pairs. Assert
  exact equality with the separate asset/display/component case maps after requiring the same
  total reference-context closure as Task 13; in particular, the component-case-to-fixture
  projection is exactly the total pair set and its public access projection is exactly the
  Reachable set. The public Component-Key projection is exactly 247, while the public pair count
  equals the complete Reachable pair count and the total pair count is exactly that value plus 166;
  neither pair count is pinned to a Component-Key count. Missing, extra, duplicate,
  unsorted cases, an unknown Part/isolation, a missing/extra/duplicate/reordered pair, and equal
  counts with a substituted key all fail before signing or verification.

  Each pair inspection binds exactly its own 30-cell PairResult, each cell's ordered
  coordinate/image-slot evidence and comparison digest, plus head, strict ID, case-result digest,
  technical reviewer ID/registry digest, and a canonical pair-evidence digest. Duplicate/missing
  cells, stale or mismatching bytes, flattened results, or cross-pair reuse fails.
  `PairReviewProvenance` is converted to exactly one signed `ConformanceProvenanceRecord` per
  registry-derived required pair; the Attestation's signed result/provenance digest changes if any
  required pair, coordinate/slot record, reviewer registry, or content digest changes.

  Define `SpecQualityReviewRecord` as the independent pre-visual specification/code-quality gate.
  It binds the current HEAD, amended-spec digest, the separately named Foundation/Corpus/Integration
  plan digests in the fixed Foundation/Corpus/Integration tuple, the immutable pre-Foundation-ledger
  `BASE` to current-HEAD branch-diff digest,
  every prepare-input digest, the prepare-result digest, and the independent reviewer's registered
  ID/name/qualification plus agent-run identity; those identity fields must equal the separately
  hashed technical reviewer registry. Only literal `verdict:'PASS'` with an empty blocker tuple is a record; failure
  findings remain a separate reviewer report and prevent record creation. Verification rehashes every
  named file/result rather than trusting stored digests and rejects a stale HEAD/base/diff, substituted
  or reordered plan, reused reviewer run, nonempty blockers, or any digest mutation.

  Define the separate `ReviewFreezeRecord` over the same run root's HEAD, strict-run,
  review-binding, accepted spec-quality-review, technical-reviewer registry/reviewer, review-root,
  and final canonical review-tree digests plus captured server PID, loopback host/port, observed
  child exit/time, removed token path, and closed-port evidence.
  It may be finalized only after the captured Review child has exited, its token is absent, and its
  port refuses connections. The canonical tree walk excludes exactly `review/review-freeze.json`
  and its same-directory temporary publication file, preventing self-reference; no other review
  entry is excluded. Verification independently rehashes that frozen regular-file tree,
  rejects symlink/hardlink/path escape, a live captured PID, a present token, an open port, changed
  evidence/inspection bytes, or any record-digest mutation. Neither record is an attestation,
  domain approval, or public-release authorization.

- [ ] **Step 2: Write all-or-nothing filesystem RED.** Before the first destination write, preflight the entire expected case set, every strict zero-diff cell, every pair/evidence/inspection binding, reviewer/key registration, and destination absence. Then sign into a fresh sibling temporary directory with `O_EXCL|O_NOFOLLOW`, verify every signature/current mapping from the written bytes, fsync files/directory, write a complete set manifest, and atomically rename once. Inject failures at first/middle/last signing, verification, fsync, and rename; destination must remain absent and no partial set is discoverable. An existing destination is immutable and never merged/overwritten.

```ts
await expect(createAndPublishAttestationSet(failingMiddleInput)).rejects.toThrow();
expect(existsSync(failingMiddleInput.destination)).toBe(false);
expect(readdirSync(parent).filter((name) => name.startsWith('.attest-tmp-'))).toEqual([]);
```

- [ ] **Step 3: Prove all freshness data and required pairs are derived.** Build `CurrentAttestationInput` only through Task 12 after strict finalization. Assert all commit/tree/build/Oracle/fixture/geometry/trace/Reachable-context/total-Reference-context/derived-Pair-Ownership/contract/witness/paint/renderer/toolchain/raster/font/profile/mask/strict/result/trust fields originate from that mapping, not request strings. In particular, `referenceComponentContextOwnershipDigest` must be the strict record's digest of the Task-12 helper result derived from Pair↔Fixture bijection plus manifest-backed `ExactBatchKeyOwnerIndex.componentFixtures`; no attestation creator accepts ownership records or that digest from its request. Mutate each of the three context digests separately in strict/current/attestation inputs and require creation or every subsequent verification path to fail closed. Re-read and verify the explicit technical reviewer registry, require every inspection reviewer to be enabled there, and bind its digest into every inspection/provenance/set verification.

  Every call to Foundation `verifyConformanceAttestation` passes exactly
  `(attestation, trustStore, current, requiredCase.requiredPairs, now)`, where `requiredCase`
  comes only from `deriveRequiredConformanceCasePairs` for that `caseKey`. Set creation, immediate
  reread, standalone set verification, Review status, Task-23 final verification, and Task-22
  release verification all use that same canonical input. Tests mutate the supplied tuple to
  missing, extra, duplicate, or reordered values while leaving signed provenance unchanged and
  require `invalidated`; an attestation cannot make its own provenance authoritative.

  Locally generated schema-valid trust stores are accompanied by a separate
  `LocalTrustPolicy/v1` record with `purpose: 'development-technical'`; Task 22 never treats that
  local policy or technical reviewer registry as domain review/release trust and rejects the store
  by protected digest/key allowlist regardless.

- [ ] **Step 4: Verify RED.**

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/review-record.test.ts packages/cli/src/conformance/attestation-store.test.ts packages/cli/src/conformance/attestation.test.ts`

Expected: FAIL on missing pair and injected mid-set failure after compile-safe stubs load.

- [ ] **Step 5: Implement immutable set construction and verification.** Derive the canonical required case/pair sequence once from the finalized registry, compare every supplied `requiredCases` value byte-for-byte with it, compute every digest server-side, sign only Foundation `UnsignedConformanceAttestation`, and call Foundation verification with that case's authoritative pair tuple. The unsigned payload copies all 31 `CurrentConformanceDigests` fields, including the three context digests, from `currentAttestationInputOf`; set reread, standalone verification, final verification and release verification compare those same three fields directly. Canonically sort cases and pairs only when constructing internal records; reject unsorted caller input instead of silently repairing it. Implement each `SpecQualityReviewRecord.recordDigest` and `ReviewFreezeRecord.recordDigest` as SHA-256 of RFC-8785 JCS bytes excluding exactly its own `recordDigest` field; their verifiers receive current-state/filesystem/process/network ports and rederive all bytes and liveness facts. Export safe record/set APIs through `@einsatzzeichen/cli/conformance`; never export Oracle bytes or make a single-case public append function.

- [ ] **Step 6: Verify GREEN and package declarations.**

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/review-record.test.ts packages/cli/src/conformance/attestation-store.test.ts packages/cli/src/conformance/attestation.test.ts packages/cli/src/conformance/strict-record.test.ts`

Expected: PASS.

Run: `rtk mise exec -- pnpm build`

Expected: PASS and `packages/cli/dist/conformance/index.d.ts` exposes complete-set functions without importing executable `src/index.ts`.

- [ ] **Step 7: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/cli/src/conformance/review-record.ts packages/cli/src/conformance/review-record.test.ts packages/cli/src/conformance/attestation-store.ts packages/cli/src/conformance/attestation-store.test.ts packages/cli/src/conformance/index.ts packages/cli/package.json
rtk git -c core.fsmonitor=false commit -m "feat(cli): publish atomic paired attestation sets"
```

### Task 15: Migrate the real Review drawing pipeline and model every paired case

**Files:**
- Modify: `packages/review/src/data/drawings.ts`
- Modify: `packages/review/src/data/rows.ts`
- Modify: `packages/review/src/data/rows.test.ts`
- Modify: `packages/review/src/data/views.ts`
- Modify: `packages/review/src/data/views.test.ts`
- Modify: `packages/review/src/server/render.ts`
- Create: `packages/review/src/server/render.test.ts`
- Create: `packages/review/src/conformance/model.ts`
- Create: `packages/review/src/conformance/model.test.ts`
- Modify: `packages/review/src/contract.ts`

**Interfaces:**
- Consumes: Task 3 exact catalog results/claims, `PAINT_COMPONENT_KEYS`, the canonical public and total context sets on `EXACT_CATALOG_REGISTRY`, `EXACT_CATALOG_REGISTRY.displayFixtures`, `EXACT_CATALOG_REGISTRY.assetCases`, `EXACT_CATALOG_REGISTRY.displayCases`, `EXACT_CATALOG_REGISTRY.componentCases`, Task 13 strict records, Task 14 `deriveRequiredConformanceCasePairs` plus paired inspection/attestation data, and `effectiveConformanceStatus`.
- Produces `RowDrawing.drawing`/`ReviewRow.drawing` as `RenderableDrawing`, keeps domain-review state separate, and adds:

```ts
export type ConformanceView = 'assets' | 'displays' | 'components';
export type EffectiveCaseStatus =
  | 'unresolved'
  | 'failed'
  | 'passed-unreviewed'
  | 'approved'
  | 'invalidated';
export interface ConformancePairSummary {
  readonly pair: EvidencePairKind;
  readonly vectorEqual: boolean;
  readonly cellCount: 30;
  readonly inspection: VisualInspectionRecord | null;
}
export interface ConformanceCaseSummary {
  readonly caseKey: ConformanceCaseKey;
  readonly view: ConformanceView;
  readonly title: string;
  readonly oracleAsset: OracleAssetKey;
  readonly comparisonMode: 'whole' | 'part';
  readonly componentContext: ReferenceComponentContextPair | null;
  readonly requiredPairs: readonly EvidencePairKind[];
  readonly pairs: readonly ConformancePairSummary[];
  readonly outputClaim: RenderOutputClaim;
  readonly status: EffectiveCaseStatus;
}
export interface ConformanceReviewInput {
  readonly registry: ExactCatalogRegistry;
  readonly strictRun: StrictRunRecord;
  readonly evidence: readonly ReviewEvidenceBatchRecord[];
  readonly inspections: readonly VisualInspectionRecord[];
  readonly attestations: readonly ConformanceAttestation[];
  readonly current: CurrentConformanceDigests;
}
export interface ConformanceReviewModel {
  readonly version: 'ConformanceReviewModel/v1';
  readonly requiredCases: readonly RequiredConformanceCasePairs[];
  readonly views: Readonly<{
    assets: readonly ConformanceCaseSummary[];
    displays: readonly ConformanceCaseSummary[];
    components: readonly ConformanceCaseSummary[];
  }>;
}
export function buildConformanceReviewModel(input: ConformanceReviewInput): ConformanceReviewModel;
```

- [ ] **Step 0: Create the new Review model as a compile-safe shell.** `packages/review/src/conformance/model.ts` exclusively owns `ConformanceReviewInput` and `ConformanceReviewModel`; export every final conformance model type/function from it. `buildConformanceReviewModel` returns typed empty views without reading evidence, and existing render/contract modules remain compile-safe. Run `rtk mise exec -- pnpm --filter @einsatzzeichen/review typecheck` to PASS before creating `model.test.ts` or `render.test.ts`. Missing modules/exports/imports are not RED evidence.

- [ ] **Step 1: Add exact-result REDs to the existing data tests.** For all 544 manifest rows, resolve the one declared `DisplayFixture` and its `ExactAssetFixture`; require the returned drawing object to be the projection of the public exact result and the claim to match the fixture. Recipe rows use `Recipe.exactAsset`; element rows use their declared display/component fixture mapping. Assert `drawings.ts` no longer clones `CatalogEntry.depictions`, builds pictograms from `{ viewBox, children }`, or calls semantic `composeFromCatalog`. A domain-only carrier context may remain visible as explanation, but a `comparisonMode: 'part'` conformance row exposes only its `OraclePart` evidence and never represents a fabricated carrier as the compared candidate. `renderRowSvg` must accept `RenderableDrawing` and pass the row's claim to the shared SVG renderer.

- [ ] **Step 2: Add paired exact-set model REDs.** Derive the sole authoritative case/pair sequence once with `deriveRequiredConformanceCasePairs(EXACT_CATALOG_REGISTRY)` and require the model, strict results, evidence, inspections, and attestation verification to match it exactly; never infer required pairs from signed provenance or whichever PairResults happen to exist. Assert 661 asset cases, 544 display cases (525 whole/19 part), and exactly one component fixture/case for every pair of the total `ReferenceComponentContextSet/v1`. Every component view entry carries the object-equal total-set pair in `componentContext`; asset/display entries carry `null`. The component-context projection covers all 413 registry keys, its `public-builder` projection exactly equals `ReachableBuilderContextSet/v1`, and its remaining disjoint partitions are the 151 reference-only and 15 direct-carrier rows. No nonpublic row can be selected through a Builder Spec. Mutate the model inputs for missing, extra, duplicate, public/nonpublic crossover, and loss of the only pair for one component and require failure before a status is derived. Whole cases require `['full']`, `source-node-set` cases require `['selected']`, and `leave-one-out` cases require exactly `['full', 'without-selected']` in that order. Each PairResult has 30 current cells, four ordered image-slot records per cell, its own inspection, and its own signed provenance; each Leave-one-out width/background therefore maps to eight distinct evidence coordinates/paths across its two PairResults while allowing equal byte hashes. Missing, extra, duplicate, reordered, flattened, substituted, or cross-used case/pair/slot data is `passed-unreviewed` at best and can never become approved. Statuses derive only from current registry/strict/inspection/attestation inputs.

```ts
const selected = model.views.displays.find((entry) =>
  entry.requiredPairs.length === 1 && entry.requiredPairs[0] === 'selected')!;
expect(selected.pairs.map((entry) => entry.pair)).toEqual(['selected']);
expect(selected.pairs[0]!.cellCount).toBe(30);
const leaveOneOut = model.views.displays.find((entry) =>
  entry.requiredPairs.includes('without-selected'))!;
expect(leaveOneOut.requiredPairs).toEqual(['full', 'without-selected']);
expect(leaveOneOut.pairs.map((entry) => entry.pair)).toEqual(['full', 'without-selected']);
expect(leaveOneOut.pairs.every((entry) => entry.cellCount === 30)).toBe(true);
expect(model.views.assets).toHaveLength(661);
expect(model.views.displays).toHaveLength(544);
expect(model.views.displays.filter((entry) => entry.comparisonMode === 'whole')).toHaveLength(525);
expect(model.views.displays.filter((entry) => entry.comparisonMode === 'part')).toHaveLength(19);
expect(new Set(model.views.components.map((entry) => entry.componentContext!.component)))
  .toEqual(new Set(PAINT_COMPONENT_KEYS));
expect(model.views.components.every((entry) => entry.componentContext !== null)).toBe(true);
```

- [ ] **Step 3: Verify behavioral RED.** Use the already compile-green typed model/render shells.

Run: `rtk mise exec -- pnpm exec vitest run packages/review/src/data/rows.test.ts packages/review/src/data/views.test.ts packages/review/src/server/render.test.ts packages/review/src/conformance/model.test.ts`

Expected: FAIL on exact-object identity, forbidden reconstruction, exact counts, required-pair, and claim assertions; no missing module is accepted as RED.

- [ ] **Step 4: Implement exact data consumption and pure model derivation.** Match rows to canonical registry keys, call only public exact result accessors, and preserve object identity until the server serializes SVG. Build the component view from the total reference set plus the case-to-fixture projection; never enumerate it from Builder resolution and never synthesize a Spec for a nonpublic pair. Do not put drawings, SVG, local paths, private/signing keys, or Oracle bytes in conformance JSON; case/asset/part keys remain required identifiers. Canonically order views/cases/pairs/cells. A part detail names exactly one `OraclePart`, frame, mask, isolation mode, and selected component; no host-body geometry enters the conformance model.

- [ ] **Step 5: Verify GREEN and the existing 558-row domain contract.**

Run: `rtk mise exec -- pnpm exec vitest run packages/review/src/data/rows.test.ts packages/review/src/data/views.test.ts packages/review/src/server/render.test.ts packages/review/src/conformance/model.test.ts`

Expected: PASS; existing 558 domain carriers and all new conformance inventories remain complete and separate.

Run: `rtk mise exec -- pnpm --filter @einsatzzeichen/review typecheck`

Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/review/src/data/drawings.ts packages/review/src/data/rows.ts packages/review/src/data/rows.test.ts packages/review/src/data/views.ts packages/review/src/data/views.test.ts packages/review/src/server/render.ts packages/review/src/server/render.test.ts packages/review/src/conformance/model.ts packages/review/src/conformance/model.test.ts packages/review/src/contract.ts
rtk git -c core.fsmonitor=false commit -m "feat(review): consume exact drawings and paired cases"
```

### Task 16: Secure loopback evidence and append-only inspection API

**Files:**
- Create: `packages/review/src/server/conformance.ts`
- Create: `packages/review/src/server/conformance.test.ts`
- Modify: `packages/review/src/server/api.ts`
- Modify: `packages/review/src/server/api.test.ts`
- Modify: `packages/review/src/server/http.ts`
- Modify: `packages/review/src/server/index.ts`
- Modify: `packages/review/src/server/startup.ts`
- Modify: `packages/review/src/server/startup.test.ts`
- Create: `packages/cli/src/commands/conformance-inspection.ts`
- Create: `packages/cli/src/commands/conformance-inspection.test.ts`
- Modify: `packages/review/package.json`
- Modify: `packages/review/tsconfig.json`

**Interfaces:**
- Consumes: Task 0 paired evidence, Task 14 complete-set API, `deriveRequiredConformanceCasePairs`, `TechnicalReviewerRegistry`, `SpecQualityReviewRecord`, and `ReviewFreezeRecord` from `@einsatzzeichen/cli/conformance`, Task 15 model, strict record, explicit technical-reviewer/spec-quality files, and injected filesystem/clock/randomness/process/network ports. This local technical registry is separate from every domain-reviewer source and public-release trust root.
- Produces a loopback-only bearer-authenticated HTTP API and the CLI-only append client:

```ts
export interface SaveVisualInspectionRequest {
  readonly caseKey: ConformanceCaseKey;
  readonly pair: EvidencePairKind;
  readonly status: 'matches' | 'mismatch';
  readonly note: string;
  readonly agentRunId: string;
  // reviewer, reviewedAt, head/strict/result/evidence/image digests are forbidden request fields
}
export interface ConformanceImageSelection {
  readonly caseKey: ConformanceCaseKey;
  readonly pair: EvidencePairKind;
  readonly width: ReferenceRasterWidth;
  readonly background: EvidenceBackground;
  readonly kind: EvidenceImageKind;
}
export interface BinaryResponse {
  readonly status: 200;
  readonly contentType: 'image/png';
  readonly contentLength: number;
  readonly sha256: Sha256Digest;
  readonly bytes: Uint8Array;
}
export interface ReviewSession {
  readonly headCommit: string;
  readonly strictRunId: string;
  readonly strictRunDigest: Sha256Digest;
  readonly reviewBindingDigest: Sha256Digest;
  readonly reviewer: string;
  readonly technicalReviewerRegistryDigest: Sha256Digest;
  readonly specQualityReviewDigest: Sha256Digest;
}
export interface ConformanceServerPort {
  state(): ConformanceReviewModel;
  image(selection: ConformanceImageSelection): BinaryResponse;
  appendInspection(request: SaveVisualInspectionRequest, session: ReviewSession): VisualInspectionRecord;
}
```

- [ ] **Step 0: Create both new production paths as compile-safe shells.** `packages/review/src/server/conformance.ts` exclusively owns the final readonly `ConformanceImageSelection`, `BinaryResponse`, and `ReviewSession` shapes above. Add the final `conformance.ts` server port/handler exports and `conformance-inspection.ts` parser/client exports first; handlers return typed `501` responses and the CLI client returns a typed operational error without filesystem/network writes. Wire only compile-safe imports through the existing Review server and CLI seams, then run `rtk mise exec -- pnpm --filter @einsatzzeichen/review typecheck` and `rtk mise exec -- pnpm exec tsc -p packages/cli/tsconfig.build.json --noEmit` to PASS before creating either new test. Missing route/client modules or imports are not RED evidence.

- [ ] **Step 1: Add safe paired-read REDs.** Address an image by `(caseKey,pair,width,background,kind)` and return only the bytes whose path/digest are declared in current `visual-review.json`. Test all four kinds for Whole/`full`, source-node-set/`selected`, and both leave-one-out PairResults; at one shared Leave-one-out width/background, require all eight coordinate records and paths to be distinct, verify each digest against its bytes, and explicitly accept identical hashes for identical image bytes. Reject unknown dimensions, coordinate/path/ordered-slot substitution, an isolation-incompatible or missing pair, traversal, symlink/hardlink escape, digest mismatch, a different strict binding, and any response containing reference/evidence roots, signing-key paths, or PEM content.

- [ ] **Step 2: Add authentication and server-derived-record REDs.** Add package script `serve:conformance` and a strict startup parser for `--evidence-root`, `--strict-run`, `--review-binding`, `--technical-reviewer-registry`, `--reviewer`, `--spec-quality-review`, `--session-token-out`, `--review-freeze-out`, `--host 127.0.0.1`, and `--port`; no path may come from an HTTP request. Before opening a socket or creating a token, startup must read/verify the explicit technical registry and the `SpecQualityReviewRecord` against current HEAD, amended spec, all three plans, the exact prepare inputs, and prepare result; require the selected reviewer ID to be enabled with nonblank name/qualification, bind its registry and spec-quality-review digests into session/readiness state, and reject any Catalog/domain-reviewer fallback. A non-PASS verdict, any blocker, stale/substituted digest, or missing record makes the listen call count stay zero. It then binds exactly `127.0.0.1`, creates a cryptographically random 256-bit session token in an ignored mode-0600 file, and refuses wildcard/non-loopback binding. Every state/image/write request requires the bearer token using timing-safe comparison; validate loopback `Host`, same-origin write `Origin`, JSON content type, method, and a small fixed body limit to block DNS-rebinding/CSRF/request-smuggling shortcuts. Error bodies are redacted and authentication failures reveal no token detail. A write body containing `reviewer`, `reviewedAt`, any digest, HEAD, or strict ID is rejected as unknown input. The server derives reviewer/registry digest from the authenticated session, time from its clock, and all 30 cell/four-image records for the named pair from verified evidence bytes.

```ts
  const response = await post('/api/conformance/inspections', {
  caseKey, pair: 'without-selected', status: 'matches', note: 'Null-Diff visuell geprüft',
  agentRunId: 'agent-run-42',
}, token);
expect(response.body).toMatchObject({
  pair: 'without-selected',
  reviewer: 'reviewer:registered',
  specQualityReviewDigest: verifiedSpecQualityReview.recordDigest,
});
expect(clock.now).toHaveBeenCalledTimes(1);
expect(response.body.cells).toHaveLength(30);
```

- [ ] **Step 3: Add append/readiness and teardown/freeze REDs.** Derive the canonical required cases/pairs from the finalized registry at startup and compare the complete ordered tuple against strict, binding, evidence, and model inputs before readiness. Missing, extra, duplicate, or reordered cases/pairs fail startup; neither evidence nor inspection history is authoritative. Before `matches`, require the authenticated session to have fetched Original/Candidate/Overlay/Heatmap for every one of the pair's 30 cells; mismatch still requires all evidence and a nonempty note. Append each canonical inspection with `O_EXCL|O_NOFOLLOW`, fsync, and an immutable sequence filename; never rewrite `visual-review.json`. Reject duplicates for identical evidence/reviewer/agent run, stale evidence, incomplete cells, and cross-pair reuse. State may report complete-set readiness only after every registry-required pair has a latest current `matches` record; the server has no single-case approve/sign route. Task 21's explicit CLI calls Task 14's all-or-nothing attestation publisher.

  Every inspection additionally binds the verified `SpecQualityReviewRecord.recordDigest`; a request cannot supply or override it. The package script is a supervisor around the captured Review child. On every success or failure it terminates only that PID, waits for its actual exit, removes the session token, proves the selected loopback port is closed, then rehashes the now-frozen review tree excluding exactly the absent `review/review-freeze.json` destination and its temporary sibling, and exclusively publishes `--review-freeze-out` as the exact Task-14 `ReviewFreezeRecord`. It must never write that record while the child is live, the token exists, or the port accepts connections. Tests cover PID substitution/reuse, failed wait, token-removal failure, open port, review-tree mutation during hashing, accidental inclusion of the freeze path, pre-existing freeze destination, and post-freeze mutation; none may produce a valid freeze record.

- [ ] **Step 4: Verify behavioral RED through the compile-green ports/handlers/client.**

Run: `rtk mise exec -- pnpm exec vitest run packages/review/src/server/conformance.test.ts packages/review/src/server/api.test.ts packages/review/src/server/startup.test.ts packages/cli/src/commands/conformance-inspection.test.ts`

Expected: FAIL on loopback/token, pair route, forbidden client fields, server-derived values, and append-only assertions; no missing route module is the RED.

- [ ] **Step 5: Implement exactly these authenticated routes and startup form.**

```text
GET  /api/conformance/state
GET  /api/conformance/cases/:caseKey
GET  /api/conformance/cases/:caseKey/cells/:pair/:width/:background/:kind
POST /api/conformance/inspections
```

Keep the existing domain-review routes functional without Oracle evidence; only conformance routes return typed `ORACLE_UNAVAILABLE`. Load evidence/strict/binding/technical-reviewer-registry/reviewer/spec-quality-review and optional attestation trust/key configuration once from parsed process arguments, keep it server-side, and import the library subpath rather than CLI executable. Readiness is impossible until technical-registry membership and the independent spec-quality PASS both verify. `--host` is required to equal `127.0.0.1`; port `0` reports the selected loopback port and captured child PID without printing the token. The supervisor alone owns the exact absent freeze output and completes it after teardown. Implement `conformance inspection append --server <loopback-url> --session-token-file <file> --case <key> --pair full|selected|without-selected --status matches|mismatch --note <text> --agent-run-id <id>` as an authenticated HTTP client; it never reads or modifies evidence/inspection JSON itself.

- [ ] **Step 6: Verify GREEN, security regressions, and typecheck.**

Run: `rtk mise exec -- pnpm exec vitest run packages/review/src/server/conformance.test.ts packages/review/src/server/api.test.ts packages/review/src/server/reference.test.ts packages/review/src/server/startup.test.ts packages/cli/src/commands/conformance-inspection.test.ts`

Expected: PASS, including `full`, `selected`, and `without-selected` routes plus atomic append failure injection.

Run: `rtk mise exec -- pnpm --filter @einsatzzeichen/review typecheck`

Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/review/src/server/conformance.ts packages/review/src/server/conformance.test.ts packages/review/src/server/api.ts packages/review/src/server/api.test.ts packages/review/src/server/http.ts packages/review/src/server/index.ts packages/review/src/server/startup.ts packages/review/src/server/startup.test.ts packages/cli/src/commands/conformance-inspection.ts packages/cli/src/commands/conformance-inspection.test.ts packages/review/package.json packages/review/tsconfig.json
rtk git -c core.fsmonitor=false commit -m "feat(review): secure paired inspection writes"
```

### Task 17: Review UI exposes every case, pair, cell, and image

**Files:**
- Create: `packages/review/src/ui/ConformanceReview.tsx`
- Create: `packages/review/src/ui/ConformanceNavigator.tsx`
- Create: `packages/review/src/ui/ConformanceCompare.tsx`
- Create: `packages/review/src/ui/conformance-ui.test.tsx`
- Modify: `packages/review/src/ui/App.tsx`
- Modify: `packages/review/src/ui/api.ts`
- Modify: `packages/review/src/ui/styles.css`

**Interfaces:**
- Consumes: Task 16's authenticated HTTP contract.
- Produces separate Asset/Display/Component views and URL-addressable state `(case,pair,width,background)` with four evidence panels; it never computes digests or accepts reviewer/time fields.

- [ ] **Step 1: Add compile-safe components/state helpers, then write UI REDs.** Initial components render a typed empty state. Test exact inventory counts, full case keys, and part-only context. The Component view enumerates the total reference-pair set, displays each row's component, context, contract, and access class, covers all 413 component keys, and includes explicit samples from both `reference-only` and `direct-carrier`; it does not offer a Builder/Spec link for either nonpublic class. A `source-node-set` row exposes only its `selected` PairResult; a leave-one-out row renders distinct `full` and `without-selected` tabs, and switching pairs changes all four image URLs and the pair in history state. Width/background controls enumerate all 30 cells per selected PairResult. Original/Candidate/Overlay/Heatmap carry explicit case/pair/size/background alt text.

```tsx
const initial = initialConformanceUiState(model, {
  caseKey: part.caseKey, pair: 'full', width: 512, background: 'transparent',
});
const isolated = selectConformancePair(initial, 'without-selected');
expect(imageUrls(isolated).every((url) => url.includes('/without-selected/512/transparent/')))
  .toBe(true);
expect(renderToStaticMarkup(<ConformanceReview initialModel={model} initialState={isolated} api={api} />))
  .toContain('Ohne ausgewähltes Teil');
```

- [ ] **Step 2: Add inspection-completeness REDs.** Track loads by `(pair,width,background,kind)`, not kind alone. `matches` for one pair stays disabled until that PairResult's 120 images have loaded; complete-set readiness stays false until every current required-pair inspection exists, including `selected` for every `source-node-set` case and both results for every leave-one-out case. A pair mismatch cannot satisfy another pair. Request spies assert UI sends only `{caseKey,pair,status,note,agentRunId}` and refreshes server state after the response; there is no single-case approval or optimistic attestation action.

- [ ] **Step 3: Verify behavioral RED.**

Run: `rtk mise exec -- pnpm exec vitest run packages/review/src/ui/conformance-ui.test.tsx`

Expected: FAIL on pair-preserving URLs, 120-image completion, and payload-minimization assertions; imports compile.

- [ ] **Step 4: Implement the addressable workflow.** Canonical URL is `/conformance/<encoded-case-key>?pair=<pair>&width=<width>&background=<background>`. Keep keyboard navigation/focus visible. Show all strict metrics, vector/ownership result, part frame/mask/isolation, exact claim boundary, and for Component cases the authoritative total-set access class. Reference-only/direct-carrier navigation remains component-reference navigation and never calls or advertises `composeExact`/Builder resolution. Only the four selected-cell panels are mounted at once, but the inspected-cell checklist makes all 30 cells explicit; save remains disabled until all were loaded during the session. Contact sheets can deep-link but cannot mark a cell viewed.

- [ ] **Step 5: Wire authenticated append and readiness state.** The API module reads the session token supplied by server bootstrap, posts only the minimal request, then reloads verified state. It may show “bereit für vollständige Attestation” but never signs or approves an individual case. Display German labels for unresolved, failed, passed-unreviewed, approved, and invalidated; a server-verification failure never appears approved. Keep domain review as a separate top-level mode.

- [ ] **Step 6: Verify GREEN and accessibility basics.**

Run: `rtk mise exec -- pnpm exec vitest run packages/review/src/ui/conformance-ui.test.tsx packages/review/src/ui/drafts.test.ts packages/review/src/ui/shortcuts.test.ts`

Expected: PASS; pair tabs expose selected state, controls have names, images have complete alt text, and focus remains visible.

Run: `rtk mise exec -- pnpm --filter @einsatzzeichen/review typecheck`

Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/review/src/ui/ConformanceReview.tsx packages/review/src/ui/ConformanceNavigator.tsx packages/review/src/ui/ConformanceCompare.tsx packages/review/src/ui/conformance-ui.test.tsx packages/review/src/ui/App.tsx packages/review/src/ui/api.ts packages/review/src/ui/styles.css
rtk git -c core.fsmonitor=false commit -m "feat(review): inspect every exact pair visually"
```

### Task 18: Verification-only three-browser compatibility and repository-wide no-narrowing gate

**Files:**
- Create: `packages/review/playwright.config.ts`
- Create: `packages/review/e2e/exact-conformance-fixture.ts`
- Create: `packages/review/e2e/exact-conformance-fixture.test.ts`
- Create: `packages/review/e2e/exact-conformance.spec.ts`
- Modify: `packages/review/package.json`
- Create: `scripts/conformance/renderable-consumers.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 16's exact Review startup grammar, an explicit strict-run file, its matching review-binding file, an explicit evidence root, an explicit verified `--technical-reviewer-registry` file, a matching valid `--spec-quality-review`, a reviewer ID enabled in that registry, fresh token/freeze destinations, a dynamically reported `127.0.0.1` port, canonical HEAD-derived `SOURCE_DATE_EPOCH`, and Playwright 1.62.0.
- Produces the single canonical script `pnpm --filter @einsatzzeichen/review test:browser:exact`, ignored screenshots/traces, and a repository-wide source/compile gate against `Drawing` narrowing, omitted Website claim forwarding, or additional Resvg/dimension paths. This task adds verification configuration/tests only; all exercised product behavior is delivered by Tasks 3–17.

- [ ] **Step 1: Add the three-project browser verification and package script.** Configure `chromium-1.62`, `firefox-1.62`, and `webkit-1.62`, one worker, DPR 1, 1280×900, animations disabled, and ignored output. Open one Whole asset, one `source-node-set` part, one leave-one-out part display, one `reference-only` component, and one `direct-carrier` component. Require the full case key, authoritative component/context/contract/access fields where applicable, all 30 cells, and all four selected-cell panels; neither nonpublic component exposes or exercises a Builder Spec route. The Whole exposes only `full`, the source-node-set part only `selected`, and the leave-one-out part switches through separate `full` and `without-selected` results while asserting four coordinate-keyed URLs per result and eight distinct coordinate paths for a shared width/background. The test never requires content-hash inequality. Browser-rasterize the shared SVG only as compatibility evidence against the canonical 512/transparent candidate; gate `differentPixelRatio <= 0.01` and `meanChannelDelta <= 1.5` without a parity claim.

  Implement a self-contained deterministic fixture factory plus one global setup/teardown harness. The factory atomically creates only the absent ignored root `out/exact-reference/task-18-browser-fixture-run-001/` and writes its own finalized strict run, review binding, evidence tree, technical reviewer registry, prepare-input/result fixture, and valid fixture `SpecQualityReviewRecord`; it imports no later acceptance-task path/data and rejects any pre-existing destination, symlink, placeholder, or cross-root input. A unit test proves all paths share that root, all content digests rehash, and no serialized value contains any external acceptance-run marker, `latest`, or an absolute machine path.

  Setup validates that `--strict-run`, `--review-binding`, `--evidence-root`, `--technical-reviewer-registry`, and `--spec-quality-review` are explicit safe paths under that fixture root; verifies the registry digest, selected enabled reviewer membership, and spec-quality review before readiness; and requires strict ID/digest, HEAD, case-result keyset, prepare input/result, plan/spec digests, and evidence binding to agree. No domain-reviewer import/fallback is permitted. It derives and validates `SOURCE_DATE_EPOCH` from HEAD, creates fresh token/freeze paths, then starts exactly:

  ```bash
  rtk mise exec -- pnpm --filter @einsatzzeichen/review serve:conformance -- \
    --evidence-root <explicit-evidence-root> \
    --strict-run <explicit-strict-run> \
    --review-binding <explicit-review-binding> \
    --technical-reviewer-registry <explicit-technical-reviewer-registry> \
    --reviewer <registered-reviewer> \
    --spec-quality-review <explicit-spec-quality-review> \
    --session-token-out <fresh-token-file> \
    --review-freeze-out <fresh-freeze-file> \
    --host 127.0.0.1 \
    --port 0
  ```

  It waits for the startup-ready record, whose registry/reviewer/spec-review digests must equal the verified inputs, accepts only the reported loopback port, verifies the token file is regular/non-symlink/mode 0600, and supplies the token to Playwright request/page fixtures without logging or snapshotting it. An unauthenticated request must return 401 before tests. Global teardown terminates only the captured child PID and lets Task 16's supervisor wait for exit, remove the token, prove the port closed, freeze the review tree, and exclusively publish the fixture `ReviewFreezeRecord` even after a failed test. Wildcard binding, a pre-existing token/freeze, stale/mutated registry or spec-quality record, stale binding, mismatched evidence root, disabled/unregistered reviewer, startup timeout, child early exit, leaked server/token, or invalid freeze each fails the gate.

- [ ] **Step 2: Add the exhaustive repository-wide consumer verification.** The source test recursively discovers every production `.astro/.ts/.tsx/.mts/.mjs` file and AST-classifies all imports/calls of `renderSvg`, `renderDrawingPng`, `renderCanvas`, `rasterDimensionsForWidth`, public drawing parameters, and static SVG/PNG response constructors. Its expected classified set explicitly includes Review `data/drawings.ts`, `data/rows.ts`, `server/render.ts`; every Website direct/static caller from Task 10 including `QuickstartExample.astro`, `SymbolPreview.astro`, homepage, listing/detail/contact-sheet SVG/PNG routes, plus builder, Explorer, vocabulary, MapLibre Lab and code samples; React, Web Component, MapLibre, QGIS, CLI export, deterministic raster, and strict/evidence paths. Set equality is mandatory: an undiscovered expected file and an unclassified newly discovered caller both fail with file/line.

  Forbid public `Drawing`-only parameters/properties and manual `{ viewBox, children }` reconstruction in these consumers. Every Website `renderSvg`/static output call must forward the `RenderOutputClaim` belonging to the same drawing; the scanner has a focused `QuickstartExample.astro` assertion and rejects default/inferred whole-asset claims. It also asserts every React `renderSvg` call receives the memoized `SvgOptions.outputClaim`, and every Web Component path exposes/validates `ElementMarkupOptions.outputClaim` plus the element `outputClaim` property, forwards it once, and rejects a layered `exact-reference-parity` call before Core. Parse all repository production and test sources (excluding generated `dist`, `out`, plain-text fixture payloads, and lockfiles) so an actual import of `@resvg/resvg-js` or `new Resvg` may occur only in `packages/cli/src/render/deterministic-raster.ts`, and every dimension calculation delegates to `packages/core/src/render/raster-dimensions.ts`; comments/documentation do not count as imports. Canvas raster output must be labelled compatibility-only. Pair this source check with every package `tsconfig.build.json` so textual compliance cannot hide a narrowing or claim-plumbing compile error.

- [ ] **Step 3: Establish the verification baseline without claiming RED/TDD.** Tasks 3–17 already provide the behavior under test, so this task intentionally has no artificial failing production behavior and no RED claim. First run configuration import/type checks; failures here are defects to fix in this task, not TDD evidence.

Run: `rtk mise exec -- pnpm exec vitest run packages/review/e2e/exact-conformance-fixture.test.ts scripts/conformance/renderable-consumers.test.mjs`

Expected: PASS against the completed predecessor tasks with exhaustive caller-set equality, exactly one Resvg owner, exactly one raster-dimension service, and explicit Website claim forwarding.

Run: `rtk mise exec -- env SOURCE_DATE_EPOCH=$(rtk git -c core.fsmonitor=false show -s --format=%ct HEAD) pnpm --filter @einsatzzeichen/review exec playwright test --project=chromium-1.62`

Expected: PASS using the explicit strict/binding/evidence/reviewer inputs supplied by the test fixture, with authenticated loopback startup and complete teardown. Repeat the same project in a fresh output directory with the same bound epoch and require byte-identical browser fixture/summary manifests; screenshots remain compatibility evidence and are not required to be byte-identical across engines.

- [ ] **Step 4: Finalize the deterministic browser harness and closed classification table.** Report browser name/version and the phrase “browser compatibility gate”, never “Exact Reference Parity passed”. The source test has no open-ended exemptions: the only allowed semantic-only modules are explicitly named legacy construction internals that are not output consumers; any new consumer fails until classified. Preserve the exact setup/teardown failure tests, token secrecy, and same-epoch repeat-manifest assertion.

- [ ] **Step 5: Verify all engines and all consumer compilers.**

Run: `rtk mise exec -- pnpm exec vitest run scripts/conformance/renderable-consumers.test.mjs`

Expected: PASS with exactly one Resvg owner and no narrowed listed consumer.

Run: `rtk mise exec -- env SOURCE_DATE_EPOCH=$(rtk git -c core.fsmonitor=false show -s --format=%ct HEAD) pnpm --filter @einsatzzeichen/review test:browser:exact -- --strict-run out/exact-reference/task-18-browser-fixture-run-001/strict-runs/current/strict-run.json --review-binding out/exact-reference/task-18-browser-fixture-run-001/strict-runs/current/review-binding.json --evidence-root out/exact-reference/task-18-browser-fixture-run-001/review --technical-reviewer-registry out/exact-reference/task-18-browser-fixture-run-001/reviewers/technical-reviewers.json --reviewer independent-agent-review --spec-quality-review out/exact-reference/task-18-browser-fixture-run-001/spec-quality-review.json --session-token-out out/exact-reference/task-18-browser-fixture-run-001/browser/session-token --review-freeze-out out/exact-reference/task-18-browser-fixture-run-001/review/review-freeze.json`

Expected: PASS in Chromium, Firefox, and WebKit; startup uses the strict-bound evidence tree, every request is authenticated, teardown closes the dynamic loopback port, and screenshots/traces remain below ignored `out/exact-reference/browser/`.

Run: `rtk mise exec -- pnpm typecheck`

Expected: PASS.

- [ ] **Step 6: Commit configuration/tests, not generated screenshots.**

```bash
rtk git -c core.fsmonitor=false add packages/review/playwright.config.ts packages/review/e2e/exact-conformance-fixture.ts packages/review/e2e/exact-conformance-fixture.test.ts packages/review/e2e/exact-conformance.spec.ts packages/review/package.json scripts/conformance/renderable-consumers.test.mjs package.json
rtk git -c core.fsmonitor=false commit -m "test(review): gate paired output and renderable consumers"
```

### Task 19: Pure artifact-leak policy with adversarial fixtures

**Files:**
- Create: `packages/cli/src/conformance/artifact-leak.ts`
- Create: `packages/cli/src/conformance/artifact-leak.test.ts`

**Interfaces:**
- Consumes: committed `OracleManifest` SHA-256 values and artifact entries supplied by Task 20.
- Produces:

```ts
export interface ArtifactEntry {
  readonly container: 'package' | 'website' | 'qgis' | 'release';
  readonly path: string;
  readonly bytes: Uint8Array;
}
export type ArtifactLeakCode =
  | 'oracle-byte-match'
  | 'local-diff-artifact'
  | 'generator-xml'
  | 'source-comment'
  | 'local-oracle-path'
  | 'embedded-original-svg'
  | 'unsafe-artifact-path';
export interface ArtifactLeak {
  readonly container: ArtifactEntry['container'];
  readonly path: string;
  readonly code: ArtifactLeakCode;
}
export function findArtifactLeaks(
  entries: readonly ArtifactEntry[],
  oracleManifest: OracleManifest,
): readonly ArtifactLeak[];
export function assertArtifactSetClean(
  entries: readonly ArtifactEntry[],
  oracleManifest: OracleManifest,
): void;
```

- [ ] **Step 1: Add compile-safe scanner exports, then write one RED adversarial case per forbidden pattern.** `packages/cli/src/conformance/artifact-leak.ts` exclusively owns the final readonly `ArtifactEntry`, `ArtifactLeakCode`, and `ArtifactLeak` shapes above. Start with typed `findArtifactLeaks`/`assertArtifactSetClean` stubs that deliberately return no violations; imports and package typecheck must succeed. Cover byte identity with any oracle SHA, reference PNG, overlay, heatmap, diff, and local raster names; Illustrator/Inkscape/generator metadata; XML comments retained from source; absolute macOS/Linux/Windows oracle paths; literal `taktische-zeichen/` in JS, JSON, source maps, or metadata; raw original SVG/XML string and Base64 embedding in source modules; and unsafe absolute/parent/symlink paths. Each result must identify container, logical path, and leak code without echoing secret/local content.

```ts
expect(codes(scan(entry('package', 'dist/copied.svg', oracleBytes))))
  .toContain('oracle-byte-match');
expect(codes(scan(textEntry('website', 'assets/app.js', '...taktische-zeichen/...'))))
  .toContain('local-oracle-path');
expect(codes(scan(textEntry('release', 'meta.json', '<!-- Generator: Adobe Illustrator -->'))))
  .toEqual(expect.arrayContaining(['generator-xml', 'source-comment']));
```

- [ ] **Step 2: Add RED allow cases.** Canonical Geometry/Paint IR containing asset keys and `M/L/C/Z` commands must pass. A generated public SVG or QGIS Base64 SVG produced by the shared renderer must pass when it has no source comment/generator metadata and no oracle byte digest. Ordinary product PNGs whose names do not imply local evidence must pass.

- [ ] **Step 3: Verify RED.**

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/artifact-leak.test.ts`

Expected: FAIL because the compile-safe scanner stub misses the first adversarial violation; a missing import is not accepted.

- [ ] **Step 4: Implement deterministic byte/content/path checks.** Hash every entry first; perform bounded UTF-8/text decoding only for textual extensions and source maps; decode suspicious Base64 string literals only when their decoded prefix is XML/SVG. Do not reject intended exact IR or generated channel SVG merely because it contains geometry. Sort and deduplicate violations by `container\0path\0code`.

- [ ] **Step 5: Verify GREEN.**

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/artifact-leak.test.ts`

Expected: PASS for every denial and allow fixture.

Run: `rtk mise exec -- pnpm exec tsc -p packages/cli/tsconfig.build.json --noEmit`

Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/cli/src/conformance/artifact-leak.ts packages/cli/src/conformance/artifact-leak.test.ts
rtk git -c core.fsmonitor=false commit -m "feat(cli): detect reference leaks in artifacts"
```

### Task 20: Implement `artifacts build` and verify the exact complete artifact set

**Files:**
- Create: `packages/cli/src/conformance/archive.ts`
- Create: `packages/cli/src/conformance/archive.test.ts`
- Create: `packages/cli/src/conformance/artifact-set.ts`
- Create: `packages/cli/src/conformance/artifact-set.test.ts`
- Create: `packages/cli/src/commands/artifacts.ts`
- Create: `packages/cli/src/commands/artifacts.test.ts`
- Create: `scripts/release/build-qgis-bundle.ts`
- Create: `scripts/release/build-artifact-set.mjs`
- Create: `scripts/release/build-artifact-set.test.mjs`

**Interfaces:**
- Consumes: Task 19 policy, Task 9 canonical drawing PNG service, Task 3 exact assets/claims, Task 6 Web Component package output, Task 8 shared-claim QGIS output, Task 11 completed Website output, `pnpm pack`, and the full local Oracle manifest/root. Tasks 6, 8, 11, and 19 are all immediate prerequisites.
- Produces the actual commands `artifacts build --out <path>` and `artifacts verify --artifact-root <path> --manifest <file> --reference-root <path>` plus:

```ts
export interface ArtifactSetManifest {
  readonly version: 'ExactArtifactSet/v1';
  readonly headCommit: string;
  readonly sourceDateEpoch: string;
  readonly packages: readonly {
    readonly name: string;
    readonly version: string;
    readonly file: string;
    readonly sha256: Sha256Digest;
  }[];
  readonly website: { readonly directory: string; readonly digest: Sha256Digest };
  readonly qgis: { readonly directory: string; readonly digest: Sha256Digest; readonly assets: 661 };
  readonly release: { readonly directory: string; readonly digest: Sha256Digest };
  readonly claims: Readonly<Record<'svg' | 'png' | 'qgis' | 'website', readonly RenderOutputClaim[]>>;
  readonly artifactSetDigest: Sha256Digest;
}
export interface ArtifactVerificationResult {
  readonly version: 'ArtifactVerificationResult/v1';
  readonly headCommit: string;
  readonly sourceDateEpoch: string;
  readonly artifactSetDigest: Sha256Digest;
  readonly oracleSetDigest: Sha256Digest;
  readonly scannedEntryCount: number;
  readonly leaks: readonly [];
  readonly result: 'passed';
}
export function readArtifactEntries(root: string, manifest: ArtifactSetManifest): readonly ArtifactEntry[];
export function verifyArtifacts(options: {
  readonly artifactRoot: string;
  readonly manifestFile: string;
  readonly referenceRoot: string;
}): ArtifactVerificationResult;
```

- [ ] **Step 1: Add compile-safe shells for every new production module, then write archive REDs.** `packages/cli/src/conformance/artifact-set.ts` exclusively owns the final readonly `ArtifactSetManifest` and `ArtifactVerificationResult` shapes above. Create `archive.ts`, `artifact-set.ts`, `commands/artifacts.ts`, `build-qgis-bundle.ts`, and `build-artifact-set.mjs` with their final typed exports/injection seams; each operation throws a typed `NOT_IMPLEMENTED` error before process/filesystem work, and both scripts guard direct execution. Before creating any Task-20 test, run `rtk mise exec -- pnpm exec tsc -p packages/cli/tsconfig.build.json --noEmit`, `rtk mise exec -- pnpm exec tsx -e "await import('./scripts/release/build-qgis-bundle.ts')"`, and `rtk mise exec -- node -e "import('./scripts/release/build-artifact-set.mjs')"`; all must exit 0 without performing work. Then create tiny `.tgz` fixtures and assert safe regular entries. Reject absolute/parent/duplicate paths, symlink/hardlink/device entries, truncated headers, size overruns, nested archives, and decompression beyond fixed byte/entry limits. Enumeration never extracts to disk; missing files/imports or entrypoint-only failure are not RED evidence.

- [ ] **Step 2: Write build/verify behavioral REDs through fake process ports.** Require this order: clean source identity; derive `SOURCE_DATE_EPOCH` from that exact HEAD commit; workspace build with only that epoch; `pnpm pack --pack-destination <temp>/packages` for each of the eight sorted publishable packages with the same epoch; Website build/copy; QGIS style plus 661 renderer-generated exact SVGs; any public PNG through `renderDrawingPng`; release metadata bundle (artifact/SBOM/provenance inputs, never local evidence); claim inventory; canonical manifest last; re-read; full leak scan across `package|website|qgis|release`; atomic rename. `ArtifactSetManifest.sourceDateEpoch` binds the exact canonical decimal epoch. Build accepts no Oracle path because artifact production cannot read originals. Verify requires three explicit paths, loads the full Oracle set only for the denylist, checks exact manifest closure/digests including the current HEAD epoch, and then scans. Missing/extra `.tgz`, changed version/digest/epoch, output claim omission, direct Resvg invocation, or leak fails.

```ts
expect(manifest.packages.map((entry) => entry.name)).toEqual([
  '@einsatzzeichen/catalog', '@einsatzzeichen/cli', '@einsatzzeichen/core',
  '@einsatzzeichen/maplibre', '@einsatzzeichen/qgis', '@einsatzzeichen/react',
  '@einsatzzeichen/schema', '@einsatzzeichen/web-component',
]);
expect(manifest.qgis.assets).toBe(661);
expect(events.at(-1)).toBe('atomic-publish');
```

- [ ] **Step 3: Add exact grammar REDs.** Accept exactly:

```text
artifacts build --out <path>
artifacts verify --artifact-root <path> --manifest <file> --reference-root <path>
```

Reject missing/duplicate/unknown flags, a reference root on build, implicit manifest discovery on verify, unsafe/symlink output, an existing nonempty destination, and any publish flag before spawning a child.

- [ ] **Step 4: Verify behavioral RED.**

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/archive.test.ts packages/cli/src/conformance/artifact-set.test.ts packages/cli/src/commands/artifacts.test.ts scripts/release/build-artifact-set.test.mjs`

Expected: FAIL on archive rejection, event order, exact closure, and grammar assertions after compile-safe stubs load.

- [ ] **Step 5: Implement one transactional reproducible builder.** Parse archives read-only. Derive the epoch from the bound HEAD, reject a different environment value, and pass the same `SOURCE_DATE_EPOCH` to every workspace/package/Website/QGIS/release child. Normalize archive entry ordering, uid/gid/mode and mtimes to this epoch wherever the package/archive format exposes them. `build-qgis-bundle.ts` calls `qgisSymbolLibrary`/`qgisSvgFiles` over sorted exact assets and records `exact-reference-parity`; it never opens Oracle material. `build-artifact-set.mjs` delegates to the same builder used by the CLI command and writes only under the requested ignored root. Its `release/` directory contains only generated public artifact manifests/SBOM/provenance inputs and is enumerated as container `release`; no strict, inspection, Oracle, overlay, heatmap, or trust file enters it. Every raster output delegates to Task 9; source-scan asserts no new Resvg import or PNG encoder. Build inside a fresh sibling temp directory, hash actual bytes, validate closure, scan against structural leak rules that need no Oracle, then atomically rename. Never invoke publish.

- [ ] **Step 6: Implement full Oracle-aware verification.** Resolve/validate the explicit manifest under the explicit artifact root, require that every listed path stays beneath it and every actual entry is listed, load the complete 661-file Oracle set once, enumerate exact `.tgz` bytes/directories, and run Task 19. Redact supplied/resolved reference paths and print “Artifact-Leak-Gate bestanden” only after full success.

- [ ] **Step 7: Verify GREEN and a real local build.**

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/archive.test.ts packages/cli/src/conformance/artifact-set.test.ts packages/cli/src/commands/artifacts.test.ts scripts/release/build-artifact-set.test.mjs`

Expected: PASS.

Run: `rtk mise exec -- node scripts/release/build-artifact-set.mjs --out out/exact-reference/artifacts`

Expected: creates the complete ignored set and `out/exact-reference/artifacts/artifact-set.json`, without publishing or reading an Oracle root.

Run the same command again from the same HEAD into `out/exact-reference/artifacts-repeat` with the same derived epoch. Expected: the two canonical manifests differ in no field and every package tarball, Website/QGIS/release file, directory digest, and `artifactSetDigest` is byte-identical. A run with a different `SOURCE_DATE_EPOCH` is rejected before the first child/build write.

- [ ] **Step 8: Commit source/tests only.**

```bash
rtk git -c core.fsmonitor=false add packages/cli/src/conformance/archive.ts packages/cli/src/conformance/archive.test.ts packages/cli/src/conformance/artifact-set.ts packages/cli/src/conformance/artifact-set.test.ts packages/cli/src/commands/artifacts.ts packages/cli/src/commands/artifacts.test.ts scripts/release/build-qgis-bundle.ts scripts/release/build-artifact-set.mjs scripts/release/build-artifact-set.test.mjs
rtk git -c core.fsmonitor=false commit -m "feat(release): build and scan exact artifacts"
```

### Task 21: Central CLI grammar for exact workflows

**Files:**
- Create: `packages/cli/src/cli.ts`
- Create: `packages/cli/src/index.test.ts`
- Modify: `packages/cli/src/index.ts`
- Modify: `packages/cli/README.md`

**Interfaces:**
- Consumes: Tasks 0, 9, 13, 14, 16, and 20 command functions.
- Produces the following final parser boundary; `packages/cli/src/cli.ts` exclusively owns these readonly types, `parseCli`, and `runCli`:

```ts
export type CliRequest =
  | { readonly kind: 'audit-reference'; readonly filter?: string; readonly print: boolean }
  | { readonly kind: 'coverage' }
  | { readonly kind: 'review-dossier'; readonly out?: string }
  | {
      readonly kind: 'legacy-export'; readonly out: string; readonly size: number;
      readonly theme: 'reference' | 'accessible-light' | 'print-monochrome';
    }
  | { readonly kind: 'visual-proof'; readonly referenceRoot: string; readonly out?: string }
  | {
      readonly kind: 'conformance-batch'; readonly batch: ExactBatchId;
      readonly batchSource: 'staged'; readonly referenceRoot: string; readonly evidenceOut: string;
    }
  | {
      readonly kind: 'conformance-inspect'; readonly batch: ExactBatchId;
      readonly referenceRoot: string; readonly out: string;
    }
  | { readonly kind: 'verify-repository' }
  | {
      readonly kind: 'exact-export'; readonly scope: 'exact-assets';
      readonly format: 'svg' | 'png'; readonly out: string; readonly size: number;
      readonly background?: EvidenceBackground;
    }
  | {
      readonly kind: 'conformance-review-batch'; readonly batch: ExactBatchId;
      readonly batchSource?: 'registry' | 'staged'; readonly referenceRoot: string;
      readonly out: string; readonly strictRun?: string;
    }
  | {
      readonly kind: 'conformance-review-all'; readonly referenceRoot: string;
      readonly out: string; readonly strictRun?: string;
    }
  | {
      readonly kind: 'conformance-verify-strict'; readonly referenceRoot: string;
      readonly resultOut: string; readonly reviewBindingOut: string;
    }
  | {
      readonly kind: 'conformance-trust-init'; readonly purpose: 'development-technical';
      readonly out: string; readonly issuer: string; readonly keyId: string;
      readonly technicalReviewerRegistry: string; readonly reviewer: string;
      readonly validFrom: string; readonly validUntil: string;
    }
  | {
      readonly kind: 'conformance-reviewer-registry-init'; readonly out: string;
      readonly reviewerId: string; readonly reviewerName: string;
      readonly reviewerQualification: string;
    }
  | {
      readonly kind: 'conformance-spec-quality-review-record'; readonly amendedSpec: string;
      readonly foundationPlan: string; readonly corpusPlan: string;
      readonly integrationPlan: string; readonly prepareResult: string;
      readonly technicalReviewerRegistry: string; readonly reviewer: string;
      readonly agentRunId: string; readonly verdict: 'PASS'; readonly out: string;
    }
  | {
      readonly kind: 'conformance-inspection-append'; readonly server: string;
      readonly sessionTokenFile: string; readonly caseKey: ConformanceCaseKey;
      readonly pair: EvidencePairKind; readonly status: 'matches' | 'mismatch';
      readonly note: string; readonly agentRunId: string;
    }
  | {
      readonly kind: 'conformance-attest'; readonly strictRun: string;
      readonly reviewRoot: string; readonly technicalReviewerRegistry: string;
      readonly trustStore: string; readonly signingKey: string; readonly issuer: string;
      readonly keyId: string; readonly attestationDir: string;
    }
  | {
      readonly kind: 'conformance-attestations-verify'; readonly directory: string;
      readonly technicalReviewerRegistry: string; readonly trustStore: string;
      readonly strictRun: string;
    }
  | { readonly kind: 'artifacts-build'; readonly out: string }
  | {
      readonly kind: 'artifacts-verify'; readonly artifactRoot: string;
      readonly manifest: string; readonly referenceRoot: string;
    };

export interface CliPorts {
  readonly dispatch: (request: CliRequest) => Promise<void> | void;
  readonly writeStdout: (message: string) => void;
  readonly writeStderr: (message: string) => void;
}

export function parseCli(argv: readonly string[]): CliRequest;
export function runCli(request: CliRequest, ports: CliPorts): Promise<0 | 1 | 2>;
```

- [ ] **Step 1: Create compile-safe parser/runner stubs, then write table-driven RED parser tests.** The parser initially returns a typed usage error and the runner performs no I/O, so test failure is grammar behavior rather than a missing module. Cover these complete **new Exact-workflow forms** and no aliases:

```text
verify:repository
export --scope exact-assets --format svg|png --out <path> --size <px> [--background transparent|black|white]
conformance:review --batch <id> [--batch-source registry|staged] --reference-root <path> --out <path> [--strict-run <file>]
conformance:review --all --reference-root <path> --out <path> [--strict-run <file>]
conformance verify --strict --reference-root <path> --result-out <file> --review-binding-out <file>
conformance trust init --purpose development-technical --out <path> --issuer <id> --key-id <id> --technical-reviewer-registry <file> --reviewer <id> --valid-from <ISO> --valid-until <ISO>
conformance reviewer-registry init --out <file> --reviewer-id <id> --reviewer-name <name> --reviewer-qualification <text>
conformance spec-quality-review record --amended-spec <file> --foundation-plan <file> --corpus-plan <file> --integration-plan <file> --prepare-result <file> --technical-reviewer-registry <file> --reviewer <id> --agent-run-id <id> --verdict PASS --out <file>
conformance inspection append --server <loopback-url> --session-token-file <file> --case <key> --pair full|selected|without-selected --status matches|mismatch --note <text> --agent-run-id <id>
conformance attest --strict-run <file> --review-root <path> --technical-reviewer-registry <file> --trust-store <file> --signing-key <file> --issuer <id> --key-id <id> --attestation-dir <path>
conformance attestations verify --dir <path> --technical-reviewer-registry <file> --trust-store <file> --strict-run <file>
artifacts build --out <path>
artifacts verify --artifact-root <path> --manifest <file> --reference-root <path>
```

  Preserve every already public/Foundation-produced form with its existing defaults and rejection
  behavior, and add one positive parse plus one injected dispatch regression for each literal
  form—not merely one aggregate “existing commands” assertion:

  ```text
  audit:reference [--filter <prefix>] [--print]
  coverage
  review-dossier [--out <md-path>]
  export [--out <path>] [--size <px>] [--theme reference|accessible-light|print-monochrome]
  visual-proof --reference-root <path> [--out <png-path>]
  conformance:batch --batch <id> --batch-source staged --reference-root <path> --evidence-out <path>
  conformance:inspect --batch <id> --reference-root <path> --out <path>
  ```

  `verify:repository` is already present in the new table and receives the same preservation test.
  The two `export` shapes discriminate solely by the required `--scope exact-assets` flag; absence
  of `--scope` keeps the legacy export grammar. Unknown mixtures fail as usage errors.

Reject arguments to `verify:repository`, missing/duplicate values, `--all` combined with `--batch` or `--batch-source`, non-loopback inspection servers, unknown commands/flags, and all `--accept`, `--approve`, `--update`, `--tolerance`, or strict subset options. Assert parser tests touch no filesystem.

- [ ] **Step 2: Add RED executable dispatch/order tests.** Use temporary ports/roots and assert exit 0 only for a complete success, exit 1 for typed operational errors, exit 2 for usage errors, and no stack/private/local path leakage in user-facing errors. Every `CliRequest.kind` above must reach exactly one task-owned handler; require an exhaustive `never` check so adding or dropping a union member fails typecheck. For public `verify:repository`, inject the pre-existing legacy repository policy and Task 0 source-boundary ports; require exact order `legacyRepositoryPolicy(repositoryRoot)` then `verifyRepositorySourceBoundary({ repositoryRoot, oracleDigests: committedOracleManifestDigests })`, with the digest set derived only from the committed `ORACLE_MANIFEST`. Either failure prevents the later call/success output. Pin this parser/dispatch/order test independently before Task 23 may spawn `pnpm cli verify:repository`. Each legacy/Foundation command above gets its own handler spy and preserves its exact parsed defaults; none may become an unknown command while the new grammar is introduced.

- [ ] **Step 3: Verify RED.**

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/index.test.ts packages/cli/src/commands/conformance.test.ts packages/cli/src/commands/conformance-review.test.ts packages/cli/src/commands/conformance-inspection.test.ts packages/cli/src/commands/artifacts.test.ts`

Expected: FAIL on the first valid parse/dispatch/exit-code assertion while compile-safe stubs load.

- [ ] **Step 4: Refactor `index.ts` into a thin executable wrapper.** Parse once, dispatch once, catch only known usage/operational errors, and set exit code. Every advertised form dispatches to a task-owned implementation; there is no documented-but-unimplemented script. `verify:repository` first invokes the unchanged legacy repository policy and then Task 0 `verifyRepositorySourceBoundary` with the exact committed Oracle-asset digest set; it reports success only after both pass and accepts no Oracle root/environment fallback. Implement `reviewer-registry init` as a local-only canonical `TechnicalReviewerRegistry/v1` writer with one explicit enabled ID/name/qualification, duplicate/blank rejection, digest finalization, `O_EXCL|O_NOFOLLOW`, and no domain/public-release semantics. Implement `spec-quality-review record` as an exclusive canonical finalizer, not a review engine: it accepts only literal `PASS`, reads the immutable pre-Foundation `BASE` from the Foundation ledger and hashes exactly `BASE..HEAD`, resolves reviewer name/qualification from the verified run-local registry, rehashes current HEAD, amended spec, the three exact plan paths, and the prepare result plus every prepare input named there, requires a fresh nonblank independent `agentRunId`, fixes `blockers: []`, computes its own digest, and refuses stale/mismatched/cross-run/pre-existing output. Any reviewer-reported Spec/Critical/Important finding means the command must not be invoked. Implement `trust init` only with literal `--purpose development-technical`: first verify the explicit technical reviewer registry and enabled `--reviewer`, then generate local Ed25519 material below the requested ignored output root, private key mode 0600, schema-valid public trust store without private material, and a sibling signed/canonical `local-trust-policy.json` carrying `version: 'LocalTrustPolicy/v1'`, `purpose: 'development-technical'`, and the technical-registry digest; it creates no approval/attestation and makes no release claim. `inspection append` is only Task 16's authenticated HTTP client. `attest` derives the canonical required case/pair tuple from the finalized registry, rejects missing/extra/duplicate/reordered supplied evidence, consumes the complete expected paired inspection set plus the explicit technical reviewer registry, and calls Task 14's transactional all-or-nothing publisher; each Foundation verifier receives that registry-derived `requiredPairs`, and the command cannot turn `unreviewed` or `mismatch` into approval.

- [ ] **Step 5: Document exact claim boundaries and local-only files.** The README must state that `conformance:review` is not a pass, strict is the only zero-diff run, browser results are compatibility only, key/evidence/attestation paths stay local, and public release needs separate authorization.

- [ ] **Step 6: Verify GREEN.**

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/index.test.ts packages/cli/src/commands/*.test.ts packages/cli/src/conformance/*.test.ts`

Expected: PASS.

Run: `rtk mise exec -- pnpm build`

Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
rtk git -c core.fsmonitor=false add packages/cli/src/cli.ts packages/cli/src/index.ts packages/cli/src/index.test.ts packages/cli/README.md
rtk git -c core.fsmonitor=false commit -m "feat(cli): expose exact conformance workflow"
```

### Task 22: Two-stage versioned release with independently signed artifact authorization

**Files:**
- Create: `scripts/release/release-contract.mjs`
- Create: `scripts/release/release-contract.test.mjs`
- Create: `scripts/release/domain-review-record.mjs`
- Create: `scripts/release/domain-review-record.test.mjs`
- Create: `scripts/release/create-release-candidate.mjs`
- Create: `scripts/release/create-release-candidate.test.mjs`
- Create: `scripts/release/verify-exact-release.mjs`
- Create: `scripts/release/verify-exact-release.test.mjs`
- Modify: `scripts/release/set-version.mjs`
- Modify: `scripts/release/publish.mjs`
- Modify: `scripts/release/publish.test.mjs`
- Modify: `release.config.mjs`
- Create: `.github/workflows/release-candidate.yml`
- Modify: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: a final versioned candidate commit, Task 20's exact artifact set, Task 14's complete technical attestation set and finalized-registry `deriveRequiredConformanceCasePairs` input, fresh domain-review digest, Node-22/toolchain/workflow digests, two independently controlled release trust roots/key allowlists, and an external signed public-release authorization.
- Produces canonical contracts whose signature field is excluded only while verifying/signing:

```ts
export interface ReleaseCandidateManifest {
  readonly version: 'ReleaseCandidate/v1';
  readonly releaseVersion: string;
  readonly candidateCommit: string;
  readonly sourceDateEpoch: string;
  readonly sourceTreeDigest: Sha256Digest;
  readonly artifactManifestDigest: Sha256Digest;
  readonly publishPackages: readonly {
    readonly name: string;
    readonly version: string;
    readonly file: string;
    readonly sha256: Sha256Digest;
  }[];
}

export interface DomainReviewRecord {
  readonly version: 'DomainReviewRecord/v1';
  readonly producer: {
    readonly name: 'scripts/release/domain-review-record.mjs';
    readonly version: '1';
    readonly producerDigest: Sha256Digest;
  };
  readonly schema: {
    readonly reviewSchemaVersion: 'Review/v1';
    readonly recordSchemaDigest: Sha256Digest;
  };
  readonly candidateCommit: string;
  readonly sourceTreeDigest: Sha256Digest;
  readonly buildInputDigest: Sha256Digest;
  readonly sourceDateEpoch: string;
  readonly freshness: {
    readonly coverageManifestDigest: Sha256Digest;
    readonly sourceRegistryDigest: Sha256Digest;
    readonly profileRegistryDigest: Sha256Digest;
    readonly domainReviewLedgerDigest: Sha256Digest;
    readonly domainReviewerRegistryDigest: Sha256Digest;
    readonly domainReviewQuestionsDigest: Sha256Digest;
  };
  readonly expectedKeySets: {
    readonly manifestReviewKeys: readonly string[];
    readonly sourceReviewKeys: readonly string[];
    readonly profileReviewKeys: readonly string[];
    readonly reviewerIds: readonly string[];
    readonly manifestReviewKeySetDigest: Sha256Digest;
    readonly sourceReviewKeySetDigest: Sha256Digest;
    readonly profileReviewKeySetDigest: Sha256Digest;
    readonly reviewerIdSetDigest: Sha256Digest;
  };
  readonly allowedFinalStatuses: readonly ['approved'];
  readonly reviews: readonly {
    readonly kind: 'manifest' | 'source' | 'profile';
    readonly key: string;
    readonly status: 'approved';
    readonly reviewerId: string;
    readonly reviewerName: string;
    readonly reviewerQualification: string;
    readonly date: string;
    readonly note: string;
    readonly contentDigest: Sha256Digest;
  }[];
  readonly coverageVerification: {
    readonly openDomainReviewKeys: readonly [];
    readonly deviationKeys: readonly [];
    readonly attributionViolationKeys: readonly [];
    readonly coverageViolationKeys: readonly [];
    readonly releaseBlockerKeys: readonly [];
    readonly verificationDigest: Sha256Digest;
  };
  readonly recordDigest: Sha256Digest;
  readonly signature: {
    readonly version: 'DomainReviewRecordSignature/v1';
    readonly algorithm: 'Ed25519';
    readonly keyId: string;
    readonly payloadEncoding: 'RFC8785-JCS-UTF8';
    readonly signatureBase64Url: string;
  };
}

export interface PublicReleaseAuthorization {
  readonly version: 'PublicReleaseAuthorization/v1';
  readonly releaseVersion: string;
  readonly candidateCommit: string;
  readonly scope: readonly [
    'geometry-paint-ir-publication',
    'embedded-font-publication',
    'reference-design-similarity-publication',
  ];
  readonly issuer: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly technicalAttestationSetDigest: Sha256Digest;
  readonly domainReviewDigest: Sha256Digest;
  readonly artifactManifestDigest: Sha256Digest;
  readonly artifactSetDigest: Sha256Digest;
  readonly workflowDigest: Sha256Digest;
  readonly toolchainDigest: Sha256Digest;
  readonly artifacts: readonly {
    readonly name: string;
    readonly version: string;
    readonly file: string;
    readonly sha256: Sha256Digest;
  }[];
  readonly signature: {
    readonly version: 'PublicReleaseAuthorizationSignature/v1';
    readonly algorithm: 'Ed25519';
    readonly keyId: string;
    readonly payloadEncoding: 'RFC8785-JCS-UTF8';
    readonly signatureBase64Url: string;
  };
}
```

- [ ] **Step 1: Add compile-safe contract/candidate/domain-record/verifier exports before tests.** Each script exports an injectable `main`/pure verifier and throws a typed `RELEASE_NOT_IMPLEMENTED`; direct execution is guarded by an entrypoint check. `domain-review-record.mjs` exports pure `createDomainReviewRecord`, `verifyDomainReviewRecord`, and an injectable signing entrypoint with the complete schema above. Run Node import smoke tests first. A missing file/module is never release RED evidence.

- [ ] **Step 2: Write RED for Stage 1: the final versioned candidate commit.** Inject semantic version-analysis and release-note ports. Starting from clean `main@base`, compute one next version, update root/all package versions plus `CHANGELOG.md`, run public unit/type/build gates under Node 22, and create exactly one commit `chore(release): <version> [release candidate]`. Derive the canonical epoch from the resulting candidate commit and bind it in every subsequent build/manifest. Assert the returned `candidateCommit` is the new 40-hex HEAD, every packed package will report that exact version, the checkout is clean, and no tag, GitHub release, npm command, technical parity statement, artifact authorization, or publish call occurs. Re-running at that candidate is a no-op. The candidate workflow skips its own candidate commit to prevent recursion.

- [ ] **Step 3: Write RED for Stage 2 artifact identity and protected trust.** Build Task 20 artifacts from an exact detached checkout of `candidateCommit`, then construct `ReleaseCandidateManifest` from the re-read exact `.tgz` bytes. Fail if version/commit/source tree differs, a `.tgz` is missing/extra/repacked, the manifest is outside the immutable workflow artifact, or Website/QGIS/release bundle failed scanning. Technical verification accepts only a release trust-store file whose digest equals the independently configured protected pin and whose signing key ID is in `EXACT_RELEASE_TECHNICAL_KEY_ALLOWLIST`. Explicitly reject all stores/keys marked `development-technical`, any path below `out/exact-reference/trust`, self-generated keys, unknown/revoked/expired keys, or a pin supplied by the candidate checkout.

- [ ] **Step 4: Write fixed-vector RED for the complete signed DomainReviewRecord and public authorization.** Build the record only from the checked-out candidate's actual `COVERAGE_MANIFEST`, `SOURCE_REGISTRY`, `PROFILES`, `MANIFEST_DOMAIN_REVIEWS`, source/profile review ledgers, `DOMAIN_REVIEWERS`, domain-review questions, and current coverage/release-blocker functions. Independently derive the exact sorted expected keysets, require every expected key exactly once and no extra key, bind each completed review to a registered reviewer ID/name/qualification, and allow only `approved`; `pending`, `deviation`, missing/blank note, invalid date, unregistered reviewer, or any open attribution/coverage/release blocker prevents record creation. Compute every content/keyset/freshness/coverage digest server-side, set `recordDigest` to JCS of all fields except `recordDigest` and `signature` under the documented domain separator, and sign the complete record without `signature` using the independent protected domain-review authority.

  Verification does not trust stored summary fields: it re-derives current expected keysets and reviewer registration, compares every ledger value/content digest, reruns attribution plus complete coverage/release-blocker gates, re-derives the canonical candidate `SOURCE_DATE_EPOCH`, recomputes `recordDigest`, and verifies `DomainReviewRecordSignature/v1` against a protected domain trust-store digest/key allowlist. Mutate producer name/version/digest, schema/version/digest, any expected key or set digest, reviewer ID/name/qualification/registration, allowed-status tuple, status/date/note/content digest, every freshness input, coverage lists/digest, candidate/tree/build/epoch, record digest, signature/key/time; each independent mutation must fail. Also test equal counts with a substituted key and a content mutation with unchanged stored summaries. Only after this record passes may its `recordDigest` populate `PublicReleaseAuthorization.domainReviewDigest`.

  Then verify Ed25519 over RFC-8785 JCS bytes of the complete `PublicReleaseAuthorization` without `signature`, with the distinct `PublicReleaseAuthorizationSignature/v1` domain/version to prevent protocol reuse. Its independent authorization trust-store digest and key allowlist come from the protected release environment, not the checkout or local Task 21 trust command. Require exact scope order, candidate commit/version, nonexpired instant, registered issuer, technical-attestation-set/domain-review/artifact-manifest/artifact-set/workflow/toolchain digests, and byte-for-byte equality of the sorted authorized artifact list to the actual candidate `.tgz` list. Mutate each field independently and require failure. A valid technical attestation never substitutes for this authorization or for the independently signed fresh DomainReviewRecord.

- [ ] **Step 5: Write publish-bypass REDs.** Inject process/filesystem/verifier ports. `publish.mjs` must first run the final verifier, rehash every `.tgz`, then invoke exactly `pnpm publish <absolute-verified-tgz> --access public --provenance --no-git-checks` for each authorized publish entry. It must never invoke `pnpm -r publish`, `pnpm publish` with a workspace/package directory, `pnpm pack`, or rebuild after authorization. Any verifier/hash/publish failure stops subsequent calls. A semantic-release availability hook, if retained for candidate analysis, is explicitly preliminary and cannot call publish or emit a final-pass claim; `release.config.mjs` has no publish plugin/path.

- [ ] **Step 6: Verify behavioral RED.**

Run: `rtk mise exec -- pnpm exec vitest run scripts/release/release-contract.test.mjs scripts/release/domain-review-record.test.mjs scripts/release/create-release-candidate.test.mjs scripts/release/verify-exact-release.test.mjs scripts/release/publish.test.mjs`

Expected: FAIL on candidate side-effect boundaries, trust-root rejection, signature mutation, exact `.tgz` argv, and no-rebuild assertions while all script imports succeed.

- [ ] **Step 7: Implement Stage 1 workflow ownership.** `release-candidate.yml` runs only on non-candidate pushes to `main`, checks out full history, pins Node 22/pnpm 11.20.0, executes `create-release-candidate.mjs`, and uses the existing narrowly scoped release-app token only to push the generated version/changelog commit. `release.config.mjs` supplies analyzer/note-generation configuration to that script but performs no tag/release/publish. The final candidate commit, not its parent and not a dirty workspace, is the only allowed Stage 2 input. Every build in both workflows sets `SOURCE_DATE_EPOCH` to the verified candidate-commit timestamp; a different preexisting value fails before build.

- [ ] **Step 8: Implement Stage 2 immutable build/authorize/publish.** `release.yml` becomes manual/protected, pins Node 22 and pnpm 11.20.0 in every job, and requires literal `candidateCommit` plus an externally produced complete strict/paired-attestation set for that exact commit, signed by the independently controlled release-technical authority. Its build job checks out that SHA detached, confirms it is the current versioned candidate on `main`, verifies the supplied strict/attestation set against current source/build/toolchain identities (public CI does not fake or skip the unavailable Oracle rerun), executes Task 20 artifact build twice with the candidate epoch and requires byte-identical artifact manifests/files, and re-enumerates/scans every built entry against the committed Oracle-manifest digest denylist bound by that technical set. The Oracle-root-aware `artifacts verify` remains a local gate and is not falsely claimed in public CI. The job writes the candidate manifest including `sourceDateEpoch` and uploads one immutable artifact bundle. A protected `release-authorization` job obtains the externally signed current `DomainReviewRecord`, public authorization, and independently administered technical/domain/authorization trust-store files, digest pins, and key allowlists; none comes from repository source or local dev output. A protected publish job downloads the same immutable bundle by artifact ID/digest, reruns `verify-exact-release.mjs` against explicit files, then gives only the already hashed `.tgz` paths to `publish.mjs`. Tags and GitHub release are created only after all npm publishes succeed and name the exact candidate commit. Task 23 later wraps the local Oracle acceptance commands; release does not depend on a future task and never reports a skipped Oracle run as parity.

- [ ] **Step 9: Implement fail-closed final verification.** Require explicit arguments for candidate manifest, artifact root/manifest, technical attestation directory/trust store/trust-store digest/key allowlist, strict run, DomainReviewRecord, domain trust store/trust-store digest/key allowlist, signed authorization, authorization trust store/trust-store digest/key allowlist, and current time. Recompute current commit/tree/build/workflow/toolchain/epoch and artifact bytes plus the Reachable-set, total-Reference-set, and manifest-derived Pair-Ownership digests from the candidate checkout; compare all three directly with strict state and every technical attestation. Derive the canonical sorted case/required-pair sequence from the finalized registry, reject missing/extra/duplicate/reordered cases or pairs, and pass each exact tuple as the authoritative `requiredPairs` argument to every Foundation `verifyConformanceAttestation` call. Never infer required pairs from signed provenance or the directory contents. Call `verifyDomainReviewRecord` to rederive content, coverage, expected keysets, reviewer registration, allowed statuses, freshness, record digest, and signature from the checked-out candidate. Reject dirty checkout, environment/store mismatch, incomplete case/pair attestations, stale reviews, symlinks, any locally generated trust metadata, and any authorization/artifact divergence. Redact input paths and do not print final success until every check completes.

- [ ] **Step 10: Verify GREEN, workflow policy, and no workspace publishing.**

Run: `rtk mise exec -- pnpm exec vitest run scripts/release/release-contract.test.mjs scripts/release/domain-review-record.test.mjs scripts/release/create-release-candidate.test.mjs scripts/release/verify-exact-release.test.mjs scripts/release/publish.test.mjs scripts/release/changed-packages.test.mjs`

Expected: PASS; all failure fixtures record zero publish/tag/release calls, and success records only exact verified `.tgz` paths.

Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/toolchain-contract.test.ts`

Expected: PASS with Node 22 and both final workflow files included in attested build/toolchain inputs.

- [ ] **Step 11: Commit the complete two-stage policy.**

```bash
rtk git -c core.fsmonitor=false add scripts/release/release-contract.mjs scripts/release/release-contract.test.mjs scripts/release/domain-review-record.mjs scripts/release/domain-review-record.test.mjs scripts/release/create-release-candidate.mjs scripts/release/create-release-candidate.test.mjs scripts/release/verify-exact-release.mjs scripts/release/verify-exact-release.test.mjs scripts/release/set-version.mjs scripts/release/publish.mjs scripts/release/publish.test.mjs release.config.mjs .github/workflows/release-candidate.yml .github/workflows/release.yml
rtk git -c core.fsmonitor=false commit -m "feat(release): authorize immutable versioned artifacts"
```

### Task 23: Reproducible prepare/final full-gate with explicit inputs

**Files:**
- Create: `scripts/conformance/full-gate.mjs`
- Create: `scripts/conformance/full-gate.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: all prior tasks.
- Produces one side-effect-free library/orchestrator plus two unambiguous root CLI scripts. Corpus Task 95 must invoke these exact forms; the older shorthand `verify:exact --phase ...` and implicit artifact-manifest discovery do not exist:

```text
pnpm verify:exact:prepare --reference-root <path> --strict-run-out <file> --review-binding-out <file> --review-root <path> --technical-reviewer-registry <file> --reviewer <id> --artifact-root <path> --artifact-manifest <file> --result-out <file>
pnpm verify:exact:final --reference-root <path> --strict-run <file> --review-binding <file> --review-root <path> --technical-reviewer-registry <file> --reviewer <id> --spec-quality-review <file> --review-freeze <file> --attestation-dir <path> --trust-store <file> --artifact-root <path> --artifact-manifest <file> --result-out <file>
```

Corpus Task 95 must begin with the fresh absent run root `out/exact-reference/task-95-run-001/`. It creates `out/exact-reference/task-95-run-001/reviewers/technical-reviewers.json` with `conformance reviewer-registry init` before prepare; prepare then publishes exactly `out/exact-reference/task-95-run-001/strict-runs/current/strict-run.json` and `out/exact-reference/task-95-run-001/strict-runs/current/review-binding.json` through Task 13's directory transaction. It passes that same run-specific registry file and the same `--reviewer` ID to prepare, Review startup, trust/attestation verification, and final, and stages no aggregator/source files; its prepare path relies on the clean-checkout unstaged `conformance:review --all` invocation below. After prepare, an independent reviewer must create the current run's exact `spec-quality-review.json`; the Review supervisor creates `<run-root>/review/review-freeze.json` only after shutdown. A failed attempt is retained and Corpus Task 95 selects the next absent zero-padded run root with every path rebound.

- [ ] **Step 1: Add compile-safe prepare/final parsers and orchestrator stubs, then write exact grammar REDs.** `full-gate.mjs` exports pure `parsePrepareArgs`, `parseFinalArgs`, `runPrepareGate`, and `runFinalGate`; two guarded executable wrappers (or two exact package-script mode constants into the same guarded file) select one grammar before parsing. The stubs parse no valid form and spawn nothing. Require every argument above, reject the removed `--phase` flag, environment-variable fallback for paths, duplicates, phase-inappropriate flags, symlinks/unsafe output relationships, update/accept/tolerance/subset options, and all unknown arguments before any process call.

  Derive one common ignored per-run root from every output/input path other than `--reference-root`; do not accept a shared global reviewers/strict/artifact directory or paths from two runs. For prepare, `<run-root>` may already exist only with the freshly verified `reviewers/technical-reviewers.json`; `strict-runs/current/` must be absent and the strict/binding outputs must be exactly `<run-root>/strict-runs/current/strict-run.json` and `<run-root>/strict-runs/current/review-binding.json`. Require `--technical-reviewer-registry <run-root>/reviewers/technical-reviewers.json`, `--review-root <run-root>/review`, `--artifact-root <run-root>/artifacts`, `--artifact-manifest <run-root>/artifacts/artifact-set.json`, and `--result-out <run-root>/prepare-result.json`. Final requires the same root and exact strict/binding/reviewer/review/artifact paths plus `<run-root>/spec-quality-review.json`, `<run-root>/review/review-freeze.json`, `<run-root>/browser/summary.json`, `<run-root>/attestations`, `<run-root>/trust/trust-store.json`, and `<run-root>/final-result.json`; it rebuilds none of them. Validate real existing ancestors, reject symlink/path-alias/traversal relationships, and treat Task 13's absent `current/` subdirectory—not the existing run root—as the atomic strict publication unit. Pin complete Task-24 and Corpus-Task-95 vectors under their respective `*-run-001/` roots in parser tests, plus `*-run-002/` retry vectors proving no path remains bound to attempt 001.

- [ ] **Step 2: Write RED process-order and argv tests.** Prepare first runs the Task-21-tested public `verify:repository` dispatch (legacy policy followed by Task 0 boundary with committed Oracle digests), then unit tests, typecheck, build, Website snapshot check/check/build, Review typecheck, full strict verification with its transactional two-file output directory, unstaged registry `--all` paired evidence bound to the review-binding file, artifact build, and explicit artifact verify. It verifies the registry digest and reviewer membership before writing the prepare result. Every build gets the same canonical HEAD-derived `SOURCE_DATE_EPOCH`. Prepare deliberately ends before independent spec/quality review, browser compatibility, Review-server startup, visual inspection, freeze, trust, or attestation.

  Final reruns source/current identity and strict freshness against the explicit Oracle root and binding, including direct equality of `reachableBuilderContextSetDigest`, `referenceComponentContextSetDigest` and `referenceComponentContextOwnershipDigest` freshly rederived from the canonical sets plus Pair↔Fixture/manifest-owner helper; verifies the independent spec-quality PASS before consuming the separately produced browser summary or visual review; derives the canonical required cases/pairs from the finalized registry; verifies complete pair inspections, the post-shutdown Review freeze, the complete attestation set, explicit artifact set, and Git cleanliness. It does not rebuild, start/stop Review, rewrite review data, attest, or publish. Both phases write their canonical result file only after success. Assert exact argument arrays and environment maps, not display strings.

```js
expect(prepareEvents).toEqual([
  'verify-repository', 'test', 'typecheck', 'build', 'website-snapshot-check',
  'website-check', 'website-build', 'review-typecheck', 'strict', 'review-all',
  'artifact-build', 'artifact-verify',
]);
expect(finalEvents).toEqual([
  'source-boundary', 'current-identity', 'strict-freshness', 'spec-quality-review',
  'browser-summary', 'visual-review-complete', 'review-freeze', 'attestation-set',
  'artifact-verify', 'git-clean',
]);
```

- [ ] **Step 3: Add fail-closed claim/path REDs.** Public/no-Oracle execution fails `ORACLE_UNAVAILABLE` and never prints parity. For both phases, capture child stdout/stderr and replace supplied and resolved reference paths before forwarding or writing a run record. Failure of any event stops all later events. Final prints the technical claim only after all events pass and labels SVG/PNG/QGIS/Website claim classifications separately; browser output remains compatibility-only. Neither phase invokes release/publish.

- [ ] **Step 4: Verify behavioral RED.**

Run: `rtk mise exec -- pnpm exec vitest run scripts/conformance/full-gate.test.mjs`

Expected: FAIL on valid grammar, exact event/argv order, and redaction assertions while the stub imports cleanly.

- [ ] **Step 5: Implement prepare through the canonical commands.** Add `verify:exact:prepare: "node scripts/conformance/full-gate.mjs prepare"` and `verify:exact:final: "node scripts/conformance/full-gate.mjs final"` without changing default `test`; do not add a generic `verify:exact` alias. Pass child arguments as arrays under the already measured Node-22/mise environment and the one derived `SOURCE_DATE_EPOCH`:

```text
pnpm cli verify:repository
pnpm test
pnpm typecheck
pnpm build
pnpm --filter @einsatzzeichen/website snapshot:check
pnpm --filter @einsatzzeichen/website check
pnpm --filter @einsatzzeichen/website build
pnpm --filter @einsatzzeichen/review typecheck
pnpm cli conformance verify --strict --reference-root <reference> --result-out <strict> --review-binding-out <binding>
pnpm cli conformance:review --all --reference-root <reference> --out <review> --strict-run <binding>
pnpm cli artifacts build --out <artifact-root>
pnpm cli artifacts verify --artifact-root <artifact-root> --manifest <artifact-manifest> --reference-root <reference>
```

Require `--artifact-manifest` to equal the explicit canonical `<artifact-root>/artifact-set.json` that `artifacts build` creates; reject any mismatch and never discover “latest”. Review receives Task 13's separate `ReviewEvidenceRunBinding`, not the full `StrictRunRecord` despite the historical flag name. Hash the completed prepare inputs/outputs into `--result-out`, including strict-run, review-binding, review-tree/evidence, technical-reviewer-registry, and artifact-manifest digests plus `sourceDateEpoch`; the prepare-result's own digest covers every field, and it is written as JCS plus LF atomically. This exact prepare-input/result digest set is the one later copied into and independently reverified for `SpecQualityReviewRecord`.

- [ ] **Step 6: Implement final as read-only verification with scope-specific bindings.** Recompute checkout/toolchain/workflow/epoch identity; verify the explicit strict record and review binding plus every registry-derived expected case/required-PairResult/cell against the explicit Oracle root. Re-read the explicit technical reviewer registry, require the explicit reviewer enabled there, and require every immutable inspection to bind that registry digest/reviewer. Verify `--spec-quality-review` before accepting the browser summary or review records. Require the exact finalized-registry-derived Whole/`source-node-set`/`leave-one-out` pair tuple for each case and pass each authoritative tuple into every `verifyConformanceAttestation` call through `conformance attestations verify --dir <attestation> --trust-store <trust> --technical-reviewer-registry <technical-reviewers> --strict-run <strict>`. Require `--review-freeze` to be exactly `<run-root>/review/review-freeze.json`; verify it only after proving the captured Review PID is not live, its token path is absent, its port is closed, and the current canonical review-tree digest—excluding exactly that freeze file and its temporary sibling—equals the frozen digest. Hash that same tree once before all final reads and once after them to reject concurrent/tree drift. Run artifact verify with all three explicit inputs, then require clean Git.

  Encode and test this binding matrix instead of asserting that unrelated records all bind one universal keyset:

  | Record | Authoritative binding |
  |---|---|
  | strict run | HEAD/tree/build/toolchain/epoch, Oracle and exact registry/fixture/renderer digests, canonical case keys and per-case required pairs |
  | review binding/evidence | strict run ID+digest, case/pair/cell/image keys and evidence byte digests |
  | technical reviewer registry | its own canonical reviewer identities and registry digest; no inferred HEAD/domain authority |
  | visual inspection | strict/binding, its one case/pair/evidence digest, reviewer ID and registry digest |
  | technical attestation/set | current conformance input and the finalized-registry `requiredPairs` for each exact case |
  | artifact set | HEAD, source epoch, and closed artifact-file/digest closure only |
  | prepare result | strict/binding/evidence/reviewer-registry/artifact-manifest input digests, epoch, and own digest |
  | spec-quality review | HEAD, amended spec, all three plan digests, exact prepare input/result digests, reviewer run, PASS/empty blockers, and own digest |
  | browser summary | strict/binding/evidence/reviewer/spec-quality digests, browser versions/results, epoch, and own digest |
  | review freeze | strict/binding/evidence and final review-tree digests, shutdown evidence, and own digest |
  | final result | every verified input digest including prepare, spec-quality, browser, review-freeze, attestations/trust, artifact manifest; classifications and own digest |

  Add missing/extra/duplicate/reordered required-case and required-pair tests at the strict, inspection, attestation-set, and final boundaries, plus independent single-field digest mutations for every matrix row. Write only the explicit ignored `--result-out` after all checks, with `specQualityReviewDigest`, `reviewFreezeDigest`, frozen review-tree digest, browser-summary digest, all remaining input/output digests, claim classifications, and its own digest. No implicit `out/latest`, rebuild, server start, review mutation, or attestation mutation.

- [ ] **Step 7: Verify GREEN under Node 22.**

Run: `rtk mise exec -- pnpm exec vitest run scripts/conformance/full-gate.test.mjs`

Expected: PASS.

Run: `rtk mise exec -- pnpm test`

Expected: PASS.

- [ ] **Step 8: Commit.**

```bash
rtk git -c core.fsmonitor=false add scripts/conformance/full-gate.mjs scripts/conformance/full-gate.test.mjs package.json
rtk git -c core.fsmonitor=false commit -m "test(conformance): orchestrate explicit exact gates"
```

### Task 24: Execute exhaustive technical acceptance with independent visual agents

**Files:**
- No source modification.
- Local generated evidence only: `out/exact-reference/**`.

**Interfaces:**
- Consumes: Task 23 commands, the complete local oracle, every batch's separate required PairResults with four images per cell, independent reviewer-agent findings, and a locally generated trust/signing identity.
- Produces: one immutable successful attempt containing a current strict run, independent specification/quality PASS, browser compatibility summary, one server-authored visual finding for every required case/pair, a post-shutdown Review freeze, one valid attestation per conformance case with all pair provenance, a clean artifact set, and a final technical gate record. None is committed and none authorizes public release.

- [ ] **Step 1: Allocate an immutable attempt, create its reviewer registry, and run prepare from a clean checkout.** The first attempt is exactly the absent ignored root `out/exact-reference/task-24-run-001/`. Never reuse, clean, overwrite, rename, or address an attempt through `latest`/`current` outside the Task-13-owned strict subdirectory. For a retry, preserve every prior attempt and select the lowest zero-padded `task-24-run-NNN` whose immediate predecessor exists and whose own directory is absent; every argument below is rebound consistently to that one root. Creating the reviewer registry is the only permitted creation of the run root before prepare:

```bash
rtk mise exec -- pnpm cli conformance reviewer-registry init \
  --out out/exact-reference/task-24-run-001/reviewers/technical-reviewers.json \
  --reviewer-id independent-agent-review \
  --reviewer-name "Independent exact-reference reviewer" \
  --reviewer-qualification "independent visual conformance review"
```

Expected: one canonical ignored `TechnicalReviewerRegistry/v1` with a verified digest and enabled reviewer; it contains no domain-review approval, signing key, or public-release authority. Then run:

```bash
rtk mise exec -- pnpm verify:exact:prepare \
  --reference-root ../../taktische-zeichen \
  --strict-run-out out/exact-reference/task-24-run-001/strict-runs/current/strict-run.json \
  --review-binding-out out/exact-reference/task-24-run-001/strict-runs/current/review-binding.json \
  --review-root out/exact-reference/task-24-run-001/review \
  --technical-reviewer-registry out/exact-reference/task-24-run-001/reviewers/technical-reviewers.json \
  --reviewer independent-agent-review \
  --artifact-root out/exact-reference/task-24-run-001/artifacts \
  --artifact-manifest out/exact-reference/task-24-run-001/artifacts/artifact-set.json \
  --result-out out/exact-reference/task-24-run-001/prepare-result.json
```

Expected: prepare covers repository/source, unit, type, build, Website, Review type, strict/evidence, and artifact gates and writes its digest-bound result; strict covers the complete key sets with zero vector and RGBA differences, while prepare deliberately does not run browser, visual review, trust, or attestation. Any failure preserves this attempt as failed and invokes Step 7.

- [ ] **Step 2: Require an independent specification and code-quality PASS before any visual process.** A fresh highest-capability reviewer receives current HEAD, the amended specification, all three plans, and the complete prepare result/input tree. It must explicitly report separate specification-conformance and implementation-quality verdicts. Any Spec, Critical, or Important finding prevents record creation, invokes a fresh task-scoped fixer plus a fresh re-review, and then restarts at Step 1 in a new attempt. Only two explicit PASS verdicts with no blockers permit this exact finalizer:

```bash
rtk mise exec -- pnpm cli conformance spec-quality-review record \
  --amended-spec docs/superpowers/specs/2026-09-04-exact-reference-parity-design.md \
  --foundation-plan docs/superpowers/plans/2026-09-04-exact-reference-foundation.md \
  --corpus-plan docs/superpowers/plans/2026-09-04-exact-reference-corpus.md \
  --integration-plan docs/superpowers/plans/2026-09-04-exact-reference-integration.md \
  --prepare-result out/exact-reference/task-24-run-001/prepare-result.json \
  --technical-reviewer-registry out/exact-reference/task-24-run-001/reviewers/technical-reviewers.json \
  --reviewer independent-agent-review \
  --agent-run-id <fresh-independent-spec-quality-agent-run-id> \
  --verdict PASS \
  --out out/exact-reference/task-24-run-001/spec-quality-review.json
```

Expected: one immutable `SpecQualityReviewRecord` binding current HEAD, amended spec, separately named Foundation/Corpus/Integration plans, every prepare input/result digest, registered reviewer identity, fresh agent-run identity, literal PASS, empty blockers, and its own digest. Task 16 must reject it before listening if any bound byte changes.

- [ ] **Step 3: Run the three-browser compatibility gate only after the specification/quality PASS.** Run the Task-18 self-contained harness against this attempt's explicit inputs:

```bash
rtk mise exec -- env SOURCE_DATE_EPOCH=$(rtk git -c core.fsmonitor=false show -s --format=%ct HEAD) \
  pnpm --filter @einsatzzeichen/review test:browser:exact -- \
  --strict-run out/exact-reference/task-24-run-001/strict-runs/current/strict-run.json \
  --review-binding out/exact-reference/task-24-run-001/strict-runs/current/review-binding.json \
  --evidence-root out/exact-reference/task-24-run-001/review \
  --technical-reviewer-registry out/exact-reference/task-24-run-001/reviewers/technical-reviewers.json \
  --reviewer independent-agent-review \
  --spec-quality-review out/exact-reference/task-24-run-001/spec-quality-review.json \
  --session-token-out out/exact-reference/task-24-run-001/browser/session-token \
  --review-freeze-out out/exact-reference/task-24-run-001/browser/shutdown-freeze.json
```

Expected: Chromium/Firefox/WebKit compatibility PASS, canonical `browser/summary.json`, captured child exit, absent browser token, closed port, and a valid browser-session freeze. It is compatibility evidence only and does not substitute for the visual-inspection Review freeze below. Any failure invokes Step 7.

- [ ] **Step 4: Start the secured local Review server and inspect every required pair; never edit evidence JSON.** Run:

```bash
rtk mise exec -- pnpm --filter @einsatzzeichen/review serve:conformance -- \
  --evidence-root out/exact-reference/task-24-run-001/review \
  --strict-run out/exact-reference/task-24-run-001/strict-runs/current/strict-run.json \
  --review-binding out/exact-reference/task-24-run-001/strict-runs/current/review-binding.json \
  --technical-reviewer-registry out/exact-reference/task-24-run-001/reviewers/technical-reviewers.json \
  --reviewer independent-agent-review \
  --spec-quality-review out/exact-reference/task-24-run-001/spec-quality-review.json \
  --session-token-out out/exact-reference/task-24-run-001/review-session/token \
  --review-freeze-out out/exact-reference/task-24-run-001/review/review-freeze.json \
  --host 127.0.0.1 \
  --port 0
```

Before listening, require Task 16 to verify the registry and enabled membership plus the exact current `SpecQualityReviewRecord`; readiness includes those digests/IDs and no domain-reviewer fallback. Then let Task 16 create the mode-0600 random token file. Capture the reported child PID and loopback port in supervisor memory, verify an unauthenticated request is rejected, and never record the token itself. Neither a human nor an agent may append to `visual-review.json` or an inspection file directly; the authenticated server is the only writer.

Dispatch independent visual agents by physical batch and pair. Each agent receives exactly one batch manifest and matching ignored evidence view, never mixed implementation ownership. For every case, it navigates all 30 width/background cells of every required PairResult and views Original, Candidate, Overlay, and Heatmap. Whole uses only `full`; `source-node-set` uses only `selected`; and `leave-one-out` repeats the complete process separately for `full` and `without-selected`, yielding eight distinct coordinate records/paths per width/background across those two results. Pair labels and routes remain separate even when image bytes/hashes are identical. Contact sheets do not mark cells viewed. After inspection, it calls only:

```bash
rtk mise exec -- pnpm cli conformance inspection append \
  --server http://127.0.0.1:<port> \
  --session-token-file out/exact-reference/task-24-run-001/review-session/token \
  --case <case-key> \
  --pair <full-or-selected-or-without-selected> \
  --status <matches-or-mismatch> \
  --note <case-specific-note> \
  --agent-run-id <unique-agent-run-id>
```

The CLI request contains no reviewer, time, HEAD, strict ID, or digest. The server derives and appends those values from the authenticated session, clock, current strict binding, and all 120 verified image digests for that PairResult. No implementation agent reviews its own batch.

- [ ] **Step 5: Stop Review, freeze it, then create trust and attestations.** After every required current pair has a server-authored `matches` record, stop only the captured PID and wait for its actual exit. Task 16's supervisor removes the token, proves the captured port closed, computes the final canonical regular-file review-tree digest excluding the not-yet-created freeze record and its temporary sibling, and exclusively writes `out/exact-reference/task-24-run-001/review/review-freeze.json`. Before any signing command, independently verify that the PID is not live, the token is absent, the port refuses connections, the freeze's strict/binding/evidence/tree digests match the same explicitly freeze-excluded tree, and a second tree hash is equal. Never use the browser-session freeze here.

Create a development-only technical signing identity without committing it:

Run:

```bash
rtk mise exec -- pnpm cli conformance trust init \
  --purpose development-technical \
  --out out/exact-reference/task-24-run-001/trust \
  --issuer local-exact-review \
  --key-id local-exact-review-2026 \
  --technical-reviewer-registry out/exact-reference/task-24-run-001/reviewers/technical-reviewers.json \
  --reviewer independent-agent-review \
  --valid-from 2026-09-04T00:00:00Z \
  --valid-until 2027-09-04T00:00:00Z
```

Expected: private key mode 0600, the schema-valid public store contains only public key/issuer/validity/revocation, sibling `local-trust-policy.json` marks it `development-technical`, all stay ignored, and Task 22's public release verifier demonstrably rejects this store/key.

Publish one all-or-nothing local technical attestation set:

Run:

```bash
rtk mise exec -- pnpm cli conformance attest \
  --strict-run out/exact-reference/task-24-run-001/strict-runs/current/strict-run.json \
  --review-root out/exact-reference/task-24-run-001/review \
  --technical-reviewer-registry out/exact-reference/task-24-run-001/reviewers/technical-reviewers.json \
  --trust-store out/exact-reference/task-24-run-001/trust/trust-store.json \
  --signing-key out/exact-reference/task-24-run-001/trust/local-exact-review-2026.pem \
  --issuer local-exact-review \
  --key-id local-exact-review-2026 \
  --attestation-dir out/exact-reference/task-24-run-001/attestations
```

Expected: the CLI preflights the complete expected case/pair set, writes all files to a fresh sibling temp directory, rereads and verifies every signature/binding, fsyncs, and atomically publishes the directory once. Any unreviewed/mismatch/stale pair or injected write failure leaves no new destination and no partial discoverable set.

- [ ] **Step 6: Run the complete final phase with every external input explicit.**

Run:

```bash
rtk mise exec -- pnpm verify:exact:final \
  --reference-root ../../taktische-zeichen \
  --strict-run out/exact-reference/task-24-run-001/strict-runs/current/strict-run.json \
  --review-binding out/exact-reference/task-24-run-001/strict-runs/current/review-binding.json \
  --review-root out/exact-reference/task-24-run-001/review \
  --technical-reviewer-registry out/exact-reference/task-24-run-001/reviewers/technical-reviewers.json \
  --reviewer independent-agent-review \
  --spec-quality-review out/exact-reference/task-24-run-001/spec-quality-review.json \
  --review-freeze out/exact-reference/task-24-run-001/review/review-freeze.json \
  --attestation-dir out/exact-reference/task-24-run-001/attestations \
  --trust-store out/exact-reference/task-24-run-001/trust/trust-store.json \
  --artifact-root out/exact-reference/task-24-run-001/artifacts \
  --artifact-manifest out/exact-reference/task-24-run-001/artifacts/artifact-set.json \
  --result-out out/exact-reference/task-24-run-001/final-result.json
```

Expected: PASS only when every scope-specific freshness check is current, including the three direct Reachable-/Reference-/derived-Pair-Ownership digest comparisons, the spec-quality record and browser summary verify, the Review server is dead/tokenless/closed, the review tree equals its frozen digest before and after all reads, every registry-derived required pair has a server-derived independent matching record and signed provenance, all explicit artifact/reference inputs reverify cleanly, claims are classified by output channel, and Git is clean except ignored local evidence/oracle inputs. The final result binds `specQualityReviewDigest`, `reviewFreezeDigest`, frozen review-tree digest, and every other verified input digest.

- [ ] **Step 7: Treat every failure as an immutable failed attempt and rerun the whole acceptance sequence.** A prepare/browser/server/inspection/freeze/trust/attestation/final failure, any visual mismatch, or any later Spec/Critical/Important review finding stops the captured server if one exists, preserves the complete attempt, and opens the next absent zero-padded run root. A fresh task-scoped fixer and fresh specification/quality reviewers address source findings. The new attempt must rerun registry creation, prepare, independent spec+quality PASS and record, all three browsers, a new Review server, **all cells/images of every required pair for every case** (not merely affected cases), shutdown/freeze, trust creation, all-or-nothing attestations, and final. No file, inspection, trust material, attestation, browser result, freeze, or digest is copied forward; no failed attempt is overwritten.

- [ ] **Step 8: Run one final independent audit, then keep public release closed.** A fresh highest-capability reviewer audits the successful attempt, full branch diff, amended specification, and all three plans and explicitly reports 661/661 assets, 544/544 displays, 525/19 split, all 413 component keys and every total reference pair, exact equality of the public partition with the Reachable set, the disjoint 151 reference-only and 15 direct-carrier rows, direct freshness of all three Reachable-/Reference-/derived-Pair-Ownership digests across strict record and attestations, finalized-registry required pairs including both leave-one-out results, every mandatory raster cell, every artifact class/claim, exactly one Resvg owner, all three browsers, spec-quality digest, and post-shutdown freeze digest. Any Spec/Critical/Important finding invalidates the attempt and returns to Step 7; the audit never edits a record in place. Technical completion and the local development key do not create `PublicReleaseAuthorization/v1`. Do not invoke candidate publishing until Task 22 has a final versioned candidate commit, exact immutable `.tgz` digests, independently controlled technical and authorization trust roots/key allowlists, current domain-review digest, and an accountable signature covering Geometry/Paint IR, embedded fonts, reference-design similarity, commit, expiry, workflow/toolchain, evidence, and artifact digests.

## Execution dependency graph

```text
Foundation Tasks 1–26 -> Integration Task 0 -> Corpus Tasks 1–94
Corpus Task 94 -> Integration Task 1 -> Task 2 -> Task 3
Task 3 -> Task 4 -> Tasks 5, 6, 7, 8
Tasks 3, 4 -> Task 9 -> Task 10 -> Task 11
Corpus complete + Tasks 3, 9 -> Task 12 -> Task 13 -> Task 14
Tasks 3, 14 -> Task 15 -> Task 16 -> Task 17
Tasks 5, 6, 7, 8, 9, 10, 11, 15, 16, 17 -> Task 18
Tasks 6, 8, 11, 19 -> Task 20
Tasks 0, 9, 13, 14, 16, 20 -> Task 21
Tasks 12, 14, 18, 19, 20, 21 -> Task 22
Integration Tasks 1–22 -> Task 23 -> Task 24 -> Corpus Task 95
```

The cross-plan execution order is therefore exactly and gaplessly `Foundation 1–26 -> Integration 0 -> Corpus 1–94 -> Integration 1–24 -> Corpus 95`. No Corpus preparation task precedes Integration Task 0, and Task 24 is technical local acceptance rather than the final cross-plan review owned by Corpus Task 95.

Although several arrows are independent, implementation agents remain sequential under subagent-driven development; parallelism is reserved for read-only exploration and the final disjoint visual-review batches. Every implementation task receives its own two fresh reviewers before the next writer starts.
