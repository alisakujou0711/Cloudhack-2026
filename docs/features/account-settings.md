# Account settings

**What it does** — One page at `/app/settings`, reached from the header avatar, where a student
edits the three Profile fields, changes the email and password they sign in with, and does the
things done *to* an account: download a copy, sign out, clear the state document, delete the
account.

## Files

| Path | Role |
| --- | --- |
| `client/src/pages/AccountSettingsPage.jsx` | The whole page — three cards, one component per row |
| `client/src/components/AccountMenu.jsx` | The header avatar (`:13` initials, `:26` colour) and the menu holding "Account settings" and "Sign out" |
| `client/src/context/AuthContext.jsx` | `changeEmail` (`:75`), `deleteAccount` (`:85`), and the one-off `notice` sign-in reads afterwards |
| `client/src/context/AppContext.jsx` | `setProfile`, `exportDocument` (`:212`), `clearData` (`:219`), `settlePendingWrites` (`:200`) |
| `server/routes/api.js` | `PATCH /account/email` (`:92`), `PATCH /account/password` (`:106`), `DELETE /account` (`:129`) |
| `server/services/auth.js` | `changeEmail` (`:111`), `changePassword` (`:133`), `deleteAccount` (`:153`) |
| `server/test/auth.test.js` | The three endpoints over real HTTP, including revocation and cascade |

## Flow

1. The avatar in `Layout`'s header opens `AccountMenu`; "Account settings" routes to
   `/app/settings`, which is deliberately absent from the tab nav (`docs/architecture.md`).
2. **Profile card** — the three fields are local state seeded from `profile`, compared trimmed to
   decide whether Save is live. Save calls `setProfile`, so the write is the ordinary debounced
   `PUT /state`; the "Saved" line acknowledges the press, not the write.
3. **Account and security** — each row expands into its own form. Email goes through
   `AuthContext.changeEmail`, which replaces the held account from the response; password calls
   `api.changePassword` directly, because nothing the client holds changes.
4. **Account actions** — Contact support (inert), Download my data (a blob built from
   `exportDocument()`, no endpoint), Sign out, then a rule, below which everything is destructive:
   Clear my data and Delete account.
5. Both destructive rows confirm inline; deletion also asks for the account password. Neither
   tidies up afterwards — losing `profile` routes to onboarding, losing the account routes to
   sign-in, both through the gate in `docs/architecture.md`.

## Contract

The Profile is three state-document keys and needs no server change; the email and password are the
Account row. Endpoint shapes, and why a wrong current password is a `400` rather than a `401`, are
in `docs/api.md`.

## Invariants

- **The card structure follows the Account / Profile seam.** Profile is state-document keys the
  server stores opaquely; email and password are the Account itself, each needing an endpoint. A
  new setting belongs in whichever card matches where it actually lives, not where it reads best.
- **Every credential change requires the current password.** A session proves the browser and
  nothing more; see `docs/features/accounts-and-persistence.md`.
- **Deletion reuses the cancel-and-await sequence.** It calls `settlePendingWrites()` before
  `deleteAccount` and re-queues the dropped write if the password is refused — a debounced `PUT`
  landing on a deleted row trips the central session-expired handling mid-flow. "Clear my data"
  settles the same way, inside `clearData`.
- **Saving the Profile goes through `setProfile`, not a second persistence path.** The button
  expresses intent; the debounce still owns the write, and a failed one is console-only as
  everywhere else.
- **All three Profile fields stay required**, as at onboarding — a half-erased profile is worse
  than a stale one, and every assessment service reads it (`docs/features/onboarding.md`).
- **Contact support is inert on purpose.** Its tooltip is what keeps a button that does nothing
  legible as planned rather than broken; don't wire it to a form that goes nowhere.

## Extending it

A new row is a component plus a `.settings-row` in the right card. If it touches the state
document, mutate through `AppContext` and add nothing server-side; if it touches the Account, add
an endpoint below the `requireAuth` gate (`docs/api.md`) and a matching `api` method. Anything
destructive belongs under the rule in Account actions and must settle pending writes first.
Password reset stays absent — there is no mail transport (`docs/features/accounts-and-persistence.md`).
