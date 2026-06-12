-- Phase 2: Storage bucket + policies for car photos
-- Bucket: car-photos (public reads; authenticated writes)
-- Path convention: {car_id}/{uuid}.webp

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'car-photos',
  'car-photos',
  true,          -- public: car pages are public
  5242880,       -- 5 MB; client-side compression handles actual upload size
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Public read (car pages are shareable by URL)
CREATE POLICY "car-photos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'car-photos');

-- Only the car owner may upload photos for their car.
-- Path: {car_id}/{uuid}.webp — first segment is the car UUID.
CREATE POLICY "car-photos: owner upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'car-photos'
    AND EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id::text = (storage.foldername(name))[1]
        AND cars.current_owner_id = auth.uid()
    )
  );

CREATE POLICY "car-photos: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'car-photos'
    AND EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id::text = (storage.foldername(name))[1]
        AND cars.current_owner_id = auth.uid()
    )
  );

CREATE POLICY "car-photos: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'car-photos'
    AND EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id::text = (storage.foldername(name))[1]
        AND cars.current_owner_id = auth.uid()
    )
  );
