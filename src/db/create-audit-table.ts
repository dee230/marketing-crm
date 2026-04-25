// Run this to add the audit_logs table to Neon Postgres
// Execute with: npx tsx src/db/create-audit-table.ts

import { sqlRaw } from './db';

async function createAuditTable() {
  console.log('Creating audit_logs table...');
  
  try {
    // Create table
    await sqlRaw`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id text PRIMARY KEY,
        user_id text REFERENCES users(id) ON DELETE SET NULL,
        action text NOT NULL,
        entity_type text NOT NULL,
        entity_id text NOT NULL,
        details text,
        ip_address text,
        user_agent text,
        created_at timestamp with time zone NOT NULL DEFAULT NOW()
      )
    `;
    
    console.log('✅ audit_logs table created!');
    
    // Check if table exists
    const tables = await sqlRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'audit_logs'
    `;
    
    console.log('Tables found:', tables);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

createAuditTable();