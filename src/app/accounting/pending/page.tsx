'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { formatKES } from '@/lib/currency';
import { TopNav } from '@/components/top-nav';
import { SidebarNav } from '@/components/sidebar-nav';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  amount: number;
  status: string;
  dueDate: string;
  description?: string;
  client?: {
    name: string;
    email: string;
    company?: string;
  };
}

interface EmailHistory {
  sentAt: string;
  type: string;
  status: string;
  error?: string;
}

export default function PendingPaymentsPage() {
  const { data: session, status } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [emailHistory, setEmailHistory] = useState<Record<string, EmailHistory[]>>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/sign-in';
    }
  }, [status]);

  // Check if user is admin or super_admin
  const userRole = session?.user?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  if (session && status !== 'loading' && !isAdmin) {
    window.location.href = '/dashboard';
    return null;
  }

  useEffect(() => {
    if (session) {
      fetchInvoices();
    }
  }, [session]);

  async function fetchInvoices() {
    try {
      const res = await fetch('/api/accounting/pending-invoices');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setInvoices(data.invoices);
      }
    } catch (err) {
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }

  async function sendReminder(invoiceId: string) {
    setSendingId(invoiceId);
    setError(null);

    try {
      const res = await fetch(`/api/accounting/send-reminder/${invoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceResend: false }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send reminder');
        return;
      }

      // Refresh invoices after sending
      fetchInvoices();

      // Show success message
      if (data.simulated) {
        setError(null);
        alert('Reminder logged (simulated - email service not configured)');
      } else {
        alert('Reminder sent successfully!');
      }
    } catch (err) {
      setError('Failed to send reminder');
    } finally {
      setSendingId(null);
    }
  }

  async function sendOverdueNotice(invoiceId: string) {
    setSendingId(invoiceId);
    setError(null);

    try {
      const res = await fetch(`/api/accounting/send-overdue/${invoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceResend: false }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send overdue notice');
        return;
      }

      // Refresh invoices after sending
      fetchInvoices();

      // Show success message
      if (data.simulated) {
        alert('Overdue notice logged (simulated - email service not configured)');
      } else {
        alert('Overdue notice sent successfully!');
      }
    } catch (err) {
      setError('Failed to send overdue notice');
    } finally {
      setSendingId(null);
    }
  }

  async function fetchEmailHistory(invoiceId: string) {
    try {
      const res = await fetch(`/api/accounting/send-reminder/${invoiceId}`);
      const data = await res.json();
      if (data.reminders) {
        setEmailHistory(prev => ({
          ...prev,
          [invoiceId]: data.reminders,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch email history');
    }
  }

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'pending') return inv.status === 'sent';
    if (filter === 'overdue') return inv.status === 'overdue';
    return inv.status === 'sent' || inv.status === 'overdue';
  });

  const totalPending = invoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalOverdue = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDFBF7' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse" style={{ background: 'rgba(224, 122, 95, 0.15)' }}>
            <svg className="w-8 h-8 animate-spin" style={{ color: '#E07A5F' }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p style={{ color: '#9B9B8F' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <TopNav userRole={userRole} userEmail={session?.user?.email || ''} isAdmin={isAdmin} />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/accounting/pending" userRole={userRole} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>Pending Payments</h1>
                <p className="text-sm" style={{ color: '#9B9B8F' }}>Track and follow up on outstanding invoices</p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(242, 204, 143, 0.2)' }}>
                    <svg className="w-6 h-6" style={{ color: '#B8923D' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#9B9B8F' }}>Pending</p>
                    <p className="text-xl font-bold" style={{ color: '#B8923D' }}>{formatKES(totalPending)}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(224, 122, 95, 0.15)' }}>
                    <svg className="w-6 h-6" style={{ color: '#E07A5F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#9B9B8F' }}>Overdue</p>
                    <p className="text-xl font-bold" style={{ color: '#E07A5F' }}>{formatKES(totalOverdue)}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(61, 64, 91, 0.15)' }}>
                    <svg className="w-6 h-6" style={{ color: '#3D405B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#9B9B8F' }}>Total Outstanding</p>
                    <p className="text-xl font-bold" style={{ color: '#3D405B' }}>{formatKES(totalPending + totalOverdue)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'all' 
                    ? 'btn-primary' 
                    : 'bg-white border'
                }`}
                style={filter !== 'all' ? { borderColor: '#E8E4DD', color: '#2D2A26' } : {}}
              >
                All ({invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'pending' 
                    ? 'btn-primary' 
                    : 'bg-white border'
                }`}
                style={filter !== 'pending' ? { borderColor: '#E8E4DD', color: '#2D2A26' } : {}}
              >
                Pending ({invoices.filter(i => i.status === 'sent').length})
              </button>
              <button
                onClick={() => setFilter('overdue')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'overdue' 
                    ? 'btn-primary' 
                    : 'bg-white border'
                }`}
                style={filter !== 'overdue' ? { borderColor: '#E8E4DD', color: '#2D2A26' } : {}}
              >
                Overdue ({invoices.filter(i => i.status === 'overdue').length})
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(224, 122, 95, 0.15)', color: '#E07A5F' }}>
                {error}
              </div>
            )}

            {/* Invoices Table */}
            {filteredInvoices.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(61, 64, 91, 0.15)' }}>
                  <svg className="w-8 h-8" style={{ color: '#3D405B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="mb-4" style={{ color: '#9B9B8F' }}>No pending payments</p>
                <Link href="/invoices" style={{ color: '#E07A5F' }}>
                  Go to Invoices →
                </Link>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Client</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map(invoice => {
                      const dueDate = new Date(invoice.dueDate);
                      const now = new Date();
                      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      const isOverdue = daysUntilDue < 0;
                      
                      return (
                        <tr key={invoice.id}>
                          <td>
                            <Link 
                              href={`/invoices/${invoice.id}`}
                              className="font-medium hover:underline"
                              style={{ color: '#2D2A26' }}
                            >
                              {invoice.invoiceNumber}
                            </Link>
                            {invoice.description && (
                              <p className="text-xs mt-1" style={{ color: '#9B9B8F' }}>
                                {invoice.description.substring(0, 50)}
                                {invoice.description.length > 50 ? '...' : ''}
                              </p>
                            )}
                          </td>
                          <td>
                            <div className="font-medium" style={{ color: '#2D2A26' }}>
                              {invoice.client?.name || 'Unknown'}
                            </div>
                            {invoice.client?.email && (
                              <div className="text-xs" style={{ color: '#9B9B8F' }}>
                                {invoice.client.email}
                              </div>
                            )}
                          </td>
                          <td className="font-semibold" style={{ color: '#E07A5F' }}>
                            {formatKES(invoice.amount)}
                          </td>
                          <td>
                            <div style={{ color: '#2D2A26' }}>
                              {dueDate.toLocaleDateString('en-KE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="text-xs" style={{ 
                              color: isOverdue ? '#E07A5F' : '#9B9B8F',
                              fontWeight: isOverdue ? 600 : 400
                            }}>
                              {isOverdue 
                                ? `${Math.abs(daysUntilDue)} days overdue`
                                : `${daysUntilDue} days until due`
                              }
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${
                              invoice.status === 'overdue' 
                                ? 'badge-overdue' 
                                : 'badge-sent'
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              {invoice.status === 'sent' && isAdmin && (
                                <button
                                  onClick={() => sendReminder(invoice.id)}
                                  disabled={sendingId === invoice.id}
                                  className="btn-primary text-sm py-1.5 px-3"
                                >
                                  {sendingId === invoice.id ? 'Sending...' : 'Send Reminder'}
                                </button>
                              )}
                              {invoice.status === 'overdue' && isAdmin && (
                                <button
                                  onClick={() => sendOverdueNotice(invoice.id)}
                                  disabled={sendingId === invoice.id}
                                  className="btn-primary text-sm py-1.5 px-3"
                                  style={{ background: '#E07A5F' }}
                                >
                                  {sendingId === invoice.id ? 'Sending...' : 'Send Overdue Notice'}
                                </button>
                              )}
                              <Link 
                                href={`/invoices/${invoice.id}`}
                                className="btn-outline text-sm py-1.5 px-3"
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(61, 64, 91, 0.08)' }}>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5" style={{ color: '#3D405B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#3D405B' }}>Email Service Not Configured</p>
                  <p className="text-xs mt-1" style={{ color: '#9B9B8F' }}>
                    To enable email reminders, configure SMTP, Resend, or SendGrid in your environment variables. 
                    Currently, reminders are logged in the invoice notes for demonstration purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
