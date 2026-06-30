-- Ford Escape (North America) — 4 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Ford', 'Escape', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('Gen 1', 'CD2',      2001, 2007,         ARRAY['2.0 Zetec','2.3 Duratec','3.0 V6','2.3 HEV']::text[],           'ford-escape-gen-1'),
  ('Gen 2', NULL::text, 2008, 2012,         ARRAY['2.5','3.0 V6','2.3','2.5 HEV']::text[],                         'ford-escape-gen-2'),
  ('Gen 3', 'C520',     2013, 2019,         ARRAY['1.5 EcoBoost','1.6 EcoBoost','2.0 EcoBoost','2.5 HEV']::text[], 'ford-escape-gen-3'),
  ('Gen 4', NULL::text, 2020, NULL::integer, ARRAY['1.5 EcoBoost','2.0 EcoBoost','PHEV','HEV']::text[],            'ford-escape-gen-4')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'ford-escape'
ON CONFLICT (slug) DO NOTHING;

-- Ford Kuga (Europe) — 3 generations
-- Kuga Gen 1 and Escape Gen 2 share the EUCD platform but are different regional models.
-- Kuga Gen 2 and Escape Gen 3 share C520.

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Ford', 'Kuga', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('Gen 1', 'EUCD',     2008, 2012,         ARRAY['2.0 TDCi','2.5T']::text[],                                                  'ford-kuga-gen-1'),
  ('Gen 2', 'C520',     2013, 2019,         ARRAY['1.5 EcoBoost','2.0 EcoBoost','1.5 TDCi','2.0 TDCi']::text[],               'ford-kuga-gen-2'),
  ('Gen 3', NULL::text, 2020, NULL::integer, ARRAY['1.5 EcoBoost','2.5 PHEV','2.5 HEV','2.0 EcoBlue']::text[],               'ford-kuga-gen-3')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'ford-kuga'
ON CONFLICT (slug) DO NOTHING;
