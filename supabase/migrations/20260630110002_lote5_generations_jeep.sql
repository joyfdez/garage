-- Jeep Grand Wagoneer — 2 generations
-- SJ: original Grand Wagoneer (1984 is when the Grand Wagoneer name was used; SJ platform ran 1963-1991).
-- WS: 2022 revival.

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT 'Jeep', 'Grand Wagoneer', v.gen, v.chassis, v.yr_s, v.yr_e, v.engines, v.sl, m.id
FROM public.models m
CROSS JOIN (VALUES
  ('SJ', 'SJ', 1984, 1991,         ARRAY['5.9 V8','5.0 V8']::text[],                   'jeep-grand-wagoneer-sj'),
  ('WS', 'WS', 2022, NULL::integer, ARRAY['6.4 HEMI V8','6.4 HEMI V8 4xe']::text[],    'jeep-grand-wagoneer-ws')
) AS v(gen, chassis, yr_s, yr_e, engines, sl)
WHERE m.slug = 'jeep-grand-wagoneer'
ON CONFLICT (slug) DO NOTHING;
