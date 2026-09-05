# University Application Optimization

**What it does** — Scores a student's portfolio against hardcoded baseline admission requirements
for a Singapore university/major, then layers qualitative LLM feedback on top. The only feature
with a deterministic, non-LLM component.

## Files

| Path | Role |
| --- | --- |
| `client/src/components/optimize/UniversityPanel.jsx` | Form, submit, and the exported `UniversityReport` |
| `server/services/universityAssessment.js` | `buildChecklist`, prompt, `mockFeedback`, `listOptions` |
| `server/data/universityRequirements.js` | The requirements table — the app's only "database" |
| `POST /api/assess/university`, `GET /api/university/options` | See `docs/api.md` |

## Flow

1. `GET /university/options` populates the university dropdown; picking one populates majors.
2. Upload is **optional** — `DocumentUploader` (expects `university_application`) stores the raw
   text and then calls `POST /university/extract-text`, pre-filling GPA / subjects /
   extracurriculars. Every pre-filled field stays editable, and existing values are not clobbered.
3. Submit sends `{university (code), major, portfolio, profile}`. GPA is parsed to a float,
   subjects split on commas.
4. The service computes the checklist **deterministically**, then asks the model for prose,
   passing the finished checklist in the prompt marked "already computed, do not recompute".
5. `UniversityReport` renders competitiveness badge, pass count, checklist, then feedback.

## Contracts

Result: `{university, universityCode, major, competitiveness, checklist[], checklistPassCount,
checklistTotal, feedback, source}`

Checklist item: `{id, label, met, detail, optional?}`

LLM `feedback`: `{summary, strengths[], gaps[], recommendations[], internationalNote|null}` —
note this is the only assessment using `summary`/`gaps` rather than
`overallImpression`/`improvementAreas`.

## The checklist

`buildChecklist(portfolio, requirements, profile)` produces, in order:

1. Minimum GPA — met when `portfolio.gpa` is a number at or above `requirements.minGpa`.
2. One item per `requiredSubjects` entry (case-insensitive membership).
3. One item per `preferredSubjects` entry, flagged `optional: true`.
4. Extracurriculars documented — met when the field is non-empty.
5. Language proficiency — **only added for international profiles** (see
   `docs/features/onboarding.md`).

`checklistPassCount` and `checklistTotal` both **exclude optional items**, so preferred subjects
can never make the ratio look worse. In the report, `met` renders as a check, optional-unmet as a
dot, required-unmet as a cross.

## Extending the requirements table

`UNIVERSITIES[code] = {name, majors: {[majorName]: requirements}}` and each requirements object
has `minGpa`, `competitiveness`, `requiredSubjects[]`, `preferredSubjects[]`,
`requiredQualifications[]`, `essentialExtracurriculars[]`, `notes`. Add a university or major by
editing that file directly — the options endpoint, both dropdowns, and the checklist all derive
from it with no other changes.

The figures are **simplified hackathon-demo values, not official cutoffs** (the file says so at
the top). Keep that framing if you extend it.

## Invariants

- The checklist is computed in JS, never by the model. The model gets it as input and must not
  recompute or contradict it.
- An unknown university code or major throws, surfacing as a 400 — don't silently default.
- Country is fixed to Singapore in the UI (a disabled input); the MVP scope is Singapore only.
- The Language proficiency input and its checklist item appear together, both driven by the same
  international check.
