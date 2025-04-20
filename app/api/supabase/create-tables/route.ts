import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    console.log("Creating users table...");
    const supabase = createServerSupabaseClient();
    
    // First check if we can access the users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (!error) {
      console.log("Users table exists and is accessible");
      return NextResponse.json({ 
        message: 'Users table exists',
        exists: true,
        sample: data
      });
    }
    
    console.log("Error accessing users table:", error.message);
    
    // The table doesn't exist or we don't have access
    console.log("Please create the users table manually in the Supabase dashboard");
    
    return NextResponse.json({ 
      message: 'Please create a users table in your Supabase dashboard with the following structure:',
      schema: `
        CREATE TABLE public.users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          image TEXT,
          role TEXT DEFAULT 'student',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          last_sign_in TIMESTAMP WITH TIME ZONE
        );
      `,
      error: error.message,
      code: error.code,
      hint: "The service role key may not have permission to create tables. Please create the table manually in the Supabase dashboard."
    });
  } catch (error) {
    console.error('Error in create-tables route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 