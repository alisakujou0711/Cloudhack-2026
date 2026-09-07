const { completeJson } = require('./llm');

// Rough monthly SGD stipend ranges for common Singapore internship roles, used only to give the
// mock/sample answer a realistic anchor — not a source of truth for real compensation.
function salaryRangeFor(role) {
  const r = (role || '').toLowerCase();
  if (/(software|engineer|developer|swe|full[\s-]?stack|backend|frontend)/.test(r)) return 'SGD 1,000–1,800 per month';
  if (/(data|analytic|machine learning|ml\b)/.test(r)) return 'SGD 900–1,500 per month';
  if (/(cyber|security)/.test(r)) return 'SGD 1,000–1,600 per month';
  if (/(finance|investment|banking|equity)/.test(r)) return 'SGD 800–1,400 per month';
  if (/(mechanical|electrical|civil|hardware|engineer)/.test(r)) return 'SGD 800–1,300 per month';
  if (/(marketing|business|sales|design)/.test(r)) return 'SGD 700–1,200 per month';
  return 'SGD 800–1,500 per month';
}

function mockPrep({ type, targetName, role, major, daysUntil, profile }) {
  const isInternational = Boolean(profile?.location) && !/singapore/i.test(profile.location);
  const isUniversity = type === 'university';
  const salaryRange = salaryRangeFor(role);

  const commonQuestions = [
    {
      question: 'What is your expected salary?',
      howToAnswer:
        'Give a realistic range based on market research for the role and level, and frame it as flexible — the goal is to show you have done your homework without boxing yourself in.',
      sampleAnswer:
        `Based on my research into similar ${role || 'internship'} roles in Singapore, I'd expect something in the range of ${salaryRange}, but I'm flexible and more interested in the learning opportunity and fit with the team.`,
    },
    {
      question: 'What is your greatest weakness?',
      howToAnswer:
        'Pick a real, specific weakness (not a disguised strength), then show a concrete step you have taken to improve it.',
      sampleAnswer:
        "I sometimes spend too long polishing small details before sharing work with my team. I've been actively working on this by setting myself time-boxes and sharing drafts earlier to get feedback sooner.",
    },
    {
      question: 'Do you have any questions for us?',
      howToAnswer:
        'Always have at least two ready — it shows genuine interest. Ask about the team, the work itself, or how success is measured, not things easily found on the website.',
      sampleAnswer:
        "What does a typical first project look like for someone in this role, and how is success measured in the first few months?",
    },
  ];

  if (isUniversity) {
    commonQuestions.unshift({
      question: `Why do you want to study ${major || 'this major'} here?`,
      howToAnswer: 'Connect a specific, real experience of yours to something concrete about the program (a module, research area, or teaching style).',
      sampleAnswer: `I've been building small projects on my own, and what draws me to this program specifically is the chance to go deeper with structured mentorship and access to research I can't get on my own.`,
    });
  } else {
    commonQuestions.unshift({
      question: 'Tell me about yourself.',
      howToAnswer: 'Keep it to 60-90 seconds: a brief relevant background, one concrete example of your work, and why you want this specific role.',
      sampleAnswer:
        "I'm currently studying [your field], and over the past year or two I've been building projects and taking on roles that let me dig into [your area of interest] hands-on rather than just in the classroom. For example, [one concrete project or experience], which taught me [a skill or lesson relevant to this role]. Outside of that, I've also [a relevant extracurricular, part-time role, or team experience] that helped me get comfortable working with others toward a shared goal. I'm applying for this role because it lets me take that hands-on experience and apply it to real problems at your organization, and I'm especially excited about [something specific about the team or role].",
    });
  }

  return {
    targetName,
    overview: isUniversity
      ? `${targetName} is one of Singapore's established universities. Research its specific department/program pages for ${major || 'your intended major'} — module lists, research focus areas, and faculty — since interviewers often expect you to reference specifics rather than generic praise.`
      : `${targetName} is a company you should research directly — check their About/Careers pages and recent news for what they actually build and how the team you're interviewing with fits in. Generic "great company" answers are usually easy to spot.`,
    researchTips: isUniversity
      ? [
          `Look up ${targetName}'s specific curriculum and any standout modules/research areas for ${major || 'your major'}.`,
          'Read a recent news story or achievement from the department to reference naturally.',
          'Prepare 2-3 specific reasons this program (not "this university" in general) fits your goals.',
        ]
      : [
          `Read ${targetName}'s About/Careers page and any recent news or product launches.`,
          'Look up the specific team or product area for this role if mentioned.',
          'Check employee reviews (e.g. Glassdoor) for a sense of culture, but treat them as one data point.',
        ],
    technicalPrep: isUniversity
      ? [`Review the fundamentals typically expected for ${major || 'this major'} admission interviews — be ready to discuss a project or piece of coursework in depth.`]
      : ['Review the core skills listed in the job description, if provided, and be ready to walk through one project that demonstrates each.'],
    timelineAdvice:
      typeof daysUntil === 'number' && daysUntil <= 3
        ? `With only ${daysUntil} day(s) left, prioritize: (1) the overview/research above, (2) practicing your answers to the common questions out loud once, and (3) getting a good night's sleep. Skip anything that isn't one of those.`
        : `You have some time to prepare — spread the research and technical review across the days leading up to it, and do a final run-through of the common questions the day before.`,
    commonQuestions,
    internationalNote: isInternational
      ? `As an applicant from ${profile.location}, be ready for a question about your visa/work-authorization or relocation plans — have a confident, factual one-line answer prepared.`
      : null,
  };
}

