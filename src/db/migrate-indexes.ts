// Run this once to add database indexes for better performance
// Execute with: npx tsx src/db/migrate-indexes.ts

import Database from 'better-sqlite3';

const sqlite = new Database('data.db');

console.log('Adding database indexes...');

// Leads table indexes
sqlite.exec(`
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
  CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
  CREATE INDEX IF NOT EXISTS idx_leads_name ON leads(name);
`);

// Tasks table indexes
sqlite.exec(`
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
  CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
`);

// Clients table indexes
sqlite.exec(`
  CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company);
  CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
  CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
`);

// Invoices table indexes
sqlite.exec(`
  CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
  CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
`);

// Users table indexes
sqlite.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
`);

console.log('✅ Database indexes created successfully!');

// Verify indexes
const indexes = sqlite.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='index' AND tbl_name IN ('leads', 'tasks', 'clients', 'invoices', 'users')
`).execute();

console.log('\nIndexes created:');
indexes.forEach((idx: any) => console.log(`  - ${idx.name}`));

sqlite.close();