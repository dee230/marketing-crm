import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { CreateTaskForm } from './create-task-form';

export const dynamic = 'force-dynamic';

async function getUsersAndClients() {
  let users: any[] = [];
  let clients: any[] = [];
  
  try {
    users = await db.select().from(schema.users).execute();
  } catch (e) {
    console.error('Error fetching users:', e);
  }
  
  try {
    clients = await db.select().from(schema.clients).execute();
  } catch (e) {
    console.error('Error fetching clients:', e);
  }
  
  return { users, clients };
}

export default async function NewTaskPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');
  
  const userRole = (session.user as any)?.role;
  if (!userRole) redirect('/sign-in');
  
  const { users, clients } = await getUsersAndClients();
  
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link href="/tasks" className="text-sm" style={{ color: '#9B9B8F' }}>← Back to Tasks</Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: '#2D2A26' }}>Create Task</h1>
      </div>
      
      <div className="card p-8 max-w-2xl">
        <CreateTaskForm users={users} clients={clients} />
      </div>
    </div>
  );
}