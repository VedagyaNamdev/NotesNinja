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
  attachmentId?: string;
}) {
  console.log(`saveNote - Starting note save for user ${userId}: ${note.title}`);
  
  try {
    // Check if the attachment_id column exists in the database
    try {
      // Try to create the note in the database using the standard method
      const noteData: any = {
        title: note.title,
        content: note.content,
        summary: note.summary || null,
        keyTerms: note.keyTerms || null,
        bullets: note.bullets || null,
        user: {
          connect: { id: userId }
        }
      };
      
      // Add attachment reference if provided
      if (note.attachmentId) {
        console.log(`saveNote - Note has attachment: ${note.attachmentId}`);
        noteData.attachment = {
          connect: { id: note.attachmentId }
        };
      }
      
      console.log('saveNote - Attempting database operation with data:', JSON.stringify(noteData, null, 2));
      console.log('saveNote - Using database URL:', process.env.DATABASE_URL?.substring(0, 20) + '...');
      
      const createdNote = await db.note.create({
        data: noteData,
        include: {
          attachment: true
        }
      });
      
      console.log(`saveNote - Note created successfully in database with ID: ${createdNote.id}`);
      return createdNote;
    } catch (prismaError: any) {
      // If there's a schema issue (likely with attachment_id), fall back to direct SQL
      if (prismaError.code === 'P2022' && prismaError.message?.includes('attachment_id')) {
        console.log('saveNote - Detected attachment_id schema issue, trying direct SQL approach...');
        
        // Generate a UUID for the note
        const noteId = randomUUID();
        
        // Insert the note using raw SQL without the attachment_id
        await db.$executeRaw`
          INSERT INTO "public"."notes" (
            "id", "title", "content", "summary", "key_terms", "bullets", 
            "created_at", "updated_at", "user_id"
          )
          VALUES (
            ${noteId}, 
            ${note.title}, 
            ${note.content}, 
            ${note.summary || null}, 
            ${note.keyTerms || null}, 
            ${note.bullets || null}, 
            NOW(), 
            NOW(), 
            ${userId}
          )
        `;
        
        console.log(`saveNote - Note created with direct SQL, ID: ${noteId}`);
        
        // Return a constructed note object
        const createdNote = {
          id: noteId,
          title: note.title,
          content: note.content,
          summary: note.summary || null,
          keyTerms: note.keyTerms || null,
          bullets: note.bullets || null,
          userId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Don't include attachmentId even if provided since it's not in the database
          _warning: 'Note saved without attachment due to database schema limitations'
        };
    
    return createdNote;
      } else {
        // For other Prisma errors, rethrow to be handled by the outer catch block
        throw prismaError;
      }
    }
  } catch (error: any) {
    console.error('saveNote - Database error:', error);
    console.error('saveNote - Error stack:', error.stack);
    
    // Check if this is a connection issue or a Prisma Client error
    const errorMessage = error.message || 'Unknown database error';
    const isPrismaError = errorMessage.includes('PrismaClient');
    
    console.warn(`saveNote - ${isPrismaError ? 'Prisma error' : 'Database connection error'}: ${errorMessage}`);
    
    // Fallback to session-only note
    const sessionOnlyNote = {
      id: randomUUID(),
      title: note.title,
      content: note.content,
      summary: note.summary || null,
      keyTerms: note.keyTerms || null,
      bullets: note.bullets || null,
      userId,
      attachmentId: note.attachmentId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      [SESSION_ONLY_FLAG]: true,
      _errorType: isPrismaError ? 'prisma_error' : 'db_connection',
      _errorMessage: errorMessage
    };
    
    console.log(`saveNote - Returning session-only note with ID: ${sessionOnlyNote.id}`);
    return sessionOnlyNote;
  }
}

