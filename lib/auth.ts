// This file sets up the Next Auth authentication configuration

import { NextAuthOptions } from "next-auth";
import { syncUserWithDatabase } from "./auth-sync";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // If a new sign-in, sync user data with database
      if (user) {
        await syncUserWithDatabase({
          id: user.id,
          email: user.email || null,
          name: user.name || null,
          image: user.image || null,
          role: (user as any).role || 'student',
        });
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';
        // Default role is student
        session.user.role = (token as any).role || 'student';
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirect after sign in
      // If the URL contains a role parameter, use it for redirection
      try {
        const urlObj = new URL(url);
        const role = urlObj.searchParams.get('role') || 'student';
        
        // Always redirect to dashboard directly with noredirect parameter
        return `${baseUrl}/${role}/dashboard?noredirect=true`;
      } catch (error) {
        // If URL parsing fails, just go to student dashboard
        return `${baseUrl}/student/dashboard?noredirect=true`;
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};

export default authOptions; 