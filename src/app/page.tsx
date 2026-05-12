'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatMoney } from '@/lib/format-money';
import type { Payment, User, ListResponse } from '@/lib/types';
import Modal from '@/components/modal';
import PaymentForm from '@/components/payment-form';
import DeleteConfirmModal from '@/components/delete-confirm-modal';
import SummarizeModal from '@/components/summarize-modal';

const LIMIT = 20;

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function SortIcon({ field, sortBy, sortOrder }: { field: string; sortBy: string; sortOrder: string }) {
  if (sortBy !== field) {
    return (
      <span className="ml-1 text-slate-500 inline-block">
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 2L9 5H3L6 2ZM6 10L3 7H9L6 10ZM6 6L3 3H9L6 6Z" opacity="0.4" />
        </svg>
      </span>
    );
  }
  return (
    <span className="ml-1 text-slate-300 inline-block">
      {sortOrder === 'asc' ? (
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 2L9 5H3L6 2ZM6 10L3 7H9L6 10Z" /></svg>
      ) : (
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 10L9 7H3L6 10ZM6 2L3 5H9L6 2Z" /></svg>
      )}
    </span>
  );
}

function getDefaultDateRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0, 23, 59, 59);
  return {
    createdFrom: from.toISOString().slice(0, 16),
    createdTo: to.toISOString().slice(0, 16),
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
  const [name, setName] = useState('');
  const [moneyMin, setMoneyMin] = useState('');
  const [moneyMax, setMoneyMax] = useState('');
  const [createdFrom, setCreatedFrom] = useState(getDefaultDateRange().createdFrom);
  const [createdTo, setCreatedTo] = useState(getDefaultDateRange().createdTo);
  const [showAll, setShowAll] = useState(false);
  const [paymentDateFrom, setPaymentDateFrom] = useState('');
  const [paymentDateTo, setPaymentDateTo] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [deletePayment, setDeletePayment] = useState<Payment | null>(null);
  const [showSummarize, setShowSummarize] = useState(false);

  // Load users for dropdown
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
      if (name) params.set('name', name);
      if (moneyMin) params.set('money_min', moneyMin);
      if (moneyMax) params.set('money_max', moneyMax);
      if (createdFrom) params.set('created_from', createdFrom);
      if (createdTo) params.set('created_to', createdTo);
      if (paymentDateFrom) params.set('payment_date_from', paymentDateFrom);
      if (paymentDateTo) params.set('payment_date_to', paymentDateTo);
      if (showAll) params.set('all', 'true');

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
  }, [page, sortBy, sortOrder, name, moneyMin, moneyMax, createdFrom, createdTo, paymentDateFrom, paymentDateTo, showAll]);

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

  function handleFilterChange() {
    setPage(1);
  }

  function clearFilters() {
    setName('');
    setMoneyMin('');
    setMoneyMax('');
    setCreatedFrom('');
    setCreatedTo('');
    setPaymentDateFrom('');
    setPaymentDateTo('');
    setShowAll(false);
    setPage(1);
  }

  function handleSuccess() {
    setShowAddModal(false);
    setEditPayment(null);
    setDeletePayment(null);
    fetchPayments();
  }

  const hasFilters = name || moneyMin || moneyMax || createdFrom || createdTo || paymentDateFrom || paymentDateTo || showAll;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Payments</h1>
            {!loading && (
              <p className="text-sm text-slate-400 mt-0.5">
                {total} record{total !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSummarize(true)}
              className="h-9 px-4 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Summarize
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="h-9 px-4 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Add Payment
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 bg-slate-800 rounded-xl border border-slate-700 p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">Filters</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="f-name" className="text-xs font-medium text-slate-400">PIC</label>
              <select
                id="f-name"
                value={name}
                onChange={(e) => { setName(e.target.value); handleFilterChange(); }}
                className="h-9 px-2 rounded-lg border border-slate-600 bg-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="">All</option>
                {users.map((u) => (
                  <option key={u.id} value={u.username}>{u.username}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="f-money-min" className="text-xs font-medium text-slate-400">Min Amount (x)</label>
              <input
                id="f-money-min"
                type="number"
                min="0"
                step="1"
                value={moneyMin}
                onChange={(e) => { setMoneyMin(e.target.value); handleFilterChange(); }}
                placeholder="e.g. 10"
                className="h-9 px-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="f-money-max" className="text-xs font-medium text-slate-400">Max Amount (x)</label>
              <input
                id="f-money-max"
                type="number"
                min="0"
                step="1"
                value={moneyMax}
                onChange={(e) => { setMoneyMax(e.target.value); handleFilterChange(); }}
                placeholder="e.g. 100"
                className="h-9 px-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400">&nbsp;</label>
              <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-600 bg-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => { setShowAll(e.target.checked); handleFilterChange(); }}
                  className="w-4 h-4 rounded border-slate-500 cursor-pointer"
                />
                <span className="text-sm text-slate-300">All time</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="f-created-from" className="text-xs font-medium text-slate-400">Created From</label>
              <input
                id="f-created-from"
                type="datetime-local"
                value={createdFrom}
                onChange={(e) => { setCreatedFrom(e.target.value); handleFilterChange(); }}
                className="h-9 px-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="f-created-to" className="text-xs font-medium text-slate-400">Created To</label>
              <input
                id="f-created-to"
                type="datetime-local"
                value={createdTo}
                onChange={(e) => { setCreatedTo(e.target.value); handleFilterChange(); }}
                className="h-9 px-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="f-payment-date-from" className="text-xs font-medium text-slate-400">Payment Date From</label>
              <input
                id="f-payment-date-from"
                type="datetime-local"
                value={paymentDateFrom}
                onChange={(e) => { setPaymentDateFrom(e.target.value); handleFilterChange(); }}
                className="h-9 px-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="f-payment-date-to" className="text-xs font-medium text-slate-400">Payment Date To</label>
              <input
                id="f-payment-date-to"
                type="datetime-local"
                value={paymentDateTo}
                onChange={(e) => { setPaymentDateTo(e.target.value); handleFilterChange(); }}
                className="h-9 px-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 font-medium text-slate-400">
                    <button onClick={() => handleSort('name')} className="flex items-center hover:text-slate-200 cursor-pointer">
                      PIC <SortIcon field="name" sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-slate-400">
                    <button onClick={() => handleSort('money')} className="flex items-center ml-auto hover:text-slate-200 cursor-pointer">
                      Amount <SortIcon field="money" sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400 hidden sm:table-cell">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400 hidden md:table-cell">
                    <button onClick={() => handleSort('created_at')} className="flex items-center hover:text-slate-200 cursor-pointer">
                      Created <SortIcon field="created_at" sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400">
                    <button onClick={() => handleSort('updated_at')} className="flex items-center hover:text-slate-200 cursor-pointer">
                      Updated <SortIcon field="updated_at" sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-400 hidden md:table-cell">
                    <button onClick={() => handleSort('payment_date')} className="flex items-center hover:text-slate-200 cursor-pointer">
                      Payment Date <SortIcon field="payment_date" sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-slate-400 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center px-4 py-12 text-slate-400">Loading...</td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center px-4 py-12 text-slate-400">No payments found.</td>
                  </tr>
                ) : (
                  payments.map((payment, idx) => (
                    <tr
                      key={payment.uuid}
                      className={`border-b border-slate-700/50 last:border-0 ${
                        idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-200 font-medium">{payment.name}</td>
                      <td className="px-4 py-3 text-right text-slate-200">{formatMoney(payment.money)}</td>
                      <td className="px-4 py-3 text-slate-400 hidden sm:table-cell max-w-xs truncate" title={payment.description ?? ''}>
                        {payment.description ?? <span className="italic text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell text-xs">
                        <div>{formatTimestamp(payment.created_at)}</div>
                        <div className="text-slate-600">{payment.created_by}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        <div>{formatTimestamp(payment.updated_at)}</div>
                        <div className="text-slate-600">{payment.updated_by}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                        {payment.payment_date ? (
                          <>
                            <div>{formatTimestamp(payment.payment_date)}</div>
                            <div className="text-slate-600">{payment.created_by}</div>
                          </>
                        ) : (
                          <span className="italic text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => setEditPayment(payment)}
                            aria-label="Edit payment"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setDeletePayment(payment)}
                            aria-label="Delete payment"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-700">
              <p className="text-xs text-slate-400">
                Page {page} of {totalPages} — {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page <= 1} className="h-8 px-2 rounded-lg text-sm text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">«</button>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="h-8 px-3 rounded-lg text-sm text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">‹ Prev</button>
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
                          ? 'bg-amber-500 text-black font-semibold'
                          : 'text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="h-8 px-3 rounded-lg text-sm text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">Next ›</button>
                <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="h-8 px-2 rounded-lg text-sm text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">»</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Payment"
      >
        <PaymentForm onSuccess={handleSuccess} onClose={() => setShowAddModal(false)} />
      </Modal>

      <Modal
        isOpen={!!editPayment}
        onClose={() => setEditPayment(null)}
        title="Edit Payment"
      >
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

      <SummarizeModal
        isOpen={showSummarize}
        onClose={() => setShowSummarize(false)}
      />
    </div>
  );
}
