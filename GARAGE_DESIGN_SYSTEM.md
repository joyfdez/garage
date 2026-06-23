# Garage — Design System

> Living document. The design system for the Garage web app (Next.js + React + Tailwind).
> Paste this into Claude Code as context and prompt: "build/restyle this to the Garage design
> system." Source of truth for tokens: `tailwind.config.ts` + `app/globals.css`.

**Platform:** Web (Next.js App Router, React, TypeScript, Tailwind). Mobile-first, installable PWA.
**NOT** native — no SwiftUI/Compose here. This is a separate product from Gloop with an opposite
aesthetic; never import Gloop's tokens, colors, or components.

---

## 1. Brand soul

Garage is where car enthusiasts document the life of their cars — builds, repairs, history.
The car is the central object, not the user. The deeper idea: **a car outlives its owner**;
its history stays with the car across every hand it passes through.

Design personality: knowledgeable but humble, hands-on, editorial. A car-magazine spread, not
a luxury showroom. Photos are the hero; the design gets out of the way. Timeless over trendy.

Inspirations in spirit: Strava, Letterboxd, a printed car magazine.
NOT: luxury showroom, carbon-fiber-and-neon, gamer aesthetic, 2005 auto-parts website.

The look has a name internally: **"garage magazine"** — editorial enthusiast.

---

## 2. Color

A warm, near-white paper background with near-black ink and a racing-green accent. Heritage
automotive, sober, photo-forward. The palette is deliberately restrained.

### Core tokens

| Token | Hex | Role |
|---|---|---|
| `paper` | `#FBFAF7` | Primary background (warm near-white). Use everywhere as the base. |
| `ink` | `#14130F` | Primary text, primary buttons (near-black). |
| `racing-green` | `#1A3A2E` | Brand surface / accents / active states (deep British racing green). |
| `green-bright` | `#2D6A4A` | Brighter green for interactive accents, selected states, active underlines. |
| `ink-muted` | `#6B6862` | Secondary text, metadata. |
| `hint` | `#A8A49C` | Tertiary text, hints, placeholders. |

### Rules

- **The background is `paper` everywhere.** One white. Do not introduce a second off-white
  (`bg-background` / `#F6F6F4` was removed — never reintroduce it).
- **The accent is racing green, never orange.** A saturated signal orange (`#FF5A1F`) was used
  early and deliberately removed during the garage-magazine redesign. **Never reintroduce orange
  in any form** — not as a token, not as a selected-state ring, not "because a brandbook mentions
  it." Active/selected states use `green-bright`.
- Brand green is reserved for **active states and accents**, never a passive fill.
- Error states use a red (e.g. `#ef4444`) — kept minimal, ideally via a single CSS variable.

---

## 3. Typography

Two families. Big condensed display titles against small, wide-tracked uppercase metadata —
the signature car-magazine move.

| Use | Family | Style |
|---|---|---|
| Display / car titles | **Archivo** (condensed grotesque) | Bold, large, magazine-cover presence |
| Body & data | **Inter** | Regular/medium |

### Signature pattern

Huge display title paired with small uppercase metadata with wide letter-spacing:

```
2010 Mini Mini                ← Archivo, big, bold
R56                            ← small, uppercase, tracked
N18B16A · DCT · CREMA          ← metadata row: uppercase, wide tracking, ink-muted
```

### Notes

- Inputs use **16px minimum** font size (prevents iOS zoom-on-focus). Don't go below.
- Metadata rows: uppercase, wide letter-spacing, `ink-muted` color, small size.
- Content titles keep natural case; only the display hero leans into the magazine feel.

---

## 4. Spacing & layout

- Mobile-first. Design for a ~380px viewport first.
- Generous whitespace — let photos and titles breathe.
- Screen content sits within a consistent gutter; don't crowd edges.
- **Safe areas:** never hardcode notch/status-bar/home-indicator insets. Use
  `env(safe-area-inset-*)`. Top headers need `safe-area-inset-top`; the bottom nav and
  scrolling content need `safe-area-inset-bottom`. A frosted blur sits under the status bar so
  content doesn't collide with native iOS chrome.

---

## 5. Shape & surfaces

- Thin borders (hairline, low-opacity ink) over heavy ones.
- **Glass/translucent surfaces only when floating over photos** (e.g. the title bar over a car
  hero). Never use glass as a passive fill on the paper background — on paper, use solid
  surfaces with hairline borders.
