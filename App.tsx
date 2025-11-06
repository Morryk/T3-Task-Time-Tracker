import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, TaskStatus, TimeRecord } from './types';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import DailySummary from './components/DailySummary';
import SessionNameModal from './components/SessionNameModal';
import StatusFilter from './components/StatusFilter';

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
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [taskToStopId, setTaskToStopId] = useState<string | null>(null);

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
        if (!record.startTime || !record.endTime) return;

        // Use stored duration if available, otherwise calculate from start/end
        const recordDurationMs = (record.duration !== undefined) 
          ? record.duration * 1000
          : record.endTime - record.startTime;
        
        const startOfCursorDay = new Date(record.startTime);
        startOfCursorDay.setUTCHours(0, 0, 0, 0);
        const dayString = startOfCursorDay.toISOString().split('T')[0];
        totalsByDay[dayString] = (totalsByDay[dayString] || 0) + recordDurationMs;
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
    const task = tasks.find(t => t.id === id);
    if (task && task.status !== TaskStatus.Idle) {
        setTaskToStopId(id);
        setIsStopModalOpen(true);
    }
  };

  const handleCloseStopModal = () => {
    setIsStopModalOpen(false);
    setTaskToStopId(null);
  };

  const handleConfirmStopTask = (sessionName: string) => {
    if (!taskToStopId) return;

    setTasks(prevTasks =>
        prevTasks.map(task => {
            if (task.id === taskToStopId) {
                const lastRecord = task.records[task.records.length - 1];
                let updatedRecords = task.records;

                if (lastRecord && lastRecord.endTime === null) {
                    const updatedLastRecord: TimeRecord = {
                        ...lastRecord,
                        endTime: Date.now(),
                        duration: Math.round(task.currentTime), // Save the accurate duration in seconds
                        ...(sessionName && { name: sessionName }),
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
    
    handleCloseStopModal();
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
  
  const handleUpdateTask = (id: string, updates: Partial<Pick<Task, 'name' | 'tags' | 'records'>>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, ...updates } : task
      )
    );
  };

  const filteredTasks = useMemo(() => {
    const lowerCaseQuery = filterQuery.toLowerCase();
    
    return tasks.filter(task => {
      // Status filter first for potentially better performance
      const statusMatch = statusFilter === 'All' || task.status === statusFilter;
      if (!statusMatch) return false;

      // Then, text filter
      if (!lowerCaseQuery) return true; // No text query, so it passes
      
      const nameMatch = task.name.toLowerCase().includes(lowerCaseQuery);
      const tagMatch = task.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery));
      return nameMatch || tagMatch;
    });
  }, [tasks, filterQuery, statusFilter]);


  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-teal-300">
            Task Time Tracker
          </h1>
          <p className="text-text-secondary mt-2">Concentrati su ciò che conta. Al tempo pensiamo noi.</p>
        </header>

        <main>
          <DailySummary summaries={dailySummaries} />
          <TaskInput onAddTask={handleAddTask} />
          
          <div className="mb-4 bg-base-200 p-3 rounded-lg flex flex-col sm:flex-row gap-3 items-center shadow">
            <div className="relative w-full sm:flex-grow">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filtra per nome o tag..."
                className="w-full bg-base-100 border border-base-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow"
                aria-label="Filtra tasks per nome o tag"
              />
            </div>
            <StatusFilter
                currentFilter={statusFilter}
                onFilterChange={setStatusFilter}
            />
          </div>

          <TaskList
            tasks={filteredTasks}
            onStart={handleStartTask}
            onPause={handlePauseTask}
            onStop={handleStopTask}
            onDelete={handleDeleteTask}
            onUpdate={handleUpdateTask}
          />
        </main>
      </div>
      <SessionNameModal
        isOpen={isStopModalOpen}
        onClose={handleCloseStopModal}
        onSubmit={handleConfirmStopTask}
      />
    </div>
  );
};

export default App;
