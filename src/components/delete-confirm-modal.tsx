'use client';

import { useState } from 'react';
import Modal from './modal';
import { formatMoney } from '@/lib/format-money';
import type { Payment } from '@/lib/types';

interface DeleteConfirmModalProps {
  payment: Payment | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteConfirmModal({ payment, onClose, onDeleted }: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    if (!payment) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid: payment.uuid }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to delete payment.');
        return;
      }

      onDeleted();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={!!payment} onClose={onClose} title="Delete Payment" maxWidth="max-w-sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-300">Are you sure you want to delete this payment?</p>

        {payment && (
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">PIC</span>
              <span className="text-slate-200 font-medium">{payment.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Amount</span>
              <span className="text-slate-200 font-medium">{formatMoney(payment.money)}</span>
            </div>
            {payment.description && (
              <div className="flex flex-col gap-0.5 text-sm">
                <span className="text-slate-400">Description</span>
                <span className="text-slate-200">{payment.description}</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-900/20 rounded-lg px-3 py-2 border border-red-800">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-500 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
