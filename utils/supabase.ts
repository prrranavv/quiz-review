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

// Storage bucket names
export const STORAGE_BUCKET = 'batches'
export const TEACHER_VETTING_STORAGE_BUCKET = 'teacher-vetting-batches'

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

// Get all feedback data for analytics
export const getAllFeedback = async () => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    // Fetch all records by setting a high limit and using pagination if needed
    let allData: any[] = []
    let from = 0
    const limit = 1000
    let hasMore = true
    
    while (hasMore) {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
        .range(from, from + limit - 1)
    
    if (error) {
      throw new Error(`Failed to fetch all feedback: ${error.message}`)
    }
    
      if (data && data.length > 0) {
        allData = [...allData, ...data]
        from += limit
        hasMore = data.length === limit
      } else {
        hasMore = false
      }
    }
    
    return allData
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to fetch all feedback: Unknown error occurred')
  }
}

// Teacher Vetting Storage Functions
export const uploadTeacherVettingFile = async (file: File, fileName: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase.storage
      .from(TEACHER_VETTING_STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      throw new Error(`Teacher vetting upload failed: ${error.message}`)
    }
    
    return data
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Teacher vetting upload failed: Unknown error occurred')
  }
}

export const getTeacherVettingUploadedFiles = async () => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  const { data, error } = await supabase.storage
    .from(TEACHER_VETTING_STORAGE_BUCKET)
    .list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    })
  
  if (error) {
    throw new Error(`Failed to fetch teacher vetting files: ${error.message}`)
  }
  
  return data || []
}

export const downloadTeacherVettingFile = async (fileName: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  const { data, error } = await supabase.storage
    .from(TEACHER_VETTING_STORAGE_BUCKET)
    .download(fileName)
  
  if (error) {
    throw new Error(`Teacher vetting download failed: ${error.message}`)
  }
  
  return data
}

// Teacher Vetting Feedback Functions
export const saveTeacherVettingFeedback = async (feedback: {
  folderName: string;
  quizId: string;
  approved?: boolean;
  usability?: number;
  standardsAlignment?: number;
  jtbd?: string;
  feedbackText?: string;
  reviewerName?: string;
  // CSV data
  state?: string;
  subject?: string;
  grade?: string;
  domain?: string;
  topic?: string;
  instructureCode?: string;
  displayStandardCode?: string;
  description?: string;
  quizTitle?: string;
  quizType?: string;
  numQuestions?: number;
  varietyTag?: string;
  score?: number;
}) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    // Prepare the data to save
    const feedbackData = {
      folder_name: feedback.folderName,
      quiz_id: feedback.quizId,
      approved: feedback.approved !== undefined ? feedback.approved : null,
      usability: feedback.usability || null,
      standards_alignment: feedback.standardsAlignment || null,
      jtbd: feedback.jtbd || null,
      feedback: feedback.feedbackText || null,
      reviewer_name: feedback.reviewerName || null,
      vetting_status: feedback.approved !== undefined ? 'reviewed' : 'pending',
      // CSV data
      state: feedback.state || null,
      subject: feedback.subject || null,
      grade: feedback.grade || null,
      domain: feedback.domain || null,
      topic: feedback.topic || null,
      instructure_code: feedback.instructureCode || null,
      display_standard_code: feedback.displayStandardCode || null,
      description: feedback.description || null,
      quiz_title: feedback.quizTitle || null,
      quiz_type: feedback.quizType || null,
      num_questions: feedback.numQuestions || null,
      variety_tag: feedback.varietyTag || null,
      score: feedback.score || null,
    };

    // First, try to find existing record with the same folder_name and quiz_id
    // This matches the unique constraint in the database
    const { data: existingData, error: selectError } = await supabase
      .from('teacher_vetting_feedback')
      .select('id')
      .eq('folder_name', feedbackData.folder_name)
      .eq('quiz_id', feedbackData.quiz_id)
      .maybeSingle();

    if (selectError) {
      throw new Error(`Failed to check existing feedback: ${selectError.message}`)
    }

    let data, error;
    
    if (existingData) {
      // Update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('teacher_vetting_feedback')
        .update(feedbackData)
        .eq('id', existingData.id)
        .select();
      
      data = updateData;
      error = updateError;
    } else {
      // Insert new record
      const { data: insertData, error: insertError } = await supabase
        .from('teacher_vetting_feedback')
        .insert(feedbackData)
        .select();
      
      data = insertData;
      error = insertError;
    }
    
    if (error) {
      throw new Error(`Failed to save teacher vetting feedback: ${error.message}`)
    }
    
    return data
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to save teacher vetting feedback: Unknown error occurred')
  }
}

