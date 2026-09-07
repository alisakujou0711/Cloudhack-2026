# Accounts & persistence

**What it does** — Everything a student produces belongs to an Account rather than to a browser.
Email-and-password sign-in against a SQLite file the server creates on first boot, an opaque
session cookie, and one state document per Account read and written over `/api/state`.

## Files

| Path | Role |
| --- | --- |
| `server/db.js` | Opens the SQLite file and applies the three-table schema on import |
| `server/services/auth.js` | Hashing, sign-up / sign-in / sign-out, session tokens, `getSessionUser`, `changeEmail`, `changePassword`, `deleteAccount` |
| `server/services/userState.js` | Read, replace, and clear the one document an Account holds |
| `server/middleware/auth.js` | The `pp_session` cookie helpers and the `requireAuth` guard |
| `server/routes/api.js` | The auth and state endpoints, and the `router.use(requireAuth)` line |
| `client/src/context/AuthContext.jsx` | The session — deliberately separate from `AppContext` |
| `client/src/context/AppContext.jsx` | Loads the document once per Account, writes it back debounced |
| `client/src/pages/SignInPage.jsx` · `SignUpPage.jsx` | The two screens over one `AuthForm` |
| `client/src/components/AuthForm.jsx` · `AuthShowcase.jsx` | The shared form shell, and the marked-up-draft panel beside it |
| `client/src/App.jsx` | `gateRedirect` (`:16`) — session, then profile |
| `client/src/api/client.js` | `credentials: 'include'` on all three transports; central 401 (`:18`) |
| `server/test/` | Auth, state, gated endpoints, expiry and reboot, over real HTTP |

## Flow

1. `POST /auth/signup` or `/auth/login`: the route checks both fields, `auth.js` hashes or verifies
   (bcryptjs, cost 10), inserts a session row, and `setSessionCookie` returns the token. Sign-up
   also creates the empty state row, so a first read answers `{}` (`services/auth.js:61`).
2. `AuthProvider` resolves `/auth/me` once on mount. Until it answers, `status` is `'resolving'`
   and `AppRoutes` renders a loading screen rather than guessing.
3. Given an `account.id`, `AppProvider` `GET`s `/state` once (`AppContext.jsx:146`), and
   `fromDocument` (`:46`) spreads it over `defaultState()`, migrating a legacy `chatHistory`.
4. Every mutation goes through `mutate()`: React state moves immediately and one `PUT /state` of
   the whole document follows 800ms later (`:7`). Nothing in the UI reports the write, bar the
   settings page's "Saved" acknowledgement — see `docs/architecture.md`.
5. `gateRedirect` sends no session to `/signin`, a session without a profile to `/onboarding`, and
   both to `/app`. See `docs/architecture.md`.
6. Sign-out deletes the session row and clears the cookie; a 401 from any other endpoint clears
   the auth context centrally, so the same gate carries the person back to sign-in.
7. "Clear my data" `DELETE`s the document and leaves the Account, from the settings page's Account
   actions card. Losing `profile` with the document is what routes the student back to onboarding.
8. `PATCH /account/email` changes the address the Account signs in with, after `verifyPassword`
   checks the current one (`services/auth.js:103`). Sessions key on the Account id, so the Session
   survives; `changeEmail` in `AuthContext` replaces the held Account from the response
   (`AuthContext.jsx:64`).
9. `PATCH /account/password` verifies the current password the same way, then rehashes and deletes
   every Session row on the Account except the one making the request
   (`services/auth.js:changePassword`). Nothing the client holds changes, so the settings page
   calls `api.changePassword` directly rather than through `AuthContext`.
10. `DELETE /account` verifies the password the same way and then deletes the `users` row. The
    cascade takes the sessions and the state document with it, so nothing is enumerated by hand.
    `deleteAccount` in `AuthContext` clears the held Account, and the routing gate carries the
    person to sign-in, where a one-off in-memory `notice` says what happened. The settings page
    settles the queued write first — see the invariant below.

The client-side rules these steps lean on — the two gates, why auth and app state are separate
contexts, and how a queued write stays scoped to its Account — are stated once in
`docs/architecture.md`.

## Contract

`users(id, email, password_hash, created_at)` · `sessions(token, user_id, expires_at)` ·
`user_state(user_id, state, updated_at)`; the state document travels over `/state` as itself, in
the shape of `defaultState()`, never wrapped in an envelope. Request shapes: `docs/api.md`.

## Invariants

- **The state document is one opaque unit, mirroring the shape the client holds.** History
  entries carry whole snapshots the report components re-render from, so normalising them means
  modelling four assessment shapes for no gain today.
  See `docs/adr/0001-state-document-stays-one-opaque-unit.md`.
- **The server is the sole source of truth; no browser-storage write may return** — not even as a
  cache. A cached document is stale the moment a different Account signs in on that browser, which
  is the bug Accounts exist to fix. See `docs/adr/0002-server-is-sole-source-of-truth.md`.
- **Sign-in must not reveal whether an email is registered.** A wrong password and an unknown email
  share one 401 and one message (`server/services/auth.js:15`); sign-up necessarily reveals it, so
  splitting sign-in's cases turns the form into an account-enumeration oracle.
- **Changing the password revokes every other Session and keeps the current one.** The student
  changes it because someone may have watched them type it; leaving that Session alive would not
  do the thing they came to do, and revoking all of them would eject the owner as well.
- **Seeding is keyed on the demo Account existing, not on what it holds**, so a restart never
  overwrites a demo in progress. See `docs/features/demo-account.md`.
- **Deletion is immediate, irreversible, and leans entirely on the schema's cascade.** There is no
  soft delete and no emailed confirmation, for the reasons in
  `docs/adr/0004-account-deletion-is-immediate.md`; a new table referencing an Account must declare
  `ON DELETE CASCADE` or deletion silently stops being complete.
- **A destructive call settles the debounced write before it fires.** `settlePendingWrites()` in
  `AppContext` cancels a queued write and *awaits* one already on the wire — an in-flight `PUT`
  cannot be recalled, and landing after the destructive call it would restore the document, or
  reach a deleted row and trip the central session-expired handling mid-flow. Both "Clear my data"
  and "Delete account" go through it. See `docs/architecture.md`.
- **`DATABASE_PATH` exists so tests can redirect the file, and for nothing else.** It stays
  optional, like `SESSION_TTL_MS` and `CLIENT_ORIGIN`: clone-and-run means no new *required*
  environment variables, and it is the only testability hook the feature has.

## Extending it

A new state key needs no server change — the document is stored opaquely, so add it to
`defaultState()`, mutate through `mutate()`, and register it in `buildContext()`
(`docs/features/chatbot.md`). A new endpoint goes below the guard (`docs/api.md`). A schema change
is another create-if-not-exists in the `db.exec` block at `db.js:17`; there is no migration tool —
and a new table referencing `users` needs `ON DELETE CASCADE`, or account deletion stops taking it.
Password reset, rate limiting, and concurrent-session merging are deliberately absent — writes are
last-write-wins, and there is no mail transport to build a reset on, which is also why a deleted
account is gone rather than recoverable.
