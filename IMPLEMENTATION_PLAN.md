# Cinemap MVP Implementation Plan

This is the local working plan for turning Cinemap into a sharper public MVP while staying realistic about the 5,000 SAR budget.

Do not treat this as a big-company roadmap. The goal is to prove real Saudi audience usage first, then use that signal to earn money later.

## 1. North Star

Cinemap should become the Saudi movie companion and audience signal layer.

For users:
- discover upcoming movies
- save what they care about
- mark what they watched
- rate with Saudi-style context
- understand their own movie year
- share their movie taste

For the business:
- collect pre-release intent
- collect post-release sentiment
- turn anonymized audience behavior into Saudi movie demand reports

The moat is not the catalog. The moat is Saudi audience signal: saves, watched marks, ratings, vibes, reminders, and shares.

## 2. Positioning

Arabic brand display:
`سينماب`

English brand/domain:
`Cinemap`

Main brand line:
`أفلام عليها كلام`

Supporting line:
`اكتشف الجاي، احفظ قائمتك، وقيّم اللي شفته.`

Product question used inside the experience:
`وش يستاهل السينما؟`

Use this distinction:
- `أفلام عليها كلام` = brand/campaign line
- `وش يستاهل السينما؟` = utility/product question
- `يستاهل الشاشة الكبيرة` = rating/vibe language

## 3. Current Stage

Do not call the current product a prototype.

Call it:
`Live MVP` or `Proof-of-concept MVP`

Current live MVP includes:
- bilingual Arabic/English website
- 2026 movie calendar
- watchlist
- notify flow
- watched toggle
- rating/reaction sheet
- early score badge
- PWA support
- custom domain
- TMDB poster/trailer integration

The next job is not to look bigger. The next job is to become sharper, more measurable, and more shareable.

## 4. Revised Build Order

Build in this order:

1. Ticket 3: score/rating visibility
2. tracking and event capture
3. Ticket 4: My 2026 personal page
4. Ticket 5: share-as-image
5. distribution experiments
6. B2B demand-report proof

Why this order:
- Tracking must happen before growth experiments.
- My 2026 makes the share image more meaningful.
- Share-as-image is stronger when it shares identity, not just a poster grid.

## 5. Phase 1: Trust + Product Polish

Goal:
Make the live MVP credible enough for real Saudi users.

Scope:
- finalize Ticket 3 behavior
- refresh Arabic copy and brand language
- keep English usable but secondary
- tighten mobile layout
- fix known browser/console errors
- disable service worker during local QA
- add prominent TMDB attribution with TMDB notice and link
- add privacy and terms pages
- add clear consent language for notify/rating forms before any Formspree submission
- make Saudi/Arabic movie fallbacks look intentional

Acceptance:
- homepage reads naturally in Saudi Arabic
- released movies show watched/rating behavior cleanly
- users understand save, watched, notify, and rating quickly
- no console errors except expected Babel warning
- local preview always shows current source
- privacy/terms/PDPL basics are present

Definition of done for launch:
- Phase 1 and Phase 2 are shipped
- privacy and terms pages are live
- Arabic copy pass is complete
- 5 critical bugs = zero
- 30 people have tested it
- founder launch post is drafted
- 1 short demo video is ready
- 1 original `أفلام عليها كلام` content post is ready

After this point:
No new product features for 30 days except critical fixes. Distribution and observation take priority.

Estimated time:
3-5 focused days

Estimated cost:
1,200 SAR

## 6. Phase 1.5: First 1,000 Real Users

Goal:
Get from friends-and-family usage to real strangers.

This is the most important phase for the 5,000 SAR budget.

Owned founder-led channels:
- personal X/Twitter posts
- TikTok/Snap short demos
- WhatsApp circles
- Reddit/Discord/Telegram if relevant
- Saudi movie/lifestyle communities
- direct DMs to Saudi movie creators and reviewers

Earned channels:
- small startup/media mentions
- Saudi film accounts
- cinema reviewers
- university film clubs
- local creator reposts

