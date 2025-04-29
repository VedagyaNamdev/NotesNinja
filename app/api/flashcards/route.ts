import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET all flashcard decks for the current user
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

    try {
      // Get the user's flashcard decks with flashcards included using Prisma
      const decks = await db.flashcardDeck.findMany({
        where: {
          userId: session.user.id
        },
        include: {
          flashcards: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return NextResponse.json({ decks });
    } catch (dbError) {
      console.error('Error fetching flashcard decks:', dbError);
      return NextResponse.json(
        { error: 'Database error', details: dbError.message, decks: [] },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error handling GET request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flashcard decks', details: error.message, decks: [] },
      { status: 500 }
    );
  }
}

// POST a new flashcard deck
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
    
    // Validate deck data
    if (!data.name) {
      return NextResponse.json(
        { error: 'Deck name is required' },
        { status: 400 }
      );
    }
    
    if (!data.cards || !Array.isArray(data.cards)) {
      return NextResponse.json(
        { error: 'Cards must be provided as an array' },
        { status: 400 }
      );
    }
    
    if (data.cards.length === 0) {
      return NextResponse.json(
        { error: 'At least one card is required' },
        { status: 400 }
      );
    }
    
    // Validate individual cards
    const invalidCards = data.cards.filter((card: any) => 
      !card.question || !card.answer ||
      typeof card.question !== 'string' || 
      typeof card.answer !== 'string'
    );
    
    if (invalidCards.length > 0) {
      return NextResponse.json(
        { 
          error: 'All cards must have both question and answer as strings',
          invalidCount: invalidCards.length 
        },
        { status: 400 }
      );
    }

    try {
      // Create the flashcard deck directly using Prisma
      const deck = await db.flashcardDeck.create({
        data: {
        name: data.name,
          userId: session.user.id,
          progress: 0,
          flashcards: {
            create: data.cards.map((card: any) => ({
          question: card.question || card.front,
          answer: card.answer || card.back,
          mastered: card.mastered || false
        }))
          }
        },
        include: {
          flashcards: true
        }
      });
      
      return NextResponse.json(deck);
    } catch (dbError: any) {
      console.error('Database error creating flashcard deck:', dbError);
      return NextResponse.json(
        { error: 'Database error', details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error creating flashcard deck:', error);
    return NextResponse.json(
      { error: 'Failed to create flashcard deck', details: error.message },
      { status: 500 }
    );
  }
} 