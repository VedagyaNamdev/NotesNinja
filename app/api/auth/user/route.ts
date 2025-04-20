import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the full user data from Supabase
    const supabase = createServerSupabaseClient();
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email!)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user data:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Return user data including profile image
    return NextResponse.json({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      image: userData.image,
      role: userData.role,
    });
  } catch (err) {
    console.error('Error in user API route:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 