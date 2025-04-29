import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET all flashcard decks for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decks = await db.flashcardDeck.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        flashcards: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(decks);
  } catch (error) {
    console.error('Error fetching flashcard decks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flashcard decks' },
      { status: 500 }
    );
  }
}

// POST a new flashcard deck
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, cards } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Deck name is required' },
        { status: 400 }
      );
    }

    if (!cards || !Array.isArray(cards)) {
      return NextResponse.json(
        { error: 'Cards array is required' },
        { status: 400 }
      );
    }

    const deck = await db.flashcardDeck.create({
      data: {
        name,
        userId: session.user.id,
        progress: 0,
        flashcards: {
          create: cards.map(card => ({
            question: card.question,
            answer: card.answer,
            mastered: card.mastered || false
          }))
        }
      },
      include: {
        flashcards: true
      }
    });

    return NextResponse.json(deck);
  } catch (error) {
    console.error('Error creating flashcard deck:', error);
    return NextResponse.json(
      { error: 'Failed to create flashcard deck' },
      { status: 500 }
    );
  }
} 