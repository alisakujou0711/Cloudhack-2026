import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, EDUCATION_LEVELS, suggestedOptimizationType } from '../context/AppContext';

// What the desk will put in front of them first, in the words the picker uses for it.
const SUGGESTED_DOCUMENT = {
  university: 'University application',
  internship: 'Resume',
};

// The arrival cascade, in reading order. Declared here rather than in CSS because the error
// line appears between the fields and the button, and nth-child would renumber everything
// under it the moment it does.
const rise = (step) => ({ '--rise-step': step });

export default function OnboardingPage() {
  const { setProfile } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !educationLevel || !location.trim()) {
      setError('Add your name, education level, and location to continue.');
      return;
    }
    setProfile({ name: name.trim(), educationLevel, location: location.trim() });
    navigate('/app/optimize');
  };

  const trimmedName = name.trim();
  const trimmedLocation = location.trim();
  const levelLabel = EDUCATION_LEVELS.find((lvl) => lvl.value === educationLevel)?.label || '';
  const opensWith = educationLevel ? SUGGESTED_DOCUMENT[suggestedOptimizationType(educationLevel)] : '';
  // The same expression the seven assessment modules derive independently — stated here so the
  // card can show the consequence before it is committed to, not to make the decision.
  const international = Boolean(trimmedLocation) && !/singapore/i.test(trimmedLocation);

  return (
    <div className="onboard">
      <section className="onboard-panel">
        <div className="onboard-inner">
          <p className="onboard-rise onboard-wordmark" style={rise(0)}>
            Portify
          </p>
          <h1 className="onboard-rise onboard-headline" style={rise(1)}>
            Tell us who&apos;s applying.
          </h1>
          <p className="onboard-rise onboard-deck" style={rise(2)}>
            Your name, where you are in your education, and where you&apos;re based. All three shape
            the feedback that comes back.
          </p>

          <form onSubmit={handleSubmit} className="onboard-form">
            <div className="onboard-rise onboard-field" style={rise(3)}>
              <label className="onboard-label" htmlFor="onboard-name">
                Name
              </label>
              <input
                id="onboard-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                autoFocus
                placeholder="Jane Tan"
              />
            </div>

            {/* Three options, all visible: a select would hide the choice that decides which
                document the desk opens with. */}
            <fieldset className="onboard-rise onboard-choice" style={rise(4)}>
              <legend className="onboard-label">Education level</legend>
              <div className="onboard-levels">
                {EDUCATION_LEVELS.map((lvl) => (
                  <label
                    key={lvl.value}
                    className={educationLevel === lvl.value ? 'onboard-level is-picked' : 'onboard-level'}
                  >
                    <input
                      type="radio"
                      name="educationLevel"
                      value={lvl.value}
                      checked={educationLevel === lvl.value}
                      onChange={() => setEducationLevel(lvl.value)}
                    />
                    <span className="onboard-level-dot" aria-hidden="true" />
                    <span className="onboard-level-name">{lvl.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="onboard-rise onboard-field" style={rise(5)}>
              <label className="onboard-label" htmlFor="onboard-location">
                Where you&apos;re based
              </label>
              <input
                id="onboard-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                autoComplete="country-name"
                placeholder="Singapore"
              />
            </div>

            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="onboard-rise btn-primary onboard-submit" style={rise(6)}>
              Choose a document
            </button>
          </form>

          <p className="onboard-rise onboard-footnote" style={rise(7)}>
            Saved to your account. Every review reads them.
          </p>
        </div>
      </section>

      <aside className="onboard-desk">
        <article className="onboard-card" style={rise(3)}>
          <header className="onboard-card-head">
            <h2>Student file</h2>
          </header>

          <p className={trimmedName ? 'onboard-card-name is-set' : 'onboard-card-name'}>
            {trimmedName || 'Your name'}
          </p>
          <p className={levelLabel || trimmedLocation ? 'onboard-card-meta is-set' : 'onboard-card-meta'}>
            {[levelLabel, trimmedLocation].filter(Boolean).join(', ') || 'Not filled in yet'}
          </p>

          <div className="onboard-card-rule" />

          {/* Each resolved line is remounted on the value that produced it, so changing an
              answer replays the arrival rather than swapping text in place. */}
          <dl className="onboard-card-rows">
            <div className="onboard-card-row">
              <dt>Opens with</dt>
              {opensWith ? (
                <dd key={opensWith} className="onboard-card-val is-resolved">
                  {opensWith}
                </dd>
              ) : (
                <dd className="onboard-card-val">Pick an education level</dd>
              )}
            </div>

            {/* Deliberately unkeyed: keying this on the location would remount it — and replay
                the arrival — on every keystroke of "Malaysia". It should land once, when the
                answer stops being Singapore. */}
            {international && (
              <div className="onboard-card-row onboard-card-intl">
                <dt>Applying from abroad</dt>
                <dd className="onboard-card-val is-resolved">
                  🌍 Reviews will flag visa and work-pass timing, transcript equivalency, and English
                  proficiency.
                </dd>
              </div>
            )}
          </dl>
        </article>
      </aside>
    </div>
  );
}
