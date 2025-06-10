import { useState } from 'react';
import StarRating from './StarRating';
import { saveDetailedFeedback, DetailedFeedback } from '../utils/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName: string;
  domain?: string;
  topic?: string;
  standard: string;
  quizId: string;
  quizTitle: string;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  folderName,
  domain,
  topic,
  standard,
  quizId,
  quizTitle
}: FeedbackModalProps) {
  const [standardAlignmentRating, setStandardAlignmentRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [pedagogyRating, setPedagogyRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!standardAlignmentRating || !qualityRating || !pedagogyRating) {
      setError('Please provide ratings for all categories');
      return;
    }

    setIsSubmitting(true);
    setError(null);

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
      
      // Reset form
      setStandardAlignmentRating(0);
      setQualityRating(0);
      setPedagogyRating(0);
      setFeedbackText('');
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Give Feedback</DialogTitle>
          <DialogDescription asChild>
            <div>
              <p className="text-sm text-muted-foreground mt-1">{quizTitle}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {domain && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    {domain}
                  </Badge>
                )}
                {topic && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                    {topic}
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                  {standard}
                </Badge>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Ratings */}
          <div className="space-y-4">
            <StarRating
              rating={standardAlignmentRating}
              onRatingChange={setStandardAlignmentRating}
              label="Standard Alignment"
              disabled={isSubmitting}
            />
            
            <StarRating
              rating={qualityRating}
              onRatingChange={setQualityRating}
              label="Quality"
              disabled={isSubmitting}
            />
            
            <StarRating
              rating={pedagogyRating}
              onRatingChange={setPedagogyRating}
              label="Pedagogy"
              disabled={isSubmitting}
            />
          </div>

          {/* Text Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback-text">
              Additional Comments (optional)
            </Label>
            <Textarea
              id="feedback-text"
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              disabled={isSubmitting}
              placeholder="Share your thoughts about this quiz..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/15 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 