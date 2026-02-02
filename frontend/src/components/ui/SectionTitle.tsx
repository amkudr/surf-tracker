import React from 'react';
import { cn } from '../../utils/cn';

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

const SectionTitle = React.forwardRef<
  HTMLHeadingElement,
  SectionTitleProps
>(({ children, className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-semibold text-content-primary mb-4', className)}
    {...props}
  >
    {children}
  </h3>
));

SectionTitle.displayName = 'SectionTitle';

export { SectionTitle };