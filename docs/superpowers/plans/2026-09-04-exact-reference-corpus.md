# Exact Reference Corpus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`)
> syntax for tracking. Vor jedem schreibenden Task zusätzlich
> `superpowers:test-driven-development`, vor jeder Abschlussbehauptung
> `superpowers:verification-before-completion` verwenden.

**Ziel:** Sämtliche 661 versionierten Orakelassets, alle 544 bestehenden Displays und die totale
`ReferenceComponentContextSet/v1`-Fassung aller 413 Paint-Komponenten als committed, self-contained
`ReferenceExactIR` rekonstruieren, ohne Original-SVG/XML oder lokale Rasterartefakte zu
veröffentlichen, und jeden einzelnen Asset-, Display- und Component-Case vektoriell sowie als
dekodiertes RGBA mit Null-Diff abnehmen.

**Architektur:** Der Korpus wird in exakt 90 disjunkte `ExactBatchModule`s mit höchstens zwölf
vollständigen Assets und höchstens einer echten Paint-Komponentenfamilie pro Modul zerlegt.
Jedes Modul besitzt ausschließlich die sechs festen Dateien `manifest.ts`, `components.ts`,
`assets.ts`, `parts.ts`, `plans.ts` und `cases.test.ts`. Komponenten werden aus isolierten,
digestgebundenen Orakelteilen aufgebaut; Ganzzeichen entstehen ausschließlich aus ihren
geordneten `CompositionPlan`s. Nur ein gesonderter Root-Integrator darf den zentralen Aggregator
ändern. Originale, Kandidatengenerator-Ausgaben, Vergleichsbilder und Reviewprotokolle bleiben
unter `taktische-zeichen/` beziehungsweise `out/exact-reference/` lokal und gitignored.

**Tech Stack:** TypeScript 5.9, Vitest 4.1, pnpm 11.20, Node/tsx, `@resvg/resvg-js` exakt 2.6.2,
kanonische `ReferenceExactIR`, `NormalizedPaintList/v1`, RFC-8785-JCS und SHA-256.

**Spec:** `docs/superpowers/specs/2026-09-04-exact-reference-parity-design.md`

**Abhängige Pläne:**

- `docs/superpowers/plans/2026-09-04-exact-reference-foundation.md` muss vor Integration Task 0
  vollständig
  grün sein. Es stellt IR, das volle committed `OracleManifest`, Abschnittsparser/Comparator,
  Renderer, den 413er `PAINT_COMPONENT_REGISTRY`, `REFERENCE_COMPONENT_CONTEXT_SET`,
  `REACHABLE_BUILDER_CONTEXT_SET`,
  `COMPOSITION_CONTRACT_REGISTRY`, Batchvertrag, Descriptor-Auflösung, den strikt allowlisteten
  Staging-Loader sowie ausschließlich die gefilterten Befehle `conformance:inspect` und
  `conformance:batch` bereit. Ein ungefilterter Strict-Runner gehört ausdrücklich nicht zur
  Foundation.
- Die einzige zulässige Ausführungs-DAG lautet:

  ```text
  Foundation vollständig
    -> Integration Task 0
    -> Corpus Tasks 1–94
    -> Integration Tasks 1–24
    -> Corpus Task 95
  ```

  Integration Task 0 liefert `conformance:review` und das frühe staged-/HEAD-Source-Leak-Gate.
  Kein Corpus-Task startet davor. Integration Tasks 1–24 konsumieren erst den in Corpus Task 94
  vollständig ersetzten Root-Aggregator und liefern unter anderem den ungefilterten Strict-Runner
  sowie das vollständige Paket-/Website-/QGIS-/Release-Artefakt-Gate für Corpus Task 95.

## 1. Harte Grenzen

- Die 661 Originaldateien sind ausschließlich lokaler Testorakelbestand. Kein Agent committed
  SVG/XML, XML-Kommentare, Original-PNGs, Overlays, Heatmaps, Generatorartefakte oder absolute
  lokale Orakelpfade.
- Jeder sichtbare Quell-Paint-Record wird untersucht. Eine vermeintliche Ähnlichkeit, ein
  Dateiname oder ein bestehender Snapshot ist kein Wiederverwendungsbeleg.
- Committed Pfade enthalten nur absolute, explizite `M`, `L`, `C`, `Z`; Zahlen sind kanonische
  Dezimalstrings; Rechtecke und Kreise bleiben verlustfrei; Transformfolgen bleiben geordnet und
  typisiert. Es gibt keine opaque SVG- oder Pfadquelle neben der IR.
- Der Strict-Lauf revalidiert den eingefrorenen Featurevertrag: 2.336 Gruppen, 965 Rechtecke,
  2.155 Pfade in 601 Dateien, 124 Polygone, 102 Kreise, vier Polylinien, 55 Transformationen in
  53 Dateien und genau die fünf ViewBox-Familien 32×32, 48×32, 36×32, 32×46 und 80×32. Jede
  Abweichung ist ein Corpus-Feature-Fehler, kein stiller Import.
- Der Exact-Paint-`FontSet` ist kanonisch leer. Feste Originalbeschriftung besteht aus exakten
  Konturen; A11y-/Titel-/Beschreibungstext bleibt außerhalb der Paint-Liste. Systemfonts und
  externe Ressourcen sind verboten.
- Jedes Asset gehört genau einem der 90 Shards. Ein fremder Shard darf es lesen, aber weder seine
  `ExactAssetFixture` noch seinen `AssetCase` erneut besitzen.
- Eine Component-Fixture gehört genau einem Shard. Die Fixture-/Case-/Witness-Union deckt die
  totale `ReferenceComponentContextSet/v1`-Paarmenge ab. Deren `public-builder`-Paarzahl ist
  dynamisch exakt `REACHABLE_BUILDER_CONTEXT_SET.pairs.length`; nur ihre eindeutige
  Component-Key-Projektion ist fest 247. Hinzu kommen exakt 151 `reference-only`- und 15
  `direct-carrier`-Reihen, je genau eine pro nichtöffentlichem Component-Key. Ein späterer Shard darf nur eine bereits frisch geprüfte Fixture lesen.
  `reference-only`/`direct-carrier` werden nie Builder-erreichbar; unbekannte Kontexte schlagen fail-closed fehl.
- Assetspezifische Leaves sind nur nach globaler Reuse-Fingerprint-Prüfung zulässig: kein Match zu
  einem der 413 Component-Keys und Häufigkeit exakt eins im gemeinsamen Part-Frame.
- Jeder Whole-/Part-Case vergleicht zuerst `NormalizedPaintList/v1`, danach die zehn Breiten
  16/24/32/48/64/128/256/512/2048/4096 auf transparentem, schwarzem und weißem Hintergrund.
  Zulässig sind ausschließlich `differentPixelCount = 0`, `maxChannelDelta = 0`,
  `alphaDeltaCount = 0` und identische Bounds.
- Der menschliche Visual-Review ist keine Stichprobe. Für jeden einzelnen Case-Key werden
  Original, Kandidat, Overlay und Heatmap geöffnet; bei Parts zusätzlich der aufgelöste Frame,
  die Maske und bei `leave-one-out` beide Vergleichspaare.
- Ein Implementierungs-Agent darf weder seinen eigenen Code reviewen noch eine Attestation
  ausstellen. Ein Review-Agent darf keine Source-Datei verändern. Korrekturen übernimmt ein
  neuer, frischer Fix-Agent.
- Nie laufen zwei schreibende Implementierungs-/Fix-Agenten gleichzeitig. Read-only Discovery-
  und Review-Agenten dürfen parallel laufen. Kein Subagent darf weitere Subagents erzeugen.
- Jeder Implementierungs-, Fix- und Review-Agent wird frisch mit `fork_turns: "none"`, explizit
  `model: "gpt-5.6-sol"` und mindestens `reasoning_effort: "high"` gestartet. Der Root liefert
  Spec-, Task-Brief- und Evidence-Pfade statt unkontrollierter Gesprächshistorie.
- Bestehende fremde Änderungen werden nicht gestaged, verändert oder reverted.
- Alle Befehle mit `--reference-root ../../taktische-zeichen` laufen vom vorgeschriebenen
  Worktree-Root `.worktrees/exact-reference-parity`. Von dort zeigt dieser relative Pfad auf den
  gitignorierten Orakelbestand im Hauptcheckout; er wird nicht in einen absoluten Maschinenpfad
  umgeschrieben oder in Source/Evidence persistiert.

<!-- CORPUS-BRIEF-REALPATH:START -->

Vor Integration Task 0 und erneut vor Task 1 führt der Root-Orchestrator aus genau diesem
Worktree-Root folgenden echten Realpath-Smoke aus. Er prüft Arbeitsverzeichnis, Worktree-Suffix,
Existenz und reale Auflösung des relativen Orakelroots, gibt aber keinen aufgelösten Pfad aus:

```bash
rtk node --input-type=module -e "import { realpathSync, statSync } from 'node:fs'; import { resolve } from 'node:path'; const cwd=realpathSync('.'); if (!cwd.endsWith('/.worktrees/exact-reference-parity')) throw new Error('WRONG_EXACT_WORKTREE'); const oracle=realpathSync(resolve(cwd,'../../taktische-zeichen')); if (!statSync(oracle).isDirectory()) throw new Error('ORACLE_UNAVAILABLE'); console.log('exact worktree/reference-root smoke: ok')"
```

Expected: exakt `exact worktree/reference-root smoke: ok`; ein anderer Checkout, ein fehlender
Root oder eine nicht auflösbare Eingabe bricht vor Source-Scan, Discovery oder Rendering ab.

<!-- CORPUS-BRIEF-REALPATH:END -->

---

## 2. Foundation-Vertrag, den dieser Plan konsumiert

Diese Namen sind zwischen Foundation- und Korpusplan fest. Eine Abweichung wird vor dem ersten
Batch als Planfehler behoben, nicht in 90 Shards individuell umgangen.

- `packages/catalog/src/exact/batch-contract.ts` exportiert
  `ExactBatchDescriptor`, `ExactBatchManifest`, `ExactBatchModule`,
  `ExactCatalogRegistry`, `ExactBatchKeyOwnerIndex`,
  `defineExactBatchManifest(manifest): ExactBatchManifest`,
  `assertExactBatchContract(batch): void` und
  `resolveCorpusShard(descriptor: ExactBatchDescriptor, oracleManifest: OracleManifest): OracleManifest`
  sowie den kanonischen, nicht-localeabhängigen UTF-16-/Code-Unit-Komparator
  `compareExactBatchId(left: ExactBatchId, right: ExactBatchId): number`,
  `buildExactBatchKeyOwnerIndex(modules)`, `registerExactBatchModules(modules)`,
  `batchOwnedRelationTargets(current): readonly ExactBatchRelationTarget[]` und
  `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets): readonly ExactBatchId[]`.
  `buildExactBatchKeyOwnerIndex(modules)` dient nur der nachgelagerten Registry-/Boundaryprüfung
  einer bereits bestimmten Closure und niemals der Dependencyableitung.
  Der Resolver selektiert ausschließlich Metadaten aus dem vollständigen committed Manifest. Er
  importiert weder `EXACT_BATCH_MODULES` noch `EXACT_CATALOG_REGISTRY`, den Staging-Loader oder ein
  bereits implementiertes Batchmodul.
- `packages/catalog/src/exact/batch-staging-registry.ts` exportiert
  `STAGED_EXACT_BATCH_DESCRIPTORS`,
  `stagedExactBatchDescriptor(id: ExactBatchId): ExactBatchDescriptor`,
  `buildStagedExactBatchOwnershipIndex(descriptors): StagedExactBatchOwnershipIndex`,
  `resolveStagedBatchDependencyOrder(id: ExactBatchId, descriptors: readonly ExactBatchDescriptor[]): readonly ExactBatchDescriptor[]`,
  `loadStagedExactBatchClosure(id: ExactBatchId): Promise<LoadedExactBatchClosure>` und
  `assertStagedBatchBoundary(descriptor, batch): void`. Seine Root-owned Loader-Allowlist kennt
  ausschließlich die 90 literal IDs dieses Plans und lädt pro ID nur die fünf Datendateien des
  festgelegten Sechs-Datei-Verzeichnisses; es gibt keinen Glob, Verzeichnisscan oder Rückgriff auf
  den finalen Aggregator. Jeder Descriptor besitzt
  `readonlyDependencies: readonly ExactBatchId[]`. Vor jeder Dependency-Auflösung und jedem
  Modulimport baut der Loader aus den vollständigen `ownedKeys`-/`setDigests`-Feldern **aller 90**
  staged Descriptoren einen validierten `StagedExactBatchOwnershipIndex`. Erst danach löst er die IDs gegen die
  committed Allowlist auf und liefert sämtliche transitiven Dependency-Module in stabiler
  topologischer Reihenfolge, gefolgt vom aktuellen Modul. Die daraus materialisierte Registry ist
  read-only; freie topologische Ties sowie jede kanonische direkte Dependencyfolge werden mit
  `compareExactBatchId` geordnet. `cases.test.ts` wird ausgeführt, aber nie als Datenmodul importiert.
- Jeder Batch exportiert exakt `BATCH_MANIFEST`, `BATCH_COMPONENTS`, `BATCH_ASSETS`,
  `BATCH_PARTS`, `BATCH_PLANS`.
- `BATCH_MANIFEST` führt jede gespeicherte Collection unter `ownedKeys` und `setDigests`.
  Zusätzlich enthält es die erwarteten `compositionTraces`- und `useEdges`-Keysets samt Digest;
  diese beiden Mengen werden ausschließlich aus Plans/Displayprojektionen materialisiert und
  sind keine Shard-Collections.
- `ExactBatchComponents` und damit `BATCH_COMPONENTS` enthält exakt `fragments`, `variants`,
  `fixtures`, `componentCases`, `compositionContracts`, `contractCases` und
  `compositionWitnessEdges`.
  Contract-, ContractCase- und Witness-Keys verwenden ausschließlich die gebrandeten
  Foundation-Typen `CompositionContractKey`, `CompositionContractCaseKey` und
  `CompositionWitnessEdgeKey`; ungebрандete `string`-Ersatztypen sind unzulässig.
  `ExactBatchAssets` und damit `BATCH_ASSETS` enthält exakt `assetFragments`,
  `oracleFeatureContracts`, `exactAssets`, `displayFixtures`, `assetCases`, `displayCases` und
  `recipeExactAssetLinks`; jeder Recipe-Link hat die Form
  `{ readonly recipe: RecipeKey; readonly exactAsset: ExactAssetKey }`.
  `ExactBatchParts` und damit `BATCH_PARTS` enthält exakt `oracleParts`, `comparisonProfiles`,
  `maskContracts` und `ownershipEntries`. `ExactBatchPlans` und damit `BATCH_PLANS` enthält
  ausschließlich `plans: readonly CompositionPlan[]`. `CompositionTrace`s und `UseEdge`s werden
  beim Materialisieren aus diesen Plänen abgeleitet und dürfen in keinem Shard handgeschrieben
  oder unter `BATCH_PLANS` gespeichert werden.
- Der kanonische Foundation-Container speichert jeden `ComponentCase` in
  `BATCH_COMPONENTS.componentCases`; `ExactBatchOwnedKeys.componentCases` und der zugehörige
  Setdigest manifestieren diese Collection. Für jeden eigenen `ExactComponentFixture` existiert
  genau ein eigener `ComponentCase`; dessen `componentFixture` zeigt auf genau diese Fixture und
  seine `ExactCaseDigestBinding` bindet Fixture-/Plan-/Geometry-/Paint-/OwnedPaint-/Trace-/Part-/
  Profile-/Mask-/Transform-Digests. Die closure-weite Registry prüft
  `set(componentCases.componentFixture) === set(componentFixtures.key)` und legt die Cases in
  `ExactCatalogRegistry.componentCases` ab. `ExactCatalogRegistry.conformanceCases` ist die
  einzige kanonisch sortierte, duplikatfreie Union aus Asset-, Display- und ComponentCases und
  damit die alleinige Quelle des späteren `CONFORMANCE_CASES`-Exports. Dependency-Cases sind nur
  Registryinput der Closure und dürfen nie in Current-Results, -Evidence oder -Case-Keysets
  erscheinen.
- `REFERENCE_COMPONENT_CONTEXT_SET` ist der totale, versionierte
  `ReferenceComponentContextSetV1`-Vertrag mit `version`, der totalen access-diskriminierten
  `.pairs`-Folge und `componentContextSetDigestInput`. Seine `public-builder`-Paarprojektion ist
  exakt mengengleich `REACHABLE_BUILDER_CONTEXT_SET.pairs`; deren Paarzahl ist nicht als 247
  festgeschrieben, nur ihre eindeutige Component-Key-Projektion. Hinzu kommen exakt 151
  `reference-only`-Reihen für
  `states`/`comms`/`damage`/`wildfire` und 15 `direct-carrier`-Paaren für
  `leadership`/`water-rescue-personnel`, je genau eine literal Reihe pro zugehörigem Key. Die
  eindeutige Component-Key-Projektion der totalen Pairmenge ist exakt die 413er Registry; eine
  feste Total-Paarzahl 413 existiert nicht. Jede totale Paarung besitzt genau eine Fixture, einen
  `ComponentCase`, einen `OraclePart`-Zeugen und den vollständigen Contract-/Witness-Nachweis.
  Ausschließlich die `public-builder`-Paare dürfen durch die öffentliche
  `SymbolSpec`-/Builder-Auflösung erreicht werden; `reference-only` und `direct-carrier` sind renderbare
  Referenzfixtures, aber keine Builderoptionen. Pair-Ownership ist weder Feld dieses Sets noch
  eine 22. Batchcollection: Sie wird aus der Pair↔ComponentFixture-Bijektion und dem bereits
  manifestierten Descriptor-/Manifest-Owner der Fixture abgeleitet. SHA-256 über die kanonisch
  nach `(component,context,fixture,owner)` sortierte Folge liefert ausschließlich den
  Freshness-Wert `referenceComponentContextOwnershipDigest`. Foundation exportiert dafür exakt
  `ReferenceComponentContextOwnershipRecord`, `ReferenceComponentContextOwnershipV1` und
  `deriveReferenceComponentContextOwnership(referenceSet, componentFixtures, ownerIndex)`; das
  Resultat hat ausschließlich `{ version, records, digestInput }`.
- Bei einem Descriptor mit `componentFamily: null` sind alle sieben Collections in
  `BATCH_COMPONENTS` semantisch leer. Ein einmaliges, assetspezifisches IR-Fragment lebt
  ausschließlich in `BATCH_ASSETS.assetFragments`; jeder seiner Paint-Records bleibt durch
  `BATCH_PARTS.ownershipEntries` und `ORACLE_OWNERSHIP_MANIFEST` einzeln gegatet. `family: null`
  bedeutet weder owner-frei noch ungeprüft.
- `packages/cli/src/conformance/batch-conformance.ts` stellt den lokalen Vergleich bereit.
  Der Development-Aufruf lautet:

  ```bash
  rtk pnpm cli conformance:batch --batch <batch-id> --batch-source staged \
    --reference-root ../../taktische-zeichen \
    --evidence-out out/exact-reference/<batch-id>
  ```

  `<batch-id>` wird bei der konkreten Ausführung literal durch die Tabellen-ID ersetzt. Vor
  Corpus Task 94 lädt das Tool über `loadStagedExactBatchClosure(<batch-id>)` ausschließlich die
  committed Dependency-Closure plus das durch die Root-Allowlist benannte aktuelle staged Modul,
  niemals den noch unvollständigen finalen Aggregator. Dependency-Module werden nur in eine
  read-only Materialisierungsregistry aufgenommen; ausgeführt und in `matrix.json` sowie den vier
  lokalen PNG-Arten je Größe/Hintergrund geschrieben werden ausschließlich Cases und Ergebnisse
  des aktuellen Batchs. Dieser gefilterte Befehl ist nur ein Development-Gate und darf keinen
  Strict-Pass, kein Approval und keine Attestation erzeugen.
- Foundation stellt außerdem den ausschließlich lesenden Discovery-Aufruf bereit:

  ```bash
  rtk pnpm cli conformance:inspect --batch <batch-id> \
    --reference-root ../../taktische-zeichen \
    --out out/exact-reference/discovery/<batch-id>/measurement.json
  ```

  Die Batch-ID wird zuerst zu genau einem committed `CorpusShardDescriptor` aufgelöst, der an der
  Foundation-Grenze als `ExactBatchDescriptor` konsumiert wird; `conformance:inspect` übergibt
  diesen Descriptor an `resolveCorpusShard` und benötigt weder ein
  Batchmodul noch Staging- oder Root-Aggregator. Es schreibt alle sichtbaren und non-painting
  Records mit kanonischer Geometrie, Transformfolgen, Bounds, OraclePaintNodeIds und Digests; es
  erzeugt weder TypeScript noch
  Source-Änderung, Attestation oder Approval.
- Der Review-Bootstrap stellt bereit:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch <batch-id> --batch-source staged \
    --reference-root ../../taktische-zeichen \
    --out out/exact-reference/review/<batch-id>
  ```

  Vor Task 94 lädt auch dieser Befehl ausschließlich die committed, allowlistete Dependency-
  Closure plus das aktuelle staged Modul. Dependency-Registries bleiben read-only; Bilder,
  `visual-review.json`, Reviewbefunde und Statusprojektionen betreffen ausschließlich die Cases
  des aktuellen Batchs.
  Sein zwingender gemeinsamer Vorlauf `verifyRepositorySourceBoundary(...)` prüft den HEAD-Tree
  und sämtliche staged Blobs auf echte Leaks: bytegleiche Oracle-SHA-256-Treffer, eingebettete
  Original-XML samt Generator-/Illustrator-Markern, Quellkommentaren oder Orakel-Namespaces,
  Oracle-/Evidence-Pfade und lokale Raster-/Diffartefakte. Beabsichtigte, unabhängig erzeugte und
  bereits getrackte Produkt-SVGs/-PNGs bleiben zulässig; eine bloße SVG-/PNG-Signatur im
  Repository ist kein Leak. Im staged Batchmodus erzwingt
  `verifyStagedBatchBoundary(...)` zusätzlich Descriptor, Traversal-/Symlinkschutz, exakt die
  sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Für diese sechs TypeScript-Blobs gilt
  zusätzlich fail-closed: rohe `<svg`-/XML-Syntax, PNG-Magic-Bytes, `data:image/...;base64` und
  bekannte SVG-/PNG-Base64präfixe sind unabhängig von einem Digesttreffer verboten. Erst danach
  erzeugt er pro Case die adressierbaren Bild-Keys `original`, `candidate`, `overlay`, `heatmap`
  und ein lokales `visual-review.json`. Auch dieses Werkzeug setzt niemals einen Status.
- Der einzige vollständige technische Orakellauf bleibt ungefiltert:

  ```bash
  rtk mise exec -- pnpm cli conformance verify --strict --reference-root ../../taktische-zeichen
  ```

## 3. Ziel-Dateisurface

### Root-only, nie durch einen Batch-Worker zu verändern

- Create: `packages/catalog/src/exact/corpus-shards.ts`
- Create: `packages/catalog/src/exact/corpus-shards.test.ts`
- Modify: `packages/catalog/src/exact/batch-staging-registry.ts`
- Create: `packages/catalog/src/exact/component-allocation.ts`
- Create: `packages/catalog/src/exact/component-allocation.test.ts`
- Modify: `packages/catalog/src/exact/corpus-shards.ts`
- Modify: `packages/catalog/src/exact/corpus-shards.test.ts`
- Modify: `packages/catalog/src/exact/batch-staging-registry.ts`
- Modify: `packages/catalog/src/exact/oracle-ownership-manifest.ts`
- Modify: `packages/catalog/src/exact/oracle-ownership-manifest.test.ts`
- Create: `scripts/exact/build-corpus-brief.mjs`
- Create: `scripts/exact/build-corpus-brief.test.mjs`
- Modify: `packages/catalog/src/exact/batches/index.ts`
- Modify: `packages/catalog/src/exact/batches/index.test.ts`

### Exklusiv pro Batch-Worker

Für jede Tabellen-ID `<id>` exakt:

- Create: `packages/catalog/src/exact/batches/<id>/manifest.ts`
- Create: `packages/catalog/src/exact/batches/<id>/components.ts`
- Create: `packages/catalog/src/exact/batches/<id>/assets.ts`
- Create: `packages/catalog/src/exact/batches/<id>/parts.ts`
- Create: `packages/catalog/src/exact/batches/<id>/plans.ts`
- Create: `packages/catalog/src/exact/batches/<id>/cases.test.ts`

Leere Datenbereiche exportieren explizit die eingefrorene leere Menge; Dateien werden weder
weggelassen noch durch Re-Exports aus fremden Batches ersetzt.

### Ausschließlich lokale, ignorierte Evidence

- `out/exact-reference/discovery/<id>/measurement.json`
- `out/exact-reference/discovery/<id>/candidate-ir/`
- `out/exact-reference/discovery/<id>/review.json`
- `out/exact-reference/brief-inputs/<id>/{descriptor,dependencies}.json`
- `.superpowers/sdd/exact-reference-corpus/task-<n>-<id>-brief.md`
- `out/exact-reference/<id>/matrix.json` und die vier Bildarten je Matrixzelle
- `out/exact-reference/review/<id>/visual-review.json`
- `out/exact-reference/review/<id>/visual-inspection.json`
- `out/exact-reference/task-95-run-<NNN>/spec-quality-review.json`
- `out/exact-reference/task-95-run-<NNN>/spec-quality-findings.json` ausschließlich bei Befund
- `out/exact-reference/task-95-run-<NNN>/browser/{summary.json,shutdown-freeze.json}`
- `out/exact-reference/task-95-run-<NNN>/review/review-freeze.json`

## Globaler Schreibprompt ausschließlich für Batch-Tasks 4–93

<!-- CORPUS-BRIEF-WRITER:START -->

Dieser Prompt steht bewusst vor Task 1 und gehört ausschließlich zu den 90 schreibenden
Batch-Tasks 4–93. Ausschließlich `scripts/exact/build-corpus-brief.mjs` liest diesen verankerten
Abschnitt, bindet ihn an genau einen literal Batch und expandiert ihn. Der installierte generische
`task-brief` kann weder Abschnitte voranstellen noch Werte expandieren. Er darf deshalb nur für
die nach realer Extraktion als selbständig geprüften Tasks 2, 3 und 94 verwendet werden. Task 1
erhält einen Root-bootstrappten, später bytegleich durch den Builder reproduzierten Brief;
Task 95 einschließlich Attempt `001` und aller Retries erhält ausschließlich den spezialisierten
Builderbrief. Für Tasks 1, 4–93 und 95 ist der installierte generische `task-brief` verboten.

```text
Du bist der einzige schreibende Implementierungs-Agent für ExactBatch <id>. Du bist nicht allein
im Repository. Besitze ausschließlich:
packages/catalog/src/exact/batches/<id>/{manifest,components,assets,parts,plans,cases.test}.ts.
Verändere, stage oder reverte keine andere Datei. Spawne keine Subagents.

