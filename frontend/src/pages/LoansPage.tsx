import React from 'react';
import { Landmark, Plus, Trash2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import * as api from '../services/api';

interface LoansPageProps {
  onOpenQuickAdd: (tab?: string) => void;
}

export const LoansPage: React.FC<LoansPageProps> = ({ onOpenQuickAdd }) => {
  const { loans, refreshData, currency } = useFinance();

  const totalOutstanding = loans
    .filter((l) => l.status === 'ACTIVE')
    .reduce((acc, l) => acc + l.outstandingBalance, 0);

  const handleDeleteLoan = async (loanId: string, loanName: string) => {
    if (confirm(`Are you sure you want to delete the loan "${loanName}"?`)) {
      try {
        await api.deleteLoan(loanId);
        await refreshData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete loan');
      }
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
            Track your Home, Personal, Vehicle, or Education loans with automatic EMI calculations and debt payoff progress bars.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map((loan) => {
            const completionRatio = Math.round(
              ((loan.amount - loan.outstandingBalance) / loan.amount) * 100
            );

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
                      <div className="flex items-center space-x-2">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">{loan.name}</h2>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-semibold">
                          {loan.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {loan.bankName || 'Lender'} • Interest: <span className="font-semibold">{loan.interestRate}% p.a.</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Monthly EMI</span>
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
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 to-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, completionRatio))}%` }}
                    />
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-[10px] text-gray-400">Outstanding Principal</p>
                    <p className="font-bold text-amber-500">{currency}{loan.outstandingBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">EMIs Left</p>
                    <p className="font-semibold text-gray-700 dark:text-slate-300">{loan.remainingEmis} / {loan.loanPeriodMonths} Months</p>
                  </div>
                  <button
                    onClick={() => onOpenQuickAdd('emi')}
                    className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-sm"
                  >
                    Pay EMI
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
