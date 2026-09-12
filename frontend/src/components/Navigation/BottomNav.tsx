import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Landmark,
  CreditCard,
  Wallet,
  Bell,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
  Grid,
  X,
  Briefcase,
  Calendar,
  Calculator,
  ChevronRight,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
}

const MORE_TABS = ['salary', 'accounts', 'credit', 'reminders', 'calendar', 'reports', 'calculators', 'settings'];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number; ready: boolean }>({ left: 0, width: 0, ready: false });

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMenuOpen(false);
  };

  const moreMenuItems = [
    { id: 'salary', label: 'Salary Hub', desc: 'Net salary & deductions', icon: Briefcase, color: 'bg-emerald-500' },
    { id: 'accounts', label: 'Bank Accounts', desc: 'Cash, Bank & Transfers', icon: Wallet, color: 'bg-purple-500' },
    { id: 'credit', label: 'Credit Cards', desc: 'Card limits & bill dues', icon: CreditCard, color: 'bg-blue-500' },
    { id: 'reminders', label: 'Due Reminders', desc: 'Bills, EMI & Recharge alerts', icon: Bell, color: 'bg-amber-500' },
    { id: 'calendar', label: 'Calendar View', desc: 'Monthly dues & events grid', icon: Calendar, color: 'bg-indigo-500' },
    { id: 'reports', label: 'Reports & Export', desc: 'Download PDF, Excel & CSV', icon: BarChart3, color: 'bg-teal-500' },
    { id: 'calculators', label: 'Calculators', desc: 'EMI & Credit safety meter', icon: Calculator, color: 'bg-rose-500' },
    { id: 'settings', label: 'Settings', desc: 'Dark mode, PIN & Currency', icon: SettingsIcon, color: 'bg-slate-600' },
  ];

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, active: activeTab === 'dashboard' },
    { id: 'expenses', label: 'Expenses', icon: Receipt, active: activeTab === 'expenses' },
    null, // centre "+" slot — a raised action button, not part of the sliding indicator
    { id: 'loans', label: 'Loans', icon: Landmark, active: activeTab === 'loans' || activeTab === 'credit' },
    { id: 'more', label: 'More', icon: Grid, active: menuOpen || MORE_TABS.includes(activeTab) },
  ] as const;

  const activeId = tabs.find((t) => t && t.active)?.id ?? null;

  // Measure the active tab's position/width so the glass pill can slide (not jump) to it.
  useLayoutEffect(() => {
    const measure = () => {
      const rail = railRef.current;
      const el = activeId ? tabRefs.current[activeId] : null;
      if (!rail || !el) return;
      const railRect = rail.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setIndicator({ left: elRect.left - railRect.left, width: elRect.width, ready: true });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (railRef.current) ro.observe(railRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [activeId]);

  return (
    <>
      {/* Floating liquid-glass pill tab bar, with a sliding "liquid" indicator behind the active tab */}
      <nav className="tab-bar-float" aria-label="Primary">
        <div className="tab-rail" ref={railRef}>
          <div
            className={`tab-slider ${indicator.ready ? 'is-ready' : ''}`}
            style={{ transform: `translateX(${indicator.left}px)`, width: `${indicator.width}px` }}
            aria-hidden="true"
          />
          {tabs.map((tab) => {
            if (tab === null) {
              return (
                <button key="add" onClick={onOpenQuickAdd} className="tab-item group" aria-label="Quick add">
                  <span className="tab-add liquid-fab">
                    <Plus className="w-6 h-6 stroke-[2.5]" />
                  </span>
                </button>
              );
            }
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                onClick={() => (tab.id === 'more' ? setMenuOpen((o) => !o) : handleTabClick(tab.id))}
                className={`tab-item ${tab.active ? 'is-active' : ''}`}
                aria-current={tab.active ? 'page' : undefined}
                aria-label={tab.label}
              >
                <span className="tab-icon">
                  <Icon className="w-[19px] h-[19px]" strokeWidth={tab.active ? 2.4 : 1.9} />
                </span>
                <span className="tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* LIQUID GLASS MORE MENU BOTTOM SHEET DRAWER */}
      {menuOpen && (
        <div
          className="sheet-overlay"
          onClick={() => setMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="All modules"
        >
          <div
            className="sheet-panel liquid-glass shadow-2xl border border-white/60 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="p-4 xs:p-5 flex flex-col min-h-0">
            {/* Sheet Header */}
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
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200/70"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto py-2 pr-1 min-h-0 no-scrollbar">
              {moreMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`p-3 xs:p-3.5 min-h-[3.5rem] rounded-2xl liquid-glass-card flex items-center justify-between text-left group transition-all duration-200 active:scale-[0.98] ${
                      isActive
                        ? 'border-2 border-brand-500 bg-brand-50/50 dark:bg-brand-950/30'
                        : 'hover:border-brand-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl ${item.color} text-white shadow-md shadow-brand-500/10 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 line-clamp-1">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                );
              })}
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
