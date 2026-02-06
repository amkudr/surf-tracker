import React, { useId, useState } from 'react';
import { cn } from '../../utils/cn';
import { getDifficultyLabel, normalizeDifficultyArray } from '../../utils/difficulty';
import { DifficultyBadge } from './DifficultyBadge';

export interface DifficultyBadgesProps {
  values: number[];
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
  variant?: 'pill' | 'dot' | 'bar';
  interactive?: boolean;
  compactLabel?: boolean;
}

const DifficultyBadges = React.forwardRef<HTMLDivElement, DifficultyBadgesProps>(
  (
    {
      values,
      size = 'sm',
      className,
      showIcon = true,
      variant = 'pill',
      interactive = false,
      compactLabel = false,
      ...props
    },
    ref
  ) => {
    const normalizedValues = normalizeDifficultyArray(values);
    const descriptionId = useId();
    const [isOpen, setIsOpen] = useState(false);

    if (normalizedValues.length === 0) {
      return null;
    }

    if (variant === 'bar') {
      const labelWithDescription = `levels: ${normalizedValues
        .map((difficulty) => getDifficultyLabel(difficulty))
        .join(', ')}`;

      const barSizeClasses = {
        xs: 'h-4 w-14',
        sm: 'h-5 w-16',
        md: 'h-6 w-20',
      } as const;

      const segmentColorClasses: Record<number, string> = {
        0: 'bg-blue-300',
        1: 'bg-green-300',
        2: 'bg-orange-300',
        3: 'bg-red-300',
      };

      return (
        <div className="relative inline-flex" ref={ref}>
          <button
            type="button"
            className={cn(
              'inline-flex items-center overflow-hidden rounded-full border border-content-secondary/30 bg-content-secondary/10 shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white',
              barSizeClasses[size],
              className
            )}
            aria-label={labelWithDescription}
            aria-expanded={interactive ? isOpen : undefined}
            aria-describedby={interactive ? descriptionId : undefined}
            title={labelWithDescription}
            onClick={() => {
              if (interactive) {
                setIsOpen((open) => !open);
              }
            }}
            onBlur={() => {
              if (interactive) {
                setIsOpen(false);
              }
            }}
            onKeyDown={(event) => {
              if (!interactive) return;
              if (event.key === 'Escape') {
                setIsOpen(false);
              }
            }}
          >
            {normalizedValues.map((difficulty) => (
              <span
                key={difficulty}
                className={cn('h-full flex-1', segmentColorClasses[difficulty] || 'bg-content-secondary')}
              />
            ))}
          </button>
          {interactive && isOpen && (
            <div
              id={descriptionId}
              className="absolute right-0 top-full mt-1 w-max max-w-[260px] rounded-md border border-border bg-background px-2 py-1 text-xs text-content-primary shadow-sm"
            >
              {labelWithDescription}
            </div>
          )}
        </div>
      );
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
            variant={variant}
            interactive={interactive}
            compactLabel={compactLabel}
          />
        ))}
      </div>
    );
  }
);

DifficultyBadges.displayName = 'DifficultyBadges';

export { DifficultyBadges };
