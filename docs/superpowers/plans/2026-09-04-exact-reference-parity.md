# Exact Reference Parity — Ausführungsprogramm

> **Für die Umsetzung verpflichtend:** `superpowers:subagent-driven-development` führt jeden
> Implementierungsschritt mit einem frischen Implementierungsagenten und anschließendem,
> ebenfalls frischem Task-Reviewer aus. Implementierungsagenten dürfen keine eigenen Agenten
> starten. Der Root-Controller ist alleiniger Integrator.

**Ziel:** Sämtliche 661 lokalen BABZ-Referenz-SVGs, alle 544 vorhandenen Displays und alle 413
sichtbaren Baukastenkomponenten werden durch eine vollständig committed, selbständige
Reference-Exact-IR reproduziert und unter dem gepinnten Resvg-Vertrag mit RGBA-Null-Diff
nachgewiesen.

**Verbindliche Spezifikation:**
`docs/superpowers/specs/2026-09-04-exact-reference-parity-design.md`

**Teilpläne:**

1. `docs/superpowers/plans/2026-09-04-exact-reference-foundation.md`
2. `docs/superpowers/plans/2026-09-04-exact-reference-corpus.md`
3. `docs/superpowers/plans/2026-09-04-exact-reference-integration.md`

Die Spezifikation ist bei jedem Widerspruch autoritativ. Die drei Teilpläne bilden eine einzige
explizite Ausführungs-DAG:

```text
Foundation Tasks 1–26
  -> Integration Task 0
  -> Corpus Tasks 1–94
  -> Integration Tasks 1–24
  -> Corpus Task 95
```

Jeder Teilplan besitzt seinen eigenen ignorierten SDD-Ledger unter
`.superpowers/sdd/<plan-basename>/progress.md`; ein abgeschlossener Teilplan wird durch einen
unabhängigen Whole-Plan-Review freigegeben. Bei den beiden absichtlich unterbrochenen Plänen
bleibt derselbe Ledger autoritativ; ein bereits abgeschlossenes Taskpräfix wird nie erneut
dispatcht.

## Nicht verhandelbare Grenzen

- Original-SVGs, ihr XML, Raster, Diffbilder, Heatmaps und lokale Pfade bleiben außerhalb von Git,
  Buildartefakten, Sourcemaps und publizierbaren Paketen. Das lokale Orakel wird ausschließlich per
  explizitem `--reference-root` an Tests und CLI übergeben.
- Die public Library enthält die exakte, eigenständig implementierte Geometry-/Paint-IR. Es gibt
  keinen Runtime-Fallback auf das lokale Referenzverzeichnis und keine zweite Whole-Asset-Geometrie
  neben der aus Components materialisierten Ausgabe.
- `NormalizedPaintList/v1` und der decodierte RGBA-Vergleich akzeptieren keine Toleranz. Alle zehn
  Pflichtgrößen sowie transparenter, schwarzer und weißer Hintergrund müssen jeweils Null-Diff
  ergeben.
- Exakte Komponenten werden für jeden gültigen, erreichbaren Builder-Kontext fail-closed aufgelöst.
  Freie Bezeichnung bleibt ein ausdrücklich nicht exact-attestiertes `generated-overlay`.
- Bestehende Änderungen an `packages/catalog/src/domain-reviewers.ts` und
  `packages/catalog/src/domain-reviews.ts` sind nutzereigen und werden weder verändert noch in
  einen Task-Commit aufgenommen.
- Kein Push, Merge, Publish, Deployment oder Schreiben in ein gemeinsames externes System gehört
  zu diesem Programm.

## Isolierung und Baseline

### Plan-Suite-Preflight

Noch im ursprünglichen Checkout wird vor jeder Worktree-Erzeugung genau ein eigener
Plan-Suite-Commit erstellt. Er enthält **ausschließlich** diese sechs Pfade:

