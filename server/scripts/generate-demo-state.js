// Regenerates `server/data/demoState.json` — the state document the demo account is seeded with.
//
//     node scripts/generate-demo-state.js
//
// It runs the repository's synthetic samples through the *real* services once and freezes what
// comes back, because a history entry stores the whole API result and the report components read
// fields no summary line carries. Hand-written fixtures drift from the result shapes and expand
// into empty panels; a recorded real run cannot. Run this again when a sample or a result shape
// changes, then commit the JSON. It writes nothing to the database.
//
// With an LLM key configured the snapshots are live model output; without one they are the
// deterministic mocks — both are legitimate, and `source` on each snapshot records which.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parseUniversityApplication } = require('../services/universityProfileParser');
const { assessUniversity } = require('../services/universityAssessment');
const { assessInternship } = require('../services/internshipAssessment');
const { assessEssays } = require('../services/essayOptimization');
const { assessCoverLetter } = require('../services/coverLetterOptimization');
const { prepareInterview } = require('../services/interviewPrep');
const { chatReply } = require('../services/chatbot');

const samplesDir = path.join(__dirname, '..', '..', 'samples');
const outputPath = path.join(__dirname, '..', 'data', 'demoState.json');

// The account holder. An address outside Singapore is deliberate: it is what turns on the
// `internationalNote` every assessment service carries, so the seeded reports show that half of
// the product too. See docs/features/onboarding.md.
const PROFILE = { name: 'Priya Sharma', educationLevel: 'university', location: 'Kuala Lumpur, Malaysia' };

// Each sample carries its own placeholder persona, but one account has one holder — and the
// services are given the profile, so a cover letter signed by somebody else comes back reviewed
// as an identity inconsistency. Unifying the names keeps the feedback about the document.
const PERSONA_ALIASES = [/Wei Ling Tan/g, /Alex Chen/g];

// Line endings are normalised on the way in so the fixture is the same whatever git's autocrlf
// left in the working tree — the header parse below reads to end-of-line.
const readSample = (relative) =>
  PERSONA_ALIASES.reduce(
    (text, alias) => text.replace(alias, PROFILE.name),
    fs.readFileSync(path.join(samplesDir, relative), 'utf8').replace(/\r\n/g, '\n'),
  );

// The essay and cover-letter samples are transcripts of the panels' own flows: a header block,
// then one `Question:`/`Prompt:` heading per section between rules of dashes.
function parseQaSample(text, headingPattern) {
  const [header, ...blocks] = text.split(/^-{10,}$/m);
  const meta = Object.fromEntries(
    header
      .split('\n')
      .map((line) => line.match(/^([^:]+):\s*(.+)$/))
      .filter(Boolean)
      .map((m) => [m[1].trim(), m[2].trim()]),
  );

  const items = [];
  for (let i = 0; i < blocks.length; i += 2) {
    const heading = (blocks[i] || '').trim().replace(headingPattern, '').trim();
    const body = (blocks[i + 1] || '').trim();
    if (heading && body) items.push({ heading, body });
  }
  return { meta, items };
}

