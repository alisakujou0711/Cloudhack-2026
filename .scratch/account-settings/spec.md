# Spec: Account settings

Status: ready-for-agent

## Problem Statement

Everything a student tells PortfolioPath about themselves is entered once and then frozen.

The three Profile facts — name, education level, location — are captured at onboarding and there is
no screen that shows them again, let alone changes them. A student who typed their name in a hurry,
moved from Junior College to an undergraduate course, or relocated between Singapore and anywhere
else has exactly one route to a corrected Profile: clear their entire State document from the
History page and walk back through onboarding, destroying every History entry, Snapshot, draft and
chat message to fix a spelling mistake. Location is the worst of these, because it silently drives
the International note across seven modules — a student who moves abroad keeps getting domestic
guidance, and the only fix costs them all their work.

The Account's own credentials are worse still: the email address a student signed up with cannot be
changed at all, and neither can their password. A shared or mistyped password stays for the life of
the Account.

There is also nowhere for any of this to live. The header shows the Profile name as flat text beside
a Sign out button, so the app offers no place a student would think to look for their own settings,
and no way to leave the product — the one thing a real application always lets you do.

From an evaluator's perspective the gap reads as a prototype boundary: the app can produce
Assessments but cannot manage the Account producing them.

## Solution

A single Account settings page at its own route, reached from a new circular avatar in the header
that replaces the current name-and-Sign-out pair.

The avatar shows the initials of the Profile name on a colour derived from that name. Clicking it
opens a small menu carrying the Profile name, the Account's email address, a link into settings, and
Sign out — so the control people press every day stays one click away while the destructive ones
move behind a page.

The settings page is three cards, and the split between them follows the split the domain already
makes:

- **Profile** — name, education level and location, edited together and saved with one explicit
  button. These live in the State document and reach the server the same way every other mutation
  does.
- **Account and security** — the email address and the password, each changed individually and each
  requiring the current password to confirm. These live in the Account itself and each needs a new
  endpoint.
- **Account actions** — contacting support, downloading a copy of everything on file, signing out,
  clearing the State document, and deleting the Account outright.

"Clear my data" moves here from the History page: two destructive controls with near-identical
confirmations sitting on different pages is worse than either placement, and its own ticket notes it
was put on History only to keep it away from the header.

Deleting an Account is real, immediate, and irreversible, guarded by the Account password. It ends
the Session, destroys the State document with it, and returns the person to sign-in with a plain
statement of what happened. See `docs/adr/0004-account-deletion-is-immediate.md`.

One control is deliberately inert: **Contact support** exists as a row with a tooltip marking it as
planned, and does nothing when pressed. It is a proof-of-concept placeholder and is described as
future work.

## User Stories

### Finding my Account

1. As a signed-in student, I want a circular avatar in the top-right corner instead of my name in
   plain text, so that the app looks like the products I already use.
2. As a signed-in student with no picture on file, I want the avatar to show my initials, so that the
   space reads as mine rather than as an empty slot.
3. As a signed-in student, I want my avatar's colour to stay the same every time I open the app, so
   that I recognise it without reading it.
4. As a signed-in student, I want clicking my avatar to open a small menu, so that I can see what the
   app knows about me before deciding where to go.
5. As a signed-in student, I want that menu to show my Profile name and the email address I sign in
   with, so that I can confirm which Account I am currently using.
6. As a signed-in student, I want an "Account settings" entry in that menu, so that there is one
   obvious way in.
7. As a signed-in student, I want Sign out to stay one click away in that menu, so that ending my
   Session on a shared machine has not become slower.
8. As a signed-in student, I want the menu to close when I click elsewhere or press Escape, so that
   it never traps me.
9. As a signed-in student, I want the settings page to keep the header and the chatbot, so that I
   have not left the app to visit it.
10. As a signed-out visitor, I want typing the settings URL directly to send me to sign-in, so that
    the page is protected like every other part of the app.
11. As a signed-in student, I want the four existing tabs to stay exactly as they are, so that
    settings does not compete with the work.

### Correcting my Profile

12. As a student, I want to see the name, education level and location I entered at onboarding, so
    that I can check what the app is actually using.
13. As a student who typed their name wrong, I want to correct it, so that the app stops addressing
    me by a typo.
