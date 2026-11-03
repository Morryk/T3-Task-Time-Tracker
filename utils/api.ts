import { Task} from '../types';

const API = '/api/tasks';

async function handleResponse(res: Response) {
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error: ${res.status} ${err}`);
  }
  return res.json();
}

export async function loadTasks(): Promise<Task[]> {
  const res = await fetch(API);
  return handleResponse(res);
}

export async function createTask(task: Omit<Task, 'id'>): Promise<Task> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  return handleResponse(res);
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error: ${res.status} ${err}`);
  }
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error: ${res.status} ${err}`);
  }
}
