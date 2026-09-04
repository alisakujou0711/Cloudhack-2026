# PortfolioPath — CloudHacks 2026

Student application-optimization platform: upload a document, tell it what you're optimizing
for, and get itemized, structured feedback — plus a shared, context-aware chatbot throughout.

## Structure

- `client/` — React + Vite frontend
- `server/` — Express API, LLM-backed assessment + chatbot logic
- `samples/` — synthetic test files (university applications + internship resumes)

## Running the demo

```bash
# Terminal 1 — backend
cd server
npm install
npm run dev

# Terminal 2 — frontend
cd client
npm install
npm run dev
```

Open http://localhost:5173.

## LLM integration

The server calls an LLM (Gemini or Claude) for classification, feedback generation, and the
chatbot. **No API key is required to demo** — every LLM call has a deterministic mock
fallback, so the app works fully offline out of the box (reports note when they're showing
rule-based feedback instead of a live model response, and say why — no key configured vs. a
temporary rate limit).

To enable live LLM output:

```bash
cd server
cp .env.example .env
# then edit .env and set GEMINI_API_KEY=... (or ANTHROPIC_API_KEY=sk-ant-...)
```

Gemini is used if `GEMINI_API_KEY` is set; otherwise falls back to Anthropic if
`ANTHROPIC_API_KEY` is set. Restart the server after adding a key.

## App structure

Four tabs after onboarding:

- **Application Optimization** — the core flow. Upload a document first; the server extracts
  its text and predicts what kind of document it is (resume / university application /
  essay / cover letter). You then pick what you want optimized from four options. If your
  choice doesn't match the prediction (e.g. you upload a resume but pick "University
  Application Optimization"), you get a non-blocking confirmation — never an automatic
  rejection — so you can proceed anyway if you know better.
  - *University* / *Internship*: as before — structured checklist/diff-editor review.
  - *Essay*: asks university, major, and how many essay questions, then collects each
    question + your answer, then gives itemized feedback per question.
  - *Cover Letter*: same pattern, scoped to company/role/prompts instead.
- **History** — every optimization run (any of the four types), filterable by type, with
  bookmarking.
- **Interviews** / **Inspirations** — placeholders for now; no functional spec was given for
  these yet, so they're stubbed rather than guessed at.

## File upload & classification

Upload happens once, up front, for the whole Application Optimization flow (PDF/DOCX/TXT).
The extracted text is reused by whichever sub-flow you pick — University pre-fills
GPA/subjects/ECAs/essay, Internship seeds the resume text, Essay/Cover Letter use it as a
starting draft for the first answer. All extracted/pre-filled fields stay editable. See
`samples/` for test files.

## Design notes

- Feedback is deliberately **qualitative, not scored** for internship/essay/cover-letter —
  itemized feedback plus a "Feedback then Corrections" structure, in the spirit of an
  editor's notes rather than an automated scanner.
- The Portfolio Chatbot is a **single shared conversation per account** — it isn't reset when
  navigating between tabs, and has context on all four workflows regardless of where you are.
- International-student considerations (visa/work-pass, transcript equivalency, etc.) are
  surfaced automatically — both in reports and by the chatbot — when the profile's location
  suggests the student isn't based in Singapore.

## MVP scope

- University checklist covers NUS, NTU, SMU, SUTD across a few majors, Singapore only.
- Internship/essay/cover-letter review uses general rubrics rather than real job postings
  or actual application portals.
- All state (profile, portfolios, assessments, chat, history) is stored in `localStorage` —
  no auth or persistent database for the demo.
