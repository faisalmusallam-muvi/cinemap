/* global React */
const { useState, useEffect, useRef } = window.React;

// Penguin mark, inlined so it can be recolored via CSS `color`.
// Path data lifted from assets/cinemap-mark.svg (5 paths, viewBox 780 430 510 830).
function CinemapMark({ size = 28, color = 'var(--amber)', className = '' }) {
  return (
    <svg
      className={`cinemap-mark ${className}`}
      width={size}
      height={size}
      viewBox="780 430 510 830"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ display: 'block', color }}
    >
      <g fill="currentColor">
        <path d="M 1032.68 441.448 C 1036.58 441.249 1041.8 441.636 1045.73 441.918 C 1085.27 444.698 1122.38 462.025 1149.89 490.555 C 1158.48 499.304 1167.81 511.298 1176.03 520.832 C 1204.34 522.23 1240.65 525.882 1264.14 542.976 C 1270.41 547.539 1277.78 554.118 1279.03 562.101 C 1276.23 569.677 1266.37 568.861 1259.02 571.68 C 1220.23 586.55 1179.76 598.898 1174.75 646.244 C 1170.09 690.339 1199.59 715.662 1218.01 752.114 C 1232.26 780.323 1243.45 811.114 1245.83 842.773 C 1254.22 966.459 1146.97 1102.55 1072.23 1191.26 C 1058.13 1208.74 1039.5 1229.38 1024.25 1245.72 C 951.649 1161.71 878.674 1081.63 832.38 978.536 C 816.414 942.982 803.65 906.499 802.239 867.074 C 800.762 825.805 813.858 780.673 835.14 745.457 C 844.307 729.329 856.452 713.568 861.064 695.3 C 869.202 663.065 862.856 627.784 864.984 594.884 C 867.299 557.233 882.591 521.549 908.258 493.905 C 941.269 458.482 985.251 443.123 1032.68 441.448 z M 885.713 696.003 C 881.112 709.374 876.954 717.191 870.035 729.592 L 983.359 983.289 C 995.175 1009.68 1014.94 1049.94 1024.36 1075.78 C 1035.84 1046.19 1050.26 1018.64 1062.79 989.72 C 1100.54 902.614 1142.25 815.483 1179.14 728.108 C 1150.06 681.236 1139.68 654.685 1166.74 603.44 C 1134.09 582.696 1140.35 584.551 1124.08 550.283 C 1110.9 522.532 1074.89 504.392 1043.67 509.353 C 973.506 517.88 949.273 594.878 976.657 652.228 C 987.857 675.683 1035.29 740.138 1026.89 762.875 C 1016.96 767.831 976.478 744.164 965.82 738.666 C 938.999 724.833 912.598 709.802 885.713 696.003 z M 1179.36 587.474 C 1189.86 579.957 1195.85 575.604 1207.44 569.855 C 1219.32 565.166 1235.26 560.44 1245.73 555.889 C 1223.56 545.895 1198.21 542.336 1174.05 540.703 C 1168.59 548.903 1157.38 563.193 1153.25 570.284 C 1162.38 577.401 1169 582.12 1179.36 587.474 z" />
        <path d="M 950.369 760.612 C 963.188 761.527 994.771 780.616 1007.81 787.899 C 1021.46 780.158 1026.75 781.116 1040.49 787.561 C 1050.42 782.102 1083.53 763.99 1092.46 761.915 C 1111.9 757.395 1107.13 834.823 1099.34 845.659 C 1094.17 847.967 1091.78 847.934 1086.54 845.684 C 1071.59 839.265 1056.14 830.736 1042.27 822.356 C 1028.81 829.519 1020.11 830.713 1006.98 821.881 C 995.905 828.432 959.641 851.703 951.193 846.658 C 936.269 837.745 943.705 773.931 950.369 760.612 z" />
        <path d="M 1071.86 551.714 C 1077.78 550.451 1083.95 551.872 1088.72 555.596 C 1093.49 559.32 1096.36 564.964 1096.56 571.009 C 1096.9 580.9 1090.11 589.612 1080.43 591.693 C 1069.39 594.068 1058.51 587.036 1056.14 575.991 C 1053.78 564.946 1060.82 554.074 1071.86 551.714 z" />
        <path d="M 1022.47 939.013 C 1029.92 938.079 1036.75 943.283 1037.82 950.716 C 1038.89 958.149 1033.82 965.074 1026.41 966.287 C 1021.49 967.092 1016.52 965.178 1013.41 961.281 C 1010.3 957.384 1009.54 952.112 1011.42 947.494 C 1013.29 942.876 1017.52 939.633 1022.47 939.013 z" />
        <path d="M 1023.1 874.059 C 1028.54 875.603 1033.58 877.608 1036.19 883.03 C 1037.81 886.372 1037.88 890.258 1036.37 893.651 C 1033.85 899.347 1029.81 901.252 1024.43 903.503 C 1007.18 897.665 1005.67 880.115 1023.1 874.059 z" />
      </g>
    </svg>
  );
}

// ---------- Logo ----------
// `variant`:
//   "vertical"   — full brand SVG (mark stacked above "Cinemap" wordmark).
//                  Best for the hero and footer where there's room.
//   "horizontal" — amber mark + "Cinemap" wordmark in Outfit, mark always
//                  on the LEFT regardless of page direction (brand mark
//                  consistency). Best for nav chrome.
function CinemapLogo({ height = 32, variant = 'vertical' }) {
  if (variant === 'horizontal') {
    const markSize = Math.round(height * 0.95);
    return (
      <span className="cinemap-logo cinemap-logo-h">
        <CinemapMark size={markSize} color="var(--amber)" />
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
