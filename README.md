# einsatzzeichen

Regelbasierter Generator für taktische Zeichen der Gefahrenabwehr, nach der BBK/BABZ-Systematik.
Statt einzelner SVG-Dateien beschreibt eine Anwendung, **was** dargestellt werden soll
(`SymbolSpec`), und der Generator erzeugt daraus konsistent SVG und Canvas — aus einer
gemeinsamen internen Repräsentation (IR), nicht aus zwei parallel gepflegten Renderern.

Details zur Produktvision: [`Vision.md`](./Vision.md). Umfangs- und Messentscheidungen dieses
Slice (welche Grundzeichen fehlen und warum, die vermessene Kopfmarken- und Piktogrammgeometrie,
der Coverage-Manifest-Scope): [`docs/decisions/`](./docs/decisions/).

## Pakete

Vier Pakete, mit einer festen, zyklenfreien Abhängigkeitsrichtung:

```
cli → catalog → core → schema
```

| Paket | Inhalt |
|---|---|
| `schema` | Typen der internen Repräsentation (IR), Einheiten, Farbpalette. Null Fremdabhängigkeiten. |
| `core` | Renderer (SVG, Canvas), Hüllenberechnung, Fingerprint-Vergleich, Layoutprofile, Kompositionsmotor, Regelvalidierung. Hängt **nie** von `catalog` ab. |
| `catalog` | Grundzeichen, Organisationsfarben, Stärkeangaben, Fähigkeiten, Kompositionsrezepte, Coverage-Manifest. |
| `cli` | Kennzahlenableitung aus der lokalen Referenz, Coverage-Gate, SVG-Export. |

`schema` und `core` haben **null Fremdabhängigkeiten** — beide sind reines TypeScript ohne
externe Pakete.

## Die Millimeter-Regel

**Alle Längen in der IR und im Katalog sind Millimeter.** Die Umrechnung in SVG-Einheiten
geschieht ausschließlich im Renderer (`packages/core/src/render/`):

```
1 mm = 72 / 25.4 SVG-Einheiten
```

Diese Konstante wird nie gerundet hart eingetragen, sondern immer als Ausdruck berechnet
(`mmToUnits` in `packages/schema`). Die einzige Ausnahme: `SubpathBounds` und `Ring` im
`cli`-Paket (`packages/cli/src/scan/path-geometry.ts`) tragen SVG-Einheiten, weil sie direkt aus
den SVG-Koordinaten der Referenzdateien extrahiert werden, bevor eine Umrechnung stattfindet.

Geometrievergleiche (Fingerprint-Gate, Snapshot-Vergleich) verwenden eine Toleranz von
**0,01 SVG-Einheiten**.

## Der lokale Referenzbestand

`taktische-zeichen/` ist ein **lokaler Ordner mit den offiziellen BABZ-Referenz-SVGs** (661
Dateien). Er wird **niemals eingecheckt** — die Nutzungs- und Lizenzgrundlage ist ungeklärt, siehe
`.gitignore`. Ohne diesen Ordner lässt sich der Katalog trotzdem bauen, testen und typprüfen: das
abgeleitete Kennzahlenartefakt `packages/catalog/src/fingerprints.json` ist eingecheckt und wird
von CI verwendet.

`pnpm cli audit:reference` braucht diesen Ordner — es liest die 661 SVGs, leitet daraus
Kennzahlen ab (Hüllen, Strichstärken, Füllfarben; **keine** Pfaddaten oder Geometrie) und
schreibt sie nach `packages/catalog/src/fingerprints.json`. Dieser Lauf überschreibt das
eingecheckte Artefakt — nur ausführen, wenn das ausdrücklich beabsichtigt ist.

## Aufruf

Das CLI wird **aus dem Repo-Root** aufgerufen, ohne `--`-Separator vor den Optionen:

```bash
pnpm typecheck
pnpm test

pnpm cli audit:reference [--filter <präfix>] [--print]
pnpm cli coverage
pnpm cli export --out <pfad> --size <px>
```

- `audit:reference` — Referenzbestand einlesen, Kennzahlen ableiten. `--filter <präfix>` schränkt
  auf Dateinamen mit diesem Präfix ein (z. B. `"1."` oder `"C.1.1"`); `--print` gibt nur aus,
  schreibt nicht nach `fingerprints.json`.
- `coverage` — prüft das Coverage-Manifest gegen den Katalog (Coverage-Gate).
- `export --out <pfad> --size <px>` — rendert alle Grundzeichen und Kompositionsrezepte als SVG
  nach `<pfad>`, mit `<px>` Kantenlänge.
