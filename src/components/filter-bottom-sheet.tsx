'use client';

import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
  users: User[];
}

export interface FilterState {
  name: string;
  moneyMin: string;
  moneyMax: string;
  paymentDateFrom: string;
  paymentDateTo: string;
  showAll: boolean;
}

export default function FilterBottomSheet({
  isOpen,
  onClose,
  onApply,
  initialFilters,
  users,
}: FilterBottomSheetProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleApply() {
    onApply(filters);
    onClose();
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" />

      {/* Sheet */}
      <div role="dialog" aria-modal="true" aria-label="Filters" className="relative w-full max-w-md bg-bg-card border-t border-border rounded-t-xl p-5 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-text-primary">Filters</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-muted transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          {/* Person */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-person" className="text-xs font-semibold text-text-muted uppercase tracking-wide">Person</label>
            <select
              id="filter-person"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-border-strong bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All people</option>
              {users.map((u) => (
                <option key={u.id} value={u.username}>{u.username}</option>
              ))}
            </select>
          </div>

          {/* Amount range */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Min Amount</label>
              <input
                type="number"
                min="0"
                value={filters.moneyMin}
                onChange={(e) => setFilters({ ...filters, moneyMin: e.target.value })}
                placeholder="0"
                className="w-full h-10 px-3 rounded-lg border border-border-strong bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Max Amount</label>
              <input
                type="number"
                min="0"
                value={filters.moneyMax}
                onChange={(e) => setFilters({ ...filters, moneyMax: e.target.value })}
                placeholder="∞"
                className="w-full h-10 px-3 rounded-lg border border-border-strong bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Date range */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Payment Date Range</label>
            <div className="flex gap-2 items-center">
              <input
                type="datetime-local"
                value={filters.paymentDateFrom}
                onChange={(e) => setFilters({ ...filters, paymentDateFrom: e.target.value })}
                className="flex-1 h-10 px-3 rounded-lg border border-border-strong bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <span className="text-text-muted text-sm">→</span>
              <input
                type="datetime-local"
                value={filters.paymentDateTo}
                onChange={(e) => setFilters({ ...filters, paymentDateTo: e.target.value })}
                className="flex-1 h-10 px-3 rounded-lg border border-border-strong bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* All time */}
          <label className="flex items-center gap-2.5 h-10 px-3 rounded-lg border border-border-strong bg-bg-muted cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showAll}
              onChange={(e) => setFilters({ ...filters, showAll: e.target.checked })}
              className="w-4 h-4 rounded border-border-strong accent-accent"
            />
            <span className="text-sm text-text-secondary">All time</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-lg bg-bg-muted text-text-secondary text-sm font-semibold hover:bg-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 h-11 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
