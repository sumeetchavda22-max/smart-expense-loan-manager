import React, { useState } from 'react';
import { CreditCard, Plus, ArrowRightLeft, Wallet, Landmark, Smartphone, DollarSign } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import * as api from '../services/api';

interface AccountsPageProps {
  onOpenQuickAdd: (tab?: string) => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({ onOpenQuickAdd }) => {
  const { accounts, refreshData, currency } = useFinance();
  const [showAddAcc, setShowAddAcc] = useState(false);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState('SAVINGS');
  const [accBalance, setAccBalance] = useState('');
  const [accBank, setAccBank] = useState('');

  const totalBalance = accounts.reduce(
    (acc, a) => acc + (a.type === 'CREDIT_CARD' ? 0 : a.balance),
    0
  );

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName) return;
    await api.createAccount({
      name: accName,
      type: accType,
      balance: Number(accBalance) || 0,
      bankName: accBank,
    });
    setAccName('');
    setAccBalance('');
    setShowAddAcc(false);
    await refreshData();
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'CASH':
        return <Wallet className="w-5 h-5 text-emerald-500" />;
      case 'UPI':
        return <Smartphone className="w-5 h-5 text-purple-500" />;
      case 'CREDIT_CARD':
        return <CreditCard className="w-5 h-5 text-blue-500" />;
      default:
        return <Landmark className="w-5 h-5 text-brand-600" />;
    }
  };

  return (
    <div className="space-y-4 pb-nav max-w-4xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bank & Payment Accounts</h1>
          <p className="text-xs text-gray-500">
            Total Combined Balance: <span className="font-bold text-brand-600">{currency}{totalBalance.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOpenQuickAdd('transfer')}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-semibold text-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </button>
          <button
            onClick={() => setShowAddAcc(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Account Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
                  {getAccountIcon(acc.type)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{acc.name}</h3>
                  <p className="text-[11px] text-gray-500">{acc.bankName || acc.type}</p>
                </div>
              </div>

              {acc.isDefault && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 font-medium">
                  Primary
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex justify-between items-baseline">
              <span className="text-[11px] text-gray-400 font-medium">Current Balance</span>
              <span className="text-lg font-extrabold text-gray-900 dark:text-white">
                {currency}{acc.balance.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Account Inline Modal */}
      {showAddAcc && (
        <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Add account">
          <form onSubmit={handleCreateAccount} className="sheet-panel bg-white dark:bg-slate-900 shadow-2xl">
            <div className="sheet-handle" />
            <div className="p-5 space-y-4 overflow-y-auto overscroll-contain">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Add New Account</h2>
            <div>
              <label className="block text-xs font-semibold mb-1">Account Name</label>
              <input
                type="text"
                placeholder="e.g. HDFC Salary Account"
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Account Type</label>
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                >
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CURRENT">Current Account</option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="WALLET">Mobile Wallet</option>
                  <option value="UPI">UPI Account</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Opening Balance ({currency})</label>
                <input
                  type="number" inputMode="decimal"
                  placeholder="0.00"
                  value={accBalance}
                  onChange={(e) => setAccBalance(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none"
                />
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAcc(false)}
                className="w-1/2 py-2.5 min-h-[2.75rem] rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 min-h-[2.75rem] rounded-xl bg-brand-600 text-white font-semibold text-xs shadow-md"
              >
                Save Account
              </button>
            </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
