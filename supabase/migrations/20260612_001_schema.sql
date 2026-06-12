-- Phase 2: Schema — tables, enums, indexes
-- Garage Journal v1

-- ── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE public.car_source     AS ENUM ('seed', 'user');
CREATE TYPE public.car_visibility AS ENUM ('public', 'private');
CREATE TYPE public.event_type     AS ENUM ('build', 'fix', 'service', 'story');

-- ── Profiles ───────────────────────────────────────────────────────────────
-- 1:1 with auth.users; created during onboarding when user picks a username.

CREATE TABLE public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username     TEXT        UNIQUE NOT NULL,
  display_name TEXT,
  location     TEXT,
  bio          TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_username_format CHECK (username ~ '^[a-z0-9_]{2,30}$')
);

-- ── Car models (read-only seed catalog) ────────────────────────────────────

CREATE TABLE public.car_models (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  make         TEXT        NOT NULL,
  model        TEXT        NOT NULL,
  generation   TEXT        NOT NULL,
  chassis_code TEXT,
  year_start   INT         NOT NULL,
  year_end     INT,
  engines      TEXT[]      NOT NULL DEFAULT '{}',
  slug         TEXT        UNIQUE NOT NULL,
  source       public.car_source NOT NULL DEFAULT 'seed',
  CONSTRAINT car_models_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- ── Cars ───────────────────────────────────────────────────────────────────
-- The central object. VIN is in a separate table (car_vins) — owner-only.

CREATE TABLE public.cars (
  id                    UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT                    UNIQUE NOT NULL,
  current_owner_id      UUID                    NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  model_id              UUID                    REFERENCES public.car_models(id) ON DELETE SET NULL,
  custom_make           TEXT,
  custom_model          TEXT,
  custom_generation     TEXT,
  year                  INT                     NOT NULL,
  engine                TEXT,
  transmission          TEXT,
  color                 TEXT,
  nickname              TEXT,
  location              TEXT,
  cover_photo_path      TEXT,
  visibility            public.car_visibility   NOT NULL DEFAULT 'public',
  created_at            TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  CONSTRAINT cars_model_or_custom CHECK (
    model_id IS NOT NULL
    OR (custom_make IS NOT NULL AND custom_model IS NOT NULL)
  )
);

-- ── Car VINs ───────────────────────────────────────────────────────────────
-- Separate table so RLS can guarantee VIN never leaks to non-owners.
-- Application code never joins this in public queries.

CREATE TABLE public.car_vins (
  car_id UUID PRIMARY KEY REFERENCES public.cars(id) ON DELETE CASCADE,
  vin    TEXT NOT NULL
);

-- ── Ownerships ─────────────────────────────────────────────────────────────

CREATE TABLE public.ownerships (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id     UUID  NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  user_id    UUID  NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  start_date DATE,
  end_date   DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Car events ─────────────────────────────────────────────────────────────
-- Unified table; build & fix are different forms, same structure.
-- details jsonb schema: fix → {problem, diagnosis, solution}

CREATE TABLE public.car_events (
  id          UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id      UUID                NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  author_id   UUID                NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  type        public.event_type   NOT NULL,
  title       TEXT                NOT NULL,
  description TEXT,
  details     JSONB,
  event_date  DATE                NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- ── Photos ─────────────────────────────────────────────────────────────────
-- event_id nullable: gallery-only photos have no event.
-- storage path: {car_id}/{uuid}.webp

CREATE TABLE public.photos (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id       UUID        NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  event_id     UUID        REFERENCES public.car_events(id) ON DELETE SET NULL,
  storage_path TEXT        NOT NULL,
  position     INT         NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX ON public.cars(current_owner_id);
CREATE INDEX ON public.cars(model_id);
CREATE INDEX ON public.cars(visibility);
CREATE INDEX ON public.ownerships(car_id);
CREATE INDEX ON public.ownerships(user_id);
CREATE INDEX ON public.car_events(car_id);
CREATE INDEX ON public.car_events(car_id, event_date DESC);
CREATE INDEX ON public.car_events(type);
CREATE INDEX ON public.photos(car_id);
CREATE INDEX ON public.photos(event_id);
CREATE INDEX ON public.car_models(make, model);
