---
name: zunder-dev
description: Use when a request names a Zunder task (UUID or `zunder.rubeen.dev` link) or an old LFH-#### ticket, asks to pick up / update / close a task, or asks to start dev work from the board in the einsatzzeichen or lifeline-hub repos.
---

# Zunder Dev (Einsatzzeichen board)

## Overview

Since 12.10.2026 the tickets live in **Zunder** (`https://zunder.rubeen.dev`), not ClickUp.
`einsatzzeichen` and `lifeline-hub` are two dev projects in the same area — **the project
identifies the repo.** Old `LFH-` numbers are shared across both and identify nothing.

## Where the tickets live

| Thing | Value |
|---|---|
| Area | `Lifeline Hub` — `c6748f09-39fb-500e-875b-e0e8a68ad2e6` |
| Project for **einsatzzeichen** | `Einsatzzeichen` (dev, `rubenvitt/einsatzzeichen`) — `5eaad177-cbbe-5506-a902-d9ddf2e93151` |
| Project for **lifeline-hub** | `Dev: Lifeline-Hub` (dev, `rubenvitt/lifeline-hub`) — `aafceb07-f9e9-5e8b-8ffe-a38afadd7067` |

Zunder arrives through the account-level claude.ai connector (`mcp__claude_ai_Zunder__*`); there
is no `.mcp.json` in `einsatzzeichen`. Confirm IDs with `list_structure` if unsure.

## Task IDs

A task is addressed by its UUID (`task_id`). There are no readable ticket numbers.

- **Link** (commit body, PR body, docs): `Zunder: https://zunder.rubeen.dev/#/aufgabe/<uuid>`
- **Branch**: the first 8 hex characters of the UUID instead of the number,
  `<type>/<8hex>-<slug>` (lowercase).
- **Old tickets** (`LFH-####` in commits, docs, descriptions) stay valid as history. Zunder does
  not resolve the custom ID: `get_task(clickup_id: "LFH-501")` fails. Use the numeric id from the
  old ClickUp link (`get_task(clickup_id: "86cbbj8d1")`, web
  `https://zunder.rubeen.dev/#/clickup/<clickup_id>`), otherwise `search` by title.

## Statuses

```
open → in_progress → review → done
```
plus `blocked` and `dropped`. Exactly these six codes — the tools reject anything else.

| Moment | Call |
|---|---|
| Picking the ticket up | `claim_task(task_id, agent)` + `update_task(status: "in_progress", branch: …)` |
| PR opened | `update_task(status: "review", pr_url: …)`, then `release_task(task_id, agent)` |
| Merged / deployed | `done` |
| Not done on purpose | `dropped` — never `delete_task` |

`claim_task` holds for 120 minutes by default; call it again to extend. Notes that used to be
comments go into the description under `## Notizen` with the date — `get_task` first, so nothing
is overwritten.

## Process with agents

1. **Read the ticket first.** `get_task(task_id)` returns the description and the subtask tree.
   Descriptions carry the real constraint and often name an owner decision and its date.
2. **Check the parent.** These tickets are usually subtasks; `get_task(parent_id)` holds the scope
   the subtask assumes.
3. **Isolated worktree**, named after the branch with `/` replaced by `+`:
   `.claude/worktrees/<type>+<8hex>-<slug>` for branch `<type>/<8hex>-<slug>` (lowercase).
   **Branch from `origin/main`** — the local `main` in this clone runs hundreds of commits behind.
4. **Dispatch subagents** for independent slices; use superpowers:subagent-driven-development.
   Give each subagent the ticket text, not a paraphrase. New subtasks: `create_task(parent_id: …)`
   or several at once with `decompose_task`.
5. **Commit messages** reference the ticket with `Zunder: https://zunder.rubeen.dev/#/aufgabe/<uuid>`
   in the body. German, Conventional Commits.
6. **Written artefacts** (this repo keeps them): plans in `docs/superpowers/plans/`, specs in
   `docs/superpowers/specs/`, QA in `docs/reviews/`, scope calls in `docs/decisions/` — all named
   `YYYY-MM-DD-<slug>.md`. Record the plan with `update_task(plan: …)`.
7. **Update the status** as you move. Do not leave a merged branch sitting in `open`.

## Common mistakes

- Assuming `LFH-` means lifeline-hub. Check the project.
- Looking up an old `LFH-####` as `clickup_id` — only the numeric ClickUp id works.
- Branching from stale local `main`.
- Inventing a status. Only the six above exist.
