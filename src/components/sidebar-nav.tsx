import Link from 'next/link';

interface SidebarNavProps {
  currentPath?: string;
  userRole?: string;
}

export function SidebarNav({ currentPath, userRole }: SidebarNavProps) {
  // Permissions based on role
  const canViewInvoices = userRole === 'admin' || userRole === 'super_admin';
  const canAccessAccounting = userRole === 'admin' || userRole === 'super_admin';
  const canViewUsers = userRole === 'admin' || userRole === 'super_admin';

  // Check if a path is active
  const isActive = (path: string) => {
    if (currentPath === path) return true;
    if (path === '/invoices' && currentPath?.startsWith('/invoices')) return true;
    if (path === '/clients' && currentPath?.startsWith('/clients')) return true;
    if (path === '/leads' && currentPath?.startsWith('/leads')) return true;
    if (path === '/tasks' && currentPath?.startsWith('/tasks')) return true;
    if (path === '/users' && currentPath?.startsWith('/users')) return true;
    if (path === '/accounting' && currentPath?.startsWith('/accounting')) return true;
    if (path === '/reports' && currentPath?.startsWith('/reports')) return true;
    if (path === '/admin/password-resets' && currentPath?.startsWith('/admin/password-resets')) return true;
    if (path === '/admin/audit-logs' && currentPath?.startsWith('/admin/audit-logs')) return true;
    return false;
  };

  const linkStyle = (isActive: boolean) => isActive 
    ? 'background: rgba(224, 122, 95, 0.1); color: #E07A5F' 
    : '';

  return (
    <nav className="mt-6 px-4 space-y-1">
      <Link 
        href="/dashboard" 
        className="sidebar-link"
        style={isActive('/dashboard') ? { background: 'rgba(224, 122, 95, 0.1)', color: '#E07A5F' } : undefined}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Dashboard
      </Link>

      <Link 
        href="/clients" 
        className="sidebar-link"
        style={isActive('/clients') ? { background: 'rgba(224, 122, 95, 0.1)', color: '#E07A5F' } : undefined}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Clients
      </Link>

      <Link 
        href="/leads" 
        className="sidebar-link"
        style={isActive('/leads') ? { background: 'rgba(224, 122, 95, 0.1)', color: '#E07A5F' } : undefined}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        Leads
      </Link>

      {canViewInvoices && (
        <Link 
          href="/invoices" 
          className="sidebar-link"
          style={isActive('/invoices') ? { background: 'rgba(224, 122, 95, 0.1)', color: '#E07A5F' } : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Invoices
        </Link>
      )}

      {canAccessAccounting && (
        <Link 
          href="/accounting/pending" 
          className="sidebar-link"
          style={isActive('/accounting') ? { background: 'rgba(224, 122, 95, 0.1)', color: '#E07A5F' } : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Accounting
        </Link>
      )}

      <Link 
        href="/tasks" 
        className="sidebar-link"
        style={isActive('/tasks') ? { background: 'rgba(224, 122, 95, 0.1)', color: '#E07A5F' } : undefined}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        Tasks
      </Link>

      <Link 
        href="/reports" 
        className="sidebar-link"
        style={isActive('/reports') ? { background: 'rgba(224, 122, 95, 0.1)', color: '#E07A5F' } : undefined}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Reports
      </Link>

      {canViewUsers && (
        <Link 
          href="/admin/password-resets" 
          className="sidebar-link"
          style={isActive('/admin/password-resets') ? { background: 'rgba(224, 122, 95, 0.1)', color: '#E07A5F' } : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Password Resets
        </Link>
      )}

      {canViewUsers && (
        <Link 
          href="/admin/audit-logs" 
          className="sidebar-link"
          style={isActive('/admin/audit-logs') ? { background: 'rgba(224, 122, 95, 0.1)', color: '#E07A5F' } : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Audit Logs
        </Link>
      )}

      {canViewUsers && (
        <Link 
          href="/users" 
          className="sidebar-link"
          style={isActive('/users') ? { background: 'rgba(224, 122, 95, 0.1)', color: '#E07A5F' } : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Users
        </Link>
      )}
    </nav>
  );
}