import React, { useState, useEffect } from 'react';
import { QuizSummary, TreeNode } from '../types';
import TreeView from './TreeView';
import { buildTreeFromQuizzes } from '../utils/treeBuilder';

interface QuizViewerProps {
  quizzes: QuizSummary[];
  onBack: () => void;
}

const QuizViewer: React.FC<QuizViewerProps> = ({ quizzes, onBack }) => {
  const [selectedQuiz, setSelectedQuiz] = useState<QuizSummary | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);

  // Build tree structure from quizzes
  useEffect(() => {
    if (quizzes.length > 0) {
      const tree = buildTreeFromQuizzes(quizzes);
      setTreeNodes(tree);
    }
  }, [quizzes]);

  const handleQuizSelect = (quiz: QuizSummary) => {
    setSelectedQuiz(quiz);
  };

  const handleLoginToQuizizz = () => {
    const loginWindow = window.open('https://quizizz.com/admin', 'quizizz-login', 'width=600,height=700,scrollbars=yes');
    
    // Check if login window is closed (user returned)
    const checkClosed = setInterval(() => {
      if (loginWindow?.closed) {
        clearInterval(checkClosed);
        // Refresh iframe after a short delay to allow cookies to sync
        setTimeout(() => {
          setIframeKey(prev => prev + 1);
          setIsLoggedIn(true);
        }, 1000);
      }
    }, 500);
  };

  const handleRefreshPreview = () => {
    setIframeKey(prev => prev + 1);
  };

  const renderQuizPreview = () => {
    if (!selectedQuiz) {
      return (
        <>
          {/* Empty State Header */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Quiz Preview</h2>
            </div>
          </div>
          
          {/* Empty State Content */}
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">Select a quiz to preview</p>
              <p className="text-sm text-gray-500">Choose a quiz from the hierarchy on the left to view its preview</p>
            </div>
          </div>
        </>
      );
    }

    const quizUrl = `https://quizizz.com/admin/quiz/${selectedQuiz.id}`;

    return (
      <>
        {/* Quiz Preview Header */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Quiz Info */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{selectedQuiz.title}</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
                  {selectedQuiz.domain && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {selectedQuiz.domain}
                    </span>
                  )}
                  {selectedQuiz.topic && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      {selectedQuiz.topic}
                    </span>
                  )}
                  {selectedQuiz.standard && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                      {selectedQuiz.standard}
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs bg-gray-100 px-3 py-2 rounded border">
                  Quiz ID: {selectedQuiz.id}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Login Status & Login Button */}
              {isLoggedIn === false && (
                <button
                  onClick={handleLoginToQuizizz}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 border border-purple-600 rounded-md transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login to Quizizz
                </button>
              )}
              
              {/* Refresh Button */}
              <button
                onClick={handleRefreshPreview}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-md transition-colors"
                title="Refresh preview"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Open in New Tab */}
              <a 
                href={quizUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300 rounded-md transition-colors"
              >
                Open in Quizizz
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Quiz Preview iframe */}
        <div className="flex-1 bg-gray-100 p-4">
          {/* Status Messages */}
          {isLoggedIn === false && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm">
                  <span className="font-medium text-yellow-800">Not logged in to Quizizz.</span>
                  <span className="text-yellow-700"> Click "Login to Quizizz" above, then refresh to see full content.</span>
                </div>
              </div>
            </div>
          )}
          
          {isLoggedIn === true && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <span className="font-medium text-green-800">Login detected!</span>
                  <span className="text-green-700"> Preview should now show your authenticated view. Use refresh button if needed.</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="h-full bg-white rounded-lg shadow-sm overflow-hidden">
            <iframe
              key={iframeKey}
              src={quizUrl}
              className="w-full h-full border-0"
              title={`Preview of ${selectedQuiz.title}`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="storage-access"
              onLoad={() => {
                // Simple detection: if we can't detect login state, assume logged out initially
                if (isLoggedIn === null) {
                  setIsLoggedIn(false);
                }
              }}
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Hierarchical Tree */}
      <div className="w-1/3 min-w-0 border-r border-gray-200 bg-white">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">
                Quiz Resources
              </h1>
              <button
                onClick={onBack}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
          </div>
          
          {/* Tree View */}
          <div className="flex-1 overflow-hidden">
            {treeNodes.length > 0 ? (
              <TreeView 
                nodes={treeNodes}
                onQuizSelect={handleQuizSelect}
                selectedQuizId={selectedQuiz?.id}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="text-sm">Loading quiz hierarchy...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Quiz Preview */}
      <div className="flex-1 min-w-0 flex flex-col">
        {renderQuizPreview()}
      </div>
    </div>
  );
};

export default QuizViewer; 