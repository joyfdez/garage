-- Volkswagen Tiguan — 3 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Volkswagen', 'Tiguan', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('5N',    '5N',       2007, 2016,         ARRAY['1.4 TSI','2.0 TSI','2.0 TDI']::text[],               'volkswagen-tiguan-5n'),
  ('AD1',   'AD1',      2016, 2023,         ARRAY['1.4 TSI','1.5 TSI','2.0 TSI','2.0 TDI']::text[],    'volkswagen-tiguan-ad1'),
  ('Gen 3', NULL::text, 2023, NULL::integer, ARRAY['1.5 TSI','2.0 TSI','1.5 eTSI']::text[],            'volkswagen-tiguan-gen-3')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'volkswagen-tiguan'
ON CONFLICT (slug) DO NOTHING;

-- Volkswagen Touareg — 3 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Volkswagen', 'Touareg', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('7L', '7L', 2002, 2010,         ARRAY['3.2 V6','4.2 V8','5.0 V10 TDI','3.0 TDI','6.0 W12']::text[], 'volkswagen-touareg-7l'),
  ('7P', '7P', 2010, 2018,         ARRAY['3.0 TSI','4.2 V8','3.0 TDI','4.2 TDI']::text[],              'volkswagen-touareg-7p'),
  ('CR', 'CR', 2018, NULL::integer, ARRAY['3.0 TSI','4.0 V8 TSI','3.0 TDI']::text[],                   'volkswagen-touareg-cr')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'volkswagen-touareg'
ON CONFLICT (slug) DO NOTHING;

-- Volkswagen Amarok — 2 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Volkswagen', 'Amarok', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('2H',    '2H',       2010, 2022,         ARRAY['2.0 TDI','2.0 BiTDI','3.0 TDI','3.6 V6']::text[], 'volkswagen-amarok-2h'),
  ('Gen 2', NULL::text, 2022, NULL::integer, ARRAY['2.0 EcoBlue','3.0 TDI V6']::text[],              'volkswagen-amarok-gen-2')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'volkswagen-amarok'
ON CONFLICT (slug) DO NOTHING;

-- Volkswagen Type 2 — 3 generations (T1 Split Window, T2 Bay Window, T3 Vanagon/Caravelle)
-- T4 onward is sold as Transporter, not Type 2.

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Volkswagen', 'Type 2', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('T1', 'T1', 1950, 1967, ARRAY['1.1','1.2','1.5','1.6']::text[],                                      'volkswagen-type-2-t1'),
  ('T2', 'T2', 1967, 1979, ARRAY['1.6','1.7','1.8','2.0','1.9D']::text[],                               'volkswagen-type-2-t2'),
  ('T3', 'T3', 1979, 1992, ARRAY['1.6 air-cooled','1.6 Wasserboxer','1.9D','2.1 Wasserboxer']::text[], 'volkswagen-type-2-t3')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'volkswagen-type-2'
ON CONFLICT (slug) DO NOTHING;

-- Volkswagen Passat NMS — 1 generation added to existing model
-- North American Market Specification (Chattanooga, TN); parallel to B7/B8 European Passat.

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Volkswagen', 'Passat', 'NMS', 'A32', 2011, 2019,
  ARRAY['1.8T','2.5','3.6 V6','2.0 TDI']::text[],
  'volkswagen-passat-nms',
  m.id
FROM public.models m
WHERE m.slug = 'volkswagen-passat'
ON CONFLICT (slug) DO NOTHING;
