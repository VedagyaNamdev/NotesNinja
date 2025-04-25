import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { saveNote, getUserNotes, deleteNote } from '@/lib/db-utils';

// GET all notes for the current user
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get notes for the user
    const notes = await getUserNotes(session.user.id);
    
    return NextResponse.json(notes);
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes', details: error.message },
      { status: 500 }
    );
  }
}

// POST a new note
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

    // Parse request body
    const data = await request.json();
    
    // Validate note data
    if (!data.title || !data.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Save the note
    const note = await saveNote(session.user.id, {
      title: data.title,
      content: data.content,
      summary: data.summary,
      keyTerms: data.keyTerms,
      bullets: data.bullets
    });
    
    return NextResponse.json(note);
  } catch (error: any) {
    console.error('Error saving note:', error);
    return NextResponse.json(
      { error: 'Failed to save note', details: error.message },
      { status: 500 }
    );
  }
} 