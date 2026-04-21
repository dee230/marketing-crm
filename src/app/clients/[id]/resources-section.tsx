'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ClientResources {
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  otherLinks: string | null;
}

interface ResourcesSectionProps {
  companyName: string;
  resources: ClientResources;
  personId: string;
  isAdmin: boolean;
}

interface OtherLink {
  title: string;
  url: string;
}

export function ResourcesSection({ companyName, resources, personId, isAdmin }: ResourcesSectionProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [resourcesData, setResourcesData] = useState<ClientResources>(resources);
  const [otherLinks, setOtherLinks] = useState<OtherLink[]>(() => {
    if (resources.otherLinks) {
      try {
        return JSON.parse(resources.otherLinks);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const updateField = (field: keyof ClientResources, value: string) => {
    setResourcesData({ ...resourcesData, [field]: value || null });
  };

  const addOtherLink = () => {
    if (newLinkTitle && newLinkUrl) {
      setOtherLinks([...otherLinks, { title: newLinkTitle, url: newLinkUrl }]);
      setNewLinkTitle('');
      setNewLinkUrl('');
    }
  };

  const removeOtherLink = (index: number) => {
    setOtherLinks(otherLinks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/clients/${personId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...resourcesData,
        otherLinks: JSON.stringify(otherLinks),
      }),
    });
    setSaving(false);
    setIsEditing(false);
    router.refresh();
  };

  const handleCancel = () => {
    setResourcesData(resources);
    setOtherLinks(() => {
      if (resources.otherLinks) {
        try {
          return JSON.parse(resources.otherLinks);
        } catch {
          return [];
        }
      }
      return [];
    });
    setIsEditing(false);
  };

  const socialPlatforms = [
    { key: 'linkedin' as const, label: 'LinkedIn', icon: 'in' },
    { key: 'twitter' as const, label: 'Twitter/X', icon: 'x' },
    { key: 'instagram' as const, label: 'Instagram', icon: 'ig' },
  ];

  return (
    <div className="card p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium" style={{ color: '#9B9B8F' }}>
          Resources for {companyName}
        </h3>
        {isAdmin && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm px-3 py-1 rounded-lg"
            style={{ color: '#E07A5F', background: 'rgba(224, 122, 95, 0.1)' }}
          >
            Edit Resources
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Website */}
          <div>
            <label className="text-xs block mb-1" style={{ color: '#9B9B8F' }}>Website</label>
            <input
              type="url"
              value={resourcesData.website || ''}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="https://example.com"
              className="w-full p-2 rounded border text-sm"
              style={{ borderColor: '#E8E4DD' }}
            />
          </div>

          {/* Social Media */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {socialPlatforms.map(platform => (
              <div key={platform.key}>
                <label className="text-xs block mb-1" style={{ color: '#9B9B8F' }}>{platform.label}</label>
                <input
                  type="url"
                  value={resourcesData[platform.key] || ''}
                  onChange={(e) => updateField(platform.key, e.target.value)}
                  placeholder={`https://${platform.key}.com/...`}
                  className="w-full p-2 rounded border text-sm"
                  style={{ borderColor: '#E8E4DD' }}
                />
              </div>
            ))}
          </div>

          {/* Other Links */}
          <div>
            <label className="text-xs block mb-2" style={{ color: '#9B9B8F' }}>Additional Links</label>
            {otherLinks.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={link.title}
                  onChange={(e) => {
                    const updated = [...otherLinks];
                    updated[idx].title = e.target.value;
                    setOtherLinks(updated);
                  }}
                  placeholder="Link title"
                  className="flex-1 p-2 rounded border text-sm"
                  style={{ borderColor: '#E8E4DD' }}
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => {
                    const updated = [...otherLinks];
                    updated[idx].url = e.target.value;
                    setOtherLinks(updated);
                  }}
                  placeholder="https://..."
                  className="flex-1 p-2 rounded border text-sm"
                  style={{ borderColor: '#E8E4DD' }}
                />
                <button
                  onClick={() => removeOtherLink(idx)}
                  className="p-2 rounded text-red-500 hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                placeholder="Link title"
                className="flex-1 p-2 rounded border text-sm"
                style={{ borderColor: '#E8E4DD' }}
              />
              <input
                type="url"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 p-2 rounded border text-sm"
                style={{ borderColor: '#E8E4DD' }}
              />
              <button
                onClick={addOtherLink}
                disabled={!newLinkTitle || !newLinkUrl}
                className="p-2 rounded text-sm"
                style={{ color: '#E07A5F', background: 'rgba(224, 122, 95, 0.1)' }}
              >
                + Add
              </button>
            </div>
          </div>

          {/* Save/Cancel */}
          <div className="flex gap-2 pt-2">
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
              {saving ? 'Saving...' : 'Save Resources'}
            </button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-3">
          {resourcesData.website && (
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" style={{ color: '#9B9B8F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9v1m0-1V3m0 1v10m0-10l-4-4m4 4l4-4" />
              </svg>
              <a href={resourcesData.website} target="_blank" rel="noopener noreferrer" style={{ color: '#E07A5F' }}>
                {resourcesData.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          {socialPlatforms.map(platform => (
            resourcesData[platform.key] && (
              <div key={platform.key} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#E07A5F', color: '#FFFFFF' }}>
                  {platform.icon}
                </div>
                <a href={resourcesData[platform.key]!} target="_blank" rel="noopener noreferrer" style={{ color: '#E07A5F' }}>
                  {resourcesData[platform.key]!.replace(/^https?:\/\//, '').replace(/^(www\.)?/, '')}
                </a>
              </div>
            )
          ))}

          {otherLinks.length > 0 && (
            <div className="pt-2" style={{ borderTop: '1px solid #E8E4DD' }}>
              <p className="text-xs mb-2" style={{ color: '#9B9B8F' }}>Additional Links</p>
              {otherLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <svg className="w-4 h-4" style={{ color: '#9B9B8F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#E07A5F' }}>
                    {link.title}
                  </a>
                </div>
              ))}
            </div>
          )}

          {!resourcesData.website && !resourcesData.linkedin && !resourcesData.twitter && !resourcesData.instagram && otherLinks.length === 0 && (
            <p className="text-sm" style={{ color: '#9B9B8F' }}>
              No resources added yet. Click "Edit Resources" to add links.
            </p>
          )}
        </div>
      )}
    </div>
  );
}