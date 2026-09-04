import { useState } from 'react';
import { useApp } from '../context/AppContext';
import UniversityPanel from '../components/optimize/UniversityPanel';
import InternshipPanel from '../components/optimize/InternshipPanel';
import EssayPanel from '../components/optimize/EssayPanel';
import CoverLetterPanel from '../components/optimize/CoverLetterPanel';

const TYPE_OPTIONS = [
  { key: 'university', label: 'University Application Optimization', icon: '🎓' },
  { key: 'internship', label: 'Internship Application Optimization', icon: '💼' },
  { key: 'essay', label: 'Essay Optimization', icon: '📝' },
  { key: 'coverLetter', label: 'Cover Letter Optimization', icon: '✉️' },
];

export default function ApplicationOptimizationPage() {
  const { suggestedOptimizationType, addHistoryEntry } = useApp();
  const [selectedType, setSelectedType] = useState('');

  const handleComplete = (entry) => addHistoryEntry(entry);

  return (
    <div>
      <div className="card optimize-type-card">
        <h2>Application Optimization</h2>
        <p className="subtitle">Is this for your university application, an internship, an essay, or a cover letter?</p>
        <div className="type-option-grid">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`type-option ${selectedType === t.key ? 'active' : ''} ${
                t.key === suggestedOptimizationType && !selectedType ? 'suggested' : ''
              }`}
              onClick={() => setSelectedType(t.key)}
            >
              <span className="type-option-icon">{t.icon}</span>
              {t.label}
              {t.key === suggestedOptimizationType && !selectedType && (
                <span className="type-option-hint">Suggested for you</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedType && (
        <div className="optimize-panel">
          <button type="button" className="link-btn change-type-link" onClick={() => setSelectedType('')}>
            ← Change type
          </button>
          {selectedType === 'university' && <UniversityPanel onComplete={handleComplete} />}
          {selectedType === 'internship' && <InternshipPanel onComplete={handleComplete} />}
          {selectedType === 'essay' && <EssayPanel onComplete={handleComplete} />}
          {selectedType === 'coverLetter' && <CoverLetterPanel onComplete={handleComplete} />}
        </div>
      )}
    </div>
  );
}
