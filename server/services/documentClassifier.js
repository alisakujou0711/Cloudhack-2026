const { completeJson } = require('./llm');

// Heuristic fallback classifier used only when no LLM provider is configured.
function mockClassify(text) {
  const lower = text.toLowerCase();
  const score = { resume: 0, university_application: 0, essay: 0, cover_letter: 0 };

  if (/\b(experience|internship|skills|projects)\b/.test(lower)) score.resume += 2;
  if (/\b(gpa|transcript|extracurricular|subjects taken)\b/.test(lower)) score.university_application += 2;
  if (/\bdear (hiring|admissions|sir|madam|recruiter)\b/.test(lower)) score.cover_letter += 3;
  if (/\bsincerely\b|\bbest regards\b|\byours faithfully\b/.test(lower)) score.cover_letter += 1;
  if (/\bwhy (do you want|i want|this university|this program|this major)\b/.test(lower)) score.essay += 2;
  if (/\bpersonal statement\b|\badmissions essay\b/.test(lower)) score.essay += 2;

  let best = null;
  let bestScore = 0;
  for (const [type, s] of Object.entries(score)) {
    if (s > bestScore) {
      best = type;
      bestScore = s;
    }
  }

  return {
    predictedType: best || 'unknown',
    reason: best
      ? 'Heuristic keyword match (offline mode).'
      : "Couldn't confidently tell from keywords alone (offline mode).",
  };
}

async function classifyDocument(text) {
  const system = `Classify a student's uploaded document into exactly one of: "resume", "university_application", "essay", "cover_letter", or "unknown" if you genuinely can't tell. A "university_application" document typically discusses GPA/transcript/subjects/extracurriculars rather than work experience. Respond ONLY with valid JSON:
{"predictedType": "resume" | "university_application" | "essay" | "cover_letter" | "unknown", "reason": string}
"reason" is one short sentence naming the concrete signal (e.g. "Lists work experience with bullet points and metrics" or "Addressed to a hiring manager and closes with 'Sincerely'").`;

  const prompt = `Document text (may be truncated):\n"""\n${text.slice(0, 4000)}\n"""`;

  const { data, source } = await completeJson({
    system,
    prompt,
    mockFn: () => mockClassify(text),
  });

  return { predictedType: data.predictedType, reason: data.reason, source };
}

module.exports = { classifyDocument };
