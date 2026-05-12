# Cinemap Analytics Events

This document describes the current app-to-Supabase compatibility mapping and
the future 60-day MVP target vocabulary.

Do not rename live Supabase `event_type` values without updating existing
views/dashboards. The current code maps internal app action names to persisted
Supabase event names in `docs/assets/src/analytics.js`.

## Privacy Contract

- Supabase receives anonymous product signals only.
- Do not send names, emails, WhatsApp numbers, or other direct contact details
  to Supabase.
- Search text is sanitized by `safeText`; emails and phone-like strings are
  redacted.
- Notify contact details go to Formspree only.

## Current Compatibility Mapping

| App event name | Supabase `event_type` | When it fires | Important payload fields | 60-day MVP |
|---|---|---|---|---|
| `page_view` | `page_view` | App route/hash view changes. | `pageKind`, `page_path`, `device_type`, `language` | support |
| `session_start` | `session_start` | Once per local session. | `visitor_id`, `session_id`, `device_type`, `language` | support |
| `movie_view` | `movie_open` | Movie modal/deep link/search/card open. | `movie_id`, `movie`, `movie_ar`, `release_date`, `genre`, `source` | yes |
| `movie_save` | `save_movie` | User saves/adds movie to watchlist. | movie fields, `source` | yes |
| `movie_unsave` | `unsave_movie` | User removes movie from watchlist. | movie fields, `source` | yes |
| `watched_on` | `watched_movie` | User marks movie as watched. | movie fields, `source` | yes |
| `watched_off` | `unwatched_movie` | User unmarks watched. | movie fields, `source` | yes |
| `rating_submitted` | `rating_submitted` | User submits rating sheet. | movie fields, `rating`, `vibes`, `reaction`, `networkOk` | yes |
| `search_used` | `search_used` | Search query with at least 2 chars after debounce. | `search_query`, `queryLength`, `resultsCount` | yes |
| `search_no_results` | `search_no_results` | Search query returns zero matches. | `search_query`, `queryLength` | yes |
| `filter_used` | `filter_used` | User changes/reset filters. | `selected_filter`, `mode`, `activeCount` | yes |
| `filter_open` | `filter_open` | Filter sheet opens. | `activeCount`, `selected_filter` | support |
| `filter_apply` | `filter_apply` | Filter sheet apply. | `selected_filter`, `activeCount`, `resultsCount` | support |
| `notify_on` | `notify_interest` | User enables reminder. | movie fields, `source`, `city` when provided | support |
| `notify_off` | not currently persisted | User disables local reminder. | movie fields, `source` | later |
| `calendar_picker_open` | `calendar_click` | User opens calendar picker. | movie fields, `source` | support |
| `calendar_add` | not currently persisted | User chooses Google/Apple/Outlook calendar. | movie fields, `service` | later |
| `movie_share` | `share_movie` | User shares a movie link/text. | movie fields, `method` | support |
| `watchlist_share_image` | `share_movie` | User shares/downloads watchlist image. | `method`, `count` | support |
| `share_card_generated` | `share_card_generated` | Watchlist card image blob is created. | `count`, `personalityKey`, `topVibe` | support |
| `share_card_downloaded` | `share_card_downloaded` | Share/download completes. | `count`, `method`, `personalityKey`, `topVibe` | support |
| `inbound_to_first_save` | `inbound_to_first_save` | Inbound visitor saves first movie in session. | movie fields, `personalityKey` | yes |
| `watchlist_open` | `watchlist_open` | Watchlist route/jump. | `source` | support |
| `my_list_open` | `my_list_open` | My 2026 route. | `source` | support |
| `homepage_cta_click` | `homepage_cta_click` | Hero CTA click. | `cta` | support |

## MVP Target Vocabulary

These are the recommended clean names for the 60-day MVP analytics layer. Do
not implement a hard rename yet; migrate only with compatibility views or
dashboard updates.

| Target event | Current source | Migration note |
|---|---|---|
| `movie_viewed` | `movie_view` -> `movie_open` | Current persisted value is `movie_open`. |
| `movie_saved` | `movie_save` -> `save_movie` | Current views likely depend on `save_movie`. |
| `movie_unsaved` | `movie_unsave` -> `unsave_movie` | Keep old value until views migrate. |
| `movie_marked_watched` | `watched_on` -> `watched_movie` | Current persisted value is `watched_movie`. |
| `movie_unmarked_watched` | `watched_off` -> `unwatched_movie` | Added in Phase 1 as compatibility mapping. |
| `movie_rated` | `rating_submitted` | Current persisted value is `rating_submitted`. |
| `movie_search` | `search_used` | Current persisted value is `search_used`. |
| `filter_used` | `filter_used` | Already aligned enough. |
| `worth_cinema_selected` | rating `vibes` contains `bigscreen` | Future explicit event; currently stored in `vibes`. |
| `wait_for_streaming_selected` | rating `vibes` contains `stream` | Future explicit event; currently stored in `vibes`. |

## Recommended Future Migration

1. Keep current event types during the 60-day validation unless dashboards need
   cleaner labels.
2. If renaming is needed, add a Supabase view that aliases old event names to
   target names instead of rewriting historical rows.
3. Only then update frontend event names.
4. Preserve anonymous payload fields: movie id/title/date/genre, source,
   rating, vibes, selected filter, search query, device type, language, page.

## Legacy Code Quarantine Plan

`docs/assets/src/tmdb-client.js` still defines old calendar globals:

- `MovieRow`
- `MonthPanel`
- `MonthBar`
- `MonthRail`

Current app rendering uses the active components in `docs/assets/src/calendar.js`
through `window.MonthBar` and `window.MonthPanel`. The old definitions are a
quarantine candidate, but should not be deleted until a separate cleanup:

1. Search all repo files for `window.MovieRow`, `window.MonthPanel`,
   `window.MonthBar`, `window.MonthRail`, and direct component usage.
2. Check static pages outside `docs/index.html`, including legacy standalone
   files, for those globals.
3. Remove only if no external page depends on them.
4. After removal, run a local preview smoke test: home, search, card click,
   movie modal, watchlist, filter sheet.
