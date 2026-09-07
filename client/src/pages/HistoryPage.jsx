import { useState } from 'react';
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
    <div className="card clear-data-card">
      <h2>Clear my data</h2>
      <p className="subtitle">
        Wipes your profile, history, drafts, and saved assessments from this account and takes you
        back to onboarding. Your account itself stays — you will still be signed in.
      </p>
      {confirming ? (
        <div className="clear-data-confirm">
          <p>
            This cannot be undone. Everything on this account goes back to how it looked the day you
            signed up.
          </p>
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
        <button className="btn-danger" onClick={() => setConfirming(true)}>
          Clear my data
        </button>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const { universityPortfolio, internshipPortfolio, history, toggleBookmark, removeHistoryEntry } = useApp();
  const [filter, setFilter] = useState('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const filtered = history.filter((h) => (filter === 'all' || h.type === filter) && (!bookmarkedOnly || h.bookmarked));

  const hasUniversityDoc = Boolean(universityPortfolio.rawText);
  const hasResume = Boolean(internshipPortfolio.resumeText);

  return (
    <div>
      <div className="card account-docs-card">
        <h2>Your Documents</h2>
        <p className="subtitle">
          Remembered on this account — the chatbot and both application flows can reference these regardless of
          which tab you're on.
        </p>
        <div className="account-docs-grid">
          <div className={`account-doc ${hasUniversityDoc ? 'on-file' : ''}`}>
            <span className="account-doc-icon">🎓</span>
            <div>
              <div className="account-doc-title">University application document</div>
              <div className="account-doc-status">{hasUniversityDoc ? 'On file' : 'Not uploaded yet'}</div>
            </div>
          </div>
          <div className={`account-doc ${hasResume ? 'on-file' : ''}`}>
            <span className="account-doc-icon">💼</span>
            <div>
              <div className="account-doc-title">Resume</div>
              <div className="account-doc-status">{hasResume ? 'On file' : 'Not uploaded yet'}</div>
            </div>
          </div>
        </div>
      </div>

      <ClearMyDataCard />

      <div className="card">
        <h2>History</h2>
        <p className="subtitle">Every optimization you've run, in one place — filterable by type. Click an entry to reopen it.</p>

        <div className="history-filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All types</option>
            {Object.entries(TYPE_LABELS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
          <label className="history-bookmark-toggle">
            <input type="checkbox" checked={bookmarkedOnly} onChange={(e) => setBookmarkedOnly(e.target.checked)} />
            Bookmarked only
          </label>
        </div>

        {filtered.length === 0 && (
          <p className="subtitle" style={{ marginTop: '1rem' }}>
            {history.length === 0
              ? 'No history yet — optimizations, saved interview plans, and bookmarked inspirations will show up here.'
              : 'Nothing matches this filter.'}
          </p>
        )}

        <ul className="history-list">
          {filtered.map((h) => {
            const isExpanded = expandedId === h.id;
            return (
              <li key={h.id} className={`history-item-wrap ${isExpanded ? 'expanded' : ''}`}>
                <div className="history-item" onClick={() => setExpandedId(isExpanded ? null : h.id)}>
                  <div className="history-item-main">
                    <span className="badge history-type-badge">{TYPE_LABELS[h.type] || h.type}</span>
                    <div className="history-item-title">{h.title}</div>
                    {h.summary && <div className="history-item-summary">{h.summary}</div>}
                    <div className="history-item-date">{new Date(h.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="history-item-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="link-btn" onClick={() => toggleBookmark(h.id)}>
                      {h.bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
                    </button>
                    <button className="link-btn" onClick={() => removeHistoryEntry(h.id)}>
                      Remove
                    </button>
                    <span className="history-expand-hint">{isExpanded ? 'Hide details ▲' : 'View details ▼'}</span>
                  </div>
                </div>
                {isExpanded && <div className="history-item-detail">{renderSnapshot(h)}</div>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
