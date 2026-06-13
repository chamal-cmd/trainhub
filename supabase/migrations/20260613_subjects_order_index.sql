-- Add order_index to subjects so the training library can be sequenced
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 999;
CREATE INDEX IF NOT EXISTS subjects_order_index_idx ON subjects(order_index);
