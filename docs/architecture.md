# Architecture

Cross-cutting shape of the app. Read this when orienting, or before touching state, routing, or
the request path. Feature-specific detail lives in `docs/features/`.

## Runtime topology

Two independent npm packages, always installed and run separately — there is no root install and
no workspace config.

| Package | Port | Entry | Notes |
| --- | --- | --- | --- |
| `client/` | 5173 | `client/src/main.jsx` | Vite + React 19, `BrowserRouter`, plain CSS |
| `server/` | 4000 | `server/index.js` | Express 5, CommonJS, `node --watch` in dev. `app.js` builds and exports the configured app; `index.js` listens, and seeds the demo account (`docs/features/demo-account.md`) — the only two things it does |

`server/db.js` opens a SQLite file (`better-sqlite3`, synchronous) and applies the schema on
import — `users`, `sessions`, and `user_state` (one state document per account) — with every
statement create-if-not-exists so repeated boots are safe. The path defaults to
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
- `requireAuth` guards every route except the health check and the two credential routes — one
  `router.use` rather than a per-route list, so a new endpoint is closed unless it is deliberately
  declared above the gate. The feature endpoints hold no Account's data, so this is posture rather
  than data protection. See `docs/api.md`.
- On the client, `client/src/context/AuthContext.jsx` owns the session — deliberately **separate**
  from `AppContext`, because auth resolves first and gates whether the app is reachable at all. It
  resolves `/auth/me` once on mount, exposes `signUp` / `signIn` / `signOut`, and registers the API
  client's `setUnauthorizedHandler`.
- A 401 from any non-`/auth/*` endpoint is handled **once, centrally** in `api/client.js`: it
  clears the auth context so the routing gate returns the person to sign-in, instead of a red
  "Unauthorized" appearing inside whichever panel made the call. Auth endpoints are exempt — their
  401 means "those credentials are wrong" and belongs on the sign-in screen.

## Client state

`client/src/context/AppContext.jsx` holds **one** state object for the whole app — the state
document — and **the server owns it**. There is no reducer and no per-slice store: every setter
shallow-merges into one key, and every setter goes through `mutate()`, which moves React state
immediately and schedules a save of the whole document.

State keys (`defaultState()`): `profile`, `universityPortfolio`, `internshipPortfolio`,
`essayOptimization`, `coverLetterOptimization`, `interviewPrep`, `universityAssessment`,
`internshipAssessment`, `essayAssessment`, `coverLetterAssessment`, `interviewPlan`,
`chatHistory`, `history`.

- **Read once per session.** `AppProvider` watches `account.id` from `AuthContext` and `GET`s
  `/state` when it changes. `fromDocument()` spreads the document over `defaultState()`, so a key
  added after an account's last save is present rather than undefined, and it migrates a legacy
  per-page `chatHistory` object into a single array — keep that migration.
- **Written on a debounce.** A mutation schedules one `PUT /state` of the entire document 800ms
  later, so typing in a text field is one request rather than one per keystroke. Writes are
  last-write-wins with no conflict detection: two browsers signed into one account clobber each
  other, knowingly.
- **Nothing is written to browser storage.** The `localStorage` copy was removed, not demoted to a
  cache — a cached document is stale the moment a different account signs in. See
  `docs/adr/0002-server-is-sole-source-of-truth.md` before reintroducing one.
- Two statuses come out of the context: `loadStatus` (`idle | loading | ready | error`), which
  gates routing, and `saveStatus` (`idle | pending | saving | saved | error`), which is what the
  header's indicator in `Layout.jsx` reports.
- Signing out cancels any queued write and resets state to defaults, so a pending save can never
  land on the account that signs in next.
- **Clearing is a server call, not a local reset.** `clearData()` (History page, "Clear my data")
  cancels any queued write — it still holds the document being wiped — and **awaits any write
  already on the wire**, which cannot be cancelled and would silently restore the document if its
  `PUT` reached the server after the `DELETE`. It then sends `DELETE /state` and moves state to
  defaults *without* scheduling a save; going through `mutate` would write the defaults straight
  back over the wipe. On failure it puts the header back where it was, re-queueing the dropped
  write if there was one. Losing `profile` with the document is what walks the person back through
  onboarding, via the routing gate below.
- `client/src/context/ChatUIContext.jsx` is a **separate**, deliberately unpersisted context for
  chat panel open/draft state. See `docs/features/chatbot.md`.

Adding persisted state still means touching three places: `defaultState()`, a setter in
`AppContext` (going through `mutate`), and `buildContext()` in `ChatbotWidget.jsx`. The server
stores the document opaquely, so no server change is needed.

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
screen — deciding earlier would flash the sign-in screen at someone who is already signed in. The
profile gate waits on a second condition for the same reason: until `AppContext`'s `loadStatus` is
`'ready'` the profile has not arrived, and judging it early would push a returning student back
through onboarding. A failed load renders a retry screen rather than an empty app.

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

One global stylesheet, `client/src/index.css` (~1230 lines), with CSS custom properties on
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
