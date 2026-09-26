# Habla

A playful Spanish conversation game. Practice with an expressive illustrated Lucía, or select Michael Jackson’s user-supplied white-suit portrait. Choose a deck, then practice one word, phrase, or tense per sentence. Type or use browser voice dictation; Lucía gives a short nudge and celebrates each success.

## Run locally

Requires Node.js 22+, npm, and a working Codex login.

```sh
npm install
codex login
npm run dev
```

Open **http://127.0.0.1:4347**. The server binds to loopback only. The default tutor uses the official `@openai/codex-sdk`, your existing local Codex authentication, and `gpt-5.6-luna` at low reasoning effort. Configure `CODEX_MODEL` for another model available to your account. No API key is needed for this mode. The app automatically finds the macOS Codex desktop CLI when present, otherwise uses the SDK's bundled executable; `CODEX_PATH` can override it.

Optional lightweight Responses API mode:

```sh
cp .env.example .env
# Set CHAT_PROVIDER=openai and OPENAI_API_KEY in .env.
# OPENAI_MODEL defaults to gpt-4.1-mini.
npm run dev
```

`.env` is ignored. Never put API keys in client code or a `VITE_` variable. The browser talks to a local Node server; provider credentials stay server-side. SDK conversations consume your account's Codex usage; API mode uses your API billing. API mode is implemented but not live-verified without an API key.

```sh
npm test
npm run build
npm start
```

## The game

- **Mix your sets:** All four Unit 1 decks (85 unique words) are selected by default. Toggle individual sets or select the whole unit. Vocabulary JSON and provenance are in [data/unit-1.json](data/unit-1.json) and [SOURCES.md](SOURCES.md).
- **Have a conversation:** Lucía responds to your meaning and asks a connected follow-up. Any vocabulary from your selected sets counts, including natural inflections. The displayed word is an optional idea, not a gate. Replies without new vocabulary continue the conversation normally.
- **Explore the whole pool:** Each newly used word earns 20 XP once per conversation. Multiple words can count together; repeats do not farm points. The words-explored counter opens the full pool with covered words checked. Vocabulary conversations have no six-turn cutoff.
- **Separate tense practice:** Present, preterite, imperfect, or mixed; 20 XP per correct sentence and six successes per round.
- **Support on demand:** English translations, hints, and history stay tucked away. Feedback is brief. Word-use history supports review suggestions, while Luna chooses suggestions that fit the conversation.
- **Saved conversations:** Resume any chat. Records live in ignored `.local/progress.json`; preserve this file to keep progress. Existing chats keep their points and vocabulary history. Atomic writes, serialized mutations and request IDs prevent duplicate scoring on retries.

AI feedback can be wrong; XP is practice feedback, not an official grade. Voice dictation uses the browser's speech-recognition service, with transcript review before sending. It is browser-dependent, needs microphone permission, and may transmit audio to the browser vendor. Spanish playback uses available system voices. Typed practice works without microphone or speech support.

## Character and assets

Choose Lucía or Michael Jackson on the home screen, or switch with the companion selector during a conversation. Selection is saved per chat. Older chats default to Lucía.

Lucía uses a generated, transparent four-expression illustration sheet, with CSS idle, talking, celebration, and thinking motion. Reduced-motion preferences disable movement. Michael uses the user-supplied Thriller-cover reference photo in a portrait card, with subtle motion; generation of a new illustrated public-figure image was blocked by the image tool. No voice cloning: both use ordinary system Spanish voices. The tutor treats Michael as an explicitly fictional tribute character.

See [public/character/ARTWORK.md](public/character/ARTWORK.md) for artwork sources and the illustration prompt. The supplied Michael Jackson album-cover image is third-party reference material and is not covered by this repository’s MIT license; no affiliation or endorsement is implied.

The earlier original Blender model and render scripts remain in `blender/` for editing, but the active UI uses illustrated/portrait assets. The interface uses React, Vite, Lucide icons, DM Sans, and Bricolage Grotesque. Fonts load from Google Fonts with offline fallbacks.

## Local-only security boundary

This is a public **source repository**, not a publicly hosted tutor service. The local server has no multi-user accounts. It rejects non-loopback Host values, cross-origin API calls, requests without the same-origin token, oversized messages, and invalid decks/tense settings. AI providers receive the selected vocabulary and recent conversation, not arbitrary user files. The Codex adapter disables shell, app, plugin, and web-search integrations and uses a read-only sandbox, with a 90-second timeout and schema-constrained output.

Do not expose this development server to the public internet. A public deployment requires user authentication, per-user storage, rate/budget limits, and a production provider configuration. Local SDK sessions follow Codex's own local history behavior. No credentials, chat histories, environment files, or machine-specific authentication data are tracked.

## Structure

- `src/` — home, deck browser, conversation game, voice UI, optional WebMCP read/navigation tools
- `server/index.mjs` — local HTTP API, persistence, request validation, Vite integration
- `server/tutor.mjs` — Codex SDK and OpenAI Responses adapters
- `server/game.mjs` — scoring evidence validation and review scheduling
- `data/unit-1.json` — vocabulary, source provenance, editorial translation notes
- `blender/` — original 3D source and reproducible render scripts
- `tests/` — scoring and scheduling regression tests

Original code and original assets are under the MIT license; third-party reference artwork is excluded. Source vocabulary provenance is recorded separately in SOURCES.md; no affiliation with Quizlet or Nintendo is implied.