Konsumiere den genehmigten Exact-Reference-Designvertrag, den Foundation-Vertrag, den committed
Corpus-Descriptor einschließlich seiner literal Batch-ID-`readonlyDependencies`, die committed
ComponentAllocation und die geprüften lokalen Discovery-Berichte. Löse die Dependency-Closure
erst, nachdem `buildStagedExactBatchOwnershipIndex(STAGED_EXACT_BATCH_DESCRIPTORS)` aus den
vollständigen `ownedKeys`/`setDigests` **aller 90** Descriptoren den globalen Full-Owner-Index
vor jedem Modulimport validiert hat. Lade dann über `loadStagedExactBatchClosure(<id>)`;
materialisiere Dependency-Module nur in einer read-only Registry und führe ausschließlich die
Cases des aktuellen Moduls aus. Prüfe die direkte Owner-Menge ausschließlich als
`directForeignExactBatchOwners(current, fullOwnerIndex, batchOwnedRelationTargets(current))`
über alle `EXACT_BATCH_RELATIONS`; verenge sie nie auf die geladene Closure, ComponentFixture-
oder Planreferenzen.
Arbeite strikt TDD: typsichere leere Schalen, beobachtetes funktionales RED, minimale vollständige
IR-Implementierung, GREEN. Rekonstruiere jedes eigene Asset und jedes besessene Part Node für Node;
keine opaque SVG/XML-Quelle, keine Näherung, kein generischer Fallback, kein ausgelassenes Zeichen.
Halte einmalige IR ausschließlich in BATCH_ASSETS.assetFragments, Recipe-Zuordnung ausschließlich
in BATCH_ASSETS.recipeExactAssetLinks, Ownership/Profile ausschließlich in BATCH_PARTS und nur
CompositionPlans in BATCH_PLANS.plans; Trace/UseEdges werden materialisiert. Bei family null sind
alle sieben BATCH_COMPONENTS-Collections semantisch leer, jeder assetspezifische Owner bleibt
gegatet. Implementiere jede dir zugeteilte totale `(component, context)`-Fixture samt genau einem
ComponentCase, OraclePart-Referenzzeugen und vollständigem Contract-/Witness-Nachweis. Nur ihre
als `public-builder` klassifizierte, exakt `REACHABLE_BUILDER_CONTEXT_SET.pairs` entsprechende
Teilmenge darf durch den Builder auflösbar sein; 247 ist ausschließlich deren eindeutige
Component-Key-Projektion, nicht ihre Paarzahl.
`reference-only` und `direct-carrier` bleiben ausschließlich Referenzfixtures.
Führe ausschließlich das aktuelle cases.test.ts als Batch-Case-Suite sowie corpus-shards.test.ts,
component-allocation.test.ts, typecheck und diff-check aus. Stage dann nur die sechs eigenen
Dateien. Führe conformance:batch mit
--batch-source staged und allen Größen/Hintergründen sowie danach den literal
conformance:review --batch <id> --batch-source staged aus; dessen
verifyRepositorySourceBoundary-Vorlauf muss HEAD und staged Blobs ohne Leak bestätigen, danach
muss verifyStagedBatchBoundary die Sechs-Datei-/Blobgleichheit des aktuellen Batchs bestätigen.
Dependency-Dateien bleiben committed und read-only. Committe erst danach und nur die sechs
geprüften Dateien.
Berichte Commit, exakte Keymengen, RED-Ursache, GREEN-Ausgaben, Matrix-Summen und offene Risiken.
Ein Null-Diff ersetzt nicht dein vollständiges Node-/Owner-/Contract-Review.
```

<!-- CORPUS-BRIEF-WRITER:END -->

<!-- CORPUS-BRIEF-CONTRACT:START -->

### Zwingende DAG-Vorbedingung: Integration Task 0 vor Corpus Task 1

Unmittelbar nach Foundation und vor Corpus Task 1 wird ausschließlich Integration Task 0
ausgeführt. Er
liefert `verifyRepositorySourceBoundary(...)`, `verifyStagedBatchBoundary(...)` sowie die
CLI-Quelle `--batch-source staged` für `conformance:review`. Der Repository-Check scannt jeden
HEAD-Blob und beliebige staged Blobs. Der zusätzliche Batch-Check liest die committed
Descriptor-Allowlist, verlangt bei Tasks 4–93 eine staged Menge aus exakt den sechs Owned-Dateien
des literal Batches und belegt Worktree-/Index-Blobgleichheit. Zusammen weisen sie
Original-SHA-256-Treffer, eingebettete Original-XML-/Generator-/Kommentar-/Namespace-Daten,
Oracle-/Evidence-Pfade, lokale Raster-/Overlay-/Heatmap-/Diffartefakte, Traversal/Symlinks und
jede fremde staged Datei ab. Der Repositoryscanner lässt beabsichtigte getrackte Produkt-SVGs und
-PNGs zu; erst die sechs staged Batch-TypeScript-Dateien werden zusätzlich strikt auf rohe
`<svg`-/XML-Syntax, PNG-Magic und SVG-/PNG-Base64 geprüft.
Ihre Reports bleiben ausschließlich unter `out/exact-reference/`; sie erzeugen keine Approval-
oder Attestation-Aussage.

Dieser frühe Source-Grenzcheck ist der einzige staged-/HEAD-Scanner vor der vollständigen
Integration. Foundation dupliziert ihn nicht. Corpus Tasks 1 und 3 verwenden seinen Root-/All-
Pfad für ihre staged Vertragsdateien; Tasks 4–93 verwenden zusätzlich die Sechs-Datei-Grenze.
Der umfassende Scan entpackter Package-, Website-, QGIS- und Release-Artefakte bleibt Integration
Tasks 19–24 vorbehalten. Corpus Tasks 4–93 müssen
den literal Review-Befehl nach dem Staging und vor jedem Implementierungs- oder Fix-Commit
ausführen; Task 94 und Task 95 wiederholen die Root-Registry-/All-Variante.

## 7. Verbindliche 90-Shard-Matrix

### Selector-Semantik

- `range(A.B.x–A.B.y)` nimmt alle OracleManifest-Dateien, deren mit `sectionOfAsset`
  normalisierte Abschnittsnummer numerisch im geschlossenen Bereich liegt; Primär- und
  Alternativdateien desselben Abschnitts bleiben enthalten.
- `set(...)` nimmt genau die genannten Abschnitte und ebenfalls alle zugehörigen Varianten. Eine
  darin notierte Spanne wie `N.1.1–N.1.6` wird in
  `CorpusShardDescriptor.selector.sections` literal zu
  `N.1.1`, `N.1.2`, `N.1.3`, `N.1.4`, `N.1.5`, `N.1.6` ausgeschrieben; die committed Daten
  enthalten keine unaufgelöste Spannenzeichenfolge.
- `prefix(P)` nimmt exakt die vorhandenen Dateien mit diesem Abschnittspräfix.
- `prefix(P)[a..b)` sortiert diese echte Präfixmenge zuerst mit dem OracleManifest-Comparator und
  nimmt danach den bezeichneten halboffenen Slice. Das ist bei `5.8.8` nötig, weil Abschnitt
  `5.8.8.6` zwei Varianten besitzt und ein reiner Nummernbereich sonst 13 statt zwölf Dateien
  enthielte.
- `non-example(P)[0..n)` filtert zuerst alle `Beispiel`-Dateien aus, sortiert danach mit dem
  OracleManifest-Comparator und nimmt den bezeichneten Halboffen-Slice.
- `examples(P)` nimmt ausschließlich die echten Beispieldateien des Präfixes.
- `asset(name)` nimmt den literal im OracleManifest vorhandenen Dateinamen.
- `Family` bezeichnet die einzige Komponentenfamilie, die der Shard laut Allocation besitzen
  darf. `—` bedeutet: alle sieben Collections von `BATCH_COMPONENTS` sind explizit leer. Der
  Shard konsumiert bei Bedarf nur bereits akzeptierte Fixtures; seine einzigartige Geometrie
  liegt in `BATCH_ASSETS.assetFragments`, ihre Ownership-/Profileinträge liegen ausschließlich in
  `BATCH_PARTS`, und jeder assetspezifische Owner bleibt durch das globale Ownership-Manifest
  gegatet.

| # | Batch-ID | exakter Selector | Assets | einzige erlaubte Family |
|---:|---|---|---:|---|
| 1 | `a-1-base-01` | `range(1.1–1.6)` | 6 | `kind` |
| 2 | `a-1-base-02` | `range(1.7–1.14)` | 8 | `kind` |
| 3 | `a-2-org` | `range(2.1–2.8)` | 8 | `organization` |
| 4 | `a-2-colour` | `range(2.9–2.13)` | 5 | `technicalFill` |
| 5 | `a-2-lines` | `range(2.14–2.20)` | 8 | — |
| 6 | `a-3-unclaimed` | `prefix(3.)` | 7 | `bodyMarks` |
| 7 | `a-4-cbrn` | `prefix(4.1.)` | 11 | `capabilities` |
| 8 | `a-4-care` | `prefix(4.2.)` | 5 | `capabilities` |
| 9 | `a-4-fire` | `prefix(4.3.)` | 6 | `capabilities` |
| 10 | `a-4-recon` | `prefix(4.4.)` | 3 | `capabilities` |
| 11 | `a-4-rescue` | `prefix(4.5.)` | 8 | `capabilities` |
| 12 | `a-4-medical` | `prefix(4.6.)` | 6 | `capabilities` |
| 13 | `a-4-tech-01` | `range(4.7.1–4.7.10)` | 11 | `capabilities` |
| 14 | `a-4-tech-02` | `range(4.7.11–4.7.20)` | 10 | `capabilities` |
| 15 | `a-4-tech-03` | `range(4.7.21–4.7.28)` | 8 | `capabilities` |
| 16 | `a-4-logistics-01` | `range(4.8.1–4.8.12)` | 12 | `capabilities` |
| 17 | `a-4-logistics-02` | `range(4.8.13–4.8.16)` | 4 | `capabilities` |
| 18 | `a-4-info-vet` | `set(4.9.1, 4.10.1–4.10.7)` | 8 | `capabilities` |
| 19 | `a-5-chassis-vehicle` | `set(5.1.1, 5.1.1.1–5.1.1.9)` | 10 | `vehicleCategory` |
| 20 | `a-5-chassis-trailer` | `set(5.1.2, 5.1.2.1–5.1.2.5)` | 6 | `bodyVariant` |
| 21 | `a-5-chassis-container` | `set(5.1.3.1–5.1.3.4)` | 4 | `bodyVariant` |
| 22 | `a-5-chassis-air` | `set(5.1.4.1–5.1.4.3)` | 3 | `bodyVariant` |
| 23 | `a-5-2` | `range(5.2.1–5.2.6)` | 6 | — |
| 24 | `a-5-strength` | `range(5.4.1–5.4.4)` | 4 | `strength` |
| 25 | `a-5-formation` | `range(5.5.1–5.5.3)` | 3 | — |
| 26 | `a-5-admin` | `range(5.7.1–5.7.6)` | 6 | `administrativeLevel` |
| 27 | `a-5-state-81` | `non-example(5.8.1)[0..12)` | 12 | `states` |
| 28 | `a-5-state-82` | `non-example(5.8.1)[12..18)` | 6 | `states` |
| 29 | `a-5-state-82-examples` | `examples(5.8.1)` | 3 | — |
| 30 | `a-5-state-82x` | `prefix(5.8.2.)` | 4 | `states` |
| 31 | `a-5-state-83` | `prefix(5.8.3.)` | 3 | `states` |
| 32 | `a-5-state-84` | `prefix(5.8.4.)` | 3 | `states` |
| 33 | `a-5-state-85` | `prefix(5.8.5.)` | 3 | `states` |
| 34 | `a-5-state-86` | `prefix(5.8.6.)` | 4 | `states` |
| 35 | `a-5-state-87` | `non-example(5.8.7)` | 10 | `states` |
| 36 | `a-5-state-87-examples` | `examples(5.8.7)` | 4 | — |
| 37 | `a-5-state-88-01` | `prefix(5.8.8.)[0..12)` | 12 | `states` |
| 38 | `a-5-state-88-02` | `prefix(5.8.8.)[12..18)` | 6 | `states` |
| 39 | `a-5-state-89` | `range(5.8.9.1–5.8.9.4)` | 4 | `states` |
| 40 | `a-c-1-01` | `range(C.1.1–C.1.8)` | 8 | `bodyMarks` |
| 41 | `a-c-1-02` | `range(C.1.9–C.1.15)` | 7 | `bodyMarks` |
| 42 | `a-c-2-01` | `range(C.2.1–C.2.12)` | 12 | `bodyMarks` |
| 43 | `a-c-2-02` | `range(C.2.13–C.2.17)` | 9 | `bodyMarks` |
| 44 | `a-c-2-03` | `range(C.2.18–C.2.23)` | 10 | `bodyMarks` |
| 45 | `a-c-2-04` | `range(C.2.24–C.2.28)` | 10 | `bodyMarks` |
| 46 | `a-c-2-05` | `range(C.2.29–C.2.31)` | 3 | `bodyMarks` |
| 47 | `a-d-leadership` | `set(D.1.1, D.2.1–D.2.7, D.3.14–D.3.15)` | 10 | `leadership` |
| 48 | `a-d-recipes-01` | `range(D.1.2–D.1.9)` | 9 | `functionRole` |
| 49 | `a-d-recipes-02` | `range(D.3.1–D.3.7)` | 7 | `functionRole` |
| 50 | `a-d-recipes-03` | `range(D.3.8–D.3.13)` | 6 | `functionRole` |
| 51 | `a-d-recipes-04` | `range(D.4.1–D.4.5)` | 5 | `functionRole` |
| 52 | `a-e-1-01` | `range(E.1.1–E.1.12)` | 12 | `bodyMarks` |
| 53 | `a-e-1-02` | `range(E.1.13–E.1.24)` | 12 | `bodyMarks` |
| 54 | `a-e-1-03` | `range(E.1.25–E.1.36)` | 12 | `bodyMarks` |
| 55 | `a-e-1-04` | `set(E.1.37)` | 1 | `technicalHeadMark` |
| 56 | `a-e-2-01` | `range(E.2.1–E.2.12)` | 12 | `bodyMarks` |
| 57 | `a-e-2-02` | `range(E.2.13–E.2.24)` | 12 | `bodyMarks` |
| 58 | `a-e-2-03` | `range(E.2.25–E.2.31)` | 7 | `bodyMarks` |
| 59 | `a-f-1-01` | `range(F.1.1–F.1.11)` | 12 | `bodyMarks` |
| 60 | `a-f-1-02` | `range(F.1.12–F.1.18)` | 9 | `bodyMarks` |
| 61 | `a-f-1-03` | `range(F.1.19–F.1.22)` | 4 | `bodyMarks` |
| 62 | `a-f-2-01` | `range(F.2.1–F.2.7)` | 12 | `bodyMarks` |
| 63 | `a-f-2-02` | `range(F.2.8–F.2.17)` | 10 | `bodyMarks` |
| 64 | `a-f-3-01` | `range(F.3.1–F.3.12)` | 12 | `bodyMarks` |
| 65 | `a-f-3-02` | `range(F.3.13–F.3.19)` | 7 | `bodyMarks` |
| 66 | `a-g-01` | `set(G.1, G.1.1–G.1.5, G.2, G.2.1–G.2.3)` | 10 | `bodyMarks` |
| 67 | `a-g-02` | `set(G.3, G.3.1–G.3.5, G.4–G.8)` | 11 | `bodyMarks` |
| 68 | `a-h-all` | `range(H.1–H.3)` | 3 | `bodyMarks` |
| 69 | `a-i-1-01` | `range(I.1.1–I.1.9)` | 10 | `bodyMarks` |
| 70 | `a-i-1-02` | `range(I.1.10–I.1.20)` | 11 | `bodyMarks` |
| 71 | `a-i-2` | `range(I.2.1–I.2.7)` | 7 | `bodyMarks` |
| 72 | `a-i-3` | `range(I.3.1–I.3.11)` | 11 | `bodyMarks` |
| 73 | `a-i-4` | `range(I.4.1–I.4.3)` | 3 | `bodyMarks` |
| 74 | `a-i-5-recipes` | `range(I.5.1–I.5.3)` | 3 | `bodyMarks` |
| 75 | `a-i-5-water-rescue` | `range(I.5.4–I.5.8)` | 5 | `water-rescue-personnel` |
| 76 | `a-j-1-01` | `range(J.1.1–J.1.7)` | 8 | `comms` |
| 77 | `a-j-1-02` | `range(J.1.8–J.1.14)` | 11 | `comms` |
| 78 | `a-j-2` | `range(J.2.1–J.2.2)` | 2 | `comms` |
| 79 | `a-j-2-examples` | `examples(J.2.3)` | 2 | — |
| 80 | `a-j-3-01` | `range(J.3.1–J.3.12)` | 12 | `comms` |
| 81 | `a-j-3-02` | `range(J.3.13–J.3.15)` | 3 | `comms` |
| 82 | `a-j-4-01` | `range(J.4.1–J.4.12)` | 12 | `comms` |
| 83 | `a-j-4-02` | `range(J.4.13–J.4.17)` | 5 | `comms` |
| 84 | `a-j-overview` | `asset(J_Bedienungszeichen.svg)` | 1 | — |
| 85 | `a-k-01` | `range(K.1–K.9)` | 9 | `damage` |
| 86 | `a-k-02` | `range(K.10–K.18)` | 9 | `damage` |
| 87 | `a-l-all` | `range(L.1–L.10)` | 10 | `damage` |
| 88 | `a-m-01` | `range(M.1–M.7)` | 7 | `wildfire` |
| 89 | `a-m-02` | `range(M.8–M.14)` | 7 | `wildfire` |
| 90 | `a-n-all` | `set(N.1.1–N.1.6, N.2.1–N.2.3)` | 9 | `bodyMarks` |

Die Tabellenreihenfolge ist ausschließlich die **sequenzielle Ausführungsreihenfolge**. Sie
erzeugt keine semantische Dependency und ist kein Sortierschlüssel für Graph-Ties oder direkte
Dependencies. Nach Task 3 enthält jeder
Descriptor als `readonlyDependencies` genau den minimalen, mit `compareExactBatchId` kanonisch
sortierten Satz früherer Owner-Batches, auf deren batch-owned Keys der Current-Batch über
mindestens eine der vollständigen `EXACT_BATCH_RELATIONS` direkt zeigt. Das umfasst insbesondere
Contract-/Witness-, Part-/Ownership-, Asset-/Display-, Plan-/Trace-/UseEdge-, FeatureContract-
und Case-Endpunkte und ist nicht auf ComponentFixture-Referenzen beschränkt. Eine leere Menge ist
auch nach dem ersten Batch erlaubt. Die Targetmenge stammt ausschließlich aus
`batchOwnedRelationTargets(current)`; Owner werden ausschließlich im vor Closure-Laden aus allen
90 vollständigen Descriptoren gebauten `StagedExactBatchOwnershipIndex` aufgelöst. Die transitive Closure wird aus diesen direkten Kanten
berechnet und ist im Allgemeinen kein Tabellenpräfix. Jede deklarierte Kante ohne einen durch
`directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` nachgewiesenen
Current-Endpunkt und jeder fremde direkte Owner
ohne Descriptor-Kante ist ein harter Vertragsfehler. `owner.ordinal < consumer.ordinal`
validiert nur die zulässige Vorwärtsrichtung einer solchen realen Kante und bestimmt niemals
ihre Sortierung.

## 8. Gemeinsamer Implementierungsvertrag für Tasks 4–93

Die Tasks 4–93 werden je genau einmal in der durch Allocation und Tabellenordinal erlaubten
topologischen Reihenfolge ausgeführt. Für jeden Task wird ein frischer Implementierungs-Agent `I-<id>`
gespawnt. Er besitzt ausschließlich die sechs Dateien seines Batch-Verzeichnisses, ist nicht
allein im Repository, verändert keine fremden Dateien und erzeugt keine eigenen Subagents.

**Files je literal gebundener Tabellen-ID:**

- Create: `packages/catalog/src/exact/batches/<id>/manifest.ts`
- Create: `packages/catalog/src/exact/batches/<id>/components.ts`
- Create: `packages/catalog/src/exact/batches/<id>/assets.ts`
- Create: `packages/catalog/src/exact/batches/<id>/parts.ts`
- Create: `packages/catalog/src/exact/batches/<id>/plans.ts`
- Create: `packages/catalog/src/exact/batches/<id>/cases.test.ts`

**Interfaces:**

- Consumes: den grünen Integration Task 0, `corpusShard(id)`,
  `resolveCorpusShard(corpusShard(id), ORACLE_MANIFEST)`, `componentFixturesOwnedBy(id)`,
  `REFERENCE_COMPONENT_CONTEXT_SET`, `EXPECTED_DIRECT_BATCH_OWNERS`,
  `batchOwnedRelationTargets(current)`,
  `buildStagedExactBatchOwnershipIndex(STAGED_EXACT_BATCH_DESCRIPTORS)`,
  `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)`,
  `assertCorpusBatchDependencies(current, descriptor, fullOwnerIndex)`,
  `loadStagedExactBatchClosure(id)`, `assertStagedBatchBoundary(descriptor, batch)`, alle
  Foundation-IR-/Case-/Graph-Typen einschließlich `CompositionContractKey`,
  `CompositionContractCaseKey` und `CompositionWitnessEdgeKey`, ausschließlich bereits
  akzeptierte Dependency-Collections und
  die freigegebene lokale Discovery-Evidence des literal gebundenen Shards. Die Closure enthält
  ausschließlich die transitive, topologisch geordnete minimale Dependency-Menge plus das
  aktuelle Modul; sequenziell früher ausgeführte, aber nicht referenzierte Batches fehlen bewusst.
  Ihre Registry ist read-only.
- Produces: die fünf festen Exporte `BATCH_MANIFEST`, `BATCH_COMPONENTS`, `BATCH_ASSETS`,
  `BATCH_PARTS`, `BATCH_PLANS`, zusammen ein `ExactBatchModule`, sowie seinen ausführbaren
  `cases.test.ts`-Vertrag. `BATCH_ASSETS` hat die exakte Form `ExactBatchAssets` einschließlich
  `assetFragments` und `recipeExactAssetLinks`; in
  `BATCH_ASSETS.recipeExactAssetLinks` hat jeder Datensatz exakt die
  Form `{ readonly recipe: RecipeKey; readonly exactAsset: ExactAssetKey }`; daraus konsumiert
  der Integrationsplan `Recipe.exactAsset: ExactAssetKey`. `BATCH_PARTS` besitzt Ownership und
  Profile ausschließlich in `ownershipEntries`, `comparisonProfiles` und `maskContracts`.
  `BATCH_PLANS.plans` enthält ausschließlich autoritative `CompositionPlan`s; Traces und UseEdges
  werden daraus materialisiert und sind keine handgeschriebenen Shard-Collections. Nur
  `CorpusShardDescriptor`/`ExactBatchDescriptor` besitzt `readonlyDependencies`;
  `BATCH_MANIFEST` besitzt dieses Feld ausdrücklich nicht. Der Descriptorwert muss exakt dem
  minimalen kanonischen Owner-Batch-Satz entsprechen, den Foundation
  `directForeignExactBatchOwners(current, fullOwnerIndex, batchOwnedRelationTargets(current))`
  aus den tatsächlichen Current-Records über **alle** `EXACT_BATCH_RELATIONS` und den vor dem
  Closure-Laden aus allen 90 Descriptoren gebauten Full-Owner-Index ermittelt.

`<id>` ist in diesem Abschnitt kein offener Planwert: Der Root-Orchestrator bindet ihn vor jedem
der 90 Durchläufe an genau eine literal vorhandene ID aus Abschnitt 7 und schreibt diese ID in den
Task-Brief. Ein Verzeichnis namens `<id>` darf nie entstehen.

Für jeden dieser Durchläufe ist die Closure ausschließlich ein read-only Materialisierungsinput.
Case-Runner, Matrix-/Bildresultate, `visual-review.json`, Reviewbefunde und Commit-Scope werden
hart auf den letzten Closure-Eintrag mit `manifest.id === <id>` und dessen Case-Keysets begrenzt.
Sobald ein Dependency-Case in Results erscheint, eine Dependency-Datei staged ist oder die Cached-Liste von
den exakt sechs literal genannten aktuellen Dateien abweicht, schlägt das Batchgate vor Review
und Commit fail-closed fehl.

### A. Agent-Brief und Vorbedingungen

- [ ] Der Root-Orchestrator übergibt literal: Batch-ID, aufgelöste OracleAssetKeys samt Digests,
  besessene ComponentFixtureKeys samt ihrer totalen `ReferenceComponentContextSet/v1`-Kategorie,
  besessene OraclePart-/Contract-/Witness-Keys, zugeordnete
  Display-Keys, die minimalen Descriptor-`readonlyDependencies`, die konkrete externe
  Relation→Owner-Begründung aus `batchOwnedRelationTargets(current)` und
  `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)`, deren transitiv aufgelöste
  Commitfolge, die mit `deriveReferenceComponentContextOwnership(referenceSet,
  componentFixtures, ownerIndex)` aus Pair↔Fixture und Descriptor-Fixture-Owner abgeleiteten
  `ReferenceComponentContextOwnershipRecord`s dieses Batchs samt globalem
  `referenceComponentContextOwnershipDigest` und die
  beiden freigegebenen Discovery-Berichte.
- [ ] Der Agent prüft, dass alle Batches der aufgelösten Dependency-Closure auf seinem HEAD liegen
  und deren gezielte Tests grün sind. Er prüft `rtk git status --short`, verändert/staged keine
  fremde Änderung und beendet bei einer Ownership-Überschneidung ohne Mutation.
- [ ] Er liest jedes eigene Original und jedes fremde Originalpart, das seine Component-Fixtures
  belegt. Kein Discovery-Wert wird ohne erneute Digest- und Node-ID-Prüfung übernommen.

### B. Gültiges RED ohne Import-/Syntaxfehler

- [ ] Lege zuerst reine, typisierte Kompilationsschalen für `manifest.ts`, `components.ts`,
  `assets.ts`, `parts.ts`, `plans.ts` an. Sie enthalten nur Batch-ID, die aus
  `corpus-shards.ts` aufgelösten erwarteten Keys und explizit leere Datenarrays; keine Geometrie,
  kein Fallback und keine produktive Implementierung.
- [ ] Schreibe danach `cases.test.ts`. Das Grundmuster ist:

  ```ts
  import { describe, expect, it } from 'vitest';
  import { ORACLE_MANIFEST } from '../../oracle-manifest.js';
  import {
    assertExactBatchContract,
    batchOwnedRelationTargets,
    directForeignExactBatchOwners,
    registerExactBatchModules,
    resolveCorpusShard,
  } from '../../batch-contract.js';
  import { assertCorpusBatchDependencies } from '../../component-allocation.js';
  import { CORPUS_SHARDS, corpusShard } from '../../corpus-shards.js';
  import {
    buildStagedExactBatchOwnershipIndex,
    loadStagedExactBatchClosure,
    STAGED_EXACT_BATCH_DESCRIPTORS,
  } from '../../batch-staging-registry.js';
  import { BATCH_MANIFEST } from './manifest.js';
  import { BATCH_COMPONENTS } from './components.js';
  import { BATCH_ASSETS } from './assets.js';
  import { BATCH_PARTS } from './parts.js';
  import { BATCH_PLANS } from './plans.js';

  const BATCH = {
    manifest: BATCH_MANIFEST,
    components: BATCH_COMPONENTS,
    assets: BATCH_ASSETS,
    parts: BATCH_PARTS,
    plans: BATCH_PLANS,
  } as const;

  describe(BATCH_MANIFEST.id, () => {
    it('besitzt exakt seinen OracleManifest-Shard', () => {
      const expected = resolveCorpusShard(corpusShard(BATCH_MANIFEST.id), ORACLE_MANIFEST);
      expect(
        BATCH_ASSETS.exactAssets,
        `${BATCH_MANIFEST.id}: expected ${expected.assets.length} exact assets, ` +
          `received ${BATCH_ASSETS.exactAssets.length}`,
      ).toHaveLength(expected.assets.length);
      expect(BATCH_ASSETS.exactAssets.map(({ oracle }) => oracle))
        .toEqual(expected.assets.map(({ key }) => key));
    });

    it('erfüllt den vollständigen Batch- und Relationsvertrag', async () => {
      expect(() => assertExactBatchContract(BATCH)).not.toThrow();
      const fullOwnerIndex = buildStagedExactBatchOwnershipIndex(
        STAGED_EXACT_BATCH_DESCRIPTORS,
      );
      const closure = await loadStagedExactBatchClosure(BATCH_MANIFEST.id);
      const modules = [...closure.dependencies, closure.current];
      expect(() => registerExactBatchModules(modules)).not.toThrow();
      const relationTargets = batchOwnedRelationTargets(closure.current);
      expect(directForeignExactBatchOwners(
        closure.current, fullOwnerIndex, relationTargets,
      )).toEqual(corpusShard(BATCH_MANIFEST.id).readonlyDependencies);
      expect(() => assertCorpusBatchDependencies(
        closure.current,
        corpusShard(BATCH_MANIFEST.id),
        fullOwnerIndex,
      )).not.toThrow();
    });
  });
  ```

- [ ] Ergänze batchspezifische Assertions für jede eigene Component-Fixture, jeden Part, jedes
  Asset, jeden Plan, jede Variante und jeden zugeordneten Whole-/Part-Display-Key. Arraylänge ohne
  exakte Schlüsselgleichheit genügt nicht.
- [ ] Baue vor dem Closure-Laden aus allen 90 vollständigen staged Descriptoren den globalen
  `StagedExactBatchOwnershipIndex`. Lade danach die tatsächliche Closure, registriere sie nur für
  read-only Contract-/Materialisierungsprüfungen und ermittle aus
  `batchOwnedRelationTargets(current)` plus
  `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` die fremden direkten
  Owner. Prüfe exakte Gleichheit mit `EXPECTED_DIRECT_BATCH_OWNERS` und den Descriptor-
  Dependencies. Eine Witness-only-, dependency-owned-Part- oder Ownership-only-Referenz muss
  dieselbe Kante erzeugen wie jeder andere batch-owned Relationsendpunkt. Keine Kante darf
  lediglich wegen der Tabellenreihenfolge bestehen; transitive, aber nicht direkt referenzierte
  Batches dürfen nicht im Descriptor stehen. Entferne im Mutationstest eine tatsächliche direkte
  Owner-ID aus dem Current-Descriptor: Das Owner-Modul fehlt dann in der Closure, der globale
  Descriptorindex muss den Relationsziel-Owner trotzdem bestimmen und
  `MISSING_STAGED_DEPENDENCY` vor einem bloßen Unknown-Target melden.
- [ ] Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/<id>/cases.test.ts
  ```

  Erwartung: Assertions zeigen die literal erwartete Asset-/Fixture-/Case-Menge gegen die leeren
  Schalen. Syntax, Importauflösung und Testumgebung sind grün. Erst dieses RED erlaubt produktive
  IR-Änderungen.

### C. Components, Parts und Contracts

- [ ] Implementiere jede laut Allocation besessene Component-Fixture als kanonischen
  `ReferenceExactFragment` und `ExactComponentVariant`. Alle sichtbaren Leaves tragen stabile
  Node-ID, Rolle und den erwarteten `component`-Owner; kein Node bleibt ungezählt.
- [ ] Implementiere pro Fixture mindestens einen digestgebundenen `OraclePart`-Zeugen. Frame,
  ComparisonProfile, Maske und Paint-Ownership werden ausschließlich in `BATCH_PARTS` gehalten.
  Frame und
  Maske kommen ausschließlich aus dem aufgelösten ComparisonProfile. `source-node-set` benötigt
  den maschinellen Paint-Order-/Bounds-Beweis, sonst `leave-one-out`.
- [ ] Speichere in `BATCH_COMPONENTS.componentCases` genau einen `ComponentCase` pro eigener
  Fixture und manifestiere Keys sowie Setdigest in `ownedKeys.componentCases`/
  `setDigests.componentCases`. Jeder Case referenziert seine eigene `componentFixture` und bindet
  Fixture-/Plan-/Geometry-/Paint-/OwnedPaint-/Trace-/Part-/Profile-/Mask-/Transform-Digests.
  ComponentCases fremder Closure-Module bleiben außerhalb des Current-Keysets.
- [ ] Die Fixture-/Case-Paare dieses Shards sind exakt seine Projektion aus
  `REFERENCE_COMPONENT_CONTEXT_SET`: `public-builder`, `reference-only` und `direct-carrier` werden
  vollständig abgedeckt. Nur die erste Kategorie muss zusätzlich in
  `REACHABLE_BUILDER_CONTEXT_SET` liegen; Tests weisen jeden Versuch ab, `reference-only` oder
  `direct-carrier` durch `resolveReachableBuilderContext` erreichbar zu machen.
- [ ] Implementiere für jeden besessenen Registry-Key genau einen `CompositionContractCase` mit
  allen beobachteten Witnesses. Transformfolgen, Anker, Zonen, Part-Frames und Trace-Nodes müssen
  literal mit der Discovery-Evidence übereinstimmen. Importiere dafür die Foundation-Brands
  `CompositionContractKey`, `CompositionContractCaseKey` und `CompositionWitnessEdgeKey` und
  typisiere `CompositionContract.key`, `CompositionContractCase.key`/`contract` sowie
  `CompositionWitnessEdge.key`/`contract` damit; `as string` oder lokale Key-Aliasse sind
  verboten.
- [ ] Prüfe jeden totalen Referenzkontext des Shards gegen `REFERENCE_COMPONENT_CONTEXT_SET`;
  unbekannter Kontext muss `NotMeasuredError` auslösen. Builder-Auflösung ist exakt auf dessen
  `public-builder`-Paarprojektion begrenzt, die mengengleich
  `REACHABLE_BUILDER_CONTEXT_SET.pairs` ist und genau 247 eindeutige Component-Keys projiziert.
  Eine generische Skalierung oder eine aus Bounds erratene
  Platzierung ist verboten.

### D. Assets, Displays und Composition-Pläne

- [ ] Implementiere für jeden eigenen OracleAssetKey genau eine `ExactAssetFixture` und genau
  einen `AssetCase`. Beispiele, Übersichtsblatt, Farbfelder und Linienzeichen sind ebenso
  öffentliche Exact-Assets wie alle anderen.
- [ ] Jede Fixture hat genau einen autoritativen `CompositionPlan`: geordnete Instanzen bereits
  akzeptierter oder im selben Batch definierter Component-Varianten plus explizite
  assetspezifische Fragmente in `BATCH_ASSETS.assetFragments`. `assets.ts` enthält keine zweite
  Whole-Geometrie.
- [ ] Jeder sichtbare Asset-Leaf erhält laut finalem `ORACLE_OWNERSHIP_MANIFEST` genau einen Owner.
  Assetspezifische Fragmente stimmen in Anzahl, Purpose-Key, Review-Key und Reuse-Fingerprint
  exakt mit der zentralen Allowlist überein.
- [ ] Ordne alle CoverageManifest-Displays, deren Exact-Asset diesem Shard gehört, exakt hier zu.
  Whole-Displays teilen Paint-/Geometry-Digest mit dem Asset. Part-Displays projizieren nur den
  festgelegten OraclePart. Kein Display besitzt eine dritte Geometriequelle.
- [ ] Ordne jedes der 242 heutigen Rezepte, dessen Exact-Asset diesem Shard gehört, genau einem
  `ExactAssetKey` zu. Diese Zuordnung ist die einzige Quelle für die spätere verpflichtende
  `Recipe.exactAsset: ExactAssetKey`-Property; Dateinamenheuristiken und Laufzeit-Fallbacks sind
  verboten.
- [ ] Materialisiere Drawing und vollständigen `CompositionTrace` atomar aus demselben Plan;
  speichere im Batch jedoch nur `BATCH_PLANS.plans`. Jeder
  Component-Owner erzeugt die abgeleiteten UseEdges; Asset-specific-Leaves erzeugen keine.
- [ ] Ergänze negative Tests: vertauschte Paint-Reihenfolge, fehlender Owner, falscher Kontext,
  zweiter Assetplan, nicht registrierter Part-Selector, falscher Transformoperand und ein
  unerlaubter Generated-Overlay in ExactAsset/ComponentFixture müssen scheitern.

### E. GREEN, maschineller Null-Diff und Commit

- [ ] Führe den Batchtest bis GREEN aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/<id>/cases.test.ts \
    packages/catalog/src/exact/corpus-shards.test.ts \
    packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: Exit 0; exakte Schlüsselmengen, Materialisierungsdigest und Graphteil sind grün.
- [ ] Stage jetzt exakt die sechs Owned-Dateien und belege die exakte Cached-Namensmenge. Erst
  der staged Stand darf die beiden lokalen Orakel-/Boundary-Gates speisen:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/<id>/manifest.ts \
    packages/catalog/src/exact/batches/<id>/components.ts \
    packages/catalog/src/exact/batches/<id>/assets.ts \
    packages/catalog/src/exact/batches/<id>/parts.ts \
    packages/catalog/src/exact/batches/<id>/plans.ts \
    packages/catalog/src/exact/batches/<id>/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  ```

  Erwartung: exakt die sechs literal ersetzten Pfade, keine weitere Datei.
- [ ] Führe den lokalen Orakelvergleich aus:

  ```bash
  rtk pnpm cli conformance:batch --batch <id> --batch-source staged \
    --reference-root ../../taktische-zeichen \
    --evidence-out out/exact-reference/<id>
  ```

  Erwartung: `loadStagedExactBatchClosure(<id>)` materialisiert die Dependency-Module nur in einer
  read-only Registry und nimmt ausschließlich das aktuelle Modul als Run-/Result-Scope. Nur dessen
  Asset-, Display- und Component-Cases erscheinen in `matrix.json`; sie haben identische
  NormalizedPaintList und alle 30 Rasterzellen pro Vergleichspaar melden vier Nullen/identische
  Bounds. Bei `leave-one-out` gelten dieselben Werte in beiden Paaren.
- [ ] Führe vor dem Commit den frühen mechanischen staged-/HEAD-Source-Grenzcheck und die
  Vier-Bild-Erzeugung aus:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch <id> --batch-source staged \
    --reference-root ../../taktische-zeichen \
    --out out/exact-reference/review/<id>
  ```

  Erwartung: `verifyRepositorySourceBoundary(...)` bestätigt, dass HEAD und staged Blobs weder
  Original-SHA-Treffer, SVG/XML/Quellkommentare, Oraclepfade noch Raster-/Diffartefakte enthalten.
  Danach bestätigt `verifyStagedBatchBoundary(...)` den aktuellen Descriptor, exakt dessen sechs
  staged Dateien und Worktree-/Index-Blobgleichheit; Dependency-Dateien sind ausschließlich
  committed und read-only. Jede aktuelle Case-Key-Ausgabe besitzt
  `original`, `candidate`, `overlay`, `heatmap`; der Befehl setzt keinen Status.
- [ ] Führe zusätzlich aus:

  ```bash
  rtk pnpm typecheck
  rtk git diff --check
  rtk git -c core.fsmonitor=false status --short
  ```

  Erwartung: Typecheck und Diff-Check Exit 0; Status nennt ausschließlich die sechs eigenen
  Batchdateien sowie vorbestehende, ausdrücklich nicht gestagte Nutzeränderungen.
- [ ] Committe exakt die sechs Batchdateien:

  ```bash
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct <id> reference batch"
  ```

  Vor `commit` muss die Cached-Liste exakt den sechs literal ersetzten Pfaden entsprechen.

## 9. Gemeinsamer Doppelreview nach jedem der Tasks 4–93

Nach jedem `I-<id>` laufen zwei frische, vom Implementer verschiedene Agents. Der Implementer hat
unmittelbar vor seinem Commit den staged Boundary-/Review-Befehl aus Abschnitt 8 ausgeführt und
danach exakt diese geprüften sechs Blobs committed. Beide Reviewer erhalten Commit-Diff, den
staged Boundary-Report samt Blobdigests, Spec, Batch-Brief, Discovery-Evidence, `matrix.json` und
`visual-review.json`. Sie verifizieren zuerst, dass die sechs committed Blobdigests exakt den
geprüften staged Digests entsprechen. Sie dürfen parallel laufen, weil sie Source nur lesen.

### 9.A Spec-/Code-Reviewer `S-<id>`

- [ ] Prüfe jede Anforderung des Batch-Briefs gegen konkrete Datei/Zeile und jeden besessenen Key
  gegen Manifest, Allocation und `ORACLE_OWNERSHIP_MANIFEST`.
- [ ] Prüfe insbesondere: keine zweite Geometriequelle, keine opaque SVGs/Pfade, kanonische
  Dezimal-/Pfad-/Transformform, vollständige Owner, alle Witnesses, fail-closed Kontexte,
  unveränderliche Exporte, keine fremden Dateien und keine lokalen Artefakte im Diff.
- [ ] Führe die drei gezielten Vitest-Dateien, Typecheck und `git diff --check` frisch aus.
- [ ] Melde `PASS` nur ohne offene Befunde; sonst priorisierte Befunde mit reproduzierbarem Test
  und exakten Pfaden. Der Reviewer ändert nichts.

### 9.B Visual-Reviewer `V-<id>`