```text
.gitignore
docs/superpowers/plans/2026-09-04-exact-reference-corpus.md
docs/superpowers/plans/2026-09-04-exact-reference-foundation.md
docs/superpowers/plans/2026-09-04-exact-reference-integration.md
docs/superpowers/plans/2026-09-04-exact-reference-parity.md
docs/superpowers/specs/2026-09-04-exact-reference-parity-design.md
```

Root staged diese sechs Pfade explizit und führt unmittelbar vor dem Commit
`rtk git -c core.fsmonitor=false diff --cached --name-only` aus. Dessen vollständige Ausgabe
muss bytegleich der obigen, lexikografisch sortierten Liste sein; ein fehlender, zusätzlicher,
umbenannter oder gelöschter Pfad bricht ab. Insbesondere bleiben die nutzereigenen Änderungen an
`packages/catalog/src/domain-reviewers.ts` und `packages/catalog/src/domain-reviews.ts` sowie alle
anderen nicht genannten Änderungen unverändert und unstaged. Nach dem Commit wird dessen ID als
`PLAN_SUITE_COMMIT=$(rtk git -c core.fsmonitor=false rev-parse HEAD)` festgehalten und mit
`rtk git -c core.fsmonitor=false show --pretty='' --name-only "$PLAN_SUITE_COMMIT"` erneut gegen
dieselbe Sechserliste geprüft.

```bash
rtk git -c core.fsmonitor=false add -- \
  .gitignore \
  docs/superpowers/specs/2026-09-04-exact-reference-parity-design.md \
  docs/superpowers/plans/2026-09-04-exact-reference-parity.md \
  docs/superpowers/plans/2026-09-04-exact-reference-foundation.md \
  docs/superpowers/plans/2026-09-04-exact-reference-corpus.md \
  docs/superpowers/plans/2026-09-04-exact-reference-integration.md
rtk diff -u \
  <(rtk printf '%s\n' .gitignore docs/superpowers/plans/2026-09-04-exact-reference-corpus.md docs/superpowers/plans/2026-09-04-exact-reference-foundation.md docs/superpowers/plans/2026-09-04-exact-reference-integration.md docs/superpowers/plans/2026-09-04-exact-reference-parity.md docs/superpowers/specs/2026-09-04-exact-reference-parity-design.md) \
  <(rtk git -c core.fsmonitor=false diff --cached --name-only)
rtk git -c core.fsmonitor=false commit -m "docs: bind exact reference parity plan suite"
PLAN_SUITE_COMMIT=$(rtk git -c core.fsmonitor=false rev-parse HEAD)
rtk diff -u \
  <(rtk printf '%s\n' .gitignore docs/superpowers/plans/2026-09-04-exact-reference-corpus.md docs/superpowers/plans/2026-09-04-exact-reference-foundation.md docs/superpowers/plans/2026-09-04-exact-reference-integration.md docs/superpowers/plans/2026-09-04-exact-reference-parity.md docs/superpowers/specs/2026-09-04-exact-reference-parity-design.md) \
  <(rtk git -c core.fsmonitor=false show --pretty='' --name-only "$PLAN_SUITE_COMMIT")
rtk git -c core.fsmonitor=false worktree add -b codex/exact-reference-parity \
  .worktrees/exact-reference-parity "$PLAN_SUITE_COMMIT"
```

Die beiden Namensausgaben sind jeweils eine harte Assertion gegen die literal Sechserliste, keine
bloße Diagnose. Existiert Branch oder Zielworktree bereits, wird nicht wiederverwendet, sondern
vor jeder weiteren Aktion kontrolliert abgebrochen.

