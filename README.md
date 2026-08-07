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
| `core` | Renderer (SVG, Canvas), Render-Theme-Vertrag, A11y-/Kontrast- und viewBox-Gates, Hüllenberechnung, Fingerprint-Vergleich, Layoutprofile, Kompositionsmotor, Regelvalidierung. Hängt **nie** von `catalog` ab. |
| `catalog` | Grundzeichen, Organisationsfarben, Stärkeangaben, Fähigkeiten, Kompositionsrezepte, konkrete Render-Themes, Quellenregister, Profilregister, Elementregister, Coverage-Manifest. |
| `cli` | Kennzahlenableitung aus der lokalen Referenz, Coverage-Gate, SVG-Export. |

`schema` und `core` haben **null Fremdabhängigkeiten** — beide sind reines TypeScript ohne
externe Pakete.

## Provenienz

Jeder Manifest-Eintrag, jede Quelle und jedes Profil trägt dieselbe Reviewform: ein
**technisches** und ein **fachliches** Review, beide Pflicht. Ein abgeschlossener Status ohne
Reviewer oder gültiges ISO-Datum lässt das Coverage-Gate für alle drei fehlschlagen; eine
fachliche Freigabe braucht zusätzlich eine Befundnotiz oder einen Protokollverweis, eine
`deviation` eine konkrete Begründung. Ein Katalogeintrag trägt kein eigenes Review: es steht auf
seiner Manifestzeile, die für `coverage: 'catalog-entry'` 1:1 zu ihm ist. Das fachliche Review
steht derzeit bei allen Einträgen offen; die Struktur macht das sichtbar, statt es zu verdecken.

`packages/catalog/src/sources.ts` führt elf Quellen der Referenzhierarchie plus `phjardas-tz` als
Vergleichsbestand, jeweils mit Nutzungsgrundlage, Beschaffungsstand und Umgang mit der Geometrie.
Für die BABZ-Assets ist die Lizenzlage `unclear`; die Konsequenz — abgeleitete Kennzahlen statt
Dateien — steht damit maschinenlesbar im Register und nicht nur in Prosa.

Kern und Profile tragen **eigene Datenversionen** (`CoverageManifest.coreVersion`,
`ProfileRecord.version`), unabhängig von den npm-Paketversionen. Der bundesweite Kern ist selbst
das erste registrierte Profil (`bund`); `CatalogEntry.profile` ist Pflichtfeld, damit „kein Profil
angegeben" nicht mit „gehört zum Kern" verwechselbar ist.

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

Fingerprint- und koordinatenbasierte Geometriegates verwenden eine Toleranz von
**0,01 SVG-Einheiten**. Datei- und Rastersnapshots werden dagegen exakt verglichen.

## Status der fachlichen Grundlage

