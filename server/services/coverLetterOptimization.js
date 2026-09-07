const { completeJson } = require('./llm');

function mockCoverLetterReview({ companyName, role, prompts, answers, profile }) {
  const isInternational = Boolean(profile?.location) && !/singapore/i.test(profile.location);

  const perPrompt = prompts.map((p, i) => {
    const answer = (answers[i] || '').trim();
    const short = answer.length < 150;
    return {
      prompt: p,
      feedback: !answer
        ? 'No answer provided yet — a hiring manager needs a concrete, specific claim here, not a placeholder.'
        : short
        ? 'This is brief — add a specific, quantified example that proves the claim you are making.'
        : 'Good length — make sure it closes with a clear, confident call to action.',
    };
  });

  return {
    overallImpression: `Your cover letter draft for the ${role || 'role'} at ${companyName || 'this company'} is a reasonable starting point. Focus on tying your specific experience directly to what this role needs.`,
    strengths: ['Attempted all prompts with relevant context.'],
    improvementAreas: ['Tie your examples more directly to the specific role and company.'],
    internationalNote: isInternational
      ? `As an applicant from ${profile.location}, proactively mention your work-authorization situation (e.g. visa/pass eligibility for Singapore) so the employer isn't left guessing.`
      : null,
    perPrompt,
  };
}

async function assessCoverLetter({ companyName, role, prompts, answers, jobDescription, profile }) {
  const system = `You are an expert career coach reviewing cover letters for internship/job applications. Never invent facts about the student — only sharpen what they actually wrote, and be honest when an answer is thin. Respond ONLY with valid JSON matching this shape:
{"overallImpression": string, "strengths": string[], "improvementAreas": string[], "internationalNote": string | null, "perPrompt": [{"prompt": string, "feedback": string}]}

- "overallImpression": 2-3 sentences on the letter as a whole, naming the single biggest lever for improvement.
- "strengths"/"improvementAreas": 2-4 items each, about the letter as a whole. When a job description is provided, judge the letter against what that posting actually asks for — name the requirements it never speaks to, and don't credit it for language the posting doesn't care about.
- "internationalNote": ONLY if the student's profile indicates they're applying from outside Singapore — one concrete sentence about work-authorization/visa considerations for a Singapore-based role. Otherwise null.
- "perPrompt": exactly one feedback entry per prompt, in the same order, referencing the actual answer content. If an answer is empty or missing, say so plainly. 2-4 sentences each, specific and actionable. Where a job description is provided, say whether the answer connects to it — but never suggest claiming experience the student didn't write.`;

  const prompt = `Company: ${companyName || 'not specified'}
Role: ${role || 'not specified'}
${jobDescription ? `Job description provided:\n${jobDescription}` : 'No job description provided.'}
Student profile: ${profile ? JSON.stringify(profile) : 'not provided'}

Cover letter prompts and answers:
${prompts.map((p, i) => `Prompt ${i + 1}: ${p}\nAnswer ${i + 1}: ${answers[i] || '(no answer provided)'}`).join('\n\n')}`;

  const { data, source } = await completeJson({
    system,
    prompt,
    mockFn: () => mockCoverLetterReview({ companyName, role, prompts, answers, profile }),
  });

  return { ...data, companyName, role, source };
}

module.exports = { assessCoverLetter };
