# Document pipeline (shared)

**What it does** — Turns an uploaded PDF/DOCX/TXT into text, guesses what kind of document it is,
and optionally pulls structured fields out of it. Shared infrastructure behind all four optimize
panels, not a user-facing feature of its own.

## Files

| Path | Role |
| --- | --- |
| `server/services/resumeParser.js` | `extractText(buffer, filename, mimetype)` — format detection + extraction |
| `server/services/documentClassifier.js` | `classifyDocument(text)` — document-type guess |
| `server/services/universityProfileParser.js` | `parseUniversityApplication(rawText)` — field extraction |
| `client/src/components/optimize/DocumentUploader.jsx` | The only client entry point |

## 1. Text extraction

Dispatches on file extension first, then mimetype:

| Input | Library |
| --- | --- |
| `.pdf` or `application/pdf` | `pdf-parse`, always destroyed in a `finally` |
| `.docx` or the OOXML mimetype | `mammoth.extractRawText` |
| `.txt`, `.md`, any `text/*` | `buffer.toString('utf-8')` |
| anything else | **throws** "Unsupported file type", surfacing as a 400 |

No LLM, no `source` field. Routes that call it return **422** when extraction succeeds but the
text is blank — a scanned or image-only PDF is the usual cause.

## 2. Classification

`classifyDocument(text)` returns `{predictedType, reason, source}`.

`predictedType` is one of `resume`, `university_application`, `essay`, `cover_letter`, `unknown`.
`reason` is one short sentence naming the concrete signal. Input is **truncated to the first 4000
characters** before being sent to the model.

The mock is a keyword scorer: resume and university keywords score 2, a "Dear hiring/admissions"
salutation 3, sign-offs 1, personal-statement phrases 2; highest score wins, and a zero score
falls through to `unknown`.

`DocumentUploader` uses the result only to decide whether to show its confirm banner — a wrong
guess never blocks the user. See `docs/features/application-optimization.md`.

## 3. Structured field extraction

`parseUniversityApplication(rawText)` returns `{gpa?, subjects[], extracurriculars, essay, source}`.

- `gpa` on a 4.0 scale, `undefined` when absent or not confidently convertible.
- `subjects` are exam/school subjects, **not** activities.
- The whole document is sent untruncated.

Two distinct consumers, same call:

1. **University panel pre-fill** — takes `gpa`, `subjects`, `extracurriculars`; ignores `essay`.
2. **Essay panel statement extraction** — takes `essay` only, so uploading a broad application
   document yields just the personal statement rather than the whole file.

The mock is regex and section based: a `gpa:` pattern, then Subjects / Extracurriculars /
Personal statement sections delimited by the next heading line, and — when no essay heading
exists — the **longest paragraph over 80 characters** as a rough guess.

## Invariants

- Uploads are never persisted: `multer.memoryStorage()`, 10MB cap, buffer discarded after the
  response.
- Extraction failure is an inline error, never a crash — panels catch and render `err.message`.
- The mocks must keep returning the same shapes as their prompts; a drifted mock only breaks once
  a real API key is in play (see `docs/llm.md`).
- Adding a document type means updating the classifier prompt, its mock, and `DocumentUploader`'s
  `TYPE_LABELS` together.
