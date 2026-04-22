import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { SidebarNav } from '@/components/sidebar-nav';
import { TopNav } from '@/components/top-nav';
import { db } from '@/db';
import { eq, desc, like, or, sql } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { TasksFilters } from './tasks-filters';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';

export const dynamic = 'force-dynamic';

const ITEMS_PER_PAGE = 10;

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

async function getTasks(page: number, search?: string) {
  const offset = (page - 1) * ITEMS_PER_PAGE;
  
  // Build where clause for search
  let whereClause;
  if (search) {
    const searchPattern = `%${search}%`;
    whereClause = or(
      like(schema.tasks.title, searchPattern),
      like(schema.tasks.description, searchPattern)
    );
  }
  
  const tasks = await db.select()
    .from(schema.tasks)
    .where(whereClause)
    .orderBy(schema.tasks.dueDate)
    .limit(ITEMS_PER_PAGE)
    .offset(offset)
    .execute();
    
  // Get total count for pagination
  const totalCount = await db.select({ count: sql<number>`count(*)` })
    .from(schema.tasks)
    .where(whereClause)
    .then(rows => rows[0]?.count || 0);
  
  const [users, clients] = await Promise.all([
    db.select().from(schema.users).execute(),
    db.select().from(schema.clients).execute(),
  ]);
  
  const userMap = new Map(users.map(u => [u.id, u.name]));
  const clientMap = new Map(clients.map(c => [c.id, c.name]));
  
  return {
    tasks: tasks.map(task => ({
      ...task,
      assigneeName: task.assigneeId ? userMap.get(task.assigneeId) : null,
      clientName: task.clientId ? clientMap.get(task.clientId) : null,
    })),
    totalCount,
  };
}

export default async function TasksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');

  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  const currentPage = parseInt(params.page || '1', 10);
  const searchQuery = params.search || '';
  
  const { tasks, totalCount } = await getTasks(currentPage, searchQuery);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      {/* Top Navigation */}
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />
      
      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/tasks" userRole={userRole} />
        </aside>

        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>Tasks</h1>
                <p className="text-sm" style={{ color: '#9B9B8F' }}>
                  {totalCount > 0 ? `${totalCount} total tasks` : 'Track and manage your tasks'}
                </p>
              </div>
              <div className="flex gap-3 items-center">
                <SearchInput placeholder="Search tasks..." basePath="/tasks" />
                <Link href="/tasks/new" className="btn-primary">
                  + Create Task
                </Link>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(242, 204, 143, 0.2)' }}>
                  <svg className="w-8 h-8" style={{ color: '#B8923D' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <p className="mb-4" style={{ color: '#9B9B8F' }}>
                  {searchQuery ? 'No tasks match your search' : 'No tasks yet'}
                </p>
                {!searchQuery && (
                  <Link href="/tasks/new" style={{ color: '#E07A5F' }}>
                    Create your first task →
                  </Link>
                )}
              </div>
            ) : (
              <>
                <TasksFilters tasks={tasks} isAdmin={isAdmin} />
                <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/tasks" />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}