`bbk-babz-2025` ist die **projektinterne Coverage-Baseline**. Der Name bezeichnet den
versionierten Referenzstand des Projekts, keine geltende eigenständige Dienstvorschrift. Der AFKzV
hob in seiner 57. Sitzung am 13./14.03.2025 die vorläufige Anwendung der Empfehlungen auf. Die
BABZ führt das Ergebnis der Überarbeitungsgruppe bis zu einer künftigen FwDV 102/DV 102 als
Diskussionsgrundlage; weitere Veröffentlichung und Verbreitung sind bis zum Abschluss der
Beratungen ausgesetzt. Maßgeblich für diesen am 06.08.2026 geprüften Status ist die
[offizielle BABZ-Seite](https://lernplattform-babz-bund.de/goto.php?target=cat_109540).

TAKTIK verwendet den bereits lokal vorhandenen Arbeitsstand weiterhin reproduzierbar für Coverage
und Vergleiche, behauptet damit aber weder normative Geltung noch fachliche Freigabe. Die offenen
fachlichen Reviews sind in
[`docs/reviews/2026-08-06-domain-review-handoff.md`](./docs/reviews/2026-08-06-domain-review-handoff.md)
dokumentiert.

## D.1: Kapitel 4 technisch vollständig

D.1 deckt Kapitel 4 der projektinternen Coverage-Baseline technisch vollständig ab: 88
Abschnitte sind als 92 Darstellungen umgesetzt, darunter vier getrennt adressierbare
Alternativdarstellungen. Alle 92 Darstellungen bestehen ihre lokalen Kommando-, Box-, Clipping-
und Snapshot-Gates; die 92 zugehörigen Renderfälle bestehen zusätzlich die globalen Mehrgrößen-,
Theme-, Metadaten- und viewBox-Gates.

Diese technische Abdeckung ist weder eine fachliche Freigabe noch eine normative Behauptung. Alle
92 Kapitel-4-Domainreviews bleiben `pending`; ihre fachliche Bedeutung, Verwechslungsfreiheit,
Profilzuordnung und einsatztaktische Eignung müssen weiterhin einzeln durch eine entsprechend
fachkundige Person geprüft werden. Die Abschlussentscheidung für D.1 steht in
[`docs/decisions/2026-08-06-kapitel-4-faehigkeiten-d1.md`](./docs/decisions/2026-08-06-kapitel-4-faehigkeiten-d1.md).

## D.2: Kapitel 5.8 technisch vollständig

D.2 deckt Kapitel 5.8 der projektinternen Coverage-Baseline technisch mit 61 State-IDs und 67
Darstellungen ab, darunter sechs getrennt adressierbare Alternativdarstellungen. Damit enthält
der Katalog insgesamt 159 Piktogrammdarstellungen: 92 Capabilities und 67 States. Die 170 globalen
Renderfälle setzen sich aus acht Grundzeichen, drei Rezepten und diesen 159 Piktogrammen zusammen.

Alle 67 States sind eigenständige Zeichen mit kanonischer 32×32-mm-Platzierung und
Standalone-Clipping. D.2 führt weder eine allgemeine State-Komposition noch eine Integration in
`SymbolSpec.states` oder `compose()` ein. Die technische D.2-Evidenz einschließlich der 67/67-
Kontaktbogenprüfung wurde in Task 15 abgeschlossen und technisch freigegeben; die Sichtprüfung ist
in
[`docs/reviews/2026-08-07-d2-visual-qa.md`](./docs/reviews/2026-08-07-d2-visual-qa.md)
dokumentiert.

Diese technische Freigabe ist keine fachliche Einsatzfreigabe und keine Aussage normativer
Geltung oder zur Nutzungs- und Lizenzgrundlage der Quellen. Alle 67 getrennten fachlichen
State-Reviews bleiben `pending`; ihre Bedeutung, Abgrenzung, Lesbarkeit und einsatztaktische
Eignung müssen weiterhin einzeln durch eine fachkundige Person geprüft werden.

## Der lokale Referenzbestand

`taktische-zeichen/` ist ein **lokaler Ordner mit 661 damals von der BABZ bereitgestellten
Referenz-SVGs**. Er wird **niemals eingecheckt** — die Nutzungs- und Lizenzgrundlage ist ungeklärt,
siehe `.gitignore`, und die weitere BABZ-Veröffentlichung und -Verbreitung des Arbeitsstands ist
ausgesetzt. Ohne diesen Ordner lässt sich der Katalog trotzdem bauen, testen und typprüfen: das
abgeleitete Kennzahlenartefakt `packages/catalog/src/fingerprints.json` ist eingecheckt und wird von
CI verwendet.

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
pnpm cli export --out <pfad> --size <px> \
  --theme <reference|accessible-light|print-monochrome>
```

- `audit:reference` — Referenzbestand einlesen, Kennzahlen ableiten. `--filter <präfix>` schränkt
  auf Dateinamen mit diesem Präfix ein (z. B. `"1."` oder `"C.1.1"`); `--print` gibt nur aus,
  schreibt nicht nach `fingerprints.json`.
- `coverage` — prüft das Coverage-Manifest gegen den Katalog (Coverage-Gate): Schlüssel,
  Vollständigkeit, Baseline-Präfix, Quellenbezug, Profil, Reviewzurechnung, Elementauflösung und
  Datenversionen. Gibt zusätzlich die Zahl offener fachlicher Reviews und die 1.0-Blocker aus —
  beides ohne Fehlerabbruch, weil CI sonst ab dem ersten Tag dauerhaft rot wäre.
- `export --out <pfad> --size <px> [--theme …]` — rendert alle Grundzeichen und
  Kompositionsrezepte als SVG nach `<pfad>`, mit `<px>` Kantenlänge. Ohne Theme gilt die
  unveränderte Referenzpalette. `accessible-light` hellt das kontrastkritische Blau auf;
  `print-monochrome` erzeugt eine achromatische Ausgabe mit getrennten Organisationsgrauwerten.
  Beide Alternativthemes ergänzen pro Organisation eine eindeutige Kontursignatur als
  nicht-farblichen visuellen Kanal.

## Globale Qualitätsgates vor D.1

Jede renderbare Manifest-Implementierung durchläuft echte PNG-Regressionen bei 16, 24, 32, 64,
128 und 256 Pixeln. Zusätzlich werden Accessible- und Schwarz-Weiß-Ausgabe gerastert,
semantischer Titel und Beschreibung verlangt und die sichtbare Geometrie gegen die kanonische
32×32-mm-viewBox geprüft. Die Rasterungen liegen als direkt sichtbare SVG-Kontaktbögen unter
`packages/catalog/src/__snapshots__/multi-size/`; ein eigener Profilbogen zeigt alle sieben
Organisationen in beiden Alternativthemes bei 64 px.

Die unveränderte Referenzpalette wird nicht pauschal als barrierefrei bezeichnet: Schwarz auf dem
originalen BABZ-Blau unterschreitet 3:1. Für diesen Fall ist `accessible-light` das geprüfte
Darstellungsprofil. Details und Grenzen stehen in
[`docs/decisions/2026-08-06-gate-haertung-vor-d1.md`](./docs/decisions/2026-08-06-gate-haertung-vor-d1.md).
