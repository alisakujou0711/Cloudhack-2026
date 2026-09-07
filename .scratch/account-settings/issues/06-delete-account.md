# 06 — Delete the Account

**What to build:** A student leaving the product can delete their Account outright, so that their
documents and their password are not left sitting on someone's disk. This is the one thing a real
application always lets you do and this one never has.

Deletion is immediate and irreversible by decision, not by omission — see
`docs/adr/0004-account-deletion-is-immediate.md` for why the alternatives (an emailed confirmation, a
soft delete with a grace period) were rejected. Nothing recovers a deleted Account; the student's
recourse is to sign up again on the same address and start empty, which is the same recourse a
forgotten password already leaves them.

Because it cannot be undone, it is guarded twice: a two-step inline confirmation and the Account
password. The password is the stronger check — it proves the person at the keyboard owns the Account,
and the server can actually verify it, where a typed confirmation word is only a client-side speed
bump. It sits at the bottom of the Account actions card, below the separation, in the danger colour.

Server-side, deletion leans entirely on the schema's existing cascade rules: Sessions and the State
document both reference the Account with a cascading delete and foreign key enforcement is already
on, so removing the Account row removes everything it owns in one statement. Nothing is enumerated by
hand — that is what keeps deletion complete when a table is added later.

**The queued write is the hazard.** The client holds a debounced whole-document write for up to 800ms
after any change, and a write still queued or in flight when the Account disappears arrives at a
deleted row and trips the central Session-expired handling in the middle of the flow. The existing
clear-data path already solves exactly this — it cancels the queued write and _awaits_ any write
already on the wire, because an in-flight request cannot be cancelled. Deletion must reuse that
sequence. Editing the Profile and immediately deleting the Account is the path that finds it.

Afterwards the routing gate carries the student to sign-in on its own; a short neutral sentence there
tells them what happened, rather than dropping them on a form with no explanation. It should not
survive a reload.

**Blocked by:** 05 — Account actions card (the card and its destructive section), and 03 — Change the
Account email address (the server-side current-password verification).

**Status:** ready-for-agent

- [x] Delete account sits at the bottom of the Account actions card, visually marked as destructive.
- [x] It requires a two-step confirmation and the Account password.
- [x] The confirmation states plainly that it cannot be undone.
- [x] Cancelling at either step leaves everything exactly as it was.
- [x] A wrong password is refused with an inline message and the Account survives.
- [x] A correct password deletes the Account and clears the Session.
- [x] The student lands on sign-in with a short neutral sentence saying the Account was deleted,
      which does not survive a reload.
- [x] The old email and password no longer sign in.
- [x] Signing up again with the same address succeeds and yields an empty State document.
- [x] Editing the Profile and immediately deleting the Account completes cleanly, with no stray error
      from a queued write.
- [x] The endpoint returns 401 without a Session.
- [x] Deleting the seeded demo Account and restarting the server brings it back.
- [x] The behaviour above is covered by tests over the existing HTTP seam, with the cascade observed
      through what a later request can see rather than by reading tables.
