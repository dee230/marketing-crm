import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
const sql = neon(connectionString!);

async function migrate() {
  console.log('Migrating: Adding pending status columns to tasks...');
  
  // Add pending status columns
  await sql`
    ALTER TABLE tasks 
    ADD COLUMN IF NOT EXISTS pending_status TEXT,
    ADD COLUMN IF NOT EXISTS pending_status_requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS pending_status_requested_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS status_locked_at TIMESTAMP WITH TIME ZONE
  `;
  
  console.log('Migration complete!');
}

migrate().catch(console.error);