import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Check if we have valid credentials
const hasValidCredentials = 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder-key' &&
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseAnonKey !== 'your_supabase_anon_key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage bucket name
export const STORAGE_BUCKET = 'batches'

// Export helper to check if Supabase is configured
export const isSupabaseConfigured = () => hasValidCredentials

// File upload function
export const uploadFile = async (file: File, fileName: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }
    
    return data
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Upload failed: Unknown error occurred')
  }
}

// Get list of uploaded files
export const getUploadedFiles = async () => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    })
  
  if (error) {
    throw new Error(`Failed to fetch files: ${error.message}`)
  }
  
  return data || []
}

// Download file content
export const downloadFile = async (fileName: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(fileName)
  
  if (error) {
    throw new Error(`Download failed: ${error.message}`)
  }
  
  return data
}

// Delete file
export const deleteFile = async (fileName: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([fileName])
  
  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
  
  return data
}

// Rename file (copy and delete original)
export const renameFile = async (oldFileName: string, newFileName: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    // First, copy the file to the new name
    const { data: copyData, error: copyError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .copy(oldFileName, newFileName)
    
    if (copyError) {
      throw new Error(`Copy failed: ${copyError.message}`)
    }
    
    // Then delete the original file
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([oldFileName])
    
    if (deleteError) {
      // If delete fails, try to clean up the copied file
      await supabase.storage.from(STORAGE_BUCKET).remove([newFileName])
      throw new Error(`Delete original failed: ${deleteError.message}`)
    }
    
    return copyData
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Rename failed: Unknown error occurred')
  }
}

// Feedback interfaces
export interface QuickFeedback {
  folderName: string;
  domain?: string;
  topic?: string;
  standard: string;
  quizId: string;
  thumbsUp?: boolean;
  thumbsDown?: boolean;
}

export interface DetailedFeedback extends QuickFeedback {
  standardAlignmentRating?: number;
  qualityRating?: number;
  pedagogyRating?: number;
  feedbackText?: string;
}

// Save quick feedback (thumbs up/down)
export const saveQuickFeedback = async (feedback: QuickFeedback) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase
      .from('feedback')
      .upsert({
        folder_name: feedback.folderName,
        domain: feedback.domain || null,
        topic: feedback.topic || null,
        standard: feedback.standard,
        quiz_id: feedback.quizId,
        thumbs_up: feedback.thumbsUp || null,
        thumbs_down: feedback.thumbsDown || null,
      }, {
        onConflict: 'folder_name,standard,quiz_id'
      })
    
    if (error) {
      throw new Error(`Failed to save feedback: ${error.message}`)
    }
    
    return data
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to save feedback: Unknown error occurred')
  }
}

// Save detailed feedback
export const saveDetailedFeedback = async (feedback: DetailedFeedback) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase
      .from('feedback')
      .upsert({
        folder_name: feedback.folderName,
        domain: feedback.domain || null,
        topic: feedback.topic || null,
        standard: feedback.standard,
        quiz_id: feedback.quizId,
        thumbs_up: feedback.thumbsUp || null,
        thumbs_down: feedback.thumbsDown || null,
        standard_alignment_rating: feedback.standardAlignmentRating || null,
        quality_rating: feedback.qualityRating || null,
        pedagogy_rating: feedback.pedagogyRating || null,
        feedback_text: feedback.feedbackText || null,
      }, {
        onConflict: 'folder_name,standard,quiz_id'
      })
    
    if (error) {
      throw new Error(`Failed to save detailed feedback: ${error.message}`)
    }
    
    return data
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to save detailed feedback: Unknown error occurred')
  }
}

// Get feedback for a quiz
export const getFeedbackForQuiz = async (quizId: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('quiz_id', quizId)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to fetch feedback: ${error.message}`)
    }
    
    return data
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to fetch feedback: Unknown error occurred')
  }
}

// Get specific feedback for folder/standard/quiz combination
export const getSpecificFeedback = async (folderName: string, standard: string, quizId: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('folder_name', folderName)
      .eq('standard', standard)
      .eq('quiz_id', quizId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error(`Failed to fetch feedback: ${error.message}`)
    }
    
    return data
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to fetch feedback: Unknown error occurred')
  }
}

// Get feedback for multiple quizzes (for showing reviewed status)
export const getFeedbackForQuizzes = async (folderName: string, quizIds: string[]) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('quiz_id, standard, thumbs_up, thumbs_down, standard_alignment_rating, quality_rating, pedagogy_rating, feedback_text')
      .eq('folder_name', folderName)
      .in('quiz_id', quizIds)
    
    if (error) {
      throw new Error(`Failed to fetch feedback: ${error.message}`)
    }
    
    return data || []
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to fetch feedback: Unknown error occurred')
  }
} 