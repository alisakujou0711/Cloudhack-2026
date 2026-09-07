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

// The three things a student does to their account that are not credentials, above the rule, and
// the destructive one below it.
function ContactSupport() {
  return (
    <div className="settings-row">
      <div>
        <p className="settings-row-label">Contact support</p>
        <p className="settings-row-value">Ask a question about your account or report something wrong.</p>
      </div>
      <div className="settings-row-actions">
        {/* Deliberately inert: the surface is here so the shape of the card is the finished one,
            and the tooltip is what keeps a button that answers a press with nothing legible as
            planned rather than broken. */}
        <button type="button" className="btn-ghost" title="Support is planned — this button doesn't do anything yet.">
          Contact support
        </button>
      </div>
    </div>
  );
}

// The whole state document, written out as JSON the student can keep somewhere the product cannot
// reach. No endpoint: the client already holds the document the server would send back, so this is
// the resume export's anchor-and-object-URL pattern over a blob built here.
function DownloadMyData() {
  const { exportDocument } = useApp();
  const [downloaded, setDownloaded] = useConfirmation();

  const handleDownload = () => {
    // Indented, because the point of the file is that it can be read — a student opening it should
    // find their essays and history, not one line of JSON.
    const blob = new Blob([JSON.stringify(exportDocument(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfoliopath-data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  return (
    <div className="settings-row">
      <div>
        <p className="settings-row-label">Download my data</p>
        <p className="settings-row-value">
          Everything on this account — your profile, drafts, reviews, history and chat — as one JSON file.
        </p>
      </div>
      <div className="settings-row-actions">
        {downloaded && (
          <span className="settings-saved" role="status">
            Downloaded
          </span>
        )}
        <button type="button" className="btn-ghost" onClick={handleDownload}>
          Download
        </button>
      </div>
    </div>
  );
}

// The same action the avatar menu offers, in the other place someone looks for it. Signing out
// drops any queued write and resets state, so nothing here has to tidy up after it.
function SignOutRow() {
  const { signOut } = useAuth();
  const [pending, setPending] = useState(false);

  const handleSignOut = async () => {
    setPending(true);
    // `signOut` clears the session whether or not the request succeeded, so the routing gate takes
    // this page off the screen either way and there is no failure to report.
    await signOut();
  };

  return (
    <div className="settings-row">
      <div>
        <p className="settings-row-label">Sign out</p>
        <p className="settings-row-value">Ends this session on this device. Everything you have saved stays.</p>
      </div>
      <div className="settings-row-actions">
        <button type="button" className="btn-ghost" onClick={handleSignOut} disabled={pending}>
          {pending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  );
}

// Moved here from the History page, unchanged: a two-step inline confirmation (never
// `window.confirm`), no password, and the wipe happening on the server rather than only here. It
// was kept off the header because Sign out is its neighbour there; settings is where it belongs
// now that settings exists, and two near-identical destructive confirmations on two pages would be
// worse than either placement.
function ClearMyData() {
  const { clearData } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setClearing(true);
    setError('');
    try {
      await clearData();
      // Nothing to tidy up afterwards: the profile goes with the document, so the routing gate
      // takes this page off the screen and lands the person back in onboarding.
    } catch (err) {
      setError(err.message);
      setClearing(false);
    }
  };

  return (
    <>
      <div className="settings-row">
        <div>
          <p className="settings-row-label">Clear my data</p>
          <p className="settings-row-value">
            Wipes your profile, history, drafts and saved assessments from this account and takes you
            back to onboarding. Your account itself stays — you will still be signed in.
          </p>
        </div>
        <div className="settings-row-actions">
          {!confirming && (
            <button type="button" className="btn-ghost settings-danger-trigger" onClick={() => setConfirming(true)}>
              Clear my data
            </button>
          )}
        </div>
      </div>

      {confirming && (
        <div className="settings-confirm">
          <p>This cannot be undone. Everything on this account goes back to how it looked the day you signed up.</p>
          <div className="settings-confirm-actions">
            <button type="button" className="btn-danger" onClick={confirm} disabled={clearing}>
              {clearing ? 'Clearing...' : 'Yes, clear everything'}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setConfirming(false);
                setError('');
              }}
              disabled={clearing}
            >
              Cancel
            </button>
          </div>
          {error && <p className="error-text">{error}</p>}
        </div>
      )}
    </>
  );
}

// The last thing anybody does on this page, and the only one nothing recovers from — see
// docs/adr/0004-account-deletion-is-immediate.md for why there is no emailed confirmation and no
// grace period. Guarded twice: the two-step inline confirmation its neighbour above uses, and the
// account password. The password is the stronger of the two — it proves the person at the keyboard
// owns the account and the server can actually verify it, where a typed confirmation word is only
// a client-side speed bump.
function DeleteAccount() {
  const { deleteAccount } = useAuth();
  const { settlePendingWrites } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Backing out at either step has to leave the account exactly as it was found, password field
  // included — a typed password left lying behind a collapsed panel is the one thing this control
  // must not keep.
  const cancel = () => {
    setConfirming(false);
    setPassword('');
    setError('');
  };

  const confirm = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Enter your password to delete your account.');
      return;
    }
    setError('');
    setDeleting(true);
    // The same sequence "Clear my data" runs, and for a sharper version of the same reason: a
    // debounced write still queued or already on the wire would arrive at a deleted row and trip
    // the central session-expired handling in the middle of this. Editing the profile and
    // immediately deleting the account is the path that finds it.
    const resumePendingSave = await settlePendingWrites();
    try {
      await deleteAccount(password);
      // Nothing to tidy up afterwards: the account is gone with its session, the auth context is
      // cleared, and the routing gate takes this page off the screen on its way to sign-in.
    } catch (err) {
      // A wrong password comes back 400, so it lands here beside the field that asked for it and
      // the account is untouched. The write cancelled a moment ago is unsaved work, so it goes
      // back in the queue.
      resumePendingSave();
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="settings-row">
        <div>
          <p className="settings-row-label">Delete account</p>
          <p className="settings-row-value">
            Deletes your account, the email and password you sign in with, and everything you have
            saved. This cannot be undone.
          </p>
        </div>
        <div className="settings-row-actions">
          {!confirming && (
            <button type="button" className="btn-ghost settings-danger-trigger" onClick={() => setConfirming(true)}>
              Delete account
            </button>
          )}
        </div>
      </div>

      {confirming && (
        <form className="settings-confirm" onSubmit={confirm}>
          <p>
            This cannot be undone. Your account and everything on it are deleted immediately, and
            nothing brings them back. You can sign up again with the same email address, and you
            would start from an empty account.
          </p>

          <label htmlFor="settings-delete-password">
            Your password
            <input
              id="settings-delete-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <div className="settings-confirm-actions">
            <button type="submit" className="btn-danger" disabled={deleting}>
              {deleting ? 'Deleting...' : 'Yes, delete my account'}
            </button>
            <button type="button" className="btn-ghost" onClick={cancel} disabled={deleting}>
              Cancel
            </button>
          </div>

          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </>
  );
}

// What a student does to their account rather than to their work. The rule below the ordinary rows
// is the card's one structural rule: everything under it is destructive.
function AccountActionsCard() {
  return (
    <section className="card settings-card">
      <div className="settings-card-head">
        <h2>Account actions</h2>
        <p className="subtitle">Your account itself, rather than the work on it.</p>
      </div>

      <ContactSupport />

      <DownloadMyData />

      <SignOutRow />

      <div className="settings-danger">
        <ClearMyData />

        <DeleteAccount />
      </div>
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

      <AccountActionsCard />
    </div>
  );
}
