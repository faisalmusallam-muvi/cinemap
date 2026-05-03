/* Cinemap — lightweight local-first event tracking */

const CINEMAP_ANALYTICS_VERSION = '2026-05-02';
const LS_DEVICE_ID = 'cinemap-device-id';
const LS_EVENTS = 'cinemap-events';

const SUPABASE_EVENT_TYPES = {
  movie_save: 'save_movie',
  movie_unsave: 'unsave_movie',
  notify_on: 'notify_interest',
  watched_on: 'watched_movie',
  rating_submitted: 'rating_submitted',
  movie_share: 'share_movie',
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
    event_type: eventType,
    movie: event.movieTitleEn || null,
    movie_ar: event.movieTitleAr || null,
    release_date: event.movieDate || null,
    genre: event.movieGenre || null,
    city: event.city || null,
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
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    version: CINEMAP_ANALYTICS_VERSION,
    deviceId: getDeviceId(),
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

window.cinemapTrackMovie = function cinemapTrackMovie(action, movie, payload = {}) {
  return window.cinemapTrack?.(action, { ...moviePayload(movie), ...payload });
};

window.cinemapReadEvents = readEvents;
window.cinemapClearEvents = function cinemapClearEvents() {
  try { localStorage.removeItem(LS_EVENTS); } catch {}
};
