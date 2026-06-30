-- Lote 3 – Step 3: 17 new generation rows — Alfa Romeo (5) and Dodge (12)
-- Alfa Romeo: GTV 105 and Spider 939 fill existing-model gaps;
--             159, 4C, Brera are new models inserted in Step 2.
-- Dodge: all 4 models new, inserted in Step 2.
-- Pure INSERT — no existing rows touched (Viper RT/10 and all existing Alfa rows untouched).

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT v.make, v.model, v.generation, v.chassis_code, v.year_start, v.year_end, v.engines, v.slug, m.id
FROM (VALUES

  -- ── Alfa Romeo ───────────────────────────────────────────────────────────
  -- GTV 105: 105-chassis Bertone coupe (Giulia Sprint GT → 1750 GTV → 2000 GTV).
  -- year_start 1963 covers the full 105-chassis coupe run; same approach as Giulia 105.
  ('Alfa Romeo'::text, 'GTV'::text,    '105'::text,    '105'::text,    1963::int, 1977::int, ARRAY['1.3 Twin Cam','1.6 Twin Cam','1.75 Twin Cam','2.0 Twin Cam']::text[], 'alfa-gtv-105'::text),
  -- Spider 939: Brera-platform convertible; fills the gap after Spider 916 ended in 2005.
  ('Alfa Romeo',       'Spider',        '939',           '939',          2006,      2010,      ARRAY['1.8 JTS','2.2 JTS','3.2 JTS Q4'],                                    'alfa-spider-939'),
  ('Alfa Romeo',       '159',           '939',           '939',          2005,      2011,      ARRAY['1.9 JTDm','2.2 JTS','3.2 V6 Q4','2.4 JTDm'],                        'alfa-159-939'),
  ('Alfa Romeo',       '4C',            '960',           '960',          2013,      2020,      ARRAY['1750 TBi'],                                                           'alfa-4c-960'),
  ('Alfa Romeo',       'Brera',         '939',           '939',          2005,      2010,      ARRAY['1.8 JTS','2.2 JTS','3.2 JTS Q4','2.4 JTDm'],                        'alfa-brera-939'),

  -- ── Dodge – Dakota ───────────────────────────────────────────────────────
  -- Chrysler did not use public chassis alpha codes for truck lines; NULLed.
  ('Dodge',            'Dakota',        'Gen 1',         NULL,           1987,      1996,      ARRAY['2.5 I4','3.9 V6','5.2 V8'],                                          'dodge-dakota-gen1'),
  ('Dodge',            'Dakota',        'Gen 2',         NULL,           1997,      2004,      ARRAY['2.5 I4','3.9 V6','4.7 V8','5.9 V8'],                                'dodge-dakota-gen2'),
  ('Dodge',            'Dakota',        'Gen 3',         NULL,           2005,      2011,      ARRAY['3.7 V6','4.7 V8'],                                                   'dodge-dakota-gen3'),

  -- ── Dodge – Ram ──────────────────────────────────────────────────────────
  -- Starting at 1994 (first year sold as "Dodge Ram"; prior D-series excluded per scope decision).
  -- BR = 1500 series platform; BE = 2500/3500. Became standalone Ram brand in 2009.
  ('Dodge',            'Ram',           'BR/BE',         'BR',           1994,      2001,      ARRAY['3.9 V6','5.2 V8','5.9 V8','8.0 V10','5.9 Cummins'],                 'dodge-ram-br'),
  -- DR = 1500; DH = 2500/3500. Last generation sold as Dodge Ram before the 2009 brand split.
  ('Dodge',            'Ram',           'DR/DH',         'DR',           2002,      2008,      ARRAY['3.7 V6','4.7 V8','5.7 Hemi','5.9 Cummins','6.7 Cummins'],           'dodge-ram-dr'),

  -- ── Dodge – Charger ──────────────────────────────────────────────────────
  -- B-body is the Chrysler B-platform colloquial name; no official chassis alpha code.
  ('Dodge',            'Charger',       'Gen 1',         'B-body',       1966,      1967,      ARRAY['318 V8','383 V8','426 Hemi'],                                        'dodge-charger-gen1'),
  -- Gen 2 is the iconic Charger (Bullitt, Dukes of Hazzard); most-built B-body variant.
  ('Dodge',            'Charger',       'Gen 2',         'B-body',       1968,      1970,      ARRAY['318 V8','383 V8','440 V8','426 Hemi'],                               'dodge-charger-gen2'),
  ('Dodge',            'Charger',       'Gen 3',         'B-body',       1971,      1974,      ARRAY['318 V8','383 V8','440 V8','426 Hemi'],                               'dodge-charger-gen3'),
  ('Dodge',            'Charger',       'LX',            'LX',           2006,      2010,      ARRAY['2.7 V6','3.5 V6','5.7 Hemi','6.1 SRT8'],                            'dodge-charger-lx'),
  ('Dodge',            'Charger',       'LD',            'LD',           2011,      2023,      ARRAY['3.6 V6','5.7 Hemi','6.4 392','6.2 Hellcat'],                        'dodge-charger-ld'),

  -- ── Dodge – Challenger ───────────────────────────────────────────────────
  -- E-body = Chrysler E-platform (colloquial); shared with Plymouth Barracuda.
  ('Dodge',            'Challenger',    'E-body',        'E-body',       1970,      1974,      ARRAY['225 I6','318 V8','340 V8','383 V8','440 V8','426 Hemi'],             'dodge-challenger-e-body'),
  -- LC = LX-derived platform used for the 2008+ Challenger revival.
  ('Dodge',            'Challenger',    'LC',            'LC',           2008,      2023,      ARRAY['3.6 V6','5.7 Hemi','6.4 392','6.2 Hellcat'],                        'dodge-challenger-lc')

) AS v(make, model, generation, chassis_code, year_start, year_end, engines, slug)
JOIN public.models m  ON m.name  = v.model
JOIN public.makes  mk ON mk.id   = m.make_id AND mk.name = v.make;
