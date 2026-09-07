# Account deletion is immediate and irreversible

Deleting an Account verifies the Account's password, then removes it and everything it owns in one
statement. There is no confirmation step outside the app, no grace period, and no way back. The
Session ends with the Account, and the person is returned to sign-in.

ADR 0003 established that we own the security floor because there is no mail transport, and drew
one consequence from it: no password reset. Deletion sits on the same missing foundation and is
resolved the other way, so the reasoning is worth recording rather than inferring.

## Considered options

**An emailed confirmation link** is the conventional answer and is unavailable for the same reason
password reset is: adding a mail transport would make the app depend on a network service and on
credentials configured outside this repository, which is the property ADR 0003 exists to protect.

**A soft delete with a grace period** — flag the row, hide the Account, purge later — was rejected
because it does not honestly mean "deleted". It needs a scheduled job the project has nowhere to
run, a rule for what a sign-in attempt against a flagged Account does, and it leaves the password
hash and the whole State document on disk for a person who asked us to destroy them. The weaker
guarantee costs more machinery than the strong one.

**Typing the word DELETE** was considered as the confirmation instead of the password. The password
is strictly stronger: it proves the person at the keyboard owns the Account rather than merely that
they can read, and the server can verify it, whereas a typed word is only ever a client-side speed
bump.

## Consequences

An Account deleted in error is gone. The person's recourse is to sign up again with the same email
address and start from an empty State document — the same recourse ADR 0003 already leaves for a
forgotten password, so the product makes one promise about lost access rather than two.

Because deletion cascades from the `users` row, adding a table that references an Account must
declare its foreign key with the same delete rule, or deletion silently stops being complete.

The seeded demo Account is not special-cased: it can be deleted like any other, and the boot-time
seed — which is keyed on the demo Account's absence — recreates it on the next restart. Deleting
the demo during a demonstration is recoverable, and that is the only case where deletion is.
