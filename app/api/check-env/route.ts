import { NextResponse } from 'next/server';

export async function GET() {
  // Check all environment variables needed for authentication
  const envVars = {
    // NextAuth
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    
    // Google OAuth
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    
    // GitHub OAuth
    GITHUB_CLIENT_ID: !!process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: !!process.env.GITHUB_CLIENT_SECRET,
    
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    // Node environment
    NODE_ENV: process.env.NODE_ENV,
  };
  
  // Check if any required variables are missing
  const missingVars = Object.entries(envVars)
    .filter(([key, value]) => value === false)
    .map(([key]) => key);
  
  const allAuthVarsPresent = 
    envVars.NEXTAUTH_SECRET && 
    ((envVars.GOOGLE_CLIENT_ID && envVars.GOOGLE_CLIENT_SECRET) || 
     (envVars.GITHUB_CLIENT_ID && envVars.GITHUB_CLIENT_SECRET));
  
  const allSupabaseVarsPresent = 
    envVars.NEXT_PUBLIC_SUPABASE_URL && 
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
    envVars.SUPABASE_SERVICE_ROLE_KEY;
  
  return NextResponse.json({
    environment: envVars.NODE_ENV,
    authVariablesPresent: allAuthVarsPresent,
    supabaseVariablesPresent: allSupabaseVarsPresent,
    missingVariables: missingVars,
    allVariablesPresent: missingVars.length === 0,
    status: missingVars.length === 0 ? 'ok' : 'missing_variables',
    message: missingVars.length === 0 
      ? 'All environment variables are set' 
      : `Missing environment variables: ${missingVars.join(', ')}`,
  });
} 