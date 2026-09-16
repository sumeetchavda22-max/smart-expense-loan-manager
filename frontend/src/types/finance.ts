export interface Account {
  id: string;
  name: string;
  type: 'CASH' | 'SAVINGS' | 'CURRENT' | 'WALLET' | 'UPI' | 'CREDIT_CARD';
  balance: number;
  bankName?: string;
  accountNumber?: string;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem?: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  category?: Category;
  paymentMethod: 'CASH' | 'UPI' | 'BANK' | 'CARD';
  accountId?: string;
  account?: Account;
  date: string;
  notes?: string;
  receiptUrl?: string;
  tags?: string;
  isRecurring?: boolean;
  repeatFrequency?: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
}

export type IncomeSource = 'SALARY' | 'FREELANCE' | 'BUSINESS' | 'GIFT' | 'INTEREST' | 'REFUND' | 'RENTAL' | 'OTHER';

export interface Income {
  id: string;
  title: string;
  amount: number;
  source: IncomeSource;
  accountId?: string;
  account?: Account;
  date: string;
  notes?: string;
}

export interface Salary {
  id: string;
  companyName: string;
  monthlySalary: number;
  salaryDate: number;
  accountId: string;
  account?: Account;
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
}

export type EmiFrequency = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface Loan {
  id: string;
  name: string;
  type: 'PERSONAL' | 'HOME' | 'CAR' | 'BIKE' | 'GOLD' | 'BUSINESS' | 'EDUCATION' | 'CREDIT' | 'FRIEND';
  bankName?: string;
  amount: number;
  emiAmount: number;
  emiFrequency: EmiFrequency;
  totalEmis: number;
  paidEmis: number;
  remainingEmis: number;
  outstandingBalance: number;
  startDate: string;
  nextDueDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CLOSED';
  notes?: string;
  documents?: string;
  payments?: LoanPayment[];
}

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  paymentDate: string;
  accountId?: string;
  emiNumber: number;
  notes?: string;
}

export interface CreditCard {
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
}

export interface CreditPayment {
  id: string;
  cardId: string;
  amount: number;
  paymentDate: string;
  accountId?: string;
  notes?: string;
}

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Reminder {
  id: string;
  title: string;
  type: 'LOAN_EMI' | 'CREDIT_CARD' | 'ELECTRICITY' | 'WATER' | 'GAS' | 'RECHARGE' | 'INTERNET' | 'INSURANCE' | 'RENT' | 'SALARY' | 'INVESTMENT' | 'CUSTOM';
  amount: number;
  dueDate: string;
  dueTime: string;
  repeat: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isNotified: boolean;
  isCompleted: boolean;
  notes?: string;
}

export interface DashboardData {
  currentBalance: number;
  /** Assets (account balances) minus liabilities (loans outstanding + credit card dues) — the
   * "Net Worth" side of the Dashboard toggle. `currentBalance` itself is the "Balance" side and
   * never has liabilities netted into it. */
  netWorth: number;
  totalSalary: number;
  totalIncome: number;
  totalExpenses: number;
  totalMonthExpenses: number;
  totalLoanBalance: number;
  totalMonthlyEMI: number;
  savings: number;
  cashInHand: number;
  bankBalance: number;
  totalCreditCardDue: number;
  upcomingPayments: Reminder[];
  todayRemindersCount: number;
  todayReminders: Reminder[];
  monthlyBudget: number;
  monthlyRemaining: number;
  pieChartData: { category: string; color: string; amount: number }[];
  monthlyTrend?: { labels: string[]; data: number[] };
}

export interface Settings {
  id: string;
  currency: string;
  language: string;
  theme: 'light' | 'dark';
  enableNotifications: boolean;
  pinLockEnabled: boolean;
  pinCode?: string;
  fingerprintEnabled: boolean;
  autoBackup: boolean;
  overspendingAlert: boolean;
  lowBalanceThreshold: number;
  // Email reminder alerts
  notifyEmail?: string | null;
  emailRemindersEnabled?: boolean;
  emailDaysBefore?: number;
  emailSendHour?: number;
  lastEmailDigestDate?: string | null;
}

export interface NotificationStatus {
  smtpConfigured: boolean;
  smtpUser: string | null;
  notifyEmail: string | null;
  enabled: boolean;
  daysBefore: number;
  sendHour: number;
  lastDigestDate: string | null;
  dueNow: number;
}
