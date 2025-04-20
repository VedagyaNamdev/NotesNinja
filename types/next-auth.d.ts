import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

// Extend the next-auth module to have our custom session and user properties
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
    } & DefaultSession["user"];
  }
}

// Extend the JWT module to include our custom token properties
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    provider?: string;
    role?: string;
  }
} 