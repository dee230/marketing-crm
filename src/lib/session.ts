import { cookies } from 'next/headers';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function getSession(): Promise<{ user: SessionUser } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('crm-session');

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    
    // Check expiration
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