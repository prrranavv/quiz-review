import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { saveDetailedFeedback, DetailedFeedback } from '../utils/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { X, Edit } from 'lucide-react';

interface InlineFeedbackProps {
  folderName: string;
  domain?: string;
  topic?: string;
  standard: string;
  quizId: string;
  quizTitle: string;
  onClose?: () => void;
  existingFeedback?: any;
  isViewMode?: boolean;
}

export default function InlineFeedback({
  folderName,
  domain,
  topic,
  standard,
  quizId,
  quizTitle,
  onClose,
  existingFeedback,
  isViewMode = false
}: InlineFeedbackProps) {
  const [standardAlignmentRating, setStandardAlignmentRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [pedagogyRating, setPedagogyRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Load existing feedback when component mounts or existingFeedback changes
  useEffect(() => {
    if (existingFeedback) {
      setStandardAlignmentRating(existingFeedback.standard_alignment_rating || 0);
      setQualityRating(existingFeedback.quality_rating || 0);
      setPedagogyRating(existingFeedback.pedagogy_rating || 0);
      setFeedbackText(existingFeedback.feedback_text || '');
    } else {
      // Reset form if no existing feedback
      setStandardAlignmentRating(0);
      setQualityRating(0);
      setPedagogyRating(0);
      setFeedbackText('');
    }
  }, [existingFeedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!standardAlignmentRating || !qualityRating || !pedagogyRating) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide ratings for all categories",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const feedback: DetailedFeedback = {
        folderName,
        domain,
        topic,
        standard,
        quizId,
        standardAlignmentRating,
        qualityRating,
        pedagogyRating,
        feedbackText: feedbackText.trim() || undefined,
      };

      await saveDetailedFeedback(feedback);
      
      toast({
        description: "Feedback submitted successfully! 🎉",
      });
      
      // Reset form
      setStandardAlignmentRating(0);
      setQualityRating(0);
      setPedagogyRating(0);
      setFeedbackText('');
      
      if (onClose) {
        onClose();
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to submit feedback',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <h3 className="text-lg font-semibold">
          {isViewMode && !isEditing ? 'Feedback' : 'Give Feedback'}
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
      <CardContent className="p-4 pt-0">
                  <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Ratings */}
            <div className="space-y-4">
              <StarRating
                rating={standardAlignmentRating}
                onRatingChange={setStandardAlignmentRating}
                label="Standards alignment"
                disabled={isSubmitting || (isViewMode && !isEditing)}
              />
              
              <StarRating
                rating={qualityRating}
                onRatingChange={setQualityRating}
                label="Quality"
                disabled={isSubmitting || (isViewMode && !isEditing)}
              />
              
              <StarRating
                rating={pedagogyRating}
                onRatingChange={setPedagogyRating}
                label="Pedagogy"
                disabled={isSubmitting || (isViewMode && !isEditing)}
              />
            </div>

            {/* Text Feedback */}
            <div className="space-y-2">
              <Textarea
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                disabled={isSubmitting || (isViewMode && !isEditing)}
                placeholder="What do you think about this resource? Is it a 10 ⭐ resource for this standard/curriculum chapter?"
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
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </form>
      </CardContent>
    </Card>
  );
} 