# Habla

A playful Spanish conversation game. Practice with Lucía, an original toy-like 3D character modeled and rendered in Blender. Choose a vocabulary deck and tense, answer by typing or browser voice dictation, and get specific coaching and points for meaningful language use.

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

- **Four decks, 85 source entries:** Unit 1, *Las familias en diferentes sociedades*. Original 1.0 plus family relationships, educational communities, and global citizenship. See [data/unit-1.json](data/unit-1.json) and [SOURCES.md](SOURCES.md).
- **Six replies per round:** Three suggested target words at a time; natural inflections and other correctly used words in the deck also count.
- **Scoring:** +15 per distinct correctly used vocabulary item (max five per reply), +10 for a correct use of the chosen tense, +5 for an original, meaningful Spanish reply. Keyword lists do not count. The tutor judges context, then the server validates evidence against the learner's answer and calculates points.
- **Retrieval before hints:** English meanings and response starters are opt-in. The learner writes or speaks an original answer.
- **Brief corrective feedback:** One manageable correction or specific piece of praise, with an explicit tense goal. Present, preterite, imperfect, or mixed practice.
- **A simple review scheduler:** Missed targets are due immediately; successful words use 1, 2, 4… day intervals, capped at 30 days. Current targets are avoided for one turn, then weaker/due words take priority. This is a transparent prototype scheduler, not a validated mastery estimate or full FSRS implementation.
- **Saved conversations:** Resume, review the log, and continue another round. Records live in `.local/progress.json`, excluded from Git. Atomic writes, serialized mutations, and request IDs prevent duplicate scoring on retries. Keep this file to preserve progress.
- **Interactive scene props:** Click the Blender-rendered books or family picture to choose the school/family setting for subsequent conversation.

AI feedback can be wrong; XP is practice feedback, not an official grade. Voice dictation uses the browser's speech-recognition service, with transcript review before sending. It is browser-dependent, needs microphone permission, and may transmit audio to the browser vendor. Spanish playback uses available system voices. Typed practice works without microphone or speech support.

## Character and assets

All character geometry, materials, scene props, lighting, and animation frames are original. No Nintendo or Mii assets are included. The `.blend` source is editable and the scripts reproduce the assets.

```sh
# In a separate Python 3.11+ environment:
pip install bpy pillow
python blender/lucia.py
python blender/props.py
```

Tested with Blender's `bpy` 5.0.1 on Apple Silicon. `blender/lucia.blend` contains the character and idle keyframes. The script renders idle, talk, happy, and thinking states into transparent animated WebP images. This is a prerendered 3D character, not a live WebGL rig. Talking is a playful mouth loop, not phoneme-level lip sync. Reduced-motion preferences show the static portrait.

The interface uses React, Vite, Lucide icons, DM Sans, and DM Serif Display. Fonts currently load from Google Fonts; fallback fonts work offline.

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

Original code and assets are under the MIT license. Source vocabulary provenance is recorded separately in SOURCES.md; no affiliation with Quizlet or Nintendo is implied.
