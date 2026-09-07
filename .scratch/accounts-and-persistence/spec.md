# Spec: User accounts and server-side persistence

Status: ready-for-agent

## Problem Statement

PortfolioPath has no accounts and no database. "Your account" means one browser's `localStorage`
key, and everything the student produces — their profile, every completed optimization run, their
bookmarks, their chat history, their in-progress drafts — lives in a single JSON blob in that
browser.

From the student's perspective this fails in three ways:

- **It doesn't look real.** There is no way to sign in, no sense that the work belongs to a
  person. Anyone opening the app is dropped straight into onboarding as an anonymous browser.
- **The work is fragile.** Clearing site data, using a private window, or switching browsers loses
  every history entry, every draft, and the entire chat history, with no warning and no recovery.
- **There is no separation between people.** Two students sharing a laptop share one set of data.
  A demo cannot show that one person's portfolio is theirs alone.

From an evaluator's perspective, the absence of accounts is the most visible gap between the app
and a product.

## Solution

Introduce real user accounts backed by a SQLite database on the server, and move all persisted
application state out of `localStorage` into that database, scoped to the signed-in user.

The student signs up with an email address and a password, completes onboarding once, and from
then on their profile, history, assessments, drafts, and chat all follow their account rather than
their browser. Signing in from another browser on the same machine brings everything back. Signing
out and signing in as someone else shows a completely separate, empty account.

Access is gated: without a session there is no app, and the API rejects unauthenticated requests.
Passwords are hashed with bcrypt and never stored or logged in plain text; sessions are opaque
tokens held in an httpOnly cookie and are revoked on sign-out.

A seeded demo account with a populated profile and history ships with the database, so the app can
be demonstrated with realistic content immediately rather than from an empty state.

The database is a local file created automatically on first boot. There is nothing to install,
configure, or start beyond the two commands the project already documents.

## User Stories

### Signing up and signing in

1. As a first-time visitor, I want to be shown a sign-in screen when I open the app, so that it is
   immediately clear my work will be saved to an account rather than to this browser.
2. As a first-time visitor, I want to create an account with an email address and a password, so
   that I can start using the app without any third-party sign-in.
3. As a first-time visitor, I want to be told clearly when my password is too short, so that I can
   fix it without guessing the rule.
4. As a first-time visitor, I want to be told when an email address is already registered, so that
   I know to sign in instead of signing up.
5. As a newly registered student, I want to be taken to onboarding right after signing up, so that
   I can set up my profile and start working without an extra navigation step.
6. As a returning student, I want to sign in with my email and password, so that I get my own data
   back.
7. As a returning student, I want a wrong password and an unregistered email to produce the same
   generic message, so that nobody can use the sign-in form to discover who has an account.
8. As a returning student, I want to remain signed in after closing and reopening my browser, so
   that I am not re-authenticating constantly during a busy application period.
9. As a returning student who has already completed onboarding, I want to land directly in the app
   after signing in, so that I never re-enter my profile.
10. As a visitor on the sign-in screen, I want an obvious link to the sign-up screen and back
    again, so that I can correct a wrong turn.
11. As a signed-in student, I want a sign-out control in the header, so that I can end my session
    on a shared machine.
12. As a signed-out student, I want typing an in-app URL directly to send me back to sign-in, so
    that signing out actually protects my data.
13. As a student whose session has expired, I want to be returned to the sign-in screen, so that I
    understand I need to sign in again rather than thinking the app is broken.

### Owning my data

14. As a student, I want my history to survive clearing my browser's site data, so that routine
    browser maintenance does not destroy weeks of application work.
15. As a student, I want to sign in from a different browser on my machine and find my history
    waiting, so that I am not tied to one browser profile.
16. As a student, I want my in-progress essay questions and answers to persist, so that I can
    close the app mid-draft and pick it up later.
17. As a student, I want my uploaded resume text and target role to persist, so that I do not
    re-upload the same document on every visit.
18. As a student, I want my chatbot conversation to persist across sessions, so that the assistant
    retains the context we already built up.
19. As a student, I want my profile — name, education level, location — to persist, so that
    international-applicant guidance keeps applying without re-entry.
20. As a student, I want my bookmarked inspirations to persist, so that the examples I chose stay
    collected.
21. As a student, I want my university portfolio fields and checklist state to persist, so that a
    partly-completed application is never lost.
22. As a student, I want a visible indication that my work has been saved, so that I can trust the
    app without pressing a save button.
23. As a student, I want another account on the same machine to see none of my data, so that
    sharing a laptop is safe.
24. As a student, I want to clear my own data and start fresh without deleting my account, so that
    I can reset a messy experiment and keep signing in.
