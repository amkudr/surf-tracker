import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-md',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-accent-hover active:bg-accent-active focus-visible:ring-accent focus-visible:ring-offset-white disabled:bg-accent-disabled shadow-sm hover:shadow-md active:shadow-sm',
        secondary: 'bg-white text-content-primary border border-border hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-accent focus-visible:ring-offset-white shadow-sm hover:shadow-md active:shadow-sm',
        ghost: 'text-content-secondary hover:text-content-primary hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-accent focus-visible:ring-offset-white',
        destructive: 'text-destructive hover:text-destructive-hover active:text-destructive-active focus-visible:ring-destructive focus-visible:ring-offset-white',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5', // Small buttons
        md: 'h-10 px-4 text-sm gap-2',   // Standard buttons
        lg: 'h-12 px-6 text-base gap-2', // Large buttons
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };