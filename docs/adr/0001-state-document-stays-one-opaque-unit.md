# The State document stays one opaque unit

Everything an Account produces — Profile, History entries with their Snapshots, chat history,
Assessments and in-progress drafts — is stored and replaced as a single document, rather than
normalised into tables.

A History entry keeps a whole Snapshot because the components that re-render a past Optimization
run read fields the summary line never carries; trimming a Snapshot breaks re-rendering. Normalising
History would therefore mean modelling four different Assessment shapes, and every Optimization type
added later would bring a fifth. One document preserves that invariant for free and keeps the shape
the client holds and the shape we store identical.

## Consequences

Nothing can be queried inside the document. There is no way to ask "which Accounts ran an Essay
optimization this week" without reading every Account's document. No feature needs that today, and
adding one is a migration rather than a redesign — but it is the cost being paid here, knowingly.

Two Sessions writing the same Account clobber each other. Concurrent use of one Account is not a
supported scenario.
