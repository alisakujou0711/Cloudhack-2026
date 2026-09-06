import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { SAMPLE_ESSAYS } from '../data/sampleEssays';
import { SAMPLE_RESUMES } from '../data/sampleResumes';
import SampleResumeView from '../components/inspirations/SampleResumeView';
import EssayView from '../components/inspirations/EssayView';

/* Inspirations — the anthology
   The only tab where you read someone else's work rather than your own, so it is shelved rather
   than filed: two lanes of pieces, hairline-separated, each led by its own opening line.

   Leading with the writing is the whole point. Fronting the university instead turns thirteen
   pieces of student prose into a ranking of the schools that accepted them, which is not what a
   stuck applicant needs to see. The credit stays, quietly, under the line it belongs to. */

/* Arrival ------------------------------------------------------------------
   Everything rises into place once, in reading order, on the mount that clicking the tab causes.
   Steps are set here rather than in CSS because only this file knows how many pieces are in the
   lane being shown. */
const rise = (step) => ({ '--rise-step': step });

// Title, deck, lane switch. The shelf below them starts counting from here.
const HEAD_STEPS = 3;

// Past a dozen the stagger stops reading as a cascade and starts reading as a wait, so the tail
// of a long lane arrives together.
const RISE_CAP = 12;

/* The opening line ----------------------------------------------------------
   The hook is the first sentence of the piece, so it has to be cut at a real sentence end. A
   split on ". " alone lands inside "Mr. Alvarez" in the hospice essay, so titles are skipped and
   the break has to be followed by something that can start a sentence. */
const ABBREVIATION = /\b(?:Mr|Mrs|Ms|Dr|Prof|St|Sr|Jr|vs|No|Ave|Dept)\.$/;

// A hook cut mid-clause reads as broken text rather than as an excerpt, so a truncation landing
// on a dangling conjunction drops it and ends on the last word that can carry an ellipsis.
const DANGLING = /\s+(?:and|or|but|with|of|to|the|a|an|in|for|that|as)$/i;

// Long enough that all five resume summaries and six of the eight essays arrive whole; the two
// that do not are the ones whose first sentence is a paragraph in its own right.
const HOOK_LIMIT = 168;

function openingLine(text) {
  const source = (text || '').trim();
  if (!source) return '';

  let sentence = source;
  const breaks = /[.!?]["”]?\s+(?=["“]?[A-Z0-9])/g;
  let found;
  while ((found = breaks.exec(source)) !== null) {
    const upTo = source.slice(0, found.index + 1);
    if (ABBREVIATION.test(upTo)) continue;
    sentence = upTo;
    break;
  }

  if (sentence.length <= HOOK_LIMIT) return sentence;
  const clipped = sentence.slice(0, HOOK_LIMIT);
  const onWord = clipped.slice(0, clipped.lastIndexOf(' '));
  return `${onWord.replace(/[,;:.—-]+$/, '').replace(DANGLING, '')}…`;
}

const LANES = [
  { id: 'essays', label: 'Personal statements', count: SAMPLE_ESSAYS.length },
  { id: 'resumes', label: 'Resumes', count: SAMPLE_RESUMES.length },
];

/* Page ---------------------------------------------------------------------- */

export default function InspirationsPage() {
  // The essays are showing when you arrive. A picker with nothing behind it asks you to commit
  // before you have seen anything worth committing to, which is the opposite of an invitation.
  const [lane, setLane] = useState('essays');

  // Once the arrival has played, the masthead is settled. Switching lanes replaces the shelf
  // under it, and those pieces should start their own cascade immediately rather than queue
  // behind three header beats that are not going to run again.
  const [arrived, setArrived] = useState(false);
  useEffect(() => {
    // Just past the end of the cascade in index.css: capped step (12 * 45ms) plus its 520ms run.
    const settle = setTimeout(() => setArrived(true), 1100);
    return () => clearTimeout(settle);
  }, []);

  return (
    <div className="inspirations">
      <header className="anth-masthead">
        <h1 className="anth-title" style={rise(0)}>
          See how someone else started.
        </h1>
        <p className="anth-deck" style={rise(1)}>
          Thirteen pieces written for this app — eight personal statements and five internship
          resumes. Read one end to end, and bookmark the ones you want to come back to.
        </p>
        <div className="anth-lanes" style={rise(2)} role="tablist" aria-label="What to browse">
          {LANES.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={lane === option.id}
              className={`anth-lane${lane === option.id ? ' is-on' : ''}`}
              onClick={() => setLane(option.id)}
            >
              {option.label}
              <span className="anth-lane-count">{option.count}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Keyed on the lane so switching remounts the shelf and the new pieces rise in. Unlike the
          form on Interviews, the whole set swaps at once — there is no settled neighbour left for
          a fresh fade to look wrong beside. */}
      <div className="anth-shelf" key={lane}>
        {lane === 'essays' ? <EssayShelf arrived={arrived} /> : <ResumeShelf arrived={arrived} />}
      </div>
    </div>
  );
}

