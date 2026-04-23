import Link from 'next/link';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { TopNav } from '@/components/top-nav';
import { SidebarNav } from '@/components/sidebar-nav';
import { sqlRaw } from '@/db';
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

async function getPeopleAtCompany(companyName: string) {
  try {
    // Get clients (people) with this company name
    return await sqlRaw`
      SELECT * FROM clients 
      WHERE company = ${companyName} OR (company IS NULL AND name = ${companyName})
    `;
  } catch (e) {
    console.error('Error fetching people:', e);
    return [];
  }
}

async function getLeadsAtClient(clientId: string) {
  try {
    // Get leads linked to this client
    return await sqlRaw`
      SELECT * FROM leads WHERE client_id = ${clientId}
    `;
  } catch (e) {
    console.error('Error fetching leads:', e);
    return [];
  }
}

async function getClientById(clientId: string) {
  try {
    const result = await sqlRaw`SELECT * FROM clients WHERE id = ${clientId} LIMIT 1`;
    return result[0] || null;
  } catch (e) {
    console.error('Error fetching client:', e);
    return null;
  }
}

async function getPersonInvoices(personId: string) {
  try {
    return await sqlRaw`SELECT * FROM invoices WHERE client_id = ${personId}`;
  } catch (e) {
    console.error('Error fetching invoices:', e);
    return [];
  }
}

async function getPersonTasks(personId: string) {
  try {
    return await sqlRaw`SELECT * FROM tasks WHERE client_id = ${personId}`;
  } catch (e) {
    console.error('Error fetching tasks:', e);
    return [];
  }
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const companyName = decodeCompanyName(id);
  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  const people = await getPeopleAtCompany(companyName);
  
  // Also get leads linked to this client/company
  let linkedLeads: any[] = [];
  if (people.length > 0) {
    // Get leads for each person at the company
    for (const person of people) {
      const leads = await getLeadsAtClient(person.id);
      linkedLeads = [...linkedLeads, ...leads];
    }
  }
  
  // Combine people and leads for the people list
  const allPeople = [...people, ...linkedLeads.map(lead => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    status: lead.status === 'converted' ? 'active' : lead.status,
    notes: lead.notes,
    isLead: true, // Flag to identify leads in the UI
  }))];
  
  // Show helpful error if no client found
  if (people.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
        <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />
        <div className="flex">
          <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
            <SidebarNav currentPath="/clients" userRole={userRole} />
          </aside>
          <main className="flex-1 p-8">
            <div className="card p-8 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(224, 122, 95, 0.15)' }}>
                <svg className="w-8 h-8" style={{ color: '#E07A5F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#2D2A26' }}>Company Not Found</h2>
              <p className="mb-4" style={{ color: '#9B9B8F' }}>
                No company named "{companyName}" exists in the database.
              </p>
              <p className="text-sm mb-6" style={{ color: '#9B9B8F' }}>
                This could mean:
              </p>
              <ul className="text-sm text-left mb-6" style={{ color: '#9B9B8F', listStyle: 'disc', marginLeft: '2rem' }}>
                <li>The company was deleted</li>
                <li>The company was created without a company name (only a contact name)</li>
                <li>You&apos;re using an incorrect URL</li>
              </ul>
              <Link href="/clients" className="btn-primary">
                ← Back to Companies
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
                <p className="text-sm" style={{ color: '#9B9B8F' }}>{people.length} People{linkedLeads.length > 0 ? ` + ${linkedLeads.length} Lead(s)` : ''}</p>
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
                    <span className="text-sm font-medium" style={{ color: '#2D2A26' }}>{people.length}{linkedLeads.length > 0 ? ` (+${linkedLeads.length} leads)` : ''}</span>
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
            <PeopleList people={allPeople} allInvoices={allInvoices} allTasks={allTasks} isAdmin={isAdmin} companyName={companyName} />

            <div className="mt-6">
              <Link href="/clients" className="text-sm" style={{ color: '#E07A5F' }}>← Back to Companies</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}