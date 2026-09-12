import {
  DashboardData,
  Expense,
  Salary,
  Loan,
  CreditCard,
  Account,
  Reminder,
  Settings,
  Category,
  NotificationStatus,
} from '../types/finance';

import * as repo from '../db/repo';
import { computeDashboard } from '../db/dashboard';
import { resetAllData as resetAllDataImpl } from '../db/seed';
import { exportBackup, importBackup } from '../db/backup';
import { exportCsv, exportExcel, exportPdf } from '../db/exporters';
import { downloadFullCalendarIcs, downloadReminderIcs } from '../db/ics';
import { relayStatus, sendDigestNow as sendDigestNowImpl, sendTestEmail as sendTestEmailImpl, composeMailto as composeMailtoImpl } from '../db/email';
import { collectDueItems } from '../db/dueItems';

/**
 * Same function names/shapes as the old fetch()-based client — every page and context
 * that calls `api.*` keeps working unchanged. The only thing that moved is *where* the
 * work happens: all of it now runs in this browser tab, against IndexedDB, with no
 * network request and no server involved.
 */

export async function fetchDashboard(): Promise<DashboardData> {
  return computeDashboard();
}

export async function fetchExpenses(): Promise<Expense[]> {
  return repo.listExpenses() as unknown as Promise<Expense[]>;
}

export async function createExpense(formData: FormData): Promise<Expense> {
  return repo.createExpense(formData) as unknown as Promise<Expense>;
}

export async function deleteExpense(id: string): Promise<void> {
  return repo.deleteExpense(id);
}

export async function fetchSalaries(): Promise<Salary[]> {
  return repo.listSalaries() as unknown as Promise<Salary[]>;
}

export async function createSalary(data: any): Promise<Salary> {
  return repo.createSalary(data) as unknown as Promise<Salary>;
}

export async function fetchLoans(): Promise<Loan[]> {
  return repo.listLoans() as unknown as Promise<Loan[]>;
}

export async function createLoan(data: any): Promise<Loan> {
  return repo.createLoan(data) as unknown as Promise<Loan>;
}

export async function payLoanEMI(loanId: string, data: any): Promise<any> {
  return repo.payLoanEMI(loanId, data);
}

export async function deleteLoan(loanId: string): Promise<void> {
  return repo.deleteLoan(loanId);
}

export async function fetchCreditCards(): Promise<CreditCard[]> {
  return repo.listCreditCards() as unknown as Promise<CreditCard[]>;
}

export async function createCreditCard(data: any): Promise<CreditCard> {
  return repo.createCreditCard(data) as unknown as Promise<CreditCard>;
}

export async function payCreditCard(cardId: string, data: any): Promise<any> {
  return repo.payCreditCard(cardId, data);
}

export async function updateCreditCard(cardId: string, data: any): Promise<CreditCard> {
  return repo.updateCreditCard(cardId, data) as unknown as Promise<CreditCard>;
}

export async function deleteCreditCard(cardId: string): Promise<void> {
  return repo.deleteCreditCard(cardId);
}

export async function fetchAccounts(): Promise<Account[]> {
  return repo.listAccounts() as unknown as Promise<Account[]>;
}

export async function createAccount(data: any): Promise<Account> {
  return repo.createAccount(data) as unknown as Promise<Account>;
}

export async function createTransfer(data: any): Promise<any> {
  return repo.createTransfer(data);
}

export async function fetchReminders(): Promise<Reminder[]> {
  return repo.listReminders() as unknown as Promise<Reminder[]>;
}

export async function createReminder(data: any): Promise<Reminder> {
  return repo.createReminder(data) as unknown as Promise<Reminder>;
}

export async function markReminderComplete(id: string): Promise<Reminder> {
  return repo.markReminderComplete(id) as unknown as Promise<Reminder>;
}

export async function fetchCategories(): Promise<Category[]> {
  return repo.listCategories() as unknown as Promise<Category[]>;
}

export async function fetchSettings(): Promise<Settings> {
  return repo.getSettings() as unknown as Promise<Settings>;
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
  return repo.updateSettings(data as any) as unknown as Promise<Settings>;
}

export async function globalSearch(query: string): Promise<any> {
  return repo.globalSearch(query);
}

export async function resetAllData(): Promise<any> {
  await resetAllDataImpl();
  return { success: true };
}

// ==========================================
// Backup & restore (the on-device "file manager" flow)
// ==========================================
export const downloadBackup = () => exportBackup();
export const restoreBackup = (file: File) => importBackup(file);

// ==========================================
// Reports export (client-generated PDF/Excel/CSV)
// ==========================================
export const exportReportPdf = (currency: string) => exportPdf(currency);
export const exportReportExcel = () => exportExcel();
export const exportReportCsv = () => exportCsv();

// ==========================================
// iPhone Calendar (.ics) — generated + downloaded on demand, no server
// ==========================================
export const downloadReminderCalendar = (id: string, currency: string) => downloadReminderIcs(id, currency);
export const downloadFullCalendar = (currency: string) => downloadFullCalendarIcs(currency);

// ==========================================
// Email alerts
// ==========================================
export async function fetchNotificationStatus(): Promise<NotificationStatus> {
  const [settings, relay, due] = await Promise.all([repo.getSettings(), relayStatus(), collectDueItems((await repo.getSettings()).emailDaysBefore ?? 1)]);
  return {
    smtpConfigured: relay.configured,
    smtpUser: null,
    notifyEmail: settings.notifyEmail || null,
    enabled: !!settings.emailRemindersEnabled,
    daysBefore: settings.emailDaysBefore ?? 1,
    sendHour: settings.emailSendHour ?? 8,
    lastDigestDate: settings.lastEmailDigestDate || null,
    dueNow: due.length,
  };
}

export const sendTestEmail = (to: string) => sendTestEmailImpl(to);
export const sendDigestNow = () => sendDigestNowImpl();
export const composeMailto = () => composeMailtoImpl();
