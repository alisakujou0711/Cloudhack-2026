# Inspirations

**What it does** — A browsable gallery of sample college application essays and sample internship
resumes. Entirely **static curated content** — no LLM, no server call — that the student can read
in full and bookmark.

## Files

| Path | Role |
| --- | --- |
| `client/src/pages/InspirationsPage.jsx` | Mode picker + `EssayGallery` + `ResumeGallery` |
| `client/src/data/sampleEssays.js` | `SAMPLE_ESSAYS` — 8 entries |
| `client/src/data/sampleResumes.js` | `SAMPLE_RESUMES` — 5 entries |
| `client/src/components/inspirations/EssayView.jsx` | Full essay renderer |
| `client/src/components/inspirations/SampleResumeView.jsx` | Full resume renderer |

Lives at `/app/inspirations`, its own tab.

## Flow

1. Pick a mode (essays or resumes); nothing renders until one is chosen.
2. Each card shows a badge, title, and one-line theme/summary, with "Read full essay" /
   "View full resume" expanding it inline through the same view component History uses.
3. Bookmarking round-trips through History (below).

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
- Adding a sample means appending to the data file. Adding a *category* also means a new mode
  tile, a gallery component, a `TYPE_LABELS` entry, and a `renderSnapshot` case.
