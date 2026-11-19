import type { Priority, Task, TaskType } from '../types/task';
import { offsetDateISO } from './date';

export const STORAGE_KEY = 'taskmate_tasks_v1';

export function generateTaskId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const VALID_TYPES: ReadonlySet<string> = new Set<TaskType>([
  'homework',
  'assignment',
  'exam/deadline',
]);

const VALID_PRIORITIES: ReadonlySet<string> = new Set<Priority>(['high', 'medium', 'low']);

function isValidTask(candidate: unknown): candidate is Task {
  if (typeof candidate !== 'object' || candidate === null) return false;
  const obj = candidate as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.subject === 'string' &&
    typeof obj.type === 'string' &&
    VALID_TYPES.has(obj.type) &&
    typeof obj.dueDate === 'string' &&
    typeof obj.priority === 'string' &&
    VALID_PRIORITIES.has(obj.priority) &&
    typeof obj.completed === 'boolean' &&
    typeof obj.createdAt === 'number'
  );
}

export function createStarterTasks(): Task[] {
  const now = Date.now();
  return [
    {
      id: generateTaskId(),
      title: 'Submit Lab Report #3: Titration Analysis',
      subject: 'Chemistry 101',
      type: 'assignment',
      dueDate: offsetDateISO(-1),
      priority: 'high',
      completed: false,
      createdAt: now - 4000,
    },
    {
      id: generateTaskId(),
      title: 'Linear Algebra Problem Set 6',
      subject: 'MATH 204',
      type: 'homework',
      dueDate: offsetDateISO(1),
      priority: 'medium',
      completed: false,
      createdAt: now - 3000,
    },
    {
      id: generateTaskId(),
      title: 'Macroeconomics Essay Outline',
      subject: 'ECON 102',
      type: 'assignment',
      dueDate: offsetDateISO(2),
      priority: 'medium',
      completed: false,
      createdAt: now - 2000,
    },
    {
      id: generateTaskId(),
      title: 'Midterm Exam Review Sheet',
      subject: 'World History',
      type: 'exam/deadline',
      dueDate: offsetDateISO(5),
      priority: 'high',
      completed: false,
      createdAt: now - 1000,
    },
    {
      id: generateTaskId(),
      title: 'Chapters 1–3 Reading & Quiz',
      subject: 'PSYC 101',
      type: 'homework',
      dueDate: offsetDateISO(-2),
      priority: 'low',
      completed: true,
      completedAt: now - 500,
      createdAt: now - 5000,
    },
  ];
}

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const starter = createStarterTasks();
      saveTasks(starter);
      return starter;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidTask);
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Storage quota exceeded or unavailable; fail silently without crashing UI
  }
}
