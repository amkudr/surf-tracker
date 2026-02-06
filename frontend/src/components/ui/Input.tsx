import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const inputVariants = cva(
  'flex h-10 w-full bg-background px-3 py-2 text-body text-content-primary placeholder:text-content-quaternary border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-background-secondary transition-all duration-150 rounded-md',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive focus-visible:border-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn('rounded-md', inputVariants({ variant }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
