import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { nanoid } from 'nanoid';

export type AuditAction =
  | 'password_reset_requested'
  | 'password_reset_approved'
  | 'password_reset_rejected'
  | 'password_reset_used'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'lead_created'
  | 'lead_updated'
  | 'lead_deleted'
  | 'lead_status_changed'
  | 'invoice_created'
  | 'invoice_updated'
  | 'invoice_deleted'
  | 'invoice_status_changed'
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'task_status_changed'
  | 'user_signed_in'
  | 'user_signed_out';

export type AuditEntityType = 'user' | 'client' | 'lead' | 'invoice' | 'task' | 'password_reset';

interface AuditLogParams {
  userId?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(params: AuditLogParams) {
  try {
    await db.insert(schema.auditLogs).values({
      id: nanoid(),
      userId: params.userId || null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details ? JSON.stringify(params.details) : null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      createdAt: new Date(),
    });
  } catch (error) {
    // Never throw - audit logging should never break the main operation
    console.error('Failed to write audit log:', error);
  }
}

export async function getAuditLogs(options?: {
  entityType?: AuditEntityType;
  entityId?: string;
  userId?: string;
  action?: AuditAction;
  limit?: number;
}) {
  let query = db.select().from(schema.auditLogs);

  const conditions = [];
  if (options?.entityType) {
    conditions.push(eq(schema.auditLogs.entityType, options.entityType));
  }
  if (options?.entityId) {
    conditions.push(eq(schema.auditLogs.entityId, options.entityId));
  }
  if (options?.userId) {
    conditions.push(eq(schema.auditLogs.userId, options.userId));
  }
  if (options?.action) {
    conditions.push(eq(schema.auditLogs.action, options.action));
  }

  if (conditions.length > 0) {
    query = query.where(
      conditions.length === 1
        ? conditions[0]
        : conditions.reduce((acc, cond) => eq(schema.auditLogs.id, schema.auditLogs.id), conditions[0])
    ) as typeof query;
  }

  const limit = options?.limit || 100;
  return query.limit(limit).orderBy(schema.auditLogs.createdAt);
}