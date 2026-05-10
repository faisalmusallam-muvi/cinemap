/* global React, ReactDOM */
const { useState, useEffect, useMemo, useCallback, useRef } = window.React;

// ============================================================
// State helpers — localStorage persistence
// ============================================================
const LS = {
  lang: 'cinemap-lang',
  watchlist: 'cinemap-watchlist',
  notify: 'cinemap-notify',
  watched: 'cinemap-watched',
  trailer: 'cinemap-trailer-clicks',
};

const movieKey = (m) => m.en + '|' + m.date;

function loadSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); }
}
function saveSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch {}
}

// ============================================================
// App
// ============================================================
function App() {
  const movies = window.CINEMAP_MOVIES;

  // ---------- Language ----------
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem(LS.lang) || 'ar'; } catch { return 'ar'; }
  });
  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem(LS.lang, l); } catch {}
    document.documentElement.setAttribute('lang', l === 'en' ? 'en' : 'ar');
    document.documentElement.setAttribute('dir', l === 'en' ? 'ltr' : 'rtl');
    window.cinemapTrack?.('language_set', { selectedLang: l });
  }, []);
  useEffect(() => { setLang(lang); /* apply on mount */ /* eslint-disable-next-line */ }, []);

  // ---------- Watchlist + Notify + Watched + Ratings ----------
  const [watchlist, setWatchlist] = useState(() => loadSet(LS.watchlist));
  const [notified,  setNotified]  = useState(() => loadSet(LS.notify));
  const [watched,   setWatched]   = useState(() => loadSet(LS.watched));
  const [ratings,   setRatings]   = useState(() => (window.cinemapLoadRatings && window.cinemapLoadRatings()) || {});
  const [trailerClicks, setTrailerClicks] = useState(() => {
    try { return parseInt(localStorage.getItem(LS.trailer) || '0', 10) || 0; } catch { return 0; }
  });

  // ---------- Filters (multi-select Sets per dimension) ----------
  const emptyFilters = () => ({
    status: new Set(),
    genre: new Set(),
    language: new Set(),
    mood: new Set(),
    month: new Set(),
    picksOnly: false,
  });
  const [filters, setFilters] = useState(emptyFilters);
  const resetFilters = () => setFilters(emptyFilters());

  // ---------- Modal ----------
  const [modalMovie, setModalMovie] = useState(null);
  window.openModal = setModalMovie;
  window.openTrailer = setModalMovie;

  // ---------- Inbound share banner ----------
  // When someone lands here from a friend's share, the URL carries
  // ?p=<personalityKey>&n=<count>. Show a one-time prompt that turns
  // the inbound visit into a fast onboarding into building their own list.
  const [inbound, setInbound] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('p');
      const n = parseInt(params.get('n') || '', 10);
      if (!p) return null;
      return { personalityKey: p, count: Number.isFinite(n) && n > 0 ? n : null };
    } catch { return null; }
  });
  useEffect(() => {
    if (!inbound) return;
    window.cinemapTrack?.('inbound_landed', { personalityKey: inbound.personalityKey, count: inbound.count || 0 });
  }, [!!inbound]);
  const dismissInbound = () => {
    if (inbound) window.cinemapTrack?.('inbound_dismissed', { personalityKey: inbound.personalityKey });
    setInbound(null);
  };

  // ---------- Anonymous page view tracking ----------
  useEffect(() => {
    let lastPath = '';
    const pageKind = () => {
      const hash = window.location.hash || '';
      if (hash.startsWith('#/m/')) return 'movie';
      if (hash === '#watchlist') return 'watchlist';
      if (hash === '#my-list' || hash === '#my2026') return 'my_list';
      if (hash === '#calendar' || !hash) return 'calendar';
      return 'section';
    };
    const trackPageView = () => {
      const path = `${location.pathname}${location.search}${location.hash}`;
      if (path === lastPath) return;
      lastPath = path;
      const kind = pageKind();
      window.cinemapTrack?.('page_view', { pageKind: kind });
      if (kind === 'watchlist') window.cinemapTrack?.('watchlist_open', { source: 'route' });
      if (kind === 'my_list') window.cinemapTrack?.('my_list_open', { source: 'route' });
    };
    trackPageView();
    window.addEventListener('hashchange', trackPageView);
    window.addEventListener('popstate', trackPageView);
    return () => {
      window.removeEventListener('hashchange', trackPageView);
      window.removeEventListener('popstate', trackPageView);
    };
  }, []);

  // ---------- Deep-link routing ----------
  // URL format: #/m/<slug>  → opens that movie's modal.
  // Reading the hash on mount + reacting to hashchange opens the modal;
  // setting the hash whenever modalMovie changes keeps the URL shareable.
  useEffect(() => {
    const applyHash = () => {
      const h = window.location.hash || '';
      const m = h.match(/^#\/m\/([^/?#]+)/);
      if (m) {
        const movie = window.findMovieBySlug(decodeURIComponent(m[1]));
        if (movie) {
          window.cinemapTrackMovie?.('movie_view', movie, { source: 'deep_link' });
          setModalMovie(movie);
        }
        else setModalMovie(null);
      } else {
        setModalMovie(prev => (prev ? null : prev));
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror modalMovie back into the hash so the URL stays shareable.
  useEffect(() => {
    if (modalMovie) {
      const slug = window.movieSlug(modalMovie);
      const target = `#/m/${slug}`;
      if (window.location.hash !== target) {
        history.replaceState(null, '', target);
      }
    } else if (window.location.hash.startsWith('#/m/')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [modalMovie]);

  // ---------- Notify capture popup ----------
  const [notifyMovie, setNotifyMovie] = useState(null);

  // ---------- Rating sheet (Ticket 2) ----------
  const [ratingMovie, setRatingMovie] = useState(null);

  // ---------- Calendar picker bottom sheet ----------
  const [calendarMovie, setCalendarMovie] = useState(null);

  // ---------- Active month (scroll spy) ----------
  const [activeMonth, setActiveMonth] = useState(0);

  // ---------- Toast system ----------
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(1);
  const pushToast = useCallback((msg, kind = 'info', icon = null, options = {}) => {
    const id = toastIdRef.current++;
    const { persistent = false, onTap = null } = options;
    setToasts(prev => [...prev, { id, msg, kind, icon, onTap }]);
    if (!persistent) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800);
    }
  }, []);
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ---------- Audience engagement (Phase A) ----------
  // Daily-refreshed aggregate from Supabase: per-movie save_count,
  // save_count_7d, rating_count, avg_rating. Fetched once on boot;
  // every read goes against this in-memory map. Null until the fetch
  // resolves — components must guard for that and render gracefully.
  const [engagement, setEngagement] = useState(null);
  useEffect(() => {
    let cancelled = false;
    window.cinemapFetchMovieEngagement?.().then(rows => {
      if (cancelled || !rows) return;
      const byId = {};
      rows.forEach(r => { if (r.movie_id) byId[r.movie_id] = r; });
      setEngagement(byId);
    });
    return () => { cancelled = true; };
  }, []);

  // Trending = top 5 by saves in the last 7 days (live signal).
  // Most anticipated = top 5 future films by total saves (sustained hype).
  const { trendingIds, anticipatedIds } = useMemo(() => {
    if (!engagement) return { trendingIds: new Set(), anticipatedIds: new Set() };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rows = Object.values(engagement);
    const trending = [...rows]
      .filter(r => Number(r.save_count_7d) > 0)
      .sort((a, b) => (b.save_count_7d || 0) - (a.save_count_7d || 0))
      .slice(0, 5)
      .map(r => r.movie_id);
    const anticipated = [...rows]
      .filter(r => r.release_date && new Date(r.release_date) >= today && Number(r.save_count) > 0)
      .sort((a, b) => (b.save_count || 0) - (a.save_count || 0))
      .slice(0, 5)
      .map(r => r.movie_id);
    return { trendingIds: new Set(trending), anticipatedIds: new Set(anticipated) };
  }, [engagement]);

  // ---------- Back-to-top FAB ----------
  // Item 7: instead of scrolling endlessly, surface a one-tap shortcut to
  // the calendar's month bar after the user has scrolled past ~one screen.
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 800);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ---------- Filtered movies ----------
  const filteredMovies = useMemo(() => {
    return movies.filter(m => {
      if (filters.status.size > 0   && !filters.status.has(m.status))     return false;
      if (filters.genre.size > 0    && !filters.genre.has(m.genre))       return false;
      if (filters.language.size > 0 && !filters.language.has(m.language)) return false;
      if (filters.mood.size > 0     && !filters.mood.has(m.mood))         return false;
      if (filters.month.size > 0    && !filters.month.has(m.month))       return false;
      if (filters.picksOnly && !m.pick) return false;
      return true;
    });
  }, [movies, filters]);

  const monthCounts = useMemo(() => {
    const arr = Array(12).fill(0);
    filteredMovies.forEach(m => { arr[m.month] = (arr[m.month] || 0) + 1; });
    return arr;
  }, [filteredMovies]);

  const savedMovies = useMemo(
    () => movies.filter(m => watchlist.has(movieKey(m))).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [movies, watchlist]
  );

  const featured = useMemo(() => movies.filter(m => m.pick).slice(0, 3), [movies]);

  // ---------- Scroll spy ----------
  useEffect(() => {
    const handler = () => {
      let best = 0, bestY = -Infinity;
      for (let i = 0; i < 12; i++) {
        const el = document.getElementById(`month-${i}`);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.5 && r.top > bestY) { bestY = r.top; best = i; }
      }
      setActiveMonth(best);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // (Removed dynamic monthbar-offset useEffect.) The previous version
  // recalculated the monthbar's sticky `top` on every scroll event by
  // measuring the filter bar's current rect. Because the filter bar is
  // itself sticky, those measurements changed mid-scroll and the
  // monthbar visibly jittered before settling. Static CSS values now
  // pin it at fbar-bottom (60+60=120 mobile, 64+70=134 desktop).

  // ---------- Jump helpers ----------
  const stickyOffset = () => {
    let h = 0;
    ['.cm-nav', '.cm-fbar', '.cm-monthbar'].forEach(sel => {
      const el = document.querySelector(sel);
      if (el) h += el.offsetHeight;
    });
    return h + 12;
  };
  const jumpTo = (sel, offset) => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!el) return;
    const off = offset != null ? offset : 80;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - off, behavior: 'smooth' });
  };
  const jumpToCalendar = () => jumpTo('#calendar', 70);
  const jumpToWatchlist = () => {
    window.cinemapTrack?.('watchlist_open', { source: 'jump' });
    jumpTo('#watchlist', 70);
  };
  const jumpToMy2026 = () => {
    window.cinemapTrack?.('my2026_nav_click', { source: 'jump' });
    jumpTo('#my2026', 70);
  };
  const jumpToMonth = (i) => {
    const el = document.getElementById(`month-${i}`);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - stickyOffset(), behavior: 'smooth' });
  };

  // ---------- Actions ----------
  const t = window.CINEMAP_I18N[lang];

  // Fires once per session when an inbound visitor (?p=…) saves their first
  // film. Lets us measure share→save conversion without adding any new
  // identifier — reuses the existing inbound state and a sessionStorage flag.
  const maybeFireInboundFirstSave = useCallback((m) => {
    if (!inbound) return;
    try {
      const KEY = 'cinemap-inbound-first-save-fired';
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, '1');
      window.cinemapTrackMovie?.('inbound_to_first_save', m, {
        personalityKey: inbound.personalityKey,
      });
    } catch {}
  }, [inbound]);

  // Show a tap-to-update toast when a new service worker is ready.
  useEffect(() => {
    const onUpdate = (e) => {
      const sw = e.detail?.sw;
      pushToast(t.toast_update_available, 'info', '↻', {
        persistent: true,
        onTap: () => sw?.postMessage({ type: 'SKIP_WAITING' }),
      });
    };
    window.addEventListener('cinemap:update-available', onUpdate);
    return () => window.removeEventListener('cinemap:update-available', onUpdate);
  }, [pushToast, t]);

  const ensureInWatchlist = useCallback((m, source = 'auto') => {
    if (!m) return;
    const k = movieKey(m);
    if (watchlist.has(k)) return;
    setWatchlist(prev => {
      if (prev.has(k)) return prev;
      const next = new Set(prev);
      next.add(k);
      saveSet(LS.watchlist, next);
      return next;
    });
    window.cinemapTrackMovie?.('movie_save', m, { source });
    maybeFireInboundFirstSave(m);
  }, [watchlist, maybeFireInboundFirstSave]);

  const ensureWatched = useCallback((m, source = 'rating') => {
    if (!m) return;
    const k = movieKey(m);
    if (watched.has(k)) return;
    setWatched(prev => {
      if (prev.has(k)) return prev;
      const next = new Set(prev);
      next.add(k);
      saveSet(LS.watched, next);
      return next;
    });
    window.cinemapTrackMovie?.('watched_on', m, { source });
  }, [watched]);

  const openMovie = useCallback((m, source = 'unknown') => {
    window.cinemapTrackMovie?.('movie_view', m, { source });
    setModalMovie(m);
  }, []);

  const toggleSave = (m) => {
    const k = movieKey(m);
    setWatchlist(prev => {
      const next = new Set(prev);
      if (next.has(k)) {
        next.delete(k);
        window.cinemapTrackMovie?.('movie_unsave', m, { source: 'action' });
        pushToast(t.toast_removed, 'info', '🗑');
      } else {
        next.add(k);
        window.cinemapTrackMovie?.('movie_save', m, { source: 'action' });
        maybeFireInboundFirstSave(m);
        pushToast(t.toast_saved, 'success', '💛');
      }
      saveSet(LS.watchlist, next);
      return next;
    });
  };

  const toggleNotify = (m) => {
    const k = movieKey(m);
    // If already notified → toggle OFF locally (no need to "unsubscribe" Formspree)
    if (notified.has(k)) {
      setNotified(prev => {
        const next = new Set(prev);
        next.delete(k);
        saveSet(LS.notify, next);
        return next;
      });
      window.cinemapTrackMovie?.('notify_off', m, { source: 'action' });
      pushToast(t.toast_notify_off, 'info', '🔕');
      return;
    }
    // Turning notify ON: do we already have a saved contact?
    const contact = window.cinemapLoadContact?.();
    if (!contact || !contact.email || !contact.privacyConsent) {
      window.cinemapTrackMovie?.('notify_form_open', m, { source: 'action' });
      // First time — open the capture popup; the popup will submit and we'll
      // mark notified inside its onSubmitted handler.
      setNotifyMovie(m);
      return;
    }
    // Have a saved contact — fire silently in the background.
    setNotified(prev => {
      const next = new Set(prev);
      next.add(k);
      saveSet(LS.notify, next);
      return next;
    });
    window.cinemapTrackMovie?.('notify_on', m, { source: 'quick', city: contact.city || '' });
    pushToast(t.notify_quick, 'success', '🔔');
    window.cinemapSendNotify?.({ contact, movie: m, lang }).then(res => {
      if (!res?.ok) {
        // Soft-fail: keep local state but warn
        pushToast(t.notify_error, 'info', '⚠');
      }
    });
  };

  // "Add to calendar" from any row, card, or modal — opens the
  // CalendarPicker bottom sheet so the user explicitly picks Google /
  // Apple / Outlook. Same behavior on every surface.
  const handleCalendar = (m) => {
    window.cinemapTrackMovie?.('calendar_picker_open', m, { source: 'action' });
    setCalendarMovie(m);
  };

  // Mark/unmark a movie as watched. Going OFF→ON: we toggle the local set
  // AND open the rating sheet a beat after the toast so the sheet doesn't
  // collide with the toast. Going ON→OFF: just toggle, no sheet.
  // NOTE: we read the current state via the closure (`watched`) instead of
  // relying on a flag set inside the updater — React 18's updater runs
  // lazily during reconciliation, so any side-effect flag set in there is
  // not observable in the same synchronous block.
  const toggleWatched = (m) => {
    const k = movieKey(m);
    const goingOn = !watched.has(k);

    setWatched(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      saveSet(LS.watched, next);
      return next;
    });
    window.cinemapTrackMovie?.(goingOn ? 'watched_on' : 'watched_off', m, { source: modalMovie ? 'modal' : 'row' });

    if (goingOn) ensureInWatchlist(m, 'watched');

    pushToast(
      goingOn ? t.toast_watched : t.toast_unwatched,
      goingOn ? 'success' : 'info',
      goingOn ? '🎬' : '○'
    );

    if (goingOn) {
      // If the user marked watched from inside the movie modal, close the
      // modal first so the rating sheet doesn't appear behind it. This
      // gives a single-overlay experience identical to clicking Watched
      // from a calendar row.
      setModalMovie(null);
      setTimeout(() => setRatingMovie(m), 350);
    }
  };

  const onRatingSubmitted = ({ payload: _p, networkOk }) => {
    window.cinemapTrackMovie?.('rating_submitted', ratingMovie, {
      rating: _p?.rating || 0,
      vibes: Array.isArray(_p?.vibes) ? _p.vibes : [],
      reaction: _p?.reaction || '',
      networkOk: !!networkOk,
    });
    ensureInWatchlist(ratingMovie, 'rating');
    ensureWatched(ratingMovie, 'rating');
    pushToast(t.rate_thanks, 'success', '⭐');
    // Refresh ratings state so any score pills/badges update immediately
    if (window.cinemapLoadRatings) setRatings(window.cinemapLoadRatings());
    setRatingMovie(null);
    if (!networkOk) {
      // Local rating is saved either way; just a soft hint that the cloud
      // copy might be delayed.
      setTimeout(() => pushToast(t.notify_error, 'info', '⚠'), 100);
    }
  };

  const openRatingSheet = (m) => {
    window.cinemapTrackMovie?.('rating_sheet_open', m, { source: 'score_prompt' });
    setModalMovie(null);
    setRatingMovie(m);
  };

  const onNotifySubmitted = ({ contact: _contact }) => {
    if (!notifyMovie) return;
    const k = movieKey(notifyMovie);
    setNotified(prev => {
      const next = new Set(prev);
      next.add(k);
      saveSet(LS.notify, next);
      return next;
    });
    window.cinemapTrackMovie?.('notify_on', notifyMovie, { source: 'form', city: _contact?.city || '' });
    pushToast(t.notify_success, 'success', '🔔');
    setNotifyMovie(null);
  };

  const handleTrailer = (m) => {
    window.cinemapTrackMovie?.('trailer_click', m, { source: 'action' });
    setTrailerClicks(c => {
      const next = c + 1;
      try { localStorage.setItem(LS.trailer, String(next)); } catch {}
      return next;
    });
    if (window.fetchTrailerKey && m.tmdbId) {
      // Open the modal — modal already handles trailer playback
      openMovie(m, 'trailer');
    } else {
      pushToast(t.toast_trailer, 'info', '▶');
    }
  };

  const handleShare = async (m) => {
    const title = window.movieTitle(m, lang);
    const url = `${location.origin}${location.pathname}#/m/${window.movieSlug(m)}`;
    const shareText = lang === 'en'
      ? `${title} — coming ${window.fmtDate(m.date, 'en')}. Saved on Cinemap.`
      : `${title} — قريبًا ${window.fmtDate(m.date, 'ar')}. من سينماب.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Cinemap', text: shareText, url });
        window.cinemapTrackMovie?.('movie_share', m, { method: 'web_share' });
        return;
      } catch { /* user dismissed — fall through */ }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      window.cinemapTrackMovie?.('movie_share', m, { method: 'clipboard' });
      pushToast(t.toast_copied, 'success', '📋');
    } catch {
      window.cinemapTrackMovie?.('movie_share', m, { method: 'fallback_failed' });
      pushToast(t.toast_copied, 'info', '📋');
    }
  };

  const loadShareImage = (src) => new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = new URL(src, location.href).href;
  });

  const roundRect = (ctx, x, y, w, h, r) => {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  };

  const drawCoverImage = (ctx, img, x, y, w, h, r) => {
    roundRect(ctx, x, y, w, h, r);
    ctx.save();
    ctx.clip();
    if (img) {
      const scale = Math.max(w / img.width, h / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
    } else {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#26384d');
      g.addColorStop(1, '#0a1320');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  };

  const drawWrappedText = (ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) => {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach((ln, i) => {
      let out = ln;
      if (i === maxLines - 1 && lines.length > maxLines) out = `${ln.replace(/\s+\S+$/, '')}…`;
      ctx.fillText(out, x, y + i * lineHeight);
    });
  };

  // Detect titles that should render in Arabic (RTL) script. Used to switch
  // ctx.direction per-title so that mixed-script titles like "Greenland 2:
  // Migration" or digit-leading "28 Years Later: The Bone Temple" don't
  // get reordered by the surrounding RTL canvas direction. The U+200E
  // embedded mark alone wasn't enough — canvas ctx.direction wins.
  const isArabicLeading = (title) => {
    if (!title) return false;
    const first = title.trim().charAt(0);
    // Arabic block + supplements + presentation forms.
    return /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(first);
  };

  const makeWatchlistShareImage = async () => {
    try {
      if (document.fonts?.ready) await document.fonts.ready;
    } catch {}
    const profile = window.cinemapBuildMy2026Profile?.({ lang, movies, watched, ratings, watchlist }) || {};
    const isEn = lang === 'en';
    const W = 1080, H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.direction = isEn ? 'ltr' : 'rtl';

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#07111f');
    bg.addColorStop(0.48, '#111a26');
    bg.addColorStop(1, '#221713');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(220, 200, 40, 220, 200, 760);
    glow.addColorStop(0, 'rgba(255,138,0,0.42)');
    glow.addColorStop(1, 'rgba(255,138,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const markImg = await loadShareImage('assets/cinemap-mark.svg');
    const drawMark = (x, y, h, color) => {
      if (!markImg || !markImg.width) return 0;
      const aspect = markImg.width / markImg.height;
      const w = Math.round(h * aspect);
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const oc = off.getContext('2d');
      oc.drawImage(markImg, 0, 0, w, h);
      oc.globalCompositeOperation = 'source-in';
      oc.fillStyle = color;
      oc.fillRect(0, 0, w, h);
      ctx.drawImage(off, x, y);
      return w;
    };

    const wordmark = isEn ? 'Cinemap' : 'سينماب';
    const alignX = isEn ? 80 : 1000;
    ctx.textAlign = isEn ? 'left' : 'right';
    ctx.fillStyle = '#fff7ed';
    ctx.font = '800 38px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const wordmarkW = ctx.measureText(wordmark).width;
    ctx.fillText(wordmark, alignX, 68);
    const markH = 56;
    const markGap = 14;
    if (isEn) {
      drawMark(alignX + wordmarkW + markGap, 58, markH, '#ff8a00');
    } else {
      const markW = Math.round(markH * (markImg ? markImg.width / markImg.height : 0.61));
      drawMark(alignX - wordmarkW - markGap - markW, 58, markH, '#ff8a00');
    }
    ctx.fillStyle = '#fff7ed';
    ctx.font = '900 64px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(isEn ? 'My 2026 movie list' : 'قائمتي السينمائية في 2026', alignX, 150);
    ctx.fillStyle = '#c9d1dc';
    ctx.font = '600 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(isEn ? 'Movies worth talking about' : 'أفلام عليها كلام', alignX, 235);

    // Personality hero pill — the share-worthy headline
    const pillX = 80, pillY = 305, pillW = 920, pillH = 160;
    roundRect(ctx, pillX, pillY, pillW, pillH, 32);
    const pillBg = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillH);
    pillBg.addColorStop(0, 'rgba(255,138,0,0.22)');
    pillBg.addColorStop(1, 'rgba(255,138,0,0.10)');
    ctx.fillStyle = pillBg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,138,0,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8a00';
    ctx.font = '800 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(t.my2026_personality, 540, pillY + 26);

    const personalityValue = profile.personality || t.my2026_p0;
    ctx.fillStyle = '#fff7ed';
    let personalityFontSize = 60;
    ctx.font = `900 ${personalityFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    while (ctx.measureText(personalityValue).width > pillW - 80 && personalityFontSize > 38) {
      personalityFontSize -= 4;
      ctx.font = `900 ${personalityFontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    }
    ctx.fillText(personalityValue, 540, pillY + 70);

    // Thin stat strip — supporting numbers, no panel chrome
    const stripY = pillY + pillH + 36;
    const stripParts = [
      `🎬 ${profile.watchedCount ?? 0}`,
      `⏱ ${profile.hoursText || '0'}`,
      `⭐ ${profile.averageText || t.my2026_not_yet}`,
    ];
    ctx.fillStyle = '#c9d1dc';
    ctx.font = '700 30px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    const partWidths = stripParts.map(p => ctx.measureText(p).width);
    const dotGap = 36;
    const totalW = partWidths.reduce((a, b) => a + b, 0) + dotGap * (stripParts.length - 1);
    let cursor = 540 - totalW / 2;
    stripParts.forEach((part, i) => {
      const w = partWidths[i];
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff7ed';
      ctx.fillText(part, cursor, stripY);
      cursor += w;
      if (i < stripParts.length - 1) {
        ctx.fillStyle = '#ff8a00';
        ctx.beginPath();
        ctx.arc(cursor + dotGap / 2, stripY + 18, 4, 0, Math.PI * 2);
        ctx.fill();
        cursor += dotGap;
      }
    });

    const shareMovies = savedMovies.slice(0, 6);
    const media = await Promise.all(shareMovies.map(async (m) => {
      const data = await window.cinemapFetchMovieMedia?.(m);
      const src = data?.poster || m.localPoster || null;
      const rating = ratings?.[movieKey(m)]?.rating || 0;
      return { movie: m, img: await loadShareImage(src), rating: Number(rating) || 0 };
    }));

    const startY = 580;
    const cardW = 280, posterH = 420, gap = 40;
    const startX = 80;
    const rowSpacing = 580;
    media.forEach(({ movie, img, rating }, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = startX + col * (cardW + gap);
      const y = startY + row * rowSpacing;
      drawCoverImage(ctx, img, x, y, cardW, posterH, 24);
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, cardW, posterH, 24);
      ctx.stroke();
      // Center titles under each poster — uniform layout that handles both
      // Arabic and mixed-script titles cleanly. Per-title direction switch
      // ensures Latin/digit-leading titles render LTR even though the
      // surrounding canvas direction is RTL.
      const title = window.movieTitle(movie, lang);
      ctx.direction = isArabicLeading(title) ? 'rtl' : 'ltr';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff7ed';
      ctx.font = '900 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      drawWrappedText(ctx, title, x + cardW / 2, y + posterH + 18, cardW, 32, 2);

      // Date under the title — same compact info pattern as the watchlist
      // cards in the app (title → date → stars).
      ctx.direction = isEn ? 'ltr' : 'rtl';
      ctx.fillStyle = '#aab4c2';
      ctx.font = '700 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const dateText = window.fmtDate(movie.date, lang);
      ctx.fillText(dateText, x + cardW / 2, y + posterH + 88);

      // Rating row — always render 5 stars (gold for rated, dim for empty)
      // so every card carries the rating affordance, matching the watchlist
      // visual where stars speak for themselves without a "تقييمك" label.
      const goldCount = Math.max(0, Math.min(5, Math.round(rating)));
      const starSize = 24;
      const starGap = 6;
      const totalStarWidth = 5 * starSize + 4 * starGap;
      let cursor = x + cardW / 2 - totalStarWidth / 2;
      ctx.font = '800 ' + starSize + 'px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.direction = 'ltr';
      for (let s = 0; s < 5; s++) {
        ctx.fillStyle = s < goldCount ? '#ffc857' : 'rgba(245,242,235,0.18)';
        ctx.fillText('★', cursor, y + posterH + 124);
        cursor += starSize + starGap;
      }

      // Reset direction back to the canvas default so other elements
      // (footer, etc.) continue to use the Arabic-context direction.
      ctx.textAlign = 'center';
      ctx.direction = isEn ? 'ltr' : 'rtl';
    });

    const footerY = 1780;
    ctx.fillStyle = 'rgba(7,17,31,0.78)';
    ctx.fillRect(0, footerY, W, H - footerY);
    ctx.fillStyle = 'rgba(255,138,0,0.4)';
    ctx.fillRect(0, footerY, W, 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff7ed';
    ctx.font = '800 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(isEn ? 'Build yours on cinemap.me' : 'ابنِ قائمتك على cinemap.me', W / 2, footerY + 50);

    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
  };

  const buildShareUrl = (profile) => {
    const params = new URLSearchParams();
    if (profile?.personalityKey) params.set('p', profile.personalityKey);
    if (profile?.watchedCount) params.set('n', String(profile.watchedCount));
    const qs = params.toString();
    return `${location.origin}${location.pathname}${qs ? `?${qs}` : ''}`;
  };

  const handleShareList = async () => {
    if (savedMovies.length === 0) {
      window.cinemapTrack?.('watchlist_share_empty');
      pushToast(t.toast_wl_empty, 'info', '🎬');
      return;
    }
    const shareProfile = window.cinemapBuildMy2026Profile?.({ lang, movies, watched, ratings, watchlist }) || {};
    const shareUrl = buildShareUrl(shareProfile);
    try {
      const blob = await makeWatchlistShareImage();
      if (!blob) throw new Error('no-blob');
      const file = new File([blob], 'cinemap-my-2026.png', { type: 'image/png' });
      // Funnel step 1: image bytes ready, BEFORE any share sheet opens.
      const sharePayload = {
        count: savedMovies.length,
        personalityKey: shareProfile.personalityKey || null,
        topVibe: shareProfile.topVibeKey || null,
      };
      window.cinemapTrack?.('share_card_generated', sharePayload);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: lang === 'en' ? 'My Cinemap 2026' : 'قائمتي في سينماب 2026',
          text: lang === 'en' ? 'My 2026 movie list on Cinemap' : 'قائمتي السينمائية في سينماب',
          url: shareUrl,
          files: [file],
        });
        window.cinemapTrack?.('watchlist_share_image', { method: 'web_share', count: savedMovies.length });
        // Funnel step 2: the system share sheet returned success.
        window.cinemapTrack?.('share_card_downloaded', { ...sharePayload, method: 'web_share' });
        return;
      }
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        window.cinemapTrack?.('watchlist_share_image', { method: 'clipboard_image', count: savedMovies.length });
        window.cinemapTrack?.('share_card_downloaded', { ...sharePayload, method: 'clipboard_image' });
        pushToast(t.toast_wl_image, 'success', '🖼');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cinemap-my-2026.png';
      a.addEventListener('click', () => {
        window.cinemapTrack?.('share_card_downloaded', { ...sharePayload, method: 'download' });
      }, { once: true });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      window.cinemapTrack?.('watchlist_share_image', { method: 'download', count: savedMovies.length });
      pushToast(t.toast_wl_image, 'success', '🖼');
      return;
    } catch (err) {
      // User cancelled the system share sheet (AbortError) — respect that
      // intent: don't fall through to the clipboard/text fallback and don't
      // surface a misleading "list copied" toast. Funnel still records a
      // share_card_generated above without a matching share_card_downloaded.
      if (err && err.name === 'AbortError') {
        window.cinemapTrack?.('watchlist_share_image', { method: 'cancelled', count: savedMovies.length });
        return;
      }
      window.cinemapTrack?.('watchlist_share_image', { method: 'image_failed', count: savedMovies.length });
    }

    const lines = savedMovies.map(m =>
      `• ${window.movieTitle(m, lang)} — ${window.fmtDate(m.date, lang)}`
    );
    const header = lang === 'en'
      ? `My 2026 Cinemap watchlist (${savedMovies.length}):`
      : `قائمة سينماب الخاصة بي لـ 2026 (${savedMovies.length}):`;
    const text = `${header}\n${lines.join('\n')}\n\n${shareUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Cinemap Watchlist', text });
        window.cinemapTrack?.('watchlist_share', { method: 'web_share', count: savedMovies.length });
        return;
      } catch (err) {
        // Same AbortError handling for the text-only fallback path.
        if (err && err.name === 'AbortError') {
          window.cinemapTrack?.('watchlist_share', { method: 'cancelled', count: savedMovies.length });
          return;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      window.cinemapTrack?.('watchlist_share', { method: 'clipboard', count: savedMovies.length });
      pushToast(t.toast_wl_copied, 'success', '📋');
    } catch {
      window.cinemapTrack?.('watchlist_share', { method: 'fallback_failed', count: savedMovies.length });
      pushToast(t.toast_wl_copied, 'info', '📋');
    }
  };

  const handleClearList = () => {
    if (savedMovies.length === 0) return;
    setWatchlist(new Set());
    saveSet(LS.watchlist, new Set());
    window.cinemapTrack?.('watchlist_clear', { count: savedMovies.length });
    pushToast(t.toast_wl_clear, 'info', '🗑');
  };

  // ---------- Render ----------
  return (
    <>
      <window.Nav
        lang={lang}
        setLang={setLang}
        onJumpCalendar={jumpToCalendar}
        onJumpWatchlist={jumpToWatchlist}
        onJumpMy2026={jumpToMy2026}
        onOpenMovie={(m) => openMovie(m, 'search')}
      />

      {inbound && (
        <div className="cm-inbound" role="region" aria-label={t.inbound_eyebrow}>
          <div className="cm-container cm-inbound-row">
            <div className="cm-inbound-text">
              <span className="cm-inbound-eyebrow">{t.inbound_eyebrow}</span>
              <strong className="cm-inbound-title">
                {t.inbound_title}{' '}
                <span className="cm-inbound-personality">
                  {t[`my2026_${inbound.personalityKey}`] || t.my2026_p1}
                </span>
              </strong>
              <p className="cm-inbound-sub">{t.inbound_sub}</p>
            </div>
            <div className="cm-inbound-actions">
              <button
                type="button"
                className="cm-btn cm-btn-primary cm-inbound-cta"
                onClick={() => {
                  window.cinemapTrack?.('inbound_cta', { personalityKey: inbound.personalityKey });
                  jumpToCalendar();
                }}
              >{t.inbound_cta}</button>
              <button
                type="button"
                className="cm-inbound-x"
                onClick={dismissInbound}
                aria-label={t.inbound_dismiss}
                title={t.inbound_dismiss}
              >×</button>
            </div>
          </div>
        </div>
      )}

      <window.Hero
        lang={lang}
        onJumpCalendar={jumpToCalendar}
        onJumpWatchlist={jumpToWatchlist}
        onJumpMy2026={jumpToMy2026}
        watchlistCount={watchlist.size}
        featured={featured}
        isFirstTime={watchlist.size === 0 && watched.size === 0 && Object.keys(ratings).length === 0}
      />

      <window.FeaturedCarousel
        lang={lang}
        watchlist={watchlist}
        notified={notified}
        watched={watched}
        ratings={ratings}
        onToggleSave={toggleSave}
        onToggleNotify={toggleNotify}
        onToggleWatched={toggleWatched}
        onCalendar={handleCalendar}
        onTrailer={handleTrailer}
        onShare={handleShare}
        onOpenMovie={(m) => openMovie(m, 'featured')}
      />

      {/* Calendar */}
      <section id="calendar" className="cm-section cm-calendar">
        <div className="cm-container">
          <header className="cm-section-head">
            <span className="cm-eyebrow">{t.cal_eyebrow}</span>
            <h2 className="cm-h2">{t.cal_title}</h2>
            <p className="cm-section-sub">{t.cal_sub}</p>
          </header>
        </div>

        <window.FilterBar
          lang={lang}
          filters={filters}
          setFilters={setFilters}
          totalCount={filteredMovies.length}
        />
        <window.MonthBar
          activeMonth={activeMonth}
          onJumpMonth={jumpToMonth}
          lang={lang}
          monthCounts={monthCounts}
        />

        <div className="cm-container cm-calendar-stack">
          {filteredMovies.length === 0 ? (
            <div className="cm-empty">
              <p>{t.no_results}</p>
              <button className="cm-btn cm-btn-ghost" onClick={resetFilters}>✕ {t.reset}</button>
            </div>
          ) : (
            window.CINEMAP_MONTHS_AR.map((_, i) => (
              <window.MonthPanel
                key={i}
                index={i}
                movies={filteredMovies}
                lang={lang}
                onOpenMovie={(m) => openMovie(m, 'calendar')}
                watchlist={watchlist}
                notified={notified}
                watched={watched}
                ratings={ratings}
                engagement={engagement}
                onToggleSave={toggleSave}
                onToggleNotify={toggleNotify}
                onToggleWatched={toggleWatched}
                onRateMovie={openRatingSheet}
                onCalendar={handleCalendar}
                onShare={handleShare}
              />
            ))
          )}
        </div>
      </section>

      <window.WatchlistSection
        lang={lang}
        watchlist={watchlist}
        savedMovies={savedMovies}
        ratings={ratings}
        movies={movies}
        onSave={toggleSave}
        onRemove={toggleSave}
        onShareList={handleShareList}
        onClear={handleClearList}
        onJumpCalendar={jumpToCalendar}
        onOpenMovie={(m) => openMovie(m, 'watchlist')}
      />

      <window.My2026Lite
        lang={lang}
        movies={movies}
        watched={watched}
        ratings={ratings}
        watchlist={watchlist}
        onJumpCalendar={jumpToCalendar}
        onMarkWatched={(m) => ensureWatched(m, 'my2026_empty_quick')}
      />

      <window.Footer lang={lang} />

      {/* Back-to-top FAB — appears after the user scrolls past ~one screen */}
      {showBackToTop && (
        <button
          className="cm-back-to-top"
          onClick={() => {
            const cal = document.getElementById('calendar');
            if (cal) cal.scrollIntoView({ behavior: 'smooth', block: 'start' });
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label={t.back_to_top}
          title={t.back_to_top}
        >
          ↑
        </button>
      )}

      <window.Toaster toasts={toasts} onDismiss={dismissToast} />

      <window.NotifyCapture
        open={!!notifyMovie}
        movie={notifyMovie}
        lang={lang}
        onClose={() => setNotifyMovie(null)}
        onSubmitted={onNotifySubmitted}
      />

      <window.RatingSheet
        open={!!ratingMovie}
        movie={ratingMovie}
        lang={lang}
        onClose={() => setRatingMovie(null)}
        onSubmitted={onRatingSubmitted}
      />

      <window.CalendarPicker
        open={!!calendarMovie}
        movie={calendarMovie}
        lang={lang}
        onClose={() => setCalendarMovie(null)}
      />

      {modalMovie && (
        <window.MovieModal
          movie={modalMovie}
          lang={lang}
          onClose={() => setModalMovie(null)}
          isWatched={watched.has(movieKey(modalMovie))}
          onToggleWatched={toggleWatched}
          onCalendar={handleCalendar}
          rating={ratings[movieKey(modalMovie)]}
          engagement={engagement}
        />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
