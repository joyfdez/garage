-- Lote 3 – Step 4: 21 new generation rows — Pontiac (7), Acura (9), Aston Martin (5)
-- Makes and model entities created in Steps 1–2. Pure INSERT, additive only.

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT v.make, v.model, v.generation, v.chassis_code, v.year_start, v.year_end, v.engines, v.slug, m.id
FROM (VALUES

  -- ── Pontiac – Firebird ───────────────────────────────────────────────────
  -- Trans Am is a performance trim within Gen 2–4, not a separate model entity.
  -- F-body platform shared across all four generations and with Chevrolet Camaro.
  ('Pontiac'::text, 'Firebird'::text, 'Gen 1'::text, 'F-body'::text, 1967::int, 1969::int, ARRAY['230 I6','326 V8','350 V8','400 V8']::text[],  'pontiac-firebird-gen1'::text),
  ('Pontiac',       'Firebird',       'Gen 2',        'F-body',       1970,      1981,      ARRAY['250 I6','350 V8','400 V8','455 V8'],            'pontiac-firebird-gen2'),
  ('Pontiac',       'Firebird',       'Gen 3',        'F-body',       1982,      1992,      ARRAY['2.5 I4','2.8 V6','5.0 V8','5.7 V8'],           'pontiac-firebird-gen3'),
  ('Pontiac',       'Firebird',       'Gen 4',        'F-body',       1993,      2002,      ARRAY['3.4 V6','3.8 V6','5.7 LT1','5.7 LS1'],         'pontiac-firebird-gen4'),

  -- ── Pontiac – GTO ────────────────────────────────────────────────────────
  -- A-body = GM A-platform (Tempest/LeMans/GTO/Chevelle family; colloquial).
  ('Pontiac',       'GTO',            'A-body',       'A-body',       1964,      1974,      ARRAY['326 V8','389 V8','400 V8','455 V8'],            'pontiac-gto-a-body'),
  -- VZ = Holden Monaro VZ platform, rebadged for North America. First US model year: 2004.
  ('Pontiac',       'GTO',            'VZ',           'VZ',           2004,      2006,      ARRAY['5.7 LS1','6.0 LS2'],                            'pontiac-gto-vz'),

  -- ── Pontiac – Aztek ──────────────────────────────────────────────────────
  -- GMT245 is the GM U-platform designation; not a traditional chassis code → NULL.
  ('Pontiac',       'Aztek',          'GMT245',       NULL,           2001,      2005,      ARRAY['3.4 V6'],                                       'pontiac-aztek-gmt245'),

  -- ── Acura – MDX ──────────────────────────────────────────────────────────
  ('Acura',         'MDX',            'YD1',          'YD1',          2001,      2006,      ARRAY['J35A 3.5 V6'],                                  'acura-mdx-yd1'),
  ('Acura',         'MDX',            'YD2',          'YD2',          2007,      2013,      ARRAY['J37A1 3.7 V6'],                                 'acura-mdx-yd2'),
  ('Acura',         'MDX',            'YD3',          'YD3',          2014,      2021,      ARRAY['J35Y 3.5 V6','3.5 Sport Hybrid SH-AWD'],       'acura-mdx-yd3'),

  -- ── Acura – TL ───────────────────────────────────────────────────────────
  ('Acura',         'TL',             'UA1',          'UA1',          1996,      1998,      ARRAY['C27A4 2.5 V6'],                                 'acura-tl-ua1'),
  ('Acura',         'TL',             'UA4',          'UA4',          1999,      2003,      ARRAY['J32A1 3.2 V6'],                                 'acura-tl-ua4'),
  ('Acura',         'TL',             'UA6',          'UA6',          2004,      2008,      ARRAY['J32A3 3.2 V6','J32A3 3.2 Type-S'],             'acura-tl-ua6'),
  ('Acura',         'TL',             'UA8',          'UA8',          2009,      2014,      ARRAY['J35Z8 3.5 V6','J37A5 3.7 SH-AWD'],            'acura-tl-ua8'),

  -- ── Acura – NSX ──────────────────────────────────────────────────────────
  -- NA1 (C30A 3.0) and NA2 (C32B 3.2) share the same body; one generation row.
  -- 11-year production gap 2006–2015 is real: Honda killed the line.
  ('Acura',         'NSX',            'NA1/NA2',      'NA1',          1990,      2005,      ARRAY['C30A 3.0 VTEC','C32B 3.2 VTEC'],               'acura-nsx-na1'),
  ('Acura',         'NSX',            'NC1',          'NC1',          2016,      2022,      ARRAY['3.5T V6 Hybrid SH-AWD'],                       'acura-nsx-nc1'),

  -- ── Aston Martin – DB7 ───────────────────────────────────────────────────
  -- No official Aston chassis code; based on a Jaguar XJS-derived platform via TWR → NULL.
  ('Aston Martin',  'DB7',            'I6',           NULL,           1993,      1999,      ARRAY['3.2 SC I6'],                                    'aston-martin-db7-i6'),
  ('Aston Martin',  'DB7',            'V12',          NULL,           1999,      2004,      ARRAY['5.9 V12'],                                      'aston-martin-db7-v12'),

  -- ── Aston Martin – DB9 ───────────────────────────────────────────────────
  -- VH = bonded aluminium VH architecture, introduced with the DB9.
  ('Aston Martin',  'DB9',            'VH',           'VH',           2004,      2016,      ARRAY['6.0 V12'],                                      'aston-martin-db9-vh'),

  -- ── Aston Martin – Vantage ───────────────────────────────────────────────
  -- "Vantage" as a standalone model from 2005; all prior uses were trim suffixes.
  -- V12 Vantage was a limited-production variant on the same V8 Vantage body (same generation row).
  ('Aston Martin',  'Vantage',        'V8 Vantage',   'VH',           2005,      2018,      ARRAY['4.3 V8','4.7 V8','6.0 V12 Vantage'],           'aston-martin-vantage-v8'),
  -- 2nd gen uses a new bonded aluminium architecture; internal code unconfirmed → NULL.
  ('Aston Martin',  'Vantage',        'Gen 2',        NULL,           2018,      NULL::int, ARRAY['4.0T V8'],                                      'aston-martin-vantage-gen2')

) AS v(make, model, generation, chassis_code, year_start, year_end, engines, slug)
JOIN public.models m  ON m.name  = v.model
JOIN public.makes  mk ON mk.id   = m.make_id AND mk.name = v.make;
