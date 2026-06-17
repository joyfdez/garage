# CLAUDE.md — Project "Garage" (working codename)

## What this is

A web platform for car enthusiasts who build, repair, and document their own cars.
The core concept: **every car has a living timeline** that documents its life — builds,
fixes, stories, and (eventually) owners.

Product tagline: **"The home for people who build cars."**
Supporting line: "Track the life of every car."

**The car is the central object of the system.** Not the user, not the post.
Think GitHub repositories, not Instagram: the car is the repo, events are commits.

### v1 = Garage Journal (single-player first)

v1 is deliberately NOT a social network. It is a tool that is useful to a single user
from day one: register your cars, document everything you do to them, and share each
car's public page by link (Discord, Reddit, WhatsApp groups). The social layer
(feed, comments, communities, marketplace) comes later — the data model already
supports it, the UI does not expose it.

**Do not build feed, comments, likes, follows, communities, marketplace, explore,
help requests, or parts catalog in v1.** If a task seems to need them, stop and ask.

## Stack

- **Next.js 15** (App Router) + **TypeScript** (strict)
- **Tailwind CSS**
- **Supabase**: Auth (email + Google OAuth), Postgres with RLS, Storage for photos
- **Deploy target**: Vercel
- Icons: **lucide-react** (outline style only)
- Image handling: client-side compression before upload (`browser-image-compression`),
  convert to WebP, max 1920px on the long edge

## Conventions

- Server Components by default; Client Components only where interactivity requires it
- Data access through Supabase server client in Server Components / Route Handlers;
  browser client only for uploads and realtime-free mutations via Server Actions
- All authorization lives in **RLS policies**, never only in app code
- Mobile-first: design and test at 390px width first, then scale up
- File structure: `app/` routes, `components/` shared UI, `lib/` clients and utils,
  `supabase/migrations/` SQL migrations, `supabase/seed/` catalog seed
- Slugs for public URLs, UUIDs internally
- English UI copy throughout. Voice: simple, direct, garage-friendly.
  Say "Show us your build", never "Upload your vehicle modification log".

## Migration workflow (standing convention)

All schema changes go through the Supabase CLI. **Never tell the user to paste SQL into
the Supabase dashboard SQL Editor.**

1. Create: `supabase migration new <name>` — generates a file with a 14-digit timestamp
   (`YYYYMMDDHHmmss_name.sql`) in `supabase/migrations/`
2. Write the SQL in that file
3. Apply: tell the user to run `supabase db push`

Use `IF NOT EXISTS` / `IF EXISTS` / `OR REPLACE` guards in every migration so it is safe
to inspect with `db diff` or re-run in edge cases. Never use the `_NNN_` sequence-number
format (e.g. `20260612_001_schema.sql`) — it collapses multiple same-day files to the
same version token and breaks per-file CLI tracking.

## Design system (from brandbook)

Direction: **modern + mechanical**. Clean product design + authentic garage culture.
Inspiration: Strava, Letterboxd, Notion. NOT: luxury showroom, carbon fiber,
neon gamer dark mode, 2005 autoparts website.

Colors:

- Background (warm white): `#F6F6F4`
- Cards / secondary background: `#EDEDED`
- Text (deep charcoal): `#111111`
- Accent (signal orange): `#FF5A1F` — primary actions, highlights, interactive elements

Typography:

- **Inter** — UI, body, navigation
- **Space Grotesk** — headings, emphasis, car titles

Layout principles:

- Generous whitespace ("MUCHO AIRE"), editorial/catalog feel
- Large photography is the hero of every screen
- Robust cards, visible technical metadata (year, engine, chassis code)
- Content over decoration; the interface should feel timeless
- The Car Page is the most important screen in the product — when in doubt,
  invest polish there

Photography placeholders/examples should evoke real garage culture: engine bays,
hands with grease, project cars, night parking lots, direct flash. Never showroom shots.

## Brand personality (for all copy)

Knowledgeable but humble, hands-on, helpful, curious. A friend in the garage,
not a luxury dealership. Never corporate, never elitist, never influencer-speak.
A €1,200 Miata project is as valuable as a supercar.

## Key architectural decisions (do not revisit without asking)

1. **Unified `car_events` table** with a `type` enum (`build`, `fix`, `service`,
   `story`) instead of separate Build/Fix tables. Build and Fix are different
   forms in the UI; one structure in the DB. The timeline IS the product.
2. **`ownerships` table exists from day 1** even though ownership transfer is a
   future feature. Retrofitting it later would be expensive; it is the product's
   signature long-term idea (cars outliving their owners on the platform).
3. **Hybrid car catalog**: curated seed of ~250 enthusiast-relevant models with
   autocomplete + free-text fallback (`custom_make` / `custom_model` /
   `custom_generation` on the car). Catalog is read-only seed in v1.
4. **Cars are public by default** (sharing is the point), with a private toggle.
   VIN is always private, never rendered on public pages, never in public API
   responses.

## Reference

Full v1 specification, data model, screens, and build phases: see `SPEC.md`.
