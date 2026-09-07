# Inspirations

**What it does** — A browsable gallery of sample college application essays and sample internship
resumes. Entirely **static curated content** — no LLM, no server call — that the student can read
in full and bookmark.

## Files

| Path | Role |
| --- | --- |
| `client/src/pages/InspirationsPage.jsx` | Lane switch + `Piece` + `EssayShelf` / `ResumeShelf` |
| `client/src/data/sampleEssays.js` | `SAMPLE_ESSAYS` — 8 entries |
| `client/src/data/sampleResumes.js` | `SAMPLE_RESUMES` — 5 entries |
| `client/src/components/inspirations/EssayView.jsx` | Full essay renderer |
| `client/src/components/inspirations/SampleResumeView.jsx` | Full resume renderer |

Lives at `/app/inspirations`, its own tab.

## Flow

1. The essay lane is showing on arrival; the switch above the shelf swaps to resumes.
2. Every piece is a `Piece` — a hook line, a one-line blurb, a credit, and a "Read" cue, with a
   bookmark star in its corner. An essay's hook is its own opening sentence (`openingLine`); a
   resume leads with its role and hooks on the first sentence of `summary[0]`.
3. "Read" expands the piece to the full width of the shelf and opens it onto paper, through the
   same view component History uses.
4. Bookmarking round-trips through History (below).

## Data shapes

Essay: `{id, university, topic, theme, text[]}` — `text` is an array of paragraph strings.
`EssayView` renders each as a `<p>` and shows a fallback line when `text` is missing, which
happens for older bookmarked snapshots.

Resume: `{id, role, field, name, tagline, summary[], keySkills[], experience[], technicalSkills[],
education, note?}` where `experience[] = {title, org, dateRange, bullets[]}`.

## Bookmarking

There is no separate bookmark store. Bookmarking **creates a history entry**
(`type: 'essayExample'` or `'resumeExample'`, `bookmarked: true`, `snapshot` = the whole sample
object); un-bookmarking **removes** that entry via `removeHistoryEntry`. The current state is
derived by searching `history` for an entry whose `snapshot.id` matches.

Consequence worth knowing: deleting the row from the History page also un-bookmarks it here, and
that is intended. See `docs/features/history.md`.

## Content constraint (important)

Both data files were written **original** for this app rather than copied from external sites, and
the file headers say so. The essays are original narratives in the style of common
personal-statement themes; the resumes are original sample content.

Any new sample content must be **original or reference-only** (title/university/theme with a link
out). Do not paste in real applicants' essays, third-party site content, or anything else
copyrighted — that constraint is the reason this data looks the way it does.

## Invariants

- Static data only. This feature makes no API call and has no `source` field, so no demo-mode
  notice ever appears here.
- `id` must be unique and stable within each array — bookmarks match on it, so changing an `id`
  orphans existing bookmarks.
- `EssayView` and `SampleResumeView` are shared with `HistoryPage`; they must stay pure renderers
  that tolerate an older snapshot missing newer fields.
- `openingLine` cuts the hook at a real sentence end — it skips title abbreviations, so "Mr." in
  the hospice essay does not end the quotation early. Sample text with a new abbreviation needs it
  added to `ABBREVIATION`.
- `EssayView` still renders its own header. Inspirations hides it in CSS because the piece above
  the pane already carries the title, university and theme; History opens the entry cold and needs
  it, so it must not be removed from the component.
- The room is scoped on `.inspirations` and its arrival cascade is the shared `rise-in` keyframe
  driven by `--rise-step`, set in the page because only it knows the length of the open lane.
- Adding a sample means appending to the data file. Adding a *category* also means a new lane, a
  shelf component, a `TYPE_LABELS` entry, and a `renderSnapshot` case.
