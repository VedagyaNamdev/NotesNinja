import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// PATCH to update deck progress or flashcard mastery
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const deckId = params.id;
    const data = await request.json();
    
    // Check which update operation to perform
    if (data.progress !== undefined) {
      // Update deck progress using Prisma
      try {
        const result = await db.flashcardDeck.updateMany({
          where: {
            id: deckId,
            userId: session.user.id
          },
          data: {
            progress: data.progress,
            lastStudied: data.lastStudied ? new Date(data.lastStudied) : new Date()
          }
        });
        
        if (result.count === 0) {
          return NextResponse.json(
            { error: 'Deck not found or not authorized to update' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error updating deck progress:', error);
        return NextResponse.json(
          { error: 'Database error updating deck progress' },
          { status: 500 }
        );
      }
    } 
    else if (data.flashcardIds && data.mastered !== undefined) {
      // Update flashcard mastery status using Prisma
      try {
        // First check if the deck belongs to the user
        const deck = await db.flashcardDeck.findFirst({
          where: {
            id: deckId,
            userId: session.user.id
          }
        });
        
        if (!deck) {
          return NextResponse.json(
            { error: 'Deck not found or not authorized to update' },
            { status: 404 }
          );
        }
        
        // Then update the flashcards
        const result = await db.flashcard.updateMany({
          where: {
            id: {
              in: data.flashcardIds
            },
            deckId: deckId
          },
          data: {
            mastered: data.mastered
          }
        });
        
        return NextResponse.json({ 
          success: true,
          updated: result.count
        });
      } catch (error) {
        console.error('Error updating flashcard mastery:', error);
        return NextResponse.json(
          { error: 'Database error updating flashcard mastery' },
          { status: 500 }
        );
      }
    } 
    else {
      return NextResponse.json(
        { error: 'Invalid update parameters' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error updating flashcard deck:', error);
    return NextResponse.json(
      { error: 'Failed to update flashcard deck', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE a flashcard deck
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const deckId = params.id;
    
    // Delete the deck using Prisma
    try {
      const result = await db.flashcardDeck.deleteMany({
        where: {
          id: deckId,
          userId: session.user.id
        }
      });
      
      if (result.count === 0) {
        return NextResponse.json(
          { error: 'Deck not found or not authorized to delete' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting deck from database:', error);
      return NextResponse.json(
        { error: 'Database error deleting deck' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error deleting flashcard deck:', error);
    return NextResponse.json(
      { error: 'Failed to delete flashcard deck', details: error.message },
      { status: 500 }
    );
  }
} 