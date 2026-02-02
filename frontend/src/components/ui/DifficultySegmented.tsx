import React from 'react';
import { SegmentedControl, SegmentedControlOption } from './SegmentedControl';
import { DIFFICULTY_LEVELS, DifficultyLevel, normalizeDifficulty } from '../../utils/difficulty';

export interface DifficultySegmentedProps {
  value: number;
  onChange: (value: DifficultyLevel) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DifficultySegmented = React.forwardRef<HTMLDivElement, DifficultySegmentedProps>(
  ({ value, onChange, className, size = 'md', ...props }, ref) => {
    const normalizedValue = normalizeDifficulty(value);

    const options: SegmentedControlOption[] = DIFFICULTY_LEVELS.map(level => ({
      value: level.value.toString(),
      label: level.label,
    }));

    const handleChange = (selectedValue: string) => {
      const numericValue = parseInt(selectedValue, 10) as DifficultyLevel;
      onChange(numericValue);
    };

    return (
      <SegmentedControl
        ref={ref}
        options={options}
        value={normalizedValue.toString()}
        onChange={handleChange}
        className={className}
        size={size}
        {...props}
      />
    );
  }
);

DifficultySegmented.displayName = 'DifficultySegmented';

export { DifficultySegmented };