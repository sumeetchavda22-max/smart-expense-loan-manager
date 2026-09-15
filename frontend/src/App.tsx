import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthPinProvider } from './context/AuthPinContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { Navbar } from './components/Navigation/Navbar';
import { BottomNav } from './components/Navigation/BottomNav';
import { QuickAddModal } from './components/Modals/QuickAddModal';
import { GlobalSearchModal } from './components/Modals/GlobalSearchModal';
import { PINLockModal } from './components/Modals/PINLockModal';
import { InstallPrompt } from './components/PWA/InstallPrompt';
import { UpdateToast } from './components/PWA/UpdateToast';

import { Dashboard } from './pages/Dashboard';
import { ExpensesPage } from './pages/ExpensesPage';
import { SalaryPage } from './pages/SalaryPage';
import { LoansPage } from './pages/LoansPage';
import { AccountsPage } from './pages/AccountsPage';
import { RemindersPage } from './pages/RemindersPage';
import { CalendarPage } from './pages/CalendarPage';
import { ReportsPage } from './pages/ReportsPage';
import { CalculatorsPage } from './pages/CalculatorsPage';
import { SettingsPage } from './pages/SettingsPage';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [quickAddOpen, setQuickAddOpen] = useState<boolean>(false);
  const [quickAddDefaultTab, setQuickAddDefaultTab] = useState<string>('expense');
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const { refreshData } = useFinance();
  const { pull, refreshing, ready } = usePullToRefresh(refreshData);

  // Each tab is its own "screen" on a phone: always start it from the top
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  const handleOpenQuickAdd = (tab: string = 'expense') => {
    setQuickAddDefaultTab(tab);
    setQuickAddOpen(true);
  };

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-background text-gray-900 dark:text-text-primary flex flex-col relative overflow-x-hidden">
      {/* Ambient peripheral glow gradients — institutional-fintech depth cue (dark theme only) */}
      <div className="hidden dark:block fixed top-[-10%] left-[-15%] w-[320px] h-[320px] rounded-full bg-growth-teal/10 blur-[100px] pointer-events-none -z-10" />
      <div className="hidden dark:block fixed top-[20%] right-[-10%] w-[280px] h-[280px] rounded-full bg-primary/10 blur-[90px] pointer-events-none -z-10" />
      <div className="hidden dark:block fixed bottom-[15%] left-[-10%] w-[300px] h-[300px] rounded-full bg-debt-rose/10 blur-[110px] pointer-events-none -z-10" />

      {/* Security PIN Lock Screen Overlay */}
      <PINLockModal />

      {/* PWA: service-worker update prompt (top) + install banner (bottom) */}
      <UpdateToast />
      <InstallPrompt />

      {/* Pull-to-refresh indicator (touch devices) */}
      {(pull > 0 || refreshing) && (
        <div
          className="ptr-indicator"
          style={{ opacity: Math.min(1, pull / 40), transform: `translateX(-50%) translateY(${Math.min(pull, 80) - 40}px)` }}
          aria-hidden="true"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? 'ptr-spin' : ''}`}
            style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)`, opacity: ready ? 1 : 0.6 }}
          />
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenSearch={() => setSearchOpen(true)}
        onOpenCalendar={() => setActiveTab('calendar')}
        onOpenCalculators={() => setActiveTab('calculators')}
      />

      {/* Page Routing */}
      <main
        className="flex-1"
        style={pull > 0 ? { transform: `translateY(${Math.min(pull, 80) * 0.5}px)`, transition: refreshing ? 'transform 200ms' : undefined } : undefined}
      >
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenQuickAdd={handleOpenQuickAdd}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'expenses' && <ExpensesPage onOpenQuickAdd={handleOpenQuickAdd} />}
        {activeTab === 'salary' && <SalaryPage onOpenQuickAdd={() => handleOpenQuickAdd('salary')} />}
        {activeTab === 'loans' && <LoansPage onOpenQuickAdd={handleOpenQuickAdd} />}
        {activeTab === 'accounts' && <AccountsPage onOpenQuickAdd={handleOpenQuickAdd} />}
        {activeTab === 'reminders' && <RemindersPage onOpenQuickAdd={handleOpenQuickAdd} />}
        {activeTab === 'calendar' && <CalendarPage />}
        {activeTab === 'reports' && <ReportsPage />}
        {activeTab === 'calculators' && <CalculatorsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      {/* Bottom Navigation Bar with FAB (+) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => handleOpenQuickAdd('expense')}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        defaultTab={quickAddDefaultTab}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthPinProvider>
        <FinanceProvider>
          <AppContent />
        </FinanceProvider>
      </AuthPinProvider>
    </ThemeProvider>
  );
}
