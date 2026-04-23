import Link from 'next/link';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { TopNav } from '@/components/top-nav';
import { SidebarNav } from '@/components/sidebar-nav';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { canViewTasks, canManageTasks } from '@/lib/roles';
import { TaskStatusEdit } from './task-status-edit';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getTask(id: string) {
  const [task] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).execute();
  return task || null;
}

async function getAssignee(userId: string | null) {
  if (!userId) return null;
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).execute();
  return user || null;
}

async function getClient(clientId: string | null) {
  if (!clientId) return null;
  const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, clientId)).execute();
  return client || null;
}

export default async function TaskDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');

  const task = await getTask(id);
  if (!task) notFound();

  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const canManage = canManageTasks(userRole);
  const assignee = await getAssignee(task.assigneeId);
  const client = await getClient(task.clientId);

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />

      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/tasks" userRole={userRole} />
        </aside>

        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/tasks" className="p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" style={{ color: '#9B9B8F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>{task.title}</h1>
                <p className="text-sm" style={{ color: '#9B9B8F' }}>Task Details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Task Details */}
              <div className="card p-6 col-span-2">
                <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-xs" style={{ color: '#9B9B8F' }}>Status</span>
                    <div>
                      <TaskStatusEdit 
                        taskId={task.id} 
                        currentStatus={task.status} 
                        isAdmin={isAdmin}
                        statusLockedAt={task.statusLockedAt}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-xs" style={{ color: '#9B9B8F' }}>Priority</span>
                    <p className={`font-medium ${
                      task.priority === 'urgent' ? 'text-red-600' :
                      task.priority === 'high' ? 'text-orange-600' :
                      task.priority === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {task.priority}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-xs" style={{ color: '#9B9B8F' }}>Description</span>
                    <p className="text-sm" style={{ color: '#2D2A26' }}>
                      {task.description || 'No description'}
                    </p>
                  </div>
                  
                  {client && (
                    <div>
                      <span className="text-xs" style={{ color: '#9B9B8F' }}>Client</span>
                      <p>
                        <Link href={`/clients/${encodeURIComponent(client.company || client.name)}`} style={{ color: '#E07A5F' }}>
                          {client.company || client.name}
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Dates */}
                <div className="card p-6">
                  <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>Dates</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: '#9B9B8F' }}>Created</span>
                      <span className="text-sm" style={{ color: '#2D2A26' }}>
                        {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '-'}
                      </span>
                    </div>
                    {task.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: '#9B9B8F' }}>Due</span>
                        <span className="text-sm" style={{ color: '#2D2A26' }}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {task.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: '#9B9B8F' }}>Completed</span>
                        <span className="text-sm" style={{ color: '#2D2A26' }}>
                          {new Date(task.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignee */}
                <div className="card p-6">
                  <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>Assigned To</h3>
                  {assignee ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#E07A5F' }}>
                        <span className="text-white font-medium">
                          {assignee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: '#2D2A26' }}>{assignee.name}</p>
                        <p className="text-sm" style={{ color: '#9B9B8F' }}>{assignee.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: '#9B9B8F' }}>Unassigned</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/tasks" className="text-sm" style={{ color: '#E07A5F' }}>← Back to Tasks</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}