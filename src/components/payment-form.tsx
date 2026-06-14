'use client';

import { useState, useEffect } from 'react';
import { formatMoney, parseMoney } from '@/lib/format-money';
import type { Payment, User } from '@/lib/types';

interface PaymentFormProps {
  initialValues?: Payment;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PaymentForm({ initialValues, onSuccess, onClose }: PaymentFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState(initialValues?.name ?? '');
  const [moneyInput, setMoneyInput] = useState(initialValues ? String(initialValues.money) : '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [paymentDate, setPaymentDate] = useState(
    initialValues?.payment_date
      ? new Date(initialValues.payment_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!initialValues;

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

    if (!name) {
      setError('Please select who paid.');
      return;
    }

    const moneyNum = parseMoney(moneyInput);
    if (moneyNum <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    setLoading(true);
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch('/api/payments', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, money: moneyInput, description, payment_date: paymentDate, uuid: initialValues?.uuid }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Failed to ${isEdit ? 'update' : 'add'} payment.`);
        return;
      }

      onSuccess();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const moneyDisplay = moneyInput ? formatMoney(parseMoney(moneyInput)) : '';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Section 1: Who paid? */}
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Who paid?</p>
        <div className="flex flex-wrap gap-2">
          {users.map((u) => {
            const selected = name === u.username;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setName(u.username)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  selected
                    ? 'bg-accent text-white'
                    : 'bg-bg-muted text-text-secondary hover:bg-border'
                }`}
              >
                {u.username}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: How much? */}
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
          How much? <span className="font-normal text-text-muted">(× 1000 VND)</span>
        </p>
        <input
          type="number"
          min="1"
          step="1"
          value={moneyInput}
          onChange={(e) => setMoneyInput(e.target.value)}
          placeholder="e.g. 50"
          className="w-full h-10 px-3 rounded-lg border border-border-strong bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {moneyDisplay && (
          <p className="text-sm font-semibold text-accent mt-1.5">= {moneyDisplay}</p>
        )}
      </div>

      {/* Section 3: Details */}
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Details</p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full px-3 py-2.5 rounded-lg border border-border-strong bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
        <input
          type="datetime-local"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-border-strong bg-bg-muted text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent mt-3"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2 border border-danger/20">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-11 rounded-lg bg-bg-muted text-text-secondary text-sm font-semibold hover:bg-border transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 h-11 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {loading ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update' : 'Save')}
        </button>
      </div>
    </form>
  );
}