Paid channel:
- boost only posts that already perform organically
- do not spend before testing copy and creative manually
- test one channel at a time before scaling
- start with small boosts, then double down only on posts that show saves or ratings, not just likes

Suggested campaign formats:
- `أفلام عليها كلام هذا الأسبوع`
- `وش يستاهل السينما؟`
- `قائمتي لأفلام 2026`
- `أكثر أفلام محفوظة عند جمهور سينماب`

Targets:
- 1,000 visits/week
- 100 saves/week
- 30 ratings/week
- 20 shares/week
- 10 direct user feedback messages/week

Estimated time:
2-4 weeks, running in parallel with product work

Estimated cost:
700 SAR

## 7. Phase 2: Tracking + Signal Layer

Goal:
Measure real behavior without forcing accounts.

Events to track:
- movie view
- save
- unsave
- watched on
- watched off
- rating submitted
- vibe selected
- notify requested
- trailer opened
- share clicked
- share image generated
- language preference

Payload basics:
- anonymous device id
- movie key
- action
- timestamp
- language
- source surface, such as row, modal, featured, watchlist
- optional city only if the user voluntarily provides it

Implementation options:
- start with Formspree if fastest
- move to Supabase when event volume or querying needs increase

Acceptance:
- every key action creates a structured event
- events are queryable/exportable
- no login required
- no sensitive data is sent unless the user explicitly provides it
- weekly review ritual exists: export Formspree/tracking data to Google Sheets every Sunday and review for 15 minutes

Estimated time:
2-4 days

Estimated cost:
900 SAR

## 8. Phase 3: My 2026

Goal:
Make Cinemap personal.

Section:
`قائمتي · My 2026`

Placement:
After Watchlist.

Scope:
- saved count
- watched count
- reminders count
- favorite genre
- average rating
- top vibe
- recently saved poster strip
- simple saves-per-month sparkline

Why it matters:
This creates identity. Users are more likely to return and share if Cinemap reflects them back.

Acceptance:
- useful even with only 2-3 saved movies
- feels like a personal movie-year dashboard
- sets up the share-as-image feature

Estimated time:
3-5 days

Estimated cost:
900 SAR

## 9. Phase 4: Share-as-Image

Goal:
Create a viral loop.

Button:
`شارك قائمتي كصورة`

Better version after My 2026:
`شارك سنة أفلامك`

Image should include:
- Cinemap / سينماب branding
- `أفلام عليها كلام`
- saved count
- watched count
- average rating if available
- top genre
- top vibe
- 6-poster grid or recent saves
- cinemap.me

Implementation:
- use html2canvas or a DOM-to-image library
- Web Share API on mobile
- download/copy fallback on desktop

Acceptance:
- image looks good in WhatsApp, X, Snapchat, and Instagram Stories
- one tap generates it
- tracking event fires when generated/shared

Estimated time:
3-5 days

Estimated cost:
800 SAR

## 10. Saudi/Arabic Movie Data

Do not treat this as the moat.

Treat it as product quality.

Scope:
- keep manual overrides for Saudi/Arabic films
- improve missing poster fallbacks
- add source links when available
- add a lightweight `submit missing movie` form later

Why:
TMDB is weak for Saudi/Arabic films, but building a full catalog operation too early is expensive.

Rule:
Fix visible gaps that hurt trust. Do not become a data-ops company.

Estimated cost:
covered inside Phase 1 unless a specific gap becomes painful

## 11. Legal + PDPL Basics

This belongs in Phase 1, not later.

Minimum requirements:
- privacy page
- terms page
- clear contact/removal email
- explain Formspree or any third-party processors
- explain what data is collected
- collect only what is needed
- make name optional
- city optional
- WhatsApp optional
- clear reminder consent
- ability to request deletion
- explicit consent checkbox before submitting reminder contact data
- explicit consent checkbox before sending ratings/reactions to Formspree
- data minimization: do not require name, city, or WhatsApp
- right-to-delete instructions visible in Privacy
- TMDB attribution and non-endorsement notice visible in Footer, Privacy, or About/Credits

