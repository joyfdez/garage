-- lote5 — new models: Ford, VW, Jeep, Acura, Mercedes-Benz, Mazda, Peugeot, Volvo
-- 29 new model rows.
-- Peugeot 207 and 306 already in catalog — skipped.
-- Volvo V70 R already in catalog — adding regular V70 as separate model.
-- Additive only — ON CONFLICT (slug) DO NOTHING.

WITH makes AS (
  SELECT slug, id FROM public.makes
  WHERE slug IN (
    'ford', 'volkswagen', 'jeep', 'acura', 'mercedes-benz', 'mazda', 'peugeot', 'volvo'
  )
),
new_models (make_slug, name, model_slug) AS (
  VALUES
    -- Ford
    ('ford',          'Escape',         'ford-escape'),
    ('ford',          'Kuga',           'ford-kuga'),
    -- Volkswagen (Passat already exists — NMS generation added separately)
    ('volkswagen',    'Tiguan',         'volkswagen-tiguan'),
    ('volkswagen',    'Touareg',        'volkswagen-touareg'),
    ('volkswagen',    'Amarok',         'volkswagen-amarok'),
    ('volkswagen',    'Type 2',         'volkswagen-type-2'),
    -- Jeep
    ('jeep',          'Grand Wagoneer', 'jeep-grand-wagoneer'),
    -- Acura
    ('acura',         'Integra',        'acura-integra'),
    ('acura',         'TLX',            'acura-tlx'),
    -- Mercedes-Benz
    ('mercedes-benz', 'G-Class',        'mercedes-benz-g-class'),
    ('mercedes-benz', 'GLC',            'mercedes-benz-glc'),
    ('mercedes-benz', 'A-Class',        'mercedes-benz-a-class'),
    ('mercedes-benz', 'B-Class',        'mercedes-benz-b-class'),
    -- Mazda
    ('mazda',         '6',              'mazda-6'),
    -- Peugeot
    ('peugeot',       '206',            'peugeot-206'),
    ('peugeot',       '208',            'peugeot-208'),
    ('peugeot',       '307',            'peugeot-307'),
    ('peugeot',       '308',            'peugeot-308'),
    ('peugeot',       '3008',           'peugeot-3008'),
    ('peugeot',       '5008',           'peugeot-5008'),
    ('peugeot',       '2008',           'peugeot-2008'),
    -- Volvo
    ('volvo',         'S40',            'volvo-s40'),
    ('volvo',         'S60',            'volvo-s60'),
    ('volvo',         'S80',            'volvo-s80'),
    ('volvo',         'C70',            'volvo-c70'),
    ('volvo',         'V70',            'volvo-v70'),
    ('volvo',         'XC40',           'volvo-xc40'),
    ('volvo',         'XC60',           'volvo-xc60'),
    ('volvo',         'XC90',           'volvo-xc90')
)
INSERT INTO public.models (name, slug, make_id)
SELECT nm.name, nm.model_slug, mk.id
FROM new_models nm
JOIN makes mk ON mk.slug = nm.make_slug
ON CONFLICT (slug) DO NOTHING;
