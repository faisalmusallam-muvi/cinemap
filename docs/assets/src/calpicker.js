/* global React */
const { useEffect } = window.React;

// ---------- CalendarPicker ----------
// Single bottom-sheet for picking which calendar service to add the movie
// to. Shared by both the row's 📅 button and the modal's "Add to Calendar"
// button — keeps the UX consistent and avoids the dropdown-clipped-by-the-
// sticky-footer bug.
function CalendarPicker({ open, lang, movie, onClose }) {
  const t = window.CINEMAP_I18N[lang];

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open || !movie) return null;

  const handleClose = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    onClose();
  };

  const title = window.movieTitle(movie, lang);
  const date  = window.fmtDate(movie.date, lang);
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/i.test(ua);
  const appleNote = isIOS && !isSafari ? t.apple_cal_ios_hint : t.apple_cal_hint;

  // Each handler closes the sheet right after firing the action.
  const goGoogle = () => {
    window.cinemapTrackMovie?.('calendar_add', movie, { service: 'google' });
    if (typeof window.googleCalUrl === 'function') {
      window.open(window.googleCalUrl(movie, lang), '_blank', 'noopener');
    }
    onClose();
  };
  const goApple = () => {
    window.cinemapTrackMovie?.('calendar_add', movie, { service: 'apple_ical' });
    if (typeof window.downloadIcal === 'function') {
      window.downloadIcal(movie, lang);
    }
    onClose();
  };
  const goOutlook = () => {
    window.cinemapTrackMovie?.('calendar_add', movie, { service: 'outlook' });
    if (typeof window.outlookCalUrl === 'function') {
      window.open(window.outlookCalUrl(movie, lang), '_blank', 'noopener');
    }
    onClose();
  };

  return window.ReactDOM.createPortal(
    <div className="cm-cal-overlay" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="cm-cal" onClick={(e) => e.stopPropagation()}>
        <div className="cm-cal-head">
          <span className="cm-cal-grip" aria-hidden="true" />
          <button
            type="button"
            className="cm-cal-x"
            onClick={handleClose}
            aria-label={t.close}
            title={t.close}
          >×</button>

          <div className="cm-cal-icon" aria-hidden="true">📅</div>
          <h3 className="cm-cal-title">{t.cal_pick_title}</h3>
          <p className="cm-cal-sub">{t.cal_pick_sub}</p>
          <div className="cm-cal-movie">
            <strong className="cm-cal-movie-name">{title}</strong>
            <span className="cm-cal-movie-date">· {date}</span>
          </div>
        </div>

        <div className="cm-cal-options">
          <button className="cm-cal-option" onClick={goGoogle}>
            <span className="cm-cal-option-icon" style={{ background: '#4285F4', color: '#fff' }}>G</span>
            <span className="cm-cal-option-lbl">{t.google_cal}</span>
            <span className="cm-cal-option-arrow" aria-hidden="true">›</span>
          </button>
          <button className="cm-cal-option" onClick={goApple}>
            <span className="cm-cal-option-icon" style={{ background: '#1d1d1f', color: '#fff' }}>🍎</span>
            <span className="cm-cal-option-copy">
              <span className="cm-cal-option-lbl">{t.apple_cal}</span>
              <span className="cm-cal-option-note">{appleNote}</span>
            </span>
            <span className="cm-cal-option-arrow" aria-hidden="true">›</span>
          </button>
          <button className="cm-cal-option" onClick={goOutlook}>
            <span className="cm-cal-option-icon" style={{ background: '#0078D4', color: '#fff' }}>O</span>
            <span className="cm-cal-option-lbl">{t.outlook_cal}</span>
            <span className="cm-cal-option-arrow" aria-hidden="true">›</span>
          </button>
        </div>

        <div className="cm-cal-foot">
          <button type="button" className="cm-btn cm-btn-ghost" onClick={handleClose}>
            {t.cal_cancel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

window.CalendarPicker = CalendarPicker;
