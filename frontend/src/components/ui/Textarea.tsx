import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const textareaVariants = cva(
  'flex min-h-[80px] w-full bg-background px-3 py-2 text-body text-content-primary placeholder:text-content-quaternary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-background-secondary transition-colors resize-none',
  {
    variants: {
      variant: {
        default: 'border border-border focus-visible:ring-accent',
        error: 'border border-destructive focus-visible:ring-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <textarea
        className={cn('rounded-md', textareaVariants({ variant }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
