import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { useApp, EDUCATION_LEVELS } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { initialsFrom, toneFrom } from '../utils/avatar';

// How long the "Saved" line stays up. Long enough to be read on the way to the next thing, short
// enough that it is gone before it becomes part of the page.
const CONFIRMATION_MS = 2500;

// How long a fact on the record stays lit after it is rewritten. Longer than a confirmation,
// because the person's eyes are on the control they just pressed and the record is above it.
const FLASH_MS = 1600;

// The account's minimum, restated where the new password is typed rather than left to be guessed.
// The server enforces it too and stays the authority (`server/services/auth.js`); this copy exists
// so the rule is on screen before the field is submitted.
const PASSWORD_MIN_LENGTH = 8;

// Everything rises into place once, in reading order, the way every other tab arrives. The steps
// are written here rather than derived, because the order is the page's and no band knows where
// it sits.
const rise = (step) => ({ '--rise-step': step });

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

// True for a beat after `value` actually changes, and never on the first render — the record is
// lit when a fact on it is rewritten, not when the page is opened. Watching the value rather than
// being told by the form means every path that can change a fact lights it, including one that
// lands from the other end of the page.
function useChangeFlash(value) {
  const previous = useRef(value);
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    if (previous.current === value) return undefined;
    previous.current = value;
    setFresh(true);
    const timer = setTimeout(() => setFresh(false), FLASH_MS);
    return () => clearTimeout(timer);
  }, [value]);

  return fresh;
}

// One fact of the record. The value is keyed on itself so a rewrite remounts it and the tick plays
// again — without that, changing the same field twice in quick succession would light the rule and
// leave the value sitting there as though nothing had been written.
function RecordField({ label, value }) {
  const fresh = useChangeFlash(value);

  return (
    <div className={fresh ? 'record-field is-fresh' : 'record-field'}>
      <p className="record-field-label">{label}</p>
      <p className="record-field-value" key={String(value)}>
        {value}
      </p>
    </div>
  );
}

