/**
 * Auth.js module augmentation.
 *
 * Auth.js ships `Session["user"]` with only name/email/image. We attach `id`
 * and `role` in the jwt/session callbacks, so those need declaring here or
 * every read is an `any` cast and the permission helpers lose their type
 * safety.
 */

import type { UserRole } from "@/types/domain";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      sessionVersion?: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    sessionVersion?: number;
  }
}

export {};
