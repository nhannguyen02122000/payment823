'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatMoney } from '@/lib/format-money';
import type { Payment, User, ListResponse } from '@/lib/types';
import Modal from '@/components/modal';
import PaymentForm from '@/components/payment-form';
import DeleteConfirmModal from '@/components/delete-confirm-modal';
import SummarizeModal from '@/components/summarize-modal';
import FilterBottomSheet, { type FilterState } from '@/components/filter-bottom-sheet';

const LIMIT = 20;

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getDefaultFilters(): FilterState {
  return {
    name: '',
    moneyMin: '',
    moneyMax: '',
    paymentDateFrom: '',
    paymentDateTo: '',
    showAll: false,
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [filters, setFilters] = useState<FilterState>(getDefaultFilters());
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [deletePayment, setDeletePayment] = useState<Payment | null>(null);
  const [showSummarize, setShowSummarize] = useState(false);

  // Load users
  useEffect(() => {
    fetch('/api/payments')
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .catch(() => {});
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        list: 'true',
        page: String(page),
        limit: String(LIMIT),
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      if (filters.name) params.set('name', filters.name);
      if (filters.moneyMin) params.set('money_min', filters.moneyMin);
      if (filters.moneyMax) params.set('money_max', filters.moneyMax);
      if (filters.paymentDateFrom) params.set('payment_date_from', filters.paymentDateFrom);
      if (filters.paymentDateTo) params.set('payment_date_to', filters.paymentDateTo);
      if (filters.showAll) params.set('all', 'true');

      const res = await fetch(`/api/payments?${params}`);
      const data: ListResponse = await res.json();
      setPayments(data.payments ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  }

  function handleFilterApply(newFilters: FilterState) {
    setFilters(newFilters);
    setPage(1);
  }

  function clearFilters() {
    setFilters(getDefaultFilters());
    setPage(1);
  }

  function handleSuccess() {
    setShowAddModal(false);
    setEditPayment(null);
    setDeletePayment(null);
    fetchPayments();
  }

  const hasActiveFilters =
    filters.name ||
    filters.moneyMin ||
    filters.moneyMax ||
    filters.paymentDateFrom ||
    filters.paymentDateTo ||
    filters.showAll;

  const activeFilterChips: { label: string; key: keyof FilterState }[] = [];
  if (filters.name) activeFilterChips.push({ label: `PIC: ${filters.name}`, key: 'name' });
  if (filters.moneyMin) activeFilterChips.push({ label: `Min: ${filters.moneyMin}`, key: 'moneyMin' });
  if (filters.moneyMax) activeFilterChips.push({ label: `Max: ${filters.moneyMax}`, key: 'moneyMax' });
  if (filters.showAll) activeFilterChips.push({ label: 'All time', key: 'showAll' });

  return (
    <div className="min-h-screen bg-bg">
      <div className="w-full max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="text-2xl font-normal text-text-primary"
              style={{ fontFamily: 'var(--font-instrument-serif)' }}
            >
              Payments
            </h1>
            {!loading && (
              <p className="text-sm text-text-muted mt-0.5">
                {total} record{total !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowSummarize(true)}
            aria-label="Summarize"
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-muted transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 16l4-4 4 4 5-6" />
            </svg>
          </button>
        </div>

        {/* Filter Chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setFilters({ ...filters, [chip.key]: '' })}
                className="inline-flex items-center gap-1 py-1 px-3 rounded-full bg-bg-muted text-text-secondary text-xs font-semibold hover:bg-border transition-colors"
              >
                {chip.label}
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 3l6 6M9 3L3 9" />
                </svg>
              </button>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs text-accent font-semibold hover:text-accent-hover transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Filter + Add Row */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowFilterSheet(true)}
            className="flex items-center gap-1.5 h-10 px-4 rounded-lg border border-border text-text-secondary text-sm font-medium hover:bg-bg-muted transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Filters
          </button>
        </div>

        {/* Payment Rows (Zebra) */}
        <div className="flex flex-col gap-2 mb-6">
          {loading ? (
            <div className="text-center py-12 text-text-muted text-sm">Loading...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">No payments found.</div>
          ) : (
            payments.map((payment, idx) => (
              <div
                key={payment.uuid}
                onClick={() => setEditPayment(payment)}
                className={`flex items-center gap-3 p-3.5 rounded-lg min-h-[52px] cursor-pointer transition-colors hover:bg-border ${
                  idx % 2 === 0 ? 'bg-bg-card border border-border' : 'bg-bg-muted'
                }`}
              >
                {/* Decorative dot */}
                <div className="w-2 h-2 rounded-full bg-text-muted flex-shrink-0" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text-primary truncate">{payment.name}</div>
                  <div className="text-xs text-text-muted truncate">
                    {payment.description ?? '—'} · {payment.payment_date ? formatDate(payment.payment_date) : formatDate(payment.created_at)}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-sm font-bold text-text-primary flex-shrink-0">
                  {formatMoney(payment.money)}
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeletePayment(payment); }}
                  aria-label="Delete"
                  className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between gap-3 pb-4">
            <p className="text-xs text-text-muted">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 px-3 rounded-lg text-sm text-text-muted hover:bg-bg-muted disabled:opacity-30 transition-colors"
              >
                ‹ Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 rounded-lg text-sm transition-colors ${
                      page === pageNum
                        ? 'bg-accent text-white font-semibold'
                        : 'text-text-muted hover:bg-bg-muted'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 px-3 rounded-lg text-sm text-text-muted hover:bg-bg-muted disabled:opacity-30 transition-colors"
              >
                Next ›
              </button>
            </div>
          </div>
        )}

        {/* Add Payment Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full h-11 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          + Add Payment
        </button>
      </div>

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        onApply={handleFilterApply}
        initialFilters={filters}
        users={users}
      />

      {/* Modals */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Payment">
        <PaymentForm onSuccess={handleSuccess} onClose={() => setShowAddModal(false)} />
      </Modal>

      <Modal isOpen={!!editPayment} onClose={() => setEditPayment(null)} title="Edit Payment">
        {editPayment && (
          <PaymentForm
            initialValues={editPayment}
            onSuccess={handleSuccess}
            onClose={() => setEditPayment(null)}
          />
        )}
      </Modal>

      <DeleteConfirmModal
        payment={deletePayment}
        onClose={() => setDeletePayment(null)}
        onDeleted={handleSuccess}
      />

      <SummarizeModal isOpen={showSummarize} onClose={() => setShowSummarize(false)} />
    </div>
  );
}
