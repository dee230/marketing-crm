'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  company: string;
}

interface NewTaskPageProps {
  users: User[];
  clients: Client[];
}

export function CreateTaskForm({ users, clients }: NewTaskPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create task');
      }

      router.push(data.redirectUrl || '/tasks');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

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
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating...' : 'Create Task'}
        </button>
        <Link href="/tasks" className="btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}