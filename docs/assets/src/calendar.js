/* global React */
const { useMemo, useState, useEffect } = window.React;

// ---------- FilterBar (Genre / Language / Mood / Status) ----------
function FilterBar({ lang, filters, setFilter, resetFilters, totalCount }) {
  const t = window.CINEMAP_I18N[lang];
  const G = window.CINEMAP_GENRES;
  const L = window.CINEMAP_LANGUAGES;
  const M = window.CINEMAP_MOODS;
  const S = window.CINEMAP_STATUSES;

  const Group = ({ label, items, active, onPick }) => (
    <div className="cm-fbar-group">
      <span className="cm-fbar-label">{label}</span>
      <div className="cm-chips">
        <button
          className={`cm-chip ${!active ? 'is-active' : ''}`}
          onClick={() => onPick(null)}
        >{t.filter_all}</button>
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

  const anyActive = filters.genre || filters.language || filters.mood || filters.status;

  return (
    <div className="cm-fbar">
      <div className="cm-container">
        <Group
          label={t.filter_status}
          items={Object.entries(S)}
          active={filters.status}
          onPick={(v) => setFilter('status', v)}
        />
        <Group
          label={t.filter_genre}
          items={Object.entries(G)}
          active={filters.genre}
          onPick={(v) => setFilter('genre', v)}
        />
        <Group
          label={t.filter_lang}
          items={Object.entries(L)}
          active={filters.language}
          onPick={(v) => setFilter('language', v)}
        />
        <Group
          label={t.filter_mood}
          items={Object.entries(M)}
          active={filters.mood}
          onPick={(v) => setFilter('mood', v)}
        />
        {anyActive && (
          <button className="cm-fbar-reset" onClick={resetFilters}>
            ✕ {t.reset}
          </button>
        )}
        <span className="cm-fbar-count">
          {totalCount} {lang === 'en' ? 'films' : 'فيلم'}
        </span>
      </div>
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
        <div className="cm-movie-head">
          <div className="cm-movie-titles" onClick={() => onOpenMovie(movie)}>
            <h3 className="cm-movie-title" dir="auto">{title}</h3>
            <div className="cm-movie-meta">
              <span className="cm-pill" style={{ '--accent': g?.color }}>
                <span className="cm-chip-dot" style={{ background: g?.color }} />
                {lang === 'en' ? (g?.en || movie.genre) : (g?.ar || movie.genre)}
              </span>
              <span className="cm-movie-date">{window.fmtDate(movie.date, lang)}</span>
              {days >= 0 && days <= 60 && (
                <span className="cm-movie-days">
                  · <strong>{days}</strong> {t.days}
                </span>
              )}
              {movie.pick && <span className="cm-pill cm-pill-gold">★ {lang === 'en' ? 'Pick' : 'مختار'}</span>}
            </div>
          </div>
        </div>

        <div className="cm-movie-actions">
          <button
            className={`cm-action ${isSaved ? 'is-on' : ''}`}
            onClick={onToggleSave}
            aria-label={t.save}
            title={isSaved ? t.saved : t.save}
          >
            <span className="cm-action-icon">{isSaved ? '✓' : '＋'}</span>
            <span className="cm-action-lbl">{isSaved ? t.saved : t.save}</span>
          </button>
          <button
            className={`cm-action ${isNotified ? 'is-on' : ''}`}
            onClick={onToggleNotify}
            title={isNotified ? t.notified : t.notify}
          >
            <span className="cm-action-icon">🔔</span>
            <span className="cm-action-lbl">{isNotified ? t.notified : t.notify}</span>
          </button>
          <button className="cm-action" onClick={() => onTrailer(movie)} title={t.trailer}>
            <span className="cm-action-icon">▶</span>
            <span className="cm-action-lbl">{t.trailer}</span>
          </button>
          <button className="cm-action" onClick={() => onShare(movie)} title={t.share}>
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
  const t = window.CINEMAP_I18N[lang];
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
            onToggleSave={() => onToggleSave(m)}
            onToggleNotify={() => onToggleNotify(m)}
            onTrailer={onTrailer}
            onShare={onShare}
          />
        ))}
      </div>
    </section>
  );
}

Object.assign(window, { FilterBar, MonthBar, MonthPanel, MovieRow });
