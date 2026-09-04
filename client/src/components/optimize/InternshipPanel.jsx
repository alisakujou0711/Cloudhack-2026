import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import ResumeReviewEditor from '../ResumeReviewEditor';
import DocumentUploader from './DocumentUploader';

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
      <div className="card">
        <h2>Internship Application Optimization</h2>
        <p className="subtitle">Upload your resume for a structured, itemized review.</p>
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

      <div className="card">
        <h2>Report</h2>
        {!internshipAssessment && <p className="subtitle">Submit your resume to see your review.</p>}
        {internshipAssessment && internshipAssessment.sections && (
          <ResumeReviewEditor key={reviewKey} result={internshipAssessment} />
        )}
      </div>
    </div>
  );
}
