# Application Optimization (the shell)

**What it does** — The app's core tab at `/app/optimize`. The user picks *what* they're
optimizing, then one of four self-contained panels takes over. This doc covers the shell and the
upload widget they share; each panel has its own doc.

## Files

| Path | Role |
| --- | --- |
| `client/src/pages/ApplicationOptimizationPage.jsx` | Type picker, panel mount, `onComplete` into History |
| `client/src/components/optimize/DocumentSpecimen.jsx` | The four drawn paper miniatures the picker and nothing else uses |
| `client/src/components/optimize/MarkupPanel.jsx` | Shared report column: empty / working / marked |
| `client/src/components/optimize/DocumentUploader.jsx` | Shared upload + classify + mismatch confirm |
| `client/src/components/optimize/UniversityPanel.jsx` | see `docs/features/university-application.md` |
| `client/src/components/optimize/InternshipPanel.jsx` | see `docs/features/internship-resume.md` |
| `client/src/components/optimize/EssayPanel.jsx` | see `docs/features/essay-optimization.md` |
| `client/src/components/optimize/CoverLetterPanel.jsx` | see `docs/features/cover-letter-optimization.md` |

## Flow

1. With nothing selected the page is the **desk**: a headline addressed to the student by name and
   `TYPE_OPTIONS` as four `DocumentSpecimen` miniatures (university / internship / essay /
   coverLetter). The one matching `suggestedOptimizationType` carries a ribbon and the line
   "Suggested for you"; that line's slot is rendered on all four so the names share a baseline.
2. Selecting a type replaces the desk with `.doc-rail` — "All documents" back to the desk, plus a
   tab per type, so lanes are switched directly rather than deselected first. `selectedType` is
   **local component state** and resets on navigation, deliberately; the panels' form data is what
   persists, in `AppContext`, so switching lanes loses nothing.
3. The panel does its own upload, form and API call, and passes its result to `MarkupPanel` beside
   the form (`.page-grid` is the two-column layout).
4. On success the panel calls `onComplete(entry)`, which is `addHistoryEntry`.

## MarkupPanel

The right-hand column of all four panels. Props: `title`, `loading`, `loadingLabel`,
`invitation`, `sections` (the headings the report will arrive under), `result`, `children`. It
derives one of three states from `loading` and `result`:

- **empty** — the `invitation` plus a ghost of `sections`, so the column describes the work that
  is coming instead of reading "Report / Submit your … to see feedback".
- **working** — `PenPass`, ruled lines being struck and rewritten. The only thing on the page that
  moves on its own, and only while a request is in flight.
- **marked** — `children`, revealed once.

Pass `result` as **null** whenever the report cannot render (`InternshipPanel` passes null unless
`sections` is present), or the panel shows an empty markup state instead of the invitation.

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
- A new optimization type needs: an entry in `TYPE_OPTIONS`, a case in `DocumentSpecimen`'s
  `SPECIMENS` map, a panel, an `expectedType` the classifier can actually predict, and its `type`
  registered in `HistoryPage`.
- The page carries the sign-in screen's manuscript palette (ink / paper / strike / written),
  declared on `.optimize` rather than `:root` so it cannot leak into the other tabs. `.markup`
  retints the shared report components — `.reviewer-note`, `.checklist`, `.badge`, `.qa-item` —
  because their cool tints read as UI panels stuck onto paper.
- `.type-option*` in `index.css` now serves only the Inspirations mode switcher.
