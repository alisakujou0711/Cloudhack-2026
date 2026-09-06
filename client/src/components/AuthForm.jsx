import { useState } from 'react';
import AuthShowcase from './AuthShowcase';

// Shared shell for the two auth screens — same two fields, same failure handling; only the
// wording and the submit handler differ. The showcase panel beside the form is identical on
// both, so it lives here rather than in either page.
export default function AuthForm({
  headline,
  subtitle,
  submitLabel,
  pendingLabel,
  passwordHint,
  passwordAutoComplete,
  onSubmit,
  footer,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }
    setError('');
    setPending(true);
    try {
      await onSubmit(email.trim(), password);
      // On success this screen unmounts as the routing gate redirects, so `pending` is only
      // ever cleared on the failure path.
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  };

  return (
    <div className="auth-screen">
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <p className="auth-wordmark">PortfolioPath</p>
          <h1 className="auth-headline">{headline}</h1>
          <p className="auth-deck">{subtitle}</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                placeholder="jane@example.com"
              />
            </div>

            <div className="auth-field">
              <label className="auth-field-label" htmlFor="auth-password">
                Password
              </label>
              <div className="auth-password">
                <input
                  id="auth-password"
                  type={revealed ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={passwordAutoComplete}
                  aria-describedby={passwordHint ? 'auth-password-hint' : undefined}
                />
                <button
                  type="button"
                  className="auth-reveal"
                  onClick={() => setRevealed((v) => !v)}
                  aria-pressed={revealed}
                >
                  {revealed ? 'Hide' : 'Show'}
                </button>
              </div>
              {passwordHint && (
                <p id="auth-password-hint" className="auth-hint">
                  {passwordHint}
                </p>
              )}
            </div>

            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary auth-submit" disabled={pending}>
              {pending ? pendingLabel : submitLabel}
            </button>
          </form>

          <p className="auth-alt">{footer}</p>
        </div>
      </section>

      <AuthShowcase />
    </div>
  );
}
