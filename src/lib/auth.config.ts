import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe part of the Auth.js config, shared by middleware and the full config
 * in auth.ts. Nothing here may import Prisma or bcrypt.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  trustHost: true,
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
