-- Add default_duration column to habits table
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS default_duration INTEGER DEFAULT NULL;

-- Update habit_type column to allow checkbox and duration types
ALTER TABLE habits
ALTER COLUMN habit_type SET DEFAULT 'checkbox';

-- Add duration column to habit_completions table
ALTER TABLE habit_completions
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT NULL; 