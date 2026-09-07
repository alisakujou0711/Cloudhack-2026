# History

**What it does** — One flat, filterable, bookmarkable log of everything the student has done:
every completed optimization run, manually saved interview plans, and bookmarked Inspirations
items. Each entry stores a full snapshot, so it can be reopened and re-rendered read-only.

## Files

| Path | Role |
| --- | --- |
| `client/src/pages/HistoryPage.jsx` | `TYPE_LABELS`, `renderSnapshot`, filters, the list |
| `client/src/context/AppContext.jsx` | `addHistoryEntry`, `toggleBookmark`, `removeHistoryEntry` |

No server involvement at all — History is entirely `localStorage`.

## Entry shape

    { id, timestamp, bookmarked, type, title, summary, snapshot }

`id` is a `crypto.randomUUID()` (with a timestamp fallback) and `timestamp` is `Date.now()`, both
added by `addHistoryEntry`. New entries are **prepended**, so the list is newest-first with no
sorting step.

## The seven types

| `type` | Written by | Rendered by |
| --- | --- | --- |
| `university` | `UniversityPanel` | `UniversityReport` |
| `internship` | `InternshipPanel` | `ResumeReviewEditor` (only if `snapshot.sections` exists) |
| `essay` | `EssayPanel` | `QAReview` with `perQuestion` |
| `coverLetter` | `CoverLetterPanel` | `QAReview` with `perPrompt` |
| `interview` | `InterviewsPage`, **manually** via a button | `InterviewPlanView` |
| `essayExample` | Inspirations bookmark | `EssayView` |
| `resumeExample` | Inspirations bookmark | `SampleResumeView` |

The first four are written automatically through the `onComplete` contract in
`docs/features/application-optimization.md`.

## Adding a history-eligible feature

Two places, both in `HistoryPage.jsx`, and missing either one is the classic bug:

1. **`TYPE_LABELS`** — or the filter dropdown has no option and the badge shows the raw key.
2. **`renderSnapshot`** — or expanding the entry silently renders nothing.

Then have the feature call `onComplete({type, title, summary, snapshot})` with the full result as
`snapshot`. Reuse an existing report component rather than writing a read-only variant; all four
renderers already work with no callbacks.

## UI notes

- Filters: a type dropdown built from `TYPE_LABELS` plus a "Bookmarked only" checkbox; both are
  local state.
- Clicking a row expands it inline and renders the snapshot. Only one is open at a time.
- Bookmark and Remove sit inside a `stopPropagation` wrapper so they don't toggle the expansion.
- A "Your Documents" card at the top reports whether a university document
  (`universityPortfolio.rawText`) and a resume (`internshipPortfolio.resumeText`) are on file.
  It reads current portfolio state, not history.

## Invariants

- `snapshot` holds the **entire** API result. Trimming it to save space breaks re-rendering —
  report components read fields the summary line doesn't carry, including `source`.
- Bookmarking an Inspirations item **creates** a history entry and un-bookmarking **deletes** it,
  matched on `snapshot.id`. Nothing else in the app treats removal as an un-bookmark; see
  `docs/features/inspirations.md`.
- `ResumeReviewEditor` rendered from History is fully interactive (accept/reject, PDF download)
  and gets no `key`, so its decisions persist only while the row stays expanded. See
  `docs/features/internship-resume.md`.
