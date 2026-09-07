# Architecture

Cross-cutting shape of the app. Read this when orienting, or before touching state, routing, or
the request path. Feature-specific detail lives in `docs/features/`.

## Runtime topology

Two independent npm packages, always installed and run separately — there is no root install and
no workspace config.

| Package | Port | Entry | Notes |
| --- | --- | --- | --- |
| `client/` | 5173 | `client/src/main.jsx` | Vite + React 19, `BrowserRouter`, plain CSS |
| `server/` | 4000 | `server/index.js` | Express 5, CommonJS, `node --watch` in dev |

`client/vite.config.js` proxies `/api/*` to `http://localhost:4000`, so the client only ever
calls relative paths (`BASE = '/api'` in `client/src/api/client.js`). CORS is also enabled
server-side for direct access.

## Request lifecycle

```
Panel/Page  ->  api/client.js  ->  routes/api.js  ->  services/<feature>.js  ->  services/llm.js
 (React)        (fetch wrapper)     (validate only)    (all logic + prompts)     (provider|mock)
```

- `client/src/api/client.js` — one `api` object; three transports: `request` (JSON),
  `requestFormData` (uploads), `requestBlob` (the PDF export). All three throw `Error(data.error)`
  on a non-2xx, which panels catch and render into an inline `.error-text`.
- `server/routes/api.js` — every endpoint is thin: check required fields, call one service,
  `res.json(result)`. `catch` logs and returns `400 {error}`. **No logic belongs here.**
- `server/services/` — one file per feature, each owning its own prompt and mock. See
  `docs/llm.md`.

## Client state

`client/src/context/AppContext.jsx` holds **one** state object for the whole app and persists it
wholesale to `localStorage` under `portfoliopath_state` on every change (a `useEffect` on
`[state]`). There is no reducer and no per-slice store — every setter shallow-merges into one key.

State keys (`defaultState()`): `profile`, `universityPortfolio`, `internshipPortfolio`,
`essayOptimization`, `coverLetterOptimization`, `interviewPrep`, `universityAssessment`,
`internshipAssessment`, `essayAssessment`, `coverLetterAssessment`, `interviewPlan`,
`chatHistory`, `history`.

- `loadInitialState()` spreads saved state over `defaultState()`, so adding a new key is
  backwards-compatible for existing users. It also migrates a legacy per-page `chatHistory`
  object into a single array — keep that migration.
- `client/src/context/ChatUIContext.jsx` is a **separate**, deliberately unpersisted context for
  chat panel open/draft state. See `docs/features/chatbot.md`.

Adding persisted state means touching three places: `defaultState()`, a setter in `AppContext`,
and `buildContext()` in `ChatbotWidget.jsx`.

## Routing

`client/src/App.jsx`. Onboarding at `/` (redirects to `/app/optimize` once a profile exists);
everything else nests under `/app` in `client/src/components/Layout.jsx` (header nav + the floating
`ChatbotWidget`), guarded by `profile` being set.

`/app/optimize` · `/app/history` · `/app/interviews` · `/app/inspirations`

`/app/university` and `/app/internship` are **redirects** left over from an earlier two-tab
layout, folded into the single Optimize tab. Don't revive them as real routes without checking
why they were merged.

## Three conventions that repeat across every feature

1. **Optional `profile` + `internationalNote`.** Every assessment service and the chatbot take
   `profile` (`{name, educationLevel, location}`) as an optional param and add an
   `internationalNote` only when `profile.location` isn't Singapore. The check is duplicated
   verbatim in seven modules: `Boolean(profile?.location) && !/singapore/i.test(profile.location)`.
   A new assessment service should follow it. See `docs/features/onboarding.md`.
2. **`source` on every LLM-backed result.** Services spread the LLM result and attach `source`;
   the client decides whether to show a demo-mode notice. See `docs/llm.md`.
3. **"Feedback then Corrections" report shape.** `UniversityReport` (exported from
   `UniversityPanel.jsx`), `ResumeReviewEditor`, `QAReview`, and `InterviewPlanView` all render an
   overview block (`overallImpression`/`summary` + strengths + gaps/improvement areas + optional
   `internationalNote`) *before* an itemized detail section. Reuse one of these rather than
   inventing a fourth report layout — `HistoryPage` re-renders snapshots through the same four.

## Styling

One global stylesheet, `client/src/index.css` (~1160 lines), with CSS custom properties on
`:root` (`--bg`, `--surface`, `--border`, `--text`, `--text-muted`, `--primary`, `--success`,
`--danger`, …) and `color-scheme: light`. Semantic class names (`.card`, `.btn-primary`,
`.link-btn`, `.subtitle`, `.error-text`, `.badge`), no CSS modules, no utility framework, no dark
mode. Add styles here and reuse the existing tokens.

## What does not exist here

Assume none of these are present before adding one:

- **No auth and no user accounts** — "account" means one browser's `localStorage`.
- **No database.** `server/data/universityRequirements.js` is the only persisted data, and it is
  a hardcoded JS object.
- **No server-side persistence at all** — uploads go through `multer.memoryStorage()` and are
  never written to disk.
- **No test suite.** `server`'s `npm test` is an unset placeholder that exits 1. `client` has
  `npm run lint` (oxlint) only.
- **No TypeScript**, no build step for the server.
