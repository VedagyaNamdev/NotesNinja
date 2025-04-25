import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

// Extend the next-auth module to have our custom session and user properties
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      supabaseId?: string;
      sessionOnly?: boolean;
    } & DefaultSession["user"];
  }
  
  interface User extends DefaultUser {
    role?: string;
    supabaseId?: string;
    _sessionOnly?: boolean;
  }
}

// Extend the JWT module to include our custom token properties
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    supabaseId?: string;
    sessionOnly?: boolean;
  }
} 