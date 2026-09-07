# Portfolio Chatbot

**What it does** — A floating assistant available on every `/app/*` page. One conversation per
account that is never reset by navigation, and that receives the student's entire app state on
every message so it can answer cross-feature questions.

## Files

| Path | Role |
| --- | --- |
| `client/src/components/ChatbotWidget.jsx` | FAB, panel, `buildContext()`, send loop |
| `client/src/context/ChatUIContext.jsx` | Open/draft UI state — **not persisted** |
| `client/src/components/Layout.jsx` | Mounts the widget once, outside the routed outlet |
| `server/services/chatbot.js` | System prompt, `mockReply` |
| `POST /api/chat` | See `docs/api.md` |

## Flow

1. User types; the message is appended to `chatHistory` immediately.
2. `POST /chat` with `{message, history, context}` — the **full** prior history every time, since
   the server keeps nothing about the conversation between requests.
3. The reply is appended as an `assistant` turn and rendered through `react-markdown`. Errors are
   appended as a message rather than thrown, so the thread never breaks.

## The two contexts

- **`chatHistory`** lives in `AppContext` and **is** persisted, so the conversation survives
  reloads. `loadInitialState` migrates an older per-page shape into one array.
- **`ChatUIContext`** holds `open`, `draft`, and `openWithDraft(text)` and is deliberately **not**
  persisted. It exists so any component can open the chatbot with a prefilled message without
  threading props through the tree — `ResumeReviewEditor`'s "Discuss" button is the current user.

## buildContext()

Sends *everything*, not just the active tab:

    { currentTab, profile,
      university:  {portfolio, assessment},
      internship:  {portfolio, assessment},
      essay:       {setup, assessment},
      coverLetter: {setup, assessment},
      interview:   {setup, plan} }

This is intentional — it is what lets the bot answer "compare my resume and my university
profile". `currentTab` is derived from the URL and only tells the model where the user is
standing; it does not scope what the model can see.

**If you add persisted state a user might reasonably ask about, add it here.** That is the single
maintenance obligation of this feature.

## Prompt behavior

The system prompt states the platform's five areas, notes the conversation is shared and not
reset by navigation, allows general application-process questions, and embeds the context JSON.

Formatting rules are chat-specific and worth preserving: Markdown, short bullets or a numbered
list over dense prose, bold on the single most important phrase per point, **no `##` headings**
(it renders in a chat bubble), and a plain 1-3 sentence answer when the question is simple. Tone:
warm, concrete, honest about gaps.

For international profiles an extra paragraph tells it to flag visa/equivalency considerations
when relevant but not to force them into every reply. See `docs/features/onboarding.md`.

## Offline mock

`mockReply` handles three cases only: a "notice period" definition, an "improve/first" question
answered by walking the four assessments for the first pending bullet suggestion or first gap, and
otherwise a message stating it is in offline demo mode. It reads the context but calls no LLM.

## Invariants

- One conversation per account — do not add per-page threads or a reset-on-navigate.
- The widget is mounted once in `Layout`; don't mount a second instance per page.
- History is sent whole on every request; there is no server-side conversation state.
- Assistant messages are Markdown and must stay rendered through `react-markdown`.
