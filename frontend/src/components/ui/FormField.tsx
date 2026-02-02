import React from 'react';
import { cn } from '../../utils/cn';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const FormField = ({
  label,
  error,
  required,
  hint,
  icon,
  children,
  className
}: FormFieldProps) => {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="flex items-center space-x-2 text-body font-medium text-content-primary">
        {icon}
        <span>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </span>
      </label>

      {children}

      {hint && !error && (
        <p className="text-caption text-content-tertiary">{hint}</p>
      )}

      {error && (
        <p className="text-caption text-destructive">{error}</p>
      )}
    </div>
  );
};

export { FormField };