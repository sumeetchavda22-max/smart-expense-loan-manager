import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0');

export const LoanCalculator: React.FC = () => {
  const { currency } = useFinance();

  const [amount, setAmount] = useState('500000');
  const [downPayment, setDownPayment] = useState('0');
  const [rate, setRate] = useState('10');
  const [tenure, setTenure] = useState('5');
  const [tenureUnit, setTenureUnit] = useState<'months' | 'years'>('years');
  const [processingFee, setProcessingFee] = useState('0');
  const [processingFeeIsPct, setProcessingFeeIsPct] = useState(true);

  const loanAmount = Number(amount) || 0;
  const down = Number(downPayment) || 0;
  const principal = Math.max(0, loanAmount - down);
  const annualRate = Number(rate) || 0;
  const months = Math.max(1, tenureUnit === 'years' ? (Number(tenure) || 0) * 12 : Number(tenure) || 0);
  const monthlyRate = annualRate / 12 / 100;

  // Standard reducing-balance EMI formula: EMI = P x r x (1+r)^n / ((1+r)^n - 1)
  let emi = 0;
  if (principal > 0) {
    emi = monthlyRate > 0
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
      : principal / months;
  }
  const totalPayment = emi * months;
  const totalInterest = Math.max(0, totalPayment - principal);
  const feeAmount = processingFeeIsPct ? principal * (Number(processingFee) || 0) / 100 : Number(processingFee) || 0;
  const effectiveTotalCost = totalPayment + feeAmount + down;

  const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{label}</label>
      {children}
    </div>
  );
  const inputCls = "w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500";
  // Same look as inputCls but WITHOUT w-full — appending `w-24` on top of inputCls doesn't
  // override its w-full (Tailwind's cascade order, not class-string order, decides which wins,
  // and w-full comes out on top), which was squeezing the field next to it down to ~0 width.
  const fixedWidthCls = "px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500";

  const Row: React.FC<{ label: string; value: string; strong?: boolean; tone?: string }> = ({ label, value, strong, tone }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800 last:border-0">
      <span className="text-xs text-gray-500 dark:text-slate-400">{label}</span>
      <span className={`tabular-nums ${strong ? 'text-base font-bold' : 'text-sm font-semibold'} ${tone || 'text-gray-900 dark:text-white'}`}>{value}</span>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 md:items-start">
      <div className="liquid-glass-card rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Loan Amount (${currency})`}>
            <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
          </Field>
          <Field label={`Down Payment (${currency})`}>
            <input type="number" inputMode="decimal" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Interest Rate (% p.a.)">
            <input type="number" inputMode="decimal" step="0.05" value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Tenure">
            <div className="flex gap-1.5">
              <input type="number" inputMode="decimal" value={tenure} onChange={(e) => setTenure(e.target.value)} className={`${inputCls} min-w-0 flex-1`} />
              <select value={tenureUnit} onChange={(e) => setTenureUnit(e.target.value as any)} className={`${fixedWidthCls} w-24 shrink-0`}>
                <option value="years">Years</option>
                <option value="months">Months</option>
              </select>
            </div>
          </Field>
        </div>

        <Field label="Processing Fee">
          <div className="flex gap-1.5">
            <input type="number" inputMode="decimal" value={processingFee} onChange={(e) => setProcessingFee(e.target.value)} className={`${inputCls} min-w-0 flex-1`} />
            <div className="flex rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shrink-0">
              <button type="button" onClick={() => setProcessingFeeIsPct(true)} className={`px-3 text-xs font-bold ${processingFeeIsPct ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-500'}`}>%</button>
              <button type="button" onClick={() => setProcessingFeeIsPct(false)} className={`px-3 text-xs font-bold ${!processingFeeIsPct ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-500'}`}>{currency}</button>
            </div>
          </div>
        </Field>
      </div>

      <div className="space-y-4">
      {/* Headline result */}
      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[11px] text-gray-500">Monthly EMI</p>
          <p className="text-base font-bold text-brand-600 dark:text-brand-400 tabular-nums">{currency}{fmt(emi)}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500">Total Interest</p>
          <p className="text-base font-bold text-amber-500 tabular-nums">{currency}{fmt(totalInterest)}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500">Total Payable</p>
          <p className="text-base font-bold text-emerald-500 tabular-nums">{currency}{fmt(totalPayment)}</p>
        </div>
      </div>

      {/* Full breakdown */}
      <div className="liquid-glass-card rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Breakdown</p>
        <Row label="Loan Amount" value={`${currency}${fmt(loanAmount)}`} />
        <Row label="Down Payment" value={`${currency}${fmt(down)}`} />
        <Row label="Principal Financed" value={`${currency}${fmt(principal)}`} />
        <Row label="Interest Rate" value={`${annualRate}% p.a.`} />
        <Row label="Tenure" value={`${months} months`} />
        <Row label="Principal Amount" value={`${currency}${fmt(principal)}`} />
        <Row label="Interest Amount" value={`${currency}${fmt(totalInterest)}`} />
        <Row label="Processing Fee" value={`${currency}${fmt(feeAmount)}`} />
        <Row label="Effective Total Cost" value={`${currency}${fmt(effectiveTotalCost)}`} strong tone="text-brand-600 dark:text-brand-400" />
      </div>
      </div>
    </div>
  );
};
