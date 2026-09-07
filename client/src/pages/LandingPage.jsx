import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// The public marketing surface. Everything a visitor reads here is either a fact about the app or
// synthetic demonstration copy derived from `samples/` — never a claim about users, outcomes, or
// adoption, none of which exist. The revisions below obey the same rule the product's own prompts
// do: they sharpen what is already on the page and invent nothing.

const HERO_REVISION = {
  original: 'Responsible for restocking shelves and helping customers.',
  revised: 'Restocked shelves and ran the register through peak hours.',
  reason: '"Responsible for" is the job description, not the work. Start with the verb.',
};

const MARGIN_REVISION = {
  original: 'Analyzed sales data in Excel to see which drinks were popular.',
  revised: 'Analyzed sales data in Excel to rank drinks by volume — the input for the weekend promotion.',
  reason: 'Two bullets on this resume describe one piece of work. Joined up, the analysis has a consequence — and nothing new was added, because the promotion is already on your page.',
};

const DESK_REVISION = {
  original: 'Assisted with a promotion campaign that increased weekend sales.',
  revised: 'Supported a weekend promotion campaign that lifted sales over the period.',
  reason: '"Increased" claims a result the resume does not evidence. Keep the contribution, drop the causation you cannot show.',
};

// The three outcomes a resume bullet can reach. The third is the one students do not expect.
const DECISIONS = [
  {
    state: 'accepted',
    label: 'Accepted',
    original: 'Helped run the company’s Instagram account and posted content regularly.',
    revised: 'Ran the company’s Instagram account, posting on a regular schedule.',
    note: '"Helped run" hides you. You either ran it or you did not.',
  },
  {
    state: 'rejected',
    label: 'Rejected',
    original: 'Trained 3 new part-time staff on store procedures.',
    revised: 'Onboarded three new part-time staff onto store procedures.',
    note: 'You kept your line. The suggestion is struck and the export uses your words.',
  },
  {
    state: 'untouched',
    label: 'Left alone',
    original: 'Built a logistic regression model to predict churn.',
    revised: null,
    note: 'Nothing to sharpen. Roughly a third to half of bullets come back with no suggestion at all.',
  },
];

// These mirror `server/data/universityRequirements.js` for NTU Engineering exactly — baseline GPA,
// the two required subjects, the preferred one, and the competitiveness word. A visitor who signs
// up and runs this must not meet different numbers than the page showed them.
const CHECKLIST = [
  { label: 'Minimum GPA', met: true, detail: '3.8 against a 3.5 baseline' },
  { label: 'Required subject: Mathematics', met: true, detail: 'Found in subjects taken' },
  { label: 'Required subject: Physics', met: false, detail: 'Not found in subjects taken' },
  { label: 'Preferred: Additional Mathematics', met: false, optional: true, detail: 'Strengthens the application' },
  { label: 'Extracurriculars documented', met: true, detail: 'Robotics club, open house volunteer' },
];

const STRIKE_MS = 820;
const TYPE_STEP_MS = 20;
const CHARS_PER_STEP = 2;
const REASON_MS = 460;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

// Fires once, when the element first reaches the viewport. Everything on this page is visible by
// default and only *animates* on entry, so a browser without IntersectionObserver — or a visitor
// who never triggers it — still reads the finished page.
// `rootMargin` is a string rather than an options object on purpose: an object literal is a new
// identity on every render, which would tear the observer down and rebuild it before it could
// deliver its (asynchronous) first callback, and the pass would never run.
function useInView(rootMargin = '-12% 0px -12% 0px') {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setSeen(true);
        observer.disconnect();
      }
    }, { rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, seen];
}

