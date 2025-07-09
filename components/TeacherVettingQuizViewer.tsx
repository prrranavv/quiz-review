import React, { useState, useEffect } from 'react';
import { QuizSummary, TreeNode } from '../types';
import TreeView from './TreeView';
import TeacherVettingInlineFeedback from '@/components/TeacherVettingInlineFeedback';
import { buildTreeFromQuizzes } from '../utils/treeBuilder';
import { saveTeacherVettingFeedback, getTeacherVettingFeedbackForQuizzes, renameTeacherVettingFile } from '../utils/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Check, MessageSquare, ExternalLink, Copy, ArrowLeft, X, CheckCircle, XCircle, Edit } from 'lucide-react';

interface TeacherVettingQuizViewerProps {
  quizzes: QuizSummary[];
  onBack: () => void;
  folderName: string;
  onFolderNameChange?: (newName: string) => void;
}

const TeacherVettingQuizViewer: React.FC<TeacherVettingQuizViewerProps> = ({ quizzes, onBack, folderName, onFolderNameChange }) => {
  const [selectedQuiz, setSelectedQuiz] = useState<QuizSummary | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [showInlineFeedback, setShowInlineFeedback] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<any>(null);
  const [reviewedQuizzes, setReviewedQuizzes] = useState<Set<string>>(new Set());
  const [isViewMode, setIsViewMode] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(33); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const { toast } = useToast();

  // Build tree structure from quizzes and load feedback data
  useEffect(() => {
    if (quizzes.length > 0) {
      const tree = buildTreeFromQuizzes(quizzes);
      setTreeNodes(tree);
      loadReviewedQuizzes();
    }
  }, [quizzes]);

  // Load reviewed quizzes status
  const loadReviewedQuizzes = async () => {
    try {
      const quizIds = quizzes.map(q => q.id);
      const feedbackData = await getTeacherVettingFeedbackForQuizzes(folderName, quizIds);
      const reviewed = new Set(feedbackData.map(f => f.quiz_id));
      setReviewedQuizzes(reviewed);
    } catch (error) {
      console.error('Error loading reviewed quizzes:', error);
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
      const feedbackData = await getTeacherVettingFeedbackForQuizzes(folderName, [selectedQuiz.id]);
      const feedback = feedbackData.find(f => f.quiz_id === selectedQuiz.id);
      setExistingFeedback(feedback || null);
      setIsViewMode(false);
    } catch (error) {
      setExistingFeedback(null);
      console.error('Error loading quiz feedback:', error);
    }
  };

  const handleQuizSelect = (quiz: QuizSummary) => {
    setSelectedQuiz(quiz);
    setIsDescriptionExpanded(false);
  };

  const handleRefreshPreview = () => {
    const iframe = document.querySelector('iframe[title*="Preview of"]') as HTMLIFrameElement;
    if (iframe) {
      const originalSrc = iframe.src;
      iframe.src = 'about:blank';
      setTimeout(() => {
        iframe.src = originalSrc;
        setIframeKey(prev => prev + 1);
      }, 100);
    } else {
      setIframeKey(prev => prev + 1);
    }
  };

  const handleToggleFeedback = () => {
    if (existingFeedback && hasDetailedFeedback(existingFeedback)) {
      setIsViewMode(!showInlineFeedback);
      setShowInlineFeedback(!showInlineFeedback);
    } else {
      setIsViewMode(false);
      setShowInlineFeedback(!showInlineFeedback);
    }
  };

  const handleCloseFeedback = async () => {
    setShowInlineFeedback(false);
    setIsViewMode(false);
    await loadQuizFeedback();
    await loadReviewedQuizzes();
  };

  // Check if there's detailed feedback (excluding approval status)
  const hasDetailedFeedback = (feedback: any) => {
    return feedback && (
      feedback.usability || 
      feedback.standards_alignment || 
      feedback.jtbd || 
      feedback.feedback
    );
  };

  // Check if there's any feedback including approval status (for display purposes)
  const hasAnyFeedback = (feedback: any) => {
    return feedback && (
      feedback.usability || 
      feedback.standards_alignment || 
      feedback.jtbd || 
      feedback.feedback ||
      (feedback.approved !== null && feedback.approved !== undefined)
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

  // Add handler for approve/reject buttons
  const handleApprovalAction = async (approved: boolean) => {
    if (!selectedQuiz) return;
    
    try {
      await saveTeacherVettingFeedback({
        folderName,
        quizId: selectedQuiz.id,
        approved,
        // Keep existing feedback if it exists
        usability: existingFeedback?.usability,
        standardsAlignment: existingFeedback?.standards_alignment,
        jtbd: existingFeedback?.jtbd,
        feedbackText: existingFeedback?.feedback,
        reviewerName: 'Current Reviewer',
        // CSV data for context
        state: selectedQuiz.state,
        subject: selectedQuiz.subject,
        grade: selectedQuiz.grade,
        domain: selectedQuiz.domain,
        topic: selectedQuiz.topic,
        instructureCode: selectedQuiz.instructure_code,
        displayStandardCode: selectedQuiz.display_standard_code,
        description: selectedQuiz.description,
        quizTitle: selectedQuiz.title,
        quizType: selectedQuiz.quiz_type,
        numQuestions: selectedQuiz.questionCount,
        varietyTag: selectedQuiz.variety_tag,
        score: selectedQuiz.score,
      });
      
      toast({
        description: `Quiz ${approved ? 'approved' : 'rejected'} successfully! 🎉`,
      });
      
      // Refresh feedback data
      await loadQuizFeedback();
      await loadReviewedQuizzes();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to save approval',
      });
    }
  };

  // Handle folder name editing
  const handleStartEditing = () => {
    setIsEditingName(true);
    // Set the current display name (without timestamp prefix)
    const cleanName = folderName.replace(/^teacher-vetting-\d+-/, '');
    setEditingName(cleanName);
  };

  const handleCancelEditing = () => {
    setIsEditingName(false);
    setEditingName('');
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Folder name cannot be empty",
      });
      return;
    }

    if (editingName.trim() === folderName.replace(/^teacher-vetting-\d+-/, '')) {
      // No change, just cancel editing
      handleCancelEditing();
      return;
    }

    setIsRenaming(true);
    try {
      // Extract timestamp from original filename
      const timestampMatch = folderName.match(/^teacher-vetting-(\d+)-/);
      const timestamp = timestampMatch ? timestampMatch[1] : Date.now().toString();
      
      // Create new filename with same timestamp but new name
      const newFileName = `teacher-vetting-${timestamp}-${editingName.trim()}.csv`;
      
      // Rename the file and update database references
      await renameTeacherVettingFile(folderName, newFileName);
      
      // Update the parent component if callback is provided
      if (onFolderNameChange) {
        onFolderNameChange(newFileName);
      }
      
      toast({
        description: "Folder name updated successfully! 🎉",
      });
      
      setIsEditingName(false);
      setEditingName('');
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to rename folder',
      });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEditing();
    }
  };

  const getDisplayName = (fileName: string) => {
    // Remove timestamp prefix and .csv extension
    return fileName.replace(/^teacher-vetting-\d+-/, '').replace('.csv', '');
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
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Approval Status */}
                {existingFeedback && existingFeedback.approved !== null && existingFeedback.approved !== undefined && (
                  <Badge 
                    variant={existingFeedback.approved ? "default" : "destructive"}
                    className={existingFeedback.approved 
                      ? "bg-green-600 text-white" 
                      : "bg-red-600 text-white"
                    }
                  >
                    {existingFeedback.approved ? "Approved" : "Rejected"}
                  </Badge>
                )}

                {/* Approve Button */}
                <Button
                  variant={existingFeedback?.approved === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleApprovalAction(true)}
                  className={existingFeedback?.approved === true 
                    ? "bg-green-600 text-white hover:bg-green-700" 
                    : "text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                  }
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>

                {/* Reject Button */}
                <Button
                  variant={existingFeedback?.approved === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleApprovalAction(false)}
                  className={existingFeedback?.approved === false 
                    ? "bg-red-600 text-white hover:bg-red-700" 
                    : "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  }
                >
                  <XCircle className="h-4 w-4" />
                </Button>

                {/* Give Feedback Button */}
                <Button onClick={handleToggleFeedback}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {existingFeedback && hasAnyFeedback(existingFeedback) ? 'Show Feedback' : 'Share feedback'}
                </Button>

                {/* Open in New Tab */}
                <Button variant="outline" asChild>
                  <a 
                    href={quizUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Wayground
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Description */}
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
                className="w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <TeacherVettingInlineFeedback
                  folderName={folderName}
                  quizId={selectedQuiz.id}
                  quizData={selectedQuiz}
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

  const totalQuizzes = quizzes.length;
  const reviewedCount = reviewedQuizzes.size;
  const pendingCount = totalQuizzes - reviewedCount;

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
          {/* Header with Back Button */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Upload
              </Button>
              <div className="text-right flex-1 max-w-[200px]">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="text-sm h-8"
                      placeholder="Enter folder name"
                      autoFocus
                    />
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={isRenaming}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEditing}
                        disabled={isRenaming}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group cursor-pointer" onClick={handleStartEditing}>
                    <div className="flex items-center gap-2 justify-end">
                      <h1 className="text-sm font-semibold text-gray-900">
                        {(() => {
                          const cleanName = getDisplayName(folderName);
                          return cleanName.length > 30 ? cleanName.substring(0, 30) + '...' : cleanName;
                        })()}
                      </h1>
                      <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-gray-600">{totalQuizzes} quizzes to review</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Tree View */}
          <div className="flex-1 overflow-hidden">
            {treeNodes.length > 0 ? (
              <TreeView 
                nodes={treeNodes}
                onQuizSelect={handleQuizSelect}
                selectedQuizId={selectedQuiz?.id}
                reviewedQuizzes={reviewedQuizzes}
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

export default TeacherVettingQuizViewer; 