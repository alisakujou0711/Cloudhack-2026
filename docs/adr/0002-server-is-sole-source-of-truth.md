# The server is the sole source of truth for the State document

The client keeps no persistent copy. The State document is read once after a Session is established
and written back on a debounce. The browser-local copy that predated Accounts was **removed**, not
demoted to a cache.

This looks like a regression, which is why it is written down: a working offline cache was deleted
on purpose. With a sign-in gate, a cached document is stale the moment a different Account signs in
on the same browser, and making it safe costs more than the brief load it saves. Worse, a cache
would reintroduce the exact bug Accounts exist to fix — two students sharing a laptop seeing each
other's work.

## Consequences

The app now requires the API to load at all. This does not change the deployment story, since the
server was always required; it does mean the client alone is not usable.

Do not reintroduce browser-local persistence of the State document to get instant paint without
first solving per-Account invalidation. That is the trade this decision already made.
