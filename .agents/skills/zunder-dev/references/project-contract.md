# Project contract

Verify these live values before any Zunder or repository mutation:

- Zunder-Projekt `5eaad177-cbbe-5506-a902-d9ddf2e93151` (Einsatzzeichen, Dev, Bereich Lifeline Hub)
- Repository `rubenvitt/einsatzzeichen`
- Branchpräfix `codex/`
- Statuspfad `open -> in_progress -> review -> done`
- Weitere Status `blocked`; Abbruchstatus `dropped` (nie `delete_task`)
- Vollgates `pnpm test`; `pnpm typecheck`; `pnpm cli coverage`; `git diff --check`; sauberer Status

## Zunder (MCP `mcp__claude_ai_Zunder__*`)

| Code | Bedeutung |
| --- | --- |
| `open` | noch nicht begonnen |
| `in_progress` | wird bearbeitet |
| `review` | PR offen |
| `blocked` | wartet auf etwas oder jemanden |
| `done` | abgeschlossen |
| `dropped` | bewusst nicht gemacht |

- Lesen: `get_task(task_id)` liefert Beschreibung und Unteraufgaben-Baum. Alte Aufgaben über die numerische ClickUp-ID: `get_task(clickup_id)`; eine Custom-ID wie `LFH-501` löst Zunder nicht auf.
- Unteraufgabe: `create_task(title, parent_id, description)`, mehrere auf einmal `decompose_task`.
- Reservieren: `claim_task(task_id, agent)` vor dem ersten Schreiben, erneut zum Verlängern; `release_task(task_id, agent)` nach dem PR.
- Ergebnisse: `update_task` mit `plan`, `branch`, `pr_url`. Es gibt keine Kommentare: Notizen per `get_task` lesen und als `## Notizen` mit Datum an `description` anhängen.
- Verweis in Commit- und PR-Body: `Zunder: https://zunder.rubeen.dev/#/aufgabe/<uuid>`; Branch `codex/<8hex>-<slug>` mit den ersten 8 Hex-Zeichen der UUID.

## Observable state protocol

1. Read the task live and create or reuse one unambiguous subtask.
2. Leave the subtask in `open` until work is ready to start.
3. Record the RED boundary, `claim_task` it and move it to `in_progress` before the first implementation write.
4. When the GREEN implementation is ready, move it to `review`.
5. Obtain two independent reviews and run all full gates; it stays in `review`.
6. Push the reviewed exact HEAD, create a Draft PR, set `pr_url`, `release_task` it, and wait for CI.
7. Wait for repository-owner approval of the exact `(PR, branch, HEAD)` tuple.
8. Stop: do not merge when any required local gate or exact-HEAD CI is RED, failed, missing, or stale. Approval never overrides this stop condition.
9. Merge only an approved tuple with current green local gates and exact-HEAD CI; run fresh gates against effective remote `main`.
10. Mark exactly that subtask `done` only after the remote-main evidence is green.

This workflow never automatically transitions the parent to `done`; that is a separate later manual acceptance decision. Read live status codes rather than deriving replacements from prose. Keep authentication material out of tasks, templates, PRs, screenshots, and committed files. Start a subtask with [the subtask template](../templates/zunder-subtask.md).
