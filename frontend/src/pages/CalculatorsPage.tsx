import React, { useState } from 'react';
import { Calculator, Percent } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const CalculatorsPage: React.FC = () => {
  const { currency } = useFinance();

  // EMI state
  const [amount, setAmount] = useState<number>(500000);
  const [rate, setRate] = useState<number>(10.5);
  const [tenureYears, setTenureYears] = useState<number>(3);

  // EMI calculations
  const months = tenureYears * 12;
  const monthlyRate = rate / 12 / 100;

  let emi = 0;
  if (monthlyRate > 0) {
    emi = Math.round(
      (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1)
    );
  } else {
    emi = Math.round(amount / months);
  }

  const totalPayment = emi * months;
  const totalInterest = Math.max(0, totalPayment - amount);

  return (
    <div className="space-y-5 pb-nav max-w-4xl mx-auto px-4 pt-4">
      {/* Title */}
      <div className="flex items-center space-x-2">
        <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Financial Calculators</h1>
          <p className="text-xs text-gray-500">Plan a loan's EMI, interest & total payable</p>
        </div>
      </div>

      {/* 1. EMI CALCULATOR */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
          <Percent className="w-4 h-4 text-brand-600 mr-2" /> Loan EMI Calculator
        </h2>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Loan Amount</span>
              <span className="text-brand-600">{currency}{amount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="5000000"
              step="10000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Interest Rate (p.a.)</span>
              <span className="text-brand-600">{rate}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.25"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Tenure</span>
              <span className="text-brand-600">{tenureYears} Years ({months} Months)</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>
        </div>

        {/* Calculation Result Breakdown */}
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[11px] text-gray-500">Monthly EMI</p>
            <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{currency}{emi.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-500">Total Interest</p>
            <p className="text-sm font-bold text-amber-500">{currency}{totalInterest.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-500">Total Payable</p>
            <p className="text-sm font-bold text-emerald-500">{currency}{totalPayment.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
