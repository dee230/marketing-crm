'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NotesSectionProps {
  companyName: string;
  notes: string | null;
  personId: string;
  isAdmin: boolean;
}

export function CompanyNotesSection({ companyName, notes, personId, isAdmin }: NotesSectionProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [notesValue, setNotesValue] = useState(notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/clients/${personId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notesValue }),
    });
    setSaving(false);
    setIsEditing(false);
    router.refresh();
  };

  const handleCancel = () => {
    setNotesValue(notes || '');
    setIsEditing(false);
  };

  return (
    <div className="card p-6 mt-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium" style={{ color: '#9B9B8F' }}>
          Notes for {companyName}
        </h3>
        {isAdmin && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm px-3 py-1 rounded-lg"
            style={{ color: '#E07A5F', background: 'rgba(224, 122, 95, 0.1)' }}
          >
            Edit Notes
          </button>
        )}
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            className="w-full p-3 rounded-lg border text-sm"
            style={{ 
              borderColor: '#E8E4DD', 
              background: '#FFFFFF',
              minHeight: '120px' 
            }}
            rows={5}
            placeholder="Add notes about this company..."
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCancel}
              className="text-sm px-3 py-2 rounded-lg"
              style={{ color: '#9B9B8F', background: '#F5F5F5' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm px-3 py-2 rounded-lg"
              style={{ color: '#FFFFFF', background: '#E07A5F' }}
            >
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="text-sm whitespace-pre-wrap" 
          style={{ 
            color: '#2D2A26',
            minHeight: '60px',
            padding: '12px',
            background: '#FDFBF7',
            borderRadius: '8px'
          }}
        >
          {notesValue || 'No notes yet. Click "Edit Notes" to add information about this company.'}
        </div>
      )}
    </div>
  );
}