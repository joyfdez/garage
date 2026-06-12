-- Phase 2: Schema — tables, enums, indexes
-- Garage Journal v1

-- ── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE public.car_source     AS ENUM ('seed', 'user');
CREATE TYPE public.car_visibility AS ENUM ('public', 'private');
CREATE TYPE public.event_type     AS ENUM ('build', 'fix', 'service', 'story');

-- ── Profiles ───────────────────────────────────────────────────────────────
-- 1:1 with auth.users; created during onboarding when user picks a username.

CREATE TABLE public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username     TEXT        UNIQUE NOT NULL,
  display_name TEXT,
  location     TEXT,
  bio          TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_username_format CHECK (username ~ '^[a-z0-9_]{2,30}$')
);

-- ── Car models (read-only seed catalog) ────────────────────────────────────

CREATE TABLE public.car_models (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  make         TEXT        NOT NULL,
  model        TEXT        NOT NULL,
  generation   TEXT        NOT NULL,
  chassis_code TEXT,
  year_start   INT         NOT NULL,
  year_end     INT,
  engines      TEXT[]      NOT NULL DEFAULT '{}',
  slug         TEXT        UNIQUE NOT NULL,
  source       public.car_source NOT NULL DEFAULT 'seed',
  CONSTRAINT car_models_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- ── Cars ───────────────────────────────────────────────────────────────────
-- The central object. VIN is in a separate table (car_vins) — owner-only.

CREATE TABLE public.cars (
  id                    UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT                    UNIQUE NOT NULL,
  current_owner_id      UUID                    NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  model_id              UUID                    REFERENCES public.car_models(id) ON DELETE SET NULL,
  custom_make           TEXT,
  custom_model          TEXT,
  custom_generation     TEXT,
  year                  INT                     NOT NULL,
  engine                TEXT,
  transmission          TEXT,
  color                 TEXT,
  nickname              TEXT,
  location              TEXT,
  cover_photo_path      TEXT,
  visibility            public.car_visibility   NOT NULL DEFAULT 'public',
  created_at            TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  CONSTRAINT cars_model_or_custom CHECK (
    model_id IS NOT NULL
    OR (custom_make IS NOT NULL AND custom_model IS NOT NULL)
  )
);

-- ── Car VINs ───────────────────────────────────────────────────────────────
-- Separate table so RLS can guarantee VIN never leaks to non-owners.
-- Application code never joins this in public queries.

CREATE TABLE public.car_vins (
  car_id UUID PRIMARY KEY REFERENCES public.cars(id) ON DELETE CASCADE,
  vin    TEXT NOT NULL
);

-- ── Ownerships ─────────────────────────────────────────────────────────────

CREATE TABLE public.ownerships (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id     UUID  NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  user_id    UUID  NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  start_date DATE,
  end_date   DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Car events ─────────────────────────────────────────────────────────────
-- Unified table; build & fix are different forms, same structure.
-- details jsonb schema: fix → {problem, diagnosis, solution}

CREATE TABLE public.car_events (
  id          UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id      UUID                NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  author_id   UUID                NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  type        public.event_type   NOT NULL,
  title       TEXT                NOT NULL,
  description TEXT,
  details     JSONB,
  event_date  DATE                NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- ── Photos ─────────────────────────────────────────────────────────────────
-- event_id nullable: gallery-only photos have no event.
-- storage path: {car_id}/{uuid}.webp

CREATE TABLE public.photos (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id       UUID        NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  event_id     UUID        REFERENCES public.car_events(id) ON DELETE SET NULL,
  storage_path TEXT        NOT NULL,
  position     INT         NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX ON public.cars(current_owner_id);
CREATE INDEX ON public.cars(model_id);
CREATE INDEX ON public.cars(visibility);
CREATE INDEX ON public.ownerships(car_id);
CREATE INDEX ON public.ownerships(user_id);
CREATE INDEX ON public.car_events(car_id);
CREATE INDEX ON public.car_events(car_id, event_date DESC);
CREATE INDEX ON public.car_events(type);
CREATE INDEX ON public.photos(car_id);
CREATE INDEX ON public.photos(event_id);
CREATE INDEX ON public.car_models(make, model);
-- Phase 2: RLS policies
-- All authorization lives here — never solely in app code.

-- ── Enable RLS ─────────────────────────────────────────────────────────────

ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_vins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos     ENABLE ROW LEVEL SECURITY;

-- ── profiles ───────────────────────────────────────────────────────────────

CREATE POLICY "profiles: public read"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles: owner insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: owner update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── car_models ─────────────────────────────────────────────────────────────

CREATE POLICY "car_models: public read"
  ON public.car_models FOR SELECT
  USING (true);

-- ── cars ───────────────────────────────────────────────────────────────────

CREATE POLICY "cars: read public or own"
  ON public.cars FOR SELECT
  USING (visibility = 'public' OR current_owner_id = auth.uid());

CREATE POLICY "cars: owner insert"
  ON public.cars FOR INSERT
  WITH CHECK (current_owner_id = auth.uid());

CREATE POLICY "cars: owner update"
  ON public.cars FOR UPDATE
  USING (current_owner_id = auth.uid());

CREATE POLICY "cars: owner delete"
  ON public.cars FOR DELETE
  USING (current_owner_id = auth.uid());

-- ── car_vins — owner only ──────────────────────────────────────────────────
-- This table is the VIN firewall. Never joined in public queries.

CREATE POLICY "car_vins: owner only"
  ON public.car_vins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_vins.car_id
        AND cars.current_owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_vins.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

-- ── ownerships ─────────────────────────────────────────────────────────────

CREATE POLICY "ownerships: read follows car visibility"
  ON public.ownerships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = ownerships.car_id
        AND (cars.visibility = 'public' OR cars.current_owner_id = auth.uid())
    )
  );

CREATE POLICY "ownerships: car owner insert"
  ON public.ownerships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = ownerships.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

CREATE POLICY "ownerships: car owner update"
  ON public.ownerships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = ownerships.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

-- ── car_events ─────────────────────────────────────────────────────────────

CREATE POLICY "car_events: read follows car visibility"
  ON public.car_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_events.car_id
        AND (cars.visibility = 'public' OR cars.current_owner_id = auth.uid())
    )
  );

CREATE POLICY "car_events: car owner insert"
  ON public.car_events FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_events.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

CREATE POLICY "car_events: car owner update"
  ON public.car_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_events.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

CREATE POLICY "car_events: car owner delete"
  ON public.car_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = car_events.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

-- ── photos ─────────────────────────────────────────────────────────────────

CREATE POLICY "photos: read follows car visibility"
  ON public.photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = photos.car_id
        AND (cars.visibility = 'public' OR cars.current_owner_id = auth.uid())
    )
  );

CREATE POLICY "photos: car owner insert"
  ON public.photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = photos.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