async function prepareInterview({ type, university, major, companyName, role, jobDescription, daysUntil, profile }) {
  const targetName = type === 'university' ? university : companyName;

  const system = `You are an expert interview coach helping a student prepare for an upcoming ${
    type === 'university' ? 'university admissions' : 'internship/job'
  } interview. Never invent specific facts you can't be confident about (e.g. don't state a made-up statistic or claim) — keep organizational descriptions general and encourage the student to verify specifics themselves. Respond ONLY with valid JSON matching this shape:
{
  "targetName": string,
  "overview": string,
  "researchTips": string[],
  "technicalPrep": string[],
  "timelineAdvice": string,
  "commonQuestions": [{"question": string, "howToAnswer": string, "sampleAnswer": string}],
  "internationalNote": string | null
}

- "overview": 2-4 sentences of general, honest background on the organization/university and what it does/focuses on — hedge appropriately, don't invent specifics.
- "researchTips": 3-5 concrete things to look up before the interview.
- "technicalPrep": 2-4 topics/skills to review, tailored to the role/major (and job description if provided).
- "timelineAdvice": prioritized advice given how many days are left before the interview — be concrete about what to prioritize if time is short.
- "commonQuestions": MUST include entries for "What is your expected salary?", "What is your greatest weakness?", and "Do you have any questions for us?" — plus 1-2 more relevant ones (e.g. "Tell me about yourself" for a job interview, or "Why this major/university?" for an admissions interview). For each: a short "howToAnswer" strategy tip, and a concrete "sampleAnswer" the student could adapt.
  - STRICT REQUIREMENT for "What is your expected salary?": the sampleAnswer MUST contain an actual number range in the text itself (e.g. "SGD 1,000–1,600 per month" or "SGD 1,200 to 1,800 monthly") that is realistic for the given role/level in Singapore — never say only "the standard/market rate" without also naming the number range. Example sampleAnswer: "Based on my research, roles like this in Singapore typically pay around SGD 1,000–1,600 per month, though I'm flexible and more focused on the learning opportunity and fit with the team."
  - STRICT REQUIREMENT for "Tell me about yourself": the sampleAnswer MUST be 5-7 full sentences (not 2-3) covering: (1) current background/field of study, (2) one concrete project or experience with a specific detail, (3) a relevant extracurricular/team/leadership experience, (4) why this specific role/organization. A short 2-sentence answer is NOT acceptable here.
- "internationalNote": ONLY if the student's profile indicates they're applying from outside Singapore — one concrete sentence about a consideration to prepare for (e.g. visa/relocation questions). Otherwise null.`;

  const prompt = `Interview type: ${type === 'university' ? 'University admissions interview' : 'Internship/job interview'}
Target: ${targetName || 'not specified'}
${type === 'university' ? `Major: ${major || 'not specified'}` : `Role: ${role || 'not specified'}`}
${jobDescription ? `Job description provided:\n${jobDescription}` : 'No job description provided.'}
Days until interview: ${typeof daysUntil === 'number' ? daysUntil : 'not specified'}
Student profile: ${profile ? JSON.stringify(profile) : 'not provided'}`;

  const { data, source } = await completeJson({
    system,
    prompt,
    mockFn: () => mockPrep({ type, targetName, role, major, daysUntil, profile }),
  });

  return { ...data, type, source };
}

module.exports = { prepareInterview };
