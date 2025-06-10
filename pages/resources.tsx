import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import QuizViewer from '../components/QuizViewer';
import Modal from '../components/Modal';
import CSVUpload from '../components/CSVUpload';
import Notification from '../components/Notification';
import Navigation from '../components/Navigation';
import { QuizSummary, CSVQuizData } from '../types';
import { uploadFile, isSupabaseConfigured } from '../utils/supabase';
import { parseCSVToQuizSummaries } from '../utils/treeBuilder';
import { safeGetFromLocalStorage, safeSetToLocalStorage } from '../utils/localStorage';

export default function Resources() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
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

  // Load quiz data from localStorage on component mount
  useEffect(() => {
    const savedQuizzes = safeGetFromLocalStorage<QuizSummary[]>('quizData', []);
    
    if (savedQuizzes.length > 0) {
      setQuizzes(savedQuizzes);
    } else {
      // If no quiz data, redirect to home
      router.push('/');
    }
  }, [router]);

  const handleQuizIdsExtracted = async (quizData: CSVQuizData[], file: File) => {
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
      
      // Create quiz summaries from CSV data using the new utility
      const quizSummaries = parseCSVToQuizSummaries(quizData);
      
      // Save to localStorage and update state
      safeSetToLocalStorage('quizData', quizSummaries);
      setQuizzes(quizSummaries);
      
      // Show success notification
      const message = uploadSuccess 
        ? `Successfully processed ${quizData.length} quizzes and saved to cloud storage`
        : `Successfully processed ${quizData.length} quizzes (local processing only - configure Supabase for cloud storage)`;
      showNotification(message, uploadSuccess ? 'success' : 'warning');
      
    } catch (error) {
      console.error('Error processing file:', error);
      showNotification('Failed to process file. Please check the file format and try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    // Clear quiz data and navigate to home
    localStorage.removeItem('quizData');
    router.push('/');
  };



  return (
    <>
      <Head>
        <title>Resources - HQRL: Resources Curation</title>
        <meta name="description" content="High quality educational resources and quiz previews" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <QuizViewer quizzes={quizzes} onBack={handleBackToHome} />
      
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

          <CSVUpload 
            onQuizIdsExtracted={handleQuizIdsExtracted} 
            loading={loading} 
            onError={(message) => showNotification(message, 'error')} 
          />

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Supported formats:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Raw quiz IDs: <code className="bg-white px-2 py-1 rounded text-xs">5f7d6b8c9e1234567890abcd</code></p>
              <p>• Full URLs: <code className="bg-white px-2 py-1 rounded text-xs">https://quizizz.com/admin/quiz/...</code></p>
              <p>• Hierarchical CSV: Domain → Topic → Standard → Quiz structure</p>
              <p>• Legacy support: Subject, Grade columns for backward compatibility</p>
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