# AGENTS.md

What anyone, person or coding agent, needs to know to work in **this** repository.
`CLAUDE.md` only points here. Org-wide rules (tracking work on the board, when to stop and ask,
secrets, branches and commits, the end-of-run report) come from setkernel's central agent setup
(https://github.com/setkernel/hq/blob/main/docs/repo-standard.md); don't repeat them here.

## What this repo is
`@setkernel/dotted-map-next`: a JavaScript library that generates SVG maps filled with dots or
hexagons (world or per-country), a maintained fork of `dotted-map`. Published to npm and GitHub
Packages. See `README.md` for the API and `CHANGELOG.md` for history.

## Commands
```sh
# install:  npm ci                  (Node 20+; CI uses 20.x)
# dev:      npm run dev             (webpack watch)
# test:     npm run test:all        (test.js + test.enhanced.js; also npm test / npm run test:enhanced)
# lint:     npm run format:check    (prettier; npm run format to fix)
# build:    npm run build           (webpack: builds index.js and without-countries.js)
```
CI (`.github/workflows/ci.yml`) runs `npm ci`, format:check, build, test, test:enhanced and
a non-blocking `npm audit --audit-level=high`.

## Deploy
No app deploy; this is an npm package. Releases go out only through the
"Release & Publish Package" workflow (`.github/workflows/release-and-publish.yml`,
`workflow_dispatch`, owner only), which bumps the version, tags, creates the GitHub release and
publishes to npm and GitHub Packages. `emergency-publish.yml` is the `workflow_dispatch` hotfix
path. npm uses trusted publishing (OIDC) and GitHub Packages the built-in `GITHUB_TOKEN`, so
there are no publish secrets (and nothing in Infisical). Never `npm publish` by hand.

## Layout
- `src/`: library source (`with-countries.js`, `without-countries.js`, `countries.geo.json` map data)
- `index.d.ts`, `without-countries.d.ts`: hand-written TypeScript types; keep in sync with the API
- `test.js`, `test.enhanced.js`: test scripts (plain Node, no framework)
- `webpack.config.js`: build config; `images/`: README images
- `.github/workflows/`: `ci.yml`, `dependencies.yml` (weekly audit), `merge-audit.yml`, release and emergency-publish
- `.github/WORKFLOWS.md`, `.github/WORKFLOW_DIAGRAM.md`, `.github/ACTION_STANDARDS.md`: CI/release docs

## Traps and don't-touch
- `index.js` and `without-countries.js` at the repo root are build output (git-ignored); edit `src/`.
  `package.json` `main`/`exports` point at them, so build before testing exports.
- `src/countries.geo.json` is large map data; do not reformat or hand-edit it.
- `package.json` `version` is bumped by the release workflow, not by hand.
- `release-and-publish.yml` and `emergency-publish.yml` publish to npm; change them only with the owner.
- This repository is public: workflows run on GitHub-hosted runners (`ubuntu-latest`), never a
  self-hosted runner. Actions are pinned to a full commit SHA with the version in a comment.
