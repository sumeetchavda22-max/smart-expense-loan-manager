import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Filter,
  Tags,
  Image as ImageIcon,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  Pencil,
  Check,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Expense, Income } from '../types/finance';
import * as api from '../services/api';

interface ExpensesPageProps {
  onOpenQuickAdd: (tab?: string) => void;
}

const SOURCE_LABEL: Record<string, string> = {
  SALARY: 'Salary',
  FREELANCE: 'Freelance',
  BUSINESS: 'Business',
  GIFT: 'Gift',
  INTEREST: 'Interest',
  REFUND: 'Refund',
  RENTAL: 'Rental',
  OTHER: 'Other',
};

const CATEGORY_COLORS = ['#EF4444', '#F59E0B', '#EC4899', '#10B981', '#3B82F6', '#8B5CF6', '#06B6D4', '#6366F1', '#D946EF', '#64748B'];

const fieldCls = 'w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none';
const labelCls = 'block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1';

export const ExpensesPage: React.FC<ExpensesPageProps> = ({ onOpenQuickAdd }) => {
  const { expenses, incomes, categories, accounts, refreshData, currency } = useFinance();
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);

  const totalIncomeAll = incomes.reduce((acc, i) => acc + i.amount, 0);
  const totalExpenseAll = expenses.reduce((acc, e) => acc + e.amount, 0);
  const balanceAll = totalIncomeAll - totalExpenseAll;

  const filteredExpenses = expenses.filter((e) => {
    if (selectedCat && e.categoryId !== selectedCat) return false;
    if (selectedMethod && e.paymentMethod !== selectedMethod) return false;
    return true;
  });
  const totalExpenseFiltered = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  const handleDeleteExpense = async (id: string, ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (confirm('Are you sure you want to delete this expense record? This cannot be undone.')) {
      await api.deleteExpense(id);
      await refreshData();
    }
  };

  const handleDeleteIncome = async (id: string, ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (confirm('Are you sure you want to delete this income record? This cannot be undone.')) {
      await api.deleteIncome(id);
      await refreshData();
    }
  };

  return (
    <div className="space-y-4 pb-nav max-w-4xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Expenses &amp; Income</h1>
          <p className="text-xs text-gray-500">
            Balance: <span className={`font-bold ${balanceAll >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{currency}{balanceAll.toLocaleString()}</span>
          </p>
        </div>
        <button
          onClick={() => onOpenQuickAdd(tab === 'expense' ? 'expense' : 'income')}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>{tab === 'expense' ? 'Add Expense' : 'Add Income'}</span>
        </button>
      </div>

      {/* Total Income / Total Expenses summary */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Total Income</span>
          <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{currency}{totalIncomeAll.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40">
          <span className="text-[10px] uppercase font-bold text-red-500">Total Expenses</span>
          <p className="text-base font-extrabold text-red-500">{currency}{totalExpenseAll.toLocaleString()}</p>
        </div>
      </div>

      {/* Expense / Income Tabs — kept clearly separated per the app's Income feature */}
      <div className="flex items-center p-1 rounded-2xl bg-gray-100 dark:bg-slate-800/60">
        <button
          onClick={() => setTab('expense')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 min-h-[2.5rem] rounded-xl text-xs font-bold transition-all ${
            tab === 'expense' ? 'bg-white dark:bg-slate-900 text-red-500 shadow-sm' : 'text-gray-500 dark:text-slate-400'
          }`}
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
          <span>Expenses</span>
        </button>
        <button
          onClick={() => setTab('income')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 min-h-[2.5rem] rounded-xl text-xs font-bold transition-all ${
            tab === 'income' ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-sm' : 'text-gray-500 dark:text-slate-400'
          }`}
        >
          <ArrowUpCircle className="w-3.5 h-3.5" />
          <span>Income</span>
        </button>
      </div>

      {tab === 'expense' && (
        <>
          {/* Filter Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar snap-row">
            <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs font-medium text-gray-600 dark:text-slate-300">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs font-semibold outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs font-semibold outline-none"
            >
              <option value="">All Payment Methods</option>
              <option value="UPI">UPI / GPay</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="BANK">Bank NetBanking</option>
            </select>

            <button
              onClick={() => setManageCategoriesOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-600 dark:text-slate-300 shrink-0"
              title="Manage Categories"
            >
              <Tags className="w-3.5 h-3.5" />
              <span>Categories</span>
            </button>
          </div>

          <p className="text-xs text-gray-500 -mt-1">
            Filtered Total: <span className="font-bold text-red-500">{currency}{totalExpenseFiltered.toLocaleString()}</span>
          </p>

          {/* Expense Items List */}
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-gray-400">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">No expenses recorded yet</p>
              <p className="text-xs text-gray-400">Tap "Add Expense" above to log your first expenditure.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredExpenses.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => setEditingExpense(exp)}
                  role="button"
                  tabIndex={0}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between hover:border-brand-300 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
                      style={{ backgroundColor: exp.category?.color || '#3B82F6' }}
                    >
                      {exp.category?.name.charAt(0) || 'E'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{exp.title}</h3>
                        {exp.isRecurring && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-medium shrink-0">
                            Recurring
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-gray-500 mt-0.5">
                        <span>{exp.category?.name || 'General'}</span>
                        <span>•</span>
                        <span>{exp.paymentMethod}</span>
                        <span>•</span>
                        <span>{new Date(exp.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {exp.receiptUrl && (
                      <button
                        onClick={(ev) => { ev.stopPropagation(); setPreviewImage(exp.receiptUrl!); }}
                        className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800"
                        title="View Receipt"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    )}

                    <div className="text-right">
                      <p className="text-sm font-extrabold text-red-500">
                        -{currency}{exp.amount.toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={(ev) => handleDeleteExpense(exp.id, ev)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 opacity-80 hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'income' && (
        <>
          {incomes.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto text-emerald-500">
                <ArrowUpCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">No income recorded yet</p>
              <p className="text-xs text-gray-400">Tap "Add Income" above to log your salary or other money received.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {incomes.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setEditingIncome(inc)}
                  role="button"
                  tabIndex={0}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between hover:border-emerald-300 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0 bg-emerald-500">
                      {inc.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{inc.title}</h3>
                      <div className="flex items-center space-x-2 text-[11px] text-gray-500 mt-0.5">
                        <span>{SOURCE_LABEL[inc.source] || inc.source}</span>
                        <span>•</span>
                        <span>{inc.account?.name || 'No account'}</span>
                        <span>•</span>
                        <span>{new Date(inc.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <p className="text-sm font-extrabold text-emerald-500">
                      +{currency}{inc.amount.toLocaleString()}
                    </p>
                    <button
                      onClick={(ev) => handleDeleteIncome(inc.id, ev)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 opacity-80 hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Receipt Image Modal */}
      {previewImage && (
        <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Receipt" onClick={() => setPreviewImage(null)}>
          <div className="sheet-panel bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="p-4 space-y-3 overflow-y-auto overscroll-contain">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Receipt Attachment</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-xs font-semibold px-3 min-h-[2.5rem] rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 active:bg-gray-200"
              >
                Close
              </button>
            </div>
            <img src={previewImage} alt="Receipt Preview" className="w-full max-h-[70dvh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {editingExpense && (
        <EditExpenseSheet
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSaved={async () => { setEditingExpense(null); await refreshData(); }}
        />
      )}

      {editingIncome && (
        <EditIncomeSheet
          income={editingIncome}
          onClose={() => setEditingIncome(null)}
          onSaved={async () => { setEditingIncome(null); await refreshData(); }}
        />
      )}

      {manageCategoriesOpen && (
        <ManageCategoriesSheet onClose={() => setManageCategoriesOpen(false)} onChanged={refreshData} />
      )}
    </div>
  );
};

// ==========================================
// Edit Expense — tapping a transaction opens this instead of a bottom action menu
// ==========================================
const EditExpenseSheet: React.FC<{ expense: Expense; onClose: () => void; onSaved: () => void }> = ({ expense, onClose, onSaved }) => {
  const { categories, accounts, currency } = useFinance();
  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(String(expense.amount));
  const [categoryId, setCategoryId] = useState(expense.categoryId);
  const [paymentMethod, setPaymentMethod] = useState(expense.paymentMethod);
  const [accountId, setAccountId] = useState(expense.accountId || '');
  const [date, setDate] = useState(new Date(expense.date).toISOString().substring(0, 10));
  const [notes, setNotes] = useState(expense.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return setError('Title and amount required');
    try {
      setSubmitting(true);
      setError(null);
      await api.updateExpense(expense.id, {
        title,
        amount: Number(amount),
        categoryId,
        paymentMethod,
        accountId: accountId || null,
        date,
        notes,
      });
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Edit expense" onClick={() => !submitting && onClose()}>
      <form onSubmit={handleSave} className="sheet-panel bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="p-5 space-y-3 overflow-y-auto overscroll-contain">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Edit Expense</h2>
            <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-medium border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <div>
            <label className={labelCls}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={fieldCls} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Amount ({currency})</label>
              <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={fieldCls} required />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={fieldCls}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className={fieldCls}>
                <option value="UPI">UPI / GPay</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="BANK">Bank NetBanking</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Account</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={fieldCls}>
                <option value="">(None)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls} />
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldCls} />
          </div>

          <div className="flex space-x-2 pt-2">
            <button type="button" onClick={onClose} disabled={submitting} className="w-1/2 py-2.5 min-h-[2.75rem] rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold text-xs">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="w-1/2 py-2.5 min-h-[2.75rem] rounded-xl bg-brand-600 text-white font-semibold text-xs shadow-md disabled:opacity-60">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// ==========================================
// Edit Income
// ==========================================
const EditIncomeSheet: React.FC<{ income: Income; onClose: () => void; onSaved: () => void }> = ({ income, onClose, onSaved }) => {
  const { accounts, currency } = useFinance();
  const [title, setTitle] = useState(income.title);
  const [amount, setAmount] = useState(String(income.amount));
  const [source, setSource] = useState(income.source);
  const [accountId, setAccountId] = useState(income.accountId || '');
  const [date, setDate] = useState(new Date(income.date).toISOString().substring(0, 10));
  const [notes, setNotes] = useState(income.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return setError('Title and amount required');
    try {
      setSubmitting(true);
      setError(null);
      await api.updateIncome(income.id, {
        title,
        amount: Number(amount),
        source,
        accountId: accountId || null,
        date,
        notes,
      });
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Edit income" onClick={() => !submitting && onClose()}>
      <form onSubmit={handleSave} className="sheet-panel bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="p-5 space-y-3 overflow-y-auto overscroll-contain">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Edit Income</h2>
            <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-medium border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <div>
            <label className={labelCls}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={fieldCls} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Amount ({currency})</label>
              <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={fieldCls} required />
            </div>
            <div>
              <label className={labelCls}>Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value as any)} className={fieldCls}>
                {Object.entries(SOURCE_LABEL).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Account</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={fieldCls}>
                <option value="">(None)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldCls} />
          </div>

          <div className="flex space-x-2 pt-2">
            <button type="button" onClick={onClose} disabled={submitting} className="w-1/2 py-2.5 min-h-[2.75rem] rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold text-xs">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="w-1/2 py-2.5 min-h-[2.75rem] rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md disabled:opacity-60">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// ==========================================
// Manage Categories — create, rename/recolor, delete
// ==========================================
const ManageCategoriesSheet: React.FC<{ onClose: () => void; onChanged: () => Promise<void> }> = ({ onClose, onChanged }) => {
  const { categories } = useFinance();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setBusy(true);
      setError(null);
      await api.createCategory({ name: newName.trim(), color: newColor });
      setNewName('');
      await onChanged();
    } catch (err: any) {
      setError('A category with that name already exists.');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (id: string, name: string, color: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      setBusy(true);
      setError(null);
      await api.updateCategory(id, { name: editName.trim(), color: editColor });
      setEditingId(null);
      await onChanged();
    } catch (err: any) {
      setError('Could not rename — that name may already be in use.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete the category "${name}"? Expenses already using it will show as "General" instead.`)) return;
    try {
      setBusy(true);
      await api.deleteCategory(id);
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Manage categories" onClick={onClose}>
      <div className="sheet-panel bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="p-5 space-y-4 overflow-y-auto overscroll-contain">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Manage Categories</h2>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-medium border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Add new category */}
          <form onSubmit={handleAdd} className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 space-y-2.5">
            <label className={labelCls}>New Category</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Groceries"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={`${fieldCls} flex-1`}
              />
              <button type="submit" disabled={busy || !newName.trim()} className="px-4 min-h-[2.75rem] rounded-xl bg-brand-600 text-white font-semibold text-xs shadow-md disabled:opacity-60 shrink-0">
                Add
              </button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`w-6 h-6 rounded-full border-2 ${newColor === c ? 'border-gray-900 dark:border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Choose color ${c}`}
                />
              ))}
            </div>
          </form>

          {/* Existing categories */}
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {editingId === cat.id ? (
                  <>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                        autoFocus
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        {CATEGORY_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditColor(c)}
                            className={`w-4 h-4 rounded-full border ${editColor === c ? 'border-gray-900 dark:border-white' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                            aria-label={`Choose color ${c}`}
                          />
                        ))}
                      </div>
                    </div>
                    <button onClick={() => handleSaveEdit(cat.id)} disabled={busy} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shrink-0" title="Save">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 shrink-0" title="Cancel">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEdit(cat.id, cat.name, cat.color)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-800" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cat.id, cat.name)} disabled={busy} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
