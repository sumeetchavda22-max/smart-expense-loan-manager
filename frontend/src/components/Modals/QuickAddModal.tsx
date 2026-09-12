import React, { useState } from 'react';
import {
  X,
  Receipt,
  Briefcase,
  Landmark,
  CreditCard,
  Bell,
  ArrowRightLeft,
  Upload,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import * as api from '../../services/api';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'expense',
}) => {
  const { categories, accounts, loans, creditCards, refreshData, currency } = useFinance();
  const [activeType, setActiveType] = useState<string>(defaultTab);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Expense form state
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [expMethod, setExpMethod] = useState<'CASH' | 'UPI' | 'BANK' | 'CARD'>('UPI');
  const [expAccount, setExpAccount] = useState('');
  const [expNotes, setExpNotes] = useState('');
  const [expTags, setExpTags] = useState('');
  const [expReceipt, setExpReceipt] = useState<File | null>(null);
  const [expRecurring, setExpRecurring] = useState(false);
  const [expFrequency, setExpFrequency] = useState<'MONTHLY' | 'WEEKLY' | 'YEARLY'>('MONTHLY');

  // Salary form state
  const [salCompany, setSalCompany] = useState('');
  const [salAmount, setSalAmount] = useState('');
  const [salDate, setSalDate] = useState('1');
  const [salAccount, setSalAccount] = useState('');
  const [salBonus, setSalBonus] = useState('0');
  const [salOvertime, setSalOvertime] = useState('0');
  const [salPF, setSalPF] = useState('0');
  const [salTax, setSalTax] = useState('0');
  const [salTDS, setSalTDS] = useState('0');

  // Loan form state
  const [loanName, setLoanName] = useState('');
  const [loanType, setLoanType] = useState('PERSONAL');
  const [loanBank, setLoanBank] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanInterest, setLoanInterest] = useState('10.5');
  const [loanPeriod, setLoanPeriod] = useState('12');

  // Credit card form state
  const [cardName, setCardName] = useState('');
  const [cardBank, setCardBank] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardUsedAmount, setCardUsedAmount] = useState('0');
  const [cardStatementDate, setCardStatementDate] = useState('1');
  const [cardDueDate, setCardDueDate] = useState('15');

  // Loan EMI Payment form state
  const [payLoanId, setPayLoanId] = useState('');
  const [payLoanAccount, setPayLoanAccount] = useState('');

  // Reminder form state
  const [remTitle, setRemTitle] = useState('');
  const [remType, setRemType] = useState('LOAN_EMI');
  const [remAmount, setRemAmount] = useState('');
  const [remDueDate, setRemDueDate] = useState(new Date().toISOString().substring(0, 10));
  const [remDueTime, setRemDueTime] = useState('09:00');
  const [remRepeat, setRemRepeat] = useState('MONTHLY');
  const [remPriority, setRemPriority] = useState('MEDIUM');

  // Transfer form state
  const [trFromAcc, setTrFromAcc] = useState('');
  const [trToAcc, setTrToAcc] = useState('');
  const [trAmount, setTrAmount] = useState('');

  if (!isOpen) return null;

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return setError('Title and amount required');
    try {
      setSubmitting(true);
      setError(null);
      const fd = new FormData();
      fd.append('title', expTitle);
      fd.append('amount', expAmount);
      fd.append('categoryId', expCategory || (categories[0]?.id ?? ''));
      fd.append('paymentMethod', expMethod);
      if (expAccount) fd.append('accountId', expAccount);
      fd.append('notes', expNotes);
      fd.append('tags', expTags);
      fd.append('isRecurring', String(expRecurring));
      fd.append('repeatFrequency', expFrequency);
      if (expReceipt) fd.append('receipt', expReceipt);

      await api.createExpense(fd);
      await refreshData();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salCompany || !salAmount || !salAccount) return setError('Company, Amount & Account required');
    try {
      setSubmitting(true);
      setError(null);
      await api.createSalary({
        companyName: salCompany,
        monthlySalary: Number(salAmount),
        salaryDate: Number(salDate),
        accountId: salAccount,
        bonus: Number(salBonus),
        overtime: Number(salOvertime),
        pfDeduction: Number(salPF),
        profTax: Number(salTax),
        tdsDeduction: Number(salTDS),
      });
      await refreshData();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanName || !loanAmount) return setError('Loan Name and Amount required');
    try {
      setSubmitting(true);
      setError(null);
      await api.createLoan({
        name: loanName,
        type: loanType,
        bankName: loanBank,
        amount: Number(loanAmount),
        interestRate: Number(loanInterest),
        loanPeriodMonths: Number(loanPeriod),
      });
      await refreshData();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCreditCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardLimit) return setError('Card Name and Limit required');
    try {
      setSubmitting(true);
      setError(null);
      await api.createCreditCard({
        cardName,
        bankName: cardBank,
        cardLimit: Number(cardLimit),
        usedAmount: Number(cardUsedAmount) || 0,
        statementDate: Number(cardStatementDate),
        dueDate: Number(cardDueDate),
      });
      await refreshData();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPayEMI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payLoanId) return setError('Select loan');
    try {
      setSubmitting(true);
      setError(null);
      await api.payLoanEMI(payLoanId, { accountId: payLoanAccount || null });
      await refreshData();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle || !remAmount) return setError('Title and Amount required');
    try {
      setSubmitting(true);
      setError(null);
      await api.createReminder({
        title: remTitle,
        type: remType,
        amount: Number(remAmount),
        dueDate: remDueDate,
        dueTime: remDueTime,
        repeat: remRepeat,
        priority: remPriority,
      });
      await refreshData();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trFromAcc || !trToAcc || !trAmount) return setError('Source, Destination & Amount required');
    try {
      setSubmitting(true);
      setError(null);
      await api.createTransfer({
        fromAccountId: trFromAcc,
        toAccountId: trToAcc,
        amount: Number(trAmount),
      });
      await refreshData();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sheet-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Quick create">
      <div className="sheet-panel bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {/* Header */}
        <div className="flex items-center justify-between pl-5 pr-3 py-3 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quick Create</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200/70"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="flex items-center space-x-1 p-2 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 overflow-x-auto no-scrollbar snap-row">
          {[
            { id: 'expense', label: 'Expense', icon: Receipt },
            { id: 'salary', label: 'Salary', icon: Briefcase },
            { id: 'loan', label: 'Loan', icon: Landmark },
            { id: 'credit', label: 'Credit Card', icon: CreditCard },
            { id: 'emi', label: 'Pay EMI', icon: Landmark },
            { id: 'reminder', label: 'Reminder', icon: Bell },
            { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeType === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveType(item.id);
                  setError(null);
                }}
                className={`flex items-center space-x-1.5 px-3 min-h-[2.5rem] rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <div className="p-4 xs:p-5 overflow-y-auto overscroll-contain flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-medium border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* 1. EXPENSE FORM */}
          {activeType === 'expense' && (
            <form onSubmit={handleSubmitExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grocery Shopping"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Amount ({currency})
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={expMethod}
                    onChange={(e) => setExpMethod(e.target.value as any)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="UPI">UPI / GPay</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="BANK">Bank NetBanking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Deduct From Account
                  </label>
                  <select
                    value={expAccount}
                    onChange={(e) => setExpAccount(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="">(Optional) Choose Account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({currency}{acc.balance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Receipt Upload
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setExpReceipt(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 dark:file:bg-slate-800 dark:file:text-brand-400 hover:file:bg-brand-100"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={expRecurring}
                  onChange={(e) => setExpRecurring(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="recurring" className="text-xs font-medium text-gray-700 dark:text-slate-300">
                  Recurring Expense
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 min-h-[3rem] rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/30 transition-all mt-4"
              >
                {submitting ? 'Saving...' : 'Add Expense'}
              </button>
            </form>
          )}

          {/* 2. SALARY FORM */}
          {activeType === 'salary' && (
            <form onSubmit={handleSubmitSalary} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google India"
                  value={salCompany}
                  onChange={(e) => setSalCompany(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Gross Monthly Salary ({currency})
                  </label>
                  <input
                    type="number" inputMode="decimal"
                    placeholder="85000"
                    value={salAmount}
                    onChange={(e) => setSalAmount(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Deposit Account
                  </label>
                  <select
                    value={salAccount}
                    onChange={(e) => setSalAccount(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  >
                    <option value="">Select Bank Account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                    PF Deduction
                  </label>
                  <input
                    type="number" inputMode="decimal"
                    value={salPF}
                    onChange={(e) => setSalPF(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                    Prof Tax
                  </label>
                  <input
                    type="number" inputMode="decimal"
                    value={salTax}
                    onChange={(e) => setSalTax(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                    TDS Tax
                  </label>
                  <input
                    type="number" inputMode="decimal"
                    value={salTDS}
                    onChange={(e) => setSalTDS(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 min-h-[3rem] rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/30 transition-all mt-4"
              >
                {submitting ? 'Saving...' : 'Add Salary Account'}
              </button>
            </form>
          )}

          {/* 3. LOAN FORM */}
          {activeType === 'loan' && (
            <form onSubmit={handleSubmitLoan} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Loan Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Home Loan HDFC"
                  value={loanName}
                  onChange={(e) => setLoanName(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Loan Type
                  </label>
                  <select
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="PERSONAL">Personal Loan</option>
                    <option value="HOME">Home Loan</option>
                    <option value="CAR">Car Loan</option>
                    <option value="BIKE">Bike Loan</option>
                    <option value="GOLD">Gold Loan</option>
                    <option value="BUSINESS">Business Loan</option>
                    <option value="EDUCATION">Education Loan</option>
                    <option value="FRIEND">Friend Loan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Bank / Lender
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SBI"
                    value={loanBank}
                    onChange={(e) => setLoanBank(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                    Amount ({currency})
                  </label>
                  <input
                    type="number" inputMode="decimal"
                    placeholder="500000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                    Interest % (p.a.)
                  </label>
                  <input
                    type="number" inputMode="decimal"
                    step="0.1"
                    value={loanInterest}
                    onChange={(e) => setLoanInterest(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-1">
                    Tenure (Months)
                  </label>
                  <input
                    type="number" inputMode="decimal"
                    value={loanPeriod}
                    onChange={(e) => setLoanPeriod(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 min-h-[3rem] rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/30 transition-all mt-4"
              >
                {submitting ? 'Saving...' : 'Create Loan'}
              </button>
            </form>
          )}

          {/* 4. CREDIT CARD FORM */}
          {activeType === 'credit' && (
            <form onSubmit={handleSubmitCreditCard} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Card Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Regalia"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ICICI"
                    value={cardBank}
                    onChange={(e) => setCardBank(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Total Credit Limit ({currency})
                  </label>
                  <input
                    type="number" inputMode="decimal"
                    placeholder="150000"
                    value={cardLimit}
                    onChange={(e) => setCardLimit(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Current Used / Outstanding Amount ({currency})
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={cardUsedAmount}
                  onChange={(e) => setCardUsedAmount(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none font-semibold text-red-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Enter any existing unpaid balance or statement due on this card.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Statement Date (Day of Month)
                  </label>
                  <input
                    type="number" inputMode="decimal"
                    min="1"
                    max="31"
                    value={cardStatementDate}
                    onChange={(e) => setCardStatementDate(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Payment Due Date (Day of Month)
                  </label>
                  <input
                    type="number" inputMode="decimal"
                    min="1"
                    max="31"
                    value={cardDueDate}
                    onChange={(e) => setCardDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 min-h-[3rem] rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/30 transition-all mt-4"
              >
                {submitting ? 'Saving...' : 'Add Credit Card'}
              </button>
            </form>
          )}

          {/* 5. PAY EMI FORM */}
          {activeType === 'emi' && (
            <form onSubmit={handleSubmitPayEMI} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Select Active Loan
                </label>
                <select
                  value={payLoanId}
                  onChange={(e) => setPayLoanId(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                  required
                >
                  <option value="">Choose Loan</option>
                  {loans
                    .filter((l) => l.status === 'ACTIVE')
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} - EMI: {currency}{l.emiAmount.toLocaleString()} (Bal: {currency}{l.outstandingBalance.toLocaleString()})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Pay From Account
                </label>
                <select
                  value={payLoanAccount}
                  onChange={(e) => setPayLoanAccount(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                >
                  <option value="">Choose Account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({currency}{acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 min-h-[3rem] rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/30 transition-all mt-4"
              >
                {submitting ? 'Processing...' : 'Pay EMI Now'}
              </button>
            </form>
          )}

          {/* 6. REMINDER FORM */}
          {activeType === 'reminder' && (
            <form onSubmit={handleSubmitReminder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Reminder Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electricity Bill Payment"
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Amount ({currency})
                  </label>
                  <input
                    type="number" inputMode="decimal"
                    placeholder="2500"
                    value={remAmount}
                    onChange={(e) => setRemAmount(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Reminder Category
                  </label>
                  <select
                    value={remType}
                    onChange={(e) => setRemType(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                  >
                    <option value="ELECTRICITY">Electricity Bill</option>
                    <option value="WATER">Water Bill</option>
                    <option value="GAS">Gas Bill</option>
                    <option value="RECHARGE">Mobile Recharge</option>
                    <option value="INTERNET">Internet Bill</option>
                    <option value="RENT">Rent</option>
                    <option value="LOAN_EMI">Loan EMI</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="INSURANCE">Insurance</option>
                    <option value="INVESTMENT">Investment</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={remDueDate}
                    onChange={(e) => setRemDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                    Repeat Frequency
                  </label>
                  <select
                    value={remRepeat}
                    onChange={(e) => setRemRepeat(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                  >
                    <option value="NONE">No Repeat</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 min-h-[3rem] rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/30 transition-all mt-4"
              >
                {submitting ? 'Saving...' : 'Set Reminder'}
              </button>
            </form>
          )}

          {/* 7. TRANSFER FORM */}
          {activeType === 'transfer' && (
            <form onSubmit={handleSubmitTransfer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  From Account
                </label>
                <select
                  value={trFromAcc}
                  onChange={(e) => setTrFromAcc(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                  required
                >
                  <option value="">Select Source Account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({currency}{acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  To Account
                </label>
                <select
                  value={trToAcc}
                  onChange={(e) => setTrToAcc(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                  required
                >
                  <option value="">Select Destination Account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({currency}{acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Transfer Amount ({currency})
                </label>
                <input
                  type="number" inputMode="decimal"
                  placeholder="5000"
                  value={trAmount}
                  onChange={(e) => setTrAmount(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 min-h-[3rem] rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/30 transition-all mt-4"
              >
                {submitting ? 'Transferring...' : 'Execute Transfer'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
