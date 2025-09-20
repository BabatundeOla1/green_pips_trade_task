-- Create the files table
CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own files"
  ON files
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view their own files"
  ON files
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own files"
  ON files
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own files"
  ON files
  FOR DELETE
  USING (auth.uid() = owner_id);
