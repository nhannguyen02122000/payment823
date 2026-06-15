'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from './modal';
import { formatMoney } from '@/lib/format-money';
import type { SummarizeResponse } from '@/lib/types';

interface SummarizeModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function SummarizeModal({ isOpen, onClose }: SummarizeModalProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummarizeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/summarize?month=${month}&year=${year}`);
      const data = await res.json() as SummarizeResponse;
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Failed to generate summary');
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
    if (isOpen) fetchSummary();
  }, [isOpen, fetchSummary]);

  const monthLabel = MONTHS.find((m) => m.value === month)?.label ?? '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Summarize" maxWidth="max-w-2xl">
      <div className="flex flex-col gap-5">
        {/* Period Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex flex-col gap-1 flex-1 w-full">
            <label htmlFor="summ-month" className="text-xs font-medium text-text-muted">Month</label>
            <select
              id="summ-month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="h-9 px-2 rounded-lg border border-border-strong bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1 w-full">
            <label htmlFor="summ-year" className="text-xs font-medium text-text-muted">Year</label>
            <input
              id="summ-year"
              type="number"
              min="1970"
              max="2100"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 px-3 rounded-lg border border-border-strong bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="h-9 px-4 rounded-lg bg-accent text-text-inverse text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            {loading ? 'Loading...' : 'Generate'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2 border border-danger/20">{error}</p>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8 text-text-muted text-sm">Loading...</div>
        )}

        {/* Results */}
        {!loading && result && (
          <>
            <div className="text-center">
              <p className="text-sm text-text-muted">{monthLabel} {result.year}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-muted rounded-xl border border-border p-4">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Total Spent</p>
                <p className="text-xl font-semibold text-text-primary">{formatMoney(result.totalMoneySpent)}</p>
              </div>
              <div className="bg-bg-muted rounded-xl border border-border p-4">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Per Person</p>
                <p className="text-xl font-semibold text-text-primary">{formatMoney(result.perPerson)}</p>
                <p className="text-xs text-text-muted mt-0.5">{Object.keys(result.moneyPerPerson).length} people</p>
              </div>
            </div>

            {/* Spending Breakdown */}
            {Object.keys(result.moneyPerPerson).length > 0 ? (
              <div className="bg-bg-muted rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-text-secondary">Spending Breakdown</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2.5 font-medium text-text-muted">Person</th>
                        <th className="text-right px-4 py-2.5 font-medium text-text-muted">Paid</th>
                        <th className="text-right px-4 py-2.5 font-medium text-text-muted">Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(result.moneyPerPerson)
                        .sort(([, a], [, b]) => b - a)
                        .map(([person, paid], idx) => {
                          const diff = paid - result.perPerson;
                          return (
                            <tr key={person} className={`border-b border-border last:border-0 ${idx % 2 === 0 ? '' : 'bg-bg-muted'}`}>
                              <td className="px-4 py-2.5 text-text-primary font-medium">{person}</td>
                              <td className="px-4 py-2.5 text-right text-text-primary">{formatMoney(paid)}</td>
                              <td className={`px-4 py-2.5 text-right font-medium ${
                                diff > 0.001 ? 'text-accent' : diff < -0.001 ? 'text-danger' : 'text-text-muted'
                              }`}>
                                {diff > 0.001 ? '+' : diff < -0.001 ? '−' : ''}{formatMoney(Math.abs(diff))}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-text-muted">No payments found for this period.</div>
            )}

            {/* Transfers */}
            {result.transfers.length > 0 && (
              <div className="bg-bg-muted rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-text-secondary">Transfer Summary</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2.5 font-medium text-text-muted">From</th>
                        <th className="text-center px-4 py-2.5 font-medium text-text-muted w-10"></th>
                        <th className="text-left px-4 py-2.5 font-medium text-text-muted">To</th>
                        <th className="text-right px-4 py-2.5 font-medium text-text-muted">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.transfers.map((t, idx) => (
                        <tr key={idx} className={`border-b border-border last:border-0 ${idx % 2 === 0 ? '' : 'bg-bg-muted'}`}>
                          <td className="px-4 py-2.5 text-text-primary font-medium">{t.from}</td>
                          <td className="px-4 py-2.5 text-center text-text-muted">→</td>
                          <td className="px-4 py-2.5 text-text-primary font-medium">{t.to}</td>
                          <td className="px-4 py-2.5 text-right text-accent font-semibold">{formatMoney(t.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
