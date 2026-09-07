import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { mockNotice } from '../utils/llmSource';

export default function InterviewsPage() {
  const { profile, interviewPrep, setInterviewPrep, interviewPlan, setInterviewPlan, addHistoryEntry } = useApp();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.universityOptions().then((data) => setOptions(data.universities)).catch(() => {});
  }, []);

  const update = (field) => (e) => setInterviewPrep({ [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    if (interviewPrep.type === 'university' && !interviewPrep.university) {
      setError('Please select a university.');
      return;
    }
    if (interviewPrep.type === 'internship' && !interviewPrep.companyName.trim()) {
      setError('Please enter a company name.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.prepareInterview({
        type: interviewPrep.type,
        university: interviewPrep.university,
        major: interviewPrep.major,
        companyName: interviewPrep.companyName,
        role: interviewPrep.role,
        jobDescription: interviewPrep.jobDescription,
        daysUntil: interviewPrep.daysUntil ? parseInt(interviewPrep.daysUntil, 10) : undefined,
        profile,
      });
      setInterviewPlan(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToHistory = () => {
    if (!interviewPlan) return;
    addHistoryEntry({
      type: 'interview',
      title: `Interview Prep — ${interviewPlan.targetName || 'Untitled'}`,
      summary: interviewPlan.overview,
      snapshot: interviewPlan,
    });
    setSaved(true);
  };

  return (
    <div className="page-grid">
      <div className="card">
        <h2>Interview Preparation</h2>
        <p className="subtitle">Tell us about your upcoming interview and we'll put together a prep plan.</p>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Interview type
            <select value={interviewPrep.type} onChange={update('type')}>
              <option value="internship">Internship / Job interview</option>
              <option value="university">University admissions interview</option>
            </select>
          </label>

          {interviewPrep.type === 'university' ? (
            <>
              <label>
                University
                <select value={interviewPrep.university} onChange={update('university')}>
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
                <input value={interviewPrep.major} onChange={update('major')} placeholder="e.g. Computer Science" />
              </label>
            </>
          ) : (
            <>
              <label>
                Company name
                <input value={interviewPrep.companyName} onChange={update('companyName')} placeholder="e.g. Stripe" />
              </label>
              <label>
                Role
                <input value={interviewPrep.role} onChange={update('role')} placeholder="e.g. Software Engineering Intern" />
              </label>
              <label>
                Job description (optional)
                <textarea rows={4} value={interviewPrep.jobDescription} onChange={update('jobDescription')} />
              </label>
            </>
          )}

          <label>
            How many days from now is the interview?
            <input type="number" min="0" value={interviewPrep.daysUntil} onChange={update('daysUntil')} placeholder="e.g. 3" />
          </label>

          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Preparing…' : 'Generate prep plan'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Your Prep Plan</h2>
        {!interviewPlan && <p className="subtitle">Fill in the details to get a personalized prep plan.</p>}
        {interviewPlan && (
          <InterviewPlanView plan={interviewPlan} onSave={handleSaveToHistory} saved={saved} />
        )}
      </div>
    </div>
  );
}

export function InterviewPlanView({ plan, onSave, saved }) {
  const notice = mockNotice(plan.source);
  return (
    <div>
      {notice && <p className="mock-notice">{notice}</p>}
      {onSave && (
        <button className="btn-primary save-history-btn" onClick={onSave} disabled={saved}>
          {saved ? 'Saved to History ✓' : 'Save to History'}
        </button>
      )}

      <h3>Overview</h3>
      <p className="reviewer-note">{plan.overview}</p>
      {plan.internationalNote && <p className="international-note">🌍 {plan.internationalNote}</p>}

      <h4>Research Checklist</h4>
      <ul>
        {plan.researchTips?.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>

      <h4>Technical Prep</h4>
      <ul>
        {plan.technicalPrep?.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>

      <h4>Timeline Advice</h4>
      <p className="reviewer-note">{plan.timelineAdvice}</p>

      <h3>Common Questions</h3>
      <div className="qa-list">
        {plan.commonQuestions?.map((q, i) => (
          <div className="qa-item interview-question" key={i}>
            <div className="qa-question">{q.question}</div>
            <p className="qa-feedback">
              <strong>How to answer:</strong> {q.howToAnswer}
            </p>
            <p className="qa-sample-answer">
              <strong>Sample answer:</strong> "{q.sampleAnswer}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