CREATE POLICY "photos: car owner update"
  ON public.photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = photos.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

CREATE POLICY "photos: car owner delete"
  ON public.photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cars
      WHERE cars.id = photos.car_id
        AND cars.current_owner_id = auth.uid()
    )
  );

-- ── Grants ─────────────────────────────────────────────────────────────────
-- anon gets read access where RLS allows it.
-- authenticated gets full DML, gated by RLS.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.profiles   TO anon, authenticated;
GRANT SELECT ON public.car_models TO anon, authenticated;
GRANT SELECT ON public.cars       TO anon, authenticated;
GRANT SELECT ON public.ownerships TO anon, authenticated;
GRANT SELECT ON public.car_events TO anon, authenticated;
GRANT SELECT ON public.photos     TO anon, authenticated;

GRANT INSERT, UPDATE         ON public.profiles   TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cars       TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.car_vins   TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ownerships TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.car_events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.photos     TO authenticated;
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
-- car_models seed — ~250 enthusiast-relevant models
-- One row per generation; engine variants in the engines array.
-- Slugs: lowercase, hyphens only, no special chars.

INSERT INTO public.car_models (make, model, generation, chassis_code, year_start, year_end, engines, slug, source) VALUES

-- ── Mazda ──────────────────────────────────────────────────────────────────
('Mazda', 'MX-5', 'NA',  'NA6CE/NA8C',  1989, 1997, ARRAY['B6-ZE','BP-ZE'],                         'mazda-mx5-na',   'seed'),
('Mazda', 'MX-5', 'NB',  'NB6C/NB8C',   1998, 2005, ARRAY['BP-ZE','BP-Z3'],                         'mazda-mx5-nb',   'seed'),
('Mazda', 'MX-5', 'NC',  'NCEC',         2005, 2015, ARRAY['LF-VE','MZR 2.0'],                       'mazda-mx5-nc',   'seed'),
('Mazda', 'MX-5', 'ND',  'ND5RC',        2015, NULL, ARRAY['P5-VPS','P5-VP'],                        'mazda-mx5-nd',   'seed'),
('Mazda', 'RX-7', 'FC',  'FC3S',         1985, 1992, ARRAY['13B-T','13B-TURBO II'],                  'mazda-rx7-fc',   'seed'),
('Mazda', 'RX-7', 'FD',  'FD3S',         1992, 2002, ARRAY['13B-REW'],                               'mazda-rx7-fd',   'seed'),
('Mazda', 'RX-8', NULL,  'SE3P',         2003, 2012, ARRAY['13B-MSP RENESIS'],                       'mazda-rx8',      'seed'),
('Mazda', '323',  'BG',  'BG',           1989, 1994, ARRAY['B6T','B6','BP-T'],                       'mazda-323-bg',   'seed'),
('Mazda', '3',    'BK',  'BK',           2003, 2009, ARRAY['LF-DE','LF-VE','MZR 2.3 DISI'],          'mazda-3-bk',     'seed'),
('Mazda', '3',    'BL',  'BL',           2009, 2013, ARRAY['LF-VD','LF-VE','MZR 2.3 DISI'],          'mazda-3-bl',     'seed'),

-- ── BMW ────────────────────────────────────────────────────────────────────
('BMW', '3 Series', 'E21', 'E21', 1975, 1983, ARRAY['M10B18','M10B20','M20B20'],                        'bmw-3-series-e21', 'seed'),
('BMW', '3 Series', 'E30', 'E30', 1982, 1994, ARRAY['M10B18','M20B20','M20B25','M42B18','S14B20'],       'bmw-3-series-e30', 'seed'),
('BMW', '3 Series', 'E36', 'E36', 1990, 2000, ARRAY['M40B16','M40B18','M43B18','M50B25','M52B28','S50B30','S52B32'], 'bmw-3-series-e36', 'seed'),
('BMW', '3 Series', 'E46', 'E46', 1997, 2006, ARRAY['M43B19','N42B20','M52B25','M54B25','M54B30','S54B32'],          'bmw-3-series-e46', 'seed'),
('BMW', '3 Series', 'E90', 'E90/E92', 2004, 2013, ARRAY['N46B20','N52B25','N54B30','N55B30','S65B40'],              'bmw-3-series-e90', 'seed'),
('BMW', '3 Series', 'F30', 'F30/F32', 2011, 2019, ARRAY['N20B20','N26B20','N55B30','S55B30'],                        'bmw-3-series-f30', 'seed'),
('BMW', '3 Series', 'G20', 'G20',    2018, NULL, ARRAY['B46B20','B48B20','B58B30','S58B30'],                          'bmw-3-series-g20', 'seed'),
('BMW', '5 Series', 'E28', 'E28', 1981, 1988, ARRAY['M20B25','M30B34','M88/3'],                       'bmw-5-series-e28', 'seed'),
('BMW', '5 Series', 'E34', 'E34', 1988, 1996, ARRAY['M20B25','M50B25','M60B40','S38B38'],              'bmw-5-series-e34', 'seed'),
('BMW', '5 Series', 'E39', 'E39', 1995, 2004, ARRAY['M52B28','M54B30','M62B44','S62B50'],              'bmw-5-series-e39', 'seed'),
('BMW', '5 Series', 'E60', 'E60', 2003, 2010, ARRAY['N52B25','N52B30','N62B48','S85B50'],              'bmw-5-series-e60', 'seed'),
('BMW', '6 Series', 'E24', 'E24', 1976, 1989, ARRAY['M30B28','M30B34','M88/3'],                        'bmw-6-series-e24', 'seed'),
('BMW', '2002',     NULL,  'E10', 1968, 1976, ARRAY['M10B20','M10B20 Turbo'],                           'bmw-2002',         'seed'),
('BMW', 'Z3',       'E36/7', 'E36/7', 1995, 2002, ARRAY['M43B19','M52B25','S52B32','S54B32'],           'bmw-z3',           'seed'),
('BMW', 'Z4',       'E85',   'E85',   2002, 2008, ARRAY['N46B20','N52B25','S54B32'],                    'bmw-z4-e85',       'seed'),
('BMW', '1 Series', 'E87',   'E87',   2004, 2011, ARRAY['N45B16','N46B20','N54B30'],                    'bmw-1-series-e87', 'seed'),
('BMW', 'M2',       'F87',   'F87',   2015, 2021, ARRAY['N55B30','S55B30'],                             'bmw-m2-f87',       'seed'),
('BMW', 'M2',       'G87',   'G87',   2022, NULL, ARRAY['S58B30'],                                      'bmw-m2-g87',       'seed'),

