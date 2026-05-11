/* global React */
const { useState, useEffect, useRef, useMemo } = window.React;

// ---------- iOS-safe body scroll lock ----------
// Used by every modal / bottom sheet (movie, calendar picker, filter sheet,
// notify capture, rating sheet). `overflow: hidden` alone doesn't stop iOS
// Safari touch scrolling — the page behind a modal still scrolls when you
// swipe. The fix is to pin the body in place with position: fixed and
// restore the scroll position on unmount. Returns an unlock function that
// React's useEffect cleanup can call directly.
window.lockBodyScroll = function lockBodyScroll() {
  const scrollY = window.scrollY;
  const body = document.body;
  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
  body.style.overflow = 'hidden';
  return () => {
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.overflow = '';
    window.scrollTo(0, scrollY);
  };
};

// ---------- TMDB client ----------
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmZWUyZTJjZGJmNzI3YmI2ZjJkMGVhNTMxMWNmNzA2MyIsIm5iZiI6MTc3NjU4NTc4NC4xMDUsInN1YiI6IjY5ZTQ4YzM4NmFjOTI4NDhjZDdhMDgxMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.pVMfFCwClkgrSvqv2Y_ppzwFy9Wu33XVhvlhgJddeTA';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BG_BASE  = 'https://image.tmdb.org/t/p/w1280';

// Cache versioning + TTLs.
// Bump CACHE_VERSION on deploy to force-refresh ALL TMDB caches at once
// (e.g. when posters change across the board, or when TMDB structure shifts).
// Each entry also has its own TTL so caches roll over automatically without
// requiring a deploy.
const CACHE_VERSION = 12; // bumped: pinned tmdbId for مسألة حياة أو موت → 1418982
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

async function tmdbFetchMovieDetails(tmdbId) {
  const [enResult, arResult] = await Promise.allSettled([
    tmdbApi(`/movie/${tmdbId}`, 'en-US'),
    tmdbApi(`/movie/${tmdbId}`, 'ar-SA'),
  ]);
  const en = enResult.status === 'fulfilled' ? enResult.value : null;
  const ar = arResult.status === 'fulfilled' ? arResult.value : null;
  const base = en || ar;
  if (!base) return null;

  return {
    poster:   base.poster_path ? `${TMDB_IMG_BASE}${base.poster_path}` : null,
    backdrop: base.backdrop_path ? `${TMDB_BG_BASE}${base.backdrop_path}` : null,
    tmdbId,
    title:    base.title || base.original_title || '',
    overviewEn: en?.overview || null,
    overviewAr: ar?.overview || null,
    releaseDate: base.release_date || null,
    // TMDB returns runtime in minutes for released films. Surfaced so the
    // modal can show "96 دقيقة" without us hardcoding it per movie.
    runtime: Number.isFinite(base.runtime) && base.runtime > 0 ? base.runtime : null,
  };
}

function tmdbNormTitle(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/,\s*the$/, '')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .trim();
}

function tmdbSearchCandidates(movie) {
  const values = [
    movie.en,
    movie.ar,
    ...(movie.aliases || []),
  ].filter(Boolean);
  return [...new Set(values.map(v => v.toString().trim()).filter(Boolean))];
}

function tmdbScoreHit(hit, query, year) {
  const title = tmdbNormTitle(hit.title || hit.name);
  const original = tmdbNormTitle(hit.original_title || hit.original_name);
  const q = tmdbNormTitle(query);
  const hitYear = Number((hit.release_date || '').slice(0, 4));
  let score = 0;

  if (hit.poster_path) score += 100;
  if (hit.backdrop_path) score += 10;
  if (title === q || original === q) score += 55;
  else if (title.includes(q) || q.includes(title) || original.includes(q) || q.includes(original)) score += 25;
  if (hitYear && hitYear === year) score += 20;
  else if (hitYear && Math.abs(hitYear - year) === 1) score += 8;
  score += Math.min(Number(hit.popularity || 0), 20);

  return score;
}

async function tmdbSearchBest(movie) {
  const movieFromYear = new Date(movie.date).getFullYear();
  const candidates = tmdbSearchCandidates(movie);
  const hits = [];

  for (const query of candidates) {
    const q = encodeURIComponent(query);
    const paths = [
      `/search/movie?query=${q}&year=${movieFromYear}&include_adult=false`,
      `/search/movie?query=${q}&primary_release_year=${movieFromYear}&include_adult=false`,
      `/search/movie?query=${q}&include_adult=false`,
    ];

    for (const path of paths) {
      try {
        const data = await tmdbApi(path, movie.language === 'ar' ? 'ar-SA' : 'en-US');
        (data.results || []).slice(0, 8).forEach(hit => {
          hits.push({ hit, query, score: tmdbScoreHit(hit, query, movieFromYear) });
        });
      } catch {}
    }
  }

  const best = hits
    .filter(x => x.hit?.poster_path)
    .sort((a, b) => b.score - a.score)[0]
    || hits.sort((a, b) => b.score - a.score)[0];

  return best?.hit || null;
}

