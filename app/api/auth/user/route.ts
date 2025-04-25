import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * API endpoint to get the current user's data
 * Falls back to session data if database access fails
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Create session-only fallback user
    const sessionOnlyUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      role: session.user.role || 'student',
      _sessionOnly: true
    };
    
    try {
      // Try to get user data from database
      const userData = await db.user.findUnique({
        where: { id: session.user.id }
      });
      
      if (!userData) {
        console.warn('User not found in database, using session data');
        return NextResponse.json({
          ...sessionOnlyUser,
          message: 'User not found in database'
        });
      }
      
      // Return database user data
      return NextResponse.json(userData);
    } catch (dbError) {
      console.error('Error accessing database:', dbError);
      
      // Return session data as fallback
      return NextResponse.json({
        ...sessionOnlyUser,
        message: 'Error accessing database, using session data'
      });
    }
  } catch (error: any) {
    console.error('Error in user API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get user data', 
        details: error.message
      },
      { status: 500 }
    );
  }
} 