# @einsatzzeichen/cli

Kommandozeilenwerkzeug: SVG/PNG-Export, Katalog-Coverage, Referenz-Audits und Review-Dossiers. Nach der Installation steht das Kommando `einsatzzeichen` bereit.

## Umstieg auf @einsatzzeichen/core 7.0

```bash
npx @einsatzzeichen/cli codemod:7 src           # zeigt, welche Dateien sich ändern
npx @einsatzzeichen/cli codemod:7 src --write   # schreibt die Importe um
```

Verteilt jeden Import aus `@einsatzzeichen/core` auf die Subpfade `exact`, `blocks`, `sketch` und `gates`, in die die Namen in 7.0 gezogen sind. `import * as core`, `import()` und `require` meldet er mit Zeile, statt sie anzufassen.

## Installation

```bash
pnpm add @einsatzzeichen/cli
```

Teil des Monorepos [einsatzzeichen](https://github.com/rubenvitt/einsatzzeichen) — ein semantisches Symbolsystem für taktische Zeichen der Gefahrenabwehr. Dokumentation und Hintergründe im [Repository](https://github.com/rubenvitt/einsatzzeichen#readme).

## Lizenz

MIT
