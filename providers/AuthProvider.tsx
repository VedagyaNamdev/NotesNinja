"use client";

import { SessionProvider } from "next-auth/react";

/**
 * NextAuth Session Provider wrapper
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
} 