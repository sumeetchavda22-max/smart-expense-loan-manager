import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Filter,
  Tag,
  Calendar,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import * as api from '../services/api';

interface ExpensesPageProps {
  onOpenQuickAdd: () => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({ onOpenQuickAdd }) => {
  const { expenses, categories, refreshData, currency } = useFinance();
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const filteredExpenses = expenses.filter((e) => {
    if (selectedCat && e.categoryId !== selectedCat) return false;
    if (selectedMethod && e.paymentMethod !== selectedMethod) return false;
    return true;
  });

  const totalExpenseFiltered = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      await api.deleteExpense(id);
      await refreshData();
    }
  };

  return (
    <div className="space-y-4 pb-nav max-w-4xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Expense Tracker</h1>
          <p className="text-xs text-gray-500">
            Total Filtered: <span className="font-bold text-red-500">{currency}{totalExpenseFiltered.toLocaleString()}</span>
          </p>
        </div>
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

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
      </div>

      {/* Expense Items List */}
      {filteredExpenses.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-gray-400">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">No expenses recorded yet</p>
          <p className="text-xs text-gray-400">Tap "+ Add Expense" above to log your first expenditure.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between hover:border-brand-300 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                  style={{ backgroundColor: exp.category?.color || '#3B82F6' }}
                >
                  {exp.category?.name.charAt(0) || 'E'}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{exp.title}</h3>
                    {exp.isRecurring && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-medium">
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

              <div className="flex items-center space-x-3">
                {exp.receiptUrl && (
                  <button
                    onClick={() => setPreviewImage(exp.receiptUrl!)}
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
                  onClick={() => handleDelete(exp.id)}
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

      {/* Receipt Image Modal */}
      {previewImage && (
        <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Receipt">
          <div className="sheet-panel bg-white dark:bg-slate-900 shadow-2xl">
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
    </div>
  );
};