-- ── Toyota ─────────────────────────────────────────────────────────────────
('Toyota', 'Corolla',     'AE86',  'AE86',      1983, 1987, ARRAY['3A-U','4A-GE'],                           'toyota-corolla-ae86',     'seed'),
('Toyota', 'Supra',       'A70',   'A70',        1986, 1993, ARRAY['1G-GTE','7M-GE','7M-GTE'],               'toyota-supra-a70',        'seed'),
('Toyota', 'Supra',       'A80',   'A80',        1993, 2002, ARRAY['2JZ-GE','2JZ-GTE'],                      'toyota-supra-a80',        'seed'),
('Toyota', 'Supra',       'A90',   'A90',        2019, NULL, ARRAY['B48B20','B58B30'],                       'toyota-supra-a90',        'seed'),
('Toyota', '86',          'ZN6',   'ZN6',        2012, 2021, ARRAY['FA20D'],                                 'toyota-86-zn6',           'seed'),
('Toyota', 'GR86',        'ZN8',   'ZN8',        2021, NULL, ARRAY['FA24D'],                                 'toyota-gr86-zn8',         'seed'),
('Toyota', 'GR Yaris',   NULL,    'GXPA16',     2020, NULL, ARRAY['G16E-GTS'],                              'toyota-gr-yaris',         'seed'),
('Toyota', 'GR Corolla', NULL,    'GZEA10H',    2022, NULL, ARRAY['G16E-GTS'],                              'toyota-gr-corolla',       'seed'),
('Toyota', 'Land Cruiser','FJ40',  'FJ40',       1960, 1984, ARRAY['F','2F','3F'],                           'toyota-land-cruiser-fj40','seed'),
('Toyota', 'Land Cruiser','60 Series','FJ60',    1980, 1987, ARRAY['2F','3F','2H'],                          'toyota-land-cruiser-60',  'seed'),
('Toyota', 'Land Cruiser','70 Series','HZJ/KZJ', 1984, NULL, ARRAY['3F','1HZ','1KZ-TE','1VD-FTV'],          'toyota-land-cruiser-70',  'seed'),
('Toyota', 'Land Cruiser','80 Series','FJ80/HDJ', 1989, 1997, ARRAY['3F-E','1FZ-FE','1HD-T','1HD-FT'],      'toyota-land-cruiser-80',  'seed'),
('Toyota', 'Land Cruiser','100 Series','HDJ100', 1997, 2007, ARRAY['1FZ-FE','2UZ-FE','1HD-FTE'],            'toyota-land-cruiser-100', 'seed'),
('Toyota', 'MR2',         'AW11',  'AW11',       1984, 1989, ARRAY['3A-LU','4A-GE'],                        'toyota-mr2-aw11',         'seed'),
('Toyota', 'MR2',         'SW20',  'SW20',       1989, 1999, ARRAY['3S-GE','3S-GTE'],                       'toyota-mr2-sw20',         'seed'),
('Toyota', 'MR2',         'ZZW30', 'ZZW30',      1999, 2007, ARRAY['1ZZ-FE'],                               'toyota-mr2-zzw30',        'seed'),
('Toyota', 'Celica',      'ST185', 'ST185',      1989, 1993, ARRAY['3S-GTE'],                               'toyota-celica-st185',     'seed'),
('Toyota', 'Celica',      'ST205', 'ST205',      1994, 1999, ARRAY['3S-GTE'],                               'toyota-celica-st205',     'seed'),
('Toyota', 'Celica',      'ZZT230','ZZT230',     1999, 2006, ARRAY['1ZZ-FE','2ZZ-GE'],                      'toyota-celica-zzt230',    'seed'),
('Toyota', 'Chaser',      'JZX100','JZX100',     1996, 2001, ARRAY['1JZ-GE','1JZ-GTE','2JZ-GE'],           'toyota-chaser-jzx100',    'seed'),
('Toyota', '2000GT',      NULL,    'MF10',       1967, 1970, ARRAY['2M','3M'],                              'toyota-2000gt',           'seed'),

-- ── Honda ──────────────────────────────────────────────────────────────────
('Honda', 'Civic', 'EF', 'EF',   1987, 1991, ARRAY['D15B','D16A','B16A'],                                   'honda-civic-ef',   'seed'),
('Honda', 'Civic', 'EG', 'EG',   1991, 1995, ARRAY['D15B','D16Z6','B16A2','B18C'],                          'honda-civic-eg',   'seed'),
('Honda', 'Civic', 'EK', 'EK',   1995, 2000, ARRAY['D16Y7','D16Y8','B16A2','B18C5'],                        'honda-civic-ek',   'seed'),
('Honda', 'Civic', 'EP3','EP3',  2001, 2005, ARRAY['K20A','K20A2','D17A'],                                   'honda-civic-ep3',  'seed'),
('Honda', 'Civic', 'FN2','FN2',  2006, 2011, ARRAY['K20Z4','R18A'],                                         'honda-civic-fn2',  'seed'),
('Honda', 'Civic Type R', 'FK8', 'FK8', 2017, 2021, ARRAY['K20C1'],                                         'honda-civic-fk8',  'seed'),
('Honda', 'Civic Type R', 'FL5', 'FL5', 2022, NULL, ARRAY['K20C1'],                                         'honda-civic-fl5',  'seed'),
('Honda', 'CR-X', 'EF',  'EF',   1987, 1991, ARRAY['D15B2','D16A6','B16A'],                                 'honda-crx-ef',     'seed'),
('Honda', 'S2000', NULL, 'AP1/AP2', 1999, 2009, ARRAY['F20C','F22C'],                                       'honda-s2000',      'seed'),
('Honda', 'NSX',  'NA1', 'NA1',  1990, 2005, ARRAY['C30A','C32B'],                                          'honda-nsx-na1',    'seed'),
('Honda', 'NSX',  'NC1', 'NC1',  2016, 2022, ARRAY['J35Y5 Hybrid'],                                         'honda-nsx-nc1',    'seed'),
('Honda', 'Integra', 'DC2', 'DC2', 1993, 2001, ARRAY['B18B1','B18C1','B18C5'],                               'honda-integra-dc2','seed'),
('Honda', 'Integra', 'DC5', 'DC5', 2001, 2006, ARRAY['K20A','K20A2'],                                       'honda-integra-dc5','seed'),
('Honda', 'Beat', NULL,  'PP1',  1991, 1996, ARRAY['E07A'],                                                  'honda-beat-pp1',   'seed'),
('Honda', 'Prelude', 'BB6', 'BB6', 1997, 2001, ARRAY['H22A','F22B'],                                        'honda-prelude-bb6','seed'),

