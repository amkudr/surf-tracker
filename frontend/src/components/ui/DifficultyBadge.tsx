import React, { useId, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { getDifficultyDescription, getDifficultyLabel, normalizeDifficulty } from '../../utils/difficulty';
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
        xs: 'px-1.5 py-0 text-[10px] gap-0.5',
        sm: 'px-2 py-0.5 text-xs gap-1',
        md: 'px-2.5 py-1 text-caption gap-1.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const difficultyDotVariants = cva('inline-flex items-center justify-center rounded-full border', {
  variants: {
    level: {
      0: 'bg-blue-500 border-blue-200',
      1: 'bg-green-500 border-green-200',
      2: 'bg-orange-500 border-orange-200',
      3: 'bg-red-500 border-red-200',
    },
    size: {
      xs: 'h-2.5 w-2.5',
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

export interface DifficultyBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof difficultyBadgeVariants> {
  value: number;
  showIcon?: boolean;
  variant?: 'pill' | 'dot';
  interactive?: boolean;
  compactLabel?: boolean;
}

const DifficultyBadge = React.forwardRef<HTMLDivElement, DifficultyBadgeProps>(
  (
    {
      className,
      value,
      level,
      size = 'md',
      showIcon = true,
      variant = 'pill',
      interactive = false,
      compactLabel = false,
      ...props
    },
    ref
  ) => {
    const normalizedValue = normalizeDifficulty(value);
    const displayLevel = level != null ? normalizeDifficulty(level) : normalizedValue;
    const label = getDifficultyLabel(normalizedValue);
    const description = getDifficultyDescription(normalizedValue);
    const explanation = description ? `${label}: ${description}` : label;
    const descriptionId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const shortLabels = ['Beg', 'Int', 'Adv', 'Exp'] as const;
    const displayLabel = compactLabel ? shortLabels[normalizedValue] : label;

    if (variant === 'dot') {
      return (
        <div
          ref={ref}
          className={cn(difficultyDotVariants({ level: displayLevel, size }), className)}
          aria-label={label}
          {...props}
        >
          <span className="sr-only">{label}</span>
        </div>
      );
    }

    return (
      <div ref={ref} className="relative inline-flex" {...props}>
        <button
          type="button"
          className={cn(
            difficultyBadgeVariants({ level: displayLevel, size }),
            'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white',
            className
          )}
          onClick={() => interactive && setIsOpen((open) => !open)}
          onBlur={() => interactive && setIsOpen(false)}
          onKeyDown={(event) => {
            if (!interactive) return;
            if (event.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          aria-expanded={interactive ? isOpen : undefined}
          aria-describedby={interactive ? descriptionId : undefined}
          title={interactive ? explanation : undefined}
        >
          {showIcon && <Waves className="h-3 w-3" />}
          <span>{displayLabel}</span>
        </button>
        {interactive && isOpen && description && (
          <div
            id={descriptionId}
            className="absolute left-0 top-full mt-1 w-max max-w-[220px] rounded-md border border-border bg-background px-2 py-1 text-xs text-content-primary shadow-sm"
          >
            {explanation}
          </div>
        )}
      </div>
    );
  }
);

DifficultyBadge.displayName = 'DifficultyBadge';

export { DifficultyBadge, difficultyBadgeVariants };
