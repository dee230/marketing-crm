/**
 * Role-based access control helpers
 * 
 * Roles hierarchy:
 * - super_admin: Full system access, can manage users, system settings
 * - admin: Can manage data (clients, leads, invoices, tasks)
 * - member: Basic access - only view clients and leads
 */

export type UserRole = 'super_admin' | 'admin' | 'member';

/**
 * Check if user is an admin (admin or super_admin)
 */
export function isAdminRole(role: string | undefined): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Check if user is a super_admin
 */
export function isSuperAdmin(role: string | undefined): boolean {
  return role === 'super_admin';
}

/**
 * Check if user can view invoices
 * Only admins and super_admins can view invoices
 */
export function canViewInvoices(role: string | undefined): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Check if user can manage (edit/update) invoices
 * Only admins and super_admins can manage invoices
 */
export function canManageInvoices(role: string | undefined): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Check if user can access accounting
 * Only admins and super_admins can access accounting
 */
export function canAccessAccounting(role: string | undefined): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Check if user can view users
 * Admins and super_admins can view users
 */
export function canViewUsers(role: string | undefined): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Check if user can manage user roles (promote to admin/super_admin)
 * Only super_admins can change user roles
 */
export function canManageUserRoles(role: string | undefined): boolean {
  return role === 'super_admin';
}

/**
 * Check if user can create/edit data (clients, leads, invoices, tasks)
 * Only admins and super_admins can create/edit
 */
export function canCreateData(role: string | undefined): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Member permissions:
 * - View clients
 * - View leads
 * - View assigned tasks
 * 
 * Admin permissions:
 * - All member permissions PLUS:
 * - View/manage invoices
 * - Access accounting
 * - Create/edit/delete clients, leads, invoices, tasks
 * 
 * Super Admin permissions:
 * - All admin permissions PLUS:
 * - User management
 */