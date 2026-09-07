# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students preparing applications — university admissions and internships — anywhere in the world.
The primary user is a student working on their own material, alone, usually against a deadline,
with a draft they have already written and are unsure about.

Singapore is the build team's locale, not the target audience. It surfaces in the product as
coverage and defaults (see Capabilities and Constraints), not as an audience boundary. A student
applying from outside Singapore is a first-class user, and the profile's `location` field drives
extra guidance for them (visa/work-pass, transcript equivalency, English proficiency) rather than
marking them as an exception.

Secondary readers exist — hackathon judges, mentors — but no surface is written for them.

## Product Purpose

PortfolioPath takes a document a student has already written and returns structured, itemized
feedback on it: what is strong, what is missing, and specific line-level rewrites with the reason
for each. Four document types are supported — university application, internship resume, essay,
cover letter — plus interview preparation, a curated inspirations gallery, a history log, and a
chatbot that can see everything the student has done.

Success is a student who ends the session with a materially better document **that is still
theirs** — they read each proposed change, understood why it was proposed, and chose. Success is
not a rewritten document handed back, and it is not a score.

## Positioning

**Feedback arrives as reasoned, line-level edits the student accepts or rejects one at a time.**

Each suggestion carries its reason. The original bullet is preserved verbatim and shown against
its replacement, track-changes style; a suggestion sharpens the phrasing, framing, or specificity
of what is already on the page and may never invent a fact, company, number, or achievement.
Roughly a third to half of bullets are deliberately returned with no suggestion at all, because
changing something just to change it is a failure.

The student remains the author of every word that ships. That is the thing a neighbouring tool
that rewrites-and-returns, or grades out of 100, cannot truthfully claim.

## Operating Context

- The student arrives with an existing draft — a PDF or DOCX resume, a pasted essay, a personal
  statement. Uploading is the primary path; pasting text is always available as an alternative.
- Work happens in one continuous session against a real deadline, then is returned to later. Every
  completed run is logged to History and can be reopened.
- The document being worked on is private and often personal. Uploads are held in memory and never
  written to disk; everything a student produces lives as one JSON state document per account on
  the server.
- A profile (name, education level, location) is captured once at onboarding and is passed to
  every assessment, so feedback is aimed at the student's actual stage.
- The whole product runs offline with no API key, on deterministic mock responses. This is a
  demonstration and resilience property, and reports say plainly when they are showing rule-based
  feedback rather than a live model, and why.

## Capabilities and Constraints

Confirmed functionality:

- Four optimization types behind one picker: university application, internship resume, essay,
  cover letter.
- Document upload with text extraction and type classification. A type mismatch **confirms**, it
  never rejects — the student may always continue anyway.
- Resume review with per-bullet accept/reject/discuss and PDF export of the resolved resume.
- University assessment against a requirements table, producing a deterministic checklist computed
  in JavaScript — never by the model — with qualitative prose layered on top.
- Interview preparation for university or internship interviews, timeline-aware.
- History of completed runs, with bookmarking, and an Inspirations gallery of sample work.
- A chatbot with context on everything the student has done in the app.
- Accounts are email + password. The server is the sole source of truth for student work; nothing
  is kept in browser storage.

Durable constraints:

- **Feedback is qualitative, never scored**, for internship, essay and cover-letter review. This is
  a deliberate product stance enforced in the prompts, not an implementation gap.
- **University coverage is Singapore institutions only.** The country field is fixed and disabled,
  and the requirements figures are simplified demonstration values, not official cutoffs. No
  surface may imply broader institutional coverage than the requirements table holds.
- Interview salary anchors are monthly SGD ranges, and exist only so the offline demo reads as
  realistic. They are not a source of truth about compensation and must never be presented as one.
- Suggestions may never fabricate. An optional pasted job description aims the feedback at one
  posting; it does not relax that rule.
- The app must keep working with no API key configured.

Explicitly undecided: pricing, licensing, hosting/deployment target, and whether the product is
intended to operate beyond the current build.

## Brand Commitments

- **Name:** PortfolioPath. Used verbatim.
- **Voice:** plain, specific, second person, and unflattering about weak writing without being
  unkind to the writer. The product's own copy models the standard it asks for — it names the
  concrete problem with a line and what to do instead ("Adjectives do not travel. Show the
  evidence for them."), rather than issuing generic encouragement. No exclamation marks, no hype,
  no growth-marketing register.
- **Existing assets:** `client/public/favicon.svg`, `client/public/icons.svg`. Typefaces already
  loaded and in use: Inter and Newsreader (`client/index.html`).
- **Content rule:** Inspirations content stays original or reference-only. Third-party or
  copyrighted sample text is never pasted in.

## Evidence on Hand

Everything real is in the repository. Nothing else exists yet.

- A seeded demo account, `demo@portfoliopath.app` / `portfoliopath`, carrying a profile and
  several finished runs in History. The credentials are printed in the server startup log and
  documented in `README.md` — they are genuinely usable and may be shown.
- Synthetic sample documents at weak/standard/strong tiers under `samples/`
  (`university/`, `internship/`, `essay/`, `cover-letter/`).
- Synthetic before/after revision copy written for the auth screen, in
  `client/src/components/AuthShowcase.jsx`. It is illustrative, not a user's work.
- The shipped feature set itself, and the fact that it runs fully offline without an API key.

**Absent, and never to be invented:** user counts, adoption or outcome metrics, admission or offer
rates, testimonials, quotes, named students, school or university partnerships, press, awards,
funding, team credentials, and any comparison figure against a competitor. No surface may fabricate
these, and none may imply them through placeholder logo rows, star ratings, or "trusted by"
framing.

## Product Principles

1. **The student stays the author.** Every change is proposed, reasoned, and refusable. The product
   never hands back a finished document over the student's head.
2. **Say the specific thing.** Feedback names the actual weak line and what would make it stronger.
   Generic praise and generic criticism are both failures.
3. **Never invent on the student's behalf.** No fabricated facts, numbers, employers, or
   achievements — in the product's output, and in the product's own claims about itself.
4. **Qualitative over scored.** Refusing to grade is a position, not a missing feature.
5. **Always works.** No key, no network to a model, no problem — and the product says so honestly
   rather than pretending the fallback is a live response.

## Accessibility & Inclusion

No product-specific standard has been established by the user. Two behaviours already in the code
are worth preserving as intent: the auth showcase respects `prefers-reduced-motion` by rendering
the finished state instead of the animation, and its mid-keystroke text is hidden from assistive
technology with an equivalent static description above it.
