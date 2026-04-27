import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';

export async function POST() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userRole = (session.user as any)?.role;
  if (userRole !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden - Super admin only' }, { status: 403 });
  }
  
  try {
    // Get users to keep
    const usersToKeep = await sqlRaw`
      SELECT id FROM users WHERE email = 'stephaniegow93@gmail.com' OR email = 'denzel.rooke23@gmail.com'
    `;
    
    const userIds = usersToKeep.map((u: any) => u.id);
    
    if (userIds.length === 0) {
      return NextResponse.json({ error: 'Users to keep not found' }, { status: 400 });
    }
    
    const now = new Date().toISOString();
    
    // Delete all related data except for the users we keep
    // Disable foreign key checks temporarily
    await sqlRaw`SET CONSTRAINTS ALL DEFERRED`;
    
    // Delete audit logs
    await sqlRaw`DELETE FROM audit_logs`;
    
    // Delete password reset requests
    await sqlRaw`DELETE FROM password_reset_requests`;
    
    // Delete sessions
    await sqlRaw`DELETE FROM sessions`;
    
    // Delete accounts
    await sqlRaw`DELETE FROM accounts`;
    
    // Delete tasks (keep only tasks by users we want to keep)
    await sqlRaw`DELETE FROM tasks`;
    
    // Delete leads
    await sqlRaw`DELETE FROM leads`;
    
    // Delete invoices
    await sqlRaw`DELETE FROM invoices`;
    
    // Delete clients
    await sqlRaw`DELETE FROM clients`;
    
    // Delete integrations
    await sqlRaw`DELETE FROM integrations`;
    
    // Delete the third user if exists (Cristiano)
    const otherUserIds = await sqlRaw`SELECT id FROM users WHERE email NOT IN ('stephaniegow93@gmail.com', 'denzel.rooke23@gmail.com')`;
    for (const user of otherUserIds) {
      await sqlRaw`DELETE FROM users WHERE id = ${user.id}`;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database cleared. Kept users: stephaniegow93, denzelrooke',
      keptUsers: ['stephaniegow93@gmail.com', 'denzel.rooke23@gmail.com']
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}