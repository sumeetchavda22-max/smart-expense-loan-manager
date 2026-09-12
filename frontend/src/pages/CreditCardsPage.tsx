import React, { useState } from 'react';
import { CreditCard as CardIcon, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { CreditCard } from '../types/finance';
import * as api from '../services/api';

interface CreditCardsPageProps {
  onOpenQuickAdd: (tab?: string) => void;
}

export const CreditCardsPage: React.FC<CreditCardsPageProps> = ({ onOpenQuickAdd }) => {
  const { creditCards, accounts, refreshData, currency } = useFinance();

  // Edit Modal State
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editName, setEditName] = useState('');
  const [editBank, setEditBank] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [editUsedAmount, setEditUsedAmount] = useState('');
  const [editStatementDate, setEditStatementDate] = useState('1');
  const [editDueDate, setEditDueDate] = useState('15');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenEdit = (card: CreditCard) => {
    setEditingCard(card);
    setEditName(card.cardName);
    setEditBank(card.bankName || '');
    setEditLimit(String(card.cardLimit));
    setEditUsedAmount(String(card.usedAmount));
    setEditStatementDate(String(card.statementDate));
    setEditDueDate(String(card.dueDate));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    try {
      setSubmitting(true);
      await api.updateCreditCard(editingCard.id, {
        cardName: editName,
        bankName: editBank,
        cardLimit: Number(editLimit),
        usedAmount: Number(editUsedAmount),
        statementDate: Number(editStatementDate),
        dueDate: Number(editDueDate),
      });
      await refreshData();
      setEditingCard(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update credit card');
    } fontFinally: {
      setSubmitting(false);
    }
  };

  const handleDeleteCard = async (cardId: string, cardName: string) => {
    if (confirm(`Are you sure you want to delete the credit card "${cardName}"?`)) {
      await api.deleteCreditCard(cardId);
      await refreshData();
    }
  };

  const handlePayCard = async (cardId: string, amount: number) => {
    const defaultAcc = accounts[0];
    if (confirm(`Pay ${currency}${amount.toLocaleString()} for this credit card bill?`)) {
      await api.payCreditCard(cardId, { amount, accountId: defaultAcc?.id || null });
      await refreshData();
    }
  };

  return (
    <div className="space-y-4 pb-nav max-w-4xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Credit Cards Manager</h1>
          <p className="text-xs text-gray-500">
            Total Cards: <span className="font-bold text-brand-600">{creditCards.length}</span>
          </p>
        </div>
        <button
          onClick={() => onOpenQuickAdd('credit')}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Credit Card</span>
        </button>
      </div>

      {/* Cards List */}
      {creditCards.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mx-auto">
            <CardIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">No Credit Cards Added</p>
          <p className="text-xs text-gray-400">
            Keep track of statement billing dates, due dates, minimum payments, interest, and rewards points.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {creditCards.map((card) => {
            const usedRatio = card.cardLimit > 0 ? Math.round((card.usedAmount / card.cardLimit) * 100) : 0;

            return (
              <div
                key={card.id}
                className="p-5 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl space-y-4 relative overflow-hidden border border-slate-700/50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold tracking-wide">{card.cardName}</h2>
                    <p className="text-xs text-slate-400">{card.bankName || 'Bank Card'}</p>
                  </div>
                  
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleOpenEdit(card)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Edit Card & Set Bill"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id, card.cardName)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400 transition-colors"
                      title="Delete Card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Used / Limit</span>
                    <span className="font-semibold text-white">
                      {currency}{card.usedAmount.toLocaleString()} / {currency}{card.cardLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        usedRatio > 50 ? 'bg-red-500' : 'bg-brand-500'
                      }`}
                      style={{ width: `${Math.min(100, usedRatio)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700/60">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Due Date</span>
                    <span className="font-semibold text-amber-300">{card.dueDate}th of Month</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Bill Due</span>
                    <span className="font-bold text-red-400">{currency}{card.totalDue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-400">
                      Min Due: {currency}{card.minimumDue.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(card)}
                      className="text-[10px] text-brand-400 hover:underline text-left mt-0.5"
                    >
                      + Set / Update Bill
                    </button>
                  </div>

                  <button
                    onClick={() => handlePayCard(card.id, card.totalDue > 0 ? card.totalDue : card.minimumDue)}
                    className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md"
                  >
                    Pay Bill
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT CREDIT CARD & SET BILL MODAL */}
      {editingCard && (
        <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Edit credit card">
          <form
            onSubmit={handleSaveEdit}
            className="sheet-panel bg-white dark:bg-slate-900 shadow-2xl"
          >
            <div className="sheet-handle" />
            <div className="p-5 space-y-4 overflow-y-auto overscroll-contain">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Edit Credit Card & Set Bill
              </h2>
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Card Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Bank Name</label>
                <input
                  type="text"
                  value={editBank}
                  onChange={(e) => setEditBank(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Total Limit ({currency})</label>
                <input
                  type="number" inputMode="decimal"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                  required
                />
              </div>
            </div>

            {/* Set Outstanding / Used Bill Amount */}
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 space-y-1">
              <label className="block text-xs font-bold text-red-600 dark:text-red-400">
                Current Used / Outstanding Bill Amount ({currency})
              </label>
              <input
                type="number" inputMode="decimal"
                value={editUsedAmount}
                onChange={(e) => setEditUsedAmount(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 text-base font-bold text-red-600 dark:text-red-400 outline-none"
                required
              />
              <p className="text-[10px] text-gray-500 dark:text-slate-400">
                Updating this updates your Total Bill Due and reflects on your Dashboard immediately.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Statement Date (Day)</label>
                <input
                  type="number" inputMode="decimal"
                  min="1"
                  max="31"
                  value={editStatementDate}
                  onChange={(e) => setEditStatementDate(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Payment Due Date (Day)</label>
                <input
                  type="number" inputMode="decimal"
                  min="1"
                  max="31"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="w-1/2 py-2.5 min-h-[2.75rem] rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-1/2 py-2.5 min-h-[2.75rem] rounded-xl bg-brand-600 text-white font-semibold text-xs shadow-md"
              >
                {submitting ? 'Saving...' : 'Save & Update Bill'}
              </button>
            </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
