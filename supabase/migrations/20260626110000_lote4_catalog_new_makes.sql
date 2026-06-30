-- Lote 4 – Step 1: 3 new makes (Citroën, GMC, Alpine)
-- Must run before Steps 2–4, which JOIN against this table.

INSERT INTO public.makes (name, slug)
VALUES
  ('Citroën', 'citroen'),
  ('GMC',     'gmc'),
  ('Alpine',  'alpine');
