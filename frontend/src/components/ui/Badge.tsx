import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-background-secondary text-content-secondary border border-border',
        secondary: 'bg-accent/10 text-accent border border-accent/20',
        destructive: 'bg-destructive/10 text-destructive border border-destructive/20',
        success: 'bg-green-50 text-green-700 border border-green-200',
        outline: 'text-content-primary border border-border hover:bg-background-secondary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };