import {
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TaskForm } from './components/TaskForm';
import { TaskRow } from './components/TaskRow';
import type { Priority, SortOption, StatusFilter, Task, TaskType } from './types/task';
import { getDaysDiff, parseLocalDate } from './utils/date';
import { createStarterTasks, generateTaskId, loadTasks, saveTasks } from './utils/storage';

interface UndoState {
  label: string;
  previousTasks: Task[];
}

const PRIORITY_RANK: Record<Priority, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

const VIEW_TITLES: Record<StatusFilter, string> = {
  all: 'All Tasks',
  active: 'Pending Tasks',
  'due-soon': 'Due Soon (48h)',
  overdue: 'Overdue Deadlines',
  completed: 'Completed Tasks',
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | TaskType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('due-asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [undoState, setUndoState] = useState<UndoState | null>(null);

  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current !== null) {
        window.clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const triggerUndoToast = (label: string, previousTasks: Task[]) => {
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
    }
    setUndoState({ label, previousTasks });
    undoTimerRef.current = window.setTimeout(() => {
      setUndoState(null);
      undoTimerRef.current = null;
    }, 6000);
  };

  const handleUndo = () => {
    if (!undoState) return;
    setTasks(undoState.previousTasks);
    setUndoState(null);
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  };

  const counts = useMemo(() => {
    let active = 0;
    let dueSoon = 0;
    let overdue = 0;
    let completed = 0;

    for (const task of tasks) {
      if (task.completed) {
        completed += 1;
      } else {
        active += 1;
        const diff = getDaysDiff(task.dueDate);
        if (diff < 0) overdue += 1;
        else if (diff <= 2) dueSoon += 1;
      }
    }

    return {
      all: tasks.length,
      active,
      dueSoon,
      overdue,
      completed,
    };
  }, [tasks]);

  const subjectSummaries = useMemo(() => {
    const map = new Map<string, { activeCount: number; totalCount: number }>();
    for (const task of tasks) {
      const name = task.subject.trim();
      if (!name) continue;
      const entry = map.get(name) ?? { activeCount: 0, totalCount: 0 };
      entry.totalCount += 1;
      if (!task.completed) entry.activeCount += 1;
      map.set(name, entry);
    }
    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  const existingSubjectNames = useMemo(
    () => subjectSummaries.map((s) => s.name),
    [subjectSummaries]
  );

  // Keep subjectFilter valid if a subject's last task was deleted
  const activeSubjectFilter = useMemo(() => {
    if (subjectFilter === 'all') return 'all';
    return existingSubjectNames.includes(subjectFilter) ? subjectFilter : 'all';
  }, [subjectFilter, existingSubjectNames]);

  const filteredAndSortedTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return tasks
      .filter((task) => {
        if (statusFilter === 'active' && task.completed) return false;
        if (statusFilter === 'completed' && !task.completed) return false;
        if (statusFilter === 'overdue') {
          if (task.completed || getDaysDiff(task.dueDate) >= 0) return false;
        }
        if (statusFilter === 'due-soon') {
          if (task.completed) return false;
          const diff = getDaysDiff(task.dueDate);
          if (diff < 0 || diff > 2) return false;
        }

        if (activeSubjectFilter !== 'all' && task.subject !== activeSubjectFilter) {
          return false;
        }

        if (typeFilter !== 'all' && task.type !== typeFilter) {
          return false;
        }

        if (normalizedQuery) {
          const matchesTitle = task.title.toLowerCase().includes(normalizedQuery);
          const matchesSubject = task.subject.toLowerCase().includes(normalizedQuery);
          if (!matchesTitle && !matchesSubject) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Keep completed tasks after active tasks when viewing "All Tasks"
        if (statusFilter === 'all' && a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        const dateA = parseLocalDate(a.dueDate).getTime();
        const dateB = parseLocalDate(b.dueDate).getTime();

        switch (sortBy) {
          case 'due-asc':
            return dateA !== dateB ? dateA - dateB : PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
          case 'due-desc':
            return dateA !== dateB ? dateB - dateA : PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
          case 'priority': {
            const pDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
            return pDiff !== 0 ? pDiff : dateA - dateB;
          }
          case 'subject': {
            const subjCmp = a.subject.localeCompare(b.subject);
            return subjCmp !== 0 ? subjCmp : dateA - dateB;
          }
          default:
            return 0;
        }
      });
  }, [tasks, statusFilter, activeSubjectFilter, typeFilter, sortBy, searchQuery]);

  const handleAddTask = (payload: {
    title: string;
    subject: string;
    type: TaskType;
    dueDate: string;
    priority: Priority;
  }) => {
    const newTask: Task = {
      id: generateTaskId(),
      ...payload,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);

    // If user is currently looking at Completed only, switch to Pending so they see the newly created task
    if (statusFilter === 'completed') {
      setStatusFilter('active');
    }
  };

  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? Date.now() : undefined,
            }
          : task
      )
    );
  };

  const handleUpdateTask = (
    id: string,
    updates: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt'>
  ) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...updates } : task)));
  };

  const handleDeleteTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    triggerUndoToast(`Deleted "${target.title}"`, tasks);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearCompleted = () => {
    if (counts.completed === 0) return;
    triggerUndoToast(`Cleared ${counts.completed} completed task${counts.completed === 1 ? '' : 's'}`, tasks);
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  const handleLoadSampleData = () => {
    setTasks(createStarterTasks());
  };

  const hasActiveFilters =
    statusFilter !== 'all' ||
    activeSubjectFilter !== 'all' ||
    typeFilter !== 'all' ||
    searchQuery.trim() !== '';

  const resetFilters = () => {
    setStatusFilter('all');
    setSubjectFilter('all');
    setTypeFilter('all');
    setSearchQuery('');
  };

  const focusNewTaskInput = () => {
    titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 150);
  };

  const breadcrumbContext =
    activeSubjectFilter !== 'all'
      ? `${VIEW_TITLES[statusFilter]} / ${activeSubjectFilter}`
      : VIEW_TITLES[statusFilter];

  return (
    <div id="top" className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        statusFilter={statusFilter}
        onSelectStatus={setStatusFilter}
        subjectFilter={activeSubjectFilter}
        onSelectSubject={setSubjectFilter}
        counts={counts}
        subjects={subjectSummaries}
        onClearCompleted={handleClearCompleted}
        onLoadSampleData={handleLoadSampleData}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shrink-0 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-semibold text-slate-900 lg:hidden whitespace-nowrap">
                TaskMate
              </span>
              <span className="text-slate-300 lg:hidden" aria-hidden="true">
                /
              </span>
              <span className="hidden lg:inline text-slate-500 whitespace-nowrap">Planner</span>
              <span className="hidden lg:inline text-slate-300" aria-hidden="true">
                /
              </span>
              <h1 className="font-semibold text-slate-900 truncate">{breadcrumbContext}</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={focusNewTaskInput}
            className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>New Task</span>
          </button>
        </header>

        {/* Main Viewport Content */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Summary Metrics Strip (Single-elevation bar with hairline dividers) */}
          <section
            aria-label="Task summary metrics"
            className="bg-white border border-slate-200 rounded-xl grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200"
          >
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className="p-4 sm:px-5 text-left hover:bg-slate-50/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 cursor-pointer"
            >
              <div className="text-xs font-medium text-slate-500">Pending Tasks</div>
              <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-slate-900">
                {counts.active}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('due-soon')}
              className="p-4 sm:px-5 text-left hover:bg-slate-50/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 cursor-pointer"
            >
              <div className="text-xs font-medium text-slate-500">Due Soon (48h)</div>
              <div
                className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
                  counts.dueSoon > 0 ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {counts.dueSoon}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('overdue')}
              className="p-4 sm:px-5 text-left hover:bg-slate-50/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 cursor-pointer"
            >
              <div className="text-xs font-medium text-slate-500">Overdue</div>
              <div
                className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
                  counts.overdue > 0 ? 'text-red-600' : 'text-slate-900'
                }`}
              >
                {counts.overdue}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className="p-4 sm:px-5 text-left hover:bg-slate-50/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 cursor-pointer"
            >
              <div className="text-xs font-medium text-slate-500">Completed</div>
              <div
                className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
                  counts.completed > 0 ? 'text-emerald-600' : 'text-slate-900'
                }`}
              >
                {counts.completed}
              </div>
            </button>
          </section>

          {/* Add Task Form */}
          <TaskForm
            existingSubjects={existingSubjectNames}
            onAddTask={handleAddTask}
            titleInputRef={titleInputRef}
          />

          {/* Checklist & Filter Controls */}
          <section
            aria-label="Task checklist"
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            {/* Toolbar */}
            <div className="p-4 sm:px-5 border-b border-slate-200 flex flex-col gap-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Segmented Status Filter */}
                <div
                  role="tablist"
                  aria-label="Filter by completion status"
                  className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start overflow-x-auto max-w-full"
                >
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'active', label: 'Pending' },
                      { id: 'due-soon', label: 'Due Soon' },
                      { id: 'overdue', label: 'Overdue' },
                      { id: 'completed', label: 'Completed' },
                    ] as const
                  ).map((tab) => {
                    const active = statusFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setStatusFilter(tab.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer ${
                          active
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Search + Subject + Type + Sort */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative flex-1 min-w-[190px] sm:w-56">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tasks or courses..."
                      aria-label="Search tasks or courses"
                      className="w-full h-9 pl-9 pr-8 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <BookOpen className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <select
                        aria-label="Filter by subject"
                        value={activeSubjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="h-9 pl-8 pr-7 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                      >
                        <option value="all">All Subjects</option>
                        {existingSubjectNames.map((subj) => (
                          <option key={subj} value={subj}>
                            {subj}
                          </option>
                        ))}
                      </select>
                    </div>

                    <select
                      aria-label="Filter by task type"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as 'all' | TaskType)}
                      className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                    >
                      <option value="all">All Types</option>
                      <option value="homework">Homework</option>
                      <option value="assignment">Assignment</option>
                      <option value="exam/deadline">Exam / Deadline</option>
                    </select>

                    <div className="relative">
                      <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <select
                        aria-label="Sort tasks"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="h-9 pl-8 pr-7 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                      >
                        <option value="due-asc">Due Date (Earliest)</option>
                        <option value="due-desc">Due Date (Latest)</option>
                        <option value="priority">Priority (High → Low)</option>
                        <option value="subject">Subject (A → Z)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Filter Summary + Clear Completed inline action */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-mono tabular-nums">
                  Showing {filteredAndSortedTasks.length} of {tasks.length} task
                  {tasks.length === 1 ? '' : 's'}
                </span>

                <div className="flex items-center gap-3">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap cursor-pointer"
                    >
                      Reset filters
                    </button>
                  )}
                  {counts.completed > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCompleted}
                      className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-red-700 whitespace-nowrap cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Clear completed ({counts.completed})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Task Rows or Empty State */}
            {filteredAndSortedTasks.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" />
                <h3 className="mt-3 text-sm font-semibold text-slate-900">
                  {tasks.length === 0 ? 'No tasks scheduled yet' : 'No matching tasks'}
                </h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  {tasks.length === 0
                    ? 'Add your first homework, assignment, or exam deadline above to build your study schedule.'
                    : 'No tasks match your current status, course, or search filters.'}
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  {tasks.length === 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={focusNewTaskInput}
                        className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add First Task</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadSampleData}
                        className="h-9 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Load Sample Schedule</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="h-9 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium whitespace-nowrap cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <ul className="divide-y-0" aria-live="polite">
                {filteredAndSortedTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    existingSubjects={existingSubjectNames}
                    onToggleComplete={handleToggleComplete}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                  />
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>

      {/* Undo Toast */}
      {undoState && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-lg border border-slate-800 max-w-sm"
        >
          <span className="text-sm truncate">{undoState.label}</span>
          <button
            type="button"
            onClick={handleUndo}
            className="text-sm font-semibold text-blue-400 hover:text-blue-300 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => setUndoState(null)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-white p-0.5 shrink-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
