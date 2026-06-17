-- Wraps car + ownership creation in a single transaction.
-- Both rows are committed together or neither is — eliminates the orphan-car risk
-- that existed when the two inserts were separate round-trips.
--
-- auth.uid() is read inside the function so the caller cannot spoof the owner.
-- SECURITY INVOKER (default) means RLS on both tables still applies normally.

CREATE OR REPLACE FUNCTION public.create_car_with_ownership(
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
  p_currency              TEXT
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
    visibility, cover_photo_path
  ) VALUES (
    p_slug, v_user_id, p_model_id,
    p_custom_make, p_custom_model, p_custom_generation,
    p_year, p_engine, p_transmission, p_color, p_nickname, p_location,
    p_visibility::public.car_visibility, p_cover_photo_path
  )
  RETURNING id INTO v_car_id;

  INSERT INTO public.ownerships (
    car_id, user_id, start_date,
    purchase_price, purchase_price_public, currency
  ) VALUES (
    v_car_id, v_user_id, p_start_date,
    p_purchase_price, p_purchase_price_public, p_currency
  );

  RETURN jsonb_build_object('id', v_car_id, 'slug', p_slug);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_car_with_ownership TO authenticated;
