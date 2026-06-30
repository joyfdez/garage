-- Lote 4 – Step 4: 9 generation rows for new makes (Citroën, GMC, Alpine)
-- Must run after Step 1 (new makes) and Step 2 (new model entities).
-- Pure INSERT, additive only.

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT v.make, v.model, v.generation, v.chassis_code, v.year_start, v.year_end, v.engines, v.slug, m.id
FROM (VALUES

  -- ── Citroën – Saxo ───────────────────────────────────────────────────────
  -- VTS = hot-hatch trim (1.6 16V 120hp); covers the full Saxo production run.
  -- Official chassis code unconfirmed → NULL.
  ('Citroën'::text, 'Saxo'::text, 'VTS'::text, NULL::text, 1996::int, 2003::int, ARRAY['1.4 VTR 75hp','1.6 VTS 16V 120hp']::text[], 'citroen-saxo-vts'::text),

  -- ── Citroën – DS3 ────────────────────────────────────────────────────────
  -- One generation (2009–2016); DS brand spun off in 2014 but the car sold under Citroën until 2016.
  -- Chassis code unconfirmed → NULL.
  ('Citroën', 'DS3',  'Gen 1', NULL,    2009, 2016,      ARRAY['1.2 PureTech 110hp','1.6 THP 155hp','1.6 THP 207hp Racing'], 'citroen-ds3'),

  -- ── Citroën – C3 ─────────────────────────────────────────────────────────
  ('Citroën', 'C3',   'Gen 1', NULL,    2002, 2009,      ARRAY['1.4i 8V','1.6i 16V','1.4 HDi'],                              'citroen-c3-gen1'),
  ('Citroën', 'C3',   'Gen 2', NULL,    2009, 2016,      ARRAY['1.2 PureTech 82hp','1.6 THP 155hp','1.4 e-HDi'],             'citroen-c3-gen2'),
  ('Citroën', 'C3',   'Gen 3', NULL,    2016, NULL::int, ARRAY['1.2 PureTech 83hp','1.2 PureTech 110hp','1.5 BlueHDi 100hp'], 'citroen-c3-gen3'),

  -- ── GMC – Acadia ─────────────────────────────────────────────────────────
  -- Gen 1: Lambda platform (shared with Buick Enclave / Chevrolet Traverse).
  ('GMC', 'Acadia', 'Gen 1', 'Lambda', 2007, 2016,      ARRAY['3.6 V6 LLT','3.6 V6 LFX Denali'],              'gmc-acadia-gen1'),
  -- Gen 2: downsized to C1XX platform. Chassis code unconfirmed → NULL.
  ('GMC', 'Acadia', 'Gen 2', NULL,     2017, NULL::int, ARRAY['2.5 I4 LCV','2.0T LSY','3.6 V6 LGX'],          'gmc-acadia-gen2'),

  -- ── Alpine – A110 ────────────────────────────────────────────────────────
  -- Classic (1962–1977): Renault-powered berlinette built in Dieppe. Chassis code unknown → NULL.
  ('Alpine', 'A110', 'Classic', NULL,  1962, 1977,      ARRAY['1.1 Renault','1.3 Renault','1.6','1.6S'],       'alpine-a110-classic'),
  -- ANF = internal platform code for the 2017+ A110 (Renault Sport aluminium platform).
  -- A parallel ('Renault','Alpine','A110') row exists from the original seed; both are intentional
  -- during the transition period — the Renault entry will be removed in a future cleanup migration.
  ('Alpine', 'A110', 'ANF',     'ANF', 2017, NULL::int, ARRAY['H5Ft 1.8T 252hp','H5Ft 1.8T 300hp GT'],        'alpine-a110-anf')

) AS v(make, model, generation, chassis_code, year_start, year_end, engines, slug)
JOIN public.models m  ON m.name  = v.model
JOIN public.makes  mk ON mk.id   = m.make_id AND mk.name = v.make;
