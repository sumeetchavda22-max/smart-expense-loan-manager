import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler
);

// Shared mobile-friendly defaults: readable ticks on a 393px screen, theme-aware text/grid colours.
ChartJS.defaults.font.family = 'Inter, Roboto, sans-serif';
ChartJS.defaults.font.size = 11;

const useChartTheme = () => {
  const { theme } = useTheme();
  const dark = theme !== 'light';
  return {
    dark,
    text: dark ? '#cbd5e1' : '#475569',
    grid: dark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.25)',
    tooltipBg: dark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)',
    tooltipText: dark ? '#f1f5f9' : '#0f172a',
    ringBorder: dark ? '#0f172a' : '#ffffff',
  };
};

/** Compact Indian number formatting for axis ticks: 1.2L, 45K, 800 */
const compactINR = (v: number): string => {
  const abs = Math.abs(v);
  if (abs >= 1e7) return `${(v / 1e7).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (abs >= 1e5) return `${(v / 1e5).toFixed(1).replace(/\.0$/, '')}L`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return `${v}`;
};

const tooltipBase = (t: ReturnType<typeof useChartTheme>) => ({
  backgroundColor: t.tooltipBg,
  titleColor: t.tooltipText,
  bodyColor: t.tooltipText,
  borderColor: t.grid,
  borderWidth: 1,
  padding: 10,
  cornerRadius: 10,
  displayColors: true,
  boxPadding: 4,
});

export const ExpensePieChart: React.FC = () => {
  const { dashboard, currency } = useFinance();
  const t = useChartTheme();

  if (!dashboard || !dashboard.pieChartData || dashboard.pieChartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400">
        <p className="text-xs font-medium">No expenses logged for current month</p>
      </div>
    );
  }

  const total = dashboard.pieChartData.reduce((sum, d) => sum + d.amount, 0);

  const data = {
    labels: dashboard.pieChartData.map((d) => d.category),
    datasets: [
      {
        data: dashboard.pieChartData.map((d) => d.amount),
        backgroundColor: dashboard.pieChartData.map((d) => d.color),
        borderWidth: 2,
        borderColor: t.ringBorder,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    layout: { padding: 4 },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: t.text,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          font: { size: 11 },
        },
      },
      tooltip: {
        ...tooltipBase(t),
        callbacks: {
          label: (context: any) => {
            const pct = total > 0 ? Math.round((context.raw / total) * 100) : 0;
            return ` ${context.label}: ${currency}${context.raw.toLocaleString('en-IN')} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="relative h-64 xs:h-72 sm:h-64">
      <Doughnut data={data} options={options} />
      {/* Centre total inside the ring */}
      <div className="pointer-events-none absolute inset-x-0 top-[38%] xs:top-[36%] flex flex-col items-center -translate-y-1/2">
        <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500 font-semibold">Total</span>
        <span className="text-sm font-extrabold text-gray-900 dark:text-white tabular-nums">
          {currency}{total.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
};

export const IncomeVsExpenseChart: React.FC = () => {
  const { dashboard, currency } = useFinance();
  const t = useChartTheme();

  const data = {
    labels: ['This Month'],
    datasets: [
      {
        label: 'Income / Salary',
        data: [dashboard?.totalSalary || 0],
        backgroundColor: '#10B981',
        borderRadius: 10,
        maxBarThickness: 64,
      },
      {
        label: 'Expenses',
        data: [dashboard?.totalMonthExpenses || 0],
        backgroundColor: '#EF4444',
        borderRadius: 10,
        maxBarThickness: 64,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: t.text, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle', padding: 14 },
      },
      tooltip: {
        ...tooltipBase(t),
        callbacks: {
          label: (context: any) => ` ${context.dataset.label}: ${currency}${context.raw.toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: t.text } },
      y: {
        beginAtZero: true,
        grid: { color: t.grid },
        border: { display: false },
        ticks: { color: t.text, maxTicksLimit: 5, callback: (v: any) => compactINR(Number(v)) },
      },
    },
  };

  return (
    <div className="h-52 xs:h-56">
      <Bar data={data} options={options} />
    </div>
  );
};

export const MonthlyTrendChart: React.FC = () => {
  const { dashboard, currency } = useFinance();
  const t = useChartTheme();

  const labels = dashboard?.monthlyTrend?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const trendData = dashboard?.monthlyTrend?.data || [0, 0, 0, 0, 0, 0];

  const data = {
    labels,
    datasets: [
      {
        fill: true,
        label: 'Monthly Expenses',
        data: trendData,
        borderColor: '#1186ac',
        backgroundColor: 'rgba(17, 134, 172, 0.14)',
        pointBackgroundColor: '#1186ac',
        pointBorderColor: t.ringBorder,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHitRadius: 18, // easier to tap on a phone
        borderWidth: 2.5,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipBase(t),
        callbacks: {
          label: (context: any) => ` Expenses: ${currency}${context.raw.toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: t.text } },
      y: {
        beginAtZero: true,
        grid: { color: t.grid },
        border: { display: false },
        ticks: { color: t.text, maxTicksLimit: 5, callback: (v: any) => compactINR(Number(v)) },
      },
    },
  };

  return (
    <div className="h-48 xs:h-52">
      <Line data={data} options={options} />
    </div>
  );
};
