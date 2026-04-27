/* global React */
const { useEffect, useState, useMemo } = window.React;

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

// ---------- Watchlist Section ----------
function WatchlistSection({ lang, watchlist, savedMovies, onRemove, onShareList, onClear, onJumpCalendar, onOpenMovie }) {
  const t = window.CINEMAP_I18N[lang];
  const count = savedMovies.length;
  return (
    <section id="watchlist" className="cm-section cm-watchlist">
      <div className="cm-container">
        <header className="cm-section-head">
          <span className="cm-eyebrow">{t.wl_eyebrow}</span>
          <h2 className="cm-h2">{t.wl_title}</h2>
          <p className="cm-section-sub">{t.wl_sub}</p>
        </header>

        {count === 0 ? (
          <div className="cm-watchlist-empty">
            <div className="cm-watchlist-empty-icon">🎬</div>
            <p className="cm-watchlist-empty-text">{t.wl_empty}</p>
            <button className="cm-btn cm-btn-primary" onClick={onJumpCalendar}>
              {t.wl_empty_cta}
            </button>
          </div>
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
          <span>{t.footer_made}</span>
          <span>{t.footer_subtitle}</span>
        </div>
      </div>
    </footer>
  );
}

// ---------- Toast manager ----------
function Toaster({ toasts, onDismiss }) {
  return (
    <div className="cm-toasts">
      {toasts.map(t => (
        <div key={t.id} className={`cm-toast cm-toast-${t.kind || 'info'}`} onClick={() => onDismiss(t.id)}>
          {t.icon && <span className="cm-toast-icon">{t.icon}</span>}
          <span className="cm-toast-msg">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Journey0, WatchlistSection, InvestorProof, Roadmap, FinalCTA, Footer, Toaster });
