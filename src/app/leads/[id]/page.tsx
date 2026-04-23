import Link from 'next/link';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { TopNav } from '@/components/top-nav';
import { SidebarNav } from '@/components/sidebar-nav';
import { sqlRaw } from '@/db';
import { EditLeadForm } from './edit-lead';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getLead(id: string) {
  const result = await sqlRaw`SELECT * FROM leads WHERE id = ${id} LIMIT 1`;
  return result[0] || null;
}

async function getClient(clientId: string | null) {
  if (!clientId) return null;
  const result = await sqlRaw`SELECT * FROM clients WHERE id = ${clientId} LIMIT 1`;
  return result[0] || null;
}

async function getAllClients() {
  const result = await sqlRaw`SELECT id, name, company FROM clients ORDER BY company NULLS LAST, name`;
  return result;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const lead = await getLead(id);
  if (!lead) notFound();

  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const client = await getClient(lead.clientId);
  const clients = await getAllClients();

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />

      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/leads" userRole={userRole} />
        </aside>

        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/leads" className="p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" style={{ color: '#9B9B8F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>{lead.name}</h1>
                <p className="text-sm" style={{ color: '#9B9B8F' }}>Lead Details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Lead Info */}
              <div className="card p-6 md:col-span-2">
<div className="flex justify-between items-start mb-4">
                  <h3 className="text-sm font-medium" style={{ color: '#9B9B8F' }}>Contact Information</h3>
                  <EditLeadForm lead={lead} isAdmin={isAdmin} clients={clients} />
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs" style={{ color: '#9B9B8F' }}>Status</span>
                      <p>
                        <span className={`badge ${
                          lead.status === 'new' ? 'badge-new' :
                          lead.status === 'contacted' ? 'badge-pending' :
                          lead.status === 'qualified' ? 'badge-sent' :
                          lead.status === 'converted' ? 'badge-completed' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {lead.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-xs" style={{ color: '#9B9B8F' }}>Source</span>
                      <p className="font-medium" style={{ color: '#2D2A26' }}>{lead.source}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs" style={{ color: '#9B9B8F' }}>Email</span>
                    <p className="font-medium" style={{ color: '#2D2A26' }}>{lead.email || '-'}</p>
                  </div>

                  <div>
                    <span className="text-xs" style={{ color: '#9B9B8F' }}>Phone</span>
                    <p className="font-medium" style={{ color: '#2D2A26' }}>{lead.phone || '-'}</p>
                  </div>

                  <div>
                    <span className="text-xs" style={{ color: '#9B9B8F' }}>Company</span>
                    <p className="font-medium" style={{ color: '#2D2A26' }}>{lead.company || '-'}</p>
                  </div>

                  <div>
                    <span className="text-xs" style={{ color: '#9B9B8F' }}>Notes</span>
                    <p className="text-sm" style={{ color: '#2D2A26' }}>{lead.notes || 'No notes'}</p>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="card p-6">
                  <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>Dates</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: '#9B9B8F' }}>Created</span>
                      <span className="text-sm" style={{ color: '#2D2A26' }}>
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '-'}
                      </span>
                    </div>
                    {lead.convertedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: '#9B9B8F' }}>Converted</span>
                        <span className="text-sm" style={{ color: '#2D2A26' }}>
                          {new Date(lead.convertedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Linked Client */}
                {client && (
                  <div className="card p-6">
                    <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>Linked Client</h3>
                    <Link href={`/clients/${encodeURIComponent(client.company || client.name)}`} style={{ color: '#E07A5F' }}>
                      {client.company || client.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <Link href="/leads" className="text-sm" style={{ color: '#E07A5F' }}>← Back to Leads</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}