import React, { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, FileCode, Loader2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import * as api from '../services/api';

export const ReportsPage: React.FC = () => {
  const { dashboard, currency } = useFinance();
  const [busy, setBusy] = useState<'pdf' | 'excel' | 'csv' | null>(null);

  const run = async (kind: 'pdf' | 'excel' | 'csv', fn: () => Promise<void>) => {
    setBusy(kind);
    try {
      await fn();
    } catch (e: any) {
      alert(e.message || 'Export failed');
    } finally {
      setBusy(null);
    }
  };

  const handleDownloadPDF = () => run('pdf', () => api.exportReportPdf(currency));
  const handleDownloadExcel = () => run('excel', () => api.exportReportExcel());
  const handleDownloadCSV = () => run('csv', () => api.exportReportCsv());

  return (
    <div className="space-y-5 pb-nav max-w-4xl mx-auto px-4 pt-4">
      {/* Title */}
      <div className="flex items-center space-x-2">
        <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reports & Export Center</h1>
          <p className="text-xs text-gray-500">Download formatted financial statements in PDF, Excel, or CSV — generated on your device</p>
        </div>
      </div>

      {/* Export Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <button
          onClick={handleDownloadPDF}
          disabled={busy !== null}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-3 hover:border-red-500 transition-all active:scale-95 group disabled:opacity-60"
        >
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500 group-hover:scale-110 transition-transform">
            {busy === 'pdf' ? <Loader2 className="w-7 h-7 animate-spin" /> : <FileText className="w-7 h-7" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Download PDF Report</h3>
            <p className="text-[11px] text-gray-400">Formatted printable summary</p>
          </div>
        </button>

        <button
          onClick={handleDownloadExcel}
          disabled={busy !== null}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-3 hover:border-emerald-500 transition-all active:scale-95 group disabled:opacity-60"
        >
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 group-hover:scale-110 transition-transform">
            {busy === 'excel' ? <Loader2 className="w-7 h-7 animate-spin" /> : <FileSpreadsheet className="w-7 h-7" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Export Excel (.xlsx)</h3>
            <p className="text-[11px] text-gray-400">Multi-sheet raw ledger</p>
          </div>
        </button>

        <button
          onClick={handleDownloadCSV}
          disabled={busy !== null}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-3 hover:border-blue-500 transition-all active:scale-95 group disabled:opacity-60"
        >
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 group-hover:scale-110 transition-transform">
            {busy === 'csv' ? <Loader2 className="w-7 h-7 animate-spin" /> : <FileCode className="w-7 h-7" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Download CSV Ledger</h3>
            <p className="text-[11px] text-gray-400">Comma-separated raw data</p>
          </div>
        </button>
      </div>

      {/* Financial Statement Summary Preview */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Current Month Financial Overview
        </h2>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-800">
            <span className="text-gray-600 dark:text-slate-400 font-medium">Total Income</span>
            <span className="font-bold text-emerald-500">+{currency}{(dashboard?.totalIncome || 0).toLocaleString()}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-800">
            <span className="text-gray-600 dark:text-slate-400 font-medium">Total Monthly Expenses</span>
            <span className="font-bold text-red-500">-{currency}{(dashboard?.totalMonthExpenses || 0).toLocaleString()}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-800">
            <span className="text-gray-600 dark:text-slate-400 font-medium">Monthly Active Loan EMIs</span>
            <span className="font-bold text-amber-500">{currency}{(dashboard?.totalMonthlyEMI || 0).toLocaleString()}</span>
          </div>

          <div className="flex justify-between py-2 font-bold text-sm text-gray-900 dark:text-white">
            <span>Net Calculated Savings</span>
            <span className="text-brand-600">{currency}{(dashboard?.savings || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