25. As a student, I want clearing my data to require a confirmation, so that I cannot destroy my
    history with a stray click.

### Demonstrating the product

26. As an evaluator, I want to create an account in under a minute with no email verification, so
    that trying the product is not gated on anything outside the app.
27. As an evaluator, I want a demo account that already contains a profile and several completed
    optimization runs, so that I can see what a real, used account looks like without producing
    the content myself.
28. As an evaluator, I want the demo account's credentials printed in the README and in the
    server's startup output, so that I can find them wherever I happen to be looking.
29. As an evaluator, I want to sign in to the demo account through the ordinary sign-in form, so
    that the sign-in screen looks like a real product's rather than a demo harness.
30. As an evaluator, I want to open a demo history entry and see the full report re-rendered, so
    that the seeded data proves the feature rather than merely populating a list.
31. As an evaluator, I want to register a second account and find it empty, so that I can confirm
    data is genuinely per-user.
32. As an evaluator, I want API requests without a session to be rejected, so that I can confirm
    the gate is real and not only enforced in the UI.

### Building and maintaining it

33. As a developer, I want the database file to be created and its schema applied automatically on
    first boot, so that cloning and running the project requires no extra setup step.
34. As a developer, I want the demo account seeded only when it is absent, so that restarting the
    server never overwrites data I have been working with.
35. As a developer, I want the database file excluded from version control, so that test accounts
    and password hashes are never committed.
36. As a developer, I want no new required environment variables, so that the project's
    clone-and-run promise is preserved.
37. As a developer, I want the server's test script to run a real suite, so that the auth and
    persistence contract is checked rather than assumed.
38. As a developer, I want tests to run against a throwaway database, so that running them never
    touches my working data.

### Security expectations

39. As a student, I want my password stored only as a hash, so that a leaked database file does
    not expose my password.
40. As a student, I want my session cookie to be unreadable by page scripts, so that a script
    injection cannot lift my session.
41. As a student, I want signing out to invalidate the session on the server, so that a captured
    cookie stops working.

## Implementation Decisions

### Data model

All persisted application state remains a **single JSON document per user**, mirroring the shape
the app already keeps in `localStorage`. All thirteen existing state keys move as one unit:
`profile`, `universityPortfolio`, `internshipPortfolio`, `essayOptimization`,
`coverLetterOptimization`, `interviewPrep`, the four `*Assessment` results, `interviewPlan`,
`chatHistory`, and `history`.

This is deliberate. History entries store a **full snapshot** of the API result that produced them,
because the report components re-render from that snapshot and read fields the summary line does
not carry. Normalising history into relational tables would mean modelling four different report
shapes; the blob keeps that existing invariant intact for free.

Three tables:

| Table | Columns | Notes |
| --- | --- | --- |
| `users` | id (PK), email (unique, case-insensitive), password_hash, created_at | Email is the login identifier |
| `sessions` | token (PK), user_id (FK), expires_at | One row per active session; deleted on sign-out |
| `user_state` | user_id (PK, FK), state (JSON text), updated_at | Exactly one row per user, created empty at sign-up |

The consequence accepted here: the state document is opaque to SQL. Nothing can query inside
history. That is acceptable because no feature does so today, and adding one later is a migration,
not a redesign.

### Database

`better-sqlite3`, one file on disk inside the server package. Its synchronous API means no async
plumbing threads through the route handlers.

The **database path is configurable via an environment variable**, defaulting to the standard
location. This is the single testability hook the design depends on.

Schema creation is **idempotent on boot** — create-if-not-exists per table, run from a database
module imported at startup — not a migration tool. Three tables and one environment do not justify
Knex or Drizzle, and bootstrap-on-boot preserves the clone-and-run promise.

The demo account is **seeded on boot only when its email is absent**, so restarts are safe.

The database file, together with its write-ahead-log and shared-memory sidecars, is added to
version control ignore rules.

### Authentication

Self-owned email and password. No hosted auth provider and no OAuth — both introduce a hard network
dependency and an external account to register, against a project whose stated property is that it
runs offline with no configuration.

- **Hashing:** `bcryptjs` at cost factor 10. The pure-JS implementation is chosen over the native
  `bcrypt` binding deliberately: the design already accepts one native module's install risk with
  `better-sqlite3`, and a second doubles the chance of a failed install on an unprepared machine.
  The performance difference is invisible at this scale.
- **Sessions:** an opaque 32-byte random token stored in the `sessions` table and returned in an
  httpOnly, `sameSite=lax` cookie with a 30-day expiry. Not a JWT: an opaque token is revocable and
  needs no signing secret, which keeps the environment file entirely optional.
