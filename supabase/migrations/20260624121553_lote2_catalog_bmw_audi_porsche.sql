-- Lote 2: 13 new model entities + 44 new generation rows (BMW, Audi, Porsche)
-- Pure INSERT — no existing rows touched.
-- Step 1 must complete before Step 2 so the JOIN resolves the new model_ref_ids.

-- ─── Step 1: new model entities ──────────────────────────────────────────────

INSERT INTO public.models (make_id, name, slug)
SELECT mk.id, v.name, v.slug
FROM (VALUES
  ('BMW'::text,   '7 Series'::text, 'bmw-7-series'::text),
  ('BMW',         '8 Series',       'bmw-8-series'),
  ('BMW',         'X1',             'bmw-x1'),
  ('BMW',         'X3',             'bmw-x3'),
  ('BMW',         'X5',             'bmw-x5'),
  ('Audi',        'R8',             'audi-r8'),
  ('Audi',        'RS4',            'audi-rs4'),
  ('Audi',        'RS6',            'audi-rs6'),
  ('Audi',        'S3',             'audi-s3'),
  ('Audi',        'S4',             'audi-s4'),
  ('Porsche',     '968',            'porsche-968'),
  ('Porsche',     '928',            'porsche-928'),
  ('Porsche',     'Cayenne',        'porsche-cayenne')
) AS v(make_name, name, slug)
JOIN public.makes mk ON mk.name = v.make_name;

