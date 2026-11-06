# @einsatzzeichen/core

Das Produkt von Einsatzzeichen: Bausteine und Geometrie der Zeichen (Grundzeichen, Organisationsfarben, Stärken, Kopfmarken, Piktogramme, Render-Themes, Textlaufweiten), Kompositionsmotor, Regelvalidierung, Layout-Profile sowie Renderer für SVG und Canvas. Ohne Fremd- und ohne Node-Abhängigkeit, läuft auch im Browser. Für die Nutzung reichen `@einsatzzeichen/core`, `@einsatzzeichen/schema` und ein Ausgabekanal; das Prüfpaket `@einsatzzeichen/conformance` ist nicht nötig.

## Ein Zeichen beschreiben

Der einfache Einstieg seit 6.12: Eine **Beschreibung** (`Sign`) sagt, was gemeint ist. Die Bibliothek wählt die Fassungen selbst und zeichnet immer etwas.

```ts
import { draw, renderSvg } from '@einsatzzeichen/core';

const { drawing, fidelity, omitted } = draw(
  { kind: 'formation', organization: 'thw', head: 'gruppe', text: { center: 'B', bottomRight: 'THW' } },
  { title: 'Bergungsgruppe' },
);
const svg = renderSvg(drawing, { size: 64 });
```

Die Felder: `kind`, `variant`, `organization` oder `color` (eins von beiden), `tasks` (Fachaufgaben; ob randbündig oder in der Box, wählt die Bibliothek: vermessen vor abgeleitet, randbündig vor Box), `head` (genau eine Angabe der Kopfzone: Stärke, Verband, Verwaltungsstufe oder technische Kopfmarke), `role`, `chassis`, `states` (Zustände und höchstens eine Tendenz) und `text` (`center`, `centerSize`, `bottomRight`, `below` für die Fußzone und die übrigen Zonen). Was die Beschreibung nicht ausdrückt, trägt `exact` als Ergänzung zum Bauplan.

- `draw(sign, options?)` wirft nie wegen einer Regel. Trägt die Beschreibung nicht, lässt es in fester Reihenfolge weg, was nicht passt; `omitted` nennt jedes weggelassene Teil mit Grund, `fidelity` ist dann `simplified`, sonst `measured` oder `derived`. `exact` ist der gezeichnete Bauplan, `key` ein stabiler Schlüssel für Caches.
- `check(sign)` prüft streng und nennt je Befund das Feld der Beschreibung.
- `choices(sign, field)` sagt je Wert eines Feldes, ob er zur übrigen Beschreibung passt, mit deutschem Namen und Gruppe.
- `describe(sign)` gibt Name und Vorlesetext.
- `serialize(sign)` / `parse(text)` schreiben die Hülle `{"v":2,"sign":{…}}`; `parse` liest auch `{"v":1,…}` und alte Links. `encodeSignParam` / `decodeSignParam` für URLs.
- `resolve(sign)` macht den Bauplan, `fromExact(spec)` den Rückweg. Für jedes Rezept und jedes typische Einsatzmittel zeichnet `draw(fromExact(spec))` bytegleich dasselbe wie `drawSymbol(spec)`.
- `KIND_FAMILIES` gruppiert die Arten für eine erste Auswahl („Einheit“, „Fahrzeug“, …).

Freistehende Zeichen (siehe unten) sind ebenfalls eine Beschreibung und gehen unverändert in `draw`, `check`, `describe` und `serialize`. Die Kanäle `react` (`<Einsatzzeichen sign={…} />`), `maplibre` (`addSymbolImage(map, id, sign, …)`) und `web-component` (Property `sign`) nehmen eine Beschreibung direkt.

### Subpfade

| Einstieg | Inhalt |
|---|---|
| `@einsatzzeichen/core` | alles, wie bisher, dazu die Beschreibung |
| `@einsatzzeichen/core/exact` | die Bauplan-Welt: `drawSymbol`, `compose`, `validateSpec`, `checkSpec`, `vocabulary`, die Codecs, `explainIssue`, Herkunft, `resolve`, `fromExact` |
| `@einsatzzeichen/core/blocks` | Bausteine und Geometrie: Grundzeichen, Körpermarken, Köpfe, Piktogramme, Register, Namen |
| `@einsatzzeichen/core/sketch` | die Kommunikationsskizze |

