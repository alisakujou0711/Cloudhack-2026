import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useApp } from '../context/AppContext';
import { useChatUI } from '../context/ChatUIContext';
import { api } from '../api/client';

const TAB_LABELS = {
  optimize: 'Application Optimization',
  history: 'History',
  interviews: 'Interviews',
  inspirations: 'Inspirations',
};

export default function ChatbotWidget() {
  const location = useLocation();
  const currentTab = location.pathname.split('/')[2] || 'optimize';
  const {
    profile,
    universityPortfolio,
    internshipPortfolio,
    essayOptimization,
    coverLetterOptimization,
    interviewPrep,
    universityAssessment,
    internshipAssessment,
    essayAssessment,
    coverLetterAssessment,
    interviewPlan,
    chatHistory,
    appendChat,
  } = useApp();
  const { open, setOpen, draft, setDraft } = useChatUI();

  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // One shared conversation for the whole account — it carries over as the user moves between
  // tabs, so the bot keeps prior context regardless of where they are.
  const history = chatHistory;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const buildContext = () => ({
    currentTab,
    profile,
    university: { portfolio: universityPortfolio, assessment: universityAssessment },
    internship: { portfolio: internshipPortfolio, assessment: internshipAssessment },
    essay: { setup: essayOptimization, assessment: essayAssessment },
    coverLetter: { setup: coverLetterOptimization, assessment: coverLetterAssessment },
    interview: { setup: interviewPrep, plan: interviewPlan },
  });

  const handleSend = async (e) => {
    e.preventDefault();
    const message = draft.trim();
    if (!message || loading) return;
    setDraft('');
    appendChat({ role: 'user', content: message });
    setLoading(true);
    try {
      const { reply } = await api.chat({
        message,
        history: history.map((h) => ({ role: h.role, content: h.content })),
        context: buildContext(),
      });
      appendChat({ role: 'assistant', content: reply });
    } catch (err) {
      appendChat({ role: 'assistant', content: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="chatbot-fab" onClick={() => setOpen((o) => !o)} aria-label="Ask Portfolio Chatbot">
        {open ? 'Close' : 'Ask Portfolio Chatbot'}
      </button>
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            Portfolio Chatbot
            <span className="chatbot-context-label">Viewing: {TAB_LABELS[currentTab] || currentTab}</span>
          </div>
          <div className="chatbot-messages" ref={scrollRef}>
            {history.length === 0 && (
              <p className="chatbot-empty">
                Ask me anything about your university, internship, essay, or cover letter optimization, or general
                questions about the application process — this conversation follows you across the whole app.
              </p>
            )}
            {history.map((m, i) => (
              <div key={i} className={`chatbot-msg ${m.role}`}>
                {m.role === 'assistant' ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
              </div>
            ))}
            {loading && <div className="chatbot-msg assistant loading">Thinking…</div>}
          </div>
          <form className="chatbot-input-row" onSubmit={handleSend}>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="What should I improve first?"
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
