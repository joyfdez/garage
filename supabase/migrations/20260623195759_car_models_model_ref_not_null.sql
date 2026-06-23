-- Phase 3c: lock in model_ref_id as NOT NULL
--
-- Only safe to run after Phase 3b verification confirmed 0 NULL rows.
-- Any future INSERT into car_models must supply a valid model_ref_id.

ALTER TABLE public.car_models
  ALTER COLUMN model_ref_id SET NOT NULL;
