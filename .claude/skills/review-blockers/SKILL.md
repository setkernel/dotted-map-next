---
name: review-blockers
description: Review the current branch for merge blockers only, using the reviewer subagent, then summarize for the owner. Use when asked to review a branch or PR.
---
1. Make sure the branch is pushed and up to date with the default branch.
2. Delegate to the `reviewer` subagent: "Review this branch against the default branch.
   Merge blockers only, with file, line, why, and how to reproduce."
3. Check each reported blocker yourself before passing it on (open the file, run the repro).
   Drop any you can't confirm and say so.
4. Reply with: **Blockers** (confirmed), **Not confirmed**, **Checks** (verify results).
