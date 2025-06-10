import React, { useState, useCallback } from 'react';
import { QuizSummary, CSVQuizData } from '../types';
import { fetchQuizData } from '../utils/quizApi';
import CSVUpload from './CSVUpload';
import QuizViewer from './QuizViewer';
import Modal from './Modal';

function App() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const handleQuizIdsExtracted = useCallback(async (quizData: CSVQuizData[]) => {
    setLoading(true);
    setIsUploadModalOpen(false); // Close modal when processing starts
    
    // Initialize quiz summaries with metadata from CSV
    const initialQuizzes: QuizSummary[] = quizData.map(quiz => ({
      id: quiz.id,
      title: `Loading quiz ${quiz.id.substring(0, 8)}...`,
      questionCount: 0,
      status: 'loading',
      standard: quiz.standard,
      subject: quiz.subject,
      grade: quiz.grade,
      topic: quiz.topic,
    }));
    
    setQuizzes(initialQuizzes);
    setLoading(false);
    
    // Load each quiz data
    for (let i = 0; i < quizData.length; i++) {
      const quizInfo = quizData[i];
      try {
        const data = await fetchQuizData(quizInfo.id);
        const quiz = data.data.quiz;
        
        setQuizzes(prev => prev.map(q => 
          q.id === quizInfo.id 
            ? {
                ...q,
                title: quiz.info.name || `Quiz ${quizInfo.id.substring(0, 8)}`,
                image: quiz.info.image,
                questionCount: quiz.info.questions.length,
                status: 'loaded' as const,
                data
              }
            : q
        ));
      } catch (err) {
        console.error(`Failed to load quiz ${quizInfo.id}:`, err);
        setQuizzes(prev => prev.map(q => 
          q.id === quizInfo.id 
            ? {
                ...q,
                status: 'error' as const,
                error: err instanceof Error ? err.message : 'Failed to load'
              }
            : q
        ));
      }
      
      // Small delay between requests to avoid overwhelming the API
      if (i < quizData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }, []);

  const handleNewUpload = () => {
    setQuizzes([]);
    setIsUploadModalOpen(true);
  };

  // If we have quizzes loaded, show the quiz viewer
  if (quizzes.length > 0) {
    return <QuizViewer quizzes={quizzes} onBack={handleNewUpload} />;
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Review App</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Upload a CSV file with Quizizz quiz IDs to review multiple quizzes at once. 
            Perfect for content moderation and bulk quiz analysis.
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
                Math equations and rich content support
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Real-time loading progress and error handling
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
              Select a CSV file containing Quizizz quiz IDs for bulk review
            </p>
          </div>

          <CSVUpload onQuizIdsExtracted={handleQuizIdsExtracted} loading={loading} />

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
    </>
  );
}

export default App; 