/* One piece on the shelf ----------------------------------------------------
   Both lanes are the same object — a line that pulls you in, what it is about, a credit, and a
   way in — so they are the same component. Only what fills those slots differs. */
function Piece({ head, quoted, blurb, credit, marked, markLabel, open, onOpen, onMark, step, children }) {
  return (
    <article className={`anth-piece${open ? ' is-open' : ''}${marked ? ' is-marked' : ''}`} style={rise(step)}>
      <button type="button" className="anth-piece-open" onClick={onOpen} aria-expanded={open}>
        <span className={quoted ? 'anth-head anth-head-quoted' : 'anth-head'}>{head}</span>
        <span className="anth-blurb">{blurb}</span>
        <span className="anth-foot">
          <span className="anth-credit">{credit}</span>
          <span className="anth-cue">{open ? 'Close' : 'Read'}</span>
        </span>
      </button>
      <button
        type="button"
        className="anth-mark"
        onClick={onMark}
        aria-pressed={marked}
        aria-label={marked ? `Remove bookmark from ${markLabel}` : `Bookmark ${markLabel}`}
        title={marked ? 'Bookmarked' : 'Bookmark'}
      >
        {marked ? '★' : '☆'}
      </button>
      {open && <div className="anth-pane">{children}</div>}
    </article>
  );
}

/* Bookmarking has no store of its own: it writes a history entry and reads its state back out of
   history. Un-bookmarking removes that entry, which is why deleting the row on the History tab
   also clears the star here. See docs/features/inspirations.md. */
function useShelf(type) {
  const { history, addHistoryEntry, removeHistoryEntry } = useApp();
  const [openId, setOpenId] = useState(null);

  const entryFor = (sample) => history.find((h) => h.type === type && h.snapshot?.id === sample.id);

  const toggleMark = (sample, entry) => {
    const existing = entryFor(sample);
    if (existing) removeHistoryEntry(existing.id);
    else addHistoryEntry({ ...entry, type, snapshot: sample, bookmarked: true });
  };

  const toggleOpen = (sample) => setOpenId((current) => (current === sample.id ? null : sample.id));

  return { entryFor, toggleMark, toggleOpen, openId };
}

function EssayShelf({ arrived }) {
  const { entryFor, toggleMark, toggleOpen, openId } = useShelf('essayExample');
  const base = arrived ? 0 : HEAD_STEPS;

  return (
    <>
      {SAMPLE_ESSAYS.map((essay, i) => (
        <Piece
          key={essay.id}
          quoted
          head={openingLine(essay.text?.[0]) || essay.topic}
          blurb={essay.theme}
          credit={essay.university}
          marked={Boolean(entryFor(essay))}
          markLabel={`this ${essay.university} essay`}
          open={openId === essay.id}
          onOpen={() => toggleOpen(essay)}
          onMark={() =>
            toggleMark(essay, { title: `${essay.university} — ${essay.topic}`, summary: essay.theme })
          }
          step={Math.min(base + i, RISE_CAP)}
        >
          <EssayView essay={essay} />
        </Piece>
      ))}
    </>
  );
}

function ResumeShelf({ arrived }) {
  const { entryFor, toggleMark, toggleOpen, openId } = useShelf('resumeExample');
  const base = arrived ? 0 : HEAD_STEPS;

  return (
    <>
      {SAMPLE_RESUMES.map((resume, i) => (
        <Piece
          key={resume.id}
          // A resume is picked by what it is applying for, so the role leads and the summary's
          // opening line does the work the essay's quotation does.
          head={resume.role}
          blurb={openingLine(resume.summary?.[0])}
          credit={resume.keySkills.slice(0, 3).join(', ')}
          marked={Boolean(entryFor(resume))}
          markLabel={`this ${resume.role} resume`}
          open={openId === resume.id}
          onOpen={() => toggleOpen(resume)}
          onMark={() =>
            toggleMark(resume, { title: `${resume.role} Resume Sample`, summary: resume.summary[0] })
          }
          step={Math.min(base + i, RISE_CAP)}
        >
          <SampleResumeView resume={resume} />
        </Piece>
      ))}
    </>
  );
}
