# 03 — Sign-in and sign-up screens with the routing gate

**What to build:** A person can now use accounts from the browser. Opening the app shows a sign-in
screen rather than onboarding. They can create an account, land on onboarding, set up their
profile, use the app, close the browser, reopen it and still be signed in, and sign out when done.

Routing gains a second gate. Three conditions map to three destinations: no session goes to
sign-in; a session without a profile goes to onboarding; a session with a profile goes to the app.
Sign-in, sign-up, and onboarding each become their own route and the root path becomes a pure
three-way redirect. The onboarding page's content is unchanged — it moves route and stays the only
place the profile is set. Typing an in-app URL while signed out lands on sign-in.

Sign-up collects only an email address and a password. The profile stays where it is, as part of
application state.

Authentication state lives in a new context, separate from the application state context. The two
have different lifecycles: auth resolves first and gates whether application state is loaded at
all, and merging them makes that order ambiguous.

The header's "Start over" control is replaced by **Sign out**. Its data-clearing behaviour is not
preserved here — ticket 06 reintroduces it in its new home. Until then there is no way to reset
data from the UI, which is acceptable for one ticket.

A 401 from any endpoint is handled centrally in the shared API client: clear the auth context and
redirect to sign-in. All three transports currently surface non-2xx responses as inline errors
inside whichever panel made the call, so without this an expired session renders as a red
"Unauthorized" string inside a feature panel.

Screens reuse the existing stylesheet's tokens and semantic classes. No new styling system.

**Intermediate state, expected and temporary:** application state is still browser-local at the end
of this ticket, so two accounts used in the same browser will still see each other's data. Ticket
04 closes that.

**Blocked by:** 02 — Sign up, sign in, and sign out over HTTP.

**Status:** ready-for-agent

- [ ] Opening the app with no session shows a sign-in screen.
- [ ] Sign-in and sign-up screens each link to the other.
- [ ] Creating an account moves straight to onboarding; completing onboarding moves into the app.
- [ ] Signing in with a profile already set lands directly in the app, skipping onboarding.
- [ ] The session survives closing and reopening the browser.
- [ ] Navigating directly to an in-app URL while signed out redirects to sign-in.
- [ ] Signing out from the header ends the session and returns to sign-in; in-app URLs are then
      unreachable.
- [ ] Server-side validation failures — short password, duplicate email, bad credentials — are shown
      on the relevant screen rather than swallowed.
- [ ] A 401 from any endpoint returns the person to sign-in rather than printing an error inside a
      feature panel.
- [ ] While authentication is resolving, the app does not flash the sign-in screen at an already
      signed-in person.
- [ ] The architecture doc's routing section describes both gates.
