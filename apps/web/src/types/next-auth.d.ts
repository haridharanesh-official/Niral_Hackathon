import type { DefaultSession } from "next-auth";
import type { UserRole } from "@hackos/shared";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      xp: number;
    };
  }

  interface User {
    role?: UserRole;
    accessToken?: string;
    xp?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    accessToken?: string;
    xp?: number;
  }
}
