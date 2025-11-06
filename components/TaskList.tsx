
import React from 'react';
import { Task } from '../types';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onStart, onPause, onStop, onDelete }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-base-200 rounded-lg">
        <h3 className="text-xl font-semibold text-text-secondary">No tasks yet.</h3>
        <p className="text-text-secondary mt-2">Add a new task above to start tracking your time!</p>
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
        />
      ))}
    </div>
  );
};

export default TaskList;
