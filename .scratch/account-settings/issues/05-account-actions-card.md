# 05 — Account actions card, and Clear my data moves in

**What to build:** The third card on the settings page — the things a student does to their Account
rather than to their work — and the relocation of "Clear my data" into it.

Four rows, each a title and a short line of explanation on the left with its control on the right:

- **Contact support** — a deliberate placeholder. The button looks live but does nothing when
  pressed, and carries a tooltip marking it as planned. This is proof-of-concept surface, described
  as future work; the tooltip is what keeps it legible as planned rather than broken.
- **Download my data** — real, and needs no endpoint. The State document the client already holds is
  serialised to a readable file the student can keep outside the product, named after the app so they
  can find it again. This reuses the pattern the resume export already established.
- **Sign out** — the same action the avatar menu offers, in the place someone might also look for it.
- **Clear my data** — moved here from the History page, which loses it. Its behaviour does not change
  at all: the same two-step inline confirmation, no password, the State document reset on the server,
  the Account and the Session surviving, and losing the Profile is what carries the student back to
  onboarding through the routing gate.

The move is the point. Clear my data was originally put on the History page only to keep it away from
the header, where it sat beside Sign out and invited the wrong click. Settings is where it belongs now
that settings exists, and leaving two destructive controls with near-identical confirmations on
different pages would be worse than either placement alone.

Ticket 06 adds Delete account beneath these, so leave room for a visual separation between the
ordinary rows and the destructive ones.

**Blocked by:** 02 — Settings route and the editable Profile card.

**Status:** ready-for-agent

- [ ] The Account actions card renders four rows, each with a title, an explanatory line, and a
      control.
- [ ] Contact support does nothing when pressed and carries a tooltip marking it as planned.
- [ ] Download my data produces a readable file containing the Account's whole State document.
- [ ] Sign out from this card ends the Session and returns to sign-in.
- [ ] Clear my data requires an explicit confirmation; cancelling changes nothing.
- [ ] Confirming resets the State document on the server, not only in the browser.
- [ ] After clearing, the student is still signed in and is routed to onboarding.
- [ ] Signing out and back in after clearing shows the empty Account, confirming it persisted.
- [ ] Clear my data no longer appears anywhere on the History page.
- [ ] Clear my data is visually separated from the ordinary rows above it.
