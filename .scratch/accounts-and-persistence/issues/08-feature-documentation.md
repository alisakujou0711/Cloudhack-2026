# 08 — Accounts and persistence feature documentation

**What to build:** The feature doc for accounts and server-side persistence, so the next agent
touching auth, sessions, or state loading has one place to read first.

Corrections to the *existing* docs that this feature falsified belong to the tickets that caused
them and should already be done by the time this starts — the architecture doc's routing and
client-state sections, its no-database and no-persistence claims, the history doc's no-server-
involvement claim, the API doc's endpoints and auth requirement, and the README's demo credentials.
This ticket is the new document plus its row in the docs map, which could not be written before the
feature existed. Verifying those earlier corrections actually landed is part of the job; anything
missed gets fixed here.

Follow the established skeleton exactly so the doc set stays skimmable: what it does in one to three
lines, a files-to-role table, a numbered client-to-service flow, the contract in a line, invariants
as one-line claim-plus-reason entries, and how to extend it. Budget 50–80 lines, no pasted code or
prompt text — name a rule in a clause and cite a file and line.

The invariants worth recording are the ones a future change could silently break: that the state
document is a single blob mirroring the client's shape and must not be normalised while history
snapshots stay whole; that the server is the sole source of truth and no local-storage write may be
reintroduced as a cache; that sign-in must not reveal whether an email is registered; that seeding
is idempotent; and that the database path is configurable solely so tests can redirect it.

**Blocked by:** 04, 05, 06, 07.

**Status:** ready-for-agent

- [x] A feature doc for accounts and persistence exists, following the established skeleton.
- [x] It is within the 50–80 line budget and contains no pasted code or prompt text.
- [x] It has a row in the docs map table with a clear "when you're..." trigger.
- [x] Its invariants section records the non-obvious constraints, each with its reason.
- [x] It links to related docs rather than restating them.
- [x] The doc corrections owed by tickets 02 through 07 are verified as landed, and any that were
      missed are completed here.
