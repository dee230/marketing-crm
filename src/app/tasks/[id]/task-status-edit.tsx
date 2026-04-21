'use client';

import { useState } from 'react';

interface TaskStatusEditProps {
  taskId: string;
  currentStatus: string;
  isAdmin: boolean;
  statusLockedAt: Date | null;
}

export function TaskStatusEdit({ taskId, currentStatus, isAdmin, statusLockedAt }: TaskStatusEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const isLocked = statusLockedAt !== null;
  const canEdit = !isLocked || isAdmin;

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to update status');
        return;
      }
      
      window.location.reload();
    } catch (err) {
      setError('Failed to update status');
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'badge-completed';
      case 'in-progress': return 'badge-sent';
      case 'cancelled': return 'bg-gray-100 text-gray-600';
      default: return 'badge-pending';
    }
  };

  if (!canEdit) {
    return (
      <span className={`badge ${getStatusColor(currentStatus)}`}>
        {currentStatus}
        <span className="ml-1 text-xs opacity-75">(locked)</span>
      </span>
    );
  }

  return (
    <div>
      {isEditing ? (
        <select
          autoFocus
          defaultValue={currentStatus}
          onBlur={(e) => handleStatusChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsEditing(false);
          }}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="text-sm px-2 py-1 rounded border"
          style={{ borderColor: '#E07A5F', background: '#FFFFFF' }}
          disabled={saving}
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      ) : (
        <span 
          className={`badge cursor-pointer ${getStatusColor(currentStatus)}`}
          onClick={() => setIsEditing(true)}
        >
          {currentStatus}
          {isLocked && <span className="ml-1 text-xs">(admin only)</span>}
        </span>
      )}
      
      {error && (
        <div className="text-xs text-red-500 mt-1">{error}</div>
      )}
      
      {isLocked && isAdmin && (
        <div className="text-xs text-amber-600 mt-1">Status locked - only admins can modify</div>
      )}
    </div>
  );
}