'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatMoney } from '@/lib/format-money';

interface Transfer {
  from: string;
  to: string;
  amount: number;
}

interface SummarizeResponse {
  moneyPerPerson: Record<string, number>;
  totalMoneySpent: number;
  perPerson: number;
  transfers: Transfer[];
  month: number;
  year: number;
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function SummarizePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummarizeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/summarize?month=${month}&year=${year}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to generate summary');
        return;
      }
      setResult(data);
    } catch {
      setError('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    generate();
  }, [generate]);

  const monthLabel = MONTHS.find((m) => m.value === month)?.label ?? '';

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black">
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
          Summarize
        </h1>

        {/* Period Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6 shadow-sm mb-6">
          <div className="flex flex-col gap-1.5 flex-1 w-full sm:w-auto">
            <label htmlFor="month-select" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Month
            </label>
            <select
              id="month-select"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="h-9 px-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 w-full sm:w-auto">
            <label htmlFor="year-select" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Year
            </label>
            <input
              id="year-select"
              type="number"
              min="1970"
              max="2100"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
            />
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="h-9 px-5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Period Header */}
            <div className="text-center mb-6">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {monthLabel} {result.year}
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6 shadow-sm">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                  Total Money Spent
                </p>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatMoney(result.totalMoneySpent)}
                </p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6 shadow-sm">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                  Per Person Fair Share
                </p>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatMoney(result.perPerson)}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  across {Object.keys(result.moneyPerPerson).length} people
                </p>
              </div>
            </div>

            {/* Money Per Person Table */}
            {Object.keys(result.moneyPerPerson).length > 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden mb-6">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Spending Breakdown
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Person</th>
                        <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Paid</th>
                        <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(result.moneyPerPerson)
                        .sort(([, a], [, b]) => b - a)
                        .map(([person, paid], idx) => {
                          const diff = paid - result.perPerson;
                          return (
                            <tr
                              key={person}
                              className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${
                                idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800/30'
                              }`}
                            >
                              <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50 font-medium">{person}</td>
                              <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-50">{formatMoney(paid)}</td>
                              <td className={`px-4 py-3 text-right font-medium ${
                                diff > 0.001
                                  ? 'text-green-600 dark:text-green-400'
                                  : diff < -0.001
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-zinc-500 dark:text-zinc-400'
                              }`}>
                                {diff > 0.001 ? '+' : diff < -0.001 ? '' : ''}
                                {formatMoney(Math.abs(diff))}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-8 text-center mb-6">
                <p className="text-sm text-zinc-400">No payments found for this period.</p>
              </div>
            )}

            {/* Transfers */}
            {result.transfers.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Transfer Summary
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">From</th>
                        <th className="text-center px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 w-16"></th>
                        <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">To</th>
                        <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.transfers.map((t, idx) => (
                        <tr
                          key={idx}
                          className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${
                            idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800/30'
                          }`}
                        >
                          <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50 font-medium">{t.from}</td>
                          <td className="px-4 py-3 text-center text-zinc-400">→</td>
                          <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50 font-medium">{t.to}</td>
                          <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-semibold">
                            {formatMoney(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
