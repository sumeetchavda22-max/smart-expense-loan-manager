import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { sendReminderCreatedEmail, smtpConfigured } from '../services/notifier';

const prisma = new PrismaClient();
const router = Router();

// Multer setup for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ==========================================
// 1. DASHBOARD
// ==========================================
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Accounts
    const accounts = await prisma.account.findMany();
    const bankAccounts = accounts.filter((a) => a.type === 'SAVINGS' || a.type === 'CURRENT');
    const cashAccount = accounts.find((a) => a.type === 'CASH');

    const bankBalance = bankAccounts.reduce((acc, a) => acc + a.balance, 0);
    const cashInHand = cashAccount ? cashAccount.balance : 0;
    const currentBalance = accounts.reduce((acc, a) => acc + (a.type === 'CREDIT_CARD' ? 0 : a.balance), 0);

    // Month Salary & Total Salary
    const salaries = await prisma.salary.findMany({
      where: { month: currentMonthStr },
    });
    const totalSalary = salaries.reduce((acc, s) => acc + s.inHandSalary, 0);

    // Month Expenses
    const monthExpenses = await prisma.expense.aggregate({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    });
    const totalMonthExpenses = monthExpenses._sum.amount || 0;

    // All-time Total Expenses
    const allExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
    });
    const totalExpenses = allExpenses._sum.amount || 0;

    // Active Loans & EMIs
    const activeLoans = await prisma.loan.findMany({ where: { status: 'ACTIVE' } });
    const totalLoanBalance = activeLoans.reduce((acc, l) => acc + l.outstandingBalance, 0);
    const totalMonthlyEMI = activeLoans.reduce((acc, l) => acc + l.emiAmount, 0);

    // Credit Cards
    const creditCards = await prisma.creditCard.findMany();
    const totalCreditCardDue = creditCards.reduce((acc, c) => acc + c.totalDue, 0);

    // Savings Calculation (In-Hand Salary - Month Expenses)
    const savings = Math.max(0, totalSalary - totalMonthExpenses);

    // Upcoming Dues / Reminders Today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const todayReminders = await prisma.reminder.findMany({
      where: {
        dueDate: { gte: todayStart, lte: todayEnd },
        isCompleted: false,
      },
    });

    const upcomingPayments = await prisma.reminder.findMany({
      where: {
        dueDate: { gte: todayEnd },
        isCompleted: false,
      },
      take: 5,
      orderBy: { dueDate: 'asc' },
    });

    // Budget Progress for current month
    const budgets = await prisma.budget.findMany({
      where: { month: currentMonthStr },
      include: { category: true },
    });

    const totalBudget = budgets.reduce((acc, b) => acc + b.limit, 0);
    const monthlyRemaining = Math.max(0, totalBudget - totalMonthExpenses);

    // Pie chart: Expenses by Category for current month
    const categoryExpenses = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    });

    const categories = await prisma.category.findMany();
    const pieChartData = categoryExpenses.map((ce) => {
      const cat = categories.find((c) => c.id === ce.categoryId);
      return {
        category: cat ? cat.name : 'Unknown',
        color: cat ? cat.color : '#94A3B8',
        amount: ce._sum.amount || 0,
      };
    });

    // Monthly trend calculation for last 6 months
    const monthlyTrendLabels: string[] = [];
    const monthlyTrendData: number[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const mExp = await prisma.expense.aggregate({
        where: { date: { gte: start, lte: end } },
        _sum: { amount: true },
      });

      monthlyTrendLabels.push(monthNames[d.getMonth()]);
      monthlyTrendData.push(mExp._sum.amount || 0);
    }

    return res.json({
      currentBalance,
      totalSalary,
      totalExpenses,
      totalMonthExpenses,
      totalLoanBalance,
      totalMonthlyEMI,
      savings,
      cashInHand,
      bankBalance,
      totalCreditCardDue,
      upcomingPayments,
      todayRemindersCount: todayReminders.length,
      todayReminders,
      monthlyBudget: totalBudget,
      monthlyRemaining,
      pieChartData,
      monthlyTrend: {
        labels: monthlyTrendLabels,
        data: monthlyTrendData,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. SALARY API
// ==========================================
router.get('/salaries', async (req, res) => {
  try {
    const list = await prisma.salary.findMany({
      include: { account: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/salaries', async (req, res) => {
  try {
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
    } = req.body;

    const grossSalary = Number(monthlySalary) + Number(bonus) + Number(overtime) + Number(otherIncome);
    const totalDeduction = Number(pfDeduction) + Number(profTax) + Number(tdsDeduction) + Number(otherDeductions);
    const netSalary = grossSalary - totalDeduction;

    // Auto deduct active EMIs if applicable
    const activeLoans = await prisma.loan.findMany({ where: { status: 'ACTIVE' } });
    const totalLoanEMI = activeLoans.reduce((acc, l) => acc + l.emiAmount, 0);

    const creditCards = await prisma.creditCard.findMany();
    const totalCreditEMI = creditCards.reduce((acc, c) => acc + c.minimumDue, 0);

    const inHandSalary = Math.max(0, netSalary - totalLoanEMI - totalCreditEMI);

    const salary = await prisma.salary.create({
      data: {
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
        month: month || new Date().toISOString().substring(0, 7),
      },
      include: { account: true },
    });

    // Automatically update target Bank Account balance
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: { increment: inHandSalary } },
    });

    res.json(salary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. EXPENSES API
// ==========================================
router.get('/expenses', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: { category: true, account: true },
      orderBy: { date: 'desc' },
    });
    res.json(expenses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/expenses', upload.single('receipt'), async (req, res) => {
  try {
    const { title, amount, categoryId, paymentMethod, accountId, date, notes, tags, isRecurring, repeatFrequency } =
      req.body;

    const receiptUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: Number(amount),
        categoryId,
        paymentMethod,
        accountId: accountId || null,
        date: date ? new Date(date) : new Date(),
        notes,
        receiptUrl,
        tags,
        isRecurring: isRecurring === 'true' || isRecurring === true,
        repeatFrequency,
      },
      include: { category: true, account: true },
    });

    // Deduct amount from account if assigned
    if (accountId) {
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: { decrement: Number(amount) } },
      });
    }

    res.json(expense);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const exp = await prisma.expense.findUnique({ where: { id } });
    if (exp && exp.accountId) {
      // Revert account balance
      await prisma.account.update({
        where: { id: exp.accountId },
        data: { balance: { increment: exp.amount } },
      });
    }
    await prisma.expense.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. LOANS API
// ==========================================
router.get('/loans', async (req, res) => {
  try {
    const loans = await prisma.loan.findMany({
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(loans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/loans', async (req, res) => {
  try {
    const {
      name,
      type,
      bankName,
      amount,
      interestRate,
      loanPeriodMonths,
      emiAmount,
      startDate,
      nextDueDate,
      notes,
      documents,
    } = req.body;

    const numAmount = Number(amount);
    const numPeriod = Number(loanPeriodMonths);
    const numInterest = Number(interestRate);

    // Auto EMI calculation if not provided
    let calcEmi = Number(emiAmount);
    if (!calcEmi || calcEmi <= 0) {
      const monthlyRate = numInterest / 12 / 100;
      if (monthlyRate > 0) {
        calcEmi = (numAmount * monthlyRate * Math.pow(1 + monthlyRate, numPeriod)) / (Math.pow(1 + monthlyRate, numPeriod) - 1);
      } else {
        calcEmi = numAmount / numPeriod;
      }
    }

    const loan = await prisma.loan.create({
      data: {
        name,
        type,
        bankName,
        amount: numAmount,
        interestRate: numInterest,
        loanPeriodMonths: numPeriod,
        emiAmount: Math.round(calcEmi * 100) / 100,
        paidEmis: 0,
        remainingEmis: numPeriod,
        outstandingBalance: numAmount,
        startDate: startDate ? new Date(startDate) : new Date(),
        nextDueDate: nextDueDate ? new Date(nextDueDate) : new Date(Date.now() + 30 * 86400000),
        status: 'ACTIVE',
        notes,
        documents,
      },
    });

    res.json(loan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/loans/:id/pay-emi', async (req, res) => {
  try {
    const { id } = req.params;
    const { accountId, notes } = req.body;

    const loan = await prisma.loan.findUnique({ where: { id } });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    const emiNumber = loan.paidEmis + 1;
    const monthlyRate = loan.interestRate / 12 / 100;
    const interestPaid = Math.round(loan.outstandingBalance * monthlyRate * 100) / 100;
    const principalPaid = Math.max(0, Math.round((loan.emiAmount - interestPaid) * 100) / 100);

    const newPaidEmis = loan.paidEmis + 1;
    const newRemainingEmis = Math.max(0, loan.loanPeriodMonths - newPaidEmis);
    const newOutstanding = Math.max(0, Math.round((loan.outstandingBalance - principalPaid) * 100) / 100);

    const payment = await prisma.loanPayment.create({
      data: {
        loanId: id,
        amount: loan.emiAmount,
        accountId: accountId || null,
        emiNumber,
        principalPaid,
        interestPaid,
        notes,
      },
    });

    // Update Loan status
    const isCompleted = newRemainingEmis === 0 || newOutstanding <= 0;
    await prisma.loan.update({
      where: { id },
      data: {
        paidEmis: newPaidEmis,
        remainingEmis: newRemainingEmis,
        outstandingBalance: newOutstanding,
        status: isCompleted ? 'COMPLETED' : 'ACTIVE',
        nextDueDate: new Date(Date.now() + 30 * 86400000),
      },
    });

    // Deduct from account if provided
    if (accountId) {
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: { decrement: loan.emiAmount } },
      });
    }

    res.json(payment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/loans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.loanPayment.deleteMany({ where: { loanId: id } });
    await prisma.loan.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. CREDIT CARDS API
// ==========================================
router.get('/credit-cards', async (req, res) => {
  try {
    const cards = await prisma.creditCard.findMany({
      include: { payments: true },
    });
    res.json(cards);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/credit-cards', async (req, res) => {
  try {
    const { cardName, bankName, cardLimit, usedAmount = 0, statementDate, dueDate, interestRate } = req.body;

    const limit = Number(cardLimit);
    const used = Number(usedAmount) || 0;
    const available = Math.max(0, limit - used);
    const totalDue = used;
    const minimumDue = Math.round(totalDue * 0.05);

    const card = await prisma.creditCard.create({
      data: {
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
      },
    });

    res.json(card);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/credit-cards/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, accountId, notes } = req.body;

    const card = await prisma.creditCard.findUnique({ where: { id } });
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const payAmount = Number(amount);
    const newUsed = Math.max(0, card.usedAmount - payAmount);
    const newAvailable = Math.min(card.cardLimit, card.cardLimit - newUsed);
    const newTotalDue = Math.max(0, card.totalDue - payAmount);

    const payment = await prisma.creditPayment.create({
      data: {
        cardId: id,
        amount: payAmount,
        accountId: accountId || null,
        notes,
      },
    });

    await prisma.creditCard.update({
      where: { id },
      data: {
        usedAmount: newUsed,
        availableLimit: newAvailable,
        totalDue: newTotalDue,
        minimumDue: Math.round(newTotalDue * 0.05),
      },
    });

    if (accountId) {
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: { decrement: payAmount } },
      });
    }

    res.json(payment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/credit-cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cardName, bankName, cardLimit, usedAmount, statementDate, dueDate, interestRate } = req.body;

    const existing = await prisma.creditCard.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Card not found' });

    const limit = cardLimit !== undefined ? Number(cardLimit) : existing.cardLimit;
    const used = usedAmount !== undefined ? Number(usedAmount) : existing.usedAmount;
    const available = Math.max(0, limit - used);
    const totalDue = used;
    const minimumDue = Math.round(totalDue * 0.05);

    const updated = await prisma.creditCard.update({
      where: { id },
      data: {
        cardName: cardName || existing.cardName,
        bankName: bankName !== undefined ? bankName : existing.bankName,
        cardLimit: limit,
        usedAmount: used,
        availableLimit: available,
        statementDate: statementDate !== undefined ? Number(statementDate) : existing.statementDate,
        dueDate: dueDate !== undefined ? Number(dueDate) : existing.dueDate,
        minimumDue,
        totalDue,
        interestRate: interestRate !== undefined ? Number(interestRate) : existing.interestRate,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/credit-cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.creditCard.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. ACCOUNTS & TRANSFERS API
// ==========================================
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: 'asc' },
    });
    res.json(accounts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/accounts', async (req, res) => {
  try {
    const { name, type, balance, bankName, accountNumber } = req.body;
    const acc = await prisma.account.create({
      data: {
        name,
        type,
        balance: Number(balance) || 0,
        bankName,
        accountNumber,
      },
    });
    res.json(acc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/transfers', async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, notes } = req.body;
    const numAmount = Number(amount);

    if (fromAccountId === toAccountId) {
      return res.status(400).json({ error: 'Source and destination accounts must be different' });
    }

    const transfer = await prisma.transfer.create({
      data: {
        fromAccountId,
        toAccountId,
        amount: numAmount,
        notes,
      },
    });

    // Deduct from source and add to destination
    await prisma.account.update({
      where: { id: fromAccountId },
      data: { balance: { decrement: numAmount } },
    });

    await prisma.account.update({
      where: { id: toAccountId },
      data: { balance: { increment: numAmount } },
    });

    res.json(transfer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. REMINDERS API
// ==========================================
router.get('/reminders', async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      orderBy: { dueDate: 'asc' },
    });
    res.json(reminders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reminders', async (req, res) => {
  try {
    const { title, type, amount, dueDate, dueTime, repeat, priority, notes } = req.body;
    const reminder = await prisma.reminder.create({
      data: {
        title,
        type,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        dueTime: dueTime || '09:00',
        repeat: repeat || 'NONE',
        priority: priority || 'MEDIUM',
        notes,
      },
    });
    res.json(reminder);

    // Fire-and-forget: confirmation email with the .ics attached (adds to iPhone Calendar in one tap)
    const settings = await prisma.settings.findUnique({ where: { id: 'default-settings' } });
    if (settings?.emailRemindersEnabled && settings.notifyEmail && smtpConfigured()) {
      sendReminderCreatedEmail(settings.notifyEmail, reminder.id, settings.currency || '₹').catch((e) =>
        console.error('Reminder email failed:', e.message)
      );
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/reminders/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await prisma.reminder.update({
      where: { id },
      data: { isCompleted: true },
    });
    res.json(reminder);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. CATEGORIES & BUDGETS
// ==========================================
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/budgets', async (req, res) => {
  try {
    const month = req.query.month as string || new Date().toISOString().substring(0, 7);
    const budgets = await prisma.budget.findMany({
      where: { month },
      include: { category: true },
    });
    res.json(budgets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/budgets', async (req, res) => {
  try {
    const { month, categoryId, limit } = req.body;
    const budget = await prisma.budget.upsert({
      where: { month_categoryId: { month, categoryId } },
      update: { limit: Number(limit) },
      create: {
        month,
        categoryId,
        limit: Number(limit),
      },
    });
    res.json(budget);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. SETTINGS & BACKUP/RESTORE
// ==========================================
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'default-settings' },
    });
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const settings = await prisma.settings.upsert({
      where: { id: 'default-settings' },
      update: req.body,
      create: { id: 'default-settings', ...req.body },
    });
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/backup', async (req, res) => {
  try {
    const accounts = await prisma.account.findMany();
    const salaries = await prisma.salary.findMany();
    const expenses = await prisma.expense.findMany();
    const loans = await prisma.loan.findMany();
    const loanPayments = await prisma.loanPayment.findMany();
    const creditCards = await prisma.creditCard.findMany();
    const creditPayments = await prisma.creditPayment.findMany();
    const reminders = await prisma.reminder.findMany();
    const categories = await prisma.category.findMany();
    const budgets = await prisma.budget.findMany();
    const settings = await prisma.settings.findUnique({ where: { id: 'default-settings' } });

    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        settings,
        accounts,
        salaries,
        expenses,
        loans,
        loanPayments,
        creditCards,
        creditPayments,
        reminders,
        categories,
        budgets,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=SmartFinance_Backup_${Date.now()}.json`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. GLOBAL SEARCH
// ==========================================
router.get('/search', async (req, res) => {
  try {
    const query = (req.query.q as string || '').toLowerCase();
    if (!query) return res.json({ expenses: [], loans: [], salaries: [], reminders: [], accounts: [], creditCards: [] });

    const expenses = await prisma.expense.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { notes: { contains: query } },
          { tags: { contains: query } },
        ],
      },
      include: { category: true },
      take: 10,
    });

    const loans = await prisma.loan.findMany({
      where: {
        OR: [{ name: { contains: query } }, { bankName: { contains: query } }],
      },
      take: 10,
    });

    const salaries = await prisma.salary.findMany({
      where: { companyName: { contains: query } },
      take: 10,
    });

    const reminders = await prisma.reminder.findMany({
      where: { title: { contains: query } },
      take: 10,
    });

    const accounts = await prisma.account.findMany({
      where: { name: { contains: query } },
      take: 10,
    });

    const creditCards = await prisma.creditCard.findMany({
      where: { cardName: { contains: query } },
      take: 10,
    });

    res.json({ expenses, loans, salaries, reminders, accounts, creditCards });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 11. RESET ALL DATA
// ==========================================
router.post('/reset', async (req, res) => {
  try {
    const { resetDatabase } = await import('../seed');
    await resetDatabase();
    res.json({ success: true, message: 'All financial data reset to 0' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