function applyLocalMedia(movie, data) {
  if (!movie?.localPoster && !movie?.localBackdrop) return data;
  const out = data || {};
  return {
    ...out,
    poster: out.poster || movie.localPoster || null,
    backdrop: out.backdrop || movie.localBackdrop || movie.localPoster || null,
  };
}

// ---------- Posters + backdrops ----------
async function tmdbFetch(movie) {
  const cacheKey = `tmdb-poster-${movie.en}`;
  const cached = readCache(cacheKey, TTL_POSTER_DAYS);
  if (cached) return applyLocalMedia(movie, cached);

  const movieFromYear = new Date(movie.date).getFullYear();

  try {
    // Direct fetch by tmdbId
    if (movie.tmdbId) {
      const out = await tmdbFetchMovieDetails(movie.tmdbId);
      if (out) {
        const merged = applyLocalMedia(movie, out);
        writeCache(cacheKey, merged);
        return merged;
      }
    }

    // Search TMDB using English title, Arabic title, and aliases.
    // This matters for Saudi/Egyptian releases because TMDB often indexes
    // them under Arabic script or a different transliteration.
    const hit = await tmdbSearchBest(movie);

    if (!hit) {
      // Cache the negative result briefly (1 day) so we don't hammer TMDB
      const missing = applyLocalMedia(movie, { poster: null, backdrop: null, tmdbId: null, missing: true });
      writeCache(cacheKey, missing);
      return missing.poster || missing.backdrop ? missing : null;
    }

    const details = await tmdbFetchMovieDetails(hit.id);
    const out = details || {
      poster:   hit.poster_path ? `${TMDB_IMG_BASE}${hit.poster_path}` : null,
      backdrop: hit.backdrop_path ? `${TMDB_BG_BASE}${hit.backdrop_path}` : null,
      tmdbId:   hit.id,
      title:    hit.title || hit.original_title || movie.en,
      overviewEn: hit.overview || null,
      overviewAr: null,
      releaseDate: hit.release_date || null,
    };
    const merged = applyLocalMedia(movie, out);
    writeCache(cacheKey, merged);
    return merged;
  } catch {
    const fallback = applyLocalMedia(movie, { poster: null, backdrop: null, tmdbId: movie.tmdbId || null, missing: true });
    return fallback.poster || fallback.backdrop ? fallback : null;
  }
}

window.cinemapFetchMovieMedia = tmdbFetch;

