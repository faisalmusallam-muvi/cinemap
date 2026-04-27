/* global React */
const { useState, useEffect, useRef } = window.React;

// ---------- Logo ----------
function CinemapLogo({ height = 32, monochrome = false }) {
  // Inline SVG: a map-pin with a film-strip eye, amber accent.
  // Uses currentColor so it inherits the surrounding text color.
  return (
    <span className="cinemap-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={height} height={height} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="cm-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFC857" />
            <stop offset="1" stopColor="#FF8A00" />
          </linearGradient>
        </defs>
        <path
          d="M24 4c-8.3 0-15 6.6-15 14.8C9 30.6 24 44 24 44s15-13.4 15-25.2C39 10.6 32.3 4 24 4z"
          fill={monochrome ? 'currentColor' : 'url(#cm-grad)'}
        />
        <circle cx="24" cy="18.5" r="6.5" fill="#0A1320" />
        {/* film perforations */}
        <rect x="20.2" y="14.2" width="1.4" height="1.4" rx="0.3" fill="#FFC857" />
        <rect x="26.4" y="14.2" width="1.4" height="1.4" rx="0.3" fill="#FFC857" />
        <rect x="20.2" y="22.4" width="1.4" height="1.4" rx="0.3" fill="#FFC857" />
        <rect x="26.4" y="22.4" width="1.4" height="1.4" rx="0.3" fill="#FFC857" />
        {/* play triangle */}
        <path d="M22.4 16.2 L27.2 18.7 L22.4 21.2 Z" fill="#FFC857" />
      </svg>
      <span className="cinemap-wordmark" style={{
        fontFamily: "'Outfit', 'IBM Plex Sans Arabic', system-ui, sans-serif",
        fontWeight: 700,
        letterSpacing: '-0.01em',
        fontSize: Math.round(height * 0.6),
        color: 'var(--cream)',
      }}>
        Cinemap
      </span>
    </span>
  );
}

// ---------- Nav ----------
function Nav({ lang, setLang, onJumpCalendar, onJumpWatchlist, onJumpHow, onJumpVision }) {
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
          <CinemapLogo height={36} />
        </a>

        <div className="cm-nav-links">
          <a href="#calendar" onClick={(e) => { e.preventDefault(); onJumpCalendar(); }}>{t.nav_movies}</a>
          <a href="#watchlist" onClick={(e) => { e.preventDefault(); onJumpWatchlist(); }}>{t.nav_watchlist}</a>
          <a href="#journey" onClick={(e) => { e.preventDefault(); onJumpHow(); }}>{t.nav_how}</a>
          <a href="#roadmap" onClick={(e) => { e.preventDefault(); onJumpVision(); }}>{t.nav_vision}</a>
        </div>

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
        <div className="cm-mobile-menu" onClick={() => setOpen(false)}>
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
