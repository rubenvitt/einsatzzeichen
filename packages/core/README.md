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

## Installation

```bash
pnpm add @einsatzzeichen/core
```

Teil des Monorepos [einsatzzeichen](https://github.com/rubenvitt/einsatzzeichen) — ein semantisches Symbolsystem für taktische Zeichen der Gefahrenabwehr. Dokumentation und Hintergründe im [Repository](https://github.com/rubenvitt/einsatzzeichen#readme).

## Lizenz

MIT
