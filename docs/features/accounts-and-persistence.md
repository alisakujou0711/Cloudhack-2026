# Accounts & persistence

**What it does** — Everything a student produces belongs to an Account rather than to a browser.
Email-and-password sign-in against a SQLite file the server creates on first boot, an opaque
session cookie, and one state document per Account read and written over `/api/state`.

## Files

| Path | Role |
| --- | --- |
| `server/db.js` | Opens the SQLite file and applies the three-table schema on import |
| `server/services/auth.js` | Hashing, sign-up / sign-in / sign-out, session tokens, `getSessionUser` |
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
   the whole document follows 800ms later (`:7`). The header renders `saveStatus`, unless the
   mutation passed `{quiet: true}` — see `docs/architecture.md`.
5. `gateRedirect` sends no session to `/signin`, a session without a profile to `/onboarding`, and
   both to `/app`. See `docs/architecture.md`.
6. Sign-out deletes the session row and clears the cookie; a 401 from any other endpoint clears
   the auth context centrally, so the same gate carries the person back to sign-in.
7. "Clear my data" `DELETE`s the document and leaves the Account. See `docs/features/history.md`.

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
- **Seeding is keyed on the demo Account existing, not on what it holds**, so a restart never
  overwrites a demo in progress. See `docs/features/demo-account.md`.
- **`DATABASE_PATH` exists so tests can redirect the file, and for nothing else.** It stays
  optional, like `SESSION_TTL_MS` and `CLIENT_ORIGIN`: clone-and-run means no new *required*
  environment variables, and it is the only testability hook the feature has.

## Extending it

A new state key needs no server change — the document is stored opaquely, so add it to
`defaultState()`, mutate through `mutate()`, and register it in `buildContext()`
(`docs/features/chatbot.md`). A new endpoint goes below the guard (`docs/api.md`). A schema change
is another create-if-not-exists in the `db.exec` block at `db.js:17`; there is no migration tool.
Password reset, account deletion, rate limiting, and concurrent-session merging are all
deliberately absent — writes are last-write-wins, and there is no mail transport to build a reset
on.
