import { compare } from "bcrypt-ts";
import NextAuth, { User, Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { getUser } from "@/db/queries";

import { authConfig } from "./auth.config";

process.env.AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "ai-studio-auth-secret-development-key-32chars";

interface ExtendedSession extends Session {
  user: User;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
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
        session.user.id = token.id as string;
      }

      return session;
    },
  },
});