Bis 7.0 steht alles weiter auch an der Wurzel. Die Entscheidung steht in `docs/decisions/2026-11-06-esz-149-beschreibung-und-bauplan.md` im Repository.

## Ein Zeichen exakt bauen

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

## Freistehende Zeichen

Pfeile (5.2), Linien und Grenzen (2.14–2.20), Wetter (5.8.7), Tierzustände (5.8.6), ein Zustand aus 5.8 für sich (`kind: 'state'`) und die Einzelpiktogramme aus Kapitel 4 und den Anhängen D, I.5, J, K, L und M (`kind: 'pictogram'`) stehen ohne Grundzeichen auf der Lagekarte. Sie haben eine eigene Beschreibung neben der `SymbolSpec`, erkennbar am Feld `kind`: ein Pfeil folgt einem selbst gelegten Verlauf, das Wetter zeigt einen Wert allein oder die Wolke mit einem Niederschlag in einer von vier Stärken.

- `drawFreestanding(spec)` zeichnet sie, `drawAnySpec(spec)` nimmt beide Arten.
- `checkAnySpec(spec)` gibt die Zeichnung oder den erklärten Grund zurück; die Regeln (`validateFreestandingSpec`, `FREESTANDING_RULE_IDS`) sind über `explainIssue()` erklärbar.
- `serializeAnySpec` / `parseAnySpec` / `encodeAnySpecParam` / `decodeAnySpecParam` schreiben sie in dieselbe Hülle, unter `freestanding` statt `spec`.
- Eine Spec je Bild: `state` und `pictogram` lehnen Werte mit eigener Spec ab (Wetter, Tier- und Personenzustand, Leitstelle D.2.5); `freestandingRedirect(spec)` nennt sie.
- `freestandingVocabulary(spec, field)` sagt je Wert, ob er passt; `freestandingProvenance(spec)` nennt die Referenzdatei.

```ts
import { drawAnySpec, renderSvg } from '@einsatzzeichen/core';

const svg = renderSvg(
  drawAnySpec({ kind: 'weather', values: ['weather-cloudy', 'weather-snowing'], intensity: 'moderate' }),
  { size: 64 },
);
```

## Schrift

`renderSvg()` und `renderCanvas()` setzen Kürzel in der Familie `TEXT_FONT_FAMILY_ATTR` (`Einsatzzeichen Sans`). Ohne die Schrift setzt der Browser eine Ersatzschrift mit anderen Vorschubbreiten, und das Kürzel steht nicht mehr dort, wo die Geometrie es vorsieht. `core` liefert sie als WOFF2 unter dem Subpfad `@einsatzzeichen/core/fonts/*` mit:

```ts
// Alle vier Stufen (400, 500, 700, 500 kursiv) als @font-face:
import '@einsatzzeichen/core/fonts/text.css';

// Oder eine einzelne Datei als URL (Vite):
import mediumUrl from '@einsatzzeichen/core/fonts/text-medium.woff2?url';
```

Für `renderCanvas()` muss die Schrift geladen sein, bevor gezeichnet wird: ``await document.fonts.load(`500 16px ${TEXT_FONT_FAMILY_ATTR}`)``. Die Dateinamen nennen die Stufe, nicht die Schrift; sie bleiben beim Schriftwechsel stehen. Mehr in `fonts/README.md`.

## Installation

```bash
pnpm add @einsatzzeichen/core
```

Teil des Monorepos [einsatzzeichen](https://github.com/rubenvitt/einsatzzeichen) — ein semantisches Symbolsystem für taktische Zeichen der Gefahrenabwehr. Dokumentation und Hintergründe im [Repository](https://github.com/rubenvitt/einsatzzeichen#readme).

## Lizenz

MIT. Die Schriftdateien unter `fonts/` stehen unter der SIL Open Font License 1.1 (`fonts/OFL.txt`).
