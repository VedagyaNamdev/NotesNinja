import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { createServerSupabaseClient } from "@/lib/supabase";

// Configure NextAuth handlers
const handler = NextAuth({
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
  },
  callbacks: {
    async signIn({ user, account }) {
      // Handle both Google and GitHub OAuth sign ins
      if (account?.provider !== "google" && account?.provider !== "github") return false;

      console.log(`User authenticated with ${account.provider}:`, user.email);
      
      try {
        // Store user in Supabase database
        const supabase = createServerSupabaseClient();
        
        // Check if user already exists
        const { data: existingUser, error: queryError } = await supabase
          .from("users")
          .select("*")
          .eq("email", user.email!)
          .maybeSingle();
        
        if (queryError) {
          console.error("Error checking for existing user:", queryError);
          // Don't fail the sign-in
        }
        
        if (!existingUser) {
          // User doesn't exist, create a new record - but don't set a role yet
          console.log("Creating new user in Supabase:", user.email);
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              email: user.email!,
              name: user.name,
              image: user.image,
              // Don't set a role - we'll select it after auth
              created_at: new Date().toISOString(),
              last_sign_in: new Date().toISOString(),
            });
          
          if (insertError) {
            console.error("Error creating user in Supabase:", insertError);
          } else {
            console.log("Successfully created user in Supabase:", user.email);
          }
        } else {
          // User exists, update last sign-in time
          console.log("Updating existing user in Supabase:", user.email);
          const { error: updateError } = await supabase
            .from("users")
            .update({
              last_sign_in: new Date().toISOString(),
              // Update other fields that might have changed
              name: user.name,
              image: user.image,
            })
            .eq("email", user.email!);
          
          if (updateError) {
            console.error("Error updating user in Supabase:", updateError);
          } else {
            console.log("Successfully updated user in Supabase:", user.email);
          }
        }
      } catch (error) {
        console.error("Error in signIn callback:", error);
        // Don't fail the sign-in even if Supabase storage fails
      }
      
      return true;
    },
    async session({ session, token }) {
      // Add user data from token to session
      if (token && session.user) {
        session.user.id = token.sub;
        
        // Add role from token
        if (token.role) {
          session.user.role = token.role;
        }
        
        try {
          // Get user data from Supabase
          const supabase = createServerSupabaseClient();
          const { data: userData, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", session.user.email!)
            .maybeSingle();
          
          if (userData && !error) {
            // Add Supabase user data to session
            session.user.role = userData.role;
            // Make sure to include image from database if available
            if (userData.image) {
              session.user.image = userData.image;
            }
            // You can add other Supabase fields as needed
            session.user.supabaseId = userData.id;
            
            console.log("Session updated with user data:", {
              role: userData.role,
              hasImage: !!userData.image
            });
          } else if (error) {
            console.error("Cannot get user data from Supabase:", error.message);
          }
        } catch (error) {
          console.error("Error in session callback:", error);
        }
      }
      return session;
    },
    async jwt({ token, account, profile, user }) {
      // Persist the OAuth provider's data to token
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }

      // If we have user data available, add the role
      if (user) {
        // Add user role to token
        const supabase = createServerSupabaseClient();
        const { data: userData, error } = await supabase
          .from("users")
          .select("role")
          .eq("email", user.email!)
          .maybeSingle();
        
        if (userData && userData.role) {
          token.role = userData.role;
        }
      }
      
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST }; 