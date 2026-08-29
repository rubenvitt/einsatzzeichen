/**
 * Automatische Versionierung und Veröffentlichung mit semantic-release.
 *
 * Ablauf pro Push auf main (.github/workflows/release.yml):
 *  1. commit-analyzer bestimmt aus den Conventional Commits die nächste Version
 *     (feat → minor, fix/perf/refactor → patch, BREAKING CHANGE/`!` → major).
 *  2. semantic-release-claude-changelog erzeugt deutschsprachige Release Notes.
 *  3. changelog schreibt CHANGELOG.md fort.
 *  4. exec setzt die Version in alle package.json und publiziert die Pakete
 *     per `pnpm -r publish` in die npm-Org @einsatzzeichen.
 *  5. git committet CHANGELOG.md und die package.json zurück auf main.
 *  6. github legt das GitHub-Release an und kommentiert erledigte Issues/PRs.
 *
 * @type {import('semantic-release').GlobalConfig}
 */
export default {
  repositoryUrl: 'https://github.com/rubenvitt/einsatzzeichen',
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'refactor', release: 'patch' },
          { type: 'perf', release: 'patch' },
        ],
      },
    ],
    [
      'semantic-release-claude-changelog',
      {
        escaping: 'none',
        promptTemplate: `Erstelle Release Notes für Version {{version}} des Projekts Einsatzzeichen – ein semantisches Symbolsystem für taktische Zeichen der Gefahrenabwehr (npm-Pakete unter @einsatzzeichen, u.a. core, catalog, react, web-component, maplibre, qgis, cli).

Hier sind die Commits dieses Releases:

\`\`\`json
{{commits}}
\`\`\`

{{#additionalContext}}
Zusätzlicher Kontext:

\`\`\`json
{{additionalContext}}
\`\`\`
{{/additionalContext}}

WICHTIG: Deine Antwort darf NUR die Release Notes im Markdown-Format enthalten. Kein zusätzlicher Text, keine Erklärungen.

Die Release Notes sollen:

1. Auf Deutsch geschrieben sein
2. Änderungen thematisch nach Bereichen gruppieren (z.B. "Katalog", "Rendering", "Website", "CLI") statt nach Commit-Typ (Feature/Bugfix)
3. Technische Commit-Messages in benutzerfreundliche Beschreibungen übersetzen
4. Wichtige Änderungen hervorheben, die Nutzerinnen und Nutzer der Pakete betreffen
5. Rein technische Commits weglassen (CI-Fixes, Linter-Config, Refactoring ohne User-Impact, Release-Pipeline-Änderungen)
6. Bugfixes den jeweiligen Bereichen zuordnen, nicht separat auflisten
7. Keine Commit-Hashes, keine Story-Nummern, keine internen Tracking-IDs
8. Markdown-Formatierung mit ## für Abschnitts-Überschriften
9. Kompakt und scanbar sein – Qualität vor Quantität
10. Breaking Changes prominent am Anfang hervorheben

Starte direkt mit den Release Notes, gruppiert wie oben beschrieben, mit ## ...`,
      },
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'node scripts/release/set-version.mjs ${nextRelease.version}',
        publishCmd: 'pnpm -r publish --access public --no-git-checks',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'packages/*/package.json'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    [
      '@semantic-release/github',
      {
        successComment:
          '🎉 Dieses Issue/PR wurde in Release [v${nextRelease.version}](${releases.filter(release => release.name)[0]?.url || ""}) veröffentlicht.',
        failComment: '❌ Das Release ist fehlgeschlagen. Details in den CI-Logs.',
      },
    ],
  ],
};
