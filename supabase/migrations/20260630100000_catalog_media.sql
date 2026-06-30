-- Migration: catalog media support
-- Adds logo_path to makes, description to models,
-- description + cover_photo_path to car_models,
-- and creates the model_photos gallery table.

-- ── 1. makes: logo_path ───────────────────────────────────────────────────

ALTER TABLE public.makes
  ADD COLUMN IF NOT EXISTS logo_path text;


-- ── 2. models: description ────────────────────────────────────────────────

ALTER TABLE public.models
  ADD COLUMN IF NOT EXISTS description text;


-- ── 3. car_models: description + cover_photo_path ────────────────────────

ALTER TABLE public.car_models
  ADD COLUMN IF NOT EXISTS description      text,
  ADD COLUMN IF NOT EXISTS cover_photo_path text;


-- ── 4. model_photos ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.model_photos (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  car_model_id  uuid        NOT NULL REFERENCES public.car_models(id) ON DELETE CASCADE,
  storage_path  text        NOT NULL,
  position      int4        NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS model_photos_car_model_id_position_idx
  ON public.model_photos (car_model_id, position);


-- ── 5. RLS en model_photos ────────────────────────────────────────────────

ALTER TABLE public.model_photos ENABLE ROW LEVEL SECURITY;

-- Public read (same pattern as makes / models / car_models)
CREATE POLICY "model_photos: public read"
  ON public.model_photos
  FOR SELECT
  USING (true);

-- Writes only via service_role (import script); no policy for INSERT/UPDATE/DELETE
-- means those operations are blocked for anon and authenticated roles by default.

GRANT SELECT ON public.model_photos TO anon, authenticated;