Die Umsetzung läuft auf `codex/exact-reference-parity` im projektlokalen, ignorierten Worktree
`.worktrees/exact-reference-parity`. Root erzeugt Branch und Worktree ausdrücklich aus genau
`$PLAN_SUITE_COMMIT`, prüft dort `HEAD == $PLAN_SUITE_COMMIT` und zeichnet erst anschließend im
Foundation-Ledger `BASE=$(rtk git -c core.fsmonitor=false rev-parse HEAD)` auf. Damit enthalten
Worktree und späterer `BASE..HEAD`-Review die autoritative Spec und alle vier Pläne. Das lokale
Orakel bleibt im ursprünglichen Checkout; der Caller übergibt dem Strict-Lauf trotzdem wörtlich
`../../taktische-zeichen`. Ausschließlich der Prozess darf diesen relativen Wert im Speicher
auflösen. Ein absoluter Oraclepfad wird weder geloggt noch persistiert oder in Evidence,
Fehlermeldungen, Digests, Builds beziehungsweise Artefakte übernommen.

Vor Task 1 werden folgende Baselines im Foundation-Ledger protokolliert:

```text
rtk mise exec -- pnpm typecheck
rtk mise exec -- pnpm test
rtk mise exec -- pnpm build
rtk mise exec -- pnpm --filter @einsatzzeichen/review typecheck
rtk mise exec -- pnpm --filter @einsatzzeichen/website check
rtk mise exec -- pnpm cli coverage
rtk mise exec -- pnpm cli verify:repository
rtk git -c core.fsmonitor=false diff --check
```

Ein umgebungsbedingter Sandbox-/IPC-Fehler wird diagnostiziert und als `Ruling` mit exaktem
Fehlertext festgehalten; ein fachlich rotes Gate wird nicht als Baseline akzeptiert.

## Subagent-Vertrag pro Task

1. Root verwendet den vom aktiven Teilplan vorgeschriebenen Briefgenerator und erzeugt genau eine
   zuvor als abwesend und nicht symlinkend geprüfte Requirements-Datei. Für Foundation,
   Integration und ausschließlich Corpus Tasks 2, 3 und 94 lautet der Aufruf ohne Vertrauen auf
   Executable-Bits wörtlich
   `bash /Users/rubeen/.codex/plugins/cache/openai-curated-remote/superpowers/6.3.0/skills/subagent-driven-development/scripts/task-brief <plan> <task> <verified-absent-output>`.
   Corpus Task 1 verwendet seinen einmaligen, bytegleich reproduzierten Bootstrapbrief; Corpus
   Tasks 4–93 und 95 verwenden ausschließlich
   `rtk node scripts/exact/build-corpus-brief.mjs` mit den im Corpus-Plan vorgeschriebenen
   task-, descriptor-, evidence-, dependency-, attempt- und out-Argumenten. Root prüft jeden
   erzeugten Brief nach dem jeweiligen Teilplan; es gibt keinen generischen Fallback und keinen
   direkten Aufruf eines installierten Scripts über dessen Executable-Bit.
2. Ein frischer Implementierungsagent liest nur Brief, notwendige Schnittstellen und Spec. Er
   besitzt ausschließlich die im Task genannten Dateien, schreibt zuerst den spezifizierten roten
   Test, belegt RED, implementiert minimal, belegt GREEN, führt die Task-Gates aus, self-reviewed,
   committet nur seinen Scope und schreibt einen vollständigen Report in den SDD-Workspace.
3. Root erzeugt für `BASE..HEAD` mit `review-package` ein Diffpaket. Ein frischer Reviewer prüft
   separat Spezifikationskonformität und Codequalität; der Implementierer reviewt sich nie selbst.
4. Critical/Important- oder Spec-Findings gehen in höchstens fünf Fixrunden. Runde 1–3 geht an den
   ursprünglichen Implementierer, Runde 4–5 an einen frischen stärkeren Agenten. Jede Runde erhält
   eine eigene Re-Review.
5. Erst nach beiden positiven Verdicts markiert Root den Task im plan-spezifischen Ledger als
   vollständig. Der nächste Implementierungsagent startet nie parallel zum vorherigen.

Für die 90 Corpus-Shards ist jeder Shard ein eigener Implementierungs- und Review-Scope. Kein
Shard enthält mehr als zwölf Originalassets oder mehr als eine Komponentenfamilie. Nur Root ändert
`packages/catalog/src/exact/batches/index.ts`, und zwar in dedizierten Integrationsaufgaben nach
geprüften Shard-Gruppen.

