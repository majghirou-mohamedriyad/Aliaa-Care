-- Create pack images table
CREATE TABLE public.pack_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.pack_images ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read pack_images" ON public.pack_images 
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage pack_images" ON public.pack_images 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
