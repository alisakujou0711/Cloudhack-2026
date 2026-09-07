const BASE = '/api';

// Set by AuthProvider. Called once, centrally, whenever a session turns out to be gone.
let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

const SESSION_EXPIRED = 'Your session has ended. Please sign in again.';

// Every transport ends a non-2xx the same way. A 401 outside /auth/* is never about the endpoint
// that returned it — the session expired or was revoked — so it is handled once, here, instead of
// landing in the inline .error-text of whichever panel made the call; the routing gate takes over
// from the cleared auth context. Auth endpoints are exempt: their 401 means "those credentials
// are wrong", which belongs on the sign-in screen.
function throwForResponse(path, res, data) {
  if (res.status === 401 && !path.startsWith('/auth/')) {
    if (unauthorizedHandler) unauthorizedHandler();
    throw new Error(SESSION_EXPIRED);
  }
  throw new Error(data.error || `Request failed: ${res.status}`);
}

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwForResponse(path, res, data);
  return data;
}

async function requestFormData(path, formData) {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', credentials: 'include', body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwForResponse(path, res, data);
  return data;
}

async function requestBlob(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throwForResponse(path, res, data);
  }
  return res.blob();
}

export const api = {
  health: () => request('/health'),
  signUp: (payload) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  signIn: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  signOut: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  // A wrong current password comes back 400, not 401, so it stays out of the session-expired
  // path above and lands beside the control that asked for it.
  changeEmail: (payload) => request('/account/email', { method: 'PATCH', body: JSON.stringify(payload) }),
  // Same 400-not-401 reasoning as above. Nothing about the held account changes, so unlike
  // `changeEmail` this one has no counterpart on AuthContext — but every *other* session on the
  // account is revoked server-side.
  changePassword: (payload) => request('/account/password', { method: 'PATCH', body: JSON.stringify(payload) }),
  // The account and everything it owns, gone for good — the current password is what makes that
  // safe to expose, and a wrong one is the same 400 as above. The session goes with the account,
  // so nothing needs signing out afterwards.
  deleteAccount: (payload) => request('/account', { method: 'DELETE', body: JSON.stringify(payload) }),
  // The state document travels as itself, not inside an envelope: what GET returns is what PUT
  // takes back.
  getState: () => request('/state'),
  saveState: (state) => request('/state', { method: 'PUT', body: JSON.stringify(state) }),
  // "Clear my data": the document goes back to the empty one a new account holds. The account,
  // and this session, are untouched.
  clearState: () => request('/state', { method: 'DELETE' }),
  universityOptions: () => request('/university/options'),
  assessUniversity: (payload) =>
    request('/assess/university', { method: 'POST', body: JSON.stringify(payload) }),
  assessInternship: (payload) =>
    request('/assess/internship', { method: 'POST', body: JSON.stringify(payload) }),
  chat: (payload) => request('/chat', { method: 'POST', body: JSON.stringify(payload) }),
  extractResume: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return requestFormData('/resume/extract', formData);
  },
  extractUniversityApplication: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return requestFormData('/university/extract', formData);
  },
  exportResumePdf: (payload) =>
    requestBlob('/resume/export', { method: 'POST', body: JSON.stringify(payload) }),
  extractUniversityFieldsFromText: (text) =>
    request('/university/extract-text', { method: 'POST', body: JSON.stringify({ text }) }),
  classifyDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return requestFormData('/optimize/classify', formData);
  },
  assessEssays: (payload) => request('/optimize/essay', { method: 'POST', body: JSON.stringify(payload) }),
  assessCoverLetter: (payload) =>
    request('/optimize/cover-letter', { method: 'POST', body: JSON.stringify(payload) }),
  prepareInterview: (payload) =>
    request('/interview/prepare', { method: 'POST', body: JSON.stringify(payload) }),
};
