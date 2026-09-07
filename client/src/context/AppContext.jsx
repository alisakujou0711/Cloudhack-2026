import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

// Long enough that typing in a text field sends one write rather than one per keystroke, short
// enough that the header settles while the person is still looking at it.
const SAVE_DEBOUNCE_MS = 800;

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
    internshipPortfolio: { resumeText: '', targetRole: '', jobDescription: '' },
    essayOptimization: { university: '', major: '', questionCount: 1, questions: [''], answers: [''] },
    coverLetterOptimization: { companyName: '', role: '', promptCount: 1, prompts: [''], answers: [''], jobDescription: '' },
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

// The state document read from the server is spread over `defaultState()`, so a key added after
// an account's last save is present rather than undefined.
function fromDocument(document) {
  const parsed = { ...(document || {}) };
  // Older versions stored chat history split per page ({ university: [], internship: [] });
  // merge it into a single timeline so accounts created before that change don't lose history.
  if (parsed.chatHistory && !Array.isArray(parsed.chatHistory)) {
    parsed.chatHistory = [...(parsed.chatHistory.university || []), ...(parsed.chatHistory.internship || [])];
  }
  return { ...defaultState(), ...parsed };
}

function makeHistoryId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { account } = useAuth();
  const accountId = account ? account.id : null;

  const [state, setState] = useState(defaultState);
  // 'idle' with no session, then 'loading' -> 'ready' | 'error'. Nothing may judge the profile
  // gate before this reaches 'ready'.
  const [loadStatus, setLoadStatus] = useState('idle');
  const [loadAttempt, setLoadAttempt] = useState(0);

  // The whole document goes up on every save, so the write reads the newest state at flush time
  // rather than whatever was current when it was scheduled.
  const latestState = useRef(state);
  const saveTimer = useRef(null);
  // The write currently on the wire, if any. Cancelling the timer cannot recall one already sent.
  const inFlightSave = useRef(null);
  // The account a queued or in-flight write belongs to; it must never land on the next one.
  const savingFor = useRef(null);

  useEffect(() => {
    latestState.current = state;
  }, [state]);

  const runSave = useCallback((forAccountId) => {
    if (!forAccountId || savingFor.current !== forAccountId) return;
    const request = api
      .saveState(latestState.current)
      .catch((err) => {
        // A 401 is already handled centrally by the API client; anything else is logged and left
        // alone rather than interrupting whatever the person is doing.
        console.warn('Failed to save your work', err);
      })
      .finally(() => {
        if (inFlightSave.current === request) inFlightSave.current = null;
      });
    // Settled or not, this is the write "clear my data" has to outlast. It never rejects.
    inFlightSave.current = request;
  }, []);

  const cancelPendingSave = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
  }, []);

  const scheduleSave = useCallback(() => {
    const forAccountId = savingFor.current;
    if (!forAccountId) return;
    cancelPendingSave();
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      runSave(forAccountId);
    }, SAVE_DEBOUNCE_MS);
  }, [cancelPendingSave, runSave]);

  // The server is the sole source of truth: the document is read once per session and nothing is
  // written to browser storage. See docs/adr/0002-server-is-sole-source-of-truth.md.
  useEffect(() => {
    // A queued write belongs to the account that made it; signing out drops it rather than
    // letting it land on whoever signs in next.
    cancelPendingSave();
    savingFor.current = accountId;

    if (!accountId) {
      setState(defaultState());
      setLoadStatus('idle');
      return undefined;
    }

    let cancelled = false;
    setLoadStatus('loading');
    api
      .getState()
      .then((document) => {
        if (cancelled) return;
        setState(fromDocument(document));
        setLoadStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Failed to load your saved work', err);
        setLoadStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [accountId, loadAttempt, cancelPendingSave]);

  useEffect(() => cancelPendingSave, [cancelPendingSave]);

  const reloadState = () => setLoadAttempt((attempt) => attempt + 1);

  // Every mutation goes through here: React state moves immediately and the whole document is
  // scheduled for a write. Loading deliberately does not, or the document that just arrived
  // would be written straight back.
  const mutate = (updater) => {
    setState(updater);
    scheduleSave();
  };

  const setProfile = (profile) => mutate((s) => ({ ...s, profile }));
  const setUniversityPortfolio = (updates) =>
    mutate((s) => ({ ...s, universityPortfolio: { ...s.universityPortfolio, ...updates } }));
  const setInternshipPortfolio = (updates) =>
    mutate((s) => ({ ...s, internshipPortfolio: { ...s.internshipPortfolio, ...updates } }));
  const setEssayOptimization = (updates) =>
    mutate((s) => ({ ...s, essayOptimization: { ...s.essayOptimization, ...updates } }));
  const setCoverLetterOptimization = (updates) =>
    mutate((s) => ({ ...s, coverLetterOptimization: { ...s.coverLetterOptimization, ...updates } }));
  const setInterviewPrep = (updates) => mutate((s) => ({ ...s, interviewPrep: { ...s.interviewPrep, ...updates } }));
  const setUniversityAssessment = (result) => mutate((s) => ({ ...s, universityAssessment: result }));
  const setInternshipAssessment = (result) => mutate((s) => ({ ...s, internshipAssessment: result }));
  const setEssayAssessment = (result) => mutate((s) => ({ ...s, essayAssessment: result }));
  const setCoverLetterAssessment = (result) => mutate((s) => ({ ...s, coverLetterAssessment: result }));
  const setInterviewPlan = (result) => mutate((s) => ({ ...s, interviewPlan: result }));
  const appendChat = (entry) => mutate((s) => ({ ...s, chatHistory: [...s.chatHistory, entry] }));

  const addHistoryEntry = (entry) =>
    mutate((s) => ({
      ...s,
      history: [{ id: makeHistoryId(), timestamp: Date.now(), bookmarked: false, ...entry }, ...s.history],
    }));
  const toggleBookmark = (id) =>
    mutate((s) => ({
      ...s,
      history: s.history.map((h) => (h.id === id ? { ...h, bookmarked: !h.bookmarked } : h)),
    }));
  const removeHistoryEntry = (id) =>
    mutate((s) => ({ ...s, history: s.history.filter((h) => h.id !== id) }));

  // What every destructive call has to do before it fires. A queued write still holds the document
  // being destroyed and would put it straight back; one already on the wire cannot be cancelled,
  // only outlasted, or its PUT lands after the destructive call and silently restores everything.
  // Returns the resume function to call if that call is refused — the cancelled write is unsaved
  // work, and dropping it would cost the person an edit they never asked to lose.
  const settlePendingWrites = useCallback(async () => {
    const hadQueuedWrite = Boolean(saveTimer.current);
    cancelPendingSave();
    if (inFlightSave.current) await inFlightSave.current;
    return () => {
      if (hadQueuedWrite) scheduleSave();
    };
  }, [cancelPendingSave, scheduleSave]);

  // The document exactly as a save would send it, for "Download my data" on the settings page.
  // It is the state object itself rather than a rebuilt copy, so a key added to `defaultState`
  // is in the download without anything here being touched.
  const exportDocument = () => state;

  // "Clear my data" in the settings page's Account actions — the destructive half of the header's
  // old "Start over", which became Sign out. The account survives; only the document goes, and it
  // goes on the server rather than just here, so signing back in shows the same empty account.
  // Losing the profile with it is what walks the person back to onboarding through the routing
  // gate.
  const clearData = async () => {
    const forAccountId = savingFor.current;
    if (!forAccountId) return;
    const resumePendingSave = await settlePendingWrites();
    try {
      await api.clearState();
    } catch (err) {
      // Nothing was cleared, so the document still stands and the dropped write is put back. The
      // settings page reports the failure itself, beside the control that made it.
      resumePendingSave();
      throw err;
    }
    if (savingFor.current !== forAccountId) return;
    // The server is already at the empty document, so this moves state without scheduling a
    // write of it — `mutate` here would save the defaults straight back over the wipe.
    setState(defaultState());
  };

  const value = {
    ...state,
    loadStatus,
    reloadState,
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
    exportDocument,
    clearData,
    settlePendingWrites,
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
