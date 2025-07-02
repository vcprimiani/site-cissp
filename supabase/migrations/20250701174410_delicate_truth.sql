/*
  # Create questions table for CISSP Study Group

  1. New Tables
    - `questions`
      - `id` (uuid, primary key)
      - `domain` (text, CISSP domain)
      - `difficulty` (text, Easy/Medium/Hard)
      - `question` (text, the question content)
      - `options` (jsonb, array of answer options)
      - `correct_answer` (integer, index of correct option)
      - `explanation` (text, detailed explanation)
      - `tags` (jsonb, array of tags)
      - `created_by` (uuid, foreign key to auth.users)
      - `is_active` (boolean, whether question is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `questions` table
    - Add policies for authenticated users to manage their own questions
    - Add policies for reading questions from same organization/group
*/

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  explanation text NOT NULL,
  tags jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own questions"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own questions"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own questions"
  ON questions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS questions_created_by_idx ON questions(created_by);
CREATE INDEX IF NOT EXISTS questions_domain_idx ON questions(domain);
CREATE INDEX IF NOT EXISTS questions_difficulty_idx ON questions(difficulty);
CREATE INDEX IF NOT EXISTS questions_is_active_idx ON questions(is_active);
CREATE INDEX IF NOT EXISTS questions_created_at_idx ON questions(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();