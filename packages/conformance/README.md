# @einsatzzeichen/conformance

Prüfpaket von Einsatzzeichen: Rezepte, Coverage-Manifest, Domain-Reviews, Fingerprints, Referenzinventar, Coverage- und Regel-Gates sowie die Schrift-Assets (Arimo unter SIL OFL 1.1) für die Rasterung. Für die Nutzung der Bibliothek ist es nicht nötig — Bausteine, Geometrie und Renderer liegen in `@einsatzzeichen/core`. Bis Version 1.5 hieß das Paket `@einsatzzeichen/catalog`.

**Umstieg von `@einsatzzeichen/catalog`:** Paketnamen ersetzen und die Bausteine (`baseDrawing`, `organizationColor`, `pictogram`, `RENDER_THEMES`, `PRINT_MONOCHROME_THEME`, `describeSymbolSpec`, `ARIMO_TEXT_METRICS` und ihre Nachbarn) aus `@einsatzzeichen/core` importieren — der Index dieses Pakets führt sie nicht mehr. `RECIPES` und `composeFromCatalog()` bleiben hier. Der Index ist wegen `fonts.ts` (`node:url`) nicht browsertauglich.

## Installation

```bash
pnpm add @einsatzzeichen/conformance
```

Teil des Monorepos [einsatzzeichen](https://github.com/rubenvitt/einsatzzeichen) — ein semantisches Symbolsystem für taktische Zeichen der Gefahrenabwehr. Dokumentation und Hintergründe im [Repository](https://github.com/rubenvitt/einsatzzeichen#readme).

## Lizenz

MIT — Schrift-Assets (Arimo) unter SIL Open Font License 1.1, siehe Repository.
