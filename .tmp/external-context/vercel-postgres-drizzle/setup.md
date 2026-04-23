---
source: Drizzle ORM Official Docs (orm.drizzle.team)
library: Drizzle ORM
package: drizzle-orm
topic: Vercel Postgres Setup and Connection
fetched: 2026-04-22
official_docs: https://orm.drizzle.team/docs/connect-vercel-postgres
---

# Vercel Postgres + Drizzle ORM Setup Guide

## Important Note

**Vercel Postgres is no longer available** for new projects as of December 2024. Existing databases were migrated to Neon. For new projects, use a Postgres integration from the Vercel Marketplace (e.g., Neon, Supabase, etc.).

---

## Step 1: Install Packages

```bash
npm i drizzle-orm @vercel/postgres
npm i -D drizzle-kit
```

## Step 2: Prepare Vercel Postgres

Set up a project according to the official Vercel Postgres quickstart docs.

## Step 3: Initialize the Driver

### Basic Usage
```typescript
import { drizzle } from 'drizzle-orm/vercel-postgres';

const db = drizzle();

const result = await db.execute('select 1');
```

### With Custom Driver
```typescript
import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';

const db = drizzle({ client: sql });

const result = await db.execute('select 1');
```

---

## Driver Compatibility

### Option 1: @vercel/postgres (Serverless Driver)
- **Package**: `@vercel/postgres`
- **Best for**: Serverless environments (Vercel Functions, Cloudflare Workers)
- **Access**: Via `drizzle-orm/vercel-postgres`
- **Features**: Works with no TCP available, uses websockets

### Option 2: postgres.js Driver
- **Package**: `postgres`
- **Best for**: Traditional serverful environments
- **Access**: Via standard PostgreSQL connection string

### Option 3: pg Driver
- **Package**: `pg` (node-postgres)
- **Best for**: Node.js environments with TCP connections
- **Access**: Via standard PostgreSQL connection string

---

## Environment Variables

Vercel automatically injects these when you add Postgres:

- `POSTGRES_URL` - Connection string
- `POSTGRES_USER` - Database user
- `POSTGRES_HOST` - Database host
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DATABASE` - Database name
- `POSTGRES_PORT` - Database port

---

## Running Migrations

### Generate Migrations
```bash
npx drizzle-kit generate --name=init
```

### Apply Migrations
```bash
npx drizzle-kit migrate
```

### Configuration (drizzle.config.ts)
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
  migrations: {
    table: '__drizzle_migrations',
    schema: 'public',
  },
});
```

---

## What to Use in Production

| Environment | Driver | Package |
|-------------|--------|---------|
| Vercel Serverless | @vercel/postgres | @vercel/postgres |
| Node.js Server | postgres.js | postgres |
| Node.js Server | pg | pg |