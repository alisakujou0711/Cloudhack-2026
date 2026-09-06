# History

**What it does** — One flat, filterable, bookmarkable log of everything the student has done:
every completed optimization run, manually saved interview plans, and bookmarked Inspirations
items. Each entry stores a full snapshot, so it can be reopened and re-rendered read-only.

## Files

| Path | Role |
| --- | --- |
| `client/src/pages/HistoryPage.jsx` | `TYPE_LABELS`, `renderSnapshot`, filters, the list, `ClearMyDataCard` |
| `client/src/context/AppContext.jsx` | `addHistoryEntry`, `toggleBookmark`, `removeHistoryEntry`, `clearData` |

History has no endpoint of its own: entries live in the `history` key of the account's state
document, which `AppContext` reads once from `GET /state` and writes back on a debounce. Adding an
entry is a state mutation like any other. See `docs/architecture.md`.

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

1. **`TYPE_LABELS`** — or the type has no filter chip and the row shows the raw key.
2. **`renderSnapshot`** — or expanding the entry silently renders nothing.

Then have the feature call `onComplete({type, title, summary, snapshot})` with the full result as
`snapshot`. Reuse an existing report component rather than writing a read-only variant; all four
renderers already work with no callbacks. `TYPE_LABELS` stays the only place a type is named:
`chipLabel` trims the label for the chip and `entryTitle` strips it off the front of the title, so
neither needs a second map.

## UI notes

The page is a dated log, styled under a `.history` scope (`--h-ink`, `--h-mark`, `--rail`) the way
the desk is scoped under `.optimize`.

- Filters are chips built from `TYPE_LABELS`, carrying counts, and shown only for types the
  account actually has — plus the selected one, so removing the last entry of a type can't take
  its own chip away. A star chip toggles bookmarked-only. Both are local state.
- Entries are grouped by calendar day (`groupByDay`) under a date that sticks in the rail while
  its own entries scroll. History is prepended newest-first, so one pass produces the days in
  order too; no sorting step.
- `entryTitle` drops the type label off the front of the title (five of the seven types write it
  there) so the row prints the category once, above the subject.
- The row header is a `<button>` with `aria-expanded`; Bookmark and Remove are siblings of it, not
  children, so neither needs `stopPropagation`. Only one row is open at a time.
- The star persists like any other mutation — a debounced `PUT` of the whole document, with no
  visible save indicator anywhere. See `docs/architecture.md`.
- **Arrival:** everything carries `.rise` and a `--rise-step` set from `HistoryPage`, so the page
  assembles once in reading order on the mount that clicking the tab causes. The log is keyed on
  `filter`/`bookmarkedOnly`, which replays the cascade when a chip is pressed. Under
  `prefers-reduced-motion` nothing animates.
- An **"On this account"** shelf sits below the log — the log is what the tab is for — reporting
  whether a university document (`universityPortfolio.rawText`) and a resume
  (`internshipPortfolio.resumeText`) are on file, with word counts. It reads current portfolio
  state, not history.
- **"Clear my data"** sits directly below that, because clearing wipes exactly what the shelf
  reports: an inline two-step confirmation (never `window.confirm`) that calls `clearData` and
  wipes the whole state document. The trigger is a ghost button and only the confirm step is red.
  It lives here, not in the header, because the header's neighbouring control is Sign out — the
  action people press constantly — and pairing the two invites the wrong click.

## Invariants

- `snapshot` holds the **entire** API result. Trimming it to save space breaks re-rendering —
  report components read fields the summary line doesn't carry, including `source`.
- Bookmarking an Inspirations item **creates** a history entry and un-bookmarking **deletes** it,
  matched on `snapshot.id`. Nothing else in the app treats removal as an un-bookmark; see
  `docs/features/inspirations.md`.
- Clearing goes through `DELETE /state` and only then resets local state, so it survives signing
  out and back in. A local-only reset would be undone by the next `GET /state`. The account is
  never touched: clearing data is not deleting an account. See `docs/api.md`.
- `ResumeReviewEditor` rendered from History is fully interactive (accept/reject, PDF download)
  and gets no `key`, so its decisions persist only while the row stays expanded — and a filter
  change remounts the log, which counts as closing it. See `docs/features/internship-resume.md`.
