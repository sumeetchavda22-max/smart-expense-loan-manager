import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0');
const RATES = [5, 12, 18, 28];

const inputCls = "w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500";

const Row: React.FC<{ label: string; value: string; strong?: boolean; tone?: string }> = ({ label, value, strong, tone }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800 last:border-0">
    <span className="text-xs text-gray-500 dark:text-slate-400">{label}</span>
    <span className={`tabular-nums ${strong ? 'text-base font-bold' : 'text-sm font-semibold'} ${tone || 'text-gray-900 dark:text-white'}`}>{value}</span>
  </div>
);

export const GSTCalculator: React.FC = () => {
  const { currency } = useFinance();
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState('1000');
  const [rate, setRate] = useState('18');

  const amt = Number(amount) || 0;
  const r = Number(rate) || 0;

  // "add": amount is the base price, GST is added on top.
  // "remove": amount is the GST-inclusive price, back out the base price and GST portion.
  const base = mode === 'add' ? amt : amt / (1 + r / 100);
  const gstAmount = mode === 'add' ? (amt * r) / 100 : amt - base;
  const total = mode === 'add' ? amt + gstAmount : amt;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setMode('add')}
          className={`py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'add' ? 'bg-brand-600 text-white shadow-md' : 'liquid-glass-card text-gray-600 dark:text-slate-300'}`}
        >
          Add GST
        </button>
        <button
          onClick={() => setMode('remove')}
          className={`py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'remove' ? 'bg-brand-600 text-white shadow-md' : 'liquid-glass-card text-gray-600 dark:text-slate-300'}`}
        >
          Remove GST
        </button>
      </div>

      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 md:items-start">
      <div className="liquid-glass-card rounded-2xl p-4 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            {mode === 'add' ? `Base Amount (${currency})` : `GST-Inclusive Amount (${currency})`}
          </label>
          <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">GST Rate (%)</label>
          <div className="grid grid-cols-5 gap-1.5">
            {RATES.map((v) => (
              <button
                key={v}
                onClick={() => setRate(String(v))}
                className={`py-2 rounded-lg text-xs font-bold ${Number(rate) === v ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'}`}
              >
                {v}%
              </button>
            ))}
            <input type="number" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className={`${inputCls} col-span-5 mt-1.5`} placeholder="Custom rate" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 grid grid-cols-2 gap-3 text-center">
        <div>
          <p className="text-[11px] text-gray-500">Base Amount</p>
          <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{currency}{fmt(base)}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500">Total (incl. GST)</p>
          <p className="text-base font-bold text-brand-600 dark:text-brand-400 tabular-nums">{currency}{fmt(total)}</p>
        </div>
      </div>

      <div className="liquid-glass-card rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Breakdown</p>
        <Row label="Base Amount" value={`${currency}${fmt(base)}`} />
        <Row label={`CGST (${(r / 2).toFixed(1)}%)`} value={`${currency}${fmt(cgst)}`} />
        <Row label={`SGST (${(r / 2).toFixed(1)}%)`} value={`${currency}${fmt(sgst)}`} />
        <Row label="Total GST" value={`${currency}${fmt(gstAmount)}`} tone="text-amber-500" />
        <Row label="Total Amount" value={`${currency}${fmt(total)}`} strong tone="text-brand-600 dark:text-brand-400" />
      </div>
      </div>
      </div>
    </div>
  );
};
