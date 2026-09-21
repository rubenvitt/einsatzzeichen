# @einsatzzeichen/core

Das Produkt von Einsatzzeichen: Bausteine und Geometrie der Zeichen (Grundzeichen, Organisationsfarben, Stärken, Kopfmarken, Piktogramme, Render-Themes, Textlaufweiten), Kompositionsmotor, Regelvalidierung, Layout-Profile sowie Renderer für SVG und Canvas. Ohne Fremd- und ohne Node-Abhängigkeit, läuft auch im Browser. Für die Nutzung reichen `@einsatzzeichen/core`, `@einsatzzeichen/schema` und ein Ausgabekanal; das Prüfpaket `@einsatzzeichen/conformance` ist nicht nötig. Die Vorlagenrezepte (`RECIPES`) und der Kurzweg `composeFromCatalog()` liegen allerdings noch dort — ohne sie übergibt man `compose()` die Bausteine aus `core` selbst.

## Installation

```bash
pnpm add @einsatzzeichen/core
```

Teil des Monorepos [einsatzzeichen](https://github.com/rubenvitt/einsatzzeichen) — ein semantisches Symbolsystem für taktische Zeichen der Gefahrenabwehr. Dokumentation und Hintergründe im [Repository](https://github.com/rubenvitt/einsatzzeichen#readme).

## Lizenz

MIT