## Phasen und harte Übergabegates

### Phase A — Foundation (Tasks 1–26)

Der Foundation-Plan liefert Exact-Typen, Canonical Decimal/JSON, Path-/Transform-Normalisierung,
Paint-Listen und Owner-Indexe, Oracle-Loader, Exact-SVG-/Layered-Renderer, RGBA-Diff, Registry-/Part-/
Mask-/Witness-/Attestation-Kernel sowie eine kleine Canary-Batch. Übergabe nur bei grünen fokussierten
Tests, Root-Typecheck, Build und unabhängigem Foundation-Review.

### Phase B — sicherer Review-Bootstrap und Korpusvertrag

Integration Task 0 liefert unmittelbar nach der Foundation den kontextsensitiven staged
Source-Leak- und lokalen Review-Evidence-Pfad und prüft ihn zunächst gegen die Foundation-Canary
sowie synthetische Staging-Closures. Corpus Tasks 1–3 frieren anschließend die reale
90-Shard-Partition, Component-Allokation und Ownership-Baseline ein und ersetzen die temporäre
Allowlist durch alle 90 Descriptoren. Erst danach beginnt ein schreibender Korpus-Shard.

### Phase C — vollständiger Korpus (Tasks 4–94)

Der Corpus-Plan implementiert exakt die maschinell aufgelöste, paarweise disjunkte Vereinigung aller
90 Shards. Jeder Shard trägt seine Asset-, Component-, Part-, Plan- und Case-Daten selbst. Die
Mengen-Gates müssen jederzeit tatsächliche `OracleAssetKey`s prüfen; Kapitel-/Bereichslabels ersetzen
nie echte Dateinamen. Übergabe erst bei genau 661 Asset-, 544 Display-, 525 Whole-, 19 Part- und 413
Component-Schlüsseln, vollständigem Ownership-/Use-/Witness-Graph und Null-Diff aller Cases.

### Phase D — API, Konsumenten und Release (Tasks 1–24)

Der Integrationsplan führt `exactAsset`, `exactComponent`, `composeExact`, atomare Traces und
`RenderableDrawing` durch Catalog, React, Web Component, MapLibre, QGIS, Website, Review und CLI.
Danach folgen Strict-Runner, Attestation/Freshness und Artifact-Leak-Gates. Kein Konsument darf eigene
Exact-Geometrie rekonstruieren oder einen stärkeren Claim als sein geprüfter Ausgabekanal ausgeben.

### Phase E — unabhängige Gesamtabnahme (Corpus Task 95)

Ein frischer, leistungsstärkster Reviewer erhält Spec, alle drei Pläne, sämtliche Ledger und den
Whole-Branch-Diff. Nach höchstens einer zentralen Fixdispatch plus Re-Review werden die vollständigen
Gates ausgeführt:

```text
rtk mise exec -- pnpm typecheck
rtk mise exec -- pnpm test
rtk mise exec -- pnpm build
rtk mise exec -- pnpm --filter @einsatzzeichen/review typecheck
rtk mise exec -- pnpm --filter @einsatzzeichen/website check
rtk mise exec -- pnpm --filter @einsatzzeichen/website build
rtk mise exec -- pnpm cli coverage
rtk mise exec -- pnpm cli verify:repository
rtk mise exec -- pnpm cli conformance verify --strict --reference-root ../../taktische-zeichen
rtk git -c core.fsmonitor=false diff --check
```

Zusätzlich werden alle Package-Tarballs, Website-, QGIS- und Release-Bundles durch das
Artifact-Leak-Gate geprüft. Technische Exact-Attestation und fachlich/rechtliche öffentliche Freigabe
bleiben getrennte Zustände. Die Branch-Integration erfolgt erst danach mit
`superpowers:finishing-a-development-branch` und benötigt eine eigene Nutzerentscheidung.
