-- Mazda 6 — 3 generations

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Mazda', '6', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('GG', 'GG',        2002, 2007,         ARRAY['1.8','2.0','2.3','3.0 V6','2.0 MZR-CD']::text[],            'mazda-6-gg'),
  ('GH', 'GH',        2007, 2012,         ARRAY['2.0','2.5','2.0 DISI','2.2 SKYACTIV-D']::text[],            'mazda-6-gh'),
  ('GJ', 'GJ',        2012, NULL::integer, ARRAY['2.0 SKYACTIV-G','2.5 SKYACTIV-G','2.2 SKYACTIV-D']::text[], 'mazda-6-gj')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'mazda-6'
ON CONFLICT (slug) DO NOTHING;
