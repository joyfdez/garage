-- Lote 2: Volkswagen — 10 new models, 31 new generation rows
-- Jetta (7), Polo (6), Passat (9), Bora (1), Karmann Ghia (2),
-- New Beetle (2), Brasilia (1), Caribe (1), Beetle (1), Vocho (1)
-- Pure INSERT — no existing rows touched.

-- ─── Step 1: new model entities ──────────────────────────────────────────────

INSERT INTO public.models (make_id, name, slug)
SELECT mk.id, v.name, v.slug
FROM (VALUES
  ('Volkswagen'::text, 'Jetta'::text,        'volkswagen-jetta'::text),
  ('Volkswagen',       'Polo',               'volkswagen-polo'),
  ('Volkswagen',       'Passat',             'volkswagen-passat'),
  ('Volkswagen',       'Bora',               'volkswagen-bora'),
  ('Volkswagen',       'Karmann Ghia',       'volkswagen-karmann-ghia'),
  ('Volkswagen',       'New Beetle',         'volkswagen-new-beetle'),
  ('Volkswagen',       'Brasilia',           'volkswagen-brasilia'),
  ('Volkswagen',       'Caribe',             'volkswagen-caribe'),
  ('Volkswagen',       'Beetle',             'volkswagen-beetle'),
  ('Volkswagen',       'Vocho',              'volkswagen-vocho')
) AS v(make_name, name, slug)
JOIN public.makes mk ON mk.name = v.make_name;

