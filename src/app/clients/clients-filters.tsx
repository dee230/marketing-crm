'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  count: number;
  status: string;
}

interface ClientsFiltersProps {
  companies: Company[];
  isAdmin?: boolean;
}

export function ClientsFilters({ companies, isAdmin = false }: ClientsFiltersProps) {
  const [statusFilter, setStatusFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredCompanies = companies.filter(company => {
    if (statusFilter && company.status !== statusFilter) return false;
    return true;
  });

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'prospect', label: 'Prospect' },
  ];

  const handleStatusChange = async (companyId: string, newStatus: string) => {
    setSavingId(companyId);
    try {
      const response = await fetch(`/api/clients/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    } finally {
      setSavingId(null);
      setEditingId(null);
    }
  };

  const handleDelete = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }
    
    setDeletingId(companyId);
    try {
      const response = await fetch(`/api/clients/${companyId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete client');
      }
    } catch (error) {
      console.error('Failed to delete client:', error);
      alert('Failed to delete client');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="flex gap-3 mb-4">
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
      </div>

      <div className="card overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Contacts</th>
              <th>Status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="text-center py-8" style={{ color: '#9B9B8F' }}>
                  No companies match the selected filters
                </td>
              </tr>
            ) : (
              filteredCompanies.map((company) => (
                <tr key={company.id}>
                  <td className="font-medium">
                    <Link href={`/clients/${encodeURIComponent(company.name)}`} style={{ color: '#E07A5F' }}>
                      {company.name}
                    </Link>
                  </td>
                  <td style={{ color: '#9B9B8F' }}>{company.count} contact{company.count > 1 ? 's' : ''}</td>
                  <td>
                    {isAdmin && company.status !== 'deleted' ? (
                      editingId === company.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={company.status}
                            onChange={(e) => handleStatusChange(company.id, e.target.value)}
                            className="text-sm px-2 py-1 rounded border"
                            style={{ borderColor: '#E8E4DD' }}
                            autoFocus
                          >
                            {statuses.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-sm px-2 py-1"
                            style={{ color: '#9B9B8F' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`badge cursor-pointer ${
                            company.status === 'active' ? 'badge-active' :
                            company.status === 'inactive' ? 'badge-pending' :
                            'badge-pending'
                          }`}
                          onClick={() => setEditingId(company.id)}
                        >
                          {company.status}
                        </span>
                      )
                    ) : (
                      <span className={`badge ${
                        company.status === 'active' ? 'badge-active' :
                        company.status === 'inactive' ? 'badge-pending' :
                        'badge-pending'
                      }`}>
                        {company.status}
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td>
                      <button
                        onClick={() => handleDelete(company.id)}
                        disabled={deletingId === company.id}
                        className="p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete client"
                        style={{ color: deletingId === company.id ? '#ccc' : '#dc2626' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}