-- Create habit_completions table to track when habits are completed
CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure a habit can only be completed once per day
  CONSTRAINT unique_habit_completion_per_day UNIQUE (habit_id, completed_date)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own completions
CREATE POLICY "Users can view their own completions" 
  ON habit_completions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own completions
CREATE POLICY "Users can insert their own completions" 
  ON habit_completions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own completions
CREATE POLICY "Users can delete their own completions" 
  ON habit_completions 
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS habit_completions_habit_id_idx ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS habit_completions_user_id_idx ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS habit_completions_date_idx ON habit_completions(completed_date); 