- **Password rule:** minimum 8 characters, no composition rules.
- **Failure message:** one generic message covering both an unknown email and a wrong password.
- **Account enumeration:** sign-up necessarily reveals that an email is taken; sign-in must not.

### API contract

Six new endpoints under the existing API prefix:

| Endpoint | Behaviour |
| --- | --- |
| `POST /auth/signup` | Creates user and empty state row, opens a session, sets the cookie |
| `POST /auth/login` | Verifies credentials, opens a session, sets the cookie |
| `POST /auth/logout` | Deletes the session row, clears the cookie |
| `GET /auth/me` | Returns the signed-in user's identity, or 401 |
| `GET /state` | Returns the signed-in user's state document |
| `PUT /state` | Replaces the signed-in user's state document wholesale |

A **`requireAuth` middleware guards every route except the health check**, including all thirteen
existing endpoints. Those endpoints are stateless computation over a request body and touch no user
data, so gating them is a posture decision rather than a data-protection one — but an open API
undercuts the claim that accounts are real.

The routes-validate-and-delegate convention holds: route handlers check required fields and call a
single auth service; all hashing, token generation, and lookup logic lives in the service layer.
`PUT /state` validates only that the body is a JSON object within the existing request size limit.
It does not validate the shape of the thirteen keys — the client is the sole writer, and a shape
check would need updating on every state change.

CORS is configured with credentials enabled and an explicit origin. Through the development proxy
requests are same-origin and cookies flow regardless, but the default permissive configuration
would silently fail on direct access to the API port.

### Server structure

The server entry point splits in two: a module that builds and exports the configured Express
application, and a thin module that starts it listening. The application is currently constructed
and bound in one file, leaving nothing importable. This split is what makes the test seam possible
and is a prerequisite for the testing decisions below.

### Client state ownership

**The server becomes the sole source of truth. The `localStorage` write is removed entirely.**

The current implementation persists the whole state object on every state change, which would
translate to one HTTP request per keystroke in any text field. Instead:

- The app context loads state from the API once, after authentication resolves.
- Mutations update React state immediately and schedule a **debounced full-document write**
  (approximately 800ms) to the state endpoint.
- Writes are last-write-wins with no conflict detection. Concurrent sessions are not supported.
- A save-status indicator in the header reflects pending and settled writes, replacing the
  invisible persistence the app has today.

`localStorage` is not retained as a cache. With a hard sign-in gate, a cached blob is stale the
instant a different user signs in, and reconciling that costs more than a brief load state does.

The existing legacy-chat-history migration in the state loader is preserved and applied to
documents read from the server, so accounts created before this change are not broken by it.

### Client structure and routing

Authentication state lives in a **new context, separate from the application state context**. The
two have different lifecycles — auth resolves first and gates whether application state is fetched
at all — and merging them makes the load order ambiguous.

Routing gains a second gate. Three conditions map to three destinations:

| Condition | Destination |
| --- | --- |
| No session | Sign-in screen |
| Session, no profile | Onboarding |
| Session and profile | The app |

Sign-in, sign-up, and onboarding each become their own route, and the root path becomes a pure
three-way redirect. The onboarding page itself is unchanged — it moves route, keeps its content,
and remains the only place the profile is set.

**Sign-up collects only email and password.** The profile is one of the thirteen state keys, and
folding name, education level, and location into the users table would split the data model across
two stores for no benefit.

### Header and destructive actions

The header's existing "Start over" control — which currently wipes local state and returns to
onboarding — is replaced by **Sign out**. Its data-clearing behaviour moves to the History page as
a **Clear my data** action behind a confirmation, resetting the state document to defaults while
leaving the account intact.

**Account deletion is not built.** It is the one irreversible path in the design, and nothing
depends on it.

### Session expiry handling

A 401 from any endpoint is handled **centrally in the shared API client**: clear the authentication
context and redirect to sign-in. All three transports in that client currently surface non-2xx
responses as inline errors inside whichever panel made the call, which would render an expired
session as a red "Unauthorized" string inside, say, the essay panel. Central handling is one branch
and is the difference between a session expiring and the app appearing broken.

Sessions are not proactively refreshed on activity.

## Testing Decisions

### What a good test looks like here

A good test drives the feature the way a browser would and asserts only on externally observable
behaviour: HTTP status codes, response bodies, cookie behaviour, and what a subsequent request can
see. It must not reach into the database module, call the auth service directly, or assert on hash
formats, token formats, or table contents. Swapping the password hashing library, changing how
sessions are stored, or renaming an internal module should not require touching a test.

