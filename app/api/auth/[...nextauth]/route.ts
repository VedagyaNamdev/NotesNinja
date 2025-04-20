import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
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
  ],
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Only handle Google OAuth sign ins
      if (account?.provider !== "google") return false;

      console.log("User authenticated with Google:", user.email);
      
      // Since we can't always create tables automatically, 
      // we'll just let the authentication succeed and handle 
      // the Supabase integration separately
      
      // Store the user info in session, even if we can't save to Supabase yet
      return true;
    },
    async session({ session, token }) {
      // Add user data from token to session
      if (token && session.user) {
        session.user.id = token.sub;
        
        try {
          // Try to get user role from Supabase if the table exists
          const supabase = createServerSupabaseClient();
          const { data: userData, error } = await supabase
            .from("users")
            .select("role")
            .eq("email", session.user.email!)
            .maybeSingle(); // This won't throw an error if no match or if table doesn't exist
          
          if (userData && !error) {
            // Only add role from Supabase if no error
            session.user.role = userData.role;
          } else if (error) {
            console.log("Cannot get user role from Supabase:", error.message);
            
            // Attempt to insert the user info if possible
            if (error.code !== "PGRST116") { // Not a "not found" error
              try {
                // Try to insert the user if the table exists
                const { error: insertError } = await supabase
                  .from("users")
                  .insert({
                    email: session.user.email!,
                    name: session.user.name,
                    image: session.user.image,
                    role: 'student', // Default role
                    created_at: new Date().toISOString(),
                  })
                  .select()
                  .single();
                
                if (!insertError) {
                  console.log("Successfully added user to Supabase:", session.user.email);
                  session.user.role = 'student';
                }
              } catch (insertErr) {
                console.error("Failed to add user to Supabase:", insertErr);
              }
            }
          }
        } catch (error) {
          console.error("Error in session callback:", error);
        }
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      // Persist the OAuth provider's data to token
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST }; 