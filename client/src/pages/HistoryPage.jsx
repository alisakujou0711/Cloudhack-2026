import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UniversityReport } from '../components/optimize/UniversityPanel';
import ResumeReviewEditor from '../components/ResumeReviewEditor';
import QAReview from '../components/QAReview';
import { InterviewPlanView } from './InterviewsPage';
import SampleResumeView from '../components/inspirations/SampleResumeView';
import EssayView from '../components/inspirations/EssayView';

const TYPE_LABELS = {
  university: 'University Application',
  internship: 'Internship Application',
  essay: 'Essay Optimization',
  coverLetter: 'Cover Letter Optimization',
  interview: 'Interview Prep',
  essayExample: 'Sample Essay',
  resumeExample: 'Sample Resume',
};

function renderSnapshot(entry) {
  if (!entry.snapshot) return <p className="subtitle">No stored detail for this entry.</p>;
  switch (entry.type) {
    case 'university':
      return <UniversityReport result={entry.snapshot} />;
    case 'internship':
      return entry.snapshot.sections ? <ResumeReviewEditor result={entry.snapshot} /> : null;
    case 'essay':
      return <QAReview result={entry.snapshot} items={entry.snapshot.perQuestion} itemLabel="Q" />;
    case 'coverLetter':
      return <QAReview result={entry.snapshot} items={entry.snapshot.perPrompt} itemLabel="Prompt" />;
    case 'interview':
      return <InterviewPlanView plan={entry.snapshot} />;
    case 'essayExample':
      return <EssayView essay={entry.snapshot} />;
    case 'resumeExample':
      return <SampleResumeView resume={entry.snapshot} />;
    default:
      return null;
  }
}

/* Dates ------------------------------------------------------------------- */

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (ts) => new Date(ts).setHours(0, 0, 0, 0);
const daysAgo = (ts) => Math.round((startOfDay(Date.now()) - startOfDay(ts)) / DAY_MS);

