import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, TaskStatus, TimeRecord } from './types';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import DailySummary from './components/DailySummary';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const savedTasks = localStorage.getItem('tasks');
      return savedTasks ? JSON.parse(savedTasks) : [];
    } catch (error) {
      console.error("Could not load tasks from localStorage", error);
      return [];
    }
  });
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error("Could not save tasks to localStorage", error);
    }
  }, [tasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.status === TaskStatus.Running) {
            return { ...task, currentTime: task.currentTime + 1 };
          }
          return task;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const dailySummaries = useMemo(() => {
    const totalsByDay: Record<string, number> = {}; // key: 'YYYY-MM-DD', value: milliseconds

    tasks.forEach(task => {
      task.records.forEach(record => {
        if (!record.startTime) return;

        let cursor = record.startTime;
        const endTime = record.endTime ?? Date.now();

        while (cursor < endTime) {
          const startOfCursorDay = new Date(cursor);
          startOfCursorDay.setUTCHours(0, 0, 0, 0);
          const dayString = startOfCursorDay.toISOString().split('T')[0];

          const endOfCursorDay = new Date(startOfCursorDay);
          endOfCursorDay.setUTCDate(startOfCursorDay.getUTCDate() + 1);
          
          const segmentEnd = Math.min(endTime, endOfCursorDay.getTime());
          const durationInMs = segmentEnd - cursor;

          totalsByDay[dayString] = (totalsByDay[dayString] || 0) + durationInMs;
          
          cursor = endOfCursorDay.getTime();
        }
      });
    });

    return Object.entries(totalsByDay)
      .map(([date, totalTimeInMs]) => ({ date, totalTime: totalTimeInMs / 1000 }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tasks]);

  const handleAddTask = (name: string, tags: string[]) => {
    const newTask: Task = {
      id: Date.now().toString(),
      name,
      tags,
      records: [],
      status: TaskStatus.Idle,
      currentTime: 0,
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const handleStartTask = (id: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === id && task.status !== TaskStatus.Running) {
          // If the task was stopped (Idle), create a new time record.
          if (task.status === TaskStatus.Idle) {
            const newRecord: TimeRecord = { startTime: Date.now(), endTime: null };
            return { ...task, status: TaskStatus.Running, records: [...task.records, newRecord] };
          }
          // If the task was paused, just change its status to running.
          if (task.status === TaskStatus.Paused) {
            return { ...task, status: TaskStatus.Running };
          }
        }
        return task;
      })
    );
  };

  const handlePauseTask = (id: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, status: TaskStatus.Paused } : task
      )
    );
  };
  
  const handleStopTask = (id: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === id && task.status !== TaskStatus.Idle) {
          const lastRecord = task.records[task.records.length - 1];
          let updatedRecords = task.records;

          if (lastRecord && lastRecord.endTime === null) {
            const sessionName = window.prompt("Add a name for this session (optional):");
            const updatedLastRecord = { 
              ...lastRecord, 
              endTime: Date.now(),
              ...(sessionName && { name: sessionName.trim() })
            };
            updatedRecords = [
              ...task.records.slice(0, -1),
              updatedLastRecord,
            ];
          }
          return { ...task, status: TaskStatus.Idle, currentTime: 0, records: updatedRecords };
        }
        return task;
      })
    );
  };

  const handleDeleteTask = useCallback((id: string) => {
    setTasks(prevTasks => {
      const taskToDelete = prevTasks.find(task => task.id === id);
      if (!taskToDelete) {
        return prevTasks;
      }

      if (taskToDelete.status !== TaskStatus.Idle) {
        alert("Per eliminare un task, devi prima fermarlo.");
        return prevTasks;
      }

      return prevTasks.filter(task => task.id !== id);
    });
  }, []);

  const filteredTasks = useMemo(() => {
    const lowerCaseQuery = filterQuery.toLowerCase();
    if (!lowerCaseQuery) {
      return tasks;
    }
    return tasks.filter(task => {
      const nameMatch = task.name.toLowerCase().includes(lowerCaseQuery);
      const tagMatch = task.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery));
      return nameMatch || tagMatch;
    });
  }, [tasks, filterQuery]);


  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-teal-300">
            Task Time Tracker
          </h1>
          <p className="text-text-secondary mt-2">Focus on what matters. We'll handle the time.</p>
        </header>

        <main>
          <DailySummary summaries={dailySummaries} />
          <TaskInput onAddTask={handleAddTask} />
          
          <div className="mb-4">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter by task name or tag..."
              className="w-full bg-base-200 border border-base-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow"
              aria-label="Filter tasks"
            />
          </div>

          <TaskList
            tasks={filteredTasks}
            onStart={handleStartTask}
            onPause={handlePauseTask}
            onStop={handleStopTask}
            onDelete={handleDeleteTask}
          />
        </main>
      </div>
    </div>
  );
};

export default App;