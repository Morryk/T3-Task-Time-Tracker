import React from 'react';
import { TaskStatus } from '../types';

type FilterType = TaskStatus | 'All';

interface StatusFilterProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const filters: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'All' },
  { label: 'Running', value: TaskStatus.Running },
  { label: 'Paused', value: TaskStatus.Paused },
  { label: 'Stopped', value: TaskStatus.Idle },
];

const StatusFilter: React.FC<StatusFilterProps> = ({ currentFilter, onFilterChange }) => {
  return (
    <div className="flex-shrink-0 flex items-center justify-center sm:justify-start gap-2 bg-base-100 p-1 rounded-md">
      {filters.map(({ label, value }) => {
        const isActive = currentFilter === value;
        return (
          <button
            key={label}
            onClick={() => onFilterChange(value)}
            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 focus:ring-brand-primary ${
              isActive
                ? 'bg-brand-primary text-white shadow'
                : 'bg-transparent text-text-secondary hover:bg-base-300/50 hover:text-text-primary'
            }`}
            aria-pressed={isActive}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default StatusFilter;
