/* global React */
const { useEffect, useRef, useState, useMemo } = window.React;

// ---------- Featured Movies Carousel ----------
function FeaturedCarousel({ lang, watchlist, notified, watched, onToggleSave, onToggleNotify, onToggleWatched, onCalendar, onTrailer, onShare, onOpenMovie }) {
  const t = window.CINEMAP_I18N[lang];
  const movies = useMemo(() => window.getFeaturedMovies(), []);
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  // Track active card (centered)
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = null;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const cards = Array.from(el.querySelectorAll('.cm-fc-card'));
        const center = el.scrollLeft + el.clientWidth / 2;
        let bestIdx = 0;
        let bestDist = Infinity;
        cards.forEach((c, i) => {
          const cardCenter = c.offsetLeft + c.clientWidth / 2;
          const d = Math.abs(cardCenter - center);
          if (d < bestDist) { bestDist = d; bestIdx = i; }
        });
        setActive(bestIdx);
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { el.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [movies.length]);

  const scrollTo = (idx) => {
    const el = trackRef.current;
    if (!el) return;
    const cards = el.querySelectorAll('.cm-fc-card');
    const card = cards[idx];
    if (!card) return;
    const target = card.offsetLeft - (el.clientWidth - card.clientWidth) / 2;
    el.scrollTo({ left: target, behavior: 'smooth' });
  };

  const movieKey = (m) => m.en + '|' + m.date;

  return (
    <section id="featured" className="cm-section cm-featured">
      <div className="cm-container cm-featured-head">
        <span className="cm-eyebrow">{t.feat_eyebrow}</span>
        <h2 className="cm-h2">{t.feat_title}</h2>
        <p className="cm-section-sub">{t.feat_sub}</p>
      </div>

      <div className="cm-fc-track" ref={trackRef} role="region" aria-label={t.feat_title}>
        <div className="cm-fc-pad" aria-hidden="true" />
        {movies.map((m, i) => {
          const k = movieKey(m);
          const isSaved = watchlist.has(k);
          const isNotified = notified.has(k);
          const isWatched = watched?.has(k) || false;
          const isReleased = window.daysUntil(m.date) < 0;
          const badge = lang === 'en' ? m.badge : (m.badgeAr || m.badge);
          const projected = window.fmtAdmissions(m.projectedAdmissions, lang);
          const dateStr = window.fmtDate(m.date, lang);
          const title = window.movieTitle(m, lang);
          const g = window.CINEMAP_GENRES[m.genre];

          return (
            <article key={k} className={`cm-fc-card ${active === i ? 'is-active' : ''}`}>
              <div className="cm-fc-rank">#{m.featuredRank}</div>

              <button
                className="cm-fc-poster"
                onClick={() => onOpenMovie(m)}
                aria-label={title}
              >
                <window.CinePoster movie={m} compact />
                <span className="cm-fc-glow" aria-hidden="true" />
              </button>

              <div className="cm-fc-body">
                <span className="cm-fc-badge">★ {badge}</span>
                <h3 className="cm-fc-title" onClick={() => onOpenMovie(m)}>{title}</h3>
                <div className="cm-fc-meta">
                  <span className="cm-fc-date">{dateStr}</span>
                  <span className="cm-fc-dot" />
                  <span className="cm-fc-genre" style={{ color: g?.color }}>
                    {lang === 'en' ? (g?.en || m.genre) : (g?.ar || m.genre)}
                  </span>
                </div>
                <div className="cm-fc-projected">
                  <span className="cm-fc-flame">🔥</span>
                  <span>
                    {lang === 'en'
                      ? <><strong>Projected {projected}</strong> {t.feat_admissions}</>
                      : <><strong>{t.feat_projected} {projected}</strong> {t.feat_admissions}</>}
                  </span>
                </div>

                <div className="cm-fc-actions">
                  <button
                    className={`cm-fc-act ${isSaved ? 'is-on' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onToggleSave(m); }}
                    aria-label={isSaved ? t.saved : t.save}
                    title={isSaved ? t.saved : t.save}
                  >
                    <span className="cm-fc-act-icon">{isSaved ? '✓' : '＋'}</span>
                    <span className="cm-fc-act-lbl">{isSaved ? t.saved : t.save}</span>
                  </button>
                  {isReleased ? (
                    <button
                      className={`cm-fc-act cm-action-watched ${isWatched ? 'is-on' : ''}`}
                      onClick={(e) => { e.stopPropagation(); onToggleWatched(m); }}
                      aria-label={isWatched ? t.watched_done : t.watched}
                      title={isWatched ? t.watched_done : t.watched}
                    >
                      <span className="cm-fc-act-icon">{isWatched ? '✓' : '⭐'}</span>
                      <span className="cm-fc-act-lbl">{isWatched ? t.watched_done : t.watched}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        className={`cm-fc-act ${isNotified ? 'is-on' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onToggleNotify(m); }}
                        aria-label={isNotified ? t.notified : t.notify}
                        title={isNotified ? t.notified : t.notify}
                      >
                        <span className="cm-fc-act-icon">🔔</span>
                        <span className="cm-fc-act-lbl">{isNotified ? t.notified : t.notify}</span>
                      </button>
                      <button
                        className="cm-fc-act"
                        onClick={(e) => { e.stopPropagation(); onCalendar?.(m); }}
                        aria-label={t.cal_quick}
                        title={t.cal_quick}
                      >
                        <span className="cm-fc-act-icon">📅</span>
                        <span className="cm-fc-act-lbl">{t.cal_quick}</span>
                      </button>
                    </>
                  )}
                  <button
                    className="cm-fc-act"
                    onClick={(e) => { e.stopPropagation(); onShare(m); }}
                    aria-label={t.share}
                    title={t.share}
                  >
                    <span className="cm-fc-act-icon">↗</span>
                    <span className="cm-fc-act-lbl">{t.share}</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        <div className="cm-fc-pad" aria-hidden="true" />
      </div>

      <div className="cm-fc-dots" role="tablist" aria-label={t.feat_swipe}>
        {movies.map((_, i) => (
          <button
            key={i}
            className={`cm-fc-dot ${active === i ? 'is-on' : ''}`}
            onClick={() => scrollTo(i)}
            aria-label={`${i + 1}`}
            aria-selected={active === i}
            role="tab"
          />
        ))}
      </div>
    </section>
  );
}

window.FeaturedCarousel = FeaturedCarousel;
