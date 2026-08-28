# Entscheidung: LFH-401 — Repository-Policy-Gate

Datum: 28. August 2026

Status: umgesetzt; technisches Repository-Gate, keine fachliche Freigabe

Scope: Paketgrenzen, Git-Index-Schutz des lokalen Referenzbestands und Präzisierung der
Millimeter-Regel

## Ausgangslage

LFH-401 ist ein Referenztask für die Arbeitsweise. Als abgeleiteter Härtungsslice schließt diese
Entscheidung nur drei konkret gemessene technische Lücken:

1. Die dokumentierte Abhängigkeitsrichtung `cli → catalog → core → schema` war im aktuellen
   Bestand eingehalten, aber weder für Paketmanifeste noch für Quellcode-Imports automatisiert
   gebunden.
2. CI prüfte mit `if [ -d taktische-zeichen ]` nur die Anwesenheit des lokalen Ordners im
   Arbeitsbaum. Der Check unterschied nicht zwischen ignorierten lokalen Originalen und dem
   Git-Index und erfasste `taktische-zeichen.zip` nicht.
3. Die README bezeichnete jede Umrechnung in SVG-Einheiten als ausschließliche
   Rendereroperation, obwohl Mess- und Vergleichscode dieselben zentralen Einheitenhelfer für
   Toleranzvergleiche gegen rohe SVG-Koordinaten nutzt.

Der Katalogbestand, seine Provenienzträger und die offenen fachlichen Reviews werden von diesem
Slice nicht verändert.

## Entscheidung

Das CLI erhält das fail-closed Kommando:

```bash
pnpm cli verify:repository
```

Der reine Regelkern in `packages/cli/src/commands/repository-policy.ts` arbeitet auf einem
eingelesenen Repositorymodell. Der Adapter in
`packages/cli/src/commands/verify-repository.ts` liest Paketmanifeste, TypeScript-/TSX-Quellen,
Quell-Symlinks, `.gitignore` und den Git-Index. Dadurch lassen sich Policy und echte
Repositorygrenzen getrennt testen.

### Paket- und Importgrenzen

Für interne Kanten gilt ausschließlich die absteigende Reihenfolge:

```text
cli → catalog → core → schema
```

Der Gate prüft `dependencies`, `devDependencies`, `peerDependencies` und
`optionalDependencies`. Unbekannte `@einsatzzeichen/*`-Pakete und gleich- oder aufwärts
gerichtete Kanten werden abgewiesen. Die vier Paketwurzeln sind an ihre festen
`@einsatzzeichen/*`-Namen gebunden; ungültige Dependency-Abschnitte und nicht-stringförmige
Versionswerte werden fail-closed gemeldet. `core` und `schema` bleiben in den Paketmanifesten
ohne externe Abhängigkeiten. Externe Produktionsimporte in `cli` und `catalog` müssen im
jeweiligen Manifest deklariert sein; deshalb führt das CLI seine Laufzeitimporte
`@resvg/resvg-js` und `typescript` nun ausdrücklich.

TypeScript- und TSX-Quellen werden gemäß ihrer Dateiendung über den Compiler-AST ausgewertet.
Erfasst werden statische Imports, Inline-Importtypen, TypeScript-`import = require(...)`,
Re-Exports, dynamische Imports und direkte `require(...)`-Aufrufe; Stringliterale und
substitutionsfreie Template-Literale sind statisch prüfbar. Nicht statisch auflösbare dynamische
Modulziele und syntaktisch ungültige Quellen werden fail-closed abgewiesen; ein partiell
aufgebauter AST gilt nicht als vertrauenswürdiger Importgraph. Kommentare und gewöhnliche
Stringliterale erzeugen keine Kante. Interne Imports müssen im Paketmanifest deklariert sein.
Relative Imports dürfen weder eine andere Paketwurzel direkt adressieren noch den
Workspace-Paketbaum verlassen. In Produktionsquellen bleiben auch externe Imports für `core` und
`schema` verboten; Testdateien dürfen das zentrale Testwerkzeug verwenden, ohne die
Produktionsgrenze zu öffnen. Symlinks unter `packages/*/src` sind unzulässig, weil ihr Ziel die
Prüfung im Kontext des Importerpakets umgehen könnte.

