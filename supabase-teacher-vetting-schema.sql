-- Create teacher_vetting_feedback table for teacher vetting quiz reviews
CREATE TABLE teacher_vetting_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    folder_name VARCHAR(255) NOT NULL,
    
    -- CSV data fields
    state VARCHAR(255),
    subject VARCHAR(255),
    grade VARCHAR(255),
    domain VARCHAR(255),
    topic VARCHAR(255),
    instructure_code VARCHAR(255),
    display_standard_code VARCHAR(255),
    description TEXT,
    quiz_id VARCHAR(255) NOT NULL,
    quiz_title VARCHAR(255),
    quiz_type VARCHAR(255),
    num_questions INTEGER,
    variety_tag VARCHAR(255),
    score DECIMAL(5,2),
    
    -- Teacher vetting feedback fields
    approved BOOLEAN DEFAULT NULL,
    usability INTEGER CHECK (usability >= 1 AND usability <= 3),
    standards_alignment INTEGER CHECK (standards_alignment >= 1 AND standards_alignment <= 3),
    jtbd TEXT,
    feedback TEXT,
    
    -- Meta fields
    reviewer_name VARCHAR(255),
    vetting_status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, approved, rejected
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint for folder_name + quiz_id combination
ALTER TABLE teacher_vetting_feedback ADD CONSTRAINT unique_teacher_vetting_feedback_combination 
    UNIQUE (folder_name, quiz_id);

-- Create indexes for efficient querying
CREATE INDEX idx_teacher_vetting_feedback_quiz_id ON teacher_vetting_feedback(quiz_id);
CREATE INDEX idx_teacher_vetting_feedback_folder_name ON teacher_vetting_feedback(folder_name);
CREATE INDEX idx_teacher_vetting_feedback_created_at ON teacher_vetting_feedback(created_at);
CREATE INDEX idx_teacher_vetting_feedback_status ON teacher_vetting_feedback(vetting_status);
CREATE INDEX idx_teacher_vetting_feedback_state ON teacher_vetting_feedback(state);
CREATE INDEX idx_teacher_vetting_feedback_subject ON teacher_vetting_feedback(subject);
CREATE INDEX idx_teacher_vetting_feedback_domain ON teacher_vetting_feedback(domain);
CREATE INDEX idx_teacher_vetting_feedback_approved ON teacher_vetting_feedback(approved);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE teacher_vetting_feedback ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on teacher_vetting_feedback" ON teacher_vetting_feedback FOR ALL USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_teacher_vetting_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teacher_vetting_feedback_updated_at 
    BEFORE UPDATE ON teacher_vetting_feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_teacher_vetting_updated_at_column();

-- Optional: Create teacher_vetting_batches table for tracking upload sessions
CREATE TABLE teacher_vetting_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_name VARCHAR(255) NOT NULL,
    folder_name VARCHAR(255) NOT NULL,
    state VARCHAR(255),
    subject VARCHAR(255),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_quizzes INTEGER DEFAULT 0,
    reviewed_quizzes INTEGER DEFAULT 0,
    approved_quizzes INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, archived
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for teacher_vetting_batches
CREATE INDEX idx_teacher_vetting_batches_folder_name ON teacher_vetting_batches(folder_name);
CREATE INDEX idx_teacher_vetting_batches_state ON teacher_vetting_batches(state);
CREATE INDEX idx_teacher_vetting_batches_subject ON teacher_vetting_batches(subject);
CREATE INDEX idx_teacher_vetting_batches_status ON teacher_vetting_batches(status);
CREATE INDEX idx_teacher_vetting_batches_upload_date ON teacher_vetting_batches(upload_date);

-- Enable RLS for batches table
ALTER TABLE teacher_vetting_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on teacher_vetting_batches" ON teacher_vetting_batches FOR ALL USING (true);

-- Create updated_at trigger for batches
CREATE TRIGGER update_teacher_vetting_batches_updated_at 
    BEFORE UPDATE ON teacher_vetting_batches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_teacher_vetting_updated_at_column();

-- Note: When using UPSERT, the updated_at will be automatically updated on conflicts 