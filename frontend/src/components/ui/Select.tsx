import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const selectVariants = cva(
  'flex h-10 w-full bg-background px-3 py-2 pr-10 text-body text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-background-secondary transition-all duration-150 appearance-none bg-no-repeat rounded-md',
  {
    variants: {
      variant: {
        default: 'border border-border',
        error: 'border-destructive focus-visible:ring-destructive focus-visible:border-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            'rounded-md pr-10',
            selectVariants({ variant }),
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="h-4 w-4 text-content-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
