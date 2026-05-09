/* Cinemap — lightweight local-first event tracking */

const CINEMAP_ANALYTICS_VERSION = '2026-05-06';
const LS_DEVICE_ID = 'cinemap-device-id';
const LS_EVENTS = 'cinemap-events';
const LS_SESSION_ID = 'cinemap-session-id';
const LS_SESSION_AT = 'cinemap-session-started-at';
const LS_SESSION_TRACKED = 'cinemap-session-tracked-id';

const SUPABASE_EVENT_TYPES = {
  page_view: 'page_view',
  session_start: 'session_start',
  movie_view: 'movie_open',
  watchlist_open: 'watchlist_open',
  my_list_open: 'my_list_open',
  search_used: 'search_used',
  search_no_results: 'search_no_results',
  filter_used: 'filter_used',
  filter_open: 'filter_open',
  filter_apply: 'filter_apply',
  homepage_cta_click: 'homepage_cta_click',
  movie_save: 'save_movie',
  movie_unsave: 'unsave_movie',
  notify_on: 'notify_interest',
  watched_on: 'watched_movie',
  rating_submitted: 'rating_submitted',
  movie_share: 'share_movie',
  watchlist_share_image: 'share_movie',
  // Share-funnel breakdown: image generated, then actually shared/downloaded,
  // and the conversion of an inbound visitor into their first save.
  share_card_generated: 'share_card_generated',
  share_card_downloaded: 'share_card_downloaded',
  inbound_to_first_save: 'inbound_to_first_save',
  calendar_picker_open: 'calendar_click',
};

function getDeviceId() {
  try {
    let id = localStorage.getItem(LS_DEVICE_ID);
    if (!id) {
      const rand = (crypto?.randomUUID && crypto.randomUUID()) || `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      id = `cm-${rand}`;
      localStorage.setItem(LS_DEVICE_ID, id);
    }
    return id;
  } catch {
    return 'cm-unavailable';
  }
}

function getSessionId() {
  try {
    const now = Date.now();
    const startedAt = Number(localStorage.getItem(LS_SESSION_AT) || 0);
    let id = localStorage.getItem(LS_SESSION_ID);
    if (id && startedAt && now - startedAt > 30 * 60 * 1000) id = '';
    if (!id) {
      const rand = (crypto?.randomUUID && crypto.randomUUID()) || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      id = `cms-${rand}`;
      localStorage.setItem(LS_SESSION_ID, id);
      localStorage.setItem(LS_SESSION_AT, String(now));
    }
    return id;
  } catch {
    return 'cms-unavailable';
  }
}

function getDeviceType() {
  try {
    const ua = navigator.userAgent || '';
    const touch = navigator.maxTouchPoints > 1;
    const shortSide = Math.min(window.screen?.width || 0, window.screen?.height || 0);
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (touch && shortSide >= 768)) return 'tablet';
    if (/Mobi|Android|iPhone|iPod/i.test(ua) || (touch && shortSide > 0 && shortSide < 768)) return 'mobile';
    return 'desktop';
  } catch {
    return 'unknown';
  }
}

function safeText(value, max = 80) {
  const text = (value || '').toString().trim().replace(/\s+/g, ' ');
  if (!text) return null;
  // Avoid storing contact details if someone types them into search by mistake.
  if (/@/.test(text) || /\+?\d[\d\s-]{6,}/.test(text)) return '[redacted]';
  return text.slice(0, max);
}

function readEvents() {
  try { return JSON.parse(localStorage.getItem(LS_EVENTS) || '[]') || []; }
  catch { return []; }
}

function writeEvents(events) {
  try {
    // Keep the local queue bounded. The backend wiring can export before pruning.
    localStorage.setItem(LS_EVENTS, JSON.stringify(events.slice(-500)));
  } catch {}
}

function moviePayload(movie) {
  if (!movie) return {};
  return {
    movieKey: `${movie.en}|${movie.date}`,
    movieId: movie.tmdbId ? `tmdb:${movie.tmdbId}` : `${movie.en}|${movie.date}`,
    movieTitleEn: movie.en,
    movieTitleAr: movie.ar,
    movieDate: movie.date,
    movieGenre: movie.genre,
    movieLanguage: movie.language,
    movieStatus: movie.status,
  };
}

function supabasePayload(event) {
  const eventType = SUPABASE_EVENT_TYPES[event.action];
  if (!eventType) return null;

  return {
    visitor_id: event.deviceId,
    session_id: event.sessionId || null,
    event_type: eventType,
    movie_id: event.movieId || event.movieKey || null,
    movie: event.movieTitleEn || null,
    movie_ar: event.movieTitleAr || null,
    release_date: event.movieDate || null,
    genre: event.movieGenre || null,
    selected_filter: safeText(event.selectedFilter || event.filter || event.mode || event.cta || null, 120),
    search_query: safeText(event.searchQuery || event.query || null),
    device_type: event.deviceType || null,
    city: null,
    rating: Number.isFinite(Number(event.rating)) ? Number(event.rating) : null,
    vibes: Array.isArray(event.vibes) ? event.vibes.join(',') : (event.vibes || null),
    reaction: event.reaction || null,
    language: event.lang || null,
    page_path: event.path || null,
  };
}

async function sendToSupabase(event) {
  const endpoint = window.CINEMAP_CONFIG?.supabaseEventsEndpoint;
  const key = window.CINEMAP_CONFIG?.supabasePublishableKey;
  const payload = supabasePayload(event);
  if (!endpoint || !key || !payload) return;

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Local analytics remains the fallback. We intentionally avoid surfacing
    // tracking failures to users.
  }
}

window.cinemapTrack = function cinemapTrack(action, payload = {}) {
  const sessionId = getSessionId();
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    version: CINEMAP_ANALYTICS_VERSION,
    deviceId: getDeviceId(),
    sessionId,
    deviceType: getDeviceType(),
    action,
    ts: new Date().toISOString(),
    path: `${location.pathname}${location.search}${location.hash}`,
    lang: document.documentElement.getAttribute('lang') || 'ar',
    dir: document.documentElement.getAttribute('dir') || 'rtl',
    ...payload,
  };

  const events = readEvents();
  events.push(event);
  writeEvents(events);
  sendToSupabase(event);

  return event;
};

function trackSessionStartOnce() {
  try {
    const sessionId = getSessionId();
    if (localStorage.getItem(LS_SESSION_TRACKED) === sessionId) return;
    localStorage.setItem(LS_SESSION_TRACKED, sessionId);
    window.cinemapTrack('session_start');
  } catch {
    window.cinemapTrack('session_start');
  }
}

trackSessionStartOnce();

window.cinemapTrackMovie = function cinemapTrackMovie(action, movie, payload = {}) {
  return window.cinemapTrack?.(action, { ...moviePayload(movie), ...payload });
};

window.cinemapReadEvents = readEvents;
window.cinemapClearEvents = function cinemapClearEvents() {
  try { localStorage.removeItem(LS_EVENTS); } catch {}
};
