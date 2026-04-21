// Run this once to add the audit_logs table
// Execute with: npx tsx src/db/migrate-audit-log.ts

import Database from 'better-sqlite3';

const sqlite = new Database('data.db');

console.log('Creating audit_logs table...');

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS audit_logs (
    id text PRIMARY KEY NOT NULL,
    user_id text REFERENCES users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    details text,
    ip_address text,
    user_agent text,
    created_at integer NOT NULL
  )
`);

console.log('✅ Table created successfully!');

// Verify table exists
const tables = sqlite.prepare(`
  SELECT name FROM sqlite_master WHERE type='table' AND name='audit_logs'
`).get();

if (tables) {
  console.log('✅ audit_logs table exists');
} else {
  console.log('❌ Table creation failed');
}

sqlite.close();