The corollary: tests that would only confirm a dependency works — that bcrypt verifies its own
hashes, that SQLite persists a row — are not worth writing.

### The seam

**One seam: the HTTP boundary of the Express application.** The exported application is booted on
an ephemeral port against a throwaway database, and exercised with the runtime's built-in HTTP
client plus a minimal cookie jar, so that real cookie semantics are tested rather than simulated.

This single seam covers authentication, session lifecycle, the authorization middleware, the state
read/write contract, and per-user isolation. No other seam is introduced.

### Runner

The runtime's built-in test runner and assertion library, wired to the server package's currently
unset test script. **No new development dependencies.** Neither package has a test suite today, so
there is no prior art to follow — this establishes it, and it should stay as close to
zero-configuration as the rest of the project.

### Coverage

The suite should establish, at minimum:

- Signing up creates an account and returns a session cookie.
- Signing up with a duplicate email is rejected.
- A password below the minimum length is rejected.
- Signing in with correct credentials returns a session cookie.
- A wrong password and an unknown email produce the same status and message.
- A newly created account's state document is empty rather than absent.
- State written by one request is returned by a later request on the same session.
- State is preserved across sign-out and sign-in.
- A request with no cookie, an unknown cookie, and an expired cookie each receive 401.
- A second account cannot read the first account's state.
- Signing out invalidates the session token for subsequent requests.
- One of the pre-existing feature endpoints is unreachable without a session.

### Not tested

Client-side behaviour is not covered. Testing the debounced synchronisation, the routing gates, or
the save indicator would mean introducing a browser-environment test toolchain to a package that
has none — a larger investment than the feature itself, for logic thin enough to verify by using
the app.

## Out of Scope

- **Password reset and email verification.** No mail transport exists and none is being added.
- **Account deletion.**
- **Rate limiting and brute-force lockout.** The application runs locally; there is no attacker
  path this would close.
- **Multi-device or concurrent-session synchronisation.** Writes are last-write-wins. Two browsers
  signed into one account simultaneously will clobber each other, and that is accepted.
- **Offline operation of the client.** Removing the local cache means the app requires the API to
  load. The server has always been required, so this does not change the deployment story.
- **Migrating existing local data into an account.** Data currently in a browser's storage is
  abandoned. There is no import path; this follows directly from the sign-in gate combined with
  server-owned state.
- **Deployment, hosting, or a remote database.** The target is the existing two-terminal local
  setup.
- **Roles, permissions, sharing, or any multi-user interaction.** Every account is isolated and
  identical in capability.
- **Changing a password while signed in.**
- **Client-side tests.**

## Further Notes

### Seed data is real work

The demo account cannot be a stub. History entries store the complete API result, and the report
components read fields the list row never shows, so a trimmed snapshot renders as an empty
expansion. The seed needs a profile plus several entries whose snapshots are complete enough for
the existing report renderers — the university report, the resume review editor, and the
question-and-answer review — to render fully. The synthetic fixtures already in the repository's
samples directory are the natural source material.

### Documentation this change invalidates

The project's conventions require documentation to be corrected in the same change. This feature
falsifies several existing claims:

- The architecture document asserts, in a dedicated section, that there is no auth, no user
  accounts, no database, no server-side persistence, and no test suite. Four of those five stop
  being true.
- The architecture document's client-state section describes wholesale `localStorage` persistence
  and states that adding persisted state means touching three specific places. Both need rewriting.
- The architecture document's routing section describes a single profile gate.
- The history feature document states that history has no server involvement at all.
- The API document needs six new endpoints and a note that authentication is required.
- The README needs the demo credentials and a description of the sign-in flow.

A new feature document covering accounts and persistence is required, along with its row in the
documentation map, following the existing 50–80 line skeleton.

### Existing conventions this change does not disturb

- The chatbot's context builder needs no new entries. Authentication state is not one of the
  thirteen persisted keys, and the state document's shape is unchanged.
- No new history-eligible type is introduced, so the history page's type labels and snapshot
  renderer are untouched.
- No LLM call is added, so no new prompt, mock, or `source` handling is involved.
- The "runs fully offline with no API key" property is preserved. That claim has always concerned
  LLM provider keys, and the backend was already required.

### Known risk

`better-sqlite3` is a native module. It publishes prebuilt binaries for common platforms and
current runtime versions, so installation normally downloads rather than compiles — but a fallback
to compiling requires platform build tools. If installation fails, the documented fallback is the
runtime's own built-in SQLite module, which needs an experimental flag added to both the start and
the development scripts. This is the only external risk in the design.
