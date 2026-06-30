-- User follows: asymmetric graph, Twitter-style.
-- follower_id follows following_id.
-- RLS: public read; authenticated users insert/delete only their own rows.

CREATE TABLE public.follows (
  follower_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS follows_follower_id_idx  ON public.follows(follower_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows: anyone can read"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "follows: insert own"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows: delete own"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);
