import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { canViewUsers, canManageUserRoles } from '@/lib/roles';
import { TopNav } from '@/components/top-nav';
import { SidebarNav } from '@/components/sidebar-nav';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getUser(id: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).all();
  return user || null;
}

async function updateUser(id: string, formData: FormData) {
  'use server';
  
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');
  
  const userRole = (session.user as any)?.role;
  if (!canViewUsers(userRole)) redirect('/dashboard');

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const role = formData.get('role') as string;
  const password = formData.get('password') as string;

  // Check if email already exists for another user
  const existingUser = await db.select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .all();

  if (existingUser.length > 0 && existingUser[0].id !== id) {
    redirect('/users');
  }

  // Non-super_admins can only set role to member
  const canChangeRoles = canManageUserRoles(userRole);
  const finalRole = canChangeRoles ? role : 'member';

  const updateData: any = {
    name,
    email,
    role: finalRole as 'super_admin' | 'admin' | 'member',
    updatedAt: new Date(),
  };

  // Only update password if provided
  if (password && password.length > 0) {
    updateData.password = password;
  }

  await db.update(schema.users)
    .set(updateData)
    .where(eq(schema.users.id, id))
    .run();

  redirect('/users');
}

export default async function EditUserPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');

  const userRole = (session.user as any)?.role;
  if (!canViewUsers(userRole)) redirect('/dashboard');

  const user = await getUser(id);
  if (!user) notFound();

  const canChangeRoles = canManageUserRoles(userRole);

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={userRole === 'admin' || userRole === 'super_admin'} />

      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/users" userRole={userRole} />
        </aside>

        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            <div className="mb-6">
              <Link href="/users" className="text-sm" style={{ color: '#9B9B8F' }}>← Back to Users</Link>
              <h1 className="text-2xl font-bold mt-2" style={{ color: '#2D2A26' }}>Edit User</h1>
            </div>
            
            <div className="card p-8 max-w-2xl">
              <form action={updateUser.bind(null, id)} className="space-y-5">
                <input type="hidden" name="id" value={id} />
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    defaultValue={user.name}
                    placeholder="Enter user name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    defaultValue={user.email}
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Leave blank to keep current"
                  />
                  <p className="text-xs mt-1" style={{ color: '#9B9B8F' }}>Leave blank to keep the current password</p>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Role *</label>
                  <select id="role" name="role" required defaultValue={user.role}>
                    <option value="member">Member</option>
                    {canChangeRoles && (
                      <>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </>
                    )}
                  </select>
                  {!canChangeRoles && (
                    <p className="text-xs mt-1" style={{ color: '#9B9B8F' }}>
                      Only super admins can change user roles
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary">
                    Update User
                  </button>
                  <Link href="/users" className="btn-outline">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}