Important:
When collecting email, name, city, WhatsApp, ratings, or reactions, Cinemap is collecting personal data. Saudi PDPL expectations should be treated seriously from the beginning.

Estimated cost:
500 SAR

## 12. Phase 5: B2B Demand Reports

Goal:
Prepare the future monetization story.

Focus only on B2B demand reports for now.

Do not focus yet on:
- ticketing affiliate
- sponsored placements
- consumer subscriptions
- ad network monetization

Potential paid product:
`Saudi Movie Demand Report`

Report contents:
- top saved upcoming movies
- top watched movies
- average audience rating
- vibe distribution
- city/language signals if voluntarily available
- pre-release intent vs post-release sentiment
- Saudi film performance signals

Potential buyers:
- distributors
- producers
- cinema chains
- agencies
- investors
- film festivals

Near-term proof:
Produce a free monthly sample report once enough data exists.

## 13. 5,000 SAR Budget

Recommended allocation:

- 3,000 SAR: distribution tests, creator posts, and boosting winners
- 800 SAR: Arabic editorial/movie takes by a Saudi film writer
- 500 SAR: social/share design assets
- 400 SAR: privacy/terms/PDPL templates or legal review starter
- 300 SAR: tooling buffer, such as analytics, Supabase, or email

Total:
5,000 SAR

Do not spend all upfront. Cash should buy what code cannot buy: attention, trust, distribution, and taste.

## 14. Kill Criteria

These are not pessimistic. They protect the budget.

After 30 days:
- if fewer than 100 saves total, the discovery/watchlist loop is weak
- if fewer than 20 users save more than one movie, the calendar is not compelling enough
- if fewer than 10 people give direct feedback, distribution quality is weak

Response:
- improve the hero and first-screen explanation
- publish 3 stronger founder-led content posts
- manually DM 30 target users and ask what confused them

After 60 days:
- if fewer than 50 ratings are submitted, the rating layer may not be compelling
- if fewer than 30 shares happen, the share loop needs rethinking
- if users save but do not return, prioritize reminders and My 2026

Response:
- if ratings are weak, add a one-line explainer to the sheet and re-measure for 2 weeks
- if shares are weak, wait for My 2026 before judging share-as-image
- if return usage is weak, add reminders and a weekly content habit before building more features

After 90 days:
- if there is no repeat usage, Cinemap may need to become content/community first
- if ratings are strong but saves are weak, focus on post-release audience opinion
- if saves are strong but ratings are weak, focus on planning/watchlist and delay score features

## 15. Not Now

Avoid for now:
- full login system
- native mobile app
- cinema booking integration
- complex recommendation engine
- big admin dashboard
- heavy paid ads
- paid consumer subscriptions
- full Saudi film database operation
- multiple monetization models at once

## 16. Immediate Next Work

Next local implementation sequence:

1. Finish Ticket 3 QA and copy polish.
2. Add TMDB attribution, privacy/terms pages, and consent copy.
3. Add lightweight event tracking.
4. Prepare founder-led distribution assets.
5. Build My 2026.
6. Build share-as-image from My 2026.

## 17. Founder Time Discipline

No more than two phases active at any moment.

Allowed overlap:
- Phase 1.5 distribution can run while Phase 2, 3, or 4 is being built.

Not allowed:
- building My 2026, share-as-image, tracking, legal pages, and creator campaigns all at the same time.

Rule:
Finish Phase 1 first. Then run distribution and tracking together. Only build the next feature after the previous feature has been observed in real usage.

## 18. Brand Rollout Tasks

Update every public surface to use the new language:
- hero: `أفلام عليها كلام`
- Arabic wordmark: `سينماب`
- social bios: `أفلام عليها كلام`
- footer and legal pages: `سينماب | Cinemap`
- founder posts: explain why Cinemap exists
- first content series: `أفلام عليها كلام هذا الأسبوع`
