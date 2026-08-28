# ClickUp subtask

## Ergebnis

Lieferbares Ergebnis: abgegrenztes Katalogartefakt.

## Nicht-Ziele

Ausgeschlossen: Änderungen außerhalb des vereinbarten Lieferumfangs.

## Akzeptanzkriterien

- Katalogartefakt ist im vorgesehenen Workflow sichtbar.
- Vollgates und Reviews sind nachweisbar.

## Abhängigkeiten

Zugeordneter Parent-Task; genehmigter Ziel-Branch.

## Verifikation

`pnpm test`, `pnpm typecheck`, `pnpm cli coverage`, `git diff --check`, sauberer Status.

## PR/HEAD

PR: #123; Branch: `codex/example-delivery`; HEAD: `0123abcd`.

## Post-Merge-Nachweis

Remote `main` erfolgreich verifiziert; Subtask `shipped`.
