-- Phase 2: RLS policies
-- All authorization lives here — never solely in app code.

-- ── Enable RLS ─────────────────────────────────────────────────────────────

ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_vins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos     ENABLE ROW LEVEL SECURITY;

-- ── profiles ───────────────────────────────────────────────────────────────

CREATE POLICY "profiles: public read"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles: owner insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: owner update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── car_models ─────────────────────────────────────────────────────────────

CREATE POLICY "car_models: public read"
  ON public.car_models FOR SELECT
  USING (true);

-- ── cars ───────────────────────────────────────────────────────────────────

CREATE POLICY "cars: read public or own"
  ON public.cars FOR SELECT
  USING (visibility = 'public' OR current_owner_id = auth.uid());

CREATE POLICY "cars: owner insert"
  ON public.cars FOR INSERT
  WITH CHECK (current_owner_id = auth.uid());

CREATE POLICY "cars: owner update"
  ON public.cars FOR UPDATE
  USING (current_owner_id = auth.uid());

CREATE POLICY "cars: owner delete"
  ON public.cars FOR DELETE
  USING (current_owner_id = auth.uid());

-- ── car_vins — owner only ──────────────────────────────────────────────────
-- This table is the VIN firewall. Never joined in public queries.

CREATE POLICY "car_vins: owner only"
  ON public.car_vins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_vins.car_id
        AND cars.current_owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_vins.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

-- ── ownerships ─────────────────────────────────────────────────────────────

CREATE POLICY "ownerships: read follows car visibility"
  ON public.ownerships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = ownerships.car_id
        AND (cars.visibility = 'public' OR cars.current_owner_id = auth.uid())
    )
  );

CREATE POLICY "ownerships: car owner insert"
  ON public.ownerships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = ownerships.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

CREATE POLICY "ownerships: car owner update"
  ON public.ownerships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = ownerships.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

-- ── car_events ─────────────────────────────────────────────────────────────

CREATE POLICY "car_events: read follows car visibility"
  ON public.car_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_events.car_id
        AND (cars.visibility = 'public' OR cars.current_owner_id = auth.uid())
    )
  );

CREATE POLICY "car_events: car owner insert"
  ON public.car_events FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_events.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

CREATE POLICY "car_events: car owner update"
  ON public.car_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_events.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

CREATE POLICY "car_events: car owner delete"
  ON public.car_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_events.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

-- ── photos ─────────────────────────────────────────────────────────────────

CREATE POLICY "photos: read follows car visibility"
  ON public.photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = photos.car_id
        AND (cars.visibility = 'public' OR cars.current_owner_id = auth.uid())
    )
  );

CREATE POLICY "photos: car owner insert"
  ON public.photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = photos.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

CREATE POLICY "photos: car owner update"
  ON public.photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = photos.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

CREATE POLICY "photos: car owner delete"
  ON public.photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = photos.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

-- ── Grants ─────────────────────────────────────────────────────────────────
-- anon gets read access where RLS allows it.
-- authenticated gets full DML, gated by RLS.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.profiles   TO anon, authenticated;
GRANT SELECT ON public.car_models TO anon, authenticated;
GRANT SELECT ON public.cars       TO anon, authenticated;
GRANT SELECT ON public.ownerships TO anon, authenticated;
GRANT SELECT ON public.car_events TO anon, authenticated;
GRANT SELECT ON public.photos     TO anon, authenticated;

GRANT INSERT, UPDATE         ON public.profiles   TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cars       TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.car_vins   TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ownerships TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.car_events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.photos     TO authenticated;
