/* global React */
const { useMemo, useState, useEffect } = window.React;

// ---------- Group of chips (multi-select) ----------
// `selected` is a Set of keys; "All" clears the set; other chips toggle membership.
function ChipGroup({ label, items, selected, onToggle, onClear, lang, allLabel }) {
  const empty = selected.size === 0;
  return (
    <div className="cm-fbar-group">
      <span className="cm-fbar-label">{label}</span>
      <div className="cm-chips">
        <button
          className={`cm-chip ${empty ? 'is-active' : ''}`}
          onClick={onClear}
        >{allLabel}</button>
        {items.map(([k, v]) => {
          const on = selected.has(typeof k === 'number' ? k : k);
          return (
            <button
              key={k}
              className={`cm-chip ${on ? 'is-active' : ''}`}
              style={on ? { '--chip-color': v.color || 'var(--amber)' } : {}}
              onClick={() => onToggle(k)}
            >
              {v.color && <span className="cm-chip-dot" style={{ background: v.color }} />}
              {lang === 'en' ? v.en : v.ar}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Helper: toggle a value's membership in a Set, returning a new Set
function toggleSet(set, val) {
  const next = new Set(set);
  if (next.has(val)) next.delete(val); else next.add(val);
  return next;
}

// ---------- FilterSheet (bottom sheet on mobile, modal on desktop) ----------
function FilterSheet({ open, onClose, lang, draft, setDraft, onApply, onReset }) {
  const t = window.CINEMAP_I18N[lang];
  const G = window.CINEMAP_GENRES;
  const L = window.CINEMAP_LANGUAGES;
  const M = window.CINEMAP_MOODS;
  const S = window.CINEMAP_STATUSES;
  const monthsLabels = lang === 'en' ? window.CINEMAP_MONTHS_EN : window.CINEMAP_MONTHS_AR;
  // Month entries use numeric keys so the Set holds the same number type as movie.month
  const monthEntries = monthsLabels.map((label, idx) => [idx, { en: label, ar: label }]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (dim, val) => setDraft(prev => ({ ...prev, [dim]: toggleSet(prev[dim], val) }));
  const clear  = (dim) => setDraft(prev => ({ ...prev, [dim]: new Set() }));

  return window.ReactDOM.createPortal(
    <div className="cm-sheet-overlay" onClick={onClose}>
      <div className="cm-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="cm-sheet-head">
          <span className="cm-sheet-grip" aria-hidden="true" />
          <h3 className="cm-sheet-title">{t.filter_title}</h3>
          <button className="cm-sheet-x" onClick={onClose} aria-label={t.filter_close}>×</button>
        </div>

        <div className="cm-sheet-body">
          <ChipGroup
            label={t.filter_status}
            items={Object.entries(S)}
            selected={draft.status}
            onToggle={(v) => toggle('status', v)}
            onClear={() => clear('status')}
            lang={lang}
            allLabel={t.filter_all}
          />
          <ChipGroup
            label={t.filter_genre}
            items={Object.entries(G)}
            selected={draft.genre}
            onToggle={(v) => toggle('genre', v)}
            onClear={() => clear('genre')}
            lang={lang}
            allLabel={t.filter_all}
          />
          <ChipGroup
            label={t.filter_lang}
            items={Object.entries(L)}
            selected={draft.language}
            onToggle={(v) => toggle('language', v)}
            onClear={() => clear('language')}
            lang={lang}
            allLabel={t.filter_all}
          />
          <ChipGroup
            label={t.filter_mood}
            items={Object.entries(M)}
            selected={draft.mood}
            onToggle={(v) => toggle('mood', v)}
            onClear={() => clear('mood')}
            lang={lang}
            allLabel={t.filter_all}
          />
          <ChipGroup
            label={t.filter_month}
            items={monthEntries}
            selected={draft.month}
            onToggle={(v) => toggle('month', v)}
            onClear={() => clear('month')}
            lang={lang}
            allLabel={t.filter_all}
          />
        </div>

        <div className="cm-sheet-foot">
          <button className="cm-btn cm-btn-ghost" onClick={onReset}>↺ {t.filter_reset}</button>
          <button className="cm-btn cm-btn-primary" onClick={onApply}>{t.filter_apply}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ---------- FilterBar (compact mobile + desktop chips) ----------
function FilterBar({ lang, filters, setFilters, totalCount }) {
  const t = window.CINEMAP_I18N[lang];
  const S = window.CINEMAP_STATUSES;
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState(filters);

  // Keep draft in sync if external filters change (e.g. quick chip)
  useEffect(() => { setDraft(filters); }, [filters]);

  const empty = () => ({
    status: new Set(), genre: new Set(), language: new Set(),
    mood: new Set(), month: new Set(), picksOnly: false,
  });

  const activeCount =
    filters.status.size +
    filters.genre.size +
    filters.language.size +
    filters.mood.size +
    filters.month.size +
    (filters.picksOnly ? 1 : 0);

  const reset = () => setFilters(empty());
  const resetDraft = () => setDraft(empty());
  const apply = () => { setFilters(draft); setSheet(false); };

  const toggleQuickStatus = (val) => {
    setFilters(prev => ({ ...prev, status: toggleSet(prev.status, val) }));
  };
  const clearStatus = () => setFilters(prev => ({ ...prev, status: new Set(), picksOnly: false }));
  const togglePicks = () => setFilters(prev => ({ ...prev, picksOnly: !prev.picksOnly }));

  const noStatusActive = filters.status.size === 0 && !filters.picksOnly;

  return (
    <div className="cm-fbar">
      <div className="cm-container cm-fbar-inner">
        {/* Compact summary row — visible everywhere */}
        <div className="cm-fbar-top">
          <div className="cm-fbar-count">
            <strong>{totalCount}</strong> {t.movies_count}
            {activeCount > 0 && (
              <span className="cm-fbar-active">
                · {activeCount} {activeCount === 1 ? t.filter_active : t.filter_active_pl}
              </span>
            )}
          </div>
          <div className="cm-fbar-buttons">
            {activeCount > 0 && (
              <button className="cm-fbar-reset" onClick={reset}>✕ {t.filter_reset}</button>
            )}
            <button className="cm-fbar-open" onClick={() => setSheet(true)}>
              <span className="cm-fbar-open-icon">☰</span>
              <span>{t.filter_btn}</span>
            </button>
          </div>
        </div>

        {/* Quick row — status + picks (multi-select) */}
        <div className="cm-fbar-quick">
          <button
            className={`cm-chip ${noStatusActive ? 'is-active' : ''}`}
            onClick={clearStatus}
          >{t.filter_all}</button>
          {Object.entries(S).map(([k, v]) => (
            <button
              key={k}
              className={`cm-chip ${filters.status.has(k) ? 'is-active' : ''}`}
              style={filters.status.has(k) ? { '--chip-color': 'var(--amber)' } : {}}
              onClick={() => toggleQuickStatus(k)}
            >{lang === 'en' ? v.en : v.ar}</button>
          ))}
          <button
            className={`cm-chip ${filters.picksOnly ? 'is-active' : ''}`}
            style={filters.picksOnly ? { '--chip-color': 'var(--gold)' } : {}}
            onClick={togglePicks}
          >★ {t.filter_picks}</button>
        </div>
      </div>

      <FilterSheet
        open={sheet}
        onClose={() => { setSheet(false); setDraft(filters); }}
        lang={lang}
        draft={draft}
        setDraft={setDraft}
        onApply={apply}
        onReset={resetDraft}
      />
    </div>
  );
}

// ---------- MonthBar (sticky horizontal) ----------
function MonthBar({ activeMonth, onJumpMonth, lang, monthCounts }) {
  const labels = lang === 'en' ? window.CINEMAP_MONTHS_EN : window.CINEMAP_MONTHS_AR;
  return (
    <div className="cm-monthbar">
      <div className="cm-monthbar-inner">
        {labels.map((m, i) => (
          <button
            key={i}
            className={`cm-monthbar-btn ${activeMonth === i ? 'is-active' : ''} ${(monthCounts?.[i] ?? 0) === 0 ? 'is-empty' : ''}`}
            onClick={() => onJumpMonth(i)}
          >
            <span className="cm-monthbar-name">{m}</span>
            <span className="cm-monthbar-count">{monthCounts?.[i] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Render a small "calendar chip" — month name on top, day number large below.
function DateChip({ iso, lang }) {
  const d = new Date(iso);
  const day = d.getDate();
  const monthShort = lang === 'en'
    ? window.CINEMAP_MONTHS_EN[d.getMonth()]
    : window.CINEMAP_MONTHS_AR[d.getMonth()];
  return (
    <span className="cm-datechip" aria-label={`${day} ${monthShort}`}>
      <span className="cm-datechip-month">{monthShort}</span>
      <span className="cm-datechip-day">{String(day).padStart(2, '0')}</span>
    </span>
  );
}

// ---------- MovieRow ----------
function MovieRow({ movie, lang, onOpenMovie, isSaved, isNotified, isWatched, rating,
                   onToggleSave, onToggleNotify, onToggleWatched, onRateMovie, onCalendar, onShare }) {
  const t = window.CINEMAP_I18N[lang];
  const g = window.CINEMAP_GENRES[movie.genre];
  const days = window.daysUntil(movie.date);
  // If the release date has passed → show "I watched it" instead of "Notify me"
  const isReleased = days < 0;
  const title = window.movieTitle(movie, lang);

  return (
    <article className="cm-movie">
      <window.MovieRowBackdrop movie={movie} />
      <button className="cm-movie-thumb" onClick={() => onOpenMovie(movie)} aria-label={title}>
        <window.CinePoster movie={movie} compact />
      </button>

      <div className="cm-movie-body">
        <div className="cm-movie-info" onClick={() => onOpenMovie(movie)}>
          <h3 className="cm-movie-title">{title}</h3>
          <div className="cm-movie-meta">
            <DateChip iso={movie.date} lang={lang} />
            <span className="cm-pill" style={{ '--accent': g?.color }}>
              <span className="cm-chip-dot" style={{ background: g?.color }} />
              {lang === 'en' ? (g?.en || movie.genre) : (g?.ar || movie.genre)}
            </span>

            {/* Score pill / first-rater CTA / countdown — mutually exclusive */}
            {rating && rating.rating > 0 ? (
              <span className="cm-score-pill" title={t.score_your}>
                <span className="cm-score-star">⭐</span>
                <strong className="cm-score-num">{rating.rating}</strong>
                <span className="cm-score-sep">/</span>
                <span className="cm-score-max">5</span>
              </span>
            ) : isReleased && isWatched ? (
              <span
                className="cm-score-prompt"
                onClick={(e) => { e.stopPropagation(); onRateMovie?.(movie); }}
              >
                ⭐ {t.score_be_first}
              </span>
            ) : days >= 0 && days <= 60 ? (
              <span className="cm-movie-days">
                <strong>{days}</strong> {t.days}
              </span>
            ) : null}

            {movie.pick && <span className="cm-pill cm-pill-gold">★ {lang === 'en' ? 'Pick' : 'مختار'}</span>}
          </div>
        </div>

        <div className="cm-movie-actions">
          <button
            className={`cm-action ${isSaved ? 'is-on' : ''}`}
            onClick={() => onToggleSave(movie)}
            aria-label={t.save}
            title={isSaved ? t.saved : t.save}
          >
            <span className="cm-action-icon">{isSaved ? '✓' : '＋'}</span>
            <span className="cm-action-lbl">{isSaved ? t.saved : t.save}</span>
          </button>

          {isReleased ? (
            <button
              className={`cm-action cm-action-watched ${isWatched ? 'is-on' : ''}`}
              onClick={() => onToggleWatched(movie)}
              aria-label={t.watched}
              title={isWatched ? t.watched_done : t.watched}
            >
              <span className="cm-action-icon">{isWatched ? '✓' : '⭐'}</span>
              <span className="cm-action-lbl">{isWatched ? t.watched_done : t.watched}</span>
            </button>
          ) : (
            <>
              <button
                className={`cm-action ${isNotified ? 'is-on' : ''}`}
                onClick={() => onToggleNotify(movie)}
                aria-label={t.notify}
                title={isNotified ? t.notified : t.notify}
              >
                <span className="cm-action-icon">🔔</span>
                <span className="cm-action-lbl">{isNotified ? t.notified : t.notify}</span>
              </button>
              <button
                className="cm-action"
                onClick={() => onCalendar?.(movie)}
                aria-label={t.cal_quick}
                title={t.cal_quick}
              >
                <span className="cm-action-icon">📅</span>
                <span className="cm-action-lbl">{t.cal_quick}</span>
              </button>
            </>
          )}

          <button className="cm-action" onClick={() => onShare(movie)} aria-label={t.share} title={t.share}>
            <span className="cm-action-icon">↗</span>
            <span className="cm-action-lbl">{t.share}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// ---------- MonthPanel ----------
function MonthPanel({ index, movies, lang, onOpenMovie, watchlist, notified, watched, ratings,
                     onToggleSave, onToggleNotify, onToggleWatched, onRateMovie, onCalendar, onShare }) {
  const months = lang === 'en' ? window.CINEMAP_MONTHS_EN_FULL : window.CINEMAP_MONTHS_AR;
  const movs = useMemo(
    () => movies.filter(m => m.month === index).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [movies, index]
  );

  if (movs.length === 0) return null;

  return (
    <section id={`month-${index}`} className="cm-month">
      <header className="cm-month-head">
        <h3 className="cm-month-name">
          <span className="cm-month-num">{String(index + 1).padStart(2, '0')}</span>
          {months[index]}
          <span className="cm-month-tally">{movs.length}</span>
        </h3>
      </header>
      <div className="cm-month-list">
        {movs.map(m => (
          <MovieRow
            key={m.en + m.date}
            movie={m}
            lang={lang}
            onOpenMovie={onOpenMovie}
            isSaved={watchlist.has(m.en + '|' + m.date)}
            isNotified={notified.has(m.en + '|' + m.date)}
            isWatched={watched?.has(m.en + '|' + m.date) || false}
            rating={ratings?.[m.en + '|' + m.date]}
            onToggleSave={onToggleSave}
            onToggleNotify={onToggleNotify}
            onToggleWatched={onToggleWatched}
            onRateMovie={onRateMovie}
            onCalendar={onCalendar}
            onShare={onShare}
          />
        ))}
      </div>
    </section>
  );
}

Object.assign(window, { FilterBar, MonthBar, MonthPanel, MovieRow });
