-- Add the default_rating column to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS default_rating REAL;

-- Add comment to the column
COMMENT ON COLUMN habits.default_rating IS 'Default rating value (0-5) for rating type habits'; 