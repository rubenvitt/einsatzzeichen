# @einsatzzeichen/core

Das Produkt von Einsatzzeichen: Bausteine und Geometrie der Zeichen (Grundzeichen, Organisationsfarben, Stärken, Kopfmarken, Piktogramme, Render-Themes, Textlaufweiten), Kompositionsmotor, Regelvalidierung, Layout-Profile sowie Renderer für SVG und Canvas. Ohne Fremd- und ohne Node-Abhängigkeit, läuft auch im Browser. Für die Nutzung reichen `@einsatzzeichen/core`, `@einsatzzeichen/schema` und ein Ausgabekanal; das Prüfpaket `@einsatzzeichen/conformance` ist nicht nötig.

## Ein Zeichen zeichnen

`drawSymbol()` macht aus einer `SymbolSpec` eine Zeichnung — mit der Standardbelegung der Bausteine (`DEFAULT_PORTS`) und einer aus der Spec abgeleiteten Beschreibung für Screenreader. Wer einzelne Bausteine tauschen will, ruft `compose(spec, { ...DEFAULT_PORTS, … })` selbst auf.

```ts
import { drawSymbol, renderSvg } from '@einsatzzeichen/core';
import type { SymbolSpec } from '@einsatzzeichen/schema';

// E.1.1 „Bergungsgruppe" des THW
const spec: SymbolSpec = {
  kind: 'formation',
  whiteInnerContour: true,
  organization: 'thw',
  strength: 'gruppe',
  labels: { center: 'B', bottomRight: 'THW' },
};

const svg = renderSvg(drawSymbol(spec, { title: 'Bergungsgruppe' }), { size: 64 });
```

Verstößt die Spec gegen eine Regel, wirft `drawSymbol()` eine `CompositionError` mit der Regel-ID jedes Befunds.

## Aus der Grammatik speisen

Für Oberflächen und Skripte, die Zeichen zusammensetzen lassen:

- `SPEC_FIELD_VALUES` / `specFieldValues(field)` — der Wertevorrat je Feld der `SymbolSpec`.
- `vocabulary(spec, field)` — welche Werte zur übrigen Spec passen; je Wert `allowed` oder `blocked` mit Grund `rule` (erklärte Regeln) oder `not-measured`. Gerechnet über `drawSymbol()`. Ein Skript beginnt bei `vocabulary({}, 'kind')`.
- `checkSpec(spec)` — die Zeichnung oder der erklärte Grund, warum es keine gibt, statt eines Wurfs.
- `explainIssue()` / `explainRejection()` — Titel, Erklärung und Feld je Regel.
- `symbolProvenance(spec)` — `verbatim` oder `derived`.
- `serializeSpec` / `parseSpec` / `encodeSpecParam` / `decodeSpecParam` — die kanonische Form für Dateien und Links.

```ts
import { checkSpec, vocabulary } from '@einsatzzeichen/core';

const fills = vocabulary({ kind: 'formation', organization: 'thw' }, 'technicalFill');
// → alle `blocked`, reason 'rule': Organisation und technische Füllung schließen sich aus

const result = checkSpec({ kind: 'formation', organization: 'thw', strength: 'gruppe' });
if (!result.ok && result.reason === 'rule') console.log(result.issues.map((issue) => issue.title));
```

## Installation

```bash
pnpm add @einsatzzeichen/core
```

Teil des Monorepos [einsatzzeichen](https://github.com/rubenvitt/einsatzzeichen) — ein semantisches Symbolsystem für taktische Zeichen der Gefahrenabwehr. Dokumentation und Hintergründe im [Repository](https://github.com/rubenvitt/einsatzzeichen#readme).

## Lizenz

MIT
