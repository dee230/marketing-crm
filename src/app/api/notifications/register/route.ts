import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/register
 *
 * Register or unregister a push notification token for the authenticated user.
 *
 * Body: { pushToken: string | null }
 *   - string: store this Expo push token for the user
 *   - null:   clear the stored token (user signed out / revoked permissions)
 *
 * Requires authentication via session cookie.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { pushToken } = body;

    if (pushToken === undefined || pushToken === null) {
      // Clear the registration
      await query(`UPDATE users SET push_token = NULL WHERE id = '${userId.replace(/'/g, "''")}'`);
      return NextResponse.json({ success: true, registered: false });
    }

    if (typeof pushToken !== 'string' || !pushToken.startsWith('ExponentPushToken')) {
      return NextResponse.json(
        { error: 'Invalid push token format. Must be an Expo push token.' },
        { status: 400 }
      );
    }

    // Store the token (upsert)
    const safeToken = pushToken.replace(/'/g, "''");
    await query(`UPDATE users SET push_token = '${safeToken}' WHERE id = '${userId.replace(/'/g, "''")}'`);

    return NextResponse.json({ success: true, registered: true });
  } catch (error) {
    console.error('Error registering push token:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
