-- Lote 3 – Step 1: 3 new makes (Pontiac, Acura, Aston Martin)
-- Alfa Romeo and Dodge already exist in the makes table; no action for those.
-- Must run before Steps 2–4, which JOIN against this table.

INSERT INTO public.makes (name, slug)
VALUES
  ('Pontiac',       'pontiac'),
  ('Acura',         'acura'),
  ('Aston Martin',  'aston-martin');
