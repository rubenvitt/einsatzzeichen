---
name: clickup-dev
description: Use when a request names an LFH-#### ticket, asks to pick up / update / close a ClickUp task, or asks to start dev work from the board in the einsatzzeichen or lifeline-hub repos. Also use when a ClickUp lookup returns "Team not authorized".
---

# ClickUp Dev (LFH board)

## Overview

Both `einsatzzeichen` and `lifeline-hub` draw tickets from the **same ClickUp space**, and every
ticket carries the prefix `LFH-`. The prefix does **not** identify the project — **the list does.**

## Where the tickets live

| Thing | Value |
|---|---|
| Workspace | `9015920204` |
| Space | `Lifeline Hub` — `901511065513` |
| List for **einsatzzeichen** | `Einsatzzeichen` — `901525048064` |
| Ticket prefix | `LFH-` (shared across both projects) |

`~/dev/CLAUDE.md` says only `lifeline-hub` has a board. That is **out of date** — einsatzzeichen
tickets live in the `Einsatzzeichen` list above.

There is no `.mcp.json` in `einsatzzeichen`; ClickUp arrives through the account-level claude.ai
connector (`mcp__claude_ai_ClickUp__*`).

## The "Team not authorized" trap

Looking a ticket up by **custom ID** without a workspace fails, and the error looks like an auth
problem rather than a missing argument:

```
clickup_get_task(task_id: "lfh-501")                        → {"error":"Team not authorized"}
clickup_get_task(task_id: "LFH-501", workspace_id: "9015920204")   → works
```

**Always pass `workspace_id: "9015920204"` when resolving a custom ID.** Do not conclude the MCP
server is unauthorized from this error — probe with `clickup_get_workspace_hierarchy` (no args)
before reporting an auth blocker. If a custom ID still resists, `clickup_search(keywords: "lfh-501")`
returns the numeric id (e.g. `86cbbj8d1`), which works without a workspace.

## Statuses — the exact ten, in board order

```
backlog → scoping → in design → ready for development → in development
        → in review → testing → shipped
```
plus `cancelled` (done) and `done` (closed).

Lowercase, with spaces, exactly as written — `clickup_update_task` rejects anything else. Confirm
with `clickup_get_task(..., expand_statuses: true)` if unsure.

| Moment | Set status to |
|---|---|
| Picking the ticket up | `in development` |
| PR opened | `in review` |
| Merged / deployed | `shipped` |

`shipped` is the normal terminal state for completed work (e.g. LFH-485). Reserve `done` for
tickets that need the closed state.

## Process with agents

1. **Read the ticket first.** `clickup_get_task` with `include: ["description", "subtasks"]`.
   Descriptions carry the real constraint and often name an owner decision and its date.
2. **Check the parent.** These tickets are usually subtasks (LFH-501's parent is LFH-429); the
   parent holds the scope the subtask assumes.
3. **Isolated worktree**, named after the branch with `/` replaced by `+`:
   `.claude/worktrees/<type>+lfh-<nr>-<slug>` for branch `<type>/lfh-<nr>-<slug>` (lowercase).
   **Branch from `origin/main`** — the local `main` in this clone runs hundreds of commits behind.
4. **Dispatch subagents** for independent slices; use superpowers:subagent-driven-development.
   Give each subagent the ticket text, not a paraphrase.
5. **Commit messages** reference the ticket: `feat(website): LFH-501 — …` (uppercase, em dash), or
   `(LFH-501)` at the end of the subject. German, Conventional Commits.
6. **Written artefacts** (this repo keeps them): plans in `docs/superpowers/plans/`, specs in
   `docs/superpowers/specs/`, QA in `docs/reviews/`, scope calls in `docs/decisions/` — all named
   `YYYY-MM-DD-<slug>.md`.
7. **Update the status** as you move. Do not leave a shipped branch sitting in `backlog`.

## Common mistakes

- Assuming `LFH-` means lifeline-hub. Check the list.
- Reading the ticket's numeric id from a chat URL — in `/v/cn/<channel>/t/<id>` the trailing id is
  a **message**, not a task.
- Branching from stale local `main`.
- Inventing a status. Only the ten above exist.
