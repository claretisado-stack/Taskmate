import type { DeadlineStatus, Task } from '../types/task';

/**
 * Parse a YYYY-MM-DD string in local calendar time so UTC offsets never shift the day.
 */
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return getTodayLocal();
  }
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

export function formatLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function offsetDateISO(daysFromToday: number): string {
  const d = getTodayLocal();
  d.setDate(d.getDate() + daysFromToday);
  return formatLocalISO(d);
}

export function getDaysDiff(dateStr: string): number {
  const due = parseLocalDate(dateStr);
  const today = getTodayLocal();
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatReadableDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDeadlineStatus(task: Pick<Task, 'completed' | 'dueDate'>): DeadlineStatus {
  if (task.completed) return 'completed';
  const diff = getDaysDiff(task.dueDate);
  if (diff < 0) return 'overdue';
  if (diff <= 2) return 'upcoming';
  return 'normal';
}

export function getUrgencyLabel(task: Pick<Task, 'completed' | 'dueDate'>): string {
  if (task.completed) return 'Completed';
  const diff = getDaysDiff(task.dueDate);
  if (diff < 0) {
    const daysLate = Math.abs(diff);
    return daysLate === 1 ? 'Overdue · 1d late' : `Overdue · ${daysLate}d late`;
  }
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff === 2) return 'Due in 2d';
  return `In ${diff}d`;
}
