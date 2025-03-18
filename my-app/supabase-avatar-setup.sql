-- Create the avatars storage bucket (if it does not exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Update the bucket to be public if it already exists
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';

-- Set up access policies for the avatars bucket
CREATE POLICY "Avatar images are publicly accessible." 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar." 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Users can update their own avatar." 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own avatar." 
ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid() = owner); 