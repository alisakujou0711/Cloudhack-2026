# Account settings

**What it does** — One page at `/app/settings`, reached from the header avatar, where a student
edits the three Profile fields, changes the email and password they sign in with, and does the
things done *to* an account: download a copy, sign out, clear the state document, delete the
account. The file the app holds on you sits at the top of the page; the three cards under it are
what rewrites it.

## Files

| Path | Role |
| --- | --- |
| `client/src/pages/AccountSettingsPage.jsx` | The whole page — the record (`:84`), three cards (`:119`), one component per row |
| `client/src/utils/avatar.js` | `initialsFrom` / `toneFrom` / `TONE_COUNT` (`:7`), shared by the header avatar and the record's disc |
| `client/src/components/AccountMenu.jsx` | The header avatar and the menu holding "Account settings" and "Sign out" |
| `client/src/context/AuthContext.jsx` | `changeEmail` (`:75`), `deleteAccount` (`:85`), and the one-off `notice` sign-in reads afterwards |
| `client/src/context/AppContext.jsx` | `setProfile`, `exportDocument` (`:212`), `clearData` (`:219`), `settlePendingWrites` (`:200`) |
| `client/src/index.css` | The room: scoped palette and centred column (`:4067`), the eight tone rules (`:4089`), the arrival (`:4118`), the record (`:4135`), the card (`:4253`) and its head (`:4267`) |
| `server/routes/api.js` | `PATCH /account/email` (`:92`), `PATCH /account/password` (`:106`), `DELETE /account` (`:129`) |
| `server/services/auth.js` | `changeEmail` (`:111`), `changePassword` (`:133`), `deleteAccount` (`:153`) |
| `server/test/auth.test.js` | The three endpoints over real HTTP, including revocation and cascade |

## Flow

1. The avatar in `Layout`'s header opens `AccountMenu`; "Account settings" routes to
   `/app/settings`, which is deliberately absent from the tab nav (`docs/architecture.md`).
2. **The record** (`RecordHead`) — the account's disc, name and email beside four read-only facts:
   education level, location, `account.createdAt` as a month, and `history.length`. It sits on the
   page's own ground, not in a card; each fact is changed in a card below and lights when it is.
3. **Profile card** — the three fields are local state seeded from `profile`, compared trimmed to
   decide whether Save is live. Save calls `setProfile`, so the write is the ordinary debounced
   `PUT /state`; the "Saved" line acknowledges the press, not the write.
4. **Account and security** — each row expands into its own form. Email goes through
   `AuthContext.changeEmail`, which replaces the held account from the response; password calls
   `api.changePassword` directly, because nothing the client holds changes.
5. **Account actions** — Contact support (inert), Download my data (a blob built from
   `exportDocument()`, no endpoint, sized on screen from the same serialized string), Sign out,
   then a rule, below which everything is destructive: Clear my data and Delete account.
6. Both destructive rows confirm inline; deletion also asks for the account password. Neither
   tidies up afterwards — losing `profile` routes to onboarding, losing the account routes to
   sign-in, both through the gate in `docs/architecture.md`.

## Contract

The Profile is three state-document keys and needs no server change; email and password are the
Account row. Endpoint shapes, and why a wrong password is a `400` not a `401`, are in `docs/api.md`.

## Invariants

- **The card structure follows the Account / Profile seam.** Profile is state-document keys the
  server stores opaquely; email and password are the Account itself, each needing an endpoint. A
  new setting belongs in whichever card matches where it actually lives, not where it reads best.
- **Only names are ink; every explanation is `--ac-mute`.** A row is its name over one short
  clause; `.settings-row-value.is-data` is the single exception, the email being a fact rather
  than an explanation of one. Anything longer belongs in the confirmation that step opens.
- **A panel's name outranks its rows' by scale and structure, not by colour.** Both are ink, so
  `.settings-card-head h2` is the serif at the record's own size over a rule carried to the card's
  edges; the rules between rows stay inset. Reaching for a tint or a caps eyebrow instead would
  break the line above.
- **The record is read-only, and lights rather than reports.** `useChangeFlash`
  (`AccountSettingsPage.jsx:43`) is false on the first render, so the mark means "just rewritten",
  never "just opened". A control here would make one fact editable in two places.
- **The eight `.settings-tone-*` rules must match `TONE_COUNT`** in `utils/avatar.js`, the pairing
  the header avatar keeps. `--ac-tone` is the account's own colour and the page's one loud thing.
- **Every credential change requires the current password.** A session proves the browser and
  nothing more; see `docs/features/accounts-and-persistence.md`.
- **Deletion reuses the cancel-and-await sequence.** It calls `settlePendingWrites()` before
  `deleteAccount` and re-queues the dropped write if the password is refused — a debounced `PUT`
  landing on a deleted row trips session-expired mid-flow. "Clear my data" settles the same way.
- **Saving the Profile goes through `setProfile`, not a second persistence path.** The button
  expresses intent; the debounce still owns the write, and a failed one is console-only as
  everywhere else.
- **All three Profile fields stay required**, as at onboarding — a half-erased profile is worse
  than a stale one, and every assessment service reads it (`docs/features/onboarding.md`).
- **Contact support is inert on purpose.** Its tooltip is what keeps a button that does nothing
  legible as planned rather than broken; don't wire it to a form that goes nowhere.

## Extending it

A new row is a component plus a `.settings-row` in the right `SettingsSection`. If it touches the
state document, mutate through `AppContext` and add nothing server-side; if it touches the Account,
add an endpoint below the `requireAuth` gate (`docs/api.md`) and a matching `api` method. Anything
destructive belongs under the rule in Account actions and must settle pending writes first.
Password reset stays absent — there is no mail transport (`docs/features/accounts-and-persistence.md`).
