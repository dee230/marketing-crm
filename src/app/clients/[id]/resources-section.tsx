'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ClientResources {
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  otherLinks: string | null;
}

interface ResourceImage {
  id: string;
  canvaDesignId: string;
  thumbnailUrl: string | null;
  title: string | null;
}

interface ResourcesSectionProps {
  companyName: string;
  resources: ClientResources;
  personId: string;
  resourceImage: ResourceImage | null;
  isAdmin: boolean;
}

interface OtherLink {
  title: string;
  url: string;
}

interface CanvaDesign {
  id: string;
  canva_design_id: string;
  title: string | null;
  thumbnail_url: string | null;
  design_url: string | null;
}

export function ResourcesSection({ companyName, resources, personId, resourceImage, isAdmin }: ResourcesSectionProps) {
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

  // Canva image picker state
  const [showPicker, setShowPicker] = useState(false);
  const [designs, setDesigns] = useState<CanvaDesign[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(resourceImage?.id || null);

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

  const fetchDesigns = async () => {
    setLoadingDesigns(true);
    try {
      const res = await fetch('/api/canva/webhook');
      const data = await res.json();
      setDesigns(data.designs || []);
    } catch (err) {
      console.error('Failed to fetch Canva designs:', err);
    }
    setLoadingDesigns(false);
  };

  const openPicker = () => {
    setShowPicker(true);
    setSelectedDesignId(resourceImage?.id || null);
    fetchDesigns();
  };

  const closePicker = () => {
    setShowPicker(false);
    setSelectedDesignId(resourceImage?.id || null);
  };

  const selectDesign = (designId: string) => {
    setSelectedDesignId(designId === selectedDesignId ? null : designId);
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/clients/${personId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...resourcesData,
        otherLinks: JSON.stringify(otherLinks),
        resourceImageId: selectedDesignId || null,
      }),
    });
    setSaving(false);
    setIsEditing(false);
    setShowPicker(false);
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
    setSelectedDesignId(resourceImage?.id || null);
    setIsEditing(false);
    setShowPicker(false);
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
          {/* --- Canva Image Picker --- */}
          <div>
            <label className="text-xs block mb-1" style={{ color: '#9B9B8F' }}>Canva Design Image</label>
            {selectedDesignId ? (
              <div className="relative rounded-lg overflow-hidden border mb-2" style={{ borderColor: '#E8E4DD', maxWidth: '320px' }}>
                <img
                  src={designs.find(d => d.id === selectedDesignId)?.thumbnail_url || 
                       resourceImage?.thumbnailUrl || ''}
                  alt="Selected design"
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="p-2 text-xs" style={{ background: '#F5F5F5', color: '#2D2A26' }}>
                  {designs.find(d => d.id === selectedDesignId)?.title || resourceImage?.title || 'Selected design'}
                </div>
              </div>
            ) : (
              <div
                className="rounded-lg border-2 border-dashed flex items-center justify-center mb-2"
                style={{ borderColor: '#E8E4DD', maxWidth: '320px', height: '100px' }}
              >
                <p className="text-xs" style={{ color: '#9B9B8F' }}>No image assigned</p>
              </div>
            )}
            <button
              onClick={openPicker}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: '#E07A5F', background: 'rgba(224, 122, 95, 0.1)' }}
            >
              {selectedDesignId ? 'Change Image' : 'Select Canva Image'}
            </button>
            {selectedDesignId && (
              <button
                onClick={() => setSelectedDesignId(null)}
                className="text-xs px-3 py-1.5 rounded-lg ml-2"
                style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}
              >
                Remove
              </button>
            )}
          </div>

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
          {/* Show assigned Canva image */}
          {resourceImage && (
            <div className="rounded-lg overflow-hidden border" style={{ borderColor: '#E8E4DD', maxWidth: '320px' }}>
              <img
                src={resourceImage.thumbnailUrl || '/placeholder.svg'}
                alt={resourceImage.title || 'Assigned design'}
                className="w-full h-40 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {resourceImage.title && (
                <div className="px-3 py-2 text-xs" style={{ background: '#F5F5F5', color: '#9B9B8F' }}>
                  {resourceImage.title}
                </div>
              )}
            </div>
          )}

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

          {!resourceImage && !resourcesData.website && !resourcesData.linkedin && !resourcesData.twitter && !resourcesData.instagram && otherLinks.length === 0 && (
            <p className="text-sm" style={{ color: '#9B9B8F' }}>
              No resources added yet. Click "Edit Resources" to add links.
            </p>
          )}
        </div>
      )}

      {/* --- Canva Design Picker Modal --- */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={closePicker}
        >
          <div
            className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#E8E4DD' }}>
              <h3 className="font-semibold" style={{ color: '#2D2A26' }}>Select Canva Design</h3>
              <button
                onClick={closePicker}
                className="p-1 rounded hover:bg-gray-100"
              >
                <svg className="w-5 h-5" style={{ color: '#9B9B8F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingDesigns ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="animate-spin h-6 w-6" style={{ color: '#E07A5F' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : designs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>No Canva designs available.</p>
                  <p className="text-xs mt-1" style={{ color: '#9B9B8F' }}>
                    Sync designs from the Canva page first.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {designs.map((design) => {
                    const isSelected = selectedDesignId === design.id;
                    return (
                      <button
                        key={design.id}
                        onClick={() => selectDesign(design.id)}
                        className={`rounded-lg overflow-hidden border-2 text-left transition-all ${
                          isSelected ? 'border-[#E07A5F]' : 'border-transparent hover:border-gray-300'
                        }`}
                        style={isSelected ? { boxShadow: '0 0 0 2px rgba(224, 122, 95, 0.3)' } : {}}
                      >
                        <div className="aspect-[4/3] relative" style={{ background: '#F5F5F5' }}>
                          {design.thumbnail_url ? (
                            <img
                              src={design.thumbnail_url}
                              alt={design.title || 'Design'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                                const parent = (e.target as HTMLImageElement).parentElement!;
                                if (!parent.querySelector('[data-placeholder]')) {
                                  const placeholder = document.createElement('span');
                                  placeholder.setAttribute('data-placeholder', '');
                                  placeholder.textContent = '🎨';
                                  placeholder.className = 'text-3xl';
                                  parent.appendChild(placeholder);
                                }
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-3xl">🎨</span>
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#E07A5F' }}>
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs truncate" style={{ color: '#2D2A26' }}>
                            {design.title || 'Untitled'}
                          </p>
                          <p className="text-xs" style={{ color: '#9B9B8F' }}>
                            {design.canva_design_id?.slice(0, 12)}...
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: '#E8E4DD' }}>
              <p className="text-xs" style={{ color: '#9B9B8F' }}>
                {selectedDesignId ? '1 design selected' : 'No design selected'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={closePicker}
                  className="text-sm px-4 py-2 rounded-lg"
                  style={{ color: '#9B9B8F', background: '#F5F5F5' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowPicker(false)}
                  className="text-sm px-4 py-2 rounded-lg"
                  style={{ color: '#FFFFFF', background: '#E07A5F' }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
