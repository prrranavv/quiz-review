    -- Create feedback table for quiz reviews
    CREATE TABLE feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    folder_name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    topic VARCHAR(255),
    standard VARCHAR(255) NOT NULL,
    quiz_id VARCHAR(255) NOT NULL,
    
    -- Quick feedback (thumbs up/down)
    thumbs_up BOOLEAN DEFAULT NULL,
    thumbs_down BOOLEAN DEFAULT NULL,
    
    -- Detailed ratings (1-5 stars)
    standard_alignment_rating INTEGER CHECK (standard_alignment_rating >= 1 AND standard_alignment_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    pedagogy_rating INTEGER CHECK (pedagogy_rating >= 1 AND pedagogy_rating <= 5),
    
    -- Text feedback
    feedback_text TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create unique constraint for folder_name + standard + quiz_id combination
ALTER TABLE feedback ADD CONSTRAINT unique_feedback_combination 
    UNIQUE (folder_name, standard, quiz_id);

-- Create index for efficient querying
CREATE INDEX idx_feedback_quiz_id ON feedback(quiz_id);
CREATE INDEX idx_feedback_folder_name ON feedback(folder_name);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);

    -- Enable Row Level Security (optional but recommended)
    ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

    -- Create policy to allow all operations (adjust based on your auth requirements)
    CREATE POLICY "Allow all operations on feedback" ON feedback FOR ALL USING (true);

    -- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_updated_at 
    BEFORE UPDATE ON feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Note: When using UPSERT, the updated_at will be automatically updated on conflicts 