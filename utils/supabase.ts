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