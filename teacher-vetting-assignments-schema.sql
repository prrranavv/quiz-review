-- Teacher Vetting Folder Assignments Schema

-- Create the assignments table
CREATE TABLE teacher_vetting_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    folder_name TEXT NOT NULL UNIQUE,
    assignee_email TEXT NOT NULL,
    assignee_name TEXT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by TEXT, -- Optional: track who made the assignment
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'in_progress')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_teacher_vetting_assignments_folder_name ON teacher_vetting_assignments(folder_name);
CREATE INDEX idx_teacher_vetting_assignments_email ON teacher_vetting_assignments(assignee_email);
CREATE INDEX idx_teacher_vetting_assignments_status ON teacher_vetting_assignments(status);

-- Enable Row Level Security (RLS)
ALTER TABLE teacher_vetting_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON teacher_vetting_assignments
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON teacher_vetting_assignments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON teacher_vetting_assignments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON teacher_vetting_assignments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_teacher_vetting_assignments_updated_at
    BEFORE UPDATE ON teacher_vetting_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for easier querying with additional info
CREATE VIEW teacher_vetting_assignments_with_stats AS
SELECT 
    a.*,
    (SELECT COUNT(*) FROM teacher_vetting_feedback f WHERE f.folder_name = a.folder_name) as total_feedback,
    (SELECT COUNT(*) FROM teacher_vetting_feedback f WHERE f.folder_name = a.folder_name AND f.approved IS NOT NULL) as reviewed_count
FROM teacher_vetting_assignments a; 