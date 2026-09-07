import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useApp, EDUCATION_LEVELS } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

// How long the "Saved" line stays up. Long enough to be read on the way to the next thing, short
// enough that it is gone before it becomes part of the page.
const CONFIRMATION_MS = 2500;

// The account's minimum, restated where the new password is typed rather than left to be guessed.
// The server enforces it too and stays the authority (`server/services/auth.js`); this copy exists
// so the rule is on screen before the field is submitted.
const PASSWORD_MIN_LENGTH = 8;

// A confirmation that retires itself, and can be retired early — one left standing beside a
// control that is ready to be pressed again reads as though the next change had been saved too.
function useConfirmation() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!shown) return undefined;
    const timer = setTimeout(() => setShown(false), CONFIRMATION_MS);
    return () => clearTimeout(timer);
  }, [shown]);

  return [shown, setShown];
}

// The three profile facts, edited together and saved with one button. Saving goes through the
// ordinary profile setter and therefore the ordinary debounced whole-document write — the button
// expresses intent, it is not a second persistence path.
function ProfileCard() {
  const { profile, setProfile } = useApp();
  const [name, setName] = useState(profile.name);
  const [educationLevel, setEducationLevel] = useState(profile.educationLevel);
  const [location, setLocation] = useState(profile.location);
  const [error, setError] = useState('');
  const [saved, setSaved] = useConfirmation();

  // Every field edit retires the confirmation: "Saved" left standing beside a freshly re-enabled
  // Save button reads as though the new edit had been saved too.
  const edit = (setField) => (e) => {
    setSaved(false);
    setField(e.target.value);
  };

  // Compared trimmed, because trimmed is what a save would actually write: a stray trailing space
  // is not a change, and offering to save it would be lying about there being unsaved work.
  const next = { name: name.trim(), educationLevel, location: location.trim() };
  const dirty =
    next.name !== profile.name ||
    next.educationLevel !== profile.educationLevel ||
    next.location !== profile.location;

  const handleSubmit = (e) => {
    e.preventDefault();
    // All three stay required, as at onboarding: the profile is what the whole app reads, and a
    // half-erased one is worse than an out-of-date one.
    if (!next.name || !next.educationLevel || !next.location) {
      setSaved(false);
      setError('Add your name, education level, and location to save.');
      return;
    }
    setError('');
    setProfile(next);
    // Confirms the edit was taken, not that the write has landed — the PUT follows on the usual
    // 800ms debounce and a failed one is console-only, as everywhere else in the app. An explicit
    // button that answers a press with nothing at all reads as broken, which is why this exists.
    setSaved(true);
  };

  return (
    <section className="card settings-card">
      <div className="settings-card-head">
        <h2>Profile</h2>
        <p className="subtitle">
          Your name, where you are in your education, and where you&apos;re based. Every review reads
          all three.
        </p>
      </div>

      <form className="settings-fields" onSubmit={handleSubmit}>
        <label htmlFor="settings-name">
          Name
          <input
            id="settings-name"
            value={name}
            onChange={edit(setName)}
            autoComplete="name"
            placeholder="Jane Tan"
          />
        </label>

        {/* The same three-option radio group onboarding uses, for the same reason it rejected a
            select there: all three levels stay visible, so switching is a choice rather than a
            reveal. */}
        <fieldset className="settings-choice">
          <legend>Education level</legend>
          <div className="onboard-levels">
            {EDUCATION_LEVELS.map((lvl) => (
              <label
                key={lvl.value}
                className={educationLevel === lvl.value ? 'onboard-level is-picked' : 'onboard-level'}
              >
                <input
                  type="radio"
                  name="settings-education-level"
                  value={lvl.value}
                  checked={educationLevel === lvl.value}
                  onChange={edit(setEducationLevel)}
                />
                <span className="onboard-level-dot" aria-hidden="true" />
                <span className="onboard-level-name">{lvl.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label htmlFor="settings-location">
          Where you&apos;re based
          <input
            id="settings-location"
            value={location}
            onChange={edit(setLocation)}
            autoComplete="country-name"
            placeholder="Singapore"
          />
        </label>

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}

        <div className="settings-actions">
          <button type="submit" className="btn-primary" disabled={!dirty}>
            Save changes
          </button>
          {saved && (
            <span className="settings-saved" role="status">
              Saved
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

// The email address is part of the account, not the profile: it is what sign-in matches, so it
// takes an endpoint of its own rather than riding the state document's whole-document write, and
// the form asks for the current password (`server/services/auth.js:99`).
function EmailChange() {
  const { account, changeEmail } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [changed, setChanged] = useConfirmation();

  const close = () => {
    setOpen(false);
    setEmail('');
    setCurrentPassword('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = email.trim();
    if (!next || !currentPassword) {
      setError('Enter a new email address and your current password.');
      return;
    }
    setError('');
    setPending(true);
    try {
      await changeEmail(next, currentPassword);
      close();
      setChanged(true);
    } catch (err) {
      // Everything the endpoint refuses — a wrong password, an address someone else holds —
      // belongs here beside the control. A dead session is the one message that arrives here
      // without belonging to the form, and it is harmless: the API client has already cleared the
      // auth context by the time it lands, so the routing gate is on its way out of the page.
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="settings-row">
        <div>
          <p className="settings-row-label">Email address</p>
          <p className="settings-row-value">{account?.email}</p>
        </div>
        <div className="settings-row-actions">
          {changed && (
            <span className="settings-saved" role="status">
              Email updated
            </span>
          )}
          {!open && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setChanged(false);
                setOpen(true);
              }}
            >
              Change
            </button>
          )}
        </div>
      </div>

      {open && (
        <form className="settings-fields" onSubmit={handleSubmit}>
          <label htmlFor="settings-email">
            New email address
            <input
              id="settings-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="jane@example.com"
            />
          </label>

          <label htmlFor="settings-email-password">
            Current password
            <input
              id="settings-email-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}

          <div className="settings-actions">
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? 'Changing…' : 'Change email'}
            </button>
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </>
  );
}

// The current password first, so an unattended session cannot be used to lock the owner out, and
// the new one twice, so a typo does not silently become the password. Succeeding revokes every
// other session on the account and keeps this one — the point of the feature, and the reason
// nothing here has to touch AuthContext: the held account is unchanged.
function PasswordChange() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [changed, setChanged] = useConfirmation();

  const close = () => {
    setOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmation('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmation) {
      setError('Enter your current password, then the new one twice.');
      return;
    }
    // Both rules are enforced on the server too. Refusing them here means a typo is answered by
    // the fields that made it, rather than by a round trip that has already been sent.
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setError(`Your new password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmation) {
      setError('The two new passwords don’t match.');
      return;
    }
    setError('');
    setPending(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      close();
      setChanged(true);
    } catch (err) {
      // A wrong current password comes back 400, so it lands here beside the field that asked for
      // it — the session is fine, and the central session-expired handling never sees it.
      setError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="settings-row">
        <div>
          <p className="settings-row-label">Password</p>
          <p className="settings-row-value">
            Changing it signs out every other device and keeps you signed in here.
          </p>
        </div>
        <div className="settings-row-actions">
          {changed && (
            <span className="settings-saved" role="status">
              Password updated
            </span>
          )}
          {!open && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setChanged(false);
                setOpen(true);
              }}
            >
              Change
            </button>
          )}
        </div>
      </div>

      {open && (
        <form className="settings-fields" onSubmit={handleSubmit}>
          <label htmlFor="settings-current-password">
            Current password
            <input
              id="settings-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <label htmlFor="settings-new-password">
            New password
            <input
              id="settings-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              aria-describedby="settings-new-password-hint"
            />
            <span id="settings-new-password-hint" className="settings-hint">
              At least {PASSWORD_MIN_LENGTH} characters
            </span>
          </label>

          <label htmlFor="settings-confirm-password">
            New password again
            <input
              id="settings-confirm-password"
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}

          <div className="settings-actions">
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? 'Changing…' : 'Change password'}
            </button>
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </>
  );
}

// The two credentials the account signs in with, in one card because they are guarded the same
// way: neither will change anything without the current password.
function AccountSecurityCard() {
  return (
    <section className="card settings-card">
      <div className="settings-card-head">
        <h2>Account and security</h2>
        <p className="subtitle">
          What you sign in with. Both changes ask for your current password, and you stay signed in
          here.
        </p>
      </div>

      <EmailChange />

      <PasswordChange />
    </section>
  );
}

export default function AccountSettingsPage() {
  return (
    <div className="settings">
      <header className="settings-head">
        <h1>Account settings</h1>
        <p className="subtitle">What the app knows about you, and what you can do about it.</p>
      </header>

      <ProfileCard />

      <AccountSecurityCard />

      {/* Filled in by the account actions, including the ones that move here from History. */}
      <section className="card settings-card">
        <div className="settings-card-head">
          <h2>Account actions</h2>
        </div>
      </section>
    </div>
  );
}
