'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatMoney } from '@/lib/format-money';

interface Payment {
  id: string;
  uuid: string;
  name: string;
  money: number;
  description?: string | null;
  created_by: string;
  updated_by: string;
  created_at: number;
  updated_at: number;
}

interface User {
  id: string;
  username: string;
}

interface ListResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
      <span className="ml-1 text-zinc-400 inline-block">
        <svg className="w-3 h-3 inline" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 2L9 5H3L6 2ZM6 10L3 7H9L6 10ZM6 6L3 3H9L6 6Z" opacity="0.4" />
        </svg>
      </span>
    );
  }
  return (
    <span className="ml-1 text-zinc-600 dark:text-zinc-300 inline-block">
      {sortOrder === 'asc' ? (
        <svg className="w-3 h-3 inline" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 2L9 5H3L6 2ZM6 10L3 7H9L6 10Z" />
        </svg>
      ) : (
        <svg className="w-3 h-3 inline" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 10L9 7H3L6 10ZM6 2L3 5H9L6 2Z" />
        </svg>
      )}
    </span>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const limit = 20;

  // Filters
  const [name, setName] = useState('');
  const [moneyMin, setMoneyMin] = useState('');
  const [moneyMax, setMoneyMax] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [updatedFrom, setUpdatedFrom] = useState('');
  const [updatedTo, setUpdatedTo] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

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
        limit: String(limit),
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      if (name) params.set('name', name);
      if (moneyMin) params.set('money_min', moneyMin);
      if (moneyMax) params.set('money_max', moneyMax);
      if (createdFrom) params.set('created_from', createdFrom);
      if (createdTo) params.set('created_to', createdTo);
      if (updatedFrom) params.set('updated_from', updatedFrom);
      if (updatedTo) params.set('updated_to', updatedTo);
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
  }, [page, sortBy, sortOrder, name, moneyMin, moneyMax, createdFrom, createdTo, updatedFrom, updatedTo, showAll]);

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
    setUpdatedFrom('');
    setUpdatedTo('');
    setShowAll(false);
    setPage(1);
  }

  const hasFilters =
    name || moneyMin || moneyMax || createdFrom || createdTo || updatedFrom || updatedTo || showAll;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black">
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Payments
          </h1>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {loading ? '...' : `${total} record${total !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Filters</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Name filter */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-name" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                PIC
              </label>
              <select
                id="filter-name"
                value={name}
                onChange={(e) => { setName(e.target.value); handleFilterChange(); }}
                className="h-9 px-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              >
                <option value="">All</option>
                {users.map((u) => (
                  <option key={u.id} value={u.username}>{u.username}</option>
                ))}
              </select>
            </div>

            {/* Money range */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-money-min" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Min Amount (x)
              </label>
              <input
                id="filter-money-min"
                type="number"
                min="0"
                step="1"
                value={moneyMin}
                onChange={(e) => { setMoneyMin(e.target.value); handleFilterChange(); }}
                placeholder="e.g. 10"
                className="h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-money-max" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Max Amount (x)
              </label>
              <input
                id="filter-money-max"
                type="number"
                min="0"
                step="1"
                value={moneyMax}
                onChange={(e) => { setMoneyMax(e.target.value); handleFilterChange(); }}
                placeholder="e.g. 100"
                className="h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              />
            </div>

            {/* Show all toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">&nbsp;</label>
              <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => { setShowAll(e.target.checked); handleFilterChange(); }}
                  className="w-4 h-4 rounded border-zinc-400"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">All time</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Created from */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-created-from" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Created From
              </label>
              <input
                id="filter-created-from"
                type="datetime-local"
                value={createdFrom}
                onChange={(e) => { setCreatedFrom(e.target.value); handleFilterChange(); }}
                className="h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              />
            </div>

            {/* Created to */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-created-to" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Created To
              </label>
              <input
                id="filter-created-to"
                type="datetime-local"
                value={createdTo}
                onChange={(e) => { setCreatedTo(e.target.value); handleFilterChange(); }}
                className="h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              />
            </div>

            {/* Updated from */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-updated-from" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Updated From
              </label>
              <input
                id="filter-updated-from"
                type="datetime-local"
                value={updatedFrom}
                onChange={(e) => { setUpdatedFrom(e.target.value); handleFilterChange(); }}
                className="h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              />
            </div>

            {/* Updated to */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-updated-to" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Updated To
              </label>
              <input
                id="filter-updated-to"
                type="datetime-local"
                value={updatedTo}
                onChange={(e) => { setUpdatedTo(e.target.value); handleFilterChange(); }}
                className="h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    <button onClick={() => handleSort('name')} className="flex items-center hover:text-zinc-900 dark:hover:text-zinc-100">
                      PIC <SortIcon field="name" sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    <button onClick={() => handleSort('money')} className="flex items-center ml-auto hover:text-zinc-900 dark:hover:text-zinc-100">
                      Amount <SortIcon field="money" sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 hidden sm:table-cell">
                    Description
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 hidden md:table-cell">
                    <button onClick={() => handleSort('created_at')} className="flex items-center hover:text-zinc-900 dark:hover:text-zinc-100">
                      Created <SortIcon field="created_at" sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 hidden lg:table-cell">
                    By
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    <button onClick={() => handleSort('updated_at')} className="flex items-center hover:text-zinc-900 dark:hover:text-zinc-100">
                      Updated <SortIcon field="updated_at" sortBy={sortBy} sortOrder={sortOrder} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center px-4 py-12 text-zinc-400">Loading...</td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center px-4 py-12 text-zinc-400">No payments found.</td>
                  </tr>
                ) : (
                  payments.map((payment, idx) => (
                    <tr
                      key={payment.uuid}
                      className={`border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${
                        idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50 font-medium">
                        {payment.name}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-50">
                        {formatMoney(payment.money)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 hidden sm:table-cell max-w-xs truncate" title={payment.description ?? ''}>
                        {payment.description ?? <span className="italic text-zinc-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden md:table-cell text-xs">
                        {formatTimestamp(payment.created_at)}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden lg:table-cell text-xs">
                        {payment.created_by}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs">
                        <div>{formatTimestamp(payment.updated_at)}</div>
                        <div className="text-zinc-400 dark:text-zinc-500">{payment.updated_by}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Page {page} of {totalPages} &mdash; {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                  className="h-8 px-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  «
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 px-3 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-medium'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 px-3 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next ›
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  className="h-8 px-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
