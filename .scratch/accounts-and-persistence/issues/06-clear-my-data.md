# 06 — Clear my data

**What to build:** A student who has made a mess of a trial run can wipe their own data and start
fresh without losing their account. The action lives on the History page, near the existing "Your
Documents" card, and asks for confirmation before doing anything. Afterwards they are still signed
in, with an empty profile, empty history, and empty drafts — exactly as a newly created account
looks.

This restores the destructive half of the old "Start over" control, which ticket 03 removed from the
header when it became **Sign out**. It is deliberately not in the header any more: sign-out is the
action people reach for constantly, and pairing it with an irreversible wipe invites the wrong
click.

Resetting the state document to defaults will leave the person without a profile, so the routing
gate should carry them back to onboarding on its own. Account deletion is explicitly not part of
this — it is the one irreversible path in the design and nothing depends on it.

**Blocked by:** 04 — Move persisted state to the server.

**Status:** ready-for-agent

- [x] A clear-my-data action is available on the History page and requires an explicit confirmation.
- [x] Cancelling the confirmation changes nothing.
- [x] Confirming resets the state document to defaults on the server, not only in the browser.
- [x] The account survives — the person remains signed in and can keep using the app.
- [x] After clearing, the person is routed to onboarding rather than into an app with no profile.
- [x] Signing out and back in after clearing shows the empty account, confirming the reset was
      persisted.
- [x] The header still offers only Sign out; no destructive action returns to it.
