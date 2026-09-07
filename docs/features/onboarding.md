# Onboarding & profile

**What it does** — The second of the app's two routing gates: a screen at `/onboarding` that
captures three fields and unlocks the app once a session exists.
The resulting `profile` is passed to every assessment service and drives the international-student
behavior throughout the product.

## Files

| Path | Role |
| --- | --- |
| `client/src/pages/OnboardingPage.jsx` | The form; all three fields required, inline error otherwise |
| `client/src/context/AppContext.jsx` | `EDUCATION_LEVELS`, `suggestedOptimizationType`, `setProfile` |
| `client/src/App.jsx` | Route guard — with a session but no profile, every `/app/*` route redirects to `/onboarding` |
| `client/src/components/Layout.jsx` | Shows `profile.name`; "Sign out" ends the session |

## Flow

1. User fills name / education level / location, then `setProfile({name, educationLevel, location})`.
2. Navigate to `/app/optimize`. From then on `profile` is truthy, so `Layout` renders.
3. Every panel pulls `profile` from `useApp()` and passes it in its API payload.
4. "Sign out" in the header ends the session and returns to `/signin`.

## Shape

`{ name: string, educationLevel: 'jc'|'university'|'graduate', location: string }`

`EDUCATION_LEVELS` maps those values to labels (Junior College / Pre-University, Undergraduate,
Graduate). Location is **free text** — the user types it, there is no country picker.

## The international check

This is the single most load-bearing thing the profile does. Seven modules independently derive
it with the same expression:

    Boolean(profile?.location) && !/singapore/i.test(profile.location)

`universityAssessment.js`, `internshipAssessment.js`, `essayOptimization.js`,
`coverLetterOptimization.js`, `interviewPrep.js`, `chatbot.js`, and `UniversityPanel.jsx`.

When true:

- Assessment services add a non-null `internationalNote` (visa/work-pass, transcript equivalency,
  English proficiency) and every report renders it with a globe prefix.
- `universityAssessment` adds an extra "Language proficiency documented" checklist item.
- `UniversityPanel` reveals the Language proficiency input.
- The chatbot's system prompt gains a paragraph telling it to flag international considerations
  when relevant.

Because it is free text and the regex is a substring match, anything containing "singapore"
counts as domestic and everything else — including "SG" — counts as international.

## suggestedOptimizationType

`educationLevel === 'jc'` suggests `'university'`, otherwise `'internship'`. It is only a
**hint**: `ApplicationOptimizationPage` badges that tile "Suggested for you" and all four types
stay selectable. It is not a route guard and never was.

## Invariants

- Every `/app/*` route requires `profile`; don't add a page that assumes it can be null.
- A new assessment service should accept `profile` as an optional param and follow the
  international convention above — it is the app's most consistent cross-feature behavior.
- Profile fields are persisted like everything else (see `docs/architecture.md`); adding a field
  means updating its consumers, not just the form.
