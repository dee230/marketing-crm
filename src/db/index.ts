import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Neon HTTP driver for serverless
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('========================================');
  console.error('WARNING: DATABASE_URL is not set!');
  console.error('Please add it in Vercel Dashboard:');
  console.error('Settings → Environment Variables → Add DATABASE_URL');
  console.error('========================================');
}

const sql = connectionString 
  ? neon(connectionString)
  : neon('postgresql://placeholder/placeholder'); // Dummy value to allow build

export const db = drizzle(sql, { schema });

export type Database = typeof db;