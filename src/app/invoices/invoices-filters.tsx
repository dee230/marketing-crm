'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string | null;
  amount: number;
  status: string;
  dueDate: Date | null;
  paymentReference?: string | null;
}

interface InvoicesFiltersProps {
  invoices: Invoice[];
  isAdmin?: boolean;
}

export function InvoicesFilters({ invoices, isAdmin = false }: InvoicesFiltersProps) {
  const [statusFilter, setStatusFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState('');

  const filteredInvoices = invoices.filter(invoice => {
    if (statusFilter && invoice.status !== statusFilter) return false;
    return true;
  });

  const statuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    if (newStatus === 'paid') {
      setShowPaymentModal(invoiceId);
      return;
    }
    
    setSavingId(invoiceId);
    try {
      await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      window.location.reload();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setSavingId(null);
      setEditingId(null);
    }
  };

  const handlePaymentSubmit = async (invoiceId: string) => {
    if (!paymentRef.trim()) {
      alert('Please enter a payment reference (M-Pesa ID or receipt number)');
      return;
    }
    
    setSavingId(invoiceId);
    try {
      await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'paid',
          paymentReference: paymentRef.trim(),
        }),
      });
      window.location.reload();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setSavingId(null);
      setShowPaymentModal(null);
      setPaymentRef('');
    }
  };

  return (
    <>
      <div className="flex gap-3 mb-4 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg border"
          style={{ borderColor: '#E8E4DD', background: '#FFFFFF', color: '#2D2A26' }}
        >
          <option value="">All Statuses</option>
          {statuses.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="text-sm px-3 py-2 rounded-lg"
            style={{ color: '#9B9B8F' }}
          >
            Clear Filters
          </button>
        )}

        <span className="text-sm ml-auto" style={{ color: '#9B9B8F' }}>
          Total: <span className="font-medium" style={{ color: '#2D2A26' }}>KES {totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span>
        </span>
      </div>

      <div className="card overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Due Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8" style={{ color: '#9B9B8F' }}>
                  No invoices match the selected filters
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="font-medium">
                    <Link href={`/invoices/${invoice.id}`} style={{ color: '#E07A5F' }}>
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td style={{ color: '#9B9B8F' }}>{invoice.clientName || 'N/A'}</td>
                  <td className="font-medium">KES {invoice.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
                  <td>
                    {isAdmin && editingId === invoice.id && invoice.status !== 'paid' ? (
                      <select
                        autoFocus
                        defaultValue={invoice.status}
                        onBlur={(e) => handleStatusChange(invoice.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="text-sm px-2 py-1 rounded border"
                        style={{ borderColor: '#E07A5F', background: '#FFFFFF' }}
                        onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                      >
                        {statuses.filter(s => s.value !== 'paid').map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span 
                        className={`badge ${invoice.status === 'paid' ? 'cursor-not-allowed' : 'cursor-pointer'} ${
                          invoice.status === 'paid' ? 'badge-completed' :
                          invoice.status === 'sent' ? 'badge-sent' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                          invoice.status === 'draft' ? 'badge-pending' :
                          'badge-pending'
                        }`}
                        onClick={() => isAdmin && invoice.status !== 'paid' && setEditingId(invoice.id)}
                      >
                        {invoice.status}
                      </span>
                    )}
                  </td>
                  <td style={{ color: '#9B9B8F' }}>
                    {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <Link 
                      href={`/invoices/${invoice.id}`} 
                      className="text-sm px-3 py-1 rounded-lg inline-flex items-center"
                      style={{ color: '#E07A5F', background: 'rgba(224, 122, 95, 0.1)' }}
                    >
                      PDF
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Reference Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#2D2A26' }}>
              Enter Payment Details
            </h3>
            <p className="text-sm mb-4" style={{ color: '#9B9B8F' }}>
              Please enter the M-Pesa confirmation code or receipt number to mark this invoice as paid.
            </p>
            <div className="mb-4">
              <label htmlFor="paymentRef" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>
                M-Pesa ID / Receipt Number *
              </label>
              <input
                type="text"
                id="paymentRef"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g., MPN123456789 or RCP001"
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: '#E8E4DD', background: '#FFFFFF' }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePaymentSubmit(showPaymentModal);
                  if (e.key === 'Escape') { setShowPaymentModal(null); setPaymentRef(''); }
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handlePaymentSubmit(showPaymentModal)}
                disabled={savingId === showPaymentModal}
                className="btn-primary flex-1"
              >
                {savingId === showPaymentModal ? 'Saving...' : 'Confirm Payment'}
              </button>
              <button
                onClick={() => { setShowPaymentModal(null); setPaymentRef(''); }}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}