- [ ] Verifiziere, dass die Reviewansicht unmittelbar vor dem Commit mit genau diesem literal
  gebundenen Befehl erzeugt wurde und ihr Boundary-Report auf exakt die nun committed Blobs zeigt:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch <id> --batch-source staged \
    --reference-root ../../taktische-zeichen \
    --out out/exact-reference/review/<id>
  ```

- [ ] Öffne für **jeden** Case-Key einzeln Original, Kandidat, Overlay und Heatmap bei 512 px auf
  transparentem Hintergrund. Prüfe außerdem in `matrix.json` jede der zehn Größen und alle drei
  Hintergründe. Ein leerer Kontaktbogen oder eine leere Heatmap ersetzt die Einzelfallsichtung
  nicht.
- [ ] Bei Component-/Part-Cases öffne zusätzlich die isolierte Partdarstellung, kontrolliere
  `partFrame`, Maskenkante und Transform. Bei `leave-one-out` öffne beide vollständigen und beide
  subtrahierten Bilder.
- [ ] Verändere das maschinell erzeugte `visual-review.json` nicht. Schreibe lokal genau eine
  `visual-inspection.json`-Zeile pro Case-Key mit
  `originalSeen`, `candidateSeen`, `overlaySeen`, `heatmapSeen`, `partFrameChecked`,
  `matrixAllZero`, `finding` und `result`. Ein Sammel-`PASS` ohne Zeilen ist ungültig.
- [ ] Melde `PASS` nur, wenn die Inspection-JSON-Keymenge exakt der Batch-Case-Keymenge entspricht und jede
  Zeile `result: "pass"` trägt.

### 9.C Fix-/Re-Review-Schleife

- [ ] Bei irgendeinem Befund spawned der Root-Orchestrator einen neuen Fix-Agenten `F-<id>-n` mit
  denselben exklusiven sechs Source-Pfaden. Er reproduziert den Befund als RED, implementiert die
  kleinste vollständige Korrektur, führt alle Batchgates neu aus, staged erneut ausschließlich die
  sechs Owned-Dateien und muss vor dem separaten Commit erneut den literal gebundenen Source-
  Boundary-/Review-Befehl ausführen:

  ```bash
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk pnpm cli conformance:batch --batch <id> --batch-source staged \
    --reference-root ../../taktische-zeichen \
    --evidence-out out/exact-reference/<id>
  rtk mise exec -- pnpm cli conformance:review --batch <id> --batch-source staged \
    --reference-root ../../taktische-zeichen \
    --out out/exact-reference/review/<id>
  rtk git -c core.fsmonitor=false commit -m "fix(exact): address <id> review findings"
  ```

- [ ] Danach prüfen dieselben Dimensionen frische Re-Reviewer erneut. Alte Matrix-/Bild-/JSON-
  Evidence wird verworfen und vollständig neu erzeugt.
- [ ] Höchstens fünf Fixschleifen. Beim fünften Fehlschlag wird der Batch als tatsächlich
  blockiert protokolliert; weder Root noch Reviewer patchen ihn heimlich.
- [ ] Ein Batch gilt erst als **frisch akzeptiert**, wenn gezielte Tests, Batch-Null-Diff,
  `S-<id>` und `V-<id>` auf demselben HEAD grün sind. Erst dann startet der nächste schreibende
  Implementer.

## 10. Explizite, einzeln dispatchbare Batch-Tasks 4–93

Jeder folgende Task ist eine eigenständige SDD-Dispatchgrenze.
`scripts/exact/build-corpus-brief.mjs` verkettet den verankerten Writerabschnitt, diesen
verankerten gemeinsamen Vertrag, einen aus Descriptor/OracleManifest/Discovery/
Dependency-Report erzeugten literal Datenblock und **genau einen** folgenden Taskblock. Es
expandiert Batch-ID, sechs Dateipfade, OracleAssetKeys samt Digests, direkte Dependencies,
Relation→Owner-Zeugen und transitive Closure vor dem Dispatch; es erfindet keine Tabellenkante
und lässt keinen vom exakten Muster `/\x3c[A-Za-z][A-Za-z0-9_-]*\x3e/` erkannten
Template-Platzhalter im Ergebnis. Literales `<svg`, ein Vergleichsoperator `<` und
TypeScript-`=>` sind normaler Vertragsinhalt und ausdrücklich zulässig.
Die Tasks laufen strikt in Nummernfolge; diese konservative Reihenfolge erfüllt die
Allocation-DAG und verhindert parallele Source-Schreiber.

<!-- CORPUS-BRIEF-CONTRACT:END -->

### Selbständiger Bootstrap-Brief für Task 1

Da Task 1 den produktiven Brief-Builder erst erzeugt, konstruiert Root seinen einmaligen
Bootstrap-Brief ohne den installierten `task-brief`: Root liest diesen Plan byteweise mit LF,
verlangt je genau ein nicht in einer Fence liegendes Paar der Anker
`CORPUS-BRIEF-REALPATH`, `CORPUS-BRIEF-WRITER` und `CORPUS-BRIEF-CONTRACT` sowie genau ein
Task-1-Heading und konkateniert in dieser Reihenfolge die drei Inhalte ohne Markerzeilen und den
vollständigen Task-1-Block. Fehlende, doppelte, verschachtelte oder vertauschte Anker, ein zweites
Task-1-Heading oder ein vorhandenes/symlinkendes Ziel brechen vor dem Schreiben ab. Der Brief liegt
unter `.superpowers/sdd/exact-reference-corpus/task-1-bootstrap-brief.md`; der Task-1-Agent liest nur
diesen Brief, notwendige Schnittstellen und die Spec. Das literal Template-Token `<id>` bleibt in
diesem Bootstrap absichtlich erhalten, weil Task 1 genau dessen Expansion implementiert.

Noch vor Abschluss von Task 1 muss der neu implementierte
`build-corpus-brief.mjs --task 1` denselben Brief in ein zweites absentes Ziel schreiben; Root
verlangt Bytegleichheit mit dem Bootstrap-Brief. Damit ist der einmalige Controller-Bootstrap
prüfbar, aber kein zweiter dauerhafter Parser oder Fallback.

### Generischer Brief ausschließlich für die selbständigen Tasks 2, 3 und 94

Noch vor Task 1 erzeugt Root mit dem tatsächlich installierten generischen `task-brief` drei reale
Probe-Briefdateien ausschließlich für Task 2, 3 und 94; unmittelbar vor dem jeweiligen Dispatch
erzeugt und prüft er den betreffenden Brief erneut in einem neuen absent Ziel. Root prüft jede
Ausgabe gegen eine unabhängige fence-aware Extraktion auf Bytegleichheit, exakt ein passendes
Taskheading und Abwesenheit jedes anderen Taskheadings. Zusätzlich müssen Task 2 `CORPUS_SHARDS`,
90 und 661, Task 3 seine vollständige 413er Family-Tabelle,
`REFERENCE_COMPONENT_CONTEXT_SET`, `batchOwnedRelationTargets`,
`buildStagedExactBatchOwnershipIndex`, die neue Drei-Argument-Signatur von
`directForeignExactBatchOwners`, `ReferenceComponentContextOwnershipRecord`,
`ReferenceComponentContextOwnershipV1`,
`deriveReferenceComponentContextOwnership(referenceSet, componentFixtures, ownerIndex)`, die
dynamische Public-/Total-Paarzahl, ausschließlich 247 öffentliche Component-Keys und die sieben Owned-Dateien sowie Task 94 die zwei Owned-Dateien
und die 90/661/544/413-Gates enthalten.
Task 3 bezieht seine Family-Shards ausschließlich aus dem konsumierten `CORPUS_SHARDS` statt aus
einem nicht enthaltenen Vorabschnitt. Fehlt bereits im Vorabtest eine dieser Anforderungen, wird
Task 1 nicht dispatcht und der Plan erhält für diesen Task einen spezialisierten, getesteten
Buildermodus; Root ergänzt nichts ad hoc an
den generischen Output. Für keinen anderen Corpus-Task ist der generische Helper zulässig.

## Task 1: 90-Shard-Vertrag testgetrieben einfrieren

**Ownership:** Ein frischer Root-Contract-Agent besitzt ausschließlich `corpus-shards.ts`,
`corpus-shards.test.ts` und die Root-owned Descriptor-Allowlist in
`batch-staging-registry.ts` sowie `scripts/exact/build-corpus-brief.mjs` und dessen Test.
Ausschließlich Task 3 darf die drei Descriptor-/Registry-Dateien noch einmal ändern, um
die vorläufigen Descriptor-Owned-Keysets/Setdigests zu vervollständigen und erst danach die
leeren Discovery-Dependencies durch den belegten minimalen DAG zu ersetzen. Ab
Beginn von Task 4 sind alle fünf Dateien unveränderlich; kein Batch-Worker verändert sie.

**Files:**

- Create: `packages/catalog/src/exact/corpus-shards.ts`
- Create: `packages/catalog/src/exact/corpus-shards.test.ts`
- Modify: `packages/catalog/src/exact/batch-staging-registry.ts`
- Create: `scripts/exact/build-corpus-brief.mjs`
- Create: `scripts/exact/build-corpus-brief.test.mjs`

**Interfaces:**

- Consumes: `ExactBatchDescriptor`, `ExactBatchId`, `PaintComponentFamily`, `OracleManifest`,
  `LoadedExactBatchClosure`, `resolveCorpusShard(descriptor, oracleManifest)`,
  `compareExactBatchId(left, right)`,
  `buildStagedExactBatchOwnershipIndex(descriptors)`,
  `resolveStagedBatchDependencyOrder(id, descriptors)`, `loadStagedExactBatchClosure(id)`,
  `registerExactBatchModules(modules)`,
  `STAGED_EXACT_BATCH_DESCRIPTORS`, `stagedExactBatchDescriptor(id)`,
  `assertStagedBatchBoundary(descriptor, batch)`, den kanonischen
  OracleAssetKey-Comparator und die 661 committed OracleManifest-Einträge aus dem
  Foundation-Plan.
- Produces:

  ```ts
  export type CorpusShardSelector =
    | { readonly kind: 'section-range'; readonly first: string; readonly last: string }
    | { readonly kind: 'section-set'; readonly sections: readonly string[] }
    | { readonly kind: 'prefix'; readonly prefix: string; readonly slice?: readonly [number, number] }
    | { readonly kind: 'non-example-slice'; readonly prefix: string; readonly slice?: readonly [number, number] }
    | { readonly kind: 'examples'; readonly prefix: string }
    | { readonly kind: 'asset'; readonly filename: string };

  export interface CorpusShardDescriptor extends ExactBatchDescriptor {
    readonly ordinal: number;
    readonly selector: CorpusShardSelector;
    readonly expectedAssetCount: number;
    readonly readonlyDependencies: readonly ExactBatchId[];
  }

  export const EXPECTED_BATCH_IDS: readonly ExactBatchId[];
  export const CORPUS_SHARDS: readonly CorpusShardDescriptor[];
  export function corpusShard(id: ExactBatchId): CorpusShardDescriptor;
  export function resolveCorpusSelector(
    selector: CorpusShardSelector,
    oracleManifest: OracleManifest,
  ): readonly OracleAssetKey[];
  ```

  `scripts/exact/build-corpus-brief.mjs` exportiert außerdem
  `parseCorpusBriefArgs(argv)`, `buildCorpusBrief(input): string` und
  die asynchrone Funktion `writeCorpusBrief(input, out)`. Seine drei disjunkten
  CLI-Grammatiken lauten:

  ```text
  node scripts/exact/build-corpus-brief.mjs --plan PLAN_FILE --task 1 --out OUTPUT_FILE
  node scripts/exact/build-corpus-brief.mjs --plan PLAN_FILE --task TASK_NUMBER_4_TO_93 --descriptor DESCRIPTOR_JSON --measurement MEASUREMENT_JSON --mapping-review MAPPING_REVIEW_JSON --dependencies DEPENDENCIES_JSON --out OUTPUT_FILE
  node scripts/exact/build-corpus-brief.mjs --plan PLAN_FILE --task95-attempt CANONICAL_DECIMAL_ATTEMPT_MIN_WIDTH_3 --out OUTPUT_FILE
  ```

- [ ] Lege zuerst in `corpus-shards.ts` ausschließlich die oben genannten Typen und
  compile-sicheren Stub-Exporte an: `EXPECTED_BATCH_IDS` und `CORPUS_SHARDS` sind typisiert leer,
  `corpusShard` weist jede ID fail-closed als unbekannt ab und `resolveCorpusSelector` liefert
  eine typisiert leere Schlüsselmenge. Die von Foundation vorhandene Staging-Datei bleibt in
  diesem RED-Schritt mit ihrem gültigen Canary-Descriptor kompilierbar. Es wird noch kein echter
  Corpus-Descriptor und keine produktive Selectorlogik angelegt.
- [ ] Lege parallel einen importierbaren Brief-Builder-Stub an. Der Parser akzeptiert noch keine
  valide CLI, `buildCorpusBrief` wirft `RED: corpus brief builder not implemented` und der Stub
  schreibt nichts. `scripts/exact/build-corpus-brief.test.mjs` importiert ihn ohne Prozess-
  Side-Effect.
- [ ] Schreibe Builder-REDs mit temporären, vollständigen
  `CorpusBriefDescriptor/v1`-, Discovery-Measurement-/Mapping-Review- und
  `CorpusBriefDependencies/v1`-Fixtures. Das Descriptor-Fixture enthält Tasknummer, Batch-ID,
  sechs literal Dateipfade, alle 21 kanonischen `ownedKeys`-Folgen samt `setDigests` und die
  geordnete `{ key, sha256 }`-Assetfolge sowie die aus der totalen Pair↔Fixture-Bijektion
  abgeleiteten `ReferenceComponentContextOwnershipRecord`s dieses Batchs und den globalen
  `referenceComponentContextOwnershipDigest`; das Dependency-Fixture
  enthält dieselbe Batch-ID, die mit `compareExactBatchId` geordneten direkten IDs, jede
  `{ relation, sourceKey, targetKey, ownerBatch }`-Begründung und die topologische Closurefolge
  mit Current zuletzt. Der positive Test verlangt bytegleich bei zwei Läufen: Writeranker ohne
  Markerzeilen, Contractanker ohne Markerzeilen, genau einen Task-4-Block, danach einen literal
  Datenblock mit allen Asset-/Digest-/Dependency-/Relations-/Pair-Fixture-Owner-Werten und kein Match auf den erkannten,
  nicht zeilenübergreifenden Template-Platzhalter `/\x3c[A-Za-z][A-Za-z0-9_-]*\x3e/`.
  Derselbe reale Test verlangt ausdrücklich, dass die unveränderten literalen Vertragsstellen
  `<svg`, `owner.ordinal < consumer.ordinal` und TypeScript-`=>` im erzeugten Brief vorhanden
  und zulässig sind; keine davon ist ein Template-Platzhalter.
- [ ] Ergänze fail-closed REDs für fehlende/duplizierte/verschachtelte oder vertauschte Anker,
  einen Descriptor-Batch-Task außerhalb 4–93, keine oder zwei passende Taskheadings,
  Tasknummer/Batch-ID-Mismatch,
  fehlende oder zusätzliche Asset-/Digestzeile, abweichende Discovery-Digests, unsortierte/
  duplizierte Dependencies, fehlenden Relation→Owner-Zeugen, falsche Closure und jeden nach
  Expansion verbleibenden, von `/\x3c[A-Za-z][A-Za-z0-9_-]*\x3e/` erkannten
  Template-Platzhalter. Der Scanner darf weder über einen Zeilenumbruch noch über Markdown- oder
  TypeScript-Inhalt bis zu einem späteren `>` greifen. Ein existierendes oder symlinkendes
  Ausgabefile, unbekanntes Argument und fehlender Wert scheitern vor dem Schreiben.
- [ ] Teste die erste Grammatik separat gegen den realen Plan: Task-1-Modus konkateniert exakt
  markerfreien Realpath-, Writer- und Contract-Inhalt samt vollständiger 90er Matrix, danach genau
  den Task-1-Block. Er akzeptiert keine Descriptor-/Discovery-/Dependency- oder Attempt-Argumente,
  bewahrt das für die Implementierung erforderliche literal `<id>` und erzeugt bytegleich zweimal
  dieselbe Ausgabe. Ein Test vergleicht sie außerdem bytegleich mit dem von Root gelieferten
  Bootstrap-Brief. Keine Task-2-Zeile und kein Inhalt außerhalb der drei Anker und Task 1 gelangt
  in die Ausgabe.
- [ ] Teste die dritte Grammatik separat: Sie akzeptiert jede kanonische dezimale Attempt-
  Darstellung ab eins, mit Nullen auf mindestens drei Stellen aufgefüllt: `001`…`999`, danach
  `1000`, `1001` und unbegrenzt weiter. Die Grammatik entspricht exakt
  `^(?:00[1-9]|0[1-9][0-9]|[1-9][0-9]{2,})$`, extrahiert ausschließlich Task 95 und behandelt dessen
  `task-95-run-001`, `--task95-attempt 001` und `task-95-attempt-001-brief.md` als kanonische
  Current-Tokens sowie `task-95-run-002`, `--task95-attempt 002` und
  `task-95-attempt-002-brief.md` als kanonische Next-Tokens. Parser, Vorgänger- und
  Nachfolgerberechnung verwenden ausschließlich den exakten kanonischen Dezimalstring und
  `BigInt`: `BigInt(attempt)`, Addition mit `1n` beziehungsweise Subtraktion mit `1n`, danach
  `toString().padStart(3, '0')`; keine Konvertierung in `Number` und damit kein
  `MAX_SAFE_INTEGER`-/Overflow-Limit ist zulässig. Für einen gewählten Attempt `NNN`
  rebasiert sie Current konsistent auf `NNN`, die explizit abgegrenzte direkte Retry-Anweisung in
  einer nicht-kaskadierenden Single-Pass-Substitution konsistent auf `NNN + 1` und fügt den
  konkreten Current-Pfad als erste Zeile ein. Sie verlangt, dass dieses Run-Verzeichnis noch
  nicht existiert und bei jedem Wert größer `001` exakt das direkte Vorgängerverzeichnis
  existiert; sie scannt oder wählt keinen „höchsten/latest“-Run. Sie verändert keine ältere
  Attempt-Directory und verwirft `0`, `000`, `1`, `01`, zusätzliche führende Nullen wie `0001`
  oder `0999`, Vorzeichen, Whitespace, Dezimalpunkte, Lücken, vorhandene Ziele, fehlende
  kanonische `001`-Tokens und jeden verbleibenden erkannten Template-Platzhalter.
  Bei Attempt `001` und jedem Retry folgt unmittelbar nach der einzelnen literal
  Current-Path-Kopfzeile der exakte markerfreie `CORPUS-BRIEF-REALPATH`-Inhalt einschließlich des
  literal ausführbaren Smoke-Befehls; erst danach folgt ausschließlich der auf Current und direkten
  Nachfolger konkretisierte Task-95-Block. Für den real erzeugten Attempt-`002`-Brief verlangt der
  Test nicht-kaskadierend exakt 58 Vorkommen von `task-95-run-002`, ein Vorkommen von
  `task-95-run-003`, je ein Vorkommen von `--task95-attempt 002` und
  `--task95-attempt 003` sowie je zwei Vorkommen von `task-95-attempt-002-brief.md` und
  `task-95-attempt-003-brief.md`. Ein separater Token-Scan weist jeden erkannten Run-, Attempt-
  oder Brief-Token für `001` sowie `004` oder höher ab; außerhalb der explizit abgegrenzten
  direkten Retry-Anweisung und ihres Output-Briefs darf kein Next-Token vorkommen.
- [ ] Schreibe danach `corpus-shards.test.ts`. Der Test importiert die 90 Deskriptoren und löst
  sie ausschließlich gegen das committed `OracleManifest` auf. Er prüft:

  ```ts
  expect(CORPUS_SHARDS).toHaveLength(90);
  expect(CORPUS_SHARDS.map(({ id }) => id)).toEqual(EXPECTED_BATCH_IDS);
  expect(new Set(CORPUS_SHARDS.map(({ id }) => id)).size).toBe(90);

  const resolved = CORPUS_SHARDS.map((shard) => resolveCorpusShard(shard, ORACLE_MANIFEST));
  for (const shard of CORPUS_SHARDS) {
    expect(resolveCorpusSelector(shard.selector, ORACLE_MANIFEST)).toEqual(shard.oracleAssetKeys);
    expect(shard.oracleAssetKeys).toHaveLength(shard.expectedAssetCount);
  }
  const allKeys = resolved.flatMap(({ assets }) => assets.map(({ key }) => key));
  expect(allKeys).toHaveLength(661);
  expect(new Set(allKeys).size).toBe(661);
  expect(new Set(allKeys)).toEqual(new Set(ORACLE_MANIFEST.assets.map(({ key }) => key)));
  expect(resolved.every(({ assets }) => assets.length <= 12)).toBe(true);

  expect(CORPUS_SHARDS.every(({ readonlyDependencies }) =>
    readonlyDependencies.length === 0)).toBe(true);
  ```

- [ ] Ergänze adversariale Mutationen: ein doppeltes Asset, ein fehlendes Asset, ein 13er-Shard,
  ein unbekannter Dateiname, vertauschte 5.8.1-Beispiele und ein zweiter Component-Family-Key im
  selben Shard müssen jeweils mit einem präzisen Fehler scheitern.
- [ ] Task 1 friert ausschließlich Partition, IDs, Selector- und Modulpfade ein. Da die echten
  batchübergreifenden Ziele aller `EXACT_BATCH_RELATIONS` erst aus den geprüften Discoverydaten,
  der Allocation und den vollständigen Contract-/Witness-/Part-/Ownership-Projektionen
  hervorgehen, tragen alle 90 Discovery-Descriptoren in diesem Zwischenstand literal
  `readonlyDependencies: []` sowie für jede der 21 Collections eine kanonisch leere
  `ownedKeys`-Folge mit ihrem frisch berechneten leeren Setdigest. Diese Leeren sind kein finaler
  Batchvertrag: Task 3 ersetzt zuerst alle 90 Owned-Keysets/Setdigests vollständig, baut daraus den
  globalen Ownerindex und ersetzt erst danach die Dependencies durch den minimalen kanonischen
  Owner-Batch-Satz. Kein realer Corpus-Modulimport ist vor dieser Task-3-Finalisierung zulässig. Adversariale
  synthetische Allowlists prüfen bereits hier unbekannte Root-ID, unbekannte oder fehlende
  Dependency-ID, Forward-Edge, Self-Edge, Zyklus und doppelte Dependency-ID mit den stabilen
  Foundation-Fehlercodes. Ein synthetisches Closure-Fixture mit demselben Registry-Key in
  Dependency und Current muss an der bestehenden batchübergreifenden Duplicate-Key-Prüfung
  scheitern; kein Test importiert oder benötigt den finalen Aggregator.
- [ ] Führe beide RED-Suites aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/corpus-shards.test.ts \
    scripts/exact/build-corpus-brief.test.mjs
  ```

  Erwartung: Der Test lädt alle Exporte erfolgreich und FAILt an der konkret benannten
  Verhaltensassertion `expect(CORPUS_SHARDS).toHaveLength(90)` mit `received 0`; zusätzlich zeigt
  der Allowlist-Test Canary statt der erwarteten 90 IDs; der Builder-Test FAILt am benannten
  `RED: corpus brief builder not implemented`. Kein fehlender Export, Syntax-, Import- oder
  Umgebungsfehler gilt als RED.
- [ ] Implementiere den Builder mit byteweisem LF-Parser. Er verlangt je genau ein Paar
  `CORPUS-BRIEF-REALPATH`-, `CORPUS-BRIEF-WRITER`- und `CORPUS-BRIEF-CONTRACT`-Anker außerhalb von
  Fences und extrahiert genau den angeforderten Taskblock bis zum nächsten Taskheading. Task-1-
  Modus entfernt die sechs Markerzeilen, konkateniert Realpath, Writer, Contract und Task 1 in der
  Bootstrap-Reihenfolge und bewahrt das literal `<id>`. Batch-Modus 4–93 entfernt die Writer-/
  Contract-Markerzeilen, ersetzt das aus U+003C, `id` und U+003E bestehende Token ausschließlich
  durch die Descriptor-ID und fügt anschließend den
  kanonischen literal Datenblock ein, prüft Descriptor gegen beide Discovery-Dateien und den
  Dependency-Report, scannt den gesamten Brief ausschließlich mit dem zeilenlokalen exakten
  Platzhaltermuster `/\x3c[A-Za-z][A-Za-z0-9_-]*\x3e/` und schreibt erst
  danach atomar per exklusiv neu angelegter Tempdatei plus Rename. Es gibt keinen Fallback auf
  den installierten `task-brief`, keine Bereichs-/Dateinamenheuristik und keine stillen Defaults.
  Im disjunkten Task-95-Modus liest es zusätzlich ausschließlich den Realpathanker, keine Writer-/
  Contractanker und keine Corpusinputs, sondern erzeugt dessen markerfreien Inhalt plus den
  vollständig konkret auf genau einen absent Attempt rebasierten read-only Task-95-Block samt
  konkret auf den direkten Nachfolger rebasiertem Retry-Befehl. Batch- und Task-95-Modus verwenden
  denselben exakten finalen Platzhalterscan und atomaren Writer; der Task-1-Modus darf wegen seines
  absichtlich zu implementierenden `<id>`-Templates nicht durch diesen Post-Expansion-Scan laufen.
- [ ] Implementiere die obigen Typen und die Tabelle aus Abschnitt 7 als immutable Daten. Ein Descriptor speichert
  neben `ordinal`, strukturiertem Selector, `expectedAssetCount` und den literal
  `readonlyDependencies`-IDs sämtliche von
  `ExactBatchDescriptor` verlangten Felder: `version`, `id`, die höchstens eine zugelassene
  `componentFamily`, die literal kanonisch sortierten `oracleAssetKeys`, deren
  `oracleAssetSetDigest`, alle 21 zunächst kanonisch leeren `ownedKeys`-Folgen samt korrekten
  `setDigests` und die fünf festen repo-relativen `modules`-Pfade. Bereichslabels sind
  keine Assetnamen. `resolveCorpusSelector` arbeitet ausschließlich mit dem vollständigen
  committed OracleManifest und dessen Abschnittsparser/Comparator; der Test verlangt für jeden
  Descriptor exakte Gleichheit seines gespeicherten Keysets mit der frisch aufgelösten
  Selectormenge. Weder dieser Selector-Resolver noch `resolveCorpusShard` liest ein Batchmodul,
  Staging oder den Root-Aggregator.
- [ ] Registriere dieselben 90 Discovery-Descriptoren mit zunächst jeweils literal leerem
  `readonlyDependencies` und vollständig vorhandenen, zunächst leeren 21
  `ownedKeys`-/`setDigests`-Feldern in der Root-owned Loader-Allowlist von
  `batch-staging-registry.ts`, ohne irgendeinen Shard statisch zu importieren. Jeder Eintrag nennt
  nur seine literal ID und die fünf fest validierten repo-relativen Datendateien
  `{manifest,components,assets,parts,plans}.ts`. Der Test baut den globalen Ownerindex über die
  komplette Allowlist und erwartet 21 leere, digestkonsistente Ownershipmaps. Der produktive
  `loadStagedExactBatchClosure(id)` darf für Corpus erst nach Task 3 laufen; dann baut er zuerst
  den globalen Index aus den 90 finalisierten Descriptoren, löst danach die vollständige
  Descriptor-Closure auf und lädt erst dann ihre Module in topologischer Reihenfolge.
  Der Test beweist, dass die Allowlist-Keymenge exakt `EXPECTED_BATCH_IDS` ist, eine
  91. ID einschließlich `base-formation-canary` fail-closed abgelehnt wird und kein Eintrag auf
  `cases.test.ts`, den Root-Aggregator oder einen frei konstruierten Pfad zeigt. Der initiale
  Foundation-Canary-Descriptor wird dabei vollständig durch die 90 Corpus-Descriptoren ersetzt.
  `corpus-shards.ts` importiert den Staging-Loader, Batchmodule und den Aggregator nicht;
  ausschließlich die Root-owned Staging-Datei darf die committed Descriptorfolge lesen. Damit
  bleiben `corpusShard`, `resolveCorpusSelector` und `resolveCorpusShard` unabhängig von Loader,
  Modulen und Aggregator.
- [ ] Stage exakt `corpus-shards.ts`, `corpus-shards.test.ts`, `batch-staging-registry.ts` und die
  beiden Builderdateien. Rufe anschließend den seit Integration Task 0 verfügbaren
  Registry-All-Pfad auf. Sein `verifyRepositorySourceBoundary(...)` muss zuerst den aktuellen
  HEAD und danach dieselben fünf staged Blobs erfolgreich prüfen; beabsichtigte getrackte
  Produkt-SVGs/-PNGs bleiben erlaubt, während bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettete
  Original-XML-/Generator-/Kommentar-/Namespace-Fragmente und Oracle-/Evidence-Pfade
  fail-closed scheitern:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/corpus-shards.ts \
    packages/catalog/src/exact/corpus-shards.test.ts \
    packages/catalog/src/exact/batch-staging-registry.ts \
    scripts/exact/build-corpus-brief.mjs \
    scripts/exact/build-corpus-brief.test.mjs
  rtk mise exec -- pnpm cli conformance:review --all \
    --reference-root ../../taktische-zeichen \
    --out out/exact-reference/review/pre-allocation
  ```

  Erwartung: Exit 0 gegen den aktuellen HEAD und die fünf staged Blobs; kein Oraclepfad wird
  ausgegeben oder persistiert. Dieser Root-Scan verwendet bewusst nicht die Sechs-Datei-
  Batch-Allowlist.
- [ ] Führe GREEN aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/corpus-shards.test.ts \
    scripts/exact/build-corpus-brief.test.mjs
  rtk pnpm typecheck
  rtk git diff --check
  ```

  Erwartung: alle Exit 0; 90 Shards, 661/661 disjunkte echte Asset-Keys, Maximum 12.
- [ ] Committe ausschließlich diese fünf Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/corpus-shards.ts \
    packages/catalog/src/exact/corpus-shards.test.ts \
    packages/catalog/src/exact/batch-staging-registry.ts \
    scripts/exact/build-corpus-brief.mjs \
    scripts/exact/build-corpus-brief.test.mjs
  rtk git -c core.fsmonitor=false commit -m "test(exact): freeze corpus shard partition"
  ```

### Verbindliche Rulings zur Zählung

Der Discovery-Zwischenbericht enthielt zwei mechanische Fehler. Maßgeblich sind die echten,
kanonisch aufgelösten Schlüssel:

1. Unter `5.8.1` existieren 21 Dateien: 18 Nicht-Beispiele und drei Beispiele. Daher wird
   disjunkt `12 + 6 + 3`, nicht `12 + 9 + 3`, geteilt.
2. Die getrennt notierten Shards `4.9.1` (1) und `4.10.*` (7) werden als
   `a-4-info-vet` (8) zusammengeführt. Beide Bereiche gehören laut echter
   `CAPABILITY_PICTOGRAMS`-Registry zur selben Component-Family `capabilities`. Der Test prüft das
   gegen die Registry; würde diese Voraussetzung nicht gelten, darf nicht falsch zusammengeführt
   werden. In diesem eingefrorenen Stand gilt sie und ergibt exakt 90 Shards.

Die maschinell gegatete Summe der 90 `expectedAssetCount` ist 661. Eine passende Summe allein
genügt nicht; erst Schlüsselunion, Paar-Disjunktheit und Gleichheit zum OracleManifest bestehen.

## Task 2: read-only Discovery aller 661 Quellen

**Ownership:** Für jeden der 90 Shards ein frischer Discovery-Agent `D-{batch-id}` mit höchstens zwölf
Whole-Assets; diese Agents verändern keine Source-Datei. Bis zu drei read-only Agents dürfen
parallel laufen. Danach prüft je Shard ein anderer Mapping-Reviewer `M-{batch-id}` den vollständigen
Bericht.

Task 2 besitzt absichtlich keine Source-Implementierung und daher keine künstliche RED-Phase. Die
compile-sicheren, bereits grünen Descriptor-/Inspect-Schnittstellen aus Foundation und Task 1
führen hier ausschließlich fail-closed Read-only-Validierungen gegen lokale Evidence aus.

- [ ] Der Root-Orchestrator erzeugt aus `CORPUS_SHARDS` 90 Task-Briefs. Jeder Brief enthält die
  literal aufgelösten Assetdateinamen und SHA-256, die zugelassene Komponentenfamilie, bekannte
  Display-Keys und den lokalen Evidence-Pfad. Kein Agent arbeitet aus einem Bereichslabel.
- [ ] Jeder Brief übergibt den committed Descriptor selbst. Der Inspect-Pfad ruft ausschließlich
  `stagedExactBatchDescriptor(id)` und danach
  `resolveCorpusShard(descriptor, ORACLE_MANIFEST)` auf; Task 2 importiert oder lädt weder ein
  `ExactBatchModule` noch den Staging- oder Root-Aggregator. Damit ist Discovery ausführbar,
  obwohl noch kein Shard implementiert ist.
- [ ] Jeder `D-{batch-id}` validiert vor der Sichtung Dateiname, echten Pfad, Symlink-Grenze und Digest
  gegen das OracleManifest. Er liest alle eigenen SVGs mit dem sicheren Oracleparser und erfasst
  jeden sichtbaren und nichtmalenden Node in Dokumentreihenfolge.
- [ ] Der Root-Orchestrator ersetzt `{batch-id}` vor Dispatch literal durch die jeweilige
  Tabellen-ID und lässt den
  Discovery-Agenten zuerst genau diesen Befehl ausführen:

  ```bash
  rtk pnpm cli conformance:inspect --batch {batch-id} \
    --reference-root ../../taktische-zeichen \
    --out out/exact-reference/discovery/{batch-id}/measurement.json
  ```

  Erwartung: Exit 0 und die Asset-Keymenge des JSON ist exakt die aufgelöste Shardmenge; eine
  fehlende, zusätzliche oder digestabweichende Quelle bricht ab.
- [ ] Für jeden sichtbaren Record protokolliert er native ViewBox, Primitive, kanonische
  Geometrie, Farbe, Fill-Rule, geordnete Transformfolge, Quell-Node-ID, vorgeschlagene Rolle,
  Bounds und Reuse-Fingerprint. Feste Schrift wird als Glyphen-/Laufkontur behandelt, nie als
  Font-Textprimitive.
- [ ] Er schlägt für jeden Record genau einen `PaintOwner` vor. `asset-specific` bleibt nur
  Kandidat; erst Task 3 darf es nach globaler Häufigkeitsprüfung bestätigen.
- [ ] Er erfasst alle isolierbaren Parts, Source-Node-Selectoren, `oracleToPart`, benötigte
  `fixtureToPart`, den passenden ComparisonProfile-Key und den beweisbaren Isolation-Modus.
  Okklusion oder unklarer Paint-Order erzwingt `leave-one-out`.
- [ ] Er ordnet jeden bestehenden Coverage-/Display-Key exakt einem Whole- oder Part-Vorschlag
  und genau einem Asset zu. Die 19 Part-Displays erhalten keine erfundene Ganzdarstellung.
- [ ] Ein lokales Tool darf strukturierte Kandidaten ausschließlich unter
  `out/exact-reference/discovery/{batch-id}/candidate-ir/` erzeugen. Der Agent übernimmt nichts blind
  und schreibt nie Source, Approval oder Attestation aus dem Orakel um.
- [ ] `M-{batch-id}` öffnet jedes Original und vergleicht den Bericht Node für Node. Er prüft besonders
  Compound-Subpath-Reihenfolge, implizites Schwarz, Varianten, Transformreihenfolge, Maskenränder,
  feste Glyphen und die vollständige Zuordnung aller Paint-Records. Stichproben sind verboten.
- [ ] `M-{batch-id}` schreibt nur
  `out/exact-reference/discovery/{batch-id}/review.json` mit einer Zeile je Oracle-Paint-Record und je
  vorgeschlagenem Part. Fehlende oder beanstandete Zeilen gehen an einen neuen Discovery-Fix-
  Agenten; derselbe Reviewer prüft danach erneut.
- [ ] Task 2 ist erst fertig, wenn alle 90 `measurement.json` und `review.json` vorliegen, deren
  Asset-Key-Union exakt 661 ist und die Paint-Record-Union je Asset exakt der Parserausgabe
  entspricht.

## Task 3: Component-/Fixture-Allokation für exakt 413 Keys einfrieren

**Ownership:** Ein frischer Allocation-Agent besitzt ausschließlich `component-allocation.ts`,
`component-allocation.test.ts`, die Descriptorquelle `corpus-shards.ts` samt
`corpus-shards.test.ts`, die Root-Allowlist `batch-staging-registry.ts` und die von Foundation
typisierten, noch nicht finalisierten `oracle-ownership-manifest.ts`/
`oracle-ownership-manifest.test.ts`. Er konsumiert die 90 freigegebenen Discovery-Berichte und
verändert keinen Batch. Nach diesem Task sind alle sieben Dateien ab Task 4 immutable.

**Files:**

- Create: `packages/catalog/src/exact/component-allocation.ts`
- Create: `packages/catalog/src/exact/component-allocation.test.ts`
- Modify: `packages/catalog/src/exact/corpus-shards.ts`
- Modify: `packages/catalog/src/exact/corpus-shards.test.ts`
- Modify: `packages/catalog/src/exact/batch-staging-registry.ts`
- Modify: `packages/catalog/src/exact/oracle-ownership-manifest.ts`
- Modify: `packages/catalog/src/exact/oracle-ownership-manifest.test.ts`

**Interfaces:**

- Consumes: `CORPUS_SHARDS`, das vollständige globale `ORACLE_MANIFEST` samt
  Abschnittsparser/Comparator, den Foundation-Export
  `compareExactBatchId(left: ExactBatchId, right: ExactBatchId): number`, den 413er
  `PAINT_COMPONENT_REGISTRY`, `REFERENCE_COMPONENT_CONTEXT_SET` als totalen
  `ReferenceComponentContextSet/v1`,
  `REACHABLE_BUILDER_CONTEXT_SET`, `COMPOSITION_CONTRACT_REGISTRY`, alle geprüften
  Discovery-Witnesses sowie `ComponentKey`,
  `ComponentFixtureKey`, `ComponentContextKey`, `ReferenceComponentContextAccess`,
  `ReferenceComponentContextOwnershipRecord`, `ReferenceComponentContextOwnershipV1`,
  `deriveReferenceComponentContextOwnership(referenceSet, componentFixtures, ownerIndex)`,
  `OraclePartKey`, `OracleOwnershipEntry` und
  die gebrandeten `CompositionContractKey`, `CompositionContractCaseKey` und
  `CompositionWitnessEdgeKey` aus Foundation. Für die Dependencyableitung konsumiert es
  ausschließlich Foundation-
  `batchOwnedRelationTargets(current)`,
  `buildStagedExactBatchOwnershipIndex(descriptors)` und
  `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)`. Es konsumiert ausdrücklich keinen bereits
  befüllten `ORACLE_OWNERSHIP_MANIFEST` und keinen Batch-Aggregator.
- Produces:

  ```ts
  export interface ComponentFixtureAllocation {
    readonly fixture: ComponentFixtureKey;
    readonly variant: ExactComponentVariantKey;
    readonly component: ComponentKey;
    readonly context: ComponentContextKey;
    readonly access: ReferenceComponentContextAccess;
    readonly family: PaintComponentFamily;
    readonly batch: ExactBatchId;
    readonly oraclePart: OraclePartKey;
    readonly contracts: readonly CompositionContractKey[];
    readonly contractCases: readonly CompositionContractCaseKey[];
    readonly witnesses: readonly CompositionWitnessEdgeKey[];
  }

  export interface ExpectedDirectBatchOwners {
    readonly batch: ExactBatchId;
    readonly owners: readonly ExactBatchId[];
  }

  export const COMPONENT_FIXTURE_ALLOCATION: readonly ComponentFixtureAllocation[];
  export const EXPECTED_DIRECT_BATCH_OWNERS: readonly ExpectedDirectBatchOwners[];
  export const ORACLE_OWNERSHIP_MANIFEST: FinalOracleOwnershipManifest;
  export function componentFixturesOwnedBy(batch: ExactBatchId): readonly ComponentFixtureAllocation[];
  export function assertCorpusBatchDependencies(
    current: ExactBatchModule,
    descriptor: ExactBatchDescriptor,
    fullOwnerIndex: StagedExactBatchOwnershipIndex,
  ): void;
  export function assertCompleteComponentAllocation(
    allocation: readonly ComponentFixtureAllocation[],
  ): void;
  ```

  Pair-Ownership wird nicht als Allocation-Tabelle oder 22. Batchcollection exportiert. Der
  Task-3-Test ruft exakt
  `deriveReferenceComponentContextOwnership(REFERENCE_COMPONENT_CONTEXT_SET,
  componentFixtures, fullOwnerIndex)` auf. Der Helper verbindet jedes totale Pair bijektiv mit
  genau einer Fixture und löst deren Owner ausschließlich aus
  `StagedExactBatchOwnershipIndex.componentFixtures` auf. Sein einziges Resultat ist
  `ReferenceComponentContextOwnershipV1` mit `version:
  'ReferenceComponentContextOwnership/v1'`, kanonisch nach
  `(component,context,fixture,owner)` sortierten, duplikatfreien
  `ReferenceComponentContextOwnershipRecord`s und `digestInput`. SHA-256 über ausschließlich
  dieses `digestInput` ist der erwartete Freshness-Wert
  `referenceComponentContextOwnershipDigest`; `ComponentFixtureAllocation.batch` ist nur die
  geprüfte Schreib-/Routingzuordnung und muss dem abgeleiteten Descriptor-Owner entsprechen, darf
  ihn aber nicht autorisieren oder als zweite Ownershipquelle ersetzen.

Die Registry-Familien sind exakt und disjunkt:

| Component-Family | erwartete Keys |
|---|---:|
| `kind` | 19 |
| `organization` | 9 |
| `technicalFill` | 13 |
| `strength` | 4 |
| `administrativeLevel` | 6 |
| `functionRole` | 25 |
| `capabilities` | 88 |
| `bodyMarks` | 64 |
| `vehicleCategory` | 8 |
| `bodyVariant` | 10 |
| `technicalHeadMark` | 1 |
| `states` | 61 |
| `comms` | 48 |
| `damage` | 28 |
| `wildfire` | 14 |
| `leadership` | 10 |
| `water-rescue-personnel` | 5 |
| **Summe** | **413** |

- [ ] Lege zuerst in `component-allocation.ts` compile-sichere, unproduktive Schalen für sämtliche
  oben genannten Exporte an: `COMPONENT_FIXTURE_ALLOCATION` ist typisiert leer,
  `EXPECTED_DIRECT_BATCH_OWNERS` ist typisiert leer,
  `componentFixturesOwnedBy` liefert eine typisiert leere Folge und
  `assertCorpusBatchDependencies` wirft
  `RED: corpus dependency derivation not implemented`; außerhalb dieses Wrappers entsteht keine
  zweite Dependencyableitung neben `batchOwnedRelationTargets(current)` plus
  `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)`.
  `assertCompleteComponentAllocation` weist die leere Allocation mit einem präzisen
  Incomplete-Allocation-Fehler ab. Das von Foundation bereitgestellte
  `oracle-ownership-manifest.ts` bleibt in diesem Schritt unverändert als gültig typisierter
  Draft importierbar. Keine Fixture, Ownership oder produktive Allokationsregel wird vor RED
  implementiert.
- [ ] Schreibe danach Tests für die exakte Union der obigen Schlüsselsets, ihre Disjunktheit,
  mindestens eine Fixture und einen Referenzzeugen je Component-Key sowie die totale
  `(component, context)`-Mengengleichheit zwischen allen registrierten Fixtures und
  `REFERENCE_COMPONENT_CONTEXT_SET.pairs`. Pinne dessen disjunkte Partition exakt: Die
  `public-builder`-Paarprojektion ist mengengleich
  `REACHABLE_BUILDER_CONTEXT_SET.pairs`, besitzt aber keine fest gepinnte Paarzahl; nur ihre
  eindeutige Component-Key-Projektion ist 247. Exakt 151 `reference-only`-Reihen gehören zu
  `states`/`comms`/`damage`/`wildfire`, exakt 15 `direct-carrier`-Reihen zu
  `leadership`/`water-rescue-personnel`, je genau eine literal nichtöffentliche Reihe pro Key.
  Die Total-Paarzahl ist deshalb dynamisch
  `REACHABLE_BUILDER_CONTEXT_SET.pairs.length + 151 + 15`; nur ihre eindeutige
  Component-Key-Projektion ist exakt 413. Nur die `public-builder`-Teilmenge darf
  Builder-erreichbar sein. Prüfe
  außerdem höchstens eine Familie je Batch. `contracts`, `contractCases` und `witnesses` bleiben dabei durchgängig als
  `CompositionContractKey`, `CompositionContractCaseKey` beziehungsweise
  `CompositionWitnessEdgeKey` gebrandet; Compile-REDs weisen plain Strings und vertauschte
  Brandtypen ab. Jede Allocation übernimmt `context` und `access` bytegleich aus ihrem totalen
  Pair, nennt exakt dessen einen Contract und ContractCase und mindestens einen Witness; die
  Projektionen von Fixtures, ComponentCases, ContractCases und Witness-Contracts schließen
  jeweils auf die totale Paarmenge. Der eine Aufruf von
  `deriveReferenceComponentContextOwnership(REFERENCE_COMPONENT_CONTEXT_SET,
  componentFixtures, fullOwnerIndex)` ergibt genau einen kanonischen
  `ReferenceComponentContextOwnershipRecord` pro Total-Pair; Duplicate, fehlender
  Owner, ein handgeschriebenes Pair-Owner-Feld oder Digestdrift in
  `referenceComponentContextOwnershipDigest` scheitern fail-closed.
- [ ] Ersetze im vorhandenen `oracle-ownership-manifest.test.ts` die Foundation-Draft-Erwartung
  durch den finalen Vertrag: finaler Status, identischer 661er Oracle-Setdigest, genau ein Eintrag
  je sichtbarem Oracle-Paint-Record, disjunkte Shardprojektionen, jeder Component-Owner in der
  413er Registry und jede assetspezifische Ausnahme global einmalig und explizit begründet.
- [ ] Schreibe Mutationsfälle für einen im totalen Set fehlenden Component-Key, einen doppelten
  Fixture-Key, einen fehlenden `reference-only`-/`direct-carrier`-Kontext, einen fälschlich
  builder-erreichbaren `reference-only`-/`direct-carrier`-Kontext, einen unbekannten Kontext, einen
  fehlenden Witness, eine fehlende/zusätzliche/umgebogene Pair↔Fixture-Zuordnung, einen vom
  Descriptor-/Manifest-Owner abweichenden Allocation-Batch, ein eingebettetes Pair-Ownership-
  Feld, einen falschen `referenceComponentContextOwnershipDigest`, zwei Familien im selben
  Batch, einen Component-semantischen `asset-specific`-Leaf und einen wiederverwendeten
  `asset-specific`-Fingerprint. Jeder Fall muss fail-closed scheitern.
- [ ] Schreibe synthetische RED-Fälle für die Dependency-Semantik. Baue dafür vollständig
  typisierte Current-/Dependency-Module und vollständige Descriptoren mit allen 21
  `ownedKeys`-/`setDigests`-Folgen. Erzeuge den globalen Full-Owner-Index ausschließlich aus
  diesen Descriptoren, bevor irgendeine Closure geladen oder Registry aufgebaut wird. Ein
  Witness-only-Current referenziert den fremden Owner
  ausschließlich über `compositionWitnessEdges.oraclePart`/`exactAsset`; ein zweiter Current
  referenziert ausschließlich einen dependency-owned `OraclePart` über seinen Display-/Case-
  Endpunkt. Ergänze einen Ownership-only-Endpunkt und erwarte ebenfalls den Owner.
  `batchOwnedRelationTargets(current)` muss die
  jeweiligen gespeicherten Ziele ohne Registryauflösung extrahieren;
  `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` muss jeweils exakt
  `[dependency.id]` liefern, obwohl keine externe ComponentFixture-Planinstanz existiert. Damit laufen alle `EXACT_BATCH_RELATIONS`
  einschließlich Contract/Witness, Part/Profile/Mask, Ownership, Asset/Display, Plan/Trace/
  UseEdge, FeatureContract und Casebeziehungen durch denselben Foundation-Helper.
- [ ] Pinne daneben Minimalität und Graphordnung: zwei beliebige Relationsendpunkte auf denselben
  Owner ergeben eine ID; ein nur transitiver Vorfahr wird nicht deklariert; eine zusätzliche ID
  ohne Current-Relationsendpunkt ist `REDUNDANT_STAGED_DEPENDENCY`; eine fehlende direkte
  Owner-ID ist `MISSING_STAGED_DEPENDENCY`; ein Owner mit nicht kleinerer Tabellenordinal ist
  `FORWARD_BATCH_DEPENDENCY`; und der vollständige Descriptorgraph ist
  azyklisch/topologisch auflösbar. Die direkte ID-Folge ist ausschließlich mit
  `compareExactBatchId` sortiert. Der `MISSING_STAGED_DEPENDENCY`-Test entfernt die echte
  Owner-ID aus `currentDescriptor.readonlyDependencies`, lässt dessen vollständige Owned-Keysets
  aber im globalen Descriptorindex stehen und erwartet den Fehler, obwohl das Owner-Modul nicht
  in die dadurch aufgelöste Closure geladen wird.
- [ ] Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/component-allocation.test.ts \
    packages/catalog/src/exact/corpus-shards.test.ts \
    packages/catalog/src/exact/oracle-ownership-manifest.test.ts
  ```

  Erwartung: Beide Module und alle benannten Exporte laden erfolgreich. Der Allocation-Test FAILt
  an der konkret benannten `413`-gegen-`0`-Keymengenassertion, der Ownership-Test an
  `status === 'final'` gegen den gültigen Foundation-Draft und der ersetzte Shardtest an der
  leeren statt der erwarteten minimalen Dependency-Menge. Fehlende Exporte, Syntax-, Import-
  oder Infrastrukturfehler gelten nicht als RED.
