import React from 'react';
import { formatTime, formatDisplayDate } from '../utils/time';
import { Icon } from './Icons';

interface DailySummaryProps {
  summaries: { date: string; totalTime: number }[];
}

const DailySummary: React.FC<DailySummaryProps> = ({ summaries }) => {
  if (summaries.length === 0) {
    return (
      <div className="bg-base-200 p-4 rounded-lg shadow mb-8 text-center">
        <p className="text-text-secondary text-sm">Traccia il tuo primo task per vedere qui i riepiloghi giornalieri.</p>
      </div>
    );
  }

  return (
    <div className="bg-base-200 rounded-lg shadow mb-8">
      <details open className="group">
        <summary className="p-4 flex justify-between items-center cursor-pointer list-none">
          <h2 className="text-lg font-semibold text-text-primary">Riepiloghi Giornalieri</h2>
          <Icon name="chevron-down" className="w-5 h-5 text-text-secondary transition-transform transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-base-300 px-4 pb-4 pt-2">
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {summaries.map(({ date, totalTime }) => (
              <li key={date} className="flex justify-between items-baseline bg-base-100/50 p-3 rounded-md">
                <span className="font-medium text-text-primary">{formatDisplayDate(date)}</span>
                <span className="font-mono text-xl font-bold text-brand-primary">
                  {formatTime(totalTime)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
};

export default DailySummary;
