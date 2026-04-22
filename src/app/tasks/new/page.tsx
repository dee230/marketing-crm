import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';

export const dynamic = 'force-dynamic';

async function createTask(formData: FormData) {
  'use server';
  
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');
  
  // All authenticated users can create tasks (members, admins, super_admins)
  const userRole = (session.user as any)?.role;
  if (!userRole) redirect('/sign-in');

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const assigneeId = formData.get('assigneeId') as string;
  const clientId = formData.get('clientId') as string;
  const priority = formData.get('priority') as string;
  const status = formData.get('status') as string;
  const dueDate = formData.get('dueDate') as string;

  await db.insert(schema.tasks).values({
    id: crypto.randomUUID(),
    title,
    description: description || null,
    assigneeId: assigneeId || null,
    clientId: clientId || null,
    priority: priority as any,
    status: status as any,
    dueDate: dueDate ? new Date(dueDate) : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  redirect('/tasks');
}

export default async function NewTaskPage() {
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');
  
  // All authenticated users can access this page
  const userRole = (session.user as any)?.role;
  if (!userRole) redirect('/sign-in');

  const [users, clients] = await Promise.all([
    db.select().from(schema.users).execute(),
    db.select().from(schema.clients).execute(),
  ]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link href="/tasks" className="text-sm" style={{ color: '#9B9B8F' }}>← Back to Tasks</Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: '#2D2A26' }}>Create Task</h1>
      </div>
      
      <div className="card p-8 max-w-2xl">
        <form action={createTask} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Title *</label>
            <input type="text" id="title" name="title" required placeholder="Enter task title" />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Description</label>
            <textarea id="description" name="description" rows={4} placeholder="Describe the task" />
          </div>

          <div>
            <label htmlFor="assigneeId" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Assignee</label>
            <select id="assigneeId" name="assigneeId">
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="clientId" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Related Client</label>
            <select id="clientId" name="clientId">
              <option value="">None</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name} - {client.company}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Priority</label>
              <select id="priority" name="priority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Status</label>
              <select id="status" name="status">
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Due Date</label>
            <input type="date" id="dueDate" name="dueDate" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary">
              Create Task
            </button>
            <Link href="/tasks" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}