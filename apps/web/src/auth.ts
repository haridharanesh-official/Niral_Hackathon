import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import type { Provider } from "next-auth/providers";
import type { UserRole } from "@hackos/shared";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const providers: Provider[] = [
  Credentials({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      totpCode: { label: "2FA Code", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          totpCode: credentials.totpCode || undefined,
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.requires2FA) {
        throw new Error("2FA_REQUIRED");
      }

      if (!data.accessToken || !data.user) return null;

      return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        image: data.user.image,
        role: data.user.role as UserRole,
        accessToken: data.accessToken,
        xp: data.user.xp,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.role = (user as { role?: UserRole }).role ?? "PARTICIPANT";
        token.xp = (user as { xp?: number }).xp ?? 0;
        token.id = user.id;
      }

      if (account?.provider === "google" || account?.provider === "github") {
        token.role = (token.role as UserRole) ?? "PARTICIPANT";
        token.id = token.sub;
        token.xp = (token.xp as number) ?? 0;
        if (profile && "picture" in profile && !token.picture) {
          token.picture = profile.picture as string;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.role = (token.role as UserRole) ?? "PARTICIPANT";
        session.user.xp = (token.xp as number) ?? 0;
        session.accessToken = token.accessToken as string | undefined;
      }
      return session;
    },
  },
});
