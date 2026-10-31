-- Add ritual columns to products and packs tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS ritual TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ritual_ar TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ritual_en TEXT;

ALTER TABLE packs ADD COLUMN IF NOT EXISTS ritual TEXT;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS ritual_ar TEXT;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS ritual_en TEXT;

