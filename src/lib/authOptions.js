import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { isLocalDevWithoutDatabase, localAdminUser } from '@/lib/localDev';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();

        if (isLocalDevWithoutDatabase()) {
          if (email === localAdminUser.email && credentials.password === localAdminUser.password) {
            return {
              id: localAdminUser.id,
              email: localAdminUser.email,
              name: localAdminUser.name,
            };
          }
          return null;
        }

        const admin = await prisma.admin.findUnique({
          where: { email },
        });

        if (!admin) return null;

        const isValid = await bcrypt.compare(credentials.password, admin.password);
        if (!isValid) return null;

        return { id: admin.id, email: admin.email, name: admin.name };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  secret: process.env.NEXTAUTH_SECRET || (isLocalDevWithoutDatabase() ? 'vasundhara-local-dev-secret' : undefined),
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { session.user.id = token.id; }
      return session;
    },
  },
};

export function createAuthHandler() {
  return NextAuth(authOptions);
}
