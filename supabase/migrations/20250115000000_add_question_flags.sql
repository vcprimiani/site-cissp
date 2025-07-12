/*
  # Add Question Flagging Feature

  1. New Columns
    - `flag_count` (integer): Number of times question has been flagged
    - `flagged_by` (jsonb): Array of user IDs who flagged this question
    - `flag_reasons` (jsonb): Array of flag reasons
    - `is_flagged` (boolean): Whether question is currently flagged
    - `flagged_at` (timestamptz): When question was first flagged
    - `flag_status` (text): Current flag status (pending, reviewed, dismissed, actioned)

  2. Security
    - Users can flag any question
    - Only admins can review and manage flags
    - Flag data is protected by RLS
*/

-- Add flagging columns to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS flag_count integer DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS flagged_by jsonb DEFAULT '[]'::jsonb;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS flag_reasons jsonb DEFAULT '[]'::jsonb;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS flagged_at timestamptz;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS flag_status text DEFAULT 'pending' CHECK (flag_status IN ('pending', 'reviewed', 'dismissed', 'actioned'));

-- Create indexes for flag-related queries
CREATE INDEX IF NOT EXISTS questions_is_flagged_idx ON questions(is_flagged);
CREATE INDEX IF NOT EXISTS questions_flag_count_idx ON questions(flag_count DESC);
CREATE INDEX IF NOT EXISTS questions_flag_status_idx ON questions(flag_status);

-- Create function to update flag count and status
CREATE OR REPLACE FUNCTION update_question_flags()
RETURNS TRIGGER AS $$
BEGIN
  -- Update flag count based on flagged_by array length
  NEW.flag_count = jsonb_array_length(NEW.flagged_by);
  
  -- Set is_flagged based on flag count
  NEW.is_flagged = (NEW.flag_count > 0);
  
  -- Set flagged_at if this is the first flag
  IF NEW.flag_count = 1 AND OLD.flag_count = 0 THEN
    NEW.flagged_at = now();
  END IF;
  
  -- Reset flagged_at if all flags are removed
  IF NEW.flag_count = 0 THEN
    NEW.flagged_at = NULL;
    NEW.flag_status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update flag-related fields
CREATE TRIGGER update_question_flags_trigger
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_question_flags();

-- Create table for flag history (optional, for detailed tracking)
CREATE TABLE IF NOT EXISTS question_flag_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('flag', 'unflag', 'review', 'dismiss', 'action')),
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on flag history table
ALTER TABLE question_flag_history ENABLE ROW LEVEL SECURITY;

-- Create policies for flag history
CREATE POLICY "Users can view their own flag history"
  ON question_flag_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create flag history"
  ON question_flag_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for flag history
CREATE INDEX IF NOT EXISTS question_flag_history_question_id_idx ON question_flag_history(question_id);
CREATE INDEX IF NOT EXISTS question_flag_history_user_id_idx ON question_flag_history(user_id);
CREATE INDEX IF NOT EXISTS question_flag_history_created_at_idx ON question_flag_history(created_at DESC); 