import React, { useState } from 'react';
import { QuizSummary, QuizizzQuestion } from '../types';
import { renderHTML } from '../utils/contentRenderer';
import QuizList from './QuizList';
import ImageModal from './ImageModal';
import ImageThumbnail from './ImageThumbnail';

interface QuizViewerProps {
  quizzes: QuizSummary[];
  onBack: () => void;
}

interface SelectedImage {
  src: string;
  alt: string;
}

const QuizViewer: React.FC<QuizViewerProps> = ({ quizzes, onBack }) => {
  const [selectedQuiz, setSelectedQuiz] = useState<QuizSummary | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<QuizizzQuestion | null>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);

  const handleQuizSelect = (quiz: QuizSummary) => {
    setSelectedQuiz(quiz);
    setSelectedQuestion(null);
  };

  const renderQuestionContent = () => {
    if (!selectedQuiz || !selectedQuiz.data) {
      return (
        <>
          {/* Empty State Header */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Quiz Details</h2>
            </div>
          </div>
          
          {/* Empty State Content */}
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">Select a quiz from the list to view questions</p>
            </div>
          </div>
        </>
      );
    }

    const quiz = selectedQuiz.data.data.quiz;

    return (
      <>
        {/* Quiz Container Header */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Quiz Thumbnail */}
              {quiz.info.image ? (
                <img
                  src={quiz.info.image}
                  alt={quiz.info.name}
                  className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage({
                    src: quiz.info.image!,
                    alt: quiz.info.name
                  })}
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              
              {/* Quiz Title and Details */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">{quiz.info.name}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{quiz.info.questions.length} question{quiz.info.questions.length !== 1 ? 's' : ''}</span>
                  <span className="font-mono text-xs">ID: {quiz._id}</span>
                  {selectedQuiz.standard && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {selectedQuiz.standard}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Open Quiz Button */}
            <a 
              href={`https://quizizz.com/admin/quiz/${quiz._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300 rounded-md transition-colors"
            >
              Open on Quizizz
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="space-y-4">
            {quiz.info.questions.map((question: QuizizzQuestion, index: number) => (
              <div 
                key={question._id || index}
                onClick={() => setSelectedQuestion(
                  selectedQuestion?._id === question._id ? null : question
                )}
                className={`bg-white border rounded-lg cursor-pointer transition-all ${
                  selectedQuestion?._id === question._id 
                    ? 'border-blue-300 shadow-md' 
                    : 'border-gray-200 hover:border-blue-200 hover:shadow-sm'
                }`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-semibold text-gray-700">Question {index + 1}</span>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 font-medium">
                          {question.type || 'MCQ'}
                        </span>
                      </div>
                      <div 
                        className="mb-2 text-gray-800 leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: renderHTML(question.structure.query.text)
                        }} 
                      />
                    </div>
                    
                    {/* Show question media if available */}
                    {question.structure.query.media && question.structure.query.media.length > 0 && (
                      <div className="ml-4 flex-shrink-0">
                        <ImageThumbnail
                          src={question.structure.query.media[0].url!}
                          alt={`Question ${index + 1} media`}
                          onClick={() => setSelectedImage({
                            src: question.structure.query.media![0].url!,
                            alt: `Question ${index + 1} media`
                          })}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Expanded question details */}
                {selectedQuestion?._id === question._id && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="text-sm font-semibold text-gray-700 mb-3">Options:</div>
                    <div className="space-y-3">
                      {question.structure.options.map((option, optIndex) => (
                        <div 
                          key={optIndex}
                          className={`p-3 rounded-md flex justify-between items-center ${
                            question.structure.answer.includes(optIndex)
                               ? 'bg-green-100 border border-green-300' 
                               : 'bg-white border border-gray-200'
                           }`}
                        >
                          <div
                            className="flex-1"
                            dangerouslySetInnerHTML={{ 
                              __html: renderHTML(option.text)
                            }}
                          />
                          
                          {/* Show option media if available */}
                          {option.media && option.media.length > 0 && (
                            <div className="ml-3">
                              <ImageThumbnail
                                src={option.media[0].url!}
                                alt={`Option ${optIndex + 1} media`}
                                onClick={() => setSelectedImage({
                                  src: option.media![0].url!,
                                  alt: `Option ${optIndex + 1} media`
                                })}
                              />
                            </div>
                          )}
                          
                          {question.structure.answer.includes(optIndex) && (
                            <span className="ml-3 text-green-600 text-sm font-semibold flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Explanation */}
                    {question.structure.explain && question.structure.explain.text && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="text-sm font-semibold text-yellow-800 mb-1">Explanation:</div>
                        <div 
                          className="text-sm text-yellow-700"
                          dangerouslySetInnerHTML={{ 
                            __html: renderHTML(question.structure.explain.text)
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="h-screen bg-gray-100 p-6">
      {/* Top Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Quiz Review - Batch Mode</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {quizzes.filter(q => q.status === 'loaded').length} of {quizzes.length} quizzes loaded
            </span>
            <button
              onClick={onBack}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload a file
            </button>
          </div>
        </div>
      </div>

              {/* Main Content - Two Containers */}
        <div className="flex space-x-6 h-[calc(100vh-140px)]">
          {/* Left Container - Quiz List (30%) */}
          <div className="w-[30%] bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <QuizList
              quizzes={quizzes}
              selectedQuizId={selectedQuiz?.id || null}
              onQuizSelect={handleQuizSelect}
              onBack={onBack}
            />
          </div>

          {/* Right Container - Selected Quiz Questions (70%) */}
          <div className="w-[70%] bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          {renderQuestionContent()}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          src={selectedImage.src}
          alt={selectedImage.alt}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};

export default QuizViewer; 