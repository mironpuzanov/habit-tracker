-- Add active column to habits table
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Create index for active column for faster queries
CREATE INDEX IF NOT EXISTS habits_active_idx ON habits(active);

-- Create a function to execute SQL safely (for clients without direct SQL access)
CREATE OR REPLACE FUNCTION exec_sql(sql text) 
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to mark habits as inactive (archived)
CREATE OR REPLACE FUNCTION archive_habit(habit_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  -- First ensure the column exists
  BEGIN
    -- Add the column if it doesn't exist
    ALTER TABLE habits ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
  EXCEPTION
    WHEN duplicate_column THEN
      -- Column already exists, which is fine
      NULL;
  END;
  
  -- Update the habit
  UPDATE habits
  SET active = FALSE
  WHERE id = habit_id AND user_id = user_id;
  
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 