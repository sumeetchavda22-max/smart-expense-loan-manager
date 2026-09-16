import React, { useLayoutEffect, useRef, useState } from 'react';
import { LayoutDashboard, Receipt, Landmark, Wallet, Plus } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
}

/** Primary tab bar: Home, Expenses, Loan, Account, then Create last — all five styled the
 * same way (no raised center FAB). "Create" isn't a page, it just opens Quick Add, so it never
 * takes the sliding active-indicator pill. Everything else (Salary, Reminders, Calendar,
 * Reports, Calculators, Settings) lives in the "More" sheet, opened from the Navbar now. */
export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
}) => {
  const railRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number; ready: boolean }>({ left: 0, width: 0, ready: false });

  const pageTabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'loans', label: 'Loan', icon: Landmark },
    { id: 'accounts', label: 'Account', icon: Wallet },
  ] as const;

  const activeId = pageTabs.find((t) => t.id === activeTab)?.id ?? null;

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
    <nav className="tab-bar-float" aria-label="Primary">
      <div className="tab-rail" ref={railRef}>
        <div
          className={`tab-slider ${indicator.ready ? 'is-ready' : ''}`}
          style={{ transform: `translateX(${indicator.left}px)`, width: `${indicator.width}px` }}
          aria-hidden="true"
        />
        {pageTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[tab.id] = el; }}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-item ${isActive ? 'is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
            >
              <span className="tab-icon">
                <Icon className="w-[19px] h-[19px]" strokeWidth={isActive ? 2.4 : 1.9} />
              </span>
              <span className="tab-label">{tab.label}</span>
            </button>
          );
        })}
        <button onClick={onOpenQuickAdd} className="tab-item" aria-label="Create">
          <span className="tab-icon">
            <Plus className="w-[19px] h-[19px]" strokeWidth={2.2} />
          </span>
          <span className="tab-label">Create</span>
        </button>
      </div>
    </nav>
  );
};
