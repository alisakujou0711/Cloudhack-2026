import { useEffect, useState } from 'react';

// The auth screen's hero is the product's own mechanic rather than a picture of it: a draft
// being marked up, in the same idiom ResumeReviewEditor uses — the weak line struck through,
// the stronger one written underneath, the reason kept in the margin. The copy is synthetic and
// written for this screen; no account's work is ever shown here.
const REVISIONS = [
  {
    original: 'I have always been passionate about computer science.',
    revised: 'I started writing code to settle an argument about when the 174 actually arrives.',
    note: 'Anyone could write this line. Open on the moment instead.',
  },
  {
    original: "During my internship I helped improve the team's data pipeline.",
    revised: 'Over ten weeks I rewrote the ingestion job and cut the nightly run from 40 minutes to 6.',
    note: '"Helped improve" hides you. Name the work, then what moved.',
  },
  {
    original: 'I am a hard worker with strong communication skills.',
    revised: 'I ran the Friday demo for eight weeks, which is where I learned to explain a rollback to non-engineers.',
    note: 'Adjectives do not travel. Show the evidence for them.',
  },
];

const CLOSING_LINE = 'Two years on I still open that timetable script whenever a route changes.';

const STRIKE_MS = 900;
const TYPE_STEP_MS = 22;
const CHARS_PER_STEP = 2;
const SETTLE_MS = 1150;
const HOLD_MS = 2800;
const RESET_FADE_MS = 420;
const RESET_MS = 550;

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

export default function AuthShowcase() {
  const reduced = usePrefersReducedMotion();
  const [phases, setPhases] = useState(() => REVISIONS.map(() => 'original'));
  const [typed, setTyped] = useState(() => REVISIONS.map(() => 0));
  // The page fades out before the loop starts over. Clearing in place would show the struck
  // lines outliving their replacements for as long as the strike takes to fade.
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    // Reduced motion gets the finished page instead of the pass that produces it — the same
    // information, arrived at without movement.
    if (reduced) return undefined;

    let alive = true;
    let timer = null;
    const wait = (ms) =>
      new Promise((resolve) => {
        timer = setTimeout(resolve, ms);
      });
    const setAt = (setter, index, value) =>
      setter((prev) => prev.map((item, i) => (i === index ? value : item)));

    (async () => {
      while (alive) {
        for (let i = 0; i < REVISIONS.length; i += 1) {
          setAt(setPhases, i, 'striking');
          await wait(STRIKE_MS);
          if (!alive) return;

          setAt(setPhases, i, 'typing');
          const { revised } = REVISIONS[i];
          for (let c = CHARS_PER_STEP; c < revised.length; c += CHARS_PER_STEP) {
            setAt(setTyped, i, c);
            await wait(TYPE_STEP_MS);
            if (!alive) return;
          }
          setAt(setTyped, i, revised.length);
          setAt(setPhases, i, 'applied');
          await wait(SETTLE_MS);
          if (!alive) return;
        }

        await wait(HOLD_MS);
        if (!alive) return;
        setResetting(true);
        await wait(RESET_FADE_MS);
        if (!alive) return;
        setPhases(REVISIONS.map(() => 'original'));
        setTyped(REVISIONS.map(() => 0));
        await wait(80);
        if (!alive) return;
        setResetting(false);
        await wait(RESET_MS);
        if (!alive) return;
      }
    })();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [reduced]);

  return (
    <aside className="auth-desk">
      <p className="auth-desk-lede">Every change comes with its reason.</p>

      {/* Hidden from assistive tech: mid-keystroke text reads as gibberish, and the lede above
          already says what the page is doing. */}
      <article className="auth-page" aria-hidden="true">
        <header className="auth-page-head">
          <h2>Personal statement</h2>
          <p>Draft 3, 641 words</p>
        </header>

        <div className={resetting ? 'auth-page-body is-resetting' : 'auth-page-body'}>
          {REVISIONS.map((revision, i) => {
            const phase = reduced ? 'applied' : phases[i];
            const written = reduced ? revision.revised : revision.revised.slice(0, typed[i]);
            return (
              <div className={`auth-para is-${phase}`} key={revision.original}>
                <p className="auth-note">{revision.note}</p>
                <div className="auth-lines">
                  <p className="auth-line auth-line-original">
                    <span>{revision.original}</span>
                  </p>
                  {/* The untyped remainder is rendered but hidden, so the replacement's
                      line breaks and height are reserved from the start and nothing on the
                      page moves while it is being written. */}
                  <p className="auth-line auth-line-revised">
                    <span className="auth-ink">
                      {written}
                      {phase === 'typing' && <i className="auth-caret" />}
                    </span>
                    <span className="auth-ghost">{revision.revised.slice(written.length)}</span>
                  </p>
                </div>
              </div>
            );
          })}

          <div className="auth-para">
            <p className="auth-note" />
            <div className="auth-lines">
              <p className="auth-line auth-line-original">
                <span>{CLOSING_LINE}</span>
              </p>
            </div>
          </div>
        </div>
      </article>
    </aside>
  );
}
