# Marketing CRM

A digital marketing company CRM built with Next.js, Drizzle ORM, and SQLite.

## Features

- **Dashboard** - Overview of clients, leads, invoices, and tasks
- **Client Management** - Track clients with contact info and status
- **Lead Tracking** - Manage leads with source, status, and conversion tracking
- **Invoicing** - Create and track invoices with payment status
- **Task Management** - Create and assign tasks with priorities
- **Authentication** - Team login with role-based access control
- **LinkedIn Integration** - Framework ready for LinkedIn Lead Sync API

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite with Drizzle ORM
- **Auth**: NextAuth.js with credentials provider
- **UI**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd marketing-crm
npm install
```

2. Create `.env.local` file:
```env
AUTH_SECRET=2XhIw4zAXxl73lC+d5xkV70k8eJ//xe29L1HczEtCAA=
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

3. Push database schema:
```bash
npx drizzle-kit push
```

4. Seed the database (already done):
```bash
npx tsx seed.ts
```

### Running the App

```bash
npm run dev
```

Open http://localhost:3000

### Default Admin Login

- **Email**: stephaniegow93@gmail.com
- **Password**: admin123

## Project Structure

```
src/
├── app/               # Next.js App Router pages
│   ├── dashboard/     # Dashboard & layout
│   ├── clients/       # Client management
│   ├── leads/         # Lead tracking
│   ├── invoices/      # Invoice management
│   ├── tasks/         # Task management
│   └── sign-in/       # Login page
├── db/
│   ├── schema.ts      # Database schema
│   └── index.ts       # DB connection
├── lib/
│   └── auth-client.ts # Auth client
├── auth.ts            # NextAuth config
└── middleware.ts      # Auth middleware
```

## User Roles

- **Admin** (Stephanie): Full access to all features
- **Member**: Limited access (view only)

## LinkedIn Integration

To enable LinkedIn lead sync:

1. Apply for LinkedIn Lead Sync API access at https://developer.linkedin.com/
2. Add your credentials to `.env.local`:
```env
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
LINKEDIN_WEBHOOK_SECRET=your-webhook-secret
```
3. Implement the webhook handler in `/app/api/webhooks/linkedin/route.ts`

## License

MIT