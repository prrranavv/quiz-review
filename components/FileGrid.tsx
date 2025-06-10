import React, { useState, useEffect } from 'react';
import { getUploadedFiles, downloadFile, deleteFile, renameFile, isSupabaseConfigured, uploadFile } from '../utils/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import FileUploader from './FileUploader';
import { 
  Calendar, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Loader2,
  FolderOpen,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileInfo {
  name: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

interface FileGridProps {
  onFileSelect: (fileName: string, fileData: Blob) => void;
  refreshTrigger?: number;
}

const FileGrid: React.FC<FileGridProps> = ({ onFileSelect, refreshTrigger }) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

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

  const handleFileUpload = async (file: File) => {
    setUploadLoading(true);
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      await uploadFile(file, fileName);
      
      // Refresh the file list
      await fetchFiles();
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileClick = async (fileName: string) => {
    if (editingFile === fileName) return;
    
    try {
      const fileData = await downloadFile(fileName);
      onFileSelect(fileName, fileData);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file. Please try again.');
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
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file. Please try again.');
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
    const displayName = fileName.replace(/^\d+-/, '').replace('.csv', '');
    setEditingName(displayName);
  };

  const handleSaveEdit = async (originalFileName: string) => {
    if (!editingName.trim()) {
      setError('File name cannot be empty');
      return;
    }

    const timestamp = Date.now();
    const newFileName = `${timestamp}-${editingName.trim()}.csv`;

    try {
      setRenamingFile(originalFileName);
      await renameFile(originalFileName, newFileName);
      
      setFiles(files.map(file => 
        file.name === originalFileName 
          ? { ...file, name: newFileName }
          : file
      ));
      
      setEditingFile(null);
      setEditingName('');
    } catch (err) {
      console.error('Error renaming file:', err);
      setError('Failed to rename file. Please try again.');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDisplayName = (fileName: string) => {
    return fileName.replace(/^\d+-/, '').replace('.csv', '');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

      return (
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Select the folder to see resources</h2>
          <p className="text-muted-foreground">
            ...or upload a new batch.
          </p>
        </div>
        
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
              {error.includes('not configured') && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Please follow the instructions in <code className="bg-muted px-1 rounded">SUPABASE_SETUP.md</code> to configure your Supabase credentials.
                </p>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setError(null)}
                className="mt-2"
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Files Grid */}
        {files.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Your Files</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <Card
                key={file.name}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  editingFile === file.name && "ring-2 ring-primary"
                )}
                onClick={() => !editingFile && handleFileClick(file.name)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      {editingFile === file.name ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => handleKeyPress(e, file.name)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 text-sm font-medium"
                          autoFocus
                        />
                      ) : (
                        <CardTitle className="text-sm line-clamp-2">
                          {getDisplayName(file.name)}
                        </CardTitle>
                      )}
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingFile === file.name ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveEdit(file.name);
                            }}
                            disabled={renamingFile === file.name}
                          >
                            {renamingFile === file.name ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => handleEditClick(file.name, e)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => handleDeleteClick(file.name, e)}
                          >
                            {deletingFile === file.name ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(file.created_at)}</span>
                  </div>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    CSV File
                  </Badge>
                </CardContent>
              </Card>
            ))}
                      </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No files uploaded yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload your first CSV file to get started with resource management.
            </p>
          </div>
        )}

        {/* File Uploader */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Upload New File</h3>
          <FileUploader 
            onFileSelect={handleFileUpload}
            loading={uploadLoading}
            className="max-w-2xl mx-auto"
          />
        </div>

        {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Delete File</CardTitle>
              <CardDescription>
                Are you sure you want to delete "{getDisplayName(confirmDelete)}"? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelDelete}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirmDelete}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FileGrid; 