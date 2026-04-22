import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db } from '@/db';
import { eq, desc, or } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { TopNav } from '@/components/top-nav';
import { SidebarNav } from '@/components/sidebar-nav';
import { canViewUsers } from '@/lib/roles';
import { PasswordResetActions } from './actions';

export const dynamic = 'force-dynamic';

async function getPendingRequests() {
  const requests = await db.select()
    .from(schema.passwordResetRequests)
    .where(or(
      eq(schema.passwordResetRequests.status, 'pending'),
      eq(schema.passwordResetRequests.status, 'approved')
    ))
    .orderBy(desc(schema.passwordResetRequests.requestedAt))
    .execute();

  // Get user details
  const userIds = [...new Set(requests.map(r => r.userId))];
  const users = await db.select()
    .from(schema.users)
    .execute();

  const userMap = new Map(users.map(u => [u.id, u]));

  return requests.map(req => ({
    ...req,
    user: userMap.get(req.userId),
  }));
}

export default async function PasswordResetRequestsPage() {
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');

  const userRole = (session.user as any)?.role;
  if (!canViewUsers(userRole)) redirect('/dashboard');

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const requests = await getPendingRequests();

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
              <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>Password Reset Requests</h1>
              <p className="text-sm" style={{ color: '#9B9B8F' }}>Review and manage password reset requests</p>
            </div>

            {requests.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(129, 178, 154, 0.15)' }}>
                  <svg className="w-8 h-8" style={{ color: '#81B29A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="mb-4" style={{ color: '#9B9B8F' }}>No pending password reset requests</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'rgba(61, 64, 91, 0.05)' }}>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>User</th>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>Email</th>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>Requested</th>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>Status</th>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id} className="border-t" style={{ borderColor: '#E8E4DD' }}>
                        <td className="px-6 py-4">
                          <span className="font-medium" style={{ color: '#2D2A26' }}>{req.user?.name || 'Unknown'}</span>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#2D2A26' }}>{req.user?.email || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#9B9B8F' }}>
                          {req.requestedAt ? new Date(req.requestedAt).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${
                            req.status === 'pending' ? 'badge-pending' : 
                            req.status === 'approved' ? 'badge-completed' : 'badge-new'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <PasswordResetActions 
                            requestId={req.id} 
                            status={req.status}
                            token={req.token}
                            userEmail={req.user?.email || 'Unknown'}
                          />
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