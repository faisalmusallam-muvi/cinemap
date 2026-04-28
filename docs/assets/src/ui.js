/* global React */
const { useState, useEffect, useRef } = window.React;

// ---------- Logo ----------
// `variant`:
//   "vertical"   — full brand SVG (mark stacked above "Cinemap" wordmark).
//                  Best for the hero and footer where there's room.
//   "horizontal" — mark to the side + "Cinemap" rendered as Outfit text.
//                  Best for tight chrome like the nav bar where a vertical
//                  lockup makes the wordmark unreadable.
function CinemapLogo({ height = 32, variant = 'vertical' }) {
  if (variant === 'horizontal') {
    const markSize = Math.round(height * 0.95);
    return (
      <span
        className="cinemap-logo cinemap-logo-h"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
      >
        <img
          src="assets/cinemap-mark.svg"
          alt=""
          aria-hidden="true"
          style={{ height: `${markSize}px`, width: 'auto', display: 'block' }}
        />
        <span
          className="cinemap-wordmark"
          style={{
            fontFamily: "'Outfit', 'IBM Plex Sans Arabic', system-ui, sans-serif",
            fontWeight: 800,
            letterSpacing: '-0.02em',
            fontSize: Math.round(height * 0.78),
            color: 'var(--cream)',
            lineHeight: 1,
          }}
        >
          Cinemap
        </span>
      </span>
    );
  }

  return (
    <span className="cinemap-logo" style={{ display: 'inline-block' }}>
      <img
        src="assets/cinemap-logo.svg"
        alt="Cinemap"
        height={height}
        style={{ height: `${height}px`, width: 'auto', display: 'block' }}
      />
    </span>
  );
}

