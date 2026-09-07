export default function SampleResumeView({ resume }) {
  return (
    <div className="sample-resume">
      <div className="sample-resume-header">
        <div className="sample-resume-name">{resume.name}</div>
        <div className="sample-resume-tagline">{resume.tagline}</div>
      </div>

      <h4>Executive Summary</h4>
      <ul>
        {resume.summary.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>

      <h4>Key Skills</h4>
      <p className="sample-resume-skills-line">{resume.keySkills.join(' • ')}</p>

      <h4>Experience</h4>
      {resume.experience.map((exp, i) => (
        <div className="sample-resume-entry" key={i}>
          <div className="sample-resume-entry-header">
            <span className="sample-resume-entry-title">{exp.title}</span>
            <span className="sample-resume-entry-date">{exp.dateRange}</span>
          </div>
          <div className="sample-resume-entry-org">{exp.org}</div>
          <ul>
            {exp.bullets.map((b, bi) => (
              <li key={bi}>{b}</li>
            ))}
          </ul>
        </div>
      ))}

      <h4>Technical Skills</h4>
      <p className="sample-resume-skills-line">{resume.technicalSkills.join(' • ')}</p>

      <h4>Education</h4>
      <p>{resume.education}</p>
      {resume.note && <p className="sample-resume-note">{resume.note}</p>}
    </div>
  );
}
