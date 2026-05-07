'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function MakeSetupContent() {
  const [copied, setCopied] = useState(false);

  const webhookUrl = 'https://marketing-crm-ebon.vercel.app/api/canva/webhook';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to render Make.com variable syntax
  const makeVar = (module: number, field: string) => {
    return `{${'{{'}${module}.${field}${'}}'}}`;
  };

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/canva" className="text-sm mb-4 inline-block" style={{ color: '#E07A5F' }}>
            ← Back to Canva
          </Link>

          <h1 className="text-2xl font-bold mb-6" style={{ color: '#2D2A26' }}>
            Make.com Integration Setup
          </h1>

          <div className="bg-white rounded-lg p-6 border mb-6" style={{ borderColor: '#E8E4DD' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2D2A26' }}>
              Step 1: Your Webhook URL
            </h2>
            <p className="mb-3" style={{ color: '#666' }}>
              Copy this URL - you'll need it for Make:
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
              Step 2: Create Scenario in Make
            </h2>
            <ol className="list-decimal list-inside space-y-3" style={{ color: '#666' }}>
              <li>Go to <a href="https://make.com" target="_blank" rel="noopener" className="underline" style={{ color: '#00C4CC' }}>make.com</a> and sign in</li>
              <li>Click <strong>"Create a new Scenario"</strong></li>
              <li>Search for <strong>"Canva"</strong> and add the module</li>
            </ol>
          </div>

          <div className="bg-white rounded-lg p-6 border mb-6" style={{ borderColor: '#E8E4DD' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2D2A26' }}>
              Step 3: Configure Canva Trigger
            </h2>
            <ol className="list-decimal list-inside space-y-3" style={{ color: '#666' }}>
              <li>Select trigger: <strong>"Watch Designs"</strong> or <strong>"Watch Folder"</strong></li>
              <li>Connect your Canva account (sign in with Canva Pro)</li>
              <li>Select the folder to watch</li>
              <li>Set how often to check (e.g., every 15 minutes)</li>
            </ol>
          </div>

          <div className="bg-white rounded-lg p-6 border mb-6" style={{ borderColor: '#E8E4DD' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2D2A26' }}>
              Step 4: Simplify - Skip Iterator & Get Design
            </h2>
            <p className="mb-3" style={{ color: '#666' }}>
              <strong>Good news!</strong> You don't need Iterator or "Get a Design" modules. The Canva trigger output already includes all fields needed.
            </p>
            <p className="text-sm" style={{ color: '#9B9B8F' }}>
              Just use the Canva trigger (Module 1) output directly in the HTTP module below.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border mb-6" style={{ borderColor: '#E8E4DD' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2D2A26' }}>
              Step 5: Configure HTTP Action (Send to CRM)
            </h2>
            <ol className="list-decimal list-inside space-y-3" style={{ color: '#666' }}>
              <li>Click <strong>"+"</strong> after the Canva trigger (Module 1)</li>
              <li>Search for <strong>"HTTP"</strong></li>
              <li>Select <strong>"Make a request"</strong></li>
              <li><strong>URL:</strong> Paste: <code className="bg-gray-100 px-1">https://marketing-crm-ebon.vercel.app/api/canva/webhook</code></li>
              <li><strong>Method:</strong> POST</li>
              <li><strong>Content Type:</strong> application/json</li>
              <li><strong>Body type:</strong> Raw JSON</li>
              <li><strong>Body:</strong> Click <strong>"Text"</strong> and type this JSON:</li>
            </ol>
            <pre className="mt-3 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
{`{\n  "designId": "${makeVar(1, 'id')}",\n  "designName": "${makeVar(1, 'name')}",\n  "designUrl": "${makeVar(1, 'urls.edit_url')}",\n  "thumbnailUrl": "${makeVar(1, 'Image ID')}",\n  "exportUrl": "${makeVar(1, 'urls.export_url')}"\n}`}
            </pre>
            <div className="mt-3 p-3 bg-blue-50 rounded text-sm" style={{ borderColor: '#00C4CC' }}>
              <p className="font-bold mb-1" style={{ color: '#00C4CC' }}>✓ Key Points:</p>
              <ul className="list-disc list-inside space-y-1" style={{ color: '#666' }}>
                <li>Use <code className="bg-white px-1">{makeVar(1, 'field')}</code> (Module 1 = Canva trigger directly)</li>
                <li><strong>designUrl</strong> uses <code className="bg-white px-1">urls.edit_url</code> (opens in edit mode)</li>
                <li><strong>thumbnailUrl</strong> uses <code className="bg-white px-1">Image ID</code> (Make.com field name with space)</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border mb-6" style={{ borderColor: '#E8E4DD' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2D2A26' }}>
              Step 6: Test & Activate
            </h2>
            <ol className="list-decimal list-inside space-y-3" style={{ color: '#666' }}>
              <li>Click <strong>"Run Once"</strong> to test</li>
              <li>Check the CRM to see if design appears with thumbnail</li>
              <li>Click <strong>"Activate"</strong> to turn on the scenario</li>
            </ol>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border" style={{ borderColor: '#10b981' }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#10b981' }}>
              ✓ Done!
            </h2>
            <p style={{ color: '#666' }}>
              Now when you create designs in Canva, Make will automatically sync them to your CRM!
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

export default function MakeSetupPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <MakeSetupContent />
    </Suspense>
  );
}
