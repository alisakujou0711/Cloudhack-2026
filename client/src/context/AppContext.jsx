import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'portfoliopath_state';

const EDUCATION_LEVELS = [
  { value: 'jc', label: 'Junior College / Pre-University' },
  { value: 'university', label: 'Undergraduate' },
  { value: 'graduate', label: 'Graduate' },
];

const PRE_UNIVERSITY_LEVELS = new Set(['jc']);

// Which optimization type to suggest first in the type picker (not a hard route anymore —
// all four types are always reachable from the single Application Optimization tab).
function suggestedOptimizationType(educationLevel) {
  return PRE_UNIVERSITY_LEVELS.has(educationLevel) ? 'university' : 'internship';
}

function defaultState() {
  return {
    profile: null,
    universityPortfolio: { country: 'Singapore', major: '', university: '', gpa: '', subjects: '', extracurriculars: '', languageProficiency: '', rawText: '' },
    internshipPortfolio: { resumeText: '', targetRole: '' },
    essayOptimization: { university: '', major: '', questionCount: 1, questions: [''], answers: [''] },
    coverLetterOptimization: { companyName: '', role: '', promptCount: 1, prompts: [''], answers: [''] },
    interviewPrep: { type: 'internship', university: '', major: '', companyName: '', role: '', jobDescription: '', daysUntil: '' },
    universityAssessment: null,
    internshipAssessment: null,
    essayAssessment: null,
    coverLetterAssessment: null,
    interviewPlan: null,
    // Single shared conversation across the whole app, scoped to the account — not per-page, so
    // context (and the model's answers) carries over as the user moves between tabs.
    chatHistory: [],
    // Every completed optimization run (any of the 4 types) plus bookmarks, shown in History.
    history: [],
  };
}

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Older versions stored chat history split per page ({ university: [], internship: [] });
      // merge it into a single timeline so accounts created before this change don't lose history.
      if (parsed.chatHistory && !Array.isArray(parsed.chatHistory)) {
        parsed.chatHistory = [...(parsed.chatHistory.university || []), ...(parsed.chatHistory.internship || [])];
      }
      return { ...defaultState(), ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load saved state', err);
  }
  return defaultState();
}

function makeHistoryId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setProfile = (profile) => setState((s) => ({ ...s, profile }));
  const setUniversityPortfolio = (updates) =>
    setState((s) => ({ ...s, universityPortfolio: { ...s.universityPortfolio, ...updates } }));
  const setInternshipPortfolio = (updates) =>
    setState((s) => ({ ...s, internshipPortfolio: { ...s.internshipPortfolio, ...updates } }));
  const setEssayOptimization = (updates) =>
    setState((s) => ({ ...s, essayOptimization: { ...s.essayOptimization, ...updates } }));
  const setCoverLetterOptimization = (updates) =>
    setState((s) => ({ ...s, coverLetterOptimization: { ...s.coverLetterOptimization, ...updates } }));
  const setInterviewPrep = (updates) => setState((s) => ({ ...s, interviewPrep: { ...s.interviewPrep, ...updates } }));
  const setUniversityAssessment = (result) => setState((s) => ({ ...s, universityAssessment: result }));
  const setInternshipAssessment = (result) => setState((s) => ({ ...s, internshipAssessment: result }));
  const setEssayAssessment = (result) => setState((s) => ({ ...s, essayAssessment: result }));
  const setCoverLetterAssessment = (result) => setState((s) => ({ ...s, coverLetterAssessment: result }));
  const setInterviewPlan = (result) => setState((s) => ({ ...s, interviewPlan: result }));
  const appendChat = (entry) => setState((s) => ({ ...s, chatHistory: [...s.chatHistory, entry] }));

  const addHistoryEntry = (entry) =>
    setState((s) => ({
      ...s,
      history: [{ id: makeHistoryId(), timestamp: Date.now(), bookmarked: false, ...entry }, ...s.history],
    }));
  const toggleBookmark = (id) =>
    setState((s) => ({
      ...s,
      history: s.history.map((h) => (h.id === id ? { ...h, bookmarked: !h.bookmarked } : h)),
    }));
  const removeHistoryEntry = (id) =>
    setState((s) => ({ ...s, history: s.history.filter((h) => h.id !== id) }));

  // No caller since the header's "Start over" became "Sign out"; the History page picks it up
  // as "Clear my data".
  const resetAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(defaultState());
  };

  const value = {
    ...state,
    setProfile,
    setUniversityPortfolio,
    setInternshipPortfolio,
    setEssayOptimization,
    setCoverLetterOptimization,
    setInterviewPrep,
    setUniversityAssessment,
    setInternshipAssessment,
    setEssayAssessment,
    setCoverLetterAssessment,
    setInterviewPlan,
    appendChat,
    addHistoryEntry,
    toggleBookmark,
    removeHistoryEntry,
    resetAll,
    suggestedOptimizationType: state.profile ? suggestedOptimizationType(state.profile.educationLevel) : 'university',
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { EDUCATION_LEVELS, suggestedOptimizationType };
