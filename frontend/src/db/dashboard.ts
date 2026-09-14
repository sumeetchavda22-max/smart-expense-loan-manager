import { getDb, currentMonthStr } from './client';
import { ensureSeeded } from './seed';
import { DashboardData } from '../types/finance';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Port of the old GET /api/dashboard aggregation — same math, run client-side against IndexedDB. */
export async function computeDashboard(): Promise<DashboardData> {
  await ensureSeeded();
  const db = await getDb();

  const now = new Date();
  const currentMonth = currentMonthStr(now);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [accounts, salaries, allExpenses, allIncomes, loans, creditCards, allReminders, budgets, categories] = await Promise.all([
    db.getAll('accounts'),
    db.getAllFromIndex('salaries', 'byMonth', currentMonth),
    db.getAll('expenses'),
    db.getAll('incomes'),
    db.getAllFromIndex('loans', 'byStatus', 'ACTIVE'),
    db.getAll('creditCards'),
    db.getAll('reminders'),
    db.getAll('budgets'),
    db.getAll('categories'),
  ]);

  const bankAccounts = accounts.filter((a) => a.type === 'SAVINGS' || a.type === 'CURRENT');
  const cashAccount = accounts.find((a) => a.type === 'CASH');
  const bankBalance = bankAccounts.reduce((acc, a) => acc + a.balance, 0);
  const cashInHand = cashAccount ? cashAccount.balance : 0;
  const currentBalance = accounts.reduce((acc, a) => acc + (a.type === 'CREDIT_CARD' ? 0 : a.balance), 0);

  const totalSalary = salaries.reduce((acc, s) => acc + s.inHandSalary, 0);

  const inMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d >= startOfMonth && d <= endOfMonth;
  };
  const monthExpenses = allExpenses.filter((e) => inMonth(e.date));
  const totalMonthExpenses = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalExpenses = allExpenses.reduce((acc, e) => acc + e.amount, 0);

  const monthIncomes = allIncomes.filter((i) => inMonth(i.date));
  const totalIncome = totalSalary + monthIncomes.reduce((acc, i) => acc + i.amount, 0);

  const totalLoanBalance = loans.reduce((acc, l) => acc + l.outstandingBalance, 0);
  const totalMonthlyEMI = loans.reduce((acc, l) => acc + l.emiAmount, 0);
  const totalCreditCardDue = creditCards.reduce((acc, c) => acc + c.totalDue, 0);

  const savings = Math.max(0, totalIncome - totalMonthExpenses);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const pendingReminders = allReminders.filter((r) => !r.isCompleted);
  const todayReminders = pendingReminders.filter((r) => {
    const d = new Date(r.dueDate);
    return d >= todayStart && d <= todayEnd;
  });
  const upcomingPayments = pendingReminders
    .filter((r) => new Date(r.dueDate) >= todayEnd)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const monthBudgets = budgets.filter((b) => b.month === currentMonth);
  const totalBudget = monthBudgets.reduce((acc, b) => acc + b.limit, 0);
  const monthlyRemaining = Math.max(0, totalBudget - totalMonthExpenses);

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const categoryTotals = new Map<string, number>();
  for (const e of monthExpenses) {
    categoryTotals.set(e.categoryId, (categoryTotals.get(e.categoryId) || 0) + e.amount);
  }
  const pieChartData = Array.from(categoryTotals.entries()).map(([categoryId, amount]) => {
    const cat = catMap.get(categoryId);
    return { category: cat ? cat.name : 'Unknown', color: cat ? cat.color : '#94A3B8', amount };
  });

  const monthlyTrendLabels: string[] = [];
  const monthlyTrendData: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const sum = allExpenses.filter((e) => {
      const ed = new Date(e.date);
      return ed >= start && ed <= end;
    }).reduce((acc, e) => acc + e.amount, 0);
    monthlyTrendLabels.push(MONTH_NAMES[d.getMonth()]);
    monthlyTrendData.push(sum);
  }

  return {
    currentBalance,
    totalSalary,
    totalIncome,
    totalExpenses,
    totalMonthExpenses,
    totalLoanBalance,
    totalMonthlyEMI,
    savings,
    cashInHand,
    bankBalance,
    totalCreditCardDue,
    upcomingPayments: upcomingPayments as any,
    todayRemindersCount: todayReminders.length,
    todayReminders: todayReminders as any,
    monthlyBudget: totalBudget,
    monthlyRemaining,
    pieChartData,
    monthlyTrend: { labels: monthlyTrendLabels, data: monthlyTrendData },
  };
}
