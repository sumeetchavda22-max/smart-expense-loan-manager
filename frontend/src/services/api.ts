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

const API_BASE = '/api';

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

export async function fetchExpenses(): Promise<Expense[]> {
  const res = await fetch(`${API_BASE}/expenses`);
  if (!res.ok) throw new Error('Failed to fetch expenses');
  return res.json();
}

export async function createExpense(formData: FormData): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to create expense');
  return res.json();
}

export async function deleteExpense(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete expense');
}

export async function fetchSalaries(): Promise<Salary[]> {
  const res = await fetch(`${API_BASE}/salaries`);
  if (!res.ok) throw new Error('Failed to fetch salaries');
  return res.json();
}

export async function createSalary(data: any): Promise<Salary> {
  const res = await fetch(`${API_BASE}/salaries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create salary');
  return res.json();
}

export async function fetchLoans(): Promise<Loan[]> {
  const res = await fetch(`${API_BASE}/loans`);
  if (!res.ok) throw new Error('Failed to fetch loans');
  return res.json();
}

export async function createLoan(data: any): Promise<Loan> {
  const res = await fetch(`${API_BASE}/loans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create loan');
  return res.json();
}

export async function payLoanEMI(loanId: string, data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/loans/${loanId}/pay-emi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to pay loan EMI');
  return res.json();
}

export async function deleteLoan(loanId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/loans/${loanId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete loan');
}

export async function fetchCreditCards(): Promise<CreditCard[]> {
  const res = await fetch(`${API_BASE}/credit-cards`);
  if (!res.ok) throw new Error('Failed to fetch credit cards');
  return res.json();
}

export async function createCreditCard(data: any): Promise<CreditCard> {
  const res = await fetch(`${API_BASE}/credit-cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create credit card');
  return res.json();
}

export async function payCreditCard(cardId: string, data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/credit-cards/${cardId}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to pay credit card');
  return res.json();
}

export async function updateCreditCard(cardId: string, data: any): Promise<CreditCard> {
  const res = await fetch(`${API_BASE}/credit-cards/${cardId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update credit card');
  return res.json();
}

export async function deleteCreditCard(cardId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/credit-cards/${cardId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete credit card');
}

export async function fetchAccounts(): Promise<Account[]> {
  const res = await fetch(`${API_BASE}/accounts`);
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

export async function createAccount(data: any): Promise<Account> {
  const res = await fetch(`${API_BASE}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create account');
  return res.json();
}

export async function createTransfer(data: any): Promise<any> {
  const res = await fetch(`${API_BASE}/transfers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to perform transfer');
  return res.json();
}

export async function fetchReminders(): Promise<Reminder[]> {
  const res = await fetch(`${API_BASE}/reminders`);
  if (!res.ok) throw new Error('Failed to fetch reminders');
  return res.json();
}

export async function createReminder(data: any): Promise<Reminder> {
  const res = await fetch(`${API_BASE}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create reminder');
  return res.json();
}

export async function markReminderComplete(id: string): Promise<Reminder> {
  const res = await fetch(`${API_BASE}/reminders/${id}/complete`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to mark reminder complete');
  return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function fetchSettings(): Promise<Settings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function globalSearch(query: string): Promise<any> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to perform global search');
  return res.json();
}

export async function resetAllData(): Promise<any> {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset data');
  return res.json();
}

// ==========================================
// Email alerts & iPhone Calendar
// ==========================================
export async function fetchNotificationStatus(): Promise<NotificationStatus> {
  const res = await fetch(`${API_BASE}/notifications/status`);
  if (!res.ok) throw new Error('Failed to fetch notification status');
  return res.json();
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const sendTestEmail = (to?: string) => postJson<{ ok: boolean; to: string }>(`${API_BASE}/notifications/test`, to ? { to } : {});
export const sendDigestNow = () => postJson<{ sent: boolean; reason: string; count?: number }>(`${API_BASE}/notifications/send-now`);

/** URL of the .ics for one reminder — opening it on an iPhone shows "Add to Calendar". */
export const reminderIcsUrl = (id: string) => `${API_BASE}/reminders/${id}.ics`;
/** Subscribable calendar (auto-refreshes on the phone). */
export const calendarSubscribeUrl = () => `webcal://${window.location.host}${API_BASE}/calendar.ics`;
export const calendarDownloadUrl = () => `${API_BASE}/calendar.ics`;
