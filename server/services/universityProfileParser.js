const { completeJson } = require('./llm');

function section(text, headingPattern, stopPattern) {
  const match = text.match(headingPattern);
  if (!match) return '';
  const start = match.index + match[0].length;
  const rest = text.slice(start);
  const stop = stopPattern ? rest.search(stopPattern) : -1;
  return (stop === -1 ? rest : rest.slice(0, stop)).trim();
}

// Best-effort regex extraction used when no LLM provider is configured.
function mockParse(rawText) {
  const gpaMatch = rawText.match(/gpa[:\s]*([0-4](?:\.\d{1,2})?)/i);
  const gpa = gpaMatch ? parseFloat(gpaMatch[1]) : undefined;

  const headingPattern = /\n(?=[A-Z][A-Za-z /]{2,30}:)/;

  const subjectsRaw = section(rawText, /subjects?(?: taken)?:/i, headingPattern);
  const subjects = subjectsRaw
    .split(/[,\n;]/)
    .map((s) => s.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

  const extracurriculars = section(rawText, /extra-?curriculars?(?: activities)?:/i, headingPattern);

  let essay = section(rawText, /(personal statement|essay)s?:/i, headingPattern);
  if (!essay) {
    // Fall back to the largest paragraph in the document as a rough guess at the essay.
    const paragraphs = rawText.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 80);
    essay = paragraphs.sort((a, b) => b.length - a.length)[0] || '';
  }

  return {
    gpa,
    subjects,
    extracurriculars: extracurriculars || undefined,
    essay: essay || undefined,
  };
}

async function parseUniversityApplication(rawText) {
  const system = `You extract structured fields from a student's university application document (transcript + extracurriculars + essay, in any format/order). Respond ONLY with valid JSON matching this shape:
{"gpa": number|null, "subjects": string[], "extracurriculars": string|null, "essay": string|null}
- "gpa": on a 4.0 scale if stated or convertible; null if not present or you can't confidently convert it.
- "subjects": school/exam subjects taken (e.g. "Mathematics", "Physics"), not activities.
- "extracurriculars": a plain-text summary of activities/leadership/awards found in the document (or null).
- "essay": the personal statement / essay text verbatim if present (or null).
Never invent information that isn't in the document.`;

  const prompt = `Document text:\n"""\n${rawText}\n"""`;

  const { data, source } = await completeJson({
    system,
    prompt,
    mockFn: () => mockParse(rawText),
  });

  return {
    gpa: typeof data.gpa === 'number' ? data.gpa : undefined,
    subjects: Array.isArray(data.subjects) ? data.subjects : [],
    extracurriculars: data.extracurriculars || '',
    essay: data.essay || '',
    source,
  };
}

module.exports = { parseUniversityApplication };
