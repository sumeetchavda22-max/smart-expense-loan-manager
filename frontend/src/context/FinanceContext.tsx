import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  DashboardData,
  Expense,
  Income,
  Salary,
  Loan,
  CreditCard,
  Account,
  Reminder,
  Settings,
  Category,
} from '../types/finance';

import * as api from '../services/api';

interface FinanceContextType {
  dashboard: DashboardData | null;
  expenses: Expense[];
  incomes: Income[];
  salaries: Salary[];
  loans: Loan[];
  creditCards: CreditCard[];
  accounts: Account[];
  reminders: Reminder[];
  categories: Category[];
  settings: Settings | null;
  currency: string;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  updateCurrency: (newCurr: string) => Promise<void>;
  triggerNotification: (title: string, body: string) => void;
}

const FinanceContext = createContext<FinanceContextType>({
  dashboard: null,
  expenses: [],
  incomes: [],
  salaries: [],
  loans: [],
  creditCards: [],
  accounts: [],
  reminders: [],
  categories: [],
  settings: null,
  currency: '₹',
  loading: true,
  error: null,
  refreshData: async () => {},
  updateCurrency: async () => {},
  triggerNotification: () => {},
});

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [currency, setCurrency] = useState<string>('₹');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const triggerNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.svg',
      });
    }
  };

  const checkDueRemindersAndNotify = (remList: Reminder[]) => {
    const today = new Date().toISOString().substring(0, 10);
    remList.forEach((r) => {
      if (!r.isCompleted) {
        const due = new Date(r.dueDate).toISOString().substring(0, 10);
        if (due === today && !r.isNotified) {
          triggerNotification(`Due Today: ${r.title}`, `Amount: ${currency}${r.amount.toLocaleString()}`);
        }
      }
    });
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dash, exp, inc, sal, loa, cr, acc, rem, cat, set] = await Promise.all([
        api.fetchDashboard().catch(() => null),
        api.fetchExpenses().catch(() => []),
        api.fetchIncomes().catch(() => []),
        api.fetchSalaries().catch(() => []),
        api.fetchLoans().catch(() => []),
        api.fetchCreditCards().catch(() => []),
        api.fetchAccounts().catch(() => []),
        api.fetchReminders().catch(() => []),
        api.fetchCategories().catch(() => []),
        api.fetchSettings().catch(() => null),
      ]);

      if (dash) setDashboard(dash);
      setExpenses(exp);
      setIncomes(inc);
      setSalaries(sal);
      setLoans(loa);
      setCreditCards(cr);
      setAccounts(acc);
      setReminders(rem);
      setCategories(cat);
      if (set) {
        setSettings(set);
        if (set.currency) setCurrency(set.currency);
      }

      checkDueRemindersAndNotify(rem);
    } catch (err: any) {
      console.error('Error fetching finance data:', err);
      setError(err.message || 'Error loading financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const updateCurrency = async (newCurr: string) => {
    setCurrency(newCurr);
    await api.updateSettings({ currency: newCurr });
  };

  return (
    <FinanceContext.Provider
      value={{
        dashboard,
        expenses,
        incomes,
        salaries,
        loans,
        creditCards,
        accounts,
        reminders,
        categories,
        settings,
        currency,
        loading,
        error,
        refreshData,
        updateCurrency,
        triggerNotification,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
