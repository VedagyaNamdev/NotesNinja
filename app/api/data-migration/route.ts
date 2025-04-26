import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { migrateUserDataFromLocalStorage } from '@/lib/db-utils';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user ID from session
    const userId = session.user.id;

    // Parse request body (localStorage data)
    const requestData = await request.json();
    const { savedNotes, flashcardDecks, quizResults } = requestData;

    // Validate data
    if (!savedNotes && !flashcardDecks && !quizResults) {
      return NextResponse.json(
        { error: 'No data provided for migration' },
        { status: 400 }
      );
    }

    // Perform migration
    const migrationResults = await migrateUserDataFromLocalStorage(userId, {
      savedNotes,
      flashcardDecks,
      quizResults
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Data migration completed successfully',
      results: migrationResults
    });
  } catch (error: any) {
    console.error('Error during data migration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to migrate data',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 