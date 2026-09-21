# LFH-564 — Bausteinregister ohne Kombinationsbezug

> Stand: 21. September 2026
> Initiative: LFH-559 (Zeichen-Grammatik). Vorgänger: LFH-562 (Zonenmodell), LFH-563 (Regelkatalog).
> Scope: `docs/decisions/2026-09-13-grammatik-motor-und-paketschnitt.md`

## Auftrag aus der Scope-Entscheidung (wörtlich)

> **Baustein** — Atomare Geometrie ohne Kombinationsbezug: Grundzeichen, Farbe, Stärke, Verband,
> Verwaltungsstufe, Fahrwerk, Fähigkeit, Funktionsfassung, Zustand, Tendenz, Pfeil, Linie.

> Bausteinregister ohne Kombinationsbezug (inklusive aller sechs Verwaltungsstufen und der
> Verbände aus 5.5)

## Abgrenzung zu LFH-570

LFH-570 (Initiative B) verschiebt die **Geometrie** aus `packages/catalog` nach `core`. Dieses
Register verschiebt keine Geometrie. Es führt als **Daten** in `core`, welche Bausteine die
Grammatik kennt: je Baustein Kennung, Kategorie, Zielzone, Messstand und den Fundort der heutigen
Zeichnung. Das Muster ist dasselbe wie beim Zonenmodell: es wird keine Messung erfunden, sondern auf
die Stelle gezeigt, an der die Zahl schon mit ihrer Herkunft steht. `core` importiert dabei nichts
aus `catalog`, weil das Repository-Gate das verbietet.

## Datenmodell

`packages/schema/src/blocks.ts`:

- `BlockCategory`: 14 Kategorien. Das sind die zwölf aus der Scope-Entscheidung und zwei weitere,
  `technical-head-mark` und `body-mark`. Beide sind heute Felder von `SymbolSpec` mit eigener
  Geometrie. Ohne sie wäre das Register gegenüber der Spec unvollständig, und LFH-568 könnte die
  Regelabdeckung nicht über alle Werte rechnen.
- `BlockId` = `` `${category}/${valueId}` ``. Varianten der Grundzeichen tragen die Form
  `base-symbol/<kind>/<variant>`.
- `BlockBinding` mit drei Zuständen wie beim Zonenmodell: `measured` mit Fundort, `not-measured`
  mit Lücke und `measured-absent`.
- `BlockCombinationBinding` (optional): Der heutige Motor bindet den Baustein an einen anderen,
  etwa die Verwaltungsstufe an die Funktionsfassung. Die Bindung wird mit Regel-ID und Fundort als
  **benannte Ausnahme** geführt, nie als stiller Sonderpfad. Die Regel-ID muss im Regelkatalog
  stehen.
- `BlockCategoryGap`: Kategorien, für die das Schema noch keine Werte kennt (Pfeil, Linie). Sie
  werden **nicht** mit erfundenen Kennungen belegt, sondern als Lücke mit Verweis auf LFH-566
  geführt.

Neu im Schema: `UnitGroupingId` = `verband-i | verband-ii | verband-iii`. Belegt sind die
Kennungen durch die Referenzdateien `5.5.1–5.5.3_Bereitschaft (Verband I–III).svg`. Ein Feld in
`SymbolSpec` kommt **nicht** dazu, das gehört zu LFH-577.

## Belegung

| Kategorie | Wertequelle | Erwarteter Stand |
|---|---|---|
| base-symbol | `SYMBOL_KINDS` + Variantenzweige | measured (`catalog/src/base-symbols.ts`) |
| color | `ORGANIZATION_IDS` | measured (`organizations.ts`) |
| strength | `STRENGTH_IDS` | measured (`strengths.ts`) |
| unit-grouping | `UNIT_GROUPING_IDS` | not-measured (keine Geometrie) |
| administrative-level | `ADMIN_LEVEL_IDS` | 3 measured, `gemeinde`/`bezirk`/`bundesland` not-measured; Kombinationsbindung an `functionRole` |
| technical-head-mark | `TECHNICAL_HEAD_MARK_IDS` | measured |
| chassis | `VEHICLE_CATEGORY_IDS` | laut `MEASURED_VEHICLE_CATEGORIES` |
| capability | `CAPABILITY_IDS` | Box-Fassung laut Piktogrammen |
| body-mark | `TECHNICAL_BODY_MARK_IDS` | laut `body-marks.ts` |
| function-role | `FUNCTION_ROLE_IDS` | measured; Kombinationsbindung (Fassung bringt Körper, Text, Kopf mit) |
| state | `STATE_IDS` ohne Tendenzen | Geometrie measured (Piktogramm), Zielzone `state-margin` |
| tendency | Tendenzwerte aus `STATE_IDS` | Geometrie measured, Zielzone `tendency-margin` |
| arrow | — | Kategorielücke → LFH-566 |
| line | — | Kategorielücke → LFH-566 |

Welcher Stand gilt, entscheidet der Fundort und nicht diese Tabelle. Weicht ein Fundort ab, gilt
er, und die Abweichung wird im Bericht benannt.

## Gates

- `core/src/blocks/register.test.ts`: Kennungen sind eindeutig und stimmen mit Kategorie und Wert
  überein. Jede Kategorie ist vollständig gegen ihre Werteliste aus dem Schema. Jede
  `combinationBinding.ruleId` steht im Regelkatalog. Jeder `definedAt` zeigt auf eine vorhandene
  Datei mit gültigem Zeilenbereich. Die Lückenliste ist festgenagelt.
- `catalog/src/block-register/*.test.ts`: das Laufzeit-Gate in Richtung `conformance`. Jeder
  `measured`-Eintrag löst sich über den Katalogresolver zu Geometrie auf. Jeder
  `not-measured`-Eintrag löst sich **nicht** auf. Wird ein Wert neu vermessen, muss deshalb auch
  das Register nachgezogen werden.

## Nicht Teil

- Die Vermessung fehlender Geometrie (`gemeinde`, `bezirk`, `bundesland`, Verband I–III). Das ist
  eine eigene Aufgabe wie beim Innenfeld (Zonenentscheidung, Punkt 3).
- Änderungen an `compose.ts`, `layout/profiles.ts` und `validate.ts`. Die Umstellung des Motors
  ist ein eigener Slice.
- `SymbolSpec`-Felder (LFH-577), Pfeil- und Linienwerte (LFH-566).
- LFH-597 (0,96 mm bei `vehicle-land/plain-wheel-pair`): Das Register führt dort den Fundort und
  wählt keine der beiden Zahlen.