// "March 2026" from the ISO string the account carries. A date that cannot be read is not
// something to report as broken on this page — the line simply says nothing.
function monthAndYear(iso) {
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

// The head of the page: the file the rest of it edits. Nothing here is a control — every fact on
// it is changed further down, and lights when it is.
function RecordHead() {
  const { profile, history } = useApp();
  const { account } = useAuth();

  const name = profile?.name || '';
  const level = EDUCATION_LEVELS.find((lvl) => lvl.value === profile?.educationLevel);
  const reviews = history.length;

  return (
    <section className="record">
      <div className="record-identity">
        <span className={`record-disc avatar-tone-${toneFrom(name)}`} aria-hidden="true">
          {initialsFrom(name)}
        </span>
        <div className="record-names">
          <h2 className="record-name">{name}</h2>
          <p className="record-email">{account?.email}</p>
        </div>
      </div>

      <div className="record-fields">
        <RecordField label="Education level" value={level ? level.label : '—'} />
        <RecordField label="Based in" value={profile?.location || '—'} />
        <RecordField label="On file since" value={monthAndYear(account?.createdAt)} />
        <RecordField
          label="In your log"
          value={reviews === 0 ? 'Nothing yet' : `${reviews} ${reviews === 1 ? 'review' : 'reviews'}`}
        />
      </div>
    </section>
  );
}

// One of the three panels. The deck is the single thing worth knowing before touching anything in
// the card — anything longer belongs on the row it applies to, or nowhere.
function SettingsSection({ title, deck, step, children }) {
  return (
    <section className="card settings-card rise" style={rise(step)}>
      <div className="settings-card-head">
        <h2>{title}</h2>
        <p className="subtitle">{deck}</p>
      </div>
      {children}
    </section>
  );
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
    <SettingsSection
      title="Profile"
      deck="Every review you run reads all three."
      step={2}
    >
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
          {/* Unsaved work is worth saying out loud on a page you can leave by pressing an avatar.
              It takes the slot the confirmation takes, so the row never grows. */}
          {dirty && !saved && <span className="settings-pending">Not saved yet</span>}
          {saved && (
            <span className="settings-saved" role="status">
              Saved
            </span>
          )}
        </div>
      </form>
    </SettingsSection>
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
          <p className="settings-row-value is-data">{account?.email}</p>
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
        <form className="settings-fields is-opened" onSubmit={handleSubmit}>
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
          <p className="settings-row-value">Signs out every other device.</p>
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
        <form className="settings-fields is-opened" onSubmit={handleSubmit}>
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

// The two credentials the account signs in with, in one band because they are guarded the same
// way: neither will change anything without the current password.
function AccountSecurityCard() {
  return (
    <SettingsSection title="Account and security" deck="Both changes ask for your current password." step={3}>
      <EmailChange />

      <PasswordChange />
    </SettingsSection>
  );
}

// The three things a student does to their account that are not credentials, above the rule, and
// the destructive one below it.
function ContactSupport() {
  return (
    <div className="settings-row">
      <div>
        <p className="settings-row-label">Contact support</p>
        <p className="settings-row-value">Ask a question or report a problem.</p>
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

// Rounded the way a file listing rounds it: a download is being sized up before it is taken, not
// audited, so one figure past the point is as much as the number is worth.
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

// The whole state document, written out as JSON the student can keep somewhere the product cannot
// reach. No endpoint: the client already holds the document the server would send back, so this is
// the resume export's anchor-and-object-URL pattern over a blob built here.
function DownloadMyData() {
  const { exportDocument } = useApp();
  const [downloaded, setDownloaded] = useConfirmation();
  // The state object itself, whose identity changes only when the document does — which is what
  // makes it the right thing to memoize on.
  const stateDocument = exportDocument();

  // Serialized once per change to the document rather than once per render, and handed to the
  // download itself — so the size on screen is the size of the file that arrives rather than an
  // estimate of it. Indented, because the point of the file is that it can be read: a student
  // opening it should find their essays and history, not one line of JSON.
  const json = useMemo(() => JSON.stringify(stateDocument, null, 2), [stateDocument]);
  const size = useMemo(() => formatBytes(new Blob([json]).size), [json]);

  const handleDownload = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portify-data.json';
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
        <p className="settings-row-value">Everything on this account as one JSON file, {size}.</p>
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
        <p className="settings-row-value">Ends this session on this device. Your work stays.</p>
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
            Wipes everything you have saved and takes you back to onboarding. Your account stays.
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
        <div className="settings-confirm is-opened">
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
          <p className="settings-row-value">Deletes your account and everything on it, for good.</p>
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
        <form className="settings-confirm is-opened" onSubmit={confirm}>
          <p>
            This cannot be undone. Your account and everything on it are deleted immediately. You can
            sign up again with the same email address and start from an empty account.
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

// What a student does to their account rather than to their work. The rule below the ordinary
// rows is the band's one structural division: everything under it is destructive.
function AccountActionsCard() {
  return (
    <SettingsSection title="Account actions" deck="Your account itself, rather than the work on it." step={4}>
      <ContactSupport />

      <DownloadMyData />

      <SignOutRow />

      <div className="settings-danger">
        <ClearMyData />

        <DeleteAccount />
      </div>
    </SettingsSection>
  );
}

export default function AccountSettingsPage() {
  const { profile } = useApp();

  // The room takes the account's own colour — the tone the header avatar has worn since the
  // profile was written — so the disc on the record and the rule that lights when a fact changes
  // are the one loud thing here, and they are a different colour on every account.
  const tone = toneFrom(profile?.name || '');

  return (
    <div className={`settings settings-tone-${tone}`}>
      <h1 className="settings-headline rise" style={rise(0)}>
        You, on file.
      </h1>

      <div className="rise" style={rise(1)}>
        <RecordHead />
      </div>

      <ProfileCard />

      <AccountSecurityCard />

      <AccountActionsCard />
    </div>
  );
}
