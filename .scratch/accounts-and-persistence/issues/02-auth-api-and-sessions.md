# 02 — Sign up, sign in, and sign out over HTTP

**What to build:** A working authentication API, drivable end to end with curl, and the repository's
first test suite.

Someone can register an email address and a password and receive a session; present that session on
a later request and be recognised; and end the session so it stops working. The database backing
this is a SQLite file that creates itself on first boot with no setup step.

Passwords are hashed with bcrypt at cost factor 10 and never stored or logged in plain text.
Sessions are opaque random tokens held in a `sessions` table and returned in an httpOnly,
`sameSite=lax` cookie with a 30-day expiry — not JWTs, so that sign-out genuinely revokes and no
signing secret is required. Sign-up may reveal that an email address is already taken; sign-in must
not, so a wrong password and an unknown email produce the same response.

A `requireAuth` middleware is written here and applied to the new authenticated routes only. Ticket
05 extends it across the existing feature endpoints — doing that now would break the running app,
which has no way to obtain a session yet.

The database file location must be configurable through an environment variable, defaulting to the
standard location, so tests can point at a throwaway file. That variable is the only testability
hook the whole feature needs, and it must remain optional — the project's clone-and-run promise
means no new *required* environment variables.

Tests boot the exported application on an ephemeral port against a temporary database and drive it
over real HTTP with a minimal cookie jar, asserting only on status codes, response bodies, and
cookie behaviour. They must not reach into the database module or call the auth service directly.
Use the runtime's built-in test runner and assertions — no new development dependencies.

**Blocked by:** 01 — Extract the Express app from the server entry point.

**Status:** ready-for-agent

- [x] Signing up with a new email and a valid password creates an account and returns a session
      cookie.
- [x] Signing up with an email that already exists is rejected with a clear message.
- [x] Signing up with a password under 8 characters is rejected with a message naming the rule.
- [x] Signing in with correct credentials returns a session cookie.
- [x] Signing in with a wrong password and signing in with an unregistered email produce an
      identical status and message.
- [x] An identity endpoint returns the signed-in user for a valid session and 401 for a missing,
      unknown, or expired one.
- [x] Signing out deletes the session server-side and clears the cookie; the old token is rejected
      afterwards.
- [x] The session cookie is httpOnly.
- [x] The database file and its write-ahead-log and shared-memory sidecars are git-ignored.
- [x] Schema creation is idempotent — booting repeatedly against an existing database is safe and
      destroys nothing.
- [x] The server package's test script runs the suite and passes; it is no longer a placeholder
      that exits non-zero.
- [x] Tests run against a temporary database and leave no artefact behind.
- [x] No new required environment variables; the app still starts with no configuration at all.
- [x] The API doc gains the authentication endpoints.
- [x] The claims that there is no test suite, in both the root agent guide and the architecture
      doc, are corrected.
