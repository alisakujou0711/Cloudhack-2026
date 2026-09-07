# Cover Letter Optimization

**What it does** — The essay flow scoped to jobs: collects the company, role, and one or more
application prompts with the student's drafts, then returns whole-letter feedback plus an itemized
critique per prompt.

## Files

| Path | Role |
| --- | --- |
| `client/src/components/optimize/CoverLetterPanel.jsx` | Two-step form, draft upload, submit |
| `client/src/components/QAReview.jsx` | Shared report renderer (also used by essays) |
| `server/services/coverLetterOptimization.js` | Prompt + `mockCoverLetterReview` |
| `POST /api/optimize/cover-letter` | See `docs/api.md` |

## Flow

1. **Setup step** — company name, role, an optional pasted job description, and how many prompts
   (clamped 1-10). When the count is **1**, the single prompt defaults to the literal string
   `"Cover letter"`, so the common case of one plain letter needs no thought from the user.
2. **Prompts step** — one prompt input + answer textarea per slot. An optional draft upload
   (expects `cover_letter`) prefills the **first empty answer**.
3. Submit requires every prompt's *text* to be non-empty; blank answers are allowed.
4. `QAReview` renders Feedback (overview) then Corrections (per prompt), with `itemLabel="Prompt"`.

The step starts at `prompts` if one already exists in persisted state. "Back" returns to setup.

## Contract

`{overallImpression, strengths[], improvementAreas[], internationalNote|null, perPrompt[],
companyName, role, source}`

`perPrompt[] = {prompt, feedback}` — **exactly one entry per prompt, in the same order**. Overview
fields describe the letter as a whole, 2-4 items each; per-prompt feedback is 2-4 sentences
referencing the actual answer.

`internationalNote` here is about **work authorization** for a Singapore-based role (proactively
stating visa/pass eligibility), which is the internship-side framing rather than the
transcript/English-test framing used by essays.

## Differences from Essay Optimization

Same pattern, three deliberate divergences — don't accidentally unify them:

| | Essay | Cover letter |
| --- | --- | --- |
| Item key | `question` / `perQuestion` | `prompt` / `perPrompt` |
| Draft upload | extracted through `parseUniversityApplication`, essay field only | **raw text used directly** |
| Context fields | university, major | companyName, role, **jobDescription** |

## Invariants

- `prompts` and `answers` are index-aligned arrays of equal length, resized only in the setup step.
- `perPrompt` length and order must match `prompts` — `QAReview` numbers by array index.
- `QAReview` reads `item.question || item.prompt`; keep it generic rather than branching on
  feature inside the component.
- Feedback stays qualitative, with no numeric score.

## Related

`docs/features/essay-optimization.md` — the sibling flow. A change to the shared report shape
affects both, plus `HistoryPage`'s snapshot rendering for `essay` and `coverLetter`.
