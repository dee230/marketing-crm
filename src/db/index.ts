import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Neon HTTP driver for serverless
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('WARNING: DATABASE_URL is not set!');
}

// Create sql function
const createSql = () => neon(connectionString || '');

export const db = drizzle(createSql(), { schema });

// Export schema for use in API routes
export { schema };

// Export sqlRaw for tagged template queries - use as: sqlRaw`SELECT * FROM table`
export const sqlRaw = createSql();

// Helper function that works like regular SQL - use this for UPDATE/INSERT/DELETE
// Pass the entire SQL as a string without placeholders
export async function query(sqlString: string): Promise<any[]> {
  // Neon doesn't support non-tagged calls, so we need to construct the query differently
  // For UPDATE/INSERT with dynamic values, build the full query and execute with unsafe
  const sqlFn = createSql();
  return sqlFn.unsafe(sqlString);
}