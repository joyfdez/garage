-- Volvo — 8 new models
-- V70 R already in catalog as its own model; this file adds regular V70.

-- Volvo S40 — 2 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Volvo', 'S40', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('P45', 'P45', 1995, 2003, ARRAY['1.6','1.8','2.0','1.9T','2.0T','1.8D']::text[],            'volvo-s40-p45'),
  ('P1',  'P1',  2004, 2012, ARRAY['1.6','1.8','2.0','2.4','2.5T','T5','1.6D','2.0D']::text[], 'volvo-s40-p1')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'volvo-s40'
ON CONFLICT (slug) DO NOTHING;

-- Volvo S60 — 3 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Volvo', 'S60', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('P2',  'P2',  2001, 2009,         ARRAY['2.0T','2.4T','T5','D5','R']::text[],                       'volvo-s60-p2'),
  ('P3',  'P3',  2010, 2018,         ARRAY['T3','T4','T5','T6','D2','D3','D4','D5','Polestar']::text[], 'volvo-s60-p3'),
  ('SPA', 'SPA', 2018, NULL::integer, ARRAY['T4','T5','T6','B4','B5','T8 PHEV']::text[],               'volvo-s60-spa')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'volvo-s60'
ON CONFLICT (slug) DO NOTHING;

-- Volvo S80 — 2 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Volvo', 'S80', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('P2', 'P2', 1998, 2006, ARRAY['2.4','2.5T','2.8T','T6','D5','2.9']::text[],     'volvo-s80-p2'),
  ('P3', 'P3', 2006, 2016, ARRAY['2.5T','3.2','3.0T','D3','D4','D5','V8']::text[], 'volvo-s80-p3')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'volvo-s80'
ON CONFLICT (slug) DO NOTHING;

-- Volvo C70 — 2 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Volvo', 'C70', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('P80', 'P80', 1996, 2005, ARRAY['2.0T','2.3T','2.4T','2.5T']::text[], 'volvo-c70-p80'),
  ('P1',  'P1',  2005, 2013, ARRAY['2.0T','2.5T','T5','D5']::text[],     'volvo-c70-p1')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'volvo-c70'
ON CONFLICT (slug) DO NOTHING;

-- Volvo V70 — 3 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Volvo', 'V70', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('P80', 'P80', 1996, 2000,         ARRAY['2.0T','2.3T','2.5T','T5 AWD']::text[],  'volvo-v70-p80'),
  ('P2',  'P2',  2000, 2007,         ARRAY['2.0T','2.4T','2.5T','T5','D5']::text[], 'volvo-v70-p2'),
  ('P3',  'P3',  2007, 2016,         ARRAY['1.6D','D3','D4','D5','T5']::text[],     'volvo-v70-p3')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'volvo-v70'
ON CONFLICT (slug) DO NOTHING;

-- Volvo XC40 — 1 generation

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Volvo', 'XC40', 'Gen 1', 'CMA', 2017, NULL,
  ARRAY['T2','T3','T4','T5','D3','D4','B3','B4','Recharge P6']::text[],
  'volvo-xc40-gen-1',
  m.id
FROM public.models m
WHERE m.slug = 'volvo-xc40'
ON CONFLICT (slug) DO NOTHING;

-- Volvo XC60 — 2 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Volvo', 'XC60', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('P3',  'P3',  2008, 2017,         ARRAY['3.0T','2.0T','T5','T6','D3','D4','D5']::text[],         'volvo-xc60-p3'),
  ('SPA', 'SPA', 2017, NULL::integer, ARRAY['T5','T6','T8 PHEV','B4','B5','B6','D4','D5']::text[], 'volvo-xc60-spa')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'volvo-xc60'
ON CONFLICT (slug) DO NOTHING;

-- Volvo XC90 — 2 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Volvo', 'XC90', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('P2',  'P2',  2002, 2014,         ARRAY['2.5T','4.4 V8','T6','D5']::text[],                 'volvo-xc90-p2'),
  ('SPA', 'SPA', 2014, NULL::integer, ARRAY['T5','T6','T8 PHEV','B5','B6','D4','D5']::text[], 'volvo-xc90-spa')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'volvo-xc90'
ON CONFLICT (slug) DO NOTHING;
