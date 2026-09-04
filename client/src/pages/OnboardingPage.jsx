import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, EDUCATION_LEVELS } from '../context/AppContext';

export default function OnboardingPage() {
  const { setProfile } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !educationLevel || !location.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setProfile({ name: name.trim(), educationLevel, location: location.trim() });
    navigate('/app/optimize');
  };

  return (
    <div className="page-center">
      <div className="card onboarding-card">
        <h1>PortfolioPath</h1>
        <p className="subtitle">
          Diagnose your portfolio against real end-goals — university admissions or internship
          applications.
        </p>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Tan" />
          </label>
          <label>
            Current education level
            <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}>
              <option value="">Select...</option>
              {EDUCATION_LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Current location
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Singapore" />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
