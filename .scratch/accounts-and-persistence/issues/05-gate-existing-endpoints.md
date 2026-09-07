# 05 — Require a session on the existing feature endpoints

**What to build:** The API stops answering strangers. Every existing feature endpoint — the
assessments, the document extraction and classification routes, the essay and cover-letter
optimizers, the resume export, interview preparation, the chatbot, and the university options
lookup — rejects a request without a valid session. The health check stays open so the server can
still be pinged.

These endpoints are stateless computation over a request body and hold no user data, so this is a
posture decision rather than a data-protection one. It is still worth doing: an API that answers
anyone undercuts the claim that accounts are real, and it is the first thing a technical reviewer
checks.

Applying the middleware is the whole job. No route gains a user parameter, no service signature
changes, and no feature behaviour is altered for a signed-in person.

This is blocked by the browser being able to authenticate, not merely by the middleware existing —
gating these routes before there is any way to obtain a session in the UI would break the running
app.

**Blocked by:** 03 — Sign-in and sign-up screens with the routing gate.

**Status:** ready-for-agent

- [ ] Every existing feature endpoint returns 401 without a valid session cookie.
- [ ] The health check remains reachable without a session.
- [ ] Every feature works exactly as before for a signed-in person — uploads, assessments, exports,
      and the chatbot included.
- [ ] File-upload endpoints reject unauthenticated requests before consuming the upload.
- [ ] A test covers at least one pre-existing feature endpoint being unreachable without a session.
- [ ] The API doc records that authentication is required on all endpoints except the health check.
