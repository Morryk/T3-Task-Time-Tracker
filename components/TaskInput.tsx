import React, { useState } from 'react';

interface TaskInputProps {
  onAddTask: (name: string, tags: string[]) => void;
}

const TaskInput: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [taskName, setTaskName] = useState('');
  const [taskTags, setTaskTags] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim()) {
      const tags = taskTags.split(',').map(tag => tag.trim()).filter(Boolean);
      onAddTask(taskName.trim(), tags);
      setTaskName('');
      setTaskTags('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 bg-base-200 p-4 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="What are you working on?"
          className="flex-grow bg-base-100 border border-base-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow"
          aria-label="Task name"
        />
         <input
          type="text"
          value={taskTags}
          onChange={(e) => setTaskTags(e.target.value)}
          placeholder="Add tags, comma separated"
          className="flex-grow bg-base-100 border border-base-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow"
          aria-label="Task tags"
        />
        <button
          type="submit"
          className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!taskName.trim()}
        >
          Add Task
        </button>
      </div>
    </form>
  );
};

export default TaskInput;
