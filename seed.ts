import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { eq } from 'drizzle-orm';

const sqlite = new Database('./data.db');

const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  role: text('role', { enum: ['super_admin', 'admin', 'member'] }).notNull().default('member'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

const db = drizzle(sqlite);

async function seed() {
  console.log('Seeding database...');

  // Check if admin user exists
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.email, 'stephaniegow93@gmail.com'))
    .limit(1);

  if (existingAdmin.length > 0) {
    console.log('Admin user already exists');
    return;
  }

  // Create super_admin user (Stephanie)
  await db.insert(users).values({
    id: crypto.randomUUID(),
    name: 'Stephanie',
    email: 'stephaniegow93@gmail.com',
    emailVerified: true,
    image: null,
    role: 'super_admin',
    password: 'admin123', // In production, use hashed password
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Super Admin user created: stephaniegow93@gmail.com');
  console.log('Password: admin123');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    sqlite.close();
    console.log('Done');
  });