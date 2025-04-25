"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpenText, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, Trash2, Loader2, Plus, Play, CheckCircle, RefreshCcw, Star, Settings, Edit, Info, BookText, BookPlus } from 'lucide-react';
import { toast } from 'sonner';
import QuizComponent from '@/components/QuizComponent';
import { 
  fetchFlashcardDecks, 
  createFlashcardDeck, 
  updateDeckProgress, 
  updateCardsMastery, 
  deleteFlashcardDeck, 
  saveQuizResult,
  migrateDataFromLocalStorage 
} from '@/lib/data-service';

// Add debug panel import - only imported in development environment
const QuizDebugPanel = process.env.NODE_ENV !== 'production' 
  ? require('@/components/debug/QuizDebugPanel').default 
  : null;

// Define interfaces for type safety
interface Flashcard {
  id?: string;
  question: string;
  answer: string;
  mastered: boolean;
  front?: string; // For backward compatibility
  back?: string;  // For backward compatibility
}

// Interface for sample cards that only have front/back properties
interface SampleCard {
  front: string;
  back: string;
}

// Interface for quiz questions
interface QuizQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct: string;
}

interface FlashcardDeck {
  id: string;
  name: string;
  cards: Flashcard[];
  flashcards?: Flashcard[]; // From database
  progress: number;
  createdAt: string;
  lastStudied: string | null;
}