14. As a student whose corrected name changes my initials, I want the avatar to update immediately,
    so that the change is visibly real.
15. As a student who has progressed from Junior College to an undergraduate course, I want to update
    my education level, so that the app's suggestions match where I actually am.
16. As a student who has moved abroad, I want to update my location, so that International notes
    start appearing on my Assessments.
17. As a student who has moved to Singapore, I want to update my location, so that International
    notes stop appearing where they no longer apply.
18. As a student, I want to change all three Profile fields in one edit and save them together, so
    that a move that changes two of them is one action.
19. As a student, I want the Save button to stay disabled until I have actually changed something, so
    that I can tell at a glance whether I have unsaved edits.
20. As a student, I want a brief confirmation after saving, so that I do not press the button twice
    wondering whether it worked.
21. As a student, I want to leave a Profile field blank and be told so, so that I cannot half-erase
    the Profile that the whole app depends on.
22. As a student, I want my existing Assessments and History entries to survive a Profile change, so
    that correcting my name never costs me my work.
23. As a student, I want to reload the page after saving and see my changes still there, so that I
    know they reached the server and not just the screen.

### Changing my email address

24. As a student whose school address is expiring, I want to change the email address I sign in with,
    so that I do not lose access to my Account when it does.
25. As a student changing my email address, I want to be asked for my current password, so that
    someone who finds my machine unlocked cannot take the Account away from me.
26. As a student who mistypes my current password, I want to be told the password was wrong and have
    the email left unchanged, so that I can try again without wondering what happened.
27. As a student who types an email address that belongs to another Account, I want to be told it is
    already registered, so that I understand why the change was refused.
28. As a student who changes my email address, I want to stay signed in, so that a routine change
    does not interrupt what I was doing.
29. As a student who has just changed my email address, I want the avatar menu to show the new one,
    so that the app and I agree on what my Account is.
30. As a student who has changed my email address, I want to sign out and sign back in with the new
    address, so that the change is genuinely the credential and not a display label.
31. As a student, I want my email address to be matched the same way whether I type it in capitals or
    not, so that signing in later is not a guessing game.

### Changing my password

32. As a student who suspects someone watched me type, I want to change my password from inside the
    app, so that I do not have to abandon the Account to feel safe.
33. As a student changing my password, I want to be asked for my current one first, so that an
    unattended Session cannot be used to lock me out.
34. As a student changing my password, I want to type the new one twice, so that a typo does not
    become my new password.
35. As a student choosing a password that is too short, I want to be told the rule, so that I can
    satisfy it without guessing.
36. As a student who has changed my password, I want every other Session on my Account to stop
    working, so that changing the password actually evicts whoever I was worried about.
37. As a student who has changed my password, I want to stay signed in where I am, so that protecting
    myself does not eject me.
38. As a student who has changed my password, I want the new one to work at sign-in and the old one
    to fail, so that the change is real.

### Acting on my Account

39. As a student with a problem, I want a visible way to contact support, so that the app does not
    feel like a dead end when something goes wrong.
40. As an evaluator, I want a control that is clearly marked as planned rather than broken, so that I
    can tell a placeholder apart from a defect.
41. As a student, I want to download everything the app holds for me as a single file, so that I have
    my own copy of my work outside the product.
42. As a student, I want that download to be a readable file named after the product, so that I can
    find it again later.
43. As a student, I want to sign out from the settings page as well as the menu, so that the action is
    wherever I look for it.
44. As a student who has made a mess of a trial run, I want to clear my data and start fresh, so that
    I can reset without losing the Account.
45. As a student, I want clearing my data to look and behave exactly as it did on the History page, so
    that moving it has not changed what it does.
46. As a student who has cleared my data, I want to be taken back to onboarding, so that the app is
    usable again immediately.
47. As a student leaving the product, I want to delete my Account permanently, so that my documents
    and my password are not left sitting on someone's disk.
48. As a student deleting my Account, I want to confirm twice and type my password, so that I cannot
    do it by accident or in anger with one click.
49. As a student deleting my Account, I want to be told plainly that it cannot be undone, so that I am
    not surprised afterwards.
50. As a student who changes their mind mid-confirmation, I want cancelling to leave everything
    exactly as it was, so that backing out is safe.
