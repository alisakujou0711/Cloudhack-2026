# PortfolioPath

PortfolioPath helps students improve the documents they submit when applying — to universities, to
internships, and to anything that needs an essay or a cover letter. This glossary fixes the words
this project uses for that domain, so that code, docs and conversation stay in one language.

## Language

### Identity and persistence

**Account**:
The credential-bearing identity a student signs in as. Everything a student produces belongs to
exactly one Account.
_Avoid_: user, user record, login, "this browser"

**Session**:
A signed-in period of access to an Account, ended by signing out or by expiry.
_Avoid_: token, cookie, auth

**Profile**:
The facts a student states about themselves — their name, education level, and where they are
applying from. Something an Account holds, not part of its identity.
_Avoid_: account details, user info, personal details

**State document**:
Everything one Account has produced, held and saved as a single unit rather than as separate
pieces.
_Avoid_: app state, the blob, saved state

### The work

**Optimization type**:
One of the four things a student can improve: University Application, Internship Application,
Essay, or Cover Letter.
_Avoid_: flow, mode, category, feature

**Optimization run**:
One complete pass of a student's document through one Optimization type, producing an Assessment.
_Avoid_: submission, job, analysis

**Assessment**:
The structured, itemized result of an Optimization run — an overall impression, strengths, gaps,
and per-item detail. Always qualitative, never a score.
_Avoid_: report, review, feedback, results, grade, score

**Interview plan**:
The preparation material produced for a specific upcoming interview.
_Avoid_: interview report, prep pack

**Snapshot**:
The complete Assessment kept alongside a History entry, so a past Optimization run can be reopened
exactly as it was.
_Avoid_: summary, copy, archive

**History entry**:
One record of something a student did — a completed Optimization run, a saved Interview plan, or a
bookmarked Inspiration.
_Avoid_: log line, activity, event

**Bookmark**:
A student's mark on a History entry, keeping it to hand.
_Avoid_: favourite, star, pin

### Generated content

**Source**:
The provenance of any generated result: a live model, the built-in stand-in because no provider is
configured, or that stand-in because a live call failed. Always stated to the student, and the two
stand-in cases are always distinguished.
_Avoid_: mode, fallback flag, isMock

**International note**:
The extra guidance attached to an Assessment when the student's Profile places them outside
Singapore.
_Avoid_: overseas note, foreign applicant note

**Inspiration**:
A sample essay or resume offered as a reference example. Always original or reference-only, never
third-party text.
_Avoid_: example, template, sample
