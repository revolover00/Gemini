import { compare } from "bcrypt-ts";
import NextAuth, { User, Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { createUser, getUser } from "@/db/queries";

import { authConfig } from "./auth.config";

process.env.AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "ai-studio-auth-secret-development-key-32chars";

interface ExtendedSession extends Session {
  user: User;
}

const DEFAULT_USER: User = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "guest@chatbot.local",
  name: "Guest",
};

const DEFAULT_SESSION: Session = {
  user: DEFAULT_USER,
  expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
};

const nextAuthInstance = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password, isGuest }: any) {
        if (isGuest === "true" || isGuest === true) {
          const guestEmail = `guest_${Math.random().toString(36).substring(2, 9)}@example.com`;
          const createdUsers = await createUser(guestEmail, "guest_password_secure");
          return createdUsers[0] as any;
        }

        let users = await getUser(email);
        if (users.length === 0) return null;
        let passwordsMatch = await compare(password, users[0].password!);
        if (passwordsMatch) return users[0] as any;
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session.user) {
        session.user.id = (token.id as string) || DEFAULT_USER.id!;
      }

      return session;
    },
  },
});

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
} = nextAuthInstance;

export async function auth(): Promise<Session> {
  try {
    const session = await nextAuthInstance.auth();
    if (session && session.user) {
      return session;
    }
  } catch {
    // fallback to default guest session
  }
  return DEFAULT_SESSION;
}

