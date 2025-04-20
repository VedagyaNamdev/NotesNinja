import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession();
    
    // Check if user is authenticated
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    // Get the new role from request body
    const { role } = await req.json();
    
    // Validate role
    if (role !== 'student' && role !== 'teacher') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid role. Must be "student" or "teacher"' 
      }, { status: 400 });
    }
    
    // Update the role in Supabase
    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from('users')
      .update({ 
        role,
        // Also update the last_sign_in time to ensure the session gets the latest data
        last_sign_in: new Date().toISOString()
      })
      .eq('email', session.user.email);
    
    if (error) {
      console.error('Error updating user role in Supabase:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update role in database' 
      }, { status: 500 });
    }
    
    // Successfully updated the role
    console.log(`Updated role to ${role} for user ${session.user.email}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Role updated successfully',
      role
    });
  } catch (error) {
    console.error('Error in update-role API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 