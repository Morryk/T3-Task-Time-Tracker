import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, TaskStatus, TimeRecord } from './types';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import DailySummary from './components/DailySummary';
import SessionNameModal from './components/SessionNameModal';
import StatusFilter from './components/StatusFilter';
import InstallPWA from './components/InstallPWA';
import { loadTasks, createTask, updateTask, deleteTask } from './utils/api';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [taskToStopId, setTaskToStopId] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Load tasks from API on mount
  useEffect(() => {
    loadTasks()
      .then(data => {
        const normalized = data.map(t => {
          const records = t.records.map(r => ({ ...r, endTime: r.endTime ?? null }));
          const last = records[records.length - 1];
          let currentTime = t.currentTime;
          if (t.status === TaskStatus.Running && last && last.endTime === null) {
            currentTime = Math.max(0, Math.round((Date.now() - last.startTime) / 1000));
          }
          return { ...t, records, currentTime };
        });
        setTasks(normalized);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load tasks:", err);
        setTasks([]);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };
  
  const handleDismissInstall = () => {
    setInstallPrompt(null);
  };

  // Timer interval for running tasks - update local state only
  // currentTime is persisted as a closed record on pause/stop; reopening a run recomputes it.
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

  const handleAddTask = async (name: string, tags: string[]) => {
    const newTask: Omit<Task, 'id'> = {
      name,
      tags,
      records: [],
      status: TaskStatus.Idle,
      currentTime: 0,
    };
    const created = await createTask(newTask);
    setTasks(prevTasks => [created, ...prevTasks]);
  };

  const handleStartTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    let updatedRecords = task.records;
    let newCurrentTime = task.currentTime;
    if (task.status === TaskStatus.Idle) {
      updatedRecords = [...task.records, { startTime: Date.now(), endTime: null }];
      newCurrentTime = 0;
    } else if (task.status === TaskStatus.Paused) {
      updatedRecords = [...task.records, { startTime: Date.now(), endTime: null }];
      newCurrentTime = 0;
    }
    setTasks(prevTasks => prevTasks.map(t =>
      t.id === id ? { ...t, status: TaskStatus.Running, currentTime: newCurrentTime, records: updatedRecords } : t
    ));
    await updateTask(id, { status: TaskStatus.Running, currentTime: newCurrentTime, records: updatedRecords });
  };

  const handlePauseTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const lastRecord = task.records[task.records.length - 1];
    let updatedRecords = task.records;
    if (lastRecord && lastRecord.endTime === null) {
      updatedRecords = [
        ...task.records.slice(0, -1),
        { ...lastRecord, endTime: Date.now(), duration: Math.round(task.currentTime) },
      ];
    }
    setTasks(prevTasks => prevTasks.map(t =>
      t.id === id ? { ...t, status: TaskStatus.Paused, currentTime: 0, records: updatedRecords } : t
    ));
    await updateTask(id, { status: TaskStatus.Paused, currentTime: 0, records: updatedRecords });
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

  const handleConfirmStopTask = async (sessionName: string) => {
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

    // Persist to server
    const task = tasks.find(t => t.id === taskToStopId);
    if (task) {
      const lastRecord = task.records[task.records.length - 1];
      let updatedRecords = task.records;
      if (lastRecord && lastRecord.endTime === null) {
        const updatedLastRecord: TimeRecord = {
          ...lastRecord,
          endTime: Date.now(),
          duration: Math.round(task.currentTime),
          ...(sessionName && { name: sessionName }),
        };
        updatedRecords = [...task.records.slice(0, -1), updatedLastRecord];
      }
      await updateTask(taskToStopId, { 
        status: TaskStatus.Idle, 
        currentTime: 0, 
        records: updatedRecords 
      });
    }
    
    handleCloseStopModal();
  };

  const handleDeleteTask = useCallback(async (id: string) => {
    const taskToDelete = tasks.find(task => task.id === id);
    if (!taskToDelete) {
      return;
    }

    if (taskToDelete.status !== TaskStatus.Idle) {
      alert("Per eliminare un task, devi prima fermarlo.");
      return;
    }

    await deleteTask(id);
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  }, [tasks]);
  
  const handleUpdateTask = async (id: string, updates: Partial<Pick<Task, 'name' | 'tags' | 'records'>>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, ...updates } : task
      )
    );
    await updateTask(id, updates);
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


  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent mx-auto"></div>
          <p className="text-text-secondary mt-4">Caricamento task...</p>
        </div>
      </div>
    );
  }

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
      {installPrompt && (
        <InstallPWA onInstall={handleInstall} onDismiss={handleDismissInstall} />
      )}
    </div>
  );
};

export default App;
