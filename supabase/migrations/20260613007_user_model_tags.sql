-- user_model_tags: track models a user has driven or wants to drive
CREATE TYPE public.model_tag_type AS ENUM ('driven', 'wishlist');

CREATE TABLE public.user_model_tags (
  id         UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID                    NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
  model_id   UUID                    NOT NULL REFERENCES public.car_models(id) ON DELETE CASCADE,
  tag_type   public.model_tag_type   NOT NULL,
  created_at TIMESTAMPTZ             NOT NULL DEFAULT now(),
  UNIQUE (user_id, model_id, tag_type)
);

CREATE INDEX ON public.user_model_tags(user_id, tag_type);
CREATE INDEX ON public.user_model_tags(model_id);

ALTER TABLE public.user_model_tags ENABLE ROW LEVEL SECURITY;

-- Public read so profile counters work for any visitor
CREATE POLICY "Public read model tags"
  ON public.user_model_tags FOR SELECT
  USING (true);

CREATE POLICY "Owner insert model tags"
  ON public.user_model_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner delete model tags"
  ON public.user_model_tags FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT                ON public.user_model_tags TO anon, authenticated;
GRANT INSERT, DELETE        ON public.user_model_tags TO authenticated;