-- ── Nissan / Datsun ────────────────────────────────────────────────────────
('Datsun', '240Z', 'S30', 'S30', 1969, 1973, ARRAY['L24'],                                                   'datsun-240z-s30',     'seed'),
('Datsun', '260Z', 'S30', 'S30', 1973, 1978, ARRAY['L26','L28'],                                             'datsun-260z-s30',     'seed'),
('Nissan', '300ZX', 'Z31', 'Z31', 1983, 1989, ARRAY['VG30E','VG30ET'],                                      'nissan-300zx-z31',    'seed'),
('Nissan', '300ZX', 'Z32', 'Z32', 1989, 1996, ARRAY['VG30DE','VG30DETT'],                                   'nissan-300zx-z32',    'seed'),
('Nissan', 'Skyline', 'R30', 'R30', 1981, 1985, ARRAY['CA18ET','FJ20ET'],                                   'nissan-skyline-r30',  'seed'),
('Nissan', 'Skyline', 'R31', 'R31', 1985, 1989, ARRAY['CA18DE','RB20DE','RB20DET'],                         'nissan-skyline-r31',  'seed'),
('Nissan', 'Skyline', 'R32', 'BNR32', 1989, 1994, ARRAY['RB20DE','RB20DET','RB26DETT'],                     'nissan-skyline-r32',  'seed'),
('Nissan', 'Skyline', 'R33', 'BCNR33', 1995, 1998, ARRAY['RB25DE','RB25DET','RB26DETT'],                    'nissan-skyline-r33',  'seed'),
('Nissan', 'Skyline', 'R34', 'BNR34', 1999, 2002, ARRAY['RB25DE','RB25DET','RB26DETT'],                     'nissan-skyline-r34',  'seed'),
('Nissan', 'Silvia', 'S13', 'S13',  1988, 1994, ARRAY['CA18DE','CA18DET','SR20DE','SR20DET'],                'nissan-silvia-s13',   'seed'),
('Nissan', 'Silvia', 'S14', 'S14',  1993, 1998, ARRAY['SR20DE','SR20DET'],                                  'nissan-silvia-s14',   'seed'),
('Nissan', 'Silvia', 'S15', 'S15',  1999, 2002, ARRAY['SR20DE','SR20DET'],                                  'nissan-silvia-s15',   'seed'),
('Nissan', '350Z', 'Z33', 'Z33',   2002, 2009, ARRAY['VQ35DE','VQ35HR'],                                    'nissan-350z-z33',     'seed'),
('Nissan', '370Z', 'Z34', 'Z34',   2009, 2021, ARRAY['VQ37VHR'],                                            'nissan-370z-z34',     'seed'),
('Nissan', 'GT-R', 'R35', 'R35',   2007, NULL, ARRAY['VR38DETT'],                                           'nissan-gt-r-r35',     'seed'),
('Nissan', 'Stagea', 'WC34', 'WC34', 1996, 2001, ARRAY['RB25DE','RB25DET','RB26DETT'],                      'nissan-stagea-wc34',  'seed'),

-- ── Volkswagen ─────────────────────────────────────────────────────────────
('Volkswagen', 'Golf', 'Mk1', '17',  1974, 1983, ARRAY['1.1','1.5','1.6 GTI'],                              'vw-golf-mk1', 'seed'),
('Volkswagen', 'Golf', 'Mk2', '19E', 1983, 1992, ARRAY['1.6','1.8 GTI','1.8 G60','16V'],                    'vw-golf-mk2', 'seed'),
('Volkswagen', 'Golf', 'Mk3', '1HX', 1991, 1997, ARRAY['1.8','2.0','2.8 VR6','1.9 TDI'],                   'vw-golf-mk3', 'seed'),
('Volkswagen', 'Golf', 'Mk4', '1J',  1997, 2004, ARRAY['1.6','1.8T','2.3 V5','2.8 V6','R32','1.9 TDI'],    'vw-golf-mk4', 'seed'),
('Volkswagen', 'Golf', 'Mk5', '1K',  2003, 2009, ARRAY['1.4 TSI','2.0 TSI GTI','2.0 TDI','R32'],           'vw-golf-mk5', 'seed'),
('Volkswagen', 'Golf', 'Mk6', '5K',  2008, 2013, ARRAY['1.2 TSI','2.0 TSI GTI','2.0 TDI','Golf R'],        'vw-golf-mk6', 'seed'),
('Volkswagen', 'Golf', 'Mk7', 'AU',  2012, 2020, ARRAY['1.0 TSI','1.4 TSI','2.0 TSI GTI','2.0 TSI R'],     'vw-golf-mk7', 'seed'),
('Volkswagen', 'Golf', 'Mk8', 'CD1', 2019, NULL, ARRAY['1.0 eTSI','1.5 eTSI','2.0 TSI GTI','2.0 TSI R'],  'vw-golf-mk8', 'seed'),
('Volkswagen', 'Golf R', 'Mk7', 'AU', 2013, 2020, ARRAY['EA888 2.0 TSI'],                                   'vw-golf-r-mk7', 'seed'),
('Volkswagen', 'Corrado', NULL, '50', 1988, 1995, ARRAY['1.8 G60','2.0','2.8 VR6','2.9 VR6'],               'vw-corrado',  'seed'),
('Volkswagen', 'Scirocco', 'Mk1', '53', 1974, 1981, ARRAY['1.1','1.5','1.6 GTI'],                           'vw-scirocco-mk1', 'seed'),
('Volkswagen', 'Scirocco', 'Mk2', '53B', 1981, 1992, ARRAY['1.6','1.8 GTI','1.8 G60','2.0 16V'],            'vw-scirocco-mk2', 'seed'),
('Volkswagen', 'Polo GTI', '9N',  '9N', 2005, 2009, ARRAY['1.8T 20V'],                                      'vw-polo-gti-9n', 'seed'),
('Volkswagen', 'Polo GTI', '6R',  '6R', 2010, 2017, ARRAY['1.4 TSI'],                                       'vw-polo-gti-6r', 'seed'),
('Volkswagen', 'Lupo GTI', NULL, '6X', 2000, 2005, ARRAY['1.6 FSI'],                                         'vw-lupo-gti',    'seed'),

