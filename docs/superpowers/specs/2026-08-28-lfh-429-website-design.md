# LFH-429 — Dokumentationswebsite mit den fünf baubaren Einstiegen

> Design-Spec · 28. August 2026 · Status: Rahmen im Chat freigegeben (Framework, Umfang,
> Deploy-Politik, Ablauf) · Subtask LFH-497 (`86cbbeu53`) · Branch `codex/lfh-429-website`

## 1. Ziel

Das Projekt bekommt eine Dokumentationswebsite, die sich liest, als hätte sie ein Mensch
geschrieben, und die aussieht, als wäre sie für dieses Projekt gemacht — nicht wie ein
Starlight-Standardgerüst mit eingefügtem Text. Sie trägt die zentrale Aussage des Projekts an
jeder Stelle, an der ein Zeichen erscheint: **technisch grün ist nicht fachlich freigegeben.**

Von den sechs Einstiegen der Vision werden fünf gebaut. Der sechste (Sources & Diffs) bekommt
eine ehrliche Statusseite, weil er zwei Dinge braucht, die es nicht gibt: die Legacy-Auflösung
(LFH-433) und das Recht, Referenzdateien zu zeigen.

Die Website wird **gebaut, aber nicht veröffentlicht**. CI baut sie bei jedem Push und lädt das
Ergebnis als Artefakt hoch. Ein Deployment ist ein eigener, späterer Task, der erst nach der
Entscheidung zu LFH-432 (Lizenz- und Quellengrundlage) sinnvoll ist.

## 2. Belegter Ausgangspunkt

