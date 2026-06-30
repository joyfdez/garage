-- Lote 4 – Step 2: 17 new model entities
--   Jaguar (existing make):   XJR, XK
--   Saab (existing make):     9-5
--   Fiat (existing make):     500 Abarth, Panda 4x4, Coupé
--   Peugeot (existing make):  Rifter
--   Renault (existing make):  Twingo, Kangoo, Avantime
--   Chevrolet (existing make):Express, Cheyenne
--   Citroën (new make):       Saxo, DS3, C3
--   GMC (new make):           Acadia
--   Alpine (new make):        A110
-- Must run after Step 1 (new makes) and before Steps 3–4 (generation rows).

INSERT INTO public.models (make_id, name, slug)
SELECT mk.id, v.name, v.slug
FROM (VALUES

  -- ── Jaguar (existing make) ────────────────────────────────────────────────
  ('Jaguar'::text,    'XJR'::text,       'jaguar-xjr'::text),
  ('Jaguar',          'XK',              'jaguar-xk'),

  -- ── Saab (existing make) ──────────────────────────────────────────────────
  ('Saab',            '9-5',             'saab-9-5'),

  -- ── Fiat (existing make) ──────────────────────────────────────────────────
  ('Fiat',            '500 Abarth',      'fiat-500-abarth'),
  ('Fiat',            'Panda 4x4',       'fiat-panda-4x4'),
  ('Fiat',            'Coupé',           'fiat-coupe'),

  -- ── Peugeot (existing make) ───────────────────────────────────────────────
  ('Peugeot',         'Rifter',          'peugeot-rifter'),

  -- ── Renault (existing make) ───────────────────────────────────────────────
  ('Renault',         'Twingo',          'renault-twingo'),
  ('Renault',         'Kangoo',          'renault-kangoo'),
  ('Renault',         'Avantime',        'renault-avantime'),

  -- ── Chevrolet (existing make) ─────────────────────────────────────────────
  ('Chevrolet',       'Express',         'chevrolet-express'),
  ('Chevrolet',       'Cheyenne',        'chevrolet-cheyenne'),

  -- ── Citroën (new make, from Step 1) ───────────────────────────────────────
  ('Citroën',         'Saxo',            'citroen-saxo'),
  ('Citroën',         'DS3',             'citroen-ds3'),
  ('Citroën',         'C3',              'citroen-c3'),

  -- ── GMC (new make, from Step 1) ───────────────────────────────────────────
  ('GMC',             'Acadia',          'gmc-acadia'),

  -- ── Alpine (new make, from Step 1) ────────────────────────────────────────
  ('Alpine',          'A110',            'alpine-a110')

) AS v(make_name, name, slug)
JOIN public.makes mk ON mk.name = v.make_name;
