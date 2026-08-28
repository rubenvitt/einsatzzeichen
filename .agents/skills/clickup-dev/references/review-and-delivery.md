# Review and delivery

Use this reference for review, PR, merge, screenshot, and completion work.

## Required evidence

- Get two independent reviews for each slice: one checks contract and acceptance criteria, the other checks implementation quality and delivery evidence.
- Run every full gate from the project contract. Treat CI as a separate, exact-HEAD result; a flaky-test claim or local result does not substitute for it.
- Do not merge if any required local gate or exact-HEAD CI is RED, failed, missing, or stale. Repository-owner approval never overrides this stop condition.
- Capture a screenshot from the catalog or workflow that belongs to the slice. Do not publish private reference artwork or unrelated local material.
- Record approval as the exact tuple `(PR, branch, HEAD)`. If HEAD changes, approval and CI evidence for the old commit do not carry forward.
- After merge, verify effective remote `main` afresh with the full gates before `shipped`.
- Finish the parent only when its live acceptance criteria and all represented delivery scope are complete. A progress count is not proof that remaining representations are delivery slices.
- Clean up only the worktree and branch you own, and only after delivery evidence is complete.

Use [the PR body template](../templates/pr-body.md) for reviewable PR evidence.

## Observed rationalizations

| Observed loophole | Required correction |
| --- | --- |
| Generic or prose status was substituted for the list status. | Read and use an exact live status from the project path. |
| A generic in-progress label was inferred during RED work. | Use `in development` at the documented transition. |
| A made-up verification status was used after merge. | Verify remote `main`, then use `shipped` for the PR subtask. |
| Remaining representations were called remaining slices. | Preserve the live distinction unless scope evidence defines a slice. |
| A screenshot concern produced an invented parent status. | Keep the parent at its live status and publish only eligible catalog/workflow evidence. |
| HEAD drift produced invented blocked and action statuses. | Keep live statuses; stop and request approval for the new tuple. |

The following stop invariants are project contract even when the baseline chose safely: no merge without current green local gates and exact-HEAD CI, no merge without exact owner approval, no shipping without fresh remote-main gates, no parent closure while incomplete, no private-reference publication, no status invention, and no stale-HEAD approval reuse.
