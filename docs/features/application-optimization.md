# Application Optimization (the shell)

**What it does** — The app's core tab at `/app/optimize`. The user picks *what* they're
optimizing, then one of four self-contained panels takes over. This doc covers the shell and the
upload widget they share; each panel has its own doc.

## Files

| Path | Role |
| --- | --- |
| `client/src/pages/ApplicationOptimizationPage.jsx` | Type picker, panel mount, `onComplete` into History |
| `client/src/components/optimize/DocumentUploader.jsx` | Shared upload + classify + mismatch confirm |
| `client/src/components/optimize/UniversityPanel.jsx` | see `docs/features/university-application.md` |
| `client/src/components/optimize/InternshipPanel.jsx` | see `docs/features/internship-resume.md` |
| `client/src/components/optimize/EssayPanel.jsx` | see `docs/features/essay-optimization.md` |
| `client/src/components/optimize/CoverLetterPanel.jsx` | see `docs/features/cover-letter-optimization.md` |

## Flow

1. `TYPE_OPTIONS` renders four tiles (university / internship / essay / coverLetter). The tile
   matching `suggestedOptimizationType` is badged "Suggested for you" until a choice is made.
2. Selecting a type mounts that panel plus a "Change type" link. `selectedType` is **local
   component state** and resets on navigation, deliberately — the panels' form data is what
   persists, in `AppContext`.
3. The panel does its own upload, form, API call, and renders its own report into a second card
   beside the form (`.page-grid` is the two-column layout).
4. On success the panel calls `onComplete(entry)`, which is `addHistoryEntry`.

## onComplete contract

Every panel calls it with exactly this shape:

    onComplete?.({ type, title, summary, snapshot })

- `type` — one of `university`, `internship`, `essay`, `coverLetter`; must match a case in
  `HistoryPage`'s `renderSnapshot`.
- `title` — human label, e.g. "University Application — National University of Singapore
  (Computer Science)".
- `summary` — one line for the collapsed row (`feedback.summary` or `overallImpression`).
- `snapshot` — the **entire** API result, so History can re-render the report read-only later.

`addHistoryEntry` adds `id`, `timestamp`, and `bookmarked: false`. See `docs/features/history.md`.

## DocumentUploader

Self-contained: pick a file, `POST /api/optimize/classify`, compare `predictedType` against the
panel's `expectedType`, then hand the text back through `onExtracted`.

Props: `expectedType`, `prompt`, `hint`, `onExtracted(text, filename)`, `onRemove`.

**Confirm, never reject.** On a mismatch it shows an inline banner ("This file looks like *a
resume*, not *an essay*. Continue anyway?") offering Cancel or Continue anyway. A prediction of
`unknown` counts as no mismatch. This is intentional product behavior — do **not** turn it into a
hard validation error. Extraction failures (unsupported type, empty text) are separate and do
surface as inline errors.

Once loaded it collapses to a file card showing the filename and character count, with an "Upload
a different file" link. Accepted: `.pdf`, `.docx`, `.txt`, `.md`. See
`docs/features/document-pipeline.md`.

## Invariants

- Each panel owns its own upload — there is no single shared up-front upload, and the panels
  differ in what they do with the extracted text.
- Extracted text always lands in an **editable** field; nothing is submitted straight from a file.
- A new optimization type needs: a tile in `TYPE_OPTIONS`, a panel, an `expectedType` the
  classifier can actually predict, and its `type` registered in `HistoryPage`.
