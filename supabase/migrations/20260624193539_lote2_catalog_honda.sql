-- Lote 2: Honda — 6 new models, 33 new generation rows
-- Accord (9), City (7), CR-V (6), HR-V (3), Fit (4), Jazz (4)
-- Pure INSERT — no existing rows touched.
-- Accord starts at Gen 3 (CA/1985); Gens 1–2 (1976–1985) can be added later.
-- City is one unified model: original Japan hatchback (GA1/GA2) + Asia/LatAm sedan (Gen 3–7).

-- ─── Step 1: new model entities ──────────────────────────────────────────────

INSERT INTO public.models (make_id, name, slug)
SELECT mk.id, v.name, v.slug
FROM (VALUES
  ('Honda'::text, 'Accord'::text, 'honda-accord'::text),
  ('Honda',       'City',         'honda-city'),
  ('Honda',       'CR-V',         'honda-cr-v'),
  ('Honda',       'HR-V',         'honda-hr-v'),
  ('Honda',       'Fit',          'honda-fit'),
  ('Honda',       'Jazz',         'honda-jazz')
) AS v(make_name, name, slug)
JOIN public.makes mk ON mk.name = v.make_name;

-- ─── Step 2: new generation rows ─────────────────────────────────────────────

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT v.make, v.model, v.generation, v.chassis_code, v.year_start, v.year_end, v.engines, v.slug, m.id
FROM (VALUES
  -- ── Honda / Accord ──────────────────────────────────────────────────────────
  -- Starting at CA (3rd gen, 1985). Gens 1–2 pre-date VTEC and are very rare in builds.
  ('Honda'::text, 'Accord'::text, 'CA'::text,   'CA'::text,   1985::int, 1989::int,    ARRAY['A18A','A20A','B20A']::text[],          'honda-accord-ca'::text),
  ('Honda',       'Accord',       'CB',          'CB',          1989,      1993,         ARRAY['F22A','H22A'],                         'honda-accord-cb'),
  ('Honda',       'Accord',       'CD',          'CD',          1993,      1997,         ARRAY['F22B','H22A'],                         'honda-accord-cd'),
  ('Honda',       'Accord',       'CG/CK',       'CG/CK',       1997,      2002,         ARRAY['F23A','H22A'],                         'honda-accord-cgck'),
  ('Honda',       'Accord',       'CL/CM',       'CL/CM',       2002,      2007,         ARRAY['K24A','K20A'],                         'honda-accord-clcm'),
  ('Honda',       'Accord',       'CP',          'CP',          2007,      2012,         ARRAY['K24Z3','J35 V6'],                      'honda-accord-cp'),
  ('Honda',       'Accord',       'CR',          'CR',          2012,      2017,         ARRAY['K24Z7','J35Y V6'],                     'honda-accord-cr'),
  ('Honda',       'Accord',       'CV',          'CV',          2017,      2022,         ARRAY['L15B 1.5T','K20C 2.0T'],               'honda-accord-cv'),
  ('Honda',       'Accord',       'DE',          'DE',          2022,      NULL::int,    ARRAY['L15B 1.5T','e:HEV 2.0T hybrid'],       'honda-accord-de'),
  -- ── Honda / City ────────────────────────────────────────────────────────────
  -- GA1/GA2: original Japan/Europe "tall boy" hatchback.
  -- Gen 3–7: Asia/LatAm subcompact sedan (completely different platform and body).
  -- Chassis codes for Gen 3–7 vary significantly by market; NULL until confirmed.
  ('Honda',       'City',         'GA1',         'GA1',         1981,      1986,         ARRAY['1.2 ER','1.2T EX Turbo II'],           'honda-city-ga1'),
  ('Honda',       'City',         'GA2',         'GA2',         1986,      1994,         ARRAY['1.2 EG'],                              'honda-city-ga2'),
  ('Honda',       'City',         'Gen 3',       NULL::text,    1996,      2002,         ARRAY['1.3','1.5'],                           'honda-city-gen3'),
  ('Honda',       'City',         'Gen 4',       NULL::text,    2002,      2008,         ARRAY['1.3','1.5'],                           'honda-city-gen4'),
  ('Honda',       'City',         'Gen 5',       NULL::text,    2008,      2014,         ARRAY['1.5'],                                 'honda-city-gen5'),
  ('Honda',       'City',         'Gen 6',       NULL::text,    2014,      2020,         ARRAY['1.5 L15Z1'],                           'honda-city-gen6'),
  ('Honda',       'City',         'Gen 7',       NULL::text,    2020,      NULL::int,    ARRAY['1.5 L15Z'],                            'honda-city-gen7'),
  -- ── Honda / CR-V ────────────────────────────────────────────────────────────
  ('Honda',       'CR-V',         'RD1',         'RD1',         1995,      2001,         ARRAY['B20B','B20Z2'],                        'honda-cr-v-rd1'),
  ('Honda',       'CR-V',         'RD4',         'RD4',         2001,      2006,         ARRAY['K24A1'],                               'honda-cr-v-rd4'),
  ('Honda',       'CR-V',         'RE4',         'RE4',         2006,      2011,         ARRAY['K24Z4','R20A'],                        'honda-cr-v-re4'),
  ('Honda',       'CR-V',         'RM1',         'RM1',         2012,      2016,         ARRAY['K24Z7'],                               'honda-cr-v-rm1'),
  ('Honda',       'CR-V',         'RW2',         'RW2',         2016,      2022,         ARRAY['L15B 1.5T','K20C2'],                   'honda-cr-v-rw2'),
  ('Honda',       'CR-V',         'Gen 6',       NULL::text,    2022,      NULL::int,    ARRAY['L15B 1.5T','e:HEV hybrid'],            'honda-cr-v-gen6'),
  -- ── Honda / HR-V ────────────────────────────────────────────────────────────
  ('Honda',       'HR-V',         'GH1',         'GH1',         1998,      2006,         ARRAY['D16A','B18B'],                         'honda-hr-v-gh1'),
  ('Honda',       'HR-V',         'RU1',         'RU1',         2013,      2021,         ARRAY['L15B','L15Z1','R18A'],                 'honda-hr-v-ru1'),
  ('Honda',       'HR-V',         'RV3',         'RV3',         2021,      NULL::int,    ARRAY['e:HEV hybrid','1.5T'],                 'honda-hr-v-rv3'),
  -- ── Honda / Fit ─────────────────────────────────────────────────────────────
  -- Japan/North America/global name. Separate model from Jazz (European/UK market name).
  ('Honda',       'Fit',          'GD',          'GD',          2001,      2008,         ARRAY['L13A','L15A'],                         'honda-fit-gd'),
  ('Honda',       'Fit',          'GE',          'GE',          2008,      2013,         ARRAY['L13Z','L15A'],                         'honda-fit-ge'),
  ('Honda',       'Fit',          'GK',          'GK',          2013,      2020,         ARRAY['L13B','L15B'],                         'honda-fit-gk'),
  ('Honda',       'Fit',          'GR',          'GR',          2020,      NULL::int,    ARRAY['e:HEV hybrid','1.5 non-hybrid'],        'honda-fit-gr'),
  -- ── Honda / Jazz ────────────────────────────────────────────────────────────
  -- European/UK/some-Asia market name for the same vehicle as the Fit.
  -- Separate model per catalog decision. European launch is ~6–12 months after Japan.
  ('Honda',       'Jazz',         'GD',          'GD',          2002,      2008,         ARRAY['L13A','L15A'],                         'honda-jazz-gd'),
  ('Honda',       'Jazz',         'GE',          'GE',          2008,      2014,         ARRAY['L13Z','L15A'],                         'honda-jazz-ge'),
  ('Honda',       'Jazz',         'GK',          'GK',          2014,      2020,         ARRAY['L13B','L15B'],                         'honda-jazz-gk'),
  ('Honda',       'Jazz',         'GR',          'GR',          2020,      NULL::int,    ARRAY['e:HEV hybrid'],                        'honda-jazz-gr')
) AS v(make, model, generation, chassis_code, year_start, year_end, engines, slug)
JOIN public.models m  ON m.name  = v.model
JOIN public.makes  mk ON mk.id   = m.make_id AND mk.name = v.make;
