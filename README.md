# Cinemap — Movie Night Companion

Cinemap is your smart, social, cinematic movie discovery platform. The site you're looking at is **Journey 0**: a bilingual (Arabic / English) discovery calendar that lets users explore upcoming movies, save them to a personal watchlist, and ask to be notified when tickets open.

## What this is

A static, single-page React site — no build step, no bundler. It works directly out of the `/docs` folder and is built to be served by GitHub Pages.

- **Framework:** React 18 + Babel-in-the-browser (loaded from `assets/vendor/`)
- **Styling:** Hand-written CSS with the Cinemap palette (midnight, charcoal, cream, amber, gold, coral, teal)
- **Fonts:** Outfit (English) + IBM Plex Sans Arabic (Arabic), with local Tajawal as fallback
- **Data:** 60+ 2026 movie releases (in `assets/src/utils.js`)
- **TMDB:** posters, trailers, and cast pulled at runtime from TMDB
- **Bilingual:** AR/EN with full RTL/LTR support and `localStorage` preference

## Run locally

```bash
node server.js
# then visit http://localhost:8765
```

The dev server is a tiny Node http server (`server.js`) that serves `/docs` on port 8765.

## Deploy to GitHub Pages

This site is configured to be served from the `/docs` folder of the `main` branch.

1. Create a new repo on GitHub (e.g. `cinemap`)
2. Push this directory there:
   ```bash
   git init
   git add .
   git commit -m "Cinemap — Journey 0 launch"
   git branch -M main
   git remote add origin https://github.com/<your-user>/<repo-name>.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `/docs`**
4. Visit `https://<your-user>.github.io/<repo-name>/`

A `.nojekyll` file is included in `/docs` so GitHub Pages serves static files as-is without Jekyll processing.

## Project layout

```
docs/
├── index.html              # Single-page entry, all CSS inline
├── .nojekyll               # tells GitHub Pages to skip Jekyll
└── assets/
    ├── cinemap-white.svg   # logo
    ├── fonts/              # local Tajawal Arabic fonts
    ├── vendor/             # React + Babel UMD builds
    └── src/
        ├── utils.js        # movie data + i18n + taxonomies + helpers
        ├── tmdb-client.js  # TMDB poster/trailer/cast + MovieModal
        ├── ui.js           # Logo, Nav, Hero, Marquee
        ├── calendar.js     # FilterBar, MonthBar, MonthPanel, MovieRow
        ├── sections.js     # Journey 0, Watchlist, Signals, Roadmap, Final CTA, Footer, Toaster
        └── app.js          # App orchestration + state + handlers
server.js                   # tiny static dev server
```

## License

Movies, posters, and trailer data are pulled from TMDB (https://www.themoviedb.org). Cinemap is not affiliated with TMDB.