- [ ] Baue aus allen geprüften Discovery-Berichten zuerst den globalen Reuse-Fingerprint-Index.
  Erzeuge und exportiere danach `ORACLE_OWNERSHIP_MANIFEST` aus
  `oracle-ownership-manifest.ts`: jeder Oracle-Paint-Record erhält genau einen
  erwarteten Component-Occurrence-Key oder eine einzeln begründete, registrierte
  Asset-specific-Ausnahme mit Häufigkeit eins.
- [ ] Bewahre dabei die Foundation-Richtung: `oracle-ownership-manifest.ts` importiert weiterhin
  ausschließlich `ORACLE_MANIFEST` und Schema-Typen, niemals `component-allocation.ts`,
  `corpus-shards.ts`, Batchmodule, Plans, Traces, Staging oder Root-Aggregator. Nur Tests
  vergleichen die unabhängig erzeugten globalen und späteren Shardprojektionen.
- [ ] Allokiere jede Pair-Fassung der dynamischen totalen
  `REFERENCE_COMPONENT_CONTEXT_SET.pairs`-Menge als eigene Component-Fixture deterministisch; nur
  ihre eindeutige Component-Key-Projektion ist 413. Für ihre echte Registry-Family gelten nur
  ausschließlich die mit derselben Family in den konsumierten `CORPUS_SHARDS` gespeicherten
  Shards. Unter diesen Family-Shards, deren Ordinal nicht nach
  dem frühesten Consumer/Witness liegt, gewinnt zunächst die kleinste bereits zugewiesene
  Fixture-Zahl, dann Ordinal, dann Batch-ID. Existiert kein solcher Shard, ist die Partition
  ungültig; ein Agent darf weder einen zweiten Family-Key einschmuggeln noch einen Forward-
  Fallback erzeugen. Speichere pro Allocation auch den eindeutigen Variant-Key, damit reale
  Planinstanzen ohne Dateinamen- oder Komponentenheuristik zur Fixture aufgelöst werden.
- [ ] Alle totalen Referenzkontexte desselben Component-Keys dürfen auf mehrere Shards derselben Family verteilt
  werden, aber jeder `ComponentFixtureKey` besitzt exakt einen Shard. Der Shard besitzt auch die
  kanonische OraclePart-/Witness-Evidence dieser Fixture; das vollständige Whole-Asset kann einem
  anderen Shard gehören.
- [ ] Führe die Descriptor- und Dependency-Finalisierung strikt zweiphasig aus. Phase 1 erzeugt
  aus den 90 geprüften Discovery-Berichten, der finalen Allocation und den registrierten
  Contract-/Witness-/Part-/Ownership-Vorgaben zuerst für **alle 90** Descriptoren die vollständigen,
  kanonisch sortierten 21 `ownedKeys`-Folgen samt frisch berechneten `setDigests`; zu diesem
  Zeitpunkt dürfen `readonlyDependencies` noch leer sein. Validiere alle Descriptoren gemeinsam
  und baue genau einmal den globalen `StagedExactBatchOwnershipIndex`, bevor eine Closure oder ein
  Batchmodul geladen wird. Duplicate Owner, fehlende Collection, falscher Setdigest oder Owner auf
  unbekannte ID scheitern in Phase 1.
- [ ] Phase 2 erzeugt für jeden Batch die vollständige, nur im Test gehaltene typisierte
  Current-Projektion aller 21 Collections und ruft darauf genau einmal
  `batchOwnedRelationTargets(current)` auf. Löse diese tatsächlichen Relationsziele ausschließlich
  mit `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` gegen den in Phase 1
  eingefrorenen globalen Index auf. Speichere das Ergebnis
  als `EXPECTED_DIRECT_BATCH_OWNERS` und aktualisiere danach `CORPUS_SHARDS` sowie die
  Root-Allowlist: Jeder Descriptor erhält exakt diese mit `compareExactBatchId` sortierte direkte
  Owner-Menge. Es gibt keine Kante zum bloß vorherigen Tabellenbatch, keinen Sicherheits-/
  Präfix-Supersatz, keine Ableitung aus einer bereits geladenen Closure und keine Corpus-eigene
  Relationsteilmenge. Die transitive Closure entsteht erst danach ausschließlich durch Auflösung
  dieser minimalen direkten Kanten. Verbinde danach jedes
  `REFERENCE_COMPONENT_CONTEXT_SET.pairs`-Element bijektiv mit seiner ComponentFixture, indem du
  genau einmal `deriveReferenceComponentContextOwnership(REFERENCE_COMPONENT_CONTEXT_SET,
  componentFixtures, fullOwnerIndex)` aufrufst. Der Helper löst den Owner aus den nun
  vollständigen Descriptor-Owned-Keysets auf und liefert exakt
  `{ version, records, digestInput }`; ausschließlich `digestInput` wird zum
  `referenceComponentContextOwnershipDigest` gehasht. Weder `records` noch ein Ownerfeld werden
  als weitere Batchcollection oder als Bestandteil des Reference-Context-Sets gespeichert.
- [ ] Schreibe danach für jeden Batch zwei kanonische, ignorierte Briefinputs unter
  `out/exact-reference/brief-inputs/{batch-id}/`. `descriptor.json` hat Version
  `CorpusBriefDescriptor/v1`, Tasknummer, Batch-ID, Family, sechs literal Dateipfade, die
  vollständigen 21 `ownedKeys`-Folgen samt `setDigests` und exakt die sortierte
  `{ key, sha256 }`-Assetfolge aus Descriptor plus `ORACLE_MANIFEST`. Zusätzlich bindet es die
  mit `deriveReferenceComponentContextOwnership` abgeleiteten, auf diesen Batch projizierten
  `ReferenceComponentContextOwnershipRecord`s und den globalen
  `referenceComponentContextOwnershipDigest`; es enthält kein handgeschriebenes Pair-Owner-Feld.
  `dependencies.json` hat Version `CorpusBriefDependencies/v1`, dieselbe Batch-ID, exakt
  `readonlyDependencies`, alle sortierten
  `{ relation, sourceKey, targetKey, ownerBatch }`-Zeugen aus den 21 Relationsprojektionen und
  die durch `resolveStagedBatchDependencyOrder` bestimmte Closure-ID-Folge mit Current zuletzt.
  Beide Dateien tragen Digests von `measurement.json` und `review.json`; der Builder verlangt
  Byte-/Mengengleichheit statt Pfadvertrauen. Diese Inputs bleiben lokal, werden nie staged und
  sind keine zweite produktive Descriptorquelle.
- [ ] Ersetze in `corpus-shards.test.ts` ausdrücklich die temporäre Task-1-Assertion
  `readonlyDependencies.length === 0` durch die finalen Minimal-DAG-Assertions:

  ```ts
  import { compareExactBatchId } from './batch-contract.js';
  import { EXPECTED_DIRECT_BATCH_OWNERS } from './component-allocation.js';

  const ordinalById = new Map(CORPUS_SHARDS.map(({ id, ordinal }) => [id, ordinal]));
  const expectedOwnersByBatch = new Map(
    EXPECTED_DIRECT_BATCH_OWNERS.map(({ batch, owners }) => [batch, owners]),
  );
  expect([...expectedOwnersByBatch.keys()].sort(compareExactBatchId))
    .toEqual([...EXPECTED_BATCH_IDS].sort(compareExactBatchId));
  for (const shard of CORPUS_SHARDS) {
    const expected = expectedOwnersByBatch.get(shard.id)!;
    expect(shard.readonlyDependencies).toEqual(expected);
    expect([...shard.readonlyDependencies]).toEqual(
      [...shard.readonlyDependencies].sort(compareExactBatchId),
    );
    for (const dependency of shard.readonlyDependencies) {
      expect(ordinalById.get(dependency)!).toBeLessThan(shard.ordinal);
    }
    expect(resolveStagedBatchDependencyOrder(shard.id, CORPUS_SHARDS).at(-1)?.id)
      .toBe(shard.id);
  }
  ```

  Ergänze in `component-allocation.test.ts` den Relations- und Comparator-RED mit direkten
  Foundation-Aufrufen:

  ```ts
  import {
    batchOwnedRelationTargets,
    compareExactBatchId,
    directForeignExactBatchOwners,
  } from './batch-contract.js';
  import { buildStagedExactBatchOwnershipIndex } from './batch-staging-registry.js';

  const syntheticShard = (
    id: ExactBatchId,
    ordinal: number,
    readonlyDependencies: readonly ExactBatchId[] = [],
  ): CorpusShardDescriptor => ({
    ...CORPUS_SHARDS[0]!, id, ordinal, readonlyDependencies,
  });
  const multiOwnerDescriptors = [
    syntheticShard('z-owner', 1),
    syntheticShard('a-owner', 2),
    syntheticShard('multi-owner-consumer', 3, ['a-owner', 'z-owner']),
  ];
  const multiOwner = makeRelationOnlyDependencyFixture({
    current: 'multi-owner-consumer',
    directOwnersInTableOrder: ['z-owner', 'a-owner'],
  });
  const fullOwnerIndex = buildStagedExactBatchOwnershipIndex(
    multiOwner.completeDescriptors,
  );
  const relationTargets = batchOwnedRelationTargets(multiOwner.current);
  const canonicalOwners = directForeignExactBatchOwners(
    multiOwner.current, fullOwnerIndex, relationTargets,
  );
  expect(canonicalOwners).toEqual(['a-owner', 'z-owner']);
  expect(canonicalOwners).not.toEqual(['z-owner', 'a-owner']);
  expect([...canonicalOwners].sort(compareExactBatchId)).toEqual(canonicalOwners);
  expect(resolveStagedBatchDependencyOrder(
    'multi-owner-consumer', multiOwnerDescriptors,
  ).map(({ id }) => id)).toEqual(['a-owner', 'z-owner', 'multi-owner-consumer']);
  ```

  `makeRelationOnlyDependencyFixture` ist ein lokaler Testhelper in
  `component-allocation.test.ts`: Er baut vollständige, contractgültige Module und vollständige
  Descriptoren samt allen 21 Owned-Keysets/Setdigests; der globale Ownerindex entsteht vor jeder
  optionalen Closure-/Registrybildung ausschließlich aus `completeDescriptors`. Der Helper kann den einzigen fremden Endpunkt wahlweise als Witness-
  `oraclePart`/`exactAsset`, dependency-owned Display-/Case-`oraclePart`, Ownership-Ziel oder als
  zwei verschiedenartige Ziele auf zwei Owner legen. Er ruft keine Corpus-Ableitungsfunktion auf;
  die Assertion testet unmittelbar den Foundation-Helper. Die Witness-only-, Part-only- und
  Ownership-only-Fixtures müssen jeweils `[dependency.id]` liefern. Eine weitere Mutation entfernt
  `dependency.id` nur aus der Current-Dependencyliste und löst die Closure erneut auf: Obwohl das
  Dependency-Modul nun ungeladen bleibt, identifiziert der unveränderte globale Descriptorindex
  dessen Relationsziel und `assertCorpusBatchDependencies` meldet stabil
  `MISSING_STAGED_DEPENDENCY`.

  Dieser Mehrfach-Owner-Fall unterscheidet absichtlich Tabellenordinal `[z-owner, a-owner]` von
  der Foundation-Reihenfolge `[a-owner, z-owner]` und pinnt dadurch dieselbe Kanonisierung für
  direkte Dependencies und freie Closure-Ties. Ergänze die globale DFS-Assertion auf
  Azyklizität und `owner.ordinal < consumer.ordinal` ausschließlich als Forward-Edge-Gate sowie
  Mutationstests für fehlende, zusätzliche, transitive-redundante und Forward-Dependencies. Nach
  Task 3 darf nirgends eine „alle Dependencies leer“-Assertion verbleiben.
- [ ] Erzeuge mit dem echten Builder drei repräsentative vollständige Briefs – erster
  Family-Batch, `family: null` und letzter Batch – aus den gerade geschriebenen realen Inputs:

  ```bash
  rtk node scripts/exact/build-corpus-brief.mjs --plan docs/superpowers/plans/2026-09-04-exact-reference-corpus.md --task 4 --descriptor out/exact-reference/brief-inputs/a-1-base-01/descriptor.json --measurement out/exact-reference/discovery/a-1-base-01/measurement.json --mapping-review out/exact-reference/discovery/a-1-base-01/review.json --dependencies out/exact-reference/brief-inputs/a-1-base-01/dependencies.json --out .superpowers/sdd/exact-reference-corpus/task-4-a-1-base-01-brief.md
  rtk node scripts/exact/build-corpus-brief.mjs --plan docs/superpowers/plans/2026-09-04-exact-reference-corpus.md --task 8 --descriptor out/exact-reference/brief-inputs/a-2-lines/descriptor.json --measurement out/exact-reference/discovery/a-2-lines/measurement.json --mapping-review out/exact-reference/discovery/a-2-lines/review.json --dependencies out/exact-reference/brief-inputs/a-2-lines/dependencies.json --out .superpowers/sdd/exact-reference-corpus/task-8-a-2-lines-brief.md
  rtk node scripts/exact/build-corpus-brief.mjs --plan docs/superpowers/plans/2026-09-04-exact-reference-corpus.md --task 93 --descriptor out/exact-reference/brief-inputs/a-n-all/descriptor.json --measurement out/exact-reference/discovery/a-n-all/measurement.json --mapping-review out/exact-reference/discovery/a-n-all/review.json --dependencies out/exact-reference/brief-inputs/a-n-all/dependencies.json --out .superpowers/sdd/exact-reference-corpus/task-93-a-n-all-brief.md
  ```

  Erwartung: alle Exit 0, jede Ausgabe enthält genau Writeranker-Inhalt, gemeinsamen Vertrag,
  einen literal Datenblock und genau den angeforderten Taskblock;
  `rtk rg '\x3c[A-Za-z][A-Za-z0-9_-]*\x3e'` findet in
  keiner Ausgabe etwas. Der Root-SDD-Orchestrator verwendet anschließend ausschließlich diesen
  Builder für alle Tasks 4–93. Die drei Ausgaben enthalten dagegen weiterhin jeweils literal
  `<svg`, `owner.ordinal < consumer.ordinal` und `=>`; das belegt, dass der Scanner nicht
  zeilenübergreifend über normalen Markdown-/TypeScript-Inhalt greift.
- [ ] Reproduziere außerdem nach der Builder-Implementierung den Root-Bootstrap in einem neuen
  absent Ziel mit `--task 1` und vergleiche beide Dateien bytegleich. Der produktive Builder ist
  danach die einzige Quelle für weitere Task-1-Briefs und für Task 95 einschließlich Attempt
  `001`; der installierte generische `task-brief` bleibt für Tasks 1 und 95 verboten.
- [ ] `assertCorpusBatchDependencies` ist der persistente spätere Batch-Gate. Er ruft für den
  **tatsächlichen** Current-Batch ausschließlich
  `batchOwnedRelationTargets(current)` und danach
  `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` auf, wobei
  `fullOwnerIndex` vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebaut wurde.
  Er vergleicht dessen
  Ergebnis exakt mit `EXPECTED_DIRECT_BATCH_OWNERS` und
  `ExactBatchDescriptor.readonlyDependencies` und weist jede fehlende oder zusätzliche ID ab.
  Dadurch zählen alle batch-owned Ziele sämtlicher `EXACT_BATCH_RELATIONS`, auch wenn keine
  ComponentFixture-Referenz existiert. Jeder Task 4–93 ruft dieses Gate in `cases.test.ts` mit
  globalem Full-Owner-Index auf; die geladene Closure darf niemals Quelle der Dependencyableitung
  sein. Batch-IDs stehen nur im
  `ExactBatchDescriptor.readonlyDependencies`; `ExactBatchManifest` besitzt kein Dependencyfeld.
- [ ] Stage exakt die sieben Root-Dateien dieses Tasks und führe vor dem Commit den seit
  Integration Task 0 vorhandenen Registry-All-Scanner aus. Er muss den aktuellen HEAD sowie alle
  staged Blobs mit derselben präzisen Leakpolicy aus Task 1 grün prüfen; die Sechs-Datei-
  Batch-Allowlist gilt hier nicht:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/component-allocation.ts \
    packages/catalog/src/exact/component-allocation.test.ts \
    packages/catalog/src/exact/corpus-shards.ts \
    packages/catalog/src/exact/corpus-shards.test.ts \
    packages/catalog/src/exact/batch-staging-registry.ts \
    packages/catalog/src/exact/oracle-ownership-manifest.ts \
    packages/catalog/src/exact/oracle-ownership-manifest.test.ts
  rtk mise exec -- pnpm cli conformance:review --all \
    --reference-root ../../taktische-zeichen \
    --out out/exact-reference/review/allocation
  ```

  Erwartung: Exit 0; intended getrackte Produkt-SVGs/-PNGs bleiben zulässig, Oraclebytes oder
  -digests, eingebettetes Original-XML/Generator/Kommentare/Namespaces und Oracle-/Evidence-
  Pfade scheitern.
- [ ] Führe GREEN aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/component-allocation.test.ts \
    packages/catalog/src/exact/corpus-shards.test.ts \
    packages/catalog/src/exact/oracle-ownership-manifest.test.ts
  rtk pnpm typecheck
  rtk git diff --check
  ```

  Erwartung: 413/413 eindeutige Component-Keys und die dynamische totale
  Component-Kontext-Paarmenge: exakt alle `REACHABLE_BUILDER_CONTEXT_SET.pairs` plus 151
  `reference-only`- plus 15 `direct-carrier`-Reihen; die öffentliche Paarprojektion besitzt 247
  eindeutige Component-Keys, aber keine fest angenommene Paarzahl. Alle Fixtures/Cases/Witnesses und
  der aus `deriveReferenceComponentContextOwnership(REFERENCE_COMPONENT_CONTEXT_SET,
  componentFixtures, fullOwnerIndex).digestInput` berechnete
  `referenceComponentContextOwnershipDigest` sind vollständig; keine
  Lücke, Überschneidung, fälschliche Builder-Erreichbarkeit oder Forward-Edge. Alle 90
  Descriptoren besitzen vor Closure-Laden vollständige Owned-Keysets/Setdigests; die direkten
  Dependencies stammen nur aus Current-Relationtargets plus globalem Full-Owner-Index.
- [ ] Committe ausschließlich Allocation, beide Tests und das finalisierte Ownership-Manifest:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/component-allocation.ts \
    packages/catalog/src/exact/component-allocation.test.ts \
    packages/catalog/src/exact/corpus-shards.ts \
    packages/catalog/src/exact/corpus-shards.test.ts \
    packages/catalog/src/exact/batch-staging-registry.ts \
    packages/catalog/src/exact/oracle-ownership-manifest.ts \
    packages/catalog/src/exact/oracle-ownership-manifest.test.ts
  rtk git -c core.fsmonitor=false commit -m "feat(exact): allocate component fixtures to corpus batches"
  ```

### Task 4: a-1-base-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-1-base-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-1-base-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-1-base-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-1-base-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-1-base-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-1-base-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-1-base-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 3 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-1-base-01`, Selector `range(1.1–1.6)`,
  Component-Allocation ausschließlich `kind` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 6 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-1-base-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-1-base-01: expected 6 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(1.1–1.6)` aufgelösten 6 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-1-base-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 6 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `kind`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-1-base-01/manifest.ts packages/catalog/src/exact/batches/a-1-base-01/components.ts packages/catalog/src/exact/batches/a-1-base-01/assets.ts packages/catalog/src/exact/batches/a-1-base-01/parts.ts packages/catalog/src/exact/batches/a-1-base-01/plans.ts packages/catalog/src/exact/batches/a-1-base-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-1-base-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-1-base-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-1-base-01/manifest.ts packages/catalog/src/exact/batches/a-1-base-01/components.ts packages/catalog/src/exact/batches/a-1-base-01/assets.ts packages/catalog/src/exact/batches/a-1-base-01/parts.ts packages/catalog/src/exact/batches/a-1-base-01/plans.ts packages/catalog/src/exact/batches/a-1-base-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-1-base-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-1-base-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-1-base-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-1-base-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-1-base-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 4 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 5: a-1-base-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-1-base-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-1-base-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-1-base-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-1-base-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-1-base-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-1-base-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-1-base-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 4 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-1-base-02`, Selector `range(1.7–1.14)`,
  Component-Allocation ausschließlich `kind` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 8 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-1-base-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-1-base-02: expected 8 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(1.7–1.14)` aufgelösten 8 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-1-base-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 8 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `kind`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-1-base-02/manifest.ts packages/catalog/src/exact/batches/a-1-base-02/components.ts packages/catalog/src/exact/batches/a-1-base-02/assets.ts packages/catalog/src/exact/batches/a-1-base-02/parts.ts packages/catalog/src/exact/batches/a-1-base-02/plans.ts packages/catalog/src/exact/batches/a-1-base-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-1-base-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-1-base-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-1-base-02/manifest.ts packages/catalog/src/exact/batches/a-1-base-02/components.ts packages/catalog/src/exact/batches/a-1-base-02/assets.ts packages/catalog/src/exact/batches/a-1-base-02/parts.ts packages/catalog/src/exact/batches/a-1-base-02/plans.ts packages/catalog/src/exact/batches/a-1-base-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-1-base-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-1-base-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-1-base-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-1-base-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-1-base-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 5 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 6: a-2-org

**Files:**

- Create: `packages/catalog/src/exact/batches/a-2-org/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-2-org/components.ts`
- Create: `packages/catalog/src/exact/batches/a-2-org/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-2-org/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-2-org/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-2-org/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-2-org').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 5 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-2-org`, Selector `range(2.1–2.8)`,
  Component-Allocation ausschließlich `organization` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 8 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-2-org/cases.test.ts
  ```

  Erwartung: FAIL mit `a-2-org: expected 8 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(2.1–2.8)` aufgelösten 8 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-2-org/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 8 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `organization`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-2-org/manifest.ts packages/catalog/src/exact/batches/a-2-org/components.ts packages/catalog/src/exact/batches/a-2-org/assets.ts packages/catalog/src/exact/batches/a-2-org/parts.ts packages/catalog/src/exact/batches/a-2-org/plans.ts packages/catalog/src/exact/batches/a-2-org/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-2-org --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-2-org
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-2-org/manifest.ts packages/catalog/src/exact/batches/a-2-org/components.ts packages/catalog/src/exact/batches/a-2-org/assets.ts packages/catalog/src/exact/batches/a-2-org/parts.ts packages/catalog/src/exact/batches/a-2-org/plans.ts packages/catalog/src/exact/batches/a-2-org/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-2-org --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-2-org
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-2-org reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-2-org --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-2-org
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 6 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 7: a-2-colour

**Files:**

- Create: `packages/catalog/src/exact/batches/a-2-colour/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-2-colour/components.ts`
- Create: `packages/catalog/src/exact/batches/a-2-colour/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-2-colour/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-2-colour/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-2-colour/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-2-colour').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 6 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-2-colour`, Selector `range(2.9–2.13)`,
  Component-Allocation ausschließlich `technicalFill` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 5 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-2-colour/cases.test.ts
  ```

  Erwartung: FAIL mit `a-2-colour: expected 5 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(2.9–2.13)` aufgelösten 5 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-2-colour/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 5 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `technicalFill`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-2-colour/manifest.ts packages/catalog/src/exact/batches/a-2-colour/components.ts packages/catalog/src/exact/batches/a-2-colour/assets.ts packages/catalog/src/exact/batches/a-2-colour/parts.ts packages/catalog/src/exact/batches/a-2-colour/plans.ts packages/catalog/src/exact/batches/a-2-colour/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-2-colour --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-2-colour
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-2-colour/manifest.ts packages/catalog/src/exact/batches/a-2-colour/components.ts packages/catalog/src/exact/batches/a-2-colour/assets.ts packages/catalog/src/exact/batches/a-2-colour/parts.ts packages/catalog/src/exact/batches/a-2-colour/plans.ts packages/catalog/src/exact/batches/a-2-colour/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-2-colour --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-2-colour
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-2-colour reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-2-colour --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-2-colour
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 7 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 8: a-2-lines

**Files:**

- Create: `packages/catalog/src/exact/batches/a-2-lines/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-2-lines/components.ts`
- Create: `packages/catalog/src/exact/batches/a-2-lines/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-2-lines/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-2-lines/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-2-lines/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-2-lines').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 7 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-2-lines`, Selector `range(2.14–2.20)`,
  Component-Allocation `none` und die geprüfte lokale Discovery-Evidence. Alle sieben Collections
  in `BATCH_COMPONENTS` sind semantisch leer; einzigartige IR liegt ausschließlich in
  `BATCH_ASSETS.assetFragments`, und jeder assetspezifische Paint-Owner wird durch
  `BATCH_PARTS.ownershipEntries` plus `ORACLE_OWNERSHIP_MANIFEST` gegatet.
- Produces: genau ein `ExactBatchModule` mit 8 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-2-lines/cases.test.ts
  ```

  Erwartung: FAIL mit `a-2-lines: expected 8 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(2.14–2.20)` aufgelösten 8 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-2-lines/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 8 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family `none`; alle sieben `BATCH_COMPONENTS`-Collections sind leer, einzigartige
  `assetFragments` vollständig und sämtliche assetspezifischen Ownership-Einträge zentral gegatet.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-2-lines/manifest.ts packages/catalog/src/exact/batches/a-2-lines/components.ts packages/catalog/src/exact/batches/a-2-lines/assets.ts packages/catalog/src/exact/batches/a-2-lines/parts.ts packages/catalog/src/exact/batches/a-2-lines/plans.ts packages/catalog/src/exact/batches/a-2-lines/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-2-lines --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-2-lines
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-2-lines/manifest.ts packages/catalog/src/exact/batches/a-2-lines/components.ts packages/catalog/src/exact/batches/a-2-lines/assets.ts packages/catalog/src/exact/batches/a-2-lines/parts.ts packages/catalog/src/exact/batches/a-2-lines/plans.ts packages/catalog/src/exact/batches/a-2-lines/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-2-lines --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-2-lines
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-2-lines reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-2-lines --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-2-lines
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 8 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 9: a-3-unclaimed

**Files:**

- Create: `packages/catalog/src/exact/batches/a-3-unclaimed/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-3-unclaimed/components.ts`
- Create: `packages/catalog/src/exact/batches/a-3-unclaimed/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-3-unclaimed/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-3-unclaimed/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-3-unclaimed/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-3-unclaimed').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 8 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-3-unclaimed`, Selector `prefix(3.)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 7 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-3-unclaimed/cases.test.ts
  ```

  Erwartung: FAIL mit `a-3-unclaimed: expected 7 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `prefix(3.)` aufgelösten 7 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-3-unclaimed/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 7 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-3-unclaimed/manifest.ts packages/catalog/src/exact/batches/a-3-unclaimed/components.ts packages/catalog/src/exact/batches/a-3-unclaimed/assets.ts packages/catalog/src/exact/batches/a-3-unclaimed/parts.ts packages/catalog/src/exact/batches/a-3-unclaimed/plans.ts packages/catalog/src/exact/batches/a-3-unclaimed/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-3-unclaimed --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-3-unclaimed
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-3-unclaimed/manifest.ts packages/catalog/src/exact/batches/a-3-unclaimed/components.ts packages/catalog/src/exact/batches/a-3-unclaimed/assets.ts packages/catalog/src/exact/batches/a-3-unclaimed/parts.ts packages/catalog/src/exact/batches/a-3-unclaimed/plans.ts packages/catalog/src/exact/batches/a-3-unclaimed/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-3-unclaimed --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-3-unclaimed
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-3-unclaimed reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-3-unclaimed --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-3-unclaimed
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 9 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 10: a-4-cbrn

**Files:**

- Create: `packages/catalog/src/exact/batches/a-4-cbrn/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-4-cbrn/components.ts`
- Create: `packages/catalog/src/exact/batches/a-4-cbrn/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-4-cbrn/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-4-cbrn/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-4-cbrn/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-4-cbrn').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 9 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-4-cbrn`, Selector `prefix(4.1.)`,
  Component-Allocation ausschließlich `capabilities` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 11 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-cbrn/cases.test.ts
  ```

  Erwartung: FAIL mit `a-4-cbrn: expected 11 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `prefix(4.1.)` aufgelösten 11 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-cbrn/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 11 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `capabilities`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-cbrn/manifest.ts packages/catalog/src/exact/batches/a-4-cbrn/components.ts packages/catalog/src/exact/batches/a-4-cbrn/assets.ts packages/catalog/src/exact/batches/a-4-cbrn/parts.ts packages/catalog/src/exact/batches/a-4-cbrn/plans.ts packages/catalog/src/exact/batches/a-4-cbrn/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-4-cbrn --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-4-cbrn
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-cbrn/manifest.ts packages/catalog/src/exact/batches/a-4-cbrn/components.ts packages/catalog/src/exact/batches/a-4-cbrn/assets.ts packages/catalog/src/exact/batches/a-4-cbrn/parts.ts packages/catalog/src/exact/batches/a-4-cbrn/plans.ts packages/catalog/src/exact/batches/a-4-cbrn/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-4-cbrn --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-cbrn
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-4-cbrn reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-4-cbrn --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-cbrn
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 10 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 11: a-4-care

**Files:**

- Create: `packages/catalog/src/exact/batches/a-4-care/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-4-care/components.ts`
- Create: `packages/catalog/src/exact/batches/a-4-care/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-4-care/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-4-care/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-4-care/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-4-care').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 10 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-4-care`, Selector `prefix(4.2.)`,
  Component-Allocation ausschließlich `capabilities` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 5 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-care/cases.test.ts
  ```

  Erwartung: FAIL mit `a-4-care: expected 5 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `prefix(4.2.)` aufgelösten 5 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-care/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 5 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `capabilities`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-care/manifest.ts packages/catalog/src/exact/batches/a-4-care/components.ts packages/catalog/src/exact/batches/a-4-care/assets.ts packages/catalog/src/exact/batches/a-4-care/parts.ts packages/catalog/src/exact/batches/a-4-care/plans.ts packages/catalog/src/exact/batches/a-4-care/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-4-care --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-4-care
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-care/manifest.ts packages/catalog/src/exact/batches/a-4-care/components.ts packages/catalog/src/exact/batches/a-4-care/assets.ts packages/catalog/src/exact/batches/a-4-care/parts.ts packages/catalog/src/exact/batches/a-4-care/plans.ts packages/catalog/src/exact/batches/a-4-care/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-4-care --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-care
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-4-care reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-4-care --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-care
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 11 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 12: a-4-fire

**Files:**

- Create: `packages/catalog/src/exact/batches/a-4-fire/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-4-fire/components.ts`
- Create: `packages/catalog/src/exact/batches/a-4-fire/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-4-fire/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-4-fire/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-4-fire/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-4-fire').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 11 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-4-fire`, Selector `prefix(4.3.)`,
  Component-Allocation ausschließlich `capabilities` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 6 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-fire/cases.test.ts
  ```

  Erwartung: FAIL mit `a-4-fire: expected 6 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `prefix(4.3.)` aufgelösten 6 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-fire/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 6 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `capabilities`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-fire/manifest.ts packages/catalog/src/exact/batches/a-4-fire/components.ts packages/catalog/src/exact/batches/a-4-fire/assets.ts packages/catalog/src/exact/batches/a-4-fire/parts.ts packages/catalog/src/exact/batches/a-4-fire/plans.ts packages/catalog/src/exact/batches/a-4-fire/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-4-fire --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-4-fire
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-fire/manifest.ts packages/catalog/src/exact/batches/a-4-fire/components.ts packages/catalog/src/exact/batches/a-4-fire/assets.ts packages/catalog/src/exact/batches/a-4-fire/parts.ts packages/catalog/src/exact/batches/a-4-fire/plans.ts packages/catalog/src/exact/batches/a-4-fire/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-4-fire --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-fire
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-4-fire reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-4-fire --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-fire
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 12 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 13: a-4-recon

**Files:**

- Create: `packages/catalog/src/exact/batches/a-4-recon/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-4-recon/components.ts`
- Create: `packages/catalog/src/exact/batches/a-4-recon/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-4-recon/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-4-recon/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-4-recon/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-4-recon').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 12 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-4-recon`, Selector `prefix(4.4.)`,
  Component-Allocation ausschließlich `capabilities` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 3 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-recon/cases.test.ts
  ```

  Erwartung: FAIL mit `a-4-recon: expected 3 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `prefix(4.4.)` aufgelösten 3 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-recon/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 3 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `capabilities`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-recon/manifest.ts packages/catalog/src/exact/batches/a-4-recon/components.ts packages/catalog/src/exact/batches/a-4-recon/assets.ts packages/catalog/src/exact/batches/a-4-recon/parts.ts packages/catalog/src/exact/batches/a-4-recon/plans.ts packages/catalog/src/exact/batches/a-4-recon/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-4-recon --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-4-recon
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-recon/manifest.ts packages/catalog/src/exact/batches/a-4-recon/components.ts packages/catalog/src/exact/batches/a-4-recon/assets.ts packages/catalog/src/exact/batches/a-4-recon/parts.ts packages/catalog/src/exact/batches/a-4-recon/plans.ts packages/catalog/src/exact/batches/a-4-recon/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-4-recon --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-recon
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-4-recon reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-4-recon --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-recon
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 13 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 14: a-4-rescue

