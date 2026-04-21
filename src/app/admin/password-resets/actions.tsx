'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PasswordResetActionsProps {
  requestId: string;
  status: string;
  token: string;
  userEmail: string;
}

export function PasswordResetActions({ requestId, status, token, userEmail }: PasswordResetActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showLink, setShowLink] = useState(false);

  const resetLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password?token=${token}`;

  const handleApprove = async () => {
    if (!confirm(`Approve password reset for ${userEmail}?`)) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/approve-reset/${requestId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to approve request');
      }
    } catch (error) {
      alert('Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm(`Reject password reset for ${userEmail}?`)) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/reject-reset/${requestId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to reject request');
      }
    } catch (error) {
      alert('Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const handleSendLink = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-reset-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: userEmail }),
      });
      
      if (response.ok) {
        setShowLink(true);
      } else {
        alert('Failed to send reset link');
      }
    } catch (error) {
      alert('Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(resetLink);
    alert('Reset link copied to clipboard!');
  };

  if (status === 'rejected' || status === 'used') {
    return (
      <span className="text-sm" style={{ color: '#9B9B8F' }}>
        {status}
      </span>
    );
  }

  if (status === 'approved') {
    return (
      <div className="flex flex-col gap-2">
        <button 
          onClick={handleSendLink}
          disabled={loading}
          className="text-sm px-3 py-1 rounded-lg text-white disabled:opacity-50 w-fit"
          style={{ background: '#E07A5F' }}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
        
        {showLink && (
          <div className="flex flex-col gap-2">
            <p className="text-xs" style={{ color: '#9B9B8F' }}>Reset Link:</p>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={resetLink}
                className="text-xs px-2 py-1 rounded border"
                style={{ borderColor: '#E8E4DD', width: '250px' }}
              />
              <button 
                onClick={copyLink}
                className="text-xs px-2 py-1 rounded border"
                style={{ borderColor: '#E8E4DD' }}
              >
                Copy
              </button>
            </div>
            <p className="text-xs" style={{ color: '#81B29A' }}>
              Share this link with the user
            </p>
          </div>
        )}
      </div>
    );
  }

  // pending
  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleApprove}
        disabled={loading}
        className="text-sm px-3 py-1 rounded-lg text-white disabled:opacity-50"
        style={{ background: '#81B29A' }}
      >
        Approve
      </button>
      <button 
        onClick={handleReject}
        disabled={loading}
        className="text-sm px-3 py-1 rounded-lg border disabled:opacity-50"
        style={{ borderColor: '#E8E4DD', color: '#9B9B8F' }}
      >
        Reject
      </button>
    </div>
  );
}