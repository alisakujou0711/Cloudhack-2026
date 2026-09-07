# 03 — Change the Account email address

**What to build:** A student whose school address is about to expire can change the email address
their Account signs in with, instead of losing access to everything they have built.

This is the first half of the **Account and security** card. Unlike the Profile, the email address is
part of the Account itself rather than the State document, so this is the first ticket in the feature
that needs a new endpoint.

Changing it requires the current password. Without that check, anyone who finds an unlocked machine
could take the Account away from its owner permanently — the Session alone is not enough authority to
change the credential that identifies it.

The new endpoint sits below the existing Session guard, so it is closed by default. It normalises the
new address exactly as sign-up does, and lets the unique index be the authority on "already
registered" — the constraint violation is caught and translated, never pre-checked with a select,
which would leave a race. Revealing that an address is taken is fine here: sign-up already does it.
The rule that **sign-in** must not reveal it is untouched.

Sessions key on the Account rather than the address, so the Session survives the change and the
student stays where they were. The client must update its held Account from the response, or the
avatar menu will keep showing the old address while sign-in already requires the new one.

A wrong current password must appear as an inline message beside the control, not as the central
"your Session has ended" handling — that path is for a Session that is genuinely gone.

The test client helper gains a `patch` method; everything else runs over the existing HTTP seam.

**Blocked by:** 02 — Settings route and the editable Profile card.

**Status:** ready-for-agent

- [ ] The Account and security card offers the current email address and a way to change it.
- [ ] Changing it requires the current password.
- [ ] A correct password changes the address and reports success.
- [ ] A wrong password is refused with an inline message and leaves the address unchanged.
- [ ] An address already registered to another Account is refused with a clear message.
- [ ] The new address is matched case-insensitively, as sign-up's is.
- [ ] The Session survives: the student stays signed in and can keep working.
- [ ] The avatar menu shows the new address without a reload.
- [ ] Signing out and back in works with the new address and fails with the old one.
- [ ] The endpoint returns 401 without a Session.
- [ ] The behaviour above is covered by tests over the existing HTTP seam, following the existing
      authentication suite's style.
