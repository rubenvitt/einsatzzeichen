# Project contract

Verify these live values before any ClickUp or repository mutation:

- Workspace `9015920204`
- Liste `901525048064` (Einsatzzeichen)
- Repository `rubenvitt/einsatzzeichen`
- Branchpräfix `codex/`
- Statuspfad `backlog -> scoping -> in design -> ready for development -> in development -> in review -> testing -> shipped -> done`
- Abbruchstatus `cancelled`
- Vollgates `pnpm test`; `pnpm typecheck`; `pnpm cli coverage`; `git diff --check`; sauberer Status

## Observable state protocol

1. Read the task live and create or reuse one unambiguous subtask.
2. Put the subtask in `ready for development` before work is ready to start.
3. Record the RED boundary and move it to `in development` before the first implementation write.
4. When the GREEN implementation is ready, move it to `in review`.
5. Obtain two independent reviews and run all full gates; then move it to `testing`.
6. Push the reviewed exact HEAD, create a Draft PR, and wait for CI.
7. Wait for repository-owner approval of the exact `(PR, branch, HEAD)` tuple.
8. Merge only that approved tuple; run fresh gates against effective remote `main`.
9. Mark exactly that subtask `shipped` only after the remote-main evidence is green.

Read live status names rather than deriving replacements from prose. Keep authentication material out of tasks, templates, PRs, screenshots, and committed files. Start a subtask with [the subtask template](../templates/clickup-subtask.md).
