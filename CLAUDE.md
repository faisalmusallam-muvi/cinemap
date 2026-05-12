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

## Catalog rule — every movie MUST have a pinned tmdbId

In [docs/assets/src/utils.js](docs/assets/src/utils.js), every movie
entry must include a `tmdbId: <number>` field. No exceptions.

Why: without it, the TMDB client falls back to title-search, which is
**non-deterministic across time**. A film that resolves correctly today
can silently switch to a different film tomorrow when TMDB adds a new
entry with a similar title — the user gets the wrong poster, wrong
synopsis, wrong cast, with no error to surface. We've been bitten by
this for Family Business, Housemaid, Asad, El Gawahergy, How to Rob a
Bank, 28 Years Later, Hijra, and Jumanji.

When adding a new movie:
1. Find it on https://www.themoviedb.org and copy the numeric id from
   the URL (e.g. `https://www.themoviedb.org/movie/1272837` → `1272837`)
2. Add `tmdbId: 1272837` to the entry
3. If you can't find it on TMDB, leave a comment `// no tmdb match yet`
   and tell Faisal — don't ship without one. The title search is a
   trap.

When updating: if a poster suddenly looks wrong, the cause is almost
always title-search drift. The fix is pinning the correct tmdbId, then
bumping `CACHE_VERSION` in `docs/assets/src/tmdb-client.js` so existing
users' stale caches re-fetch immediately instead of waiting for the
per-key TTL to roll over.

Do not guess TMDB ids. If the correct TMDB page is not confirmed, leave the
movie unpinned, run `ruby tools/validate-catalog.rb`, and tell Faisal which
movies need manual verification.

Run catalog validation before shipping catalog/media changes:

```sh
ruby tools/validate-catalog.rb
```

Blocking catalog issues:
- duplicate movie keys (`en|date`)
- duplicate `tmdbId` across different movies
- duplicate `tmdbId` properties inside one movie entry
- invalid or missing release dates
- missing Arabic title
- `preferLocalOverview: true` without local `overview` or `overviewEn`

Missing `tmdbId` is a review issue, not always a hard blocker. A movie may
ship without `tmdbId` only when the TMDB page is not available yet or the match
needs manual verification. Never invent TMDB ids.

If Cinemap intentionally needs local synopsis copy to win over TMDB, set
`preferLocalOverview: true` on that movie and provide `overview` and/or
`overviewEn`. Without that flag, TMDB remains the default synopsis source.

## MVP signal rule

Cinemap's current MVP priority is clean Saudi audience signals, not adding
features. Prioritize reliability for saves, watched status, ratings,
"worth cinema" / "wait for streaming" intent, Arabic search aliases, and
anonymous Supabase analytics.

Analytics changes must preserve compatibility with existing Supabase
`event_type` values, materialized views, and dashboards. Do not rename live
Supabase event types or change schema/RLS policies without explicit approval.

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
