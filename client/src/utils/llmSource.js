export function isMockSource(source) {
  return source === 'mock' || source === 'mock-fallback';
}

// 'mock' = no provider configured at all; 'mock-fallback' = a provider IS configured but the
// live call failed (rate limit, quota, transient error) — these need different messaging so we
// don't tell someone with a working key that they haven't set one up.
export function mockNotice(source) {
  if (source === 'mock') {
    return 'Demo mode: no LLM provider configured on the server — showing rule-based feedback.';
  }
  return null;
}