51. As a student who has deleted my Account, I want to land on the sign-in screen with a sentence
    saying what happened, so that I am not left staring at a form wondering whether it worked.
52. As a student who has deleted my Account, I want my old email and password to stop working, so that
    "deleted" means deleted.
53. As a student who has deleted my Account, I want to be able to sign up again with the same email
    address, so that leaving is not permanent for me even though my data is gone.
54. As a student, I want the destructive actions visually separated from the ordinary ones, so that my
    eye does not land on Delete when I meant Sign out.

### Trusting the page

55. As a student, I want each part of the page grouped into its own card with a clear heading, so that
    I can find what I came for without reading all of it.
56. As a student, I want the page to be short enough to take in at once, so that settings does not
    become another thing to work through.
57. As a student, I want every failure to appear next to the control that failed, so that I know which
    action to retry.
58. As a student, I want a control that is working to say so while it works, so that I do not press it
    repeatedly.
59. As a student, I want the page to look like the rest of the app, so that it does not read as a
    bolt-on.
60. As a student who edits my Profile and immediately deletes my Account, I want the deletion to
    complete cleanly, so that a half-saved edit cannot break the last thing I do.

### Demonstrating the product

61. As an evaluator, I want to reach settings from the avatar within one click of the main app, so that
    I do not need to be told where it is.
62. As an evaluator, I want to change a Profile field and see it take effect elsewhere in the app, so
    that I can confirm the page writes rather than pretends.
63. As an evaluator, I want to sign in as the demo Account and see its own initials in the header, so
    that the avatar is clearly derived from the Account rather than hard-coded.
64. As a presenter, I want the deleted demo Account to come back when the server restarts, so that
    demonstrating deletion does not cost me the demo.

### Building and maintaining it

65. As a developer, I want the three new endpoints to sit behind the existing Session guard, so that
    none of them is reachable without a Session.
66. As a developer, I want all the new credential logic in the existing auth service, so that hashing
    and Session handling stay in one file.
67. As a developer, I want deletion to rely on the schema's existing cascade rules, so that removing an
    Account cannot leave orphaned Sessions or a stranded State document.
68. As a developer, I want the new endpoints covered by the existing HTTP test suite, so that the
    contract is checked rather than assumed.
69. As a developer, I want the documentation that currently states account deletion is not built to be
    corrected in this same change, so that the docs do not start lying.

## Implementation Decisions

### The page follows the Account / Profile seam, not the student's mental model

A student thinks of "the things I typed when I signed up" as one set. They are not. The Profile
(name, education level, location) is three keys inside the State document, written by the client
through the existing debounced whole-document write and requiring no server change whatsoever. The
Account's email address and password live in the `users` table and each needs a new endpoint. The
page's card structure follows that seam so the two halves never share a save path.

Three cards, in order: **Profile**, **Account and security**, **Account actions**. Destructive rows
sit at the bottom of the third card, below a divider, in the danger colour token — a fourth "danger
zone" card was rejected as padding on a page that is supposed to stay short.

### Route and header

A new route for settings nests inside the existing authenticated layout, so it inherits both routing
gates — Session, then Profile — and keeps the header and the chatbot widget without any new guard
logic. It is deliberately **not** added to the tab navigation: four tabs is already the limit, and
Account settings is plumbing rather than a fifth feature.

The header's Profile-name text and its Sign out button are both removed and replaced by a single
avatar button. The avatar renders initials derived from the Profile name over a background colour
chosen deterministically from that same name, so it is stable across reloads and different between
Accounts. There is no image, no upload, and no storage for one.

Clicking the avatar opens a menu containing the Profile name, the Account email address, a link to
settings, and Sign out. It closes on outside click and on Escape.

### Profile section

Local form state, seeded from the Profile, with one Save button that is disabled until the form
differs from what is stored. Saving calls the existing Profile setter, which routes through the
existing mutation helper — the same debounced whole-document write every other feature uses. The
button expresses intent; it is not a new persistence path, and no second write mechanism is
introduced.

All three fields are required, matching onboarding, with one inline message when any is empty. A
transient confirmation appears after a successful save.

Changing the education level cascades nowhere. It feeds only the suggested Optimization type, which
the onboarding documentation is explicit is a hint and never a guard, so no existing Assessment or
History entry is invalidated by editing it.

