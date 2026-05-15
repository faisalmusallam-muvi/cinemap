/* global React */
const { useEffect, useState, useMemo, useRef } = window.React;

function buildMy2026Profile({ lang, movies, watched, ratings, watchlist }) {
  const t = window.CINEMAP_I18N[lang];
  const G = window.CINEMAP_GENRES || {};
  const keyOf = (m) => `${m.en}|${m.date}`;
  const movieByKey = new Map((movies || []).map(m => [keyOf(m), m]));

  const watchedMovies = movies.filter(m => watched?.has(keyOf(m)));
  const watchedKeys = new Set(watchedMovies.map(keyOf));
  const watchedCount = watchedMovies.length;

  // Rated entries — anywhere in the catalog, not just watched. A rating is a
  // strong private signal even if the watched toggle was missed.
  const ratedEntries = Object.entries(ratings || {}).filter(([, r]) => (
    r && Number(r.rating) > 0
  ));
  const ratedCount = ratedEntries.length;

  // ---------- Hours from watched runtime ----------
  const totalRuntime = watchedMovies.reduce((sum, m) => (
    sum + (Number(m.runtime) > 0 ? Number(m.runtime) : 0)
  ), 0);
  const hours = totalRuntime / 60;
  // Just the number — the label ("كم ساعة" / "Hours") carries the unit,
  // so the value stays compact like the other support stats.
  const hoursText = totalRuntime > 0
    ? `${Number.isInteger(hours) ? hours : hours.toFixed(1)}`
    : (watchedCount > 0 ? t.my2026_soon : '0');

  const average = ratedCount
    ? ratedEntries.reduce((sum, [, r]) => sum + Number(r.rating), 0) / ratedCount
    : 0;

  const ratingByKey = {};
  ratedEntries.forEach(([k, r]) => { ratingByKey[k] = r; });

  const activityKeys = new Set([
    ...watchedKeys,
    ...ratedEntries.map(([k]) => k),
  ]);
  const activityMovies = [...activityKeys].map(k => movieByKey.get(k)).filter(Boolean);
  const activityCount = activityMovies.length;

  const countBy = (items, getKey) => {
    const counts = {};
    items.forEach((item) => {
      const key = getKey(item);
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  };
  const topFromCounts = (counts) => (
    Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [null, 0]
  );
  const genreCounts = countBy(activityMovies, m => m.genre);
  const [topGenre, topGenreCount] = topFromCounts(genreCounts);
  const topGenreLabel = topGenre
    ? (lang === 'en' ? (G[topGenre]?.en || topGenre) : (G[topGenre]?.ar || topGenre))
    : t.my2026_not_enough;

  const vibeCounts = {};
  ratedEntries.forEach(([, r]) => {
    (Array.isArray(r.vibes) ? r.vibes : []).forEach((v) => {
      vibeCounts[v] = (vibeCounts[v] || 0) + 1;
    });
  });
  const [topVibe] = topFromCounts(vibeCounts);
  const vibeLabelMap = {
    bigscreen: t.rate_v_bigscreen,
    cinema: t.rate_v_bigscreen,
    stream: t.rate_v_stream,
    friends: t.rate_v_friends,
    family: t.rate_v_family,
    skip: t.rate_v_skip,
    date: t.rate_v_date,
    alone: t.rate_v_alone,
  };
  const topVibeLabel = topVibe ? (vibeLabelMap[topVibe] || topVibe) : t.my2026_not_enough;

  const hasDominance = (count) => activityCount >= 3 && count >= 3 && (count / activityCount) >= 0.4;
  const genreDominates = (...genres) => {
    const count = activityMovies.filter(m => genres.includes(m.genre) || genres.includes(m.mood)).length;
    return { count, ok: hasDominance(count) };
  };
  const languageDominates = (...languages) => {
    const count = activityMovies.filter(m => languages.includes(m.language)).length;
    return { count, ok: hasDominance(count) };
  };
  const vibeDominates = (...vibes) => {
    const count = vibes.reduce((sum, v) => sum + (vibeCounts[v] || 0), 0);
    return { count, ok: hasDominance(count) };
  };
  const metadataSaudiCount = activityMovies.filter(m => (
    m.country === 'sa' || m.origin === 'saudi' || m.market === 'saudi' || m.saudi === true
  )).length;

  const countFallback = () => {
    if (watchedCount >= 26) return { key: 'p26', label: t.my2026_p26, line: t.my2026_p26_line };
    if (watchedCount >= 11) return { key: 'p11', label: t.my2026_p11, line: t.my2026_p11_line };
    if (watchedCount >= 4)  return { key: 'p4',  label: t.my2026_p4,  line: t.my2026_p4_line  };
    if (watchedCount >= 1)  return { key: 'p1',  label: t.my2026_p1,  line: t.my2026_p1_line  };
    return { key: 'p0', label: t.my2026_p0, line: t.my2026_p0_line };
  };

  let personality = countFallback();
  const bigscreen = vibeDominates('bigscreen', 'cinema');
  const social = vibeDominates('friends');
  const arabic = languageDominates('ar');
  const horror = genreDominates('horror');
  const thrill = genreDominates('action', 'thriller');
  const family = genreDominates('family', 'animation');
  const comedy = genreDominates('comedy');
  const deep = genreDominates('drama');
  const variety = activityCount >= 3
    && Object.keys(genreCounts).length >= 3
    && (!topGenreCount || (topGenreCount / activityCount) < 0.4);

  if (bigscreen.ok) personality = { key: 'bigscreen', label: t.my2026_bigscreen, line: t.my2026_bigscreen_line };
  else if (hasDominance(metadataSaudiCount)) personality = { key: 'saudi', label: t.my2026_saudi, line: t.my2026_saudi_line };
  else if (arabic.ok) personality = { key: 'arabic', label: t.my2026_arabic, line: t.my2026_arabic_line };
  else if (horror.ok) personality = { key: 'horror', label: t.my2026_horror, line: t.my2026_horror_line };
  else if (thrill.ok) personality = { key: 'thrill', label: t.my2026_thrill, line: t.my2026_thrill_line };
  else if (family.ok) personality = { key: 'family', label: t.my2026_family, line: t.my2026_family_line };
  else if (comedy.ok) personality = { key: 'comedy', label: t.my2026_comedy, line: t.my2026_comedy_line };
  else if (deep.ok) personality = { key: 'deep', label: t.my2026_deep, line: t.my2026_deep_line };
  else if (social.ok) personality = { key: 'social', label: t.my2026_social, line: t.my2026_social_line };
  else if (variety) personality = { key: 'variety', label: t.my2026_variety, line: t.my2026_variety_line };

  const byRecentSignal = (item) => Number(ratingByKey[item.key]?.ts || 0);
  const byReleaseDate = (item) => new Date(item.movie.date || 0).getTime();
  const topRated = ratedEntries
    .map(([key, r]) => ({ key, movie: movieByKey.get(key), rating: Number(r.rating), ts: Number(r.ts || 0) }))
    .filter(item => item.movie)
    .sort((a, b) => b.rating - a.rating || b.ts - a.ts || new Date(b.movie.date) - new Date(a.movie.date));
  const watchedOnly = watchedMovies
    .map(movie => ({ key: keyOf(movie), movie, rating: Number(ratingByKey[keyOf(movie)]?.rating || 0) || null }))
    .sort((a, b) => byRecentSignal(b) - byRecentSignal(a) || byReleaseDate(b) - byReleaseDate(a));
  const savedOnly = movies
    .filter(m => watchlist?.has(keyOf(m)))
    .map(movie => ({ key: keyOf(movie), movie, rating: Number(ratingByKey[keyOf(movie)]?.rating || 0) || null }))
    .sort((a, b) => byReleaseDate(a) - byReleaseDate(b));
  const seenTopKeys = new Set();
  const topMovies = [];
  [topRated, watchedOnly, savedOnly].forEach((bucket) => {
    bucket.forEach((item) => {
      if (topMovies.length >= 4 || seenTopKeys.has(item.key)) return;
      seenTopKeys.add(item.key);
      topMovies.push(item);
    });
  });

  return {
    watchedCount,
    watchedMovies,
    ratedCount,
    hoursText,
    averageText: average ? `${average.toFixed(1)}/5` : t.my2026_not_yet,
    topGenre,
    topGenreLabel,
    topVibe,
    topVibeLabel,
    topMovies,
    insight: personality.line || t.my2026_insight_empty,
    personality: personality.label,
    personalityKey: personality.key,
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
function My2026Lite({ lang, movies, watched, ratings, watchlist, onJumpCalendar, onMarkWatched }) {
  const t = window.CINEMAP_I18N[lang];
  const cardRef = useRef(null);
  const trackedRef = useRef(false);
  const profile = useMemo(
    () => buildMy2026Profile({ lang, movies, watched, ratings, watchlist }),
    [lang, movies, watched, ratings, watchlist]
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

  // Released films the user hasn't watched yet — surfaced inline in the empty
  // state with a one-tap "شفته" so the first interaction takes seconds.
  const emptyReleasedSuggestions = useMemo(() => {
    if (!empty || !Array.isArray(movies)) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const watchedSet = watched instanceof Set ? watched : new Set();
    return movies
      .filter(m => {
        const isReleased = m.status === 'released' || (m.date && new Date(m.date) < today);
        if (!isReleased) return false;
        const k = `${m.en}|${m.date}`;
        return !watchedSet.has(k);
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  }, [empty, movies, watched]);

  return (
    <section id="my2026" className="cm-section cm-my2026-section">
      <div className="cm-container">
        <div ref={cardRef} className={`cm-my2026 ${empty ? 'is-empty' : ''}`}>
          <div className="cm-my2026-head">
            <span className="cm-eyebrow">{t.my2026_title}</span>
            <h3 className="cm-my2026-title">{t.my2026_list_title}</h3>
            <p className="cm-my2026-sub">{t.my2026_brand_line}</p>
          </div>

          <div className="cm-my2026-profile">
            <div className="cm-my2026-identity">
              <span>{t.my2026_personality}</span>
              <strong>{profile.personality}</strong>
            </div>
            <div className="cm-my2026-hero-stat">
              <strong>{profile.watchedCount}</strong>
              <span>{profile.watchedCount === 1 ? t.my2026_movie_unit : t.my2026_movie_unit_pl}</span>
            </div>
          </div>

          <div className="cm-my2026-stat-grid">
            <div className="cm-my2026-stat">
              <span>{t.my2026_time}</span>
              <strong>{profile.hoursText}</strong>
            </div>
            <div className="cm-my2026-stat">
              <span>{t.my2026_avg}</span>
              <strong>{profile.averageText}</strong>
            </div>
            <div className="cm-my2026-stat">
              <span>{t.my2026_vibe}</span>
              <strong>{profile.topVibeLabel}</strong>
            </div>
          </div>

          {profile.topMovies.length > 0 && (
            <div className="cm-my2026-top">
              <h4>{t.my2026_top_movies}</h4>
              <div className="cm-my2026-top-grid">
                {profile.topMovies.map((item) => (
                  <div key={item.key} className="cm-my2026-top-card">
                    <div className="cm-my2026-top-poster">
                      <window.CinePoster movie={item.movie} compact />
                    </div>
                    <span>{window.movieTitle(item.movie, lang)}</span>
                    {item.rating ? <b>{item.rating}/5</b> : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="cm-my2026-insight">{profile.insight}</p>

          {empty && (
            <div className="cm-my2026-empty">
              <div>
                <h4>{t.my2026_empty_title}</h4>
                <p>{t.my2026_empty_body}</p>
              </div>
              {emptyReleasedSuggestions.length > 0 && (
                <ul className="cm-my2026-quick" role="list">
                  {emptyReleasedSuggestions.map(m => (
                    <li key={`${m.en}|${m.date}`} className="cm-my2026-quick-row">
                      <div className="cm-my2026-quick-poster">
                        <window.CinePoster movie={m} compact />
                      </div>
                      <div className="cm-my2026-quick-meta">
                        <span className="cm-my2026-quick-title">{window.movieTitle(m, lang)}</span>
                      </div>
                      <button
                        className="cm-btn cm-btn-primary cm-btn-sm cm-my2026-quick-btn"
                        onClick={() => onMarkWatched?.(m)}
                      >
                        ✓ {t.watched}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button className="cm-link-cta cm-my2026-alt-cta" onClick={clickEmptyCta}>
                {t.my2026_empty_alt_cta}
              </button>
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
        {/* Label removed per UX feedback — the stars speak for themselves
            on a "your list" surface. The aria-label keeps it accessible. */}
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
                    {/* dir="auto" lets the browser detect direction from the
                        first strong character. Mixed-script titles like
                        "Greenland 2: Migration" and digit-leading ones like
                        "28 Years Later: The Bone Temple" pick LTR (first
                        strong char is the leading Latin letter), Arabic
                        titles pick RTL. */}
                    <h4 className="cm-wl-title" dir="auto">{window.movieTitle(m, lang)}</h4>
                    <div className="cm-wl-date" dir="auto">{window.fmtDate(m.date, lang)}</div>
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
          <window.CinemapLogo height={28} variant="horizontal" lang={lang} />
          <p className="cm-footer-tag">{t.footer_tag}</p>
        </div>
        <div className="cm-footer-right">
          <span className="cm-footer-links">
            <a href="about.html">{t.footer_about}</a>
            <a href="privacy.html">{t.footer_privacy}</a>
            <a href="terms.html">{t.footer_terms}</a>
            <a
              href="mailto:hello@cinemap.me"
              aria-label={t.footer_contact}
            >{t.footer_contact}</a>
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