export default function StudentFlashcards() {
  // Authentication check
  const { isAuthenticated, userRole, user } = useAuth();
  const router = useRouter();
  
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    } else if (userRole !== 'student') {
      router.push(`/${userRole}/dashboard`);
    }
  }, [isAuthenticated, userRole, router]);
  
  // Flashcard state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [markedCorrect, setMarkedCorrect] = useState<number[]>([]);
  const [selectedDeckIndex, setSelectedDeckIndex] = useState(0);
  
  // State for storing decks from database
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataMigrated, setDataMigrated] = useState(false);

  // State for handling notes from upload page
  const [pendingNotes, setPendingNotes] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);
  const [showNotesImport, setShowNotesImport] = useState(false);

  // State for quiz generation
  const [quizContent, setQuizContent] = useState<string | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [selectedQuizText, setSelectedQuizText] = useState<string>('');

  // Function to migrate data from localStorage to database
  const migrateData = async () => {
    try {
      setLoading(true);
      const result = await migrateDataFromLocalStorage();
      
      if (result.migrated) {
        toast.success('Data migrated successfully', {
          description: 'Your data has been moved to the database'
        });
        setDataMigrated(true);
      }
      
      // Load data from database after migration
      loadDecksFromDatabase();
    } catch (error) {
      console.error('Error migrating data:', error);
      toast.error('Failed to migrate data', {
        description: 'Please try again later'
      });
      setLoading(false);
    }
  };

  // Load flashcard decks from database
  const loadDecksFromDatabase = async () => {
    try {
      setLoading(true);
      
      const data = await fetchFlashcardDecks();
      
      // The API might return an array directly or an object with a decks property
      // Handle both formats to ensure compatibility
      const dbDecks = Array.isArray(data) ? data : (data.decks || []);
      
      // Format decks for component use
      const formattedDecks: FlashcardDeck[] = dbDecks.map((deck: any) => ({
        id: deck.id,
        name: deck.name,
        cards: (deck.flashcards || []).map((card: any) => ({
          id: card.id,
          question: card.question,
          answer: card.answer,
          mastered: card.mastered
        })),
        progress: deck.progress || 0,
        createdAt: deck.createdAt || deck.created_at || new Date().toISOString(),
        lastStudied: deck.lastStudied || deck.last_studied || null
      }));
      
      setDecks(formattedDecks);
      
      // If no db decks but decks in localStorage, offer migration
      if (formattedDecks.length === 0) {
        const localDecks = localStorage.getItem('flashcardDecks');
        if (localDecks && JSON.parse(localDecks).length > 0 && !dataMigrated) {
          toast("Local data detected", {
            description: "Would you like to migrate your local data to the database?",
            action: {
              label: "Migrate",
              onClick: () => migrateData()
            },
            duration: 10000,
          });
        }
      }
    } catch (error) {
      console.error('Error loading flashcard decks:', error);
      toast.error('Failed to load flashcard decks');
      
      // Fallback to sample data if no decks are available
      setDecks([{
        id: 'sample-1',
        name: 'Physics Concepts',
        cards: sampleCards.map((card: SampleCard): Flashcard => ({
          question: card.front,
          answer: card.back,
          mastered: false
        })),
        progress: 0,
        createdAt: new Date().toISOString(),
        lastStudied: null
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Load flashcard decks from database
      loadDecksFromDatabase();
      
      // Check for pending notes from upload page
      if (typeof window !== 'undefined') {
        const pendingNotesText = localStorage.getItem('notesPendingForFlashcards');
        const pendingNotesFileName = localStorage.getItem('notesPendingFileName');
        
        if (pendingNotesText) {
          setPendingNotes(pendingNotesText);
          setPendingFileName(pendingNotesFileName);
          setShowNotesImport(true);
          // Optional: Set the quiz text from pending notes 
          setSelectedQuizText(pendingNotesText);
        }
      }
    }
  }, [isAuthenticated, user?.id]);

  // Get the current deck and its cards
  const currentDeck = decks[selectedDeckIndex] || { 
    id: '', 
    name: 'No Deck', 
    cards: [], 
    progress: 0, 
    createdAt: '', 
    lastStudied: null 
  } as FlashcardDeck;
  
  const flashcards = currentDeck.cards || [];

  // Sample data to use as fallback
  const sampleCards: SampleCard[] = [
    { 
      front: "What is the law of conservation of energy?", 
      back: "Energy cannot be created or destroyed, only transformed from one form to another."
    },
    { 
      front: "Define Newton's First Law of Motion", 
      back: "An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force."
    },
    { 
      front: "What is the formula for calculating kinetic energy?", 
      back: "KE = 1/2 × m × v² where m is mass and v is velocity."
    },
    { 
      front: "Explain the concept of cellular respiration", 
      back: "The process by which cells convert nutrients into ATP (energy) through a series of chemical reactions, typically using oxygen."
    },
    { 
      front: "What does DNA stand for?", 
      back: "Deoxyribonucleic Acid"
    },
  ];

  // Sample quiz questions
  const quizQuestions = [
    {
      question: "Which of the following is NOT a type of chemical bond?",
      options: ["Ionic bond", "Covalent bond", "Magnetic bond", "Hydrogen bond"],
      correctAnswer: 2,
    },
    {
      question: "What is the primary function of mitochondria in a cell?",
      options: ["Protein synthesis", "Energy production", "Cell division", "Waste removal"],
      correctAnswer: 1,
    },
    {
      question: "Which planet has the most moons in our solar system?",
      options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
      correctAnswer: 1,
    },
  ];

  // Save progress to database
  const saveProgress = async () => {
    if (decks.length === 0 || !currentDeck.id) return;
    
    try {
      // Calculate progress percentage
      const progress = Math.round((markedCorrect.length / flashcards.length) * 100);
      
      // Update the local state first for immediate feedback
      const updatedDecks = [...decks];
      updatedDecks[selectedDeckIndex] = {
        ...currentDeck,
        progress: progress,
        lastStudied: new Date().toISOString(),
        cards: currentDeck.cards.map((card: Flashcard, index: number) => ({
          ...card,
          mastered: markedCorrect.includes(index)
        }))
      };
      
      setDecks(updatedDecks);
      toast.success('Progress saved');
      
      try {
        // Update deck progress in database
        await updateDeckProgress(currentDeck.id, progress, new Date());
        
        // Update cards mastery
        const masteredCardIds = markedCorrect
          .map(index => flashcards[index]?.id)
          .filter(id => id) as string[];
        
        if (masteredCardIds.length > 0) {
          await updateCardsMastery(currentDeck.id, masteredCardIds, true);
        }
      } catch (dbError) {
        console.error('Error saving progress to database:', dbError);
        // We don't show an error toast because the local state is already updated
        // Instead, we silently log the error and continue
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Error saving progress, but your changes were saved locally');
    }
  };

  // Handle deck change
  const changeDeck = async (index: number) => {
    // Save current progress before changing
    await saveProgress();
    
    // Reset state for the new deck
    setSelectedDeckIndex(index);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setMarkedCorrect([]);
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex + 1);
      }, 300);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex - 1);
      }, 300);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const resetDeck = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex(0);
      setMarkedCorrect([]);
    }, 300);
  };

  const markCorrect = async () => {
    if (!markedCorrect.includes(currentCardIndex)) {
      const newMarkedCorrect = [...markedCorrect, currentCardIndex];
      setMarkedCorrect(newMarkedCorrect);
      
      // Update progress and card mastery in database
      try {
        if (currentDeck.id && flashcards[currentCardIndex]?.id) {
          const cardId = flashcards[currentCardIndex].id as string;
          
          // Update card mastery
          await updateCardsMastery(currentDeck.id, [cardId], true);
          
          // Update progress
          const progress = Math.round((newMarkedCorrect.length / flashcards.length) * 100);
          await updateDeckProgress(currentDeck.id, progress, new Date());
          
          // Update local state
          const updatedDecks = [...decks];
          if (updatedDecks[selectedDeckIndex]) {
            updatedDecks[selectedDeckIndex].progress = progress;
            
            // Update specific card
            const cardIndex = updatedDecks[selectedDeckIndex].cards.findIndex(
              card => card.id === cardId
            );
            
            if (cardIndex !== -1) {
              updatedDecks[selectedDeckIndex].cards[cardIndex].mastered = true;
            }
            
            setDecks(updatedDecks);
          }
        }
      } catch (error) {
        console.error('Error updating card mastery:', error);
        // Continue even if API fails
      }
    }
    nextCard();
  };

  // Function to generate a quiz from selected text
  const generateQuiz = async () => {
    if (!selectedQuizText) {
      toast.error('Please enter some text to generate a quiz from');
      return;
    }
    
    setIsGeneratingQuiz(true);
    
    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedQuizText, type: 'quiz' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }
      
      const data = await response.json();
      setQuizContent(data.content);
    } catch (error) {
      toast.error('Failed to generate quiz', {
        description: 'Please try again later'
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Function to handle quiz submission
  const submitQuiz = async (score: number, totalQuestions: number) => {
    try {
      if (totalQuestions <= 0) {
        toast.error('Could not save quiz result: Invalid quiz data');
        return;
      }
      
      // Calculate percentage
      const percentage = Math.round((score / totalQuestions) * 100);
      
      // Save quiz result to database
      await saveQuizResult({
        score: percentage,
        questions: totalQuestions,
        correct: score
      });
      
      // Show success message
      toast.success(`Quiz completed with score: ${percentage}%`);
    } catch (error) {
      toast.error('Failed to save quiz result', { 
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Function to generate flashcards from pending notes
  const generateFlashcardsFromNotes = async () => {
    if (!pendingNotes) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pendingNotes, type: 'flashcards' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate flashcards');
      }
      
      const data = await response.json();
      const flashcardsContent = data.content;
      
      // Parse flashcards from content
      const flashcardPattern = /Q:\s*(.*?)\s*\n\s*A:\s*(.*?)(?=\n\s*Q:|$)/gs;
      const flashcards: Flashcard[] = [];
      let match;
      
      while ((match = flashcardPattern.exec(flashcardsContent)) !== null) {
        if (match[1] && match[2]) {
          flashcards.push({
            question: match[1].trim(),
            answer: match[2].trim(),
            mastered: false
          });
        }
      }
      
      // If no flashcards were found with the primary pattern, try alternative formats
      if (flashcards.length === 0) {
        // Try various alternative patterns
        
        // Pattern for "Question: X Answer: Y" format
        const questionAnswerPattern = /Question:\s*(.*?)\s*(?:\r?\n|\r)Answer:\s*(.*?)(?=(?:\r?\n|\r)Question:|\s*$)/gs;
        while ((match = questionAnswerPattern.exec(flashcardsContent)) !== null) {
          if (match[1] && match[2]) {
            flashcards.push({
              question: match[1].trim(),
              answer: match[2].trim(),
              mastered: false
            });
          }
        }
        
        // If still no matches, try lines that end with a question mark
        if (flashcards.length === 0) {
          const lines = flashcardsContent.split(/\n/).map(line => line.trim()).filter(Boolean);
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].endsWith('?') && i + 1 < lines.length) {
              // Add non-empty question-answer pairs
              if (lines[i] && lines[i+1]) {
                flashcards.push({
                  question: lines[i].trim(),
                  answer: lines[i+1].trim(),
                  mastered: false
                });
              }
              i++; // Skip the next line as we used it for the answer
            }
          }
        }
        
        // If still no matches, try to parse line by line, alternating question and answer
        if (flashcards.length === 0) {
          const lines = flashcardsContent.split(/\n/).map(line => line.trim()).filter(Boolean);
          for (let i = 0; i < lines.length; i += 2) {
            if (i + 1 < lines.length) {
              // Skip lines that are too short or likely to be headers
              if (lines[i].length > 5 && lines[i+1].length > 5 && 
                  !lines[i].toLowerCase().includes('question') && 
                  !lines[i].toLowerCase().includes('answer')) {
                flashcards.push({
                  question: lines[i].trim(),
                  answer: lines[i+1].trim(),
                  mastered: false
                });
              }
            }
          }
        }
      }
      
      // Create a new deck with the parsed flashcards
      if (flashcards.length > 0) {
        // Generate deck name from pending file name
        const deckName = pendingFileName || `Deck ${new Date().toLocaleString()}`;
        
        // Create deck in database
        const newDeck = await createFlashcardDeck({
          name: deckName,
          cards: flashcards
        });
        
        // Add deck to local state
        const formattedDeck = {
          id: newDeck.id,
          name: newDeck.name,
          cards: newDeck.flashcards.map((card: any) => ({
            id: card.id,
            question: card.question,
            answer: card.answer,
            mastered: card.mastered
          })),
          progress: 0,
          createdAt: newDeck.createdAt,
          lastStudied: null
        };
        
        setDecks([...decks, formattedDeck]);
        
        // Clear the pending notes
        localStorage.removeItem('notesPendingForFlashcards');
        localStorage.removeItem('notesPendingFileName');
        setPendingNotes(null);
        setPendingFileName(null);
        setShowNotesImport(false);
        
        // Select the new deck
        setSelectedDeckIndex(decks.length);
        
        toast.success('Flashcards created successfully!');
      } else {
        toast.error('Could not extract flashcards from the notes');
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast.error('Failed to generate flashcards');
    } finally {
      setLoading(false);
    }
  };

  // Function to reset note import dialog
  const cancelImportNotes = () => {
    localStorage.removeItem('notesPendingForFlashcards');
    localStorage.removeItem('notesPendingFileName');
    setPendingNotes(null);
    setPendingFileName(null);
    setShowNotesImport(false);
    setSelectedQuizText(''); // Also reset the quiz text
  };

  // Function to delete a deck
  const deleteDeck = async (index: number) => {
    if (!decks[index]) return;
    
    // Create confirmation dialog
    toast(
      <div className="flex flex-col gap-2">
        <div className="font-medium">Delete deck "{decks[index]?.name}"?</div>
        <div className="text-sm text-muted-foreground">This action cannot be undone.</div>
      </div>,
      {
        duration: 5000,
        action: {
          label: "Delete",
          onClick: async () => {
            try {
              const deckId = decks[index].id;
              
              // Delete the deck from database
              await deleteFlashcardDeck(deckId);
              
              // Remove the deck from state
              const newDecks = [...decks];
              newDecks.splice(index, 1);
              setDecks(newDecks);
              
              // If the deleted deck was selected, select another deck
              if (selectedDeckIndex === index) {
                setSelectedDeckIndex(newDecks.length > 0 ? 0 : 0);
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setMarkedCorrect([]);
              } else if (selectedDeckIndex > index) {
                // If we deleted a deck before the currently selected one, adjust the index
                setSelectedDeckIndex(selectedDeckIndex - 1);
              }
              
              toast.success("Deck deleted successfully");
            } catch (error) {
              toast.error("Failed to delete deck");
              console.error(error);
            }
          }
        },
        cancel: {
          label: "Cancel",
          onClick: () => {}
        },
        position: "top-center",
        icon: <Trash2 className="h-4 w-4 text-destructive" />,
      }
    );
  };

  // Add a helper function to render key terms properly
  const renderKeyTerms = (content: string) => {
    if (!content) return null;
    
    try {
      // Pattern to extract Term and Definition pairs
      const termPattern = /Term:\s*(.*?)\s*\n\s*Definition:\s*(.*?)(?=\n\s*Term:|$)/gs;
      let match;
      const terms: { term: string; definition: string }[] = [];
      
      // Extract all terms and definitions
      while ((match = termPattern.exec(content)) !== null) {
        const term = match[1]?.trim();
        const definition = match[2]?.trim();
        
        if (term && definition) {
          terms.push({ term, definition });
        }
      }
      
      // If no terms were found with the primary pattern, try to parse differently
      if (terms.length === 0) {
        // Check if content has bullet points or numbered lists
        const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // If line looks like a term (ends with a colon, is short, etc.)
          if ((line.endsWith(':') || line.length < 50) && i + 1 < lines.length) {
            terms.push({
              term: line.replace(/^[•\-\d.]+\s*/, '').replace(/:$/, ''),
              definition: lines[i + 1].replace(/^[•\-\d.]+\s*/, '')
            });
            i++; // Skip the next line as we used it for the definition
          }
        }
      }
      
      // If we found terms, render them
      if (terms.length > 0) {
        return (
          <div className="space-y-4">
            {terms.map((item, i) => (
              <div key={i} className="border rounded-lg p-4 bg-card">
                <p className="font-semibold text-primary">{item.term}</p>
                <p className="mt-1 text-muted-foreground">{item.definition}</p>
              </div>
            ))}
          </div>
        );
      }
      
      // Fallback to displaying content as is
      return (
        <div className="prose prose-sm">
          {content.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      );
    } catch (error) {
      console.error('Error rendering key terms:', error);
      // Fallback in case of errors
      return (
        <div className="prose prose-sm">
          {content.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      );
    }
  };

  // Don't render until authenticated
  if (!isAuthenticated || userRole !== 'student') {
    return null;
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <PageHeader 
        title="Flashcards & Quizzes" 
        description="Review your notes with interactive flashcards and test your knowledge with quizzes."
        className="px-2 sm:px-0"
      />
      
      <Tabs defaultValue="flashcards" className="w-full">
        <TabsList className="mb-4 sm:mb-6 w-full justify-start overflow-auto">
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>
        
        {showNotesImport && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-medium">Import Notes</h3>
                  <p className="text-sm text-muted-foreground">
                    Create flashcards from your uploaded notes: {pendingFileName || 'Untitled Notes'}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" onClick={cancelImportNotes} className="flex-1 sm:flex-auto">
                    Cancel
                  </Button>
                  <Button onClick={generateFlashcardsFromNotes} className="flex-1 sm:flex-auto">
                    Generate Flashcards
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <TabsContent value="flashcards" className="mt-0">
          {loading ? (
            <div className="flex items-center justify-center h-60">
              <div className="animate-spin mr-2 h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              <p>Loading flashcards...</p>
            </div>
          ) : decks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-center space-y-4">
              <p>You don't have any flashcard decks yet.</p>
              <Button onClick={() => router.push('/student/upload')}>
                Create Flashcards
              </Button>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            <motion.div 
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base sm:text-lg font-medium flex items-center">
                      <BookOpenText className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        {currentDeck.name}
                    </h3>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Card {currentCardIndex + 1} of {flashcards.length}
                    </div>
                  </div>
                  
                    {flashcards.length > 0 ? (
                  <div className="relative h-[200px] sm:h-[300px] w-full perspective-1000">
                    <AnimatePresence initial={false} mode="wait">
                      <motion.div
                        key={`card-${currentCardIndex}-${isFlipped ? 'back' : 'front'}`}
                        initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 w-full h-full"
                      >
                        <div 
                          onClick={flipCard}
                          className={`cursor-pointer w-full h-full border rounded-xl flex items-center justify-center p-4 sm:p-8 text-center bg-card transition-shadow hover:shadow-md ${markedCorrect.includes(currentCardIndex) ? 'border-green-500 border-2' : ''}`}
                        >
                          <div>
                            {!isFlipped ? (
                                  <div className="text-base sm:text-xl font-medium overflow-auto max-h-[160px] sm:max-h-[240px]">
                                    {flashcards[currentCardIndex]?.question || flashcards[currentCardIndex]?.front}
                                  </div>
                            ) : (
                                  <div className="text-base sm:text-xl overflow-auto max-h-[160px] sm:max-h-[240px]">
                                    {flashcards[currentCardIndex]?.answer || flashcards[currentCardIndex]?.back}
                                  </div>
                            )}
                            <div className="mt-2 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
                              {isFlipped ? "Click to see question" : "Click to see answer"}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                    ) : (
                      <div className="h-[200px] sm:h-[300px] w-full flex items-center justify-center">
                        <p className="text-muted-foreground">No flashcards available</p>
                      </div>
                    )}
                  
                    {flashcards.length > 0 && (
                  <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={prevCard}
                      disabled={currentCardIndex === 0}
                      className="w-full sm:w-auto"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    
                    <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetDeck}
                        className="flex-1 sm:flex-none"
                      >
                        <RotateCcw className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Reset</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={markCorrect}
                        className="flex-1 sm:flex-none text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircle2 className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Correct</span>
                      </Button>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={nextCard}
                      disabled={currentCardIndex === flashcards.length - 1}
                      className="w-full sm:w-auto"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                    )}
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Study Progress</h3>
                  
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-xs sm:text-sm font-medium">Current Deck</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {markedCorrect.length} of {flashcards.length} cards
                        </div>
                      </div>
                      <Progress value={(markedCorrect.length / flashcards.length) * 100} className="h-2" />
                    </div>
                    
                      {decks.length > 1 && (
                    <div className="pt-2 sm:pt-4">
                          <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Your Flashcard Decks</h4>
                      <div className="space-y-2 sm:space-y-3">
                            {decks.map((deck, i) => (
                              <div 
                                key={deck.id} 
                                className={`space-y-1 cursor-pointer p-2 rounded-md transition-colors ${selectedDeckIndex === i ? 'bg-muted' : 'hover:bg-muted/50'}`}
                              >
                                <div className="flex justify-between items-center">
                                  <div 
                                    className="flex-1"
                                    onClick={() => changeDeck(i)}
                                  >
                            <div className="flex justify-between text-xs sm:text-sm">
                                      <span className={selectedDeckIndex === i ? 'font-medium' : ''}>{deck.name}</span>
                                      <span className="text-muted-foreground">{deck.progress || 0}%</span>
                                    </div>
                                    <Progress value={deck.progress || 0} className="h-1 sm:h-1.5 mt-1" />
                                    {deck.lastStudied && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Last studied: {new Date(deck.lastStudied).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteDeck(i);
                                    }}
                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors ml-2"
                                    title="Delete deck"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                      )}
                    
                    <div className="pt-2 sm:pt-4">
                        <Button 
                          onClick={() => {
                            saveProgress();
                            router.push('/student/upload');
                          }}
                          className="w-full"
                        >
                          Create New Flashcards
                          </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          )}
        </TabsContent>
        
        <TabsContent value="quizzes" className="mt-0">
              <Card>
                <CardContent className="p-3 sm:p-6">
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-medium">Generate Quiz</h3>
                {pendingNotes && !quizContent && (
                  <div className="bg-primary/10 p-4 rounded-md mb-4">
                    <p className="text-sm mb-2">
                      You have notes ready to be converted into a quiz from: <strong>{pendingFileName}</strong>
                    </p>
                    <Button onClick={() => generateQuiz()}>
                      Generate Quiz from Notes
                    </Button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Enter a text to generate a quiz from or paste content from your notes.
                </p>
            
                <textarea
                  className="w-full min-h-[200px] p-3 border rounded-md"
                  placeholder="Paste your text here..."
                  value={selectedQuizText}
                  onChange={(e) => setSelectedQuizText(e.target.value)}
                ></textarea>
                  
                <Button 
                  onClick={generateQuiz} 
                  disabled={isGeneratingQuiz || !selectedQuizText}
                  className="w-full sm:w-auto"
                >
                  {isGeneratingQuiz ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      Generating...
                    </>
                  ) : "Generate Quiz"}
                </Button>
                    </div>
                    
              {quizContent && (
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-base sm:text-lg font-medium mb-4">Your Quiz</h3>
                  <QuizComponent 
                    content={quizContent} 
                    onComplete={(score, total) => {
                      submitQuiz(score, total);
                    }}
                  />
                </div>
              )}
                </CardContent>
              </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
