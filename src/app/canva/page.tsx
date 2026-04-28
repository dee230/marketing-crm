'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Design {
  id: string;
  title: string;
  thumbnail?: {
    url: string;
    width: number;
    height: number;
  };
  urls?: {
    edit_url: string;
    view_url: string;
  };
  page_count: number;
  updated_at: number;
}

interface Integration {
  status: string;
  access_token_expires_at?: string;
}

function CanvaPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDesignTitle, setNewDesignTitle] = useState('');
  const [newDesignType, setNewDesignType] = useState('poster');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportStatus, setExportStatus] = useState<Record<string, string>>({});

  const success = searchParams.get('success');
  const error = searchParams.get('error');

  useEffect(() => {
    fetchIntegration();
  }, []);

  const fetchIntegration = async () => {
    try {
      const res = await fetch('/api/integrations?action=status');
      const data = await res.json();
      setIntegration(data.canva);
      if (data.canva?.status === 'connected') {
        fetchDesigns();
      }
    } catch (err) {
      console.error('Failed to fetch integration:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesigns = async () => {
    try {
      const res = await fetch('/api/canva/designs');
      const data = await res.json();
      if (data.designs) {
        setDesigns(data.designs);
      }
    } catch (err) {
      console.error('Failed to fetch designs:', err);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/integrations?action=connect&provider=canva');
      const data = await res.json();
      if (data.authUrl) {
        // Store codeVerifier in localStorage for callback
        if (data.codeVerifier) {
          localStorage.setItem('canva_code_verifier', data.codeVerifier);
        }
        window.location.href = data.authUrl;
      } else {
        alert('Failed to get authorization URL');
      }
    } catch (err) {
      console.error('Failed to connect:', err);
      alert('Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Canva?')) return;
    
    setConnecting(true);
    try {
      const res = await fetch('/api/integrations?provider=canva', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setIntegration(null);
        setDesigns([]);
        router.push('/canva');
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleCreateDesign = () => {
    // Open Canva directly - no API call needed
    window.open('https://www.canva.com/design', '_blank');
    setShowCreateModal(false);
    setNewDesignTitle('');
  };

  const handleExport = async () => {
    if (!selectedDesign) return;
    
    setExporting(selectedDesign.id);
    try {
      const res = await fetch('/api/canva/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId: selectedDesign.id,
          format: exportFormat,
        }),
      });
      const data = await res.json();
      if (data.exportId) {
        // Poll for completion
        setExportStatus(prev => ({ ...prev, [selectedDesign.id]: 'processing' }));
        pollExportStatus(data.exportId, selectedDesign.id);
      } else {
        alert('Failed to start export: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to export:', err);
    } finally {
      setExporting(null);
    }
  };

  const pollExportStatus = async (exportId: string, designId: string) => {
    const maxAttempts = 30;
    let attempts = 0;
    
    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/canva/export?exportId=${exportId}`);
        const data = await res.json();
        
        if (data.status === 'success') {
          setExportStatus(prev => ({ ...prev, [designId]: 'done' }));
          // Get the download URL
          if (data.urls?.[0]) {
            window.open(data.urls[0], '_blank');
          }
        } else if (data.status === 'failed') {
          setExportStatus(prev => ({ ...prev, [designId]: 'failed' }));
          alert('Export failed');
        } else if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setExportStatus(prev => ({ ...prev, [designId]: 'timeout' }));
        }
      } catch (err) {
        console.error('Export status error:', err);
      }
    };
    
    setTimeout(poll, 2000);
  };

  const handleSearch = async () => {
    try {
      const res = await fetch(`/api/canva/designs${searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : ''}`);
      const data = await res.json();
      if (data.designs) {
        setDesigns(data.designs);
      }
    } catch (err) {
      console.error('Failed to search designs:', err);
    }
  };

  const openInCanva = (design: Design) => {
    if (design.urls?.edit_url) {
      window.open(design.urls.edit_url, '_blank');
    } else if (design.urls?.view_url) {
      window.open(design.urls.view_url, '_blank');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: '#00C4CC' }}></div>
          <p style={{ color: '#9B9B8F' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      {/* Success/Error Messages */}
      {success && (
        <div className="m-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
          Successfully connected to Canva!
        </div>
      )}
      {error && (
        <div className="m-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          Error: {error}
        </div>
      )}

      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm" style={{ color: '#E07A5F' }}>
                ← Back to Dashboard
              </Link>
            </div>
            {integration?.status === 'connected' && (
              <button
                onClick={handleDisconnect}
                disabled={connecting}
                className="text-sm px-4 py-2 rounded"
                style={{ color: '#dc2626', border: '1px solid #dc2626' }}
              >
                {connecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            )}
          </div>

          {/* Not Connected State */}
          {!integration?.status ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: '#00C4CC' }}>
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: '#2D2A26' }}>
                Connect to Canva
              </h1>
              <p className="mb-6" style={{ color: '#9B9B8F' }}>
                Connect your Canva account to design, edit, and export designs directly from your CRM.
              </p>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-6 py-3 rounded-lg font-medium"
                style={{ background: '#00C4CC', color: '#fff' }}
              >
                {connecting ? 'Connecting...' : 'Connect Canva'}
              </button>
            </div>
          ) : (
            /* Connected - Design Gallery */
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>
                  My Designs
                </h1>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                    style={{ background: '#00C4CC', color: '#fff' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Design
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search designs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full px-4 py-2 pl-10 rounded-lg border"
                    style={{ borderColor: '#E8E4DD', background: '#fff' }}
                  />
                  <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9B9B8F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 rounded-lg"
                  style={{ border: '1px solid #E8E4DD', background: '#fff' }}
                >
                  Search
                </button>
                <button
                  onClick={fetchDesigns}
                  className="px-4 py-2 rounded-lg"
                  style={{ border: '1px solid #E8E4DD', background: '#fff' }}
                >
                  Refresh
                </button>
              </div>

              {/* Design Grid */}
              {designs.length === 0 ? (
                <div className="text-center py-16" style={{ color: '#9B9B8F' }}>
                  No designs found. Create your first design!
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {designs.map((design) => (
                    <div
                      key={design.id}
                      className="rounded-lg border overflow-hidden cursor-pointer transition hover:shadow-md"
                      style={{ borderColor: '#E8E4DD', background: '#fff' }}
                      onClick={() => openInCanva(design)}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video relative" style={{ background: '#f5f5f5' }}>
                        {design.thumbnail?.url ? (
                          <img
                            src={design.thumbnail.url}
                            alt={design.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <svg className="w-12 h-12" style={{ color: '#9B9B8F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {/* Page count badge */}
                        {design.page_count > 1 && (
                          <span className="absolute top-2 right-2 px-2 py-1 text-xs rounded" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                            {design.page_count} pages
                          </span>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="p-3">
                        <h3 className="font-medium truncate text-sm" style={{ color: '#2D2A26' }}>
                          {design.title || 'Untitled'}
                        </h3>
                        <p className="text-xs" style={{ color: '#9B9B8F' }}>
                          {formatDate(design.updated_at)}
                        </p>
                        
                        {/* Actions */}
                        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openInCanva(design)}
                            className="flex-1 px-2 py-1 text-xs rounded"
                            style={{ background: '#00C4CC', color: '#fff' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDesign(design);
                              setShowExportModal(true);
                            }}
                            disabled={exporting === design.id || exporting === selectedDesign?.id}
                            className="flex-1 px-2 py-1 text-xs rounded"
                            style={{ border: '1px solid #E8E4DD' }}
                          >
                            {exporting === design.id ? '...' : 'Export'}
                          </button>
                        </div>
                        
                        {/* Export Status */}
                        {exportStatus[design.id] && (
                          <p className="text-xs mt-2" style={{ 
                            color: exportStatus[design.id] === 'done' ? '#10b981' : 
                                   exportStatus[design.id] === 'failed' ? '#ef4444' : '#9B9B8F' 
                          }}>
                            {exportStatus[design.id] === 'done' && '✓ Exported!'}
                            {exportStatus[design.id] === 'processing' && 'Exporting...'}
                            {exportStatus[design.id] === 'failed' && 'Export failed'}
                            {exportStatus[design.id] === 'timeout' && 'Export timed out'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Design Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#2D2A26' }}>
              Create New Design
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: '#2D2A26' }}>
                Design Title (optional)
              </label>
              <input
                type="text"
                value={newDesignTitle}
                onChange={(e) => setNewDesignTitle(e.target.value)}
                placeholder="My Awesome Design"
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: '#E8E4DD' }}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1" style={{ color: '#2D2A26' }}>
                Design Type
              </label>
              <select
                value={newDesignType}
                onChange={(e) => setNewDesignType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: '#E8E4DD' }}
              >
                <option value="poster">Poster</option>
                <option value="presentation">Presentation</option>
                <option value="social_media">Social Media</option>
                <option value="doc">Document</option>
                <option value="video">Video</option>
                <option value="print">Print</option>
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg"
                style={{ border: '1px solid #E8E4DD' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDesign}
                className="flex-1 px-4 py-2 rounded-lg font-medium"
                style={{ background: '#00C4CC', color: '#fff' }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && selectedDesign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#2D2A26' }}>
              Export: {selectedDesign.title}
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: '#2D2A26' }}>
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ borderColor: '#E8E4DD' }}
              >
                <option value="pdf">PDF</option>
                <option value="png">PNG</option>
                <option value="jpg">JPEG</option>
              </select>
            </div>
            
            <p className="text-sm mb-6" style={{ color: '#9B9B8F' }}>
              The exported file will open in a new tab. PDF exports work best for documents.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setSelectedDesign(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg"
                style={{ border: '1px solid #E8E4DD' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex-1 px-4 py-2 rounded-lg font-medium"
                style={{ background: '#00C4CC', color: '#fff' }}
              >
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CanvaPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <CanvaPageContent />
    </Suspense>
  );
}