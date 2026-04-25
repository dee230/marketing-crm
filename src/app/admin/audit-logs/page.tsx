import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';
import { TopNav } from '@/components/top-nav';
import { SidebarNav } from '@/components/sidebar-nav';
import { canViewUsers } from '@/lib/roles';

export const dynamic = 'force-dynamic';

interface SearchParams {
  search?: string;
  entityType?: string;
  action?: string;
}

async function getAuditLogs(searchParams: SearchParams) {
  const { search, entityType, action } = searchParams;
  
  let logs: any[] = [];
  let users: any[] = [];
  
  try {
    // Build WHERE clause - use tagged template
    let whereClause = '';
    if (entityType && entityType !== 'all' && action && action !== 'all') {
      whereClause = `WHERE entity_type = '${entityType}' AND action = '${action}'`;
    } else if (entityType && entityType !== 'all') {
      whereClause = `WHERE entity_type = '${entityType}'`;
    } else if (action && action !== 'all') {
      whereClause = `WHERE action = '${action}'`;
    }
    if (search) {
      const suffix = whereClause ? ' AND ' : 'WHERE ';
      whereClause += suffix + `(entity_id LIKE '%${search}%' OR user_id LIKE '%${search}%')`;
    }
    
    // Use tagged template with LIMIT as parameter
    if (whereClause) {
      logs = await sqlRaw`SELECT * FROM audit_logs ${sqlRaw(whereClause)} ORDER BY created_at DESC LIMIT 100`;
    } else {
      logs = await sqlRaw`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`;
    }
    
    // Get user details
    if (logs.length > 0) {
      const userIds = [...new Set(logs.map(l => l.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        // Use IN query for userIds
        const userIdList = userIds.map(id => `'${id}'`).join(', ');
        users = await sqlRaw`SELECT * FROM users WHERE id IN (${userIdList})`;
      }
    }
  } catch (e) {
    console.error('Error fetching audit logs:', e);
  }
  
  const userMap = new Map(users.map(u => [u.id, u]));
  
  return logs.map(log => ({
    ...log,
    user: log.user_id ? userMap.get(log.user_id) : null,
  }));
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const params = await searchParams;
  const userRole = (session.user as any)?.role;
  if (!canViewUsers(userRole)) redirect('/dashboard');

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const logs = await getAuditLogs(params);

  const entityTypes = ['all', 'user', 'client', 'lead', 'invoice', 'task', 'password_reset'];
  const actions = [
    'all',
    'password_reset_requested',
    'password_reset_approved',
    'password_reset_rejected',
    'password_reset_used',
    'user_created',
    'user_updated',
    'user_deleted',
    'client_created',
    'client_updated',
    'client_deleted',
    'lead_created',
    'lead_updated',
    'lead_deleted',
    'lead_status_changed',
    'invoice_created',
    'invoice_updated',
    'invoice_deleted',
    'invoice_status_changed',
    'task_created',
    'task_updated',
    'task_deleted',
    'task_status_changed',
    'user_signed_in',
    'user_signed_out',
  ];

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />

      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/users" userRole={userRole} />
        </aside>

        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            <div className="mb-6">
              <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>Audit Logs</h1>
              <p className="text-sm" style={{ color: '#9B9B8F' }}>View all system activity and changes</p>
            </div>

            {/* Filters */}
            <form className="mb-6 flex gap-4 flex-wrap">
              <input
                type="text"
                name="search"
                placeholder="Search by entity ID..."
                defaultValue={params.search || ''}
                className="input flex-1 min-w-[200px]"
              />
              <select
                name="entityType"
                defaultValue={params.entityType || 'all'}
                className="input w-auto"
              >
                {entityTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Entities' : type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
              <select
                name="action"
                defaultValue={params.action || 'all'}
                className="input w-auto"
              >
                {actions.map(act => (
                  <option key={act} value={act}>
                    {act === 'all' ? 'All Actions' : act.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary">
                Filter
              </button>
            </form>

            {/* Logs Table */}
            {logs.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(129, 178, 154, 0.15)' }}>
                  <svg className="w-8 h-8" style={{ color: '#81B29A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="mb-4" style={{ color: '#9B9B8F' }}>No audit logs found</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'rgba(61, 64, 91, 0.05)' }}>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>When</th>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>Who</th>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>Action</th>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>Entity Type</th>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>Entity ID</th>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>IP Address</th>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-t" style={{ borderColor: '#E8E4DD' }}>
                        <td className="px-6 py-4 text-sm" style={{ color: '#9B9B8F' }}>
                          {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium" style={{ color: '#2D2A26' }}>
                            {log.user?.name || log.user?.email || 'System'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${
                            log.action.includes('created') || log.action.includes('approved') || log.action.includes('used')
                              ? 'badge-completed'
                              : log.action.includes('deleted') || log.action.includes('rejected')
                              ? 'badge-new'
                              : 'badge-pending'
                          }`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#2D2A26' }}>
                          {log.entity_type}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono" style={{ color: '#9B9B8F' }}>
                          {(log.entity_id || '').slice(0, 12)}...
                        </td>
                        <td className="px-6 py-4 text-sm font-mono" style={{ color: '#9B9B8F' }}>
                          {log.ip_address || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#9B9B8F' }}>
                          {log.details ? (
                            <span className="text-xs">
                              {Object.keys(JSON.parse(log.details)).join(', ')}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}