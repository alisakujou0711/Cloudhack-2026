const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-sonnet-4-5';
const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
const client = hasKey ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

// Strips ```json fences etc. if the model wraps its output.
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  return JSON.parse(raw.trim());
}

async function completeJson({ system, prompt }) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = response.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
  return extractJson(text);
}

async function completeText({ system, messages }) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages,
  });
  return response.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
}

module.exports = { completeJson, completeText, hasKey, MODEL };
