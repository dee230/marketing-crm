'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  status: string;
  clientName: string | null | undefined;
}

interface LeadsFiltersProps {
  leads: Lead[];
  isAdmin: boolean;
}

function DeleteLeadButton({ leadId, leadName }: { leadId: string; leadName: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${leadName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to delete lead');
      }
    } catch (error) {
      alert('Failed to delete lead');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-800 text-sm"
      title="Delete lead"
    >
      {isDeleting ? '...' : 'Delete'}
    </button>
  );
}

export function LeadsFilters({ leads, isAdmin }: LeadsFiltersProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const filteredLeads = leads.filter(lead => {
    if (statusFilter && lead.status !== statusFilter) return false;
    if (sourceFilter && lead.source !== sourceFilter) return false;
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} lead(s)? This action cannot be undone.`)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const response = await fetch('/api/leads/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (response.ok) {
        setSelectedIds(new Set());
        router.refresh();
      } else {
        alert('Failed to delete leads');
      }
    } catch (error) {
      alert('Failed to delete leads');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const statuses = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'converted', label: 'Converted' },
    { value: 'lost', label: 'Lost' },
  ];

  const sources = [
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Referral' },
    { value: 'cold-call', label: 'Cold Call' },
    { value: 'other', label: 'Other' },
  ];

  const hasFilter = statusFilter || sourceFilter;

  return (
    <>
      {/* Filters */}
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

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg border"
          style={{ borderColor: '#E8E4DD', background: '#FFFFFF', color: '#2D2A26' }}
        >
          <option value="">All Sources</option>
          {sources.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {hasFilter && (
          <button
            onClick={() => {
              setStatusFilter('');
              setSourceFilter('');
            }}
            className="text-sm px-3 py-2 rounded-lg"
            style={{ color: '#9B9B8F' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {isAdmin && selectedIds.size > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 rounded-lg" style={{ background: 'rgba(224, 122, 95, 0.1)' }}>
          <span className="text-sm" style={{ color: '#2D2A26' }}>
            {selectedIds.size} selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
            className="text-sm px-3 py-1.5 rounded-lg text-white"
            style={{ background: '#DC2626' }}
          >
            {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm px-3 py-1.5 rounded-lg border"
            style={{ borderColor: '#E8E4DD', color: '#2D2A26' }}
          >
            Clear Selection
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        <table>
          <thead>
            <tr>
              {isAdmin && (
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4"
                  />
                </th>
              )}
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Source</th>
              <th>Status</th>
              <th>Client</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 6} className="text-center py-8" style={{ color: '#9B9B8F' }}>
                  No leads match the selected filters
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  {isAdmin && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="w-4 h-4"
                      />
                    </td>
                  )}
                  <td className="font-medium">
                    <Link href={`/leads/${lead.id}`} style={{ color: '#E07A5F' }}>
                      {lead.name}
                    </Link>
                  </td>
                  <td style={{ color: '#9B9B8F' }}>{lead.email || '-'}</td>
                  <td style={{ color: '#9B9B8F' }}>{lead.company || '-'}</td>
                  <td>
                    <span className={`badge ${
                      lead.source === 'linkedin' ? 'badge-sent' :
                      lead.source === 'website' ? 'badge-active' :
                      lead.source === 'referral' ? 'badge-new' :
                      'badge-pending'
                    }`}>
                      {lead.source}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      lead.status === 'new' ? 'badge-new' :
                      lead.status === 'contacted' ? 'badge-pending' :
                      lead.status === 'qualified' ? 'badge-sent' :
                      lead.status === 'converted' ? 'badge-completed' :
                      'badge-pending'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td style={{ color: '#9B9B8F' }}>{lead.clientName || '-'}</td>
                  {isAdmin && (
                    <td>
                      <DeleteLeadButton leadId={lead.id} leadName={lead.name} />
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