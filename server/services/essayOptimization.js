const { completeJson } = require('./llm');

function mockEssayReview({ university, major, questions, answers, profile }) {
  const isInternational = Boolean(profile?.location) && !/singapore/i.test(profile.location);

  const perQuestion = questions.map((q, i) => {
    const answer = (answers[i] || '').trim();
    const short = answer.length < 150;
    return {
      question: q,
      feedback: !answer
        ? 'No answer provided yet — an admissions reader needs a concrete story here, not a placeholder.'
        : short
        ? 'This answer is quite brief — expand with a specific example or moment that shows (not tells) the quality you are describing.'
        : 'Good length. Make sure the ending ties explicitly back to why this specifically prepares you for this program.',
    };
  });

  return {
    overallImpression: `Your essay responses for ${major || 'your intended major'} at ${university || 'this university'} show a reasonable starting point. Focus on specificity — concrete stories beat general statements about your qualities.`,
    strengths: ['Attempted all questions with relevant context.'],
    improvementAreas: ['Add more specific, concrete examples rather than general statements.'],
    internationalNote: isInternational
      ? `As an applicant from ${profile.location}, consider briefly addressing what specifically draws you to studying in Singapore in at least one answer.`
      : null,
    perQuestion,
  };
}

async function assessEssays({ university, major, questions, answers, profile }) {
  const system = `You are an expert university admissions essay coach. Never invent facts about the student — only sharpen what they actually wrote, and be honest when an answer is thin. Respond ONLY with valid JSON matching this shape:
{"overallImpression": string, "strengths": string[], "improvementAreas": string[], "internationalNote": string | null, "perQuestion": [{"question": string, "feedback": string}]}

- "overallImpression": 2-3 sentences on the essay set as a whole, naming the single biggest lever for improvement.
- "strengths"/"improvementAreas": 2-4 items each, about the essay set as a whole (not tied to one question).
- "internationalNote": ONLY if the student's profile indicates they're applying from outside Singapore — one concrete, high-level sentence of guidance (e.g. what an international applicant should address). Otherwise null.
- "perQuestion": exactly one feedback entry per question, in the same order, referencing the actual answer content. If an answer is empty or missing, say so plainly rather than inventing feedback about content that doesn't exist. 2-4 sentences each, specific and actionable.`;

  const prompt = `University: ${university || 'not specified'}
Major: ${major || 'not specified'}
Student profile: ${profile ? JSON.stringify(profile) : 'not provided'}

Essay questions and answers:
${questions.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] || '(no answer provided)'}`).join('\n\n')}`;

  const { data, source } = await completeJson({
    system,
    prompt,
    mockFn: () => mockEssayReview({ university, major, questions, answers, profile }),
  });

  return { ...data, university, major, source };
}

module.exports = { assessEssays };
