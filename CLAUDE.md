# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PortfolioPath — a student application-optimization platform (React + Express). Students upload a
document, pick what they're optimizing (university application / internship application / essay /
cover letter), and get structured, itemized feedback. Also includes interview prep and an
inspirations gallery. See `README.md` for the full feature/product description.

## Commands

```bash
# Backend (Terminal 1)
cd server
npm install
npm run dev          # node --watch index.js, http://localhost:4000

# Frontend (Terminal 2)
cd client
npm install
npm run dev           # vite, http://localhost:5173 — proxies /api/* to :4000 (see vite.config.js)
npm run build
npm run lint           # oxlint
```

There is no test suite in either package (`server`'s `npm test` is an unset placeholder). There is
no root-level install — `client/` and `server/` are independent npm packages with their own
`node_modules`, always installed/run separately.

## LLM integration — provider abstraction

All LLM calls go through `server/services/llm.js`, which picks a provider once at startup:
`LLM_PROVIDER` env var if set, else Gemini if `GEMINI_API_KEY` is set, else Anthropic if
`ANTHROPIC_API_KEY` is set, else `'none'`. Concrete provider implementations live in
`server/services/providers/{gemini,anthropic}.js` and each export `completeJson`, `completeText`,
`hasKey`, `MODEL`. `gemini.js` calls the REST API directly with a 25s `AbortController` timeout
(no SDK); `anthropic.js` uses `@anthropic-ai/sdk`. Default model is `gemini-3.1-flash-lite`
(override with `GEMINI_MODEL`).

**Every feature-level service follows the same mock-fallback pattern**: call
`completeJson({ system, prompt, mockFn })` (or `completeText`), passing a synchronous, dependency-free
`mockFn` that returns a plausible deterministic result. `llm.js` uses the mock immediately if no
provider is configured, or falls back to it if the live call throws (network error, rate limit,
malformed JSON) — this makes the whole app work offline/keyless, and resilient to Gemini's
free-tier rate limits. Every result the client renders carries a `source` field
(`'gemini'|'anthropic'|'mock'|'mock-fallback'`); the client's `utils/llmSource.js` decides whether
to show a "demo mode" notice and picks the wording based on *why* it's mocked (no key vs. transient
failure) — don't reintroduce a single boolean "isMocked" check, the distinction matters to users.

When adding a new LLM-backed feature, add a `server/services/<feature>.js` with a `mock<Feature>()`
function and a `system`/`prompt` pair passed through `completeJson`/`completeText` — don't call a
provider directly.

## Server architecture (`server/`)

- `routes/api.js` — all endpoints, thin (validate body → call a service → respond). No auth,
  no database; multer (`memoryStorage`) handles file uploads, capped at 10MB.
- `services/` — one file per feature (university/internship/essay/coverLetter assessment,
  interview prep, chatbot, document classification, resume PDF export/parsing). Each is
  independent and takes `profile` (the onboarding profile: name/educationLevel/location) as an
  optional param to conditionally add an `internationalNote` when `profile.location` isn't
  Singapore — this convention repeats across every assessment service and the chatbot; keep it
  consistent if you add another one.
- `data/universityRequirements.js` — hardcoded baseline admission requirements (GPA, subjects,
  competitiveness) for NUS/NTU/SMU/SUTD across a handful of majors. This is the only "database"
  in the app; extend it directly to add a university/major.
- `services/resumeParser.js` / `universityProfileParser.js` — text extraction (pdf-parse / mammoth
  for PDF/DOCX) and LLM-based structured-field extraction from a raw document (used by both the
  university panel's pre-fill and essay optimization's "extract just the personal statement"
  feature — same underlying extraction, different consumers).

## Client architecture (`client/src`)

- **Single global state**, no server-side persistence: `context/AppContext.jsx` holds one state
  object (profile, each optimization type's form + latest assessment, chat history, history log)
  and persists it wholesale to `localStorage` on every change. There's no per-slice reducer — every
  setter does a shallow merge into one key. `ChatUIContext.jsx` is separate and deliberately
  *not* persisted (just chat panel open/draft-text UI state).
- **Routing**: `App.jsx` — onboarding at `/`, then `/app/{optimize,history,interviews,inspirations}`
  under `Layout.jsx` (nav + the floating `ChatbotWidget`). `/app/university` and `/app/internship`
  are legacy redirects to `/app/optimize` from an earlier two-tab layout — don't resurrect them as
  real routes without checking why they were folded in.
- **Application Optimization flow** (`pages/ApplicationOptimizationPage.jsx` +
  `components/optimize/*Panel.jsx`): the user picks a type *first* (University/Internship/Essay/
  CoverLetter), then each panel independently owns its own upload via
  `components/optimize/DocumentUploader.jsx`. `DocumentUploader` calls `/api/optimize/classify`,
  compares the predicted document type against what that panel expects, and — if they mismatch —
  shows an inline confirm-to-proceed banner rather than blocking. This confirm-don't-reject pattern
  is intentional; don't make it a hard validation error.
- **Shared report pattern** ("Feedback then Corrections"): `UniversityPanel`'s exported
  `UniversityReport`, `ResumeReviewEditor`, and `components/QAReview.jsx` all render an overview
  block (`overallImpression`/summary + strengths/gaps + optional `internationalNote`) before an
  itemized detail section. `ResumeReviewEditor` additionally supports inline accept/reject editing
  of suggested bullet rewrites and PDF export via `/api/resume/export`; it must be given a `key`
  that changes per-review (see `InternshipPanel`) or its accept/reject state leaks across resumes.
- **History** (`pages/HistoryPage.jsx`): a flat, filterable, bookmarkable log of everything —
  every completed optimization run (with a full `snapshot` of the result so an entry can be
  re-rendered read-only) plus bookmarked items from Inspirations. Re-uses the same report
  components (`UniversityReport`, `ResumeReviewEditor`, `QAReview`, `InterviewPlanView`) to render
  a snapshot by `entry.type`, so a new history-eligible feature needs its `type` added to
  `HistoryPage`'s `renderSnapshot`/`TYPE_LABELS` switch.
- **Inspirations** (`pages/InspirationsPage.jsx`): static, curated data, not LLM-generated —
  `data/sampleEssays.js` is a reference list (title/university/theme only, links out to the
  source) and `data/sampleResumes.js` is original sample content. Both were deliberately written
  to avoid reproducing third-party copyrighted text; keep new sample content original or
  reference-only rather than copy-pasted from an external site.
- **Chatbot** (`components/ChatbotWidget.jsx` + `server/services/chatbot.js`): one conversation
  per account, never reset by navigation. On every message it sends the *entire* app context
  (all four optimization types' portfolios/assessments + interview prep/plan + profile), not just
  whatever tab is active — this is intentional so the bot can answer cross-feature questions
  ("compare my resume and my university profile"). If you add new persisted state that a user
  might reasonably ask about, add it to `buildContext()` in `ChatbotWidget.jsx`.

## Samples

`samples/` (repo root) holds synthetic test files organized by feature (`university/`,
`internship/`, `essay/`, `cover-letter/`) at weak/standard/strong (or weak/borderline/strong)
quality tiers, used for manually exercising each assessment flow end-to-end.
