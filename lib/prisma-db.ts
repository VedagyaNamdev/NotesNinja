import { db } from './db';
import { randomUUID } from 'crypto';

// NOTES
export async function saveNote(userId: string, note: {
  title: string;
  content: string;
  summary?: string;
  keyTerms?: string;
  bullets?: string;
}) {
  return db.note.create({
    data: {
      title: note.title,
      content: note.content,
      summary: note.summary || null,
      keyTerms: note.keyTerms || null,
      bullets: note.bullets || null,
      user: {
        connect: { id: userId }
      }
    }
  });
}

export async function getUserNotes(userId: string) {
  return db.note.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function deleteNote(noteId: string, userId: string) {
  return db.note.deleteMany({
    where: {
      id: noteId,
      userId
    }
  });
}

// FLASHCARDS
export async function createFlashcardDeck(userId: string, deck: {
  name: string;
  cards: {
    question: string;
    answer: string;
    mastered: boolean;
  }[];
}) {
  return db.flashcardDeck.create({
    data: {
      name: deck.name,
      userId,
      progress: 0,
      flashcards: {
        create: deck.cards.map(card => ({
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
}

export async function getUserFlashcardDecks(userId: string) {
  return db.flashcardDeck.findMany({
    where: {
      userId
    },
    include: {
      flashcards: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function updateFlashcardDeckProgress(deckId: string, userId: string, progress: number, lastStudied: Date = new Date()) {
  return db.flashcardDeck.updateMany({
    where: {
      id: deckId,
      userId
    },
    data: {
      progress,
      lastStudied
    }
  });
}

export async function updateFlashcardsMastery(deckId: string, userId: string, flashcardIds: string[], mastered: boolean) {
  // First verify the deck belongs to this user
  const deck = await db.flashcardDeck.findFirst({
    where: {
      id: deckId,
      userId
    }
  });
  
  if (!deck) {
    throw new Error('Unauthorized deck access');
  }
  
  // Update all flashcards with the provided IDs
  return db.flashcard.updateMany({
    where: {
      deckId,
      id: {
        in: flashcardIds
      }
    },
    data: {
      mastered
    }
  });
}

export async function deleteFlashcardDeck(deckId: string, userId: string) {
  return db.flashcardDeck.deleteMany({
    where: {
      id: deckId,
      userId
    }
  });
}

// QUIZ RESULTS
export async function saveQuizResult(userId: string, result: {
  score: number;
  questions: number;
  correct: number;
}) {
  return db.quizResult.create({
    data: {
      score: result.score,
      questions: result.questions,
      correct: result.correct,
      user: {
        connect: { id: userId }
      }
    }
  });
}

export async function getUserQuizResults(userId: string) {
  return db.quizResult.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

// DATA MIGRATION
export async function migrateUserDataFromLocalStorage(userId: string, localData: {
  savedNotes?: any[];
  flashcardDecks?: any[];
  quizResults?: any[];
}) {
  const results = {
    notes: 0,
    flashcardDecks: 0,
    quizResults: 0
  };

  // Transaction to ensure all or nothing is saved
  await db.$transaction(async (tx) => {
    // Migrate notes
    if (localData.savedNotes && localData.savedNotes.length > 0) {
      for (const note of localData.savedNotes) {
        await tx.note.create({
          data: {
            title: note.title || 'Untitled Note',
            content: note.content || '',
            summary: note.summary || null,
            keyTerms: note.keyTerms || null,
            bullets: note.bullets || null,
            user: { connect: { id: userId } }
          }
        });
        results.notes++;
      }
    }

    // Migrate flashcard decks
    if (localData.flashcardDecks && localData.flashcardDecks.length > 0) {
      for (const deck of localData.flashcardDecks) {
        await tx.flashcardDeck.create({
          data: {
            name: deck.name || 'Untitled Deck',
            progress: deck.progress || 0,
            lastStudied: deck.lastStudied ? new Date(deck.lastStudied) : null,
            user: { connect: { id: userId } },
            flashcards: {
              create: (deck.cards || []).map((card: any) => ({
                question: card.question || 'Question',
                answer: card.answer || 'Answer',
                mastered: card.mastered || false
              }))
            }
          }
        });
        results.flashcardDecks++;
      }
    }

    // Migrate quiz results
    if (localData.quizResults && localData.quizResults.length > 0) {
      for (const result of localData.quizResults) {
        await tx.quizResult.create({
          data: {
            score: result.score || 0,
            questions: result.questions || 0,
            correct: result.correct || 0,
            user: { connect: { id: userId } }
          }
        });
        results.quizResults++;
      }
    }
  });

  return results;
} 