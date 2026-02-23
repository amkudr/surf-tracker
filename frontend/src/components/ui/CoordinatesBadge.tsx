import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Navigation } from 'lucide-react';

const coordinatesBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-medium border transition-colors bg-content-secondary/20 text-content-secondary border-content-secondary/30',
  {
    variants: {
      size: {
        sm: 'px-2 py-0.5 text-xs gap-1',
        md: 'px-2.5 py-1 text-caption gap-1.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface CoordinatesBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof coordinatesBadgeVariants> {
  latitude?: number;
  longitude?: number;
  showIcon?: boolean;
  precision?: number;
}

const CoordinatesBadge = React.forwardRef<HTMLDivElement, CoordinatesBadgeProps>(
  ({
    className,
    size = 'md',
    latitude,
    longitude,
    showIcon = true,
    precision = 4,
    ...props
  }, ref) => {
    const hasCoords = latitude != null && longitude != null;
    const formatCoordinate = (coord: number) => coord.toFixed(precision);

    return (
      <div
        ref={ref}
        className={cn(coordinatesBadgeVariants({ size }), className)}
        {...props}
      >
        {showIcon && <Navigation className="h-3 w-3" />}
        <span>
          {hasCoords
            ? `${formatCoordinate(latitude as number)}, ${formatCoordinate(longitude as number)}`
            : 'No coords'}
        </span>
      </div>
    );
  }
);

CoordinatesBadge.displayName = 'CoordinatesBadge';

export { CoordinatesBadge, coordinatesBadgeVariants };
