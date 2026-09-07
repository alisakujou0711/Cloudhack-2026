# Internship Application Optimization (resume review)

**What it does** — Parses a resume into its real sections and entries, proposes a sharper rewrite
for weak bullets as accept/reject suggestions (track-changes style), and exports the resolved
resume as a PDF. The most complex feature in the app.

## Files

| Path | Role |
| --- | --- |
| `client/src/components/optimize/InternshipPanel.jsx` | Form, submit, `reviewKey` remount |
| `client/src/components/ResumeReviewEditor.jsx` | Report, diff bullets, accept/reject, download |
| `server/services/internshipAssessment.js` | Prompt + `mockReview` |
| `server/services/resumePdf.js` | `buildResumePdf` — pdfkit A4 document |
| `POST /api/assess/internship`, `POST /api/resume/export` | See `docs/api.md` |

## Flow

1. Upload (expects `resume`) is the **primary prompted path**; the extracted text fills an
   editable textarea, which can also be pasted into directly. Minimum 10 characters.
2. Submit sends `{resumeText, targetRole, profile}`.
3. The model returns the parsed resume plus per-bullet suggestions; the result is stored and
   `reviewKey` is incremented.
4. `ResumeReviewEditor` renders overview, then every section/entry/bullet. Bullets with a
   suggestion render as a diff with Accept / Reject / Discuss.
5. Download resolves the decisions and POSTs to `/resume/export`, which streams back a PDF the
   client saves via an object URL.

## Contract

`{name, contact, overallImpression, strengths[], improvementAreas[], internationalNote|null,
sections[], targetRole, source}` where

`sections[] = {name, entries[]}` and `entries[] = {title, subtitle, dateRange, bullets[]}` and
`bullets[] = {original, suggestion|null}`.

- `original` is the bullet **verbatim**; the model must not paraphrase it.
- `suggestion` is `null` when the bullet is already good — the prompt targets roughly a third to
  half being `null`, and explicitly forbids changing something just to change it.
- A suggestion sharpens phrasing, framing, or specificity of what is already there. It must
  **never invent** facts, companies, numbers, or achievements.
- `subtitle`/`dateRange` are `""` when absent, never "N/A" — `clean()` in the editor is a second
  line of defence against the model writing a placeholder anyway.
- **No numeric score anywhere.** The prompt forbids it and the UI has nowhere to put one; this is
  a deliberate product stance (qualitative, editor's-notes feedback).

## Accept / reject model

Local state in `ResumeReviewEditor`: `decisions[sectionIdx-entryIdx-bulletIdx]` is `'accepted'`,
`'rejected'`, or absent (pending). A footer bar offers prev/next navigation across suggestions
plus "Keep all" and "Undo all". Both bulk buttons are gated on the same derived state: "Keep all"
is disabled once every suggestion is `'accepted'`, and "Undo all" is disabled while `decisions` is
empty and rendered armed (`.is-armed`, red) exactly while "Keep all" is disabled.

`resolvedSections()` maps each bullet to `suggestion` **only when explicitly accepted** —
pending and rejected both resolve to `original`. Never treat a pending suggestion as applied.

"Discuss" calls `openWithDraft()` from `ChatUIContext`, opening the chatbot with the bullet
prefilled. See `docs/features/chatbot.md`.

## The reviewKey invariant

`ResumeReviewEditor` keeps accept/reject state in `useState` keyed by array index. Reviewing a
second resume produces the same indices, so **without a changing `key` the previous resume's
decisions leak onto the new one.** `InternshipPanel` bumps `reviewKey` on every successful
assessment to force a full remount. Any other mount site must do the same.

## PDF export

`buildResumePdf` takes the **resolved** shape (`bullets` are plain strings, not the diff objects)
and emits an A4 pdfkit document: bold name, grey contact line, then per section an uppercase
heading with a rule, entry headers as "Title — Subtitle (dates)", and bulleted lines. The route
sanitizes the filename and streams the document; this is the only non-JSON endpoint.
