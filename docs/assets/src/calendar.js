/* global React */
const { useMemo, useState, useEffect } = window.React;

// ---------- Group of chips ----------
function ChipGroup({ label, items, active, onPick, lang, allLabel }) {
  return (
    <div className="cm-fbar-group">
      <span className="cm-fbar-label">{label}</span>
      <div className="cm-chips">
        <button
          className={`cm-chip ${!active ? 'is-active' : ''}`}
          onClick={() => onPick(null)}
        >{allLabel}</button>
        {items.map(([k, v]) => (
          <button
            key={k}
            className={`cm-chip ${active === k ? 'is-active' : ''}`}
            style={active === k ? { '--chip-color': v.color || 'var(--amber)' } : {}}
            onClick={() => onPick(active === k ? null : k)}
          >
            {v.color && <span className="cm-chip-dot" style={{ background: v.color }} />}
            {lang === 'en' ? v.en : v.ar}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- FilterSheet (bottom sheet on mobile, modal on desktop) ----------
function FilterSheet({ open, onClose, lang, draft, setDraft, onApply, onReset }) {
  const t = window.CINEMAP_I18N[lang];
  const G = window.CINEMAP_GENRES;
  const L = window.CINEMAP_LANGUAGES;
  const M = window.CINEMAP_MOODS;
  const S = window.CINEMAP_STATUSES;
  const monthsLabels = lang === 'en' ? window.CINEMAP_MONTHS_EN : window.CINEMAP_MONTHS_AR;
  const monthEntries = monthsLabels.map((label, idx) => [String(idx), { en: label, ar: label }]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  const set = (k, v) => setDraft({ ...draft, [k]: v });

  // Render via portal so backdrop-filter on .cm-fbar doesn't trap our position:fixed
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
            active={draft.status}
            onPick={(v) => set('status', v)}
            lang={lang}
            allLabel={t.filter_all}
          />
          <ChipGroup
            label={t.filter_genre}
            items={Object.entries(G)}
            active={draft.genre}
            onPick={(v) => set('genre', v)}
            lang={lang}
            allLabel={t.filter_all}
          />
          <ChipGroup
            label={t.filter_lang}
            items={Object.entries(L)}
            active={draft.language}
            onPick={(v) => set('language', v)}
            lang={lang}
            allLabel={t.filter_all}
          />
          <ChipGroup
            label={t.filter_mood}
            items={Object.entries(M)}
            active={draft.mood}
            onPick={(v) => set('mood', v)}
            lang={lang}
            allLabel={t.filter_all}
          />
          <ChipGroup
            label={t.filter_month}
            items={monthEntries}
            active={draft.month}
            onPick={(v) => set('month', v)}
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

  const activeCount =
    (filters.status ? 1 : 0) +
    (filters.genre ? 1 : 0) +
    (filters.language ? 1 : 0) +
    (filters.mood ? 1 : 0) +
    (filters.month != null ? 1 : 0) +
    (filters.picksOnly ? 1 : 0);

  const reset = () => setFilters({ status: null, genre: null, language: null, mood: null, month: null, picksOnly: false });
  const resetDraft = () => setDraft({ status: null, genre: null, language: null, mood: null, month: null, picksOnly: false });
  const apply = () => { setFilters(draft); setSheet(false); };

  const setQuickStatus = (val) => {
    setFilters({ ...filters, status: filters.status === val ? null : val, picksOnly: false });
  };
  const togglePicks = () => {
    setFilters({ ...filters, picksOnly: !filters.picksOnly });
  };

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

        {/* Quick row — status + picks (always visible, compact) */}
        <div className="cm-fbar-quick">
          <button
            className={`cm-chip ${!filters.status && !filters.picksOnly ? 'is-active' : ''}`}
            onClick={() => setFilters({ ...filters, status: null, picksOnly: false })}
          >{t.filter_all}</button>
          {Object.entries(S).map(([k, v]) => (
            <button
              key={k}
              className={`cm-chip ${filters.status === k ? 'is-active' : ''}`}
              style={filters.status === k ? { '--chip-color': 'var(--amber)' } : {}}
              onClick={() => setQuickStatus(k)}
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

// ---------- MovieRow ----------
function MovieRow({ movie, lang, onOpenMovie, isSaved, isNotified, onToggleSave, onToggleNotify, onTrailer, onShare }) {
  const t = window.CINEMAP_I18N[lang];
  const g = window.CINEMAP_GENRES[movie.genre];
  const days = window.daysUntil(movie.date);
  const title = window.movieTitle(movie, lang);

  return (
    <article className="cm-movie">
      <button className="cm-movie-thumb" onClick={() => onOpenMovie(movie)} aria-label={title}>
        <window.CinePoster movie={movie} compact />
      </button>

      <div className="cm-movie-body">
        <div className="cm-movie-info" onClick={() => onOpenMovie(movie)}>
          <h3 className="cm-movie-title" dir="auto">{title}</h3>
          <div className="cm-movie-meta">
            <span className="cm-movie-date">{window.fmtDate(movie.date, lang)}</span>
            <span className="cm-pill" style={{ '--accent': g?.color }}>
              <span className="cm-chip-dot" style={{ background: g?.color }} />
              {lang === 'en' ? (g?.en || movie.genre) : (g?.ar || movie.genre)}
            </span>
            {days >= 0 && days <= 60 && (
              <span className="cm-movie-days">
                <strong>{days}</strong> {t.days}
              </span>
            )}
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
          <button
            className={`cm-action ${isNotified ? 'is-on' : ''}`}
            onClick={() => onToggleNotify(movie)}
            aria-label={t.notify}
            title={isNotified ? t.notified : t.notify}
          >
            <span className="cm-action-icon">🔔</span>
            <span className="cm-action-lbl">{isNotified ? t.notified : t.notify}</span>
          </button>
          <button className="cm-action" onClick={() => onTrailer(movie)} aria-label={t.trailer} title={t.trailer}>
            <span className="cm-action-icon">▶</span>
            <span className="cm-action-lbl">{t.trailer}</span>
          </button>
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
function MonthPanel({ index, movies, lang, onOpenMovie, watchlist, notified, onToggleSave, onToggleNotify, onTrailer, onShare }) {
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
            onToggleSave={onToggleSave}
            onToggleNotify={onToggleNotify}
            onTrailer={onTrailer}
            onShare={onShare}
          />
        ))}
      </div>
    </section>
  );
}

Object.assign(window, { FilterBar, MonthBar, MonthPanel, MovieRow });
