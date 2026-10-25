-- Add free_shipping column to products and packs tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;
