import { db } from './src/db/index';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';

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
    emailVerified: 1, // 1 = true, 0 = false (Postgres integer type)
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
    console.log('Done');
  });