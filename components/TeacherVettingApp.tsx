import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { QuizSummary, TeacherVettingCSVData, CSVQuizData } from '../types';
import CSVUpload from './CSVUpload';
import Modal from './Modal';
import TeacherVettingFileGrid from './TeacherVettingFileGrid';
import Notification from './Notification';
import Navigation from './Navigation';
import { uploadTeacherVettingFile, isSupabaseConfigured } from '../utils/supabase';
import { parseTeacherVettingCSVToQuizSummaries } from '../utils/treeBuilder';
import { safeSetToLocalStorage } from '../utils/localStorage';
import { slugify } from '../utils/slug';

function TeacherVettingApp() {
  const router = useRouter();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFileGrid, setShowFileGrid] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ message, type, isVisible: true });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const navigateToResources = (quizData: TeacherVettingCSVData[], fileName: string) => {
    const slug = slugify(fileName);
    // Create quiz summaries from CSV data using the new utility
    const quizSummaries = parseTeacherVettingCSVToQuizSummaries(quizData);
    
    // Save to localStorage with teacher-vetting prefix and navigate
    safeSetToLocalStorage(`teacherVettingQuizData:${slug}`, quizSummaries);
    safeSetToLocalStorage(`teacherVettingFileName:${slug}`, fileName);
    router.push(`/teacher-vetting/${slug}/resources`);
  };

  const handleQuizIdsExtracted = useCallback(async (quizData: CSVQuizData[], file: File) => {
    setLoading(true);
    setIsUploadModalOpen(false);
    
    try {
      // Try to upload file to Supabase (if configured)
      let uploadSuccess = false;
      try {
        if (isSupabaseConfigured()) {
          const timestamp = Date.now();
          const fileName = `teacher-vetting-${timestamp}-${file.name}`;
          await uploadTeacherVettingFile(file, fileName);
          uploadSuccess = true;
          console.log('Teacher vetting file uploaded successfully to Supabase');
        } else {
          console.log('Supabase not configured - file processed locally only');
        }
      } catch (uploadError) {
        console.warn('File upload to Supabase failed:', uploadError);
      }
      
      setRefreshTrigger(prev => prev + 1); // Trigger file grid refresh
      
      // Re-parse the file using our teacher vetting parser
      const csvText = await file.text();
      const teacherVettingData = parseCSV(csvText);
      
      if (teacherVettingData.length === 0) {
        showNotification('No quiz IDs found in the CSV file. Please ensure your CSV contains quiz IDs.', 'error');
        return;
      }
      
      // Show success notification
      const message = uploadSuccess 
        ? `Successfully processed ${teacherVettingData.length} quizzes for teacher vetting and saved to cloud storage`
        : `Successfully processed ${teacherVettingData.length} quizzes for teacher vetting (local processing only - configure Supabase for cloud storage)`;
      showNotification(message, uploadSuccess ? 'success' : 'warning');
      
      // Navigate to resources page
      navigateToResources(teacherVettingData, file.name);
      
    } catch (error) {
      console.error('Error processing file:', error);
      showNotification('Failed to process file. Please check the file format and try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleFileSelect = async (fileName: string, fileData: Blob) => {
    try {
      const text = await fileData.text();
      const quizData = parseCSV(text);
      
      if (quizData.length === 0) {
        showNotification('No quiz IDs found in the selected file.', 'error');
        return;
      }
      
      showNotification(`Loaded ${quizData.length} quizzes from ${fileName} for teacher vetting`, 'success');
      
      // Navigate to resources page
      navigateToResources(quizData, fileName);
      
    } catch (error) {
      console.error('Error processing file:', error);
      showNotification('Failed to process the selected file.', 'error');
    }
  };

  const parseCSV = (csvText: string): TeacherVettingCSVData[] => {
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
    
    console.log('Column indices:', {
      state: stateColumn,
      subject: subjectColumn,
      grade: gradeColumn,
      domain: domainColumn,
      topic: topicColumn,
      instructureCode: instructureCodeColumn,
      displayStandardCode: displayStandardCodeColumn,
      description: descriptionColumn,
      quizId: quizIdColumn,
      quizTitle: quizTitleColumn,
      quizType: quizTypeColumn,
      numQuestions: numQuestionsColumn,
      varietyTag: varietyTagColumn,
      score: scoreColumn
    });
    
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
        
        console.log(`Row ${i}: QuizID=${quizId}, Title="${quizTitle}", Subject="${subject}"`);
          
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

  // Show the file grid as the main interface
  if (showFileGrid) {
    return (
      <>
        <Navigation />
        <TeacherVettingFileGrid 
          onFileSelect={handleFileSelect}
          refreshTrigger={refreshTrigger}
        />
        
        {/* Notification */}
        <Notification
          message={notification.message}
          type={notification.type}
          isVisible={notification.isVisible}
          onClose={hideNotification}
        />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          {/* App Icon/Logo */}
          <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Title and Description */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Teacher Vetting System</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Review and evaluate teacher-created quizzes for quality assurance. 
            Upload CSV files to begin the vetting process.
          </p>

          {/* Upload Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Teacher Quizzes
          </button>

          {/* Features List */}
          <div className="mt-12 text-left bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Teacher Vetting Features</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Quality assessment for teacher-created content
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Detailed feedback and rating system
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Track vetting status and progress
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Separate analytics for teacher vetting data
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Teacher Quiz CSV"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-6">
              Select a CSV file containing teacher-created Quizizz quiz IDs for vetting review
            </p>
          </div>

          <CSVUpload onQuizIdsExtracted={handleQuizIdsExtracted} loading={loading} onError={(message) => showNotification(message, 'error')} />

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Supported formats:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Raw quiz IDs: <code className="bg-white px-2 py-1 rounded text-xs">5f7d6b8c9e1234567890abcd</code></p>
              <p>• Full URLs: <code className="bg-white px-2 py-1 rounded text-xs">https://quizizz.com/admin/quiz/...</code></p>
              <p>• CSV columns: Teacher Name, Standard, Subject, Grade, Topic (auto-detected)</p>
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </>
  );
}

export default TeacherVettingApp; 