-- ─── Step 2: new generation rows ─────────────────────────────────────────────

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT v.make, v.model, v.generation, v.chassis_code, v.year_start, v.year_end, v.engines, v.slug, m.id
FROM (VALUES
  -- ── Volkswagen / Jetta ───────────────────────────────────────────────────────
  -- Bora (European Jetta Mk4) is a separate model below. Mk4 here = NA/Mexico market.
  ('Volkswagen'::text, 'Jetta'::text, 'Mk1'::text, '16'::text,       1979::int, 1984::int,    ARRAY['1.1','1.3','1.5','1.6','1.5 diesel']::text[],          'volkswagen-jetta-mk1'::text),
  ('Volkswagen', 'Jetta', 'Mk2',  NULL::text,   1984, 1992,       ARRAY['1.0','1.3','1.6','1.8','2.0','1.6 TD'],                'volkswagen-jetta-mk2'),
  ('Volkswagen', 'Jetta', 'Mk3',  NULL::text,   1992, 1999,       ARRAY['1.4','1.6','1.8','2.0','2.8 VR6','1.9 TDI'],          'volkswagen-jetta-mk3'),
  ('Volkswagen', 'Jetta', 'Mk4',  '1J',         1999, 2005,       ARRAY['1.6','1.8T','2.0','2.3 V5','2.8 V6','1.9 TDI'],      'volkswagen-jetta-mk4'),
  ('Volkswagen', 'Jetta', 'Mk5',  NULL::text,   2005, 2010,       ARRAY['1.4','1.6','1.8T','2.0T FSI','2.5','1.9 TDI'],       'volkswagen-jetta-mk5'),
  ('Volkswagen', 'Jetta', 'Mk6',  NULL::text,   2010, 2018,       ARRAY['1.4 TSI','1.8T','2.5','2.0 TDI'],                    'volkswagen-jetta-mk6'),
  ('Volkswagen', 'Jetta', 'Mk7',  NULL::text,   2018, NULL::int,  ARRAY['1.4 TSI','1.5 eTSI','2.0 TDI'],                      'volkswagen-jetta-mk7'),
  -- ── Volkswagen / Polo ────────────────────────────────────────────────────────
  -- Polo GTI (9N and 6R) already in catalog as separate model "Polo GTI".
  ('Volkswagen', 'Polo', 'Mk1',  '86',         1975, 1981,        ARRAY['0.9','1.1'],                                          'volkswagen-polo-mk1'),
  ('Volkswagen', 'Polo', 'Mk2',  '86C',        1981, 1994,        ARRAY['1.0','1.3','1.3 diesel'],                             'volkswagen-polo-mk2'),
  ('Volkswagen', 'Polo', 'Mk3',  '6N',         1994, 2001,        ARRAY['1.0','1.4','1.6','1.7 SDi','1.9 TDI'],               'volkswagen-polo-mk3'),
  ('Volkswagen', 'Polo', 'Mk4',  '9N',         2001, 2009,        ARRAY['1.2','1.4','1.6','1.4 TDI','1.9 TDI'],               'volkswagen-polo-mk4'),
  ('Volkswagen', 'Polo', 'Mk5',  '6R',         2009, 2017,        ARRAY['1.0','1.2 TSI','1.4 TSI','1.2 TDI','1.6 TDI'],      'volkswagen-polo-mk5'),
  ('Volkswagen', 'Polo', 'Mk6',  'AW',         2017, NULL::int,   ARRAY['1.0 MPI','1.0 TSI','1.5 TSI','1.6 TDI'],             'volkswagen-polo-mk6'),
  -- ── Volkswagen / Passat ──────────────────────────────────────────────────────
  -- B5.5 and B7 share chassis code with B5/B6 respectively — they are platform facelifts.
  ('Volkswagen', 'Passat', 'B1',   '32',        1973, 1980,        ARRAY['1.3','1.5','1.6','1.5 diesel'],                      'volkswagen-passat-b1'),
  ('Volkswagen', 'Passat', 'B2',   '32B',       1980, 1988,        ARRAY['1.3','1.5','1.6','1.8','2.0','1.6 diesel'],          'volkswagen-passat-b2'),
  ('Volkswagen', 'Passat', 'B3',   '3A',        1988, 1993,        ARRAY['1.4','1.6','1.8 G60','2.0','2.8 VR6','1.9 TDI'],    'volkswagen-passat-b3'),
  ('Volkswagen', 'Passat', 'B4',   '3A2',       1993, 1997,        ARRAY['1.6','1.8','2.0','2.8 VR6','1.9 TDI'],              'volkswagen-passat-b4'),
  ('Volkswagen', 'Passat', 'B5',   '3B',        1996, 2000,        ARRAY['1.6','1.8T','2.0','2.3 V5','2.8 V6','1.9 TDI'],     'volkswagen-passat-b5'),
  ('Volkswagen', 'Passat', 'B5.5', '3B',        2000, 2005,        ARRAY['1.6','1.8T','2.0','2.5 TDI','2.0 TDI'],             'volkswagen-passat-b5-5'),
  ('Volkswagen', 'Passat', 'B6',   '3C',        2005, 2010,        ARRAY['1.4 TSI','1.8T','2.0 TSI','3.2 V6','2.0 TDI'],      'volkswagen-passat-b6'),
  ('Volkswagen', 'Passat', 'B7',   '3C',        2010, 2014,        ARRAY['1.4 TSI','1.8T','2.0 TSI','2.0 TDI'],               'volkswagen-passat-b7'),
  ('Volkswagen', 'Passat', 'B8',   '3G',        2014, NULL::int,   ARRAY['1.4 TSI','1.8 TSI','2.0 TSI','1.6 TDI','2.0 TDI'], 'volkswagen-passat-b8'),
  -- ── Volkswagen / Bora ────────────────────────────────────────────────────────
  -- European/Southern Cone name for the Jetta Mk4. Same 1J platform as Golf Mk4.
  ('Volkswagen', 'Bora',        'Gen 1',  '1J',        1998, 2005,       ARRAY['1.6','1.8T','2.0','2.3 V5','2.8 V6','1.9 TDI'],   'volkswagen-bora-gen1'),
  -- ── Volkswagen / Karmann Ghia ────────────────────────────────────────────────
  ('Volkswagen', 'Karmann Ghia', 'Type 14', '14',      1955, 1974,       ARRAY['1.0','1.2','1.3','1.5','1.6 flat-4'],              'volkswagen-karmann-ghia-type14'),
  ('Volkswagen', 'Karmann Ghia', 'Type 34', '34',      1961, 1969,       ARRAY['1.5','1.6 flat-4'],                               'volkswagen-karmann-ghia-type34'),
  -- ── Volkswagen / New Beetle (modern) ─────────────────────────────────────────
  ('Volkswagen', 'New Beetle',  '9C',     '9C',        1997, 2011,        ARRAY['1.6','1.8T','2.0','1.9 TDI','Turbo S'],           'volkswagen-new-beetle-9c'),
  ('Volkswagen', 'New Beetle',  '5C',     '5C',        2011, 2019,        ARRAY['1.2 TSI','1.4 TSI','2.0 TDI','2.0 TSI'],          'volkswagen-new-beetle-5c'),
  -- ── Volkswagen / Brasilia ────────────────────────────────────────────────────
  ('Volkswagen', 'Brasilia',    'Gen 1',  NULL::text,  1973, 1982,        ARRAY['1.4 flat-4','1.6 flat-4'],                        'volkswagen-brasilia-gen1'),
  -- ── Volkswagen / Caribe (Mexican Golf Mk1, extended to 1987) ─────────────────
  ('Volkswagen', 'Caribe',      'Gen 1',  '17',        1978, 1987,        ARRAY['1.3','1.5','1.6'],                                'volkswagen-caribe-gen1'),
  -- ── Volkswagen / Beetle (classic, worldwide production) ──────────────────────
  ('Volkswagen', 'Beetle',      'Type 1', 'Type 1',    1945, 1978,        ARRAY['1.0','1.1','1.2','1.3','1.5','1.6 flat-4'],       'volkswagen-beetle-type1'),
  -- ── Volkswagen / Vocho (Mexican production era, Puebla 1978–2003) ────────────
  ('Volkswagen', 'Vocho',       'Gen 1',  'Type 1',    1978, 2003,        ARRAY['1.6 flat-4'],                                     'volkswagen-vocho-gen1')
) AS v(make, model, generation, chassis_code, year_start, year_end, engines, slug)
JOIN public.models m  ON m.name  = v.model
JOIN public.makes  mk ON mk.id   = m.make_id AND mk.name = v.make;
