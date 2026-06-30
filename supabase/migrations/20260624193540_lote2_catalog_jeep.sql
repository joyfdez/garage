-- Lote 2: Jeep — 3 new models, 9 new generation rows
-- Cherokee (3), Grand Cherokee (5), Patriot (1)
-- Pure INSERT — no existing rows touched.

-- ─── Step 1: new model entities ──────────────────────────────────────────────

INSERT INTO public.models (make_id, name, slug)
SELECT mk.id, v.name, v.slug
FROM (VALUES
  ('Jeep'::text, 'Cherokee'::text,  'jeep-cherokee'::text),
  ('Jeep',       'Grand Cherokee',   'jeep-grand-cherokee'),
  ('Jeep',       'Patriot',          'jeep-patriot')
) AS v(make_name, name, slug)
JOIN public.makes mk ON mk.name = v.make_name;

-- ─── Step 2: new generation rows ─────────────────────────────────────────────

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT v.make, v.model, v.generation, v.chassis_code, v.year_start, v.year_end, v.engines, v.slug, m.id
FROM (VALUES
  -- ── Jeep / Cherokee ─────────────────────────────────────────────────────────
  -- SJ: original full-size body-on-frame (shared platform with Wagoneer).
  -- XJ: compact unibody — the legendary Cherokee.
  -- KL: modern unibody on CUSW/Dart platform.
  ('Jeep'::text, 'Cherokee'::text,  'SJ'::text, 'SJ'::text,   1974::int, 1983::int,    ARRAY['3.8 I6','4.2 I6','5.0 V8','5.9 V8']::text[],              'jeep-cherokee-sj'::text),
  ('Jeep',       'Cherokee',         'XJ',        'XJ',          1984,      2001,         ARRAY['2.5 I4','4.0 AMC I6','2.1 diesel'],                        'jeep-cherokee-xj'),
  ('Jeep',       'Cherokee',         'KL',        'KL',          2014,      NULL::int,    ARRAY['2.4 Tigershark I4','2.0T','2.0T 4xe'],                     'jeep-cherokee-kl'),
  -- ── Jeep / Grand Cherokee ────────────────────────────────────────────────────
  ('Jeep',       'Grand Cherokee',   'ZJ',        'ZJ',          1992,      1998,         ARRAY['2.5 I4','4.0 AMC I6','5.2 V8','5.9 V8 Ltd'],              'jeep-grand-cherokee-zj'),
  ('Jeep',       'Grand Cherokee',   'WJ',        'WJ',          1999,      2004,         ARRAY['4.0 I6','4.7 V8','4.7 V8 HO'],                            'jeep-grand-cherokee-wj'),
  ('Jeep',       'Grand Cherokee',   'WK',        'WK',          2004,      2010,         ARRAY['3.7 V6','4.7 V8','5.7 Hemi V8','3.0 CRD diesel'],         'jeep-grand-cherokee-wk'),
  ('Jeep',       'Grand Cherokee',   'WK2',       'WK2',         2010,      2021,         ARRAY['3.6 V6','5.7 Hemi V8','6.4 SRT V8','3.0 EcoDiesel'],      'jeep-grand-cherokee-wk2'),
  ('Jeep',       'Grand Cherokee',   'WL',        'WL',          2021,      NULL::int,    ARRAY['3.6 V6','2.0T 4xe hybrid','6.4 SRT'],                     'jeep-grand-cherokee-wl'),
  -- ── Jeep / Patriot ──────────────────────────────────────────────────────────
  -- Single-generation model. Discontinued 2017, replaced by the Compass KP.
  ('Jeep',       'Patriot',          'MK',        'MK',          2007,      2017,         ARRAY['2.0 World Engine I4','2.4 Tigershark I4','2.2 CRD diesel'], 'jeep-patriot-mk')
) AS v(make, model, generation, chassis_code, year_start, year_end, engines, slug)
JOIN public.models m  ON m.name  = v.model
JOIN public.makes  mk ON mk.id   = m.make_id AND mk.name = v.make;
