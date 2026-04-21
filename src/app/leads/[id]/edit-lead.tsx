'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  status: string;
  notes: string | null;
  linkedinProfileId: string | null;
}

interface EditLeadFormProps {
  lead: Lead;
  isAdmin: boolean;
}

export function EditLeadForm({ lead, isAdmin }: EditLeadFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [leadData, setLeadData] = useState<Lead>(lead);
  const [saving, setSaving] = useState(false);

  const updateField = (field: keyof Lead, value: string) => {
    setLeadData({ ...leadData, [field]: value || null });
  };

  const handleSave = async () => {
    setSaving(true);
    
    if (isAdmin) {
      // Full update for admins
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          company: leadData.company,
          source: leadData.source,
          status: leadData.status,
          notes: leadData.notes,
        }),
      });
    } else {
      // Limited update for non-admins (only status and notes)
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: leadData.status,
          notes: leadData.notes,
        }),
      });
    }
    
    setSaving(false);
    setIsEditing(false);
    router.refresh();
  };

  const handleCancel = () => {
    setLeadData(lead);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-sm px-3 py-1 rounded-lg"
        style={{ color: '#E07A5F', background: 'rgba(224, 122, 95, 0.1)' }}
      >
        Edit Lead
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium" style={{ color: '#9B9B8F' }}>
          {isAdmin ? 'Edit Lead' : 'Update Status & Notes'}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="text-sm px-3 py-1 rounded-lg"
            style={{ color: '#9B9B8F', background: '#F5F5F5' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm px-3 py-1 rounded-lg"
            style={{ color: '#FFFFFF', background: '#E07A5F' }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Admin gets full edit, non-admin gets limited edit */}
      {isAdmin ? (
        <>
          <div>
            <label className="text-xs" style={{ color: '#9B9B8F' }}>Name</label>
            <input
              type="text"
              value={leadData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full p-2 rounded border text-sm"
              style={{ borderColor: '#E8E4DD' }}
            />
          </div>

          <div>
            <label className="text-xs" style={{ color: '#9B9B8F' }}>Email</label>
            <input
              type="email"
              value={leadData.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full p-2 rounded border text-sm"
              style={{ borderColor: '#E8E4DD' }}
            />
          </div>

          <div>
            <label className="text-xs" style={{ color: '#9B9B8F' }}>Phone</label>
            <input
              type="tel"
              value={leadData.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full p-2 rounded border text-sm"
              style={{ borderColor: '#E8E4DD' }}
            />
          </div>

          <div>
            <label className="text-xs" style={{ color: '#9B9B8F' }}>Company</label>
            <input
              type="text"
              value={leadData.company || ''}
              onChange={(e) => updateField('company', e.target.value)}
              className="w-full p-2 rounded border text-sm"
              style={{ borderColor: '#E8E4DD' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs" style={{ color: '#9B9B8F' }}>Source</label>
              <select
                value={leadData.source || ''}
                onChange={(e) => updateField('source', e.target.value)}
                className="w-full p-2 rounded border text-sm"
                style={{ borderColor: '#E8E4DD' }}
              >
                <option value="linkedin">LinkedIn</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="cold-call">Cold Call</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs" style={{ color: '#9B9B8F' }}>Status</label>
              <select
                value={leadData.status || ''}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full p-2 rounded border text-sm"
                style={{ borderColor: '#E8E4DD' }}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Non-admin: only status */}
          <div>
            <label className="text-xs" style={{ color: '#9B9B8F' }}>Status</label>
            <select
              value={leadData.status || ''}
              onChange={(e) => updateField('status', e.target.value)}
              className="w-full p-2 rounded border text-sm"
              style={{ borderColor: '#E8E4DD' }}
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </>
      )}

      {/* Both can edit notes */}
      <div>
        <label className="text-xs" style={{ color: '#9B9B8F' }}>Notes</label>
        <textarea
          value={leadData.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          className="w-full p-2 rounded border text-sm"
          style={{ borderColor: '#E8E4DD' }}
          rows={3}
        />
      </div>
    </div>
  );
}