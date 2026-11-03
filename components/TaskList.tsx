
import React from 'react';
import { Task } from '../types';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Pick<Task, 'name' | 'tags' | 'records'>>) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onStart, onPause, onStop, onDelete, onUpdate }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-base-200 rounded-lg">
        <h3 className="text-xl font-semibold text-text-secondary">Nessun task ancora.</h3>
        <p className="text-text-secondary mt-2">Aggiungi un nuovo task qui sopra per iniziare a tracciare il tuo tempo!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onStart={onStart}
          onPause={onPause}
          onStop={onStop}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
};

export default TaskList;
