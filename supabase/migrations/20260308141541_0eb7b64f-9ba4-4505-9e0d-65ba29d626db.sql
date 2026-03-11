
-- Create screenshots storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read screenshots
CREATE POLICY "Anyone can view screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'screenshots');

-- Allow admins to upload screenshots
CREATE POLICY "Admins can upload screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'screenshots'
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete screenshots
CREATE POLICY "Admins can delete screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'screenshots'
  AND public.has_role(auth.uid(), 'admin')
);
