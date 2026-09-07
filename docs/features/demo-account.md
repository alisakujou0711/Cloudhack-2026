# Demo account

**What it does** — Seeds one ordinary account, `demo@portify.app` / `portify-demo`, on
boot against a database that doesn't have it. It arrives with a complete profile and five
finished runs in History, so someone evaluating the app sees a used product instead of an empty
state they have to fill in first.

## Files

| Path | Role |
| --- | --- |
| `server/services/demoAccount.js` | `DEMO_EMAIL`, `DEMO_PASSWORD`, `seedDemoAccount()` |
| `server/data/demoState.json` | The seeded state document — generated, never hand-edited |
| `server/scripts/generate-demo-state.js` | Regenerates that fixture by running `samples/` through the real services |
| `server/index.js` | Calls `seedDemoAccount()` on boot and prints the credentials |
| `README.md` | The other place the credentials are published |
| `server/test/demo-account.test.js` | Sign-in, snapshot completeness, re-seed and clear behaviour |

## Flow

1. `index.js` calls `seedDemoAccount()` inside the `listen` callback, after the LLM-provider line.
2. It looks the account up by email and returns `{seeded: false}` if it is there.
3. Otherwise it goes through `auth.signUp` — same hashing, same empty state row — then revokes the
   session sign-up mints, since nobody holds it.
4. It reads the fixture, dates the history entries, and `replaceState`s it onto the new account.
5. The credentials are logged. Signing in with them is an ordinary `POST /auth/login`.

## Contract

`seedDemoAccount() -> { seeded: boolean, email, password }`. The fixture is a whole state document
in the shape of `defaultState()` (`docs/architecture.md`), with `history` entries carrying every
key `addHistoryEntry` adds except `timestamp`.

## Invariants

- **Seeding keys on the account existing, not on what it holds.** A restart mid-demo never writes
  over edits someone is showing, and a demo account put through "Clear my data" stays cleared —
  deliberately, since silently restoring it mid-demo is the worse surprise. Deleting
  `server/data/portify.db` is what brings the fixtures back. See `docs/features/history.md`.
- **No demo affordance on the sign-in screen.** Discoverability is the README and the startup log,
  so the screen reads as a real product's rather than a demo harness. Don't add a button.
- **Seeding lives in `index.js`, not `app.js`.** The test harness boots the exported app, so
  putting it in `app.js` would give every test suite a demo account it didn't ask for.
- **A failed seed must not stop the server booting.** `index.js` catches and logs; everything else
  works without the demo account.
- **Every snapshot is a whole, real API result.** History entries re-render through the report
  components, which read fields the collapsed row never shows — a trimmed snapshot expands into an
  empty panel. This is why the fixture is recorded rather than written.
- **`timestamp` is absent from the fixture and added at seed time**, entry index × 2 days back from
  the boot that writes it, so a committed fixture never opens on months-old runs. The array is
  newest-first, as `addHistoryEntry` prepends.

## The fixture

`node scripts/generate-demo-state.js` (from `server/`) runs five samples through the real services
once and freezes the results:

| Sample | Service | History type |
| --- | --- | --- |
| `university/strong_nus_cs_candidate.txt` | `universityProfileParser` + `universityAssessment` | `university` |
| `internship/strong_swe_intern_resume.txt` | `internshipAssessment` | `internship` |
| `essay/essay_strong.txt` | `essayOptimization` | `essay` |
| `cover-letter/cover_letter_standard.txt` | `coverLetterOptimization` | `coverLetter` |
| (the cover letter's company/role) | `interviewPrep` | `interview` |

It also asks `chatbot` one opening question with the context `buildContext()` would send, so the
seeded conversation is a real answer about this account rather than a hand-written line. Together
that covers all four report renderers `HistoryPage` uses. The profile's location is outside
Singapore on purpose, so every report carries its `internationalNote` — see
`docs/features/onboarding.md`.

The committed fixture was generated **with a key**, so its snapshots carry `source: 'gemini'` and
render without a demo-mode notice even on a keyless clone. That is correct rather than a Hard rule
2 problem: `source` records the run that produced the result, and these results really were live
model output. A keyless clone's own assessments still come back `'mock'` and still say so. Rerun
and commit the JSON when a sample or a result shape changes.
