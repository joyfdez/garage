-- Add purchase mileage to ownerships (odometer reading at time of acquisition).

ALTER TABLE public.ownerships
  ADD COLUMN IF NOT EXISTS purchase_mileage_value INT,
  ADD COLUMN IF NOT EXISTS purchase_mileage_unit  TEXT;

-- Update v_ownerships: add purchase_mileage columns (not sensitive, no masking needed).
-- Must DROP + CREATE because Postgres forbids inserting new columns before existing ones in a replaced view.
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
  CASE WHEN purchase_price_public OR user_id = auth.uid()
       THEN purchase_price END AS purchase_price,
  CASE WHEN sale_price_public    OR user_id = auth.uid()
       THEN sale_price    END AS sale_price
FROM public.ownerships;

GRANT SELECT ON public.v_ownerships TO anon, authenticated;
