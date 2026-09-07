# 04 — Change the Account password

**What to build:** A student who thinks someone watched them type can change their password from
inside the app, rather than abandoning the Account to feel safe.

This is the second half of the **Account and security** card, and it is distinct from password
_reset_, which stays impossible and out of scope — there is no mail transport, and a forgotten
password still means a new Account.

The change asks for the current password first, so an unattended Session cannot be used to lock the
owner out, and asks for the new one twice, so a typo does not silently become the password. The same
minimum length as sign-up applies, stated plainly rather than left to be guessed.

The part that makes this worth building: **changing the password revokes every other Session on the
Account** and keeps the one making the change. A password change that leaves the watcher's Session
alive would not actually do the thing the student came here to do. The student stays signed in where
they are, so protecting themselves does not eject them.

**Blocked by:** 03 — Change the Account email address. It creates the card this lives in and the
server-side current-password verification both share.

**Status:** ready-for-agent

- [x] The Account and security card offers a way to change the password.
- [x] The form asks for the current password, and the new one twice.
- [x] A correct current password changes the password and reports success.
- [x] A wrong current password is refused with an inline message and changes nothing.
- [x] A new password below the minimum length is refused with the rule stated.
- [x] The two new-password fields disagreeing is refused before anything is sent.
- [x] After the change, the new password works at sign-in and the old one does not.
- [x] The Session that made the change keeps working without re-authenticating.
- [x] A second Session on the same Account stops working after the change.
- [x] The endpoint returns 401 without a Session.
- [x] The behaviour above is covered by tests over the existing HTTP seam, with the revocation
      asserted by driving two Sessions.
