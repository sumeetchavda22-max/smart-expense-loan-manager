import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ExpensePieChart, IncomeVsExpenseChart, MonthlyTrendChart } from '../components/Charts/DashboardCharts';

interface DashboardProps {
  onOpenQuickAdd: (tab?: string) => void;
  onNavigate?: (tab: string) => void;
}

// Design-system tokens (text-primary, surface-dim, slate-border, etc.) are tuned for the
// dark theme shown in the reference mockup. Every usage below is paired with a readable
// light-mode fallback (text-gray-900, bg-gray-50, border-gray-100, ...) so the Light theme
// option in Settings stays fully legible — only the `dark:` variant matches the reference.

const fmt = (n: number) => (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const daysUntil = (dateStr: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dateStr);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return Math.round((dueDay.getTime() - today.getTime()) / 86400000);
};

const quickActions = [
  { id: 'expense', label: '+ Expense', icon: 'remove_circle_outline', tone: 'text-alert-coral' },
  { id: 'income', label: '+ Income', icon: 'add_circle_outline', tone: 'text-cashflow-emerald' },
  { id: 'loan', label: 'Loan/EMI', icon: 'real_estate_agent', tone: 'text-brand-600 dark:text-primary' },
];

export const Dashboard: React.FC<DashboardProps> = ({ onOpenQuickAdd, onNavigate }) => {
  const { dashboard, loading, currency, loans, expenses, incomes, salaries } = useFinance();

  // Net Worth (assets - liabilities) vs Balance (raw account total, no liabilities netted in) —
  // remembered only for this browser tab's session, per-tab like the rest of the local-first data.
  const [balanceView, setBalanceView] = useState<'networth' | 'balance'>(() => {
    return (sessionStorage.getItem('dashboard_balance_view') as 'networth' | 'balance') || 'balance';
  });
  const setBalanceViewPersisted = (view: 'networth' | 'balance') => {
    setBalanceView(view);
    sessionStorage.setItem('dashboard_balance_view', view);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4 max-w-4xl mx-auto">
        <div className="h-44 rounded-xl shimmer" />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-full shimmer" />)}
        </div>
        <div className="h-28 rounded-xl shimmer" />
        <div className="h-28 rounded-xl shimmer" />
      </div>
    );
  }

  const d = dashboard || {
    currentBalance: 0, netWorth: 0, totalSalary: 0, totalIncome: 0, totalExpenses: 0, totalMonthExpenses: 0, totalLoanBalance: 0,
    totalMonthlyEMI: 0, savings: 0, cashInHand: 0, bankBalance: 0, totalCreditCardDue: 0,
    upcomingPayments: [], todayRemindersCount: 0, todayReminders: [], monthlyBudget: 0,
    monthlyRemaining: 0, pieChartData: [], monthlyTrend: undefined,
  };

  const today = new Date();
  const monthLabel = today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const spendRatio = d.totalIncome > 0 ? Math.min(100, Math.round((d.totalMonthExpenses / d.totalIncome) * 100)) : 0;
  const cashflowStatus =
    spendRatio >= 90 ? { label: 'Overspending', tone: 'text-alert-coral' } :
    spendRatio >= 70 ? { label: 'Moderate Spend', tone: 'text-warning-amber' } :
    { label: 'Healthy Cashflow', tone: 'text-cashflow-emerald' };

  // Month-over-month expense trend, derived from the existing 6-month series — the honest
  // analogue of a "net worth growth" badge, since we don't keep historical net-worth snapshots.
  const trend = d.monthlyTrend?.data || [];
  const prevMonthExp = trend.length >= 2 ? trend[trend.length - 2] : 0;
  const curMonthExp = trend.length >= 1 ? trend[trend.length - 1] : d.totalMonthExpenses;
  const trendPct = prevMonthExp > 0 ? Math.round(((curMonthExp - prevMonthExp) / prevMonthExp) * 100) : null;

  const activeLoans = (loans || []).filter((l) => l.status === 'ACTIVE').sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  const topLoan = activeLoans[0];
  const otherLoans = activeLoans.slice(1, 3);

  // Unified recent activity feed: expenses (debit) + salary/income credits, newest first.
  type Tx = { id: string; title: string; sub: string; amount: number; credit: boolean; icon: string; tone: string; ring: string; date: string };
  const txs: Tx[] = [
    ...(expenses || []).slice(0, 8).map((e) => ({
      id: `e-${e.id}`, title: e.title, sub: `${e.category?.name || 'Expense'} • ${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      amount: e.amount, credit: false, icon: 'shopping_cart', tone: 'text-alert-coral', ring: 'bg-alert-coral/15 border-alert-coral/30',
      date: e.date,
    })),
    ...(incomes || []).slice(0, 8).map((i) => ({
      id: `i-${i.id}`, title: i.title, sub: `Income • ${new Date(i.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      amount: i.amount, credit: true, icon: 'payments', tone: 'text-cashflow-emerald', ring: 'bg-cashflow-emerald/15 border-cashflow-emerald/30',
      date: i.date,
    })),
    ...(salaries || []).slice(0, 4).map((s) => ({
      id: `s-${s.id}`, title: s.companyName, sub: `Salary • ${new Date(s.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      amount: s.inHandSalary, credit: true, icon: 'payments', tone: 'text-cashflow-emerald', ring: 'bg-cashflow-emerald/15 border-cashflow-emerald/30',
      date: s.paymentDate,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  return (
    <div className="space-y-4 pb-nav max-w-4xl mx-auto px-3.5 xs:px-4 pt-3">
      {/* Month chip + live badge */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass text-gray-900 dark:text-text-primary text-body-sm">
          <span className="material-symbols-outlined text-brand-600 dark:text-primary text-sm">calendar_month</span>
          <span className="font-medium">{monthLabel}</span>
        </div>
        <div className="inline-flex items-center gap-1 text-label-caps font-label-caps text-gray-500 dark:text-text-secondary bg-gray-100 dark:bg-surface-container-low px-2 py-1 rounded-md border border-gray-200 dark:border-slate-border">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-cashflow-emerald" />
          {greeting().toUpperCase()}
        </div>
      </div>

      {/* Hero Net Balance Card */}
      <section className="liquid-glass rounded-xl p-4 xs:p-5 relative overflow-hidden shadow-lg border border-gray-200 dark:border-slate-border net-worth-card">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1 gap-2">
            {/* Net Worth / Balance toggle — smooth sliding pill, choice remembered for this session */}
            <div className="relative grid grid-cols-2 w-32 xs:w-36 p-0.5 rounded-full bg-gray-100 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-border shrink-0">
              <span
                className="absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-brand-600 shadow-sm transition-transform duration-300 ease-out"
                style={{ transform: balanceView === 'balance' ? 'translateX(100%)' : 'translateX(0%)' }}
                aria-hidden="true"
              />
              <button
                onClick={() => setBalanceViewPersisted('networth')}
                className={`relative z-10 py-1 text-[10px] xs:text-[10.5px] font-bold rounded-full transition-colors duration-300 ${
                  balanceView === 'networth' ? 'text-white' : 'text-gray-500 dark:text-text-secondary'
                }`}
              >
                Net Worth
              </button>
              <button
                onClick={() => setBalanceViewPersisted('balance')}
                className={`relative z-10 py-1 text-[10px] xs:text-[10.5px] font-bold rounded-full transition-colors duration-300 ${
                  balanceView === 'balance' ? 'text-white' : 'text-gray-500 dark:text-text-secondary'
                }`}
              >
                Balance
              </button>
            </div>
            {trendPct !== null && (
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-body-sm text-body-sm font-semibold border ${
                  trendPct <= 0 ? 'bg-cashflow-emerald/15 text-cashflow-emerald border-cashflow-emerald/20' : 'bg-alert-coral/15 text-alert-coral border-alert-coral/20'
                }`}
                title="Change in this month's spending vs last month"
              >
                <span className="material-symbols-outlined text-xs">{trendPct <= 0 ? 'trending_down' : 'trending_up'}</span>
                {trendPct > 0 ? '+' : ''}{trendPct}%
              </span>
            )}
          </div>

          <div className="mb-3">
            {/* key swaps the node on toggle so the fade-in below replays as a subtle transition */}
            <div key={balanceView} className="animate-in fade-in duration-300">
              <button onClick={() => onNavigate?.('accounts')} className="font-display-lg-mobile text-display-lg-mobile text-gray-900 dark:text-text-primary tracking-tight text-left tabular-nums">
                {currency}{fmt(balanceView === 'networth' ? d.netWorth : d.currentBalance)}
              </button>
              <p className="text-label-caps font-label-caps text-gray-500 dark:text-text-secondary mt-0.5">
                {balanceView === 'networth' ? 'Assets minus loans & card dues' : 'Total across all accounts'}
              </p>
            </div>
          </div>

          {/* Account breakdown */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-slate-border">
            <button onClick={() => onNavigate?.('accounts')} className="bg-gray-50/80 dark:bg-surface-dim/70 rounded-lg p-2 border border-gray-200 dark:border-slate-border flex items-center justify-between text-left active:scale-[0.98] transition-transform">
              <div className="min-w-0">
                <span className="text-label-caps font-label-caps text-gray-500 dark:text-text-secondary block">Bank Accounts</span>
                <span className="font-label-numeric-md text-label-numeric-md text-gray-900 dark:text-text-primary tabular-nums">{currency}{fmt(d.bankBalance)}</span>
              </div>
              <span className="material-symbols-outlined text-blue-600 dark:text-secondary text-lg shrink-0">account_balance</span>
            </button>
            <button onClick={() => onNavigate?.('accounts')} className="bg-gray-50/80 dark:bg-surface-dim/70 rounded-lg p-2 border border-gray-200 dark:border-slate-border flex items-center justify-between text-left active:scale-[0.98] transition-transform">
              <div className="min-w-0">
                <span className="text-label-caps font-label-caps text-gray-500 dark:text-text-secondary block">Cash Wallet</span>
                <span className="font-label-numeric-md text-label-numeric-md text-gray-900 dark:text-text-primary tabular-nums">{currency}{fmt(d.cashInHand)}</span>
              </div>
              <span className="material-symbols-outlined text-cashflow-emerald text-lg shrink-0">wallet</span>
            </button>
          </div>

          {/* Cashflow gauge */}
          <div className="mt-3.5 pt-3 border-t border-gray-200/70 dark:border-slate-border/70">
            <div className="flex items-center justify-between text-body-sm font-body-sm mb-1.5 gap-2">
              <span className="text-gray-500 dark:text-text-secondary flex items-center gap-1 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-cashflow-emerald shrink-0" />
                Income: <strong className="text-gray-900 dark:text-text-primary font-semibold tabular-nums">{currency}{fmt(d.totalIncome)}</strong>
              </span>
              <span className="text-gray-500 dark:text-text-secondary shrink-0 tabular-nums">
                Spent: <strong className="text-gray-900 dark:text-text-primary font-semibold">{currency}{fmt(d.totalMonthExpenses)}</strong> ({spendRatio}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-slate-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-growth-teal via-primary to-cashflow-emerald rounded-full transition-all duration-500"
                style={{ width: `${spendRatio}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className={`text-label-caps font-label-caps ${cashflowStatus.tone}`}>{cashflowStatus.label}</span>
              <span className="text-label-caps font-label-caps text-gray-500 dark:text-text-secondary tabular-nums">
                {currency}{fmt(d.savings)} remaining
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Income / Expenses / Savings summary strip — this month.
          "Savings" (income minus expenses this month) is deliberately NOT called "Balance" —
          that word is reserved for actual account balances (the hero toggle above). Two
          different numbers both labeled "Balance" on one screen is what read as a double
          deduction bug; they're different metrics; d.savings is the same value used for the
          "remaining" line above, computed once in db/dashboard.ts. */}
      <section className="grid grid-cols-3 gap-2">
        <div className="liquid-glass-card rounded-xl p-3 border border-gray-200 dark:border-slate-border text-center">
          <span className="text-label-caps font-label-caps text-gray-500 dark:text-text-secondary uppercase block">Income</span>
          <span className="mt-1 block font-label-numeric-md text-label-numeric-md text-cashflow-emerald font-bold tabular-nums truncate">
            {currency}{fmt(d.totalIncome)}
          </span>
        </div>
        <div className="liquid-glass-card rounded-xl p-3 border border-gray-200 dark:border-slate-border text-center">
          <span className="text-label-caps font-label-caps text-gray-500 dark:text-text-secondary uppercase block">Expenses</span>
          <span className="mt-1 block font-label-numeric-md text-label-numeric-md text-alert-coral font-bold tabular-nums truncate">
            {currency}{fmt(d.totalMonthExpenses)}
          </span>
        </div>
        <div className="liquid-glass-card rounded-xl p-3 border border-gray-200 dark:border-slate-border text-center">
          <span className="text-label-caps font-label-caps text-gray-500 dark:text-text-secondary uppercase block">Savings</span>
          <span className="mt-1 block font-label-numeric-md text-label-numeric-md text-gray-900 dark:text-text-primary font-bold tabular-nums truncate">
            {currency}{fmt(d.savings)}
          </span>
        </div>
      </section>

      {/* Quick Action Row */}
      <section>
        <div className="grid grid-cols-5 gap-2 text-center">
          {quickActions.map(({ id, label, icon, tone }) => (
            <button key={id} onClick={() => onOpenQuickAdd(id)} className="group flex flex-col items-center gap-1 active:scale-95 transition-transform">
              <div className={`w-12 h-12 rounded-full liquid-glass-card flex items-center justify-center ${tone} shadow-sm`}>
                <span className="material-symbols-outlined text-xl">{icon}</span>
              </div>
              <span className="font-body-sm text-body-sm text-gray-500 dark:text-text-secondary group-active:text-gray-900 dark:group-active:text-text-primary transition-colors leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Bill / Reminder Due Alert */}
      {d.todayRemindersCount > 0 && (
        <section className="rounded-xl liquid-glass p-3.5 border-l-4 border-l-alert-coral relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-alert-coral text-lg">error_outline</span>
              <span className="text-label-caps font-label-caps text-alert-coral uppercase tracking-wider">Payment Due Notice</span>
            </div>
            <span className="text-body-sm font-body-sm font-semibold text-alert-coral bg-alert-coral/10 px-2 py-0.5 rounded-full border border-alert-coral/20">
              Due Today
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-headline-sm text-headline-sm text-gray-900 dark:text-text-primary font-bold truncate">{d.todayReminders[0]?.title}</h2>
              <p className="font-body-sm text-body-sm text-gray-500 dark:text-text-secondary mt-0.5">
                Amount: <strong className="text-gray-900 dark:text-text-primary font-label-numeric-md text-label-numeric-md tabular-nums">{currency}{fmt(d.todayReminders[0]?.amount || 0)}</strong>
              </p>
            </div>
            <button
              onClick={() => onNavigate?.('reminders')}
              className="shrink-0 bg-alert-coral active:opacity-90 text-slate-950 font-body-sm text-body-sm font-bold px-3.5 py-2 rounded-lg transition-transform active:scale-95 shadow-md"
            >
              Pay Now
            </button>
          </div>
        </section>
      )}

      {/* Active Loans & EMI Snapshot */}
      {topLoan && (
        <section className="liquid-glass rounded-xl p-4 border border-gray-200 dark:border-slate-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-brand-600 dark:text-primary text-base">account_balance</span>
              <h2 className="font-label-caps text-label-caps text-gray-500 dark:text-text-secondary uppercase">Active Loans &amp; EMI Snapshot</h2>
            </div>
            <button onClick={() => onNavigate?.('loans')} className="text-body-sm font-body-sm px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-text-secondary border border-gray-200 dark:border-slate-border">
              {activeLoans.length} Active
            </button>
          </div>

          <div className="bg-gray-50/80 dark:bg-surface-dim/80 rounded-lg p-3 border border-gray-200 dark:border-slate-border/80">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-headline-sm text-headline-sm text-gray-900 dark:text-text-primary font-bold truncate">{topLoan.name}</span>
                  {(() => {
                    const days = daysUntil(topLoan.nextDueDate);
                    return (
                      <span className={`text-label-caps font-label-caps px-2 py-0.5 rounded border ${days <= 3 ? 'text-alert-coral bg-alert-coral/15 border-alert-coral/30' : 'text-warning-amber bg-warning-amber/15 border-warning-amber/30'}`}>
                        {days <= 0 ? 'Due today' : `Due in ${days} day${days === 1 ? '' : 's'}`}
                      </span>
                    );
                  })()}
                </div>
                <p className="font-body-sm text-body-sm text-gray-500 dark:text-text-secondary mt-0.5">
                  EMI Amount: <span className="font-semibold text-gray-900 dark:text-text-primary tabular-nums">{currency}{fmt(topLoan.emiAmount)} /mo</span>
                </p>
              </div>
              <button
                onClick={() => onNavigate?.('loans')}
                className="shrink-0 bg-cashflow-emerald active:opacity-90 text-slate-950 font-body-sm text-body-sm font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform shadow-md"
              >
                Pay EMI
              </button>
            </div>
            <div className="mt-2.5">
              {(() => {
                const pct = topLoan.totalEmis > 0 ? Math.round((topLoan.paidEmis / topLoan.totalEmis) * 100) : 0;
                return (
                  <>
                    <div className="flex justify-between text-body-sm font-body-sm mb-1">
                      <span className="text-gray-500 dark:text-text-secondary">Progress: <strong className="text-cashflow-emerald">{pct}% paid off</strong></span>
                      <span className="text-gray-500 dark:text-text-secondary">Remaining: <strong className="text-gray-900 dark:text-text-primary tabular-nums">{currency}{fmt(topLoan.outstandingBalance)}</strong></span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-growth-teal to-cashflow-emerald rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {otherLoans.map((l) => {
            const pct = l.totalEmis > 0 ? Math.round((l.paidEmis / l.totalEmis) * 100) : 0;
            return (
              <button
                key={l.id}
                onClick={() => onNavigate?.('loans')}
                className="w-full mt-2.5 flex items-center justify-between bg-gray-50/60 dark:bg-surface-dim/50 rounded-lg px-3 py-2 border border-gray-200 dark:border-slate-border text-left active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-blue-600 dark:text-secondary text-base shrink-0">directions_car</span>
                  <span className="font-body-sm text-body-sm text-gray-900 dark:text-text-primary font-medium truncate">{l.name}</span>
                  <span className="text-label-caps font-label-caps text-gray-500 dark:text-text-secondary whitespace-nowrap">{currency}{fmt(l.emiAmount)}/mo • {pct}% paid</span>
                </div>
              </button>
            );
          })}
        </section>
      )}

      {/* Loans quick nav (totals) */}
      <button onClick={() => onNavigate?.('loans')} className="w-full liquid-glass-card rounded-xl p-4 border border-gray-200 dark:border-slate-border text-left active:scale-[0.98] transition-transform">
        <div className="flex items-center justify-between">
          <span className="text-label-caps font-label-caps text-gray-500 dark:text-text-secondary uppercase flex items-center gap-1.5">
            <span className="material-symbols-outlined text-warning-amber text-base">account_balance</span> Active loans
          </span>
          <span className="material-symbols-outlined text-gray-400 dark:text-text-secondary text-base">chevron_right</span>
        </div>
        <p className="mt-2 font-label-numeric-lg text-label-numeric-lg text-gray-900 dark:text-text-primary tabular-nums">{currency}{fmt(d.totalLoanBalance)}</p>
        <p className="mt-1 text-body-sm font-body-sm text-gray-500 dark:text-text-secondary tabular-nums">EMI obligation {currency}{fmt(d.totalMonthlyEMI)}</p>
      </button>

      {/* Recent Transactions */}
      <section className="liquid-glass rounded-xl p-4 border border-gray-200 dark:border-slate-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-label-caps text-label-caps text-gray-500 dark:text-text-secondary uppercase">Recent Transactions</h2>
          <button onClick={() => onNavigate?.('expenses')} className="text-brand-600 dark:text-primary font-body-sm text-body-sm font-medium flex items-center gap-0.5">
            View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
        {txs.length === 0 ? (
          <p className="text-body-sm font-body-sm text-gray-500 dark:text-text-secondary py-2">No transactions logged yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-border/50">
            {txs.map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${tx.ring} ${tx.tone}`}>
                    <span className="material-symbols-outlined text-lg">{tx.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md text-gray-900 dark:text-text-primary font-medium truncate">{tx.title}</p>
                    <p className="font-body-sm text-body-sm text-gray-500 dark:text-text-secondary truncate">{tx.sub}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-label-numeric-md text-label-numeric-md font-bold tabular-nums ${tx.credit ? 'text-cashflow-emerald' : 'text-alert-coral'}`}>
                    {tx.credit ? '+' : '-'}{currency}{fmt(tx.amount)}
                  </p>
                  <p className="text-label-caps font-label-caps text-gray-500 dark:text-text-secondary">{tx.credit ? 'Credit' : 'Debit'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Dues */}
      <section className="liquid-glass rounded-xl p-4 border border-gray-200 dark:border-slate-border space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-label-caps text-label-caps text-gray-500 dark:text-text-secondary uppercase">Upcoming dues</h3>
          <button onClick={() => onNavigate?.('reminders')} className="text-body-sm font-body-sm text-brand-600 dark:text-primary font-semibold">See all →</button>
        </div>
        {d.upcomingPayments.length === 0 ? (
          <p className="text-body-sm font-body-sm text-gray-500 dark:text-text-secondary py-2">No upcoming due payment reminders.</p>
        ) : (
          <div className="space-y-2">
            {d.upcomingPayments.slice(0, 5).map((rem) => (
              <button
                key={rem.id}
                onClick={() => onNavigate?.('reminders')}
                className="w-full min-h-[3.5rem] p-3 rounded-lg bg-gray-50/80 dark:bg-surface-dim/70 flex items-center justify-between gap-3 border-l-4 border-brand-600 dark:border-primary text-left active:bg-gray-100 dark:active:bg-surface-container"
              >
                <div className="min-w-0">
                  <p className="font-body-md text-body-md font-bold text-gray-900 dark:text-text-primary truncate">{rem.title}</p>
                  <p className="font-body-sm text-body-sm text-gray-500 dark:text-text-secondary">
                    {new Date(rem.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{rem.dueTime ? ` · ${rem.dueTime}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-label-numeric-md text-label-numeric-md text-brand-600 dark:text-primary tabular-nums">{currency}{fmt(rem.amount)}</p>
                  <span className="text-label-caps font-label-caps text-gray-500 dark:text-text-secondary">{rem.type}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="liquid-glass rounded-xl p-4 border border-gray-200 dark:border-slate-border">
          <h3 className="font-label-caps text-label-caps text-gray-500 dark:text-text-secondary uppercase mb-3">Expenses by category</h3>
          <ExpensePieChart />
        </section>
        <section className="liquid-glass rounded-xl p-4 border border-gray-200 dark:border-slate-border">
          <h3 className="font-label-caps text-label-caps text-gray-500 dark:text-text-secondary uppercase mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-brand-600 dark:text-primary text-base">sync_alt</span> Income vs expenses
          </h3>
          <IncomeVsExpenseChart />
        </section>
      </div>

      <section className="liquid-glass rounded-xl p-4 border border-gray-200 dark:border-slate-border">
        <h3 className="font-label-caps text-label-caps text-gray-500 dark:text-text-secondary uppercase mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-brand-600 dark:text-primary text-base">monitoring</span> 6-month expense trend
        </h3>
        <MonthlyTrendChart />
      </section>
    </div>
  );
};
