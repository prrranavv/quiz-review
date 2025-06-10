import React, { useState, useEffect } from 'react';
import { getUploadedFiles, downloadFile, deleteFile, renameFile, isSupabaseConfigured } from '../utils/supabase';

interface FileInfo {
  name: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

interface FileGridProps {
  onFileSelect: (fileName: string, fileData: Blob) => void;
  onUploadClick: () => void;
  refreshTrigger?: number;
}

const FileGrid: React.FC<FileGridProps> = ({ onFileSelect, onUploadClick, refreshTrigger }) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [renamingFile, setRenamingFile] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!isSupabaseConfigured()) {
        setError('Supabase is not configured. Please check the setup guide.');
        return;
      }
      
      const fileList = await getUploadedFiles();
      setFiles(fileList as FileInfo[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const handleFileClick = async (fileName: string) => {
    if (editingFile === fileName) return; // Don't open file when editing
    
    try {
      const fileData = await downloadFile(fileName);
      onFileSelect(fileName, fileData);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleDeleteClick = (fileName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setConfirmDelete(fileName);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    try {
      setDeletingFile(confirmDelete);
      await deleteFile(confirmDelete);
      
      setFiles(files.filter(file => file.name !== confirmDelete));
      
      console.log(`File ${confirmDelete} deleted successfully`);
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Failed to delete file. Please try again.');
    } finally {
      setDeletingFile(null);
      setConfirmDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  const handleEditClick = (fileName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingFile(fileName);
    // Remove timestamp prefix and .csv extension for editing
    const displayName = fileName.replace(/^\d+-/, '').replace('.csv', '');
    setEditingName(displayName);
  };

  const handleSaveEdit = async (originalFileName: string) => {
    if (!editingName.trim()) {
      alert('File name cannot be empty');
      return;
    }

    const timestamp = Date.now();
    const newFileName = `${timestamp}-${editingName.trim()}.csv`;

    try {
      setRenamingFile(originalFileName);
      await renameFile(originalFileName, newFileName);
      
      // Update the file in local state
      setFiles(files.map(file => 
        file.name === originalFileName 
          ? { ...file, name: newFileName }
          : file
      ));
      
      console.log(`File renamed from ${originalFileName} to ${newFileName}`);
      setEditingFile(null);
      setEditingName('');
    } catch (err) {
      console.error('Error renaming file:', err);
      alert('Failed to rename file. Please try again.');
    } finally {
      setRenamingFile(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingFile(null);
    setEditingName('');
  };

  const handleKeyPress = (event: React.KeyboardEvent, fileName: string) => {
    if (event.key === 'Enter') {
      handleSaveEdit(fileName);
    } else if (event.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDisplayName = (fileName: string) => {
    return fileName.replace(/^\d+-/, '').replace('.csv', '');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Folders</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
          {error.includes('not configured') ? (
            <p className="mt-2 text-sm text-red-600">
              Please follow the instructions in <code className="bg-red-100 px-1 rounded">SUPABASE_SETUP.md</code> to configure your Supabase credentials.
            </p>
          ) : (
            <button 
              onClick={fetchFiles}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {files.map((file) => (
          <div
            key={file.name}
            className="bg-white border border-gray-300 rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow duration-200 min-h-[200px] flex flex-col justify-between relative group"
          >
            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Edit Button */}
              <button
                onClick={(e) => handleEditClick(file.name, e)}
                disabled={renamingFile === file.name || editingFile !== null}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors bg-white rounded-full shadow-sm hover:shadow-md disabled:opacity-50"
                title="Edit file name"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              {/* Delete Button */}
              <button
                onClick={(e) => handleDeleteClick(file.name, e)}
                disabled={deletingFile === file.name || editingFile !== null}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors bg-white rounded-full shadow-sm hover:shadow-md disabled:opacity-50"
                title="Delete file"
              >
                {deletingFile === file.name ? (
                  <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>

            <div onClick={() => handleFileClick(file.name)}>
              <div className="mb-4">
                <svg 
                  className="w-12 h-12 text-gray-400 mx-auto" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
              </div>
              
              {/* File Name - Editable */}
              {editingFile === file.name ? (
                <div className="text-center mb-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, file.name)}
                    className="text-lg font-semibold text-gray-900 text-center border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    autoFocus
                  />
                  <div className="flex justify-center space-x-2 mt-2">
                    <button
                      onClick={() => handleSaveEdit(file.name)}
                      disabled={renamingFile === file.name}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {renamingFile === file.name ? (
                        <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                      ) : (
                        'Save'
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={renamingFile === file.name}
                      className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center truncate">
                  {getDisplayName(file.name)}
                </h3>
              )}
              
              <div className="text-center text-sm text-gray-500 space-y-1">
                <p>{formatFileSize(file.metadata?.size || 0)}</p>
                <p>{file.metadata?.mimetype || 'CSV file'}</p>
              </div>
            </div>
            <div className="text-center text-sm text-gray-400 mt-4">
              {formatDate(file.created_at)}
            </div>
          </div>
        ))}
      </div>

      {/* Upload Button */}
      <div className="text-center">
        <button
          onClick={onUploadClick}
          className="w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
          Upload a file
        </button>
      </div>

      {/* Empty State */}
      {files.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <svg 
            className="w-24 h-24 text-gray-300 mx-auto mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No files uploaded yet</h3>
          <p className="text-gray-600 mb-6">Upload your first CSV file to get started with quiz review.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Delete File</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong className="font-medium">{getDisplayName(confirmDelete)}</strong>?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileGrid; 