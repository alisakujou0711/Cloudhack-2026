const { completeText } = require('./llm');

// Finds the first bullet in an internship review that still has a pending (unaccepted) suggestion.
function firstSuggestedEdit(assessment) {
  for (const section of assessment?.sections || []) {
    for (const entry of section.entries || []) {
      for (const bullet of entry.bullets || []) {
        if (bullet.suggestion) return bullet;
      }
    }
  }
  return null;
}

function firstPointer(assessment) {
  if (!assessment) return null;
  const edit = firstSuggestedEdit(assessment);
  if (edit) return `this bullet: "${edit.original}" → "${edit.suggestion}"`;
  const gap = assessment.feedback?.gaps?.[0] || assessment.improvementAreas?.[0];
  if (gap) return `"${gap}"`;
  return null;
}

function mockReply(message, context) {
  const lower = message.toLowerCase();
  const { university, internship, essay, coverLetter } = context;

  if (lower.includes('notice period')) {
    return 'A notice period is the amount of time (often stated in an offer letter or contract) you must give your employer before your last working day when resigning, or that they must give you. For internships this is usually short or waived — check your specific offer letter.';
  }

  if (lower.includes('improve') || lower.includes('first')) {
    const candidates = [
      ['university application', university?.assessment],
      ['internship application', internship?.assessment],
      ['essay', essay?.assessment],
      ['cover letter', coverLetter?.assessment],
    ];
    for (const [label, assessment] of candidates) {
      const pointer = firstPointer(assessment);
      if (pointer) return `Based on your ${label} review, start with ${pointer}. That's currently a high-impact gap.`;
    }
    return 'Submit a university, internship, essay, or cover letter optimization first, and I can give you a specific starting point.';
  }

  return "I'm running in offline demo mode (no LLM API key configured), so my answers are limited to a few canned responses. Ask me about your assessment results, or set an API key on the server for full answers.";
}

async function chatReply({ message, history, context }) {
  const { profile } = context;
  const isInternational = Boolean(profile?.location) && !/singapore/i.test(profile.location);

  const system = `You are the Portfolio Chatbot inside Portify, a student application-optimization platform covering: University Application, Internship Application, Essay, and Cover Letter optimization, plus Interview Prep. This is a single, shared conversation for the student's account — it is NOT reset when they navigate around, so you may already have discussed any of these earlier in this thread.

You have access to the student's portfolios/assessments/plans for all of these below (any may be empty if not yet submitted) — feel free to answer questions about whichever one the student asks about, not just where they currently are in the app.
You can also answer general application-process questions (e.g. "what is a notice period").

Formatting:
- Write in Markdown. Structure multi-part answers with short bullet points or a numbered list rather than one dense paragraph — this is a chat UI, so scannability matters more than prose flow.
- Use **bold** to highlight the single most important word or phrase per point (a key term, a specific action, a number), not whole sentences.
- Keep it tight: a short lead-in sentence, then the structured points. Avoid headings (##) — this is a chat bubble, not a document.
- For a simple factual question, a plain 1-3 sentence answer is fine — don't force structure where it isn't needed.

Tone: warm, concrete, and honest about gaps — never vague encouragement without substance.
${
  isInternational
    ? `\nThis student's location ("${profile.location}") is outside Singapore, and this platform's university/internship data is Singapore-focused. When relevant to what they're asking, proactively flag international-applicant considerations (e.g. visa/work-pass requirements for Singapore internships, transcript equivalency or English proficiency tests for university admission, relocation/timeline logistics) — but only when relevant, don't force it into every reply. Keep any visa/policy claims high-level and hedge appropriately (e.g. "check with the specific employer/university") rather than stating specific rules you can't verify.`
    : ''
}

Context JSON:
${JSON.stringify(context, null, 2)}`;

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const { text, source } = await completeText({
    system,
    messages,
    mockFn: () => mockReply(message, context),
  });

  return { reply: text, source };
}

module.exports = { chatReply };
