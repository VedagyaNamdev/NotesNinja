import { randomUUID } from 'crypto';
import { db } from './db';

// Re-export functions from prisma-db.ts for backward compatibility
export * from './prisma-db';

// Session-only fallback flag
const SESSION_ONLY_FLAG = '_sessionOnly';

// NOTES
export async function saveNote(userId: string, note: {
  title: string;
  content: string;
  summary?: string;
  keyTerms?: string;
  bullets?: string;
}) {
  try {
    const createdNote = await db.note.create({
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
    
    return createdNote;
  } catch (error) {
    console.error('Error in saveNote:', error);
    // Return session-only fallback
    return {
      id: randomUUID(),
      title: note.title,
      content: note.content,
      summary: note.summary || null,
      keyTerms: note.keyTerms || null,
      bullets: note.bullets || null,
      userId,
      createdAt: new Date(),
      [SESSION_ONLY_FLAG]: true
    };
  }
}

export async function getUserNotes(userId: string) {
  try {
    const notes = await db.note.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return { data: notes };
  } catch (error) {
    console.error('Exception in getUserNotes:', error);
    return { data: [], error, [SESSION_ONLY_FLAG]: true };
  }
}

export async function deleteNote(noteId: string, userId: string) {
  try {
    const result = await db.note.deleteMany({
      where: {
        id: noteId,
        userId: userId
      }
    });
    
    return { data: result, count: result.count };
  } catch (error) {
    console.error('Exception in deleteNote:', error);
    return { data: null, error, [SESSION_ONLY_FLAG]: true };
  }
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
  try {
    const newDeck = await db.flashcardDeck.create({
      data: {
        name: deck.name,
        userId: userId,
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
    
    return {
      id: newDeck.id,
      name: newDeck.name,
      userId: newDeck.userId,
      progress: newDeck.progress,
      createdAt: newDeck.createdAt,
      lastStudied: newDeck.lastStudied,
      flashcards: newDeck.flashcards
    };
  } catch (error) {
    console.error('Exception in createFlashcardDeck:', error);
    throw error; // Let the API route handle the error
  }
}

export async function getUserFlashcardDecks(userId: string) {
  try {
    const decks = await db.flashcardDeck.findMany({
      where: {
        userId: userId
      },
      include: {
        flashcards: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return decks;
  } catch (error) {
    console.error('Error fetching flashcard decks:', error);
    throw new Error(`Failed to fetch flashcard decks: ${error.message}`);
  }
}

export async function getFlashcardsForDeck(deckId: string) {
  try {
    const flashcards = await db.flashcard.findMany({
      where: {
        deckId: deckId
      }
    });
    
    return flashcards;
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    throw new Error(`Failed to fetch flashcards: ${error.message}`);
  }
}

export async function updateFlashcardDeckProgress(deckId: string, userId: string, progress: number, lastStudied: Date = new Date()) {
  try {
    const result = await db.flashcardDeck.updateMany({
      where: {
        id: deckId,
        userId: userId
      },
      data: {
        progress,
        lastStudied
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error updating flashcard deck progress:', error);
    throw new Error(`Failed to update deck progress: ${error.message}`);
  }
}

export async function updateFlashcardsMastery(deckId: string, userId: string, flashcardIds: string[], mastered: boolean) {
  try {
    // First verify the deck belongs to this user
    const deckExists = await db.flashcardDeck.findFirst({
      where: {
        id: deckId,
        userId: userId
      }
    });
    
    if (!deckExists) {
      throw new Error('Unauthorized deck access');
    }
    
    // Then update the flashcards
    const result = await db.flashcard.updateMany({
      where: {
        id: {
          in: flashcardIds
        },
        deckId: deckId
      },
      data: {
        mastered
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error updating flashcards mastery:', error);
    throw new Error(`Failed to update flashcards mastery: ${error.message}`);
  }
}

export async function deleteFlashcardDeck(deckId: string, userId: string) {
  try {
    // Verify the deck belongs to this user
    const deckExists = await db.flashcardDeck.findFirst({
      where: {
        id: deckId,
        userId: userId
      }
    });
    
    if (!deckExists) {
      throw new Error('Unauthorized deck access');
    }
    
    // Delete the deck (associated flashcards will be deleted via cascade)
    const result = await db.flashcardDeck.deleteMany({
      where: {
        id: deckId
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error deleting flashcard deck:', error);
    throw new Error(`Failed to delete flashcard deck: ${error.message}`);
  }
}

// QUIZ RESULTS
export async function saveQuizResult(userId: string, result: {
  score: number;
  questions: number;
  correct: number;
}) {
  try {
    const savedResult = await db.quizResult.create({
      data: {
        score: result.score,
        questions: result.questions,
        correct: result.correct,
        user: {
          connect: { id: userId }
        }
      }
    });
    
    return savedResult;
  } catch (error) {
    console.error('Error saving quiz result:', error);
    throw error;
  }
}

export async function getUserQuizResults(userId: string) {
  try {
    const results = await db.quizResult.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return { data: results };
  } catch (error) {
    console.error('Error getting quiz results:', error);
    throw error;
  }
}

// Data migration from localStorage (to be used once per user)
export async function migrateUserDataFromLocalStorage(userId: string, localData: {
  savedNotes?: any[];
  flashcardDecks?: any[];
  quizResults?: any[];
}) {
  const results = {
    notes: 0,
    decks: 0,
    quizResults: 0
  };
  
  try {
    // Migrate notes
    if (localData.savedNotes && localData.savedNotes.length > 0) {
      for (const note of localData.savedNotes) {
        await db.note.create({
          data: {
            id: note.id || randomUUID(),
            title: note.title || 'Untitled Note',
            content: note.content || '',
            summary: note.summary || null,
            keyTerms: note.keyTerms || null,
            bullets: note.bullets || null,
            createdAt: note.date ? new Date(note.date) : new Date(),
            user: {
              connect: { id: userId }
            }
          }
        });
        results.notes++;
      }
    }
    
    // Migrate flashcard decks
    if (localData.flashcardDecks && localData.flashcardDecks.length > 0) {
      for (const deck of localData.flashcardDecks) {
        if (deck.cards && deck.cards.length > 0) {
          const deckId = deck.id || randomUUID();
          
          await db.flashcardDeck.create({
            data: {
              id: deckId,
              name: deck.name || 'Untitled Deck',
              createdAt: deck.createdAt ? new Date(deck.createdAt) : new Date(),
              lastStudied: deck.lastStudied ? new Date(deck.lastStudied) : null,
              progress: deck.progress || 0,
              userId: userId,
              flashcards: {
                create: deck.cards.map((card: any) => ({
                  id: randomUUID(),
                  question: card.question || card.front || '',
                  answer: card.answer || card.back || '',
                  mastered: card.mastered || false
                }))
              }
            }
          });
          results.decks++;
        }
      }
    }
    
    // Migrate quiz results
    if (localData.quizResults && localData.quizResults.length > 0) {
      for (const result of localData.quizResults) {
        await db.quizResult.create({
          data: {
            id: randomUUID(),
            createdAt: result.date ? new Date(result.date) : new Date(),
            score: result.score || 0,
            questions: result.questions || 0,
            correct: result.correct || 0,
            userId: userId
          }
        });
        results.quizResults++;
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error migrating data:', error);
    return results;
  }
} 