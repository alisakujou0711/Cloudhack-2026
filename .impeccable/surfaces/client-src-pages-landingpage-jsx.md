---
version: 1
slug: "client-src-pages-landingpage-jsx"
primary_target: "client/src/pages/LandingPage.jsx"
related_targets: ["client/src/index.css"]
---

# Landing page

Scope: the public marketing surface at `/` for signed-out visitors. Visitor mode: **Persuade**.

Audience: a student arriving cold with a draft they are unsure about, under deadline, alone.
Job: understand in one viewport that this returns reasoned line-level edits they control.
Action: **Get Started → `/signin`**. Auth is never embedded here.

Proof: the mechanic shown, and nothing else. Worked sample answers across the four document
types, authored synthetic, in the app's own review idiom. No testimonials, metrics, logo walls,
or star ratings — PRODUCT.md forbids inventing them or implying them.

Constraints: inherits the committed world; adds no dependency; appends to `client/src/index.css`.
`/signin`, `/signup`, `AuthShowcase`, both auth gates and every `/app/*` route stay untouched.
Never scores. Reduced motion gets the resolved state, not the animation.

Memorable moment: a weak line striking through and rewriting itself on the sheet, its reason
appearing in the margin beside it.

Unresolved: whether the sample demo should become operable (accept/reject clickable) later; the
user chose shown-not-operable for this build.

## Direction contract

THESIS: The page is the student's desk at 1am with their real materials lying on it, revisions
happening on the sheets themselves. Refuses the centered-hero-plus-feature-card-grid this
category ships.

OWN-WORLD: Inherited, not invented. Ink ground `#14172b`; paper sheets `#ffffff` / `#f6f7fb`;
indigo `#4f46e5` marks only the applied revision; muted `#667085` margin notes; Newsreader
display, Inter body; 8–14px radii; soft offset shadows lifting sheets off the desk.

STORY: Feedback here is line-level and comes with its reason; I stay the author of every word;
I start.

FIRST VIEWPORT: Full-bleed ink desk. A resume sheet sits centre-left, slightly rotated, one
bullet mid-revision. Newsreader headline upper-right, Get Started directly beneath it.
Signature interaction — **the revision pass**: as each sheet enters view, exactly one line
strikes, its replacement writes itself beneath, and the reason surfaces in the margin. One at a
time, never two.

FORM: The Desk; index 3 of 7 ranked structures; seed key `c1b544d3`.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the
verdict, DESIGN.md, and every shipping raster carrying its provenance
