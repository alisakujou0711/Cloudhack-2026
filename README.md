# Portify — CloudHacks 2026

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

### Demo account

The server seeds one account on its first boot against a new database, already carrying a
profile and several finished optimization runs in History:

    Email:    demo@portify.app
    Password: portify-demo

Sign in with those on the normal sign-in screen — there is no demo button. The same credentials
are printed in the server's startup log. Or create your own account with **Sign up** and start
from an empty one.

Seeding only happens when that account is absent, so restarting the server never overwrites work
in progress — including a demo account whose data has been cleared, which stays cleared. Delete
`server/data/portify.db` to get the seeded content back.

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

- **Application Optimization** — the core flow. You pick what you're optimizing first
  (University / Internship / Essay / Cover Letter), then that panel handles its own upload.
  The server extracts the file's text and predicts what kind of document it is (resume /
  university application / essay / cover letter). If the prediction doesn't match what the
  panel expects (e.g. you upload a resume in the Essay panel), you get a non-blocking
  confirmation — never an automatic rejection — so you can proceed anyway if you know better.
  - *University*: baseline checklist against NUS/NTU/SMU/SUTD requirements plus qualitative
    feedback. Upload is optional and only pre-fills the form.
  - *Internship*: a line-by-line resume review — weak bullets come back as suggested rewrites
    you can accept or reject, then export as a PDF.
  - *Essay*: asks university, major, and how many essay questions, then collects each
    question + your answer, then gives itemized feedback per question.
  - *Cover Letter*: same pattern, scoped to company/role/prompts instead.
- **History** — every optimization run (any of the four types), plus saved interview plans and
  bookmarked inspirations, filterable by type. Entries reopen as full read-only reports.
- **Interviews** — a prep plan for an upcoming university or internship interview: research and
  technical checklists, timeline-aware advice, and common questions with sample answers.
- **Inspirations** — a gallery of original sample application essays and internship resumes,
  readable in full and bookmarkable into History.

## File upload & classification

Each optimization panel owns its own upload (PDF/DOCX/TXT), and each does something different
with the extracted text — University pre-fills GPA/subjects/ECAs, Internship seeds the resume
text, Essay pulls out just the personal statement, Cover Letter drops the draft into the first
empty answer. All extracted/pre-filled fields stay editable. See `samples/` for test files.

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
- Accounts are email + password, held in a local SQLite file the server creates on first boot;
  the app opens on a sign-in screen and onboarding runs once per account.
- Application state (profile, portfolios, assessments, chat, history) belongs to the account and
  is saved to the server, so it follows you between browsers and two accounts on one machine stay
  separate. The app needs the server running to open.
