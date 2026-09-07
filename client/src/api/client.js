const BASE = '/api';

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

async function requestFormData(path, formData) {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

async function requestBlob(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return res.blob();
}

export const api = {
  health: () => request('/health'),
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