### Three new endpoints

All three are declared below the existing Session guard, so they are closed by default, and all three
follow the routes-validate-and-delegate convention: the route checks required fields and calls one
function in the auth service, which owns every hashing and Session decision.

| Endpoint | Behaviour |
| --- | --- |
| Change email | Verify the current password against the Session's Account; normalise the new address the same way sign-up does; update it. The unique index remains the authority on "already registered" — the constraint violation is caught and translated, never pre-checked with a select. Sessions key on the Account id, so they survive untouched. Responds with the updated public Account. |
| Change password | Verify the current password; enforce the same minimum length as sign-up; hash at the same cost; store it; then delete every other Session row for that Account, keeping the one making the request. |
| Delete account | Verify the current password; delete the Account row; clear the Session cookie. |

The verb for the two change endpoints is `PATCH`. This is a new verb for this codebase, and the only
consequence is one extra method on the test client helper.

Deletion relies entirely on the schema's existing foreign keys: Sessions and the State document both
reference the Account with a cascading delete rule, and foreign key enforcement is already switched
on, so removing the Account row removes everything it owns in one statement. No table is enumerated
by hand, which is what keeps deletion correct when a table is added later.

Each new endpoint gets a matching method on the shared client API object. The failed-current-password
case must surface as an inline message beside the control, so it uses the ordinary error path rather
than the central Session-expired handling — that handler is for a 401 meaning "your Session is gone",
and a wrong password on a settings form is not that. Both are exempt from the account-enumeration rule
that governs sign-in: revealing that an email address is taken is already what sign-up does.

### The Session and the client after each change

- **Email changed** — the Session survives, but the authentication context is holding a stale Account
  object. It must be updated in place from the response, or the avatar menu keeps showing the old
  address.
- **Password changed** — the current Session survives, all others stop working. Nothing visible
  happens on the client.
- **Account deleted** — the authentication context is cleared, and the existing routing gate carries
  the person to sign-in on its own. A short neutral sentence is shown there, passed through router
  state so that it does not survive a reload.

### Deletion must reuse the queued-write machinery

The application context holds a debounced whole-document write for up to 800ms after any mutation. A
write still queued or in flight when the Account is deleted would arrive at a deleted row and trip the
central Session-expired handler in the middle of the deletion flow.

The existing clear-data path already solves exactly this: it cancels the queued write and awaits any
write already on the wire, because an in-flight request cannot be cancelled and would otherwise land
after the destructive call. Deletion reuses that sequence. Editing the Profile and immediately
deleting the Account is the case this protects.

### Account actions

- **Contact support** — an inert placeholder. The button looks live, does nothing on click, and
  carries a tooltip marking it as planned. It is presented as future work.
- **Download my data** — real, and entirely client-side: the State document the client already holds
  is serialised, wrapped in a blob, and handed to a download link. This reuses the pattern the resume
  PDF export already established. No endpoint, because the client is the only reader that needs it.
- **Sign out** — the existing sign-out call.
- **Clear my data** — the existing component relocated from the History page essentially verbatim,
  keeping its two-step inline confirmation and its no-password rule. The History page loses it. Its
  behaviour is unchanged: the State document resets, the Account survives, and losing the Profile is
  what walks the person back to onboarding through the routing gate.
- **Delete account** — two-step inline confirmation plus the Account password, in the danger colour.

### Styling

The existing global stylesheet and its custom properties. New classes follow the semantic naming
already in use and reuse the existing tokens, including the danger colour for the destructive rows.
No new styling approach, no dark mode, no utility framework.

## Testing Decisions

### What a good test looks like here

A good test drives the feature the way a browser would and asserts only on externally observable
behaviour: status codes, response bodies, cookie behaviour, and what a subsequent request on the same
or another Session can see. It must not reach into the database module, call the auth service
directly, or assert on hash or token formats. Changing the hashing library or how Sessions are stored
should not require touching a test.

Tests that would only confirm a dependency works — that a cascade deletes a child row, that bcrypt
verifies its own hashes — are not worth writing on their own. Deletion is instead asserted through
what a later request can observe.

### The seam

