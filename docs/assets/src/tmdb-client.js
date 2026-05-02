/* global React */
const { useState, useEffect, useRef, useMemo } = window.React;

// ---------- TMDB client ----------
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmZWUyZTJjZGJmNzI3YmI2ZjJkMGVhNTMxMWNmNzA2MyIsIm5iZiI6MTc3NjU4NTc4NC4xMDUsInN1YiI6IjY5ZTQ4YzM4NmFjOTI4NDhjZDdhMDgxMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.pVMfFCwClkgrSvqv2Y_ppzwFy9Wu33XVhvlhgJddeTA';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BG_BASE  = 'https://image.tmdb.org/t/p/w1280';

// Cache versioning + TTLs.
// Bump CACHE_VERSION on deploy to force-refresh ALL TMDB caches at once
// (e.g. when posters change across the board, or when TMDB structure shifts).
// Each entry also has its own TTL so caches roll over automatically without
// requiring a deploy.
const CACHE_VERSION = 3;
const TTL_POSTER_DAYS  = 7;   // posters change ~weekly as marketing rolls out
const TTL_TRAILER_DAYS = 3;   // trailers drop late, re-check more often
const TTL_CAST_DAYS    = 30;  // cast is stable once announced

const DAY = 24 * 60 * 60 * 1000;

function readCache(key, ttlDays) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    // Old (unversioned) entries: ignore so they re-fetch with the new schema.
    if (!entry || typeof entry !== 'object' || entry.v !== CACHE_VERSION) return null;
    const age = Date.now() - (entry.ts || 0);
    if (age > ttlDays * DAY) return null;
    return entry.data;
  } catch { return null; }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ v: CACHE_VERSION, ts: Date.now(), data }));
  } catch {}
}

// Optional: clean up stale entries from previous CACHE_VERSIONs to free quota.
(function pruneOldCaches() {
  try {
    const keep = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith('tmdb-')) {
        try {
          const v = JSON.parse(localStorage.getItem(k));
          if (!v || v.v !== CACHE_VERSION) keep.push(k);
        } catch { keep.push(k); }
      }
    }
    keep.forEach(k => localStorage.removeItem(k));
  } catch {}
})();

