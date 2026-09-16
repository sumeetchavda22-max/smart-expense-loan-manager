import React from 'react';
import { Grid, X, Briefcase, Bell, Calendar, BarChart3, Calculator, Settings as SettingsIcon, Plus } from 'lucide-react';

interface MoreMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenQuickAdd: () => void;
}

// One neutral tone for every tile — icon + label already distinguish them, so a different
// color per tile was just noise. Quick Create keeps the brand accent since it's the one
// primary action here. "Accounts" now lives on the primary bottom tab bar, not in here.
const MENU_ITEMS = [
  { id: 'salary', label: 'Salary', icon: Briefcase },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'calculators', label: 'Calculators', icon: Calculator },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const MORE_MENU_TABS = MENU_ITEMS.map((i) => i.id);

/** The "everything else" sheet, opened from the Navbar's grid icon. */
export const MoreMenuSheet: React.FC<MoreMenuSheetProps> = ({ isOpen, onClose, activeTab, onNavigate, onOpenQuickAdd }) => {
  if (!isOpen) return null;

  return (
    <div className="sheet-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="All modules">
      <div className="sheet-panel liquid-glass shadow-2xl border border-white/60 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="p-4 xs:p-5 flex flex-col min-h-0">
          <div className="flex justify-between items-center pb-4 mb-2 border-b border-gray-200/50 dark:border-slate-800/50">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Grid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Smart Navigation</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">All Modules & Tools</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200/70"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2.5 overflow-y-auto py-2 pr-1 min-h-0 no-scrollbar">
            <button
              onClick={() => {
                onClose();
                onOpenQuickAdd();
              }}
              className="p-2.5 rounded-2xl liquid-glass-card flex flex-col items-center justify-center gap-1.5 text-center group transition-all duration-200 active:scale-[0.95]"
            >
              <div className="w-10 h-10 rounded-xl liquid-fab flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <p className="text-[10.5px] font-bold text-gray-900 dark:text-white leading-tight">Quick Create</p>
            </button>
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`p-2.5 rounded-2xl liquid-glass-card flex flex-col items-center justify-center gap-1.5 text-center group transition-all duration-200 active:scale-[0.95] ${
                    isActive ? 'border-2 border-brand-500 bg-brand-50/50 dark:bg-brand-950/30' : 'hover:border-brand-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <p className="text-[10.5px] font-bold text-gray-900 dark:text-white leading-tight">{item.label}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
