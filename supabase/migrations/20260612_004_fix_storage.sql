-- Fix car-photos policies: path[1] is userId, not car_id (photos upload before car creation)
-- Also adds avatars bucket for profile pictures.
-- Run this in Supabase SQL Editor.

-- ── Fix car-photos upload/update/delete policies ───────────────────────────

DROP POLICY IF EXISTS "car-photos: owner upload"  ON storage.objects;
DROP POLICY IF EXISTS "car-photos: owner update"  ON storage.objects;
DROP POLICY IF EXISTS "car-photos: owner delete"  ON storage.objects;

CREATE POLICY "car-photos: owner upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'car-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "car-photos: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'car-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "car-photos: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'car-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Add avatars bucket ─────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: owner upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
