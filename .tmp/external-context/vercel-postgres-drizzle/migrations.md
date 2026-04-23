---
source: Vercel Official Docs + Drizzle ORM Official Docs
library: Vercel Postgres
package: @vercel/postgres
topic: Migrations and Environment Configuration
fetched: 2026-04-22
official_docs: https://vercel.com/docs/storage/vercel-postgres
---

# Vercel Postgres Migrations and Environment Variables

## Environment Variables

Vercel automatically injects the following environment variables when you connect a Postgres database:

| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | Full connection string (postgresql://user:pass@host:port/db) |
| `POSTGRES_USER` | Database username |
| `POSTGRES_HOST` | Database host endpoint |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_DATABASE` | Database name |
| `POSTGRES_PORT` | Database port |

## Running Migrations on Vercel Postgres

### 1. Install Drizzle Kit
```bash
npm i -D drizzle-kit
```

### 2. Configure drizzle.config.ts
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
```

### 3. Generate Migration
```bash
npx drizzle-kit generate --name=init
```

### 4. Apply Migration
```bash
npx drizzle-kit migrate
```

## Migrations Table

Drizzle Kit creates a table to track applied migrations:

- **Default table name**: `__drizzle_migrations`
- **Default schema**: `public` (PostgreSQL)
- **Customizable** via `migrations` config option

## Driver Comparison

| Driver | Package | Best For | Connection Type |
|--------|---------|---------|----------------|
| @vercel/postgres | @vercel/postgres | Serverless functions | WebSocket |
| postgres.js | postgres | Traditional servers | TCP |
| pg | pg | Node.js apps | TCP |

### When to Use @vercel/postgres
- Vercel Serverless Functions
- Edge functions
- Cloudflare Workers
- Any environment without TCP availability

### When to Use Other Drivers
- Local development
- Full Node.js servers
- When you need connection pooling