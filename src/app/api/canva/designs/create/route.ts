import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Return Canva's design creation URL - this opens Canva in a new tab
  // No special scopes needed, user creates in Canva's editor
  const designUrl = 'https://www.canva.com/design';
  
  return NextResponse.json({ 
    editUrl: designUrl,
    message: 'Opens Canva design editor in new tab'
  });
}