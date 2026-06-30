-- Lote 3 – Step 2: 16 new model entities
--   Alfa Romeo (existing make): 159, 4C, Brera
--   Dodge (existing make):      Dakota, Ram, Charger, Challenger
--   Pontiac (new make):         Firebird, GTO, Aztek
--   Acura (new make):           MDX, TL, NSX
--   Aston Martin (new make):    DB7, DB9, Vantage
-- Must run after Step 1 (new makes) and before Steps 3–4 (generation rows).

INSERT INTO public.models (make_id, name, slug)
SELECT mk.id, v.name, v.slug
FROM (VALUES

  -- ── Alfa Romeo (existing make) ─────────────────────────────────────────
  ('Alfa Romeo'::text, '159'::text,       'alfa-romeo-159'::text),
  ('Alfa Romeo',       '4C',              'alfa-romeo-4c'),
  ('Alfa Romeo',       'Brera',           'alfa-romeo-brera'),

  -- ── Dodge (existing make) ─────────────────────────────────────────────
  ('Dodge',            'Dakota',          'dodge-dakota'),
  ('Dodge',            'Ram',             'dodge-ram'),
  ('Dodge',            'Charger',         'dodge-charger'),
  ('Dodge',            'Challenger',      'dodge-challenger'),

  -- ── Pontiac (new make, from Step 1) ───────────────────────────────────
  ('Pontiac',          'Firebird',        'pontiac-firebird'),
  ('Pontiac',          'GTO',             'pontiac-gto'),
  ('Pontiac',          'Aztek',           'pontiac-aztek'),

  -- ── Acura (new make, from Step 1) ─────────────────────────────────────
  ('Acura',            'MDX',             'acura-mdx'),
  ('Acura',            'TL',              'acura-tl'),
  ('Acura',            'NSX',             'acura-nsx'),

  -- ── Aston Martin (new make, from Step 1) ──────────────────────────────
  ('Aston Martin',     'DB7',             'aston-martin-db7'),
  ('Aston Martin',     'DB9',             'aston-martin-db9'),
  ('Aston Martin',     'Vantage',         'aston-martin-vantage')

) AS v(make_name, name, slug)
JOIN public.makes mk ON mk.name = v.make_name;
