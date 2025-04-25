import { NextResponse } from 'next/server';

// This API route checks for the presence of critical environment variables
export async function GET() {
  const envVariables = [
    {
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing'
    },
    {
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing'
    },
    {
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      status: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing'
    },
    {
      name: 'DATABASE_URL',
      status: process.env.DATABASE_URL ? 'present' : 'missing'
    },
    {
      name: 'NEXTAUTH_SECRET',
      status: process.env.NEXTAUTH_SECRET ? 'present' : 'missing'
    }
  ];

  // Return the status of each environment variable
  return NextResponse.json({
    variables: envVariables,
    allPresent: envVariables.every(v => v.status === 'present')
  });
} 