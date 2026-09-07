# Architecture

Cross-cutting shape of the app. Read this when orienting, or before touching state, routing, or
the request path. Feature-specific detail lives in `docs/features/`.

## Runtime topology

Two independent npm packages, always installed and run separately — there is no root install and
no workspace config.

| Package | Port | Entry | Notes |
| --- | --- | --- | --- |
| `client/` | 5173 | `client/src/main.jsx` | Vite + React 19, `BrowserRouter`, plain CSS |
| `server/` | 4000 | `server/index.js` | Express 5, CommonJS, `node --watch` in dev. `app.js` builds and exports the configured app; `index.js` only listens |

`server/db.js` opens a SQLite file (`better-sqlite3`, synchronous) and applies the schema on
import, with every statement create-if-not-exists so repeated boots are safe. The path defaults to
`server/data/portfoliopath.db` and is overridable with `DATABASE_PATH`; the file is git-ignored.

`client/vite.config.js` proxies `/api/*` to `http://localhost:4000`, so the client only ever
calls relative paths (`BASE = '/api'` in `client/src/api/client.js`). CORS is also enabled
server-side for direct access — with `credentials: true` and an explicit origin
(`CLIENT_ORIGIN`, default `http://localhost:5173`), because the session cookie cannot travel on a
wildcard origin.

## Request lifecycle

```
Panel/Page  ->  api/client.js  ->  routes/api.js  ->  services/<feature>.js  ->  services/llm.js
 (React)        (fetch wrapper)     (validate only)    (all logic + prompts)     (provider|mock)
```

- `client/src/api/client.js` — one `api` object; three transports: `request` (JSON),
  `requestFormData` (uploads), `requestBlob` (the PDF export). All three throw `Error(data.error)`
  on a non-2xx, which panels catch and render into an inline `.error-text` — except a 401 outside
  `/auth/*`, which is handled centrally (see Authentication).
- `server/routes/api.js` — every endpoint is thin: check required fields, call one service,
  `res.json(result)`. `catch` logs and returns `400 {error}`. **No logic belongs here.**
- `server/services/` — one file per feature, each owning its own prompt and mock. See
  `docs/llm.md`.

## Authentication

Accounts are email + password. `server/services/auth.js` owns hashing (bcryptjs, cost 10) and
session creation; `server/middleware/auth.js` owns the cookie and the `requireAuth` guard.

- A session is an opaque 32-byte random token in the `sessions` table, returned in an httpOnly,
  `sameSite=lax` cookie (`pp_session`) with a 30-day expiry — **not a JWT**, so signing out
  genuinely revokes it and no signing secret is needed. `SESSION_TTL_MS` overrides the lifetime;
  it exists so the expiry test can observe a 401 over HTTP instead of editing the sessions table.
- Sign-up may reveal that an email is taken; **sign-in must not** — a wrong password and an
  unknown email return the same 401 and the same message.
- `requireAuth` guards `/auth/me` and `/auth/logout` today. See `docs/api.md`.
- On the client, `client/src/context/AuthContext.jsx` owns the session — deliberately **separate**
  from `AppContext`, because auth resolves first and gates whether the app is reachable at all. It
  resolves `/auth/me` once on mount, exposes `signUp` / `signIn` / `signOut`, and registers the API
  client's `setUnauthorizedHandler`.
- A 401 from any non-`/auth/*` endpoint is handled **once, centrally** in `api/client.js`: it
  clears the auth context so the routing gate returns the person to sign-in, instead of a red
  "Unauthorized" appearing inside whichever panel made the call. Auth endpoints are exempt — their
  401 means "those credentials are wrong" and belongs on the sign-in screen.

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

`client/src/App.jsx`. **Two gates, checked in that order** — a session, then a profile — mapping
three conditions to three destinations:

| Condition | Destination |
| --- | --- |
| No session | `/signin` |
| Session, no profile | `/onboarding` |
| Session and profile | `/app/optimize` |

`/` is nothing but that three-way redirect. Every other route re-checks the gates it depends on,
so typing an in-app URL while signed out lands on sign-in rather than rendering. While `/auth/me`
is still in flight `AuthProvider`'s status is `'resolving'` and `AppRoutes` renders a loading
screen — deciding earlier would flash the sign-in screen at someone who is already signed in.

`/signin` · `/signup` · `/onboarding` are each their own route; the first two redirect to `/` once
a session exists, and onboarding stays the only place `profile` is set. Everything else nests
under `/app` in `client/src/components/Layout.jsx` (header nav + the floating `ChatbotWidget`),
guarded by both a session and `profile`.

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

- **No uploaded files on disk** — uploads go through `multer.memoryStorage()` and are never
  written anywhere.
- **No client-side tests.** `client` has `npm run lint` (oxlint) only; the suite lives in
  `server/test/`.
- **No TypeScript**, no build step for the server.
- **No migration tool.** The schema is bootstrapped on boot by `server/db.js`; changing it means
  adding another create-if-not-exists statement there.