### Lokaler Referenzbestand

Der Gate liest `git ls-files --cached -z` und wertet damit ausschließlich NUL-getrennte Pfade im
Git-Index aus. Er weist folgende Rootziele zurück:

- `taktische-zeichen` und jeden Pfad unter `taktische-zeichen/`;
- `taktische-zeichen.zip`.

Die beiden Rootregeln `/taktische-zeichen/` und `/taktische-zeichen.zip` müssen zugleich in
`.gitignore` vorhanden bleiben. Zusätzlich wertet `git check-ignore --no-index` ihre effektive
Wirkung nach allen Regeln aus; eine spätere Negation kann die formell vorhandene Schutzzeile also
nicht unbemerkt aufheben. Ein lokal vorhandener wirksam ignorierter Referenzordner oder ein
ignoriertes ZIP ist ausdrücklich zulässig und wird weder gelesen noch verändert. Ähnlich
benannte Pfade außerhalb der beiden Rootziele sind keine Befunde.

CI ersetzt den bisherigen Arbeitsbaumtest durch `pnpm cli verify:repository` vor Typecheck,
Vollsuite und Coverage-Gate. Bei mehreren Verstößen meldet das Kommando alle Befunde in stabiler
Reihenfolge und endet mit Status 1.

## Millimeter-Regel

IR und Katalog bleiben vollständig in Millimetern. Die Umrechnung geschriebener Geometrie für
SVG- und Canvas-Ausgabe geschieht weiterhin an der Renderergrenze. Die zentralen Helfer
`mmToUnits` und `unitsToMm` dürfen zusätzlich in Mess- und Vergleichscode verwendet werden, um
aus SVG-Koordinaten extrahierte Werte zu normalisieren oder die festgelegte Toleranz in
SVG-Einheiten anzuwenden. Das führt keinen zweiten Renderer und keine zweite Maßeinheit in IR
oder Katalog ein. `SubpathBounds` und `Ring` bleiben rohe SVG-Einheiten.

## Bewusst nicht gebaut

- Der Gate sucht nicht heuristisch nach umbenannten oder an andere Stellen kopierten
  Referenzgrafiken. Ohne den bewusst nicht eingecheckten Referenzbestand wäre das in CI weder
  vollständig noch belastbar prüfbar. Gebunden werden die beiden kanonischen Rootziele.
- Für `cli` und `catalog` entsteht kein allgemeines Verbot externer Pakete; der Slice schützt die
  dokumentierte interne Richtung, bindet verwendete Produktionspakete an das jeweilige Manifest
  und wahrt die bereits zugesicherte Abhängigkeitsfreiheit von `core` und `schema`.
- Es werden keine Katalogeinträge, Rendergeometrien, Snapshots, Provenienzstatus oder fachlichen
  Reviews geändert.
- Die Renderer und die zentrale Umrechnungsformel `1 mm = 72 / 25.4` bleiben unverändert.

## Nachweis und Reviewgrenze

39 neue Tests decken gültige und adversariale Manifestkanten, feste Paketnamen, ungültige
Manifestformen, interne und externe Deklarationslücken, die unterstützten Importformen
einschließlich Inline-Typen, Template-Literalen und TSX, Syntaxfehler, nicht auflösbare dynamische
Modulziele, relative Grenzumgehungen, Quell-Symlinks, externe Produktionsimporte, Git-Pfade mit
Zeilenumbrüchen, wirksam ignorierte lokale Originale, direkte und Canary-spezifische
Ignore-Negationen, mehrere gleichzeitige Referenzbefunde sowie echte CLI-Erfolgs- und
Fehlerprozesse ab.

Der technische Gesamtlauf bestand mit 69/69 Testdateien und 5.240/5.240 Tests. Zusätzlich waren
`pnpm cli verify:repository`, `pnpm typecheck`, `pnpm cli coverage` und `git diff --check` grün.
Das Coverage-Gate meldete 544 Manifestzeilen, 13 Quellen und 558 offene fachliche
Reviews sowie null fehlende Testnachweise und null ungedeckte Kapitel im beanspruchten Umfang.
Diese technische Härtung erteilt keine fachliche, normative oder lizenzrechtliche Freigabe.
