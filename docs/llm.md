# LLM integration

Read this before adding or changing **any** LLM call. Every call in the app goes through one
abstraction with a mandatory offline fallback.

## Provider selection

`server/services/llm.js` picks a provider **once at startup** and never re-checks:

```
LLM_PROVIDER env var  ->  else Gemini if GEMINI_API_KEY  ->  else Anthropic if ANTHROPIC_API_KEY  ->  else 'none'
```

`hasKey` is simply "a provider module was resolved". `/api/health` reports both
(`{ok, llmConfigured, llmProvider}`).

| Provider | File | How it calls | Model |
| --- | --- | --- | --- |
| Gemini (default) | `server/services/providers/gemini.js` | Raw `fetch` to the REST API, no SDK; 25s `AbortController` timeout; `generationConfig.responseMimeType: 'application/json'` for JSON mode; maps the `assistant` role to Gemini's `model` | `gemini-3.1-flash-lite`, override with `GEMINI_MODEL` |
| Anthropic | `server/services/providers/anthropic.js` | `@anthropic-ai/sdk`; `max_tokens` 2048 (JSON) / 1024 (text); strips ```json fences before parsing | `claude-sonnet-4-5` (hardcoded) |

Both modules export the same four things: `completeJson`, `completeText`, `hasKey`, `MODEL`. A
third provider only needs to match that surface and be added to the map in `llm.js`.

Env vars live in `server/.env.example` (`PORT`, `GEMINI_API_KEY`, `GEMINI_MODEL`,
`ANTHROPIC_API_KEY`, `LLM_PROVIDER`). Changing a key requires a server restart.

## The mock-fallback contract

This is the reason the whole app runs offline and keyless, and why it survives Gemini free-tier
rate limits. **Do not bypass it.**

```js
const { data, source } = await completeJson({ system, prompt, mockFn });
const { text, source } = await completeText({ system, messages, mockFn });
```

- No provider configured -> `mockFn()` runs immediately, `source: 'mock'`.
- Provider configured but the call throws (network, rate limit, malformed JSON, timeout, blocked
  response) -> the error is logged and `mockFn()` runs, `source: 'mock-fallback'`.
- Success -> `source` is `'gemini'` or `'anthropic'`.

`mockFn` **must be synchronous and dependency-free** — no `await`, no network, no LLM. It exists
to produce a plausible, deterministic result from the input alone (keyword heuristics, regex,
length checks). See `mockClassify` in `documentClassifier.js` or `mockReview` in
`internshipAssessment.js` for the two idioms.

`mockFn` must return **the same shape** the system prompt demands. A drifted mock is invisible
until the API key runs out, then renders a broken report.

## `source` on the client

Every service spreads its result and attaches `source`; every report component reads it through
`client/src/utils/llmSource.js`.

- `mockNotice('mock')` -> "Demo mode: no LLM provider configured…"
- `mockNotice('mock-fallback')` -> **`null`** — currently no notice is shown when a configured
  provider fails. That is the actual behavior today; the two values are kept distinct precisely
  so the wording can differ, so don't collapse them into one boolean.
- `isMockSource()` is exported but **imported nowhere** — dead code as of this writing.

Consumers: `UniversityPanel.jsx:179`, `QAReview.jsx:5`, `ResumeReviewEditor.jsx:38`,
`InterviewsPage.jsx:135`.

## Adding an LLM-backed feature

1. Create `server/services/<feature>.js`.
2. Write a `mock<Feature>(...)` — synchronous, deterministic, matching the target shape.
3. Write a `system` prompt that ends with the exact JSON shape and per-field rules. House style:
   `Respond ONLY with valid JSON matching this shape:` followed by the literal shape, then a
   bulleted rule per field.
4. Build the `prompt` from the caller's inputs, including
   `Student profile: ${profile ? JSON.stringify(profile) : 'not provided'}` if the feature should
   support the international note.
5. Call `completeJson`/`completeText`, then `return { ...data, <echoed inputs>, source }`.
6. Add a thin route in `server/routes/api.js` and a method in `client/src/api/client.js`.

**Never import a provider module directly from a feature service.**

## Prompt conventions used throughout

- "Never invent facts about the student" appears in every assessment prompt — the model sharpens
  what's there, it does not fabricate achievements, numbers, or organizations.
- No numeric scores anywhere in internship/essay/cover-letter review; feedback is qualitative by
  design (see `README.md` design notes).
- `internationalNote` is `string | null` and must be `null` unless the profile places the student
  outside Singapore; visa/policy claims stay high-level and hedged.
- Long documents are truncated before sending where relevant (the classifier caps at 4000 chars).
