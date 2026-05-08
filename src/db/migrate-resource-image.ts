/**
 * Migration: Add resource_image_id column to clients table
 * 
 * Run: npx tsx src/db/migrate-resource-image.ts
 */
import { sqlRaw } from './index';

async function migrate() {
  console.log('Running migration: add resource_image_id to clients...');
  
  try {
    await sqlRaw`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS resource_image_id text
    `;
    console.log('✓ Column resource_image_id added to clients table');
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
  
  console.log('Migration complete.');
}

migrate();
