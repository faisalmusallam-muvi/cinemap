---
description: Bump the release pill, update the release note (AR + EN), commit, and push to main.
---

You are running the Cinemap release workflow. Follow these steps exactly:

## 1. Read current state
- Read [docs/assets/src/utils.js](docs/assets/src/utils.js) lines 14–18 to see the current `releaseVersion`, `releaseNoteAr`, `releaseNoteEn`.
- Run `git status --short` and `git log --oneline -5` so you can summarize what has shipped since the last release.

## 2. Propose the bump
Show the user:
- Current version → proposed next version (default: increment the last segment, e.g. `v1.51` → `v1.52`).
- A draft Arabic release note (one short sentence, written for users in Faisal's voice — casual Saudi Arabic, no corporate-speak).
- A draft English release note (one short sentence, mirror of the Arabic).
- The list of commits/files that justify the note.

If the user passed arguments to `/release` (e.g. `/release v1.55 "fixed Hijra"`), use them as the starting draft instead of inventing.

## 3. Confirm with the user
Ask the user to confirm or edit the version + notes before you write anything. Wait for an explicit yes.

## 4. Apply the edit
- Edit `docs/assets/src/utils.js` to update all three fields (`releaseVersion`, `releaseNoteAr`, `releaseNoteEn`).
- If the SW shell precache list also changed in this release, bump `CACHE` in `docs/sw.js` too. Otherwise leave it alone — network-first handles normal releases.

## 5. Commit and push
- Stage only the files you changed (don't `git add -A`).
- Commit message format:
  ```
  Release vX.YY — <short imperative summary>

  <release note in English, one or two sentences>

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- Push the current branch: `git push origin <current-branch>`
- Fast-forward main: `git push origin <current-branch>:main`
- Confirm both pushes succeeded. If main isn't a clean fast-forward, STOP and tell the user — don't force anything.

## 6. Report
Tell the user:
- The new version number that just went live.
- The Pages deploy URL: https://github.com/faisalmusallam-muvi/cinemap/actions
- One sentence on what users will see.
- Reminder that the new pill should appear within ~60s on cinemap.me.

## Don't
- Don't bump the SW cache version unless the shell precache list actually changed.
- Don't touch movie data, watchlist, ratings, etc. as part of this command — release is metadata-only.
- Don't skip the user confirmation in step 3.
