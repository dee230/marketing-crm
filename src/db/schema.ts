import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// =====================
// AUTH SCHEMA (Better Auth)
// =====================

export const users = sqliteTable('users', {
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

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// Password reset requests table
export const passwordResetRequests = sqliteTable('password_reset_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'used'] }).notNull().default('pending'),
  requestedAt: integer('requested_at', { mode: 'timestamp' }).notNull(),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  approvedBy: text('approved_by').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
});

// =====================
// APPLICATION SCHEMA
// =====================

// Clients table
export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  company: text('company'),
  email: text('email'),
  phone: text('phone'),
  status: text('status', { enum: ['active', 'inactive', 'prospect'] }).notNull().default('prospect'),
  notes: text('notes'),
  website: text('website'),
  linkedin: text('linkedin'),
  twitter: text('twitter'),
  instagram: text('instagram'),
  otherLinks: text('other_links'), // JSON array for additional links
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Leads table
export const leads = sqliteTable('leads', {
  id: text('id').primaryKey(),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  source: text('source', { enum: ['linkedin', 'website', 'referral', 'cold-call', 'other'] }).notNull().default('other'),
  status: text('status', { enum: ['new', 'contacted', 'qualified', 'converted', 'lost'] }).notNull().default('new'),
  notes: text('notes'),
  linkedinProfileId: text('linkedin_profile_id'),
  linkedinData: text('linkedin_data'), // JSON string for LinkedIn extra data
  convertedAt: integer('converted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Invoices table
export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  status: text('status', { enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'] }).notNull().default('draft'),
  dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
  paidDate: integer('paid_date', { mode: 'timestamp' }),
  paymentReference: text('payment_reference'), // M-Pesa ID, receipt number, etc.
  description: text('description'),
  items: text('items'), // JSON string for line items
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Tasks table
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  assigneeId: text('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }),
  status: text('status', { enum: ['pending', 'in-progress', 'completed', 'cancelled'] }).notNull().default('pending'),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] }).notNull().default('medium'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  statusLockedAt: integer('status_locked_at', { mode: 'timestamp' }), // When status was first changed - only admins can edit after this
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// =====================
// RELATIONS
// =====================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  tasks: many(tasks),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  leads: many(leads),
  invoices: many(invoices),
  tasks: many(tasks),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  client: one(clients, {
    fields: [leads.clientId],
    references: [clients.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [tasks.clientId],
    references: [clients.id],
  }),
}));

// Audit log table
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  details: text('details'), // JSON string for additional context
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const passwordResetRequestsRelations = relations(passwordResetRequests, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetRequests.userId],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [passwordResetRequests.approvedBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));