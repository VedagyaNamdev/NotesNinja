import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    console.log("Testing Supabase connection...");
    const supabase = createServerSupabaseClient();
    
    // First try to create the users table directly with SQL
    console.log("Creating users table if it doesn't exist...");
    const { error: createError } = await supabase
      .from('users')
      .insert({
        email: 'temp@example.com',
        name: 'Temp User',
        role: 'student',
      })
      .select();
    
    if (createError) {
      console.error("Error on initial insert (table might not exist):", createError);
      
      // Try to manually create the table with raw SQL queries via the REST API
      console.log("Attempting to create users table via Supabase REST API...");
      
      try {
        // Get the Supabase URL and key
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Missing Supabase URL or service role key");
        }
        
        // Use the REST API directly with auth headers
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            command: `
              CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                image TEXT,
                role TEXT DEFAULT 'student',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                last_sign_in TIMESTAMP WITH TIME ZONE
              );
            `
          })
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error("Failed to create table via REST API:", errorData);
          return NextResponse.json({ 
            success: false, 
            error: "Failed to create users table via REST API",
            details: errorData,
            statusCode: response.status,
            statusText: response.statusText
          }, { status: 500 });
        }
        
        console.log("Table created successfully via REST API");
      } catch (restError) {
        console.error("Error creating table via REST API:", restError);
        
        // Try another approach - create a table with basic structure via Supabase client
        try {
          console.log("Trying alternative approach to create users table...");
          
          // Create a temporary table to check if we have permissions
          const { error: tempTableError } = await supabase
            .from('temp_users')
            .insert({ id: 1, name: 'test' });
          
          console.log("Temp table test result:", tempTableError ? "Failed" : "Success");
          
          return NextResponse.json({ 
            success: false,
            error: "Cannot create or access the users table",
            message: "Please create the 'users' table in your Supabase dashboard with the following fields: id, email, name, image, role, created_at, last_sign_in",
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
            serviceRoleKeyProvided: !!process.env.SUPABASE_SERVICE_ROLE_KEY
          });
        } catch (altError) {
          console.error("Alternative table creation failed:", altError);
        }
      }
    }
    
    // Test the connection by inserting a test user
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      role: 'student',
      created_at: new Date().toISOString(),
    };
    
    console.log("Attempting to insert test user:", testUser);
    const { data, error } = await supabase
      .from('users')
      .insert(testUser)
      .select();
    
    if (error) {
      console.error("Failed to insert test user:", error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code,
        hint: "Please check the Supabase dashboard and make sure the 'users' table exists with the correct fields."
      }, { status: 500 });
    }
    
    console.log("Test user inserted successfully:", data);
    return NextResponse.json({ 
      success: true, 
      message: "Supabase connection is working correctly",
      data: data
    });
  } catch (error) {
    console.error("Error testing Supabase connection:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 