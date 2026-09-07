import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';


// The public marketing surface. Everything a visitor reads here is either a fact about the app or
// synthetic demonstration copy derived from `samples/` — never a claim about users, outcomes, or
// adoption, none of which exist. The revisions below obey the same rule the product's own prompts
// do: they sharpen what is already on the page and invent nothing.
//
// GSAP owns every programmatic scroll on this page — the hero's gate, the waypoints, and the act's
// step latch. `html.landing-active` therefore must *not* set `scroll-behavior: smooth`: the browser
// animating a scroll GSAP is already animating is a feedback loop, not a nicety.

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);

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

// The three outcomes a resume bullet can reach, in the order the pinned act resolves them. The
// third is the one students do not expect. `heading` is the step's own title — the sheet carries
// the verdict word, so the copy beside it never has to repeat it as a label.
const DECISIONS = [
  {
    state: 'accepted',
    label: 'Accepted',
    heading: 'Take the sharper line.',
    original: 'Helped run the company’s Instagram account and posted content regularly.',
    revised: 'Ran the company’s Instagram account, posting on a regular schedule.',
    note: '"Helped run" hides you. You either ran it or you did not.',
  },
  {
    state: 'rejected',
    label: 'Rejected',
    heading: 'Or keep your own.',
    original: 'Trained 3 new part-time staff on store procedures.',
    revised: 'Onboarded three new part-time staff onto store procedures.',
    note: 'You kept your line. The suggestion is struck and the export uses your words.',
  },
  {
    state: 'untouched',
    label: 'Left alone',
    heading: 'Or find there was nothing to change.',
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

// The parts of the page, in order. The bar reads the current one out and the rail carries a
// waypoint where each begins, so the scroll position is a place in a document rather than a
// percentage — and every one of those places is reachable in a click.
// Every `id` here must exist on a section below or its waypoint is silently dropped.
const CHAPTERS = [
  { id: 'the-draft', label: 'The draft' },
  { id: 'the-reason', label: 'The reason' },
  { id: 'the-desk', label: 'Four drafts' },
  { id: 'your-call', label: 'Your call' },
  { id: 'the-rest', label: 'The rest' },
  { id: 'start', label: 'Start' },
];

const STRIKE_MS = 820;
const TYPE_STEP_MS = 20;
const CHARS_PER_STEP = 2;
const REASON_MS = 460;

const SCROLL_EASE = 'power2.inOut';

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

// Every animated scroll on the page goes through here, so a jump to the next part and a jump to the
// footer are not the same length of animation — a fixed duration makes short moves feel sluggish and
// long ones feel like a cut. Under reduced motion the same call is an instant set.
//
// The tween is held module-side because it is also the lock: while the page is being moved on the
// reader's behalf, nothing else may start moving it. A boolean flag would have to be cleared by
// hand on every exit path, and the one it missed would freeze the page.
let scrollTween = null;

// The act's latch, held module-side so a jump can stand it down. ScrollTrigger runs its snap as its
// own tween on the scroller, which no `overwrite` on a window tween reaches: left armed while the
// page is being moved, it holds the scroll at the step the jump set off from and the jump never
// arrives. Standing it down for the length of the jump is the only thing that settles the argument.
let actLatch = null;

// `autoKill` stays off for the same reason: every writer other than this tween — the latch, the
// browser's own scroll restoration — would otherwise read as the reader taking over. A move the page
// makes on the reader's behalf finishes.
function scrollToY(y, reduced) {
  const target = Math.max(0, Math.round(y));
  const release = () => { if (actLatch) actLatch.enable(); };
  if (actLatch) actLatch.disable(false);
  scrollTween = gsap.to(window, {
    scrollTo: { y: target, autoKill: false },
    duration: reduced ? 0 : gsap.utils.clamp(0.5, 1.4, Math.abs(target - window.scrollY) / 2200),
    ease: SCROLL_EASE,
    overwrite: true,
    onComplete: release,
    // A jump cut short by the next one must still hand the latch back, or the act stops latching
    // for the rest of the visit.
    onInterrupt: release,
  });
  return scrollTween;
}

function scrollIsAnimating() {
  return Boolean(scrollTween && scrollTween.isActive());
}

function documentTopOf(id) {
  const el = document.getElementById(id);
  return el ? el.getBoundingClientRect().top + window.scrollY : null;
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

// How far down the page the visitor is, written straight onto the header as `--lp-scroll` rather
// than held in state: the rail reads it from a composited `scale`, and a React render per scroll
// frame to move a 2px rule would be the most expensive way to draw the cheapest thing on the page.
// The waypoint positions *are* state — they change only when the document's height does, which the
// same observer catches (fonts landing, a resize, the sheets settling). ScrollTrigger's own refresh
// is subscribed too, so the rail and GSAP never disagree about where a chapter begins.
function useScrollNarration(ref) {
  const [waypoints, setWaypoints] = useState([]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    let frame = 0;
    let lastSignature = '';

    const scrollable = () => document.documentElement.scrollHeight - window.innerHeight;

    const paint = () => {
      frame = 0;
      const max = scrollable();
      const value = max > 8 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      node.style.setProperty('--lp-scroll', value.toFixed(4));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const measure = () => {
      const max = scrollable();
      // Every chapter carries a waypoint, the first one included — it is a control now, not a mark,
      // and a part of the document you cannot click back to is not navigation.
      const next = max > 8
        ? CHAPTERS
            .map((chapter) => ({ chapter, el: document.getElementById(chapter.id) }))
            .filter((entry) => entry.el)
            .map(({ chapter, el }) => ({
              id: chapter.id,
              label: chapter.label,
              at: Math.min(1, Math.max(0, (el.getBoundingClientRect().top + window.scrollY) / max)),
            }))
        : [];
      const signature = next.map((point) => `${point.id}:${point.at.toFixed(3)}`).join('|');
      if (signature !== lastSignature) {
        lastSignature = signature;
        setWaypoints(next);
      }
      paint();
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    ScrollTrigger.addEventListener('refresh', measure);

    // The page grows when the webfonts land and when the sheets settle; both change where every
    // chapter begins, and neither fires a resize event.
    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      observer.observe(document.body);
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      ScrollTrigger.removeEventListener('refresh', measure);
      if (observer) observer.disconnect();
    };
  }, [ref]);

  return waypoints;
}

// Which chapter the reader is inside. The band is a thin slice across the upper-middle of the
// viewport: a section owns the bar while that slice is over it, and the last one in the band wins
// so the answer moves forward as the page does.
function useActiveChapter() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const nodes = CHAPTERS.map((chapter) => document.getElementById(chapter.id));
    const visible = new Set();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      if (!visible.size) return;
      let best = 0;
      for (const node of visible) {
        const at = nodes.indexOf(node);
        if (at > best) best = at;
      }
      setIndex(best);
    }, { rootMargin: '-38% 0px -56% 0px' });
    nodes.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return index;
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

// A section heading arrives out of the dark rather than sliding in — the sheets' easing carried on
// blur instead of distance, so a heading and a piece of paper do not perform the same entrance.
function SectionHead({ children, className = '' }) {
  const [ref, seen] = useInView('-18% 0px -14% 0px');
  return (
    <div ref={ref} className={`lp-section-head ${seen ? 'is-in' : ''} ${className}`.trim()}>
      {children}
    </div>
  );
}

// Where each step wants to sit, as a progress value on the act's own trigger: its centre on the
// reading line. Measured live on every call rather than cached, so a webfont landing or a resize
// cannot leave the latch pulling the page to a position the step no longer occupies.
function stepSnapPoints(self, steps, line) {
  const span = self.end - self.start;
  if (span <= 0) return [0];
  return steps.map((el) => {
    const rect = el.getBoundingClientRect();
    const centre = rect.top + window.scrollY + rect.height / 2;
    return gsap.utils.clamp(0, 1, (centre - window.innerHeight * line - self.start) / span);
  });
}

// The pinned act. The sheet holds still, centred in the viewport, while the reader scrolls the
// argument past it, and each step resolves exactly one bullet: struck and replaced, proposed and
// refused, or left alone. The pen in the margin is the continuity — it is what makes scrolling read
// as a pass down a page rather than as a sequence of reveals.
//
// ScrollTrigger drives which step is speaking and latches the scroll onto it. The sheet itself is
// still held by CSS `position: sticky`: pinning a grid column needs `pinSpacing: false`, which
// collapses the column it was holding open.
function DecisionAct({ reduced }) {
  const rootRef = useRef(null);
  const linesRef = useRef(null);
  const rowRefs = useRef([]);
  const [active, setActive] = useState(-1);
  // The steps are held out of focus only while something is actually moving the focus. Under
  // reduced motion the act resolves whole, and dimmed copy nothing will ever brighten is just
  // unread copy.
  const guided = !reduced;

  useGSAP(() => {
    const root = rootRef.current;
    if (!root) return;

    if (reduced) {
      setActive(DECISIONS.length - 1);
      return;
    }

    const steps = gsap.utils.toArray('[data-step]', root);
    if (!steps.length) return;

    const mm = gsap.matchMedia();

    mm.add(
      { wide: '(min-width: 901px)', narrow: '(max-width: 900px)' },
      (context) => {
        // On a phone the sheet is a masthead across the top of the screen, so the line that decides
        // which step is speaking — and where the latch parks it — sits below the sheet rather than
        // at the middle of the viewport.
        const line = context.conditions.wide ? 0.5 : 0.72;
        const edge = `${Math.round(line * 100)}%`;

        steps.forEach((el, i) => {
          ScrollTrigger.create({
            trigger: el,
            start: `top ${edge}`,
            end: `bottom ${edge}`,
            // -1 is the lede: the argument before the first bullet has been judged.
            onToggle: (self) => { if (self.isActive) setActive(i - 1); },
          });
        });

        // The latch. Each step is a full viewport tall, so parking one on the reading line puts its
        // neighbours off-screen entirely — snapping alone would only stop the reader *resting*
        // between two steps, not stop both being legible at once.
        actLatch = ScrollTrigger.create({
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          invalidateOnRefresh: true,
          snap: {
            snapTo: (progress, self) => {
              const points = stepSnapPoints(self, steps, line);
              return points.reduce(
                (best, point) => (Math.abs(point - progress) < Math.abs(best - progress) ? point : best),
                points[0]
              );
            },
            duration: { min: 0.2, max: 0.6 },
            delay: 0.08,
            ease: SCROLL_EASE,
            directional: false,
          },
        });

        // The context kills the trigger on unmount or on a breakpoint change; the module-level
        // handle has to let go of it too, or the next jump enables a dead ScrollTrigger.
        return () => { actLatch = null; };
      }
    );
  }, { scope: rootRef, dependencies: [reduced], revertOnUpdate: true });

  // The rows are different heights, so the pen's travel has to be measured rather than assumed.
  // It is read on the step change — three times over the whole section — and again if the sheet
  // reflows under it.
  useLayoutEffect(() => {
    const lines = linesRef.current;
    if (!lines) return undefined;

    const place = () => {
      // Before the first bullet is judged the measurement falls back to the top of the sheet, so
      // scrolling back up out of the act returns the phone's window to the first line rather than
      // leaving it parked on the last one.
      const row = rowRefs.current[active] || rowRefs.current[0];
      if (!row) return;
      lines.style.setProperty('--pen-y', `${row.offsetTop}px`);
      lines.style.setProperty('--pen-h', `${row.offsetHeight}px`);
    };

    place();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(place);
    observer.observe(lines);
    return () => observer.disconnect();
  }, [active]);

  return (
    <section className="lp-section lp-act" id="your-call" ref={rootRef}>
      <div className="lp-act-grid">
        <div className="lp-act-stage">
          <div className="lp-sheet lp-sheet-act is-in">
            <p className="lp-sheet-type">Internship resume</p>
            <div className={`lp-act-lines ${active >= 0 ? 'has-pen' : ''}`.trim()} ref={linesRef}>
              <span className="lp-pen" aria-hidden="true" />
              {/* The strip is what moves on a phone, where the sheet becomes a window one bullet
                  tall and the paper is drawn up under a pen that stays put. On a wide screen it
                  sits still and the pen travels instead — one measurement, two readings of it. */}
              <div className="lp-act-strip">
                {DECISIONS.map((row, i) => (
                  <div
                    key={row.state}
                    ref={(el) => { rowRefs.current[i] = el; }}
                    className={[
                      'lp-act-row',
                      `is-${row.state}`,
                      i <= active ? 'is-shown' : 'is-pending',
                      i === active ? 'is-live' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <p className="lp-act-original"><span>{row.original}</span></p>
                    {row.revised && <p className="lp-act-revised"><span>{row.revised}</span></p>}
                    <p className="lp-act-verdict">{row.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className={`lp-act-foot ${active >= DECISIONS.length - 1 ? 'is-shown' : ''}`.trim()}>
              The export takes these three lines exactly as they now stand.
            </p>
          </div>
        </div>

        <div className={`lp-act-steps ${guided ? 'is-guided' : ''}`.trim()}>
          <div className={`lp-step is-lede ${active < 0 ? 'is-active' : ''}`.trim()} data-step>
            <h2>You decide what ships.</h2>
            <p>
              Every suggestion on a resume is a proposal with three possible endings. Keep
              scrolling and the pass runs down the page one bullet at a time — the way it will run
              down yours. Nothing here is scored; there is no number to optimize toward.
            </p>
          </div>
          {DECISIONS.map((row, i) => (
            <div key={row.state} data-step className={`lp-step ${i === active ? 'is-active' : ''}`.trim()}>
              <h3>{row.heading}</h3>
              <p>{row.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const reduced = usePrefersReducedMotion();
  // The hero is on screen at load, so it starts its pass immediately rather than waiting to be
  // scrolled 12% into view like the sheets below it.
  const [heroRef, heroSeen] = useInView('0px');
  const [marginRef, marginSeen] = useInView();

  const rootRef = useRef(null);
  const headerRef = useRef(null);
  const waypoints = useScrollNarration(headerRef);
  const chapter = useActiveChapter();
  // The bar belongs to the document, not to the title card: over the hero there is nothing to
  // report and nothing to navigate, so it is not there at all.
  const [barShown, setBarShown] = useState(false);

  // The opening is a curtain rather than a page: the copy resolves out of the dark a line at a
  // time, on the frame after mount so the transition has a state to move from.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // The desk is dark and the app is light, so the document itself has to carry the ink while this
  // page is mounted — otherwise overscroll rubber-banding flashes the app's pale background.
  useEffect(() => {
    document.documentElement.classList.add('landing-active');
    return () => document.documentElement.classList.remove('landing-active');
  }, []);

  const goToChapter = (id) => {
    // The first chapter *is* the top of the page; measuring the hero's own offset would land a bar
    // height short of it.
    if (id === CHAPTERS[0].id) {
      scrollToY(0, reduced);
      return;
    }
    const top = documentTopOf(id);
    if (top === null) return;
    scrollToY(top - (headerRef.current?.offsetHeight || 0) - 20, reduced);
  };

  // Every scroll GSAP owns lives here, scoped to the page root, so a pinned trigger cannot survive
  // the route change into the signed-in app.
  useGSAP(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const mm = gsap.matchMedia();

    // The gate. Inside the hero, a scroll is not a distance — it is a decision to begin reading, so
    // it lands on the first section rather than anywhere between. `preventDefault` is what makes it
    // a gate rather than a suggestion, and it is why the observer is live only for the hero's own
    // band and stood down outright when the hero cannot fit the viewport.
    //
    // The threshold is shared with the top bar: the bar arriving and the reader being handed to the
    // first section are one event, not two that happen to coincide.
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      let gateOn = false;
      // A short landscape phone can leave the hero taller than the screen. Gating a hero the reader
      // cannot finish reading would trap the copy above the fold. Measured on the spot rather than
      // cached: the answer changes when a webfont lands, and a stale `false` disarms the gate for
      // the rest of the session.
      const fitsViewport = () => hero.offsetHeight <= window.innerHeight + 4;
      let fits = fitsViewport();

      const nextTop = () => documentTopOf(CHAPTERS[1].id) ?? window.innerHeight;

      // The in-flight tween is the lock. A second wheel event while the page is already being moved
      // is the reader repeating themselves, not asking for something else.
      const go = (y) => {
        if (!fitsViewport() || scrollIsAnimating()) return;
        scrollToY(y, false);
      };

      // Wheel and touch, read directly rather than through GSAP's Observer. The decision the gate
      // makes — refuse this event, and where to send the reader instead — has to be taken in the
      // event itself, synchronously; Observer's change callbacks are debounced onto the ticker, so
      // the refusal and the answer to it would come from two different frames. GSAP still runs the
      // scroll that follows.
      //
      // A pointer drag is deliberately not gated: inside the hero that is someone selecting the
      // headline, and swallowing it would be the gate overreaching.
      const onWheel = (event) => {
        if (!gateOn) return;
        event.preventDefault();
        if (Math.abs(event.deltaY) < 4) return;
        go(event.deltaY > 0 ? nextTop() : 0);
      };

      let touchFrom = 0;
      const onTouchStart = (event) => { touchFrom = event.touches[0]?.clientY ?? 0; };
      const onTouchMove = (event) => {
        if (!gateOn) return;
        event.preventDefault();
        const travelled = touchFrom - (event.touches[0]?.clientY ?? touchFrom);
        if (Math.abs(travelled) < 24) return;
        go(travelled > 0 ? nextTop() : 0);
      };

      // Non-passive so the gate can actually hold: these are the only listeners on the page that
      // take that cost, and they refuse the event only while `gateOn` is true.
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });

      // Whether the reader is still on the title card, answered by measuring rather than by asking
      // a trigger: `isActive` is not settled while a refresh is in progress, and a gate that reads
      // it there arms itself for a viewport it has already left — or, worse, never arms at all.
      const insideHero = () => window.scrollY < nextTop() - 1;

      const sync = () => { gateOn = insideHero() && fits; };

      const DOWN_KEYS = new Set(['ArrowDown', 'PageDown', ' ', 'Spacebar']);
      const UP_KEYS = new Set(['ArrowUp', 'PageUp', 'Home']);
      const onKey = (event) => {
        if (!gateOn || event.defaultPrevented || event.metaKey || event.ctrlKey) return;
        const down = DOWN_KEYS.has(event.key);
        if (!down && !UP_KEYS.has(event.key)) return;
        // A key aimed at a focused control is that control's, not the gate's.
        if (event.target?.closest?.('a, button, input, textarea, select, [contenteditable]')) return;
        event.preventDefault();
        go(down ? nextTop() : 0);
      };
      window.addEventListener('keydown', onKey);

      // The trigger is only the notification that something moved; `sync` decides. It has to run on
      // refresh as well as on toggle, because a trigger that is already active when it is created
      // never fires a toggle — and the hero is where the reader starts.
      const band = ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        onRefresh: () => { fits = fitsViewport(); sync(); },
        onToggle: sync,
      });
      sync();

      return () => {
        band.kill();
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('keydown', onKey);
      };
    });

    // The threshold. The bar arrives here, and coming back up through it returns the reader to a
    // clean title card — the upward half of the gate, placed on the boundary itself so a single
    // wheel-up from the top of the first section is enough.
    ScrollTrigger.create({
      trigger: hero,
      start: 'bottom top+=1',
      onEnter: () => setBarShown(true),
      onLeaveBack: () => {
        setBarShown(false);
        // Not while the page is already being moved on the reader's behalf: a waypoint press on
        // "The draft" crosses this boundary on its way to the same destination.
        if (!reduced && !scrollIsAnimating() && hero.offsetHeight <= window.innerHeight + 4) {
          scrollToY(0, false);
        }
      },
    });

    // Newsreader and Inter both change where every chapter begins when they land.
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
    }
  }, { scope: rootRef, dependencies: [reduced], revertOnUpdate: true });

  return (
    <div className="landing" ref={rootRef}>
      <header
        className={`lp-header ${barShown ? 'is-shown' : ''}`.trim()}
        ref={headerRef}
        inert={!barShown}
      >
        <div className="lp-header-row">
          <span className="lp-brand">Portify</span>
          <p className="lp-chapter" aria-hidden="true">
            <span key={chapter}>{CHAPTERS[chapter].label}</span>
          </p>
          <Link className="lp-signin" to="/signin">Sign in</Link>
        </div>
        {/* How far the pass has got, and where each part of the page begins. The marks are real
            controls: pressing one takes the reader to that part of the document. */}
        <nav className="lp-rail" aria-label="Parts of this page">
          {waypoints.map((point) => (
            <button
              key={point.id}
              type="button"
              className="lp-waypoint"
              style={{ '--at': point.at }}
              aria-current={point.id === CHAPTERS[chapter].id ? 'true' : undefined}
              onClick={() => goToChapter(point.id)}
            >
              <span className="lp-waypoint-dot" aria-hidden="true" />
              <span className="lp-waypoint-label">{point.label}</span>
            </button>
          ))}
          <span className="lp-rail-fill" aria-hidden="true" />
          <span className="lp-rail-head" aria-hidden="true" />
        </nav>
      </header>

      <main>
        <section className={`lp-hero ${ready ? 'is-ready' : ''}`.trim()} id="the-draft" ref={heroRef}>
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
              <a
                className="lp-quiet-link"
                href="#the-desk"
                onClick={(event) => { event.preventDefault(); goToChapter('the-desk'); }}
              >
                See what it returns
              </a>
            </div>
          </div>

          <div className="lp-hero-sheet">
            <div className="lp-sheet lp-sheet-hero">
              <header className="lp-sheet-head">
                <h2>Retail Assistant, FairPrice</h2>
                <p>Part-time · Jun 2024 – Present</p>
              </header>
              <Revision revision={HERO_REVISION} active={heroSeen} reduced={reduced} />
              <p className="lp-sheet-quiet">Two other bullets on this page had nothing to change.</p>
            </div>
          </div>
        </section>

        <section className="lp-section lp-margin-section" id="the-reason" ref={marginRef}>
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
          <SectionHead>
            <h2>Four drafts, four kinds of answer.</h2>
            <p>
              What comes back depends on what you brought. A resume gets line-level suggestions you
              resolve yourself. An application gets a checklist computed against the course&apos;s
              baseline requirements. An essay or a cover letter gets written critique, one piece per
              question you answered.
            </p>
          </SectionHead>

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

        <DecisionAct reduced={reduced} />

        <section className="lp-section lp-more" id="the-rest">
          <SectionHead>
            <h2>The rest of the desk.</h2>
          </SectionHead>
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

        <section className="lp-close" id="start">
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
