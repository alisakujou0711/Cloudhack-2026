const { UNIVERSITIES } = require('../data/universityRequirements');
const { completeJson } = require('./llm');

function buildChecklist(portfolio, requirements, profile) {
  const items = [];

  const gpaMet = typeof portfolio.gpa === 'number' && portfolio.gpa >= requirements.minGpa;
  items.push({
    id: 'gpa',
    label: `Minimum GPA (${requirements.minGpa.toFixed(1)})`,
    met: gpaMet,
    detail: typeof portfolio.gpa === 'number'
      ? `Your GPA: ${portfolio.gpa.toFixed(2)}`
      : 'No GPA provided',
  });

  const studentSubjects = (portfolio.subjects || []).map((s) => s.toLowerCase());
  for (const subject of requirements.requiredSubjects) {
    const met = studentSubjects.includes(subject.toLowerCase());
    items.push({
      id: `subject-${subject}`,
      label: `Required subject: ${subject}`,
      met,
      detail: met ? 'Found in your submitted subjects' : 'Not found in your submitted subjects',
    });
  }

  for (const subject of requirements.preferredSubjects) {
    const met = studentSubjects.includes(subject.toLowerCase());
    items.push({
      id: `preferred-${subject}`,
      label: `Preferred subject: ${subject}`,
      met,
      detail: met ? 'Found in your submitted subjects' : 'Not listed — not required, but strengthens your application',
      optional: true,
    });
  }

  const hasEca = Boolean(portfolio.extracurriculars && portfolio.extracurriculars.trim().length > 0);
  items.push({
    id: 'extracurriculars',
    label: 'Extracurricular activities documented',
    met: hasEca,
    detail: hasEca ? 'Provided' : 'No extracurriculars submitted',
  });

  const isInternational = Boolean(profile?.location) && !/singapore/i.test(profile.location);
  if (isInternational) {
    const hasLangProf = Boolean(portfolio.languageProficiency && portfolio.languageProficiency.trim());
    items.push({
      id: 'language-proficiency',
      label: 'Language proficiency documented (e.g. IELTS/TOEFL)',
      met: hasLangProf,
      detail: hasLangProf ? `Provided: ${portfolio.languageProficiency}` : 'Required for most international applicants — not yet provided',
    });
  }

  return items;
}

function mockFeedback(university, major, requirements, checklist, portfolio, profile) {
  const unmet = checklist.filter((i) => !i.met && !i.optional);
  const strengths = checklist.filter((i) => i.met).map((i) => i.label);
  const isInternational = Boolean(profile?.location) && !/singapore/i.test(profile.location);
  return {
    summary:
      unmet.length === 0
        ? `Your portfolio meets the baseline checklist for ${major} at ${university.name}. Given the program's "${requirements.competitiveness}" competitiveness, focus next on differentiating yourself.`
        : `Your portfolio is missing ${unmet.length} baseline requirement(s) for ${major} at ${university.name}. Address these before focusing on differentiation.`,
    strengths: strengths.length ? strengths : ['Submission received — add more portfolio detail to surface strengths.'],
    gaps: unmet.map((i) => i.label),
    recommendations: [
      requirements.essentialExtracurriculars[0]
        ? `Build evidence for: ${requirements.essentialExtracurriculars[0]}`
        : 'Add more specific extracurricular evidence.',
      `Competitiveness for this major is "${requirements.competitiveness}" — highlight distinguishing achievements in your application materials.`,
      'Use the Essay Optimization tool to sharpen your personal statement before submitting it.',
    ],
    internationalNote: isInternational
      ? `As an applicant from ${profile.location}, check each university's international-student track — you'll typically need certified transcript translations/equivalency assessment and an English proficiency test (e.g. IELTS/TOEFL) if your prior schooling wasn't in English.`
      : null,
  };
}

async function assessUniversity({ university, major, portfolio, profile }) {
  const uni = UNIVERSITIES[university];
  if (!uni) throw new Error(`Unknown university: ${university}`);
  const requirements = uni.majors[major];
  if (!requirements) throw new Error(`Unknown major "${major}" for ${university}`);

  const checklist = buildChecklist(portfolio, requirements, profile);

  const system = `You are a Singapore university admissions portfolio assessor. You are precise, encouraging but honest, and never invent facts about the student. Respond ONLY with valid JSON matching this shape:
{"summary": string, "strengths": string[], "gaps": string[], "recommendations": string[], "internationalNote": string | null}

"internationalNote": ONLY when the student's profile indicates they are applying from outside Singapore — give one specific, concrete sentence about international-applicant considerations (e.g. transcript equivalency, English proficiency tests, visa for study). Otherwise null. Keep it high-level and don't cite specific legal/policy details you can't verify.`;

  const prompt = `University: ${uni.name}
Major: ${major}
Program competitiveness: ${requirements.competitiveness}
Baseline requirements: ${JSON.stringify(requirements, null, 2)}

Student profile: ${profile ? JSON.stringify(profile) : 'not provided'}

Student portfolio:
${JSON.stringify(portfolio, null, 2)}

Checklist evaluation (already computed, do not recompute):
${JSON.stringify(checklist, null, 2)}

Write a qualitative assessment: 2-3 sentence summary, list of strengths, list of gaps relative to program competitiveness (not just the checklist), and 2-4 concrete, actionable recommendations to improve admission chances.`;

  const { data, source } = await completeJson({
    system,
    prompt,
    mockFn: () => mockFeedback(uni, major, requirements, checklist, portfolio, profile),
  });

  return {
    university: uni.name,
    universityCode: university,
    major,
    competitiveness: requirements.competitiveness,
    checklist,
    checklistPassCount: checklist.filter((i) => i.met && !i.optional).length,
    checklistTotal: checklist.filter((i) => !i.optional).length,
    feedback: data,
    source,
  };
}

function listOptions() {
  return Object.entries(UNIVERSITIES).map(([code, uni]) => ({
    code,
    name: uni.name,
    majors: Object.keys(uni.majors),
  }));
}

module.exports = { assessUniversity, listOptions };
