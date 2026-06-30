-- Acura Integra — 4 generations
-- No US Acura Gen 4 existed (DC5 sold as RSX in NA); DE5 is the 2023 revival.

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Acura', 'Integra', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('DA',  'DA',  1986, 1989,         ARRAY['1.5','1.6']::text[],           'acura-integra-da'),
  ('DB',  'DB',  1990, 1993,         ARRAY['1.7','1.8']::text[],           'acura-integra-db'),
  ('DC2', 'DC2', 1994, 2001,         ARRAY['1.8 B18B','1.8 B18C']::text[], 'acura-integra-dc2'),
  ('DE5', 'DE5', 2023, NULL::integer, ARRAY['1.5T','2.0T Type S']::text[], 'acura-integra-de5')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'acura-integra'
ON CONFLICT (slug) DO NOTHING;

-- Acura TLX — 2 generations (successor to TL; TL already in catalog)

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Acura', 'TLX', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('UA1', 'UA1', 2015, 2020,         ARRAY['2.4','3.5 V6','2.4 Hybrid']::text[], 'acura-tlx-ua1'),
  ('UB1', 'UB1', 2021, NULL::integer, ARRAY['2.0T','3.0T V6 Type S']::text[],    'acura-tlx-ub1')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'acura-tlx'
ON CONFLICT (slug) DO NOTHING;
