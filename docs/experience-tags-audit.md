# Cinemap Experience Tags Audit

Date: 2026-05-16

## Summary

- Movies scanned: 109
- Movies with `exp: [...]`: 24
- Movies missing `exp: [...]`: 85
- Current product decision: experience tags are hidden from the UI until
  coverage is reliable enough to avoid confusing users.

Experience tags are manual catalog metadata in `docs/assets/src/utils.js`.
TMDB does not provide reliable IMAX / 4DX / ScreenX / Dolby / Suites availability,
so Cinemap should not infer these tags automatically.

## Rule

Only add experience tags when one of these is true:

- The Saudi cinema/distributor page confirms the format.
- The official movie/cinema campaign confirms the format.
- The movie is already confirmed in Cinemap data from a trusted prior pass.

Do not add IMAX / 4DX / ScreenX / Dolby just because the movie is big,
Hollywood, action, or animated.

## Currently Supported Tags

- `imax`
- `dolby`
- `screenx`
- `4dx`
- `suites`

## High-Visibility Movies Missing Experience Tags

These are worth manual verification first because users are more likely to
open them or expect premium formats:

- Jumanji: Open World
- Minions 3
- The Cat in the Hat
- The Angry Birds Movie 3
- Disclosure Day
- Shabab El Bomb 3
- Greenland 2: Migration
- Hamnet
- Scary Movie 6
- The Devil Wears Prada 2
- Good Luck, Have Fun, Don't Die
- Cold Storage
- Mercy
- Send Help
- Primate
- The Dog Stars
- Clayface
- Practical Magic 2
- Verity
- The Bride!
- The Strangers: Chapter 3
- Ready Or Not 2: Here I Come
- Lee Cronin's The Mummy
- 7 Dogs
- The Housemaid

## Recommended Workflow

1. Verify formats from cinema/distributor sources.
2. Add `exp: [...]` only to confirmed movie entries.
3. Run `ruby tools/validate-catalog.rb`.
4. Check one movie detail modal on mobile and desktop.

## Why Some Movies Show Nothing

For now, all experience tags are hidden in the UI even when a movie has an
`exp` array. This keeps the movie details cleaner during MVP validation and
avoids implying that movies without tags are unavailable in premium formats.
