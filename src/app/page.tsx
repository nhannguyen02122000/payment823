'use client';

import { useState, useEffect } from 'react';
import { formatMoney, parseMoney } from '@/lib/format-money';

interface User {
  id: string;
  username: string;
  avatar_url: string;
}

export default function AddPaymentPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [moneyInput, setMoneyInput] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/payments')
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, money: moneyInput, description }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to add payment.');
        return;
      }

      setSuccess(`Payment added! (${formatMoney(moneyNum)})`);
      setName('');
      setMoneyInput('');
      setDescription('');
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
          Add Payment
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 shadow-sm"
        >
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="name"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              PIC (Person in Charge)
            </label>
            <select
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
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
            <label
              htmlFor="money"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
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
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
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
            <label
              htmlFor="description"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Description{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this payment for?"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 resize-none"
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
            disabled={loading}
            className="w-full h-10 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Adding...' : 'Add Payment'}
          </button>
        </form>
      </main>
    </div>
  );
}