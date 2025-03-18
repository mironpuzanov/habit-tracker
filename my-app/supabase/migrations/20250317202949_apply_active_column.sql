-- Add active column to habits table if it doesn't exist
DO $$
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'habits' AND column_name = 'active'
  ) THEN
    -- Add the column with a default value of TRUE
    ALTER TABLE habits ADD COLUMN active BOOLEAN DEFAULT TRUE;
    
    -- Create index for faster queries
    CREATE INDEX habits_active_idx ON habits(active);
  END IF;
END
$$;

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
