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
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="form-name" className="text-sm font-medium text-slate-300">
          PIC (Person in Charge)
        </label>
        <select
          id="form-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
        <label htmlFor="form-money" className="text-sm font-medium text-slate-300">
          Amount of Money
        </label>
        <input
          id="form-money"
          type="number"
          min="1"
          step="1"
          value={moneyInput}
          onChange={(e) => setMoneyInput(e.target.value)}
          placeholder="e.g. 50"
          className="w-full h-10 px-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <p className="text-xs text-slate-500">Enter amount (e.g. 50 = 50,000 VND)</p>
        {moneyDisplay && (
          <p className="text-sm font-medium text-slate-200">= {moneyDisplay}</p>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="form-description" className="text-sm font-medium text-slate-300">
          Description <span className="text-slate-500 font-normal">(optional)</span>
        </label>
        <textarea
          id="form-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was this payment for?"
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>

      {/* Payment Date */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="form-payment-date" className="text-sm font-medium text-slate-300">
          Payment Date & Time
        </label>
        <input
          id="form-payment-date"
          type="datetime-local"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-slate-600 bg-slate-700 text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 rounded-lg px-3 py-2 border border-red-800">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-10 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 h-10 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {loading ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Payment' : 'Add Payment')}
        </button>
      </div>
    </form>
  );
}
