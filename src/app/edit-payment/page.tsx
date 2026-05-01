'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatMoney, parseMoney } from '@/lib/format-money';

interface User {
  id: string;
  username: string;
  avatar_url: string;
}

interface Payment {
  uuid: string;
  name: string;
  money: number;
  description?: string | null;
  created_by: string;
  updated_by: string;
  created_at: number;
  updated_at: number;
}

function EditPaymentForm() {
  const searchParams = useSearchParams();
  const initialUuid = searchParams.get('uuid') ?? '';

  const [uuid, setUuid] = useState(initialUuid);
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [moneyInput, setMoneyInput] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch('/api/payments')
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .catch(() => {});
  }, []);

  async function loadPayment(u: string) {
    if (!u.trim()) return;
    setFetching(true);
    setError('');
    setNotFound(false);
    try {
      const res = await fetch(`/api/payments?uuid=${encodeURIComponent(u)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to load payment.');
        return;
      }

      const payment: Payment = data.payment;
      setName(payment.name);
      setMoneyInput(String(payment.money));
      setDescription(payment.description ?? '');
    } catch {
      setError('Something went wrong loading the payment.');
    } finally {
      setFetching(false);
    }
  }

  // Auto-load if UUID came from URL param
  useEffect(() => {
    if (initialUuid) {
      loadPayment(initialUuid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUuid]);

  async function handleDelete() {
    setError('');
    setSuccess('');

    if (!uuid.trim()) {
      setError('Please load a payment first.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to delete payment.');
        return;
      }

      setName('');
      setMoneyInput('');
      setDescription('');
      setSuccess('Payment deleted.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!uuid.trim()) {
      setError('Please enter a UUID.');
      return;
    }
    if (!name) {
      setError('Please select a name.');
      return;
    }

    const moneyNum = parseMoney(moneyInput);
    if (moneyNum <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid, name, money: moneyInput, description }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to update payment.');
        return;
      }

      setSuccess(`Payment updated! (${formatMoney(moneyNum)})`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const moneyDisplay = moneyInput ? formatMoney(parseMoney(moneyInput)) : '';

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black">
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
          Edit Payment
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 shadow-sm"
        >
          {/* UUID lookup */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="uuid" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Payment UUID
            </label>
            <div className="flex gap-2">
              <input
                id="uuid"
                type="text"
                value={uuid}
                onChange={(e) => {
                  setUuid(e.target.value);
                  setNotFound(false);
                  setError('');
                }}
                placeholder="Enter or paste UUID..."
                className="flex-1 h-10 px-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 font-mono"
              />
              <button
                type="button"
                onClick={() => loadPayment(uuid)}
                disabled={fetching || !uuid.trim()}
                className="h-10 px-4 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {fetching ? '...' : 'Load'}
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              PIC (Person in Charge)
            </label>
            <select
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={fetching}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 disabled:opacity-50"
            >
              <option value="">Select a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.username}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>

          {/* Money */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="money" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Amount of Money
            </label>
            <input
              id="money"
              type="number"
              min="1"
              step="1"
              value={moneyInput}
              onChange={(e) => setMoneyInput(e.target.value)}
              placeholder="e.g. 50"
              disabled={fetching}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 disabled:opacity-50"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Enter amount (e.g. 50 = 50,000 VND)
            </p>
            {moneyDisplay && (
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                = {moneyDisplay}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this payment for?"
              rows={3}
              disabled={fetching}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 resize-none disabled:opacity-50"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Success */}
          {success && (
            <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || fetching || notFound}
            className="w-full h-10 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Updating...' : 'Update Payment'}
          </button>
        </form>

        {/* Delete */}
        {name && (
          <div className="flex flex-col gap-3 bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Delete Payment</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">This action cannot be undone.</p>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function EditPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-500">Loading...</p>
      </div>
    }>
      <EditPaymentForm />
    </Suspense>
  );
}
