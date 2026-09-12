import { getDb, uid, nowIso, round2, currentMonthStr, SettingsRow } from './client';
import { ensureSeeded } from './seed';

/**
 * All CRUD logic, ported 1:1 from the old Express/Prisma routes (backend/src/routes/finance.ts)
 * so behaviour — auto EMI math, balance updates, dedupe, etc. — matches exactly. The only
 * difference is *where* it runs: entirely in this browser tab, against IndexedDB.
 */

async function ready() {
  await ensureSeeded();
  return getDb();
}

// ==========================================
// Accounts
// ==========================================
export async function listAccounts() {
  const db = await ready();
  const all = await db.getAll('accounts');
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createAccount(data: any) {
  const db = await ready();
  const now = nowIso();
  const row = {
    id: uid(),
    name: data.name,
    type: data.type,
    balance: Number(data.balance) || 0,
    bankName: data.bankName ?? null,
    accountNumber: data.accountNumber ?? null,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.add('accounts', row);
  return row;
}

async function adjustAccountBalance(accountId: string | null | undefined, delta: number) {
  if (!accountId) return;
  const db = await getDb();
  const acc = await db.get('accounts', accountId);
  if (!acc) return;
  acc.balance = round2(acc.balance + delta);
  acc.updatedAt = nowIso();
  await db.put('accounts', acc);
}

export async function createTransfer(data: any) {
  const db = await ready();
  const { fromAccountId, toAccountId, amount, notes } = data;
  const numAmount = Number(amount);
  if (fromAccountId === toAccountId) throw new Error('Source and destination accounts must be different');

  const row = { id: uid(), fromAccountId, toAccountId, amount: numAmount, date: nowIso(), notes, createdAt: nowIso() };
  await db.add('transfers', row);
  await adjustAccountBalance(fromAccountId, -numAmount);
  await adjustAccountBalance(toAccountId, numAmount);
  return row;
}

// ==========================================
// Categories
// ==========================================
export async function listCategories() {
  const db = await ready();
  return db.getAll('categories');
}

// ==========================================
// Expenses
// ==========================================
export async function listExpenses() {
  const db = await ready();
  const [expenses, categories, accounts] = await Promise.all([db.getAll('expenses'), db.getAll('categories'), db.getAll('accounts')]);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));

  const withMedia = await Promise.all(
    expenses.map(async (e) => {
      let receiptUrl: string | undefined;
      if (e.receiptId) {
        const receipt = await db.get('receipts', e.receiptId);
        if (receipt) receiptUrl = URL.createObjectURL(receipt.blob);
      }
      return {
        ...e,
        category: catMap.get(e.categoryId),
        account: e.accountId ? accMap.get(e.accountId) : undefined,
        receiptUrl,
      };
    })
  );

  return withMedia.sort((a, b) => b.date.localeCompare(a.date));
}

/** Accepts a FormData (same shape the UI already builds) or a plain object. */
export async function createExpense(input: FormData | Record<string, any>) {
  const db = await ready();
  const get = (key: string) => (input instanceof FormData ? (input.get(key) as string | null) ?? undefined : input[key]);
  const file = input instanceof FormData ? (input.get('receipt') as File | null) : (input as any).receipt;

  const id = uid();
  const now = nowIso();
  const amount = Number(get('amount'));
  const accountId = get('accountId') || null;

  let receiptId: string | null = null;
  if (file && file instanceof File && file.size > 0) {
    receiptId = id;
    await db.put('receipts', { id: receiptId, blob: file, name: file.name, type: file.type });
  }

  const row = {
    id,
    title: get('title'),
    amount,
    categoryId: get('categoryId'),
    paymentMethod: get('paymentMethod'),
    accountId,
    date: get('date') ? new Date(get('date') as string).toISOString() : now,
    notes: get('notes') || null,
    receiptId,
    tags: get('tags') || null,
    isRecurring: get('isRecurring') === 'true' || get('isRecurring') === true,
    repeatFrequency: get('repeatFrequency') || null,
    createdAt: now,
    updatedAt: now,
  };
  await db.add('expenses', row);

  if (accountId) await adjustAccountBalance(accountId, -amount);

  const [category, account] = await Promise.all([db.get('categories', row.categoryId), accountId ? db.get('accounts', accountId) : undefined]);
  return { ...row, category, account, receiptUrl: file ? URL.createObjectURL(file) : undefined };
}

