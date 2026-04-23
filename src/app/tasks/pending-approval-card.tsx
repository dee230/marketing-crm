'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PendingTask {
  id: string;
  title: string;
  status: string;
  pending_status: string | null;
  requested_by_name: string | null;
  assignee_name: string | null;
  client_name: string | null;
  pending_status_requested_at: string | null;
}

export function PendingApprovalCard({ task }: { task: PendingTask }) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvePending: true }),
      });
      
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to approve');
      }
    } catch (err) {
      alert('Failed to approve');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvePending: false }),
      });
      
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to reject');
      }
    } catch (err) {
      alert('Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-3 rounded bg-white border" style={{ borderColor: '#E8E4DD' }}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-sm" style={{ color: '#2D2A26' }}>
            {task.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="badge badge-pending">{task.status}</span>
            <span className="text-gray-400">→</span>
            <span className="badge badge-completed">{task.pending_status}</span>
          </div>
          <div className="mt-2 text-xs" style={{ color: '#9B9B8F' }}>
            Requested by: {task.requested_by_name || 'Unknown'}
            {task.assignee_name && ` • Assigned to: ${task.assignee_name}`}
            {task.client_name && ` • Client: ${task.client_name}`}
          </div>
        </div>
        
        <div className="flex gap-2 ml-4">
          <button
            onClick={handleApprove}
            disabled={processing}
            className="px-3 py-1 text-xs font-medium rounded text-white"
            style={{ background: '#5B8C5A' }}
          >
            {processing ? '...' : 'Approve'}
          </button>
          <button
            onClick={handleReject}
            disabled={processing}
            className="px-3 py-1 text-xs font-medium rounded"
            style={{ background: '#FFFFFF', border: '1px solid #E07A5F', color: '#E07A5F' }}
          >
            {processing ? '...' : 'Deny'}
          </button>
        </div>
      </div>
    </div>
  );
}