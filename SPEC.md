# SPEC.md — Garage Journal v1

Working codename: **garage**. Final brand name pending (deliberately deferred).

## 1. Problem statement

Car knowledge and car stories are fragmented across forums, YouTube, Instagram, and
WhatsApp groups. There is no single place where the life of a car — its repairs,
modifications, and history — is documented. Owners lose repair knowledge, build
history, and the story of the car itself.

## 2. Target user (v1)

DIY car enthusiasts and project car builders: people who repair and modify their own
cars, watch 40-minute videos about E30 trim differences, and fight rusted bolts for
four hours. Examples: Miata owners, BMW E30/E36/E46 people, JDM enthusiasts,
Land Cruiser people, shitbox lovers. Global audience, English UI.

## 3. Goals

1. A user can go from sign-up to a documented car with one event in **under 5 minutes**.
2. A car's public page is good-looking enough that owners **want** to share the link.
3. The product is fully useful with a single user (no network effect required).
4. The data model supports the v2 social layer without migration pain.

## 4. Non-goals (v1) — do not build

- Home feed, likes, comments, follows — empty-network features kill first impressions
- Communities / clubs — needs critical mass
- Explore / model hubs — needs many cars; catalog structure prepares for it
- Marketplace, parts catalog, help requests, professional profiles, car spotting
- Ownership transfer between users — table exists, feature does not
- Native mobile app — responsive web first
- VIN verification — VIN is an optional private field only

## 5. Scope (v1 features)

1. Auth (email + Google) and onboarding
2. Garage: the user's collection of cars
3. Add Car with hybrid catalog autocomplete
4. Public Car Page with timeline, mods, fixes, gallery — shareable by URL
5. Car Events: Build posts and Fix posts with photos
6. Public user profile
7. Settings (profile edit, sign out)

## 6. Data model

All tables in Postgres (Supabase). RLS on everything.

### profiles
Extends `auth.users` (1:1, id FK).

| column | type | notes |
|---|---|---|
| id | uuid PK | references auth.users |
| username | text unique | lowercase, url-safe, required at onboarding |
| display_name | text | |
| location | text | free text, e.g. "Madrid, Spain" |
| bio | text | |
| avatar_url | text | |
| created_at | timestamptz | |

### car_models (read-only seed catalog)

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| make | text | "BMW" |
| model | text | "3 Series" |
| generation | text | "E30" |
| chassis_code | text nullable | when distinct from generation |
| year_start / year_end | int / int nullable | |
| engines | text[] | common options, e.g. {"M20B20","M20B25","S14"} |
| slug | text unique | "bmw-3-series-e30" |
| source | enum('seed','user') | v1: everything is 'seed' |

Seed: ~250 curated enthusiast-relevant models (see §10). No user inserts in v1;
unmatched cars use free-text fallback fields on `cars`.

### cars (the central object)

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| slug | text unique | short id for share URLs |
| current_owner_id | uuid FK profiles | denormalized convenience; source of truth is ownerships |
| model_id | uuid FK car_models nullable | null when free-text fallback used |
| custom_make / custom_model / custom_generation | text nullable | fallback; required if model_id is null |
| year | int | required |
| engine | text nullable | prefilled from catalog options, editable |
| transmission | text nullable | manual / automatic / other |
| color | text nullable | |
| nickname | text nullable | "The Rust Bucket" |
| location | text nullable | |
| vin | text nullable | **private always** — never on public pages or public queries |
| cover_photo_path | text nullable | |
| visibility | enum('public','private') | default 'public' |
| created_at | timestamptz | |

### ownerships

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| car_id | uuid FK | |
| user_id | uuid FK profiles | |
| start_date | date nullable | |
| end_date | date nullable | null = current owner |
| created_at | timestamptz | |

Created automatically when a car is created. Transfer flows are v2; the timeline
will render ownership periods when they exist.

### car_events

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| car_id | uuid FK | |
| author_id | uuid FK profiles | |
| type | enum('build','fix','service','story') | v1 UI exposes build + fix only |
| title | text | required |
| description | text nullable | build narrative |
| details | jsonb | fix: `{problem, diagnosis, solution}`; future: parts_used |
| event_date | date | defaults to today, user-editable (backfilling history matters) |
| created_at | timestamptz | |

### photos

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| car_id | uuid FK | required |
| event_id | uuid FK car_events nullable | null = gallery-only photo |
| storage_path | text | |
| position | int | ordering |
| created_at | timestamptz | |

Car gallery = all photos where car_id = X. Event photos = filtered by event_id.

### Storage
Bucket `car-photos`, public read (car pages are public), authenticated write.
Path: `{car_id}/{uuid}.webp`. Client compresses to WebP, max 1920px long edge,
before upload. Limit 10 photos per event in v1.

### RLS summary
- profiles: public read; owner update
- car_models: public read; no writes
- cars: read if `visibility='public'` OR owner; insert/update/delete owner only;
  **vin column excluded from public reads** (use a public view or column-level strategy)
- ownerships: read follows car visibility; writes by car owner
- car_events / photos: read follows parent car visibility; writes by car owner

## 7. Screens & routes

Navigation: bottom nav on mobile with three items — **Garage / Add (+) / Profile**.
Top nav on desktop. No feed tab, no explore tab in v1.

### 7.1 Landing `/` (logged out)
Headline "The home for people who build cars." Subline "Add your car. Track its life.
Share the journey." CTA: **Add your first car** → auth. Minimal; one strong garage
photo. Logged-in users are redirected to `/garage`.

### 7.2 Auth + onboarding
Supabase email + Google OAuth. After first login: pick username (+ optional location),
then immediately prompt **Add your first car**. The empty Garage state repeats this CTA.

