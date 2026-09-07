# 07 — Seed the demo account

**What to build:** Someone evaluating the app can sign in to a demo account that already looks used
— a completed profile and several finished optimization runs in History — instead of staring at an
empty state and having to produce content before the product shows anything.

The demo account signs in through the ordinary sign-in form with a known email and password. There
is deliberately **no demo button** on the sign-in screen: it should look like a real product's
sign-in, not a demo harness. That makes discoverability the job of this ticket — the credentials go
in the README and in the server's startup log, alongside the existing line about which LLM provider
is configured.

Seeding runs on boot and only when the demo account is absent, so restarting the server never
overwrites data someone has been working with.

**The fixtures are the bulk of the work and cannot be stubbed.** History entries store the complete
API result, and the report components read fields the collapsed list row never shows — a trimmed
snapshot renders as an empty expansion, which demos worse than no seed at all. Each seeded entry
needs a snapshot complete enough for its renderer to display fully. Cover a spread of types so more
than one renderer is exercised. The synthetic documents already in the repository's samples
directory are the natural source material, and running each of them through the real flow once is
the most reliable way to produce a correct snapshot to seed from.

**Blocked by:** 04 — Move persisted state to the server.

**Status:** ready-for-agent

- [x] A fresh database boots with a demo account whose credentials are fixed and documented.
- [x] The demo account signs in through the normal sign-in form, with no special affordance on the
      screen.
- [x] The demo account has a complete profile and goes straight into the app, never to onboarding.
- [x] Its History contains several entries spanning more than one optimization type.
- [x] Expanding any seeded entry renders the full report, not an empty panel.
- [x] Seeding is skipped when the demo account already exists; restarting never overwrites its data.
- [x] The credentials appear in the README and in the server's startup log.
- [x] Clearing the demo account's data and restarting does not silently re-seed it mid-demo, or if
      it does, that behaviour is intentional and documented.
