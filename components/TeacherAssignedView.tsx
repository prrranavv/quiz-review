import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TeacherAssignedFileGrid from '@/components/TeacherAssignedFileGrid';
import TeacherVettingQuizViewer from './TeacherVettingQuizViewer';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { QuizSummary, TeacherVettingCSVData } from '../types';
import { parseTeacherVettingCSVToQuizSummaries } from '../utils/treeBuilder';
import { safeSetToLocalStorage } from '../utils/localStorage';
import { slugify } from '../utils/slug';
import { Mail, User, BookOpen } from 'lucide-react';

const TeacherAssignedView: React.FC = () => {
  const router = useRouter();
  const [teacherEmail, setTeacherEmail] = useState<string>('');
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [quizSummaries, setQuizSummaries] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if there's a stored email on component mount
  useEffect(() => {
    const storedEmail = localStorage.getItem('teacherEmail');
    if (storedEmail) {
      setTeacherEmail(storedEmail);
      setIsEmailVerified(true);
    }
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherEmail.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(teacherEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    // Store email in localStorage
    localStorage.setItem('teacherEmail', teacherEmail);
    setIsEmailVerified(true);
    setError(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('teacherEmail');
    setTeacherEmail('');
    setIsEmailVerified(false);
    setSelectedFile(null);
    setQuizSummaries([]);
  };

  const handleFileSelect = async (fileName: string, fileData: Blob) => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert blob to text
      const csvText = await fileData.text();
      
      // Use the same CSV parsing logic as teacher vetting
      const quizData = parseTeacherVettingCSV(csvText);
      
      if (quizData.length === 0) {
        setError('No quiz IDs found in the selected file.');
        return;
      }
      
      // Parse CSV and create quiz summaries
      const summaries = parseTeacherVettingCSVToQuizSummaries(quizData);
      setQuizSummaries(summaries);
      
      // Store in localStorage for the quiz viewer using the same format as teacher vetting
      const cleanFileName = fileName.replace(/^teacher-vetting-\d+-/, '').replace('.csv', '');
      const slug = slugify(cleanFileName);
      safeSetToLocalStorage(`teacherVettingQuizData:${slug}`, summaries);
      safeSetToLocalStorage(`teacherVettingFileName:${slug}`, cleanFileName);
      
      // Navigate to the quiz viewer
      await router.push(`/teachers/${slug}/resources`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  const parseTeacherVettingCSV = (csvText: string): TeacherVettingCSVData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    // Get headers from first line
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    const quizData: TeacherVettingCSVData[] = [];
    
    console.log('CSV Headers:', headers);
    
    // Find column indices for teacher vetting format
    const stateColumn = headers.findIndex(h => h === 'state');
    const subjectColumn = headers.findIndex(h => h === 'subject');
    const gradeColumn = headers.findIndex(h => h === 'grade');
    const domainColumn = headers.findIndex(h => h === 'domain');
    const topicColumn = headers.findIndex(h => h === 'topic');
    const instructureCodeColumn = headers.findIndex(h => h === 'instructure_code');
    const displayStandardCodeColumn = headers.findIndex(h => h === 'display_standard_code');
    const descriptionColumn = headers.findIndex(h => h === 'description');
    const quizIdColumn = headers.findIndex(h => h === 'quiz_id');
    const quizTitleColumn = headers.findIndex(h => h === 'quiz_title');
    const quizTypeColumn = headers.findIndex(h => h === 'quiz_type');
    const numQuestionsColumn = headers.findIndex(h => h === 'num_questions');
    const varietyTagColumn = headers.findIndex(h => h === 'variety_tag');
    const scoreColumn = headers.findIndex(h => h === 'score');
    
    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Split by comma but handle quoted fields
      const cells: string[] = [];
      let currentCell = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim()); // Add the last cell
      
      // Remove quotes from cells
      const cleanedCells = cells.map(cell => cell.replace(/"/g, '').trim());
      
      // Get quiz ID from quiz_id column
      const quizId = quizIdColumn >= 0 ? cleanedCells[quizIdColumn] : '';
      
      if (quizId && quizId.trim()) {
        const state = stateColumn >= 0 ? cleanedCells[stateColumn] || undefined : undefined;
        const subject = subjectColumn >= 0 ? cleanedCells[subjectColumn] || undefined : undefined;
        const grade = gradeColumn >= 0 ? cleanedCells[gradeColumn] || undefined : undefined;
        const domain = domainColumn >= 0 ? cleanedCells[domainColumn] || undefined : undefined;
        const topic = topicColumn >= 0 ? cleanedCells[topicColumn] || undefined : undefined;
        const instructureCode = instructureCodeColumn >= 0 ? cleanedCells[instructureCodeColumn] || undefined : undefined;
        const displayStandardCode = displayStandardCodeColumn >= 0 ? cleanedCells[displayStandardCodeColumn] || undefined : undefined;
        const description = descriptionColumn >= 0 ? cleanedCells[descriptionColumn] || undefined : undefined;
        const quizTitle = quizTitleColumn >= 0 ? cleanedCells[quizTitleColumn] || undefined : undefined;
        const quizType = quizTypeColumn >= 0 ? cleanedCells[quizTypeColumn] || undefined : undefined;
        const numQuestions = numQuestionsColumn >= 0 && cleanedCells[numQuestionsColumn] 
          ? parseInt(cleanedCells[numQuestionsColumn]) || undefined 
          : undefined;
        const varietyTag = varietyTagColumn >= 0 ? cleanedCells[varietyTagColumn] || undefined : undefined;
        const score = scoreColumn >= 0 && cleanedCells[scoreColumn] 
          ? parseFloat(cleanedCells[scoreColumn]) || undefined 
          : undefined;
        
        quizData.push({
          quiz_id: quizId.trim(),
          state: state,
          subject: subject,
          grade: grade,
          domain: domain,
          topic: topic,
          instructure_code: instructureCode,
          display_standard_code: displayStandardCode,
          description: description,
          quiz_title: quizTitle,
          quiz_type: quizType,
          num_questions: numQuestions,
          variety_tag: varietyTag,
          score: score,
        });
      }
    }
    
    return quizData.filter((quiz, index, self) => 
      index === self.findIndex(q => q.quiz_id === quiz.quiz_id)
    );
  };

  // Email input form
  if (!isEmailVerified) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <User className="h-12 w-12 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Teachers Portal</CardTitle>
                <p className="text-muted-foreground">
                  Enter your email to view your assigned content
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={teacherEmail}
                        onChange={(e) => setTeacherEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      {error}
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full">
                    Access My Assignments
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main teacher view - show assigned folders
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          {/* Header with teacher info */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BookOpen className="h-8 w-8" />
                Your Assignments
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {teacherEmail}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Switch Account
            </Button>
          </div>

          {/* Assigned folders grid */}
          <TeacherAssignedFileGrid
            teacherEmail={teacherEmail}
            onFileSelect={handleFileSelect}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignedView; 