import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const cardVariants = cva(
  'bg-white border border-gray-200 text-content-primary rounded-lg',
  {
    variants: {
      variant: {
        default: 'shadow-none',         // Flat design
        subtle: 'shadow-sm',            // Subtle shadow for depth
        elevated: 'shadow-md',          // Elevated for important content
        outlined: 'shadow-none border-2', // Stronger border, no shadow
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>
>(({ className, variant, padding, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('rounded-md', cardVariants({ variant, padding }), className)}
    {...props}
  />
));

Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1 pb-0', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-h2 font-semibold text-content-primary', className)}
    {...props}
  />
));

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-body text-content-secondary', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
));

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-0', className)}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

// StatCard for dashboard metrics - minimal, content-focused
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

const StatCard = ({ title, value, icon, trend, className }: StatCardProps) => (
  <Card className={cn('p-6', className)}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-caption font-medium text-content-secondary uppercase tracking-wide">
          {title}
        </p>
        <p className="text-h2 font-semibold text-content-primary mt-1">
          {value}
        </p>
        {trend && (
          <p className="text-caption text-content-tertiary mt-1">
            {trend.label}
          </p>
        )}
      </div>
      {icon && (
        <div className="ml-4 flex-shrink-0">
          {icon}
        </div>
      )}
    </div>
  </Card>
);

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, StatCard };