export const getTeacherVettingFeedbackForQuizzes = async (folderName: string, quizIds: string[]) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase
      .from('teacher_vetting_feedback')
      .select('*')
      .eq('folder_name', folderName)
      .in('quiz_id', quizIds)
    
    if (error) {
      throw new Error(`Failed to fetch teacher vetting feedback: ${error.message}`)
    }
    
    return data || []
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to fetch teacher vetting feedback: Unknown error occurred')
  }
}

export const getAllTeacherVettingFeedback = async () => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    let allData: any[] = []
    let from = 0
    const limit = 1000
    let hasMore = true
    
    while (hasMore) {
      const { data, error } = await supabase
        .from('teacher_vetting_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1)
      
      if (error) {
        throw new Error(`Failed to fetch all teacher vetting feedback: ${error.message}`)
      }
      
      if (data && data.length > 0) {
        allData = [...allData, ...data]
        from += limit
        hasMore = data.length === limit
      } else {
        hasMore = false
      }
    }
    
    return allData
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to fetch all teacher vetting feedback: Unknown error occurred')
  }
}

// Teacher Vetting Assignment Functions
export const assignTeacherVettingFolder = async (assignment: {
  folderName: string;
  assigneeEmail: string;
  assigneeName: string;
  assignedBy?: string;
  notes?: string;
}) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    // Check if this exact assignment already exists
    const { data: existingAssignment, error: checkError } = await supabase
      .from('teacher_vetting_assignments')
      .select('id')
      .eq('folder_name', assignment.folderName)
      .eq('assignee_email', assignment.assigneeEmail)
      .maybeSingle()
    
    if (checkError) {
      throw new Error(`Failed to check existing assignment: ${checkError.message}`)
    }
    
    if (existingAssignment) {
      // Update existing assignment
    const { data, error } = await supabase
      .from('teacher_vetting_assignments')
        .update({
          assignee_name: assignment.assigneeName,
          assigned_by: assignment.assignedBy || null,
          notes: assignment.notes || null,
          status: 'assigned'
        })
        .eq('id', existingAssignment.id)
        .select()
      
      if (error) {
        throw new Error(`Failed to update assignment: ${error.message}`)
      }
      
      return data
    } else {
      // Create new assignment
      const { data, error } = await supabase
        .from('teacher_vetting_assignments')
        .insert({
        folder_name: assignment.folderName,
        assignee_email: assignment.assigneeEmail,
        assignee_name: assignment.assigneeName,
        assigned_by: assignment.assignedBy || null,
        notes: assignment.notes || null,
        status: 'assigned'
      })
        .select()
    
    if (error) {
      throw new Error(`Failed to assign folder: ${error.message}`)
    }
    
    return data
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to assign folder: Unknown error occurred')
  }
}

export const getTeacherVettingAssignment = async (folderName: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase
      .from('teacher_vetting_assignments')
      .select('*')
      .eq('folder_name', folderName)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw new Error(`Failed to fetch assignment: ${error.message}`)
    }
    
    return data
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to fetch assignment: Unknown error occurred')
  }
}

// Get all assignments for a specific folder (supports multiple assignees)
export const getTeacherVettingAssignmentsForFolder = async (folderName: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase
      .from('teacher_vetting_assignments')
      .select('*')
      .eq('folder_name', folderName)
      .order('assigned_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to fetch assignments: ${error.message}`)
    }
    
    return data || []
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to fetch assignments: Unknown error occurred')
  }
}

// Remove a specific assignment by ID
export const removeTeacherVettingAssignment = async (assignmentId: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase
      .from('teacher_vetting_assignments')
      .delete()
      .eq('id', assignmentId)
    
    if (error) {
      throw new Error(`Failed to remove assignment: ${error.message}`)
    }
    
    return data
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to remove assignment: Unknown error occurred')
  }
}

// Remove a specific assignment by folder and email
export const removeTeacherVettingAssignmentByEmail = async (folderName: string, assigneeEmail: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase
      .from('teacher_vetting_assignments')
      .delete()
      .eq('folder_name', folderName)
      .eq('assignee_email', assigneeEmail)
    
    if (error) {
      throw new Error(`Failed to remove assignment: ${error.message}`)
    }
    
    return data
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to remove assignment: Unknown error occurred')
  }
}

export const getAllTeacherVettingAssignments = async () => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase
      .from('teacher_vetting_assignments')
      .select('*')
      .order('assigned_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to fetch assignments: ${error.message}`)
    }
    
    return data || []
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to fetch assignments: Unknown error occurred')
  }
}

export const updateTeacherVettingAssignment = async (folderName: string, updates: {
  assigneeEmail?: string;
  assigneeName?: string;
  status?: string;
  notes?: string;
}) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase
      .from('teacher_vetting_assignments')
      .update({
        ...(updates.assigneeEmail && { assignee_email: updates.assigneeEmail }),
        ...(updates.assigneeName && { assignee_name: updates.assigneeName }),
        ...(updates.status && { status: updates.status }),
        ...(updates.notes !== undefined && { notes: updates.notes })
      })
      .eq('folder_name', folderName)
    
    if (error) {
      throw new Error(`Failed to update assignment: ${error.message}`)
    }
    
    return data
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to update assignment: Unknown error occurred')
  }
}

export const deleteTeacherVettingAssignment = async (folderName: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase
      .from('teacher_vetting_assignments')
      .delete()
      .eq('folder_name', folderName)
    
    if (error) {
      throw new Error(`Failed to delete assignment: ${error.message}`)
    }
    
    return data
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to delete assignment: Unknown error occurred')
  }
}

// Delete all assignments for a folder (used when deleting a folder)
export const deleteAllTeacherVettingAssignments = async (folderName: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    const { data, error } = await supabase
      .from('teacher_vetting_assignments')
      .delete()
      .eq('folder_name', folderName)
    
    if (error) {
      throw new Error(`Failed to delete assignments: ${error.message}`)
    }
    
    return data
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to delete assignments: Unknown error occurred')
  }
}

export const deleteTeacherVettingFolder = async (folderName: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    // Delete all feedback for this folder
    const { error: feedbackError } = await supabase
      .from('teacher_vetting_feedback')
      .delete()
      .eq('folder_name', folderName)
    
    if (feedbackError) {
      throw new Error(`Failed to delete feedback: ${feedbackError.message}`)
    }
    
    // Delete all assignments for this folder
    await deleteAllTeacherVettingAssignments(folderName)
    
    // Delete the actual file from storage
    const { error: storageError } = await supabase.storage
      .from(TEACHER_VETTING_STORAGE_BUCKET)
      .remove([folderName])
    
    if (storageError) {
      throw new Error(`Failed to delete file: ${storageError.message}`)
    }
    
    return true
  } catch (err) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Failed to delete folder: Unknown error occurred')
  }
}

// Rename teacher vetting file (copy and delete original, update database references)
export const renameTeacherVettingFile = async (oldFileName: string, newFileName: string) => {
  if (!hasValidCredentials) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  
  try {
    // First, copy the file to the new name
    const { data: copyData, error: copyError } = await supabase.storage
      .from(TEACHER_VETTING_STORAGE_BUCKET)
      .copy(oldFileName, newFileName)
    
    if (copyError) {
      throw new Error(`Copy failed: ${copyError.message}`)
    }
    
    // Update all feedback records to use the new folder name
    const { error: feedbackError } = await supabase
      .from('teacher_vetting_feedback')
      .update({ folder_name: newFileName })
      .eq('folder_name', oldFileName)
    
    if (feedbackError) {
      // If feedback update fails, try to clean up the copied file
      await supabase.storage.from(TEACHER_VETTING_STORAGE_BUCKET).remove([newFileName])
      throw new Error(`Failed to update feedback records: ${feedbackError.message}`)
    }
    
    // Update assignment record to use the new folder name
    const { error: assignmentError } = await supabase
      .from('teacher_vetting_assignments')
      .update({ folder_name: newFileName })
      .eq('folder_name', oldFileName)
    
    if (assignmentError) {
      // If assignment update fails, try to revert feedback and clean up
      await supabase.from('teacher_vetting_feedback').update({ folder_name: oldFileName }).eq('folder_name', newFileName)
      await supabase.storage.from(TEACHER_VETTING_STORAGE_BUCKET).remove([newFileName])
      throw new Error(`Failed to update assignment record: ${assignmentError.message}`)
    }
    
    // Delete the original file
    const { error: deleteError } = await supabase.storage
      .from(TEACHER_VETTING_STORAGE_BUCKET)
      .remove([oldFileName])
    
    if (deleteError) {
      // If delete fails, try to revert everything
      await supabase.from('teacher_vetting_feedback').update({ folder_name: oldFileName }).eq('folder_name', newFileName)
      await supabase.from('teacher_vetting_assignments').update({ folder_name: oldFileName }).eq('folder_name', newFileName)
      await supabase.storage.from(TEACHER_VETTING_STORAGE_BUCKET).remove([newFileName])
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