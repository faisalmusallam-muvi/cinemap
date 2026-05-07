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
  const pushToast = useCallback((msg, kind = 'info', icon = null) => {
    const id = toastIdRef.current++;
    setToasts(prev => [...prev, { id, msg, kind, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800);
  }, []);
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

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

  useEffect(() => {
    let frame = null;
    const root = document.documentElement;
    const setMonthbarOffset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const fbar = document.querySelector('.cm-fbar');
        const nav = document.querySelector('.cm-nav');
        const isMobile = window.matchMedia('(max-width: 720px)').matches;
        const fallback = isMobile ? 206 : 122;
        if (!fbar) {
          root.style.setProperty('--cm-monthbar-sticky-top', `${fallback}px`);
          return;
        }
        const fbarRect = fbar.getBoundingClientRect();
        if (fbarRect.top > window.innerHeight) {
          root.style.setProperty('--cm-monthbar-sticky-top', `${fallback}px`);
          return;
        }
        const navRect = nav?.getBoundingClientRect();
        const navBottom = navRect ? Math.max(0, navRect.bottom) : 0;
        const top = Math.max(navBottom, fbarRect.bottom);
        root.style.setProperty('--cm-monthbar-sticky-top', `${Math.round(top)}px`);
      });
    };

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(setMonthbarOffset)
      : null;
    ['.cm-nav', '.cm-fbar'].forEach(sel => {
      const el = document.querySelector(sel);
      if (el) resizeObserver?.observe(el);
    });
    window.addEventListener('scroll', setMonthbarOffset, { passive: true });
    window.addEventListener('resize', setMonthbarOffset);
    window.visualViewport?.addEventListener('resize', setMonthbarOffset);
    window.visualViewport?.addEventListener('scroll', setMonthbarOffset);
    setMonthbarOffset();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', setMonthbarOffset);
      window.removeEventListener('resize', setMonthbarOffset);
      window.visualViewport?.removeEventListener('resize', setMonthbarOffset);
      window.visualViewport?.removeEventListener('scroll', setMonthbarOffset);
    };
  }, []);

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
  const jumpToMonth = (i) => {
    const el = document.getElementById(`month-${i}`);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - stickyOffset(), behavior: 'smooth' });
  };

  // ---------- Actions ----------
  const t = window.CINEMAP_I18N[lang];

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

  const handleShareList = async () => {
    if (savedMovies.length === 0) {
      window.cinemapTrack?.('watchlist_share_empty');
      pushToast(t.toast_wl_empty, 'info', '🎬');
      return;
    }
    const lines = savedMovies.map(m =>
      `• ${window.movieTitle(m, lang)} — ${window.fmtDate(m.date, lang)}`
    );
    const header = lang === 'en'
      ? `My 2026 Cinemap watchlist (${savedMovies.length}):`
      : `قائمة سينماب الخاصة بي لـ 2026 (${savedMovies.length}):`;
    const text = `${header}\n${lines.join('\n')}\n\n${location.origin}${location.pathname}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Cinemap Watchlist', text });
        window.cinemapTrack?.('watchlist_share', { method: 'web_share', count: savedMovies.length });
        return;
      } catch {}
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
        onOpenMovie={(m) => openMovie(m, 'search')}
      />

      <window.Hero
        lang={lang}
        onJumpCalendar={jumpToCalendar}
        onJumpWatchlist={jumpToWatchlist}
        watchlistCount={watchlist.size}
        featured={featured}
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
        watched={watched}
        movies={movies}
        savedMovies={savedMovies}
        ratings={ratings}
        onRemove={toggleSave}
        onShareList={handleShareList}
        onClear={handleClearList}
        onJumpCalendar={jumpToCalendar}
        onOpenMovie={(m) => openMovie(m, 'watchlist')}
      />

      <window.Footer lang={lang} />

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
        />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
