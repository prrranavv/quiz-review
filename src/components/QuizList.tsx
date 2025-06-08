import React, { useMemo, useState, useEffect, useRef } from 'react';
import { QuizSummary, GroupedQuizzes } from '../types';
import { truncateText } from '../utils/contentRenderer';

interface QuizListProps {
  quizzes: QuizSummary[];
  selectedQuizId: string | null;
  onQuizSelect: (quiz: QuizSummary) => void;
  onBack: () => void;
}

const QuizList: React.FC<QuizListProps> = ({ quizzes, selectedQuizId, onQuizSelect }) => {
  const [collapsedStandards, setCollapsedStandards] = useState<Set<string>>(new Set());
  const initializedStandards = useRef<Set<string>>(new Set());

  // Group quizzes by standard
  const groupedQuizzes: GroupedQuizzes = useMemo(() => {
    const groups: GroupedQuizzes = {};
    
    quizzes.forEach(quiz => {
      const standard = quiz.standard || 'No Standard';
      if (!groups[standard]) {
        groups[standard] = [];
      }
      groups[standard].push(quiz);
    });

    // Sort standards alphabetically, with "No Standard" at the end
    const sortedGroups: GroupedQuizzes = {};
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'No Standard') return 1;
      if (b === 'No Standard') return -1;
      return a.localeCompare(b);
    });

    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }, [quizzes]);

  // Initialize new standards as collapsed, but preserve existing state
  useEffect(() => {
    const allStandards = Object.keys(groupedQuizzes);
    const newStandards = allStandards.filter(standard => !initializedStandards.current.has(standard));
    
    if (newStandards.length > 0) {
      // Mark these standards as initialized
      newStandards.forEach(standard => initializedStandards.current.add(standard));
      
      // Add new standards to collapsed set
      setCollapsedStandards(prev => {
        const newCollapsed = new Set(prev);
        newStandards.forEach(standard => newCollapsed.add(standard));
        return newCollapsed;
      });
    }
  }, [groupedQuizzes]); // Only depend on groupedQuizzes, not collapsedStandards

  const toggleStandardCollapse = (standard: string) => {
    setCollapsedStandards(prev => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(standard)) {
        newCollapsed.delete(standard);
      } else {
        newCollapsed.add(standard);
      }
      return newCollapsed;
    });
  };

  const getStatusIcon = (quiz: QuizSummary) => {
    if (quiz.status === 'loading') {
      return (
        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      );
    }
    if (quiz.status === 'error') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
  };

  const renderQuizCard = (quiz: QuizSummary) => (
    <div
      key={quiz.id}
      onClick={() => quiz.status === 'loaded' && onQuizSelect(quiz)}
      className={`p-2 rounded-lg border transition-all cursor-pointer ${
        selectedQuizId === quiz.id
          ? 'border-blue-300 bg-blue-50 shadow-md'
          : quiz.status === 'loaded'
          ? 'border-gray-200 hover:border-blue-200 hover:bg-gray-50 hover:shadow-sm'
          : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-75'
      }`}
    >
      <div className="flex items-start justify-between">
        {/* Content - Left Side */}
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
            {quiz.title}
          </h3>
          
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-gray-600">
              {quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''}
            </p>
            <div className="flex-shrink-0">
              {getStatusIcon(quiz)}
            </div>
          </div>
          
          {/* Subject and Grade Tags */}
          <div className="flex flex-wrap gap-1 mb-1">
            {quiz.subject && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {quiz.subject}
              </span>
            )}
            {quiz.grade && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Grade {quiz.grade}
              </span>
            )}
          </div>
          
          {/* Topic */}
          {quiz.topic && (
            <p className="text-xs text-gray-500 truncate mb-1">
              {quiz.topic}
            </p>
          )}
          
          {/* Quiz ID */}
          <p className="text-xs text-gray-400 font-mono truncate">
            {truncateText(quiz.id, 14)}
          </p>
          
          {/* Error message */}
 
        </div>
        
        {/* Thumbnail - Right Side */}
        <div className="flex-shrink-0">
          {quiz.image ? (
            <img
              src={quiz.image}
              alt={quiz.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Quiz Groups */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {Object.entries(groupedQuizzes).map(([standard, standardQuizzes]) => {
            const isCollapsed = collapsedStandards.has(standard);
            const loadedCount = standardQuizzes.filter(q => q.status === 'loaded').length;
            const loadingCount = standardQuizzes.filter(q => q.status === 'loading').length;
            const errorCount = standardQuizzes.filter(q => q.status === 'error').length;

            return (
              <div key={standard} className="mb-4">
                {/* Standard Header */}
                <button
                  onClick={() => toggleStandardCollapse(standard)}
                  className="w-full flex items-center justify-between p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center">
                    <svg
                      className={`h-4 w-4 text-gray-500 transition-transform mr-2 ${
                        isCollapsed ? '' : 'rotate-90'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {standard}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {standardQuizzes.length} quiz{standardQuizzes.length !== 1 ? 'es' : ''}
                        {loadedCount > 0 && (
                          <span className="text-green-600 ml-1">• {loadedCount} loaded</span>
                        )}
                        {loadingCount > 0 && (
                          <span className="text-blue-600 ml-1">• {loadingCount} loading</span>
                        )}
                        {errorCount > 0 && (
                          <span className="text-red-600 ml-1">• {errorCount} error{errorCount !== 1 ? 's' : ''}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Quiz Cards */}
                {!isCollapsed && (
                  <div className="mt-3 space-y-3 pl-6">
                    {standardQuizzes.map(renderQuizCard)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Summary Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Total:</span>
            <span className="font-medium">{quizzes.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Loaded:</span>
            <span className="text-green-600 font-medium">{quizzes.filter(q => q.status === 'loaded').length}</span>
          </div>
          <div className="flex justify-between">
            <span>Loading:</span>
            <span className="text-blue-600 font-medium">{quizzes.filter(q => q.status === 'loading').length}</span>
          </div>
          <div className="flex justify-between">
            <span>Errors:</span>
            <span className="text-red-600 font-medium">{quizzes.filter(q => q.status === 'error').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizList; 