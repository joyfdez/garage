-- Structured car fields, mileage tracking, and unit preferences.

-- ── Cars: new structured fields ──────────────────────────────────────────────
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS fuel       TEXT,
  ADD COLUMN IF NOT EXISTS drivetrain TEXT,
  ADD COLUMN IF NOT EXISTS horsepower INT,
  ADD COLUMN IF NOT EXISTS body_type  TEXT;

-- ── Ownerships: acquisition condition + sale mileage ─────────────────────────
ALTER TABLE public.ownerships
  ADD COLUMN IF NOT EXISTS acquisition_condition TEXT,
  ADD COLUMN IF NOT EXISTS sale_mileage_value    INT,
  ADD COLUMN IF NOT EXISTS sale_mileage_unit     TEXT;

-- ── Car events: odometer reading at event time ────────────────────────────────
ALTER TABLE public.car_events
  ADD COLUMN IF NOT EXISTS mileage_value INT,
  ADD COLUMN IF NOT EXISTS mileage_unit  TEXT;

-- ── Profiles: preferred mileage unit (km or mi) ───────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mileage_unit TEXT NOT NULL DEFAULT 'km';

-- ── Update v_ownerships to expose new non-sensitive ownership columns ─────────
-- DROP + CREATE instead of CREATE OR REPLACE because Postgres forbids inserting
-- new columns before existing ones in a replaced view.
DROP VIEW IF EXISTS public.v_ownerships;
CREATE VIEW public.v_ownerships
WITH (security_invoker = on) AS
SELECT
  id,
  car_id,
  user_id,
  start_date,
  end_date,
  created_at,
  currency,
  purchase_price_public,
  sale_price_public,
  acquisition_condition,
  sale_mileage_value,
  sale_mileage_unit,
  CASE WHEN purchase_price_public OR user_id = auth.uid()
       THEN purchase_price END AS purchase_price,
  CASE WHEN sale_price_public    OR user_id = auth.uid()
       THEN sale_price    END AS sale_price
FROM public.ownerships;

GRANT SELECT ON public.v_ownerships TO anon, authenticated;

-- ── Updated create_car_with_ownership ────────────────────────────────────────
-- Drop both known overloads by exact signature before recreating — CREATE OR
-- REPLACE fails when multiple overloads exist and Postgres can't resolve which
-- one to replace.
DROP FUNCTION IF EXISTS public.create_car_with_ownership(
  TEXT, UUID, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  DATE, NUMERIC, BOOLEAN, TEXT
);
DROP FUNCTION IF EXISTS public.create_car_with_ownership(
  TEXT, UUID, TEXT, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  DATE, NUMERIC, BOOLEAN, TEXT, TEXT, TEXT, INT, TEXT, TEXT
);

CREATE FUNCTION public.create_car_with_ownership(
  p_slug                  TEXT,
  p_model_id              UUID,
  p_custom_make           TEXT,
  p_custom_model          TEXT,
  p_custom_generation     TEXT,
  p_year                  INT,
  p_engine                TEXT,
  p_transmission          TEXT,
  p_color                 TEXT,
  p_nickname              TEXT,
  p_location              TEXT,
  p_visibility            TEXT,
  p_cover_photo_path      TEXT,
  p_start_date            DATE,
  p_purchase_price        NUMERIC,
  p_purchase_price_public BOOLEAN,
  p_currency              TEXT,
  -- New structured car fields (default NULL for backward compat)
  p_fuel                  TEXT    DEFAULT NULL,
  p_drivetrain            TEXT    DEFAULT NULL,
  p_horsepower            INT     DEFAULT NULL,
  p_body_type             TEXT    DEFAULT NULL,
  p_acquisition_condition TEXT    DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_car_id  UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO public.cars (
    slug, current_owner_id, model_id,
    custom_make, custom_model, custom_generation,
    year, engine, transmission, color, nickname, location,
    visibility, cover_photo_path,
    fuel, drivetrain, horsepower, body_type
  ) VALUES (
    p_slug, v_user_id, p_model_id,
    p_custom_make, p_custom_model, p_custom_generation,
    p_year, p_engine, p_transmission, p_color, p_nickname, p_location,
    p_visibility::public.car_visibility, p_cover_photo_path,
    p_fuel, p_drivetrain, p_horsepower, p_body_type
  )
  RETURNING id INTO v_car_id;

  INSERT INTO public.ownerships (
    car_id, user_id, start_date,
    purchase_price, purchase_price_public, currency,
    acquisition_condition
  ) VALUES (
    v_car_id, v_user_id, p_start_date,
    p_purchase_price, p_purchase_price_public, p_currency,
    p_acquisition_condition
  );

  RETURN jsonb_build_object('id', v_car_id, 'slug', p_slug);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_car_with_ownership TO authenticated;
