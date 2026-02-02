import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const segmentedControlVariants = cva(
  'inline-flex items-center p-1 bg-background-secondary border border-border rounded-md',
  {
    variants: {
      size: {
        sm: 'h-8',
        md: 'h-10',
        lg: 'h-12',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const segmentVariants = cva(
  'inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white',
  {
    variants: {
      active: {
        true: 'bg-accent text-white shadow-sm',
        false: 'text-content-secondary hover:text-content-primary hover:bg-gray-50 active:bg-gray-100',
      },
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-2',
        lg: 'px-4 py-2.5',
      },
    },
    defaultVariants: {
      active: false,
      size: 'md',
    },
  }
);

export interface SegmentedControlOption {
  value: string;
  label: React.ReactNode;
}

export interface SegmentedControlProps extends VariantProps<typeof segmentedControlVariants> {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  ({ options, value, onChange, size, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(segmentedControlVariants({ size }), className)}
        role="radiogroup"
        {...props}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={segmentVariants({ active: value === option.value, size })}
            onClick={() => onChange(option.value)}
            role="radio"
            aria-checked={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }
);

SegmentedControl.displayName = 'SegmentedControl';

export { SegmentedControl };