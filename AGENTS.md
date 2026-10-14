# AGENTS.md

Operating contract for anyone, human or coding agent, working in this repository.
`CLAUDE.md` only points here; edit this file.

## What this repo is
`@setkernel/dotted-map-next`: a JavaScript library that generates SVG maps filled with dots or hexagons
(world or per-country), a maintained fork of `dotted-map`. Published to npm and GitHub Packages.
See `README.md` for the API and `CHANGELOG.md` for history.

## Commands
```sh
npm ci                  # install (Node 20+; CI runs 20.x, 22.x and 24.x)
npm run build           # tsup: index/without-countries .js (CJS), .mjs (ESM), .d.ts/.d.mts (git-ignored)
npm run lint            # eslint
npm run typecheck       # tsc --noEmit (strict), includes tests
npm test                # vitest
npm run test:all        # typecheck + tests + tests with coverage thresholds
npm run size            # bundle-size budget against size-baseline.json (after build)
npm run lint:package    # publint + arethetypeswrong
npm run test:package    # npm pack, install the tarball in a temp dir, try import/require/types
npm run format:check    # prettier check (npm run format to fix)
npm run dev             # tsup watch mode
# publish: only the owner, via the "Release & Publish Package" workflow (workflow_dispatch). Never `npm publish` by hand.
```
Done means format:check, lint, build, test:all and size pass locally. Say which check could not run and why.

## Working agreement
- When a step doesn't need the owner, keep going. Put status notes in the same message as the next action.
- Stop and ask before anything destructive or outward-facing: deleting data, force-pushing,
  publishing to npm, running a release workflow, changing secrets or repository settings, or touching anything outside this repo.
- Keep each change focused on its issue. No drive-by refactors.
- Never commit secrets, `.env` files or credentials.
- End every run with three headings: **Blocked on owner**, **Changed**, **Found**.
  Mark anything you could not confirm, and say where you looked.
- Long or multi-step work: keep a checklist in `TASKS.md` (gitignored) so progress survives
  context compaction; tick items as they finish.

## Tracking work (mandatory)
Status lives ONLY in GitHub issues on the setkernel board: https://github.com/orgs/setkernel/projects/6
(full rules: https://github.com/setkernel/hq/blob/main/docs/tracking.md). Never record status in
docs, READMEs, comments in code, or dashboards.
1. Search first (`gh issue list --state all --search "<words>"` here and in setkernel/hq); reuse,
   never duplicate. New issue → add it to the board: `gh project item-add 6 --owner setkernel --url <url>`.
2. Starting: assign yourself and set the board Status to In Progress.
3. As you go: tick the issue's checkboxes and comment what changed with a link.
4. PR body: `Closes setkernel/<repo>#N` (or `Refs` for partial work). Merge closes it and the board
   marks it Done.
5. Closing without a PR: comment how it was verified (command + result).
6. Blocked on Raghav: label `owner`, board Needs = Raghav, and comment the exact action he must take.

## Layout
- `src/`: TypeScript source (`with-countries.ts`, `without-countries.ts`, `projection.ts`, `countries.geo.json` map data).
  Published types are generated from it; `test/types/consumer-1x.ts` must keep compiling (1.x type compatibility)
- `test/`: Vitest suites (`legacy.test.ts` is the port of the 1.x scripts; keep its assertions)
- `scripts/`: `check-size.mjs` (bundle budget), `smoke-pack.mjs` (tarball install test)
- `tsup.config.ts`, `tsconfig.json`, `vitest.config.mts`, `eslint.config.mjs`: tooling; `images/`: README images
- `.github/workflows/`: `ci.yml`, `dependencies.yml` (weekly audit), release and emergency-publish workflows

## Don't touch
- `index.*` and `without-countries.*` at the repo root are build output (git-ignored); edit `src/`.
- `size-baseline.json`: raise a baseline only with the owner's agreement.
- `src/countries.geo.json` is large map data; do not reformat or hand-edit it.
- `package.json` `version`: bumped by the release workflow, not by hand.
- `.github/workflows/release-and-publish.yml` and `emergency-publish.yml` publish to npm; change only with the owner.

## Conventions
- Branches: `<type>/<short-name>` (feat/, fix/, chore/, ci/, docs/). Agents push to `claude/` or `agent/` branches.
- Commits: conventional style (`feat: ...`, `fix: ...`). Every PR needs maintainer review before merge.
- GitHub Actions run on GitHub-hosted runners (`ubuntu-latest`) only: this repository is public, so never
  point a workflow at a self-hosted runner. Actions are pinned to a full commit SHA with the version in a
  comment, and Dependabot keeps them current.

## Agent tooling (.claude/)
- Subagents: `explorer` (Sonnet, read-only search and log reading) and `reviewer` (Opus, high
  effort, merge blockers only). Delegate lookups to `explorer`; keep code edits in the main session.
- Skills: `verify` (run the checks as CI does), `review-blockers`, `ship-pr` (verify → review →
  branch → PR). Use `ship-pr` to finish a change.
- Effort: medium for well-scoped work, high for bugs in old code and for review; low for
  mechanical edits. A check (test, build) beats raising effort.
- Cloud sessions run `.claude/cloud-setup.sh` on start (only when `CLAUDE_CODE_REMOTE` is set).
