-- Add the rating column to habit_completions table
ALTER TABLE habit_completions ADD COLUMN rating REAL;

-- Add comment to the column
COMMENT ON COLUMN habit_completions.rating IS 'Rating value for rating type habits (0-5)';
