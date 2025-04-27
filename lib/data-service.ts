/**
 * Data service for handling user data (notes, flashcards, quiz results)
 * This service provides a unified interface for accessing and manipulating user data
 * and handles the migration from localStorage to the database.
 */

import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for real-time updates
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  return createClient(supabaseUrl, supabaseKey, {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
}

// Function to manually trigger a real-time update for notes
// This can be used to force a refresh when automatic detection fails
export function notifyNoteChange() {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  // Create a custom event that our hooks can listen for
  const event = new CustomEvent('notesninja:note-changed', { 
    detail: { timestamp: Date.now() }
  });
  
  // Dispatch the event
  window.dispatchEvent(event);
  console.log('Manual note change notification dispatched');
}

// NOTES

export async function fetchNotes() {
  const response = await fetch('/api/notes');
  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }
  return response.json();
}

export async function fetchNoteById(noteId: string) {
  const response = await fetch(`/api/notes/${noteId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch note');
  }
  return response.json();
}

export async function saveNote(note: {
  title: string;
  content: string;
  summary?: string;
  keyTerms?: string;
  bullets?: string;
}) {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(note),
  });
  
  if (!response.ok) {
    throw new Error('Failed to save note');
  }
  
  // Get the newly created note from the response
  const createdNote = await response.json();
  
  // Wait a short delay to allow database to propagate changes (as a fallback)
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return createdNote;
}

export async function deleteNote(noteId: string) {
  const response = await fetch(`/api/notes/${noteId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete note');
  }
  
  return response.json();
}

// FLASHCARDS

export async function fetchFlashcardDecks() {
  const response = await fetch('/api/flashcards');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error fetching flashcard decks:', errorData);
    throw new Error(errorData.error || 'Failed to fetch flashcard decks');
  }
  
  const data = await response.json();
  return data;
}

export async function createFlashcardDeck(deck: {
  name: string;
  cards: {
    question: string;
    answer: string;
    mastered?: boolean;
  }[];
}) {
  // Validate input - stricter validation
  if (!deck.name) {
    throw new Error('Deck name is required');
  }
  
  if (!deck.cards || !Array.isArray(deck.cards)) {
    throw new Error('Cards array is required');
  }
  
  // Filter out invalid cards
  const validCards = deck.cards.filter(card => card.question && card.answer);
  
  // Make sure there's at least one valid card
  if (validCards.length === 0) {
    throw new Error('At least one valid card with question and answer is required');
  }
  
  // Use only valid cards going forward
  const cardsToCreate = validCards.map(card => ({
    question: card.question,
    answer: card.answer,
    mastered: card.mastered || false
  }));

  const response = await fetch('/api/flashcards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: deck.name,
      cards: cardsToCreate
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error creating flashcard deck:', errorData);
    throw new Error(errorData.error || 'Failed to create flashcard deck');
  }
  
  return response.json();
}

export async function updateDeckProgress(deckId: string, progress: number, lastStudied: Date = new Date()) {
  const response = await fetch(`/api/flashcards/${deckId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      progress,
      lastStudied: lastStudied.toISOString()
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error updating deck progress:', errorData);
    throw new Error(errorData.error || 'Failed to update deck progress');
  }
  
  return response.json();
}

export async function updateCardsMastery(deckId: string, flashcardIds: string[], mastered: boolean) {
  const response = await fetch(`/api/flashcards/${deckId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      flashcardIds,
      mastered
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error updating cards mastery:', errorData);
    throw new Error(errorData.error || 'Failed to update cards mastery');
  }
  
  return response.json();
}

export async function deleteFlashcardDeck(deckId: string) {
  const response = await fetch(`/api/flashcards/${deckId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error deleting flashcard deck:', errorData);
    throw new Error(errorData.error || 'Failed to delete flashcard deck');
  }
  
  return response.json();
}

// QUIZ RESULTS

export async function fetchQuizResults() {
  const response = await fetch('/api/quiz-results');
  if (!response.ok) {
    throw new Error('Failed to fetch quiz results');
  }
  
  const data = await response.json();
  // The API returns { results: [...] } so we need to handle this correctly
  return data;
}

export async function saveQuizResult(result: {
  score: number;
  questions: number;
  correct: number;
}) {
  console.log('Saving quiz result:', result);
  
  // Validate input data
  if (typeof result.score !== 'number' || result.score < 0) {
    throw new Error('Invalid score value');
  }
  
  if (typeof result.questions !== 'number' || result.questions <= 0) {
    throw new Error('Invalid questions count');
  }
  
  if (typeof result.correct !== 'number' || result.correct < 0 || result.correct > result.questions) {
    throw new Error('Invalid correct answers count');
  }
  
  const response = await fetch('/api/quiz-results', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(result),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('API error saving quiz result:', errorData || response.statusText);
    throw new Error(errorData?.error || `Failed to save quiz result: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// DATA MIGRATION

export async function migrateDataFromLocalStorage() {
  // Get data from localStorage
  const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || '[]');
  const flashcardDecks = JSON.parse(localStorage.getItem('flashcardDecks') || '[]');
  const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
  
  // Check if there's any data to migrate
  if (savedNotes.length === 0 && flashcardDecks.length === 0 && quizResults.length === 0) {
    return { success: true, message: 'No data to migrate', migrated: false };
  }
  
  // Send data to migration API
  const response = await fetch('/api/data-migration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      savedNotes,
      flashcardDecks,
      quizResults
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to migrate data');
  }
  
  const result = await response.json();
  
  // Clear localStorage only if migration was successful
  if (result.success) {
    if (result.results.notes > 0) localStorage.removeItem('savedNotes');
    if (result.results.decks > 0) localStorage.removeItem('flashcardDecks');
    if (result.results.quizResults > 0) localStorage.removeItem('quizResults');
    
    // Additional cleaning
    localStorage.removeItem('notesStatistics');
    localStorage.removeItem('notesPendingForFlashcards');
    localStorage.removeItem('notesPendingFileName');
  }
  
  return { ...result, migrated: true };
} 