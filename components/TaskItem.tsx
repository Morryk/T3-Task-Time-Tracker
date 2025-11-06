import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { formatTime, formatDate, formatTimeOfDay } from '../utils/time';
import { Icon } from './Icons';

interface TaskItemProps {
  task: Task;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onStart, onPause, onStop, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  const calculateTotalTime = (): number => {
    const completedTime = task.records
      .filter(r => r.endTime)
      .reduce((acc, r) => acc + (r.endTime! - r.startTime), 0);
    
    return (completedTime / 1000) + task.currentTime;
  };
  
  const totalTime = calculateTotalTime();
  const isStopped = task.status === TaskStatus.Idle && task.records.length > 0 && task.records[task.records.length - 1].endTime !== null;
  const completedSessions = task.records.filter(r => r.endTime);

  return (
    <div className="bg-base-200 rounded-lg shadow-md transition-all hover:bg-base-300/80">
      <div 
        className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div 
          className="flex-1 text-center sm:text-left flex items-start gap-3 w-full cursor-pointer"
          onClick={() => completedSessions.length > 0 && setIsOpen(!isOpen)}
        >
           {completedSessions.length > 0 ? (
            <Icon 
              name="chevron-down" 
              className={`w-5 h-5 text-text-secondary transition-transform transform mt-1 ${isOpen ? 'rotate-180' : ''}`} 
            />
          ) : <div className="w-5 h-5" />}
          <div className="flex-1">
            <p className="font-semibold text-lg text-text-primary">{task.name}</p>
            {(completedSessions.length > 0 || (task.tags && task.tags.length > 0)) && (
              <div className="flex flex-wrap gap-2 items-center mt-1">
                {completedSessions.length > 0 && (
                  <span className="text-xs bg-base-300 text-text-secondary font-semibold px-2 py-0.5 rounded-full">
                    {completedSessions.length} {completedSessions.length === 1 ? 'Sessione' : 'Sessioni'}
                  </span>
                )}
                {task.tags && task.tags.length > 0 && (
                  task.tags.map(tag => (
                    <span key={tag} className="text-xs bg-brand-secondary/50 text-brand-primary font-semibold px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right w-36">
              <div className={`font-mono text-2xl ${task.status === TaskStatus.Running ? 'text-brand-primary' : 'text-text-primary'}`}>
              {formatTime(totalTime)}
              </div>
              {task.status === TaskStatus.Paused && (
                  <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">In Pausa</span>
              )}
              {isStopped && (
                  <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Fermato</span>
              )}
          </div>
          <div className="flex items-center gap-2">
            {task.status === TaskStatus.Running ? (
              <button
                onClick={(e) => { e.stopPropagation(); onPause(task.id); }}
                className="p-2 rounded-full bg-base-300 hover:bg-yellow-500 text-yellow-400 hover:text-white transition-colors"
                title="Pause"
              >
                <Icon name="pause" className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onStart(task.id); }}
                className="p-2 rounded-full bg-base-300 hover:bg-green-500 text-green-400 hover:text-white transition-colors"
                title="Start"
              >
                <Icon name="play" className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onStop(task.id); }}
              disabled={task.status === TaskStatus.Idle}
              className="p-2 rounded-full bg-base-300 hover:bg-red-500 text-red-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Stop"
            >
              <Icon name="stop" className="w-5 h-5" />
            </button>
          </div>
           <button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="p-2 rounded-full bg-base-300 hover:bg-gray-500 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete"
              disabled={task.status !== TaskStatus.Idle}
          >
              <Icon name="trash" className="w-5 h-5" />
          </button>
        </div>
      </div>
      {isOpen && completedSessions.length > 0 && (
        <div className="border-t border-base-300 px-4 py-3 bg-base-100/50">
           <div className="grid grid-cols-4 gap-4 text-xs font-bold text-text-secondary mb-2 px-2">
                <span>DATA</span>
                <span className="text-center">INIZIO</span>
                <span className="text-center">FINE</span>
                <span className="text-right">DURATA</span>
            </div>
          <ul className="space-y-1">
            {completedSessions.map((record, index) => (
              <li key={index} className="grid grid-cols-4 gap-4 items-center text-sm text-text-primary bg-base-200/50 p-2 rounded">
                <div>
                  {record.name && <span className="font-semibold text-sm text-text-primary block">{record.name}</span>}
                  <span className={`text-xs ${record.name ? 'text-text-secondary' : 'text-text-primary'}`}>{formatDate(record.startTime)}</span>
                </div>
                <span className="text-center">{formatTimeOfDay(record.startTime)}</span>
                <span className="text-center">{formatTimeOfDay(record.endTime!)}</span>
                <span className="font-mono text-right">{formatTime((record.endTime! - record.startTime) / 1000)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TaskItem;