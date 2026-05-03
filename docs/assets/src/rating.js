/* global React */
const { useState, useEffect } = window.React;

const LS_RATINGS = 'cinemap-ratings';

// ---------- Local persistence ----------
function loadRatings() {
  try { return JSON.parse(localStorage.getItem(LS_RATINGS) || '{}') || {}; }
  catch { return {}; }
}
function saveRatingFor(key, payload) {
  try {
    const all = loadRatings();
    all[key] = { ...payload, ts: new Date().toISOString() };
    localStorage.setItem(LS_RATINGS, JSON.stringify(all));
  } catch {}
}
window.cinemapLoadRatings = loadRatings;
window.cinemapSaveRatingFor = saveRatingFor;

// Read this user's rating for a movie (Cinemap Score data source).
// Returns { rating, vibes, reaction, ts } or null. Future: layer in
// aggregated cloud data (from Formspree-fed JSON) for true cross-user
// score, but right now this just returns the local user's rating.
window.cinemapMovieScore = function(movieKey) {
  if (!movieKey) return null;
  const all = loadRatings();
  const r = all[movieKey];
  if (!r || !r.rating) return null;
  return r;
};

// ---------- Background submit to Formspree ----------
// Same endpoint as Notify; differentiated by _subject so they're easy to
// filter in Formspree → CSV → Sheets later.
window.cinemapSendRating = async function sendRating({ movie, rating, vibes, reaction, contact, lang }) {
  const url = window.CINEMAP_CONFIG?.notifyEndpoint;
  if (!url) return { ok: false, error: 'no-endpoint' };

  const payload = {
    type: 'rating',
    name:     contact?.name || '',
    email:    contact?.email || '',
    movie:    movie.en,
    movieAr:  movie.ar,
    releaseDate: movie.date,
    genre:    movie.genre,
    rating:   rating || 0,
    vibes:    Array.isArray(vibes) ? vibes.join(',') : '',
    reaction: reaction || '',
    language: lang,
    ratingConsent: true,
    ratingConsentAt: new Date().toISOString(),
    privacyPolicyVersion: '2026-05-02',
    timestamp: new Date().toISOString(),
    _subject: `Cinemap rating: ${movie.en} (${rating || '-'}/5)`,
  };

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      let body = null;
      try { body = await r.json(); } catch {}
      return { ok: false, error: body?.error || `HTTP ${r.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || 'network' };
  }
};

// ---------- Vibe taxonomy ----------
function vibesFor(t) {
  return [
    { id: 'bigscreen', icon: '🎬', label: t.rate_v_bigscreen },
    { id: 'stream',    icon: '🛋', label: t.rate_v_stream    },
    { id: 'friends',   icon: '👥', label: t.rate_v_friends   },
    { id: 'date',      icon: '💛', label: t.rate_v_date      },
    { id: 'alone',     icon: '🌙', label: t.rate_v_alone     },
    { id: 'skip',      icon: '🚫', label: t.rate_v_skip      },
  ];
}

// ---------- StarRow ----------
function StarRow({ value, onPick, lang }) {
  const [hover, setHover] = useState(0);
  const stars = [1, 2, 3, 4, 5];
  const visual = hover || value;
  return (
    <div
      className="cm-rate-stars"
      role="radiogroup"
      aria-label="rating"
      onMouseLeave={() => setHover(0)}
      // Lock LTR so star indices read 1..5 left-to-right in both AR and EN
      style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
    >
      {stars.map(n => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          className={`cm-rate-star ${n <= visual ? 'is-on' : ''}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onPick(n === value ? 0 : n)}
        >
          {n <= visual ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}

// ---------- RatingSheet ----------
// Opened automatically the moment a user marks a movie as watched (off → on).
// Pre-fills with previous values if they're editing an existing rating.
function RatingSheet({ open, lang, movie, onClose, onSubmitted }) {
  const t = window.CINEMAP_I18N[lang];
  const movieKey = movie ? movie.en + '|' + movie.date : null;
  const existing = movieKey ? (loadRatings()[movieKey] || {}) : {};

  const [stars, setStars]     = useState(existing.rating || 0);
  const [vibes, setVibes]     = useState(new Set(existing.vibes || []));
  const [reaction, setReaction] = useState(existing.reaction || '');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState(null);

  // Reset when the sheet opens for a different movie
  useEffect(() => {
    if (!open || !movie) return;
    const cur = loadRatings()[movieKey] || {};
    setStars(cur.rating || 0);
    setVibes(new Set(cur.vibes || []));
    setReaction(cur.reaction || '');
    setConsent(false);
    setError(null);
  }, [open, movieKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && !submitting) onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose, submitting]);

  if (!open || !movie) return null;

  const handleClose = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!submitting) onClose();
  };

  const toggleVibe = (id) => {
    setVibes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Require at least one of: stars, a vibe, or a reaction. Pure-empty
    // submission is a no-op (use Skip for that).
    if (!stars && vibes.size === 0 && !reaction.trim()) {
      setError(t.rate_need_star);
      return;
    }
    if (!consent) {
      setError(t.rate_need_consent);
      return;
    }

    const vibesArr = [...vibes];
    const payload = {
      rating: stars,
      vibes: vibesArr,
      reaction: reaction.trim(),
      privacyConsent: true,
      privacyConsentAt: new Date().toISOString(),
      privacyPolicyVersion: '2026-05-02',
    };

    setSubmitting(true);
    saveRatingFor(movieKey, payload);

    // Ratings now flow to Supabase through the anonymous event tracker in
    // app.js. Keep Formspree for contact/reminder submissions only so the
    // inbox does not fill with rating emails.
    setSubmitting(false);

    onSubmitted({ payload, networkOk: true });
  };

  const movieTitle = window.movieTitle(movie, lang);
  const dateStr = window.fmtDate(movie.date, lang);
  const vibeOptions = vibesFor(t);

  return window.ReactDOM.createPortal(
    <div className="cm-rate-overlay" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="cm-rate" onClick={(e) => e.stopPropagation()}>
        <div className="cm-rate-head">
          <span className="cm-rate-grip" aria-hidden="true" />
          <button
            type="button"
            className="cm-rate-x"
            onClick={handleClose}
            aria-label={t.rate_close}
            title={t.rate_close}
            disabled={submitting}
          >×</button>

          <div className="cm-rate-bell" aria-hidden="true">🎬</div>
          <h3 className="cm-rate-title">{t.rate_title}</h3>
          <p className="cm-rate-sub">{t.rate_sub}</p>
          <div className="cm-rate-movie">
            <strong className="cm-rate-movie-name">{movieTitle}</strong>
            <span className="cm-rate-movie-date">· {dateStr}</span>
          </div>
        </div>

        <form className="cm-rate-form" onSubmit={handleSubmit}>
          <div className="cm-rate-section">
            <span className="cm-rate-lbl">{t.rate_stars_lbl}</span>
            <StarRow value={stars} onPick={setStars} lang={lang} />
          </div>

          <div className="cm-rate-section">
            <span className="cm-rate-lbl">{t.rate_vibes_lbl}</span>
            <div className="cm-rate-vibes">
              {vibeOptions.map(v => {
                const on = vibes.has(v.id);
                return (
                  <button
                    key={v.id}
                    type="button"
                    className={`cm-rate-vibe ${on ? 'is-on' : ''}`}
                    onClick={() => toggleVibe(v.id)}
                    aria-pressed={on}
                  >
                    <span className="cm-rate-vibe-icon" aria-hidden="true">{v.icon}</span>
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="cm-rate-section">
            <input
              type="text"
              className="cm-rate-reaction"
              value={reaction}
              onChange={(e) => { setReaction(e.target.value); setError(null); }}
              placeholder={t.rate_reaction_ph}
              maxLength={140}
            />
          </div>

          <label className="cm-consent-row">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => { setConsent(e.target.checked); setError(null); }}
              required
            />
            <span>
              {t.rate_consent}{' '}
              <a href="privacy.html" target="_blank" rel="noopener">{t.footer_privacy}</a>
            </span>
          </label>

          {error && <div className="cm-rate-error">{error}</div>}

          <div className="cm-rate-actions">
            <button
              type="button"
              className="cm-btn cm-btn-ghost"
              onClick={handleClose}
              disabled={submitting}
            >{t.rate_skip}</button>
            <button
              type="submit"
              className="cm-btn cm-btn-primary"
              disabled={submitting}
            >{submitting ? t.rate_sending : t.rate_submit}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

window.RatingSheet = RatingSheet;
