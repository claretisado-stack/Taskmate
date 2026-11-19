import { AlertCircle, Check, CheckCircle2, Clock, Pencil, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { Priority, Task, TaskType } from '../types/task';
import { formatReadableDate, getDeadlineStatus, getUrgencyLabel } from '../utils/date';

interface TaskRowProps {
  task: Task;
  existingSubjects: string[];
  onToggleComplete: (id: string) => void;
  onUpdateTask: (id: string, updates: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt'>) => void;
  onDeleteTask: (id: string) => void;
}

const TYPE_LABELS: Record<TaskType, string> = {
  homework: 'Homework',
  assignment: 'Assignment',
  'exam/deadline': 'Exam / Deadline',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'High priority',
  medium: 'Medium priority',
  low: 'Low priority',
};

export function TaskRow({
  task,
  existingSubjects,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
}: TaskRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editSubject, setEditSubject] = useState(task.subject);
  const [editType, setEditType] = useState<TaskType>(task.type);
  const [editDueDate, setEditDueDate] = useState(task.dueDate);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);

  const deadlineStatus = getDeadlineStatus(task);
  const urgencyLabel = getUrgencyLabel(task);

  const startEditing = () => {
    setEditTitle(task.title);
    setEditSubject(task.subject);
    setEditType(task.type);
    setEditDueDate(task.dueDate);
    setEditPriority(task.priority);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: FormEvent) => {
    e.preventDefault();
    const cleanTitle = editTitle.trim();
    const cleanSubject = editSubject.trim();
    if (!cleanTitle || !cleanSubject || !editDueDate) return;

    onUpdateTask(task.id, {
      title: cleanTitle,
      subject: cleanSubject,
      type: editType,
      dueDate: editDueDate,
      priority: editPriority,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <li className="border-b border-slate-200 last:border-b-0 bg-slate-50/70 px-5 py-4">
        <form onSubmit={handleSaveEdit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-2 lg:col-span-4 flex flex-col gap-1">
            <label htmlFor={`edit-title-${task.id}`} className="text-xs font-medium text-slate-600">
              Title
            </label>
            <input
              id={`edit-title-${task.id}`}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              maxLength={140}
              className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            />
          </div>

          <div className="lg:col-span-2 flex flex-col gap-1">
            <label htmlFor={`edit-subject-${task.id}`} className="text-xs font-medium text-slate-600">
              Subject
            </label>
            <input
              id={`edit-subject-${task.id}`}
              type="text"
              list={`edit-subjects-${task.id}`}
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
              required
              maxLength={60}
              className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            />
            <datalist id={`edit-subjects-${task.id}`}>
              {existingSubjects.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-1">
            <label htmlFor={`edit-type-${task.id}`} className="text-xs font-medium text-slate-600">
              Type
            </label>
            <select
              id={`edit-type-${task.id}`}
              value={editType}
              onChange={(e) => setEditType(e.target.value as TaskType)}
              className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            >
              <option value="homework">Homework</option>
              <option value="assignment">Assignment</option>
              <option value="exam/deadline">Exam / Deadline</option>
            </select>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-1">
            <label htmlFor={`edit-due-${task.id}`} className="text-xs font-medium text-slate-600">
              Due Date
            </label>
            <input
              id={`edit-due-${task.id}`}
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              required
              className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            />
          </div>

          <div className="lg:col-span-2 flex items-center gap-2 justify-end">
            <select
              aria-label="Edit priority"
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as Priority)}
              className="h-9 px-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              type="submit"
              aria-label="Save changes"
              className="h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              aria-label="Cancel editing"
              className="h-9 w-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 inline-flex items-center justify-center shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      </li>
    );
  }

  const rowSurfaceClass =
    deadlineStatus === 'overdue'
      ? 'bg-red-50/45 hover:bg-red-50/75'
      : deadlineStatus === 'upcoming'
      ? 'bg-amber-50/40 hover:bg-amber-50/70'
      : deadlineStatus === 'completed'
      ? 'bg-slate-50/40 hover:bg-slate-50/80'
      : 'bg-white hover:bg-slate-50/70';

  return (
    <li
      className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 last:border-b-0 transition-colors duration-150 ${rowSurfaceClass}`}
    >
      {/* Left: Checkbox + Title + Unboxed Metadata */}
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        <button
          type="button"
          role="checkbox"
          aria-checked={task.completed}
          aria-label={
            task.completed
              ? `Mark "${task.title}" as pending`
              : `Mark "${task.title}" as completed`
          }
          onClick={() => onToggleComplete(task.id)}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 cursor-pointer ${
            task.completed
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-slate-300 bg-white hover:border-blue-600'
          }`}
        >
          {task.completed && <Check className="h-3.5 w-3.5 stroke-[2.75]" />}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`text-[15px] font-medium leading-snug break-words ${
              task.completed ? 'line-through text-slate-400' : 'text-slate-900'
            }`}
          >
            {task.title}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
            <span className={task.completed ? 'text-slate-400' : 'font-medium text-slate-700'}>
              {task.subject}
            </span>
            <span aria-hidden="true">·</span>
            <span>{TYPE_LABELS[task.type]}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                task.completed
                  ? 'text-slate-400'
                  : task.priority === 'high'
                  ? 'font-semibold text-red-700'
                  : task.priority === 'medium'
                  ? 'font-medium text-slate-700'
                  : 'text-slate-500'
              }
            >
              {PRIORITY_LABELS[task.priority]}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Deadline + Urgency Status + Row Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-4 pl-8 sm:pl-0 shrink-0">
        <div className="flex flex-col sm:items-end text-left sm:text-right">
          <span
            className={`font-mono text-xs tabular-nums ${
              task.completed ? 'text-slate-400' : 'text-slate-700 font-medium'
            }`}
          >
            {formatReadableDate(task.dueDate)}
          </span>

          <span
            className={`mt-0.5 inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap ${
              deadlineStatus === 'overdue'
                ? 'text-red-700 font-semibold'
                : deadlineStatus === 'upcoming'
                ? 'text-amber-700 font-semibold'
                : deadlineStatus === 'completed'
                ? 'text-emerald-700'
                : 'text-slate-500'
            }`}
          >
            {deadlineStatus === 'overdue' && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
            {deadlineStatus === 'upcoming' && <Clock className="h-3.5 w-3.5 shrink-0" />}
            {deadlineStatus === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
            <span>{urgencyLabel}</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={startEditing}
            aria-label={`Edit "${task.title}"`}
            title="Edit task"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors cursor-pointer"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteTask(task.id)}
            aria-label={`Delete "${task.title}"`}
            title="Delete task"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-100/70 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );
}
