-- Lote 4 – Step 3: 29 generation rows for existing makes
--   Jaguar (5): XJR X300/X308/X350, XK X100/X150
--   Saab (5): 900 NG, 9-3 YS3D/YS3F, 9-5 Gen1/Gen2
--   Fiat (5): 124 Spider ND, 500 Abarth 312, Panda 4x4 141/169, Coupé
--   Peugeot (1): Rifter EMP2
--   Renault (7): Mégane RS Mk4, Twingo ×3, Kangoo ×2, Avantime
--   Chevrolet (6): Express GMT600, Cheyenne GMT400/800/900/K2XX/T1XX
-- Pure INSERT, additive only. Must run after Step 2.

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT v.make, v.model, v.generation, v.chassis_code, v.year_start, v.year_end, v.engines, v.slug, m.id
FROM (VALUES

  -- ── Jaguar – XJR ─────────────────────────────────────────────────────────
  -- All three generations are supercharged performance variants of the XJ saloon.
  ('Jaguar'::text, 'XJR'::text, 'X300'::text, 'X300'::text, 1994::int, 1997::int, ARRAY['4.0 SC I6']::text[],                                            'jaguar-xjr-x300'::text),
  ('Jaguar',       'XJR',       'X308',        'X308',        1997,      2003,      ARRAY['4.0 SC V8'],                                                   'jaguar-xjr-x308'),
  ('Jaguar',       'XJR',       'X350',        'X350',        2003,      2009,      ARRAY['4.2 SC V8'],                                                   'jaguar-xjr-x350'),

  -- ── Jaguar – XK ──────────────────────────────────────────────────────────
  -- X100 covers the full XK8/XKR run; 4.0→4.2 engine update happened mid-gen (2003 facelift).
  ('Jaguar',       'XK',        'X100',        'X100',        1996,      2006,      ARRAY['4.0 V8 XK8','4.0 SC V8 XKR','4.2 V8 XK8','4.2 SC V8 XKR'],  'jaguar-xk-x100'),
  ('Jaguar',       'XK',        'X150',        'X150',        2006,      2014,      ARRAY['4.2 V8','4.2 SC XKR','5.0 V8','5.0 SC XKR'],                  'jaguar-xk-x150'),

  -- ── Saab – 900 NG ────────────────────────────────────────────────────────
  -- New Generation 900 (1994–1998): GM2900/Epsilon platform shared with Opel Vectra A.
  -- A different car from the Classic 900 (C900, already in catalog); no Saab chassis code → NULL.
  ('Saab',         '900',       'NG',          NULL,          1994,      1998,      ARRAY['2.0i B204','2.0T B204E','2.3T Turbo B234L','2.5 V6 B258E','2.2 TiD'], 'saab-900-ng'),

  -- ── Saab – 9-3 ───────────────────────────────────────────────────────────
  -- Viggen (YS3D) already in catalog; these cover the standard and Aero trim variants
  -- on the same YS3D body — distinct generation name and slug, no conflict.
  ('Saab',         '9-3',       'YS3D',        'YS3D',        1998,      2002,      ARRAY['1.8t B204L','2.0T B205E','2.3T Aero B235E','2.2 TiD Z22SE'],  'saab-93-ys3d'),
  -- YS3F (2002–2011): all-new GM Epsilon platform; linear, estate (SportCombi), and convertible.
  ('Saab',         '9-3',       'YS3F',        'YS3F',        2002,      2011,      ARRAY['1.8T B207L','2.0T B207E','2.8T V6 Aero B284L','1.9 TiD Z19DT'], 'saab-93-ys3f'),

  -- ── Saab – 9-5 ───────────────────────────────────────────────────────────
  -- Gen 1 (1998–2005): Saab-designed Epsilon-based platform; MY2006 was final model year.
  -- Chassis code unconfirmed → NULL.
  ('Saab',         '9-5',       'Gen 1',       NULL,          1998,      2005,      ARRAY['2.0T B204L','2.3t B235E','2.3T Aero B235R','3.0 V6 TiD B308E'], 'saab-95-gen1'),
  -- Gen 2 (2010–2011): GM Epsilon II; bankruptcy cut production after MY2011.
  ('Saab',         '9-5',       'Gen 2',       NULL,          2010,      2011,      ARRAY['2.0T A20NHT','2.8T V6 Aero A28NET','2.0 TiD A20DTH'],           'saab-95-gen2'),

  -- ── Fiat – 124 Spider ────────────────────────────────────────────────────
  -- ND: Mazda MX-5 ND platform; Fiat-branded with MultiAir engine.
  -- New generation of the existing '124 Spider' model entity (not a new model).
  ('Fiat',         '124 Spider','ND',           'ND',          2016,      2021,      ARRAY['1.4 MultiAir 140hp','1.4 MultiAir Abarth 170hp'],              'fiat-124-spider-nd'),

  -- ── Fiat – 500 Abarth ────────────────────────────────────────────────────
  -- 312 = Fiat 500 body platform. Year end NULL: 595/695 variants remain in production.
  ('Fiat',         '500 Abarth','312',          '312',         2008,      NULL::int, ARRAY['1.4T 135hp','1.4T 160hp 595','1.4T 180hp 595','1.4T 190hp 695'], 'fiat-500-abarth-312'),

  -- ── Fiat – Panda 4x4 ─────────────────────────────────────────────────────
  ('Fiat',         'Panda 4x4', '141',          '141',         1983,      2003,      ARRAY['903cc','1.0 FIRE 45hp'],                                       'fiat-panda-4x4-141'),
  ('Fiat',         'Panda 4x4', '169',          '169',         2004,      2012,      ARRAY['1.1 8V','1.2 8V','1.3 Multijet 16V'],                          'fiat-panda-4x4-169'),

  -- ── Fiat – Coupé ─────────────────────────────────────────────────────────
  -- Type 175: factory internal designation; only ever one body generation.
  ('Fiat',         'Coupé',     'Type 175',    NULL,          1994,      2000,      ARRAY['1.8 16V','2.0 20V','2.0 20V Turbo 190hp','2.0 20V Turbo 220hp'], 'fiat-coupe-gen1'),

  -- ── Peugeot – Rifter ─────────────────────────────────────────────────────
  ('Peugeot',      'Rifter',    'EMP2',        'EMP2',        2018,      NULL::int, ARRAY['1.2 PureTech 110hp','1.5 BlueHDi 100hp','1.5 BlueHDi 130hp'], 'peugeot-rifter-emp2'),

  -- ── Renault – Mégane RS ──────────────────────────────────────────────────
  -- Mk4 (BFB platform). Trophy 300hp variant. Chassis code unconfirmed → NULL.
  ('Renault',      'Mégane',    'RS Mk4',      NULL,          2018,      NULL::int, ARRAY['M5Pt 1.8T 280hp','M5Pt 1.8T 300hp Trophy'],                   'renault-megane-rs-mk4'),

  -- ── Renault – Twingo ─────────────────────────────────────────────────────
  ('Renault',      'Twingo',    'Gen 1',       NULL,          1993,      2007,      ARRAY['1.2i 8V','1.2i 16V 75hp','1.4 RS'],                            'renault-twingo-gen1'),
  ('Renault',      'Twingo',    'Gen 2',       NULL,          2007,      2014,      ARRAY['1.2T TCe 100hp','1.6 RS 133hp'],                               'renault-twingo-gen2'),
  -- Gen 3: rear-engine, RWD layout; platform shared with Smart Forfour.
  ('Renault',      'Twingo',    'Gen 3',       NULL,          2014,      NULL::int, ARRAY['1.0 SCe 70hp','1.0T GT 110hp','ZE Electric'],                  'renault-twingo-gen3'),

  -- ── Renault – Kangoo ─────────────────────────────────────────────────────
  ('Renault',      'Kangoo',    'Gen 1',       NULL,          1997,      2007,      ARRAY['1.2 8V','1.4 8V','1.6 16V','1.5 dCi 65hp','1.9 dTi'],          'renault-kangoo-gen1'),
  ('Renault',      'Kangoo',    'Gen 2',       NULL,          2007,      2021,      ARRAY['1.2T TCe 115hp','1.5 dCi 90hp','ZE Electric'],                  'renault-kangoo-gen2'),

  -- ── Renault – Avantime ───────────────────────────────────────────────────
  -- One body, one generation. Chassis code unconfirmed → NULL.
  ('Renault',      'Avantime',  'Gen 1',       NULL,          2001,      2003,      ARRAY['2.0T 163hp','3.0 V6 207hp'],                                   'renault-avantime'),

  -- ── Chevrolet – Express ──────────────────────────────────────────────────
  ('Chevrolet',    'Express',   'GMT600',      'GMT600',      1996,      NULL::int, ARRAY['4.3 V6','4.8 V8','5.3 V8','6.0 V8','6.6 Duramax'],             'chevrolet-express-gmt600'),

  -- ── Chevrolet – Cheyenne (Mexico) ────────────────────────────────────────
  -- Consumer branding for GM's full-size HD pickup in Mexico across platform generations.
  -- Chassis codes are GM platform codes. Year starts are global launch years;
  -- Mexico intro may lag 1–2 model years on some transitions — verify before push.
  ('Chevrolet',    'Cheyenne',  'GMT400',      'GMT400',      1988,      1999,      ARRAY['4.3 V6','5.0 V8','5.7 V8','6.5 TD'],                           'chevrolet-cheyenne-gmt400'),
  ('Chevrolet',    'Cheyenne',  'GMT800',      'GMT800',      1999,      2006,      ARRAY['4.3 V6','4.8 V8','5.3 V8','6.0 V8','6.6 Duramax LB7'],         'chevrolet-cheyenne-gmt800'),
  ('Chevrolet',    'Cheyenne',  'GMT900',      'GMT900',      2007,      2013,      ARRAY['4.3 V6','4.8 V8','5.3 V8','6.0 V8','6.6 Duramax LMM'],         'chevrolet-cheyenne-gmt900'),
  ('Chevrolet',    'Cheyenne',  'K2XX',        'K2XX',        2014,      2018,      ARRAY['4.3 V6','5.3 V8','6.0 V8','6.6 Duramax LML'],                  'chevrolet-cheyenne-k2xx'),
  ('Chevrolet',    'Cheyenne',  'T1XX',        'T1XX',        2019,      NULL::int, ARRAY['4.3 V6','5.3 V8','6.6 V8','6.6 Duramax L5D'],                  'chevrolet-cheyenne-t1xx')

) AS v(make, model, generation, chassis_code, year_start, year_end, engines, slug)
JOIN public.models m  ON m.name  = v.model
JOIN public.makes  mk ON mk.id   = m.make_id AND mk.name = v.make;