**One seam, and it already exists: the HTTP boundary of the exported Express application.** The
existing test helper boots the real app on an ephemeral port against a throwaway database and drives
it with a cookie jar. All three new endpoints are exercised there. No new seam is introduced.

The helper's client currently exposes get, post, put and delete; it gains one `patch` method. That is
a new verb on the existing seam, not a new seam.

### Prior art

The existing authentication test file is the direct model — same harness, same cookie helper, same
style of assertion — and the state test file demonstrates asserting cross-Session and cross-Account
visibility, which is how deletion and Session revocation are checked.

### Coverage

At minimum, over the existing seam:

- Changing the email address with the correct password succeeds, and signing in with the new address
  works while the old one no longer does.
- Changing the email address with a wrong password is refused and leaves the address unchanged.
- Changing to an address that already belongs to another Account is refused.
- The new address is matched case-insensitively, as sign-up's is.
- The Session survives an email change: a subsequent request on the same cookie still succeeds.
- Changing the password with the correct current password succeeds; the new password works at sign-in
  and the old one does not.
- Changing the password with a wrong current password is refused.
- A new password below the minimum length is refused.
- A second Session opened on the same Account stops working after the password is changed, while the
  Session that made the change continues to work.
- Deleting the Account with the correct password succeeds, and the Session cookie is cleared.
- Deleting with a wrong password is refused and the Account still signs in afterwards.
- After deletion, signing in with those credentials fails, and signing up with the same address
  succeeds and yields an empty State document — which is how the cascade is observed without reading
  tables.
- Each of the three endpoints returns 401 without a Session.

### Not tested

Client behaviour: the avatar, the menu, the form dirty-state, the download, and the routing after
deletion. The repo has no client test toolchain and adding one is a larger investment than this
feature, which is the stance the accounts spec already took.

## Out of Scope

- **Uploading a profile picture.** The avatar is initials only. There is no file storage anywhere in
  the project and none is being added.
- **Password reset for a forgotten password.** Unchanged and still ruled out — there is no mail
  transport. This spec covers changing a password from inside a Session only.
- **Email verification** of a changed address, for the same reason.
- **Two-factor authentication, security questions, or recovery codes.**
- **A soft delete, a grace period, or any way to recover a deleted Account.** See
  `docs/adr/0004-account-deletion-is-immediate.md`.
- **A visible list of active Sessions or devices.** Changing the password revokes the others, but
  nothing displays them.
- **Notification preferences, theme or appearance settings, connected accounts, language, and data
  export scheduling.** A dead toggle in a light-only app with no mail transport is padding, and the
  page is meant to stay short.
- **Importing a downloaded file back into an Account.**
- **Rate limiting on the password checks.** The application runs locally; there is no attacker path
  this would close, consistent with the existing stance.
- **Changing what the Profile consists of.** The same three fields, editable rather than frozen.
- **Client-side tests.**

## Further Notes

### Documentation this change invalidates

Project convention requires the docs to be corrected in the same change. This feature falsifies
several current claims:

- The API reference and the accounts feature document both state outright that account deletion is
  deliberately not built. Both need correcting, and both need the three new endpoints.
- The accounts feature document's "Extending it" section lists account deletion and changing a
  password among the things deliberately absent.
- The onboarding feature document states that the header shows the Profile name and that Sign out
  lives there — both change — and describes onboarding as the only place the Profile is set, which
  stops being true.
- The history feature document describes clear-my-data as living on the History page.
- The architecture document's routing section lists the routes under the authenticated layout and
  describes the header's contents.
- A new feature document for Account settings is required, following the existing 50–80 line
  skeleton, plus its row in the documentation map in the repo's agent entry point.

### Conventions this change does not disturb

- No LLM call is added, so no prompt, no mock, and no `source` handling is involved.
- No new History-eligible type, so the History page's type labels and Snapshot renderer are untouched.
- No new key in the State document, so the chatbot's context builder needs no entry — the Profile it
  already carries is the same three fields, merely editable now.
- The rule that sign-in must not reveal whether an email address is registered is untouched; the
  settings endpoints are a different surface with a Session already proven.

### The demo Account is not special-cased

It can be deleted like any other Account. Boot-time seeding is keyed on the demo Account's absence, so
restarting the server brings it back. That makes deleting the demo during a demonstration
recoverable, and it is the only recoverable case.
