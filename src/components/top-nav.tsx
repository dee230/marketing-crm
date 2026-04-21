'use client';

import Link from 'next/link';
import { SignOutButton } from './sign-out-button';

interface TopNavProps {
  userRole: string | undefined;
  userEmail: string;
  isAdmin: boolean;
}

export function TopNav({ userRole, userEmail, isAdmin }: TopNavProps) {
  const canViewInvoices = isAdmin;
  const canAccessAccounting = isAdmin;
  const canViewUsers = userRole === 'admin' || userRole === 'super_admin';

  return (
    <nav style={{ background: '#FFFFFF', borderBottom: '1px solid #E8E4DD' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#E07A5F' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <Link href="/dashboard" className="text-xl font-bold" style={{ color: '#2D2A26' }}>
              Nandi Creative
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-1">
            <Link href="/dashboard" className="nav-link">Dashboard</Link>
            <Link href="/clients" className="nav-link">Clients</Link>
            <Link href="/leads" className="nav-link">Leads</Link>
            {canViewInvoices && <Link href="/invoices" className="nav-link">Invoices</Link>}
            {canAccessAccounting && <Link href="/accounting/pending" className="nav-link">Accounting</Link>}
            <Link href="/tasks" className="nav-link">Tasks</Link>
            <Link href="/reports" className="nav-link">Reports</Link>
            {canViewUsers && <Link href="/users" className="nav-link">Users</Link>}
            {canViewUsers && <Link href="/admin/password-resets" className="nav-link">Password Resets</Link>}
            {canViewUsers && <Link href="/admin/audit-logs" className="nav-link">Audit Logs</Link>}
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: '#9B9B8F' }}>{userEmail}</span>
            {userRole === 'super_admin' ? (
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(129, 178, 154, 0.2)', color: '#81B29A' }}>
                Super Admin
              </span>
            ) : isAdmin ? (
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(224, 122, 95, 0.15)', color: '#E07A5F' }}>
                Admin
              </span>
            ) : null}
            <SignOutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}