async function tmdbApi(path, lang = 'en-US') {
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(`https://api.themoviedb.org/3${path}${sep}language=${lang}`, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}`, 'Content-Type': 'application/json;charset=utf-8' }
  });
  if (!r.ok) throw new Error(`TMDB ${r.status}`);
  return r.json();
}

// ---------- Posters + backdrops ----------
async function tmdbFetch(movie) {
  const cacheKey = `tmdb-poster-${movie.en}`;
  const cached = readCache(cacheKey, TTL_POSTER_DAYS);
  if (cached) return cached;

  const movieFromYear = new Date(movie.date).getFullYear();

  try {
    // Direct fetch by tmdbId
    if (movie.tmdbId) {
      const d = await tmdbApi(`/movie/${movie.tmdbId}`);
      if (d?.poster_path) {
        const out = {
          poster:   `${TMDB_IMG_BASE}${d.poster_path}`,
          backdrop: d.backdrop_path ? `${TMDB_BG_BASE}${d.backdrop_path}` : null,
          tmdbId:   movie.tmdbId,
        };
        writeCache(cacheKey, out);
        return out;
      }
    }

    // Search by English title — try year-scoped first, then global
    const q = encodeURIComponent(movie.en);
    let hit = null;

    try {
      const d = await tmdbApi(`/search/movie?query=${q}&year=${movieFromYear}&include_adult=false`);
      hit = (d.results || []).find(x => x.poster_path);
    } catch {}

    if (!hit) {
      try {
        const d2 = await tmdbApi(`/search/movie?query=${q}&include_adult=false`);
        hit = (d2.results || []).find(x => x.poster_path);
      } catch {}
    }

    if (!hit) {
      // Cache the negative result briefly (1 day) so we don't hammer TMDB
      writeCache(cacheKey, { poster: null, backdrop: null, tmdbId: null, missing: true });
      return null;
    }

    const out = {
      poster:   `${TMDB_IMG_BASE}${hit.poster_path}`,
      backdrop: hit.backdrop_path ? `${TMDB_BG_BASE}${hit.backdrop_path}` : null,
      tmdbId:   hit.id,
    };
    writeCache(cacheKey, out);
    return out;
  } catch { return null; }
}

// Resolve a movie's tmdbId by looking it up via tmdbFetch. Returns the id or null.
async function resolveTmdbId(movie) {
  if (movie.tmdbId) return movie.tmdbId;
  const data = await tmdbFetch(movie);
  return data?.tmdbId || null;
}

// ---------- Trailer key ----------
async function fetchTrailerKey(movie) {
  // Resolve tmdbId via title search if we don't have one in data
  const tmdbId = await resolveTmdbId(movie);
  if (!tmdbId) return null;

  const cacheKey = `tmdb-trailer-${tmdbId}`;
  const cached = readCache(cacheKey, TTL_TRAILER_DAYS);
  // Note: explicit empty-string represents "checked, none yet"
  if (cached !== null && cached !== undefined) return cached || null;

  try {
    const d = await tmdbApi(`/movie/${tmdbId}/videos`);
    const results = d.results || [];
    const trailer =
         results.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official)
      || results.find(v => v.site === 'YouTube' && v.type === 'Trailer')
      || results.find(v => v.site === 'YouTube' && v.type === 'Teaser')
      || results.find(v => v.site === 'YouTube');
    const key = trailer?.key || '';
    writeCache(cacheKey, key);
    return key || null;
  } catch { return null; }
}

// ---------- Cast fetch ----------
async function fetchCast(movie) {
  const tmdbId = await resolveTmdbId(movie);
  if (!tmdbId) return [];

  const cacheKey = `tmdb-cast-${tmdbId}`;
  const cached = readCache(cacheKey, TTL_CAST_DAYS);
  if (cached) return cached;

  try {
    const d = await tmdbApi(`/movie/${tmdbId}/credits`);
    const cast = (d.cast || []).slice(0, 8).map(a => ({
      id: a.id,
      name: a.name,
      character: a.character,
      photo: a.profile_path ? `https://image.tmdb.org/t/p/w185${a.profile_path}` : null,
    }));
    writeCache(cacheKey, cast);
    return cast;
  } catch { return []; }
}

// ---------- Background prefetch ----------
// On app boot, warm up the cache for the most visible movies (Featured Top 10
// + the first month). Posters appear instantly when the user scrolls instead
// of flashing skeletons. Runs after first paint so it doesn't block render.
function prefetchHotMovies() {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(_runPrefetch, { timeout: 4000 });
  } else {
    setTimeout(_runPrefetch, 1500);
  }
}

