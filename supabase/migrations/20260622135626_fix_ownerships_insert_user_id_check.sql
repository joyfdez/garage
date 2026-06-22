-- Fix: ownerships INSERT policy now also verifies ownerships.user_id = auth.uid().
-- Previously only checked cars.current_owner_id, allowing a car owner to fabricate
-- ownership records attributed to a different user_id.

DROP POLICY IF EXISTS "ownerships: car owner insert" ON public.ownerships;

CREATE POLICY "ownerships: car owner insert"
  ON public.ownerships
  FOR INSERT
  WITH CHECK (
    (ownerships.user_id = auth.uid())
    AND (EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = ownerships.car_id
        AND cars.current_owner_id = auth.uid()
    ))
  );
