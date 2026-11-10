# MikeAI Brand Guide

The visual and verbal identity for MikeAI Chat, an AI agent that answers questions about Mike's professional background, with the occasional joke.

## Brand essence

**Positioning:** A friendly, credible way to get to know Mike's work in 30 seconds.

**Personality:** Warm, confident, and quick. Professional first, with a dry sense of humor that shows up now and then.

**Principles**
1. **Clear before clever.** Visitors should know what to ask within seconds.
2. **Credible.** Answers are grounded in real experience and say where they came from.
3. **Human.** It's an AI, but it sounds like a person worth talking to.
4. **Light humor, never at the expense of trust.** Jokes are occasional and optional.

## Name and naming

- Product name: **MikeAI** (one word, capital M and A, capital I)
- Page title: **MikeAI Chat**
- In the UI, the agent refers to Mike in the third person ("Mike has built...") and to itself as "MikeAI" or "I"

## Logo and mark

- **Primary mark:** a Signal Blue chat bubble with a white binary `0` and `1` for eyes and a white smile.
- **Wordmark:** "MikeAI" set in Inter Medium (500), with "Mike" in Ink and "AI" in Signal Blue.
- **Clear space:** at least half the mark's height on all sides.
- **Minimum size:** 24px for the mark, 80px wide for the wordmark.
- Don't stretch, rotate, add effects, or recolor outside the palette below.
- **Assets:** [`web/public/mikeai-mark.svg`](web/public/mikeai-mark.svg) and [`web/public/mikeai-logo.svg`](web/public/mikeai-logo.svg).

## Color

### Light theme

| Role           | Name        | Hex       | Use                                    |
| -------------- | ----------- | --------- | -------------------------------------- |
| Background     | Mist        | `#F4F7FB` | Page background                        |
| Surface        | White       | `#FFFFFF` | Cards, chat area, composer             |
| Border         | Hairline    | `#E3E8EF` | Dividers, outlines                     |
| Text primary   | Ink         | `#1B2430` | Headings, body                         |
| Text secondary | Slate       | `#5B6778` | Supporting text, labels                |
| Accent         | Signal Blue | `#2F6BFF` | Send button, links, focus, user bubble |
| Accent tint    | Sky         | `#E6EEFF` | User messages, selected chips          |
| Success        | Go Green    | `#1FA46A` | Online status                          |
| Warning        | Amber       | `#E0A100` | Reconnecting status                    |
| Error          | Signal Red  | `#D64545` | Errors, offline status                 |

### Dark theme

| Role         | Hex       |
| ------------ | --------- |
| Background   | `#0F141B` |
| Surface      | `#171E28` |
| Border       | `#263040` |
| Text primary | `#E8EDF4` |
| Text secondary | `#9AA7B8` |
| Accent       | `#5B8CFF` |
| Accent tint  | `#1E2B4D` |

**Usage rules**
- Use the accent sparingly: one primary action per view.
- Keep the surrounding UI neutral so the conversation is the focus.
- Text on colored backgrounds uses the darkest shade of the same color family, never plain black.
- Maintain at least 4.5:1 contrast for body text.

## Typography

| Use        | Typeface                          | Weights  |
| ---------- | --------------------------------- | -------- |
| UI and body | Inter (fallback: system sans-serif) | 400, 500 |
| Code       | JetBrains Mono (fallback: monospace) | 400      |

**Scale**

| Style    | Size | Weight | Line height |
| -------- | ---- | ------ | ----------- |
| Headline | 28px | 500    | 1.25        |
| Title    | 20px | 500    | 1.3         |
| Body     | 16px | 400    | 1.65        |
| Small    | 14px | 400    | 1.5         |
| Caption  | 12px | 400    | 1.4         |

Use sentence case everywhere. Avoid all caps and heavy weights above 500.

## Layout and shape

- Spacing on an 8px grid
- Corner radius: 12px for cards and the composer, 8px for controls, fully rounded for chips and avatars
- Message column max width: 720px
- Borders are thin (1px, hairline color). Prefer borders to shadows.
- Flat surfaces. No gradients, glows, or heavy shadows.

## Iconography

- Outline icons, 1.5-2px stroke, 16-20px in the UI
- One consistent set (Tabler Icons or similar)
- Icons support the label; they don't replace it for important actions

## Voice and tone

**Voice:** friendly, direct, plain-spoken.

**Do**
- Use contractions ("I'm", "he's", "can't")
- Lead with the answer, then add detail
- Be specific ("built agent apps on Azure AI Foundry", not "has cloud experience")
- Say when you don't know and point to Mike

**Don't**
- Oversell or use filler ("seamless", "leverage", "passionate")
- Use exclamation marks on system messages
- Make up facts about Mike

### Humor guidelines

- Occasional and opt-in: the "Tell me a joke" chip, or a single light line at the end of some replies
- Dad-joke energy: groan-worthy and harmless
- Never during errors, never about sensitive topics, never in answers about hiring or compensation
- Keep it to one line

**Examples**
- "Why did the cloud engineer get invited to every party? He knew how to scale."
- "I'd tell you a UDP joke, but you might not get it."

## Microcopy

| Moment            | Copy                                                              |
| ----------------- | ----------------------------------------------------------------- |
| Page headline     | Ask Mike's AI anything                                            |
| Intro line        | Career, projects, and skills, straight from Mike's background. Occasional dad jokes at no extra charge. |
| Input placeholder | Ask about Mike's career, or his questionable puns                 |
| Status: online    | MikeAI is online                                                  |
| Status: reconnecting | Reconnecting...                                                |
| Status: offline   | MikeAI is offline. Email Mike instead                             |
| Unknown answer    | I don't have that one. Here's how to reach Mike directly.         |
| Error             | Couldn't reach MikeAI. Retry                                      |
| Disclaimer        | AI-generated answers about Mike. For anything official, contact him directly. |
| Contact prompt    | Want to talk to the real Mike?                                    |

**Starter prompts**
- What's Mike's background?
- What has he built on Azure?
- Biggest career wins
- Is he open to new roles?
- Tell me a joke

## Components

**Status indicator:** a small dot beside the agent name with a label. Green with a subtle pulse when online, amber when reconnecting, red or gray when offline.

**Messages:** user messages are right-aligned in the accent tint. Agent messages are full width with a small avatar and no bubble.

**Answer cards:** key facts (roles, skills, projects) appear in a compact card with a "Source" tag beneath.

**Starter chips:** pill-shaped, hairline border. The joke chip uses the accent tint.

## Accessibility

- 4.5:1 minimum contrast for text, 3:1 for UI components
- Visible focus rings in the accent color
- Full keyboard support: Enter to send, Shift+Enter for a new line
- The message list announces new replies to screen readers
- Respect the system's reduced-motion setting (no pulse animation)
- Tap targets at least 44px on mobile

## Quick reference

```css
:root {
  --bg: #f4f7fb;
  --surface: #ffffff;
  --border: #e3e8ef;
  --text: #1b2430;
  --text-muted: #5b6778;
  --accent: #2f6bff;
  --accent-tint: #e6eeff;
  --success: #1fa46a;
  --warning: #e0a100;
  --error: #d64545;
  --radius: 12px;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```