-- ── Porsche ────────────────────────────────────────────────────────────────
('Porsche', '911', 'G-body',  '930',  1973, 1989, ARRAY['2.7','3.0 SC','3.2 Carrera','3.3 Turbo'],          'porsche-911-g',       'seed'),
('Porsche', '911', '964',     '964',  1989, 1994, ARRAY['3.6 Carrera 2/4','3.3 Turbo','3.6 Turbo'],         'porsche-911-964',     'seed'),
('Porsche', '911', '993',     '993',  1994, 1998, ARRAY['3.6 Carrera','3.6 Turbo','3.8 Carrera S'],         'porsche-911-993',     'seed'),
('Porsche', '911', '996',     '996',  1997, 2005, ARRAY['3.4 Carrera','3.6 Carrera S','3.6 Turbo'],         'porsche-911-996',     'seed'),
('Porsche', '911', '997',     '997',  2004, 2012, ARRAY['3.6 Carrera','3.8 Carrera S','3.6 Turbo','GT3'],   'porsche-911-997',     'seed'),
('Porsche', '911', '991',     '991',  2011, 2019, ARRAY['3.4 Carrera','3.8 Carrera S','GT3','GT3 RS'],      'porsche-911-991',     'seed'),
('Porsche', '911', '992',     '992',  2019, NULL, ARRAY['3.0 Carrera','3.0 Carrera S','GT3','GT3 RS'],      'porsche-911-992',     'seed'),
('Porsche', '914', NULL,      '914',  1969, 1976, ARRAY['1.7','2.0','914/6 2.0'],                           'porsche-914',         'seed'),
('Porsche', '924', NULL,      '924',  1976, 1988, ARRAY['2.0','2.0 Turbo'],                                 'porsche-924',         'seed'),
('Porsche', '944', NULL,      '944',  1982, 1991, ARRAY['2.5','2.5 Turbo','3.0 S2'],                        'porsche-944',         'seed'),
('Porsche', 'Boxster', '986', '986',  1996, 2004, ARRAY['2.5','2.7','3.2 S'],                               'porsche-boxster-986', 'seed'),
('Porsche', 'Boxster', '987', '987',  2004, 2012, ARRAY['2.7','3.2 S','3.4 Spyder'],                        'porsche-boxster-987', 'seed'),
('Porsche', 'Cayman', '987c', '987c', 2005, 2013, ARRAY['2.7','3.4 S','3.4 R'],                             'porsche-cayman-987c', 'seed'),
('Porsche', '356', NULL,      '356',  1948, 1965, ARRAY['1.1','1.3','1.5','1.6','2.0'],                     'porsche-356',         'seed'),

-- ── Ford ───────────────────────────────────────────────────────────────────
('Ford', 'Mustang', 'Gen 1', NULL,   1964, 1973, ARRAY['170 I6','289 V8','302 V8','390 V8','428 V8'],       'ford-mustang-gen1',   'seed'),
('Ford', 'Mustang', 'Gen 2', 'II',   1974, 1978, ARRAY['2.3','2.8 V6','302 V8'],                            'ford-mustang-gen2',   'seed'),
('Ford', 'Mustang', 'Gen 3', 'Fox',  1979, 1993, ARRAY['2.3','3.8 V6','5.0 V8','5.0 HO'],                  'ford-mustang-gen3',   'seed'),
('Ford', 'Mustang', 'Gen 4', 'SN95', 1994, 2004, ARRAY['3.8 V6','4.6 GT','4.6 Cobra'],                     'ford-mustang-gen4',   'seed'),
('Ford', 'Mustang', 'Gen 5', 'S197', 2005, 2014, ARRAY['4.0 V6','4.6 GT','5.4 Shelby GT500'],              'ford-mustang-gen5',   'seed'),
('Ford', 'Mustang', 'Gen 6', 'S550', 2015, 2023, ARRAY['2.3 EcoBoost','5.0 GT','5.2 Shelby GT500'],        'ford-mustang-gen6',   'seed'),
('Ford', 'Mustang', 'Gen 7', 'S650', 2024, NULL, ARRAY['2.3 EcoBoost','5.0 GT','5.2 Dark Horse'],          'ford-mustang-gen7',   'seed'),
('Ford', 'Escort',  'Mk1',  NULL,    1968, 1975, ARRAY['1.1 Kent','1.3 Kent','1.6 BDA','1.6 BDG'],          'ford-escort-mk1',     'seed'),
('Ford', 'Escort',  'Mk2',  NULL,    1975, 1980, ARRAY['1.1','1.3','1.6','2.0 RS2000','1.8 RS'],            'ford-escort-mk2',     'seed'),
('Ford', 'Sierra',  'RS Cosworth', NULL, 1986, 1992, ARRAY['YBB 2.0T','YBJ 4x4'],                          'ford-sierra-rs-cossie','seed'),
('Ford', 'Fiesta',  'ST Mk7', 'JA8', 2013, 2017, ARRAY['EcoBoost 1.6'],                                    'ford-fiesta-st-mk7',  'seed'),
('Ford', 'Fiesta',  'ST Mk8', 'JHH', 2018, 2022, ARRAY['EcoBoost 1.5'],                                    'ford-fiesta-st-mk8',  'seed'),
('Ford', 'Focus',   'ST Mk2', 'DA3', 2005, 2011, ARRAY['2.5T ST'],                                         'ford-focus-st-mk2',   'seed'),
('Ford', 'Focus',   'RS Mk2', 'DA3', 2009, 2010, ARRAY['2.5T RS'],                                         'ford-focus-rs-mk2',   'seed'),
('Ford', 'Focus',   'RS Mk3', 'DYB', 2016, 2018, ARRAY['2.3 EcoBoost RS'],                                 'ford-focus-rs-mk3',   'seed'),
('Ford', 'Bronco',  'Gen 6', NULL,   2021, NULL, ARRAY['2.3 EcoBoost','2.7 EcoBoost V6'],                   'ford-bronco-gen6',    'seed'),

-- ── Mercedes-Benz ──────────────────────────────────────────────────────────
('Mercedes-Benz', 'W123',     NULL, 'W123', 1976, 1985, ARRAY['200','230E','280E','240D','300D'],            'mercedes-w123',      'seed'),
('Mercedes-Benz', 'W124',     NULL, 'W124', 1984, 1997, ARRAY['200E','230E','260E','300E','500E','300D'],    'mercedes-w124',      'seed'),
('Mercedes-Benz', '190E/W201',NULL, 'W201', 1982, 1993, ARRAY['1.8','2.0','2.3 Cosworth','2.5 Cosworth'],  'mercedes-w201',      'seed'),
('Mercedes-Benz', 'E-Class',  'W210','W210', 1995, 2003, ARRAY['E200','E320','E430','E55 AMG'],              'mercedes-w210',      'seed'),
('Mercedes-Benz', 'S-Class',  'W126','W126', 1979, 1991, ARRAY['280SE','380SE','420SE','560SEL'],           'mercedes-w126',      'seed'),
('Mercedes-Benz', 'SL',       'R107','R107', 1971, 1989, ARRAY['280SL','350SL','380SL','450SL','500SL'],   'mercedes-r107',      'seed'),
('Mercedes-Benz', 'SLK',      'R170','R170', 1996, 2004, ARRAY['200 Kompressor','230 Kompressor','32 AMG'],'mercedes-slk-r170',  'seed'),
('Mercedes-Benz', 'C-Class',  'W202','W202', 1993, 2000, ARRAY['C180','C200','C36 AMG','C43 AMG'],         'mercedes-w202',      'seed'),

