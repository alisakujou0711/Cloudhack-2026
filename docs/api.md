# API reference

All endpoints live in `server/routes/api.js`, mounted at `/api` by `server/app.js`. Client
methods are in `client/src/api/client.js`.

## Shared behavior

- **No auth, no sessions.** Every request is independent; the client sends whatever state it
  needs (including `profile`) in the body.
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
- **`/chat`** takes the full conversation each time (no server-side session) plus a `context`
  object holding every feature's state. See `docs/features/chatbot.md`.

## Adding an endpoint

Keep the route thin: validate required fields, call one service, `res.json()`. Put the logic and
the prompt in `server/services/<feature>.js` (see `docs/llm.md`), then add a matching method to
the `api` object in `client/src/api/client.js`.
