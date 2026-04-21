// Run this once to add the password_reset_requests table
// Execute with: npx tsx src/db/migrate-password-reset.ts

import Database from 'better-sqlite3';

const sqlite = new Database('data.db');

console.log('Creating password_reset_requests table...');

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS password_reset_requests (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'used')),
    requested_at integer NOT NULL,
    approved_at integer,
    approved_by text REFERENCES users(id) ON DELETE SET NULL,
    expires_at integer NOT NULL,
    used_at integer
  )
`);

console.log('✅ Table created successfully!');

// Verify table exists
const tables = sqlite.prepare(`
  SELECT name FROM sqlite_master WHERE type='table' AND name='password_reset_requests'
`).get();

if (tables) {
  console.log('✅ password_reset_requests table exists');
} else {
  console.log('❌ Table creation failed');
}

sqlite.close();