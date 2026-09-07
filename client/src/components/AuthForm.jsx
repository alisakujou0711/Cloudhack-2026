import { useState } from 'react';

// Shared shell for the two auth screens — same two fields, same failure handling; only the
// wording and the submit handler differ.
export default function AuthForm({ subtitle, submitLabel, pendingLabel, passwordHint, passwordAutoComplete, onSubmit, footer }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
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
    <div className="page-center">
      <div className="card onboarding-card">
        <h1>PortfolioPath</h1>
        <p className="subtitle">{subtitle}</p>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="jane@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={passwordAutoComplete}
              placeholder={passwordHint}
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? pendingLabel : submitLabel}
          </button>
        </form>
        <p className="auth-alt">{footer}</p>
      </div>
    </div>
  );
}