**Files:**

- Create: `packages/catalog/src/exact/batches/a-4-rescue/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-4-rescue/components.ts`
- Create: `packages/catalog/src/exact/batches/a-4-rescue/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-4-rescue/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-4-rescue/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-4-rescue/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-4-rescue').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 13 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-4-rescue`, Selector `prefix(4.5.)`,
  Component-Allocation ausschließlich `capabilities` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 8 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-rescue/cases.test.ts
  ```

  Erwartung: FAIL mit `a-4-rescue: expected 8 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `prefix(4.5.)` aufgelösten 8 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-rescue/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 8 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `capabilities`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-rescue/manifest.ts packages/catalog/src/exact/batches/a-4-rescue/components.ts packages/catalog/src/exact/batches/a-4-rescue/assets.ts packages/catalog/src/exact/batches/a-4-rescue/parts.ts packages/catalog/src/exact/batches/a-4-rescue/plans.ts packages/catalog/src/exact/batches/a-4-rescue/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-4-rescue --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-4-rescue
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-rescue/manifest.ts packages/catalog/src/exact/batches/a-4-rescue/components.ts packages/catalog/src/exact/batches/a-4-rescue/assets.ts packages/catalog/src/exact/batches/a-4-rescue/parts.ts packages/catalog/src/exact/batches/a-4-rescue/plans.ts packages/catalog/src/exact/batches/a-4-rescue/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-4-rescue --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-rescue
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-4-rescue reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-4-rescue --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-rescue
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 14 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 15: a-4-medical

**Files:**

- Create: `packages/catalog/src/exact/batches/a-4-medical/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-4-medical/components.ts`
- Create: `packages/catalog/src/exact/batches/a-4-medical/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-4-medical/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-4-medical/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-4-medical/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-4-medical').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 14 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-4-medical`, Selector `prefix(4.6.)`,
  Component-Allocation ausschließlich `capabilities` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 6 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-medical/cases.test.ts
  ```

  Erwartung: FAIL mit `a-4-medical: expected 6 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `prefix(4.6.)` aufgelösten 6 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-medical/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 6 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `capabilities`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-medical/manifest.ts packages/catalog/src/exact/batches/a-4-medical/components.ts packages/catalog/src/exact/batches/a-4-medical/assets.ts packages/catalog/src/exact/batches/a-4-medical/parts.ts packages/catalog/src/exact/batches/a-4-medical/plans.ts packages/catalog/src/exact/batches/a-4-medical/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-4-medical --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-4-medical
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-medical/manifest.ts packages/catalog/src/exact/batches/a-4-medical/components.ts packages/catalog/src/exact/batches/a-4-medical/assets.ts packages/catalog/src/exact/batches/a-4-medical/parts.ts packages/catalog/src/exact/batches/a-4-medical/plans.ts packages/catalog/src/exact/batches/a-4-medical/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-4-medical --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-medical
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-4-medical reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-4-medical --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-medical
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 15 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 16: a-4-tech-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-4-tech-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-4-tech-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-4-tech-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-4-tech-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-4-tech-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-4-tech-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-4-tech-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 15 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-4-tech-01`, Selector `range(4.7.1–4.7.10)`,
  Component-Allocation ausschließlich `capabilities` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 11 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-tech-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-4-tech-01: expected 11 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(4.7.1–4.7.10)` aufgelösten 11 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-tech-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 11 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `capabilities`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-tech-01/manifest.ts packages/catalog/src/exact/batches/a-4-tech-01/components.ts packages/catalog/src/exact/batches/a-4-tech-01/assets.ts packages/catalog/src/exact/batches/a-4-tech-01/parts.ts packages/catalog/src/exact/batches/a-4-tech-01/plans.ts packages/catalog/src/exact/batches/a-4-tech-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-4-tech-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-4-tech-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-tech-01/manifest.ts packages/catalog/src/exact/batches/a-4-tech-01/components.ts packages/catalog/src/exact/batches/a-4-tech-01/assets.ts packages/catalog/src/exact/batches/a-4-tech-01/parts.ts packages/catalog/src/exact/batches/a-4-tech-01/plans.ts packages/catalog/src/exact/batches/a-4-tech-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-4-tech-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-tech-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-4-tech-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-4-tech-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-tech-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 16 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 17: a-4-tech-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-4-tech-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-4-tech-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-4-tech-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-4-tech-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-4-tech-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-4-tech-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-4-tech-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 16 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-4-tech-02`, Selector `range(4.7.11–4.7.20)`,
  Component-Allocation ausschließlich `capabilities` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 10 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-tech-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-4-tech-02: expected 10 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(4.7.11–4.7.20)` aufgelösten 10 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-tech-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 10 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `capabilities`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-tech-02/manifest.ts packages/catalog/src/exact/batches/a-4-tech-02/components.ts packages/catalog/src/exact/batches/a-4-tech-02/assets.ts packages/catalog/src/exact/batches/a-4-tech-02/parts.ts packages/catalog/src/exact/batches/a-4-tech-02/plans.ts packages/catalog/src/exact/batches/a-4-tech-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-4-tech-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-4-tech-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-tech-02/manifest.ts packages/catalog/src/exact/batches/a-4-tech-02/components.ts packages/catalog/src/exact/batches/a-4-tech-02/assets.ts packages/catalog/src/exact/batches/a-4-tech-02/parts.ts packages/catalog/src/exact/batches/a-4-tech-02/plans.ts packages/catalog/src/exact/batches/a-4-tech-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-4-tech-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-tech-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-4-tech-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-4-tech-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-tech-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 17 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 18: a-4-tech-03

**Files:**

- Create: `packages/catalog/src/exact/batches/a-4-tech-03/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-4-tech-03/components.ts`
- Create: `packages/catalog/src/exact/batches/a-4-tech-03/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-4-tech-03/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-4-tech-03/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-4-tech-03/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-4-tech-03').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 17 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-4-tech-03`, Selector `range(4.7.21–4.7.28)`,
  Component-Allocation ausschließlich `capabilities` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 8 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-tech-03/cases.test.ts
  ```

  Erwartung: FAIL mit `a-4-tech-03: expected 8 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(4.7.21–4.7.28)` aufgelösten 8 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-tech-03/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 8 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `capabilities`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-tech-03/manifest.ts packages/catalog/src/exact/batches/a-4-tech-03/components.ts packages/catalog/src/exact/batches/a-4-tech-03/assets.ts packages/catalog/src/exact/batches/a-4-tech-03/parts.ts packages/catalog/src/exact/batches/a-4-tech-03/plans.ts packages/catalog/src/exact/batches/a-4-tech-03/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-4-tech-03 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-4-tech-03
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-tech-03/manifest.ts packages/catalog/src/exact/batches/a-4-tech-03/components.ts packages/catalog/src/exact/batches/a-4-tech-03/assets.ts packages/catalog/src/exact/batches/a-4-tech-03/parts.ts packages/catalog/src/exact/batches/a-4-tech-03/plans.ts packages/catalog/src/exact/batches/a-4-tech-03/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-4-tech-03 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-tech-03
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-4-tech-03 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-4-tech-03 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-tech-03
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 18 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 19: a-4-logistics-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-4-logistics-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-4-logistics-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-4-logistics-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-4-logistics-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-4-logistics-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-4-logistics-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-4-logistics-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 18 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-4-logistics-01`, Selector `range(4.8.1–4.8.12)`,
  Component-Allocation ausschließlich `capabilities` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 12 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-logistics-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-4-logistics-01: expected 12 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(4.8.1–4.8.12)` aufgelösten 12 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-logistics-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 12 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `capabilities`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-logistics-01/manifest.ts packages/catalog/src/exact/batches/a-4-logistics-01/components.ts packages/catalog/src/exact/batches/a-4-logistics-01/assets.ts packages/catalog/src/exact/batches/a-4-logistics-01/parts.ts packages/catalog/src/exact/batches/a-4-logistics-01/plans.ts packages/catalog/src/exact/batches/a-4-logistics-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-4-logistics-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-4-logistics-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-logistics-01/manifest.ts packages/catalog/src/exact/batches/a-4-logistics-01/components.ts packages/catalog/src/exact/batches/a-4-logistics-01/assets.ts packages/catalog/src/exact/batches/a-4-logistics-01/parts.ts packages/catalog/src/exact/batches/a-4-logistics-01/plans.ts packages/catalog/src/exact/batches/a-4-logistics-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-4-logistics-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-logistics-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-4-logistics-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-4-logistics-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-logistics-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 19 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 20: a-4-logistics-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-4-logistics-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-4-logistics-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-4-logistics-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-4-logistics-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-4-logistics-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-4-logistics-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-4-logistics-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 19 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-4-logistics-02`, Selector `range(4.8.13–4.8.16)`,
  Component-Allocation ausschließlich `capabilities` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 4 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-logistics-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-4-logistics-02: expected 4 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(4.8.13–4.8.16)` aufgelösten 4 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-logistics-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 4 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `capabilities`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-logistics-02/manifest.ts packages/catalog/src/exact/batches/a-4-logistics-02/components.ts packages/catalog/src/exact/batches/a-4-logistics-02/assets.ts packages/catalog/src/exact/batches/a-4-logistics-02/parts.ts packages/catalog/src/exact/batches/a-4-logistics-02/plans.ts packages/catalog/src/exact/batches/a-4-logistics-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-4-logistics-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-4-logistics-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-logistics-02/manifest.ts packages/catalog/src/exact/batches/a-4-logistics-02/components.ts packages/catalog/src/exact/batches/a-4-logistics-02/assets.ts packages/catalog/src/exact/batches/a-4-logistics-02/parts.ts packages/catalog/src/exact/batches/a-4-logistics-02/plans.ts packages/catalog/src/exact/batches/a-4-logistics-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-4-logistics-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-logistics-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-4-logistics-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-4-logistics-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-logistics-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 20 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 21: a-4-info-vet

**Files:**

- Create: `packages/catalog/src/exact/batches/a-4-info-vet/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-4-info-vet/components.ts`
- Create: `packages/catalog/src/exact/batches/a-4-info-vet/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-4-info-vet/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-4-info-vet/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-4-info-vet/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-4-info-vet').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 20 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-4-info-vet`, Selector `set(4.9.1, 4.10.1–4.10.7)`,
  Component-Allocation ausschließlich `capabilities` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 8 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-info-vet/cases.test.ts
  ```

  Erwartung: FAIL mit `a-4-info-vet: expected 8 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `set(4.9.1, 4.10.1–4.10.7)` aufgelösten 8 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-4-info-vet/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 8 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `capabilities`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-info-vet/manifest.ts packages/catalog/src/exact/batches/a-4-info-vet/components.ts packages/catalog/src/exact/batches/a-4-info-vet/assets.ts packages/catalog/src/exact/batches/a-4-info-vet/parts.ts packages/catalog/src/exact/batches/a-4-info-vet/plans.ts packages/catalog/src/exact/batches/a-4-info-vet/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-4-info-vet --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-4-info-vet
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-4-info-vet/manifest.ts packages/catalog/src/exact/batches/a-4-info-vet/components.ts packages/catalog/src/exact/batches/a-4-info-vet/assets.ts packages/catalog/src/exact/batches/a-4-info-vet/parts.ts packages/catalog/src/exact/batches/a-4-info-vet/plans.ts packages/catalog/src/exact/batches/a-4-info-vet/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-4-info-vet --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-info-vet
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-4-info-vet reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-4-info-vet --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-4-info-vet
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 21 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 22: a-5-chassis-vehicle

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-chassis-vehicle/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-vehicle/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-vehicle/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-vehicle/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-vehicle/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-vehicle/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-chassis-vehicle').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 21 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-chassis-vehicle`, Selector `set(5.1.1, 5.1.1.1–5.1.1.9)`,
  Component-Allocation ausschließlich `vehicleCategory` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 10 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-chassis-vehicle/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-chassis-vehicle: expected 10 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `set(5.1.1, 5.1.1.1–5.1.1.9)` aufgelösten 10 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-chassis-vehicle/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 10 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `vehicleCategory`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-chassis-vehicle/manifest.ts packages/catalog/src/exact/batches/a-5-chassis-vehicle/components.ts packages/catalog/src/exact/batches/a-5-chassis-vehicle/assets.ts packages/catalog/src/exact/batches/a-5-chassis-vehicle/parts.ts packages/catalog/src/exact/batches/a-5-chassis-vehicle/plans.ts packages/catalog/src/exact/batches/a-5-chassis-vehicle/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-chassis-vehicle --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-chassis-vehicle
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-chassis-vehicle/manifest.ts packages/catalog/src/exact/batches/a-5-chassis-vehicle/components.ts packages/catalog/src/exact/batches/a-5-chassis-vehicle/assets.ts packages/catalog/src/exact/batches/a-5-chassis-vehicle/parts.ts packages/catalog/src/exact/batches/a-5-chassis-vehicle/plans.ts packages/catalog/src/exact/batches/a-5-chassis-vehicle/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-chassis-vehicle --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-chassis-vehicle
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-chassis-vehicle reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-chassis-vehicle --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-chassis-vehicle
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 22 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 23: a-5-chassis-trailer

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-chassis-trailer/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-trailer/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-trailer/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-trailer/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-trailer/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-trailer/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-chassis-trailer').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 22 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-chassis-trailer`, Selector `set(5.1.2, 5.1.2.1–5.1.2.5)`,
  Component-Allocation ausschließlich `bodyVariant` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 6 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-chassis-trailer/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-chassis-trailer: expected 6 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `set(5.1.2, 5.1.2.1–5.1.2.5)` aufgelösten 6 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-chassis-trailer/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 6 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyVariant`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-chassis-trailer/manifest.ts packages/catalog/src/exact/batches/a-5-chassis-trailer/components.ts packages/catalog/src/exact/batches/a-5-chassis-trailer/assets.ts packages/catalog/src/exact/batches/a-5-chassis-trailer/parts.ts packages/catalog/src/exact/batches/a-5-chassis-trailer/plans.ts packages/catalog/src/exact/batches/a-5-chassis-trailer/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-chassis-trailer --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-chassis-trailer
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-chassis-trailer/manifest.ts packages/catalog/src/exact/batches/a-5-chassis-trailer/components.ts packages/catalog/src/exact/batches/a-5-chassis-trailer/assets.ts packages/catalog/src/exact/batches/a-5-chassis-trailer/parts.ts packages/catalog/src/exact/batches/a-5-chassis-trailer/plans.ts packages/catalog/src/exact/batches/a-5-chassis-trailer/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-chassis-trailer --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-chassis-trailer
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-chassis-trailer reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-chassis-trailer --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-chassis-trailer
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 23 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 24: a-5-chassis-container

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-chassis-container/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-container/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-container/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-container/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-container/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-container/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-chassis-container').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 23 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-chassis-container`, Selector `set(5.1.3.1–5.1.3.4)`,
  Component-Allocation ausschließlich `bodyVariant` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 4 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-chassis-container/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-chassis-container: expected 4 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `set(5.1.3.1–5.1.3.4)` aufgelösten 4 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-chassis-container/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 4 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyVariant`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-chassis-container/manifest.ts packages/catalog/src/exact/batches/a-5-chassis-container/components.ts packages/catalog/src/exact/batches/a-5-chassis-container/assets.ts packages/catalog/src/exact/batches/a-5-chassis-container/parts.ts packages/catalog/src/exact/batches/a-5-chassis-container/plans.ts packages/catalog/src/exact/batches/a-5-chassis-container/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-chassis-container --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-chassis-container
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-chassis-container/manifest.ts packages/catalog/src/exact/batches/a-5-chassis-container/components.ts packages/catalog/src/exact/batches/a-5-chassis-container/assets.ts packages/catalog/src/exact/batches/a-5-chassis-container/parts.ts packages/catalog/src/exact/batches/a-5-chassis-container/plans.ts packages/catalog/src/exact/batches/a-5-chassis-container/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-chassis-container --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-chassis-container
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-chassis-container reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-chassis-container --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-chassis-container
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 24 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 25: a-5-chassis-air

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-chassis-air/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-air/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-air/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-air/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-air/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-chassis-air/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-chassis-air').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 24 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-chassis-air`, Selector `set(5.1.4.1–5.1.4.3)`,
  Component-Allocation ausschließlich `bodyVariant` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 3 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-chassis-air/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-chassis-air: expected 3 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `set(5.1.4.1–5.1.4.3)` aufgelösten 3 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-chassis-air/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 3 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyVariant`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-chassis-air/manifest.ts packages/catalog/src/exact/batches/a-5-chassis-air/components.ts packages/catalog/src/exact/batches/a-5-chassis-air/assets.ts packages/catalog/src/exact/batches/a-5-chassis-air/parts.ts packages/catalog/src/exact/batches/a-5-chassis-air/plans.ts packages/catalog/src/exact/batches/a-5-chassis-air/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-chassis-air --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-chassis-air
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-chassis-air/manifest.ts packages/catalog/src/exact/batches/a-5-chassis-air/components.ts packages/catalog/src/exact/batches/a-5-chassis-air/assets.ts packages/catalog/src/exact/batches/a-5-chassis-air/parts.ts packages/catalog/src/exact/batches/a-5-chassis-air/plans.ts packages/catalog/src/exact/batches/a-5-chassis-air/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-chassis-air --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-chassis-air
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-chassis-air reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-chassis-air --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-chassis-air
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 25 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 26: a-5-2

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-2/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-2/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-2/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-2/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-2/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-2/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-2').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 25 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-2`, Selector `range(5.2.1–5.2.6)`,
  Component-Allocation `none` und die geprüfte lokale Discovery-Evidence. Alle sieben Collections
  in `BATCH_COMPONENTS` sind semantisch leer; einzigartige IR liegt ausschließlich in
  `BATCH_ASSETS.assetFragments`, und jeder assetspezifische Paint-Owner wird durch
  `BATCH_PARTS.ownershipEntries` plus `ORACLE_OWNERSHIP_MANIFEST` gegatet.
- Produces: genau ein `ExactBatchModule` mit 6 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-2/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-2: expected 6 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(5.2.1–5.2.6)` aufgelösten 6 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-2/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 6 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family `none`; alle sieben `BATCH_COMPONENTS`-Collections sind leer, einzigartige
  `assetFragments` vollständig und sämtliche assetspezifischen Ownership-Einträge zentral gegatet.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-2/manifest.ts packages/catalog/src/exact/batches/a-5-2/components.ts packages/catalog/src/exact/batches/a-5-2/assets.ts packages/catalog/src/exact/batches/a-5-2/parts.ts packages/catalog/src/exact/batches/a-5-2/plans.ts packages/catalog/src/exact/batches/a-5-2/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-2 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-2
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-2/manifest.ts packages/catalog/src/exact/batches/a-5-2/components.ts packages/catalog/src/exact/batches/a-5-2/assets.ts packages/catalog/src/exact/batches/a-5-2/parts.ts packages/catalog/src/exact/batches/a-5-2/plans.ts packages/catalog/src/exact/batches/a-5-2/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-2 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-2
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-2 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-2 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-2
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 26 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 27: a-5-strength

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-strength/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-strength/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-strength/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-strength/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-strength/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-strength/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-strength').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 26 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-strength`, Selector `range(5.4.1–5.4.4)`,
  Component-Allocation ausschließlich `strength` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 4 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-strength/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-strength: expected 4 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(5.4.1–5.4.4)` aufgelösten 4 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-strength/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 4 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `strength`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-strength/manifest.ts packages/catalog/src/exact/batches/a-5-strength/components.ts packages/catalog/src/exact/batches/a-5-strength/assets.ts packages/catalog/src/exact/batches/a-5-strength/parts.ts packages/catalog/src/exact/batches/a-5-strength/plans.ts packages/catalog/src/exact/batches/a-5-strength/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-strength --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-strength
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-strength/manifest.ts packages/catalog/src/exact/batches/a-5-strength/components.ts packages/catalog/src/exact/batches/a-5-strength/assets.ts packages/catalog/src/exact/batches/a-5-strength/parts.ts packages/catalog/src/exact/batches/a-5-strength/plans.ts packages/catalog/src/exact/batches/a-5-strength/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-strength --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-strength
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-strength reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-strength --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-strength
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 27 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 28: a-5-formation

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-formation/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-formation/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-formation/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-formation/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-formation/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-formation/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-formation').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 27 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-formation`, Selector `range(5.5.1–5.5.3)`,
  Component-Allocation `none` und die geprüfte lokale Discovery-Evidence. Alle sieben Collections
  in `BATCH_COMPONENTS` sind semantisch leer; einzigartige IR liegt ausschließlich in
  `BATCH_ASSETS.assetFragments`, und jeder assetspezifische Paint-Owner wird durch
  `BATCH_PARTS.ownershipEntries` plus `ORACLE_OWNERSHIP_MANIFEST` gegatet.
- Produces: genau ein `ExactBatchModule` mit 3 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-formation/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-formation: expected 3 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(5.5.1–5.5.3)` aufgelösten 3 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-formation/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 3 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family `none`; alle sieben `BATCH_COMPONENTS`-Collections sind leer, einzigartige
  `assetFragments` vollständig und sämtliche assetspezifischen Ownership-Einträge zentral gegatet.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-formation/manifest.ts packages/catalog/src/exact/batches/a-5-formation/components.ts packages/catalog/src/exact/batches/a-5-formation/assets.ts packages/catalog/src/exact/batches/a-5-formation/parts.ts packages/catalog/src/exact/batches/a-5-formation/plans.ts packages/catalog/src/exact/batches/a-5-formation/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-formation --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-formation
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-formation/manifest.ts packages/catalog/src/exact/batches/a-5-formation/components.ts packages/catalog/src/exact/batches/a-5-formation/assets.ts packages/catalog/src/exact/batches/a-5-formation/parts.ts packages/catalog/src/exact/batches/a-5-formation/plans.ts packages/catalog/src/exact/batches/a-5-formation/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-formation --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-formation
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-formation reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-formation --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-formation
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 28 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 29: a-5-admin

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-admin/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-admin/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-admin/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-admin/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-admin/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-admin/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-admin').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 28 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-admin`, Selector `range(5.7.1–5.7.6)`,
  Component-Allocation ausschließlich `administrativeLevel` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 6 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-admin/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-admin: expected 6 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(5.7.1–5.7.6)` aufgelösten 6 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-admin/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 6 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `administrativeLevel`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-admin/manifest.ts packages/catalog/src/exact/batches/a-5-admin/components.ts packages/catalog/src/exact/batches/a-5-admin/assets.ts packages/catalog/src/exact/batches/a-5-admin/parts.ts packages/catalog/src/exact/batches/a-5-admin/plans.ts packages/catalog/src/exact/batches/a-5-admin/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-admin --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-admin
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-admin/manifest.ts packages/catalog/src/exact/batches/a-5-admin/components.ts packages/catalog/src/exact/batches/a-5-admin/assets.ts packages/catalog/src/exact/batches/a-5-admin/parts.ts packages/catalog/src/exact/batches/a-5-admin/plans.ts packages/catalog/src/exact/batches/a-5-admin/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-admin --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-admin
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-admin reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-admin --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-admin
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 29 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 30: a-5-state-81

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-state-81/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-81/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-81/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-81/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-81/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-81/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-state-81').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 29 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-state-81`, Selector `non-example(5.8.1)[0..12)`,
  Component-Allocation ausschließlich `states` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 12 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-81/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-state-81: expected 12 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `non-example(5.8.1)[0..12)` aufgelösten 12 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-81/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 12 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `states`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-81/manifest.ts packages/catalog/src/exact/batches/a-5-state-81/components.ts packages/catalog/src/exact/batches/a-5-state-81/assets.ts packages/catalog/src/exact/batches/a-5-state-81/parts.ts packages/catalog/src/exact/batches/a-5-state-81/plans.ts packages/catalog/src/exact/batches/a-5-state-81/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-state-81 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-state-81
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-81/manifest.ts packages/catalog/src/exact/batches/a-5-state-81/components.ts packages/catalog/src/exact/batches/a-5-state-81/assets.ts packages/catalog/src/exact/batches/a-5-state-81/parts.ts packages/catalog/src/exact/batches/a-5-state-81/plans.ts packages/catalog/src/exact/batches/a-5-state-81/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-81 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-81
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-state-81 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-81 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-81
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 30 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 31: a-5-state-82

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-state-82/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-82/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-82/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-82/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-82/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-82/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-state-82').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 30 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-state-82`, Selector `non-example(5.8.1)[12..18)`,
  Component-Allocation ausschließlich `states` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 6 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-82/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-state-82: expected 6 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `non-example(5.8.1)[12..18)` aufgelösten 6 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-82/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 6 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `states`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-82/manifest.ts packages/catalog/src/exact/batches/a-5-state-82/components.ts packages/catalog/src/exact/batches/a-5-state-82/assets.ts packages/catalog/src/exact/batches/a-5-state-82/parts.ts packages/catalog/src/exact/batches/a-5-state-82/plans.ts packages/catalog/src/exact/batches/a-5-state-82/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-state-82 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-state-82
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-82/manifest.ts packages/catalog/src/exact/batches/a-5-state-82/components.ts packages/catalog/src/exact/batches/a-5-state-82/assets.ts packages/catalog/src/exact/batches/a-5-state-82/parts.ts packages/catalog/src/exact/batches/a-5-state-82/plans.ts packages/catalog/src/exact/batches/a-5-state-82/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-82 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-82
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-state-82 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-82 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-82
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 31 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 32: a-5-state-82-examples

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-state-82-examples/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-82-examples/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-82-examples/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-82-examples/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-82-examples/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-82-examples/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-state-82-examples').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 31 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-state-82-examples`, Selector `examples(5.8.1)`,
  Component-Allocation `none` und die geprüfte lokale Discovery-Evidence. Alle sieben Collections
  in `BATCH_COMPONENTS` sind semantisch leer; einzigartige IR liegt ausschließlich in
  `BATCH_ASSETS.assetFragments`, und jeder assetspezifische Paint-Owner wird durch
  `BATCH_PARTS.ownershipEntries` plus `ORACLE_OWNERSHIP_MANIFEST` gegatet.
- Produces: genau ein `ExactBatchModule` mit 3 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-82-examples/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-state-82-examples: expected 3 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `examples(5.8.1)` aufgelösten 3 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-82-examples/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 3 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family `none`; alle sieben `BATCH_COMPONENTS`-Collections sind leer, einzigartige
  `assetFragments` vollständig und sämtliche assetspezifischen Ownership-Einträge zentral gegatet.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-82-examples/manifest.ts packages/catalog/src/exact/batches/a-5-state-82-examples/components.ts packages/catalog/src/exact/batches/a-5-state-82-examples/assets.ts packages/catalog/src/exact/batches/a-5-state-82-examples/parts.ts packages/catalog/src/exact/batches/a-5-state-82-examples/plans.ts packages/catalog/src/exact/batches/a-5-state-82-examples/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-state-82-examples --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-state-82-examples
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-82-examples/manifest.ts packages/catalog/src/exact/batches/a-5-state-82-examples/components.ts packages/catalog/src/exact/batches/a-5-state-82-examples/assets.ts packages/catalog/src/exact/batches/a-5-state-82-examples/parts.ts packages/catalog/src/exact/batches/a-5-state-82-examples/plans.ts packages/catalog/src/exact/batches/a-5-state-82-examples/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-82-examples --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-82-examples
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-state-82-examples reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-82-examples --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-82-examples
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 32 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 33: a-5-state-82x

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-state-82x/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-82x/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-82x/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-82x/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-82x/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-82x/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-state-82x').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 32 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-state-82x`, Selector `prefix(5.8.2.)`,
  Component-Allocation ausschließlich `states` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 4 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-82x/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-state-82x: expected 4 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `prefix(5.8.2.)` aufgelösten 4 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-82x/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 4 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `states`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-82x/manifest.ts packages/catalog/src/exact/batches/a-5-state-82x/components.ts packages/catalog/src/exact/batches/a-5-state-82x/assets.ts packages/catalog/src/exact/batches/a-5-state-82x/parts.ts packages/catalog/src/exact/batches/a-5-state-82x/plans.ts packages/catalog/src/exact/batches/a-5-state-82x/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-state-82x --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-state-82x
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-82x/manifest.ts packages/catalog/src/exact/batches/a-5-state-82x/components.ts packages/catalog/src/exact/batches/a-5-state-82x/assets.ts packages/catalog/src/exact/batches/a-5-state-82x/parts.ts packages/catalog/src/exact/batches/a-5-state-82x/plans.ts packages/catalog/src/exact/batches/a-5-state-82x/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-82x --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-82x
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-state-82x reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-82x --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-82x
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 33 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 34: a-5-state-83

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-state-83/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-83/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-83/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-83/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-83/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-83/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-state-83').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 33 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-state-83`, Selector `prefix(5.8.3.)`,
  Component-Allocation ausschließlich `states` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 3 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-83/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-state-83: expected 3 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `prefix(5.8.3.)` aufgelösten 3 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-83/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 3 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `states`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-83/manifest.ts packages/catalog/src/exact/batches/a-5-state-83/components.ts packages/catalog/src/exact/batches/a-5-state-83/assets.ts packages/catalog/src/exact/batches/a-5-state-83/parts.ts packages/catalog/src/exact/batches/a-5-state-83/plans.ts packages/catalog/src/exact/batches/a-5-state-83/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-state-83 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-state-83
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-83/manifest.ts packages/catalog/src/exact/batches/a-5-state-83/components.ts packages/catalog/src/exact/batches/a-5-state-83/assets.ts packages/catalog/src/exact/batches/a-5-state-83/parts.ts packages/catalog/src/exact/batches/a-5-state-83/plans.ts packages/catalog/src/exact/batches/a-5-state-83/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-83 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-83
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-state-83 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-83 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-83
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 34 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 35: a-5-state-84

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-state-84/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-84/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-84/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-84/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-84/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-84/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-state-84').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 34 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-state-84`, Selector `prefix(5.8.4.)`,
  Component-Allocation ausschließlich `states` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 3 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-84/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-state-84: expected 3 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `prefix(5.8.4.)` aufgelösten 3 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-84/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 3 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `states`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-84/manifest.ts packages/catalog/src/exact/batches/a-5-state-84/components.ts packages/catalog/src/exact/batches/a-5-state-84/assets.ts packages/catalog/src/exact/batches/a-5-state-84/parts.ts packages/catalog/src/exact/batches/a-5-state-84/plans.ts packages/catalog/src/exact/batches/a-5-state-84/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-state-84 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-state-84
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-84/manifest.ts packages/catalog/src/exact/batches/a-5-state-84/components.ts packages/catalog/src/exact/batches/a-5-state-84/assets.ts packages/catalog/src/exact/batches/a-5-state-84/parts.ts packages/catalog/src/exact/batches/a-5-state-84/plans.ts packages/catalog/src/exact/batches/a-5-state-84/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-84 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-84
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-state-84 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-84 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-84
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 35 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 36: a-5-state-85

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-state-85/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-85/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-85/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-85/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-85/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-85/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-state-85').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 35 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-state-85`, Selector `prefix(5.8.5.)`,
  Component-Allocation ausschließlich `states` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 3 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-85/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-state-85: expected 3 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `prefix(5.8.5.)` aufgelösten 3 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-85/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 3 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `states`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-85/manifest.ts packages/catalog/src/exact/batches/a-5-state-85/components.ts packages/catalog/src/exact/batches/a-5-state-85/assets.ts packages/catalog/src/exact/batches/a-5-state-85/parts.ts packages/catalog/src/exact/batches/a-5-state-85/plans.ts packages/catalog/src/exact/batches/a-5-state-85/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-state-85 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-state-85
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-85/manifest.ts packages/catalog/src/exact/batches/a-5-state-85/components.ts packages/catalog/src/exact/batches/a-5-state-85/assets.ts packages/catalog/src/exact/batches/a-5-state-85/parts.ts packages/catalog/src/exact/batches/a-5-state-85/plans.ts packages/catalog/src/exact/batches/a-5-state-85/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-85 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-85
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-state-85 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-85 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-85
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 36 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 37: a-5-state-86

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-state-86/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-86/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-86/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-86/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-86/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-86/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-state-86').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 36 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-state-86`, Selector `prefix(5.8.6.)`,
  Component-Allocation ausschließlich `states` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 4 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-86/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-state-86: expected 4 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `prefix(5.8.6.)` aufgelösten 4 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-86/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 4 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `states`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-86/manifest.ts packages/catalog/src/exact/batches/a-5-state-86/components.ts packages/catalog/src/exact/batches/a-5-state-86/assets.ts packages/catalog/src/exact/batches/a-5-state-86/parts.ts packages/catalog/src/exact/batches/a-5-state-86/plans.ts packages/catalog/src/exact/batches/a-5-state-86/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-state-86 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-state-86
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-86/manifest.ts packages/catalog/src/exact/batches/a-5-state-86/components.ts packages/catalog/src/exact/batches/a-5-state-86/assets.ts packages/catalog/src/exact/batches/a-5-state-86/parts.ts packages/catalog/src/exact/batches/a-5-state-86/plans.ts packages/catalog/src/exact/batches/a-5-state-86/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-86 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-86
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-state-86 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-86 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-86
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 37 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 38: a-5-state-87

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-state-87/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-87/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-87/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-87/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-87/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-87/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-state-87').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 37 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-state-87`, Selector `non-example(5.8.7)`,
  Component-Allocation ausschließlich `states` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 10 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-87/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-state-87: expected 10 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `non-example(5.8.7)` aufgelösten 10 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-87/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 10 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `states`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-87/manifest.ts packages/catalog/src/exact/batches/a-5-state-87/components.ts packages/catalog/src/exact/batches/a-5-state-87/assets.ts packages/catalog/src/exact/batches/a-5-state-87/parts.ts packages/catalog/src/exact/batches/a-5-state-87/plans.ts packages/catalog/src/exact/batches/a-5-state-87/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-state-87 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-state-87
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-87/manifest.ts packages/catalog/src/exact/batches/a-5-state-87/components.ts packages/catalog/src/exact/batches/a-5-state-87/assets.ts packages/catalog/src/exact/batches/a-5-state-87/parts.ts packages/catalog/src/exact/batches/a-5-state-87/plans.ts packages/catalog/src/exact/batches/a-5-state-87/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-87 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-87
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-state-87 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-87 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-87
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 38 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 39: a-5-state-87-examples

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-state-87-examples/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-87-examples/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-87-examples/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-87-examples/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-87-examples/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-87-examples/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-state-87-examples').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 38 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-state-87-examples`, Selector `examples(5.8.7)`,
  Component-Allocation `none` und die geprüfte lokale Discovery-Evidence. Alle sieben Collections
  in `BATCH_COMPONENTS` sind semantisch leer; einzigartige IR liegt ausschließlich in
  `BATCH_ASSETS.assetFragments`, und jeder assetspezifische Paint-Owner wird durch
  `BATCH_PARTS.ownershipEntries` plus `ORACLE_OWNERSHIP_MANIFEST` gegatet.
- Produces: genau ein `ExactBatchModule` mit 4 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-87-examples/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-state-87-examples: expected 4 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `examples(5.8.7)` aufgelösten 4 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-87-examples/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 4 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family `none`; alle sieben `BATCH_COMPONENTS`-Collections sind leer, einzigartige
  `assetFragments` vollständig und sämtliche assetspezifischen Ownership-Einträge zentral gegatet.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-87-examples/manifest.ts packages/catalog/src/exact/batches/a-5-state-87-examples/components.ts packages/catalog/src/exact/batches/a-5-state-87-examples/assets.ts packages/catalog/src/exact/batches/a-5-state-87-examples/parts.ts packages/catalog/src/exact/batches/a-5-state-87-examples/plans.ts packages/catalog/src/exact/batches/a-5-state-87-examples/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-state-87-examples --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-state-87-examples
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-87-examples/manifest.ts packages/catalog/src/exact/batches/a-5-state-87-examples/components.ts packages/catalog/src/exact/batches/a-5-state-87-examples/assets.ts packages/catalog/src/exact/batches/a-5-state-87-examples/parts.ts packages/catalog/src/exact/batches/a-5-state-87-examples/plans.ts packages/catalog/src/exact/batches/a-5-state-87-examples/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-87-examples --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-87-examples
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-state-87-examples reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-87-examples --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-87-examples
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 39 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 40: a-5-state-88-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-state-88-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-88-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-88-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-88-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-88-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-88-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-state-88-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 39 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-state-88-01`, Selector `prefix(5.8.8.)[0..12)`,
  Component-Allocation ausschließlich `states` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 12 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-88-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-state-88-01: expected 12 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `prefix(5.8.8.)[0..12)` aufgelösten 12 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-88-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 12 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `states`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-88-01/manifest.ts packages/catalog/src/exact/batches/a-5-state-88-01/components.ts packages/catalog/src/exact/batches/a-5-state-88-01/assets.ts packages/catalog/src/exact/batches/a-5-state-88-01/parts.ts packages/catalog/src/exact/batches/a-5-state-88-01/plans.ts packages/catalog/src/exact/batches/a-5-state-88-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-state-88-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-state-88-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-88-01/manifest.ts packages/catalog/src/exact/batches/a-5-state-88-01/components.ts packages/catalog/src/exact/batches/a-5-state-88-01/assets.ts packages/catalog/src/exact/batches/a-5-state-88-01/parts.ts packages/catalog/src/exact/batches/a-5-state-88-01/plans.ts packages/catalog/src/exact/batches/a-5-state-88-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-88-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-88-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-state-88-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-88-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-88-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 40 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 41: a-5-state-88-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-state-88-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-88-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-88-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-88-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-88-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-88-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-state-88-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 40 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-state-88-02`, Selector `prefix(5.8.8.)[12..18)`,
  Component-Allocation ausschließlich `states` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 6 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-88-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-state-88-02: expected 6 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `prefix(5.8.8.)[12..18)` aufgelösten 6 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-88-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 6 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `states`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-88-02/manifest.ts packages/catalog/src/exact/batches/a-5-state-88-02/components.ts packages/catalog/src/exact/batches/a-5-state-88-02/assets.ts packages/catalog/src/exact/batches/a-5-state-88-02/parts.ts packages/catalog/src/exact/batches/a-5-state-88-02/plans.ts packages/catalog/src/exact/batches/a-5-state-88-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-state-88-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-state-88-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-88-02/manifest.ts packages/catalog/src/exact/batches/a-5-state-88-02/components.ts packages/catalog/src/exact/batches/a-5-state-88-02/assets.ts packages/catalog/src/exact/batches/a-5-state-88-02/parts.ts packages/catalog/src/exact/batches/a-5-state-88-02/plans.ts packages/catalog/src/exact/batches/a-5-state-88-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-88-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-88-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-state-88-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-88-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-88-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 41 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 42: a-5-state-89

