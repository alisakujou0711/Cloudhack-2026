import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { mockNotice } from '../utils/llmSource';

/* Arrival ------------------------------------------------------------------
   Everything on the tab rises into place once, in reading order. Steps are set here rather than
   in CSS because the form's rows depend on which interview type is selected, and only this file
   knows the order they end up in. */
const rise = (step) => ({ '--rise-step': step });

/* How long is left ---------------------------------------------------------
   Three days is not an arbitrary line. It is the threshold interviewPrep.js already prepares
   against, where the advice switches to what to cut, so the deck says so before the plan does. */
function readCountdown(daysUntil) {
  const days = parseInt(daysUntil, 10);
  if (Number.isNaN(days) || days < 0) return null;
  return { days, short: days <= 3 };
}

// The countdown echoes under the field that sets it, not in the headline. A headline answers
// "where am I" and has to hold still; a note beside the input reads as an answer to the keystroke.
// Every variant is one line at this column width, so nothing below it can move.
function daysNoteFor(count) {
  if (!count) return 'Optional, but the plan is sharper with it.';
  if (count.days === 0) return 'Today';
  if (count.days === 1) return 'Tomorrow';
  return `In ${count.days} days`;
}

/* Page ---------------------------------------------------------------------- */

export default function InterviewsPage() {
  const { profile, interviewPrep, setInterviewPrep, interviewPlan, setInterviewPlan, addHistoryEntry } = useApp();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  // The arrival cascade is a one-time thing. The two interview types put a different number of
  // fields in the form, so switching shifts every child after them by a position, and React
  // remounts what no longer lines up — the odd field, but the days field and the button with it.
  // Left alone they replay the cascade, and one field fading in beside settled ones reads as a
  // glitch. So the form stops animating once the arrival has played out.
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    api.universityOptions().then((data) => setOptions(data.universities)).catch(() => {});
  }, []);

  // Waiting on the last element's animationend would read the real timing, but it only lands if
  // that element animated at all — under reduce, or across a hot reload, it never fires and the
  // form is left replaying its cascade on every switch. A timer always lands. Keep it just past
  // the end of the cascade in index.css: last step (7 * 55ms) plus the 480ms it runs for.
  useEffect(() => {
    const settle = setTimeout(() => setArrived(true), 900);
    return () => clearTimeout(settle);
  }, []);

  const update = (field) => (e) => setInterviewPrep({ [field]: e.target.value });
  const countdown = readCountdown(interviewPrep.daysUntil);

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
    <div className={arrived ? 'interviews is-arrived' : 'interviews'}>
      <h1 className="iv-headline" style={rise(0)}>
        You have an interview coming up.
      </h1>
      <p className="iv-deck" style={rise(1)}>
        Tell us who you are meeting and how long you have.
      </p>

      <div className="iv-body">
        <form onSubmit={handleSubmit} className="iv-form">
          <label style={rise(2)}>
            Interview type
            <select value={interviewPrep.type} onChange={update('type')}>
              <option value="internship">Internship / Job interview</option>
              <option value="university">University admissions interview</option>
            </select>
          </label>

          {interviewPrep.type === 'university' ? (
            <>
              <label style={rise(3)}>
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
              <label style={rise(4)}>
                Major
                <input value={interviewPrep.major} onChange={update('major')} placeholder="e.g. Computer Science" />
              </label>
            </>
          ) : (
            <>
              <label style={rise(3)}>
                Company name
                <input value={interviewPrep.companyName} onChange={update('companyName')} placeholder="e.g. Stripe" />
              </label>
              <label style={rise(4)}>
                Role
                <input value={interviewPrep.role} onChange={update('role')} placeholder="e.g. Software Engineering Intern" />
              </label>
              <label style={rise(5)}>
                Job description (optional)
                <textarea rows={4} value={interviewPrep.jobDescription} onChange={update('jobDescription')} />
              </label>
            </>
          )}

          <div className="iv-days-field" style={rise(6)}>
            <label>
              Days from now
              <input
                type="number"
                min="0"
                value={interviewPrep.daysUntil}
                onChange={update('daysUntil')}
                placeholder="e.g. 3"
                aria-describedby="iv-days-note"
              />
            </label>
            {/* Three days or fewer is where interviewPrep.js switches to what to cut. Amber already
                means time on this tab, so the colour carries that without a second line of copy. */}
            <p
              className={countdown?.short ? 'iv-days-note is-short' : 'iv-days-note'}
              id="iv-days-note"
              aria-live="polite"
            >
              {daysNoteFor(countdown)}
            </p>
          </div>

          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="iv-submit" disabled={loading} style={rise(7)}>
            {loading ? 'Building your plan…' : 'Build my prep plan'}
          </button>
        </form>

        <div className="iv-plan-slot">
          {interviewPlan ? (
            <InterviewPlanView plan={interviewPlan} onSave={handleSaveToHistory} saved={saved} />
          ) : (
            <div className="plan-empty">
              <h2 style={rise(2)}>{loading ? 'Putting the plan together…' : 'No plan yet'}</h2>
              <p style={rise(3)}>
                Your plan lands here: what to research, what to practise, and the questions to rehearse out
                loud.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* The plan -------------------------------------------------------------------
   Exported and reused by HistoryPage to render saved plans, so it carries its own scope
   (.prep-plan) and its own arrival cascade rather than relying on the tab around it. */

export function InterviewPlanView({ plan, onSave, saved }) {
  const notice = mockNotice(plan.source);
  return (
    <div className="prep-plan">
      {notice && (
        <p className="mock-notice" style={rise(2)}>
          {notice}
        </p>
      )}

      <div className="plan-head" style={rise(2)}>
        <h2 className="plan-target">{plan.targetName}</h2>
        {onSave && (
          <button className="plan-save" onClick={onSave} disabled={saved}>
            {saved ? 'Saved to History' : 'Save to History'}
          </button>
        )}
      </div>

      <p className="plan-overview" style={rise(3)}>
        {plan.overview}
      </p>
      {plan.internationalNote && (
        <p className="international-note" style={rise(4)}>
          🌍 {plan.internationalNote}
        </p>
      )}

      <div className="plan-lists" style={rise(5)}>
        <section>
          <h3>Research</h3>
          <ul className="plan-checks">
            {plan.researchTips?.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Practise</h3>
          <ul className="plan-checks">
            {plan.technicalPrep?.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="plan-timeline" style={rise(6)}>
        <h3>How to spend the time you have</h3>
        <p>{plan.timelineAdvice}</p>
      </section>

      <section className="plan-questions" style={rise(7)}>
        <h3 className="plan-questions-title">Questions to rehearse</h3>
        {plan.commonQuestions?.map((q, i) => (
          <RehearsalLine key={i} question={q} defaultOpen={i === 0} />
        ))}
      </section>
    </div>
  );
}

// A question is worth more when you try it before you read the model answer, so the sample is
// folded away — the page is something to rehearse against rather than a transcript to skim. The
// first one opens so the reveal shows what it holds.
function RehearsalLine({ question, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <article className={`rehearsal${open ? ' is-open' : ''}`}>
      <h4 className="rehearsal-question">{question.question}</h4>
      <p className="rehearsal-how">{question.howToAnswer}</p>
      <button type="button" className="rehearsal-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? 'Hide the sample answer' : 'Show a sample answer'}
      </button>
      {open && <p className="rehearsal-sample">“{question.sampleAnswer}”</p>}
    </article>
  );
}
