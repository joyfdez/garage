-- Tanda corta: 4 new model entities (Range Rover, Discovery, Toledo, ZS)
--              + 13 new generation rows (Land Rover ×9, SEAT ×2, MG ×2)
-- Pure INSERT — additive only, no existing rows touched.
-- Step 1 must complete before Step 2 so the JOIN resolves model_ref_ids.

-- ─── Step 1: new model entities ──────────────────────────────────────────────

INSERT INTO public.models (make_id, name, slug)
SELECT mk.id, v.name, v.slug
FROM (VALUES
  ('Land Rover'::text, 'Range Rover'::text, 'land-rover-range-rover'::text),
  ('Land Rover',       'Discovery',          'land-rover-discovery'),
  ('SEAT',             'Toledo',             'seat-toledo'),
  ('MG',               'ZS',                'mg-zs')
) AS v(make_name, name, slug)
JOIN public.makes mk ON mk.name = v.make_name;

-- ─── Step 2: new generation rows ─────────────────────────────────────────────

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT v.make, v.model, v.generation, v.chassis_code, v.year_start, v.year_end, v.engines, v.slug, m.id
FROM (VALUES

  -- ── Land Rover / Range Rover ─────────────────────────────────────────────
  -- Classic and P38 overlap 1994–1996: production transition, intentional.
  -- P38A is the full internal project code for the second-generation.
  -- L322 chassis introduced Oct 2001; P38A ran to MY2002 — 1-year overlap.
  ('Land Rover'::text, 'Range Rover'::text, 'Classic'::text,      'LH'::text,    1970::int, 1996::int, ARRAY['3.5 V8','3.9 V8','4.2 V8','2.4D VM']::text[],       'landrover-range-rover-classic'::text),
  ('Land Rover',       'Range Rover',        'P38',                'P38A',         1994,      2002,      ARRAY['4.0 V8','4.6 V8','2.5 BMW diesel'],                  'landrover-range-rover-p38'),
  ('Land Rover',       'Range Rover',        'L322',               'L322',         2001,      2012,      ARRAY['4.4 V8','4.2 SC','3.0 TdV6','3.6 TdV8'],            'landrover-range-rover-l322'),
  ('Land Rover',       'Range Rover',        'L405',               'L405',         2012,      2022,      ARRAY['3.0 SDV6','5.0 V8 SC','4.4 SDV8'],                   'landrover-range-rover-l405'),

  -- ── Land Rover / Discovery ───────────────────────────────────────────────
  -- Series 1/2 internal chassis codes not well-sourced enough to commit → NULL.
  -- Series 3 and 4 share the L319 platform; Series 4 is a significant facelift.
  ('Land Rover',       'Discovery',          'Series 1',           NULL::text,     1989,      1998,      ARRAY['3.5 V8','200Tdi','300Tdi'],                          'landrover-discovery-1'),
  ('Land Rover',       'Discovery',          'Series 2',           NULL,           1998,      2004,      ARRAY['4.0 V8','2.5 Td5'],                                  'landrover-discovery-2'),
  ('Land Rover',       'Discovery',          'Series 3 / LR3',     'L319',         2004,      2009,      ARRAY['2.7 TdV6','4.0 V6','4.4 V8'],                       'landrover-discovery-3'),
  ('Land Rover',       'Discovery',          'Series 4 / LR4',     'L319',         2009,      2016,      ARRAY['3.0 TdV6','3.0 SDV6','5.0 V8'],                     'landrover-discovery-4'),
  ('Land Rover',       'Discovery',          'Series 5',           'L462',         2017,      NULL::int, ARRAY['2.0 SD4','3.0 SDV6','3.0 P360'],                    'landrover-discovery-5'),

  -- ── SEAT / Toledo ────────────────────────────────────────────────────────
  -- Mk2 shares the 1M (PQ34) platform with León Mk1 — correct, not a mistake.
  ('SEAT'::text,       'Toledo'::text,       'Mk1'::text,          '1L'::text,     1991,      1999,      ARRAY['1.4','1.6','1.8','1.9 TDI'],                        'seat-toledo-mk1'),
  ('SEAT',             'Toledo',             'Mk2',                '1M',           1999,      2006,      ARRAY['1.4','1.6','1.8T','2.3 V5','1.9 TDI'],              'seat-toledo-mk2'),

  -- ── MG / ZS ──────────────────────────────────────────────────────────────
  -- Mk1: Rover 45 platform (RT). ZS EV: SAIC-era successor; chassis code unknown.
  ('MG'::text,         'ZS'::text,           'Mk1'::text,          'RT'::text,     2001,      2005,      ARRAY['1.6','1.8 VVC 120hp','2.5 V6 180hp'],               'mg-zs-mk1'),
  ('MG',               'ZS',                 'ZS EV',              NULL::text,     2019,      NULL::int, ARRAY['EV 44.5kWh','EV 70kWh'],                            'mg-zs-ev')

) AS v(make, model, generation, chassis_code, year_start, year_end, engines, slug)
JOIN public.models m  ON m.name  = v.model
JOIN public.makes  mk ON mk.id   = m.make_id AND mk.name = v.make;