- Cards: white background, hairline border, rounded corners. Timeline event cards (Mod, Fix,
  Purchased, Sold) all share ONE card style — white bg, photo if present, consistent layout.

---

## 6. Imagery

- Photos dominate. Full-bleed photography wherever it fits (car hero, event cards).
- Car hero: swipeable photo carousel with dot indicators; tapping opens a unified fullscreen
  lightbox (carousel, tap-backdrop-to-close, safe-area-aware close button).
- **One unified lightbox component** for all fullscreen photo viewing (gallery and carousel
  entry points use the same component — never two divergent viewers).
- Multi-photo cards: show the first photo with a "+N" badge; tapping opens the unified lightbox
  with all photos. No inline carousel inside list cards (avoids scroll-gesture conflicts).
- Bottom scrim over photos when text overlays them, for legibility.

---

## 7. Motion

- Subtle, editorial: parallax on the car hero, gentle fades, a sliding green underline on tabs.
- Always respect `prefers-reduced-motion`.
- Timeless over flashy — motion supports, never distracts.

---

## 8. Component inventory (current)

These already exist in the app. Reuse and theme them; don't reinvent.

### Buttons
- **Primary:** `ink` fill, paper text. The main action (e.g. "Add to garage", "Save changes").
- **Secondary:** outlined / hairline, ink text (Share, Edit).
- **Icon button:** circular, for back / edit / close on the car profile (back arrow top-left,
  edit top-right, balanced).
- Never use orange for any button or action color.

### Toggles / segmented controls
- Visibility (Public/Private), unit (km/mi), price visibility — segmented, selected = `ink`
  fill with paper text, unselected readable on paper. (The selected state must have proper
  contrast — a known past bug was black-on-black.)

### Chips / tabs
- Tabs (Timeline / Mods / Fixes / Gallery): active tab marked by a sliding **green** underline.
- Spec chips on the car page (fuel, body, drivetrain, hp): pill, muted surface.

### Inputs & selects
- Glass/muted field surface, 16px text, calendar icon inside date fields.
- Currency: a currency dropdown BEFORE the price input; the price symbol adapts to the selected
  currency (€, $, MX$, £, etc.) and must not overlap the number. MXN displays as `MX$`.
- Color picker: single-select swatch grid; selected ring uses `green-bright` (NOT orange).
  Light swatches get a subtle border to stay visible on paper.
- Required fields marked with `*`. Do not label optional fields as "(optional)".
- Numbers (mileage, price) show thousands separators for display; store the raw number.
- Year is a dropdown (2027 → 1900), no thousands separators.

### Cards
- Timeline event card: white bg, hairline border, photo (first + "+N" badge if multiple),
  type label + icon (Build/Mod, Fix, Purchased=origin, Sold), date, mileage, price,
  description. Purchased and Sold are DERIVED from the ownership record but render identical
  to Mod/Fix cards.

### Tab bar (bottom nav)
- Three destinations: Add / Explore / Profile. Safe-area aware (padding for home indicator).

---

## 9. Hard rules (the "don'ts" we learned)

1. **Never orange.** `#FF5A1F` is banned. Accent is racing green; selected states use
   `green-bright`.
2. **One background:** `paper` (`#FBFAF7`) everywhere. No second off-white.
3. **One lightbox component** for all fullscreen photos.
4. **Glass only over photos**, never as a passive fill on paper.
5. **16px minimum on inputs** (iOS zoom).
6. **Safe areas via `env()`**, never hardcoded.
7. **Respect `prefers-reduced-motion`.**
8. **VIN and prices marked private must never leak** to public views (data, not just UI).
9. This is **web/React/Tailwind** — Gloop's SwiftUI/Compose system and its neon-purple palette
   do NOT apply here. Different product, opposite aesthetic.

---

## 10. Data-model design notes (for consistent UX)

- Mileage stored raw + unit per event; current mileage is DERIVED from the most recent event,
  not stored. Unit preference is per-user (Settings), changeable per entry.
- Default currency is a per-user preference, changeable per car.
- Acquisition condition lives on the ownership record, not the car.
- Purchased/Sold timeline entries are derived from ownership data, so edits/undos stay in sync.

---

_Garage Design System · living document · source of truth: `tailwind.config.ts` + `app/globals.css`_
