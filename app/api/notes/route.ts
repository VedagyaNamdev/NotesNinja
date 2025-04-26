import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveNote, getUserNotes, deleteNote } from '@/lib/db-utils';

// GET all notes for the current user
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('GET /api/notes - Authentication failed: No user session');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`GET /api/notes - Fetching notes for user ${session.user.id}`);
    
    // Get notes for the user
    const notes = await getUserNotes(session.user.id);
    
    console.log(`GET /api/notes - Found ${notes.data?.length || 0} notes for user ${session.user.id}`);
    
    // Return with headers that prevent caching to ensure fresh data
    return NextResponse.json(notes, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.error('GET /api/notes - Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes', details: error.message },
      { status: 500 }
    );
  }
}

// POST a new note
export async function POST(request: NextRequest) {
  console.log('POST /api/notes - Starting note creation');
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('POST /api/notes - Authentication failed: No user session');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`POST /api/notes - Authenticated user: ${session.user.id}`);

    // Parse request body
    const data = await request.json();
    console.log(`POST /api/notes - Received note data: title="${data.title}", content length=${data.content?.length || 0}, attachmentId=${data.attachmentId || 'none'}`);
    
    // Validate note data
    if (!data.title || !data.content) {
      console.log('POST /api/notes - Validation failed: Missing title or content');
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Save the note
    console.log(`POST /api/notes - Saving note with title "${data.title}" for user ${session.user.id}`);
    try {
      const note = await saveNote(session.user.id, {
        title: data.title,
        content: data.content,
        summary: data.summary,
        keyTerms: data.keyTerms,
        bullets: data.bullets,
        attachmentId: data.attachmentId
      });
      
      // Check if the note was saved as a session-only note (fallback)
      if (note._sessionOnly) {
        console.log(`POST /api/notes - Note saved as session-only fallback, ID: ${note.id}`);
        console.warn('POST /api/notes - Note saved as session-only fallback due to database issues');
      } else {
        console.log(`POST /api/notes - Note saved successfully in database, ID: ${note.id}`);
      }
      
      // Return with headers that prevent caching to ensure fresh data
      return NextResponse.json(note, {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Content-Type': 'application/json'
        }
      });
    } catch (saveError: any) {
      console.error('POST /api/notes - Error in saveNote function:', saveError);
      return NextResponse.json(
        { 
          error: 'Database error saving note', 
          details: saveError.message || 'Unknown database error'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('POST /api/notes - Unhandled error saving note:', error);
    return NextResponse.json(
      { error: 'Failed to save note', details: error.message },
      { status: 500 }
    );
  }
} 