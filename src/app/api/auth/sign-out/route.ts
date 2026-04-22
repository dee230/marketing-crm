import { NextRequest, NextResponse } from 'next/server';

// Sign out is now handled by NextAuth events in auth.ts
// This route just returns success - actual sign out is handled client-side
// because next-auth requires client-side sign out

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true });
}