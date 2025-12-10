-- Create certificates storage bucket (public for email access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true);

-- Allow service role to insert certificates
CREATE POLICY "Service role can insert certificates"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'certificates');

-- Allow public read access to certificates
CREATE POLICY "Public can read certificates"
ON storage.objects
FOR SELECT
USING (bucket_id = 'certificates');

-- Add certificate_url column to diagnostics table
ALTER TABLE public.diagnostics
ADD COLUMN certificate_url text;