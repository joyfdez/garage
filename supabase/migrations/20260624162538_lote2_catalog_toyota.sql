-- Lote 2: Toyota — 4 new models, 20 new generation rows
-- Hilux (8), Tacoma (3), 4Runner (5), Yaris (4)
-- Pure INSERT — no existing rows touched.

-- ─── Step 1: new model entities ──────────────────────────────────────────────

INSERT INTO public.models (make_id, name, slug)
SELECT mk.id, v.name, v.slug
FROM (VALUES
  ('Toyota'::text, 'Hilux'::text,  'toyota-hilux'::text),
  ('Toyota',       'Tacoma',        'toyota-tacoma'),
  ('Toyota',       '4Runner',       'toyota-4runner'),
  ('Toyota',       'Yaris',         'toyota-yaris')
) AS v(make_name, name, slug)
JOIN public.makes mk ON mk.name = v.make_name;

-- ─── Step 2: new generation rows ─────────────────────────────────────────────

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT v.make, v.model, v.generation, v.chassis_code, v.year_start, v.year_end, v.engines, v.slug, m.id
FROM (VALUES
  -- ── Toyota / Hilux ──────────────────────────────────────────────────────────
  ('Toyota'::text, 'Hilux'::text, 'N10'::text,   'RN10'::text,       1968::int, 1972::int,    ARRAY['2R']::text[],                                          'toyota-hilux-n10'::text),
  ('Toyota',       'Hilux',       'N20',          'RN20',             1972,      1978,         ARRAY['12R','18R'],                                           'toyota-hilux-n20'),
  ('Toyota',       'Hilux',       'N30',          'RN30/RN40',        1978,      1983,         ARRAY['20R','2R-C','L diesel'],                               'toyota-hilux-n30'),
  ('Toyota',       'Hilux',       'N50',          'N50',              1983,      1988,         ARRAY['22R','2Y','L diesel'],                                 'toyota-hilux-n50'),
  ('Toyota',       'Hilux',       'N80',          'N80',              1988,      1997,         ARRAY['22R-E','2L diesel','3L diesel'],                       'toyota-hilux-n80'),
  ('Toyota',       'Hilux',       'N150',         NULL::text,         1997,      2004,         ARRAY['2RZ-FE','1KZ-TE diesel'],                              'toyota-hilux-n150'),
  ('Toyota',       'Hilux',       'Vigo',         'KUN/GGN',          2004,      2015,         ARRAY['2TR-FE','1GR-FE','1KD-FTV','2KD-FTV'],                'toyota-hilux-vigo'),
  ('Toyota',       'Hilux',       'Revo',         'GUN',              2015,      NULL::int,    ARRAY['2GD-FTV','1GR-FE'],                                    'toyota-hilux-revo'),
  -- ── Toyota / Tacoma ─────────────────────────────────────────────────────────
  ('Toyota',       'Tacoma',      'Gen 1',        NULL::text,         1995,      2004,         ARRAY['2RZ-FE 2.4','5VZ-FE 3.4 V6'],                         'toyota-tacoma-gen1'),
  ('Toyota',       'Tacoma',      'Gen 2',        NULL::text,         2005,      2015,         ARRAY['2TR-FE 2.7','1GR-FE 4.0 V6'],                         'toyota-tacoma-gen2'),
  ('Toyota',       'Tacoma',      'Gen 3',        NULL::text,         2016,      NULL::int,    ARRAY['2GR-FKS 3.5 V6'],                                      'toyota-tacoma-gen3'),
  -- ── Toyota / 4Runner ────────────────────────────────────────────────────────
  ('Toyota',       '4Runner',     'N60',          'N60',              1984,      1989,         ARRAY['22R','22R-E','3Y','2L diesel'],                        'toyota-4runner-n60'),
  ('Toyota',       '4Runner',     'N130',         'N130',             1989,      1995,         ARRAY['3VZ-E 3.0 V6','22R-E','1KZ-TE diesel'],                'toyota-4runner-n130'),
  ('Toyota',       '4Runner',     'N180',         'N180',             1995,      2002,         ARRAY['5VZ-FE 3.4 V6','3RZ-FE 2.7'],                         'toyota-4runner-n180'),
  ('Toyota',       '4Runner',     'N210',         'N210',             2002,      2009,         ARRAY['1GR-FE 4.0 V6','2UZ-FE 4.7 V8'],                      'toyota-4runner-n210'),
  ('Toyota',       '4Runner',     'N280',         'N280',             2009,      NULL::int,    ARRAY['1GR-FE 4.0 V6'],                                       'toyota-4runner-n280'),
  -- ── Toyota / Yaris ──────────────────────────────────────────────────────────
  -- Note: GR Yaris (GXPA16) is already in the catalog as a separate model.
  ('Toyota',       'Yaris',       'XP10',         'XP10',             1999,      2005,         ARRAY['1.0 1SZ-FE','1.3 2NZ-FE'],                            'toyota-yaris-xp10'),
  ('Toyota',       'Yaris',       'XP90',         'XP90',             2005,      2011,         ARRAY['1.0 1KR-FE','1.3 2NZ-FE','1.5 1NZ-FE'],               'toyota-yaris-xp90'),
  ('Toyota',       'Yaris',       'XP130',        'XP130',            2011,      2020,         ARRAY['1.0 1KR-FE','1.3 1NR-FE','1.5 1NZ-FE'],               'toyota-yaris-xp130'),
  ('Toyota',       'Yaris',       'XP210',        'XP210',            2020,      NULL::int,    ARRAY['1.5 M15A-FKS','1.5 M15A-FXE hybrid'],                 'toyota-yaris-xp210')
) AS v(make, model, generation, chassis_code, year_start, year_end, engines, slug)
JOIN public.models m  ON m.name  = v.model
JOIN public.makes  mk ON mk.id   = m.make_id AND mk.name = v.make;
