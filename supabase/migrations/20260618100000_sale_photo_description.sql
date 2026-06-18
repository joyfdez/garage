-- Tanda E: add sale photo path and description to ownerships.
-- These fields back the "Sold" timeline entry, which is derived from the ownership
-- record — so edits and undos automatically keep the timeline in sync.

ALTER TABLE public.ownerships
  ADD COLUMN IF NOT EXISTS sale_photo_path TEXT,
  ADD COLUMN IF NOT EXISTS sale_description TEXT;

-- Recreate v_ownerships to expose the two new columns.
-- Neither column is sensitive, so no masking needed.
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
  purchase_mileage_value,
  purchase_mileage_unit,
  sale_mileage_value,
  sale_mileage_unit,
  sale_photo_path,
  sale_description,
  CASE WHEN purchase_price_public OR user_id = auth.uid()
       THEN purchase_price END AS purchase_price,
  CASE WHEN sale_price_public    OR user_id = auth.uid()
       THEN sale_price    END AS sale_price
FROM public.ownerships;

GRANT SELECT ON public.v_ownerships TO anon, authenticated;
