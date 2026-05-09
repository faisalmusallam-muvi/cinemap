# Cinemap — working notes for Claude

## What this repo is
Static React site (React 18 + in-browser Babel, no build system, no npm).
Served from `/docs` on GitHub Pages. Live at https://cinemap.me.
Deploys happen by pushing to `main`.

## Release rule (مهم — every release must do this)

**Every push to `main` MUST update both fields in [docs/assets/src/utils.js](docs/assets/src/utils.js):**
- `releaseVersion` — the visible pill (e.g. `'v1.52'`). Bump every release.
- `releaseNoteAr` and `releaseNoteEn` — one short sentence explaining what
  changed in this release, in both Arabic and English. Written for users,
  not engineers.

The pill is what Faisal (and everyone else) looks at to confirm a release
landed. If you ship code without bumping it, Faisal can't tell the new
version is live and will keep clearing caches looking for it.

If you forget, you have to ship a follow-up commit just to bump the pill.
Don't make Faisal ask for this — bump it as part of the same commit.

The easiest way: run the `/release` slash command. It prompts for the
version and notes, edits `utils.js`, commits, and pushes to `main` for
you in one step.

## Service worker rule

`docs/sw.js` uses network-first for HTML/JS/JSON/manifest and cache-first
for static assets (svg/css/fonts/images). The `CACHE` constant
(`cinemap-shell-vNN`) is independent from `releaseVersion` — it only
needs to bump when the **shell precache list** changes (files added,
removed, or renamed). Normal data/copy/feature releases do NOT need a
SW cache bump — network-first picks up the new JS automatically.

When you DO bump CACHE, also bump the `?v=NN` query strings on the
precache URLs in both `sw.js` and `index.html` if you want to force a
fresh fetch of vendor/legacy assets.

## What's out of scope without explicit ask

Don't touch movie data, search/filters, watchlist, My 2026, ratings,
calendar, hero, modal, or analytics logic unless the user explicitly
asks for that file. Keep changes scoped.

## Local preview (sandbox notes)

`node` isn't installed in the Claude sandbox. The `cinemap` launch
config uses Ruby's WEBrick instead, serving from a mirror at
`/tmp/cinemap-docs`. After editing files in `docs/`, sync with:

```sh
rsync -a --delete docs/ /tmp/cinemap-docs/
```

The original `node server.js` config still works in any normal terminal
on Faisal's machine.

## Git remote

`origin` is set to SSH (`git@github.com:faisalmusallam-muvi/cinemap.git`)
so Claude can push without prompts. The deploy key lives at
`~/.ssh/id_ed25519_cinemap`.

To push: `git push origin <branch>` then fast-forward main with
`git push origin <branch>:main`. Pages rebuild in 30–90s. Watch at
https://github.com/faisalmusallam-muvi/cinemap/actions.
