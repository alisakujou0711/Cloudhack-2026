# 04 — Move persisted state to the server

**What to build:** The payoff. Everything a student produces now belongs to their account rather
than to their browser: profile, history and bookmarks, chat history, assessments, interview plan,
and every in-progress draft. Signing in from a different browser on the same machine brings it all
back. Clearing site data loses nothing. Signing in as a different account shows a completely
separate, empty account.

All thirteen existing state keys move together as a **single JSON document per user**, mirroring the
shape already held in local storage — profile, the two portfolios, the essay and cover-letter
optimizations, interview prep, the four assessments, the interview plan, chat history, and history.
This is deliberate: history entries store a full snapshot of the API result that produced them,
because the report components re-render from that snapshot and read fields the summary line does not
carry. Normalising history into tables would mean modelling four report shapes for no gain today.

The server becomes the sole source of truth and **the local storage write is removed entirely**. It
is not kept as a cache: with a sign-in gate, a cached document is stale the moment a different
person signs in, and reconciling that costs more than a brief load state does.

State is read once after authentication resolves. Mutations update React state immediately and
schedule a debounced write of the whole document — roughly 800ms, so that typing in an essay field
does not become one request per keystroke. Writes are last-write-wins with no conflict detection;
two browsers signed into one account will clobber each other and that is accepted. A save-status
indicator in the header reflects pending and settled writes, replacing persistence that is
currently invisible.

The existing migration that folds a legacy per-page chat history object into a single array must be
preserved and applied to documents read from the server.

The write endpoint validates only that the body is a JSON object within the existing request size
limit. It does not check the shape of the thirteen keys — the client is the sole writer, and a shape
check would need updating on every state change.

**Naming note, deliberately not actioned.** The standing inputs for an optimization type are called
a *portfolio* for university and internship but an *optimization* for essay and cover letter — one
concept under two names, with "optimization" also naming the whole feature and the four types. The
endpoint verbs disagree with the state keys in the same way. This ticket is the cheapest moment that
rename will ever have, because it already touches every key; after it ships, the same rename needs a
migration of every stored document. The call was to **leave it alone** — the risk of renaming across
the state context, five panels, the chatbot's context builder, and four endpoints mid-build buys no
user-visible value. Do not action it here; raise it as its own ticket if it starts to bite.

**Blocked by:** 03 — Sign-in and sign-up screens with the routing gate.

**Status:** ready-for-agent

- [ ] A newly created account has an empty state document rather than a missing one.
- [ ] Work done in one browser appears after signing in from a different browser on the same
      machine.
- [ ] Clearing browser site data loses nothing; signing back in restores everything.
- [ ] Signing out and signing in as a second account shows none of the first account's data.
- [ ] One account cannot read another's state through the API.
- [ ] All thirteen keys persist, including in-progress drafts — essay answers, cover letter prompts,
      resume text, target role, and portfolio fields.
- [ ] Typing continuously in a text field produces debounced writes, not one per keystroke.
- [ ] The header shows when a save is pending and when it has settled.
- [ ] No write to browser local storage remains in the application state context.
- [ ] The legacy chat-history migration still runs against documents read from the server.
- [ ] History entries re-render fully after a round trip, with snapshots intact.
- [ ] The architecture doc's client-state section is rewritten, and its claims that there is no
      database and no server-side persistence are corrected — along with the matching line in the
      root agent guide.
- [ ] The history feature doc no longer claims history has no server involvement.
- [ ] The API doc gains the state endpoints.
