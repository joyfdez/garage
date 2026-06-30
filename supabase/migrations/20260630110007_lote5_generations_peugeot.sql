-- Peugeot — 7 new models (207 and 306 already in catalog, skipped)

-- Peugeot 206 — 1 generation

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Peugeot', '206', 'T1', 'T1', 1998, 2010,
  ARRAY['1.1','1.4','1.6','2.0 GTi','1.4 HDi','1.6 HDi']::text[],
  'peugeot-206-t1',
  m.id
FROM public.models m
WHERE m.slug = 'peugeot-206'
ON CONFLICT (slug) DO NOTHING;

-- Peugeot 208 — 2 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Peugeot', '208', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('A9',    'A9',       2012, 2019,         ARRAY['1.0','1.2 PureTech','1.4','1.6 GTi','1.4 HDi','1.6 e-HDi']::text[], 'peugeot-208-a9'),
  ('Gen 2', NULL::text, 2019, NULL::integer, ARRAY['1.2 PureTech','1.5 BlueHDi','electric']::text[],                   'peugeot-208-gen-2')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'peugeot-208'
ON CONFLICT (slug) DO NOTHING;

-- Peugeot 307 — 1 generation

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Peugeot', '307', 'T5', 'T5', 2001, 2008,
  ARRAY['1.4','1.6','2.0','2.0 HDi']::text[],
  'peugeot-307-t5',
  m.id
FROM public.models m
WHERE m.slug = 'peugeot-307'
ON CONFLICT (slug) DO NOTHING;

-- Peugeot 308 — 3 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Peugeot', '308', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('T7',    'T7',       2007, 2013,         ARRAY['1.4','1.6 THP','2.0','1.6 HDi','2.0 HDi']::text[],            'peugeot-308-t7'),
  ('T9',    'T9',       2013, 2021,         ARRAY['1.2 PureTech','1.6 THP','1.5 BlueHDi','2.0 BlueHDi']::text[], 'peugeot-308-t9'),
  ('Gen 3', NULL::text, 2021, NULL::integer, ARRAY['1.2 PureTech','1.5 BlueHDi','PHEV','electric']::text[],      'peugeot-308-gen-3')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'peugeot-308'
ON CONFLICT (slug) DO NOTHING;

-- Peugeot 3008 — 3 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Peugeot', '3008', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('T84',   'T84',      2008, 2016,         ARRAY['1.6 THP','2.0 HDi','2.2 HDi']::text[],                                       'peugeot-3008-t84'),
  ('Gen 2', NULL::text, 2016, 2022,         ARRAY['1.2 PureTech','1.6 THP','1.5 BlueHDi','2.0 BlueHDi','PHEV']::text[],         'peugeot-3008-gen-2'),
  ('Gen 3', NULL::text, 2023, NULL::integer, ARRAY['1.2 PureTech','1.5 BlueHDi','electric']::text[],                             'peugeot-3008-gen-3')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'peugeot-3008'
ON CONFLICT (slug) DO NOTHING;

-- Peugeot 5008 — 3 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Peugeot', '5008', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('T87',   'T87',      2009, 2016,         ARRAY['1.6 THP','2.0 HDi','1.6 HDi']::text[],                        'peugeot-5008-t87'),
  ('Gen 2', NULL::text, 2016, 2022,         ARRAY['1.2 PureTech','1.6 THP','1.5 BlueHDi','2.0 BlueHDi']::text[], 'peugeot-5008-gen-2'),
  ('Gen 3', NULL::text, 2023, NULL::integer, ARRAY['1.2 PureTech','PHEV','electric']::text[],                    'peugeot-5008-gen-3')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'peugeot-5008'
ON CONFLICT (slug) DO NOTHING;

-- Peugeot 2008 — 2 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Peugeot', '2008', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('A94',   'A94',      2013, 2019,         ARRAY['1.2','1.6','1.6 e-HDi','1.5 BlueHDi']::text[],   'peugeot-2008-a94'),
  ('Gen 2', NULL::text, 2019, NULL::integer, ARRAY['1.2 PureTech','1.5 BlueHDi','electric']::text[], 'peugeot-2008-gen-2')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'peugeot-2008'
ON CONFLICT (slug) DO NOTHING;