export async function deleteExpense(id: string) {
  const db = await ready();
  const exp = await db.get('expenses', id);
  if (exp?.accountId) await adjustAccountBalance(exp.accountId, exp.amount);
  if (exp?.receiptId) await db.delete('receipts', exp.receiptId);
  await db.delete('expenses', id);
}

// ==========================================
// Salaries
// ==========================================
export async function listSalaries() {
  const db = await ready();
  const [salaries, accounts] = await Promise.all([db.getAll('salaries'), db.getAll('accounts')]);
  const accMap = new Map(accounts.map((a) => [a.id, a]));
  return salaries
    .map((s) => ({ ...s, account: accMap.get(s.accountId) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createSalary(data: any) {
  const db = await ready();
  const {
    companyName,
    monthlySalary,
    salaryDate,
    accountId,
    bonus = 0,
    overtime = 0,
    otherIncome = 0,
    pfDeduction = 0,
    profTax = 0,
    tdsDeduction = 0,
    otherDeductions = 0,
    month,
  } = data;

  const grossSalary = Number(monthlySalary) + Number(bonus) + Number(overtime) + Number(otherIncome);
  const totalDeduction = Number(pfDeduction) + Number(profTax) + Number(tdsDeduction) + Number(otherDeductions);
  const netSalary = grossSalary - totalDeduction;

  const [activeLoans, creditCards] = await Promise.all([
    db.getAllFromIndex('loans', 'byStatus', 'ACTIVE'),
    db.getAll('creditCards'),
  ]);
  const totalLoanEMI = activeLoans.reduce((acc, l) => acc + l.emiAmount, 0);
  const totalCreditEMI = creditCards.reduce((acc, c) => acc + c.minimumDue, 0);
  const inHandSalary = Math.max(0, netSalary - totalLoanEMI - totalCreditEMI);

  const now = nowIso();
  const row = {
    id: uid(),
    companyName,
    monthlySalary: Number(monthlySalary),
    salaryDate: Number(salaryDate),
    accountId,
    bonus: Number(bonus),
    overtime: Number(overtime),
    otherIncome: Number(otherIncome),
    pfDeduction: Number(pfDeduction),
    profTax: Number(profTax),
    tdsDeduction: Number(tdsDeduction),
    otherDeductions: Number(otherDeductions),
    netSalary,
    inHandSalary,
    month: month || currentMonthStr(),
    paymentDate: now,
    createdAt: now,
    updatedAt: now,
  };
  await db.add('salaries', row);
  await adjustAccountBalance(accountId, inHandSalary);

  const account = await db.get('accounts', accountId);
  return { ...row, account };
}

// ==========================================
// Loans
// ==========================================
export async function listLoans() {
  const db = await ready();
  const [loans, payments] = await Promise.all([db.getAll('loans'), db.getAll('loanPayments')]);
  return loans
    .map((l) => ({ ...l, payments: payments.filter((p) => p.loanId === l.id) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createLoan(data: any) {
  const db = await ready();
  const { name, type, bankName, amount, interestRate, loanPeriodMonths, emiAmount, startDate, nextDueDate, notes, documents } = data;

  const numAmount = Number(amount);
  const numPeriod = Number(loanPeriodMonths);
  const numInterest = Number(interestRate);

  let calcEmi = Number(emiAmount);
  if (!calcEmi || calcEmi <= 0) {
    const monthlyRate = numInterest / 12 / 100;
    calcEmi =
      monthlyRate > 0
        ? (numAmount * monthlyRate * Math.pow(1 + monthlyRate, numPeriod)) / (Math.pow(1 + monthlyRate, numPeriod) - 1)
        : numAmount / numPeriod;
  }

  const now = nowIso();
  const row = {
    id: uid(),
    name,
    type,
    bankName: bankName ?? null,
    amount: numAmount,
    interestRate: numInterest,
    loanPeriodMonths: numPeriod,
    emiAmount: round2(calcEmi),
    paidEmis: 0,
    remainingEmis: numPeriod,
    outstandingBalance: numAmount,
    startDate: startDate ? new Date(startDate).toISOString() : now,
    nextDueDate: nextDueDate ? new Date(nextDueDate).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
    status: 'ACTIVE',
    notes: notes ?? null,
    documents: documents ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await db.add('loans', row);
  return row;
}

export async function payLoanEMI(loanId: string, data: any) {
  const db = await ready();
  const { accountId, notes } = data;
  const loan = await db.get('loans', loanId);
  if (!loan) throw new Error('Loan not found');

  const emiNumber = loan.paidEmis + 1;
  const monthlyRate = loan.interestRate / 12 / 100;
  const interestPaid = round2(loan.outstandingBalance * monthlyRate);
  const principalPaid = Math.max(0, round2(loan.emiAmount - interestPaid));

  const newPaidEmis = loan.paidEmis + 1;
  const newRemainingEmis = Math.max(0, loan.loanPeriodMonths - newPaidEmis);
  const newOutstanding = Math.max(0, round2(loan.outstandingBalance - principalPaid));

  const payment = {
    id: uid(),
    loanId,
    amount: loan.emiAmount,
    paymentDate: nowIso(),
    accountId: accountId ?? null,
    emiNumber,
    principalPaid,
    interestPaid,
    notes: notes ?? null,
    createdAt: nowIso(),
  };
  await db.add('loanPayments', payment);

  const isCompleted = newRemainingEmis === 0 || newOutstanding <= 0;
  loan.paidEmis = newPaidEmis;
  loan.remainingEmis = newRemainingEmis;
  loan.outstandingBalance = newOutstanding;
  loan.status = isCompleted ? 'COMPLETED' : 'ACTIVE';
  loan.nextDueDate = new Date(Date.now() + 30 * 86400000).toISOString();
  loan.updatedAt = nowIso();
  await db.put('loans', loan);

  if (accountId) await adjustAccountBalance(accountId, -loan.emiAmount);
  return payment;
}

export async function deleteLoan(loanId: string) {
  const db = await ready();
  const tx = db.transaction('loanPayments', 'readwrite');
  const idx = tx.store.index('byLoan');
  for await (const cursor of idx.iterate(loanId)) {
    await cursor.delete();
  }
  await tx.done;
  await db.delete('loans', loanId);
}

// ==========================================
// Credit Cards
// ==========================================
export async function listCreditCards() {
  const db = await ready();
  const [cards, payments] = await Promise.all([db.getAll('creditCards'), db.getAll('creditPayments')]);
  return cards.map((c) => ({ ...c, payments: payments.filter((p) => p.cardId === c.id) }));
}

export async function createCreditCard(data: any) {
  const db = await ready();
  const { cardName, bankName, cardLimit, usedAmount = 0, statementDate, dueDate, interestRate } = data;
  const limit = Number(cardLimit);
  const used = Number(usedAmount) || 0;
  const available = Math.max(0, limit - used);
  const totalDue = used;
  const minimumDue = Math.round(totalDue * 0.05);

  const now = nowIso();
  const row = {
    id: uid(),
    cardName,
    bankName,
    cardLimit: limit,
    usedAmount: used,
    availableLimit: available,
    statementDate: Number(statementDate) || 1,
    dueDate: Number(dueDate) || 15,
    minimumDue,
    totalDue,
    interestRate: Number(interestRate) || 3.5,
    rewardPoints: 0,
    lateFeeAmount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.add('creditCards', row);
  return row;
}

export async function payCreditCard(cardId: string, data: any) {
  const db = await ready();
  const { amount, accountId, notes } = data;
  const card = await db.get('creditCards', cardId);
  if (!card) throw new Error('Card not found');

  const payAmount = Number(amount);
  const newUsed = Math.max(0, card.usedAmount - payAmount);
  const newAvailable = Math.min(card.cardLimit, card.cardLimit - newUsed);
  const newTotalDue = Math.max(0, card.totalDue - payAmount);

  const payment = { id: uid(), cardId, amount: payAmount, paymentDate: nowIso(), accountId: accountId ?? null, notes: notes ?? null, createdAt: nowIso() };
  await db.add('creditPayments', payment);

  card.usedAmount = newUsed;
  card.availableLimit = newAvailable;
  card.totalDue = newTotalDue;
  card.minimumDue = Math.round(newTotalDue * 0.05);
  card.updatedAt = nowIso();
  await db.put('creditCards', card);

  if (accountId) await adjustAccountBalance(accountId, -payAmount);
  return payment;
}

export async function updateCreditCard(cardId: string, data: any) {
  const db = await ready();
  const existing = await db.get('creditCards', cardId);
  if (!existing) throw new Error('Card not found');

  const limit = data.cardLimit !== undefined ? Number(data.cardLimit) : existing.cardLimit;
  const used = data.usedAmount !== undefined ? Number(data.usedAmount) : existing.usedAmount;
  const available = Math.max(0, limit - used);
  const totalDue = used;
  const minimumDue = Math.round(totalDue * 0.05);

  const updated = {
    ...existing,
    cardName: data.cardName || existing.cardName,
    bankName: data.bankName !== undefined ? data.bankName : existing.bankName,
    cardLimit: limit,
    usedAmount: used,
    availableLimit: available,
    statementDate: data.statementDate !== undefined ? Number(data.statementDate) : existing.statementDate,
    dueDate: data.dueDate !== undefined ? Number(data.dueDate) : existing.dueDate,
    minimumDue,
    totalDue,
    interestRate: data.interestRate !== undefined ? Number(data.interestRate) : existing.interestRate,
    updatedAt: nowIso(),
  };
  await db.put('creditCards', updated);
  return updated;
}

export async function deleteCreditCard(cardId: string) {
  const db = await ready();
  const tx = db.transaction('creditPayments', 'readwrite');
  const idx = tx.store.index('byCard');
  for await (const cursor of idx.iterate(cardId)) {
    await cursor.delete();
  }
  await tx.done;
  await db.delete('creditCards', cardId);
}

// ==========================================
// Reminders
// ==========================================
export async function listReminders() {
  const db = await ready();
  const all = await db.getAll('reminders');
  return all.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export async function createReminder(data: any) {
  const db = await ready();
  const { title, type, amount, dueDate, dueTime, repeat, priority, notes } = data;
  const now = nowIso();
  const row = {
    id: uid(),
    title,
    type,
    amount: Number(amount),
    dueDate: new Date(dueDate).toISOString(),
    dueTime: dueTime || '09:00',
    repeat: repeat || 'NONE',
    priority: priority || 'MEDIUM',
    isNotified: false,
    isCompleted: false,
    notes: notes ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await db.add('reminders', row);
  return row;
}

export async function markReminderComplete(id: string) {
  const db = await ready();
  const rem = await db.get('reminders', id);
  if (!rem) throw new Error('Reminder not found');
  rem.isCompleted = true;
  rem.updatedAt = nowIso();
  await db.put('reminders', rem);
  return rem;
}

// ==========================================
// Budgets
// ==========================================
export async function listBudgets(month?: string) {
  const db = await ready();
  const targetMonth = month || currentMonthStr();
  const [budgets, categories] = await Promise.all([db.getAllFromIndex('budgets', 'byMonth', targetMonth), db.getAll('categories')]);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  return budgets.map((b) => ({ ...b, category: catMap.get(b.categoryId) }));
}

export async function upsertBudget(data: any) {
  const db = await ready();
  const { month, categoryId, limit } = data;
  const id = `${month}_${categoryId}`;
  const existing = await db.get('budgets', id);
  const now = nowIso();
  const row = { id, month, categoryId, limit: Number(limit), spent: existing?.spent || 0, createdAt: existing?.createdAt || now, updatedAt: now };
  await db.put('budgets', row);
  return row;
}

// ==========================================
// Settings
// ==========================================
export async function getSettings(): Promise<SettingsRow> {
  const db = await ready();
  const s = await db.get('settings', 'default-settings');
  return s!;
}

export async function updateSettings(data: Partial<SettingsRow>) {
  const db = await ready();
  const existing = await db.get('settings', 'default-settings');
  const updated: SettingsRow = { ...(existing as SettingsRow), ...data, id: 'default-settings', updatedAt: nowIso() };
  await db.put('settings', updated);
  return updated;
}

// ==========================================
// Global search
// ==========================================
export async function globalSearch(query: string) {
  const q = query.toLowerCase();
  if (!q) return { expenses: [], loans: [], salaries: [], reminders: [], accounts: [], creditCards: [] };
  const db = await ready();
  const [expenses, loans, salaries, reminders, accounts, creditCards, categories] = await Promise.all([
    db.getAll('expenses'),
    db.getAll('loans'),
    db.getAll('salaries'),
    db.getAll('reminders'),
    db.getAll('accounts'),
    db.getAll('creditCards'),
    db.getAll('categories'),
  ]);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const has = (s: string | null | undefined) => (s || '').toLowerCase().includes(q);

  return {
    expenses: expenses
      .filter((e) => has(e.title) || has(e.notes) || has(e.tags))
      .slice(0, 10)
      .map((e) => ({ ...e, category: catMap.get(e.categoryId) })),
    loans: loans.filter((l) => has(l.name) || has(l.bankName)).slice(0, 10),
    salaries: salaries.filter((s) => has(s.companyName)).slice(0, 10),
    reminders: reminders.filter((r) => has(r.title)).slice(0, 10),
    accounts: accounts.filter((a) => has(a.name)).slice(0, 10),
    creditCards: creditCards.filter((c) => has(c.cardName)).slice(0, 10),
  };
}
