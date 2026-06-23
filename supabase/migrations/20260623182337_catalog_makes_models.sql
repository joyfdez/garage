-- Phase 1: create `makes` and `models` tables
-- Part of the catalog redesign: flat car_models → makes → models → generations
-- car_models is NOT touched by this migration.

-- ── makes ─────────────────────────────────────────────────────────────────
-- One row per manufacturer. No text duplication.

CREATE TABLE IF NOT EXISTS public.makes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  slug       TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT makes_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX IF NOT EXISTS makes_slug_idx ON public.makes(slug);

ALTER TABLE public.makes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "makes: public read"
  ON public.makes FOR SELECT
  USING (true);

GRANT SELECT ON public.makes TO anon, authenticated;


-- ── models ────────────────────────────────────────────────────────────────
-- One row per distinct (make, model-name) pair.
-- "Alfa Romeo Spider" is one row here; its 105-series and 916-series are
-- separate generation rows in car_models, both pointing to this single row.

CREATE TABLE IF NOT EXISTS public.models (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  make_id    UUID        NOT NULL REFERENCES public.makes(id) ON DELETE RESTRICT,
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT models_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  UNIQUE (make_id, name)
);

CREATE INDEX IF NOT EXISTS models_make_id_idx ON public.models(make_id);
CREATE INDEX IF NOT EXISTS models_slug_idx    ON public.models(slug);

ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "models: public read"
  ON public.models FOR SELECT
  USING (true);

GRANT SELECT ON public.models TO anon, authenticated;
