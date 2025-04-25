import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { syncUserWithDatabase } from "@/lib/auth-sync";

// Export auth options for reuse in other routes
export const authOptions: AuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth",
    // Define your callback URL explicitly to prevent redirect issues
    newUser: "/dashboard-redirect",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Handle both Google and GitHub OAuth sign ins
      if (account?.provider !== "google" && account?.provider !== "github") return false;
      console.log(`User authenticated with ${account.provider}:`, user.email);
      
      try {
        // Sync user details with database
        const syncedUser = await syncUserWithDatabase({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          // Don't set a default role here, let the user select it later
        });
        
        // Check if session-only mode is active
        if (syncedUser._sessionOnly) {
          console.log(`User data saved in session only (not in database): ${user.email}`);
        } else {
          console.log(`User details synced with database: ${user.email}`);
        }
        
        // Always continue signin process regardless of database sync result
        return true;
      } catch (error) {
        console.error(`Error syncing user with database:`, error);
        // Don't fail the sign-in process if database sync fails
        return true;
      }
    },
    async session({ session, token }) {
      // Add user data from token to session
      if (token && session.user) {
        session.user.id = token.sub;
        
        // Add role from token if available
        if (token.role) {
          console.log(`Setting session role from token: ${token.role}`);
          session.user.role = token.role;
        } else {
          console.log("No role found in token");
        }
        
        // Add flag for session-only mode if present
        if (token.sessionOnly) {
          session.user.sessionOnly = true;
        }
        
        // Don't set a default role automatically - let the client handle role selection
        console.log(`Final session user:`, session.user);
      }
      return session;
    },
    async jwt({ token, account, user, trigger, session }) {
      // Initial sign in
      if (account && user) {
        console.log("First-time token creation for user:", user.email);
        token.email = user.email;
        
        // Check if user has the sessionOnly flag and add it to the token
        if ((user as any)._sessionOnly) {
          token.sessionOnly = true;
        }
        
        // Don't set role here - let the user select it
      }
      
      // If we're updating the session, apply changes to token
      if (trigger === 'update' && session?.user?.role) {
        console.log(`Updating token with new role: ${session.user.role}`);
        token.role = session.user.role;
        
        // Maintain sessionOnly flag if it exists
        if (session.user.sessionOnly) {
          token.sessionOnly = true;
        }
      }
      
      return token;
    },
    async redirect({ url, baseUrl }) {
      console.log(`NextAuth redirect called with URL: ${url}, baseUrl: ${baseUrl}`);
      // If the URL is relative or on the same host, allow it
      if (url.startsWith(baseUrl) || url.startsWith('/')) {
        return url;
      }
      // For absolute URLs not on the same host, redirect to dashboard redirect
      return `${baseUrl}/dashboard-redirect`;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Configure NextAuth handlers
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 