### 7.3 Garage `/garage` (private home)
Grid of the user's cars (cover photo, year + make + model + generation, nickname,
event count). Private cars show a lock badge. Persistent **Add car** button.

### 7.4 Add Car `/garage/new`
- Single search field with autocomplete against `car_models` (matches make, model,
  generation, chassis code — "e30", "miata", "mx-5" should all work)
- Selecting a model prefills make/model/generation and offers its engine options
- Escape hatch below results: **"Can't find it? Add it manually"** → free-text
  make/model/generation fields
- Then: year (required), engine, transmission, color, nickname, location,
  photos (first = cover), VIN (optional, marked private), visibility toggle
  (default public)
- On save: create car + current ownership row → redirect to Car Page

Acceptance: a user who types "e30", picks it, sets year and one photo can save in
under a minute.

### 7.5 Car Page `/car/[slug]` — the center of the product
Public when visibility = public; owner-only otherwise.

- Hero photo, title (`1987 BMW 3 Series E30` + nickname), owner (link to profile),
  location, specs row (engine, transmission, color)
- **Share** button (copy URL; native share on mobile)
- Owner-only: **Add event** button, edit car, manage photos
- Tabs:
  - **Timeline** (default): all events newest-first; cards show type badge
    (build = orange, fix = neutral), title, date, first photo, snippet
  - **Mods**: events of type build
  - **Fixes**: events of type fix, rendered as Problem → Diagnosis → Solution
  - **Gallery**: all photos, lightbox
- Empty timeline (owner view): "This car's story starts here. Add your first update."

### 7.6 Add Event `/car/[slug]/events/new`
Type selector first: **Build update** or **Fix**.
- Build: title, description, date, photos
- Fix: title, problem, diagnosis, solution (each its own field), date, photos
Posting from Garage via the (+) tab first asks which car (skip if user has one car).

### 7.7 Event detail `/car/[slug]/events/[id]`
Full event page, individually shareable (people share a specific engine swap, not
just the car). Full photos, full text, link back to the car.

### 7.8 Profile `/u/[username]` (public)
Avatar, display name, location, bio, car count, grid of **public** cars.

### 7.9 Settings `/settings`
Edit profile fields, sign out. Nothing else in v1.

## 8. Success metrics

North star: **events per active car per month** (target ≥ 2).
Leading: signup → first car conversion ≥ 60%; first car → first event ≥ 50%;
share-link visits per public car. Lagging: 4-week creator retention.
v1 instrumentation can be minimal (Vercel Analytics + SQL queries); no product
analytics suite required yet.

## 9. Build phases (for Claude Code)

1. **Setup** — Next.js 15 + TS + Tailwind, design tokens (colors, fonts), Supabase
   project wiring, base layout + bottom nav shell
2. **Schema** — migrations for all tables + enums + RLS + storage bucket/policies;
   seed script for car_models
3. **Auth & onboarding** — email + Google, username step, route protection
4. **Garage & Add Car** — autocomplete component, fallback flow, photo upload
   pipeline (compression → storage → photos rows)
5. **Car Page** — hero, tabs, share, public/private rendering, VIN exclusion verified
6. **Events** — build & fix forms, timeline rendering, event detail page
7. **Profile, settings, polish** — empty states, loading states, OG meta tags for
   share links (car page + event page must unfurl nicely with cover photo)

Each phase should end deployable. OG/social cards are part of v1, not polish-later:
the share link IS the growth loop.

## 10. Catalog seed guidance

Generate `supabase/seed/car_models.sql` with ~250 rows weighted toward enthusiast
culture, e.g.: Mazda MX-5 (NA/NB/NC/ND) and RX-7 (FC/FD); BMW 3 Series (E21–G20)
plus E24/E28/E34; Toyota AE86, Supra (A70/A80/A90), Land Cruiser (40/60/70/80/100
series), GT86; Honda Civic (EF/EG/EK/EP3/FN2), S2000, NSX, Integra (DC2); Nissan
Skyline (R32/R33/R34), Silvia/240SX (S13/S14/S15), 350Z/370Z; VW Golf (Mk1–Mk8)
and Corrado; Porsche 911 (G-body/964/993/996/997), 944, Boxster (986); Ford Mustang
(gen 1–6), Escort (Mk1/Mk2), Fiesta ST; Mercedes W123/W124/W201/W210; Volvo
240/740/850; Subaru Impreza (GC8/GD/GR); Mitsubishi Lancer Evo (I–X); Renault
Clio RS / 5 GT Turbo; Peugeot 205 GTI / 306; Alfa Romeo GTV / Giulia (105); Mini
(classic / R53); Land Rover Defender; Jeep Wrangler (YJ–JL); plus mainstream
staples (Corolla, Focus, etc.). One row per generation, not per trim. Engine
variants go in the `engines` array, not as separate rows (M3 engines live inside
the 3 Series generation row in v1).

## 11. Open questions (non-blocking)

- Brand name + domain — pending by design; repo codename "garage"; UI placeholders
  use the tagline, not a name
- Exact mechanism for VIN column privacy (public view vs. separate table) —
  engineering decision during Phase 2; the requirement is absolute: VIN never leaks
- Whether "previously owned" cars appear in v1 Garage (ownerships supports it;
  UI can defer to v1.1)

## 12. Future (v2+, for architectural awareness only)

Feed + comments + follows → communities by model → explore / model hubs (powered by
car_models) → help requests → parts graph → marketplace → ownership transfer →
professional profiles. None of this is in v1; all of it hangs off the existing graph.
