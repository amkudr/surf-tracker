import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('text-center py-16', className)}>
      {icon && (
        <div className="mx-auto h-16 w-16 text-content-quaternary mb-6">
          {icon}
        </div>
      )}
      <h3 className="text-h2 font-semibold text-content-primary mb-2">
        {title}
      </h3>
      <p className="text-body text-content-secondary mb-8 max-w-md mx-auto">
        {description}
      </p>
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

export { EmptyState };