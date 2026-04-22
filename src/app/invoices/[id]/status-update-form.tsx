'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface StatusUpdateFormProps {
  invoiceId: string;
  currentStatus: string;
  canManage: boolean;
}

export function StatusUpdateForm({ invoiceId, currentStatus, canManage }: StatusUpdateFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [paidDate, setPaidDate] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!canManage) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm" style={{ color: '#9B9B8F' }}>Status</span>
          <span className={`badge ${status === 'paid' ? 'badge-completed' : status === 'sent' ? 'badge-sent' : status === 'overdue' ? 'bg-red-100 text-red-700' : 'badge-pending'}`}>
            {status}
          </span>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          paidDate: status === 'paid' ? paidDate : null,
          paymentReference: status === 'paid' ? paymentReference : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }

      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-3">
        <div>
          <label htmlFor="status" className="block text-sm mb-1">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
            style={{ background: '#FDFBF7', borderColor: '#E8E4DD' }}
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {status === 'paid' && (
          <>
            <div>
              <label htmlFor="paidDate" className="block text-sm mb-1">Paid Date *</label>
              <input
                type="date"
                id="paidDate"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                required={status === 'paid'}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ background: '#FDFBF7', borderColor: '#E8E4DD' }}
              />
            </div>
            <div>
              <label htmlFor="paymentReference" className="block text-sm mb-1">Payment Reference</label>
              <input
                type="text"
                id="paymentReference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="M-Pesa code, receipt number..."
                className="w-full px-3 py-2 rounded-lg border"
                style={{ background: '#FDFBF7', borderColor: '#E8E4DD' }}
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Updating...' : 'Update Status'}
        </button>
      </div>
    </form>
  );
}