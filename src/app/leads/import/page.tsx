import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function ImportLeadsPage() {
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');

  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link href="/leads" className="text-sm" style={{ color: '#9B9B8F' }}>← Back to Leads</Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: '#2D2A26' }}>Import Leads from LinkedIn</h1>
      </div>
      
      <div className="card p-8 max-w-2xl">
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#2D2A26' }}>LinkedIn Lead Sync</h2>
        <p className="mb-4" style={{ color: '#9B9B8F' }}>
          This feature allows you to import leads directly from LinkedIn Lead Forms.
          To use this feature, you need to:
        </p>
        <ol className="list-decimal list-inside space-y-2 mb-6" style={{ color: '#9B9B8F' }}>
          <li>Apply for LinkedIn Lead Sync API access in the LinkedIn Developer Portal</li>
          <li>Configure your LinkedIn API credentials in the environment variables</li>
          <li>Set up webhook URL for real-time lead notifications</li>
        </ol>
        
        <div className="p-4 rounded-lg mb-6" style={{ background: 'rgba(242, 204, 143, 0.2)', borderLeft: '3px solid #F2CC8F' }}>
          <p className="text-sm" style={{ color: '#B8923D' }}>
            <strong>Note:</strong> LinkedIn API access requires approval. 
            Once approved, you can configure the credentials below.
          </p>
        </div>

        <div className="border-t pt-6" style={{ borderColor: '#E8E4DD' }}>
          <h3 className="font-medium mb-4" style={{ color: '#2D2A26' }}>Configuration (Coming Soon)</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between py-2" style={{ borderBottom: '1px solid #E8E4DD' }}>
              <span style={{ color: '#3D405B' }}>LinkedIn Client ID</span>
              <span style={{ color: '#9B9B8F' }}>Not configured</span>
            </div>
            <div className="flex justify-between py-2" style={{ borderBottom: '1px solid #E8E4DD' }}>
              <span style={{ color: '#3D405B' }}>LinkedIn Client Secret</span>
              <span style={{ color: '#9B9B8F' }}>Not configured</span>
            </div>
            <div className="flex justify-between py-2" style={{ borderBottom: '1px solid #E8E4DD' }}>
              <span style={{ color: '#3D405B' }}>Webhook URL</span>
              <span style={{ color: '#9B9B8F' }}>Not configured</span>
            </div>
            <div className="flex justify-between py-2">
              <span style={{ color: '#3D405B' }}>API Status</span>
              <span style={{ color: '#B8923D' }}>Pending Approval</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link href="/leads" className="btn-outline">
            Back to Leads
          </Link>
        </div>
      </div>
    </div>
  );
}