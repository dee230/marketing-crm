import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { SidebarNav } from '@/components/sidebar-nav';
import { TopNav } from '@/components/top-nav';
import { sqlRaw } from '@/db';
import { ClientsFilters } from './clients-filters';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';

export const dynamic = 'force-dynamic';

const ITEMS_PER_PAGE = 10;

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

async function getCompanies(page: number, search?: string) {
  const offset = (page - 1) * ITEMS_PER_PAGE;
  
  let companies: any[] = [];
  let totalCount = 0;
  
  try {
    if (search) {
      const searchPattern = `%${search}%`;
      const clients = await sqlRaw`
        SELECT * FROM clients 
        WHERE company ILIKE ${searchPattern}
        ORDER BY created_at DESC
        LIMIT ${ITEMS_PER_PAGE}
        OFFSET ${offset}
      `;
      
      const countResult = await sqlRaw`
        SELECT COUNT(DISTINCT COALESCE(company, name)) as count FROM clients 
        WHERE company ILIKE ${searchPattern}
      `;
      totalCount = countResult[0]?.count || 0;
      companies = clients;
    } else {
      const clients = await sqlRaw`
        SELECT * FROM clients 
        ORDER BY created_at DESC
        LIMIT ${ITEMS_PER_PAGE}
        OFFSET ${offset}
      `;
      
      const countResult = await sqlRaw`SELECT COUNT(DISTINCT COALESCE(company, name)) as count FROM clients`;
      totalCount = countResult[0]?.count || 0;
      companies = clients;
    }
  } catch (e) {
    console.error('Error fetching companies:', e);
  }
  
  // Group by company name
  const companyMap = new Map<string, { id: string; name: string; count: number; status: string }>();
  
  for (const client of companies) {
    const companyName = client.company || client.name;
    
    if (companyMap.has(companyName)) {
      const existing = companyMap.get(companyName)!;
      existing.count++;
    } else {
      companyMap.set(companyName, {
        id: client.id,
        name: companyName,
        count: 1,
        status: client.status,
      });
    }
  }
  
  return {
    companies: Array.from(companyMap.values()),
    totalCount,
  };
}

async function getPeopleAtCompany(companyName: string) {
  try {
    return await sqlRaw`
      SELECT * FROM clients 
      WHERE company = ${companyName} OR (company IS NULL AND name = ${companyName})
    `;
  } catch (e) {
    console.error('Error fetching people at company:', e);
    return [];
  }
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  const currentPage = parseInt(params.page || '1', 10);
  const searchQuery = params.search || '';
  
  const { companies, totalCount } = await getCompanies(currentPage, searchQuery);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />

      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/clients" userRole={userRole} />
        </aside>

        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>Companies</h1>
                <p className="text-sm" style={{ color: '#9B9B8F' }}>
                  {totalCount > 0 ? `${totalCount} total companies` : 'Manage your client companies'}
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <SearchInput placeholder="Search companies..." basePath="/clients" />
                {isAdmin && (
                  <Link href="/clients/new" className="btn-primary">
                    + Add Client
                  </Link>
                )}
              </div>
            </div>

            {companies.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(224, 122, 95, 0.15)' }}>
                  <svg className="w-8 h-8" style={{ color: '#E07A5F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="mb-4" style={{ color: '#9B9B8F' }}>
                  {searchQuery ? 'No companies match your search' : 'No companies yet'}
                </p>
                {!searchQuery && isAdmin && (
                  <Link href="/clients/new" style={{ color: '#E07A5F' }}>
                    Add your first client →
                  </Link>
                )}
              </div>
            ) : (
              <>
                <ClientsFilters companies={companies} isAdmin={isAdmin} />
                <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/clients" />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}