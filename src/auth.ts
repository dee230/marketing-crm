import NextAuth, { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from './lib/audit-log';

export const authConfig: NextAuthOptions = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const users = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, credentials.email as string))
          .limit(1);

        const user = users[0];
        if (!user) {
          return null;
        }

        if (user.password !== credentials.password) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Log successful sign in
      if (user?.id) {
        await logAudit({
          userId: user.id as string,
          action: 'user_signed_in',
          entityType: 'user',
          entityId: user.id as string,
          details: { email: user.email },
        });
      }
    },
    async signOut({ session }) {
      // Log sign out - user is in session
      if (session?.user?.id) {
        await logAudit({
          userId: session.user.id as string,
          action: 'user_signed_out',
          entityType: 'user',
          entityId: session.user.id as string,
        });
      }
    },
  },
  pages: {
    signIn: '/sign-in',
  },
  session: {
    strategy: 'jwt',
  },
};

export default NextAuth(authConfig);
export const authOptions = authConfig;