export async function getUserNotes(userId: string) {
  console.log(`getUserNotes - Fetching notes for user ${userId}`);
  
  try {
    console.log('getUserNotes - Attempting database query...');
    
  try {
    const notes = await db.note.findMany({
      where: {
        userId: userId
      },
        include: {
          attachment: {
            select: {
              id: true,
              filename: true,
              fileType: true,
              fileSize: true,
              createdAt: true
            }
          }
        },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
      console.log(`getUserNotes - Successfully retrieved ${notes.length} notes for user ${userId}`);
      
      // Return all notes with their attachments
    return { data: notes };
    } catch (prismaError: any) {
      // Check if the error is related to the attachment_id column
      if (prismaError.code === 'P2022' && prismaError.message?.includes('attachment_id')) {
        console.log('getUserNotes - Detected attachment_id schema issue, using direct SQL approach...');
        
        // Use raw query to get notes without including attachment
        const rawNotes = await db.$queryRaw`
          SELECT id, title, content, summary, key_terms as "keyTerms", bullets, 
                 created_at as "createdAt", updated_at as "updatedAt", user_id as "userId"
          FROM notes 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `;
        
        console.log(`getUserNotes - Retrieved ${rawNotes.length} notes using raw SQL for user ${userId}`);
        
        // Return the notes with empty attachments and a warning, but NOT session-only
        return { 
          data: rawNotes.map((note: any) => ({
            ...note,
            attachment: null
          })),
          _warning: 'Notes retrieved from database, but attachment features are limited due to schema configuration.'
        };
      } else {
        // For other Prisma errors, rethrow to be handled by the outer catch block
        throw prismaError;
      }
    }
  } catch (error: any) {
    console.error('getUserNotes - Database error:', error);
    console.error('getUserNotes - Error stack:', error.stack);
    
    // Check if this is a connection issue
    const errorMessage = error.message || 'Unknown database error';
    const isPrismaError = errorMessage.includes('PrismaClient');
    
    console.warn(`getUserNotes - ${isPrismaError ? 'Prisma error' : 'Database connection error'}: ${errorMessage}`);
    
    // Return an empty result with error info, but ensure it's in a format the UI expects
    return { 
      data: [], 
      error: errorMessage, 
      [SESSION_ONLY_FLAG]: true,
      _errorType: isPrismaError ? 'prisma_error' : 'db_connection',
      _errorMessage: errorMessage
    };
  }
}

export async function deleteNote(noteId: string, userId: string) {
  try {
    console.log(`deleteNote - Attempting to delete note ${noteId} for user ${userId}`);
    
    try {
      // Find the note to check if it has an attachment
      const note = await db.note.findUnique({
        where: {
          id: noteId,
          userId: userId
        },
        include: {
          attachment: true
        }
      });
      
      if (note) {
        console.log(`deleteNote - Found note to delete: ${note.title}`);
        
        // If note has an attachment, delete the attachment too
        if (note.attachmentId) {
          try {
            await db.attachment.delete({
              where: {
                id: note.attachmentId
              }
            });
            console.log(`deleteNote - Deleted associated attachment: ${note.attachmentId}`);
          } catch (attachmentError) {
            console.error(`deleteNote - Failed to delete attachment: ${note.attachmentId}`, attachmentError);
            // Continue with note deletion even if attachment deletion fails
          }
        }
      } else {
        console.log(`deleteNote - Note not found: ${noteId}`);
      }
      
      // Now delete the note
    const result = await db.note.deleteMany({
      where: {
        id: noteId,
        userId: userId
      }
    });
    
      console.log(`deleteNote - Deletion result: ${result.count} note(s) deleted`);
    return { data: result, count: result.count };
    } catch (prismaError: any) {
      // Check if the error is related to the attachment_id column
      if (prismaError.code === 'P2022' && prismaError.message?.includes('attachment_id')) {
        console.log('deleteNote - Detected attachment_id schema issue, using direct SQL approach...');
        
        // Use raw query to delete the note without worrying about attachment
        const result = await db.$executeRaw`
          DELETE FROM notes WHERE id = ${noteId} AND user_id = ${userId}
        `;
        
        console.log(`deleteNote - Deleted note using raw SQL, rows affected: ${result}`);
        return { data: { count: result }, count: result };
      } else {
        // For other Prisma errors, rethrow to be handled by the outer catch block
        throw prismaError;
      }
    }
  } catch (error) {
    console.error('Exception in deleteNote:', error);
    return { data: null, error, [SESSION_ONLY_FLAG]: true };
  }
}

// ATTACHMENTS
export async function saveAttachment(userId: string, attachment: {
  filename: string;
  fileType: string;
  fileSize: number;
  data: Buffer;
}) {
  try {
    console.log(`Attempting to save attachment to database: ${attachment.filename} (${attachment.fileSize} bytes)`);
    
    // Try to create the attachment in the database
    const createdAttachment = await db.attachment.create({
      data: {
        filename: attachment.filename,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        data: attachment.data,
        user: {
          connect: { id: userId }
        }
      },
      select: {
        id: true,
        filename: true,
        fileType: true,
        fileSize: true,
        createdAt: true,
        userId: true
      }
    });
    
    console.log(`Attachment saved to database successfully, ID: ${createdAttachment.id}`);
    return createdAttachment;
  } catch (error) {
    console.error('Exception in saveAttachment:', error);
    
    // Create a fallback attachment object if database fails
    const fallbackId = randomUUID();
    console.log(`Database save failed. Creating session-only attachment with ID: ${fallbackId}`);
    
    // Return a "session-only" attachment that at least has an ID and basic info
    const sessionOnlyAttachment = {
      id: fallbackId,
      filename: attachment.filename,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      createdAt: new Date(),
      userId: userId,
      _sessionOnly: true,
      _errorMessage: error.message || 'Unknown database error'
    };
    
    return sessionOnlyAttachment;
  }
}

export async function getAttachment(attachmentId: string, userId: string) {
  try {
    console.log(`Fetching attachment from database: ${attachmentId} for user ${userId}`);
    
    const attachment = await db.attachment.findFirst({
      where: {
        id: attachmentId,
        userId: userId
      }
    });
    
    if (attachment) {
      console.log(`Found attachment in database: ${attachment.filename}`);
    } else {
      console.log(`No attachment found with ID: ${attachmentId}`);
    }
    
    return attachment;
  } catch (error) {
    console.error('Exception in getAttachment:', error);
    
    // Instead of throwing, return a minimal error object that indicates the issue
    return {
      id: attachmentId,
      _sessionOnly: true,
      _error: true,
      _errorType: 'database',
      _errorMessage: error.message || 'Error retrieving attachment from database',
      userId: userId,
      filename: 'unknown-attachment.file',
      fileType: 'application/octet-stream',
      fileSize: 0,
      createdAt: new Date(),
      data: null
    };
  }
}

export async function deleteAttachment(attachmentId: string, userId: string) {
  try {
    // First check if this attachment is referenced by any notes
    const notes = await db.note.findMany({
      where: {
        attachmentId: attachmentId
      }
    });
    
    // Update notes to remove reference to this attachment
    if (notes.length > 0) {
      await db.note.updateMany({
        where: {
          attachmentId: attachmentId
        },
        data: {
          attachmentId: null
        }
      });
    }
    
    // Now delete the attachment
    const result = await db.attachment.deleteMany({
      where: {
        id: attachmentId,
        userId: userId
      }
    });
    
    return result.count > 0;
  } catch (error) {
    console.error('Exception in deleteAttachment:', error);
    throw error;
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