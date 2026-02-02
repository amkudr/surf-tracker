import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { getDifficultyLabel, normalizeDifficulty } from '../../utils/difficulty';
import { Waves } from 'lucide-react';

const difficultyBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-medium border transition-colors',
  {
    variants: {
      level: {
        0: 'bg-blue-50 text-blue-700 border-blue-200',
        1: 'bg-green-50 text-green-700 border-green-200',
        2: 'bg-orange-50 text-orange-700 border-orange-200',
        3: 'bg-red-50 text-red-700 border-red-200',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs gap-1',
        md: 'px-2.5 py-1 text-caption gap-1.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface DifficultyBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof difficultyBadgeVariants> {
  value: number;
  showIcon?: boolean;
}

const DifficultyBadge = React.forwardRef<HTMLDivElement, DifficultyBadgeProps>(
  ({ className, value, level, size = 'md', showIcon = true, ...props }, ref) => {
    const normalizedValue = normalizeDifficulty(value);
    const displayLevel = level != null ? normalizeDifficulty(level) : normalizedValue;

    return (
      <div
        ref={ref}
        className={cn(difficultyBadgeVariants({ level: displayLevel, size }), className)}
        {...props}
      >
        {showIcon && <Waves className="h-3 w-3" />}
        <span>{getDifficultyLabel(normalizedValue)}</span>
      </div>
    );
  }
);

DifficultyBadge.displayName = 'DifficultyBadge';

export { DifficultyBadge, difficultyBadgeVariants };