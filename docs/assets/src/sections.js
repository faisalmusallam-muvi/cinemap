/* global React */
const { useEffect, useState, useMemo, useRef } = window.React;

function buildMy2026Profile({ lang, movies, watched, ratings }) {
  const t = window.CINEMAP_I18N[lang];
  const watchedMovies = movies.filter(m => watched?.has(`${m.en}|${m.date}`));
  const watchedKeys = new Set(watchedMovies.map(m => `${m.en}|${m.date}`));
  const watchedCount = watchedMovies.length;
  const ratedEntries = Object.entries(ratings || {}).filter(([key, r]) => (
    watchedKeys.has(key) && r && Number(r.rating) > 0
  ));

  const totalRuntime = watchedMovies.reduce((sum, m) => (
    sum + (Number(m.runtime) > 0 ? Number(m.runtime) : 0)
  ), 0);
  const hours = totalRuntime / 60;
  const hoursText = totalRuntime > 0
    ? `${Number.isInteger(hours) ? hours : hours.toFixed(1)} ${lang === 'en' ? (hours === 1 ? 'hour' : 'hours') : 'ساعة'}`
    : (watchedCount > 0 ? t.my2026_soon : '0');

  const average = ratedEntries.length
    ? ratedEntries.reduce((sum, [, r]) => sum + Number(r.rating), 0) / ratedEntries.length
    : 0;

  const countValues = (values) => values.reduce((acc, val) => {
    if (val) acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  const dominant = (counts) => {
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return null;
    if (sorted.length === 1) return sorted[0][0];
    return sorted[0][1] > sorted[1][1] ? sorted[0][0] : null;
  };

  const vibeCounts = {};
  ratedEntries.forEach(([, r]) => {
    (Array.isArray(r.vibes) ? r.vibes : []).forEach(v => {
      if (v) vibeCounts[v] = (vibeCounts[v] || 0) + 1;
    });
  });
  const topVibe = dominant(vibeCounts);
  const topVibeLabel = topVibe
    ? ({
        bigscreen: t.rate_v_bigscreen,
        stream: t.rate_v_stream,
        friends: t.rate_v_friends,
        date: t.rate_v_date,
        alone: t.rate_v_alone,
        skip: t.rate_v_skip,
      }[topVibe] || topVibe)
    : t.my2026_not_enough;

  const topGenre = dominant(countValues(watchedMovies.map(m => m.genre)));
  let personality = t.my2026_p0;
  let personalityKey = 'p0';
  if (watchedCount >= 26) { personality = t.my2026_p26; personalityKey = 'p26'; }
  else if (watchedCount >= 11) { personality = t.my2026_p11; personalityKey = 'p11'; }
  else if (watchedCount >= 4) { personality = t.my2026_p4; personalityKey = 'p4'; }
  else if (watchedCount >= 1) { personality = t.my2026_p1; personalityKey = 'p1'; }

  if (topVibe === 'bigscreen') { personality = t.my2026_bigscreen; personalityKey = 'bigscreen'; }
  else if (topGenre === 'horror') { personality = t.my2026_horror; personalityKey = 'horror'; }
  else if (topGenre === 'arabic') { personality = t.my2026_arabic; personalityKey = 'arabic'; }

  return {
    watchedCount,
    watchedMovies,
    ratedCount: ratedEntries.length,
    hoursText,
    averageText: average ? `${average.toFixed(1)}/5` : t.my2026_not_yet,
    topVibe,
    topVibeLabel,
    topGenre,
    personality,
    personalityKey,
  };
}

window.cinemapBuildMy2026Profile = buildMy2026Profile;

// ---------- Journey 0 explainer ----------
function Journey0({ lang, onJumpCalendar }) {
  const t = window.CINEMAP_I18N[lang];
  const cards = [
    { icon: '🔍', title: t.j0_card1_title, body: t.j0_card1_body, accent: 'var(--amber)' },
    { icon: '💛', title: t.j0_card2_title, body: t.j0_card2_body, accent: 'var(--gold)' },
    { icon: '🔔', title: t.j0_card3_title, body: t.j0_card3_body, accent: 'var(--teal)' },
  ];
  return (
    <section id="journey" className="cm-section cm-journey">
      <div className="cm-container">
        <header className="cm-section-head">
          <span className="cm-eyebrow">{t.j0_eyebrow}</span>
          <h2 className="cm-h2">{t.j0_title}</h2>
          <p className="cm-section-sub">{t.j0_sub}</p>
        </header>
        <div className="cm-journey-grid">
          {cards.map((c, i) => (
            <div key={i} className="cm-journey-card" style={{ '--accent': c.accent }}>
              <div className="cm-journey-icon">{c.icon}</div>
              <h3 className="cm-journey-title">{c.title}</h3>
              <p className="cm-journey-body">{c.body}</p>
              <div className="cm-journey-num">{String(i + 1).padStart(2, '0')}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- My 2026 Lite ----------
function My2026Lite({ lang, movies, watched, ratings, onJumpCalendar }) {
  const t = window.CINEMAP_I18N[lang];
  const cardRef = useRef(null);
  const trackedRef = useRef(false);
  const profile = useMemo(
    () => buildMy2026Profile({ lang, movies, watched, ratings }),
    [lang, movies, watched, ratings]
  );
  const watchedCount = profile.watchedCount;

  useEffect(() => {
    const el = cardRef.current;
    if (!el || trackedRef.current) return;
    const track = () => {
      if (trackedRef.current) return;
      trackedRef.current = true;
      window.cinemapTrack?.('my2026_lite_view', { watchedCount });
    };
    if (typeof IntersectionObserver === 'undefined') {
      track();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        track();
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [watchedCount]);

  const empty = watchedCount === 0;
  const clickEmptyCta = () => {
    window.cinemapTrack?.('my2026_lite_empty_cta_click');
    onJumpCalendar();
  };

  return (
    <section id="my2026" className="cm-section cm-my2026-section">
      <div className="cm-container">
        <div ref={cardRef} className={`cm-my2026 ${empty ? 'is-empty' : ''}`}>
          <div className="cm-my2026-head">
            <span className="cm-eyebrow">{t.my2026_eyebrow}</span>
            <h3 className="cm-my2026-title">{t.my2026_title}</h3>
            <p className="cm-my2026-sub">{t.my2026_sub}</p>
          </div>

          {empty ? (
            <div className="cm-my2026-empty">
              <div className="cm-my2026-empty-icon" aria-hidden="true">⭐</div>
              <div>
                <h4>{t.my2026_empty_title}</h4>
                <p>{t.my2026_empty_body}</p>
              </div>
              <button className="cm-btn cm-btn-primary cm-btn-sm" onClick={clickEmptyCta}>
                {t.my2026_empty_cta}
              </button>
            </div>
          ) : (
            <div className="cm-my2026-grid">
              <div className="cm-my2026-tile">
                <span>{t.my2026_watched}</span>
                <strong>{profile.watchedCount}</strong>
              </div>
              <div className="cm-my2026-tile">
                <span>{t.my2026_time}</span>
                <strong>{profile.hoursText}</strong>
              </div>
              <div className="cm-my2026-tile">
                <span>{t.my2026_avg}</span>
                <strong>{profile.averageText}</strong>
              </div>
              <div className="cm-my2026-tile">
                <span>{t.my2026_vibe}</span>
                <strong>{profile.topVibeLabel}</strong>
              </div>
              <div className="cm-my2026-tile is-personality">
                <span>{t.my2026_personality}</span>
                <strong>{profile.personality}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Empty-watchlist nudge: shows up to 5 films currently trending across all
// Cinemap users. Pulls from the weekly_top_saves materialized view via
// window.cinemapFetchTopSaves. ANY failure (no data, view missing, network)
// hides the section silently — the original empty state must keep working.
function WatchlistTopSaves({ lang, movies, onSave, onOpenMovie }) {
  const t = window.CINEMAP_I18N[lang];
  const [items, setItems] = useState(null); // null = loading/no-render, [] = empty/no-render

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fetcher = window.cinemapFetchTopSaves;
      if (!fetcher || !Array.isArray(movies) || movies.length === 0) return;
      const rows = await fetcher(5);
      if (cancelled || !rows) return;
      // Match each top-save row against the local catalog. Try tmdb id first,
      // fall back to en|date. Drop films we don't have locally.
      const catalogByTmdb = new Map();
      const catalogByKey = new Map();
      movies.forEach(m => {
        if (m.tmdbId) catalogByTmdb.set(`tmdb:${m.tmdbId}`, m);
        catalogByKey.set(`${m.en}|${m.date}`, m);
      });
      const matched = rows
        .map(r => catalogByTmdb.get(r.movie_id) || catalogByKey.get(r.movie_id))
        .filter(Boolean);
      setItems(matched);
    })();
    return () => { cancelled = true; };
  }, [movies]);

  if (!items || items.length === 0) return null;

  return (
    <div className="cm-wl-top">
      <div className="cm-wl-top-head">
        <span className="cm-eyebrow">{t.wl_top_eyebrow}</span>
      </div>
      <div className="cm-wl-top-rail">
        {items.map(m => (
          <div key={`${m.en}|${m.date}`} className="cm-wl-top-card">
            <button className="cm-wl-top-poster" onClick={() => onOpenMovie?.(m)} aria-label={window.movieTitle(m, lang)}>
              <window.CinePoster movie={m} compact />
            </button>
            <div className="cm-wl-top-meta">
              <h4 className="cm-wl-top-title">{window.movieTitle(m, lang)}</h4>
              <button className="cm-btn cm-btn-primary cm-btn-sm cm-wl-top-save" onClick={() => onSave?.(m)}>
                + {t.wl_top_save}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WatchlistSection({ lang, watchlist, savedMovies, ratings, onRemove, onShareList, onClear, onJumpCalendar, onOpenMovie, movies, onSave }) {
  const t = window.CINEMAP_I18N[lang];
  const count = savedMovies.length;
  const renderRating = (m) => {
    const r = ratings?.[`${m.en}|${m.date}`];
    if (!r || !r.rating) return null;
    const score = Math.max(0, Math.min(5, Number(r.rating) || 0));
    return (
      <div className="cm-wl-rating" title={`${t.score_your} ${score}/5`} aria-label={`${t.score_your} ${score}/5`}>
        <span className="cm-wl-rating-label">{t.score_your}</span>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < score ? 'is-on' : ''}>★</span>
        ))}
      </div>
    );
  };

  return (
    <section id="watchlist" className="cm-section cm-watchlist">
      <div className="cm-container">
        <header className="cm-section-head">
          <span className="cm-eyebrow">{t.wl_eyebrow}</span>
          <h2 className="cm-h2">{t.wl_title}</h2>
          <p className="cm-section-sub">{t.wl_sub}</p>
        </header>

        {count === 0 ? (
          <>
            <WatchlistTopSaves lang={lang} movies={movies} onSave={onSave} onOpenMovie={onOpenMovie} />
            <div className="cm-watchlist-empty">
              <div className="cm-watchlist-empty-icon">🎬</div>
              <p className="cm-watchlist-empty-text">{t.wl_empty}</p>
              <button className="cm-btn cm-btn-primary" onClick={onJumpCalendar}>
                {t.wl_empty_cta}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="cm-watchlist-actions">
              <span className="cm-watchlist-count">
                <strong>{count}</strong> {count === 1 ? t.wl_count : t.wl_count_pl}
              </span>
              <div className="cm-watchlist-actions-right">
                <button className="cm-btn cm-btn-ghost cm-btn-sm" onClick={onShareList}>↗ {t.wl_share}</button>
                <button className="cm-btn cm-btn-ghost cm-btn-sm" onClick={onClear}>✕ {t.wl_clear}</button>
              </div>
            </div>
            <div className="cm-watchlist-grid">
              {savedMovies.map(m => (
                <div key={m.en + m.date} className="cm-wl-card">
                  <button className="cm-wl-poster" onClick={() => onOpenMovie(m)}>
                    <window.CinePoster movie={m} compact />
                  </button>
                  <div className="cm-wl-meta">
                    <h4 className="cm-wl-title">{window.movieTitle(m, lang)}</h4>
                    <div className="cm-wl-date">{window.fmtDate(m.date, lang)}</div>
                    {renderRating(m)}
                  </div>
                  <button className="cm-wl-remove" onClick={() => onRemove(m)} aria-label="remove">×</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ---------- Investor Proof ----------
function InvestorProof({ lang, stats, watchlist, savedMovies, notifyCount, trailerClicks }) {
  const t = window.CINEMAP_I18N[lang];

  const topGenres = useMemo(() => {
    const counts = {};
    savedMovies.forEach(m => { counts[m.genre] = (counts[m.genre] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [savedMovies]);

  // Static demo numbers — visibly demo, no fake reality
  const cityDemo = [
    { name: lang === 'en' ? 'Riyadh' : 'الرياض', n: 38 },
    { name: lang === 'en' ? 'Jeddah' : 'جدة', n: 27 },
    { name: lang === 'en' ? 'Dammam' : 'الدمام', n: 18 },
    { name: lang === 'en' ? 'AlKhobar' : 'الخبر', n: 12 },
  ];

  const Insight = ({ label, value, accent, extra, demo }) => (
    <div className="cm-insight" style={{ '--accent': accent }}>
      <div className="cm-insight-head">
        <span className="cm-insight-label">{label}</span>
        {demo && <span className="cm-insight-demo">{t.ip_demo}</span>}
      </div>
      <div className="cm-insight-value">{value}</div>
      {extra}
    </div>
  );

  return (
    <section id="signals" className="cm-section cm-signals">
      <div className="cm-container">
        <header className="cm-section-head">
          <span className="cm-eyebrow">{t.ip_eyebrow}</span>
          <h2 className="cm-h2">{t.ip_title}</h2>
          <p className="cm-section-sub">{t.ip_sub}</p>
        </header>

        <div className="cm-insights">
          <Insight
            label={t.ip_saved}
            value={savedMovies.length}
            accent="var(--amber)"
          />
          <Insight
            label={t.ip_remind}
            value={notifyCount}
            accent="var(--gold)"
          />
          <Insight
            label={t.ip_trailer}
            value={trailerClicks}
            accent="var(--teal)"
          />
          <Insight
            label={t.ip_genres}
            value={
              topGenres.length === 0
                ? '—'
                : topGenres.map(([g]) =>
                    lang === 'en'
                      ? (window.CINEMAP_GENRES[g]?.en || g)
                      : (window.CINEMAP_GENRES[g]?.ar || g)
                  ).slice(0, 2).join(' · ')
            }
            accent="var(--coral)"
          />
          <Insight
            label={t.ip_cities}
            demo
            accent="var(--gold)"
            value={
              <div className="cm-city-bars">
                {cityDemo.map(c => (
                  <div key={c.name} className="cm-city-row">
                    <span className="cm-city-name">{c.name}</span>
                    <span className="cm-city-bar">
                      <span className="cm-city-fill" style={{ width: `${c.n}%` }} />
                    </span>
                    <span className="cm-city-n">{c.n}%</span>
                  </div>
                ))}
              </div>
            }
          />
          <Insight
            label={t.ip_growth}
            demo={savedMovies.length === 0}
            accent="var(--amber)"
            value={
              <div className="cm-spark">
                {[6, 9, 14, 12, 18, 22, 26, 30, 36, 41, 48, Math.max(50, savedMovies.length * 4)].map((v, i, a) => (
                  <span key={i} className="cm-spark-bar" style={{ height: `${(v / 60) * 100}%` }} />
                ))}
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}

// ---------- Roadmap ----------
function Roadmap({ lang }) {
  const t = window.CINEMAP_I18N[lang];
  const items = [
    { active: true,  num: '0', title: t.rm0_title, body: t.rm0_body, icon: '🔍' },
    { active: false, num: '1', title: t.rm1_title, body: t.rm1_body, icon: '🎯' },
    { active: false, num: '2', title: t.rm2_title, body: t.rm2_body, icon: '👥' },
    { active: false, num: '3', title: t.rm3_title, body: t.rm3_body, icon: '⭐' },
  ];
  return (
    <section id="roadmap" className="cm-section cm-roadmap">
      <div className="cm-container">
        <header className="cm-section-head">
          <span className="cm-eyebrow">{t.rm_eyebrow}</span>
          <h2 className="cm-h2">{t.rm_title}</h2>
        </header>
        <div className="cm-roadmap-grid">
          {items.map(it => (
            <div key={it.num} className={`cm-roadmap-card ${it.active ? 'is-active' : ''}`}>
              <div className="cm-roadmap-status">
                {it.active
                  ? <span className="cm-tag cm-tag-amber">● {t.rm_active}</span>
                  : <span className="cm-tag cm-tag-muted">{t.rm_soon}</span>
                }
              </div>
              <div className="cm-roadmap-num">{it.num}</div>
              <div className="cm-roadmap-icon">{it.icon}</div>
              <h3 className="cm-roadmap-title">{it.title}</h3>
              <p className="cm-roadmap-body">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Final CTA ----------
function FinalCTA({ lang, onJumpCalendar, onWaitlist }) {
  const t = window.CINEMAP_I18N[lang];
  return (
    <section className="cm-section cm-finalcta">
      <div className="cm-container cm-finalcta-inner">
        <h2 className="cm-h2 cm-finalcta-title">{t.fc_title}</h2>
        <p className="cm-finalcta-sub">{t.fc_sub}</p>
        <div className="cm-finalcta-buttons">
          <button className="cm-btn cm-btn-primary cm-btn-lg" onClick={onJumpCalendar}>{t.fc_primary}</button>
          <button className="cm-btn cm-btn-ghost cm-btn-lg" onClick={onWaitlist}>{t.fc_secondary}</button>
        </div>
      </div>
    </section>
  );
}

// ---------- Footer ----------
function Footer({ lang }) {
  const t = window.CINEMAP_I18N[lang];
  return (
    <footer className="cm-footer">
      <div className="cm-container cm-footer-inner">
        <div className="cm-footer-left">
          <window.CinemapLogo height={32} />
          <p className="cm-footer-tag">{t.footer_tag}</p>
        </div>
        <div className="cm-footer-right">
          <span className="cm-footer-links">
            <a href="about.html">{t.footer_about}</a>
            <a href="privacy.html">{t.footer_privacy}</a>
            <a href="terms.html">{t.footer_terms}</a>
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>
          </span>
          <span>{t.footer_made}</span>
          <span>{t.footer_subtitle}</span>
          <span className="cm-footer-tmdb">
            <img
              src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_1-5bdc75aaebeb75dc7ae79426ddd9be3b2be1e342510f8202baf6bffa71d7f5c4.svg"
              alt="TMDB"
              loading="lazy"
            />
            <span>{t.footer_tmdb}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

// ---------- Toast manager ----------
function Toaster({ toasts, onDismiss }) {
  return (
    <div className="cm-toasts">
      {toasts.map(t => {
        const cls = `cm-toast cm-toast-${t.kind || 'info'}${t.onTap ? ' cm-toast-action' : ''}`;
        return (
          <div key={t.id} className={cls} onClick={() => { t.onTap?.(); onDismiss(t.id); }}>
            {t.icon && <span className="cm-toast-icon">{t.icon}</span>}
            <span className="cm-toast-msg">{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { Journey0, My2026Lite, WatchlistSection, InvestorProof, Roadmap, FinalCTA, Footer, Toaster });
