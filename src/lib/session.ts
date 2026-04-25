import { cookies } from 'next/headers';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

function base64Decode(str: string): string {
  const buff = Buffer.from(str, 'base64');
  return buff.toString('utf-8');
}

export async function getSession(): Promise<{ user: SessionUser } | null> {
  const cookieStore = await cookies();
  
  // Try our custom session first
  const customSession = cookieStore.get('crm-session');
  
  if (customSession) {
    try {
      const decoded = JSON.parse(base64Decode(customSession.value));
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
      // Invalid session
    }
  }

  // Fallback to NextAuth session
  const nextAuthSession = cookieStore.get('next-auth.session-token');
  if (nextAuthSession) {
    try {
      const decoded = JSON.parse(base64Decode(nextAuthSession.value));
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