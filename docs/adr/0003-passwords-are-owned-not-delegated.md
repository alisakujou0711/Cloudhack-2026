# Passwords are owned, not delegated to an auth provider

An Account authenticates with an email address and a password hashed with bcrypt in our own store,
and a Session is an opaque, revocable token. We did not delegate to a hosted auth provider or to
OAuth.

## Considered options

Supabase Auth, Clerk, Auth0, and Google sign-in were all considered and rejected for the same
reason: each makes the app depend on a network service and on an application registered somewhere
outside this repository. That breaks the property the project leads with — it runs fully offline,
with no keys and no configuration, from a fresh clone. Every LLM call already has a deterministic
stand-in so that the app works without a provider; authentication should not become the one thing
that cannot run on a plane.

An opaque session token was chosen over a JWT for a smaller reason worth recording: it is revocable
on sign-out, and it needs no signing secret, so the environment file stays entirely optional.

## Consequences

We own the security floor: hashing cost, session expiry, and the rule that sign-in must never reveal
whether an email address is registered. No password reset exists, because no mail transport does —
a forgotten password means a new Account.