function modalOverview(movie, posterData, lang) {
  if (lang === 'en') {
    return posterData?.overviewEn
      || movie.overviewEn
      || posterData?.overviewAr
      || movie.overview
      || 'The synopsis isn’t available yet — we’ll add it as soon as the studio shares more.';
  }

  return posterData?.overviewAr
    || movie.overview
    || 'قصة الفيلم غير متوفرة حالياً، بنحدثها أول ما تتوفر معلومات أوضح.';
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
  const fallbackCast = () => {
    if (!Array.isArray(movie.cast) || !movie.cast.length) return [];
    return movie.cast.map((name, index) => (
      typeof name === 'string'
        ? { id: `manual-${movie.en}-${index}`, name, character: '', photo: null }
        : { id: name.id || `manual-${movie.en}-${index}`, name: name.name, character: name.character || '', photo: name.photo || null }
    ));
  };
  if (!tmdbId) return fallbackCast();

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
    return cast.length ? cast : fallbackCast();
  } catch { return fallbackCast(); }
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
    // Faisal's call: when TMDB has no poster yet (most often a future
    // release that hasn't published key art), show a clean "قريبًا"
    // placeholder instead of the genre/title/date plate. The film's
    // name still appears in the card title outside this slot, so the
    // user knows which film they're looking at.
    const docLang = document.documentElement.getAttribute('lang') || 'ar';
    const label = docLang === 'en' ? 'Coming soon' : 'قريبًا';
    return (
      <div className={`poster-fallback poster-fallback-soon ${className}`} style={{ '--accent': g.color }}>
        <div className="poster-fallback-inner">
          <div className="poster-fallback-soon-icon">🎬</div>
          <div className="poster-fallback-soon-label">{label}</div>
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

function MovieRowBackdrop({ movie }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await tmdbFetch(movie);
      if (cancelled) return;
      setSrc(result?.backdrop || result?.poster || null);
    })();
    return () => { cancelled = true; };
  }, [movie.en]);

  if (!src) return null;
  return (
    <div className="cm-movie-art" aria-hidden="true">
      <img src={src} alt="" />
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
function MovieModal({ movie, lang, onClose, isWatched, onToggleWatched, onCalendar, rating, engagement }) {
  const [posterData, setPosterData] = useState(null);
  const [cast, setCast] = useState([]);
  const [ytKey, setYtKey] = useState(null);
  const [trailerVisible, setTrailerVisible] = useState(false);
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [posterZoom, setPosterZoom] = useState(false);
  const trailerRef = useRef(null);
  const t = window.MUVI_I18N?.[lang] || window.MUVI_I18N?.ar;
  const g = window.MUVI_GENRES[movie.genre];
  const days = window.daysUntil(movie.date);
  const past = days < 0;

  useEffect(() => {
    if (!movie) return;
    setPosterData(null); setCast([]); setYtKey(null);
    setTrailerVisible(false);
    setOverviewExpanded(false);
    tmdbFetch(movie).then(setPosterData);
    fetchCast(movie).then(setCast);
    fetchTrailerKey(movie).then(k => setYtKey(k || null));
  }, [movie.tmdbId, movie.en]);

  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return;
      if (posterZoom) setPosterZoom(false);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [posterZoom]);

  useEffect(() => window.lockBodyScroll(), []);

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
  const overview = modalOverview(movie, posterData, lang);
  const posterSrc = posterData?.poster || null;
  const backdropSrc = posterData?.backdrop || posterSrc;
  const backdropGradient = lang === 'ar'
    ? `linear-gradient(90deg, rgba(6,3,13,0.22) 0%, rgba(6,3,13,0.48) 36%, rgba(6,3,13,0.82) 72%, rgba(6,3,13,0.97) 100%), linear-gradient(180deg, rgba(6,3,13,0.18), rgba(6,3,13,0.94))`
    : `linear-gradient(90deg, rgba(6,3,13,0.97) 0%, rgba(6,3,13,0.82) 32%, rgba(6,3,13,0.48) 66%, rgba(6,3,13,0.22) 100%), linear-gradient(180deg, rgba(6,3,13,0.18), rgba(6,3,13,0.94))`;

  return (
    <div className="mmodal-overlay" onClick={onClose}>
      <div
        className="mmodal-box"
        onClick={e => e.stopPropagation()}
      >
        {/* Blurred backdrop background */}
        <div className="mmodal-bg">
          {backdropSrc && <img src={backdropSrc} className="mmodal-bg-img" alt="" />}
          <div className="mmodal-bg-grad" style={{ background: backdropGradient }} />
        </div>

        <button className="mmodal-close" onClick={onClose}>×</button>

        <div className="mmodal-inner">
          {/* Poster column */}
          <div className="mmodal-poster-col">
            <button
              type="button"
              className="mmodal-poster-button"
              onClick={e => { e.stopPropagation(); if (posterSrc) setPosterZoom(true); }}
              aria-label={lang === 'en' ? 'Open poster' : 'تكبير البوستر'}
            >
              {posterSrc
                ? <img src={posterSrc} alt={title} className="mmodal-poster-direct" />
                : <MoviePoster movie={movie} className="mmodal-poster-img" />
              }
            </button>
          </div>

          {/* Content column */}
          <div className="mmodal-content">
            {/* Badges row */}
            <div className="mmodal-badges">
              <GenrePill genre={movie.genre} lang={lang} />
              {(movie.exp || []).map(e => <ExpBadge key={e} exp={e} />)}
            </div>

            {/* Title + inline info row right beneath it. Hierarchy: title
                first, then the at-a-glance facts (date · runtime · age ·
                rating). Replaces the old 2×2 meta tile grid that used to
                live at the bottom and got overlooked. */}
            <div>
              <h2 className="mmodal-title">{title}</h2>
              {subTitle && subTitle !== title && (
                <div className="mmodal-en-title">{subTitle}</div>
              )}
              {(() => {
                const runtime = movie.runtime || posterData?.runtime || null;
                const items = [];
                items.push({ key: 'date', text: dateStr, empty: false });
                items.push({
                  key: 'runtime',
                  text: runtime ? `${runtime} ${t.min}` : '—',
                  empty: !runtime,
                });
                items.push({
                  key: 'age',
                  text: movie.rating || '—',
                  empty: !movie.rating,
                });
                if (rating && rating.rating > 0) {
                  items.push({
                    key: 'myrating',
                    text: <><span className="star">⭐</span><strong>{rating.rating}</strong>/5</>,
                    empty: false,
                  });
                } else if (!past) {
                  items.push({
                    key: 'countdown',
                    text: `${days} ${t.days}`,
                    empty: false,
                  });
                }
                return (
                  <div className="mmodal-info-row">
                    {items.map((it, i) => (
                      <React.Fragment key={it.key}>
                        {i > 0 && <span className="sep">·</span>}
                        <span className={`item ${it.empty ? 'is-empty' : ''}`}>{it.text}</span>
                      </React.Fragment>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Overview — clamped to 3 lines on mobile with a tap-to-expand
                toggle. Saves ~30-50px when the synopsis is long without
                losing the full text. */}
            {overview && (
              <div>
                <p className={`mmodal-overview ${overviewExpanded ? '' : 'is-clamped'}`}>{overview}</p>
                {overview.length > 140 && (
                  <button
                    type="button"
                    className="mmodal-overview-toggle"
                    onClick={(e) => { e.stopPropagation(); setOverviewExpanded(v => !v); }}
                  >
                    {overviewExpanded
                      ? (lang === 'en' ? 'Show less' : 'إخفاء')
                      : (lang === 'en' ? 'Read more' : 'اقرأ المزيد')}
                  </button>
                )}
              </div>
            )}

            {/* Audience signal — public engagement counts. Rendered as a
                quiet info row distinct from the user's "my rating" tile
                above, so the social signal reads as separate from personal
                state. Hidden when the movie has no engagement yet. */}
            {(() => {
              const engKey = movie.tmdbId
                ? `tmdb:${movie.tmdbId}`
                : `${movie.en}|${movie.date}`;
              const eng = engagement?.[engKey];
              if (!eng) return null;
              const saves = Number(eng.save_count) || 0;
              const ratings = Number(eng.rating_count) || 0;
              const avg = Number(eng.avg_rating) || 0;
              if (saves === 0 && ratings === 0) return null;
              return (
                <div className="mmodal-audience">
                  <span className="mmodal-audience-label">{t.audience_modal}</span>
                  <div className="mmodal-audience-row">
                    {saves > 0 && (
                      <span className="mmodal-audience-chip">👥 <strong>{saves}</strong> {t.audience_saves}</span>
                    )}
                    {ratings > 0 && avg > 0 && (
                      <span className="mmodal-audience-chip">⭐ <strong>{avg.toFixed(1)}</strong>/5 · {ratings} {t.audience_ratings}</span>
                    )}
                  </div>
                </div>
              );
            })()}

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
            <div>
              <div className="mmodal-cast-label">{t.cast}</div>
              {cast.length > 0 ? (
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
              ) : (
                // Future films often have no announced cast yet — show a soft
                // placeholder instead of leaving the section blank.
                <div className="mmodal-cast-placeholder">{t.cast_soon}</div>
              )}
            </div>

            {/* Meta tile grid removed — date / runtime / age / rating now
                live in the inline info row right under the title. */}
          </div>
        </div>

        {/* Sticky action footer — always visible at bottom of modal */}
        <div className="mmodal-footer">
          {ytKey ? (
            <button
              className={`mmodal-btn-trailer ${trailerVisible ? 'is-active' : ''}`}
              onClick={e => { e.stopPropagation(); setTrailerVisible(v => !v); }}
            >
              <span className="ltr">{trailerVisible ? '✕' : '▶'}</span>
              {trailerVisible ? t.hide_trailer : t.watch_trailer}
            </button>
          ) : (
            // Future films often have no trailer published yet. Show a
            // disabled placeholder so the user knows we're not hiding it.
            <button className="mmodal-btn-trailer is-soon" disabled>
              <span className="ltr">▶</span>
              {t.trailer_soon}
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

        {posterZoom && posterSrc && (
          <div className="poster-lightbox" onClick={e => { e.stopPropagation(); setPosterZoom(false); }}>
            <button className="poster-lightbox-close" onClick={e => { e.stopPropagation(); setPosterZoom(false); }}>×</button>
            <img src={posterSrc} alt={title} />
          </div>
        )}

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
  MovieRow, MonthPanel, MonthRail, MonthBar, GenrePill, ExpBadge, MoviePoster, MovieRowBackdrop, MovieModal,
  // expose calendar export so the row + featured card can call it directly
  downloadIcal, googleCalUrl, outlookCalUrl,
  // keep backward compat
  TrailerModal: MovieModal,
});