-- ── Volvo ──────────────────────────────────────────────────────────────────
('Volvo', '240', NULL,   'P242/P245', 1974, 1993, ARRAY['B19A','B21A','B23E','B230F'],                      'volvo-240',    'seed'),
('Volvo', '740', NULL,   '744/745',   1984, 1992, ARRAY['B23F','B230F','B28F','B200'],                      'volvo-740',    'seed'),
('Volvo', '850', NULL,   '854/855',   1991, 1997, ARRAY['B5204S','B5234T','B5254S','B5254T'],               'volvo-850',    'seed'),
('Volvo', 'V70 R',NULL,  'P80',       1997, 2000, ARRAY['B5254T2'],                                         'volvo-v70r',   'seed'),
('Volvo', 'C30',  NULL,  'P1',        2006, 2013, ARRAY['2.0','2.4i','T5','2.0D'],                          'volvo-c30',    'seed'),

-- ── Subaru ─────────────────────────────────────────────────────────────────
('Subaru', 'Impreza WRX', 'GC8',  'GC8',  1992, 2000, ARRAY['EJ20G','EJ207'],                              'subaru-impreza-gc8',  'seed'),
('Subaru', 'Impreza WRX', 'GD',   'GDB',  2000, 2007, ARRAY['EJ205','EJ207'],                              'subaru-impreza-gd',   'seed'),
('Subaru', 'Impreza WRX', 'GR',   'GRB',  2007, 2014, ARRAY['EJ207','EJ255'],                              'subaru-impreza-gr',   'seed'),
('Subaru', 'WRX',         'VA',   'VA',   2014, 2021, ARRAY['FA20DIT','EJ257'],                             'subaru-wrx-va',       'seed'),
('Subaru', 'WRX',         'VB',   'VB',   2021, NULL, ARRAY['FA24F'],                                       'subaru-wrx-vb',       'seed'),
('Subaru', 'BRZ',         'ZC6',  'ZC6',  2012, 2021, ARRAY['FA20D'],                                       'subaru-brz-zc6',      'seed'),
('Subaru', 'BRZ',         'ZD8',  'ZD8',  2021, NULL, ARRAY['FA24D'],                                       'subaru-brz-zd8',      'seed'),
('Subaru', 'Legacy B4',   'BE5',  'BE5',  1998, 2003, ARRAY['EJ206','EJ208'],                               'subaru-legacy-b4-be5','seed'),
('Subaru', 'SVX',         NULL,   'CXW',  1991, 1997, ARRAY['EG33'],                                        'subaru-svx',          'seed'),

-- ── Mitsubishi ─────────────────────────────────────────────────────────────
('Mitsubishi', 'Lancer Evolution', 'Evo I',   'CD9A',  1992, 1993, ARRAY['4G63T'],                          'mitsubishi-evo-1',  'seed'),
('Mitsubishi', 'Lancer Evolution', 'Evo II',  'CE9A',  1994, 1995, ARRAY['4G63T'],                          'mitsubishi-evo-2',  'seed'),
('Mitsubishi', 'Lancer Evolution', 'Evo III', 'CE9A',  1995, 1996, ARRAY['4G63T'],                          'mitsubishi-evo-3',  'seed'),
('Mitsubishi', 'Lancer Evolution', 'Evo IV',  'CN9A',  1996, 1998, ARRAY['4G63T'],                          'mitsubishi-evo-4',  'seed'),
('Mitsubishi', 'Lancer Evolution', 'Evo V',   'CP9A',  1998, 1999, ARRAY['4G63T'],                          'mitsubishi-evo-5',  'seed'),
('Mitsubishi', 'Lancer Evolution', 'Evo VI',  'CP9A',  1999, 2001, ARRAY['4G63T'],                          'mitsubishi-evo-6',  'seed'),
('Mitsubishi', 'Lancer Evolution', 'Evo VII', 'CT9A',  2001, 2003, ARRAY['4G63T'],                          'mitsubishi-evo-7',  'seed'),
('Mitsubishi', 'Lancer Evolution', 'Evo VIII','CT9A',  2003, 2005, ARRAY['4G63T'],                          'mitsubishi-evo-8',  'seed'),
('Mitsubishi', 'Lancer Evolution', 'Evo IX',  'CT9A',  2005, 2007, ARRAY['4G63T'],                          'mitsubishi-evo-9',  'seed'),
('Mitsubishi', 'Lancer Evolution', 'Evo X',   'CZ4A',  2007, 2016, ARRAY['4B11T'],                          'mitsubishi-evo-10', 'seed'),
('Mitsubishi', 'Eclipse', '1G',  'D27A/D32A', 1989, 1994, ARRAY['4G37','4G63T','6G72'],                     'mitsubishi-eclipse-1g','seed'),
('Mitsubishi', 'Eclipse', '2G',  'D31A/D32A', 1994, 1999, ARRAY['4G64','4G63T','6G72T'],                    'mitsubishi-eclipse-2g','seed'),
('Mitsubishi', 'GTO/3000GT','NULL','Z15A/Z16A', 1990, 2000, ARRAY['6G72','6G72T'],                          'mitsubishi-gto',      'seed'),

-- ── Renault ────────────────────────────────────────────────────────────────
('Renault', '5',      'GT Turbo', 'C40', 1985, 1991, ARRAY['C1J Turbo'],                                    'renault-5-gt-turbo',    'seed'),
('Renault', 'Clio',   'RS Mk2',   'X65', 1998, 2005, ARRAY['F7R 2.0','F4R 2.0 RS'],                        'renault-clio-rs-mk2',   'seed'),
('Renault', 'Clio',   'RS Mk3',   'X85', 2005, 2012, ARRAY['F4R 2.0 RS','F4R 2.0 Cup'],                    'renault-clio-rs-mk3',   'seed'),
('Renault', 'Clio',   'RS Mk4',   'X98', 2013, 2019, ARRAY['M5Mt 1.6T Trophy','M5Mt 1.6T RS'],              'renault-clio-rs-mk4',   'seed'),
('Renault', 'Clio',   'V6',       NULL,  2001, 2005, ARRAY['V6 255hp','V6 230hp'],                          'renault-clio-v6',       'seed'),
('Renault', 'Mégane', 'RS Mk2',  'M84',  2004, 2010, ARRAY['F4Rt 2.0T'],                                   'renault-megane-rs-mk2', 'seed'),
('Renault', 'Mégane', 'RS Mk3',  'BZ0',  2010, 2016, ARRAY['M4R 2.0T','M4R 2.0T Trophy'],                  'renault-megane-rs-mk3', 'seed'),
('Renault', 'Alpine', 'A110',     'ANF',  2017, NULL, ARRAY['H5Ft 1.8T'],                                   'renault-alpine-a110',   'seed'),

