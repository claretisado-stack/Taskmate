import {
  AlertCircle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Inbox,
  ListChecks,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import type { StatusFilter } from '../types/task';

interface SubjectSummary {
  name: string;
  activeCount: number;
  totalCount: number;
}

interface SidebarProps {
  statusFilter: StatusFilter;
  onSelectStatus: (status: StatusFilter) => void;
  subjectFilter: string;
  onSelectSubject: (subject: string) => void;
  counts: {
    all: number;
    active: number;
    dueSoon: number;
    overdue: number;
    completed: number;
  };
  subjects: SubjectSummary[];
  onClearCompleted: () => void;
  onLoadSampleData: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  statusFilter,
  onSelectStatus,
  subjectFilter,
  onSelectSubject,
  counts,
  subjects,
  onClearCompleted,
  onLoadSampleData,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const navItems: Array<{
    id: StatusFilter;
    label: string;
    count: number;
    icon: typeof Inbox;
    accentClass?: string;
  }> = [
    { id: 'all', label: 'All Tasks', count: counts.all, icon: ListChecks },
    { id: 'active', label: 'Pending', count: counts.active, icon: Inbox },
    {
      id: 'due-soon',
      label: 'Due Soon (48h)',
      count: counts.dueSoon,
      icon: CalendarClock,
      accentClass: counts.dueSoon > 0 ? 'text-amber-700' : undefined,
    },
    {
      id: 'overdue',
      label: 'Overdue',
      count: counts.overdue,
      icon: AlertCircle,
      accentClass: counts.overdue > 0 ? 'text-red-700' : undefined,
    },
    {
      id: 'completed',
      label: 'Completed',
      count: counts.completed,
      icon: CheckCircle2,
      accentClass: counts.completed > 0 ? 'text-emerald-700' : undefined,
    },
  ];

  const handleStatusClick = (id: StatusFilter) => {
    onSelectStatus(id);
    onCloseMobile();
  };

  const handleSubjectClick = (subj: string) => {
    onSelectSubject(subj);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Brand Zone */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200 shrink-0">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectStatus('all');
            onSelectSubject('all');
            onCloseMobile();
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          TaskMate
        </a>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-7">
        <div>
          <h2 className="px-3 mb-2 text-xs font-semibold text-slate-500">Views</h2>
          <nav aria-label="Task status views" className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = statusFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleStatusClick(item.id)}
                  aria-current={isSelected ? 'page' : undefined}
                  className={`w-full flex items-center justify-between gap-3 px-3 min-h-[40px] rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isSelected
                      ? 'bg-slate-100 text-slate-950'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        item.accentClass
                          ? item.accentClass
                          : isSelected
                          ? 'text-blue-600'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span
                    className={`font-mono text-xs tabular-nums shrink-0 ${
                      item.accentClass && item.count > 0
                        ? `${item.accentClass} font-semibold`
                        : isSelected
                        ? 'text-slate-900 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <h2 className="text-xs font-semibold text-slate-500">Courses</h2>
            {subjectFilter !== 'all' && (
              <button
                type="button"
                onClick={() => handleSubjectClick('all')}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
              >
                Show all
              </button>
            )}
          </div>

          <nav aria-label="Filter by course" className="space-y-1">
            <button
              type="button"
              onClick={() => handleSubjectClick('all')}
              className={`w-full flex items-center justify-between gap-3 px-3 min-h-[40px] rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                subjectFilter === 'all'
                  ? 'bg-slate-100 text-slate-950'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <BookOpen
                  className={`h-4 w-4 shrink-0 ${
                    subjectFilter === 'all' ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">All Courses</span>
              </span>
              <span className="font-mono text-xs tabular-nums text-slate-400 shrink-0">
                {subjects.length}
              </span>
            </button>

            {subjects.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">
                Courses appear as you add tasks.
              </p>
            ) : (
              subjects.map((subj) => {
                const isSelected = subjectFilter === subj.name;
                return (
                  <button
                    key={subj.name}
                    type="button"
                    onClick={() => handleSubjectClick(subj.name)}
                    className={`w-full flex items-center justify-between gap-3 px-3 min-h-[40px] rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      isSelected
                        ? 'bg-slate-100 text-slate-950'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate text-left pl-6">{subj.name}</span>
                    <span className="font-mono text-xs tabular-nums text-slate-400 shrink-0">
                      {subj.activeCount}/{subj.totalCount}
                    </span>
                  </button>
                );
              })
            )}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer Actions */}
      <div className="p-3 border-t border-slate-200 space-y-1.5 shrink-0">
        {counts.completed > 0 && (
          <button
            type="button"
            onClick={onClearCompleted}
            className="w-full flex items-center gap-2.5 px-3 min-h-[40px] rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            <span>Clear Completed ({counts.completed})</span>
          </button>
        )}
        {counts.all === 0 && (
          <button
            type="button"
            onClick={onLoadSampleData}
            className="w-full flex items-center gap-2.5 px-3 min-h-[40px] rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4 shrink-0" />
            <span>Load Sample Schedule</span>
          </button>
        )}
        <p className="px-3 pt-1 text-xs text-slate-400">
          Saved automatically in this browser
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">{sidebarContent}</aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/30 transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 w-72 max-w-[85vw] h-full shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
