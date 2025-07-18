import React, { useState, useEffect } from 'react';
import { QuizSummary, TreeNode } from '../types';
import TreeView from './TreeView';
import InlineFeedback from './InlineFeedback';
import { buildTreeFromQuizzes } from '../utils/treeBuilder';
import { saveQuickFeedback, getSpecificFeedback, getFeedbackForQuizzes } from '../utils/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp, ThumbsDown, MessageSquare, ExternalLink, Copy } from 'lucide-react';

interface QuizViewerProps {
  quizzes: QuizSummary[];
  onBack: () => void;
  folderName: string;
}

const QuizViewer: React.FC<QuizViewerProps> = ({ quizzes, onBack, folderName }) => {
  const [selectedQuiz, setSelectedQuiz] = useState<QuizSummary | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [reviewedTreeNodes, setReviewedTreeNodes] = useState<TreeNode[]>([]);
  const [showInlineFeedback, setShowInlineFeedback] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState<'thumbsUp' | 'thumbsDown' | null>(null);
  const [existingFeedback, setExistingFeedback] = useState<any>(null);
  const [reviewedQuizzes, setReviewedQuizzes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'to-review' | 'reviewed'>('to-review');
  const [isViewMode, setIsViewMode] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(33); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  // Build tree structure from quizzes and load feedback data
  useEffect(() => {
    console.log('🔍 [QuizViewer] useEffect triggered - quizzes.length:', quizzes.length, 'folderName:', folderName);
    if (quizzes.length > 0) {
      loadReviewedQuizzes();
    }
  }, [quizzes, folderName]);

  // Rebuild trees when reviewedQuizzes changes
  useEffect(() => {
    if (quizzes.length > 0) {
      const reviewedQuizIds = Array.from(reviewedQuizzes);
      const unreviewedQuizzes = quizzes.filter(quiz => !reviewedQuizzes.has(quiz.id));
      const reviewedQuizzesFiltered = quizzes.filter(quiz => reviewedQuizzes.has(quiz.id));
      
      console.log('🔍 [QuizViewer] Building trees - Unreviewed:', unreviewedQuizzes.length, 'Reviewed:', reviewedQuizzesFiltered.length);
      
      const unreviewedTree = buildTreeFromQuizzes(unreviewedQuizzes);
      const reviewedTree = buildTreeFromQuizzes(reviewedQuizzesFiltered);
      
      setTreeNodes(unreviewedTree);
      setReviewedTreeNodes(reviewedTree);
    }
  }, [quizzes, reviewedQuizzes]);

  // Check if there's any feedback including approval status (for display purposes)
  const hasAnyFeedback = (feedback: any) => {
    return feedback && (
      feedback.standard_alignment_rating || 
      feedback.quality_rating || 
      feedback.pedagogy_rating || 
      feedback.feedback_text ||
      feedback.thumbs_up ||
      feedback.thumbs_down ||
      (feedback.approved !== null && feedback.approved !== undefined)
    );
  };

  // Load reviewed quizzes status
  const loadReviewedQuizzes = async () => {
    try {
      console.log('🔍 [QuizViewer] loadReviewedQuizzes called for folder:', folderName);
      const quizIds = quizzes.map(q => q.id);
      console.log('🔍 [QuizViewer] Quiz IDs to check:', quizIds);
      
      const feedbackData = await getFeedbackForQuizzes(folderName, quizIds);
      console.log('🔍 [QuizViewer] Raw feedback data:', feedbackData);
      
      const feedbackWithStatus = feedbackData.map(f => ({
        quiz_id: f.quiz_id,
        hasAnyFeedback: hasAnyFeedback(f),
        standard_alignment_rating: f.standard_alignment_rating,
        quality_rating: f.quality_rating,
        pedagogy_rating: f.pedagogy_rating,
        feedback_text: f.feedback_text,
        thumbs_up: f.thumbs_up,
        thumbs_down: f.thumbs_down
      }));
      console.log('🔍 [QuizViewer] Feedback with hasAnyFeedback status:', feedbackWithStatus);
      
      const reviewed = new Set(feedbackData
        .filter(f => hasAnyFeedback(f))
        .map(f => f.quiz_id)
      );
      console.log('🔍 [QuizViewer] Final reviewed quizzes set:', Array.from(reviewed));
      
      setReviewedQuizzes(reviewed);
      console.log('🔍 [QuizViewer] setReviewedQuizzes called with:', Array.from(reviewed));
    } catch (error) {
      console.error('❌ [QuizViewer] Error loading reviewed quizzes:', error);
    }
  };

  // Load specific feedback when quiz is selected
  useEffect(() => {
    if (selectedQuiz) {
      loadQuizFeedback();
    } else {
      setExistingFeedback(null);
      setIsViewMode(false);
    }
  }, [selectedQuiz]);

  const loadQuizFeedback = async () => {
    if (!selectedQuiz) return;
    
    try {
      const feedback = await getSpecificFeedback(folderName, selectedQuiz.standard || '', selectedQuiz.id);
      setExistingFeedback(feedback);
      setIsViewMode(false);
    } catch (error) {
      setExistingFeedback(null);
      console.error('Error loading quiz feedback:', error);
    }
  };

  const handleQuizSelect = (quiz: QuizSummary) => {
    setSelectedQuiz(quiz);
    setIsDescriptionExpanded(false); // Reset description expansion when selecting a new quiz
  };

  const handleRefreshPreview = () => {
    // Force a hard refresh by temporarily changing the src to about:blank
    // then back to the quiz URL, which will clear any session/login state
    const iframe = document.querySelector('iframe[title*="Preview of"]') as HTMLIFrameElement;
    if (iframe) {
      const originalSrc = iframe.src;
      iframe.src = 'about:blank';
      setTimeout(() => {
        iframe.src = originalSrc;
        setIframeKey(prev => prev + 1);
      }, 100);
    } else {
      // Fallback to just incrementing the key
      setIframeKey(prev => prev + 1);
    }
  };

  const handleQuickFeedback = async (isPositive: boolean) => {
    if (!selectedQuiz) return;

    const feedbackType = isPositive ? 'thumbsUp' : 'thumbsDown';
    setFeedbackLoading(feedbackType);

    try {
      await saveQuickFeedback({
        folderName: folderName, // You might want to get this from context or props
        domain: selectedQuiz.domain,
        topic: selectedQuiz.topic,
        standard: selectedQuiz.standard || '',
        quizId: selectedQuiz.id,
        thumbsUp: isPositive ? true : undefined,
        thumbsDown: !isPositive ? true : undefined,
      });
      
      // Reload feedback to update state
      await loadQuizFeedback();
      await loadReviewedQuizzes();
      
      toast({
        description: `Feedback saved! ${isPositive ? '👍' : '👎'}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save feedback',
      });
    } finally {
      setFeedbackLoading(null);
    }
  };

  const handleToggleFeedback = () => {
    if (existingFeedback && hasDetailedFeedback(existingFeedback)) {
      // If detailed feedback exists, show in view mode
      setIsViewMode(!showInlineFeedback);
      setShowInlineFeedback(!showInlineFeedback);
    } else {
      // If no detailed feedback, show in edit mode
      setIsViewMode(false);
      setShowInlineFeedback(!showInlineFeedback);
    }
  };

  const handleCloseFeedback = async () => {
    setShowInlineFeedback(false);
    setIsViewMode(false);
    // Reload feedback data after closing (in case it was updated)
    await loadQuizFeedback();
    await loadReviewedQuizzes();
  };

  const hasDetailedFeedback = (feedback: any) => {
    return feedback && (
      feedback.standard_alignment_rating || 
      feedback.quality_rating || 
      feedback.pedagogy_rating || 
      feedback.feedback_text
    );
  };

  const handleCopyQuizId = async () => {
    if (!selectedQuiz) return;
    
    try {
      await navigator.clipboard.writeText(selectedQuiz.id);
      toast({
        description: "Quiz ID copied to clipboard!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy quiz ID to clipboard",
      });
    }
  };

  // Handle resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newWidth = (e.clientX / window.innerWidth) * 100;
    
    // Constrain width between 20% and 60%
    if (newWidth >= 20 && newWidth <= 60) {
      setLeftPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

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
        <div className="bg-white border-b border-gray-200">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                {/* Quiz Info */}
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-lg font-semibold text-gray-900">{selectedQuiz.title}</h2>
                  {selectedQuiz.questionCount > 0 && (
                    <span className="text-sm text-gray-500 font-medium">
                      {selectedQuiz.questionCount} Qs
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {selectedQuiz.domain && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {selectedQuiz.domain}
                    </Badge>
                  )}
                  {selectedQuiz.topic && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                      {selectedQuiz.topic}
                    </Badge>
                  )}
                  {selectedQuiz.standard && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                      {selectedQuiz.standard}
                    </Badge>
                  )}
                  <Badge 
                    variant="outline" 
                    className="font-mono cursor-pointer hover:bg-gray-50 transition-colors group" 
                    onClick={handleCopyQuizId}
                    title="Click to copy quiz ID"
                  >
                    <span className="mr-1">{selectedQuiz.id}</span>
                    <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Badge>
                </div>
              </div>
              
              {/* Action Buttons - Fixed Position */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Thumbs Down */}
                <Button
                  variant={existingFeedback?.thumbs_down ? "default" : "outline"}
                  size="icon"
                  onClick={() => handleQuickFeedback(false)}
                  disabled={feedbackLoading === 'thumbsDown'}
                  className={existingFeedback?.thumbs_down 
                    ? "bg-red-600 text-white hover:bg-red-700" 
                    : "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                  }
                  title="Thumbs down"
                >
                  {feedbackLoading === 'thumbsDown' ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <ThumbsDown className={`h-4 w-4 ${existingFeedback?.thumbs_down ? 'fill-current' : ''}`} />
                  )}
                </Button>

                {/* Thumbs Up */}
                <Button
                  variant={existingFeedback?.thumbs_up ? "default" : "outline"}
                  size="icon"
                  onClick={() => handleQuickFeedback(true)}
                  disabled={feedbackLoading === 'thumbsUp'}
                  className={existingFeedback?.thumbs_up 
                    ? "bg-green-600 text-white hover:bg-green-700" 
                    : "text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-300"
                  }
                  title="Thumbs up"
                >
                  {feedbackLoading === 'thumbsUp' ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <ThumbsUp className={`h-4 w-4 ${existingFeedback?.thumbs_up ? 'fill-current' : ''}`} />
                  )}
                </Button>

                {/* Give Feedback Button */}
                <Button onClick={handleToggleFeedback}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {existingFeedback && hasDetailedFeedback(existingFeedback) ? 'Show Feedback' : 'Give Feedback'}
                </Button>

                {/* Open in New Tab */}
                <Button variant="outline" asChild>
                  <a 
                    href={quizUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Wayground
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Separate Description Container - Full Width */}
          {selectedQuiz.description && (
            <div className="px-4 pb-4">
              <div className="text-sm text-gray-600 italic leading-relaxed">
                {selectedQuiz.description.length <= 120 ? (
                  selectedQuiz.description
                ) : (
                  <>
                    {isDescriptionExpanded 
                      ? selectedQuiz.description 
                      : `${selectedQuiz.description.substring(0, 120)}...`
                    }
                    {selectedQuiz.description.length > 120 && (
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
                      >
                        {isDescriptionExpanded ? 'show less' : 'show more'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quiz Preview iframe with Feedback Overlay */}
        <div className="flex-1 bg-gray-100 p-4 relative">
          <div className="h-full bg-white rounded-lg shadow-sm overflow-hidden">
            <iframe
              key={iframeKey}
              src={quizUrl}
              className="w-full h-full border-0"
              title={`Preview of ${selectedQuiz.title}`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="storage-access"
            />
          </div>
          
          {/* Feedback Overlay */}
          {showInlineFeedback && (
            <div 
              className="absolute inset-4 bg-black/50 rounded-lg flex items-center justify-center"
              onClick={handleCloseFeedback}
            >
              <div 
                className="w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <InlineFeedback
                  folderName={folderName}
                  domain={selectedQuiz.domain}
                  topic={selectedQuiz.topic}
                  standard={selectedQuiz.standard || ''}
                  quizId={selectedQuiz.id}
                  quizTitle={selectedQuiz.title}
                  onClose={handleCloseFeedback}
                  existingFeedback={existingFeedback}
                  isViewMode={isViewMode}
                />
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg z-50">
          {Math.round(leftPanelWidth)}% | {Math.round(100 - leftPanelWidth)}%
        </div>
      )}
      
      {/* Left Sidebar - Hierarchical Tree */}
      <div 
        className="min-w-0 border-r border-gray-200 bg-white"
        style={{ width: `${leftPanelWidth}%` }}
      >
        <div className="h-full flex flex-col">
          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white">
            <div className="flex">
              <button
                onClick={() => setActiveTab('to-review')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'to-review'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                To Review ({quizzes.length - reviewedQuizzes.size})
              </button>
              <button
                onClick={() => setActiveTab('reviewed')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'reviewed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reviewed ({reviewedQuizzes.size})
              </button>
            </div>
          </div>
          
          {/* Tree View */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'to-review' ? (
              treeNodes.length > 0 ? (
                <TreeView 
                  nodes={treeNodes}
                  onQuizSelect={handleQuizSelect}
                  selectedQuizId={selectedQuiz?.id}
                  reviewedQuizzes={new Set()} // Don't show reviewed badges in to-review tab
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-sm">All quizzes have been reviewed!</p>
                    <p className="text-xs text-gray-400 mt-1">Switch to "Reviewed" tab to see completed quizzes</p>
                  </div>
                </div>
              )
            ) : (
              reviewedTreeNodes.length > 0 ? (
                <TreeView 
                  nodes={reviewedTreeNodes}
                  onQuizSelect={handleQuizSelect}
                  selectedQuizId={selectedQuiz?.id}
                  reviewedQuizzes={reviewedQuizzes} // Show reviewed badges in reviewed tab
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-sm">No quizzes reviewed yet</p>
                    <p className="text-xs text-gray-400 mt-1">Start reviewing quizzes to see them here</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Resizable Divider */}
      <div
        className="w-4 bg-gray-100 hover:bg-gray-200 cursor-col-resize flex items-center justify-center group relative transition-all duration-200"
        onMouseDown={handleMouseDown}
      >
        {/* Invisible wider click area */}
        <div className="absolute inset-0 w-6 -mx-1 cursor-col-resize" />
        
        {/* Visual divider */}
        <div className="w-0.5 h-full bg-gray-300 group-hover:bg-blue-400 transition-colors duration-200 relative z-10"></div>
        
        {/* Drag handle */}
        <div className="absolute w-1 h-8 bg-gray-400 group-hover:bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 shadow-sm">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-0.5 h-3 bg-white/70 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Panel - Quiz Preview */}
      <div 
        className="min-w-0 flex flex-col"
        style={{ width: `${100 - leftPanelWidth}%` }}
      >
        {renderQuizPreview()}
      </div>
    </div>
  );
};

export default QuizViewer; 