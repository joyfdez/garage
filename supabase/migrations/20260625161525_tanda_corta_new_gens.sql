-- Tanda corta: 11 new generation rows for existing model entities
--              Mercedes-Benz SL ×3, Mini ×1, SEAT Ibiza ×4, SEAT León ×3
-- No new model entities — pure car_models INSERT, additive only.
-- Existing rows (SL R107, Ibiza Cupra Mk2/6K, León Cupra Mk1/Mk2) untouched.

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, model_ref_id)
SELECT v.make, v.model, v.generation, v.chassis_code, v.year_start, v.year_end, v.engines, v.slug, m.id
FROM (VALUES

  -- ── Mercedes-Benz / SL ───────────────────────────────────────────────────
  -- R107 (1971–1989) is already in the catalog. These three complete the SL lineage.
  ('Mercedes-Benz'::text, 'SL'::text, 'R129'::text, 'R129'::text, 1989::int, 2001::int, ARRAY['300SL-24','500SL','600SL','SL60 AMG','SL73 AMG']::text[], 'mercedes-sl-r129'::text),
  ('Mercedes-Benz',       'SL',       'R230',        'R230',        2001,      2012,      ARRAY['SL350','SL500','SL55 AMG','SL65 AMG'],                   'mercedes-sl-r230'),
  ('Mercedes-Benz',       'SL',       'R231',        'R231',        2012,      2020,      ARRAY['SL400','SL500','SL63 AMG','SL65 AMG'],                   'mercedes-sl-r231'),

  -- ── Mini / Mini ──────────────────────────────────────────────────────────
  -- R53 (2001–2006) and R56 (2006–2013) already exist.
  -- F56 is the third-generation 3-door hatch; Cooper S and JCW are engine trims.
  ('Mini'::text, 'Mini'::text, 'F56'::text, 'F56'::text, 2014::int, NULL::int, ARRAY['1.5 Cooper','2.0 Cooper S','2.0 JCW']::text[], 'mini-mini-f56'::text),

  -- ── SEAT / Ibiza ─────────────────────────────────────────────────────────
  -- Ibiza Cupra Mk2 (6K, 1999–2002) already exists; Mk2 here covers the full
  -- 6K range (different generation name + slug, no conflict).
  ('SEAT'::text, 'Ibiza'::text, 'Mk1'::text, '6A'::text, 1984::int, 1993::int, ARRAY['0.9','1.2','1.5','1.7 SDi']::text[],           'seat-ibiza-mk1'::text),
  ('SEAT',       'Ibiza',       'Mk2',        '6K',        1993,      2002,      ARRAY['1.0','1.4','1.6','1.8T GTI','1.9 TDI'],        'seat-ibiza-mk2'),
  ('SEAT',       'Ibiza',       'Mk3',        '6L',        2002,      2008,      ARRAY['1.2','1.4','1.6','1.8T FR','1.9 TDI'],         'seat-ibiza-mk3'),
  ('SEAT',       'Ibiza',       'Mk4',        '6J',        2008,      2017,      ARRAY['1.0','1.2 TSI','1.4 TSI SC'],                  'seat-ibiza-mk4'),

  -- ── SEAT / León ──────────────────────────────────────────────────────────
  -- León Cupra Mk1 (1M) and Cupra Mk2 (1P) already exist; these cover the full
  -- mainstream range for each generation (different generation names + slugs).
  ('SEAT'::text, 'Leon'::text, 'Mk1'::text, '1M'::text, 1999::int, 2005::int, ARRAY['1.4','1.6','1.8T','1.9 TDI']::text[],                    'seat-leon-mk1'::text),
  ('SEAT',       'Leon',       'Mk2',        '1P',        2005,      2012,      ARRAY['1.4T','1.6','2.0 TFSI','1.9 TDI','2.0 TDI'],            'seat-leon-mk2'),
  ('SEAT',       'Leon',       'Mk3',        '5F',        2012,      2020,      ARRAY['1.0T','1.5 TSI','1.8T FR','2.0 TDI'],                    'seat-leon-mk3')

) AS v(make, model, generation, chassis_code, year_start, year_end, engines, slug)
JOIN public.models m  ON m.name  = v.model
JOIN public.makes  mk ON mk.id   = m.make_id AND mk.name = v.make;
