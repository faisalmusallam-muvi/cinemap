/* Cinemap — lightweight local-first event tracking */

const CINEMAP_ANALYTICS_VERSION = '2026-05-02';
const LS_DEVICE_ID = 'cinemap-device-id';
const LS_EVENTS = 'cinemap-events';

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

  return event;
};

window.cinemapTrackMovie = function cinemapTrackMovie(action, movie, payload = {}) {
  return window.cinemapTrack?.(action, { ...moviePayload(movie), ...payload });
};

window.cinemapReadEvents = readEvents;
window.cinemapClearEvents = function cinemapClearEvents() {
  try { localStorage.removeItem(LS_EVENTS); } catch {}
};