-- ─── Step 2: new generation rows ─────────────────────────────────────────────

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT v.make, v.model, v.generation, v.chassis_code, v.year_start, v.year_end, v.engines, v.slug, m.id
FROM (VALUES
  -- ── BMW / 7 Series ──────────────────────────────────────────────────────────
  ('BMW'::text, '7 Series'::text, 'E23'::text,   'E23'::text,     1977::int, 1986::int,    ARRAY['728i','730i','733i','735i','745i']::text[],         'bmw-7-series-e23'::text),
  ('BMW',       '7 Series',       'E32',          'E32',           1986,      1994,         ARRAY['730i','735i','740i','750iL'],                       'bmw-7-series-e32'),
  ('BMW',       '7 Series',       'E38',          'E38',           1994,      2001,         ARRAY['728i','730i','735i','740i','750iL'],                'bmw-7-series-e38'),
  ('BMW',       '7 Series',       'E65',          'E65/E66',       2001,      2008,         ARRAY['730i','740i','745i','750i','760i'],                 'bmw-7-series-e65'),
  ('BMW',       '7 Series',       'F01',          'F01/F02',       2008,      2015,         ARRAY['730i','740i','750i','760i'],                        'bmw-7-series-f01'),
  ('BMW',       '7 Series',       'G11',          'G11/G12',       2015,      2022,         ARRAY['730i','740i','750i','M760i'],                       'bmw-7-series-g11'),
  -- ── BMW / 8 Series ──────────────────────────────────────────────────────────
  ('BMW',       '8 Series',       'E31',          'E31',           1989,      1999,         ARRAY['840Ci 4.0 V8','850i/Ci 5.0 V12','850CSi 5.6 V12'],'bmw-8-series-e31'),
  ('BMW',       '8 Series',       'G15',          'G15/G14',       2018,      NULL::int,    ARRAY['840i','M850i','M8'],                                'bmw-8-series-g15'),
  -- ── BMW / X5 ────────────────────────────────────────────────────────────────
  ('BMW',       'X5',             'E53',          'E53',           1999,      2006,         ARRAY['3.0i','4.4i','4.6is','4.8is'],                     'bmw-x5-e53'),
  ('BMW',       'X5',             'E70',          'E70',           2006,      2013,         ARRAY['30i','35i','50i','30d','35d'],                      'bmw-x5-e70'),
  ('BMW',       'X5',             'F15',          'F15',           2013,      2018,         ARRAY['35i','50i','40e','M50d'],                           'bmw-x5-f15'),
  ('BMW',       'X5',             'G05',          'G05',           2018,      NULL::int,    ARRAY['40i','45e','M50i','M60i'],                          'bmw-x5-g05'),
  -- ── BMW / X3 ────────────────────────────────────────────────────────────────
  ('BMW',       'X3',             'E83',          'E83',           2003,      2010,         ARRAY['2.5i','3.0i','3.0si','2.0d','3.0d'],               'bmw-x3-e83'),
  ('BMW',       'X3',             'F25',          'F25',           2010,      2017,         ARRAY['20i','28i','35i','20d','30d'],                      'bmw-x3-f25'),
  ('BMW',       'X3',             'G01',          'G01',           2017,      NULL::int,    ARRAY['20i','30i','M40i','20d','30d'],                     'bmw-x3-g01'),
  -- ── BMW / X1 ────────────────────────────────────────────────────────────────
  ('BMW',       'X1',             'E84',          'E84',           2009,      2015,         ARRAY['sDrive18i','sDrive20i','xDrive20i','xDrive28i'],    'bmw-x1-e84'),
  ('BMW',       'X1',             'F48',          'F48',           2015,      2022,         ARRAY['18i','25i','28i','20d'],                            'bmw-x1-f48'),
  ('BMW',       'X1',             'U11',          'U11',           2022,      NULL::int,    ARRAY['23i','30i','30e'],                                  'bmw-x1-u11'),
  -- ── Audi / R8 ───────────────────────────────────────────────────────────────
  ('Audi',      'R8',             'Type 42',      '42',            2006,      2015,         ARRAY['4.2 FSI V8','5.2 FSI V10'],                        'audi-r8-type-42'),
  ('Audi',      'R8',             'Type 4S',      '4S',            2015,      2023,         ARRAY['5.2 FSI V10','V10 Performance'],                   'audi-r8-type-4s'),
  -- ── Audi / RS4 ──────────────────────────────────────────────────────────────
  ('Audi',      'RS4',            'B5',           '8D',            2000,      2001,         ARRAY['2.7T V6 biturbo 380hp'],                           'audi-rs4-b5'),
  ('Audi',      'RS4',            'B7',           '8E',            2005,      2008,         ARRAY['4.2 FSI V8 420hp'],                                'audi-rs4-b7'),
  ('Audi',      'RS4',            'B8',           '8K',            2012,      2015,         ARRAY['4.2 FSI V8 450hp'],                                'audi-rs4-b8'),
  ('Audi',      'RS4',            'B9',           '8W',            2017,      NULL::int,    ARRAY['2.9 TFSI V6 450hp'],                               'audi-rs4-b9'),
  -- ── Audi / RS6 ──────────────────────────────────────────────────────────────
  ('Audi',      'RS6',            'C5',           '4B',            2002,      2004,         ARRAY['4.2T V8 biturbo 450hp'],                           'audi-rs6-c5'),
  ('Audi',      'RS6',            'C6',           '4F',            2008,      2010,         ARRAY['5.0 V10 TFSI 580hp'],                              'audi-rs6-c6'),
  ('Audi',      'RS6',            'C7',           '4G',            2013,      2018,         ARRAY['4.0 TFSI V8 560hp'],                               'audi-rs6-c7'),
  ('Audi',      'RS6',            'C8',           '4K',            2019,      NULL::int,    ARRAY['4.0 TFSI V8 600hp'],                               'audi-rs6-c8'),
  -- ── Audi / S3 ───────────────────────────────────────────────────────────────
  ('Audi',      'S3',             '8L',           '8L',            1999,      2003,         ARRAY['1.8T 210hp'],                                      'audi-s3-8l'),
  ('Audi',      'S3',             '8P',           '8P',            2006,      2012,         ARRAY['2.0T 265hp'],                                      'audi-s3-8p'),
  ('Audi',      'S3',             '8V',           '8V',            2013,      2020,         ARRAY['2.0T 300hp'],                                      'audi-s3-8v'),
  ('Audi',      'S3',             '8Y',           '8Y',            2020,      NULL::int,    ARRAY['2.0T 310hp'],                                      'audi-s3-8y'),
  -- ── Audi / S4 ───────────────────────────────────────────────────────────────
  ('Audi',      'S4',             'B5',           '8D',            1997,      2001,         ARRAY['2.7T V6 biturbo 265hp'],                           'audi-s4-b5'),
  ('Audi',      'S4',             'B6',           '8E',            2003,      2004,         ARRAY['4.2 V8 344hp'],                                    'audi-s4-b6'),
  ('Audi',      'S4',             'B7',           '8E',            2004,      2008,         ARRAY['4.2 V8 344hp'],                                    'audi-s4-b7'),
  ('Audi',      'S4',             'B8',           '8K',            2008,      2015,         ARRAY['3.0 TFSI V6 333hp'],                               'audi-s4-b8'),
  ('Audi',      'S4',             'B9',           '8W',            2016,      NULL::int,    ARRAY['3.0 TFSI V6 354hp'],                               'audi-s4-b9'),
  -- ── Porsche / 968 ───────────────────────────────────────────────────────────
  ('Porsche',   '968',            'Gen 1',        '968',           1992,      1995,         ARRAY['3.0 I4 240hp'],                                    'porsche-968-gen1'),
  -- ── Porsche / 928 ───────────────────────────────────────────────────────────
  ('Porsche',   '928',            'S',            '928',           1977,      1986,         ARRAY['4.5 V8','4.7 V8'],                                 'porsche-928-s'),
  ('Porsche',   '928',            'S4',           '928',           1987,      1991,         ARRAY['5.0 V8 32v 320hp'],                                'porsche-928-s4'),
  ('Porsche',   '928',            'GTS',          '928',           1992,      1995,         ARRAY['5.4 V8 350hp'],                                    'porsche-928-gts'),
  -- ── Porsche / Cayenne ───────────────────────────────────────────────────────
  ('Porsche',   'Cayenne',        '955/957',      '955',           2002,      2010,         ARRAY['3.2 V6','4.5 V8','4.5T Turbo','GTS 4.8'],          'porsche-cayenne-955'),
  ('Porsche',   'Cayenne',        '958',          '958',           2010,      2017,         ARRAY['3.6 V6','4.8 V8','4.8T Turbo','Diesel','GTS 4.8'],'porsche-cayenne-958'),
  ('Porsche',   'Cayenne',        'E3',           '9YA',           2018,      NULL::int,    ARRAY['3.0T V6','S 2.9T V6','Turbo 4.0T V8','GTS','E-Hybrid'], 'porsche-cayenne-e3')
) AS v(make, model, generation, chassis_code, year_start, year_end, engines, slug)
JOIN public.models m  ON m.name  = v.model
JOIN public.makes  mk ON mk.id   = m.make_id AND mk.name = v.make;
