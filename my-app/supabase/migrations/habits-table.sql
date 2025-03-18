-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  habit_type TEXT NOT NULL DEFAULT 'checkbox',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add RLS (Row Level Security) policies
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own habits
CREATE POLICY "Users can view their own habits" 
  ON habits 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own habits 
CREATE POLICY "Users can insert their own habits" 
  ON habits 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own habits
CREATE POLICY "Users can update their own habits" 
  ON habits 
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own habits
CREATE POLICY "Users can delete their own habits" 
  ON habits 
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON habits(user_id); 