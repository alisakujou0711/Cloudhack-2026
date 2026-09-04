const { completeJson } = require('./llm');

// --- Mock fallback: a light heuristic parse + rewrite, used only when no LLM call succeeds. ---

function mockReview(resumeText, targetRole, profile) {
  const paragraphs = resumeText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const [headerBlock, ...rest] = paragraphs;
  const headerLines = (headerBlock || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const name = headerLines[0] || 'Your Resume';
  const contact = headerLines.slice(1).join(' | ');

  const entries = rest.map((paragraph, i) => {
    const lines = paragraph.split('\n').map((l) => l.trim()).filter(Boolean);
    const isBulletLine = (l) => /^[-•*]\s*/.test(l);
    const hasTitleLine = lines.length > 0 && !isBulletLine(lines[0]);
    const title = hasTitleLine ? lines[0] : `Section ${i + 1}`;
    const bulletLines = hasTitleLine ? lines.slice(1) : lines;

    const bullets = bulletLines.map((line) => {
      const original = line.replace(/^[-•*]\s*/, '');
      const hasNumbers = /\d/.test(original);
      const suggestion =
        !hasNumbers && original.length > 25
          ? `${original} — quantify this with a specific number, percentage, or outcome.`
          : null;
      return { original, suggestion };
    });

    return { title, subtitle: '', dateRange: '', bullets };
  });

  const hasNumbers = /\d/.test(resumeText);
  const isInternational = Boolean(profile?.location) && !/singapore/i.test(profile.location);

  return {
    name,
    contact,
    sections: [{ name: 'Resume', entries }],
    overallImpression: hasNumbers
      ? `This is a reasonable starting point for ${targetRole || 'this role'}. The biggest lever left is making every bullet's impact concrete and measurable.`
      : `This resume needs work before it's ready for ${targetRole || 'this role'} — most bullets read as duties rather than outcomes, which is the single biggest thing holding it back.`,
    strengths: hasNumbers
      ? ['Some bullets already include measurable outcomes.']
      : ['Resume structure is present and readable.'],
    improvementAreas: hasNumbers
      ? ['Extend quantified impact to every bullet, not just some.']
      : ['Most bullets describe duties rather than outcomes — add numbers and results.'],
    internationalNote: isInternational
      ? `Since you're applying from ${profile.location} to roles in Singapore, check each employer's willingness to sponsor a Work Holiday Pass or Training Employment Pass for interns, and mention your visa/eligibility status proactively in your application if asked.`
      : null,
  };
}

async function assessInternship({ resumeText, targetRole, profile }) {
  const system = `You are an expert resume editor for internship applications, in the style of a structured line-by-line review tool (like Polish/polishme.ai): you parse the resume into its real sections and entries, and for weak bullet points you propose a sharper rewrite as a suggested edit — like a track-changes reviewer, not an automated scanner. Never assign or mention a numeric score anywhere.

Respond ONLY with valid JSON matching this shape:
{
  "name": string,
  "contact": string,
  "overallImpression": string,
  "strengths": string[],
  "improvementAreas": string[],
  "internationalNote": string | null,
  "sections": [
    {
      "name": string,
      "entries": [
        {
          "title": string,
          "subtitle": string,
          "dateRange": string,
          "bullets": [ { "original": string, "suggestion": string | null } ]
        }
      ]
    }
  ]
}

Rules:
- "name"/"contact": pulled from the top of the resume (name, email/phone/location/links joined with " | ").
- "overallImpression": 2-3 sentences, conversational, naming the single biggest lever for improvement. No numbers/scores.
- "strengths": 2-4 concrete, specific things this resume already does well (reference actual content, not generic praise).
- "improvementAreas": 2-4 concrete, specific gaps or weaknesses at the whole-resume level (distinct from the line-by-line bullet suggestions below — think missing sections, weak overall narrative, poor targeting to the role, etc).
- "internationalNote": ONLY when the student's profile indicates they are applying from outside Singapore (this platform's internships are Singapore-based) — give one specific, concrete sentence of guidance about work-authorization/visa considerations for interning in Singapore as a foreigner. Otherwise null. Never fabricate visa rules you're not confident about — keep it high-level (e.g. "check sponsorship for a Work Holiday Pass / Training Employment Pass") rather than citing specific legal details you can't verify.
- "sections": group into the resume's real sections (e.g. "EXPERIENCE", "PROJECTS", "SKILLS", "EDUCATION") in their original order. If the document has no clear headings, use your best judgement to group it sensibly (e.g. one "Experience" section).
- "entries": each job/project/education entry, with its own title (role/degree), subtitle (company/school), and dateRange (verbatim from the resume). Use "" (empty string) for subtitle/dateRange when the resume doesn't state one — never write "N/A" or similar placeholder text.
- For SKILLS or other non-bulleted lines, represent the line(s) as a single bullet.
- "original": the bullet EXACTLY as written in the resume (do not paraphrase).
- "suggestion": a rewritten, sharper version ONLY when there's a real improvement to make (missing metric, weak verb, vague claim, duty-not-impact framing) — otherwise null. Don't suggest a change just to change something; only when it's genuinely better. Roughly a third to half of bullets should have null (already good).
- Never invent facts, companies, numbers, or achievements that aren't in the original text — a suggestion should sharpen phrasing/framing/specificity of what's already there, not fabricate new claims.`;

  const prompt = `Target role/field: ${targetRole || 'general internship'}
Student profile: ${profile ? JSON.stringify(profile) : 'not provided'}

Resume / portfolio text:
"""
${resumeText}
"""`;

  const { data, source } = await completeJson({
    system,
    prompt,
    mockFn: () => mockReview(resumeText, targetRole, profile),
  });

  return { ...data, targetRole, source };
}

module.exports = { assessInternship };
