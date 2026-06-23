-- Phase 2: populate makes and models from existing car_models data
-- Reads the current 233-row flat catalog and derives one row per make (36)
-- and one row per (make, model) pair (~128). car_models is not modified.
--
-- Slug generation:
--   1. translate() normalises common accented chars to ASCII (é→e, etc.)
--   2. regexp_replace() collapses any non-alphanumeric run to a single hyphen
--   3. lower() + trim() produce the final slug
--
-- The translate() source/target strings handle: é è ê ë à â ä î ï ô ö ù û ü ç
-- This fixes "Renault Mégane" → "renault-megane" (é stripped incorrectly otherwise).

-- ── Step 1: insert makes ───────────────────────────────────────────────────

INSERT INTO public.makes (name, slug)
SELECT
  make,
  lower(trim(BOTH '-' FROM
    regexp_replace(
      translate(make, 'éèêëàâäîïôöùûüç', 'eeeeaaaiioouuuc'),
      '[^a-zA-Z0-9]+', '-', 'g'
    )
  ))
FROM (
  SELECT DISTINCT make FROM public.car_models ORDER BY make
) distinct_makes;


-- ── Step 2: insert models ──────────────────────────────────────────────────

INSERT INTO public.models (make_id, name, slug)
SELECT
  mk.id,
  cm.model,
  lower(trim(BOTH '-' FROM
    regexp_replace(
      translate(mk.name || '-' || cm.model, 'éèêëàâäîïôöùûüç', 'eeeeaaaiioouuuc'),
      '[^a-zA-Z0-9]+', '-', 'g'
    )
  ))
FROM (
  SELECT DISTINCT make, model FROM public.car_models
) cm
JOIN public.makes mk ON mk.name = cm.make
ORDER BY mk.name, cm.model;
