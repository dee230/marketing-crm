import Link from 'next/link';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { TopNav } from '@/components/top-nav';
import { db } from '@/db';
import { eq, or, sql } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { CompanyNotesSection } from './notes-section';
import { PeopleList } from './people-list';
import { ResourcesSection } from './resources-section';
import { CalendarSection } from './calendar-section';
import { AddPersonButton } from './add-person';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

function decodeCompanyName(name: string): string {
  return decodeURIComponent(name);
}

function getPeopleAtCompany(companyName: string) {
  return db.select().from(schema.clients).where(
    or(
      eq(schema.clients.company, companyName),
      sql`${schema.clients.company} IS NULL AND ${schema.clients.name} = ${companyName}`
    )
  ).execute();
}

function getPersonInvoices(personId: string) {
  return db.select().from(schema.invoices).where(eq(schema.invoices.clientId, personId)).execute();
}

function getPersonTasks(personId: string) {
  return db.select().from(schema.tasks).where(eq(schema.tasks.clientId, personId)).execute();
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');

  const companyName = decodeCompanyName(id);
  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  const people = await getPeopleAtCompany(companyName);
  if (people.length === 0) notFound();

  // Get invoices and tasks
  let totalPending = 0;
  const allInvoices: any[] = [];
  const allTasks: any[] = [];
  
  for (const person of people) {
    const invoices = await getPersonInvoices(person.id);
    const tasks = await getPersonTasks(person.id);
    
    for (const inv of invoices) {
      allInvoices.push({ ...inv, personName: person.name });
      if (inv.status !== 'paid') totalPending += inv.amount;
    }
    
    for (const task of tasks) {
      allTasks.push({ ...task, personName: person.name });
    }
  }

  const pendingInvoices = allInvoices.filter(inv => inv.status !== 'paid');
  const companyNotes = people[0]?.notes;
  const companyResources = {
    website: people[0]?.website,
    linkedin: people[0]?.linkedin,
    twitter: people[0]?.twitter,
    instagram: people[0]?.instagram,
    otherLinks: people[0]?.otherLinks,
  };

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />

      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/clients" userRole={userRole} />
        </aside>

        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/clients" className="p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" style={{ color: '#9B9B8F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>{companyName}</h1>
                <p className="text-sm" style={{ color: '#9B9B8F' }}>{people.length} People</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pending Payments */}
              <div className="card p-6">
                <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>Pending Payments</h3>
                {pendingInvoices.length === 0 ? (
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>No pending invoices</p>
                ) : (
                  <>
                    <p className="text-3xl font-bold mb-4" style={{ color: '#E07A5F' }}>KES {totalPending.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</p>
                    <div className="space-y-2">
                      {pendingInvoices.slice(0, 5).map(inv => (
                        <div key={inv.id} className="flex justify-between text-sm">
                          <Link href={`/invoices/${inv.id}`} style={{ color: '#E07A5F' }}>
                            {inv.invoiceNumber}
                          </Link>
                          <span style={{ color: '#2D2A26' }}>KES {inv.amount.toLocaleString('en-KE')}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Active Tasks */}
              <div className="card p-6">
                <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>Active Tasks</h3>
                {allTasks.length === 0 ? (
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>No tasks linked</p>
                ) : (
                  <div className="space-y-2">
                    {allTasks.slice(0, 5).map(task => (
                      <div key={task.id} className="flex justify-between items-center text-sm">
                        <span style={{ color: '#2D2A26' }}>{task.title}</span>
                        <span className={`badge ${
                          task.status === 'completed' ? 'badge-completed' :
                          task.status === 'in-progress' ? 'badge-sent' :
                          'badge-pending'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="card p-6">
                <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: '#9B9B8F' }}>Total People</span>
                    <span className="text-sm font-medium" style={{ color: '#2D2A26' }}>{people.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: '#9B9B8F' }}>Total Invoices</span>
                    <span className="text-sm font-medium" style={{ color: '#2D2A26' }}>{allInvoices.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: '#9B9B8F' }}>Total Tasks</span>
                    <span className="text-sm font-medium" style={{ color: '#2D2A26' }}>{allTasks.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Notes - Prominent Section */}
            <CompanyNotesSection 
              companyName={companyName} 
              notes={companyNotes} 
              personId={people[0].id}
              isAdmin={isAdmin}
            />

            {/* Company Resources */}
            <ResourcesSection
              companyName={companyName}
              resources={companyResources}
              personId={people[0].id}
              isAdmin={isAdmin}
            />

            {/* Calendar */}
            <CalendarSection tasks={allTasks} />

            {/* People at Company */}
            <PeopleList people={people} allInvoices={allInvoices} allTasks={allTasks} isAdmin={isAdmin} companyName={companyName} />

            <div className="mt-6">
              <Link href="/clients" className="text-sm" style={{ color: '#E07A5F' }}>← Back to Companies</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}