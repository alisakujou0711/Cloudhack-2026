# Essay Optimization

**What it does** — Collects a set of university application essay questions and the student's
answers, then returns whole-set feedback plus one itemized critique per question.

## Files

| Path | Role |
| --- | --- |
| `client/src/components/optimize/EssayPanel.jsx` | Two-step form, draft upload, submit |
| `client/src/components/QAReview.jsx` | Shared report renderer (also used by cover letters) |
| `server/services/essayOptimization.js` | Prompt + `mockEssayReview` |
| `POST /api/optimize/essay` | See `docs/api.md` |

## Flow

1. **Setup step** — university (from `GET /university/options`, stored by *name* here, not code),
   major as free text, and how many questions (clamped 1-10). Continue resizes the `questions`
   and `answers` arrays, preserving anything already typed.
2. **Questions step** — one question input + answer textarea per slot. An optional draft upload
   (expects `essay`) prefills the **first empty answer**.
3. Submit requires every question's *text* to be non-empty; blank answers are allowed and are
   explicitly handled by the prompt.
4. `QAReview` renders Feedback (overview) then Corrections (per question).

The step starts at `questions` if a question already exists in persisted state, so returning to
the panel resumes where the user left off. "Back" returns to setup.

## Draft upload: statement extraction

Rather than dumping the whole uploaded document into an answer, the panel runs it through
`POST /university/extract-text` and uses only the `essay` field — so uploading a broad application
document yields just the personal statement. If extraction fails or returns nothing, it falls back
to the raw text. See `docs/features/document-pipeline.md`.

This is the deliberate difference from the cover letter panel, which uses the raw draft directly.

## Contract

`{overallImpression, strengths[], improvementAreas[], internationalNote|null, perQuestion[],
university, major, source}`

`perQuestion[] = {question, feedback}` — **exactly one entry per question, in the same order**.
Overview fields describe the essay *set as a whole*, 2-4 items each; per-question feedback is 2-4
sentences and must reference the actual answer content.

When an answer is empty the model is told to say so plainly rather than inventing feedback about
content that doesn't exist. The mock mirrors this with a three-way branch: no answer / under 150
characters / long enough.

## Invariants

- `questions` and `answers` are index-aligned arrays of equal length; the setup step is the only
  place their length changes, and both are resized together.
- `perQuestion` length and order must match `questions` — `QAReview` numbers items by array index
  and does not re-match on text.
- `QAReview` is shared with cover letters; it takes `items` and `itemLabel` props and reads
  `item.question || item.prompt`. Keep it generic rather than branching on feature inside it.
- Feedback stays qualitative — no scores, consistent with the rest of the app.

## Related

`docs/features/cover-letter-optimization.md` is the same pattern scoped to company/role/prompts;
change the two together when you change the shape.
