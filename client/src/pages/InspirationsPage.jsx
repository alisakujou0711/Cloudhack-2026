import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SAMPLE_ESSAYS } from '../data/sampleEssays';
import { SAMPLE_RESUMES } from '../data/sampleResumes';
import SampleResumeView from '../components/inspirations/SampleResumeView';
import EssayView from '../components/inspirations/EssayView';

export default function InspirationsPage() {
  const [mode, setMode] = useState('');

  return (
    <div>
      <div className="card">
        <h2>Inspirations</h2>
        <p className="subtitle">What would you like to browse?</p>
        <div className="type-option-grid inspirations-mode-grid">
          <button type="button" className={`type-option ${mode === 'essays' ? 'active' : ''}`} onClick={() => setMode('essays')}>
            <span className="type-option-icon">📚</span>
            Sample college application essays
          </button>
          <button type="button" className={`type-option ${mode === 'resumes' ? 'active' : ''}`} onClick={() => setMode('resumes')}>
            <span className="type-option-icon">📄</span>
            Sample internship application resumes
          </button>
        </div>
      </div>

      {mode === 'essays' && <EssayGallery />}
      {mode === 'resumes' && <ResumeGallery />}
    </div>
  );
}

function EssayGallery() {
  const { history, addHistoryEntry, removeHistoryEntry } = useApp();
  const [expandedId, setExpandedId] = useState(null);

  const bookmarkEntry = (essay) => history.find((h) => h.type === 'essayExample' && h.snapshot?.id === essay.id);

  const toggleBookmark = (essay) => {
    const existing = bookmarkEntry(essay);
    if (existing) {
      removeHistoryEntry(existing.id);
    } else {
      addHistoryEntry({
        type: 'essayExample',
        title: `${essay.university} — ${essay.topic}`,
        summary: essay.theme,
        snapshot: essay,
        bookmarked: true,
      });
    }
  };

  return (
    <div className="card">
      <h3>Sample College Application Essays</h3>
      <p className="subtitle">
        Original sample essays across common personal-statement themes, written for this app — bookmark the ones
        that resonate with you.
      </p>
      <div className="inspiration-grid">
        {SAMPLE_ESSAYS.map((essay) => {
          const bookmarked = Boolean(bookmarkEntry(essay));
          const isExpanded = expandedId === essay.id;
          return (
            <div className={`inspiration-card resume-card ${isExpanded ? 'expanded' : ''}`} key={essay.id}>
              <div className="badge">{essay.university}</div>
              <div className="inspiration-card-title">{essay.topic}</div>
              <p className="inspiration-card-theme">{essay.theme}</p>
              <div className="inspiration-card-actions">
                <button className="link-btn" onClick={() => setExpandedId(isExpanded ? null : essay.id)}>
                  {isExpanded ? 'Hide essay ▲' : 'Read full essay ▼'}
                </button>
                <button className="link-btn" onClick={() => toggleBookmark(essay)}>
                  {bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
                </button>
              </div>
              {isExpanded && (
                <div className="inspiration-card-detail">
                  <EssayView essay={essay} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResumeGallery() {
  const { history, addHistoryEntry, removeHistoryEntry } = useApp();
  const [expandedId, setExpandedId] = useState(null);

  const bookmarkEntry = (resume) => history.find((h) => h.type === 'resumeExample' && h.snapshot?.id === resume.id);

  const toggleBookmark = (resume) => {
    const existing = bookmarkEntry(resume);
    if (existing) {
      removeHistoryEntry(existing.id);
    } else {
      addHistoryEntry({
        type: 'resumeExample',
        title: `${resume.role} Resume Sample`,
        summary: resume.summary[0],
        snapshot: resume,
        bookmarked: true,
      });
    }
  };

  return (
    <div className="card">
      <h3>Sample Internship Application Resumes</h3>
      <p className="subtitle">Original sample resumes across common internship fields. Click a card to view the full resume.</p>
      <div className="inspiration-grid">
        {SAMPLE_RESUMES.map((resume) => {
          const bookmarked = Boolean(bookmarkEntry(resume));
          const isExpanded = expandedId === resume.id;
          return (
            <div className={`inspiration-card resume-card ${isExpanded ? 'expanded' : ''}`} key={resume.id}>
              <div className="badge">{resume.field}</div>
              <div className="inspiration-card-title">{resume.role}</div>
              <p className="inspiration-card-theme">{resume.summary[0]}</p>
              <div className="inspiration-card-actions">
                <button className="link-btn" onClick={() => setExpandedId(isExpanded ? null : resume.id)}>
                  {isExpanded ? 'Hide resume ▲' : 'View full resume ▼'}
                </button>
                <button className="link-btn" onClick={() => toggleBookmark(resume)}>
                  {bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
                </button>
              </div>
              {isExpanded && (
                <div className="inspiration-card-detail">
                  <SampleResumeView resume={resume} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