async function main() {
  const universityRawText = readSample('university/strong_nus_cs_candidate.txt');
  const resumeText = readSample('internship/strong_swe_intern_resume.txt');

  // University — the panel's real path: classify/extract the document, then assess the fields.
  const extracted = await parseUniversityApplication(universityRawText);
  const universityPortfolio = {
    country: 'Singapore',
    university: 'NUS',
    major: 'Computer Science',
    gpa: typeof extracted.gpa === 'number' ? String(extracted.gpa) : '',
    subjects: (extracted.subjects || []).join(', '),
    extracurriculars: extracted.extracurriculars || '',
    languageProficiency: 'IELTS 8.0 (Academic)',
    rawText: universityRawText,
  };
  const universityAssessment = await assessUniversity({
    university: universityPortfolio.university,
    major: universityPortfolio.major,
    portfolio: {
      gpa: universityPortfolio.gpa ? parseFloat(universityPortfolio.gpa) : undefined,
      subjects: (extracted.subjects || []).map((s) => s.trim()).filter(Boolean),
      extracurriculars: universityPortfolio.extracurriculars,
      languageProficiency: universityPortfolio.languageProficiency,
    },
    profile: PROFILE,
  });

  // Internship.
  const internshipPortfolio = { resumeText, targetRole: 'Software Engineering Intern' };
  const internshipAssessment = await assessInternship({ ...internshipPortfolio, profile: PROFILE });

  // Essay.
  const essaySample = parseQaSample(readSample('essay/essay_strong.txt'), /^Essay Question \d+:/);
  const essayOptimization = {
    university: essaySample.meta.University || '',
    major: essaySample.meta.Major || '',
    questionCount: essaySample.items.length,
    questions: essaySample.items.map((item) => item.heading),
    answers: essaySample.items.map((item) => item.body),
  };
  const essayAssessment = await assessEssays({ ...essayOptimization, profile: PROFILE });

  // Cover letter.
  const coverLetterSample = parseQaSample(readSample('cover-letter/cover_letter_standard.txt'), /^Prompt:/);
  const coverLetterOptimization = {
    companyName: coverLetterSample.meta.Company || '',
    role: coverLetterSample.meta.Role || '',
    promptCount: coverLetterSample.items.length,
    prompts: coverLetterSample.items.map((item) => item.heading),
    answers: coverLetterSample.items.map((item) => item.body),
  };
  const coverLetterAssessment = await assessCoverLetter({ ...coverLetterOptimization, profile: PROFILE });

  // Interview prep — the one type saved to history by hand rather than on completion.
  const interviewPrep = {
    type: 'internship',
    university: '',
    major: '',
    companyName: coverLetterOptimization.companyName,
    role: coverLetterOptimization.role,
    jobDescription: '',
    daysUntil: '10',
  };
  const interviewPlan = await prepareInterview({ ...interviewPrep, daysUntil: 10, profile: PROFILE });

  // Newest first, exactly as `addHistoryEntry` prepends them. Titles and summaries are built the
  // way each panel builds them, so a seeded row is indistinguishable from one the demo produces.
  // `timestamp` is deliberately absent: the seeder dates the entries relative to the boot that
  // writes them, so the demo never opens on months-old runs.
  const history = [
    {
      id: 'demo-interview',
      bookmarked: false,
      type: 'interview',
      title: `Interview Prep — ${interviewPlan.targetName || 'Untitled'}`,
      summary: interviewPlan.overview,
      snapshot: interviewPlan,
    },
    {
      id: 'demo-cover-letter',
      bookmarked: false,
      type: 'coverLetter',
      title: `Cover Letter Optimization — ${coverLetterOptimization.role || 'Role'} at ${coverLetterOptimization.companyName || 'Company'}`,
      summary: coverLetterAssessment.overallImpression,
      snapshot: coverLetterAssessment,
    },
    {
      id: 'demo-internship',
      bookmarked: true,
      type: 'internship',
      title: `Internship Application — ${internshipPortfolio.targetRole || 'General'}`,
      summary: internshipAssessment.overallImpression,
      snapshot: internshipAssessment,
    },
    {
      id: 'demo-essay',
      bookmarked: false,
      type: 'essay',
      title: `Essay Optimization — ${essayOptimization.major || 'Essays'} (${essayOptimization.university || 'University'})`,
      summary: essayAssessment.overallImpression,
      snapshot: essayAssessment,
    },
    {
      id: 'demo-university',
      bookmarked: true,
      type: 'university',
      title: `University Application — ${universityAssessment.university} (${universityAssessment.major})`,
      summary: universityAssessment.feedback?.summary,
      snapshot: universityAssessment,
    },
  ];

  // The chatbot's own opening exchange, asked with the same context `buildContext()` sends from
  // the Optimize tab, so the seeded conversation is a real answer about this account's work
  // rather than a plausible-looking line someone wrote by hand.
  const openingQuestion = 'Which of my applications needs the most work right now?';
  const { reply } = await chatReply({
    message: openingQuestion,
    history: [],
    context: {
      currentTab: 'optimize',
      profile: PROFILE,
      university: { portfolio: universityPortfolio, assessment: universityAssessment },
      internship: { portfolio: internshipPortfolio, assessment: internshipAssessment },
      essay: { setup: essayOptimization, assessment: essayAssessment },
      coverLetter: { setup: coverLetterOptimization, assessment: coverLetterAssessment },
      interview: { setup: interviewPrep, plan: interviewPlan },
    },
  });

  const state = {
    profile: PROFILE,
    universityPortfolio,
    internshipPortfolio,
    essayOptimization,
    coverLetterOptimization,
    interviewPrep,
    universityAssessment,
    internshipAssessment,
    essayAssessment,
    coverLetterAssessment,
    interviewPlan,
    chatHistory: [
      { role: 'user', content: openingQuestion },
      { role: 'assistant', content: reply },
    ],
    history,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(state, null, 2)}\n`);
  const sources = history.map((entry) => `${entry.type}=${entry.snapshot.source}`).join(' ');
  console.log(`Wrote ${path.relative(process.cwd(), outputPath)} — ${history.length} history entries (${sources})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
