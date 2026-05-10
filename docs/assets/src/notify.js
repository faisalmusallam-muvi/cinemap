/* global React */
const { useState, useEffect, useRef } = window.React;

const LS_CONTACT = 'cinemap-notify-contact';

// ---------- Contact persistence ----------
function loadContact() {
  try { return JSON.parse(localStorage.getItem(LS_CONTACT) || 'null'); }
  catch { return null; }
}
function saveContact(c) {
  try { localStorage.setItem(LS_CONTACT, JSON.stringify(c)); }
  catch {}
}
window.cinemapLoadContact = loadContact;
window.cinemapSaveContact = saveContact;

// ---------- Validation ----------
function isValidEmail(s) {
  if (!s) return false;
  // Basic but practical email check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

// ---------- Submit to Formspree ----------
// Returns { ok: true } on success, { ok: false, error: string } otherwise.
window.cinemapSendNotify = async function sendNotify({ contact, movie, lang }) {
  const url = window.CINEMAP_CONFIG?.notifyEndpoint;
  if (!url) return { ok: false, error: 'no-endpoint' };

  const payload = {
    type: 'notify',
    name: contact.name || '',
    email: contact.email,
    whatsapp: contact.whatsapp || '',
    city: contact.city || '',
    privacyConsent: !!contact.privacyConsent,
    privacyConsentAt: contact.privacyConsentAt || '',
    privacyPolicyVersion: contact.privacyPolicyVersion || '2026-05-02',
    movie: movie.en,
    movieAr: movie.ar,
    releaseDate: movie.date,
    genre: movie.genre,
    language: lang,
    timestamp: new Date().toISOString(),
    // Formspree-specific: subject line for the email notification
    _subject: `Cinemap notify: ${movie.en} (${movie.date})`,
  };

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
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

// ---------- NotifyCapture popup ----------
// Shown the FIRST time a user clicks "Notify Me" — captures contact info,
// submits the first reminder request, then the parent persists the contact
// so future requests can fire silently in the background.
function NotifyCapture({ open, lang, movie, onClose, onSubmitted }) {
  const t = window.CINEMAP_I18N[lang];
  const initial = loadContact() || { name: '', email: '', whatsapp: '', city: '' };
  const [name, setName]         = useState(initial.name || '');
  const [email, setEmail]       = useState(initial.email || '');
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp || '');
  const [city, setCity]         = useState(initial.city || '');
  const [consent, setConsent]   = useState(!!initial.privacyConsent);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState(null);
  const nameInputRef  = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const unlock = window.lockBodyScroll();
    // Focus the first empty field (name first, else email)
    setTimeout(() => {
      if (!name) nameInputRef.current?.focus();
      else if (!email) emailInputRef.current?.focus();
    }, 50);
    return () => { window.removeEventListener('keydown', onKey); unlock(); };
  }, [open, onClose]);

  if (!open || !movie) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const trimmedName  = name.trim();
    const trimmedEmail = email.trim();
    // Name is optional — only email is required for the reminder to work.
    if (!trimmedEmail) { setError(t.notify_required); return; }
    if (!isValidEmail(trimmedEmail)) { setError(t.notify_invalid); return; }
    if (!consent) { setError(t.notify_consent_required); return; }

    setSubmitting(true);
    const contact = {
      name:     trimmedName,
      email:    trimmedEmail,
      whatsapp: whatsapp.trim(),
      city:     city.trim(),
      privacyConsent: true,
      privacyConsentAt: new Date().toISOString(),
      privacyPolicyVersion: '2026-05-02',
    };
    const res = await window.cinemapSendNotify({ contact, movie, lang });
    setSubmitting(false);

    if (!res.ok) {
      setError(t.notify_error);
      return;
    }
    saveContact(contact);
    onSubmitted({ contact });
  };

  const movieTitle = window.movieTitle(movie, lang);
  const dateStr = window.fmtDate(movie.date, lang);

  return window.ReactDOM.createPortal(
    <div className="cm-notify-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cm-notify" onClick={(e) => e.stopPropagation()}>
        <button className="cm-notify-x" onClick={onClose} aria-label={t.close}>×</button>

        <div className="cm-notify-head">
          <div className="cm-notify-bell" aria-hidden="true">🔔</div>
          <h3 className="cm-notify-title">{t.notify_title}</h3>
          <p className="cm-notify-sub">{t.notify_sub}</p>
        </div>

        <div className="cm-notify-movie">
          <span className="cm-notify-movie-lbl">{t.notify_for}</span>
          <strong className="cm-notify-movie-name">{movieTitle}</strong>
          <span className="cm-notify-movie-date">· {dateStr}</span>
        </div>

        <form className="cm-notify-form" onSubmit={handleSubmit} noValidate>
          <label className="cm-notify-field">
            <span className="cm-notify-lbl">{t.notify_name_optional}</span>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder={t.notify_name_ph}
              autoComplete="name"
            />
          </label>

          <label className="cm-notify-field">
            <span className="cm-notify-lbl">{t.notify_email} *</span>
            <input
              ref={emailInputRef}
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder={t.notify_email_ph}
              required
              autoComplete="email"
            />
          </label>

          <label className="cm-notify-field">
            <span className="cm-notify-lbl">{t.notify_whatsapp}</span>
            <input
              type="tel"
              dir="ltr"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder={t.notify_whatsapp_ph}
              autoComplete="tel"
            />
          </label>

          <label className="cm-notify-field">
            <span className="cm-notify-lbl">{t.notify_city}</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t.notify_city_ph}
            />
          </label>

          <label className="cm-consent-row">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => { setConsent(e.target.checked); setError(null); }}
              required
            />
            <span>
              {t.notify_consent}{' '}
              <a href="privacy.html" target="_blank" rel="noopener">{t.footer_privacy}</a>
            </span>
          </label>

          {error && <div className="cm-notify-error">{error}</div>}

          <div className="cm-notify-actions">
            <button
              type="button"
              className="cm-btn cm-btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >{t.notify_skip}</button>
            <button
              type="submit"
              className="cm-btn cm-btn-primary"
              disabled={submitting}
            >{submitting ? t.notify_sending : t.notify_submit}</button>
          </div>

          <p className="cm-notify-privacy">{t.notify_privacy}</p>
        </form>
      </div>
    </div>,
    document.body
  );
}

window.NotifyCapture = NotifyCapture;
