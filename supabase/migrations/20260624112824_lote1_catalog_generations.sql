-- Lote 1: 24 new generation rows for existing makes and models
-- Pure INSERT — no existing rows touched.
-- model_ref_id resolved via JOIN to makes/models tables (populated in Phase 2).
-- source defaults to 'seed'; id defaults to gen_random_uuid().

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT v.make, v.model, v.generation, v.chassis_code, v.year_start, v.year_end, v.engines, v.slug, m.id
FROM (VALUES
  -- ── BMW / 3 Series (M3 generations) ────────────────────────────────────
  ('BMW'::text,       '3 Series'::text,  'M3 E30'::text,  'E30'::text,  1986::int, 1991::int, ARRAY['S14B20','S14B23 Evo']::text[], 'bmw-m3-e30'::text),
  ('BMW',             '3 Series',        'M3 E36',         'E36',         1992,      1999,      ARRAY['S50B30','S52B32'],             'bmw-m3-e36'),
  ('BMW',             '3 Series',        'M3 E46',         'E46',         2000,      2006,      ARRAY['S54B32'],                      'bmw-m3-e46'),
  -- ── BMW / 5 Series (M5 generations) ────────────────────────────────────
  ('BMW',             '5 Series',        'M5 E28',         'E28',         1985,      1988,      ARRAY['S38B28'],                      'bmw-m5-e28'),
  ('BMW',             '5 Series',        'M5 E34',         'E34',         1988,      1995,      ARRAY['S38B36','S38B38'],             'bmw-m5-e34'),
  ('BMW',             '5 Series',        'M5 E39',         'E39',         1998,      2003,      ARRAY['S62B50'],                      'bmw-m5-e39'),
  ('BMW',             '5 Series',        'M5 E60',         'E60',         2005,      2010,      ARRAY['S85B50'],                      'bmw-m5-e60'),
  -- ── BMW / Z3 (M variants — two separate rows per user direction) ────────
  ('BMW',             'Z3',              'M Roadster',     'E36/7',       1997,      2002,      ARRAY['S52B32','S54B32'],             'bmw-z3-m-roadster'),
  ('BMW',             'Z3',              'M Coupé',        'E36/8',       1998,      2002,      ARRAY['S52B32','S54B32'],             'bmw-z3-m-coupe'),
  -- ── Mercedes-Benz / 190E/W201 (two separate rows per user direction) ───
  ('Mercedes-Benz',   '190E/W201',       '2.3-16',         'W201',        1984,      1988,      ARRAY['190E 2.3-16'],                 'mercedes-w201-23-16'),
  ('Mercedes-Benz',   '190E/W201',       '2.5-16',         'W201',        1988,      1993,      ARRAY['190E 2.5-16'],                 'mercedes-w201-25-16'),
  -- ── Mercedes-Benz / C-Class ─────────────────────────────────────────────
  ('Mercedes-Benz',   'C-Class',         'W203',           'W203',        2000,      2007,      ARRAY['C180K','C200K','C230K','C32 AMG','C55 AMG'], 'mercedes-w203'),
  ('Mercedes-Benz',   'C-Class',         'W204',           'W204',        2007,      2014,      ARRAY['C180CGI','C200CGI','C250','C63 AMG'],        'mercedes-w204'),
  -- ── Mercedes-Benz / E-Class ─────────────────────────────────────────────
  ('Mercedes-Benz',   'E-Class',         'W211',           'W211',        2002,      2009,      ARRAY['E200K','E350','E500','E55 AMG','E63 AMG'],   'mercedes-w211'),
  -- ── Mercedes-Benz / S-Class ─────────────────────────────────────────────
  ('Mercedes-Benz',   'S-Class',         'W140',           'W140',        1991,      1998,      ARRAY['S320','S420','S500','S600'],                 'mercedes-w140'),
  ('Mercedes-Benz',   'S-Class',         'W220',           'W220',        1998,      2005,      ARRAY['S320','S430','S500','S55 AMG','S600'],       'mercedes-w220'),
  -- ── Porsche / 944 ───────────────────────────────────────────────────────
  ('Porsche',         '944',             'Turbo',          '944',         1985,      1991,      ARRAY['M44.51 2.5T'],                 'porsche-944-turbo'),
  ('Porsche',         '944',             'S2',             '944',         1988,      1991,      ARRAY['M44.42 3.0'],                  'porsche-944-s2'),
  -- ── Porsche / Boxster ───────────────────────────────────────────────────
  ('Porsche',         'Boxster',         '981',            '981',         2012,      2016,      ARRAY['2.7 H6','3.4 H6 S'],          'porsche-boxster-981'),
  ('Porsche',         'Boxster',         '718',            '982',         2016,      NULL::int, ARRAY['2.0T H4','2.5T H4 S'],        'porsche-boxster-718'),
  -- ── Porsche / Cayman ────────────────────────────────────────────────────
  ('Porsche',         'Cayman',          '981c',           '981c',        2012,      2016,      ARRAY['2.7 H6','3.4 H6 S'],          'porsche-cayman-981c'),
  ('Porsche',         'Cayman',          '718c',           '982c',        2016,      NULL::int, ARRAY['2.0T H4','2.5T H4 S'],        'porsche-cayman-718c'),
  -- ── Toyota / Supra ──────────────────────────────────────────────────────
  ('Toyota',          'Supra',           'A60',            'MA61',        1981,      1986,      ARRAY['5M-E 2.8','5M-GE 2.8'],       'toyota-supra-a60'),
  -- ── Datsun / 260Z — 280Z North American variant ─────────────────────────
  ('Datsun',          '260Z',            '280Z',           'S30',         1975,      1978,      ARRAY['L28'],                         'datsun-280z-s30')
) AS v(make, model, generation, chassis_code, year_start, year_end, engines, slug)
JOIN public.models m  ON m.name  = v.model
JOIN public.makes  mk ON mk.id   = m.make_id AND mk.name = v.make;
