import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0');

const FREQUENCIES: Record<string, { label: string; perYear: number }> = {
  MONTHLY: { label: 'Monthly', perYear: 12 },
  QUARTERLY: { label: 'Quarterly', perYear: 4 },
  HALF_YEARLY: { label: 'Half-Yearly', perYear: 2 },
  YEARLY: { label: 'Yearly', perYear: 1 },
};

/** Deliberately just premium x frequency x duration — the fields are generic (premium,
 * frequency, duration, coverage) so a specific policy type's math can slot in later without
 * reshaping the UI. */
export const InsuranceCalculator: React.FC = () => {
  const { currency } = useFinance();

  const [coverage, setCoverage] = useState('1000000');
  const [premium, setPremium] = useState('12000');
  const [frequency, setFrequency] = useState<keyof typeof FREQUENCIES>('YEARLY');
  const [durationYears, setDurationYears] = useState('10');

  const coverageAmount = Number(coverage) || 0;
  const premiumPerInstallment = Number(premium) || 0;
  const perYear = FREQUENCIES[frequency].perYear;
  const duration = Number(durationYears) || 0;

  const annualPremium = premiumPerInstallment * perYear;
  const monthlyEquivalent = annualPremium / 12;
  const totalPremiumOverDuration = annualPremium * duration;

  const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{label}</label>
      {children}
    </div>
  );
  const inputCls = "w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500";

  const Row: React.FC<{ label: string; value: string; strong?: boolean; tone?: string }> = ({ label, value, strong, tone }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800 last:border-0">
      <span className="text-xs text-gray-500 dark:text-slate-400">{label}</span>
      <span className={`tabular-nums ${strong ? 'text-base font-bold' : 'text-sm font-semibold'} ${tone || 'text-gray-900 dark:text-white'}`}>{value}</span>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 md:items-start">
      <div className="liquid-glass-card rounded-2xl p-4 space-y-3">
        <Field label={`Coverage Amount (${currency})`}>
          <input type="number" inputMode="decimal" value={coverage} onChange={(e) => setCoverage(e.target.value)} className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`Premium (${currency})`}>
            <input type="number" inputMode="decimal" value={premium} onChange={(e) => setPremium(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Payment Frequency">
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} className={inputCls}>
              {Object.entries(FREQUENCIES).map(([key, f]) => (
                <option key={key} value={key}>{f.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Policy Duration (years)">
          <input type="number" inputMode="decimal" value={durationYears} onChange={(e) => setDurationYears(e.target.value)} className={inputCls} />
        </Field>
      </div>

      <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 grid grid-cols-2 gap-3 text-center">
        <div>
          <p className="text-[11px] text-gray-500">Monthly Equivalent</p>
          <p className="text-base font-bold text-brand-600 dark:text-brand-400 tabular-nums">{currency}{fmt(monthlyEquivalent)}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500">Annual Equivalent</p>
          <p className="text-base font-bold text-emerald-500 tabular-nums">{currency}{fmt(annualPremium)}</p>
        </div>
      </div>

      <div className="liquid-glass-card rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Breakdown</p>
        <Row label="Coverage Amount" value={`${currency}${fmt(coverageAmount)}`} />
        <Row label="Premium per Installment" value={`${currency}${fmt(premiumPerInstallment)} / ${FREQUENCIES[frequency].label.toLowerCase()}`} />
        <Row label="Monthly Equivalent" value={`${currency}${fmt(monthlyEquivalent)}`} />
        <Row label="Annual Premium" value={`${currency}${fmt(annualPremium)}`} />
        <Row label={`Total Premium over ${duration || 0} yrs`} value={`${currency}${fmt(totalPremiumOverDuration)}`} strong tone="text-brand-600 dark:text-brand-400" />
      </div>
      </div>
    </div>
  );
};
