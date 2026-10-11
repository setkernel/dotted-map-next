# AGENTS.md

Operating contract for anyone, human or coding agent, working in this repository.
`CLAUDE.md` only points here; edit this file.

## What this repo is
`@setkernel/dotted-map-next`: a JavaScript library that generates SVG maps filled with dots or hexagons
(world or per-country), a maintained fork of `dotted-map`. Published to npm and GitHub Packages.
See `README.md` for the API and `CHANGELOG.md` for history.

## Commands
```sh
npm ci                  # install (Node 20+; CI uses 20.x)
npm run build           # webpack: builds index.js and without-countries.js (git-ignored)
npm test                # basic tests (node test.js)
npm run test:enhanced   # full suite (24 tests)
npm run test:all        # both
npm run format:check    # prettier check (npm run format to fix)
npm run dev             # webpack watch mode
# publish: only the owner, via the "Release & Publish Package" workflow (workflow_dispatch). Never `npm publish` by hand.
```
Done means format:check, build and test:all pass locally. Say which check could not run and why.

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

## Layout
- `src/`: library source (`with-countries.js`, `without-countries.js`, `countries.geo.json` map data)
- `index.d.ts`, `without-countries.d.ts`: hand-written TypeScript types; keep in sync with the API
- `test.js`, `test.enhanced.js`: test scripts (plain Node, no framework)
- `webpack.config.js`: build config; `images/`: README images
- `.github/workflows/`: `ci.yml`, `dependencies.yml` (weekly audit), release and emergency-publish workflows

## Don't touch
- `index.js` and `without-countries.js` at the repo root are build output (git-ignored); edit `src/`.
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
