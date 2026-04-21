'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  assigneeName: string | null | undefined;
  clientName: string | null | undefined;
}

interface TasksFiltersProps {
  tasks: Task[];
  isAdmin: boolean;
}

function DeleteTaskButton({ taskId, taskTitle }: { taskId: string; taskTitle: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to delete task');
      }
    } catch (error) {
      alert('Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-800 text-sm"
      title="Delete task"
    >
      {isDeleting ? '...' : 'Delete'}
    </button>
  );
}

export function TasksFilters({ tasks, isAdmin }: TasksFiltersProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const filteredTasks = tasks.filter(task => {
    if (statusFilter && task.status !== statusFilter) return false;
    if (priorityFilter && task.priority !== priorityFilter) return false;
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} task(s)? This action cannot be undone.`)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const response = await fetch('/api/tasks/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (response.ok) {
        setSelectedIds(new Set());
        router.refresh();
      } else {
        alert('Failed to delete tasks');
      }
    } catch (error) {
      alert('Failed to delete tasks');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const hasFilter = statusFilter || priorityFilter;

  return (
    <>
      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg border"
          style={{ borderColor: '#E8E4DD', background: '#FFFFFF', color: '#2D2A26' }}
        >
          <option value="">All Statuses</option>
          {statuses.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg border"
          style={{ borderColor: '#E8E4DD', background: '#FFFFFF', color: '#2D2A26' }}
        >
          <option value="">All Priorities</option>
          {priorities.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {hasFilter && (
          <button
            onClick={() => {
              setStatusFilter('');
              setPriorityFilter('');
            }}
            className="text-sm px-3 py-2 rounded-lg"
            style={{ color: '#9B9B8F' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {isAdmin && selectedIds.size > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 rounded-lg" style={{ background: 'rgba(224, 122, 95, 0.1)' }}>
          <span className="text-sm" style={{ color: '#2D2A26' }}>
            {selectedIds.size} selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
            className="text-sm px-3 py-1.5 rounded-lg text-white"
            style={{ background: '#DC2626' }}
          >
            {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm px-3 py-1.5 rounded-lg border"
            style={{ borderColor: '#E8E4DD', color: '#2D2A26' }}
          >
            Clear Selection
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        <table>
          <thead>
            <tr>
              {isAdmin && (
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredTasks.length && filteredTasks.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4"
                  />
                </th>
              )}
              <th>Title</th>
              <th>Assignee</th>
              <th>Client</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due Date</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 6} className="text-center py-8" style={{ color: '#9B9B8F' }}>
                  No tasks match the selected filters
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.id}>
                  {isAdmin && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        className="w-4 h-4"
                      />
                    </td>
                  )}
                  <td className="font-medium">
                    <Link href={`/tasks/${task.id}`} style={{ color: '#E07A5F' }}>
                      {task.title}
                    </Link>
                  </td>
                  <td style={{ color: '#9B9B8F' }}>{task.assigneeName || '-'}</td>
                  <td style={{ color: '#9B9B8F' }}>{task.clientName || '-'}</td>
                  <td>
                    <span className={`badge ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      task.priority === 'high' ? 'badge-pending' :
                      task.priority === 'medium' ? 'badge-new' :
                      'badge-completed'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      task.status === 'completed' ? 'badge-completed' :
                      task.status === 'in-progress' ? 'badge-sent' :
                      'badge-pending'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td style={{ color: '#9B9B8F' }}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                  </td>
                  {isAdmin && (
                    <td>
                      <DeleteTaskButton taskId={task.id} taskTitle={task.title} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}