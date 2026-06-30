-- Lote 2: Ford — 5 new models, 24 new generation rows
-- Expedition (4), Explorer (6), Excursion (1), F-150 (8), Mondeo (5)
-- F-150 note: "Lobo" was the Mexican market name — same vehicle, single model.
-- Pure INSERT — no existing rows touched.

-- ─── Step 1: new model entities ──────────────────────────────────────────────

INSERT INTO public.models (make_id, name, slug)
SELECT mk.id, v.name, v.slug
FROM (VALUES
  ('Ford'::text, 'Expedition'::text, 'ford-expedition'::text),
  ('Ford',       'Explorer',          'ford-explorer'),
  ('Ford',       'Excursion',         'ford-excursion'),
  ('Ford',       'F-150',             'ford-f-150'),
  ('Ford',       'Mondeo',            'ford-mondeo')
) AS v(make_name, name, slug)
JOIN public.makes mk ON mk.name = v.make_name;

-- ─── Step 2: new generation rows ─────────────────────────────────────────────

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT v.make, v.model, v.generation, v.chassis_code, v.year_start, v.year_end, v.engines, v.slug, m.id
FROM (VALUES
  -- ── Ford / Expedition ────────────────────────────────────────────────────────
  ('Ford'::text, 'Expedition'::text, 'Gen 1'::text, NULL::text,    1997::int, 2002::int,    ARRAY['4.6 V8','5.4 V8']::text[],                                    'ford-expedition-gen1'::text),
  ('Ford', 'Expedition', 'Gen 2',  NULL::text,    2003,      2006,         ARRAY['4.6 V8','5.4 V8'],                                            'ford-expedition-gen2'),
  ('Ford', 'Expedition', 'Gen 3',  NULL::text,    2007,      2017,         ARRAY['5.4 V8','3.5 EcoBoost V6'],                                   'ford-expedition-gen3'),
  ('Ford', 'Expedition', 'Gen 4',  NULL::text,    2018,      NULL::int,    ARRAY['3.5 EcoBoost V6','3.5 EcoBoost V6 HO'],                       'ford-expedition-gen4'),
  -- ── Ford / Explorer ──────────────────────────────────────────────────────────
  ('Ford', 'Explorer',  'Gen 1',  NULL::text,    1991,      1994,         ARRAY['4.0 V6','2.9 V6'],                                            'ford-explorer-gen1'),
  ('Ford', 'Explorer',  'Gen 2',  NULL::text,    1995,      2001,         ARRAY['4.0 V6','5.0 V8'],                                            'ford-explorer-gen2'),
  ('Ford', 'Explorer',  'Gen 3',  NULL::text,    2002,      2005,         ARRAY['4.0 V6','4.6 V8'],                                            'ford-explorer-gen3'),
  ('Ford', 'Explorer',  'Gen 4',  NULL::text,    2006,      2010,         ARRAY['4.0 V6','4.6 V8'],                                            'ford-explorer-gen4'),
  ('Ford', 'Explorer',  'Gen 5',  NULL::text,    2011,      2019,         ARRAY['2.0 EcoBoost','3.5 V6','3.5 EcoBoost'],                       'ford-explorer-gen5'),
  ('Ford', 'Explorer',  'Gen 6',  NULL::text,    2020,      NULL::int,    ARRAY['2.3 EcoBoost','3.0 EcoBoost ST'],                             'ford-explorer-gen6'),
  -- ── Ford / Excursion ─────────────────────────────────────────────────────────
  ('Ford', 'Excursion', 'Gen 1',  NULL::text,    2000,      2005,         ARRAY['5.4 V8','6.8 V10','7.3 PS diesel','6.0 PS diesel'],           'ford-excursion-gen1'),
  -- ── Ford / F-150 ─────────────────────────────────────────────────────────────
  -- "Lobo" = Mexican market name for F-150 through the early 2000s. Same vehicle.
  -- "OBS" = Old Body Style, enthusiast name for the 1987-1996 unified generation.
  ('Ford', 'F-150', '1975-1979',  NULL::text,    1975,      1979,         ARRAY['4.9 I6','5.0 V8','5.8 V8'],                                   'ford-f-150-1975'),
  ('Ford', 'F-150', 'Bullnose',   NULL::text,    1980,      1986,         ARRAY['4.9 I6','5.0 V8','5.8 V8'],                                   'ford-f-150-bullnose'),
  ('Ford', 'F-150', 'OBS',        NULL::text,    1987,      1996,         ARRAY['4.9 I6','5.0 V8','5.8 V8'],                                   'ford-f-150-obs'),
  ('Ford', 'F-150', 'Gen 11',     NULL::text,    1997,      2003,         ARRAY['4.2 V6','4.6 V8','5.4 V8'],                                   'ford-f-150-gen11'),
  ('Ford', 'F-150', 'Gen 12',     NULL::text,    2004,      2008,         ARRAY['4.2 V6','4.6 V8','5.4 V8'],                                   'ford-f-150-gen12'),
  ('Ford', 'F-150', 'Gen 13',     NULL::text,    2009,      2014,         ARRAY['3.7 V6','5.0 V8','5.4 V8','3.5 EcoBoost'],                   'ford-f-150-gen13'),
  ('Ford', 'F-150', 'Gen 14',     NULL::text,    2015,      2020,         ARRAY['2.7 EcoBoost','3.5 EcoBoost','5.0 V8'],                       'ford-f-150-gen14'),
  ('Ford', 'F-150', 'Gen 15',     NULL::text,    2021,      NULL::int,    ARRAY['2.7 EcoBoost','3.5 EcoBoost','5.0 V8','3.5 PowerBoost'],      'ford-f-150-gen15'),
  -- ── Ford / Mondeo ────────────────────────────────────────────────────────────
  ('Ford', 'Mondeo', 'Mk1',  NULL::text,    1992,      1996,         ARRAY['1.6','1.8','2.0','1.8 diesel'],                               'ford-mondeo-mk1'),
  ('Ford', 'Mondeo', 'Mk2',  NULL::text,    1996,      2000,         ARRAY['1.6','1.8','2.0','2.5 V6','1.8 TD'],                          'ford-mondeo-mk2'),
  ('Ford', 'Mondeo', 'Mk3',  NULL::text,    2000,      2007,         ARRAY['1.8','2.0','2.5 V6','ST220 3.0 V6','2.0 TDCi','2.2 TDCi'],  'ford-mondeo-mk3'),
  ('Ford', 'Mondeo', 'Mk4',  NULL::text,    2007,      2014,         ARRAY['1.6 EcoBoost','2.0','ST 2.5T','1.6 TDCi','2.0 TDCi'],       'ford-mondeo-mk4'),
  ('Ford', 'Mondeo', 'Mk5',  NULL::text,    2014,      2022,         ARRAY['1.5 EcoBoost','2.0 EcoBoost','ST 2.0 EcoBoost','2.0 TDCi','2.0 FHEV'], 'ford-mondeo-mk5')
) AS v(make, model, generation, chassis_code, year_start, year_end, engines, slug)
JOIN public.models m  ON m.name  = v.model
JOIN public.makes  mk ON mk.id   = m.make_id AND mk.name = v.make;
