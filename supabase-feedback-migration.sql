-- Migration script for existing feedback tables
-- This script safely adds the unique constraint and handles any existing duplicates

-- First, let's identify and handle any existing duplicates
-- Create a temporary table to store the IDs of records to keep (most recent ones)
CREATE TEMP TABLE feedback_to_keep AS
SELECT DISTINCT ON (folder_name, standard, quiz_id) id
FROM feedback
ORDER BY folder_name, standard, quiz_id, created_at DESC;

-- Delete duplicate records (keeping only the most recent for each combination)
DELETE FROM feedback 
WHERE id NOT IN (SELECT id FROM feedback_to_keep);

-- Now add the unique constraint
ALTER TABLE feedback ADD CONSTRAINT unique_feedback_combination 
    UNIQUE (folder_name, standard, quiz_id);

-- Verify the constraint was added
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'feedback'::regclass 
AND conname = 'unique_feedback_combination';

-- Drop the temporary table
DROP TABLE feedback_to_keep;

-- Show the final structure
\d feedback; 