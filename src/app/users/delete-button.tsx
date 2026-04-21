'use client';

import { useState } from 'react';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';

interface DeleteUserButtonProps {
  userId: string;
}

export function DeleteUserButton({ userId }: DeleteUserButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete user:', error);
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-sm px-3 py-1 rounded-lg border hover:bg-red-50"
      style={{ borderColor: '#E8E4DD', color: isDeleting ? '#9B9B8F' : '#DC2626' }}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