-- ── Peugeot ────────────────────────────────────────────────────────────────
('Peugeot', '205',  'GTI',   NULL,  1984, 1994, ARRAY['TU1','XU5JA 1.6','XU9JA 1.9'],                      'peugeot-205-gti',  'seed'),
('Peugeot', '106',  'GTI',   NULL,  1991, 2003, ARRAY['TU5J4 1.6'],                                        'peugeot-106-gti',  'seed'),
('Peugeot', '306',  NULL,    NULL,  1993, 2002, ARRAY['XU5 1.4','TU5JP4','XU10J4','XU7JP 1.8'],             'peugeot-306',      'seed'),
('Peugeot', '207',  'GTI',   NULL,  2006, 2012, ARRAY['EP6DT 1.6T','EP6CDT THP'],                           'peugeot-207-gti',  'seed'),

-- ── Alfa Romeo ─────────────────────────────────────────────────────────────
('Alfa Romeo', 'Giulia', '105',  '105',  1963, 1978, ARRAY['1.3 Twin Cam','1.6 Twin Cam','1.75','2.0'],    'alfa-giulia-105',  'seed'),
('Alfa Romeo', 'Spider', '105',  '105',  1966, 1993, ARRAY['1.3','1.6','1.75','2.0'],                      'alfa-spider-105',  'seed'),
('Alfa Romeo', '75/Milano','116','116',  1985, 1992, ARRAY['1.6','1.8','2.0 Twin Spark','3.0 V6'],         'alfa-75-116',      'seed'),
('Alfa Romeo', 'GTV',    '916',  '916',  1993, 2004, ARRAY['2.0 Twin Spark','3.0 V6 24V'],                 'alfa-gtv-916',     'seed'),
('Alfa Romeo', 'Spider', '916',  '916',  1994, 2005, ARRAY['2.0 Twin Spark','3.0 V6'],                     'alfa-spider-916',  'seed'),
('Alfa Romeo', '147 GTA',NULL,  '937',   2003, 2005, ARRAY['3.2 V6 Busso'],                                'alfa-147-gta',     'seed'),
('Alfa Romeo', 'Giulia', '952',  '952',  2016, NULL, ARRAY['2.0T 200hp','2.0T 280hp','2.9 V6 Quadrifoglio'],'alfa-giulia-952', 'seed'),

-- ── Mini ───────────────────────────────────────────────────────────────────
('Mini', 'Mini',    'Classic', NULL,  1959, 2000, ARRAY['848cc','998cc','1071cc','1275cc'],                  'mini-classic',  'seed'),
('Mini', 'Mini',    'R53',     'R53', 2001, 2006, ARRAY['W10B16A','W11B16A Cooper S'],                       'mini-r53',      'seed'),
('Mini', 'Mini',    'R56',     'R56', 2006, 2013, ARRAY['N14B16A','N18B16A','N12B16A'],                      'mini-r56',      'seed'),

-- ── Land Rover ─────────────────────────────────────────────────────────────
('Land Rover', 'Series III', NULL,    NULL,   1971, 1985, ARRAY['2.25 Petrol','2.25 Diesel','3.5 V8'],       'landrover-series-3',    'seed'),
('Land Rover', 'Defender',   'Classic','90/110', 1983, 2016, ARRAY['2.5 Petrol','200Tdi','300Tdi','TD5'],    'landrover-defender',     'seed'),
('Land Rover', 'Defender',   'L663',  'L663', 2020, NULL, ARRAY['P300','P400','D200','D300'],                'landrover-defender-l663','seed'),

-- ── Jeep ───────────────────────────────────────────────────────────────────
('Jeep', 'Wrangler', 'YJ', 'YJ', 1987, 1995, ARRAY['2.5L AMC I4','4.2L I6','4.0L I6'],                     'jeep-wrangler-yj', 'seed'),
('Jeep', 'Wrangler', 'TJ', 'TJ', 1997, 2006, ARRAY['2.5L I4','4.0L I6'],                                   'jeep-wrangler-tj', 'seed'),
('Jeep', 'Wrangler', 'JK', 'JK', 2006, 2018, ARRAY['3.8L V6','3.6L V6','2.8 CRD'],                         'jeep-wrangler-jk', 'seed'),
('Jeep', 'Wrangler', 'JL', 'JL', 2018, NULL, ARRAY['2.0T','3.6L V6','3.0 EcoDiesel'],                      'jeep-wrangler-jl', 'seed'),
('Jeep', 'CJ-7',     NULL, 'CJ', 1976, 1986, ARRAY['2.5L I4','4.2L I6','5.0L V8'],                         'jeep-cj7',        'seed'),
('Jeep', 'Gladiator','JT',  'JT', 2019, NULL, ARRAY['3.6L V6','3.0 EcoDiesel','2.0T'],                     'jeep-gladiator-jt','seed'),

-- ── Audi ───────────────────────────────────────────────────────────────────
('Audi', 'Quattro',   'Ur-Quattro', '85', 1980, 1991, ARRAY['WR 2.1T','MB 2.1T','RR 2.2T'],                'audi-quattro-ur',  'seed'),
('Audi', 'RS2',        NULL,        'B4', 1994, 1995, ARRAY['ADU 2.2T'],                                    'audi-rs2',         'seed'),
('Audi', 'TT',         '8N',        '8N', 1998, 2006, ARRAY['1.8T 180hp','1.8T 225hp','3.2 VR6'],           'audi-tt-8n',       'seed'),
('Audi', 'TT',         '8J',        '8J', 2006, 2014, ARRAY['2.0 TFSI','3.2 VR6','TTS','TTRS'],             'audi-tt-8j',       'seed'),
('Audi', 'TT',         '8S',        '8S', 2014, 2023, ARRAY['2.0 TFSI 230hp','TTS','TTRS'],                 'audi-tt-8s',       'seed'),

-- ── Lancia ─────────────────────────────────────────────────────────────────
('Lancia', 'Delta HF Integrale', NULL, '831', 1987, 1993, ARRAY['8V HF Integrale','16V','Evoluzione'],       'lancia-delta-hf-integrale','seed'),
('Lancia', 'Stratos',            NULL, 'Type 829', 1973, 1978, ARRAY['Ferrari Dino 2.4 V6'],                'lancia-stratos',          'seed'),
('Lancia', 'Fulvia',             NULL, '818',  1963, 1976, ARRAY['1.0','1.2','1.3 HF','1.6 HF'],            'lancia-fulvia',           'seed'),

-- ── Fiat ───────────────────────────────────────────────────────────────────
('Fiat', '124 Spider', NULL,   '124AS', 1966, 1985, ARRAY['1.4 OHC','1.6 DOHC','1.8 DOHC','2.0 DOHC'],    'fiat-124-spider',   'seed'),
('Fiat', '500',        'Classic','110', 1957, 1975, ARRAY['479cc','499cc','594cc'],                          'fiat-500-classic',  'seed'),
('Fiat', 'Punto',      'GT',    '176',  1994, 1999, ARRAY['1.4T GT'],                                       'fiat-punto-gt',     'seed'),