async function _runPrefetch() {
  try {
    const all = window.CINEMAP_MOVIES || [];
    const featured = all.filter(m => m.featuredRank).sort((a, b) => a.featuredRank - b.featuredRank);
    const firstMonth = all.filter(m => m.month === 0).sort((a, b) => new Date(a.date) - new Date(b.date));
    const seen = new Set();
    const targets = [...featured, ...firstMonth].filter(m => {
      const k = m.en + '|' + m.date;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    // Throttle: max 4 concurrent fetches
    const queue = targets.slice();
    const worker = async () => {
      while (queue.length) {
        const m = queue.shift();
        try { await tmdbFetch(m); } catch {}
        // For movies with a known tmdbId, also warm the trailer cache
        if (m.tmdbId) { try { await fetchTrailerKey(m); } catch {} }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  } catch {}
}

// Fire prefetch once per app load (after CINEMAP_MOVIES is on window)
if (typeof window !== 'undefined') {
  if (window.CINEMAP_MOVIES) {
    prefetchHotMovies();
  } else {
    window.addEventListener('load', () => prefetchHotMovies(), { once: true });
  }
}

window.cinemapPrefetch = prefetchHotMovies;

// ---------- Add to Calendar helpers ----------
function _calDate(iso) {
  return iso.replace(/-/g, '');
}
function googleCalUrl(movie, lang) {
  const start = _calDate(movie.date);
  const d = new Date(movie.date);
  d.setMinutes(d.getMinutes() + (movie.runtime || 120));
  const end = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const title = encodeURIComponent(lang === 'en' ? movie.en : movie.ar);
  const details = encodeURIComponent((movie.overview || '') + '\n\nCinemap');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=Cinemap`;
}
function outlookCalUrl(movie, lang) {
  const title = encodeURIComponent(lang === 'en' ? movie.en : movie.ar);
  const details = encodeURIComponent(movie.overview || '');
  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${movie.date}&enddt=${movie.date}&body=${details}&location=Cinemap`;
}
function downloadIcal(movie, lang) {
  const d = new Date(movie.date);
  const fmt = dt => `${dt.getFullYear()}${String(dt.getMonth()+1).padStart(2,'0')}${String(dt.getDate()).padStart(2,'0')}`;
  const end = new Date(d.getTime() + (movie.runtime || 120) * 60000);
  const title = lang === 'en' ? movie.en : movie.ar;
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Cinemap//Cinemap 2026//EN',
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${fmt(d)}`,
    `DTEND;VALUE=DATE:${fmt(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${(movie.overview || '').replace(/\n/g, '\\n')}`,
    'LOCATION:Cinemap',
    `UID:cinemap-${movie.tmdbId || movie.en.replace(/\s+/g,'-')}-${fmt(d)}@cinemap.com`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${(movie.en || movie.ar).replace(/[/:]/g,'')}.ics`; a.click();
  URL.revokeObjectURL(url);
}

// ---------- Poster component ----------
function MoviePoster({ movie, className = '' }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (movie.noPoster) { setError(true); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const result = await tmdbFetch(movie);
      if (cancelled) return;
      if (result?.poster) setSrc(result.poster);
      else setError(true);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [movie.en]);

  const g = window.MUVI_GENRES[movie.genre];
  if (!loading && (!src || error)) {
    return (
      <div className={`poster-fallback ${className}`} style={{ '--accent': g.color }}>
        <div className="poster-fallback-inner">
          <div className="poster-fallback-genre">{g.ar.toUpperCase()}</div>
          <div className="poster-fallback-title">{movie.ar}</div>
          <div className="poster-fallback-date ltr">{String(new Date(movie.date).getDate()).padStart(2,'0')} · 2026</div>
        </div>
      </div>
    );
  }
  return (
    <div className={`poster-wrap ${className}`}>
      {(loading || !src) && <div className="poster-skeleton" />}
      {src && <img src={src} alt={movie.en} className="poster-img" onError={() => setError(true)} />}
    </div>
  );
}

// ---------- Genre Pill ----------
function GenrePill({ genre, lang }) {
  const g = window.MUVI_GENRES[genre];
  if (!g) return null;
  const label = lang === 'en' ? g.en : g.ar;
  return (
    <span className="pill" style={{ color: g.color }}>
      <span className="dot" />
      <span style={{ color: 'var(--ink-0)' }}>{label}</span>
    </span>
  );
}

// ---------- Experience Badge ----------
function ExpBadge({ exp }) {
  const e = window.MUVI_EXPERIENCES?.[exp];
  if (!e) return null;
  return <span className="exp-badge" style={{ color: e.color }}>{e.en}</span>;
}

// ---------- Movie Modal (rich full-screen) ----------
function MovieModal({ movie, lang, onClose, isWatched, onToggleWatched, onCalendar, rating }) {
  const [posterData, setPosterData] = useState(null);
  const [cast, setCast] = useState([]);
  const [ytKey, setYtKey] = useState(null);
  const [trailerVisible, setTrailerVisible] = useState(false);
  const trailerRef = useRef(null);
  const t = window.MUVI_I18N?.[lang] || window.MUVI_I18N?.ar;
  const g = window.MUVI_GENRES[movie.genre];
  const days = window.daysUntil(movie.date);
  const past = days < 0;

  useEffect(() => {
    if (!movie) return;
    setPosterData(null); setCast([]); setYtKey(null);
    setTrailerVisible(false);
    tmdbFetch(movie).then(setPosterData);
    fetchCast(movie).then(setCast);
    fetchTrailerKey(movie).then(k => setYtKey(k || null));
  }, [movie.tmdbId, movie.en]);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);

  // Auto-scroll the inline trailer into view when the user opens it.
  // Without this the user clicks "Watch Trailer" and the iframe pops in
  // below the fold, so they hear sound but see nothing.
  useEffect(() => {
    if (!trailerVisible) return;
    const id = setTimeout(() => {
      trailerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    return () => clearTimeout(id);
  }, [trailerVisible]);

  const title = lang === 'en' ? movie.en : movie.ar;
  const subTitle = lang === 'en' ? movie.ar : movie.en;
  const dateStr = window.fmtDate ? window.fmtDate(movie.date, lang) : window.fmtDateAr(movie.date);

  return (
    <div className="mmodal-overlay" onClick={onClose}>
      <div
        className="mmodal-box"
        onClick={e => e.stopPropagation()}
      >
        {/* Blurred backdrop background */}
        <div className="mmodal-bg">
          {posterData?.backdrop && <img src={posterData.backdrop} className="mmodal-bg-img" alt="" />}
          <div className="mmodal-bg-grad" style={{ background: `linear-gradient(135deg, rgba(6,3,13,0.97) 0%, rgba(6,3,13,0.65) 45%, ${g.color}22 100%), rgba(6,3,13,0.92)` }} />
        </div>

        <button className="mmodal-close" onClick={onClose}>×</button>

        <div className="mmodal-inner">
          {/* Poster column */}
          <div className="mmodal-poster-col">
            <MoviePoster movie={movie} className="mmodal-poster-img" />
          </div>

          {/* Content column */}
          <div className="mmodal-content">
            {/* Badges row */}
            <div className="mmodal-badges">
              <GenrePill genre={movie.genre} lang={lang} />
              {(movie.exp || []).map(e => <ExpBadge key={e} exp={e} />)}
            </div>

            {/* Title */}
            <div>
              <h2 className="mmodal-title">{title}</h2>
              {subTitle && subTitle !== title && (
                <div className="mmodal-en-title">{subTitle}</div>
              )}
            </div>

            {/* Overview */}
            {movie.overview && <p className="mmodal-overview">{movie.overview}</p>}

            {/* Inline trailer — appears between synopsis and cast when active */}
            {trailerVisible && ytKey && (
              <div className="mmodal-trailer mmodal-trailer-inline" ref={trailerRef}>
                <iframe
                  src={`https://www.youtube.com/embed/${ytKey}?autoplay=1&rel=0`}
                  allow="autoplay; fullscreen; encrypted-media"
                  allowFullScreen
                />
              </div>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <div>
                <div className="mmodal-cast-label">{t.cast}</div>
                <div className="mmodal-cast-scroll">
                  {cast.map(c => (
                    <div key={c.id} className="mmodal-cast-person">
                      <div className="mmodal-cast-photo">
                        {c.photo
                          ? <img src={c.photo} alt={c.name} />
                          : <span style={{ fontSize: 20 }}>👤</span>
                        }
                      </div>
                      <div className="mmodal-cast-name">{c.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meta grid */}
            <div className="mmodal-meta">
              <div className="mmodal-meta-item">
                <span className="mmodal-meta-lbl">{t.release_date}</span>
                <span className="mmodal-meta-val">{dateStr}</span>
              </div>
              {movie.runtime && (
                <div className="mmodal-meta-item">
                  <span className="mmodal-meta-lbl">{t.duration}</span>
                  <span className="mmodal-meta-val">{movie.runtime} {t.min}</span>
                </div>
              )}
              {movie.rating && (
                <div className="mmodal-meta-item">
                  <span className="mmodal-meta-lbl">{t.age_rating}</span>
                  <span className="mmodal-meta-val">{movie.rating}</span>
                </div>
              )}
              {rating && rating.rating > 0 ? (
                // User has rated this movie — show their rating instead of the countdown
                <div className="mmodal-meta-item mmodal-meta-rating">
                  <span className="mmodal-meta-lbl">{t.score_modal_lbl}</span>
                  <span className="mmodal-meta-val">
                    <span className="cm-score-star">⭐</span>{' '}
                    <strong>{rating.rating}</strong>
                    <span style={{ color: 'var(--ink-2)' }}>/5</span>
                  </span>
                </div>
              ) : (
                <div className="mmodal-meta-item">
                  <span className="mmodal-meta-lbl">{t.countdown}</span>
                  <span className="mmodal-meta-val" style={past ? { color: 'var(--ink-3)' } : null}>
                    {past ? t.released : <><strong>{days}</strong> {t.days}</>}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky action footer — always visible at bottom of modal */}
        <div className="mmodal-footer">
          {ytKey && (
            <button
              className={`mmodal-btn-trailer ${trailerVisible ? 'is-active' : ''}`}
              onClick={e => { e.stopPropagation(); setTrailerVisible(v => !v); }}
            >
              <span className="ltr">{trailerVisible ? '✕' : '▶'}</span>
              {trailerVisible ? t.hide_trailer : t.watch_trailer}
            </button>
          )}

          {past && onToggleWatched ? (
            // Released movies: "Add to Calendar" makes no sense — show "Mark as Watched" instead
            <button
              className={`mmodal-btn-watched ${isWatched ? 'is-on' : ''}`}
              onClick={e => { e.stopPropagation(); onToggleWatched(movie); }}
            >
              <span className="ltr">{isWatched ? '✓' : '⭐'}</span>
              {t.watched}
            </button>
          ) : (
            // Future movies: open the shared CalendarPicker bottom sheet
            // (anchored to body, never clipped by the sticky footer).
            <button
              className="mmodal-btn-cal"
              onClick={e => { e.stopPropagation(); onCalendar?.(movie); }}
            >
              <span>📅</span>
              {t.add_calendar}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ---------- Movie Row (click to open modal) ----------
function MovieRow({ movie, reminded, onRemind, lang, onOpen }) {
  const g = window.MUVI_GENRES[movie.genre];
  const days = window.daysUntil(movie.date);
  const past = days < 0;
  const t = window.MUVI_I18N?.[lang] || window.MUVI_I18N?.ar;

  const title = lang === 'en' ? movie.en : movie.ar;
  const sub   = lang === 'en' ? movie.ar : movie.en;
  const dayNum = String(new Date(movie.date).getDate()).padStart(2, '0');

  return (
    <div className={`movie-row ${movie.pick ? 'is-pick' : ''}`} onClick={onOpen}>
      {movie.pick && <span className="pick-badge">Cinemap pick</span>}

      {/* Thumbnail — only visible on mobile via CSS */}
      <div className="movie-row-thumb">
        <MoviePoster movie={movie} />
      </div>

      {/* Row content — all layout controlled by CSS classes (no inline grid) */}
      <div className="movie-row-head">

        {/* Title block */}
        <div className="movie-title-block">
          <div className="movie-title-date">
            <span className="movie-day numeric ltr">{dayNum}</span>
            <span className="movie-title" dir="auto">{title}</span>
          </div>
          {sub && sub !== title && (
            <span className="movie-en-sub"
              style={{ paddingRight: lang === 'en' ? 0 : 58, paddingLeft: lang === 'en' ? 58 : 0 }}>
              {sub}
            </span>
          )}
          {/* Mobile-only second line: date · genre · exp badges */}
          <div className="movie-row-mobile-info">
            <span className="numeric ltr" style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
              {dayNum} · {lang === 'en'
                ? (window.MUVI_MONTHS_EN?.[movie.month] || '')
                : (window.MUVI_MONTHS_AR?.[movie.month] || '')}
            </span>
            <GenrePill genre={movie.genre} lang={lang} />
            {(movie.exp || []).slice(0, 2).map(e => <ExpBadge key={e} exp={e} />)}
          </div>
        </div>

        {/* Desktop meta: genre · countdown · bell · arrow
            (experience badges removed — shown in modal only) */}
        <div className="movie-row-meta">
          <GenrePill genre={movie.genre} lang={lang} />
          {!past && (
            <span className="movie-days-badge" style={{ color: g.color }}>
              <strong>{days}</strong>d
            </span>
          )}
          <button
            className={`reminder-btn-sm ${reminded ? 'is-on' : ''}`}
            onClick={e => { e.stopPropagation(); onRemind(); }}
            title={reminded ? t.reminded : t.remind}
          >
            {reminded ? '✓' : '🔔'}
          </button>
          <span className="movie-open-arrow">›</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Month Panel ----------
function MonthPanel({ index, movies, reminders, toggleReminder, lang, onOpenMovie }) {
  const monthMovies = movies.filter(m => m.month === index);
  const picks = monthMovies.filter(m => m.pick).length;
  const t = window.MUVI_I18N?.[lang] || window.MUVI_I18N?.ar;
  const monthAr = window.MUVI_MONTHS_AR[index];
  const monthEn = window.MUVI_MONTHS_EN[index];
  const monthName = lang === 'en'
    ? (window.MUVI_MONTHS_EN_FULL?.[index] || monthEn)
    : monthAr;

  return (
    <article className="month-panel" id={`month-${index}`}>
      <header className="month-head">
        <div className="month-num-block">
          <span className="month-num numeric ltr">{String(index + 1).padStart(2, '0')}</span>
          <span className="month-num-divider" />
          <span className="month-num-en numeric ltr">{monthEn}</span>
        </div>
        <h2 className="month-name display">{monthName}</h2>
        <div className="month-meta">
          <span className="month-count numeric ltr">{monthMovies.length}</span>
          <span className="month-count-label">{monthMovies.length === 1 ? t.film : t.films_pl}</span>
        </div>
      </header>

      <div className="month-body">
        {monthMovies.length === 0 ? (
          <div className="month-no-results">{t.no_results}</div>
        ) : (
          monthMovies.map((m, i) => {
            const id = `${m.month}-${i}`;
            return (
              <MovieRow
                key={id}
                movie={m}
                reminded={reminders.has(id)}
                onRemind={() => toggleReminder(id)}
                lang={lang}
                onOpen={() => onOpenMovie && onOpenMovie(m)}
              />
            );
          })
        )}
      </div>
    </article>
  );
}

// ---------- Month Bar (sticky horizontal — always visible) ----------
function MonthBar({ activeMonth, onJump, lang }) {
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeMonth]);

  return (
    <div className="month-bar">
      <div className="month-bar-scroll">
        {window.MUVI_MONTHS_AR.map((_, i) => {
          const name = lang === 'en'
            ? (window.MUVI_MONTHS_EN?.[i] || '')
            : (window.MUVI_MONTHS_AR?.[i] || '');
          const isActive = activeMonth === i;
          return (
            <button
              key={i}
              ref={isActive ? activeRef : null}
              className={`month-bar-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => onJump(i)}
            >
              <span className="month-bar-num numeric ltr">{String(i + 1).padStart(2, '0')}</span>
              <span className="month-bar-name">{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Month Rail (scroll-spy sidebar — desktop) ----------
function MonthRail({ activeMonth, onJump, lang }) {
  const months = lang === 'en'
    ? (window.MUVI_MONTHS_EN_FULL || window.MUVI_MONTHS_EN)
    : window.MUVI_MONTHS_AR;

  return (
    <div className="month-rail">
      <div className="rail-line" />
      {months.map((m, i) => (
        <button
          key={i}
          className={`rail-dot ${activeMonth === i ? 'is-active' : ''}`}
          onClick={() => onJump(i)}
        >
          <span className="rail-num numeric ltr">{String(i + 1).padStart(2, '0')}</span>
          <span className="rail-name">{lang === 'en' ? window.MUVI_MONTHS_EN[i] : m}</span>
        </button>
      ))}
    </div>
  );
}

Object.assign(window, {
  MovieRow, MonthPanel, MonthRail, MonthBar, GenrePill, ExpBadge, MoviePoster, MovieModal,
  // expose calendar export so the row + featured card can call it directly
  downloadIcal, googleCalUrl, outlookCalUrl,
  // keep backward compat
  TrailerModal: MovieModal,
});
