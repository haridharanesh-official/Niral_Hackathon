import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { UserRole } from '@hackos/shared';
import { apiOrigin } from '@/lib/api-origin';
const apiUrl = apiOrigin();
class AccountSignInError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === 'development'
      ? 'hackos-local-development-auth-secret-change-before-deploy'
      : undefined),
  session: { strategy: 'jwt', maxAge: 30 * 60 },
  pages: { signIn: '/login', error: '/login' },
  // OAuth remains unavailable until provider identities can be exchanged for a NestJS-authorized session.
  providers: [
    Credentials({
      name: 'Email',
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!apiUrl) throw new AccountSignInError('service_unavailable');
        if (
          typeof credentials.email !== 'string' ||
          typeof credentials.password !== 'string'
        )
          return null;
        let response: Response;
        try {
          response = await fetch(`${apiUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email.trim().toLowerCase(),
              password: credentials.password,
            }),
            signal: AbortSignal.timeout(10000),
          });
        } catch {
          throw new AccountSignInError('service_unavailable');
        }
        const data = await response.json();
        if (!response.ok) {
          const codes: Record<string, string> = {
            EMAIL_UNVERIFIED: 'email_unverified',
            SECURITY_TRANSITION_REQUIRED: 'security_transition_required',
          };
          throw new AccountSignInError(
            codes[data.code] ??
              (response.status === 429
                ? 'rate_limited'
                : response.status >= 500
                  ? 'service_unavailable'
                  : 'invalid_credentials'),
          );
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
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.xp = user.xp;
      }
      if (!token.accessToken) return null;
      try {
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token.accessToken}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) return null;
        const current = await response.json();
        token.id = current.id;
        token.role = current.role;
        token.name = current.name;
        token.email = current.email;
      } catch {
        return null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.xp = Number(token.xp ?? 0);
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ('token' in message && message.token?.accessToken) {
        await fetch(`${apiUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${message.token.accessToken}` },
          signal: AbortSignal.timeout(5000),
        }).catch(() => undefined);
      }
    },
  },
});