**Files:**

- Create: `packages/catalog/src/exact/batches/a-5-state-89/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-89/components.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-89/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-89/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-89/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-5-state-89/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-5-state-89').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 41 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-5-state-89`, Selector `range(5.8.9.1–5.8.9.4)`,
  Component-Allocation ausschließlich `states` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 4 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-89/cases.test.ts
  ```

  Erwartung: FAIL mit `a-5-state-89: expected 4 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(5.8.9.1–5.8.9.4)` aufgelösten 4 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-5-state-89/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 4 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `states`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-89/manifest.ts packages/catalog/src/exact/batches/a-5-state-89/components.ts packages/catalog/src/exact/batches/a-5-state-89/assets.ts packages/catalog/src/exact/batches/a-5-state-89/parts.ts packages/catalog/src/exact/batches/a-5-state-89/plans.ts packages/catalog/src/exact/batches/a-5-state-89/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-5-state-89 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-5-state-89
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-5-state-89/manifest.ts packages/catalog/src/exact/batches/a-5-state-89/components.ts packages/catalog/src/exact/batches/a-5-state-89/assets.ts packages/catalog/src/exact/batches/a-5-state-89/parts.ts packages/catalog/src/exact/batches/a-5-state-89/plans.ts packages/catalog/src/exact/batches/a-5-state-89/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-89 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-89
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-5-state-89 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-5-state-89 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-5-state-89
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 42 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 43: a-c-1-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-c-1-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-c-1-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-c-1-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-c-1-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-c-1-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-c-1-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-c-1-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 42 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-c-1-01`, Selector `range(C.1.1–C.1.8)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 8 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-c-1-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-c-1-01: expected 8 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(C.1.1–C.1.8)` aufgelösten 8 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-c-1-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 8 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-c-1-01/manifest.ts packages/catalog/src/exact/batches/a-c-1-01/components.ts packages/catalog/src/exact/batches/a-c-1-01/assets.ts packages/catalog/src/exact/batches/a-c-1-01/parts.ts packages/catalog/src/exact/batches/a-c-1-01/plans.ts packages/catalog/src/exact/batches/a-c-1-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-c-1-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-c-1-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-c-1-01/manifest.ts packages/catalog/src/exact/batches/a-c-1-01/components.ts packages/catalog/src/exact/batches/a-c-1-01/assets.ts packages/catalog/src/exact/batches/a-c-1-01/parts.ts packages/catalog/src/exact/batches/a-c-1-01/plans.ts packages/catalog/src/exact/batches/a-c-1-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-c-1-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-c-1-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-c-1-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-c-1-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-c-1-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 43 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 44: a-c-1-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-c-1-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-c-1-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-c-1-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-c-1-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-c-1-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-c-1-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-c-1-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 43 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-c-1-02`, Selector `range(C.1.9–C.1.15)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 7 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-c-1-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-c-1-02: expected 7 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(C.1.9–C.1.15)` aufgelösten 7 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-c-1-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 7 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-c-1-02/manifest.ts packages/catalog/src/exact/batches/a-c-1-02/components.ts packages/catalog/src/exact/batches/a-c-1-02/assets.ts packages/catalog/src/exact/batches/a-c-1-02/parts.ts packages/catalog/src/exact/batches/a-c-1-02/plans.ts packages/catalog/src/exact/batches/a-c-1-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-c-1-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-c-1-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-c-1-02/manifest.ts packages/catalog/src/exact/batches/a-c-1-02/components.ts packages/catalog/src/exact/batches/a-c-1-02/assets.ts packages/catalog/src/exact/batches/a-c-1-02/parts.ts packages/catalog/src/exact/batches/a-c-1-02/plans.ts packages/catalog/src/exact/batches/a-c-1-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-c-1-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-c-1-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-c-1-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-c-1-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-c-1-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 44 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 45: a-c-2-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-c-2-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-c-2-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 44 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-c-2-01`, Selector `range(C.2.1–C.2.12)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 12 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-c-2-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-c-2-01: expected 12 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(C.2.1–C.2.12)` aufgelösten 12 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-c-2-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 12 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-c-2-01/manifest.ts packages/catalog/src/exact/batches/a-c-2-01/components.ts packages/catalog/src/exact/batches/a-c-2-01/assets.ts packages/catalog/src/exact/batches/a-c-2-01/parts.ts packages/catalog/src/exact/batches/a-c-2-01/plans.ts packages/catalog/src/exact/batches/a-c-2-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-c-2-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-c-2-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-c-2-01/manifest.ts packages/catalog/src/exact/batches/a-c-2-01/components.ts packages/catalog/src/exact/batches/a-c-2-01/assets.ts packages/catalog/src/exact/batches/a-c-2-01/parts.ts packages/catalog/src/exact/batches/a-c-2-01/plans.ts packages/catalog/src/exact/batches/a-c-2-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-c-2-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-c-2-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-c-2-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-c-2-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-c-2-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 45 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 46: a-c-2-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-c-2-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-c-2-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 45 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-c-2-02`, Selector `range(C.2.13–C.2.17)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 9 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-c-2-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-c-2-02: expected 9 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(C.2.13–C.2.17)` aufgelösten 9 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-c-2-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 9 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-c-2-02/manifest.ts packages/catalog/src/exact/batches/a-c-2-02/components.ts packages/catalog/src/exact/batches/a-c-2-02/assets.ts packages/catalog/src/exact/batches/a-c-2-02/parts.ts packages/catalog/src/exact/batches/a-c-2-02/plans.ts packages/catalog/src/exact/batches/a-c-2-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-c-2-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-c-2-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-c-2-02/manifest.ts packages/catalog/src/exact/batches/a-c-2-02/components.ts packages/catalog/src/exact/batches/a-c-2-02/assets.ts packages/catalog/src/exact/batches/a-c-2-02/parts.ts packages/catalog/src/exact/batches/a-c-2-02/plans.ts packages/catalog/src/exact/batches/a-c-2-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-c-2-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-c-2-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-c-2-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-c-2-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-c-2-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 46 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 47: a-c-2-03

**Files:**

- Create: `packages/catalog/src/exact/batches/a-c-2-03/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-03/components.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-03/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-03/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-03/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-03/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-c-2-03').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 46 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-c-2-03`, Selector `range(C.2.18–C.2.23)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 10 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-c-2-03/cases.test.ts
  ```

  Erwartung: FAIL mit `a-c-2-03: expected 10 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(C.2.18–C.2.23)` aufgelösten 10 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-c-2-03/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 10 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-c-2-03/manifest.ts packages/catalog/src/exact/batches/a-c-2-03/components.ts packages/catalog/src/exact/batches/a-c-2-03/assets.ts packages/catalog/src/exact/batches/a-c-2-03/parts.ts packages/catalog/src/exact/batches/a-c-2-03/plans.ts packages/catalog/src/exact/batches/a-c-2-03/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-c-2-03 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-c-2-03
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-c-2-03/manifest.ts packages/catalog/src/exact/batches/a-c-2-03/components.ts packages/catalog/src/exact/batches/a-c-2-03/assets.ts packages/catalog/src/exact/batches/a-c-2-03/parts.ts packages/catalog/src/exact/batches/a-c-2-03/plans.ts packages/catalog/src/exact/batches/a-c-2-03/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-c-2-03 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-c-2-03
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-c-2-03 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-c-2-03 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-c-2-03
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 47 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 48: a-c-2-04

**Files:**

- Create: `packages/catalog/src/exact/batches/a-c-2-04/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-04/components.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-04/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-04/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-04/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-04/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-c-2-04').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 47 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-c-2-04`, Selector `range(C.2.24–C.2.28)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 10 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-c-2-04/cases.test.ts
  ```

  Erwartung: FAIL mit `a-c-2-04: expected 10 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(C.2.24–C.2.28)` aufgelösten 10 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-c-2-04/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 10 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-c-2-04/manifest.ts packages/catalog/src/exact/batches/a-c-2-04/components.ts packages/catalog/src/exact/batches/a-c-2-04/assets.ts packages/catalog/src/exact/batches/a-c-2-04/parts.ts packages/catalog/src/exact/batches/a-c-2-04/plans.ts packages/catalog/src/exact/batches/a-c-2-04/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-c-2-04 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-c-2-04
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-c-2-04/manifest.ts packages/catalog/src/exact/batches/a-c-2-04/components.ts packages/catalog/src/exact/batches/a-c-2-04/assets.ts packages/catalog/src/exact/batches/a-c-2-04/parts.ts packages/catalog/src/exact/batches/a-c-2-04/plans.ts packages/catalog/src/exact/batches/a-c-2-04/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-c-2-04 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-c-2-04
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-c-2-04 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-c-2-04 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-c-2-04
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 48 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 49: a-c-2-05

**Files:**

- Create: `packages/catalog/src/exact/batches/a-c-2-05/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-05/components.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-05/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-05/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-05/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-c-2-05/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-c-2-05').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 48 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-c-2-05`, Selector `range(C.2.29–C.2.31)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 3 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-c-2-05/cases.test.ts
  ```

  Erwartung: FAIL mit `a-c-2-05: expected 3 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(C.2.29–C.2.31)` aufgelösten 3 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-c-2-05/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 3 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-c-2-05/manifest.ts packages/catalog/src/exact/batches/a-c-2-05/components.ts packages/catalog/src/exact/batches/a-c-2-05/assets.ts packages/catalog/src/exact/batches/a-c-2-05/parts.ts packages/catalog/src/exact/batches/a-c-2-05/plans.ts packages/catalog/src/exact/batches/a-c-2-05/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-c-2-05 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-c-2-05
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-c-2-05/manifest.ts packages/catalog/src/exact/batches/a-c-2-05/components.ts packages/catalog/src/exact/batches/a-c-2-05/assets.ts packages/catalog/src/exact/batches/a-c-2-05/parts.ts packages/catalog/src/exact/batches/a-c-2-05/plans.ts packages/catalog/src/exact/batches/a-c-2-05/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-c-2-05 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-c-2-05
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-c-2-05 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-c-2-05 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-c-2-05
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 49 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 50: a-d-leadership

**Files:**

- Create: `packages/catalog/src/exact/batches/a-d-leadership/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-d-leadership/components.ts`
- Create: `packages/catalog/src/exact/batches/a-d-leadership/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-d-leadership/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-d-leadership/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-d-leadership/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-d-leadership').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 49 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-d-leadership`, Selector `set(D.1.1, D.2.1–D.2.7, D.3.14–D.3.15)`,
  Component-Allocation ausschließlich `leadership` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 10 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-d-leadership/cases.test.ts
  ```

  Erwartung: FAIL mit `a-d-leadership: expected 10 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `set(D.1.1, D.2.1–D.2.7, D.3.14–D.3.15)` aufgelösten 10 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-d-leadership/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 10 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `leadership`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-d-leadership/manifest.ts packages/catalog/src/exact/batches/a-d-leadership/components.ts packages/catalog/src/exact/batches/a-d-leadership/assets.ts packages/catalog/src/exact/batches/a-d-leadership/parts.ts packages/catalog/src/exact/batches/a-d-leadership/plans.ts packages/catalog/src/exact/batches/a-d-leadership/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-d-leadership --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-d-leadership
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-d-leadership/manifest.ts packages/catalog/src/exact/batches/a-d-leadership/components.ts packages/catalog/src/exact/batches/a-d-leadership/assets.ts packages/catalog/src/exact/batches/a-d-leadership/parts.ts packages/catalog/src/exact/batches/a-d-leadership/plans.ts packages/catalog/src/exact/batches/a-d-leadership/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-d-leadership --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-d-leadership
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-d-leadership reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-d-leadership --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-d-leadership
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 50 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 51: a-d-recipes-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-d-recipes-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-d-recipes-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 50 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-d-recipes-01`, Selector `range(D.1.2–D.1.9)`,
  Component-Allocation ausschließlich `functionRole` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 9 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-d-recipes-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-d-recipes-01: expected 9 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(D.1.2–D.1.9)` aufgelösten 9 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-d-recipes-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 9 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `functionRole`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-d-recipes-01/manifest.ts packages/catalog/src/exact/batches/a-d-recipes-01/components.ts packages/catalog/src/exact/batches/a-d-recipes-01/assets.ts packages/catalog/src/exact/batches/a-d-recipes-01/parts.ts packages/catalog/src/exact/batches/a-d-recipes-01/plans.ts packages/catalog/src/exact/batches/a-d-recipes-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-d-recipes-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-d-recipes-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-d-recipes-01/manifest.ts packages/catalog/src/exact/batches/a-d-recipes-01/components.ts packages/catalog/src/exact/batches/a-d-recipes-01/assets.ts packages/catalog/src/exact/batches/a-d-recipes-01/parts.ts packages/catalog/src/exact/batches/a-d-recipes-01/plans.ts packages/catalog/src/exact/batches/a-d-recipes-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-d-recipes-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-d-recipes-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-d-recipes-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-d-recipes-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-d-recipes-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 51 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 52: a-d-recipes-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-d-recipes-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-d-recipes-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 51 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-d-recipes-02`, Selector `range(D.3.1–D.3.7)`,
  Component-Allocation ausschließlich `functionRole` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 7 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-d-recipes-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-d-recipes-02: expected 7 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(D.3.1–D.3.7)` aufgelösten 7 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-d-recipes-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 7 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `functionRole`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-d-recipes-02/manifest.ts packages/catalog/src/exact/batches/a-d-recipes-02/components.ts packages/catalog/src/exact/batches/a-d-recipes-02/assets.ts packages/catalog/src/exact/batches/a-d-recipes-02/parts.ts packages/catalog/src/exact/batches/a-d-recipes-02/plans.ts packages/catalog/src/exact/batches/a-d-recipes-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-d-recipes-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-d-recipes-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-d-recipes-02/manifest.ts packages/catalog/src/exact/batches/a-d-recipes-02/components.ts packages/catalog/src/exact/batches/a-d-recipes-02/assets.ts packages/catalog/src/exact/batches/a-d-recipes-02/parts.ts packages/catalog/src/exact/batches/a-d-recipes-02/plans.ts packages/catalog/src/exact/batches/a-d-recipes-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-d-recipes-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-d-recipes-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-d-recipes-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-d-recipes-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-d-recipes-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 52 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 53: a-d-recipes-03

**Files:**

- Create: `packages/catalog/src/exact/batches/a-d-recipes-03/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-03/components.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-03/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-03/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-03/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-03/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-d-recipes-03').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 52 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-d-recipes-03`, Selector `range(D.3.8–D.3.13)`,
  Component-Allocation ausschließlich `functionRole` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 6 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-d-recipes-03/cases.test.ts
  ```

  Erwartung: FAIL mit `a-d-recipes-03: expected 6 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(D.3.8–D.3.13)` aufgelösten 6 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-d-recipes-03/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 6 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `functionRole`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-d-recipes-03/manifest.ts packages/catalog/src/exact/batches/a-d-recipes-03/components.ts packages/catalog/src/exact/batches/a-d-recipes-03/assets.ts packages/catalog/src/exact/batches/a-d-recipes-03/parts.ts packages/catalog/src/exact/batches/a-d-recipes-03/plans.ts packages/catalog/src/exact/batches/a-d-recipes-03/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-d-recipes-03 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-d-recipes-03
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-d-recipes-03/manifest.ts packages/catalog/src/exact/batches/a-d-recipes-03/components.ts packages/catalog/src/exact/batches/a-d-recipes-03/assets.ts packages/catalog/src/exact/batches/a-d-recipes-03/parts.ts packages/catalog/src/exact/batches/a-d-recipes-03/plans.ts packages/catalog/src/exact/batches/a-d-recipes-03/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-d-recipes-03 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-d-recipes-03
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-d-recipes-03 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-d-recipes-03 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-d-recipes-03
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 53 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 54: a-d-recipes-04

**Files:**

- Create: `packages/catalog/src/exact/batches/a-d-recipes-04/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-04/components.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-04/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-04/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-04/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-d-recipes-04/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-d-recipes-04').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 53 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-d-recipes-04`, Selector `range(D.4.1–D.4.5)`,
  Component-Allocation ausschließlich `functionRole` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 5 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-d-recipes-04/cases.test.ts
  ```

  Erwartung: FAIL mit `a-d-recipes-04: expected 5 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(D.4.1–D.4.5)` aufgelösten 5 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-d-recipes-04/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 5 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `functionRole`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-d-recipes-04/manifest.ts packages/catalog/src/exact/batches/a-d-recipes-04/components.ts packages/catalog/src/exact/batches/a-d-recipes-04/assets.ts packages/catalog/src/exact/batches/a-d-recipes-04/parts.ts packages/catalog/src/exact/batches/a-d-recipes-04/plans.ts packages/catalog/src/exact/batches/a-d-recipes-04/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-d-recipes-04 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-d-recipes-04
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-d-recipes-04/manifest.ts packages/catalog/src/exact/batches/a-d-recipes-04/components.ts packages/catalog/src/exact/batches/a-d-recipes-04/assets.ts packages/catalog/src/exact/batches/a-d-recipes-04/parts.ts packages/catalog/src/exact/batches/a-d-recipes-04/plans.ts packages/catalog/src/exact/batches/a-d-recipes-04/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-d-recipes-04 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-d-recipes-04
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-d-recipes-04 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-d-recipes-04 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-d-recipes-04
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 54 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 55: a-e-1-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-e-1-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-e-1-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 54 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-e-1-01`, Selector `range(E.1.1–E.1.12)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 12 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-e-1-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-e-1-01: expected 12 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(E.1.1–E.1.12)` aufgelösten 12 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-e-1-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 12 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-e-1-01/manifest.ts packages/catalog/src/exact/batches/a-e-1-01/components.ts packages/catalog/src/exact/batches/a-e-1-01/assets.ts packages/catalog/src/exact/batches/a-e-1-01/parts.ts packages/catalog/src/exact/batches/a-e-1-01/plans.ts packages/catalog/src/exact/batches/a-e-1-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-e-1-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-e-1-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-e-1-01/manifest.ts packages/catalog/src/exact/batches/a-e-1-01/components.ts packages/catalog/src/exact/batches/a-e-1-01/assets.ts packages/catalog/src/exact/batches/a-e-1-01/parts.ts packages/catalog/src/exact/batches/a-e-1-01/plans.ts packages/catalog/src/exact/batches/a-e-1-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-e-1-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-e-1-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-e-1-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-e-1-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-e-1-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 55 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 56: a-e-1-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-e-1-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-e-1-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 55 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-e-1-02`, Selector `range(E.1.13–E.1.24)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 12 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-e-1-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-e-1-02: expected 12 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(E.1.13–E.1.24)` aufgelösten 12 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-e-1-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 12 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-e-1-02/manifest.ts packages/catalog/src/exact/batches/a-e-1-02/components.ts packages/catalog/src/exact/batches/a-e-1-02/assets.ts packages/catalog/src/exact/batches/a-e-1-02/parts.ts packages/catalog/src/exact/batches/a-e-1-02/plans.ts packages/catalog/src/exact/batches/a-e-1-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-e-1-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-e-1-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-e-1-02/manifest.ts packages/catalog/src/exact/batches/a-e-1-02/components.ts packages/catalog/src/exact/batches/a-e-1-02/assets.ts packages/catalog/src/exact/batches/a-e-1-02/parts.ts packages/catalog/src/exact/batches/a-e-1-02/plans.ts packages/catalog/src/exact/batches/a-e-1-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-e-1-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-e-1-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-e-1-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-e-1-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-e-1-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 56 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 57: a-e-1-03

**Files:**

- Create: `packages/catalog/src/exact/batches/a-e-1-03/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-03/components.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-03/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-03/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-03/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-03/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-e-1-03').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 56 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-e-1-03`, Selector `range(E.1.25–E.1.36)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 12 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-e-1-03/cases.test.ts
  ```

  Erwartung: FAIL mit `a-e-1-03: expected 12 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(E.1.25–E.1.36)` aufgelösten 12 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-e-1-03/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 12 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-e-1-03/manifest.ts packages/catalog/src/exact/batches/a-e-1-03/components.ts packages/catalog/src/exact/batches/a-e-1-03/assets.ts packages/catalog/src/exact/batches/a-e-1-03/parts.ts packages/catalog/src/exact/batches/a-e-1-03/plans.ts packages/catalog/src/exact/batches/a-e-1-03/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-e-1-03 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-e-1-03
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-e-1-03/manifest.ts packages/catalog/src/exact/batches/a-e-1-03/components.ts packages/catalog/src/exact/batches/a-e-1-03/assets.ts packages/catalog/src/exact/batches/a-e-1-03/parts.ts packages/catalog/src/exact/batches/a-e-1-03/plans.ts packages/catalog/src/exact/batches/a-e-1-03/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-e-1-03 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-e-1-03
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-e-1-03 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-e-1-03 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-e-1-03
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 57 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 58: a-e-1-04

**Files:**

- Create: `packages/catalog/src/exact/batches/a-e-1-04/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-04/components.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-04/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-04/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-04/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-e-1-04/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-e-1-04').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 57 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-e-1-04`, Selector `set(E.1.37)`,
  Component-Allocation ausschließlich `technicalHeadMark` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 1 Exact-Asset-Fixture,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-e-1-04/cases.test.ts
  ```

  Erwartung: FAIL mit `a-e-1-04: expected 1 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `set(E.1.37)` aufgelösten 1 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-e-1-04/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 1 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `technicalHeadMark`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-e-1-04/manifest.ts packages/catalog/src/exact/batches/a-e-1-04/components.ts packages/catalog/src/exact/batches/a-e-1-04/assets.ts packages/catalog/src/exact/batches/a-e-1-04/parts.ts packages/catalog/src/exact/batches/a-e-1-04/plans.ts packages/catalog/src/exact/batches/a-e-1-04/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-e-1-04 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-e-1-04
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-e-1-04/manifest.ts packages/catalog/src/exact/batches/a-e-1-04/components.ts packages/catalog/src/exact/batches/a-e-1-04/assets.ts packages/catalog/src/exact/batches/a-e-1-04/parts.ts packages/catalog/src/exact/batches/a-e-1-04/plans.ts packages/catalog/src/exact/batches/a-e-1-04/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-e-1-04 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-e-1-04
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-e-1-04 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-e-1-04 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-e-1-04
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 58 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 59: a-e-2-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-e-2-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-e-2-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-e-2-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-e-2-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-e-2-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-e-2-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-e-2-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 58 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-e-2-01`, Selector `range(E.2.1–E.2.12)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 12 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-e-2-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-e-2-01: expected 12 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(E.2.1–E.2.12)` aufgelösten 12 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-e-2-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 12 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-e-2-01/manifest.ts packages/catalog/src/exact/batches/a-e-2-01/components.ts packages/catalog/src/exact/batches/a-e-2-01/assets.ts packages/catalog/src/exact/batches/a-e-2-01/parts.ts packages/catalog/src/exact/batches/a-e-2-01/plans.ts packages/catalog/src/exact/batches/a-e-2-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-e-2-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-e-2-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-e-2-01/manifest.ts packages/catalog/src/exact/batches/a-e-2-01/components.ts packages/catalog/src/exact/batches/a-e-2-01/assets.ts packages/catalog/src/exact/batches/a-e-2-01/parts.ts packages/catalog/src/exact/batches/a-e-2-01/plans.ts packages/catalog/src/exact/batches/a-e-2-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-e-2-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-e-2-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-e-2-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-e-2-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-e-2-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 59 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 60: a-e-2-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-e-2-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-e-2-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-e-2-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-e-2-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-e-2-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-e-2-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-e-2-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 59 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-e-2-02`, Selector `range(E.2.13–E.2.24)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 12 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-e-2-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-e-2-02: expected 12 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(E.2.13–E.2.24)` aufgelösten 12 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-e-2-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 12 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-e-2-02/manifest.ts packages/catalog/src/exact/batches/a-e-2-02/components.ts packages/catalog/src/exact/batches/a-e-2-02/assets.ts packages/catalog/src/exact/batches/a-e-2-02/parts.ts packages/catalog/src/exact/batches/a-e-2-02/plans.ts packages/catalog/src/exact/batches/a-e-2-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-e-2-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-e-2-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-e-2-02/manifest.ts packages/catalog/src/exact/batches/a-e-2-02/components.ts packages/catalog/src/exact/batches/a-e-2-02/assets.ts packages/catalog/src/exact/batches/a-e-2-02/parts.ts packages/catalog/src/exact/batches/a-e-2-02/plans.ts packages/catalog/src/exact/batches/a-e-2-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-e-2-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-e-2-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-e-2-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-e-2-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-e-2-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 60 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 61: a-e-2-03

**Files:**

- Create: `packages/catalog/src/exact/batches/a-e-2-03/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-e-2-03/components.ts`
- Create: `packages/catalog/src/exact/batches/a-e-2-03/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-e-2-03/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-e-2-03/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-e-2-03/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-e-2-03').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 60 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-e-2-03`, Selector `range(E.2.25–E.2.31)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 7 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-e-2-03/cases.test.ts
  ```

  Erwartung: FAIL mit `a-e-2-03: expected 7 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(E.2.25–E.2.31)` aufgelösten 7 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-e-2-03/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 7 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-e-2-03/manifest.ts packages/catalog/src/exact/batches/a-e-2-03/components.ts packages/catalog/src/exact/batches/a-e-2-03/assets.ts packages/catalog/src/exact/batches/a-e-2-03/parts.ts packages/catalog/src/exact/batches/a-e-2-03/plans.ts packages/catalog/src/exact/batches/a-e-2-03/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-e-2-03 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-e-2-03
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-e-2-03/manifest.ts packages/catalog/src/exact/batches/a-e-2-03/components.ts packages/catalog/src/exact/batches/a-e-2-03/assets.ts packages/catalog/src/exact/batches/a-e-2-03/parts.ts packages/catalog/src/exact/batches/a-e-2-03/plans.ts packages/catalog/src/exact/batches/a-e-2-03/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-e-2-03 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-e-2-03
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-e-2-03 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-e-2-03 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-e-2-03
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 61 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 62: a-f-1-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-f-1-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-f-1-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-f-1-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-f-1-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-f-1-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-f-1-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-f-1-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 61 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-f-1-01`, Selector `range(F.1.1–F.1.11)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 12 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-f-1-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-f-1-01: expected 12 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(F.1.1–F.1.11)` aufgelösten 12 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-f-1-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 12 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-f-1-01/manifest.ts packages/catalog/src/exact/batches/a-f-1-01/components.ts packages/catalog/src/exact/batches/a-f-1-01/assets.ts packages/catalog/src/exact/batches/a-f-1-01/parts.ts packages/catalog/src/exact/batches/a-f-1-01/plans.ts packages/catalog/src/exact/batches/a-f-1-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-f-1-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-f-1-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-f-1-01/manifest.ts packages/catalog/src/exact/batches/a-f-1-01/components.ts packages/catalog/src/exact/batches/a-f-1-01/assets.ts packages/catalog/src/exact/batches/a-f-1-01/parts.ts packages/catalog/src/exact/batches/a-f-1-01/plans.ts packages/catalog/src/exact/batches/a-f-1-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-f-1-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-f-1-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-f-1-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-f-1-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-f-1-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 62 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 63: a-f-1-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-f-1-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-f-1-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-f-1-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-f-1-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-f-1-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-f-1-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-f-1-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 62 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-f-1-02`, Selector `range(F.1.12–F.1.18)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 9 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-f-1-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-f-1-02: expected 9 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(F.1.12–F.1.18)` aufgelösten 9 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-f-1-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 9 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-f-1-02/manifest.ts packages/catalog/src/exact/batches/a-f-1-02/components.ts packages/catalog/src/exact/batches/a-f-1-02/assets.ts packages/catalog/src/exact/batches/a-f-1-02/parts.ts packages/catalog/src/exact/batches/a-f-1-02/plans.ts packages/catalog/src/exact/batches/a-f-1-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-f-1-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-f-1-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-f-1-02/manifest.ts packages/catalog/src/exact/batches/a-f-1-02/components.ts packages/catalog/src/exact/batches/a-f-1-02/assets.ts packages/catalog/src/exact/batches/a-f-1-02/parts.ts packages/catalog/src/exact/batches/a-f-1-02/plans.ts packages/catalog/src/exact/batches/a-f-1-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-f-1-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-f-1-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-f-1-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-f-1-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-f-1-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 63 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 64: a-f-1-03

**Files:**

- Create: `packages/catalog/src/exact/batches/a-f-1-03/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-f-1-03/components.ts`
- Create: `packages/catalog/src/exact/batches/a-f-1-03/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-f-1-03/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-f-1-03/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-f-1-03/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-f-1-03').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 63 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-f-1-03`, Selector `range(F.1.19–F.1.22)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 4 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-f-1-03/cases.test.ts
  ```

  Erwartung: FAIL mit `a-f-1-03: expected 4 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(F.1.19–F.1.22)` aufgelösten 4 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-f-1-03/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 4 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-f-1-03/manifest.ts packages/catalog/src/exact/batches/a-f-1-03/components.ts packages/catalog/src/exact/batches/a-f-1-03/assets.ts packages/catalog/src/exact/batches/a-f-1-03/parts.ts packages/catalog/src/exact/batches/a-f-1-03/plans.ts packages/catalog/src/exact/batches/a-f-1-03/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-f-1-03 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-f-1-03
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-f-1-03/manifest.ts packages/catalog/src/exact/batches/a-f-1-03/components.ts packages/catalog/src/exact/batches/a-f-1-03/assets.ts packages/catalog/src/exact/batches/a-f-1-03/parts.ts packages/catalog/src/exact/batches/a-f-1-03/plans.ts packages/catalog/src/exact/batches/a-f-1-03/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-f-1-03 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-f-1-03
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-f-1-03 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-f-1-03 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-f-1-03
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 64 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 65: a-f-2-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-f-2-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-f-2-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-f-2-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-f-2-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-f-2-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-f-2-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-f-2-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 64 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-f-2-01`, Selector `range(F.2.1–F.2.7)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 12 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-f-2-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-f-2-01: expected 12 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(F.2.1–F.2.7)` aufgelösten 12 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-f-2-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 12 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-f-2-01/manifest.ts packages/catalog/src/exact/batches/a-f-2-01/components.ts packages/catalog/src/exact/batches/a-f-2-01/assets.ts packages/catalog/src/exact/batches/a-f-2-01/parts.ts packages/catalog/src/exact/batches/a-f-2-01/plans.ts packages/catalog/src/exact/batches/a-f-2-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-f-2-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-f-2-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-f-2-01/manifest.ts packages/catalog/src/exact/batches/a-f-2-01/components.ts packages/catalog/src/exact/batches/a-f-2-01/assets.ts packages/catalog/src/exact/batches/a-f-2-01/parts.ts packages/catalog/src/exact/batches/a-f-2-01/plans.ts packages/catalog/src/exact/batches/a-f-2-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-f-2-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-f-2-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-f-2-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-f-2-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-f-2-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 65 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 66: a-f-2-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-f-2-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-f-2-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-f-2-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-f-2-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-f-2-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-f-2-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-f-2-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 65 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-f-2-02`, Selector `range(F.2.8–F.2.17)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 10 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-f-2-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-f-2-02: expected 10 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(F.2.8–F.2.17)` aufgelösten 10 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-f-2-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 10 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-f-2-02/manifest.ts packages/catalog/src/exact/batches/a-f-2-02/components.ts packages/catalog/src/exact/batches/a-f-2-02/assets.ts packages/catalog/src/exact/batches/a-f-2-02/parts.ts packages/catalog/src/exact/batches/a-f-2-02/plans.ts packages/catalog/src/exact/batches/a-f-2-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-f-2-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-f-2-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-f-2-02/manifest.ts packages/catalog/src/exact/batches/a-f-2-02/components.ts packages/catalog/src/exact/batches/a-f-2-02/assets.ts packages/catalog/src/exact/batches/a-f-2-02/parts.ts packages/catalog/src/exact/batches/a-f-2-02/plans.ts packages/catalog/src/exact/batches/a-f-2-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-f-2-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-f-2-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-f-2-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-f-2-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-f-2-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 66 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 67: a-f-3-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-f-3-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-f-3-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-f-3-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-f-3-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-f-3-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-f-3-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-f-3-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 66 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-f-3-01`, Selector `range(F.3.1–F.3.12)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 12 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-f-3-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-f-3-01: expected 12 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(F.3.1–F.3.12)` aufgelösten 12 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-f-3-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 12 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-f-3-01/manifest.ts packages/catalog/src/exact/batches/a-f-3-01/components.ts packages/catalog/src/exact/batches/a-f-3-01/assets.ts packages/catalog/src/exact/batches/a-f-3-01/parts.ts packages/catalog/src/exact/batches/a-f-3-01/plans.ts packages/catalog/src/exact/batches/a-f-3-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-f-3-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-f-3-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-f-3-01/manifest.ts packages/catalog/src/exact/batches/a-f-3-01/components.ts packages/catalog/src/exact/batches/a-f-3-01/assets.ts packages/catalog/src/exact/batches/a-f-3-01/parts.ts packages/catalog/src/exact/batches/a-f-3-01/plans.ts packages/catalog/src/exact/batches/a-f-3-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-f-3-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-f-3-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-f-3-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-f-3-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-f-3-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 67 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 68: a-f-3-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-f-3-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-f-3-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-f-3-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-f-3-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-f-3-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-f-3-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-f-3-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 67 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-f-3-02`, Selector `range(F.3.13–F.3.19)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 7 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-f-3-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-f-3-02: expected 7 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(F.3.13–F.3.19)` aufgelösten 7 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-f-3-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 7 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-f-3-02/manifest.ts packages/catalog/src/exact/batches/a-f-3-02/components.ts packages/catalog/src/exact/batches/a-f-3-02/assets.ts packages/catalog/src/exact/batches/a-f-3-02/parts.ts packages/catalog/src/exact/batches/a-f-3-02/plans.ts packages/catalog/src/exact/batches/a-f-3-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-f-3-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-f-3-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-f-3-02/manifest.ts packages/catalog/src/exact/batches/a-f-3-02/components.ts packages/catalog/src/exact/batches/a-f-3-02/assets.ts packages/catalog/src/exact/batches/a-f-3-02/parts.ts packages/catalog/src/exact/batches/a-f-3-02/plans.ts packages/catalog/src/exact/batches/a-f-3-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-f-3-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-f-3-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-f-3-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-f-3-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-f-3-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 68 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 69: a-g-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-g-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-g-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-g-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-g-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-g-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-g-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-g-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 68 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-g-01`, Selector `set(G.1, G.1.1–G.1.5, G.2, G.2.1–G.2.3)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 10 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-g-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-g-01: expected 10 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `set(G.1, G.1.1–G.1.5, G.2, G.2.1–G.2.3)` aufgelösten 10 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-g-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 10 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-g-01/manifest.ts packages/catalog/src/exact/batches/a-g-01/components.ts packages/catalog/src/exact/batches/a-g-01/assets.ts packages/catalog/src/exact/batches/a-g-01/parts.ts packages/catalog/src/exact/batches/a-g-01/plans.ts packages/catalog/src/exact/batches/a-g-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-g-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-g-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-g-01/manifest.ts packages/catalog/src/exact/batches/a-g-01/components.ts packages/catalog/src/exact/batches/a-g-01/assets.ts packages/catalog/src/exact/batches/a-g-01/parts.ts packages/catalog/src/exact/batches/a-g-01/plans.ts packages/catalog/src/exact/batches/a-g-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-g-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-g-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-g-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-g-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-g-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 69 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 70: a-g-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-g-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-g-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-g-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-g-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-g-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-g-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-g-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 69 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-g-02`, Selector `set(G.3, G.3.1–G.3.5, G.4–G.8)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 11 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-g-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-g-02: expected 11 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `set(G.3, G.3.1–G.3.5, G.4–G.8)` aufgelösten 11 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-g-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 11 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-g-02/manifest.ts packages/catalog/src/exact/batches/a-g-02/components.ts packages/catalog/src/exact/batches/a-g-02/assets.ts packages/catalog/src/exact/batches/a-g-02/parts.ts packages/catalog/src/exact/batches/a-g-02/plans.ts packages/catalog/src/exact/batches/a-g-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-g-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-g-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-g-02/manifest.ts packages/catalog/src/exact/batches/a-g-02/components.ts packages/catalog/src/exact/batches/a-g-02/assets.ts packages/catalog/src/exact/batches/a-g-02/parts.ts packages/catalog/src/exact/batches/a-g-02/plans.ts packages/catalog/src/exact/batches/a-g-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-g-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-g-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-g-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-g-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-g-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 70 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 71: a-h-all

**Files:**

