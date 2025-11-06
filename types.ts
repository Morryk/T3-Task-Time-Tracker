export enum TaskStatus {
  Idle,
  Running,
  Paused,
}

export interface TimeRecord {
  startTime: number;
  endTime: number | null;
  name?: string;
}

export interface Task {
  id: string;
  name: string;
  tags: string[];
  records: TimeRecord[];
  status: TaskStatus;
  currentTime: number; // in seconds
}