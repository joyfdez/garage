-- Mercedes-Benz G-Class — 3 generations
-- W460 and W463 overlapped 1990-1991 (genuine concurrent production).

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Mercedes-Benz', 'G-Class', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('W460',  'W460',  1979, 1991,         ARRAY['2.3','2.8','2.3D','3.0D']::text[],                                            'mercedes-benz-g-class-w460'),
  ('W463',  'W463',  1990, 2018,         ARRAY['2.3','3.2','4.2 V8','5.0 V8','2.7 CDI','3.0 CDI','AMG 55','AMG 63']::text[], 'mercedes-benz-g-class-w463'),
  ('W463A', 'W463A', 2018, NULL::integer, ARRAY['4.0 V8 Biturbo','G 500','G 400d','AMG G63']::text[],                        'mercedes-benz-g-class-w463a')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'mercedes-benz-g-class'
ON CONFLICT (slug) DO NOTHING;

-- Mercedes-Benz GLC — 2 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Mercedes-Benz', 'GLC', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('X253', 'X253', 2015, 2022,         ARRAY['2.0 Turbo','3.0 V6','2.1 CDI','2.0 CDI','GLC 43','GLC 63']::text[], 'mercedes-benz-glc-x253'),
  ('X254', 'X254', 2022, NULL::integer, ARRAY['2.0 Turbo','2.0 CDI','GLC 43','GLC 63']::text[],                   'mercedes-benz-glc-x254')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'mercedes-benz-glc'
ON CONFLICT (slug) DO NOTHING;

-- Mercedes-Benz A-Class — 4 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Mercedes-Benz', 'A-Class', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('W168', 'W168', 1997, 2004,         ARRAY['1.4','1.6','1.9','1.7 CDI']::text[],                           'mercedes-benz-a-class-w168'),
  ('W169', 'W169', 2004, 2012,         ARRAY['1.5','1.6','2.0','1.7 CDI','2.0 CDI']::text[],                 'mercedes-benz-a-class-w169'),
  ('W176', 'W176', 2012, 2018,         ARRAY['1.6','2.0','1.5 CDI','2.1 CDI','AMG 45']::text[],              'mercedes-benz-a-class-w176'),
  ('W177', 'W177', 2018, NULL::integer, ARRAY['1.3','2.0 Turbo','1.5 EQ Boost','AMG A45 S']::text[],         'mercedes-benz-a-class-w177')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'mercedes-benz-a-class'
ON CONFLICT (slug) DO NOTHING;

-- Mercedes-Benz B-Class — 3 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Mercedes-Benz', 'B-Class', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('W245', 'W245', 2005, 2011,         ARRAY['1.5','1.7','2.0','2.0 CDI']::text[],                  'mercedes-benz-b-class-w245'),
  ('W246', 'W246', 2011, 2018,         ARRAY['1.6','2.0','1.8 CDI','2.2 CDI','250e']::text[],       'mercedes-benz-b-class-w246'),
  ('W247', 'W247', 2018, NULL::integer, ARRAY['1.3','1.5','2.0','1.5 CDI','2.0 CDI','250e']::text[], 'mercedes-benz-b-class-w247')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'mercedes-benz-b-class'
ON CONFLICT (slug) DO NOTHING;
