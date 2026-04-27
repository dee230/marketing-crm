import { NextResponse } from 'next/server';
import { sqlRaw } from '@/db';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('key');
  
  // Verify API key
  if (apiKey !== 'cleanup-db-key-2024') {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }
  
  try {
    const now = new Date().toISOString();
    
    // Clear all data except users we want to keep
    await sqlRaw`DELETE FROM audit_logs`;
    await sqlRaw`DELETE FROM password_reset_requests`;
    await sqlRaw`DELETE FROM sessions`;
    await sqlRaw`DELETE FROM accounts`;
    await sqlRaw`DELETE FROM tasks`;
    await sqlRaw`DELETE FROM leads`;
    await sqlRaw`DELETE FROM invoices`;
    await sqlRaw`DELETE FROM clients`;
    await sqlRaw`DELETE FROM integrations`;
    
    // Delete any user except stephaniegow93 and denzelrooke
    await sqlRaw`DELETE FROM users WHERE email NOT IN ('stephaniegow93@gmail.com', 'denzel.rooke23@gmail.com')`;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database cleared. Kept: stephaniegow93@gmail.com, denzel.rooke23@gmail.com'
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}