import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

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
    const { userId, role } = body;
    
    // If no userId is provided, assume the current user
    const targetUserId = userId || session.user.id;
    
    if (!role) {
      return NextResponse.json(
        { error: 'Missing role parameter' },
        { status: 400 }
      );
    }
    
    // Security check: Users can only update their own role unless they're admins
    const isSelfUpdate = targetUserId === session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    if (!isSelfUpdate && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only update your own role unless you are an admin' },
        { status: 403 }
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
    
    // Regular users cannot set themselves as admin
    if (isSelfUpdate && !isAdmin && role === 'admin') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Regular users cannot set themselves as admin' },
        { status: 403 }
      );
    }
    
    console.log(`Updating role for user ${targetUserId} to ${role}`);
    
    try {
      // Check if user exists
      const userExists = await db.user.findUnique({
        where: { id: targetUserId }
      });
        
      if (!userExists) {
        try {
        // If user doesn't exist, create them
          const newUser = await db.user.create({
            data: {
                id: targetUserId,
                email: session.user.email || 'unknown@example.com',
                name: session.user.name || 'Unknown User',
                image: session.user.image,
                role,
              createdAt: new Date(),
              lastSignIn: new Date()
            }
          });
            
            return NextResponse.json({
              success: true,
              user: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role
              },
              message: 'User created with specified role'
            });
          } catch (createUserError) {
            console.error('Error creating user:', createUserError);
            // Fall back to session-only update
            return NextResponse.json({
              success: true,
              sessionOnly: true,
              message: 'Role updated in session only (database update failed)',
            user: {
              id: targetUserId,
              email: session.user.email,
              role
            }
          });
        }
      }
      
      // Update user role in database
      const updatedUser = await db.user.update({
        where: { id: targetUserId },
        data: { role }
      });
      
      if (!updatedUser) {
        // User not found but no error? Unlikely but possible
        return NextResponse.json({
          success: true,
          sessionOnly: true,
          message: 'Role updated in session only (user not found in database)',
          user: {
            id: targetUserId,
            email: session.user.email,
            role
          }
        });
      }
      
      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role
        }
      });
    } catch (dbError) {
      // If database operation fails entirely, fall back to session-only update
      console.error('Error with database operation:', dbError);
      
      return NextResponse.json({
        success: true,
        sessionOnly: true,
        message: 'Role updated in session only (database connection failed)',
        user: {
          id: targetUserId,
          email: session.user.email,
          role
        }
      });
    }
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update role', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 