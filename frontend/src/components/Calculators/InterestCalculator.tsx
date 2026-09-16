import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0');

const inputCls = "w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{label}</label>
    {children}
  </div>
);

const Row: React.FC<{ label: string; value: string; strong?: boolean; tone?: string }> = ({ label, value, strong, tone }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800 last:border-0">
    <span className="text-xs text-gray-500 dark:text-slate-400">{label}</span>
    <span className={`tabular-nums ${strong ? 'text-base font-bold' : 'text-sm font-semibold'} ${tone || 'text-gray-900 dark:text-white'}`}>{value}</span>
  </div>
);

export const InterestCalculator: React.FC = () => {
  const { currency } = useFinance();
  const [mode, setMode] = useState<'simple' | 'compound'>('simple');

  const [principal, setPrincipal] = useState('100000');
  const [rate, setRate] = useState('8');
  const [years, setYears] = useState('3');
  const [compoundsPerYear, setCompoundsPerYear] = useState('1');

  const P = Number(principal) || 0;
  const R = Number(rate) || 0;
  const T = Number(years) || 0;
  const n = Math.max(1, Number(compoundsPerYear) || 1);

  const simpleInterest = (P * R * T) / 100;
  const simpleTotal = P + simpleInterest;

  const compoundTotal = P * Math.pow(1 + R / 100 / n, n * T);
  const compoundInterest = Math.max(0, compoundTotal - P);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setMode('simple')}
          className={`py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'simple' ? 'bg-brand-600 text-white shadow-md' : 'liquid-glass-card text-gray-600 dark:text-slate-300'}`}
        >
          Simple Interest
        </button>
        <button
          onClick={() => setMode('compound')}
          className={`py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'compound' ? 'bg-brand-600 text-white shadow-md' : 'liquid-glass-card text-gray-600 dark:text-slate-300'}`}
        >
          Compound Interest
        </button>
      </div>

      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 md:items-start">
      <div className="liquid-glass-card rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Principal (${currency})`}>
            <input type="number" inputMode="decimal" value={principal} onChange={(e) => setPrincipal(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Rate (% p.a.)">
            <input type="number" inputMode="decimal" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration (years)">
            <input type="number" inputMode="decimal" value={years} onChange={(e) => setYears(e.target.value)} className={inputCls} />
          </Field>
          {mode === 'compound' && (
            <Field label="Compounds / Year">
              <select value={compoundsPerYear} onChange={(e) => setCompoundsPerYear(e.target.value)} className={inputCls}>
                <option value="1">Yearly (1)</option>
                <option value="2">Half-Yearly (2)</option>
                <option value="4">Quarterly (4)</option>
                <option value="12">Monthly (12)</option>
              </select>
            </Field>
          )}
        </div>
      </div>

      {mode === 'simple' ? (
        <div className="liquid-glass-card rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Simple Interest</p>
          <Row label="Principal" value={`${currency}${fmt(P)}`} />
          <Row label="Interest" value={`${currency}${fmt(simpleInterest)}`} tone="text-amber-500" />
          <Row label="Total Amount" value={`${currency}${fmt(simpleTotal)}`} strong tone="text-brand-600 dark:text-brand-400" />
        </div>
      ) : (
        <div className="liquid-glass-card rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Compound Interest</p>
          <Row label="Principal" value={`${currency}${fmt(P)}`} />
          <Row label="Interest" value={`${currency}${fmt(compoundInterest)}`} tone="text-amber-500" />
          <Row label="Total Amount" value={`${currency}${fmt(compoundTotal)}`} strong tone="text-brand-600 dark:text-brand-400" />
        </div>
      )}
      </div>
    </div>
  );
};
