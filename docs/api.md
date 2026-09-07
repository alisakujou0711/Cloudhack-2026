# API reference

All endpoints live in `server/routes/api.js`, mounted at `/api` by `server/app.js`. Client
methods are in `client/src/api/client.js`.

## Shared behavior

- **Sessions are cookies.** Signing up or in sets an httpOnly `pp_session` cookie
  (`sameSite=lax`, 30 days). Browsers must send credentials; CORS is configured with an explicit
  origin so the cookie survives direct access to port 4000. See `docs/architecture.md`.
- **`requireAuth` guards every endpoint except `GET /health` and the two credential routes**
  (`/auth/signup`, `/auth/login`) — applied once as `router.use(requireAuth)` partway down
  `routes/api.js`, so anything declared below that line is gated by default. On the upload routes
  the guard sits ahead of `multer`, so an unauthenticated upload is never parsed into memory. See
  `docs/architecture.md`. The feature endpoints stay stateless: the client still sends whatever
  state it needs (including `profile`) in the body.
- **401 `{error}`** is the response to a missing, unknown, or expired session, and to failed
  sign-in credentials.
- **Uploads**: `multer` with `memoryStorage()`, `fileSize` capped at **10MB**, always the field
  name `file`. Nothing is written to disk.
- **JSON bodies**: capped at `2mb` (`express.json({ limit: '2mb' })` in `app.js`).
- **Errors**: `400 {error: string}` for missing/invalid input and for any thrown service error
  (which is also `console.error`'d). `422 {error}` is used for one specific case — a file parsed
  successfully but yielded no text.
- **LLM failures never surface as errors** — they fall back to a mock and the response carries
  `source: 'mock-fallback'`. See `docs/llm.md`.

## Endpoints

| Method + path | Request | Response | Service |
| --- | --- | --- | --- |
| `GET /health` | — | `{ok, llmConfigured, llmProvider}` | — |
| `POST /auth/signup` | `{email, password}` — password min 8 chars | `201 {user{id, email, createdAt}}` + session cookie | `auth.signUp` |
| `POST /auth/login` | `{email, password}` | `{user}` + session cookie | `auth.signIn` |
| `POST /auth/logout` | — | `{ok: true}`, session deleted, cookie cleared | `auth.signOut` |
| `GET /auth/me` | — | `{user}` or `401` | `auth.getSessionUser` |
| `GET /state` | — | the account's whole state document, `{}` when nothing is saved yet | `userState.readState` |
| `PUT /state` | the whole state document as the body | `{ok: true}`, the stored document replaced | `userState.replaceState` |
| `DELETE /state` | — | `{ok: true}`, the document reset to the empty one a new account holds | `userState.clearState` |
| `GET /university/options` | — | `{universities: [{code, name, majors[]}]}` | `universityAssessment.listOptions` |
| `POST /assess/university` | `{university, major, portfolio{gpa?, subjects[], extracurriculars, languageProficiency}, profile?}` — first three required | `{university, universityCode, major, competitiveness, checklist[], checklistPassCount, checklistTotal, feedback{}, source}` | `universityAssessment` |
| `POST /university/extract` | multipart `file` | `{gpa?, subjects[], extracurriculars, essay, source, filename}` | `resumeParser` + `universityProfileParser` |
| `POST /university/extract-text` | `{text}` | `{gpa?, subjects[], extracurriculars, essay, source}` | `universityProfileParser` |
| `POST /optimize/classify` | multipart `file` | `{text, filename, predictedType, reason, source}` | `resumeParser` + `documentClassifier` |
| `POST /resume/extract` | multipart `file` | `{text, filename}` | `resumeParser` (no LLM) |
| `POST /assess/internship` | `{resumeText, targetRole?, profile?}` — `resumeText` min 10 chars | `{name, contact, overallImpression, strengths[], improvementAreas[], internationalNote, sections[], targetRole, source}` | `internshipAssessment` |
| `POST /optimize/essay` | `{questions[], answers[], university?, major?, profile?}` — `questions` non-empty array | `{overallImpression, strengths[], improvementAreas[], internationalNote, perQuestion[], university, major, source}` | `essayOptimization` |
| `POST /optimize/cover-letter` | `{prompts[], answers[], companyName?, role?, profile?}` — `prompts` non-empty array | `{overallImpression, strengths[], improvementAreas[], internationalNote, perPrompt[], companyName, role, source}` | `coverLetterOptimization` |
| `POST /interview/prepare` | `{type, university?, major?, companyName?, role?, jobDescription?, daysUntil?, profile?}` | `{targetName, overview, researchTips[], technicalPrep[], timelineAdvice, commonQuestions[], internationalNote, type, source}` | `interviewPrep` |
| `POST /resume/export` | `{name, contact, sections[{name, entries[{title, subtitle, dateRange, bullets: string[]}]}]}` | **`application/pdf` stream**, not JSON | `resumePdf` (no LLM) |
| `POST /chat` | `{message, history[], context{}}` — `message` required | `{reply, source}` | `chatbot` |

## Endpoint notes

- **`/auth/signup`** — `400` for a missing field, a password under 8 characters, or an email that
  is already registered (sign-up necessarily reveals that). Email is stored and matched
  case-insensitively.
- **`/auth/login`** — a wrong password and an unregistered email return the **same** `401` and the
  same message, so the form can't be used to discover who has an account. Don't split them.
- **`/auth/logout`** — deletes the session row before clearing the cookie; a captured token stops
  working immediately. It requires a session, so a signed-out client gets `401`.
- **`/state`** — one JSON document per account, mirroring `defaultState()` in `AppContext`,
  stored opaquely: nothing on the server reads inside it. The document travels as itself in both
  directions, not wrapped in an envelope. `PUT` replaces it **wholesale** — it does not merge —
  and validates only that the body is a JSON object (a `400` otherwise), because the client is the
  sole writer and a shape check would need updating on every state change. A row is created empty
  at sign-up, so a new account reads `{}` rather than a `404`. Concurrent writes are
  last-write-wins with no conflict detection. See `docs/architecture.md` for the client half.
- **`DELETE /state`** — what "Clear my data" on the History page calls. It resets the document to
  the same `{}` a new account reads, and stops there: the account and its session are untouched,
  so the person stays signed in and simply lands back in onboarding without a profile. It is **not** account deletion, which is deliberately not built. Clearing an
  already-empty document is a no-op, not an error.
- **`/assess/university`** — `university` is the *code* (`NUS`), `major` the exact key from
  `server/data/universityRequirements.js`. Unknown values throw, surfacing as a 400.
- **`/university/extract` vs `/university/extract-text`** — same parser, different input. The file
  variant is exposed on the client as `extractUniversityApplication` but the University panel
  actually uploads through `/optimize/classify` and then calls the *text* variant, so the
  document gets classified on the way in.
- **`/optimize/classify`** returns the extracted `text` alongside the prediction — this is the
  single upload endpoint all four optimize panels use via `DocumentUploader`. `predictedType` is
  one of `resume | university_application | essay | cover_letter | unknown`.
- **`/resume/extract`** is a plain text-extraction endpoint kept on the client `api` object; the
  Internship panel goes through `/optimize/classify` instead.
- **`/interview/prepare`** validates `type` is `'university' | 'internship'` and requires
  `university` or `companyName` respectively. `daysUntil` is coerced to a number or dropped.
- **`/resume/export`** streams a `pdfkit` document; the filename is sanitized to
  `[a-z0-9_]` server-side. The client reads it as a blob and triggers an `<a download>`. This is
  the only non-JSON response — use `requestBlob`, not `request`.
- **`/chat`** takes the full conversation each time — nothing about the exchange is stored
  server-side — plus a `context` object holding every feature's state. See `docs/features/chatbot.md`.

## Adding an endpoint

Keep the route thin: validate required fields, call one service, `res.json()`. Put the logic and
the prompt in `server/services/<feature>.js` (see `docs/llm.md`), then add a matching method to
the `api` object in `client/src/api/client.js`. Declare it **below** the `router.use(requireAuth)`
line so it inherits the gate; a genuinely public endpoint has to be placed above it deliberately.
