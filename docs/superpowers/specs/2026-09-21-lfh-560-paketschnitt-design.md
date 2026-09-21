# LFH-560 — Paketschnitt: `core` ist das Produkt, `conformance` das Prüfpaket

> Stand: 21. September 2026
> Tickets: LFH-560 (Initiative), LFH-570 bis LFH-576
> Grundlage: `docs/decisions/2026-09-13-grammatik-motor-und-paketschnitt.md`

## Ziel

```
heute:   cli → catalog → core → schema        Kanäle → core
morgen:  cli → conformance → core → schema    Kanäle → core
```

Wer die Bibliothek nutzt, braucht `core`, `schema` und einen Ausgabekanal. Rezepte,
Coverage-Manifest, Domain-Reviews, Fingerprints, Referenzinventar und die Gates liegen in
`conformance`. Der Umbau ist mechanisch: kein Verhalten ändert sich, keine Geometrie, kein Snapshot.

## Ausgangslage (origin/main, `d0260b0`)

- `packages/catalog/src` hat 19 MB, davon 16 MB SVG-Snapshots und 0,5 MB `fingerprints.json`.
- Die Geometriemodule bilden eine geschlossene Importhülle: 60 Dateien, rund 650 KB, und keine
  davon importiert ein Prüfmodul (Rezepte, Coverage, Reviews, Fingerprints, Regelbelege).
- `fonts.ts` importiert `node:url`; deshalb ist der Katalogindex nicht browsertauglich.
- Das Bausteinregister in `core/src/blocks/` zeigt mit `definedAt` auf `catalog/src/<datei>:<zeile>`,
  geprüft von `catalog/src/block-register/*.test.ts` am Quelltext.
- Baseline: 133 Testdateien, 6952 Tests grün, Typecheck grün.

## Schnitt (LFH-570)

**Nach `core/src/geometry/`** (Dateinamen bleiben, Unterordner bleiben):

| Modul | Grund |
|---|---|
| `base-symbols.ts`, `body-marks.ts`, `vehicle-categories.ts` | Grundzeichen, Körpermarken, Fahrwerk |
| `organizations.ts`, `strengths.ts`, `technical-head-marks.ts`, `administrative-heads.ts`, `function-roles.ts` | Farbe, Stärke, Kopfmarken, Verwaltungsstufe, Funktionsfassung |
| `pictograms/` (ohne Snapshot-Tests, die Schriftrasterung brauchen) | Piktogramme als Bausteine |
| `labels.ts`, `render-themes.ts`, `readonly-data.ts` | Beschriftung, Themes, Hilfsfunktion der Hülle |
| `contrast-exceptions.ts` | Befund an der Quelle, der laut eigenem Kommentar in der Auslieferung sichtbar sein muss |
| `text-metrics.ts` samt `arimo-metrics.json` und `arimo-bold-metrics.json` | Laufweiten sind Layoutdaten, kein Fontparser, keine Schriftdatei |

**Bleibt im Prüfpaket:** `fonts.ts` und die TTF-Dateien (Schriftbehandlung für die Rasterung, Node),
`elements.ts` (Elementinventar als Katalogvertrag), `sources.ts`, `profiles.ts`, Rezepte,
Coverage-Manifest und -Gate, Domain-Reviews und -Fragen, Fingerprints, Referenzinventar,
Regelbelege und -abdeckung, Herkunft je Kombination, Vergleichs- und benannte Ausnahmen.

**Tests folgen ihrem Modul**, solange sie nur `core`, `schema` und Relativimporte innerhalb der Hülle
brauchen. Tests, die rastern (`@resvg/resvg-js`, Schriftdateien) oder Rezepte lesen, bleiben im
Prüfpaket und importieren die Geometrie künftig aus `@einsatzzeichen/core`.

**`definedAt` behält seine Bedeutung:** Fundort der Zeichnung, jetzt `core/src/geometry/<datei>:<zeile>`.
Die Registertests ziehen nach `core`, weil `core` jetzt seine eigenen Quellen prüft. Beim Verschieben
bleiben Zeilennummern stabil (Importe `@einsatzzeichen/core` → relative Importe, ein Import pro
Zeile wie bisher); wo sich eine Zeile doch verschiebt, zieht der Registereintrag nach.

**Keine Standard-Ports in diesem Schnitt.** `compose()` nimmt weiter `CatalogPorts`. Eine
Zusammenstellung, mit der `core` ohne Prüfpaket rendert, ist LFH-580.

## Umbenennung (LFH-571)

`packages/catalog` → `packages/conformance`, Paketname `@einsatzzeichen/conformance`. Alle Importe,
`tsconfig*.json`, `vitest.config.ts`, `scripts/release/*`, `pnpm-lock.yaml`, CI-Workflows.
Publish-Umfang: `conformance` bleibt veröffentlichbar (CLI hängt daran); die Beschreibung sagt, dass
es für die Nutzung nicht nötig ist. Der alte npm-Name `@einsatzzeichen/catalog` ist eine offene Frage
an den Eigentümer (deprecaten oder als Weiterleitung behalten) — dieser Branch veröffentlicht nichts.

## Folgeslices (parallel, nach 570/571)

| Ticket | Dateizuständigkeit |
|---|---|
| LFH-572 CLI | `packages/cli/src/**` außer `verify-repository*` und `repository-policy.ts` |
| LFH-573 Website | `packages/website/**` |
| LFH-574 Repository-Gate | `packages/cli/src/commands/verify-repository*`, `repository-policy.ts` |
| LFH-575 Größen-Gate, Browser-Smoke | neue Tests unter `packages/core/`, Skript unter `scripts/` |
| LFH-576 Doku | `README.md`, `Vision.md`, `packages/*/README.md`, `docs/` außer `docs/superpowers/` |

## Akzeptanz

- `core` hat keine Laufzeitabhängigkeit außer `schema` und importiert kein `node:*`.
- Kein Paket außer `cli` und dem privaten `review`/`website` hängt an `conformance`.
- Testzahl gleich der Baseline (Tests ziehen um, verschwinden nicht), Typecheck grün,
  kein Snapshot verändert.
