-- Security fix (audit Tier 1): two UPDATE policies were missing WITH CHECK clauses,
-- letting the USING condition alone govern both which rows can be touched and what
-- they can be changed to.

-- 1) ownerships: car owner update
-- USING only confirmed the car's CURRENT owner was acting — it never constrained
-- ownerships.user_id, so the current owner could rewrite ANY historical ownership
-- row (including a previous owner's), reassigning user_id, prices, price-visibility
-- flags, or dates. This breaks the immutable-provenance guarantee of the ownership
-- timeline. Mirrors the WITH CHECK already added to the INSERT policy in
-- 20260622135626_fix_ownerships_insert_user_id_check.sql: the row being written
-- must belong to the acting user.
DROP POLICY IF EXISTS "ownerships: car owner update" ON public.ownerships;

CREATE POLICY "ownerships: car owner update"
  ON public.ownerships
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = ownerships.car_id
        AND cars.current_owner_id = auth.uid()
    )
  )
  WITH CHECK (
    (ownerships.user_id = auth.uid())
    AND (EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = ownerships.car_id
        AND cars.current_owner_id = auth.uid()
    ))
  );

-- 2) cars: owner update
-- USING only checked the car's owner at read time — it never constrained the
-- resulting current_owner_id, so an owner could set it to any UUID via a raw
-- update, silently "transferring" the car with no consent from the receiving
-- user. WITH CHECK keeps current_owner_id pinned to the acting user; a real,
-- deliberate transfer flow is a separate future feature.
DROP POLICY IF EXISTS "cars: owner update" ON public.cars;

CREATE POLICY "cars: owner update"
  ON public.cars
  FOR UPDATE
  USING (current_owner_id = auth.uid())
  WITH CHECK (current_owner_id = auth.uid());
