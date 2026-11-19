import { Plus } from 'lucide-react';
import { useState, type FormEvent, type RefObject } from 'react';
import type { Priority, TaskType } from '../types/task';
import { formatLocalISO, getTodayLocal } from '../utils/date';

interface NewTaskPayload {
  title: string;
  subject: string;
  type: TaskType;
  dueDate: string;
  priority: Priority;
}

interface TaskFormProps {
  existingSubjects: string[];
  onAddTask: (payload: NewTaskPayload) => void;
  titleInputRef: RefObject<HTMLInputElement | null>;
}

export function TaskForm({ existingSubjects, onAddTask, titleInputRef }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<TaskType>('homework');
  const [dueDate, setDueDate] = useState(() => formatLocalISO(getTodayLocal()));
  const [priority, setPriority] = useState<Priority>('medium');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanSubject = subject.trim();

    if (!cleanTitle) {
      setError('Please enter a task title.');
      titleInputRef.current?.focus();
      return;
    }
    if (!cleanSubject) {
      setError('Please enter a subject or course name.');
      return;
    }
    if (!dueDate) {
      setError('Please choose a due date.');
      return;
    }

    setError('');
    onAddTask({
      title: cleanTitle,
      subject: cleanSubject,
      type,
      dueDate,
      priority,
    });

    setTitle('');
    titleInputRef.current?.focus();
  };

  return (
    <section
      aria-label="Add new task"
      className="bg-white border border-slate-200 rounded-xl p-5"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-base font-semibold text-slate-900">Add Task</h2>
        {error && (
          <p role="alert" className="text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-3 items-end"
      >
        <div className="sm:col-span-2 xl:col-span-4 flex flex-col gap-1.5">
          <label htmlFor="task-title" className="text-xs font-medium text-slate-600">
            Task Title
          </label>
          <input
            ref={titleInputRef}
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g., Chapter 5 Problem Set"
            maxLength={140}
            required
            className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
          />
        </div>

        <div className="xl:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="task-subject" className="text-xs font-medium text-slate-600">
            Subject / Course
          </label>
          <input
            id="task-subject"
            type="text"
            list="taskmate-subject-suggestions"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g., Calculus II"
            maxLength={60}
            required
            className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
          />
          <datalist id="taskmate-subject-suggestions">
            {existingSubjects.map((subj) => (
              <option key={subj} value={subj} />
            ))}
          </datalist>
        </div>

        <div className="xl:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="task-type" className="text-xs font-medium text-slate-600">
            Task Type
          </label>
          <select
            id="task-type"
            value={type}
            onChange={(e) => setType(e.target.value as TaskType)}
            className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
          >
            <option value="homework">Homework</option>
            <option value="assignment">Assignment</option>
            <option value="exam/deadline">Exam / Deadline</option>
          </select>
        </div>

        <div className="xl:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="task-due" className="text-xs font-medium text-slate-600">
            Due Date
          </label>
          <input
            id="task-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
          />
        </div>

        <div className="xl:col-span-1 flex flex-col gap-1.5">
          <label htmlFor="task-priority" className="text-xs font-medium text-slate-600">
            Priority
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="h-10 px-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-colors"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="sm:col-span-2 xl:col-span-1">
          <button
            type="submit"
            className="w-full h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Add</span>
          </button>
        </div>
      </form>
    </section>
  );
}