-- ── SEAT ───────────────────────────────────────────────────────────────────
('SEAT', 'Ibiza',  'Cupra Mk2', '6K',  1999, 2002, ARRAY['1.8T 20V 156hp'],                                 'seat-ibiza-cupra-mk2',  'seed'),
('SEAT', 'Leon',   'Cupra Mk1', '1M',  1999, 2005, ARRAY['1.8T 20V 180hp','Cupra R 210hp'],                 'seat-leon-cupra-mk1',   'seed'),
('SEAT', 'Leon',   'Cupra Mk2', '1P',  2005, 2012, ARRAY['2.0 TFSI 240hp','Cupra R 265hp'],                 'seat-leon-cupra-mk2',   'seed'),

-- ── Opel/Vauxhall ──────────────────────────────────────────────────────────
('Opel', 'Manta',  'B', 'B', 1975, 1988, ARRAY['1.6 S','1.9 S','2.0 E','2.4 Exclusive'],                   'opel-manta-b',    'seed'),
('Opel', 'Astra',  'G GSi', '1G', 1998, 2004, ARRAY['2.0 16V GSi','2.0 OPC'],                              'opel-astra-g-gsi','seed'),
('Vauxhall','Astra','VXR Mk5','H', 2005, 2010, ARRAY['Z20LEH 2.0T VXR'],                                    'vauxhall-astra-vxr-h','seed'),

-- ── Suzuki ─────────────────────────────────────────────────────────────────
('Suzuki', 'Swift Sport', 'ZC31S', 'ZC31S', 2005, 2011, ARRAY['M16A'],                                      'suzuki-swift-sport-zc31s','seed'),
('Suzuki', 'Swift Sport', 'ZC32S', 'ZC32S', 2011, 2017, ARRAY['M16A'],                                      'suzuki-swift-sport-zc32s','seed'),
('Suzuki', 'Swift Sport', 'ZC33S', 'ZC33S', 2017, NULL, ARRAY['K14C BOOSTERJET'],                           'suzuki-swift-sport-zc33s','seed'),
('Suzuki', 'Jimny', 'SJ',   'SJ',   1981, 1998, ARRAY['F8A','F10A','F5A','F5B'],                            'suzuki-jimny-sj',   'seed'),
('Suzuki', 'Jimny', 'JB43', 'JB43', 1998, 2018, ARRAY['G13BB','M13A'],                                     'suzuki-jimny-jb43', 'seed'),
('Suzuki', 'Jimny', 'JB64', 'JB64', 2018, NULL, ARRAY['K15B'],                                              'suzuki-jimny-jb64', 'seed'),

-- ── American classics ──────────────────────────────────────────────────────
('Chevrolet', 'Corvette', 'C3', 'C3', 1968, 1982, ARRAY['5.7 L48','5.7 L82','7.0 L88','7.4 LS6'],          'chevrolet-corvette-c3','seed'),
('Chevrolet', 'Corvette', 'C4', 'C4', 1983, 1996, ARRAY['5.7 L83','5.7 L98','5.7 LT1','5.7 LT4'],          'chevrolet-corvette-c4','seed'),
('Chevrolet', 'Corvette', 'C5', 'C5', 1997, 2004, ARRAY['5.7 LS1','5.7 LS6 Z06'],                          'chevrolet-corvette-c5','seed'),
('Chevrolet', 'Corvette', 'C6', 'C6', 2005, 2013, ARRAY['6.0 LS2','7.0 LS7 Z06','6.2 LS3','6.2 LS9 ZR1'], 'chevrolet-corvette-c6','seed'),
('Chevrolet', 'Camaro', 'Gen 3', 'F-body', 1982, 1992, ARRAY['2.5 I4','2.8 V6','5.0 V8','5.7 V8'],         'chevrolet-camaro-gen3','seed'),
('Chevrolet', 'Camaro', 'Gen 4', 'F-body', 1993, 2002, ARRAY['3.4 V6','3.8 V6','5.7 V8 LT1','5.7 LS1'],   'chevrolet-camaro-gen4','seed'),
('Dodge',     'Viper',  'RT/10','SR I',   1992, 2002, ARRAY['8.0 V10'],                                     'dodge-viper-rt10',     'seed'),

-- ── Lexus ──────────────────────────────────────────────────────────────────
('Lexus', 'IS',  'XE10', 'XE10', 1998, 2005, ARRAY['1G-FE','2JZ-GE'],                                      'lexus-is-xe10',   'seed'),
('Lexus', 'SC',  'Z30',  'Z30',  1991, 2000, ARRAY['1UZ-FE','2JZ-GE'],                                      'lexus-sc-z30',    'seed'),

-- ── British classics ───────────────────────────────────────────────────────
('Triumph',  'TR6',  NULL,   NULL,  1969, 1976, ARRAY['2.5 I6'],                                             'triumph-tr6',   'seed'),
('Triumph',  'TR7',  NULL,   NULL,  1975, 1981, ARRAY['2.0 I4','3.5 V8 TR8'],                               'triumph-tr7',   'seed'),
('MG',       'MGB',  NULL,   'GHN', 1962, 1980, ARRAY['1.8 B-series'],                                      'mg-mgb',        'seed'),
('Jaguar',   'E-Type','Series 1','XKE', 1961, 1968, ARRAY['XK 3.8','XK 4.2'],                               'jaguar-etype-s1','seed'),
('Jaguar',   'E-Type','Series 3','XKE', 1971, 1975, ARRAY['5.3 V12'],                                       'jaguar-etype-s3','seed'),

-- ── Scandinavian ───────────────────────────────────────────────────────────
('Saab', '900',      'Classic', 'C900', 1979, 1994, ARRAY['B201','B212','B202T Turbo'],                      'saab-900-classic','seed'),
('Saab', '9-3',      'Viggen',  'YS3D', 2000, 2002, ARRAY['B235R 2.3T'],                                    'saab-93-viggen',  'seed'),

-- ── Daihatsu ───────────────────────────────────────────────────────────────
('Daihatsu', 'Copen', 'L880K', 'L880K', 2002, 2012, ARRAY['JB-DET 659cc Turbo'],                            'daihatsu-copen-l880k','seed'),

-- ── Hyundai / Kia ──────────────────────────────────────────────────────────
('Hyundai', 'Genesis Coupe', 'BK',  'BK',  2008, 2016, ARRAY['2.0T','3.8 V6'],                             'hyundai-genesis-coupe-bk','seed'),
('Kia',     'Stinger',       'CK',  'CK',  2018, NULL, ARRAY['2.0T','3.3T V6 GT'],                          'kia-stinger-ck',          'seed')

;
