-- Phase: Ownership pricing + history
-- Adds price fields to ownerships and a view that enforces price privacy at the DB level.

ALTER TABLE public.ownerships
  ADD COLUMN purchase_price         NUMERIC,
  ADD COLUMN sale_price             NUMERIC,
  ADD COLUMN currency               TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN purchase_price_public  BOOL NOT NULL DEFAULT false,
  ADD COLUMN sale_price_public      BOOL NOT NULL DEFAULT false;

-- View that masks price columns for non-owners when the _public flag is false.
-- security_invoker: runs under the caller's security context, so the base table's
-- RLS SELECT policy still applies (non-owners can't read ownerships on private cars).
-- The CASE expressions add column-level privacy on top of that.
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
  CASE WHEN purchase_price_public OR user_id = auth.uid()
       THEN purchase_price END AS purchase_price,
  CASE WHEN sale_price_public    OR user_id = auth.uid()
       THEN sale_price    END AS sale_price
FROM public.ownerships;

GRANT SELECT ON public.v_ownerships TO anon, authenticated;
