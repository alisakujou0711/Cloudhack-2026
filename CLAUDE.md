# CLAUDE.md

Entry point for AI agents working in this repo. It carries what you need in *every* session —
what the app is, how to run it, and the rules that must survive any edit. Everything else is in
`docs/`, one file per feature; the map at the bottom says which one to read for the task at hand.
Read the doc for the area you're touching before you touch it, and don't read the others.

## What this is

PortfolioPath — a student application-optimization platform (React + Express). Students upload a
document, pick what they're optimizing (university application / internship application / essay /
cover letter), and get structured, itemized feedback. Plus interview prep, a curated inspirations
gallery, a history log, and a context-aware chatbot. `README.md` is the product description.

Accounts are email + password, backed by a SQLite file the server creates on first boot
(`server/db.js`). Everything a student produces is one JSON state document per account, held in
that database and read and written over `/api/state` — nothing is kept in browser storage. A
fresh database is seeded with one worked-in demo account (`demo@portfoliopath.app` /
`portfoliopath`) — the credentials the startup log prints.

## Commands

```bash
# Backend (Terminal 1)
cd server
npm install
npm run dev          # node --watch index.js, http://localhost:4000
npm test             # node --test, boots the app over HTTP against a temp database

# Frontend (Terminal 2)
cd client
npm install
npm run dev           # vite, http://localhost:5173 — proxies /api/* to :4000 (see vite.config.js)
npm run build
npm run lint           # oxlint
```

`server` has a test suite — Node's built-in runner driving the exported app over real HTTP
(`server/test/`). `client` has none. There is no root-level install — `client/` and `server/` are
independent npm packages with their own `node_modules`, always installed/run separately.

The app runs fully **offline and keyless** — every LLM call has a deterministic mock fallback. Set
`GEMINI_API_KEY` or `ANTHROPIC_API_KEY` in `server/.env` for live output.

There are **no required** environment variables. Three optional ones: `DATABASE_PATH` (where the
SQLite file lives — the tests point it at a throwaway file), `SESSION_TTL_MS` (session lifetime,
default 30 days), and `CLIENT_ORIGIN` (the CORS origin).

## Hard rules

These are the conventions that repeat across the codebase. Breaking one is a regression even when
the code still runs.

1. **Never call an LLM provider directly.** Feature services go through `completeJson` /
   `completeText` in `server/services/llm.js`, always passing a synchronous, dependency-free
   `mockFn` that returns the same shape as the prompt. -> `docs/llm.md`
2. **Every LLM-backed result carries `source`.** Keep `'mock'` (no key) and `'mock-fallback'`
   (key present, call failed) distinct — the client words the notice differently. Don't collapse
   them into one boolean. -> `docs/llm.md`
3. **Routes validate and delegate.** `server/routes/api.js` checks required fields and calls one
   service; all logic and prompts live in `server/services/`. -> `docs/api.md`
4. **Assessment services take an optional `profile`** and add an `internationalNote` only when
   `profile.location` isn't Singapore. Follow it in any new one. -> `docs/features/onboarding.md`
5. **Document-type mismatch confirms, never rejects.** `DocumentUploader` shows an inline
   "continue anyway" banner; it is not a validation error.
   -> `docs/features/application-optimization.md`
6. **`ResumeReviewEditor` needs a `key` that changes per review**, or accept/reject state leaks
   from the previous resume. -> `docs/features/internship-resume.md`
7. **New persisted state must be added to `buildContext()`** in `ChatbotWidget.jsx`, or the
   chatbot can't answer about it. -> `docs/features/chatbot.md`
8. **New history-eligible types need both `TYPE_LABELS` and `renderSnapshot`** in `HistoryPage`.
   Missing either fails silently. -> `docs/features/history.md`
9. **Inspirations content stays original or reference-only** — never paste in third-party or
   copyrighted sample text. -> `docs/features/inspirations.md`
10. **Feedback is qualitative, never scored** for internship / essay / cover-letter review. This
    is a deliberate product stance, enforced in the prompts.
11. **Keep these docs current in the same change.** If you alter something a doc states — a
    contract, an invariant, a flow, an endpoint — update that doc as part of the work, not later.
    A genuinely new feature gets its own `docs/features/<name>.md` and a row in the table below.
    Do **not** write or expand a doc for a bug fix or a refactor that changes nothing a doc
    claims; these files are on-demand agent context, and length is a cost.

## Where the detail lives

| Read this | When you're... |
| --- | --- |
| `docs/architecture.md` | Orienting; touching routing, `AppContext`, state loading and saving, styling, or the request path |
| `docs/llm.md` | Adding or changing **any** LLM call, prompt, mock, or provider |
| `docs/api.md` | Adding or changing an endpoint, or checking a request/response shape |
| `docs/features/accounts-and-persistence.md` | Touching sign-in/sign-up, sessions, the routing gate, or where the state document is stored |
| `docs/features/account-settings.md` | Working on the settings page, the header account menu, or changing/deleting an account |
| `docs/features/onboarding.md` | Touching the profile, education levels, or international-applicant behavior |
| `docs/features/application-optimization.md` | Working on the type picker, uploads, or adding a new optimization type |
| `docs/features/document-pipeline.md` | Touching text extraction, document classification, or field parsing |
| `docs/features/university-application.md` | Working on the checklist, the requirements table, or adding a university/major |
| `docs/features/internship-resume.md` | Working on resume review, accept/reject bullets, or PDF export |
| `docs/features/essay-optimization.md` | Working on the essay question/answer flow |
| `docs/features/cover-letter-optimization.md` | Working on the cover letter prompt/answer flow |
| `docs/features/interview-prep.md` | Working on interview plans, common questions, or the salary/tell-me-about-yourself rules |
| `docs/features/chatbot.md` | Working on the chatbot, chat context, or `ChatUIContext` |
| `docs/features/history.md` | Working on the history log, snapshots, or bookmarking |
| `docs/features/inspirations.md` | Working on the sample essay/resume galleries |
| `docs/features/demo-account.md` | Touching the seeded demo account, its fixtures, or boot-time seeding |

### Adding a feature doc

Match the existing skeleton so the set stays skimmable: **What it does** (1-3 lines) · **Files**
(path -> role table) · **Flow** (numbered client -> API -> service -> render) · **Contract** (the
JSON shape, one line) · **Invariants** (one line each, claim + reason) · **Extending it**.

Budget: **50-80 lines.** No pasted code or prompt text — name a rule in a clause and cite
`file.js:line`. Link to other docs instead of restating them. If it won't fit, it's covering two
features; split it.

`samples/` (repo root) holds synthetic test files by feature (`university/`, `internship/`,
`essay/`, `cover-letter/`) at weak/standard/strong tiers, for exercising each flow end-to-end.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, used verbatim (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
