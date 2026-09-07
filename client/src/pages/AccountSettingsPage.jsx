import { useEffect, useState } from 'react';
import { useApp, EDUCATION_LEVELS } from '../context/AppContext';

// How long the "Saved" line stays up. Long enough to be read on the way to the next thing, short
// enough that it is gone before it becomes part of the page.
const CONFIRMATION_MS = 2500;

// The three profile facts, edited together and saved with one button. Saving goes through the
// ordinary profile setter and therefore the ordinary debounced whole-document write — the button
// expresses intent, it is not a second persistence path.
function ProfileCard() {
  const { profile, setProfile } = useApp();
  const [name, setName] = useState(profile.name);
  const [educationLevel, setEducationLevel] = useState(profile.educationLevel);
  const [location, setLocation] = useState(profile.location);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return undefined;
    const timer = setTimeout(() => setSaved(false), CONFIRMATION_MS);
    return () => clearTimeout(timer);
  }, [saved]);

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

export default function AccountSettingsPage() {
  return (
    <div className="settings">
      <header className="settings-head">
        <h1>Account settings</h1>
        <p className="subtitle">What the app knows about you, and what you can do about it.</p>
      </header>

      <ProfileCard />

      {/* Filled in by the email and password controls. */}
      <section className="card settings-card">
        <div className="settings-card-head">
          <h2>Account and security</h2>
        </div>
      </section>

      {/* Filled in by the account actions, including the ones that move here from History. */}
      <section className="card settings-card">
        <div className="settings-card-head">
          <h2>Account actions</h2>
        </div>
      </section>
    </div>
  );
}
