-- ==============================================================================
-- 1. ΠΙΝΑΚΑΣ ΦΩΤΟΓΡΑΦΙΩΝ (photos table)
-- ==============================================================================

-- Δημιουργία πίνακα για αποθήκευση των φωτογραφιών και των συντεταγμένων GPS
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT DEFAULT '',
    description TEXT DEFAULT '',
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Δημιουργία index στις συντεταγμένες για ταχύτατη φόρτωση στον χάρτη
CREATE INDEX IF NOT EXISTS idx_photos_coordinates ON public.photos (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON public.photos (created_at DESC);

-- Ενεργοποίηση RLS στον πίνακα photos
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Καθαρισμός και ορισμός πολιτικών Database
DROP POLICY IF EXISTS "Public can read photos" ON public.photos;
DROP POLICY IF EXISTS "Admin can insert photos" ON public.photos;
DROP POLICY IF EXISTS "Admin can delete photos" ON public.photos;
DROP POLICY IF EXISTS "Admin can update photos" ON public.photos;
DROP POLICY IF EXISTS "Allow insert photos" ON public.photos;
DROP POLICY IF EXISTS "Allow update photos" ON public.photos;
DROP POLICY IF EXISTS "Allow delete photos" ON public.photos;

CREATE POLICY "Public can read photos"
    ON public.photos
    FOR SELECT
    USING (true);

CREATE POLICY "Allow insert photos"
    ON public.photos
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow update photos"
    ON public.photos
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow delete photos"
    ON public.photos
    FOR DELETE
    USING (true);

-- ==============================================================================
-- 2. STORAGE BUCKET & POLICIES (Storage: photos)
-- ==============================================================================

-- Αυτόματη δημιουργία ή ενημέρωση του public bucket "photos"
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Καθαρισμός παλιών πολιτικών storage
DROP POLICY IF EXISTS "Public Access to Photos Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload to Photos Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete from Photos Bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow All Reads from Photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads to Photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow Deletes from Photos" ON storage.objects;

-- Πολιτική 1: Ανάγνωση για όλους (δημόσια προβολή στον χάρτη)
CREATE POLICY "Allow All Reads from Photos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'photos');

-- Πολιτική 2: Ανέβασμα φωτογραφιών στο bucket "photos"
CREATE POLICY "Allow Uploads to Photos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'photos');

-- Πολιτική 3: Διαγραφή φωτογραφιών από το bucket "photos"
CREATE POLICY "Allow Deletes from Photos"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'photos');
