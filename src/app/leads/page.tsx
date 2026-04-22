import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db } from '@/db';
import { eq, desc, like, or, sql } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { SignOutButton } from '@/components/sign-out-button';
import { SidebarNav } from '@/components/sidebar-nav';
import { TopNav } from '@/components/top-nav';
import { LeadsStatusChart } from './status-chart';
import { LeadsFilters } from './leads-filters';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';

export const dynamic = 'force-dynamic';

const ITEMS_PER_PAGE = 10;

export type Lead = Awaited<ReturnType<typeof getLeads>>[number];

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

async function getLeads(page: number, search?: string) {
  const offset = (page - 1) * ITEMS_PER_PAGE;
  
  // Build where clause for search
  let whereClause;
  if (search) {
    const searchPattern = `%${search}%`;
    whereClause = or(
      like(schema.leads.name, searchPattern),
      like(schema.leads.email, searchPattern),
      like(schema.leads.company, searchPattern)
    );
  }
  
  const leads = await db.select()
    .from(schema.leads)
    .where(whereClause)
    .orderBy(desc(schema.leads.createdAt))
    .limit(ITEMS_PER_PAGE)
    .offset(offset)
    .execute();
    
  // Get total count for pagination
  const totalCount = await db.select({ count: sql<number>`count(*)` })
    .from(schema.leads)
    .where(whereClause)
    .then(rows => rows[0]?.count || 0);
  
  const clients = await db.select().from(schema.clients).execute();
  const clientMap = new Map(clients.map(c => [c.id, c.name]));
  
  return {
    leads: leads.map(lead => ({
      ...lead,
      clientName: lead.clientId ? clientMap.get(lead.clientId) : null,
    })),
    totalCount,
  };
}

async function getAllLeadsForChart() {
  const leads = await db.select().from(schema.leads).execute();
  const clients = await db.select().from(schema.clients).execute();
  const clientMap = new Map(clients.map(c => [c.id, c.name]));
  
  return leads.map(lead => ({
    ...lead,
    clientName: lead.clientId ? clientMap.get(lead.clientId) : null,
  }));
}

function getLeadsByStatus(leads: any[]) {
  const statusCounts = new Map<string, number>();
  
  for (const lead of leads) {
    const current = statusCounts.get(lead.status) || 0;
    statusCounts.set(lead.status, current + 1);
  }
  
  const statuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
  return statuses.map(status => ({
    status,
    count: statusCounts.get(status) || 0,
  }));
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');

  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  const currentPage = parseInt(params.page || '1', 10);
  const searchQuery = params.search || '';
  
  const { leads, totalCount } = await getLeads(currentPage, searchQuery);
  const allLeads = await getAllLeadsForChart();
  const leadsByStatus = getLeadsByStatus(allLeads);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      {/* Top Navigation */}
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />
      
      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/leads" userRole={userRole} />
        </aside>

        <main className="flex-1 p-8">
          <div className="animate-fade-in">
<div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>Leads</h1>
                <p className="text-sm" style={{ color: '#9B9B8F' }}>
                  {totalCount > 0 ? `${totalCount} total leads` : 'Track and manage your potential clients'}
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <SearchInput placeholder="Search leads..." basePath="/leads" />
                <Link href="/leads/new" className="btn-primary">
                  + Add Lead
                </Link>
                {isAdmin && (
                  <Link href="/leads/import" className="btn-secondary">
                    Import from LinkedIn
                  </Link>
                )}
              </div>
            </div>

            {leads.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(129, 178, 154, 0.15)' }}>
                  <svg className="w-8 h-8" style={{ color: '#81B29A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="mb-4" style={{ color: '#9B9B8F' }}>
                  {searchQuery ? 'No leads match your search' : 'No leads yet'}
                </p>
                {!searchQuery && (
                  <Link href="/leads/new" style={{ color: '#E07A5F' }}>
                    Add your first lead →
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                  <div className="lg:col-span-1">
                    <LeadsStatusChart leads={leadsByStatus} />
                  </div>
                  <div className="lg:col-span-3">
                    <LeadsFilters leads={leads} isAdmin={isAdmin} />
                    <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/leads" />
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}