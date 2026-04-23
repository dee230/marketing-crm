import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';
import { SignOutButton } from '@/components/sign-out-button';
import { SidebarNav } from '@/components/sidebar-nav';
import { TopNav } from '@/components/top-nav';
import { LeadsStatusChart } from './status-chart';
import { LeadsFilters } from './leads-filters';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';

export const dynamic = 'force-dynamic';

const ITEMS_PER_PAGE = 10;

export type Lead = any;

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

async function getLeads(page: number, search?: string) {
  const offset = (page - 1) * ITEMS_PER_PAGE;
  
  let leads: any[] = [];
  let totalCount = 0;
  
  try {
    if (search) {
      const searchPattern = `%${search}%`;
      leads = await sqlRaw`
        SELECT l.*, c.name as client_name
        FROM leads l
        LEFT JOIN clients c ON l.client_id = c.id
        WHERE l.name ILIKE ${searchPattern} OR l.email ILIKE ${searchPattern} OR l.company ILIKE ${searchPattern}
        ORDER BY l.created_at DESC
        LIMIT ${ITEMS_PER_PAGE}
        OFFSET ${offset}
      `;
      
      const countResult = await sqlRaw`
        SELECT COUNT(*) as count FROM leads 
        WHERE name ILIKE ${searchPattern} OR email ILIKE ${searchPattern} OR company ILIKE ${searchPattern}
      `;
      totalCount = countResult[0]?.count || 0;
    } else {
      leads = await sqlRaw`
        SELECT l.*, c.name as client_name
        FROM leads l
        LEFT JOIN clients c ON l.client_id = c.id
        ORDER BY l.created_at DESC
        LIMIT ${ITEMS_PER_PAGE}
        OFFSET ${offset}
      `;
      
      const countResult = await sqlRaw`SELECT COUNT(*) as count FROM leads`;
      totalCount = countResult[0]?.count || 0;
    }
  } catch (e) {
    console.error('Error fetching leads:', e);
  }
  
  return { leads, totalCount };
}

async function getAllLeadsForChart() {
  try {
    return await sqlRaw`SELECT * FROM leads ORDER BY created_at DESC`;
  } catch (e) {
    console.error('Error fetching all leads:', e);
    return [];
  }
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
  const session = await getSession();
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