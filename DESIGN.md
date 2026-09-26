# Habla design system

## Product principle

Conversation first. The learner selects a pool of decks, then explores their vocabulary through one ongoing conversation. A suggested word is optional; any selected word counts. No mandatory word order or vocabulary round cutoff. Tense practice stays separate.

## Direction

A warm, playful conversation toy. Expressive character, quiet interface. Inspiration is the approachable proportion and readable expressions of toy and console avatars; all geometry and assets are original. The home screen selects a deck; the practice screen centers the actual conversation. No dashboard, sidebars, motivational paragraphs, stat grids, or overlapping missions.

The frontend-design skill guided the visual direction; gstack design-review's usability guidance informed hierarchy and removal of unnecessary copy. The live app is the design preview.

## Tokens

- Paper: `#fcfbf6`
- Ink: `#39362e`
- Secondary ink: `#78766b`
- Tomato action: `#ee6245`, pressed edge `#ce442a`
- Butter scene: `#f5edcd`
- Pistachio reward: `#d9e5ac`, dark success `#435c37`
- Rule: `#e7e5da`

Typography: Bricolage Grotesque for expressive headlines, goals, and wordmark; DM Sans for reading and controls. Spanish prompts have the greatest prominence on the practice screen, and use readable sentence case. Body/input text 16px; short supporting controls 12–14px; sparse eyebrows 10–11px. Avoid long uppercase labels and faint instructional copy.

Use 4/8/12/16/24/32/48px spacing steps, with a maximum app width of 1320px. Radii have roles: 8–10px controls, 12px interactive deck choices, 28px main scene, 999px progress/reward pills. Cards exist only for choices and the single current goal. No decorative cards.

## Screens

Home: wordmark + chats/XP; four multi-select deck choices and a whole-unit shortcut; words/tense switch; one primary start action; Lucía. A resume link appears when a conversation is unfinished. Word browsing is a dialog.

Practice: back/topic; vocabulary coverage count (or tense round progress); audio switch. One conversational Spanish follow-up, an optional word suggestion, character. One response field with dictation and send. Hints, translations, and conversation history are opt-in. New vocabulary earns +20 per word and a character reaction; natural replies keep the conversation moving even without new vocabulary.

Mobile preserves the prompt → target → character → reply order. No desktop sidebar collapses into another navigation system. Keep the input at 16px to avoid mobile zoom.

## Character and motion

Lucía has a larger head, an asymmetric bob, expressive eyes, sunshine sweater, teal overalls, papaya sneakers, and a daisy pin. The Blender pipeline renders 12-frame idle/talk/happy/thinking loops. Idle includes a blink; success includes a wave and laughing eyes. Motion communicates state. Reduced-motion users see a still portrait.

Functional motion: 150–250ms controls, 400ms reward appearance. Speech animation follows playback where supported; muted mode gets a brief talking loop. Never animate major layout geometry.

## Decisions

2026-09-26: Replaced the first dashboard-like design with a single-goal conversation surface following direct user feedback. Replaced multiword/tense scoring with one 20-XP goal. Preserved saved conversations and historical points.

2026-09-26: Added multi-select decks, whole-unit default, conversational Luna follow-ups, optional context-aware suggestions, and unique vocabulary coverage in place of linear word missions.
