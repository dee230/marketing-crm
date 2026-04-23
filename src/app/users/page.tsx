import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { SidebarNav } from '@/components/sidebar-nav';
import { TopNav } from '@/components/top-nav';
import { sqlRaw } from '@/db';
import { canViewUsers, isSuperAdmin } from '@/lib/roles';
import { DeleteUserButton } from './delete-button';

export const dynamic = 'force-dynamic';

async function getUsers() {
  return sqlRaw`SELECT * FROM users ORDER BY created_at DESC`;
}

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  // Only super_admins can view users
  const userRole = (session.user as any)?.role;
  if (!canViewUsers(userRole)) {
    redirect('/dashboard');
  }

  const currentUserId = session.user?.id;
  const users = await getUsers();

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isSuperAdmin(userRole)} />

      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/users" userRole={userRole} />
        </aside>

        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>Users</h1>
                <p className="text-sm" style={{ color: '#9B9B8F' }}>Manage system users and permissions</p>
              </div>
              <Link href="/users/new" className="btn-primary">
                + Add User
              </Link>
            </div>

            {users.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(61, 64, 91, 0.15)' }}>
                  <svg className="w-8 h-8" style={{ color: '#3D405B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="mb-4" style={{ color: '#9B9B8F' }}>No users yet</p>
                <Link href="/users/new" style={{ color: '#E07A5F' }}>
                  Add your first user →
                </Link>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'rgba(61, 64, 91, 0.05)' }}>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>Name</th>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>Email</th>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>Role</th>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>Created</th>
                      <th className="text-left px-6 py-3 text-xs font-medium" style={{ color: '#9B9B8F' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t" style={{ borderColor: '#E8E4DD' }}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(224, 122, 95, 0.15)' }}>
                              <span className="text-sm font-medium" style={{ color: '#E07A5F' }}>
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium" style={{ color: '#2D2A26' }}>{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#2D2A26' }}>{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`badge ${
                            user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'admin' ? 'badge-sent' : 'badge-pending'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#9B9B8F' }}>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {user.id !== currentUserId && (
                              <DeleteUserButton userId={user.id} />
                            )}
                            <Link 
                              href={`/users/${user.id}`}
                              className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
                              style={{ borderColor: '#E8E4DD', color: '#3D405B' }}
                            >
                              Edit
                            </Link>
                          </div>
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
