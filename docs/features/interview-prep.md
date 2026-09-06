# Interview Prep

**What it does** — Generates a prep plan for an upcoming university admissions or internship
interview: an overview of the organization, research and technical checklists, timeline-aware
advice, and answerable common questions with sample answers.

## Files

| Path | Role |
| --- | --- |
| `client/src/pages/InterviewsPage.jsx` | Form plus the exported `InterviewPlanView` renderer |
| `server/services/interviewPrep.js` | Prompt, `salaryRangeFor`, `mockPrep` |
| `POST /api/interview/prepare` | See `docs/api.md` |

Lives at `/app/interviews`, its own tab — not part of the Application Optimization shell.
Styles are scoped on `.interviews` / `.prep-plan` the way `.optimize` and `.history` are.

## Flow

1. Pick a type. The form swaps fields accordingly:
   - `university` — university dropdown (`GET /university/options`, by name) + major. Required:
     university.
   - `internship` — company name + role + optional job description. Required: company name.
2. `daysUntil` (optional, a number) applies to both.
3. Submit produces a plan; `InterviewPlanView` renders it.
4. **Saving to History is manual** — a "Save to History" button, not an automatic `onComplete`.
   This is the only feature that works that way; everything else logs on completion.

## Contract

`{targetName, overview, researchTips[], technicalPrep[], timelineAdvice, commonQuestions[],
internationalNote|null, type, source}`

`commonQuestions[] = {question, howToAnswer, sampleAnswer}`.

The prompt **requires** entries for "What is your expected salary?", "What is your greatest
weakness?", and "Do you have any questions for us?", plus 1-2 more tailored to the type.

## Two strict prompt requirements — do not drop these

Both exist because the model reliably under-delivered without them. If you edit the system prompt
in `interviewPrep.js`, keep them:

1. **Salary** — the `sampleAnswer` must contain a real number range in the text (e.g. "SGD
   1,000-1,600 per month"), realistic for the role in Singapore. Saying only "the market rate" is
   explicitly not acceptable.
2. **"Tell me about yourself"** — the `sampleAnswer` must be 5-7 full sentences covering
   background, one concrete project, a team/extracurricular experience, and why this specific
   role. A 2-sentence answer is explicitly not acceptable.

`salaryRangeFor(role)` is a regex table of rough monthly SGD ranges by role family (software,
data, security, finance, engineering, marketing, default). It exists **only** to give the mock a
realistic anchor so the offline demo isn't obviously fake — it is not a source of truth for real
compensation and is not sent to the model.

## Timeline and tone

`timelineAdvice` is driven by `daysUntil`: at 3 days or fewer the mock prioritizes hard (research,
one spoken run-through, sleep — skip everything else); otherwise it spreads the work out. The
prompt tells the model to be concrete about what to cut when time is short.

The prompt also forbids inventing specifics about the organization — descriptions stay general
and hedged, with the student told to verify.

## Invariants

- Validation lives in both places: the client blocks an empty university/company, and the route
  re-checks `type` and the type-specific required field.
- `InterviewPlanView` is exported and reused by `HistoryPage` to render saved plans; it hides the
  save button when no `onSave` prop is passed. Keep that prop optional. It carries its own
  `.prep-plan` scope for the same reason — it renders far from this tab.
- The headline and deck are fixed copy. The `daysUntil` echo is `.iv-days-note` under the field,
  one line whatever it says, going amber at `days <= 3` — the mock's own timeline threshold.
- Sample answers are folded behind a per-question toggle (`RehearsalLine`, local state, first one
  open). The contract is untouched, and the fold applies in History too.
- The arrival cascade animates leaves, never containers, so no fade runs inside another. Steps
  come from `InterviewsPage`; it plays once (`.is-arrived` stops the form, so changing type cannot
  fade one field in alone), and inside `.log-entry-detail` the plan's cascade is off because the
  row it opens from already fades.
- The plan is stored in `AppContext.interviewPlan` and is part of the chatbot's context.
