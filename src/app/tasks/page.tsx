import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { SidebarNav } from '@/components/sidebar-nav';
import { TopNav } from '@/components/top-nav';
import { sqlRaw } from '@/db';
import { TasksFilters } from './tasks-filters';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import { PendingApprovalCard } from './pending-approval-card';

export const dynamic = 'force-dynamic';

const ITEMS_PER_PAGE = 10;

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

async function getTasks(page: number, search?: string) {
  const offset = (page - 1) * ITEMS_PER_PAGE;
  
  let tasks: any[] = [];
  let totalCount = 0;
  
  try {
    // Use raw SQL for select
    if (search) {
      const searchPattern = `%${search}%`;
      const result = await sqlRaw`
        SELECT t.*, u.name as assignee_name, c.name as client_name
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        LEFT JOIN clients c ON t.client_id = c.id
        WHERE t.title ILIKE ${searchPattern} OR t.description ILIKE ${searchPattern}
        ORDER BY t.due_date NULLS LAST
        LIMIT ${ITEMS_PER_PAGE}
        OFFSET ${offset}
      `;
      tasks = result;
      
      const countResult = await sqlRaw`
        SELECT COUNT(*) as count FROM tasks 
        WHERE title ILIKE ${searchPattern} OR description ILIKE ${searchPattern}
      `;
      totalCount = countResult[0]?.count || 0;
    } else {
      const result = await sqlRaw`
        SELECT t.*, u.name as assignee_name, c.name as client_name
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        LEFT JOIN clients c ON t.client_id = c.id
        ORDER BY t.due_date NULLS LAST
        LIMIT ${ITEMS_PER_PAGE}
        OFFSET ${offset}
      `;
      tasks = result;
      
      const countResult = await sqlRaw`SELECT COUNT(*) as count FROM tasks`;
      totalCount = countResult[0]?.count || 0;
    }
  } catch (e) {
    console.error('Error fetching tasks:', e);
  }
  
  return { tasks, totalCount };
}

// Get tasks with pending status changes for admin approval
async function getPendingApprovalTasks() {
  let pendingTasks: any[] = [];
  
  try {
    const result = await sqlRaw`
      SELECT t.*, u.name as assignee_name, u.email as assignee_email, c.name as client_name,
             requester.name as requested_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users requester ON t.pending_status_requested_by = requester.id
      WHERE t.pending_status IS NOT NULL AND t.pending_status != t.status
      ORDER BY t.pending_status_requested_at DESC
      LIMIT 20
    `;
    pendingTasks = result;
  } catch (e) {
    console.error('Error fetching pending tasks:', e);
  }
  
  return pendingTasks;
}

export default async function TasksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  const currentPage = parseInt(params.page || '1', 10);
  const searchQuery = params.search || '';
  
  const { tasks, totalCount } = await getTasks(currentPage, searchQuery);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  
  // Get pending approval tasks for admins
  const pendingTasks = isAdmin ? await getPendingApprovalTasks() : [];

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
            {/* Pending Approvals Section - Only for Admins */}
            {isAdmin && pendingTasks.length > 0 && (
              <div className="mb-8 p-4 rounded-lg" style={{ background: '#FFF8E5', border: '1px solid #F2CC8F' }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#2D2A26' }}>
                  ⏳ Pending Status Approvals ({pendingTasks.length})
                </h2>
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <PendingApprovalCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

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