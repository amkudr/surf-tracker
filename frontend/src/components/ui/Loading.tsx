import React from 'react';
import { cn } from '../../utils/cn';

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, size = 'md', text, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
    };

    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center', className)}
        {...props}
      >
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-border border-t-accent',
            sizeClasses[size]
          )}
        />
        {text && (
          <p className="text-body text-content-secondary mt-2">{text}</p>
        )}
      </div>
    );
  }
);

Loading.displayName = 'Loading';

export { Loading };