import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { mockNotice } from '../../utils/llmSource';
import DocumentUploader from './DocumentUploader';
import MarkupPanel from './MarkupPanel';

// University Application Optimization. Upload is optional here — the form works fine filled in
// by hand; a file just pre-fills fields for convenience.
export default function UniversityPanel({ onComplete }) {
  const { profile, universityPortfolio, setUniversityPortfolio, universityAssessment, setUniversityAssessment } =
    useApp();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prefilling, setPrefilling] = useState(false);

  useEffect(() => {
    api.universityOptions().then((data) => setOptions(data.universities)).catch(() => {});
  }, []);

  const handleExtracted = (text) => {
    setUniversityPortfolio({ rawText: text });
    setPrefilling(true);
    api
      .extractUniversityFieldsFromText(text)
      .then(({ gpa, subjects, extracurriculars }) => {
        setUniversityPortfolio({
          gpa: typeof gpa === 'number' ? String(gpa) : universityPortfolio.gpa,
          subjects: subjects?.length ? subjects.join(', ') : universityPortfolio.subjects,
          extracurriculars: extracurriculars || universityPortfolio.extracurriculars,
        });
      })
      .catch(() => {})
      .finally(() => setPrefilling(false));
  };

  const selectedUni = options.find((u) => u.code === universityPortfolio.university);
  const majors = selectedUni ? selectedUni.majors : [];
  const isInternational = Boolean(profile?.location) && !/singapore/i.test(profile.location);

  const update = (field) => (e) => setUniversityPortfolio({ [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!universityPortfolio.university || !universityPortfolio.major) {
      setError('Please select a university and major.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.assessUniversity({
        university: universityPortfolio.university,
        major: universityPortfolio.major,
        portfolio: {
          gpa: universityPortfolio.gpa ? parseFloat(universityPortfolio.gpa) : undefined,
          subjects: universityPortfolio.subjects
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          extracurriculars: universityPortfolio.extracurriculars,
          languageProficiency: universityPortfolio.languageProficiency,
        },
        profile,
      });
      setUniversityAssessment(result);
      onComplete?.({
        type: 'university',
        title: `University Application — ${result.university} (${result.major})`,
        summary: result.feedback?.summary,
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
        <h1 className="panel-title">University application</h1>
        <p className="panel-deck">
          {prefilling
            ? 'Reading your file into the fields below…'
            : 'Singapore universities, for now. Upload a transcript to fill this in, or type it in yourself.'}
        </p>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Application file (optional)
            <DocumentUploader
              expectedType="university_application"
              hint="PDF, DOCX, or TXT with your transcript/GPA, subjects, and extracurriculars — fields below are pre-filled and stay editable."
              onExtracted={handleExtracted}
              onRemove={() => setUniversityPortfolio({ rawText: '' })}
            />
          </label>
          <label>
            Target country
            <input value="Singapore" disabled />
          </label>
          <label>
            University
            <select value={universityPortfolio.university} onChange={update('university')}>
              <option value="">Select...</option>
              {options.map((u) => (
                <option key={u.code} value={u.code}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Intended major
            <select value={universityPortfolio.major} onChange={update('major')} disabled={!selectedUni}>
              <option value="">Select...</option>
              {majors.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label>
            GPA (out of 4.0)
            <input type="number" step="0.01" min="0" max="4" value={universityPortfolio.gpa} onChange={update('gpa')} />
          </label>
          <label>
            Subjects taken (comma-separated)
            <input
              value={universityPortfolio.subjects}
              onChange={update('subjects')}
              placeholder="Mathematics, Additional Mathematics, Physics"
            />
          </label>
          <label>
            Extracurriculars
            <textarea rows={3} value={universityPortfolio.extracurriculars} onChange={update('extracurriculars')} />
          </label>
          {isInternational && (
            <label>
              Language proficiency
              <input
                value={universityPortfolio.languageProficiency}
                onChange={update('languageProficiency')}
                placeholder="e.g. IELTS 7.5, TOEFL 105"
              />
              <span className="field-hint">
                Required for most international applicants — e.g. IELTS, TOEFL, or equivalent.
              </span>
            </label>
          )}
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Assessing…' : 'Assess my portfolio'}
          </button>
        </form>
      </div>

      <MarkupPanel
        title="Where you stand"
        loading={loading}
        loadingLabel="Checking your portfolio against the course…"
        invitation="Pick a course and fill in what you have. It comes back measured against that course's own baseline, not a generic one."
        sections={['Checklist', 'Feedback', 'Recommendations']}
        result={universityAssessment}
      >
        {universityAssessment && <UniversityReport result={universityAssessment} />}
      </MarkupPanel>
    </div>
  );
}

export function UniversityReport({ result }) {
  return (
    <div>
      <div className="report-summary">
        <div className="badge">{result.competitiveness} competitiveness</div>
        <p>
          {result.university} — {result.major}
        </p>
        <p className="score-line">
          Baseline checklist: {result.checklistPassCount}/{result.checklistTotal} met
        </p>
        {mockNotice(result.source) && <p className="mock-notice">{mockNotice(result.source)}</p>}
      </div>

      <h3>Checklist</h3>
      <ul className="checklist">
        {result.checklist.map((item) => (
          <li key={item.id} className={item.met ? 'met' : item.optional ? 'optional' : 'unmet'}>
            <span className="check-icon">{item.met ? '✓' : item.optional ? '·' : '✗'}</span>
            <div>
              <div className="check-label">{item.label}</div>
              <div className="check-detail">{item.detail}</div>
            </div>
          </li>
        ))}
      </ul>

      <h3>Feedback</h3>
      <p>{result.feedback.summary}</p>

      {result.feedback.internationalNote && (
        <p className="international-note">🌍 {result.feedback.internationalNote}</p>
      )}

      {result.feedback.strengths?.length > 0 && (
        <>
          <h4>Strengths</h4>
          <ul>
            {result.feedback.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </>
      )}

      {result.feedback.gaps?.length > 0 && (
        <>
          <h4>Gaps</h4>
          <ul>
            {result.feedback.gaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </>
      )}

      <h4>Recommendations</h4>
      <ul>
        {result.feedback.recommendations?.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
