import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthPinProvider } from './context/AuthPinContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { usePWABadge } from './hooks/usePWABadge';
import { Navbar } from './components/Navigation/Navbar';
import { BottomNav } from './components/Navigation/BottomNav';
import { QuickAddModal } from './components/Modals/QuickAddModal';
import { GlobalSearchModal } from './components/Modals/GlobalSearchModal';
import { PINLockModal } from './components/Modals/PINLockModal';
import { InstallPrompt } from './components/PWA/InstallPrompt';
import { UpdateToast } from './components/PWA/UpdateToast';

// Dashboard is the very first thing every launch shows, so it stays a normal eager import —
// everything else loads on demand, so a phone doesn't pay for Reports/Calendar/etc. up front.
import { Dashboard } from './pages/Dashboard';
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then((m) => ({ default: m.ExpensesPage })));
const SalaryPage = lazy(() => import('./pages/SalaryPage').then((m) => ({ default: m.SalaryPage })));
const LoansPage = lazy(() => import('./pages/LoansPage').then((m) => ({ default: m.LoansPage })));
const AccountsPage = lazy(() => import('./pages/AccountsPage').then((m) => ({ default: m.AccountsPage })));
const RemindersPage = lazy(() => import('./pages/RemindersPage').then((m) => ({ default: m.RemindersPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const CalculatorsPage = lazy(() => import('./pages/CalculatorsPage').then((m) => ({ default: m.CalculatorsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const PageLoading: React.FC = () => (
  <div className="flex items-center justify-center py-24 text-brand-600 dark:text-brand-400">
    <Loader2 className="w-6 h-6 animate-spin" />
  </div>
);

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [quickAddOpen, setQuickAddOpen] = useState<boolean>(false);
  const [quickAddDefaultTab, setQuickAddDefaultTab] = useState<string>('expense');
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const { refreshData, reminders } = useFinance();
  const { pull, refreshing, ready } = usePullToRefresh(refreshData);
  usePWABadge(reminders);

  // Each tab is its own "screen" on a phone: always start it from the top
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  const handleOpenQuickAdd = (tab: string = 'expense') => {
    setQuickAddDefaultTab(tab);
    setQuickAddOpen(true);
  };

  // Deep links from the Home Screen icon's long-press shortcuts (manifest `shortcuts` in
  // vite.config.ts), e.g. "/?quickadd=expense" or "/?tab=reminders" — read once on launch,
  // then scrub the query string so a later in-app refresh doesn't replay it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const quickadd = params.get('quickadd');
    if (tab) setActiveTab(tab);
    if (quickadd) handleOpenQuickAdd(quickadd);
    if (tab || quickadd) window.history.replaceState({}, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh bg-white dark:bg-background text-gray-900 dark:text-text-primary flex flex-col relative overflow-x-hidden">
      {/* Ambient peripheral glow gradients — institutional-fintech depth cue for the plain Dark
          theme only. Hidden in Light (pure white) and in AMOLED (app-ambient-glow rule below),
          which are meant to be flat and gradient-free. */}
      <div className="app-ambient-glow hidden dark:block fixed top-[-10%] left-[-15%] w-[320px] h-[320px] rounded-full bg-growth-teal/10 blur-[100px] pointer-events-none -z-10" />
      <div className="app-ambient-glow hidden dark:block fixed top-[20%] right-[-10%] w-[280px] h-[280px] rounded-full bg-primary/10 blur-[90px] pointer-events-none -z-10" />
      <div className="app-ambient-glow hidden dark:block fixed bottom-[15%] left-[-10%] w-[300px] h-[300px] rounded-full bg-debt-rose/10 blur-[110px] pointer-events-none -z-10" />

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
        {activeTab !== 'dashboard' && (
          <Suspense fallback={<PageLoading />}>
            {activeTab === 'expenses' && <ExpensesPage onOpenQuickAdd={handleOpenQuickAdd} />}
            {activeTab === 'salary' && <SalaryPage onOpenQuickAdd={() => handleOpenQuickAdd('salary')} />}
            {activeTab === 'loans' && <LoansPage onOpenQuickAdd={handleOpenQuickAdd} />}
            {activeTab === 'accounts' && <AccountsPage onOpenQuickAdd={handleOpenQuickAdd} />}
            {activeTab === 'reminders' && <RemindersPage onOpenQuickAdd={handleOpenQuickAdd} />}
            {activeTab === 'calendar' && <CalendarPage />}
            {activeTab === 'reports' && <ReportsPage />}
            {activeTab === 'calculators' && <CalculatorsPage />}
            {activeTab === 'settings' && <SettingsPage />}
          </Suspense>
        )}
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
