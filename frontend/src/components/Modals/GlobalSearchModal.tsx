import React, { useState, useEffect } from 'react';
import { Search, X, Receipt, Landmark, Briefcase, Bell, CreditCard } from 'lucide-react';
import { globalSearch } from '../../services/api';
import { useFinance } from '../../context/FinanceContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { currency } = useFinance();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await globalSearch(query);
        setResults(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 sm:pt-16 animate-in fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-auto sm:max-h-[80vh] pt-safe sm:pt-0 pb-safe sm:pb-0 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="flex items-center px-4 py-2.5 min-h-[3.5rem] border-b border-gray-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search expenses, loans, salary, reminders…"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="ml-2 min-h-[2.5rem] px-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
            Cancel
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-4">
          {loading && <p className="text-xs text-gray-500 text-center py-4">Searching database...</p>}

          {!loading && results && (
            <>
              {/* Expenses */}
              {results.expenses?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                    <Receipt className="w-3.5 h-3.5 mr-1" /> Expenses ({results.expenses.length})
                  </h3>
                  <div className="space-y-2">
                    {results.expenses.map((e: any) => (
                      <div key={e.id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{e.title}</p>
                          <p className="text-[11px] text-gray-500">{new Date(e.date).toLocaleDateString()} • {e.paymentMethod}</p>
                        </div>
                        <span className="text-xs font-bold text-red-500">-{currency}{e.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loans */}
              {results.loans?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                    <Landmark className="w-3.5 h-3.5 mr-1" /> Loans ({results.loans.length})
                  </h3>
                  <div className="space-y-2">
                    {results.loans.map((l: any) => (
                      <div key={l.id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{l.name}</p>
                          <p className="text-[11px] text-gray-500">{l.bankName} • EMI: {currency}{l.emiAmount}</p>
                        </div>
                        <span className="text-xs font-bold text-amber-500">{currency}{l.outstandingBalance.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Salaries */}
              {results.salaries?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                    <Briefcase className="w-3.5 h-3.5 mr-1" /> Salary ({results.salaries.length})
                  </h3>
                  <div className="space-y-2">
                    {results.salaries.map((s: any) => (
                      <div key={s.id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{s.companyName}</p>
                          <p className="text-[11px] text-gray-500">{s.month}</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-500">+{currency}{s.inHandSalary.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reminders */}
              {results.reminders?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                    <Bell className="w-3.5 h-3.5 mr-1" /> Reminders ({results.reminders.length})
                  </h3>
                  <div className="space-y-2">
                    {results.reminders.map((r: any) => (
                      <div key={r.id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{r.title}</p>
                          <p className="text-[11px] text-gray-500">Due: {new Date(r.dueDate).toLocaleDateString()}</p>
                        </div>
                        <span className="text-xs font-bold text-blue-500">{currency}{r.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && query && results && Object.values(results).every((arr: any) => arr.length === 0) && (
            <p className="text-xs text-gray-500 text-center py-6">No matching records found for "{query}".</p>
          )}
        </div>
      </div>
    </div>
  );
};
