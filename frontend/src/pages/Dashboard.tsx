import React from 'react';
import {
  Landmark,
  CreditCard,
  Bell,
  TrendingUp,
  Receipt,
  Briefcase,
  ChevronRight,
  Wallet,
  Banknote,
  ArrowRightLeft,
  CalendarClock,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { ExpensePieChart, IncomeVsExpenseChart, MonthlyTrendChart } from '../components/Charts/DashboardCharts';

interface DashboardProps {
  onOpenQuickAdd: (tab?: string) => void;
  onNavigate?: (tab: string) => void;
}

const fmt = (n: number) => (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const quickActions = [
  { id: 'expense', label: 'Expense', icon: Receipt, tone: 'bg-red-50 dark:bg-red-950/40 text-red-500' },
  { id: 'salary', label: 'Salary', icon: Briefcase, tone: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500' },
  { id: 'loan', label: 'Loan', icon: Landmark, tone: 'bg-amber-50 dark:bg-amber-950/40 text-amber-500' },
  { id: 'credit', label: 'Card', icon: CreditCard, tone: 'bg-blue-50 dark:bg-blue-950/40 text-blue-500' },
  { id: 'emi', label: 'Pay EMI', icon: Banknote, tone: 'bg-purple-50 dark:bg-purple-950/40 text-purple-500' },
  { id: 'reminder', label: 'Reminder', icon: Bell, tone: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500' },
];

export const Dashboard: React.FC<DashboardProps> = ({ onOpenQuickAdd, onNavigate }) => {
  const { dashboard, loading, currency } = useFinance();

  if (loading) {
    return (
      <div className="space-y-4 p-4 max-w-4xl mx-auto">
        <div className="h-44 rounded-3xl shimmer" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-20 rounded-2xl shimmer" />
          <div className="h-20 rounded-2xl shimmer" />
          <div className="h-20 rounded-2xl shimmer" />
        </div>
        <div className="h-28 rounded-2xl shimmer" />
        <div className="h-28 rounded-2xl shimmer" />
      </div>
    );
  }

  const d = dashboard || {
    currentBalance: 0,
    totalSalary: 0,
    totalExpenses: 0,
    totalMonthExpenses: 0,
    totalLoanBalance: 0,
    totalMonthlyEMI: 0,
    savings: 0,
    cashInHand: 0,
    bankBalance: 0,
    totalCreditCardDue: 0,
    upcomingPayments: [],
    todayRemindersCount: 0,
    todayReminders: [],
    monthlyBudget: 0,
    monthlyRemaining: 0,
    pieChartData: [],
  };

  const today = new Date();
  const monthLabel = today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const spendRatio = d.totalSalary > 0 ? Math.min(100, Math.round((d.totalMonthExpenses / d.totalSalary) * 100)) : 0;

  return (
    <div className="space-y-4 pb-nav max-w-4xl mx-auto px-3.5 xs:px-4 pt-3">
      {/* Greeting row */}
      <div className="flex items-end justify-between px-0.5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">{greeting()}</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Your money, {monthLabel}</h2>
        </div>
        <button
          onClick={() => onNavigate?.('calendar')}
          className="w-10 h-10 rounded-xl liquid-glass-card flex items-center justify-center text-brand-600 dark:text-brand-400 active:scale-95"
          aria-label="Open calendar"
        >
          <CalendarClock className="w-5 h-5" />
        </button>
      </div>

      {/* Today's Reminder Alert Banner */}
      {d.todayRemindersCount > 0 && (
        <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-red-500 text-white shrink-0 animate-pulse">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-red-700 dark:text-red-300">
              {d.todayRemindersCount} payment{d.todayRemindersCount > 1 ? 's' : ''} due today
            </p>
            <p className="text-[11px] text-red-600 dark:text-red-400 truncate">
              {d.todayReminders[0]?.title} · {currency}{fmt(d.todayReminders[0]?.amount ?? 0)}
            </p>
          </div>
          <button
            onClick={() => onOpenQuickAdd('emi')}
            className="shrink-0 min-h-[2.5rem] px-3.5 rounded-xl bg-red-600 active:bg-red-700 text-white text-xs font-semibold shadow-md"
          >
            Pay now
          </button>
        </div>
      )}

      {/* Main Net Balance Card */}
      <div className="p-4 xs:p-5 rounded-3xl bg-gradient-to-tr from-brand-700 via-brand-600 to-accent2-500 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden net-worth-card">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -top-10 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">Net balance</span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-medium">
              Live · Local DB
            </span>
          </div>

          <div>
            <p className="text-[2rem] xs:text-4xl font-extrabold tracking-tight tabular-nums leading-none">
              {currency}{fmt(d.currentBalance)}
            </p>

            <button
              onClick={() => onNavigate?.('accounts')}
              className="mt-2.5 -ml-1 px-1 min-h-[2.25rem] text-[11px] xs:text-xs text-white/85 flex items-center gap-1 text-left active:opacity-70"
            >
              <Wallet className="w-3.5 h-3.5 shrink-0" />
              <span className="tabular-nums">Bank {currency}{fmt(d.bankBalance)} · Cash {currency}{fmt(d.cashInHand)}</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>

          {/* Spend-vs-income meter */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-white/75 font-medium">
              <span>Spent {spendRatio}% of this month's income</span>
              <span className="tabular-nums">{currency}{fmt(d.totalMonthExpenses)} / {currency}{fmt(d.totalSalary)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${spendRatio >= 90 ? 'bg-red-300' : spendRatio >= 70 ? 'bg-amber-300' : 'bg-emerald-300'}`}
                style={{ width: `${spendRatio}%` }}
              />
            </div>
          </div>

          {/* Quick metrics */}
          <div className="grid grid-cols-3 gap-1 pt-2.5 border-t border-white/20">
            <button onClick={() => onNavigate?.('salary')} className="p-1.5 min-h-[3rem] rounded-xl active:bg-white/10 text-left">
              <p className="text-[10px] text-white/75 uppercase font-medium">Salary</p>
              <p className="text-sm font-bold text-emerald-300 tabular-nums">+{currency}{fmt(d.totalSalary)}</p>
            </button>
            <button onClick={() => onNavigate?.('expenses')} className="p-1.5 min-h-[3rem] rounded-xl active:bg-white/10 text-left">
              <p className="text-[10px] text-white/75 uppercase font-medium">Expenses</p>
              <p className="text-sm font-bold text-red-300 tabular-nums">-{currency}{fmt(d.totalMonthExpenses)}</p>
            </button>
            <button onClick={() => onNavigate?.('reports')} className="p-1.5 min-h-[3rem] rounded-xl active:bg-white/10 text-left">
              <p className="text-[10px] text-white/75 uppercase font-medium">Savings</p>
              <p className="text-sm font-bold text-amber-300 tabular-nums">{currency}{fmt(d.savings)}</p>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="space-y-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 px-1">Quick actions</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {quickActions.map(({ id, label, icon: Icon, tone }) => (
            <button
              key={id}
              onClick={() => onOpenQuickAdd(id)}
              className="min-h-[4.5rem] p-2 rounded-2xl liquid-glass-card flex flex-col items-center justify-center text-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className={`p-2 rounded-xl ${tone}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-gray-800 dark:text-slate-200 leading-none">+ {label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Liabilities summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate?.('loans')}
          className="p-4 rounded-2xl liquid-glass-card border border-gray-100 dark:border-slate-800/80 shadow-sm text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500">
                <Landmark className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">Active loans</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">
            {currency}{fmt(d.totalLoanBalance)}
          </p>
          <div className="mt-1 flex justify-between items-center text-[11px] text-gray-500 dark:text-slate-400">
            <span className="tabular-nums">Monthly EMI {currency}{fmt(d.totalMonthlyEMI)}</span>
            <span className="text-amber-500 font-semibold">View loans</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate?.('credit')}
          className="p-4 rounded-2xl liquid-glass-card border border-gray-100 dark:border-slate-800/80 shadow-sm text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">Credit card dues</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">
            {currency}{fmt(d.totalCreditCardDue)}
          </p>
          <div className="mt-1 flex justify-between items-center text-[11px] text-gray-500 dark:text-slate-400">
            <span>Total outstanding</span>
            <span className="text-blue-500 font-semibold">View cards</span>
          </div>
        </button>
      </div>

      {/* Upcoming dues — placed above charts: on a phone this is what you check most */}
      <section className="p-4 rounded-2xl liquid-glass-card border border-gray-100 dark:border-slate-800 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-[11px] font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider">Upcoming dues</h3>
          <button
            onClick={() => onNavigate?.('reminders')}
            className="min-h-[2.25rem] px-2 -mr-2 text-xs text-brand-600 dark:text-brand-400 font-semibold"
          >
            See all →
          </button>
        </div>

        {d.upcomingPayments.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">No upcoming due payment reminders.</p>
        ) : (
          <div className="space-y-2">
            {d.upcomingPayments.slice(0, 5).map((rem) => (
              <button
                key={rem.id}
                onClick={() => onNavigate?.('reminders')}
                className="w-full min-h-[3.5rem] p-3 rounded-xl bg-gray-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-3 border-l-4 border-brand-500 text-left active:bg-gray-100 dark:active:bg-slate-800"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{rem.title}</p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    {new Date(rem.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {rem.dueTime ? ` · ${rem.dueTime}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-brand-600 dark:text-brand-400 tabular-nums">{currency}{fmt(rem.amount)}</p>
                  <span className="text-[10px] font-medium text-gray-400">{rem.type}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="p-4 rounded-2xl liquid-glass-card border border-gray-100 dark:border-slate-800">
          <h3 className="text-[11px] font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-3">
            Expenses by category
          </h3>
          <ExpensePieChart />
        </section>

        <section className="p-4 rounded-2xl liquid-glass-card border border-gray-100 dark:border-slate-800">
          <h3 className="text-[11px] font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-brand-600" /> Income vs expenses
          </h3>
          <IncomeVsExpenseChart />
        </section>
      </div>

      <section className="p-4 rounded-2xl liquid-glass-card border border-gray-100 dark:border-slate-800">
        <h3 className="text-[11px] font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-brand-600" /> 6-month expense trend
        </h3>
        <MonthlyTrendChart />
      </section>
    </div>
  );
};