- `origin/main` am 28.08.2026 auf `85c6f97` (Merge PR #33). Baseline im Worktree: 84 Testdateien,
  5.957 bestandene Tests, `pnpm typecheck` grün.
- Die Aufgabenbeschreibung in ClickUp ist in einem Punkt überholt: die Pakete `react`,
  `web-component`, `maplibre`, `qgis` existieren seit LFH-405. Damit sind Quickstart und
  MapLibre Lab baubar. Coverage ist nicht mehr „der einzige baubare Einstieg“.
- Alle Workspace-Pakete zeigen mit `main` auf `./src/index.ts` und sind `private`. Es gibt keinen
  Build-Schritt; `tsconfig.json` und `vitest.config.ts` lösen `@einsatzzeichen/*` per Alias auf
  die Quellen auf. Die Website folgt demselben Muster (Vite-Alias auf `packages/*/src/index.ts`).
- Browser-Tauglichkeit: `@einsatzzeichen/core` und `@einsatzzeichen/schema` importieren kein
  `node:*`. `@einsatzzeichen/catalog` importiert in `fonts.ts` `node:url` (`fileURLToPath`) —
  und der Index re-exportiert `fonts.ts`. Ein Katalog-Import in einem Browser-Island scheitert
  also, solange er über den Index läuft. Das ist die eine technische Hürde dieses Slices; die
  Lösung steht in Abschnitt 5.3.
- Aktuelle Versionen (28.08.2026, `pnpm view`): `astro` 7.2.9, `@astrojs/starlight` 0.41.10,
  `@astrojs/react` 6.0.4, `maplibre-gl` 6.6.0. Astro 7 liegt nach dem Wissensstand der
  Modelle — jede API-Annahme über Astro/Starlight wird beim Setup gegen die aktuelle
  Dokumentation (context7 `/withastro/starlight`, `/withastro/docs`) geprüft, nicht aus dem
  Gedächtnis übernommen.
- Repository-Policy-Gate (`pnpm cli verify:repository`, LFH-401) prüft den Git-Index auf
  Referenzassets und Paketgrenzen. Die Website darf nichts aus `taktische-zeichen/` oder `out/`
  einbetten, und keine Paketgrenze verletzen.

## 3. Nutzer und Ton

Zwei Zielgruppen, vom Projektinhaber am 28.08.2026 präzisiert: **Entwicklerinnen und
Entwickler**, die die Zeichen in ihre Software einbauen wollen, und **Anwenderinnen und
Anwender ohne technisches Verständnis** — Menschen aus Feuerwehr, THW, Rettungsdienst,
Verwaltung oder Ausbildung, die ein Zeichen finden, verstehen, herunterladen oder auf einer
Karte sehen wollen. Die zweite Gruppe ist die größere; sie darf auf keiner Seite das Gefühl
haben, auf einer Entwicklerseite gelandet zu sein.

Folgen für die Texte:

- Jede Seite beginnt mit dem, was man hier **tun** kann, in Alltagssprache — nicht mit
  Architektur, Paketen oder Buildwegen. Technik kommt danach, klar abgesetzt („Für
  Entwicklerinnen und Entwickler“).
- Fachbegriffe der Gefahrenabwehr (Grundzeichen, Kopfzone, Stärke, Fähigkeit) sind erlaubt,
  weil das Publikum sie kennt; Software-Begriffe (Snapshot, Island, Hydration, Manifest,
  Slug, Chunk, Gate, Rezept, Spec, Fingerprint) sind es **nicht** — sie werden entweder
  übersetzt („Bauanleitung eines Zeichens“) oder nur im Entwicklerabschnitt benutzt.
- Zahlen und Status bleiben ehrlich (siehe unten), aber mit einer Erklärung, was sie für die
  Leserin bedeuten: „technisch geprüft“ heißt „das Bild stimmt mit der Vorlage überein“,
  „fachlich noch nicht geprüft“ heißt „niemand aus der Fachwelt hat bestätigt, dass es das
  richtige Zeichen für diese Bedeutung ist“.
- Handlungsaufforderungen statt Beschreibungen: „Zeichen suchen“, „Als SVG herunterladen“,
  „Auf der Karte ausprobieren“.
- Fehlermeldungen und Hinweise in den interaktiven Teilen (Builder, Explorer, Karte) sprechen
  die Anwenderin an, nie den Entwickler — kein Dateipfad, kein Stacktrace im Normaltext.

Sprachregeln für alle Texte (verbindlich für jeden Subagenten, der Prosa schreibt):

- Deutsch, Sie-freie Anrede („du“ nur, wo es natürlich ist; sonst neutral formulieren).
- Aktiv, konkret, kurze Sätze. Keine Marketingsprache, keine Superlative, kein „nahtlos“.
- Jede Aussage über Vollständigkeit oder Freigabe nennt die Zahl und die Quelle der Zahl
  (Katalog, Coverage-Manifest, `domain-reviews.ts`). Keine gerundeten Behauptungen wie „über
  400 Piktogramme“ — dieser Fehler steht bereits in der Vision und wird nicht wiederholt.
- Der Status der fachlichen Grundlage (AFKzV, 57. Sitzung, 13./14.03.2025: vorläufige
  Anwendung aufgehoben, Verbreitung ausgesetzt) wird wörtlich aus `README.md` übernommen und
  nicht weichgezeichnet.
- Technische Bezeichner bleiben unübersetzt (`compose()`, `renderSvg()`, `SymbolSpec`).
- Keine Aussage über Lizenz oder Nutzungsrecht, die über `README.md` und
  `docs/decisions/2026-08-28-lfh-432-*` hinausgeht.

## 4. Informationsarchitektur

```
/                         Startseite: ein Satz, ein Zeichen, zwei Wege (Entwicklung / Fachlichkeit),
                          Statuskachel „technisch / fachlich“ mit echten Zahlen
/quickstart               Einstieg 1 — TS, React, Web Component, MapLibre (Tabs, kopierbar)
/explorer                 Einstieg 2 — Suche/Filter über Katalog + Rezepte (Island)
/builder                  Einstieg 3 — SymbolSpec live zusammensetzen, Fehler erklären, Code erzeugen (Island)
/coverage                 Einstieg 4 — drei Achsen, Manifestmatrix, offene Reviews, Blocker (Island für Matrix)
/maplibre-lab             Einstieg 5 — echte Karte, Marker, Symbol Layer, Zoom, Pixel Ratio (Island)
/sources-und-diffs        Einstieg 6 — Statusseite: was fehlt, warum, welcher Task
/zeichen/                 Übersicht aller Symbolseiten (Kapitel/Anhang-Gruppen)
/zeichen/<id>             eine Seite je Katalogeintrag und je Rezept (generiert)
/grundlage                Status der fachlichen Grundlage (AFKzV), Quellenregister, Profile
/belege                   Kontaktbögen aus __snapshots__/multi-size als Galerie
/pakete/<name>            je Ausgabekanal: react, web-component, maplibre, qgis, cli, core, schema, catalog
```

Starlight-Sidebar in dieser Reihenfolge, Gruppen: *Einstiege*, *Zeichen*, *Grundlage*,
*Pakete*. Suche: Starlights eingebaute Pagefind-Suche über alle Seiten; der Explorer hat
zusätzlich seine eigene, feldbezogene Suche (Bedeutung, Abkürzung, Organisation, Quelle,
Kapitel).

## 5. Architektur

### 5.1 Paket

`packages/website` — `@einsatzzeichen/website`, `private: true`, Astro 7 + Starlight 0.41 +
`@astrojs/react` 6. Skripte: `dev`, `build`, `preview`, `generate` (Abschnitt 5.3).
Root-`package.json` bekommt `"website": "pnpm --filter @einsatzzeichen/website"` als Kurzform
nicht — Aufruf bleibt explizit `pnpm --filter @einsatzzeichen/website build`.

Abhängigkeitsrichtung: `website → react, web-component, maplibre, qgis, catalog, core, schema`.
Kein Paket hängt von `website` ab. `verify:repository` prüft Paketgrenzen; `website` wird dort
als Blatt registriert, falls das Gate eine explizite Liste führt (Setup-Task prüft das).

`tsconfig.json` (Root) nimmt `packages/website/src/**/*.ts` **nicht** in `include` auf — Astro
bringt eigene `tsconfig`-Vererbung (`astro/tsconfigs/strict`), und `.astro`-Dateien kann `tsc`
nicht prüfen. Die Website hat eine eigene `tsconfig.json`, die `../../tsconfig.json` für die
Pfad-Aliase erweitert, und wird mit `astro check` typgeprüft (eigenes Skript `check`, in CI).

### 5.2 Rendering-Grenzen

- **Statisch (Astro, zur Buildzeit, Node):** Symbolseiten, Startseite, Coverage-Zahlen,
  Belege, Grundlage, Pakete. Diese Seiten importieren `@einsatzzeichen/catalog` direkt — Node
  ist da, `fonts.ts` stört nicht. Die SVG-Vorschauen entstehen mit `renderSvg()` zur Buildzeit
  und landen als Inline-SVG im HTML. Keine Raster, kein resvg im Browser.
- **Islands (React, im Browser):** Explorer, Builder, Coverage-Matrix (Filter/Sortierung),
  MapLibre Lab. Sie importieren `@einsatzzeichen/core`, `@einsatzzeichen/schema`,
  `@einsatzzeichen/react`, `@einsatzzeichen/maplibre` — alle node-frei — und ihre Daten aus
  dem **Katalog-Snapshot** (5.3), nie aus dem Katalog-Index.
- Hydration nur dort (`client:load` für Builder/Explorer, `client:visible` für Map/Matrix).

### 5.3 Katalog-Snapshot

`packages/website/scripts/generate-snapshot.ts` läuft in Node vor `astro build` (`generate`
ist `prebuild` und `predev`) und schreibt `packages/website/src/generated/catalog-snapshot.json`
(gitignored). Inhalt, alles serialisierbar:

```ts
interface CatalogSnapshot {
  generatedAt: string;                 // ISO
  baseline: string;                    // COVERAGE_MANIFEST.baseline
  coreVersion: string;
  symbols: SymbolSummary[];            // je Katalogeintrag-Darstellung und je Rezept
  sources: SourceSummary[];            // SOURCE_REGISTRY ohne lokale Pfade
  coverage: CoverageSummary;           // drei Achsen + Blocker + Kontrastausnahmen
  builder: BuilderVocabulary;          // erlaubte IDs je SymbolSpec-Feld mit Labels
}
interface SymbolSummary {
  id: string;                          // semantische ID (CatalogEntry.id oder Rezeptschlüssel)
  slug: string;                        // URL-sicher, stabil
  title: string;
  kind: 'catalog-entry' | 'composition-recipe';
  spec: SymbolSpec;                    // für Builder-„öffnen“ und Codebeispiele
  sourceId: string; variant: 'primary' | 'alternative';
  source: { id: string; citation: string; page?: string; url?: string };
  chapter: string;                     // z. B. "Anhang E.1"
  profile: string;
  synonyms: string[]; legacyIds: string[];
  review: { technical: ReviewSummary; domain: ReviewSummary };
  drawing: Drawing;                    // composeFromCatalog(spec), damit Islands nicht komponieren müssen
}
```

Entscheidend: der Snapshot enthält **kein** `referenceAsset` und keinen lokalen Pfad. Der
Generator hat einen Test, der genau das prüft (`snapshot.test.ts`: kein Feld enthält
`taktische-zeichen`, `out/`, einen absoluten Pfad oder `.svg`-Dateinamen der Referenz).

Warum Snapshot statt Vite-Shim für `node:url`: der Shim würde funktionieren, aber jede spätere
Node-Abhängigkeit im Katalog bräuchte den nächsten Shim, und die Website wüsste nie, was sie
gerade ausliefert. Der Snapshot ist die explizite Grenze zwischen „was der Katalog weiß“ und
„was die Website zeigt“ — und der Ort, an dem die Policy „keine Referenzpfade“ testbar ist.

Der Builder braucht zum Komponieren im Browser `compose(spec, PORTS, …)`. `PORTS` und die
Elementregister sitzen im Katalog. Der Generator prüft per Test, dass ein Import von
`@einsatzzeichen/catalog/src/recipes.js` (Subpfad, nicht Index) kein `node:*` transitiv zieht;
gelingt das, importiert der Builder-Island diesen Subpfad. Gelingt es nicht, exportiert der
Snapshot zusätzlich die vom Builder benötigten Ports/Element-Zeichnungen, und der Island
komponiert daraus. Die Entscheidung fällt im Setup-Task mit Beleg (`vite build`-Ausgabe), nicht
im Voraus.

### 5.4 Die fünf Einstiege

**Quickstart.** Vier Tabs (TypeScript, React, Web Component, MapLibre), jeweils ein
vollständiges, lauffähiges Beispiel mit einem Zeichen, das es im Katalog wirklich gibt (E.1.1
oder ein Grundzeichen). Codebeispiele werden aus einer Vorlage mit der echten `SymbolSpec`
generiert (`src/lib/code-samples.ts`), damit sie nicht veralten; ein Test rendert jedes
Beispiel-Snippet gegen die echte API (`code-samples.test.ts`). Unter jedem Beispiel steht der
Reviewstatus des Beispielzeichens.

**Symbol Explorer.** React-Island. Volltextsuche über Titel, Synonyme, Legacy-IDs,
semantische ID; Facetten: Organisation, Kapitel/Anhang, Quelle, Profil, Reviewstatus
(technisch/fachlich). Ergebnis als Kachelgitter mit Inline-SVG (aus `drawing` im Snapshot via
`<Einsatzzeichen>` aus `@einsatzzeichen/react`) und Statuspunkt. Klick → Symbolseite. URL-State
(`?q=&org=&kapitel=`) für Teilbarkeit. Keine externe Suchbibliothek — bei ~300 Einträgen reicht
eine normalisierte Substring-/Tokensuche; das ist getestet.

**Builder.** React-Island. Formular über die `SymbolSpec`-Felder (aus `builder.vocabulary` des
Snapshots: `kind`, `organization`/`technicalFill`, `strength`, `administrativeLevel`,
`functionRole`, `capabilities`, `bodyMarks`, `states`, `comms`, …). Bei jeder Änderung:
`validateSpec()` → Issues mit `rule`-ID werden **erklärt**, nicht nur angezeigt: eine Tabelle
`src/lib/rule-explanations.ts` bildet jede ID aus `VALIDATION_RULE_IDS` auf einen Satz in
Klarsprache ab; ein Test verlangt, dass jede ID einen Eintrag hat. Gültige Spec →
Live-Vorschau in 32/64/128 px hell/dunkel, JSON, und die vier Codebeispiele (gleiche Vorlage wie
Quickstart). „Aus dem Katalog laden“ öffnet jedes Snapshot-Symbol im Builder. Hinweisbox: ein
im Builder erzeugtes Zeichen ist **nicht fachlich geprüft**, auch wenn alle Regeln grün sind.

**Coverage.** Statische Seite mit Island für die Matrix. Oben die drei Achsen so, wie `pnpm cli
coverage` sie ausgibt (der Generator ruft dieselben Funktionen: `checkCoverage()`,
`releaseBlockers()`, `generativeReach()`, `ruleCoverage()`, `validationRuleCoverage()`,
`referenceInventory()`), mit denselben Zahlen — kein zweiter Rechenweg. Darunter die
Manifestmatrix: Zeile je `CoverageEntry`, Spalten Quelle/Abschnitt, Titel, Implementierung,
Art, Profil, technisch, fachlich, Testnachweis. Filter nach Anhang und Status. Ein eigener
Abschnitt „Was offen ist“ listet Blocker und offene Fachreviews je Bereich
(`sortedDomainReviewOpenByArea()`), plus die Kontrastausnahmen als Tatsache, nicht als Blocker
(Begründung wie in `coverage.ts`).

**MapLibre Lab.** React-Island, `client:visible`, `maplibre-gl` 6 als Abhängigkeit **nur** der
Website. Karte mit freiem Basemap-Style, der keine API-Schlüssel braucht (z. B. OpenFreeMap
`liberty`/`positron` — der Setup-Task prüft die Nutzungsbedingungen und trägt sie auf der Seite
ein; kein Schlüssel im Repository). Bedienfeld: Zeichen wählen (Snapshot), Größe, Pixel Ratio,
Theme; Ansicht als Marker (SVG im DOM) und als Symbol Layer (`addSymbolImage()` aus
`@einsatzzeichen/maplibre` → `map.addImage`). Clustering und Offline-Sprites aus der Vision
stehen als „noch nicht“ mit Begründung in einer Infobox — kein Platzhalter-UI.

**Sources & Diffs.** Statische Seite. Erklärt in drei Absätzen, was der Einstieg zeigen soll,
was davon heute nicht geht (Referenzdateien nicht auslieferbar; Legacy-Auflösung LFH-433 in
Scoping) und was bereits da ist (Quellenregister mit Seitenangaben, Fingerprint-Gate). Link zur
Grundlage-Seite und zum ClickUp-Task.

### 5.5 Symbolseite (`/zeichen/<slug>`)

Generiert per `getStaticPaths` aus dem Katalog (Buildzeit, Node, direkter Katalogimport).
Abschnitte in dieser Reihenfolge, jeder nur, wenn Daten da sind:

1. Kopf: Titel, semantische ID (kopierbar), Quelle „Anhang E.1.1, S. 47“ mit Link auf das
   Quellenregister, **zwei Statusmarken** technisch/fachlich mit Datum und Reviewer, falls
   vorhanden; bei `pending` steht dort „noch nicht fachlich geprüft“ und nicht ein leeres Feld.
2. Vorschau: 16, 24, 32, 64, 128, 256 px, umschaltbar hell/dunkel/Druck-Monochrom
   (`RENDER_THEMES`). Inline-SVG aus `renderSvg()`.
3. Spec als JSON und „Im Builder öffnen“.
4. Codebeispiele (vier Tabs, aus derselben Vorlage).
5. Synonyme, Legacy-Bezeichnungen.
6. Zulässige Kombinationen: welche Felder die Spec setzt; welche Regeln greifen (Regel-IDs mit
   Erklärung aus `rule-explanations.ts`).
7. Nachweise: Testarten aus `CoverageEntry.evidence`, Kontrastausnahme falls vorhanden,
   Profil.

Die Vision nennt zusätzlich „Änderungshistorie“ und „bekannte Abweichungen“. Abweichungen
kommen aus `review.domain.status === 'deviation'` + `note`. Historie gibt es nicht als Daten —
sie wird **nicht** gebaut und nicht vorgetäuscht.

### 5.6 Gestaltung

Eigenes Theme über Starlights CSS-Variablen plus eigene Komponenten-Overrides (`Hero`,
`SocialIcons`, ggf. `PageTitle`), nach dem Skill `frontend-design:frontend-design`. Leitplanken:

- Schrift: die Zeichen tragen Arimo (Subset im Katalog); der Fließtext bekommt eine eigene,
  gut lesbare Sans (Google Fonts nur, wenn selbst gehostet — keine externen Requests im
  Standardfall; sonst System-Stack). Monospace für IDs und Code.
- Farbe: neutral, mit einem Akzent. Organisationsfarben (Feuerwehr Rot, THW Blau, …) werden
  **nur** in Zeichen verwendet, nie als Dekor — sonst verliert die Farbe ihre Bedeutung.
- Die Statusmarken technisch/fachlich sind ein wiederverwendbares Bauteil (`StatusPair`),
  überall identisch, mit Textlabel und Icon (nie nur Farbe — Barrierefreiheit).
- Hell/Dunkel vollständig; Zeichenvorschauen zeigen beide Karten-Hintergründe unabhängig vom
  Seitenthema.
- Keine Stock-Illustrationen. Das einzige Bild der Startseite ist ein echtes Zeichen aus dem
  Katalog, groß.

### 5.7 CI

`.github/workflows/ci.yml` bekommt nach den bestehenden Schritten:

```yaml
- run: pnpm --filter @einsatzzeichen/website check
- run: pnpm --filter @einsatzzeichen/website build
- uses: actions/upload-artifact@v4
  with: { name: website, path: packages/website/dist, retention-days: 14 }
```

Kein Pages-Job. Kein Deploy-Secret. `verify:repository` läuft weiterhin vor allem anderen und
sieht `packages/website/dist` und `src/generated/` nicht, weil beide gitignored sind.

## 6. Tests

Vitest im Root-Setup (`vitest.config.ts` nimmt `packages/*/src/**/*.test.ts` bereits auf; die
Website-Tests liegen in `packages/website/src/**` und benutzen `happy-dom` für
Komponententests wie das React-Paket).

| Test | Was er beweist |
|---|---|
| `scripts/generate-snapshot.test.ts` | Snapshot enthält jeden Katalogeintrag und jedes Rezept genau einmal; Slugs eindeutig; Zahlen identisch mit `checkCoverage()`/`releaseBlockers()` |
| `snapshot-policy.test.ts` | kein Feld enthält Referenzpfade, absolute Pfade, `taktische-zeichen`, `out/` |
| `rule-explanations.test.ts` | jede ID aus `VALIDATION_RULE_IDS` hat eine Erklärung; keine verwaiste Erklärung |
| `code-samples.test.ts` | jedes Snippet für ein Beispielzeichen kompiliert/rendert gegen die echte API (TS via `tsx`-Import, React via `renderToStaticMarkup`, Web Component via happy-dom, MapLibre via `MapLike`-Fake) |
| `explorer-search.test.ts` | Suche findet über Titel, Synonym, Legacy-ID; Facetten schneiden; leere Suche zeigt alles |
| `builder-state.test.ts` | Spec-Änderung → `validateSpec()`-Issues → Erklärungen; gültige Spec → Drawing |
| `astro check` + `astro build` in CI | Seiten typgeprüft, alle `getStaticPaths` auflösbar |

Keine Screenshot-Tests in diesem Slice — die Kontaktbögen des Katalogs bleiben der visuelle
Beleg; ein Website-Screenshot für den PR kommt aus `astro preview` (zulässige Workflow-Ausgabe).

## 7. Fehlerbehandlung

- Generator: fehlender Katalogeintrag, doppelter Slug, Review ohne Pflichtfeld → Abbruch mit
  Exit 1 und Klartext. Kein stiller Rückfall.
- Builder: `CompositionError` wird gefangen und als Regel-Liste gezeigt; jede andere Exception
  erscheint als sichtbarer Fehlerblock mit Stack — nicht verschluckt.
- MapLibre Lab: Basemap nicht erreichbar → Karte zeigt eine Meldung mit dem Grund; die
  Marker-/Symbol-Vorschau funktioniert trotzdem auf neutralem Hintergrund.
- Snapshot fehlt (jemand startet `astro dev` ohne `generate`) → Build bricht mit Hinweis auf
  `pnpm --filter @einsatzzeichen/website generate` ab (`predev`/`prebuild` machen das
  automatisch; der Hinweis ist für den Fall, dass jemand `astro` direkt aufruft).

## 8. Nicht im Scope

- Deployment, Domain, Analytics, Sitemap-Submission.
- Sources & Diffs als Funktion; Legacy-Aliasnamen (LFH-433).
- Clustering, Offline-Sprites, QGIS-Live-Demo (QGIS bekommt eine Paketseite mit Export-Anleitung
  aus dem Paket-README, keine Interaktion).
- i18n. Die Website ist deutsch; Starlight-i18n bleibt aus.
- Änderungen an `core`/`catalog`/`schema` — außer ein Subpfad-Export oder ein Export einer
  bereits vorhandenen Funktion ist für den Builder-Island nötig (dann minimal und mit Test).
- Eine `LICENSE`-Datei oder Lizenzaussagen (LFH-432).

## 9. Lieferung

Ablauf nach `.agents/skills/clickup-dev`: Subtask LFH-497 → `in development` beim ersten
RED-Test → `in review` → zwei Reviews + Vollgates → `testing` → Draft-PR auf
`codex/lfh-429-website` → Approval des Tupels `(PR, Branch, HEAD)` durch den Repository-Owner
→ Merge → frische Gates auf `main` → `shipped`. `done` wird nicht automatisch gesetzt.

Vollgates: `pnpm test`, `pnpm typecheck`, `pnpm cli coverage`, `pnpm cli verify:repository`,
`pnpm --filter @einsatzzeichen/website check`, `pnpm --filter @einsatzzeichen/website build`,
`git diff --check`, sauberer Status.
