import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { SidebarNav } from '@/components/sidebar-nav';
import { TopNav } from '@/components/top-nav';
import { db } from '@/db';
import { eq, desc, like, sql } from 'drizzle-orm';
import * as schema from '@/db/schema';
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
  
  // Build where clause for search
  let whereClause;
  if (search) {
    const searchPattern = `%${search}%`;
    whereClause = like(schema.clients.company, searchPattern);
  }
  
  // Get clients with pagination
  const clients = await db.select()
    .from(schema.clients)
    .where(whereClause)
    .orderBy(desc(schema.clients.createdAt))
    .limit(ITEMS_PER_PAGE)
    .offset(offset)
    .all();
    
  // Get total count for pagination
  const totalCount = await db.select({ count: sql<number>`count(*)` })
    .from(schema.clients)
    .where(whereClause)
    .then(rows => rows[0]?.count || 0);
  
  // Group by company name
  const companyMap = new Map<string, { id: string; name: string; count: number; status: string }>();
  
  for (const client of clients) {
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
  return db.select().from(schema.clients).where(
    sql`${schema.clients.company} = ${companyName} OR (${schema.clients.company} IS NULL AND ${schema.clients.name} = ${companyName})`
  ).all();
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getServerSession(authConfig);
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
                <ClientsFilters companies={companies} />
                <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/clients" />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}