// The signature interaction: one line strikes through, its replacement writes itself underneath,
// and the reason arrives in the margin. Under reduced motion the same three things are simply
// already true — the information without the movement, the way AuthShowcase handles it.
function Revision({ revision, active, reduced, className = '' }) {
  const [phase, setPhase] = useState('original');
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (!active || reduced) return undefined;

    let alive = true;
    let timer = null;
    const wait = (ms) => new Promise((resolve) => { timer = setTimeout(resolve, ms); });

    (async () => {
      setPhase('striking');
      await wait(STRIKE_MS);
      if (!alive) return;

      setPhase('typing');
      const { revised } = revision;
      for (let c = CHARS_PER_STEP; c < revised.length; c += CHARS_PER_STEP) {
        setTyped(c);
        await wait(TYPE_STEP_MS);
        if (!alive) return;
      }
      setTyped(revised.length);
      setPhase('written');
      await wait(REASON_MS);
      if (!alive) return;
      setPhase('applied');
    })();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [active, reduced, revision]);

  // Reduced motion is the only thing that jumps straight to the resolved state. Everything else
  // reads `phase`, which only ever moves forward — showing the applied state *before* the pass has
  // run would make the line revert to its original as it scrolled into view.
  const shown = reduced ? 'applied' : phase;
  const written = reduced ? revision.revised : revision.revised.slice(0, typed);

  return (
    <div className={`lp-revision is-${shown} ${className}`.trim()}>
      <p className="lp-revision-original">
        <span>{revision.original}</span>
      </p>
      {/* The untyped remainder stays in the DOM but transparent, so the replacement's height is
          reserved from the first frame and nothing below it moves while it writes. */}
      <p className="lp-revision-revised">
        <span className="lp-revision-ink">
          {written}
          {shown === 'typing' && <i className="lp-caret" aria-hidden="true" />}
        </span>
        <span className="lp-revision-ghost" aria-hidden="true">
          {revision.revised.slice(written.length)}
        </span>
      </p>
      <p className="lp-revision-reason">{revision.reason}</p>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="lp-mark" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 16 16" className="lp-mark" aria-hidden="true">
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DotIcon() {
  return (
    <svg viewBox="0 0 16 16" className="lp-mark" aria-hidden="true">
      <circle cx="8" cy="8" r="2.4" fill="currentColor" />
    </svg>
  );
}

// A sheet of paper on the desk. `lift` is the quiet entrance every sheet shares; the revision pass
// is the one authored moment and belongs only to the sheets that carry a revision.
function Sheet({ children, className = '', tilt = 0, id }) {
  const [ref, seen] = useInView();
  return (
    <article
      id={id}
      ref={ref}
      className={`lp-sheet ${seen ? 'is-in' : ''} ${className}`.trim()}
      style={tilt ? { '--tilt': `${tilt}deg` } : undefined}
    >
      {/* A sheet that carries a revision needs to know when it arrived, so children may be a
          function of that. */}
      {typeof children === 'function' ? children(seen) : children}
    </article>
  );
}

export default function LandingPage() {
  const reduced = usePrefersReducedMotion();
  // The hero is on screen at load, so it starts its pass immediately rather than waiting to be
  // scrolled 12% into view like the sheets below it.
  const [heroRef, heroSeen] = useInView('0px');
  const [marginRef, marginSeen] = useInView();

  // The desk is dark and the app is light, so the document itself has to carry the ink while this
  // page is mounted — otherwise overscroll rubber-banding flashes the app's pale background.
  useEffect(() => {
    document.documentElement.classList.add('landing-active');
    return () => document.documentElement.classList.remove('landing-active');
  }, []);

  return (
    <div className="landing">
      <header className="lp-header">
        <span className="lp-brand">Portify</span>
        <Link className="lp-signin" to="/signin">Sign in</Link>
      </header>

      <main>
        <section className="lp-hero" ref={heroRef}>
          <div className="lp-hero-copy">
            <h1>Every change comes with its reason.</h1>
            <p className="lp-lede">
              Portify reads the draft you already wrote and marks what is weak, what is
              missing, and what to do instead. On a resume it proposes the sharper line and you
              accept or reject it, one bullet at a time.
            </p>
            <p className="lp-lede lp-lede-tight">Nothing changes without you.</p>
            <div className="lp-actions">
              <Link className="lp-cta" to="/signin">Get started</Link>
              <a className="lp-quiet-link" href="#the-desk">See what it returns</a>
            </div>
          </div>

          <div className="lp-hero-sheet">
            <div className="lp-sheet lp-sheet-hero is-in">
              <header className="lp-sheet-head">
                <h2>Retail Assistant, FairPrice</h2>
                <p>Part-time · Jun 2024 – Present</p>
              </header>
              <Revision revision={HERO_REVISION} active={heroSeen} reduced={reduced} />
              <p className="lp-sheet-quiet">Two other bullets on this page had nothing to change.</p>
            </div>
          </div>
        </section>

        <section className="lp-section lp-margin-section" ref={marginRef}>
          <div className="lp-margin-grid">
            <div className="lp-margin-note">
              <h2>The reason is the point.</h2>
              <p>
                A suggestion you cannot interrogate is just someone else&apos;s writing. Every
                proposed line here carries the argument for it, so you can disagree — and a
                suggestion may never invent a fact, a number, an employer, or an achievement that
                was not already on your page.
              </p>
            </div>
            <div className="lp-sheet lp-sheet-margin is-in">
              <header className="lp-sheet-head">
                <h2>Marketing Intern</h2>
                <p>Internship · May 2025 – Aug 2025</p>
              </header>
              <Revision revision={MARGIN_REVISION} active={marginSeen} reduced={reduced} className="lp-revision-lg" />
            </div>
          </div>
        </section>

        <section className="lp-section" id="the-desk">
          <div className="lp-section-head">
            <h2>Four drafts, four kinds of answer.</h2>
            <p>
              What comes back depends on what you brought. A resume gets line-level suggestions you
              resolve yourself. An application gets a checklist computed against the course&apos;s
              baseline requirements. An essay or a cover letter gets written critique, one piece per
              question you answered.
            </p>
          </div>

          <div className="lp-desk">
            <Sheet className="lp-sheet-resume" tilt={-1.1}>
              {(seen) => (
                <>
                  <p className="lp-sheet-type">Internship resume</p>
                  <Revision revision={DESK_REVISION} active={seen} reduced={reduced} />
                  <div className="lp-decision-row" aria-hidden="true">
                    <span className="lp-chip lp-chip-accept"><CheckIcon />Accept</span>
                    <span className="lp-chip lp-chip-reject"><CrossIcon />Reject</span>
                    <span className="lp-chip">Discuss</span>
                  </div>
                </>
              )}
            </Sheet>

            <Sheet className="lp-sheet-uni" tilt={0.8}>
              <p className="lp-sheet-type">University application</p>
              <div className="lp-uni-head">
                <h3>Nanyang Technological University — Engineering</h3>
                <span className="lp-badge">High</span>
              </div>
              <ul className="lp-checklist">
                {CHECKLIST.map((item) => (
                  <li key={item.label} className={item.met ? 'is-met' : item.optional ? 'is-optional' : 'is-unmet'}>
                    {item.met ? <CheckIcon /> : item.optional ? <DotIcon /> : <CrossIcon />}
                    <span className="lp-check-label">{item.label}</span>
                    <span className="lp-check-detail">{item.detail}</span>
                  </li>
                ))}
              </ul>
              <p className="lp-sheet-quiet">
                3 of 4 required items met. The checklist is computed in code, not written by a
                model. Course requirements cover Singapore universities only, and the baselines are
                simplified demonstration figures — indicative of published ranges, not official
                cutoffs.
              </p>
            </Sheet>

            <Sheet className="lp-sheet-essay" tilt={-0.6}>
              <p className="lp-sheet-type">Essay</p>
              <p className="lp-question">
                &quot;Describe a time you changed your mind about something.&quot;
              </p>
              <p className="lp-critique">
                The hospice section is the strongest thing here: it commits to one scene and lets
                the change happen inside it rather than announcing it. The opening paragraph does
                the opposite, telling the reader you are &quot;a fixer by nature&quot; two
                sentences before the essay proves it. Cut the announcement and let the pantry
                detail carry it. The closing line reaches for a general lesson the specific story
                had already earned more quietly.
              </p>
            </Sheet>

            <Sheet className="lp-sheet-cover" tilt={1.2}>
              <p className="lp-sheet-type">Cover letter</p>
              <p className="lp-question">Prompt: Cover letter — Software Engineering Intern, Stripe</p>
              <p className="lp-critique">
                Four sentences of this letter describe what you want; none describe what Stripe
                gets. &quot;Hard worker and fast learner&quot; is the line every applicant writes,
                so it distinguishes nobody. You name Python and Java but never a thing you built
                with them — the letter has room, and your resume already has the project.
              </p>
            </Sheet>
          </div>
        </section>

        <section className="lp-section lp-decide">
          <div className="lp-section-head">
            <h2>You decide what ships.</h2>
            <p>
              Every suggestion on a resume is a proposal with three possible endings. The export
              takes whatever you settled on.
            </p>
          </div>

          <div className="lp-sheet lp-sheet-decide is-in">
            {DECISIONS.map((row) => (
              <div className={`lp-decision is-${row.state}`} key={row.state}>
                <span className="lp-decision-label">{row.label}</span>
                <div className="lp-decision-lines">
                  <p className="lp-decision-original"><span>{row.original}</span></p>
                  {row.revised && <p className="lp-decision-revised"><span>{row.revised}</span></p>}
                  <p className="lp-decision-note">{row.note}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="lp-footnote">
            Portify does not score your writing. Resume, essay and cover-letter feedback is
            qualitative by design — there is no number to optimize toward.
          </p>
        </section>

        <section className="lp-section lp-more">
          <div className="lp-section-head">
            <h2>The rest of the desk.</h2>
          </div>
          <Sheet className="lp-sheet-index" tilt={-0.5}>
            <p className="lp-sheet-type">Also on the desk</p>
            <div className="lp-more-grid">
              <div className="lp-more-item">
                <h3>Interview prep</h3>
                <p>
                  A plan for a university or internship interview: what to research, what to
                  practise, and what to cut when the interview is three days away rather than three
                  weeks.
                </p>
              </div>
              <div className="lp-more-item">
                <h3>History</h3>
                <p>
                  Every finished review is kept and reopenable, so the draft you worked on in March
                  is still there in October, feedback and all.
                </p>
              </div>
              <div className="lp-more-item">
                <h3>Inspirations</h3>
                <p>
                  Sample essays and resumes written for this app, to read when you are staring at an
                  empty page and need to see the shape of a finished one.
                </p>
              </div>
              <div className="lp-more-item">
                <h3>A chatbot that has read your work</h3>
                <p>
                  It can see your profile and everything you have run, so &quot;why did it suggest
                  that?&quot; is a question you can actually ask.
                </p>
              </div>
            </div>
          </Sheet>
        </section>

        <section className="lp-close">
          <div className="lp-sheet lp-sheet-close is-in">
            <p className="lp-close-line"><span>I am a hard worker with strong communication skills.</span></p>
            <p className="lp-close-caption">Bring the draft you already have.</p>
          </div>
          <div className="lp-close-copy">
            <h2>Start with the weakest thing you wrote.</h2>
            <p>
              Upload it, or paste it in. You will get the specific problem with it and a sharper
              line to consider — and you keep every word you decide to keep.
            </p>
            <Link className="lp-cta" to="/signin">Get started</Link>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <span className="lp-brand">Portify</span>
        <p>
          Works with no API key — feedback falls back to rule-based output, and every report says
          so when it does.
        </p>
        <Link className="lp-quiet-link" to="/signin">Sign in</Link>
      </footer>
    </div>
  );
}
