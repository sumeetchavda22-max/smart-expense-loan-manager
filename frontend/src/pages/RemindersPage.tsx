import React from 'react';
import { Bell, Plus, CheckCircle2, CalendarPlus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import * as api from '../services/api';

interface RemindersPageProps {
  onOpenQuickAdd: (tab?: string) => void;
}

export const RemindersPage: React.FC<RemindersPageProps> = ({ onOpenQuickAdd }) => {
  const { reminders, refreshData, currency } = useFinance();

  const handleMarkComplete = async (id: string) => {
    await api.markReminderComplete(id);
    await refreshData();
  };

  const getUrgencyBadge = (dueDateStr: string, isCompleted: boolean) => {
    if (isCompleted) {
      return {
        cardBorder: 'border-l-4 border-l-emerald-500',
        bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
        text: 'text-emerald-600 bg-emerald-100/70 dark:bg-emerald-900/40',
        label: 'Completed',
      };
    }

    const todayStr = new Date().toISOString().substring(0, 10);
    const tomDate = new Date();
    tomDate.setDate(tomDate.getDate() + 1);
    const tomStr = tomDate.toISOString().substring(0, 10);

    const dueStr = new Date(dueDateStr).toISOString().substring(0, 10);

    if (dueStr === todayStr) {
      return {
        cardBorder: 'border-l-4 border-l-red-500',
        bg: 'bg-red-50/50 dark:bg-red-950/20',
        text: 'text-red-600 bg-red-100/70 dark:bg-red-900/40 font-bold',
        label: 'Due today',
      };
    } else if (dueStr === tomStr) {
      return {
        cardBorder: 'border-l-4 border-l-orange-500',
        bg: 'bg-orange-50/50 dark:bg-orange-950/20',
        text: 'text-orange-600 bg-orange-100/70 dark:bg-orange-900/40 font-bold',
        label: 'Tomorrow',
      };
    } else {
      return {
        cardBorder: 'border-l-4 border-l-blue-500',
        bg: 'bg-white dark:bg-slate-900',
        text: 'text-blue-600 bg-blue-100/70 dark:bg-blue-900/40 font-medium',
        label: 'Upcoming',
      };
    }
  };

  return (
    <div className="space-y-4 pb-nav max-w-4xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Due Date Reminders</h1>
          <p className="text-xs text-gray-500">
            Total: <span className="font-bold text-brand-600">{reminders.length}</span>
          </p>
        </div>
        <button
          onClick={() => onOpenQuickAdd('reminder')}
          className="shrink-0 flex items-center gap-1.5 px-3.5 min-h-[2.75rem] rounded-xl bg-brand-600 active:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* Save everything to the iPhone's Calendar */}
      <a
        href={api.calendarSubscribeUrl()}
        className="flex items-center gap-3 p-3 rounded-2xl liquid-glass-card active:scale-[0.99] transition-transform"
      >
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 shrink-0">
          <CalendarPlus className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-gray-900 dark:text-white">Sync all to iPhone Calendar</p>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">Native iOS alerts — 1 day before & on the day</p>
        </div>
        <span className="text-[11px] font-semibold text-rose-500 shrink-0">Subscribe →</span>
      </a>

      {/* Reminders List */}
      {reminders.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">No reminders yet</p>
          <p className="text-xs text-gray-400">
            Add EMI, electricity, rent or insurance dates. Each one can be saved to your iPhone Calendar and emailed to you.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reminders.map((rem) => {
            const urgency = getUrgencyBadge(rem.dueDate, rem.isCompleted);
            const due = new Date(rem.dueDate);

            return (
              <div
                key={rem.id}
                className={`p-3 xs:p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-2.5 ${urgency.cardBorder} ${urgency.bg} transition-all`}
              >
                <button
                  onClick={() => !rem.isCompleted && handleMarkComplete(rem.id)}
                  className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full transition-colors ${
                    rem.isCompleted ? 'text-emerald-500' : 'text-gray-300 dark:text-slate-600 active:text-emerald-500'
                  }`}
                  aria-label={rem.isCompleted ? 'Completed' : 'Mark as paid'}
                >
                  <CheckCircle2 className="w-6 h-6" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3
                      className={`text-sm font-bold truncate ${
                        rem.isCompleted ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {rem.title}
                    </h3>
                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full ${urgency.text}`}>{urgency.label}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                    {due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {rem.dueTime}
                    {rem.repeat && rem.repeat !== 'NONE' ? ` · ${rem.repeat.toLowerCase()}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400 tabular-nums">
                    {currency}{rem.amount.toLocaleString('en-IN')}
                  </span>
                  {!rem.isCompleted && (
                    <a
                      href={api.reminderIcsUrl(rem.id)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-rose-500 active:bg-rose-100 dark:active:bg-rose-950/40"
                      aria-label="Add to iPhone Calendar"
                      title="Add to iPhone Calendar"
                    >
                      <CalendarPlus className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
