# Release-Notizen: Claude per Workload Identity Federation (ESZ-140)

Stand: 13.10.2026

## Entscheidung

Die Release-Notizen schreibt weiter Claude, aber nach dem Muster von rubenvitt/lifeline-hub:

- **Anmeldung per Workload Identity Federation statt `ANTHROPIC_API_KEY`.** Der Schritt
  „Claude-Anmeldung (GitHub-OIDC)“ in `.github/workflows/release.yml` holt ein GitHub-OIDC-Token
  (Audience `https://api.anthropic.com`) und setzt die `ANTHROPIC_*`-Federation-Variablen; die
  Claude-CLI im Agent SDK tauscht es gegen ein kurzlebiges Token. Kein fester Schlüssel im Repo.
- **Hülle `scripts/release/ki-notizen.mjs`** um `semantic-release-claude-changelog`:
  derselbe Text in CHANGELOG und GitHub-Release (semantic-release erzeugt die Notizen zweimal),
  Versionskopfzeile mit Vergleichslink aus den konventionellen Notizen (fehlte bei 5.3.0),
  Rückfall auf die konventionellen Notizen bei fehlender Anmeldung, Fehltext oder Fehler, ein
  Zug (`maxTurns: 1`) und alle Commits statt der stillen 100er-Grenze.
- **Agent SDK per Override auf 0.3.296** (`pnpm-workspace.yaml`): das Plugin hält es sonst auf
  0.1.x, dessen CLI keine Federation kennt.
- **`conventional-changelog-conventionalcommits` auf `^9.3.1` zurück** (Dependabot-Sperre für
  Majors): Version 10 braucht `conventional-changelog-writer@9`, semantic-release 25 bringt `@8`
  mit. Bisher lief nur der Commit-Analyzer mit dem Preset; die Hülle erzeugt die konventionellen
  Notizen jetzt bei jedem Release, und mit Version 10 bräche das mit „Missing helper“.

## Einrichtung (einmalig, Claude Console)

1. In der Claude Console (platform.claude.com) einen Service Account anlegen oder den von
   lifeline-hub mitbenutzen.
2. Eine Federation-Regel für den Aussteller GitHub Actions
   (`https://token.actions.githubusercontent.com`) anlegen, gebunden an den Service Account,
   Audience `https://api.anthropic.com`, Subject
   `repo:rubenvitt@19268519/einsatzzeichen@1329423527:ref:refs/heads/main`.
   **Achtung:** das Repo nutzt unveränderliche OIDC-Subjects (`use_immutable_subject: true`, siehe
   `gh api repos/rubenvitt/einsatzzeichen/actions/oidc/customization/sub`); der `sub`-Claim trägt
   deshalb Eigentümer- und Repo-ID. Die kurze Form `repo:rubenvitt/einsatzzeichen:…` passt nie,
   und die Anmeldung scheiterte still (lifeline-hub hat die Einstellung nicht).
   Eingerichtet am 13.10.2026 als Regel `einsatzzeichen-releases` am Service Account
   `lifeline-hub-release`, Workspace „Default“.
3. Im Repo unter Settings → Secrets and variables → Actions → **Variables** setzen:
   `ANTHROPIC_FEDERATION_RULE_ID`, `ANTHROPIC_ORGANIZATION_ID`, `ANTHROPIC_SERVICE_ACCOUNT_ID`,
   optional `ANTHROPIC_WORKSPACE_ID` (nur wenn die Regel mehrere Workspaces abdeckt).
4. Das Secret `ANTHROPIC_API_KEY` wird nicht mehr gelesen und kann gelöscht werden.

Fehlt etwas davon, läuft der Release mit den konventionellen Notizen und einer Warnung weiter.
