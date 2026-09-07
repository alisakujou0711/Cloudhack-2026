# Landing page

**What it does** — The public marketing surface at `/`. A signed-out visitor gets the product's
mechanic demonstrated on real sample material rather than described, and one action: **Get
started**, which goes to `/signin`. It is the only page in the app with no API call and no
persisted state.

## Files

| Path | Role |
| --- | --- |
| `client/src/pages/LandingPage.jsx` | The whole page: copy, demo content, `Revision`, `Sheet`, `useInView`, `useScrolledPast` |
| `client/src/index.css` | `.landing` / `.lp-*` block at the end of the file — the only dark surface in the app |
| `client/src/App.jsx` | The `/` branch: landing when signed out, gate redirect when signed in |
| `.impeccable/surfaces/client-src-pages-landingpage-jsx.md` | Direction contract for the surface |

## Flow

1. `/` renders `LandingPage` when `isAuthenticated` is false; with a session it redirects through
   the normal gate to `/app/optimize` (or `/onboarding`). See `docs/architecture.md`.
2. On mount the page adds `landing-active` to `<html>` and removes it on unmount.
3. `useInView` fires once per sheet and per `SectionHead` as it reaches the viewport, adding
   `.is-in`; the hero instead gets `.is-ready` on the frame after mount.
4. On the two sheets that carry one, `Revision` runs the pass: strike → write → reason.
5. The bar is fixed from the first frame. `useScrollNarration` writes `--lp-scroll` on it once per
   animation frame and measures each chapter's tick position; `useActiveChapter` names the chapter
   in the bar; `useScrolledPast` watches the hero's `.lp-actions` and adds `.is-docked` past it.
6. `DecisionAct` pins its sheet while `useActiveStep` walks the step blocks, resolving one bullet
   per step and moving the measured pen to it.
7. Every CTA is a `<Link>` to `/signin`. There is no form and no auth on this page.

## Contract

None — no endpoint, no state key. All content is module-level constants in the page file.

## Invariants

- **Every claim is checkable against the code.** No user counts, metrics, outcome rates,
  testimonials, partners, press, or pricing. `PRODUCT.md` lists these as never-to-be-invented, and
  that includes implying them through logo rows or ratings. This is the constraint most likely to
  be broken by a well-meaning edit.
- **The four types are shown in their real output forms.** Only the internship resume returns
  per-bullet accept/reject suggestions; essays and cover letters return prose critique per
  question/prompt, and university returns the JS-computed checklist. Do not redraw the four sheets
  as one repeated diff — it would be a false claim, not a simplification.
- **The demo revisions obey the product's own no-fabrication rule.** They sharpen or join facts
  already present in `samples/internship/borderline_data_analyst_intern_resume.txt`; none invent a
  number, employer, or achievement. A new example must clear the same bar.
- **The page never shows a score.** Consistent with the rest of the app.
- **Reduced motion gets the resolved state, not the animation** — `Revision` renders the applied
  phase, the sheets and headings skip their entrance, and the act unpins with every bullet judged. Content is visible by default: if
  `IntersectionObserver` is missing, `useInView` returns `true` immediately.
- **`useInView` takes a `rootMargin` *string*, never an options object.** An object literal is a
  new identity every render, which tears the observer down before it can deliver its asynchronous
  first callback — the pass then never runs. Sheets that need their own in-view state pass
  `children` as a function of it.
- **`Revision` only moves forward.** Only `prefers-reduced-motion` jumps to the applied phase;
  rendering applied whenever the pass has not started makes a line visibly revert to its original
  as it scrolls into view.
- **Dark stays scoped.** All colour lives in `.landing`'s `--lp-*` tokens; `html.landing-active`
  exists only so overscroll and the scrollbar match the page. Nothing dark belongs on `:root`.
- **Two authored motion moments, and no third.** The revision pass on a sheet, and the pinned
  act where scrolling *is* the interaction. Everything else is one shared vocabulary — sheets rise,
  headings resolve out of blur — and a new section joins it rather than inventing a third idea.
- **The act's stage is sticky against its grid area, so it needs `align-items: start`** on
  `.lp-act-grid`, and plain block layout below 900px. A one-column grid gives the stage an area
  exactly its own height and sticky has nowhere to travel.
- **`--lp-scroll` is written on the header, never held in React state** — a render per scroll
  frame to move a 2px rule is the most expensive way to draw the cheapest thing on the page. Tick
  positions *are* state; they change only when the document's height does. Every `CHAPTERS` id must
  exist on a section, or its tick is dropped and the readout freezes on the chapter before it.
- **Step dimming is gated on `.is-guided`.** Without `IntersectionObserver` — or under reduced
  motion — nothing will ever brighten a dimmed step, so the act renders resolved and legible.
- **`overflow-x: clip` belongs on `.landing main`, not on `.landing`.** It bounds the hero's lamp,
  but a clip on an ancestor of the top bar clips the bar out of existence the moment it docks.
- **`.lp-topbar-slot` holds `--lp-bar-h` whether or not the bar is in it.** The bar is fixed from
  the first frame, so docking changes material and height only; giving the bar back its own space
  in the flow reintroduces a jump at the docking threshold.
- **`useScrolledPast` measures on notification, never from the entry.** An
  `IntersectionObserverEntry` carries a rect from when the crossing was recorded and a batched
  callback holds several, so the live `getBoundingClientRect()` is the only current answer.

## Extending it

Adding a section: use `Sheet` for anything on paper so it inherits the entrance, and keep the
sheets materially different in size and content — a row of equal cards is the arrangement this
page exists to refuse. Reuse `--lp-*` tokens rather than adding colours.

Changing the route: `/` is the only public surface, and the gate table in
`docs/architecture.md` documents the split. Update both together.

Adding a real proof asset (a testimonial, a metric, a partner) requires the user to supply it and
a matching update to `PRODUCT.md`'s Evidence on Hand — never author one to fill the slot.
