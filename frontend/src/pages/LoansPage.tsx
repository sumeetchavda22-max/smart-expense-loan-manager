import React, { useState } from 'react';
import { Landmark, Plus, Trash2, X, CalendarClock } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Loan } from '../types/finance';
import * as api from '../services/api';

interface LoansPageProps {
  onOpenQuickAdd: (tab?: string) => void;
}

const FREQUENCY_LABEL: Record<string, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
};

export const LoansPage: React.FC<LoansPageProps> = ({ onOpenQuickAdd }) => {
  const { loans, accounts, refreshData, currency } = useFinance();

  const [payingLoan, setPayingLoan] = useState<Loan | null>(null);
  const [payAccountId, setPayAccountId] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const totalOutstanding = loans
    .filter((l) => l.status === 'ACTIVE')
    .reduce((acc, l) => acc + l.outstandingBalance, 0);

  const handleDeleteLoan = async (loanId: string, loanName: string) => {
    if (confirm(`Are you sure you want to delete the loan "${loanName}"? This cannot be undone.`)) {
      try {
        await api.deleteLoan(loanId);
        await refreshData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete loan');
      }
    }
  };

  const openPaySheet = (loan: Loan) => {
    setPayingLoan(loan);
    setPayAccountId('');
    setPayError(null);
  };

  const handleConfirmPayEmi = async () => {
    if (!payingLoan) return;
    try {
      setPaySubmitting(true);
      setPayError(null);
      await api.payLoanEMI(payingLoan.id, { accountId: payAccountId || null });
      await refreshData();
      setPayingLoan(null);
    } catch (err: any) {
      setPayError(err.message || 'Failed to record EMI payment');
    } finally {
      setPaySubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-nav max-w-4xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Loans & Debt Manager</h1>
          <p className="text-xs text-gray-500">
            Total Outstanding: <span className="font-bold text-amber-500">{currency}{totalOutstanding.toLocaleString()}</span>
          </p>
        </div>
        <button
          onClick={() => onOpenQuickAdd('loan')}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Loan</span>
        </button>
      </div>

      {/* Loans List */}
      {loans.length === 0 ? (
        <div className="p-12 text-center rounded-2xl liquid-glass-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto">
            <Landmark className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">No Active Loans</p>
          <p className="text-xs text-gray-400">
            Track your Home, Personal, Vehicle, or Education loans with EMI schedules and payoff progress.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map((loan) => {
            const completionRatio = loan.amount > 0 ? Math.round(((loan.amount - loan.outstandingBalance) / loan.amount) * 100) : 0;
            const freqLabel = FREQUENCY_LABEL[loan.emiFrequency] || 'Monthly';
            const isActive = loan.status === 'ACTIVE';

            return (
              <div
                key={loan.id}
                className="p-5 rounded-2xl liquid-glass-card space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">{loan.name}</h2>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-semibold">
                          {loan.type}
                        </span>
                        {!isActive && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-semibold">
                            {loan.status === 'COMPLETED' ? 'Paid Off' : loan.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {loan.bankName || 'Lender'} • {freqLabel} EMI
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">{freqLabel} EMI</span>
                      <span className="text-base font-bold text-brand-600 dark:text-brand-400">
                        {currency}{loan.emiAmount.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteLoan(loan.id, loan.name)}
                      className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete Loan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Loan Payoff Completion Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-500">Paid: {currency}{(loan.amount - loan.outstandingBalance).toLocaleString()}</span>
                    <span className="text-emerald-500 font-bold">{completionRatio}% Paid Off</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, completionRatio))}%` }}
                    />
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="text-[10px] text-gray-400">Outstanding</p>
                    <p className="font-bold text-amber-500">{currency}{loan.outstandingBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">EMIs Paid / Remaining</p>
                    <p className="font-semibold text-gray-700 dark:text-slate-300">{loan.paidEmis} paid • {loan.remainingEmis} left / {loan.totalEmis}</p>
                  </div>
                  {isActive ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="hidden xs:flex items-center gap-1 text-[10px] text-gray-500">
                        <CalendarClock className="w-3.5 h-3.5" />
                        <span>Next: {new Date(loan.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <button
                        onClick={() => openPaySheet(loan)}
                        className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-sm shrink-0"
                      >
                        Pay EMI
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-500 shrink-0">Fully Paid</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pay EMI Confirmation Sheet — lives here, not in the "+" quick-add menu */}
      {payingLoan && (
        <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Pay EMI" onClick={() => !paySubmitting && setPayingLoan(null)}>
          <div className="sheet-panel bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="p-5 space-y-4 overflow-y-auto overscroll-contain">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Pay EMI</h2>
                <button
                  type="button"
                  onClick={() => setPayingLoan(null)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {payError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-medium border border-red-200 dark:border-red-800">
                  {payError}
                </div>
              )}

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 space-y-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{payingLoan.name}</p>
                <p className="text-xs text-gray-500">
                  EMI {payingLoan.paidEmis + 1} of {payingLoan.totalEmis} • {payingLoan.remainingEmis} remaining after this payment
                </p>
                <p className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 tabular-nums">
                  {currency}{payingLoan.emiAmount.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Pay From Account (Optional)
                </label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                >
                  <option value="">Don't deduct from an account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({currency}{acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingLoan(null)}
                  disabled={paySubmitting}
                  className="w-1/2 py-2.5 min-h-[2.75rem] rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayEmi}
                  disabled={paySubmitting}
                  className="w-1/2 py-2.5 min-h-[2.75rem] rounded-xl bg-brand-600 text-white font-semibold text-xs shadow-md disabled:opacity-60"
                >
                  {paySubmitting ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
