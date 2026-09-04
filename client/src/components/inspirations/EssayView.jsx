export default function EssayView({ essay }) {
  return (
    <div className="sample-essay">
      <div className="sample-essay-header">
        <div className="sample-essay-title">{essay.topic}</div>
        <div className="sample-essay-meta">{essay.university} · {essay.theme}</div>
      </div>
      <div className="sample-essay-body">
        {Array.isArray(essay.text) && essay.text.length > 0 ? (
          essay.text.map((paragraph, i) => <p key={i}>{paragraph}</p>)
        ) : (
          <p className="subtitle">Full text unavailable for this saved entry — revisit Inspirations to bookmark the current version.</p>
        )}
      </div>
    </div>
  );
}
