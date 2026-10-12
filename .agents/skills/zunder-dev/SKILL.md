---
name: zunder-dev
description: Use when delivering Zunder-backed development work in the Einsatzzeichen repository, especially when task status, PR approval, merge, main verification, screenshots, or the `done` state must stay consistent.
---

# Zunder delivery work

## Overview

Keep the Zunder task, the branch, PR, CI, review evidence, screenshots, and remote-main evidence truthful to the same deliverable. Live values take precedence; a contradiction stops mutation for clarification rather than being silently corrected.

## When to use / not use

Use for a Zunder-backed repository slice from task creation through `done`. Do not use to infer status from prose, bypass repository-owner approval, close an incomplete parent, or clean another agent's worktree.

## Required reading

First read [the project contract](references/project-contract.md) and verify its live values before acting. For any review, PR, merge, or completion-status work, also read [review and delivery](references/review-and-delivery.md). Use its linked [subtask template](templates/zunder-subtask.md) and [PR body template](templates/pr-body.md) when applicable.

## Status and gates

| Evidence | Permitted state/action |
| --- | --- |
| Unique scoped subtask | `open` |
| RED work begins | `in_progress` + `claim_task` |
| GREEN implementation ready for review | `review` |
| Two reviews and full gates pass | stays `review`; evidence in the PR body |
| Exact approved HEAD is merged and remote main passes fresh gates | subtask `done` |

Status codes and the Zunder calls live once in [the project contract](references/project-contract.md).

## Stop rules

- Stop before a status change, push, PR, merge, or publication when live task/list/repository/branch/HEAD values conflict with the contract.
- Stop before merge unless repository-owner approval explicitly names the current `(PR, branch, HEAD)` tuple.
- Stop after a changed HEAD: obtain new explicit approval; CI for an earlier HEAD is not transferable.
- Stop parent completion when its acceptance criteria or represented delivery scope remain incomplete.

## Red flags

- Invented status labels, including familiar generic workflow words.
- Calling remaining representations “slices” without live scope evidence.
- Treating a screenshot, green CI, deadline, or lead request as approval or post-merge proof.
- Marking `done` before fresh effective remote-main verification.

## Common mistakes

Do not replace a Zunder status with a prose explanation, make an implicit approval out of surrounding context, or reuse a stale approval after HEAD drift. Publish only eligible catalog/workflow output; never publish or commit private reference files, reference-derived rasters, reference-vs-catalog comparison/pair images, or local absolute reference paths/metadata. Cleanup is limited to the worktree you own after delivery evidence is complete.