// The stamp in the left rail: near days read as words, older ones as a date.
function dayStamp(ts) {
  const ago = daysAgo(ts);
  if (ago === 0) return 'Today';
  if (ago === 1) return 'Yesterday';
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// The same moment inside a sentence, so the deck reads as prose rather than as metadata.
function whenPhrase(ts) {
  const ago = daysAgo(ts);
  if (ago === 0) return 'today';
  if (ago === 1) return 'yesterday';
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
}

const timeStamp = (ts) => new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

// Only where it adds something: under "Sep 4" the weekday is how people remember the day, under
// "Today" it is the same fact twice.
const weekday = (ts) => (daysAgo(ts) > 1 ? new Date(ts).toLocaleDateString(undefined, { weekday: 'long' }) : null);

/* Arrival ----------------------------------------------------------------- */

// Everything on the page rises into place once, in reading order. The step is passed in from here
// rather than fixed in CSS because the log's share of the cascade depends on how much history
// there is; it is capped so a long log never leaves the last rows waiting.
const RISE_CAP = 10;
const rise = (step) => ({ '--rise-step': Math.min(step, RISE_CAP) });

/* The log ----------------------------------------------------------------- */

// Chips have to stay narrow, and TYPE_LABELS has to stay the only place a type is named — a
// second label map is exactly the sort of thing a new type silently forgets. So a chip trims the
// label it already has rather than keeping one of its own.
const chipLabel = (label) => label.replace(/ (Optimization|Application|Prep)$/, '');

// Five of the seven types write their own label into the front of the title, which the row prints
// directly above it. The category is the label's job, so the title drops the repeat and keeps only
// what is actually its own — the university, the role, the company. Titles that don't carry the
// prefix (the two Inspirations ones) come back untouched.
function entryTitle(entry) {
  const label = TYPE_LABELS[entry.type];
  if (!label || !entry.title?.startsWith(label)) return entry.title;
  const subject = entry.title.slice(label.length).replace(/^\s*[—–-]\s*/, '');
  return subject || entry.title;
}

// History is prepended newest-first, so one pass down it lands the days in order too.
function groupByDay(entries) {
  const groups = [];
  entries.forEach((entry) => {
    const key = startOfDay(entry.timestamp);
    const open = groups[groups.length - 1];
    if (open && open.key === key) open.entries.push(entry);
    else groups.push({ key, timestamp: entry.timestamp, entries: [entry] });
  });
  return groups;
}

function LogEntry({ entry, step, expanded, onToggle, onBookmark, onRemove }) {
  return (
    <li
      className={`log-entry rise${expanded ? ' is-open' : ''}${entry.bookmarked ? ' is-marked' : ''}`}
      style={rise(step)}
    >
      <div className="log-entry-row">
        <button className="log-entry-open" onClick={onToggle} aria-expanded={expanded}>
          <span className="log-entry-type">{TYPE_LABELS[entry.type] || entry.type}</span>
          <span className="log-entry-title">{entryTitle(entry)}</span>
          {entry.summary && <span className="log-entry-summary">{entry.summary}</span>}
          <span className="log-entry-foot">
            <span className="log-entry-time">{timeStamp(entry.timestamp)}</span>
            <span className="log-entry-cue">{expanded ? 'Hide' : 'Open'}</span>
          </span>
        </button>
        <div className="log-entry-actions">
          <button
            className="log-mark"
            onClick={onBookmark}
            aria-pressed={entry.bookmarked}
            aria-label={entry.bookmarked ? 'Remove bookmark' : 'Bookmark this entry'}
            title={entry.bookmarked ? 'Bookmarked' : 'Bookmark'}
          >
            {entry.bookmarked ? '★' : '☆'}
          </button>
          <button className="log-remove" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
      {expanded && <div className="log-entry-detail">{renderSnapshot(entry)}</div>}
    </li>
  );
}

/* The shelf --------------------------------------------------------------- */

function DocumentMark({ onFile }) {
  return (
    <svg className="doc-mark" viewBox="0 0 34 44" aria-hidden="true">
      <rect className="doc-mark-sheet" x="1" y="1" width="32" height="42" rx="2" />
      <g className="doc-mark-lines">
        <line x1="8" y1="12" x2="22" y2="12" />
        <line x1="8" y1="20" x2="26" y2="20" />
        <line x1="8" y1="26" x2="26" y2="26" />
        <line x1="8" y1="32" x2="18" y2="32" />
      </g>
      {onFile && (
        <g className="doc-mark-seal">
          <circle cx="25.5" cy="34.5" r="8.5" />
          <path d="M21.5 34.8 L24.4 37.6 L29.6 31.5" />
        </g>
      )}
    </svg>
  );
}

const wordCount = (text) => (text || '').trim().split(/\s+/).filter(Boolean).length;

function ShelfDoc({ title, text, context }) {
  const onFile = Boolean(text);
  return (
    <div className={`shelf-doc${onFile ? ' on-file' : ''}`}>
      <DocumentMark onFile={onFile} />
      <div className="shelf-doc-body">
        <div className="shelf-doc-title">{title}</div>
        <div className="shelf-doc-status">
          {onFile ? `${wordCount(text).toLocaleString()} words on file` : 'Not uploaded yet'}
        </div>
        {onFile && context && <div className="shelf-doc-context">{context}</div>}
      </div>
    </div>
  );
}

// The destructive half of the header's old "Start over", which became Sign out in ticket 03. It
// sits here, next to the documents on file, rather than beside the control people press every day.
function ClearMyDataCard() {
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
    <div className="shelf-clear">
      <div className="shelf-clear-copy">
        <h3>Clear my data</h3>
        <p>
          Wipes your profile, history, drafts, and saved assessments from this account and takes you back to
          onboarding. Your account itself stays — you will still be signed in.
        </p>
      </div>
      {confirming ? (
        <div className="clear-data-confirm">
          <p>This cannot be undone. Everything on this account goes back to how it looked the day you signed up.</p>
          <div className="clear-data-confirm-actions">
            <button className="btn-danger" onClick={confirm} disabled={clearing}>
              {clearing ? 'Clearing...' : 'Yes, clear everything'}
            </button>
            <button
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
      ) : (
        <button className="btn-ghost shelf-clear-trigger" onClick={() => setConfirming(true)}>
          Clear my data
        </button>
      )}
    </div>
  );
}

/* Page -------------------------------------------------------------------- */

