# Exact Reference Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine verlustfreie, self-contained Exact-Paint-Foundation bauen, die kanonische BABZ-Geometrie rendern, lokale Originale sicher als Testorakel lesen, Vektor- und RGBA-Null-Diff messen, Conformance-Graphen und Attestations prüfen und einen ersten echten Canary-Batch vollständig belegen kann.

**Architecture:** Das veröffentlichte Schema trägt ausschließlich typisierte, kanonische Geometry-/Paint-IR und Conformance-Verträge. Browserneutrale Dezimal-, Pfad-, Transform-, Normalisierungs-, Render-, Graph-, Part-, Masken- und RGBA-Kerne liegen in `@einsatzzeichen/core`; nur `@einsatzzeichen/cli` darf lokale SVG-Dateien, Node-Crypto, allgemeine Ergebnis-/Evidenz-SHA-256-Digests und Resvg für den Orakelvergleich benutzen. Die eng typisierten Identitäts-/Stagingkonstruktoren `exactTransformSequenceDigest`, `canonicalKnownSymbolSpecDigest` und `stagedExactOwnedKeySetDigest` verwenden dagegen denselben kleinen synchronen, browserneutralen SHA-256-Kern über bereits kanonisierte UTF-8-Bytes; sie lesen weder Dateien noch Orakel und werden in Task 19 gegen die CLI-Digestgrenze quergeprüft. Core materialisiert Drawing und Trace bewusst noch ohne Digests; erst der CLI-Conformance-Layer finalisiert dieselbe atomare Ausgabe zu einem gedigesteten Record. `@einsatzzeichen/catalog` importiert nie aus `@einsatzzeichen/cli`: es hält das vollständige metadata-only `ORACLE_MANIFEST`, die aus realen Registern abgeleitete 413er Component-Baseline, die Composition-/Reachability-Verträge und kleine, konfliktarme `ExactBatchModule`s. Staged Batches werden ausschließlich als literal allowlistete, azyklische transitive Dependency-Closure geladen; ein aus den vollständigen Descriptor-Owned-Keysets vor jedem Modulimport gebauter Ownership-Index macht dabei auch absichtlich weggelassene direkte Dependencies sichtbar. Die geladene Registry vereinigt anschließend read-only Dependencies mit dem aktuellen Modul und validiert ihre Referenzen, während Vergleich, Evidenz und Review nur die Cases des aktuellen Moduls ausführen. Der Foundation-Canary rekonstruiert `1.1_Taktische Formation.svg` aus einer Component-Fixture und einem CompositionPlan, ohne das Original oder einen zweiten Ganzzeichen-Blob zu übernehmen.

**Tech Stack:** TypeScript 5.9.3, Vitest 4.1.11, pnpm 11.20.0, Node.js, `@resvg/resvg-js` exakt 2.6.2, `saxes` exakt 6.0.0, RFC-8785-JCS, SHA-256 und Ed25519.

**Spec:** `docs/superpowers/specs/2026-09-04-exact-reference-parity-design.md`

## Global Constraints

- Die 661 Dateien unter `taktische-zeichen/` bleiben lokales, unveröffentlichtes Testorakel: nie committen, nie packen, nie als Laufzeit-Fallback lesen und nie in Reviewartefakte einbetten.
- Die veröffentlichte `ReferenceExactIR` ist self-contained. Ein Build und jede Library-API funktionieren ohne Orakelroot und ohne Netzwerk.
- Committed Pfade enthalten ausschließlich absolute, explizite `M`, `L`, `C` und `Z`; relative Kommandos, `H`, `V`, `S` und implizite Wiederholungen werden vor Aufnahme kanonisiert.
- Dezimalwerte bleiben verlustfrei als minimale Strings ohne Exponent und ohne negatives Null erhalten. Kein Quellwert darf für Kanonisierung, Digest oder Exact-SVG über `number`, Millimeter oder `formatUnits(3)` roundtrippen.
- Transformlisten bleiben in SVG-Reihenfolge als `translate`, `scale`, `rotate(angle,cx,cy)` oder `matrix(a,b,c,d,e,f)` erhalten. Rotationen werden niemals in eine Dezimalmatrix gefaltet; Defaultoperanden werden explizit.
- `NormalizedPaintList/v1` ist owner-frei. `OraclePaintIndex/v1` und `OwnedPaintIndex/v1` bleiben getrennte, vollständige Indexe; Paint-Reihenfolge, Subpathfolge, Farbe, Fill-Rule und Transformreihenfolge sind digestrelevant.
- Jeder sichtbare Kandidaten-Leaf hat genau einen `PaintOwner`. Nur `component` erzeugt `UseEdge`; `asset-specific` muss über das separate Ownership-Manifest und die Unique-Reuse-Regel belegt sein.
- Das `PaintComponentRegistry` hat im vollständigen Korpus exakt 413 disjunkte Keys: 398 Snapshotwerte plus 15 direkte Träger. Diese Foundation darf keinen alternativen Zähler oder stillen Ersatzkey einführen.
- `ReferenceComponentContextSet/v1` ist der schema-neutrale totale Referenzkontextvertrag `{ version, pairs, componentContextSetDigestInput }`: seine disjunkte Union besteht aus exakt der öffentlichen `ReachableBuilderContextSet.pairs`-Menge, je genau einem expliziten `reference-only`-Kontext für alle 151 nicht komponierbaren Snapshotkeys und je genau einem expliziten `direct-carrier`-Kontext für alle 15 direkten Trägerkeys. Exakt 247 ist ausschließlich die öffentliche Component-Key-Projektion; die öffentliche Paarzahl ist `REACHABLE_BUILDER_CONTEXT_SET.pairs.length`, die totale Paarzahl ist dieser Wert plus 166, und die totale Component-Key-Projektion ist exakt 413. Alle 413 PaintComponents besitzen dadurch mindestens einen vollständigen Contract-/Fixture-/Case-/Witness-Kontext, ohne dass ein nichtöffentlicher Kontext über `SymbolSpec` erreichbar wird.
- `OraclePart.comparisonProfile` ist die einzige Quelle für `partFrame` und Maske. `OraclePart` trägt `oracleToPart`, jede Verwendung `fixtureToPart`; beide Transformfolgen sind digestrelevant.
- `source-node-set` ist nur mit maschinellem Paint-Order-/Bounds-Nachweis zulässig; sonst ist `leave-one-out` mit beiden vollständigen und beiden reduzierten Renderings verpflichtend.
- Der Rastervertrag verwendet `@resvg/resvg-js` 2.6.2, `fitTo: { mode: 'width', value: targetWidth }`, die Breiten 16, 24, 32, 48, 64, 128, 256, 512, 2048 und 4096 sowie transparenten, schwarzen und weißen Hintergrund.
- RGBA-Gleichheit bedeutet stets `differentPixelCount === 0`, `maxChannelDelta === 0`, `alphaDeltaCount === 0` und identische sichtbare Bounds. Transparente Pixel werden vorher auf RGB 0 kanonisiert; es gibt keine Toleranz.
- `LayeredDrawing` erlaubt als nicht exakte Layer ausschließlich `purpose: 'body-labels' | 'designation'` mit ausführbarem `overlayToExact` und `claim: 'not-reference-identical'`; ihre kanonische Reihenfolge ist Exact-Paint, Body-Labels, Designation. Freie Label-/Designation-Texte und benutzerdefinierte Labelmetriken erben keine Exact-Attestation. Feste Originalbeschriftungen in Exact-Assets bleiben Glyphenpfade im Exact-Paint-Layer. Exact-Assets und Component-Fixtures enthalten keinen Overlay-Layer.
- Attestations werden über die RFC-8785-kanonisierten UTF-8-Bytes ohne `signature` mit Ed25519 signiert. Unbekannte, abgelaufene oder widerrufene Keys und jeder Digestunterschied invalidieren fail-closed. Die Vollständigkeit ihrer paarbezogenen Provenance wird gegen eine separate, kanonische `RequiredConformancePair`-Folge aus den finalisierten ausgewählten Cases geprüft; die signierte Payload darf ihre eigene Pflichtpaarmenge niemals autorisieren.
- Case-Bijektionen vergleichen niemals disjunkte Case- und Ziel-Keyräume direkt. Es gelten ausschließlich `set(AssetCase.exactAsset) = set(ExactAssetFixture.key)`, `set(DisplayCase.displayFixture) = set(DisplayFixture.key)`, `set(ComponentCase.componentFixture) = set(ComponentFixture.key)` und `set(CompositionContractCase.contract) = set(CompositionContractRegistry.key)`; die jeweiligen `case:*`-/`contract-case:*`-Keys bleiben eigenständige kanonische Identitäten.
- Der Foundation-Canary ist ein Entwicklungsnachweis, kein Ersatz für den ungefilterten 661-Asset-Strict-Lauf. Kein Foundation-Test oder CLI-Text darf „Exact Reference Parity passed“ für den Gesamtkorpus ausgeben.
- Eine Batch-Dependency ist immer ein bereits akzeptierter, früherer `ExactBatchDescriptor`; ihre sechs Batchdateien sind für die aktuelle Aufgabe read-only, dürfen weder zu deren Ownership noch zu deren staged Änderungen gehören und liefern ausschließlich Registry-Eingaben, niemals aktuelle Cases, Resultate, Evidenz oder Reviewbefunde.
- Jede Aufgabe wird von genau einem frischen Implementierungs-Agenten mit den angegebenen Dateien ausgeführt; er verändert keine fremden Dateien, startet keine weiteren Agents und übernimmt keine User-Änderungen in seinen Commit.
- Jede Aufgabe legt **vor dem Test** alle neuen Produktionsmodule/Exports als compile-sichere Stubs an. Erst dann folgt RED → beobachtetes Fehlschlagen einer konkret benannten Verhaltensassertion → minimale GREEN-Implementierung → fokussierter Test → Typprüfung → Commit. Stubfunktionen dürfen gezielt `throw new Error('RED: behavior not implemented')`, Stubvalidatoren die Testfixture ablehnen und Stubkonstanten eine formal typisierte leere/falsche Menge liefern; fehlendes Modul, fehlender Export, Syntax-, Import-, Typecheck- oder Fixturefehler zählen in keiner Aufgabe als gültiges RED.
- Nach jedem Implementierungscommit prüfen zwei frische Agents getrennt Spezifikationstreue und Code-/Testqualität. Der Root-Agent integriert erst nach abgearbeiteten Befunden.
- Alle Shellbefehle beginnen mit `rtk`; Git-Befehle verwenden `rtk git -c core.fsmonitor=false`. Lokale Diagnoseartefakte entstehen ausschließlich unter `out/`.

## File Structure

### Schema: veröffentlichte Verträge

- `packages/schema/src/exact-ir.ts` — gebrandete Exact-Dezimal-/Integerwerte, kanonische rationale Viewportabbildungen, Pfad-/Transformtypen, PaintOwner, ReferenceExactDrawing und LayeredDrawing.
- `packages/schema/src/exact-catalog.ts` — Fragment-, Component-, Fixture-, Plan- und Trace-Datentypen; der einzige Batch-/Closure-Vertrag entsteht später im Catalog.
- `packages/schema/src/conformance.ts` — OracleManifest, Parts, Profile, Masken, Cases, Ownership und Graphschlüssel.
- `packages/schema/src/conformance-attestation.ts` — vollständiger Attestation-, Trust-Store- und Current-Digest-Vertrag.
- `packages/schema/src/index.ts` — öffentliche Re-Exports; bestehende semantische Exporte bleiben unverändert.

### Core: reine, browserneutrale Foundation

- `packages/core/src/exact/decimal.ts` — verlustfreie Festkommaarithmetik und kanonische Dezimalstrings.
- `packages/core/src/exact/path.ts` — vollständiger `M/H/V/L/C/S/Z`-Parser und Normalisierung auf `M/L/C/Z`.
- `packages/core/src/exact/transform.ts` — parser- und IR-seitige Transformkanonisierung ohne Matrixfaltung.
- `packages/core/src/exact/canonical-json.ts` — RFC-8785-kompatible deterministische JSON-/UTF-8-Ausgabe.
- `packages/core/src/exact/normalized-paint.ts` — owner-freie Paint-Liste, Non-Painting-Inventar und OwnedPaintIndex-Projektion.
- `packages/core/src/exact/materialize.ts` — atomare Materialisierung von Drawing und CompositionTrace aus einem Plan.
- `packages/core/src/render/raster-dimensions.ts` — der einzige browserneutrale Rasterdimension-Service für semantische Number- und ExactDecimal-ViewBoxes.
- `packages/core/src/render/exact-svg.ts` — native Exact-SVG-Serialisierung ohne Millimeterpfad.
- `packages/core/src/render/svg.ts` — Dispatch für `RenderableDrawing` und Layer-Komposition bei bytegleichem semantischem Altpfad.
- `packages/core/src/conformance/inventory.ts` — Mengen-, Bijektions-, Ownership- und Registry-Gates.
- `packages/core/src/conformance/graph.ts` — abgeleitete UseEdges, Witnessgraph und transitive Rückwärtsinvalidierung.
- `packages/core/src/conformance/coverage.ts` — gemeinsame konservative Bounds-/Coverage-Projektion für Parser, Discovery und Isolation.
- `packages/core/src/conformance/parts.ts` — Profilauflösung, Selectors, Isolation und gemeinsame Part-Projektion.
- `packages/core/src/conformance/rgba.ts` — transparente RGB-Kanonisierung, Hintergrundkomposition, Maske, Bounds und Null-Diff.
- `packages/core/src/conformance/status.ts` — direkter Digestvergleich für `effectiveConformanceStatus`.
- `packages/core/src/index.ts` — öffentliche Exporte der fertigen reinen Kerne.

### CLI: strikt lokale Orakel-, Raster- und Crypto-Grenze

- `packages/cli/src/conformance/digest.ts` — SHA-256 über Bytes/JCS und kanonische Set-Digests.
- `packages/cli/src/conformance/composition-finalizer.ts` — einzige Digestgrenze für Core-Materialisierung, Displayprojektion und zellenspezifische Masken.
- `packages/cli/src/conformance/oracle-loader.ts` — realpath-/fd-basierter, symlinkfreier Loader gegen OracleManifest.
- `packages/cli/src/conformance/oracle-parser.ts` — sichere SAX-Validierung, Featurezählung und normalisierte Oracle-Projektion.
- `packages/cli/src/conformance/oracle-svg.ts` — sichere Reserialisierung vollständiger oder selektierter Orakelnodes.
- `packages/cli/src/conformance/raster-environment.ts` — Versionen und SHA-256 der tatsächlich geladenen Resvg-/Lock-/Native-Eingaben sowie leerer Exact-FontSet.
- `packages/cli/src/conformance/raster.ts` — gepinnte Resvg-Umgebung und 30-Zellen-Vergleichsmatrix.
- `packages/cli/src/conformance/evidence-writer.ts` — lokale PNG-/Matrixevidenz ausschließlich unter `out/`.
- `packages/cli/src/conformance/attestation.ts` — Ed25519-Signatur, Trust-Store-Prüfung und kombinierter Status.
- `packages/cli/src/conformance/batch-conformance.ts` — explizit gefilterter lokaler Entwicklungscheck, der eine Dependency-Closure registriert, aber nur das aktuelle Batch prüft.
- `packages/cli/src/conformance/inspect.ts` — read-only Messprotokoll der normalisierten sichtbaren und nichtmalenden Oracle-Records.
- `packages/cli/src/commands/conformance-batch.ts` — CLI-Adapter für den lokalen Batchcheck, ohne Gesamtkorpusclaim.
- `packages/cli/src/commands/conformance-inspect.ts` — CLI-Adapter für lokale Discovery ausschließlich unter `out/`.
- `packages/cli/src/index.ts` — neue `conformance:batch`-Route; ein vollständiger `conformance verify --strict` gehört in den Integrationsplan.

### Catalog: Registry und erster Canary

- `packages/catalog/src/exact/batch-contract.ts` — einzige `ExactBatchModule`-/`LoadedExactBatchClosure`-Definition, Shard-Setprüfung, Corpus-Shard-Auflösung und rein abgeleitete Reference-Component-Context-Pair-Ownership aus Fixture-Manifestownership.
- `packages/catalog/src/exact/oracle-manifest.ts` — vollständige, metadata-only Baseline aller 661 `{key,filename,sha256}`-Zeilen samt Setdigest.
- `packages/catalog/src/exact/oracle-order.ts` — kanonischer Abschnittsparser und Comparator für sämtliche Oracle-Dateinamen.
- `packages/catalog/src/exact/paint-component-registry.ts` — exakt aus den realen 15 Snapshotregistern und 15 direkten Trägern abgeleitete 413er Keymenge.
- `packages/catalog/src/exact/composition-contract-registry.ts` — konkrete Layout-/Placement-/Zonenverträge ohne Paintgeometrie.
- `packages/catalog/src/exact/reachable-builder-contexts.ts` — deterministisch aus der öffentlichen `SymbolSpec`-Validierung abgeleitetes `ReachableBuilderContextSet/v1`.
- `packages/catalog/src/exact/reference-component-contexts.ts` — totale access-diskriminierte Referenzpaarmenge aus öffentlicher Reachability plus 151 reference-only und 15 direct-carrier Kontexten.
- `packages/catalog/src/exact/known-symbol-spec-assets.ts` — collision-safe kanonischer Digestindex der 14 Base- und 242 Recipe-Specs auf ihre ExactAssets.
- `packages/catalog/src/exact/oracle-ownership-manifest.ts` — von Foundation typisierter, ausdrücklich Corpus-owned finalisierter Ownership-Export ohne Rückimport aus Corpus-Shards.
- `packages/catalog/src/exact/batch-staging-registry.ts` — Root-owned, literal Loader-Allowlist und einziger produktiver Closure-Loader für einen azyklischen, topologisch geordneten Staging-DAG.
- `packages/catalog/src/exact/batches/index.ts` — einziger zentraler, kanonisch sortierender Aggregator.
- `packages/catalog/src/exact/batches/base-formation-canary/{manifest,components,assets,parts,plans}.ts` — exklusiv besessene Canary-Daten.
- `packages/catalog/src/exact/batches/base-formation-canary/cases.test.ts` — strukturelle, materialisierte und owner-freie Canary-Verträge.
- `packages/catalog/src/exact/index.ts` und `packages/catalog/src/index.ts` — Foundation-Exports ohne Orakelzugriff.

---

### Task 1: Verlustfreie Exact-IR und Layer-Vertrag im Schema

**Agent ownership:** Nur `packages/schema/src/exact-ir.ts`, `packages/schema/src/exact-ir.test.ts` und die eine neue Exportzeile in `packages/schema/src/index.ts`.

**Files:**
- Create: `packages/schema/src/exact-ir.ts`
- Create: `packages/schema/src/exact-ir.test.ts`
- Modify: `packages/schema/src/index.ts`

**Interfaces:**
- Consumes: den bestehenden `Drawing`-Typ aus `packages/schema/src/geometry.ts`; keine Core- oder Catalog-Funktion.
- Produces: `ExactDecimal`, `exactDecimal(value)`, `isExactDecimal(value)`, `CanonicalIntegerString`, `PositiveCanonicalIntegerString`, `ExactRational`, `exactRational(numerator,denominator)`, `equalExactRational(a,b)`, `ExactViewportMapping`, `Sha256Digest`, `sha256Digest(value)`, `exactTransformSequenceDigest(value)`, `ExactColor`, `ExactViewBox`, `ExactPathCommand`, `ExactTransform`, `ExactTransformSequence`, `GeometryNodeId`, `ComponentKey`, `ExactAssetKey`, `OracleAssetKey`, `OraclePartKey`, `ExactComponentVariantKey`, `ComponentContextKey`, `componentContextKey(value)`, `ComponentFixtureKey`, `DisplayKey`, `ComparisonProfileId`, `ReferenceExactFragmentKey`, `PaintOwner`, `ReferenceExactNode`, `ReferenceExactDrawing`, `GeneratedOverlayLayer`, `LayeredDrawing`, `RenderableDrawing`, `assertReferenceExactDrawing`, `assertRenderableDrawing`.

- [ ] **Step 0: Lege zuerst den compile-sicheren Produktionsstub an**

  Erzeuge `exact-ir.ts` mit sämtlichen oben genannten exportierten Typnamen. Implementiere die kleinen Construction-Grenzen `exactDecimal`/`sha256Digest`/`componentContextKey` sowie die **finalen compile-sicheren Signaturen** `exactRational(numerator: string, denominator: string): ExactRational`, `equalExactRational(a: ExactRational, b: ExactRational): boolean` und `exactTransformSequenceDigest(value: ExactTransformSequence): Sha256Digest` bereits vollständig. `exactRational` validiert/minimiert per BigInt-GGT und `equalExactRational` führt die Cross-Multiplikation aus. Der enge Transformdigest serialisiert ausschließlich die validierte `ExactTransformSequence` als RFC-8785-kanonische UTF-8-Bytes und berechnet synchron, umgebungsneutral SHA-256; sein Testvektor wird in Task 8 gegen `canonicalJsonUtf8` und in Task 19 gegen `digestCanonical` quergeprüft. Kein RED darf hier auf einem fehlenden Export oder Throw-Stub beruhen. Dies ist Voraussetzung für ausführbare Drawing-REDs, nicht deren Ziel. `assertReferenceExactDrawing` und `assertRenderableDrawing` lehnen vorerst jedes fertig konstruierte Argument mit `RED: drawing validation not implemented` ab. Ergänze bereits den Re-Export im Schema-Index und führe `rtk mise exec -- pnpm typecheck` aus. Er muss grün sein; erst danach wird der Test angelegt.

- [ ] **Step 1: Schreibe die fehlschlagenden Laufzeit- und Typverträge**

  Lege `exact-ir.test.ts` an. Der positive Wert muss Rechteck, Kreis, Compound Path, Transformreihenfolge und Layer unterscheiden; die Negativfälle erzwingen Owner, kanonische Pfadkommandos und gemeinsame ViewBox:

  ```ts
  import { describe, expect, it } from 'vitest';
  import {
    assertReferenceExactDrawing, assertRenderableDrawing, componentContextKey,
    equalExactRational, exactDecimal, exactRational, exactTransformSequenceDigest,
    type GeneratedOverlayLayer,
    type LayeredDrawing,
    type PaintOwner,
    type ReferenceExactDrawing,
  } from './exact-ir.js';

  const d = exactDecimal;

  const componentOwner: PaintOwner = {
    kind: 'component',
    component: 'kind:formation',
    variant: 'formation:standalone',
  };

  const exact: ReferenceExactDrawing = {
    kind: 'reference-exact',
    viewBox: {
      minX: d('0'), minY: d('0'), width: d('90.709'), height: d('90.709'),
      preserveAspectRatio: 'xMidYMid meet',
    },
    children: [{
      type: 'rect', id: 'node:white-field', role: 'body',
      x: d('2.835'), y: d('17.008'), width: d('85.04'), height: d('56.693'),
      fill: '#ffffffff', fillRule: 'nonzero', transforms: [],
      owner: componentOwner,
    }],
  };

  describe('ReferenceExactIR', () => {
    it('akzeptiert ausschließlich den vollständigen typisierten Exact-Zweig', () => {
      expect(assertReferenceExactDrawing(exact)).toBe(exact);
    });

    it.each([
      { ...exact, children: [{ ...exact.children[0], owner: undefined }] },
      { ...exact, children: [{ ...exact.children[0], fill: '#fff' }] },
      { ...exact, children: [{ ...exact.children[0], width: d('0') }] },
      { ...exact, children: [{ ...exact.children[0], fill: '#ffffff00' }] },
      { ...exact, children: [{ type: 'path', id: 'node:empty', role: 'body',
        commands: [{ command: 'M', x: d('0'), y: d('0') }],
        fill: '#000000ff', fillRule: 'nonzero', transforms: [],
        owner: componentOwner }] },
      { ...exact, children: [{ type: 'path', id: 'node:collinear', role: 'body',
        commands: [
          { command: 'M', x: d('0'), y: d('0') },
          { command: 'L', x: d('1'), y: d('1') },
          { command: 'L', x: d('2'), y: d('2') },
        ], fill: '#000000ff', fillRule: 'nonzero', transforms: [],
        owner: componentOwner }] },
    ])('weist einen unvollständigen oder opaken sichtbaren Leaf ab', (value) => {
      expect(() => assertReferenceExactDrawing(value)).toThrow();
    });

    it('prüft Dezimalwerte an der Schema-Grenze statt durch Typecasts', () => {
      expect(exactDecimal('12.34')).toBe('12.34');
      for (const invalid of ['01', '-0', '1e2', '.5', ' 1', '']) {
        expect(() => exactDecimal(invalid)).toThrow(/canonical/i);
      }
    });

    it('konstruiert Component-Contexts ausschließlich aus kanonischer Grammatik', () => {
      expect(componentContextKey('context:standalone')).toBe('context:standalone');
      for (const invalid of ['', 'standalone', 'context:', 'context:two words',
        'context:two/parts', 'context:%3astandalone']) {
        expect(() => componentContextKey(invalid)).toThrow(/context/i);
      }
    });

    it('repräsentiert nicht terminierende Viewportwerte kanonisch rational', () => {
      expect(exactRational('32', '90')).toEqual({ numerator: '16', denominator: '45' });
      expect(equalExactRational(
        exactRational('16', '45'),
        exactRational('32', '90'),
      )).toBe(true);
    });

    it('bindet jeden nicht identischen Overlay-Layer an seinen Transformdigest', () => {
      const overlayToExact = [
        { kind: 'scale', x: d('2.83465625'), y: d('2.83465625') },
      ] as const;
      const overlayToExactDigest = exactTransformSequenceDigest(overlayToExact);
      const bodyLabels: GeneratedOverlayLayer = {
        kind: 'generated-overlay', purpose: 'body-labels',
        drawing: { viewBox: { width: 32, height: 32 }, children: [] },
        overlayToExact, overlayToExactDigest, claim: 'not-reference-identical',
      };
      const designation: GeneratedOverlayLayer = {
        ...bodyLabels, purpose: 'designation',
      };
      const layered: LayeredDrawing = {
        kind: 'layered', viewBox: exact.viewBox,
        layers: [
          { kind: 'exact-paint', drawing: exact, claim: 'exact-reference-parity' },
          bodyLabels, designation,
        ],
      };
      expect(layered.layers.map((layer) => layer.claim)).toEqual([
        'exact-reference-parity', 'not-reference-identical', 'not-reference-identical',
      ]);
      expect(assertRenderableDrawing(layered)).toBe(layered);
      expect(() => assertRenderableDrawing({
        ...layered,
        layers: [layered.layers[0]!, {
          ...bodyLabels,
          overlayToExact: [{ kind: 'scale', x: d('3'), y: d('3') }],
        }, designation],
      })).toThrow(/overlayToExactDigest/);
      const { overlayToExactDigest: omitted, ...withoutDigest } = bodyLabels;
      expect(omitted).toBe(overlayToExactDigest);
      expect(() => assertRenderableDrawing({
        ...layered, layers: [layered.layers[0]!, withoutDigest, designation],
      })).toThrow(/overlayToExactDigest/);
    });
  });
  ```

- [ ] **Step 2: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/schema/src/exact-ir.test.ts`

  Expected: FAIL an der Verhaltensassertion `akzeptiert ausschließlich ...`, weil der compile-sichere Stub auch die gültige Drawing-Fixture mit `RED: drawing validation not implemented` ablehnt. Kein Import-, Syntax- oder Typecheckfehler ist zulässig.

- [ ] **Step 3: Implementiere die exakten Datenformen und den fail-closed Validator**

  Implementiere `exact-ir.ts` mit diesen kanonischen Diskriminanten und ohne alternatives `d: string`-Feld:

  ```ts
  import type { Drawing } from './geometry.js';

  export type ExactDecimal = string & { readonly __exactDecimal: unique symbol };
  export function exactDecimal(value: string): ExactDecimal;
  export function isExactDecimal(value: unknown): value is ExactDecimal;
  export type Sha256Digest = string & { readonly __sha256Digest: unique symbol };
  export function sha256Digest(value: string): Sha256Digest;
  export type ExactColor = `#${string}`;
  export type GeometryNodeId = string;
  export type ComponentKey = string;
  export type ExactAssetKey = `asset:${string}`;
  export type OracleAssetKey = `oracle:${string}`;
  export type OraclePartKey = `part:${string}`;
  export type ExactComponentVariantKey = string;
  export type ComponentContextKey = string & {
    readonly __componentContextKey: unique symbol;
  };
  export function componentContextKey(value: string): ComponentContextKey;
  export type ComponentFixtureKey = `component:${string}`;
  export type DisplayKey = `display:${string}`;
  export type ComparisonProfileId = `profile:${string}`;
  export type ReferenceExactFragmentKey = `fragment:${string}`;

  export type CanonicalIntegerString = string & {
    readonly __canonicalIntegerString: unique symbol;
  };
  export type PositiveCanonicalIntegerString = CanonicalIntegerString & {
    readonly __positiveCanonicalIntegerString: unique symbol;
  };
  export interface ExactRational {
    readonly numerator: CanonicalIntegerString;
    readonly denominator: PositiveCanonicalIntegerString;
  }
  export interface ExactViewportMapping {
    readonly version: 'ExactViewportMapping/v1';
    readonly a: ExactRational; readonly b: ExactRational;
    readonly c: ExactRational; readonly d: ExactRational;
    readonly e: ExactRational; readonly f: ExactRational;
  }

  export interface ExactViewBox {
    readonly minX: ExactDecimal;
    readonly minY: ExactDecimal;
    readonly width: ExactDecimal;
    readonly height: ExactDecimal;
    readonly preserveAspectRatio: 'xMidYMid meet';
  }

  export type ExactPathCommand =
    | { readonly command: 'M' | 'L'; readonly x: ExactDecimal; readonly y: ExactDecimal }
    | { readonly command: 'C'; readonly x1: ExactDecimal; readonly y1: ExactDecimal;
        readonly x2: ExactDecimal; readonly y2: ExactDecimal;
        readonly x: ExactDecimal; readonly y: ExactDecimal }
    | { readonly command: 'Z' };

  export type ExactTransform =
    | { readonly kind: 'translate'; readonly x: ExactDecimal; readonly y: ExactDecimal }
    | { readonly kind: 'scale'; readonly x: ExactDecimal; readonly y: ExactDecimal }
    | { readonly kind: 'rotate'; readonly angle: ExactDecimal; readonly cx: ExactDecimal;
        readonly cy: ExactDecimal }
    | { readonly kind: 'matrix'; readonly a: ExactDecimal; readonly b: ExactDecimal;
        readonly c: ExactDecimal; readonly d: ExactDecimal;
        readonly e: ExactDecimal; readonly f: ExactDecimal };
  export type ExactTransformSequence = readonly ExactTransform[];

  export interface GeneratedOverlayLayer {
    readonly kind: 'generated-overlay';
    readonly purpose: 'body-labels' | 'designation';
    readonly drawing: Drawing;
    readonly overlayToExact: ExactTransformSequence;
    readonly overlayToExactDigest: Sha256Digest;
    readonly claim: 'not-reference-identical';
  }

  export type PaintOwner =
    | { readonly kind: 'component'; readonly component: ComponentKey;
        readonly variant: ExactComponentVariantKey }
    | { readonly kind: 'asset-specific'; readonly asset: ExactAssetKey;
        readonly purpose: string };
  ```

  `exactDecimal` ist die einzige Schema-Level-Construction-Grenze für Dezimalwerte: Es akzeptiert nur `^(?:0|0\.\d*[1-9]|[1-9]\d*(?:\.\d*[1-9])?|-(?:0\.\d*[1-9]|[1-9]\d*(?:\.\d*[1-9])?))$`, weist Exponent, Pluszeichen, führende/nachlaufende Nullen und negatives Null ab und gibt erst nach dieser Prüfung den Brand zurück. `sha256Digest` akzeptiert analog nur exakt 64 lowercase Hexzeichen. `componentContextKey` ist die einzige Construction-Grenze für `ComponentContextKey`; sie verlangt die kanonische nichtleere `context:`-Grammatik, weist Whitespace, Slash, leere Segmente und nichtkanonisches Prozentencoding ab und gibt erst danach den Brand zurück. Sämtliche Component-Fixtures, Contract-Keys und Tests konstruieren Contextkeys über diese Funktion statt über rohe Strings oder Typecasts. `exactRational` akzeptiert Integerstrings nur in der Minimalform `0|-?[1-9]\d*`, verbietet einen nichtpositiven Nenner, teilt Zähler und Nenner per BigInt-GGT, normalisiert Null ausschließlich zu `0/1` und hält das Vorzeichen ausschließlich im Zähler. `equalExactRational` prüft Gleichheit zusätzlich durch `a.numerator * b.denominator === b.numerator * a.denominator`; kein Rationalwert darf für Validierung oder Digest durch `number` laufen. Task 5 normalisiert fremde Quellsyntax und ruft anschließend die Decimalfactory auf; Produktions- und Testliterale verwenden weder `as ExactDecimal`, `as Sha256Digest`, `as ComponentContextKey` noch ungeprüfte Strings.

  Definiere `ReferenceExactNode` rekursiv als `group`, `rect`, `circle` oder `path`. Jeder sichtbare Leaf trägt zwingend `id`, `role`, `owner`, `fill: ExactColor`, `fillRule: 'nonzero' | 'evenodd'` und `transforms`; Gruppen tragen nur `id`, `transforms` und eine nichtleere geordnete `children`-Folge. `ReferenceExactDrawing.kind` ist exakt `'reference-exact'` und darf außerhalb der Paint-Nodes optional `title`, `description` und `accessibility: { role: 'img'; label: string }` tragen. Prüfe rekursiv: Plain Objects/Arrays, eindeutige Node-IDs, lowercase `#rrggbbaa` mit Alpha ungleich `00`, ausschließlich über `exactDecimal` validierbare Operanden, nur `M/L/C/Z`, positive ViewBox-/Rectmaße, positiven Kreisradius, genau einen formal gültigen Owner pro Leaf und keine Text-/Line-/Polyline-/opaque-Path-Felder. Ob der Component-Owner tatsächlich zur registrierten Variante beziehungsweise der Asset-Owner zur Planinstanz passt, wird bewusst erst im registry-aware Materializer aus Task 9 geprüft; Task 1 erfindet dafür keine Registry.

  Die Visible-only-Pfadprüfung darf **nicht** aus einer nichtkollinearen Bézier-Kontrollhülle Sichtbarkeit folgern. Implementiere stattdessen `exactSubpathSignedArea`: Bringe alle Dezimalkoordinaten verlustfrei auf gemeinsame BigInt-Skalen, ergänze den SVG-impliziten Schließungsabschnitt und integriere für jede Linie beziehungsweise kubische Bézierkurve exakt `1/2 * ∫(x·dy - y·dx)`. Für `C` werden x(t)/y(t) in rationale Power-Basis-Koeffizienten expandiert; Polynommultiplikation, Ableitung, Integration und Summation verwenden ausschließlich gekürzte `ExactRational`s. Für `fillRule:'nonzero'` ist eine von null verschiedene exakte Summe der orientierten Subpathflächen ein hinreichender Sichtbarkeitsbeleg. Für `evenodd` ist die beweisbare öffentliche Grammatik enger: genau ein Subpath mit Fläche ungleich null oder mehrere Subpaths, deren konservative Bézier-Kontrollhüllen paarweise **streng disjunkt** sind und deren einzelne exakte Flächen ungleich null sind. Die Hülle darf hier nur die Nichtinteraktion belegen, niemals Fläche. Nicht beweisbare Even-odd-Überlappung, Gesamtsumme null, nur `M`, einzelne Segmente, exakt degenerierte Kurven und leere Subpaths werden als sichtbare Kandidaten-IR abgewiesen; Oracle-Nodes bleiben im getrennten `NonPaintingInventory/v1` oder erzwingen bei tatsächlich sichtbarer, aber außerhalb dieser Grammatik liegender Geometrie eine bewusste Schemaversion statt eines Kontrollhüllen-Fallbacks.

  `GeneratedOverlayLayer.overlayToExactDigest` ist immer vorhanden und muss bytegleich `exactTransformSequenceDigest(layer.overlayToExact)` sein. `GeneratedOverlayLayer.purpose` ist die geschlossene Union `'body-labels' | 'designation'`; `LayeredDrawing` und `RenderableDrawing` behalten ansonsten die Spezifikationsform. Der Validator prüft bei Layern zusätzlich die feldweise identische Exact-ViewBox, verlangt genau einen Exact-Paint-Layer an Position 0, höchstens je einen Generated-Overlay-Zweck in der Reihenfolge `body-labels` vor `designation` und `claim:'not-reference-identical'`; fehlender/formal falscher Digest und jede Transformmutation bei unverändertem Digest sind eigene Fehler. Weder Overlay-Geometrie noch freier Text fließen in Geometry-/Paint-/Component-Digests oder Exact-Attestations ein; der Trace bindet Layer, Zweck, `overlayToExact` und `overlayToExactDigest` separat. Feste referenzidentische Beschriftungen dürfen diesen Pfad nicht benutzen, sondern bleiben Pfadkonturen im Exact-Layer.

- [ ] **Step 4: Exportiere und führe GREEN aus**

  Ergänze `export * from './exact-ir.js';` in `packages/schema/src/index.ts`.

  Run: `rtk mise exec -- pnpm exec vitest run packages/schema/src/exact-ir.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; die bisherige `Drawing`-Form bleibt ohne neue Pflichtfelder typkompatibel.

- [ ] **Step 5: Committe nur den Schema-Slice**

  ```bash
  rtk git -c core.fsmonitor=false add packages/schema/src/exact-ir.ts packages/schema/src/exact-ir.test.ts packages/schema/src/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat: define exact paint IR"
  ```

---

### Task 2: Catalog-, Fixture-, Plan- und Trace-Verträge im Schema

**Agent ownership:** Nur `packages/schema/src/exact-catalog.ts`, dessen Test und die Exportzeile im Schema-Index.

**Files:**
- Create: `packages/schema/src/exact-catalog.ts`
- Create: `packages/schema/src/exact-catalog.test.ts`
- Modify: `packages/schema/src/index.ts`

**Interfaces:**
- Consumes: alle Exact-IR-Typen aus Task 1.
- Produces: `RecipeKey`, `BuilderCompositionKey`, `CompositionContractKey`, `CompositionContractCaseKey`, `CompositionWitnessEdgeKey`, `KnownSymbolSpecDigest`, `KnownSymbolSpecAssetIndex = ReadonlyMap<KnownSymbolSpecDigest, ExactAssetKey>`, `ReferenceComponentContextAccess`, `ReferenceComponentContextPair`, `ReferenceComponentContextSetV1`, `compositionContractKey(component,context)`, `compositionContractCaseKey(contract)`, `compositionWitnessEdgeKey(contract,exactAsset,oraclePart,componentFixture,traceNode)`, `CompositionPlanTargetKey`, `CompositionTraceTargetKey`, `ReferenceExactFragment`, `ExactComponentVariant`, `ExactComponentFixture`, `ExactAssetFixture`, `DisplayFixture`, `RecipeExactAssetLink`, `FragmentInstance`, `ComponentOracleWitness`, `CompositionPlan`, `CompositionTraceNode`, `CompositionTrace`, `DisplayCompositionTrace`, `UnfinalizedExactCompositionResult`, `FinalizedExactCompositionRecord`, `CompositionContract`, `CompositionContractCase`, `CompositionWitnessEdge`, `compositionPlanIssues(plan: CompositionPlan, knownFragments: ReadonlySet<ReferenceExactFragmentKey>): readonly CompositionPlanIssue[]`, `assertCompositionPlan(plan: CompositionPlan, knownFragments: ReadonlySet<ReferenceExactFragmentKey>): void`.

  Diese Schemaaufgabe definiert ausdrücklich weder `ExactBatchDescriptor` noch `ExactBatchModule` oder `LoadedExactBatchClosure`. Diese drei Namen haben genau eine kanonische Definition in `packages/catalog/src/exact/batch-contract.ts` aus Task 23.

- [ ] **Step 0: Lege zuerst den compile-sicheren Produktionsstub an**

  Erzeuge `exact-catalog.ts` mit allen exportierten readonly Interfaces. Die drei gebrandeten Keytypen und ihre Konstruktoren besitzen bereits ihre endgültige compile-sichere Implementierung; `KnownSymbolSpecDigest` brandet ausschließlich formal gültige SHA-256-Werte und `KnownSymbolSpecAssetIndex` ist exakt die oben genannte readonly Map. Der schema-neutrale Totalmengenvertrag lautet final:

  ```ts
  export type ReferenceComponentContextAccess =
    | 'public-builder'
    | 'reference-only'
    | 'direct-carrier';
  export interface ReferenceComponentContextPair {
    readonly component: ComponentKey;
    readonly context: ComponentContextKey;
    readonly contract: CompositionContractKey;
    readonly access: ReferenceComponentContextAccess;
  }
  export interface ReferenceComponentContextSetV1 {
    readonly version: 'ReferenceComponentContextSet/v1';
    readonly pairs: readonly ReferenceComponentContextPair[];
    readonly componentContextSetDigestInput: readonly string[];
  }
  ```

  Diese Typen importieren keine Catalogdaten und machen `public-builder` gegenüber den beiden
  nichtöffentlichen Klassen diskriminiert; der konkrete, registry-aware Wert entsteht erst in
  Task 18. Nur `compositionPlanIssues` ist ein Stub, der für jede Eingabe genau `[{ code: 'red-not-implemented', key: plan.key, detail: 'RED: plan validation not implemented' }]` zurückgibt. `assertCompositionPlan` besitzt bereits die endgültige Signatur und ruft ausschließlich `compositionPlanIssues`; solange Issues existieren, wirft es eine deterministisch aggregierte Meldung. Exportiere das Modul im Schema-Index und belege mit `rtk mise exec -- pnpm typecheck` die Compile-Sicherheit, bevor der Test entsteht.

- [ ] **Step 1: Lege einen atomaren Plan-/Trace-Vertrag als RED an**

  Erzeuge `exact-catalog.test.ts` mit einem Plan, der genau eine Component-Instanz und eine assetspezifische Instanz in expliziter Paint-Reihenfolge führt. Prüfe, dass doppelte `instanceKey`s, eine unbekannte Fragmentreferenz und ein Owner, der nicht zur Instanzart passt, als konkrete Issues zurückkommen:

  ```ts
  import { describe, expect, it } from 'vitest';
  import {
    componentContextKey, exactDecimal, exactTransformSequenceDigest, sha256Digest,
  } from './exact-ir.js';
  import { assertCompositionPlan, compositionPlanIssues, type CompositionPlan } from './exact-catalog.js';

  const d = exactDecimal;
  const fixtureToPart = [] as const;

  const plan: CompositionPlan = {
    version: 'CompositionPlan/v1',
    key: 'plan:fixture',
    target: 'asset:fixture.svg',
    viewBox: {
      minX: d('0'), minY: d('0'), width: d('32'), height: d('32'),
      preserveAspectRatio: 'xMidYMid meet',
    },
    instances: [{
      kind: 'component', instanceKey: 'instance:body',
      variant: 'kind:formation@standalone#primary',
      fragment: 'fragment:formation', transforms: [],
      oracleWitness: {
        oracleAsset: 'oracle:fixture.svg',
        oracleAssetDigest: sha256Digest('a'.repeat(64)),
        oraclePart: 'part:fixture#body',
        fixtureToPart,
        fixtureToPartDigest: exactTransformSequenceDigest(fixtureToPart),
        occurrenceKey: 'occurrence:fixture-body',
      },
    }],
  };

  describe('CompositionPlan/v1', () => {
    it('akzeptiert eine geordnete und eindeutig adressierte Instanzliste', () => {
      expect(compositionPlanIssues(plan, new Set(['fragment:formation']))).toEqual([]);
    });

    it('meldet doppelte Instanzkeys und unbekannte Fragmente getrennt', () => {
      const broken = {
        ...plan,
        instances: [...plan.instances, { ...plan.instances[0], fragment: 'fragment:missing' }],
      };
      expect(compositionPlanIssues(broken, new Set(['fragment:formation'])).map((i) => i.code))
        .toEqual(['duplicate-instance', 'unknown-fragment']);
      expect(() => assertCompositionPlan(broken, new Set(['fragment:formation'])))
        .toThrow(/duplicate-instance.*unknown-fragment/);
    });
  });
  ```

  Ergänze einen gültigen freien Plan mit `target: 'builder:kind=formation;designation=absent'` und verlange ebenfalls `[]`. Ein zur Laufzeit eingeschmuggelter `DisplayKey` als Plantarget muss dagegen `invalid-plan-target` liefern; Displayidentität entsteht ausschließlich durch die Traceprojektion.

  Pinne unabhängig die Keygrenzen: `compositionContractKey('kind:formation', componentContextKey('context:standalone'))` ergibt kanonisch `contract:kind%3Aformation@context%3Astandalone`; `compositionContractCaseKey(contract)` ergibt `contract-case:${encodeURIComponent(contract)}`; der Witness-Key ist `witness:${encodeURIComponent(contract)}|${encodeURIComponent(exactAsset)}|${encodeURIComponent(oraclePart)}|${encodeURIComponent(componentFixture)}|${encodeURIComponent(traceNode)}`. Prozenthex ist uppercase, Eingaben werden genau einmal encodiert, leere/zusätzliche Segmente und nichtkanonische `%`-Schreibweisen werden von den Konstruktoren abgewiesen. `expectTypeOf` belegt, dass `ComponentContextKey` und die drei Ergebnisse weder rohen Strings noch einander zuweisbar sind; positive Contextwerte entstehen ausschließlich über `componentContextKey`, und die Runtime-Duplicate-Tests verwenden ausschließlich die Konstruktoren.

- [ ] **Step 2: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/schema/src/exact-catalog.test.ts`

  Expected: FAIL ausschließlich an `akzeptiert ...`, weil der compile-sichere Stub für den gültigen Plan `red-not-implemented` statt `[]` liefert.

- [ ] **Step 3: Implementiere die vollständigen, readonly Verträge**

  Verwende diese stabilen Kernsignaturen:

  ```ts
  export interface ReferenceExactFragment {
    readonly key: ReferenceExactFragmentKey;
    readonly localFrame: ExactViewBox;
    readonly nodes: readonly ReferenceExactNode[];
  }

  export interface ExactComponentVariant {
    readonly key: ExactComponentVariantKey;
    readonly component: ComponentKey;
    readonly context: ComponentContextKey;
    readonly fragment: ReferenceExactFragmentKey;
  }

  export interface ComponentOracleWitness {
    readonly oracleAsset: OracleAssetKey;
    readonly oracleAssetDigest: Sha256Digest;
    readonly oraclePart: OraclePartKey;
    readonly fixtureToPart: ExactTransformSequence;
    readonly fixtureToPartDigest: Sha256Digest;
    readonly occurrenceKey: string;
  }

  export type FragmentInstance =
    | {
        readonly kind: 'component'; readonly instanceKey: string;
        readonly variant: ExactComponentVariantKey;
        readonly fragment: ReferenceExactFragmentKey;
        readonly transforms: ExactTransformSequence;
        readonly oracleWitness: ComponentOracleWitness;
      }
    | {
        readonly kind: 'asset-specific'; readonly instanceKey: string;
        readonly asset: ExactAssetKey; readonly purpose: string;
        readonly fragment: ReferenceExactFragmentKey;
        readonly transforms: ExactTransformSequence;
      };

  export interface CompositionPlan {
    readonly version: 'CompositionPlan/v1';
    readonly key: string;
    readonly target: CompositionPlanTargetKey;
    readonly viewBox: ExactViewBox;
    readonly instances: readonly FragmentInstance[];
  }

  export type BuilderCompositionKey = `builder:${string}`;
  export type CompositionContractKey = string & { readonly __compositionContractKey: unique symbol };
  export type CompositionContractCaseKey = string & { readonly __compositionContractCaseKey: unique symbol };
  export type CompositionWitnessEdgeKey = string & { readonly __compositionWitnessEdgeKey: unique symbol };
  export type CompositionPlanTargetKey =
    | ExactAssetKey
    | ComponentFixtureKey
    | BuilderCompositionKey;
  export type CompositionTraceTargetKey = CompositionPlanTargetKey | DisplayKey;

  export interface UnfinalizedExactCompositionResult<
    D extends ReferenceExactDrawing | LayeredDrawing = ReferenceExactDrawing | LayeredDrawing,
  > {
    readonly drawing: D;
    readonly trace: CompositionTrace;
  }

  export interface FinalizedExactCompositionRecord<
    D extends ReferenceExactDrawing | LayeredDrawing = ReferenceExactDrawing | LayeredDrawing,
  > extends UnfinalizedExactCompositionResult<D> {
    readonly planDigest: Sha256Digest;
    readonly geometryDigest: Sha256Digest;
    readonly normalizedPaintListDigest: Sha256Digest;
    readonly ownedPaintIndexDigest: Sha256Digest;
    readonly compositionTraceDigest: Sha256Digest;
  }
  ```

  Definiere `ExactComponentFixture` über `key`, `component`, `context`, `variant`, `plan` sowie die fünf erwarteten Digestfelder `planDigest`, `geometryDigest`, `normalizedPaintListDigest`, `ownedPaintIndexDigest` und `compositionTraceDigest`. `ExactAssetFixture` führt `key`, `filename`, `oracle`, `oracleAssetDigest`, `plan` und dieselben fünf erwarteten Digestfelder. `DisplayFixture` ist eine disjunkte Union für `comparisonMode: 'whole'` ohne Part beziehungsweise `'part'` mit genau einem `oraclePart`; sie referenziert genau ein `exactAsset`, besitzt einen `expectedProjectedTraceDigest`, aber weder eigenen Plan noch zweite Drawing-Geometrie. Deshalb ist `DisplayKey` ausschließlich ein `CompositionTraceTargetKey`, niemals ein `CompositionPlanTargetKey`. Freie, heute valide Builderkombinationen verwenden einen `BuilderCompositionKey`; Task 18 erzeugt ihn aus der kanonischen paintrelevanten Spec-Äquivalenzklasse und stellt die eindeutige Auflösung bereit. `RecipeKey` brandet die vorhandenen `RECIPES`-Mapkeys. `RecipeExactAssetLink` hat wörtlich `{ readonly recipe: RecipeKey; readonly exactAsset: ExactAssetKey }` und enthält keine Geometrie; sein Manifestkey wird deterministisch aus genau diesem Paar abgeleitet. Sämtliche Digestfelder sind `Sha256Digest` und werden in Literalen über `sha256Digest(...)` konstruiert.

  Definiere `CompositionTrace` mit `version`, `target: CompositionTraceTargetKey`, `plan` und geordneten Trace-Nodes, aber **ohne** Digests. Ein Component-Trace-Node bindet dieselbe `transforms`-Referenz wie seine Planinstanz und behält den vollständigen unveränderten `oracleWitness`-Wert mit Asset, Assetdigest, Part, `fixtureToPart`, Transformdigest und Occurrence-Key; er darf ihn weder auf `oraclePart` reduzieren noch neu herleiten. Assetspezifische Trace-Nodes tragen ausschließlich `asset` und `purpose`. `FinalizedExactCompositionRecord` ist ausschließlich die schemaweite Ergebnisform für die spätere CLI-Finalisierung und darf in Core nicht erzeugt werden.

  Definiere zusätzlich den Projektionsvertrag `DisplayCompositionTrace`: Er referenziert `display`, `projectedFrom: ExactAssetKey` und dieselben Component-Trace-Nodes des finalisierten ExactAssets. Es gibt keine Displaygeometrie und keinen Displayplan. Task 9 implementiert `projectDisplayComposition(display, assetResult)` so, dass Drawing und Node-Witnesses objektidentisch weitergereicht werden und lediglich Target/Projection-Metadaten wechseln; dadurch erhält jede `DisplayFixture` zwingend einen Trace und kann eine eigene Display-`UseEdge` ableiten.

  Definiere außerdem `CompositionContract` mit `key: CompositionContractKey`, `component: ComponentKey`, `context: ComponentContextKey` und `access: ReferenceComponentContextAccess`, `CompositionContractCase` mit `key: CompositionContractCaseKey` und `contract: CompositionContractKey` sowie `CompositionWitnessEdge` mit `key: CompositionWitnessEdgeKey` und `contract: CompositionContractKey`; die Edge führt außerdem die gebrandeten Asset-/Part-/Fixture-Keys, erwartete Transformfolge, Frame-/Zonenmessung und den Trace-Node. Rohe Strings und `as`-Typecasts sind in Fixtures verboten. `compositionPlanIssues` liefert deterministisch sortierte `{ code, key, detail }`-Werte und wirft nicht beim ersten Fehler. `assertCompositionPlan` ist der einzige throwing Wrapper, ruft diesen Prüfer genau einmal auf, akzeptiert dieselben beiden Argumente und aggregiert sämtliche sortierten Issues; es führt keine zweite Validierungslogik.

- [ ] **Step 4: Exportiere und verifiziere GREEN**

  Ergänze `export * from './exact-catalog.js';` im Schema-Index.

  Run: `rtk mise exec -- pnpm exec vitest run packages/schema/src/exact-catalog.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; kein Typ importiert Node-, Resvg- oder Dateisystem-APIs.

- [ ] **Step 5: Committe den Plan-/Trace-Vertrag**

  ```bash
  rtk git -c core.fsmonitor=false add packages/schema/src/exact-catalog.ts packages/schema/src/exact-catalog.test.ts packages/schema/src/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat: define exact catalog contracts"
  ```

---

### Task 3: Oracle-, Part-, Masken-, Ownership- und Case-Verträge im Schema

**Agent ownership:** Nur `packages/schema/src/conformance.ts`, dessen Test und die Exportzeile.

**Files:**
- Create: `packages/schema/src/conformance.ts`
- Create: `packages/schema/src/conformance.test.ts`
- Modify: `packages/schema/src/index.ts`

**Interfaces:**
- Consumes: Exact-IR- und Exact-Catalog-Keys aus Tasks 1–2.
- Produces: `ExactBatchId`, `UseEdgeKey`, `OracleAsset`, `OracleManifest`, `CorpusFeatureContractKey`, `corpusFeatureContractKey(oracleAsset)`, `CorpusFeatureContract`, `CorpusFeatureCounts`, `REFERENCE_CORPUS_FEATURE_BASELINE`, `OraclePart`, `OraclePaintNodeSelector`, `UseEdge`, `ComparisonProfile`, `ComparisonProfileRegistry`, `MaskContract`, `ResolvedMaskContract`, `OracleOwnershipEntry`, `OracleOwnershipManifestDraft`, `FinalOracleOwnershipManifest`, `OracleOwnershipManifest`, `ConformanceManifest`, `ExactCaseDigestBinding`, `AssetCase`, `DisplayCase`, `ComponentCase`, `ConformanceCaseKey`, `ConformanceCase`, `ReferenceRasterWidth`, `ReferenceRasterOptions`, `assertOraclePart`.

- [ ] **Step 0: Lege zuerst den compile-sicheren Produktionsstub an**

  Lege `conformance.ts` mit sämtlichen exportierten Datenformen an. `CorpusFeatureContractKey` und `corpusFeatureContractKey` sind bereits final compile-sicher implementiert; `assertOraclePart` weist vorerst jede Eingabe mit `RED: oracle part validation not implemented` ab. Exportiere es aus dem Schema-Index und belege mit `rtk mise exec -- pnpm typecheck`, dass Testimporte und gebrandete Digest-/Dezimalwerte auflösbar sind. Erst danach entsteht der Test.

- [ ] **Step 1: Schreibe RED für die autoritative Profil-/Selector-Grenze**

  ```ts
  import { describe, expect, expectTypeOf, it } from 'vitest';
  import { exactDecimal, sha256Digest } from './exact-ir.js';
  import {
    assertOraclePart, type OracleAsset, type OracleManifest, type OraclePart,
  } from './conformance.js';

  const part: OraclePart = {
    key: 'part:fixture#body', asset: 'oracle:fixture.svg',
    oracleAssetDigest: sha256Digest('a'.repeat(64)), role: 'body',
    sourcePaintNodes: [{
      node: 'oracle-paint:fixture:0', oracleAssetDigest: sha256Digest('a'.repeat(64)),
    }],
    oracleToPart: [], isolation: { mode: 'source-node-set' },
    comparisonProfile: 'profile:body-32',
  };

  expectTypeOf<OracleManifest['assets'][number]>().toEqualTypeOf<OracleAsset>();

  describe('OraclePart', () => {
    it('bindet jeden Selector an denselben vollständigen Assetdigest', () => {
      expect(assertOraclePart(part)).toBe(part);
      expect(() => assertOraclePart({
        ...part,
        sourcePaintNodes: [{ ...part.sourcePaintNodes[0], oracleAssetDigest: sha256Digest('b'.repeat(64)) }],
      })).toThrow(/Selector/);
    });

    it('duldet keine lokale Frame- oder Maskenkopie neben comparisonProfile', () => {
      expect(() => assertOraclePart({ ...part, partFrame: { width: exactDecimal('32') } })).toThrow(/partFrame/);
      expect(() => assertOraclePart({ ...part, mask: 'mask:inline' })).toThrow(/mask/);
    });
  });
  ```

  Ergänze einen exportierten `OracleAsset` mit `key: 'oracle:fixture.svg'`, `filename: 'fixture.svg'` und `sha256: sha256Digest('a'.repeat(64))`; `OracleManifest.assets` muss genau diesen Typ verwenden. `expectTypeOf<OracleManifest['assets'][number]>().toEqualTypeOf<OracleAsset>()` belegt den Export und die Manifestbindung; die Laufzeitvalidierung von Key, reinem Basename und Digest gehört bewusst der vollständigen Manifest-/Loadergrenze in Tasks 16/19. Ergänze außerdem einen `CorpusFeatureContract` mit `key: corpusFeatureContractKey('oracle:fixture.svg')`, `oracleAsset: 'oracle:fixture.svg'` und `oracleAssetDigest: sha256Digest('a'.repeat(64))`. Der Konstruktor ergibt exakt `oracle-feature:oracle%3Afixture.svg`. Roher Stringkey, ein Key für ein anderes Asset, fehlender Digest, falscher Assetdigest sowie ein zweiter Contract für dasselbe Asset müssen in Schema-/späterem Registrytest getrennt scheitern.

- [ ] **Step 2: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/schema/src/conformance.test.ts`

  Expected: FAIL an der positiven `assertOraclePart(part)`-Assertion, weil der compile-sichere Stub auch den gültigen Part mit `RED: oracle part validation not implemented` ablehnt.

- [ ] **Step 3: Implementiere die Schlüssel- und Manifestverträge**

  Verwende die Part-/UseEdge-Signaturen aus Spezifikation §3.3 wörtlich. Der Selector trägt sowohl stabile Oracle-Paint-Node-ID als auch Assetdigest. `OraclePart` enthält weder `partFrame` noch `mask`; nur `comparisonProfile` darf darauf verweisen.

  `MaskContract` ist explizit und versioniert:

  ```ts
  export type ExactBatchId = string;
  export type ReferenceRasterWidth = 16 | 24 | 32 | 48 | 64 | 128 | 256 | 512 | 2048 | 4096;
  export interface ReferenceRasterOptions {
    readonly width: ReferenceRasterWidth;
    readonly background: 'transparent' | 'black' | 'white';
  }

  export interface MaskContract {
    readonly version: 'MaskContract/v1';
    readonly key: string;
    readonly coordinateSpace: 'part-frame';
    readonly partFrame: ExactViewBox;
    readonly rasterWidths: readonly ReferenceRasterWidth[];
    readonly edgeInclusion: 'pixel-center-inclusive';
    readonly antialiasing: 'resvg-2.6.2';
    readonly alphaThreshold: 0;
    readonly viewportMapping: 'fit-width-xMidYMid-meet';
    readonly shape:
      | { readonly kind: 'full-frame' }
      | { readonly kind: 'path'; readonly commands: readonly ExactPathCommand[] };
  }

  export interface ResolvedMaskContract {
    readonly source: MaskContract;
    readonly width: ReferenceRasterWidth;
    readonly height: number;
    readonly partToViewport: ExactViewportMapping;
    readonly partToViewportDigest: Sha256Digest;
    readonly resolvedMaskDigest: Sha256Digest;
  }

  export interface ComparisonProfile {
    readonly key: ComparisonProfileId;
    readonly partFrame: ExactViewBox;
    readonly maskContract: string;
    readonly diagnosticWidths: readonly ReferenceRasterWidth[];
  }
  ```

  `ExactBatchId` ist bereits hier im gemeinsamen Schema verfügbar, weil die vor dem Catalog-Batchvertrag implementierte CLI-Rasterebene ihren Batchresultattyp benötigt. Jede Manifest-/Descriptor-Factory validiert zur Laufzeit die kanonische ASCII-Grammatik `[a-z0-9]+(?:-[a-z0-9]+)*`; leere IDs, Großbuchstaben, Slash, Punkt, Colon und Whitespace sind ungültig. Task 23 re-exportiert denselben Typ aus `batch-contract.ts`, definiert aber keinen zweiten.

  Ein `MaskContract` speichert bewusst **keine** einzige `partToViewport`-Abbildung für alle Breiten. Seine zehn `rasterWidths` müssen exakt der globalen Pflichtmenge entsprechen; Task 13 leitet aus `partFrame`, `viewportMapping` und der konkreten Zellenbreite jeweils Höhe und vollständige `ExactViewportMapping/v1` ab. Deren sechs affine Koeffizienten sind gekürzte rationale Werte mit kanonischen Integerstring-Zählern/-Nennern; insbesondere wird eine Skala wie `32 / 90.709` weder gerundet noch als `ExactTransformSequence` vorgetäuscht. Gleichheit und Anwendung werden per BigInt-Cross-Multiplikation geprüft. Der CLI-Digest-Layer berechnet `partToViewportDigest` und `resolvedMaskDigest` über genau den aufgelösten Zellenwert. Case-/Matrixrecords tragen diese beiden Digests, sodass keine Abbildung still über zehn Breiten wiederverwendet wird.

  `OracleManifest/v1` bindet kanonisch sortierte `OracleAsset`-Zeilen an `oracleSetDigest`, aber niemals Pfade oder XML:

  ```ts
  export interface OracleAsset {
    readonly key: OracleAssetKey;
    readonly filename: string;
    readonly sha256: Sha256Digest;
  }
  export interface OracleManifest {
    readonly version: 'OracleManifest/v1';
    readonly assets: readonly OracleAsset[];
    readonly oracleSetDigest: Sha256Digest;
  }
  ```

  Task 16 liefert den vollständigen committed Wert. `OracleOwnershipManifest` ist diskriminiert: `OracleOwnershipManifestDraft` hat `status: 'awaiting-corpus-finalization'`, den vollen `oracleSetDigest`, `owner: 'exact-reference-corpus'` und eine leere Entryfolge; `FinalOracleOwnershipManifest` hat `status: 'final'`, dieselbe Ownerkennung, sämtliche 661 Asset-/Paint-Records und Setdigests. Nur die finale Form darf ein Strict-/Inventory-Gate bestehen. So kann Foundation den Exportvertrag anlegen, während ausschließlich der Corpusplan seine Inhalte finalisiert; kein Foundationmodul konsumiert Corpus-Shards und keine Batchdatei wird zur Quelle des globalen Manifests.

  `CorpusFeatureCounts` ist vollständig und führt neben den Summen jede Transform-Elementart und jede ViewBoxfamilie explizit:

  ```ts
  export type CorpusFeatureContractKey = string & {
    readonly __corpusFeatureContractKey: unique symbol;
  };
  export interface CorpusFeatureCounts {
    readonly groups: number;
    readonly rects: number;
    readonly paths: number;
    readonly pathFiles: number;
    readonly polygons: number;
    readonly circles: number;
    readonly polylines: number;
    readonly transforms: number;
    readonly transformFiles: number;
    readonly transformsByElement: Readonly<{
      group: number; rect: number; path: number; polygon: number;
      circle: number; polyline: number;
    }>;
    readonly viewBoxFamilies: Readonly<{
      '32x32-mm': number; '48x32-mm': number; '36x32-mm': number;
      '32x46-mm': number; '80x32-mm': number;
    }>;
  }
  export interface CorpusFeatureContract {
    readonly version: 'CorpusFeatureContract/v1';
    readonly key: CorpusFeatureContractKey;
    readonly oracleAsset: OracleAssetKey;
    readonly oracleAssetDigest: Sha256Digest;
    readonly expectedCounts: CorpusFeatureCounts;
    readonly allowedElements: readonly string[];
    readonly allowedAttributesByElement: Readonly<Record<string, readonly string[]>>;
    readonly allowedPresentationAttributes: readonly string[];
    readonly allowedTransformKinds: readonly string[];
  }
  ```

  `key` muss bytegleich `corpusFeatureContractKey(oracleAsset)` sein; der Konstruktor liefert `oracle-feature:${encodeURIComponent(oracleAsset)}` mit kanonischem Uppercase-Prozentencoding. `oracleAssetDigest` muss dem Digest derselben `OracleManifest`-Zeile entsprechen. `REFERENCE_CORPUS_FEATURE_BASELINE` pinnt zusätzlich die corpusweiten Summen: 2.336 Gruppen, 965 Rechtecke, 2.155 Pfade in 601 Dateien, 124 Polygone, 102 Kreise, 4 Polylinien und 55 Transformationen in 53 Dateien sowie die Familien 32×32, 48×32, 36×32, 32×46 und 80×32 mm. Diese Daten sind reine, serialisierbare Verträge im Schema; XML-Verarbeitung bleibt trotzdem ausschließlich in der CLI.

  `ConformanceManifest` enthält erwartete sortierte Keysets plus Kardinalität und Set-Digest für OracleParts, ComponentFixtures, ComponentCases, UseEdges, ContractCases, WitnessEdges, Whole-/Part-Displays und erlaubte assetspezifische Keys. Seine ContractCase-Folge ist `readonly CompositionContractCaseKey[]`, seine Witness-Folge `readonly CompositionWitnessEdgeKey[]`; rohe `string[]` sind an diesen Grenzen unzulässig. `ExactCaseDigestBinding` führt verpflichtend `oracleAssetDigest`, `planDigest`, `geometryDigest`, `normalizedPaintListDigest`, `ownedPaintIndexDigest`, `compositionTraceDigest`, `oraclePartDigest`, `comparisonProfileDigest`, `maskContractDigest`, `oracleToPartDigest` und `fixtureToPartDigest`; nicht anwendbare Partwerte werden nicht leer gelassen, sondern die Whole-Part-/Identity-Verträge gedigestet. Asset-, Display- und ComponentCase referenzieren diese Bindung als feste erwartete Literale. `ComponentCase.key` ist kanonisch `case:${ComponentFixtureKey}`, enthält genau einen `componentFixture: ComponentFixtureKey` und gehört als gespeicherte, strict-enumerierbare Collection dem Batch, der diese Fixture besitzt; dieselbe Fixture oder derselbe Case darf in keinem zweiten Batch vorkommen. Zellabhängige `partToViewportDigest`/`resolvedMaskDigest` entstehen erst pro Breite im `ComparisonCellResult`. Case-Typen erlauben nur `pending | approved | failed | invalidated`; eine technische Freigabe darf ausschließlich `approved` attestieren. Exportiere zusätzlich `ConformanceCaseKey` und die Union `ConformanceCase = AssetCase | DisplayCase | ComponentCase`, damit Registry und Corpus exakt eine gemeinsame `CONFORMANCE_CASES`-Keymenge bilden können.

- [ ] **Step 4: Exportiere und führe GREEN aus**

  Ergänze `export * from './conformance.js';`.

  Run: `rtk mise exec -- pnpm exec vitest run packages/schema/src/conformance.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; `OraclePart` kann strukturell keine eigene Frame-/Maskenkopie tragen.

- [ ] **Step 5: Committe den Conformance-Vertrag**

  ```bash
  rtk git -c core.fsmonitor=false add packages/schema/src/conformance.ts packages/schema/src/conformance.test.ts packages/schema/src/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat: define conformance case contracts"
  ```

---

### Task 4: Attestation- und Trust-Store-Vertrag im Schema

**Agent ownership:** Nur `packages/schema/src/conformance-attestation.ts`, dessen Test und die Exportzeile.

**Files:**
- Create: `packages/schema/src/conformance-attestation.ts`
- Create: `packages/schema/src/conformance-attestation.test.ts`
- Modify: `packages/schema/src/index.ts`

**Interfaces:**
- Consumes: `Sha256Digest` aus Task 1 und Case-Keys aus Task 3.
- Produces: `ConformanceSignatureEnvelope`, `ConformanceProvenanceRecord`, `ConformanceAttestation`, `UnsignedConformanceAttestation`, `AttestationTrustStore`, `AttestationTrustKey`, `CurrentConformanceDigests`, `AttestationVerification`, `defineExactKeySet<T>()`, `CURRENT_CONFORMANCE_KEYS`, `unsignedAttestation`.

- [ ] **Step 0: Lege zuerst den compile-sicheren Produktionsstub an**

  Definiere sämtliche Attestation-Interfaces in `conformance-attestation.ts`; `unsignedAttestation` gibt vorerst ein explizit unvollständiges, aber typkompatibles Testobjekt über einen internen Stubadapter zurück. Exportiere das Modul und führe `rtk mise exec -- pnpm typecheck` erfolgreich aus, bevor der Test angelegt wird. Der Stub darf die spätere Keyset-Assertion nicht zufällig erfüllen.

- [ ] **Step 1: Pinne die vollständige signierte Payload als RED**

  Schreibe einen Test, der eine vollständige Fixture baut, `unsignedAttestation` aufruft und nur das Signaturfeld entfernt. Er muss außerdem über `keyof CurrentConformanceDigests` belegen, dass alle Freshness-Digests vertreten sind:

  ```ts
  import { describe, expect, expectTypeOf, it } from 'vitest';
  import { sha256Digest } from './exact-ir.js';
  import {
    defineExactKeySet,
    unsignedAttestation,
    type ConformanceAttestation,
    type CurrentConformanceDigests,
  } from './conformance-attestation.js';

  const currentKeys = defineExactKeySet<CurrentConformanceDigests>()([
    'commitDigest', 'headCommit', 'sourceTreeDigest', 'buildInputDigest',
    'oracleAssetDigests',
    'oracleSetDigest', 'oracleEvidenceDigest', 'oraclePartSetDigest',
    'oracleOwnershipManifestDigest', 'fixtureDigest', 'geometryDigest',
    'compositionTraceDigest', 'reachableBuilderContextSetDigest',
    'referenceComponentContextSetDigest',
    'referenceComponentContextOwnershipDigest',
    'compositionContractRegistryDigest',
    'compositionWitnessSetDigest', 'normalizedPaintListDigest',
    'ownedPaintIndexDigest', 'rendererContractDigest', 'toolchainDigest',
    'rasterEnvironmentDigest', 'fontSetDigest', 'comparisonContractDigest',
    'comparisonProfileSetDigest', 'maskContractSetDigest', 'strictRunDigest',
    'trustStoreDigest', 'resultDigest',
    'comparisonContractVersion', 'strictRunId',
  ] as const);

  it('entfernt für die Signatur exakt signature und behält alle übrigen Felder', () => {
    const attestation: ConformanceAttestation = fixtureAttestation();
    const unsigned = unsignedAttestation(attestation);
    expect(unsigned).not.toHaveProperty('signature');
    expect(Object.keys(unsigned).sort()).toEqual(
      Object.keys(attestation).filter((key) => key !== 'signature').sort(),
    );
    expect(currentKeys).toHaveLength(31);
    expect(() => defineExactKeySet<CurrentConformanceDigests>()([
      ...currentKeys, 'resultDigest',
    ])).toThrow(/duplicate/);
  });
  ```

  `fixtureAttestation()` ist im Test als vollständiges Literal mit jedem Feld aus Spezifikation §8 anzulegen; keine Produktionsfactory darf die Erwartung erzeugen. Das Literal enthält insbesondere `reachableBuilderContextSetDigest`, `referenceComponentContextSetDigest` und `referenceComponentContextOwnershipDigest` als drei getrennte Pflichtfelder. Jeder SHA-256-Wert in Freshness und Provenance sowie jedes Element von `oracleAssetDigests` wird mit `sha256Digest(...)` gebrandet. `headCommit` ist dagegen ein roher, validierter kanonischer Git-OID-String und wird im positiven Literal beispielsweise als `'a'.repeat(40)` angegeben; `as ConformanceAttestation`, rohe Digeststrings oder Digest-Typecasts sind verboten. Das Literal enthält für jede benötigte Evidence-Paarart einen separaten vollständigen `ConformanceProvenanceRecord`. Ein `expectTypeOf<(typeof currentKeys)[number]>().toEqualTypeOf<keyof CurrentConformanceDigests>()` plus eine testseitige `ExactKeySet`-Compileassertion belegt beide Richtungen: kein Typkey fehlt und kein Listenkey ist fremd.

- [ ] **Step 2: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/schema/src/conformance-attestation.test.ts`

  Expected: FAIL an der Keyset-Assertion, weil der compile-sichere `unsignedAttestation`-Stub nicht sämtliche unsignierten Pflichtfelder erhält; fehlende Imports oder Typfehler sind kein RED.

- [ ] **Step 3: Implementiere die Spezifikationsform ohne optionale Digestfelder**

  Übernimm `ConformanceAttestation` und `ConformanceSignatureEnvelope` feldgleich aus §8. `signature.version`, `algorithm` und `payloadEncoding` sind die Literale `ConformanceSignature/v1`, `Ed25519` und `RFC8785-JCS-UTF8`. Sämtliche Digest-, Commit-, Run-, Issuer-, Reviewer- und Zeitfelder sind Pflicht. Der paarbezogene Provenance-Vertrag ist vollständig und wird später ohne zweite Schemaform aus Reviewdaten erzeugt:

  ```ts
  export interface ConformanceProvenanceRecord {
    readonly version: 'ConformanceProvenance/v1';
    readonly caseKey: ConformanceCaseKey;
    readonly pair: 'full' | 'selected' | 'without-selected';
    readonly headCommit: string;
    readonly strictRunId: string;
    readonly strictRunDigest: Sha256Digest;
    readonly caseResultDigest: Sha256Digest;
    readonly evidenceDigest: Sha256Digest;
    readonly inspectionDigest: Sha256Digest;
    readonly technicalReviewerId: string;
    readonly technicalReviewerRegistryDigest: Sha256Digest;
  }
  ```

  Jede Attestation enthält exakt einen Record je für ihren Case erforderlichem Pair in der kanonischen Reihenfolge (`full`; `selected`; beziehungsweise `full`, `without-selected`). Jeder Record bindet denselben Case, `headCommit`, `strictRunId`, `strictRunDigest` und Case-Result wie die Attestation sowie genau den paarlokalen `evidenceDigest`/`inspectionDigest` und registrierten technischen Reviewer. Tests mutieren jedes Feld einzeln und weisen fehlende, doppelte, fremde, vertauschte oder auf einen anderen Pair-Record wiederverwendete Records ab.

  Der Trust Store hat diese feste Form:

  ```ts
  export interface AttestationTrustKey {
    readonly keyId: string;
    readonly issuer: string;
    readonly publicKeySpkiDerBase64Url: string;
    readonly validFrom: string;
    readonly validUntil: string;
    readonly revokedAt?: string;
  }
  export interface AttestationTrustStore {
    readonly version: 'AttestationTrustStore/v1';
    readonly keys: readonly AttestationTrustKey[];
    readonly reviewers: readonly string[];
  }
  export interface AttestationVerification {
    readonly status: 'approved' | 'invalidated';
    readonly issues: readonly {
      readonly code: string;
      readonly field?: string;
      readonly detail: string;
    }[];
  }
  ```

  `ConformanceAttestation` und `CurrentConformanceDigests` enthalten `reachableBuilderContextSetDigest`, `referenceComponentContextSetDigest` und `referenceComponentContextOwnershipDigest` als getrennte verpflichtende `Sha256Digest`-Felder. `CurrentConformanceDigests` enthält damit genau die 31 im Test genannten Freshnessfelder. Die 27 skalaren SHA-256-Felder und jedes Element von `oracleAssetDigests` sind `Sha256Digest`; `headCommit` bleibt ein roher String, muss aber an jeder Construction-/Verification-Grenze als kanonischer kleingeschriebener 40- oder 64-Hex-Git-OID (`^[0-9a-f]{40}(?:[0-9a-f]{24})?$`) validiert werden. Nur `comparisonContractVersion` und `strictRunId` sind weitere ausdrücklich nicht als Hash definierte Stringtypen. `defineExactKeySet<T>()` verlangt typseitig gleichzeitig `Exclude<keyof T, K[number]> extends never` und `Exclude<K[number], keyof T> extends never` und prüft zur Laufzeit vor dem Freezen auf Duplikate. `CURRENT_CONFORMANCE_KEYS` wird genau damit konstruiert; ein schwaches `satisfies readonly (keyof T)[]` allein genügt nicht. `unsignedAttestation` nutzt Destrukturierung und gibt den Rest unverändert zurück; es mutiert oder serialisiert nicht.

- [ ] **Step 4: Exportiere und führe GREEN aus**

  Ergänze `export * from './conformance-attestation.js';`.

  Run: `rtk mise exec -- pnpm exec vitest run packages/schema/src/conformance-attestation.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; das Testliteral kompiliert nur, wenn kein Pflichtfeld fehlt.

- [ ] **Step 5: Committe den Attestation-Vertrag**

  ```bash
  rtk git -c core.fsmonitor=false add packages/schema/src/conformance-attestation.ts packages/schema/src/conformance-attestation.test.ts packages/schema/src/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat: define signed conformance attestations"
  ```

---

### Task 5: Verlustfreie Dezimalkanonisierung und Festkommaarithmetik

**Agent ownership:** Nur `packages/core/src/exact/decimal.ts` und `packages/core/src/exact/decimal.test.ts`; noch kein Core-Index-Edit.

**Files:**
- Create: `packages/core/src/exact/decimal.ts`
- Create: `packages/core/src/exact/decimal.test.ts`

**Interfaces:**
- Consumes: `ExactDecimal` aus Task 1.
- Produces: `normalizeExactDecimal(input: string): ExactDecimal`, `addExactDecimals(a,b)`, `subtractExactDecimals(a,b)`, `multiplyExactDecimalByInteger(value,factor)`, `compareExactDecimals(a,b)`, `isCanonicalExactDecimal(value)`.

- [ ] **Step 0: Lege zuerst den compile-sicheren Produktionsstub an**

  Erzeuge `decimal.ts` mit allen Signaturen; `normalizeExactDecimal` ruft vorerst ausschließlich `exactDecimal(input)` auf, während Rechenfunktionen `throw new Error('RED: decimal arithmetic not implemented')`. Belege `rtk mise exec -- pnpm typecheck` vor dem Test. Damit kompiliert der Slice und RED misst Normalisierung von nichtkanonischer Quellsyntax beziehungsweise Arithmetik.

- [ ] **Step 1: Schreibe adversariale Dezimaltests**

  ```ts
  import { describe, expect, it } from 'vitest';
  import {
    addExactDecimals, isCanonicalExactDecimal, multiplyExactDecimalByInteger,
    normalizeExactDecimal, subtractExactDecimals,
  } from './decimal.js';

  describe('ExactDecimal', () => {
    const d = normalizeExactDecimal;
    it.each([
      ['+00012.3400', '12.34'], ['-0.000', '0'], ['.5', '0.5'],
      ['5.', '5'], ['1e-3', '0.001'], ['-1.2300E+3', '-1230'],
      ['900719925474099312345.0000', '900719925474099312345'],
    ])('kanonisiert %s verlustfrei zu %s', (source, expected) => {
      expect(normalizeExactDecimal(source)).toBe(expected);
    });

    it('rechnet relative Koordinaten und reflektierte C-Kontrollpunkte ohne Number', () => {
      expect(addExactDecimals(d('9007199254740993'), d('0.0001'))).toBe('9007199254740993.0001');
      expect(subtractExactDecimals(d('10.25'), d('3.005'))).toBe('7.245');
      expect(multiplyExactDecimalByInteger(d('-0.125'), 2)).toBe('-0.25');
    });

    it.each(['', '.', '--1', 'NaN', 'Infinity', '1e', '0x10', ' 1 '])(
      'weist ungültigen Quellwert %j ab', (source) => {
        expect(() => normalizeExactDecimal(source)).toThrow();
      },
    );

    it('erkennt ausschließlich minimale Darstellung als kanonisch', () => {
      expect(isCanonicalExactDecimal('0')).toBe(true);
      expect(isCanonicalExactDecimal('-0')).toBe(false);
      expect(isCanonicalExactDecimal('01')).toBe(false);
      expect(isCanonicalExactDecimal('1e3')).toBe(false);
    });
  });
  ```

- [ ] **Step 2: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/exact/decimal.test.ts`

  Expected: FAIL verhaltensbezogen: `+00012.3400` wird vom Stub abgelehnt und die Arithmetik wirft `RED: decimal arithmetic not implemented`; Modulimport und Typecheck bleiben grün.

- [ ] **Step 3: Implementiere Stringparser und BigInt-Skalierung**

  Parse ausschließlich mit `^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$`, verlange mindestens eine Ziffer und trimme Eingaben nicht. Bilde aus allen Ziffern einen `bigint`-Koeffizienten und aus Nachkommastellen minus Exponent eine Dezimalskala. Richte für Addition/Subtraktion beide Operanden über Zehnerpotenzen auf dieselbe Skala aus; serialisiere danach Vorzeichen, Ganz-/Nachkommateil, entferne führende Ganzzahlnullen und nachlaufende Dezimalnullen und normalisiere jeden Nullkoeffizienten zu `0`.

  Kein Zweig darf `Number(input)`, `parseFloat`, `toFixed`, exponentielle Ausgabe oder eine Rundung benutzen. Jede erfolgreiche Normalisierung und jedes Rechenergebnis läuft unmittelbar durch Schema-`exactDecimal`; `multiplyExactDecimalByInteger` weist nicht-ganzzahlige oder nicht sichere Integerfaktoren ab. Operanden der Rechenfunktionen sind typseitig `ExactDecimal`, sodass kein ungeprüftes Stringliteral an die Arithmetic-Grenze gelangt.

- [ ] **Step 4: Führe GREEN und die angrenzenden Schema-Tests aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/exact/decimal.test.ts packages/schema/src/exact-ir.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS.

- [ ] **Step 5: Committe den Dezimalkern**

  ```bash
  rtk git -c core.fsmonitor=false add packages/core/src/exact/decimal.ts packages/core/src/exact/decimal.test.ts
  rtk git -c core.fsmonitor=false commit -m "feat: canonicalize exact decimals"
  ```

---

### Task 6: SVG-Pfade vollständig auf absolute M/L/C/Z kanonisieren

**Agent ownership:** Nur `packages/core/src/exact/path.ts` und `packages/core/src/exact/path.test.ts`.

**Files:**
- Create: `packages/core/src/exact/path.ts`
- Create: `packages/core/src/exact/path.test.ts`

**Interfaces:**
- Consumes: `ExactPathCommand` aus Task 1 und die Festkommaarithmetik aus Task 5.
- Produces: `canonicalizeExactPath(data: string): readonly ExactPathCommand[]`, `canonicalizeExactPolygon(points: string)`, `canonicalizeExactPolyline(points: string)`, `serializeExactPath(commands)`, `hasExactDrawingSegment(commands)`.

- [ ] **Step 0: Lege zuerst den compile-sicheren Produktionsstub an**

  Erzeuge `path.ts` mit allen Signaturen. Parserfunktionen geben vorerst eine eingefrorene leere Commandfolge zurück, `serializeExactPath` `''` und `hasExactDrawingSegment` `false`. `rtk mise exec -- pnpm typecheck` muss vor dem Test grün sein; die leere Folge ist absichtlich semantisch falsch, aber kein Importfehler.

- [ ] **Step 1: Schreibe Äquivalenz- und Nichtäquivalenztests vor dem Parser**

  ```ts
  import { describe, expect, it } from 'vitest';
  import {
    canonicalizeExactPath, canonicalizeExactPolygon,
    canonicalizeExactPolyline, serializeExactPath,
  } from './path.js';

  describe('kanonische Exact-Pfade', () => {
    it.each([
      ['M1 2h3v4H1z', 'M 1 2 L 4 2 L 4 6 L 1 6 Z'],
      ['m1 2 3 0 0 4z', 'M 1 2 L 4 2 L 4 6 Z'],
      ['M10 10c1 2 3 4 5 6s7 8 9 10',
       'M 10 10 C 11 12 13 14 15 16 C 17 18 22 24 24 26'],
      ['M.5 -.5L1e1 2E-1', 'M 0.5 -0.5 L 10 0.2'],
    ])('normalisiert %s', (source, expected) => {
      expect(serializeExactPath(canonicalizeExactPath(source))).toBe(expected);
    });

    it('macht Polygon und Polyline unterscheidbar', () => {
      expect(serializeExactPath(canonicalizeExactPolygon('0,0 2,0 2,2')))
        .toBe('M 0 0 L 2 0 L 2 2 Z');
      expect(serializeExactPath(canonicalizeExactPolyline('0,0 2,0 2,2')))
        .toBe('M 0 0 L 2 0 L 2 2');
    });

    it.each(['M0 0Q1 1 2 2', 'M0 0A1 1 0 0 0 2 2', 'M0', 'L0 0', 'M0 0X1'])
      ('weist nicht gemessene oder unvollständige Grammatik %j ab', (source) => {
        expect(() => canonicalizeExactPath(source)).toThrow();
      });
  });
  ```

  Ergänze getrennte Fälle für mehrere Subpaths, implizite Wiederholung nach `M/L/C/S`, Vorzeichen ohne Trenner (`M0-1`) und die Rücksetzung des vorherigen C-Kontrollpunkts nach `M/L/Z`.
  Ergänze außerdem `canonicalizeExactPath('M0 0')` als syntaktisch gültigen Fall mit `hasExactDrawingSegment(...) === false`, damit der Oracle-Non-Painting-Pfad nicht durch den Lexer verloren geht.

- [ ] **Step 2: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/exact/path.test.ts`

  Expected: FAIL an der ersten erwarteten kanonischen Commandfolge (`[]` statt `M/L/C/Z`); keine fehlenden Module oder Typfehler.

- [ ] **Step 3: Implementiere einen zustandsbehafteten Lexer und Normalisierer**

  Der Lexer darf nur SVG-Whitespace, Komma, die gemessenen Buchstaben und Dezimaltoken akzeptieren; jeder nicht konsumierte Charakter ist ein Fehler. Der Parser hält `current`, `subpathStart`, letztes Kommando und den letzten kubischen Kontrollpunkt als `ExactDecimal`-Paare.

  - Relative End- und Kontrollpunkte werden ausschließlich mit `addExactDecimals` absolut.
  - `H/h` und `V/v` emittieren `L`.
  - Weitere Koordinatenpaare nach `M/m` emittieren `L`.
  - `S/s` reflektiert bei unmittelbar vorangehendem `C/S` den zweiten Kontrollpunkt mit `2 * current - previousControl`; andernfalls ist der erste Kontrollpunkt gleich `current`.
  - `Z/z` emittiert nur `Z` und setzt den Cursor auf `subpathStart`.
  - Falsche Arity, fehlendes initiales `M`, vollständig leere Daten und unbekannte Kommandos werfen eine Meldung mit Tokenoffset. Syntaktisch valide, aber geometrisch degenerierte Pfade bleiben als Commandfolge parsebar, damit der Oracle-Parser sie als `non-painting` inventarisieren kann; `hasExactDrawingSegment` klassifiziert sie, und der öffentliche sichtbare Candidate-IR-Validator weist sie ab.

  `serializeExactPath` gibt exakt ein Leerzeichen zwischen Kommando und Operanden sowie zwischen Kommandos aus. Es serialisiert nie Kommas, Kurzformen oder implizite Wiederholungen.

- [ ] **Step 4: Führe GREEN und adversariale Wiederholung aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/exact/path.test.ts packages/core/src/exact/decimal.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; die semantisch äquivalenten Paare haben identische Befehlsarrays, vertauschte Subpaths nicht.

- [ ] **Step 5: Committe den Pfadnormalisierer**

  ```bash
  rtk git -c core.fsmonitor=false add packages/core/src/exact/path.ts packages/core/src/exact/path.test.ts
  rtk git -c core.fsmonitor=false commit -m "feat: canonicalize exact SVG paths"
  ```

---

### Task 7: Transformlisten ohne Faltung kanonisieren

**Agent ownership:** Nur `packages/core/src/exact/transform.ts` und dessen Test.

**Files:**
- Create: `packages/core/src/exact/transform.ts`
- Create: `packages/core/src/exact/transform.test.ts`

**Interfaces:**
- Consumes: `ExactTransformSequence` aus Task 1 und `normalizeExactDecimal` aus Task 5.
- Produces: `parseExactTransformSequence(source: string | undefined)`, `assertCanonicalExactTransformSequence(sequence)`, `serializeExactTransformSequence(sequence)`.

- [ ] **Step 0: Lege zuerst den compile-sicheren Produktionsstub an**

  Erzeuge `transform.ts` mit den vollständigen Signaturen; der Parser liefert vorerst stets `[]`, der Validator akzeptiert nur `[]` und der Serializer `''`. Belege zuerst `rtk mise exec -- pnpm typecheck`; erst danach darf der Test das falsche Transformverhalten rot machen.

- [ ] **Step 1: Schreibe die nicht faltbare Transformsemantik als RED**

  ```ts
  import { describe, expect, it } from 'vitest';
  import { exactDecimal } from '@einsatzzeichen/schema';
  import { parseExactTransformSequence, serializeExactTransformSequence } from './transform.js';

  describe('ExactTransformSequence', () => {
    it('schreibt Defaultoperanden aus und erhält die Reihenfolge', () => {
      const sequence = parseExactTransformSequence(
        'translate(01.500) scale(2) rotate(45) matrix(1 0 0 1 -0 3)',
      );
      expect(serializeExactTransformSequence(sequence)).toBe(
        'translate(1.5 0) scale(2 2) rotate(45 0 0) matrix(1 0 0 1 0 3)',
      );
    });

    it('behält Rotation typisiert statt sie in Sinus-/Kosinuswerte zu falten', () => {
      expect(parseExactTransformSequence('rotate(45 10 10)')).toEqual([
        { kind: 'rotate', angle: exactDecimal('45'), cx: exactDecimal('10'), cy: exactDecimal('10') },
      ]);
    });

    it('unterscheidet Reihenfolge und Faktorisierung auch bei denkbarer Rastergleichheit', () => {
      expect(parseExactTransformSequence('translate(1 0) scale(2)'))
        .not.toEqual(parseExactTransformSequence('scale(2) translate(.5 0)'));
      expect(parseExactTransformSequence('matrix(2 0 0 2 1 0)'))
        .not.toEqual(parseExactTransformSequence('translate(1) scale(2)'));
    });

    it.each(['skewX(2)', 'rotate(1 2)', 'matrix(1 0 0 1 0)', 'translate()', 'none'])
      ('weist nicht gemessene Transformsyntax %j ab', (source) => {
        expect(() => parseExactTransformSequence(source)).toThrow();
      });
  });
  ```

- [ ] **Step 2: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/exact/transform.test.ts`

  Expected: FAIL an der erwarteten expliziten `translate/scale/rotate/matrix`-Folge, weil der compile-sichere Stub `[]` liefert.

- [ ] **Step 3: Implementiere Parser und kanonischen Serializer**

  Parse Funktionsname, geklammerte Operanden und sämtliche Zwischenräume vollständig. Zulässig sind ausschließlich:

  ```text
  translate(x) | translate(x,y)
  scale(x)     | scale(x,y)
  rotate(a)    | rotate(a,cx,cy)
  matrix(a,b,c,d,e,f)
  ```

  Leerer oder fehlender Quellwert ergibt `[]`; ein explizites fremdes Literal ist ein Fehler. Normalisiere jeden Operanden über Task 5, schreibe `translate(x)` zu `(x,0)`, `scale(x)` zu `(x,x)` und `rotate(a)` zu `(a,0,0)` aus. Der Serializer folgt der Arrayreihenfolge exakt und erzeugt niemals eine abgeleitete Matrix.

- [ ] **Step 4: Führe GREEN aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/exact/transform.test.ts packages/core/src/exact/decimal.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS.

- [ ] **Step 5: Committe den Transformkern**

  ```bash
  rtk git -c core.fsmonitor=false add packages/core/src/exact/transform.ts packages/core/src/exact/transform.test.ts
  rtk git -c core.fsmonitor=false commit -m "feat: preserve exact transform sequences"
  ```

---

### Task 8: RFC-8785-Kanonisierung und owner-freie Paint-Projektion

**Agent ownership:** Nur `packages/core/src/exact/canonical-json.ts`, `packages/core/src/exact/normalized-paint.ts` und deren Tests.

**Files:**
- Create: `packages/core/src/exact/canonical-json.ts`
- Create: `packages/core/src/exact/canonical-json.test.ts`
- Create: `packages/core/src/exact/normalized-paint.ts`
- Create: `packages/core/src/exact/normalized-paint.test.ts`

**Interfaces:**
- Consumes: Exact-IR aus Task 1, Pfadserializer aus Task 6 und Transformserializer aus Task 7.
- Produces: `canonicalJson(value): string`, `canonicalJsonUtf8(value): Uint8Array`, `NormalizedPaintRecord`, `NormalizedPaintListV1`, `NonPaintingInventoryV1`, `OwnedPaintIndexV1`, `canonicalizeExactColor(value)`, `defineNormalizedPaintList(viewBox, records)`, `normalizeReferenceExactDrawing(drawing)`, `buildOwnedPaintIndex(drawing, paintRecordDigests)`.

- [ ] **Step 0: Lege zuerst beide compile-sicheren Produktionsstubs an**

  Erzeuge `canonical-json.ts` und `normalized-paint.ts` mit sämtlichen Signaturen. `canonicalJson` gibt vorerst `'null'` zurück, `canonicalJsonUtf8` dessen Bytes; die Paint-Funktionen werfen `RED: paint normalization not implemented`. Belege mit `rtk mise exec -- pnpm typecheck`, dass beide Testimports funktionieren, bevor Tests entstehen.

- [ ] **Step 1: Schreibe RED für Canonical JSON**

  ```ts
  import { describe, expect, it } from 'vitest';
  import { canonicalJson, canonicalJsonUtf8 } from './canonical-json.js';

  describe('RFC-8785-JCS-UTF8', () => {
    it('sortiert Objektschlüssel rekursiv und erhält Arrayreihenfolge', () => {
      expect(canonicalJson({ z: [3, { b: 2, a: 1 }], a: '€' }))
        .toBe('{"a":"€","z":[3,{"a":1,"b":2}]}');
      expect([...canonicalJsonUtf8('€')]).toEqual([34, 226, 130, 172, 34]);
    });

    it('verwendet ECMAScript-Zahlserialisierung und weist Nicht-JCS-Werte ab', () => {
      expect(canonicalJson({ n: 1e30, zero: -0 })).toBe('{"n":1e+30,"zero":0}');
      expect(() => canonicalJson({ n: Number.NaN })).toThrow(/finite/);
      expect(() => canonicalJson({ missing: undefined })).toThrow(/undefined/);
      expect(() => canonicalJson(new Date())).toThrow(/plain/);
    });

    it('besteht die RFC-8785-Serialisierungsvektoren', () => {
      expect(canonicalJson({
        numbers: [333333333.33333329, 1e30, 4.5, 2e-3, 1e-27],
        string: "€$\u000f\nA'B\"\\\\\"/",
        literals: [null, true, false],
      })).toBe(
        '{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],"string":"€$\\u000f\\nA\'B\\\"\\\\\\\"/"}',
      );
    });

    it('sortiert Property-Namen nach UTF-16-Codeunits, nicht Codepoints oder Locale', () => {
      const value = { '\ufb33': 7, '😀': 6, '€': 5, 'ö': 4, '\u0080': 3, '1': 2, '\r': 1 };
      expect(Object.keys(JSON.parse(canonicalJson(value))))
        .toEqual(['\r', '1', '\u0080', 'ö', '€', '😀', '\ufb33']);
    });

    it('escaped Controls deterministisch und weist ungültige Unicode-Scalars ab', () => {
      expect(canonicalJson('\b\t\n\f\r\u0000\u001f\\\"'))
        .toBe('"\\b\\t\\n\\f\\r\\u0000\\u001f\\\\\\\""');
      expect(() => canonicalJson('\ud800')).toThrow(/surrogate|unicode/i);
      expect(() => canonicalJson('\udc00')).toThrow(/surrogate|unicode/i);
      expect(() => canonicalJson({ ['bad\ud800']: true })).toThrow(/surrogate|unicode/i);
    });
  });
  ```

  Ergänze für dieselbe `ExactTransformSequence` wie in Task 1 einen unabhängig fest codierten JCS-String und dessen bekannten SHA-256. `canonicalJsonUtf8(sequence)` muss exakt diese Bytes liefern und `exactTransformSequenceDigest(sequence)` exakt den dazugehörigen Digest; damit ist der enge Schemahelper nachweislich kein alternatives Serialisierungsformat.

- [ ] **Step 2: Schreibe RED für Paint-Liste und getrennten Owner-Index**

  Baue zwei Zeichnungen mit identischer Geometrie, aber anderen IDs, Rollen und Ownern. Die Paint-Liste muss gleich sein, der Owner-Index nicht. Vertausche danach die Leaves, Transformreihenfolge, Fill-Rule und Compound-Subpaths jeweils separat und erwarte Ungleichheit:

  ```ts
  const first = normalizeReferenceExactDrawing(drawing('node:a', 'kind:formation'));
  const second = normalizeReferenceExactDrawing(drawing('node:b', 'kind:person'));
  expect(first.paintList).toEqual(second.paintList);
  const paintDigest = sha256Digest('a'.repeat(64));
  expect(buildOwnedPaintIndex(drawing('node:a', 'kind:formation'), [paintDigest]))
    .not.toEqual(buildOwnedPaintIndex(drawing('node:b', 'kind:person'), [paintDigest]));
  ```

  Prüfe zusätzlich, dass verschachtelte Gruppen depth-first in Dokumentreihenfolge flach werden und deren Transformfolgen als `outer transforms` gefolgt von `inner transforms` im Paint-Record erscheinen.

- [ ] **Step 3: Führe gemeinsames RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/exact/canonical-json.test.ts packages/core/src/exact/normalized-paint.test.ts`

  Expected: FAIL an der rekursiven Sortier-/RFC-8785-Assertion (`'null'` statt kanonischem Objekt) und an der Paint-Projection-Assertion (`RED: paint normalization not implemented`); beide Module importieren und typechecken bereits.

- [ ] **Step 4: Implementiere den JCS-Serializer**

  Serialisiere `null`, Boolean, String und endliche Number über die ECMAScript-/JSON-Regeln; sortiere Plain-Object-Keys lexikographisch nach **rohen UTF-16-Codeunits** und erhalte Arrays. Implementiere und pinne die RFC-8785-Zahl-/Stringvektoren, Escapeverhalten für `U+0000` bis `U+001F`, Quote und Backslash. Validiere jeden Stringwert und jeden Property-Namen vor Serialisierung auf wohlgeformte Surrogatpaare; ein isoliertes High-/Low-Surrogat ist ein harter Fehler und darf nicht von `JSON.stringify` escaped oder von `TextEncoder` zu U+FFFD ersetzt werden. Weise außerdem Sparse Arrays, `undefined`, Funktionen, Symbole, BigInt, Nicht-Plain-Objects, Zyklen und nicht endliche Zahlen ab. `canonicalJsonUtf8` verwendet nach dieser Validierung genau `new TextEncoder().encode(canonicalJson(value))`.

- [ ] **Step 5: Implementiere NormalizedPaintList/v1**

  `canonicalizeExactColor` akzeptiert ausschließlich solide `#rgb`, `#rgba`, `#rrggbb` oder `#rrggbbaa` und liefert lowercase `#rrggbbaa`; `none` bleibt ein separater Non-Painting-Grund. `defineNormalizedPaintList` validiert und friert eine bereits owner-freie Folge. Sowohl `normalizeReferenceExactDrawing` als auch der Oracle-Parser aus Task 20 müssen genau diese Factory benutzen, damit es keinen zweiten Paint-Listenalgorithmus gibt.

  `normalizeReferenceExactDrawing` validiert zuerst Task 1 und gibt zurück:

  ```ts
  interface NormalizedPaintProjection {
    readonly paintList: {
      readonly version: 'NormalizedPaintList/v1';
      readonly viewBox: ExactViewBox;
      readonly records: readonly NormalizedPaintRecord[];
    };
    readonly nonPainting: {
      readonly version: 'NonPaintingInventory/v1';
      readonly records: readonly [];
    };
  }
  ```

  Jeder Paint-Record enthält nur Primitive/Geometrie, `fill`, `fillRule` und die zusammengeführte `ExactTransformSequence`; er enthält ausdrücklich weder Node-ID, Rolle, Owner, Titel noch Beschreibung. Rechteck und Kreis bleiben Primitive, Pfade behalten ihr geordnetes Commandarray. Gruppen werden depth-first abgeflacht. Weil die öffentliche Exact-IR nur sichtbare Leaves zulässt, ist ihr Non-Painting-Inventar leer; der Oracle-Parser liefert später das echte getrennte Inventar.

  `buildOwnedPaintIndex` verlangt exakt einen SHA-256-Digest je Paint-Record und erzeugt in ordinaler Reihenfolge `{ ordinal, paintRecordDigest, nodeId, owner, role }`. Zu wenige, zu viele oder formal ungültige Digests sind Fehler.

- [ ] **Step 6: Führe GREEN aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/exact/canonical-json.test.ts packages/core/src/exact/normalized-paint.test.ts packages/schema/src/exact-ir.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; eine reine Owneränderung verändert nur `OwnedPaintIndex/v1`.

- [ ] **Step 7: Committe Kanonisierung und Paint-Projektion gemeinsam**

  ```bash
  rtk git -c core.fsmonitor=false add packages/core/src/exact/canonical-json.ts packages/core/src/exact/canonical-json.test.ts packages/core/src/exact/normalized-paint.ts packages/core/src/exact/normalized-paint.test.ts
  rtk git -c core.fsmonitor=false commit -m "feat: normalize exact paint records"
  ```

---

### Task 9: CompositionPlan atomar zu Drawing und Trace materialisieren

**Agent ownership:** Nur `packages/core/src/exact/materialize.ts` und dessen Test.

**Files:**
- Create: `packages/core/src/exact/materialize.ts`
- Create: `packages/core/src/exact/materialize.test.ts`

**Interfaces:**
- Consumes: Plan-/Fragment-/Trace-Typen aus Task 2 und Paint-IR aus Task 1.
- Produces: `ExactMaterializationRegistry`, `materializeExactComposition(plan, registry): UnfinalizedExactCompositionResult<ReferenceExactDrawing>`, `projectDisplayComposition(display, exactAssetResult): UnfinalizedExactCompositionResult<ReferenceExactDrawing>`.

  ```ts
  export interface ExactMaterializationRegistry {
    readonly fragments: ReadonlyMap<ReferenceExactFragmentKey, ReferenceExactFragment>;
    readonly variants: ReadonlyMap<ExactComponentVariantKey, ExactComponentVariant>;
  }
  ```

  `fragments` ist der disjunkte, kanonisch sortierte Lookup über Component-Fragmente und assetspezifische Fragmente. Die Shard-Speicherorte bleiben getrennt; der Materializer kennt diese Ablagegrenze nicht und kann daher auch `componentFamily: null`-Assets über denselben Pfad materialisieren.

- [ ] **Step 0: Lege zuerst den compile-sicheren Produktionsstub an**

  Erzeuge `materialize.ts` mit der finalen Signatur; beide Funktionen werfen vorerst `RED: atomic materialization not implemented`. `rtk mise exec -- pnpm typecheck` muss grün sein, bevor der Test geschrieben wird. Der Stub erzeugt insbesondere keine halb gültige Drawing-/Trace-Kombination.

- [ ] **Step 1: Schreibe RED für atomare Ausgabe und Identität**

  ```ts
  import { describe, expect, it } from 'vitest';
  import { materializeExactComposition } from './materialize.js';

  it('erzeugt Drawing und Trace aus derselben geordneten Instanzliste', () => {
    const result = materializeExactComposition(plan, registry);
    expect(result.drawing.children.map((node) => node.id)).toEqual([
      'instance:body/node:white', 'instance:body/node:outline',
    ]);
    expect(result.trace.nodes.map((node) => node.traceNode)).toEqual(['instance:body']);
    expect(result.trace.nodes[0]?.transforms).toBe(plan.instances[0]?.transforms);
    expect(result.trace.nodes[0]?.oracleWitness).toBe(plan.instances[0]?.oracleWitness);
  });

  it('verwirft Drawing und Trace gemeinsam bei Owner-/Varianten-Drift', () => {
    expect(() => materializeExactComposition(plan, registryWithWrongOwner)).toThrow(/owner/);
  });

  it('projiziert Displaytrace ohne eine zweite Displaygeometrie', () => {
    const asset = materializeExactComposition(assetPlan, registry);
    const display = projectDisplayComposition(displayFixture, asset);
    expect(display.drawing).toBe(asset.drawing);
    expect(display.trace.target).toBe(displayFixture.key);
    expect(display.trace.projectedFrom).toBe(displayFixture.exactAsset);
    expect(display.trace.nodes[0]?.oracleWitness).toBe(asset.trace.nodes[0]?.oracleWitness);
  });
  ```

  Die Testfixtures sind vollständige Literale: ein Component-Fragment mit zwei Leaves, eine registrierte Variante und ein Plan. Ergänze Fälle für unbekanntes Fragment, unbekannte Variante, doppelten materialisierten Node-Key, falschen assetspezifischen Owner und abweichende Plan-/Fragment-ViewBox ohne expliziten Transform.

- [ ] **Step 2: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/exact/materialize.test.ts`

  Expected: FAIL an der ersten atomaren Materialisierungsassertion mit `RED: atomic materialization not implemented`; Import und Typecheck sind bereits grün.

- [ ] **Step 3: Implementiere eine einzige materialisierende Schleife**

  Validiere Plan und Registry vollständig vor Ausgabe. Löse jede Instanz in Arrayreihenfolge auf, prüfe Component-Owner gegen registrierte Variante beziehungsweise assetspezifischen Owner gegen Asset/Purpose und präfixe jeden Leaf-/Group-Key deterministisch mit `${instanceKey}/`. Instanztransforms werden als äußere Gruppe erhalten und nie in Koordinaten gebacken.

  Erzeuge Trace-Node und Drawing-Knoten im selben Schleifendurchlauf. Die Trace-Node referenziert dasselbe immutable Transformarray (`toBe`, nicht nur `toEqual`) wie der Plan und bei Component-Instanzen auch exakt dasselbe rekursiv eingefrorene `oracleWitness`-Objekt. Der Witness bleibt vollständig: `oracleAsset`, `oracleAssetDigest`, `oraclePart`, `fixtureToPart`, `fixtureToPartDigest` und `occurrenceKey` dürfen nicht reduziert werden. Tritt ein Fehler auf, wirft die Funktion vor Rückgabe; es existiert kein separater `drawingOfPlan`-/`traceOfPlan`-Pfad.

  Friere das Ergebnis rekursiv ein. Der Trace trägt `version: 'CompositionTrace/v1'`, Plan-/Target-Key und die geordneten Instanznachweise; das Core-Ergebnis enthält ausdrücklich **kein Digestfeld**. `projectDisplayComposition` akzeptiert nur eine DisplayFixture, deren `exactAsset` dem Assettarget entspricht, reicht exakt dasselbe Drawing und dieselben Trace-Node-/Witness-Referenzen weiter und ergänzt lediglich `target: display.key`/`projectedFrom`. Eine DisplayFixture ohne erfolgreich projizierbaren Trace ist ungültig. Digests werden erst aus dieser gemeinsam erzeugten Ausgabe im lokalen CLI-Conformance-Layer berechnet.

- [ ] **Step 4: Führe GREEN aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/exact/materialize.test.ts packages/core/src/exact/normalized-paint.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS.

- [ ] **Step 5: Committe die atomare Materialisierung**

  ```bash
  rtk git -c core.fsmonitor=false add packages/core/src/exact/materialize.ts packages/core/src/exact/materialize.test.ts
  rtk git -c core.fsmonitor=false commit -m "feat: materialize exact plans atomically"
  ```

---

### Task 10: Exact-SVG und LayeredDrawing ohne Millimeter-Roundtrip rendern

**Agent ownership:** Nur `packages/core/src/render/exact-svg.ts`, dessen Test, `packages/core/src/render/svg.ts`, dessen bestehender Test, den bereits vorhandenen einzigen Dienst `packages/core/src/render/raster-dimensions.ts` samt Test und `packages/core/src/index.ts`.

**Files:**
- Create: `packages/core/src/render/exact-svg.ts`
- Create: `packages/core/src/render/exact-svg.test.ts`
- Modify: `packages/core/src/render/raster-dimensions.ts`
- Modify: `packages/core/src/render/raster-dimensions.test.ts`
- Modify: `packages/core/src/render/svg.ts`
- Modify: `packages/core/src/render/svg.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: Tasks 1, 6–9 und den bestehenden semantischen SVG-Renderer.
- Produces: `renderReferenceExactSvg(drawing, options): string`, `renderReferenceExactBody(drawing): string`, erweitertes `renderSvg(drawing: RenderableDrawing, options?: SvgOptions): string`, sowie die **eine** erweiterte Funktion `rasterDimensionsForWidth(viewBox: Drawing['viewBox'] | ExactViewBox, widthPx: number): RasterDimensions`; öffentliche Exporte aller `core/src/exact/*`-Module.

- [ ] **Step 0: Lege zuerst Renderer-Stub und compile-sicheren Dispatch an**

  Erzeuge `exact-svg.ts` mit den finalen Signaturen und `throw new Error('RED: exact SVG rendering not implemented')`. Erweitere die äußere `renderSvg`-Signatur bereits compile-sicher auf `RenderableDrawing`, aber leite semantic `Drawing` unverändert auf den bestehenden Pfad und Exact-/Layered-Werte vorerst auf den Stub. Exportiere die neuen Namen und führe `rtk mise exec -- pnpm typecheck` aus. Erst danach werden Tests ergänzt; bestehende semantische Tests müssen dabei bereits grün bleiben.

- [ ] **Step 1: Schreibe einen nativen Exact-SVG-Vertrag als RED**

  ```ts
  import { describe, expect, it } from 'vitest';
  import { renderReferenceExactSvg } from './exact-svg.js';

  it('serialisiert native Referenzeinheiten, Pfade und Transformfolge unverändert', () => {
    const svg = renderReferenceExactSvg(exactDrawing, { size: 64, idPrefix: 'case' });
    expect(svg).toContain('viewBox="0 0 90.709 90.709"');
    expect(svg).toContain('width="64" height="64"');
    expect(svg).toContain('d="M 88.583 74.41 L 2.126 74.41');
    expect(svg).toContain('transform="translate(1.5 0) rotate(45 10 10)"');
    expect(svg).not.toContain('scale(2.8346');
    expect(svg).not.toContain('<text');
  });
  ```

  Ergänze Tests für nichtquadratische 48×32-ViewBox, Rechteck/Kreis/Compound-Path, `evenodd`, A11y-Metadaten und escaping.

- [ ] **Step 2: Pinne Dispatch, einzige Rasterdimension-Funktion und Bytekompatibilität des Altpfads vor Änderung**

  Ergänze in `render/svg.test.ts`:

  ```ts
  it('lässt den semantischen Drawing-Pfad bytegleich', () => {
    expect(renderSvg(existingDrawing, { size: 64, idPrefix: 'stable' }))
      .toBe(existingSemanticSvgLiteral);
  });

  it('wendet beim LayeredDrawing overlayToExact genau einmal an', () => {
    const svg = renderSvg(layeredFixture, { size: 64 });
    expect(svg.match(/transform="scale\(2\.83465625 2\.83465625\)"/g)).toHaveLength(1);
    expect(svg).toContain('data-claim="not-reference-identical"');
  });
  ```

  Der erwartete Alt-SVG-String ist ein festes Literal aus dem bestehenden Test, nicht durch `renderSvg` selbst erzeugt.

  Ergänze in `raster-dimensions.test.ts` denselben bestehenden Number-Vertrag unverändert und Exact-ViewBoxes als echte `ExactDecimal`-Literale: `48 × 32` bei Breite 96 ergibt `96 × 64`, `32 × 46` bei Breite 16 ergibt nach exakt derselben Resvg-Regel `16 × 23`, und `90.709 × 90.709` bleibt quadratisch. Ein Wert oberhalb `Number.MAX_SAFE_INTEGER`, eine nichtkanonische Dezimalform und ein nichtpositiver Exact-Wert scheitern. Der Test importiert ausschließlich `rasterDimensionsForWidth`; ein Export oder Name `exactRasterDimensionsForWidth` ist ausdrücklich verboten.

- [ ] **Step 3: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/render/exact-svg.test.ts packages/core/src/render/svg.test.ts`

  Expected: FAIL verhaltensbezogen ausschließlich für Exact-/Layered-Fixtures mit `RED: exact SVG rendering not implemented`; die bestehende semantische Bytefixture bleibt grün, Imports und Typecheck ebenfalls.

- [ ] **Step 4: Implementiere den Exact-Serializer**

  `exact-svg.ts` validiert die Drawing-IR, serialisiert ViewBoxwerte und Geometrie direkt als ExactDecimal, nutzt Task 6/7 für Pfad und Transform und gibt `fill`/`fill-rule` stets explizit aus. Es gibt keinen Import von `mmToUnits`, `formatUnits`, Textpolitik, Font oder Theme.

  Für `size` ruft der Serializer ausschließlich den bestehenden, in dieser Aufgabe erweiterten `rasterDimensionsForWidth` auf. Dessen Number-Zweig bleibt byte-/verhaltensgleich; der ExactDecimal-Zweig skaliert beide Dezimalwerte auf BigInt-Koeffizient plus Zehnerpotenz und berechnet `ceil(widthPx * height / width)` durch ganzzahlige Division mit Rest. Es existiert weder `exactRasterDimensionsForWidth` noch eine CLI-/Part-Kopie dieser Berechnung; Task 13 und die Integration erweitern/verwenden denselben Dienst. `preserveAspectRatio="xMidYMid meet"` wird explizit gesetzt.

- [ ] **Step 5: Erweitere den bestehenden Renderer um diskriminierten Dispatch**

  Ändere nur die äußere Signatur zu `RenderableDrawing`; kapsle den bisherigen semantischen Body so, dass dessen Ausgabe unverändert bleibt. Dispatch:

  ```ts
  if ('kind' in drawing && drawing.kind === 'reference-exact') return renderReferenceExactSvg(drawing, options);
  if ('kind' in drawing && drawing.kind === 'layered') return renderLayeredSvg(drawing, options);
  return renderSemanticSvg(drawing, options);
  ```

  Da bestehende `Drawing`s kein `kind` tragen, muss die Narrowing-Funktion fehlendes `kind` als semantisch behandeln. `renderLayeredSvg` prüft jede Exact-Layer-ViewBox feldweise gegen die gemeinsame ViewBox, serialisiert den Exact-Body direkt und legt den semantischen Overlay-Body unter genau eine mit `overlayToExact` serialisierte Gruppe. `theme` darf nur den Generated-Overlay verändern, niemals Exact-Farben.

- [ ] **Step 6: Exportiere alle fertigen Core-Foundationmodule**

  Ergänze in `packages/core/src/index.ts` Exporte für `exact/decimal`, `exact/path`, `exact/transform`, `exact/canonical-json`, `exact/normalized-paint`, `exact/materialize` und `render/exact-svg`.

- [ ] **Step 7: Führe GREEN, Snapshot-Regressionsschutz und Typprüfung aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/render/exact-svg.test.ts packages/core/src/render/raster-dimensions.test.ts packages/core/src/render/svg.test.ts packages/catalog/src/snapshots.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; sämtliche bestehenden Katalog-SVG-Snapshots bleiben ohne Update grün.

- [ ] **Step 8: Committe Renderer und öffentliche Core-Fassade**

  ```bash
  rtk git -c core.fsmonitor=false add packages/core/src/render/exact-svg.ts packages/core/src/render/exact-svg.test.ts packages/core/src/render/raster-dimensions.ts packages/core/src/render/raster-dimensions.test.ts packages/core/src/render/svg.ts packages/core/src/render/svg.test.ts packages/core/src/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat: render exact and layered drawings"
  ```

---

### Task 11: Vollständige Mengen-, Registry- und Ownership-Invarianten

**Agent ownership:** Nur `packages/core/src/conformance/inventory.ts`, dessen Test und die Exportzeile im Core-Index.

**Files:**
- Create: `packages/core/src/conformance/inventory.ts`
- Create: `packages/core/src/conformance/inventory.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: Manifest-, Fixture-, Case-, Ownership- und UseEdge-Typen sowie den schema-neutralen `ReferenceComponentContextSetV1` aus Tasks 2–4. Der spätere Catalog übergibt den Task-18-Wert und dessen getrennt projizierte öffentliche Paarmenge als Daten; Core importiert nie aus Catalog.
- Produces: `EXACT_REFERENCE_BASELINE`, `ConformanceInventoryInput`, `ConformanceViolation`, `conformanceInventoryIssues(input)`, `assertCompleteConformanceInventory(input)`.

- [ ] **Step 0: Lege zuerst den compile-sicheren Inventory-Stub an**

  Erzeuge `inventory.ts` mit Baseline, Interfaces und einem `conformanceInventoryIssues`-Stub, der genau `red-not-implemented` liefert; `assertCompleteConformanceInventory` wirft denselben Befund. Exportiere es im Core-Index und führe `rtk mise exec -- pnpm typecheck` grün aus, bevor der Test entsteht.

- [ ] **Step 1: Schreibe einen kleinen vollständigen Positivgraphen und gezielte Mutationen**

  Erzeuge in `inventory.test.ts` eine eigenständige Zwei-Asset-Fixture mit zwei ExactAssets, zwei AssetCases, einem Whole- und einem Part-Display, zwei Components, ihren Fixtures, **je genau einem ComponentCase**, Parts, UseEdges, ContractCases, `compositionWitnessEdges` sowie vollständigem Ownership-Manifest. Der erwartete Vertrag wird für diesen Unit-Test explizit mit `expectedCounts` und `expectedSets` übergeben.

  ```ts
  expect(conformanceInventoryIssues(completeFixture())).toEqual([]);

  expect(conformanceInventoryIssues(withoutExactAsset()).map((v) => v.code))
    .toContain('oracle-without-exact-asset');
  expect(conformanceInventoryIssues(withDuplicateComponentKey()).map((v) => v.code))
    .toContain('duplicate-component-key');
  expect(conformanceInventoryIssues(withComponentOwnerButNoUseEdge()).map((v) => v.code))
    .toContain('component-leaf-without-use-edge');
  expect(conformanceInventoryIssues(withUseEdgeOnAssetSpecificLeaf()).map((v) => v.code))
    .toContain('asset-specific-leaf-with-use-edge');
  expect(conformanceInventoryIssues(withRepeatedAssetSpecificFingerprint()).map((v) => v.code))
    .toContain('reused-asset-specific-fragment');
  ```

  Ergänze Mutationen für gleiche Anzahl bei vertauschtem Keyset, Ownership-Eintrag ohne Record, Record ohne Ownership, Component-Semantik als assetspezifisch, fehlenden Referenzzeugen, fehlende ComponentFixture, fehlenden/duplizierten ComponentCase, ComponentCase auf fremde Fixture, fehlenden Contract-Witness, überlappende Whole-/Part-Displays und unbekannte Fixture-/Part-Enden. Die kleine Fixture liefert außerdem ein explizites totales `ReferenceComponentContextSet/v1`, dessen öffentliche Projektion exakt ihrem `ReachableBuilderContextSet/v1` entspricht. Mutationen entfernen oder duplizieren ein Total-Paar, fügen ein Extra-Paar ein und markieren ein `reference-only`-/`direct-carrier`-Paar fälschlich als öffentlich; jede Mutation erhält einen eigenen stabilen Violation-Code.

- [ ] **Step 2: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/conformance/inventory.test.ts`

  Expected: FAIL an `completeFixture()`, weil der compile-sichere Stub `red-not-implemented` statt `[]` liefert.

- [ ] **Step 3: Implementiere Mengenvergleiche statt Summenvergleiche**

  Setze die vollständige Baseline als unveränderlichen Wert:

  ```ts
  export const EXACT_REFERENCE_BASELINE = Object.freeze({
    oracleAssets: 661,
    exactAssetFixtures: 661,
    assetCases: 661,
    displayFixtures: 544,
    wholeDisplays: 525,
    partDisplays: 19,
    paintComponents: 413,
  });
  ```

  `ConformanceInventoryInput` trennt `expectedCounts`/`expectedSets` vom tatsächlichen Bestand. Jede Prüfung vergleicht sowohl Kardinalität als auch exakte Menge/Multimenge. Meldungen sind nach `code`, dann `key` sortiert und enthalten die fehlenden beziehungsweise unerwarteten Keys.

  Prüfe alle Invarianten aus Spezifikation §4, insbesondere Bijektion OracleAsset↔ExactAsset, `set(AssetCase.exactAsset) = set(ExactAssetFixture.key)`, `set(DisplayCase.displayFixture) = set(DisplayFixture.key)`, **`set(ComponentCase.componentFixture) = set(ComponentFixture.key)`**, `set(CompositionContractCase.contract) = set(CompositionContractRegistry.key)`, Display↔CoverageManifest, Component↔UseEdge, Ownership-Multimenge und assetspezifische Allowlist. Für Components ist die erwartete Zielmenge ausschließlich die totale, `(component,context,contract)`-projizierte `ReferenceComponentContextSet/v1`-Paarmenge: ComponentFixtures, Varianten, konkrete CompositionContracts, ComponentCases und mindestens eine CompositionWitnessEdge pro Paar müssen exakt darauf schließen, ohne missing/extra/duplicate Pair. Die `public-builder`-Projektion dieser Totalmenge muss separat exakt der `ReachableBuilderContextSet/v1`-Paarmenge entsprechen; `reference-only` und `direct-carrier` sind dazu disjunkt und dürfen nie einen `representativeSpec`/`proofPath` besitzen oder durch Builderauflösung erscheinen. Kein Test vergleicht die disjunkten `case:*`-/`contract-case:*`-Keysets direkt mit ihren Ziel-Keysets. Die drei Case-Arten müssen getrennt vollständig und in ihrer kanonischen `ConformanceCaseKey`-Union duplikatfrei sein. Ein `OracleOwnershipManifestDraft` erzeugt immer `ownership-manifest-not-final`; nur `status: 'final'` darf weitergeprüft werden. Für `asset-specific` wird der `reuseFingerprint` über den gesamten Input gezählt; Anzahl ungleich eins oder ein Fingerprint mit registrierter Component-Semantik ist ein Fehler.

  `assertCompleteConformanceInventory` ruft denselben Prüfer und wirft eine aggregierte Meldung; es besitzt keinen Allow-/Skip-/Warn-Modus.

- [ ] **Step 4: Exportiere und führe GREEN aus**

  Ergänze `export * from './conformance/inventory.js';`.

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/conformance/inventory.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; die Mutation mit korrekter Anzahl, aber falschem Keyset bleibt rot.

- [ ] **Step 5: Committe die Inventargates**

  ```bash
  rtk git -c core.fsmonitor=false add packages/core/src/conformance/inventory.ts packages/core/src/conformance/inventory.test.ts packages/core/src/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat: enforce exact inventory invariants"
  ```

---

### Task 12: UseEdges ableiten und Abhängigkeiten transitiv invalidieren

**Agent ownership:** Nur `packages/core/src/conformance/graph.ts`, dessen Test und der Core-Indexexport.

**Files:**
- Create: `packages/core/src/conformance/graph.ts`
- Create: `packages/core/src/conformance/graph.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: `CompositionTrace`, `UseEdge`, OracleParts, Fixtures, ContractCases und WitnessEdges aus dem Schema.
- Produces: `deriveUseEdges(traces): readonly UseEdge[]`, `buildConformanceGraph(input): ConformanceGraph`, `graphIssues(graph)`, `invalidateDependents(graph, changed): readonly string[]`.

- [ ] **Step 0: Lege zuerst den compile-sicheren Graph-Stub an**

  Erzeuge `graph.ts` mit den finalen Signaturen; `deriveUseEdges` gibt vorerst `[]`, `graphIssues` `[{code:'red-not-implemented', ...}]`, der Builder einen typkompatiblen leeren Graphen und die Invalidation `[]` zurück. Exportiere das Modul und führe `rtk mise exec -- pnpm typecheck` aus, bevor der Test geschrieben wird.

- [ ] **Step 1: Schreibe RED für Ableitung und Rückwärtsreichweite**

  ```ts
  import { describe, expect, it } from 'vitest';
  import { buildConformanceGraph, deriveUseEdges, invalidateDependents } from './graph.js';

  it('leitet UseEdges ausschließlich aus component-Trace-Nodes mit OracleWitness ab', () => {
    expect(deriveUseEdges([traceWithComponentAndAssetSpecific])).toEqual([{
      key: 'use:asset:fixture.svg/instance:body/part:fixture#body',
      component: 'kind:formation', fixture: 'asset:fixture.svg',
      oracleAsset: 'oracle:fixture.svg', oraclePart: 'part:fixture#body',
      traceNode: 'instance:body', fixtureToPart: [],
    }]);
  });

  it('invalidiert von Component über Fixture, Asset und Display bis zum Attest', () => {
    const graph = buildConformanceGraph(graphFixture);
    expect(invalidateDependents(graph, ['component:kind:formation'])).toEqual([
      'asset:fixture.svg', 'attestation:asset:fixture.svg',
      'component-fixture:formation', 'display:fixture#primary',
    ]);
  });

  it('leitet aus der Displayprojektion eine eigene Kante ohne Displaygeometrie ab', () => {
    expect(deriveUseEdges([assetTrace, projectedDisplayTrace]).map((edge) => edge.fixture))
      .toEqual(['asset:fixture.svg', 'display:fixture#primary']);
    expect(projectedDisplayTrace.nodes[0]?.oracleWitness)
      .toBe(assetTrace.nodes[0]?.oracleWitness);
  });
  ```

  Ergänze einen Diamantgraphen, einen Zyklusnegativfall, unbekannte Kantenenden, doppelte Kanten und eine WitnessEdge, deren materialisierte Transformfolge vom Contract abweicht.

- [ ] **Step 2: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/conformance/graph.test.ts`

  Expected: FAIL an der erwarteten Component-UseEdge (`[]` aus dem compile-sicheren Stub); Import und Typecheck sind grün.

- [ ] **Step 3: Implementiere deterministische Ableitung und Graphaufbau**

  `deriveUseEdges` besucht Asset-, Component- und projizierte Display-Traces in kanonischer Target-/Node-Reihenfolge. Es ignoriert ausschließlich `asset-specific`; ein Component-Trace ohne den **vollständigen** `oracleWitness` ist ein Fehler statt einer ausgelassenen Kante. Asset-, Component- und Displaytarget erzeugen jeweils eigene UseEdges; die Displaykante stammt aus `projectDisplayComposition`, nicht aus einer zweiten Displaygeometrie oder Handzuordnung. Der UseEdge übernimmt `oracleAsset`, `oraclePart` und exakt die `fixtureToPart`-Folge aus dem Witness, validiert deren Digest und bildet den Key aus Fixture, TraceNode und OraclePart.

  `buildConformanceGraph` erzeugt gerichtete Abhängigkeiten von Quelle zu Verbraucher: Component→ComponentFixture/Plan→Asset/Display/Part→Case→Attestation sowie Contract→Witness→betroffene Fixture. Es validiert beide Enden, Eindeutigkeit, Azyklizität und Contract-Witness-Gleichheit von Transform, Frame, Anker und Zone.

  `invalidateDependents` traversiert ausschließlich rückwärts erreichbare Verbraucher, dedupliziert und gibt kanonisch sortierte Schlüssel zurück. Es mutiert weder Attestations noch Graph.

- [ ] **Step 4: Exportiere und führe GREEN aus**

  Ergänze `export * from './conformance/graph.js';`.

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/conformance/graph.test.ts packages/core/src/conformance/inventory.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS.

- [ ] **Step 5: Committe den Graphkern**

  ```bash
  rtk git -c core.fsmonitor=false add packages/core/src/conformance/graph.ts packages/core/src/conformance/graph.test.ts packages/core/src/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat: derive exact conformance graph"
  ```

---

### Task 13: OraclePart, ComparisonProfile und Isolation rein auflösen

**Agent ownership:** Nur `packages/core/src/conformance/coverage.ts`, `packages/core/src/conformance/parts.ts`, deren Tests und der Core-Indexexport.

**Files:**
- Create: `packages/core/src/conformance/parts.ts`
- Create: `packages/core/src/conformance/parts.test.ts`
- Create: `packages/core/src/conformance/coverage.ts`
- Create: `packages/core/src/conformance/coverage.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: OraclePart, UseEdge, ComparisonProfile, MaskContract und rationale Exact-Viewporttypen aus Tasks 1 und 3 sowie ausschließlich `rasterDimensionsForWidth` aus Task 10.
- Produces: `ExactCoverageEnvelope`, `paintCoverageEnvelope(record)`, `coverageEnvelopesDisjoint(a,b)`, `OraclePaintRecordInfo`, `SourceNodeSetIsolationProof`, `UnfinalizedResolvedMaskContract`, `ResolvedPartProjection`, `resolveMaskForRaster(mask,width)`, `resolvePartProjection(part, useEdge, profiles, masks, oracleRecords, raster)`, `partIsolationIssues(projection)`.

- [ ] **Step 0: Lege zuerst beide compile-sicheren Produktionsstubs an**

  Erzeuge `coverage.ts` und `parts.ts` mit den finalen Signaturen. Die Coverage-Funktion liefert vorerst `{ status: 'unknown', reason: 'RED: coverage not implemented' }`; `resolveMaskForRaster` und `resolvePartProjection` werfen `RED: part projection not implemented`. Exportiere beide Module und führe `rtk mise exec -- pnpm typecheck` erfolgreich aus, bevor Tests entstehen.

- [ ] **Step 1: Schreibe RED für die einzige Frame-/Maskenquelle**

  ```ts
  import { describe, expect, it } from 'vitest';
  import { partIsolationIssues, resolvePartProjection } from './parts.js';

  it('bezieht Frame und Maske ausschließlich aus dem aufgelösten Profil', () => {
    const resolved = resolvePartProjection(part, edge, profiles, masks, oracleRecords, {
      width: 32, background: 'transparent',
    });
    expect(resolved.partFrame).toBe(profiles['profile:body'].partFrame);
    expect(resolved.maskContract).toBe(masks['mask:body']);
    expect(resolved.oracleToPart).toBe(part.oracleToPart);
    expect(resolved.fixtureToPart).toBe(edge.fixtureToPart);
    expect(resolved.resolvedMask.width).toBe(32);
    expect(resolved.resolvedMask.partToViewport).toEqual(expectedRationalMappingAt32);
  });

  it('leitet je Pflichtbreite eine eigene vollständige Viewporttransformation ab', () => {
    const at16 = resolveMaskForRaster(masks['mask:body'], 16);
    const at4096 = resolveMaskForRaster(masks['mask:body'], 4096);
    expect(at16.partToViewport).not.toEqual(at4096.partToViewport);
    expect(at16.width).toBe(16);
    expect(at4096.width).toBe(4096);
  });

  it('erhält nicht terminierende Viewportskalierung ohne Dezimalapproximation', () => {
    const mapping = resolveMaskForRaster(maskWithWidth90Point709, 32).partToViewport;
    expect(mapping.a).toEqual(exactRational('32000', '90709'));
    expect(mapping.d).toEqual(exactRational('32000', '90709'));
    expect(equalExactRational(mapping.a, exactRational('32000', '90709'))).toBe(true);
    expect(JSON.stringify(mapping)).not.toContain('0.352');
  });

  it('wendet xMidYMid meet mit aufgerundeter Rasterhöhe exakt an', () => {
    const mapping = resolveMaskForRaster(mask48x32AtOrigin, 16);
    expect(mapping.height).toBe(11);
    expect(mapping.partToViewport.a).toEqual(exactRational('1', '3'));
    expect(mapping.partToViewport.d).toEqual(exactRational('1', '3'));
    expect(mapping.partToViewport.e).toEqual(exactRational('0', '1'));
    expect(mapping.partToViewport.f).toEqual(exactRational('1', '6'));
  });

  it('bindet einen nichtnulligen ViewBox-Ursprung und dessen Digest', () => {
    const shifted = resolveMaskForRaster(mask48x32ShiftedBy3AndMinus2, 16);
    expect(shifted.partToViewport.e).toEqual(exactRational('-1', '1'));
    expect(shifted.partToViewport.f).toEqual(exactRational('5', '6'));
    expect(canonicalJson(shifted.partToViewport))
      .not.toBe(canonicalJson(resolveMaskForRaster(mask48x32AtOrigin, 16).partToViewport));
  });

  it('invalidiert Selector sofort bei geändertem Assetdigest', () => {
    expect(() => resolvePartProjection(
      part, edge, profiles, masks,
      oracleRecords.map((record) => ({ ...record, oracleAssetDigest: digestB })), raster32,
    )).toThrow(/digest/);
  });

  it('verlangt leave-one-out, sobald irgendeine fremde Node nicht beweisbar einflussfrei ist', () => {
    const projection = resolvePartProjection(part, edge, profiles, masks, overlappingRecords, raster32);
    expect(partIsolationIssues(projection)).toContainEqual(
      expect.objectContaining({ code: 'source-node-set-non-influence-unproven' }),
    );
  });
  ```

  Ergänze Fälle für unbekanntes Profil, unbekannte Maske, Profile-/Masken-Frame-Drift, leere Selector-Menge, nicht vorhandene Node, doppelte Node, falsches OracleAsset und einen gültigen `leave-one-out`-Fall.

- [ ] **Step 2: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/conformance/coverage.test.ts packages/core/src/conformance/parts.test.ts`

  Expected: FAIL an der positiven Profilauflösung mit `RED: part projection not implemented`; Imports und Typecheck sind grün.

- [ ] **Step 3: Implementiere fail-closed Profil- und Nodeauflösung**

  `paintCoverageEnvelope` ist die **eine gemeinsame**, browserneutrale Bounds-/Coverage-Projektion für Discovery und Isolation. Rechteck und Kreis erhalten exakte Hüllen; Pfade erhalten eine konservative Hülle über sämtliche End- und Kontrollpunkte jedes Subpaths. Translation, Scale und Decimal-Matrix werden per ExactDecimal-Arithmetik auf die Hülle projiziert. Eine Rotation, nicht affine/degenerierte Abbildung oder sonst nicht exakt beweisbare Situation ergibt `status: 'unknown'` statt Float-Schätzung. `coverageEnvelopesDisjoint` liefert nur dann `true`, wenn die geschlossenen Hüllen strikt disjunkt sind; Berührung, unbekannte Hülle und Masken-/Clipunsicherheit sind kein Non-Influence-Beleg. Der spätere Oracle-Parser und `conformance:inspect` verwenden genau diese Funktion; sie implementieren keine zweiten analytischen Bounds.

  `resolvePartProjection` löst `comparisonProfile` genau einmal auf, dann dessen `maskContract`; beide müssen dieselbe `ExactViewBox`-Objektstruktur tragen. Es ruft `resolveMaskForRaster(mask, raster.width)` auf. Diese Funktion bezieht `{widthPx,heightPx}` ausschließlich aus `rasterDimensionsForWidth(mask.partFrame, raster.width)` und erzeugt für **jede konkrete Zelle** eine `ExactViewportMapping/v1`. Dezimalwerte werden als Integerkoeffizient/Zehnerpotenz gelesen; Scale und Translation bleiben gekürzte `ExactRational`s. Für `xMidYMid meet` mit durch Fit-width bestimmter Skala gilt wörtlich:

  ```text
  s = widthPx / viewBox.width
  e = (widthPx  - viewBox.width  * s) / 2 - viewBox.minX * s
  f = (heightPx - viewBox.height * s) / 2 - viewBox.minY * s
  a = d = s; b = c = 0
  ```

  Jede Multiplikation, Subtraktion, Halbierung und Gleichheit erfolgt als gekürzte Rationalarithmetik/Cross-Multiplikation. Damit ergibt `48×32 @ width 16` bei `heightPx=11` exakt `f=1/6`; ein nichtnulliger Ursprung verändert `e`/`f` und zwingend `partToViewportDigest`/`resolvedMaskDigest`. Es gibt keine `ExactTransformSequence`, keinen periodischen Dezimalstring, keine Number-Näherung und keine globale `partToViewport`-Kopie. Die Rückgabe referenziert diese aufgelösten Werte, nicht Kopien vom Part oder Case. Jeder Selector muss Assetkey und SHA-256 des Parts treffen. Task 19 finalisiert Mapping und Maskenwert mit zwei SHA-256-Digests; der Task-13-Test darf dafür den Task-19-Finalizer nicht vorwärts importieren, sondern pinnt zunächst das kanonische Mapping-Digestinput, während Task 19 den oben gezeigten Digestvergleich als eigenen RED/GREEN-Fall wiederholt.

  Für `source-node-set` sortiert der Kern nicht um: Er traversiert **sämtliche** ausgewählten und fremden Paintrecords in originaler Paintreihenfolge, also auch fremde Records vor, zwischen und nach der Auswahl. Ein maschineller Proof besteht nur, wenn jede fremde Coverage-Hülle zu jeder ausgewählten strikt disjunkt ist und kein unbekannter Bounds-, Alpha-, Masken-, Clip- oder Compositingeinfluss vorliegt. Überschneidung, Berührung oder Ungewissheit erzeugt `source-node-set-non-influence-unproven`; der Part muss konservativ `leave-one-out` verwenden. Eine vermeintlich spätere Okklusion allein reicht nicht als Analyse. `leave-one-out` materialisiert deterministisch die Auswahlpaare `{ full, withoutSelected }` für Oracle und Candidate, ohne Pixelmaskenheuristik.

- [ ] **Step 4: Exportiere und führe GREEN aus**

  Ergänze `export * from './conformance/parts.js';`.

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/conformance/coverage.test.ts packages/core/src/conformance/parts.test.ts packages/schema/src/conformance.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS.

- [ ] **Step 5: Committe die Partauflösung**

  ```bash
  rtk git -c core.fsmonitor=false add packages/core/src/conformance/coverage.ts packages/core/src/conformance/coverage.test.ts packages/core/src/conformance/parts.ts packages/core/src/conformance/parts.test.ts packages/core/src/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat: resolve exact oracle parts"
  ```

---

### Task 14: RGBA-Kanonisierung, Masken und echter Null-Diff

**Agent ownership:** Nur `packages/core/src/conformance/rgba.ts`, dessen Test und der Core-Indexexport.

**Files:**
- Create: `packages/core/src/conformance/rgba.ts`
- Create: `packages/core/src/conformance/rgba.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: keine Rendererabhängigkeit; nur `Uint8Array` und Rasteroptionen aus Task 3.
- Produces: `CanonicalRgbaImage`, `RgbaBounds`, `RgbaComparisonResult`, `canonicalizeTransparentRgb(image)`, `compositeRgba(image, background)`, `applyRgbaMask(image, mask, alphaThreshold)`, `compareRgba(reference, candidate)`, `overlayRgba`, `heatmapRgba`.

- [ ] **Step 0: Lege zuerst den compile-sicheren RGBA-Stub an**

  Erzeuge `rgba.ts` mit allen finalen Typen/Signaturen. Pufferfunktionen geben vorerst unveränderte defensive Kopien zurück; `compareRgba` liefert unabhängig vom Inhalt eine formal vollständige, aber absichtlich falsche `equal: false`-Antwort. Exportiere das Modul und führe `rtk mise exec -- pnpm typecheck` grün aus, bevor der Test entsteht.

- [ ] **Step 1: Schreibe bytegenaue RED-Fixtures**

  ```ts
  import { describe, expect, it } from 'vitest';
  import {
    canonicalizeTransparentRgb, compareRgba, compositeRgba,
    heatmapRgba, overlayRgba,
  } from './rgba.js';

  const image = (pixels: number[]) => ({ width: 2, height: 1, pixels: Uint8Array.from(pixels) });

  it('setzt RGB vollständig transparenter Pixel vor Vergleich auf null', () => {
    expect([...canonicalizeTransparentRgb(image([99, 88, 77, 0, 1, 2, 3, 255])).pixels])
      .toEqual([0, 0, 0, 0, 1, 2, 3, 255]);
  });

  it('liefert alle vier Null-Diff-Metriken und exakte Bounds', () => {
    expect(compareRgba(image([0, 0, 0, 0, 1, 2, 3, 255]), image([9, 9, 9, 0, 1, 2, 3, 255])))
      .toEqual({
        equal: true, differentPixelCount: 0, maxChannelDelta: 0,
        alphaDeltaCount: 0,
        referenceBounds: { minX: 1, minY: 0, maxXExclusive: 2, maxYExclusive: 1 },
        implementationBounds: { minX: 1, minY: 0, maxXExclusive: 2, maxYExclusive: 1 },
      });
  });

  it('meldet einen einzelnen Farb- und Alphaunterschied ohne Toleranz', () => {
    const result = compareRgba(image([10, 20, 30, 255, 0, 0, 0, 0]), image([11, 20, 30, 254, 0, 0, 0, 0]));
    expect(result).toMatchObject({ equal: false, differentPixelCount: 1,
      maxChannelDelta: 1, alphaDeltaCount: 1 });
  });
  ```

  Ergänze handberechnete schwarze/weiße Alpha-Komposition, verschiedene Dimensionen, leere Bounds, binäre und antialiased Masken mit `alphaThreshold: 0` sowie deterministische Overlay-/Heatmapwerte auch für Null-Diff.

- [ ] **Step 2: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/conformance/rgba.test.ts`

  Expected: FAIL an Transparenzkanonisierung und Null-Diff-Metriken, weil der compile-sichere Stub RGB nicht nullt und stets `equal: false` meldet.

- [ ] **Step 3: Implementiere reine, nicht mutierende Pufferoperationen**

  Validierung verlangt `pixels.length === width * height * 4` und positive Ganzzahldimensionen. Transparente RGB-Kanonisierung arbeitet auf einer Kopie. Schwarz/Weiß-Komposition nutzt Straight-Alpha und `Math.round((source * alpha + background * (255 - alpha)) / 255)`, Ergebnisalpha 255.

  `applyRgbaMask` prüft gleiche Dimensionen und behält bei `maskAlpha > alphaThreshold` den Pixel unverändert, sonst `[0,0,0,0]`. `compareRgba` kanonisiert beide Seiten, zählt pro Pixel höchstens einmal, ermittelt maximale absolute Kanalabweichung und Alphaabweichungszahl und vergleicht sichtbare Alpha-Bounds exakt. Dimensionsdrift ist ein Fehler, kein skaliertes Vergleichen.

  `overlayRgba` legt Referenz in Magenta und Kandidat in Cyan mit deterministischer 50-Prozent-Mischung übereinander. `heatmapRgba` ist bei gleichen Pixeln transparent und bei jeder Abweichung rot mit Alpha `maxChannelDeltaForPixel`; beide Funktionen sind reine Diagnose und beeinflussen `compareRgba` nicht.

- [ ] **Step 4: Exportiere und führe GREEN aus**

  Ergänze `export * from './conformance/rgba.js';`.

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/conformance/rgba.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS.

- [ ] **Step 5: Committe den RGBA-Kern**

  ```bash
  rtk git -c core.fsmonitor=false add packages/core/src/conformance/rgba.ts packages/core/src/conformance/rgba.test.ts packages/core/src/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat: compare exact RGBA buffers"
  ```

---

### Task 15: Effektiven Conformance-Status über sämtliche Freshnessfelder bestimmen

**Agent ownership:** Nur `packages/core/src/conformance/status.ts`, dessen Test und der Core-Indexexport.

**Files:**
- Create: `packages/core/src/conformance/status.ts`
- Create: `packages/core/src/conformance/status.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: `ConformanceAttestation`, `CurrentConformanceDigests` und die typ-exakte, duplikatfreie `CURRENT_CONFORMANCE_KEYS`-Folge aus Task 4.
- Produces: `conformanceFreshnessIssues(attestation, current)`, `effectiveConformanceStatus(attestation, current): 'approved' | 'invalidated'`.

- [ ] **Step 0: Lege zuerst den compile-sicheren Freshness-Stub an**

  Erzeuge `status.ts` mit der vollständigen Feldliste und Signaturen; der Issue-Stub gibt `red-not-implemented` und der Status immer `invalidated` zurück. Exportiere ihn und führe `rtk mise exec -- pnpm typecheck` grün aus, bevor der Test entsteht.

- [ ] **Step 1: Schreibe tabellarisches RED für jedes direkte Feld**

  Erzeuge vollständige, handgeschriebene Attestation-/Current-Fixtures mit gleichen Werten. Leite die zu mutierenden Feldnamen aus einer festen Testliste ab, nicht aus der Produktionsfunktion:

  ```ts
  it('ist nur bei vollständig gleichem aktuellem Zustand approved', () => {
    expect(effectiveConformanceStatus(attestation, current)).toBe('approved');
  });

  it.each(TEST_FRESHNESS_FIELDS)('invalidiert bei Änderung von %s', (field) => {
    const changed = field === 'oracleAssetDigests'
      ? { ...current, oracleAssetDigests: [sha256Digest('b'.repeat(64))] }
      : field === 'comparisonContractVersion'
        ? { ...current, comparisonContractVersion: 'changed' }
        : field === 'strictRunId'
          ? { ...current, strictRunId: 'changed' }
          : field === 'headCommit'
            ? { ...current, headCommit: 'b'.repeat(40) }
            : { ...current, [field]: sha256Digest('b'.repeat(64)) };
    expect(effectiveConformanceStatus(attestation, changed)).toBe('invalidated');
    expect(conformanceFreshnessIssues(attestation, changed)).toEqual([
      expect.objectContaining({ field }),
    ]);
  });
  ```

  `TEST_FRESHNESS_FIELDS` wird im Test unabhängig, aber ebenfalls über `defineExactKeySet<CurrentConformanceDigests>()` konstruiert und enthält alle 31 Felder. Es mutiert `reachableBuilderContextSetDigest`, `referenceComponentContextSetDigest` und `referenceComponentContextOwnershipDigest` jeweils einzeln und erwartet jeweils `invalidated` mit genau diesem Feld. Digestmutationen verwenden `sha256Digest('b'.repeat(64))`, die Arraymutation `[sha256Digest(...)]`; `headCommit` erhält einen anderen gültigen rohen Git-OID wie `'b'.repeat(40)`, nur Version/Run-ID weitere normale Strings. Ergänze Reihenfolgendrift im Assetdigestarray, ungültige/noncanonical 39-/41-/64-Uppercase-OIDs, eine Runtime-Duplikatmutation der Testliste und eine Attestation mit `result !== 'approved'` als Negativfall. Rohe Digeststrings oder `as CurrentConformanceDigests` sind auch in diesem Test verboten.

- [ ] **Step 2: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/conformance/status.test.ts`

  Expected: FAIL an der positiven `approved`-Assertion, weil der compile-sichere Stub immer `invalidated` liefert.

- [ ] **Step 3: Implementiere einen expliziten, direkt reviewbaren Feldvergleich**

  Importiere `CURRENT_CONFORMANCE_KEYS` aus Task 4, statt im Core eine zweite Feldliste zu definieren. Iteriere diese exakt einmal; vergleiche Hash-/Stringwerte direkt sowie `oracleAssetDigests` längen- und positionsgenau. Dadurch invalidiert jede Reachable-Set-, totale Reference-Set- oder abgeleitete Pair-Ownership-Änderung direkt, auch wenn alle übrigen Digests unverändert bleiben. Ein struktureller Runtime-Keysetcheck verlangt vor dem Vergleich, dass Current genau diese Keys einmal enthält; fehlende und zusätzliche Laufzeitfelder, falsches `result`, abweichender Trust-Store oder Strict-Run invalidieren. Die bidirektionale Compile-Gleichheit wird an der Schemaquelle erzwungen, die Runtime-Duplikatprüfung in der Factory. Die Funktion prüft hier bewusst keine Kryptografie; die spätere CLI-Attestation-Aufgabe kombiniert sie mit der Ed25519-Prüfung. Es gibt keinen Zeit-, Teil- oder Warnstatus.

- [ ] **Step 4: Exportiere und führe GREEN aus**

  Ergänze `export * from './conformance/status.js';`.

  Run: `rtk mise exec -- pnpm exec vitest run packages/core/src/conformance/status.test.ts packages/schema/src/conformance-attestation.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; jede einzelne Feldmutation invalidiert.

- [ ] **Step 5: Committe den Freshnesskern**

  ```bash
  rtk git -c core.fsmonitor=false add packages/core/src/conformance/status.ts packages/core/src/conformance/status.test.ts packages/core/src/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat: invalidate stale conformance evidence"
  ```

---

### Task 16: Vollständiges 661er OracleManifest und kanonische Dateireihenfolge committen

**Agent ownership:** Nur `packages/catalog/src/exact/oracle-order.ts`, `packages/catalog/src/exact/oracle-order.test.ts`, `packages/catalog/src/exact/oracle-manifest.ts`, `packages/catalog/src/exact/oracle-manifest.test.ts`, den neuen Exact-Index, dessen eine Root-Re-Exportzeile und `packages/cli/scripts/generate-oracle-manifest-candidate.mjs`. Keine Batchdatei und kein bestehendes Fingerprintartefakt wird verändert.

**Files:**
- Create: `packages/catalog/src/exact/oracle-order.ts`
- Create: `packages/catalog/src/exact/oracle-order.test.ts`
- Create: `packages/catalog/src/exact/oracle-manifest.ts`
- Create: `packages/catalog/src/exact/oracle-manifest.test.ts`
- Create: `packages/catalog/src/exact/index.ts`
- Modify: `packages/catalog/src/index.ts`
- Create: `packages/cli/scripts/generate-oracle-manifest-candidate.mjs`

**Interfaces:**
- Consumes: `OracleManifest`/`OracleAsset` aus Task 3, `referenceInventoryAssets()` aus `packages/catalog/src/fingerprint-index.ts`, JCS aus Task 8 und ausschließlich beim lokalen Candidate-Generator die 661 Oracledateien.
- Produces: `OracleSection`, `oracleSectionOfFilename(filename)`, `compareOracleFilenames(a,b)`, `compareOracleAssets(a,b)`, `oracleManifestIssues(manifest)`, vollständiges metadata-only `ORACLE_MANIFEST: OracleManifest` mit 661 Zeilen sowie einen read-only Candidate-Generator, der ausschließlich nach `out/` schreibt.

- [ ] **Step 0: Lege zuerst compile-sichere Produktionsstubs an**

  Erzeuge beide Catalogmodule mit finalen Signaturen. `oracleSectionOfFilename` wirft zunächst `RED: oracle section parser not implemented`, der Comparator gibt `0`, `oracleManifestIssues` liefert `red-not-implemented`, und `ORACLE_MANIFEST` ist ein formal typisierter `OracleManifest/v1` mit leerem `assets`-Array und einem über `sha256Digest('0'.repeat(64))` validierten Nulldigest. Lege den Exact-Index mit beiden Re-Exports an und exportiere ihn einmal aus dem Packageindex, damit der spätere CLI-Loader die committed Trust-Baseline über die Packagegrenze und nicht per Deep-Import liest. Erzeuge außerdem den CLI-Scriptstub, der vor jedem Dateizugriff mit Exit 2 und `RED: candidate generator not implemented` endet. `rtk mise exec -- pnpm typecheck` muss vor Tests grün sein.

- [ ] **Step 1: Schreibe RED für Parser, Comparator und die vollständige Baseline**

  Der Test pinnt Kapitel-, Anhangs- und Sondernamen, natürliche Abschnittsreihenfolge und einen UTF-16-Tiebreaker. Er vergleicht anschließend Mengen **und** Reihenfolge des vollständigen Manifests gegen `referenceInventoryAssets()`:

  ```ts
  expect(oracleSectionOfFilename('1.1_Taktische Formation.svg'))
    .toEqual({ family: 'chapter', segments: [1, 1] });
  expect(oracleSectionOfFilename('E.2.15_Wechselladerfahrzeug.svg'))
    .toEqual({ family: 'appendix', letter: 'E', segments: [2, 15] });
  expect(oracleSectionOfFilename('J_Bedienungszeichen.svg'))
    .toEqual({ family: 'appendix', letter: 'J', segments: [] });
  expect([...ORACLE_MANIFEST.assets].sort(compareOracleAssets))
    .toEqual(ORACLE_MANIFEST.assets);
  expect(ORACLE_MANIFEST.assets.map(({ filename }) => filename))
    .toEqual([...referenceInventoryAssets()].sort(compareOracleFilenames));
  expect(new Set(ORACLE_MANIFEST.assets.map(({ filename }) => filename)))
    .toEqual(new Set(referenceInventoryAssets()));
  expect(ORACLE_MANIFEST.assets).toHaveLength(661);
  expect(ORACLE_MANIFEST.assets.find(({ filename }) => filename === '1.1_Taktische Formation.svg')?.sha256)
    .toBe(sha256Digest('84b2b16eb4f4f4085ff1ee63f2688ec81a4be34539de977213c77ff507a1f716'));
  expect(ORACLE_MANIFEST.assets.find(({ filename }) => filename === '2.9_Schwarz.svg')?.sha256)
    .toBe(sha256Digest('f39db4efc5964e879cbd658dbea89f9f0954cdf5f83203b40997da1f80625712'));
  expect(oracleManifestIssues(ORACLE_MANIFEST)).toEqual([]);
  ```

  Ergänze gleiche Anzahl bei getauschtem Filename, Duplicate, falschen `oracle:`-Key, nicht `.svg`, nichtkanonische Unicode-/Slashnamen, falschen Assetdigest und falschen `oracleSetDigest`. Der Test berechnet den Setdigest unabhängig mit testseitigem `node:crypto.createHash` über die exakt festgelegte JCS-Zeilenform; die Produktionskonstante erzeugt ihn nicht selbst.

- [ ] **Step 2: Führe das Verhaltens-RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/catalog/src/exact/oracle-order.test.ts packages/catalog/src/exact/oracle-manifest.test.ts`

  Expected: FAIL an Abschnittsparser und `toHaveLength(661)`, nicht an Import, Syntax oder Typen.

- [ ] **Step 3: Implementiere einen einzigen strikten Abschnittsparser und Comparator**

  Parse ausschließlich den Dateinamenanteil vor dem ersten `_`: Kapitel beginnen mit einer Ziffer und enthalten nur numerische Punktsegmente; Anhänge beginnen mit genau einem ASCII-Großbuchstaben und optional numerischen Punktsegmenten. Ein optionaler einzelner Punkt unmittelbar vor `_` wird kanonisch entfernt; leere, negative, führend genullte oder fremde Segmente scheitern. `compareOracleAssets` sortiert Kapitel numerisch vor Anhängen, Anhänge nach Buchstabe, Segmente numerisch mit kürzerem Präfix zuerst und schließlich den vollständigen NFC-validierten Filename nach rohen UTF-16-Codeunits. `oracle-manifest.ts`, Shardauflösung und Tests verwenden genau diesen Comparator; es gibt keinen zweiten Abschnittsregex.

- [ ] **Step 4: Implementiere den lokalen metadata-only Candidate-Generator**

  `generate-oracle-manifest-candidate.mjs` akzeptiert exakt `--reference-root` und `--out`. Es prüft Root/Entries symlinkfrei, liest ausschließlich reguläre `.svg`-Dateien, verlangt exakt die 661 Namen aus dem eingecheckten Fingerprintinventar, hasht Bytes mit SHA-256 und schreibt `{version,assets,oracleSetDigest}` atomar nach `out/exact-reference/oracle-manifest-candidate.json`. Es serialisiert nur Filename, `oracle:`-Key und Hash; nie XML/SVG, Rootpfad, Stat-Metadaten oder Dateiinhalte. Weder stdout/stderr noch JSON enthalten den aufgelösten absoluten Root. Ein zusätzlicher/fehlender Name beendet den Lauf vor Ausgabe.

  Run:

  ```bash
  rtk mise exec -- node packages/cli/scripts/generate-oracle-manifest-candidate.mjs \
    --reference-root ../../taktische-zeichen \
    --out out/exact-reference/oracle-manifest-candidate.json
  ```

  Expected: Exit 0, genau 661 sortierte Metadatenzeilen und keine Sourceänderung. Prüfe die Candidate-Datei auf verbotene Felder (`path`, `xml`, `svg`, `bytes`, `content`) und den gesamten stdout/stderr auf den absoluten Root; beides muss leer bleiben.

- [ ] **Step 5: Übertrage ausschließlich die geprüften Metadaten als feste Literale**

  Übernimm alle 661 `{key,filename,sha256}`-Zeilen und den `oracleSetDigest` mit `apply_patch` in `ORACLE_MANIFEST`; importiere oder lese die Candidate-Datei niemals zur Catalog-Laufzeit. Jede Zeile verwendet `sha256Digest(...)`. Prüfe unabhängig, dass die zwei Sentinelhashes stimmen und dass eine frische testseitige Digestberechnung exakt den committed Setdigest ergibt. Der Candidate unter `out/` bleibt untracked.

- [ ] **Step 6: Führe GREEN ohne Oracleroot und danach den lokalen Vollabgleich aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/catalog/src/exact/oracle-order.test.ts packages/catalog/src/exact/oracle-manifest.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS ohne Oracleroot. Wiederhole anschließend den Generator und vergleiche Candidate- und committed `{filename,sha256}`-Mengen bytegenau per Testcommand; PASS über alle 661, ohne Rohinhalt oder Pfade zu persistieren.

- [ ] **Step 7: Committe nur Comparator, Manifest und sicheren Generator**

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/oracle-order.ts packages/catalog/src/exact/oracle-order.test.ts packages/catalog/src/exact/oracle-manifest.ts packages/catalog/src/exact/oracle-manifest.test.ts packages/catalog/src/exact/index.ts packages/catalog/src/index.ts packages/cli/scripts/generate-oracle-manifest-candidate.mjs
  rtk git -c core.fsmonitor=false commit -m "feat: pin complete exact oracle manifest"
  ```

---

### Task 17: Exaktes 413er PaintComponentRegistry aus den realen Registern ableiten

**Agent ownership:** Nur `packages/catalog/src/exact/paint-component-registry.ts`, dessen Test und dessen eine Exportzeile im Exact-Index; keine Quellregistry.

**Files:**
- Create: `packages/catalog/src/exact/paint-component-registry.ts`
- Create: `packages/catalog/src/exact/paint-component-registry.test.ts`
- Modify: `packages/catalog/src/exact/index.ts`

**Interfaces:**
- Consumes: die bestehenden Schema-Arrays `SYMBOL_KINDS`, `BODY_VARIANT_IDS`, `ORGANIZATION_IDS`, `STRENGTH_IDS`, `ADMIN_LEVEL_IDS`, `VEHICLE_CATEGORY_IDS`, `TECHNICAL_HEAD_MARK_IDS`, `FUNCTION_ROLE_IDS`, `CAPABILITY_IDS`, `TECHNICAL_BODY_MARK_IDS`, `STATE_IDS`, `COMMS_IDS`, `DAMAGE_IDS`, `WILDFIRE_IDS`, `LEADERSHIP_IDS`, `WATER_RESCUE_PERSONNEL_IDS`; `PALETTE` sowie die tatsächlichen Catalogregister `BASE_SYMBOLS`, `FUNCTION_ROLE_DEFINITIONS`, das aus `CapabilityId | TechnicalBodyMarkId` gefilterte geometrische Snapshotregister `BODY_MARK_IDS` (64, nicht die 44er Technical-Teilmenge), `CAPABILITY_PICTOGRAMS`, `STATE_PICTOGRAMS`, `COMMS_PICTOGRAMS`, `DAMAGE_PICTOGRAMS`, `WILDFIRE_PICTOGRAMS`, `LEADERSHIP_PICTOGRAMS`, `WATER_RESCUE_PERSONNEL_PICTOGRAMS`.
- Produces: `PaintComponentFamily`, `PaintComponentRegistryEntry`, `PAINT_COMPONENT_FAMILY_COUNTS`, `PAINT_COMPONENT_REGISTRY`, `PAINT_COMPONENT_KEYS`, `paintComponentRegistryIssues()` und `paintComponentRegistryDigestInput()`.

- [ ] **Step 0: Lege zuerst den compile-sicheren Registry-Stub an**

  Erzeuge das Modul mit finalen Typen, exakt den 17 Familiennamen und den erwarteten Countkonstanten, aber zunächst `PAINT_COMPONENT_REGISTRY = new Map()`/`PAINT_COMPONENT_KEYS = []`; `paintComponentRegistryIssues` liefert `red-not-implemented`. Ergänze den Exact-Indexexport. `rtk mise exec -- pnpm typecheck` muss vor dem Test grün sein.

- [ ] **Step 1: Schreibe RED gegen jede echte Quellmenge statt nur gegen Summen**

  Der Test baut erwartete Keys unabhängig direkt aus den oben genannten Quellregistern und verlangt pro Familie Mengenidentität und Disjunktheit. Gepinnt werden:

  ```text
  kind 19; organization 9; technicalFill 13; strength 4;
  administrativeLevel 6; functionRole 25; capabilities 88; bodyMarks 64;
  vehicleCategory 8; bodyVariant 10; technicalHeadMark 1;
  states 61; comms 48; damage 28; wildfire 14;
  leadership 10; water-rescue-personnel 5.
  ```

  Prüfe `398` für die ersten 15 Snapshotfamilien, `15` für die zwei direkten Trägerfamilien, `413` gesamt und 413 eindeutige Keys. Für die elf `SymbolSpec`-Achsen muss `selectable === true` genau 247 Keys ergeben; states/comms/damage/wildfire und direkte Träger sind `selectable === false`. Mutationen mit gleicher Gesamtzahl, aber vertauschtem Key, falscher Familie, doppelt verwendetem Value oder einer Catalog-/Schema-ID-Differenz bleiben rot.

- [ ] **Step 2: Führe das Verhaltens-RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/catalog/src/exact/paint-component-registry.test.ts`

  Expected: FAIL an `expect(PAINT_COMPONENT_KEYS).toHaveLength(413)` und den Familienmengen, nicht an Imports/Typen.

- [ ] **Step 3: Implementiere die eine deklarative Ableitung**

  Lege eine readonly Family-Descriptor-Tabelle an, deren `values` unmittelbar aus den realen Arrays/Object-Keys stammen und deren Keyformat `${family}:${value}` ist; `technicalFill` liest exakt `Object.keys(PALETTE)`, `bodyMarks` exakt `BODY_MARK_IDS`. Vergleiche für jede geometrische Catalogregistry deren IDs zusätzlich gegen ihren passenden Schema-ID-Raum, bevor Entries entstehen. Die Kindfamilie ist exakt `SYMBOL_KINDS`: `BASE_SYMBOLS` muss die 14 Kapitel-1-Keys abdecken, die verbleibende Differenz muss genau `trailer`, `swap-loader-vehicle`, `upright-rectangle`, `circle-12`, `reduced-house` sein. Bei Body-Marks heißt der Beleg „jeder der 64 Werte ist `CapabilityId | TechnicalBodyMarkId`“, nicht fälschlich Gleichheit mit der 44er `TECHNICAL_BODY_MARK_IDS`-Teilmenge. Jeder Entry führt `key`, `family`, `value`, `sourceRegistry`, `selectable` und `visiblePaint: true`; Layoutprofile, Textzonen, Anker und Regeln sind hier unzulässig. Sortiere nach Familie in der fest gepinnten Descriptorreihenfolge, dann Value nach UTF-16. Der Validator prüft die tatsächlichen Family-Keysets, nicht nur Summen.

- [ ] **Step 4: Führe GREEN und bestehende Registrytests aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/catalog/src/exact/paint-component-registry.test.ts packages/catalog/src/pictograms/state-inventory.test.ts packages/schema/src/taxonomy-values.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS mit exakt 413 disjunkten, sichtbaren Component-Keys und 247 selectable Keys.

- [ ] **Step 5: Committe ausschließlich die abgeleitete Registry**

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/paint-component-registry.ts packages/catalog/src/exact/paint-component-registry.test.ts packages/catalog/src/exact/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat: derive exact paint component registry"
  ```

---

### Task 18: Endliche öffentliche SymbolSpec-Grammatik symbolisch auswerten und Contexts, Contracts und Ownership-Vertrag erzeugen

**Agent ownership:** Nur `packages/schema/src/symbol-spec-grammar.ts`, dessen Test und Schema-Indexexport, `packages/core/src/exact/symbol-spec-context.ts` samt Test/Core-Indexexport, die präzisen Validierungsänderungen in `packages/core/src/validate.ts`/`validate.test.ts`, sowie `packages/catalog/src/exact/composition-contract-registry.ts`, `reachable-builder-contexts.ts`, `reference-component-contexts.ts`, `known-symbol-spec-assets.ts`, `oracle-ownership-manifest.ts`, deren Tests und ihre Exportzeilen im Exact-Index. Schema besitzt ausschließlich Typen, endliche ID-Domänen und Slotgrammar; der ausführbare Rule-/Completion-Evaluator und sein State-DAG liegen ausschließlich in Core. Keine Batch-/Recipe-/bestehende Layoutdatei wird verändert. Damit besitzt genau diese registry-aware Aufgabe Slotgrenzen, die getrennte öffentliche und totale Referenzkontextmenge, den collision-safe bekannten Spec→Asset-Index und Owner-/Variantenabgleich; Task 1 prüft nur die formale `PaintOwner`-Form.

**Files:**
- Create: `packages/schema/src/symbol-spec-grammar.ts`
- Create: `packages/schema/src/symbol-spec-grammar.test.ts`
- Modify: `packages/schema/src/index.ts`
- Create: `packages/core/src/exact/symbol-spec-context.ts`
- Create: `packages/core/src/exact/symbol-spec-context.test.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/src/validate.ts`
- Modify: `packages/core/src/validate.test.ts`
- Create: `packages/catalog/src/exact/composition-contract-registry.ts`
- Create: `packages/catalog/src/exact/composition-contract-registry.test.ts`
- Create: `packages/catalog/src/exact/reachable-builder-contexts.ts`
- Create: `packages/catalog/src/exact/reachable-builder-contexts.test.ts`
- Create: `packages/catalog/src/exact/reference-component-contexts.ts`
- Create: `packages/catalog/src/exact/reference-component-contexts.test.ts`
- Create: `packages/catalog/src/exact/known-symbol-spec-assets.ts`
- Create: `packages/catalog/src/exact/known-symbol-spec-assets.test.ts`
- Create: `packages/catalog/src/exact/oracle-ownership-manifest.ts`
- Create: `packages/catalog/src/exact/oracle-ownership-manifest.test.ts`
- Modify: `packages/catalog/src/exact/index.ts`

**Interfaces:**
- Consumes: sämtliche endlichen SymbolSpec-ID-Arrays und alle tatsächlichen `BodyLabels`-Felder aus Schema, die bereits von `validateSpec` verwendeten `BODY_VARIANT_KINDS`/Profil-/Funktions-/Fahrzeug-/Head-/Placement-Regeln, `PAINT_COMPONENT_REGISTRY` aus Task 17, `ORACLE_MANIFEST` aus Task 16, die 14 `BASE_SYMBOLS`, alle 242 `RECIPES`, `canonicalJsonUtf8` aus Task 8, `SymbolSpec`, `validateSpec`/`analyzeSymbolSpec` und `profileFor`.
- Schema produces declaratively: `SYMBOL_SPEC_FIELD_ORDER`, `MAX_CAPABILITY_SLOTS`, `MAX_BODY_MARK_SLOTS`, `LabelTextPresence`, `LabelMeasurementProfileKey`, `LabelMeasurementState`, `LabelLayoutProjection`, `SymbolSpecProjection`, `PublicSymbolSpecGrammarV1`, `PUBLIC_SYMBOL_SPEC_GRAMMAR`. Schema exportiert keinen ausführbaren Rule-Evaluator.
- Core produces executable semantics: `symbolSpecGrammarIssues(spec)`, `canonicalSymbolSpecProjection(spec): SymbolSpecProjection`, `evaluateSymbolSpecTransitions(grammar: PublicSymbolSpecGrammarV1): SymbolSpecStateDagV1`, `SymbolSpecStateDagV1`, `SymbolSpecCompletenessCertificateV1`, `buildSymbolSpecCompletenessCertificate(grammar: PublicSymbolSpecGrammarV1, dag: SymbolSpecStateDagV1, projectedPairDigestInput: readonly string[]): SymbolSpecCompletenessCertificateV1`. Catalog produces `CompositionContractRegistryEntry`, `COMPOSITION_CONTRACT_REGISTRY: ReadonlyMap<CompositionContractKey, CompositionContractRegistryEntry>`, `COMPOSITION_CONTRACT_KEYS: readonly CompositionContractKey[]`, `compositionContractRegistryIssues()`, `ReachableBuilderComponentContext`, `ReachableBuilderContextSetV1`, `REACHABLE_BUILDER_CONTEXT_SET`, `deriveReachableBuilderContextSet()`, `ResolvedBuilderContext`, `resolveReachableBuilderContext(spec: SymbolSpec): ResolvedBuilderContext`, `reachableBuilderContextIssues()`, `ReferenceComponentContextSetIssueCode`, `ReferenceComponentContextSetIssue`, `referenceOnlyComponentContextKey(component)`, `directCarrierComponentContextKey(component)`, `REFERENCE_ONLY_COMPONENT_CONTEXTS`, `DIRECT_CARRIER_COMPONENT_CONTEXTS`, `REFERENCE_COMPONENT_CONTEXT_SET: ReferenceComponentContextSetV1`, `deriveReferenceComponentContextSet()`, `referenceComponentContextSetIssues()`, `canonicalKnownSymbolSpecDigest(spec: SymbolSpec): KnownSymbolSpecDigest`, `KNOWN_SYMBOL_SPEC_ASSET_INDEX: KnownSymbolSpecAssetIndex`, `knownSymbolSpecAssetIndexIssues()`, sowie `ORACLE_OWNERSHIP_MANIFEST: OracleOwnershipManifestDraft` als ausdrücklich vom Corpus zu finalisierender Export.

- [ ] **Step 0: Lege zuerst sieben compile-sichere Produktionsstubs an**

  Erzeuge alle Module/Signaturen und exportiere sie aus Schema-, Core- und Catalog-Index. `symbol-spec-grammar.ts` enthält schon die endgültigen rein deklarativen Typen/Konstanten. `symbol-spec-context.ts` enthält die finalen Signaturen, gibt zunächst `['red-not-implemented']` zurück beziehungsweise wirft `RED: completion evaluator not implemented`; ändere `validateSpec` compile-sicher so, dass dieser Stubbefund noch **nicht** in bestehende Aufrufe eingeht. `COMPOSITION_CONTRACT_REGISTRY`, `REACHABLE_BUILDER_CONTEXT_SET`, `REFERENCE_ONLY_COMPONENT_CONTEXTS`, `DIRECT_CARRIER_COMPONENT_CONTEXTS`, `REFERENCE_COMPONENT_CONTEXT_SET` und `KNOWN_SYMBOL_SPEC_ASSET_INDEX` sind zunächst typisierte leere Collections und ihre Issuefunktionen liefern `red-not-implemented`; die beiden nichtöffentlichen Context-Key-Factorys besitzen ihre finalen compile-sicheren, scopegetrennten Signaturen. `canonicalKnownSymbolSpecDigest` besitzt bereits die endgültige compile-sichere Signatur und wirft vorerst `RED: known SymbolSpec digest not implemented`. `ORACLE_OWNERSHIP_MANIFEST` ist bereits der gültige Draftvertrag `{version:'OracleOwnershipManifest/v1',status:'awaiting-corpus-finalization',owner:'exact-reference-corpus',oracleSetDigest:ORACLE_MANIFEST.oracleSetDigest,entries:[]}`. `rtk mise exec -- pnpm typecheck` muss vor den Tests grün sein.

- [ ] **Step 1: Schreibe RED für die endliche öffentliche Grammatik, konkrete Contracts und vollständige Builderkontexte**

  Pinne zuerst die öffentliche, paintrelevante Grammatik unabhängig von Reachability. Die kanonische Feld-/Slotreihenfolge ist wörtlich:

  ```ts
  export const SYMBOL_SPEC_FIELD_ORDER = [
    'kind', 'bodyVariant', 'organization', 'technicalFill', 'strength',
    'technicalHeadMark', 'administrativeLevel', 'functionRole', 'vehicleCategory',
    'capability:0', 'capability:1', 'bodyMark:0', 'bodyMark:1', 'bodyMark:2',
    'labels.accessibilityMode', 'labels.inBodyInk', 'labels.center',
    'labels.centerAnchorFromBodyLeftMm', 'labels.centerBaselineFromBodyBottomMm',
    'labels.centerBoxMarginMm', 'labels.bottomLeft', 'labels.bottomCenter',
    'labels.bottomRight', 'labels.bottomRightMetrics', 'labels.topLeft',
    'labels.topLeftMetrics', 'labels.aboveLeft', 'labels.aboveLeftMetrics',
    'labels.topLeftLines', 'labels.belowRight', 'labels.surfaceBelowLeft',
    'labels.surfaceBelowRight', 'labels.centerCapHeightMm', 'designationState',
  ] as const;
  export const MAX_CAPABILITY_SLOTS = 2 as const;
  export const MAX_BODY_MARK_SLOTS = 3 as const;
  ```

  Jede optionale skalare ID-Achse besitzt genau einen Slot `absent | <ID>`. `capabilities` besitzt exakt 0–2, `bodyMarks` exakt 0–3 geordnete Slots; die Arrayreihenfolge ist paintrelevant und wird nicht sortiert, aber eine ID darf innerhalb derselben Achse nur einmal vorkommen. `[]` ist nicht kanonisch und wird wie ein unbekanntes Zusatzfeld abgewiesen statt still zu `undefined` umgeschrieben. Unbekannte Own-Keys, symbolische/prototypgeerbte Werte und unregistrierte IDs sind nicht Teil der Grammatik. Der beobachtete heutige Recipe-Bestand (242 Recipes, keine `capabilities`, höchstens drei `bodyMarks`) ist nur eine Regressionfixture und **nicht** die Herleitung dieser öffentlichen Grenzen.

  `labels` ist vollständig und endlich projiziert, ohne freie Texte in Exact-Identität zu ziehen: `accessibilityMode` ist `absent|'neutral-zones'`; `inBodyInk` ist `absent|<BodyLabelInk-ID>`; `center`, `bottomLeft`, `bottomCenter`, `bottomRight`, `topLeft`, `aboveLeft`, `belowRight`, `surfaceBelowLeft` und `surfaceBelowRight` sind je `absent|present`; `topLeftLines` ist exakt `absent|present-two-lines`. Die drei Metrics-Objekte und die vier einzelnen numerischen Overrides werden vollständig auf `absent|registered:<LabelMeasurementProfileKey>|custom-generated` projiziert. `registered:*` bedeutet bytegenaue Übereinstimmung der vollständigen endlichen Zahlentupel mit einem reviewbaren gemessenen Profil; unbekannte/nicht-endliche Zahlen sind ungültig, beliebige sonstige endliche Werte sind `custom-generated`. Ein `labels`-Objekt ohne irgendeinen gesetzten Feldwert ist nicht kanonisch und wird abgewiesen; unbekannte Keys und blanke gesetzte Texte ebenso. Freie Textinhalte und jedes `custom-generated`-Label werden nach dem Exact-Layer in genau einem `GeneratedOverlayLayer` mit `purpose:'body-labels'` gerendert und sind von Fragment-/Fixture-/Case-Digests und Exact-Attestierung ausgeschlossen. Nur die endlichen Presence-, Accessibility-, Ink- und registrierten Measurement-Zustände dürfen einen Geometry-Context/Contract beeinflussen. Designation wird analog ausschließlich auf `absent|present` projiziert und als nachfolgendes `purpose:'designation'`-Overlay nicht exact attestiert. Bereits gemessene feste Referenzschrift in Oracle-Assets bleibt dagegen ein Exact-Pfadfragment. Damit sind alle tatsächlichen `SymbolSpec`-/`BodyLabels`-Felder entweder einer endlichen Exact-Projektion oder ausdrücklich der nicht attestierten Overlay-Schicht zugeordnet.

  Die erlaubten Kombinationen sind keine Beispielsammlung: `PUBLIC_SYMBOL_SPEC_GRAMMAR.version === 'PublicSymbolSpecGrammar/v1'` enthält die vollständigen endlichen ID-Domänen und eine geordnete, code-reviewbare Regel-ID-Tabelle. Diese Tabelle bindet mindestens exakt die heute in `validateSpec` ausgeführten Beziehungen: `organization XOR technicalFill`; `bodyVariant` gegen `BODY_VARIANT_KINDS`; Kind gegen Body-/Layoutprofil; `functionRole` gegen dessen Kind/Stärke/Admin-/Headvorgaben; `vehicleCategory` gegen erlaubte Fahrzeugart/-fassung; `technicalHeadMark`, `strength` und `administrativeLevel` gegen die gemessene Headregel; sowie Capability-/Body-Mark-Slot gegen die für das aufgelöste Profil vorhandene Placementdefinition. `analyzeSymbolSpec` ruft `symbolSpecGrammarIssues` als erste gemeinsame Grenze auf; Catalog-Reachability darf keine zweite, schwächere Kombinationstabelle besitzen.

  Pinne danach unabhängige Repräsentanten für jede Grundprofil-/BodyVariant-Fassung, jede Kopf-/Fahrwerk-/Piktogramm-/Body-Mark-/Rollenplatzierung, jede Label-Presence-/Accessibility-/Ink-/Measurement-Klasse, `custom-generated`-Overlay und designation `absent|present` sowie verbotene Kombinationen (`organization` plus `technicalFill`, falsche Variant für Kind, unzulässige Headkombination, 3 Capabilities, 4 Body-Marks, Duplicate in jedem Mehrfachfeld, leeres Array und vertauschte Slotreihenfolge mit entsprechend anderem Projektions-Key). Verlange:

  - jeder der 247 selectable Component-Keys erscheint in mindestens einem öffentlich erreichbaren `(component,context)`-Paar;
  - `REFERENCE_ONLY_COMPONENT_CONTEXTS` enthält für exakt die 151 nicht komponierbaren Snapshotkeys der Familien `states|comms|damage|wildfire` je genau eine explizite Zeile mit `access:'reference-only'`; `DIRECT_CARRIER_COMPONENT_CONTEXTS` enthält für exakt die 15 direkten Träger der Familien `leadership|water-rescue-personnel` je genau eine explizite Zeile mit `access:'direct-carrier'`;
  - `REFERENCE_COMPONENT_CONTEXT_SET.pairs` ist exakt die disjunkte Union der als `public-builder` projizierten `REACHABLE_BUILDER_CONTEXT_SET.pairs` und dieser 151+15 expliziten Zeilen. Daher gilt `REFERENCE_COMPONENT_CONTEXT_SET.pairs.length === REACHABLE_BUILDER_CONTEXT_SET.pairs.length + 166`; nur die Component-Key-Projektionen sind auf 247 öffentlich beziehungsweise 413 total festgelegt. Die totale Componentprojektion ist exakt `PAINT_COMPONENT_KEYS`, sodass jeder der 413 Keys mindestens einen vollständigen Referenzkontext besitzt;
  - jeder konkrete gültige Spec besitzt bei On-Demand-Auflösung genau einen stabilen `BuilderCompositionKey`; unterschiedliche endliche Exact-Projektionen kollidieren nicht, freie Textwerte mit derselben Presence-Projektion dürfen sich dagegen nur im Generated Overlay unterscheiden;
  - jedes Paar löst genau einen konkreten Contract mit `partFrame`, Placementregel, Anker-/Zonenwerten und `ExactTransformSequence` auf;
  - der Core-State-DAG deckt jede durch `validateSpec` gültige paintrelevante Production ab und schließt jede ungültige mit konkreter Rule-ID aus; dieselbe rohe Spec liefert in Core und Catalog exakt dieselbe `SymbolSpecProjection`;
  - `set(COMPOSITION_CONTRACT_KEYS) = set(REFERENCE_COMPONENT_CONTEXT_SET.pairs.contract)`, und für jede Zeile ist `pair.contract === compositionContractKey(pair.component,pair.context)`; die `(component,context,contract)`-Projektion ihrer `public-builder`-Teilmenge ist exakt, nicht bloß gleich groß, zur entsprechenden Projektion der Reachable-Menge;
  - Mutationen für missing/extra/duplicate Total-Pair, doppelt klassifizierte Paare/Components und Crossover (`reference-only|direct-carrier` als öffentlich beziehungsweise ein Reachable-Paar als nichtöffentlich) schlagen mit getrennten stabilen Issuecodes fehl. Keine reference-only/direct Zeile besitzt `representativeSpec` oder `proofPath`, und weder State-DAG noch `resolveReachableBuilderContext` dürfen sie ausgeben;
  - mutiere im aufgelösten Plan den Owner eines Component-Leaves auf eine andere registrierte Component oder Variant: Der registry-aware Contracttest muss `component-owner-mismatch` beziehungsweise `variant-owner-mismatch` liefern; dieser RED liegt ausdrücklich nicht im formalen Task-1-IR-Test;
  - unbekannter Context und ein Context, dessen repräsentativer Spec nun ungültig wird, scheitern fail-closed;
  - `KNOWN_SYMBOL_SPEC_ASSET_INDEX` besitzt für die aktuelle, unabhängig ausgezählte Source-Allokation exakt 256 Digestkeys: 14 aus den `BASE_SYMBOLS`-Primärdarstellungen mit dem vollständigen Spec `{ kind: entry.kind }` und 242 aus `RECIPES[recipe].spec`; jeder Wert ist der `ExactAssetKey` des jeweiligen Primary-Source-Assets beziehungsweise `recipe.referenceAsset`. Das aktuelle Register wurde mechanisch auf 256 verschiedene kanonische Specbytes geprüft, also existiert kein realer, zusammenzuführender Overlap;
  - dieselbe Spec mit anderer Property-Einfügereihenfolge liefert denselben `KnownSymbolSpecDigest`, aber geänderte Arrayreihenfolge, freie Labeltexte oder designation liefern einen anderen Digest. Eine künstlich duplizierte kanonische Specquelle, zwei verschiedene kanonische Bytes bei erzwungen gleichem Digest, ein Digest mit zwei Assetzielen, fehlende/zusätzliche Source oder ein unbekanntes Referenzasset scheitern jeweils fail-closed mit eigenem stabilen Issuecode; keine First-/Last-write-wins-Map ist zulässig;
  - der Ownership-Export ist an den 661er Setdigest gebunden, `owner` ist exakt `exact-reference-corpus`, und das Foundation-Inventory lehnt seinen Draftstatus erwartbar als noch nicht releasefähig ab;
  - ein vom Produktionscode unabhängiger Test rekonstruiert aus den Schema-Domänen jede mögliche `(state,nextField,nextDomainValue)`-Kante, verlangt exakte Mengenidentität mit accepted/rejected Transitions, genau eine Entscheidung je Kante, alle Terminalzustände accepted/rejected und für jedes reachable `(component,context)`-Paar einen validierten Witnesspfad. Er materialisiert dabei niemals die kartesische Menge vollständiger Specs.

- [ ] **Step 2: Führe das Verhaltens-RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/schema/src/symbol-spec-grammar.test.ts packages/core/src/exact/symbol-spec-context.test.ts packages/core/src/validate.test.ts packages/catalog/src/exact/composition-contract-registry.test.ts packages/catalog/src/exact/reachable-builder-contexts.test.ts packages/catalog/src/exact/reference-component-contexts.test.ts packages/catalog/src/exact/known-symbol-spec-assets.test.ts packages/catalog/src/exact/oracle-ownership-manifest.test.ts`

  Expected: FAIL an fehlenden öffentlichen/totalen Pairs, fehlenden Contracts, der fehlenden 413-Abdeckung und dem leeren Known-Spec-Index; der compile-sichere Ownership-Drafttest selbst ist bereits grün.

- [ ] **Step 3: Implementiere den faktorisierten Core-State-DAG und leite nur erreichbare Paare ab**

  Schema definiert nur die endlichen Domänen, Slotproduktionen und geordnete Rule-IDs. Core kompiliert sie in einen azyklischen, memoisierten State-DAG: Ein State-Key enthält nur bereits gesetzte, für zukünftige Regeln oder die Component-/Context-Projektion relevante Diskriminanten, niemals einen vollständigen Spec. Für jeden State und jeden Wert der nächsten Feld-/Slotdomäne existiert genau eine deterministische Transition `accepted(nextState,productionIds)` oder `rejected(ruleId)`. Multi-Value-Slots sind geordnete, duplicatefreie 0..2-/0..3-Produktionen; ein leerer Folgeslot beendet die Achse und weitere belegte Slots werden abgewiesen. Ein Worklist-Fixpunkt besucht jeden equivalence State einmal. Dadurch ist die öffentliche Sprache endlich und erschöpfend entscheidbar, ohne Milliarden vollständige Specs, Permutationen oder kartesische Contextklassen zu erzeugen.

  `buildSymbolSpecCompletenessCertificate(grammar, dag, projectedPairDigestInput)` bindet Grammar-/Rule-Digestinput, sortierte State-/Transition-/Terminal-Keys, accepted/rejected Production-IDs sowie den sortierten projected-pair Digestinput. Der unabhängige Test baut das erwartete Transitionuniversum direkt aus Schema-Domänen und Slotgrenzen, prüft jede Transition genau einmal, alle Rule-Produktionen als erreicht oder begründet unerreichbar, jeden Terminalstatus und jeden Pair-Witnesspfad. Eine bloße Repräsentanten-Stichprobe, nur minimale/maximale Slotbelegung oder ein vollständiges `SymbolSpec[]` ist verboten.

  ```ts
  export type SymbolSpecTransitionDecision =
    | { readonly kind: 'accepted'; readonly nextState: string; readonly productionIds: readonly string[] }
    | { readonly kind: 'rejected'; readonly ruleId: string };
  export interface SymbolSpecStateDagV1 {
    readonly version: 'SymbolSpecStateDag/v1';
    readonly rootState: string;
    readonly stateKeys: readonly string[];
    readonly transitions: readonly {
      readonly key: string; readonly from: string; readonly field: typeof SYMBOL_SPEC_FIELD_ORDER[number];
      readonly domainValue: string; readonly decision: SymbolSpecTransitionDecision;
    }[];
    readonly terminals: readonly { readonly state: string; readonly accepted: boolean; readonly ruleId?: string }[];
  }
  export function evaluateSymbolSpecTransitions(
    grammar: PublicSymbolSpecGrammarV1,
  ): SymbolSpecStateDagV1;
  ```

  `deriveReachableBuilderContextSet` speichert ausschließlich die endliche, nach `(component,context)` sortierte Menge eindeutiger Paare. Jedes Paar enthält genau einen lexikographisch kleinsten, erneut durch `validateSpec` geprüften `representativeSpec`, dessen State-DAG-`proofPath`, und seinen Contract-Key. Die symbolische Vollständigkeitsbescheinigung beweist, dass jede accepted Production auf alle berührten Paare projiziert wurde; unbekannte oder nicht completion-fähige Produktionen werden mit Rule-ID ausgeschlossen.

  ```ts
  export interface ReachableBuilderComponentContext {
    readonly component: ComponentKey;
    readonly context: ComponentContextKey;
    readonly contract: CompositionContractKey;
    readonly representativeSpec: SymbolSpec;
    readonly proofPath: readonly string[];
  }
  export interface SymbolSpecCompletenessCertificateV1 {
    readonly version: 'SymbolSpecCompletenessCertificate/v1';
    readonly grammarDigestInput: readonly string[];
    readonly stateKeys: readonly string[];
    readonly transitionKeys: readonly string[];
    readonly terminalStateKeys: readonly string[];
    readonly rejectedTransitionKeys: readonly string[];
    readonly projectedPairDigestInput: readonly string[];
  }
  export function buildSymbolSpecCompletenessCertificate(
    grammar: PublicSymbolSpecGrammarV1,
    dag: SymbolSpecStateDagV1,
    projectedPairDigestInput: readonly string[],
  ): SymbolSpecCompletenessCertificateV1;
  export interface ReachableBuilderContextSetV1 {
    readonly version: 'ReachableBuilderContextSet/v1';
    readonly pairs: readonly ReachableBuilderComponentContext[];
    readonly completeness: SymbolSpecCompletenessCertificateV1;
    readonly componentContextSetDigestInput: readonly string[];
  }
  export interface ResolvedBuilderContext {
    readonly key: BuilderCompositionKey;
    readonly projection: SymbolSpecProjection;
    readonly componentContexts: readonly {
      readonly component: ComponentKey;
      readonly context: ComponentContextKey;
      readonly contract: CompositionContractKey;
    }[];
    readonly plan: CompositionPlan;
    readonly generatedOverlays: readonly GeneratedOverlayLayer[];
  }
  export function resolveReachableBuilderContext(
    spec: SymbolSpec,
  ): ResolvedBuilderContext;
  ```

  `reference-component-contexts.ts` baut davon getrennt den totalen, nur für exakte
  Komponentenreferenzprüfung bestimmten Vertrag:

  ```ts
  export type ReferenceComponentContextSetIssueCode =
    | 'reference-context-missing'
    | 'reference-context-extra'
    | 'reference-context-duplicate'
    | 'reference-context-crossover'
    | 'reference-component-uncovered'
    | 'public-context-mismatch'
    | 'reference-context-key-scope'
    | 'reference-contract-key-mismatch';
  export interface ReferenceComponentContextSetIssue {
    readonly code: ReferenceComponentContextSetIssueCode;
    readonly key: string;
    readonly detail: string;
  }
  export function referenceOnlyComponentContextKey(
    component: ComponentKey,
  ): ComponentContextKey;
  export function directCarrierComponentContextKey(
    component: ComponentKey,
  ): ComponentContextKey;
  export const REFERENCE_ONLY_COMPONENT_CONTEXTS:
    readonly (ReferenceComponentContextPair & { readonly access: 'reference-only' })[];
  export const DIRECT_CARRIER_COMPONENT_CONTEXTS:
    readonly (ReferenceComponentContextPair & { readonly access: 'direct-carrier' })[];
  export function deriveReferenceComponentContextSet(): ReferenceComponentContextSetV1;
  export const REFERENCE_COMPONENT_CONTEXT_SET: ReferenceComponentContextSetV1;
  export function referenceComponentContextSetIssues(
    value?: ReferenceComponentContextSetV1,
  ): readonly ReferenceComponentContextSetIssue[];
  ```

  Die 151 beziehungsweise 15 Zeilen stehen als vollständig reviewbare literale Allokationen im
  Modul und werden nicht aus einer „alles übrige“-Fallbackregel erzeugt. Ihre Contextkeys lauten
  kanonisch `context:reference-only%3A${encodeURIComponent(component)}` beziehungsweise
  `context:direct-carrier%3A${encodeURIComponent(component)}` und entstehen ausschließlich über
  `componentContextKey`; damit sind die beiden Räume untereinander und gegenüber allen
  Buildercontexts strukturell disjunkt. Jede Zeile führt den kanonisch daraus konstruierten
  `compositionContractKey(component,context)`. Der Set-Builder projiziert jedes Reachable-Paar
  unverändert auf `access:'public-builder'`, vereinigt es mit den beiden expliziten Tabellen,
  sortiert ausschließlich nach `(component,context,contract,access)` und verwirft statt zu
  reparieren jedes Duplicate oder Crossover.

  `ResolvedBuilderContext`, `SymbolSpecProjection` und `ComponentContextKey` sind die einzigen Namen der **öffentlichen Builderübergabe** an Integration. `componentContexts` ist immer ein vorhandenes readonly Array; jeder Eintrag besitzt zwingend ein vorhandenes `context: ComponentContextKey` und `contract: CompositionContractKey` aus der `public-builder`-Teilmenge. Es gibt keinen Typ oder Wert `ComponentContext`, kein optionales/`undefined` Contextfeld und keine zweite Projektionsform. `generatedOverlays` ist ebenfalls immer vorhanden (gegebenenfalls `[]`) und enthält ausschließlich die nach Task 1 typisierten Layer. Für jeden erzeugten Overlay konstruiert Task 18 genau einmal eine unveränderliche `overlayToExact`-Referenz und unmittelbar daneben `overlayToExactDigest = exactTransformSequenceDigest(overlayToExact)`; beide Werte werden gemeinsam in den Layer übernommen und danach weder neu abgeleitet noch mutiert. `REFERENCE_COMPONENT_CONTEXT_SET` ist daneben nur die totale Referenzprüfungs-/Reviewmenge; es ist kein alternativer Spec-Resolver und erweitert weder Grammar noch State-DAG oder `ResolvedBuilderContext`.

  `BuilderCompositionKey` und `CompositionPlan` werden **nicht** für alle gültigen Specs gespeichert. `resolveReachableBuilderContext(spec)` validiert genau den konkreten Spec, berechnet dessen endliche Projektion durch Core, schlägt die benötigten Paare im Set nach und erzeugt erst dann on demand den mit `builder:` beginnenden Key und genau einen `CompositionPlan`. Key-Tokens folgen `SYMBOL_SPEC_FIELD_ORDER`, enthalten Slotordinale und percent-encodete endliche Projektionswerte. Freie Label-/Designation-Texte und `custom-generated`-Messwerte sind nie Teil dieser Exact-Identität; sie erzeugen nur die geordneten Generated Overlays. Der Test verlangt für jeden zurückgegebenen Layer Objektidentität der einmal erzeugten Transformfolge und `layer.overlayToExactDigest === exactTransformSequenceDigest(layer.overlayToExact)`; eine nachträgliche Transformmutation bei unverändertem Digest muss `assertRenderableDrawing` ablehnen. Die Abhängigkeit ist strikt `Exact-Layer -> body-labels overlay -> designation overlay`: Overlays lesen den finalen Exact-ViewBox/Layoutkontext, dürfen aber weder Exact-Plan noch Contract, Paintowner, Geometry- oder Case-Digest rückwärts verändern. Fehlt ein Pair/Contract oder widerspricht eine Transition, wirft die Auflösung fail-closed `NotMeasuredError`.

  Dieser on-demand Buildervertrag bestimmt noch **nicht** den von `composeExact` zu konsumierenden kanonischen Plan beziehungsweise das kanonische Ergebnis. Integration behält das vollständige `ResolvedBuilderContext` einschließlich `resolved.plan` und `resolved.generatedOverlays` unverändert, aber ausschließlich ihr `exactCompositionRequest` besitzt die danach einmalige diskriminierte `selectedPlan`-/`selectedResult`-Auswahl: Für ein bekanntes Exact-Rezept/`SymbolSpec` muss `generatedOverlays` leer sein und der Request wählt den bereits vorhandenen `ExactAssetFixture.plan` beziehungsweise dessen gecachtes autoritatives Ergebnis mit unverändertem Exact-Asset-Target; für einen freien Spec wählt er `resolved.plan`. Der nachfolgende Pfad konsumiert genau **einen** ausgewählten Plan oder genau **ein** ausgewähltes gecachtes Ergebnis, niemals beide und niemals einen zweiten Plan-/Materializertyp. Er darf einen erzeugten Trace nicht nachträglich auf ein Exact-Asset oder einen Builder-Key retargeten. Nur beim freien Zweig werden anschließend alle `resolved.generatedOverlays` einschließlich unveränderter `overlayToExact`-Referenzen und `overlayToExactDigest`-Werte in Foundation-Reihenfolge angehängt.

  `deriveReachableBuilderContextSet()` sortiert/dedupliziert ausschließlich öffentliche Paare, bindet `version:'ReachableBuilderContextSet/v1'`, exakt die 247 selectable Registry-Keys, den State-DAG-Certificate und einen kanonischen Pair-Keyset-Digestinput. Die Zahl der Paare wird aus dieser vollständigen Reachability abgeleitet und nicht auf 247 festgelegt; ein Component-Key darf mehrere kanonische Kontexte besitzen. Jeder gespeicherte Context entsteht über `componentContextKey(...)`; rohe Strings und `as ComponentContextKey` sind in Produktions- und Testfixtures verboten. Der Test iteriert jeden Pair-Witness erneut durch `validateSpec`; damit kann eine spätere Regeländerung keinen veralteten Context still erhalten. `deriveReferenceComponentContextSet()` bindet separat die vollständige 413er Registry-Eingabe, die bytegleiche öffentliche Paarprojektion und die beiden disjunkten expliziten nichtöffentlichen Tabellen in `componentContextSetDigestInput`; seine Paarzahl ist exakt die Reachable-Paarzahl plus 166, nicht fest 413.

- [ ] **Step 4: Erzeuge konkrete CompositionContracts ohne Paint-Key-Aufblähung**

  Erzeuge aus jedem Pair der totalen `REFERENCE_COMPONENT_CONTEXT_SET` genau einen `CompositionContractRegistryEntry` mit `key: CompositionContractKey`, erzeugt ausschließlich durch `compositionContractKey(component,context)`. Er enthält die gebrandeten Component-/`ComponentContextKey`-/Variantwerte, die identische `access`-Klassifikation, konkretes Layoutprofil, `partFrame`, Placementregel, Anchor, Head-/Chassis-/Pictogram-/Body-Mark-Slot, Textzone und kanonische `ExactTransformSequence`; nicht anwendbare Zonen sind als diskriminierte `kind:'absent'`-Werte explizit. Alle Decimalwerte werden durch `exactDecimal` konstruiert. Öffentliche Contracts werden ausschließlich aus ihrem validierten Representative/Proof abgeleitet; `reference-only` und `direct-carrier` verwenden ausschließlich ihre explizite gemessene Registrydefinition und dürfen keine synthetische `SymbolSpec`-Repräsentation erhalten. Die Ableitung darf bestehende `profileFor`-/Validationwerte lesen, aber keine Quell-SVG-Messung vortäuschen: `evidenceState:'requires-corpus-witness'` kennzeichnet bis zum zugehörigen `CompositionContractCase` die noch ausstehenden Oracle-Witnesses. Corpus-Shards liefern für **jedes totale Pair** genau eine Fixture, Variante, einen ComponentCase/ContractCase und mindestens eine `compositionWitnessEdge`, ändern aber Registry-Key, Accessklasse oder Contractwert nicht. Contracts erscheinen nie im `PAINT_COMPONENT_REGISTRY`.

- [ ] **Step 5: Erzeuge den einen collision-safe Known-Spec→ExactAsset-Index**

  `canonicalKnownSymbolSpecDigest(spec)` ruft zuerst dieselbe vollständige öffentliche Validierung wie `resolveReachableBuilderContext` auf und hasht danach ausschließlich `canonicalJsonUtf8(spec)` mit dem bereits für `exactTransformSequenceDigest` verifizierten synchronen browserneutralen SHA-256-Kern. Es verwendet ausdrücklich die vollständige validierte `SymbolSpec` einschließlich freier Texte, designation, numerischer Werte und unverändert geordneter Arrays, **nicht** `SymbolSpecProjection`; dadurch kann ein overlay-tragender freier Spec niemals allein wegen gleicher endlicher Paintprojektion als bekanntes ExactAsset gelten. Property-Einfügereihenfolge wird durch JCS neutralisiert. Der Digesttyp ist ausschließlich `KnownSymbolSpecDigest`; rohe Strings oder ein alternativer Serializer sind unzulässig. Task 19 pinnt mindestens einen Vektor bytegleich gegen `digestCanonical(spec)`.

  `KNOWN_SYMBOL_SPEC_ASSET_INDEX` wird deterministisch aus genau zwei unabhängig gezählten Quellen gebaut: den 14 Einträgen von `BASE_SYMBOLS`, deren bekannte Specs jeweils vollständig `{ kind: entry.kind }` sind und deren ExactAsset aus dem einzigen `primary`-SourceRef-Asset entsteht, sowie allen 242 `RECIPES`, deren vollständige `recipe.spec` auf `recipe.referenceAsset` zeigt. Vor dem Mapbau werden alle 256 Source-IDs, kanonischen Specbytes, Digests und Assetziele als sortierte Allokationszeilen gehalten. Der Builder weist Duplicate Source-ID, identische kanonische Specbytes aus zwei Quellen, gleichen Digest bei verschiedenen kanonischen Bytes, gleichen Digest mit abweichendem Asset, unbekanntes/nicht eindeutiges Primary-Asset sowie fehlende oder zusätzliche Base-/Recipe-Source ab. Erst nach diesen Prüfungen projiziert er die immutable `ReadonlyMap<KnownSymbolSpecDigest, ExactAssetKey>`. Tests pinnen getrennt `14 + 242 = 256`, 256 verschiedene kanonische Bytes, 256 Digestkeys und das exakte Source-Keyset; eine künftige echte semantische Überschneidung darf die Zahl nur ändern, nachdem sie als explizite, getestete Aliasallokation mit einem einzigen identischen Assetziel modelliert und alle `256`-Invarianten gemeinsam amendiert wurde.

  Die globale Konstante ist die vollständige erwartete Allokation, nicht die Behauptung, ein partiell geladenes Batch besitze bereits alle Assets. Task 23 projiziert daraus in jede `ExactCatalogRegistry.knownSymbolSpecAssets` ausschließlich diejenigen Einträge, deren Ziel in derselben Registry unter `exactAssets` existiert und durch einen Base-Primary-Source-Match oder einen geladenen `recipeExactAssetLink` belegt ist. Der Foundation-Canary enthält daher genau seinen einen Base-Eintrag; erst die vollständige Corpus-Registry muss die komplette 256er Map besitzen. So entstehen weder dangling Partial-Registry-Ziele noch ein zweiter Lookupvertrag.

- [ ] **Step 6: Fixiere Ownership-Richtung ohne Zirkelschluss**

  `packages/catalog/src/exact/oracle-ownership-manifest.ts` importiert ausschließlich `ORACLE_MANIFEST` und Schema, niemals Batchmodule, Plans, Traces oder Corpus-Aggregatoren. Foundation exportiert den oben beschriebenen Draft. Der Corpus-Root-Integrator besitzt später genau diese Datei, ersetzt den Draft atomar durch die vollständige `FinalOracleOwnershipManifest`-Konstante und lässt die 1:1-Paintrecord-/Unique-Reuse-Gates laufen. Batches tragen in `BATCH_PARTS.ownershipEntries` ihre disjunkten Beiträge; das globale Manifest konsumiert erst bei Corpus-Finalisierung diese geprüften Beiträge. Kein Foundationtask konsumiert den späteren finalen Export als Voraussetzung seiner eigenen Erstellung.

- [ ] **Step 7: Führe GREEN und die Registry-/Inventory-Gates aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/schema/src/symbol-spec-grammar.test.ts packages/core/src/exact/symbol-spec-context.test.ts packages/core/src/validate.test.ts packages/catalog/src/exact/composition-contract-registry.test.ts packages/catalog/src/exact/reachable-builder-contexts.test.ts packages/catalog/src/exact/reference-component-contexts.test.ts packages/catalog/src/exact/known-symbol-spec-assets.test.ts packages/catalog/src/exact/oracle-ownership-manifest.test.ts packages/catalog/src/exact/paint-component-registry.test.ts packages/core/src/conformance/inventory.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; öffentliche Reachability ist exakt auf die 247 selectable Keys beschränkt, die totale Reference-Context-Menge deckt alle 413 Keys mit disjunkten 151 reference-only und 15 direct-carrier Ergänzungen ab, Contracts schließen exakt darauf, der collision-safe Known-Spec-Index besitzt exakt 256 Einträge, und der Ownership-Export ist absichtlich und sichtbar noch nicht releasefähig.

- [ ] **Step 8: Committe nur Registry-, Reachability-, Known-Spec- und Ownership-Vertrag**

  ```bash
  rtk git -c core.fsmonitor=false add packages/schema/src/symbol-spec-grammar.ts packages/schema/src/symbol-spec-grammar.test.ts packages/schema/src/index.ts packages/core/src/exact/symbol-spec-context.ts packages/core/src/exact/symbol-spec-context.test.ts packages/core/src/validate.ts packages/core/src/validate.test.ts packages/core/src/index.ts packages/catalog/src/exact/composition-contract-registry.ts packages/catalog/src/exact/composition-contract-registry.test.ts packages/catalog/src/exact/reachable-builder-contexts.ts packages/catalog/src/exact/reachable-builder-contexts.test.ts packages/catalog/src/exact/reference-component-contexts.ts packages/catalog/src/exact/reference-component-contexts.test.ts packages/catalog/src/exact/known-symbol-spec-assets.ts packages/catalog/src/exact/known-symbol-spec-assets.test.ts packages/catalog/src/exact/oracle-ownership-manifest.ts packages/catalog/src/exact/oracle-ownership-manifest.test.ts packages/catalog/src/exact/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat: prove exact builder context reachability"
  ```

---

### Task 19: SHA-256-Kanonisierung und sichere lokale OracleManifest-Grenze

**Agent ownership:** Nur `packages/cli/src/conformance/digest.ts`, `packages/cli/src/conformance/composition-finalizer.ts`, `packages/cli/src/conformance/oracle-loader.ts` und deren Tests.

**Files:**
- Create: `packages/cli/src/conformance/digest.ts`
- Create: `packages/cli/src/conformance/digest.test.ts`
- Create: `packages/cli/src/conformance/composition-finalizer.ts`
- Create: `packages/cli/src/conformance/composition-finalizer.test.ts`
- Create: `packages/cli/src/conformance/oracle-loader.ts`
- Create: `packages/cli/src/conformance/oracle-loader.test.ts`

**Interfaces:**
- Consumes: `canonicalJsonUtf8`/Paintprojektion aus Task 8, undigested Materialisierung aus Task 9, aufgelöste Zellmaske aus Task 13, vollständiges `ORACLE_MANIFEST` aus Task 16 sowie `canonicalKnownSymbolSpecDigest` und einen festen Known-Spec-Testvektor aus Task 18.
- Produces: `sha256Hex(bytes)`, `digestCanonical(value)`, `digestSortedSet(values)`, `finalizeExactComposition(plan,result): FinalizedExactCompositionRecord`, `finalizeProjectedDisplayComposition(display,result,source)`, `finalizeResolvedMask(mask): ResolvedMaskContract`, `LoadedOracleAsset`, `LoadedOracleSet`, `OracleLoadError`, `loadOracleSet(root: string, manifest: OracleManifest): LoadedOracleSet`, `selectLoadedOracleSet(fullSet, subsetManifest): LoadedOracleSet`.

- [ ] **Step 0: Lege zuerst drei compile-sichere Produktionsstubs an**

  Erzeuge Digest-, Finalizer- und Loadermodule mit allen finalen Signaturen. Digest-/Finalizerfunktionen werfen `RED: digest finalization not implemented`; `loadOracleSet`/`selectLoadedOracleSet` werfen `RED: oracle loading not implemented`. Führe `rtk mise exec -- pnpm typecheck` grün aus, bevor irgendein Test angelegt wird.

- [ ] **Step 1: Schreibe feste Digestvektoren als RED**

  ```ts
  import { describe, expect, it } from 'vitest';
  import { digestCanonical, digestSortedSet, sha256Hex } from './digest.js';

  it('bildet SHA-256 über die tatsächlichen Bytes', () => {
    expect(sha256Hex(new TextEncoder().encode('abc')))
      .toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('bindet sortierte Setwerte und weist Duplikate ab', () => {
    expect(digestSortedSet(['b', 'a'])).toBe(digestSortedSet(['a', 'b']));
    expect(() => digestSortedSet(['a', 'a'])).toThrow(/duplicate/);
    expect(digestCanonical({ b: 2, a: 1 })).toBe(digestCanonical({ a: 1, b: 2 }));
  });
  ```

  Ergänze den Overlay-Transformvektor aus Task 1 und verlange `digestCanonical(overlayToExact) === exactTransformSequenceDigest(overlayToExact)`. Für denselben vollständigen validierten Known-Spec-Testvektor aus Task 18 muss außerdem `digestCanonical(spec) === canonicalKnownSymbolSpecDigest(spec)` gelten. Eine mutierte Scale bei beibehaltenem gespeichertem `overlayToExactDigest` muss im Renderable-/Finalizerpfad vor Ausgabe scheitern; eine korrekt neu konstruierte Sequenz erhält einen anderen Digest.

- [ ] **Step 2: Schreibe Dateisystem-Angriffe gegen den Loader**

  Verwende je Test ein Verzeichnis aus `mkdtempSync(join(tmpdir(), 'exact-oracle-'))` und räume es in `afterEach` auf. Mocke für diese isolierten Unit-Tests **vor Modulimport** die Catalogkonstante `ORACLE_MANIFEST` mit einem vollständigen Zwei-Asset-Testmanifest und übergib genau denselben Wert; der Produktionspfad hat keine injizierbare Trust-Bypass-Option. Prüfe:

  - fehlender Root → `OracleLoadError.code === 'ORACLE_UNAVAILABLE'`;
  - Root als Symlink, Asset als Symlink und Asset als Verzeichnis → Fehler;
  - `../asset.svg`, absoluter Name, NUL und Nicht-`.svg` im Manifest → Fehler;
  - fehlendes, zusätzliches oder digestabweichendes Asset → `ORACLE_MISMATCH`;
  - ein nach außen zeigender Symlink wird nie gelesen;
  - Erfolgsfall liefert exakt manifest-sortierte, unveränderliche Bytes und denselben neu berechneten Set-Digest.

  Ergänze einen zweiten Manifestparameter mit nur einem der beiden Assets: `loadOracleSet(root, subset)` muss **vor jedem Rootread** mit `ORACLE_MANIFEST_NOT_FULL` scheitern. Nach erfolgreichem `loadOracleSet(root, fullManifest)` darf dagegen `selectLoadedOracleSet(full, subset)` exakt das eine Asset liefern, ohne das Root erneut zu lesen. Ein Root mit beiden vollständigen Assets darf also nie deshalb scheitern, weil der spätere Batch nur eines auswählt.

- [ ] **Step 3: Schreibe RED für die Digestgrenze zwischen Core und CLI**

  Materialisiere ein synthetisches Planliteral über Core und prüfe zuerst strukturell, dass es weder `geometryDigest` noch `compositionTraceDigest` besitzt. Danach soll `finalizeExactComposition(plan, result)` exakt `planDigest`, `geometryDigest`, `normalizedPaintListDigest`, `ownedPaintIndexDigest` und `compositionTraceDigest` ergänzen. Eine zweite Finalisierung ist bytegleich; Drawing/Trace bleiben dieselben Objektwerte. `finalizeProjectedDisplayComposition` übernimmt Geometrie/Paint/Owner-Digests vom ExactAsset, berechnet aber den Display-Trace-Digest neu. `finalizeResolvedMask` muss bei Breite 16 und 4096 verschiedene `partToViewportDigest`/`resolvedMaskDigest` liefern. Pinne zusätzlich `48×32 @ 16` als rationale Mappingmatrix mit `f=1/6`: dieselbe Größe mit `minX=3,minY=-2` hat `e=-1,f=5/6` und beide Digests müssen vom Nullursprung abweichen.

- [ ] **Step 4: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/digest.test.ts packages/cli/src/conformance/composition-finalizer.test.ts packages/cli/src/conformance/oracle-loader.test.ts`

  Expected: FAIL verhaltensbezogen mit `RED: digest finalization not implemented` beziehungsweise `RED: oracle loading not implemented`; alle Imports und Typen sind bereits grün.

- [ ] **Step 5: Implementiere Digests und Finalisierung über kanonische Bytes**

  Nutze ausschließlich `createHash('sha256')`. `digestCanonical` hasht `canonicalJsonUtf8`, `digestSortedSet` validiert String, Eindeutigkeit und nach rohen UTF-16-Codeunits sortierte Setreihenfolge und hasht die kanonische Arraykodierung. Akzeptiere keine vorgehashten oder platformabhängigen Newlineformate. Jeder Rückgabedigest läuft durch `sha256Digest`.

  `finalizeExactComposition` prüft Plan-/Targetgleichheit, normalisiert exakt das Core-Drawing, bildet den OwnedPaintIndex aus derselben Nodefolge und digested Plan, Drawing, Paintliste, Ownerindex und vollständigen Trace separat. Es mutiert das Core-Ergebnis nicht. `finalizeProjectedDisplayComposition` akzeptiert nur die über `projectDisplayComposition` erzeugte Projection und einen passenden finalisierten ExactAsset-Record; es übernimmt nur die vier identischen Plan-/Drawing-/Paint-/Owner-Digests und berechnet den Display-Trace-Digest neu. `finalizeResolvedMask` digested die konkrete Breite/Höhe/`ExactViewportMapping/v1` einschließlich aller gekürzten Zähler/Nenner und anschließend den gesamten aufgelösten Maskenwert. Diese CLI-Datei darf Schema/Core/Catalog importieren; umgekehrt darf keine Catalogdatei sie importieren.

- [ ] **Step 6: Implementiere den fd-basierten Vollset-Loader plus reine Subsetselektion**

  `loadOracleSet` führt diese Reihenfolge fail-closed aus:

  1. **Vor Rootauflösung** Manifestversion, sortierte eindeutige Namen, formale SHA-256 und `oracleSetDigest` prüfen und anschließend vollständige Key-/Digestgleichheit mit dem committed 661er `ORACLE_MANIFEST` aus Task 16 verlangen. Ein Batchsubset ist als Loaderargument immer ungültig.
  2. Root absolut auflösen, mit `lstatSync` als echtes Verzeichnis ohne Symlink prüfen und anschließend `realpathSync` binden.
  3. Verzeichnisentries gegen die exakte **volle 661er** Manifestnamensmenge vergleichen; keine unerwartete Datei wird ignoriert.
  4. Jeden Namen als reinen `basename` ohne `/`, `\\`, `..`, NUL oder absoluten Pfad validieren.
  5. Datei mit `openSync(path, O_RDONLY | O_NOFOLLOW)`, `fstatSync` und regulärem Filetyp lesen; anschließend `realpathSync` unter dem gebundenen Root und SHA-256 prüfen.
  6. Nach allen Reads das Rootlisting erneut vergleichen, um einfache Mid-Run-Mutationen zu erkennen.

  Die Rückgabe hält den Root-Realpath nur in einem nicht serialisierbaren, nicht enumerable internen Feld; keine öffentliche Diagnose, Fehlermeldung, stdout/stderr-Ausgabe, spätere Canonical-Digeststruktur oder Evidenz darf ihn aufnehmen. Fehler nennen Assetkey und erwarteten/tatsächlichen Digest, aber niemals Dateiinhalt oder Pfad.

  Erst `selectLoadedOracleSet(fullSet, subsetManifest)` validiert, dass jede Subsetzeile bytegleich im bereits geladenen Vollset existiert, und erzeugt eine neue readonly Auswahl in Comparatorreihenfolge. Die Funktion hat keinen Root-/FS-Parameter. Dadurch kann ein Batch beliebig wenige Assets selektieren, ohne zu verlangen oder zu suggerieren, dass sein Root nur diese Dateien enthält.

- [ ] **Step 7: Führe GREEN aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/digest.test.ts packages/cli/src/conformance/composition-finalizer.test.ts packages/cli/src/conformance/oracle-loader.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS.

- [ ] **Step 8: Committe nur Loader, Digest und Finalizer**

  ```bash
  rtk git -c core.fsmonitor=false add packages/cli/src/conformance/digest.ts packages/cli/src/conformance/digest.test.ts packages/cli/src/conformance/composition-finalizer.ts packages/cli/src/conformance/composition-finalizer.test.ts packages/cli/src/conformance/oracle-loader.ts packages/cli/src/conformance/oracle-loader.test.ts
  rtk git -c core.fsmonitor=false commit -m "feat: load exact oracle assets safely"
  ```

---

### Task 20: Oracle-SVG sicher parsen, Features zählen und owner-frei normalisieren

**Agent ownership:** Nur `packages/cli/package.json`, `pnpm-lock.yaml`, `packages/cli/src/conformance/oracle-parser.ts`, `oracle-svg.ts` und deren Tests.

**Files:**
- Modify: `packages/cli/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `packages/cli/src/conformance/oracle-parser.ts`
- Create: `packages/cli/src/conformance/oracle-parser.test.ts`
- Create: `packages/cli/src/conformance/oracle-svg.ts`
- Create: `packages/cli/src/conformance/oracle-svg.test.ts`

**Interfaces:**
- Consumes: `CorpusFeatureContract` aus Task 3, Loaderbytes/Assetdigest aus Task 19, gemeinsame Coverage-Projektion aus Task 13 und Dezimal/Pfad/Transform/JCS/Paint-Helfer aus Tasks 5–8.
- Produces: `OraclePaintNode`, `OraclePaintIndexV1`, `ParsedOracleSvg`, `parseOracleSvg(bytes, options)`, `serializeOracleSvg(parsed, selection?)`.

- [ ] **Step 0: Lege zuerst compile-sichere Parser-/Serializer-Stubs ohne XML-Abhängigkeit an**

  Erzeuge `oracle-parser.ts`/`oracle-svg.ts` mit allen Signaturen, aber noch ohne `saxes`-Import. Beide Funktionen werfen `RED: oracle parsing not implemented`. `rtk mise exec -- pnpm typecheck` muss vor Tests grün sein; erst in Step 4 wird die gepinnte Dependency hinzugefügt.

- [ ] **Step 1: Schreibe synthetische Parser-RED-Fixtures**

  Lege im Test Bytefixtures direkt als kleine XML-Strings an; verwende keine lokale BABZ-Datei und keinen Produktionsserializer für die Erwartung. Der Positivfall enthält Gruppe, vererbtes Fill, Rechteck, Kreis, Polygon, Polyline, relativen `c/s`-Pfad, Transform und `fill="none"`:

  ```ts
  const parsed = parseOracleSvg(new TextEncoder().encode(source), {
    oracleAssetDigest: sha256Digest('a'.repeat(64)),
    featureContract: fixtureFeatureContract,
  });
  expect(parsed.paintList.version).toBe('NormalizedPaintList/v1');
  expect(parsed.paintList.viewBox.preserveAspectRatio).toBe('xMidYMid meet');
  expect(parsed.paintList.records.map((record) => record.fill)).toEqual([
    '#000000ff', '#ffffffff', '#ff0000ff', '#00ff00ff', '#000000ff',
  ]);
  expect(parsed.oraclePaintIndex.records.map((record) => record.sourceNodeId)).toEqual([
    `oracle-paint:${'a'.repeat(64)}:0`,
    `oracle-paint:${'a'.repeat(64)}:1`,
    `oracle-paint:${'a'.repeat(64)}:2`,
    `oracle-paint:${'a'.repeat(64)}:3`,
    `oracle-paint:${'a'.repeat(64)}:4`,
  ]);
  expect(parsed.nonPainting.records).toEqual([
    expect.objectContaining({ reason: 'fill-none' }),
  ]);
  ```

  Ergänze separate Tests für depth-first Paint-Reihenfolge, implizites Schwarz/nonzero, `#rgb`/`#rrggbb`/case zu lowercase `#rrggbbaa`, ViewBox-Ursprung, Gruppen-/Leaf-Transformverkettung, `display="none"`, `visibility="hidden"` und nichtmalende Nullgeometrie.

- [ ] **Step 2: Schreibe Sicherheits- und Feature-Negativtests**

  Jeder der folgenden Strings muss mit einem stabilen Code scheitern: `DOCTYPE`, Entitydeklaration, Processing Instruction außer XML-Header, `<script>`, `<style>`, `<image>`, `<use>`, fremder Namespace, `href`, URL-Fill, CSS-`style`, Eventattribut, unbekanntes Element/Attribut, `stroke`, nicht gemessener Pathcommand, nicht gemessener Transform, externes `preserveAspectRatio` und abweichende Featurezahl.

  Prüfe außerdem, dass Featurezählung vor Polygon-/Polyline-Normalisierung erfolgt und das synthetische Ergebnis exakt Gruppen, Rects, Paths, Polygons, Circles, Polylines, Transforms und ViewBoxfamilie ausweist. Vor XML-Verarbeitung muss `parseOracleSvg` außerdem `featureContract.key === corpusFeatureContractKey(featureContract.oracleAsset)` sowie `featureContract.oracleAssetDigest === options.oracleAssetDigest` prüfen; fehlender Contract, Contract eines anderen Assets und falscher Digest erhalten getrennte stabile Fehlercodes.

- [ ] **Step 3: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/oracle-parser.test.ts packages/cli/src/conformance/oracle-svg.test.ts`

  Expected: FAIL an der positiven Parserassertion mit `RED: oracle parsing not implemented`; Import und Typecheck sind grün.

- [ ] **Step 4: Installiere den fest gepinnten Streamingparser als Teil dieses Deliverables**

  Run: `rtk mise exec -- pnpm --filter @einsatzzeichen/cli add saxes@6.0.0 --save-exact`

  Expected: `packages/cli/package.json` enthält exakt `"saxes": "6.0.0"`; `pnpm-lock.yaml` ist aktualisiert. Nimm keine zweite XML-Bibliothek auf. Führe das RED danach erneut aus; es muss weiterhin an `RED: oracle parsing not implemented` scheitern, nicht an Dependencyauflösung.

- [ ] **Step 5: Implementiere eine allowlistbasierte SAX-Zustandsmaschine**

  Verwende `SaxesParser` ohne DOM und ohne Netzwerkhook. Weise `doctype`, unbekannte Namespaces sowie jeden nicht explizit im übergebenen `CorpusFeatureContract` erlaubten Element-/Attributnamen ab. Unabhängig von der Allowlist bleiben Skript, Stylesheet, CSS-`style`, Eventattribute, `href`, URLwerte und externe Ressourcen immer verboten.

  Halte einen Stack aus berechnetem `fill`, `fillRule`, `display`, `visibility` und äußerer Transformfolge. Normalisiere Leaf-Geometrie über Tasks 5–7 und Farben ausschließlich über `canonicalizeExactColor`. Fehlendes Fill wird `#000000ff`, fehlende Fill-Rule `nonzero`, fehlendes `preserveAspectRatio` `xMidYMid meet`. `fill="none"`, verborgene und geometrisch leere Leaves gehen mit Grund in `NonPaintingInventory/v1`, nie in Paintrecords. Die fertige Folge läuft zwingend durch `defineNormalizedPaintList`; der Parser besitzt keine zweite Paint-List-Factory.

  Vergib Source-Node-IDs ausschließlich aus vollständigem Assetdigest und Paintordinal. `OraclePaintIndex/v1` enthält Source-ID, Ordinal, Paint-Record-Digest und das Ergebnis von `paintCoverageEnvelope(record)`, aber keinen Kandidatenowner. Paintrecords und Non-Painting-Records behalten gemeinsam ihre ursprüngliche Dokument-/Paintorder für spätere Isolationsanalyse; der Parser darf Bounds weder selbst berechnen noch nur ausgewählte/spätere Nodes projizieren. Prüfe die tatsächlich gezählten Features am Ende vollständig gegen `featureContract.expectedCounts`; eine Abweichung wirft `CORPUS_FEATURE_MISMATCH`.

- [ ] **Step 6: Implementiere eine sichere, normalisierte Oracle-Reserialisierung**

  `serializeOracleSvg` baut SVG ausschließlich aus `ParsedOracleSvg.paintList`; es gibt keinen Rückgriff auf Quell-XML. Ohne Selection serialisiert es alle Paintrecords, mit `{ includeSourceNodeIds }` nur die expliziten IDs, mit `{ excludeSourceNodeIds }` alle außer diesen IDs. Beide Selektionsfelder zugleich sind ungültig.

  ViewBox, Pfad und Transform stammen aus den kanonischen Records. Der Serializer emittiert weder IDs aus der Quelle noch Kommentare, Fonts, externe Links oder Metadaten. Damit sind Whole-, source-node-set- und leave-one-out-Renderings derselbe sichere Pfad.

- [ ] **Step 7: Führe GREEN und Dependency-Grenzen aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/oracle-parser.test.ts packages/cli/src/conformance/oracle-svg.test.ts packages/core/src/exact/path.test.ts packages/core/src/exact/transform.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; ein Quellformatunterschied verschwindet, jede Paint-/Transform-/Reihenfolgeänderung bleibt sichtbar.

- [ ] **Step 8: Committe Parser, Serializer und Lockfile atomar**

  ```bash
  rtk git -c core.fsmonitor=false add packages/cli/package.json pnpm-lock.yaml packages/cli/src/conformance/oracle-parser.ts packages/cli/src/conformance/oracle-parser.test.ts packages/cli/src/conformance/oracle-svg.ts packages/cli/src/conformance/oracle-svg.test.ts
  rtk git -c core.fsmonitor=false commit -m "feat: normalize local oracle SVGs"
  ```

---

### Task 21: Resvg-Vergleichszellen, Pflichtmatrix und lokale Evidenzbilder

**Agent ownership:** Nur `packages/cli/src/conformance/raster-environment.ts`, `raster.ts`, `evidence-writer.ts` und deren Tests.

**Files:**
- Create: `packages/cli/src/conformance/raster-environment.ts`
- Create: `packages/cli/src/conformance/raster-environment.test.ts`
- Create: `packages/cli/src/conformance/raster.ts`
- Create: `packages/cli/src/conformance/raster.test.ts`
- Create: `packages/cli/src/conformance/evidence-writer.ts`
- Create: `packages/cli/src/conformance/evidence-writer.test.ts`

**Interfaces:**
- Consumes: `@resvg/resvg-js` 2.6.2, Exact-/Oracle-SVG aus Tasks 10/20, Part-/Maskenauflösung aus Task 13, Digestfinalisierung aus Task 19 und RGBA-Kern aus Task 14.
- Produces: `RasterEnvironmentV1`, `measureRasterEnvironment()`, `REFERENCE_RASTER_WIDTHS`, `REFERENCE_BACKGROUNDS`, `EvidencePairKind`, `ComparisonCellInput`, `ComparisonCellEvidence`, `ComparisonMatrixInput`, `ComparisonCellResult`, `ComparisonPairResult`, `ComparisonMatrixResult`, `BatchComparisonSummary`, `BatchComparisonResult`, `buildBatchComparisonResult(batchId: ExactBatchId, caseResults: readonly ComparisonMatrixResult[]): BatchComparisonResult`, `renderComparisonCell(input)`, `renderComparisonMatrix(input)`, `writeComparisonCellEvidence(evidence, outputRoot)`, `writeComparisonMatrixManifest(result: ComparisonMatrixResult | BatchComparisonResult, outputRoot: string): void`.

- [ ] **Step 0: Lege zuerst alle compile-sicheren Raster-/Writer-Stubs an**

  Erzeuge Rasterumgebung, Raster und Writer mit sämtlichen finalen Signaturen. `renderComparisonCell`/`renderComparisonMatrix` werfen `RED: comparison rendering not implemented`; `measureRasterEnvironment` und Writer ebenso. `buildBatchComparisonResult` gibt vorerst eine formal vollständige leere/falsche Summary zurück. Führe `rtk mise exec -- pnpm typecheck` grün aus, bevor Tests entstehen.

- [ ] **Step 1: Schreibe RED für eine einzelne gemeinsame Vergleichszelle**

  Verwende ein synthetisches 4×2-ViewBox-SVG und eine äquivalente `ReferenceExactDrawing`. Prüfe transparent, schwarz und weiß mit echter Resvg-Ausgabe:

  ```ts
  const evidence = await renderComparisonCell({
    caseKey: 'asset:fixture.svg', oracle: parsedOracle,
    candidate: exactFixture, comparisonMode: 'whole',
    pair: 'full',
    raster: { width: 16, background: 'transparent' },
  });
  expect(evidence.reference).toMatchObject({ width: 16, height: 8 });
  expect(evidence.candidate).toMatchObject({ width: 16, height: 8 });
  expect(evidence.comparison).toMatchObject({
    equal: true, differentPixelCount: 0, maxChannelDelta: 0, alphaDeltaCount: 0,
  });
  expect(evidence.heatmap.pixels.every((channel) => channel === 0)).toBe(true);
  ```

  Mutierte Farbe, Pfadreihenfolge und ViewBox müssen jeweils `equal: false` oder einen Vektorvertragsfehler liefern; es gibt keine automatische Translation oder Bounds-Ausrichtung.

- [ ] **Step 2: Schreibe RED für Matrix und zwei wirklich getrennte Leave-one-out-Paare**

  `renderComparisonMatrix` erzeugt für Whole exakt `requiredPairs:['full']`, für einen Part mit gültigem `source-node-set` exakt `requiredPairs:['selected']`, jeweils genau ein `ComparisonPairResult` mit 10 × 3 = 30 sortierten Zellen. `full` rendert alle Records beider Seiten; `selected` rendert ausschließlich die Oracle-Selectors beziehungsweise die zugehörigen Candidate-Trace-Nodes. Für `leave-one-out` erzeugt es exakt `requiredPairs:['full','without-selected']` und **zwei getrennte** `ComparisonPairResult`s mit je 30 Zellen: `full` vergleicht vollständiges Oracle gegen vollständigen Kandidaten, `without-selected` das Oracle ohne alle Part-Selectors gegen den Kandidaten ohne sämtliche zugehörigen Trace-Nodes. Keine Resultfolge darf eine andere referenzieren oder ihre Metriken zusammenfassen, bevor alle Pflichtpaare vollständig bestanden sind. Pro `(width,background)` entstehen bei Leave-one-out acht Bilder: je Paar `original`, `candidate`, `overlay`, `heatmap`. Ein einzelner gecroppter/übermaskierter Vergleich oder vier Bilder, die für beide Paare wiederverwendet werden, ist verboten.

  ```ts
  expect(whole.requiredPairs).toEqual(['full']);
  expect(whole.pairResults).toHaveLength(1);
  expect(whole.pairResults[0]).toMatchObject({ pair: 'full' });
  expect(whole.pairResults[0]!.cells).toHaveLength(30);

  expect(sourceNodeSet.requiredPairs).toEqual(['selected']);
  expect(sourceNodeSet.pairResults).toEqual([
    expect.objectContaining({ pair: 'selected', cells: expect.any(Array) }),
  ]);
  expect(sourceNodeSet.pairResults[0]!.cells).toHaveLength(30);

  expect(leaveOneOut.requiredPairs).toEqual(['full', 'without-selected']);
  expect(leaveOneOut.pairResults.map(({ pair }) => pair))
    .toEqual(['full', 'without-selected']);
  expect(leaveOneOut.pairResults.map(({ cells }) => cells.length)).toEqual([30, 30]);
  expect(new Set(leaveOneOut.pairResults.flatMap(({ cells }) =>
    cells.map(({ key }) => key),
  )).size).toBe(60);
  ```

  Eine ungültige Isolation, fehlende Maske, fehlendes Pair, falsch reduzierte Trace-Node-Menge oder Vektor-Paint-List-Differenz setzt `passed: false` und benennt Case, Pair, Asset, Breite, Hintergrund sowie Digests.

  Pinne separat den Batchcontainer: `buildBatchComparisonResult('test-batch', [caseB, caseA])` ergibt `batchId: 'test-batch'` und `caseResults` in kanonischer Case-Key-Reihenfolge; `summary` enthält ausschließlich `caseCount`, `cellCount`, `passedCaseCount`, `passedCellCount`, `differentPixelCount`, `maxChannelDelta`, `alphaDeltaCount` und `failedCellKeys`. Weder `ComparisonMatrixResult` noch sein `cells`-Array erhält ein zweckentfremdetes `cases`-Feld.

- [ ] **Step 3: Schreibe RED für gepinnte tatsächliche Rasterumgebung**

  `measureRasterEnvironment()` muss die installierte Packageversion exakt als `2.6.2`, den SHA-256 von `pnpm-lock.yaml`, `@resvg/resvg-js/index.js`, `js-binding.js` und der nach einem echten Render in `require.cache` geladenen plattformspezifischen `.node`- oder WASM-Datei liefern. Der Test prüft formale Digests, existierende reguläre Dateien, `rendererContractVersion: 'ReferenceRaster/v1'` und `fontSet: []`; eine absichtlich übergebene erwartete Version `2.6.1` muss scheitern.

- [ ] **Step 4: Schreibe RED für immer erzeugte lokale Evidenz**

  Der Writer-Test verwendet ein einmaliges Verzeichnis unter `out/exact-reference/unit-writer-<prozess-id>/` und prüft pro Pair/Zelle exakt vier valide RGBA-PNGs mit Suffix `original`, `candidate`, `overlay`, `heatmap` sowie nach Finalisierung ein `matrix.json`. Auch für eine grüne Zelle müssen alle vier Bilder entstehen. Für ein synthetisches Leave-one-out-Case liegen bei jeder Breite/jedem Hintergrund acht unterschiedliche Dateien unter getrennten `/full/`- und `/without-selected/`-Segmenten; ihre 60 Zellen plus 240 PNGs sind im Manifest einzeln adressiert. Pfadtraversal, Symlinkparent, absoluter Fremdpfad und Überschreiben eines Hardlinks werden abgewiesen; `afterEach` entfernt ausschließlich dieses Testverzeichnis.

- [ ] **Step 5: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/raster-environment.test.ts packages/cli/src/conformance/raster.test.ts packages/cli/src/conformance/evidence-writer.test.ts`

  Expected: FAIL verhaltensbezogen mit `RED: comparison rendering not implemented`; Module und Typen sind bereits vorhanden.

- [ ] **Step 6: Binde die tatsächliche Rasterumgebung und implementiere genau einen Resvg-Pfad**

  Setze fest:

  ```ts
  export const REFERENCE_RASTER_WIDTHS = [16, 24, 32, 48, 64, 128, 256, 512, 2048, 4096] as const;
  export const REFERENCE_BACKGROUNDS = ['transparent', 'black', 'white'] as const;
  export type EvidencePairKind = 'full' | 'selected' | 'without-selected';

  export interface ComparisonCellEvidence {
    readonly key: string;
    readonly pair: EvidencePairKind;
    readonly reference: CanonicalRgbaImage;
    readonly candidate: CanonicalRgbaImage;
    readonly overlay: CanonicalRgbaImage;
    readonly heatmap: CanonicalRgbaImage;
    readonly comparison: RgbaComparisonResult;
    readonly vectorEqual: boolean;
    readonly partToViewportDigest?: Sha256Digest;
    readonly resolvedMaskDigest?: Sha256Digest;
  }

  export interface ComparisonPairResult {
    readonly pair: EvidencePairKind;
    readonly cells: readonly ComparisonCellResult[];
    readonly passed: boolean;
  }

  export interface ComparisonMatrixResult {
    readonly caseKey: string;
    readonly requiredPairs: readonly EvidencePairKind[];
    readonly pairResults: readonly ComparisonPairResult[];
    readonly passed: boolean;
  }

  export interface BatchComparisonResult {
    readonly version: 'BatchComparisonResult/v1';
    readonly batchId: ExactBatchId;
    readonly caseResults: readonly ComparisonMatrixResult[];
    readonly summary: BatchComparisonSummary;
    readonly passed: boolean;
  }
  ```

  `measureRasterEnvironment` löst die echten geladenen Package-/Bindingpfade über `createRequire(import.meta.url)`, `require.resolve` und nach einem Probe-Render über `require.cache` auf; es hasht die tatsächlich gelesenen Bytes und nimmt keine bloße Paketnamensannahme als Nachweis. Der `FontSet` ist die kanonisch leere Liste mit eigenem Digest.

  `renderComparisonCell` serialisiert Oracle und Kandidat für genau das explizite `input.pair` aus ihren normalisierten Strukturen und instanziiert beide mit identischen Resvg-Optionen: `fitTo: { mode: 'width', value: input.raster.width }`, keine Systemfonts, keine externen Ressourcen. `full` darf keine Selection entfernen; `selected` ist ausschließlich für einen validierten `source-node-set`-Part zulässig und enthält Oracle-seitig genau alle `sourcePaintNodes`, Candidate-seitig genau alle belegten `traceNode`s; `without-selected` ist ausschließlich für Leave-one-out zulässig und entfernt genau diese Mengen. Es prüft die ausschließlich über `rasterDimensionsForWidth` abgeleitete Höhe und übernimmt `RenderedImage.pixels` in `CanonicalRgbaImage`. Hintergrundkomposition, Maskierung, Vergleich, Overlay und Heatmap nutzen ausschließlich Task 14.

  Vor Rasterung werden die relevanten `NormalizedPaintList/v1`-Projektionen canonical verglichen. Whole/`full` verwendet alle Records, source-node-set/`selected` nur beide ausgewählten Mengen; Leave-one-out prüft getrennt alle beziehungsweise die reduzierten Restmengen. Part-Paare lösen für **diese Zellenbreite** über Task 13 Frame, `oracleToPart`/`fixtureToPart` und Profilmaske auf und finalisieren die konkrete rationale `partToViewport`-/Maskenprojektion über Task 19. `ComparisonCellResult` trägt Pair und beide aufgelösten Digests. `renderComparisonMatrix` verarbeitet genau **einen** Case, leitet `requiredPairs` ausschließlich aus Whole/source-node-set/leave-one-out ab und iteriert je Pair die zwei globalen Konstanten. Es ruft für jede der 30 beziehungsweise 60 Zellen denselben `renderComparisonCell`-Pfad; kein zweiter Rasterpfad ist zulässig. `ComparisonMatrixInput.onCell` ist ein optionaler synchroner oder asynchroner Sink. Die Matrix wartet nach jeder Zelle auf diesen Sink und behält danach in getrennten Pairresultaten nur `ComparisonCellResult` ohne Pixelpuffer, damit 4096-px-Evidenz nicht akkumuliert. Erst `buildBatchComparisonResult` sortiert mehrere per-Case-Matrizen und faltet alle Pairmetriken in eine Summary; es rendert nichts und setzt ein Leave-one-out-Case nur bei 60/60 grünen Pairzellen auf passed. `EvidencePairKind` wird ausschließlich aus diesem Foundation-Modul exportiert; Review-/Integrationscode importiert ihn und darf ihn nicht erneut deklarieren.

- [ ] **Step 7: Implementiere PNG-/JSON-Evidenz ohne neue Bildbibliothek**

  `evidence-writer.ts` kodiert RGBA/8, non-interlaced PNG mit Filter 0, `node:zlib.deflateSync`, korrekten IHDR/IDAT/IEND-Chunks und CRC32. Der Writer bindet einen realen Root ausschließlich unter `out/exact-reference/`, erstellt Verzeichnisse ohne Symlinks, schreibt temporäre Dateien mit `O_EXCL | O_NOFOLLOW`, `fsyncSync` und atomarem `renameSync`.

  `writeComparisonCellEvidence` schreibt die vier Bilder sofort unter `<case-slug>/<pair>/<width>/<background>/`; Dateinamen verwenden zusätzlich den Digest des Case-Keys und enthalten keine Orakelpfade. `writeComparisonMatrixManifest` akzeptiert ausdrücklich entweder das einzelne per-Case-Result für den Writer-Unit-Test oder den abschließenden `BatchComparisonResult`, validiert `requiredPairs`, exakt eine 30-Zellen-Folge je Pair und paarweise disjunkte Cellkeys und schreibt nach der letzten Zelle `canonicalJson(result)` plus genau ein LF. Der Batchablauf aus Task 26 übergibt ausschließlich den Batchcontainer, sodass sein `matrix.json` alle geordneten Cases/Pairs und die flache Summary enthält. Beide Resultformen enthalten nur Metriken/Digests, nie Pixel, SVG/XML oder absolute Pfade.

- [ ] **Step 8: Führe GREEN aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/raster-environment.test.ts packages/cli/src/conformance/raster.test.ts packages/cli/src/conformance/evidence-writer.test.ts packages/core/src/conformance/rgba.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; Whole hat 30 `full`-, source-node-set 30 `selected`-Zellen, Leave-one-out zwei getrennte 30-Zellen-Paare und acht Bildbelege je Width/Background.

- [ ] **Step 9: Committe Rasterumgebung, Vergleich und Evidenzpfad**

  ```bash
  rtk git -c core.fsmonitor=false add packages/cli/src/conformance/raster-environment.ts packages/cli/src/conformance/raster-environment.test.ts packages/cli/src/conformance/raster.ts packages/cli/src/conformance/raster.test.ts packages/cli/src/conformance/evidence-writer.ts packages/cli/src/conformance/evidence-writer.test.ts
  rtk git -c core.fsmonitor=false commit -m "feat: render exact comparison evidence"
  ```

---

### Task 22: Ed25519-Attestations signieren und gegen Trust Store plus Freshness prüfen

**Agent ownership:** Nur `packages/cli/src/conformance/attestation.ts` und dessen Test.

**Files:**
- Create: `packages/cli/src/conformance/attestation.ts`
- Create: `packages/cli/src/conformance/attestation.test.ts`

**Interfaces:**
- Consumes: JCS/SHA-256 aus Tasks 8/19, Schema-Attestation aus Task 4, `effectiveConformanceStatus` aus Task 15 und den allein in Task 21 definierten `EvidencePairKind`.
- Produces: den exportierten autoritativen Vertrag `RequiredConformancePair`, `attestationTrustStoreDigest(store)`, `signConformanceAttestation(unsigned, privateKey, keyId)`, `verifyConformanceAttestation(attestation, trustStore, current, requiredPairs, now): AttestationVerification`.

- [ ] **Step 0: Lege zuerst den compile-sicheren Crypto-Stub an**

  Erzeuge `attestation.ts` mit den finalen Signaturen einschließlich des exportierten `RequiredConformancePair`-Typs. Signieren wirft `RED: attestation signing not implemented`; Verifikation gibt `{status:'invalidated',issues:[{code:'red-not-implemented',detail:'RED: attestation verification not implemented'}]}` zurück. `rtk mise exec -- pnpm typecheck` muss vor dem Test grün sein.

- [ ] **Step 1: Schreibe einen echten In-Memory-Ed25519-Roundtrip als RED**

  Erzeuge im Test mit `generateKeyPairSync('ed25519')` ein flüchtiges Schlüsselpaar. Exportiere den Public Key als SPKI DER Base64url, baue einen vollständigen Trust Store und eine vollständige unsigned Attestation. Kein Keymaterial wird in eine Datei geschrieben.

  ```ts
  const signed = signConformanceAttestation(unsigned, privateKey, 'test-key-1');
  const requiredPairs = [
    { case: signed.caseKey, pair: 'full' },
  ] as const satisfies readonly RequiredConformancePair[];
  expect(signed.signature).toMatchObject({
    version: 'ConformanceSignature/v1', algorithm: 'Ed25519',
    keyId: 'test-key-1', payloadEncoding: 'RFC8785-JCS-UTF8',
  });
  expect(verifyConformanceAttestation(
    signed, trustStore, current, requiredPairs, '2026-09-04T12:00:00.000Z',
  ))
    .toEqual({ status: 'approved', issues: [] });
  ```

- [ ] **Step 2: Schreibe fail-closed Negativfälle**

  Mutiere nach Signatur einzeln `caseKey`, jeden Digest – insbesondere `reachableBuilderContextSetDigest`, `referenceComponentContextSetDigest` und `referenceComponentContextOwnershipDigest` –, `oracleAssetDigests`-Reihenfolge, `headCommit`, jeden paarbezogenen `ConformanceProvenanceRecord`, Issuer, Reviewer, ReviewedAt, Result, KeyId und Signaturalgorithmus. Prüfe außerdem einen 39-stelligen, einen 41-stelligen und einen uppercase 40-/64-stelligen `headCommit`, unbekannten Key, falschen Public Key, noch nicht gültigen, abgelaufenen und widerrufenen Key, nicht registrierten Reviewer, Trust-Store-Digestdrift und ein nicht kanonisches Base64url-Signaturfeld. Jeder Fall ergibt `invalidated` mit stabilem Code; keine Ausnahme wird als approved behandelt.

  Pinne separat drei autoritative Eingaben, die **außerhalb** der signierten Payload aus jeweils einem finalisierten ausgewählten Case stammen: Whole exakt `[{case, pair:'full'}]`, `source-node-set` exakt `[{case, pair:'selected'}]` und Leave-one-out exakt `[{case, pair:'full'},{case, pair:'without-selected'}]`. Für jede Form müssen fehlender, zusätzlicher, doppelter und case-/pair-fremder Eintrag scheitern; für Leave-one-out scheitert außerdem die vertauschte Reihenfolge. Dieselben Mutationen werden sowohl an `requiredPairs` als auch an der Provenance-Folge ausgeführt, sodass nur kanonische Reihenfolge und exakte 1:1-Gleichheit zugelassen werden. Ein vollständig neu signiertes Leave-one-out-Payload mit nur `full` darf sich insbesondere nicht selbst als vollständig autorisieren.

- [ ] **Step 3: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/attestation.test.ts`

  Expected: FAIL beim positiven Signaturroundtrip mit `RED: attestation signing not implemented`; Import und Typecheck sind grün.

- [ ] **Step 4: Implementiere die exakte Signaturpayload**

  `signConformanceAttestation` validiert `keyId`, entfernt ausschließlich `signature`, serialisiert mit `canonicalJsonUtf8` und ruft `node:crypto.sign(null, bytes, privateKey)` auf. Die Signatur wird ohne Padding als Base64url gespeichert. Die Funktion setzt keine Digests, Zeit, Issuer oder Reviewer selbst und nimmt ausschließlich eine bereits vollständige unsigned Payload entgegen.

  `attestationTrustStoreDigest` validiert eindeutige, kanonisch sortierte Keys/Reviewer und hasht den vollständigen Store per JCS. Der Store enthält nur Public Keys.

- [ ] **Step 5: Implementiere kombinierte Trust-, Signatur- und Freshnessprüfung**

  ```ts
  export interface RequiredConformancePair {
    readonly case: ConformanceCaseKey;
    readonly pair: EvidencePairKind;
  }

  export function verifyConformanceAttestation(
    attestation: ConformanceAttestation,
    trustStore: AttestationTrustStore,
    current: CurrentConformanceDigests,
    requiredPairs: readonly RequiredConformancePair[],
    now: string,
  ): AttestationVerification;
  ```

  `verifyConformanceAttestation(attestation, trustStore, current, requiredPairs, now)`:

  1. prüft Envelope-Literale, kanonisches Base64url und `headCommit` als kleingeschriebenen 40-/64-Hex-Git-OID-String;
  2. löst genau einen Key auf und bindet dessen Issuer;
  3. prüft `validFrom <= reviewedAt <= validUntil`, `now`, und `revokedAt` fail-closed;
  4. prüft Reviewer gegen die Storeliste;
  5. berechnet Storedigest und vergleicht ihn mit Attestation und Current;
  6. verifiziert Ed25519 über die JCS-Bytes ohne `signature`;
  7. validiert `requiredPairs` als separate autoritative, duplikatfreie Folge: alle Einträge gehören zum `attestation.caseKey`, und ihre Pair-Projektion ist exakt eine der drei zulässigen kanonischen Formen `['full']`, `['selected']` oder `['full','without-selected']`; keine andere Teilfolge oder Reihenfolge ist gültig;
  8. verlangt exakte geordnete 1:1-Gleichheit zwischen `requiredPairs` und den `{case: record.caseKey, pair: record.pair}`-Projektionen der Provenance-Folge, prüft deren Case-/Head-/Strict-/CaseResult-/Evidence-/Inspection-/Reviewer-Registry-Bindungen und hängt sämtliche Issues aus `conformanceFreshnessIssues` einschließlich der drei getrennten Reachable-/Reference-/Pair-Ownership-Digestvergleiche an.

  `requiredPairs` wird niemals aus `attestation.provenance`, `attestation.caseKey` oder einem anderen signierten Feld abgeleitet. Integration muss für jede zu prüfende Attestation die case-spezifische Folge aus dem zugehörigen finalisierten ausgewählten Case ableiten und unverändert übergeben. Nur eine leere Issueliste ergibt `approved`. Fehler werden deterministisch nach Prüfreihenfolge zurückgegeben; die Funktion wirft nicht für eine ungültige Fremdattestation.

- [ ] **Step 6: Führe GREEN aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/attestation.test.ts packages/core/src/conformance/status.test.ts packages/core/src/exact/canonical-json.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; jede Payloadmutation zerstört die Signatur oder Freshness, und jede Abweichung zwischen externer Pflichtpaarfolge und signierter Provenance invalidiert die Attestation.

- [ ] **Step 7: Committe die Crypto-Grenze**

  ```bash
  rtk git -c core.fsmonitor=false add packages/cli/src/conformance/attestation.ts packages/cli/src/conformance/attestation.test.ts
  rtk git -c core.fsmonitor=false commit -m "feat: verify signed conformance attestations"
  ```

---

### Task 23: Kanonischen ExactBatch-Vertrag, descriptor-driven Auswahl und Staging-Allowlist bauen

**Agent ownership:** Nur `packages/catalog/src/exact/batch-contract.ts`, `batch-staging-registry.ts`, deren Tests und `packages/catalog/src/exact/batches/index.ts`. Es existiert noch kein Canary-Import.

**Files:**
- Create: `packages/catalog/src/exact/batch-contract.ts`
- Create: `packages/catalog/src/exact/batch-contract.test.ts`
- Create: `packages/catalog/src/exact/batch-staging-registry.ts`
- Create: `packages/catalog/src/exact/batch-staging-registry.test.ts`
- Create: `packages/catalog/src/exact/batches/index.ts`

**Interfaces:**
- Consumes: Schema-Fixtures/Plans/Parts/Manifeste einschließlich `ExactBatchId` aus Task 3, `canonicalJsonUtf8` aus Task 8, `ORACLE_MANIFEST` aus Task 16, Component-/Contract-/Known-Spec-Register samt dessen intern wiederverwendbarem browserneutralem Byte-SHA-256-Kern aus Tasks 17–18 und Core-Inventargates.
- Produces: Re-Export desselben Schema-`ExactBatchId`, `compareExactBatchId(left: ExactBatchId, right: ExactBatchId): number`, `ExactBatchOwnedKeys`, `ExactBatchSetDigests`, `ExactBatchManifest`, `ExactBatchDescriptor`, `ExactBatchComponents`, `ExactBatchAssets`, `ExactBatchParts`, `ExactBatchPlans`, `ExactBatchModule`, `ExactCatalogRegistry`, `ExactBatchKeyOwnerIndex`, `StagedExactBatchOwnershipIndex`, `ReferenceComponentContextOwnershipRecord`, `ReferenceComponentContextOwnershipV1`, `deriveReferenceComponentContextOwnership(referenceSet,componentFixtures,ownerIndex): ReferenceComponentContextOwnershipV1`, `ExactBatchRelationTarget`, `ExactBatchRelationPhase = 'catalog-static' | 'oracle-finalized'`, `EXACT_BATCH_RELATIONS`, `stagedExactOwnedKeySetDigest(collection,keys): Sha256Digest`, `batchOwnedRelationTargets(current): readonly ExactBatchRelationTarget[]`, `directForeignExactBatchOwners(current,fullOwnerIndex,relationTargets): readonly ExactBatchId[]`, die einzige kanonische Form `LoadedExactBatchClosure`, `defineExactBatchManifest(manifest)`, `assertExactBatchContract(batch)`, `resolveCorpusShard(descriptor: ExactBatchDescriptor, oracleManifest: OracleManifest): OracleManifest`, `buildStagedExactBatchOwnershipIndex(descriptors): StagedExactBatchOwnershipIndex`, `buildExactBatchKeyOwnerIndex(modules)`, `exactBatchClosureIssues(descriptors,modules,closureOwnerIndex,fullOwnerIndex)`, `assertExactBatchClosure(descriptors,modules,closureOwnerIndex,fullOwnerIndex)`, `registerExactBatchModules(modules): ExactCatalogRegistry`, `STAGED_EXACT_BATCH_DESCRIPTORS`, `stagedExactBatchDescriptor(id: ExactBatchId): ExactBatchDescriptor`, `resolveStagedBatchDependencyOrder(id: ExactBatchId, descriptors: readonly ExactBatchDescriptor[]): readonly ExactBatchDescriptor[]`, `assertStagedBatchBoundary(descriptor,current)` und den einzigen produktiven Einstieg `loadStagedExactBatchClosure(id: ExactBatchId): Promise<LoadedExactBatchClosure>`.

- [ ] **Step 0: Lege zuerst alle compile-sicheren Batch-/Staging-Stubs an**

  Erzeuge die beiden Module mit den finalen Interfaces. `compareExactBatchId` besitzt bereits seine endgültige compile-sichere Implementierung: direkter Vergleich der UTF-16-Codeunits von links nach rechts, bei gemeinsamem Präfix kürzer zuerst, Rückgabe ausschließlich `-1|0|1`; `localeCompare`, `Intl.Collator` und Locale-/Plattformzustand sind verboten. `stagedExactOwnedKeySetDigest` besitzt ebenfalls bereits seine endgültige compile-sichere Implementierung: Es validiert den Collectionnamen, rohe UTF-16-Sortierung und Eindeutigkeit und bildet über `canonicalJsonUtf8([collection, ...keys])` mit demselben browserneutralen SHA-256-Kern den Digest; dadurch kann der Pre-Import-Index Descriptor-Digests wirklich prüfen. Definiere auch die finalen readonly Shapes `ReferenceComponentContextOwnershipRecord` und `ReferenceComponentContextOwnershipV1`; `deriveReferenceComponentContextOwnership` wirft im Stub `RED: reference component context ownership not implemented`. `defineExactBatchManifest`/`assertExactBatchContract`/`resolveCorpusShard`/`assertStagedBatchBoundary`/`assertExactBatchClosure` werfen vorerst `RED: batch contract not implemented`; `batchOwnedRelationTargets`/`directForeignExactBatchOwners` werfen `RED: dependency ownership derivation not implemented`, `buildStagedExactBatchOwnershipIndex`/`buildExactBatchKeyOwnerIndex` und `registerExactBatchModules` liefern formal typisierte leere Ergebnisse. `STAGED_EXACT_BATCH_DESCRIPTORS` und der Root-Aggregator sind leere readonly Folgen; der einzige exportierte Closure-Loader wirft `UNKNOWN_STAGED_BATCH`, der reine Dependency-Resolver `RED: dependency order not implemented`. Ein nicht exportierter `loadDescriptorModule(descriptor)` darf als Implementierungsdetail existieren, ist aber weder öffentliche API noch separat aufrufbarer Produktionspfad. `rtk mise exec -- pnpm typecheck` muss vor Tests grün sein.

- [ ] **Step 1: Schreibe RED für feste Shards, konkrete Contracts und jede Besitzmenge**

  Erzeuge im Test zwei kleine vollständige Batchmodule. Prüfe Positivregistrierung sowie Duplicate Asset, unmanifestierten Part, 13 Assets, zwei Componentfamilien, fehlenden Shardexport, Key ohne Daten, Daten ohne Key, fremde Batchkante, unsortierte/duplizierte Keys, falschen Setdigest, fehlenden `recipeExactAssetLink`, fehlenden konkreten CompositionContract, fehlenden/duplizierten `ComponentCase` und einen Oraclekey außerhalb des 661er Manifests. Baue außerdem ein schema-neutrales totales Reference-Set, eine exakt bijektive Fixture-Map und den aus Manifesten konstruierten `ExactBatchKeyOwnerIndex.componentFixtures`; der abgeleitete Ownershipvertrag muss genau einen kanonisch sortierten `(component,context,fixture,owner)`-Record je totalem Paar liefern. Fehlendes Paar/Fixture/Owner-Ende, zwei Fixtures für dasselbe Paar, eine Fixture für zwei Paare, Duplicate-Owner, ein Owner außerhalb der Descriptor-Manifestownership und ein fremdes Fixture-Keyset schlagen mit getrennten stabilen Issuecodes fehl. Gleiche Records in anderer Eingabereihenfolge liefern bytegleich denselben `digestInput`; jede Mutation eines der vier Recordfelder ändert ihn.

  Ein `componentFamily: null`-Batch muss exakt leere `BATCH_COMPONENTS` akzeptieren, seine individuelle sichtbare Geometrie aber über `BATCH_ASSETS.assetFragments` materialisieren. Verschiebe dieselbe Fragmentzeile testweise in `BATCH_COMPONENTS.fragments`; der Contract muss `family-none-components-not-empty` melden. Prüfe außerdem, dass `BATCH_PLANS` bei einem eingeschmuggelten `trace`- oder `useEdges`-Feld fail-closed scheitert. Die einzige zulässige Feldbenennung lautet `components.compositionWitnessEdges` und `assets.displayFixtures`; Laufzeitobjekte mit den Aliasnamen `witnessEdges`, `witnesses`, `displays` oder `displayCases` an der falschen Stelle werden als unbekannte Felder abgewiesen.

- [ ] **Step 2: Schreibe RED für descriptor-driven Auswahl und Staginggrenze**

  `resolveCorpusShard(descriptorA, ORACLE_MANIFEST)` muss ausschließlich die im Descriptor genannten, bytegleichen Manifestzeilen selektieren und dessen `oracleAssetSetDigest` übernehmen. Es bekommt weder Batchmodul noch Aggregator. Fehlender/zusätzlicher/duplizierter Oraclekey, fremder Hash oder falscher Subsetdigest scheitert.

  `assertStagedBatchBoundary(descriptor,current)` verlangt ausschließlich Gleichheit von Descriptor-ID, Familie, Oraclekeys, Oracle-Setdigest, allen 21 `ownedKeys`-Folgen und allen 21 `setDigests` mit dem Current-Manifest sowie die fünf kanonischen Modulpfade. Tests weisen Traversal, absolute Pfade, Symlink-/Globsyntax, falsches Verzeichnis, unbekannte ID und jede Descriptor↔Manifest-Abweichung ab. Dependency-Syntax/-Graph/-Minimalität gehört ausschließlich dem Resolver beziehungsweise `assertExactBatchClosure`, nicht dieser lokalen Grenze. `loadStagedExactBatchClosure('unknown')` scheitert ohne Importversuch.

  Teste `resolveStagedBatchDependencyOrder` mit einer synthetischen literal Allowlist: ein Diamant `a <- {b,c} <- d` ergibt bei wiederholter Auflösung exakt und deterministisch `[a,b,c,d]`, unabhängig davon, an welchen Positionen die vier Descriptoren in der Allowlist stehen. Unbekannte Root-ID, fehlende/unknown Dependency-ID, Self-Edge, Zyklus und doppelte Dependency scheitern jeweils mit `UNKNOWN_STAGED_BATCH`, `MISSING_STAGED_DEPENDENCY`, `SELF_STAGED_DEPENDENCY`, `CYCLIC_STAGED_DEPENDENCY` beziehungsweise `DUPLICATE_STAGED_DEPENDENCY`. Die Graphsemantik, nicht eine künstliche Listenreihenfolge, entscheidet Zulässigkeit. Ein synthetischer `base-formation-canary`-Descriptor mit `readonlyDependencies: []` ergibt eine Closure-Reihenfolge nur aus dem Current-Descriptor; als `LoadedExactBatchClosure` projiziert sind `dependencies` exakt leer und `current.manifest.id` exakt `base-formation-canary`. Ein separater Registrytest lässt Dependency und Current denselben Fragmentkey besitzen und erwartet die bestehende batchübergreifende Duplicate-Key-Verletzung. Kein Test setzt Registrierung im finalen `EXACT_BATCH_MODULES` voraus.

  Halte die lokale Descriptorgrenze und die Closureprüfung getrennt: `assertStagedBatchBoundary(descriptor,current)` prüft ausschließlich Descriptor↔Current-ID/Familie/Oraclekeys/Owned-Keysets/Digests/Modulpfade und kennt weder andere Descriptoren noch Dependency-Semantik. `buildStagedExactBatchOwnershipIndex(STAGED_EXACT_BATCH_DESCRIPTORS)` prüft dagegen **vor jedem Modulimport** die vollständige globale Descriptor-Ownership; `assertExactBatchClosure(descriptorSequence,modules,closureOwnerIndex,fullOwnerIndex)` prüft danach den geladenen Graph. Pinne für `a <- {b,c} <- d`: fehlendes `d -> b`, redundantes direktes `d -> a` trotz transitiver Erreichbarkeit über `b|c`, das gültige `d -> [b,c]`, und einen Key, dessen Full-Owner-Index fälschlich auf einen unbekannten Batch zeigt.

  Pinne den gemeinsamen Sortiervertrag unabhängig: `compareExactBatchId('a','a') === 0`, `compareExactBatchId('a','aa') === -1`, für eine nicht-ASCII-Testfolge entscheidet ausschließlich die tatsächliche UTF-16-Codeunitfolge. Für jedes Paar gilt `sign(compare(a,b)) === -sign(compare(b,a))`; wiederholtes Sortieren mehrerer Permutationen liefert bytegleich dieselbe Folge. Dependencylisten, topologische Tie-Breaks, Registry-`batchIds` und spätere Corpus-Descriptorerzeugung müssen exakt diesen Export verwenden.

  ```ts
  export type ExactBatchKeyOwnerIndex = {
    readonly [K in keyof ExactBatchOwnedKeys]: ReadonlyMap<
      ExactBatchOwnedKeys[K][number],
      ExactBatchId
    >;
  };
  export type StagedExactBatchOwnershipIndex = ExactBatchKeyOwnerIndex;
  export interface ReferenceComponentContextOwnershipRecord {
    readonly component: ComponentKey;
    readonly context: ComponentContextKey;
    readonly fixture: ComponentFixtureKey;
    readonly owner: ExactBatchId;
  }
  export interface ReferenceComponentContextOwnershipV1 {
    readonly version: 'ReferenceComponentContextOwnership/v1';
    readonly records: readonly ReferenceComponentContextOwnershipRecord[];
    readonly digestInput: readonly string[];
  }
  export function deriveReferenceComponentContextOwnership(
    referenceSet: ReferenceComponentContextSetV1,
    componentFixtures: ReadonlyMap<ComponentFixtureKey, ExactComponentFixture>,
    ownerIndex: ExactBatchKeyOwnerIndex,
  ): ReferenceComponentContextOwnershipV1;
  export interface ExactBatchRelationTarget {
    readonly relation: string;
    readonly sourceKey: string;
    readonly targetCollection: keyof ExactBatchOwnedKeys;
    readonly targetKey: ExactBatchOwnedKeys[keyof ExactBatchOwnedKeys][number];
  }
  export function batchOwnedRelationTargets(
    current: ExactBatchModule,
  ): readonly ExactBatchRelationTarget[];
  export function directForeignExactBatchOwners(
    current: ExactBatchModule,
    fullOwnerIndex: StagedExactBatchOwnershipIndex,
    relationTargets: readonly ExactBatchRelationTarget[],
  ): readonly ExactBatchId[];
  ```

  Ergänze Dependency-REDs, die keine Plan-/Fragmentkante als Ausweg besitzen: Current hat einmal ausschließlich eine `compositionWitnessEdges.oraclePart`-/`exactAsset`-Referenz auf Dependency, einmal ausschließlich eine Display-/Case-Referenz auf einen Dependency-`OraclePart` und einmal einen Current-owned `OraclePart`, dessen kanonisch abgeleiteter FeatureContract in Dependency liegt. `batchOwnedRelationTargets(current)` extrahiert diese gespeicherten Zielkeys ohne Registryauflösung; `directForeignExactBatchOwners(current, fullOwnerIndex, relationTargets)` muss jeweils genau `[dependency.id]` liefern. Eine Ownership-only-Referenz wird ebenso erfasst. Entfernen von `d -> b` muss weiterhin `MISSING_STAGED_DEPENDENCY` erzeugen, obwohl `b` dadurch nicht zur geladenen Modulclosure gehört; der vorab aus **allen** Descriptoren gebaute Full-Owner-Index löst den Zielkey trotzdem eindeutig auf. Hinzufügen eines Batches ohne irgendeine durch `EXACT_BATCH_RELATIONS` nachgewiesene Current-Referenz erzeugt `REDUNDANT_STAGED_DEPENDENCY`.

  Pinne die Anti-Self-Authorization separat: Ein Descriptor mit gegenüber seinem Manifest gefälschtem `ownedKeys`-Eintrag, ein falscher oder zu einer anderen Keyfolge gehörender Descriptor-`setDigests`-Wert, derselbe Key unter zwei Descriptor-Ownern, ein Owner auf unbekannte Descriptor-ID sowie fehlende/zusätzliche der 21 Ownershipfolgen scheitern vor Modulimport. Das Testport zählt Modulimports und bleibt in all diesen Fällen bei null. Ein Angreifer darf weder durch Entfernen des Zielkeys aus dem Current-Descriptor noch durch Erfinden des Keys im Current-Ownerbestand eine Dependency legitimieren: Relationtargets stammen aus dem geladenen Current-Modul, Owner ausschließlich aus dem zuvor validierten vollständigen Descriptorindex, und `assertStagedBatchBoundary` bindet danach jeden geladenen Descriptor bytegleich an sein Manifest.

- [ ] **Step 3: Führe das Verhaltens-RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/catalog/src/exact/batch-contract.test.ts packages/catalog/src/exact/batch-staging-registry.test.ts`

  Expected: FAIL am gültigen Batch mit `RED: batch contract not implemented`; alle Module und Typen sind bereits auflösbar.

- [ ] **Step 4: Implementiere exakt eine unveränderliche Shardform**

  ```ts
  export interface ExactBatchOwnedKeys {
    readonly fragments: readonly ReferenceExactFragmentKey[];
    readonly assetFragments: readonly ReferenceExactFragmentKey[];
    readonly variants: readonly ExactComponentVariantKey[];
    readonly componentFixtures: readonly ComponentFixtureKey[];
    readonly componentCases: readonly ConformanceCaseKey[];
    readonly compositionContracts: readonly CompositionContractKey[];
    readonly compositionContractCases: readonly CompositionContractCaseKey[];
    readonly compositionWitnessEdges: readonly CompositionWitnessEdgeKey[];
    readonly oracleFeatureContracts: readonly CorpusFeatureContractKey[];
    readonly exactAssets: readonly ExactAssetKey[];
    readonly displayFixtures: readonly DisplayKey[];
    readonly assetCases: readonly string[];
    readonly displayCases: readonly string[];
    readonly recipeExactAssetLinks: readonly string[];
    readonly oracleParts: readonly OraclePartKey[];
    readonly comparisonProfiles: readonly ComparisonProfileId[];
    readonly maskContracts: readonly string[];
    readonly ownershipEntries: readonly string[];
    readonly plans: readonly string[];
    readonly compositionTraces: readonly string[];
    readonly useEdges: readonly UseEdgeKey[];
  }

  export type ExactBatchSetDigests = {
    readonly [K in keyof ExactBatchOwnedKeys]: Sha256Digest;
  };

  export interface ExactBatchManifest {
    readonly version: 'ExactBatchManifest/v1';
    readonly id: ExactBatchId;
    readonly componentFamily: PaintComponentFamily | null;
    readonly oracleAssetKeys: readonly OracleAssetKey[];
    readonly oracleAssetSetDigest: Sha256Digest;
    readonly ownedKeys: ExactBatchOwnedKeys;
    readonly setDigests: ExactBatchSetDigests;
  }

  export interface ExactBatchDescriptor {
    readonly version: 'ExactBatchDescriptor/v1';
    readonly id: ExactBatchId;
    readonly componentFamily: PaintComponentFamily | null;
    readonly oracleAssetKeys: readonly OracleAssetKey[];
    readonly oracleAssetSetDigest: Sha256Digest;
    readonly ownedKeys: ExactBatchOwnedKeys;
    readonly setDigests: ExactBatchSetDigests;
    readonly readonlyDependencies: readonly ExactBatchId[];
    readonly modules: {
      readonly manifest: string; readonly components: string;
      readonly assets: string; readonly parts: string; readonly plans: string;
    };
  }

  export interface ExactBatchComponents {
    readonly fragments: readonly ReferenceExactFragment[];
    readonly variants: readonly ExactComponentVariant[];
    readonly fixtures: readonly ExactComponentFixture[];
    readonly componentCases: readonly ComponentCase[];
    readonly compositionContracts: readonly CompositionContract[];
    readonly contractCases: readonly CompositionContractCase[];
    readonly compositionWitnessEdges: readonly CompositionWitnessEdge[];
  }
  export interface ExactBatchAssets {
    readonly assetFragments: readonly ReferenceExactFragment[];
    readonly oracleFeatureContracts: readonly CorpusFeatureContract[];
    readonly exactAssets: readonly ExactAssetFixture[];
    readonly displayFixtures: readonly DisplayFixture[];
    readonly assetCases: readonly AssetCase[];
    readonly displayCases: readonly DisplayCase[];
    readonly recipeExactAssetLinks: readonly RecipeExactAssetLink[];
  }
  export interface ExactBatchParts {
    readonly oracleParts: readonly OraclePart[];
    readonly comparisonProfiles: readonly ComparisonProfile[];
    readonly maskContracts: readonly MaskContract[];
    readonly ownershipEntries: readonly OracleOwnershipEntry[];
  }
  export interface ExactBatchPlans { readonly plans: readonly CompositionPlan[]; }
  export interface ExactBatchModule {
    readonly manifest: ExactBatchManifest;
    readonly components: ExactBatchComponents;
    readonly assets: ExactBatchAssets;
    readonly parts: ExactBatchParts;
    readonly plans: ExactBatchPlans;
  }

  export interface LoadedExactBatchClosure {
    readonly dependencies: readonly ExactBatchModule[];
    readonly current: ExactBatchModule;
  }

  export interface ExactCatalogRegistry {
    readonly batchIds: readonly ExactBatchId[];
    readonly modulesById: ReadonlyMap<ExactBatchId, ExactBatchModule>;
    readonly fragments: ReadonlyMap<ReferenceExactFragmentKey, ReferenceExactFragment>;
    readonly componentFragments: ReadonlyMap<ReferenceExactFragmentKey, ReferenceExactFragment>;
    readonly assetFragments: ReadonlyMap<ReferenceExactFragmentKey, ReferenceExactFragment>;
    readonly variants: ReadonlyMap<ExactComponentVariantKey, ExactComponentVariant>;
    readonly componentFixtures: ReadonlyMap<ComponentFixtureKey, ExactComponentFixture>;
    readonly componentCases: ReadonlyMap<ConformanceCaseKey, ComponentCase>;
    readonly compositionContracts: ReadonlyMap<CompositionContractKey, CompositionContract>;
    readonly compositionContractCases: ReadonlyMap<CompositionContractCaseKey, CompositionContractCase>;
    readonly compositionWitnessEdges: ReadonlyMap<CompositionWitnessEdgeKey, CompositionWitnessEdge>;
    readonly oracleFeatureContracts: ReadonlyMap<CorpusFeatureContractKey, CorpusFeatureContract>;
    readonly exactAssets: ReadonlyMap<ExactAssetKey, ExactAssetFixture>;
    readonly knownSymbolSpecAssets: KnownSymbolSpecAssetIndex;
    readonly reachableBuilderContextSet: ReachableBuilderContextSetV1;
    readonly referenceComponentContextSet: ReferenceComponentContextSetV1;
    readonly displayFixtures: ReadonlyMap<DisplayKey, DisplayFixture>;
    readonly assetCases: ReadonlyMap<string, AssetCase>;
    readonly displayCases: ReadonlyMap<string, DisplayCase>;
    readonly recipeExactAssetLinks: ReadonlyMap<RecipeKey, RecipeExactAssetLink>;
    readonly oracleParts: ReadonlyMap<OraclePartKey, OraclePart>;
    readonly comparisonProfiles: ReadonlyMap<ComparisonProfileId, ComparisonProfile>;
    readonly maskContracts: ReadonlyMap<string, MaskContract>;
    readonly ownershipEntries: ReadonlyMap<string, OracleOwnershipEntry>;
    readonly plans: ReadonlyMap<string, CompositionPlan>;
    readonly compositionTraces: ReadonlyMap<string, CompositionTrace | DisplayCompositionTrace>;
    readonly useEdges: ReadonlyMap<UseEdgeKey, UseEdge>;
    readonly conformanceCases: ReadonlyMap<ConformanceCaseKey, ConformanceCase>;
  }
  ```

  Dies sind die einzigen Shardcontainer. `BATCH_COMPONENTS` besitzt die **konkreten** CompositionContracts, `compositionWitnessEdges` und für jede eigene ComponentFixture exakt einen `componentCase`. Ownership/Profile/Mask liegen ausschließlich in `BATCH_PARTS`; Recipe→ExactAsset-Kanten und family-none-spezifische IR ausschließlich in `BATCH_ASSETS`. `BATCH_PLANS` enthält nur Plans. Traces und UseEdges werden materialisiert/abgeleitet; ihr erwartetes Keyset und Digest stehen dennoch in Manifest `ownedKeys`/`setDigests`. `ExactCatalogRegistry.conformanceCases` ist die kanonisch sortierte, duplikatfreie Union aus Asset-, Display- und ComponentCases und damit die Foundationquelle des späteren Corpus-Exports `CONFORMANCE_CASES`. `knownSymbolSpecAssets` ist keine 22. gespeicherte Batchcollection: sie wird ausschließlich aus Task 18s collision-safe 256er Allokation, den in derselben Registry vorhandenen `exactAssets`, Base-Primary-Source-Matches und `recipeExactAssetLinks` abgeleitet. `reachableBuilderContextSet` und `referenceComponentContextSet` sind ebenfalls keine Batchcollections oder Ownerquellen, sondern objektidentische Task-18-Verträge: ersterer bleibt die einzige öffentliche Specauflösung; letzterer ist die totale zulässige Pairmenge für Varianten, Fixtures, Contracts, Cases, Witnesses und Component-Review. Auch `ReferenceComponentContextOwnershipV1` ist ausdrücklich keine 22. `ExactBatchOwnedKeys`-Collection und keine handgeschriebene Tabelle: sie ist eine rein abgeleitete, jederzeit verwerf- und reproduzierbare Sicht auf bestehende Fixture-Manifestownership.

  `deriveReferenceComponentContextOwnership(referenceSet, componentFixtures, ownerIndex)` verlangt zuerst die exakte Bijektion `set(componentFixtures.values().(component,context)) = set(referenceSet.pairs.(component,context))`. Danach löst es für jede genau einmal verwendete Fixture ausschließlich `ownerIndex.componentFixtures.get(fixture.key)` auf; dieser Teilindex stammt aus `ExactBatchManifest.ownedKeys.componentFixtures` der Descriptor-/Modulmenge und niemals aus dem Reference-Set, einer Fixture-Payload oder einer zweiten Ownerallokation. Es verwirft fehlende oder doppelte Paare, fehlende oder mehrfach verwendete Fixtures, fehlende beziehungsweise mehrdeutige Fixture-Owner, Keys außerhalb der manifestierten Fixture-Keymenge und Owner-IDs außerhalb der zugehörigen Descriptor-Manifestmenge. Das Ergebnis wird per `compareExactBatchId` und rohem UTF-16-Vergleich kanonisch nach `(component,context,fixture,owner)` sortiert. `digestInput` ist die flache vollständige JCS-fähige Stringfolge `['ReferenceComponentContextOwnership/v1', 'component', component, 'context', context, 'fixture', fixture, 'owner', owner, ...]` über alle sortierten Records; die feste Vierfeld-Markierung verhindert Mehrdeutigkeit, enthält jedes Recordfeld genau einmal und keinen bereits berechneten Digest. Die CLI bildet daraus später `referenceComponentContextOwnershipDigest = digestCanonical(ownership.digestInput)`.

  `defineExactBatchManifest` prüft alle Arrays sortiert/eindeutig, alle 21 Digestfelder formal, höchstens zwölf ExactAssets und höchstens eine nichtleere Familie. `assertExactBatchContract` vergleicht jede gespeicherte Collection exakt mit ihrem `ownedKeys`-Array, erzwingt insbesondere `set(componentCases.componentFixture) === set(components.fixtures.key)`, validiert alle rein batchintern entscheidbaren Referenzen und verlangt für jeden ContractCase einen manifestierten Contract. Jedes im Batch gespeicherte `(component,context,contract)`-Tripel muss exakt einmal in `REFERENCE_COMPONENT_CONTEXT_SET` vorkommen und die `CompositionContract.access`-Klasse bytegleich übernehmen; ein nichtöffentlicher Context darf niemals über `REACHABLE_BUILDER_CONTEXT_SET` legitimiert werden. `compositionTraces`/`useEdges` werden aus Plans plus Displayprojektionen abgeleitet und gegen die erwarteten Sets geprüft. Jeder `ExactBatchDescriptor` dupliziert verpflichtend die vollständigen 21 `ownedKeys` und deren 21 `setDigests` aus dem zugehörigen Manifest, damit die globale Ownership vor Modulimport feststeht; ausschließlich der Descriptor deklariert bereits akzeptierte Vorgängerbatches über `readonlyDependencies`. Diese Duplikation ist keine Autorisierung durch Current: globale Duplicate-/Digestprüfungen laufen vor Import, Relationtargets werden später aus Current-Daten extrahiert und `assertStagedBatchBoundary` vergleicht jeden geladenen Descriptor bytegleich mit seinem Manifest. Batchübergreifende Referenzen werden erst gegen die aus Dependency-Modulen plus Current gebaute Registry aufgelöst. Der Catalog prüft Setgleichheit und formale Digestbindung; der CLI-Batchcheck berechnet in Task 26 jeden `setDigests`-Wert frisch.

- [ ] **Step 5: Implementiere reine Shardauflösung, Registry und dynamische Staging-Allowlist**

  `resolveCorpusShard(descriptor, oracleManifest)` prüft zuerst, dass `oracleManifest` das vollständige 661er Manifest ist, selektiert daraus danach die Descriptorzeilen und gibt ein metadata-only Subsetmanifest mit Descriptor-Setdigest zurück. Diese Funktion liest kein Batchmodul, keinen Aggregator und kein Dateisystem; das Subset ist ausschließlich für `selectLoadedOracleSet`, niemals für `loadOracleSet`.

  `registerExactBatchModules` sortiert nach Batch-ID, ruft je Batch den Contract auf, vereinigt **zuerst alle** gespeicherten/abgeleiteten Collections in die oben vollständig benannten readonly Maps und weist jeden batchübergreifenden Doppelkey ab. Jede erzeugte Registry hält `reachableBuilderContextSet === REACHABLE_BUILDER_CONTEXT_SET` und `referenceComponentContextSet === REFERENCE_COMPONENT_CONTEXT_SET` objektidentisch; geladene Componentpaare müssen eine duplicatefreie Teilmenge des totalen Sets sein. Erst die finale Corpus-Vollregistry muss für Varianten, Fixtures, Contracts, ContractCases, ComponentCases und Witnesses exakt auf dessen vollständige Paarmenge schließen. Der Vollregistry-Test ruft danach `deriveReferenceComponentContextOwnership` mit genau dieser Registry, ihrer `componentFixtures`-Map und `buildExactBatchKeyOwnerIndex(EXACT_BATCH_MODULES)` auf; er prüft die totale Pair↔Fixture-Bijektion und manifestgebundene Ownerauflösung, speichert das Resultat aber nicht als Registry- oder Batchcollection. Erst diese Post-Union-Sicht wird validiert; eine per-Prefix-Prüfung darf keine künstliche lineare Batchreihenfolge erzwingen. `EXACT_BATCH_RELATIONS` ist die eine ausführbare, kanonisch sortierte Relationstabelle. Jeder Descriptor trägt verpflichtend `phase: ExactBatchRelationPhase`; es gibt keine zweite implizite Relationstabelle. Die Phase `oracle-finalized` tragen exakt `manifest.setDigests.<each of 21 fields>`, `exactAssets/componentFixtures` fünf erwartete Finalisierungsdigests, `displayFixtures.expectedProjectedTraceDigest`, `assetCases/displayCases/componentCases.*Digest`, `oracleParts.sourcePaintNodes` und `ownershipEntries.(asset,paintNode)`. Alle übrigen unten aufgeführten Zeilen tragen `catalog-static`. Die Tabelle enthält exakt folgende Zeilen (bei `1↔1` muss zusätzlich das Ziel-Keyset rückwärts vollständig sein; `1..n` bedeutet mindestens ein Ziel, `0..1` ein optionaler diskriminierter Endpunkt):

  | Source collection.field | Target | Cardinality / invariant |
  |---|---|---|
  | `manifest.ownedKeys.<each of 21 fields>` | gleichnamige gespeicherte oder abgeleitete Collection | `1↔1` Keysetgleichheit |
  | `manifest.setDigests.<each of 21 fields>` | frisch finalisiertes Keyset der gleichnamigen gespeicherten oder abgeleiteten Collection | genau `1`, bytegleich |
  | `variants.component` | `PAINT_COMPONENT_REGISTRY` | genau `1` |
  | `variants.fragment` | `componentFragments` | genau `1` |
  | `variants.(component,context)` | `REFERENCE_COMPONENT_CONTEXT_SET` und `COMPOSITION_CONTRACT_REGISTRY`-Pair | genau `1`; Accessklasse liegt kanonisch auf Total-Pair/Contract |
  | `componentFixtures.component` | `PAINT_COMPONENT_REGISTRY` | genau `1` |
  | `componentFixtures.(component,context)` | `REFERENCE_COMPONENT_CONTEXT_SET` und `COMPOSITION_CONTRACT_REGISTRY`-Pair | genau `1`; Accessklasse liegt kanonisch auf Total-Pair/Contract |
  | `componentFixtures.variant` | `variants` | genau `1` und gleicher Component/Context |
  | `componentFixtures.plan` | `plans` | genau `1` und Target dieser Fixture |
  | `componentCases.componentFixture` | `componentFixtures` | `1↔1` |
  | `compositionContracts.key` | `compositionContractKey(component,context)` | genau `1`, kanonisch abgeleitet |
  | `compositionContracts.(component,context,access)` | `REFERENCE_COMPONENT_CONTEXT_SET` | genau `1` für jedes geladene Pair; finale Vollregistry `1↔1` zur Totalmenge |
  | `compositionContracts.variant` | `variants` | genau `1` |
  | `compositionContractCases.key` | `compositionContractCaseKey(contract)` | genau `1`, kanonisch abgeleitet |
  | `compositionContractCases.contract` | `compositionContracts` | `1↔1` |
  | `compositionWitnessEdges.key` | `compositionWitnessEdgeKey(contract,exactAsset/oraclePart/componentFixture/traceNode)` | genau `1`, kanonisch abgeleitet |
  | `compositionWitnessEdges.contract` | `compositionContracts` | `1..n` pro ContractCase |
  | `compositionWitnessEdges.exactAsset` | `exactAssets` | genau `1` |
  | `compositionWitnessEdges.oraclePart` | `oracleParts` | genau `1` |
  | `compositionWitnessEdges.componentFixture` | `componentFixtures` | genau `1` |
  | `compositionWitnessEdges.traceNode` | `compositionTraces.nodes` | genau `1` |
  | `oracleFeatureContracts.key` | `corpusFeatureContractKey(oracleAsset)` | genau `1`, kanonisch abgeleitet |
  | `oracleFeatureContracts.oracleAsset` | `ORACLE_MANIFEST.assets` und Current-`exactAssets.oracle` | `1↔1` für jedes vom Current-Batch besessene OracleAsset |
  | `oracleFeatureContracts.oracleAssetDigest` | Digest derselben `ORACLE_MANIFEST`-Zeile | genau `1`, bytegleich |
  | `exactAssets.oracle` | `ORACLE_MANIFEST.assets` und der kanonisch abgeleitete `corpusFeatureContractKey(oracle)` in `oracleFeatureContracts` | je genau `1` |
  | `exactAssets.oracleAssetDigest` | Digest der referenzierten `ORACLE_MANIFEST`-Zeile | genau `1`, bytegleich |
  | `exactAssets.plan` | `plans` | genau `1` |
  | `exactAssets/componentFixtures` fünf erwartete Finalisierungsdigests | finalisierter Plan-/Geometry-/Paint-/Ownership-/Trace-Wert | je genau `1`, bytegleich |
  | `knownSymbolSpecAssets.(digest,exactAsset)` | `KNOWN_SYMBOL_SPEC_ASSET_INDEX` und `exactAssets` | abgeleitete `1↔1`-Teilprojektion aller geladenen Base-/Recipe-Sources; Digest und Ziel bytegleich |
  | `assetCases.exactAsset` | `exactAssets` | `1↔1` |
  | `displayFixtures.exactAsset` | `exactAssets` | genau `1` |
  | `displayFixtures.oraclePart` | `oracleParts` | `0..1`, genau `1` wenn Display part-basiert ist |
  | `displayFixtures.expectedProjectedTraceDigest` | finalisierte Displayprojektion | genau `1`, bytegleich |
  | `displayCases.displayFixture` | `displayFixtures` | `1↔1` |
  | `assetCases/displayCases/componentCases.*Digest` | jeweils referenzierte finalisierte Asset-/Display-/Component-Fixturewerte | genau `1`, Digest bytegleich |
  | `recipeExactAssetLinks.recipe` | `RECIPES` | höchstens `1` Link pro Recipe; unbekannt verboten |
  | `recipeExactAssetLinks.exactAsset` | `exactAssets` | genau `1` |
  | `oracleParts.asset` | `ORACLE_MANIFEST.assets` und der kanonisch abgeleitete `corpusFeatureContractKey(asset)` in `oracleFeatureContracts` | je genau `1` |
  | `oracleParts.oracleAssetDigest` und `sourcePaintNodes.oracleAssetDigest` | Digest der referenzierten Assetzeile | je genau `1`, bytegleich |
  | `oracleParts.comparisonProfile` | `comparisonProfiles` | genau `1` |
  | `oracleParts.sourcePaintNodes` | geparster Oracle-Paint-Index des Assets | `1..n`, eindeutige Nodes plus Selector-Digestbindung |
  | `comparisonProfiles.maskContract` | `maskContracts` | genau `1`, identischer Comparison-Frame |
  | `ownershipEntries.(asset,paintNode)` | geparster Oracle-Paint-Index | `1↔1` closure-weit |
  | `ownershipEntries.component.(component,variant,occurrence)` | Component-/Variantregister und Trace-Occurrence | je genau `1` |
  | `ownershipEntries.asset.(asset,purpose,allowlist)` | ExactAsset plus deklarierte Purpose-Allowlist | je genau `1` |
  | `plans.target` | genau eine von `exactAssets|componentFixtures|resolved builder request` | diskriminierte Summe, genau `1` |
  | `plans.instances.fragment` | `fragments` | genau `1` |
  | `plans.instances.variant` | `variants` | `0..1`, bei Variantinstanz genau `1` |
  | `plans.instances.oracleWitness.(oracleAsset,oraclePart,occurrenceKey)` | Oracle-Manifest, `oracleParts`, Ownership-/Trace-Occurrence | je genau `1` bei Componentinstanz |
  | `plans.instances.asset` | `exactAssets` | genau `1` bei assetspezifischer Instanz |
  | `compositionTraces.(target,plan)` | Plan und zugehörige Asset-/Display-/Component-Fixture | je genau `1` |
  | `compositionTraces.nodes` | materialisierte Planinstanzen | `1↔1`, eindeutige Node-Keys exakt in Planinstanz-/Paintreihenfolge, niemals sortiert |
  | `useEdges.(component,fixture,oracleAsset,oraclePart,traceNode)` | jeweilige Registry/Trace-Collection | je genau `1`; jeder Component-Traceleaf hat `1..n` UseEdges |
  | `conformanceCases` | disjunkte Union `assetCases|displayCases|componentCases` | exakte `1↔1`-Union ohne Cross-kind-Keykollision |

  Die Matrix ist erschöpfend für jedes referenzartige Feld aller 21 gespeicherten/manifestierten Collections sowie die abgeleitete `knownSymbolSpecAssets`-Map; alle nicht aufgeführten Felder der in Task 2/3 definierten Typen sind lokale skalare Payload und werden durch ihren Strukturvalidator geprüft, dürfen aber keinen Registry-Key enthalten. Der Test reflektiert die bekannten Objektkeys und scheitert, sobald ein neues key-/digest-/target-/owner-/node-/plan-/fixture-/part-/asset-/component-/variant-/contract-artiges Feld ohne Matrixzeile hinzukommt. Der Task-23-Catalogtest iteriert **jede `catalog-static`-Zeile** mit generierten Mutationen: (a) unbekannter Target-Key, (b) fremder Target-Key, der zwar in einem anderen Modul existiert, aber nicht in der geprüften Closure beziehungsweise nicht über den minimalen Dependencygraph erreichbar ist, und (c) Duplicate Edge/Record; bei skalaren Feldern erzeugt (c) eine zweite Sourcezeile mit konkurrierender gleicher Beziehung. Für die Known-Spec-Zeile mutiert er außerdem Digest, Assetziel, fehlenden/zusätzlichen geladenen Source-Match und einen Mapwert ohne `exactAssets`-Ziel. Task 26 iteriert nach Parsing und Finalisierung ergänzend **jede `oracle-finalized`-Zeile** mit denselben Mutationklassen und belegt gemeinsam mit dem Catalogtest, dass jeder Descriptor der einen Tabelle ausgeführt wurde. Für die drei FeatureContract-Zeilen existieren zusätzlich explizite Mutationen „Contract fehlt für Current-Asset“, „zwei Contracts für dasselbe Current-Asset“, „Key gehört zu anderem Asset“ und „Digest gehört zu anderer OracleManifest-Zeile“. Jede Mutation muss den eigenen stabilen Relationcode liefern. Damit sind keine nur prose-erwähnten Endpunkte zulässig. Unbekannte, doppelte oder closure-fremde Enden werden nach Relation/Source-Key sortiert gemeldet. `componentFragments` und `assetFragments` spiegeln die zwei disjunkten Shardablagen; `fragments` ist deren readonly, nach Key kanonisch sortierte Vereinigung und weist jede Überschneidung ab. Damit erfüllt `{fragments: registry.fragments, variants: registry.variants}` direkt `ExactMaterializationRegistry`. `batchIds` und `modulesById` besitzen exakt dasselbe kanonische ID-Keyset; der zentrale `batches/index.ts` bleibt zunächst leer.

  `batch-staging-registry.ts` enthält eine Root-owned readonly Allowlist von `ExactBatchDescriptor`s und keine statischen Shardimports. Jeder Descriptor trägt die vollständigen `ownedKeys`/`setDigests` seines Batches, aber keine importierte Modulreferenz. `buildStagedExactBatchOwnershipIndex(descriptors)` validiert zuerst eindeutige IDs, exakt alle 21 kanonisch sortierten/eindeutigen Owned-Keyfolgen, jeden frisch aus seiner Folge berechneten Setdigest, dass kein Key derselben Collection zwei Batchowner besitzt, und dass jede Owner-ID in derselben Allowlist existiert; erst danach erzeugt es den vollständigen readonly Key→Owner-Index. `resolveStagedBatchDependencyOrder(id, descriptors)` validiert anschließend per `compareExactBatchId` kanonische/eindeutige Dependencyfolgen, vorhandene Root-/Dependency-IDs, keine Self-Edges und den azyklischen Graph per vollständigem DFS. Allowlistpositionen beschränken keine Graphkante. Danach löst er von der Root-ID aus jede transitive Kante in eine deterministische topologische Descriptorfolge auf, Dependency vor Verbraucher und Current zuletzt; sämtliche Ties werden ausschließlich mit `compareExactBatchId` entschieden.

  `buildExactBatchKeyOwnerIndex(modules)` bildet nach dem Import für jede der 21 Collection-/Key-Kombinationen der tatsächlich geladenen Closure genau einen Owner-Batch und verwirft Doppelowner. Auch abgeleitete Collections werden über `current.manifest.ownedKeys` ihrem Batch zugeordnet. Dieser Closure-Index dient der Registry-/Boundaryvalidierung, niemals der Erkennung eines absichtlich nicht deklarierten und deshalb nicht geladenen Owners.

  `batchOwnedRelationTargets(current)` iteriert **alle batch-owned Source-/Target-Endpunkte beider Phasen derselben `EXACT_BATCH_RELATIONS`**, einschließlich rückwärts verpflichtender `1↔1`-Endpunkte, nicht nur die in Catalog ausführbare Phase und nicht eine handgeschriebene Teilmenge. Für jeden durch Current-`ownedKeys` identifizierten Source-Record gibt es gespeicherte Zielkeys als kanonisch sortierte `ExactBatchRelationTarget`s aus; es löst dabei weder Registryobjekte noch Owner auf. `directForeignExactBatchOwners(current,fullOwnerIndex,relationTargets)` löst anschließend jeden dieser Zielkeys ausschließlich im **vor Modulimport aus allen staged Descriptoren gebauten** `StagedExactBatchOwnershipIndex` auf, entfernt ausschließlich `current.manifest.id`, dedupliziert und sortiert mit `compareExactBatchId`. Dadurch bleibt Owner B auch dann bestimmbar, wenn `d -> b` aus dem Current-Descriptor entfernt wurde und Bs Modul nicht in der geladenen Closure liegt. Ein Target ohne globalen Owner oder mit gefälschtem/mehrdeutigem Owner ist ein harter Ownershipfehler, kein stilles Unknown-Registry-Ende.

  Die Ableitung umfasst ContractCase/Witness, ExactAsset, Display, OraclePart, Profile/Mask, Ownership, Plan/Trace/UseEdge, FeatureContract und alle Casebeziehungen. Insbesondere folgt sie von jedem Current-ExactAsset und Current-owned OraclePart zum kanonisch aus dessen OracleAsset-Key abgeleiteten FeatureContract-Owner; ein fremdes Part-Asset kann daher nicht erst beim Task-26-Parser als undeclared Dependency auftauchen. Sie wertet nur gespeicherte Keys/Referenzen aus und benötigt weder Parser- noch Finalisierungswerte. Eine Relation ohne Batchowner, etwa `ORACLE_MANIFEST`, `knownSymbolSpecAssets` oder der geparste Paint-Index, wird validiert, trägt aber keine Dependency bei. Diese beiden Helper sind die einzigen Exporte, die Closurevalidierung und Corpus-Descriptorerzeugung zur direkten Ableitung verwenden.

  `exactBatchClosureIssues(descriptorSequence,modules,closureOwnerIndex,fullOwnerIndex)` verlangt zunächst identische Descriptor-/Modul-ID-Keysets und genau einen Current am Sequenzende sowie für jeden geladenen Batch Gleichheit seines Closure-Owners mit dem Full-Owner-Index. Es extrahiert die Current-Relationtargets genau einmal und vergleicht `currentDescriptor.readonlyDependencies` exakt mit `directForeignExactBatchOwners(current,fullOwnerIndex,relationTargets)`: fehlende direkte Ownerkante und eine bloß transitive redundante Direktkante sind beide Fehler; gemeinsame transitive Dependencies im Diamanten bleiben erlaubt. Dieser Vergleich läuft **vor** der Post-Union-Referenzprüfung, damit ein entfernter Direktowner stabil `MISSING_STAGED_DEPENDENCY` statt nur `unknown-target` erzeugt. Anschließend führt dieselbe Funktion ausschließlich die `catalog-static`-Descriptoren der einen Relationstabelle gegen die vollständige geladene Post-Union aus. `assertExactBatchClosure` ist nur der throwing Wrapper. `registerExactBatchModules` baut unabhängig davon die Maps einschließlich der geladenen Known-Spec-Teilprojektion und führt ebenfalls ausschließlich `catalog-static` ohne Descriptorgraph aus; der Loader ruft beides auf. Kein Catalogpfad darf einen `oracle-finalized`-Descriptor ausführen oder zum Schein gegen gepinnte Literale prüfen; diese Phase besitzt ausschließlich der Task-26-CLI-Ablauf nach Parser und Finalisierung.

  `loadStagedExactBatchClosure(id)` ist der einzige exportierte produktive Loader. Er baut und validiert zuerst aus der **vollständigen** `STAGED_EXACT_BATCH_DESCRIPTORS`-Allowlist den `StagedExactBatchOwnershipIndex`; bei Forgery, falschem Digest oder Duplicate Owner bleibt die Anzahl Modulimports null. Danach ruft er den Resolver genau einmal auf, importiert in dessen Reihenfolge für jeden deklarierten Closure-Descriptor ausschließlich die fünf bereits streng validierten repo-relativen Modulpfade, assembliert die festen `BATCH_*`-Exports und ruft je Paar nur die lokale `assertStagedBatchBoundary(descriptor,current)` sowie `assertExactBatchContract(current)`. Anschließend baut er den separaten Closure-Key-Owner-Index, leitet die direkten Owner mit dem vollständigen Pre-Closure-Index ab, ruft `assertExactBatchClosure(descriptorSequence,modules,closureOwnerIndex,fullOwnerIndex)` und registriert erst danach die vollständige geladene Post-Union einmal über `registerExactBatchModules`. Erst wenn Dependencies und alle `catalog-static` Contract-/Witness-/Display-/Part-/Ownership-/ComponentCase-/Known-Spec- und übrigen Matrixendpunkte grün sind, gibt er rekursiv immutable `{ dependencies: modules.slice(0, -1), current: modules.at(-1)! }` zurück. Ein optionaler einzelner Modullader bleibt privat und darf ausschließlich von diesem Closure-Loader verwendet werden; es gibt keinen exportierten Single-Batch-Loader, Glob, Directoryscan, frei übergebenen Pfad oder Fallback auf den finalen Aggregator.

  `readonlyDependencies` bleibt minimal semantisch: Referenziert Current nur einen Key aus B und B referenziert A, steht nur B bei Current; der Resolver nimmt A transitiv über B in die Closure. Referenziert Current selbst je einen Key aus B und C, nennt er beide. Der Diamanttest pinnt deshalb `b -> [a]`, `c -> [a]`, `d -> [b,c]`, niemals `d -> [a,b,c]`. „Bereits akzeptiert“ bedeutet erfolgreiche Closureprüfung, nicht eine Position vor Current in einer globalen Liste. Die Dependency-Dateien sind für die aktuelle Aufgabe unverändert, unstaged und read-only. Foundation registriert in Task 25 zunächst nur den Canary; der Corpus-Root-Integrator darf später vor Workerstart die 90 Descriptorzeilen ergänzen, ohne fehlende Shards statisch zu importieren.

- [ ] **Step 6: Führe GREEN aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/catalog/src/exact/batch-contract.test.ts packages/catalog/src/exact/batch-staging-registry.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; Resolver und Staging funktionieren unabhängig von finaler Aggregatorregistrierung, und die rein abgeleitete totale Pair-Ownership ist bijektiv, manifestgebunden und reihenfolgeunabhängig digestierbar.

- [ ] **Step 7: Committe nur Batchvertrag, Staginggrenze und leeren Aggregator**

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batch-contract.ts packages/catalog/src/exact/batch-contract.test.ts packages/catalog/src/exact/batch-staging-registry.ts packages/catalog/src/exact/batch-staging-registry.test.ts packages/catalog/src/exact/batches/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat: define exact batch modules"
  ```

---

### Task 24: Base-Formation-Canary als perfektes kleines ExactBatchModule rekonstruieren

**Agent ownership:** Ausschließlich `packages/catalog/src/exact/batches/base-formation-canary/` für committed Source/Testdateien sowie genau der gitignorierte lokale Diagnosehelper `out/exact-reference/finalize-canary.ts`, der niemals gestaged oder committet wird. Dieser Worker verändert weder `batches/index.ts` noch andere Batchverzeichnisse noch Package-Indizes.

**Files:**
- Create: `packages/catalog/src/exact/batches/base-formation-canary/manifest.ts`
- Create: `packages/catalog/src/exact/batches/base-formation-canary/components.ts`
- Create: `packages/catalog/src/exact/batches/base-formation-canary/assets.ts`
- Create: `packages/catalog/src/exact/batches/base-formation-canary/parts.ts`
- Create: `packages/catalog/src/exact/batches/base-formation-canary/plans.ts`
- Create: `packages/catalog/src/exact/batches/base-formation-canary/cases.test.ts`
- Create local ignored diagnostic only, never add/commit: `out/exact-reference/finalize-canary.ts`

**Interfaces:**
- Consumes: Tasks 1–23; lokales Original ausschließlich für den expliziten Entwicklungscheck, nie als Generatorinput für Source-Dateien.
- Produces: feste Shardexports `BATCH_MANIFEST`, `BATCH_COMPONENTS`, `BATCH_ASSETS`, `BATCH_PARTS`, `BATCH_PLANS` für genau `1.1_Taktische Formation.svg` und `kind:formation`.

- [ ] **Step 0: Lege zuerst alle fünf compile-sicheren Shardstubs an**

  Erzeuge alle fünf Dateien mit den finalen `BATCH_*`-Exports und vollständig vorhandenen Containerfeldern. Arrays sind zunächst leer; `BATCH_MANIFEST` verwendet die endgültige ID/Familie, aber leere/falsche `ownedKeys` und über `sha256Digest('0'.repeat(64))` erzeugte Stubdigests. `BATCH_PLANS` enthält ausschließlich `{plans: []}`. Belege mit `rtk mise exec -- pnpm typecheck`, dass der komplette Shard importierbar ist, bevor `cases.test.ts` entsteht.

- [ ] **Step 1: Schreibe zuerst den vollständigen Canary-Vertrag**

  `cases.test.ts` assembliert das Batchmodul lokal aus den fünf festen Shardexports und prüft:

  ```ts
  const batch = {
    manifest: BATCH_MANIFEST,
    components: BATCH_COMPONENTS,
    assets: BATCH_ASSETS,
    parts: BATCH_PARTS,
    plans: BATCH_PLANS,
  } as const;

  it('besitzt exakt eine Asset-, Display- und Componentfamilie', () => {
    expect(() => assertExactBatchContract(batch)).not.toThrow();
    expect(BATCH_MANIFEST).toMatchObject({
      id: 'base-formation-canary', componentFamily: 'kind',
      oracleAssetKeys: ['oracle:1.1_Taktische Formation.svg'],
      ownedKeys: {
        exactAssets: ['asset:1.1_Taktische Formation.svg'],
        componentFixtures: ['component:kind:formation@context:standalone#primary'],
        componentCases: ['case:component:kind:formation@context:standalone#primary'],
        displayFixtures: ['display:bbk-babz-2025:1.1#primary'],
        compositionTraces: [
          'trace:asset:1.1_Taktische Formation.svg',
          'trace:component:kind:formation@context:standalone#primary',
          'trace:display:bbk-babz-2025:1.1#primary',
        ],
      },
    });
  });
  ```

  Der Test verlangt außerdem exakt je einen Asset-, Display- und ComponentCase sowie `registry.conformanceCases.keys()` in derselben kanonischen Dreiermenge; entfernt oder dupliziert man den ComponentCase, scheitert `assertExactBatchContract`. Die für dieses einzelne Batch registrierte Known-Spec-Teilprojektion besitzt exakt einen Eintrag und `registry.knownSymbolSpecAssets.get(canonicalKnownSymbolSpecDigest({kind:'formation'})) === 'asset:1.1_Taktische Formation.svg'`; keiner der 255 noch nicht geladenen globalen Known-Spec-Einträge darf als dangling Registrywert erscheinen. Ein zweiter Test materialisiert Asset- und ComponentPlan über `materializeExactComposition`, projiziert den Displaytrace über `projectDisplayComposition`, verlangt identische owner-freie Paintrecords, drei unterschiedliche Target-/Tracekeys, objektidentische Display-/Assetgeometrie, vollständig erhaltene `oracleWitness`-Objekte und exakt zwei `component`-owned Leaves je Drawing. `deriveUseEdges` muss daraus genau drei Kanten mit Asset-, Component- und Displayfixture als Ziel erzeugen. Ein dritter Test pinnt das vollständige canonical JSON der zwei Paintrecords als Testliteral.

- [ ] **Step 2: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/catalog/src/exact/batches/base-formation-canary/cases.test.ts`

  Expected: FAIL an der positiven Batchassertion, weil die compile-sicheren Stubs leere Besitzmengen statt des Canary-Keysets führen; Import und Typecheck sind grün.

- [ ] **Step 3: Implementiere Fragment und Component-Verträge als strukturierte IR**

  `components.ts` exportiert eine `ReferenceExactFragment` mit ViewBox `0 0 90.709 90.709`, dem ausschließlich über `componentContextKey('context:standalone')` konstruierten Kontext, Variant `kind:formation@context:standalone#primary` und genau diesen zwei geordneten sichtbaren Leaves:

  ```ts
  const d = exactDecimal;

  const BODY_FILL = {
    type: 'rect', id: 'node:body-fill', role: 'body',
    x: d('2.835'), y: d('17.008'), width: d('85.04'), height: d('56.693'),
    fill: '#ffffffff', fillRule: 'nonzero', transforms: [],
    owner: {
      kind: 'component', component: 'kind:formation',
      variant: 'kind:formation@context:standalone#primary',
    },
  } as const;

  const BODY_OUTLINE = {
    type: 'path', id: 'node:body-outline', role: 'body',
    commands: [
      { command: 'M', x: d('88.583'), y: d('74.41') },
      { command: 'L', x: d('2.126'), y: d('74.41') },
      { command: 'L', x: d('2.126'), y: d('16.299') },
      { command: 'L', x: d('88.583'), y: d('16.299') },
      { command: 'L', x: d('88.583'), y: d('74.409') },
      { command: 'Z' },
      { command: 'M', x: d('3.544'), y: d('72.992') },
      { command: 'L', x: d('87.166'), y: d('72.992') },
      { command: 'L', x: d('87.166'), y: d('17.717') },
      { command: 'L', x: d('3.544'), y: d('17.717') },
      { command: 'L', x: d('3.544'), y: d('72.992') },
      { command: 'Z' },
    ],
    fill: '#000000ff', fillRule: 'nonzero', transforms: [],
    owner: {
      kind: 'component', component: 'kind:formation',
      variant: 'kind:formation@context:standalone#primary',
    },
  } as const;
  ```

  Die scheinbare Differenz `74.409` vor dem ersten `Z` ist zwingend: sie ist die verlustfreie Summe aus relativem Quell-`v58.11` ab `16.299`; `Z` schließt danach auf den ursprünglichen Punkt `88.583,74.41`. Runde sie nicht auf `74.41`.

  `BATCH_COMPONENTS` enthält dieses Componentfragment, die Variante/Fixture, exakt einen `ComponentCase` mit Key `case:component:kind:formation@context:standalone#primary` und den **konkreten** `kind:formation`-CompositionContract aus `COMPOSITION_CONTRACT_REGISTRY` samt ContractCase/`compositionWitnessEdges`. `BATCH_ASSETS.assetFragments` ist leer. Ergänze zwei OracleOwnership-Einträge in `BATCH_PARTS.ownershipEntries`, die Paintordinals 0 und 1 an dieselbe Component-Occurrence binden. Es gibt keinen `asset-specific`-Leaf.

- [ ] **Step 4: Implementiere Oracle-/Asset-/Display-Metadaten ohne Originalinhalt**

  `assets.ts` bindet:

  ```ts
  {
    key: 'oracle:1.1_Taktische Formation.svg',
    filename: '1.1_Taktische Formation.svg',
    sha256: sha256Digest('84b2b16eb4f4f4085ff1ee63f2688ec81a4be34539de977213c77ff507a1f716'),
  }
  ```

  Die Oraclezeile wird nicht als zweite Batchkopie gespeichert, sondern aus `ORACLE_MANIFEST` selektiert. `BATCH_ASSETS` führt `asset:1.1_Taktische Formation.svg`, `display:bbk-babz-2025:1.1#primary` mit `comparisonMode: 'whole'`, je einen Asset-/DisplayCase, den Featurevertrag, `assetFragments: []` und `recipeExactAssetLinks: []` (1.1 ist ein Base-CatalogEntry, kein Rezept). Es wird kein SVG-, XML-, PNG-, Kommentar- oder lokaler Pfad gespeichert.

  Der assetbezogene Featurevertrag verwendet `expectedCounts` mit dem vollständigen `CorpusFeatureCounts`-Literal:

  ```ts
  {
    groups: 3, rects: 2, paths: 1, pathFiles: 1,
    polygons: 0, circles: 0, polylines: 0,
    transforms: 0, transformFiles: 0,
    transformsByElement: {
      group: 0, rect: 0, path: 0, polygon: 0, circle: 0, polyline: 0,
    },
    viewBoxFamilies: {
      '32x32-mm': 1, '48x32-mm': 0, '36x32-mm': 0,
      '32x46-mm': 0, '80x32-mm': 0,
    },
  }
  ```

  Erlaubte Elemente/Attribute werden vollständig aus genau dieser Quelldatei angegeben; globale Corpuswerte kommen erst mit dem Corpusplan.

- [ ] **Step 5: Implementiere Whole-Part, Profil und Maske**

  `parts.ts` führt `part:1.1_Taktische Formation.svg#whole`. Seine zwei Selector-IDs lauten `oracle-paint:84b2b16eb4f4f4085ff1ee63f2688ec81a4be34539de977213c77ff507a1f716:0` und `:1`, jeweils mit demselben Assetdigest. `oracleToPart` ist leer, Isolation `source-node-set`; der maschinelle Nachweis ist zulässig, weil die Auswahl sämtliche sichtbaren Paintrecords enthält.

  Das Profil `profile:whole-90.709-square` trägt genau die mit `exactDecimal` konstruierte gemeinsame ViewBox; sein `maskContract` `mask:whole-90.709-square` ist `full-frame`, `alphaThreshold: 0`, `pixel-center-inclusive`, `resvg-2.6.2`, `viewportMapping:'fit-width-xMidYMid-meet'` und gilt für alle zehn Pflichtbreiten. Es enthält keine globale `partToViewport`-Folge; Task 13 löst je Rasterbreite eine eigene auf. Keine Frame-/Maskenkopie erscheint am Part oder Case.

- [ ] **Step 6: Implementiere Component- und AssetPlan ohne zweite Ganzzeichengeometrie**

  `plans.ts` enthält genau zwei Plans und sonst kein Feld. Der ComponentPlan targetet `component:kind:formation@context:standalone#primary`, der AssetPlan `asset:1.1_Taktische Formation.svg`. Beide instanziieren dasselbe Fragment mit leerer Transformfolge und einem vollständigen rekursiv eingefrorenen OracleWitness auf Whole-Part: Oracleasset, Assetdigest, Part, `fixtureToPart: []`, Digest dieser leeren Folge und Occurrence-Key. Es gibt kein Drawingliteral im Assetfixture und keinen unabhängigen Displayplan; der Display verweist auf das ExactAsset und erhält seinen Trace ausschließlich durch Projektion.

- [ ] **Step 7: Implementiere das manifestierte exakte Keyset**

  `manifest.ts` listet in `ownedKeys` alle tatsächlich besessenen Fragment-, Variant-, ComponentFixture-, ComponentCase-, Concrete-Contract-, ContractCase-, Witness-, FeatureContract-, ExactAsset-, Display-, AssetCase-, DisplayCase-, RecipeLink-, Part-, Profile-, Mask-, Ownership- und Plan-Keys lexikographisch. `assetFragments` und `recipeExactAssetLinks` sind leer. Erwartet werden drei CompositionTrace-Keys (Component, Asset, projizierter Display) und **drei** daraus abgeleitete UseEdge-Keys; der Display darf nicht fehlen. Für jede dieser 21 Collections steht der Setdigest in `setDigests`. Das Manifest besitzt kein Dependency-Feld; der in Task 25 angelegte Canary-Descriptor trägt literal `readonlyDependencies: []`. Assetzahl 1, Componentfamilie ausschließlich `kind`.

- [ ] **Step 8: Pinne Candidate-Digests mechanisch, aber nicht aus dem Orakel**

  Setze im ersten Literal die fünf Fixturedigests, den Projected-Display-Trace-Digest, den Witness-Transformdigest, `oracleAssetSetDigest` und alle 21 Manifest-Setdigests bewusst über `sha256Digest('0'.repeat(64))`. Catalogsource und Catalogtests dürfen `@einsatzzeichen/cli` **nicht** importieren. Lege deshalb als den oben ausdrücklich besessenen, gitignorierten und niemals zu stagenden/committenden Diagnosehelper `out/exact-reference/finalize-canary.ts` an; er importiert die fünf Shards, `materializeExactComposition`/`projectDisplayComposition` und ausschließlich zur lokalen Berechnung `finalizeExactComposition`, `finalizeProjectedDisplayComposition`, `digestSortedSet` aus Task 19. Das Skript liest kein Orakel, gibt ein kanonisches JSONobjekt aller tatsächlich berechneten Digests aus und prüft vor Ausgabe die erwarteten drei Traces/UseEdges sowie den ComponentCase-Keysetdigest. Führe es mit `rtk mise exec -- pnpm exec tsx out/exact-reference/finalize-canary.ts` aus und übertrage ausschließlich die ausgegebenen 64-stelligen Werte mit `apply_patch` in die Shards. Ändere dabei keine Geometrie. Vor Step 10 belegt `rtk git -c core.fsmonitor=false status --short --ignored out/exact-reference/finalize-canary.ts`, dass der Helper ausschließlich ignored (`!!`) und nicht staged ist. Der spätere CLI-Batchtest berechnet sämtliche Werte frisch erneut; der Catalogtest prüft nur Struktur, referentielle Materialisierung und formale feste Literale und behält damit die Dependencyrichtung Catalog → niemals CLI.

- [ ] **Step 9: Führe GREEN aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/catalog/src/exact/batches/base-formation-canary/cases.test.ts packages/core/src/exact/materialize.test.ts packages/core/src/exact/normalized-paint.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; struktureller Vertrag, Materialisierung und Digestbindung stimmen, ohne Oraclezugriff.

- [ ] **Step 10: Committe ausschließlich das Canary-Verzeichnis**

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/base-formation-canary
  rtk git -c core.fsmonitor=false commit -m "feat: add exact base formation canary"
  ```

---

### Task 25: Canary ausschließlich in Root-Aggregator und Staging-Allowlist integrieren

**Agent ownership:** Root-Integrator besitzt nur `packages/catalog/src/exact/batches/index.ts`, `packages/catalog/src/exact/batches/index.test.ts`, `packages/catalog/src/exact/batch-staging-registry.ts`, `packages/catalog/src/exact/index.ts` und `packages/catalog/src/index.ts`. Er ändert keine Canary-Shards.

**Files:**
- Modify: `packages/catalog/src/exact/batches/index.ts`
- Create: `packages/catalog/src/exact/batches/index.test.ts`
- Modify: `packages/catalog/src/exact/batch-staging-registry.ts`
- Modify: `packages/catalog/src/exact/index.ts`
- Modify: `packages/catalog/src/index.ts`

**Interfaces:**
- Consumes: Batchvertrag/Staginggrenze aus Task 23 und fünf Canary-Shards aus Task 24.
- Produces: `BASE_FORMATION_CANARY_BATCH`, initialen Canary-`ExactBatchDescriptor` mit vollständigen bytegleichen `ownedKeys`/`setDigests` und `readonlyDependencies: []`, `EXACT_BATCH_MODULES`, `EXACT_CATALOG_REGISTRY` einschließlich der einen geladenen Known-Spec-Zuordnung sowie objektidentischem `reachableBuilderContextSet`/`referenceComponentContextSet`, und öffentliche Exact-Foundation-Exports einschließlich `loadStagedExactBatchClosure`.

- [ ] **Step 0: Lege zuerst einen compile-sicheren Integrationsstub an**

  Exportiere in `batches/index.ts` zunächst `BASE_FORMATION_CANARY_BATCH: ExactBatchModule | undefined = undefined` und lasse `EXACT_BATCH_MODULES`/Registry leer. Ergänze öffentliche Re-Exports und führe `rtk mise exec -- pnpm typecheck` grün aus. Der Staging-Export bleibt zunächst leer. Erst danach entsteht der Test; sein RED ist eine falsche Registrymenge, kein fehlender Import.

- [ ] **Step 1: Schreibe den Aggregator-RED-Test**

  ```ts
  import { describe, expect, it } from 'vitest';
  import { componentContextKey } from '@einsatzzeichen/schema';
  import {
    canonicalKnownSymbolSpecDigest, EXACT_BATCH_MODULES, EXACT_CATALOG_REGISTRY,
    REACHABLE_BUILDER_CONTEXT_SET, REFERENCE_COMPONENT_CONTEXT_SET,
  } from './index.js';

  it('integriert den Canary genau einmal und kanonisch', () => {
    expect(EXACT_BATCH_MODULES.map((batch) => batch.manifest.id))
      .toEqual(['base-formation-canary']);
    expect([...EXACT_CATALOG_REGISTRY.exactAssets.keys()])
      .toEqual(['asset:1.1_Taktische Formation.svg']);
    expect([...EXACT_CATALOG_REGISTRY.componentFixtures.keys()])
      .toEqual(['component:kind:formation@context:standalone#primary']);
    expect([...EXACT_CATALOG_REGISTRY.componentCases.keys()])
      .toEqual(['case:component:kind:formation@context:standalone#primary']);
    expect(EXACT_CATALOG_REGISTRY.reachableBuilderContextSet)
      .toBe(REACHABLE_BUILDER_CONTEXT_SET);
    expect(EXACT_CATALOG_REGISTRY.referenceComponentContextSet)
      .toBe(REFERENCE_COMPONENT_CONTEXT_SET);
    expect(REFERENCE_COMPONENT_CONTEXT_SET.pairs.find((pair) =>
      pair.component === 'kind:formation' && pair.context === componentContextKey('context:standalone'),
    )?.access).toBe('public-builder');
    expect(EXACT_CATALOG_REGISTRY.knownSymbolSpecAssets.size).toBe(1);
    expect(EXACT_CATALOG_REGISTRY.knownSymbolSpecAssets.get(
      canonicalKnownSymbolSpecDigest({ kind: 'formation' }),
    )).toBe('asset:1.1_Taktische Formation.svg');
    expect([...EXACT_CATALOG_REGISTRY.conformanceCases.keys()]).toEqual([
      'case:asset:1.1_Taktische Formation.svg',
      'case:component:kind:formation@context:standalone#primary',
      'case:display:bbk-babz-2025:1.1#primary',
    ]);
  });
  ```

  Der persistente Aggregatortest prüft ausschließlich den zu diesem Zeitpunkt registrierten Canary. Er ruft den Staging-Loader nicht auf und pinnt keine Staging-Keymenge: Corpus Task 1 ersetzt den initialen Staging-Descriptor später vollständig durch exakt 90 Corpusdescriptoren, obwohl deren Shardmodule zu diesem frühen Zeitpunkt noch nicht existieren. Der reale Canary-Loaderroundtrip bleibt dem Task-26-CLI-Gate vorbehalten; der generische Staging-Policy-Test aus Task 23 arbeitet nur mit injizierten synthetischen Descriptoren beziehungsweise dem unbekannten-ID-Fall und bleibt nach dem Austausch grün.

- [ ] **Step 2: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/catalog/src/exact/batches/index.test.ts`

  Expected: FAIL an `EXACT_BATCH_MODULES` (`[]` statt Canary) und den leeren Registry-Maps; sämtliche Exporte und Typen sind vorhanden.

- [ ] **Step 3: Integriere durch explizite Shardimports**

  Importiere die fünf Shards, assembliere `BASE_FORMATION_CANARY_BATCH` und setze `EXACT_BATCH_MODULES = [BASE_FORMATION_CANARY_BATCH] as const`. Rufe genau einmal `registerExactBatchModules` auf. Ergänze in der Staging-Allowlist genau einen Canary-Descriptor mit vollständigen, bytegleich aus `BATCH_MANIFEST` übertragenen `ownedKeys`/`setDigests`, `readonlyDependencies: []` und fünf literal, repo-relativen Shardpfaden; der Descriptor importiert das Manifest nicht. Der einzige produktive `loadStagedExactBatchClosure` validiert daraus vor Import den vollständigen Ownershipindex, importiert danach dynamisch und liefert für diesen Descriptor `{ dependencies: [], current: BASE_FORMATION_CANARY_BATCH }`. Der Test mutiert einen Descriptor-Owned-Key und einen Setdigest und verlangt Fehler vor dem ersten Import. Es gibt keinen exportierten Single-Batch-Loader, Globimport, Dateisystemscan oder automatisch generierten Zentralindex. Dieser Eintrag ist nur die Foundation-Ausgangslage; Corpus Task 1 ersetzt ihn durch exakt 90 Descriptoren, die denselben vollständigen Ownershipvertrag tragen.

  `packages/catalog/src/exact/index.ts` ergänzt Re-Exports für Batchvertrag, Staginggrenze und Aggregator neben den seit Tasks 16–18 vorhandenen Manifest-/Registry-Exports. Der Packageindex behält seine bereits in Task 16 angelegte einzelne Zeile `export * from './exact/index.js';` unverändert; füge keine zweite hinzu. Exportiere keine CLI-Orakel- oder Resvg-Funktion aus dem Katalog.

- [ ] **Step 4: Führe GREEN, Build und einen echten Library-Import ohne Orakel aus**

  Run:

  ```bash
  rtk mise exec -- pnpm exec vitest run packages/catalog/src/exact/batches/index.test.ts packages/catalog/src/exact/batches/base-formation-canary/cases.test.ts
  rtk mise exec -- pnpm build
  rtk mise exec -- node --input-type=module -e "const m=await import('./packages/catalog/dist/src/index.js'); if (!m.EXACT_CATALOG_REGISTRY) process.exit(1)"
  rtk mise exec -- pnpm typecheck
  ```

  Expected: PASS; der gebaute Catalog lässt sich in einem frischen Nodeprozess ohne Orakelargument/-Environment importieren. Der fokussierte Canary-Lauf aus Task 26 belegt zusätzlich, dass seine reale Closure keine Dependencies enthält und ihr Current-Modul exakt `base-formation-canary` ist. Dieser Smoke belegt nur Build-/Import-Unabhängigkeit; er behauptet **nicht**, dass Tarball, Bundle oder Published Package frei von Orakelmaterial sind. Der eine vollständige Source-/Build-/Pack-Leak-Scan bleibt bewusst Eigentum des Integrationsplans und wird hier nicht dupliziert.

- [ ] **Step 5: Committe nur die zentrale Integration**

  ```bash
  rtk git -c core.fsmonitor=false add packages/catalog/src/exact/batches/index.ts packages/catalog/src/exact/batches/index.test.ts packages/catalog/src/exact/batch-staging-registry.ts packages/catalog/src/exact/index.ts packages/catalog/src/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat: register exact canary batch"
  ```

---

### Task 26: Gefilterten lokalen Batchcheck samt vollständiger visueller Evidenz anschließen

**Agent ownership:** Nur `packages/cli/src/conformance/batch-conformance.ts`, `inspect.ts`, deren Tests, `packages/cli/src/commands/conformance-batch.ts`, `conformance-inspect.ts`, deren Tests und `packages/cli/src/index.ts`.

**Files:**
- Create: `packages/cli/src/conformance/batch-conformance.ts`
- Create: `packages/cli/src/conformance/batch-conformance.test.ts`
- Create: `packages/cli/src/conformance/inspect.ts`
- Create: `packages/cli/src/conformance/inspect.test.ts`
- Create: `packages/cli/src/commands/conformance-batch.ts`
- Create: `packages/cli/src/commands/conformance-batch.test.ts`
- Create: `packages/cli/src/commands/conformance-inspect.ts`
- Create: `packages/cli/src/commands/conformance-inspect.test.ts`
- Modify: `packages/cli/src/index.ts`

**Interfaces:**
- Consumes: `ORACLE_MANIFEST`/Comparator aus Task 16, `LoadedExactBatchClosure`, die phasenmarkierte `EXACT_BATCH_RELATIONS`, `stagedExactOwnedKeySetDigest` und den Descriptor-/Stagingvertrag samt Post-Union-Registry aus Tasks 23–25, Vollset-Loader/Subsetselektion/Finalizer aus Task 19, Parser aus Task 20 und Raster/Writer aus Task 21.
- Produces: `deriveCurrentRequiredOracleManifest(current: ExactBatchModule, registry: ExactCatalogRegistry, oracleManifest: OracleManifest): OracleManifest`, `verifyExactBatchAgainstOracle(closure: LoadedExactBatchClosure, options): Promise<BatchComparisonResult>`, `inspectExactBatchOracle(descriptor, options): OracleMeasurementReport`, `runConformanceBatch(options)`, `runConformanceInspect(options)`, CLI `conformance:batch --batch <id> --batch-source staged --reference-root <path> --evidence-out out/exact-reference/<id>` und `conformance:inspect --batch <id> --reference-root <path> --out out/exact-reference/discovery/<id>/measurement.json`.

- [ ] **Step 0: Lege zuerst sämtliche compile-sicheren Orchestrierungs-/CLI-Stubs an**

  Erzeuge alle acht neuen Dateien mit finalen Signaturen und ergänze die zwei Routes compile-sicher im CLI-Index. `deriveCurrentRequiredOracleManifest` wirft zunächst `RED: oracle requirement derivation not implemented`; Orchestratoren/Commands werfen `RED: batch conformance not implemented` beziehungsweise `RED: oracle inspection not implemented`. Argumentparser erkennen die beiden Commandnamen bereits, führen aber nur den Stub aus. `rtk mise exec -- pnpm typecheck` muss vor Tests grün sein.

- [ ] **Step 1: Schreibe RED für den echten, aber synthetischen Batchdurchlauf**

  Der Unit-Test baut ein vollständiges Ein-Asset-Current- und ein Drei-Asset-Dependency-Batchliteral und schreibt die vier passenden kleinen SVGs in ein temporäres Oracleverzeichnis. Die bereits akzeptierte read-only Dependency besitzt neben dem von Current verwendeten Fragment/der Variante ausdrücklich einen eigenen `OraclePart`, dessen `asset` das erste Dependency-OracleAsset ist. Eine Current-`compositionWitnessEdges`-Kante referenziert genau diesen **dependency-owned OraclePart** und das zugehörige dependency-owned ExactAsset; der Current-Part-Display/Case verwendet denselben fremden Part. Current besitzt außerdem einen eigenen OraclePart, dessen `asset` das zweite dependency-owned OracleAsset ist, auch wenn kein Current-Case diesen Part verwendet. Das dritte Dependency-Asset samt FeatureContract und eigenen Cases ist vollständig gültig, aber für Current unreferenziert. Dependency-Cases werden absichtlich nicht ausgeführt. Der Current-AssetCase ist Whole mit `full`, der Current-ComponentCase ein gültiger source-node-set-Part mit `selected`; der Current-DisplayCase ist ein echter `leave-one-out`-Part mit getrennten `full`-/`without-selected`-Pairs. Er mockt ausschließlich die trusted Catalogkonstante `ORACLE_MANIFEST` vor Modulimport auf dieses vollständige synthetische Vier-Asset-Manifest; Loader, Parser, Raster, Materialisierung und Vergleich bleiben echte Implementierungen. Er ruft `verifyExactBatchAgainstOracle` direkt mit `{ dependencies: [dependency], current: batch }` und dem passenden Current-Descriptor auf und erwartet 30 + 60 + 30 Pairzellen:

  ```ts
  const result = await verifyExactBatchAgainstOracle({
    dependencies: [dependency], current: batch,
  }, {
    descriptor, referenceRoot,
    evidenceOut: 'out/exact-reference/unit-batch',
  });
  expect(result.caseResults).toHaveLength(3);
  expect(result.summary).toMatchObject({ caseCount: 3, cellCount: 120, failedCellKeys: [] });
  expect(result.caseResults.flatMap(({ pairResults }) =>
    pairResults.flatMap(({ cells }) => cells),
  )
    .every((cell) => cell.comparison.equal && cell.vectorEqual)).toBe(true);
  expect(result.caseResults.find(({ caseKey }) => caseKey === displayCase.key))
    .toMatchObject({
      requiredPairs: ['full', 'without-selected'],
      pairResults: [{ pair: 'full' }, { pair: 'without-selected' }],
    });
  expect(result.caseResults.map(({ caseKey }) => caseKey))
    .not.toContain(dependency.assets.assetCases[0]!.key);
  expect(result.passed).toBe(true);
  ```

  Pinne zusätzlich die Auswahlgrenze: `deriveCurrentRequiredOracleManifest` liefert kanonisch sortiert genau `{ Current-OracleAsset, OracleAsset des dependency-owned OraclePart, fremdes OracleAsset des Current-owned OraclePart }`, obwohl die beiden fremden Keys nicht in `options.descriptor.oracleAssetKeys` stehen. Das dritte, unreferenzierte Dependency-Asset fehlt in diesem Subset, wird nicht geparst und erzeugt weder Resultat noch Evidenz. Für alle drei Required-Assets wird der FeatureContract deterministisch ausschließlich über `registry.oracleFeatureContracts.get(corpusFeatureContractKey(oracleAsset))` selektiert; Arrayreihenfolge oder „erster Contract“ sind verboten. Fehlender Contract, Duplicate für dasselbe Asset, Contractkey für ein anderes Asset und abweichender `oracleAssetDigest` sind getrennte REDs. Instrumentiere den echten Vollset-Loader/File-Open-Pfad: `loadOracleSet` wird genau einmal auf das vollständige Vier-Asset-Manifest aufgerufen, jede der vier Dateien dabei genau einmal geöffnet; nach Rückgabe erfolgen für Ableitung, `selectLoadedOracleSet` und Parsing keine zweite Öffnung und kein Root-Relisting. So beweist der Test zugleich, dass fremde Part-/Witnessbytes und ein ausschließlich über einen Current-owned Part erreichbares fremdes Asset aus dem bereits validierten Vollset funktionieren, ohne Dependency-Cases in den Lauf zu ziehen.

  Ergänze Digestmismatch, fehlendes Asset, falsche Paint-Reihenfolge, fehlenden Part, fehlendes Leave-one-out-Pair, falsch reduzierte Trace-Node-Menge, unbekannten Batch und eine einzelne RGBA-Abweichung. Prüfe zusätzlich, dass die Closure-Registry Dependency plus Current genau einmal und in topologischer Reihenfolge registriert, ein doppelter Key zwischen beiden an der bestehenden Registry-Kollision scheitert und weder Dependency-Casekeys noch Dependency-Ergebnisse/Evidenzpfade in `BatchComparisonResult` oder `matrix.json` gelangen. Für den Leave-one-out-Display entstehen 60 metrische Zellen und 240 Bilder, bei jeder Width/Background exakt acht paarseparierte Bilder. Jeder Vergleichsfehler muss Case, Pair, Asset, Breite, Hintergrund, Oracle-/Candidate-Digest, Pixelzahl und maximale Kanalabweichung enthalten.

- [ ] **Step 2: Schreibe RED für das read-only Discovery-Protokoll**

  `inspect.test.ts` nutzt denselben synthetischen **vollständig geladenen** Oraclebestand und prüft ein kanonisches `OracleMeasurementReport/v1`: Batch-/Assetkey, Assetdigest, ViewBox, Featurecounts, alle sichtbaren Paintrecords mit OraclePaintNodeId, ordinaler Geometrie, Farbe, Fill-Rule, Transformfolge, gemeinsamer `ExactCoverageEnvelope` aus Task 13 und Recorddigest sowie sämtliche Non-Painting-Records mit Grund. Eine zweite Ausführung liefert bytegleiches JSON. Der Test belegt, dass weder Catalog-/Schema-/Core-Sourcedateien noch Attestation-/Approvaldaten geschrieben werden.

- [ ] **Step 3: Schreibe CLI-Argument- und Claimgrenztests**

  Prüfe fehlende/duplizierte Flags, jeden `--batch-source` außer exakt `staged`, Batch-ID mit Traversal, `evidence-out` außerhalb `out/exact-reference/<batch-id>`, Symlinkpfad und nicht existierenden Batch. Prüfe außerdem, dass eine unbekannte, fehlende, redundante direkte oder zyklische Dependency vor Orakelzugriff scheitert und es keinen Fallback auf `EXACT_BATCH_MODULES` gibt. Im Erfolgsfall lautet die Ausgabe ausschließlich beispielsweise:

  ```text
  Exact batch base-formation-canary verified: 3 cases, 90 cells, zero RGBA differences.
  Evidence: out/exact-reference/base-formation-canary
  ```

  Sie darf weder „661/661“ noch „Exact Reference Parity passed“, Releasefreigabe oder Domainfreigabe behaupten. Prüfe dieselben strikten Argumentgrenzen für `conformance:inspect`; dessen `--out` muss exakt `out/exact-reference/discovery/<batchId>/measurement.json` sein.

- [ ] **Step 4: Führe RED aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/batch-conformance.test.ts packages/cli/src/conformance/inspect.test.ts packages/cli/src/commands/conformance-batch.test.ts packages/cli/src/commands/conformance-inspect.test.ts`

  Expected: FAIL verhaltensbezogen mit `RED: batch conformance not implemented`/`RED: oracle inspection not implemented`; Imports, CLI-Routing und Typecheck sind grün.

- [ ] **Step 5: Implementiere den explizit entwicklungsbezogenen Batchablauf**

  `verifyExactBatchAgainstOracle`:

  1. validiert `assertExactBatchContract` für jedes Dependency-Modul und für `closure.current`, verlangt eindeutige Batch-IDs und dass `closure.current.manifest.id === options.descriptor.id` gilt;
  2. verlangt `assertStagedBatchBoundary(options.descriptor, closure.current)` oder bei direktem Workeraufruf einen explizit daraus abgeleiteten, gleichwertigen Descriptor; ein Aggregatoreintrag ist nie Voraussetzung. Für jede der 21 Folgen pinnt der Test zusätzlich `digestCanonical([collection, ...keys]) === stagedExactOwnedKeySetDigest(collection, keys)`, damit CLI- und Pre-Import-Stagingdigest bytegleich bleiben;
  3. ruft genau einmal `registerExactBatchModules([...closure.dependencies, closure.current])` auf und verwendet ausschließlich dessen read-only Maps als Materialisierungs-/Referenzregistry; doppelte Keys zwischen Dependency und Current sind harte Fehler;
  4. akzeptiert ausschließlich die vom einzigen Closure-Loader gelieferte topologisch geordnete Folge; bei direkten Unit-Aufrufen muss die Fixture nachweislich dieselbe Resolverfolge abbilden. Dependencies müssen bereits akzeptiert sein, ihre Module bleiben immutable und ihre sechs Dateien gehören weder zur Task-Ownership noch zu den staged Änderungen des Current-Batches;
  5. ruft danach **genau einmal und zuerst** `loadOracleSet(referenceRoot, ORACLE_MANIFEST)` auf und validiert damit Root, 661 Key-/Hashwerte und Vollsetdigest; nach dieser Rückgabe ist jedes erneute Laden, Öffnen oder Rootlisting verboten;
  6. validiert über `resolveCorpusShard(options.descriptor, ORACLE_MANIFEST)` zunächst die Descriptor↔Current-ExactAsset-Basismenge. `deriveCurrentRequiredOracleManifest` traversiert anschließend ausschließlich Current-Roots: alle drei Current-Casearten und deren Fixture-/Display-/ExactAsset-/OraclePart-Beziehungen, sämtliche Current-owned `OraclePart`s, Current-Ownershipentries, Current-`compositionWitnessEdges` und alle Current-ExactAssets. Ein von Current-Case oder Current-Witness referenzierter dependency-owned `OraclePart` wird über die Post-Union-Registry aufgelöst und dessen `asset` eingeschlossen; referenzierte fremde ExactAssets werden ebenso auf ihre OracleAsset-Keys aufgelöst. Die kanonisch sortierte, duplikatfreie Union wird gegen `ORACLE_MANIFEST` validiert und mit frisch berechnetem Setdigest als Subsetmanifest ausgegeben. Ein unbekannter/mehrdeutiger Endpunkt oder ein Required-Key ohne Vollsetzeile scheitert; Dependency-Cases, -Results und bloß im Dependency-Modul vorhandene, aber von Current nicht referenzierte Assets sind keine Roots;
  7. ruft genau einmal `selectLoadedOracleSet(fullSet, requiredManifest)` auf. Für jeden Required-OracleAsset-Key berechnet es `corpusFeatureContractKey(key)`, liest genau diesen Eintrag aus `registry.oracleFeatureContracts`, verlangt `contract.oracleAsset === key` und `contract.oracleAssetDigest === manifestEntry.sha256` und parst erst dann ausschließlich diese bereits im Vollset validierten Bytes. Missing/Duplicate/Wrong-Asset sind harte, nach OracleAsset-Key sortierte Fehler. Die Selektion liest weder Root noch Datei erneut. Ein Batchmanifest oder Subsetmanifest wird nie an `loadOracleSet` übergeben;
  8. materialisiert ausschließlich Current-Component-/AssetPlans atomar gegen die Closure-Registry und projiziert jeden Current-Displaytrace aus seinem ExactAsset; dadurch besitzt jede Current-DisplayFixture einen Trace, während Dependency-Pläne und -Cases nicht ausgeführt werden;
  9. finalisiert die undigested Current-Ergebnisse im CLI-Layer und leitet Current-Asset-, -Component- **und -Display-UseEdges** ab. Danach führt es gegen Parsergebnisse, finalisierte Records und Closure-Registry exakt jeden `phase === 'oracle-finalized'`-Descriptor derselben `EXACT_BATCH_RELATIONS` aus: alle fünf Current-Fixturedigests, Projected-Display-Trace-Digests, sämtliche Case-Digestbindungen, geparste Part-Selectoren, die closure-weite `(asset,paintNode)`-Ownershiprelation sowie alle 21 frisch berechneten Manifest-Setdigests. Der Test mutiert jede dieser Relationzeilen einzeln und verlangt ihren stabilen Relationcode; kein finalisierter Descriptor bleibt nur durch ein gespeichertes Literal scheinbar grün;
  10. prüft die owner-freien Paintlisten und Owned-/OracleOwnership-Projektion des Current-Batches;
  11. rendert pro Current-Asset-, -Display- und -ComponentCase genau ein `ComparisonMatrixResult` über `renderComparisonMatrix`; Whole besitzt ausschließlich das 30-Zellen-Pair `full`, source-node-set ausschließlich `selected`, Leave-one-out besitzt getrennte 30-Zellen-Pairs `full` und `without-selected`;
  12. schreibt jede Current-Zelle während der sequenziellen Verarbeitung, damit 4096-px-Puffer nach der Zelle freigegeben werden;
  13. baut ausschließlich aus den sortierten Current-per-Case-Matrizen genau einen `BatchComparisonResult` und schreibt abschließend dessen kanonisches `matrix.json` auch bei vollständigem Null-Diff. Kein Dependency-Casekey, -Resultat, -Evidenzpfad oder -Reviewrecord darf enthalten sein.

  Die Batchselektion ist nur in diesem Entwicklerkommando erlaubt. Die Funktion erzeugt keine Attestation, ändert keine Source-Datei und setzt keinen Approvalstatus.

- [ ] **Step 6: Implementiere das read-only Messprotokoll aus demselben Parsergebnis**

  `inspectExactBatchOracle(descriptor, options)` benötigt kein Batchmodul: Es ruft zuerst `loadOracleSet(options.referenceRoot, ORACLE_MANIFEST)`, danach `resolveCorpusShard(descriptor, ORACLE_MANIFEST)`/`selectLoadedOracleSet` und schließlich `parseOracleSvg` auf. Es verwendet weder Aggregator noch Stagingloader, Candidate-Materialisierung oder Sourcewriter. Pfad-/Primitive-/Transformdaten und Digests stammen direkt aus der normalisierten Parserprojektion; Coverage/Bounds stammen ausschließlich aus `paintCoverageEnvelope`, sind als konservativ/unknown gekennzeichnet und fließen nicht zurück in Geometry-IR. Der atomare Writer akzeptiert ausschließlich `out/exact-reference/discovery/<batchId>/measurement.json`, schreibt JCS plus LF und lehnt Symlink, Hardlink, Traversal und Fremdroot ab.

- [ ] **Step 7: Verdrahte beide CLI-Routen strikt**

  `conformance-batch.ts` akzeptiert genau `batchId`, den Literalwert `batchSource:'staged'`, `referenceRoot`, `evidenceOut`; es löst den allowlisteten Current-Descriptor auf, lädt exakt einmal `loadStagedExactBatchClosure(batchId)` und übergibt diese kanonische Closure an `verifyExactBatchAgainstOracle`. Es ruft keinen Single-Batch-Loader auf und liest nie `EXACT_BATCH_MODULES` oder `EXACT_CATALOG_REGISTRY`. `evidenceOut` muss nach realer Auflösung exakt unter `out/exact-reference/<batchId>` liegen. `conformance-inspect.ts` akzeptiert genau `batchId`, `referenceRoot`, `out`, löst nur den committed Descriptor auf und erzwingt den Discovery-Zielpfad; es lädt kein Batchmodul. `packages/cli/src/index.ts` routet `conformance:batch` und `conformance:inspect`; die Usagezeile nennt alle Pflichtflags. Der vollständige ungefilterte Befehl `conformance verify --strict` wird hier nicht simuliert.

- [ ] **Step 8: Führe synthetisches GREEN aus**

  Run: `rtk mise exec -- pnpm exec vitest run packages/cli/src/conformance/batch-conformance.test.ts packages/cli/src/conformance/inspect.test.ts packages/cli/src/commands/conformance-batch.test.ts packages/cli/src/commands/conformance-inspect.test.ts packages/cli/src/conformance/raster.test.ts && rtk mise exec -- pnpm typecheck`

  Expected: PASS; der Test erzeugt 120 grüne Current-Pairzellen (30 Whole-Asset/full + 60 Leave-one-out-Display + 30 Component/source-node-set-selected) und persistiert je Pairzelle vier Bilder plus Matrixmanifest unter dem Testoutput. Dependency-Daten sind in der Materialisierungsregistry verfügbar, erzeugen aber keine eigene Zelle und keinen Resultat-/Evidenzeintrag.

- [ ] **Step 9: Erzeuge zuerst das echte lokale, read-only Canary-Messprotokoll**

  Run:

  ```bash
  rtk mise exec -- pnpm cli conformance:inspect \
    --batch base-formation-canary \
    --reference-root ../../taktische-zeichen \
    --out out/exact-reference/discovery/base-formation-canary/measurement.json
  ```

  Expected: Exit 0, zwei sichtbare und ein `fill-none`-Record, Asset-SHA `84b2…f716`, ViewBox `0 0 90.709 90.709`, die kanonische relative-zu-absolute Pfadauflösung aus Task 24 und keine Sourceänderung. Der zur Laufzeit aufgelöste absolute Orakelpfad erscheint weder in stdout/stderr noch in `measurement.json`.

- [ ] **Step 10: Führe den echten lokalen Canary gegen das lizenzlokale Original aus**

  Run:

  ```bash
  rtk mise exec -- pnpm cli conformance:batch \
    --batch base-formation-canary \
    --batch-source staged \
    --reference-root ../../taktische-zeichen \
    --evidence-out out/exact-reference/base-formation-canary
  ```

  Expected: Exit 0; `loadStagedExactBatchClosure('base-formation-canary')` liefert `dependencies: []` und Current-ID `base-formation-canary`. `BatchComparisonResult/v1` enthält exakt 3 geordnete Current-`caseResults`/90 Summary-Zellen, in jeder Zelle `vectorEqual: true`, `differentPixelCount: 0`, `maxChannelDelta: 0`, `alphaDeltaCount: 0` und gleiche Bounds. Unter `out/exact-reference/base-formation-canary` liegen Original, Kandidat, Overlay und Heatmap für jeden Current-Case/jede Größe/jeden Hintergrund sowie `matrix.json`; nichts davon wird gestaged. Der aufgelöste absolute Orakelpfad wird weder persistiert noch geloggt.

- [ ] **Step 11: Lasse zwei unabhängige Reviewer den Canary vollständig prüfen**

  Der Spezifikationsreviewer prüft jeden der drei Current-Case-Keys sowie alle 90 Matrixzeilen. Der visuelle Reviewer öffnet für jede Current-Zelle Original, Kandidat, Overlay und Heatmap und protokolliert einen individuellen Befund; Kontaktbögen dürfen navigieren, ersetzen aber keinen Case. Dependency-Cases werden weder erneut ausgeführt noch reviewed. Beide Reviewer sind andere Agents als der Implementierer und attestieren nichts selbst.

- [ ] **Step 12: Führe den vollständigen Foundation-Gate aus**

  Run:

  ```bash
  rtk mise exec -- pnpm test
  rtk mise exec -- pnpm typecheck
  rtk mise exec -- pnpm build
  rtk git -c core.fsmonitor=false diff --check
  rtk git -c core.fsmonitor=false status --short
  ```

  Expected: Tests, Typecheck und Build Exit 0; `diff --check` leer. `status --short` enthält weder `taktische-zeichen/` noch `out/` noch fremde Userdateien im geplanten Commit.

- [ ] **Step 13: Committe ausschließlich CLI-Orchestrierung und beide Routen**

  ```bash
  rtk git -c core.fsmonitor=false add packages/cli/src/conformance/batch-conformance.ts packages/cli/src/conformance/batch-conformance.test.ts packages/cli/src/conformance/inspect.ts packages/cli/src/conformance/inspect.test.ts packages/cli/src/commands/conformance-batch.ts packages/cli/src/commands/conformance-batch.test.ts packages/cli/src/commands/conformance-inspect.ts packages/cli/src/commands/conformance-inspect.test.ts packages/cli/src/index.ts
  rtk git -c core.fsmonitor=false commit -m "feat: verify exact batches locally"
  ```

## Foundation-Abschlusskriterien

Die Foundation ist erst abgeschlossen, wenn alle folgenden Aussagen gleichzeitig frisch belegt sind:

- alle 26 Aufgabencommits sind einzeln reviewed und enthalten ausschließlich ihre Agent-Ownership-Dateien;
- bestehende semantische SVG-Snapshots sind ohne Update grün;
- ExactDecimal, kanonische Rational-/Viewportabbildung, beweisbare Visible-Path-Fläche, Pfad, Transform, RFC-8785-JCS/Unicode, Paint-Liste, undigested Materialisierung, CLI-Finalisierung, vollständiges 661er OracleManifest, exakte 413er PaintComponentRegistry, endliche öffentliche SymbolSpec-Slotgrammatik, CompositionContractRegistry, erschöpfender öffentlicher ReachableBuilderContextSet, totaler `ReferenceComponentContextSet/v1` mit exakten disjunkten 151/15-Nichtöffentlich-Partitionen und vollständiger 413er Abdeckung, Graph, Parts/Coverage, zellenspezifische Masken, RGBA, Freshness, Vollset-Loader, Parser, Raster und Ed25519 bestehen ihre adversarialen Tests;
- Build und der konkret ausgeführte Dist-Library-Import funktionieren ohne Orakelargument oder -Environment;
- jeder `ExactBatchDescriptor` trägt vor Modulimport vollständige, digestgeprüfte `ownedKeys`/`setDigests`; der daraus gebaute globale `StagedExactBatchOwnershipIndex` weist Forgery und Duplicate Owner ab und erkennt eine entfernte Direktkante als `MISSING_STAGED_DEPENDENCY`, auch wenn das Owner-Modul deshalb nicht in der geladenen Closure liegt;
- `ExactBatchDescriptor.readonlyDependencies` enthält ausschließlich die minimal semantischen direkten Owner-`ExactBatchId`s; der einzige produktive Staging-Einstieg löst unknown/missing, Self-Edge, Duplicate, Zyklus, fehlende und redundante Direktkante fail-closed, lädt die transitive Closure deterministisch topologisch und liefert genau `{ dependencies, current }`;
- `readonlyDependencies` ist exakt die minimale Menge direkt referenzierter Owner-Batches; transitive Vorgänger erscheinen nur über deren eigene Descriptoren und nicht als künstliche lineare Kette;
- die Batch-Registry wird aus topologisch geordneten read-only Dependency-Modulen plus Current gebaut, weist batchübergreifende Duplicate-Keys ab und validiert nach der vollständigen Union sämtliche Contract-/Witness-/Display-/Part-/Ownership-/ComponentCase-/Known-Spec-Endpunkte; ausgeführt, geschrieben und reviewed werden ausschließlich Current-Cases, während jede Dependency bereits akzeptiert, unstaged und gegenüber HEAD unverändert ist;
- die totale Reference-Component-Context-Pair-Ownership wird ohne 22. Batchcollection ausschließlich aus der Pair↔ComponentFixture-Bijektion und `ExactBatchManifest.ownedKeys.componentFixtures` abgeleitet; jeder Record bindet genau `(component,context,fixture,owner)`, und sein kanonischer Digestinput ist die einzige Quelle des späteren `referenceComponentContextOwnershipDigest`;
- die Case-Bijektionen gelten ausschließlich über `AssetCase.exactAsset`, `DisplayCase.displayFixture`, `ComponentCase.componentFixture` und `CompositionContractCase.contract`, niemals über rohe Case-Keys; die duplikatfreie Registry-Union `conformanceCases` enthält Asset-, Display- und ComponentCases und ist die einzige Quelle für Corpus `CONFORMANCE_CASES`;
- `KNOWN_SYMBOL_SPEC_ASSET_INDEX` weist collision-safe exakt 256 verschiedene vollständige kanonische Specs (14 Base + 242 Recipes) ihren ExactAsset-Keys zu; partielle Registries enthalten nur aufgelöste Teilmengen, die vollständige Corpus-Registry exakt alle 256 unter `knownSymbolSpecAssets`;
- Whole erzeugt 30 `full`-, source-node-set 30 `selected`-Zellen; Leave-one-out erzeugt zwei getrennte 30-Zellen-Paare und je Width/Background acht paarseparierte Bilder. `EvidencePairKind` existiert ausschließlich im Foundation-Rastermodul und wird von Task 22 sowie Integration importiert; `RequiredConformancePair` ist der einzige exportierte autoritative `(case,pair)`-Verifikationsvertrag, und jede Attestation wird gegen die aus ihrem finalisierten ausgewählten Case abgeleitete kanonische Folge statt gegen eine von ihr selbst behauptete Pflichtmenge geprüft;
- der echte Canary besteht seine owner-freie Vektorprüfung und 90/90 RGBA-Zellen auf allen zehn Größen und drei Hintergründen;
- die reale Canary-Closure hat exakt `dependencies: []` und Current-ID `base-formation-canary`;
- jede Canary-Zelle wurde von einem unabhängigen visuellen Agenten anhand aller vier Bilder adressiert;
- lokale Originale, Bilder, XML, absolute Oraclepfade und Evidenzdateien sind nicht gestaged; der vollständige Source-/Bundle-/Pack-Artefaktscan bleibt als **ein** Gate im Integrationsplan und wird hier weder vorweggenommen noch dupliziert;
- der Output nennt ausschließlich den bestandenen Entwicklungsbatch und erhebt keinen 661-Asset-, Release-, Normativitäts- oder Lizenzclaim;
- der anschließende Corpusplan kann Worker-Shards ausschließlich über die stabilen fünf Batch-Exports hinzufügen; nur seine ausdrücklich Root-owned Vertrags-/Finalisierungsaufgaben ersetzen die Staging-Allowlist, finalisieren `ORACLE_OWNERSHIP_MANIFEST` und integrieren später den zentralen Aggregator.
