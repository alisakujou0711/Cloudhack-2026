# 01 — Extract the Express app from the server entry point

**What to build:** Nothing changes for anyone using the app. This is a prefactor that makes the
rest of the feature testable.

The server currently builds the Express application and starts it listening in a single module, so
there is no way for a test to boot the application without also binding the real port. Split it in
two: one module that constructs and exports the fully configured application, and a thin module
that imports it and starts listening.

Everything the entry point does today — JSON body parsing with its existing size limit, CORS, the
API router mount, and the startup log describing which LLM provider is configured — must survive
the split, with the configuration living alongside the app and only the listen call moving out.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] The development and start scripts behave exactly as before; the server listens on the same
      port and serves the same routes.
- [x] The startup log still reports the LLM provider or the absence of a key, unchanged.
- [x] The configured application can be imported by another module without a port being bound as a
      side effect.
- [x] Importing the application module does not start a listener.
- [x] No route handler, service, or client code is modified.
