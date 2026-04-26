'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Integration {
  provider: string;
  status: string;
  companyName?: string;
  pageName?: string;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [integrations, setIntegrations] = useState<{ linkedin: any; facebook: any; canva: any }>({
    linkedin: null,
    facebook: null,
    canva: null,
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const success = searchParams.get('success');
  const error = searchParams.get('error');

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations?action=status');
      const data = await res.json();
      setIntegrations(data);
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    setConnecting(provider);
    try {
      const res = await fetch(`/api/integrations?action=connect&provider=${provider}`);
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert('Failed to get authorization URL');
      }
    } catch (err) {
      console.error('Failed to connect:', err);
      alert('Failed to connect');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return;
    
    setConnecting(provider);
    try {
      const res = await fetch(`/api/integrations?provider=${provider}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchIntegrations();
      } else {
        alert('Failed to disconnect');
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
      alert('Failed to disconnect');
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>
              Settings
            </h1>
            <Link href="/dashboard" className="text-sm" style={{ color: '#E07A5F' }}>
              ← Back to Dashboard
            </Link>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
              Successfully connected to {success}!
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              Failed to connect: {error.replace(/_/g, ' ')}
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#2D2A26' }}>
              Integrations
            </h2>
            <p className="text-sm mb-6" style={{ color: '#9B9B8F' }}>
              Connect your marketing accounts to post content directly from the CRM.
            </p>

            {loading ? (
              <p style={{ color: '#9B9B8F' }}>Loading...</p>
            ) : (
              <div className="space-y-4">
                {/* LinkedIn */}
                <div className="p-4 rounded-lg border" style={{ borderColor: '#E8E4DD' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#0077B5' }}>
                        <span className="text-white font-bold">in</span>
                      </div>
                      <div>
                        <h3 className="font-medium" style={{ color: '#2D2A26' }}>LinkedIn</h3>
                        <p className="text-sm" style={{ color: '#9B9B8F' }}>
                          {integrations.linkedin?.status === 'connected'
                            ? `Connected as ${integrations.linkedin.companyName || 'Company'}`
                            : 'Post to your LinkedIn page'}
                        </p>
                      </div>
                    </div>
                    {integrations.linkedin?.status === 'connected' ? (
                      <button
                        onClick={() => handleDisconnect('linkedin')}
                        disabled={connecting === 'linkedin'}
                        className="text-sm px-3 py-1 rounded"
                        style={{ color: '#dc2626', border: '1px solid #dc2626' }}
                      >
                        {connecting === 'linkedin' ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect('linkedin')}
                        disabled={connecting === 'linkedin'}
                        className="text-sm px-3 py-1 rounded"
                        style={{ background: '#0077B5', color: '#fff' }}
                      >
                        {connecting === 'linkedin' ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Facebook */}
                <div className="p-4 rounded-lg border" style={{ borderColor: '#E8E4DD' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#1877F2' }}>
                        <span className="text-white font-bold">f</span>
                      </div>
                      <div>
                        <h3 className="font-medium" style={{ color: '#2D2A26' }}>Facebook</h3>
                        <p className="text-sm" style={{ color: '#9B9B8F' }}>
                          {integrations.facebook?.status === 'connected'
                            ? `Connected to ${integrations.facebook.pageName || 'Page'}`
                            : 'Post to your Facebook Page'}
                        </p>
                      </div>
                    </div>
                    {integrations.facebook?.status === 'connected' ? (
                      <button
                        onClick={() => handleDisconnect('facebook')}
                        disabled={connecting === 'facebook'}
                        className="text-sm px-3 py-1 rounded"
                        style={{ color: '#dc2626', border: '1px solid #dc2626' }}
                      >
                        {connecting === 'facebook' ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect('facebook')}
                        disabled={connecting === 'facebook'}
                        className="text-sm px-3 py-1 rounded"
                        style={{ background: '#1877F2', color: '#fff' }}
                      >
                        {connecting === 'facebook' ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Canva */}
                <div className="p-4 rounded-lg border" style={{ borderColor: '#E8E4DD' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#00C4CC' }}>
                        <span className="text-white font-bold">C</span>
                      </div>
                      <div>
                        <h3 className="font-medium" style={{ color: '#2D2A26' }}>Canva</h3>
                        <p className="text-sm" style={{ color: '#9B9B8F' }}>
                          {integrations.canva?.status === 'connected'
                            ? 'Connected - Export designs'
                            : 'Export designs from Canva'}
                        </p>
                      </div>
                    </div>
                    {integrations.canva?.status === 'connected' ? (
                      <button
                        onClick={() => handleDisconnect('canva')}
                        disabled={connecting === 'canva'}
                        className="text-sm px-3 py-1 rounded"
                        style={{ color: '#dc2626', border: '1px solid #dc2626' }}
                      >
                        {connecting === 'canva' ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect('canva')}
                        disabled={connecting === 'canva'}
                        className="text-sm px-3 py-1 rounded"
                        style={{ background: '#00C4CC', color: '#fff' }}
                      >
                        {connecting === 'canva' ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}