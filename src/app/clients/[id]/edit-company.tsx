'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Person {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  notes: string | null;
}

interface EditCompanyFormProps {
  companyName: string;
  people: Person[];
}

export function EditCompanyForm({ companyName, people }: EditCompanyFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [companyNotes, setCompanyNotes] = useState(people[0]?.notes || '');
  const [peopleData, setPeopleData] = useState<Person[]>(people);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    // Save notes to first person (company-level notes)
    if (people.length > 0) {
      await fetch(`/api/clients/${people[0].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: companyNotes }),
      });
    }
    
    // Save each person's data
    for (const person of peopleData) {
      const original = people.find(p => p.id === person.id);
      if (original && (original.name !== person.name || original.email !== person.email || original.phone !== person.phone || original.status !== person.status)) {
        await fetch(`/api/clients/${person.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: person.name,
            email: person.email,
            phone: person.phone,
            status: person.status,
          }),
        });
      }
    }
    
    setSaving(false);
    setIsEditing(false);
    router.refresh();
  };

  const updatePerson = (id: string, field: keyof Person, value: string) => {
    setPeopleData(peopleData.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="mt-6">
      {/* Edit Toggle */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium" style={{ color: '#9B9B8F' }}>People at {companyName}</h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm px-3 py-1 rounded-lg"
            style={{ color: '#E07A5F', background: 'rgba(224, 122, 95, 0.1)' }}
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setPeopleData(people);
              }}
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
        )}
      </div>

      {/* Company Notes */}
      {isEditing && (
        <div className="card p-4 mb-4">
          <label className="text-sm font-medium block mb-2" style={{ color: '#9B9B8F' }}>
            Company Notes
          </label>
          <textarea
            value={companyNotes}
            onChange={(e) => setCompanyNotes(e.target.value)}
            className="w-full p-3 rounded-lg border"
            style={{ borderColor: '#E8E4DD', background: '#FFFFFF' }}
            rows={3}
          />
        </div>
      )}

      {/* People */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {peopleData.map((person, idx) => (
          <div key={person.id} className="p-4 rounded-lg" style={{ background: '#FDFBF7', border: '1px solid #E8E4DD' }}>
            {isEditing ? (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs" style={{ color: '#9B9B8F' }}>Name</label>
                    <input
                      type="text"
                      value={person.name}
                      onChange={(e) => updatePerson(person.id, 'name', e.target.value)}
                      className="w-full p-2 rounded border text-sm"
                      style={{ borderColor: '#E8E4DD' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs" style={{ color: '#9B9B8F' }}>Email</label>
                    <input
                      type="email"
                      value={person.email || ''}
                      onChange={(e) => updatePerson(person.id, 'email', e.target.value)}
                      className="w-full p-2 rounded border text-sm"
                      style={{ borderColor: '#E8E4DD' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs" style={{ color: '#9B9B8F' }}>Phone</label>
                    <input
                      type="tel"
                      value={person.phone || ''}
                      onChange={(e) => updatePerson(person.id, 'phone', e.target.value)}
                      className="w-full p-2 rounded border text-sm"
                      style={{ borderColor: '#E8E4DD' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs" style={{ color: '#9B9B8F' }}>Status</label>
                    <select
                      value={person.status}
                      onChange={(e) => updatePerson(person.id, 'status', e.target.value)}
                      className="w-full p-2 rounded border text-sm"
                      style={{ borderColor: '#E8E4DD' }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="prospect">Prospect</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#E07A5F' }}>
                    <span className="text-white font-medium">{person.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#2D2A26' }}>{person.name}</p>
                    <span className={`badge text-xs ${
                      person.status === 'active' ? 'badge-active' : 'badge-pending'
                    }`}>
                      {person.status}
                    </span>
                  </div>
                </div>
                
                {person.email && (
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>{person.email}</p>
                )}
                {person.phone && (
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>{person.phone}</p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}