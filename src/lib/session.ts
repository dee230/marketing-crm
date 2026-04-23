import { cookies } from 'next/headers';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function getSession(): Promise<{ user: SessionUser } | null> {
  const cookieStore = await cookies();
  
  // Try our custom session first
  const customSession = cookieStore.get('crm-session');
  if (customSession) {
    try {
      const decoded = JSON.parse(Buffer.from(customSession.value, 'base64').toString());
      if (decoded.exp && decoded.exp < Date.now()) {
        return null;
      }
      return {
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
        },
      };
    } catch {
      // Invalid session, continue to check NextAuth
    }
  }

  // Fallback to NextAuth session
  const nextAuthSession = cookieStore.get('next-auth.session-token');
  if (nextAuthSession) {
    try {
      const decoded = JSON.parse(Buffer.from(nextAuthSession.value, 'base64').toString());
      if (decoded.exp && decoded.exp < Date.now()) {
        return null;
      }
      return {
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
        },
      };
    } catch {
      return null;
    }
  }

  return null;
}