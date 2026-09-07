# 01 — Header avatar and account menu

**What to build:** The header's top-right corner stops being a name in plain text next to a Sign out
button and becomes a single circular avatar, the way every product a student already uses presents
their account.

There is no picture and no way to add one. The avatar shows the initials taken from the Profile name
— first letters of the first two words — over a background colour derived deterministically from
that same name, so it is stable across reloads and visibly different between Accounts.

Clicking it opens a small menu below it, carrying the Profile name, the email address the Account
signs in with, and Sign out. Sign out must stay one click away: it is the control people press on a
shared machine, and moving it behind a page would be a regression. An "Account settings" entry joins
this menu in ticket 02, once there is somewhere for it to go.

The menu closes on an outside click and on Escape, so it can never trap someone.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The header shows a circular avatar instead of the Profile name and the Sign out button.
- [ ] The avatar shows initials derived from the Profile name.
- [ ] The avatar's background colour is derived from the Profile name and is the same on every load.
- [ ] Two Accounts with different Profile names show different initials and different colours.
- [ ] Clicking the avatar opens a menu showing the Profile name, the Account's email address, and
      Sign out.
- [ ] Sign out from the menu ends the Session and returns to sign-in, exactly as the header button
      did.
- [ ] Clicking outside the menu closes it.
- [ ] Pressing Escape closes it.
- [ ] The four existing tabs are unchanged.
- [ ] Styling reuses the existing stylesheet's tokens and semantic class naming.
