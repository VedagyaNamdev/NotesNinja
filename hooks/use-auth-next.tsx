"use client";

import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

// NextAuth Session Provider wrapper
export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

// Hook for using NextAuth session
export function useNextAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  // Gets the user's role from Supabase data or defaults
  // You'll need to customize this based on your Supabase schema
  const getUserRole = () => {
    // This is a placeholder - you'll need to implement proper role handling
    // based on your database structure
    return session?.user ? "student" : null;
  };

  const login = () => {
    signIn("google");
  };

  const logout = () => {
    signOut({ callbackUrl: '/auth' });
  };

  return {
    session,
    isLoading,
    isAuthenticated,
    userRole: getUserRole(),
    login,
    logout,
  };
} 