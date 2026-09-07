import { useState } from 'react';
import { useApp } from '../context/AppContext';
import DocumentSpecimen from '../components/optimize/DocumentSpecimen';
import UniversityPanel from '../components/optimize/UniversityPanel';
import InternshipPanel from '../components/optimize/InternshipPanel';
import EssayPanel from '../components/optimize/EssayPanel';
import CoverLetterPanel from '../components/optimize/CoverLetterPanel';

// `name` is what the document is called on a student's desk; `promise` is what comes back after
// this lane has been through it. Both are read out loud by the picker, so keep them concrete —
// no feature names, no capability language.
const TYPE_OPTIONS = [
  {
    key: 'university',
    name: 'University application',
    short: 'University',
    promise: 'Your grades and activities against what the course actually asks for.',
  },
  {
    key: 'internship',
    name: 'Resume',
    short: 'Resume',
    promise: 'Every bullet read line by line, with a stronger version to accept or reject.',
  },
  {
    key: 'essay',
    name: 'Essay',
    short: 'Essay',
    promise: 'Question by question, what your answer is really saying about you.',
  },
  {
    key: 'coverLetter',
    name: 'Cover letter',
    short: 'Cover letter',
    promise: 'Paragraph by paragraph, whether the pitch lands with the person reading it.',
  },
];

const PANELS = {
  university: UniversityPanel,
  internship: InternshipPanel,
  essay: EssayPanel,
  coverLetter: CoverLetterPanel,
};

export default function ApplicationOptimizationPage() {
  const { profile, suggestedOptimizationType, addHistoryEntry } = useApp();
  // Deliberately local: the choice resets on navigation, while the panels' form data persists in
  // AppContext. Switching lanes from the rail therefore loses nothing.
  const [selectedType, setSelectedType] = useState('');

  const firstName = profile?.name ? profile.name.split(' ')[0] : '';
  const Panel = PANELS[selectedType];

  return (
    <div className="optimize">
      {!selectedType && (
        <div className="desk">
          <h1 className="desk-headline">
            {firstName ? `What are we working on, ${firstName}?` : 'What are we working on?'}
          </h1>
          <p className="desk-deck">
            Hand over a draft and it comes back marked up — what is working, what is not, and what to write
            instead.
          </p>

          <div className="specimen-grid">
            {TYPE_OPTIONS.map((option) => {
              const suggested = option.key === suggestedOptimizationType;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={suggested ? 'specimen-option is-suggested' : 'specimen-option'}
                  onClick={() => setSelectedType(option.key)}
                >
                  <span className="specimen-frame">
                    <DocumentSpecimen type={option.key} />
                  </span>
                  <span className="specimen-suggested">{suggested ? 'Suggested for you' : ''}</span>
                  <span className="specimen-name">{option.name}</span>
                  <span className="specimen-promise">{option.promise}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedType && (
        <div className="optimize-panel">
          <div className="doc-rail">
            <button type="button" className="rail-back" onClick={() => setSelectedType('')}>
              All documents
            </button>
            <div className="rail-tabs">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={option.key === selectedType ? 'rail-tab is-active' : 'rail-tab'}
                  aria-pressed={option.key === selectedType}
                  onClick={() => setSelectedType(option.key)}
                >
                  {option.short}
                </button>
              ))}
            </div>
          </div>

          <Panel onComplete={addHistoryEntry} />
        </div>
      )}
    </div>
  );
}
