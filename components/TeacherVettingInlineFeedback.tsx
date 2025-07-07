import { useState, useEffect } from 'react';
import { saveTeacherVettingFeedback } from '../utils/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { X, Edit, Check, XCircle } from 'lucide-react';
import { QuizSummary } from '../types';

interface TeacherVettingInlineFeedbackProps {
  folderName: string;
  quizId: string;
  quizData: QuizSummary;
  onClose?: () => void;
  existingFeedback?: any;
  isViewMode?: boolean;
}

export default function TeacherVettingInlineFeedback({
  folderName,
  quizId,
  quizData,
  onClose,
  existingFeedback,
  isViewMode = false
}: TeacherVettingInlineFeedbackProps) {
  const [usability, setUsability] = useState<number>(0);
  const [standardsAlignment, setStandardsAlignment] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const TAG_OPTIONS = ['Practice', 'Review', 'Teach'];

  // Load existing feedback when component mounts or existingFeedback changes
  useEffect(() => {
    if (existingFeedback) {
      setUsability(existingFeedback.usability || 0);
      setStandardsAlignment(existingFeedback.standards_alignment || 0);
      // Parse existing JTBD as tags - handle both string and array formats
      if (existingFeedback.jtbd) {
        if (typeof existingFeedback.jtbd === 'string') {
          // Try to parse as comma-separated values, fallback to single tag
          const existingTags = existingFeedback.jtbd.split(',').map((t: string) => t.trim()).filter((t: string) => t);
          setTags(existingTags.filter((tag: string) => TAG_OPTIONS.includes(tag)));
        } else if (Array.isArray(existingFeedback.jtbd)) {
          setTags(existingFeedback.jtbd.filter((tag: string) => TAG_OPTIONS.includes(tag)));
        }
      } else {
        setTags([]);
      }
      setFeedback(existingFeedback.feedback || '');
    } else {
      // Reset form if no existing feedback
      setUsability(0);
      setStandardsAlignment(0);
      setTags([]);
      setFeedback('');
    }
  }, [existingFeedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);

    try {
      await saveTeacherVettingFeedback({
        folderName,
        quizId,
        // Keep existing approval status
        approved: existingFeedback?.approved,
        usability: usability > 0 ? usability : undefined,
        standardsAlignment: standardsAlignment > 0 ? standardsAlignment : undefined,
        jtbd: tags.length > 0 ? tags.join(', ') : undefined,
        feedbackText: feedback.trim() || undefined,
        reviewerName: 'Current Reviewer',
        // CSV data for context
        state: quizData.state,
        subject: quizData.subject,
        grade: quizData.grade,
        domain: quizData.domain,
        topic: quizData.topic,
        instructureCode: quizData.instructure_code,
        displayStandardCode: quizData.display_standard_code,
        description: quizData.description,
        quizTitle: quizData.title,
        quizType: quizData.quiz_type,
        numQuestions: quizData.questionCount,
        varietyTag: quizData.variety_tag,
        score: quizData.score,
      });
      
      toast({
        description: `Feedback saved successfully! 🎉`,
      });
      
      if (onClose) {
        onClose();
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to save feedback',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const RatingButton = ({ 
    value, 
    currentRating, 
    onRate, 
    disabled 
  }: { 
    value: number; 
    currentRating: number; 
    onRate: (rating: number) => void; 
    disabled: boolean;
  }) => (
    <Button
      type="button"
      variant={currentRating === value ? "default" : "outline"}
      size="sm"
      onClick={() => onRate(value)}
      disabled={disabled}
      className="w-8 h-8 p-0"
    >
      {value}
    </Button>
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <h3 className="text-lg font-semibold">
          {isViewMode && !isEditing ? 'Vetting Feedback' : 'Share feedback'}
        </h3>
        <div className="flex items-center gap-2">
          {isViewMode && !isEditing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Ratings Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Usability Rating */}
            <div>
              <label className="text-sm font-medium mb-2 block">Usability (1-3)</label>
              <div className="flex gap-1">
                {[1, 2, 3].map(value => (
                  <RatingButton
                    key={value}
                    value={value}
                    currentRating={usability}
                    onRate={setUsability}
                    disabled={isSubmitting || (isViewMode && !isEditing)}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Ease of use</p>
            </div>

            {/* Standards Alignment Rating */}
            <div>
              <label className="text-sm font-medium mb-2 block">Standards (1-3)</label>
              <div className="flex gap-1">
                {[1, 2, 3].map(value => (
                  <RatingButton
                    key={value}
                    value={value}
                    currentRating={standardsAlignment}
                    onRate={setStandardsAlignment}
                    disabled={isSubmitting || (isViewMode && !isEditing)}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Alignment quality</p>
            </div>
          </div>

          {/* Tag Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tag</label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map(tag => (
                <Button
                  key={tag}
                  type="button"
                  variant={tags.includes(tag) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTagToggle(tag)}
                  disabled={isSubmitting || (isViewMode && !isEditing)}
                  className="text-sm"
                >
                  {tag}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500">Select one or more tags that describe this quiz's purpose</p>
          </div>

          {/* Additional Feedback */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Feedback</label>
            <Textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={isSubmitting || (isViewMode && !isEditing)}
              placeholder="Any additional comments, suggestions, or observations..."
              className="resize-none"
              readOnly={isViewMode && !isEditing}
            />
          </div>

          {/* Submit Button */}
          {(!isViewMode || isEditing) && (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Saving...' : 'Save feedback'}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
} 