export default function HistoryPage() {
  const { universityPortfolio, internshipPortfolio, history, toggleBookmark, removeHistoryEntry } = useApp();
  const [filter, setFilter] = useState('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const filtered = history.filter((h) => (filter === 'all' || h.type === filter) && (!bookmarkedOnly || h.bookmarked));
  const groups = groupByDay(filtered);
  const bookmarkedCount = history.filter((h) => h.bookmarked).length;

  const counts = history.reduce((acc, h) => ({ ...acc, [h.type]: (acc[h.type] || 0) + 1 }), {});
  // Only the types this account actually has, in the canonical order — plus whichever one is
  // selected, so removing the last entry of a type cannot take its own chip off the screen.
  const chipTypes = Object.keys(TYPE_LABELS).filter((type) => counts[type] || type === filter);

  const newest = history[0]?.timestamp;
  const oldest = history[history.length - 1]?.timestamp;
  // The deck counts the record rather than describing the page — the empty state below says what
  // the page is for, and only one of the two is ever on screen.
  const deck =
    history.length === 0
      ? null
      : startOfDay(newest) === startOfDay(oldest)
        ? `${history.length} ${history.length === 1 ? 'entry' : 'entries'}, all from ${whenPhrase(newest)}.`
        : `${history.length} entries, from ${whenPhrase(oldest)} to ${whenPhrase(newest)}.`;

  const showEverything = () => {
    setFilter('all');
    setBookmarkedOnly(false);
  };

  const uniContext = [universityPortfolio.major, universityPortfolio.university].filter(Boolean).join(', ');

  return (
    <div className="history">
      <header className="log-masthead">
        <h1 className="log-title rise" style={rise(0)}>
          Everything you&apos;ve worked on
        </h1>
        {deck && (
          <p className="log-deck rise" style={rise(1)}>
            {deck}
          </p>
        )}
      </header>

      {history.length > 0 && (
        <div className="log-filters rise" style={rise(2)}>
          <button className={`log-chip${filter === 'all' ? ' is-on' : ''}`} onClick={() => setFilter('all')}>
            Everything
            <span className="log-chip-count">{history.length}</span>
          </button>
          {chipTypes.map((type) => (
            <button key={type} className={`log-chip${filter === type ? ' is-on' : ''}`} onClick={() => setFilter(type)}>
              {chipLabel(TYPE_LABELS[type])}
              <span className="log-chip-count">{counts[type] || 0}</span>
            </button>
          ))}
          {bookmarkedCount > 0 && (
            <button
              className={`log-chip log-chip-mark${bookmarkedOnly ? ' is-on' : ''}`}
              onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
              aria-pressed={bookmarkedOnly}
            >
              <span className="log-chip-star">★</span>
              Bookmarked
              <span className="log-chip-count">{bookmarkedCount}</span>
            </button>
          )}
        </div>
      )}

      {history.length === 0 ? (
        <div className="log-empty rise" style={rise(3)}>
          <h2>Nothing kept yet</h2>
          <p>
            Run an optimization, save an interview plan, or bookmark an inspiration — each one lands here in full,
            ready to reopen.
          </p>
          <Link className="btn-primary" to="/app/optimize">
            Start an optimization
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="log-empty rise" style={rise(3)}>
          <h2>Nothing under this filter</h2>
          <p>Your other entries are still here.</p>
          <button className="btn-ghost" onClick={showEverything}>
            Show everything
          </button>
        </div>
      ) : (
        // Remounting on a filter change replays the arrival, so the log answers the click.
        <div className="log" key={`${filter}-${bookmarkedOnly}`}>
          {groups.map((group, groupIndex) => {
            const before = groups.slice(0, groupIndex).reduce((n, g) => n + g.entries.length, 0);
            return (
              <section className="log-day" key={group.key}>
                <div className="log-date rise" style={rise(3 + before + groupIndex)}>
                  <span className="log-date-stamp">{dayStamp(group.timestamp)}</span>
                  {weekday(group.timestamp) && <span className="log-date-weekday">{weekday(group.timestamp)}</span>}
                </div>
                <ul className="log-entries">
                  {group.entries.map((entry, entryIndex) => (
                    <LogEntry
                      key={entry.id}
                      entry={entry}
                      step={4 + before + groupIndex + entryIndex}
                      expanded={expandedId === entry.id}
                      onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                      onBookmark={() => toggleBookmark(entry.id)}
                      onRemove={() => removeHistoryEntry(entry.id)}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <section className="shelf rise" style={rise(RISE_CAP + 1)}>
        <h2 className="shelf-title">On this account</h2>
        <p className="shelf-deck">
          Both documents stay available to the chatbot and to both application flows, whichever tab you are on.
        </p>
        <div className="shelf-docs">
          <ShelfDoc
            title="University application document"
            text={universityPortfolio.rawText}
            context={uniContext}
          />
          <ShelfDoc title="Resume" text={internshipPortfolio.resumeText} context={internshipPortfolio.targetRole} />
        </div>
        <ClearMyDataCard />
      </section>
    </div>
  );
}
