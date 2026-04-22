# Neon Database Setup Guide

## Prerequisites
- [ ] Create a Neon account at https://neon.tech
- [ ] Create a new project (free tier: 3GB storage)

## Step 1: Get Your Connection String

1. Log in to Neon Dashboard: https://console.neon.tech
2. Select your project
3. Go to **Connection Details**
4. Copy the **Connection string** (looks like: `postgresql://user:password@ep-xxx-123456.us-east-2.aws.neon.tech/marketing-crm`)

## Step 2: Add Environment Variables

Add to `.env.local` (or create if it doesn't exist):

```bash
# Neon Database
DATABASE_URL=postgresql://user:password@ep-xxx-123456.us-east-2.aws.neon.tech/marketing-crm?sslmode=require
```

## Step 3: Run Migrations

```bash
# Generate migration file
npm run db:generate

# Push schema to Neon
npm run db:push

# Or run migrations (if using migration files)
npm run db:migrate
```

## Step 4: Seed the Database

```bash
# Set environment variable and run seed
DATABASE_URL="your-neon-url" npx tsx seed.ts
```

## Step 5: Deploy to Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add:
   - `DATABASE_URL` = your Neon connection string

## Troubleshooting

### Connection Issues
```bash
# Test connection locally
DATABASE_URL="your-url" npx tsx -e "import { db } from './src/db/index'; console.log('Connected!')"
```

### SSL Error
If you get SSL errors, append `?sslmode=require` to your connection string.

### Migrations Not Applying
```bash
# Force push (drops and recreates tables)
npm run db:push -- --force
```

## Useful Commands

```bash
# Studio (visual DB explorer)
npm run db:studio

# Generate new migration
npm run db:generate --name=add_new_table

# Check migration status
npm run db:migrate:status
```

## Adding to package.json Scripts

Add these scripts if not already present:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```