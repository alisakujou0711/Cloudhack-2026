# 07 — Documentation

**What to build:** The docs telling the truth about the app again. This feature falsifies several
things the current set states outright, and the project's own rule is that a doc claim broken by a
change is fixed as part of that change.

A new feature document for Account settings, following the existing 50–80 line skeleton — what it
does, files, flow, contract, invariants, extending it — plus its row in the documentation map in the
repo's agent entry point.

Then the corrections. Each of these is currently false:

- The API reference and the accounts feature document both state that account deletion is
  deliberately not built. It is now built, and all three new endpoints belong in the reference.
- The accounts feature document's closing section lists account deletion and changing a password
  among the things deliberately absent.
- The onboarding feature document says the header shows the Profile name and that Sign out lives
  there — both changed — and describes onboarding as the only place the Profile is set, which stopped
  being true.
- The history feature document describes Clear my data as living on the History page.
- The architecture document's routing section lists the routes under the authenticated layout and
  describes what the header holds.

Two things worth stating in the new feature document because they are the non-obvious parts: that the
page's card structure follows the Account / Profile seam — the Profile is State document keys needing
no server change, the email and password are the Account itself — and that deletion must reuse the
queued-write cancel-and-await sequence.

The new ADR needs no edit; it was written with the spec and already describes what was built.

**Blocked by:** 01, 02, 03, 04, 05, 06 — every ticket whose behaviour the docs describe.

**Status:** ready-for-agent

- [x] A new Account settings feature document exists, following the existing skeleton and within the
      50–80 line budget.
- [x] It has a row in the documentation map in the repo's agent entry point.
- [x] No doc still claims account deletion is not built.
- [x] No doc still claims changing a password is absent.
- [x] The API reference documents all three new endpoints, including that each requires the current
      password and that a password change revokes the Account's other Sessions.
- [x] The onboarding document reflects the new header and no longer claims onboarding is the only
      place the Profile is set.
- [x] The history document no longer places Clear my data on the History page.
- [x] The architecture document's routing and header descriptions match what was built.
- [x] No document restates another at length; each links instead.
