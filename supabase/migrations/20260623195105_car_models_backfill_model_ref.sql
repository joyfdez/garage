-- Phase 3b: backfill car_models.model_ref_id
--
-- Matches each generation row to its parent models row by joining on the
-- existing make/model text columns. car_models.id values are not touched.
--
-- Run the verification queries below BEFORE Phase 3c (NOT NULL).

UPDATE public.car_models cm
SET model_ref_id = m.id
FROM public.models m
JOIN public.makes mk ON mk.id = m.make_id
WHERE cm.make  = mk.name
  AND cm.model = m.name;

-- ── Verify before continuing to Phase 3c ──────────────────────────────────
--
-- 1. Should return 0 rows. Any row here means a (make, model) pair in
--    car_models has no matching entry in models — stop and investigate.
--
--    SELECT id, make, model, generation, slug
--    FROM public.car_models
--    WHERE model_ref_id IS NULL;
--
-- 2. Row count must still be 233.
--
--    SELECT count(*) FROM public.car_models;
--
-- 3. Diff against the before snapshot to confirm no id changed.
--
--    SELECT id, slug FROM public.car_models ORDER BY slug;
