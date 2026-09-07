import { mockNotice } from '../utils/llmSource';

// Shared "Feedback then Corrections" report for essay / cover-letter optimization results.
export default function QAReview({ result, items, itemLabel }) {
  const notice = mockNotice(result.source);

  return (
    <div>
      {notice && <p className="mock-notice">{notice}</p>}

      <h3>Feedback</h3>
      <p className="reviewer-note">{result.overallImpression}</p>

      {result.internationalNote && <p className="international-note">🌍 {result.internationalNote}</p>}

      {result.strengths?.length > 0 && (
        <>
          <h4>Strengths</h4>
          <ul>
            {result.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </>
      )}

      {result.improvementAreas?.length > 0 && (
        <>
          <h4>Areas to Improve</h4>
          <ul>
            {result.improvementAreas.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </>
      )}

      <h3>Corrections</h3>
      <div className="qa-list">
        {items?.map((item, i) => (
          <div className="qa-item" key={i}>
            <div className="qa-question">
              {itemLabel} {i + 1}: {item.question || item.prompt}
            </div>
            <p className="qa-feedback">{item.feedback}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
