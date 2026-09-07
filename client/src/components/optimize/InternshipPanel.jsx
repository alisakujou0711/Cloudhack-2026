import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import ResumeReviewEditor from '../ResumeReviewEditor';
import DocumentUploader from './DocumentUploader';
import MarkupPanel from './MarkupPanel';

// Internship Application Optimization. Resume upload is the primary, prompted path here.
export default function InternshipPanel({ onComplete }) {
  const { profile, internshipPortfolio, setInternshipPortfolio, internshipAssessment, setInternshipAssessment } =
    useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Bumped on every successful new assessment so <ResumeReviewEditor> fully remounts instead of
  // reusing its internal accept/reject state from whatever resume was reviewed previously.
  const [reviewKey, setReviewKey] = useState(0);

  const update = (field) => (e) => setInternshipPortfolio({ [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!internshipPortfolio.resumeText || internshipPortfolio.resumeText.trim().length < 10) {
      setError('Please upload or paste your resume/portfolio text (at least a few sentences).');
      return;
    }
    setLoading(true);
    try {
      const result = await api.assessInternship({
        resumeText: internshipPortfolio.resumeText,
        targetRole: internshipPortfolio.targetRole,
        jobDescription: internshipPortfolio.jobDescription,
        profile,
      });
      setInternshipAssessment(result);
      setReviewKey((k) => k + 1);
      onComplete?.({
        type: 'internship',
        title: `Internship Application — ${internshipPortfolio.targetRole || 'General'}`,
        summary: result.overallImpression,
        snapshot: result,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-grid">
      <div className="card work-card">
        <h1 className="panel-title">Resume</h1>
        <p className="panel-deck">
          Upload it or paste it in. Every bullet comes back with a stronger version you can keep or drop.
        </p>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Target role / field
            <input
              value={internshipPortfolio.targetRole}
              onChange={update('targetRole')}
              placeholder="Software Engineering Intern"
            />
          </label>
          <label>
            Job description (optional)
            <textarea
              rows={5}
              value={internshipPortfolio.jobDescription || ''}
              onChange={update('jobDescription')}
              placeholder="Paste the posting here and the review targets what this employer is actually asking for."
            />
          </label>
          <label>
            Resume / portfolio file
            <DocumentUploader
              expectedType="resume"
              prompt="Upload your resume to get started."
              hint="PDF, DOCX, or TXT — extracted text fills the box below, editable before submitting."
              onExtracted={(text) => setInternshipPortfolio({ resumeText: text })}
              onRemove={() => setInternshipPortfolio({ resumeText: '' })}
            />
          </label>
          <label>
            Resume / portfolio text
            <textarea
              rows={12}
              value={internshipPortfolio.resumeText}
              onChange={update('resumeText')}
              placeholder="...or paste your resume content here directly (experience, projects, skills)."
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Reviewing…' : 'Review my resume'}
          </button>
        </form>
      </div>

      <MarkupPanel
        title="Your markup"
        loading={loading}
        loadingLabel="Reading your resume line by line…"
        invitation="Send a resume over and it comes back marked up: the weak lines cut, stronger ones written underneath, each with the reason it changed."
        sections={['Overall', 'Experience', 'Projects']}
        result={internshipAssessment && internshipAssessment.sections ? internshipAssessment : null}
      >
        {internshipAssessment && internshipAssessment.sections && (
          <ResumeReviewEditor key={reviewKey} result={internshipAssessment} />
        )}
      </MarkupPanel>
    </div>
  );
}
