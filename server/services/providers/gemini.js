const MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 25000;

const hasKey = Boolean(process.env.GEMINI_API_KEY);

// Gemini uses "model" instead of Anthropic/OpenAI's "assistant" for the reply role.
function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

async function generateContent({ system, contents, jsonMode }) {
  const url = `${API_BASE}/${MODEL}:generateContent`;
  const body = {
    contents,
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    generationConfig: jsonMode ? { responseMimeType: 'application/json' } : undefined,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Gemini request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini request failed: ${res.status}`);
  }

  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error(`Gemini returned no candidates (finishReason: ${data?.promptFeedback?.blockReason || 'unknown'})`);
  }
  return (candidate.content?.parts || []).map((p) => p.text || '').join('');
}

async function completeJson({ system, prompt }) {
  const text = await generateContent({
    system,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    jsonMode: true,
  });
  return JSON.parse(text);
}

async function completeText({ system, messages }) {
  return generateContent({ system, contents: toGeminiContents(messages), jsonMode: false });
}

module.exports = { completeJson, completeText, hasKey, MODEL };
