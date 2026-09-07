import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import QAReview from '../QAReview';
import DocumentUploader from './DocumentUploader';
import MarkupPanel from './MarkupPanel';

export default function CoverLetterPanel({ onComplete }) {
  const { profile, coverLetterOptimization, setCoverLetterOptimization, coverLetterAssessment, setCoverLetterAssessment } =
    useApp();
  const [step, setStep] = useState(coverLetterOptimization.prompts?.[0] ? 'prompts' : 'setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetupSubmit = (e) => {
    e.preventDefault();
    const n = Math.max(1, Math.min(10, parseInt(coverLetterOptimization.promptCount, 10) || 1));
    const prompts = Array.from({ length: n }, (_, i) => coverLetterOptimization.prompts[i] || (n === 1 ? 'Cover letter' : ''));
    const answers = Array.from({ length: n }, (_, i) => coverLetterOptimization.answers[i] || '');
    setCoverLetterOptimization({ promptCount: n, prompts, answers });
    setStep('prompts');
  };

  const handleDraftUploaded = (text) => {
    const answers = [...coverLetterOptimization.answers];
    const emptyIndex = answers.findIndex((a) => !a);
    if (emptyIndex !== -1) {
      answers[emptyIndex] = text;
      setCoverLetterOptimization({ answers });
    }
  };

  const updatePrompt = (i, value) => {
    const prompts = [...coverLetterOptimization.prompts];
    prompts[i] = value;
    setCoverLetterOptimization({ prompts });
  };
  const updateAnswer = (i, value) => {
    const answers = [...coverLetterOptimization.answers];
    answers[i] = value;
    setCoverLetterOptimization({ answers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (coverLetterOptimization.prompts.some((p) => !p.trim())) {
      setError('Please fill in the text of every prompt (or leave the single default "Cover letter" prompt as-is).');
      return;
    }
    setLoading(true);
    try {
      const result = await api.assessCoverLetter({
        companyName: coverLetterOptimization.companyName,
        role: coverLetterOptimization.role,
        prompts: coverLetterOptimization.prompts,
        answers: coverLetterOptimization.answers,
        jobDescription: coverLetterOptimization.jobDescription,
        profile,
      });
      setCoverLetterAssessment(result);
      onComplete?.({
        type: 'coverLetter',
        title: `Cover Letter Optimization — ${coverLetterOptimization.role || 'Role'} at ${coverLetterOptimization.companyName || 'Company'}`,
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
        <h1 className="panel-title">Cover letter</h1>
        <p className="panel-deck">Feedback on the letter you are sending with an application, prompt by prompt.</p>
        <ol className="panel-steps">
          <li className={step === 'setup' ? 'is-current' : 'is-done'}>Who it is for</li>
          <li className={step === 'prompts' ? 'is-current' : ''}>The letter</li>
        </ol>

        {step === 'setup' && (
          <form onSubmit={handleSetupSubmit} className="form">
            <label>
              Company name
              <input
                value={coverLetterOptimization.companyName}
                onChange={(e) => setCoverLetterOptimization({ companyName: e.target.value })}
                placeholder="e.g. Stripe"
              />
            </label>
            <label>
              Role / position
              <input
                value={coverLetterOptimization.role}
                onChange={(e) => setCoverLetterOptimization({ role: e.target.value })}
                placeholder="e.g. Software Engineering Intern"
              />
            </label>
            <label>
              Job description (optional)
              <textarea
                rows={5}
                value={coverLetterOptimization.jobDescription || ''}
                onChange={(e) => setCoverLetterOptimization({ jobDescription: e.target.value })}
                placeholder="Paste the posting here and the feedback checks your letter against it."
              />
            </label>
            <label>
              How many prompts do you need to address? (1 for a standard cover letter)
              <input
                type="number"
                min="1"
                max="10"
                value={coverLetterOptimization.promptCount}
                onChange={(e) => setCoverLetterOptimization({ promptCount: e.target.value })}
              />
            </label>
            <button type="submit" className="btn-primary">
              Continue
            </button>
          </form>
        )}

        {step === 'prompts' && (
          <form onSubmit={handleSubmit} className="form">
            <label>
              Have a draft already? (optional)
              <DocumentUploader
                expectedType="cover_letter"
                prompt="Upload a draft to prefill your first empty answer."
                hint="PDF, DOCX, or TXT — you can still edit the text after it's filled in."
                onExtracted={handleDraftUploaded}
                onRemove={() => {}}
              />
            </label>
            {coverLetterOptimization.prompts.map((p, i) => (
              <div className="qa-input-block" key={i}>
                <label>
                  Prompt {i + 1}
                  <input
                    value={p}
                    onChange={(e) => updatePrompt(i, e.target.value)}
                    placeholder="e.g. Cover letter, or a specific application question"
                  />
                </label>
                <label>
                  Your Answer / Draft
                  <textarea
                    rows={8}
                    value={coverLetterOptimization.answers[i] || ''}
                    onChange={(e) => updateAnswer(i, e.target.value)}
                  />
                </label>
              </div>
            ))}
            {error && <p className="error-text">{error}</p>}
            <div className="form-row-actions">
              <button type="button" className="btn-ghost" onClick={() => setStep('setup')}>
                Back
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Reviewing…' : 'Get feedback'}
              </button>
            </div>
          </form>
        )}
      </div>

      <MarkupPanel
        title="Your markup"
        loading={loading}
        loadingLabel="Reading your letter…"
        invitation="Draft the letter the way you would send it. It comes back paragraph by paragraph, with whether the pitch lands on the person reading it."
        sections={['Feedback', 'Strengths', 'Prompt by prompt']}
        result={coverLetterAssessment}
      >
        {coverLetterAssessment && (
          <QAReview result={coverLetterAssessment} items={coverLetterAssessment.perPrompt} itemLabel="Prompt" />
        )}
      </MarkupPanel>
    </div>
  );
}
