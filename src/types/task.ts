export type TaskType = 'homework' | 'assignment' | 'exam/deadline';

export type Priority = 'high' | 'medium' | 'low';

export type StatusFilter = 'all' | 'active' | 'due-soon' | 'overdue' | 'completed';

export type SortOption = 'due-asc' | 'due-desc' | 'priority' | 'subject';

export type DeadlineStatus = 'completed' | 'overdue' | 'upcoming' | 'normal';

export interface Task {
  id: string;
  title: string;
  subject: string;
  type: TaskType;
  dueDate: string; // YYYY-MM-DD in local calendar time
  priority: Priority;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
}
