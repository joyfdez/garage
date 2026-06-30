-- Lote 2: Nissan — 4 new models, 14 new generation rows
-- Tsuru (3), Frontier (3), Pathfinder (5), Murano (3)
-- Pure INSERT — no existing rows touched.

-- ─── Step 1: new model entities ──────────────────────────────────────────────

INSERT INTO public.models (make_id, name, slug)
SELECT mk.id, v.name, v.slug
FROM (VALUES
  ('Nissan'::text, 'Tsuru'::text,  'nissan-tsuru'::text),
  ('Nissan',       'Frontier',     'nissan-frontier'),
  ('Nissan',       'Pathfinder',   'nissan-pathfinder'),
  ('Nissan',       'Murano',       'nissan-murano')
) AS v(make_name, name, slug)
JOIN public.makes mk ON mk.name = v.make_name;

-- ─── Step 2: new generation rows ─────────────────────────────────────────────

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT v.make, v.model, v.generation, v.chassis_code, v.year_start, v.year_end, v.engines, v.slug, m.id
FROM (VALUES
  -- ── Nissan / Tsuru ──────────────────────────────────────────────────────────
  -- Mexico-only nameplate for the Nissan Sunny/Sentra B-series.
  -- B13 (Gen 3) sold in Mexico until June 2017 — long after the global Sentra moved on.
  ('Nissan'::text, 'Tsuru'::text, 'Gen 1'::text, 'B11'::text,  1983::int, 1987::int,    ARRAY['1.3 E13','1.5 E15']::text[],             'nissan-tsuru-gen1'::text),
  ('Nissan',       'Tsuru',       'Gen 2',        'B12',        1987,      1991,         ARRAY['1.6 E16','MA10'],                         'nissan-tsuru-gen2'),
  ('Nissan',       'Tsuru',       'Gen 3',        'B13',        1991,      2017,         ARRAY['1.6 GA16DS','1.6 GA16DE'],                'nissan-tsuru-gen3'),
  -- ── Nissan / Frontier ────────────────────────────────────────────────────────
  -- "Frontier" = NA/LatAm market name for the Nissan Navara.
  -- D22 continued in LatAm/Mexico until ~2016; D40 was the primary US product 2005–2021.
  -- D23 (NP300) launched in LatAm ~2015 and in the US as 2022 MY.
  ('Nissan',       'Frontier',    'D22',          'D22',        1997,      2016,         ARRAY['2.4 KA24DE','3.3 VG33E V6'],             'nissan-frontier-d22'),
  ('Nissan',       'Frontier',    'D40',          'D40',        2005,      2021,         ARRAY['2.5 QR25DE I4','4.0 VQ40DE V6'],         'nissan-frontier-d40'),
  ('Nissan',       'Frontier',    'D23',          'D23',        2015,      NULL::int,    ARRAY['2.5 QR25DE','2.5T KR25DETT'],            'nissan-frontier-d23'),
  -- ── Nissan / Pathfinder ─────────────────────────────────────────────────────
  ('Nissan',       'Pathfinder',  'WD21',         'WD21',       1987,      1995,         ARRAY['2.4 Z24S I4','3.0 VG30E V6'],            'nissan-pathfinder-wd21'),
  ('Nissan',       'Pathfinder',  'R50',          'R50',        1995,      2004,         ARRAY['2.4 KA24DE I4','3.3 VG33E V6'],          'nissan-pathfinder-r50'),
  ('Nissan',       'Pathfinder',  'R51',          'R51',        2004,      2012,         ARRAY['4.0 VQ40DE V6','2.5 YD25DDTi diesel'],   'nissan-pathfinder-r51'),
  ('Nissan',       'Pathfinder',  'R52',          'R52',        2012,      2021,         ARRAY['3.5 VQ35DE V6'],                         'nissan-pathfinder-r52'),
  ('Nissan',       'Pathfinder',  'R53',          'R53',        2021,      NULL::int,    ARRAY['3.5 VQ35DE V6','2.5 KR25DETT hybrid'],   'nissan-pathfinder-r53'),
  -- ── Nissan / Murano ─────────────────────────────────────────────────────────
  ('Nissan',       'Murano',      'Z50',          'Z50',        2002,      2008,         ARRAY['3.5 VQ35DE V6'],                         'nissan-murano-z50'),
  ('Nissan',       'Murano',      'Z51',          'Z51',        2008,      2014,         ARRAY['3.5 VQ35DE V6'],                         'nissan-murano-z51'),
  ('Nissan',       'Murano',      'Z52',          'Z52',        2014,      NULL::int,    ARRAY['3.5 VQ35DE V6'],                         'nissan-murano-z52')
) AS v(make, model, generation, chassis_code, year_start, year_end, engines, slug)
JOIN public.models m  ON m.name  = v.model
JOIN public.makes  mk ON mk.id   = m.make_id AND mk.name = v.make;
