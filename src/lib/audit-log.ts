import { sqlRaw } from '@/db';
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
    const id = nanoid();
    const details = params.details ? JSON.stringify(params.details) : null;
    const now = new Date().toISOString();
    
    await sqlRaw`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at)
      VALUES (${id}, ${params.userId || null}, ${params.action}, ${params.entityType}, ${params.entityId}, ${details}, ${params.ipAddress || null}, ${params.userAgent || null}, ${now})
    `;
  } catch (error) {
    // Never throw - audit logging should never break the main operation
    console.error('Failed to write audit log:', error);
  }
}