// ---------- Search ----------
function SearchBar({ lang, onOpenMovie }) {
  const t = window.CINEMAP_I18N[lang];
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Filter movies — match either Arabic or English title (case-insensitive)
  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const allMovies = window.CINEMAP_MOVIES;
    const scored = [];
    for (const m of allMovies) {
      const en = (m.en || '').toLowerCase();
      const ar = (m.ar || '');
      const enHit = en.includes(q);
      const arHit = ar.includes(query.trim());
      if (enHit || arHit) {
        // Score: starts-with > contains; then by date proximity
        let score = 0;
        if (en.startsWith(q)) score += 10;
        if (ar.startsWith(query.trim())) score += 10;
        if (enHit) score += 1;
        if (arHit) score += 1;
        scored.push({ m, score });
      }
    }
    scored.sort((a, b) => b.score - a.score || new Date(a.m.date) - new Date(b.m.date));
    return scored.slice(0, 8).map(x => x.m);
  }, [query]);

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); } };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Reset highlighted index when query changes
  useEffect(() => { setActive(0); }, [query]);

  const select = (m) => {
    onOpenMovie(m);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(matches.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(0, i - 1)); }
    else if (e.key === 'Enter')   { e.preventDefault(); if (matches[active]) select(matches[active]); }
  };

  return (
    <div className="cm-search" ref={containerRef}>
      <div className={`cm-search-input-wrap ${open ? 'is-open' : ''}`}>
        <span className="cm-search-icon" aria-hidden="true">🔍</span>
        <input
          ref={inputRef}
          type="search"
          className="cm-search-input"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t.search_ph}
          aria-label={t.search_open}
          autoComplete="off"
        />
        {query && (
          <button
            className="cm-search-clear"
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            aria-label="clear"
            type="button"
          >×</button>
        )}
      </div>

      {open && query && (
        <div className="cm-search-results" role="listbox">
          {matches.length === 0 ? (
            <div className="cm-search-empty">{t.search_no_results}</div>
          ) : (
            matches.map((m, i) => {
              const g = window.CINEMAP_GENRES[m.genre];
              return (
                <button
                  key={m.en + m.date}
                  className={`cm-search-item ${i === active ? 'is-active' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => select(m)}
                  role="option"
                  aria-selected={i === active}
                >
                  <span className="cm-search-item-title">{window.movieTitle(m, lang)}</span>
                  <span className="cm-search-item-meta">
                    <span style={{ color: g?.color }}>{lang === 'en' ? (g?.en || m.genre) : (g?.ar || m.genre)}</span>
                    <span className="cm-search-item-date">· {window.fmtDate(m.date, lang)}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Nav ----------
function Nav({ lang, setLang, onJumpCalendar, onJumpWatchlist, onJumpHow, onJumpVision, onOpenMovie }) {
  const t = window.CINEMAP_I18N[lang];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const nav = document.querySelector('.cm-nav');
      if (!nav) return;
      if (window.scrollY > 8) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className="cm-nav">
      <div className="cm-nav-inner">
        <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <CinemapLogo height={28} variant="horizontal" />
        </a>

        <div className="cm-nav-links">
          <a href="#calendar" onClick={(e) => { e.preventDefault(); onJumpCalendar(); }}>{t.nav_movies}</a>
          <a href="#watchlist" onClick={(e) => { e.preventDefault(); onJumpWatchlist(); }}>{t.nav_watchlist}</a>
          <a href="#journey" onClick={(e) => { e.preventDefault(); onJumpHow(); }}>{t.nav_how}</a>
          <a href="#roadmap" onClick={(e) => { e.preventDefault(); onJumpVision(); }}>{t.nav_vision}</a>
        </div>

        <SearchBar lang={lang} onOpenMovie={onOpenMovie} />

        <div className="cm-nav-right">
          <button
            className="cm-lang"
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            title={lang === 'en' ? 'العربية' : 'English'}
          >
            <span className={lang === 'ar' ? 'is-on' : ''}>ع</span>
            <span className="cm-lang-sep">/</span>
            <span className={lang === 'en' ? 'is-on' : ''}>EN</span>
          </button>
          <button className="cm-btn cm-btn-primary cm-nav-cta" onClick={onJumpCalendar}>
            {t.nav_cta}
          </button>
          <button
            className={`cm-burger ${open ? 'is-open' : ''}`}
            onClick={() => setOpen(o => !o)}
            aria-label="menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {open && (
        <div className="cm-mobile-menu" onClick={(e) => e.stopPropagation()}>
          <div className="cm-mobile-search">
            <SearchBar
              lang={lang}
              onOpenMovie={(m) => { setOpen(false); onOpenMovie?.(m); }}
            />
          </div>
          <a href="#calendar" onClick={(e) => { e.preventDefault(); setOpen(false); onJumpCalendar(); }}>{t.nav_movies}</a>
          <a href="#watchlist" onClick={(e) => { e.preventDefault(); setOpen(false); onJumpWatchlist(); }}>{t.nav_watchlist}</a>
          <a href="#journey" onClick={(e) => { e.preventDefault(); setOpen(false); onJumpHow(); }}>{t.nav_how}</a>
          <a href="#roadmap" onClick={(e) => { e.preventDefault(); setOpen(false); onJumpVision(); }}>{t.nav_vision}</a>
        </div>
      )}
    </nav>
  );
}

// ---------- Hero ----------
function Hero({ lang, onJumpCalendar, onJumpWatchlist, watchlistCount, featured }) {
  const t = window.CINEMAP_I18N[lang];
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toString());
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toString());
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section className="cm-hero" ref={ref}>
      <div className="cm-hero-bg">
        <div className="cm-hero-glow cm-hero-glow-amber" />
        <div className="cm-hero-glow cm-hero-glow-coral" />
        <div className="cm-hero-glow cm-hero-glow-teal" />
        <div className="cm-hero-grain" />
      </div>

      <div className="cm-hero-inner cm-container">
        <div className="cm-hero-text">
          <div className="cm-hero-eyebrow">
            <span className="cm-hero-dot" />
            <span>{t.hero_eyebrow}</span>
          </div>

          <h1 className="cm-hero-title">{t.hero_title}</h1>
          <p className="cm-hero-sub">{t.hero_sub}</p>

          <div className="cm-hero-ctas">
            <button className="cm-btn cm-btn-primary cm-btn-lg" onClick={onJumpCalendar}>
              {t.hero_cta}
            </button>
            <button className="cm-btn cm-btn-ghost cm-btn-lg" onClick={onJumpWatchlist}>
              {t.hero_cta_2}
              {watchlistCount > 0 && <span className="cm-btn-count">{watchlistCount}</span>}
            </button>
          </div>

          <div className="cm-hero-pills">
            <span className="cm-pill">🎬 {t.hero_pill_films}</span>
            <span className="cm-pill">🗓 {t.hero_pill_year}</span>
            <span className="cm-pill">🇸🇦 {t.hero_pill_local}</span>
          </div>
        </div>

        <div className="cm-hero-stage" aria-hidden="true">
          <HeroStage lang={lang} featured={featured} />
        </div>
      </div>

      <Marquee lang={lang} />
    </section>
  );
}

// Hero floating cards + calendar preview + notify chip
function HeroStage({ lang, featured }) {
  const t = window.CINEMAP_I18N[lang];
  const cards = (featured || []).slice(0, 3);

  return (
    <div className="cm-stage">
      <div className="cm-stage-cal">
        <div className="cm-stage-cal-head">
          <span>{lang === 'en' ? 'JULY 2026' : 'يوليو 2026'}</span>
          <span className="cm-dot-amber" />
        </div>
        <div className="cm-stage-cal-grid">
          {Array.from({ length: 31 }).map((_, i) => (
            <span key={i} className={`cm-stage-cal-cell ${[16, 23, 30].includes(i) ? 'is-marked' : ''}`}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>

      {cards.map((m, i) => (
        <div key={m.en} className={`cm-stage-card cm-stage-card-${i + 1}`}>
          <CinePoster movie={m} compact />
          <div className="cm-stage-card-meta">
            <div className="cm-stage-card-title">{window.movieTitle(m, lang)}</div>
            <div className="cm-stage-card-date">{window.fmtDate(m.date, lang)}</div>
          </div>
        </div>
      ))}

      <div className="cm-stage-chip">
        <span className="cm-bell">🔔</span>
        <span>{t.hero_chip}</span>
      </div>
    </div>
  );
}

// ---------- Cine poster wrapper (uses TMDB MoviePoster from tmdb-client) ----------
function CinePoster({ movie, compact = false }) {
  // Reuse window.MoviePoster from tmdb-client.js
  const Poster = window.MoviePoster;
  if (Poster) return <Poster movie={movie} className={compact ? 'cm-poster-compact' : ''} />;
  return <div className="cm-poster-fallback" style={{ '--accent': window.CINEMAP_GENRES[movie.genre]?.color }}>{movie.en}</div>;
}

// ---------- Marquee ----------
function Marquee({ lang }) {
  const arItems = [
    "أفلام 2026", "60+ فيلم", "تقويم Cinemap", "إنتاج عربي", "احفظ قائمتك", "ذكّرني",
    "ليلة سينمائية أحلى", "Cinemap", "Movie Night Companion"
  ];
  const enItems = [
    "Movies of 2026", "60+ films", "Cinemap calendar", "Local stories", "Save your list", "Notify me",
    "Better movie nights", "Cinemap", "رفيقك السينمائي"
  ];
  const items = lang === 'en' ? enItems : arItems;
  const all = [...items, ...items, ...items];
  return (
    <div className="cm-marquee">
      <div className="cm-marquee-track">
        {all.map((txt, i) => (
          <span className="cm-marquee-item" key={i}>
            <span>{txt}</span>
            <span className="cm-marquee-dot" />
          </span>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { CinemapLogo, Nav, Hero, Marquee, CinePoster });
