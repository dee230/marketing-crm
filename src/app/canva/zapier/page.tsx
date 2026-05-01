'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ZapierSetupContent() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  const webhookUrl = 'https://marketing-crm-ebon.vercel.app/api/canva/webhook';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/canva" className="text-sm mb-4 inline-block" style={{ color: '#E07A5F' }}>
            ← Back to Canva
          </Link>

          <h1 className="text-2xl font-bold mb-6" style={{ color: '#2D2A26' }}>
            Zapier Integration Setup
          </h1>

          <div className="bg-white rounded-lg p-6 border mb-6" style={{ borderColor: '#E8E4DD' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2D2A26' }}>
              Step 1: Your Webhook URL
            </h2>
            <p className="mb-3" style={{ color: '#666' }}>
              Copy this URL - you'll need it for Zapier:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded bg-gray-100 text-sm break-all">
                {webhookUrl}
              </code>
              <button
                onClick={() => copyToClipboard(webhookUrl)}
                className="px-3 py-2 rounded text-sm whitespace-nowrap"
                style={{ background: '#00C4CC', color: '#fff' }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border mb-6" style={{ borderColor: '#E8E4DD' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2D2A26' }}>
              Step 2: Create Zap in Zapier
            </h2>
            <ol className="list-decimal list-inside space-y-3" style={{ color: '#666' }}>
              <li>Go to <a href="https://zapier.com/app" target="_blank" rel="noopener" className="underline" style={{ color: '#00C4CC' }}>zapier.com</a> and sign in</li>
              <li>Click <strong>"Create Zap"</strong></li>
              <li><strong>Trigger:</strong> Search "Canva" → Select "Watch New Design" or "Watch Folder"</li>
              <li>Connect your Canva account (sign in to Canva Pro)</li>
              <li>Select the folder to watch</li>
            </ol>
          </div>

          <div className="bg-white rounded-lg p-6 border mb-6" style={{ borderColor: '#E8E4DD' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2D2A26' }}>
              Step 3: Set Up Webhook Action
            </h2>
            <ol className="list-decimal list-inside space-y-3" style={{ color: '#666' }}>
              <li><strong>Action:</strong> Search "Webhooks" → Select "POST"</li>
              <li><strong>URL:</strong> Paste the webhook URL from Step 1</li>
              <li><strong>Payload Type:</strong> Select "JSON"</li>
              <li><strong>Data:</strong> Enter this JSON:</li>
            </ol>
            <pre className="mt-3 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
{`{
  "designId": "{{designId}}",
  "designName": "{{designName}}",
  "designUrl": "{{designUrl}}",
  "thumbnailUrl": "{{thumbnailUrl}}",
  "exportUrl": "{{exportUrl}}"
}`}
            </pre>
          </div>

          <div className="bg-white rounded-lg p-6 border mb-6" style={{ borderColor: '#E8E4DD' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2D2A26' }}>
              Step 4: Test & Activate
            </h2>
            <ol className="list-decimal list-inside space-y-3" style={{ color: '#666' }}>
              <li>Click <strong>"Test & Review"</strong> - you should see <code style={{ color: '#10b981' }}>success: true</code></li>
              <li>Click <strong>"Turn On Zap"</strong></li>
            </ol>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border" style={{ borderColor: '#10b981' }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#10b981' }}>
              ✓ Done!
            </h2>
            <p style={{ color: '#666' }}>
              Now when you create designs in Canva, Zapier will automatically sync them to your CRM. 
              Designs will appear on the Canva page!
            </p>
          </div>

          <div className="mt-6">
            <Link 
              href="/canva" 
              className="inline-block px-4 py-2 rounded"
              style={{ background: '#00C4CC', color: '#fff' }}
            >
              Go to Canva Page →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ZapierSetupPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ZapierSetupContent />
    </Suspense>
  );
}