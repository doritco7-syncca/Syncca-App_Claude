# Syncca — Implementation Guide

## Project Folder Structure

Place all files inside your React project exactly as shown below.

```
your-project/
├── public/
│   └── index.html              ← Add Google Fonts link here (see Theme.js note)
├── src/
│   ├── App.jsx                 ← Root component + session state
│   ├── Theme.js                ← All colors, fonts, spacing (edit look here)
│   ├── UI_STRINGS.js           ← All user-facing text (edit copy here)
│   ├── AirtableService.js      ← All Airtable API calls
│   ├── SynccaService.js        ← Claude API + system prompt assembly
│   ├── lexicon/
│   │   └── LexiconPrompt.js    ← Lexicon injected into system prompt
│   └── components/
│       ├── LoginScreen.jsx     ← Login / welcome screen
│       ├── ChatContainer.jsx   ← Main chat screen + sync logic
│       ├── MessageBubble.jsx   ← Single chat message + [[concept]] tags
│       ├── ConceptTooltip.jsx  ← Tooltip shown on concept click
│       ├── PersonalCard.jsx    ← Side panel: saved concepts + feedback
│       └── SessionTimer.jsx    ← 30-minute arc timer
└── .env                        ← API keys (never commit this file)
```

---

## File Roles at a Glance

| File | What to edit here |
|------|-------------------|
| `Theme.js` | Colors, fonts, spacing, border radius, shadows |
| `UI_STRINGS.js` | Button labels, placeholders, welcome text, error messages |
| `AirtableService.js` | Airtable field names (top of file), API base ID |
| `SynccaService.js` | System prompt layers, AI model, max_tokens |
| `LexiconPrompt.js` | Concept definitions and detection signals |
| `SessionTimer.jsx` | Session duration (default: 30 minutes) |

---

## Environment Variables (.env)

Create a `.env` file in your project root:

```
REACT_APP_AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
REACT_APP_AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
```

- Never commit `.env` to version control
- Add `.env` to your `.gitignore`

---

## Google Fonts Setup

Add this line to `public/index.html` inside the `<head>` tag:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora:wght@400;500&family=DM+Sans:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

---

## Airtable Setup Order

1. Import `syncca-lexicon-seed.json` into your `Relationship_Lexicon` table
2. Verify field names match exactly: `English_Term`, `Hebrew_Term`, `Description_EN`, `Description_HE`
3. Create the `Users` table with fields listed in `AirtableService.js → AIRTABLE_SCHEMA.users`
4. Create the `Conversation_Logs` table with fields in `AIRTABLE_SCHEMA.logs`
5. Set `Saved_Concepts` in Users as a Linked Record → `Relationship_Lexicon`
6. Set `User_Link` in Conversation_Logs as a Linked Record → `Users`
7. Set `Concepts_Surfaced` in Conversation_Logs as a Linked Record → `Relationship_Lexicon`

---

## How the Files Connect

```
User types message
       ↓
ChatContainer.jsx
  → builds message history
  → calls SynccaService.sendToSyncca()
       ↓
SynccaService.js
  → assembles system prompt from 4 layers + LexiconPrompt.js
  → calls Claude API
  → parseResponse() splits visibleText + meta JSON
       ↓
ChatContainer.jsx
  → updates messages state (triggers MessageBubble re-render)
  → calls AirtableService.syncSession() with latest feedback from state
       ↓
MessageBubble.jsx
  → renders [[concept]] tags as clickable buttons
  → ConceptTooltip.jsx fetches definition from Airtable on click
       ↓
PersonalCard.jsx
  → controlled feedback textarea → onChange updates App state
  → onBlur triggers AirtableService.syncSession()
```

---

## Changing UI Text

Open `UI_STRINGS.js`. Every string has a `{ en: "...", he: "..." }` pair.
Edit the text, save — done. No other file needs to change.

To switch the UI chrome language (buttons, labels) between Hebrew and English:
```js
// UI_STRINGS.js — line 10
export const DEFAULT_UI_LANGUAGE = "he"; // change to "en" for English
```

---

## Changing the Session Duration

Open `ChatContainer.jsx`, line 14:
```js
const SESSION_DURATION_MS = 30 * 60 * 1000; // change 30 to any number of minutes
```

---

## Adding a New Concept to the Lexicon

1. Add the record to Airtable `Relationship_Lexicon` table
2. Add the concept to `LexiconPrompt.js`:
   - Add a brief entry under the right group in `LEXICON_FOR_SYSTEM_PROMPT`
   - Add detection signals to `LEXICON_DETECTION_MAP`
3. That's it — no other files need to change
