---
name: verify
description: Run this repo's full check suite (install, lint, typecheck, test, build) exactly as CI does and report pass/fail per step. Use before saying a change is done or before opening a PR.
---
1. Read the "Commands" section of AGENTS.md and the CI workflow(s) in `.github/workflows/`.
2. Run the same steps CI runs, in the same order, from a clean install where the lockfile allows
   (`npm ci`, `pnpm install --frozen-lockfile`, `uv sync`).
3. Report a table: step | command | result | time. On a failure, show the first relevant error
   lines and the file:line it points to.
4. A step that cannot run here (needs a secret, a service, the house LAN) is reported as
   "not run" with the reason, never as passed.
