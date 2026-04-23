'use client';

import { useState, useEffect } from 'react';

interface TaskStatusEditProps {
  taskId: string;
  currentStatus: string;
  isAdmin: boolean;
  statusLockedAt: Date | null;
  pendingStatus?: string | null;
  pendingStatusRequestedBy?: string | null;
  pendingStatusRequestedAt?: Date | null;
}

export function TaskStatusEdit({ 
  taskId, 
  currentStatus, 
  isAdmin, 
  statusLockedAt,
  pendingStatus,
  pendingStatusRequestedAt 
}: TaskStatusEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showApproval, setShowApproval] = useState(false);

  const statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const isLocked = statusLockedAt !== null;
  const hasPendingRequest = pendingStatus && pendingStatus !== currentStatus;
  
  // Members can request status change (goes to pending approval)
  // Admins can approve/reject
  const canRequestChange = !isLocked || isAdmin;
  const canApprove = isAdmin && hasPendingRequest;

  const handleStatusChange = async (newStatus: string, approve: boolean = false) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          approvePending: approve 
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to update status');
        return;
      }
      
      if (approve && isAdmin) {
        setSuccess('Status change approved!');
      }
      
      window.location.reload();
    } catch (err) {
      setError('Failed to update status');
    } finally {
      setSaving(false);
      setIsEditing(false);
      setShowApproval(false);
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

  // Show pending approval UI for admins
  if (canApprove) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`badge ${getStatusColor(currentStatus)}`}>
            {currentStatus}
          </span>
          <span className="text-gray-400">→</span>
          <span className={`badge ${getStatusColor(pendingStatus!)} bg-yellow-100 text-yellow-800`}>
            {pendingStatus} (pending)
          </span>
        </div>
        
        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            Status change requested
          </p>
          <p className="text-xs text-yellow-600 mb-3">
            {pendingStatusRequestedAt ? new Date(pendingStatusRequestedAt).toLocaleString() : 'Recently'}
          </p>
          
          {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
          {success && <div className="text-xs text-green-600 mb-2">{success}</div>}
          
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange(pendingStatus!, true)}
              disabled={saving}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Approving...' : 'Approve'}
            </button>
            <button
              onClick={() => handleStatusChange(currentStatus, false)}
              disabled={saving}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show pending status for members
  if (hasPendingRequest && !isAdmin) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`badge ${getStatusColor(currentStatus)}`}>
            {currentStatus}
          </span>
          <span className="text-gray-400">→</span>
          <span className={`badge ${getStatusColor(pendingStatus!)} bg-yellow-100 text-yellow-800`}>
            {pendingStatus} (awaiting approval)
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Status change pending admin approval
        </p>
      </div>
    );
  }

  if (!canRequestChange) {
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
        <div className="space-y-2">
          <select
            autoFocus
            defaultValue={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-sm px-2 py-1 rounded border"
            style={{ borderColor: '#E07A5F', background: '#FFFFFF' }}
            disabled={saving}
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          
          {error && <div className="text-xs text-red-500">{error}</div>}
          
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <span 
            className={`badge cursor-pointer ${getStatusColor(currentStatus)}`}
            onClick={() => setIsEditing(true)}
          >
            {currentStatus}
            {isLocked && <span className="ml-1 text-xs">(admin only)</span>}
          </span>
          
          {isLocked && isAdmin && (
            <div className="text-xs text-amber-600 mt-1">Status locked - only admins can modify</div>
          )}
        </div>
      )}
    </div>
  );
}
