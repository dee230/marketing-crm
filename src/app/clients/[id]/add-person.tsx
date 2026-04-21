'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddPersonProps {
  companyName: string;
}

export function AddPersonButton({ companyName }: AddPersonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    setSaving(true);
    
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          company: companyName,
        }),
      });
      
      if (res.ok) {
        setFormData({ name: '', email: '', phone: '', status: 'active' });
        setIsOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Error adding person:', error);
    }
    
    setSaving(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm px-3 py-2 rounded-lg inline-flex items-center"
        style={{ color: '#E07A5F', background: 'rgba(224, 122, 95, 0.1)' }}
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Person
      </button>
    );
  }

  return (
    <div className="p-4 rounded-lg" style={{ background: '#FDFBF7', border: '1px solid #E8E4DD' }}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium" style={{ color: '#9B9B8F' }}>
          Add New Person
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-sm"
          style={{ color: '#9B9B8F' }}
        >
          ✕
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs block mb-1" style={{ color: '#9B9B8F' }}>Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full p-2 rounded border text-sm"
            style={{ borderColor: '#E8E4DD' }}
            placeholder="John Smith"
          />
        </div>
        
        <div>
          <label className="text-xs block mb-1" style={{ color: '#9B9B8F' }}>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-2 rounded border text-sm"
            style={{ borderColor: '#E8E4DD' }}
            placeholder="john@company.com"
          />
        </div>
        
        <div>
          <label className="text-xs block mb-1" style={{ color: '#9B9B8F' }}>Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full p-2 rounded border text-sm"
            style={{ borderColor: '#E8E4DD' }}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        
        <div>
          <label className="text-xs block mb-1" style={{ color: '#9B9B8F' }}>Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full p-2 rounded border text-sm"
            style={{ borderColor: '#E8E4DD' }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
          </select>
        </div>
        
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 text-sm px-3 py-2 rounded-lg"
            style={{ color: '#9B9B8F', background: '#F5F5F5' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !formData.name}
            className="flex-1 text-sm px-3 py-2 rounded-lg"
            style={{ color: '#FFFFFF', background: '#E07A5F' }}
          >
            {saving ? 'Adding...' : 'Add Person'}
          </button>
        </div>
      </form>
    </div>
  );
}