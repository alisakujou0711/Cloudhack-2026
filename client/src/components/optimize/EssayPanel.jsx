import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import QAReview from '../QAReview';
import DocumentUploader from './DocumentUploader';

export default function EssayPanel({ onComplete }) {
  const { profile, essayOptimization, setEssayOptimization, essayAssessment, setEssayAssessment } = useApp();
  const [step, setStep] = useState(essayOptimization.questions?.[0] ? 'questions' : 'setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [options, setOptions] = useState([]);
  const [extractingStatement, setExtractingStatement] = useState(false);

  useEffect(() => {
    api.universityOptions().then((data) => setOptions(data.universities)).catch(() => {});
  }, []);

  const handleSetupSubmit = (e) => {
    e.preventDefault();
    const n = Math.max(1, Math.min(10, parseInt(essayOptimization.questionCount, 10) || 1));
    const questions = Array.from({ length: n }, (_, i) => essayOptimization.questions[i] || '');
    const answers = Array.from({ length: n }, (_, i) => essayOptimization.answers[i] || '');
    setEssayOptimization({ questionCount: n, questions, answers });
    setStep('questions');
  };

  // Rather than dumping the whole uploaded document into an answer, specifically pull out the
  // personal statement / essay portion (the same field-extraction the University flow uses),
  // in case the upload is a broader application document rather than a standalone essay draft.
  const handleDraftUploaded = (text) => {
    setExtractingStatement(true);
    api
      .extractUniversityFieldsFromText(text)
      .then(({ essay }) => {
        const statement = essay || text;
        const answers = [...essayOptimization.answers];
        const emptyIndex = answers.findIndex((a) => !a);
        if (emptyIndex !== -1) {
          answers[emptyIndex] = statement;
          setEssayOptimization({ answers });
        }
      })
      .catch(() => {
        // Fall back to the raw text if extraction fails for any reason.
        const answers = [...essayOptimization.answers];
        const emptyIndex = answers.findIndex((a) => !a);
        if (emptyIndex !== -1) {
          answers[emptyIndex] = text;
          setEssayOptimization({ answers });
        }
      })
      .finally(() => setExtractingStatement(false));
  };

  const updateQuestion = (i, value) => {
    const questions = [...essayOptimization.questions];
    questions[i] = value;
    setEssayOptimization({ questions });
  };
  const updateAnswer = (i, value) => {
    const answers = [...essayOptimization.answers];
    answers[i] = value;
    setEssayOptimization({ answers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (essayOptimization.questions.some((q) => !q.trim())) {
      setError('Please fill in the text of every essay question.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.assessEssays({
        university: essayOptimization.university,
        major: essayOptimization.major,
        questions: essayOptimization.questions,
        answers: essayOptimization.answers,
        profile,
      });
      setEssayAssessment(result);
      onComplete?.({
        type: 'essay',
        title: `Essay Optimization — ${essayOptimization.major || 'Essays'} (${essayOptimization.university || 'University'})`,
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
        <h2>Essay Optimization</h2>
        <p className="subtitle">Get feedback on your university application essays, question by question.</p>

        {step === 'setup' && (
          <form onSubmit={handleSetupSubmit} className="form">
            <label>
              Name of university
              <select
                value={essayOptimization.university}
                onChange={(e) => setEssayOptimization({ university: e.target.value })}
              >
                <option value="">Select...</option>
                {options.map((u) => (
                  <option key={u.code} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Major
              <input
                value={essayOptimization.major}
                onChange={(e) => setEssayOptimization({ major: e.target.value })}
                placeholder="e.g. Computer Science"
              />
            </label>
            <label>
              How many essay questions do you need to fill out?
              <input
                type="number"
                min="1"
                max="10"
                value={essayOptimization.questionCount}
                onChange={(e) => setEssayOptimization({ questionCount: e.target.value })}
              />
            </label>
            <button type="submit" className="btn-primary">
              Continue
            </button>
          </form>
        )}

        {step === 'questions' && (
          <form onSubmit={handleSubmit} className="form">
            <label>
              Have a draft already? (optional)
              <DocumentUploader
                expectedType="essay"
                prompt="Upload your application document — we'll pull out just the personal statement / essay portion to prefill your first empty answer."
                hint={
                  extractingStatement
                    ? 'Extracting your personal statement…'
                    : "PDF, DOCX, or TXT — you can still edit the text after it's filled in."
                }
                onExtracted={handleDraftUploaded}
                onRemove={() => {}}
              />
            </label>
            {essayOptimization.questions.map((q, i) => (
              <div className="qa-input-block" key={i}>
                <label>
                  Essay Question {i + 1}
                  <input
                    value={q}
                    onChange={(e) => updateQuestion(i, e.target.value)}
                    placeholder="e.g. Why do you want to study here?"
                  />
                </label>
                <label>
                  Your Answer
                  <textarea rows={6} value={essayOptimization.answers[i] || ''} onChange={(e) => updateAnswer(i, e.target.value)} />
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

      <div className="card">
        <h2>Report</h2>
        {!essayAssessment && <p className="subtitle">Submit your essays to see feedback.</p>}
        {essayAssessment && <QAReview result={essayAssessment} items={essayAssessment.perQuestion} itemLabel="Q" />}
      </div>
    </div>
  );
}
