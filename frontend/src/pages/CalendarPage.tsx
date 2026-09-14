import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const CalendarPage: React.FC = () => {
  const { expenses, reminders, loans, salaries, currency } = useFinance();
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[] | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  // Transform data to FullCalendar events format
  const events: any[] = [];

  expenses.forEach((e) => {
    events.push({
      id: `exp-${e.id}`,
      title: `-${currency}${e.amount} ${e.title}`,
      date: new Date(e.date).toISOString().substring(0, 10),
      backgroundColor: '#EF4444',
      borderColor: '#EF4444',
      extendedProps: { type: 'Expense', amount: e.amount, details: e.title },
    });
  });

  reminders.forEach((r) => {
    events.push({
      id: `rem-${r.id}`,
      title: `Due: ${r.title} (${currency}${r.amount})`,
      date: new Date(r.dueDate).toISOString().substring(0, 10),
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
      extendedProps: { type: 'Reminder', amount: r.amount, details: r.title },
    });
  });

  salaries.forEach((s) => {
    events.push({
      id: `sal-${s.id}`,
      title: `Salary: +${currency}${s.inHandSalary}`,
      date: `${s.month}-${String(s.salaryDate).padStart(2, '0')}`,
      backgroundColor: '#10B981',
      borderColor: '#10B981',
      extendedProps: { type: 'Salary', amount: s.inHandSalary, details: s.companyName },
    });
  });

  loans.forEach((l) => {
    events.push({
      id: `loan-${l.id}`,
      title: `EMI Due: ${l.name} (${currency}${l.emiAmount})`,
      date: new Date(l.nextDueDate).toISOString().substring(0, 10),
      backgroundColor: '#F59E0B',
      borderColor: '#F59E0B',
      extendedProps: { type: 'Loan EMI', amount: l.emiAmount, details: l.name },
    });
  });

  const handleDateClick = (arg: any) => {
    const clickedStr = arg.dateStr;
    const matched = events.filter((ev) => ev.date === clickedStr);
    setSelectedDateStr(clickedStr);
    setSelectedDateEvents(matched);
  };

  return (
    <div className="space-y-4 pb-nav max-w-4xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Financial Calendar</h1>
          <p className="text-xs text-gray-500">Tap a date to see salary, EMI, expenses & dues</p>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-2.5 xs:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden text-xs">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
          height="auto"
          headerToolbar={{
            left: 'title',
            right: 'today prev,next',
          }}
          titleFormat={{ month: 'short', year: 'numeric' }}
          dayMaxEvents={2}
          moreLinkClick="popover"
          fixedWeekCount={false}
          showNonCurrentDates={false}
          longPressDelay={150}
        />
      </div>

      {/* Date Events Modal */}
      {selectedDateEvents && (
        <div className="sheet-overlay" onClick={() => setSelectedDateEvents(null)} role="dialog" aria-modal="true" aria-label="Events for date">
          <div className="sheet-panel bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="p-5 space-y-4 overflow-y-auto overscroll-contain">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Events for {selectedDateStr}
              </h3>
              <button
                onClick={() => setSelectedDateEvents(null)}
                className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 active:bg-gray-100 dark:active:bg-slate-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedDateEvents.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No events or dues recorded for this date.</p>
            ) : (
              <div className="space-y-2">
                {selectedDateEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center border-l-4"
                    style={{ borderLeftColor: ev.backgroundColor }}
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{ev.extendedProps.details}</p>
                      <span className="text-[10px] text-gray-500">{ev.extendedProps.type}</span>
                    </div>
                    <span className="text-xs font-extrabold" style={{ color: ev.backgroundColor }}>
                      {ev.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
