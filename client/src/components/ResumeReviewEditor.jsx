import { forwardRef, useMemo, useRef, useState } from 'react';
import { useChatUI } from '../context/ChatUIContext';
import { mockNotice } from '../utils/llmSource';
import { api } from '../api/client';

function bulletKey(si, ei, bi) {
  return `${si}-${ei}-${bi}`;
}

// Defends against the model occasionally writing a literal placeholder instead of leaving a
// missing subtitle/dateRange blank.
function clean(value) {
  return value && !/^n\/?a$/i.test(value.trim()) ? value : '';
}

export default function ResumeReviewEditor({ result }) {
  const { openWithDraft } = useChatUI();
  const [decisions, setDecisions] = useState({}); // key -> 'accepted' | 'rejected'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const bulletRefs = useRef({});

  const sections = result.sections || [];

  const reviewable = useMemo(() => {
    const list = [];
    sections.forEach((section, si) => {
      (section.entries || []).forEach((entry, ei) => {
        (entry.bullets || []).forEach((bullet, bi) => {
          if (bullet.suggestion) list.push(bulletKey(si, ei, bi));
        });
      });
    });
    return list;
  }, [sections]);

  const notice = mockNotice(result.source);

  const setDecision = (key, value) => setDecisions((d) => ({ ...d, [key]: value }));
  const undoDecision = (key) =>
    setDecisions((d) => {
      const next = { ...d };
      delete next[key];
      return next;
    });

  const keepAll = () => setDecisions(Object.fromEntries(reviewable.map((k) => [k, 'accepted'])));
  const undoAll = () => setDecisions({});

  // Bulk-bar gating, derived rather than flagged: nothing left to keep once every suggestion is
  // accepted, nothing to undo while no decision has been made.
  const allKept = reviewable.length > 0 && reviewable.every((k) => decisions[k] === 'accepted');
  const hasDecisions = Object.keys(decisions).length > 0;

  const goTo = (index) => {
    if (reviewable.length === 0) return;
    const clamped = Math.max(0, Math.min(reviewable.length - 1, index));
    setCurrentIndex(clamped);
    bulletRefs.current[reviewable[clamped]]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleDiscuss = (bullet) => {
    openWithDraft(`Can we discuss this bullet point?\n"${bullet.original}"`);
  };

  // Applies each bullet's decision (accepted -> suggestion, everything else -> original) to
  // produce the final resume text to export. Pending suggestions are NOT applied — only an
  // explicit Accept counts as a "modification".
  const resolvedSections = () =>
    sections.map((section, si) => ({
      name: section.name,
      entries: (section.entries || []).map((entry, ei) => ({
        title: entry.title,
        subtitle: clean(entry.subtitle),
        dateRange: clean(entry.dateRange),
        bullets: (entry.bullets || []).map((bullet, bi) => {
          const key = bulletKey(si, ei, bi);
          return decisions[key] === 'accepted' && bullet.suggestion ? bullet.suggestion : bullet.original;
        }),
      })),
    }));

  const handleDownload = async () => {
    setDownloadError('');
    setDownloading(true);
    try {
      const blob = await api.exportResumePdf({
        name: result.name,
        contact: result.contact,
        sections: resolvedSections(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(result.name || 'resume').replace(/[^a-z0-9]+/gi, '_') || 'resume'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="resume-review">
      <div className="resume-review-header">
        <div>
          <div className="resume-review-name">{result.name || 'Your Resume'}</div>
          {result.contact && <div className="resume-review-contact">{result.contact}</div>}
        </div>
      </div>
      {notice && <p className="mock-notice">{notice}</p>}

      <h3>Feedback</h3>
      {result.overallImpression && <p className="reviewer-note">{result.overallImpression}</p>}

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
      {sections.map((section, si) => (
        <div className="review-section" key={section.name || si}>
          <div className="review-section-title">
            {section.name}
            <span className="review-section-count">{(section.entries || []).length}</span>
          </div>
          {(section.entries || []).map((entry, ei) => (
            <div className="review-entry" key={ei}>
              <div className="review-entry-header">
                <div>
                  <span className="review-entry-title">{entry.title}</span>
                  {clean(entry.subtitle) && <span className="review-entry-subtitle">{clean(entry.subtitle)}</span>}
                </div>
                {clean(entry.dateRange) && <div className="review-entry-date">{clean(entry.dateRange)}</div>}
              </div>
              {(entry.bullets || []).map((bullet, bi) => {
                const key = bulletKey(si, ei, bi);
                if (!bullet.suggestion) {
                  return (
                    <p className="plain-bullet" key={key}>
                      {bullet.original}
                    </p>
                  );
                }
                return (
                  <DiffBullet
                    key={key}
                    ref={(el) => {
                      bulletRefs.current[key] = el;
                    }}
                    bullet={bullet}
                    decision={decisions[key]}
                    onAccept={() => setDecision(key, 'accepted')}
                    onReject={() => setDecision(key, 'rejected')}
                    onUndo={() => undoDecision(key)}
                    onDiscuss={() => handleDiscuss(bullet)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      ))}

      <div className="resume-review-footer">
        <button className="btn-primary download-btn" onClick={handleDownload} disabled={downloading}>
          {downloading ? 'Preparing…' : 'Download resume'}
        </button>
        {downloadError && <p className="error-text">{downloadError}</p>}
      </div>

      {reviewable.length > 0 && (
        <div className="review-nav-bar">
          <button className="review-nav-btn" onClick={() => goTo(currentIndex - 1)} aria-label="Previous suggestion">
            ‹
          </button>
          <span className="review-nav-count">
            {currentIndex + 1}/{reviewable.length}
          </span>
          <button className="review-nav-btn" onClick={() => goTo(currentIndex + 1)} aria-label="Next suggestion">
            ›
          </button>
          <button
            className={`btn-ghost review-nav-action bulk-undo${allKept ? ' is-armed' : ''}`}
            onClick={undoAll}
            disabled={!hasDecisions}
          >
            Undo all
          </button>
          <button
            className="btn-primary review-nav-action bulk-keep"
            onClick={keepAll}
            disabled={allKept}
            title={allKept ? 'All suggestions accepted' : undefined}
          >
            Keep all
          </button>
        </div>
      )}
    </div>
  );
}

function DiffBulletImpl({ bullet, decision, onAccept, onReject, onUndo, onDiscuss }, ref) {
  return (
    <div className="diff-bullet" ref={ref}>
      {decision === 'accepted' && (
        <>
          <p className="diff-line resolved">{bullet.suggestion}</p>
          <div className="diff-resolved-row">
            <span className="diff-resolved-label">Edited</span>
            <button className="link-btn" onClick={onUndo}>
              Undo
            </button>
          </div>
        </>
      )}
      {decision === 'rejected' && (
        <>
          <p className="diff-line resolved">{bullet.original}</p>
          <div className="diff-resolved-row">
            <span className="diff-resolved-label">Kept original</span>
            <button className="link-btn" onClick={onUndo}>
              Restore suggestion
            </button>
          </div>
        </>
      )}
      {!decision && (
        <>
          <p className="diff-line removed">{bullet.original}</p>
          <p className="diff-line added">{bullet.suggestion}</p>
          <div className="diff-actions">
            <button className="link-btn" onClick={onDiscuss}>
              Discuss
            </button>
            <div className="diff-actions-buttons">
              <button className="btn-accept" onClick={onAccept}>
                Accept
              </button>
              <button className="btn-reject" onClick={onReject}>
                Reject
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const DiffBullet = forwardRef(DiffBulletImpl);
