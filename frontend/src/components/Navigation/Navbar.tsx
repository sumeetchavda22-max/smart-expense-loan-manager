import React from 'react';
import {
  Search,
  Moon,
  Sun,
  Lock,
  Calendar as CalendarIcon,
  Calculator,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuthPin } from '../../context/AuthPinContext';
import { useFinance } from '../../context/FinanceContext';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenCalendar: () => void;
  onOpenCalculators: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenCalendar,
  onOpenCalculators,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { lockApp, pinRequired } = useAuthPin();
  const { dashboard } = useFinance();

  return (
    <header className="sticky top-0 z-30 liquid-glass border-b border-white/60 dark:border-white/10 px-3 xs:px-4 pb-2 pt-safe shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between pt-2 min-h-[3.25rem]">
        {/* App Brand */}
        <div className="flex items-center space-x-2 xs:space-x-2.5 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-brand-500/20">
            S
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-gray-900 dark:text-white leading-tight">
              SMT<span className="text-brand-600 dark:text-brand-400">-C</span>
            </h1>
            <p className="hidden xs:block text-[11px] text-gray-500 dark:text-slate-400 font-medium truncate">
              Expense & Loan Manager
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-0.5 shrink-0">
          <button
            onClick={onOpenSearch}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200/70 dark:active:bg-slate-700/70 transition-colors"
            title="Search" aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenCalendar}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200/70 dark:active:bg-slate-700/70 transition-colors relative"
            title="Calendar View" aria-label="Calendar"
          >
            <CalendarIcon className="w-5 h-5" />
            {dashboard && dashboard.todayRemindersCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={onOpenCalculators}
            className="hidden sm:flex w-11 h-11 items-center justify-center rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200/70 dark:active:bg-slate-700/70 transition-colors"
            title="EMI & Financial Calculators" aria-label="Calculators"
          >
            <Calculator className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTheme}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200/70 dark:active:bg-slate-700/70 transition-colors"
            title="Toggle Dark Mode" aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {pinRequired && (
            <button
              onClick={lockApp}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200/70 dark:active:bg-slate-700/70 transition-colors"
              title="Lock Screen" aria-label="Lock app"
            >
              <Lock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
