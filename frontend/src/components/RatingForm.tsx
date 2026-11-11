import { Star } from 'lucide-react';
import { cn } from '@/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' };

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(!readonly && 'cursor-pointer hover:scale-110 transition-transform')}
        >
          <Star
            className={cn(
              sizes[size],
              star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  );
}

interface RatingCriteriaProps {
  criteria: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

const CRITERIA_LABELS: Record<string, string> = {
  taste: 'Taste',
  quality: 'Quality',
  quantity: 'Quantity',
  hygiene: 'Hygiene',
  variety: 'Variety',
  temperature: 'Temperature',
  overall: 'Overall Experience',
};

export function RatingCriteriaForm({ criteria, onChange }: RatingCriteriaProps) {
  return (
    <div className="space-y-4">
      {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
        <div key={key} className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <StarRating value={criteria[key] || 0} onChange={(v) => onChange(key, v)} />
        </div>
      ))}
    </div>
  );
}
