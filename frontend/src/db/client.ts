import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * On-device database. Everything the app stores lives in IndexedDB, in the browser
 * that opened the page — nothing is sent to a server. This is what makes "your data
 * stays on your phone" literally true once this is installed as a Home Screen app.
 *
 * Object shapes intentionally mirror the old Prisma models 1:1 (same field names)
 * so the rest of the app — which was written against that shape — needs no changes.
 */

export interface SettingsRow {
  id: 'default-settings';
  currency: string;
  language: string;
  theme: string;
  enableNotifications: boolean;
  pinLockEnabled: boolean;
  pinCode?: string | null;
  fingerprintEnabled: boolean;
  autoBackup: boolean;
  overspendingAlert: boolean;
  lowBalanceThreshold: number;
  notifyEmail?: string | null;
  emailRemindersEnabled?: boolean;
  emailDaysBefore?: number;
  emailSendHour?: number;
  lastEmailDigestDate?: string | null;
  updatedAt: string;
}

export interface AccountRow {
  id: string;
  name: string;
  type: string;
  balance: number;
  accountNumber?: string | null;
  bankName?: string | null;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem?: boolean;
}

export interface ExpenseRow {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  paymentMethod: string;
  accountId?: string | null;
  date: string;
  notes?: string | null;
  receiptId?: string | null; // -> receipts store; receiptUrl is derived at read time
  tags?: string | null;
  isRecurring?: boolean;
  repeatFrequency?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptRow {
  id: string; // same id as the owning expense
  blob: Blob;
  name: string;
  type: string;
}

export interface SalaryRow {
  id: string;
  companyName: string;
  monthlySalary: number;
  salaryDate: number;
  accountId: string;
  bonus: number;
  overtime: number;
  otherIncome: number;
  pfDeduction: number;
  profTax: number;
  tdsDeduction: number;
  otherDeductions: number;
  netSalary: number;
  inHandSalary: number;
  month: string;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanRow {
  id: string;
  name: string;
  type: string;
  bankName?: string | null;
  amount: number;
  interestRate: number;
  loanPeriodMonths: number;
  emiAmount: number;
  paidEmis: number;
  remainingEmis: number;
  outstandingBalance: number;
  startDate: string;
  nextDueDate: string;
  status: string;
  notes?: string | null;
  documents?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoanPaymentRow {
  id: string;
  loanId: string;
  amount: number;
  paymentDate: string;
  accountId?: string | null;
  emiNumber: number;
  principalPaid: number;
  interestPaid: number;
  notes?: string | null;
  createdAt: string;
}

export interface CreditCardRow {
  id: string;
  cardName: string;
  bankName: string;
  cardLimit: number;
  usedAmount: number;
  availableLimit: number;
  statementDate: number;
  dueDate: number;
  minimumDue: number;
  totalDue: number;
  interestRate: number;
  rewardPoints: number;
  lateFeeAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditPaymentRow {
  id: string;
  cardId: string;
  amount: number;
  paymentDate: string;
  accountId?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface TransferRow {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  notes?: string | null;
  createdAt: string;
}

export interface ReminderRow {
  id: string;
  title: string;
  type: string;
  amount: number;
  dueDate: string;
  dueTime: string;
  repeat: string;
  priority: string;
  isNotified: boolean;
  isCompleted: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetRow {
  id: string; // `${month}_${categoryId}`
  month: string;
  categoryId: string;
  limit: number;
  spent: number;
  createdAt: string;
  updatedAt: string;
}

interface SmartFinanceDB extends DBSchema {
  settings: { key: string; value: SettingsRow };
  accounts: { key: string; value: AccountRow };
  categories: { key: string; value: CategoryRow; indexes: { byName: string } };
  expenses: { key: string; value: ExpenseRow; indexes: { byDate: string; byCategory: string } };
  receipts: { key: string; value: ReceiptRow };
  salaries: { key: string; value: SalaryRow; indexes: { byMonth: string } };
  loans: { key: string; value: LoanRow; indexes: { byStatus: string } };
  loanPayments: { key: string; value: LoanPaymentRow; indexes: { byLoan: string } };
  creditCards: { key: string; value: CreditCardRow };
  creditPayments: { key: string; value: CreditPaymentRow; indexes: { byCard: string } };
  transfers: { key: string; value: TransferRow };
  reminders: { key: string; value: ReminderRow; indexes: { byDueDate: string } };
  budgets: { key: string; value: BudgetRow; indexes: { byMonth: string } };
}

const DB_NAME = 'smartfinance-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SmartFinanceDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<SmartFinanceDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SmartFinanceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('settings', { keyPath: 'id' });
        db.createObjectStore('accounts', { keyPath: 'id' });
        db.createObjectStore('categories', { keyPath: 'id' }).createIndex('byName', 'name', { unique: true });
        const exp = db.createObjectStore('expenses', { keyPath: 'id' });
        exp.createIndex('byDate', 'date');
        exp.createIndex('byCategory', 'categoryId');
        db.createObjectStore('receipts', { keyPath: 'id' });
        db.createObjectStore('salaries', { keyPath: 'id' }).createIndex('byMonth', 'month');
        db.createObjectStore('loans', { keyPath: 'id' }).createIndex('byStatus', 'status');
        db.createObjectStore('loanPayments', { keyPath: 'id' }).createIndex('byLoan', 'loanId');
        db.createObjectStore('creditCards', { keyPath: 'id' });
        db.createObjectStore('creditPayments', { keyPath: 'id' }).createIndex('byCard', 'cardId');
        db.createObjectStore('transfers', { keyPath: 'id' });
        db.createObjectStore('reminders', { keyPath: 'id' }).createIndex('byDueDate', 'dueDate');
        db.createObjectStore('budgets', { keyPath: 'id' }).createIndex('byMonth', 'month');
      },
    });
  }
  return dbPromise;
}

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const nowIso = (): string => new Date().toISOString();

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export const currentMonthStr = (d = new Date()): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
