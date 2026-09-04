const gemini = require('./providers/gemini');
const anthropic = require('./providers/anthropic');

// Explicit LLM_PROVIDER wins; otherwise prefer whichever key is configured (Gemini first).
const PROVIDER =
  process.env.LLM_PROVIDER ||
  (gemini.hasKey ? 'gemini' : anthropic.hasKey ? 'anthropic' : 'none');

const provider = { gemini, anthropic }[PROVIDER];
const hasKey = Boolean(provider);

if (hasKey) {
  console.log(`[llm] Using provider "${PROVIDER}" (model: ${provider.MODEL})`);
}

/**
 * Calls the configured LLM provider and expects JSON back.
 * Falls back to `mockFn()` when no provider is configured, so the demo works out of the box.
 */
async function completeJson({ system, prompt, mockFn }) {
  if (!hasKey) {
    return { data: mockFn(), source: 'mock' };
  }
  try {
    const data = await provider.completeJson({ system, prompt });
    return { data, source: PROVIDER };
  } catch (err) {
    console.error(`[llm] completeJson (${PROVIDER}) failed, falling back to mock:`, err.message);
    return { data: mockFn(), source: 'mock-fallback' };
  }
}

/** Calls the configured LLM provider for a free-text chat reply. Falls back to a canned response. */
async function completeText({ system, messages, mockFn }) {
  if (!hasKey) {
    return { text: mockFn(), source: 'mock' };
  }
  try {
    const text = await provider.completeText({ system, messages });
    return { text, source: PROVIDER };
  } catch (err) {
    console.error(`[llm] completeText (${PROVIDER}) failed, falling back to mock:`, err.message);
    return { text: mockFn(), source: 'mock-fallback' };
  }
}

module.exports = { completeJson, completeText, hasKey, provider: PROVIDER };
