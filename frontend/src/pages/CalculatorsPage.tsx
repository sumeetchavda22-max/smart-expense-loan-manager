import React, { useState } from 'react';
import { Calculator as CalcIcon, Landmark, ShieldCheck, Percent, Receipt } from 'lucide-react';
import { NormalCalculator } from '../components/Calculators/NormalCalculator';
import { LoanCalculator } from '../components/Calculators/LoanCalculator';
import { InsuranceCalculator } from '../components/Calculators/InsuranceCalculator';
import { InterestCalculator } from '../components/Calculators/InterestCalculator';
import { GSTCalculator } from '../components/Calculators/GSTCalculator';

const TABS = [
  { id: 'normal', label: 'Normal', icon: CalcIcon, Component: NormalCalculator },
  { id: 'loan', label: 'Loan', icon: Landmark, Component: LoanCalculator },
  { id: 'insurance', label: 'Insurance', icon: ShieldCheck, Component: InsuranceCalculator },
  { id: 'interest', label: 'Interest', icon: Percent, Component: InterestCalculator },
  { id: 'gst', label: 'GST', icon: Receipt, Component: GSTCalculator },
] as const;

export const CalculatorsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('normal');
  const Active = TABS.find((t) => t.id === activeTab)?.Component ?? NormalCalculator;

  return (
    <div className="space-y-5 pb-nav max-w-4xl md:max-w-5xl mx-auto px-4 pt-4">
      {/* Title */}
      <div className="flex items-center space-x-2">
        <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400">
          <CalcIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Calculators</h1>
          <p className="text-xs text-gray-500">Normal, Loan, Insurance, Interest & GST</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1.5 p-1.5 liquid-glass-card rounded-2xl overflow-x-auto no-scrollbar snap-row">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[2.5rem] rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                isActive ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' : 'text-gray-600 dark:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active calculator — Loan/Insurance/Interest/GST switch to a 2-column (inputs | results)
          layout at md: and up; Normal stays a single narrow column since a wide numeric keypad
          doesn't read well stretched out. */}
      <div key={activeTab} className={`animate-in fade-in duration-200 mx-auto ${activeTab === 'normal' ? 'max-w-sm' : 'max-w-3xl'}`}>
        <Active />
      </div>
    </div>
  );
};