- Create: `packages/catalog/src/exact/batches/a-h-all/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-h-all/components.ts`
- Create: `packages/catalog/src/exact/batches/a-h-all/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-h-all/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-h-all/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-h-all/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-h-all').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 70 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-h-all`, Selector `range(H.1–H.3)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 3 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-h-all/cases.test.ts
  ```

  Erwartung: FAIL mit `a-h-all: expected 3 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(H.1–H.3)` aufgelösten 3 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-h-all/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 3 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-h-all/manifest.ts packages/catalog/src/exact/batches/a-h-all/components.ts packages/catalog/src/exact/batches/a-h-all/assets.ts packages/catalog/src/exact/batches/a-h-all/parts.ts packages/catalog/src/exact/batches/a-h-all/plans.ts packages/catalog/src/exact/batches/a-h-all/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-h-all --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-h-all
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-h-all/manifest.ts packages/catalog/src/exact/batches/a-h-all/components.ts packages/catalog/src/exact/batches/a-h-all/assets.ts packages/catalog/src/exact/batches/a-h-all/parts.ts packages/catalog/src/exact/batches/a-h-all/plans.ts packages/catalog/src/exact/batches/a-h-all/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-h-all --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-h-all
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-h-all reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-h-all --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-h-all
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 71 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 72: a-i-1-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-i-1-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-i-1-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-i-1-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-i-1-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-i-1-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-i-1-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-i-1-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 71 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-i-1-01`, Selector `range(I.1.1–I.1.9)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 10 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-i-1-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-i-1-01: expected 10 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(I.1.1–I.1.9)` aufgelösten 10 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-i-1-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 10 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-i-1-01/manifest.ts packages/catalog/src/exact/batches/a-i-1-01/components.ts packages/catalog/src/exact/batches/a-i-1-01/assets.ts packages/catalog/src/exact/batches/a-i-1-01/parts.ts packages/catalog/src/exact/batches/a-i-1-01/plans.ts packages/catalog/src/exact/batches/a-i-1-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-i-1-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-i-1-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-i-1-01/manifest.ts packages/catalog/src/exact/batches/a-i-1-01/components.ts packages/catalog/src/exact/batches/a-i-1-01/assets.ts packages/catalog/src/exact/batches/a-i-1-01/parts.ts packages/catalog/src/exact/batches/a-i-1-01/plans.ts packages/catalog/src/exact/batches/a-i-1-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-i-1-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-i-1-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-i-1-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-i-1-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-i-1-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 72 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 73: a-i-1-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-i-1-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-i-1-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-i-1-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-i-1-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-i-1-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-i-1-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-i-1-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 72 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-i-1-02`, Selector `range(I.1.10–I.1.20)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 11 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-i-1-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-i-1-02: expected 11 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(I.1.10–I.1.20)` aufgelösten 11 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-i-1-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 11 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-i-1-02/manifest.ts packages/catalog/src/exact/batches/a-i-1-02/components.ts packages/catalog/src/exact/batches/a-i-1-02/assets.ts packages/catalog/src/exact/batches/a-i-1-02/parts.ts packages/catalog/src/exact/batches/a-i-1-02/plans.ts packages/catalog/src/exact/batches/a-i-1-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-i-1-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-i-1-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-i-1-02/manifest.ts packages/catalog/src/exact/batches/a-i-1-02/components.ts packages/catalog/src/exact/batches/a-i-1-02/assets.ts packages/catalog/src/exact/batches/a-i-1-02/parts.ts packages/catalog/src/exact/batches/a-i-1-02/plans.ts packages/catalog/src/exact/batches/a-i-1-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-i-1-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-i-1-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-i-1-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-i-1-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-i-1-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 73 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 74: a-i-2

**Files:**

- Create: `packages/catalog/src/exact/batches/a-i-2/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-i-2/components.ts`
- Create: `packages/catalog/src/exact/batches/a-i-2/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-i-2/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-i-2/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-i-2/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-i-2').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 73 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-i-2`, Selector `range(I.2.1–I.2.7)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 7 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-i-2/cases.test.ts
  ```

  Erwartung: FAIL mit `a-i-2: expected 7 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(I.2.1–I.2.7)` aufgelösten 7 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-i-2/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 7 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-i-2/manifest.ts packages/catalog/src/exact/batches/a-i-2/components.ts packages/catalog/src/exact/batches/a-i-2/assets.ts packages/catalog/src/exact/batches/a-i-2/parts.ts packages/catalog/src/exact/batches/a-i-2/plans.ts packages/catalog/src/exact/batches/a-i-2/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-i-2 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-i-2
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-i-2/manifest.ts packages/catalog/src/exact/batches/a-i-2/components.ts packages/catalog/src/exact/batches/a-i-2/assets.ts packages/catalog/src/exact/batches/a-i-2/parts.ts packages/catalog/src/exact/batches/a-i-2/plans.ts packages/catalog/src/exact/batches/a-i-2/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-i-2 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-i-2
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-i-2 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-i-2 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-i-2
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 74 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 75: a-i-3

**Files:**

- Create: `packages/catalog/src/exact/batches/a-i-3/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-i-3/components.ts`
- Create: `packages/catalog/src/exact/batches/a-i-3/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-i-3/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-i-3/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-i-3/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-i-3').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 74 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-i-3`, Selector `range(I.3.1–I.3.11)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 11 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-i-3/cases.test.ts
  ```

  Erwartung: FAIL mit `a-i-3: expected 11 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(I.3.1–I.3.11)` aufgelösten 11 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-i-3/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 11 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-i-3/manifest.ts packages/catalog/src/exact/batches/a-i-3/components.ts packages/catalog/src/exact/batches/a-i-3/assets.ts packages/catalog/src/exact/batches/a-i-3/parts.ts packages/catalog/src/exact/batches/a-i-3/plans.ts packages/catalog/src/exact/batches/a-i-3/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-i-3 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-i-3
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-i-3/manifest.ts packages/catalog/src/exact/batches/a-i-3/components.ts packages/catalog/src/exact/batches/a-i-3/assets.ts packages/catalog/src/exact/batches/a-i-3/parts.ts packages/catalog/src/exact/batches/a-i-3/plans.ts packages/catalog/src/exact/batches/a-i-3/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-i-3 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-i-3
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-i-3 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-i-3 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-i-3
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 75 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 76: a-i-4

**Files:**

- Create: `packages/catalog/src/exact/batches/a-i-4/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-i-4/components.ts`
- Create: `packages/catalog/src/exact/batches/a-i-4/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-i-4/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-i-4/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-i-4/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-i-4').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 75 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-i-4`, Selector `range(I.4.1–I.4.3)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 3 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-i-4/cases.test.ts
  ```

  Erwartung: FAIL mit `a-i-4: expected 3 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(I.4.1–I.4.3)` aufgelösten 3 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-i-4/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 3 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-i-4/manifest.ts packages/catalog/src/exact/batches/a-i-4/components.ts packages/catalog/src/exact/batches/a-i-4/assets.ts packages/catalog/src/exact/batches/a-i-4/parts.ts packages/catalog/src/exact/batches/a-i-4/plans.ts packages/catalog/src/exact/batches/a-i-4/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-i-4 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-i-4
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-i-4/manifest.ts packages/catalog/src/exact/batches/a-i-4/components.ts packages/catalog/src/exact/batches/a-i-4/assets.ts packages/catalog/src/exact/batches/a-i-4/parts.ts packages/catalog/src/exact/batches/a-i-4/plans.ts packages/catalog/src/exact/batches/a-i-4/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-i-4 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-i-4
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-i-4 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-i-4 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-i-4
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 76 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 77: a-i-5-recipes

**Files:**

- Create: `packages/catalog/src/exact/batches/a-i-5-recipes/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-i-5-recipes/components.ts`
- Create: `packages/catalog/src/exact/batches/a-i-5-recipes/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-i-5-recipes/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-i-5-recipes/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-i-5-recipes/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-i-5-recipes').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 76 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-i-5-recipes`, Selector `range(I.5.1–I.5.3)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 3 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-i-5-recipes/cases.test.ts
  ```

  Erwartung: FAIL mit `a-i-5-recipes: expected 3 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(I.5.1–I.5.3)` aufgelösten 3 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-i-5-recipes/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 3 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-i-5-recipes/manifest.ts packages/catalog/src/exact/batches/a-i-5-recipes/components.ts packages/catalog/src/exact/batches/a-i-5-recipes/assets.ts packages/catalog/src/exact/batches/a-i-5-recipes/parts.ts packages/catalog/src/exact/batches/a-i-5-recipes/plans.ts packages/catalog/src/exact/batches/a-i-5-recipes/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-i-5-recipes --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-i-5-recipes
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-i-5-recipes/manifest.ts packages/catalog/src/exact/batches/a-i-5-recipes/components.ts packages/catalog/src/exact/batches/a-i-5-recipes/assets.ts packages/catalog/src/exact/batches/a-i-5-recipes/parts.ts packages/catalog/src/exact/batches/a-i-5-recipes/plans.ts packages/catalog/src/exact/batches/a-i-5-recipes/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-i-5-recipes --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-i-5-recipes
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-i-5-recipes reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-i-5-recipes --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-i-5-recipes
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 77 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 78: a-i-5-water-rescue

**Files:**

- Create: `packages/catalog/src/exact/batches/a-i-5-water-rescue/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-i-5-water-rescue/components.ts`
- Create: `packages/catalog/src/exact/batches/a-i-5-water-rescue/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-i-5-water-rescue/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-i-5-water-rescue/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-i-5-water-rescue/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-i-5-water-rescue').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 77 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-i-5-water-rescue`, Selector `range(I.5.4–I.5.8)`,
  Component-Allocation ausschließlich `water-rescue-personnel` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 5 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-i-5-water-rescue/cases.test.ts
  ```

  Erwartung: FAIL mit `a-i-5-water-rescue: expected 5 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(I.5.4–I.5.8)` aufgelösten 5 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-i-5-water-rescue/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 5 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `water-rescue-personnel`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-i-5-water-rescue/manifest.ts packages/catalog/src/exact/batches/a-i-5-water-rescue/components.ts packages/catalog/src/exact/batches/a-i-5-water-rescue/assets.ts packages/catalog/src/exact/batches/a-i-5-water-rescue/parts.ts packages/catalog/src/exact/batches/a-i-5-water-rescue/plans.ts packages/catalog/src/exact/batches/a-i-5-water-rescue/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-i-5-water-rescue --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-i-5-water-rescue
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-i-5-water-rescue/manifest.ts packages/catalog/src/exact/batches/a-i-5-water-rescue/components.ts packages/catalog/src/exact/batches/a-i-5-water-rescue/assets.ts packages/catalog/src/exact/batches/a-i-5-water-rescue/parts.ts packages/catalog/src/exact/batches/a-i-5-water-rescue/plans.ts packages/catalog/src/exact/batches/a-i-5-water-rescue/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-i-5-water-rescue --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-i-5-water-rescue
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-i-5-water-rescue reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-i-5-water-rescue --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-i-5-water-rescue
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 78 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 79: a-j-1-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-j-1-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-j-1-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-j-1-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-j-1-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-j-1-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-j-1-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-j-1-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 78 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-j-1-01`, Selector `range(J.1.1–J.1.7)`,
  Component-Allocation ausschließlich `comms` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 8 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-1-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-j-1-01: expected 8 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(J.1.1–J.1.7)` aufgelösten 8 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-1-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 8 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `comms`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-1-01/manifest.ts packages/catalog/src/exact/batches/a-j-1-01/components.ts packages/catalog/src/exact/batches/a-j-1-01/assets.ts packages/catalog/src/exact/batches/a-j-1-01/parts.ts packages/catalog/src/exact/batches/a-j-1-01/plans.ts packages/catalog/src/exact/batches/a-j-1-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-j-1-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-j-1-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-1-01/manifest.ts packages/catalog/src/exact/batches/a-j-1-01/components.ts packages/catalog/src/exact/batches/a-j-1-01/assets.ts packages/catalog/src/exact/batches/a-j-1-01/parts.ts packages/catalog/src/exact/batches/a-j-1-01/plans.ts packages/catalog/src/exact/batches/a-j-1-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-j-1-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-1-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-j-1-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-j-1-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-1-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 79 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 80: a-j-1-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-j-1-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-j-1-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-j-1-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-j-1-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-j-1-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-j-1-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-j-1-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 79 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-j-1-02`, Selector `range(J.1.8–J.1.14)`,
  Component-Allocation ausschließlich `comms` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 11 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-1-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-j-1-02: expected 11 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(J.1.8–J.1.14)` aufgelösten 11 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-1-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 11 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `comms`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-1-02/manifest.ts packages/catalog/src/exact/batches/a-j-1-02/components.ts packages/catalog/src/exact/batches/a-j-1-02/assets.ts packages/catalog/src/exact/batches/a-j-1-02/parts.ts packages/catalog/src/exact/batches/a-j-1-02/plans.ts packages/catalog/src/exact/batches/a-j-1-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-j-1-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-j-1-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-1-02/manifest.ts packages/catalog/src/exact/batches/a-j-1-02/components.ts packages/catalog/src/exact/batches/a-j-1-02/assets.ts packages/catalog/src/exact/batches/a-j-1-02/parts.ts packages/catalog/src/exact/batches/a-j-1-02/plans.ts packages/catalog/src/exact/batches/a-j-1-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-j-1-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-1-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-j-1-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-j-1-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-1-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 80 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 81: a-j-2

**Files:**

- Create: `packages/catalog/src/exact/batches/a-j-2/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-j-2/components.ts`
- Create: `packages/catalog/src/exact/batches/a-j-2/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-j-2/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-j-2/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-j-2/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-j-2').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 80 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-j-2`, Selector `range(J.2.1–J.2.2)`,
  Component-Allocation ausschließlich `comms` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 2 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-2/cases.test.ts
  ```

  Erwartung: FAIL mit `a-j-2: expected 2 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(J.2.1–J.2.2)` aufgelösten 2 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-2/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 2 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `comms`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-2/manifest.ts packages/catalog/src/exact/batches/a-j-2/components.ts packages/catalog/src/exact/batches/a-j-2/assets.ts packages/catalog/src/exact/batches/a-j-2/parts.ts packages/catalog/src/exact/batches/a-j-2/plans.ts packages/catalog/src/exact/batches/a-j-2/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-j-2 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-j-2
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-2/manifest.ts packages/catalog/src/exact/batches/a-j-2/components.ts packages/catalog/src/exact/batches/a-j-2/assets.ts packages/catalog/src/exact/batches/a-j-2/parts.ts packages/catalog/src/exact/batches/a-j-2/plans.ts packages/catalog/src/exact/batches/a-j-2/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-j-2 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-2
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-j-2 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-j-2 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-2
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 81 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 82: a-j-2-examples

**Files:**

- Create: `packages/catalog/src/exact/batches/a-j-2-examples/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-j-2-examples/components.ts`
- Create: `packages/catalog/src/exact/batches/a-j-2-examples/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-j-2-examples/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-j-2-examples/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-j-2-examples/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-j-2-examples').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 81 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-j-2-examples`, Selector `examples(J.2.3)`,
  Component-Allocation `none` und die geprüfte lokale Discovery-Evidence. Alle sieben Collections
  in `BATCH_COMPONENTS` sind semantisch leer; einzigartige IR liegt ausschließlich in
  `BATCH_ASSETS.assetFragments`, und jeder assetspezifische Paint-Owner wird durch
  `BATCH_PARTS.ownershipEntries` plus `ORACLE_OWNERSHIP_MANIFEST` gegatet.
- Produces: genau ein `ExactBatchModule` mit 2 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-2-examples/cases.test.ts
  ```

  Erwartung: FAIL mit `a-j-2-examples: expected 2 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `examples(J.2.3)` aufgelösten 2 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-2-examples/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 2 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family `none`; alle sieben `BATCH_COMPONENTS`-Collections sind leer, einzigartige
  `assetFragments` vollständig und sämtliche assetspezifischen Ownership-Einträge zentral gegatet.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-2-examples/manifest.ts packages/catalog/src/exact/batches/a-j-2-examples/components.ts packages/catalog/src/exact/batches/a-j-2-examples/assets.ts packages/catalog/src/exact/batches/a-j-2-examples/parts.ts packages/catalog/src/exact/batches/a-j-2-examples/plans.ts packages/catalog/src/exact/batches/a-j-2-examples/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-j-2-examples --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-j-2-examples
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-2-examples/manifest.ts packages/catalog/src/exact/batches/a-j-2-examples/components.ts packages/catalog/src/exact/batches/a-j-2-examples/assets.ts packages/catalog/src/exact/batches/a-j-2-examples/parts.ts packages/catalog/src/exact/batches/a-j-2-examples/plans.ts packages/catalog/src/exact/batches/a-j-2-examples/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-j-2-examples --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-2-examples
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-j-2-examples reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-j-2-examples --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-2-examples
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 82 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 83: a-j-3-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-j-3-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-j-3-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-j-3-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-j-3-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-j-3-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-j-3-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-j-3-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 82 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-j-3-01`, Selector `range(J.3.1–J.3.12)`,
  Component-Allocation ausschließlich `comms` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 12 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-3-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-j-3-01: expected 12 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(J.3.1–J.3.12)` aufgelösten 12 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-3-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 12 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `comms`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-3-01/manifest.ts packages/catalog/src/exact/batches/a-j-3-01/components.ts packages/catalog/src/exact/batches/a-j-3-01/assets.ts packages/catalog/src/exact/batches/a-j-3-01/parts.ts packages/catalog/src/exact/batches/a-j-3-01/plans.ts packages/catalog/src/exact/batches/a-j-3-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-j-3-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-j-3-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-3-01/manifest.ts packages/catalog/src/exact/batches/a-j-3-01/components.ts packages/catalog/src/exact/batches/a-j-3-01/assets.ts packages/catalog/src/exact/batches/a-j-3-01/parts.ts packages/catalog/src/exact/batches/a-j-3-01/plans.ts packages/catalog/src/exact/batches/a-j-3-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-j-3-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-3-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-j-3-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-j-3-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-3-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 83 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 84: a-j-3-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-j-3-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-j-3-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-j-3-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-j-3-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-j-3-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-j-3-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-j-3-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 83 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-j-3-02`, Selector `range(J.3.13–J.3.15)`,
  Component-Allocation ausschließlich `comms` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 3 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-3-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-j-3-02: expected 3 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(J.3.13–J.3.15)` aufgelösten 3 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-3-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 3 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `comms`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-3-02/manifest.ts packages/catalog/src/exact/batches/a-j-3-02/components.ts packages/catalog/src/exact/batches/a-j-3-02/assets.ts packages/catalog/src/exact/batches/a-j-3-02/parts.ts packages/catalog/src/exact/batches/a-j-3-02/plans.ts packages/catalog/src/exact/batches/a-j-3-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-j-3-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-j-3-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-3-02/manifest.ts packages/catalog/src/exact/batches/a-j-3-02/components.ts packages/catalog/src/exact/batches/a-j-3-02/assets.ts packages/catalog/src/exact/batches/a-j-3-02/parts.ts packages/catalog/src/exact/batches/a-j-3-02/plans.ts packages/catalog/src/exact/batches/a-j-3-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-j-3-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-3-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-j-3-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-j-3-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-3-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 84 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 85: a-j-4-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-j-4-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-j-4-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-j-4-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-j-4-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-j-4-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-j-4-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-j-4-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 84 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-j-4-01`, Selector `range(J.4.1–J.4.12)`,
  Component-Allocation ausschließlich `comms` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 12 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-4-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-j-4-01: expected 12 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(J.4.1–J.4.12)` aufgelösten 12 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-4-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 12 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `comms`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-4-01/manifest.ts packages/catalog/src/exact/batches/a-j-4-01/components.ts packages/catalog/src/exact/batches/a-j-4-01/assets.ts packages/catalog/src/exact/batches/a-j-4-01/parts.ts packages/catalog/src/exact/batches/a-j-4-01/plans.ts packages/catalog/src/exact/batches/a-j-4-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-j-4-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-j-4-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-4-01/manifest.ts packages/catalog/src/exact/batches/a-j-4-01/components.ts packages/catalog/src/exact/batches/a-j-4-01/assets.ts packages/catalog/src/exact/batches/a-j-4-01/parts.ts packages/catalog/src/exact/batches/a-j-4-01/plans.ts packages/catalog/src/exact/batches/a-j-4-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-j-4-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-4-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-j-4-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-j-4-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-4-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 85 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 86: a-j-4-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-j-4-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-j-4-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-j-4-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-j-4-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-j-4-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-j-4-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-j-4-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 85 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-j-4-02`, Selector `range(J.4.13–J.4.17)`,
  Component-Allocation ausschließlich `comms` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 5 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-4-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-j-4-02: expected 5 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(J.4.13–J.4.17)` aufgelösten 5 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-4-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 5 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `comms`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-4-02/manifest.ts packages/catalog/src/exact/batches/a-j-4-02/components.ts packages/catalog/src/exact/batches/a-j-4-02/assets.ts packages/catalog/src/exact/batches/a-j-4-02/parts.ts packages/catalog/src/exact/batches/a-j-4-02/plans.ts packages/catalog/src/exact/batches/a-j-4-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-j-4-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-j-4-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-4-02/manifest.ts packages/catalog/src/exact/batches/a-j-4-02/components.ts packages/catalog/src/exact/batches/a-j-4-02/assets.ts packages/catalog/src/exact/batches/a-j-4-02/parts.ts packages/catalog/src/exact/batches/a-j-4-02/plans.ts packages/catalog/src/exact/batches/a-j-4-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-j-4-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-4-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-j-4-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-j-4-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-4-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 86 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 87: a-j-overview

**Files:**

- Create: `packages/catalog/src/exact/batches/a-j-overview/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-j-overview/components.ts`
- Create: `packages/catalog/src/exact/batches/a-j-overview/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-j-overview/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-j-overview/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-j-overview/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-j-overview').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 86 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-j-overview`, Selector `asset(J_Bedienungszeichen.svg)`,
  Component-Allocation `none` und die geprüfte lokale Discovery-Evidence. Alle sieben Collections
  in `BATCH_COMPONENTS` sind semantisch leer; einzigartige IR liegt ausschließlich in
  `BATCH_ASSETS.assetFragments`, und jeder assetspezifische Paint-Owner wird durch
  `BATCH_PARTS.ownershipEntries` plus `ORACLE_OWNERSHIP_MANIFEST` gegatet.
- Produces: genau ein `ExactBatchModule` mit 1 Exact-Asset-Fixture,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-overview/cases.test.ts
  ```

  Erwartung: FAIL mit `a-j-overview: expected 1 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `asset(J_Bedienungszeichen.svg)` aufgelösten 1 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-j-overview/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 1 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family `none`; alle sieben `BATCH_COMPONENTS`-Collections sind leer, einzigartige
  `assetFragments` vollständig und sämtliche assetspezifischen Ownership-Einträge zentral gegatet.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-overview/manifest.ts packages/catalog/src/exact/batches/a-j-overview/components.ts packages/catalog/src/exact/batches/a-j-overview/assets.ts packages/catalog/src/exact/batches/a-j-overview/parts.ts packages/catalog/src/exact/batches/a-j-overview/plans.ts packages/catalog/src/exact/batches/a-j-overview/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-j-overview --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-j-overview
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-j-overview/manifest.ts packages/catalog/src/exact/batches/a-j-overview/components.ts packages/catalog/src/exact/batches/a-j-overview/assets.ts packages/catalog/src/exact/batches/a-j-overview/parts.ts packages/catalog/src/exact/batches/a-j-overview/plans.ts packages/catalog/src/exact/batches/a-j-overview/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-j-overview --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-overview
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-j-overview reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-j-overview --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-j-overview
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 87 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 88: a-k-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-k-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-k-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-k-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-k-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-k-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-k-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-k-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 87 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-k-01`, Selector `range(K.1–K.9)`,
  Component-Allocation ausschließlich `damage` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 9 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-k-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-k-01: expected 9 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(K.1–K.9)` aufgelösten 9 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-k-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 9 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `damage`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-k-01/manifest.ts packages/catalog/src/exact/batches/a-k-01/components.ts packages/catalog/src/exact/batches/a-k-01/assets.ts packages/catalog/src/exact/batches/a-k-01/parts.ts packages/catalog/src/exact/batches/a-k-01/plans.ts packages/catalog/src/exact/batches/a-k-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-k-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-k-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-k-01/manifest.ts packages/catalog/src/exact/batches/a-k-01/components.ts packages/catalog/src/exact/batches/a-k-01/assets.ts packages/catalog/src/exact/batches/a-k-01/parts.ts packages/catalog/src/exact/batches/a-k-01/plans.ts packages/catalog/src/exact/batches/a-k-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-k-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-k-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-k-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-k-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-k-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 88 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 89: a-k-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-k-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-k-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-k-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-k-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-k-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-k-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-k-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 88 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-k-02`, Selector `range(K.10–K.18)`,
  Component-Allocation ausschließlich `damage` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 9 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-k-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-k-02: expected 9 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(K.10–K.18)` aufgelösten 9 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-k-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 9 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `damage`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-k-02/manifest.ts packages/catalog/src/exact/batches/a-k-02/components.ts packages/catalog/src/exact/batches/a-k-02/assets.ts packages/catalog/src/exact/batches/a-k-02/parts.ts packages/catalog/src/exact/batches/a-k-02/plans.ts packages/catalog/src/exact/batches/a-k-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-k-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-k-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-k-02/manifest.ts packages/catalog/src/exact/batches/a-k-02/components.ts packages/catalog/src/exact/batches/a-k-02/assets.ts packages/catalog/src/exact/batches/a-k-02/parts.ts packages/catalog/src/exact/batches/a-k-02/plans.ts packages/catalog/src/exact/batches/a-k-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-k-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-k-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-k-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-k-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-k-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 89 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 90: a-l-all

**Files:**

- Create: `packages/catalog/src/exact/batches/a-l-all/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-l-all/components.ts`
- Create: `packages/catalog/src/exact/batches/a-l-all/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-l-all/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-l-all/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-l-all/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-l-all').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 89 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-l-all`, Selector `range(L.1–L.10)`,
  Component-Allocation ausschließlich `damage` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 10 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-l-all/cases.test.ts
  ```

  Erwartung: FAIL mit `a-l-all: expected 10 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(L.1–L.10)` aufgelösten 10 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-l-all/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 10 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `damage`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-l-all/manifest.ts packages/catalog/src/exact/batches/a-l-all/components.ts packages/catalog/src/exact/batches/a-l-all/assets.ts packages/catalog/src/exact/batches/a-l-all/parts.ts packages/catalog/src/exact/batches/a-l-all/plans.ts packages/catalog/src/exact/batches/a-l-all/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-l-all --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-l-all
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-l-all/manifest.ts packages/catalog/src/exact/batches/a-l-all/components.ts packages/catalog/src/exact/batches/a-l-all/assets.ts packages/catalog/src/exact/batches/a-l-all/parts.ts packages/catalog/src/exact/batches/a-l-all/plans.ts packages/catalog/src/exact/batches/a-l-all/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-l-all --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-l-all
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-l-all reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-l-all --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-l-all
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 90 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 91: a-m-01

**Files:**

- Create: `packages/catalog/src/exact/batches/a-m-01/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-m-01/components.ts`
- Create: `packages/catalog/src/exact/batches/a-m-01/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-m-01/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-m-01/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-m-01/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-m-01').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 90 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-m-01`, Selector `range(M.1–M.7)`,
  Component-Allocation ausschließlich `wildfire` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 7 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-m-01/cases.test.ts
  ```

  Erwartung: FAIL mit `a-m-01: expected 7 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(M.1–M.7)` aufgelösten 7 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-m-01/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 7 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `wildfire`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-m-01/manifest.ts packages/catalog/src/exact/batches/a-m-01/components.ts packages/catalog/src/exact/batches/a-m-01/assets.ts packages/catalog/src/exact/batches/a-m-01/parts.ts packages/catalog/src/exact/batches/a-m-01/plans.ts packages/catalog/src/exact/batches/a-m-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-m-01 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-m-01
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-m-01/manifest.ts packages/catalog/src/exact/batches/a-m-01/components.ts packages/catalog/src/exact/batches/a-m-01/assets.ts packages/catalog/src/exact/batches/a-m-01/parts.ts packages/catalog/src/exact/batches/a-m-01/plans.ts packages/catalog/src/exact/batches/a-m-01/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-m-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-m-01
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-m-01 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-m-01 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-m-01
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 91 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 92: a-m-02

**Files:**

- Create: `packages/catalog/src/exact/batches/a-m-02/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-m-02/components.ts`
- Create: `packages/catalog/src/exact/batches/a-m-02/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-m-02/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-m-02/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-m-02/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-m-02').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 91 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-m-02`, Selector `range(M.8–M.14)`,
  Component-Allocation ausschließlich `wildfire` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 7 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-m-02/cases.test.ts
  ```

  Erwartung: FAIL mit `a-m-02: expected 7 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `range(M.8–M.14)` aufgelösten 7 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-m-02/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 7 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `wildfire`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-m-02/manifest.ts packages/catalog/src/exact/batches/a-m-02/components.ts packages/catalog/src/exact/batches/a-m-02/assets.ts packages/catalog/src/exact/batches/a-m-02/parts.ts packages/catalog/src/exact/batches/a-m-02/plans.ts packages/catalog/src/exact/batches/a-m-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-m-02 --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-m-02
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-m-02/manifest.ts packages/catalog/src/exact/batches/a-m-02/components.ts packages/catalog/src/exact/batches/a-m-02/assets.ts packages/catalog/src/exact/batches/a-m-02/parts.ts packages/catalog/src/exact/batches/a-m-02/plans.ts packages/catalog/src/exact/batches/a-m-02/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-m-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-m-02
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-m-02 reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-m-02 --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-m-02
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 92 ab. Der Implementer spawned
  diese Reviewer nicht selbst.

### Task 93: a-n-all

**Files:**

- Create: `packages/catalog/src/exact/batches/a-n-all/manifest.ts`
- Create: `packages/catalog/src/exact/batches/a-n-all/components.ts`
- Create: `packages/catalog/src/exact/batches/a-n-all/assets.ts`
- Create: `packages/catalog/src/exact/batches/a-n-all/parts.ts`
- Create: `packages/catalog/src/exact/batches/a-n-all/plans.ts`
- Create: `packages/catalog/src/exact/batches/a-n-all/cases.test.ts`

**Interfaces:**

- Descriptor dependencies: exakt `corpusShard('a-n-all').readonlyDependencies`, die ausschließlich aus `batchOwnedRelationTargets(current)` und `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` mit dem vor Closure-Laden aus allen 90 vollständigen staged Descriptoren gebauten `StagedExactBatchOwnershipIndex` ermittelte minimale kanonische direkte Owner-Batch-Menge; niemals die bloß vorherige Tabellen-ID.
- Sequenzieller Vorlauf: Integration Task 0 und Corpus Task 92 sind grün; dies fügt keine Descriptor-Kante hinzu. Consumes: Corpus-Descriptor `a-n-all`, Selector `set(N.1.1–N.1.6, N.2.1–N.2.3)`,
  Component-Allocation ausschließlich `bodyMarks` und die geprüfte lokale Discovery-Evidence.
- Produces: genau ein `ExactBatchModule` mit 9 Exact-Asset-Fixtures,
  exakt den zugeordneten Display-/Component-/Part-/Plan-/Case-Keys und den fünf festen
  `BATCH_*`-Exporten. `BATCH_COMPONENTS` verwendet `fragments`, `variants`, `fixtures`,
  `componentCases`, `compositionContracts`, `contractCases` und `compositionWitnessEdges`; `BATCH_ASSETS` verwendet
  `assetFragments` und
  `recipeExactAssetLinks`; `BATCH_PARTS` hält `comparisonProfiles`, `maskContracts` und
  `ownershipEntries`; `BATCH_PLANS.plans` enthält ausschließlich `CompositionPlan`s. Trace und
  UseEdges werden materialisiert, nie als Sharddaten gespeichert; nur ihre erwarteten Keysets und
  Digests stehen in `BATCH_MANIFEST.ownedKeys` beziehungsweise `BATCH_MANIFEST.setDigests`.

- [ ] Erzeuge nur typsichere leere Kompilationsschalen und schreibe danach den vollständigen
  `cases.test.ts`. Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-n-all/cases.test.ts
  ```

  Erwartung: FAIL mit `a-n-all: expected 9 exact assets, received 0`; Imports, Syntax und
  Testumgebung sind fehlerfrei.
- [ ] Rekonstruiere alle durch `set(N.1.1–N.1.6, N.2.1–N.2.3)` aufgelösten 9 Assets sowie jeden zugewiesenen
  Component-, Part-, Ownership-, Contract-, Witness-, Display- und Composition-Plan-Eintrag nach
  Spec und dem gemeinsamen Vertrag in Abschnitt 8. Kein fremder Pfad wird verändert.
- [ ] Führe GREEN und die gemeinsamen Registry-Gates aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/a-n-all/cases.test.ts packages/catalog/src/exact/corpus-shards.test.ts packages/catalog/src/exact/component-allocation.test.ts
  ```

  Erwartung: PASS; exakt 9 Asset-Keys, keine fremde oder doppelte Ownership und nur
  Component-Family ausschließlich `bodyMarks`.
- [ ] Führe den vollständigen Batch-Null-Diff aus:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-n-all/manifest.ts packages/catalog/src/exact/batches/a-n-all/components.ts packages/catalog/src/exact/batches/a-n-all/assets.ts packages/catalog/src/exact/batches/a-n-all/parts.ts packages/catalog/src/exact/batches/a-n-all/plans.ts packages/catalog/src/exact/batches/a-n-all/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk pnpm cli conformance:batch --batch a-n-all --batch-source staged --reference-root ../../taktische-zeichen --evidence-out out/exact-reference/a-n-all
  ```

  Erwartung: jede NormalizedPaintList identisch; jede Größe und jeder Hintergrund
  `differentPixelCount=0`, `maxChannelDelta=0`, `alphaDeltaCount=0`, identische Bounds.
- [ ] Führe `rtk pnpm typecheck` und `rtk git diff --check` aus. Stage und committe
  ausschließlich die sechs oben gelisteten Dateien:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/a-n-all/manifest.ts packages/catalog/src/exact/batches/a-n-all/components.ts packages/catalog/src/exact/batches/a-n-all/assets.ts packages/catalog/src/exact/batches/a-n-all/parts.ts packages/catalog/src/exact/batches/a-n-all/plans.ts packages/catalog/src/exact/batches/a-n-all/cases.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --batch a-n-all --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-n-all
  rtk git -c core.fsmonitor=false commit -m "feat(exact): reconstruct a-n-all reference batch"
  ```

  Erwartung: Die Cached-Liste enthält exakt die sechs Owned-Dateien.
  `conformance:review` lädt die allowlistete Dependency-Closure und das aktuelle staged Modul;
  Dependency-Registries bleiben read-only; nur aktuelle Cases erzeugen Review-Ergebnisse. Sein
  zwingender
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt HEAD und staged Blobs gegen
  bytegleiche Oracle-Bytes/Blob-SHA-256-Treffer, eingebettetes Original-XML/Generator/Kommentare/Namespaces oder Oraclepfade und
  Raster-/Diffartefakte. Danach prüft `verifyStagedBatchBoundary(...)` den aktuellen Descriptor,
  exakt dessen sechs Owned-Dateien und Worktree-/Index-Blobgleichheit. Erst nach beiden Exit 0
  gelingt der Commit. Jeder
  spätere Fix-Commit dieses Tasks wiederholt denselben literal Befehl nach erneutem Staging.
- [ ] Stoppe nach dem Commit und melde HEAD plus Gateausgaben. Der Root-Orchestrator lässt zwei
  frische Agents gemäß Abschnitt 9 Spec/Code und jedes einzelne Bild prüfen. Sie führen den
  staged Closure-Loader nach dem Commit nicht mit leerem Index erneut aus, sondern vergleichen zuerst
  jeden committed Blobdigest mit dem unmittelbar vor dem Commit erzeugten Boundary-Report. Der
  hierfür ausgeführte literal Pre-Commit-Befehl war:

  ```bash
  rtk mise exec -- pnpm cli conformance:review --batch a-n-all --batch-source staged --reference-root ../../taktische-zeichen --out out/exact-reference/review/a-n-all
  ```

  Erst beide PASS-Berichte auf demselben HEAD schließen Task 93 ab. Der Implementer spawned
  diese Reviewer nicht selbst.


## Task 94: Root-only Aggregation aller 90 akzeptierten Module

**Ownership:** Nach 90/90 akzeptierten Batches bekommt ein frischer Root-Integrator als einziger
Agent Schreibrecht auf `packages/catalog/src/exact/batches/index.ts` und `index.test.ts`. Er ändert
keinen Batch.

**Files:**

- Modify: `packages/catalog/src/exact/batches/index.ts`
- Modify: `packages/catalog/src/exact/batches/index.test.ts`

**Interfaces:**

- Consumes: Corpus Tasks 4–93, die fünf festen Exporte aller 90 akzeptierten
  `ExactBatchModule`s, `EXPECTED_BATCH_IDS`, den Foundation-Canary-Aggregator, Integration Task 0
  und `registerExactBatchModules(modules): ExactCatalogRegistry`.
- Produces: die unten vollständig benannten, kanonisch sortierten Korpusregister für Catalog-API,
  Integration, Review, Conformance und Release.

- [ ] Ersetze zuerst im bereits von Foundation erzeugten `index.test.ts` die Canary-Erwartung
  durch exakte globale Mengen- und Keysettests. Vor der Aggregatoränderung muss der Test rot sein,
  weil die bestehenden, compile-sicheren Exporte `EXACT_BATCH_MODULES` und
  `EXACT_CATALOG_REGISTRY` noch den Foundation-Canary statt der 90 Corpus-IDs enthalten.
