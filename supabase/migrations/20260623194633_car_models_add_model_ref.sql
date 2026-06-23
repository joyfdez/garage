-- Phase 3a: add model_ref_id column to car_models (nullable, no backfill yet)
--
-- Named model_ref_id deliberately — NOT model_id, which is already used on
-- the cars table to mean "which car_models row does this car use."
-- Here it means "which models row is this generation a child of."
--
-- ON DELETE RESTRICT: prevents deleting a models row while any generation
-- in car_models still points to it. Catalog integrity is protected at DB level.
--
-- Index added immediately so the UPDATE backfill in Phase 3b is efficient.

ALTER TABLE public.car_models
  ADD COLUMN IF NOT EXISTS model_ref_id UUID
    REFERENCES public.models(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS car_models_model_ref_id_idx
  ON public.car_models(model_ref_id);
