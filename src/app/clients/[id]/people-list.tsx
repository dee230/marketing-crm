'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AddPersonButton } from './add-person';

interface Person {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  notes: string | null;
  isLead?: boolean; // Flag to identify leads
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  personName?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  personName?: string;
}

interface PeopleListProps {
  people: Person[];
  allInvoices: Invoice[];
  allTasks: Task[];
  isAdmin: boolean;
  companyName: string;
}

export function PeopleList({ people, allInvoices, allTasks, isAdmin, companyName }: PeopleListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [peopleData, setPeopleData] = useState<Map<string, Person>>(new Map(people.map(p => [p.id, { ...p }])));
  const [saving, setSaving] = useState(false);

  const updatePerson = (id: string, field: keyof Person, value: string) => {
    const updated = new Map(peopleData);
    const person = updated.get(id);
    if (person) {
      updated.set(id, { ...person, [field]: value });
    }
    setPeopleData(updated);
  };

  const handleSave = async (personId: string) => {
    setSaving(true);
    const person = peopleData.get(personId);
    const original = people.find(p => p.id === personId);
    
    if (person && original && (original.name !== person.name || original.email !== person.email || original.phone !== person.phone || original.status !== person.status)) {
      await fetch(`/api/clients/${personId}`, {
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
    
    setSaving(false);
    setEditingId(null);
    router.refresh();
  };

  const handleCancel = (personId: string) => {
    const original = people.find(p => p.id === personId);
    if (original) {
      const updated = new Map(peopleData);
      updated.set(personId, { ...original });
      setPeopleData(updated);
    }
    setEditingId(null);
  };

  return (
    <div className="card p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium" style={{ color: '#9B9B8F' }}>
          People at Company ({people.length})
        </h3>
        {isAdmin && <AddPersonButton companyName={companyName} />}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {people.map(person => {
          const personInvoices = allInvoices.filter(i => i.personName === person.name);
          const personTasks = allTasks.filter(t => t.personName === person.name);
          const personPending = personInvoices.filter(i => i.status !== 'paid');
          const isEditing = editingId === person.id;
          const personData = peopleData.get(person.id);
          const isLead = (person as any).isLead; // Check if this is a lead

          return (
            <div key={person.id} className="p-4 rounded-lg" style={{ background: '#FDFBF7', border: '1px solid #E8E4DD' }}>
              {isEditing && isAdmin && !isLead ? (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs" style={{ color: '#9B9B8F' }}>Name</label>
                      <input
                        type="text"
                        value={personData?.name || ''}
                        onChange={(e) => updatePerson(person.id, 'name', e.target.value)}
                        className="w-full p-2 rounded border text-sm"
                        style={{ borderColor: '#E8E4DD' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs" style={{ color: '#9B9B8F' }}>Email</label>
                      <input
                        type="email"
                        value={personData?.email || ''}
                        onChange={(e) => updatePerson(person.id, 'email', e.target.value)}
                        className="w-full p-2 rounded border text-sm"
                        style={{ borderColor: '#E8E4DD' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs" style={{ color: '#9B9B8F' }}>Phone</label>
                      <input
                        type="tel"
                        value={personData?.phone || ''}
                        onChange={(e) => updatePerson(person.id, 'phone', e.target.value)}
                        className="w-full p-2 rounded border text-sm"
                        style={{ borderColor: '#E8E4DD' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs" style={{ color: '#9B9B8F' }}>Status</label>
                      <select
                        value={personData?.status || ''}
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
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleCancel(person.id)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: '#9B9B8F', background: '#F5F5F5' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(person.id)}
                      disabled={saving}
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: '#FFFFFF', background: '#E07A5F' }}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: isLead ? '#81B29A' : '#E07A5F' }}>
                      <span className="text-white font-medium">{person.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: '#2D2A26' }}>{person.name}</p>
                      {isLead ? (
                        <span className="badge badge-sent text-xs">Lead</span>
                      ) : (
                        <span className={`badge text-xs ${
                          person.status === 'active' ? 'badge-active' : 'badge-pending'
                        }`}>
                          {person.status}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {person.email && (
                    <p className="text-sm" style={{ color: '#9B9B8F' }}>{person.email}</p>
                  )}
                  {person.phone && (
                    <p className="text-sm" style={{ color: '#9B9B8F' }}>{person.phone}</p>
                  )}
                  
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid #E8E4DD' }}>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#9B9B8F' }}>Pending</span>
                      <span style={{ color: '#E07A5F' }}>KES {personPending.reduce((s, i) => s + i.amount, 0).toLocaleString('en-KE')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#9B9B8F' }}>Tasks</span>
                      <span style={{ color: '#2D2A26' }}>{personTasks.length}</span>
                    </div>
                  </div>
                  
{isAdmin && !isLead && (
                      <button
                        onClick={() => setEditingId(person.id)}
                        className="text-xs mt-2 px-2 py-1 rounded"
                        style={{ color: '#E07A5F', background: 'rgba(224, 122, 95, 0.1)' }}
                      >
                        Edit
                      </button>
                    )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}