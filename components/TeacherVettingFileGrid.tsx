import React, { useState, useEffect } from 'react';
import { 
  getTeacherVettingUploadedFiles, 
  downloadTeacherVettingFile, 
  isSupabaseConfigured, 
  uploadTeacherVettingFile,
  assignTeacherVettingFolder,
  getTeacherVettingAssignment,
  deleteTeacherVettingFolder,
  getAllTeacherVettingAssignments,
  renameTeacherVettingFile
} from '../utils/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import FileUploader from './FileUploader';
import { 
  Calendar, 
  Loader2,
  FolderOpen,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Trash2,
  Edit,
  User,
  Mail,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileInfo {
  name: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

interface Assignment {
  id: string;
  folder_name: string;
  assignee_email: string;
  assignee_name: string;
  assigned_at: string;
  assigned_by: string | null;
  status: string;
  notes: string | null;
}

interface TeacherVettingFileGridProps {
  onFileSelect: (fileName: string, fileData: Blob) => void;
  refreshTrigger?: number;
  onFileUpload?: (file: File) => void;
}

const TeacherVettingFileGrid: React.FC<TeacherVettingFileGridProps> = ({ onFileSelect, refreshTrigger, onFileUpload }) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [assigneeName, setAssigneeName] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [assignmentsLoaded, setAssignmentsLoaded] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [originalFolderName, setOriginalFolderName] = useState('');
  const { toast } = useToast();

  const fetchFiles = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!isSupabaseConfigured()) {
        setError('Supabase is not configured. Please check the setup guide.');
        return;
      }
      
      // Fetch files first (essential) with retry logic
      try {
        const fileList = await getTeacherVettingUploadedFiles();
        setFiles(fileList as FileInfo[]);
      } catch (fileErr) {
        if (retryCount < 2 && (fileErr instanceof Error && fileErr.message.includes('Failed to fetch'))) {
          console.log(`Retrying file fetch (attempt ${retryCount + 1}/3)...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Progressive delay
          return fetchFiles(retryCount + 1);
        }
        throw fileErr;
      }
      
      // Try to fetch assignments (optional - may not exist yet)
      try {
        const assignmentList = await getAllTeacherVettingAssignments();
        setAssignments(assignmentList as Assignment[]);
        setAssignmentsLoaded(true);
      } catch (assignmentErr) {
        console.log('Assignment table not yet created or network issue:', assignmentErr);
        setAssignments([]); // Set empty assignments if table doesn't exist or network fails
        setAssignmentsLoaded(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load teacher vetting files';
      
      if (errorMessage.includes('Failed to fetch')) {
        setError('Network connection issue. Please check your internet connection and try again.');
      } else {
        setError(errorMessage);
      }
      
      console.error('Error fetching teacher vetting files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const handleFileClick = async (fileName: string, retryCount = 0) => {
    try {
      const fileData = await downloadTeacherVettingFile(fileName);
      onFileSelect(fileName, fileData);
    } catch (err) {
      console.error('Error downloading teacher vetting file:', err);
      
      // Retry on network failures
      if (retryCount < 2 && err instanceof Error && err.message.includes('Failed to fetch')) {
        console.log(`Retrying file download (attempt ${retryCount + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return handleFileClick(fileName, retryCount + 1);
      }
      
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('Network connection issue. Failed to download file. Please check your internet connection and try again.');
      } else {
        setError('Failed to download file. Please try again.');
      }
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
    // Remove timestamp prefix and teacher-vetting prefix
    return fileName.replace(/^teacher-vetting-\d+-/, '').replace('.csv', '');
  };

  const handleFileUpload = async (file: File) => {
    setUploadLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const timestamp = Date.now();
      const fileName = `teacher-vetting-${timestamp}-${file.name}`;
      await uploadTeacherVettingFile(file, fileName);
      
      // Refresh the file list
      await fetchFiles();
      
      setSuccessMessage(`File "${file.name}" uploaded successfully.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Call the parent callback if provided
      if (onFileUpload) {
        onFileUpload(file);
      }
    } catch (err) {
      console.error('Error uploading teacher vetting file:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const openAssignDialog = (fileName: string) => {
    setSelectedFileName(fileName);
    const assignment = assignments.find(a => a.folder_name === fileName);
    if (assignment) {
      setAssigneeEmail(assignment.assignee_email);
      setAssigneeName(assignment.assignee_name);
    } else {
      setAssigneeEmail('');
      setAssigneeName('');
    }
    // Set folder name for editing
    const displayName = getDisplayName(fileName);
    setFolderName(displayName);
    setOriginalFolderName(displayName);
    setShowAssignDialog(true);
  };

  const handleAssignFolder = async () => {
    if (!assigneeEmail || !assigneeName) {
      setError('Please provide both email and name for the assignee.');
      return;
    }

    if (!folderName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Folder name cannot be empty",
      });
      return;
    }

    setAssignLoading(true);
    setError(null);
    
    try {
      let finalFileName = selectedFileName;
      
      // Check if folder name changed
      if (folderName.trim() !== originalFolderName) {
        // Extract timestamp from original filename
        const timestampMatch = selectedFileName.match(/^teacher-vetting-(\d+)-/);
        const timestamp = timestampMatch ? timestampMatch[1] : Date.now().toString();
        
        // Create new filename with same timestamp but new name
        const newFileName = `teacher-vetting-${timestamp}-${folderName.trim()}.csv`;
        
        // Rename the file and update database references
        await renameTeacherVettingFile(selectedFileName, newFileName);
        finalFileName = newFileName;
        
        toast({
          description: "Folder name updated successfully! 🎉",
        });
      }
      
      // Update or create assignment with the final filename
      await assignTeacherVettingFolder({
        folderName: finalFileName,
        assigneeEmail,
        assigneeName
      });
      
      // Refresh the assignments and files
      await fetchFiles();
      
      setSuccessMessage(`Folder assigned to ${assigneeName} successfully.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reset form
      setShowAssignDialog(false);
      setSelectedFileName('');
      setAssigneeEmail('');
      setAssigneeName('');
      setFolderName('');
      setOriginalFolderName('');
    } catch (err) {
      console.error('Error processing assignment:', err);
      if (err instanceof Error && err.message.includes('does not exist')) {
        setError('Assignment table not found. Please run the teacher-vetting-assignments-schema.sql in your Supabase dashboard first.');
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: err instanceof Error ? err.message : 'Failed to process assignment',
        });
      }
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDeleteFolder = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${getDisplayName(fileName)}"? This will also delete all associated feedback and assignments.`)) {
      return;
    }

    setDeleteLoading(fileName);
    setError(null);
    
    try {
      await deleteTeacherVettingFolder(fileName);
      
      // Refresh the file list
      await fetchFiles();
      
      setSuccessMessage(`Folder "${getDisplayName(fileName)}" deleted successfully.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError('Failed to delete folder. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getAssignmentForFile = (fileName: string) => {
    return assignments.find(a => a.folder_name === fileName);
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
        <h2 className="text-3xl font-bold tracking-tight">Teacher Vetting Files</h2>
        <p className="text-muted-foreground">
          Select a previously uploaded teacher vetting file or upload a new one.
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
            {error.includes('Assignment table not found') && (
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                <p>To enable assignment functionality:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Go to your Supabase dashboard → SQL Editor</li>
                  <li>Copy and run the contents of <code className="bg-muted px-1 rounded">teacher-vetting-assignments-schema.sql</code></li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            )}
            {error.includes('Network connection issue') && (
              <p className="mt-2 text-xs text-muted-foreground">
                This is usually a temporary issue. The app will automatically retry failed operations.
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
              {error.includes('Network connection issue') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setError(null);
                    fetchFiles();
                  }}
                  className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                >
                  Retry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files Grid */}
      {files.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Your Teacher Vetting Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => {
              const assignment = getAssignmentForFile(file.name);
              return (
                <Card
                  key={file.name}
                  className="group transition-all duration-200 hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex items-center gap-2 cursor-pointer flex-1"
                        onClick={() => handleFileClick(file.name)}
                      >
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm line-clamp-2">
                          {getDisplayName(file.name)}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Only show assignment button if assignment table exists */}
                        {assignmentsLoaded ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAssignDialog(file.name);
                            }}
                            className="h-8 w-8 p-0"
                            title={assignment ? 'Edit assignment' : 'Assign folder'}
                          >
                            {assignment ? <Edit className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(file.name);
                          }}
                          disabled={deleteLoading === file.name}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete folder"
                        >
                          {deleteLoading === file.name ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(file.created_at)}</span>
                      </div>
                      
                      {assignmentsLoaded ? (
                        assignment ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <User className="h-3 w-3 text-blue-600" />
                              <span className="font-medium text-blue-700">{assignment.assignee_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{assignment.assignee_email}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Assigned
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Unassigned
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Assignment feature not available
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No teacher vetting files uploaded yet</h3>
          <p className="text-muted-foreground mb-6">
            Upload your first teacher vetting CSV file to get started.
          </p>
        </div>
      )}

      {/* File Uploader */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Upload Teacher Vetting CSV</h3>
        <FileUploader 
          onFileSelect={handleFileUpload}
          loading={uploadLoading}
          className="max-w-2xl mx-auto"
        />
      </div>

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {getAssignmentForFile(selectedFileName) ? 'Edit Assignment' : 'Assign Folder'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name *</Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                className={cn(
                  "text-sm",
                  folderName.trim() !== originalFolderName && folderName.trim() !== '' 
                    ? "border-blue-500 ring-1 ring-blue-200" 
                    : ""
                )}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Edit the display name for this folder</p>
                {folderName.trim() !== originalFolderName && folderName.trim() !== '' && (
                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                    Modified
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignee-name">Assignee Name *</Label>
              <Input
                id="assignee-name"
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                placeholder="Enter assignee's full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignee-email">Assignee Email *</Label>
              <Input
                id="assignee-email"
                type="email"
                value={assigneeEmail}
                onChange={(e) => setAssigneeEmail(e.target.value)}
                placeholder="Enter assignee's email address"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowAssignDialog(false)}
              disabled={assignLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignFolder}
              disabled={assignLoading || !assigneeEmail || !assigneeName || !folderName.trim()}
            >
              {assignLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {folderName.trim() !== originalFolderName ? 'Updating...' : 'Assigning...'}
                </>
              ) : (
                getAssignmentForFile(selectedFileName) ? 'Update Assignment' : 'Assign Folder'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherVettingFileGrid; 