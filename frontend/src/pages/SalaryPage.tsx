import React from 'react';
import { Briefcase, Plus, TrendingUp, CheckCircle, Calculator, Building } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface SalaryPageProps {
  onOpenQuickAdd: () => void;
}

export const SalaryPage: React.FC<SalaryPageProps> = ({ onOpenQuickAdd }) => {
  const { salaries, currency } = useFinance();

  const totalInHandAllTime = salaries.reduce((acc, s) => acc + s.inHandSalary, 0);

  return (
    <div className="space-y-4 pb-nav max-w-4xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Salary & Income Hub</h1>
          <p className="text-xs text-gray-500">
            Total Salary Logged: <span className="font-bold text-emerald-500">{currency}{totalInHandAllTime.toLocaleString()}</span>
          </p>
        </div>
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Salary</span>
        </button>
      </div>

      {/* Salary History Cards */}
      {salaries.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">No Salary Account Configured</p>
          <p className="text-xs text-gray-400">
            Add your employer salary structure to automatically compute Net In-Hand income after PF, TDS, and EMI deductions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {salaries.map((sal) => (
            <div
              key={sal.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">{sal.companyName}</h2>
                    <p className="text-xs text-gray-500">
                      Month: <span className="font-semibold text-gray-700 dark:text-slate-300">{sal.month}</span> • Deposit to {sal.account?.name || 'Bank Account'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Final In-Hand</span>
                  <span className="text-lg font-extrabold text-emerald-500">
                    {currency}{sal.inHandSalary.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Automatic Deduction Breakdown */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">Gross Salary</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">{currency}{sal.monthlySalary.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">PF Deduction</span>
                  <span className="font-semibold text-red-400">-{currency}{sal.pfDeduction.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">TDS Tax</span>
                  <span className="font-semibold text-red-400">-{currency}{sal.tdsDeduction.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Prof Tax</span>
                  <span className="font-semibold text-red-400">-{currency}{sal.profTax.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
