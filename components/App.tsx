import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { QuizSummary, CSVQuizData } from '../types';
import CSVUpload from './CSVUpload';
import Modal from './Modal';
import FileGrid from './FileGrid';
import Notification from './Notification';
import Navigation from './Navigation';
import { uploadFile, isSupabaseConfigured } from '../utils/supabase';
import { parseCSVToQuizSummaries } from '../utils/treeBuilder';
import { safeSetToLocalStorage } from '../utils/localStorage';

function App() {
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

  const navigateToResources = (quizData: CSVQuizData[], fileName: string) => {
    // Create quiz summaries from CSV data using the new utility
    const quizSummaries = parseCSVToQuizSummaries(quizData);
    
    // Save to localStorage and navigate
    safeSetToLocalStorage('quizData', quizSummaries);
    safeSetToLocalStorage('fileName', fileName);
    router.push('/resources');
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
          const fileName = `${timestamp}-${file.name}`;
          await uploadFile(file, fileName);
          uploadSuccess = true;
          console.log('File uploaded successfully to Supabase');
        } else {
          console.log('Supabase not configured - file processed locally only');
        }
      } catch (uploadError) {
        console.warn('File upload to Supabase failed:', uploadError);
      }
      
      setRefreshTrigger(prev => prev + 1); // Trigger file grid refresh
      
      // Show success notification
      const message = uploadSuccess 
        ? `Successfully processed ${quizData.length} quizzes and saved to cloud storage`
        : `Successfully processed ${quizData.length} quizzes (local processing only - configure Supabase for cloud storage)`;
      showNotification(message, uploadSuccess ? 'success' : 'warning');
      
      // Navigate to resources page
      navigateToResources(quizData, file.name);
      
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
      
      showNotification(`Loaded ${quizData.length} quizzes from ${fileName}`, 'success');
      
      // Navigate to resources page
      navigateToResources(quizData, fileName);
      
    } catch (error) {
      console.error('Error processing file:', error);
      showNotification('Failed to process the selected file.', 'error');
    }
  };

  const parseCSV = (csvText: string): CSVQuizData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    // Get headers from first line
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    const quizData: CSVQuizData[] = [];
    
    console.log('CSV Headers:', headers);
    
    // Find column indices for new hierarchical format
    const domainColumn = headers.findIndex(h => 
      h.includes('domain') || h.includes('subject area')
    );
    const topicColumn = headers.findIndex(h => 
      h.includes('topic') || h.includes('chapter') || h.includes('unit')
    );
    const standardColumn = headers.findIndex(h => 
      h.includes('standard') || h.includes('std')
    );
    const descriptionColumn = headers.findIndex(h => 
      h === 'description' || h.includes('description') || h.includes('desc')
    );
    const titleColumn = headers.findIndex(h => 
      h.includes('quiz title') || h.includes('title') || h.includes('name')
    );
    const numQuestionsColumn = headers.findIndex(h => 
      h === 'num questions' || h.includes('num questions') || h.includes('question count') || h.includes('questions')
    );
    
    // Find quiz ID columns
    const quizIdColumns = headers.map((h, i) => 
      (h.includes('quiz') && h.includes('id')) || 
      h.includes('quizizz') || 
      h === 'id' ? i : -1
    ).filter(i => i >= 0);
    
    // Legacy column detection for backward compatibility
    const subjectColumn = headers.findIndex(h => 
      h.includes('subject') || h.includes('course')
    );
    const gradeColumn = headers.findIndex(h => 
      h.includes('grade') || h.includes('level')
    );
    
    console.log('Column indices:', {
      domain: domainColumn,
      topic: topicColumn,
      standard: standardColumn,
      description: descriptionColumn,
      title: titleColumn,
      numQuestions: numQuestionsColumn,
      quizId: quizIdColumns
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
      
      let quizId: string | null = null;
      
      // Try to find quiz ID
      for (const colIndex of quizIdColumns) {
        if (colIndex < cleanedCells.length) {
          const cell = cleanedCells[colIndex];
          if (cell && /^[a-fA-F0-9]{20,}$/.test(cell)) {
            quizId = cell;
            break;
          } else if (cell.includes('quizizz.com') && cell.includes('/')) {
            const match = cell.match(/\/([a-fA-F0-9]{20,})/);
            if (match) {
              quizId = match[1];
              break;
            }
          }
        }
      }
      
      if (!quizId) {
        for (const cell of cleanedCells) {
          if (cell && /^[a-fA-F0-9]{20,}$/.test(cell)) {
            quizId = cell;
            break;
          } else if (cell.includes('quizizz.com') && cell.includes('/')) {
            const match = cell.match(/\/([a-fA-F0-9]{20,})/);
            if (match) {
              quizId = match[1];
              break;
            }
          }
        }
      }
      
      if (quizId) {
        const questionCount = numQuestionsColumn >= 0 && cleanedCells[numQuestionsColumn] 
          ? parseInt(cleanedCells[numQuestionsColumn]) || 0 
          : 0;
          
        const domain = domainColumn >= 0 ? cleanedCells[domainColumn] || undefined : undefined;
        const topic = topicColumn >= 0 ? cleanedCells[topicColumn] || undefined : undefined;
        const standard = standardColumn >= 0 ? cleanedCells[standardColumn] || undefined : undefined;
        const description = descriptionColumn >= 0 ? cleanedCells[descriptionColumn] || undefined : undefined;
        const title = titleColumn >= 0 ? cleanedCells[titleColumn] || undefined : undefined;
        const subject = subjectColumn >= 0 ? cleanedCells[subjectColumn] || undefined : undefined;
        const grade = gradeColumn >= 0 ? cleanedCells[gradeColumn] || undefined : undefined;
        
        console.log(`Row ${i}: QuizID=${quizId}, Title="${title}", Standard="${standard}"`);
          
        quizData.push({
          id: quizId,
          // New hierarchical fields
          domain: domain,
          topic: topic,
          standard: standard,
          description: description,
          title: title,
          questionCount: questionCount,
          // Legacy fields for backward compatibility
          subject: subject,
          grade: grade,
        });
      }
    }
    
    return quizData.filter((quiz, index, self) => 
      index === self.findIndex(q => q.id === quiz.id)
    );
  };

  // Show the file grid as the main interface
  if (showFileGrid) {
    return (
      <>
        <Navigation />
        <FileGrid 
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          {/* Title and Description */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">HQRL: Resources Curation</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            High Quality Resource Library for educational content curation. 
            Upload CSV files to manage and organize your quiz resources.
          </p>

          {/* Upload Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload CSV File
          </button>

          {/* Features List */}
          <div className="mt-12 text-left bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Features</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Automatic quiz ID extraction from any CSV format
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Grouped quiz browsing by standards and subjects
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Live quiz preview with iframe embedding
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Quick access to admin and student views
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Quiz CSV"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-600 mb-6">
              Select a CSV file containing Quizizz quiz IDs for bulk preview
            </p>
          </div>

          <CSVUpload onQuizIdsExtracted={handleQuizIdsExtracted} loading={loading} onError={(message) => showNotification(message, 'error')} />

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Supported formats:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Raw quiz IDs: <code className="bg-white px-2 py-1 rounded text-xs">5f7d6b8c9e1234567890abcd</code></p>
              <p>• Full URLs: <code className="bg-white px-2 py-1 rounded text-xs">https://quizizz.com/admin/quiz/...</code></p>
              <p>• CSV columns: Standard, Subject, Grade, Topic (auto-detected)</p>
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

export default App; 