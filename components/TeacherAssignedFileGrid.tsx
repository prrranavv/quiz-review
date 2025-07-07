import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertCircle, Calendar, User, FileText, Mail } from 'lucide-react';
import { 
  getTeacherVettingUploadedFiles, 
  downloadTeacherVettingFile, 
  getAllTeacherVettingAssignments 
} from '../utils/supabase';
import { isSupabaseConfigured } from '../utils/supabase';

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
  status: string;
  notes?: string;
}

interface TeacherAssignedFileGridProps {
  teacherEmail: string;
  onFileSelect: (fileName: string, fileData: Blob) => void;
  loading: boolean;
  error: string | null;
}

const TeacherAssignedFileGrid: React.FC<TeacherAssignedFileGridProps> = ({
  teacherEmail,
  onFileSelect,
  loading,
  error
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignedFiles, setAssignedFiles] = useState<FileInfo[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [assignmentsLoaded, setAssignmentsLoaded] = useState(false);

  const fetchAssignedFiles = async (retryCount = 0) => {
    try {
      setFetchLoading(true);
      setFetchError(null);
      
      if (!isSupabaseConfigured()) {
        setFetchError('Supabase is not configured. Please check the setup guide.');
        return;
      }
      
      // Fetch all files and assignments
      try {
        const [fileList, assignmentList] = await Promise.all([
          getTeacherVettingUploadedFiles(),
          getAllTeacherVettingAssignments()
        ]);
        
        setFiles(fileList as FileInfo[]);
        setAssignments(assignmentList as Assignment[]);
        setAssignmentsLoaded(true);
        
        // Filter files assigned to this teacher
        const teacherAssignments = (assignmentList as Assignment[]).filter(
          assignment => assignment.assignee_email.toLowerCase() === teacherEmail.toLowerCase()
        );
        
        const assignedFilesList = (fileList as FileInfo[]).filter(file => 
          teacherAssignments.some(assignment => assignment.folder_name === file.name)
        );
        
        setAssignedFiles(assignedFilesList);
        
      } catch (fileErr) {
        if (retryCount < 2 && (fileErr instanceof Error && fileErr.message.includes('Failed to fetch'))) {
          console.log(`Retrying file fetch (attempt ${retryCount + 1}/3)...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchAssignedFiles(retryCount + 1);
        }
        throw fileErr;
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load assigned files';
      
      if (errorMessage.includes('Failed to fetch')) {
        setFetchError('Network connection issue. Please check your internet connection and try again.');
      } else if (errorMessage.includes('Assignment table not found')) {
        setFetchError('Assignment functionality is not yet configured. Please contact your administrator.');
      } else {
        setFetchError(errorMessage);
      }
      
      console.error('Error fetching assigned files:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedFiles();
  }, [teacherEmail]);

  const handleFileClick = async (fileName: string, retryCount = 0) => {
    try {
      const fileData = await downloadTeacherVettingFile(fileName);
      onFileSelect(fileName, fileData);
    } catch (err) {
      console.error('Error downloading file:', err);
      
      // Retry on network failures
      if (retryCount < 2 && err instanceof Error && err.message.includes('Failed to fetch')) {
        console.log(`Retrying file download (attempt ${retryCount + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return handleFileClick(fileName, retryCount + 1);
      }
      
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setFetchError('Network connection issue. Failed to download file. Please check your internet connection and try again.');
      } else {
        setFetchError('Failed to download file. Please try again.');
      }
    }
  };

  const getAssignmentForFile = (fileName: string): Assignment | undefined => {
    return assignments.find(assignment => assignment.folder_name === fileName);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const cleanFileName = (fileName: string): string => {
    return fileName.replace(/^teacher-vetting-\d+-/, '').replace(/\.csv$/, '');
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading your assignments...</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{fetchError}</p>
          </div>
          {fetchError.includes('Network connection issue') && (
            <p className="mt-2 text-xs text-muted-foreground">
              This is usually a temporary issue. Please try again.
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setFetchError(null)}
            >
              Dismiss
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchAssignedFiles()}
              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assignedFiles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
          <p className="text-muted-foreground">
            You don't have any content assigned to review at this time.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Please check back later or contact your administrator if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Your Assigned Content ({assignedFiles.length})
        </h2>
        <Badge variant="outline">
          {teacherEmail}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {assignedFiles.map((file) => {
          const assignment = getAssignmentForFile(file.name);
          const cleanName = cleanFileName(file.name);
          
          return (
            <Card 
              key={file.name} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 aspect-square flex flex-col"
              onClick={() => handleFileClick(file.name)}
            >
              <CardContent className="flex-1 flex flex-col justify-center items-center p-6 text-center">
                <div className="mb-4">
                  <FileText className="h-12 w-12 text-blue-600 mx-auto" />
                </div>
                <CardTitle className="text-lg mb-2 line-clamp-2 leading-tight">
                  {cleanName}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {formatDate(file.created_at)}
                </div>
                {assignment?.notes && (
                  <div className="text-xs text-muted-foreground mt-3 p-2 bg-muted rounded line-clamp-2">
                    {assignment.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherAssignedFileGrid; 