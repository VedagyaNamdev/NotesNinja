import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * Session-only role update endpoint
 * This API route updates only the session role without requiring database access
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { role } = body;
    
    if (!role) {
      return NextResponse.json(
        { error: 'Missing role parameter' },
        { status: 400 }
      );
    }
    
    // Validate role
    const validRoles = ['student', 'teacher', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }
    
    // No database operations - just return success for session update
    console.log(`Session-only role update to ${role} for user ${session.user.id}`);
    
    return NextResponse.json({
      success: true,
      sessionOnly: true,
      message: 'Role updated in session only',
      user: {
        id: session.user.id,
        email: session.user.email,
        role
      }
    });
  } catch (error: any) {
    console.error('Error in session-only role update:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update session role', 
        details: error.message 
      },
      { status: 500 }
    );
  }
} 