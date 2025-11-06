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
  onUpdate: (id: string, updates: Partial<Pick<Task, 'name' | 'tags' | 'records'>>) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onStart, onPause, onStop, onDelete, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Task editing state
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editedName, setEditedName] = useState(task.name);
  const [editedTags, setEditedTags] = useState(task.tags.join(', '));

  // Session record editing state
  const [editingRecordIndex, setEditingRecordIndex] = useState<number | null>(null);
  const [editedRecordName, setEditedRecordName] = useState('');

  const calculateTotalTime = (): number => {
    const completedTime = task.records
      .filter(r => r.endTime)
      .reduce((acc, r) => {
        const durationInSeconds = r.duration ?? (r.endTime! - r.startTime) / 1000;
        return acc + durationInSeconds;
      }, 0);
    
    return completedTime + task.currentTime;
  };
  
  const totalTime = calculateTotalTime();
  const isStopped = task.status === TaskStatus.Idle && task.records.length > 0 && task.records[task.records.length - 1].endTime !== null;
  const completedSessions = task.records.filter(r => r.endTime);

  const handleEditTask = () => {
    if (task.status !== TaskStatus.Idle) return;
    setEditedName(task.name);
    setEditedTags(task.tags.join(', '));
    setIsEditingTask(true);
  };

  const handleCancelEditTask = () => {
    setIsEditingTask(false);
  };

  const handleSaveTask = () => {
    if (editedName.trim()) {
      const tags = editedTags.split(',').map(tag => tag.trim()).filter(Boolean);
      onUpdate(task.id, { name: editedName.trim(), tags });
      setIsEditingTask(false);
    }
  };

  const handleEditRecord = (index: number, currentName: string | undefined) => {
    setEditingRecordIndex(index);
    setEditedRecordName(currentName || '');
  };

  const handleCancelEditRecord = () => {
    setEditingRecordIndex(null);
    setEditedRecordName('');
  };

  const handleSaveRecord = (indexToSave: number) => {
    const updatedRecords = task.records.map((record, index) => {
      if (index === indexToSave) {
        return { ...record, name: editedRecordName.trim() };
      }
      return record;
    });
    onUpdate(task.id, { records: updatedRecords });
    setEditingRecordIndex(null);
    setEditedRecordName('');
  };

  return (
    <div className="bg-base-200 rounded-lg shadow-md transition-all hover:bg-base-300/80">
      <div 
        className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div 
          className="flex-1 text-center sm:text-left flex items-start gap-3 w-full"
        >
           <div 
             className="mt-1 cursor-pointer"
             onClick={() => completedSessions.length > 0 && setIsOpen(!isOpen)}
           >
            {completedSessions.length > 0 ? (
              <Icon 
                name="chevron-down" 
                className={`w-5 h-5 text-text-secondary transition-transform transform ${isOpen ? 'rotate-180' : ''}`} 
              />
            ) : <div className="w-5 h-5" />}
           </div>
          <div className="flex-1">
            {isEditingTask ? (
               <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-base-100 border border-base-300 rounded-md px-3 py-1 text-lg font-semibold w-full focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  aria-label="Modifica nome task"
                  autoFocus
                />
                <input
                  type="text"
                  value={editedTags}
                  onChange={(e) => setEditedTags(e.target.value)}
                  className="bg-base-100 border border-base-300 rounded-md px-3 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  aria-label="Modifica tag task"
                  placeholder="Aggiungi tag, separati da virgola"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-lg text-text-primary">{task.name}</p>
                   <button
                      onClick={handleEditTask}
                      className="p-1 rounded-full text-text-secondary hover:bg-base-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Modifica Task"
                      disabled={task.status !== TaskStatus.Idle}
                    >
                      <Icon name="pencil" className="w-4 h-4" />
                    </button>
                </div>
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
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isEditingTask ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveTask}
                className="p-2 rounded-full bg-base-300 hover:bg-green-500 text-green-400 hover:text-white transition-colors"
                title="Salva"
              >
                <Icon name="check" className="w-5 h-5" />
              </button>
              <button
                onClick={handleCancelEditTask}
                className="p-2 rounded-full bg-base-300 hover:bg-red-500 text-red-400 hover:text-white transition-colors"
                title="Annulla"
              >
                <Icon name="x-mark" className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
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
                    title="Pausa"
                  >
                    <Icon name="pause" className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onStart(task.id); }}
                    className="p-2 rounded-full bg-base-300 hover:bg-green-500 text-green-400 hover:text-white transition-colors"
                    title="Avvia"
                  >
                    <Icon name="play" className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); onStop(task.id); }}
                  disabled={task.status === TaskStatus.Idle}
                  className="p-2 rounded-full bg-base-300 hover:bg-red-500 text-red-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Ferma"
                >
                  <Icon name="stop" className="w-5 h-5" />
                </button>
              </div>
              <button
                  onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                  className="p-2 rounded-full bg-base-300 hover:bg-gray-500 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Elimina"
                  disabled={task.status !== TaskStatus.Idle}
              >
                  <Icon name="trash" className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
      {isOpen && completedSessions.length > 0 && (
        <div className="border-t border-base-300 px-4 py-3 bg-base-100/50">
           <div className="grid grid-cols-4 gap-4 text-xs font-bold text-text-secondary mb-2 px-2">
                <span>SESSIONE</span>
                <span className="text-center">INIZIO</span>
                <span className="text-center">FINE</span>
                <span className="text-right">DURATA</span>
            </div>
          <ul className="space-y-1">
            {completedSessions.slice().reverse().map((record, index) => {
              const isEditingRecord = editingRecordIndex === index;
              const recordDuration = record.duration ?? (record.endTime! - record.startTime) / 1000;
              return (
                <li key={index} className="grid grid-cols-4 gap-4 items-center text-sm text-text-primary bg-base-200/50 p-2 rounded">
                  <div>
                    {isEditingRecord ? (
                       <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editedRecordName}
                          onChange={(e) => setEditedRecordName(e.target.value)}
                          className="bg-base-100 border border-base-300 rounded-md px-2 py-0.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-brand-primary"
                          aria-label="Modifica Nome Sessione"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRecord(index);
                            if (e.key === 'Escape') handleCancelEditRecord();
                          }}
                        />
                         <button onClick={() => handleSaveRecord(index)} className="p-1 rounded text-green-400 hover:bg-base-300"><Icon name="check" className="w-4 h-4" /></button>
                         <button onClick={handleCancelEditRecord} className="p-1 rounded text-red-400 hover:bg-base-300"><Icon name="x-mark" className="w-4 h-4" /></button>
                       </div>
                    ): (
                      <>
                        <div className="flex items-center gap-1.5 group">
                          <div className="flex flex-col">
                            {record.name && <span className="font-semibold text-sm text-text-primary block">{record.name}</span>}
                            <span className={`text-xs ${record.name ? 'text-text-secondary' : 'text-text-primary'}`}>{formatDate(record.startTime)}</span>
                          </div>
                          <button onClick={() => handleEditRecord(index, record.name)} className="p-1 rounded text-text-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-base-300 hover:text-white transition-opacity">
                            <Icon name="pencil" className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <span className="text-center">{formatTimeOfDay(record.startTime)}</span>
                  <span className="text-center">{formatTimeOfDay(record.endTime!)}</span>
                  <span className="font-mono text-right">{formatTime(recordDuration)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
