# CHANGELOG in den npm-Paketen (ESZ-133)

Stand: 18.10.2026

## Anlass

Für die Upgrade-Prüfung 4.3.0 → 5.0.0 im Hub (LFH-836) musste der Diff der `dist`-Dateien
ausgewertet werden: Die Pakete lieferten kein Änderungsprotokoll mit. Neue Sperrregeln wie
`vehicle-category-requires-chassis-body` oder neue Exporte wie `PLACES`/`drawPlace` sah ein
Verbraucher nur im Diff.

## Entscheidung

- **Jedes publizierbare Paket liefert das Wurzel-`CHANGELOG.md` mit.** `publish.mjs` ruft vor
  `pnpm -r publish` `scripts/release/copy-changelog.mjs` auf. Das Skript kopiert die Datei in
  jedes Paket ohne `private: true`. `CHANGELOG.md` steht in `files` jeder package.json, die Kopien
  sind per `.gitignore` ausgeschlossen.
- **Ohne Eintrag kein Publish.** Fehlt im CHANGELOG die Überschrift `## [<version>]` der Version
  aus der Wurzel-package.json, bricht `publish.mjs` ab, bevor npm etwas sieht. Das erfüllt das
  Akzeptanzkriterium: Jeder veröffentlichte Tarball enthält den Eintrag der aktuellen Version.
- **Kopiert wird beim Publish, nicht im Build.** `pnpm build` läuft im Release-Workflow vor
  semantic-release. Den Eintrag der neuen Version schreibt erst `@semantic-release/changelog` im
  prepare-Schritt. Eine Kopie im Build trüge also die Vorversion.
- **Breaking Changes mit API/Regel-ID und Migrationshinweis.** Die Vorgabe an Claude in
  `release.config.mjs` (Punkte 11 und 12) verlangt einen Abschnitt `## ⚠️ Breaking Changes`. Jeder
  Eintrag nennt die betroffene API oder Regel-ID wörtlich und sagt, was Verbraucher ändern müssen.
  Neue Prüfregeln, die bisher gültige Eingaben ablehnen, zählen ausdrücklich dazu. Fällt Claude
  aus, gelten die konventionellen Notizen. Dort steht unter „BREAKING CHANGES“ der Text aus dem
  `BREAKING CHANGE:`-Footer der Commits. Der Footer sollte deshalb ebenfalls ID und Migration
  nennen.
- **Größen-Gate von core misst mit CHANGELOG.** `scripts/gates/core-package.mjs` legt die Datei vor
  `pnpm pack` in das Paket, führt sie als Pflichteintrag und hebt die Grenzen an. Messwerte und
  Begründung stehen im Kopf des Skripts.

## Verworfen

- **Changesets mit eigenem CHANGELOG je Paket.** Alle Pakete tragen dieselbe Version
  (`set-version.mjs`), und semantic-release schreibt aus den Conventional Commits schon ein
  gepflegtes, deutschsprachiges Protokoll. Changesets brächte einen zweiten Versionierungsweg
  neben semantic-release und eine Changeset-Datei je PR. Getrennte Protokolle hätten außerdem
  dieselben Einträge mehrfach. Eine Regeländerung in `core` betrifft auch Verbraucher von `react`
  und `maplibre`.
- **Nur die Einträge des Pakets.** Dafür müssten die Notizen je Paket gefiltert werden. Die
  Commits tragen aber keinen verlässlichen Paket-Scope, und das gemeinsame Protokoll gruppiert nach
  Bereichen.

## Folgen

- Jedes Paket wächst um die Größe des Protokolls, bei 6.4.0 um 61 KB entpackt und rund 20 KB
  gepackt. Pro Release kommen einige KB dazu. Wird das zu viel, lässt sich die Kopie auf die
  Einträge seit einer Major-Version kürzen.