- [ ] Führe RED aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/index.test.ts
  ```

  Erwartung: FAIL mit der exakten Differenz zwischen `EXPECTED_BATCH_IDS` und der noch
  registrierten Canary-ID; kein Import-, Syntax- oder Umgebungsfehler.
- [ ] Importiere alle 90 Batch-Exports explizit und konstruiere je ID genau ein
  `ExactBatchModule`. Keine Dateisystemsuche, kein dynamisches Runtime-Importieren und keine
  unkanonische Objektiteration.
- [ ] Entferne aus `index.ts` den Import, die Assembly und den Export
  `BASE_FORMATION_CANARY_BATCH` vollständig. `EXACT_BATCH_MODULES` ist danach exakt die
  90-elementige Corpusfolge aus `EXPECTED_BATCH_IDS`, nicht 90 plus Canary. Die physischen
  Foundation-Canary-Dateien bleiben unverändert, sind aber weder registriert noch öffentlich
  aggregiert.
- [ ] Übergib die Module in Tabellenreihenfolge an `registerExactBatchModules`; dessen Exporte
  sind kanonisch sortiert und enthalten mindestens:

  - `EXACT_BATCH_MODULES`
  - `EXACT_CATALOG_REGISTRY`
  - `EXACT_ASSET_FIXTURES`
  - `EXACT_COMPONENT_FIXTURES`
  - `EXACT_COMPONENT_VARIANTS`
  - `EXACT_CATALOG_REGISTRY.displayFixtures`
  - `RECIPE_EXACT_ASSET_LINKS`
  - `ORACLE_PARTS`
  - `COMPOSITION_PLANS`
  - `COMPOSITION_CONTRACT_CASES`
  - `EXACT_CATALOG_REGISTRY.compositionWitnessEdges`
  - `EXACT_CATALOG_REGISTRY.referenceComponentContextOwnershipDigest`
  - `CONFORMANCE_CASES` als Projektion von `EXACT_CATALOG_REGISTRY.conformanceCases`
  - Batchmanifeste und alle manifestierten Keysets

- [ ] Der Test prüft mindestens: 90 Batchmanifeste; 661 OracleAssets/ExactAssets/AssetCases;
  544 Displays/DisplayCases als exakte CoverageManifest-Keymenge; davon 525 Whole und 19 Part;
  exakt 242 eindeutige Recipe→ExactAsset-Links;
  413 Component-Keys; alle ComponentFixture-/ComponentCase-/OraclePart-/UseEdge-/Contract-/Witness-Keysets gegen
  das ConformanceManifest; die totale `ReferenceComponentContextSet/v1`-Paarmenge als exakt
  `REACHABLE_BUILDER_CONTEXT_SET.pairs.length + 151 + 15`; die `public-builder`-Paarprojektion ist
  mengengleich `ReachableBuilderContextSet/v1` und projiziert exakt 247 eindeutige Component-Keys,
  während kein `reference-only`/`direct-carrier`-Paar builder-erreichbar ist;
  keine Duplikate/Lücken/Forward-Edges;
  keine offenen, abweichenden oder invalidierten Cases.
- [ ] Pinne die Case-Projektion auf den Foundation-Vertrag: gespeicherte
  `EXACT_CATALOG_REGISTRY.assetCases`, `.displayCases` und `.componentCases` bilden exakt die
  kanonisch sortierte, duplikatfreie Map `EXACT_CATALOG_REGISTRY.conformanceCases`; nur diese wird
  als `CONFORMANCE_CASES` projiziert. Für die Component-Teilmenge gilt
  `set(componentCases.componentFixture) === set(componentFixtures.key)`, jeder Case gehört zum
  Fixture-ownenden Batch und jede Digestbindung löst closure-weit auf. Keine Dependency-Closure
  dupliziert einen Case. Zusätzlich gilt
  `set(componentFixtures.(component,context)) === set(REFERENCE_COMPONENT_CONTEXT_SET.pairs)`;
  ContractCases und Witnesses decken dieselbe totale Paarmenge ab, nicht nur die öffentliche
  Builder-Teilmenge. Der Aggregator leitet für jedes totale Pair seinen Owner ausschließlich über
  die bijektive ComponentFixture und deren bytegleich in Descriptor und Manifest manifestierten
  Owner ab. Dafür ruft er exakt einmal
  `deriveReferenceComponentContextOwnership(REFERENCE_COMPONENT_CONTEXT_SET,
  EXACT_CATALOG_REGISTRY.componentFixtures, buildExactBatchKeyOwnerIndex(EXACT_BATCH_MODULES))`
  auf und verlangt ein `ReferenceComponentContextOwnershipV1`-Resultat exakt der Form
  `{ version, records, digestInput }`. Die kanonisch sortierten Records werden nicht als 22.
  Batchcollection gespeichert; nur der SHA-256 über `digestInput` erscheint als
  `EXACT_CATALOG_REGISTRY.referenceComponentContextOwnershipDigest` und in Freshness-Bindings.
- [ ] Pinne die ID-Grenze wörtlich:

  ```ts
  const batchIds = EXACT_BATCH_MODULES.map(({ manifest }) => manifest.id);
  expect(batchIds).toEqual(EXPECTED_BATCH_IDS);
  expect(EXACT_BATCH_MODULES).toHaveLength(90);
  expect(batchIds).not.toContain('base-formation-canary');

  const expectedRegistryBatchIds = [...EXPECTED_BATCH_IDS].sort();
  expect(EXACT_CATALOG_REGISTRY.batchIds).toEqual(expectedRegistryBatchIds);
  expect([...EXACT_CATALOG_REGISTRY.modulesById.keys()]).toEqual(expectedRegistryBatchIds);
  expect(EXACT_CATALOG_REGISTRY.batchIds).not.toContain('base-formation-canary');
  ```

  Derselbe Test prüft, dass `ORACLE_OWNERSHIP_MANIFEST` exakt von den 90
  `BATCH_PARTS.ownershipEntries` erfüllt wird und dass `BATCH_ASSETS.recipeExactAssetLinks` die
  einzige Recipe-Zuordnungsquelle ist.
- [ ] Ergänze adversariale Aggregatortests für doppelten Asset-Key, doppelten Fixture-Key,
  fehlenden Batch, Canary-Zusatz, unsortierten Export, unbekanntes Edge-Ende, eine Abweichung
  zwischen aus `BATCH_PLANS.plans` materialisierten Trace-/UseEdge-Keys und deren erwarteten
  Manifestsets, fehlende/zusätzliche Pair↔Fixture-Zuordnung, Descriptor-/Manifest-Ownerdrift,
  eingebettete Pair-Ownershipdaten, falschen `referenceComponentContextOwnershipDigest` sowie
  eine zweite Whole-Geometriequelle. Es existiert keine handgeschriebene Trace- oder
  Pair-Ownership-Collection.
- [ ] Führe GREEN aus:

  ```bash
  rtk pnpm vitest run packages/catalog/src/exact/batches/index.test.ts \
    packages/catalog/src/exact/corpus-shards.test.ts \
    packages/catalog/src/exact/component-allocation.test.ts \
    packages/catalog/src/exact/batches/*/cases.test.ts
  rtk pnpm test
  rtk pnpm typecheck
  rtk pnpm build
  rtk git diff --check
  ```

  Erwartung: alle Prozesse Exit 0 und alle harten Mengen-/Graphinvarianten exakt erfüllt.
- [ ] Stage ausschließlich Aggregator und Aggregatortest. Führe vor dem Commit den Root-
  Registry-/All-Pfad von Integration Task 0 aus; sein gemeinsamer
  `verifyRepositorySourceBoundary(...)`-Vorlauf scannt erneut jeden HEAD-Blob und die beiden
  staged Root-Blobs gegen Originaldigests, SVG/XML/Quellkommentare, lokale Orakelpfade und
  Raster-/Diffartefakte:

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/index.ts \
    packages/catalog/src/exact/batches/index.test.ts
  rtk git -c core.fsmonitor=false diff --cached --name-only
  rtk git -c core.fsmonitor=false diff --cached --check
  rtk mise exec -- pnpm cli conformance:review --all \
    --reference-root ../../taktische-zeichen \
    --out out/exact-reference/review/all
  rtk git -c core.fsmonitor=false commit -m "feat(exact): aggregate complete reference corpus"
  ```

  Erwartung: Cached exakt diese zwei Root-Dateien; der All-Pfad sieht exakt 90 Corpus-IDs und
  661 Assets, keine Canary-ID und keinen Source-Leak. Erst sein Exit 0 erlaubt den Commit.

## Task 95: vollständige, ungefilterte Korpusabnahme

Vor dem ersten Dispatch dieses Tasks erzeugt Root nach grüner Integration Task 24 den initialen
Brief ausschließlich mit dem seit Task 1 unveränderten Builder:

```bash
rtk node scripts/exact/build-corpus-brief.mjs --plan docs/superpowers/plans/2026-09-04-exact-reference-corpus.md --task95-attempt 001 --out .superpowers/sdd/exact-reference-corpus/task-95-attempt-001-brief.md
rtk rg '\x3c[A-Za-z][A-Za-z0-9_-]*\x3e' .superpowers/sdd/exact-reference-corpus/task-95-attempt-001-brief.md
```

Erwartung: Builder Exit 0, `rg` Exit 1. Nach genau einer literal Current-Path-Kopfzeile enthält die
Ausgabe den exakten markerfreien Realpath-Smoke samt literal Befehl, danach genau Task 95, und
bindet Current `001` sowie den direkten Retry `002`. Ein generischer `task-brief`-Auszug oder ein manuell vorangestellter
Planabschnitt ist für Task 95 verboten.

Dieser Task folgt nach den verbleibenden Consumer-/Review-/Packaging-Tasks des Integrationsplans,
damit die Abnahme den tatsächlich auszuliefernden Stand prüft.

Task 95 verändert keine Source-Datei und implementiert kein Verhalten; daher gibt es hier keine
künstliche RED-Phase. Er akzeptiert ausschließlich den bereits compile-sicheren integrierten Stand
über die nachfolgenden vollständigen, fail-closed Verifikationsgates.

**Consumes:** Corpus Task 94 sowie vollständig grüne Integration Tasks 1–24. Task 95 darf nicht
direkt auf Task 94 folgen; der Strict-Runner und das vollständige Artefakt-Gate existieren erst
nach der Integration.

- [ ] Starte aus dem vorgeschriebenen Worktree-Root auf demselben sauberen HEAD, wiederhole den
  oben definierten Realpath-Smoke und prüfe `rtk git -c core.fsmonitor=false status --short
  --untracked-files=all`. Außer ignorierten Oracle-/Evidence-Dateien ist kein Eintrag zulässig.
  Der relative Oraclepfad bleibt wörtlich `../../taktische-zeichen`. Lösche oder überschreibe
  keine ältere Task-24-Evidence. Der in diesem Brief gebundene Task-95-Attempt ist exakt das
  neue, vorher nicht
  existierende Verzeichnis `out/exact-reference/task-95-run-001`; existiert es bereits, bricht
  der erste Attempt vor Prepare ab. Kein Attempt sucht oder verwendet „latest“, überschreibt ein
  vorhandenes Run-Verzeichnis oder benutzt Dateien eines früheren Attempts als Input/Fallback.
  Insbesondere muss `out/exact-reference/task-95-run-001/strict-runs/current` vor Prepare absent
  sein; Prepare erzeugt diesen Pfad atomar und entdeckt keinen vorhandenen Strict-Run.
  Task 95 führt kein
  `git add` aus und staged keine Datei; `rtk git -c core.fsmonitor=false diff --cached --quiet`
  muss vor dem nächsten Schritt Exit 0 liefern.
- [ ] Erzeuge vor Prepare die einzige technische Reviewer-Registry dieses neuen Runs:

  ```bash
  rtk mise exec -- pnpm cli conformance reviewer-registry init \
    --out out/exact-reference/task-95-run-001/reviewers/technical-reviewers.json \
    --reviewer-id independent-agent-review \
    --reviewer-name "Independent exact-reference reviewer" \
    --reviewer-qualification "independent visual conformance review"
  ```

  Erwartung: kanonisches ignoriertes `TechnicalReviewerRegistry/v1`, Reviewer aktiviert, Digest
  verifiziert; keine Domainfreigabe, Signieridentität oder Release-Autorisierung.
- [ ] Führe als einzigen Prepare-Orchestrator exakt Integration Task 23
  `verify:exact:prepare` mit sämtlichen Pflichtargumenten aus:

  ```bash
  rtk mise exec -- pnpm verify:exact:prepare \
    --reference-root ../../taktische-zeichen \
    --strict-run-out out/exact-reference/task-95-run-001/strict-runs/current/strict-run.json \
    --review-binding-out out/exact-reference/task-95-run-001/strict-runs/current/review-binding.json \
    --review-root out/exact-reference/task-95-run-001/review \
    --technical-reviewer-registry out/exact-reference/task-95-run-001/reviewers/technical-reviewers.json \
    --reviewer independent-agent-review \
    --artifact-root out/exact-reference/task-95-run-001/artifacts \
    --artifact-manifest out/exact-reference/task-95-run-001/artifacts/artifact-set.json \
    --result-out out/exact-reference/task-95-run-001/prepare-result.json
  ```

  Erwartung: Exit 0. Strict-Record und Review-Binding sind die zwei kanonischen Dateien im zuvor
  absent Verzeichnis `strict-runs/current/` dieses Attempts. Das Artifact-Set-Manifest bindet
  ausschließlich HEAD, `SOURCE_DATE_EPOCH` und die geschlossene Artefaktinventar-/Digestmenge;
  es behauptet keine Strict-, Review- oder Case-Bindung. Review-Binding und Review-Evidence
  binden dagegen Strict-Run und vollständige Case-/Pair-Keymengen. Erst `prepare-result.json`
  bindet die Digests von Strict-Record, Review-Binding/-Evidence, Reviewer-Registry und
  Artifact-Manifest gemeinsam. Das Manifest ist exakt
  `out/exact-reference/task-95-run-001/artifacts/artifact-set.json`, ohne
  Suche oder impliziten Fallback. Prepare ruft intern ausschließlich den unge-stagten
  `conformance:review --all`-Pfad auf; weder Task 95 noch Prepare erzeugt einen staged Batchmodus.
- [ ] Prüfe die neuen Prepare-Ausgaben als exakte Mengen: 661 AssetCases, 544 DisplayCases
  (525 Whole/19 Part) und genau alle in `EXACT_CATALOG_REGISTRY.componentCases` gespeicherten
  ComponentCases haben vollständige Digestbindungen und Null-Diff-PairResults. Das neue
  Artifact-Manifest inventarisiert sämtliche Package-Tarball-, Website-, QGIS- und
  Release-Artefakte; keine Dependency-Closure dupliziert einen Case.
- [ ] Vor Serverstart und vor jeder visuellen Inspection prüft ein frischer, von allen
  Implementierungs- und Visual-Agenten unabhängiger Spec-/Qualitäts-Reviewer den vollständigen
  aktuellen Branchdiff tatsächlich Datei für Datei, die amendierte Spezifikation, Foundation-,
  Corpus- und Integrationsplan sowie Prepare-Result und dessen gebundene Inputs. Erst nach dieser
  Code-/Diffprüfung und seinen zwei ausdrücklichen PASS-Verdicts darf die unten benannte CLI per
  `O_EXCL|O_NOFOLLOW`, fsync und atomarem Rename genau einen frischen ignorierten Report schreiben:
  `out/exact-reference/task-95-run-001/spec-quality-review.json`; kein früherer Attempt, Task-24-
  Report oder vor der Prüfung erzeugtes Fixture darf kopiert oder wiederverwendet werden.

  Der kanonisch JCS-plus-LF serialisierte Vertrag ist:

  ```ts
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
  ```

  `recordDigest` ist SHA-256 über die kanonische Darstellung ohne dieses Feld. `head` und
  `branchDiff.head` müssen dem unmittelbar neu gelesenen HEAD entsprechen; der Diffdigest bindet
  exakt `branchDiff.base..head`, und `branchDiff.base` muss dem vor Foundation Task 1 im
  Foundation-Ledger unveränderlich aufgezeichneten `BASE` entsprechen. Die vier File-Digests
  werden direkt vor Veröffentlichung neu aus den Bytes berechnet. `runRoot` ist exakt
  `out/exact-reference/task-95-run-001`; `reviewedFiles.specification.path` ist exakt
  `docs/superpowers/specs/2026-09-04-exact-reference-parity-design.md`. Das Plan-Tuple enthält in
  dieser Reihenfolge exakt
  `docs/superpowers/plans/2026-09-04-exact-reference-foundation.md`,
  `docs/superpowers/plans/2026-09-04-exact-reference-corpus.md` und
  `docs/superpowers/plans/2026-09-04-exact-reference-integration.md`. `prepare.result` bindet den
  exakten Pfad und Digest von
  `out/exact-reference/task-95-run-001/prepare-result.json`; die fünf kopierten Inputdigests müssen dessen verifizierten Werten und den
  aktuellen Dateien bytegleich entsprechen. Nur `verdict: 'PASS'` mit dem typseitig literal leeren
  `blockers`-Tuple ist ein `SpecQualityReviewRecord` und öffnet das Visual-/Attestation-Gate. Jeder
  `Spec`-, `Critical`- oder `Important`-Befund verhindert die Erzeugung eines akzeptierten Records;
  der Reviewer schreibt ihn stattdessen in einen getrennten, nicht gatefähigen
  `spec-quality-findings.json`, der Server akzeptiert diese Datei nie. Der Befund verhindert den
  Serverstart beziehungsweise stoppt einen bereits laufenden Server, geht an einen frischen
  task-scoped Fixer, wird von einem neuen unabhängigen Reviewer erneut geprüft und erzwingt danach
  einen vollständig neuen Attempt.

  Nach den zwei unabhängigen PASS-Verdicts finalisiert ausschließlich die Integration-Task-21-CLI
  den Record; sie ist kein Review- oder Auto-PASS-Generator:

  ```bash
  rtk mise exec -- pnpm cli conformance spec-quality-review record \
    --amended-spec docs/superpowers/specs/2026-09-04-exact-reference-parity-design.md \
    --foundation-plan docs/superpowers/plans/2026-09-04-exact-reference-foundation.md \
    --corpus-plan docs/superpowers/plans/2026-09-04-exact-reference-corpus.md \
    --integration-plan docs/superpowers/plans/2026-09-04-exact-reference-integration.md \
    --prepare-result out/exact-reference/task-95-run-001/prepare-result.json \
    --technical-reviewer-registry out/exact-reference/task-95-run-001/reviewers/technical-reviewers.json \
    --reviewer independent-agent-review \
    --agent-run-id task-95-run-001-spec-quality-review \
    --verdict PASS \
    --out out/exact-reference/task-95-run-001/spec-quality-review.json
  ```

  Erwartung: Exit 0 und genau der oben definierte immutable PASS-Record. Die CLI liest den
  Foundation-Ledger-`BASE`, berechnet Diff und alle Digests selbst und weist ein vorhandenes Ziel,
  einen nicht frischen Agent-Run oder irgendeinen Cross-Run-/Current-Mismatch ab.
- [ ] Führe erst nach diesem Spec-/Qualitäts-PASS den Drei-Browser-Kompatibilitätsgate aus:

  ```bash
  rtk mise exec -- env SOURCE_DATE_EPOCH=$(rtk git -c core.fsmonitor=false show -s --format=%ct HEAD) \
    pnpm --filter @einsatzzeichen/review test:browser:exact -- \
    --strict-run out/exact-reference/task-95-run-001/strict-runs/current/strict-run.json \
    --review-binding out/exact-reference/task-95-run-001/strict-runs/current/review-binding.json \
    --evidence-root out/exact-reference/task-95-run-001/review \
    --technical-reviewer-registry out/exact-reference/task-95-run-001/reviewers/technical-reviewers.json \
    --reviewer independent-agent-review \
    --spec-quality-review out/exact-reference/task-95-run-001/spec-quality-review.json \
    --session-token-out out/exact-reference/task-95-run-001/browser/session-token \
    --review-freeze-out out/exact-reference/task-95-run-001/browser/shutdown-freeze.json
  ```

  Erwartung: Chromium, Firefox und WebKit PASS und das kanonische
  `out/exact-reference/task-95-run-001/browser/summary.json`; der Browser-Supervisor beendet sein
  eigenes erfasstes Child, entfernt sein Token, schließt seinen Port und publiziert ausschließlich
  den separaten `browser/shutdown-freeze.json`. Diese Kompatibilitätsevidence ersetzt weder die
  folgenden individuellen Visual-Inspections noch deren `review/review-freeze.json`. Jeder Fehler
  erhält den Attempt unverändert und erzwingt Fix, Re-Review und einen neuen Attempt.
- [ ] Starte erst nach Prepare, Spec-/Qualitäts-PASS und Drei-Browser-Gate einen **neuen**
  authentifizierten Reviewserver, der ausschließlich den neuen Strict-Record, dessen neues
  `--review-binding` und den neuen Review-Root akzeptiert:

  ```bash
  rtk mise exec -- pnpm --filter @einsatzzeichen/review serve:conformance -- \
    --evidence-root out/exact-reference/task-95-run-001/review \
    --strict-run out/exact-reference/task-95-run-001/strict-runs/current/strict-run.json \
    --review-binding out/exact-reference/task-95-run-001/strict-runs/current/review-binding.json \
    --technical-reviewer-registry out/exact-reference/task-95-run-001/reviewers/technical-reviewers.json \
    --reviewer independent-agent-review \
    --spec-quality-review out/exact-reference/task-95-run-001/spec-quality-review.json \
    --session-token-out out/exact-reference/task-95-run-001/review-session/token \
    --review-freeze-out out/exact-reference/task-95-run-001/review/review-freeze.json \
    --host 127.0.0.1 \
    --port 0
  ```

  Vor dem Listen prüft der Server den kanonischen Recorddigest, Current-HEAD, Diff-, Spec-, alle
  drei Plan-, Prepare- und Inputdigests sowie den frischen unabhängigen Reviewer-Run und verlangt
  `PASS`/leere Blocker. Der verifizierte Spec-Quality-Recorddigest geht in Readiness und jede vom
  Server abgeleitete Inspection ein. Root hält den aus dem gestarteten Child stammenden PID und
  den aus dessen Readiness stammenden dynamischen Port ausschließlich im Prozessspeicher; weder
  ein Prozessscan noch eine PID-/Portsuche darf diese Werte ersetzen. Erst nach diesem separaten
  Spec-/Qualitäts-`PASS` führen
  frische Visual-Reviewer für **jeden**
  neuen Case-Key und jedes laut
  Binding erforderliche `full`-, `selected`- oder `without-selected`-Pair die authentifizierte
  `conformance inspection append`-Operation mit den literal aus Registry/Binding expandierten
  Case-/Pairwerten aus. Der initiale und jeder spätere Builderbrief werden vor
  Dispatch mit `rtk rg '\x3c[A-Za-z][A-Za-z0-9_-]*\x3e'` geprüft und nur bei Exit 1 verwendet. Niemand
  editiert Evidence-JSON; kein Befund oder Digest aus Task 24 wird wiederverwendet. Jeder
  Mismatch stoppt den Server und erzwingt Fix, unabhängigen Spec-/Qualitäts-Re-Review, einen
  vollständig neuen Task-95-Attempt und alle Inspections erneut.
- [ ] Nach dem letzten erforderlichen aktuellen `matches` und **vor** Trust oder Attestation
  friert der `serve:conformance`-Supervisor den erfolgreichen Reviewlauf ein. Root terminiert
  ausschließlich den beim Start erfassten Review-Child-PID. Der Supervisor wartet dessen
  tatsächliches Ende ab, entfernt exakt
  `out/exact-reference/task-95-run-001/review-session/token` und belegt anschließend sowohl dessen
  Abwesenheit als auch `connection refused` am erfassten Loopback-Port. Erst danach hasht er den
  vollständigen kanonisch pfadsortierten Reviewbaum einschließlich aller Inspection-Bytes, aber
  ausschließlich des noch absenten Freeze-Records, und schreibt per `O_EXCL|O_NOFOLLOW`, fsync und
  atomarem Rename exakt das beim Start festgelegte
  `out/exact-reference/task-95-run-001/review/review-freeze.json` mit folgendem JCS-plus-LF-Vertrag:

  ```ts
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
  ```

  `recordDigest` ist SHA-256 über die kanonische Darstellung ohne dieses Feld.
  Für Task 95 sind `runRoot`, `reviewRoot`, `reviewer` und `shutdown.sessionTokenPath` exakt die
  oben literal benannten Current-Run-Werte. `reviewTreeDigest` hasht den regulären Reviewbaum mit explizitem Ausschluss ausschließlich des
  eigenen `review/review-freeze.json`; so entsteht keine selbstreferenzielle Digestdefinition.
  Alle gebundenen Digests werden nach dem Child-Exit aus den aktuellen Bytes neu berechnet; der
  Spec-Quality-Digest muss dem vom Server akzeptierten Record entsprechen. Root akzeptiert nur den
  vom gestarteten Supervisor am exakten `--review-freeze-out` veröffentlichten Record und
  verifiziert ihn frisch. Vor Trust, unmittelbar vor `conformance attest` und erneut in
  `verify:exact:final` wird derselbe ausgeschlossene Reviewbaum neu gehasht und muss bytegleich
  `reviewTreeDigest` ergeben. Ein weiter laufendes Child, vorhandenes Token, erreichbarer Port,
  fehlender/abweichender Freeze-Record oder irgendein späterer Review-/Inspection-Drift lässt den
  Attempt unverändert fehlschlagen; Trust und Attestation starten dann nicht.
- [ ] Bei jedem fehlgeschlagenen Gate oder Mismatch bleibt der gesamte bisherige Attempt
  unverändert erhalten. Nach Fix und unabhängigem Re-Review wird der vorherige kanonische
  dezimale Attemptzähler mit exakter `BigInt`-Addition um eins erhöht; exakt der dadurch bestimmte,
  auf mindestens drei Stellen zero-padded Verzeichnisname
  muss absent sein. Für den ersten Retry erzeugt der Builder so den vollständig auf
  `out/exact-reference/task-95-run-002` rebasierten Brief:

  ```bash
  rtk node scripts/exact/build-corpus-brief.mjs --plan docs/superpowers/plans/2026-09-04-exact-reference-corpus.md --task95-attempt 002 --out .superpowers/sdd/exact-reference-corpus/task-95-attempt-002-brief.md
  rtk rg '\x3c[A-Za-z][A-Za-z0-9_-]*\x3e' .superpowers/sdd/exact-reference-corpus/task-95-attempt-002-brief.md
  ```

  Erwartung: Builder Exit 0, `rg` Exit 1; alle Current-/Evidence-Pfade im Brief verwenden
  konsistent das Current-Run-Token. Ausschließlich die explizit abgegrenzte direkte Retry-Anweisung
  und ihr Output-Brief verwenden das unmittelbare Next-Run-/Next-Attempt-Token. Die in Task 1
  festgelegten exakten Tokenanzahlen und der Ausschluss alter beziehungsweise übersprungener Tokens
  belegen die nicht-kaskadierende Substitution. Spätere Retries verwenden entsprechend `003`,
  `004` und so weiter, niemals eine Lücke, einen vorhandenen Namen oder einen alten Run als Quelle.
  Jeder neue Attempt beginnt
  wieder bei Reviewer-Registry-Init und Prepare und wiederholt Spec-/Qualitäts-PASS,
  Drei-Browser-Kompatibilität, sämtliche Visual-Inspections, erfolgreichen Server-Shutdown,
  Review-Freeze, Trust, Attestation, Verify und Final.
- [ ] Erzeuge für genau diesen neuen Run eine eigene development-technische Signieridentität:

  ```bash
  rtk mise exec -- pnpm cli conformance trust init \
    --purpose development-technical \
    --out out/exact-reference/task-95-run-001/trust \
    --issuer corpus-task-95-review \
    --key-id corpus-task-95-review-2026 \
    --technical-reviewer-registry out/exact-reference/task-95-run-001/reviewers/technical-reviewers.json \
    --reviewer independent-agent-review \
    --valid-from 2026-09-05T00:00:00Z \
    --valid-until 2027-09-05T00:00:00Z
  ```

  Danach publiziert genau ein all-or-nothing-Aufruf den Attestation-Satz atomar in das neue
  Run-Verzeichnis:

  ```bash
  rtk mise exec -- pnpm cli conformance attest \
    --strict-run out/exact-reference/task-95-run-001/strict-runs/current/strict-run.json \
    --review-root out/exact-reference/task-95-run-001/review \
    --technical-reviewer-registry out/exact-reference/task-95-run-001/reviewers/technical-reviewers.json \
    --trust-store out/exact-reference/task-95-run-001/trust/trust-store.json \
    --signing-key out/exact-reference/task-95-run-001/trust/corpus-task-95-review-2026.pem \
    --issuer corpus-task-95-review \
    --key-id corpus-task-95-review-2026 \
    --attestation-dir out/exact-reference/task-95-run-001/attestations
  ```

  Erwartung: Der Preflight verlangt die vollständige neue Case-/Pairmenge und ausschließlich
  Inspections, die den neuen Strict-Run, dessen Review-Binding und den im Freeze gebundenen
  Spec-Quality-Recorddigest binden; der unmittelbar neu berechnete Reviewbaum muss weiter dem
  `ReviewFreezeRecord` entsprechen. Der Writer rereadet und verifiziert jedes Attest und
  veröffentlicht das Verzeichnis erst atomar vollständig. Jede Attestation bindet im Feld
  `referenceComponentContextOwnershipDigest` exakt den frisch aus
  `ReferenceComponentContextOwnershipV1.digestInput` abgeleiteten Wert; `records` selbst sind
  keine Attestation- oder Batchcollection.
  Task-24-Attestations sind weder Input noch Fallback.
- [ ] Verifiziere den neu publizierten Satz vor dem Final-Orchestrator noch einmal mit denselben
  expliziten Reviewer-/Trust-/Strict-Eingaben:

  ```bash
  rtk mise exec -- pnpm cli conformance attestations verify \
    --dir out/exact-reference/task-95-run-001/attestations \
    --technical-reviewer-registry out/exact-reference/task-95-run-001/reviewers/technical-reviewers.json \
    --trust-store out/exact-reference/task-95-run-001/trust/trust-store.json \
    --strict-run out/exact-reference/task-95-run-001/strict-runs/current/strict-run.json
  ```

  Erwartung: Exit 0; jede Attestation bindet den neuen Strict-Run, den Digest genau dieser
  Reviewer-Registry und `independent-agent-review`.
- [ ] Führe als einzigen Final-Orchestrator exakt Integration Task 23
  `verify:exact:final` mit sämtlichen Pflichtargumenten und denselben neuen Run-Eingaben aus:

  ```bash
  rtk mise exec -- pnpm verify:exact:final \
    --reference-root ../../taktische-zeichen \
    --strict-run out/exact-reference/task-95-run-001/strict-runs/current/strict-run.json \
    --review-binding out/exact-reference/task-95-run-001/strict-runs/current/review-binding.json \
    --review-root out/exact-reference/task-95-run-001/review \
    --technical-reviewer-registry out/exact-reference/task-95-run-001/reviewers/technical-reviewers.json \
    --reviewer independent-agent-review \
    --spec-quality-review out/exact-reference/task-95-run-001/spec-quality-review.json \
    --review-freeze out/exact-reference/task-95-run-001/review/review-freeze.json \
    --attestation-dir out/exact-reference/task-95-run-001/attestations \
    --trust-store out/exact-reference/task-95-run-001/trust/trust-store.json \
    --artifact-root out/exact-reference/task-95-run-001/artifacts \
    --artifact-manifest out/exact-reference/task-95-run-001/artifacts/artifact-set.json \
    --result-out out/exact-reference/task-95-run-001/final-result.json
  ```

  Erwartung: Exit 0 erst nach Source-/Current-Identity, Strict-/Review-Binding-Freshness,
  erneuter Verifikation des aktuellen Spec-Quality-PASS, der gebundenen Drei-Browser-Summary und
  des Review-Freeze einschließlich
  abwesendem Session-Token, geschlossenem erfassten Port und bytegleichem Reviewbaum,
  vollständiger neuer Pair-Inspection, vollständiger neuer Attestation-Verifikation,
  Artifact-Verifikation gegen genau das angegebene Manifest und Git-Cleanliness. `final` baut
  nichts neu, schreibt Review/Attestations nicht um und veröffentlicht nichts.
  `final-result.json` bindet die Digests aller expliziten Eingaben einschließlich
  `spec-quality-review.json` und `review-freeze.json`; das Artifact-Set selbst bleibt
  auf HEAD/Epoch/Artefaktclosure beschränkt und wird nicht nachträglich als Strict-/Case-Binding
  umgedeutet. Strict-Run, Review-Binding, Inspections, Attestations und Final-Result binden
  denselben frisch aus
  `deriveReferenceComponentContextOwnership(referenceSet, componentFixtures, ownerIndex).digestInput`
  abgeleiteten
  `referenceComponentContextOwnershipDigest`; kein Record darf ihn aus einem eingebetteten
  Pair-Owner-Feld oder einer zusätzlichen Batchcollection beziehen.
- [ ] Prüfe im final gebundenen Strict-Record zusätzlich die Quellmerkmale
  2.336/965/2.155-in-601/124/102/4, 55 Transformationen in 53 Dateien, fünf ViewBox-Familien und
  den leeren FontSet-Digest sowie die totale `ReferenceComponentContextSet/v1`-Abdeckung: Die
  `public-builder`-Paarprojektion ist exakt `REACHABLE_BUILDER_CONTEXT_SET.pairs` und besitzt 247
  eindeutige Component-Keys; hinzu kommen exakt 151 `reference-only`- und 15
  `direct-carrier`-Reihen. Die dynamische Total-Paarzahl, Fixtures und ComponentCases sind exakt
  gleich; ihre eindeutige Component-Key-Projektion ist 413. Jeder totale Pair besitzt OraclePart-/Contract-/Witness-
  Nachweis. Die technische Abnahme ist keine Domain-/Rechtsfreigabe und erzeugt
  keine öffentliche Release-Autorisierung.

## 14. Abschlusskriterien dieses Plans

- [ ] `CORPUS_SHARDS` enthält exakt die 90 Tabellen-IDs; aufgelöst sind es paarweise disjunkt
  exakt alle 661 OracleAssetKeys, keiner mehr und keiner weniger, nie mehr als zwölf je Shard.
- [ ] Alle 90 Shardverzeichnisse enthalten exakt die sechs festen Dateien und wurden von 90
  verschiedenen Implementierungs-Agenten plus unabhängigen Spec-/Visual-Reviewern bearbeitet.
- [ ] 661 ExactAssetFixtures/AssetCases, 544 DisplayFixtures/DisplayCases (525 Whole, 19 Part),
  alle ComponentFixtures/-Cases, alle 413 Component-Keys, die totale
  `ReferenceComponentContextSet/v1`-Menge als disjunkte Union aus allen dynamisch vielen
  `REACHABLE_BUILDER_CONTEXT_SET.pairs`, 151 `reference-only`- und 15 `direct-carrier`-Reihen und
  alle 242 eindeutigen
  Recipe→ExactAsset-Links sind vollständig.
- [ ] Die 17 Component-Families sind disjunkt 413; kein Batch besitzt mehr als eine Familie; jeder
  totale Referenzkontext löst genau eine Fixture auf und besitzt einen OraclePart-Zeugen. Exakt
  die `public-builder`-Paarprojektion ist über `ReachableBuilderContextSet/v1` öffentlich
  erreichbar und projiziert 247 eindeutige Component-Keys;
  `reference-only`/`direct-carrier` bleiben aus der Builder-Grammatik ausgeschlossen.
- [ ] Pair-Ownership ist deterministisch und nicht separat gespeichert:
  `deriveReferenceComponentContextOwnership(referenceSet, componentFixtures, ownerIndex)` liefert
  nach bijektiver Pair↔Fixture-Prüfung und Auflösung des bytegleichen
  Descriptor-/Manifest-Owners exakt `ReferenceComponentContextOwnershipV1` der Form
  `{ version, records, digestInput }`. Der SHA-256 über `digestInput` ist in jedem Freshnesspfad bytegleich
  `referenceComponentContextOwnershipDigest`. Es gibt keine 22. Batchcollection und kein
  eingebettetes Ownershipfeld in `ReferenceComponentContextSetV1`.
- [ ] Jeder Paint-Record hat genau einen erwarteten Owner; jeder Component-Leaf hat UseEdge;
  kein Asset-specific-Leaf hat Component-Semantik oder eine Wiederverwendungshäufigkeit > 1.
- [ ] Jeder Asset-, Display- und Component-Case hat vektorielle Gleichheit und in allen 30
  verpflichtenden Rasterzellen Null-Diff; jeder Case wurde außerdem individuell visuell
  protokolliert.
- [ ] Der Root-Aggregator ist die einzige zentrale Zusammenführung, exportiert alle geforderten
  kanonischen Register und scheitert hart bei jeder Lücke oder Dublette.
- [ ] Jede Descriptor-Dependency ist die mit `compareExactBatchId` sortierte minimale Ausgabe von
  `directForeignExactBatchOwners(current, fullOwnerIndex, batchOwnedRelationTargets(current))`
  über sämtliche `EXACT_BATCH_RELATIONS`; der Full-Owner-Index stammt vor Closure-Laden aus den
  vollständigen Owned-Keysets/Setdigests aller 90 staged Descriptoren. Witness-only-,
  dependency-owned-Part- und Ownership-only-Endpunkte werden erfasst, während unbelegte und nur
  transitive Direktkanten fehlen. Eine entfernte Direktkante bleibt als
  `MISSING_STAGED_DEPENDENCY` erkennbar, obwohl das Owner-Modul dadurch ungeladen ist. Die
  Tabellenordinal validiert ausschließlich Forward-Edges.
- [ ] Vollsuite, Typecheck, Build, ungefilterter Strict-Lauf und Artifact-Leak-Gate sind auf
  demselben sauberen HEAD grün.
- [ ] Task 95 bindet einen frischen unabhängigen `SpecQualityReviewRecord/v1` mit aktuellem
  HEAD/Branchdiff, amendierter Spec, allen drei Plänen, Prepare-Result/-Inputs, `PASS` und literal
  leerem Blocker-Tuple. Ein Befund ist ein getrenntes, nicht gatefähiges Findings-Dokument.
  Nach vollständiger visueller Prüfung sind der erfasste Server beendet, Token und Port
  geschlossen und der unveränderte Reviewbaum in `ReviewFreeze/v1` gebunden; der
  Final-Record verifiziert und bindet beide Recorddigests.
- [ ] Keine Originale, lokalen Pfade, Raster-/Diffartefakte oder Generatorblobs sind committed
  oder paketiert; technische, fachliche und rechtliche Freigabe bleiben getrennt.
