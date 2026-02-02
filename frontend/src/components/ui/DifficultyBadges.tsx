import React from 'react';
import { cn } from '../../utils/cn';
import { normalizeDifficultyArray } from '../../utils/difficulty';
import { DifficultyBadge } from './DifficultyBadge';

export interface DifficultyBadgesProps {
  values: number[];
  size?: 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}

const DifficultyBadges = React.forwardRef<HTMLDivElement, DifficultyBadgesProps>(
  ({ values, size = 'sm', className, showIcon = true, ...props }, ref) => {
    const normalizedValues = normalizeDifficultyArray(values);

    if (normalizedValues.length === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn('flex flex-wrap gap-1', className)}
        {...props}
      >
        {normalizedValues.map((difficulty) => (
          <DifficultyBadge
            key={difficulty}
            value={difficulty}
            size={size}
            showIcon={showIcon}
          />
        ))}
      </div>
    );
  }
);

DifficultyBadges.displayName = 'DifficultyBadges';

export { DifficultyBadges };