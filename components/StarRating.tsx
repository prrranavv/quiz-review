import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  label: string;
  disabled?: boolean;
}

export default function StarRating({ rating, onRatingChange, label, disabled = false }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (starValue: number) => {
    if (!disabled) {
      onRatingChange(starValue);
    }
  };

  const handleStarHover = (starValue: number) => {
    if (!disabled) {
      setHoverRating(starValue);
    }
  };

  const handleStarLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex space-x-1">
        {[1, 2, 3].map((star) => {
          const isFilled = star <= (hoverRating || rating);
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              onMouseLeave={handleStarLeave}
              disabled={disabled}
              className={cn(
                "w-8 h-8 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm",
                disabled 
                  ? "cursor-not-allowed opacity-50" 
                  : "cursor-pointer hover:scale-110",
                isFilled
                  ? "text-yellow-400 hover:text-yellow-500"
                  : "text-muted-foreground hover:text-yellow-200"
              )}
            >
              <svg
                fill="currentColor"
                viewBox="0 0 20 20"
                className="w-full h-full"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
} 