import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET all quiz results for the current user
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      // Get the user's quiz results using Prisma
      const results = await db.quizResult.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
        
      return NextResponse.json({ results });
    } catch (dbError) {
      console.error('Failed to connect to database:', dbError);
      // Return empty results with a warning message
      return NextResponse.json({ 
        results: [],
        warning: 'Database connection failed',
        userOnly: true
      });
    }
  } catch (error: any) {
    console.error('Error fetching quiz results:', error);
    // Return empty results instead of error status
    return NextResponse.json({ 
      results: [],
      error: 'Failed to fetch quiz results', 
      details: error.message 
    });
  }
}

// POST a new quiz result
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { score, questions, correct } = body;
    
    // Validate required fields
    if (score === undefined || questions === undefined || correct === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: score, questions, correct' },
        { status: 400 }
      );
    }

    try {
      // Save the quiz result using Prisma
      const result = await db.quizResult.create({
        data: {
          score,
          questions,
          correct,
          user: {
            connect: { id: session.user.id }
          }
        }
      });
        
      return NextResponse.json({ success: true, result });
    } catch (dbError) {
      console.error('Failed to save quiz result to database:', dbError);
      // Return success with local storage only flag
      return NextResponse.json({ 
        success: true,
        result: {
          id: randomUUID(),
          createdAt: new Date(),
          score,
          questions,
          correct,
          userId: session.user.id
        },
        warning: 'Saved locally only (database connection failed)',
        localOnly: true
      });
    }
  } catch (error: any) {
    console.error('Error saving quiz result:', error);
    return NextResponse.json(
      { error: 'Failed to save quiz result', details: error.message },
      { status: 500 }
    );
  }
} 