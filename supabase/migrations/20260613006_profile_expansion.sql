-- Profile expansion: new fields + account self-deletion function

ALTER TABLE public.profiles
  ADD COLUMN first_name       TEXT,
  ADD COLUMN last_name        TEXT,
  ADD COLUMN country          TEXT,
  ADD COLUMN gender           TEXT,
  ADD COLUMN birthday         DATE,
  ADD COLUMN cover_photo_path TEXT;

-- SECURITY DEFINER function so a user can delete their own auth record.
-- We first delete their cars (FK cars.current_owner_id → profiles.id ON DELETE RESTRICT
-- would otherwise block the cascade from auth.users → profiles → nothing).
-- Cascade order: cars → car_events / photos / ownerships / car_vins (all ON DELETE CASCADE)
--                auth.users → profiles (ON DELETE CASCADE)
CREATE OR REPLACE FUNCTION public.delete_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove cars so the RESTRICT FK on profiles is satisfied
  DELETE FROM public.cars WHERE current_owner_id = auth.uid();
  -- Remove auth row; profile cascades automatically
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Only authenticated users can call this; auth.uid() inside limits it to themselves
GRANT EXECUTE ON FUNCTION public.delete_current_user() TO authenticated;
