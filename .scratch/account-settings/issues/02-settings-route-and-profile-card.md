# 02 — Settings route and the editable Profile card

**What to build:** A student can finally correct the three Profile facts they entered at onboarding —
name, education level, location — without destroying everything else they own.

Today the only route to a corrected Profile is clearing the whole State document and walking back
through onboarding, which costs every History entry, Snapshot, draft and chat message. Location is
the worst case, because it silently drives the International note across the product: a student who
moves abroad keeps getting domestic guidance until they wipe their work.

This ticket adds the Account settings page and makes the first of its three cards real. The page sits
under the authenticated layout, so it inherits both routing gates — Session, then Profile — and keeps
the header and the chatbot without any new guard logic. It is deliberately **not** a fifth tab; the
only way in is the "Account settings" entry this ticket adds to the avatar menu.

The page's shape is three cards: **Profile**, **Account and security**, **Account actions**. Only the
first works here; the other two are headings, filled in by tickets 03–06.

The Profile card holds all three fields together with one Save button, disabled until something has
actually changed, so a student can tell at a glance whether they have unsaved edits. All three fields
stay required, matching onboarding — the Profile is what the whole app depends on and must not be
half-erased. Saving goes through the existing Profile setter and therefore the existing debounced
whole-document write; the button expresses intent and is not a second persistence path.

Changing the education level cascades nowhere: it feeds only the suggested Optimization type, which
is a hint and never a guard, so no existing Assessment or History entry is invalidated.

**Blocked by:** 01 — Header avatar and account menu.

**Status:** ready-for-agent

- [x] The avatar menu has an "Account settings" entry that opens the settings page.
- [x] The settings page keeps the header and the chatbot.
- [x] Reaching the settings URL without a Session lands on sign-in; without a Profile, on onboarding.
- [x] Account settings is not added to the tab navigation.
- [x] The page renders three titled cards; the second and third are present but empty.
- [x] The Profile card is pre-filled with the stored name, education level and location.
- [x] The education level offers the same options as onboarding.
- [x] The Save button is disabled until a field differs from what is stored.
- [x] Saving with any field blank shows one inline message and changes nothing.
- [x] Saving shows a brief confirmation.
- [x] Editing the name updates the header avatar's initials immediately.
- [x] Changing the location to somewhere outside Singapore makes International notes appear on a new
      Assessment; changing it back to Singapore stops them.
- [x] Reloading after a save shows the new values, proving they reached the server.
- [x] Existing History entries and Assessments survive a Profile change untouched.
