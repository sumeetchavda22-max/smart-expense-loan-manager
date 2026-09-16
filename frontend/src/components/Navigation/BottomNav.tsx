import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Landmark,
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
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
}

const MORE_TABS = ['salary', 'accounts', 'reminders', 'calendar', 'reports', 'calculators', 'settings'];

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

  // One neutral tone for every tile — icon + label already distinguish them, so a different
  // color per tile was just noise. Quick Create keeps the brand accent since it's the one
  // primary action here.
  const moreMenuItems = [
    { id: 'salary', label: 'Salary', icon: Briefcase },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'calculators', label: 'Calculators', icon: Calculator },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, active: activeTab === 'dashboard' },
    { id: 'expenses', label: 'Expenses', icon: Receipt, active: activeTab === 'expenses' },
    null, // centre "+" slot — a raised action button, not part of the sliding indicator
    { id: 'loans', label: 'Loans', icon: Landmark, active: activeTab === 'loans' },
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

            {/* Menu Grid — compact icon tiles, side by side, instead of one big list */}
            <div className="grid grid-cols-4 gap-2.5 overflow-y-auto py-2 pr-1 min-h-0 no-scrollbar">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenQuickAdd();
                }}
                className="p-2.5 rounded-2xl liquid-glass-card flex flex-col items-center justify-center gap-1.5 text-center group transition-all duration-200 active:scale-[0.95]"
              >
                <div className="w-10 h-10 rounded-xl liquid-fab flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <p className="text-[10.5px] font-bold text-gray-900 dark:text-white leading-tight">Quick Create</p>
              </button>
              {moreMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`p-2.5 rounded-2xl liquid-glass-card flex flex-col items-center justify-center gap-1.5 text-center group transition-all duration-200 active:scale-[0.95] ${
                      isActive
                        ? 'border-2 border-brand-500 bg-brand-50/50 dark:bg-brand-950/30'
                        : 'hover:border-brand-300'
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
      )}
    </>
  );
};
