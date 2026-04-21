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
}

export function ClientsFilters({ companies }: ClientsFiltersProps) {
  const [statusFilter, setStatusFilter] = useState('');

  const filteredCompanies = companies.filter(company => {
    if (statusFilter && company.status !== statusFilter) return false;
    return true;
  });

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'prospect', label: 'Prospect' },
  ];

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
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8" style={{ color: '#9B9B8F' }}>
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
                    <span className={`badge ${
                      company.status === 'active' ? 'badge-active' :
                      company.status === 'inactive' ? 'badge-pending' :
                      'badge-pending'
                    }`}>
                      {company.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}